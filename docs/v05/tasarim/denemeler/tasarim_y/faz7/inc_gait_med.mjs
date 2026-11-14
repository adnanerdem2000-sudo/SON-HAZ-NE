// İnceleme denemesi (salt-okur): doğal hızda bile kalan destek ayağı kaymasının medyanı (43 H01–H03 ölçüt kalibrasyonu)
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
const ids = ['barbarian', 'rogue', 'sk_minion'];
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
for (const id of ids) for (const cn of ['Walking_A', 'Walking_Backwards', 'Running_A', 'Running_C']) {
  const info = kk.info[id]; const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model); const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model); const clip = kk.clips[cn]; const a = mixer.clipAction(clip); a.play();
  const N = 960, dt = clip.duration / N; mixer.update(0); const L = [], R = [];
  for (let i = 0; i <= N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); L.push(bones.footl.getWorldPosition(new THREE.Vector3())); R.push(bones.footr.getWorldPosition(new THREE.Vector3())); }
  const minY = Math.min(...L.map((p) => p.y), ...R.map((p) => p.y));
  for (const thr of [0.03, 0.015]) {
    const us = [];
    for (let i = 1; i <= N; i++) { const P = L[i].y < R[i].y ? L : R; if (P[i].y > minY + thr) continue; us.push([(P[i].x - P[i - 1].x) / dt, (P[i].z - P[i - 1].z) / dt]); }
    const mx = us.reduce((s, u) => s + u[0], 0) / us.length, mz = us.reduce((s, u) => s + u[1], 0) / us.length;
    const dev = us.map((u) => Math.hypot(u[0] - mx, u[1] - mz)).sort((x, y) => x - y);
    const med = dev[Math.floor(dev.length / 2)], p90 = dev[Math.floor(dev.length * 0.9)];
    console.log(`${id.padEnd(10)} ${cn.padEnd(18)} eşik ${thr} | doğal ${Math.hypot(mx, mz).toFixed(2)} m/sn | kalan kayma medyan ${med.toFixed(2)} | %90 ${p90.toFixed(2)} m/sn | örnek ${us.length}`);
  }
}
