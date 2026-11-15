import * as THREE from 'three';
import { G } from './game/ctx.js';
import { engine } from './core/engine.js';
import { assets } from './core/assets.js';
import { input } from './core/input.js';
import { audio } from './core/audio.js';
import { save } from './core/save.js';
import { settings } from './core/settings.js';
import { game } from './game/game.js';
import { effects } from './game/effects.js';
import { combat } from './game/combat.js';
import { enemies } from './game/enemies.js';
import { physics } from './world/physics.js';
import { islands } from './world/islands.js';
import { bosses } from './game/bosses.js';
import { ports } from './world/ports.js';
import * as archipelago from './world/archipelago.js';
import { npcs } from './game/npcs.js';
import { quests } from './game/quests.js';
import { events } from './game/events.js';
import { shipControl } from './game/shipControl.js';
import { animals } from './wildlife/animals.js';
import { megafauna } from './wildlife/megafauna.js';
import { hazards } from './world/hazards.js';
import { worldEvents } from './game/worldEvents.js';
import { fish } from './wildlife/fish.js';
import { fishing } from './wildlife/fishing.js';
import { seagear } from './wildlife/seagear.js';
import { treasure } from './treasure/treasure.js';
import { net, sinyalSunucusu } from './net/net.js';
import { Ship } from './ship/ship.js';
import { port } from './world/port.js';
import { sky } from './world/sky.js';
import { time } from './world/time.js';
import { bodies } from './world/bodies.js';
import { weatherfx } from './world/weatherfx.js';
import { details } from './world/details.js';
import { terrain } from './world/terrain.js';
import { ocean } from './world/ocean.js';
import { post } from './core/post.js';
import { kk } from './core/kk.js';
import { Character } from './player/character.js';
import { crowd } from './game/crowd.js';
import { ui } from './ui/ui.js';
import { hud } from './ui/hud.js';
import { panels } from './ui/panels.js';
import { menu } from './ui/menu.js';
import { creator } from './ui/creator.js';
import { openJournal } from './ui/journal.js';
import { openSkills } from './ui/skills.js';
import { openDice } from './ui/dice.js';
import { progress } from './game/progress.js';
import { defaultAppearance } from './player/appearance.js';
import { tpCamera } from './player/camera.js';
import { interact } from './game/interact.js';
import { initMapBase } from './ui/mapArt.js';
import { el } from './core/util.js';
import { TEST } from './core/testmode.js';
import { SURUM, derleme } from './core/surum.js';

// K-20 yoklaması: katı kipte (ES modülü) çıplak çağrıda this tanımsızdır; tek HTML IIFE paketi "use strict"siz ise false olur
const KATI = (function () { return this === undefined; })();

const TIPS = [
  'İpucu: Hazine haritalarındaki ipuçlarını adanın gerçek görünümüyle karşılaştır — heykelin baktığı yön, palmiyelerin dizilişi…',
  'İpucu: Çapayı atmadan gemiden inersen, rüzgâr gemini sürükleyebilir.',
  'İpucu: Büyük sandıklar ağırdır; bir tayfa arkadaşınla birlikte taşırsan çok daha hızlı gidersin.',
  'İpucu: Geceleri Kemik Adası\'nda iskeletler güçlenir ve hayaletler ortaya çıkar.',
  'İpucu: Balık tutarken ip gerginliğini yeşilde tut; balığın kaçtığı yönün tersine bas.',
  'İpucu: Dalarken oksijenine dikkat et — bitince boğulmaya başlarsın.',
  'İpucu: Yankı Mağarası çok karanlık. Meşaleni F ile yak.',
  'İpucu: Bazı kumsallar yalnızca alçak suda açığa çıkar. Gelgit saatlerini Korsan Defteri\'nin Zaman Çizelgesi sekmesinde gör.',
  'İpucu: İki günde bir limana "Altın Martı" ticaret gemisi uğrar; nadir mallar satar ve hazinelere daha iyi para verir.',
  'İpucu: Dürbünü Z ile çıkar; baktığın adanın, geminin ya da canlının adı ve uzaklığı yazılır.',
  'İpucu: Fırtınada yelkenleri azalt, su hortumlarından uzak dur; şimşekli havada açık denizde gemine yıldırım düşebilir.',
  'İpucu: Şafakta ve gün batımında balıklar yeme daha hızlı vurur.',
  'İpucu: Dükkânlar gece kapanır; Kırlangıç Hanı\'nda oda tutup sabaha kadar uyuyabilirsin.',
];

const misc = {
  name: 'misc', saveKey: 'misc',
  start(data) { G.crewHired = !!data?.misc?.crewHired; G.ownedShips = data?.misc?.ownedShips || ['sloop']; },
  save() { return { crewHired: !!G.crewHired, ownedShips: G.ownedShips || ['sloop'] }; },
};

async function boot() {
  // Test kancaları modülü (yalnız test kipi) en başta istenir, boot sonunda beklenir: söz o zamana çoktan çözülmüş olur ve
  // await bir görev sınırı yaratmaz. Sonda başlatılan import(), menü açıldıktan sonraki ağır ilk görevi (SwiftShader'da 1,7–4,8 sn)
  // __ready'den ÖNCEYE alıyordu; v0.4'te bu görev __ready'den SONRA çalışır (Faz 1 A2 ölçümü). İstisna, yükleme ekranı
  // kaldırılmadan önceki await'te yükselir (aşağıda; A2-UY-02).
  let kancaSozu = null;
  if (TEST) { kancaSozu = import('./test/kancalar.js'); kancaSozu.catch(() => {}); }
  // A-18: depo erişimi en başta denetlenir. Site verisi engelliyse (localStorage okumak bile SecurityError atar) oyun kayıtsız açılır;
  // menü ve kayıt denemeleri oyuncuya "tarayıcı kayda izin vermiyor" der (save.js bütün erişimleri korur, istisna buraya çıkmaz).
  G.noStorage = !save.available();
  if (G.noStorage) console.warn('localStorage kullanılamıyor; kayıt yapılamayacak.');
  settings.load();
  const prof = save.profile();
  G.profile = prof || { appearance: defaultAppearance('m'), unlocked: [], recentRooms: [] };
  G.profile.appearance = { ...defaultAppearance(G.profile.appearance?.gender || 'm'), ...(G.profile.appearance || {}) };
  G.on('profileChanged', () => save.writeProfile(G.profile));

  const loadFill = document.getElementById('load-fill');
  const loadText = document.getElementById('load-text');
  document.getElementById('load-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  const setLoad = (f, t) => { loadFill.style.width = Math.round(f * 100) + '%'; if (t) loadText.textContent = t; };

  engine.init(document.getElementById('game'));
  input.init(engine.renderer.domElement);
  G.scene = engine.scene; G.camera = engine.camera; G.renderer = engine.renderer;
  settings.apply();

  try { await Promise.race([document.fonts.load('40px "Pirata One"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* yoksay */ }
  setLoad(0.02, 'Modeller yükleniyor…');
  await assets.loadAll((f) => setLoad(0.02 + f * 0.33, 'Modeller yükleniyor…'));

  for (const s of [misc, time, bodies, effects, combat, treasure, enemies, animals, megafauna, fish, fishing, seagear, npcs, islands, hazards, bosses, quests, progress, events, worldEvents, weatherfx, details, crowd]) game.register(s);
  net.init(engine.scene);
  const q = settings.v.quality;
  await game.buildWorld(q, (f, t) => setLoad(0.35 + f * 0.6, t));
  setLoad(0.96, 'Deniz haritası çiziliyor…');
  await new Promise((r) => setTimeout(r, 0));
  await initMapBase();
  // gölgelendiricileri önceden derle (oyun içinde ilk görüşte takılmayı azaltır)
  setLoad(0.98, 'Gölgelendiriciler hazırlanıyor…');
  try { await Promise.race([engine.renderer.compileAsync(engine.scene, engine.camera), new Promise((r) => setTimeout(r, 8000))]); } catch (e) { /* yoksay */ }
  ui.init(); hud.init(); panels.init();
  menu.init(handlers);
  game.setupMenuScene();
  wire();
  engine.updaters.add((dt) => {
    game.update(dt);
    hud.update(dt);
    net.update(dt);
    // A-10: duraklatma yalnız kurulmuş oturumda (oyuncu var, yükleme katmanı kapalı)
    if (G.state === 'playing' && G.player && !game.loading && !G.uiOpen && input.pressed('duraklat') && !ui.isOpen() && performance.now() - (ui._justClosed || 0) > 200) { input.consume('duraklat'); menu.pause(handlers); }
    input.endFrame();
  });
  engine.start();
  setLoad(1, 'Hazır!');
  // Test kancaları (window.DK, DK.sim/tap/press/snap/snapFrom, DK.mod, DK.__sayac) YALNIZ test kipinde: ?test=1 VE yerel köken
  // (K9-3; K-07). Kurulum beklenir; window.__ready ondan SONRA yazılır (koşucular __ready'yi bekler, §5.7-2).
  // Bekleme ve kurulum yükleme ekranı kaldırılıp menü açılmadan ÖNCE yapılır (A2-UY-02): modül yüklenemez ya da install istisna
  // atarsa boot() burada reddedilir; catch'in "Oyun başlatılamadı" iletisi görünür yükleme ekranında kalır ve menü açılmaz.
  // Söz bu noktada çoktan çözülmüştür; await yalnız bir mikro görevdir, buradan __ready'ye dek araya bir görev girmez.
  if (TEST) {
    const { install } = await kancaSozu;
    install({ G, assets, archipelago, physics, islands, bosses, ports, game, input, engine, post, settings, tpCamera, interact, npcs, Ship, kk, Character, handlers, net, ui, creator, hud, quests, treasure, enemies, animals, megafauna, hazards, progress, fish, fishing, seagear, shipControl, THREE, save, port, combat, effects, events, worldEvents, sky, time, bodies, weatherfx, details, terrain, ocean, crowd, audio });
  }
  document.getElementById('loading').classList.remove('active');
  menu.show(true);
  const unlockAudio = async () => { await audio.init(); audio.resume(); audio.setMusic('menu'); window.removeEventListener('pointerdown', unlockAudio); window.removeEventListener('keydown', unlockAudio); };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  // davet bağlantısı
  const join = new URLSearchParams(location.search).get('join');
  if (join) menu.joinScreen(join);
  window.__ready = true;
}

// Salt-okur tanı (K9-4; üretimde de var): yayın sonrası duman testi ve hata bildirimi için. Her çağrıda yalnız ilkel değerlerden
// oluşan, dondurulmuş yeni bir anlık görüntü döner; hiçbir oyun nesnesine başvuru vermez. Açılış yarıda kalsa da (boot hatası)
// okunabilsin diye boot()'tan önce kurulur.
window.__dkDurum = () => Object.freeze({
  surum: SURUM, derleme: derleme(), hazir: !!window.__ready, test: TEST, kati: KATI,
  tekDosya: !!window.__DK_SINGLE_FILE, isci: terrain.workers.length, yedek: !!terrain.fallback,
  isciHata: terrain.failures.length, araziKip: typeof terrain.mode === 'string' ? terrain.mode : String(terrain.mode ?? ''),
  eksikVarlik: assets.missing.length, kk: !!kk.ready, sinyal: sinyalSunucusu(),
});

const handlers = {
  async startGame({ kind = 'solo', slot = 0, data = null, appearance = null }) {
    menu.show(false);
    ui.closeAll();
    G.saveKind = kind;
    const app = appearance || (data?.appearance) || G.profile.appearance;
    // A-10: bölge hazırlığı sürerken menüye dönüldüyse start false döner: oturum kurulmadı, devam kodu (HUD, bildirim, kayıt) çalışmaz
    if (!await game.start({ appearance: app, save: data, slot, online: false, isHost: true })) return;
    afterStart();
    if (!data) G.notify('Kırlangıç Limanı\'na hoş geldin, korsan! (Esc: menü · J: defter)', 'quest', 6000);
    else G.notify(`Kayıt yüklendi: ${data.name}`, 'good');
    if (!data) handlers.saveNow(false);
  },

  continueLatest(latest) {
    if (latest.kind === 'online') { menu.hostScreen(); G.notify('Online dünyanı sürdürmek için odayı yeniden kur (kayıt yuvası seçili).', 'info', 5000); return; }
    handlers.startGame({ kind: latest.kind, slot: latest.slot, data: latest.data });
  },

  async startOnlineHost(room) {
    menu.show(false);
    ui.closeAll();
    G.saveKind = 'online';
    const data = save.read('online', room.slot || 0);
    if (!await game.start({ appearance: G.profile.appearance, save: data, slot: room.slot || 0, online: true, isHost: true, difficulty: room.difficulty, friendlyFire: room.friendlyFire })) return; // A-10
    afterStart();
    net.startGame();
    setTimeout(() => net.sendWorldAll(), 400);
    G.notify(`Oda açık: ${room.code}. Arkadaşların oyun sırasında da katılabilir.`, 'good', 6000);
    if (!data) handlers.saveNow(false);
  },

  async startOnlineGuest() {
    menu.show(false);
    ui.closeAll();
    G.saveKind = 'guest';
    const guest = save.read('guest', 0);
    // konuk kaydı: envanter, rütbe/yetenek ve kişisel görev/keşif/koleksiyon durumu (hikâye aşaması ev sahibinden gelir)
    const data = guest ? { player: { inv: guest.inv, hp: 100 }, progress: guest.progress || null, quests: guest.quests || null } : null;
    if (!await game.start({ appearance: G.profile.appearance, save: data, online: true, isHost: false, difficulty: net.room?.difficulty })) return; // A-10
    afterStart();
    G.notify('Odaya katıldın! Dünya oda sahibinden yükleniyor…', 'good');
  },

  saveNow(manual = false) {
    if (G.state !== 'playing' || !G.player) return;
    // A-18: depo yok (site verisi engelli): elle kayıtta her seferinde, otomatik kayıtta oturumda bir kez bildirilir
    if (G.noStorage) {
      if (manual || !G._depoUyarisi) G.notify('Tarayıcı kayda izin vermiyor (site verisi engelli): ilerleme kaydedilemiyor.', 'warn', 4500);
      G._depoUyarisi = true;
      return;
    }
    if (!G.isHost) {
      // konuk: kişisel envanter + rütbe/yetenek ilerlemesi yerel olarak saklanır (odak kaybı/sekme kapanışı dahil)
      save.write('guest', 0, { inv: G.player.inv.toJSON(), progress: progress.save(), quests: quests.save(), savedAt: Date.now(), name: G.playerName });
      progress._guestSave();
      if (manual) G.notify('Kişisel ilerlemen kaydedildi.', 'good');
      return;
    }
    // ölü/yaralı düşmüş oyuncu kaydedilmez (0 HP ve ölüm konumu kalıcı olmasın)
    if (G.player.dead || G.player.downed) { if (manual) G.notify('Bayılmışken kayıt yapılamaz.', 'warn'); return; }
    const data = game.serialize();
    data.appearance = G.player.appearance;
    const ok = save.write(G.saveKind === 'online' ? 'online' : 'solo', G.slot ?? 0, data);
    G.notify(ok ? (manual ? 'Oyun kaydedildi.' : 'Otomatik kayıt yapıldı.') : 'Kayıt başarısız oldu (depolama alanı?).', ok ? 'good' : 'warn', 2200);
  },

  toMenu() {
    ui.closeAll();
    ui.cancelRelock(); // KI-235: son panelin kapanışı kilidi 30 ms sonra yeniden istemesin (menüde kilit kalıyordu)
    handlers.saveNow(false);
    game.stop();
    uyanisBirak(); // B2-D1: bekleyen uzak uyanış yeni oturuma taşınmaz
    net.leave();
    hud.show(false);
    menu.show(true);
    input.unlockPointer();
  },

  // A-14: uyanış yeri (gemi ya da en yakın keşfedilmiş liman) uzaktaysa arazisi hazır değildir: önce perde altında hazırlanır
  // (await terrain.prepare, yarıçap 400), oyuncu ancak sonra diriltilip taşınır; uyanışın ilk karesinde karo ağları ve derinlik
  // penceresi yerindedir. Uyanış yeri zaten hazırsa (yakın ölüm) v0.4'teki gibi hemen uyanılır. Bekleme sırasında oturum değişir
  // ya da oyuncu başka yoldan kaldırılırsa (co-op) devam kodu hiçbir şey yapmaz.
  // Karşıt denetim B2-D1: ölüm ekranının düğmeleri paneli kapatıp buraya gelir; bu yüzden hiçbir dal oyuncuyu ölü ve ekransız
  // bırakmaz. (1) Bekleyen bir uyanış varsa bu çağrı onun yerine geçer (son seçim geçerli; eski devam kodu hiçbir şey yapmaz).
  // Önce bekleyen kayıt oturuma bağlı değildi ve her çağrıyı yutuyordu: eski oturumdan kalan ya da aynı oturumda (co-op: kaldırılıp
  // yeniden bayılma) bekleyen uyanış varken oyuncu ölü kalıyordu. Oturum bitince (toMenu, hostLeft) kayıt bırakılır. (2) Gemide
  // uyanış beklenirken gemi batar ya da değişirse (konukta oda sahibinin gemisi) v0.4'teki gibi en yakın keşfedilmiş limanda
  // uyanılır; önce devam kodu sessizce dönüyordu. (3) Bekleme sırasında oyuncu başka yoldan kaldırılır ya da yeniden bayılırsa
  // bekleyen uyanış hemen biter (perde kalkar, yeni ölüm ekranı görünür); eski hazırlık bitince oyuncu eski seçime taşınmaz.
  // (4) Hazırlık beklenmedik biçimde reddedilirse uyanış 'timeout' gibi sürer.
  respawn(where) {
    const p = G.player;
    if (!p) return;
    const onceki = uyanisBirak();
    const s = G.ship;
    const gemide = where === 'ship' && s && !s.sunk;
    let hx, hz, pt = null;
    if (gemide) { hx = s.x; hz = s.z; }
    else {
      // en yakın keşfedilmiş limanda uyan
      pt = ports.nearest(p.pos.x, p.pos.z, Infinity, (x) => x.core || quests.discovered[x.island]) || ports.list[0];
      hx = pt.core ? port.boardingPoint.x - 6 : pt.spawn.x; hz = pt.core ? port.shoreZ - 22 : pt.spawn.z;
    }
    const uyan = (hazirlik) => {
      p.revive(100);
      p.char.model.rotation.x = 0; p.char.model.position.y = 0;
      if (gemide) p.boardShip(s, s.model.stations.ladderTop.clone());
      else {
        p.mode = 'ground'; p.ship = null;
        islands.buildNear(hx, hz); // KI-236: uyanış limanının yapıları/platformları oyuncu konmadan önce kurulu
        p.pos.set(hx, terrain.heightAt(hx, hz) + 1, hz);
        p.vel.set(0, 0, 0);
      }
      if (hazirlik === 'timeout') G.notify('Uyandığın yerin çevresi zamanında hazırlanamadı; eksik arazi arka planda yükleniyor.', 'warn', 6000);
      G.notify('Gözlerini açtın. Biraz başın dönüyor…', 'info');
    };
    if (bolgeHazir(hx, hz)) { if (onceki) perdeKaldir(onceki.perde); uyan(); return; }
    const tok = G.session;
    const kayit = handlers._uyanis = { tok, perde: null, ortu: null, bitir: null, iv: 0 };
    input.block('uyanis');
    const h = kayit.perde = perde(gemide ? (s.name || 'Gemin') : pt.name, 'Kendine gelmeye çalışıyorsun…');
    // KI-237: hızlı yolculuktaki gibi perde inmeye başladığı anda örtü açılır (3B sahne çizilmez); tutamak kayıttadır, uyanış nasıl
    // biterse bitsin (uyanisBirak) kapanır. Hazırlık bu yüzden prepareCovered'sız çağrılır: uyanış erken biterse (aşağıda) arka planda
    // süren hazırlık ekranı örtülü tutmasın.
    kayit.ortu = game.ortuAc();
    let limana = false;
    // Bekleme kayıt bırakılınca (yeni seçim, oturum sonu, yeniden bayılma: uyanisBirak) ya da oyuncu başka yoldan kaldırılınca
    // (co-op 'revive') hazırlığı beklemeden biter: kaldırılan oyuncu perdenin altında, girdisi kilitli kalmaz.
    const iptal = new Promise((r) => { kayit.bitir = r; kayit.iv = setInterval(() => { if (!p.dead) r('kaldirildi'); }, 200); });
    const hazirlik = new Promise((r) => setTimeout(r, 1200))
      .then(() => (handlers._uyanis === kayit && tok === G.session && p.dead ? terrain.prepare(hx, hz, { radius: 400 }) : null))
      .catch((e) => { console.error('Uyanış bölgesi hazırlanamadı:', e); return 'timeout'; });
    Promise.race([hazirlik, iptal]).then((sonuc) => {
      if (handlers._uyanis !== kayit) return; // yerine yeni bir uyanış seçimi geçti ya da uyanış bırakıldı
      if (tok !== G.session || G.state !== 'playing' || G.player !== p || !p.dead) return; // oturum değişti ya da arkadaşın kaldırdı
      if (gemide && (G.ship !== s || s.sunk)) { limana = true; return; } // gemi bekleme sırasında battı ya da değişti
      uyan(sonuc);
    }).finally(() => {
      if (handlers._uyanis !== kayit) return; // perde, kilit ve örtü bırakan tarafından (uyanisBirak, game.stop) temizlendi
      uyanisBirak();
      if (limana) {
        G.notify('Gemine ulaşılamadı; en yakın limanda uyanıyorsun.', 'warn', 4000);
        handlers.respawn('port'); // gerekirse perde altında yeni hazırlık (perdeyi o devralır; aşağıdaki kaldırma etkisiz kalır)
      }
      perdeKaldir(h, 600);
    });
  },
};

// A-14: (x, z) çevresi zaten hazır mı: 300 m içinde ≥ 6 karo ağı, orada ağı olmayan (bekleyen) karo yok ve okyanus derinlik
// penceresi noktaya 520 m'den yakın (terrain.requestDepth'in yeniden istek eşiği). Hazırsa uyanış beklemeden yapılır.
function bolgeHazir(x, z) {
  const w = terrain.depthWin;
  if (!w || Math.hypot(w.x0 + w.size / 2 - x, w.z0 + w.size / 2 - z) > 520) return false;
  let ag = 0;
  for (const t of terrain.tiles.values()) {
    if (Math.hypot(t.x0 + terrain.TILE / 2 - x, t.z0 + terrain.TILE / 2 - z) >= 300) continue;
    if (!t.mesh) return false;
    ag++;
  }
  return ag >= 6;
}

// Kararma perdesi (#sleep-fade): uyuma, hızlı yolculuk ve uzak uyanış aynı öğeyi kullanır. Başlık ve alt satır DÜZ METİN olarak
// yazılır (karşıt denetim B2-D3: gemi adını oyuncu, co-op'ta oda sahibi belirler; perde önce innerHTML kullanıyordu, addaki HTML ve
// betik çalışıyordu). Dönen tutamak perdenin o anki sahibidir: perdeKaldir perdeyi yalnız hâlâ o çağrınınsa indirir (eski bir
// zamanlayıcı ya da yerine başkası geçmiş bir uyanış, sonradan açılan perdeyi indirmesin). game.stop perdeyi koşulsuz kaldırır.
let perdeSahibi = 0;
function perde(baslik, alt) {
  let f = document.getElementById('sleep-fade');
  if (!f) { f = document.createElement('div'); f.id = 'sleep-fade'; document.body.appendChild(f); }
  f.textContent = '';
  f.append(el('div', { class: 't1' }, String(baslik ?? '')), el('div', { class: 't2' }, String(alt ?? '')));
  f.classList.add('on');
  return { f, no: ++perdeSahibi };
}
function perdeKaldir(h, ms = 0) {
  if (!h) return;
  const kaldir = () => { if (perdeSahibi === h.no) h.f.classList.remove('on'); };
  if (ms > 0) setTimeout(kaldir, ms); else kaldir();
}

// Bekleyen uzak uyanışı bırak (B2-D1): kayıt silinir, beklemesi biter, örtüsü kapanır, girdi kilidi kalkar; o uyanışın devam kodu
// artık hiçbir şey yapmaz. Uyanışın kendisi (bitince), yeni bir uyanış seçimi (respawn), yeniden bayılma (playerDied) ve oturumun
// bitişi (toMenu, hostLeft) çağırır. Bırakılan kayıt döner; perdesini çağıran kaldırır ya da devralır.
function uyanisBirak() {
  const k = handlers._uyanis;
  if (!k) return null;
  handlers._uyanis = null;
  clearInterval(k.iv);
  k.bitir?.('birakildi');
  game.ortuKapat(k.ortu);
  input.unblock('uyanis');
  return k;
}

function afterStart() {
  hud.show(true);
  G.playerName = G.player.appearance.name;
  tpCamera.targetDist = 4.6;
}

function wire() {
  G.on('autosave', () => handlers.saveNow(false));
  G.on('playerDied', (e) => {
    // B2-D1: yeniden bayılma (co-op: kaldırılıp yeniden düşme) bekleyen uzak uyanışı geçersiz kılar. Perdesi hemen kalkar: yeni ölüm
    // ekranı (z 40) önce perdenin (z 60) altında açılıyor, eski hazırlık bitip oyuncu eski seçime taşınana dek seçilemiyordu.
    const k = uyanisBirak();
    if (k) perdeKaldir(k.perde);
    setTimeout(() => menu.deathScreen(e.cause, handlers), 2200);
  });
  G.on('openJournal', () => openJournal());
  G.on('openSkills', () => openSkills());
  G.on('openDice', (npc) => { ui.closeAll(); openDice(npc); });
  // Handa uyuma (zaman çizelgesi): ekran kararır, zaman ilerler, can dolar
  G.on('sleepAtInn', (e) => {
    const p = G.player;
    if (G.online && !G.isHost) { G.notify('Zamanı yalnızca oda sahibi ilerletebilir. Kaptana handa uyumasını söyle!', 'warn', 4000); return; }
    if (p.inv.gold < e.cost) { G.notify('Oda için yeterli altının yok.', 'warn'); return; }
    if (G.inCombat) { G.notify('Tehlike varken uyuyamazsın!', 'warn'); return; }
    p.inv.gold -= e.cost;
    const hours = time.sleepUntil(e.until);
    p.hp = p.maxHp; p.stamina = 100; p.poison = 0;
    time.addLog(`Kırlangıç Hanı'nda ${Math.round(hours)} saat dinlenildi`, 'info');
    G.emit('sleepFade', { day: time.day, hour: sky.hour, hours });
    if (G.online) net.broadcast({ t: 'sleep', day: time.day, hour: sky.hour, hours });
  });
  // Hızlı yolculuk (rota kaptanı): ekran kararır, varış bölgesi hazırlanır, gemi ve oyuncu taşınır.
  // A-03: tek seferde bir yolculuk (G.travelBusy, oturuma bağlı; bekleme sırasında gelen ikinci istek yok sayılır); perde süresince
  // oyun girdisi kilitli (Esc açık); ücret VARIŞTA düşülür (bekleme sırasında alınan kayıt ya da menüye dönüş altını eksiltmez; kayıt
  // biçimi aynı); devam kodu oturum belirteci ve G.state/G.player/G.ship/s.sunk/p.dead ile denetlenir: bekleme sırasında oturum ya
  // da oyuncu/gemi değiştiyse hiçbir şey değişmez. Hazırlık 'timeout' dönerse oyuncu bilgilendirilir (brief madde 7, çağıran tarafı).
  let yolculukNo = 0;
  G.on('fastTravel', async (e) => {
    const p = G.player, s = G.ship;
    const to = ports.byId(e?.to), from = ports.byId(e?.from);
    if (G.state !== 'playing' || !p || p.dead || !to || !s || s.sunk) return;
    if (G.travelBusy && G.travelBusy.tok === G.session) return;
    if (G.online && !G.isHost) { G.notify('Hızlı yolculuğu yalnız oda sahibi başlatabilir.', 'warn', 3000); return; }
    if (G.inCombat) { G.notify('Çatışma sürerken yola çıkılmaz!', 'warn'); return; }
    const cost = Math.max(0, Math.round(Number(e.cost) || 0)); // bozuk/eksik ücret altını NaN yapmasın
    if (p.inv.gold < cost) { G.notify('Yol parası için yeterli altının yok.', 'warn'); return; }
    if (p.carrying) { G.notify('Önce taşıdığını bırak ya da ambara koy.', 'warn'); return; }
    const yol = G.travelBusy = { id: ++yolculukNo, tok: G.session };
    const gecerli = () => yol.tok === G.session && G.state === 'playing' && G.player === p && G.ship === s && !s.sunk && !p.dead;
    input.block('yolculuk');
    const d = from ? Math.hypot(to.x - from.x, to.z - from.z) : 3000;
    const hours = Math.max(1, Math.round(d / 2600));
    const f = perde(to.name, `Rota kaptanı dümende… ${hours} saatlik yolculuk.`);
    const ortu = game.ortuAc(); // KI-237: perde inerken 3B sahne çizilmez (güncelleyiciler sürer), GPU birikimi erir; hazırlıktan hemen sonra kapanır
    audio.play('confirm', { vol: 0.3, rate: 0.7 });
    let vardi = false;
    try {
      await new Promise((r) => setTimeout(r, 1200));
      if (!gecerli()) return;
      const hazirlik = await game.prepareCovered(to.mooring.x, to.mooring.z, { radius: 450 });
      game.ortuKapat(ortu); // varış kareleri normal hızda çizilsin (perde 0,9 sn sonra kalkar)
      if (!gecerli()) return;
      p.inv.gold -= cost; // A-03: ücret varışta
      s.x = to.mooring.x; s.z = to.mooring.z; s.yaw = to.mooring.yaw;
      s.anchorPt = null; // eski çapa noktası kalmasın (zincir gemiyi kilometrelerce öteye çekmesin)
      s.vx = 0; s.vz = 0; s.speed = 0; s.yawRate = 0;
      s.anchorState = 'down'; s.anchorT = 1; s.anchored = true; s.sail = s.sailTarget = 0;
      if (G.rowboat) G.rowboat.dock();
      islands.buildNear(to.boarding.x, to.boarding.z); // KI-236: iskele platformu oyuncu konmadan önce kurulu
      p.leaveShipToWorld(new THREE.Vector3(to.boarding.x, to.boarding.y + 0.3, to.boarding.z));
      p.onGround = false; p.vel.set(0, 0, 0);
      time.sleepUntil((sky.hour + hours) % 24);
      time.addLog(`${from ? from.name : 'Liman'} → ${to.name} hızlı yolculuk (${cost} altın)`, 'info');
      if (G.online) net.broadcast({ t: 'teleport', x: to.boarding.x, y: to.boarding.y + 0.3, z: to.boarding.z, ship: [s.x, s.z, s.yaw], hour: sky.hour, day: time.day });
      vardi = true;
      perdeKaldir(f, 900);
      if (hazirlik === 'timeout') G.notify(`${to.name} çevresi zamanında hazırlanamadı; eksik arazi arka planda yükleniyor.`, 'warn', 6000);
      G.notify(`${to.name} limanına vardın.`, 'good', 3500);
      G.emit('arrivedPort', { port: to.id });
    } finally {
      game.ortuKapat(ortu);
      if (G.travelBusy === yol) { G.travelBusy = null; input.unblock('yolculuk'); }
      // aynı oturumda iptal (oyuncu bayıldı, gemi battı): perde kalkar, ücret alınmadı. Oturum bittiyse game.stop perdeyi kaldırdı.
      if (!vardi && yol.tok === G.session) perdeKaldir(f);
    }
  });
  G.on('sleepFade', (e) => {
    const f = perde(`Gün ${e.day} · ${time.hourString(e.hour)}`, e.hour < 12 ? 'Martı çığlıklarıyla uyandın. Yeni bir gün, yeni maceralar…' : 'Dinlendin; akşam rüzgârı limanı serinletiyor.');
    audio.play('confirm', { vol: 0.3, rate: 0.6 });
    perdeKaldir(f, 2600);
  });
  G.on('openTailor', () => {
    creator.open({ appearance: G.player.appearance, title: 'Terzi Lale — Gardırop', confirm: 'Giy', shopMode: true, onDone: (app) => { G.player.setAppearance(app); G.profile.appearance = app; G.emit('profileChanged'); if (G.online && !G.isHost) net.sendApp(); } });
  });
  G.on('hostLeft', (why) => {
    if (G.state !== 'playing' && G.state !== 'loading') return; // A-10: konuk yüklenirken oda kapanırsa da menüye dönülür
    handlers.saveNow(false);
    ui.cancelRelock();
    game.stop(); uyanisBirak(); net.leave(); hud.show(false); menu.show(true); input.unlockPointer();
    ui.alert('Oturum sona erdi', (why || 'Oda sahibi oyundan ayrıldı ya da bağlantı koptu.') + '<br>Kişisel envanterin kaydedildi.');
  });
  // konuk: dünya verisi (oyun henüz başlamadıysa beklet)
  G.on('netWorld', (m) => {
    if (G.state !== 'playing' || !G.player) { wire._pendingWorld = m; return; }
    applyWorld(m);
  });
  G.on('sessionStart', () => { if (wire._pendingWorld && !G.isHost) { const m = wire._pendingWorld; wire._pendingWorld = null; applyWorld(m); } });
  function applyWorld(m) {
    if (m.ship) {
      const s = G.ship;
      if (s.typeId !== m.ship.typeId) shipControl.replaceShip(engine.scene, m.ship.typeId);
      const sh = G.ship;
      sh.id = m.ship.id; sh.name = m.ship.name; sh.upg = m.ship.upg; sh.hold = m.ship.hold; sh.hp = m.ship.hp; sh.holes = m.ship.holes || []; sh._syncHoles();
      sh.x = m.ship.x; sh.z = m.ship.z; sh.yaw = m.ship.yaw; sh.cannonballs = m.ship.cannonballs; sh.planks = m.ship.planks;
      if (JSON.stringify(sh.look) !== JSON.stringify(m.ship.look)) sh.rebuild(m.ship.look);
    }
    for (const c of m.chests || []) net._applyChestState(c);
    for (const pk of m.pickups || []) net._spawnPickup(pk);
    if (m.quests) { quests.stage = m.quests.stage; quests.flags = Object.assign(quests.flags || {}, m.quests.flags || {}); quests.markers = m.quests.markers || []; quests.journalMesh.visible = !quests.flags.gunluk; }
    if (m.time) { import('./world/sky.js').then(({ sky }) => { sky.hour = m.time.hour; sky.setWeather(m.time.weather, true); sky.windDir = m.time.wind; }); }
    if (m.rowboat && G.rowboat) { if (m.rowboat.state === 'water') { G.rowboat.state = 'water'; G.rowboat.x = m.rowboat.x; G.rowboat.z = m.rowboat.z; G.rowboat.yaw = m.rowboat.yaw; } }
    // konuk limanda başlar
    const p = G.player;
    p.pos.set(port.boardingPoint.x - 4 + Math.random() * 3, 3, port.shoreZ - 18);
  }
  G.on('netNeedShip', (sd) => {
    if (G.ships.some((s) => s.id === sd.id)) return;
    const s = new Ship(engine.scene, sd.typeId || 'sloop', { id: sd.id, name: sd.name, look: sd.look || {}, x: sd.st[0], z: sd.st[1], yaw: sd.st[2] });
    G.ships.push(s);
  });
  G.on('netReplaceShip', (d) => {
    shipControl.replaceShip(engine.scene, d.typeId);
    Object.assign(G.ship, { id: d.id, name: d.name, upg: d.upg, hold: d.hold });
  });
  // sohbet
  const chatBox = document.getElementById('chat-box'), chatIn = document.getElementById('chat-input'), chatLog = document.getElementById('chat-log');
  G.on('openChat', () => { chatBox.classList.remove('hidden'); G.uiOpen = true; input.unlockPointer(); setTimeout(() => chatIn.focus(), 10); });
  chatIn.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.code === 'Enter' || e.code === 'Escape') {
      if (e.code === 'Enter' && chatIn.value.trim()) net.chat(chatIn.value.trim());
      chatIn.value = ''; chatIn.blur(); G.uiOpen = false; input.lockPointer();
      setTimeout(() => { if (!chatIn.matches(':focus')) chatBox.classList.add('hidden'); }, 6000);
    }
  });
  G.on('chat', (m) => {
    if (G.state !== 'playing') return;
    chatBox.classList.remove('hidden');
    while (chatLog.childElementCount > 200) chatLog.removeChild(chatLog.firstChild); // günlük DOM'u sınırsız büyümez
    chatLog.appendChild(el('div', {}, el('b', { style: { color: /^#[0-9a-fA-F]{3,8}$/.test(m.color || '') ? m.color : '#f3d27a' } }, String(m.from ?? '') + ': '), String(m.text ?? '')));
    chatLog.scrollTop = 1e6;
    clearTimeout(wire._ct);
    wire._ct = setTimeout(() => { if (!chatIn.matches(':focus')) chatBox.classList.add('hidden'); }, 8000);
  });
  // ses olayları
  G.on('sfx', (e) => audio.play(e.name, { pos: e.pos, vol: e.vol, rate: e.rate }));
  // işaretçi kilidi
  // Esc ile işaretçi kilidi bırakılınca duraklat menüsü
  document.addEventListener('pointerlockchange', () => {
    if (!G.noAutoPause && !document.pointerLockElement && G.state === 'playing' && G.player && !game.loading && !ui.isOpen() && !G.uiOpen && performance.now() - (ui._justClosed || 0) > 300) menu.pause(handlers);
  });
  engine.renderer.domElement.addEventListener('click', () => { if (G.state === 'playing' && !G.uiOpen && !ui.isOpen()) input.lockPointer(); });
  engine.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); handlers.saveNow(false); G.notify('Grafik bağlamı kaybedildi (sürücü/GPU). Oyun kaydedildi; sayfayı yenilemen gerekebilir.', 'warn', 10000); });
  engine.renderer.domElement.addEventListener('webglcontextrestored', () => G.notify('Grafik bağlamı geri geldi.', 'good', 4000));
  window.addEventListener('beforeunload', (e) => {
    if (G.state === 'playing') { handlers.saveNow(false); e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing') handlers.saveNow(false); });
}

// A-04: açılış hatası iletisi hata türüne göre ayrılır (önce her hata "WebGL destekli tarayıcı gerekiyor" diye WebGL'e bağlanıyordu;
// site verisi engeli ya da arazi hatası yanıltıcı biçimde WebGL sorunu gibi görünüyordu)
function acilisIletisi(e) {
  const m = String((e && (e.message || e)) || 'bilinmeyen hata').slice(0, 240);
  const tek = 'tek dosya sürümünü (DenizKorsanlari-SonHazine.html)';
  if (/webgl|graphics context|getContext/i.test(m)) return { tur: 'WebGL', ileti: `Oyun başlatılamadı: tarayıcı WebGL grafik bağlamını açamadı (${m}).`, oneri: 'WebGL destekli güncel bir tarayıcı (Chrome, Edge, Firefox) kullan ve donanım hızlandırmasını aç.' };
  if (/dynamically imported module|module script|importing a module|failed to fetch|networkerror|load failed|import/i.test(m)) return { tur: 'modül', ileti: `Oyun başlatılamadı: oyun dosyalarından biri yüklenemedi (${m}).`, oneri: `Bağlantını denetleyip sayfayı yenile; sorun sürerse ${tek} kullan.` };
  if (/arazi|terrain|işçi|worker/i.test(m)) return { tur: 'arazi', ileti: `Oyun başlatılamadı: arazi üretimi başarısız oldu (${m}).`, oneri: `Sayfayı yenile; sorun sürerse ${tek} dene.` };
  return { tur: 'bilinmeyen', ileti: `Oyun başlatılamadı: beklenmeyen bir hata oluştu (${m}).`, oneri: `Sayfayı yenile; sorun sürerse ${tek} dene ve bu iletiyi bildir.` };
}

boot().catch((e) => {
  console.error(e);
  const t = document.getElementById('load-text');
  if (!t) return;
  const r = acilisIletisi(e);
  window.__dkAcilisHatasi = r.tur;
  t.textContent = r.ileti;
  t.appendChild(document.createElement('br'));
  t.appendChild(el('small', {}, r.oneri));
});
