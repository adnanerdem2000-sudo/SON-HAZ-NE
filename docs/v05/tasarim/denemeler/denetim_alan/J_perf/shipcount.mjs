// shipModel.buildShipModel'i sahte tuvalle Node'da kurup örgü/gölge atan sayısını sayar — salt okuma
const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {})), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
const THREE = await import('three');
const { buildShipModel, SHIP_TYPES } = await import('/home/user/SON-HAZ-NE-w2/js/ship/shipModel.js').catch((e) => { console.log('içe aktarma hatası', e.message); process.exit(0); });
const types = SHIP_TYPES || {};
for (const id of Object.keys(types)) {
  const m = buildShipModel(types[id], {});
  let meshes = 0, cast = 0, tris = 0; const mats = new Set();
  m.root.traverse((o) => { if (o.isMesh) { meshes++; if (o.castShadow) cast++; mats.add(o.material); const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  console.log(id.padEnd(12), 'örgü', meshes, 'gölge atan', cast, 'malzeme', mats.size, 'üçgen', Math.round(tris));
}
