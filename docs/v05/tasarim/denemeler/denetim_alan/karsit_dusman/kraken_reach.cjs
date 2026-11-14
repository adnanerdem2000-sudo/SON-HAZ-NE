// Bağımsız kopya: bosses.js:296-361 (Kraken._updateTentacles) + combat.js:188-220 (_meleeHit) + ship.js:184 clampDeck
const TSEG = 18;
const SHIPS = { sloop: { L: 14, B: 4.4, deckY: 1.45, sheer: 0.7 }, brig: { L: 20, B: 5.6, deckY: 1.8, sheer: 0.9 } };
function hullHalfWidth(T, z) { const L = T.L, hb = T.B / 2; const t = (z + L / 2) / L; if (t < 0 || t > 1) return 0;
  const bow = Math.pow(Math.max(0, 1 - Math.pow((t - 0.42) / 0.58, 2)), 0.55); const stern = 0.62 + 0.38 * Math.min(1, t / 0.25); return hb * (t > 0.42 ? bow : stern); }
function deckHeight(T, z) { const L = T.L; const t = (z + L / 2) / L; const quarter = t < 0.2 ? 0.5 : t < 0.24 ? 0.5 * (1 - (t - 0.2) / 0.04) : 0;
  const bowRise = Math.pow(Math.max(0, t - 0.75) / 0.25, 2) * T.sheer * 0.6; return T.deckY + quarter + bowRise; }
function targetPos(base, tip) {
  const ctrl = [base[0] + (tip[0] - base[0]) * 0.35, Math.max(base[1], tip[1]) + 4, base[2] + (tip[2] - base[2]) * 0.35];
  const k = TSEG - 6, u = (k + 1) / TSEG, a = 1 - u;
  const p = [0, 1, 2].map((i) => a * a * base[i] + 2 * a * u * ctrl[i] + u * u * tip[i]); p[1] -= 1; return p;
}
// güverte konumları (clampDeck margin 0.38)
function deckPts(T) { const pts = []; for (let z = -T.L / 2 + 0.38; z <= T.L / 2 - 1.0; z += 0.25) { const hw = Math.max(0.1, hullHalfWidth(T, z) - 0.38);
  for (let x = -hw; x <= hw + 1e-6; x += 0.2) pts.push([x, deckHeight(T, z), z]); pts.push([hw, deckHeight(T, z), z]); pts.push([-hw, deckHeight(T, z), z]); } return pts; }
function reachable(tp, pts, kind) {
  let best = 1e9;
  for (const p of pts) {
    const dx = tp[0] - p[0], dz = tp[2] - p[2], dy = tp[1] - p[1]; const d = Math.hypot(dx, dz);
    if (kind === 'light') { if (d <= 2.5 + 1.3 && dy <= 2.5 && dy >= -2) return { ok: true, d }; }
    else if (kind === 'heavy') { // doğrudan menzil 2.9+1.3 ya da aoe: 1.7 m önde 1.6+1.3 yarıçap (|dy|<2)
      if (d <= 2.9 + 1.3 && dy <= 2.5 && dy >= -2) return { ok: true, d };
      if (d <= 1.7 + 2.9 && Math.abs(dy) < 2) return { ok: true, d };
    }
    best = Math.min(best, d);
  }
  return { ok: false, d: best };
}
function run(name, R, mode) {
  const T = SHIPS[name]; const pts = deckPts(T);
  let n = 0, okL = 0, okH = 0, sumGap = 0, gaps = [], tipDist = [];
  for (let oa = 0; oa < 360; oa += 10) for (let phi = 0; phi < 360; phi += 30) {
    const kx = Math.cos(oa * Math.PI / 180) * R, kz = Math.sin(oa * Math.PI / 180) * R;
    const base = [kx + Math.cos(phi * Math.PI / 180) * 6, -1.5, kz + Math.sin(phi * Math.PI / 180) * 6];
    const locals = [];
    if (mode === 'slam') { for (const fx of [-0.35, -0.175, 0, 0.175, 0.35]) for (const fz of [-0.42, -0.21, 0, 0.21, 0.42]) locals.push([fx * T.B, fz * T.L]); }
    else { for (const side of [-1, 1]) for (const fz of [-0.25, -0.125, 0, 0.125, 0.25]) locals.push([side * T.B * 0.5, fz * T.L]); }
    for (const [lx, lz] of locals) {
      const tip = [lx, deckHeight(T, lz), lz];
      const tp = targetPos(base, tip);
      tipDist.push(Math.hypot(tp[0] - tip[0], tp[2] - tip[2]));
      const rl = reachable(tp, pts, 'light'), rh = reachable(tp, pts, 'heavy');
      n++; if (rl.ok) okL++; if (rh.ok) okH++; if (!rl.ok) gaps.push(rl.d - 3.8);
    }
  }
  tipDist.sort((a, b) => a - b); gaps.sort((a, b) => a - b);
  const q = (arr, f) => arr.length ? +arr[Math.floor(f * (arr.length - 1))].toFixed(1) : null;
  console.log(`${name} R=${R} ${mode}: n=${n} hafif=${(100 * okL / n).toFixed(1)}% agir=${(100 * okH / n).toFixed(1)}% | uc-hedef yatay: min ${q(tipDist, 0)} med ${q(tipDist, 0.5)} max ${q(tipDist, 1)} | erisilemeyenlerde menzil acigi med ${q(gaps, 0.5)} m`);
}
for (const s of ['sloop', 'brig']) for (const R of [38, 30, 22]) for (const m of ['slam', 'grab']) run(s, R, m);
