import { computeHeight } from './geo.js';
import { EXTRA_ISLANDS } from './archipelago.js';

// Liman kaydı: her limanın kasaba merkezi, iskele ucu (biniş noktası) ve demir yeri.
// Satış, gemiye biniş/iniş, hızlı yolculuk ve yeniden doğma bunu kullanır.
export const ports = {
  list: [],

  add(p) { if (!this.list.some((x) => x.id === p.id)) this.list.push(p); return p; },
  byId(id) { return this.list.find((p) => p.id === id); },

  nearest(x, z, maxD = Infinity, filter = null) {
    let best = null, bd = maxD;
    for (const p of this.list) {
      if (filter && !filter(p)) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },
  // geminin demirli olduğu liman (iskele ucuna yakınlık)
  atShip(ship, r = 60) {
    if (!ship || ship.sunk) return null;
    return this.list.find((p) => Math.hypot(ship.x - p.boarding.x, ship.z - p.boarding.z) < r) || null;
  },
  nearBoarding(x, z, r) { return this.list.find((p) => Math.hypot(x - p.boarding.x, z - p.boarding.z) < r) || null; },
};

// Yeni limanların konumları (arazi fonksiyonundan analitik olarak; geometri yüklenmeden önce bilinir)
for (const I of EXTRA_ISLANDS) {
  for (const f of I.features) {
    if (f.type !== 'port') continue;
    const a = f.angle;
    const dx = Math.cos(a), dz = Math.sin(a);
    // kıyı çizgisini ışın boyunca bul
    let coast = I.r * 0.7;
    for (let d = I.r * 0.6; d < I.r * 1.6; d += 2) {
      if (computeHeight(I.x + dx * d, I.z + dz * d) < 0.2) { coast = d; break; }
    }
    const len = 36;
    const start = { x: I.x + dx * (coast - 8), z: I.z + dz * (coast - 8) };
    const end = { x: I.x + dx * (coast + len), z: I.z + dz * (coast + len) };
    const px = -dz, pz = dx; // iskeleye dik
    f.pierStart = start; f.pierEnd = end; f.pierYaw = Math.atan2(dx, dz);
    // KI-236: biniş noktası iskele platformunun ÜSTÜNDE olmalı. İskele güvertesi eksenden ±2,5 m (islands.js _pier → addPlatform
    // yarı genişlik 2,5); önceki 2,6 m'lik yan uzaklık noktayı platformun 0,1 m dışına, suya koyuyordu (hızlı yolculuk varışı ve
    // "İskeleye in" oyuncuyu suya bırakıyordu). 1,2 m: gemi tarafında, kenara 1,3 m pay (konuk ışınlanmasının ±0,6 m dağılımı dahil).
    ports.add({
      id: f.id, name: f.name, island: I.id, region: I.region, x: f.x, z: f.z,
      boarding: { x: end.x + px * 1.2 - dx * 3, y: 3.1, z: end.z + pz * 1.2 - dz * 3 },
      mooring: { x: end.x + px * 9 - dx * 6, z: end.z + pz * 9 - dz * 6, yaw: Math.atan2(dx, dz) },
      spawn: { x: f.x + dx * 6, z: f.z + dz * 6 },
      pierStart: start, pierEnd: end, style: f.style, size: f.size || 1,
    });
  }
}
