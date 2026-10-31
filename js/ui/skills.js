import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el } from '../core/util.js';
import { iconSVG } from '../economy/items.js';
import { progress, SKILLS, SKILL_MAX, MAX_LEVEL, need, rankOf, nextRank } from '../game/progress.js';

// Korsan Rütbesi paneli: seviye, deneyim, rütbe ve dört dallı yetenek ağacı (K)
export function openSkills() {
  const body = el('div', { class: 'col skills' });
  const render = () => {
    body.innerHTML = '';
    const L = progress.level, nx = nextRank(L);
    const pct = L >= MAX_LEVEL ? 100 : Math.round((progress.xp / need(L)) * 100);
    body.appendChild(el('div', { class: 'skills-head' },
      el('div', { class: 'rank-badge big' }, String(L)),
      el('div', { class: 'col', style: { flex: 1, gap: '4px' } },
        el('div', { class: 'rank-title' }, rankOf(L)),
        el('div', { class: 'xp-big' }, el('div', { class: 'xp-big-fill', style: { width: pct + '%' } })),
        el('div', { class: 'muted' }, L >= MAX_LEVEL ? 'En yüksek rütbeye ulaştın — denizlerin efsanesisin!' : `${progress.xp.toLocaleString('tr-TR')} / ${need(L).toLocaleString('tr-TR')} XP · Sonraki rütbe: ${nx ? `${nx[1]} (Seviye ${nx[0]})` : '—'}`)),
      el('div', { class: 'pts-box' + (progress.points ? ' glow' : '') }, el('b', {}, String(progress.points)), el('span', {}, 'yetenek puanı'))));
    const grid = el('div', { class: 'skill-grid' });
    for (const key in SKILLS) {
      const B = SKILLS[key];
      const col = el('div', { class: 'skill-branch' },
        el('div', { class: 'branch-head' }, el('span', { class: 'ico', html: iconSVG(B.icon === 'sword' ? 'kilic' : B.icon === 'pistol' ? 'tabanca' : B.icon === 'anchor' ? 'pusula' : 'kurek') }), B.name));
      col.style.setProperty('--bc', B.color);
      for (const s of B.list) {
        const r = progress.rankOfSkill(s.id);
        const can = progress.canLearn(s.id);
        const pips = el('div', { class: 'pips' });
        for (let i = 0; i < SKILL_MAX; i++) pips.appendChild(el('span', { class: i < r ? 'on' : '' }));
        col.appendChild(el('div', { class: 'skill-card' + (r ? ' has' : '') },
          el('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center' } }, el('b', {}, s.name), pips),
          el('div', { class: 'skill-now' }, r ? `Şu an: ${s.desc(r)}` : 'Henüz öğrenilmedi'),
          r < SKILL_MAX ? el('div', { class: 'skill-next' }, `Sonraki: ${s.desc(r + 1)}`) : el('div', { class: 'skill-next done' }, 'Ustalık tamam'),
          r < SKILL_MAX ? el('button', { class: 'btn small' + (can ? ' gold' : ''), disabled: can ? null : 'true', onclick: () => { if (progress.learn(s.id)) { G.notify(`Yetenek öğrenildi: ${s.name} (${r + 1}/${SKILL_MAX})`, 'good', 2500); render(); } } }, can ? 'Öğren (1 puan)' : 'Puan gerekli') : null));
      }
      grid.appendChild(col);
    }
    body.appendChild(grid);
    body.appendChild(el('div', { class: 'muted', style: { marginTop: '6px' } }, 'Deneyim kazan: düşman ve vahşi hayvan yen, hazine çıkar, yeni yerler ve canlılar keşfet, balık tut, bulmaca çöz, gemi batır ya da ele geçir, efsanevi düşmanları alt et. Her seviye bir yetenek puanı verir; rütbe atlayınca canın ve dayanıklılığın tazelenir.'));
  };
  render();
  const off = G.on('levelUp', () => render());
  ui.open(ui.panel('Korsan Rütbesi', body, { style: { width: 'min(1040px, 96vw)' } }), { closeKeys: ['KeyK'], onClose: () => off?.() });
}
