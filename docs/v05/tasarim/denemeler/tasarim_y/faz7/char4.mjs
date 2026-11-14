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
const f2 = (v) => v.toArray().map((x) => +x.toFixed(2));
// (a) nisan pozu: el yuvasi konumu
c.hold('pistol');
c.play('Aim', 0, { restart: true }); for (let i = 0; i < 30; i++) c.update(1/60);
const mz = c.held.children[0].localToWorld(c.held.userData.muzzle.clone());
console.log('Aim: handslotR', f2(wp(c.handR)), 'tabanca namlusu', f2(mz), '| combat.shoot alev noktasi (0, 1.45, 0.6)');
// (b) klip boyunca kalca yer degistirmesi ve ayak yuksekligi
const clips = ['Dodge_F','Dodge_B','Dodge_L','Dodge_R','JumpStart','Jump_Land','Atk1','Atk2','Atk3','AtkHeavy','Counter','Punch','Punch2','Kick','HitRecieve','HitRecieve_2','LieUp','PickUp','Interact','Heavy2H','Throw','Death','Cheer','UseItem'];
for (const n of clips) {
  c.hold(null);
  c.mixer.stopAllAction(); c.current = null; c.currentName = null; c.upper = null; c.upperName = null;
  const a = c.play(n, 0, { once: true, restart: true });
  const T = a.getClip().duration; const N = 120; const dt = T / N;
  c.update(0);
  const h0 = wp(B.hips); let maxD = 0, maxDz = 0, maxDx = 0, endD;
  let footMinY = 9, tOff = null; const fl0 = Math.min(wp(B.footl).y, wp(B.footr).y);
  for (let i = 1; i <= N; i++) { c.update(dt); const h = wp(B.hips); const d = Math.hypot(h.x - h0.x, h.z - h0.z); if (d > maxD) { maxD = d; maxDz = h.z - h0.z; maxDx = h.x - h0.x; } const fm = Math.min(wp(B.footl).y, wp(B.footr).y); if (tOff === null && fm > fl0 + 0.05) tOff = i * dt; }
  const he = wp(B.hips); endD = Math.hypot(he.x - h0.x, he.z - h0.z);
  console.log(n.padEnd(13), 'sure', T.toFixed(2), '| kalca en cok yatay', maxD.toFixed(2), 'm (x', maxDx.toFixed(2), 'z', maxDz.toFixed(2) + ')', '| sonda', endD.toFixed(2), 'm', n === 'JumpStart' ? `| ayaklar yerden kesilme anı ${tOff === null ? 'yok' : tOff.toFixed(2) + ' sn'}` : '');
}
