// Salt-okur: Idle pozunda omuz konumu, kol uzunlukları ve dümen/top için erişim taraması (Faz 7 tasarımı)
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './js/core/kk.js';
import { Character } from './js/player/character.js';
import { defaultAppearance } from './js/player/appearance.js';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
const ids = ['barbarian', 'rogue', 'knight', 'mage'];
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id); kk._prepClips(); kk.ready = true;
const wp = (b) => b.getWorldPosition(new THREE.Vector3());
const rows = [];
for (const body of ['kaba', 'cevik', 'subay', 'kahin']) for (const height of [0.94, 1.0, 1.06]) {
  const c = new Character({ ...defaultAppearance('m'), body, height });
  new THREE.Scene().add(c.root); c.root.updateMatrixWorld(true);
  for (let i = 0; i < 10; i++) c.update(1 / 60);
  const B = c.bones;
  const sL = wp(B.upperarml), eL = wp(B.lowerarml), wL = wp(B.wristl), hip = wp(B.hips), head = wp(B.head);
  const l1 = sL.distanceTo(eL), l2 = eL.distanceTo(wL);
  rows.push({ body, height, shoulder: sL.toArray().map((v) => +v.toFixed(3)), l1: +l1.toFixed(3), l2: +l2.toFixed(3), reach: +(l1 + l2).toFixed(3), hipY: +hip.y.toFixed(3), headY: +head.y.toFixed(3) });
}
console.table(rows);
// dümen: çark düzlemi oyuncu kökünden D m ileride, merkez yüksekliği H; kavrama yarıçapı r (yatay iki nokta, th=0)
const minRow = rows.reduce((a, b) => (a.reach < b.reach ? a : b));
const out = [];
for (const D of [0.9, 0.75, 0.6, 0.55, 0.5, 0.45]) for (const r of [0.5, 0.4, 0.35, 0.3]) for (const H of [1.2, 1.1, 1.05]) {
  let worst = 0;
  for (const row of rows) {
    const [sx, sy, sz] = row.shoulder; const t = new THREE.Vector3(r, H * 1, D);
    const d = t.distanceTo(new THREE.Vector3(Math.abs(sx), sy, sz));
    worst = Math.max(worst, d - row.reach);
  }
  out.push({ D, r, H, eksikMaks: +worst.toFixed(3) });
}
console.log('Dümen erişim taraması (eksikMaks <= 0 ise bütün gövde/boylarda ulaşılır; pay için <= -0.03 hedef):');
console.log(out.filter((o) => o.eksikMaks <= 0.05).map((o) => JSON.stringify(o)).join('\n'));
console.log('en kısa kol', JSON.stringify(minRow));
