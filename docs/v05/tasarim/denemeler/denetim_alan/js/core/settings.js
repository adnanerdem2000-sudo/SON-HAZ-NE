import { DEFAULT_BINDINGS, input } from './input.js';
import { terrain } from '../world/terrain.js';
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
      if (s) {
        const b = { ...DEFAULT_BINDINGS, ...(s.bindings || {}) };
        // eski varsayılan (Sol Ctrl eğil, C pusula) kaydedilmişse yeni varsayılana taşı: Ctrl+W sekmeyi kapatıyordu
        if (b.egil === 'ControlLeft' && b.pusula === 'KeyC') { b.egil = 'KeyC'; b.pusula = 'KeyN'; }
        this.v = { ...DEFAULT_SETTINGS, ...s, bindings: b };
      }
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
      engine.fpsLimit = v.fpsLimit || 0;
      engine.setRenderScale(v.renderScale);
      engine.renderer.shadowMap.enabled = v.shadows !== 'off';
      // gölge haritası boyutu seviyeye göre (orta 1024, yüksek 2048)
      const sm = v.shadows === 'high' ? 2048 : 1024;
      engine.scene?.traverse((o) => {
        if (o.isDirectionalLight && o.shadow && o.shadow.mapSize.x !== sm) {
          o.shadow.mapSize.set(sm, sm);
          if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
        }
      });
      engine.camera.far = 1500 + 3500 * v.viewDistance;
      engine.camera.updateProjectionMatrix();
      // görüş mesafesi: arazi akış/LOD yarıçapı (%30 → 0,79×, %100 → 1,0×)
      if (terrain.baseLod === undefined) terrain.baseLod = terrain.lodScale || 1;
      terrain.lodScale = terrain.baseLod * (0.7 + 0.3 * v.viewDistance);
      post.setQuality(v.effects);
    }
    document.documentElement.style.setProperty('--ui-scale', v.uiScale);
    document.body.classList.toggle('high-contrast', !!v.highContrast);
    document.body.classList.toggle('reduce-motion', !!v.reduceMotion);
  },
};
