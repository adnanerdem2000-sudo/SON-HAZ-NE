import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const ids = (process.argv[2] || 'barbarian,rogue').split(',');
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
const clipsToTest = ['Walking_A','Walking_Backwards','Running_A','Running_C','Running_Strafe_Left','Running_Strafe_Right'];
// oyun kodundaki referans hızlar (player.js _locomotion)
const REF = { Walking_A: 1.9, Walking_Backwards: 1.9, Running_A: 5.2, Running_C: 6.6, Running_Strafe_Left: 3.6, Running_Strafe_Right: 3.6 };
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id);
  const s = 1.8 / info.height;
  model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model);
  const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model);
  console.log(`== ${id}`);
  for (const cn of clipsToTest) {
    const clip = kk.clips[cn];
    mixer.stopAllAction();
    const a = mixer.clipAction(clip); a.reset(); a.play();
    const N = 960, T = clip.duration, dt = T / N;
    mixer.update(0); root.updateMatrixWorld(true);
    let prevL = bones.footl.getWorldPosition(new THREE.Vector3()), prevR = bones.footr.getWorldPosition(new THREE.Vector3());
    const hip0 = bones.hips.getWorldPosition(new THREE.Vector3());
    let dist = new THREE.Vector3(), hipMin = 9, hipMax = -9, hipZmin = 9, hipZmax = -9;
    for (let i = 1; i <= N; i++) {
      mixer.update(dt); root.updateMatrixWorld(true);
      const L = bones.footl.getWorldPosition(new THREE.Vector3()), R = bones.footr.getWorldPosition(new THREE.Vector3());
      const sup = L.y <= R.y ? [L, prevL] : [R, prevR];
      dist.add(sup[1].clone().sub(sup[0])); // destek ayağının geriye kayışı = gövdenin ilerlemesi
      prevL = L; prevR = R;
      const h = bones.hips.getWorldPosition(new THREE.Vector3()); hipMin = Math.min(hipMin, h.y); hipMax = Math.max(hipMax, h.y); hipZmin = Math.min(hipZmin, h.z); hipZmax = Math.max(hipZmax, h.z);
    }
    const v = dist.clone().divideScalar(T);
    const vn = Math.hypot(v.x, v.z);
    const ref = REF[cn];
    // oyunda hız hs iken timeScale = hs/ref (kenetlenmeden önce); ayak hızı = vn*hs/ref; kayma oranı = 1 - vn/ref
    console.log(cn.padEnd(22), `dogal hiz=${vn.toFixed(2)} m/sn (x ${v.x.toFixed(2)}, z ${v.z.toFixed(2)})  kod ref=${ref}  kayma orani=%${((1 - vn / ref) * 100).toFixed(0)}  kalca y ${hipMin.toFixed(2)}-${hipMax.toFixed(2)} z ${hipZmin.toFixed(2)}..${hipZmax.toFixed(2)}`);
  }
}
