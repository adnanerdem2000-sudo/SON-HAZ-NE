import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el } from '../core/util.js';
import { save, SLOT_COUNT } from '../core/save.js';
import { creator } from './creator.js';
import { openSettings } from './settingsPanel.js';
import { openJournal } from './journal.js';
import { net } from '../net/net.js';
import { audio } from '../core/audio.js';
import { STORY } from '../game/quests.js';
import { iconSVG } from '../economy/items.js';

const fmtTime = (s) => { const h = Math.floor((s || 0) / 3600), m = Math.floor(((s || 0) % 3600) / 60); return h ? `${h} sa ${m} dk` : `${m} dk`; };
const fmtDate = (t) => t ? new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';

// Menü simgeleri (satır içi SVG, tek renk — currentColor)
const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const MENU_ICONS = {
  play: svg('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  ship: svg('<path d="M3 15h18l-3 5H6z"/><path d="M12 3v12M12 4l6 8h-6M12 6l-5 6h5"/>'),
  map: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  crew: svg('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c1-4 4-6 6-6s5 2 6 6M10 20c1-4 4-6 6-6s5 2 6 6"/>'),
  hat: svg('<path d="M2 15c3 2 17 2 20 0"/><path d="M5 15c0-6 3-9 7-9s7 3 7 9"/><circle cx="12" cy="11" r="1.6" fill="currentColor"/>'),
  book: svg('<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-6a3 3 0 00-3 3"/><path d="M20 4v14h-6"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  scroll: svg('<path d="M6 3h11a2 2 0 012 2v12"/><path d="M6 3a2 2 0 00-2 2v2h4"/><path d="M8 5v14a2 2 0 002 2h9a2 2 0 002-2v-2H10"/><path d="M11 9h5M11 13h5"/>'),
  door: svg('<path d="M14 3H5v18h9"/><path d="M10 12h11M18 9l3 3-3 3"/>'),
};
const NEWS = [
  '20×20 km dünya: altı bölge, 50\'den fazla ada, limanlar, kaleler, tapınak ve hapishane',
  'Beş efsanevi boss: Kraken, Derinlik Yılanı, Taş Muhafız, Volkanik Dev, Lanetli Amiral',
  'Algıya dayalı düşman zekâsı, kombolar, parry, kaçınma ve ragdoll',
  'Gemi bölgesel hasarı, direk kırılması, yangın ve kancayla bordalama',
  'Balinalar, orka ve yunus sürüleri; kurtlar, kutup ayısı, kar canavarı',
  'Barut fıçıları, kaya tuzakları, basınç plakası bulmacaları, gayzerler',
  'Korsan rütbesi: 30 seviye, dört dallı yetenek ağacı',
];
const TIPS = [
  'Dürbünle (Z) ufku tara; balinaların nefesi uzaktan görünür.',
  'Sırtı dönük düşmana vurmak çok daha fazla hasar verir.',
  'Barut fıçısını vur ya da fitilini yak — sonra hemen uzaklaş!',
  'Orkalar suda yüzeni avlar; açık denizde gemiden ayrılma.',
  'Yunuslar hızlı giden geminin pruvasında oynar.',
  'Fırtınada yelkenleri azalt; direk kırılırsa acil direği güvertede dik.',
  'Runlu taş bloklar bir şeyi açar — basınç plakasını ara.',
  'Hayalet Denizleri geceleri başka bir dünyaya dönüşür.',
  'Kazdığın hazine sandığını gemi ambarına koyup limanda sat.',
];

// Ana menü ve alt ekranları
export const menu = {
  init(handlers) {
    this.h = handlers; // { startSolo(slot, data|null), startOnlineHost(room), startOnlineGuest(), quit() }
    this.root = document.getElementById('menu');
    this.buttons = document.getElementById('menu-buttons');
    G.on('roster', (r) => { if (this._lobbyRender) this._lobbyRender(r); });
    this.render();
  },

  show(on) {
    this.root.classList.toggle('active', on);
    if (on) this.render();
  },

  render() {
    const latest = save.latest();
    const click = (fn) => () => { audio.resume(); audio.play('ui', { vol: 0.3 }); fn(); };
    const B = (label, icon, fn, cls = '', sub = null) => el('button', { class: 'mbtn ' + cls, onclick: click(fn) },
      el('span', { class: 'mico', html: MENU_ICONS[icon] || '' }), el('span', { class: 'mlabel' }, label), sub ? el('span', { class: 'msub' }, sub) : null);
    // son macera kartı
    const card = document.getElementById('menu-card');
    card.innerHTML = '';
    if (latest) {
      const d = latest.data;
      const stage = STORY[Math.min(d.quests?.stage || 0, STORY.length - 1)];
      const lvl = d.progress?.level || 1;
      card.appendChild(el('div', { class: 'save-card' },
        el('div', { class: 'sc-head' }, el('span', { class: 'sc-lvl' }, String(lvl)), el('div', { class: 'col', style: { gap: '0' } },
          el('div', { class: 'sc-name' }, d.name || 'Korsan'),
          el('div', { class: 'sc-meta' }, `${latest.kind === 'solo' ? 'Tek oyunculu' : 'Online dünya'} · Yuva ${latest.slot + 1} · ${fmtDate(d.savedAt)}`))),
        el('div', { class: 'sc-row' },
          el('span', {}, `⚓ ${d.ship?.name || 'Gemi yok'}`), el('span', {}, `◉ ${Math.floor(d.player?.inv?.gold || 0).toLocaleString('tr-TR')} altın`),
          el('span', {}, `☀ ${d.time?.day || 1}. gün`), el('span', {}, `⌛ ${fmtTime(d.playTime)}`)),
        el('div', { class: 'sc-goal' }, `Hikâye: ${stage?.title || '-'}`),
        el('button', { class: 'mbtn primary big', onclick: click(() => this.h.continueLatest(latest)) }, el('span', { class: 'mico', html: MENU_ICONS.play }), el('span', { class: 'mlabel' }, 'DEVAM ET'))));
    } else {
      card.appendChild(el('div', { class: 'save-card welcome' }, el('div', { class: 'sc-goal' }, 'Mavi Kırıklar\'ın sisli sularında Kaptan Mira Veyl\'in Son Hazinesi seni bekliyor. Gemini hazırla, korsan!')));
    }
    this.buttons.innerHTML = '';
    const onlineSub = el('div', { class: 'msubrow hidden' },
      el('button', { class: 'chip', onclick: click(() => this.hostScreen()) }, 'Oda kur'),
      el('button', { class: 'chip', onclick: click(() => this.joinScreen()) }, 'Odaya katıl'),
      el('button', { class: 'chip', onclick: click(() => this.quickJoin()) }, 'Hızlı katıl'));
    this.buttons.append(
      B('YENİ MACERA', 'ship', () => this.slotScreen('solo', true), latest ? '' : 'primary', 'Yeni bir korsan ve dünya'),
      B('DÜNYALAR', 'map', () => this.slotScreen('solo'), '', 'Kayıtlı tek oyunculu dünyalar'),
      B('ONLINE', 'crew', () => onlineSub.classList.toggle('hidden'), '', '1-4 kişilik ortak macera'),
      onlineSub,
      B('KORSANIM', 'hat', () => this.editPirate()),
      B('KORSAN DEFTERİ', 'book', () => this.journal()),
      B('AYARLAR', 'gear', () => openSettings()),
      B('KREDİLER', 'scroll', () => this.credits()),
      B('ÇIKIŞ', 'door', () => this.quit(), 'quiet'),
    );
    // yenilikler ve öğüt
    const news = document.getElementById('menu-news');
    news.innerHTML = '';
    news.append(
      el('div', { class: 'news-title' }, 'Sürüm 0.3 — Genişleyen Denizler'),
      el('ul', {}, ...NEWS.map((n) => el('li', {}, n))),
      el('div', { class: 'news-tip' }, el('b', {}, 'Kaptanın öğüdü: '), TIPS[Math.floor(Math.random() * TIPS.length)]));
    document.getElementById('menu-foot').innerHTML = `Sürüm 0.3 · <span class="kbd">WASD</span> hareket · <span class="kbd">E</span> etkileşim · <span class="kbd">M</span> harita · <span class="kbd">Tab</span> envanter · <span class="kbd">J</span> defter · <span class="kbd">K</span> rütbe`;
  },

  // OYNA
  playScreen() {
    const latest = save.latest();
    const body = el('div', { class: 'col', style: { width: 'min(640px, 90vw)' } },
      el('button', { class: 'btn gold', onclick: () => { ui.close(); this.slotScreen('solo', true); } }, 'Yeni tek oyunculu macera'),
      el('button', { class: 'btn', disabled: latest ? null : 'true', onclick: () => { ui.close(); if (latest) this.h.continueLatest(latest); } }, 'Kayıtlı dünyaya devam' + (latest ? ` (${latest.data.name})` : '')),
      el('button', { class: 'btn', onclick: () => { ui.close(); this.onlineScreen(); } }, 'Çevrimiçi macera'),
      el('button', { class: 'btn', onclick: () => { ui.close(); this.joinScreen(); } }, 'Arkadaşlarla oyna (odaya katıl)'),
    );
    ui.open(ui.panel('Oyna', body));
  },

  // Kayıt yuvaları
  slotScreen(kind = 'solo', preferNew = false) {
    const body = el('div', { class: 'col' });
    const render = () => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'muted' }, kind === 'solo' ? 'Tek oyunculu dünyalar tarayıcında kaydedilir (internet gerekmez). Otomatik kayıt 2 dakikada bir yapılır.' : 'Online dünyalar oda sahibinin bilgisayarında kaydedilir.'));
      const grid = el('div', { class: 'slots', style: { marginTop: '10px' } });
      for (const s of save.list(kind)) {
        if (s.empty) {
          grid.appendChild(el('div', { class: 'slot empty', onclick: () => { ui.close(); this.newGame(kind, s.slot); } }, `Yuva ${s.slot + 1} — Yeni macera başlat`));
        } else {
          const stage = STORY[Math.min(s.stage || 0, STORY.length - 1)];
          grid.appendChild(el('div', { class: 'slot', onclick: () => { ui.close(); const d = save.read(kind, s.slot); this.h.startGame({ kind, slot: s.slot, data: d }); } },
            el('div', { class: 'slot-name' }, s.name),
            el('div', {}, `Gemi: ${s.ship || '-'} · ${s.gold ?? 0} altın`),
            el('div', {}, `Hikâye: ${stage?.title || '-'}`),
            el('div', { class: 'muted' }, `${fmtDate(s.savedAt)} · ${fmtTime(s.playTime)}`),
            el('div', { class: 'row', style: { marginTop: '6px' } },
              el('button', { class: 'btn small gold', onclick: (e) => { e.stopPropagation(); ui.close(); const d = save.read(kind, s.slot); this.h.startGame({ kind, slot: s.slot, data: d }); } }, 'Devam'),
              el('button', { class: 'btn small red', onclick: (e) => { e.stopPropagation(); ui.confirm(`"${s.name}" kaydı silinsin mi? Bu geri alınamaz.`, () => { save.remove(kind, s.slot); render(); }); } }, 'Sil'))));
        }
      }
      body.appendChild(grid);
    };
    render();
    ui.open(ui.panel(kind === 'solo' ? 'Tek Oyunculu — Dünyalar' : 'Online Dünyalar', body));
    if (preferNew) {
      const free = save.list(kind).find((s) => s.empty);
      if (free) { ui.close(); this.newGame(kind, free.slot); }
    }
  },

  newGame(kind, slot) {
    const go = () => {
      creator.open({
        appearance: G.profile.appearance, title: 'Korsanını Oluştur', confirm: 'Maceraya Başla',
        onDone: (app) => { G.profile.appearance = app; G.emit('profileChanged'); this.h.startGame({ kind, slot, data: null, appearance: app }); },
      });
    };
    go();
  },

  // ONLINE merkezi
  onlineScreen() {
    const body = el('div', { class: 'col', style: { width: 'min(640px, 90vw)' } },
      el('div', { class: 'muted' }, 'Arkadaşlarınla 1-4 kişilik ortak dünya. Bağlantı tarayıcılar arasında doğrudan (WebRTC) kurulur; oda sahibi dünyayı yönetir ve kaydeder.'),
      el('button', { class: 'btn gold', onclick: () => { ui.close(); this.hostScreen(); } }, 'Oda kur'),
      el('button', { class: 'btn', onclick: () => { ui.close(); this.joinScreen(); } }, 'Odaya katıl'),
      el('button', { class: 'btn', onclick: () => { ui.close(); this.quickJoin(); } }, 'Hızlı katıl (açık odalar)'),
    );
    ui.open(ui.panel('Online', body));
  },

  hostScreen() {
    const f = { name: `${G.profile.appearance.name} korsanları`, public: false, max: 4, pw: '', difficulty: 'normal', friendlyFire: false, slot: 0 };
    const body = el('div', { class: 'col', style: { width: 'min(700px, 92vw)' } });
    const nameIn = el('input', { type: 'text', value: f.name, maxlength: 30 });
    const pwIn = el('input', { type: 'password', placeholder: 'Boş bırakılabilir', maxlength: 20 });
    const sel = (opts, cur, onCh) => { const s = el('select', {}, ...opts.map(([v, n]) => { const o = el('option', { value: v }, n); if (String(v) === String(cur)) o.selected = true; return o; })); s.addEventListener('change', () => onCh(s.value)); return s; };
    const slots = save.list('online');
    const ff = el('input', { type: 'checkbox' });
    body.append(
      el('label', { class: 'set' }, 'Oda adı', nameIn),
      el('label', { class: 'set' }, 'Gizlilik', sel([['false', 'Özel (kodla katılım)'], ['true', 'Herkese açık (listede görünür)']], f.public, (v) => { f.public = v === 'true'; })),
      el('label', { class: 'set' }, 'Oyuncu kapasitesi', sel([[2, '2'], [3, '3'], [4, '4']], f.max, (v) => { f.max = +v; })),
      el('label', { class: 'set' }, 'Oda şifresi', pwIn),
      el('label', { class: 'set' }, 'Dünya / kayıt', sel(slots.map((s) => [s.slot, s.empty ? `Yuva ${s.slot + 1}: Yeni dünya` : `Yuva ${s.slot + 1}: ${s.name} (${fmtDate(s.savedAt)})`]), 0, (v) => { f.slot = +v; })),
      el('label', { class: 'set' }, 'Zorluk', sel([['kolay', 'Kolay'], ['normal', 'Normal'], ['zor', 'Zor']], 'normal', (v) => { f.difficulty = v; })),
      /* 'Dost ateşi' anahtarı kaldırıldı: oyuncular arası hasar yolu yok, işlevsiz seçenek yanıltıcıydı */
      el('div', { class: 'muted' }, 'Arkadaş daveti: oda kurulunca davet bağlantısını ve oda kodunu paylaş.'),
      el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '10px' } },
        el('button', { class: 'btn gold', onclick: async (e) => {
          f.name = nameIn.value.trim() || f.name; f.pw = pwIn.value; f.friendlyFire = ff.checked;
          e.target.disabled = true; e.target.textContent = 'Oda kuruluyor…';
          try {
            const room = await net.host(f);
            ui.close();
            this.lobby(room, true);
          } catch (err) {
            e.target.disabled = false; e.target.textContent = 'Odayı oluştur';
            ui.alert('Oda kurulamadı', `${err.message || err.type || err}<br><br><span class="muted">Online mod, sinyal sunucusuna (PeerJS) internet erişimi gerektirir. Tek oyunculu mod internetsiz çalışır.</span>`);
          }
        } }, 'Odayı oluştur')),
    );
    ui.open(ui.panel('Oda Kur', body));
  },

  joinScreen(prefill = '') {
    const body = el('div', { class: 'col', style: { width: 'min(760px, 92vw)' } });
    const codeIn = el('input', { type: 'text', placeholder: 'Oda kodu (ör. K7M2QX)', value: prefill, maxlength: 8, style: { textTransform: 'uppercase', letterSpacing: '4px', fontSize: '24px' } });
    const pwIn = el('input', { type: 'password', placeholder: 'Şifre (varsa)', maxlength: 20 });
    const status = el('div', { class: 'muted' });
    const list = el('div', { class: 'col' });
    const doJoin = async (code, pw) => {
      status.textContent = 'Bağlanılıyor…';
      try {
        const r = await net.join(code, pw);
        ui.close();
        this.lobby(r.room, false, r.started);
      } catch (err) { status.textContent = 'Katılınamadı: ' + (err.message || err); }
    };
    body.append(
      el('h3', {}, 'Oda koduyla katıl'),
      el('div', { class: 'row' }, codeIn, pwIn, el('button', { class: 'btn gold', onclick: () => doJoin(codeIn.value, pwIn.value) }, 'Katıl')),
      status,
      el('h3', {}, 'Arkadaş odaları (son girdiğin odalar)'),
      ...((G.profile.recentRooms || []).length ? G.profile.recentRooms.map((r) => el('div', { class: 'shop-row', style: { gridTemplateColumns: '1fr auto auto' } }, el('b', {}, r.name), el('span', { class: 'muted' }, r.code + ' · ' + fmtDate(r.at)), el('button', { class: 'btn small', onclick: () => doJoin(r.code, pwIn.value) }, 'Katıl'))) : [el('div', { class: 'muted' }, 'Henüz bir odaya girmedin. Arkadaşın sana kod ya da davet bağlantısı gönderebilir.')]),
      el('div', { class: 'row' }, el('h3', { class: 'grow' }, 'Herkese açık odalar'), el('button', { class: 'btn small', onclick: () => scan() }, 'Yenile')),
      list,
    );
    const scan = async () => {
      list.innerHTML = '';
      list.appendChild(el('div', { class: 'muted' }, 'Odalar taranıyor…'));
      try {
        const rooms = await net.listPublic();
        list.innerHTML = '';
        if (!rooms.length) list.appendChild(el('div', { class: 'muted' }, 'Şu an açık oda yok. Sen bir tane kur!'));
        for (const r of rooms) list.appendChild(el('div', { class: 'shop-row', style: { gridTemplateColumns: '1fr auto auto auto' } },
          el('b', {}, r.name), el('span', {}, `${r.players}/${r.max} oyuncu ${r.pw ? '🔒' : ''}`), el('span', { class: 'muted' }, `${r.ping} ms${r.started ? ' · oyunda' : ''}`),
          el('button', { class: 'btn small', disabled: r.players >= r.max ? 'true' : null, onclick: () => doJoin(r.code, pwIn.value) }, 'Katıl')));
      } catch (err) { list.innerHTML = ''; list.appendChild(el('div', { class: 'muted' }, err.message)); }
    };
    ui.open(ui.panel('Odaya Katıl', body));
    scan();
  },

  async quickJoin() {
    ui.alert('Hızlı katıl', 'Açık odalar taranıyor…');
    try {
      const rooms = (await net.listPublic()).filter((r) => r.players < r.max && !r.pw).sort((a, b) => a.ping - b.ping);
      ui.close();
      if (!rooms.length) { ui.alert('Hızlı katıl', 'Uygun açık oda bulunamadı. Bir oda kurup arkadaşlarını davet edebilirsin.'); return; }
      const r = await net.join(rooms[0].code, '');
      this.lobby(r.room, false, r.started);
    } catch (err) { ui.close(); ui.alert('Hızlı katıl', err.message || String(err)); }
  },

  lobby(room, isHost, started = false) {
    const body = el('div', { class: 'col', style: { width: 'min(980px, 94vw)' } });
    const link = `${location.origin}${location.pathname}?join=${room.code}`;
    let ready = isHost;
    const head = el('div', { class: 'row' },
      el('div', { class: 'col grow' }, el('b', { style: { fontSize: '24px' } }, room.name), el('span', { class: 'muted' }, isHost ? 'Sen oda sahibisin. Herkes hazır olunca başlat.' : 'Oda sahibinin oyunu başlatmasını bekle.')),
      el('div', { class: 'col', style: { alignItems: 'center' } }, el('span', { class: 'muted' }, 'Oda kodu'), el('div', { class: 'code-box' }, room.code)));
    const slots = el('div', { class: 'lobby-slots', style: { marginTop: '12px' } });
    const actions = el('div', { class: 'row', style: { marginTop: '14px' } },
      el('button', { class: 'btn', onclick: () => { navigator.clipboard?.writeText(link); G.notify('Davet bağlantısı kopyalandı!', 'good'); audio.play('confirm', { vol: 0.4 }); } }, 'Davet bağlantısını kopyala'),
      el('button', { class: 'btn', onclick: () => this.editPirate(() => { if (!isHost) net.sendApp(); else { net.roster[0].app = G.profile.appearance; net.roster[0].name = G.profile.appearance.name; net._broadcastRoster(); } }) }, 'Karakterimi değiştir'),
      !isHost ? el('button', { class: 'btn', onclick: (e) => { ready = !ready; net.setReady(ready); e.target.textContent = ready ? 'Hazır değilim' : 'Hazırım'; } }, 'Hazırım') : null,
      el('span', { class: 'grow' }),
      el('button', { class: 'btn red', onclick: () => { net.leave(); ui.close(); } }, 'Odadan çık'),
      isHost ? el('button', { class: 'btn gold', id: 'start-btn', onclick: () => { ui.close(); this.h.startOnlineHost(room); } }, 'Oyunu başlat') : null);
    const chatLog = el('div', { style: { maxHeight: '120px', overflow: 'auto', marginTop: '10px', fontSize: '16px' } });
    const chatIn = el('input', { type: 'text', placeholder: 'Lobiye mesaj yaz…', maxlength: 140 });
    chatIn.addEventListener('keydown', (e) => { if (e.code === 'Enter' && chatIn.value.trim()) { net.chat(chatIn.value.trim()); chatIn.value = ''; } });
    const offChat = G.on('chat', (m) => { while (chatLog.childElementCount > 200) chatLog.removeChild(chatLog.firstChild); chatLog.appendChild(el('div', {}, el('b', { style: { color: '#7a3a10' } }, m.from + ': '), m.text)); chatLog.scrollTop = 1e6; });
    this._lobbyRender = (roster) => {
      slots.innerHTML = '';
      for (let i = 0; i < (room.max || 4); i++) {
        const r = roster[i];
        if (!r) { slots.appendChild(el('div', { class: 'lslot' }, el('div', { class: 'muted', style: { marginTop: '50px' } }, 'Boş — davet et'))); continue; }
        const a = r.app || {};
        slots.appendChild(el('div', { class: 'lslot' + (r.ready ? ' ready' : '') },
          el('div', { style: { width: '64px', height: '64px', margin: '0 auto', borderRadius: '50%', background: a.shirtColor || '#ccc', border: `4px solid ${r.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' } }, a.gender === 'f' ? '♀' : '♂'),
          el('div', { class: 'nm' }, r.name),
          el('div', { class: 'muted' }, r.host ? 'Oda sahibi' : r.ready ? 'Hazır' : 'Bekliyor'),
          el('div', { style: { fontSize: '14px' } }, `${a.hat && a.hat !== 'yok' ? 'Şapkalı' : 'Başı açık'} · ${a.coat === 'uzun' ? 'Uzun ceket' : 'Gömlek'}`)));
      }
    };
    this._lobbyRender(net.roster);
    body.append(head, slots, el('div', { class: 'muted', style: { marginTop: '8px' } }, 'Sınıf ya da sabit rol yok — herkes gemiyi kullanabilir, savaşabilir, hazine arayabilir.'), chatLog, chatIn, actions);
    const offStart = G.on('netStart', () => { ui.close(); this.h.startOnlineGuest(); });
    const offLeft = G.on('hostLeft', (why) => { ui.close(); ui.alert('Bağlantı koptu', why || 'Oda sahibi odayı kapattı.'); });
    ui.open(ui.panel('Lobi', body, { onX: () => { net.leave(); ui.close(); } }), { kind: 'lobby', onClose: () => { this._lobbyRender = null; offChat(); offStart(); offLeft(); }, onEsc: () => {} });
    if (started && !isHost) { ui.close(); this.h.startOnlineGuest(); }
  },

  editPirate(after) {
    creator.open({
      appearance: G.profile.appearance, title: 'Korsanım', confirm: 'Kaydet',
      onDone: (app) => { G.profile.appearance = app; G.emit('profileChanged'); G.notify('Korsanın kaydedildi.', 'good'); after && after(); },
    });
  },

  journal() {
    const latest = save.latest();
    if (!latest?.data?.quests) { ui.alert('Korsan Defteri', 'Henüz bir macera kaydın yok. Yeni bir macera başlat; keşfettiğin adalar, yakaladığın balıklar ve bulduğun hazineler burada görünecek.'); return; }
    const q = latest.data.quests;
    G.foundSites = latest.data.treasure?.found || {};
    openJournal({ ...q, collection: q.collection || { fish: {}, animals: {} }, timeData: latest.data.time || null });
  },

  credits() {
    const html = `<p><b style="font-family:var(--title);font-size:24px">Deniz Korsanları: Son Hazine</b><br>Tasarım ve geliştirme: Claude (Anthropic) ile birlikte geliştirildi — ilk oynanabilir sürüm.</p>
<h3>Ücretsiz (CC0) varlıklar</h3>
<ul>
<li><b>Quaternius</b> — animasyonlu karakterler (korsan, macera karakterleri, iskelet ekibi, hayaletler, yengeç, yarasa, kurbağa), sandık, sikke, mücevher, kristal (CC0, quaternius.com)</li>
<li><b>Kenney</b> — doğa kiti (palmiye, kaya, çalı, kütük, sütun, dikilitaş, çadır, kamp ateşi, varil, sandık), ses efektleri (Impact, Interface, RPG Audio) (CC0, kenney.nl)</li>
<li><b>cynicmusic</b> — "Battle Theme A" savaş müziği (CC0, OpenGameArt)</li>
<li>Dosyalar <i>@netforge/asset-library-files</i> paketinden alındı; lisans kayıtları <code>CREDITS.md</code> dosyasında.</li>
</ul>
<h3>Yazı tipleri (SIL Open Font License)</h3><ul><li>Pirata One — Rodrigo Fuenzalida, Nicolas Massi</li><li>Crimson Text — Sebastian Kosch</li></ul>
<h3>Yazılım</h3><ul><li>three.js (MIT) — 3B motor</li><li>PeerJS (MIT) — online co-op bağlantısı</li></ul>
<p class="muted">Adalar, gemiler, hayvanlar, balıklar, liman, mağara, gökyüzü, deniz, müzik ve ses atmosferi oyun içinde kodla (prosedürel olarak) üretilir. Hiçbir mevcut oyunun modeli, haritası ya da logosu kopyalanmamıştır.</p>`;
    ui.open(ui.panel('Krediler', el('div', { class: 'reader scroll', html })));
  },

  quit() {
    ui.confirm('Oyundan çıkmak istiyor musun? (Tarayıcı sürümünde sekme kapatılır; masaüstü sürümünde oyun kapanır.)', () => {
      if (window.electronAPI?.quit) { window.electronAPI.quit(); return; }
      window.close();
      setTimeout(() => ui.alert('Çıkış', 'Tarayıcı bu sekmeyi kapatmaya izin vermedi. Oyundan çıkmak için sekmeyi kapatabilirsin. İlerlemen kaydedildi.'), 300);
    });
  },

  // ---- Oyun içi duraklatma menüsü ----
  pause(h) {
    const body = el('div', { class: 'col', style: { width: '380px' } });
    const B = (t, fn, cls = '') => el('button', { class: 'btn ' + cls, onclick: fn }, t);
    body.append(
      B('Devam et', () => ui.close(), 'gold'),
      G.isHost ? B('Kaydet', () => { h.saveNow(true); }) : null,
      B('Korsan Defteri', () => { ui.close(); openJournal(); }),
      B('Korsan Rütbesi', () => { ui.close(); G.emit('openSkills'); }),
      B('Dünya haritası', () => { ui.close(); G.emit('openMap'); }),
      B('Ayarlar', () => openSettings()),
      G.online ? B(`Oda kodu: ${net.room?.code || '-'} (kopyala)`, () => { navigator.clipboard?.writeText(`${location.origin}${location.pathname}?join=${net.room?.code}`); G.notify('Davet bağlantısı kopyalandı.', 'good'); }) : null,
      B('Kontroller', () => ui.alert('Kontroller', `<span class="kbd">W A S D</span> hareket · <span class="kbd">Shift</span> koşma · <span class="kbd">Boşluk</span> zıpla/yukarı yüz · <span class="kbd">C</span> eğil/dal · <span class="kbd">E</span> etkileşim (basılı tut: aç/onar) · <span class="kbd">F</span> meşale · <span class="kbd">Q</span> işaret · <span class="kbd">Tab</span> envanter · <span class="kbd">M</span> harita · <span class="kbd">J</span> defter · <span class="kbd">K</span> korsan rütbesi · <span class="kbd">Sol fare</span> saldırı/kaz/at · <span class="kbd">Sağ fare</span> nişan/savunma · <span class="kbd">R</span> doldur/yem · <span class="kbd">V</span> kaçın · <span class="kbd">G</span> sandığı bırak · <span class="kbd">1-5</span> kılıç, tabanca, kürek, olta, harita · <span class="kbd">N</span> pusula<br><br><b>Gemi:</b> dümende A/D yön, W/S yelken miktarı, Boşluk yelkenleri aç/kapat. Çapa için baş taraftaki ırgata, toplar için yanlara git.`)),
      B('Ana menüye dön', () => ui.confirm(G.isHost ? 'Oyun kaydedilip ana menüye dönülsün mü?' : 'Odadan ayrılıp ana menüye dönülsün mü?', () => h.toMenu()), 'red'),
    );
    ui.open(ui.panel('Duraklatıldı', body), { kind: 'pause' });
  },

  deathScreen(cause, h) {
    const body = el('div', { class: 'col death', style: { width: '480px' } },
      el('div', { style: { fontSize: '20px' } }, cause || 'Bayıldın.'),
      el('div', { class: 'muted' }, 'Taşıdığın sandık olduğu yere düştü. Envanterin seninle.'),
      el('button', { class: 'btn gold', onclick: () => { ui.close(); h.respawn('ship'); } }, 'Gemide uyan'),
      el('button', { class: 'btn', onclick: () => { ui.close(); h.respawn('port'); } }, 'Kırlangıç Limanı\'nda uyan'));
    ui.open(ui.panel('Bayıldın!', body, { closable: false }), { kind: 'death', onEsc: () => {} });
    void iconSVG; void SLOT_COUNT;
  },
};
