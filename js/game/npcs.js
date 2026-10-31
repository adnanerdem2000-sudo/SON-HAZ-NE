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

// NPC görünümleri
const LOOKS = {
  f1: { gender: 'f', skin: 1, hairStyle: 'orgulu', hairColor: 6, hat: 'yok', shirtColor: '#2a5a7a', pantsColor: '#3b2a1a', coat: 'yelek', necklace: 'madalyon', age: 0.3 },
  f2: { gender: 'f', skin: 4, hairStyle: 'uzun', hairColor: 0, hat: 'bandana', hatColor: '#c0392b', shirtColor: '#e8dcc2', pantsColor: '#5a2a5a', earring: 'altin', age: 0.25 },
  f3: { gender: 'f', skin: 2, hairStyle: 'atkuyrugu', hairColor: 8, hat: 'kaptan', hatColor: '#1f3a5a', coat: 'uzun', coatColor: '#1f3a5a', necklace: 'altin', earring: 'altin', age: 0.7 },
  m2: { gender: 'm', skin: 6, hairStyle: 'kel', beard: 'uzun', beardColor: 0, hat: 'yok', shirtColor: '#3b2a1a', pantsColor: '#2a2a2a', gloves: 'deri', tattoo: 'iki', build: 1.12, age: 0.45 },
  m3: { gender: 'm', skin: 3, hairStyle: 'kisa', hairColor: 2, beard: 'biyik', beardColor: 2, hat: 'tricorn', hatColor: '#6b4a2c', shirtColor: '#4f6b2f', pantsColor: '#6b4a2c', coat: 'yelek', build: 1.1, age: 0.5 },
  m4: { gender: 'm', skin: 5, hairStyle: 'daginik', hairColor: 1, beard: 'kisa', beardColor: 1, hat: 'bandana', hatColor: '#2a5a7a', shirtColor: '#e8dcc2', pantsColor: '#2a5a7a', age: 0.6 },
  m5: { gender: 'm', skin: 2, hairStyle: 'atkuyrugu', hairColor: 3, beard: 'orgulu', beardColor: 3, hat: 'yok', shirtColor: '#a33a2a', pantsColor: '#3b2a1a', gloves: 'deri', build: 1.08, age: 0.4 },
};

export const npcs = {
  name: 'npcs',
  list: [],

  init(scene) {
    this.scene = scene;
    for (const spot of port.npcSpots) {
      if (spot.noModel) { this.list.push({ spot, pos: new THREE.Vector3(spot.x, terrain.heightAt(spot.x, spot.z), spot.z) }); continue; }
      let anim, root;
      if (spot.model === 'pirate') {
        anim = new Animated('pirate', 1.75);
        root = anim.root;
        anim.play('Idle', 0);
      } else {
        const app = { ...defaultAppearance(LOOKS[spot.look].gender), ...LOOKS[spot.look], name: spot.name };
        anim = new Character(app);
        root = anim.root;
        anim.play('Idle', 0);
      }
      const y = Math.max(physics.groundAt(spot.x, spot.z), 2.4);
      root.position.set(spot.x, y, spot.z);
      root.rotation.y = spot.yaw;
      scene.add(root);
      physics.addCircle(spot.x, spot.z, 0.35, y - 1, y + 2, 'npc');
      this.list.push({ spot, anim, root, pos: root.position.clone(), baseYaw: spot.yaw, talkT: 0 });
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

  talk(n) {
    const sp = n.spot;
    if (n.anim) {
      n.talkT = 4;
      if (n.anim.play) n.anim.play(n.anim instanceof Character ? 'Wave' : 'Wave', 0.2, { once: true, restart: true });
      audio.babble(sp.id.length * 7, 7, sp.look?.startsWith('f') ? 1.4 : 0.9);
    }
    G.emit('npcTalk', { id: sp.id, role: sp.role, npc: sp });
  },

  update(dt) {
    const p = G.player;
    for (const n of this.list) {
      if (!n.anim) continue;
      n.anim.update(dt);
      if (n.talkT > 0) n.talkT -= dt;
      // yakındaki oyuncuya dön
      let yaw = n.baseYaw;
      if (p && p.pos.distanceTo(n.pos) < 6) yaw = Math.atan2(p.pos.x - n.pos.x, p.pos.z - n.pos.z);
      n.root.rotation.y = dampAngle(n.root.rotation.y, yaw, 4, dt);
      const cur = n.anim.current;
      if (cur && cur.loop === THREE.LoopOnce && !cur.isRunning()) n.anim.play('Idle', 0.3);
    }
  },
};
