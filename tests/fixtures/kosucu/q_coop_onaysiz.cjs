// (q) Co-op: hiç check() çağırmayan senaryo. Beklenen: KALDI (onaysız).
module.exports = async ({ host, ev }) => {
  await ev(host, `1 + 1`, 'iki');
};
