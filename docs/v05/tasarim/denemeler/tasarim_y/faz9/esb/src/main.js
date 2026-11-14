import { TEST } from './core/testmode.js';
const api = { a: 1 };
async function boot() {
  if (TEST) { const m = await import('./test/hooks.js'); m.install(api); }
  window.__ready = true;
}
boot();
