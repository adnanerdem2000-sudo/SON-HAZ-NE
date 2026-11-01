import * as THREE from 'three';
import { terrain } from './terrain.js';
import { ports } from './ports.js';
import { physics } from './physics.js';
import { ocean } from './ocean.js';
import { assets } from '../core/assets.js';
import { woodPlanks, roofTiles, thatch, stone, cloth, makeLabelTexture } from '../core/textures.js';
import { rng } from '../core/util.js';
import { mergeStatic } from '../core/batch.js';

const mats = {};
function M(key, make) { return mats[key] || (mats[key] = make()); }

function texMat(tex, rx, ry, extra = {}) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(rx, ry);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, ...extra });
}

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// Prosedürel bina: taş temel, ahşap/sıva duvar, kiremit/saman çatı, kapı, pencereler
export function makeBuilding(o) {
  const { w, d, floors = 1, wall = 'plank', roof = 'tile', roofColor = '#a8452c', wallColor = '#9a6a3c', sign = null, seed = 1 } = o;
  const g = new THREE.Group();
  const fh = 3.1;
  const H = fh * floors;
  const found = box(w + 0.4, 0.6, d + 0.4, texMat(stone('#8d8578', seed), w / 3, 0.4));
  found.position.y = 0.3;
  g.add(found);
  let wallMat;
  if (wall === 'plank') wallMat = texMat(woodPlanks(wallColor, seed, 10), w / 4, H / 3);
  else if (wall === 'stone') wallMat = texMat(stone(wallColor, seed + 3), w / 3, H / 2.5);
  else wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 });
  const walls = box(w, H, d, wallMat);
  walls.position.y = 0.6 + H / 2;
  g.add(walls);
  // ahşap köşe kirişleri
  const beamMat = M('beam', () => texMat(woodPlanks('#4a2f1a', 99, 3), 0.3, 1));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const b = box(0.3, H, 0.3, beamMat);
    b.position.set(sx * (w / 2), 0.6 + H / 2, sz * (d / 2));
    g.add(b);
  }
  for (let f = 1; f <= floors; f++) {
    const b = box(w + 0.1, 0.25, d + 0.1, beamMat);
    b.position.y = 0.6 + f * fh;
    g.add(b);
  }
  // çatı
  const rh = Math.min(w, d) * 0.42 + 0.6;
  const ov = 0.6;
  const roofMat = roof === 'thatch' ? texMat(thatch(seed), 2, 2) : texMat(roofTiles(roofColor, seed), w / 3, 1.6);
  const slope = Math.hypot(w / 2 + ov, rh);
  const ang = Math.atan2(rh, w / 2 + ov);
  for (const s of [-1, 1]) {
    const r = box(slope, 0.18, d + ov * 2, roofMat);
    r.position.set(s * (w / 4 + ov / 2), 0.6 + H + rh / 2, 0);
    r.rotation.z = -s * ang;
    g.add(r);
  }
  // alınlık üçgenleri
  const tri = new THREE.Shape();
  tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh); tri.lineTo(-w / 2, 0);
  const tg = new THREE.ShapeGeometry(tri);
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(tg, wallMat);
    m.position.set(0, 0.6 + H, s * (d / 2));
    if (s < 0) m.rotation.y = Math.PI;
    m.castShadow = true;
    g.add(m);
  }
  // kapı (ön yüz +Z)
  const doorMat = M('door', () => texMat(woodPlanks('#5a3418', 7, 5), 1, 1));
  const door = box(1.3, 2.3, 0.12, doorMat);
  door.position.set(o.doorX || 0, 0.6 + 1.15, d / 2 + 0.06);
  g.add(door);
  const step = box(1.8, 0.3, 0.8, M('stone', () => texMat(stone('#9a9286', 3), 1, 0.3)));
  step.position.set(o.doorX || 0, 0.15, d / 2 + 0.5);
  g.add(step);
  // pencereler
  const glassMat = M('glass', () => new THREE.MeshStandardMaterial({ color: 0x1d3540, roughness: 0.2, metalness: 0.3, emissive: 0x000000 }));
  const frameMat = M('frame', () => new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.8 }));
  const shutterMat = M('shutter' + seed % 4, () => new THREE.MeshStandardMaterial({ color: ['#2f6f8a', '#7a2f2a', '#3d6b3a', '#7a5a2a'][seed % 4], roughness: 0.8 }));
  const winY = [];
  for (let f = 0; f < floors; f++) winY.push(0.6 + f * fh + 1.7);
  for (const y of winY) {
    for (const x of [-w / 2 + 1.4, w / 2 - 1.4]) {
      if (Math.abs(x - (o.doorX || 0)) < 1.4 && y < 3) continue;
      const fr = box(1.1, 1.2, 0.1, frameMat); fr.position.set(x, y, d / 2 + 0.03); g.add(fr);
      const gl = box(0.9, 1.0, 0.1, glassMat); gl.position.set(x, y, d / 2 + 0.06); g.add(gl);
      for (const s of [-1, 1]) {
        const sh = box(0.5, 1.2, 0.06, shutterMat);
        sh.position.set(x + s * 0.85, y, d / 2 + 0.06);
        g.add(sh);
      }
    }
    // yan pencereler
    for (const s of [-1, 1]) {
      const gl = box(0.1, 1.0, 0.9, glassMat); gl.position.set(s * (w / 2 + 0.04), y, 0); g.add(gl);
      const fr = box(0.08, 1.2, 1.1, frameMat); fr.position.set(s * (w / 2 + 0.02), y, 0); g.add(fr);
    }
  }
  // baca
  if (o.chimney) {
    const ch = box(0.8, 2.4, 0.8, M('stone', () => texMat(stone('#9a9286', 3), 1, 0.3)));
    ch.position.set(w / 4, 0.6 + H + rh * 0.6, -d / 4);
    g.add(ch);
  }
  // tabela
  if (sign) {
    const tex = makeLabelTexture(sign, { w: 512, h: 128, size: 66 });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    sm.position.set(0, 0.6 + 2.75, d / 2 + 0.16);
    g.add(sm);
  }
  g.userData.windows = glassMat;
  return g;
}

export function makeStall(color = '#c0392b', seed = 1) {
  const g = new THREE.Group();
  const wood = M('stallwood', () => texMat(woodPlanks('#7a5232', 17, 6), 1, 1));
  const counter = box(3.2, 1.0, 1.1, wood);
  counter.position.y = 0.5;
  g.add(counter);
  for (const sx of [-1.5, 1.5]) for (const sz of [-0.5, 1.6]) {
    const p = box(0.14, 2.7, 0.14, wood);
    p.position.set(sx, 1.35, sz);
    g.add(p);
  }
  const awn = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 2.6), new THREE.MeshStandardMaterial({ map: cloth('#f1e7d2', color, seed), roughness: 0.9 }));
  awn.position.set(0, 2.75, 0.55);
  awn.rotation.x = -0.18;
  awn.castShadow = true;
  g.add(awn);
  return g;
}

export const port = {
  npcSpots: [],
  lanterns: [],
  shoreZ: 240,

  build(realScene) {
    const R = rng(909);
    // statik kasaba parçaları tek grupta toplanıp malzemeye göre birleştirilir
    const scene = new THREE.Group();
    scene.name = 'port';
    // Kıyı çizgisini bul
    let z0 = 240;
    for (let z = 200; z < 340; z += 0.5) { if (terrain.heightAt(10, z) < 0.2) { z0 = z; break; } }
    this.shoreZ = z0;
    const ground = 2.6;

    // İskele. Denize bakan uç (zEnd) sabit; kara ucu kumun güverteye 0,3 m'den az kaldığı yere dek uzatılır. Önce kök z0−6'da
    // sabitti: liman kanalının kazısı kumu orada 1,49 m'ye indiriyor, 0,76 m'lik basamak kalıyordu (basamak sınırı 0,6 m) —
    // kasabadan iskeleye zıplamadan çıkılamıyor, v0.3'te oyuncu güvertenin altına yürüyüp tahtanın içinde görünüyordu.
    const pierW = 5, pierTop = 2.25, zEnd = z0 + 40;
    const sand = (z) => Math.min(terrain.heightAt(10 - pierW / 2, z), terrain.heightAt(10, z), terrain.heightAt(10 + pierW / 2, z));
    let zRoot = z0 - 6;
    while (zRoot > z0 - 24 && sand(zRoot) < pierTop - 0.3) zRoot -= 0.5;
    const pierLen = zEnd - zRoot;
    const pz = (zRoot + zEnd) / 2;
    this.pierRoot = zRoot;
    const deckMat = texMat(woodPlanks('#8a6238', 5, 12), 2, pierLen / 4);
    const deck = box(pierW, 0.3, pierLen, deckMat);
    deck.position.set(10, pierTop - 0.15, pz);
    scene.add(deck);
    physics.addPlatform(10, pz, pierW / 2, pierLen / 2, 0, pierTop, 'pier');
    // Güvertenin altı sığ kesimde (kum −1,95 m'den yüksek) tam yükseklikte kapalı: kumda yürüyen ya da sığda yüzen oyuncu alçak
    // güvertenin altına giremez, gövdesi tahtanın içinden geçmez (yan bant yalnız 0,4 m kalınlıktaydı, altından girenler yana
    // ışınlanıyordu). Derin kesimde güverte altından yüzülebilir (ayak −1,35, baş güvertenin 1 m altında).
    let zSplit = zRoot;
    while (zSplit < zEnd && sand(zSplit) > -1.95) zSplit += 0.5;
    if (zSplit > zRoot) physics.addBox(10, (zRoot + zSplit) / 2, pierW / 2, (zSplit - zRoot) / 2, 0, -50, pierTop - 0.6, 'pier');
    this.pierShallowEnd = zSplit;
    // T başlık (konumu kara ucundan bağımsız: merdiven, demirleme ve biniş noktası yer değiştirmez)
    const tW = 18, tD = 5, tz = zEnd + tD / 2 - 1;
    const tdeck = box(tW, 0.3, tD, texMat(woodPlanks('#8a6238', 6, 12), tW / 4, 1));
    tdeck.position.set(10, pierTop - 0.15, tz);
    scene.add(tdeck);
    physics.addPlatform(10, tz, tW / 2, tD / 2, 0, pierTop, 'pier');
    // sudan iskeleye çıkış: T başlığının doğu kenarından denize inen taş merdiven. Yüzen oyuncunun ayağı su yüzeyinin 1.35 m
    // altındadır (gelgit ±0.55 m), 0.6 m'den yüksek basamağa çıkamaz. Liman kanalı 9 m derin olduğundan kıyı sönümü işlemez;
    // bu yüzden liman barınak ilan edilir (ocean.setShelter: dalga ×0.2, 70 m içinde tam) — aksi hâlde ±1.1 m dalga (fırtınada
    // ±2.6 m) alt basamağı eriştirmiyor ve su hattındaki basamakta kip titreşimi yapıyordu. Su altı basamakları 0.3 m, su üstü
    // 0.55 m yükselir; en alt basamak −2.4 m (en düşük gelgit + sönümlü çukurda ayak ≈ −2.1 → pencerede). Taş kolonlar deniz
    // tabanına kadar dolu çizilir; çarpıştırıcı da tam yükseklik, yüzücü/dalgıç taşın içinden geçemez. Önce sudan çıkış yoktu.
    ocean.setShelter(10, tz + 2, 70, 160);
    {
      const stairMat = M('stair', () => texMat(stone('#8d8578', 23), 1, 0.5));
      const tops = [-2.4, -2.1, -1.8, -1.5, -1.2, -0.9, -0.6, -0.05, 0.5, 1.05, 1.6, 2.15];
      const width = 2.4;
      let sx = 10 + tW / 2; // T başlığının doğu kenarı; basamaklar doğuya doğru alçalır
      for (let i = tops.length - 1; i >= 0; i--) {
        const top = tops[i], tread = top < -0.3 ? 0.6 : 0.8;
        sx += tread / 2;
        const base = Math.min(top - 0.3, terrain.heightAt(sx, tz) - 0.3);
        const sm = box(tread, top - base, width, stairMat);
        // doku ölçeği: paylaşımlı malzemenin (1, 0.5) tekrarı 7–11 m'lik kolona gerilmesin; her yüzde ~0.6 m'lik taş karosu
        { const uv = sm.geometry.attributes.uv, H = top - base, k = 1 / 0.6; const su = [tread * k, tread * k, tread * k, tread * k, width * k, width * k], sv = [H * k, H * k, width * k, width * k, H * k, H * k];
          for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * su[f], uv.getY(i) * sv[f]); } uv.needsUpdate = true; }
        sm.position.set(sx, (top + base) / 2, tz);
        sm.receiveShadow = true;
        scene.add(sm);
        physics.addPlatform(sx, tz, tread / 2, width / 2, 0, top, 'pier', false);
        physics.addBox(sx, tz, tread / 2, width / 2, 0, base, top - 0.6, 'pier'); // tam yükseklik yan yüz; üst 0.6 m basamak penceresi
        sx += tread / 2;
      }
    }
    const postMat = M('post', () => texMat(woodPlanks('#4a321e', 21, 3), 0.4, 2));
    const posts = [];
    for (let z = zRoot + 2; z < zEnd; z += 3.2) posts.push([10 - pierW / 2 + 0.2, z], [10 + pierW / 2 - 0.2, z]);
    for (let x = 10 - tW / 2 + 0.3; x <= 10 + tW / 2; x += 3) {
      // ana iskelenin T başlığa bağlandığı geçitte (kuzey kenar) ve biniş noktasında (güney kenar) direk yok: yürüme yolunu kesiyordu
      if (Math.abs(x - 10) >= pierW / 2 + 0.25) posts.push([x, tz - tD / 2 + 0.2]);
      if (Math.abs(x - 10) >= 1) posts.push([x, tz + tD / 2 - 0.2]);
    }
    for (const [x, z] of posts) {
      const bottom = terrain.heightAt(x, z);
      const len = pierTop + 0.6 - bottom;
      if (len < 0.5) continue;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, len, 7), postMat);
      p.position.set(x, bottom + len / 2, z);
      p.castShadow = true;
      scene.add(p);
      // direk çarpıştırıcısı: güvertede korkuluk dikmesi, suda iskele ayağı (önce yalnız görseldi, içinden geçiliyordu).
      // Kamera bu ince engellere çarpmaz (noCam)
      physics.addCircle(x, z, 0.22, bottom - 0.5, pierTop + 0.6, 'pier').noCam = true;
    }
    // babalar (halat bağlama)
    for (const x of [10 - tW / 2 + 1, 10 + tW / 2 - 1]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.6 }));
      b.position.set(x, pierTop + 0.35, tz + tD / 2 - 0.5);
      scene.add(b);
      physics.addCircle(x, tz + tD / 2 - 0.5, 0.3, pierTop - 0.3, pierTop + 0.7, 'pier').noCam = true;
    }
    // Demirleme noktası: T başlığın güneyi, gemi doğu-batı doğrultusunda
    this.mooring = { x: 10, z: tz + tD / 2 + 7 + 1.5, yaw: 0 };
    this.boardingPoint = { x: 10, z: tz + tD / 2 - 0.6, y: pierTop };
    this.pierTop = pierTop;

    // Binalar (ön yüz denize bakar: +Z)
    const bz = z0 - 34;
    const buildings = [
      { id: 'han', x: -32, z: bz, w: 13, d: 9, floors: 2, wall: 'plank', wallColor: '#a0703f', roof: 'tile', roofColor: '#9c3b26', sign: 'Kırlangıç Hanı', chimney: true },
      { id: 'haritaci', x: -12, z: bz + 1, w: 8, d: 7, floors: 2, wall: 'plaster', wallColor: '#e8dcc2', roof: 'tile', roofColor: '#b5562f', sign: 'Haritacı' },
      { id: 'silahci', x: 6, z: bz - 1, w: 8, d: 7, floors: 1, wall: 'stone', wallColor: '#8a8478', roof: 'tile', roofColor: '#6b3a2a', sign: 'Silah Ustası', chimney: true },
      { id: 'terzi', x: 23, z: bz + 1, w: 8, d: 7, floors: 2, wall: 'plaster', wallColor: '#d9c7a3', roof: 'tile', roofColor: '#a8452c', sign: 'Terzi' },
      { id: 'tuccar', x: 42, z: bz, w: 10, d: 8, floors: 1, wall: 'plank', wallColor: '#8f6a45', roof: 'thatch', sign: 'Genel Tüccar' },
    ];
    for (const b of buildings) this._place(scene, b, R);
    // arka sıra konutlar
    const homes = [
      [-48, bz - 22], [-30, bz - 25], [-12, bz - 22], [8, bz - 26], [28, bz - 23], [48, bz - 25], [-58, bz + 8], [62, bz + 6],
    ];
    homes.forEach(([x, z], i) => {
      const h = terrain.heightAt(x, z);
      if (h < 1.6) return;
      this._place(scene, {
        id: 'ev' + i, x, z, w: 6 + R() * 3, d: 5.5 + R() * 2, floors: R() < 0.4 ? 2 : 1,
        wall: R() < 0.5 ? 'plaster' : 'plank', wallColor: R.pick(['#e8dcc2', '#d6c29a', '#a0703f', '#c9b38a']),
        roof: R() < 0.35 ? 'thatch' : 'tile', roofColor: R.pick(['#a8452c', '#9c3b26', '#b5562f']), chimney: R() < 0.5,
        yaw: x < -50 ? Math.PI / 2 : x > 55 ? -Math.PI / 2 : 0,
      }, R);
    });
    // Gemi ustası atölyesi (kıyıda, açık)
    this._shipwright(scene, 46, z0 - 8);
    // Pazar tezgâhları
    const stalls = [
      { id: 'hazine', x: -16, z: z0 - 16, color: '#b8860b' },
      { id: 'balikci', x: 26, z: z0 - 14, color: '#2e86c1' },
    ];
    for (const s of stalls) {
      const st = makeStall(s.color, s.x | 0);
      st.position.set(s.x, ground, s.z);
      st.rotation.y = 0;
      scene.add(st);
      physics.addBox(s.x, s.z, 1.7, 0.6, 0, ground - 1, ground + 1.2, 'stall');
    }
    // balık sepetleri
    for (let i = 0; i < 3; i++) {
      const b = assets.prop('barrel', 0.9);
      b.position.set(24 + i * 1.2, ground, z0 - 12.5);
      scene.add(b);
    }
    // Görev panosu
    this._board(scene, -2, z0 - 13);
    // Fenerler
    const lampPos = [[-6, z0 - 8], [26, z0 - 8], [10, z0 + 6], [10, z0 + 24], [-24, z0 - 24], [36, z0 - 24], [10, z0 + 38]];
    for (const [x, z] of lampPos) this._lantern(scene, x, z, x === 10 && z > z0 ? pierTop : ground);
    // Deniz feneri (dönen ışık hüzmesi nedeniyle birleştirilmez)
    this._lighthouse(realScene, 78, z0 - 4);
    // yük yığınları
    // yığın kumun üstüne konur: önce kasaba düzlüğü yüksekliğine (2,6 m) konuyordu, kıyıdaki kum 0,6–1,25 m olduğundan sandık ve
    // variller iskelenin yanında havada asılı duruyordu (ekran görüntüsündeki turuncu/beyaz/siyah kutular)
    let cMin = Infinity, cMax = -Infinity;
    for (let i = 0; i < 10; i++) {
      const name = i % 3 === 0 ? 'barrel' : 'crate';
      const o = assets.prop(name, name === 'barrel' ? 1.0 : 0.9);
      const x = -6 + (i % 4) * 1.3, z = z0 - 3 + Math.floor(i / 4) * 1.4;
      const h = Math.max(terrain.heightAt(x, z), -0.2);
      cMin = Math.min(cMin, h); cMax = Math.max(cMax, h);
      o.position.set(x, h, z);
      o.rotation.y = R() * 3;
      scene.add(o);
    }
    physics.addBox(-4, z0 - 1.6, 2.8, 2.2, 0, cMin - 1, cMax + 1.2, 'cargo');

    realScene.add(mergeStatic(scene));

    ports.add({ id: 'kirlangic_limani', name: 'Kırlangıç Limanı', island: 'kirlangic', region: 'merkez', x: 10, z: 222, core: true,
      boarding: this.boardingPoint, mooring: this.mooring, spawn: { x: this.boardingPoint.x - 8, z: this.shoreZ - 20 } });
    // NPC konumları (karakter modülü bunları doldurur)
    this.npcSpots = [
      { id: 'tuzla', role: 'quest', name: 'Yaşlı Kaptan Tuzla', title: 'Hanın emekli kaptanı', x: -32, z: bz + 6.5, yaw: 0, model: 'pirate' },
      { id: 'haritaci', role: 'cartographer', name: 'Haritacı Nevra', title: 'Haritacı', x: -12, z: bz + 5.6, yaw: 0, look: 'f1' },
      { id: 'silahci', role: 'weapons', name: 'Demirci Kara Ali', title: 'Silah Ustası', x: 6, z: bz + 3.8, yaw: 0, look: 'm2' },
      { id: 'terzi', role: 'tailor', name: 'Terzi Lale', title: 'Kıyafet Mağazası', x: 23, z: bz + 5.6, yaw: 0, look: 'f2' },
      { id: 'tuccar', role: 'general', name: 'Tüccar Rıza', title: 'Genel Tüccar', x: 42, z: bz + 5.2, yaw: 0, look: 'm3' },
      { id: 'hazine', role: 'treasure', name: 'Sedef Hanım', title: 'Hazine Alıcısı', x: -16, z: z0 - 17.2, yaw: 0, look: 'f3' },
      { id: 'balikci', role: 'fisher', name: 'Balıkçı Yusuf', title: 'Balıkçı', x: 26, z: z0 - 15.2, yaw: 0, look: 'm4' },
      { id: 'gemici', role: 'shipwright', name: 'Usta Bora', title: 'Gemi Ustası', x: 42, z: z0 - 9, yaw: -Math.PI / 2, look: 'm5' },
      { id: 'pano', role: 'board', name: 'Görev Panosu', x: -2, z: z0 - 12.2, yaw: 0, noModel: true },
      { id: 'zarci', role: 'gambler', name: 'Zarcı Kemal', title: 'Zar Ustası — Korsan Zarı', x: -39.5, z: bz + 7.5, yaw: 0.6, look: 'm4' },
    ];
  },

  _place(scene, b, R) {
    const g = makeBuilding({ ...b, seed: (Math.abs(b.x * 7 + b.z) | 0) + 1 });
    const y = Math.max(terrain.heightAt(b.x, b.z), 2.4) - 0.25;
    g.position.set(b.x, y, b.z);
    g.rotation.y = b.yaw || 0;
    scene.add(g);
    physics.addBox(b.x, b.z, b.w / 2 + 0.2, b.d / 2 + 0.2, b.yaw || 0, y - 2, y + 12, 'building');
    if (g.userData.windows) this.windowMats = (this.windowMats || new Set()).add(g.userData.windows);
  },

  _shipwright(scene, x, z) {
    const g = new THREE.Group();
    const wood = texMat(woodPlanks('#6b4a2c', 51, 6), 1, 1);
    const roof = texMat(thatch(4), 2, 2);
    for (const sx of [-4, 4]) for (const sz of [-3, 3]) {
      const p = box(0.3, 4, 0.3, wood); p.position.set(sx, 2, sz); g.add(p);
    }
    const r = box(9.5, 0.25, 7.5, roof); r.position.y = 4.1; r.rotation.z = 0.08; g.add(r);
    const bench = box(4, 0.9, 1.2, wood); bench.position.set(-1, 0.45, -2); g.add(bench);
    // kereste yığını
    for (let i = 0; i < 6; i++) {
      const l = box(4.5, 0.25, 0.3, wood);
      l.position.set(1.5, 0.15 + Math.floor(i / 3) * 0.26, 1 + (i % 3) * 0.32);
      g.add(l);
    }
    // yarım gövde iskeleti
    const ribMat = texMat(woodPlanks('#8a6238', 52, 4), 0.5, 1);
    for (let i = 0; i < 6; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 4, 10, Math.PI), ribMat);
      rib.rotation.z = Math.PI; rib.position.set(-2.5 + i * 0.9, 1.7, 2.2);
      rib.rotation.y = Math.PI / 2;
      g.add(rib);
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const y = Math.max(terrain.heightAt(x, z), 2.4) - 0.1;
    g.position.set(x, y, z);
    scene.add(g);
    for (const sx of [-4, 4]) for (const sz of [-3, 3]) physics.addCircle(x + sx, z + sz, 0.3, y - 1, y + 4, 'post').noCam = true;
    physics.addBox(x - 1, z - 2, 2, 0.6, 0, y - 1, y + 1, 'bench');
    physics.addBox(x + 1.5, z + 1.3, 2.3, 0.5, 0, y - 1, y + 0.6, 'lumber');
  },

  _board(scene, x, z) {
    const g = new THREE.Group();
    const wood = texMat(woodPlanks('#6b4a2c', 61, 5), 1, 1);
    for (const sx of [-1, 1]) { const p = box(0.15, 2.4, 0.15, wood); p.position.set(sx, 1.2, 0); g.add(p); }
    const b = box(2.4, 1.4, 0.12, wood); b.position.y = 1.6; g.add(b);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf0e2c0, roughness: 1 });
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), paperMat);
      p.position.set(-0.85 + i * 0.42, 1.6 + (i % 2) * 0.12, 0.07);
      p.rotation.z = (i - 2) * 0.05;
      g.add(p);
    }
    const y = Math.max(terrain.heightAt(x, z), 2.4);
    g.position.set(x, y, z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    physics.addBox(x, z, 1.25, 0.2, 0, y - 1, y + 2.4, 'board');
  },

  _lantern(scene, x, z, y) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3, 6), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.5, roughness: 0.6 }));
    pole.position.y = 1.5;
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffa040, emissiveIntensity: 0.0 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), bulbMat);
    lamp.position.y = 3.1;
    g.add(pole, lamp);
    g.position.set(x, y, z);
    scene.add(g);
    physics.addCircle(x, z, 0.15, y - 1, y + 3, 'lamp');
    this.lanterns.push({ mat: bulbMat, x, y: y + 3.1, z });
  },

  _lighthouse(scene, x, z) {
    const y = Math.max(terrain.heightAt(x, z), 0.5);
    const g = new THREE.Group();
    const H = 16;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, H, 14), new THREE.MeshStandardMaterial({ map: cloth('#f2efe6', '#b33a2c', 77), roughness: 0.8 }));
    tower.material.map = tower.material.map.clone(); tower.material.map.needsUpdate = true;
    tower.material.map.rotation = Math.PI / 2; tower.material.map.repeat.set(1, 2);
    tower.position.y = H / 2;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 14), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4 }));
    cap.position.y = H + 0.2;
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffd070, emissiveIntensity: 0.2, transparent: true, opacity: 0.9 });
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.0, 12), lampMat);
    lamp.position.y = H + 1.4;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 14), new THREE.MeshStandardMaterial({ color: 0x9c3b26, roughness: 0.7 }));
    roof.position.y = H + 3.4;
    // hacimsel görünümlü ışık hüzmesi: fenerden uzaklaştıkça ve kenarlara doğru sönümlenir
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { opacity: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = -mv.xyz; vN = normalMatrix*normal; gl_Position = projectionMatrix*mv; }',
      fragmentShader: `uniform float opacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float along = pow(vUv.y, 1.6);
          float face = abs(dot(normalize(vN), normalize(vV)));
          float a = along * face * face * opacity;
          gl_FragColor = vec4(vec3(1.0, 0.93, 0.7) * a, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 60, 24, 1, true), beamMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(30, H + 1.4, 0);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, 0);
    pivot.add(beam);
    beam.position.set(30, H + 1.4, 0);
    g.add(tower, cap, lamp, roof, pivot);
    g.position.set(x, y - 0.5, z);
    g.traverse((o) => { if (o.isMesh && o !== beam) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    physics.addCircle(x, z, 2.9, y - 2, y + H, 'lighthouse');
    this.lighthouse = { lampMat, beam, pivot };
  },

  update(dt, night) {
    for (const l of this.lanterns) l.mat.emissiveIntensity = night * 2.2;
    if (this.windowMats) for (const m of this.windowMats) { m.emissive.setHex(0xffb860); m.emissiveIntensity = night * 0.9; }
    if (this.lighthouse) {
      this.lighthouse.lampMat.emissiveIntensity = 0.2 + night * 3;
      this.lighthouse.beam.material.uniforms.opacity.value = night * 0.55;
      this.lighthouse.pivot.rotation.y += dt * 0.6;
    }
  },
};
