// Faz 5 tasarım denemesi (salt-okur): uzak oyuncu çizimi
// A) v0.4: RemotePlayer.update (net.js:87-101) — son hedefe üstel yaklaşma, >8 m'de ışınlama
// B) Önerilen: zaman damgalı ara bellek (renderTs = hostNow − D), ≤ Emax dış değerleme, hız sınırlı yakalama, >40 m ya da tp bayrağında atlama
// Kanallar: 'rel' = güvenilir sıralı (kayıp → yeniden iletim bekletmesi / HOL: tıkanma süresince hiçbir şey gelmez, sonra toplu gelir)
//           'unrel' = sırasız, yeniden iletimsiz (kayıp → o örnek hiç gelmez)
let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function truthAt(t, speed, path) {
  if (path === 'zigzag') { const p = 2.0; const ph = Math.floor(t / p); const f = (t % p) / p; const dir = ph % 2 ? -1 : 1; return { x: speed * t * 0.7, z: dir * (f - 0.5) * speed * p * 0.7 }; }
  return { x: speed * t, z: 0 };
}
function run({ speed = 7, stall = 0, stallAt = 3, chan = 'rel', loss = 0, jitter = 0.0, lat = 0.05, seconds = 9, method = 'A', path = 'line', sendHz = 15, D = 0.10, Emax = 0.25 }) {
  const fps = 60, dt = 1 / fps, sendDt = 1 / sendHz;
  const q = []; // [arrive, ts, x, z]
  let nextSend = 0;
  // A durumu
  let ax = 0, az = 0, target = null, prevX = 0, prevZ = 0;
  // B durumu
  const buf = []; let disp = null; let dMin = Infinity; const dHist = [];
  let maxJump = 0, maxErr = 0, teleports = 0, sumLag = 0, nLag = 0, normalStep = speed * dt;
  for (let t = 0; t < seconds; t += dt) {
    while (nextSend <= t) {
      const tr = truthAt(nextSend, speed, path);
      let arrive = nextSend + lat + rnd() * jitter;
      const lost = chan === 'unrel' && rnd() < loss;
      if (chan === 'rel') {
        if (rnd() < loss) arrive += 0.2 + rnd() * 0.1; // yeniden iletim (RTO ~200 ms)
        if (stall && nextSend >= stallAt && nextSend < stallAt + stall) arrive = Math.max(arrive, stallAt + stall + lat);
      } else if (stall && nextSend >= stallAt && nextSend < stallAt + stall) { nextSend += sendDt; continue; } // sırasız kanalda tıkanma = paketler kaybolur
      if (!lost) q.push([arrive, nextSend, tr.x, tr.z]);
      nextSend += sendDt;
    }
    // güvenilir sıralı kanal: HOL — bir ileti geç gelirse arkasındakiler de bekler
    if (chan === 'rel') { q.sort((a, b) => a[1] - b[1]); let mx = 0; for (const m of q) { mx = Math.max(mx, m[0]); m[0] = mx; } }
    else q.sort((a, b) => a[0] - b[0]);
    const arrived = [];
    for (let i = q.length - 1; i >= 0; i--) if (q[i][0] <= t) { arrived.push(q[i]); q.splice(i, 1); }
    arrived.sort((a, b) => a[1] - b[1]);
    const truth = truthAt(t, speed, path);
    if (method === 'A') {
      for (const m of arrived) target = m; // apply(st) => this.target = st (yalnız sonuncusu)
      if (!target) continue;
      const tx = target[2], tz = target[3];
      const far = Math.hypot(tx - ax, tz - az) > 8;
      const k = far ? 1 : 1 - Math.exp(-14 * dt);
      ax += (tx - ax) * k; az += (tz - az) * k;
      const j = Math.hypot(ax - prevX, az - prevZ); if (j > 1) teleports++;
      maxJump = Math.max(maxJump, j); prevX = ax; prevZ = az;
      const lagged = truthAt(Math.max(0, t - 0.0), speed, path);
      maxErr = Math.max(maxErr, Math.hypot(lagged.x - ax, lagged.z - az));
    } else {
      // B: saat eşleme: d = t_alıcı − ts; dMin = son 3 sn'nin en küçüğü; hostNow = t − dMin
      for (const m of arrived) {
        const d = t - m[1]; dHist.push([t, d]);
        // sıra numarasıyla eskiyi at
        if (!buf.length || m[1] > buf[buf.length - 1][0]) buf.push([m[1], m[2], m[3]]);
        else { const i = buf.findIndex((b) => b[0] > m[1]); if (i >= 0 && buf[i - 1]?.[0] !== m[1]) buf.splice(i, 0, [m[1], m[2], m[3]]); }
      }
      while (dHist.length && dHist[0][0] < t - 3) dHist.shift();
      if (!dHist.length && !buf.length) continue;
      dMin = dHist.length ? Math.min(...dHist.map((h) => h[1])) : dMin;
      // uyarlanır gecikme: aralık + titreşim payı (p95(d − dMin))
      const devs = dHist.map((h) => h[1] - dMin).sort((a, b) => a - b);
      const p95 = devs.length ? devs[Math.floor(devs.length * 0.95)] : 0;
      const Dd = Math.min(0.3, Math.max(D, sendDt * 1.05 + p95 + 0.01));
      const rt = t - dMin - Dd;
      while (buf.length > 2 && buf[1][0] <= rt) buf.shift();
      let px, pz;
      if (!buf.length) continue;
      if (rt <= buf[0][0]) { px = buf[0][1]; pz = buf[0][2]; }
      else if (buf.length >= 2 && rt <= buf[1][0]) { const a = buf[0], b = buf[1], f = (rt - a[0]) / (b[0] - a[0]); px = a[1] + (b[1] - a[1]) * f; pz = a[2] + (b[2] - a[2]) * f; }
      else {
        const b = buf[buf.length - 1], a = buf.length >= 2 ? buf[buf.length - 2] : b;
        const vx = a === b ? 0 : (b[1] - a[1]) / (b[0] - a[0]), vz = a === b ? 0 : (b[2] - a[2]) / (b[0] - a[0]);
        const e = Math.min(Emax, rt - b[0]);
        px = b[1] + vx * e; pz = b[2] + vz * e;
      }
      if (!disp) disp = { x: px, z: pz, px, pz };
      const ex = px - disp.x, ez = pz - disp.z, err = Math.hypot(ex, ez);
      if (err > 40) { disp.x = px; disp.z = pz; teleports++; }
      else {
        // hız sınırlı yakalama: hedef hızının 2 katı ya da 8 m/sn'den hızlı değil; küçük hatalar doğrudan izlenir
        const vT = Math.hypot(px - (disp.lpx ?? px), pz - (disp.lpz ?? pz)) / dt;
        const vmax = Math.max(8, 2 * vT) * dt;
        if (err <= vmax) { disp.x = px; disp.z = pz; } else { disp.x += ex / err * vmax; disp.z += ez / err * vmax; }
      }
      disp.lpx = px; disp.lpz = pz;
      const j = Math.hypot(disp.x - disp.px, disp.z - disp.pz); if (j > 1) teleports++;
      maxJump = Math.max(maxJump, j); disp.px = disp.x; disp.pz = disp.z;
      maxErr = Math.max(maxErr, Math.hypot(truth.x - disp.x, truth.z - disp.z));
      sumLag += Dd + dMin; nLag++;
    }
  }
  return { method, chan, path, stall, loss, jitter, maxFrameJump: +maxJump.toFixed(3), normalStep: +normalStep.toFixed(3), jumpRatio: +(maxJump / normalStep).toFixed(2), teleports, maxErr: +maxErr.toFixed(2), avgDelayMs: nLag ? Math.round(1000 * sumLag / nLag) : null };
}
const rows = [];
for (const stall of [0, 0.6, 1.2, 1.5, 2.0]) {
  seed = 7; rows.push(run({ method: 'A', chan: 'rel', stall }));
  seed = 7; rows.push(run({ method: 'B', chan: 'rel', stall }));
  seed = 7; rows.push(run({ method: 'B', chan: 'unrel', stall }));
}
console.log('--- tıkanma (7 m/sn düz koşu, 50 ms gecikme)'); console.table(rows);
const rows2 = [];
for (const [loss, jitter] of [[0.05, 0.03], [0.15, 0.06], [0.30, 0.06]]) {
  seed = 9; rows2.push(run({ method: 'A', chan: 'rel', loss, jitter, lat: 0.12 }));
  seed = 9; rows2.push(run({ method: 'B', chan: 'rel', loss, jitter, lat: 0.12 }));
  seed = 9; rows2.push(run({ method: 'B', chan: 'unrel', loss, jitter, lat: 0.12 }));
}
console.log('--- kayıp + titreşim (120 ms gecikme)'); console.table(rows2);
const rows3 = [];
for (const m of ['A', 'B']) { seed = 3; rows3.push(run({ method: m, chan: m === 'A' ? 'rel' : 'unrel', path: 'zigzag', loss: 0.05, jitter: 0.03, lat: 0.08 })); }
console.log('--- zikzak (2 sn\'de bir yön değişimi)'); console.table(rows3);
