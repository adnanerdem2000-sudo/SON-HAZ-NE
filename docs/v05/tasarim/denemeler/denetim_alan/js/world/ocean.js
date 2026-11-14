import * as THREE from 'three';
import { terrain } from './terrain.js';
import { smoothstep } from '../core/util.js';

// Dalga bileşenleri: yön, dalga boyu, genlik
const WAVES = [
  { dx: 1.0, dz: 0.3, L: 62, A: 0.55 },
  { dx: 0.7, dz: -0.8, L: 33, A: 0.30 },
  { dx: -0.4, dz: 1.0, L: 17.5, A: 0.15 },
  { dx: 0.25, dz: 0.95, L: 9.1, A: 0.07 },
  { dx: -0.9, dz: -0.25, L: 5.3, A: 0.035 },
];
for (const w of WAVES) {
  const l = Math.hypot(w.dx, w.dz);
  w.dx /= l; w.dz /= l;
  w.k = (Math.PI * 2) / w.L;
  w.w = Math.sqrt(9.81 * w.k) * 0.8;
}

export const ocean = {
  time: 0,
  waveScale: 1,
  tide: 0,
  mesh: null,
  uniforms: null,

  // Barınak (liman): merkez çevresinde dalgalar ×0.2'ye iner (r0 içinde tam, r1'de normal). Liman kanalı 9 m derin
  // olduğundan kıyı sönümü işlemiyor ve iskele merdiveninde ±1.1 m dalga kip titreşimine yol açıyordu.
  shelter: null,
  setShelter(x, z, r0, r1) {
    this.shelter = r1 > r0 ? { x, z, r0, r1 } : null;
    if (this.uniforms) this.uniforms.uShelter.value.set(x, z, r0, this.shelter ? r1 : 0);
  },
  // Kıyıya yaklaştıkça dalgalar sönümlenir
  shoreFactor(x, z) {
    const depth = this.tide - terrain.heightAt(x, z);
    let f = 0.15 + 0.85 * smoothstep(0.0, 9.0, depth);
    const S = this.shelter;
    if (S) f *= 0.2 + 0.8 * smoothstep(S.r0, S.r1, Math.hypot(x - S.x, z - S.z));
    return f;
  },

  heightAt(x, z, t = this.time) {
    const s = this.waveScale * this.shoreFactor(x, z);
    let h = 0;
    for (let i = 0; i < WAVES.length; i++) {
      const w = WAVES[i];
      h += w.A * Math.sin(w.k * (w.dx * x + w.dz * z) - w.w * t + i * 1.7);
    }
    return h * s + this.tide;
  },

  normalAt(x, z, out = new THREE.Vector3(), t = this.time) {
    const s = this.waveScale * this.shoreFactor(x, z);
    let gx = 0, gz = 0;
    for (let i = 0; i < WAVES.length; i++) {
      const w = WAVES[i];
      const c = Math.cos(w.k * (w.dx * x + w.dz * z) - w.w * t + i * 1.7) * w.A * w.k * s;
      gx += c * w.dx; gz += c * w.dz;
    }
    return out.set(-gx, 1, -gz).normalize();
  },

  build(scene, quality = 'high') {
    const res = quality === 'low' ? 160 : quality === 'medium' ? 220 : 300;
    const R = 3200, P = 2.6;
    const verts = res * res;
    const pos = new Float32Array(verts * 3);
    let k = 0;
    for (let j = 0; j < res; j++) {
      const v = (j / (res - 1)) * 2 - 1;
      const z = Math.sign(v) * R * Math.pow(Math.abs(v), P);
      for (let i = 0; i < res; i++) {
        const u = (i / (res - 1)) * 2 - 1;
        const x = Math.sign(u) * R * Math.pow(Math.abs(u), P);
        pos[k++] = x; pos[k++] = 0; pos[k++] = z;
      }
    }
    const idx = new Uint32Array((res - 1) * (res - 1) * 6);
    let q = 0;
    for (let j = 0; j < res - 1; j++) for (let i = 0; i < res - 1; i++) {
      const a = j * res + i, b = a + 1, c = a + res, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b;
      idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R * 1.5);

    const waveVec = WAVES.map((w, i) => new THREE.Vector4(w.dx, w.dz, w.k, w.w));
    const waveAmp = WAVES.map((w, i) => new THREE.Vector2(w.A, i * 1.7));
    this.uniforms = {
      uTime: { value: 0 },
      uWaveScale: { value: 1 },
      uWaves: { value: waveVec },
      uAmps: { value: waveAmp },
      uHeight: { value: this._emptyDepth() },
      uHMin: { value: new THREE.Vector2(-1e6, -1e6) },
      uHSize: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2).normalize() },
      uSunColor: { value: new THREE.Color(1, 0.95, 0.85) },
      uSkyColor: { value: new THREE.Color(0.55, 0.75, 0.95) },
      uHorizon: { value: new THREE.Color(0.8, 0.88, 0.95) },
      uShallow: { value: new THREE.Color().setRGB(0.25, 0.85, 0.80, THREE.SRGBColorSpace) },
      uMid: { value: new THREE.Color().setRGB(0.05, 0.55, 0.68, THREE.SRGBColorSpace) },
      uDeep: { value: new THREE.Color().setRGB(0.02, 0.2, 0.42, THREE.SRGBColorSpace) },
      uFogColor: { value: new THREE.Color(0.8, 0.88, 0.95) },
      uFogDensity: { value: 0.0012 },
      uLight: { value: 1.0 },
      uCamPos: { value: new THREE.Vector3() },
      uGhost: { value: 0 },
      uTide: { value: 0 },
      uRain: { value: 0 },
      uShelter: { value: new THREE.Vector4(0, 0, 0, 0) }, // x, z, r0, r1 (r1 = 0: kapalı)
    };
    if (this.shelter) this.uniforms.uShelter.value.set(this.shelter.x, this.shelter.z, this.shelter.r0, this.shelter.r1);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      vertexShader: /* glsl */`
        uniform float uTime, uWaveScale, uHSize, uTide;
        uniform vec4 uShelter;
        uniform vec2 uHMin;
        uniform vec4 uWaves[5];
        uniform vec2 uAmps[5];
        uniform sampler2D uHeight;
        varying vec3 vW;
        varying vec3 vN;
        varying float vDepth;
        varying float vCrest;
        float terrainH(vec2 p){ vec2 uv = (p - uHMin)/uHSize; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -30.0; return texture2D(uHeight, uv).r; }
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          float th = terrainH(wp.xz);
          float depth = uTide - th;
          float s = uWaveScale * (0.15 + 0.85*smoothstep(0.0, 9.0, depth));
          if (uShelter.w > uShelter.z) s *= 0.2 + 0.8*smoothstep(uShelter.z, uShelter.w, distance(wp.xz, uShelter.xy));
          float h = 0.0; vec2 g = vec2(0.0);
          for(int i=0;i<5;i++){
            vec4 w = uWaves[i];
            float ph = w.z*dot(w.xy, wp.xz) - w.w*uTime + uAmps[i].y;
            h += uAmps[i].x*sin(ph);
            g += cos(ph)*uAmps[i].x*w.z*w.xy;
          }
          h *= s; g *= s;
          wp.y = h + uTide;
          vW = wp.xyz;
          vN = normalize(vec3(-g.x, 1.0, -g.y));
          vDepth = h + uTide - th;
          vCrest = h;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uFogDensity, uLight, uGhost, uWaveScale, uRain, uHSize;
        uniform vec2 uHMin;
        uniform vec3 uSunDir, uSunColor, uSkyColor, uHorizon, uShallow, uMid, uDeep, uFogColor, uCamPos;
        uniform sampler2D uHeight;
        varying vec3 vW; varying vec3 vN; varying float vDepth; varying float vCrest;
        float terrainHF(vec2 q){ vec2 uv = (q - uHMin)/uHSize; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -30.0; return texture2D(uHeight, uv).r; }
        float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float vn(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hh(i),hh(i+vec2(1,0)),f.x), mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x), f.y); }
        void main(){
          vec3 V = normalize(uCamPos - vW);
          float dist = length(uCamPos - vW);
          // ince dalgacıklar
          vec2 p = vW.xz;
          float e = 0.15;
          float r0 = vn(p*0.9 + uTime*vec2(0.3,0.2)) + 0.5*vn(p*2.3 - uTime*vec2(0.25,0.4));
          float rx = vn((p+vec2(e,0.0))*0.9 + uTime*vec2(0.3,0.2)) + 0.5*vn((p+vec2(e,0.0))*2.3 - uTime*vec2(0.25,0.4));
          float rz = vn((p+vec2(0.0,e))*0.9 + uTime*vec2(0.3,0.2)) + 0.5*vn((p+vec2(0.0,e))*2.3 - uTime*vec2(0.25,0.4));
          float fade = 1.0 - smoothstep(30.0, 220.0, dist);
          vec3 N = normalize(vN + vec3(r0-rx, 0.0, r0-rz)*0.55*fade);
          // yağmur halkaları
          float ripple = 0.0;
          if (uRain > 0.02 && dist < 60.0) {
            vec2 cell = floor(p*0.8);
            for (int j=0;j<2;j++) for (int i=0;i<2;i++) {
              vec2 c = cell + vec2(float(i), float(j));
              float rnd = hh(c);
              vec2 center = (c + vec2(hh(c+3.1), hh(c+7.7))) / 0.8;
              float ph = fract(uTime*0.9 + rnd);
              float rr = length(p - center) - ph*1.1;
              ripple += (1.0 - smoothstep(0.0, 0.07, abs(rr))) * (1.0 - ph) * step(0.35, rnd);
            }
            ripple *= uRain * (1.0 - smoothstep(20.0, 60.0, dist));
            N = normalize(N + vec3(ripple*0.18, 0.0, ripple*0.18));
          }
          if(!gl_FrontFacing){
            // su altından yüzey
            vec3 col = mix(vec3(0.15,0.55,0.6), vec3(0.6,0.9,0.95), pow(max(dot(-N, V),0.0), 3.0));
            gl_FragColor = vec4(col*uLight, 0.85);
            return;
          }
          float depth = max(vDepth, 0.0);
          vec3 base = mix(uShallow, uMid, smoothstep(0.3, 6.0, depth));
          base = mix(base, uDeep, smoothstep(6.0, 26.0, depth));
          base = mix(base, base*vec3(0.55,0.75,0.7), uGhost);
          float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
          vec3 R = reflect(-V, N);
          vec3 sky = mix(uHorizon, uSkyColor, smoothstep(0.0, 0.5, R.y));
          float diff = max(dot(N, uSunDir), 0.0)*0.35 + 0.65;
          vec3 col = base * diff * uLight;
          col = mix(col, sky, clamp(fres*0.85 + 0.06, 0.0, 1.0));
          float spec = pow(max(dot(R, uSunDir), 0.0), 420.0) * 3.0 + pow(max(dot(R, uSunDir), 0.0), 40.0)*0.12;
          col += uSunColor * spec * step(0.0, uSunDir.y);
          // dalga tepelerinde ışık geçirgenliği (turkuaz parıltı)
          float sss = smoothstep(0.15, 0.9, vCrest / max(uWaveScale, 0.3)) * pow(max(dot(V, -uSunDir) * 0.5 + 0.5, 0.0), 2.0);
          col += vec3(0.1, 0.55, 0.5) * sss * 0.45 * uLight;
          // parıltılar
          float glint = pow(max(dot(R, uSunDir), 0.0), 1200.0) * step(0.985, hh(floor(p*3.0 + uTime*0.5)));
          col += uSunColor * glint * 4.0 * fade;
          col += vec3(0.85) * ripple * 0.12;
          // köpük: kıyı + dalga tepeleri
          float fn = vn(p*1.6 + uTime*0.5)*0.6 + vn(p*4.0 - uTime*0.7)*0.4;
          // kıyı köpüğü: su derinliğini arazi eğimine bölerek kıyıya yatay uzaklığı bul (düz kumsallarda dar bant)
          float t0 = terrainHF(p), tx = terrainHF(p + vec2(1.5, 0.0)), tz = terrainHF(p + vec2(0.0, 1.5));
          float slope = max(length(vec2(tx - t0, tz - t0)) / 1.5, 0.02);
          float hd = depth / slope;
          float lap = sin(uTime*1.1 - hd*0.8 + fn*2.0)*0.5 + 0.5;
          float shore = (1.0 - smoothstep(0.0, 1.6 + lap*1.8, hd + fn*1.2)) * step(0.02, depth+0.3) * (1.0 - smoothstep(0.9, 1.4, depth));
          shore += (1.0 - smoothstep(0.0, 0.35, abs(hd - 3.0 - 4.0*fract(uTime*0.11 + fn*0.15)))) * 0.45 * (1.0 - smoothstep(0.6, 1.2, depth));
          float crest = smoothstep(0.62*uWaveScale, 1.05*uWaveScale, vCrest + fn*0.3*uWaveScale) * smoothstep(0.9, 1.6, uWaveScale);
          float foam = clamp(shore*0.9 + crest*0.8, 0.0, 1.0) * smoothstep(0.3, 0.55, fn);
          col = mix(col, vec3(0.95,0.98,1.0)*max(uLight,0.25), foam);
          float alpha = mix(0.42, 0.97, smoothstep(0.0, 5.0, depth));
          alpha = max(alpha, foam);
          alpha = mix(alpha, 1.0, fres*0.6);
          // sis
          float fog = 1.0 - exp(-uFogDensity*uFogDensity*dist*dist);
          col = mix(col, uFogColor, fog);
          alpha = mix(alpha, 1.0, fog);
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.mesh.name = 'ocean';
    scene.add(this.mesh);
    terrain.onDepth = (m) => this.setDepth(m);
    if (this._pendingDepth) { this.setDepth(this._pendingDepth); this._pendingDepth = null; }
    return this.mesh;
  },

  _emptyDepth() {
    const t = new THREE.DataTexture(new Uint16Array([THREE.DataUtils.toHalfFloat(-30)]), 1, 1, THREE.RedFormat, THREE.HalfFloatType);
    t.needsUpdate = true;
    return t;
  },

  // arazi işçisinden gelen kayan derinlik penceresi
  setDepth(m) {
    if (!this.uniforms) { this._pendingDepth = m; return; }
    const tex = new THREE.DataTexture(m.data, m.res, m.res, THREE.RedFormat, THREE.HalfFloatType);
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    const old = this.uniforms.uHeight.value;
    this.uniforms.uHeight.value = tex;
    this.uniforms.uHMin.value.set(m.x0, m.z0);
    this.uniforms.uHSize.value = m.size;
    old?.dispose();
  },

  update(dt, camera) {
    this.time += dt;
    if (!this.mesh) return;
    terrain.requestDepth(camera.position.x, camera.position.z);
    const u = this.uniforms;
    u.uTime.value = this.time;
    u.uTide.value = this.tide; // gelgit: çizilen yüzey fizik yüksekliğiyle (heightAt) aynı seviyede
    u.uWaveScale.value = this.waveScale;
    u.uCamPos.value.copy(camera.position);
    this.mesh.position.set(Math.round(camera.position.x / 4) * 4, 0, Math.round(camera.position.z / 4) * 4);
  },
};
