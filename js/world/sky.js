import * as THREE from 'three';
import { clamp, lerp, smoothstep, rng } from '../core/util.js';
import { ocean } from './ocean.js';
import { ISLANDS } from './worldData.js';

export const WEATHERS = {
  gunesli:   { name: 'Güneşli', clouds: 0.15, rain: 0, fog: 0, wind: 0.55, waves: 0.85, lightning: 0, dark: 0 },
  bulutlu:   { name: 'Bulutlu', clouds: 0.55, rain: 0, fog: 0.1, wind: 0.65, waves: 1.0, lightning: 0, dark: 0.15 },
  hafifyagmur: { name: 'Hafif Yağmur', clouds: 0.75, rain: 0.35, fog: 0.25, wind: 0.7, waves: 1.15, lightning: 0, dark: 0.3 },
  yagmur:    { name: 'Şiddetli Yağmur', clouds: 0.9, rain: 0.85, fog: 0.4, wind: 0.85, waves: 1.5, lightning: 0.15, dark: 0.45 },
  sisli:     { name: 'Sisli', clouds: 0.45, rain: 0, fog: 1.0, wind: 0.25, waves: 0.6, lightning: 0, dark: 0.2 },
  firtina:   { name: 'Fırtına', clouds: 1.0, rain: 1.0, fog: 0.5, wind: 1.0, waves: 2.4, lightning: 1.0, dark: 0.6 },
};
const WEATHER_TABLE = [
  ['gunesli', 34], ['bulutlu', 24], ['hafifyagmur', 14], ['yagmur', 9], ['sisli', 10], ['firtina', 6],
];

const C = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const DAY_Z = C(0.24, 0.52, 0.92), DAY_H = C(0.72, 0.86, 0.98);
const SET_Z = C(0.28, 0.32, 0.6), SET_H = C(1.0, 0.56, 0.32);
const NIGHT_Z = C(0.012, 0.02, 0.06), NIGHT_H = C(0.04, 0.07, 0.13);
const STORM_Z = C(0.3, 0.33, 0.37), STORM_H = C(0.48, 0.5, 0.53);

export const sky = {
  hour: 9,
  dayMinutes: 24, // gerçek dakika cinsinden tam gün
  weatherKey: 'gunesli',
  weather: { ...WEATHERS.gunesli },
  target: WEATHERS.gunesli,
  weatherTimer: 240,
  windDir: 0.6, // radyan, rüzgârın estiği yön
  windStrength: 0.55,
  lightningFlash: 0,
  sunDir: new THREE.Vector3(),
  lightLevel: 1,
  underwater: false,
  inCave: 0,
  locked: false,
  onThunder: null,
  r: rng(Date.now() & 0xffff),

  build(scene, renderer, quality = 'high') {
    this.scene = scene;
    const geo = new THREE.SphereGeometry(4000, 48, 24);
    this.uniforms = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunColor: { value: new THREE.Color() },
      uClouds: { value: 0.2 },
      uTime: { value: 0 },
      uNight: { value: 0 },
      uDark: { value: 0 },
      uWind: { value: new THREE.Vector2(1, 0) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
      fragmentShader: `
        uniform vec3 uZenith, uHorizon, uSunDir, uSunColor; uniform float uClouds, uTime, uNight, uDark; uniform vec2 uWind;
        varying vec3 vDir;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
        void main(){
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.05, 0.6, y), 0.7));
          if (y < 0.0) col = mix(uHorizon, uHorizon*0.6, smoothstep(0.0, -0.3, y));
          float sd = max(dot(d, uSunDir), 0.0);
          // güneş + hale
          col += uSunColor * (pow(sd, 900.0)*6.0 + pow(sd, 18.0)*0.22) * (1.0 - uDark*0.8);
          // ay
          vec3 md = -uSunDir;
          float mdot = max(dot(d, normalize(md + vec3(0.0,0.15,0.0))), 0.0);
          col += vec3(0.85,0.9,1.0) * smoothstep(0.9993, 0.9996, mdot) * uNight * (1.0-uDark);
          // yıldızlar
          if (y > 0.0 && uNight > 0.01) {
            vec2 sp = d.xz / (y + 0.4) * 160.0;
            float s = h(floor(sp));
            float tw = 0.6 + 0.4*sin(uTime*3.0 + s*50.0);
            col += vec3(1.0) * step(0.9965, s) * uNight * tw * smoothstep(0.0, 0.3, y) * (1.0 - uClouds);
          }
          // bulutlar
          if (y > 0.0) {
            vec2 cp = d.xz / (y + 0.12) * 1.6 + uWind * uTime * 0.004;
            float c = fbm(cp);
            float cov = smoothstep(1.0 - uClouds*0.85 - 0.08, 1.05 - uClouds*0.6, c + 0.12);
            vec3 cc = mix(vec3(1.0), vec3(0.55,0.57,0.6), uDark);
            float lit = 0.75 + 0.25*sd;
            cc *= mix(1.0, 0.08, uNight) * lit;
            cc = mix(cc, uHorizon*1.15, 0.25);
            col = mix(col, cc, cov * smoothstep(0.0, 0.12, y));
          }
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.dome = new THREE.Mesh(geo, mat);
    this.dome.renderOrder = -10;
    this.dome.frustumCulled = false;
    scene.add(this.dome);

    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = quality !== 'low';
    const sm = quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera;
    sc.left = -55; sc.right = 55; sc.top = 55; sc.bottom = -55; sc.near = 1; sc.far = 300;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun);
    scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfdfff, 0x6a5a40, 0.9);
    scene.add(this.hemi);
    scene.fog = new THREE.FogExp2(0xbfd8f0, 0.0012);

    // Yağmur
    const N = quality === 'low' ? 900 : 2200;
    const rp = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 60, y = Math.random() * 30, z = (Math.random() - 0.5) * 60;
      rp.set([x, y, z, x + 0.05, y - 0.9, z], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.0, depthWrite: false, fog: false }));
    this.rain.frustumCulled = false;
    this.rainCount = N;
    scene.add(this.rain);
  },

  setWeather(key, instant = false) {
    this.weatherKey = key;
    this.target = WEATHERS[key];
    this.weatherTimer = 180 + this.r() * 260;
    if (instant) Object.assign(this.weather, this.target);
  },

  randomWeather() {
    const tot = WEATHER_TABLE.reduce((a, b) => a + b[1], 0);
    let x = this.r() * tot;
    for (const [k, w] of WEATHER_TABLE) { x -= w; if (x <= 0) return k; }
    return 'gunesli';
  },

  isNight() { return this.hour < 5.5 || this.hour > 19.5; },

  update(dt, focus, camera, isHost = true) {
    if (!this.dome) return;
    if (!this.locked) this.hour = (this.hour + dt * (24 / (this.dayMinutes * 60))) % 24;
    // hava geçişleri
    if (isHost && !this.locked) {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) this.setWeather(this.randomWeather());
    }
    const W = this.weather, T = this.target;
    const k = 1 - Math.exp(-dt / 25);
    for (const key of ['clouds', 'rain', 'fog', 'wind', 'waves', 'lightning', 'dark']) W[key] = lerp(W[key], T[key], k);
    // rüzgâr yönü yavaşça değişir
    this.windDir += Math.sin(performance.now() * 0.00003) * dt * 0.01;
    this.windStrength = W.wind;
    ocean.waveScale = W.waves;

    // Hayalet adası sisi
    let regionFog = 0;
    const kemik = ISLANDS.find((i) => i.id === 'kemik');
    if (focus) {
      const d = Math.hypot(focus.x - kemik.x, focus.z - kemik.z);
      regionFog = smoothstep(kemik.r * 2.4, kemik.r * 1.1, d) * (this.isNight() ? 1 : 0.6);
    }
    this.regionFog = regionFog;

    // güneş konumu
    const th = (this.hour / 24) * Math.PI * 2 - Math.PI / 2;
    const sd = this.sunDir.set(Math.cos(th), Math.sin(th), 0.38).normalize();
    const elev = sd.y;
    const day = smoothstep(-0.12, 0.25, elev);
    const sunset = smoothstep(0.45, 0.05, Math.abs(elev)) * smoothstep(-0.2, 0.0, elev);
    const night = 1 - smoothstep(-0.25, 0.02, elev);

    const z = new THREE.Color().copy(NIGHT_Z).lerp(DAY_Z, day);
    const hcol = new THREE.Color().copy(NIGHT_H).lerp(DAY_H, day);
    z.lerp(SET_Z, sunset * 0.6);
    hcol.lerp(SET_H, sunset * 0.75);
    const storm = W.dark;
    z.lerp(STORM_Z.clone().multiplyScalar(0.25 + day * 0.75), storm);
    hcol.lerp(STORM_H.clone().multiplyScalar(0.2 + day * 0.8), storm);
    if (regionFog > 0) {
      const gz = C(0.25, 0.4, 0.42).multiplyScalar(0.2 + day * 0.6);
      z.lerp(gz, regionFog * 0.5);
      hcol.lerp(C(0.4, 0.55, 0.55).multiplyScalar(0.15 + day * 0.7), regionFog * 0.7);
    }
    // şimşek
    if (W.lightning > 0.3 && isHost && Math.random() < dt * 0.06 * W.lightning) this.flash();
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3);
    const lf = this.lightningFlash;
    if (lf > 0) { z.lerp(C(0.8, 0.85, 1), lf * 0.6); hcol.lerp(C(0.9, 0.92, 1), lf * 0.6); }

    const u = this.uniforms;
    u.uZenith.value.copy(z);
    u.uHorizon.value.copy(hcol);
    u.uSunDir.value.copy(sd);
    const sunCol = C(1.0, 0.93, 0.82).lerp(C(1.0, 0.55, 0.25), sunset);
    u.uSunColor.value.copy(sunCol);
    u.uClouds.value = W.clouds;
    u.uTime.value += dt;
    u.uNight.value = night;
    u.uDark.value = storm;
    u.uWind.value.set(Math.cos(this.windDir), Math.sin(this.windDir));

    // ışıklar
    const caveDark = this.inCave;
    const lightDir = elev > -0.05 ? sd : new THREE.Vector3(-sd.x, -sd.y, sd.z).normalize();
    const dirInt = elev > -0.05 ? (0.4 + 2.4 * day) * (1 - storm * 0.65) : 0.35 * night * (1 - storm * 0.5);
    this.sun.intensity = (dirInt + lf * 3) * (1 - caveDark * 0.97);
    this.sun.color.copy(elev > -0.05 ? sunCol : C(0.6, 0.7, 1.0));
    if (focus) {
      this.sun.target.position.set(focus.x, focus.y, focus.z);
      this.sun.position.set(focus.x + lightDir.x * 120, focus.y + lightDir.y * 120, focus.z + lightDir.z * 120);
    }
    const hemiInt = (0.25 + 0.85 * day) * (1 - storm * 0.3) + lf;
    this.hemi.intensity = hemiInt * (1 - caveDark * 0.88);
    this.hemi.color.copy(z).lerp(C(1, 1, 1), 0.35);
    this.hemi.groundColor.copy(C(0.42, 0.36, 0.26)).multiplyScalar(0.3 + day * 0.7);
    this.lightLevel = clamp(0.12 + day * 0.9 - storm * 0.3 + lf, 0.08, 1.1) * (1 - caveDark * 0.8);

    // sis
    const fog = this.scene.fog;
    if (this.underwater) {
      fog.color.copy(C(0.05, 0.32, 0.38)).multiplyScalar(0.3 + day * 0.7);
      fog.density = 0.045;
    } else {
      fog.color.copy(hcol);
      fog.density = 0.0011 + W.fog * 0.009 + regionFog * 0.012 + W.rain * 0.002;
    }
    // okyanus
    const ou = ocean.uniforms;
    if (ou) {
      ou.uSunDir.value.copy(sd);
      ou.uSunColor.value.copy(sunCol).multiplyScalar(day * (1 - storm));
      ou.uSkyColor.value.copy(z);
      ou.uHorizon.value.copy(hcol);
      ou.uFogColor.value.copy(fog.color);
      ou.uFogDensity.value = this.underwater ? 0.0 : fog.density;
      ou.uLight.value = this.lightLevel;
      ou.uGhost.value = regionFog;
    }
    // yağmur
    if (this.rain && camera) {
      const ri = W.rain;
      this.rain.material.opacity = ri * 0.45 * (this.underwater ? 0 : 1);
      this.rain.visible = ri > 0.02 && !this.inCave;
      if (this.rain.visible) {
        const p = this.rain.geometry.attributes.position.array;
        const fall = dt * 26;
        const wx = Math.cos(this.windDir) * W.wind * dt * 6, wz = Math.sin(this.windDir) * W.wind * dt * 6;
        for (let i = 0; i < this.rainCount; i++) {
          const o = i * 6;
          p[o + 1] -= fall; p[o + 4] -= fall;
          p[o] += wx; p[o + 3] += wx; p[o + 2] += wz; p[o + 5] += wz;
          if (p[o + 1] < -2) {
            const x = (Math.random() - 0.5) * 60, y = 28 + Math.random() * 4, zz = (Math.random() - 0.5) * 60;
            p[o] = x; p[o + 1] = y; p[o + 2] = zz; p[o + 3] = x + 0.05 + wx * 4; p[o + 4] = y - 0.9; p[o + 5] = zz + wz * 4;
          }
        }
        this.rain.geometry.attributes.position.needsUpdate = true;
        this.rain.position.set(camera.position.x, camera.position.y - 10, camera.position.z);
      }
    }
    if (camera) this.dome.position.copy(camera.position);
  },

  flash() {
    this.lightningFlash = 1;
    if (this.onThunder) setTimeout(() => this.onThunder(), 300 + Math.random() * 1500);
  },

  timeString() {
    const h = Math.floor(this.hour), m = Math.floor((this.hour % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },
};
