import * as THREE from 'three';
import { terrain } from '../world/terrain.js';
import { ocean } from '../world/ocean.js';
import { physics } from '../world/physics.js';
import { clamp, damp, lerp } from '../core/util.js';
import { hullHalfWidth, deckHeight } from '../ship/shipModel.js';

const CAM_LOS = { tMin: 0.05, tMax: 1, rScale: 1, camera: true };
const _cq = new THREE.Vector3(), _cl = new THREE.Vector3(), _hb = new THREE.Vector3();

// Gemi gövdesi kamera için katıdır: gövde dış hattının içi, küpeşte kapağına (güverte + 0,8 m) kadar; güverte üstünde küpeşte
// içindeki açık alan hariç. Gövde çarpıştırıcı listesinde yoktu: güvertede/iskelede kamera dönerken (özellikle alttan bakışta)
// gövdenin dışına, küpeşte hizasının altına çıkıyor; ekranı gövdenin gölgedeki dış kaplaması kaplıyordu (ölçümde parlaklık
// medyanın %17'sine iniyordu). Kesit, shipModel.hullGeometry ile aynı eğriyi izler; dış yüzeyden 0,1 m pay bırakılır.
export function hullSolid(T, x, y, z) {
  const L = T.L, t = (z + L / 2) / L;
  if (t <= 0 || t >= 1) return false;
  const hw = hullHalfWidth(T, z);
  if (hw < 0.05) return false;
  const dy = deckHeight(T, z), top = dy + 0.75;
  if (y > top + 0.05) return false;
  const keel = T.keel * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)));
  if (y < keel - 0.1) return false;
  const c = Math.min(1, Math.max(0, (1 - (y - keel) / (top - keel)) / 0.98));
  const w = hw * Math.pow(Math.sqrt(1 - c * c), 0.55);
  const ax = Math.abs(x);
  if (ax > w + 0.1) return false;
  return y <= dy || ax > hw - 0.3;
}
// gemiye bağlı (kıçta asılı) kayık: davit noktası çevresinde kutu (kayık gövdesi çift yüzlü; kamera içine düşünce gölgeli içi ekranı kaplıyordu)
function boatSolid(dp, x, y, z) { return Math.abs(x - dp.x) < 0.8 && Math.abs(z - dp.z) < 1.95 && y > dp.y - 0.3 && y < dp.y + 0.95; }
const _hulls = [];

// Üçüncü şahıs kamera: oyuncunun arkasında, akıcı takip
export const tpCamera = {
  yaw: Math.PI, pitch: 0.25, dist: 4.6, targetDist: 4.6,
  fov: 70, baseFov: 70,
  shake: 0, shakeEnabled: true,
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  _focus: new THREE.Vector3(),
  _col: Infinity, // çarpışma nedeniyle kısaltılmış mesafe (içeri anında, dışarı yumuşak)
  mode: 'normal',

  rotate(dx, dy) {
    this.yaw -= dx;
    this.pitch = clamp(this.pitch + dy, -1.25, 1.2);
  },

  zoom(d) { this.targetDist = clamp(this.targetDist + d * 0.6, 1.8, 11); },

  addShake(a) { if (this.shakeEnabled) this.shake = Math.min(1.2, this.shake + a); },

  // focus: dünya noktası (karakter başı), opts: {dist, shoulder, height}
  update(camera, focus, dt, opts = {}) {
    const dist = opts.dist ?? this.targetDist;
    this.dist = damp(this.dist, dist, 6, dt);
    this._focus.lerp(focus, opts.snap ? 1 : 1 - Math.exp(-18 * dt));
    const f = this._focus;
    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    const right = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const shoulder = opts.shoulder || 0;
    let p = f.clone().addScaledVector(dir, -this.dist).addScaledVector(right, shoulder);
    p.y += opts.height || 0;
    // nesne çarpışması: baş→kamera doğrusu kaya/duvar/bina çarpıştırıcısına giriyorsa mesafe ikili aramayla kısaltılır
    if (opts.collide !== false) {
      const at = (d, out) => { out.copy(f).addScaledVector(dir, -d).addScaledVector(right, shoulder); out.y += opts.height || 0; return out; };
      // yakındaki gemi gövdeleri (yerel koordinatta, kare başına bir ters matris); baş bir gövdenin içindeyse (geçiş anı) o gemi sayılmaz
      let nh = 0;
      if (opts.hulls) for (const s of opts.hulls) {
        if (!s || s === opts.skipHull || s.sunk || !s.root || !s.T) continue;
        const R = s.T.L / 2 + this.dist + 3;
        if ((s.x - f.x) * (s.x - f.x) + (s.z - f.z) * (s.z - f.z) > R * R) continue;
        const h = _hulls[nh] || (_hulls[nh] = { T: null, ship: null, deck: false, inv: new THREE.Matrix4(), a: new THREE.Vector3(), boat: null });
        h.T = s.T; h.ship = s; h.deck = opts.deckShip === s; h.inv.copy(s.root.matrixWorld).invert(); h.a.copy(f).applyMatrix4(h.inv);
        h.boat = opts.dockedBoat && opts.dockedBoat.ship === s ? s.model?.davitPos || null : null;
        if (hullSolid(h.T, h.a.x, h.a.y, h.a.z) || (h.boat && boatSolid(h.boat, h.a.x, h.a.y, h.a.z))) continue;
        nh++;
      }
      // aday nokta, kameranın sonradan taşınacağı yere (su üstü sınırı, güverte sınırı) göre denenir: önce ham nokta denendiğinden
      // dümende uzak takip kamerası su altındaki ham noktası yüzünden kıç güvertesine kadar çekiliyordu
      const wClamp = !opts.underwater && (opts.surface || f.y > ocean.heightAt(f.x, f.z) - 0.8);
      const hullBlocked = (q) => {
        for (let i = 0; i < nh; i++) {
          const h = _hulls[i];
          _hb.copy(q);
          if (wClamp) { const wy = ocean.heightAt(q.x, q.z) + 0.35; if (_hb.y < wy) _hb.y = wy; }
          _hb.applyMatrix4(h.inv);
          if (h.deck && h.ship.insideDeck(_hb.x, _hb.z, -0.4)) { const my = h.ship.deckAt(_hb.x, _hb.z) + 0.45; if (_hb.y < my) _hb.y = my; }
          const dx = _hb.x - h.a.x, dy = _hb.y - h.a.y, dz = _hb.z - h.a.z;
          const n = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / 0.15));
          for (let k = 1; k <= n; k++) {
            const t = k / n, x = h.a.x + dx * t, y = h.a.y + dy * t, z = h.a.z + dz * t;
            if (hullSolid(h.T, x, y, z) || (h.boat && boatSolid(h.boat, x, y, z))) return true;
          }
        }
        return false;
      };
      // kapalı alan (mağara, opts.cave): kesitin içindeki kamera noktası aşağıda kesite çekilir (cave.camClamp). Yalnız uç nokta
      // giriş ağzının önündeyse (kesit dışı serbest bölge) doğru boyunca bakılır: doğru tavandan çıkıp ağzın önüne inmesin.
      const cv = opts.cave || null;
      const eLim = cv ? Math.max(1, cv.camE(f.x, f.y, f.z) + 0.02) : 0;
      const caveBlocked = (q) => {
        if (cv.camE(q.x, q.y, q.z) >= 0) return false;
        const dx = q.x - f.x, dy = q.y - f.y, dz = q.z - f.z;
        const n = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / 0.25));
        for (let k = 1; k < n; k++) { const t = k / n; if (cv.camE(f.x + dx * t, f.y + dy * t, f.z + dz * t) > eLim) return true; }
        return false;
      };
      // engel: çarpıştırıcılar + platform güverteleri (kamera güvertenin öbür yüzüne, ör. iskelenin altına geçmesin) + gemi gövdeleri
      const blocked = (q) => physics.lineBlocked(f.x, f.y, f.z, q.x, q.y, q.z, CAM_LOS) || physics.slabBlocked(f.x, f.y, f.z, q.x, q.y, q.z)
        || (nh > 0 && hullBlocked(q)) || (cv !== null && caveBlocked(q));
      let hit = this.dist + 1, blk = false;
      if (blocked(p)) {
        blk = true;
        let lo = 0.4, hi = this.dist;
        for (let i = 0; i < 6; i++) { const mid = (lo + hi) / 2; at(mid, _cq); if (blocked(_cq)) hi = mid; else lo = mid; }
        hit = Math.max(0.4, lo - 0.1);
      }
      // engel: anında yaklaş; açılırken 0,3 sn bekle, sonra yumuşak açıl. Koşarken kaya/duvar kenarını sıyıran görüş hattı
      // her karede yaklaş-uzaklaş yapıyordu (kamera pompalaması koşuda takılma gibi görünüyordu)
      // bekleme yalnız gerçek bir engelden sonra: engel yokken (ör. nişandan çıkış, tekerlekle uzaklaştırma) kamera hemen açılır
      if (!(this._col < 1e6)) this._col = hit; // başlangıç (Infinity) / NaN koruması: sonsuzdan sönümleme NaN üretip kamerayı kilitliyordu
      if (blk) { if (hit < this._col) this._col = hit; else this._col = damp(this._col, hit, 4, dt); this._colHold = 0.3; }
      else if ((this._colHold = (this._colHold || 0) - dt) <= 0) this._col = damp(this._col, hit, 4, dt);
      if (this._col < this.dist) at(this._col, p);
      if (cv) cv.camClamp(p); // mağara: kesitin içine (eğri tavanın altına) çek
    }
    // zemin: arazi + (opts.floorMax verilmişse) tepesi floorMax'ı aşmayan platformlar (oyuncunun üzerinde durduğu güverte). İskele güvertesinde kamera aşağıdan
    // bakınca güvertenin altına iniyor, ekranı koyu güverte tabanı kaplıyordu ("arkama duvar geliyor, ekran kararıyor").
    const ground = opts.floorMax !== undefined ? physics.floorAt(p.x, p.z, opts.floorMax) : terrain.heightAt(p.x, p.z);
    // zemin sınırı yumuşatılır ama gerçek zeminin altına asla inilmez: kamera bir kaya/iskele kenarından geçerken zemin
    // aniden alçalınca kamera bir karede aşağı sıçrıyordu
    this._floorY = opts.snap || this._floorY === undefined ? ground : Math.max(ground, damp(this._floorY, ground, 10, dt));
    if (p.y < this._floorY + 0.4) p.y = this._floorY + 0.4;
    // gemi güvertesi: kamera güverte düzleminin altına (gövdenin içine) inmez
    const s = opts.deckShip;
    if (s) {
      const lp = s.worldToLocal(p, _cl);
      if (s.insideDeck(lp.x, lp.z, -0.4)) {
        const minY = s.deckAt(lp.x, lp.z) + 0.45;
        if (lp.y < minY) { lp.y = minY; s.localToWorld(lp, p); }
      }
    }
    // su yüzeyi: baş sudayken kamera su altında, baş su üstündeyken su üstünde kalır (yüzeyi kesip ekranı karartmasın).
    // Karar odağın kendi su yüksekliğine göre verilir: önce kameranınkine bakılıyordu; dalgalı denizde yüzerken kamera
    // dalga tepesinin altına girip su altı sisine (koyu ekran) geçiyordu.
    const whC = ocean.heightAt(p.x, p.z);
    if (opts.underwater) {
      if (p.y > whC - 0.4) p.y = Math.max(whC - 0.4, ground + 0.3);
    } else if ((opts.surface || f.y > ocean.heightAt(f.x, f.z) - 0.8) && p.y < whC + 0.35) p.y = whC + 0.35;
    // (yüzeyde yüzerken — opts.surface — kamera her zaman su üstünde; diğer kiplerde baş bir dalga tepesinin 0,8 m altına kadar
    // inse de: önce 0,1 m'den derinde sınır kalkıyor, dalga başın üstünden geçince kamera suya girip ekran su altı sisiyle kararıyordu)
    if (opts.ceiling !== undefined && p.y > opts.ceiling) p.y = opts.ceiling;
    this.pos.copy(p);
    camera.position.copy(p);
    const look = f.clone().addScaledVector(right, shoulder);
    if (this.shake > 0) {
      const s = this.shake * 0.25;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }
    camera.lookAt(look);
    const targetFov = opts.fov || this.baseFov;
    this.fov = damp(this.fov, targetFov, 8, dt);
    if (Math.abs(camera.fov - this.fov) > 0.01) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
  },

  forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); },
  right() { return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw)); },
  // kameranın baktığı yön (dünya, birim)
  lookDir() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp).normalize();
  },
};
