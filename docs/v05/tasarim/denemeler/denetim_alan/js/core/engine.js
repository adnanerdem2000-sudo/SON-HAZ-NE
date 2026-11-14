import * as THREE from 'three';
import './shaderfix.js'; // NaN üreten sıfır normal koruması: hiçbir malzeme derlenmeden önce
import { post } from './post.js';

export const engine = {
  renderer: null,
  scene: null,
  camera: null,
  timer: new THREE.Timer(),
  updaters: new Set(),
  fpsLimit: 0,
  renderScale: 1,
  _last: 0,
  fps: 0,
  _fpsAcc: 0,
  _fpsN: 0,
  paused: false,

  init(container) {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.renderScale);
    r.setSize(window.innerWidth, window.innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(r.domElement);
    r.domElement.id = 'game-canvas';
    this.renderer = r;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000);
    post.init(r, this.scene, this.camera);
    window.addEventListener('resize', () => this.resize());
    return this;
  },

  setRenderScale(s) {
    this.renderScale = s;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * s);
    this.resize();
  },

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    post.resize();
  },

  start() {
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (this.fpsLimit > 0) {
        const minDt = 1000 / this.fpsLimit;
        if (now - this._last < minDt - 1) return;
      }
      this._last = now;
      this.timer.update(now);
      let dt = this.timer.getDelta();
      if (dt > 0.1) dt = 0.1;
      this._fpsAcc += dt; this._fpsN++;
      if (this._fpsAcc > 0.5) { this.fps = Math.round(this._fpsN / this._fpsAcc); this._fpsAcc = 0; this._fpsN = 0; }
      for (const u of this.updaters) {
        try { u(dt); } catch (e) { console.error(e); }
      }
      post.render();
    };
    requestAnimationFrame(loop);
  },
};
