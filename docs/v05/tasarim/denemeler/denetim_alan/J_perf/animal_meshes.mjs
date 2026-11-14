// animals.js prosedürel model fonksiyonlarını (17–320. satırlar) yalıtılmış olarak çalıştırıp örgü/üçgen/malzeme sayar — salt okuma
import fs from 'node:fs';
import * as THREE from '/home/user/SON-HAZ-NE-w2/vendor/three/three.module.js';
import { rng, clamp, lerp } from '/home/user/SON-HAZ-NE-w2/js/core/util.js';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/wildlife/animals.js', 'utf8').split('\n').slice(16, 299).join('\n');
const fn = new Function('THREE', 'rng', 'clamp', 'lerp', src + '\nreturn { boarModel, monkeyModel, crocModel, parrotModel, snakeModel, polarModel };');
const M = fn(THREE, rng, clamp, lerp);
for (const [k, f] of Object.entries(M)) {
  let g; try { g = f(7); } catch (e) { console.log(k, 'HATA', e.message); continue; }
  const root = g.root || g.group || g.mesh || g;
  let meshes = 0, tris = 0, cast = 0; const geos = new Set(), mats = new Set();
  (root.traverse ? root : g.g).traverse((o) => { if (o.isMesh) { meshes++; if (o.castShadow) cast++; geos.add(o.geometry); mats.add(o.material); const gi = o.geometry; tris += (gi.index ? gi.index.count : gi.attributes.position.count) / 3; } });
  console.log(k.padEnd(12), 'örgü', meshes, 'gölge atan', cast, 'geometri', geos.size, 'malzeme', mats.size, 'üçgen', Math.round(tris));
}
