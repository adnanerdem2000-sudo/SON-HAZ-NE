import * as THREE from 'three';
import { CAVE } from './worldData.js';
import { physics } from './physics.js';
import { assets } from '../core/assets.js';
import { noise2, rng } from '../core/util.js';
import { distToCavePath } from './terrain.js';
import { cloneMat } from '../core/nearfade.js';

const _sec = { e: 0, kind: 'free', cx: 0, cz: 0, yd: 0 };

export const cave = {
  build(scene) {
    const W = CAVE.width, H = CAVE.height, F = CAVE.floor;
    const pts = CAVE.path.map(([x, z]) => new THREE.Vector3(x, F, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const segs = 60, ring = 18;
    const pos = [], col = [], idx = [];
    const tmp = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      // girişte daha yüksek ve geniş ağız
      const mouth = Math.max(0, 1 - t * 6);
      const w = W * (1 + mouth * 0.5), h = H * (1 + mouth * 0.35);
      for (let j = 0; j <= ring; j++) {
        const a = (j / ring) * Math.PI;
        const n = noise2(p.x * 0.3 + j * 0.7, p.z * 0.3) * 0.45 + noise2(p.x * 1.1, p.z * 1.1 + j) * 0.15;
        const rx = Math.cos(a) * (w + n), ry = Math.sin(a) * (h + n * 0.8);
        tmp.copy(p).addScaledVector(side, rx);
        tmp.y = F - 0.4 + Math.max(0, ry);
        pos.push(tmp.x, tmp.y, tmp.z);
        const c = 0.3 + n * 0.15 + (j % 3) * 0.02;
        col.push(c * 1.05, c * 0.95, c * 0.85);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < ring; j++) {
      const a = i * (ring + 1) + j, b = a + 1, c = a + ring + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide });
    const tube = new THREE.Mesh(geo, mat);
    tube.castShadow = true; tube.receiveShadow = true;
    scene.add(tube);
    // kamera için tünel kesiti örnekleri (camE): merkez çizgisi + o noktadaki yarı genişlik/yükseklik
    this._samples = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, p = curve.getPointAt(t), mouth = Math.max(0, 1 - t * 6);
      this._samples.push({ x: p.x, z: p.z, w: W * (1 + mouth * 0.5), h: H * (1 + mouth * 0.35) });
    }

    // Oda kubbesi
    const ch = CAVE.chamber;
    const dome = new THREE.SphereGeometry(ch.r + 1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const dp = dome.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i);
      const n = 1 + noise2(x * 0.4 + 3, z * 0.4 + y * 0.3) * 0.12;
      dp.setXYZ(i, x * n, y * 0.62 * n, z * n);
    }
    const dnon = dome.toNonIndexed();
    // tünel ağzına bakan üçgenleri sil
    const last = CAVE.path[CAVE.path.length - 1];
    const dir = new THREE.Vector2(last[0] - ch.x, last[1] - ch.z).normalize();
    const src = dnon.attributes.position.array;
    const keep = [];
    for (let i = 0; i < src.length; i += 9) {
      const cx = (src[i] + src[i + 3] + src[i + 6]) / 3, cy = (src[i + 1] + src[i + 4] + src[i + 7]) / 3, cz = (src[i + 2] + src[i + 5] + src[i + 8]) / 3;
      const d = new THREE.Vector2(cx, cz).normalize();
      if (d.dot(dir) > 0.86 && cy < H + 0.6) continue;
      for (let k = 0; k < 9; k++) keep.push(src[i + k]);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
    dg.computeVertexNormals();
    const dc = new Float32Array(keep.length);
    for (let i = 0; i < dc.length; i += 3) { const v = 0.28 + Math.random() * 0.05; dc[i] = v * 1.05; dc[i + 1] = v * 0.95; dc[i + 2] = v * 0.9; }
    dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    const domeMesh = new THREE.Mesh(dg, mat);
    domeMesh.position.set(ch.x, F - 0.4, ch.z);
    domeMesh.castShadow = true; domeMesh.receiveShadow = true;
    scene.add(domeMesh);

    // Sarkıtlar
    const R = rng(55);
    const stalMat = new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 1, flatShading: true });
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, rr = R() * (ch.r - 1.5);
      const x = ch.x + Math.cos(a) * rr, z = ch.z + Math.sin(a) * rr;
      const len = 0.6 + R() * 1.6;
      const s = new THREE.Mesh(new THREE.ConeGeometry(0.18 + R() * 0.2, len, 6), stalMat);
      const top = F - 0.4 + (ch.r + 1) * 0.62 * Math.cos((rr / (ch.r + 1)) * Math.PI / 2) - 0.1;
      s.position.set(x, top - len / 2, z);
      s.rotation.x = Math.PI;
      scene.add(s);
    }
    // Kristaller (ışıklı)
    this.crystals = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const x = ch.x + Math.cos(a) * (ch.r - 0.8), z = ch.z + Math.sin(a) * (ch.r - 0.8);
      if (new THREE.Vector2(x - ch.x, z - ch.z).normalize().dot(dir) > 0.8) continue;
      const c = assets.prop('crystal', 0.8 + R() * 0.8);
      c.traverse((o) => {
        if (o.isMesh) { o.material = cloneMat(o.material); o.material.emissive = new THREE.Color(0x8a4dff); o.material.emissiveIntensity = 0.9; }
      });
      c.position.set(x, F - 0.1, z);
      c.rotation.set(R() * 0.4, R() * 6, R() * 0.4);
      scene.add(c);
    }
    const glow = new THREE.PointLight(0xa070ff, 6, 18, 1.6);
    glow.position.set(ch.x, F + 3, ch.z);
    scene.add(glow);
    const glow2 = new THREE.PointLight(0x70a0ff, 3, 10, 1.6);
    const mid = curve.getPointAt(0.55);
    glow2.position.set(mid.x, F + 2.5, mid.z);
    scene.add(glow2);
    this.lights = [glow, glow2];

    // Çarpıştırıcılar: tünel duvarları + oda çeperi
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const mouth = Math.max(0, 1 - t * 6);
      const w = W * (1 + mouth * 0.5);
      for (const s of [-1, 1]) {
        const x = p.x + side.x * (w + 0.35) * s, z = p.z + side.z * (w + 0.35) * s;
        if (Math.hypot(x - ch.x, z - ch.z) < ch.r - 0.5) continue;
        physics.addCircle(x, z, 0.55, F - 3, F + H + 1, 'cave');
      }
    }
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const d = new THREE.Vector2(Math.cos(a), Math.sin(a));
      if (d.dot(dir) > 0.9) continue;
      physics.addCircle(ch.x + d.x * (ch.r + 0.6), ch.z + d.y * (ch.r + 0.6), 0.8, F - 3, F + H + 2, 'cave');
    }
    // Giriş kayaları
    const e = CAVE.path[0];
    for (let i = 0; i < 6; i++) {
      const r = assets.prop('rock_tall', 4 + R() * 3);
      const s = i < 3 ? -1 : 1;
      const tan = curve.getTangentAt(0);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      r.position.set(e[0] + side.x * s * (W * 1.6 + R() * 1.5) - tan.x * (i % 3) * 2.5, F - 0.8, e[1] + side.z * s * (W * 1.6 + R() * 1.5) - tan.z * (i % 3) * 2.5);
      r.rotation.y = R() * 6;
      r.traverse((o) => { if (o.isMesh) { o.material = cloneMat(o.material); o.material.color.multiplyScalar(0.75); } }); // kopyada da yakın-kamera silinmesi (ağız kayalarının çarpıştırıcısı yok)
      scene.add(r);
    }
    // Eşyalar: eski sandıklar, variller
    for (let i = 0; i < 4; i++) {
      const o = assets.prop(i % 2 ? 'barrel' : 'crate', 0.9);
      o.position.set(ch.x - 5 + i * 1.1, F, ch.z + 4.5 - (i % 2));
      o.rotation.y = i;
      scene.add(o);
    }
    this.journalSpot = { x: ch.x - 2, y: F + 0.9, z: ch.z - 5 };
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: 0x5a3c22, roughness: 1 }));
    table.position.set(this.journalSpot.x, F + 0.45, this.journalSpot.z);
    table.castShadow = true;
    scene.add(table);
    physics.addBox(this.journalSpot.x, this.journalSpot.z, 0.7, 0.45, 0, F - 1, F + 1, 'table');
  },

  // Kamera için mağara boşluğu. Tünel yarım elips kesitli, oda yarım elipsoit; duvardan 0,55 m pay bırakılmış kesite göre
  // normalleştirilmiş elips değeri e (≤ 1 içeride). Duvar çarpıştırıcıları dikey silindir olduğundan eğri tavanı temsil etmiyordu:
  // kamera tavan eğrisinden kayanın içine çıkıyor, tünelin koyu dış yüzü ekranı kaplıyordu.
  // _camSec: { e, kind: 'free' (ağzın önü) | 'dome' | 'tun', cx, cz (kesit merkezi), yd }
  _camSec(x, y, z, out) {
    const S = this._samples;
    const F = CAVE.floor, ch = CAVE.chamber, base = F - 0.4;
    const R = (ch.r + 1) * 0.88 - 0.3, Hd = (ch.r + 1) * 0.62 * 0.88 - 0.3;
    const dc = Math.hypot(x - ch.x, z - ch.z), yd = Math.max(0, y - base);
    const eDome = (dc / R) * (dc / R) + (yd / Hd) * (yd / Hd);
    let best = Infinity, bi = 0, bu = 0;
    for (let i = 0; i < S.length - 1; i++) {
      const A = S[i], B = S[i + 1], ex = B.x - A.x, ez = B.z - A.z, L2 = ex * ex + ez * ez;
      const u = L2 > 0 ? Math.max(0, Math.min(1, ((x - A.x) * ex + (z - A.z) * ez) / L2)) : 0;
      const px = A.x + ex * u - x, pz = A.z + ez * u - z, d2 = px * px + pz * pz;
      if (d2 < best) { best = d2; bi = i; bu = u; }
    }
    out.yd = yd;
    // giriş ağzının önü: mağaranın dışı
    if (bi === 0 && bu === 0 && (x - S[0].x) * (S[1].x - S[0].x) + (z - S[0].z) * (S[1].z - S[0].z) < 0) { out.e = -1; out.kind = 'free'; return out; }
    const A = S[bi], B = S[bi + 1];
    const w = A.w + (B.w - A.w) * bu - 0.55, h = A.h + (B.h - A.h) * bu - 0.55;
    const d = Math.sqrt(best);
    const eTun = (d / w) * (d / w) + (yd / h) * (yd / h);
    if (eDome <= eTun) { out.e = eDome; out.kind = 'dome'; out.cx = ch.x; out.cz = ch.z; }
    else { out.e = eTun; out.kind = 'tun'; out.cx = A.x + (B.x - A.x) * bu; out.cz = A.z + (B.z - A.z) * bu; }
    return out;
  },
  // e değeri (ağzın önünde −1)
  camE(x, y, z) { return this._samples ? this._camSec(x, y, z, _sec).e : -1; },
  // kamera noktasını kesitin içine çeker: e > 1 ise (yanal uzaklık, taban üstü yükseklik) kesit merkezine doğru 1/√e ile ölçeklenir.
  // Kısaltma yerine taşıma: baş duvara yakınken kamera başın dibine çökmesin (yükselen kamera yalnız eğri tavanın altına iner).
  camClamp(p) {
    if (!this._samples) return p;
    const c = this._camSec(p.x, p.y, p.z, _sec);
    if (c.kind === 'free' || c.e <= 1) return p;
    const k = 1 / Math.sqrt(c.e);
    p.x = c.cx + (p.x - c.cx) * k; p.z = c.cz + (p.z - c.cz) * k; p.y = CAVE.floor - 0.4 + c.yd * k;
    return p;
  },

  // Oyuncu mağara içinde mi? (0..1 karanlık)
  insideFactor(x, z) {
    const d = distToCavePath(x, z);
    const ch = CAVE.chamber;
    const dc = Math.hypot(x - ch.x, z - ch.z);
    if (dc < ch.r) return 1;
    if (d < CAVE.width) {
      // girişten içeri doğru artan karanlık
      const e = CAVE.path[0];
      const fromMouth = Math.hypot(x - e[0], z - e[1]);
      return Math.min(1, Math.max(0, (fromMouth - 3) / 12));
    }
    return 0;
  },
};
