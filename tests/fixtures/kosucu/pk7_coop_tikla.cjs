// (pk7/pk8, son düzeltici: DOG-3) Co-op senaryolarının tikla yardımcısı run.cjs tikla adımıyla aynı davranmalı: kilitsizken düğmeyi
// tıklar; kilitliyken (taklitte ve gerçek kilitte) zaman aşımına düşer, düğme ve tuval tık almaz, başarısızlık evalErrors'a yazılır ve
// false döner. pk7: taklit (varsayılan), pk8: --isaretci-kilidi gercek. Beklenen: ikisinde de KALDI (tek neden tikla zaman aşımı),
// PK7-01..03 geçer.
module.exports = async ({ host, ev, check, tikla }) => {
  await ev(host, `window.__tik = 0; window.__tuval = []; 'sıfırlandı'`);
  const a = await tikla(host, '#dugme', 'kilitsiz');
  const tikA = await ev(host, `window.__tik`);
  check('PK7-01 Kilitsiz tikla düğmeyi etkinleştirdi', a === true && tikA === 1, { donus: a, tik: tikA });
  await host.mouse.click(200, 150);   // imleç tuvalde; sonra tuval kilitlenir
  await ev(host, `DK.kilitle()`);
  await host.waitForTimeout(300);
  await ev(host, `window.__tik = 0; window.__tuval = []; 'sıfırlandı'`);
  const b = await tikla(host, { metin: 'Düğme', tam: true }, 'kilitli', { zaman: 3000 });
  const s = await ev(host, `[window.__tik, window.__tuval.length, document.pointerLockElement === DK.tuval]`);
  check('PK7-02 Kilitliyken tikla false döndü; düğme ve tuval tık almadı, kilit sürüyor', b === false && JSON.stringify(s) === JSON.stringify([0, 0, true]), { donus: b, durum: s });
  const c = await tikla(host, '#yok-boyle-bir-oge', 'yanlis-hedef', { zaman: 500 });
  check('PK7-03 Olmayan öğeye tikla false döndü', c === false, c);
};
