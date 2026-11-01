import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { Character } from '../player/character.js';
import { enemies } from '../game/enemies.js';
import { bosses } from '../game/bosses.js';
import { isOnce } from '../core/kk.js';
import { physics } from '../world/physics.js';
import { terrain } from '../world/terrain.js';
import { animals } from '../wildlife/animals.js';
import { megafauna } from '../wildlife/megafauna.js';
import { hazards } from '../world/hazards.js';
import { worldEvents } from '../game/worldEvents.js';
import { progress } from '../game/progress.js';
import { treasure } from '../treasure/treasure.js';
import { combat } from '../game/combat.js';
import { effects } from '../game/effects.js';
import { interact } from '../game/interact.js';
import { quests } from '../game/quests.js';
import { sky } from '../world/sky.js';
import { time } from '../world/time.js';
import { weatherfx } from '../world/weatherfx.js';
import { events } from '../game/events.js';
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
// ---- Konuk mesajı doğrulama (ev sahibi otoritesi) ----
// Her mesaj türü için izin verilen alanlar/aralıklar; dışındakiler kırpılır ya da yok sayılır. Oyuncu adları HTML'den arındırılır.
const num = (v, lo, hi, def = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
const str = (v, max = 64) => (typeof v === 'string' ? v.slice(0, max) : '');
export const cleanName = (v) => (typeof v === 'string' ? v.replace(/<[^>]*>?/g, '').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '') || 'Korsan';
const MAX_MSG_BYTES = 64 * 1024;      // tek mesaj (JSON) üst sınırı
const RATE_PER_SEC = 120;             // konuk başına saniyede mesaj (durum mesajları hariç)
const GOLD_PER_MIN = 20000;           // konuk başına dakikada paylaşılabilecek altın (abartılı 'gold' iletileri düşürülür)
const DMG_MAX = { hurtEnemy: 160, hurtBoss: 220, hurtAnimal: 160, hurtMarine: 160 }; // en güçlü silah × ağır vuruş çarpanı üstü
const KNOWN = new Set(['hello', 'ping', 'ready', 'app', 'chat', 'st', 'act', 'hurtEnemy', 'hurtBoss', 'stunEnemy', 'hurtAnimal', 'hurtMarine', 'dig', 'chestReq', 'pickupReq', 'chestState', 'chestGone', 'hold', 'shipFull', 'marker', 'hazard', 'shipCmd', 'helm', 'fire', 'boat', 'boatSt', 'lock', 'gold', 'maps', 'downed', 'revive', 'floatReq', 'inter', 'prog', 'lootReq', 'holdTake', 'noise', 'story']);
function approxBytes(m) { try { return JSON.stringify(m).length; } catch (e) { return Infinity; } }

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
    this.onGround = !t.air;
    this.ship = t.ship && (t.mode === 'deck' || t.mode === 'helm' || t.mode === 'cannon') ? (G.ships.find((x) => x.id === t.ship) || null) : null;
    const c = this.char;
    c.root.position.copy(this.pos);
    c.root.rotation.y = this.yaw;
    if (t.anim === 'Ragdoll') { if (!c.ragdoll) c.startRagdoll({ ground: (x, z, y) => physics.groundAt(x, z, y + 0.6) }); }
    else {
      if (c.ragdoll) c.stopRagdoll();
      if (t.anim && c.currentName !== t.anim) c.play(t.anim, 0.15, { once: t.loop === 0 ? true : t.loop === 1 ? false : isOnce(t.anim) });
      if ((t.up || null) !== (c.upperName || null)) { if (t.up) c.playUpper(t.up, 0.1, { once: isOnce(t.up) }); else c.stopUpper(0.15); }
    }
    if (c.heldType !== (t.eq === 'none' || t.eq === 'map' ? null : t.eq)) c.hold(t.eq === 'none' || t.eq === 'map' ? null : t.eq);
    c.overlay.carry = !!t.carry;
    c.overlay.swim = t.mode === 'swim';
    c.overlay.helm = t.mode === 'helm';
    c.overlay.row = t.mode === 'boat';
    c.overlay.swimPhase = (c.overlay.swimPhase || 0) + dt * 4;
    c.model.rotation.x = t.mode === 'swim' ? damp(c.model.rotation.x, t.swimP || 0, 6, dt) : 0;
    c.overlay.lift = t.mode === 'swim' ? damp(c.overlay.lift || 0, (t.swimP || 0) > 0.6 ? 1.0 : 0, 6, dt) : 0;
    c.update(dt);
  }
  dispose(scene) { scene.remove(this.char.root); }
}

export const net = {
  peer: null,
  conns: new Map(), // host: peerId -> {conn, info}
  _rate: new Map(), // host: peerId -> { t, n } (oran sınırı)
  _gold: new Map(), // host: peerId -> { t, sum } (altın paylaşım bütçesi)
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
    relay('netAction', (e) => this.sendGame({ t: 'act', from: G.myId, ...e })); // ev sahibinin eylemleri de konuklarda gösterilir
    relay('netHurtEnemy', (e) => this.toHost({ t: 'hurtEnemy', ...e }));
    relay('netHurtAnimal', (e) => this.toHost({ t: 'hurtAnimal', ...e }));
    relay('netHurtMarine', (e) => this.toHost({ t: 'hurtMarine', ...e }));
    relay('netHazard', (e) => this.sendGame({ t: 'hazard', ...e }));
    relay('netXp', (e) => { if (G.isHost) this.toPeer(e.id, { t: 'xp', xp: e.xp, r: e.reason }); });
    relay('netHurtPlayer', (e) => this.toPeer(e.id, { t: 'hurt', dmg: e.dmg, from: e.from, cause: e.cause, melee: e.melee ? 1 : 0, ub: e.unblockable ? 1 : 0, aid: e.attackerId || null, bullet: e.bullet ? 1 : 0, kb: e.kb || 0 }));
    relay('netStunEnemy', (e) => this.toHost({ t: 'stunEnemy', id: e.id, dur: e.dur }));
    relay('netHurtBoss', (e) => this.toHost({ t: 'hurtBoss', ...e }));
    relay('netDig', (e) => this.toHost({ t: 'dig', ...e }));
    relay('netChestReq', (e) => this.toHost({ t: 'chestReq', ...e }));
    relay('netPickupReq', (e) => this.toHost({ t: 'pickupReq', ...e }));
    relay('netLootReq', (e) => this.toHost({ t: 'lootReq', ...e }));
    relay('netHoldTake', (e) => this.toHost({ t: 'holdTake', ...e }));
    relay('netFloatReq', (e) => this.toHost({ t: 'floatReq', ...e }));
    relay('netFloatSpawn', (e) => { if (G.isHost) this.broadcast({ t: 'floatSpawn', ...e }); });
    relay('netFloatGone', (e) => { if (G.isHost) this.broadcast({ t: 'floatGone', id: e.id }); });
    relay('netGive', (e) => { if (G.isHost) this.toPeer(e.who, { t: 'give', items: e.items }); });
    relay('netGold', (e) => { if (G.isHost) this.toPeer(e.who, { t: 'gold', amount: e.amount }); });
    relay('netCarryOk', (e) => { if (G.isHost) this.toPeer(e.who, { t: 'carryOk', id: e.id }); });
    relay('netNoise', (e) => { if (!G.isHost) this.toHost({ t: 'noise', radius: e.radius, kind: e.kind }); });
    relay('netChestSpawn', (e) => { if (G.isHost) this.broadcast({ t: 'chestSpawn', c: e.chest }); });
    relay('netChestState', (e) => this.sendGame({ t: 'chestState', c: e.chest }));
    relay('netChestGone', (e) => this.sendGame({ t: 'chestGone', id: e.id }));
    relay('netPickupSpawn', (e) => { if (G.isHost) this.broadcast({ t: 'pickupSpawn', pk: e.pk }); });
    relay('netPickupGone', (e) => { if (G.isHost) { this.broadcast({ t: 'pickupGone', id: e.id }); if (e.who !== G.myId) this.toPeer(e.who, { t: 'give', items: e.items }); } });
    relay('netHold', (e) => this.sendGame({ t: 'hold', ship: e.ship, hold: e.hold, gone: e.gone || null })); // ambara konan sandığın kimliği de gider (hayalet sandık yok)
    relay('netShipFull', (e) => this.sendGame({ t: 'shipFull', ship: e.ship, replace: e.replace }));
    relay('netMarker', (e) => this.sendGame({ t: 'marker', ...e }));
    relay('netStory', (e) => { if (G.isHost) this.broadcast({ t: 'story', ...e }); else this.toHost({ t: 'story', stage: e.stage, flags: e.flags }); });
    relay('netShareGold', (e) => this.sendGame({ t: 'gold', amount: e.amount }));
    relay('netWeather', (e) => this.broadcast({ t: 'weather', w: e.w }));
    relay('shipCmd', (e) => { if (!G.isHost) this.toHost({ t: 'shipCmd', ...e }); else this.broadcast({ t: 'shipCmdFx', ...e }); });
    relay('boatCmd', (e) => this.sendGame({ t: 'boat', ...e }));
    relay('lock', (e) => this.sendGame({ t: 'lock', ...e, who: G.myId }));
    relay('cannonFired', (e) => { if (G.isHost) { const sh = G.ships.find((x) => x.id === e.ship); const pv = sh?.model?.cannons?.[e.index]?.mesh?.userData?.pivot; this.broadcast({ t: 'cannon', ship: e.ship, i: e.index, by: e.by, yaw: pv ? +pv.rotation.y.toFixed(3) : 0, pitch: pv ? +(-pv.rotation.x).toFixed(3) : 0 }); } });
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
    if (!m || typeof m !== 'object' || typeof m.t !== 'string' || !KNOWN.has(m.t)) return;
    const pid = conn.peer;
    { const cc = this.conns.get(pid); if (cc) { cc.lastSeen = performance.now(); if (m.t === 'st') cc.inGame = true; } } // kalp atışı: her geçerli ileti; ilk 'st' = konuk dünyayı yükledi
    // oran ve boyut sınırı: durum ('st') ve ping dışındaki mesajlar saniyede RATE_PER_SEC ile sınırlı; aşırı büyük mesaj düşürülür
    if (m.t !== 'st' && m.t !== 'ping') {
      const now = performance.now();
      const r = this._rate.get(pid) || { t: now, n: 0 };
      if (now - r.t > 1000) { r.t = now; r.n = 0; }
      r.n++;
      this._rate.set(pid, r);
      if (r.n > RATE_PER_SEC) { if (r.n === RATE_PER_SEC + 1) console.warn('Ağ: oran sınırı aşıldı', pid, m.t); return; }
      if (approxBytes(m) > MAX_MSG_BYTES) { console.warn('Ağ: aşırı büyük mesaj düşürüldü', pid, m.t); return; }
    }
    if (m.t === 'hello') {
      if (m.ver !== VER) { conn.send({ t: 'reject', why: 'Oyun sürümü farklı.' }); return; }
      if (this.room.pw && m.pw !== this.room.pw) { conn.send({ t: 'reject', why: 'Oda şifresi yanlış.' }); return; }
      m.name = cleanName(m.name);
      // yeniden katılım eşleşmesi: yalnız bağlantısı kopmuş konuklar; ev sahibinin kendi kaydı asla düşürülmez
      const existing = this.roster.find((r) => r.name === m.name && r.id !== G.myId && !this.conns.has(r.id));
      if (this.roster.length >= this.room.max && !existing) { conn.send({ t: 'reject', why: 'Oda dolu.' }); return; }
      const color = COLORS[this.roster.length % COLORS.length];
      if (existing) this.roster = this.roster.filter((r) => r !== existing);
      const info = { id: pid, name: m.name, app: m.app, color, ready: false };
      this.roster.push(info);
      this.conns.set(pid, { conn, info, lastSeen: performance.now() });
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
      case 'chat': { const text = str(m.text, 240); if (!text.trim()) break; this.broadcast({ t: 'chat', from: c.info.name, text, color: c.info.color }); G.emit('chat', { from: c.info.name, text, color: c.info.color }); break; }
      case 'st': this._remoteState(pid, c.info, m.s); break;
      case 'act': this._remoteAct(pid, m); this.broadcast(m, pid, { from: pid }); break;
      case 'hurtEnemy': {
        const e = enemies.list.find((x) => x.id === m.id);
        const r = G.remotes.get(pid);
        // ev sahibi otoritesi: hasar silah üst sınırına kırpılır; konuk hedefe makul uzaklıkta olmalı (yakın 6 m, mermi 80 m)
        if (!e || !r) break;
        const d = Math.hypot(e.pos.x - r.pos.x, e.pos.z - r.pos.z);
        if (d > (m.kind === 'bullet' ? 80 : 6)) break;
        e.applyDamage(num(m.dmg, 0, DMG_MAX.hurtEnemy), { kind: str(m.kind, 16), by: pid, pos: r.pos, heavy: !!m.heavy, finisher: !!m.fin, counter: !!m.ctr, guardBreak: !!m.gb, kb: num(m.kb, 0, 12), yaw: num(m.yaw, -7, 7) });
        break;
      }
      case 'hurtBoss': G.emit('netHurtBossApply', { ...m, dmg: num(m.dmg, 0, DMG_MAX.hurtBoss), by: pid }); break;
      case 'stunEnemy': { const e = enemies.list.find((x) => x.id === m.id); const r = G.remotes.get(pid); if (e && e.alive && r && e.pos.distanceTo(r.pos) < 8) e.stun(num(m.dur, 0.2, 3, 1.5), 'parry'); break; }
      case 'hurtAnimal': { const a = animals.byId(m.id); const r = G.remotes.get(pid); if (a && a.alive && r && a.pos.distanceTo(r.pos) < 80) a.applyDamage(num(m.dmg, 0, DMG_MAX.hurtAnimal), { pos: r.pos }); break; }
      case 'hurtMarine': { const e = megafauna.byId(m.id); const r = G.remotes.get(pid); if (e && e.alive && r && e.pos.distanceTo(r.pos) < 120) megafauna.applyDamage(e, num(m.dmg, 0, DMG_MAX.hurtMarine), { by: pid, attacker: r }); break; }
      case 'dig': treasure._hole(m.x, m.z, true); treasure.resolveDig(m.x, m.z, pid); this.broadcast({ t: 'hole', x: m.x, z: m.z }, pid); break;
      case 'chestReq': {
        const ch = treasure.chestById(m.id);
        if (!ch) break;
        if (m.a === 'pick') { if (treasure._grant(ch, pid)) this.toPeer(pid, { t: 'carryOk', id: ch.id }); }
        else if (m.a === 'open') { treasure._openChest(ch, pid); }
        break;
      }
      case 'pickupReq': { const pk = treasure.pickups.find((x) => x.id === m.id); if (pk) treasure._collect(pk, pid); break; }
      case 'lootReq': {
        // konuk ganimeti (kırık sandık, ada sandığı, envanter taşması): ev sahibi doğrular ve kendi dünyasında doğurur
        const r = G.remotes.get(pid); if (!r || !Array.isArray(m.table) || !Array.isArray(m.pos)) break;
        const pos = new THREE.Vector3(num(m.pos[0], -10000, 10000), num(m.pos[1], -100, 400), num(m.pos[2], -10000, 10000));
        if (pos.distanceTo(r.pos) > 30) break;
        const table = m.table.slice(0, 10).map((row) => (Array.isArray(row) ? [str(row[0], 40), num(row[1], 0, 999), row[2] === undefined ? undefined : num(row[2], 0, 999), row[3] && typeof row[3] === 'object' ? row[3] : undefined] : null)).filter((row) => row && row[0]);
        if (table.length) treasure.spawnLoot(pos, table, str(m.from, 40), !!m.exact);
        break;
      }
      case 'holdTake': {
        const s = G.ships.find((x) => x.id === m.ship); const r = G.remotes.get(pid);
        if (!s || !r) break;
        const onShip = r.target && r.target.ship === s.id;
        if (!onShip && Math.hypot(s.x - r.pos.x, s.z - r.pos.z) > 12) break;
        const c = treasure.takeFromHoldFor(s, Math.round(num(m.idx, 0, 39)), pid, r.pos.clone());
        if (c) this.toPeer(pid, { t: 'carryOk', id: c.id });
        break;
      }
      case 'floatReq': { const r = G.remotes.get(pid); if (r) events.collectFloatingById(str(m.id, 40), pid, r.pos); break; }
      case 'noise': { const r = G.remotes.get(pid); if (r) combat.noise(r.pos, num(m.radius, 0, 80), str(m.kind, 16)); break; }
      case 'story': {
        // konuk hikâyeyi ilerletti: en fazla bir aşama ileri; bayraklar yalnız true olarak birleşir (geri alma yok)
        const to = Math.round(num(m.stage, 0, 99));
        if (m.flags && typeof m.flags === 'object') for (const k in m.flags) if (m.flags[k] === true && typeof k === 'string' && k.length < 40) quests.flags[k] = true;
        if (to === quests.stage + 1) quests.advance(to); // advance → netStory → yayın + kayıt
        else this.broadcast({ t: 'story', stage: quests.stage, flags: quests.flags });
        break;
      }
      case 'chestState': {
        // yalnız sandığı taşıyan ya da 8 m içindeki konuk durum bildirebilir
        const ch = m.c && treasure.chestById(m.c.id); const r = G.remotes.get(pid);
        if (!ch || !r || !(ch.carriers.includes(pid) || ch.pos.distanceTo(r.pos) < 8)) break;
        this._applyChestState(m.c); this.broadcast(m, pid); break;
      }
      case 'chestGone': {
        const ch = treasure.chestById(m.id); const r = G.remotes.get(pid);
        if (!ch || !r || !(ch.carriers.includes(pid) || ch.pos.distanceTo(r.pos) < 8)) break;
        this._chestGone(m.id); this.broadcast(m, pid); break;
      }
      case 'hold': {
        const s = G.ships.find((x) => x.id === m.ship); const r = G.remotes.get(pid);
        if (!s || !r || !m.hold || typeof m.hold !== 'object') break;
        // konuk gemide (güverte/dümen) ya da 12 m içinde olmalı; eşya sayıları ve sandık listesi sınırlı
        const onShip = r.target && r.target.ship === s.id;
        if (!onShip && Math.hypot(s.x - r.pos.x, s.z - r.pos.z) > 12) break;
        const items = {}; for (const k in (m.hold.items || {})) if (typeof k === 'string' && k.length < 40) items[k] = Math.round(num(m.hold.items[k], 0, 999));
        s.hold = { items, chests: Array.isArray(m.hold.chests) ? m.hold.chests.slice(0, 40) : [] };
        // ambara konan sandık: ev sahibindeki (ve diğer konuklardaki) dünya kopyası kaldırılır (hayalet sandık yok)
        const gone = m.gone ? str(m.gone, 40) : null;
        if (gone) { const ch = treasure.chestById(gone); if (ch && (ch.carriers.includes(pid) || ch.pos.distanceTo(r.pos) < 8)) this._chestGone(gone); }
        this.broadcast({ t: 'hold', ship: s.id, hold: s.hold, gone }, pid); break;
      }
      case 'shipFull': this._shipFull(m); this.broadcast(m, pid); break;
      case 'marker': { if (quests.markers.length > 60) quests.markers.shift(); const mk = { t: 'marker', x: num(m.x, -10000, 10000), z: num(m.z, -10000, 10000), by: c.info.name, note: str(m.note, 80) }; quests.markers.push({ x: mk.x, z: mk.z, by: mk.by, note: mk.note, color: c.info.color }); this.broadcast(mk, pid); G.notify(`${c.info.name} haritaya işaret koydu.`, 'info', 2000); break; }
      case 'hazard': hazards.netApply(m); this.broadcast(m, pid); break;
      case 'shipCmd': this._shipCmd(m, pid); break;
      case 'helm': { const s = G.ships.find((x) => x.id === m.ship); if (s && interact.locks.get(s.id + ':helm') === pid) { s.setRudder(num(m.rudder, -1, 1)); s.sailTarget = num(m.sail, 0, 1); s.backing = !!m.back; } break; }
      case 'fire': { const s = G.ships.find((x) => x.id === m.ship); const i = Math.round(num(m.i, 0, 15)); if (s && s.cannonState[i] && interact.locks.get(s.id + ':cannon' + i) === pid) { s.aimCannon(i, num(m.yaw, -7, 7), num(m.pitch, -1, 1)); combat.fireCannon(s, i, pid); } break; }
      case 'boat': this._boatCmd(m, pid); this.broadcast(m, pid); break;
      case 'boatSt': { const b = G.rowboat; if (b && b.driver === pid) { b.x = m.x; b.z = m.z; b.yaw = m.yaw; b.speed = m.sp; b.rowPhase = m.rp; b.state = 'water'; } break; }
      case 'lock': {
        // kilit yalnız gönderen adına açılır/kapanır; başkasının kilidi kaldırılamaz
        const id = str(m.id, 64); if (!id) break;
        if (m.on) { if (!interact.locks.has(id)) interact.locks.set(id, pid); }
        else if (interact.locks.get(id) === pid) interact.locks.delete(id);
        this.broadcast({ t: 'lock', id, on: !!m.on, who: pid }, pid); break;
      }
      case 'gold': {
        // tayfa payı: pozitif, tek seferde ≤5000 ve dakikada ≤GOLD_PER_MIN (abartılı iletiler düşürülür)
        const amount = Math.round(num(m.amount, 0, 5000));
        if (amount <= 0) break;
        const now = performance.now();
        const g = this._gold.get(pid) || { t: now, sum: 0 };
        if (now - g.t > 60000) { g.t = now; g.sum = 0; }
        if (g.sum + amount > GOLD_PER_MIN) { this._gold.set(pid, g); break; }
        g.sum += amount; this._gold.set(pid, g);
        this.broadcast({ t: 'gold', amount }, pid); G.player.inv.gold += amount; G.notify(`Tayfa kazancı: +${amount} altın`, 'good', 2500); break;
      }
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
    // taşıdığı sandığı bırak, kilitleri kaldır — ve bunları diğer konuklara da bildir (dümen/top 'kullanımda' kalmasın)
    for (const ch of treasure.chests) if (ch.carriers.includes(pid)) { ch.carriers = ch.carriers.filter((x) => x !== pid); if (!ch.carriers.length) ch.state = 'ground'; this.broadcast({ t: 'chestState', c: treasure.chestNet(ch) }); }
    for (const [k, v] of interact.locks) if (v === pid) { interact.locks.delete(k); this.broadcast({ t: 'lock', id: k, on: false, who: pid }); }
    if (G.rowboat?.driver === pid) { G.rowboat.driver = null; this.broadcast({ t: 'boat', cmd: 'driver', who: null, from: pid }); }
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
    this._snapSeen = false; this._lastHostMsg = 0;
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
  startGame(startData) {
    for (const [, c] of this.conns) c.inGame = false; // konuklar dünyayı yüklerken sessiz kalır; zaman aşımı ilk 'st' ile başlar
    this.broadcast({ t: 'start', difficulty: this.room.difficulty, friendlyFire: this.room.friendlyFire }); void startData;
  },

  // Oyun başlayınca dünya durumunu gönder
  _sendWorld(conn) {
    { const cc = this.conns.get(conn.peer); if (cc) cc.inGame = false; } // yükleme süresince kalp atışı sayılmaz
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
    this._lastHostMsg = performance.now(); this._weakWarned = false; // ev sahibi kalp atışı
    switch (m.t) {
      case 'pong': G.ping = Math.round(performance.now() - m.ts); break;
      case 'roster': this.roster = (Array.isArray(m.roster) ? m.roster : []).map((r) => ({ ...r, name: cleanName(r.name) })); G.emit('roster', this.roster); break;
      case 'start': this._snapSeen = false; G.emit('netStart', m); break;
      case 'world': this._snapSeen = false; G.emit('netWorld', m); break;
      case 'snap': if (G.state === 'playing' && G.player) { this._snapSeen = true; this._applySnap(m); } break; // menü/lobide uzak nesneler sahneye eklenmez
      case 'chat': G.emit('chat', m); break;
      case 'act': this._remoteAct(m.from, m); break;
      case 'hurt': {
        G.player.hurt(m.dmg, m.from ? new THREE.Vector3(...m.from) : null, { cause: m.cause, melee: !!m.melee, unblockable: !!m.ub, attackerId: m.aid, bullet: !!m.bullet });
        if (m.kb && m.from) { const p = G.player; const dx = p.pos.x - m.from[0], dz = p.pos.z - m.from[2], d = Math.hypot(dx, dz) || 1; p.knock = { x: dx / d * m.kb, z: dz / d * m.kb }; } // boss süpürmesi geri tepmesi
        break;
      }
      case 'floatSpawn': if (!events.floating.some((f) => f.id === m.id)) events.spawnFloating(m.kind, new THREE.Vector3(m.x, 0, m.z), { id: m.id, net: true }); break;
      case 'floatGone': events.removeFloating(m.id); break;
      case 'give': treasure.giveItems(m.items); break;
      case 'teleport': {
        // oda sahibi hızlı yolculuk yaptı: tayfa da varış limanına taşınır
        const p = G.player;
        terrain.prepare(m.x, m.z, { radius: 400 }).then(() => {
          p.leaveShipToWorld(new THREE.Vector3(m.x + (Math.random() - 0.5) * 2, m.y, m.z + (Math.random() - 0.5) * 2));
          p.vel.set(0, 0, 0);
          G.notify('Kaptan rotayı kırdı: yeni limana vardınız!', 'good', 3500);
        });
        break;
      }
      case 'mapUsed': treasure.mapUsed(m.site); G.notify('Tayfa hazineyi buldu! Haritan kullanıldı.', 'good'); break;
      case 'carryOk': { const c = treasure.chestById(m.id); if (c) { c.state = 'carried'; if (!c.carriers.includes(G.myId)) c.carriers.push(G.myId); treasure._applyCarry(G.player, c); } break; }
      case 'chestSpawn': if (!treasure.chestById(m.c.id)) { const c = treasure.spawnChest(m.c.tier, new THREE.Vector3(...m.c.pos), { id: m.c.id, contents: m.c.contents, siteId: m.c.siteId, rising: true }); void c; } break;
      case 'chestState': this._applyChestState(m.c); break;
      case 'chestGone': this._chestGone(m.id); break;
      case 'pickupSpawn': if (!treasure.pickups.some((p) => p.id === m.pk.id)) { const pk = treasure.spawnLootLocal ? null : null; void pk; this._spawnPickup(m.pk); } break;
      case 'pickupGone': { const pk = treasure.pickups.find((p) => p.id === m.id); if (pk) pk.remove = true; break; }
      case 'hole': treasure._hole(m.x, m.z, true); break;
      case 'hold': { const s = G.ships.find((x) => x.id === m.ship); if (s) s.hold = m.hold; if (m.gone) this._chestGone(m.gone); break; }
      case 'shipFull': this._shipFull(m); break;
      case 'marker': quests.markers.push({ x: m.x, z: m.z, by: m.by, note: m.note || '', color: '#6ad0f0' }); G.notify(`${m.by} haritaya işaret koydu.`, 'info', 2000); break;
      case 'hazard': hazards.netApply(m); break;
      case 'xp': progress.gain(m.xp, m.r); break;
      case 'story': quests.stage = m.stage; Object.assign(quests.flags, m.flags || {}); quests.journalMesh.visible = !quests.flags.gunluk; break;
      case 'gold': G.player.inv.gold += m.amount; G.notify(`Tayfa kazancı: +${m.amount} altın`, 'good', 2500); break;
      case 'weather': sky.setWeather(m.w); break;
      case 'sleep': time.day = m.day; sky.hour = m.hour; time._prevHour = m.hour; G.player.hp = G.player.maxHp; G.emit('sleepFade', m); break;
      case 'lock': if (m.on) interact.locks.set(m.id, m.who); else interact.locks.delete(m.id); break;
      case 'cannon': { const s = G.ships.find((x) => x.id === m.ship); if (s && m.by !== G.myId) { if (m.yaw !== undefined) s.aimCannon(m.i, m.yaw, m.pitch); const st = s.cannonState[m.i]; st.reload = 0; const keep = s.cannonballs; s.cannonballs = Math.max(1, s.cannonballs); G.visualOnlyBalls = true; combat.fireCannon(s, m.i, m.by); G.visualOnlyBalls = false; s.cannonballs = keep; } break; }
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
    else if (m.cmd === 'repair') { s.repairHole(m.hole); if (s.planks > 0) s.planks--; }
    else if (m.cmd === 'addBalls') s.cannonballs = Math.min(999, (s.cannonballs || 0) + Math.round(num(m.n, 0, 200)));
    else if (m.cmd === 'addPlanks') s.planks = Math.min(999, (s.planks || 0) + Math.round(num(m.n, 0, 200)));
    else if (m.cmd === 'extinguish') s.extinguish(m.id);
    else if (m.cmd === 'cannonFix') s.cannonHp[m.i] = 70;
    else if (m.cmd === 'mastFix') { s.mastHp[m.i] = 35; s.rebuild({}); }
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
    if (m.floats) events.applyFloats(m.floats);
    if (m.shots) enemies.applyShots(m.shots);
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
    if ('bo' in m) bosses.applySnapshot(m.bo);
    if (m.an) animals.applySnapshot(m.an);
    if (m.mf) megafauna.applySnapshot(m.mf);
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
    if (m.we) worldEvents.applyNet(m.we);
    for (const c of m.ch || []) {
      const ch = treasure.chestById(c[0]);
      if (ch && ch.state !== 'carried') { ch.pos.set(c[1], c[2], c[3]); ch.state = c[4]; }
    }
  },

  // ---------------- Döngü ----------------
  update(dt) {
    if (!G.online || G.state !== 'playing') return;
    // Kalp atışı zaman aşımı: sekme kapanışı/ağ kopması WebRTC 'close' olayını geç (30 sn+) getirebilir; uygulama katmanında
    // ev sahibi 15 sn sessiz konuğu düşürür, konuk 25 sn sessiz ev sahibini 'ayrıldı' sayar (ping/pong setInterval ile
    // sürdüğü için arka plan sekmesi hemen düşmez). Dünya yüklenirken (ilk 'st'/ilk 'snap' öncesi) sayılmaz: yavaş makinede
    // yükleme 15 sn'yi aşabilir ve konuk haksız yere düşürülürdü (06a2 koşusunda görüldü).
    const nowMs = performance.now();
    if (G.isHost) {
      for (const [pid, c] of [...this.conns]) if (c.inGame && c.lastSeen && nowMs - c.lastSeen > 15000) { console.warn('Ağ: konuk 15 sn sessiz, bağlantı düşürülüyor', pid); try { c.conn.close(); } catch (e) { /* */ } this._dropPeer(pid); }
    } else if (this.hostConn && this._snapSeen && this._lastHostMsg) { // ilk anlık görüntüden sonra: ev sahibi de yükleniyor olabilir
      if (nowMs - this._lastHostMsg > 25000) { this._lastHostMsg = 0; G.emit('hostLeft', 'Ev sahibinden 25 saniyedir veri gelmiyor (bağlantı koptu).'); }
      else if (nowMs - this._lastHostMsg > 6000 && !this._weakWarned) { this._weakWarned = true; G.notify('Ev sahibiyle bağlantı zayıf…', 'warn', 3000); }
    }
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
    const m = { t: 'snap', players, ships: G.ships.filter((s) => !s.kinematic).map((s) => ({ id: s.id, typeId: s.typeId, look: s.look, name: s.name, st: s.netState() })), floats: events.netFloats(), shots: enemies.netShots() };
    const b = G.rowboat;
    if (b) m.rb = [b.state, +b.x.toFixed(2), +b.z.toFixed(2), +b.yaw.toFixed(3), +b.rowPhase.toFixed(2), b.cargo, b.driver];
    if (this.snapT % 2 === 0) { m.en = enemies.netSnapshot(); m.bo = bosses.netSnapshot(); m.an = animals.netSnapshot(); m.mf = megafauna.netSnapshot(); m.time = [sky.hour, sky.weatherKey, sky.windDir, time.day, sky.forecast.map((f) => [f.key, +f.at.toFixed(2)]), +sky.wetness.toFixed(2)]; m.wfx = weatherfx.netState(); m.we = worldEvents.netState(); m.ch = treasure.chests.filter((c) => c.state === 'water' || c.state === 'ground').map((c) => [c.id, +c.pos.x.toFixed(2), +c.pos.y.toFixed(2), +c.pos.z.toFixed(2), c.state]); }
    this.broadcast(m);
  },
};
