// Salt-okur: yürüyüş kliplerinin doğal yer hızı (destek ayağı yöntemi) ve bugünkü/önerilen eşlemede kayma oranı (Faz 7)
import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
import { kk } from './kk_copy.mjs';
const base = '/home/user/SON-HAZ-NE/assets/models/kk/';
const ids = ['barbarian', 'knight', 'rogue', 'mage', 'sk_minion'];
for (const id of ids) kk.templates[id] = await loadGLB(base + `kk_${id}.glb`);
kk._anims = (await loadGLB(base + 'kk_anims.glb')).animations;
for (const id of ids) kk._prepChar(id);
kk._prepClips();
const CLIPS = ['Walking_A', 'Walking_B', 'Walking_C', 'Walking_D_Skeletons', 'Walking_Backwards', 'Running_A', 'Running_B', 'Running_C', 'Running_Strafe_Left', 'Running_Strafe_Right'];
const res = {};
for (const id of ids) {
  const info = kk.info[id];
  const model = kk.clone(id); const s = 1.8 / info.height; model.scale.setScalar(s); model.position.y = -info.minY * s;
  const root = new THREE.Group(); root.add(model);
  const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const mixer = new THREE.AnimationMixer(model);
  for (const cn of CLIPS) {
    const clip = kk.clips[cn]; mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset(); a.play();
    const N = 960, T = clip.duration, dt = T / N; mixer.update(0);
    const L = [], R = [];
    for (let i = 0; i <= N; i++) { if (i) mixer.update(dt); root.updateMatrixWorld(true); L.push(bones.footl.getWorldPosition(new THREE.Vector3())); R.push(bones.footr.getWorldPosition(new THREE.Vector3())); }
    const minY = Math.min(...L.map((p) => p.y), ...R.map((p) => p.y));
    // her karede alçaktaki ayak destek ayağı; yalnız alt 3 cm içindeyse sayılır
    let su = 0, sw = 0, n = 0; const us = [];
    for (let i = 1; i <= N; i++) {
      const useL = L[i].y < R[i].y; const P = useL ? L : R;
      if (P[i].y > minY + 0.03) continue;
      const ux = (P[i].x - P[i - 1].x) / dt, uz = (P[i].z - P[i - 1].z) / dt; // kök sabitken ayak hızı
      us.push([ux, uz]); su += ux; sw += uz; n++;
    }
    const mx = su / n, mz = sw / n; const vnat = Math.hypot(mx, mz); // gövde bu hızla (−u yönünde) giderse ortalama kayma 0
    let rms = 0; for (const [ux, uz] of us) rms += (ux - mx) ** 2 + (uz - mz) ** 2; rms = Math.sqrt(rms / n);
    (res[cn] = res[cn] || []).push({ id, vnat: +vnat.toFixed(2), dir: [+(-mx / vnat).toFixed(2), +(-mz / vnat).toFixed(2)], kalanKayma: +rms.toFixed(2), destek: +(n / N).toFixed(2), sure: +T.toFixed(3) });
  }
}
for (const cn of CLIPS) {
  const r = res[cn]; const v = r.map((x) => x.vnat);
  console.log(cn.padEnd(22), 'süre', r[0].sure, '| doğal hız', Math.min(...v).toFixed(2), '–', Math.max(...v).toFixed(2), 'm/sn | yön', JSON.stringify(r[0].dir), '| destek payı', r[0].destek, '| kalan kayma rms', r[0].kalanKayma);
}
// bugünkü eşleme: oyuncu (player.js:685, 697-699) ve düşman (enemies.js:1154-1156)
const vn = (cn) => res[cn].reduce((s, x) => s + x.vnat, 0) / res[cn].length;
const cases = [
  ['oyuncu', 'Walk 1.5 (analog)', 1.5, 'Walking_A', Math.min(1.9, Math.max(0.5, 1.5 / 1.9))],
  ['oyuncu', 'Walk 1.7 (çömelme)', 1.7, 'Walking_A', Math.min(1.9, Math.max(0.5, 1.7 / 1.9))],
  ['oyuncu', 'Walk 2.0 (nişan/blok ileri)', 2.0, 'Walking_A', Math.min(1.3, Math.max(0.5, 2.0 / 1.9))],
  ['oyuncu', 'WalkBack 2.0 (nişan/blok geri)', 2.0, 'Walking_Backwards', Math.min(1.3, Math.max(0.5, 2.0 / 1.9))],
  ['oyuncu', 'Strafe 2.0 (nişan/blok yan)', 2.0, 'Running_Strafe_Left', Math.min(1.3, Math.max(0.5, 2.0 / 3.6))],
  ['oyuncu', 'Walk 2.64 (sandık)', 2.64, 'Walking_A', Math.min(1.9, Math.max(0.5, 2.64 / 1.9))],
  ['oyuncu', 'Walk 3.0', 3.0, 'Walking_A', Math.min(1.9, Math.max(0.5, 3.0 / 1.9))],
  ['oyuncu', 'Run 4.4', 4.4, 'Running_A', Math.min(1.5, Math.max(0.55, 4.4 / 5.2))],
  ['oyuncu', 'Sprint 7.0', 7.0, 'Running_C', Math.min(1.4, Math.max(0.75, 7.0 / 6.6))],
  ['düşman', 'Walk 1.5 (haydut devriye)', 1.5, 'Walking_A', Math.min(1.5, Math.max(0.5, 1.5 / 1.7))],
  ['düşman', 'WalkSk 1.2 (iskelet devriye)', 1.2, 'Walking_D_Skeletons', Math.min(1.5, Math.max(0.5, 1.2 / 1.3))],
  ['düşman', 'Run 4.3 (haydut kovalama)', 4.3, 'Running_A', Math.min(1.4, Math.max(0.7, 4.3 / 5))],
  ['düşman', 'Run 3.4 (iskelet kovalama)', 3.4, 'Running_A', Math.min(1.4, Math.max(0.7, 3.4 / 5))],
];
console.log('\nBugünkü eşlemede oran = doğalHız × timeScale / gövdeHızı (hedef 0,85–1,15):');
for (const [who, lab, hs, cn, ts] of cases) console.log(who.padEnd(7), lab.padEnd(32), 'ts', ts.toFixed(2), '| oran', (vn(cn) * ts / hs).toFixed(2));
// önerilen: ts = hs / doğalHız (kıskaçlarla), Walk<->Run eşiği 1,9/2,3 (histerezis), karışım bandı
const V = Object.fromEntries(CLIPS.map((c) => [c, +vn(c).toFixed(2)]));
console.log('\nOrtalama doğal hızlar (tabloya girecek):', JSON.stringify(V));
