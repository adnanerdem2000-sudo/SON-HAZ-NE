import * as THREE from 'three';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// KayKit (Kay Lousberg, CC0) karakter ve kit varlıkları.
// - Karakterler aynı iskeleti paylaşır; tek animasyon kütüphanesi (kk_anims.glb) hepsine uygulanır.
// - Yükleme sırasında "chibi" oranlar hafifçe kahraman oranlarına çekilir (kafa küçülür, uzuvlar uzar).
// - Kıyafet/ten/saç renkleri, doku atlasındaki renk hücreleri yeniden boyanarak özelleştirilir.

export const KK_CHARS = ['barbarian', 'knight', 'mage', 'rogue', 'rogue_hooded', 'sk_minion', 'sk_warrior', 'sk_rogue', 'sk_mage'];
export const KK_KITS = ['dungeon', 'graveyard', 'town', 'furniture', 'weapons'];
const PROPORTION = { leg: 1.4, arm: 1.15, head: 0.8, torso: 1.06 };

// Atlas hücre rolleri [satır, sütun] (8×4 hücreli gradyan atlas)
export const KK_ROLES = {
  rogue: { skin: [[0, 0]], hair: [[0, 1]], coat: [[1, 1], [2, 1]], coatDark: [[1, 0]], pants: [[2, 3]], boots: [[1, 7]], leather: [[0, 5], [0, 6], [2, 5]] },
  rogue_hooded: { skin: [[0, 0]], hair: [[0, 1]], coat: [[1, 1], [2, 1]], coatDark: [[1, 0]], pants: [[2, 3]], boots: [[1, 7]], leather: [[0, 5], [0, 6], [2, 5]] },
  barbarian: { skin: [[0, 0]], hair: [[0, 1]], coat: [[1, 0], [1, 1], [2, 2]], fur: [[1, 2], [2, 0]], pants: [[2, 3]], boots: [[1, 7], [2, 7]], leather: [[0, 6], [0, 5]] },
  knight: { skin: [[0, 0]], hair: [[0, 1]], coat: [[1, 0], [2, 2]], metal: [[0, 3], [0, 7], [1, 2]], pants: [[1, 7]], leather: [[0, 6]] },
  mage: { skin: [[0, 0]], hair: [[0, 1]], coat: [[1, 0], [1, 1]], coatDark: [[1, 7]], accent: [[1, 2], [2, 1]], leather: [[0, 5], [0, 6]] },
};

// Oyun içi animasyon adları → KayKit klipleri
export const ANIM_MAP = {
  Idle: 'Idle', Walk: 'Walking_A', Run: 'Running_A', Death: 'Death_A', Wave: 'Cheer', Interact: 'Interact',
  Sword_Slash: '1H_Melee_Attack_Slice_Diagonal', Punch_Right: 'Unarmed_Melee_Attack_Punch_A', Punch: 'Unarmed_Melee_Attack_Punch_A',
  Gun_Shoot: '1H_Ranged_Shoot', Idle_Gun: 'Idle', Idle_Gun_Pointing: '1H_Ranged_Aiming', Idle_Sword: 'Blocking', Roll: 'Dodge_Forward',
  HitRecieve: 'Hit_A', HitRecieve_2: 'Hit_B', HitReact: 'Hit_A', Jump: 'Jump_Idle', Jump_Idle: 'Jump_Idle', Jump_Land: 'Jump_Land', Sword: '1H_Melee_Attack_Chop',
  Yes: 'Cheer', No: 'Hit_B',
};

const _v = new THREE.Vector3();

export const kk = {
  ready: false,
  templates: {},
  clips: {},
  kits: {},
  items: {},
  info: {},
  restDelta: null,
  texCache: new Map(),

  async load(loader, base, onEach) {
    const jobs = [];
    for (const id of KK_CHARS) jobs.push(loader.loadAsync(`${base}assets/models/kk/kk_${id}.glb`).then((g) => { this.templates[id] = g; onEach && onEach(); }));
    jobs.push(loader.loadAsync(`${base}assets/models/kk/kk_anims.glb`).then((g) => { this._anims = g.animations; onEach && onEach(); }));
    for (const k of KK_KITS) jobs.push(loader.loadAsync(`${base}assets/models/kk/kit_${k}.glb`).then((g) => { this._prepKit(k, g.scene); onEach && onEach(); }));
    await Promise.all(jobs);
    for (const id of KK_CHARS) this._prepChar(id);
    this._prepClips();
    this.ready = true;
  },
  count() { return KK_CHARS.length + 1 + KK_KITS.length; },

  // ---- karakter şablonları ----
  _prepChar(id) {
    const root = this.templates[id].scene;
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (o.isSkinnedMesh) {
        o.geometry = floatGeometry(o.geometry);
        o.frustumCulled = false;
      }
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    const delta = reproportion(root, PROPORTION);
    if (!this.restDelta) this.restDelta = delta;
    // el eşyaları (silah/kalkan/kupa...) ayrı şablon olarak saklanır, karakterde gizlenir
    const bones = {};
    root.traverse((b) => { if (b.isBone) bones[b.name] = b; });
    for (const slot of ['handslotr', 'handslotl']) {
      const s = bones[slot]; if (!s) continue;
      for (const c of [...s.children]) if (c.isMesh || c.isGroup || c.isObject3D) {
        if (!this.items[c.name]) this.items[c.name] = { obj: c.clone(true), slot };
        c.visible = false;
      }
    }
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    root.traverse((o) => { if (o.isSkinnedMesh) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.bindMatrix)); } });
    // kafa ölçüleri (aksesuar yerleşimi için)
    let head = null;
    root.traverse((o) => { if (o.isSkinnedMesh && /(Head|Skull)/.test(o.name) && !/Hat|Helmet|Hood$/.test(o.name)) { const hb = o.geometry.boundingBox.clone().applyMatrix4(o.bindMatrix); head = head ? head.union(hb) : hb; } });
    const headBone = bones.head;
    const hp = headBone.getWorldPosition(new THREE.Vector3());
    this.info[id] = {
      height: box.max.y - box.min.y,
      minY: box.min.y,
      head: head ? { center: head.getCenter(new THREE.Vector3()).sub(hp), size: head.getSize(new THREE.Vector3()), top: head.max.y - hp.y, front: head.max.z - hp.z } : { center: new THREE.Vector3(0, 0.25, 0), size: new THREE.Vector3(0.5, 0.5, 0.5), top: 0.5, front: 0.25 },
      atlas: this._atlasOf(root),
    };
  },
  _atlasOf(root) {
    let tex = null;
    root.traverse((o) => { if (!tex && o.isSkinnedMesh && o.material?.map) tex = o.material.map; });
    return tex;
  },

  _prepClips() {
    const d = this.restDelta || {};
    for (const c of this._anims || []) {
      const clip = c.clone();
      for (const t of clip.tracks) {
        if (!t.name.endsWith('.position')) continue;
        const bn = t.name.slice(0, t.name.lastIndexOf('.'));
        const dv = d[bn]; if (!dv) continue;
        for (let i = 0; i < t.values.length; i += 3) { t.values[i] += dv.x; t.values[i + 1] += dv.y; t.values[i + 2] += dv.z; }
      }
      this.clips[clip.name] = clip;
    }
  },

  clone(id) {
    const t = this.templates[id];
    if (!t) throw new Error('KayKit karakteri yok: ' + id);
    return skeletonClone(t.scene);
  },
  clip(name) { return this.clips[ANIM_MAP[name] || name] || null; },
  item(name) {
    const it = this.items[name];
    return it ? { obj: it.obj.clone(true), slot: it.slot } : null;
  },

  // ---- kitler ----
  _prepKit(name, scene) {
    const parts = {};
    for (const c of scene.children) {
      c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      parts[c.name] = c;
    }
    this.kits[name] = parts;
  },
  // adlandırılmış kit parçasının kopyası; height verilirse o yüksekliğe ölçeklenir
  part(kit, name, height = null) {
    const src = this.kits[kit]?.[name];
    if (!src) { console.warn('Kit parçası yok:', kit, name); return new THREE.Group(); }
    const o = src.clone(true);
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    if (height) {
      const b = new THREE.Box3().setFromObject(o);
      o.scale.setScalar(height / Math.max(0.001, b.max.y - b.min.y));
    }
    return o;
  },
  partNames(kit) { return Object.keys(this.kits[kit] || {}); },

  // ---- renk özelleştirme (atlas hücrelerini yeniden boyama) ----
  texture(id, colors) {
    const roles = KK_ROLES[id];
    const src = this.info[id]?.atlas;
    if (!roles || !src || !colors) return src;
    const key = id + JSON.stringify(colors);
    if (this.texCache.has(key)) return this.texCache.get(key);
    const img = src.image;
    const W = 256, H = 256;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0, W, H);
    const data = g.getImageData(0, 0, W, H);
    const cw = W / 8, ch = H / 4;
    const tmp = new THREE.Color();
    for (const role in colors) {
      const cells = roles[role];
      if (!cells || !colors[role]) continue;
      const target = new THREE.Color(colors[role]);
      target.getRGB(target, THREE.SRGBColorSpace); // tuval sRGB değerleriyle çalışır
      for (const [r, c] of cells) {
        // hücrenin orta parlaklığı referans alınır, gradyan korunur
        const mx = Math.floor((c + 0.5) * cw), my = Math.floor((r + 0.5) * ch);
        const mi = (my * W + mx) * 4;
        const mid = Math.max(0.05, lum(data.data[mi], data.data[mi + 1], data.data[mi + 2]));
        for (let y = Math.floor(r * ch); y < Math.floor((r + 1) * ch); y++) for (let x = Math.floor(c * cw); x < Math.floor((c + 1) * cw); x++) {
          const i = (y * W + x) * 4;
          const k = lum(data.data[i], data.data[i + 1], data.data[i + 2]) / mid;
          tmp.copy(target).multiplyScalar(Math.min(1.6, k));
          data.data[i] = Math.min(255, tmp.r * 255); data.data[i + 1] = Math.min(255, tmp.g * 255); data.data[i + 2] = Math.min(255, tmp.b * 255);
        }
      }
    }
    g.putImageData(data, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.flipY = src.flipY; tex.colorSpace = src.colorSpace; tex.wrapS = src.wrapS; tex.wrapT = src.wrapT;
    tex.offset.copy(src.offset); tex.repeat.copy(src.repeat); tex.rotation = src.rotation; tex.center.copy(src.center);
    tex.channel = src.channel;
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
    if (this.texCache.size > 64) this.texCache.clear();
    this.texCache.set(key, tex);
    return tex;
  },
};

function lum(r, g, b) { return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

// Nicemlenmiş (int16) öznitelikleri Float32'ye çevir: oran düzenlemesi sınırları aşabilir
function floatGeometry(src) {
  const g = new THREE.BufferGeometry();
  for (const name in src.attributes) {
    const a = src.attributes[name];
    if (name === 'skinIndex') { g.setAttribute(name, a); continue; }
    const n = a.count, s = a.itemSize;
    const arr = new Float32Array(n * s);
    for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) arr[i * s + k] = a.getComponent(i, k);
    g.setAttribute(name, new THREE.BufferAttribute(arr, s));
  }
  if (src.index) g.setIndex(src.index);
  for (const gr of src.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  return g;
}

// Chibi → kahraman oranları. Bağlama pozunda köşe noktalarını kemik ağırlıklarına göre taşır, iskeleti
// yeni dinlenme pozuna getirir ve bağlama matrislerini yeniden hesaplar. Dönüş: kemik başına yerel öteleme farkı.
function reproportion(root, K) {
  root.updateMatrixWorld(true);
  const bones = {};
  root.traverse((b) => { if (b.isBone) bones[b.name] = b; });
  const P = {};
  for (const n in bones) P[n] = bones[n].getWorldPosition(new THREE.Vector3());
  const side = (n) => (n.endsWith('l') ? 'l' : 'r');
  const hipJ = { l: P.upperlegl, r: P.upperlegr }, kneeJ = { l: P.lowerlegl, r: P.lowerlegr }, ankleJ = { l: P.footl, r: P.footr };
  const legLen = hipJ.l.y - ankleJ.l.y;
  const dH = legLen * (K.leg - 1);
  const headJ = P.head.clone();
  const torsoTop = headJ.y;
  const dT = (torsoTop - hipJ.l.y) * (K.torso - 1);
  const torsoMap = (y) => (y <= hipJ.l.y ? y + dH : y >= torsoTop ? y + dH + dT : hipJ.l.y + dH + (y - hipJ.l.y) * K.torso);
  const headJn = new THREE.Vector3(headJ.x, torsoMap(headJ.y), headJ.z);
  const shoulder = { l: P.upperarml, r: P.upperarmr }, elbow = { l: P.lowerarml, r: P.lowerarmr }, wrist = { l: P.wristl, r: P.wristr };
  const newPos = {};
  for (const n in bones) {
    const p = P[n].clone(), s = side(n);
    if (/^(upperleg|lowerleg|foot|toes)[lr]$/.test(n)) {
      const h = hipJ[s], hn = new THREE.Vector3(h.x, h.y + dH, h.z);
      if (n.startsWith('upperleg')) newPos[n] = hn;
      else if (n.startsWith('lowerleg')) newPos[n] = new THREE.Vector3(p.x, hn.y + (p.y - h.y) * K.leg, p.z);
      else { const kn = kneeJ[s]; const knY = hn.y + (kn.y - h.y) * K.leg; const anY = knY + (ankleJ[s].y - kn.y) * K.leg; newPos[n] = new THREE.Vector3(p.x, anY + (p.y - ankleJ[s].y), p.z); }
    } else if (/^(upperarm|lowerarm|wrist|hand|handslot)[lr]$/.test(n)) {
      const sh = shoulder[s], shn = new THREE.Vector3(sh.x, torsoMap(sh.y), sh.z);
      const dir = new THREE.Vector3().subVectors(elbow[s], sh);
      if (n.startsWith('upperarm')) newPos[n] = shn;
      else if (n.startsWith('lowerarm')) newPos[n] = shn.clone().addScaledVector(dir, K.arm);
      else { const el = shn.clone().addScaledVector(dir, K.arm); const wr = el.clone().addScaledVector(new THREE.Vector3().subVectors(wrist[s], elbow[s]), K.arm); newPos[n] = wr.clone().add(new THREE.Vector3().subVectors(p, wrist[s])); }
    } else if (n === 'head') newPos[n] = headJn.clone();
    else if (n === 'root') newPos[n] = p;
    else if (/IK|control/.test(n)) newPos[n] = new THREE.Vector3(p.x, p.y + dH, p.z);
    else newPos[n] = new THREE.Vector3(p.x, torsoMap(p.y), p.z);
  }
  const disp = (n, v, out) => {
    const s = side(n);
    if (n.startsWith('upperleg')) { const h = hipJ[s]; return out.set(v.x, h.y + dH + (v.y - h.y) * K.leg, v.z); }
    if (n.startsWith('lowerleg')) { const kn = kneeJ[s]; return out.set(v.x, newPos['lowerleg' + s].y + (v.y - kn.y) * K.leg, v.z); }
    if (n.startsWith('foot') || n.startsWith('toes')) return out.copy(v).add(_v.subVectors(newPos['foot' + s], P['foot' + s]));
    if (n.startsWith('upperarm')) { const sh = shoulder[s]; const along = _v.subVectors(elbow[s], sh).normalize(); const t = out.copy(v).sub(sh); const a = t.dot(along); return t.add(newPos['upperarm' + s]).addScaledVector(along, a * (K.arm - 1)); }
    if (n.startsWith('lowerarm')) { const el = elbow[s]; const along = _v.subVectors(wrist[s], el).normalize(); const t = out.copy(v).sub(el); const a = t.dot(along); return t.add(newPos['lowerarm' + s]).addScaledVector(along, a * (K.arm - 1)); }
    if (n.startsWith('wrist') || n.startsWith('hand')) return out.copy(v).add(_v.subVectors(newPos['wrist' + s], wrist[s]));
    if (n === 'head') return out.copy(v).sub(headJ).multiplyScalar(K.head).add(headJn);
    return out.set(v.x, torsoMap(v.y), v.z);
  };
  const v = new THREE.Vector3(), acc = new THREE.Vector3(), d = new THREE.Vector3();
  const restM = new THREE.Matrix4();
  root.traverse((m) => {
    if (!m.isSkinnedMesh) return;
    const pos = m.geometry.attributes.position, si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    // Dinlenme pozunda dünya konumu = kemikDünya × kemikTersi × bağlamaMatrisi × v
    // (nicemlenmiş derili ağlarda nicemleme dönüşümü ters bağlama matrislerine gömülüdür)
    const sk = m.skeleton;
    const bm = m.bindMatrix, bmi = bm.clone().invert();
    for (let i = 0; i < pos.count; i++) {
      let best = 0, bw = -1;
      for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      restM.multiplyMatrices(sk.bones[best].matrixWorld, sk.boneInverses[best]).multiply(bm);
      v.fromBufferAttribute(pos, i).applyMatrix4(restM);
      acc.set(0, 0, 0);
      let ws = 0;
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        if (!w) continue;
        const b = sk.bones[si.getComponent(i, k)];
        disp(b.name, v, d);
        acc.addScaledVector(d, w); ws += w;
      }
      if (ws > 0) { acc.multiplyScalar(1 / ws).applyMatrix4(bmi); pos.setXYZ(i, acc.x, acc.y, acc.z); }
    }
    pos.needsUpdate = true;
    if (m.geometry.attributes.normal) m.geometry.attributes.normal.needsUpdate = true;
    m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere();
  });
  const order = [];
  root.traverse((b) => { if (b.isBone) order.push(b); });
  const delta = {};
  for (const b of order) {
    const old = b.position.clone();
    b.parent.updateMatrixWorld(true);
    b.position.copy(newPos[b.name].clone().applyMatrix4(b.parent.matrixWorld.clone().invert()));
    b.updateMatrixWorld(true);
    delta[b.name] = b.position.clone().sub(old);
  }
  root.traverse((m) => { if (m.isSkinnedMesh) { m.skeleton.calculateInverses(); m.bind(m.skeleton, m.bindMatrix); } });
  // kafa kemiğine bağlı katı başlıklar kafa ile birlikte küçülür
  for (const c of bones.head.children) if (!c.isBone) { c.scale.multiplyScalar(K.head); c.position.multiplyScalar(K.head); }
  return delta;
}
