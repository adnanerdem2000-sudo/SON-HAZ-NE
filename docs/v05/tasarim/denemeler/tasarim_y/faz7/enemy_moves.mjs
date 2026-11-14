// Salt-okur: düşman MOVES/SPIN/DASH girdilerinde hasar anı (hitAt) ile bilek doğrusal hız tepesinin karşılaştırılması (Faz 7)
import fs from 'fs';
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const src = fs.readFileSync('/home/user/SON-HAZ-NE/js/game/enemies.js', 'utf8');
const MOVES = eval('(' + src.match(/const MOVES = (\{[\s\S]*?\n\});/)[1] + ')');
const SPIN = eval('(' + src.match(/const SPIN = (\{.*?\});/)[1] + ')');
const DASH = eval('(' + src.match(/const DASH = (\{.*?\});/)[1] + ')');
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
new THREE.Scene().add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const rows = [];
const all = [];
for (const set of Object.keys(MOVES)) for (const m of MOVES[set]) all.push([set, m]);
all.push(['SPIN', SPIN], ['DASH', DASH]);
for (const [set, D] of all) {
  c.mixer.stopAllAction(); c.current = null; c.currentName = null;
  const a = c.play(D.anim, 0, { once: true, restart: true, speed: D.speed });
  const clipT = a.getClip().duration; const real = clipT / D.speed; const N = 240; const dt = real / N;
  c.update(0);
  let pr = wp(B.wristr), pl = wp(B.wristl), best = 0, tBest = 0, side = 'R';
  for (let i = 1; i <= N; i++) { c.update(dt); const w = wp(B.wristr), wl = wp(B.wristl); const vr = w.distanceTo(pr) / dt, vl = wl.distanceTo(pl) / dt; const v = Math.max(vr, vl); if (v > best) { best = v; tBest = i * dt; side = vr >= vl ? 'R' : 'L'; } pr = w; pl = wl; }
  const hits = D.hits || [D.hitAt];
  rows.push({ set, anim: D.anim, hiz: D.speed, klipOyunSn: +real.toFixed(2), dur: D.dur, hitAt: hits.join('/'), tepeSn: +tBest.toFixed(2), el: side, farkSn: +(hits[0] - tBest).toFixed(2), donukSn: +Math.max(0, D.dur - real).toFixed(2) });
}
console.table(rows);
