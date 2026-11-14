import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
for (const id of ['barbarian', 'rogue']) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ['barbarian', 'rogue']) kk._prepChar(id);
kk._prepClips();
kk.ready = true;
const app = defaultAppearance('m');
const c = new Character(app);
const scene = new THREE.Scene(); scene.add(c.root);
const B = c.bones;
const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const f3 = (v) => v.toArray().map((x) => +x.toFixed(3));
c.update(0.016);
console.log('Idle: head', f3(wp(B.head)), 'hips', f3(wp(B.hips)), 'wristR', f3(wp(B.wristr)), 'shoulderR', f3(wp(B.upperarmr)), 'footl', f3(wp(B.footl)));
// armspan
const l1 = wp(B.upperarmr).distanceTo(wp(B.lowerarmr)), l2 = wp(B.lowerarmr).distanceTo(wp(B.wristr));
console.log('kol uzunlugu (ust+alt)', (l1 + l2).toFixed(3), 'omuz genisligi', wp(B.upperarml).distanceTo(wp(B.upperarmr)).toFixed(3));
const L1 = wp(B.upperlegl).distanceTo(wp(B.lowerlegl)), L2 = wp(B.lowerlegl).distanceTo(wp(B.footl));
console.log('bacak uzunlugu (ust+alt)', (L1 + L2).toFixed(3));
// tasima: eller W(±0.3, 1.02, 0.42) hedefinde mi?
c.overlay = { carry: true }; for (let i = 0; i < 5; i++) c.update(0.016);
console.log('carry: wristL', f3(wp(B.wristl)), 'wristR', f3(wp(B.wristr)), 'hedef L (0.3,1.02,0.42) R (-0.3,1.02,0.42)');
// cömelme: 3 sn bekle, bas yuksekligi
c.overlay = { crouch: true }; for (let i = 0; i < 180; i++) c.update(1/60);
console.log('crouch 3sn: head y', wp(B.head).y.toFixed(3), 'hips y', wp(B.hips).y.toFixed(3));
c.overlay = {}; for (let i = 0; i < 30; i++) c.update(1/60);
console.log('crouch sonrasi: head y', wp(B.head).y.toFixed(3));
// yuzme: model pitch 1.2, lift 1, swim overlay
c.model.rotation.x = 1.2; c.overlay = { swim: true, swimPhase: 0, lift: 1 };
const shR = [], hR = [], tgt = [];
for (let i = 0; i < 90; i++) { c.overlay.swimPhase += (1/60) * 4.2; c.update(1/60); if (i % 15 === 0) { const sh = c.root.worldToLocal(wp(B.upperarmr)), h = c.root.worldToLocal(wp(B.wristr)), hd = c.root.worldToLocal(wp(B.head)); const t = c.overlay.swimPhase; console.log(`swim t=${t.toFixed(2)} omuzR`, f3(sh), 'elR', f3(h), 'hedefR', [-0.35 - Math.cos(t) * 0.15, 1.35 - Math.sin(t) * 0.3, 0.55 - Math.cos(t) * 0.25].map(v=>+v.toFixed(2)), 'bas', f3(hd)); } }
