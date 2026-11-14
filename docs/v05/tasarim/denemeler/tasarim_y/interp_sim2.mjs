// Faz 5 tasarım denemesi (salt-okur) — uzak varlık çizimi, v0.4 ile önerilen ara bellek karşılaştırması.
// A: v0.4 RemotePlayer.update kopyası (net.js:96-101): son hedefe 1−e^(−14dt), fark > 8 m ise tek karede atlama.
// B: önerilen: ts'li ara bellek; oynatma saati pc, hedef = hostNow − D; geride kalınca oynatma hızı ≤ 2×,
//    önde ise ≥ 0,5× (zaman bükme); en yeni örneğin ≤ Emax ötesine dış değerleme; > 3 sn geride kalınca atlama (solma ile).
// Kanallar: 'rel' güvenilir+sıralı (kayıpta ~RTO bekletme, HOL), 'unrel' sırasız+yeniden iletimsiz (kayıp = örnek yok).
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function truthAt(t, v, path) {
  if (path === 'zigzag') { const p = 2.0, ph = Math.floor(t / p), f = (t % p) / p, dir = ph % 2 ? -1 : 1; return { x: v * t * 0.7, z: dir * (f - 0.5) * v * p * 0.7 }; }
  return { x: v * t, z: 0 };
}
function sample(buf, pc, Emax) {
  if (!buf.length) return null;
  if (pc <= buf[0][0]) return { x: buf[0][1], z: buf[0][2], ext: 0 };
  for (let i = 0; i < buf.length - 1; i++) if (pc <= buf[i + 1][0]) { const a = buf[i], b = buf[i + 1], f = (pc - a[0]) / (b[0] - a[0]); return { x: a[1] + (b[1] - a[1]) * f, z: a[2] + (b[2] - a[2]) * f, ext: 0 }; }
  const b = buf[buf.length - 1], a = buf.length > 1 ? buf[buf.length - 2] : b;
  const vx = a === b ? 0 : (b[1] - a[1]) / (b[0] - a[0]), vz = a === b ? 0 : (b[2] - a[2]) / (b[0] - a[0]);
  const e = Math.min(Emax, pc - b[0]);
  return { x: b[1] + vx * e, z: b[2] + vz * e, ext: pc - b[0] };
}
function run({ v = 7, stall = 0, stallAt = 3, chan = 'rel', loss = 0, jitter = 0, lat = 0.05, seconds = 10, method = 'A', path = 'line', hz = 15, Dmin = 0.10, Emax = 0.25 }) {
  const fps = 60, dt = 1 / fps, sdt = 1 / hz;
  const q = []; let ns = 0;
  let ax = 0, az = 0, tgt = null, px0 = null, pz0 = null;
  const buf = []; const dh = []; let pc = null; let D = Dmin;
  let maxJ = 0, maxE = 0, tel = 0, lagSum = 0, lagN = 0, extMax = 0;
  for (let t = 0; t < seconds; t += dt) {
    while (ns <= t) {
      const tr = truthAt(ns, v, path);
      let arr = ns + lat + rnd() * jitter; let drop = false;
      const inStall = stall && ns >= stallAt && ns < stallAt + stall;
      if (chan === 'rel') { if (rnd() < loss) arr += 0.2 + rnd() * 0.1; if (inStall) arr = Math.max(arr, stallAt + stall + lat); }
      else { if (rnd() < loss || inStall) drop = true; }
      if (!drop) q.push([arr, ns, tr.x, tr.z]);
      ns += sdt;
    }
    if (chan === 'rel') { q.sort((a, b) => a[1] - b[1]); let m = 0; for (const e of q) { m = Math.max(m, e[0]); e[0] = m; } }
    const got = []; for (let i = q.length - 1; i >= 0; i--) if (q[i][0] <= t) { got.push(q[i]); q.splice(i, 1); }
    got.sort((a, b) => a[1] - b[1]);
    const truth = truthAt(t, v, path);
    let x, z;
    if (method === 'A') {
      for (const m of got) tgt = m;
      if (!tgt) continue;
      const far = Math.hypot(tgt[2] - ax, tgt[3] - az) > 8, k = far ? 1 : 1 - Math.exp(-14 * dt);
      ax += (tgt[2] - ax) * k; az += (tgt[3] - az) * k; x = ax; z = az;
    } else {
      for (const m of got) { dh.push([t, t - m[1]]); if (!buf.length || m[1] > buf[buf.length - 1][0]) buf.push([m[1], m[2], m[3]]); else if (!buf.some((b) => b[0] === m[1])) { buf.push([m[1], m[2], m[3]]); buf.sort((a, b) => a[0] - b[0]); } }
      while (dh.length && dh[0][0] < t - 5) dh.shift();
      if (!buf.length) continue;
      const dMin = Math.min(...dh.map((h) => h[1]));
      const devs = dh.map((h) => h[1] - dMin).sort((a, b) => a - b);
      const p95 = devs[Math.floor((devs.length - 1) * 0.95)] || 0;
      const Dw = Math.min(0.35, Math.max(Dmin, sdt * 1.05 + p95 + 0.01));
      D += (Dw - D) * (Dw > D ? 0.2 : 0.02); // gecikme hızlı artar, yavaş azalır
      const target = t - dMin - D;
      if (pc === null) pc = target;
      const newest = buf[buf.length - 1][0];
      const goal = Math.min(target, newest + Emax);
      const diff = goal - pc;
      if (newest - pc > 3) { pc = target; } // çok uzun kopmadan sonra veri geldi: açık atlama (solma ile)
      else { const rate = Math.min(2, Math.max(0.5, 1 + diff * 2)); pc += dt * rate; }
      if (pc > newest + Emax) pc = newest + Emax; // dış değerleme sınırı: ötesinde bekle
      while (buf.length > 3 && buf[1][0] < pc - 1) buf.shift();
      const s = sample(buf, pc, Emax); x = s.x; z = s.z; extMax = Math.max(extMax, Math.min(s.ext, Emax));
      lagSum += t - pc; lagN++;
    }
    if (px0 !== null) { const j = Math.hypot(x - px0, z - pz0); if (j > 1) tel++; maxJ = Math.max(maxJ, j); }
    px0 = x; pz0 = z;
    maxE = Math.max(maxE, Math.hypot(truth.x - x, truth.z - z));
  }
  const ns_ = v * dt;
  return { yontem: method, kanal: chan, yol: path, tikanma_sn: stall, kayip: loss, titresim_ms: jitter * 1000, kareAdimEnCok_m: +maxJ.toFixed(3), normalAdim_m: +ns_.toFixed(3), oran: +(maxJ / ns_).toFixed(2), isinlanma: tel, gercegeUzaklikEnCok_m: +maxE.toFixed(2), ortGecikme_ms: lagN ? Math.round(1000 * lagSum / lagN) : null };
}
const rows = [];
for (const stall of [0, 0.6, 1.2, 1.5, 2.0, 4.0]) {
  seed = 7; rows.push(run({ method: 'A', chan: 'rel', stall }));
  seed = 7; rows.push(run({ method: 'B', chan: 'rel', stall }));
  seed = 7; rows.push(run({ method: 'B', chan: 'unrel', stall }));
}
console.log('--- tıkanma (7 m/sn düz koşu, tek yön 50 ms)'); console.table(rows);
const rows2 = [];
for (const [loss, jitter] of [[0.05, 0.03], [0.15, 0.06], [0.30, 0.06]]) {
  seed = 9; rows2.push(run({ method: 'A', chan: 'rel', loss, jitter, lat: 0.12 }));
  seed = 9; rows2.push(run({ method: 'B', chan: 'rel', loss, jitter, lat: 0.12 }));
  seed = 9; rows2.push(run({ method: 'B', chan: 'unrel', loss, jitter, lat: 0.12 }));
}
console.log('--- kayıp + titreşim (tek yön 120 ms)'); console.table(rows2);
const rows3 = [];
seed = 3; rows3.push(run({ method: 'A', chan: 'rel', path: 'zigzag', loss: 0.05, jitter: 0.03, lat: 0.08 }));
seed = 3; rows3.push(run({ method: 'B', chan: 'unrel', path: 'zigzag', loss: 0.05, jitter: 0.03, lat: 0.08 }));
seed = 3; rows3.push(run({ method: 'B', chan: 'unrel', path: 'zigzag', loss: 0.05, jitter: 0.03, lat: 0.08, stall: 1.5 }));
console.log('--- zikzak (2 sn\'de yön değişimi)'); console.table(rows3);
// 7,5 Hz akış (orta katman) ve 2 Hz (uzak katman)
const rows4 = [];
for (const hz of [7.5, 2]) { seed = 5; rows4.push({ hz, ...run({ method: 'B', chan: 'unrel', hz, loss: 0.05, jitter: 0.03, lat: 0.08, Dmin: hz === 2 ? 0.55 : 0.2, Emax: hz === 2 ? 0.6 : 0.3 }) }); }
console.log('--- seyrek katmanlar'); console.table(rows4);
