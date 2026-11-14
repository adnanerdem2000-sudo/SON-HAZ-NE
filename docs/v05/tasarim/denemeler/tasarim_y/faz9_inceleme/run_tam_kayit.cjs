// Tek sayfalı senaryo koşucusu (Playwright + başsız Chromium, yazılımsal WebGL).
//
//   node tests/harness/run.cjs tests/scenarios/<senaryo>.js [--url http://localhost:8080/index.html]
//        [--size 960x540] [--timeout 600] [--report rapor.json] [--trace]
//
// Senaryo dosyası, bir adım dizisi döndüren JS ifadesidir (eval ile okunur). Adım alanları:
//   wait   : ms bekle                               js     : sayfada çalıştır (sonuç R: satırıyla yazılır)
//   key    : klavye basışı (Playwright kodu)        down/up: tuşu basılı tut / bırak
//   click  : [x, y] fare tıklaması                  shot   : sayfa ekran görüntüsü dosyası
//   metrics: etiket → CDP page.metrics (JS yığını MB, DOM düğümü, dinleyici) 'M:' satırıyla yazılır
//   snap   : 3B tuval yakalama dosyası (DK.snap)     view   : [dosya, from[xyz], to[xyz]] (DK.snapFrom)
//   snapjs : [dosya, jsIfadesi]  (ifade dataURL döndürmeli)
//   expect : { js, eq|truthy|gte|lte, label }  → başarısızsa rapor "fail" sayar
//
// Sayfadaki DK yardımcıları: DK.sim(sn, dt) oyunu çizmeden ileri sarar; DK.press/DK.tap tuş simüle eder;
// DK.G.noAutoPause=true odak kaybında duraklatmayı kapatır.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };
const flag = (name) => argv.includes('--' + name);
const scenarioPath = argv.find((a) => !a.startsWith('--') && (argv.indexOf(a) === 0 || !argv[argv.indexOf(a) - 1].startsWith('--')));
if (!scenarioPath) { console.error('Kullanım: node tests/harness/run.cjs <senaryo.js> [--url ...] [--size WxH] [--report r.json]'); process.exit(2); }
const url = opt('url', 'http://localhost:8080/index.html');
const [W, H] = opt('size', '960x540').split('x').map(Number);
const timeoutS = Number(opt('timeout', '600'));
const reportPath = opt('report', null);

(async () => {
  const t0 = Date.now();
  const report = { scenario: scenarioPath, url, size: [W, H], steps: [], errors: [], pageErrors: [], fails: 0, evalErrors: 0, readyMs: null };
  // DK_JSFLAGS ortam değişkeni (örn. --expose-gc) V8'e iletilir: bellek teşhisi için
  const extra = process.env.DK_JSFLAGS ? ['--js-flags=' + process.env.DK_JSFLAGS] : [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info', ...extra] }); // kesin performance.memory (başsızda nicemlenmiş değer döner)
  const p = await b.newPage({ viewport: { width: W, height: H } });
  report.tumKonsol = []; report.agYanit = []; report.agBasarisiz = [];
  p.on('response', (r) => { if (r.status() >= 400) report.agYanit.push(r.status() + ' ' + r.url().slice(0, 200)); });
  p.on('requestfailed', (r) => { report.agBasarisiz.push(r.url().slice(0, 200) + ' ' + (r.failure()?.errorText || '')); });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const L = m.location() || {}; report.tumKonsol.push({ tur: m.type(), metin: m.text().slice(0, 300), konum: (L.url || '').slice(0, 200) }); } });
  p.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' && !/404/.test(t)) { report.errors.push(t.slice(0, 600)); console.log('ERR:', t.slice(0, 400)); }
    else if (/NOTIFY|LOG|\[test\]/.test(t)) console.log(t.slice(0, 300));
  });
  p.on('pageerror', (e) => { const s = e.message + ' | ' + (e.stack || '').split('\n').slice(0, 4).join(' | '); report.pageErrors.push(s.slice(0, 800)); console.log('PAGEERR:', s.slice(0, 500)); });
  p.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) { report.errors.push('NET ' + r.url() + ' ' + (r.failure()?.errorText || '')); console.log('NETFAIL:', r.url()); } });
  const killer = setTimeout(() => { console.log('TIMEOUT'); report.timeout = true; finish(1); }, timeoutS * 1000);
  const finish = async (code) => {
    clearTimeout(killer);
    report.ms = Date.now() - t0;
    console.log(`errors: ${report.errors.length} pageErrors: ${report.pageErrors.length} fails: ${report.fails}${report.evalErrors ? ` evalErrors: ${report.evalErrors}` : ''}${report.harnessError ? ' HARNESS ERROR (senaryo koşmadı)' : ''}${report.timeout ? ' TIMEOUT' : ''} (${(report.ms / 1000).toFixed(1)} s)`);
    if (reportPath) { fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, JSON.stringify(report, null, 1)); }
    try { await b.close(); } catch (e) { /* kapalı */ }
    process.exit(code);
  };
  try {
    await p.goto(url);
    await p.waitForFunction('window.__ready', null, { timeout: 240000 });
    report.readyMs = Date.now() - t0;
    console.log('ready in', (report.readyMs / 1000).toFixed(1), 's');
    const steps = eval(fs.readFileSync(scenarioPath, 'utf8'));
    let n = 0;
    for (const s of steps) {
      n++;
      const rec = { n, label: s.label || null };
      if (s.wait) await p.waitForTimeout(s.wait);
      if (s.js) {
        try { const r = await p.evaluate(s.js); rec.result = r; if (r !== undefined) console.log('R:', JSON.stringify(r)?.slice(0, 1500)); }
        // js adımı istisna atarsa senaryo amaçladığını yapmamıştır: başarısızlık sayılır (önce yalnız yazdırılıyordu, çıkış kodu 0 kalıyordu)
        catch (e) { rec.error = e.message.slice(0, 600); report.evalErrors++; report.fails++; console.log('EVALERR', e.message.slice(0, 500)); }
      }
      if (s.expect) {
        const E = s.expect;
        try {
          const v = await p.evaluate(E.js);
          let ok = true;
          if ('eq' in E) ok = JSON.stringify(v) === JSON.stringify(E.eq);
          if (E.truthy) ok = !!v;
          if ('gte' in E) ok = v >= E.gte;
          if ('lte' in E) ok = v <= E.lte;
          rec.expect = { label: E.label, ok, value: v };
          if (!ok) report.fails++;
          console.log((ok ? 'PASS ' : 'FAIL ') + (E.label || E.js.slice(0, 80)) + ' → ' + JSON.stringify(v)?.slice(0, 300));
        } catch (e) { report.fails++; rec.expect = { label: E.label, ok: false, error: e.message.slice(0, 300) }; console.log('FAIL (hata) ' + (E.label || '') + ' ' + e.message.slice(0, 200)); }
      }
      if (s.key) await p.keyboard.press(s.key);
      if (s.down) await p.keyboard.down(s.down);
      if (s.up) await p.keyboard.up(s.up);
      if (s.metrics) { try { if (!p._cdp) { p._cdp = await p.context().newCDPSession(p); await p._cdp.send('Performance.enable'); } const mm = (await p._cdp.send('Performance.getMetrics')).metrics; const m = Object.fromEntries(mm.map((x) => [x.name, x.value])); const hu = await p._cdp.send('Runtime.getHeapUsage').catch(() => ({})); const o = { label: s.metrics, heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(1), heapTotalMB: +(m.JSHeapTotalSize / 1048576).toFixed(1), backingMB: hu.backingStorageSize !== undefined ? +(hu.backingStorageSize / 1048576).toFixed(1) : null, embedderMB: hu.embedderHeapUsedSize !== undefined ? +(hu.embedderHeapUsedSize / 1048576).toFixed(1) : null, nodes: m.Nodes, listeners: m.JSEventListeners, docs: m.Documents, frames: m.Frames }; rec.metrics = o; console.log('M:', JSON.stringify(o)); } catch (e) { console.log('METRICSFAIL', e.message.slice(0, 120)); } }
      if (s.click) await p.mouse.click(s.click[0], s.click[1]);
      const save = (file, dataUrl) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); };
      if (s.view) { try { save(s.view[0], await p.evaluate(`DK.snapFrom(${JSON.stringify(s.view[1])}, ${JSON.stringify(s.view[2])})`)); } catch (e) { console.log('SNAPFAIL', e.message.slice(0, 100)); } }
      if (s.snap) { try { save(s.snap, await p.evaluate('DK.snap()')); } catch (e) { console.log('SNAPFAIL', e.message.slice(0, 100)); } }
      if (s.snapjs) { try { save(s.snapjs[0], await p.evaluate(s.snapjs[1])); } catch (e) { console.log('SNAPFAIL', e.message.slice(0, 200)); } }
      if (s.shot) { try { fs.mkdirSync(path.dirname(s.shot), { recursive: true }); await p.screenshot({ path: s.shot, timeout: 90000 }); } catch (e) { console.log('SHOTFAIL', e.message.slice(0, 100)); } }
      report.steps.push(rec);
    }
    await finish(report.fails || report.pageErrors.length ? 1 : 0);
  } catch (e) {
    console.log('HARNESS ERROR', e.message.slice(0, 500));
    report.harnessError = e.message.slice(0, 500);
    await finish(1);
  }
})();
