import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const bodies = ['barbarian', 'rogue', 'knight', 'mage'];
for (const id of bodies) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of bodies) kk._prepChar(id); kk._prepClips(); kk.ready = true;
const f3 = (v) => v.toArray().map((x) => +x.toFixed(2));
for (const body of ['kaba', 'cevik', 'subay', 'kahin']) {
  for (const height of [0.94, 1.0, 1.06]) {
    const app = { ...defaultAppearance('m'), body, height };
    const c = new Character(app);
    const scene = new THREE.Scene(); scene.add(c.root); c.root.rotation.set(0, 0, 0); c.root.updateMatrixWorld(true);
    const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
    const res = [];
    // dumen: carkin merkezi ayaklardan (0, 1.2, 0.9) ileride; tutma noktalari yaricap 0.5, yerel z -0.06 (th=0)
    const helmL = new THREE.Vector3(0.5, 1.2, 0.84), helmR = new THREE.Vector3(-0.5, 1.2, 0.84);
    // top: oyuncu top kokeninin 1.2 m gerisinde; hedef top yereli (±0.28, 0.62, -0.5) -> oyuncuya gore (±0.28, 0.62, 0.7)
    const canL = new THREE.Vector3(0.28, 0.62, 0.7), canR = new THREE.Vector3(-0.28, 0.62, 0.7);
    for (const [name, L, R, ov] of [['dumen', helmL, helmR, { helm: true }], ['top', canL, canR, {}]]) {
      c.overlay = ov; c.ik.handL = L.clone(); c.ik.handR = R.clone(); c.ik.w = 1;
      for (let i = 0; i < 10; i++) c.update(1/60);
      const eL = wp(B.wristl).distanceTo(L), eR = wp(B.wristr).distanceTo(R);
      res.push(`${name}: el-hedef L ${eL.toFixed(2)} m, R ${eR.toFixed(2)} m`);
    }
    c.ik.handL = c.ik.handR = null; c.overlay = {};
    console.log(`${body} boy ${height}:`, res.join(' | '));
    c.dispose();
  }
}
