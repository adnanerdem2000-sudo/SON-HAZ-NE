import * as THREE from 'three';
import { G } from './ctx.js';
import { Character, Animated } from '../player/character.js';
import { defaultAppearance } from '../player/appearance.js';
import { interact } from './interact.js';
import { audio } from '../core/audio.js';
import { port } from '../world/port.js';
import { terrain } from '../world/terrain.js';
import { physics } from '../world/physics.js';
import { dampAngle } from '../core/util.js';
import { time, SHOP_HOURS } from '../world/time.js';

// NPC görünümleri
const LOOKS = {
  f1: { gender: 'f', body: 'kahin', skin: 1, hairColor: 6, hat: 'yok', shirtColor: '#2a5a7a', coatColor: '#b8860b', pantsColor: '#3b2a1a', necklace: 'madalyon', age: 0.3 },
  f2: { gender: 'f', body: 'cevik', skin: 4, hairColor: 0, hat: 'bandana', hatColor: '#c0392b', shirtColor: '#e8dcc2', pantsColor: '#5a2a5a', earring: 'altin', age: 0.25 },
  f3: { gender: 'f', body: 'cevik', skin: 2, hairColor: 8, hat: 'kaptan', hatColor: '#1f3a5a', coat: 'uzun', coatColor: '#1f3a5a', necklace: 'altin', earring: 'altin', cape: 'var', age: 0.7 },
  m2: { gender: 'm', body: 'kaba', skin: 6, beardColor: 0, hairColor: 0, hat: 'yok', shirtColor: '#3b2a1a', pantsColor: '#2a2a2a', build: 1.12, age: 0.45 },
  m3: { gender: 'm', body: 'subay', skin: 3, hairColor: 2, beard: 'biyik', beardColor: 2, hat: 'tricorn', hatColor: '#6b4a2c', shirtColor: '#4f6b2f', pantsColor: '#6b4a2c', build: 1.1, age: 0.5 },
  m4: { gender: 'm', body: 'kaba', skin: 5, hairColor: 1, beardColor: 1, hat: 'bandana', hatColor: '#2a5a7a', shirtColor: '#e8dcc2', pantsColor: '#2a5a7a', age: 0.6 },
  m5: { gender: 'm', body: 'kaba', skin: 2, hairColor: 3, beardColor: 3, hat: 'yok', shirtColor: '#a33a2a', pantsColor: '#3b2a1a', build: 1.08, age: 0.4 },
  tuzla: { gender: 'm', body: 'kaba', skin: 3, hairColor: 8, beardColor: 8, hat: 'kaptan', hatColor: '#2a1a10', coat: 'uzun', coatColor: '#4a1a1a', shirtColor: '#4a1a1a', pantsColor: '#2a2a2a', eyepatch: 'sag', necklace: 'madalyon', age: 0.95, build: 1.05 },
};

export const npcs = {
  name: 'npcs',
  list: [],

  init(scene) {
    this.scene = scene;
    for (const spot of port.npcSpots) this._create(spot);
    // Günlük rutin: dükkân kapanınca tüccarlar Kırlangıç Hanı'nın önüne yürür, sabah geri döner
    const inn = port.npcSpots.find((sp) => sp.id === 'tuzla');
    this.streetZ = inn.z + 1.2;
    const slots = [[-7, 2], [-5, 3.6], [-3, 2.2], [3, 2.2], [5, 3.6], [7, 2], [-1.5, 3.8], [1.5, 3.8]];
    let si = 0;
    for (const n of this.list) {
      const r = n.spot.role;
      if (!n.anim || !SHOP_HOURS[r] || r === 'quest' || r === 'board') continue;
      const [dx, dz] = slots[si++ % slots.length];
      n.home = { x: n.spot.x, z: n.spot.z, yaw: n.spot.yaw };
      n.slot = { x: inn.x + dx, z: inn.z + dz, yaw: Math.atan2(inn.x - (inn.x + dx), inn.z - 1.5 - (inn.z + dz)) };
      n.at = 'home';
      n.path = null;
    }
    interact.addProvider((ctx, out) => {
      const p = ctx.player;
      if (p.mode !== 'ground') return;
      for (const n of this.list) {
        const d = n.pos.distanceTo(p.pos);
        if (d > 3) continue;
        const sp = n.spot;
        out.push({
          id: 'npc' + sp.id, pos: n.pos, radius: 3, priority: 2,
          label: sp.role === 'board' ? 'Görev panosuna bak' : `Konuş: ${sp.name}`, sub: sp.title,
          action: () => this.talk(n),
        });
      }
    });
  },

  byRole(role) { return this.list.find((n) => n.spot.role === role); },

  _create(spot) {
    if (spot.noModel) { const n = { spot, pos: new THREE.Vector3(spot.x, terrain.heightAt(spot.x, spot.z), spot.z) }; this.list.push(n); return n; }
    let anim;
    if (spot.model === 'pirate') {
      anim = new Character({ ...defaultAppearance('m'), ...LOOKS.tuzla, name: spot.name });
      anim.play('Idle', 0);
    } else {
      const look = spot.app || LOOKS[spot.look] || LOOKS.m2;
      const app = { ...defaultAppearance(look.gender || 'm'), ...look, name: spot.name };
      anim = new Character(app);
      anim.play(spot.anim || 'Idle', 0);
    }
    const root = anim.root;
    // spot.y: çağıran zemini önceden hesapladıysa (ada kurulumu NPC'yi sonraki bir karede oluşturur)
    const y = spot.y ?? Math.max(physics.groundAt(spot.x, spot.z), spot.minY ?? 2.4);
    root.position.set(spot.x, y, spot.z);
    root.rotation.y = spot.yaw;
    this.scene.add(root);
    const col = physics.addCircle(spot.x, spot.z, 0.35, y - 1, y + 2, spot.tag || 'npc');
    const n = { spot, anim, root, pos: root.position.clone(), baseYaw: spot.yaw, talkT: 0, col, colY: [col.y0, col.y1] };
    this.list.push(n);
    return n;
  },
  // Dinamik NPC (ada içeriği yüklenince eklenir, boşaltılınca kaldırılır)
  add(spot) { if (this.list.some((n) => n.spot.id === spot.id)) return null; return this._create(spot); },
  remove(id) {
    const n = this.list.find((x) => x.spot.id === id);
    if (!n) return;
    if (n.root) { this.scene.remove(n.root); n.anim.dispose?.(); }
    this.list = this.list.filter((x) => x !== n);
  },

  talk(n) {
    const sp = n.spot;
    if (n.anim) {
      n.talkT = 4;
      if (n.anim.play) n.anim.play(n.anim instanceof Character ? 'Wave' : 'Wave', 0.2, { once: true, restart: true });
      audio.babble(sp.id.length * 7, 7, sp.look?.startsWith('f') ? 1.4 : 0.9);
    }
    G.emit('npcTalk', { id: sp.id, role: sp.role, npc: sp });
  },

  // rutin yolu: bulunduğu yer → cadde → hedefin hizası → hedef
  _route(n, to) {
    const from = n.root.position;
    const tgt = to === 'inn' ? n.slot : n.home;
    const pts = [];
    if (n.spot.role === 'shipwright') pts.push({ x: from.x - 2.5, z: from.z });
    pts.push({ x: pts.length ? pts[0].x : from.x, z: this.streetZ }, { x: tgt.x, z: this.streetZ }, { x: tgt.x, z: tgt.z });
    n.path = pts;
    n.goal = to;
    n.col.y0 = n.col.y1 = 9999; // yürürken çarpışma halkası devre dışı
  },

  _walk(n, dt) {
    const wp = n.path[0];
    const r = n.root.position;
    const dx = wp.x - r.x, dz = wp.z - r.z;
    const d = Math.hypot(dx, dz);
    const step = 1.45 * dt;
    if (d <= step) {
      r.x = wp.x; r.z = wp.z;
      n.path.shift();
      if (!n.path.length) {
        n.path = null;
        n.at = n.goal;
        const t = n.goal === 'inn' ? n.slot : n.home;
        n.baseYaw = t.yaw;
        n.col.x = t.x; n.col.z = t.z;
        if (n.goal === 'home') { n.col.y0 = n.colY[0]; n.col.y1 = n.colY[1]; }
        n.anim.play('Idle', 0.3);
        return;
      }
    } else {
      r.x += (dx / d) * step; r.z += (dz / d) * step;
      n.root.rotation.y = dampAngle(n.root.rotation.y, Math.atan2(dx, dz), 6, dt);
    }
    r.y = Math.max(physics.groundAt(r.x, r.z), 2.4);
    n.pos.copy(r);
    n.anim.play('Walk', 0.25);
  },

  update(dt) {
    const p = G.player;
    const playing = G.state === 'playing';
    for (const n of this.list) {
      if (!n.anim) continue;
      n.anim.update(dt);
      if (n.talkT > 0) n.talkT -= dt;
      // günlük rutin (dükkân saatlerine göre)
      if (n.home && playing) {
        const want = time.shopOpen(n.spot.role) ? 'home' : 'inn';
        if (!n.path && n.at !== want) this._route(n, want);
        if (n.path && n.goal !== want) this._route(n, want);
        if (n.path) { this._walk(n, dt); continue; }
      }
      // yakındaki oyuncuya dön
      let yaw = n.baseYaw;
      if (p && p.pos.distanceTo(n.pos) < 6) yaw = Math.atan2(p.pos.x - n.pos.x, p.pos.z - n.pos.z);
      n.root.rotation.y = dampAngle(n.root.rotation.y, yaw, 4, dt);
      const cur = n.anim.current;
      if (cur && cur.loop === THREE.LoopOnce && !cur.isRunning()) n.anim.play('Idle', 0.3);
    }
  },

  // yeni oturumda herkes yerine (zamana göre doğrudan doğru konuma) ışınlanır
  start() {
    for (const n of this.list) {
      if (!n.home) continue;
      const want = time.shopOpen(n.spot.role) ? 'home' : 'inn';
      const t = want === 'inn' ? n.slot : n.home;
      n.root.position.set(t.x, Math.max(physics.groundAt(t.x, t.z), 2.4), t.z);
      n.root.rotation.y = n.baseYaw = t.yaw;
      n.pos.copy(n.root.position);
      n.at = want; n.path = null;
      n.col.x = t.x; n.col.z = t.z;
      if (want === 'home') { n.col.y0 = n.colY[0]; n.col.y1 = n.colY[1]; } else n.col.y0 = n.col.y1 = 9999;
      n.anim.play('Idle', 0);
    }
  },
};
