// İnceleme denemesi (salt-okur): tek klibin bilek/uç hız profili (çift tepe denetimi)
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const [anim, speedS, NS] = process.argv.slice(2);
const speed = +speedS, N = +(NS || 120);
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
kk.templates.barbarian = await loadGLB(base + 'kk_barbarian.glb');
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
kk._prepChar('barbarian'); kk._prepClips(); kk.ready = true;
const c = new Character(defaultAppearance('m'));
new THREE.Scene().add(c.root);
const B = c.bones; const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const tipOf = () => (B.handslotr || B.wristr).localToWorld(new THREE.Vector3(0, 0.7 / (c.modelScale || 1), 0));
const a = c.play(anim, 0, { once: true, restart: true, speed });
const real = a.getClip().duration / speed; const dt = real / N;
c.update(0); c.root.updateMatrixWorld(true);
let pr = wp(B.wristr), pl = wp(B.wristl), pt = tipOf();
const out = [];
for (let i = 1; i <= N; i++) {
  c.update(dt); c.root.updateMatrixWorld(true);
  const r = wp(B.wristr), l = wp(B.wristl), tp = tipOf();
  out.push([+(i * dt).toFixed(3), +(r.distanceTo(pr) / dt).toFixed(2), +(l.distanceTo(pl) / dt).toFixed(2), +(tp.distanceTo(pt) / dt).toFixed(2), +r.z.toFixed(2)]);
  pr = r; pl = l; pt = tp;
}
console.log('t(oyun sn) | R m/sn | L m/sn | uç m/sn | R.z');
for (const o of out) console.log(o.join(" | "));
