// net.js RemotePlayer.update konum yumuşatmasının (k = 1 - exp(-14 dt), 8 m üstü anında atlama) gecikme/duraklama altında davranışı.
// Gönderen 15 Hz'te konum yollar; ağ tek yön gecikmesi L; arada 'stall' sn'lik teslim duraklaması (güvenilir kanal, kayıp→yeniden iletim).
function sim({ v, L = 0.05, stall = 0, stallAt = 2, T = 5, fps = 60 }) {
  const dt = 1 / fps; let t = 0, pos = 0, target = null, lastSend = -1, maxGap = 0, snaps = 0, maxJump = 0;
  const queue = []; // [arrive, x]
  for (; t < T; t += dt) {
    if (t - lastSend >= 1 / 15) { lastSend = t; let arrive = t + L; if (t >= stallAt && t < stallAt + stall) arrive = stallAt + stall + L; queue.push([arrive, v * t]); }
    while (queue.length && queue[0][0] <= t) target = queue.shift()[1];
    if (target === null) continue;
    const truth = v * t;
    const far = Math.abs(target - pos) > 8; const k = far ? 1 : 1 - Math.exp(-14 * dt);
    const prev = pos; pos += (target - pos) * k; if (far) snaps++;
    maxJump = Math.max(maxJump, Math.abs(pos - prev));
    maxGap = Math.max(maxGap, Math.abs(truth - pos));
  }
  return { v, L, stall, snaps, maxJump: +maxJump.toFixed(2), maxGapVsTruth: +maxGap.toFixed(2) };
}
const out = [];
for (const v of [5.7, 12]) for (const stall of [0, 0.5, 1.0, 1.5]) out.push(sim({ v, L: 0.08, stall }));
console.log(out.map((o) => JSON.stringify(o)).join('\n'));
// sabit hızda kararlı durum gecikmesi (ağ gecikmesi + ortalama yarım gönderim aralığı + yumuşatma)
for (const v of [5.7, 12]) { const r = sim({ v, L: 0.08, T: 4 }); console.log('kararli', v, 'm/s → gerçek konuma göre en çok geride:', r.maxGapVsTruth, 'm'); }
