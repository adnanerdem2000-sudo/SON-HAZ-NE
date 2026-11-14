// combat.raycast mantığının kopyası (kapsül ~ küre zinciri), kamera kökenli ışın
function raycast(origin, dir, maxD, targets) {
  let best = null;
  for (const t of targets) {
    const segs = Math.max(1, Math.round(t.height / (t.radius * 1.5)));
    for (let s = 0; s <= segs; s++) {
      const v = [t.pos[0], t.pos[1] + (s / segs) * t.height, t.pos[2]];
      const oc = [v[0]-origin[0], v[1]-origin[1], v[2]-origin[2]];
      const proj = oc[0]*dir[0]+oc[1]*dir[1]+oc[2]*dir[2];
      if (proj < 0 || proj > maxD) continue;
      const perp = Math.hypot(oc[0]-dir[0]*proj, oc[1]-dir[1]*proj, oc[2]-dir[2]*proj);
      if (perp < t.radius && (!best || proj < best.d)) best = { name: t.name, d: proj };
    }
  }
  return best;
}
const norm = (v) => { const l = Math.hypot(...v); return v.map(x => x / l); };
// oyuncu z=0'da +z'ye bakıyor; baş 1,65 m. Kamera (nişansız): 4,6 m geride, eğim 0,25 rad
const pitch = 0.25, dist = 4.6, head = [0, 1.65, 0];
const cam = [0, head[1] + Math.sin(pitch) * dist, -Math.cos(pitch) * dist];
const dir = norm([head[0]-cam[0], head[1]-cam[1], head[2]-cam[2]]);
const front = { name: 'öndeki hedef (10 m)', pos: [0, 0, 10], height: 1.8, radius: 0.45 };
for (const back of [-1.0, -1.5, -2.0, -3.0]) {
  const behind = { name: 'arkadaki düşman (' + back + ' m)', pos: [0, 0, back], height: 1.8, radius: 0.45 };
  console.log(JSON.stringify(raycast(cam, dir, 80, [front, behind])));
}
// nişanlı: 2,3 m, omuz 0,65
const sh = 0.65, d2 = 2.3; const right = [-1, 0, 0];
const cam2 = [head[0] + right[0]*sh, head[1] + Math.sin(pitch)*d2, -Math.cos(pitch)*d2];
const look2 = [head[0] + right[0]*sh, head[1], head[2]];
const dir2 = norm([look2[0]-cam2[0], look2[1]-cam2[1], look2[2]-cam2[2]]);
console.log('nişanlı, sağ-arkadaki düşman:', JSON.stringify(raycast(cam2, dir2, 80, [front, { name: 'sağ arka 1,2 m', pos: [-0.65, 0, -1.2], height: 1.8, radius: 0.45 }])));
