// Oyundaki eşlemeyle (v0.4 ve v0.3 _locomotion) ayak kayması: gövde v hızıyla ilerlerken klip kodun timeScale'iyle oynar;
// temas noktası (bilek ya da parmak kemiğinden hangisi alçaksa, kendi minimumunun 1,5 cm içindeyken) dünya yatay hızı.
import * as THREE from 'three';
import { loadGLB } from '../loadglb.mjs';
import { kk } from '/home/user/SON-HAZ-NE-w2/js/core/kk.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const id = process.argv[2] || 'rogue';
kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar(id); kk._prepClips();
const info = kk.info[id];
const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
const root = new THREE.Group(); root.add(model);
const B = {}; model.traverse((o) => { if (o.isBone) B[o.name] = o; });
const mixer = new THREE.AnimationMixer(model);
const wp = (n) => B[n].getWorldPosition(new THREE.Vector3());
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// bir klibin bir döngüsünü örnekle (timeScale 1)
const cache = {};
function sample(cn) {
  if (cache[cn]) return cache[cn];
  mixer.stopAllAction(); const clip = kk.clips[cn]; const a = mixer.clipAction(clip); a.reset(); a.play(); mixer.update(0);
  const N = 800, T = clip.duration, dt = T / N, P = { footl: [], footr: [], toesl: [], toesr: [] };
  for (let i = 0; i < N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); for (const k in P) P[k].push(wp(k)); }
  return (cache[cn] = { P, N, T, dt });
}
// doğal temas hızı: her kemik kendi minimumunun 'thr' içindeyken model uzayı z-hızı (ortalama mutlak)
function natural(cn, bone, thr) {
  const { P, N, dt } = sample(cn); const vs = [];
  for (const side of ['l', 'r']) {
    const ps = P[bone + side]; const minY = Math.min(...ps.map((p) => p.y));
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (ps[i].y < minY + thr && ps[j].y < minY + thr) vs.push(-(ps[j].z - ps[i].z) / dt); }
  }
  vs.sort((a, b) => a - b); return { med: vs[Math.floor(vs.length / 2)], frac: vs.length / (2 * N) };
}
for (const cn of ['Walking_A', 'Running_A', 'Running_C']) {
  const out = [];
  for (const bone of ['foot', 'toes']) for (const thr of [0.01, 0.02]) { const r = natural(cn, bone, thr); out.push(`${bone}@${thr * 100}cm ${r.med.toFixed(2)} (%${(r.frac * 100).toFixed(0)})`); }
  console.log(`dogal ${cn.padEnd(10)}: ${out.join(' | ')}`);
}
// oyun içi kayma: v hızında, verilen klip ve timeScale ile; her an hangi kemik (bilek/parmak, iki ayak) en alçaksa o temas
// noktası sayılır, kendi döngü minimumunun 1,5 cm içindeyse dünya hızı = v - ts * (model z-hızı geriye)
function slip(cn, ts, v) {
  const { P, N, dt } = sample(cn); const sl = [];
  const mins = {}; for (const k in P) mins[k] = Math.min(...P[k].map((p) => p.y));
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N; let best = null;
    for (const k in P) { const y = P[k][i].y; if (y < mins[k] + 0.015 && (!best || y < best.y)) best = { k, y }; }
    if (!best) continue;
    const vz = (P[best.k][j].z - P[best.k][i].z) / dt; // model uzayında (ileri +z)
    sl.push(Math.abs(v + ts * vz)); // dünya: gövde +v, ayak gövdeye göre ts*vz
  }
  sl.sort((a, b) => a - b);
  return { med: sl[Math.floor(sl.length / 2)], frac: sl.length / N };
}
const v04 = (hs) => (hs < 3.7 ? ['Walking_A', clamp(hs / 1.9, 0.5, 1.9)] : hs > 5.9 ? ['Running_C', clamp(hs / 6.6, 0.75, 1.4)] : ['Running_A', clamp(hs / 5.2, 0.55, 1.5)]);
const v03 = (hs) => (hs < 2.6 ? ['Walking_A', clamp(hs / 1.9, 0.5, 1.4)] : hs > 5.6 ? ['Running_C', clamp(hs / 6.6, 0.8, 1.35)] : ['Running_A', clamp(hs / 5.2, 0.7, 1.45)]);
console.log('hiz | v0.4 klip x ts -> kayma medyani (oran) | v0.3 klip x ts -> kayma medyani (oran)');
for (const hs of [1.7, 2.0, 2.64, 3.0, 4.4, 5.2, 7.0]) {
  const [c4, t4] = v04(hs), [c3, t3] = v03(hs);
  const a = slip(c4, t4, hs), b = slip(c3, t3, hs);
  console.log(`${hs.toFixed(2)} | ${c4} x${t4.toFixed(2)} -> ${a.med.toFixed(2)} m/sn (%${((a.med / hs) * 100).toFixed(0)}) | ${c3} x${t3.toFixed(2)} -> ${b.med.toFixed(2)} m/sn (%${((b.med / hs) * 100).toFixed(0)})`);
}
