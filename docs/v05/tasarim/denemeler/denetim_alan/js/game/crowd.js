import { G } from './ctx.js';
import { enemies } from './enemies.js';
import { animals } from '../wildlife/animals.js';
import { npcs } from './npcs.js';
import { bodies } from '../world/bodies.js';

// Karakterlerin (oyuncu, NPC, düşman, hayvan) üst üste binmesini engelleyen itişme sistemi.
// Kütle oranına göre itilir; NPC'ler ve diğer oyuncular yerel oyuncu için sabit engeldir.
const MASS = { boar: 1.6, croc: 4, monkey: 0.6, crab: 0.3, frog: 0.2, snake: 0.4 };

export const crowd = {
  name: 'crowd',
  update(dt) {
    const p = G.player;
    if (!p) return;
    const agents = [];
    if (p.mode === 'ground' || p.mode === 'swim') agents.push({ pos: p.pos, r: 0.36, m: 1, dyn: true, y: p.pos.y });
    for (const [, r] of G.remotes) agents.push({ pos: r.pos, r: 0.36, m: Infinity, dyn: false, y: r.pos.y });
    for (const n of npcs.list) if (n.root) agents.push({ pos: n.pos, r: 0.38, m: Infinity, dyn: false, y: n.pos.y });
    const local = !G.online || G.isHost;
    for (const e of enemies.list) if (e.alive && !e.T.ghost) agents.push({ pos: e.pos, r: e.radius, m: e.T.boss ? 3 : 1.2, dyn: local, y: e.pos.y });
    for (const a of animals.list) if (a.alive && !a.S.fly && a.kind !== 'snake') agents.push({ pos: a.pos, r: a.radius, m: MASS[a.kind] || 1, dyn: local, y: a.pos.y });
    const n = agents.length;
    for (let i = 0; i < n; i++) {
      const a = agents[i];
      for (let j = i + 1; j < n; j++) {
        const b = agents[j];
        if (!a.dyn && !b.dyn) continue;
        const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z;
        if (Math.abs(dx) > 3 || Math.abs(dz) > 3 || Math.abs(a.y - b.y) > 1.8) continue;
        const d = Math.hypot(dx, dz), m = a.r + b.r;
        if (d >= m) continue;
        const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
        const pen = m - d;
        const ia = a.dyn ? 1 / a.m : 0, ib = b.dyn ? 1 / b.m : 0;
        const s = ia + ib;
        if (s <= 0) continue;
        a.pos.x += nx * pen * (ia / s); a.pos.z += nz * pen * (ia / s);
        b.pos.x -= nx * pen * (ib / s); b.pos.z -= nz * pen * (ib / s);
      }
    }
    // oyuncu serbest cisimleri (sandık, varil) iter
    if (p.mode === 'ground') bodies.push(p.pos.x, p.pos.z, p.pos.y, 0.36, p.vel.x, p.vel.z);
    for (const e of enemies.list) if (e.alive && local) bodies.push(e.pos.x, e.pos.z, e.pos.y, e.radius, 0, 0);
  },
};
