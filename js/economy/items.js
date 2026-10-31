import { ICONS } from './icons.js';

// Eşya veritabanı (veri odaklı). Her eşya: ad, kategori, ağırlık (kg), değer (altın), nadirlik, açıklama.

export const CATEGORIES = {
  silah: 'Silahlar', mermi: 'Mermiler', harita: 'Haritalar', ganimet: 'Ganimetler', tas: 'Değerli Taşlar',
  gorev: 'Görev Eşyaları', balik: 'Balıklar', arac: 'Araçlar', sarf: 'Sarf Malzemeleri', koleksiyon: 'Koleksiyon',
};

export const RARITY = {
  siradan: { name: 'Sıradan', color: '#c9c2b0' },
  yaygin: { name: 'Yaygın', color: '#8fd16a' },
  nadir: { name: 'Nadir', color: '#5aa8f0' },
  epik: { name: 'Epik', color: '#c070f0' },
  efsanevi: { name: 'Efsanevi', color: '#f0b030' },
};

export const ITEMS = {
  // Silahlar
  kilic: { name: 'Pala', cat: 'silah', weight: 2.5, value: 120, rarity: 'siradan', icon: 'sword', dmg: 24, desc: 'Güvenilir bir korsan palası.' },
  usta_kilic: { name: 'Usta Palası', cat: 'silah', weight: 2.6, value: 900, rarity: 'nadir', icon: 'sword', dmg: 34, desc: 'Kara Ali\'nin dövdüğü, dengeli ve keskin pala.' },
  tabanca: { name: 'Çakmaklı Tabanca', cat: 'silah', weight: 1.8, value: 260, rarity: 'yaygin', icon: 'pistol', dmg: 48, desc: 'Tek atımlık, doldurması zaman alan güçlü tabanca.' },
  usta_tabanca: { name: 'Gümüş Kakmalı Tabanca', cat: 'silah', weight: 1.9, value: 1200, rarity: 'nadir', icon: 'pistol', dmg: 62, desc: 'Daha hızlı dolan, isabetli bir tabanca.' },
  // Mermiler
  mermi: { name: 'Tabanca Mermisi', cat: 'mermi', weight: 0.05, value: 4, rarity: 'siradan', icon: 'ammo', stack: true, desc: 'Barut ve kurşun.' },
  gulle: { name: 'Top Güllesi', cat: 'mermi', weight: 2, value: 12, rarity: 'siradan', icon: 'ball', stack: true, desc: 'Gemi topları için demir gülle. Gemi ambarına konur.' },
  // Araçlar
  kurek: { name: 'Kürek', cat: 'arac', weight: 2, value: 40, rarity: 'siradan', icon: 'shovel', desc: 'Hazine kazmak için.' },
  olta: { name: 'Basit Olta', cat: 'arac', weight: 1.2, value: 60, rarity: 'siradan', icon: 'rod', rod: { power: 1, line: 1 }, desc: 'Küçük ve orta balıklar için.' },
  usta_olta: { name: 'Usta Oltası', cat: 'arac', weight: 1.4, value: 650, rarity: 'nadir', icon: 'rod', rod: { power: 1.45, line: 1.5 }, desc: 'Sağlam misina ve güçlü makine. Büyük balıklar için.' },
  fener: { name: 'Meşale', cat: 'arac', weight: 0.6, value: 25, rarity: 'siradan', icon: 'torch', desc: 'Mağaralarda ve gecede yolunu aydınlatır (F).' },
  pusula: { name: 'Pusula', cat: 'arac', weight: 0.3, value: 80, rarity: 'yaygin', icon: 'compass', desc: 'Kuzeyi gösterir. Ekranın üstünde yön göstergesini açar (C).' },
  durbun: { name: 'Dürbün', cat: 'arac', weight: 0.8, value: 300, rarity: 'yaygin', icon: 'spyglass', desc: 'Uzakları görmek için nişan tuşuyla yakınlaştır.' },
  tahta: { name: 'Tamir Tahtası', cat: 'sarf', weight: 1.5, value: 15, rarity: 'siradan', icon: 'plank', stack: true, desc: 'Gemi gövdesindeki delikleri onarır.' },
  // Yemler
  yem_solucan: { name: 'Solucan Yemi', cat: 'sarf', weight: 0.05, value: 2, rarity: 'siradan', icon: 'bait', stack: true, bait: 'solucan', desc: 'Kıyı ve resif balıkları için.' },
  yem_karides: { name: 'Karides Yemi', cat: 'sarf', weight: 0.05, value: 5, rarity: 'yaygin', icon: 'bait', stack: true, bait: 'karides', desc: 'Orta boy ve açık deniz balıklarını cezbeder.' },
  yem_yapay: { name: 'Parlak Yapay Yem', cat: 'sarf', weight: 0.08, value: 12, rarity: 'nadir', icon: 'lure', stack: true, bait: 'yapay', desc: 'Yırtıcı balıklar bayılır: baraküda, orkinos.' },
  // Sarf
  muz: { name: 'Muz', cat: 'sarf', weight: 0.2, value: 3, rarity: 'siradan', icon: 'banana', stack: true, heal: 15, desc: 'Can +15. Maymunlar da çok sever.' },
  ekmek: { name: 'Peksimet', cat: 'sarf', weight: 0.3, value: 5, rarity: 'siradan', icon: 'bread', stack: true, heal: 20, desc: 'Denizcilerin sert ekmeği. Can +20.' },
  pismis_balik: { name: 'Izgara Balık', cat: 'sarf', weight: 0.4, value: 14, rarity: 'yaygin', icon: 'cooked', stack: true, heal: 40, desc: 'Han\'da pişirilmiş balık. Can +40.' },
  merhem: { name: 'Şifalı Merhem', cat: 'sarf', weight: 0.2, value: 40, rarity: 'yaygin', icon: 'potion', stack: true, heal: 60, cure: true, desc: 'Can +60, zehri temizler.' },
  // Ganimet & taşlar
  altin_para: { name: 'Altın Sikke', cat: 'ganimet', weight: 0.01, value: 1, rarity: 'siradan', icon: 'coin', stack: true, currency: true, desc: 'Doğrudan cebine para olarak eklenir.' },
  gumus_kulce: { name: 'Gümüş Külçe', cat: 'ganimet', weight: 1.2, value: 55, rarity: 'yaygin', icon: 'bar', stack: true, desc: 'Ağır ama değerli.' },
  altin_kulce: { name: 'Altın Külçe', cat: 'ganimet', weight: 1.5, value: 160, rarity: 'nadir', icon: 'goldbar', stack: true, desc: 'Her tüccarın gözünü parlatır.' },
  deniz_kabugu: { name: 'Deniz Kabuğu', cat: 'koleksiyon', weight: 0.05, value: 6, rarity: 'siradan', icon: 'shell', stack: true, desc: 'Kumsallardan toplanan renkli deniz kabuğu.' },
  istiridye: { name: 'İstiridye', cat: 'ganimet', weight: 0.2, value: 14, rarity: 'yaygin', icon: 'oyster', stack: true, desc: 'İçinden inci çıkabilir. Sedef Hanım değerini bilir.' },
  inci: { name: 'İnci', cat: 'tas', weight: 0.02, value: 45, rarity: 'yaygin', icon: 'pearl', stack: true, desc: 'Resiflerin hediyesi.' },
  yakut: { name: 'Yakut', cat: 'tas', weight: 0.05, value: 140, rarity: 'nadir', icon: 'gem_red', stack: true, desc: 'Kan kırmızısı değerli taş.' },
  zumrut: { name: 'Zümrüt', cat: 'tas', weight: 0.05, value: 160, rarity: 'nadir', icon: 'gem_green', stack: true, desc: 'Orman yeşili değerli taş.' },
  elmas: { name: 'Elmas', cat: 'tas', weight: 0.05, value: 320, rarity: 'epik', icon: 'gem_white', stack: true, desc: 'Işığı binlerce parçaya bölen taş.' },
  eski_mucevher: { name: 'Eski Mücevher Kolye', cat: 'ganimet', weight: 0.3, value: 220, rarity: 'nadir', icon: 'necklace', stack: true, desc: 'Kayıp bir krallığın soylularına ait.' },
  antik_vazo: { name: 'Antik Vazo', cat: 'koleksiyon', weight: 4, value: 260, rarity: 'nadir', icon: 'vase', stack: true, desc: 'Eski uygarlık işi boyalı vazo.' },
  altin_heykelcik: { name: 'Altın Heykelcik', cat: 'koleksiyon', weight: 3, value: 480, rarity: 'epik', icon: 'idol', stack: true, desc: 'Unutulmuş bir deniz tanrısının heykelciği.' },
  kraliyet_taci: { name: 'Kraliyet Tacı', cat: 'koleksiyon', weight: 1.5, value: 1400, rarity: 'efsanevi', icon: 'crown', stack: true, desc: 'Mavi Kırıklar\'ın son kralına ait taç.' },
  eski_kilic: { name: 'Antik Kılıç', cat: 'koleksiyon', weight: 3, value: 340, rarity: 'nadir', icon: 'oldsword', stack: true, desc: 'Paslı ama tarihi değeri yüksek.' },
  korsan_madalyonu: { name: 'Korsan Madalyonu', cat: 'koleksiyon', weight: 0.2, value: 180, rarity: 'nadir', icon: 'medal', stack: true, desc: 'Eski korsan loncasının nişanı.' },
  lanetli_kafatasi: { name: 'Lanetli Kafatası', cat: 'ganimet', weight: 1, value: 210, rarity: 'nadir', icon: 'skull', stack: true, blackmarket: true, desc: 'İskelet kaptanlardan düşer. Kara borsada değerli.' },
  // Haritalar
  hazine_haritasi: { name: 'Hazine Haritası', cat: 'harita', weight: 0.05, value: 80, rarity: 'yaygin', icon: 'map', desc: 'İpuçlarını çöz, yeri bul ve kaz.' },
  sise_mesaj: { name: 'Şişede Mesaj', cat: 'harita', weight: 0.3, value: 20, rarity: 'yaygin', icon: 'bottle', desc: 'Kullanınca içinden bir harita ya da not çıkar.' },
  harita_parcasi: { name: 'Mira Veyl\'in Harita Parçası', cat: 'gorev', weight: 0.05, value: 0, rarity: 'efsanevi', icon: 'mappiece', nosell: true, desc: 'Son Hazine\'ye giden parçalı haritanın bir parçası.' },
  // Görev
  eski_gunluk: { name: 'Serdümen Halil\'in Günlüğü', cat: 'gorev', weight: 0.4, value: 0, rarity: 'epik', icon: 'journal', nosell: true, desc: 'Mira Veyl\'in serdümeninin eski günlüğü.' },
  kizil_mektup: { name: 'Kızıl Hançer\'in Mektubu', cat: 'gorev', weight: 0.1, value: 0, rarity: 'epik', icon: 'letter', nosell: true, desc: 'Yitik Ufuk\'tan söz eden mühürlü mektup.' },
  baharat: { name: 'Baharat Kesesi', cat: 'koleksiyon', weight: 0.4, value: 70, rarity: 'yaygin', icon: 'spice', stack: true, desc: 'Uzak doğunun safran ve tarçını. Limanda değerli bir hediye.' },
  ipek: { name: 'İpek Top', cat: 'koleksiyon', weight: 1, value: 150, rarity: 'nadir', icon: 'silk', stack: true, desc: 'Parlak, yumuşak ipek kumaş. Terziler bayılır.' },
  hayvan_postu: { name: 'Yaban Domuzu Postu', cat: 'ganimet', weight: 2, value: 18, rarity: 'siradan', icon: 'hide', stack: true, desc: 'Tüccarlar deri için alır.' },
  timsah_derisi: { name: 'Timsah Derisi', cat: 'ganimet', weight: 3, value: 75, rarity: 'yaygin', icon: 'hide', stack: true, desc: 'Sağlam ve değerli deri.' },
};

// Sandık türleri (dünyada taşınan fiziksel sandıklar)
export const CHEST_TIERS = {
  small: { name: 'Küçük Sandık', weight: 15, value: 160, carrySpeed: 0.85, twoPlayer: false, color: 0x8a5a32, scale: 0.8 },
  medium: { name: 'Denizci Sandığı', weight: 35, value: 420, carrySpeed: 0.62, twoPlayer: false, color: 0x6b4a2c, scale: 1.0 },
  large: { name: 'Kaptan Sandığı', weight: 70, value: 1100, carrySpeed: 0.38, twoPlayer: true, color: 0x4a2f1a, scale: 1.3 },
  legend: { name: 'Mira Veyl\'in Sandığı', weight: 90, value: 3000, carrySpeed: 0.32, twoPlayer: true, color: 0x2a1a3a, scale: 1.45 },
};

export function itemName(id, data) {
  if (id.startsWith('balik:')) return data?.name || 'Balık';
  return ITEMS[id]?.name || id;
}

export function itemDef(id) {
  if (id.startsWith('balik:')) return { name: 'Balık', cat: 'balik', weight: 1, value: 10, rarity: 'siradan', icon: 'fish', stack: false };
  return ITEMS[id];
}

export function itemWeight(stack) {
  if (stack.id.startsWith('balik:')) return stack.data?.weight || 1;
  return (ITEMS[stack.id]?.weight || 0.1) * (stack.n || 1);
}

export function itemValue(stack) {
  if (stack.id.startsWith('balik:')) return Math.round(stack.data?.value || 10);
  return (ITEMS[stack.id]?.value || 0) * (stack.n || 1);
}

export function iconSVG(stackOrId, color) {
  const id = typeof stackOrId === 'string' ? stackOrId : stackOrId.id;
  let key = 'map';
  if (id.startsWith('balik:')) key = 'fish';
  else if (id.startsWith('sandik:')) key = 'chest';
  else key = ITEMS[id]?.icon || 'map';
  let body = ICONS[key] || ICONS.map;
  if (key === 'fish' && color) body = body.replace(/#5aa8d0/g, color);
  return `<svg viewBox="0 0 48 48" width="100%" height="100%">${body}</svg>`;
}
