// İnceleme denemesi (salt-okur): enemy_moves.mjs yöntemi iki bilekten büyüğünü alıyor. Silah elini (R; kalkan darbesi L)
// ayrı ölçer, ayrıca bıçak ucu (handslotr yerel +Y 0,7 m) hız tepesi ve dürtmelerde en uzak erişim anını verir.
import fs from 'fs';
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const src = fs.readFileSync('/home/user/SON-HAZ-NE/js/game/enemies.js', 'utf8');
const MOVES = eval('(' + src.match(/const MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
new THREE.Scene().add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const tipOf = () => (B.handslotr || B.wristr).localToWorld(new THREE.Vector3(0, 0.7 / (c.modelScale || 1), 0));
const rows = [];
for (const set of Object.keys(MOVES)) for (const D of MOVES[set]) {
  c.mixer.stopAllAction(); c.current = null; c.currentName = null;
  const a = c.play(D.anim, 0, { once: true, restart: true, speed: D.speed });
  const real = a.getClip().duration / D.speed; const N = 240; const dt = real / N;
  c.update(0); c.root.updateMatrixWorld(true);
  let pr = wp(B.wristr), pl = wp(B.wristl), pt = tipOf();
  let bR = 0, tR = 0, bL = 0, tL = 0, bT = 0, tT = 0, bZ = -1e9, tZ = 0;
  for (let i = 1; i <= N; i++) {
    c.update(dt); c.root.updateMatrixWorld(true);
    const r = wp(B.wristr), l = wp(B.wristl), tp = tipOf();
    const vr = r.distanceTo(pr) / dt, vl = l.distanceTo(pl) / dt, vt = tp.distanceTo(pt) / dt;
    if (vr > bR) { bR = vr; tR = i * dt; } if (vl > bL) { bL = vl; tL = i * dt; } if (vt > bT) { bT = vt; tT = i * dt; }
    if (r.z > bZ) { bZ = r.z; tZ = i * dt; }
    pr = r; pl = l; pt = tp;
  }
  rows.push({ set, anim: D.anim, hitAt: D.hitAt, R: +tR.toFixed(2), L: +tL.toFixed(2), ucR: +tT.toFixed(2), enIleriR: +tZ.toFixed(2), 'hitAt-R': +(D.hitAt - tR).toFixed(2), 'hitAt-uc': +(D.hitAt - tT).toFixed(2), 'hitAt-ileri': +(D.hitAt - tZ).toFixed(2) });
}
console.table(rows);
