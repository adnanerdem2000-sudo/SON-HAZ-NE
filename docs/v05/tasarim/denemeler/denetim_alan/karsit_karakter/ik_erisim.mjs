// Dümen/top IK hedeflerine erişim: Idle pozunda omuz (upperarm) dünya konumu, kol boyu (omuz-dirsek-bilek) ve hedefler.
// Hedefler player.js:_updateHelm/_updateCannon ve shipModel.js geometrisinden oyuncu yereline (ayak = 0, ileri +z, sol +x) çevrildi.
import * as THREE from 'three';
import { loadGLB } from '../loadglb.mjs';
import { kk } from '/home/user/SON-HAZ-NE-w2/js/core/kk.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const ids = ['barbarian', 'knight', 'rogue', 'rogue_hooded', 'mage'];
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
// Dümen: tekerlek merkezi istasyondan (0, +1.2, +0.9); hedefler tekerlek yerelinde (±0.5, 0, −0.06) → oyuncu yerelinde (±0.5, 1.2, 0.84)
// Top: oyuncu top yerelinde (0,0,−1.2); hedefler (±0.28, 0.62, −0.5) → oyuncu yerelinde (±0.28, 0.62, 0.7)
const T = { dumen: [new THREE.Vector3(0.5, 1.2, 0.84), new THREE.Vector3(-0.5, 1.2, 0.84)], top: [new THREE.Vector3(0.28, 0.62, 0.7), new THREE.Vector3(-0.28, 0.62, 0.7)] };
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model);
  const B = {}; model.traverse((o) => { if (o.isBone) B[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model); mixer.clipAction(kk.clips['Idle']).play(); mixer.update(0.3); root.updateMatrixWorld(true);
  const wp = (n) => B[n].getWorldPosition(new THREE.Vector3());
  const out = [];
  for (const side of ['l', 'r']) {
    const sh = wp('upperarm' + side), el = wp('lowerarm' + side), wr = wp('wrist' + side), hs = wp('handslot' + side);
    const arm = sh.distanceTo(el) + el.distanceTo(wr), armSlot = arm + wr.distanceTo(hs);
    for (const k of ['dumen', 'top']) {
      const t = T[k][side === 'l' ? 0 : 1];
      const d = sh.distanceTo(t);
      out.push(`${k}-${side}: omuz(${sh.toArray().map((v) => v.toFixed(2))}) hedefe ${d.toFixed(2)} m, kol ${arm.toFixed(2)} (+el yuvasi ${armSlot.toFixed(2)}) -> bilek bosluk ${(d - arm).toFixed(2)} m, el yuvasi bosluk ${(d - armSlot).toFixed(2)} m`);
    }
  }
  console.log('==', id); for (const l of out) console.log('  ' + l);
}
