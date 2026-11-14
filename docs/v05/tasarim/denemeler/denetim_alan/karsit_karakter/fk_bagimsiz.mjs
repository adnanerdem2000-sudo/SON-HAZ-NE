// Karşıt doğrulama: KayKit yürüme/koşu kliplerinin "doğal" zemin hızı (gerçek js/core/kk.js hattıyla)
// Yöntem 1: destek evresi = ayağın en alçak %P'lik kare dilimi (yüzdelik), z(t) doğrusal regresyon eğimi
// Yöntem 2: ayak (footl) ve parmak (toesl) kemiği ayrı ayrı; ayrıca ileri-geri genlik / destek süresi
import * as THREE from 'three';
import { loadGLB } from '../loadglb.mjs';
import { kk } from '/home/user/SON-HAZ-NE-w2/js/core/kk.js';
const base = '/home/user/SON-HAZ-NE-w2/assets/models/kk/';
const ids = ['barbarian', 'knight', 'rogue', 'rogue_hooded', 'mage'];
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
const clips = ['Walking_A', 'Walking_Backwards', 'Running_A', 'Running_C', 'Running_Strafe_Left', 'Running_Strafe_Right'];
const REF = { Walking_A: 1.9, Walking_Backwards: 1.9, Running_A: 5.2, Running_C: 6.6, Running_Strafe_Left: 3.6, Running_Strafe_Right: 3.6 };
function regSlope(ts, xs) { const n = ts.length; const mt = ts.reduce((a, b) => a + b, 0) / n, mx = xs.reduce((a, b) => a + b, 0) / n; let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (ts[i] - mt) * (xs[i] - mx); den += (ts[i] - mt) ** 2; } return den ? num / den : 0; }
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model); root.updateMatrixWorld(true);
  const B = {}; model.traverse((o) => { if (o.isBone) B[o.name] = o; });
  // uzuv boyları (dinlenme pozu, metre)
  const wp = (n) => B[n].getWorldPosition(new THREE.Vector3());
  const leg = wp('upperlegl').distanceTo(wp('lowerlegl')) + wp('lowerlegl').distanceTo(wp('footl'));
  const arm = wp('upperarml').distanceTo(wp('lowerarml')) + wp('lowerarml').distanceTo(wp('wristl'));
  const hipY = wp('upperlegl').y, shY = wp('upperarml').y;
  console.log(`== ${id}: olcek ${s.toFixed(3)}, bacak ${leg.toFixed(3)} m, kol ${arm.toFixed(3)} m, kalca y ${hipY.toFixed(2)}, omuz y ${shY.toFixed(2)}`);
  const mixer = new THREE.AnimationMixer(model);
  for (const cn of clips) {
    const clip = kk.clips[cn]; if (!clip) { console.log(cn, 'YOK'); continue; }
    mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset(); a.play(); mixer.update(0);
    const N = 960, T = clip.duration, dt = T / N;
    const P = { footl: [], footr: [], toesl: [], toesr: [] };
    for (let i = 0; i < N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); for (const k in P) P[k].push(wp(k)); }
    const axis = cn.includes('Strafe') ? 'x' : 'z';
    const res = [];
    for (const pct of [0.2, 0.35, 0.5]) {
      const vs = [];
      for (const f of ['footl', 'footr', 'toesl', 'toesr']) {
        const ys = P[f].map((p) => p.y).slice().sort((a, b) => a - b);
        const thr = ys[Math.floor(pct * (ys.length - 1))];
        // en alçak dilimdeki ardışık kare kümeleri: her kümede regresyon eğimi, süreyle ağırlıklı ortalama
        let runs = [], cur = [];
        for (let i = 0; i < N; i++) { if (P[f][i].y <= thr) cur.push(i); else if (cur.length) { runs.push(cur); cur = []; } }
        if (cur.length) { if (runs.length && runs[0][0] === 0) runs[0] = cur.map((x) => x - N).concat(runs[0]); else runs.push(cur); }
        let sw = 0, sv = 0;
        for (const r of runs) { if (r.length < 6) continue; const ts = r.map((i) => i * dt), xs = r.map((i) => P[f][(i + N) % N][axis]); sv += regSlope(ts, xs) * r.length; sw += r.length; }
        vs.push(sw ? Math.abs(sv / sw) : NaN);
      }
      res.push(`%${pct * 100} dilim: ayak ${((vs[0] + vs[1]) / 2).toFixed(2)} parmak ${((vs[2] + vs[3]) / 2).toFixed(2)}`);
    }
    // ileri-geri genlik
    const zr = (f) => { const zs = P[f].map((p) => p[axis]); return Math.max(...zs) - Math.min(...zs); };
    console.log(`  ${cn.padEnd(21)} T=${T.toFixed(3)} | ${res.join(' | ')} | genlik ${((zr('footl') + zr('footr')) / 2).toFixed(2)} m | kod ref ${REF[cn]}`);
  }
}
