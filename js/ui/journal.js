import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el, fmtGold } from '../core/util.js';
import { quests, STORY, ACHIEVEMENTS } from '../game/quests.js';
import { ISLANDS, DIG_SITES, POIS } from '../world/worldData.js';
import { SPECIES } from '../wildlife/animals.js';
import { MARINE } from '../wildlife/megafauna.js';
import { FISH } from '../wildlife/fish.js';
import { RARITY } from '../economy/items.js';
import { treasure } from '../treasure/treasure.js';
import { time, DAILY, PERIODIC, SHOP_HOURS } from '../world/time.js';
import { sky } from '../world/sky.js';

const EXTRA_ANIMALS = Object.fromEntries(Object.entries(MARINE).map(([k, v]) => [k, v.name]));

const SHOP_NAMES = { general: 'Tüccar Rıza', fisher: 'Balıkçı Yusuf', weapons: 'Demirci Kara Ali', tailor: 'Terzi Lale', shipwright: 'Usta Bora', cartographer: 'Haritacı Nevra', treasure: 'Sedef Hanım', trader: 'Halil Reis (ticaret günleri)' };

// Zaman çizelgesi sekmesi: takvim, günün programı, hava tahmini, gelgit tablosu, macera günlüğü
function timelineTab(sc, data) {
  const live = G.state === 'playing' && !data?.timeData;
  const td = live ? { day: time.day, log: time.log } : (data?.timeData || { day: 1, log: [] });
  const day = td.day || 1;
  const hour = live ? sky.hour : null;
  const now = live ? time.totalHours() : null;
  if (live) {
    const tide = time.tide();
    sc.appendChild(el('div', { class: 'tl-head' },
      el('b', {}, `Gün ${day} · ${time.hourString(hour)}`),
      el('span', {}, `${sky.weatherIcon(sky.weatherKey)} ${sky.weatherName(sky.weatherKey)}`),
      el('span', {}, `🌊 Gelgit ${time.tideRising() ? 'yükseliyor' : 'alçalıyor'} (${tide >= 0 ? '+' : ''}${tide.toFixed(2)} m)`)));
  } else sc.appendChild(el('div', { class: 'tl-head' }, el('b', {}, `Son kayıt: Gün ${day}`)));

  const cols = el('div', { class: 'tl-cols' });
  // günün programı
  const c1 = el('div', { class: 'col' }, el('h3', {}, 'Bugünün programı'));
  for (const e of time.scheduleFor(day)) {
    const start = (day - 1) * 24 + e.h, end = e.end !== undefined ? (day - 1) * 24 + e.end : start + 0.25;
    const state = now === null ? '' : now >= end ? ' past' : now >= start ? ' now' : '';
    c1.appendChild(el('div', { class: 'tl-row' + state },
      el('span', { class: 'tl-time' }, time.hourString(e.h) + (e.end !== undefined ? '–' + time.hourString(e.end) : '')),
      el('span', { class: 'tl-ic' }, e.icon),
      el('div', {}, el('b', {}, e.title), el('div', { class: 'muted' }, e.desc))));
  }
  // takvim (7 gün)
  c1.appendChild(el('h3', {}, 'Takvim'));
  const cal = el('div', { class: 'tl-cal' });
  for (let d = day; d < day + 7; d++) {
    const ev = time.scheduleFor(d).filter((e) => PERIODIC.some((p) => p.id === e.id));
    cal.appendChild(el('div', { class: 'tl-day' + (d === day ? ' today' : '') }, el('b', {}, d === day ? 'Bugün' : `Gün ${d}`),
      el('div', { class: 'tl-dayev' }, ev.length ? ev.map((e) => `${e.icon} ${e.title}`).join('<br>') : '<span class="muted">Sakin gün</span>')));
  }
  c1.appendChild(cal);
  c1.appendChild(el('div', { class: 'muted', style: { fontSize: '14px' } }, PERIODIC.map((p) => `${p.icon} ${p.title}: her ${p.every} günde bir — ${p.desc}`).join(' · ')));

  const c2 = el('div', { class: 'col' });
  if (live) {
    c2.appendChild(el('h3', {}, 'Hava tahmini'));
    const fc = [{ key: sky.weatherKey, at: null }, ...(sky.forecast || [])];
    const fl = el('div', { class: 'tl-fc' });
    for (const f of fc) fl.appendChild(el('div', { class: 'tl-fcit' }, el('div', { class: 'big' }, sky.weatherIcon(f.key)), el('b', {}, sky.weatherName(f.key)),
      el('div', { class: 'muted' }, f.at === null ? 'Şimdi' : `${f.at - now < 24 ? '' : 'yarın '}~${time.hourString(f.at)}`)));
    c2.appendChild(fl);
    c2.appendChild(el('div', { class: 'muted', style: { fontSize: '14px' } }, 'Tahminler her zaman tutmaz; denizciler bulutları ve rüzgârı izler. Fırtınada yelkenleri azalt, şimşekli havada açıkta durma.'));
    c2.appendChild(el('h3', {}, 'Gelgit tablosu'));
    const tl = el('div', { class: 'tl-tides' });
    for (const t of time.nextTides(4)) tl.appendChild(el('div', {}, `${t.high ? '🌊 Yüksek su' : '🏖 Alçak su'} — ${t.at - now >= 24 - hour ? 'yarın ' : ''}${time.hourString(t.at)}`));
    c2.appendChild(tl);
    c2.appendChild(el('div', { class: 'muted', style: { fontSize: '14px' } }, 'Alçak suda bazı kumsallar ve sığlıklar açığa çıkar; bazı hazineler yalnızca o zaman kazılabilir. Gemiyle sığlıklara dikkat!'));
  }
  c2.appendChild(el('h3', {}, 'Dükkân saatleri'));
  const sh = el('div', { class: 'tl-shops' });
  for (const k in SHOP_NAMES) {
    const h = SHOP_HOURS[k];
    const open = live ? time.shopOpen(k) : null;
    sh.appendChild(el('div', {}, el('span', {}, SHOP_NAMES[k]), el('span', { class: open === null ? '' : open ? 'open' : 'closed' }, `${String(h[0]).padStart(2, '0')}:00–${h[1] === 24 ? '24:00' : String(h[1]).padStart(2, '0') + ':00'}${open === null ? '' : open ? ' · açık' : ' · kapalı'}`)));
  }
  c2.appendChild(sh);
  cols.append(c1, c2);
  sc.appendChild(cols);

  // macera günlüğü
  sc.appendChild(el('h3', {}, 'Macera günlüğü'));
  const log = [...(td.log || [])].reverse();
  if (!log.length) sc.appendChild(el('div', { class: 'muted' }, 'Henüz yazılacak bir macera yok. Hazine bul, fırtınalara göğüs ger, efsaneler yaz!'));
  let lastDay = null;
  const lg = el('div', { class: 'tl-log' });
  for (const e of log.slice(0, 120)) {
    if (e.day !== lastDay) { lastDay = e.day; lg.appendChild(el('div', { class: 'tl-logday' }, `Gün ${e.day}`)); }
    lg.appendChild(el('div', { class: 'tl-logit ' + (e.kind || '') }, el('span', { class: 'tl-time' }, time.hourString(e.hour)), el('span', {}, e.text)));
  }
  sc.appendChild(lg);
}
void DAILY;

// Korsan Defteri: hikâye, görevler, keşifler, koleksiyon, başarımlar
export function openJournal(data = null) {
  const q = data || quests;
  let tab = data?.tab || 'hikaye';
  const body = el('div', { class: 'col journal' });
  const render = () => {
    body.innerHTML = '';
    const tabs = el('div', { class: 'tabs' });
    for (const [k, n] of [['hikaye', 'Hikâye'], ['gorev', 'Görevler'], ['ada', 'Adalar'], ['hazine', 'Hazineler'], ['canli', 'Canlılar'], ['balik', 'Balıklar'], ['zaman', 'Zaman Çizelgesi'], ['basarim', 'Başarımlar'], ['istatistik', 'İstatistik']]) {
      tabs.appendChild(el('div', { class: 'tab' + (tab === k ? ' active' : ''), onclick: () => { tab = k; render(); } }, n));
    }
    body.appendChild(tabs);
    const sc = el('div', { class: 'scroll', style: { flex: 1, overflow: 'auto' } });
    const st = q.stats || {};
    if (tab === 'hikaye') {
      sc.appendChild(el('p', { style: { fontStyle: 'italic' } }, 'Mavi Kırıklar\'da altmış yıl önce Kaptan Mira Veyl, Son Hazine\'yi bulduğunu ilan edip kayboldu. Geriye parçalanmış bir harita, eski günlükler ve gizemli ipuçları kaldı…'));
      STORY.forEach((s, i) => sc.appendChild(el('div', { class: 'story-step' + (i < q.stage ? ' done' : i === q.stage ? ' cur' : '') },
        el('b', {}, `${i + 1}. ${s.title}`), el('div', {}, i <= q.stage ? s.goal : '???'))));
      const pieces = (q.flags?.parca1 ? 1 : 0) + (q.flags?.kizilYenildi ? 1 : 0);
      sc.appendChild(el('h3', {}, `Mira Veyl'in Harita Parçaları: ${pieces}/4`));
      sc.appendChild(el('div', { class: 'muted' }, 'Tam sürümdeki 10 aşamalı ana hikâyenin ilk 5 aşaması bu sürümde oynanabilir; Volkanik Adalar, Hayalet Adalar, Buz Krallığı, Çöl Adaları ve Yitik Ufuk sonraki geliştirme aşamalarında eklenecek.'));
    } else if (tab === 'gorev') {
      sc.appendChild(el('h3', {}, 'Aktif yan görevler'));
      if (!q.side?.length) sc.appendChild(el('div', { class: 'muted' }, 'Aktif yan görevin yok. Limandaki görev panosuna bak.'));
      for (const s of q.side || []) sc.appendChild(el('div', { class: 'jcard' }, el('div', { class: 't' }, s.title), el('div', {}, s.text), el('div', {}, `İlerleme: ${s.progress || 0}/${s.need} · Ödül: ${s.reward} altın`)));
      sc.appendChild(el('h3', {}, 'Tamamlanan görevler'));
      sc.appendChild(el('div', {}, (q.completed || []).join(' · ') || '—'));
    } else if (tab === 'ada') {
      const g = el('div', { class: 'jgrid' });
      for (const I of ISLANDS) {
        const d = q.discovered?.[I.id];
        g.appendChild(el('div', { class: 'jcard' + (d ? '' : ' locked') }, el('div', { class: 't' }, d ? I.name : 'Keşfedilmemiş ada'), el('div', {}, d ? I.desc : 'Haritadaki sisli bölgeleri keşfet.'), el('div', { class: 'muted' }, d ? `Biyom: ${I.biome === 'hayalet' ? 'Hayalet Adalar' : 'Tropikal Korsan Cenneti'}` : '')));
      }
      for (const P of POIS) {
        const d = q.discovered?.[P.id];
        if (!d) continue;
        g.appendChild(el('div', { class: 'jcard' }, el('div', { class: 't' }, P.name), el('div', { class: 'muted' }, 'Önemli nokta')));
      }
      sc.appendChild(g);
    } else if (tab === 'hazine') {
      sc.appendChild(el('div', {}, `Bulunan hazineler: ${st.treasures || 0} · Satılan sandıklar: ${st.chests || 0}`));
      const g = el('div', { class: 'jgrid', style: { marginTop: '8px' } });
      for (const s of DIG_SITES) {
        const f = (data ? data.treasureFound : null) || null;
        void f;
        const isl = ISLANDS.find((i) => i.id === s.island);
        const found = (q.foundSites || (G.state === 'playing' ? treasure.found : G.foundSites) || {})[s.id];
        g.appendChild(el('div', { class: 'jcard' + (found ? '' : ' locked') }, el('div', { class: 't' }, found ? `${isl.name}` : 'Bilinmeyen hazine'), el('div', { class: 'muted' }, found ? `Bulundu: ${new Date(found).toLocaleDateString('tr-TR')}` : 'Bir hazine haritası bul.')));
      }
      sc.appendChild(g);
    } else if (tab === 'canli') {
      const g = el('div', { class: 'jgrid' });
      const all = { ...Object.fromEntries(Object.entries(SPECIES).map(([k, v]) => [k, v.name])), ...EXTRA_ANIMALS };
      for (const k in all) {
        const seen = q.collection?.animals?.[k];
        g.appendChild(el('div', { class: 'jcard' + (seen ? '' : ' locked') }, el('div', { class: 't' }, seen ? all[k] : '???'), el('div', {}, seen ? (SPECIES[k]?.desc || MARINE[k]?.desc || 'Denizlerin büyük canlısı.') : 'Henüz gözlemlenmedi.'), seen ? el('div', { class: 'muted' }, 'İlk görülme: ' + seen.first) : null));
      }
      sc.appendChild(g);
    } else if (tab === 'balik') {
      const g = el('div', { class: 'jgrid' });
      for (const k in FISH) {
        const f = FISH[k], c = q.collection?.fish?.[k];
        const r = RARITY[f.rarity];
        g.appendChild(el('div', { class: 'jcard' + (c ? '' : ' locked') },
          el('div', { class: 't' }, c ? f.name : '???'),
          el('div', { style: { color: r.color === '#c9c2b0' ? '#7a6a50' : r.color, fontWeight: 700 } }, r.name),
          c ? el('div', {}, `En büyük: ${c.len} cm · ${c.weight} kg (${c.count} adet)`) : el('div', { class: 'muted' }, `Bölge: ${f.zone === 'reef' ? 'Mercan sığlıkları' : 'Açık deniz'}`),
          c ? el('div', { class: 'muted' }, `Bölge: ${c.zone} · Yem: ${c.bait} · Saat: ${c.time} · ${c.date}`) : el('div', { class: 'muted' }, `En uygun saat: ${f.time} · Yem: ${f.bait.join(', ')}`),
          c ? el('div', { class: 'muted' }, `Beslenme: ${f.diet}`) : null));
      }
      sc.appendChild(g);
    } else if (tab === 'zaman') {
      timelineTab(sc, data);
    } else if (tab === 'basarim') {
      const g = el('div', { class: 'jgrid' });
      for (const a of ACHIEVEMENTS) {
        const d = q.achievements?.[a.id];
        g.appendChild(el('div', { class: 'jcard' + (d ? '' : ' locked') }, el('div', { class: 't' }, (d ? '🏆 ' : '') + a.name), el('div', {}, a.desc), d ? el('div', { class: 'muted' }, d) : null));
      }
      sc.appendChild(g);
    } else {
      const kills = Object.entries(st.kills || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || '—';
      sc.appendChild(el('div', { class: 'col' },
        el('div', {}, `Toplam kazanç: ${fmtGold(st.earned || 0)} altın`),
        el('div', {}, `Satılan eşya: ${st.sold || 0} (${fmtGold(st.soldValue || 0)} altın)`),
        el('div', {}, `Yakalanan balık: ${st.fish || 0}`),
        el('div', {}, `En derin dalış: ${(st.maxDepth || 0).toFixed(1)} m`),
        el('div', {}, `Batırılan korsan gemisi: ${st.shipsSunk || 0}`),
        el('div', {}, `Yenilen düşmanlar: ${kills}`)));
    }
    body.appendChild(sc);
  };
  render();
  ui.open(ui.panel('Korsan Defteri', body), { kind: 'journal', closeKeys: ['KeyJ'] });
}
