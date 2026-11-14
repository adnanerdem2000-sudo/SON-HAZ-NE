// Karşıt denetim (A): tarayıcı site verisini engellediğinde (localStorage erişimi SecurityError atar) boot()'un ilk satırları.
// Salt-okur: yalnız save.js ve settings.js içe aktarılır; boot sırası main.js:82-93 ve menu.render (save.latest) taklit edilir.
const ROOT = process.env.DK_ROOT;
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get() { const e = new Error("Failed to read the 'localStorage' property from 'Window': Access is denied for this document."); e.name = 'SecurityError'; throw e; },
});
const out = {};
const { settings } = await import(ROOT + '/js/core/settings.js').catch((e) => ({ settings: null, err: e }));
try { settings?.load(); out.settingsLoad = 'tamam (try/catch içinde)'; } catch (e) { out.settingsLoad = 'ATTI: ' + e.name; }
const { save } = await import(ROOT + '/js/core/save.js');
try { const p = save.profile(); out.profile = 'tamam: ' + p; } catch (e) { out.profile = 'ATTI: ' + e.name + ' — ' + e.message.slice(0, 60); }
try { out.available = save.available(); } catch (e) { out.available = 'ATTI: ' + e.name; }
try { save.latest(); out.latest = 'tamam'; } catch (e) { out.latest = 'ATTI: ' + e.name; }
try { save.list('solo'); out.list = 'tamam'; } catch (e) { out.list = 'ATTI: ' + e.name; }
console.log(JSON.stringify(out, null, 1));
process.exit(0);
