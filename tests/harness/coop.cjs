// Çok oyunculu (co-op) senaryo koşucusu: N tarayıcı bağlamı, yerel PeerJS sinyal sunucusu.
//
//   node tests/peer-server.cjs &                       (bir kez; 127.0.0.1:9000)
//   node tests/harness/coop.cjs tests/scenarios/coop/<senaryo>.cjs [--players 2] [--size 640x360] [--report r.json]
//
// Senaryo modülü şunu dışa aktarır:  module.exports = async ({ pages, host, guests, ev, tick, log, check }) => { ... }
//   pages   : Playwright sayfaları (pages[0] oda sahibi)        ev(page, js, label?) : sayfada çalıştır, sonucu yaz
//   tick(sn): tüm sayfalarda DK.sim ile sn saniye ilerlet (ağ mesajlarının akması için gerçek bekleme de yapar)
//   check(label, ok, detay): sonuç kaydeder (ok=false → fail)   log(msg): ekrana yaz
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };
const scenarioPath = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
if (!scenarioPath) { console.error('Kullanım: node tests/harness/coop.cjs <senaryo.cjs> [--players N]'); process.exit(2); }
const N = Number(opt('players', '2'));
const [W, H] = opt('size', '640x360').split('x').map(Number);
const url = opt('url', 'http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000');
const reportPath = opt('report', null);
const timeoutS = Number(opt('timeout', '900'));

(async () => {
  const t0 = Date.now();
  const report = { scenario: scenarioPath, players: N, checks: [], errors: {}, pageErrors: {}, fails: 0 };
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
  const names = ['Kaptan', 'Tayfa', 'Lostromo', 'Topçu'];
  const pages = [];
  const mk = async (name) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H } });
    const p = await ctx.newPage();
    report.errors[name] = []; report.pageErrors[name] = [];
    p.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !/404/.test(t)) { report.errors[name].push(t.slice(0, 400)); console.log(name, 'ERR:', t.slice(0, 300)); } });
    p.on('pageerror', (e) => { const s = e.message + ' | ' + (e.stack || '').split('\n').slice(0, 3).join(' | '); report.pageErrors[name].push(s.slice(0, 600)); console.log(name, 'PAGEERR:', s.slice(0, 400)); });
    await p.goto(url);
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    await p.evaluate(`DK.G.noAutoPause=true; DK.G.profile.appearance.name='${name}';`);
    p.playerName = name;
    return p;
  };
  const finish = async (code) => {
    report.ms = Date.now() - t0;
    const pe = Object.values(report.pageErrors).reduce((s, a) => s + a.length, 0);
    console.log(`checks: ${report.checks.length} fails: ${report.fails} pageErrors: ${pe} (${(report.ms / 1000).toFixed(1)} s)`);
    if (reportPath) { fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(report, null, 1)); }
    try { await b.close(); } catch (e) { /* kapalı */ }
    process.exit(code);
  };
  const killer = setTimeout(() => { console.log('TIMEOUT'); report.timeout = true; finish(1); }, timeoutS * 1000);
  try {
    for (let i = 0; i < N; i++) pages.push(await mk(names[i]));
    const ev = async (p, js, label) => { try { const r = await p.evaluate(js); if (label) console.log(`${p.playerName}/${label}`, JSON.stringify(r)?.slice(0, 700)); return r; } catch (e) { console.log('EVALERR', p.playerName, label || '', e.message.slice(0, 300)); return undefined; } };
    const tick = async (sec = 1) => { for (let i = 0; i < sec * 5; i++) { for (const p of pages) await ev(p, 'DK.sim(0.2)'); await pages[0].waitForTimeout(40); } };
    const log = (m) => console.log('[test]', m);
    const check = (label, ok, detail) => { report.checks.push({ label, ok: !!ok, detail }); if (!ok) report.fails++; console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail !== undefined ? ' → ' + JSON.stringify(detail)?.slice(0, 300) : '')); };
    const scenario = require(path.resolve(scenarioPath));
    await scenario({ pages, host: pages[0], guests: pages.slice(1), ev, tick, log, check, browser: b, mk });
    clearTimeout(killer);
    const pe = Object.values(report.pageErrors).reduce((s, a) => s + a.length, 0);
    await finish(report.fails || pe ? 1 : 0);
  } catch (e) {
    clearTimeout(killer);
    console.log('HARNESS ERROR', e.message.slice(0, 500));
    report.harnessError = e.message.slice(0, 500);
    await finish(1);
  }
})();
