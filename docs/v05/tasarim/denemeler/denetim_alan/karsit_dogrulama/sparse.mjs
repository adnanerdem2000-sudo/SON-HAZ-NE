for (const L of [1e6, 1e7, 3e7]) {
  const a = [100, 100]; a[L] = 70;
  const t0 = performance.now(); const r = a.map(Math.round); const t1 = performance.now();
  let js = 'ok'; const t2 = performance.now(); try { JSON.stringify(r).length; } catch (e) { js = e.message; } const t3 = performance.now();
  console.log('len', a.length, 'map ms', (t1 - t0).toFixed(0), 'stringify ms', (t3 - t2).toFixed(0), js);
}
// forEach / for-of / reduce davranışı
const b = [100, 100]; b[1e7] = 70;
let t0 = performance.now(); let n = 0; b.forEach(() => n++); console.log('forEach 1e7 ms', (performance.now() - t0).toFixed(0), 'calls', n);
t0 = performance.now(); n = 0; for (const x of b) n++; console.log('for-of 1e7 ms', (performance.now() - t0).toFixed(0), 'iters', n);
t0 = performance.now(); console.log('some', b.some((h) => h <= 0), (performance.now() - t0).toFixed(0));
t0 = performance.now(); console.log('join len', b.join().length, (performance.now() - t0).toFixed(0));
