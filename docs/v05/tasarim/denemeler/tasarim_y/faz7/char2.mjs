import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
for (const id of ['barbarian']) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
const scene = new THREE.Scene(); scene.add(c.root);
const B = c.bones;
const loc = (b) => c.root.worldToLocal(b.getWorldPosition(new THREE.Vector3()));
const f3 = (v) => v.toArray().map((x) => +x.toFixed(2));
for (const [name, pitch, ov] of [['swim (hareketli)', 1.2, { swim: true, lift: 1 }], ['dalis (hareketli)', 1.35, { swim: true, lift: 1 }], ['tread (durgun)', 0.15, { tread: true, lift: 0 }]]) {
  c.model.rotation.x = pitch; c.overlay = { ...ov, swimPhase: 0 };
  let minFootY = 9, maxFootY = -9;
  for (let i = 0; i < 120; i++) { c.overlay.swimPhase += (1/60) * 4.2; c.update(1/60); }
  const hips = loc(B.hips), fl = loc(B.footl), fr = loc(B.footr), kn = loc(B.lowerlegl), sh = loc(B.upperarml), hd = loc(B.head);
  // govde ekseni: kalca -> bas
  const axis = hd.clone().sub(hips).normalize();
  const leg = fl.clone().sub(hips).normalize();
  const ang = Math.acos(Math.max(-1, Math.min(1, axis.dot(leg)))) * 180 / Math.PI;
  console.log(name, 'kalca', f3(hips), 'bas', f3(hd), 'ayakL', f3(fl), 'dizL', f3(kn), '| govde-bacak acisi', ang.toFixed(0) + '° (180=duz uzanmis)');
}
