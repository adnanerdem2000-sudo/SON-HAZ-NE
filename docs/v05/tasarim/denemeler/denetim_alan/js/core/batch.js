import * as THREE from 'three';
import { toFloatGeometry } from './assets.js';

// Statik nesneleri malzemeye göre birleştirerek çizim çağrısı sayısını azaltır.
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const keep = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.userData.noMerge) return;
    const key = o.material.uuid;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { material: o.material, geos: [], cast: false, recv: false }));
    let g = toFloatGeometry(o.geometry);
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(o.matrixWorld);
    b.geos.push(g);
    b.cast = b.cast || o.castShadow;
    b.recv = b.recv || o.receiveShadow;
    keep.push(o);
  });
  const out = new THREE.Group();
  out.name = (root.name || 'static') + '-batched';
  for (const [, b] of buckets) {
    let n = 0;
    for (const g of b.geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let col = null;
    if (b.geos.some((g) => g.attributes.color)) col = new Float32Array(n * 3).fill(1);
    let o = 0;
    for (const g of b.geos) {
      if (!g.attributes.normal) g.computeVertexNormals();
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2);
      if (col && g.attributes.color && g.attributes.color.itemSize === 3) col.set(g.attributes.color.array, o * 3);
      o += c;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, b.material);
    m.castShadow = b.cast; m.receiveShadow = b.recv;
    m.matrixAutoUpdate = false;
    out.add(m);
  }
  // birleştirilemeyenleri (sprite, çizgi vb.) koru
  const rest = [];
  root.traverse((o) => { if (o !== root && !keep.includes(o) && (o.isSprite || o.isLine || o.isPoints || o.isInstancedMesh || (o.isMesh && (Array.isArray(o.material) || o.userData.noMerge)))) rest.push(o); });
  for (const r of rest) { const w = r.matrixWorld.clone(); r.parent.remove(r); r.matrixAutoUpdate = false; r.matrix.copy(w); out.add(r); }
  return out;
}
