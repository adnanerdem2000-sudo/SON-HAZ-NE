import * as THREE from 'three';
import { G } from './ctx.js';
import { engine } from '../core/engine.js';
import { input, keyLabel } from '../core/input.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { time } from '../world/time.js';
import { props } from '../world/props.js';
import { port } from '../world/port.js';
import { cave } from '../world/cave.js';
import { physics } from '../world/physics.js';
import { Player, EQUIP_SLOTS } from '../player/player.js';
import { tpCamera } from '../player/camera.js';
import { interact } from './interact.js';
import { shipControl } from './shipControl.js';
import { Ship } from '../ship/ship.js';
import { post } from '../core/post.js';
import { clamp, damp, smoothstep } from '../core/util.js';
import { ISLANDS } from '../world/worldData.js';
import { enemies } from './enemies.js';
import { animals } from '../wildlife/animals.js';

// Oyun oturumu: dünya, oyuncu, gemi, sistemler, döngü
export const game = {
  systems: [],
  worldBuilt: false,
  menuCam: { t: 0 },
  autosaveT: 0,
  playTime: 0,

  register(sys) { this.systems.push(sys); return sys; },

  async buildWorld(quality, onProgress) {
    if (this.worldBuilt) return;
    const scene = engine.scene;
    onProgress?.(0.05, 'Takımadalar oluşturuluyor…');
    await tick();
    terrain.init(scene, quality);
    onProgress?.(0.2, 'Okyanus dolduruluyor…');
    await tick();
    ocean.build(scene, quality);
    onProgress?.(0.3, 'Arazi örülüyor…');
    await terrain.prepare(160, 470, { radius: 900 });
    sky.build(scene, engine.renderer, quality);
    sky.onThunder = () => audio.thunder();
    sky.timeRef = time;
    onProgress?.(0.62, 'Ormanlar büyütülüyor…');
    await tick();
    props.build(scene, quality);
    onProgress?.(0.75, 'Kırlangıç Limanı kuruluyor…');
    await tick();
    port.build(scene);
    cave.build(scene);
    onProgress?.(0.85, 'Canlılar uyanıyor…');
    await tick();
    for (const s of this.systems) if (s.init) await s.init(scene);
    shipControl.init();
    this.worldBuilt = true;
    onProgress?.(1, 'Hazır!');
  },

  // Menü arka planı: gün batımında yelken açan gemi
  setupMenuScene() {
    G.state = 'menu';
    if (!G.ship) shipControl.createPlayerShip(engine.scene, null);
    const s = G.ship;
    s.x = 160; s.z = 470; s.yaw = 1.9; s.anchorState = 'up'; s.anchorT = 0; s.anchored = false; s.sail = s.sailTarget = 1;
    sky.hour = 18.2; sky.locked = true; sky.setWeather('gunesli', true);
    this.menuCam.t = 0;
  },

  menuUpdate(dt) {
    const s = G.ship;
    if (!s) return;
    // menüde gemi sabit rota izler
    s.setRudder(0.08 * Math.sin(this.menuCam.t * 0.1));
    s.update(dt);
    if (Math.hypot(s.x, s.z) > 900 || terrain.heightAt(s.x + Math.sin(s.yaw) * 60, s.z + Math.cos(s.yaw) * 60) > -6) { s.yaw += dt * 0.25; }
    G.rowboat?.update(dt);
    this.menuCam.t += dt;
    const t = this.menuCam.t;
    const a = s.yaw + Math.PI * 0.62 + Math.sin(t * 0.05) * 0.3;
    const cam = engine.camera;
    cam.position.set(s.x + Math.sin(a) * 26, 7 + Math.sin(t * 0.13) * 1.5, s.z + Math.cos(a) * 26);
    cam.lookAt(s.x + Math.sin(s.yaw) * 4, 6, s.z + Math.cos(s.yaw) * 4);
    if (cam.fov !== 55) { cam.fov = 55; cam.updateProjectionMatrix(); }
    this._env(dt, { x: s.x, y: 0, z: s.z });
    for (const sys of this.systems) if (sys.menuUpdate) sys.menuUpdate(dt);
  },

  // Yeni oturum başlat
  async start(opts) {
    const scene = engine.scene;
    G.state = 'playing';
    G.online = !!opts.online;
    G.isHost = opts.isHost !== false;
    G.slot = opts.slot ?? null;
    G.difficulty = opts.difficulty || 'normal';
    G.friendlyFire = !!opts.friendlyFire;
    sky.locked = false;
    G.spyglass = false;
    document.getElementById('spyglass')?.classList.add('hidden');
    const data = opts.save || null;
    // gemi
    for (const s of G.ships) s.dispose();
    G.ships = [];
    if (G.rowboat) { scene.remove(G.rowboat.mesh); G.rowboat = null; }
    shipControl.createPlayerShip(scene, data?.ship || null);
    if (!data?.ship) { G.ship.anchorState = 'down'; G.ship.anchorT = 1; G.ship.anchored = true; }
    // oyuncu
    if (G.player) { G.player.char.dispose(); G.player = null; }
    const app = opts.appearance;
    const spawn = data?.player?.pos || { x: port.boardingPoint.x - 8, y: 3, z: port.shoreZ - 20 };
    // uzak bir adada kaydedildiyse önce o bölgenin arazisini hazırla
    await terrain.prepare(spawn.x, spawn.z, { radius: 500 });
    const p = new Player(scene, app, { x: spawn.x, y: spawn.y + 0.5, z: spawn.z, yaw: Math.PI });
    G.player = p;
    G.playerName = app.name;
    if (data?.player) {
      p.inv.load(data.player.inv);
      p.hp = data.player.hp ?? 100;
      if (data.player.onShip && G.ship) p.boardShip(G.ship, new THREE.Vector3(data.player.lx || 0, 0, data.player.lz || 0));
    } else {
      // başlangıç donanımı
      p.inv.gold = 150;
      for (const [id, n] of [['kilic', 1], ['tabanca', 1], ['mermi', 12], ['kurek', 1], ['olta', 1], ['yem_solucan', 10], ['fener', 1], ['pusula', 1], ['muz', 3], ['ekmek', 2]]) p.inv.add(id, n);
    }
    if (data?.world) {
      sky.hour = data.world.hour ?? 9;
      sky.windDir = sky.windTarget = data.world.windDir ?? sky.windDir;
      sky.wetness = data.world.wetness || 0;
    } else { sky.hour = 8.5; }
    this.playTime = data?.playTime || 0;
    tpCamera.yaw = Math.PI; tpCamera.pitch = 0.3;
    for (const s of this.systems) if (s.start) await s.start(data, opts);
    // hava: kayıttan ya da açık havayla başla (takvim yüklendikten sonra tahmin kurulur)
    sky.setWeather(data?.world?.weather || 'acik', true);
    this.autosaveT = 0;
    G.emit('sessionStart', opts);
    input.lockPointer();
  },

  stop() {
    for (const s of this.systems) if (s.stop) s.stop();
    G.state = 'menu';
    G.online = false;
    this.setupMenuScene();
  },

  // Kayıt verisi
  serialize() {
    const p = G.player;
    const data = {
      version: 1,
      savedAt: Date.now(),
      playTime: this.playTime,
      name: G.playerName,
      player: {
        pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, hp: p.hp, inv: p.inv.toJSON(),
        onShip: p.mode === 'deck' || p.mode === 'helm' || p.mode === 'cannon', lx: p.local.x, lz: p.local.z,
      },
      ship: G.ship ? G.ship.serialize() : null,
      world: { hour: sky.hour, weather: sky.weatherKey, windDir: sky.windDir, wetness: sky.wetness },
    };
    if (data.player.onShip === false && p.mode === 'swim') data.player.pos = { x: p.lastSafe.x, y: p.lastSafe.y, z: p.lastSafe.z };
    for (const s of this.systems) if (s.save) { const k = s.saveKey || s.name; data[k] = s.save(); }
    return data;
  },

  update(dt) {
    input.endFrame && null;
    if (G.state === 'menu') { this.menuUpdate(dt); return; }
    if (G.state !== 'playing' || !G.player) return;
    // vuruş anı duraksaması (hit-stop): ağır darbe ve parry'de kısa ağır çekim
    if (G.hitStop > 0) { G.hitStop -= dt; dt *= 0.12; }
    this.playTime += dt;
    const p = G.player;
    // global tuşlar
    if (!G.uiOpen && !p.dead) this._globalKeys();
    // kamera girişi
    const look = input.lookDelta();
    if (!G.uiOpen && p.mode !== 'cannon') tpCamera.rotate(look.dx, look.dy);
    if (input.wheel && !G.uiOpen && !G.spyglass) tpCamera.zoom(input.wheel);
    shipControl.update(dt);
    p.update(dt);
    // gemiler
    for (const s of G.ships) {
      if (G.isHost || !G.online || s.kinematic) s.update(dt);
      else s.clientUpdate(dt);
      s.tickCannons(dt);
      if (s.events.length) { for (const e of s.events) G.emit('shipEvent', { ship: s, ...e }); s.events.length = 0; }
    }
    if (G.isHost || !G.online) Ship.collideAll(G.ships, dt);
    G.rowboat?.update(dt);
    interact.update(dt);
    for (const s of this.systems) if (s.update) s.update(dt);
    // kamera
    this._camera(dt);
    this._env(dt, p.pos);
    // otomatik kayıt
    this.autosaveT += dt;
    if (this.autosaveT > 120 && G.isHost) { this.autosaveT = 0; G.emit('autosave'); }
  },

  _globalKeys() {
    const p = G.player;
    for (const k in EQUIP_SLOTS) if (input.pressed(k)) p.equip(EQUIP_SLOTS[k]);
    if (input.pressed('fener')) p.toggleTorch();
    if (input.pressed('envanter')) G.emit('openInventory');
    if (input.pressed('harita')) G.emit('openMap');
    if (input.pressed('defter')) G.emit('openJournal');
    if (input.pressed('isaret')) G.emit('placeMarker');
    if (input.pressed('birak') && p.carrying) G.emit('dropCarry', { player: p });
    if (input.pressed('pusula')) G.emit('toggleCompass');
    if (input.pressed('sohbet') && G.online) G.emit('openChat');
    if (input.pressed('durbun')) this.toggleSpyglass();
  },

  // Dürbün: başın hizasından yakın görüş; bakılan ada, gemi ya da canlı tanımlanır
  toggleSpyglass(force) {
    const p = G.player;
    const on = force !== undefined ? force : !G.spyglass;
    if (on) {
      if (!p.inv.has('durbun')) { G.notify('Dürbünün yok. Tüccar Rıza\'dan ya da ticaret gemisinden alabilirsin.', 'warn'); return; }
      if (p.underwater || p.dead || p.downed || p.carrying || p.mode === 'cannon') return;
    }
    G.spyglass = on;
    this.spyZoom = this.spyZoom || 16;
    document.getElementById('spyglass').classList.toggle('hidden', !on);
    document.getElementById('crosshair').classList.add('hidden');
    document.body.classList.toggle('spyglass-on', on);
    p.char.root.visible = !on;
    audio.play('ui', { vol: 0.35, rate: on ? 1.2 : 0.8 });
  },

  _spyglassUpdate(dt) {
    const p = G.player;
    if (!G.spyglass) return;
    if (G.uiOpen || p.underwater || p.dead || p.downed || p.carrying || p.mode === 'cannon') { this.toggleSpyglass(false); return; }
    if (input.wheel) this.spyZoom = clamp(this.spyZoom + input.wheel * 2, 6, 30);
    const cam = engine.camera;
    const head = p.pos.clone(); head.y += p.mode === 'swim' ? 0.5 : 1.62;
    const dir = tpCamera.lookDir();
    // hafif el titremesi
    const t = performance.now() / 1000;
    cam.position.copy(head).addScaledVector(dir, 0.35);
    cam.lookAt(cam.position.x + dir.x * 10 + Math.sin(t * 1.3) * 0.012 * this.spyZoom, cam.position.y + dir.y * 10 + Math.sin(t * 1.9) * 0.01 * this.spyZoom, cam.position.z + dir.z * 10);
    if (Math.abs(cam.fov - this.spyZoom) > 0.01) { cam.fov = this.spyZoom; cam.updateProjectionMatrix(); }
    // hedef tanımlama
    this._spyT = (this._spyT || 0) - dt;
    if (this._spyT > 0) return;
    this._spyT = 0.25;
    let best = null, bestA = 0.06;
    const consider = (x, y, z, name, r = 0) => {
      const v = new THREE.Vector3(x - cam.position.x, y - cam.position.y, z - cam.position.z);
      const d = v.length();
      if (d < 3) return;
      const a = Math.acos(clamp(v.dot(dir) / d, -1, 1)) - Math.atan2(r, d);
      if (a < bestA) { bestA = a; best = { name, d }; }
    };
    for (const I of ISLANDS) if (Math.hypot(I.x - cam.position.x, I.z - cam.position.z) < 4500) consider(I.x, 10, I.z, I.name, I.r * 0.8);
    for (const s of G.ships) if (s !== p.ship && !s.sunk) consider(s.x, s.y + 4, s.z, s.kinematic ? `${s.name} (ticaret gemisi)` : s === G.ship ? `${s.name} (gemin)` : `${s.name || 'Yabancı gemi'}`, 4);
    for (const e of enemies.list || []) if (e.alive) consider(e.pos.x, e.pos.y + 1, e.pos.z, e.T.name, 0.5);
    for (const a of animals.list || []) if (a.alive !== false && a.S) consider(a.pos.x, a.pos.y + 0.5, a.pos.z, a.S.name, 0.5);
    const factor = (70 / this.spyZoom).toFixed(1);
    document.querySelector('#spyglass .sg-target').textContent = best ? `${best.name} · ${Math.round(best.d)} m` : '';
    document.querySelector('#spyglass .sg-help').textContent = `Yakınlaştırma ${factor}× · Tekerlek: yakınlaştır/uzaklaştır · ${keyLabel(input.bindings.durbun)}: kapat`;
  },

  _camera(dt) {
    const p = G.player;
    const cam = engine.camera;
    const head = p.headPos(new THREE.Vector3());
    let opts = {};
    if (p.mode === 'helm' && p.ship) {
      const s = p.ship;
      head.set(s.x, s.y + 5, s.z);
      opts = { dist: 17 + s.T.L * 0.4 };
    } else if (p.mode === 'cannon' && p.ship) {
      const s = p.ship;
      const { muzzle, dir } = s.cannonWorld(p.cannonIndex);
      head.copy(muzzle).addScaledVector(dir, -3.2);
      head.y += 1.6;
      tpCamera.yaw = Math.atan2(dir.x, dir.z);
      tpCamera.pitch = 0.18 - (p.cannonPitch || 0) * 0.6;
      opts = { dist: 2.4, snap: true, fov: 62 };
    } else if (p.mode === 'boat') {
      head.y += 0.6;
      opts = { dist: 6.5 };
    } else if (p.aiming) {
      opts = { dist: 2.3, shoulder: 0.65, fov: 58 };
    } else if (p.mode === 'swim') {
      opts = { underwater: p.underwater };
      head.y = p.pos.y + (p.underwater ? 1.4 : 1.5);
    }
    if (p.inCave > 0.3) opts.dist = Math.min(opts.dist ?? tpCamera.targetDist, 3.2);
    if (p.dead || p.downed) opts.dist = 6;
    if (G.spyglass) { this._spyglassUpdate(dt); return; }
    tpCamera.update(cam, head, dt, opts);
  },

  // Ortam: gökyüzü, deniz, sesler, rüzgâr
  _env(dt, focus) {
    const cam = engine.camera;
    terrain.update(cam.position.x, cam.position.z);
    const wh = ocean.heightAt(cam.position.x, cam.position.z);
    sky.underwater = cam.position.y < wh - 0.05;
    const p = G.player;
    sky.inCave = G.state === 'playing' && p ? damp(sky.inCave, p.inCave, 3, dt) : 0;
    sky.update(dt, focus, cam, G.isHost);
    post.update(sky);
    if (G.state === 'playing') time.update(dt);
    ocean.update(dt, cam);
    props.update(dt, sky.windStrength);
    const night = 1 - smoothstep(0.15, 0.6, sky.lightLevel);
    port.update(dt, night);
    G.emit('underwater', sky.underwater);
    audio.setListener(cam.position.x, cam.position.y, cam.position.z, tpCamera.yaw);
    const isl = terrain.islandAt(focus.x, focus.z, 1.05);
    const th = terrain.heightAt(focus.x, focus.z);
    audio.updateAmbience(dt, {
      underwater: sky.underwater,
      seaNear: clamp(1 - Math.max(0, th) / 25, 0.15, 1),
      waves: ocean.waveScale, wind: sky.windStrength, storm: sky.weather.lightning, rain: sky.weather.rain,
      jungle: isl && th > 3 ? 1 : 0, night: sky.isNight(), cave: sky.inCave,
    });
    // müzik bölgesi
    if (G.state === 'menu') audio.setMusic('menu');
    else if (!G.inCombat) {
      const ghost = isl && isl.biome === 'hayalet';
      audio.setMusic(sky.inCave > 0.5 ? 'cave' : ghost ? 'ghost' : isl ? 'island' : 'sea');
    } else audio.setMusic('battle');
    audio.updateMusic(dt);
  },
};

function tick() { return new Promise((r) => setTimeout(r, 0)); }
