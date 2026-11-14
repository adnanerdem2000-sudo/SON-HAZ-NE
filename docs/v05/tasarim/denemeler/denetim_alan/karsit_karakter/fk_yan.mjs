// Yan adım (Running_Strafe_Left/Right) doğal temas hızı: x ekseninde, bilek ve parmak kemiği, kendi minimumunun 1–2 cm içinde
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
for (const cn of ['Running_Strafe_Left', 'Running_Strafe_Right', 'Walking_Backwards']) {
  mixer.stopAllAction(); const clip = kk.clips[cn]; const a = mixer.clipAction(clip); a.reset(); a.play(); mixer.update(0);
  const N = 800, T = clip.duration, dt = T / N, P = { footl: [], footr: [], toesl: [], toesr: [] };
  for (let i = 0; i < N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); for (const k in P) P[k].push(B[k].getWorldPosition(new THREE.Vector3())); }
  const ax = cn.includes('Strafe') ? 'x' : 'z';
  const out = [];
  for (const bone of ['foot', 'toes']) for (const thr of [0.01, 0.02]) {
    const vs = [];
    for (const sd of ['l', 'r']) { const ps = P[bone + sd]; const mn = Math.min(...ps.map((p) => p.y)); for (let i = 0; i < N; i++) { const j = (i + 1) % N; if (ps[i].y < mn + thr && ps[j].y < mn + thr) vs.push(Math.abs((ps[j][ax] - ps[i][ax]) / dt)); } }
    vs.sort((a, b) => a - b); out.push(`${bone}@${thr * 100}cm ${vs[Math.floor(vs.length / 2)].toFixed(2)}`);
  }
  console.log(cn.padEnd(22), 'T', T.toFixed(3), out.join(' | '));
}
