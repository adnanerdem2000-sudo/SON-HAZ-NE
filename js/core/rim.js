import * as THREE from 'three';

// Karakterler için kenar ışığı (rim light): siluetleri arka plandan ayırır.
// Renk ve şiddet gökyüzüne göre her karede güncellenir (gündüz ufuk rengi, gece ay ışığı).
export const RIM = {
  uRimColor: { value: new THREE.Color(1, 0.95, 0.85) },
  uRimStrength: { value: 0.3 },
};

const base = THREE.Material.prototype.onBeforeCompile;

export function applyRim(mat) {
  if (!mat || !mat.isMeshStandardMaterial || mat.userData.rim) return;
  if (mat.onBeforeCompile !== base) return; // başka bir özel gölgelendiricisi var
  mat.userData.rim = true;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRimColor = RIM.uRimColor;
    sh.uniforms.uRimStrength = RIM.uRimStrength;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>', 'float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\noutgoingLight += uRimColor * pow(rimF, 3.0) * uRimStrength;\n#include <opaque_fragment>');
  };
  mat.needsUpdate = true;
}

export function rimAll(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material)) o.material.forEach(applyRim);
    else applyRim(o.material);
  });
}
