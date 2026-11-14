// (h) Başlatma betiği (meta.baslatma): sayfanın kendi betiklerinden önce çalışır ve localStorage'ı SecurityError atacak biçimde kapatır.
[
 {meta: {baslatma: `Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Access is denied for this document.', 'SecurityError'); } });`}},
 {expect: {js: `window.__depolama`, eq: 'SecurityError', label: 'H01 Sayfa yüklenirken localStorage SecurityError attı'}},
]
