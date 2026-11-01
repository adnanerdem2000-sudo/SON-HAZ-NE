import * as THREE from 'three';
import { G } from './ctx.js';
import { Ship } from '../ship/ship.js';
import { combat } from './combat.js';
import { effects } from './effects.js';
import { treasure } from '../treasure/treasure.js';
import { interact } from './interact.js';
import { audio } from '../core/audio.js';
import { assets } from '../core/assets.js';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { sky } from '../world/sky.js';
import { port } from '../world/port.js';
import { clamp, damp, dampAngle, wrapAngle, uid } from '../core/util.js';
import { bodies } from '../world/bodies.js';
import { enemies } from './enemies.js';
import { quests } from './quests.js';
import { worldEvents } from './worldEvents.js';

// Rastgele dünya olayları + düşman korsan gemisi + tayfa yardımcısı + gemi batma/kurtarma
export const events = {
  name: 'events',
  floating: [],

  init(scene) {
    this.scene = scene;
    interact.addProvider((ctx, out) => {
      const p = ctx.player;
      for (const f of this.floating) {
        if (f.gone) continue;
        const d = Math.hypot(p.pos.x - f.pos.x, p.pos.z - f.pos.z);
        const reach = p.mode === 'boat' ? 3.5 : p.mode === 'deck' ? 0 : 2.6;
        if (d < reach) out.push({ id: 'fl' + f.id, pos: f.pos, radius: reach, priority: 3, label: f.label, action: () => this.collectFloating(f, G.myId) });
      }
    });
    G.on('shipEvent', (e) => this._shipEvent(e));
    G.on('raiseShip', () => this.raiseShip());
  },

  start() {
    for (const f of this.floating) this.scene.remove(f.mesh);
    this.floating = [];
    this.eventT = 90 + Math.random() * 60;
    if (this.enemyShip) { this._removeEnemyShip(); }
    this.crewT = 0;
  },
  stop() { this.start(); },

  update(dt) {
    const p = G.player;
    if (!p) return;
    // yüzen nesneler
    for (const f of this.floating) {
      f.t += dt;
      if (f.body) f.pos.copy(f.body.pos);
      else if (f.net) {
        // konuk: konum ev sahibinin anlık görüntüsünden (yumuşatılmış); 4 sn görüntüde yoksa kaldırılır
        if (f.netPos) f.pos.lerp(f.netPos, 1 - Math.exp(-8 * dt));
        f.mesh.position.copy(f.pos);
        f.mesh.rotation.set(Math.sin(f.t) * 0.2, f.t * 0.2, Math.cos(f.t * 1.3) * 0.2);
        if ((f.netMiss || 0) > 45) f.gone = true; // ~3 sn boyunca hiçbir anlık görüntüde yoksa
      } else {
        f.pos.y = ocean.heightAt(f.pos.x, f.pos.z) - 0.15;
        f.pos.x += Math.cos(sky.windDir) * dt * 0.15; f.pos.z += Math.sin(sky.windDir) * dt * 0.15;
        f.mesh.position.copy(f.pos);
        f.mesh.rotation.set(Math.sin(f.t) * 0.2, f.t * 0.2, Math.cos(f.t * 1.3) * 0.2);
      }
      if (f.t > 420) f.gone = true;
    }
    const rm = this.floating.filter((f) => f.gone);
    for (const f of rm) { this.scene.remove(f.mesh); if (f.body) bodies.remove(f.body); if (G.online && G.isHost) G.emit('netFloatGone', { id: f.id }); }
    if (rm.length) this.floating = this.floating.filter((f) => !f.gone);
    // tayfa yardımcısı
    if (G.crewHired && G.ship && !G.ship.sunk) {
      const s = G.ship;
      s.water = Math.max(0, s.water - dt * 1.2);
      this.crewT += dt;
      if (this.crewT > 20 && s.holes.length && s.planks > 0) { this.crewT = 0; s.planks--; s.repairHole(s.holes[0].id); G.notify('Çırak Mert bir deliği onardı.', 'info', 2500); }
    }
    // olay zamanlayıcı (yalnızca host)
    if (!G.isHost) return;
    this.eventT -= dt;
    const atSea = !terrain.islandAt(p.pos.x, p.pos.z, 1.15);
    if (this.eventT <= 0) {
      this.eventT = 120 + Math.random() * 150;
      if (atSea || Math.random() < 0.3) this.randomEvent();
    }
    this._updateEnemyShip(dt);
  },

  // Bağlama göre ağırlıklı olay seçimi (bölge, saat, hava, gemi durumu)
  randomEvent() {
    const c = worldEvents.context();
    const W = [
      ['barrel', 1], ['bottle', 0.8], ['chest', 0.55],
      ['storm', c.calm && c.reg !== 'hayalet' ? 0.45 : 0],
      ['survivor', c.reg === 'hayalet' ? 0.1 : 0.5],
      ['enemyShip', !this.enemyShip && G.ship && !G.ship.sunk ? (c.reg === 'col' || c.reg === 'merkez' ? 1 : 0.6) : 0],
      ['birds', c.night ? 0 : 0.45],
      ...worldEvents.weights(c),
    ];
    const tot = W.reduce((s, w) => s + w[1], 0);
    let r = Math.random() * tot, pick = 'barrel';
    for (const [k, w] of W) { if ((r -= w) <= 0) { pick = k; break; } }
    if (!this.trigger(pick)) this.trigger('barrel');
  },

  trigger(kind) {
    if (!['barrel', 'bottle', 'chest', 'storm', 'survivor', 'enemyShip', 'birds'].includes(kind)) return worldEvents.trigger(kind);
    const r = { barrel: 0.1, bottle: 0.3, chest: 0.45, storm: 0.6, survivor: 0.7, enemyShip: 0.8, birds: 0.95 }[kind];
    return this._classic(r) !== false;
  },

  _classic(r) {
    const p = G.player;
    const center = G.ship && (p.mode === 'deck' || p.mode === 'helm') ? new THREE.Vector3(G.ship.x, 0, G.ship.z) : p.pos.clone();
    const spot = (dist) => {
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * 6.28;
        const x = center.x + Math.cos(a) * dist, z = center.z + Math.sin(a) * dist;
        if (terrain.heightAt(x, z) < -3) return new THREE.Vector3(x, 0, z);
      }
      return null;
    };
    if (r < 0.22) {
      const s = spot(60); if (!s) return false;
      this.spawnFloating('barrel', s);
      G.notify('Gözcü: "Dalgaların arasında sürüklenen bir varil var!"', 'event', 4500);
    } else if (r < 0.4) {
      const s = spot(45); if (!s) return false;
      this.spawnFloating('bottle', s);
      G.notify('Suda parlayan bir şişe gördün… İçinde mesaj olabilir!', 'event', 4500);
    } else if (r < 0.52) {
      const s = spot(70); if (!s) return false;
      this.spawnFloating('chest', s);
      G.notify('Batık bir gemiden kopmuş bir sandık sürükleniyor!', 'event', 4500);
    } else if (r < 0.64) {
      if (sky.weatherKey !== 'firtina') { sky.setWeather('firtina'); G.notify('Ufukta kara bulutlar… Fırtına yaklaşıyor! Yelkenleri azalt.', 'event', 5000); G.emit('netWeather', { w: 'firtina' }); }
    } else if (r < 0.74) {
      const s = spot(55); if (!s) return false;
      this.spawnFloating('survivor', s);
      G.notify('Bir salın üzerinde el sallayan bir kazazede var!', 'event', 5000);
    } else if (r < 0.9) {
      if (!this.enemyShip && G.ship && !G.ship.sunk) this.spawnEnemyShip();
    } else {
      G.notify('Martılar bir noktaya dalıyor — balık sürüsü! Oltanı hazırla.', 'event', 4500);
    }
  },

  spawnFloating(kind, pos, opts = {}) {
    let mesh;
    if (kind === 'barrel') mesh = assets.prop('barrel', 1.0);
    else if (kind === 'bottle') {
      mesh = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0x5ab0a0, transparent: true, opacity: 0.8, roughness: 0.1 }));
      b.rotation.z = Math.PI / 2;
      const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xefe0b8 }));
      paper.rotation.z = Math.PI / 2;
      mesh.add(b, paper);
      mesh.scale.setScalar(1.6);
    } else if (kind === 'chest') mesh = assets.prop('chest', 0.75);
    else if (kind === 'meteor') {
      mesh = new THREE.Group();
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color: 0x2a2030, emissive: 0x7050ff, emissiveIntensity: 0.9, roughness: 0.6, flatShading: true }));
      rock.scale.set(1, 0.7, 1.2);
      mesh.add(rock);
    } else {
      mesh = new THREE.Group();
      const raft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 2.2), new THREE.MeshStandardMaterial({ color: 0x8a6238 }));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide }));
      flag.position.set(0.6, 1.6, 0);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 5), new THREE.MeshStandardMaterial({ color: 0x5a3c22 }));
      pole.position.set(0.3, 0.9, 0);
      mesh.add(raft, flag, pole);
    }
    mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.scene.add(mesh);
    const labels = { barrel: 'Yüzen varili al', bottle: 'Şişeyi al', chest: 'Yüzen sandığı yakala', survivor: 'Kazazedeyi kurtar', meteor: 'Gök taşı parçasını al' };
    const f = { id: opts.id || uid('f'), kind, pos: pos.clone(), mesh, t: 0, label: labels[kind], net: !!opts.net };
    mesh.position.set(pos.x, ocean.heightAt(pos.x, pos.z), pos.z);
    if (!opts.net) {
      // yüzen cisim (ev sahibi / tek oyuncu): dalgalarla sallanır, rüzgârla sürüklenir, kıyıya vurur
      const rad = { barrel: 0.45, bottle: 0.2, chest: 0.4, survivor: 1.1 }[kind] || 0.4;
      f.body = bodies.add(mesh, { pos: new THREE.Vector3(pos.x, ocean.heightAt(pos.x, pos.z) + 0.2, pos.z), radius: rad, offsetY: rad * 0.6, mass: kind === 'survivor' ? 4 : 1, buoyancy: 1.9, drift: 1.1, restitution: 0.2 });
      if (G.online && G.isHost) G.emit('netFloatSpawn', { id: f.id, kind, x: +pos.x.toFixed(2), z: +pos.z.toFixed(2) });
    } else { f.pos.y = ocean.heightAt(pos.x, pos.z) - 0.15; f.netMiss = 0; }
    this.floating.push(f);
    return f;
  },

  // Toplama: konukta istek ev sahibine gider (ev sahibi doğrular, ödülü konuğa iletir); ev sahibinde/tek oyunculuda yerel.
  collectFloating(f, who = G.myId) {
    if (f.gone) return;
    if (G.online && !G.isHost) { G.emit('netFloatReq', { id: f.id }); return; }
    f.gone = true;
    const mine = who === G.myId;
    const p = G.player;
    const give = (items) => { if (mine) treasure.giveItems(items); else G.emit('netGive', { who, items }); };
    const at = mine ? p.pos.clone() : (G.remotes.get(who)?.pos.clone() || f.pos.clone());
    if (f.kind === 'barrel') {
      const tables = [[['altin_para', 20, 60], ['gulle', 0.5], ['ekmek', 0.5]], [['mermi', 5, 10], ['tahta', 0.6], ['merhem', 0.3]], [['altin_para', 40, 90], ['inci', 0.4]]];
      const t = tables[Math.floor(Math.random() * tables.length)];
      treasure.spawnLoot(at, t, 'Varil'); // ev sahibinde doğar, herkese yayınlanır
    } else if (f.kind === 'bottle') {
      give([['sise_mesaj', 1]]);
      if (mine) G.notify('Şişede mesaj aldın! Haritacı Nevra açabilir ya da envanterden kullan.', 'good', 4500);
    } else if (f.kind === 'meteor') {
      give([['gok_tasi', 1]]);
      if (mine) { G.notify('Gök Taşı Parçası aldın! Hâlâ ılık ve mor bir ışıkla parlıyor.', 'good', 4500); G.emit('rareFind', { kind: 'meteor' }); }
    } else if (f.kind === 'chest') {
      const c = treasure.spawnChest(Math.random() < 0.7 ? 'small' : 'medium', f.pos.clone());
      c.state = 'water';
      if (mine) treasure.pickUp(p, c);
      else if (treasure._grant(c, who)) G.emit('netCarryOk', { who, id: c.id });
    } else {
      if (mine) { G.notify('Kazazede: "Hayatımı kurtardın! Al bu haritayı, bir zamanlar benim de bir gemim vardı…"', 'good', 6000); treasure.giveMap(); p.inv.gold += 50; }
      else { give([['hazine_haritasi', 1, { site: treasure.randomSite().id }]]); G.emit('netGold', { who, amount: 50 }); }
    }
    if (mine) audio.play('confirm', { vol: 0.5 });
  },
  // ev sahibi: konuğun yüzen nesne isteği (6 m içinde olmalı)
  collectFloatingById(id, who, pos) {
    const f = this.floating.find((x) => x.id === id && !x.gone);
    if (!f || Math.hypot(f.pos.x - pos.x, f.pos.z - pos.z) > 6) return;
    this.collectFloating(f, who);
  },
  removeFloating(id) { const f = this.floating.find((x) => x.id === id); if (f) f.gone = true; },
  netFloats() { return this.floating.filter((f) => !f.gone).map((f) => [f.id, +f.pos.x.toFixed(2), +f.pos.y.toFixed(2), +f.pos.z.toFixed(2)]); },
  applyFloats(arr) {
    const seen = new Set();
    for (const [id, x, y, z] of arr) {
      const f = this.floating.find((o) => o.id === id);
      if (!f) continue; // floatSpawn iletisi henüz gelmedi
      (f.netPos || (f.netPos = new THREE.Vector3())).set(x, y, z);
      f.netMiss = 0; seen.add(id);
    }
    for (const f of this.floating) if (f.net && !seen.has(f.id)) f.netMiss = (f.netMiss || 0) + 1;
  },

  // ---- Düşman korsan gemisi ----
  spawnEnemyShip() {
    const s = G.ship;
    const a = Math.random() * 6.28;
    let x = s.x + Math.cos(a) * 180, z = s.z + Math.sin(a) * 180;
    if (terrain.heightAt(x, z) > -6) { x = s.x - Math.cos(a) * 180; z = s.z - Math.sin(a) * 180; }
    if (terrain.heightAt(x, z) > -6) return;
    const e = new Ship(this.scene, 'sloop', { id: uid('enemyship'), name: 'Kızıl Diş', look: { hull: '#3a2418', stripe: '#7a1f1f', sail: '#3a3a3a', flag: 'dagger' }, x, z, yaw: Math.atan2(s.x - x, s.z - z), ai: true, cannonballs: 999 });
    e.anchorState = 'up'; e.anchorT = 0; e.anchored = false; e.sail = e.sailTarget = 1;
    e.maxHp = 90; e.hp = 90;
    G.ships.push(e);
    this.enemyShip = e;
    this.esT = 0;
    this.grappled = false;
    this.captured = false;
    // güvertede tayfa: kanca atınca gemine atlarlar
    this.crew = [];
    const crewTypes = ['haydut', 'haydut', 'haydut_avci', 'haydut_nisanci'];
    crewTypes.forEach((t, i) => {
      const en = enemies.spawn(t, x, z, { ship: e, lx: (i % 2 ? 1 : -1) * 0.8, lz: -2 + i * 1.4, role: 'patrol' });
      en.awareness = 0.6;
      this.crew.push(en);
    });
    G.notify('Ufukta kara yelkenli bir gemi! Kızıl Hançer\'in korsanları saldırıyor — toplara!', 'boss', 6000);
    audio.play('boss', { vol: 0.7 });
    combat.markCombat();
  },

  _updateEnemyShip(dt) {
    const e = this.enemyShip;
    if (!e) return;
    const me = G.ship;
    this.esT += dt;
    if (e.sunk || e.sinking) {
      if (!this.esLoot) {
        this.esLoot = true;
        for (let i = 0; i < 3; i++) this.spawnFloating('barrel', new THREE.Vector3(e.x + (Math.random() - 0.5) * 10, 0, e.z + (Math.random() - 0.5) * 10));
        const c = treasure.spawnChest('medium', new THREE.Vector3(e.x, 0, e.z)); c.state = 'water';
        G.notify('Düşman gemisi batıyor! Enkazdan ganimet toplayabilirsin.', 'good', 5000);
        G.emit('enemyShipSunk');
        audio.play('big_kill', { vol: 0.8 });
      }
      if (e.sunk) this._removeEnemyShip();
      return;
    }
    if (!me || me.sunk) { e.setRudder(0.3); return; } // gemi zaten oyun döngüsünde güncelleniyor (çift hız yok)
    const dx = me.x - e.x, dz = me.z - e.z;
    const dist = Math.hypot(dx, dz);
    const crewAlive = this.crew.filter((c) => c.alive);
    // ele geçirme: tayfanın tamamı düştüyse
    if (!this.captured && this.crew.length && !crewAlive.length) {
      this.captured = true;
      const p = G.player;
      const gold = 220 + Math.floor(Math.random() * 260);
      p.inv.gold += gold;
      const extra = [['gulle', 6], ['mermi', 8], ['tahta', 3]][Math.floor(Math.random() * 3)];
      p.inv.add(extra[0], extra[1]);
      G.notify(`Düşman gemisi ele geçirildi! Ambarı yağmaladın: +${gold} altın, ${extra[1]} ${extra[0]}. Gemiyi batırıyorlar…`, 'good', 6000);
      G.emit('shipCaptured', { gold });
      quests.stats.shipsCaptured = (quests.stats.shipsCaptured || 0) + 1;
      e.water = 100; // batırılır
      this.grappled = false;
    }
    // kanca: yakın ve yavaşken gemiler birbirine bağlanır, tayfa atlar
    if (!this.grappled && !this.captured && crewAlive.length && dist < 18 && Math.abs((e.speed || 0) - (me.speed || 0)) < 4.5 && this.esT > 10) {
      this.grappled = true; this.grappleT = 0;
      G.notify('Kancalar atıldı! Düşman tayfası güverteye atlıyor — kılıçlar çekilsin!', 'boss', 4500);
      audio.play('impact', { vol: 0.7, rate: 0.7 });
      if (!this.ropes) {
        this.ropes = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18), 3)), new THREE.LineBasicMaterial({ color: 0x3a2a1a }));
        this.ropes.frustumCulled = false;
        this.scene.add(this.ropes);
      }
    }
    if (this.grappled) {
      this.grappleT += dt;
      // yan yana çekiş: hız ve yön eşitlenir
      const lp = me.worldToLocal(new THREE.Vector3(e.x, me.y, e.z));
      const side = lp.x >= 0 ? 1 : -1;
      const want = me.localToWorld(new THREE.Vector3(side * (me.T.B / 2 + e.T.B / 2 + 1.4), 0, 0));
      e.x += (want.x - e.x) * (1 - Math.exp(-1.5 * dt)); e.z += (want.z - e.z) * (1 - Math.exp(-1.5 * dt));
      e.yaw = dampAngle(e.yaw, me.yaw, 1.5, dt);
      e.vx = me.vx; e.vz = me.vz; e.speed = me.speed;
      e.updateTransform(dt);
      // tayfa sırayla atlar
      for (const c of crewAlive) {
        if (c.ship !== e || this.grappleT < 1.5 + this.crew.indexOf(c) * 1.2) continue;
        if (c.T.ranged && Math.random() < 0.5) continue; // nişancılar kendi güvertesinden ateş eder
        c.ship = me;
        c.local.set(side * (me.T.B / 2 - 0.9), 0, (Math.random() - 0.5) * me.T.L * 0.4);
        me.clampDeck(c.local);
        c.char.play('JumpShort', 0.05, { once: true, restart: true, speed: 1.4 });
        c.awareness = 1; c.state = 'chase';
      }
      // halat çizgileri
      const pa = this.ropes.geometry.attributes.position.array;
      for (let k = 0; k < 3; k++) {
        const a = me.localToWorld(new THREE.Vector3(side * me.T.B / 2, me.T.deckY + 0.8, -me.T.L * 0.3 + k * me.T.L * 0.3));
        const b = e.localToWorld(new THREE.Vector3(-side * e.T.B / 2, e.T.deckY + 0.8, -e.T.L * 0.3 + k * e.T.L * 0.3));
        pa.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      }
      this.ropes.geometry.attributes.position.needsUpdate = true;
      this.ropes.visible = true;
      combat.markCombat();
      if (dist > 30) { this.grappled = false; G.notify('Halatlar koptu!', 'warn', 2000); }
      return;
    } else if (this.ropes) this.ropes.visible = false;
    // rotası: oyuncunun yan tarafına geç, borda ateşi
    const toMe = Math.atan2(dx, dz);
    let desired;
    if (dist > 60) desired = toMe;
    else desired = toMe + (wrapAngle(e.yaw - toMe) > 0 ? Math.PI / 2 : -Math.PI / 2);
    // karaya yaklaşma
    const ahead = terrain.heightAt(e.x + Math.sin(e.yaw) * 30, e.z + Math.cos(e.yaw) * 30);
    if (ahead > -5) desired = e.yaw + Math.PI / 2;
    const diff = wrapAngle(desired - e.yaw);
    e.setRudder(clamp(diff * 2, -1, 1));
    e.sailTarget = dist < 25 ? 0.4 : 1;
    // ateş
    if (dist < 75) {
      e.model.cannons.forEach((c, i) => {
        if (!e.canFire(i)) return;
        const { muzzle, dir } = e.cannonWorld(i);
        const to = new THREE.Vector3(me.x - muzzle.x, 0, me.z - muzzle.z).normalize();
        if (dir.x * to.x + dir.z * to.z > 0.93 && Math.random() < 0.5) {
          const pitch = clamp(dist / 260, 0.02, 0.3);
          e.aimCannon(i, 0, pitch + (Math.random() - 0.5) * 0.05);
          combat.fireCannon(e, i, 'ai');
          e.cannonState[i].reload = 4.5;
        }
      });
    }
    // tayfası yaşıyorsa bordalamak için yanaşır
    if (crewAlive.length >= 2 && this.esT > 25 && dist < 70) { e.sailTarget = dist < 30 ? 0.35 : 0.7; }
    if (dist > 450 || this.esT > 300) { G.notify('Düşman gemisi ufukta kayboldu.', 'info'); this._removeEnemyShip(); return; }
    combat.markCombat();
  },

  _removeEnemyShip() {
    const e = this.enemyShip;
    if (!e) return;
    for (const c of this.crew || []) { if (c.ship === e) { c.remove = true; c.alive = false; } }
    this.crew = [];
    if (this.ropes) this.ropes.visible = false;
    this.grappled = false;
    e.dispose();
    G.ships = G.ships.filter((s) => s !== e);
    this.enemyShip = null;
    this.esLoot = false;
  },

  _shipEvent(e) {
    const s = e.ship;
    if (s !== G.ship) return;
    if (e.t === 'sinking') { G.notify('GEMİ BATIYOR! Ambar su ile doldu — hemen terk et!', 'boss', 6000); audio.play('downed', { vol: 0.8 }); }
    if (e.t === 'sunk') {
      const p = G.player;
      if (p.ship === s) {
        const w = p.pos.clone();
        p.mode = 'deck';
        p.leaveShipToWorld(w, new THREE.Vector3());
        p.enterWater();
      }
      s.hold.chests = [];
      G.notify(`${s.name} battı. Ambardaki ganimet kayboldu. Limandaki Usta Bora gemini kurtarabilir.`, 'warn', 8000);
    }
    if (e.t === 'crash') G.notify('Gemi kayalara çarptı! Gövdede hasar var.', 'warn', 2500);
    if (e.t === 'edge') G.notify('Haritanın sonu: bu sulardan ötesini kimse bilmiyor. Dümeni geri kır!', 'warn', 3500);
    if (e.t === 'damage' && Math.random() < 0.3) audio.play('impact', { vol: 0.5 });
  },

  raiseShip() {
    const p = G.player, s = G.ship;
    if (!s.sunk) return;
    if (p.inv.gold < 600) { G.notify('Gemini kurtarmak için 600 altın gerekiyor.', 'warn'); return; }
    p.inv.gold -= 600;
    s.sunk = false; s.sinking = 0; s.root.visible = true;
    s.hp = s.maxHp * 0.6; s.water = 0; s.holes = []; s._syncHoles();
    s.fires = []; s.anchorPt = null; s.vx = 0; s.vz = 0; s.yawRate = 0; s.speed = 0;
    s.x = port.mooring.x; s.z = port.mooring.z; s.yaw = port.mooring.yaw;
    s.anchorState = 'down'; s.anchorT = 1; s.anchored = true; s.sail = s.sailTarget = 0;
    if (G.rowboat) G.rowboat.dock();
    G.notify('Usta Bora gemini kurtarıp limana getirdi.', 'good', 5000);
  },
};
