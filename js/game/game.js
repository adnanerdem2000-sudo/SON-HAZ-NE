import * as THREE from 'three';
import { G } from './ctx.js';
import { engine } from '../core/engine.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { props } from '../world/props.js';
import { port } from '../world/port.js';
import { cave } from '../world/cave.js';
import { physics } from '../world/physics.js';
import { Player, EQUIP_SLOTS } from '../player/player.js';
import { tpCamera } from '../player/camera.js';
import { interact } from './interact.js';
import { shipControl } from './shipControl.js';
import { clamp, damp, smoothstep } from '../core/util.js';
import { ISLANDS } from '../world/worldData.js';

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
    terrain.build();
    onProgress?.(0.35, 'Arazi örülüyor…');
    await tick();
    terrain.buildMeshes(scene, quality);
    onProgress?.(0.5, 'Okyanus dolduruluyor…');
    await tick();
    ocean.build(scene, quality);
    sky.build(scene, engine.renderer, quality);
    sky.onThunder = () => audio.thunder();
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
      if (data.world.weather) sky.setWeather(data.world.weather, true);
      sky.windDir = data.world.windDir ?? sky.windDir;
    } else { sky.hour = 8.5; sky.setWeather('gunesli', true); }
    this.playTime = data?.playTime || 0;
    tpCamera.yaw = Math.PI; tpCamera.pitch = 0.3;
    for (const s of this.systems) if (s.start) await s.start(data, opts);
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
      world: { hour: sky.hour, weather: sky.weatherKey, windDir: sky.windDir },
    };
    if (data.player.onShip === false && p.mode === 'swim') data.player.pos = { x: p.lastSafe.x, y: p.lastSafe.y, z: p.lastSafe.z };
    for (const s of this.systems) if (s.save) { const k = s.saveKey || s.name; data[k] = s.save(); }
    return data;
  },

  update(dt) {
    input.endFrame && null;
    if (G.state === 'menu') { this.menuUpdate(dt); return; }
    if (G.state !== 'playing') return;
    this.playTime += dt;
    const p = G.player;
    // global tuşlar
    if (!G.uiOpen && !p.dead) this._globalKeys();
    // kamera girişi
    const look = input.lookDelta();
    if (!G.uiOpen && p.mode !== 'cannon') tpCamera.rotate(look.dx, look.dy);
    if (input.wheel && !G.uiOpen) tpCamera.zoom(input.wheel);
    shipControl.update(dt);
    p.update(dt);
    // gemiler
    for (const s of G.ships) {
      if (G.isHost || s.ai) s.update(dt);
      else s.updateTransform(dt);
      s.tickCannons(dt);
      if (s.events.length) { for (const e of s.events) G.emit('shipEvent', { ship: s, ...e }); s.events.length = 0; }
    }
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
    tpCamera.update(cam, head, dt, opts);
    if (G.spyglass) { cam.fov = 18; cam.updateProjectionMatrix(); }
  },

  // Ortam: gökyüzü, deniz, sesler, rüzgâr
  _env(dt, focus) {
    const cam = engine.camera;
    const wh = ocean.heightAt(cam.position.x, cam.position.z);
    sky.underwater = cam.position.y < wh - 0.05;
    const p = G.player;
    sky.inCave = G.state === 'playing' && p ? damp(sky.inCave, p.inCave, 3, dt) : 0;
    sky.update(dt, focus, cam, G.isHost);
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
