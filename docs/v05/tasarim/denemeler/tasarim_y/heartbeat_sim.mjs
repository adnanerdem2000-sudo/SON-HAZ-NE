// Faz 5 tasarım denemesi (salt-okur): D4-02 kök neden modeli — kalp atışı kuralları, ana iş parçacığı takılmaları altında.
// v0.4 kuralı (net.js:239, 704): ilk 'st' → inGame; host her karede (rAF) now − lastSeen > 15 sn ise düşürür.
// Konuk mesajları: 'st' yalnız konuk karesi koşarken (net.js:712-718), 'ping' setInterval 2 sn (net.js:447) — ikisi de konuk
// ana iş parçacığı takılınca durur. Host takılınca: kuyruğa giren iletiler takılma bitince işlenir; tarayıcı rAF'yi önce
// çalıştırırsa (render açlığı önceliği) denetim eski lastSeen ile yapılır.
function sim({ rule, guestStall = null, hostStall = null, rafFirst = true, until = 60 }) {
  // olaylar 10 ms çözünürlükte
  const dt = 0.01; let lastSeen = 0, inGame = false, phase = 'load', dropped = null, suspect = null;
  let hostBusyUntil = -1, guestBusyUntil = -1; const queue = []; let lastCheck = 0, graceUntil = 0, strike = 0, loadedSent = false;
  let nextPing = 0, nextSt = 0, warmFrames = 0;
  const firstSt = 5.0; // konuk yüklemeyi bitirip ilk karesini 5. sn'de çiziyor
  for (let t = 0; t < until && dropped === null; t += dt) {
    if (guestStall && Math.abs(t - guestStall[0]) < dt / 2) guestBusyUntil = t + guestStall[1];
    if (hostStall && Math.abs(t - hostStall[0]) < dt / 2) hostBusyUntil = t + hostStall[1];
    const gBusy = t < guestBusyUntil, hBusy = t < hostBusyUntil;
    // konuk gönderimi
    if (!gBusy) {
      if (t >= nextPing) { queue.push([t + 0.03, 'ping']); nextPing = t + 2; }
      if (t >= firstSt && t >= nextSt) {
        queue.push([t + 0.03, 'st']); nextSt = t + 1 / 15;
        warmFrames++;
        if (rule === 'yeni' && !loadedSent && warmFrames > 30) { queue.push([t + 0.03, 'loaded']); loadedSent = true; } // ısınma: ~2 sn akıcı kare
      }
    }
    if (hBusy) continue; // host takılı: hiçbir şey işlenmez
    const deliver = () => { for (let i = queue.length - 1; i >= 0; i--) if (queue[i][0] <= t) { const m = queue[i][1]; queue.splice(i, 1); lastSeen = t; if (m === 'st') { inGame = true; } if (m === 'loaded') phase = 'game'; } };
    const check = () => {
      if (rule === 'v04') { if (inGame && t - lastSeen > 15) dropped = t; return; }
      // yeni kural: kendi takılmasını telafi eder, iki vuruş, şüpheli → hayalet yuva → 60 sn sonra düşür
      if (t - lastCheck > 1.0) graceUntil = t + 3; // host'un kendisi takıldı: önce kuyruktakiler işlensin
      lastCheck = t;
      if (t < graceUntil) return;
      const limit = phase === 'game' ? 8 : 90;
      if (t - lastSeen > limit) { strike++; if (strike >= 2 && suspect === null) suspect = t; } else { strike = 0; suspect = null; }
      if (suspect !== null && t - suspect > 60) dropped = t;
    };
    if (rafFirst) { check(); deliver(); } else { deliver(); check(); }
  }
  return dropped === null ? 'düşürülmedi' : `düşürüldü @ ${dropped.toFixed(1)} sn`;
}
const rows = [];
const cases = [
  ['Konuk ilk karesinden sonra 16 sn takılır (06c: ilk konuğun ilk ağır karesi + diğer konukların yüklenmesi)', { guestStall: [5.05, 16] }],
  ['Konuk 12 sn takılır', { guestStall: [5.05, 12] }],
  ['Host 16 sn takılır, sonra önce rAF çalışır', { hostStall: [20, 16], rafFirst: true }],
  ['Host 16 sn takılır, önce iletiler işlenir', { hostStall: [20, 16], rafFirst: false }],
  ['Konuk gerçekten kopar (bir daha ileti yok)', { guestStall: [20, 999] }],
];
for (const [ad, c] of cases) rows.push({ durum: ad, v04: sim({ rule: 'v04', ...c, until: 120 }), yeni: sim({ rule: 'yeni', ...c, until: 120 }) });
console.table(rows);
