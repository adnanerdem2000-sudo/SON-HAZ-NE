// port.build'i sahte tuval + yer tutucu GLB modelleriyle Node'da kurar; birleştirilmiş grup örgü/malzeme sayısı — salt okuma
const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
globalThis.window = globalThis; globalThis.location = { search: '' };
const THREE = await import('three');
const { assets } = await import('/home/user/SON-HAZ-NE-w2/js/core/assets.js');
const mk = (nMesh, nMat) => { const g = new THREE.Group(); const mats = Array.from({ length: nMat }, () => new THREE.MeshStandardMaterial()); for (let i = 0; i < nMesh; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats[i % nMat]); m.castShadow = true; m.receiveShadow = true; g.add(m); } return { scene: g, animations: [] }; };
assets.models.barrel = mk(2, 2); assets.models.crate = mk(2, 1);
const { port } = await import('/home/user/SON-HAZ-NE-w2/js/world/port.js');
const scene = new THREE.Scene();
port.build(scene);
for (const c of scene.children) {
  let meshes = 0, cast = 0; const mats = new Set();
  c.traverse((o) => { if (o.isMesh) { meshes++; if (o.castShadow) cast++; mats.add(o.material); } });
  console.log((c.name || c.type).padEnd(16), 'örgü', meshes, 'gölge atan', cast, 'malzeme', mats.size);
}
const b = scene.children.find((c) => /batched/.test(c.name));
const byKind = {}; b.children.forEach((m) => { const k = m.material?.map ? 'dokulu' : (m.material?.emissive && m.material.emissive.getHex() ? 'ışıklı' : 'düz'); byKind[k] = (byKind[k] || 0) + 1; });
console.log('birleşik grup içi dağılım', byKind, 'fener sayısı', port.lanterns.length);
process.exit(0);
