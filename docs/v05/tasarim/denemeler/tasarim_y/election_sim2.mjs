// Seçim taraması, ek kural: sinyal sunucusu 2 ardışık yoklamada 'peer-unavailable' diyorsa üye S'den çıkar (tanık kuralı).
// Canlı ama NAT nedeniyle ulaşılamayan üye S'de kalır. Q = floor(|S'|/2)+1 her aday için ayrı hesaplanır (aday kendi bilgisine göre).
function elect(S, alive, reach) {
  const joined = new Map(); const hosts = [];
  const Sx = S.filter((i) => alive[i]); // tanık: ölüler herkes için çıkar (sunucu herkese aynı cevabı verir)
  const Q = Math.floor(Sx.length / 2) + 1;
  for (let r = 0; r < S.length; r++) {
    const c = S[r];
    if (!alive[c] || joined.has(c)) continue;
    const voters = [c];
    for (const v of Sx) if (v !== c && !joined.has(v) && reach(c, v)) voters.push(v);
    if (voters.length >= Q) { hosts.push({ host: c, epoch: r + 1, members: voters }); for (const v of voters) joined.set(v, c); }
  }
  return hosts;
}
const results = [];
for (const n of [1, 2, 3]) {
  const S = Array.from({ length: n }, (_, i) => i);
  const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  let total = 0, autoAll = 0, autoSome = 0, none = 0, split = 0, allReach = 0, allReachAuto = 0;
  for (let am = 1; am < (1 << n); am++) for (let rm = 0; rm < (1 << pairs.length); rm++) {
    const alive = S.map((i) => !!(am >> i & 1));
    const reach = (a, b) => { const k = pairs.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a)); return !!(rm >> k & 1); };
    const hosts = elect(S, alive, reach); total++;
    const aliveN = alive.filter(Boolean).length; const inS = hosts.reduce((s, h) => s + h.members.length, 0);
    const fullyConnected = S.every((a) => S.every((b) => a === b || !alive[a] || !alive[b] || reach(a, b)));
    if (fullyConnected) { allReach++; if (hosts.length === 1 && inS === aliveN) allReachAuto++; }
    if (hosts.length > 1) split++;
    if (!hosts.length) none++; else if (inS === aliveN) autoAll++; else autoSome++;
  }
  results.push({ listedekiKonuk: n, durum: total, herkesDevam: autoAll, cogunlukDevam_azinlikBekler: autoSome, kimseDevamEdemez: none, ciftHost: split, tamBaglantiliDurum: allReach, tamBaglantilidaOtomatik: allReachAuto });
}
console.table(results);
