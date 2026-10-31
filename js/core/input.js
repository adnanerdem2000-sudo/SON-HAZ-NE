// Klavye, fare ve oyun kumandası girişi — tuşlar ayarlardan değiştirilebilir.

export const DEFAULT_BINDINGS = {
  ileri: 'KeyW', geri: 'KeyS', sol: 'KeyA', sag: 'KeyD',
  kos: 'ShiftLeft', zipla: 'Space', egil: 'ControlLeft',
  etkilesim: 'KeyE', fener: 'KeyF', isaret: 'KeyQ', envanter: 'Tab', harita: 'KeyM',
  saldiri: 'Mouse0', nisan: 'Mouse2', doldur: 'KeyR', kacin: 'KeyV',
  defter: 'KeyJ', birak: 'KeyG', pusula: 'KeyC', sohbet: 'Enter',
  slot1: 'Digit1', slot2: 'Digit2', slot3: 'Digit3', slot4: 'Digit4', slot5: 'Digit5', slot0: 'Digit0',
  duraklat: 'Escape',
};

export const ACTION_LABELS = {
  ileri: 'İleri', geri: 'Geri', sol: 'Sol', sag: 'Sağ', kos: 'Koşma / Sprint', zipla: 'Zıplama / Yukarı yüz',
  egil: 'Eğilme / Dalış', etkilesim: 'Etkileşim', fener: 'Fener', isaret: 'İşaretleme', envanter: 'Envanter',
  harita: 'Dünya haritası', saldiri: 'Saldırı', nisan: 'Nişan / Savunma', doldur: 'Silah doldurma',
  kacin: 'Kaçınma (yuvarlanma)', defter: 'Korsan defteri', birak: 'Taşıdığını bırak', pusula: 'Pusulayı çıkar',
  sohbet: 'Sohbet', slot1: 'Kılıç', slot2: 'Tabanca', slot3: 'Kürek', slot4: 'Olta', slot5: 'Hazine haritası', slot0: 'Boş el',
  duraklat: 'Duraklat / Menü',
};

export function keyLabel(code) {
  if (!code) return '—';
  const map = {
    Mouse0: 'Sol Fare', Mouse1: 'Orta Fare', Mouse2: 'Sağ Fare', Space: 'Boşluk', ShiftLeft: 'Sol Shift', ShiftRight: 'Sağ Shift',
    ControlLeft: 'Sol Ctrl', ControlRight: 'Sağ Ctrl', AltLeft: 'Sol Alt', Tab: 'Tab', Enter: 'Enter', Escape: 'Esc',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backquote: '"', CapsLock: 'Caps Lock',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return code;
}

export const input = {
  bindings: { ...DEFAULT_BINDINGS },
  down: new Set(),
  pressedSet: new Set(),
  mouseDX: 0, mouseDY: 0, wheel: 0,
  sensitivity: 1, invertY: false, padSensitivity: 1,
  enabled: true,
  pointerLocked: false,
  pad: null,
  padAxes: { lx: 0, ly: 0, rx: 0, ry: 0 },
  padPrev: [],
  listeners: [],
  captureNext: null,

  init(canvas) {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (this.captureNext) { e.preventDefault(); const f = this.captureNext; this.captureNext = null; f(e.code); return; }
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code) || (e.ctrlKey && ['KeyS', 'KeyD', 'KeyF'].includes(e.code))) e.preventDefault();
      if (!this.down.has(e.code)) this.pressedSet.add(e.code);
      this.down.add(e.code);
      for (const l of this.listeners) l(e.code, true);
    });
    window.addEventListener('keyup', (e) => { this.down.delete(e.code); });
    window.addEventListener('blur', () => { this.down.clear(); });
    canvas.addEventListener('mousedown', (e) => {
      if (this.captureNext) { const f = this.captureNext; this.captureNext = null; f('Mouse' + e.button); return; }
      const c = 'Mouse' + e.button;
      if (!this.down.has(c)) this.pressedSet.add(c);
      this.down.add(c);
    });
    window.addEventListener('mouseup', (e) => { this.down.delete('Mouse' + e.button); });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; }
    });
    window.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });
    window.addEventListener('gamepadconnected', (e) => { this.pad = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.pad = null; });
  },

  lockPointer() {
    if (!this.pointerLocked && this.canvas && document.hasFocus()) {
      try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* yoksay */ }
    }
  },
  unlockPointer() { if (document.pointerLockElement) document.exitPointerLock(); },

  isDown(action) {
    const c = this.bindings[action];
    return (c && this.down.has(c)) || this._padDown(action);
  },
  pressed(action) {
    const c = this.bindings[action];
    return (c && this.pressedSet.has(c)) || this._padPressed(action);
  },
  consume(action) { const c = this.bindings[action]; if (c) this.pressedSet.delete(c); },

  // Kumanda eşlemesi (standart düzen)
  PAD: { zipla: 0, egil: 1, etkilesim: 2, envanter: 3, nisan: 6, saldiri: 7, harita: 8, duraklat: 9, kos: 10, kacin: 11, fener: 12, doldur: 13, isaret: 14, defter: 15 },
  _padState() {
    if (this.pad === null) return null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[this.pad] || null;
  },
  _padDown(action) {
    const p = this._padState();
    const b = this.PAD[action];
    if (!p || b === undefined || !p.buttons[b]) return false;
    return p.buttons[b].pressed;
  },
  _padPressed(action) {
    const p = this._padState();
    const b = this.PAD[action];
    if (!p || b === undefined || !p.buttons[b]) return false;
    return p.buttons[b].pressed && !this.padPrev[b];
  },

  // Hareket ekseni (-1..1)
  moveAxis() {
    let x = 0, y = 0;
    if (this.isDown('ileri')) y += 1;
    if (this.isDown('geri')) y -= 1;
    if (this.isDown('sag')) x += 1;
    if (this.isDown('sol')) x -= 1;
    const p = this._padState();
    if (p) {
      const dz = (v) => (Math.abs(v) < 0.15 ? 0 : v);
      x += dz(p.axes[0] || 0);
      y -= dz(p.axes[1] || 0);
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },

  lookDelta() {
    let dx = this.mouseDX * 0.0022 * this.sensitivity, dy = this.mouseDY * 0.0022 * this.sensitivity;
    const p = this._padState();
    if (p) {
      const dz = (v) => (Math.abs(v) < 0.12 ? 0 : v);
      dx += dz(p.axes[2] || 0) * 0.045 * this.padSensitivity;
      dy += dz(p.axes[3] || 0) * 0.035 * this.padSensitivity;
    }
    if (this.invertY) dy = -dy;
    return { dx, dy };
  },

  endFrame() {
    this.pressedSet.clear();
    this.mouseDX = 0; this.mouseDY = 0; this.wheel = 0;
    const p = this._padState();
    if (p) this.padPrev = p.buttons.map((b) => b.pressed);
  },
};
