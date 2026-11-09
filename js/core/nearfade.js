import * as THREE from 'three';

// Kameraya çok yakın yüzeylerin titreşimli (dither) silinmesi.
//
// Üçüncü şahıs kamera döndürülürken çarpıştırıcısı olmayan ya da kamerayı bilerek çekmeyen nesnelerin (palmiye/ağaç gövdesi ve
// tacı, çalı, eğrelti, NPC/düşman/hayvan, oyuncunun kendisi, yelken, küpeşte, tente…) içinden ya da hemen yanından geçiyor;
// birkaç kare boyunca ekranı bu nesnenin gölgedeki yüzü kaplıyor, ekran kararıp sonra düzeliyordu. Bu yardımcı, malzemenin
// gölgelendiricisine parça başına kamera uzaklığını ekler: `near` metreden yakın parçalar hiç çizilmez, `near`…`far` arasında
// ekran uzayı titreşim eşiğiyle (interleaved gradient noise) giderek seyrelir. Gölge geçişi ayrı malzemeyle çizildiğinden
// nesnenin gölgesi korunur. Uzaklık, köşe uzaklıklarının ara değeri değil parça konumundan hesaplanır (büyük yelken/yaprak
// üçgenlerinde köşeler uzaktayken kameraya değen orta kısım da silinsin).

const BASE_OBC = THREE.Material.prototype.onBeforeCompile;
const BASE_KEY = THREE.Material.prototype.customProgramCacheKey;

// kategori → (near, far) metre. Değerler paylaşılır: bir kategorinin aralığı tek yerden değiştirilebilir (ör. testte kapatma).
export const NEAR_FADE = {
  veg: new THREE.Vector2(0.55, 1.7), // ağaç/palmiye/çalı/eğrelti/ot
  prop: new THREE.Vector2(0.3, 1.0), // kaya, kütük, sütun, çadır, varil… (büyükleri kamerayı zaten çeker)
  char: new THREE.Vector2(0.3, 1.0), // NPC, düşman, hayvan, uzak oyuncu
  self: new THREE.Vector2(0.5, 1.6), // oyuncunun kendi modeli: kamera dar yerde başa çekilince baş/şapka ekranı kaplamasın (0,8 m altında tümden gizlenir)
  sail: new THREE.Vector2(0.4, 1.3), // yelken, bayrak, tente bezi (açık renkli: yalnız lensin dibindeyken silinir)
  rail: new THREE.Vector2(0.2, 0.7), // küpeşte, direk, seren, fener direği
};

// Görüş çizgisi silindiri (yalnız bitki örtüsü, `veg`): kameradan odağa (oyuncunun başı) uzanan çizginin `w` metre çevresindeki
// parçalar da seyrelir. Kamera noCam ağaç gövdelerinin/taçlarının arkasında kalınca (yakın-kamera aralığının ötesinde, ~2–4 m'de)
// kalın gövde ekranın yarısını koyu kaplayıp oyuncuyu gizliyordu. xyz: odak (görüş uzayı), w: yarıçap (0 = kapalı). game.js her
// karede günceller.
export const NF_FOCUS = { value: new THREE.Vector4(0, 0, 0, 0) };

// Malzeme → { tags:Set, foreign:boolean } ; uniform tutucular
const HOOKS = new WeakMap();
const HOLD = new WeakMap();
const OCC = new WeakMap();

// Bir malzemeye, önceki gölgelendirici kancasını (rüzgâr, kenar ışığı…) koruyarak yeni bir kanca ekler. Program önbellek anahtarı
// önceki anahtar + etiketten oluşur: aynı kodu üreten malzemeler programı paylaşır, farklıları karışmaz.
export function addShaderHook(mat, tag, fn) {
  let h = HOOKS.get(mat);
  if (h?.tags.has(tag)) return false;
  const prev = mat.onBeforeCompile;
  if (!h) { h = { tags: new Set(), foreign: prev !== BASE_OBC }; HOOKS.set(mat, h); }
  h.tags.add(tag);
  const prevKeyFn = mat.customProgramCacheKey;
  const prevKey = prevKeyFn === BASE_KEY ? (prev === BASE_OBC ? '' : prev.toString()) : null;
  mat.onBeforeCompile = function (sh, renderer) { prev.call(this, sh, renderer); fn(sh, renderer, this); };
  mat.customProgramCacheKey = function () { return (prevKey ?? prevKeyFn.call(this)) + '|' + tag; };
  mat.needsUpdate = true;
  return true;
}
export function hasShaderHook(mat, tag) { return !!HOOKS.get(mat)?.tags.has(tag); }
// yalnız bu modülün kancalarını taşıyor mu (başka özel gölgelendiricisi yok)
export function onlyOwnHooks(mat) { const h = HOOKS.get(mat); return !!h && !h.foreign; }

export function nearFadeCategory(mat) {
  const u = HOLD.get(mat);
  if (!u) return null;
  for (const k in NEAR_FADE) if (NEAR_FADE[k] === u.value) return k;
  return null;
}

// mat'a yakın-kamera silinmesini ekler; zaten varsa yalnız kategorisini değiştirir (yeniden derleme yok)
export function nearFade(mat, cat = 'prop') {
  if (!mat || !mat.isMaterial || mat.isShaderMaterial || mat.isLineBasicMaterial || mat.isPointsMaterial || mat.isSpriteMaterial) return mat;
  const range = NEAR_FADE[cat];
  if (!range) return mat;
  const held = HOLD.get(mat);
  if (held) { held.value = range; OCC.get(mat).value = cat === 'veg' ? 1 : 0; return mat; }
  const u = { value: range }, occ = { value: cat === 'veg' ? 1 : 0 };
  HOLD.set(mat, u); OCC.set(mat, occ);
  addShaderHook(mat, 'nf', (sh) => {
    sh.uniforms.uNearFade = u;
    sh.uniforms.uNfOcc = occ;
    sh.uniforms.uNfFocus = NF_FOCUS;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNfPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvNfPos = mvPosition.xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNfPos;\nuniform vec2 uNearFade;\nuniform float uNfOcc;\nuniform vec4 uNfFocus;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      {
        float nfA = smoothstep(uNearFade.x, uNearFade.y, length(vNfPos));
        if (uNfOcc > 0.5 && uNfFocus.w > 0.0) {
          float nfT = dot(vNfPos, uNfFocus.xyz) / max(dot(uNfFocus.xyz, uNfFocus.xyz), 1e-4);
          if (nfT > 0.0 && nfT < 0.9) nfA = min(nfA, smoothstep(uNfFocus.w * 0.5, uNfFocus.w, length(vNfPos - uNfFocus.xyz * nfT)));
        }
        if (nfA < 0.999 && nfA <= fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))))) discard;
      }`);
  });
  return mat;
}

// kopya malzemeye (Material.clone kancayı taşımaz) kaynağın kategorisini uygular
export function inheritNearFade(dst, src) {
  const cat = nearFadeCategory(src);
  if (cat) nearFade(dst, cat);
  return dst;
}
// kancayı koruyarak kopyala (renk/parlaklık için klonlanan GLB malzemeleri)
export function cloneMat(m) { return inheritNearFade(m.clone(), m); }

export function nearFadeAll(root, cat) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) nearFade(m, cat);
  });
}

// GLB model adı → kategori (assets.js yüklemesi ve ada örnekleri için)
const CHAR_MODELS = /^(adventurer|hooded_adventurer|pirate|skeleton_crew|skeleton|ghost|ghost_skull|crab|bat|frog|worker|wolf|fox|deer|stag|husky|cat|yeti|zombie|orc_brute|demon)$/;
export function nearFadeCatForModel(name) {
  if (CHAR_MODELS.test(name)) return 'char';
  if (/floor|tile|wall|stairs|castle|tower|mine|gate/i.test(name)) return null; // zemin/yapı: kamera çarpışması korur
  if (/tree|palm|bush|cactus|flower|mushroom|fern|grass|plant|dead/i.test(name)) return 'veg';
  if (/rock|crystal|stump|log|column|obelisk|campfire|tent|fence|barrel|crate|chest/i.test(name)) return 'prop';
  return null;
}
