import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
const g = await loadGLB('/home/user/SON-HAZ-NE-w2/assets/models/kk/kit_town.glb');
const want = ['tavern_red', 'home_A_red', 'church_red', 'windmill_red', 'tower_A_red', 'well_red', 'castle_red', 'barracks_red', 'market_red', 'blacksmith_red', 'lumbermill_red', 'mine_red'];
for (const c of g.scene.children) {
  if (!want.includes(c.name)) continue;
  const o = c.clone(true); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
  const b = new THREE.Box3().setFromObject(o);
  console.log(c.name.padEnd(16), 'yari genislik x', ((b.max.x - b.min.x) / 2).toFixed(2), 'z', ((b.max.z - b.min.z) / 2).toFixed(2), 'yukseklik', (b.max.y - b.min.y).toFixed(2));
}
