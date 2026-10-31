import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { assets } from '../core/assets.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { effects } from '../game/effects.js';
import { interact } from '../game/interact.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { physics } from '../world/physics.js';
import { DIG_SITES, ISLANDS } from '../world/worldData.js';
import { CHEST_TIERS, ITEMS, itemName } from '../economy/items.js';
import { clamp, damp, uid, rng } from '../core/util.js';
import { bodies } from '../world/bodies.js';
import { time } from '../world/time.js';

const LOOT = {
  small: { coins: [60, 140], picks: [1, 2], pool: [['inci', 3], ['gumus_kulce', 3], ['korsan_madalyonu', 1], ['yakut', 1]], map: 0.25 },
  medium: { coins: [150, 300], picks: [2, 3], pool: [['yakut', 3], ['zumrut', 3], ['gumus_kulce', 2], ['altin_kulce', 2], ['eski_mucevher', 2], ['antik_vazo', 1]], map: 0.3 },
  large: { coins: [400, 700], picks: [3, 5], pool: [['altin_kulce', 3], ['elmas', 2], ['altin_heykelcik', 2], ['eski_mucevher', 2], ['eski_kilic', 1], ['kraliyet_taci', 0.35]], map: 0.4 },
  legend: { coins: [1200, 1800], picks: [5, 7], pool: [['elmas', 3], ['altin_heykelcik', 2], ['kraliyet_taci', 1], ['altin_kulce', 3]], map: 0 },
};

export function rollLoot(tier, r = Math.random) {
  const L = LOOT[tier];
  const out = [['altin_para', Math.floor(L.coins[0] + r() * (L.coins[1] - L.coins[0]))]];
  const n = L.picks[0] + Math.floor(r() * (L.picks[1] - L.picks[0] + 1));
  const tot = L.pool.reduce((a, p) => a + p[1], 0);
  for (let i = 0; i < n; i++) {
    let x = r() * tot;
    for (const [id, w] of L.pool) { x -= w; if (x <= 0) { const ex = out.find((o) => o[0] === id); if (ex) ex[1]++; else out.push([id, 1]); break; } }
  }
  if (r() < L.map) out.push(['hazine_haritasi', 1, { site: null }]);
  return out;
}

export const treasure = {
  name: 'treasure',
  saveKey: 'treasure',
  chests: [],
  pickups: [],
  holes: [],
  found: {},

  init(scene) {
    this.scene = scene;
    interact.addProvider((ctx, out) => this._provide(ctx, out));
    G.on('dropCarry', (e) => this.drop(e.player, e.inWater));
    G.on('stowCarry', (e) => this.stowInHold(e.ship));
    G.on('stowCarryBoat', (e) => this.stowInBoat(e.boat));
    G.on('boatRecall', (e) => this.boatToHold(e.boat, e.ship));
    G.on('loot', (e) => this.spawnLoot(e.pos, e.table, e.from));
    this.holeGroup = new THREE.Group();
    scene.add(this.holeGroup);
  },

  start(data) {
    for (const c of this.chests) this.scene.remove(c.mesh);
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.chests = []; this.pickups = []; this.found = {};
    while (this.holeGroup.children.length) this.holeGroup.remove(this.holeGroup.children[0]);
    this.holes = [];
    const d = data?.treasure;
    if (d) {
      this.found = d.found || {};
      for (const c of d.chests || []) this.spawnChest(c.tier, new THREE.Vector3(c.x, c.y, c.z), { id: c.id, contents: c.contents, siteId: c.siteId });
      for (const h of d.holes || []) this._hole(h.x, h.z, false);
    }
  },
  stop() { this.start(null); },

  save() {
    return {
      found: this.found,
      chests: this.chests.filter((c) => c.state === 'ground' || c.state === 'water').map((c) => ({ id: c.id, tier: c.tier, x: c.pos.x, y: c.pos.y, z: c.pos.z, contents: c.contents, siteId: c.siteId })),
      holes: this.holes.slice(-20).map((h) => ({ x: h.x, z: h.z })),
    };
  },

  // ---- harita ----
  siteById(id) { return DIG_SITES.find((s) => s.id === id); },
  randomSite(exclude = []) {
    const p = G.player;
    const held = new Set(p ? p.inv.stacks.filter((s) => s.id === 'hazine_haritasi').map((s) => s.data?.site) : []);
    const avail = DIG_SITES.filter((s) => !held.has(s.id) && !exclude.includes(s.id) && !(this.found[s.id] && Date.now() - this.found[s.id] < 1000 * 60 * 8));
    const list = avail.length ? avail : DIG_SITES.filter((s) => !held.has(s.id));
    return list[Math.floor(Math.random() * list.length)] || DIG_SITES[0];
  },
  giveMap(siteId = null, silent = false) {
    const site = siteId ? this.siteById(siteId) : this.randomSite();
    const isl = ISLANDS.find((i) => i.id === site.island);
    G.player.inv.add('hazine_haritasi', 1, { site: site.id, island: isl?.name, weight: 0.05 }, true);
    if (!silent) G.notify(`Hazine haritası aldın: ${isl?.name}. (5 ile aç ya da envanterden incele)`, 'good', 4500);
    G.emit('mapGained', { site: site.id });
    return site;
  },
  activeSites() {
    const set = new Set();
    const p = G.player;
    if (p) for (const s of p.inv.stacks) if (s.id === 'hazine_haritasi' && s.data?.site) set.add(s.data.site);
    for (const id of G.remoteMapSites || []) set.add(id);
    for (const id of G.storySites || []) set.add(id);
    return set;
  },

  // ---- kazı ----
  update(dt) {
    const p = G.player;
    if (!p) return;
    if (p.equipped === 'shovel' && !G.uiOpen && !p.busy && !p.carrying && p.mode === 'ground' && p.onGround && input.pressed('saldiri')) this.startDig(p);
    // taşınan sandık konumu
    for (const c of this.chests) this._updateChest(c, dt);
    // ganimetler
    for (const pk of this.pickups) {
      pk.t += dt;
      const inner = pk.mesh.children[0];
      if (inner) { inner.rotation.y += dt * 1.5; inner.position.y = 0.12 + Math.sin(pk.t * 2) * 0.06; }
      if (pk.body) pk.pos.copy(pk.body.pos);
      else {
        const wh = ocean.heightAt(pk.pos.x, pk.pos.z);
        const gy = physics.groundAt(pk.pos.x, pk.pos.z, pk.pos.y + 1);
        pk.mesh.position.set(pk.pos.x, Math.max(gy, wh - 0.1) + 0.25, pk.pos.z);
      }
      if (pk.t > 300) pk.remove = true;
    }
    const rm = this.pickups.filter((x) => x.remove);
    for (const x of rm) { this.scene.remove(x.mesh); if (x.body) bodies.remove(x.body); }
    if (rm.length) this.pickups = this.pickups.filter((x) => !x.remove);
  },

  startDig(p) {
    const ground = terrain.heightAt(p.pos.x, p.pos.z);
    // gelgit: bazı kumsallar yalnızca alçak suda açığa çıkar
    const tideSite = DIG_SITES.find((s) => s.tide && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) < 14);
    if (tideSite && ground < ocean.tide + 0.08) {
      const low = time.nextTides(4).find((t) => !t.high);
      G.notify(`Kum şu an su altında. Gelgitin çekilmesini bekle${low ? ` (alçak su ~${time.hourString(low.at)})` : ''}.`, 'warn', 5000);
      return;
    }
    if (ground < (tideSite ? -0.6 : 0.2)) { G.notify('Burası kazmak için fazla ıslak.', 'warn'); return; }
    const fx = p.pos.x + Math.sin(p.yaw) * 0.9, fz = p.pos.z + Math.cos(p.yaw) * 0.9;
    let n = 0;
    p.startBusy('Kazılıyor…', 2.6, () => this.finishDig(p, fx, fz), { anim: 'dig' });
    const iv = setInterval(() => {
      if (!p.busy) { clearInterval(iv); return; }
      effects.dirt(fx, terrain.heightAt(fx, fz) + 0.1, fz, 6);
      audio.play('step', { vol: 0.4, rate: 0.5, pos: p.pos });
      if (++n > 6) clearInterval(iv);
    }, 380);
  },

  finishDig(p, x, z) {
    this._hole(x, z, true);
    if (G.online && !G.isHost) { G.emit('netDig', { x, z }); return; }
    this.resolveDig(x, z, G.myId);
  },

  resolveDig(x, z, who) {
    const active = this.activeSites();
    let site = null, bd = 1e9;
    for (const s of DIG_SITES) {
      const d = Math.hypot(s.x - x, s.z - z);
      const recent = this.found[s.id] && Date.now() - this.found[s.id] < 1000 * 60 * 8;
      if (d < 2.8 && d < bd && active.has(s.id) && !recent && !this.chests.some((c) => c.siteId === s.id && c.state !== 'gone')) { bd = d; site = s; }
    }
    if (!site) {
      const near = DIG_SITES.find((s) => active.has(s.id) && Math.hypot(s.x - x, s.z - z) < 9);
      G.emit('digResult', { who, ok: false, warm: !!near });
      if (who === G.myId) G.notify(near ? 'Kürek bir şeye değmedi… ama yakın olmalısın!' : 'Burada hiçbir şey yok.', near ? 'info' : 'warn');
      return;
    }
    // sandık çıkar
    const pos = new THREE.Vector3(site.x, terrain.heightAt(site.x, site.z) - 0.6, site.z);
    const c = this.spawnChest(site.tier, pos, { siteId: site.id, rising: true });
    this.found[site.id] = Date.now();
    // harita kullanıldı (kazan kişinin haritası düşer)
    if (who === G.myId) this.mapUsed(site.id);
    else G.emit('netMapUsed', { who, site: site.id });
    audio.play('level_up', { vol: 0.6 });
    effects.glitter(site.x, pos.y + 0.8, site.z);
    G.notify(`Hazine buldun: ${CHEST_TIERS[site.tier].name}!`, 'good', 4500);
    G.emit('treasureFound', { site: site.id, tier: site.tier, chest: c.id, who });
    G.emit('netChestSpawn', { chest: this.chestNet(c) });
  },

  mapUsed(siteId) {
    const st = G.player.inv.stacks.find((s) => s.id === 'hazine_haritasi' && s.data?.site === siteId);
    if (st) G.player.inv.removeStack(st);
    G.emit('mapGained', {});
  },

  _hole(x, z, effect) {
    const y = terrain.heightAt(x, z);
    const g = new THREE.Group();
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 }));
    hole.rotation.x = -Math.PI / 2; hole.position.y = 0.03;
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 1 }));
    mound.scale.set(1, 0.4, 0.8); mound.position.set(0.8, 0, 0.2);
    g.add(hole, mound);
    g.position.set(x, y, z);
    g.rotation.y = Math.random() * 6;
    this.holeGroup.add(g);
    this.holes.push({ x, z });
    if (this.holeGroup.children.length > 40) { this.holeGroup.remove(this.holeGroup.children[0]); this.holes.shift(); }
    if (effect) effects.dirt(x, y + 0.2, z, 16);
  },

  // ---- sandıklar ----
  spawnChest(tier, pos, opts = {}) {
    const T = CHEST_TIERS[tier];
    const mesh = assets.prop('chest', 0.9 * T.scale);
    mesh.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        if (tier === 'legend') { o.material.color.multiply(new THREE.Color(0x8a6aff)); o.material.emissive = new THREE.Color(0x201040); }
        else if (tier === 'large') o.material.color.multiply(new THREE.Color(0xd8c0a0));
      }
    });
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const c = {
      id: opts.id || uid('ch'), tier, T, mesh, pos: pos.clone(), yaw: Math.random() * 6.28,
      state: 'ground', carriers: [], contents: opts.contents || rollLoot(tier), siteId: opts.siteId || null,
      rising: opts.rising ? 1 : 0, vy: 0,
    };
    this.chests.push(c);
    return c;
  },

  _updateChest(c, dt) {
    if (c.body && !(c.state === 'ground' || c.state === 'water')) { bodies.remove(c.body); c.body = null; c.mesh.rotation.set(0, c.yaw, 0); }
    if (c.state === 'carried') {
      const carrier = c.carriers[0] === G.myId ? G.player : G.remotes.get(c.carriers[0]);
      if (!carrier) { c.state = 'ground'; c.carriers = []; return; }
      const fwd = new THREE.Vector3(Math.sin(carrier.yaw), 0, Math.cos(carrier.yaw));
      c.pos.copy(carrier.pos).addScaledVector(fwd, 0.55);
      c.pos.y += 0.75 - (c.T.scale - 1) * 0.3;
      c.yaw = carrier.yaw;
      if (c.carriers.length > 1) c.pos.addScaledVector(fwd, 0.35);
    } else if ((c.state === 'ground' || c.state === 'water') && c.rising <= 0 && (!G.online || G.isHost)) {
      // fiziksel sandık: düşer, yuvarlanır, yüzer, itilebilir
      const r = 0.32 * c.T.scale;
      if (!c.body) {
        c.mesh.rotation.set(0, c.yaw, 0);
        c.body = bodies.add(c.mesh, { pos: c.pos.clone().add(new THREE.Vector3(0, r, 0)), vel: c.dropVel || new THREE.Vector3(), radius: r, offsetY: r, mass: c.T.weight / 15, buoyancy: 1.25, restitution: 0.12, friction: 0.85, drift: 0.6 });
        c.dropVel = null;
      }
      c.pos.set(c.body.pos.x, c.body.pos.y - r, c.body.pos.z);
      // derin suyun üstündeyse yüzüyordur (dalga tepesinde anlık su dışına çıksa bile)
      c.state = c.body.inWater > 0.05 || terrain.heightAt(c.pos.x, c.pos.z) < ocean.tide - 0.45 ? 'water' : 'ground';
      c.mesh.visible = true;
      return;
    } else if (c.state === 'ground' || c.state === 'water') {
      if (c.rising > 0) {
        c.rising -= dt * 0.8;
        c.pos.y = terrain.heightAt(c.pos.x, c.pos.z) - Math.max(0, c.rising) * 0.6;
      } else {
        const g = physics.groundAt(c.pos.x, c.pos.z, c.pos.y + 0.5);
        const wh = ocean.heightAt(c.pos.x, c.pos.z);
        if (g < wh - 0.5) {
          // yüzer
          c.state = 'water';
          c.pos.y = damp(c.pos.y, wh - 0.35, 3, dt);
          // akıntıyla hafif sürüklenme
          c.pos.x += Math.sin(ocean.time * 0.1) * dt * 0.1;
        } else {
          c.state = 'ground';
          c.vy -= 15 * dt;
          c.pos.y += c.vy * dt;
          if (c.pos.y < g) { c.pos.y = g; c.vy = 0; }
        }
      }
    } else if (c.state === 'boat') {
      const b = G.rowboat;
      const i = b.cargo.indexOf(c.id);
      const off = new THREE.Vector3(0, 0.2, i === 0 ? -0.9 : 0.9).applyQuaternion(b.mesh.quaternion);
      c.pos.copy(b.mesh.position).add(off);
      c.yaw = b.yaw;
    }
    c.mesh.visible = c.state !== 'hold' && c.state !== 'gone';
    c.mesh.position.copy(c.pos);
    c.mesh.rotation.y = c.yaw;
    if (c.state === 'water') c.mesh.rotation.z = Math.sin(ocean.time * 1.3 + c.pos.x) * 0.15;
    else c.mesh.rotation.z = 0;
  },

  chestById(id) { return this.chests.find((c) => c.id === id); },

  pickUp(p, c) {
    if (p.carrying) return;
    if (G.online && !G.isHost) { G.emit('netChestReq', { a: 'pick', id: c.id }); return; }
    this._grant(c, G.myId);
  },
  _grant(c, who) {
    if (c.state === 'carried') {
      if (c.T.twoPlayer && c.carriers.length < 2 && !c.carriers.includes(who)) c.carriers.push(who);
      else return false;
    } else {
      c.state = 'carried';
      c.carriers = [who];
    }
    if (c.boatRemove) c.boatRemove();
    const rb = G.rowboat;
    if (rb && rb.cargo.includes(c.id)) rb.cargo = rb.cargo.filter((x) => x !== c.id);
    if (who === G.myId) this._applyCarry(G.player, c);
    G.emit('netChestState', { chest: this.chestNet(c) });
    return true;
  },
  _applyCarry(p, c) {
    const solo = c.carriers.length < 2;
    p.carrying = { id: c.id, tier: c.tier, speedFactor: solo ? c.T.carrySpeed : Math.min(0.9, c.T.carrySpeed + 0.4) };
    p.equipped = 'none';
    p.char.hold(null);
    p.torch = false; p._syncTorch();
    if (solo && c.T.twoPlayer) G.notify(`${c.T.name} çok ağır! Tek başına çok yavaş taşırsın — bir tayfa arkadaşı yardım edebilir.`, 'info', 4500);
    audio.play('confirm', { vol: 0.4 });
  },

  drop(p, inWater = false) {
    if (!p.carrying) return;
    const c = this.chestById(p.carrying.id);
    p.carrying = null;
    if (!c) return;
    c.carriers = c.carriers.filter((x) => x !== G.myId);
    if (c.carriers.length === 0) {
      c.state = 'ground';
      c.vy = 0;
      // bırakırken hafifçe öne at
      c.dropVel = new THREE.Vector3(p.vel.x + Math.sin(p.yaw) * 1.2, 1.5, p.vel.z + Math.cos(p.yaw) * 1.2);
      if (p.mode === 'deck' && p.ship) {
        // güverteye bırakılan sandık ambara konur
        this.stowInHold(p.ship, c, true);
        return;
      }
    }
    if (inWater) G.notify('Sandık suya düştü — yüzüyor. Kayıkla ya da sığlıkta alabilirsin.', 'warn');
    G.emit('netChestState', { chest: this.chestNet(c) });
  },

  stowInHold(ship, chest = null, auto = false) {
    const p = G.player;
    const c = chest || (p.carrying && this.chestById(p.carrying.id));
    if (!c) return;
    const cap = ship.holdCapacity();
    const w = ship.holdWeight(ITEMS);
    if (ship.hold.chests.length >= ship.T.holdSlots || w + c.T.weight > cap) {
      G.notify('Ambar dolu! Önce limanda ganimet sat ya da gemini geliştir.', 'warn');
      if (auto) { c.state = 'ground'; }
      return;
    }
    ship.hold.chests.push({ id: c.id, tier: c.tier, contents: c.contents, weight: c.T.weight, siteId: c.siteId });
    c.state = 'gone';
    this.scene.remove(c.mesh);
    this.chests = this.chests.filter((x) => x !== c);
    if (p.carrying && p.carrying.id === c.id) p.carrying = null;
    audio.play('coin', { vol: 0.5 });
    G.notify(`${c.T.name} ambara yerleştirildi.`, 'good');
    G.emit('chestStowed', { tier: c.tier });
    G.emit('netHold', { ship: ship.id, hold: ship.hold, gone: c.id });
  },

  takeFromHold(ship, idx) {
    const p = G.player;
    if (p.carrying) return;
    const h = ship.hold.chests[idx];
    if (!h) return;
    ship.hold.chests.splice(idx, 1);
    const pos = p.pos.clone();
    const c = this.spawnChest(h.tier, pos, { id: h.id, contents: h.contents, siteId: h.siteId });
    c.state = 'carried';
    c.carriers = [G.myId];
    this._applyCarry(p, c);
    G.emit('netHold', { ship: ship.id, hold: ship.hold });
    G.emit('netChestSpawn', { chest: this.chestNet(c) });
  },

  stowInBoat(boat) {
    const p = G.player;
    if (!p.carrying) return;
    const c = this.chestById(p.carrying.id);
    if (!c) return;
    if (boat.cargo.length >= 2) { G.notify('Kayıkta yer yok (en fazla 2 sandık).', 'warn'); return; }
    boat.cargo.push(c.id);
    c.state = 'boat';
    c.carriers = [];
    p.carrying = null;
    G.notify(`${c.T.name} kayığa yüklendi.`);
    G.emit('netChestState', { chest: this.chestNet(c) });
  },

  boatToHold(boat, ship) {
    for (const id of [...boat.cargo]) {
      const c = this.chestById(id);
      if (!c) continue;
      boat.cargo = boat.cargo.filter((x) => x !== id);
      this.stowInHold(ship, c, true);
    }
  },

  open(p, c) {
    if (G.online && !G.isHost) { G.emit('netChestReq', { a: 'open', id: c.id }); return; }
    this._openChest(c, G.myId);
  },
  _openChest(c, who) {
    if (c.state === 'gone') return;
    c.state = 'gone';
    this.scene.remove(c.mesh);
    this.chests = this.chests.filter((x) => x !== c);
    const pos = c.pos.clone();
    effects.glitter(pos.x, pos.y, pos.z);
    audio.play('gem', { vol: 0.6 });
    this.spawnLoot(pos, c.contents.map((x) => [x[0], 1, x[1], x[2]]), c.T.name, true);
    G.emit('chestOpened', { tier: c.tier, who });
    G.emit('netChestGone', { id: c.id });
  },

  // ---- ganimet torbaları ----
  spawnLoot(pos, table, from = '', exact = false) {
    const items = [];
    for (const row of table) {
      const [id, a, b, data] = row;
      if (exact) { items.push([id, b, data]); continue; }
      if (b !== undefined && a >= 1 && b >= a) items.push([id, Math.floor(a + Math.random() * (b - a + 1))]);
      else if (a < 1) { if (Math.random() < a) items.push([id, 1]); }
      else items.push([id, a]);
    }
    const filtered = items.filter((i) => i[1] > 0);
    if (!filtered.length) return;
    const mesh = new THREE.Group();
    const coins = filtered.find((i) => i[0] === 'altin_para');
    const inner = new THREE.Group();
    const bag = this._lootModel(filtered, coins);
    inner.add(bag);
    mesh.add(inner);
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 20), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.02;
    mesh.add(glow);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const pk = { id: uid('pk'), pos: pos.clone(), items: filtered, mesh, t: 0, from };
    // fiziksel ganimet: hafifçe havaya fırlar, yere düşer, suda yüzer
    if (!G.online || G.isHost) {
      const a = Math.random() * Math.PI * 2;
      pk.body = bodies.add(mesh, { pos: pos.clone().add(new THREE.Vector3(0, 0.6, 0)), vel: new THREE.Vector3(Math.cos(a) * 1.4, 4.2, Math.sin(a) * 1.4), radius: 0.22, offsetY: 0.05, mass: 0.3, buoyancy: 1.6, restitution: 0.35, friction: 0.9 });
    }
    this.pickups.push(pk);
    G.emit('netPickupSpawn', { pk: { id: pk.id, pos: pk.pos.toArray(), items: pk.items, from } });
    return pk;
  },

  _lootModel(items, coins) {
    // ganimet türüne göre görünüm: sikke yığını, kese, mücevher
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c040, metalness: 0.85, roughness: 0.28, emissive: 0x3a2400 });
    if (coins && items.length === 1) {
      for (let i = 0; i < 7; i++) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 14), gold);
        c.position.set((Math.random() - 0.5) * 0.16, i * 0.016, (Math.random() - 0.5) * 0.16);
        c.rotation.set((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
        g.add(c);
      }
      return g;
    }
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 1 }));
    sack.scale.set(1, 1.15, 1);
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1 }));
    tie.position.y = 0.19;
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 5, 12), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.4 }));
    rope.rotation.x = Math.PI / 2; rope.position.y = 0.16;
    sack.position.y = 0.05;
    g.add(sack, tie, rope);
    const gem = items.find((i) => ['yakut', 'zumrut', 'elmas', 'inci'].includes(i[0]));
    if (gem) {
      const col = { yakut: 0xd03040, zumrut: 0x30b060, elmas: 0xe8f4ff, inci: 0xf4f0ea }[gem[0]];
      const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: col, metalness: 0.2, roughness: 0.1, emissive: col, emissiveIntensity: 0.25 }));
      gm.position.set(0.12, 0.2, 0.05);
      g.add(gm);
    }
    return g;
  },

  collect(p, pk) {
    if (G.online && !G.isHost) { G.emit('netPickupReq', { id: pk.id }); return; }
    this._collect(pk, G.myId);
  },
  _collect(pk, who) {
    if (pk.remove) return;
    pk.remove = true;
    G.emit('netPickupGone', { id: pk.id, who, items: pk.items });
    if (who === G.myId) this.giveItems(pk.items, pk.from);
  },
  giveItems(items, from = '') {
    const p = G.player;
    const got = [];
    let left = [];
    for (const [id, n, data] of items) {
      if (id === 'hazine_haritasi') { const s = this.giveMap(data?.site || null, true); got.push(`Hazine haritası (${ISLANDS.find((i) => i.id === s.island)?.name})`); continue; }
      const rest = p.inv.add(id, n, data || null);
      if (rest < n) got.push(`${itemName(id)}${n - rest > 1 ? ' ×' + (n - rest) : ''}`);
      if (rest > 0) left.push([id, rest, data]);
    }
    if (got.length) { G.notify(`${from ? from + ': ' : ''}${got.join(', ')}`, 'good', 4500); audio.play('coin', { vol: 0.6 }); }
    if (left.length) {
      G.notify('Envanterin dolu! Bazı eşyalar yere bırakıldı.', 'warn');
      this.spawnLoot(p.pos.clone(), left.map((l) => [l[0], 1, l[1], l[2]]), from, true);
    }
    G.emit('itemsGained', { items });
  },

  // ---- etkileşimler ----
  _provide(ctx, out) {
    const p = ctx.player;
    if (p.mode === 'helm' || p.mode === 'cannon' || p.mode === 'boat' || p.busy) return;
    if (p.carrying) {
      out.push({ id: 'drop', dist: 50, priority: -5, label: 'Sandığı bırak (G)', action: () => this.drop(p) });
      return;
    }
    for (const c of this.chests) {
      if (c.state === 'gone' || c.state === 'hold' || c.rising > 0) continue;
      const d = c.pos.distanceTo(p.pos);
      if (d > 2.6) continue;
      if (c.state === 'carried') {
        if (c.T.twoPlayer && c.carriers.length === 1 && c.carriers[0] !== G.myId) out.push({ id: 'help' + c.id, pos: c.pos, radius: 2.6, priority: 2, label: 'Birlikte taşı', action: () => this.pickUp(p, c) });
        continue;
      }
      out.push({ id: 'carry' + c.id, pos: c.pos, radius: 2.6, priority: 1, label: `${c.T.name} — taşı`, sub: `${c.T.weight} kg · Basılı tut: sandığı aç`, hold: 1.4, action: () => this.pickUp(p, c), holdAction: () => this.open(p, c) });
    }
    for (const pk of this.pickups) {
      if (pk.remove) continue;
      const d = pk.pos.distanceTo(p.pos);
      if (d < 2.4) out.push({ id: 'pk' + pk.id, pos: pk.pos, radius: 2.4, priority: 1.5, label: 'Ganimeti topla', sub: pk.items.map((i) => itemName(i[0], i[2]) + (i[1] > 1 ? ' ×' + i[1] : '')).slice(0, 4).join(', '), action: () => this.collect(p, pk) });
    }
  },

  chestNet(c) { return { id: c.id, tier: c.tier, pos: c.pos.toArray(), state: c.state, carriers: c.carriers, contents: c.contents, siteId: c.siteId }; },
};
