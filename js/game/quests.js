import * as THREE from 'three';
import { G } from './ctx.js';
import { interact } from './interact.js';
import { audio } from '../core/audio.js';
import { ISLANDS, POIS, WRECKS, DIG_SITES } from '../world/worldData.js';
import { cave } from '../world/cave.js';
import { terrain } from '../world/terrain.js';
import { ports } from '../world/ports.js';
import { treasure } from '../treasure/treasure.js';
import { enemies } from './enemies.js';
import { MERCHANTS, shop, sellPrice } from '../economy/shop.js';
import { ITEMS, CHEST_TIERS } from '../economy/items.js';
import { SPECIES } from '../wildlife/animals.js';
import { FISH } from '../wildlife/fish.js';
import { SHIP_TYPES } from '../ship/shipModel.js';
import { effects } from './effects.js';
import { rng } from '../core/util.js';
import { time, SHOP_HOURS } from '../world/time.js';
import { sky } from '../world/sky.js';

// ---- Ana hikâye: Son Hazine Efsanesi ----
export const STORY = [
  { id: 'basla', title: 'Korsan Hayatına Başlangıç', goal: 'Kırlangıç Hanı\'nın önündeki Yaşlı Kaptan Tuzla ile konuş.' },
  { id: 'ilk_hazine', title: 'İlk Hazine', goal: 'Haritacı Nevra\'dan ilk haritanı al, Martı Adacığı\'ndaki hazineyi bul ve Sedef Hanım\'a sat.' },
  { id: 'gunluk', title: 'Eski Günlük', goal: 'Kırlangıç Adası\'nın doğusundaki Yankı Mağarası\'nda kayıp serdümenin günlüğünü bul.' },
  { id: 'parca1', title: 'İlk Harita Parçası', goal: 'Kemik Adası harabelerinde İskelet Kaptan Morvan\'ı yen ve Mira Veyl\'in harita parçasını al.' },
  { id: 'kizil', title: 'Kızıl Hançer', goal: 'Kırlangıç Adası\'nın kuzeyindeki kampta rakip kaptan Kızıl Hançer ile hesaplaş.' },
  { id: 'yitik', title: 'Yitik Ufuk\'a Doğru', goal: 'Kalan harita parçaları Volkanik Adalar ve Buz Krallığı\'nda. (Bu bölgeler bir sonraki geliştirme aşamasında açılacak.)' },
];

const SIDE_TEMPLATES = [
  { id: 'balik_cerrah', title: 'Yusuf\'un Siparişi', text: '3 Cerrah Balığı tut ve Balıkçı Yusuf\'a sat.', type: 'fishSell', key: 'cerrah', need: 3, reward: 140 },
  { id: 'iskelet_av', title: 'Kemiklerin Huzuru', text: 'Kemik Adası\'nda 5 iskelet korsanı yok et.', type: 'kill', key: 'iskelet', need: 5, reward: 260 },
  { id: 'sandik_teslim', title: 'Sedef Hanım\'ın Koleksiyonu', text: 'Sedef Hanım\'a bir Denizci Sandığı (orta) sat.', type: 'chestSell', key: 'medium', need: 1, reward: 300 },
  { id: 'domuz_post', title: 'Tabakhane İçin Deri', text: '2 Yaban Domuzu Postu topla.', type: 'collect', key: 'hayvan_postu', need: 2, reward: 90 },
  { id: 'resif_kesif', title: 'Resif Haritası', text: 'İkiz Resifi\'ni keşfet.', type: 'discover', key: 'resif', need: 1, reward: 110 },
  { id: 'haydut_av', title: 'Kızıl Tehdit', text: 'Kızıl Hançer çetesinden 4 haydut etkisiz hale getir.', type: 'kill', key: 'haydut', need: 4, reward: 220 },
  { id: 'batik_kesif', title: 'Martı Batığı', text: 'Martı Adacığı açığındaki batığa dal ve keşfet.', type: 'discover', key: 'batik', need: 1, reward: 150 },
  { id: 'balik_nadir', title: 'Nadir Tür', text: 'Nadir ya da daha üstü bir balık yakala.', type: 'fishRare', key: 'nadir', need: 1, reward: 160 },
];

export const ACHIEVEMENTS = [
  { id: 'ilk_kazi', name: 'İlk Kürek', desc: 'İlk hazineni bul.', test: (s) => s.treasures >= 1 },
  { id: 'zengin', name: 'Altın Kesesi', desc: 'Toplam 2.000 altın kazan.', test: (s) => s.earned >= 2000 },
  { id: 'cok_zengin', name: 'Korsan Kralı Adayı', desc: 'Toplam 10.000 altın kazan.', test: (s) => s.earned >= 10000 },
  { id: 'balikci', name: 'Olta Ustası', desc: '10 balık yakala.', test: (s) => s.fish >= 10 },
  { id: 'koleksiyon', name: 'Deniz Bilgini', desc: '8 farklı balık türü yakala.', test: (s, q) => Object.keys(q.collection.fish).length >= 8 },
  { id: 'kasif', name: 'Kâşif', desc: 'Tüm adaları keşfet.', test: (s, q) => ISLANDS.every((i) => q.discovered[i.id]) },
  { id: 'doga', name: 'Doğa Gözlemcisi', desc: '8 farklı canlı türü gör.', test: (s, q) => Object.keys(q.collection.animals).length >= 8 },
  { id: 'kemik', name: 'Kemik Kıran', desc: '15 iskelet yok et.', test: (s) => (s.kills.iskelet || 0) + (s.kills.iskelet_altin || 0) >= 15 },
  { id: 'morvan', name: 'Morvan\'ın Sonu', desc: 'İskelet Kaptan Morvan\'ı yen.', test: (s) => !!s.kills.iskelet_kaptan },
  { id: 'hancer', name: 'Hançeri Kıran', desc: 'Kızıl Hançer\'i yen.', test: (s) => !!s.kills.kizil_hancer },
  { id: 'dalgic', name: 'Derin Dalgıç', desc: '12 metreden derine dal.', test: (s) => s.maxDepth >= 12 },
  { id: 'kaptan', name: 'Yeni Gemi', desc: 'Brigantine satın al.', test: (s) => s.shipsBought >= 1 },
  { id: 'topcu', name: 'Topçu', desc: 'Bir korsan gemisini batır.', test: (s) => s.shipsSunk >= 1 },
];

export const quests = {
  name: 'quests',
  saveKey: 'quests',

  init(scene) {
    this.scene = scene;
    // günlük nesnesi (mağarada)
    const js = cave.journalSpot;
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.25), new THREE.MeshStandardMaterial({ color: 0x6b3a1a, emissive: 0x3a1a00, emissiveIntensity: 0.5 }));
    book.position.set(js.x, js.y + 0.04, js.z);
    scene.add(book);
    this.journalMesh = book;
    interact.addProvider((ctx, out) => this._provide(ctx, out));
    this._wire();
  },

  start(data) {
    const d = data?.quests;
    this.stage = d?.stage ?? 0;
    this.flags = d?.flags || {};
    this.side = d?.side || [];
    this.completed = d?.completed || [];
    this.discovered = d?.discovered || {};
    this.fog = new Uint8Array(64 * 64);
    if (d?.fog) { const b = atob(d.fog); for (let i = 0; i < Math.min(b.length, this.fog.length); i++) this.fog[i] = b.charCodeAt(i); }
    this.stats = { treasures: 0, earned: 0, fish: 0, kills: {}, maxDepth: 0, sold: 0, soldValue: 0, shipsBought: 0, shipsSunk: 0, chests: 0, ...(d?.stats || {}) };
    this.collection = { fish: {}, animals: {}, ...(d?.collection || {}) };
    this.achievements = d?.achievements || {};
    this.markers = d?.markers || [];
    this.boardSeed = d?.boardSeed || (Date.now() & 0xffff);
    this.journalMesh.visible = !this.flags.gunluk;
    G.storySites = this.stage === 1 && !this.flags.ilkHazineBulundu ? ['marti_1'] : [];
    this._discoverT = 0;
    if (this.stage === 0) setTimeout(() => G.notify('Hedef: Hanın önündeki Yaşlı Kaptan Tuzla ile konuş. (J: Korsan Defteri)', 'quest', 6000), 1500);
  },
  stop() {},

  save() {
    let fog = '';
    for (let i = 0; i < this.fog.length; i++) fog += String.fromCharCode(this.fog[i]);
    return { stage: this.stage, flags: this.flags, side: this.side, completed: this.completed, discovered: this.discovered, fog: btoa(fog), stats: this.stats, collection: this.collection, achievements: this.achievements, markers: this.markers, boardSeed: this.boardSeed };
  },

  storyStep() { return STORY[Math.min(this.stage, STORY.length - 1)]; },
  advance(to) {
    if (to <= this.stage) return;
    this.stage = to;
    const s = STORY[to];
    audio.play('level_up', { vol: 0.7 });
    G.notify(`Yeni görev: ${s.title}`, 'quest', 5000);
    G.emit('storyAdvanced', { stage: to, title: s.title });
    G.emit('netStory', { stage: to, flags: this.flags });
  },

  _wire() {
    G.on('treasureFound', (e) => {
      this.stats.treasures++;
      if (e.site === 'marti_1') { this.flags.ilkHazineBulundu = true; G.storySites = []; G.notify('Sandığı gemine taşı, limana götür ve Sedef Hanım\'a sat!', 'quest', 5000); }
      this._checkAch();
    });
    G.on('chestSold', (e) => {
      this.stats.chests++;
      if (this.stage === 1 && this.flags.ilkHazineBulundu) { this.flags.ilkSatis = true; this.advance(2); setTimeout(() => G.notify('Yaşlı Kaptan Tuzla seni görmek istiyor.', 'quest'), 2500); }
      this._side('chestSell', e.tier, 1);
    });
    G.on('goldEarned', (e) => { this.stats.earned += e.gold; this._checkAch(); });
    G.on('itemSold', (e) => {
      this.stats.sold += e.n; this.stats.soldValue += e.gold;
      if (e.id.startsWith('balik:') && e.role === 'fisher') this._side('fishSell', e.id.slice(6), 1);
    });
    G.on('fishCaught', (e) => {
      if (e.released) return;
      const d = e.data;
      this.stats.fish++;
      const c = this.collection.fish[d.key];
      if (!c || d.weight > c.weight) this.collection.fish[d.key] = { ...d, count: (c?.count || 0) + 1 };
      else c.count++;
      if (!c) G.notify(`Koleksiyon defterine yeni tür: ${d.name}!`, 'good');
      if (['nadir', 'epik', 'efsanevi'].includes(d.rarity)) this._side('fishRare', 'nadir', 1);
      this._checkAch();
    });
    G.on('seeAnimal', (kind) => {
      if (this.collection.animals[kind]) return;
      this.collection.animals[kind] = { first: new Date().toLocaleDateString('tr-TR') };
      const name = SPECIES[kind]?.name || { shark: 'Kaplan Köpekbalığı', manta: 'Manta Vatozu', turtle: 'Deniz Kaplumbağası', dolphin: 'Yunus' }[kind] || kind;
      G.notify(`Yeni canlı gözlemlendi: ${name}`, 'info', 3000);
      this._checkAch();
    });
    G.on('enemyKilled', (e) => {
      this.stats.kills[e.type] = (this.stats.kills[e.type] || 0) + 1;
      if (e.type.startsWith('iskelet')) this._side('kill', 'iskelet', 1);
      if (e.type.startsWith('haydut')) this._side('kill', 'haydut', 1);
      if (e.type === 'iskelet_kaptan' && this.stage === 3) {
        this.flags.parca1 = true;
        G.player.inv.add('harita_parcasi', 1, { piece: 1, name: 'Harita Parçası 1/4', weight: 0.05 }, true);
        G.notify('Mira Veyl\'in harita parçasını aldın! (1/4)', 'quest', 6000);
        this.advance(4);
        setTimeout(() => G.notify('Limana dön: Kaptan Tuzla\'nın sana söyleyecekleri var.', 'quest', 5000), 4000);
      }
      if (e.type === 'kizil_hancer' && this.stage === 4) {
        this.flags.kizilYenildi = true;
        G.player.inv.add('harita_parcasi', 1, { piece: 2, name: 'Harita Parçası 2/4', weight: 0.05 }, true);
        // büyük ödül sandığı
        treasure.spawnChest('large', e.pos.clone().add(new THREE.Vector3(2, 0, 0)));
        this.advance(5);
        G.notify('Kızıl Hançer yenildi! Mektubunu ve harita parçasını aldın (2/4). Kampında büyük bir sandık var.', 'quest', 7000);
      }
      this._checkAch();
    });
    G.on('itemsGained', () => {
      const hides = G.player.inv.count('hayvan_postu');
      for (const q of this.side) if (q.type === 'collect' && q.key === 'hayvan_postu') { q.progress = Math.min(q.need, hides); this._sideCheck(q); }
    });
    G.on('shipBought', () => { this.stats.shipsBought++; this._checkAch(); });
    G.on('enemyShipSunk', () => { this.stats.shipsSunk++; this._checkAch(); });
    G.on('placeMarker', () => this.placeMarker());
    G.on('npcTalk', (e) => this.dialog(e.role, e.npc));
  },

  _side(type, key, n) {
    for (const q of this.side) {
      if (q.done || q.type !== type) continue;
      if (q.key !== key && !(type === 'chestSell' && (q.key === 'medium' ? ['medium', 'large', 'legend'].includes(key) : true))) continue;
      q.progress = Math.min(q.need, (q.progress || 0) + n);
      this._sideCheck(q);
    }
  },
  _sideCheck(q) {
    if (q.done || q.progress < q.need) return;
    q.done = true;
    shop.earn(q.reward);
    this.completed.push(q.title);
    audio.play('level_up', { vol: 0.6 });
    G.notify(`Görev tamamlandı: ${q.title} (+${q.reward} altın)`, 'good', 5000);
    this.side = this.side.filter((x) => x !== q);
  },

  _checkAch() {
    for (const a of ACHIEVEMENTS) {
      if (this.achievements[a.id]) continue;
      if (a.test(this.stats, this)) {
        this.achievements[a.id] = new Date().toLocaleDateString('tr-TR');
        audio.play('level_up', { vol: 0.5 });
        G.notify(`Başarım açıldı: ${a.name} — ${a.desc}`, 'achievement', 5000);
      }
    }
  },

  boardQuests() {
    const r = rng(this.boardSeed);
    const pool = [...SIDE_TEMPLATES].sort(() => r() - 0.5);
    return pool.filter((t) => !this.side.some((s) => s.id === t.id) && !this.completed.includes(t.title)).slice(0, 4);
  },
  acceptSide(t) {
    if (this.side.length >= 4) { G.notify('En fazla 4 yan görev alabilirsin.', 'warn'); return; }
    const q = { ...t, progress: 0 };
    if (t.type === 'collect') q.progress = Math.min(t.need, G.player.inv.count(t.key));
    if (t.type === 'discover' && this.discovered[t.key]) q.progress = 1;
    this.side.push(q);
    G.notify(`Görev alındı: ${t.title}`, 'quest');
    this._sideCheck(q);
  },

  update(dt) {
    const p = G.player;
    if (!p) return;
    // keşif sisi
    const gx = Math.floor((p.pos.x + 1200) / 2400 * 64), gz = Math.floor((p.pos.z + 1200) / 2400 * 64);
    const rr = p.mode === 'helm' || p.mode === 'deck' ? 4 : 3;
    for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) {
      if (i * i + j * j > rr * rr) continue;
      const x = gx + i, z = gz + j;
      if (x >= 0 && z >= 0 && x < 64 && z < 64) this.fog[z * 64 + x] = 1;
    }
    this._discoverT -= dt;
    if (this._discoverT <= 0) {
      this._discoverT = 1;
      for (const I of ISLANDS) if (!this.discovered[I.id] && Math.hypot(p.pos.x - I.x, p.pos.z - I.z) < I.r * 1.4) {
        this.discovered[I.id] = true;
        G.notify(`Keşfedildi: ${I.name}`, 'discover', 4500);
        G.emit('discovered', { id: I.id, name: I.name });
        audio.play('gem', { vol: 0.5, rate: 0.8 });
        this._checkAch();
      }
      for (const P of POIS) if (!this.discovered[P.id] && Math.hypot(p.pos.x - P.x, p.pos.z - P.z) < (P.id === 'batik' ? 18 : 30) && (P.id !== 'batik' || p.underwater)) {
        this.discovered[P.id] = true;
        G.notify(`Keşfedildi: ${P.name}`, 'discover', 4000);
        G.emit('discovered', { id: P.id, name: P.name });
        this._side('discover', P.id, 1);
      }
      if (p.depth > this.stats.maxDepth) { this.stats.maxDepth = p.depth; this._checkAch(); }
      // hikâye tetikleyicileri
      if (this.stage === 3 && !this.flags.morvanSpawn && Math.hypot(p.pos.x + 520, p.pos.z + 440) < 45) {
        this.flags.morvanSpawn = true;
        enemies.spawnBoss('iskelet_kaptan', -520, -436, { rise: true });
        G.notify('Yer sarsılıyor… İskelet Kaptan Morvan uyandı!', 'boss', 5000);
        audio.play('boss', { vol: 0.8 });
      }
      if (this.stage === 3 && this.flags.morvanSpawn && !enemies.list.some((e) => e.type === 'iskelet_kaptan') && Math.hypot(p.pos.x + 520, p.pos.z + 440) > 200) this.flags.morvanSpawn = false;
      if (this.stage === 4 && !this.flags.kizilSpawn && Math.hypot(p.pos.x + 40, p.pos.z + 228) < 50) {
        this.flags.kizilSpawn = true;
        const app = { gender: 'm', skin: 3, hairStyle: 'uzun', hairColor: 6, beard: 'orgulu', beardColor: 6, hat: 'kaptan', hatColor: '#7a1f1f', coat: 'uzun', coatColor: '#8a1f1f', shirtColor: '#2a2a2a', pantsColor: '#2a2a2a', bootsColor: '#1a1a1a', eyepatch: 'sol', earring: 'altin', necklace: 'altin', scar: 'yanak', height: 1.05, build: 1.1, face: 'koseli', nose: 'kanca', chin: 'normal', tattoo: 'kol', facemark: 'yok', gloves: 'deri', belt: 'kusak', beltColor: '#7a1f1f', age: 0.45, eyeColor: 0 };
        enemies.spawnBoss('kizil_hancer', -40, -232, { appearance: app });
        G.notify('Kızıl Hançer: "Mira\'nın haritası benim hakkım! Gel de al, çaylak!"', 'boss', 6000);
        audio.play('boss', { vol: 0.8 });
      }
      if (this.stage === 4 && this.flags.kizilSpawn && !enemies.list.some((e) => e.type === 'kizil_hancer') && Math.hypot(p.pos.x + 40, p.pos.z + 228) > 200) this.flags.kizilSpawn = false;
    }
  },

  _provide(ctx, out) {
    const p = ctx.player;
    if (p.mode !== 'ground') return;
    if (this.stage >= 2 && !this.flags.gunluk) {
      const js = cave.journalSpot;
      const pos = new THREE.Vector3(js.x, js.y, js.z);
      if (pos.distanceTo(p.pos) < 2.6) out.push({ id: 'journal', pos, radius: 2.6, priority: 3, label: 'Eski günlüğü al', action: () => this.takeJournal() });
    }
  },

  takeJournal() {
    this.flags.gunluk = true;
    this.journalMesh.visible = false;
    G.player.inv.add('eski_gunluk', 1, null, true);
    effects.glitter(this.journalMesh.position.x, this.journalMesh.position.y, this.journalMesh.position.z);
    G.emit('openReader', {
      title: 'Serdümen Halil\'in Günlüğü',
      text: `<p><i>…yıl 1662, Fırtına Ayı.</i></p>
<p>Kaptan Mira bu gece yine haritanın başından kalkmadı. Son Hazine'yi bulduğumuzu biliyorum, ama yerini yalnızca o biliyor. Haritayı <b>dört parçaya</b> böldü ve her birini ayrı bir adaya, ayrı bir bekçiye emanet etti.</p>
<p>İlk parça, sadık topçumuz <b>Morvan</b>'da. Zavallı Morvan… Kemik Adası'nın taş halkasında, ölüm bile onu görevinden alıkoyamayacak diyorlar.</p>
<p>Gelgit Pusulası'nı gördüm. Denizin akışını değiştirebilen o lanet şey… Mira onu hazineyle birlikte <b>Yitik Ufuk</b>'a götürdü. Biri bu satırları okuyorsa: Kemik Adası'na git. Ve geceleri yalnız gitme.</p>`,
    });
    if (this.stage === 2) this.advance(3);
    G.emit('netStory', { stage: this.stage, flags: this.flags });
  },

  placeMarker() {
    const p = G.player;
    const dir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    let pt = p.pos.clone().addScaledVector(dir, 25);
    this.markers.push({ x: pt.x, z: pt.z, by: G.playerName, note: '', color: '#c0392b' });
    if (this.markers.length > 30) this.markers.shift();
    G.notify('Haritaya işaret koyuldu.', 'info', 1500);
    G.emit('netMarker', { x: pt.x, z: pt.z, by: G.playerName });
    audio.play('ui', { vol: 0.4 });
  },

  // ---- NPC diyalogları ----
  dialog(role, npc) {
    const p = G.player;
    const st = this.stage;
    const D = (text, options) => G.emit('openDialog', { name: npc.name, title: npc.title, text, options });
    const close = { label: 'Hoşça kal', close: true };
    // zaman çizelgesi: dükkânların çalışma saatleri
    if (SHOP_HOURS[role] && !time.shopOpen(role)) {
      const h = SHOP_HOURS[role];
      const night = sky.isNight();
      D(`${night ? 'Esneyerek' : 'Tezgâhı toplarken'}: "Dükkân kapalı kaptan, yarın <b>${String(h[0]).padStart(2, '0')}:00</b>'da açarım. ${night ? 'Şimdi biraz dinleneyim; sen de handa bir oda tutabilirsin.' : 'Şimdilik iyi rüzgârlar!'}"<br><span class="muted">Çalışma saatleri: ${String(h[0]).padStart(2, '0')}:00–${h[1] === 24 ? '24' : String(h[1]).padStart(2, '0')}:00 · Saat şu an ${time.hourString(sky.hour)}</span>`, [close]);
      return;
    }
    switch (role) {
      case 'quest': {
        if (st === 0) {
          D(`Demek yeni bir korsan daha… Otur bakalım. Altmış yıl önce <b>Kaptan Mira Veyl</b> tarihin en büyük hazinesini bulduğunu ilan etti: <b>Son Hazine</b>. Altın, kayıp krallıkların eserleri ve denizin akışını değiştiren <b>Gelgit Pusulası</b>… Sonra Mira ortadan kayboldu.<br><br>Ben yaşlandım evlat. Limandaki küçük sloop'um <b>Martı</b> artık senin. Önce para kazan, adını duyur. Haritacı Nevra sana ilk haritanı verecek.`, [
            { label: 'Martı benim mi? Teşekkürler kaptan!', fn: () => { this.advance(1); G.notify('Martı artık senin! İskelenin ucunda demirli. (E ile bin)', 'good', 5000); } }, close]);
        } else if (st === 1) D('Nevra\'ya git, ilk haritanı alsın. Martı Adacığı güneydoğuda, limandan çıkınca sağ omzunda kalır. Hazineyi bulunca limana getir, Sedef Hanım iyi para verir.', [close]);
        else if (st === 2) D(`İlk hazinen hayırlı olsun! Şimdi sana bir sır vereyim: Mira'nın serdümeni Halil, ölmeden önce bir günlük tutmuş. Günlüğün <b>Yankı Mağarası</b>'nda saklı olduğu söylenir — adanın doğu kayalıklarında. Meşaleni almayı unutma (F).`, [close]);
        else if (st === 3) D('Günlüğü buldun demek… Morvan! Kemik Adası kuzeybatıda. Gündüz git, gece oranın ölüleri hiç uyumaz. Ve topların için gülle almayı unutma.', [close]);
        else if (st === 4) D('Bir parça! Ama dikkat et: <b>Kızıl Hançer</b> de aynı haritanın peşinde. Adamları adanın kuzeyinde kamp kurmuş. Seni beklediğine eminim.', [close]);
        else D('Kızıl Hançer\'in mektubu… "Volkanik Adalar\'daki ateşin bekçisi" ve "buzların altındaki kraliçe"… Kalan iki parça oralarda, Yitik Ufuk\'un ötesinde. Rüzgâr değiştiğinde yola çıkacağız evlat.', [close]);
        const opts = [];
        // handa uyuma: zamanı ilerletir, canı doldurur
        const toMorning = sky.hour >= 17 || sky.hour < 5;
        const room = time.isActive('festival') ? 10 : 20;
        opts.push({ label: `${toMorning ? 'Sabaha kadar uyu' : 'Akşama kadar dinlen'} — handa oda (${room} altın${room < 20 ? ', şenlik indirimi' : ''})`, fn: () => G.emit('sleepAtInn', { until: toMorning ? 6 : 18, cost: room }) });
        opts.push({ label: 'Tayfa kirala (500 altın) — gemide su boşaltır ve delik onarır', fn: () => {
          if (G.crewHired) { G.notify('Zaten bir tayfan var.'); return; }
          if (p.inv.gold < 500) { G.notify('Yeterli altının yok.', 'warn'); return; }
          p.inv.gold -= 500; G.crewHired = true; G.notify('Tayfa "Çırak Mert" gemine katıldı. Su boşaltır, tahta varsa delikleri onarır.', 'good', 5000);
        } });
        opts.push({ label: 'Hanın aşçısına balık pişirt (5 altın / balık)', fn: () => {
          const fish = p.inv.stacks.filter((s) => s.id.startsWith('balik:'));
          if (!fish.length) { G.notify('Pişirecek balığın yok.'); return; }
          const cost = fish.length * 5;
          if (p.inv.gold < cost) { G.notify('Yeterli altının yok.', 'warn'); return; }
          p.inv.gold -= cost;
          for (const f of fish) p.inv.removeStack(f);
          p.inv.add('pismis_balik', fish.length, null, true);
          G.notify(`${fish.length} balık ızgara yapıldı.`, 'good');
        } });
        setTimeout(() => G.emit('dialogExtra', opts), 0);
        break;
      }
      case 'cartographer': {
        const opts = [];
        if (st === 1 && !this.flags.ilkHarita) opts.push({ label: 'Tuzla beni gönderdi — ilk haritamı alabilir miyim?', fn: () => { this.flags.ilkHarita = true; treasure.giveMap('marti_1'); G.storySites = ['marti_1']; G.notify('Haritayı incelemek için 5 tuşuna bas.', 'quest', 5000); } });
        opts.push({ label: 'Rastgele hazine haritası satın al (150 altın)', fn: () => { if (p.inv.gold < 150) { G.notify('Yeterli altının yok.', 'warn'); return; } p.inv.gold -= 150; treasure.giveMap(); } });
        opts.push({ label: 'Haritalarımı sat', fn: () => G.emit('openShop', { role: 'cartographer' }) });
        opts.push({ label: 'Şişedeki mesajları aç', fn: () => { const n = p.inv.count('sise_mesaj'); if (!n) { G.notify('Şişe mesajın yok.'); return; } p.inv.remove('sise_mesaj', n); for (let i = 0; i < n; i++) treasure.giveMap(); } });
        opts.push(close);
        D(MERCHANTS.cartographer.greet + (st === 1 && !this.flags.ilkHarita ? '<br><br>Ah, Tuzla\'nın yeni gözdesi! Al bakalım, Martı Adacığı\'nın haritası. İpuçlarını adanın gerçek görünümüyle karşılaştır.' : ''), opts);
        break;
      }
      case 'treasure': {
        const opts = [{ label: 'Ganimet ve mücevher sat', fn: () => G.emit('openShop', { role: 'treasure' }) }];
        if (p.carrying) {
          const c = treasure.chestById(p.carrying.id);
          if (c) opts.unshift({ label: `Taşıdığım ${c.T.name}'nı sat (${CHEST_TIERS[c.tier].value} altın)`, fn: () => { const v = shop.sellCarriedChest(treasure); G.notify(`Sandık satıldı: +${v} altın`, 'good'); } });
        }
        if (G.ship && G.ship.hold.chests.length && shop.shipNearPort()) {
          const tot = G.ship.hold.chests.reduce((a, h) => a + CHEST_TIERS[h.tier].value, 0);
          opts.unshift({ label: `Ambardaki ${G.ship.hold.chests.length} sandığı sat (${tot} altın)`, fn: () => shop.sellHoldChests() });
        }
        opts.push(close);
        D(MERCHANTS.treasure.greet, opts);
        break;
      }
      case 'general': case 'fisher': case 'weapons':
        G.emit('openShop', { role });
        break;
      case 'travel': {
        // hızlı yolculuk: keşfedilmiş limanlar arasında, gemiyle birlikte
        const here = (npc.port && ports.byId(npc.port)) || ports.nearest(p.pos.x, p.pos.z);
        const known = ports.list.filter((pt) => pt !== here && (pt.core || this.discovered[pt.island]));
        const shipHere = G.ship && !G.ship.sunk && ports.atShip(G.ship, 120) === here;
        const opts = [];
        if (shipHere && known.length) {
          for (const pt of known) {
            const d = Math.hypot(pt.x - here.x, pt.z - here.z);
            const cost = Math.round(25 + d / 40);
            opts.push({ label: `${pt.name} — ${(d / 1000).toFixed(1)} km · ${cost} altın`, fn: () => G.emit('fastTravel', { to: pt.id, cost, from: here.id }) });
          }
        }
        opts.push(close);
        D(!known.length ? 'Henüz başka bir limanı keşfetmedin. Denize açıl; bulduğun her liman rota defterime girer.'
          : shipHere ? `Rüzgâr ve akıntıyı bilirim kaptan. Gemini ve tayfanı istediğin limana ben götürürüm — yol parası peşin.<br><span class="muted">Hızlı yolculukta gemi ve ambarı seninle gelir; yolculuk birkaç saat sürer.</span>`
          : 'Seni götürebilirim ama gemin bu limanda demirli değil. Önce gemini iskeleye yanaştır.', opts);
        break;
      }
      case 'smuggler': {
        const day = sky.hour >= 5 && sky.hour < 20;
        if (day) { D('Gün ışığında iş yapmam kaptan. Fenerler yanınca gel; pazar ancak gece kurulur.', [close]); break; }
        D(MERCHANTS.smuggler.greet, [{ label: 'Mallarına bak', fn: () => G.emit('openShop', { role: 'smuggler' }) }, close]);
        break;
      }
      case 'prisoner':
        D('"Kaptan! Bizi buradan çıkar! Gardiyanlar gidince hücrenin kilidini kırabilirsin."', [close]);
        break;
      case 'tailor':
        D('Bir korsan kıyafetinden tanınır! Yeni şapkalar, ceketler, mücevherler… Kozmetikler savaşta güç vermez ama herkes seni hatırlar.', [
          { label: 'Görünümümü değiştir / kozmetik satın al', fn: () => G.emit('openTailor') }, close]);
        break;
      case 'shipwright': {
        const s = G.ship;
        const rc = shop.repairCost();
        const opts = [
          { label: rc > 0 ? `Gemiyi tamir et (${rc} altın)` : 'Gemi sağlam', fn: () => shop.repairShip() },
          { label: 'Geliştirmeler ve gemi görünümü', fn: () => G.emit('openShipyard') },
          { label: `${SHIP_TYPES.brigantine.name} satın al (${SHIP_TYPES.brigantine.price} altın)`, fn: () => G.emit('confirmBuyShip', 'brigantine') },
          close,
        ];
        if (s.sunk) opts.unshift({ label: 'Batan gemimi kurtar (600 altın + tamir)', fn: () => G.emit('raiseShip') });
        D(`Usta Bora: "${s.name}" ${s.sunk ? 'denizin dibini boyluyor!' : `iyi görünüyor… Gövde %${Math.round(s.hp / s.maxHp * 100)}, ${s.holes.length} delik.`} Ne yapalım?`, opts);
        break;
      }
      case 'board': {
        const list = this.boardQuests();
        const opts = list.map((t) => ({ label: `${t.title} — ${t.text} (Ödül: ${t.reward})`, fn: () => this.acceptSide(t) }));
        opts.push(close);
        D(list.length ? 'Görev panosunda yeni ilanlar var:' : 'Şimdilik yeni ilan yok. Sonra tekrar bak.', opts);
        break;
      }
    }
  },
};
