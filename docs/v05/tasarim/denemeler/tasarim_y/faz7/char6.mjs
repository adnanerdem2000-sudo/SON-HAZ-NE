import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
const scene = new THREE.Scene(); scene.add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
c.play('Walk', 0.2); let minH = 9; for (let i = 0; i < 120; i++) { c.update(1/60); minH = Math.min(minH, wp(B.head).y); }
console.log('olum oncesi yuruyus en dusuk bas', minH.toFixed(3));
c.startRagdoll({ ground: () => 0, vel: new THREE.Vector3(1, 0, 0), impulse: new THREE.Vector3(3, 1.2, 0) });
for (let i = 0; i < 300; i++) c.update(1/60);
console.log('ragdoll sonu bas y', wp(B.head).y.toFixed(3), 'kalca', wp(B.hips).toArray().map(v=>+v.toFixed(2)));
c.stopRagdoll();
c.play('LieUp', 0.1, { once: true, restart: true, speed: 2.33 / 1.3 });
c.update(1/60);
console.log('getup ilk kare bas y (ayakta=~1.17, yatar=~0.2):', wp(B.head).y.toFixed(3), 'kalca', wp(B.hips).toArray().map(v=>+v.toFixed(2)));
for (let i = 0; i < 90; i++) c.update(1/60);
c.play('Walk', 0.2); minH = 9; for (let i = 0; i < 120; i++) { c.update(1/60); minH = Math.min(minH, wp(B.head).y); }
console.log('dirilis sonrasi yuruyus en dusuk bas', minH.toFixed(3));
