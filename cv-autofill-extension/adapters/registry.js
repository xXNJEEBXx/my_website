(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const adapters = [];
  APP.Adapters = {
    register(adapter) {
      if (adapters.some(item => item.id === adapter.id)) throw new Error('Duplicate adapter: ' + adapter.id);
      adapters.push(adapter);
    },
    current(url = location.href) {
      const parsed = new URL(url);
      return adapters.find(adapter => adapter.detect(parsed)) || { id: 'generic', fields: {} };
    },
    list: () => adapters.map(adapter => adapter.id),
    get: id => adapters.find(adapter => adapter.id === id)
  };
  APP.hostMatches = (url, host) => url.hostname === host || url.hostname.endsWith('.' + host);
})();
