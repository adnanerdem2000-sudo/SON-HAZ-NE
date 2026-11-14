// TK05 denemesi: context.route ile sahte https kökeni (https://oyun.ornek) yerel v0.4 dosyalarından sunulur.
// Ölçülen: gezinme yakalanıyor mu, işçi betiği isteği yakalanıyor mu, isSecureContext, açılış.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const KOK = '/home/user/SON-HAZ-NE';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
(async () => {
  const rep = { yakalanan: 0, isciIstegi: [], basarisiz: [], konsolHata: [], sayfaHata: [] };
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } });
  await ctx.route('https://oyun.ornek/**', async (route) => {
    const u = new URL(route.request().url()); rep.yakalanan++;
    if (/terrainWorker/.test(u.pathname)) rep.isciIstegi.push(u.pathname);
    const f = path.join(KOK, decodeURIComponent(u.pathname));
    if (!f.startsWith(KOK) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'yok' });
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } });
  });
  const p = await ctx.newPage();
  p.on('requestfailed', (r) => rep.basarisiz.push(r.url().slice(0, 120) + ' ' + (r.failure()?.errorText || '')));
  p.on('console', (m) => { if (m.type() === 'error') rep.konsolHata.push(m.text().slice(0, 200)); });
  p.on('pageerror', (e) => rep.sayfaHata.push(e.message.slice(0, 200)));
  const t0 = Date.now();
  try {
    await p.goto('https://oyun.ornek/index.html?test=1&terrain=crash&peerhost=10.9.9.9');
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    rep.hazirMs = Date.now() - t0;
    rep.durum = await p.evaluate(() => ({ origin: location.origin, guvenli: isSecureContext, subtle: !!(self.crypto && crypto.subtle), locks: !!navigator.locks, isci: DK.terrain.workers.length, yedek: DK.terrain.fallback, kip: DK.terrain.mode, hatalar: DK.terrain.failures.slice(0, 3) }));
  } catch (e) { rep.kosucuHata = e.message.slice(0, 300); }
  await p.waitForTimeout(3000);
  rep.durum2 = await p.evaluate(() => ({ isci: DK.terrain.workers.length, yedek: DK.terrain.fallback, hatalar: DK.terrain.failures.slice(0, 3) })).catch((e) => e.message);
  fs.writeFileSync('/tmp/tasarim_y/faz9_inceleme/sahte_koken.json', JSON.stringify(rep, null, 1));
  console.log(JSON.stringify(rep).slice(0, 1500));
  await b.close();
})();
