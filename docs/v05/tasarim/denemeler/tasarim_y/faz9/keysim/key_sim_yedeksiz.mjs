// tools/build-single-html.mjs:79-85 key() (eski) ile önerilen key() (yeni) karşılaştırması — tarayıcı yerine Node URL sınıfı
const F = { 'assets/models/chest.glb': 'x', 'assets/models/kk/kk_anims.glb': 'x', 'assets/audio/sfx/coin.ogg': 'x', 'assets/audio/music/battle_theme_a.mp3': 'x' };
const C = {};
function eskiKey(u) { let s = String(u), i = s.indexOf('assets/'); if (i < 0) return null; s = s.slice(i).split('?')[0].split('#')[0]; try { s = decodeURIComponent(s); } catch (e) {} return (F[s] || C[s]) ? s : null; }
function yeniKeyFab(baseURI) {
  const BASE = String(baseURI).split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  return function key(u) { let s; try { s = new URL(String(u), baseURI).href; } catch (e) { s = String(u); } s = s.split('#')[0].split('?')[0];
    if (s.indexOf(BASE) === 0) s = s.slice(BASE.length); else return null;
    try { s = decodeURIComponent(s); } catch (e) {} return (F[s] || C[s]) ? s : null; };
}
const sayfalar = [
  'file:///home/u/Downloads/DenizKorsanlari-SonHazine.html',
  'file:///home/u/Masa%C3%BCst%C3%BC/DenizKorsanlari-SonHazine.html',
  'file:///home/u/assets/DenizKorsanlari-SonHazine.html',
  'file:///home/u/game-assets/DenizKorsanlari-SonHazine.html?test=1',
  'file:///C:/Users/u/Desktop/oyun_assets/DenizKorsanlari-SonHazine.html#x',
  'file:///home/u/assets/models/DenizKorsanlari-SonHazine.html',
  'http://localhost:8080/dist/DenizKorsanlari-SonHazine.html',
  'https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/DenizKorsanlari-SonHazine.html',
  'https://ornek.example/assets/oyun/DenizKorsanlari-SonHazine.html',
];
const istekler = (sayfa) => [
  ['göreli model (FileLoader → new Request ile mutlak)', new URL('assets/models/chest.glb', sayfa).href],
  ['göreli kk', 'assets/models/kk/kk_anims.glb'],
  ['göreli ses', 'assets/audio/sfx/coin.ogg'],
  ['sorgulu', 'assets/audio/music/battle_theme_a.mp3?v=2'],
  ['dış adres', 'https://0.peerjs.com/peerjs/id'],
  ['data:', 'data:text/plain,assets/models/chest.glb'],
  ['gömülü olmayan varlık', 'assets/models/yok.glb'],
];
const satirlar = [];
for (const p of sayfalar) { const yk = yeniKeyFab(p); for (const [ad, u] of istekler(p)) { const e = eskiKey(u), y = yk(u); satirlar.push({ sayfa: p.replace(/^.*?\/\/[^/]*/, '').slice(0, 60), istek: ad, eski: e, yeni: y }); } }
const fark = satirlar.filter((r) => r.eski !== r.yeni);
console.log('Toplam', satirlar.length, 'durum; eski≠yeni:', fark.length);
for (const r of fark) console.log(JSON.stringify(r));
const yanlisYeni = satirlar.filter((r) => (r.istek.startsWith('göreli') || r.istek === 'sorgulu') && r.yeni === null);
console.log('Yeni key() ile çözülemeyen gömülü varlık isteği:', yanlisYeni.length);
const yanlisEski = satirlar.filter((r) => (r.istek.startsWith('göreli') || r.istek === 'sorgulu') && r.eski === null);
console.log('Eski key() ile çözülemeyen gömülü varlık isteği:', yanlisEski.length, [...new Set(yanlisEski.map((r) => r.sayfa))]);
const yanlisPozitif = satirlar.filter((r) => (r.istek === 'dış adres' || r.istek === 'gömülü olmayan varlık') && r.yeni !== null);
console.log('Yeni key() yanlış pozitif:', yanlisPozitif.length);
