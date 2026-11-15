// (pk4) Co-op: işaretçi kilidi taklidi her oyuncunun bağlamında kurulu (kosucu17). Her sekmede bir tuval kilitlenir: istek
// çözülür, pointerLockElement tuvaldir ve istek taklitten geçmiştir (sayaçlı). Beklenen: GECTI.
module.exports = async ({ pages, ev, check }) => {
  for (const [i, p] of pages.entries()) {
    const r = await ev(p, `(async () => { const c = document.createElement('canvas'); document.body.appendChild(c); const s = await c.requestPointerLock().then(() => 'ok', (e) => e.name); await new Promise((q) => setTimeout(q, 50)); const f = Element.prototype.requestPointerLock; return [s, document.pointerLockElement === c, !!(f.__kosucuTaklit && f.__kosucuTaklit.verildi >= 1)]; })()`, 'kilit');
    check(`PK4-0${i + 1} ${p.oyuncuAnahtari}: işaretçi kilidi taklitle verildi`, JSON.stringify(r) === JSON.stringify(['ok', true, true]), r);
  }
};
