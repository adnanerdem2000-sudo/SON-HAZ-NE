import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { kk } from './kk.js';

// CC0 modeller (Quaternius & Kenney) — bkz. CREDITS.md
export const MODEL_LIST = [
  'adventurer', 'hooded_adventurer', 'pirate', 'skeleton_crew', 'skeleton', 'ghost', 'ghost_skull',
  'crab', 'bat', 'frog', 'worker', 'chest', 'tree_palm', 'tree_oak', 'tree_fat', 'rock_large',
  'rock_small', 'rock_tall', 'bush', 'bush_large', 'barrel', 'crate', 'coin', 'gem_pink', 'campfire',
  'tent', 'fence', 'log', 'stump', 'column', 'column_broken', 'obelisk', 'sword', 'axe', 'crystal',
  'flower_red', 'mushroom_red',
  // biyom çeşitliliği (Quaternius/Kenney CC0)
  'wolf', 'fox', 'deer', 'stag', 'husky', 'cat', 'yeti', 'zombie', 'tree_pine', 'tree_pine_tall', 'tree_dark', 'tree_autumn',
  'cactus', 'crystal_rock', 'orc_brute', 'demon',
];

export const assets = {
  models: {},
  loaded: 0,
  base: '',

  missing: [],
  // ağ/CDN hatasına dayanıklı yükleme: 3 deneme, artan bekleme
  async loadRetry(loader, url, tries = 3) {
    let err;
    for (let i = 0; i < tries; i++) {
      try { return await loader.loadAsync(url); }
      catch (e) { err = e; await new Promise((r) => setTimeout(r, 400 * (i + 1))); }
    }
    throw err;
  },
  _placeholder(name) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xff40c0 }));
    m.position.y = 0.3; m.name = 'placeholder_' + name;
    g.add(m);
    return { scene: g, animations: [] };
  },
  async loadAll(onProgress) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let done = 0;
    const total = MODEL_LIST.length + kk.count();
    const kkJob = kk.load(loader, this.base, () => { done++; if (onProgress) onProgress(done / total); });
    await Promise.all([kkJob, ...MODEL_LIST.map(async (name) => {
      let gltf;
      try { gltf = await this.loadRetry(loader, `${this.base}assets/models/${name}.glb`); }
      catch (e) {
        // eksik/bozuk model: oyun yine açılır, pembe yer tutucu kullanılır ve uyarı verilir
        console.error('Model yüklenemedi:', name, e?.message || e);
        this.missing.push(name);
        gltf = this._placeholder(name);
      }
      gltf.scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      // merkezi kaymış modeller ortalanır: Kenney 'barrel' geometrisi orijinden (2; 1,5) birim, 'crystal_rock' (2; 1,5) birim
      // uzakta modellenmiş. Ölçeklenince her varil konduğu yerden ~10 m, her kristal 4–9 m ötede çiziliyordu: denizde yüzen
      // olay varili görünen yerinde toplanamıyor (toplama noktası 10 m ötede), liman yük yığınının varilleri iskelenin
      // dibinde/suyun üstünde görünüyor, kristal kayanın çarpıştırıcısı boşlukta kalıyordu. Yatay (x, z) merkez orijine alınır.
      {
        const bb = new THREE.Box3().setFromObject(gltf.scene);
        const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
        const size = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z, 1e-6);
        if (Math.hypot(cx, cz) > size) { for (const ch of gltf.scene.children) { ch.position.x -= cx; ch.position.z -= cz; } gltf.scene.updateMatrixWorld(true); }
      }
      // renk düzeltmeleri: Kenney sandık/varil modelleri ahşap tonuna
      if (name === 'crate') gltf.scene.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(0x8a5a32), 0.75); } });
      // varil: glTF'de metallicFactor yazılmamış → metalness 1; ortam haritası olmadığından gövde siyah/turuncu yağ varili gibi
      // görünüyordu. Ahşap gövde + demir çember.
      if (name === 'barrel') gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.clone();
        o.material.metalness = /metal$/i.test(o.material.name) ? 0.35 : 0.05;
        o.material.roughness = 0.75;
        o.material.color.set(/red/i.test(o.material.name) ? 0x7a4a26 : 0x3c3c3a);
      });
      this.models[name] = gltf;
      done++;
      if (onProgress) onProgress(done / total);
    })]);
  },

  // Animasyonlu modeller için iskelet kopyası
  clone(name) {
    const g = this.models[name];
    if (!g) throw new Error('Model yok: ' + name);
    const s = skeletonClone(g.scene);
    return s;
  },

  animations(name) {
    return this.models[name].animations;
  },

  // Statik modellerin ölçeklenmiş kopyası (yüksekliğe göre)
  prop(name, height = null) {
    const o = this.models[name].scene.clone(true);
    if (height) {
      const b = new THREE.Box3().setFromObject(o);
      const s = height / Math.max(0.001, b.max.y - b.min.y);
      o.scale.setScalar(s);
    }
    return o;
  },

  // Bir modelin tek geometri+malzemelerini InstancedMesh'e uygun şekilde çıkarır
  meshParts(name) {
    const parts = [];
    const root = this.models[name].scene;
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (o.isMesh) {
        const g = toFloatGeometry(o.geometry);
        g.applyMatrix4(o.matrixWorld);
        parts.push({ geometry: g, material: o.material });
      }
    });
    return parts;
  },
};

// Meshopt/quantization ile sıkıştırılmış öznitelikleri Float32'ye çevirir
// (aksi halde matris uygulanınca normalize int16 değerler kırpılır)
export function toFloatGeometry(src) {
  const g = new THREE.BufferGeometry();
  for (const name in src.attributes) {
    const a = src.attributes[name];
    const n = a.count, s = a.itemSize;
    const arr = new Float32Array(n * s);
    for (let i = 0; i < n; i++) {
      arr[i * s] = a.getX(i);
      if (s > 1) arr[i * s + 1] = a.getY(i);
      if (s > 2) arr[i * s + 2] = a.getZ(i);
      if (s > 3) arr[i * s + 3] = a.getW(i);
    }
    g.setAttribute(name, new THREE.BufferAttribute(arr, s));
  }
  if (src.index) g.setIndex(src.index.clone());
  for (const gr of src.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
  return g;
}

// Klip adlarını sadeleştir: "CharacterArmature|...|Run" -> "Run"
export function clipMap(clips) {
  const m = {};
  for (const c of clips) {
    const parts = c.name.split('|');
    let n = parts[parts.length - 1];
    if (parts.length > 2 && parts[parts.length - 2] && !/Armature/.test(parts[parts.length - 2])) n = parts[parts.length - 2];
    // Quaternius çift isimleri
    const known = c.name.match(/(Death|Duck|HitReact|Idle|Jump_Idle|Jump_Land|Jump|No|Punch|Run|Sword|Walk|Wave|Yes|Jump_Idlea)/g);
    if (/CharacterArmature\|CharacterArmature\|CharacterArmature\|/.test(c.name) && known) n = known[0];
    if (!m[n]) m[n] = c;
  }
  return m;
}
