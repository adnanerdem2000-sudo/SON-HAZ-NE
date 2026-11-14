// Başlatma betiği (--baslatma): localStorage erişimini, site verisi engelli bir tarayıcıdaki gibi SecurityError atacak biçimde kapatır.
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  get() { throw new DOMException("Failed to read the 'localStorage' property from 'Window': Access is denied for this document.", 'SecurityError'); },
});
