import fs from 'fs';
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/game/combat.js', 'utf8');
const SWORD_MOVES = eval('(' + src.match(/export const SWORD_MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const FIST_MOVES = eval('(' + src.match(/export const FIST_MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
const scene = new THREE.Scene(); scene.add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
for (const [set, T] of [['kilic', SWORD_MOVES], ['yumruk', FIST_MOVES]]) for (const k of Object.keys(T)) {
  const D = T[k];
  c.mixer.stopAllAction(); c.current = null; c.currentName = null;
  const a = c.play(D.anim, 0, { once: true, restart: true, speed: D.speed });
  const clipT = a.getClip().duration; const N = 200; const dt = (clipT / D.speed) / N;
  c.update(0);
  let pr = wp(B.wristr), pl = wp(B.wristl), best = 0, tBest = 0;
  for (let i = 1; i <= N; i++) { c.update(dt); const w = wp(B.wristr), wl = wp(B.wristl); const v = Math.max(w.distanceTo(pr), set === 'yumruk' ? wl.distanceTo(pl) : 0) / dt; if (v > best) { best = v; tBest = i * dt; } pr = w; pl = wl; }
  console.log(`${set} ${k} (${D.anim}) klip ${(clipT / D.speed).toFixed(2)} sn oyun; eylem ${D.dur} sn (klibin %${Math.min(100, D.dur / (clipT / D.speed) * 100).toFixed(0)}'i) | hitAt ${D.hitAt} sn | el hızı tepe ${tBest.toFixed(2)} sn | fark ${(D.hitAt - tBest).toFixed(2)} sn`);
}
