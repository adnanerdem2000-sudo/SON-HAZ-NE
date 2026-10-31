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

const $ = (id) => document.getElementById(id);

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
    G.on('fishingHud', (f) => this._fishing(f));
    G.on('underwater', (u) => $('underwater-tint').classList.toggle('on', u));
    G.on('equip', () => this._hotbarActive());
    G.on('toggleCompass', () => { this.compassOn = !this.compassOn; $('compass-bar').classList.toggle('hidden', !this.compassOn); });
    this.compassOn = true;
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
    el.querySelector('kbd').textContent = p.key;
    el.querySelector('.label').textContent = p.label;
    el.querySelector('.sub').textContent = p.sub || '';
    const ring = el.querySelector('.hold-ring');
    if (p.hold !== null && p.hold !== undefined) { ring.classList.add('on'); ring.innerHTML = `<i style="width:${Math.round(p.hold * 100)}%"></i>`; }
    else ring.classList.remove('on');
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
    if (f.mode === 'charge') el.innerHTML = `<div class="fh-title">Atış gücü</div><div class="prog"><i style="width:${f.power * 100}%"></i></div><div class="muted" style="color:#cfe0e2">Yem: ${f.bait || '-'} · Bırak: at · R: yem değiştir</div>`;
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
      s.el.querySelector('.k').textContent = keyLabel(input.bindings[s.k]);
    }
  },

  update(dt) {
    const p = G.player;
    if (!p || G.state !== 'playing') return;
    this._t = (this._t || 0) + dt;
    // can / dayanıklılık / oksijen
    const set = (sel, v) => { const f = document.querySelector(sel + ' .fill'); if (f) f.style.width = clamp(v, 0, 100) + '%'; };
    set('.vital.hp', p.hp / p.maxHp * 100);
    set('.vital.st', p.stamina);
    const ox = document.querySelector('.vital.ox');
    const showOx = p.mode === 'swim' && (p.underwater || p.oxygen < 99);
    ox.classList.toggle('hidden', !showOx);
    if (showOx) { set('.vital.ox', p.oxygen); ox.querySelector('.depth').textContent = p.depth.toFixed(1) + ' m'; }
    $('hud-gold').textContent = Math.floor(p.inv.gold).toLocaleString('tr-TR');
    if (this._t % 0.5 < dt) this._hotbarActive();
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
        for (const off of [-360, 0, 360]) marks.push(`<span class="mark" style="left:${(d + off) * 4}px;color:${color}">${sym}</span>`);
      };
      for (const [, r] of G.remotes) addMark(r.pos.x, r.pos.z, '●', r.color || '#6ad0f0');
      for (const m of quests.markers || []) addMark(m.x, m.z, '✚', '#ff6050');
      const tgt = this.storyTarget();
      if (tgt) addMark(tgt.x, tgt.z, '★', '#f3d27a');
      this.compassMarks.innerHTML = marks.join('');
    }
    // görev takibi
    if (this._t % 0.5 < dt) {
      const st = STORY[Math.min(quests.stage, STORY.length - 1)];
      const side = (quests.side || []).map((q) => `<div class="qt-side">• ${q.title}: ${q.progress || 0}/${q.need}</div>`).join('');
      $('quest-tracker').innerHTML = `<div class="qt-title">${st.title}</div><div class="qt-goal">${st.goal}</div>${side}`;
      const fps = settings.v.showFps ? ` · ${engine.fps} FPS` : '';
      const wName = sky.weather && sky.target ? sky.target.name : '';
      $('hud-info').innerHTML = `${sky.timeString()} · ${wName}${G.online ? ' · ' + (G.isHost ? 'Oda sahibi' : 'Konuk') + (G.ping ? ` · ${G.ping} ms` : '') : ''}${fps}`;
      this._team();
    }
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
      sp.innerHTML = `<div class="sp-title">${s.name} <small style="font-family:var(--body);font-size:14px;color:#cfe0e2">${s.T.name}</small></div>
        <div class="sp-row">Gövde <span class="mini"><i style="width:${hpP}%;background:#d84a3a"></i></span> %${hpP}</div>
        <div class="sp-row">Su <span class="mini"><i style="width:${s.water}%;background:#4ab0e0"></i></span> %${Math.round(s.water)}</div>
        <div class="sp-row">Yelken <span class="mini"><i style="width:${s.sail * 100}%;background:#f3d27a"></i></span> %${Math.round(s.sailTarget * 100)}</div>
        <div class="sp-row"><span>Hız ${knots} knot · Rüzgâr verimi %${windRel}</span></div>
        <div class="sp-row"><span>Çapa: ${{ down: 'Demirli', up: 'Yukarıda', lowering: 'İniyor…', raising: 'Kalkıyor…' }[s.anchorState]}</span><span>Delik: ${s.holes.length}</span></div>
        <div class="sp-row"><span>Toplar hazır: ${reload}/${s.cannonState.length} · Gülle: ${s.cannonballs}</span></div>
        <div class="sp-row"><span>Ambar: ${s.hold.chests.length}/${s.T.holdSlots} sandık · Tahta: ${s.planks}</span></div>`;
    }
    // nişangâh
    $('crosshair').classList.toggle('hidden', !(p.aiming || p.mode === 'cannon'));
    // meşgul çubuğu
    const bb = $('busy-bar');
    if (p.busy) { bb.classList.remove('hidden'); bb.querySelector('.busy-label').textContent = p.busy.label; bb.querySelector('.fill').style.width = (p.busy.t / p.busy.dur * 100) + '%'; }
    else bb.classList.add('hidden');
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
    if (!G.online || !G.remotes.size) { tl.innerHTML = ''; return; }
    tl.innerHTML = [...G.remotes.values()].map((r) => `<div class="tm"><span style="color:${r.color}">●</span> ${r.name} <i><b style="width:${clamp(r.hp || 100, 0, 100)}%"></b></i>${r.downed ? ' <span style="color:#ff8060">YARALI!</span>' : ''}</div>`).join('');
  },
};
