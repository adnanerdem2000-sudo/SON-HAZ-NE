const STEP = 1/60, MAX_SUB = 6, GRAV = -22;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const substeps = (dt) => { const n = clamp(Math.ceil(dt / STEP - 1e-6), 1, MAX_SUB); return { n, h: dt / n }; };
// zıplama tepesi: gerçek tepe (alt adım düzeyi) ve kare örnekli tepe (testin ölçtüğü)
function jump(dt, v04) {
  let vy = 7.4, y = 0, maxSub = 0, maxFrame = 0, first = true;
  for (let f = 0; f < 200; f++) {
    const { n, h } = v04 ? substeps(dt) : { n: 1, h: dt };
    for (let i = 0; i < n; i++) { if (!first) {} vy += GRAV * h; y += vy * h; first = false; if (y > maxSub) maxSub = y; if (y < 0) break; }
    if (y > maxFrame) maxFrame = y;
    if (y < 0) break;
  }
  return { tepe: +maxSub.toFixed(3), kareOrnek: +maxFrame.toFixed(3) };
}
// geri tepme: 10 hasar, k=2.7, 1.5 sn
function knock(dt, v04) {
  let vx = 0, x = 0, kx = 2.7, t = 0;
  const damp = (a, b, l, h) => a + (b - a) * (1 - Math.exp(-l * h));
  while (t < 1.5 - 1e-9) {
    const { n, h } = v04 ? substeps(dt) : { n: 1, h: dt };
    for (let i = 0; i < n; i++) {
      vx = damp(vx, 0, 13, h);
      if (kx !== null) { vx += kx * 60 * h; kx *= Math.exp(-9 * h); if (Math.abs(kx) < 0.1) kx = null; }
      x += vx * h;
    }
    t += dt;
  }
  return +x.toFixed(3);
}
const out = {};
for (const fps of [15, 20, 30, 40, 45, 50, 59.94, 60, 75, 90, 120, 144, 165, 240]) {
  const dt = 1 / fps; const { n, h } = substeps(dt);
  out[fps] = { n, h: +(1/h).toFixed(2), v04_zipla: jump(dt, true), v03_zipla: jump(dt, false), v04_geriTepme: knock(dt, true), v03_geriTepme: knock(dt, false) };
}
console.table(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,{n:v.n,'1/h':v.h,'v04 tepe':v.v04_zipla.tepe,'v04 kare':v.v04_zipla.kareOrnek,'v03 tepe':v.v03_zipla.tepe,'v04 kb':v.v04_geriTepme,'v03 kb':v.v03_geriTepme}])));
