// build-single-html.mjs prelude içindeki key() mantığının birebir kopyası (salt-okur benzetim)
const F = { 'assets/models/chest.glb': 'x', 'assets/audio/sfx/coin.ogg': 'y' }, C = {};
function key(u) {
  var s = String(u), i = s.indexOf('assets/');
  if (i < 0) return null;
  s = s.slice(i).split('?')[0].split('#')[0];
  try { s = decodeURIComponent(s); } catch (e) {}
  return (F[s] || C[s]) ? s : null;
}
const base = (dir) => new URL('assets/models/chest.glb', `file://${dir}/DenizKorsanlari-SonHazine.html`).href; // three FileLoader: new Request(url) mutlak URL
for (const dir of ['/home/u/Downloads', '/home/u/assets', '/home/u/game-assets', '/C:/Users/u/Desktop/oyun_assets', '/home/u/Masaüstü']) {
  const abs = base(dir);
  console.log(JSON.stringify({ klasor: dir, url: abs, anahtar: key(abs) }));
}
console.log(JSON.stringify({ goreli_ses: key('assets/audio/sfx/coin.ogg') }));
