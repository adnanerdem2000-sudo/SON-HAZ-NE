// Karşıt deneme: zıpkınla nişanda (omuz 0,65) gövde sağda 0,45 m iken kamera gemi gövdesi katısının içine giriyor mu?
// Gerçek camera.js (hullSolid, hullBlocked); gemi taslağı: yarı genişlik 1 m (stub hullHalfWidth), güverte 1 m (stub deckHeight)
import * as THREE from 'three';
import { physics } from './world/physics.js';
import { tpCamera, hullSolid } from './player/camera.js';
physics.clear();
const T = { L: 14, keel: -1.5 };
const ship = { T, x: 0, z: 0, y: 0, sunk: false, root: { matrixWorld: new THREE.Matrix4() }, model: {}, insideDeck: (x, z, m) => Math.abs(z) < 7 - m && Math.abs(x) < 1 - m, deckAt: () => 1 };
const cam = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 5000);
for (const [label, opts, hx] of [['nisansiz', {}, 1.45], ['zipkin nisani (omuz 0,65)', { dist: 2.3, shoulder: 0.65, fov: 58 }, 1.45], ['zipkin nisani, govdeden 0,8 m', { dist: 2.3, shoulder: 0.65, fov: 58 }, 1.8]]) {
  tpCamera._col = Infinity; tpCamera._colHold = 0; tpCamera._floorY = undefined; tpCamera.yaw = 0; tpCamera.pitch = 0.1;
  tpCamera.dist = opts.dist ?? 4.6; tpCamera.targetDist = 4.6;
  const head = new THREE.Vector3(hx, 0.15, 0); tpCamera._focus.copy(head);
  for (let i = 0; i < 60; i++) tpCamera.update(cam, head, 1 / 60, { ...opts, snap: true, hulls: [ship], surface: true });
  const c = cam.position;
  console.log(label.padEnd(30), 'bas x', hx, '| kamera', c.toArray().map((v) => +v.toFixed(2)), '| govde katisinin icinde:', hullSolid(T, c.x, c.y, c.z));
}
