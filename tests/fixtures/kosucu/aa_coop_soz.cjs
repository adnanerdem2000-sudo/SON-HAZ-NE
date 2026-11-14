// (aa) Co-op check()'e söz (Promise) verilmesi (A1-07): await unutulmuştur; söz her zaman 'doğru'dur ama değer denetlenmedi.
// Beklenen: KALDI (AA01 kalır, AA02 geçer).
module.exports = async ({ host, ev, check }) => {
  check('AA01 Ev sahibinde bayrak doğru (await unutuldu)', ev(host, `true`, 'bayrak'));
  check('AA02 Sağlam kontrol', (await ev(host, `typeof DK`, 'dk')) === 'object');
};
