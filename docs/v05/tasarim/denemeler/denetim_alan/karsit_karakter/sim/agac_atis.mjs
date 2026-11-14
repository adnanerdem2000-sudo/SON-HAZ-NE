// Karşıt deneme: oyuncunun arkasındaki noCam ağaç (kamera içinden geçer) tabanca ışınını durduruyor mu?
// Gerçek camera.js + physics.js; combat.raycast'in engel denetimi birebir: lineBlocked(kamera, isabet, {tMin:0.05,tMax:0.98,rScale:1})
import * as THREE from 'three';
import { physics } from './world/physics.js';
import { tpCamera } from './player/camera.js';
const cam = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 5000);
function run(label, treeZ, treeR, aim) {
  physics.clear();
  // oyuncu (0,0,0), +z'ye bakıyor; kamera arkada (−z). Ağaç oyuncunun arkasında treeZ'de (negatif), props.js'deki gibi noCam
  physics.addCircle(aim ? -0.6 : 0.3, treeZ, treeR, -1, 10, 'tree').noCam = true;
  tpCamera._col = Infinity; tpCamera._colHold = 0; tpCamera._floorY = undefined; tpCamera.yaw = 0; tpCamera.pitch = 0.15;
  const opts = aim ? { dist: 2.3, shoulder: 0.65, fov: 58 } : {};
  tpCamera.dist = aim ? 2.3 : 4.6; tpCamera.targetDist = 4.6;
  const head = new THREE.Vector3(0, 1.55, 0); tpCamera._focus.copy(head);
  for (let i = 0; i < 90; i++) tpCamera.update(cam, head, 1 / 60, { ...opts, snap: true });
  cam.updateMatrixWorld();
  const o = cam.position.clone(), dir = new THREE.Vector3(); cam.getWorldDirection(dir);
  // hedef: nişangâhın tam üstünde, 12 m ileride (kapsül isabet noktası = ışın üzerinde)
  const hit = o.clone().addScaledVector(dir, 12 + o.distanceTo(head));
  const blocked = physics.lineBlocked(o.x, o.y, o.z, hit.x, hit.y, hit.z, { tMin: 0.05, tMax: 0.98, rScale: 1 });
  // oyuncunun gözünden/namludan aynı hedefe görüş
  const muzzle = new THREE.Vector3(0.2, 1.45, 0.6);
  const fromMuzzle = physics.lineBlocked(muzzle.x, muzzle.y, muzzle.z, hit.x, hit.y, hit.z, { tMin: 0.05, tMax: 0.98, rScale: 1 });
  console.log(`${label.padEnd(46)} kamera z=${o.z.toFixed(2)} (bas-kamera ${o.distanceTo(head).toFixed(2)} m) | kameradan isin engelli: ${blocked} | namludan engelli: ${fromMuzzle}`);
}
run('nisansiz, palmiye (r 0,32) 1,5 m arkada', -1.5, 0.32, false);
run('nisansiz, agac (r 0,5*s, s=1,6 -> 0,8) 2,5 m arkada', -2.5, 0.8, false);
run('nisanli (omuz 0,65), palmiye 1,0 m arka-sagda', -1.0, 0.32, true);
run('nisanli, agac r 0,8 1,6 m arkada', -1.6, 0.8, true);
run('karsilastirma: agac yok (uzakta)', -50, 0.3, true);
