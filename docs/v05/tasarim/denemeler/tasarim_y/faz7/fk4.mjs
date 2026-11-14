import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
const ids = (process.argv[2] || 'barbarian').split(',');
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
const REF = { Walking_A: 1.9, Walking_Backwards: 1.9, Running_A: 5.2, Running_C: 6.6, Running_Strafe_Left: 3.6, Running_Strafe_Right: 3.6 };
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model);
  const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model);
  console.log('==', id);
  for (const cn of Object.keys(REF)) {
    const clip = kk.clips[cn]; mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset(); a.play();
    const N = 1200, T = clip.duration, dt = T / N; mixer.update(0);
    const P = { footl: [], footr: [], toesl: [], toesr: [] };
    for (let i = 0; i <= N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); for (const k in P) P[k].push(bones[k].getWorldPosition(new THREE.Vector3())); }
    const out = [];
    for (const thr of [0.01, 0.02, 0.04]) {
      const vs = [];
      for (const f of ['footl', 'footr']) {
        const ps = P[f]; const minY = Math.min(...ps.map(p => p.y));
        let sx = 0, sz = 0, n = 0;
        for (let i = 1; i < ps.length; i++) if (ps[i].y < minY + thr && ps[i - 1].y < minY + thr) { sx += (ps[i].x - ps[i - 1].x) / dt; sz += (ps[i].z - ps[i - 1].z) / dt; n++; }
        vs.push({ v: n ? Math.hypot(sx / n, sz / n) : 0, frac: n / ps.length });
      }
      out.push(`esik ${thr * 100}cm: v=${((vs[0].v + vs[1].v) / 2).toFixed(2)} (destek %${(((vs[0].frac + vs[1].frac) / 2) * 100).toFixed(0)})`);
    }
    // ayak en alçaktayken (orta destek) hız
    const mids = [];
    for (const f of ['footl', 'footr']) { const ps = P[f]; let im = 0; for (let i = 1; i < ps.length - 1; i++) if (ps[i].y < ps[im].y) im = i; const i0 = Math.max(1, im - 6), i1 = Math.min(ps.length - 1, im + 6); const d = ps[i1].clone().sub(ps[i0]); mids.push(Math.hypot(d.x, d.z) / ((i1 - i0) * dt)); }
    const vm = (mids[0] + mids[1]) / 2;
    console.log(cn.padEnd(22), out.join(' | '), `| orta destek v=${vm.toFixed(2)} | kod ref ${REF[cn]} -> ayak/govde orani ${(vm / REF[cn]).toFixed(2)}`);
  }
}
