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
  // savaş: kombo zinciri, ağır vuruş, karşı saldırı, blok, kaçınma
  Atk1: '1H_Melee_Attack_Slice_Diagonal', Atk2: '1H_Melee_Attack_Slice_Horizontal', Atk3: '1H_Melee_Attack_Chop',
  AtkStab: '1H_Melee_Attack_Stab', AtkHeavy: '1H_Melee_Attack_Jump_Chop', Counter: 'Block_Attack',
  Atk2H: '2H_Melee_Attack_Slice', Heavy2H: '2H_Melee_Attack_Chop', Spin2H: '2H_Melee_Attack_Spin', Stab2H: '2H_Melee_Attack_Stab', Idle2H: '2H_Melee_Idle',
  DualChop: 'Dualwield_Melee_Attack_Chop', DualSlice: 'Dualwield_Melee_Attack_Slice', DualStab: 'Dualwield_Melee_Attack_Stab',
  Block: 'Blocking', BlockHit: 'Block_Hit', Parry: 'Block',
  Dodge_F: 'Dodge_Forward', Dodge_B: 'Dodge_Backward', Dodge_L: 'Dodge_Left', Dodge_R: 'Dodge_Right',
  Punch2: 'Unarmed_Melee_Attack_Punch_B', Kick: 'Unarmed_Melee_Attack_Kick', Unarmed: 'Unarmed_Idle',
  Aim: '1H_Ranged_Aiming', Reload: '1H_Ranged_Reload', Aim2H: '2H_Ranged_Aiming', Shoot2H: '2H_Ranged_Shoot', Reload2H: '2H_Ranged_Reload',
  Cast: 'Spellcast_Shoot', CastLong: 'Spellcast_Long', Summon: 'Spellcast_Summon', CastRaise: 'Spellcast_Raise',
  // yaşam: oturma, uzanma, eşya, hareket çeşitleri
  IdleB: 'Idle_B', IdleCombat: 'Idle_Combat', WalkB: 'Walking_B', WalkC: 'Walking_C', WalkBack: 'Walking_Backwards', WalkSk: 'Walking_D_Skeletons',
  RunB: 'Running_B', Sprint: 'Running_C', StrafeL: 'Running_Strafe_Left', StrafeR: 'Running_Strafe_Right',
  JumpStart: 'Jump_Start', JumpLong: 'Jump_Full_Long', JumpShort: 'Jump_Full_Short',
  PickUp: 'PickUp', UseItem: 'Use_Item', Throw: 'Throw', Taunt: 'Taunt', Cheer: 'Cheer',
  SitDown: 'Sit_Chair_Down', Sit: 'Sit_Chair_Idle', SitUp: 'Sit_Chair_StandUp',
  SitFloorDown: 'Sit_Floor_Down', SitFloor: 'Sit_Floor_Idle', SitFloorUp: 'Sit_Floor_StandUp',
  LieDown: 'Lie_Down', Lie: 'Lie_Idle', LieUp: 'Lie_StandUp',
  Death2: 'Death_B', DeathSk: 'Death_C_Skeletons', Resurrect: 'Death_C_Skeletons_Resurrect',
  Awaken: 'Skeletons_Awaken_Floor', AwakenStand: 'Skeletons_Awaken_Standing', SpawnGround: 'Spawn_Ground_Skeletons',
};
// Tek seferlik (döngüsüz) oynatılan mantıksal animasyonlar — ağ eşitlemesi ve durum makineleri için
const ONCE_RE = /Slash|Shoot|Punch|Interact|Roll|Hit|Death|Wave|Atk|Heavy|Counter|Spin|Stab|Chop|Slice|Dodge|Parry|Kick|Reload|Cast|Summon|Pick|Use|Throw|Taunt|Cheer|Jump_?Start|JumpStart|JumpLong|JumpShort|Land|Down|Up$|Resurrect|Awaken|Spawn|Sword$/;
export function isOnce(name) { return !!name && ONCE_RE.test(name); }

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
    // karakter/animasyon/kit dosyaları kritiktir: 3 deneme, yine olmazsa anlaşılır hata (hangi dosya)
    const get = async (file) => {
      let err;
      for (let i = 0; i < 3; i++) { try { return await loader.loadAsync(`${base}assets/models/kk/${file}`); } catch (e) { err = e; await new Promise((r) => setTimeout(r, 400 * (i + 1))); } }
      throw new Error(`Karakter dosyası yüklenemedi: ${file} (${err?.message || err})`);
    };
    const jobs = [];
    for (const id of KK_CHARS) jobs.push(get(`kk_${id}.glb`).then((g) => { this.templates[id] = g; onEach && onEach(); }));
    jobs.push(get('kk_anims.glb').then((g) => { this._anims = g.animations; onEach && onEach(); }));
    for (const k of KK_KITS) jobs.push(get(`kit_${k}.glb`).then((g) => { this._prepKit(k, g.scene); onEach && onEach(); }));
    await Promise.all(jobs);
    for (const id of KK_CHARS) this._prepChar(id);
    this._prepClips();
    // renk boyama için atlas piksellerini yüklemede bir kez oku (oyun içinde takılma olmasın)
    for (const id of Object.keys(KK_ROLES)) if (this.info[id]) this._atlasPixels(id);
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
  // Katmanlı animasyon için klip yarıları: U = omurga/göğüs/baş/kollar, L = kök/kalça/bacaklar
  clipPart(name, part) {
    const full = this.clip(name);
    if (!full) return null;
    const key = full.name + '__' + part;
    if (!this._parts) this._parts = new Map();
    let c = this._parts.get(key);
    if (c) return c;
    const isUp = (t) => /^(spine|chest|head|neck|upperarm|lowerarm|wrist|hand|finger|thumb)/i.test(t.name.split('.')[0]);
    c = new THREE.AnimationClip(key, full.duration, full.tracks.filter((t) => (part === 'U' ? isUp(t) : !isUp(t))));
    this._parts.set(key, c);
    return c;
  },
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
  // atlas pikselleri bir kez okunur (tuvalden okuma yavaştır), sonra CPU'da kopyalanıp boyanır
  _atlasPixels(id) {
    if (!this._px) this._px = {};
    if (this._px[id]) return this._px[id];
    const src = this.info[id]?.atlas;
    if (!src?.image) return null;
    const W = 256, H = 256;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(src.image, 0, 0, W, H);
    this._px[id] = g.getImageData(0, 0, W, H).data;
    return this._px[id];
  },

  texture(id, colors) {
    const roles = KK_ROLES[id];
    const src = this.info[id]?.atlas;
    if (!roles || !src || !colors) return src;
    const key = id + JSON.stringify(colors);
    if (this.texCache.has(key)) return this.texCache.get(key);
    const base = this._atlasPixels(id);
    if (!base) return src;
    const W = 256, H = 256;
    const data = new Uint8Array(base);
    const cw = W / 8, ch = H / 4;
    const tc = new THREE.Color();
    for (const role in colors) {
      const cells = roles[role];
      if (!cells || !colors[role]) continue;
      tc.set(colors[role]);
      tc.getRGB(tc, THREE.SRGBColorSpace); // atlas sRGB değerleriyle çalışır
      const tr = tc.r * 255, tg = tc.g * 255, tb = tc.b * 255;
      for (const [r, c] of cells) {
        // hücrenin orta parlaklığı referans alınır, gradyan korunur
        const mx = Math.floor((c + 0.5) * cw), my = Math.floor((r + 0.5) * ch);
        const mi = (my * W + mx) * 4;
        const mid = Math.max(0.05, lum(data[mi], data[mi + 1], data[mi + 2]));
        const y0 = Math.floor(r * ch), y1 = Math.floor((r + 1) * ch), x0 = Math.floor(c * cw), x1 = Math.floor((c + 1) * cw);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          const k = Math.min(1.6, lum(base[i], base[i + 1], base[i + 2]) / mid);
          data[i] = Math.min(255, tr * k); data[i + 1] = Math.min(255, tg * k); data[i + 2] = Math.min(255, tb * k);
        }
      }
    }
    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    tex.flipY = false; tex.colorSpace = src.colorSpace; tex.wrapS = src.wrapS; tex.wrapT = src.wrapT;
    tex.offset.copy(src.offset); tex.repeat.copy(src.repeat); tex.rotation = src.rotation; tex.center.copy(src.center);
    tex.channel = src.channel;
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    tex.needsUpdate = true;
    if (this.texCache.size > 96) { const k0 = this.texCache.keys().next().value; this.texCache.get(k0)?.dispose?.(); this.texCache.delete(k0); }
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
