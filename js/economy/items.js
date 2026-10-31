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

// Basit SVG simgeler
const ICONS = {
  sword: '<path d="M8 40 L36 12 L40 8 L38 14 L12 42 Z" fill="#cfd5dc"/><path d="M6 34 L14 42" stroke="#c9a227" stroke-width="4"/><path d="M4 44 L9 39" stroke="#5a3418" stroke-width="5"/>',
  oldsword: '<path d="M8 40 L36 12 L40 8 L38 14 L12 42 Z" fill="#9a8a6a"/><path d="M6 34 L14 42" stroke="#7a6a3a" stroke-width="4"/><path d="M4 44 L9 39" stroke="#3a2418" stroke-width="5"/>',
  pistol: '<rect x="14" y="16" width="26" height="7" rx="2" fill="#555"/><path d="M14 16 L10 34 L18 36 L22 23 Z" fill="#6b3a1a"/>',
  ammo: '<circle cx="18" cy="26" r="5" fill="#888"/><circle cx="28" cy="22" r="5" fill="#999"/><circle cx="26" cy="32" r="5" fill="#777"/>',
  ball: '<circle cx="24" cy="26" r="13" fill="#2a2a2a"/><circle cx="19" cy="21" r="4" fill="#555"/>',
  shovel: '<rect x="22" y="4" width="4" height="26" fill="#8a6238"/><path d="M15 28 H33 L30 44 H18 Z" fill="#888"/>',
  rod: '<path d="M8 42 L40 6" stroke="#6b4a2c" stroke-width="3"/><path d="M40 6 Q42 24 34 30" stroke="#ddd" fill="none"/><circle cx="12" cy="38" r="4" fill="#999"/>',
  torch: '<rect x="21" y="18" width="6" height="26" fill="#5a3418"/><path d="M24 4 C32 12 30 20 24 20 C18 20 16 12 24 4 Z" fill="#ffa030"/>',
  compass: '<circle cx="24" cy="24" r="17" fill="#c9a227"/><circle cx="24" cy="24" r="13" fill="#f2e6c8"/><path d="M24 12 L28 24 L24 36 L20 24 Z" fill="#a33"/>',
  spyglass: '<rect x="6" y="20" width="36" height="9" rx="3" fill="#a0702a" transform="rotate(-20 24 24)"/>',
  plank: '<rect x="6" y="18" width="36" height="12" fill="#a07a50"/><line x1="6" y1="24" x2="42" y2="24" stroke="#6b4a2c"/>',
  bait: '<path d="M10 30 C16 18 26 34 34 22 C38 16 42 20 40 24" stroke="#c87a7a" stroke-width="5" fill="none"/>',
  lure: '<path d="M14 24 L30 16 L36 24 L30 32 Z" fill="#e0c040"/><circle cx="31" cy="24" r="2" fill="#000"/>',
  banana: '<path d="M10 14 C14 34 30 40 40 34 C28 34 18 28 16 12 Z" fill="#f0d040"/>',
  bread: '<ellipse cx="24" cy="26" rx="16" ry="10" fill="#c8964a"/>',
  cooked: '<ellipse cx="22" cy="26" rx="14" ry="8" fill="#b06a3a"/><path d="M34 26 L42 20 L42 32 Z" fill="#9a5a2a"/>',
  potion: '<rect x="20" y="8" width="8" height="8" fill="#8a6238"/><path d="M14 18 H34 L38 40 H10 Z" fill="#5ad07a"/>',
  coin: '<circle cx="24" cy="24" r="15" fill="#e8c040"/><circle cx="24" cy="24" r="11" fill="none" stroke="#b08a20" stroke-width="2"/>',
  bar: '<path d="M8 32 L14 18 H40 L34 32 Z" fill="#c8ccd2"/>',
  goldbar: '<path d="M8 32 L14 18 H40 L34 32 Z" fill="#e8c040"/>',
  pearl: '<circle cx="24" cy="26" r="11" fill="#f4f0ea"/><circle cx="20" cy="22" r="3" fill="#fff"/>',
  gem_red: '<path d="M24 8 L38 20 L24 42 L10 20 Z" fill="#d03040"/>',
  gem_green: '<path d="M24 8 L38 20 L24 42 L10 20 Z" fill="#30b060"/>',
  gem_white: '<path d="M24 8 L38 20 L24 42 L10 20 Z" fill="#e8f4ff"/>',
  necklace: '<path d="M10 10 Q24 36 38 10" stroke="#e8c040" stroke-width="3" fill="none"/><circle cx="24" cy="30" r="6" fill="#3060d0"/>',
  vase: '<path d="M18 6 H30 L28 12 C38 20 36 38 24 42 C12 38 10 20 20 12 Z" fill="#c07040"/>',
  idol: '<rect x="18" y="8" width="12" height="12" rx="3" fill="#e8c040"/><rect x="16" y="20" width="16" height="20" fill="#d4af37"/>',
  crown: '<path d="M8 34 L10 14 L18 24 L24 10 L30 24 L38 14 L40 34 Z" fill="#e8c040"/><circle cx="24" cy="28" r="3" fill="#d03040"/>',
  medal: '<circle cx="24" cy="28" r="12" fill="#c9a227"/><path d="M18 4 L24 16 L30 4" fill="#a33"/>',
  skull: '<circle cx="24" cy="20" r="13" fill="#e8e2d0"/><rect x="17" y="28" width="14" height="10" fill="#e8e2d0"/><circle cx="19" cy="20" r="4" fill="#222"/><circle cx="29" cy="20" r="4" fill="#222"/>',
  map: '<path d="M6 10 L18 6 L30 10 L42 6 V38 L30 42 L18 38 L6 42 Z" fill="#e8d4a6"/><path d="M26 22 L32 28 M32 22 L26 28" stroke="#a33" stroke-width="3"/>',
  mappiece: '<path d="M8 8 L36 10 L40 26 L30 40 L10 36 Z" fill="#d8c08a"/><path d="M20 20 L26 26 M26 20 L20 26" stroke="#a33" stroke-width="3"/>',
  bottle: '<rect x="20" y="4" width="8" height="8" fill="#8a6238"/><path d="M16 14 H32 V40 H16 Z" fill="#6ab0a0" opacity=".8"/><rect x="19" y="18" width="10" height="16" fill="#efe0b8"/>',
  journal: '<rect x="10" y="8" width="28" height="34" fill="#6b3a1a"/><rect x="14" y="12" width="20" height="26" fill="#e8d4a6"/>',
  letter: '<rect x="8" y="12" width="32" height="24" fill="#efe0b8"/><circle cx="24" cy="30" r="5" fill="#a33"/>',
  hide: '<path d="M8 14 C16 6 32 6 40 14 L36 38 C28 44 20 44 12 38 Z" fill="#8a5a3a"/>',
  fish: '<path d="M8 24 C16 12 32 12 38 24 C32 36 16 36 8 24 Z" fill="#5aa8d0"/><path d="M38 24 L46 16 L46 32 Z" fill="#5aa8d0"/><circle cx="16" cy="22" r="2" fill="#000"/>',
  chest: '<rect x="8" y="18" width="32" height="20" fill="#8a5a32"/><path d="M8 18 Q24 6 40 18" fill="#6b4a2c"/><rect x="22" y="22" width="4" height="6" fill="#e8c040"/>',
};

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
