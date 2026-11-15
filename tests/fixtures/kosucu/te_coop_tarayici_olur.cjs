// (te) Co-op: tarayıcı süreci senaryo sürerken öldürülür (kosucu_negatif.mjs '[test] KOSUCU_NEGATIF_OLDUR' satırını görünce).
// Koşu KALMALI: hatalar.sayfa'da {oyuncu: null, 'TARAYICI ÇÖKTÜ/KOPTU'}. (Son düzeltici 2, inceleme KC-3) kopmadan sonraki tick()
// kopma hatası atar ve senaryo durur: TE02 hiç kaydedilmez (eskiden kapalı sayfalar atlanıyor, TE02 undefined değerle boşuna
// geçiyordu). Süreç kendiliğinden biter.
module.exports = async ({ host, ev, tick, log, check }) => {
  const n = await ev(host, `DK.sim(1)`, 'sim');
  check('TE01 Ev sahibi ilerledi', n === 30, n);
  log('KOSUCU_NEGATIF_OLDUR');
  await new Promise((r) => setTimeout(r, 4000));   // öldürme bu arada
  await tick(1);
  const m = await ev(host, `window.__simSayisi`, 'sim sayısı');
  check('TE02 Öldürmeden sonraki onay (koşmamalı: senaryo tick() kopma hatasıyla durur)', m === undefined, m);
};
