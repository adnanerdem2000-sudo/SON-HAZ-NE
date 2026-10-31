import * as THREE from 'three';
import { woodPlanks, cloth, flagTexture } from '../core/textures.js';

// Gemi tipleri (veri odaklı)
export const SHIP_TYPES = {
  sloop: {
    id: 'sloop', name: 'Küçük Sloop', L: 14, B: 4.4, deckY: 1.45, keel: -1.7, sheer: 0.7,
    masts: [{ z: 1.0, h: 13.5, rig: 'gaff' }], bowsprit: 4.2, cannonsPerSide: 2,
    maxSpeed: 11, turnRate: 0.55, accel: 0.9, hp: 100, holdSlots: 8, holdWeight: 220, cannonDamage: 1, price: 0,
    desc: 'Tek direkli, çevik ve hızlı küçük korsan gemisi. Az top, düşük yük kapasitesi.',
  },
  brigantine: {
    id: 'brigantine', name: 'Brigantine', L: 20, B: 5.6, deckY: 1.8, keel: -2.2, sheer: 0.9,
    masts: [{ z: 4.5, h: 16, rig: 'square' }, { z: -2.5, h: 15, rig: 'gaff' }], bowsprit: 5.5, cannonsPerSide: 4,
    maxSpeed: 10, turnRate: 0.4, accel: 0.7, hp: 180, holdSlots: 16, holdWeight: 520, cannonDamage: 1.15, price: 9000,
    desc: 'İki direkli orta boy korsan gemisi. Daha güçlü gövde, daha fazla top ve ambar.',
  },
};

// Güverte dış hattı (yerel XZ): baş +Z
export function hullHalfWidth(T, z) {
  const L = T.L, hb = T.B / 2;
  const t = (z + L / 2) / L; // 0 kıç .. 1 baş
  if (t < 0) return 0;
  if (t > 1) return 0;
  // kıç aynalık (geniş), baş sivri
  const bow = Math.pow(Math.max(0, 1 - Math.pow((t - 0.42) / 0.58, 2)), 0.55);
  const stern = 0.62 + 0.38 * Math.min(1, t / 0.25);
  return hb * (t > 0.42 ? bow : stern * (t < 0.42 ? 1 : 1));
}

export function deckHeight(T, z) {
  const L = T.L;
  const t = (z + L / 2) / L;
  // kıç güvertesi (yükseltilmiş) + baş sheer
  const quarter = t < 0.2 ? 0.5 : t < 0.24 ? 0.5 * (1 - (t - 0.2) / 0.04) : 0;
  const bowRise = Math.pow(Math.max(0, t - 0.75) / 0.25, 2) * T.sheer * 0.6;
  return T.deckY + quarter + bowRise;
}

function hullGeometry(T) {
  const L = T.L, segs = 40, ring = 14;
  const pos = [], uv = [], col = [], idx = [];
  const wood = new THREE.Color(1, 1, 1), bottom = new THREE.Color(0.55, 0.28, 0.2), stripe = new THREE.Color(1, 1, 1);
  for (let i = 0; i <= segs; i++) {
    const z = -L / 2 + (i / segs) * L;
    const hw = Math.max(0.02, hullHalfWidth(T, z));
    const top = deckHeight(T, z) + 0.75; // küpeşte
    const t = i / segs;
    const keel = T.keel * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)));
    for (let j = 0; j <= ring; j++) {
      const s = j / ring; // 0 omurga (alt) -> 1 küpeşte
      const ang = s * Math.PI / 2;
      const x = hw * Math.pow(Math.sin(ang), 0.55);
      const y = keel + (top - keel) * (1 - Math.cos(ang) * 0.98) ;
      for (const side of [1]) {
        pos.push(x * side, y, z);
        uv.push(z / 3, y / 2);
        const c = y < 0.05 ? bottom : wood;
        col.push(c.r, c.g, c.b);
      }
    }
  }
  // sağ taraf
  const n = (segs + 1) * (ring + 1);
  const P = pos.slice(), U = uv.slice(), Cc = col.slice();
  for (let i = 0; i < n; i++) { P.push(-pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); U.push(uv[i * 2], uv[i * 2 + 1]); Cc.push(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]); }
  for (let side = 0; side < 2; side++) {
    const off = side * n;
    for (let i = 0; i < segs; i++) for (let j = 0; j < ring; j++) {
      const a = off + i * (ring + 1) + j, b = a + 1, c = a + ring + 1, d = c + 1;
      if (side === 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function deckGeometry(T) {
  // güverte: dış hattın biraz içi, yükseklik profili ile
  const L = T.L, segs = 32;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const z = -L / 2 + 0.05 + (i / segs) * (L - 0.1);
    const hw = Math.max(0.01, hullHalfWidth(T, z) - 0.06);
    const y = deckHeight(T, z);
    pos.push(-hw, y, z, hw, y, z);
    uv.push(-hw / 2, z / 2, hw / 2, z / 2);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function railGeometry(T) {
  // küpeşte iç yüzü + üst kapak
  const L = T.L, segs = 40;
  const pos = [], idx = [], uv = [];
  for (let side = -1; side <= 1; side += 2) {
    const base = pos.length / 3;
    for (let i = 0; i <= segs; i++) {
      const z = -L / 2 + (i / segs) * L;
      const hw = Math.max(0.02, hullHalfWidth(T, z));
      const y0 = deckHeight(T, z), y1 = y0 + 0.75;
      pos.push(side * (hw - 0.05), y0, z, side * (hw - 0.05), y1, z, side * (hw + 0.02), y1 + 0.05, z);
      uv.push(z / 2, 0, z / 2, 0.4, z / 2, 0.45);
    }
    for (let i = 0; i < segs; i++) {
      const a = base + i * 3, c = a + 3;
      if (side > 0) idx.push(a, a + 1, c, a + 1, c + 1, c, a + 1, a + 2, c + 1, a + 2, c + 2, c + 1);
      else idx.push(a, c, a + 1, a + 1, c, c + 1, a + 1, c + 1, a + 2, a + 2, c + 1, c + 2);
    }
  }
  // kıç aynalık iç duvar
  const zt = -L / 2 + 0.02, hwt = hullHalfWidth(T, zt), yt = deckHeight(T, zt);
  const b2 = pos.length / 3;
  pos.push(-hwt, yt, zt, hwt, yt, zt, -hwt, yt + 0.8, zt, hwt, yt + 0.8, zt);
  uv.push(0, 0, 1, 0, 0, 0.4, 1, 0.4);
  idx.push(b2, b2 + 1, b2 + 2, b2 + 1, b2 + 3, b2 + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function sailGeometry(w0, w1, h, segX = 8, segY = 10) {
  // dörtgen yelken: alt genişlik w0, üst w1, yükseklik h; yerel: X genişlik (geriye doğru), Y yükseklik
  const g = new THREE.PlaneGeometry(1, 1, segX, segY);
  g.translate(0.5, 0.5, 0);
  const p = g.attributes.position;
  const base = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i);
    const w = w0 + (w1 - w0) * v;
    p.setXYZ(i, u * w, v * h, 0);
    base[i * 3] = u; base[i * 3 + 1] = v; base[i * 3 + 2] = 0;
  }
  g.userData.uv01 = base;
  g.userData.dims = { w0, w1, h };
  g.computeVertexNormals();
  return g;
}

function anchorMesh(mat) {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), mat);
  const arms = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 12, Math.PI), mat);
  arms.rotation.z = Math.PI; arms.position.y = -0.2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 10), mat);
  ring.position.y = 0.72;
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), mat);
  stock.rotation.z = Math.PI / 2; stock.position.y = 0.5;
  for (const s of [-1, 1]) {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), mat);
    fl.position.set(s * 0.45, -0.18, 0); fl.rotation.z = s * -0.6;
    g.add(fl);
  }
  g.add(shank, arms, ring, stock);
  return g;
}

export function cannonMesh() {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x24262a, metalness: 0.75, roughness: 0.4 });
  const wood = new THREE.MeshStandardMaterial({ map: woodPlanks('#6b4a2c', 88, 3), roughness: 0.9 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 1.5, 12), iron);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.42, 0.25);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 12), iron);
  lip.position.set(0, 0.42, 1.0);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), iron);
  knob.position.set(0, 0.42, -0.55);
  const car = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.0), wood);
  car.position.set(0, 0.18, -0.05);
  for (const s of [-1, 1]) for (const zz of [-0.35, 0.35]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10), wood);
    w.rotation.z = Math.PI / 2; w.position.set(s * 0.32, 0.12, zz);
    g.add(w);
  }
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.42, 0.25);
  barrel.position.set(0, 0, 0); lip.position.set(0, 0, 0.75); knob.position.set(0, 0, -0.8);
  pivot.add(barrel, lip, knob);
  g.add(car, pivot);
  g.userData.pivot = pivot;
  g.userData.muzzleLocal = new THREE.Vector3(0, 0, 0.85);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function rowboatMesh(color = '#7a5232') {
  const g = new THREE.Group();
  const T = { L: 3.6, B: 1.3, deckY: 0.35, keel: -0.3, sheer: 0.3 };
  const wood = new THREE.MeshStandardMaterial({ map: woodPlanks(color, 71, 6), vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(hullGeometry({ ...T }), wood);
  hull.scale.set(1, 0.55, 1);
  g.add(hull);
  const seatMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#8a6238', 72, 3), roughness: 0.9 });
  for (const z of [-0.6, 0.5]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.28), seatMat);
    s.position.set(0, 0.25, z);
    g.add(s);
  }
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 2.8), seatMat);
  floor.position.y = -0.05;
  g.add(floor);
  // kürekler
  const oars = [];
  for (const s of [-1, 1]) {
    const oar = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 5), seatMat);
    shaft.rotation.z = Math.PI / 2; shaft.position.x = s * 0.8;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.16), seatMat);
    blade.position.x = s * 1.75;
    oar.add(shaft, blade);
    oar.position.set(s * 0.55, 0.42, 0.05);
    g.add(oar);
    oars.push(oar);
  }
  g.userData.oars = oars;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function buildShipModel(T, look = {}) {
  const root = new THREE.Group();
  root.name = 'ship-' + T.id;
  const hullColor = look.hull || '#6b4a2c';
  const stripeColor = look.stripe || '#1f3a5a';
  const sailColor = look.sail || '#efe6d0';
  const woodMat = new THREE.MeshStandardMaterial({ map: woodPlanks(hullColor, 3, 10), vertexColors: true, roughness: 0.85 });
  woodMat.map = woodMat.map.clone(); woodMat.map.needsUpdate = true; woodMat.map.repeat.set(0.6, 1.4);
  const hull = new THREE.Mesh(hullGeometry(T), woodMat);
  hull.castShadow = true; hull.receiveShadow = true;
  root.add(hull);
  // renk şeridi
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.7 });
  const stripeG = new THREE.BufferGeometry();
  {
    const pos = [], idx = [], L = T.L, segs = 40;
    for (let side = -1; side <= 1; side += 2) {
      const b = pos.length / 3;
      for (let i = 0; i <= segs; i++) {
        const z = -L / 2 + (i / segs) * L;
        const hw = hullHalfWidth(T, z) + 0.025;
        const y = deckHeight(T, z) + 0.15;
        pos.push(side * hw, y, z, side * hw, y + 0.35, z);
      }
      for (let i = 0; i < segs; i++) {
        const a = b + i * 2;
        if (side > 0) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    stripeG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    stripeG.setIndex(idx);
    stripeG.computeVertexNormals();
  }
  const stripe = new THREE.Mesh(stripeG, stripeMat);
  root.add(stripe);

  const deckMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#a07a50', 8, 16), roughness: 0.9 });
  deckMat.map = deckMat.map.clone(); deckMat.map.needsUpdate = true; deckMat.map.rotation = Math.PI / 2; deckMat.map.repeat.set(1.2, 1.2);
  const deck = new THREE.Mesh(deckGeometry(T), deckMat);
  deck.receiveShadow = true;
  root.add(deck);
  const railMat = new THREE.MeshStandardMaterial({ map: woodPlanks('#7a5232', 9, 4), roughness: 0.85, side: THREE.DoubleSide });
  const rails = new THREE.Mesh(railGeometry(T), railMat);
  rails.castShadow = true; rails.receiveShadow = true;
  root.add(rails);
  // kıç güvertesi ön duvarı + basamak
  const qz = -T.L / 2 + T.L * 0.22;
  const qw = hullHalfWidth(T, qz) - 0.08;
  const qwall = new THREE.Mesh(new THREE.BoxGeometry(qw * 2, 0.5, 0.12), railMat);
  qwall.position.set(0, T.deckY + 0.25, qz);
  root.add(qwall);

  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.7, roughness: 0.45 });
  const spar = new THREE.MeshStandardMaterial({ map: woodPlanks('#5a3c22', 13, 3), roughness: 0.8 });
  // baş direği (bowsprit)
  const bz = T.L / 2;
  const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, T.bowsprit, 8), spar);
  bs.rotation.x = Math.PI / 2 - 0.2;
  bs.position.set(0, deckHeight(T, bz - 0.5) + 0.5 + Math.sin(0.2) * T.bowsprit / 2, bz + T.bowsprit / 2 - 0.6);
  root.add(bs);
  const bowTip = new THREE.Vector3(0, bs.position.y + Math.sin(0.2) * T.bowsprit / 2, bz + T.bowsprit - 0.7);

  // direkler ve yelkenler
  const sails = [];
  const sailMat = new THREE.MeshStandardMaterial({ map: cloth(sailColor, look.sailStripe || null, 11), side: THREE.DoubleSide, roughness: 0.95 });
  const ropeMat = new THREE.LineBasicMaterial({ color: 0x3a2a1a });
  const ropes = [];
  for (const M of T.masts) {
    const my = deckHeight(T, M.z);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, M.h, 10), spar);
    mast.position.set(0, my + M.h / 2, M.z);
    mast.castShadow = true;
    root.add(mast);
    // gözcü yuvası
    const nest = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 0.5, 12, 1, true), railMat);
    nest.position.set(0, my + M.h * 0.78, M.z);
    root.add(nest);
    const nestFloor = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), spar);
    nestFloor.position.set(0, my + M.h * 0.78 - 0.25, M.z);
    root.add(nestFloor);
    if (M.rig === 'gaff') {
      const boomLen = T.L * 0.42;
      const boomY = my + 2.1;
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, boomLen, 8), spar);
      boom.rotation.x = Math.PI / 2;
      const boomPivot = new THREE.Group();
      boomPivot.position.set(0, boomY, M.z);
      boom.position.set(0, 0, -boomLen / 2);
      boomPivot.add(boom);
      root.add(boomPivot);
      const gaffLen = boomLen * 0.62;
      const sailH = M.h * 0.55;
      const geo = sailGeometry(boomLen * 0.96, gaffLen, sailH);
      const sail = new THREE.Mesh(geo, sailMat);
      sail.rotation.y = Math.PI / 2; // X ekseni -Z yönüne (geriye)
      sail.position.set(0, 0.05, -0.15);
      sail.castShadow = true;
      boomPivot.add(sail);
      const gaff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, gaffLen, 8), spar);
      gaff.rotation.x = Math.PI / 2;
      gaff.position.set(0, sailH, -gaffLen / 2);
      boomPivot.add(gaff);
      sails.push({ mesh: sail, pivot: boomPivot, gaff, type: 'gaff', full: sailH, geo, boomLen });
      // flok yelkeni (üçgen)
      if (M === T.masts[0]) {
        const top = new THREE.Vector3(0, my + M.h * 0.72, M.z + 0.1);
        const jibGeo = new THREE.BufferGeometry();
        const segs = 8;
        const pos = [], idx = [], uv = [];
        // üçgen: tepe, başüstü ucu, güverte noktası
        const deckPt = new THREE.Vector3(0, deckHeight(T, M.z + 1.5) + 0.9, M.z + 1.5);
        for (let i = 0; i <= segs; i++) for (let j = 0; j <= segs - i; j++) {
          const a = i / segs, b = j / segs;
          const p = new THREE.Vector3().addScaledVector(top, 1 - a - b).addScaledVector(bowTip, a).addScaledVector(deckPt, b);
          pos.push(p.x, p.y, p.z); uv.push(a, b);
        }
        let k = 0; const rowStart = [];
        for (let i = 0; i <= segs; i++) { rowStart.push(k); k += segs - i + 1; }
        for (let i = 0; i < segs; i++) for (let j = 0; j < segs - i; j++) {
          const a = rowStart[i] + j, b = a + 1, c = rowStart[i + 1] + j;
          idx.push(a, b, c);
          if (j < segs - i - 1) idx.push(b, rowStart[i + 1] + j + 1, c);
        }
        jibGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        jibGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        jibGeo.setIndex(idx);
        jibGeo.computeVertexNormals();
        jibGeo.userData.base = new Float32Array(pos);
        jibGeo.userData.uvs = new Float32Array(uv);
        const jib = new THREE.Mesh(jibGeo, sailMat);
        jib.castShadow = true;
        root.add(jib);
        sails.push({ mesh: jib, type: 'jib', geo: jibGeo, top, bowTip, deckPt });
        ropes.push([top, bowTip]);
      }
      ropes.push([new THREE.Vector3(0, my + M.h * 0.95, M.z), new THREE.Vector3(hullHalfWidth(T, M.z - 1.2), my + 0.7, M.z - 1.2)]);
      ropes.push([new THREE.Vector3(0, my + M.h * 0.95, M.z), new THREE.Vector3(-hullHalfWidth(T, M.z - 1.2), my + 0.7, M.z - 1.2)]);
    } else {
      // kare yelkenler (iki kat)
      for (let k = 0; k < 2; k++) {
        const yardY = my + M.h * (0.42 + k * 0.3);
        const w = T.B * (1.5 - k * 0.3);
        const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w + 0.5, 8), spar);
        yard.rotation.z = Math.PI / 2;
        const pivot = new THREE.Group();
        pivot.position.set(0, yardY, M.z + 0.25);
        pivot.add(yard);
        const h = M.h * 0.27;
        const geo = sailGeometry(w * 1.05, w, h);
        const sail = new THREE.Mesh(geo, sailMat);
        sail.position.set(-w / 2, -h, 0.05);
        sail.castShadow = true;
        pivot.add(sail);
        root.add(pivot);
        sails.push({ mesh: sail, pivot, type: 'square', full: h, geo, w });
      }
      ropes.push([new THREE.Vector3(0, my + M.h * 0.95, M.z), bowTip]);
    }
    // bayrak
    if (M === T.masts[0]) {
      const flagGeo = new THREE.PlaneGeometry(1.6, 1.0, 10, 4);
      flagGeo.translate(0.8, 0, 0);
      const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ map: flagTexture(look.flag || 'skull'), side: THREE.DoubleSide, roughness: 1 }));
      flag.position.set(0, my + M.h + 0.3, M.z);
      root.add(flag);
      root.userData.flag = flag;
    }
  }
  // halatlar
  const rp = [];
  for (const [a, b] of ropes) rp.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  root.add(new THREE.LineSegments(rg, ropeMat));

  // dümen çarkı (kıç güvertesi)
  const helmZ = -T.L / 2 + 1.6;
  const helmY = deckHeight(T, helmZ);
  const wheel = new THREE.Group();
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 20), spar);
  wheel.add(wheelRing);
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5), spar);
    sp.rotation.z = (i / 8) * Math.PI;
    wheel.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), metal);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  wheel.position.set(0, helmY + 1.2, helmZ + 0.15);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.25), spar);
  post.position.set(0, helmY + 0.6, helmZ);
  root.add(wheel, post);

  // çapa ırgatı + çapa
  const capZ = T.L / 2 - 2.2;
  const capY = deckHeight(T, capZ);
  const capstan = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.9, 10), spar);
  capstan.position.set(0, capY + 0.45, capZ);
  root.add(capstan);
  const anchor = anchorMesh(metal);
  const anchorRest = new THREE.Vector3(hullHalfWidth(T, T.L / 2 - 1.5) + 0.15, deckHeight(T, T.L / 2 - 1.5) - 0.3, T.L / 2 - 1.5);
  anchor.position.copy(anchorRest);
  root.add(anchor);
  const chainGeo = new THREE.BufferGeometry();
  chainGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const chain = new THREE.Line(chainGeo, new THREE.LineBasicMaterial({ color: 0x222222 }));
  root.add(chain);

  // toplar
  const cannons = [];
  const n = T.cannonsPerSide;
  for (let i = 0; i < n; i++) {
    const z = -T.L * 0.12 + (i - (n - 1) / 2) * (T.L * 0.5 / Math.max(1, n));
    for (const s of [-1, 1]) {
      const c = cannonMesh();
      const hw = hullHalfWidth(T, z);
      c.position.set(s * (hw - 0.75), deckHeight(T, z), z);
      c.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
      root.add(c);
      cannons.push({ mesh: c, side: s, z, local: c.position.clone() });
    }
  }
  // ambar kapağı
  const hatchZ = T.L * 0.12;
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.4), new THREE.MeshStandardMaterial({ map: woodPlanks('#3d2a18', 14, 6), roughness: 1 }));
  hatch.position.set(0, deckHeight(T, hatchZ) + 0.07, hatchZ);
  root.add(hatch);
  // harita masası
  const tableZ = -T.L / 2 + 3.0;
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.7), spar);
  top.position.y = 0.9;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9, 6), spar);
  leg.position.y = 0.45;
  const map = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.55), new THREE.MeshStandardMaterial({ color: 0xe8d4a6, roughness: 1 }));
  map.rotation.x = -Math.PI / 2; map.position.y = 0.95;
  table.add(top, leg, map);
  table.position.set(1.1, deckHeight(T, tableZ), tableZ);
  root.add(table);
  // kova
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.32, 10), spar);
  bucket.position.set(-0.9, deckHeight(T, hatchZ) + 0.16, hatchZ);
  root.add(bucket);
  // fenerler
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffa040, emissiveIntensity: 0 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), lampMat);
  lamp.position.set(0, deckHeight(T, -T.L / 2) + 1.4, -T.L / 2 - 0.1);
  root.add(lamp);
  // merdiven (iskele tarafı)
  const ladderZ = T.L * 0.02;
  const ladder = new THREE.Group();
  const lhw = hullHalfWidth(T, ladderZ);
  for (let i = 0; i < 6; i++) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.6), spar);
    rung.position.set(-lhw - 0.06, -0.6 + i * 0.4, ladderZ);
    ladder.add(rung);
  }
  for (const dz of [-0.3, 0.3]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.06), spar);
    r.position.set(-lhw - 0.06, 0.5, ladderZ + dz);
    ladder.add(r);
  }
  root.add(ladder);
  // kayık askısı (kıç)
  const davitZ = -T.L / 2 - 0.2;
  for (const s of [-1, 1]) {
    const d = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 5, 8, Math.PI / 2), metal);
    d.position.set(s * 0.8, deckHeight(T, -T.L / 2) + 0.6, davitZ);
    d.rotation.y = Math.PI / 2;
    root.add(d);
  }

  root.traverse((o) => { if (o.isMesh) { if (o.castShadow === false) o.castShadow = true; o.receiveShadow = true; } });

  return {
    root, sails, wheel, anchor, anchorRest, chain, cannons, lampMat, flag: root.userData.flag,
    stations: {
      helm: new THREE.Vector3(0, helmY, helmZ - 0.75),
      anchor: new THREE.Vector3(0, capY, capZ - 0.7),
      sails: new THREE.Vector3(0.7, deckHeight(T, T.masts[0].z - 0.9), T.masts[0].z - 0.9),
      hold: new THREE.Vector3(0, deckHeight(T, hatchZ), hatchZ - 1.0),
      bucket: new THREE.Vector3(-0.9, deckHeight(T, hatchZ), hatchZ - 0.6),
      map: new THREE.Vector3(1.1, deckHeight(T, tableZ), tableZ - 0.7),
      davit: new THREE.Vector3(hullHalfWidth(T, -T.L / 2 + 1.0) - 0.55, deckHeight(T, -T.L / 2 + 1.0), -T.L / 2 + 1.0),
      ladder: new THREE.Vector3(-lhw - 0.5, 0, ladderZ),
      ladderTop: new THREE.Vector3(-lhw + 0.6, deckHeight(T, ladderZ), ladderZ),
    },
    davitPos: new THREE.Vector3(0, deckHeight(T, -T.L / 2) + 0.2, davitZ - 1.6),
  };
}
