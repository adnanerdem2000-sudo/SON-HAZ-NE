import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const id = 'barbarian';
kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
const anims = await loadGLB(base + 'kk_anims.glb');
kk._anims = anims.animations;
kk._prepChar(id);
kk._prepClips();
const info = kk.info[id];
const model = kk.clone(id);
const s = 1.8 / info.height;
model.scale.setScalar(s); model.position.y = -info.minY * s;
const root = new THREE.Group(); root.add(model); root.updateMatrixWorld(true);
const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
const wp = (n) => bones[n].getWorldPosition(new THREE.Vector3()).toArray().map(v => +v.toFixed(3));
console.log('info', info.height, info.minY, 's', s);
console.log('bind: hips', wp('hips'), 'head', wp('head'), 'footl', wp('footl'), 'upperlegl', wp('upperlegl'));
// hierarchy
let chain = []; for (let o = bones.hips; o; o = o.parent) chain.push(`${o.name||o.type}[s=${o.scale.x.toFixed(3)} p=${o.position.toArray().map(v=>v.toFixed(2))} r=${o.rotation.toArray().slice(0,3).map(v=>(+v).toFixed(2))}]`);
console.log(chain.join(' <- '));
const mixer = new THREE.AnimationMixer(model);
for (const cn of ['Idle', 'Walking_A', 'Running_A']) {
  mixer.stopAllAction(); const a = mixer.clipAction(kk.clips[cn]); a.reset(); a.play(); mixer.update(0.01); root.updateMatrixWorld(true);
  console.log(cn, 'hips', wp('hips'), 'head', wp('head'), 'footl', wp('footl'), 'footr', wp('footr'));
}
// track names of Walking_A
const tr = kk.clips['Walking_A'].tracks.map(t => t.name);
console.log('tracks', tr.length, tr.filter(n => /position|scale/.test(n)).join(','));
const hp = kk.clips['Walking_A'].tracks.find(t => t.name === 'hips.position');
console.log('hips.position first vals', hp && Array.from(hp.values.slice(0, 6)).map(v=>v.toFixed(3)), 'rest hips local', kk.templates[id].scene.getObjectByName('hips').position.toArray().map(v=>v.toFixed(3)));
console.log('restDelta hips', kk.restDelta.hips);
