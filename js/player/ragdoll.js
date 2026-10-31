import * as THREE from 'three';

// Verlet tabanlı ragdoll (KayKit "Rig_Medium" iskeleti).
// Ölüm anındaki pozdan başlar: eklemler nokta kütlesi olur, kemik uzunlukları ve gövde kafesi
// mesafe kısıtlarıyla korunur, zemin ve sürtünme uygulanır; her karede kemikler noktalara hizalanır.
// Animasyon karıştırıcısı ragdoll süresince durdurulur (Character.update içinde).

const G = -9.8;
const STEP = 1 / 60;
const ITER = 8;

// nokta adı → kemik adı (eklem konumu = kemiğin dünya konumu)
const POINTS = {
  hips: 'hips', chest: 'chest', head: 'head',
  shL: 'upperarml', elL: 'lowerarml', wrL: 'wristl',
  shR: 'upperarmr', elR: 'lowerarmr', wrR: 'wristr',
  hipL: 'upperlegl', knL: 'lowerlegl', anL: 'footl', toL: 'toesl',
  hipR: 'upperlegr', knR: 'lowerlegr', anR: 'footr', toR: 'toesr',
};
const RADIUS = { head: 0.12, hips: 0.11, chest: 0.12, headTop: 0.1 };

// sert kısıtlar (başlangıç uzunluğu korunur)
const STICKS = [
  // gövde kafesi
  ['hips', 'chest'], ['hips', 'shL'], ['hips', 'shR'], ['chest', 'shL'], ['chest', 'shR'], ['shL', 'shR'],
  ['hipL', 'hipR'], ['hips', 'hipL'], ['hips', 'hipR'], ['shL', 'hipL'], ['shR', 'hipR'], ['shL', 'hipR'], ['shR', 'hipL'],
  ['chest', 'hipL'], ['chest', 'hipR'],
  // boyun ve baş
  ['chest', 'head'], ['shL', 'head'], ['shR', 'head'], ['head', 'headTop'], ['chest', 'headTop'],
  // kollar
  ['shL', 'elL'], ['elL', 'wrL'], ['shR', 'elR'], ['elR', 'wrR'],
  // bacaklar ve ayaklar
  ['hipL', 'knL'], ['knL', 'anL'], ['anL', 'toL'], ['knL', 'toL'],
  ['hipR', 'knR'], ['knR', 'anR'], ['anR', 'toR'], ['knR', 'toR'],
];
// yumuşak kısıtlar: baş üstü omuzlara (boyun esnekliği), uzuvların tamamen katlanmasını önleyen asgari mesafeler
const SOFT = [['shL', 'headTop', 0.35], ['shR', 'headTop', 0.35]];
const MIN = [['shL', 'wrL', 0.45], ['shR', 'wrR', 0.45], ['hipL', 'anL', 0.55], ['hipR', 'anR', 0.55], ['hips', 'head', 0.9]];

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _q = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qp = new THREE.Quaternion();
const _m = new THREE.Matrix4(), _m0 = new THREE.Matrix4(), _m1 = new THREE.Matrix4();

function basis(side, up, out) {
  const x = _a.copy(side).normalize();
  const z = _c.crossVectors(x, up).normalize();
  const y = _b.crossVectors(z, x).normalize();
  return out.makeBasis(x, y, z);
}

function aimBone(bone, from, to) {
  if (!bone || from.lengthSq() < 1e-8 || to.lengthSq() < 1e-8) return;
  _q.setFromUnitVectors(from.normalize(), to.normalize());
  bone.getWorldQuaternion(_qw);
  _qw.premultiply(_q);
  bone.parent.getWorldQuaternion(_qp);
  bone.quaternion.copy(_qp.invert().multiply(_qw));
  bone.updateMatrixWorld(true);
}

export class Ragdoll {
  // char: Character; opts: { ground(x, z, y) → zemin yüksekliği, vel: başlangıç hızı, impulse: darbe (m/s), hitY: darbe yüksekliği oranı }
  constructor(char, opts = {}) {
    this.char = char;
    this.B = char.bones;
    this.ground = opts.ground || ((x, z) => 0);
    this.t = 0;
    this.acc = 0;
    this.sleep = false;
    this.still = 0;
    const B = this.B;
    char.root.updateMatrixWorld(true);
    // noktalar
    this.p = {};
    for (const k in POINTS) {
      const bone = B[POINTS[k]];
      if (!bone) continue;
      const v = bone.getWorldPosition(new THREE.Vector3());
      this.p[k] = { x: v.clone(), o: v.clone(), r: RADIUS[k] || 0.07 };
    }
    // baş üstü sanal nokta: kafa kemiğinin "yukarı" ekseni boyunca
    if (this.p.head) {
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(B.head.getWorldQuaternion(new THREE.Quaternion()));
      const top = this.p.head.x.clone().addScaledVector(up, 0.32 * (char.root.scale.y || 1));
      this.p.headTop = { x: top.clone(), o: top.clone(), r: RADIUS.headTop };
    }
    // başlangıç hızı + darbe (göğüs ve başa daha çok)
    const v0 = (opts.vel || new THREE.Vector3()).clone().multiplyScalar(STEP);
    const imp = (opts.impulse || new THREE.Vector3()).clone().multiplyScalar(STEP);
    const hy = this.p.hips ? this.p.hips.x.y : 0;
    for (const k in this.p) {
      const pt = this.p[k];
      const hFac = THREE.MathUtils.clamp((pt.x.y - hy) / 0.7 + 0.5, 0.2, 1.4);
      pt.o.sub(v0).addScaledVector(imp, -hFac);
    }
    // kısıt uzunlukları
    const len = (a, b) => (this.p[a] && this.p[b] ? this.p[a].x.distanceTo(this.p[b].x) : 0);
    this.sticks = STICKS.filter(([a, b]) => this.p[a] && this.p[b]).map(([a, b]) => [this.p[a], this.p[b], len(a, b)]);
    this.soft = SOFT.filter(([a, b]) => this.p[a] && this.p[b]).map(([a, b, k]) => [this.p[a], this.p[b], len(a, b), k]);
    this.mins = MIN.filter(([a, b]) => this.p[a] && this.p[b]).map(([a, b, f]) => [this.p[a], this.p[b], len(a, b) * f]);
    // kalça yönelimi için başlangıç tabanı
    if (this.p.hipL && this.p.hipR && this.p.chest && B.hips) {
      this.hipsQ0 = B.hips.getWorldQuaternion(new THREE.Quaternion());
      basis(_d.subVectors(this.p.hipL.x, this.p.hipR.x), new THREE.Vector3().subVectors(this.p.chest.x, this.p.hips.x), _m0);
      this.hipsB0inv = _m0.clone().transpose();
      // kalça kemiği kökeni ile nokta arasındaki fark (kemik kökeni = nokta)
    }
  }

  update(dt) {
    if (this.sleep) return false;
    this.t += dt;
    this.acc = Math.min(this.acc + dt, STEP * 4);
    while (this.acc >= STEP) { this._step(STEP); this.acc -= STEP; }
    this._pose();
    // hareketsiz kalınca uyut
    let ke = 0;
    for (const k in this.p) ke += this.p[k].x.distanceToSquared(this.p[k].o);
    if (ke < 1e-6 * 17) this.still += dt; else this.still = 0;
    if (this.still > 0.8 || this.t > 8) this.sleep = true;
    return true;
  }

  _step(h) {
    const P = this.p;
    const damp = 0.985;
    for (const k in P) {
      const pt = P[k];
      const vx = (pt.x.x - pt.o.x) * damp, vy = (pt.x.y - pt.o.y) * damp, vz = (pt.x.z - pt.o.z) * damp;
      pt.o.copy(pt.x);
      pt.x.x += vx; pt.x.y += vy + G * h * h; pt.x.z += vz;
    }
    for (let it = 0; it < ITER; it++) {
      for (const [a, b, l] of this.sticks) this._solve(a, b, l, 1);
      for (const [a, b, l, k] of this.soft) this._solve(a, b, l, k);
      for (const [a, b, l] of this.mins) {
        const d = a.x.distanceTo(b.x);
        if (d < l) this._solve(a, b, l, 1);
      }
      this._knees();
      // zemin
      for (const k in P) {
        const pt = P[k];
        const g = this.ground(pt.x.x, pt.x.z, pt.x.y) + pt.r;
        if (pt.x.y < g) {
          pt.x.y = g;
          // sürtünme: yatay hareketi sönümle
          pt.o.x += (pt.x.x - pt.o.x) * 0.35;
          pt.o.z += (pt.x.z - pt.o.z) * 0.35;
          if (pt.o.y < g - 0.2) pt.o.y = g - 0.2;
        }
      }
    }
  }

  _solve(a, b, l, k) {
    _a.subVectors(b.x, a.x);
    const d = _a.length() || 1e-6;
    const diff = ((d - l) / d) * 0.5 * k;
    a.x.addScaledVector(_a, diff);
    b.x.addScaledVector(_a, -diff);
  }

  // dizler yalnızca öne bükülür: diz, kalça-ayak bileği çizgisinin gerisine geçerse öne itilir
  _knees() {
    const P = this.p;
    if (!P.hipL || !P.hipR || !P.chest || !P.hips) return;
    const side = _b.subVectors(P.hipL.x, P.hipR.x).normalize();
    const up = _c.subVectors(P.chest.x, P.hips.x).normalize();
    const front = _d.crossVectors(side, up).normalize();
    for (const [h, kn, an] of [['hipL', 'knL', 'anL'], ['hipR', 'knR', 'anR']]) {
      if (!P[kn] || !P[an]) continue;
      _a.addVectors(P[h].x, P[an].x).multiplyScalar(0.5).sub(P[kn].x).negate(); // diz - orta nokta
      const f = _a.dot(front);
      if (f < 0.02) P[kn].x.addScaledVector(front, (0.02 - f) * 0.6);
    }
  }

  // kemikleri noktalara hizala
  _pose() {
    const B = this.B, P = this.p;
    const hips = B.hips;
    if (!hips) return;
    // kalça: konum + iki eksenli yönelim
    if (this.hipsQ0 && P.hipL && P.hipR && P.chest) {
      basis(_d.subVectors(P.hipL.x, P.hipR.x), new THREE.Vector3().subVectors(P.chest.x, P.hips.x), _m1);
      _m.multiplyMatrices(_m1, this.hipsB0inv);
      _q.setFromRotationMatrix(_m);
      _qw.copy(this.hipsQ0).premultiply(_q);
      hips.parent.getWorldQuaternion(_qp);
      hips.quaternion.copy(_qp.invert().multiply(_qw));
    }
    hips.parent.updateMatrixWorld(true);
    _a.copy(P.hips.x);
    hips.position.copy(hips.parent.worldToLocal(_a));
    hips.updateMatrixWorld(true);
    const seg = (bone, childBone, target) => {
      if (!bone || !childBone || !target) return;
      const from = childBone.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(_c));
      const to = target.x.clone().sub(bone.getWorldPosition(_c));
      aimBone(bone, from, to);
    };
    seg(B.spine, B.chest, P.chest);
    // göğüs: baş yönüne
    if (B.chest && B.head && P.head) seg(B.chest, B.head, P.head);
    // baş: baş üstü noktasına
    if (B.head && P.headTop) {
      const hq = B.head.getWorldQuaternion(new THREE.Quaternion());
      const from = new THREE.Vector3(0, 1, 0).applyQuaternion(hq);
      const to = P.headTop.x.clone().sub(B.head.getWorldPosition(_c));
      aimBone(B.head, from, to);
    }
    seg(B.upperarml, B.lowerarml, P.elL); seg(B.lowerarml, B.wristl, P.wrL);
    seg(B.upperarmr, B.lowerarmr, P.elR); seg(B.lowerarmr, B.wristr, P.wrR);
    seg(B.upperlegl, B.lowerlegl, P.knL); seg(B.lowerlegl, B.footl, P.anL); seg(B.footl, B.toesl, P.toL);
    seg(B.upperlegr, B.lowerlegr, P.knR); seg(B.lowerlegr, B.footr, P.anR); seg(B.footr, B.toesr, P.toR);
  }

  // dış itki (patlama, tekme)
  push(v) {
    for (const k in this.p) this.p[k].o.addScaledVector(v, -STEP);
    this.sleep = false; this.still = 0; this.t = Math.min(this.t, 5);
  }
}
