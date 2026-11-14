import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const ids = (process.argv[2] || 'barbarian,rogue').split(',');
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
const clipsToTest = (process.argv[3] || 'Walking_A,Running_A,Running_C,Running_Strafe_Left,Running_Strafe_Right,Walking_Backwards,Walking_B,Walking_C,Running_B').split(',');
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id);
  const s = 1.8 / info.height;
  model.scale.setScalar(s);
  model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model);
  const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model);
  console.log(`== ${id} height=${info.height.toFixed(3)} scale=${s.toFixed(3)}`);
  for (const cn of clipsToTest) {
    const clip = kk.clips[cn];
    if (!clip) { console.log(cn, 'YOK'); continue; }
    mixer.stopAllAction();
    const a = mixer.clipAction(clip); a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.play();
    const N = 480, T = clip.duration, dt = T / N;
    const rec = { footl: [], footr: [] };
    mixer.update(0);
    for (let i = 0; i <= N * 2; i++) {
      if (i > 0) mixer.update(dt);
      root.updateMatrixWorld(true);
      if (i >= N) for (const f of ['footl', 'footr']) { const p = bones[f].getWorldPosition(new THREE.Vector3()); rec[f].push(p); }
    }
    const res = [];
    for (const f of ['footl', 'footr']) {
      const ps = rec[f];
      const minY = Math.min(...ps.map(p => p.y));
      let sumV = new THREE.Vector3(), n = 0;
      for (let i = 1; i < ps.length; i++) {
        if (ps[i].y < minY + 0.03 && ps[i-1].y < minY + 0.03) { sumV.add(ps[i].clone().sub(ps[i-1]).divideScalar(dt)); n++; }
      }
      const v = n ? sumV.divideScalar(n) : new THREE.Vector3();
      const zr = Math.max(...ps.map(p=>p.z)) - Math.min(...ps.map(p=>p.z));
      const xr = Math.max(...ps.map(p=>p.x)) - Math.min(...ps.map(p=>p.x));
      res.push(`${f}: stance ${(n/ps.length*100).toFixed(0)}% v=(${v.x.toFixed(2)},${v.z.toFixed(2)}) |v|=${Math.hypot(v.x,v.z).toFixed(2)} zRange=${zr.toFixed(2)} xRange=${xr.toFixed(2)}`);
    }
    console.log(cn.padEnd(22), 'dur', T.toFixed(3), '|', res.join(' | '));
  }
}
