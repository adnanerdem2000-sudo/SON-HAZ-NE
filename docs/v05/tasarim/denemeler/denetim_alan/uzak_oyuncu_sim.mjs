// RemotePlayer.update (js/net/net.js:87-101) konum yumuşatmasının birebir kopyası (yalnız x ekseni).
// Senaryo: uzak oyuncu sabit hızla koşar; ev sahibi/konuk 15 Hz 'st' gönderir (net.js:713-714);
// alıcı 60 FPS'te update(dt) çağırır. Ağda 'tıkanma' (güvenilir/sıralı kanalda yeniden iletim, HOL) = belirli süre hiç paket gelmez,
// sonra biriken paketler aynı anda gelir (yalnız sonuncusu hedef olur: apply(st) => this.target = st).
function run({ speed, stall = 0, stallAt = 2, jitter = 0, seconds = 6 }) {
  const fps = 60, dt = 1 / fps, sendDt = 1 / 15;
  let pos = 0, target = null, teleports = 0, maxErr = 0, maxJump = 0;
  let nextSend = 0, queue = []; // [arriveAt, x]
  const latency = 0.05;
  let prevPos = 0;
  for (let t = 0; t < seconds; t += dt) {
    while (t >= nextSend) {
      const x = speed * nextSend;
      let arrive = nextSend + latency + (Math.random() * jitter);
      if (stall && nextSend >= stallAt && nextSend < stallAt + stall) arrive = stallAt + stall + latency; // tıkanma: hepsi birlikte gelir
      queue.push([arrive, x]);
      nextSend += sendDt;
    }
    queue.sort((a, b) => a[0] - b[0]);
    while (queue.length && queue[0][0] <= t) target = queue.shift()[1];
    if (target === null) continue;
    const far = Math.abs(target - pos) > 8;
    const k = far ? 1 : 1 - Math.exp(-14 * dt);
    if (far) teleports++;
    pos += (target - pos) * k;
    const truth = speed * t;
    maxErr = Math.max(maxErr, Math.abs(truth - pos));
    maxJump = Math.max(maxJump, Math.abs(pos - prevPos));
    prevPos = pos;
  }
  return { speed, stall, teleports, maxErr: +maxErr.toFixed(2), maxFrameJump: +maxJump.toFixed(2) };
}
const rows = [];
for (const speed of [4.4, 7.0]) for (const stall of [0, 0.3, 0.6, 1.0, 1.2, 1.5, 2.0]) rows.push(run({ speed, stall }));
console.table(rows);
// titreşimli varış (0–60 ms rastgele gecikme): kare başına adım sapması
const j = run({ speed: 7.0, jitter: 0.06 });
console.log('jitter 0-60 ms, 7 m/s:', j);
