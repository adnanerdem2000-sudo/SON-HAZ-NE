import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { sky, WEATHERS } from './sky.js';
import { terrain } from './terrain.js';
import { ocean } from './ocean.js';
import { effects } from '../game/effects.js';
import { audio } from '../core/audio.js';
import { clamp, lerp, rng, smoothstep, damp } from '../core/util.js';
import { mergeGeos, colorize } from './props.js';

const R_CLOUD = 2200;
const RAINY = new Set(['ciseleme', 'saganak', 'firtina']);

// 3B bulut kümesi: düzleştirilmiş tabanlı, alt kısmı gölgeli puf kümeleri
function cloudGeometry(seed) {
  const r = rng(seed);
  const geos = [];
  const n = 7 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const rad = 16 + r() * 22;
    const g = new THREE.IcosahedronGeometry(rad, 2);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      p.setY(k, y < -rad * 0.25 ? -rad * 0.25 + (y + rad * 0.25) * 0.15 : y);
    }
    const a = r() * Math.PI * 2, d = i === 0 ? 0 : 20 + r() * 45;
    g.translate(Math.cos(a) * d * 1.4, r() * 14 + (i === 0 ? 10 : 0), Math.sin(a) * d * 0.8);
    g.computeVertexNormals();
    const gn = g.toNonIndexed();
    const pos = gn.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k);
      const v = clamp(0.62 + (y + 10) / 70, 0.6, 1.0);
      col[k * 3] = v; col[k * 3 + 1] = v; col[k * 3 + 2] = v * 1.02;
    }
    gn.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(gn);
  }
  return mergeGeos(geos);
}

function softSpriteTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export const weatherfx = {
  name: 'weatherfx',
  spouts: [],
  bolts: [],
  rainbow: null,

  init(scene) {
    this.scene = scene;
    // ---- bulutlar ----
    this.cloudMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x404448, fog: true });
    this.cloudSets = [];
    const R = rng(77);
    for (let v = 0; v < 3; v++) {
      const im = new THREE.InstancedMesh(cloudGeometry(100 + v * 7), this.cloudMat, 30);
      im.frustumCulled = false;
      im.count = 0;
      scene.add(im);
      const list = [];
      for (let i = 0; i < 30; i++) list.push({ x: (R() - 0.5) * 2 * R_CLOUD, z: (R() - 0.5) * 2 * R_CLOUD, y: 200 + R() * 60, s: 0.8 + R() * 0.9, rot: R() * 6.28, rank: R() });
      list.sort((a, b) => a.rank - b.rank);
      this.cloudSets.push({ im, list });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._v = new THREE.Vector3(); this._s = new THREE.Vector3();

    // ---- sis kümeleri ----
    const fogTex = softSpriteTexture();
    this.fogSprites = [];
    for (let i = 0; i < 28; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, color: 0xdde6ea, transparent: true, opacity: 0, depthWrite: false, fog: true }));
      sp.scale.set(70, 22, 1);
      sp.userData = { ox: (Math.random() - 0.5) * 300, oz: (Math.random() - 0.5) * 300, oy: 2 + Math.random() * 6, drift: Math.random() * 6.28 };
      scene.add(sp);
      this.fogSprites.push(sp);
    }

    // ---- gökkuşağı ----
    const rg = new THREE.TorusGeometry(1400, 60, 8, 96, Math.PI);
    const rmat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uOpacity; varying vec2 vUv;
        vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0); }
        void main(){
          float t = vUv.y; // tüp çevresi
          float band = smoothstep(0.0, 0.18, t) * smoothstep(0.5, 0.32, t);
          vec3 c = hue(clamp((t - 0.05) / 0.42, 0.0, 1.0) * 0.8);
          float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          gl_FragColor = vec4(pow(c, vec3(2.2)) * band * edge * uOpacity, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.rainbow = new THREE.Mesh(rg, rmat);
    this.rainbow.visible = false;
    this.rainbow.frustumCulled = false;
    scene.add(this.rainbow);
    this.rainbowT = 0;

    // ---- yıldırım ışığı ----
    this.boltLight = new THREE.PointLight(0xcfe0ff, 0, 900, 1.2);
    scene.add(this.boltLight);
    sky.onBolt = () => this.strike();

    // ---- hortum malzemesi ----
    this.spoutMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      uniforms: { uTime: { value: 0 }, uLight: { value: 1 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying float vFogDepth; uniform float uTime;
        void main(){ vUv = uv; vec3 p = position; float k = uv.y; p.x += sin(k*6.0 + uTime*1.3)*6.0*k; p.z += cos(k*5.0 + uTime*1.1)*6.0*k;
          vec4 mv = modelViewMatrix*vec4(p,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform float uTime, uLight; uniform vec3 fogColor; uniform float fogDensity; varying vec2 vUv; varying float vFogDepth;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float sw = n(vec2(vUv.x*12.0 - uTime*2.5 + vUv.y*6.0, vUv.y*10.0 - uTime*1.5));
          float a = (0.35 + sw*0.5) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          vec3 c = mix(vec3(0.42,0.46,0.5), vec3(0.75,0.8,0.85), sw) * uLight;
          float fog = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
          gl_FragColor = vec4(mix(pow(c, vec3(2.2)), fogColor, fog), a * 0.85);
          #include <colorspace_fragment>
        }`,
    });

    sky.onChange = (e) => this._weatherChanged(e);
  },

  start() {
    for (const s of this.spouts) this.scene.remove(s.mesh);
    this.spouts = [];
    this.spoutT = 40;
    this.rainbowT = 0;
    this.rainbow.visible = false;
  },
  stop() { this.start(); },

  _weatherChanged(e) {
    if (G.state !== 'playing') return;
    if (e.instant) return;
    const W = WEATHERS[e.to];
    const msgs = {
      acik: 'Bulutlar dağılıyor, gökyüzü açılıyor.', parcali: 'Gökyüzünde parçalı bulutlar beliriyor.', bulutlu: 'Gökyüzü kapanıyor.',
      ciseleme: 'İnce bir yağmur çiselemeye başladı.', saganak: 'Sağanak yağmur bastırıyor! Güverte kayganlaşacak.',
      firtina: 'FIRTINA geliyor! Yelkenleri azalt, gemiyi sağlam tut.', sisli: 'Denizden yoğun bir sis yükseliyor — görüş azalıyor.',
      ruzgarli: 'Sert bir rüzgâr esmeye başladı — yelkenler gerilecek, dalgalar büyüyecek.',
    };
    G.notify(`${W.icon} ${msgs[e.to] || W.name}`, e.to === 'firtina' ? 'boss' : 'event', 5000);
    G.emit('weatherChanged', e);
    // yağmur sonrası gökkuşağı
    if (RAINY.has(e.from) && !RAINY.has(e.to) && e.to !== 'sisli' && sky.dayFactor > 0.5) {
      this.rainbowT = 150;
      setTimeout(() => G.notify('🌈 Ufukta bir gökkuşağı belirdi.', 'discover', 4000), 8000);
    }
  },

  // Yıldırım: gerçek bir çarpma çizgisi + ışık + mesafeye göre gecikmeli gök gürültüsü
  strike(at = null) {
    const cam = G.camera;
    if (!cam) return;
    let x, z;
    if (at) { x = at.x; z = at.z; }
    else {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 520;
      x = cam.position.x + Math.cos(a) * d; z = cam.position.z + Math.sin(a) * d;
    }
    const ground = Math.max(terrain.heightAt(x, z), ocean.heightAt(x, z));
    const top = 230;
    const pts = [];
    let px = x + (Math.random() - 0.5) * 40, pz = z + (Math.random() - 0.5) * 40;
    const segs = 14;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = lerp(top, ground, t);
      const j = (1 - t) * 14;
      pts.push(new THREE.Vector3(lerp(px, x, t) + (Math.random() - 0.5) * j, y, lerp(pz, z, t) + (Math.random() - 0.5) * j));
    }
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xdfeaff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const addTube = (points, r) => {
      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 3, r, 4, false), mat));
    };
    addTube(pts, 1.1);
    // dallar
    for (let b = 0; b < 3; b++) {
      const si = 2 + Math.floor(Math.random() * 8);
      const start = pts[si];
      const bp = [start.clone()];
      let cur = start.clone();
      for (let i = 0; i < 5; i++) { cur = cur.clone().add(new THREE.Vector3((Math.random() - 0.5) * 22, -12 - Math.random() * 10, (Math.random() - 0.5) * 22)); bp.push(cur); }
      addTube(bp, 0.45);
    }
    this.scene.add(group);
    this.bolts.push({ group, mat, t: 0 });
    this.boltLight.position.set(x, ground + 40, z);
    this.boltLight.intensity = 9000;
    if (Math.hypot(x - cam.position.x, z - cam.position.z) < 220) effects.sparks(x, ground + 0.5, z, 20, [0.85, 0.9, 1]);
    // çarptığı yerde gemi varsa hasar
    for (const s of G.ships) if (!s.sunk && Math.hypot(s.x - x, s.z - z) < 14 && G.isHost) { s.damage(10, new THREE.Vector3(0, 0, 0)); G.notify('Yıldırım gemiye çarptı!', 'warn'); }
    const dist = Math.hypot(x - cam.position.x, z - cam.position.z);
    setTimeout(() => audio.thunder(clamp(1.2 - dist / 900, 0.25, 1)), Math.min(6000, (dist / 340) * 1000));
  },

  spawnSpout() {
    const s = G.ship && !G.ship.sunk ? G.ship : null;
    const c = s ? new THREE.Vector3(s.x, 0, s.z) : G.player?.pos.clone();
    if (!c) return;
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, d = 180 + Math.random() * 200;
      const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
      if (terrain.heightAt(x, z) > -8) continue;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(34, 5, 260, 28, 20, true), this.spoutMat);
      mesh.position.set(x, 130, z);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      const head = Math.random() * Math.PI * 2;
      this.spouts.push({ mesh, x, z, t: 0, life: 70 + Math.random() * 50, vx: Math.cos(head) * 4, vz: Math.sin(head) * 4 });
      G.notify('🌪 Ufukta bir su hortumu oluştu! Ondan uzak dur.', 'boss', 5000);
      return;
    }
  },

  update(dt) {
    const cam = G.camera;
    if (!cam) return;
    const W = sky.weather;
    // ---- bulutlar ----
    const cover = W.clouds;
    const storm = W.dark;
    const wv = 4 + sky.windStrength * 12;
    const wx = Math.cos(sky.windDir) * wv * dt, wz = Math.sin(sky.windDir) * wv * dt;
    const tint = new THREE.Color(1, 1, 1).multiplyScalar(lerp(1, 0.48, storm) * (0.25 + 0.75 * sky.dayFactor));
    if (sky.sunset > 0.2) tint.lerp(new THREE.Color(1.0, 0.7, 0.55), sky.sunset * 0.45);
    this.cloudMat.color.copy(tint);
    this.cloudMat.emissive.setRGB(0.18, 0.19, 0.21).multiplyScalar(0.25 + 0.75 * sky.dayFactor * (1 - storm * 0.6));
    for (const set of this.cloudSets) {
      const want = Math.round(clamp(cover * 1.1, 0, 1) * set.list.length);
      let n = 0;
      for (let i = 0; i < set.list.length; i++) {
        const c = set.list[i];
        c.x += wx; c.z += wz;
        let dx = c.x - cam.position.x, dz = c.z - cam.position.z;
        if (dx > R_CLOUD) c.x -= 2 * R_CLOUD; else if (dx < -R_CLOUD) c.x += 2 * R_CLOUD;
        if (dz > R_CLOUD) c.z -= 2 * R_CLOUD; else if (dz < -R_CLOUD) c.z += 2 * R_CLOUD;
        if (i >= want) continue;
        const y = lerp(230, 120, storm) + (c.y - 200) * 0.5;
        const sc = c.s * (0.9 + cover * 0.7) * (1 + storm * 0.4);
        this._q.setFromAxisAngle(this._v.set(0, 1, 0), c.rot);
        this._s.set(sc * 1.3, sc * (0.8 + storm * 0.5), sc);
        this._m.compose(this._v.set(c.x, y, c.z), this._q, this._s);
        set.im.setMatrixAt(n++, this._m);
      }
      set.im.count = n;
      set.im.instanceMatrix.needsUpdate = true;
    }
    // ---- sis kümeleri ----
    const fogAmt = Math.max(W.fog, sky.regionFog || 0) * (sky.underwater ? 0 : 1);
    for (const sp of this.fogSprites) {
      const u = sp.userData;
      u.drift += dt * 0.05;
      u.ox += wx * 0.4; u.oz += wz * 0.4;
      if (u.ox > 160) u.ox -= 320; if (u.ox < -160) u.ox += 320;
      if (u.oz > 160) u.oz -= 320; if (u.oz < -160) u.oz += 320;
      const x = cam.position.x + u.ox, z = cam.position.z + u.oz;
      const ground = Math.max(terrain.heightAt(x, z), ocean.tide);
      sp.position.set(x, ground + u.oy + Math.sin(u.drift) * 1.5, z);
      const near = smoothstep(8, 40, Math.hypot(u.ox, u.oz));
      sp.material.opacity = damp(sp.material.opacity, fogAmt * 0.55 * near, 1.5, dt);
      sp.material.color.setRGB(0.8, 0.85, 0.88).multiplyScalar(0.3 + 0.7 * sky.lightLevel);
      sp.visible = sp.material.opacity > 0.01;
    }
    // ---- yıldırımlar ----
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.t += dt;
      b.mat.opacity = b.t < 0.08 ? 1 : b.t < 0.14 ? 0.2 : b.t < 0.22 ? 0.9 : Math.max(0, 1 - (b.t - 0.22) * 6);
      if (b.t > 0.45) { this.scene.remove(b.group); b.group.traverse((o) => o.geometry?.dispose()); this.bolts.splice(i, 1); }
    }
    this.boltLight.intensity = Math.max(0, this.boltLight.intensity - dt * 40000);
    // ---- gökkuşağı ----
    if (this.rainbowT > 0) {
      this.rainbowT -= dt;
      const anti = new THREE.Vector3(-sky.sunDir.x, 0, -sky.sunDir.z).normalize();
      this.rainbow.position.set(cam.position.x + anti.x * 2600, -250, cam.position.z + anti.z * 2600);
      this.rainbow.lookAt(cam.position.x, -250, cam.position.z);
      const fade = Math.min(1, (150 - this.rainbowT) / 10) * Math.min(1, this.rainbowT / 20) * (1 - W.rain) * sky.dayFactor;
      this.rainbow.material.uniforms.uOpacity.value = fade * 0.32;
      this.rainbow.visible = fade > 0.01;
    } else this.rainbow.visible = false;
    // ---- su hortumları ----
    this.spoutMat.uniforms.uTime.value += dt;
    this.spoutMat.uniforms.uLight.value = 0.4 + 0.6 * sky.lightLevel;
    if (G.scene?.fog) { this.spoutMat.uniforms.fogColor.value.copy(G.scene.fog.color); this.spoutMat.uniforms.fogDensity.value = G.scene.fog.density; }
    if (G.isHost && sky.weatherKey === 'firtina' && G.state === 'playing') {
      this.spoutT -= dt;
      if (this.spoutT <= 0) { this.spoutT = 70 + Math.random() * 60; if (this.spouts.length < 2) this.spawnSpout(); }
    }
    for (let i = this.spouts.length - 1; i >= 0; i--) {
      const s = this.spouts[i];
      s.t += dt;
      s.x += (s.vx + Math.cos(sky.windDir) * 3) * dt; s.z += (s.vz + Math.sin(sky.windDir) * 3) * dt;
      if (terrain.heightAt(s.x, s.z) > -2) s.t = Math.max(s.t, s.life - 3);
      const k = Math.min(1, s.t / 6) * Math.min(1, (s.life - s.t) / 6);
      s.mesh.position.set(s.x, 130, s.z);
      s.mesh.scale.set(k, Math.max(0.05, k), k);
      if (Math.random() < 0.6) effects.spawn(s.x + (Math.random() - 0.5) * 12, ocean.heightAt(s.x, s.z), s.z + (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, 6 + Math.random() * 8, (Math.random() - 0.5) * 8, 1.4, 0.9, 0.85, 0.9, 0.95, -6, 0.6, 0.8);
      // gemilere etkisi
      if (G.isHost) for (const ship of G.ships) {
        if (ship.sunk) continue;
        const d = Math.hypot(ship.x - s.x, ship.z - s.z);
        if (d < 40) {
          const f = 1 - d / 40;
          ship.yawRate = (ship.yawRate || 0) + dt * 1.6 * f;
          ship.vx = (ship.vx || 0) + ((s.x - ship.x) / Math.max(d, 1)) * f * dt * 6;
          ship.vz = (ship.vz || 0) + ((s.z - ship.z) / Math.max(d, 1)) * f * dt * 6;
          ship.hp = Math.max(0, ship.hp - dt * 6 * f);
          ship.water = Math.min(100, ship.water + dt * 3 * f);
          if (!s.warned && ship === G.ship) { s.warned = true; G.notify('Su hortumu gemiyi yakaladı! Kurtulmak için tam yelken uzaklaş!', 'boss', 4000); }
        }
      }
      if (s.t >= s.life) { this.scene.remove(s.mesh); s.mesh.geometry.dispose(); this.spouts.splice(i, 1); }
    }
    // ---- yağmur sıçramaları ----
    if (W.rain > 0.1 && !sky.underwater && !sky.inCave) {
      const n = Math.floor(W.rain * 6);
      for (let i = 0; i < n; i++) {
        const x = cam.position.x + (Math.random() - 0.5) * 30, z = cam.position.z + (Math.random() - 0.5) * 30;
        const y = Math.max(terrain.heightAt(x, z), ocean.heightAt(x, z)) + 0.02;
        effects.spawn(x, y, z, (Math.random() - 0.5) * 0.6, 1.2 + Math.random(), (Math.random() - 0.5) * 0.6, 0.25, 0.05, 0.8, 0.88, 0.95, -9, 0.5);
      }
    }
  },

  // ağ: oda sahibi hortum konumlarını paylaşır
  netState() { return this.spouts.map((s) => [+s.x.toFixed(1), +s.z.toFixed(1), +s.t.toFixed(1), +s.life.toFixed(1)]); },
  applyNet(arr) {
    while (this.spouts.length > arr.length) { const s = this.spouts.pop(); this.scene.remove(s.mesh); }
    arr.forEach((a, i) => {
      let s = this.spouts[i];
      if (!s) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(34, 5, 260, 28, 20, true), this.spoutMat);
        mesh.frustumCulled = false;
        this.scene.add(mesh);
        s = this.spouts[i] = { mesh, vx: 0, vz: 0 };
      }
      s.x = a[0]; s.z = a[1]; s.t = a[2]; s.life = a[3];
    });
  },
};
