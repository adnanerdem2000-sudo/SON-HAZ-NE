import * as THREE from 'three';
import { physics } from './world/physics.js';
import { tpCamera } from './player/camera.js';
// Duvar: x>=0 tarafında 4 m kalın bina kutusu (merkez x=2, yarı genişlik 2), z boyunca 20 m
physics.addBox(2, 0, 2, 10, 0, -5, 10, 'building');
const cam = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 5000);
const run = (label, headX, yaw, opts) => {
  tpCamera._col = Infinity; tpCamera._colHold = 0; tpCamera._floorY = undefined; tpCamera.yaw = yaw; tpCamera.pitch = 0.1; tpCamera.dist = opts.dist ?? 4.6; tpCamera.targetDist = 4.6;
  const head = new THREE.Vector3(headX, 1.55, 0);
  tpCamera._focus.copy(head);
  for (let i = 0; i < 60; i++) tpCamera.update(cam, head, 1 / 60, { ...opts, snap: true });
  const c = cam.position;
  const insideWall = c.x > 0 && c.x < 4 && Math.abs(c.z) < 10;
  console.log(label.padEnd(44), 'kamera', c.toArray().map((v) => +v.toFixed(2)), 'duvar kutusunun icinde:', insideWall);
};
// oyuncu duvarın 0.4 m solunda (baş x=-0.4); kamera oyuncunun arkasında (yaw=0 → oyuncu +z'ye bakar, sağ = -x yönü?)
// tpCamera.right() = (-cos(yaw), 0, sin(yaw)) → yaw=PI icin sag = (+1,0,0) → duvar tarafı
run('normal takip, sag tarafta duvar (0,4 m)', -0.4, Math.PI, {});
run('nisan (omuz 0,65 m), sag tarafta duvar 0,4 m', -0.4, Math.PI, { dist: 2.3, shoulder: 0.65 });
run('nisan (omuz 0,65 m), sag tarafta duvar 0,8 m', -0.8, Math.PI, { dist: 2.3, shoulder: 0.65 });
// sırtı duvara dayalı: kamera arkada duvar yönünde (yaw = -PI/2 → kamera +x tarafında)
run('sirti duvara 0,35 m, kamera duvar yonunde', -0.35, -Math.PI / 2, {});
