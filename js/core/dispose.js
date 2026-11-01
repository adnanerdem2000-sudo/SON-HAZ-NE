// Bir nesne ağacının GPU kaynaklarını bırakır: geometriler, malzemeler (isteğe bağlı dokular), örneklenmiş örgü tamponları ve
// klon iskeletlerin kemik dokuları. skip: alt ağacı atlanacak düğüm (ör. varlık önbelleğiyle geometri paylaşan glb klonu).
// three.js'te bırakılan bir kaynak yeniden çizilirse otomatik olarak yeniden yüklenir; paylaşımlı bir kaynağı bırakmanın en kötü
// sonucu bir yeniden yüklemedir, görsel hata değildir.
export function disposeTree(root, { skip = null, textures = false } = {}) {
  if (!root) return;
  const geos = new Set(), mats = new Set();
  const walk = (o) => {
    if (o === skip) return;
    if (o.geometry) geos.add(o.geometry);
    if (o.material) for (const m of [].concat(o.material)) if (m) mats.add(m);
    if (o.isInstancedMesh) o.dispose();
    if (o.isSkinnedMesh) o.skeleton?.dispose?.();
    for (const c of o.children) walk(c);
  };
  walk(root);
  for (const g of geos) g.dispose();
  for (const m of mats) {
    if (textures) for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
    m.dispose();
  }
}
