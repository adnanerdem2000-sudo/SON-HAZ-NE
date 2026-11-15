// (rg; son düzeltici 2, inceleme KC-1/KC-3) Co-op: konuğun (Tayfa, ikinci açılan sekme: ikinci en eski renderer) renderer süreci senaryo
// beklerken öldürülür. Sonraki tick() kopma hatası atar (senaryo durur); senaryo bu hatayı yakalayıp sürse de kopmadan sonraki check()
// sayılmaz. Eskiden çöken konuğa ev() EVALERR veriyor, senaryo sürüyor ve RG02 boşuna geçiyordu. Beklenen: KALDI; Tayfa'nın sayfa hatası
// 'SAYFA ÇÖKTÜ (renderer crash)'; kopma.tur 'renderer' (çöken: Tayfa); RG01 geçer; RG02 kontrollerde yok, kopma.sayilmayanKontrol'de.
module.exports = async ({ guests, ev, tick, log, check }) => {
  const n = await ev(guests[0], `DK.sim(1)`, 'konuk sim');
  check('RG01 Konuk ilerledi', n === 30, n);
  log('KOSUCU_NEGATIF_OLDUR');
  await new Promise((r) => setTimeout(r, 3000));   // öldürme bu arada
  let hata = null;
  try { await tick(1); } catch (e) { hata = String((e && e.message) || e); }
  log('tick hatası: ' + hata);
  check('RG02 Kopmadan sonraki kontrol (sayılmamalı)', true, hata);
};
