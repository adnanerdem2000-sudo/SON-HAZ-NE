// (rc; son düzeltici 2, inceleme KC-1) Co-op: oda sahibinin (Kaptan, ilk açılan sekme: en eski canlı renderer) renderer süreci bir ev()
// isteği sürerken öldürülür (kosucu_negatif.mjs '[test] KOSUCU_NEGATIF_OLDUR' satırını görünce). Eskiden istek EVALERR sayılıyor,
// tick()'teki pages[0].waitForTimeout 'Page crashed' ile reddedilip koşu KOSUCU_HATASI oluyordu. Beklenen: KALDI; Kaptan'ın sayfa
// hatası 'SAYFA ÇÖKTÜ (renderer crash)'; kopma.tur 'renderer' (çöken: Kaptan); yarıdaki istek hata sayılmaz (evalErrors 0); senaryo
// durur, RC02 koşmaz; koşucu hatası yok.
module.exports = async ({ host, guests, ev, tick, log, check }) => {
  const n = await ev(host, `DK.sim(1)`, 'sim');
  check('RC01 Ev sahibi ilerledi', n === 30, n);
  log('KOSUCU_NEGATIF_OLDUR');
  await ev(host, `new Promise((r) => setTimeout(() => r('öldürülmedi'), 20000))`, 'öldürme sırasında');   // öldürme bu istek sürerken
  await tick(1);
  const m = await ev(guests[0], `window.__simSayisi`, 'konuk sim sayısı');
  check('RC02 Öldürmeden sonraki kontrol (koşmamalı)', typeof m === 'number', m);
};
