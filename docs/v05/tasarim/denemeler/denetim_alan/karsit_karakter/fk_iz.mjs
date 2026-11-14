// Ayak izi dökümü: klip boyunca footl/toesl y ve z (metre, model uzayı, gövde +z'ye bakar)
import * as THREE from 'three';
import { loadGLB } from '../loadglb.mjs';
import { kk } from '/home/user/SON-HAZ-NE-w2/js/core/kk.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const id = process.argv[2] || 'rogue';
const cn = process.argv[3] || 'Running_A';
kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar(id); kk._prepClips();
const info = kk.info[id];
const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
const root = new THREE.Group(); root.add(model);
const B = {}; model.traverse((o) => { if (o.isBone) B[o.name] = o; });
const mixer = new THREE.AnimationMixer(model);
const clip = kk.clips[cn]; const a = mixer.clipAction(clip); a.play(); mixer.update(0);
const N = 48, T = clip.duration, dt = T / N;
const wp = (n) => B[n].getWorldPosition(new THREE.Vector3());
for (let i = 0; i <= N; i++) {
  if (i) mixer.update(dt); root.updateMatrixWorld(true);
  const fl = wp('footl'), tl = wp('toesl'), fr = wp('footr'), tr = wp('toesr');
  console.log(`${(i * dt).toFixed(3)}  L foot y ${fl.y.toFixed(3)} z ${fl.z.toFixed(3)} toe y ${tl.y.toFixed(3)} z ${tl.z.toFixed(3)} | R foot y ${fr.y.toFixed(3)} z ${fr.z.toFixed(3)} toe y ${tr.y.toFixed(3)} z ${tr.z.toFixed(3)}`);
}
