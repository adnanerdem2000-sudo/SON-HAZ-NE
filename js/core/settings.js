import { DEFAULT_BINDINGS, input } from './input.js';
import { audio } from './audio.js';
import { engine } from './engine.js';
import { tpCamera } from '../player/camera.js';
import { post } from './post.js';

const KEY = 'dksh.settings';

export const DEFAULT_SETTINGS = {
  // Görüntü
  renderScale: 1, quality: 'high', fpsLimit: 0, vsync: true, viewDistance: 1, shadows: 'high', water: 'high', effects: 'high', fov: 70,
  // Ses
  master: 0.8, music: 0.5, ambient: 0.7, sfx: 0.8, voice: 0.7,
  // Kontroller
  sensitivity: 1, invertY: false, padSensitivity: 1, cameraShake: true, bindings: { ...DEFAULT_BINDINGS },
  // Diğer
  language: 'tr', subtitles: true, uiScale: 1, highContrast: false, reduceMotion: false, showFps: false,
};

export const settings = {
  v: { ...DEFAULT_SETTINGS },

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) this.v = { ...DEFAULT_SETTINGS, ...s, bindings: { ...DEFAULT_BINDINGS, ...(s.bindings || {}) } };
    } catch (e) { /* varsayılan */ }
    return this.v;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.v)); } catch (e) { /* yoksay */ } },
  reset() { this.v = { ...DEFAULT_SETTINGS, bindings: { ...DEFAULT_BINDINGS } }; this.apply(); this.save(); },

  apply() {
    const v = this.v;
    input.bindings = { ...v.bindings };
    input.sensitivity = v.sensitivity;
    input.invertY = v.invertY;
    input.padSensitivity = v.padSensitivity;
    tpCamera.baseFov = v.fov;
    tpCamera.shakeEnabled = v.cameraShake && !v.reduceMotion;
    audio.vol = { master: v.master, music: v.music, ambient: v.ambient, sfx: v.sfx, voice: v.voice };
    audio.applyVolumes();
    if (engine.renderer) {
      engine.fpsLimit = v.vsync ? (v.fpsLimit || 0) : (v.fpsLimit || 0);
      engine.setRenderScale(v.renderScale);
      engine.renderer.shadowMap.enabled = v.shadows !== 'off';
      engine.camera.far = 1500 + 3500 * v.viewDistance;
      engine.camera.updateProjectionMatrix();
      post.setQuality(v.effects);
    }
    document.documentElement.style.setProperty('--ui-scale', v.uiScale);
    document.body.classList.toggle('high-contrast', !!v.highContrast);
    document.body.classList.toggle('reduce-motion', !!v.reduceMotion);
  },
};
