import * as THREE from 'three';
import { G } from './ctx.js';
import { input, keyLabel } from '../core/input.js';

// Etkileşim sistemi: sağlayıcılar aday listesi üretir; en uygun aday ekranda gösterilir.
const providers = new Set();
const _v = new THREE.Vector3();

export const interact = {
  current: null,
  holdT: 0,
  locks: new Map(), // co-op: etkileşim noktası kilidi (id -> oyuncuId)

  addProvider(fn) { providers.add(fn); return () => providers.delete(fn); },

  isLocked(id) {
    const o = this.locks.get(id);
    return o && o !== G.myId;
  },

  update(dt) {
    const p = G.player;
    if (!p || p.dead || p.downed || G.uiOpen) { this.current = null; this.holdT = 0; this._armed = false; G.emit('prompt', null); return; }
    const cands = [];
    const ctx = { player: p, pos: p.pos, mode: p.mode };
    for (const fn of providers) {
      try { fn(ctx, cands); } catch (e) { console.error(e); }
    }
    // en yakın / en öncelikli
    let best = null, bestScore = -Infinity;
    const fwd = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
    for (const c of cands) {
      if (c.lockId && this.isLocked(c.lockId)) { c.disabled = true; c.label += ' (kullanımda)'; }
      let d = c.dist;
      if (d === undefined) {
        d = _v.copy(c.pos).sub(p.pos).setY(0).length();
        if (c.radius && d > c.radius) continue;
        const dir = _v.normalize();
        d -= dir.dot(fwd) * 0.35;
      }
      const score = (c.priority || 0) * 10 - d;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best && this.current && best.id === this.current.id) best = Object.assign(this.current, best);
    else { this.holdT = 0; this._armed = false; } // aday değişti: basılı tutulan E yeni hedefi istemsiz tetiklemez
    this.current = best;
    if (best && !best.disabled) {
      if (best.holdAction) {
        // kısa bas: action, basılı tut: holdAction
        if (input.isDown('etkilesim')) {
          if (!this._armed && input.pressed('etkilesim')) this._armed = true;
          if (this._armed) {
            this.holdT += dt;
            if (this.holdT >= best.hold) { this._armed = false; this.holdT = 0; input.consume('etkilesim'); best.holdAction(p); }
          }
        } else {
          if (this._armed && this.holdT < 0.35) best.action(p);
          this._armed = false;
          this.holdT = 0;
        }
      } else if (best.hold) {
        if (input.isDown('etkilesim')) {
          this.holdT += dt;
          if (this.holdT >= best.hold) { this.holdT = 0; best.action(p); }
        } else this.holdT = 0;
      } else if (input.pressed('etkilesim')) {
        input.consume('etkilesim');
        best.action(p);
      }
    }
    G.emit('prompt', best ? { key: keyLabel(input.bindings.etkilesim), label: best.label, hold: best.hold && this.holdT > 0.2 ? this.holdT / best.hold : null, disabled: best.disabled, sub: best.sub } : null);
  },
};
