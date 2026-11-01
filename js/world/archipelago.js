// Büyük dünya kataloğu: 20 × 20 km, altı bölge, elle yerleştirilmiş özel adalar + tohumlu yordamsal adacıklar.
// Saf veri modülüdür (THREE/DOM yok): ana iş parçacığı ve arazi işçisi (Web Worker) aynı veriyi kullanır.
// Koordinatlar metre; Kuzey = -Z, Doğu = +X. Merkezdeki eski takımada (Mavi Kırıklar) worldData.js'dedir.

import { rng } from '../core/util.js';

export const WORLD_HALF = 10000;

export const REGIONS = {
  merkez: { name: 'Ticaret Denizi', biome: 'tropik', desc: 'Ticaret yollarının kesiştiği ılık sular; limanlar ve küçük adalar.' },
  buzul: { name: 'Buzul Denizi', biome: 'buzul', desc: 'Kuzeyin soğuk suları: karlı adalar, buzdağları, kutup ayıları ve kurtlar.' },
  tropik: { name: 'Zümrüt Takımadaları', biome: 'cangil', desc: 'Güneyin sık ormanları, bataklıklar ve kadim tapınaklar.' },
  volkan: { name: 'Kül Adaları', biome: 'volkan', desc: 'Doğunun kara kumları, lav gölleri ve dumanı tüten dağları.' },
  col: { name: 'Kızıl Kum Kıyıları', biome: 'col', desc: 'Batının kavruk kayalıkları, kanyonları, terk edilmiş madenleri.' },
  hayalet: { name: 'Hayalet Denizleri', biome: 'hayalet', desc: 'Uzak kuzeybatının sisli, lanetli suları. Ölüler burada uyumaz.' },
};

// Bölge sınırları (yumuşak geçişler renk/sis tarafında yapılır)
export function regionAt(x, z) {
  if (x < -4200 && z < -4200) return 'hayalet';
  const ax = Math.abs(x), az = Math.abs(z);
  if (Math.max(ax, az) < 3600) return 'merkez';
  if (az >= ax) return z < 0 ? 'buzul' : 'tropik';
  return x > 0 ? 'volkan' : 'col';
}
// bölge içine ne kadar girildiği (0 = sınır, 1 = derin) — sis/renk geçişleri için
export function regionDepth(x, z) {
  const r = regionAt(x, z);
  const ax = Math.abs(x), az = Math.abs(z);
  if (r === 'merkez') return Math.min(1, (3600 - Math.max(ax, az)) / 700);
  if (r === 'hayalet') return Math.min(1, Math.min(-4200 - x, -4200 - z) / 900);
  const m = Math.max(ax, az);
  return Math.min(1, (m - 3600) / 900, Math.abs(ax - az) / 900 + 0.35);
}

// ---------------------------------------------------------------------------
// Özel (elle tasarlanmış) adalar. features: liman, kamp, kale, harabe, mezarlık, tapınak, maden, pazar, boss…
// ---------------------------------------------------------------------------
const UNIQUE = [
  // --- Merkez: Ticaret Denizi ---
  {
    id: 'tuz_pazari', name: 'Tuz Pazarı', biome: 'tropik', x: 1900, z: 950, r: 230, h: 34, hill: 0.7, seed: 101,
    desc: 'Takımadanın en kalabalık ticaret limanı. Tüccarlar, hancılar ve rota kaptanları burada.',
    features: [{ type: 'port', angle: -2.6, style: 'red', size: 1.2, name: 'Tuz Pazarı Limanı' }],
  },
  {
    id: 'korsan_kasabasi', name: 'Terk Edilmiş Korsan Kasabası', biome: 'tropik', x: -1850, z: 1450, r: 210, h: 30, hill: 0.8, seed: 103,
    desc: 'Bir zamanlar korsanların başkenti olan, şimdi haydutların tuttuğu yıkık kasaba.',
    features: [
      { type: 'ruined_town', angle: 0.6, dist: 0.35 },
      { type: 'camp', angle: 2.5, dist: 0.55, enemies: ['haydut', 'haydut', 'haydut_nisanci', 'haydut_avci'], fire: true },
      { type: 'fort', angle: -1.2, dist: 0.5, enemies: ['haydut_agir', 'haydut_nisanci', 'haydut_kaptani'], mini: true },
    ],
  },
  {
    id: 'gizli_pazar', name: 'Gizli Korsan Pazarı', biome: 'tropik', x: 2500, z: -1750, r: 125, h: 40, hill: 1.3, seed: 107, shape: 'spire',
    desc: 'Yalnızca geceleri kurulan yasa dışı pazar. Nadir eşyalar ve sorulmayan sorular.',
    features: [{ type: 'market', angle: 2.4, dist: 0.62 }],
  },
  {
    id: 'fener_kayasi', name: 'Fener Kayası', biome: 'tropik', x: -1250, z: -1950, r: 70, h: 22, hill: 1.2, seed: 109, shape: 'spire',
    desc: 'Eski bir deniz fenerinin yıkıntıları. Fırtınalı gecelerde ışığı hâlâ yanar derler.',
    features: [{ type: 'lighthouse', angle: 0, dist: 0.1 }],
  },
  {
    id: 'mercan_halkasi', name: 'Mercan Halkası', biome: 'tropik', x: 2700, z: 2600, r: 190, h: 7, hill: 0.3, seed: 113, shape: 'atoll',
    desc: 'Ortasında turkuaz bir lagün olan halka biçimli mercan adası. Batık sandıklarla dolu.',
    features: [{ type: 'ruin', angle: 1.2, dist: 0.82, enemies: ['iskelet', 'iskelet_nisanci'], night: ['hayalet'] }],
  },
  // --- Kuzey: Buzul Denizi ---
  {
    id: 'kuzeyfener', name: 'Kuzeyfener', biome: 'buzul', x: 300, z: -5300, r: 260, h: 48, hill: 0.8, seed: 201,
    desc: 'Buzul Denizi\'nin tek limanı. Kürk tüccarları ve balina avcılarının durağı.',
    features: [{ type: 'port', angle: 1.6, style: 'blue', size: 1.0, name: 'Kuzeyfener Limanı' }],
  },
  {
    id: 'buzdisi', name: 'Buzdişi Adası', biome: 'buzul', x: -1500, z: -7300, r: 430, h: 105, hill: 1.0, seed: 203, shape: 'glacier',
    desc: 'Dev buzullarla kaplı dağlık ada. Kutup ayıları ve kar canavarları dolaşır.',
    features: [
      { type: 'camp', angle: 2.0, dist: 0.6, enemies: ['haydut_avci', 'haydut_avci', 'haydut'], fire: true },
      { type: 'ruin', angle: -0.6, dist: 0.45, enemies: ['iskelet', 'iskelet_agir', 'iskelet_nisanci'] },
    ],
  },
  {
    id: 'kurt_adasi', name: 'Kurt Adası', biome: 'buzul', x: 2700, z: -6300, r: 240, h: 60, hill: 1.1, seed: 205,
    desc: 'Çam ormanlarıyla kaplı, kurt sürülerinin adası. Avcılar kampı da burada.',
    features: [{ type: 'camp', angle: 3.0, dist: 0.55, enemies: ['haydut_avci', 'haydut', 'haydut_nisanci'], fire: true }],
  },
  {
    id: 'derin_yarik', name: 'Derin Yarık Kayalıkları', biome: 'buzul', x: 1300, z: -8500, r: 60, h: 26, hill: 1.5, seed: 207, shape: 'spire',
    desc: 'Dipsiz bir deniz yarığının kıyısındaki kayalar. Denizciler Derinlik Yılanı\'ndan söz eder.',
    features: [{ type: 'boss_sea', boss: 'derinlik_yilani', ox: 0, oz: 420 }],
  },
  // --- Güney: Zümrüt Takımadaları ---
  {
    id: 'zumrut_koy', name: 'Zümrüt Koy', biome: 'cangil', x: -300, z: 5300, r: 250, h: 46, hill: 1.0, seed: 301,
    desc: 'Ormanla çevrili liman kasabası. Baharat ve ipek ticaretinin kalbi.',
    features: [{ type: 'port', angle: -1.6, style: 'red', size: 1.0, name: 'Zümrüt Koy Limanı' }],
  },
  {
    id: 'kadim_tapinak', name: 'Kadim Tapınak Adası', biome: 'cangil', x: 1900, z: 7400, r: 480, h: 72, hill: 1.0, seed: 303,
    desc: 'Orman içinde devasa bir taş tapınak. Mekanizmalı kapılar ve Taş Muhafız onu korur.',
    features: [
      { type: 'temple', angle: 0, dist: 0.0, boss: 'tas_muhafiz' },
      { type: 'ruin', angle: 2.4, dist: 0.62, enemies: ['iskelet', 'iskelet', 'iskelet_agir'] },
    ],
  },
  {
    id: 'timsah_batakligi', name: 'Timsah Bataklığı', biome: 'cangil', x: -2500, z: 6700, r: 320, h: 12, hill: 0.4, seed: 305, shape: 'swamp',
    desc: 'Sığ su birikintileri, sarmaşıklar ve timsahlarla dolu bataklık ada.',
    features: [{ type: 'camp', angle: 1.0, dist: 0.5, enemies: ['haydut', 'haydut_nisanci', 'haydut'], fire: true }],
  },
  {
    id: 'batik_sehir', name: 'Batık Şehir', biome: 'cangil', x: 3300, z: 5600, r: 70, h: 10, hill: 0.5, seed: 307, shape: 'spire',
    desc: 'Denizin altına gömülmüş eski bir şehrin kalıntıları. Dalgıçlar için hazine dolu.',
    features: [{ type: 'sunken_city', ox: 0, oz: 160 }],
  },
  // --- Doğu: Kül Adaları ---
  {
    id: 'kul_limani', name: 'Kül Limanı', biome: 'volkan', x: 5300, z: 400, r: 230, h: 40, hill: 0.9, seed: 401,
    desc: 'Kara kumlu bir liman. Kükürt, obsidyen ve barut ticareti yapılır.',
    features: [{ type: 'port', angle: 3.0, style: 'blue', size: 1.0, name: 'Kül Limanı' }],
  },
  {
    id: 'ates_dagi', name: 'Ateş Dağı', biome: 'volkan', x: 7700, z: -900, r: 540, h: 165, hill: 0.6, seed: 403, shape: 'volcano',
    desc: 'Lav gölüyle dolu krateriyle dev volkan. Volkanik Dev kraterde uyur.',
    features: [{ type: 'boss_land', boss: 'volkanik_dev', angle: 0, dist: 0.0 }, { type: 'camp', angle: 2.2, dist: 0.7, enemies: ['haydut', 'haydut_nisanci', 'haydut_agir'], fire: true }],
  },
  {
    id: 'obsidyen', name: 'Obsidyen Adası', biome: 'volkan', x: 6300, z: 2700, r: 210, h: 50, hill: 1.2, seed: 405,
    desc: 'Cam gibi parlayan kara kristallerle kaplı ada. Haydutlar madenini işgal etmiş.',
    features: [{ type: 'mine', angle: -0.4, dist: 0.45, enemies: ['haydut', 'haydut', 'haydut_agir', 'haydut_nisanci'] }],
  },
  // --- Batı: Kızıl Kum Kıyıları ---
  {
    id: 'kumsaati', name: 'Kumsaati', biome: 'col', x: -5300, z: 700, r: 240, h: 36, hill: 0.6, seed: 501,
    desc: 'Çöl kıyısında kerpiç kasaba. Kervan malları ve kum fırtınası hikâyeleri.',
    features: [{ type: 'port', angle: 0.1, style: 'red', size: 1.0, name: 'Kumsaati Limanı' }],
  },
  {
    id: 'demirkapi', name: 'Demirkapı Hapishanesi', biome: 'col', x: -6700, z: 2500, r: 270, h: 54, hill: 0.8, seed: 503, shape: 'mesa',
    desc: 'Kayalık bir adada korsan hapishanesi. Ağır zırhlı gardiyanlar ve kilitli hücreler.',
    features: [{ type: 'prison', angle: 0.8, dist: 0.25, enemies: ['haydut_agir', 'haydut_agir', 'haydut_nisanci', 'haydut_nisanci', 'haydut_kaptani'] }],
  },
  {
    id: 'gumus_madeni', name: 'Terk Edilmiş Gümüş Madeni', biome: 'col', x: -7500, z: -1700, r: 320, h: 70, hill: 0.9, seed: 505, shape: 'mesa',
    desc: 'Yıllar önce lanetlendiği için terk edilen maden. Ocakların derinliğinde iskelet madenciler.',
    features: [{ type: 'mine', angle: 1.9, dist: 0.5, enemies: ['iskelet', 'iskelet', 'iskelet_agir', 'iskelet_nisanci'], undead: true }],
  },
  {
    id: 'kizil_kanyon', name: 'Kızıl Kanyon', biome: 'col', x: -4900, z: 3900, r: 380, h: 80, hill: 1.0, seed: 507, shape: 'mesa', ex: 1.35, ez: 0.8, rot: 0.5,
    desc: 'Rüzgârın oyduğu kızıl kayalar ve kanyonlar. Akrepler ve kayıp kervanlar.',
    features: [{ type: 'ruin', angle: 2.8, dist: 0.5, enemies: ['iskelet', 'iskelet_nisanci', 'iskelet_altin'] }],
  },
  // --- Kuzeybatı: Hayalet Denizleri ---
  {
    id: 'korsan_mezarligi', name: 'Korsan Mezarlığı', biome: 'hayalet', x: -6800, z: -6400, r: 320, h: 40, hill: 0.9, seed: 601,
    desc: 'Yüzlerce korsanın gömüldüğü sisli ada. Mahzenler, batık gemi enkazları ve huzursuz ruhlar.',
    features: [
      { type: 'graveyard', angle: 0.3, dist: 0.3, enemies: ['iskelet', 'iskelet', 'iskelet_nisanci', 'iskelet_altin'], night: ['hayalet', 'hayalet_bogulmus', 'hayalet_nisanci', 'hayalet_muhafiz'] },
      { type: 'graveyard', angle: 2.6, dist: 0.55, enemies: ['iskelet_agir', 'iskelet'], night: ['hayalet_kaptan'] },
    ],
  },
  {
    id: 'sis_adasi', name: 'Sis Adası', biome: 'hayalet', x: -5300, z: -7900, r: 210, h: 30, hill: 1.0, seed: 603,
    desc: 'Sisin hiç dağılmadığı ada. Kıyısında Lanetli Amiral\'in hayalet gemisi görülür.',
    features: [
      { type: 'ruin', angle: 1.0, dist: 0.4, enemies: ['iskelet', 'iskelet_nisanci'], night: ['hayalet', 'hayalet_nisanci'] },
      { type: 'boss_sea', boss: 'lanetli_amiral', ox: -700, oz: -500 },
    ],
  },
  {
    id: 'kara_girdap', name: 'Kara Girdap Kayaları', biome: 'hayalet', x: -4900, z: -5300, r: 55, h: 24, hill: 1.6, seed: 605, shape: 'spire',
    desc: 'Dev bir girdabın yakınındaki kayalar. Kraken\'in yuvası olduğu söylenir.',
    features: [{ type: 'boss_sea', boss: 'kraken', ox: 380, oz: 300 }],
  },
];

// Yordamsal adacık adları (bölgeye göre)
const NAMES = {
  merkez: ['Kum Adacığı', 'Yengeç Koyu', 'Rüzgârlı Burun', 'Kaplumbağa Kayalığı', 'Martı Burnu', 'Sarı Kum Adası', 'İnci Adacığı', 'Kayık Kayası', 'Fıçı Adası'],
  buzul: ['Ayaz Adacığı', 'Kar Kayası', 'Fok Adası', 'Buzlu Burun', 'Mors Kayalıkları', 'Kırağı Adası', 'Soğuk Diş', 'Beyaz Tepe', 'Kuzey Yıldızı Adası'],
  tropik: ['Muz Adası', 'Sarmaşık Adası', 'Orkide Adası', 'Şelale Adası', 'Yılan Adacığı', 'Kaplan Kayası', 'Hindistancevizi Adası', 'Turkuaz Lagün', 'Tukan Adası'],
  volkan: ['Kül Kayası', 'Kızgın Ada', 'Dumanlı Adacık', 'Kükürt Adası', 'Bazalt Sütunları', 'Kor Adası', 'Lav Dili', 'Kara Cam Adası'],
  col: ['Akrep Adası', 'Kızıl Kaya', 'Serap Adası', 'Kemer Kayalığı', 'Susuz Ada', 'Kum Tepesi Adası', 'Kervan Kayası', 'Güneş Adası'],
  hayalet: ['Fısıltı Adası', 'Kemik Kayalığı', 'Kara Mum Adası', 'Ölü Rüzgâr Adası', 'Sessiz Ada', 'Çan Kayası'],
};
const FILLER_COUNT = { merkez: 8, buzul: 8, tropik: 9, volkan: 7, col: 7, hayalet: 5 };
const SHAPES = {
  merkez: ['normal', 'normal', 'atoll', 'spire'],
  buzul: ['glacier', 'normal', 'spire', 'glacier'],
  tropik: ['normal', 'normal', 'atoll', 'swamp'],
  volkan: ['volcano', 'spire', 'normal', 'volcano'],
  col: ['mesa', 'mesa', 'spire', 'normal'],
  hayalet: ['normal', 'spire', 'normal'],
};

// çekirdek takımada (worldData) bölgesi: yordamsal adalar buraya konmaz
const CORE_BOX = 1350;

function generate() {
  const R = rng(777);
  const all = UNIQUE.map((u) => ({ hill: 1, coast: 0.3, ...u, region: regionAt(u.x, u.z) }));
  const taken = all.map((i) => ({ x: i.x, z: i.z, r: i.r * Math.max(i.ex || 1, i.ez || 1) }));
  const clearOf = (x, z, r) => {
    if (Math.abs(x) < CORE_BOX + r * 2.5 && Math.abs(z) < CORE_BOX + r * 2.5) return false;
    for (const t of taken) if (Math.hypot(x - t.x, z - t.z) < (t.r + r) * 2.3 + 260) return false;
    return Math.abs(x) < 9300 - r && Math.abs(z) < 9300 - r;
  };
  for (const reg of Object.keys(FILLER_COUNT)) {
    const names = NAMES[reg].slice();
    let made = 0;
    for (let tries = 0; tries < 900 && made < FILLER_COUNT[reg]; tries++) {
      const x = (R() * 2 - 1) * 9200, z = (R() * 2 - 1) * 9200;
      if (regionAt(x, z) !== reg) continue;
      const r = 55 + R() * R() * 170;
      if (!clearOf(x, z, r)) continue;
      const shape = SHAPES[reg][Math.floor(R() * SHAPES[reg].length)];
      const biome = reg === 'merkez' ? 'tropik' : REGIONS[reg].biome;
      const h = shape === 'atoll' ? 6 : shape === 'spire' ? 25 + R() * 30 : shape === 'volcano' ? 45 + r * 0.35 : shape === 'mesa' ? 25 + R() * 30 : shape === 'glacier' ? 30 + r * 0.25 : 10 + r * 0.16 + R() * 14;
      const name = names.length ? names.splice(Math.floor(R() * names.length), 1)[0] : `${REGIONS[reg].name} Adacığı ${made + 1}`;
      const isl = {
        id: `ada_${reg}_${made}`, name, biome, region: reg, x: Math.round(x), z: Math.round(z), r: Math.round(r), h: Math.round(h),
        hill: 0.4 + R() * 0.9, coast: 0.22 + R() * 0.16, seed: 900 + Math.floor(R() * 9000), shape, filler: true,
        desc: `${REGIONS[reg].name} bölgesinde ${shape === 'atoll' ? 'lagünlü bir mercan adası' : shape === 'volcano' ? 'dumanı tüten küçük bir volkan' : shape === 'mesa' ? 'basamaklı kayalıklardan bir ada' : shape === 'spire' ? 'sivri kayalık bir ada' : shape === 'glacier' ? 'karla kaplı bir ada' : 'keşfedilmeyi bekleyen bir ada'}.`,
        features: [],
      };
      // yordamsal özellikler: kamp, harabe, mezarlık, batık
      const t = R();
      const enemiesFor = {
        merkez: [['haydut', 'haydut', 'haydut_nisanci'], ['iskelet', 'iskelet', 'iskelet_nisanci']],
        buzul: [['haydut_avci', 'haydut', 'haydut_nisanci'], ['iskelet', 'iskelet_agir']],
        tropik: [['haydut', 'haydut_avci', 'haydut_nisanci'], ['iskelet', 'iskelet', 'iskelet_altin']],
        volkan: [['haydut', 'haydut_agir', 'haydut_nisanci'], ['iskelet_agir', 'iskelet_nisanci']],
        col: [['haydut', 'haydut_nisanci', 'haydut_avci'], ['iskelet', 'iskelet_nisanci', 'iskelet_altin']],
        hayalet: [['iskelet', 'iskelet_nisanci'], ['iskelet', 'iskelet_agir']],
      }[reg];
      if (r > 90 && t < 0.38) isl.features.push({ type: 'camp', angle: R() * 6.28, dist: 0.45, enemies: enemiesFor[0], fire: true });
      else if (r > 80 && t < 0.72) isl.features.push({ type: reg === 'hayalet' ? 'graveyard' : 'ruin', angle: R() * 6.28, dist: 0.4, enemies: enemiesFor[1], night: reg === 'hayalet' || reg === 'merkez' ? ['hayalet', 'hayalet_nisanci'] : null });
      if (R() < 0.35) isl.features.push({ type: 'beach_wreck', angle: R() * 6.28, dist: 0.93 });
      // her adacığın en az bir belirleyici özelliği olsun (ayırt edilebilirlik): biyoma özgü havuz, adacık konumuyla tohumlanmış
      // ayrı rng (ana akış değişmez → ada yerleşimi v0.3 ile birebir aynı)
      if (!isl.features.length) {
        const R2 = rng(Math.abs(isl.x * 73 + isl.z * 151) + 17);
        const pool = {
          merkez: ['lighthouse', 'ruin', 'beach_wreck'], buzul: ['ruin', 'beach_wreck', 'camp'], tropik: ['ruin', 'beach_wreck', 'lighthouse'],
          volkan: ['mine', 'ruin', 'beach_wreck'], col: ['mine', 'ruin', 'camp'], hayalet: ['graveyard', 'ruin'],
        }[reg];
        let type = pool[Math.floor(R2() * pool.length)];
        if (type === 'camp' && r < 90) type = 'ruin';
        if (type === 'mine' && r < 80) type = 'ruin';
        if (type === 'graveyard' && r < 100) type = 'ruin';
        // dik/çukurlu şekillerde (volkan konisi, kaya kulesi, bataklık havuzları) düzlük isteyen yapı kıyıya taşan kaide ya da
        // su çukuru kenarında kule bırakır (arazi burada sorgulanamaz: geo.js bu modülü içe aktarır) → kıyı özelliği seçilir
        if (shape === 'volcano' || shape === 'spire' || shape === 'swamp') type = 'beach_wreck';
        const atoll = shape === 'atoll';
        // batık 0.82·r: kıyı gürültüsüyle (Re = r·(1+rn)) 0.93 bazen suya düşüyordu
        const f = { type, auto: true, angle: R2() * 6.28, dist: type === 'beach_wreck' ? 0.82 : atoll ? 0.62 : type === 'lighthouse' ? 0.2 : 0.42 };
        if (type === 'camp') { f.enemies = enemiesFor[0]; f.fire = true; }
        else if (type === 'ruin' || type === 'graveyard') { f.enemies = enemiesFor[1]; f.night = reg === 'hayalet' || reg === 'merkez' ? ['hayalet', 'hayalet_nisanci'] : null; }
        isl.features.push(f);
      }
      all.push(isl);
      taken.push({ x: isl.x, z: isl.z, r: isl.r });
      made++;
    }
  }
  // her özellik için mutlak konum
  for (const I of all) {
    for (const f of I.features) {
      if (f.ox !== undefined) { f.x = I.x + f.ox; f.z = I.z + f.oz; continue; }
      const d = (f.dist ?? (f.type === 'port' ? 0.7 : 0.4)) * I.r;
      const a = f.angle ?? 0;
      f.x = Math.round(I.x + Math.cos(a) * d * (I.ex || 1));
      f.z = Math.round(I.z + Math.sin(a) * d * (I.ez || 1));
    }
  }
  return all;
}

export const EXTRA_ISLANDS = generate();

// Arazi düzenlemeleri: kasabalar, kampler ve yapılar için düzlükler
export const EXTRA_MODS = [];
export const EXTRA_POIS = [];
export const EXTRA_DIG_SITES = [];
export const EXTRA_WRECKS = [];
export const EXTRA_FISH_ZONES = [];
export const BOSS_SITES = [];
{
  const R = rng(4321);
  const POI_ICON = { port: 'port', camp: 'camp', fort: 'fort', ruin: 'ruin', graveyard: 'grave', temple: 'temple', mine: 'mine', market: 'market', ruined_town: 'ruin', lighthouse: 'peak', prison: 'fort', sunken_city: 'wreck', beach_wreck: 'wreck' };
  const POI_NAME = { camp: 'Haydut Kampı', fort: 'Haydut Kalesi', ruin: 'Eski Harabeler', graveyard: 'Mezarlık', temple: 'Kadim Tapınak', mine: 'Maden Ocağı', market: 'Gizli Pazar', ruined_town: 'Yıkık Kasaba', lighthouse: 'Yıkık Fener', prison: 'Demirkapı Hapishanesi', sunken_city: 'Batık Şehir', beach_wreck: 'Karaya Oturmuş Gemi' };
  for (const I of EXTRA_ISLANDS) {
    for (const [i, f] of I.features.entries()) {
      const fid = `${I.id}_${f.type}_${i}`;
      f.id = fid;
      // düzlük
      if (f.type === 'port') {
        // kasaba: kıyıya yakın düz alan; iskele denize uzanır
        const a = f.angle;
        f.yaw = a; // iskele yönü (dışarı)
        EXTRA_MODS.push({ type: 'flatten', x: f.x, z: f.z, r: 46 * f.size, h: 2.8, blend: 26 });
        const px = I.x + Math.cos(a) * I.r * 1.02, pz = I.z + Math.sin(a) * I.r * 1.02;
        EXTRA_MODS.push({ type: 'dig', x: I.x + Math.cos(a) * I.r * 1.28, z: I.z + Math.sin(a) * I.r * 1.28, r: 50, depth: -9, blend: 30 });
        f.pier = { x: px, z: pz };
        f.mooring = { x: I.x + Math.cos(a) * (I.r * 1.02 + 34), z: I.z + Math.sin(a) * (I.r * 1.02 + 34) };
      } else if (['camp', 'fort', 'ruin', 'graveyard', 'mine', 'market', 'ruined_town', 'prison'].includes(f.type)) {
        const rr0 = { camp: 20, fort: 30, ruin: 24, graveyard: 34, mine: 26, market: 22, ruined_town: 46, prison: 44 }[f.type];
        // küçük adacıkta (otomatik özellik) düzlük yarıçapı adaya göre küçülür: 24+18 m'lik düzlük 56 m'lik adada kıyıya taşıp
        // denize inen 27 m'lik kaide bırakıyordu (kıyı sıçramaları geri geliyordu)
        const small = f.auto && I.r < 110;
        const rr = small ? Math.min(rr0, Math.round(I.r * 0.22)) : rr0;
        f.r = rr;
        EXTRA_MODS.push({ type: 'flatten', x: f.x, z: f.z, r: rr, h: null, blend: small ? Math.min(18, Math.round(I.r * 0.12)) : 18, island: I.id });
      } else if (f.type === 'temple') {
        f.r = 60;
        EXTRA_MODS.push({ type: 'flatten', x: f.x, z: f.z, r: 62, h: null, blend: 40, island: I.id });
      } else if (f.type === 'sunken_city') {
        EXTRA_MODS.push({ type: 'flatten', x: f.x, z: f.z, r: 90, h: -11, blend: 50 });
      } else if (f.type === 'boss_sea' || f.type === 'boss_land') {
        BOSS_SITES.push({ id: f.boss, x: f.x, z: f.z, island: I.id, land: f.type === 'boss_land' });
      }
      if (POI_ICON[f.type] && f.type !== 'port') EXTRA_POIS.push({ id: fid, name: f.name || POI_NAME[f.type], x: f.x, z: f.z, icon: POI_ICON[f.type], island: I.id });
      if (f.type === 'port') EXTRA_POIS.push({ id: fid, name: f.name, x: f.x, z: f.z, icon: 'port', island: I.id, port: true });
      // otomatik özellik paylaşımlı R akışını tüketmez: aksi hâlde sonraki adaların kazı noktaları/ipuçları ve batık yönleri kayar
      // (v0.3 kayıtlarındaki hazine haritaları başka yeri gösterirdi)
      if (f.type === 'beach_wreck' || f.type === 'sunken_city') EXTRA_WRECKS.push({ id: fid, name: POI_NAME[f.type], x: f.x, z: f.z, yaw: (f.auto ? rng(Math.abs(f.x * 73 + f.z * 151) + 29) : R)() * 6.28, depth: f.type === 'sunken_city' ? -10 : 0.2, beached: f.type === 'beach_wreck' });
    }
    // kazı noktaları: adanın büyüklüğüne göre 1-3 tane, ipucu nesnesiyle
    const n = I.r > 220 ? 3 : I.r > 110 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2, d = (0.25 + R() * 0.45) * I.r;
      const x = Math.round(I.x + Math.cos(a) * d), z = Math.round(I.z + Math.sin(a) * d);
      const lm = ['rock', 'deadtree', 'column', 'campfire', 'barrel', 'obelisk'][Math.floor(R() * 6)];
      const lx = x + Math.round((R() - 0.5) * 8), lz = z + Math.round((R() - 0.5) * 8);
      const dir = Math.atan2(z - lz, x - lx);
      const yon = ['doğusunda', 'güneydoğusunda', 'güneyinde', 'güneybatısında', 'batısında', 'kuzeybatısında', 'kuzeyinde', 'kuzeydoğusunda'][((Math.round(dir / (Math.PI / 4)) % 8) + 8) % 8];
      const what = { rock: 'yalnız kayanın', deadtree: 'kurumuş ağacın', column: 'kırık sütunun', campfire: 'eski kamp ateşinin', barrel: 'gömülü fıçının', obelisk: 'dikilitaşın' }[lm];
      const tier = I.r > 300 ? (k === 0 ? 'large' : 'medium') : I.r > 150 ? (k === 0 ? 'medium' : 'small') : 'small';
      EXTRA_DIG_SITES.push({
        id: `${I.id}_kazi_${k}`, island: I.id, x, z, tier, gen: true,
        clue: `${I.name}: ${what} ${yon}, ${Math.max(2, Math.round(Math.hypot(x - lx, z - lz)))} adım ötede.`,
        landmarks: [{ type: lm, x: lx, z: lz }],
      });
    }
    // balık bölgesi (bölgeye özgü türler)
    EXTRA_FISH_ZONES.push({ id: `${I.id}_balik`, x: I.x, z: I.z, r: I.r * 1.6, type: I.shape === 'atoll' || I.biome === 'cangil' ? 'reef' : 'coast', region: I.region });
  }
  // açık deniz balıkçılık bölgeleri
  for (const [reg, x, z] of [['buzul', 0, -7000], ['tropik', 0, 7600], ['volkan', 7600, 2500], ['col', -7600, 2000], ['hayalet', -7600, -7600], ['merkez', 2600, 0], ['merkez', -2600, -400]]) {
    EXTRA_FISH_ZONES.push({ id: `acik_${reg}_${x}_${z}`, x, z, r: 900, type: 'open', region: reg });
  }
}
