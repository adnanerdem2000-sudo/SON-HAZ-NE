// İnceleme denemesi (salt-okur): oyuncu SWORD/FIST hamleleri ve tekmeler için bilek, bıçak ucu, en ileri erişim ve ayak ölçümü.
import fs from 'fs';
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const src = fs.readFileSync('/home/user/SON-HAZ-NE/js/game/combat.js', 'utf8');
const SW = eval('(' + src.match(/export const SWORD_MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const FI = eval('(' + src.match(/export const FIST_MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const esrc = fs.readFileSync('/home/user/SON-HAZ-NE/js/game/enemies.js', 'utf8');
const MOVES = eval('(' + esrc.match(/const MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
new THREE.Scene().add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const tipOf = () => (B.handslotr || B.wristr).localToWorld(new THREE.Vector3(0, 0.7 / (c.modelScale || 1), 0));
function meas(anim, speed) {
  c.mixer.stopAllAction(); c.current = null; c.currentName = null;
  const a = c.play(anim, 0, { once: true, restart: true, speed });
  const real = a.getClip().duration / speed; const N = 240; const dt = real / N;
  c.update(0); c.root.updateMatrixWorld(true);
  let pr = wp(B.wristr), pt = tipOf();
  let bR = 0, tR = 0, bT = 0, tT = 0, bZ = -1e9, tZ = 0, bF = -1e9, tF = 0, fs2 = 'R';
  for (let i = 1; i <= N; i++) {
    c.update(dt); c.root.updateMatrixWorld(true);
    const r = wp(B.wristr), tp = tipOf(), fr = wp(B.footr), fl = wp(B.footl);
    const vr = r.distanceTo(pr) / dt, vt = tp.distanceTo(pt) / dt;
    if (vr > bR) { bR = vr; tR = i * dt; } if (vt > bT) { bT = vt; tT = i * dt; }
    if (r.z > bZ) { bZ = r.z; tZ = i * dt; }
    const f = Math.max(fr.z, fl.z); if (f > bF) { bF = f; tF = i * dt; fs2 = fr.z >= fl.z ? 'R' : 'L'; }
    pr = r; pt = tp;
  }
  return { real: +real.toFixed(2), R: +tR.toFixed(2), uc: +tT.toFixed(2), ileri: +tZ.toFixed(2), ayakIleri: +tF.toFixed(2) };
}
const rows = [];
for (const [k, D] of Object.entries(SW)) rows.push({ kim: 'oyuncu kılıç ' + k, anim: D.anim, hitAt: D.hitAt, chainAt: D.chainAt, dur: D.dur, ...meas(D.anim, D.speed) });
for (const [k, D] of Object.entries(FI)) rows.push({ kim: 'oyuncu yumruk ' + k, anim: D.anim, hitAt: D.hitAt, chainAt: D.chainAt, dur: D.dur, ...meas(D.anim, D.speed) });
const kick = MOVES.fists.find((m) => m.anim === 'Kick');
rows.push({ kim: 'düşman Kick', anim: 'Kick', hitAt: kick.hitAt, chainAt: '-', dur: kick.dur, ...meas('Kick', kick.speed) });
console.table(rows);
