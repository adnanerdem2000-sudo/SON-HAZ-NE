const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
for (const id of ['mercan_halkasi_kazi_1','ada_merkez_0_kazi_0','ada_merkez_1_kazi_0','ada_merkez_5_kazi_0','ada_merkez_6_kazi_0','ada_merkez_6_kazi_1','ada_tropik_1_kazi_0','ada_tropik_5_kazi_0','ada_tropik_8_kazi_0']) {
  const s = W.DIG_SITES.find(x => x.id === id); const I = W.ISLANDS.find(i => i.id === s.island);
  const d = Math.hypot(s.x - I.x, s.z - I.z) / I.r;
  // landmark height
  const lm = s.landmarks[0]; const lh = geo.computeHeight(lm.x, lm.z);
  console.log(id, I.shape || 'normal', 'r', I.r, 'd/r', d.toFixed(2), 'h', geo.computeHeight(s.x, s.z).toFixed(2), 'isaret', lm.type, lh.toFixed(2), '|', s.clue);
}
