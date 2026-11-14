// İnceleme denemesi (salt-okur): dev boss (orc_brute/demon) Punch/Weapon/Jump/Jump_Land/Wave kliplerinde el/ayak en ileri
// erişim ve en alçak (yere değme) anları; glb_peak.mjs açısal hız tepesiyle karşılaştırma.
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
const [file, ...clips] = process.argv.slice(2);
const g = await loadGLB('/home/user/SON-HAZ-NE/assets/models/' + file + '.glb');
const root = g.scene; const scene = new THREE.Scene(); scene.add(root);
const bones = {}; root.traverse((o) => { if (o.isBone) bones[o.name] = o; });
if (clips[0] === 'list') { console.log(Object.keys(bones).join(', ')); console.log(g.animations.map((a) => a.name).join(', ')); process.exit(0); }
const mixer = new THREE.AnimationMixer(root);
const pick = (re) => Object.keys(bones).filter((n) => re.test(n));
const hands = pick(/^(Middle1R|Middle1L|LowerArmR|LowerArmL)$/);
const feet = pick(/^(FootL|FootR)$/);
for (const cn of clips) {
  const clip = g.animations.find((a) => a.name.endsWith('|' + cn) || a.name === cn);
  if (!clip) { console.log('yok', cn); continue; }
  mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.play();
  const N = 120, dt = clip.duration / N;
  mixer.update(0); root.updateMatrixWorld(true);
  const rec = {}; for (const n of [...hands, ...feet]) rec[n] = { zMax: -1e9, tz: 0, yMin: 1e9, ty: 0, vMax: 0, tv: 0, p: bones[n].getWorldPosition(new THREE.Vector3()) };
  for (let i = 1; i <= N; i++) {
    mixer.update(dt); root.updateMatrixWorld(true);
    for (const n of Object.keys(rec)) {
      const q = bones[n].getWorldPosition(new THREE.Vector3()); const r = rec[n];
      const v = q.distanceTo(r.p) / dt; if (v > r.vMax) { r.vMax = v; r.tv = i * dt; }
      if (q.z > r.zMax) { r.zMax = q.z; r.tz = i * dt; } if (q.y < r.yMin) { r.yMin = q.y; r.ty = i * dt; } r.p = q;
    }
  }
  console.log(`${file} ${cn} (klip ${clip.duration.toFixed(3)} sn)`);
  for (const [n, r] of Object.entries(rec)) console.log(`  ${n}: hız tepesi ${r.tv.toFixed(3)} | en ileri (z) ${r.tz.toFixed(3)} | en alçak ${r.ty.toFixed(3)}`);
}
