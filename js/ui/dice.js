import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el } from '../core/util.js';
import { audio } from '../core/audio.js';
import { time } from '../world/time.js';

// Meyhane etkinliği: Korsan Zarı. İki zar atılır, büyük toplam kazanır.
// 6-6 "Kara Bayrak": bahsin üç katı · 1-1 "Yılan Gözü": anında kayıp · beraberlikte yeniden atılır.
// Zarcının günlük kesesi sınırlıdır; her gün yenilenir.

const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
const dieSVG = (n, red = false) => `<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="16" fill="${red ? '#f4e1c8' : '#f3ead6'}" stroke="#3a2412" stroke-width="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${n === 1 || red ? '#a3241a' : '#2a180b'}"/>`).join('')}</svg>`;
const purses = new Map(); // zarcı -> {day, gold}

export function openDice(npc) {
  const p = G.player;
  const key = npc.id || npc.name;
  let P = purses.get(key);
  if (!P || P.day !== time.day) { P = { day: time.day, gold: 400 }; purses.set(key, P); }
  let bet = 25, rolling = false, stats = { w: 0, l: 0 };
  const body = el('div', { class: 'col dice' });
  const mine = el('div', { class: 'dice-pair' }), theirs = el('div', { class: 'dice-pair' });
  const msg = el('div', { class: 'dice-msg' }, 'Bahsini seç ve zarları at. 6-6 Kara Bayrak üç kat öder; 1-1 Yılan Gözü kaybettirir.');
  const info = el('div', { class: 'muted' });
  const betRow = el('div', { class: 'row', style: { gap: '6px', justifyContent: 'center' } });
  const rollBtn = el('button', { class: 'btn gold', onclick: () => roll() }, 'Zarları At');
  const show = (box, a, b, red) => { box.innerHTML = dieSVG(a, red) + dieSVG(b, red); };
  const refresh = () => {
    info.textContent = `Altının: ${Math.floor(p.inv.gold)} · ${npc.name}'in kesesi: ${P.gold} · Bu masada: ${stats.w} galibiyet, ${stats.l} yenilgi`;
    betRow.innerHTML = '';
    for (const b of [10, 25, 50, 100]) betRow.appendChild(el('button', { class: 'chip' + (b === bet ? ' on' : ''), onclick: () => { bet = b; refresh(); } }, `${b} altın`));
  };
  show(mine, 6, 6); show(theirs, 1, 1, true);
  const d = () => 1 + Math.floor(Math.random() * 6);
  const roll = () => {
    if (rolling) return;
    if (p.inv.gold < bet) { msg.textContent = 'O kadar altının yok, kaptan.'; return; }
    if (P.gold < bet * 3) { msg.textContent = `${npc.name}: "Bugünlük kesem bu bahsi kaldırmaz. Yarın gel!"`; return; }
    rolling = true; rollBtn.disabled = true;
    p.inv.gold -= bet;
    const a1 = d(), a2 = d(), b1 = d(), b2 = d();
    let t = 0;
    const iv = setInterval(() => {
      t++;
      show(mine, d(), d()); show(theirs, d(), d(), true);
      audio.tone(900 + Math.random() * 400, 0.04, 'square', 0.02, null, 0.6);
      if (t < 12) return;
      clearInterval(iv);
      show(mine, a1, a2); show(theirs, b1, b2, true);
      const me = a1 + a2, they = b1 + b2;
      let win = 0, text;
      if (a1 === 6 && a2 === 6) { win = bet * 4; text = `KARA BAYRAK! 6-6 attın — ${bet * 3} altın kazandın!`; }
      else if (a1 === 1 && a2 === 1) { text = `Yılan Gözü… 1-1. ${bet} altın kaybettin.`; }
      else if (b1 === 6 && b2 === 6) { text = `${npc.name} Kara Bayrak attı! ${bet} altın gitti.`; }
      else if (me > they) { win = bet * 2; text = `${me} — ${they}: kazandın, +${bet} altın!`; }
      else if (me < they) { text = `${me} — ${they}: ${npc.name} kazandı.`; }
      else { win = bet; text = `${me} — ${they}: berabere, bahis geri döndü. Bir daha!`; }
      p.inv.gold += win;
      P.gold -= win - bet;
      if (win > bet) { stats.w++; audio.play('coin', { vol: 0.6 }); G.emit('diceWin', { amount: win - bet }); }
      else if (win < bet) { stats.l++; audio.play('hit', { vol: 0.3, rate: 1.4 }); }
      msg.textContent = text;
      rolling = false; rollBtn.disabled = false;
      refresh();
    }, 70);
  };
  refresh();
  body.append(
    el('div', { class: 'dice-table' },
      el('div', { class: 'dice-side' }, el('div', { class: 'dice-who' }, 'Sen'), mine),
      el('div', { class: 'dice-vs' }, 'karşı'),
      el('div', { class: 'dice-side' }, el('div', { class: 'dice-who' }, npc.name), theirs)),
    msg, betRow, rollBtn, info);
  ui.open(ui.panel('Korsan Zarı', body, { style: { width: 'min(620px, 94vw)' } }));
}
