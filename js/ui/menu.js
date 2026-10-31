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
    const B = (label, fn, cls = '') => el('button', { class: 'mbtn ' + cls, onclick: () => { audio.resume(); audio.play('ui', { vol: 0.3 }); fn(); } }, label);
    this.buttons.innerHTML = '';
    const cont = B('DEVAM ET', () => { if (latest) this.h.continueLatest(latest); }, latest ? 'primary' : 'disabled');
    if (latest) ui.tipOn(cont, `<b>${latest.data.name}</b><br>${latest.kind === 'solo' ? 'Tek oyunculu' : 'Online (oda sahibi)'} · Yuva ${latest.slot + 1}<br>${fmtDate(latest.data.savedAt)} · ${fmtTime(latest.data.playTime)}`);
    this.buttons.append(
      cont,
      B('OYNA', () => this.playScreen(), latest ? '' : 'primary'),
      B('TEK OYUNCULU', () => this.slotScreen('solo')),
      B('ONLINE', () => this.onlineScreen()),
      B('ODA KUR', () => this.hostScreen()),
      B('ODAYA KATIL', () => this.joinScreen()),
      B('KORSANIM', () => this.editPirate()),
      B('KORSAN DEFTERİ', () => this.journal()),
      B('AYARLAR', () => openSettings()),
      B('KREDİLER', () => this.credits()),
      B('ÇIKIŞ', () => this.quit()),
    );
    document.getElementById('menu-foot').innerHTML = `Sürüm 0.2 — Hava olayları, zaman çizelgesi, yeni fizik · <span class="kbd">WASD</span> hareket · <span class="kbd">E</span> etkileşim · <span class="kbd">M</span> harita · <span class="kbd">Tab</span> envanter`;
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
      el('label', { class: 'set' }, 'Dost ateşi', ff),
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
    const offChat = G.on('chat', (m) => { chatLog.appendChild(el('div', {}, el('b', { style: { color: '#7a3a10' } }, m.from + ': '), m.text)); chatLog.scrollTop = 1e6; });
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
      B('Dünya haritası', () => { ui.close(); G.emit('openMap'); }),
      B('Ayarlar', () => openSettings()),
      G.online ? B(`Oda kodu: ${net.room?.code || '-'} (kopyala)`, () => { navigator.clipboard?.writeText(`${location.origin}${location.pathname}?join=${net.room?.code}`); G.notify('Davet bağlantısı kopyalandı.', 'good'); }) : null,
      B('Kontroller', () => ui.alert('Kontroller', `<span class="kbd">W A S D</span> hareket · <span class="kbd">Shift</span> koşma · <span class="kbd">Boşluk</span> zıpla/yukarı yüz · <span class="kbd">Ctrl</span> eğil/dal · <span class="kbd">E</span> etkileşim (basılı tut: aç/onar) · <span class="kbd">F</span> meşale · <span class="kbd">Q</span> işaret · <span class="kbd">Tab</span> envanter · <span class="kbd">M</span> harita · <span class="kbd">J</span> defter · <span class="kbd">Sol fare</span> saldırı/kaz/at · <span class="kbd">Sağ fare</span> nişan/savunma · <span class="kbd">R</span> doldur/yem · <span class="kbd">V</span> kaçın · <span class="kbd">G</span> sandığı bırak · <span class="kbd">1-5</span> kılıç, tabanca, kürek, olta, harita · <span class="kbd">C</span> pusula<br><br><b>Gemi:</b> dümende A/D yön, W/S yelken miktarı, Boşluk yelkenleri aç/kapat. Çapa için baş taraftaki ırgata, toplar için yanlara git.`)),
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
