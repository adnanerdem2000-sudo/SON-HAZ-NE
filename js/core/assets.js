import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// CC0 modeller (Quaternius & Kenney) — bkz. CREDITS.md
export const MODEL_LIST = [
  'adventurer', 'hooded_adventurer', 'pirate', 'skeleton_crew', 'skeleton', 'ghost', 'ghost_skull',
  'crab', 'bat', 'frog', 'worker', 'chest', 'tree_palm', 'tree_oak', 'tree_fat', 'rock_large',
  'rock_small', 'rock_tall', 'bush', 'bush_large', 'barrel', 'crate', 'coin', 'gem_pink', 'campfire',
  'tent', 'fence', 'log', 'stump', 'column', 'column_broken', 'obelisk', 'sword', 'axe', 'crystal',
  'flower_red', 'mushroom_red',
];

export const assets = {
  models: {},
  loaded: 0,
  base: '',

  async loadAll(onProgress) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let done = 0;
    await Promise.all(MODEL_LIST.map(async (name) => {
      const gltf = await loader.loadAsync(`${this.base}assets/models/${name}.glb`);
      gltf.scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.models[name] = gltf;
      done++;
      if (onProgress) onProgress(done / MODEL_LIST.length);
    }));
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
