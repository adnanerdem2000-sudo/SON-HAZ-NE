import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
const scene = new THREE.Scene(); scene.add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
c.hold('shovel');
const shovel = c.held.children[0]; // makeShovel grubu (sap: yerel y -0.2..0.8 civarı; sap silindiri y=0.3 merkezli 1.0 m)
c.play('Heavy2H', 0, { restart: true, speed: 0.85 });
const seg = new THREE.Line3(); const cp = new THREE.Vector3();
let minD = 9, maxD = 0, sum = 0, n = 0;
for (let i = 0; i < 200; i++) {
  c.update(1.92 / 200); c.root.updateMatrixWorld(true);
  const a = shovel.localToWorld(new THREE.Vector3(0, -0.2, 0)), b = shovel.localToWorld(new THREE.Vector3(0, 0.8, 0));
  seg.set(a, b); seg.closestPointToPoint(wp(B.wristl), true, cp);
  const d = cp.distanceTo(wp(B.wristl)); minD = Math.min(minD, d); maxD = Math.max(maxD, d); sum += d; n++;
}
console.log('kazi (Heavy2H, 0.85x): sol bilek - kurek sapi mesafesi min', minD.toFixed(2), 'ort', (sum / n).toFixed(2), 'maks', maxD.toFixed(2), 'm');
const hb = shovel.localToWorld(new THREE.Vector3(0, 0.9, 0)); console.log('kurek agzi ornek konum', hb.toArray().map(v=>+v.toFixed(2)));
c.play('Heavy2H', 0, { restart: true, speed: 0.85 });
let minY = 9, tMin = 0;
for (let i = 0; i < 200; i++) { c.update(1.92 / 200); c.root.updateMatrixWorld(true); const tip = shovel.localToWorld(new THREE.Vector3(0, 1.06, 0)); if (tip.y < minY) { minY = tip.y; tMin = (i + 1) * 1.92 / 200; } }
console.log('kurek ucu en alcak yukseklik', minY.toFixed(2), 'm, an', tMin.toFixed(2), 'sn (dongu 1.92 sn); toprak efekti setInterval 380 ms gercek zaman');
