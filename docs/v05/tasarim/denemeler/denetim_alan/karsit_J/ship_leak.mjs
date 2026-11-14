// Ship._build eski modeli bırakmıyor: bir yeniden kurulumda sızan geometri/malzeme ve tampon bayt sayısı (salt okuma)
const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {})), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
const THREE = await import('three');
const { buildShipModel, SHIP_TYPES } = await import('/home/user/SON-HAZ-NE-w2/js/ship/shipModel.js');
for (const id of Object.keys(SHIP_TYPES)) {
  const m = buildShipModel(SHIP_TYPES[id], {});
  const geos = new Set(), mats = new Set(), texs = new Set();
  m.root.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (o.material) for (const x of [].concat(o.material)) { mats.add(x); for (const k in x) if (x[k] && x[k].isTexture) texs.add(x[k]); } });
  let bytes = 0;
  for (const g of geos) { for (const k in g.attributes) bytes += g.attributes[k].array.byteLength; if (g.index) bytes += g.index.array.byteLength; }
  console.log(id.padEnd(12), 'geometri', geos.size, 'malzeme', mats.size, 'doku(önbellekli)', texs.size, 'tampon KB', Math.round(bytes / 1024));
}
