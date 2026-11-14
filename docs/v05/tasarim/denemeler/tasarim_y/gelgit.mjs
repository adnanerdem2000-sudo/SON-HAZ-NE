// Salt-okur: final sonrası "Gelgit Hazineleri" için doğal gelgit kumsalı noktaları (−0,35 ≤ h ≤ −0,05; 4 m çevre de benzer)
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const H = (x, z) => Gm.computeHeight(x, z);
for (const id of ['kul_limani', 'kuzeyfener', 'kumsaati', 'zumrut_koy', 'tuz_pazari']) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === id);
  const port = I.features.find((f) => f.type === 'port');
  let best = null;
  for (let k = 0; k < 360; k++) {
    const a = k / 360 * 6.2832;
    if (Math.abs(((a - port.angle + 9.42) % 6.2832) - 3.14) < 0.6) continue; // liman/iskele yönünden uzak
    for (let d = 0.85 * I.r; d < 1.2 * I.r; d += 1) {
      const x = I.x + Math.cos(a) * d, z = I.z + Math.sin(a) * d, h = H(x, z);
      if (h > -0.35 && h < -0.05) {
        let ok = true; for (let j = 0; j < 8; j++) { const hh = H(x + Math.cos(j * 0.785) * 3, z + Math.sin(j * 0.785) * 3); if (hh < -0.7 || hh > 0.6) ok = false; }
        const far = W.DIG_SITES.every((s) => Math.hypot(s.x - x, s.z - z) > 40);
        if (ok && far) { best = { x: Math.round(x), z: Math.round(z), h: +h.toFixed(2), aci: +a.toFixed(2) }; break; }
      }
    }
    if (best) break;
  }
  console.log(id, JSON.stringify(best));
}
