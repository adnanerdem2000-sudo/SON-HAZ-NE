import * as THREE from 'three';

// Sıfır uzunluklu normal NaN üretir. Düz gölgelemede (flatShading) normal ekran türevlerinden hesaplanır:
// normalize(cross(dFdx, dFdy)). Ekran kenarında ya da çok ince/üst üste binen üçgende bu çarpım sıfır olunca normalize NaN
// veriyor, pikselin ışıklandırması NaN oluyordu; yumuşak gölgelemede de dejenere köşe normali (sıfır) aynı sonucu verir. Tek bir NaN
// piksel parlama (bloom) bulanıklığıyla tüm ekrana yayılıp kareyi tümden siyah yapıyordu. Ölçüldü: kamera dönerken ~2 400
// karede bir; yarım kayan noktalı hedefte 3 bozuk piksel, ikiye bölme testi suçluyu rüzgârla sallanan orman ağaçlarına (264 örnek,
// flatShading) indirdi. Normal sıfır ya da NaN ise kameraya bakan (görüş uzayı +Z) yedek normal kullanılır.
// Bu modül, hiçbir malzeme derlenmeden önce yüklenmelidir (engine.js ilk satırlarda içe aktarır).
const C = THREE.ShaderChunk;
const FLAT = 'vec3 normal = normalize( cross( fdx, fdy ) );';
const SMOOTH = 'vec3 normal = normalize( vNormal );';
let src = C.normal_fragment_begin;
if (src.includes(FLAT)) src = src.replace(FLAT, 'vec3 normal = cross( fdx, fdy );\n\tnormal = dot( normal, normal ) > 1e-24 ? normalize( normal ) : vec3( 0.0, 0.0, 1.0 );');
if (src.includes(SMOOTH)) src = src.replace(SMOOTH, 'vec3 normal = dot( vNormal, vNormal ) > 1e-24 ? normalize( vNormal ) : vec3( 0.0, 0.0, 1.0 );');
C.normal_fragment_begin = src;

export const shaderFixApplied = src.includes('1e-24');
