(() => {
  'use strict';
  const status = document.getElementById('status');
  const fill = document.getElementById('fillBtn'), scan = document.getElementById('scanBtn');
  const friendly = { EXTENSION_NOT_READY_REFRESH_PAGE: 'حدّث صفحة النموذج لتحميل الإصدار الجديد.', NO_ACTIVE_TAB: 'لا توجد صفحة نشطة.' };
  async function run(method) {
    fill.disabled = scan.disabled = true;
    status.textContent = method === 'cancel' ? 'جارٍ الإيقاف…' : 'جارٍ التنفيذ…';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'run_in_tab', method, args: method === 'fill' ? [{ delay: 35 }] : [] });
      if (!response?.ok) throw new Error(friendly[response?.code] || response?.code || 'تعذّر الاتصال بالإضافة');
      const results = response.frames.map(frame => frame.result);
      const verified = results.reduce((sum, result) => sum + (result?.verifiedFields || 0), 0);
      const failed = results.reduce((sum, result) => sum + (result?.failedActions || 0), 0);
      const blocked = results.reduce((sum, result) => sum + (result?.blockedActions || result?.issues?.length || 0), 0);
      const actions = results.reduce((sum, result) => sum + (result?.totalActions || 0), 0);
      const errors = results.map(result => result?.code || result?.error).filter(Boolean);
      status.textContent = method === 'plan' ? `الخطة: ${actions} إجراء في ${response.frames.length} إطار. راجع لوحة الصفحة.` : method === 'cancel' ? 'توقفت الإجراءات المنتظرة.' : `${results.some(result => result?.cancelled) ? 'تم الإيقاف' : response.success ? 'اكتمل التنفيذ' : 'يحتاج مراجعة'}\nتم التحقق من ${verified} حقل، فشل ${failed}، يحتاج مراجعة ${blocked}.`;
      if (errors.length) status.textContent += '\n' + errors.join('\n');
    } catch (error) { status.textContent = error.message; }
    finally { fill.disabled = scan.disabled = false; }
  }
  fill.addEventListener('click', () => run('fill'));
  scan.addEventListener('click', () => run('plan'));
  document.getElementById('stopBtn').addEventListener('click', () => run('cancel'));
  document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.getElementById('reloadBtn').addEventListener('click', async () => { await chrome.runtime.sendMessage({ action: 'reload_extension' }); window.close(); });
})();
