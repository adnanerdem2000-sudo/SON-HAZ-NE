import { TEST } from './core/testmode.js';
const URETIM = globalThis.__DK_URETIM__ === true;   // yalnız üretim derlemesinde define ile true
const api = { a: 1 };
async function boot() {
  if (!URETIM && TEST) { const m = await import('./test/hooks.js'); m.install(api); }
  window.__ready = true;
}
boot();
