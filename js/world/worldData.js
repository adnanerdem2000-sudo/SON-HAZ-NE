// Mavi Kırıklar takımadası — ilk oynanabilir bölge verileri.
// Koordinatlar metre cinsinden. Kuzey = -Z (haritada yukarı), Doğu = +X.

export const WORLD_SIZE = 2400; // ±1200 m
export const SEA_FLOOR = -30;

export const ISLANDS = [
  {
    id: 'kirlangic', name: 'Kırlangıç Adası', biome: 'tropik',
    x: 0, z: 0, r: 270, h: 58, seed: 11, hill: 1.0,
    desc: 'Başlangıç adası. Kırlangıç Limanı, yoğun orman, Gözcü Tepesi ve Yankı Mağarası burada.',
  },
  {
    id: 'marti', name: 'Martı Adacığı', biome: 'tropik',
    x: 470, z: 360, r: 82, h: 14, seed: 23, hill: 0.4,
    desc: 'Üç palmiyesiyle bilinen küçük ada. Yakınında eski bir batık yatıyor.',
  },
  {
    id: 'kemik', name: 'Kemik Adası', biome: 'hayalet',
    x: -520, z: -440, r: 135, h: 34, seed: 37, hill: 0.8,
    desc: 'Sisli, terk edilmiş mezarlık adası. Geceleri iskeletler ve hayaletler dolaşır.',
  },
  {
    id: 'papagan', name: 'Papağan Kayalıkları', biome: 'tropik',
    x: -560, z: 420, r: 48, h: 18, seed: 41, hill: 1.2,
    desc: 'Kayalık, papağanlarla dolu küçük ada.',
  },
  {
    id: 'ikiz1', name: 'İkiz Adacıklar (Batı)', biome: 'tropik',
    x: 640, z: -330, r: 44, h: 9, seed: 53, hill: 0.3,
    desc: 'Birbirine çok yakın iki küçük adadan batıdaki.',
  },
  {
    id: 'ikiz2', name: 'İkiz Adacıklar (Doğu)', biome: 'tropik',
    x: 735, z: -280, r: 38, h: 8, seed: 59, hill: 0.3,
    desc: 'İkizlerin doğusundaki ada; sığ resifleriyle ünlü.',
  },
];

// Arazi düzenlemeleri: düzleştirme ve çukurlar
export const TERRAIN_MODS = [
  // Kırlangıç Limanı düzlüğü
  { type: 'flatten', x: 10, z: 222, r: 70, h: 2.6, blend: 30 },
  // Liman önü derin su kanalı
  { type: 'dig', x: 10, z: 300, r: 55, depth: -9, blend: 30 },
  // Timsah Lagünü
  { type: 'dig', x: -150, z: 70, r: 42, depth: -3.2, blend: 22 },
  // Kızıl Hançer kampı
  { type: 'flatten', x: -40, z: -228, r: 34, h: 3.2, blend: 18 },
  // Yankı Mağarası girişi önü
  { type: 'flatten', x: 205, z: -30, r: 16, h: 4.5, blend: 10 },
  // Kemik Adası harabe düzlüğü
  { type: 'flatten', x: -520, z: -440, r: 34, h: 9, blend: 20 },
  // Martı Adacığı hazine düzlüğü
  { type: 'flatten', x: 470, z: 355, r: 20, h: 3.2, blend: 18 },
  // Gelgit kum dili: yalnızca alçak suda açığa çıkar (gelgit ±0.55 m)
  { type: 'flatten', x: 121, z: 201, r: 7, h: -0.14, blend: 9 },
];

// Mağara yolu (taban yüksekliği sabit). Giriş doğu sahilinden içeri kıvrılır.
export const CAVE = {
  id: 'yanki', name: 'Yankı Mağarası',
  floor: 4.5,
  path: [
    [212, -30], [196, -32], [182, -38], [170, -48], [162, -60], [160, -74],
  ],
  chamber: { x: 160, z: -82, r: 9 },
  width: 3.4, height: 4.2,
};

export const PORT = {
  id: 'kirlangic_limani', name: 'Kırlangıç Limanı',
  x: 10, z: 222, yaw: 0,
  pier: { x: 10, z: 262, len: 46, w: 5, h: 2.6 },
  mooring: { x: 26, z: 296, yaw: Math.PI / 2 },
};

// Önemli noktalar (harita, keşif ve görevler için)
export const POIS = [
  { id: 'liman', name: 'Kırlangıç Limanı', x: 10, z: 230, icon: 'port', island: 'kirlangic' },
  { id: 'gozcu', name: 'Gözcü Tepesi', x: -10, z: -20, icon: 'peak', island: 'kirlangic' },
  { id: 'yanki', name: 'Yankı Mağarası', x: 205, z: -30, icon: 'cave', island: 'kirlangic' },
  { id: 'lagun', name: 'Timsah Lagünü', x: -150, z: 70, icon: 'lagoon', island: 'kirlangic' },
  { id: 'kamp', name: 'Kızıl Hançer Kampı', x: -40, z: -228, icon: 'camp', island: 'kirlangic' },
  { id: 'marti_ucpalmiye', name: 'Üç Palmiye', x: 470, z: 355, icon: 'palm', island: 'marti' },
  { id: 'batik', name: 'Martı Batığı', x: 545, z: 470, icon: 'wreck', island: null },
  { id: 'harabe', name: 'Kemik Harabeleri', x: -520, z: -440, icon: 'ruin', island: 'kemik' },
  { id: 'resif', name: 'İkiz Resifi', x: 690, z: -300, icon: 'reef', island: 'ikiz1' },
];

// Hazine kazı noktaları. Her birinin çevresinde ipucu nesneleri dünyada gerçekten bulunur.
export const DIG_SITES = [
  {
    id: 'marti_1', island: 'marti', x: 478, z: 352, tier: 'small',
    clue: 'Üç palmiyenin ortasında dur. Kırık heykelin baktığı yöne beş adım at, kumun altını kaz.',
    landmarks: [
      { type: 'palm', x: 466, z: 346 }, { type: 'palm', x: 472, z: 340 }, { type: 'palm', x: 463, z: 338 },
      { type: 'statue', x: 470, z: 352, yaw: Math.PI / 2 },
    ],
  },
  {
    id: 'marti_2', island: 'marti', x: 430, z: 392, tier: 'medium',
    clue: 'Adanın batısındaki büyük sivri kayanın gölgesi öğlen nereye düşerse, orası.',
    landmarks: [{ type: 'bigrock', x: 426, z: 384 }],
  },
  {
    id: 'kir_1', island: 'kirlangic', x: 115, z: 162, tier: 'small',
    clue: 'Limanın kuzeydoğusunda, devrilmiş kütüğün yanındaki iki kayanın arasında.',
    landmarks: [{ type: 'log', x: 111, z: 158 }, { type: 'rock', x: 119, z: 165 }, { type: 'rock', x: 110, z: 166 }],
  },
  {
    id: 'gelgit_1', island: 'kirlangic', x: 121, z: 201, tier: 'medium', tide: true,
    clue: 'Limanın doğusundaki kum dili yalnızca su çekildiğinde görünür. Alçak suda, kum dilinin ucunu kaz.',
    landmarks: [{ type: 'barrel', x: 125, z: 203 }],
  },
  {
    id: 'kir_2', island: 'kirlangic', x: -205, z: 120, tier: 'medium',
    clue: 'Timsahların lagününün güneybatısında, kırık sütunun dibinde. Dikkatli ol, sular sessizdir.',
    landmarks: [{ type: 'column', x: -207, z: 117 }],
  },
  {
    id: 'kir_3', island: 'kirlangic', x: 60, z: -150, tier: 'large',
    clue: 'Gözcü Tepesi\'nin kuzey yamacında, dikilitaşın kuzeyine on adım.',
    landmarks: [{ type: 'obelisk', x: 60, z: -140 }],
  },
  {
    id: 'kir_4', island: 'kirlangic', x: -230, z: -90, tier: 'small',
    clue: 'Batı sahilinde, kıyıya bakan eski mezarın önünde.',
    landmarks: [{ type: 'grave', x: -232, z: -94 }],
  },
  {
    id: 'kemik_1', island: 'kemik', x: -470, z: -400, tier: 'large',
    clue: 'Kemiklerin adasında, dört sütunun çevrelediği taşın altı. Gece burayı yalnız bırakmaz.',
    landmarks: [{ type: 'column', x: -476, z: -406 }, { type: 'column', x: -464, z: -406 }, { type: 'column', x: -476, z: -394 }, { type: 'column', x: -464, z: -394 }],
  },
  {
    id: 'kemik_2', island: 'kemik', x: -600, z: -470, tier: 'medium',
    clue: 'Mezarlığın batısında, en yaşlı ölü ağacın kökleri arasında.',
    landmarks: [{ type: 'deadtree', x: -603, z: -468 }],
  },
  {
    id: 'papagan_1', island: 'papagan', x: -548, z: 430, tier: 'medium',
    clue: 'Papağanların kayalığında, kamp ateşinin küllerinin yanında.',
    landmarks: [{ type: 'campfire', x: -552, z: 428 }],
  },
  {
    id: 'ikiz_1', island: 'ikiz1', x: 636, z: -322, tier: 'small',
    clue: 'İkizlerin batısında, tek palmiyenin dibinde.',
    landmarks: [{ type: 'palm', x: 633, z: -326 }],
  },
  {
    id: 'ikiz_2', island: 'ikiz2', x: 742, z: -276, tier: 'medium',
    clue: 'Doğu ikizinde, varilin gömüldüğü yer.',
    landmarks: [{ type: 'barrel', x: 739, z: -273 }],
  },
];

// Batık gemi (su altı)
export const WRECKS = [
  { id: 'marti_batigi', name: 'Martı Batığı', x: 545, z: 470, yaw: 0.6, depth: -11 },
];

// Hayvan yayılım bölgeleri
export const SPAWN_ZONES = {
  boar: [{ x: -60, z: 40, r: 120, n: 7 }, { x: 80, z: -90, r: 80, n: 4 }],
  monkey: [{ x: 40, z: 60, r: 90, n: 6 }, { x: -100, z: -60, r: 70, n: 4 }],
  croc: [{ x: -150, z: 70, r: 28, n: 3 }],
  parrot: [{ x: 0, z: 40, r: 150, n: 9 }, { x: -560, z: 420, r: 40, n: 6 }, { x: 470, z: 360, r: 60, n: 3 }],
  snake: [{ x: -80, z: -40, r: 110, n: 6 }, { x: 120, z: 20, r: 60, n: 3 }],
  crab: [
    { x: 150, z: 205, r: 50, n: 5, beach: true }, { x: 470, z: 360, r: 80, n: 6, beach: true },
    { x: -230, z: 160, r: 60, n: 4, beach: true }, { x: 690, z: -300, r: 90, n: 5, beach: true },
  ],
  frog: [{ x: -150, z: 70, r: 50, n: 6 }],
};

export const FISH_ZONES = [
  // Mercan sığlıkları
  { id: 'kirlangic_resif', x: 160, z: 260, r: 90, type: 'reef' },
  { id: 'marti_resif', x: 470, z: 360, r: 140, type: 'reef' },
  { id: 'ikiz_resif', x: 690, z: -300, r: 140, type: 'reef' },
  { id: 'papagan_resif', x: -560, z: 420, r: 100, type: 'reef' },
  // Açık deniz
  { id: 'acik_1', x: 250, z: 600, r: 250, type: 'open' },
  { id: 'acik_2', x: -300, z: 0, r: 200, type: 'open' },
  { id: 'acik_3', x: 300, z: -500, r: 250, type: 'open' },
];
