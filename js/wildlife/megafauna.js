import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { G } from '../game/ctx.js';
import { ocean } from '../world/ocean.js';
import { terrain } from '../world/terrain.js';
import { sky } from '../world/sky.js';
import { regionAt, WORLD_HALF } from '../world/archipelago.js';
import { effects } from '../game/effects.js';
import { combat } from '../game/combat.js';
import { audio } from '../core/audio.js';
import { tpCamera } from '../player/camera.js';
import { clamp, damp, dampAngle, lerp, wrapAngle } from '../core/util.js';

// Deniz devleri: kambur balinalar (yavrusuyla), orka sürüleri, yunus sürüleri ve
// Hayalet Denizleri'nin ışıldayan hayalet balinası. Oyuncuların çevresinde bölgeye göre
// doğar, uzaklaşınca kaybolur. Çevrimiçi oyunda ev sahibi yönetir, misafirler anlık görüntü alır.

export const MARINE = {
  balina: { name: 'Kambur Balina', desc: 'On dört metrelik nazik dev. Nefes alırken gökyüzüne su püskürtür, kuyruğunu kaldırıp dalar, bazen sudan tamamen fırlar.' },
  orka: { name: 'Orka (Katil Balina)', desc: 'Soğuk sularda sürüyle avlanır. Gemilere meraklıdır, başını sudan çıkarıp izler; ama suda yüzene acımaz.' },
  dolphin: { name: 'Yunus', desc: 'Ilık sularda sürüyle dolaşır; hızlı giden gemilerin pruvasında sıçrayarak oynamayı sever.' },
  hayalet_balina: { name: 'Hayalet Balina', desc: 'Hayalet Denizleri\'nin sisli gecelerinde ışıldayarak süzülen, yaşayan mı ölü mü bilinmeyen balina.' },
  shark: { name: 'Kaplan Köpekbalığı', desc: 'Derin sularda dolaşır; yüzenlerin etrafında daireler çizip saldırır.' },
  manta: { name: 'Manta Vatozu', desc: 'Mercan sığlıklarında kanat çırpar gibi süzülen dev vatoz.' },
  turtle: { name: 'Deniz Kaplumbağası', desc: 'Sığ sularda ağır ağır yüzen, yüz yıl yaşayabilen kaplumbağa.' },
};

// Bölge başına hedef grup sayısı
const POP = {
  merkez: { balina: 1, dolphin: 2 },
  tropik: { balina: 2, dolphin: 2 },
  buzul: { balina: 2, orka: 1 },
  volkan: { dolphin: 1 },
  col: { balina: 1, orka: 1, dolphin: 1 },
  hayalet: { orka: 1, hayalet_balina: 1 },
};
const KINDS = ['balina', 'orka', 'dolphin', 'hayalet_balina'];

// ---------------------------------------------------------------------------
// Prosedürel gövde: dönel profil + yüzgeçler, köşe renkleriyle boyanmış tek geometri
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function plate(outline, thick) {
  const sh = new THREE.Shape();
  sh.moveTo(outline[0][0], outline[0][1]);
  sh.splineThru(outline.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.5, bevelSize: thick * 0.55, bevelSegments: 2, curveSegments: 28 });
  g.translate(0, 0, -thick / 2);
  g.deleteAttribute('uv');
  g.clearGroups();
  return g;
}

// aynalanmış (indekssiz) geometrinin üçgen yönünü çevir
function flipWinding(g) {
  for (const k of Object.keys(g.attributes)) {
    const a = g.attributes[k], s = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) for (let c = 0; c < s; c++) {
      const t = arr[(i + 1) * s + c]; arr[(i + 1) * s + c] = arr[(i + 2) * s + c]; arr[(i + 2) * s + c] = t;
    }
  }
  return g;
}

const DEF = {
  balina: {
    L: 13.5, R: 1.5, wf: 1, top: 0.95, bot: 0.92, rings: 54, seg: 26,
    prof: [[0, 0.06], [0.07, 0.12], [0.18, 0.3], [0.33, 0.6], [0.5, 0.88], [0.62, 1], [0.74, 0.97], [0.85, 0.82], [0.93, 0.58], [0.975, 0.32], [1, 0.04]],
    camber: (t) => 0.06 * Math.sin(Math.PI * t) - 0.05 * sstep(0.85, 1, t),
    pect: { o: [[0, 0.5], [0.12, 0.56], [0.26, 0.5], [0.4, 0.47], [0.55, 0.38], [0.7, 0.3], [0.85, 0.17], [1, 0], [0.9, -0.1], [0.66, -0.12], [0.42, -0.2], [0.2, -0.33], [0, -0.45]], span: 4.1, chord: 0.95, thick: 0.13, t: 0.68, droop: -0.5, sweep: 0.6, ax: 0.72, ay: -0.5 },
    dorsal: { o: [[-0.5, 0], [-0.32, 0.32], [-0.12, 0.72], [0.04, 0.86], [0.2, 0.55], [0.5, 0]], chord: 1.5, h: 0.5, thick: 0.2, t: 0.36 },
    fluke: { o: [[0, 0.3], [0.25, 0.25], [0.55, 0.12], [0.82, -0.08], [1, -0.34], [0.9, -0.38], [0.72, -0.31], [0.52, -0.35], [0.32, -0.29], [0.14, -0.34], [0, -0.22]], span: 2.8, chord: 1.6, thick: 0.13 },
    amp: 0.035, freq: 0.9, rough: 0.5,
    paint(c, x, y, z, ny, t, R) {
      let k = sstep(-0.1, -0.6, ny) * sstep(0.14, 0.36, t);
      k *= 0.72 + 0.28 * Math.sin(x * 6.1 + z * 2.3) * Math.sin(z * 4.7 + x);
      if (ny < -0.45 && t > 0.45) k *= 0.62 + 0.38 * (0.5 + 0.5 * Math.sin((x / R) * 26)); // gırtlak kıvrımları
      let r = lerp(0.085, 0.74, k), g = lerp(0.095, 0.76, k), b = lerp(0.115, 0.78, k);
      if (t > 0.83 && ny > 0.35 && hash(Math.floor(x * 3.3), Math.floor(z * 3.3)) > 0.78) { r += 0.12; g += 0.12; b += 0.11; } // baş yumruları
      if (hash(Math.floor(x * 5), Math.floor(z * 5 + y * 3)) > 0.93) { r += 0.15; g += 0.15; b += 0.14; } // midye izleri
      c.setRGB(r, g, b);
    },
    finPaint(c, part, ny) {
      if (part === 'pect') { const k = ny < 0 ? 0.88 : 0.66; c.setRGB(k, k * 1.01, k * 1.03); return; }
      if (part === 'fluke' && ny < 0) { c.setRGB(0.78, 0.79, 0.8); return; }
      c.setRGB(0.09, 0.1, 0.12);
    },
  },
  orka: {
    L: 7, R: 0.8, wf: 1, top: 1, bot: 0.95, rings: 60, seg: 26,
    prof: [[0, 0.06], [0.09, 0.15], [0.24, 0.44], [0.42, 0.84], [0.58, 1], [0.73, 0.96], [0.86, 0.78], [0.94, 0.52], [0.985, 0.25], [1, 0.03]],
    pect: { o: [[0, 0.5], [0.3, 0.62], [0.65, 0.55], [0.92, 0.3], [1, 0], [0.9, -0.25], [0.6, -0.36], [0.3, -0.3], [0, -0.4]], span: 1.15, chord: 0.62, thick: 0.08, t: 0.7, droop: -0.6, sweep: 0.45, ax: 0.68, ay: -0.55 },
    dorsal: { o: [[-0.5, 0], [-0.3, 0.3], [-0.14, 0.75], [-0.07, 1], [0.05, 0.97], [0.17, 0.6], [0.32, 0.25], [0.5, 0]], chord: 1.05, h: 1.55, thick: 0.09, t: 0.55 },
    fluke: { o: [[0, 0.3], [0.3, 0.24], [0.62, 0.08], [0.88, -0.14], [1, -0.32], [0.86, -0.36], [0.6, -0.3], [0.3, -0.32], [0, -0.2]], span: 0.95, chord: 0.7, thick: 0.07 },
    amp: 0.05, freq: 2.2, rough: 0.28,
    paint(c, x, y, z, ny, t, R) {
      const ang = Math.atan2(y, Math.abs(x) + 1e-4); // 0 yan, +π/2 sırt
      let w = 0;
      if (ny < -0.3 && t > 0.3 && t < 0.975) w = 1; // karın
      if (t > 0.2 && t < 0.44 && ang < -0.05 + 0.5 * sstep(0.2, 0.32, t) * sstep(0.44, 0.34, t)) w = 1; // yan yama
      const e = Math.exp(-(((t - 0.855) / 0.045) ** 2) - (((ang - 0.42) / 0.26) ** 2)); // göz lekesi
      if (e > 0.45) w = 1;
      if (w) { c.setRGB(0.93, 0.94, 0.95); return; }
      const sad = t > 0.4 && t < 0.56 && ang > 1.05 ? 0.42 : 0; // eyer lekesi
      if (sad) { c.setRGB(0.46, 0.48, 0.52); return; }
      c.setRGB(0.035, 0.038, 0.045);
    },
    finPaint(c, part, ny) {
      if (part === 'fluke' && ny < 0) { c.setRGB(0.9, 0.91, 0.92); return; }
      c.setRGB(0.035, 0.038, 0.045);
    },
  },
  dolphin: {
    L: 2.5, R: 0.28, wf: 0.92, top: 1, bot: 0.92, rings: 44, seg: 20,
    prof: [[0, 0.06], [0.1, 0.15], [0.28, 0.5], [0.45, 0.88], [0.58, 1], [0.72, 0.9], [0.83, 0.66], [0.885, 0.42], [0.915, 0.24], [0.96, 0.17], [1, 0.05]],
    pect: { o: [[0, 0.5], [0.4, 0.46], [0.8, 0.16], [1, -0.15], [0.7, -0.26], [0.3, -0.3], [0, -0.45]], span: 0.42, chord: 0.24, thick: 0.03, t: 0.68, droop: -0.55, sweep: 0.7, ax: 0.7, ay: -0.5 },
    dorsal: { o: [[0.5, 0], [0.25, 0.4], [0, 0.78], [-0.34, 1], [-0.3, 0.84], [-0.24, 0.5], [-0.5, 0]], chord: 0.42, h: 0.32, thick: 0.035, t: 0.55 },
    fluke: { o: [[0, 0.3], [0.3, 0.24], [0.62, 0.06], [0.9, -0.18], [1, -0.34], [0.84, -0.36], [0.55, -0.28], [0.25, -0.3], [0, -0.2]], span: 0.36, chord: 0.27, thick: 0.03 },
    amp: 0.06, freq: 5.5, rough: 0.3,
    paint(c, x, y, z, ny, t) {
      const k = sstep(0.35, -0.5, ny);
      const top = [0.27, 0.33, 0.4], side = [0.55, 0.6, 0.66], bel = [0.88, 0.89, 0.9];
      const a = k < 0.5 ? k * 2 : (k - 0.5) * 2;
      const A = k < 0.5 ? top : side, B = k < 0.5 ? side : bel;
      c.setRGB(lerp(A[0], B[0], a), lerp(A[1], B[1], a), lerp(A[2], B[2], a));
      if (t > 0.9 && ny < 0.2) c.multiplyScalar(1.05);
    },
    finPaint(c) { c.setRGB(0.27, 0.33, 0.4); },
  },
};
DEF.hayalet_balina = DEF.balina;

const GEO = {};
function cetaceanGeometry(kind) {
  if (kind === 'hayalet_balina') kind = 'balina';
  if (GEO[kind]) return GEO[kind];
  const D = DEF[kind];
  const pts = new THREE.SplineCurve(D.prof.map(([a, b]) => new THREE.Vector2(a, b))).getPoints(D.rings);
  const rAt = (t) => { let best = pts[0]; for (const p of pts) if (Math.abs(p.x - t) < Math.abs(best.x - t)) best = p; return Math.max(best.y, 0.004) * D.R; };
  const cam = (t) => (D.camber ? D.camber(t) : 0) * D.R;
  // gövde
  const pos = [], idx = [], seg = D.seg;
  for (const q of pts) {
    const t = clamp(q.x, 0, 1), r = Math.max(q.y, 0.004) * D.R, z = (t - 0.5) * D.L;
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2, s = Math.sin(th);
      pos.push(Math.cos(th) * r * D.wf, s * r * (s > 0 ? D.top : D.bot) + cam(t), z);
    }
  }
  const nR = pts.length;
  for (let i = 0; i < nR - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg;
    idx.push(a, b, a + seg, b, b + seg, a + seg);
  }
  const nose = pos.length / 3; pos.push(0, cam(1), D.L / 2 + 0.006 * D.L);
  const tail = nose + 1; pos.push(0, cam(0), -D.L / 2);
  const last = (nR - 1) * seg;
  for (let j = 0; j < seg; j++) { idx.push(last + j, last + (j + 1) % seg, nose); idx.push((j + 1) % seg, j, tail); }
  let body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setIndex(idx);
  body.computeVertexNormals();
  body = body.toNonIndexed();
  const paint = (g, fn) => {
    const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      fn(c, p.getX(i), p.getY(i), p.getZ(i), n.getY(i), p.getZ(i) / D.L + 0.5);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  };
  paint(body, (c, x, y, z, ny, t) => D.paint(c, x, y, z, ny, t, D.R));
  const parts = [body];
  const M = new THREE.Matrix4();
  // göğüs yüzgeçleri (sağ + aynası)
  {
    const P = D.pect, zt = (P.t - 0.5) * D.L, rr = rAt(P.t);
    const g = plate(P.o.map(([a, b]) => [a * P.span, b * P.chord]), P.thick);
    g.rotateX(Math.PI / 2); g.rotateY(P.sweep); g.rotateZ(P.droop);
    g.translate(rr * P.ax * D.wf, rr * P.ay + cam(P.t), zt);
    paint(g, (c, x, y, z, ny) => D.finPaint(c, 'pect', ny));
    const l = g.clone().applyMatrix4(M.makeScale(-1, 1, 1));
    flipWinding(l);
    parts.push(g, l);
  }
  // sırt yüzgeci
  {
    const P = D.dorsal, rr = rAt(P.t);
    const g = plate(P.o.map(([a, b]) => [a * P.chord, b * P.h]), P.thick);
    g.rotateY(-Math.PI / 2);
    g.translate(0, rr * D.top * 0.9 + cam(P.t), (P.t - 0.5) * D.L);
    paint(g, (c, x, y, z, ny) => D.finPaint(c, 'dorsal', ny));
    parts.push(g);
  }
  // kuyruk yüzgeci (iki lob, ortada çentik)
  {
    const P = D.fluke, half = P.o;
    const full = half.concat(half.slice(1, -1).reverse().map(([a, b]) => [-a, b]));
    const g = plate(full.map(([a, b]) => [a * P.span, b * P.chord]), P.thick);
    g.rotateX(Math.PI / 2);
    g.translate(0, cam(0), -D.L / 2 + 0.02 * D.L);
    paint(g, (c, x, y, z, ny) => D.finPaint(c, 'fluke', ny));
    parts.push(g);
  }
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  const geo = mergeGeometries(parts, false);
  geo.computeBoundingSphere();
  GEO[kind] = geo;
  return geo;
}

// Yüzme dalgası: gövdenin arka yarısı ve kuyruk yüzgeci dikey salınır, göğüs yüzgeçleri yavaşça çırpar
function cetaceanMaterial(kind) {
  const D = DEF[kind];
  const ghost = kind === 'hayalet_balina';
  const m = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: D.rough, metalness: 0,
    ...(ghost ? { color: 0x9fe8ff, emissive: 0x2cc8ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.5, depthWrite: false } : {}),
  });
  const u = { uTime: { value: Math.random() * 10 }, uAmp: { value: D.amp }, uFreq: { value: D.freq }, uLen: { value: D.L }, uBodyR: { value: D.R } };
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime, uAmp, uFreq, uLen, uBodyR;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float zz = position.z / uLen;
        float kk = clamp(0.12 - zz, 0.0, 0.75) / 0.62;
        transformed.y += sin(uTime * uFreq - zz * 5.5) * uAmp * uLen * kk * kk;
        float side = max(abs(position.x) - uBodyR * 0.85, 0.0) * step(-0.1, zz);
        transformed.y += sin(uTime * uFreq * 0.45 + 1.3) * side * 0.22;`);
  };
  m.customProgramCacheKey = () => 'cetacean' + (ghost ? 'g' : '');
  return m;
}

// ---------------------------------------------------------------------------
let _nid = 0;
const _f = new THREE.Vector3();

function makeBody(scene, kind, scale = 1) {
  const mesh = new THREE.Mesh(cetaceanGeometry(kind), cetaceanMaterial(kind));
  mesh.frustumCulled = true;
  const root = new THREE.Group();
  root.rotation.order = 'YXZ';
  root.add(mesh);
  root.scale.setScalar(scale);
  scene.add(root);
  return { root, mesh, mat: mesh.material };
}

export const megafauna = {
  name: 'megafauna',
  groups: [],
  ents: [],

  init(scene) {
    this.scene = scene;
    // geometrileri önceden hazırla (ilk karşılaşmada takılma olmasın)
    for (const k of ['balina', 'orka', 'dolphin']) cetaceanGeometry(k);
  },
  start() { this.clear(); this.checkT = 2; },
  stop() { this.clear(); },
  clear() {
    for (const e of this.ents) this._dispose(e);
    this.ents = []; this.groups = [];
  },

  _dispose(e) {
    this.scene.remove(e.root);
    e.mat.dispose();
    if (e.target) combat.removeTarget(e.target);
  },

  _players() {
    const out = [];
    if (G.player) out.push({ p: G.player, id: G.myId });
    for (const [id, r] of G.remotes) if (r && r.pos) out.push({ p: r, id });
    return out;
  },

  // ---- doğurma -----------------------------------------------------------
  _spawnCheck() {
    for (const { p } of this._players()) {
      const reg = regionAt(p.pos.x, p.pos.z);
      const pop = POP[reg] || {};
      for (const kind of KINDS) {
        let want = pop[kind] || 0;
        if (kind === 'hayalet_balina' && !(sky.isNight() || sky.weatherKey === 'sisli')) want = 0;
        if (!want) continue;
        const have = this.groups.filter((g) => g.kind === kind && Math.hypot(g.x - p.pos.x, g.z - p.pos.z) < 900).length;
        if (have < want && Math.random() < 0.3) this._spawnGroup(kind, p.pos);
      }
    }
  },

  _spawnGroup(kind, near) {
    const deep = kind === 'balina' || kind === 'hayalet_balina' ? -24 : -12;
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2, d = 170 + Math.random() * 200;
      const x = near.x + Math.cos(a) * d, z = near.z + Math.sin(a) * d;
      if (Math.abs(x) > WORLD_HALF - 400 || Math.abs(z) > WORLD_HALF - 400) continue;
      if (terrain.heightAt(x, z) > deep) continue;
      // oyuncunun yakınından geçecek bir rota
      const toP = Math.atan2(near.x - x, near.z - z);
      const g = { id: 'mg' + (_nid++), kind, x, z, yaw: toP + (Math.random() - 0.5) * 1.4, speed: 0, mode: 'travel', t: 0, modeT: 0, members: [], bowCd: 0, notified: false };
      if (kind === 'balina' || kind === 'hayalet_balina') {
        g.members.push(this._makeEnt(kind, g, 1, 0, 0));
        if (kind === 'balina' && Math.random() < 0.35) g.members.push(this._makeEnt(kind, g, 0.42, 5.5, -3, true));
      } else {
        const n = kind === 'orka' ? 3 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
          const sc = kind === 'orka' ? (i === 0 ? 1.12 : 0.8 + Math.random() * 0.2) : 0.85 + Math.random() * 0.3;
          const side = (i % 2 ? 1 : -1) * (1.5 + Math.ceil(i / 2) * (kind === 'orka' ? 3 : 1.6));
          g.members.push(this._makeEnt(kind, g, sc, i ? side : 0, -i * (kind === 'orka' ? 3.5 : 1.8) - Math.random() * 2));
        }
      }
      this.groups.push(g);
      return g;
    }
    return null;
  },

  _makeEnt(kind, g, scale, ox, oz, calf = false, id = null) {
    const b = makeBody(this.scene, kind, scale);
    const D = DEF[kind];
    const e = {
      id: id || 'me' + (_nid++), kind, g, scale, ox, oz, calf, ...b,
      pos: new THREE.Vector3(g ? g.x + ox : 0, -6, g ? g.z + oz : 0), yaw: g ? g.yaw : 0, pitch: 0, roll: 0, vy: 0,
      phase: Math.random() * Math.PI * 2, mode: 'swim', modeT: 0, blowT: 3 + Math.random() * 6, blowN: 0, splashN: 0, alive: true,
      len: D.L * scale, rad: D.R * scale, swim: 0.5, cd: 0, prevY: -6,
    };
    if (kind === 'orka') {
      e.target = combat.addTarget({
        pos: new THREE.Vector3(), radius: 1.1 * scale, height: 1.7 * scale, alive: true, big: true, hp: 280, maxHp: 280, bloodColor: [0.55, 0.05, 0.06],
        hurt: (dmg, info) => this._hurtOrca(e, dmg, info),
      });
    }
    this.ents.push(e);
    return e;
  },

  _hurtOrca(e, dmg, info = {}) {
    const T = e.target;
    if (!T.alive) return;
    if (G.online && !G.isHost) { G.emit('netHurtMarine', { id: e.id, dmg }); return; }
    this.applyDamage(e, dmg, info);
  },
  applyDamage(e, dmg, info = {}) {
    const T = e.target;
    if (!T || !T.alive) return;
    T.hp -= dmg;
    effects.blood(T.pos.x, T.pos.y + 0.8, T.pos.z, [0.55, 0.05, 0.06]);
    const g = e.g;
    if (T.hp <= 0) {
      T.alive = false; e.alive = false; e.mode = 'sink'; e.modeT = 0;
      G.notify('Orka ağır yaralandı; sürü öfkeyle uzaklaşıyor.', 'warn', 3000);
      if (g) { g.mode = 'flee'; g.modeT = 0; }
      return;
    }
    // suda vurulursa saldırgana döner, değilse kaçar
    const att = info.attacker || G.player;
    if (g) {
      if (att && att.mode === 'swim') { g.mode = 'hunt'; g.huntId = info.by || G.myId; g.modeT = 0; }
      else { g.mode = 'flee'; g.modeT = 0; }
    }
  },

  // ---- güncelleme ----------------------------------------------------------
  update(dt) {
    if (!G.player) return;
    const host = !G.online || G.isHost;
    if (host) {
      this.checkT -= dt;
      if (this.checkT <= 0) {
        this.checkT = 3;
        this._spawnCheck();
        // uzaklaşan grupları kaldır
        const pl = this._players();
        for (const g of this.groups) {
          let d = 1e9;
          for (const { p } of pl) d = Math.min(d, Math.hypot(g.x - p.pos.x, g.z - p.pos.z));
          const ghostGone = g.kind === 'hayalet_balina' && !(sky.isNight() || sky.weatherKey === 'sisli');
          if (d > 820 || ghostGone && d > 200) g.remove = true;
        }
        if (this.groups.some((g) => g.remove)) {
          for (const g of this.groups.filter((x) => x.remove)) for (const e of g.members) { this._dispose(e); e.removed = true; }
          this.groups = this.groups.filter((g) => !g.remove);
          this.ents = this.ents.filter((e) => !e.removed);
        }
      }
      for (const g of this.groups) this._updateGroup(g, dt);
    } else {
      for (const e of this.ents) this._interp(e, dt);
    }
    // görsel güncelleme (herkes)
    const lp = G.player.pos;
    for (const e of this.ents) {
      e.root.position.copy(e.pos);
      e.root.rotation.set(e.pitch, e.yaw, e.roll);
      e.mat.userData.u.uTime.value += dt * (0.6 + e.swim);
      const dd = e.pos.distanceTo(lp);
      e.root.visible = dd < 700 && !(e.mode === 'sink' && e.modeT > 25);
      if (e.kind === 'hayalet_balina') e.mat.opacity = 0.42 + Math.sin(e.mat.userData.u.uTime.value * 0.7) * 0.12;
      if (e.target) { e.target.pos.set(e.pos.x, e.pos.y - 0.85 * e.scale, e.pos.z); }
      // gözlem kaydı (günlük)
      if (dd < (e.kind === 'balina' || e.kind === 'hayalet_balina' ? 110 : 60) && e.pos.y > -6) G.emit('seeAnimal', e.kind);
    }
  },

  _surfaceY(x, z) { return ocean.heightAt(x, z); },

  // derinlik ve kara kontrolü: önü sığsa daha derin yöne dön
  _steer(g, dt, look = 45, minDepth = -14) {
    _f.set(Math.sin(g.yaw), 0, Math.cos(g.yaw));
    const ahead = terrain.heightAt(g.x + _f.x * look, g.z + _f.z * look);
    const edge = Math.max(Math.abs(g.x), Math.abs(g.z)) > WORLD_HALF - 500;
    if (ahead > minDepth || edge) {
      let best = g.yaw, bd = 1e9;
      for (let i = 1; i <= 8; i++) {
        const a = g.yaw + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.55;
        let h = terrain.heightAt(g.x + Math.sin(a) * look * 1.4, g.z + Math.cos(a) * look * 1.4);
        if (edge) h += Math.hypot(g.x + Math.sin(a) * 50, g.z + Math.cos(a) * 50) * 0.01;
        if (h < bd) { bd = h; best = a; }
      }
      g.yaw = dampAngle(g.yaw, best, 1.2, dt);
      return true;
    }
    return false;
  },

  _updateGroup(g, dt) {
    g.t += dt; g.modeT += dt;
    if (g.kind === 'balina' || g.kind === 'hayalet_balina') this._whale(g, dt);
    else this._pod(g, dt);
  },

  // ---- balina: yüzeyde nefes, kuyruk kaldırarak dalış, derinde yüzüş, ara sıra sıçrama ----
  _whale(g, dt) {
    const ghost = g.kind === 'hayalet_balina';
    const W = g.members[0];
    if (!W) return;
    // rota: yavaş dönüşler + kıyıdan kaçınma + gemiden sakınma
    if (!this._steer(g, dt, 60, ghost ? -10 : -18)) g.yaw += Math.sin(g.t * 0.05 + W.phase) * 0.04 * dt;
    for (const s of G.ships) {
      if (s.sunk || ghost) continue;
      const dx = s.x - g.x, dz = s.z - g.z, d = Math.hypot(dx, dz);
      if (d < 32 && W.pos.y > -8) g.yaw = dampAngle(g.yaw, Math.atan2(-dx, -dz), 0.8, dt);
    }
    const spd = ghost ? 1.8 : W.mode === 'deep' ? 3.2 : W.mode === 'breach' || W.mode === 'fall' ? 4.5 : 2.3;
    g.speed = damp(g.speed, spd, 0.8, dt);
    g.x += Math.sin(g.yaw) * g.speed * dt; g.z += Math.cos(g.yaw) * g.speed * dt;
    const sy = this._surfaceY(g.x, g.z), floor = terrain.heightAt(g.x, g.z);
    W.modeT += dt;
    const R = W.rad;
    let ty = sy - R * 0.42, tp = 0, tr = 0;
    if (ghost) {
      ty = sy - R * 0.05 + Math.sin(g.t * 0.4) * 0.4; tp = Math.sin(g.t * 0.4) * 0.05;
      if (Math.random() < dt * 6) { // ışıldayan iz
        const k = Math.random() - 0.5;
        effects.spawn(W.pos.x - Math.sin(g.yaw) * k * W.len, W.pos.y + R * 0.6, W.pos.z - Math.cos(g.yaw) * k * W.len, (Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4, 2.5, 0.35, 0.45, 0.9, 1, 0.05, 0.3, 0.1);
      }
      if (Math.random() < dt * 0.03) audio.tone(260, 3, 'sine', 0.05, W.pos, 0.45);
      if (!g.notified && G.player && W.pos.distanceTo(G.player.pos) < 90) { g.notified = true; G.notify('Sisin içinden ışıldayan bir balina süzülüyor…', 'info', 4000); }
    } else switch (W.mode) {
      case 'swim':
        W.blowT -= dt;
        if (W.blowT <= 0) { W.blowT = 7 + Math.random() * 5; this._blow(W); }
        tp = Math.sin(g.t * 0.35) * 0.04;
        W.surfFor ??= 22 + Math.random() * 14;
        if (W.modeT > W.surfFor) { W.mode = 'dive'; W.modeT = 0; W.surfFor = null; }
        break;
      case 'dive': // sırtını kamburlaştırır, kuyruğunu havaya kaldırıp dikine dalar
        tp = sstep(0, 3, W.modeT) * 1.15;
        ty = sy - R * 0.5 - Math.max(0, W.modeT - 2.6) * 3;
        if (W.modeT > 6.5) { W.mode = 'deep'; W.modeT = 0; W.deepFor = 30 + Math.random() * 30; }
        break;
      case 'deep':
        ty = Math.max(floor + R * 1.6, sy - 22); tp = 0;
        if (W.modeT > W.deepFor) {
          const near = this._players().some(({ p }) => W.pos.distanceTo(p.pos) < 160);
          W.mode = near && Math.random() < 0.3 && floor < -20 ? 'breach' : 'rise'; W.modeT = 0; W.vy = 0;
        }
        break;
      case 'rise':
        tp = -0.18; ty = sy - R * 0.42;
        if (Math.abs(W.pos.y - ty) < 0.6) { W.mode = 'swim'; W.modeT = 0; W.blowT = 0.4; }
        break;
      case 'breach': // derinden hızlanıp sudan fırlar
        W.vy = Math.min(W.vy + 7 * dt, 10.5);
        W.pos.y += W.vy * dt;
        W.pitch = damp(W.pitch, -1.25, 2, dt);
        if (W.pos.y > sy + R * 0.6) { W.mode = 'fall'; W.modeT = 0; W.rollDir = Math.random() < 0.5 ? -1 : 1; }
        break;
      case 'fall':
        W.vy -= 9.8 * dt;
        W.pos.y += W.vy * dt;
        W.pitch = damp(W.pitch, 0.1, 1.2, dt);
        W.roll = damp(W.roll, W.rollDir * 1.45, 1.4, dt);
        if (W.pos.y < sy - R * 0.4 && W.vy < 0) {
          this._crash(W);
          W.mode = 'deep'; W.modeT = 0; W.deepFor = 12; W.vy = 0;
        }
        break;
    }
    if (W.mode !== 'breach' && W.mode !== 'fall') {
      W.pos.y = damp(W.pos.y, Math.max(ty, floor + R * 1.2), W.mode === 'dive' ? 3 : 0.6, dt);
      W.pitch = dampAngle(W.pitch, tp, 1.5, dt);
      W.roll = damp(W.roll, tr, 0.8, dt);
    }
    W.pos.x = g.x; W.pos.z = g.z;
    W.yaw = dampAngle(W.yaw, g.yaw, 2, dt);
    W.swim = W.mode === 'breach' ? 2.5 : W.mode === 'deep' ? 0.9 : 0.5;
    // yavru: annesinin yanında, onunla birlikte yüzeye çıkar
    const C = g.members[1];
    if (C) {
      const px = Math.cos(g.yaw), pz = -Math.sin(g.yaw);
      const cx = g.x + px * C.ox + Math.sin(g.yaw) * C.oz, cz = g.z + pz * C.ox + Math.cos(g.yaw) * C.oz;
      C.pos.x = damp(C.pos.x, cx, 2, dt); C.pos.z = damp(C.pos.z, cz, 2, dt);
      const csy = this._surfaceY(C.pos.x, C.pos.z);
      const cdeep = W.mode === 'deep' || W.mode === 'dive' && W.modeT > 3;
      const cty = cdeep ? Math.max(terrain.heightAt(C.pos.x, C.pos.z) + 2, csy - 12) : csy - C.rad * 0.55;
      C.pos.y = damp(C.pos.y, cty, 0.9, dt);
      C.yaw = dampAngle(C.yaw, g.yaw + Math.sin(g.t * 0.3) * 0.1, 2, dt);
      C.pitch = dampAngle(C.pitch, W.mode === 'dive' ? 0.5 : W.mode === 'rise' ? -0.2 : 0, 1.5, dt);
      C.roll = damp(C.roll, 0, 1, dt);
      C.swim = 0.8;
      C.blowT -= dt;
      if (!cdeep && C.blowT <= 0) { C.blowT = 5 + Math.random() * 4; this._blow(C); }
    }
  },

  // ---- orka ve yunus sürüleri: lider rota çizer, üyeler kavisli sıçrayışlarla izler ----
  _pod(g, dt) {
    const orca = g.kind === 'orka';
    const pl = this._players();
    g.bowCd -= dt;
    // durum seçimi
    if (g.mode === 'travel' || g.mode === 'bow') {
      if (orca) {
        for (const { p, id } of pl) {
          if (p.dead || p.mode !== 'swim') continue;
          if (Math.hypot(p.pos.x - g.x, p.pos.z - g.z) < 70) {
            g.mode = 'hunt'; g.huntId = id; g.modeT = 0;
            if (id === G.myId) { G.notify('Suda siyah yüzgeçler… ORKALAR seni avlıyor! Hemen sudan çık!', 'boss', 4000); audio.tone(140, 1.4, 'sine', 0.12, null, 0.6); }
            break;
          }
        }
      }
      // yunuslar (ve meraklı orkalar) hızlı giden gemilerin pruvasına gelir
      if (g.mode === 'travel' && g.bowCd <= 0) {
        for (const s of G.ships) {
          if (s.sunk || Math.abs(s.speed || 0) < (orca ? 1.5 : 3)) continue;
          if (Math.hypot(s.x - g.x, s.z - g.z) < 110) { g.mode = 'bow'; g.ship = s; g.modeT = 0; break; }
        }
      }
    }
    let tx = null, tz = null, spd = orca ? 4.2 : 5.5;
    if (g.mode === 'travel') {
      if (!this._steer(g, dt, 40, -10)) g.yaw += Math.sin(g.t * 0.11 + g.members[0].phase) * 0.12 * dt;
    } else if (g.mode === 'bow') {
      const s = g.ship;
      if (!s || s.sunk || g.modeT > (orca ? 25 : 70) || Math.abs(s.speed || 0) < (orca ? 0.8 : 2) || Math.hypot(s.x - g.x, s.z - g.z) > 160) {
        g.mode = 'travel'; g.bowCd = 90; g.ship = null;
      } else {
        // pruva (yunus) ya da borda (orka) noktasında, geminin hızına kilitlenmiş yüzüş
        const hx = Math.sin(s.yaw), hz = Math.cos(s.yaw), px = Math.cos(s.yaw), pz = -Math.sin(s.yaw);
        const off = orca ? -s.T.L * 0.2 : s.T.L / 2 + 5, side = orca ? s.T.B / 2 + 9 : 0;
        const dx = g.x - s.x, dz = g.z - s.z;
        const along = dx * hx + dz * hz - off, lat = dx * px + dz * pz - side;
        if (Math.hypot(along, lat) > 25) { tx = s.x + hx * off + px * side; tz = s.z + hz * off + pz * side; spd = Math.abs(s.speed) + 4; }
        else { g.yaw = dampAngle(g.yaw, s.yaw - clamp(lat * 0.08, -0.5, 0.5), 3, dt); spd = clamp(Math.abs(s.speed) - along * 0.9, 0, Math.abs(s.speed) + 5); }
        if (!g.notified && G.ship === s) {
          g.notified = true;
          G.notify(orca ? 'Bir orka sürüsü geminin yanında yüzüyor, başlarını kaldırıp seni izliyorlar.' : 'Yunuslar geminin pruvasında sıçrıyor! Tayfa neşeyle izliyor.', 'good', 4000);
        }
      }
    } else if (g.mode === 'hunt') {
      const tgt = pl.find((x) => x.id === g.huntId);
      if (!tgt || tgt.p.dead || tgt.p.mode !== 'swim' || g.modeT > 60) { g.mode = 'travel'; g.bowCd = 30; }
      else { tx = tgt.p.pos.x; tz = tgt.p.pos.z; spd = 8.5; g.tgt = tgt; }
    } else if (g.mode === 'flee') {
      spd = orca ? 9 : 8;
      if (g.modeT > 18) { g.mode = 'travel'; g.bowCd = 60; }
      const p = G.player;
      if (p) g.yaw = dampAngle(g.yaw, Math.atan2(g.x - p.pos.x, g.z - p.pos.z), 1.5, dt);
      this._steer(g, dt, 40, -8);
    }
    if (tx !== null) g.yaw = dampAngle(g.yaw, Math.atan2(tx - g.x, tz - g.z), g.mode === 'hunt' ? 2.5 : 1.6, dt);
    g.speed = damp(g.speed, spd, g.mode === 'bow' ? 3 : 1.2, dt);
    // av: önce çevrede daire çizerler (uyarı), sonra sırayla tek tek saldırırlar
    g.atkCd = (g.atkCd || 0) - dt;
    if (g.mode === 'hunt' && g.tgt && g.modeT > 5 && g.atkCd <= 0 && (!g.attacker || !g.attacker.alive)) {
      let best = null, bd = 1e9;
      for (const m of g.members) { if (!m.alive || m.cd > 0) continue; const d = m.pos.distanceTo(g.tgt.p.pos); if (d < bd) { bd = d; best = m; } }
      g.attacker = best;
    }
    g.x += Math.sin(g.yaw) * g.speed * dt; g.z += Math.cos(g.yaw) * g.speed * dt;
    // üyeler
    const sx = Math.cos(g.yaw), sz = -Math.sin(g.yaw), fx = Math.sin(g.yaw), fz = Math.cos(g.yaw);
    for (const e of g.members) {
      if (!e.alive) { this._sink(e, dt); continue; }
      const bowK = g.mode === 'bow' && !orca ? 0.45 : 1; // pruvada sıkışık dizilir
      let mx = g.x + sx * e.ox * (bowK < 1 ? 0.8 : 1) + fx * e.oz * bowK, mz = g.z + sz * e.ox * (bowK < 1 ? 0.8 : 1) + fz * e.oz * bowK;
      const hunting = g.mode === 'hunt' && g.tgt;
      if (hunting) {
        // sürü avın çevresinde döner; yalnızca seçilen orka içeri dalar
        const a = e.phase * 0.2 + g.t * 0.45 + g.members.indexOf(e) * 1.4;
        const ring = e === g.attacker ? 0.8 : 11;
        mx = g.tgt.p.pos.x + Math.cos(a) * ring; mz = g.tgt.p.pos.z + Math.sin(a) * ring;
      }
      const dx = mx - e.pos.x, dz = mz - e.pos.z, d = Math.hypot(dx, dz);
      const want = Math.atan2(dx, dz);
      const v = clamp(d * 1.2, 0, g.speed + (hunting ? 4 : 2.5));
      e.yaw = dampAngle(e.yaw, d > 0.5 ? want : g.yaw, 3, dt);
      e.pos.x += Math.sin(e.yaw) * v * dt; e.pos.z += Math.cos(e.yaw) * v * dt;
      e.cd -= dt;
      // dikey: kavisli sıçrayış (yunuslar sudan tamamen çıkar)
      const sy = this._surfaceY(e.pos.x, e.pos.z), floor = terrain.heightAt(e.pos.x, e.pos.z);
      e.phase += dt * (orca ? 0.9 : 1.6) * (0.8 + v / 10);
      const arc = Math.sin(e.phase);
      let ty;
      if (hunting) ty = g.tgt.p.pos.y + 0.3;
      else if (orca) ty = sy - e.rad * 1.3 + arc * e.rad * 1.15;
      else ty = sy - e.rad * 2.2 + Math.max(arc, -0.3) * (g.mode === 'bow' ? 2.0 : 1.6);
      ty = Math.max(ty, floor + e.rad * 2);
      const prevY = e.pos.y;
      e.pos.y = damp(e.pos.y, ty, orca ? 3 : 6, dt);
      const vy = (e.pos.y - prevY) / Math.max(dt, 1e-3);
      e.pitch = dampAngle(e.pitch, clamp(-Math.atan2(vy, Math.max(v, 1)), -0.9, 0.9), 6, dt);
      e.roll = damp(e.roll, 0, 2, dt);
      e.swim = 0.4 + v / 8;
      // yüzeyi kırma: nefes ve sıçrama
      const top = e.pos.y + e.rad;
      if (top > sy && e.prevY + e.rad <= sy && !hunting) { e.blowT = 0; this._blow(e); }
      if (!orca && e.pos.y < sy && e.prevY >= sy && vy < -1) { e.splashN++; effects.splash(e.pos.x, e.pos.z, 0.45); }
      e.prevY = e.pos.y;
      // casusluk (spyhop): gemi yanında bir orka başını sudan çıkarır
      if (orca && g.mode === 'bow' && e === g.members[1] && g.modeT % 12 < 4 && g.modeT > 5) {
        e.pos.y = damp(e.pos.y, sy - e.len * 0.18, 2, dt);
        e.pitch = damp(e.pitch, -1.35, 3, dt);
      }
      // saldırı
      if (hunting && e === g.attacker && e.cd <= 0) {
        const tp = g.tgt.p;
        if (Math.hypot(tp.pos.x - e.pos.x, tp.pos.z - e.pos.z) < 2.6 + e.rad && Math.abs(tp.pos.y - e.pos.y) < 2.5) {
          e.cd = 8 + Math.random() * 3; g.atkCd = 2.6; g.attacker = null;
          const dmg = 14;
          if (g.tgt.id === G.myId) { tp.hurt(dmg, e.pos, { cause: 'Orka saldırısı' }); tpCamera.addShake(0.4); }
          else G.emit('netHurtPlayer', { id: g.tgt.id, dmg, from: [e.pos.x, e.pos.y, e.pos.z], cause: 'Orka' });
          effects.blood(tp.pos.x, tp.pos.y + 0.6, tp.pos.z);
          effects.splash(e.pos.x, e.pos.z, 1);
          audio.play('hit', { pos: e.pos, vol: 0.7, rate: 0.55 });
          combat.markCombat();
        }
      }
    }
    // grup merkezi lider üyeyi izler (hedefi kaybetmesin)
    const lead = g.members.find((m) => m.alive);
    if (!lead) { g.remove = true; return; }
  },

  _sink(e, dt) {
    e.modeT += dt;
    e.pos.y -= dt * 1.2;
    e.roll = damp(e.roll, 2.6, 0.6, dt);
    e.swim = 0;
    if (e.modeT > 25) e.root.visible = false;
  },

  _blow(e) {
    if (e.kind === 'dolphin') return; // yunusların nefesi görünmeyecek kadar küçük
    e.blowN++;
    this._blowFx(e);
  },
  _blowFx(e) {
    const big = e.kind === 'balina' ? e.scale : 0.26 * e.scale;
    const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
    const hx = e.pos.x + fx * e.len * 0.26, hz = e.pos.z + fz * e.len * 0.26;
    const y = this._surfaceY(hx, hz) + 0.25;
    const wx = Math.sin(sky.windDir) * sky.windStrength * 1.6, wz = Math.cos(sky.windDir) * sky.windStrength * 1.6;
    // iki kollu (V biçimli) ince sis sütunu: alttan hızlı, tepede yayılan damlacıklar
    const n = Math.round(14 + 60 * big);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * 0.45 * big, v = Math.random();
      const arm = (i % 2 ? 1 : -1) * 0.35 * big;
      effects.spawn(hx + Math.cos(e.yaw) * arm * 0.4, y, hz - Math.sin(e.yaw) * arm * 0.4,
        Math.cos(a) * s + wx + Math.cos(e.yaw) * arm, (3 + v * 5.5) * Math.sqrt(big), Math.sin(a) * s + wz - Math.sin(e.yaw) * arm,
        1 + Math.random() * 1.4, (0.22 + Math.random() * 0.35) * (0.6 + big), 0.9, 0.94, 0.98, -4.2, 0.8, 0.9 * big + v * 0.5 * big);
    }
    const L = audio.listener, d = Math.hypot(hx - L.x, hz - L.z);
    if (d < 240 && big > 0.3) { audio.splash(0.3 * big * (1 - d / 240)); audio.tone(95, 0.8, 'sine', 0.05 * big, { x: hx, z: hz }, 0.6); }
  },

  // sıçramanın ardından suya çarpış
  _crash(e) {
    e.splashN++;
    this._crashFx(e);
    // yakın gemiler sarsılır
    for (const s of G.ships) {
      const d = Math.hypot(s.x - e.pos.x, s.z - e.pos.z);
      if (d < 35) { s.rollV = (s.rollV || 0) + (1 - d / 35) * 0.5 * (Math.random() < 0.5 ? -1 : 1); s.vy = (s.vy || 0) + (1 - d / 35) * 1.5; }
    }
  },
  _crashFx(e) {
    effects.splash(e.pos.x, e.pos.z, 4.5);
    const y0 = this._surfaceY(e.pos.x, e.pos.z);
    for (let i = 0; i < 90; i++) { // yanlara yayılan köpük halkası
      const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 7;
      effects.spawn(e.pos.x + Math.cos(a) * 2, y0 + 0.3, e.pos.z + Math.sin(a) * 2, Math.cos(a) * v, 2 + Math.random() * 5, Math.sin(a) * v, 1.2 + Math.random(), 0.9 + Math.random() * 0.8, 0.9, 0.95, 1, -9.8, 1.2, 0.8);
    }
    for (let k = 0; k < 5; k++) effects.splash(e.pos.x + (Math.random() - 0.5) * e.len * 0.8, e.pos.z + (Math.random() - 0.5) * e.len * 0.8, 2.2);
    audio.boom(0.55, e.pos);
    const p = G.player;
    if (p) {
      const d = p.pos.distanceTo(e.pos);
      if (d < 70) tpCamera.addShake(0.5 * (1 - d / 70));
      if (d < 150 && !this._breachSeen) { this._breachSeen = true; G.notify('Bir kambur balina sudan fırladı!', 'good', 3500); }
    }
  },

  // ---- ağ ----------------------------------------------------------------
  netSnapshot() {
    return this.ents.map((e) => [e.id, KINDS.indexOf(e.kind), +e.pos.x.toFixed(2), +e.pos.y.toFixed(2), +e.pos.z.toFixed(2), +e.yaw.toFixed(2), +e.pitch.toFixed(2), +e.roll.toFixed(2), e.blowN, e.splashN, +e.scale.toFixed(2), e.alive ? 1 : 0, +e.swim.toFixed(2)]);
  },
  applySnapshot(arr) {
    const seen = new Set();
    for (const s of arr) {
      seen.add(s[0]);
      let e = this.ents.find((x) => x.id === s[0]);
      if (!e) {
        e = this._makeEnt(KINDS[s[1]], null, s[10], 0, 0, false, s[0]);
        e.pos.set(s[2], s[3], s[4]); e.yaw = s[5]; e.blowN = s[8]; e.splashN = s[9];
      }
      e.net = s;
    }
    for (const e of this.ents) if (!seen.has(e.id)) { this._dispose(e); e.removed = true; }
    this.ents = this.ents.filter((e) => !e.removed);
  },
  _interp(e, dt) {
    const s = e.net;
    if (!s) return;
    e.pos.x = damp(e.pos.x, s[2], 8, dt); e.pos.y = damp(e.pos.y, s[3], 8, dt); e.pos.z = damp(e.pos.z, s[4], 8, dt);
    e.yaw = dampAngle(e.yaw, s[5], 8, dt); e.pitch = dampAngle(e.pitch, s[6], 8, dt); e.roll = dampAngle(e.roll, s[7], 8, dt);
    if (s[8] !== e.blowN) { e.blowN = s[8]; this._blowFx(e); }
    if (s[9] !== e.splashN) { e.splashN = s[9]; if (e.kind === 'dolphin') effects.splash(e.pos.x, e.pos.z, 0.45); else this._crashFx(e); }
    e.alive = !!s[11]; e.swim = s[12];
    if (e.target) e.target.alive = e.alive;
  },
  byId(id) { return this.ents.find((e) => e.id === id); },

  // test/hata ayıklama: oyuncunun yakınında bir grup doğur
  debugSpawn(kind, dist = 60) {
    const p = G.player;
    const a = p.mode === 'deck' && p.ship ? p.ship.yaw : p.yaw;
    const g = this._spawnGroup(kind, p.pos);
    if (g) {
      g.x = p.pos.x + Math.sin(a) * dist; g.z = p.pos.z + Math.cos(a) * dist;
      g.yaw = a + Math.PI / 2;
      for (const e of g.members) { e.pos.x = g.x + e.ox; e.pos.z = g.z + e.oz; e.pos.y = this._surfaceY(g.x, g.z) - 1; }
    }
    return g;
  },
};
