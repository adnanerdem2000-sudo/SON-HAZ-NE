// (p) Co-op başlatma betiği (module.exports.meta.baslatma): her oyuncunun sayfasında sayfa betiklerinden önce çalışır. Beklenen: GECTI.
module.exports = async ({ pages, ev, check }) => {
  const d = [];
  for (const p of pages) d.push(await ev(p, `window.__BASLATMA_COOP`, 'baslatma'));
  check('P01 Başlatma betiği her oyuncuda çalıştı', d.every((x) => x === 'tamam'), d);
};
module.exports.meta = { baslatma: `window.__BASLATMA_COOP = 'tamam';` };
