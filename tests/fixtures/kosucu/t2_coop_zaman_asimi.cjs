// (t2) Co-op zaman aşımı (A1-05): ZAMAN_ASIMI, rapor yazılır, geç gelen kontrol sayılmaz.
module.exports = async ({ host, check }) => {
  check('T01 Zaman aşımından önceki kontrol', true);
  await host.waitForTimeout(20000);
  check('T02 Zaman aşımından sonraki kontrol (sayılmamalı)', true);
};
