// Hakem: iki tasarımın önemli noktalarının arazi yüksekliği (değiştirilmemiş v0.4 dünyası)
const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const pts = {
  'A Kevser (5155,421)': [5155, 421], 'B Ateşgül (5092,429)': [5092, 429],
  'A Kor Damarı ağzı (7431,-683)': [7431, -683], 'A Kor Odası (7562,-788)': [7562, -788], 'A baca ağzı (7633,-846)': [7633, -846],
  'B Kor Kulesi tabanı (7538,-900)': [7538, -900], 'Ateş Dağı merkez': [7700, -900],
  'A Obsidyen salon (6300,2700)': [6300, 2700], 'B Obsidyen maden (6387,2663)': [6387, 2663],
  'A Mira Evi (-1760,1460)': [-1760, 1460], 'B defter (-1796,1448)': [-1796, 1448],
  'A Mahzen ağzı (-6716,-6375)': [-6716, -6375], 'A Mahzen salon (-6800,-6400)': [-6800, -6400], 'B Halil (-6735,-6380)': [-6735, -6380],
  'A Sare (-6525,-6368)': [-6525, -6368], 'A Halil mezarı (-6951,-6309)': [-6951, -6309],
  'B Zincir Taşı (-5268,-7850)': [-5268, -7850], 'A Amiral batığı (-5590,-7900)': [-5590, -7900],
  'A Bulut (303,-5108)': [303, -5108], 'B Ayaz (293,-5056)': [293, -5056],
  'A kâşif kampı (-1242,-7300)': [-1242, -7300], 'A Buz Sarayı ağzı (-1347,-7278)': [-1347, -7278], 'A taht salonu (-1449,-7293)': [-1449, -7293],
  'B Ayaz Kulesi (-1456,-7316)': [-1456, -7316], 'B Ayaz Mağarası girişi (-1223,-7419)': [-1223, -7419], 'B Ayaz odası (-1180,-7437)': [-1180, -7437],
  'A Kraliçe Yuvası (1300,-8425)': [1300, -8425],
  'A Nur (-5121,717)': [-5121, 717], 'B Sare (-5083,722)': [-5083, 722],
  'A Kule Zindanı (-6683,2573)': [-6683, 2573], 'B Zindan Kulesi (-6684,2517)': [-6684, 2517], 'Demirkapı hapishane merkezi (-6653,2548)': [-6653, 2548],
  'A Lanetli Ocak (-7519,-1622)': [-7519, -1622], 'B Derin Galeri odası (-7529,-1615)': [-7529, -1615], 'B maden ağzı (-7546,-1566)': [-7546, -1566],
  'A Güneş Örsü (-4900,3900)': [-4900, 3900], 'B Güneş Taşı (-5124,3947)': [-5124, 3947],
  'A tapınak kuyusu (1900,7352)': [1900, 7352], 'tapınak merkezi (1900,7400)': [1900, 7400],
  'Fener (-1243,-1950)': [-1243, -1950], 'A sis kapısı (-560,-2070)': [-560, -2070], 'A Yitik Ufuk (300,-2100)': [300, -2100], 'B Yitik Ufuk (5000,7100)': [5000, 7100],
  'B Perde kapısı (4050,7100)': [4050, 7100],
};
for (const [k, [x, z]] of Object.entries(pts)) {
  let lo = Infinity, hi = -Infinity;
  for (let a = 0; a < 16; a++) for (const r of [2, 4, 6]) { const h = geo.computeHeight(x + Math.cos(a / 16 * 6.283) * r, z + Math.sin(a / 16 * 6.283) * r); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  console.log(k.padEnd(42), geo.computeHeight(x, z).toFixed(1).padStart(7), ' 6 m içinde', lo.toFixed(1), '…', hi.toFixed(1));
}
// Volkanik Dev tetiği: I.r*0.24
const I = { x: 7700, z: -900, r: 540 };
for (const [k, [x, z]] of Object.entries({ 'A Kor Odası': [7562, -788], 'A baca (7591,-812)': [7591, -812], 'A baca (7616,-832)': [7616, -832], 'A baca ağzı': [7633, -846], 'B Kor Kulesi': [7538, -900] })) console.log(k, 'krater merkezine', Math.hypot(x - I.x, z - I.z).toFixed(0), 'm (tetik', (I.r * 0.24).toFixed(0), ')');
