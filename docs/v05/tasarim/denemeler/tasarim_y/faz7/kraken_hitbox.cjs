// Kraken dokunaç hedef noktasının (k = TSEG-6) güverte ucuna göre konumu — bosses.js:296-361 geometrisinin kopyası
const TSEG = 18;
function bez(base, ctrl, tip, u) { const a = 1 - u; return [0,1,2].map(i => a*a*base[i] + 2*a*u*ctrl[i] + u*u*tip[i]); }
function run(B, L, deckY, R) {
  let reach = 0, n = 0, minD = 1e9, maxD = 0, sumD = 0;
  for (let oa = 0; oa < 360; oa += 15) for (let ta = 0; ta < 6; ta++) for (let lx of [-0.35, 0, 0.35]) for (let lz of [-0.42, 0, 0.42]) {
    const kx = Math.cos(oa*Math.PI/180)*R, kz = Math.sin(oa*Math.PI/180)*R; // gemi merkezi (0,0), yaw 0
    const ang = ta/6*6.28;
    const base = [kx + Math.cos(ang)*6, -1.5, kz + Math.sin(ang)*6];
    const tip = [lx*B, deckY, lz*L];
    const ctrl = [base[0] + (tip[0]-base[0])*0.35, Math.max(base[1], tip[1]) + 4, base[2] + (tip[2]-base[2])*0.35];
    const k = TSEG - 6; const u = (k + 1) / TSEG;
    const p = bez(base, ctrl, tip, u); p[1] -= 1;
    const dTip = Math.hypot(p[0]-tip[0], p[2]-tip[2]);
    // güvertedeki en yakın oyuncu noktası (dikdörtgen B x L içinde, kenardan 0.3 m içeride)
    const px = Math.max(-B/2+0.3, Math.min(B/2-0.3, p[0])), pz = Math.max(-L/2+0.3, Math.min(L/2-0.3, p[2]));
    const dPl = Math.hypot(p[0]-px, p[2]-pz); const dy = p[1] - deckY;
    const ok = dPl <= 2.5 + 1.3 && dy <= 2.5 && dy >= -2; // hafif kılıç: range 2.5 + radius 1.3
    n++; if (ok) reach++; minD = Math.min(minD, dPl); maxD = Math.max(maxD, dPl); sumD += dPl;
  }
  return { n, reachable: reach, minHorizFromDeck: +minD.toFixed(2), maxHorizFromDeck: +maxD.toFixed(2), avg: +(sumD/n).toFixed(2) };
}
console.log('sloop R38', run(4.4, 14, 1.45, 38));
console.log('sloop R30 (evre 3)', run(4.4, 14, 1.45, 30));
console.log('brigantine R38', run(5.6, 20, 1.8, 38));
console.log('brigantine R30', run(5.6, 20, 1.8, 30));
