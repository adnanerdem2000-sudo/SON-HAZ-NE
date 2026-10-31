// Ses sistemi: CC0 efekt dosyaları + prosedürel ortam sesleri ve müzik (WebAudio)
import { clamp } from './util.js';

const SFX = ['big_kill', 'boss', 'coin', 'confirm', 'dash', 'downed', 'gem', 'hit', 'hurt', 'impact', 'kill', 'land', 'level_up', 'revive', 'shoot', 'step', 'ui'];

export const audio = {
  ctx: null,
  buffers: {},
  vol: { master: 0.8, music: 0.5, ambient: 0.7, sfx: 0.8, voice: 0.7 },
  ready: false,
  listener: { x: 0, y: 0, z: 0, yaw: 0 },
  base: '',

  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.ambBus = c.createGain(); this.ambBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.connect(this.master);
    this.applyVolumes();
    await Promise.all(SFX.map(async (n) => {
      try {
        const r = await fetch(`${this.base}assets/audio/sfx/${n}.ogg`);
        const ab = await r.arrayBuffer();
        this.buffers[n] = await c.decodeAudioData(ab);
      } catch (e) { /* bazı tarayıcılar ogg desteklemeyebilir */ }
    }));
    this._makeNoise();
    this._ambience();
    this.ready = true;
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  applyVolumes() {
    if (!this.ctx) return;
    const v = this.vol;
    this.master.gain.value = v.master;
    this.musicBus.gain.value = v.music;
    this.ambBus.gain.value = v.ambient;
    this.sfxBus.gain.value = v.sfx;
    this.voiceBus.gain.value = v.voice;
  },

  setListener(x, y, z, yaw) { this.listener.x = x; this.listener.y = y; this.listener.z = z; this.listener.yaw = yaw; },

  play(name, opts = {}) {
    if (!this.ctx || !this.buffers[name]) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.buffers[name];
    src.playbackRate.value = opts.rate || 1;
    const g = c.createGain();
    let vol = opts.vol ?? 0.7;
    let pan = 0;
    if (opts.pos) {
      const L = this.listener;
      const dx = opts.pos.x - L.x, dz = opts.pos.z - L.z, dy = (opts.pos.y || 0) - L.y;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      vol *= clamp(1 - d / (opts.range || 45), 0, 1) ** 1.5;
      if (vol < 0.005) return;
      const a = Math.atan2(dx, dz) - L.yaw;
      pan = clamp(-Math.sin(a), -1, 1) * 0.7;
    }
    g.gain.value = vol;
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan; src.connect(g).connect(p).connect(opts.bus || this.sfxBus); }
    else src.connect(g).connect(opts.bus || this.sfxBus);
    src.start();
  },

  // Prosedürel kısa sesler
  tone(freq, dur = 0.15, type = 'sine', vol = 0.2, bus = null, slide = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  },

  boom(vol = 0.8, pos = null) {
    if (!this.ctx) return;
    let v = vol;
    if (pos) {
      const L = this.listener;
      const d = Math.hypot(pos.x - L.x, pos.z - L.z);
      v *= clamp(1 - d / 400, 0.05, 1);
    }
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(80, t + 1.2);
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t); src.stop(t + 1.5);
    this.tone(55, 0.6, 'sine', v * 0.8, null, 0.5);
  },

  splash(vol = 0.5) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t, Math.random()); src.stop(t + 0.8);
  },

  thunder() {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    src.connect(f).connect(g).connect(this.ambBus);
    src.start(t); src.stop(t + 3.6);
  },

  // NPC konuşma mırıltısı ("ses" ayarına bağlı)
  babble(seed = 1, syllables = 6, pitch = 1) {
    if (!this.ctx) return;
    const c = this.ctx;
    let t = c.currentTime;
    for (let i = 0; i < syllables; i++) {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth';
      const base = (140 + ((seed * 37 + i * 53) % 90)) * pitch;
      o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * (0.85 + ((i * 7) % 5) * 0.08), t + 0.09);
      f.type = 'bandpass'; f.frequency.value = 900 + ((i * 131 + seed) % 700); f.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(f).connect(g).connect(this.voiceBus);
      o.start(t); o.stop(t + 0.12);
      t += 0.09 + ((i * 13 + seed) % 4) * 0.02;
    }
  },

  _makeNoise() {
    const c = this.ctx;
    const len = c.sampleRate * 3;
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.5 + last * 3; }
    this.noise = b;
  },

  // Sürekli ortam katmanları: dalga, rüzgâr, yağmur, orman, mağara
  _ambience() {
    const c = this.ctx;
    const layer = (type, freq, q) => {
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(f).connect(g).connect(this.ambBus);
      src.start(0, Math.random() * 2);
      return { src, f, g };
    };
    this.amb = {
      waves: layer('lowpass', 500, 0.5),
      wind: layer('bandpass', 700, 0.8),
      rain: layer('highpass', 2500, 0.3),
      jungle: layer('bandpass', 3800, 6),
      under: layer('lowpass', 250, 0.7),
    };
    this._birdT = 2;
  },

  updateAmbience(dt, env) {
    if (!this.ctx || !this.amb) return;
    const t = this.ctx.currentTime;
    const a = this.amb;
    const set = (l, v) => l.g.gain.setTargetAtTime(v, t, 0.5);
    const waveMod = 0.6 + 0.4 * Math.sin(t * 0.6) * Math.sin(t * 0.23);
    set(a.waves, env.underwater ? 0 : clamp(env.seaNear * (0.25 + env.waves * 0.2) * waveMod, 0, 0.8));
    set(a.wind, env.underwater ? 0 : clamp(0.05 + env.wind * 0.12 + env.storm * 0.2, 0, 0.5) * (1 - env.cave * 0.8));
    a.wind.f.frequency.setTargetAtTime(500 + env.wind * 500 + Math.sin(t * 0.4) * 150, t, 0.5);
    set(a.rain, env.underwater ? 0 : env.rain * 0.25 * (1 - env.cave));
    set(a.jungle, env.underwater ? 0 : env.jungle * (env.night ? 0.06 : 0.025) * (1 - env.rain));
    a.jungle.f.frequency.setTargetAtTime(env.night ? 4200 : 3600, t, 1);
    set(a.under, env.underwater ? 0.5 : 0);
    // kuş ve martı sesleri
    this._birdT -= dt;
    if (this._birdT <= 0) {
      this._birdT = 2 + Math.random() * 6;
      if (!env.underwater && !env.night && env.rain < 0.3) {
        if (env.seaNear > 0.3 && Math.random() < 0.6) this._gull(); else if (env.jungle > 0.2) this._bird();
      }
      if (env.cave > 0.5) this._drip();
    }
  },
  _gull() {
    const c = this.ctx; let t = c.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(this.ambBus); o.start(t); o.stop(t + 0.3);
      t += 0.32;
    }
  },
  _bird() {
    const c = this.ctx; let t = c.currentTime;
    const f0 = 2200 + Math.random() * 1500;
    for (let i = 0; i < 4; i++) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.08);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.025, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g).connect(this.ambBus); o.start(t); o.stop(t + 0.12);
      t += 0.13;
    }
  },
  _drip() { this.tone(1800 + Math.random() * 600, 0.12, 'sine', 0.05, this.ambBus, 0.4); },

  // ---- Müzik: prosedürel deniz türküsü (shanty) + savaş teması ----
  music: { mode: 'none', timer: 0, step: 0 },
  setMusic(mode) {
    if (!this.ctx) return;
    if (this.music.mode === mode) return;
    this.music.mode = mode;
    if (this.battleSrc) { const g = this.battleGain; g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8); const s = this.battleSrc; setTimeout(() => { try { s.stop(); } catch (e) {} }, 3000); this.battleSrc = null; }
    if (mode === 'battle') this._battle();
  },
  async _battle() {
    const c = this.ctx;
    if (!this.battleBuf) {
      try {
        const r = await fetch(`${this.base}assets/audio/music/battle_theme_a.mp3`);
        this.battleBuf = await c.decodeAudioData(await r.arrayBuffer());
      } catch (e) { return; }
    }
    if (this.music.mode !== 'battle') return;
    const src = c.createBufferSource(); src.buffer = this.battleBuf; src.loop = true;
    const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.55, c.currentTime, 1.2);
    src.connect(g).connect(this.musicBus); src.start();
    this.battleSrc = src; this.battleGain = g;
  },
  // Bölgeye göre ölçek: tropik (dorian), hayalet (minör), menü (major)
  SCALES: { menu: [0, 2, 4, 5, 7, 9, 11], sea: [0, 2, 3, 5, 7, 9, 10], island: [0, 2, 4, 7, 9], ghost: [0, 1, 3, 5, 6, 8, 10], cave: [0, 3, 5, 6, 10] },
  updateMusic(dt) {
    if (!this.ctx) return;
    const m = this.music;
    if (m.mode === 'none' || m.mode === 'battle') return;
    m.timer -= dt;
    if (m.timer > 0) return;
    const scale = this.SCALES[m.mode] || this.SCALES.sea;
    const tempo = m.mode === 'ghost' || m.mode === 'cave' ? 0.62 : 0.36;
    m.timer = tempo;
    const root = m.mode === 'ghost' ? 49 : m.mode === 'cave' ? 45 : 50;
    const bar = Math.floor(m.step / 6) % 8;
    const beat = m.step % 6;
    const prog = [0, 0, 3, 4, 0, 5, 3, 4][bar];
    // 6/8 türkü ritmi
    if (beat === 0 || beat === 3) this._note(root - 12 + scale[prog % scale.length], tempo * 2.6, 'triangle', 0.07);
    if (m.mode !== 'cave' && (beat === 0 || beat === 2 || beat === 3 || beat === 5) && Math.random() < 0.85) {
      const deg = (prog + [0, 2, 4, 1, 3, 5][Math.floor(Math.random() * 6)]) % scale.length;
      const oct = Math.random() < 0.3 ? 12 : 0;
      this._note(root + 12 + scale[deg] + oct, tempo * (beat === 0 ? 1.8 : 0.9), m.mode === 'ghost' ? 'sine' : 'square', m.mode === 'ghost' ? 0.035 : 0.018, true);
    }
    if (m.mode === 'cave' && Math.random() < 0.3) this._note(root + 24 + scale[Math.floor(Math.random() * scale.length)], 1.2, 'sine', 0.02);
    m.step++;
  },
  _note(midi, dur, type, vol, accordion = false) {
    const c = this.ctx, t = c.currentTime;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    let out = o;
    if (accordion) {
      const o2 = c.createOscillator(); o2.type = type; o2.frequency.value = f * 1.004;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      o2.connect(lp); o.connect(lp); out = lp;
      o2.start(t); o2.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(g).connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.05);
  },
};
