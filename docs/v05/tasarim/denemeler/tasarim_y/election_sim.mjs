// Faz 5 tasarım denemesi (salt-okur): host devri seçimi — dönem (epoch) + çoğunluk (quorum) kuralının taranması.
// Kurallar: hayatta kalanlar S = son 'heirs' listesindeki konuklar (sıralı). Q = floor(|S|/2)+1. Tur r'de aday c_r, dönem e+r.
// Seçmen, henüz bir host'a bağlanmamışsa ve c_r'ye ulaşabiliyorsa c_r'ye oy verir (dönem başına tek oy). Aday kendi oyunu sayar.
// Oy ≥ Q → aday host olur, seçmenleri ona bağlanır. Listede olmayan geç katılan konuğun oyu sayılmaz.
function elect(S, alive, reach) {
  const joined = new Map(); const hosts = [];
  for (let r = 0; r < S.length; r++) {
    const c = S[r];
    if (!alive[c] || joined.has(c)) continue;
    const voters = [c];
    for (const v of S) if (v !== c && alive[v] && !joined.has(v) && reach(c, v)) voters.push(v);
    const Q = Math.floor(S.length / 2) + 1;
    if (voters.length >= Q) { hosts.push({ host: c, epoch: r + 1, members: voters }); for (const v of voters) joined.set(v, c); }
  }
  return hosts;
}
const results = [];
for (const n of [1, 2, 3]) {
  const S = Array.from({ length: n }, (_, i) => i);
  const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  let total = 0, autoAll = 0, autoSome = 0, none = 0, split = 0, orphan = 0;
  for (let am = 1; am < (1 << n); am++) for (let rm = 0; rm < (1 << pairs.length); rm++) {
    const alive = S.map((i) => !!(am >> i & 1));
    const reach = (a, b) => { const k = pairs.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a)); return !!(rm >> k & 1); };
    const hosts = elect(S, alive, reach); total++;
    const aliveN = alive.filter(Boolean).length; const inSession = hosts.reduce((s, h) => s + h.members.length, 0);
    if (hosts.length > 1) split++;
    if (!hosts.length) none++; else if (inSession === aliveN) autoAll++; else { autoSome++; orphan += aliveN - inSession; }
  }
  results.push({ hayattaKalanListe: n, durum: total, herkesDevam: autoAll, cogunlukDevam_azinlikBekler: autoSome, kimseDevamEdemez_elleKarar: none, ciftHost: split });
}
console.table(results);
// örnek: 3 hayatta kalan, c1 ↔ c3 ulaşamıyor (NAT); c2 iki tarafa da ulaşıyor
const S = [0, 1, 2]; const hosts = elect(S, [true, true, true], (a, b) => !((a === 0 && b === 2) || (a === 2 && b === 0)));
console.log('örnek (c1↮c3):', JSON.stringify(hosts));
