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
import { treasure } from './treasure/treasure.js';
import { net } from './net/net.js';
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
  settings.load();
  const prof = save.profile();
  G.profile = prof || { appearance: defaultAppearance('m'), unlocked: [], recentRooms: [] };
  G.profile.appearance = { ...defaultAppearance(G.profile.appearance?.gender || 'm'), ...(G.profile.appearance || {}) };
  G.on('profileChanged', () => save.writeProfile(G.profile));

  const loadFill = document.getElementById('load-fill');
  const loadText = document.getElementById('load-text');
  document.getElementById('load-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  const setLoad = (f, t) => { loadFill.style.width = Math.round(f * 100) + '%'; if (t) loadText.textContent = t; };

  if (!save.available()) console.warn('localStorage kullanılamıyor; kayıt yapılamayacak.');
  engine.init(document.getElementById('game'));
  input.init(engine.renderer.domElement);
  G.scene = engine.scene; G.camera = engine.camera; G.renderer = engine.renderer;
  settings.apply();

  try { await Promise.race([document.fonts.load('40px "Pirata One"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* yoksay */ }
  setLoad(0.02, 'Modeller yükleniyor…');
  await assets.loadAll((f) => setLoad(0.02 + f * 0.33, 'Modeller yükleniyor…'));

  for (const s of [misc, time, bodies, effects, combat, treasure, enemies, animals, megafauna, fish, fishing, npcs, islands, hazards, bosses, quests, progress, events, worldEvents, weatherfx, details, crowd]) game.register(s);
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
    if (G.state === 'playing' && !G.uiOpen && input.pressed('duraklat') && !ui.isOpen() && performance.now() - (ui._justClosed || 0) > 200) { input.consume('duraklat'); menu.pause(handlers); }
    input.endFrame();
  });
  engine.start();
  setLoad(1, 'Hazır!');
  document.getElementById('loading').classList.remove('active');
  menu.show(true);
  const unlockAudio = async () => { await audio.init(); audio.resume(); audio.setMusic('menu'); window.removeEventListener('pointerdown', unlockAudio); window.removeEventListener('keydown', unlockAudio); };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  // davet bağlantısı
  const join = new URLSearchParams(location.search).get('join');
  if (join) menu.joinScreen(join);
  window.DK = { G, assets, archipelago, physics, islands, bosses, ports, game, input, engine, post, settings, tpCamera, interact, npcs, Ship, kk, Character, handlers, net, ui, quests, treasure, enemies, animals, megafauna, hazards, progress, fish, fishing, shipControl, THREE, save, port, combat, effects, events, worldEvents, sky, time, bodies, weatherfx, details, terrain, ocean, crowd };
  // Test: yalnız 3B tuvali yakala (HUD hariç) — yazılımsal GPU'da sayfa ekran görüntüsünden daha kararlı
  window.DK.snap = (q = 0.85) => { post.render(); return engine.renderer.domElement.toDataURL('image/jpeg', q); };
  // belirli bir bakış açısından yakala (test): from/to = [x,y,z]
  window.DK.snapFrom = (from, to, q = 0.85) => {
    const cam = engine.camera;
    cam.position.set(...from); cam.lookAt(...to); cam.updateMatrixWorld(true);
    post.render();
    return engine.renderer.domElement.toDataURL('image/jpeg', q);
  };
  // Test/hata ayıklama yardımcıları: oyunu render etmeden ileri sar
  window.DK.sim = (seconds, dt = 1 / 30) => {
    const n = Math.round(seconds / dt);
    for (let i = 0; i < n; i++) { game.update(dt); hud.update(dt); net.update(dt); input.endFrame(); }
    return n;
  };
  window.DK.tap = (code) => { input.pressedSet.add(code); input.down.add(code); setTimeout(() => input.down.delete(code), 150); };
  // eşzamanlı tuş basışı (test): basılı tut, simüle et, bırak
  window.DK.press = (code, dur = 0.1) => { input.pressedSet.add(code); input.down.add(code); window.DK.sim(dur); input.down.delete(code); window.DK.sim(1 / 30); };
  window.__ready = true;
}

const handlers = {
  async startGame({ kind = 'solo', slot = 0, data = null, appearance = null }) {
    menu.show(false);
    ui.closeAll();
    G.saveKind = kind;
    const app = appearance || (data?.appearance) || G.profile.appearance;
    await game.start({ appearance: app, save: data, slot, online: false, isHost: true });
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
    await game.start({ appearance: G.profile.appearance, save: data, slot: room.slot || 0, online: true, isHost: true, difficulty: room.difficulty, friendlyFire: room.friendlyFire });
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
    await game.start({ appearance: G.profile.appearance, save: data, online: true, isHost: false, difficulty: net.room?.difficulty });
    afterStart();
    G.notify('Odaya katıldın! Dünya oda sahibinden yükleniyor…', 'good');
  },

  saveNow(manual = false) {
    if (G.state !== 'playing' || !G.player) return;
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
    handlers.saveNow(false);
    game.stop();
    net.leave();
    hud.show(false);
    menu.show(true);
    input.unlockPointer();
  },

  respawn(where) {
    const p = G.player;
    p.revive(100);
    p.char.model.rotation.x = 0; p.char.model.position.y = 0;
    const s = G.ship;
    if (where === 'ship' && s && !s.sunk) p.boardShip(s, s.model.stations.ladderTop.clone());
    else {
      p.mode = 'ground'; p.ship = null;
      // en yakın keşfedilmiş limanda uyan
      const pt = ports.nearest(p.pos.x, p.pos.z, Infinity, (x) => x.core || quests.discovered[x.island]) || ports.list[0];
      const sx = pt.core ? port.boardingPoint.x - 6 : pt.spawn.x, sz = pt.core ? port.shoreZ - 22 : pt.spawn.z;
      p.pos.set(sx, terrain.heightAt(sx, sz) + 1, sz);
      p.vel.set(0, 0, 0);
    }
    G.notify('Gözlerini açtın. Biraz başın dönüyor…', 'info');
  },
};

function afterStart() {
  hud.show(true);
  G.playerName = G.player.appearance.name;
  tpCamera.targetDist = 4.6;
}

function wire() {
  G.on('autosave', () => handlers.saveNow(false));
  G.on('playerDied', (e) => setTimeout(() => menu.deathScreen(e.cause, handlers), 2200));
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
  // Hızlı yolculuk (rota kaptanı): ekran kararır, varış bölgesi hazırlanır, gemi ve oyuncu taşınır
  G.on('fastTravel', async (e) => {
    const p = G.player, s = G.ship;
    const to = ports.byId(e.to), from = ports.byId(e.from);
    if (!to || !s || s.sunk) return;
    if (G.online && !G.isHost) { G.notify('Hızlı yolculuğu yalnız oda sahibi başlatabilir.', 'warn', 3000); return; }
    if (G.inCombat) { G.notify('Çatışma sürerken yola çıkılmaz!', 'warn'); return; }
    if (p.inv.gold < e.cost) { G.notify('Yol parası için yeterli altının yok.', 'warn'); return; }
    if (p.carrying) { G.notify('Önce taşıdığını bırak ya da ambara koy.', 'warn'); return; }
    p.inv.gold -= e.cost;
    let f = document.getElementById('sleep-fade');
    if (!f) { f = document.createElement('div'); f.id = 'sleep-fade'; document.body.appendChild(f); }
    const d = from ? Math.hypot(to.x - from.x, to.z - from.z) : 3000;
    const hours = Math.max(1, Math.round(d / 2600));
    f.innerHTML = `<div class="t1">${to.name}</div><div class="t2">Rota kaptanı dümende… ${hours} saatlik yolculuk.</div>`;
    f.classList.add('on');
    audio.play('confirm', { vol: 0.3, rate: 0.7 });
    await new Promise((r) => setTimeout(r, 1200));
    await terrain.prepare(to.mooring.x, to.mooring.z, { radius: 450 });
    s.x = to.mooring.x; s.z = to.mooring.z; s.yaw = to.mooring.yaw;
    s.anchorPt = null; // eski çapa noktası kalmasın (zincir gemiyi kilometrelerce öteye çekmesin)
    s.vx = 0; s.vz = 0; s.speed = 0; s.yawRate = 0;
    s.anchorState = 'down'; s.anchorT = 1; s.anchored = true; s.sail = s.sailTarget = 0;
    if (G.rowboat) G.rowboat.dock();
    p.leaveShipToWorld(new THREE.Vector3(to.boarding.x, to.boarding.y + 0.3, to.boarding.z));
    p.onGround = false; p.vel.set(0, 0, 0);
    time.sleepUntil((sky.hour + hours) % 24);
    time.addLog(`${from ? from.name : 'Liman'} → ${to.name} hızlı yolculuk (${e.cost} altın)`, 'info');
    if (G.online) net.broadcast({ t: 'teleport', x: to.boarding.x, y: to.boarding.y + 0.3, z: to.boarding.z, ship: [s.x, s.z, s.yaw], hour: sky.hour, day: time.day });
    setTimeout(() => f.classList.remove('on'), 900);
    G.notify(`${to.name} limanına vardın.`, 'good', 3500);
    G.emit('arrivedPort', { port: to.id });
  });
  G.on('sleepFade', (e) => {
    let f = document.getElementById('sleep-fade');
    if (!f) { f = document.createElement('div'); f.id = 'sleep-fade'; document.body.appendChild(f); }
    f.innerHTML = `<div class="t1">Gün ${e.day} · ${time.hourString(e.hour)}</div><div class="t2">${e.hour < 12 ? 'Martı çığlıklarıyla uyandın. Yeni bir gün, yeni maceralar…' : 'Dinlendin; akşam rüzgârı limanı serinletiyor.'}</div>`;
    f.classList.add('on');
    audio.play('confirm', { vol: 0.3, rate: 0.6 });
    setTimeout(() => f.classList.remove('on'), 2600);
  });
  G.on('openTailor', () => {
    creator.open({ appearance: G.player.appearance, title: 'Terzi Lale — Gardırop', confirm: 'Giy', shopMode: true, onDone: (app) => { G.player.setAppearance(app); G.profile.appearance = app; G.emit('profileChanged'); if (G.online && !G.isHost) net.sendApp(); } });
  });
  G.on('hostLeft', (why) => {
    if (G.state !== 'playing') return;
    handlers.saveNow(false);
    game.stop(); net.leave(); hud.show(false); menu.show(true);
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
    if (!G.noAutoPause && !document.pointerLockElement && G.state === 'playing' && !ui.isOpen() && !G.uiOpen && performance.now() - (ui._justClosed || 0) > 300) menu.pause(handlers);
  });
  engine.renderer.domElement.addEventListener('click', () => { if (G.state === 'playing' && !G.uiOpen && !ui.isOpen()) input.lockPointer(); });
  engine.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); handlers.saveNow(false); G.notify('Grafik bağlamı kaybedildi (sürücü/GPU). Oyun kaydedildi; sayfayı yenilemen gerekebilir.', 'warn', 10000); });
  engine.renderer.domElement.addEventListener('webglcontextrestored', () => G.notify('Grafik bağlamı geri geldi.', 'good', 4000));
  window.addEventListener('beforeunload', (e) => {
    if (G.state === 'playing') { handlers.saveNow(false); e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing') handlers.saveNow(false); });
}

boot().catch((e) => {
  console.error(e);
  const t = document.getElementById('load-text');
  if (t) t.innerHTML = `Oyun başlatılamadı: ${e.message}<br><small>WebGL destekli güncel bir tarayıcı (Chrome, Edge, Firefox) gerekiyor.</small>`;
});
