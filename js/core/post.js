import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';

// Son işleme: HDR sahne → parlama (bloom) → renk düzenleme + vinyet → ton eşleme/sRGB → (FXAA)
// Efekt kalitesi: düşük = kapalı (doğrudan çizim), orta = bloom + FXAA, yüksek = bloom + 4x MSAA
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSat: { value: 1.08 },
    uContrast: { value: 1.05 },
    uGain: { value: new THREE.Vector3(1, 1, 1) },
    uLift: { value: new THREE.Vector3(0, 0, 0) },
    uVig: { value: 0.32 },
    uFlash: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSat, uContrast, uVig, uFlash; uniform vec3 uGain, uLift; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = max(c.rgb * uGain + uLift, 0.0);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(l), col, uSat), 0.0);
      col = pow(col / 0.18, vec3(uContrast)) * 0.18;
      vec2 d = vUv - 0.5;
      col *= clamp(1.0 - dot(d, d) * uVig * 2.2, 0.0, 1.0);
      col += vec3(0.75, 0.8, 1.0) * uFlash;
      gl_FragColor = vec4(col, c.a);
    }`,
};

export const post = {
  enabled: false,
  composer: null,
  mode: 'off',

  init(renderer, scene, camera) {
    this.renderer = renderer; this.scene = scene; this.camera = camera;
  },

  // efekt kalitesine göre zinciri kur
  // yazılımsal (GPU'suz) çizicilerde çok örnekli HDR hedefler çok yavaş/kararsız: FXAA'ya düş
  isSoftware() {
    if (this._soft !== undefined) return this._soft;
    let name = '';
    try {
      const gl = this.renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (e) { /* yoksay */ }
    this._soft = /swiftshader|llvmpipe|software|softpipe/i.test(String(name));
    return this._soft;
  },

  setQuality(q) {
    let mode = q === 'low' ? 'off' : q === 'medium' ? 'medium' : 'high';
    if (mode === 'high' && (this.isSoftware() || this.renderer.capabilities.maxSamples < 4)) mode = 'medium';
    if (mode === this.mode && (this.composer || mode === 'off')) return;
    this.mode = mode;
    if (this.composer) { this.composer.dispose?.(); this.composer = null; }
    this.enabled = mode !== 'off';
    document.body.classList.toggle('post-on', this.enabled);
    if (!this.enabled) return;
    const r = this.renderer;
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: mode === 'high' ? 4 : 0 });
    const c = new EffectComposer(r, rt);
    c.setPixelRatio(r.getPixelRatio());
    c.setSize(r.domElement.clientWidth || window.innerWidth, r.domElement.clientHeight || window.innerHeight);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.32, 0.55, 0.88);
    c.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    c.addPass(this.grade);
    c.addPass(new OutputPass());
    if (mode === 'medium') c.addPass(new FXAAPass());
    this.composer = c;
  },

  resize() {
    if (!this.composer) return;
    const r = this.renderer;
    this.composer.setPixelRatio(r.getPixelRatio());
    this.composer.setSize(r.domElement.clientWidth || window.innerWidth, r.domElement.clientHeight || window.innerHeight);
  },

  // günün saatine ve havaya göre renk düzenleme
  update(sky) {
    if (!this.enabled || !this.grade || !sky) return;
    const u = this.grade.uniforms;
    const day = sky.dayFactor ?? 1, sunset = sky.sunset ?? 0;
    const storm = sky.weather ? Math.min(1, (sky.weather.dark || 0) + (sky.weather.rain || 0) * 0.3) : 0;
    const night = 1 - day;
    const under = sky.underwater ? 1 : 0;
    // gündüz hafif sıcak, gün batımında altın, gece serin mavi; fırtınada soluk
    u.uGain.value.set(
      1.02 + sunset * 0.08 - night * 0.1 - storm * 0.04 - under * 0.12,
      1.0 + sunset * 0.01 - night * 0.03 - storm * 0.01 + under * 0.02,
      0.98 - sunset * 0.08 + night * 0.14 + storm * 0.03 + under * 0.06,
    );
    u.uLift.value.set(0.002 + night * 0.004, 0.003 + night * 0.007, 0.004 + night * 0.016);
    u.uSat.value = 1.1 + sunset * 0.12 - night * 0.22 - storm * 0.28 - under * 0.1;
    u.uContrast.value = 1.05 + sunset * 0.03 - storm * 0.04;
    u.uVig.value = 0.3 + night * 0.12 + under * 0.25;
    u.uFlash.value = (sky.lightningFlash || 0) * 0.12;
    if (this.bloom) {
      this.bloom.strength = 0.3 + night * 0.25 + sunset * 0.12 + (sky.lightningFlash || 0) * 0.4;
      this.bloom.threshold = 0.9 - night * 0.3;
    }
  },

  render() {
    if (this.enabled && this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  },
};
