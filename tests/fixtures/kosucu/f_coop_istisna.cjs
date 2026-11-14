// (f) Co-op: ev() içinde istisna. Eski koşucu 'EVALERR' yazıp yutuyordu (K-12). Beklenen: KALDI.
module.exports = async ({ host, ev, check }) => {
  await ev(host, `(() => { throw new Error('yapay istisna (kosucu_negatif f)'); })()`, 'yapay');
  check('F01 İstisnadan sonraki kontrol', true);
};
