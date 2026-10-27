// Extension-origin IndexedDB, shared by options and the service worker; never injected into pages.
(() => {
  'use strict';
  const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('cv-autofill-attachments', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function transaction(mode, operation) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('files', mode);
        const request = operation(tx.objectStore('files'));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Attachment transaction aborted'));
      });
    } finally { db.close(); }
  }
  globalThis.CVAttachmentStore = Object.freeze({
    get: key => transaction('readonly', store => store.get(key)),
    async set(key, file) {
      if (!['cv', 'coverLetter', 'certificate'].includes(key)) throw new Error('Unknown attachment kind');
      if (file.size > 10 * 1024 * 1024) throw new Error('الحد الأقصى للملف 10 ميجابايت');
      if (new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== '%PDF-') throw new Error('اختر ملف PDF صالحًا');
      return transaction('readwrite', store => store.put({ blob: file, name: file.name, type: 'application/pdf', size: file.size }, key));
    },
    remove: key => transaction('readwrite', store => store.delete(key))
  });
})();
