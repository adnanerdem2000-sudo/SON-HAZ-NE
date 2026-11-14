// Derinlik Yılanı 'dive' kipinin 2,2 sn sonundaki ışınlanma mesafesi (bosses.js:495-511 hareket kuralının kopyası)
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const dampAngle = (a, b, k, dt) => a + wrap(b - a) * (1 - Math.exp(-k * dt));
let worst = 0, sum = 0, n = 0;
for (let orb = 0; orb < 360; orb += 10) for (const side of [-1, 1]) for (const lz of [-0.25, 0, 0.25]) for (const dir of [-1, 1]) {
  const B = 4.4, L = 14; // sloop
  const o = orb * Math.PI / 180;
  let x = Math.cos(o) * 48, z = Math.sin(o) * 48;
  let yaw = Math.atan2(-Math.sin(o) * dir, Math.cos(o) * dir); // çember teğeti (yaklaşık)
  const tx = side * (B / 2 + 3), tz = lz * L;
  const dt = 1 / 60;
  for (let t = 0; t < 2.2; t += dt) {
    const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz);
    if (d > 0.5) yaw = dampAngle(yaw, Math.atan2(dx, dz), 2.2, dt);
    const v = Math.min(14, d * 2);
    x += Math.sin(yaw) * v * dt; z += Math.cos(yaw) * v * dt;
  }
  const jump = Math.hypot(tx - x, tz - z);
  worst = Math.max(worst, jump); sum += jump; n++;
}
console.log({ ornek: n, ortalamaIsinlanma_m: +(sum / n).toFixed(1), enBuyuk_m: +worst.toFixed(1) });
