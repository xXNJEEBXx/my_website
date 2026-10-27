(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  let host, root, panel, planView, status, logs, buttonsView, issuesView, progress;
  let running = false;
  const controls = [];
  const label = {
    OPTION_NOT_FOUND: 'لم أجد خيارًا مطابقًا', AMBIGUOUS_OPTION: 'أكثر من خيار محتمل؛ يحتاج مراجعة',
    PROFILE_DATE_NEEDS_REVIEW: 'تاريخ بداية التدريب قديم ويحتاج تحديثًا', PROFILE_VALUE_MISSING: 'القيمة غير موجودة في الملف الشخصي',
    NO_APPROVED_RULE: 'حقل يحتاج إجابة أو قاعدة معتمدة', REQUIRED_ATTACHMENT_MISSING: 'مرفق مطلوب غير موجود'
  };
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function button(text, callback, className = '') {
    const el = node('button', text, className); el.type = 'button';
    el.addEventListener('click', async event => {
      if (!event.isTrusted) return;
      try { await callback(event); } catch (error) { UI.log(error.message, 'failed'); }
    });
    return el;
  }
  function summary(text, target, open = false) {
    const details = node('details'); details.open = open;
    details.append(node('summary', text), target);
    return details;
  }
  const UI = APP.UI = {
    isLocked: true,
    init() {
      if (host || window !== window.top || !document.body) return;
      host = node('div'); host.id = 'cv-agent-host'; host.dataset.cvUi = 'true';
      root = host.attachShadow({ mode: 'closed' });
      const sheet = new CSSStyleSheet(); sheet.replaceSync(APP.UI_CSS || ''); root.adoptedStyleSheets = [sheet];
      panel = node('section', undefined, 'panel'); panel.setAttribute('aria-label', 'CV AutoFill');
      const header = node('div', undefined, 'header');
      header.append(node('span', 'CV AutoFill', 'brand'), node('span', APP.version, 'version'), button('−', () => panel.classList.toggle('collapsed'), 'icon'));
      const body = node('div', undefined, 'body');
      body.append(node('p', 'راجع الخطة ثم شغّل التعبئة. الحقول غير المعروفة تبقى للمراجعة.', 'hint'));
      const toolbar = node('div', undefined, 'toolbar');
      const play = button('▶ تعبئة', async () => { APP.session.activate(); await APP.Agent.fill({ useCurrentPlan: true }); }, 'primary');
      const next = button('⏭ التالي', async () => { APP.session.activate(); await APP.Agent.play(0, true); });
      const scan = button('↻ فحص', () => APP.Agent.plan());
      const stop = button('■ إيقاف', () => APP.Agent.cancel(), 'danger');
      controls.push(play, next, scan); toolbar.append(play, next, scan, stop);
      status = node('div', 'جاهز للفحص', 'status'); status.setAttribute('role', 'status');
      progress = node('progress'); progress.max = 1; progress.value = 0;
      planView = node('div'); issuesView = node('div'); buttonsView = node('div', undefined, 'buttons'); logs = node('div', undefined, 'log');
      body.append(toolbar, status, progress, issuesView, summary('الخطة والإجابات المقترحة', planView, true), summary('أزرار الصفحة', buttonsView), summary('سجل التنفيذ', logs));
      const tools = node('div', undefined, 'toolbar');
      tools.append(button('اعتماد القيم اليدوية', async () => {
        let count = 0;
        for (const field of APP.lastPlan?.unmapped || []) {
          const el = APP.DOM.controls().find(item => APP.DOM.key(item) === field.id);
          if (el && (await APP.Learning.approve(el)).status === 'verified') count++;
        }
        UI.log(`تم اعتماد ${count} قاعدة لهذه الاستمارة`, 'info'); APP.Agent.plan();
      }), button('مسح قواعد الموقع', async () => { await APP.Learning.clear(); APP.Agent.plan(); }), button('إعدادات الملف', () => globalThis.chrome?.runtime?.sendMessage({ action: 'open_options' })));
      body.append(summary('القواعد والملف الشخصي', tools));
      body.append(node('div', 'الإرسال النهائي يتطلب مراجعة مستقلة. لا تُرسل هذه الأداة طلبًا أثناء التعبئة.', 'footer'));
      panel.append(header, body); root.append(panel); document.documentElement.append(host);
      APP.events.on('plan', plan => UI.renderPlan(plan));
      APP.events.on('state', state => { running = state.running; controls.forEach(control => { control.disabled = running; }); });
      APP.events.on('progress', event => UI.updateProgress(event.current, event.total));
      APP.events.on('action', action => { if (action.status !== 'running') UI.log(`${action.label}: ${action.code || action.status}`, action.status); });
      APP.events.on('result', result => UI.showResult(result));
    },
    renderPlan(plan) {
      this.init(); if (!root) return;
      planView.replaceChildren(); issuesView.replaceChildren();
      for (const issue of plan.issues) issuesView.append(node('div', label[issue.code] || `${issue.fieldKey || 'حقل'}: ${issue.code}`, 'issue'));
      if (plan.unmapped.length) issuesView.append(node('div', `${plan.unmapped.length} حقل غير معروف أو يحتاج مراجعة`, 'issue'));
      for (const action of plan.actions) {
        const row = node('div', undefined, 'row');
        const enabled = node('input'); enabled.type = 'checkbox'; enabled.checked = true; enabled.setAttribute('aria-label', 'تضمين ' + action.label);
        enabled.addEventListener('change', event => { if (event.isTrusted && !running) action.enabled = enabled.checked; });
        const detail = node('div'); detail.append(node('span', action.label, 'label'), node('div', `${action.source} • ${action.fieldKey}`, 'source'));
        if (['text', 'select', 'combo'].includes(action.type)) {
          const input = node('input', undefined, 'value'); input.type = action.fieldKey === 'nationalId' ? 'password' : 'text'; input.value = action.value; input.setAttribute('aria-label', 'الإجابة المقترحة');
          input.addEventListener('change', event => { if (event.isTrusted && !running) { action.value = input.value; action.source = 'user-override'; } });
          detail.append(input);
        }
        row.append(enabled, detail); planView.append(row);
      }
      status.className = 'status'; status.textContent = `${plan.platform}: ${plan.actions.length} إجراء مقترح`;
      this.updateProgress(0, plan.actions.length); this.renderButtons(APP.Agent.getButtons());
    },
    renderButtons(buttons) {
      if (!buttonsView) return; buttonsView.replaceChildren();
      for (const item of buttons) {
        const control = button(item.text, async () => {
          APP.session.activate();
          const result = await APP.Agent.clickButton(item.buttonId, { confirmSubmit: item.type === 'submit' });
          if (result?.issues) result.issues.forEach(issue => this.log(label[issue.code] || issue.code, 'blocked'));
        }, item.type);
        control.disabled = item.disabled; buttonsView.append(control);
      }
    },
    log(message, type = 'info') {
      if (!logs) return;
      logs.append(node('div', message, type));
      while (logs.childElementCount > 100) logs.firstChild.remove();
      logs.scrollTop = logs.scrollHeight;
    },
    showResult(result) {
      if (!status) return;
      status.className = 'status' + (result.success ? '' : ' error');
      status.textContent = `${result.cancelled ? 'تم الإيقاف' : result.success ? 'اكتمل التنفيذ' : 'يحتاج مراجعة'} — تحقق من ${result.verifiedFields || 0} حقل، فشل ${result.failedActions || 0}، يحتاج مراجعة ${result.blockedActions || 0}`;
      this.renderButtons(APP.Agent.getButtons());
    },
    updateProgress(current, total) { if (progress) { progress.max = total || 1; progress.value = current; } },
    setGuardianLock(locked) { this.isLocked = !!locked; },
    toggleGuardianLock() { this.setGuardianLock(!this.isLocked); },
    highlight(el) { el?.scrollIntoView?.({ block: 'nearest' }); },
    destroy() { host?.remove(); host = null; root = null; }
  };
})();
