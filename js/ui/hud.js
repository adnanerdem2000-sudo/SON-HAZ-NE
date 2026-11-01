import { G } from '../game/ctx.js';
import { iconSVG } from '../economy/items.js';
import { input, keyLabel } from '../core/input.js';
import { tpCamera } from '../player/camera.js';
import { sky } from '../world/sky.js';
import { quests, STORY } from '../game/quests.js';
import { engine } from '../core/engine.js';
import { settings } from '../core/settings.js';
import { clamp, wrapAngle } from '../core/util.js';
import { treasure } from '../treasure/treasure.js';
import { time } from '../world/time.js';
import { renderMapBase, drawPoiIcon, fogCanvas, drawDetail } from './mapArt.js';
import { ISLANDS, POIS, WORLD_SIZE } from '../world/worldData.js';
import { progress, need, rankOf, MAX_LEVEL } from '../game/progress.js';
import { regionAt, REGIONS } from '../world/archipelago.js';

const $ = (id) => document.getElementById(id);
// Metin yazımı yalnız değişince: her karede aynı metni yazmak kopuk Text düğümü çöpü üretir (uzun benzetimde GB'larca RSS)
const setTxt = (el, v) => { if (!el) return; const sv = String(v); if (el._t !== sv) { el._t = sv; el.textContent = sv; } };

export const hud = {
  init() {
    this.root = $('hud');
    this.notify = $('notify-stack');
    this.prompt = $('prompt');
    this._buildCompass();
    this._buildHotbar();
    G.on('notify', (n) => this.toast(n.text, n.kind, n.ms));
    G.on('prompt', (p) => this._prompt(p));
    G.on('hitMarker', () => { const h = $('hitmarker'); h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 120); });
    G.on('playerHurt', () => { const d = $('damage-flash'); d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 60); });
    G.on('bossBar', (b) => this._boss(b));
    // yüzen hasar sayıları
    this.dmgNums = [];
    G.on('dmgNumber', (e) => {
      if (!settings.v.dmgNumbers && settings.v.dmgNumbers !== undefined) return;
      const d = document.createElement('div');
      d.className = 'dmgnum' + (e.crit ? ' crit' : '');
      d.textContent = e.dmg;
      this.root.appendChild(d);
      this.dmgNums.push({ el: d, x: e.pos.x + (Math.random() - 0.5) * 0.5, y: e.pos.y, z: e.pos.z, t: 0 });
      if (this.dmgNums.length > 24) this.dmgNums.shift().el.remove();
    });
    G.on('fishingHud', (f) => this._fishing(f));
    G.on('underwater', (u) => $('underwater-tint').classList.toggle('on', u));
    G.on('equip', () => this._hotbarActive());
    G.on('toggleCompass', () => { this.compassOn = !this.compassOn; $('compass-bar').classList.toggle('hidden', !this.compassOn); });
    this.compassOn = true;
    // deneyim ve rütbe
    G.on('xpGain', (e) => this._xpPop(e));
    G.on('levelUp', (e) => this._levelUp(e));
    G.on('sessionStart', () => { this._region = null; this._island = null; this._islandSeen = new Map(); });
  },

  _xpPop(e) {
    const box = $('xp-pops');
    if (!box) return;
    const d = document.createElement('div');
    d.className = 'xp-pop';
    d.innerHTML = `+${e.xp} XP${e.reason ? ` <span>${e.reason}</span>` : ''}`;
    box.appendChild(d);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => d.remove(), 2200);
  },

  _levelUp(e) {
    const b = $('levelup');
    b.querySelector('.lu-level').textContent = `Seviye ${e.level}`;
    b.querySelector('.lu-rank').textContent = e.newRank ? `Yeni rütbe: ${e.rank}` : e.rank;
    b.classList.remove('hidden', 'out');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(this._luT);
    this._luT = setTimeout(() => { b.classList.add('out'); setTimeout(() => b.classList.add('hidden'), 600); }, 4200);
  },

  // bölgeye ya da adaya girişte sinematik konum afişi
  _location(p) {
    const reg = regionAt(p.pos.x, p.pos.z);
    let isl = null;
    for (const I of ISLANDS) { const r = I.r * Math.max(I.ex || 1, I.ez || 1); if (Math.abs(p.pos.x - I.x) < r && Math.abs(p.pos.z - I.z) < r && Math.hypot(p.pos.x - I.x, p.pos.z - I.z) < r * 0.95) { isl = I; break; } }
    const now = performance.now();
    if (this._region === undefined || this._region === null) { this._region = reg; this._island = isl?.id || null; return; }
    if (reg !== this._region) {
      this._region = reg;
      const R = REGIONS[reg];
      if (R) this._banner(R.name, R.desc, 'region');
    } else if ((isl?.id || null) !== this._island) {
      this._island = isl?.id || null;
      const seen = this._islandSeen || (this._islandSeen = new Map());
      if (isl && now - (seen.get(isl.id) || -1e9) > 180000) {
        seen.set(isl.id, now);
        const BIO = { tropik: 'Tropik ada', cangil: 'Cangıl adası', buzul: 'Buzul adası', volkan: 'Volkanik ada', col: 'Çöl adası', hayalet: 'Lanetli ada' };
        this._banner(isl.name, `${BIO[isl.biome] || 'Ada'} · ${REGIONS[reg]?.name || ''}`, 'island');
      }
    }
  },
  _banner(title, sub, kind) {
    const b = $('loc-banner');
    b.className = kind;
    b.querySelector('.lb-title').textContent = title;
    b.querySelector('.lb-sub').textContent = sub;
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(this._lbT);
    this._lbT = setTimeout(() => { b.classList.remove('show'); b.classList.add('out'); setTimeout(() => b.classList.add('hidden'), 900); }, 4800);
  },

  show(on) { this.root.classList.toggle('hidden', !on); },

  toast(text, kind = 'info', ms = 3500) {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = text;
    this.notify.appendChild(t);
    while (this.notify.children.length > 6) this.notify.removeChild(this.notify.firstChild);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
  },

  _prompt(p) {
    const el = this.prompt;
    if (!p) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.classList.toggle('disabled', !!p.disabled);
    setTxt(el.querySelector('kbd'), p.key);
    setTxt(el.querySelector('.label'), p.label);
    setTxt(el.querySelector('.sub'), p.sub || '');
    const ring = el.querySelector('.hold-ring');
    if (p.hold !== null && p.hold !== undefined) {
      ring.classList.add('on');
      const pct = Math.round(p.hold * 100);
      if (!ring.firstElementChild) ring.innerHTML = '<i></i>';
      if (this._holdPct !== pct) { this._holdPct = pct; ring.firstElementChild.style.width = pct + '%'; }
    } else ring.classList.remove('on');
  },

  _boss(b) {
    const el = $('boss-bar');
    if (!b) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.querySelector('.boss-name').textContent = b.name;
    el.querySelector('.boss-fill').style.width = Math.max(0, b.hp * 100) + '%';
  },

  _fishing(f) {
    const el = $('fishing-hud');
    if (!f) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (f.mode === 'charge') el.innerHTML = `<div class="fh-title">${f.title || 'Atış gücü'}</div><div class="prog"><i style="width:${f.power * 100}%"></i></div><div class="muted" style="color:#cfe0e2">${f.help || `Yem: ${f.bait || '-'} · Bırak: at · R: yem değiştir`}</div>`;
    else if (f.mode === 'net') el.innerHTML = `<div class="fh-title">${f.title}</div><div style="color:#cfe0e2">${f.help || ''}</div>`;
    else if (f.mode === 'wait') el.innerHTML = `<div class="fh-title">Balık bekleniyor…</div><div style="color:#cfe0e2">Yem: ${f.bait} · Sol tık: oltayı topla</div>`;
    else if (f.mode === 'bite') el.innerHTML = `<div class="fh-title" style="color:#ff8060;font-size:34px">VURDU! Sol tıkla!</div>`;
    else if (f.mode === 'fight') {
      el.innerHTML = `<div class="fh-title">Balıkla mücadele</div>
        <div class="bar"><div class="knob" style="left:${clamp(f.tension, 0, 1) * 100}%"></div></div>
        <div class="dir">${f.dir > 0 ? '◀ A ile karşı koy' : 'D ile karşı koy ▶'}</div>
        <div class="prog"><i style="width:${f.progress * 100}%"></i></div>
        <div style="color:#cfe0e2;font-size:14px">Sol tık basılı: makarayı sar · Gerginlik kırmızıya girerse misina kopar</div>`;
    }
  },

  _buildCompass() {
    const s = $('compass-strip');
    const marks = [];
    for (let d = -360; d <= 720; d += 15) {
      const n = ((d % 360) + 360) % 360;
      const names = { 0: 'K', 45: 'KD', 90: 'D', 135: 'GD', 180: 'G', 225: 'GB', 270: 'B', 315: 'KB' };
      const lbl = names[n];
      marks.push(`<span class="${lbl ? (lbl.length === 1 ? 'card' : '') : 'tick'}" data-d="${d}" style="left:${d * 4}px">${lbl || '|'}</span>`);
    }
    s.innerHTML = marks.join('');
    this.compassMarks = document.createElement('div');
    s.appendChild(this.compassMarks);
  },

  _buildHotbar() {
    const hb = $('hotbar');
    this.slots = [
      { k: 'slot1', eq: 'sword', icon: 'kilic', need: ['kilic', 'usta_kilic'] },
      { k: 'slot2', eq: 'pistol', icon: 'tabanca', need: ['tabanca', 'usta_tabanca'] },
      { k: 'slot3', eq: 'shovel', icon: 'kurek', need: ['kurek'] },
      { k: 'slot4', eq: 'rod', icon: 'olta', need: ['olta', 'usta_olta'] },
      { k: 'slot5', eq: 'map', icon: 'hazine_haritasi', need: ['hazine_haritasi'] },
      { k: 'slot6', eq: 'harpoon', icon: 'zipkin', need: ['zipkin', 'usta_zipkin'] },
      { k: 'slot7', eq: 'net', icon: 'balik_agi', need: ['balik_agi'] },
    ];
    hb.innerHTML = '';
    for (const s of this.slots) {
      const d = document.createElement('div');
      d.className = 'hb';
      d.innerHTML = `<span class="k">${keyLabel(input.bindings[s.k])}</span><div class="ic">${iconSVG(s.icon)}</div>`;
      s.el = d;
      hb.appendChild(d);
    }
  },
  _hotbarActive() {
    const p = G.player;
    if (!p) return;
    for (const s of this.slots) {
      s.el.classList.toggle('active', p.equipped === s.eq);
      s.el.classList.toggle('empty', !s.need.some((i) => p.inv.has(i)));
      setTxt(s.el.querySelector('.k'), keyLabel(input.bindings[s.k]));
    }
  },

  _updateDmgNums(dt) {
    if (!this.dmgNums?.length) return;
    const cam = engine.camera;
    const w = window.innerWidth, h = window.innerHeight;
    for (const n of this.dmgNums) {
      n.t += dt;
      const v = { x: n.x, y: n.y + n.t * 1.1, z: n.z };
      const p = engine._proj || (engine._proj = new cam.position.constructor());
      p.set(v.x, v.y, v.z).project(cam);
      const vis = p.z < 1 && n.t < 1.1;
      n.el.style.display = vis ? '' : 'none';
      if (vis) { n.el.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px) translate(-50%, -50%) scale(${1 + Math.max(0, 0.25 - n.t) * 2})`; n.el.style.opacity = String(clamp(1.4 - n.t * 1.3, 0, 1)); }
      if (n.t >= 1.1) n.dead = true;
    }
    for (const n of this.dmgNums) if (n.dead) n.el.remove();
    this.dmgNums = this.dmgNums.filter((n) => !n.dead);
  },

  update(dt) {
    const p = G.player;
    if (!p || G.state !== 'playing') return;
    this._t = (this._t || 0) + dt;
    this._updateDmgNums(dt);
    // can / dayanıklılık / oksijen
    const set = (sel, v) => { const f = document.querySelector(sel + ' .fill'); if (f) f.style.width = clamp(v, 0, 100) + '%'; };
    set('.vital.hp', p.hp / p.maxHp * 100);
    set('.vital.st', p.stamina);
    const ox = document.querySelector('.vital.ox');
    const showOx = p.mode === 'swim' && (p.underwater || p.oxygen < 99);
    ox.classList.toggle('hidden', !showOx);
    if (showOx) { set('.vital.ox', p.oxygen); setTxt(ox.querySelector('.depth'), p.depth.toFixed(1) + ' m'); }
    setTxt($('hud-gold'), Math.floor(p.inv.gold).toLocaleString('tr-TR'));
    if (this._t % 0.5 < dt) {
      this._hotbarActive();
      // çanta yükü: dolunca kırmızı (önce HUD'da yük göstergesi yoktu; çanta dolunca alınan eşyanın neden girmediği anlaşılmıyordu)
      const bag = $('hud-bag');
      if (bag) { const w = p.inv.weight(), cap = p.inv.capacity; setTxt(bag, `Çanta ${Math.round(w)}/${cap} kg`); bag.classList.toggle('full', cap - w < 1); }
      const L = progress.level;
      setTxt($('hud-lvl'), L);
      setTxt($('hud-rank'), rankOf(L));
      $('hud-xp').style.width = (L >= MAX_LEVEL ? 100 : clamp(progress.xp / need(L) * 100, 0, 100)) + '%';
      $('hud-pts').classList.toggle('hidden', !progress.points);
      this._location(p);
    }
    // pusula
    if (this.compassOn) {
      const deg = ((-tpCamera.yaw * 180 / Math.PI) + 180 + 720) % 360; // kamera bakış yönü (0 = kuzey)
      const w = $('compass-bar').clientWidth;
      $('compass-strip').style.left = (w / 2 - deg * 4) + 'px';
      // işaretler: hikâye hedefi, ekip arkadaşları, haritadaki işaretler
      const marks = [];
      const addMark = (x, z, sym, color) => {
        const a = Math.atan2(x - p.pos.x, -(z - p.pos.z)) * 180 / Math.PI;
        let d = (a + 360) % 360;
        for (const off of [-360, 0, 360]) marks.push({ px: Math.round((d + off) * 4), color, sym });
      };
      for (const [, r] of G.remotes) addMark(r.pos.x, r.pos.z, '●', r.color || '#6ad0f0');
      for (const m of quests.markers || []) addMark(m.x, m.z, '✚', '#ff6050');
      const tgt = this.storyTarget();
      if (tgt) addMark(tgt.x, tgt.z, '★', '#f3d27a');
      // işaret öğeleri yeniden kullanılır: tür/renk dizisi değişmedikçe yalnız konum (style.left) güncellenir; her karede
      // innerHTML yazmak karede ~7 kopuk düğüm çöpü üretiyordu (uzun benzetimde GB'larca RSS)
      const sig = marks.map((m) => m.sym + m.color).join('|');
      if (sig !== this._marksSig) {
        this._marksSig = sig;
        this.compassMarks.innerHTML = marks.map((m) => `<span class="mark" style="color:${m.color}">${m.sym}</span>`).join('');
        this._markEls = [...this.compassMarks.children];
      }
      for (let i = 0; i < marks.length; i++) { const el = this._markEls[i], px = marks[i].px + 'px'; if (el && el._left !== px) { el._left = px; el.style.left = px; } }
    }
    // görev takibi
    if (this._t % 0.5 < dt) {
      const st = STORY[Math.min(quests.stage, STORY.length - 1)];
      const side = (quests.side || []).map((q) => `<div class="qt-side">• ${q.title}: ${q.progress || 0}/${q.need}</div>`).join('');
      const qt = `<div class="qt-title">${st.title}</div><div class="qt-goal">${st.goal}</div>${side}`;
      if (qt !== this._qtHtml) { this._qtHtml = qt; $('quest-tracker').innerHTML = qt; }
      const fps = settings.v.showFps ? `${engine.fps} FPS` : '';
      const net = G.online ? (G.isHost ? 'Oda sahibi' : 'Konuk') + (G.ping ? ` · ${G.ping} ms` : '') : '';
      $('hud-info').textContent = [net, fps].filter(Boolean).join(' · ');
      this._timePanel();
      this._team();
    }
    // mini harita (30 Hz)
    this._mmT = (this._mmT || 0) + dt;
    if (this._mmT > 1 / 30) { this._mmT = 0; this._minimap(); }
    // gemi paneli
    const sp = $('ship-panel');
    const onShip = (p.mode === 'deck' || p.mode === 'helm' || p.mode === 'cannon') && p.ship;
    sp.classList.toggle('hidden', !onShip);
    if (onShip && this._t % 0.25 < dt) {
      const s = p.ship;
      const hpP = Math.round(s.hp / s.maxHp * 100);
      const w = s.holdWeight(Object.fromEntries([]));
      const reload = s.cannonState.filter((c) => c.reload <= 0).length;
      const knots = (Math.abs(s.speed) * 1.94).toFixed(1);
      const windRel = Math.round(s.windEfficiency() * 100);
      const spHtml = `<div class="sp-title">${s.name} <small style="font-family:var(--body);font-size:14px;color:#cfe0e2">${s.T.name}</small></div>
        <div class="sp-row">Gövde <span class="mini"><i style="width:${hpP}%;background:#d84a3a"></i></span> %${hpP}</div>
        <div class="sp-row">Su <span class="mini"><i style="width:${s.water}%;background:#4ab0e0"></i></span> %${Math.round(s.water)}</div>
        <div class="sp-row">Yelken <span class="mini"><i style="width:${s.sail * 100}%;background:#f3d27a"></i></span> %${Math.round(s.sailTarget * 100)}</div>
        <div class="sp-row"><span>Hız ${knots} knot · Rüzgâr verimi %${windRel}</span></div>
        <div class="sp-row"><span>Çapa: ${{ down: 'Demirli', up: 'Yukarıda', lowering: 'İniyor…', raising: 'Kalkıyor…' }[s.anchorState]}</span><span>Delik: ${s.holes.length}</span></div>
        <div class="sp-row"><span>Toplar hazır: ${reload}/${s.cannonState.length} · Gülle: ${s.cannonballs}</span></div>
        <div class="sp-row"><span>Ambar: ${s.hold.chests.length}/${s.T.holdSlots} sandık · Tahta: ${s.planks}</span></div>
        <div class="sp-dmg">${['pruva', 'kic', 'iskele', 'sancak', 'dumen', 'yelken'].map((k) => `<span class="${s.parts[k] < 30 ? 'bad' : s.parts[k] < 65 ? 'mid' : ''}">${{ pruva: 'Pruva', kic: 'Kıç', iskele: 'İskele', sancak: 'Sancak', dumen: 'Dümen', yelken: 'Bez' }[k]} %${Math.round(s.parts[k])}</span>`).join('')}${s.mastHp.map((h, i) => `<span class="${h <= 0 ? 'bad' : h < 40 ? 'mid' : ''}">Direk${s.mastHp.length > 1 ? ' ' + (i + 1) : ''} ${h <= 0 ? 'KIRIK' : '%' + Math.round(h)}</span>`).join('')}${s.cannonHp.some((h) => h <= 0) ? `<span class="bad">Bozuk top: ${s.cannonHp.filter((h) => h <= 0).length}</span>` : ''}${s.fires.length ? `<span class="bad">🔥 Yangın: ${s.fires.length}</span>` : ''}</div>`;
      if (spHtml !== this._spHtml) { this._spHtml = spHtml; sp.innerHTML = spHtml; }
    }
    // nişangâh
    $('crosshair').classList.toggle('hidden', !(p.aiming || p.mode === 'cannon' || (p.equipped === 'harpoon' && (p.mode === 'ground' || p.mode === 'deck' || p.mode === 'swim'))));
    // meşgul çubuğu
    const bb = $('busy-bar');
    if (p.busy) { bb.classList.remove('hidden'); bb.querySelector('.busy-label').textContent = p.busy.label; bb.querySelector('.fill').style.width = (p.busy.t / p.busy.dur * 100) + '%'; }
    else bb.classList.add('hidden');
  },

  // Zaman çizelgesi: gün/saat, hava, gelgit ve önümüzdeki 12 saatin olay şeridi
  _timePanel() {
    const P = $('time-panel');
    if (!P) return;
    const now = time.totalHours();
    const SPAN = 12, PAST = 1;
    const x = (at) => ((at - (now - PAST)) / SPAN) * 100;
    setTxt(P.querySelector('.tp-day'), `Gün ${time.day}`);
    setTxt(P.querySelector('.tp-clock'), time.hourString(sky.hour));
    setTxt(P.querySelector('.tp-weather'), `${sky.weatherIcon(sky.weatherKey)} ${sky.weatherName(sky.weatherKey)}`);
    const tide = time.tide();
    P.querySelector('.tp-tide').textContent = `🌊${time.tideRising() ? '↑' : '↓'}${tide >= 0 ? '+' : ''}${tide.toFixed(1)} m`;
    // gökyüzü renk geçişi (gece-şafak-gündüz-gün batımı)
    const stops = [];
    for (let i = 0; i <= 24; i++) {
      const h = (((now - PAST + (i / 24) * SPAN) % 24) + 24) % 24;
      const day = clamp((h - 5) / 2.5, 0, 1) * clamp((20.5 - h) / 2.5, 0, 1);
      const dusk = Math.max(0, 1 - Math.abs(h - 19) / 1.6) + Math.max(0, 1 - Math.abs(h - 6) / 1.4);
      const r = Math.round(18 + day * 84 + dusk * 150), g = Math.round(26 + day * 128 + dusk * 40), b = Math.round(54 + day * 150 - dusk * 30);
      stops.push(`rgb(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)}) ${(i / 24 * 100).toFixed(1)}%`);
    }
    P.querySelector('.tp-bg').style.background = `linear-gradient(90deg, ${stops.join(',')})`;
    // saat çentikleri
    const ticks = [];
    for (let h = Math.ceil(now - PAST); h <= now - PAST + SPAN; h++) {
      const hh = ((h % 24) + 24) % 24;
      ticks.push(`<span style="left:${x(h).toFixed(2)}%"></span>`);
      if (hh % 3 === 0) ticks.push(`<b style="left:${x(h).toFixed(2)}%">${hh}</b>`);
    }
    const setIf = (sel, html, key) => { if (this[key] !== html) { this[key] = html; P.querySelector(sel).innerHTML = html; } }; // değişince yaz
    // çizgi/bant/simge dizileri zamanla sürekli kayar (yüzde değerleri); 2 sn'de bir yeterli (şimdi işareti her çağrıda güncellenir)
    const slow = (this._tpSlowT === undefined || Math.abs(now - this._tpSlowT) >= 2 / 60) ; if (slow) this._tpSlowT = now;
    if (slow) setIf('.tp-ticks', ticks.join(''), '_tpTicks');
    // olaylar
    const list = time.upcoming(SPAN - PAST);
    const bands = [], icons = [];
    for (const e of list) {
      if (e.endAt) {
        const a = Math.max(0, x(e.at)), b = Math.min(100, x(e.endAt));
        if (b > a) bands.push(`<i class="${e.effect === 'fishFrenzy' || e.effect === 'ghostHours' ? 'fx' : ''}" style="left:${a.toFixed(2)}%;width:${(b - a).toFixed(2)}%"></i>`);
      }
      const px = x(e.at);
      if (px >= 2 && px <= 98) icons.push(`<span style="left:${px.toFixed(2)}%" title="${e.title}">${e.icon}</span>`);
    }
    if (slow) { setIf('.tp-bands', bands.join(''), '_tpBands'); setIf('.tp-icons', icons.join(''), '_tpIcons'); }
    P.querySelector('.tp-now').style.left = `calc(${x(now).toFixed(2)}% - 1px)`;
    // şu an etkin olan ya da sıradaki olay
    const active = list.filter((e) => e.endAt && e.at <= now && e.endAt > now && !e.weather && !e.tide);
    const next = list.find((e) => e.at > now + 0.01);
    const dur = (hrs) => { const m = Math.round(hrs * 60); return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`; };
    let txt = '';
    if (active.length) txt = `Şu an: ${active.map((e) => `${e.icon} <b>${e.title}</b>`).join(', ')}`;
    else if (next) txt = `Sıradaki: ${next.icon} <b>${next.title}</b> · ${dur(next.at - now)} sonra`;
    setIf('.tp-next', txt, '_tpNext');
  },

  // Mini harita: oyuncu merkezde, kamera yönü yukarıda
  _minimap() {
    const cv = $('mm-canvas');
    const p = G.player;
    if (!cv || !p) return;
    const g = cv.getContext('2d');
    const WS = WORLD_SIZE, R = 100;
    // gemideyken daha geniş görüş
    const view = p.mode === 'helm' || p.mode === 'deck' || p.mode === 'cannon' ? 420 : 170, k = R / view;
    const base = renderMapBase();
    this._fogT = (this._fogT || 0) - 1;
    if (!this._fogC || (this._fogT <= 0 && quests.fogDirty)) { this._fogC = fogCanvas(quests.fog, [205, 186, 140], 225); this._fogT = 60; quests.fogDirty = false; }
    const yaw = tpCamera.yaw;
    const rot = -Math.PI / 2 - Math.atan2(Math.cos(yaw), Math.sin(yaw));
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const toS = (x, z) => { const dx = (x - p.pos.x) * k, dz = (z - p.pos.z) * k; return [R + dx * cr - dz * sr, R + dx * sr + dz * cr]; };
    g.save();
    g.clearRect(0, 0, 2 * R, 2 * R);
    g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#7fa8b8'; g.fillRect(0, 0, 2 * R, 2 * R);
    g.translate(R, R); g.rotate(rot); g.scale(k, k); g.translate(-p.pos.x, -p.pos.z);
    g.imageSmoothingEnabled = true;
    g.drawImage(base, -WS / 2, -WS / 2, WS, WS);
    // yakın çevre: ayrıntılı harita karoları (yoksa arka planda üretilir)
    drawDetail(g, (x, z) => [x, z], 1, p.pos.x - view * 1.5, p.pos.z - view * 1.5, p.pos.x + view * 1.5, p.pos.z + view * 1.5);
    g.drawImage(this._fogC, -WS / 2, -WS / 2, WS, WS);
    g.restore();
    const inView = (sx, sy, m = 0) => Math.hypot(sx - R, sy - R) < R - m;
    // önemli noktalar
    for (const P of POIS) {
      if (!quests.discovered[P.id] && P.id !== 'liman') continue;
      const [sx, sy] = toS(P.x, P.z);
      if (inView(sx, sy, 6)) drawPoiIcon(g, P.icon, sx, sy, 7.5);
    }
    // işaretler ve hikâye hedefi (görüş dışındaysa kenarda)
    const edgeMark = (x, z, sym, color, size = 16) => {
      let [sx, sy] = toS(x, z);
      const d = Math.hypot(sx - R, sy - R);
      if (d > R - 10) { sx = R + (sx - R) / d * (R - 10); sy = R + (sy - R) / d * (R - 10); }
      g.font = `${size}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3; g.strokeStyle = 'rgba(20,12,5,.8)'; g.strokeText(sym, sx, sy);
      g.fillStyle = color; g.fillText(sym, sx, sy);
    };
    for (const m of quests.markers || []) edgeMark(m.x, m.z, '✚', m.color || '#ff6050', 14);
    const tgt = this.storyTarget();
    if (tgt) edgeMark(tgt.x, tgt.z, '★', '#f3d27a', 18);
    // gemiler
    for (const s of G.ships) {
      if (s.sunk) continue;
      const [sx, sy] = toS(s.x, s.z);
      if (!inView(sx, sy, 4)) { if (s === G.ship) edgeMark(s.x, s.z, '⛵', '#f2e6c8', 14); continue; }
      g.save(); g.translate(sx, sy); g.rotate(rot + Math.atan2(Math.cos(s.yaw), Math.sin(s.yaw)) + Math.PI / 2);
      g.fillStyle = s === G.ship ? '#f3d27a' : s.kinematic ? '#e8c060' : '#c0392b'; g.strokeStyle = '#2a180b'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -9); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    for (const [, r] of G.remotes) {
      const [sx, sy] = toS(r.pos.x, r.pos.z);
      if (!inView(sx, sy, 4)) continue;
      g.fillStyle = r.color || '#6ad0f0'; g.strokeStyle = '#000'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(sx, sy, 4.5, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    // oyuncu oku (merkez)
    g.save(); g.translate(R, R); g.rotate(rot + Math.atan2(Math.cos(p.yaw), Math.sin(p.yaw)) + Math.PI / 2);
    g.fillStyle = '#ff5040'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // kuzey işareti çerçevede
    const [nx, ny] = toS(p.pos.x, p.pos.z - 1000);
    const nd = Math.hypot(nx - R, ny - R) || 1;
    const nEl = document.querySelector('#minimap .mm-n');
    if (nEl) { nEl.style.left = `${(R + (nx - R) / nd * (R - 2)) / (2 * R) * 100}%`; nEl.style.top = `${(R + (ny - R) / nd * (R - 2)) / (2 * R) * 100}%`; }
    void ISLANDS;
  },

  storyTarget() {
    const st = quests.stage;
    if (st === 0) return { x: -32, z: 206 };
    if (st === 1) return quests.flags.ilkHarita ? (quests.flags.ilkHazineBulundu ? { x: -16, z: 224 } : { x: 478, z: 352 }) : { x: -12, z: 206 };
    if (st === 2) return { x: 212, z: -30 };
    if (st === 3) return { x: -520, z: -440 };
    if (st === 4) return { x: -40, z: -228 };
    return null;
  },

  _team() {
    const tl = $('team-list');
    if (!G.online || !G.remotes.size) { if (this._teamHtml !== '') { this._teamHtml = ''; tl.innerHTML = ''; } return; }
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const col = (c) => (/^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : '#fff');
    const th = [...G.remotes.values()].map((r) => `<div class="tm"><span style="color:${col(r.color)}">●</span> ${esc(r.name)} <i><b style="width:${clamp(r.hp ?? 100, 0, 100)}%"></b></i>${r.downed ? ' <span style="color:#ff8060">YARALI!</span>' : ''}</div>`).join('');
    if (th !== this._teamHtml) { this._teamHtml = th; tl.innerHTML = th; }
  },
};
