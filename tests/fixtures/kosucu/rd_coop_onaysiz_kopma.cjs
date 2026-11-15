// (rd; son düzeltici 2, inceleme KC-2) Co-op: tarayıcı ana süreci senaryonun İLK onayından önce öldürülür (SIGKILL; OOM benzeri).
// Senaryonun kendi Playwright çağrısı (host.waitForTimeout) koparak reddedilir, hiçbir check() çağrılmaz. Eskiden neden'e yanlışlıkla
// "senaryo hiç onay içermiyor … meta.olcum ile işaretleyin" ekleniyordu. Beklenen: KALDI; neden'de 'tarayıcı çöktü/koptu' ve
// 'senaryo ilk onaydan önce yarıda kaldı', 'hiç onay içermiyor' YOK; koşucu hatası yok.
module.exports = async ({ host, ev, log, check }) => {
  const n = await ev(host, `DK.sim(1)`, 'sim');
  log('KOSUCU_NEGATIF_OLDUR');
  await host.waitForTimeout(5000);   // öldürme bu arada
  check('RD01 Senaryonun birinci onayı (koşmamalı)', n === 30, n);
};
