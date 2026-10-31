import * as THREE from 'three';
import { G } from './ctx.js';
import { interact } from './interact.js';
import { input } from '../core/input.js';
import { tpCamera } from '../player/camera.js';
import { Ship, Rowboat } from '../ship/ship.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { port } from '../world/port.js';
import { clamp } from '../core/util.js';

const _v = new THREE.Vector3();

// Gemi istasyonları, kayık, gemiye binme/inme etkileşimleri
export const shipControl = {
  init() {
    interact.addProvider((ctx, out) => this._provide(ctx, out));
  },

  createPlayerShip(scene, data = null) {
    const m = port.mooring;
    Ship.dock = { x: m.x, z: m.z, yaw: m.yaw, r: 14 };
    const ship = new Ship(scene, data?.typeId || 'sloop', {
      id: data?.id || 'ship_main', name: data?.name || 'Martı', look: data?.look || {},
      x: data?.x ?? m.x, z: data?.z ?? m.z, yaw: data?.yaw ?? m.yaw,
      hp: data?.hp, water: data?.water, holes: data?.holes, hold: data?.hold, upg: data?.upg,
      cannonballs: data?.cannonballs, planks: data?.planks,
    });
    if (data?.anchorState === 'up') { ship.anchorState = 'up'; ship.anchorT = 0; ship.anchored = false; }
    if (data?.sailTarget) ship.sailTarget = ship.sail = data.sailTarget;
    G.ships.push(ship);
    G.ship = ship;
    G.rowboat = new Rowboat(scene, ship);
    return ship;
  },

  replaceShip(scene, typeId) {
    const old = G.ship;
    const data = old.serialize();
    data.typeId = typeId;
    data.hp = undefined; data.holes = []; data.water = 0;
    data.upg = { hull: 0, sails: 0, cannons: 0 };
    old.dispose();
    G.ships = G.ships.filter((s) => s !== old);
    if (G.rowboat) { scene.remove(G.rowboat.mesh); }
    const p = G.player;
    if (p.ship === old) { p.leaveShipToWorld(new THREE.Vector3(port.boardingPoint.x, port.boardingPoint.y, port.boardingPoint.z - 2)); }
    return this.createPlayerShip(scene, data);
  },

  _provide(ctx, out) {
    const p = ctx.player;
    const ship = G.ship;
    if (!ship) return;
    // kontrol modlarından çıkış
    if (p.mode === 'helm') {
      out.push({ id: 'helm_exit', dist: 0, priority: 5, label: 'Dümeni bırak', action: () => this.leaveStation(p) });
      return;
    }
    if (p.mode === 'cannon') {
      out.push({ id: 'cannon_exit', dist: 0, priority: 5, label: 'Topu bırak', action: () => this.leaveStation(p) });
      return;
    }
    if (p.mode === 'boat') {
      out.push({ id: 'boat_exit', dist: 0, priority: 5, label: this._boatExitLabel(), action: () => this.exitBoat(p) });
      return;
    }
    if (p.mode === 'deck' && p.ship) {
      const s = p.ship;
      const st = s.model.stations;
      const L = (v) => s.localToWorld(_v.copy(v), new THREE.Vector3());
      out.push({ id: s.id + ':helm', lockId: s.id + ':helm', pos: L(st.helm), radius: 1.3, priority: 0.2, label: 'Dümene geç', sub: 'A/D: yön · W/S: yelken · Boşluk: yelkenleri aç/kapat', action: () => this.takeHelm(p, s) });
      out.push({ id: s.id + ':anchor', lockId: s.id + ':anchor', pos: L(st.anchor), radius: 1.8, label: s.anchorState === 'down' || s.anchorState === 'lowering' ? 'Çapayı kaldır' : 'Çapayı indir', action: () => this.anchor(s) });
      out.push({ id: s.id + ':sails', lockId: s.id + ':sails', pos: L(st.sails), radius: 1.6, label: s.sailTarget > 0.5 ? 'Yelkenleri topla' : 'Yelkenleri aç', action: () => { s.toggleSails(); G.emit('sfx', { name: 'dash', vol: 0.4, rate: 0.6 }); G.emit('shipCmd', { ship: s.id, cmd: 'sails', v: s.sailTarget }); } });
      out.push({ id: s.id + ':hold', pos: L(st.hold), radius: 1.6, label: p.carrying ? 'Sandığı ambara koy' : 'Ambarı aç', action: () => G.emit(p.carrying ? 'stowCarry' : 'openHold', { ship: s }) , priority: p.carrying ? 2 : 0 });
      out.push({ id: s.id + ':bucket', pos: L(st.bucket), radius: 1.5, label: `Suyu boşalt (%${Math.round(s.water)})`, hold: 0.6, action: () => { s.water = Math.max(0, s.water - 12); G.emit('sfx', { name: 'impact', vol: 0.25, rate: 1.6 }); G.emit('shipCmd', { ship: s.id, cmd: 'bail' }); } });
      out.push({ id: s.id + ':map', pos: L(st.map), radius: 1.5, label: 'Harita masası', action: () => G.emit('openMap') });
      // top
      s.model.cannons.forEach((cn, i) => {
        const back = new THREE.Vector3(0, 0, -1.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cn.mesh.rotation.y);
        const pos = L(cn.local.clone().add(back));
        out.push({ id: s.id + ':cannon' + i, lockId: s.id + ':cannon' + i, pos, radius: 1.2, label: `Topu kullan (Gülle: ${s.cannonballs})`, action: () => this.takeCannon(p, s, i) });
      });
      // delikler
      for (const h of s.holes) {
        out.push({ id: 'hole' + h.id, pos: L(new THREE.Vector3(h.x, s.deckAt(h.x, h.z), h.z)), radius: 1.6, priority: 1, hold: 2.2, label: s.planks > 0 || p.inv.has('tahta') ? 'Deliği onar (tahta)' : 'Deliği onarmak için tahta gerek', action: () => this.repair(p, s, h) });
      }
      // kayık
      const rb = G.rowboat;
      if (rb) {
        if (rb.state === 'docked') out.push({ id: 'davit', pos: L(st.davit), radius: 1.3, priority: 0.2, label: 'Kayığı suya indir', action: () => { rb.launch(); G.emit('sfx', { name: 'impact', vol: 0.3, rate: 0.7 }); G.emit('splash', { x: rb.x, z: rb.z, size: 1.5 }); G.emit('boatCmd', { cmd: 'launch' }); } });
        else {
          const d = Math.hypot(rb.x - s.x, rb.z - s.z);
          if (d < 22) out.push({ id: 'davit2', pos: L(st.davit), radius: 1.3, priority: 0.2, label: 'Kayığı geri çek' + (rb.cargo.length ? ` (${rb.cargo.length} sandık ambara)` : ''), action: () => { G.emit('boatRecall', { boat: rb, ship: s }); rb.dock(); G.emit('boatCmd', { cmd: 'dock' }); } });
        }
      }
      // iskeleye in (limanda demirliyken)
      const bp = port.boardingPoint;
      if (bp && Math.hypot(s.x - bp.x, s.z - bp.z) < 24) {
        out.push({ id: 'disembark', pos: L(st.ladderTop), radius: 2.2, label: 'İskeleye in', action: () => { p.leaveShipToWorld(new THREE.Vector3(bp.x, bp.y, bp.z - 1.5)); p.onGround = true; } });
      }
      return;
    }
    // sudan merdivene
    if (p.mode === 'swim') {
      for (const s of G.ships) {
        if (s.sunk || s.kinematic) continue;
        const lp = s.localToWorld(_v.copy(s.model.stations.ladder), new THREE.Vector3());
        lp.y = p.pos.y;
        out.push({ id: s.id + ':ladder', pos: lp, radius: 3.2, label: 'Merdivene tırman', action: () => p.startClimb(s) });
      }
    }
    // kayığa bin (sudan ya da karadan)
    const rb = G.rowboat;
    if (rb && rb.state === 'water' && (p.mode === 'swim' || p.mode === 'ground')) {
      const bp = new THREE.Vector3(rb.x, p.pos.y, rb.z);
      out.push({ id: 'boat_enter', pos: bp, radius: 3.0, label: 'Kayığa bin' + (p.carrying ? ' (sandığı koy)' : ''), action: () => this.enterBoat(p) });
    }
    // iskeleden gemiye
    const bp2 = port.boardingPoint;
    if (bp2 && p.mode === 'ground' && Math.hypot(p.pos.x - bp2.x, p.pos.z - bp2.z) < 7 && Math.hypot(ship.x - bp2.x, ship.z - bp2.z) < 24 && !ship.sunk) {
      out.push({ id: 'embark', pos: new THREE.Vector3(bp2.x, p.pos.y, bp2.z), radius: 7, label: `Gemiye bin (${ship.name})`, action: () => p.boardShip(ship, ship.model.stations.ladderTop.clone()) });
    }
  },

  _boatExitLabel() {
    const rb = G.rowboat;
    const s = G.ship;
    if (s && Math.hypot(rb.x - s.x, rb.z - s.z) < s.T.L * 0.8) return 'Gemiye çık';
    if (rb.beached || terrain.heightAt(rb.x, rb.z) > -1.2) return 'Karaya çık';
    return 'Kayıktan in (suya)';
  },

  takeHelm(p, s) {
    p.mode = 'helm';
    p.ship = s;
    interact.locks.set(s.id + ':helm', G.myId);
    G.emit('lock', { id: s.id + ':helm', on: true });
    G.notify('Dümendesin — A/D yön, W/S yelken, Boşluk yelkenleri aç/kapat, E bırak.', 'info', 4500);
  },
  takeCannon(p, s, i) {
    p.mode = 'cannon';
    p.ship = s;
    p.cannonIndex = i;
    p.cannonYaw = 0; p.cannonPitch = 0.05;
    interact.locks.set(s.id + ':cannon' + i, G.myId);
    G.emit('lock', { id: s.id + ':cannon' + i, on: true });
    G.notify('Fare ile nişan al, Sol tık ateş. E ile bırak.', 'info');
  },
  leaveStation(p) {
    const s = p.ship;
    if (p.mode === 'helm') {
      interact.locks.delete(s.id + ':helm');
      G.emit('lock', { id: s.id + ':helm', on: false });
      s.setRudder(0);
      p.local.copy(s.model.stations.helm).add(new THREE.Vector3(0, 0, 0.6));
    } else if (p.mode === 'cannon') {
      interact.locks.delete(s.id + ':cannon' + p.cannonIndex);
      G.emit('lock', { id: s.id + ':cannon' + p.cannonIndex, on: false });
      const cn = s.model.cannons[p.cannonIndex];
      const back = new THREE.Vector3(0, 0, -1.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), cn.mesh.rotation.y);
      p.local.copy(cn.local).add(back);
    }
    p.mode = 'deck';
    p.localY = 0;
  },
  anchor(s) {
    const st = s.toggleAnchor();
    G.emit('sfx', { name: 'impact', vol: 0.5, rate: 0.5 });
    G.notify(st === 'lowering' ? 'Çapa iniyor…' : 'Çapa kaldırılıyor…');
    G.emit('shipCmd', { ship: s.id, cmd: 'anchor', v: st });
  },
  repair(p, s, h) {
    if (s.planks > 0) s.planks--;
    else if (p.inv.has('tahta')) p.inv.remove('tahta', 1);
    else { G.notify('Tamir için tahta gerekiyor (Genel Tüccar veya Gemi Ustası).', 'warn'); return; }
    s.repairHole(h.id);
    G.emit('sfx', { name: 'hit', vol: 0.5, rate: 0.8 });
    G.notify('Delik onarıldı.');
    G.emit('shipCmd', { ship: s.id, cmd: 'repair', hole: h.id });
  },

  enterBoat(p) {
    const rb = G.rowboat;
    if (p.carrying) { G.emit('stowCarryBoat', { boat: rb }); }
    p.mode = 'boat';
    p.ship = null;
    p.char.model.rotation.x = 0; p.char.model.position.y = 0;
    p.underwater = false;
    rb.driver = G.myId;
    G.emit('boatCmd', { cmd: 'driver', who: G.myId });
  },
  exitBoat(p) {
    const rb = G.rowboat;
    const s = G.ship;
    rb.driver = null;
    rb.speed = 0;
    G.emit('boatCmd', { cmd: 'driver', who: null });
    if (s && !s.sunk && Math.hypot(rb.x - s.x, rb.z - s.z) < s.T.L * 0.8) {
      p.boardShip(s, s.model.stations.ladderTop.clone());
      return;
    }
    // en yakın kara noktasına çık
    for (let r = 1.5; r < 6; r += 0.5) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const x = rb.x + Math.cos(a) * r, z = rb.z + Math.sin(a) * r;
        if (terrain.heightAt(x, z) > 0.15) {
          p.mode = 'ground';
          p.pos.set(x, terrain.heightAt(x, z) + 0.1, z);
          p.vel.set(0, 0, 0);
          return;
        }
      }
    }
    p.mode = 'ground';
    p.pos.set(rb.x + Math.cos(rb.yaw) * 1.6, ocean.heightAt(rb.x, rb.z) - 1.2, rb.z - Math.sin(rb.yaw) * 1.6);
    p.enterWater();
  },

  // Dümen/top modundaki ek girişler (kamera ve ateş)
  update(dt) {
    const p = G.player;
    if (!p) return;
    if (p.mode === 'cannon' && p.ship && !G.uiOpen) {
      const s = p.ship;
      const look = input.lookDelta();
      p.cannonYaw = clamp((p.cannonYaw || 0) - look.dx, -0.6, 0.6);
      p.cannonPitch = clamp((p.cannonPitch || 0) - look.dy, -0.12, 0.35);
      s.aimCannon(p.cannonIndex, p.cannonYaw, p.cannonPitch);
      if (input.pressed('saldiri')) {
        if (s.canFire(p.cannonIndex)) G.emit('fireCannon', { ship: s, index: p.cannonIndex, by: G.myId });
        else if (s.cannonballs <= 0) G.notify('Gülle kalmadı! Limandan gülle al.', 'warn');
      }
    }
  },
};
