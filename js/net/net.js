import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { Character } from '../player/character.js';
import { enemies } from '../game/enemies.js';
import { animals } from '../wildlife/animals.js';
import { treasure } from '../treasure/treasure.js';
import { combat } from '../game/combat.js';
import { effects } from '../game/effects.js';
import { interact } from '../game/interact.js';
import { quests } from '../game/quests.js';
import { sky } from '../world/sky.js';
import { time } from '../world/time.js';
import { weatherfx } from '../world/weatherfx.js';
import { audio } from '../core/audio.js';
import { damp, dampAngle, clamp } from '../core/util.js';

// Online co-op: WebRTC (PeerJS) üzerinden eşler arası bağlantı. Oda sahibi (host) dünyanın otoritesidir.
const VER = 'dksh-v1';
const PUB_SLOTS = 12;
const COLORS = ['#f3d27a', '#6ad0f0', '#ff8a70', '#9ad06a'];

function makeCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
function peerOpts() {
  const q = new URLSearchParams(location.search);
  const o = { debug: 0 };
  // Yerel test için özel sinyal sunucusu: ?peerhost=localhost&peerport=9000
  if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = q.get('peersecure') === '1'; }
  return o;
}

class RemotePlayer {
  constructor(scene, info) {
    this.id = info.id;
    this.name = info.name;
    this.color = info.color;
    this.app = info.app;
    this.char = new Character(info.app);
    scene.add(this.char.root);
    this.pos = new THREE.Vector3(0, -100, 0);
    this.yaw = 0;
    this.target = null;
    this.hp = 100;
    this.mode = 'ground';
    this.vel = new THREE.Vector3();
    this.downed = false;
    this.label = this._label(info.name, info.color);
    this.char.root.add(this.label);
  }
  _label(text, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    g.font = '36px "Pirata One", serif'; g.textAlign = 'center';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(text, 128, 44);
    g.fillStyle = color; g.fillText(text, 128, 44);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    s.scale.set(1.6, 0.4, 1); s.position.y = 2.3; s.renderOrder = 10;
    return s;
  }
  apply(st) { this.target = st; }
  update(dt) {
    const t = this.target;
    if (!t) return;
    let tx = t.x, ty = t.y, tz = t.z;
    // gemideyse gemi yerel koordinatlarından hesapla (titreşimsiz)
    if (t.ship && (t.mode === 'deck')) {
      const s = G.ships.find((x) => x.id === t.ship);
      if (s) { const w = s.localToWorld(new THREE.Vector3(t.lx, s.deckAt(t.lx, t.lz) + t.ly, t.lz)); tx = w.x; ty = w.y; tz = w.z; }
    }
    const far = Math.hypot(tx - this.pos.x, tz - this.pos.z) > 8;
    const k = far ? 1 : 1 - Math.exp(-14 * dt);
    const px = this.pos.x;
    const pz = this.pos.z;
    this.pos.x += (tx - this.pos.x) * k; this.pos.y += (ty - this.pos.y) * k; this.pos.z += (tz - this.pos.z) * k;
    this.vel.set((this.pos.x - px) / Math.max(dt, 1e-3), 0, (this.pos.z - pz) / Math.max(dt, 1e-3));
    this.yaw = dampAngle(this.yaw, t.yaw, 14, dt);
    this.mode = t.mode; this.hp = t.hp; this.downed = t.down;
    const c = this.char;
    c.root.position.copy(this.pos);
    c.root.rotation.y = this.yaw;
    if (t.anim && c.currentName !== t.anim) c.play(t.anim, 0.15, { once: /Slash|Shoot|Punch|Interact|Roll|Hit|Death|Wave/.test(t.anim) });
    if (c.heldType !== (t.eq === 'none' || t.eq === 'map' ? null : t.eq)) c.hold(t.eq === 'none' || t.eq === 'map' ? null : t.eq);
    c.overlay.carry = !!t.carry;
    c.overlay.swim = t.mode === 'swim';
    c.overlay.helm = t.mode === 'helm';
    c.overlay.row = t.mode === 'boat';
    c.overlay.swimPhase = (c.overlay.swimPhase || 0) + dt * 4;
    c.model.rotation.x = t.mode === 'swim' ? damp(c.model.rotation.x, t.swimP || 0, 6, dt) : 0;
    c.update(dt);
  }
  dispose(scene) { scene.remove(this.char.root); }
}

export const net = {
  peer: null,
  conns: new Map(), // host: peerId -> {conn, info}
  hostConn: null,
  roster: [],
  room: null,
  ready: false,
  sendT: 0,
  snapT: 0,

  init(scene) {
    this.scene = scene;
    // oyun içi olayları ağa aktar
    const relay = (evt, fn) => G.on(evt, (e) => { if (G.online) fn(e); });
    relay('netAction', (e) => this.sendGame({ t: 'act', ...e }));
    relay('netHurtEnemy', (e) => this.toHost({ t: 'hurtEnemy', ...e }));
    relay('netHurtAnimal', (e) => this.toHost({ t: 'hurtAnimal', ...e }));
    relay('netHurtPlayer', (e) => this.toPeer(e.id, { t: 'hurt', dmg: e.dmg, from: e.from, cause: e.cause }));
    relay('netDig', (e) => this.toHost({ t: 'dig', ...e }));
    relay('netChestReq', (e) => this.toHost({ t: 'chestReq', ...e }));
    relay('netPickupReq', (e) => this.toHost({ t: 'pickupReq', ...e }));
    relay('netChestSpawn', (e) => { if (G.isHost) this.broadcast({ t: 'chestSpawn', c: e.chest }); });
    relay('netChestState', (e) => this.sendGame({ t: 'chestState', c: e.chest }));
    relay('netChestGone', (e) => this.sendGame({ t: 'chestGone', id: e.id }));
    relay('netPickupSpawn', (e) => { if (G.isHost) this.broadcast({ t: 'pickupSpawn', pk: e.pk }); });
    relay('netPickupGone', (e) => { if (G.isHost) { this.broadcast({ t: 'pickupGone', id: e.id }); if (e.who !== G.myId) this.toPeer(e.who, { t: 'give', items: e.items }); } });
    relay('netHold', (e) => this.sendGame({ t: 'hold', ship: e.ship, hold: e.hold }));
    relay('netShipFull', (e) => this.sendGame({ t: 'shipFull', ship: e.ship, replace: e.replace }));
    relay('netMarker', (e) => this.sendGame({ t: 'marker', ...e }));
    relay('netStory', (e) => { if (G.isHost) this.broadcast({ t: 'story', ...e }); });
    relay('netShareGold', (e) => this.sendGame({ t: 'gold', amount: e.amount }));
    relay('netWeather', (e) => this.broadcast({ t: 'weather', w: e.w }));
    relay('shipCmd', (e) => { if (!G.isHost) this.toHost({ t: 'shipCmd', ...e }); else this.broadcast({ t: 'shipCmdFx', ...e }); });
    relay('boatCmd', (e) => this.sendGame({ t: 'boat', ...e }));
    relay('lock', (e) => this.sendGame({ t: 'lock', ...e, who: G.myId }));
    relay('cannonFired', (e) => { if (G.isHost) this.broadcast({ t: 'cannon', ship: e.ship, i: e.index, by: e.by }); });
    relay('fireCannon', (e) => { if (!G.isHost && e.by === G.myId) this.toHost({ t: 'fire', ship: e.ship.id, i: e.index, yaw: G.player.cannonYaw, pitch: G.player.cannonPitch }); });
    relay('mapGained', () => this.sendGame({ t: 'maps', sites: G.player.inv.stacks.filter((s) => s.id === 'hazine_haritasi').map((s) => s.data?.site) }));
    relay('playerDowned', () => this.sendGame({ t: 'downed' }));
    relay('netMapUsed', (e) => this.toPeer(e.who, { t: 'mapUsed', site: e.site }));
  },

  // ---------------- Bağlantı ----------------
  _newPeer(id) {
    return new Promise((res, rej) => {
      if (!window.Peer) { rej(new Error('PeerJS yüklenemedi')); return; }
      const p = id ? new window.Peer(id, peerOpts()) : new window.Peer(peerOpts());
      const to = setTimeout(() => rej(new Error('Sinyal sunucusuna bağlanılamadı (zaman aşımı).')), 12000);
      p.on('open', () => { clearTimeout(to); res(p); });
      p.on('error', (e) => { clearTimeout(to); rej(e); });
    });
  },

  async host(opts) {
    this.leave();
    this.room = { name: opts.name || 'Korsan Odası', public: !!opts.public, max: opts.max || 4, pw: opts.pw || '', difficulty: opts.difficulty, friendlyFire: !!opts.friendlyFire, slot: opts.slot };
    let peer = null;
    if (this.room.public) {
      for (let i = 0; i < PUB_SLOTS && !peer; i++) {
        try { peer = await this._newPeer(`${VER}-pub-${i}`); this.room.code = 'PUB' + i; } catch (e) { if (e.type !== 'unavailable-id') throw e; }
      }
      if (!peer) throw new Error('Tüm herkese açık oda yuvaları dolu. Özel oda kurmayı dene.');
    } else {
      for (let tries = 0; tries < 4 && !peer; tries++) {
        const code = makeCode();
        try { peer = await this._newPeer(`${VER}-${code}`); this.room.code = code; } catch (e) { if (e.type !== 'unavailable-id') throw e; }
      }
    }
    this.peer = peer;
    G.isHost = true; G.online = true; G.myId = peer.id;
    this.roster = [{ id: peer.id, name: G.profile.appearance.name, app: G.profile.appearance, color: COLORS[0], ready: true, host: true }];
    peer.on('connection', (conn) => this._onConn(conn));
    peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* yoksay */ } });
    this._remember(this.room.code, this.room.name);
    G.emit('roster', this.roster);
    return this.room;
  },

  _onConn(conn) {
    conn.on('open', () => {
      if (conn.metadata?.type === 'info') {
        conn.send({ t: 'info', name: this.room.name, players: this.roster.length, max: this.room.max, pw: !!this.room.pw, started: G.state === 'playing', ver: VER });
        setTimeout(() => conn.close(), 500);
        return;
      }
    });
    conn.on('data', (m) => this._hostData(conn, m));
    conn.on('close', () => this._dropPeer(conn.peer));
    conn.on('error', () => this._dropPeer(conn.peer));
  },

  _hostData(conn, m) {
    if (!m || !m.t) return;
    const pid = conn.peer;
    if (m.t === 'hello') {
      if (m.ver !== VER) { conn.send({ t: 'reject', why: 'Oyun sürümü farklı.' }); return; }
      if (this.room.pw && m.pw !== this.room.pw) { conn.send({ t: 'reject', why: 'Oda şifresi yanlış.' }); return; }
      const existing = this.roster.find((r) => r.name === m.name && !this.conns.has(r.id));
      if (this.roster.length >= this.room.max && !existing) { conn.send({ t: 'reject', why: 'Oda dolu.' }); return; }
      const color = COLORS[this.roster.length % COLORS.length];
      if (existing) this.roster = this.roster.filter((r) => r !== existing);
      const info = { id: pid, name: m.name, app: m.app, color, ready: false };
      this.roster.push(info);
      this.conns.set(pid, { conn, info });
      conn.send({ t: 'welcome', id: pid, color, room: { name: this.room.name, code: this.room.code, difficulty: this.room.difficulty }, roster: this.roster, started: G.state === 'playing' });
      if (G.state === 'playing') this._sendWorld(conn);
      this._broadcastRoster();
      G.notify(`${m.name} odaya katıldı.`, 'good');
      audio.play('confirm', { vol: 0.5 });
      return;
    }
    if (m.t === 'ping') { conn.send({ t: 'pong', ts: m.ts }); return; }
    const c = this.conns.get(pid);
    if (!c) return;
    switch (m.t) {
      case 'ready': c.info.ready = m.v; this._broadcastRoster(); break;
      case 'app': c.info.app = m.app; c.info.name = m.name; this._broadcastRoster(); break;
      case 'chat': this.broadcast({ t: 'chat', from: c.info.name, text: m.text, color: c.info.color }); G.emit('chat', { from: c.info.name, text: m.text, color: c.info.color }); break;
      case 'st': this._remoteState(pid, c.info, m.s); break;
      case 'act': this._remoteAct(pid, m); this.broadcast(m, pid, { from: pid }); break;
      case 'hurtEnemy': { const e = enemies.list.find((x) => x.id === m.id); if (e) e.applyDamage(m.dmg, { kind: m.kind, by: pid, pos: G.remotes.get(pid)?.pos }); break; }
      case 'hurtAnimal': { const a = animals.byId(m.id); if (a && a.alive) a.applyDamage(m.dmg, {}); break; }
      case 'dig': treasure._hole(m.x, m.z, true); treasure.resolveDig(m.x, m.z, pid); this.broadcast({ t: 'hole', x: m.x, z: m.z }, pid); break;
      case 'chestReq': {
        const ch = treasure.chestById(m.id);
        if (!ch) break;
        if (m.a === 'pick') { if (treasure._grant(ch, pid)) this.toPeer(pid, { t: 'carryOk', id: ch.id }); }
        else if (m.a === 'open') { treasure._openChest(ch, pid); }
        break;
      }
      case 'pickupReq': { const pk = treasure.pickups.find((x) => x.id === m.id); if (pk) treasure._collect(pk, pid); break; }
      case 'chestState': this._applyChestState(m.c); this.broadcast(m, pid); break;
      case 'chestGone': this._chestGone(m.id); this.broadcast(m, pid); break;
      case 'hold': { const s = G.ships.find((x) => x.id === m.ship); if (s) s.hold = m.hold; this.broadcast(m, pid); break; }
      case 'shipFull': this._shipFull(m); this.broadcast(m, pid); break;
      case 'marker': quests.markers.push({ x: m.x, z: m.z, by: m.by, note: m.note || '', color: c.info.color }); this.broadcast(m, pid); G.notify(`${m.by} haritaya işaret koydu.`, 'info', 2000); break;
      case 'shipCmd': this._shipCmd(m, pid); break;
      case 'helm': { const s = G.ships.find((x) => x.id === m.ship); if (s) { s.setRudder(m.rudder); s.sailTarget = m.sail; s.backing = m.back; } break; }
      case 'fire': { const s = G.ships.find((x) => x.id === m.ship); if (s) { s.aimCannon(m.i, m.yaw, m.pitch); combat.fireCannon(s, m.i, pid); } break; }
      case 'boat': this._boatCmd(m, pid); this.broadcast(m, pid); break;
      case 'boatSt': { const b = G.rowboat; if (b && b.driver === pid) { b.x = m.x; b.z = m.z; b.yaw = m.yaw; b.speed = m.sp; b.rowPhase = m.rp; b.state = 'water'; } break; }
      case 'lock': if (m.on) interact.locks.set(m.id, m.who); else interact.locks.delete(m.id); this.broadcast(m, pid); break;
      case 'gold': this.broadcast(m, pid); G.player.inv.gold += m.amount; G.notify(`Tayfa kazancı: +${m.amount} altın`, 'good', 2500); break;
      case 'maps': c.info.maps = m.sites; G.remoteMapSites = [...this.conns.values()].flatMap((x) => x.info.maps || []); break;
      case 'downed': G.notify(`${c.info.name} yaralı düştü! Yanına gidip E ile kaldır.`, 'boss', 5000); break;
      case 'revive': if (m.target === G.myId) { G.player.revive(); G.notify('Bir tayfa arkadaşın seni ayağa kaldırdı!', 'good'); } else this.toPeer(m.target, m); break;
    }
  },

  _dropPeer(pid) {
    const c = this.conns.get(pid);
    if (!c) return;
    this.conns.delete(pid);
    this.roster = this.roster.filter((r) => r.id !== pid);
    const r = G.remotes.get(pid);
    if (r) { r.dispose(this.scene); G.remotes.delete(pid); }
    // taşıdığı sandığı bırak, kilitleri kaldır
    for (const ch of treasure.chests) if (ch.carriers.includes(pid)) { ch.carriers = ch.carriers.filter((x) => x !== pid); if (!ch.carriers.length) ch.state = 'ground'; }
    for (const [k, v] of interact.locks) if (v === pid) interact.locks.delete(k);
    if (G.rowboat?.driver === pid) G.rowboat.driver = null;
    G.notify(`${c.info.name} oyundan ayrıldı.`, 'warn');
    this._broadcastRoster();
  },

  _broadcastRoster() {
    this.broadcast({ t: 'roster', roster: this.roster });
    G.emit('roster', this.roster);
  },

  async join(codeRaw, pw = '') {
    this.leave();
    const code = codeRaw.trim().toUpperCase();
    const target = code.startsWith('PUB') ? `${VER}-pub-${code.slice(3)}` : `${VER}-${code}`;
    const peer = await this._newPeer(null);
    this.peer = peer;
    G.myId = peer.id;
    return new Promise((res, rej) => {
      const conn = peer.connect(target, { reliable: true, serialization: 'json' });
      const to = setTimeout(() => rej(new Error('Oda bulunamadı ya da yanıt vermiyor.')), 12000);
      peer.on('error', (e) => { clearTimeout(to); rej(new Error(e.type === 'peer-unavailable' ? 'Bu kodla açık bir oda yok.' : (e.message || 'Bağlantı hatası'))); });
      conn.on('open', () => {
        conn.send({ t: 'hello', name: G.profile.appearance.name, app: G.profile.appearance, ver: VER, pw });
      });
      conn.on('data', (m) => {
        if (m.t === 'reject') { clearTimeout(to); rej(new Error(m.why)); conn.close(); return; }
        if (m.t === 'welcome') {
          clearTimeout(to);
          this.hostConn = conn;
          G.online = true; G.isHost = false;
          this.room = { ...m.room };
          this.roster = m.roster;
          this.myColor = m.color;
          this._remember(code, m.room.name);
          G.emit('roster', this.roster);
          this._pingLoop();
          res({ room: this.room, started: m.started });
          return;
        }
        this._clientData(m);
      });
      conn.on('close', () => { if (G.online && !G.isHost) { G.emit('hostLeft'); } });
    });
  },

  _pingLoop() {
    clearInterval(this._pingIv);
    this._pingIv = setInterval(() => { if (this.hostConn?.open) this.hostConn.send({ t: 'ping', ts: performance.now() }); }, 2000);
  },

  // Herkese açık odaları tara (sinyal sunucusundaki sabit yuvaları yoklayarak)
  async listPublic(onRoom) {
    let scout;
    try { scout = await this._newPeer(null); } catch (e) { throw new Error('Sinyal sunucusuna bağlanılamadı: ' + (e.message || e.type)); }
    const found = [];
    await Promise.all(Array.from({ length: PUB_SLOTS }, (_, i) => new Promise((res) => {
      const t0 = performance.now();
      const conn = scout.connect(`${VER}-pub-${i}`, { metadata: { type: 'info' }, serialization: 'json' });
      const to = setTimeout(() => { try { conn.close(); } catch (e) { /* */ } res(); }, 6000);
      conn.on('data', (m) => {
        if (m.t === 'info') { const r = { code: 'PUB' + i, ...m, ping: Math.round(performance.now() - t0) }; found.push(r); onRoom && onRoom(r); }
        clearTimeout(to); res();
      });
      conn.on('error', () => { clearTimeout(to); res(); });
    })));
    scout.destroy();
    return found;
  },

  _remember(code, name) {
    const p = G.profile;
    p.recentRooms = [{ code, name, at: Date.now() }, ...(p.recentRooms || []).filter((r) => r.code !== code)].slice(0, 6);
    G.emit('profileChanged');
  },

  leave() {
    clearInterval(this._pingIv);
    if (this.peer) { try { this.peer.destroy(); } catch (e) { /* */ } }
    this.peer = null; this.hostConn = null;
    this.conns.clear();
    for (const [, r] of G.remotes) r.dispose(this.scene);
    G.remotes.clear();
    G.online = false; G.isHost = true; G.myId = 'local';
    this.roster = [];
    G.remoteMapSites = [];
  },

  // ---------------- Gönderim ----------------
  broadcast(m, except = null) { for (const [id, c] of this.conns) if (id !== except && c.conn.open) { try { c.conn.send(m); } catch (e) { /* */ } } },
  toHost(m) { if (this.hostConn?.open) this.hostConn.send(m); },
  toPeer(id, m) {
    if (id === G.myId) { this._clientData(m); return; }
    if (G.isHost) { const c = this.conns.get(id); if (c?.conn.open) c.conn.send(m); }
    else this.toHost({ ...m, t: m.t === 'revive' ? 'revive' : m.t, target: id });
  },
  sendGame(m) { if (G.isHost) this.broadcast(m); else this.toHost(m); },
  setReady(v) { this.toHost({ t: 'ready', v }); },
  sendApp() { this.toHost({ t: 'app', app: G.profile.appearance, name: G.profile.appearance.name }); },
  chat(text) {
    if (!text) return;
    if (G.isHost) { this.broadcast({ t: 'chat', from: G.playerName, text, color: COLORS[0] }); G.emit('chat', { from: G.playerName, text, color: COLORS[0] }); }
    else this.toHost({ t: 'chat', text });
  },
  startGame(startData) { this.broadcast({ t: 'start', difficulty: this.room.difficulty, friendlyFire: this.room.friendlyFire }); void startData; },

  // Oyun başlayınca dünya durumunu gönder
  _sendWorld(conn) {
    const s = G.ship;
    conn.send({
      t: 'world',
      ship: s ? s.serialize() : null,
      chests: treasure.chests.filter((c) => c.state !== 'gone').map((c) => treasure.chestNet(c)),
      pickups: treasure.pickups.map((p) => ({ id: p.id, pos: p.pos.toArray(), items: p.items, from: p.from })),
      quests: { stage: quests.stage, flags: quests.flags, markers: quests.markers },
      time: { hour: sky.hour, weather: sky.weatherKey, wind: sky.windDir },
      rowboat: G.rowboat ? { state: G.rowboat.state, x: G.rowboat.x, z: G.rowboat.z, yaw: G.rowboat.yaw } : null,
    });
  },
  sendWorldAll() { for (const [, c] of this.conns) this._sendWorld(c.conn); },

  // ---------------- İstemci verisi ----------------
  _clientData(m) {
    switch (m.t) {
      case 'pong': G.ping = Math.round(performance.now() - m.ts); break;
      case 'roster': this.roster = m.roster; G.emit('roster', m.roster); break;
      case 'start': G.emit('netStart', m); break;
      case 'world': G.emit('netWorld', m); break;
      case 'snap': this._applySnap(m); break;
      case 'chat': G.emit('chat', m); break;
      case 'act': this._remoteAct(m.from, m); break;
      case 'hurt': G.player.hurt(m.dmg, m.from ? new THREE.Vector3(...m.from) : null, { cause: m.cause }); break;
      case 'give': treasure.giveItems(m.items); break;
      case 'mapUsed': treasure.mapUsed(m.site); G.notify('Tayfa hazineyi buldu! Haritan kullanıldı.', 'good'); break;
      case 'carryOk': { const c = treasure.chestById(m.id); if (c) { c.state = 'carried'; if (!c.carriers.includes(G.myId)) c.carriers.push(G.myId); treasure._applyCarry(G.player, c); } break; }
      case 'chestSpawn': if (!treasure.chestById(m.c.id)) { const c = treasure.spawnChest(m.c.tier, new THREE.Vector3(...m.c.pos), { id: m.c.id, contents: m.c.contents, siteId: m.c.siteId, rising: true }); void c; } break;
      case 'chestState': this._applyChestState(m.c); break;
      case 'chestGone': this._chestGone(m.id); break;
      case 'pickupSpawn': if (!treasure.pickups.some((p) => p.id === m.pk.id)) { const pk = treasure.spawnLootLocal ? null : null; void pk; this._spawnPickup(m.pk); } break;
      case 'pickupGone': { const pk = treasure.pickups.find((p) => p.id === m.id); if (pk) pk.remove = true; break; }
      case 'hole': treasure._hole(m.x, m.z, true); break;
      case 'hold': { const s = G.ships.find((x) => x.id === m.ship); if (s) s.hold = m.hold; break; }
      case 'shipFull': this._shipFull(m); break;
      case 'marker': quests.markers.push({ x: m.x, z: m.z, by: m.by, note: m.note || '', color: '#6ad0f0' }); G.notify(`${m.by} haritaya işaret koydu.`, 'info', 2000); break;
      case 'story': quests.stage = m.stage; Object.assign(quests.flags, m.flags || {}); quests.journalMesh.visible = !quests.flags.gunluk; break;
      case 'gold': G.player.inv.gold += m.amount; G.notify(`Tayfa kazancı: +${m.amount} altın`, 'good', 2500); break;
      case 'weather': sky.setWeather(m.w); break;
      case 'sleep': time.day = m.day; sky.hour = m.hour; time._prevHour = m.hour; G.player.hp = G.player.maxHp; G.emit('sleepFade', m); break;
      case 'lock': if (m.on) interact.locks.set(m.id, m.who); else interact.locks.delete(m.id); break;
      case 'cannon': { const s = G.ships.find((x) => x.id === m.ship); if (s && m.by !== G.myId) { const st = s.cannonState[m.i]; st.reload = 0; const keep = s.cannonballs; s.cannonballs = Math.max(1, s.cannonballs); G.visualOnlyBalls = true; combat.fireCannon(s, m.i, m.by); G.visualOnlyBalls = false; s.cannonballs = keep; } break; }
      case 'boat': this._boatCmd(m, m.from); break;
      case 'shipCmdFx': if (m.cmd === 'anchor') audio.play('impact', { vol: 0.4, rate: 0.5 }); break;
      case 'revive': if (m.target === G.myId || !m.target) { G.player.revive(); G.notify('Bir tayfa arkadaşın seni ayağa kaldırdı!', 'good'); } break;
      case 'kick': G.emit('hostLeft', m.why); break;
    }
  },

  _spawnPickup(pk) {
    const p = treasure.spawnLoot(new THREE.Vector3(...pk.pos), pk.items.map((i) => [i[0], 1, i[1], i[2]]), pk.from, true);
    if (p) p.id = pk.id;
  },

  _applyChestState(c) {
    let ch = treasure.chestById(c.id);
    if (!ch) ch = treasure.spawnChest(c.tier, new THREE.Vector3(...c.pos), { id: c.id, contents: c.contents });
    ch.state = c.state === 'carried' && c.carriers.includes(G.myId) ? 'carried' : c.state;
    ch.carriers = c.carriers;
    ch.pos.set(...c.pos);
    if (c.state === 'boat' && G.rowboat && !G.rowboat.cargo.includes(c.id)) G.rowboat.cargo.push(c.id);
    if (G.player.carrying?.id === c.id && !c.carriers.includes(G.myId)) G.player.carrying = null;
  },
  _chestGone(id) {
    const ch = treasure.chestById(id);
    if (!ch) return;
    ch.state = 'gone';
    treasure.scene.remove(ch.mesh);
    treasure.chests = treasure.chests.filter((x) => x !== ch);
    if (G.player.carrying?.id === id) G.player.carrying = null;
  },
  _shipFull(m) {
    const d = m.ship;
    const s = G.ships.find((x) => x.id === d.id) || G.ship;
    if (!s) return;
    if (m.replace || s.typeId !== d.typeId) { G.emit('netReplaceShip', d); return; }
    s.name = d.name; s.upg = d.upg; s.hp = d.hp; s.holes = d.holes; s.water = d.water; s.hold = d.hold; s.cannonballs = d.cannonballs; s.planks = d.planks;
    s.maxHp = s.T.hp * (1 + (s.upg.hull || 0) * 0.25);
    if (JSON.stringify(s.look) !== JSON.stringify(d.look)) s.rebuild(d.look);
    s._syncHoles();
  },
  _shipCmd(m, pid) {
    const s = G.ships.find((x) => x.id === m.ship);
    if (!s) return;
    if (m.cmd === 'anchor') s.toggleAnchor();
    else if (m.cmd === 'sails') s.sailTarget = m.v;
    else if (m.cmd === 'bail') s.water = Math.max(0, s.water - 12);
    else if (m.cmd === 'repair') s.repairHole(m.hole);
    this.broadcast({ t: 'shipCmdFx', ...m }, pid);
  },
  _boatCmd(m, pid) {
    const b = G.rowboat;
    if (!b) return;
    if (m.cmd === 'launch' && b.state === 'docked') b.launch();
    if (m.cmd === 'dock') b.dock();
    if (m.cmd === 'driver') b.driver = m.who;
    void pid;
  },

  _remoteState(pid, info, s) {
    let r = G.remotes.get(pid);
    if (!r) { r = new RemotePlayer(this.scene, { id: pid, name: info.name, app: info.app, color: info.color }); G.remotes.set(pid, r); }
    r.apply(s);
  },
  _remoteAct(pid, m) {
    const r = G.remotes.get(pid);
    if (!r) return;
    if (m.a === 'shoot') { const p = r.pos.clone().add(new THREE.Vector3(Math.sin(r.yaw) * 0.6, 1.45, Math.cos(r.yaw) * 0.6)); effects.flash(p.x, p.y, p.z, new THREE.Vector3(...(m.dir || [0, 0, 1]))); audio.play('shoot', { pos: r.pos, vol: 0.7 }); }
    if (m.a === 'slash') audio.tone(320, 0.12, 'sawtooth', 0.03, null, 0.4);
  },

  _applySnap(m) {
    for (const id in m.players) {
      if (id === G.myId) continue;
      const info = this.roster.find((r) => r.id === id) || { id, name: 'Korsan', app: null, color: '#fff' };
      if (!info.app) continue;
      this._remoteState(id, info, m.players[id]);
    }
    for (const [id, r] of G.remotes) if (!m.players[id]) { r.dispose(this.scene); G.remotes.delete(id); }
    const ids = new Set();
    for (const sd of m.ships || []) {
      ids.add(sd.id);
      let s = G.ships.find((x) => x.id === sd.id);
      if (!s) { G.emit('netNeedShip', sd); continue; }
      s.applyNet(sd.st);
    }
    for (const s of [...G.ships]) if (s !== G.ship && !s.kinematic && !ids.has(s.id)) { s.dispose(); G.ships = G.ships.filter((x) => x !== s); }
    if (m.rb && G.rowboat && G.rowboat.driver !== G.myId) { const b = G.rowboat; b.state = m.rb[0]; b.x = m.rb[1]; b.z = m.rb[2]; b.yaw = m.rb[3]; b.rowPhase = m.rb[4]; b.cargo = m.rb[5] || []; b.driver = m.rb[6]; }
    if (m.en) enemies.applySnapshot(m.en);
    if (m.an) animals.applySnapshot(m.an);
    if (m.time) {
      const t = m.time;
      if (t[3] && t[3] !== time.day) { time.day = t[3]; time._prevHour = t[0]; }
      sky.hour = t[0];
      if (sky.weatherKey !== t[1]) sky.setWeather(t[1], false, true);
      sky.windTarget = t[2];
      if (t[4]) sky.forecast = t[4].map(([key, at]) => ({ key, at }));
      if (t[5] !== undefined) sky.wetness = t[5];
    }
    if (m.wfx) weatherfx.applyNet(m.wfx);
    for (const c of m.ch || []) {
      const ch = treasure.chestById(c[0]);
      if (ch && ch.state !== 'carried') { ch.pos.set(c[1], c[2], c[3]); ch.state = c[4]; }
    }
  },

  // ---------------- Döngü ----------------
  update(dt) {
    if (!G.online || G.state !== 'playing') return;
    for (const [, r] of G.remotes) r.update(dt);
    const p = G.player;
    if (!p) return;
    this.sendT -= dt;
    if (this.sendT <= 0) {
      this.sendT = 1 / 15;
      const st = p.netState();
      if (G.isHost) this._hostSnapshot(st);
      else {
        this.toHost({ t: 'st', s: st });
        if (p.mode === 'helm' && p.ship) this.toHost({ t: 'helm', ship: p.ship.id, rudder: p.ship.rudderInput, sail: p.ship.sailTarget, back: !!p.ship.backing });
        if (p.mode === 'boat' && G.rowboat) { const b = G.rowboat; this.toHost({ t: 'boatSt', x: b.x, z: b.z, yaw: b.yaw, sp: b.speed, rp: b.rowPhase }); }
      }
    }
    // düşmüş arkadaşı kaldırma
    for (const [id, r] of G.remotes) {
      if (r.downed && r.pos.distanceTo(p.pos) < 2.5 && p.mode === 'ground') {
        if (!this._reviveProv) this._reviveProv = interact.addProvider((ctx, out) => {
          for (const [rid, rr] of G.remotes) if (rr.downed && rr.pos.distanceTo(ctx.pos) < 2.5) out.push({ id: 'rev' + rid, pos: rr.pos, radius: 2.5, priority: 4, hold: 2.5, label: `${rr.name} adlı tayfayı ayağa kaldır`, action: () => { this.toPeer(rid, { t: 'revive', target: rid }); G.notify(`${rr.name} ayağa kalktı!`, 'good'); } });
        });
        void id;
      }
    }
  },

  _hostSnapshot(myState) {
    this.snapT = (this.snapT || 0) + 1;
    const players = { [G.myId]: myState };
    for (const [id, r] of G.remotes) if (r.target) players[id] = r.target;
    const m = { t: 'snap', players, ships: G.ships.filter((s) => !s.kinematic).map((s) => ({ id: s.id, typeId: s.typeId, look: s.look, name: s.name, st: s.netState() })) };
    const b = G.rowboat;
    if (b) m.rb = [b.state, +b.x.toFixed(2), +b.z.toFixed(2), +b.yaw.toFixed(3), +b.rowPhase.toFixed(2), b.cargo, b.driver];
    if (this.snapT % 2 === 0) { m.en = enemies.netSnapshot(); m.an = animals.netSnapshot(); m.time = [sky.hour, sky.weatherKey, sky.windDir, time.day, sky.forecast.map((f) => [f.key, +f.at.toFixed(2)]), +sky.wetness.toFixed(2)]; m.wfx = weatherfx.netState(); m.ch = treasure.chests.filter((c) => c.state === 'water' || c.state === 'ground').map((c) => [c.id, +c.pos.x.toFixed(2), +c.pos.y.toFixed(2), +c.pos.z.toFixed(2), c.state]); }
    this.broadcast(m);
  },
};
