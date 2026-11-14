// Character.hold her çağrıda yeni prosedürel eşya kurar; eskisi dispose edilmeden çıkarılır. Eşya başına kaynak (salt okuma)
const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {})), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
globalThis.window = globalThis; globalThis.location = { search: '' };
const C = await import('/home/user/SON-HAZ-NE-w2/js/player/character.js');
for (const n of ['makeSword', 'makePistol', 'makeShovel', 'makeRod', 'makeHarpoon', 'makeNet', 'makeTorch']) {
  const o = C[n]();
  const geos = new Set(), mats = new Set(); let lights = 0;
  o.traverse((c) => { if (c.geometry) geos.add(c.geometry); if (c.material) for (const m of [].concat(c.material)) mats.add(m); if (c.isLight) lights++; });
  let bytes = 0; for (const g of geos) { for (const k in g.attributes) bytes += g.attributes[k].array.byteLength; if (g.index) bytes += g.index.array.byteLength; }
  const o2 = C[n]();
  let shared = 0; o2.traverse((c) => { if (c.geometry && geos.has(c.geometry)) shared++; });
  console.log(n.padEnd(12), 'geometri', geos.size, 'malzeme', mats.size, 'ışık', lights, 'tampon KB', (bytes / 1024).toFixed(1), 'ikinci çağrıda paylaşılan geometri', shared);
}
