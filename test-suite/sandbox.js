(() => {
  const frame = document.getElementById('fixture');
  const status = document.getElementById('result');
  document.getElementById('fixture-picker').addEventListener('change', event => { frame.src = 'fixtures/' + event.target.value + '.html'; status.textContent = 'افتح الإضافة من شريط Chrome لفحص الإطار وتعبئته.'; });
  document.getElementById('inspect').addEventListener('click', async () => {
    const api = frame.contentWindow.__CV_AGENT;
    status.textContent = api ? JSON.stringify(await api.inspect(), null, 2) : 'الإضافة غير محملة. شغّل الخادم المحلي وافتح المختبر في Chrome مع الإضافة.';
  });
  document.getElementById('validate').addEventListener('click', async () => {
    const api = frame.contentWindow.__CV_AGENT;
    status.textContent = api ? JSON.stringify(await api.validate(), null, 2) : 'الإضافة غير محملة.';
  });
})();
