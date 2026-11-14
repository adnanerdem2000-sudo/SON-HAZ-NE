// Tek HTML'in ağ tamamen kapalıyken (context offline) file:// açılışı: dış istek sayısı, işçi, oyun başlangıcı.
// Kullanım: tk node cevrimdisi.cjs <file-url> <rapor.json>
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = process.argv[2], out = process.argv[3];
  const rep = { url, disIstek: [], basarisizIstek: [], konsolHata: [], konsolUyari: [], sayfaHata: [], adimlar: {} };
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  rep.tarayici = b.version();
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 }, offline: true });
  const p = await ctx.newPage();
  p.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) rep.disIstek.push(u.slice(0, 160)); });
  p.on('requestfailed', (r) => rep.basarisizIstek.push(r.url().slice(0, 160) + ' ' + (r.failure()?.errorText || '')));
  p.on('console', (m) => { if (m.type() === 'error') rep.konsolHata.push(m.text().slice(0, 300)); else if (m.type() === 'warning') rep.konsolUyari.push(m.text().slice(0, 200)); });
  p.on('pageerror', (e) => rep.sayfaHata.push(e.message.slice(0, 300)));
  const t0 = Date.now();
  try {
    await p.goto(url);
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    rep.hazirMs = Date.now() - t0;
    rep.adimlar.acilis = await p.evaluate(() => ({ search: location.search, proto: location.protocol, isci: DK.terrain.workers.length, yedek: DK.terrain.fallback, eksikModel: (DK.assets.missing || []).length ?? null, gomulu: Object.keys(window.__DK_FILES || {}).length, isciUrl: String(window.__DK_WORKER_URL).slice(0, 30), navigatorOnLine: navigator.onLine }));
    await p.evaluate(() => { DK.G.noAutoPause = true; DK.handlers.startGame({ kind: 'solo', slot: 2, data: null }); });
    await p.waitForTimeout(4000);
    rep.adimlar.oyun = await p.evaluate(() => { DK.sim(2); const pl = DK.G.player; return { durum: DK.G.state, zemin: Math.abs(pl.pos.y - DK.terrain.heightAt(pl.pos.x, pl.pos.z)) < 0.6, kayit: !!DK.save.read('solo', 2) }; });
  } catch (e) { rep.kosucuHata = e.message.slice(0, 300); }
  rep.ms = Date.now() - t0;
  fs.writeFileSync(out, JSON.stringify(rep, null, 1));
  console.log(JSON.stringify({ hazirMs: rep.hazirMs, ...rep.adimlar, disIstek: rep.disIstek.length, basarisiz: rep.basarisizIstek.length, konsolHata: rep.konsolHata.length, sayfaHata: rep.sayfaHata.length, kosucuHata: rep.kosucuHata || null }));
  await b.close();
})();
