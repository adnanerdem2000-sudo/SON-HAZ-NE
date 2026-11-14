const ctx = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
const { rowboatMesh } = await import('/home/user/SON-HAZ-NE-w2/js/ship/shipModel.js');
const b = rowboatMesh('#8a5a3a'); let n = 0, c = 0; b.traverse((o) => { if (o.isMesh) { n++; if (o.castShadow) c++; } });
console.log('kayık örgü', n, 'gölge atan', c);
