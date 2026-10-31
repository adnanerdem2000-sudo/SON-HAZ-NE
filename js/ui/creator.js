import * as THREE from 'three';
import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el } from '../core/util.js';
import { Character } from '../player/character.js';
import { OPTIONS, SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTH_COLORS, COSMETIC_PRICES, DEFAULT_UNLOCKED, defaultAppearance, randomAppearance } from '../player/appearance.js';
import { shop } from '../economy/shop.js';

// Korsan oluşturma / terzi ekranı (3B önizlemeli)
export const creator = {
  open({ appearance, title = 'Korsanını Oluştur', confirm = 'Kaydet', shopMode = false, onDone, onCancel }) {
    let app = { ...defaultAppearance(appearance?.gender || 'm'), ...(appearance || {}) };
    const original = { ...app };
    const unlocked = () => new Set([...(G.profile?.unlocked || []), ...DEFAULT_UNLOCKED]);
    const isLocked = (k, v) => COSMETIC_PRICES[`${k}:${v}`] && !unlocked().has(`${k}:${v}`);

    const wrap = el('div', { class: 'creator' });
    const prevBox = el('div', { class: 'preview' });
    const canvas = document.createElement('canvas');
    prevBox.appendChild(canvas);
    prevBox.appendChild(el('div', { class: 'rot' }, 'Sürükleyerek döndür · Tekerlek ile yakınlaştır'));
    const right = el('div', { class: 'col scroll', style: { overflow: 'auto', paddingRight: '10px' } });
    wrap.append(prevBox, right);

    // 3B önizleme
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff2e0, 0x405060, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0x80c0ff, 1.2); rim.position.set(-2, 2, -3); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.9 }));
    floor.position.y = -0.04; scene.add(floor);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    let rotY = 0.4, zoom = 1, char = null, alive = true;
    const rebuild = () => {
      if (char) scene.remove(char.root);
      char = new Character(app);
      char.root.rotation.y = rotY;
      scene.add(char.root);
      char.play('Idle', 0);
    };
    rebuild();
    let drag = null;
    canvas.addEventListener('mousedown', (e) => { drag = e.clientX; });
    window.addEventListener('mouseup', () => { drag = null; });
    canvas.addEventListener('mousemove', (e) => { if (drag !== null) { rotY += (e.clientX - drag) * 0.01; drag = e.clientX; } });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.min(2.6, Math.max(0.8, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); }, { passive: false });
    let last = performance.now();
    const loop = () => {
      if (!alive) return;
      requestAnimationFrame(loop);
      const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const w = prevBox.clientWidth, h = prevBox.clientHeight;
      if (w && h && (canvas.width !== w || canvas.height !== h)) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      const ty = 1.0 + (zoom - 1) * 0.35;
      cam.position.set(0, ty + 0.15, 4.6 / zoom);
      cam.lookAt(0, ty, 0);
      if (char) { char.root.rotation.y = rotY; char.update(dt); }
      r.render(scene, cam);
    };
    loop();

    const cost = () => {
      if (!shopMode) return 0;
      let c = 0;
      for (const k of ['hat', 'coat', 'necklace', 'earring', 'gloves']) if (isLocked(k, app[k])) c += COSMETIC_PRICES[`${k}:${app[k]}`];
      return c;
    };

    const sections = () => {
      right.innerHTML = '';
      const chips = (key, list, opts = {}) => el('div', { class: 'chips' }, ...list.map(([v, n]) => {
        const locked = isLocked(key, v);
        const c = el('div', { class: 'chip' + (app[key] === v ? ' active' : '') + (locked ? ' locked' : ''), onclick: () => {
          if (locked && !shopMode) { G.notify('Bu kozmetik Terzi Lale\'nin dükkânında açılır.', 'info'); }
          app[key] = v;
          if (key === 'gender') { app.beard = v === 'f' ? 'yok' : app.beard; app.body = v === 'f' ? (app.body === 'kaba' || app.body === 'subay' ? 'cevik' : app.body) : (app.body === 'cevik' ? 'kaba' : app.body); }
          rebuild(); sections();
        } }, n + (locked ? ` (${COSMETIC_PRICES[`${key}:${v}`]})` : ''));
        return c;
      }));
      const swatches = (key, colors, isIndex = false) => el('div', { class: 'swatches' }, ...colors.map((col, i) => el('div', {
        class: 'sw' + ((isIndex ? app[key] === i : app[key] === col) ? ' active' : ''), style: { background: col },
        onclick: () => { app[key] = isIndex ? i : col; rebuild(); sections(); },
      })));
      const slider = (key, min, max, step) => {
        const s = el('input', { type: 'range', min, max, step, value: app[key] });
        s.addEventListener('input', () => { app[key] = parseFloat(s.value); rebuild(); });
        return s;
      };
      const g = (label, control) => [el('span', { class: 'lbl' }, label), control];
      const nameIn = el('input', { type: 'text', value: app.name, maxlength: 20 });
      nameIn.addEventListener('input', () => { app.name = nameIn.value; });
      right.appendChild(el('h3', {}, 'Kimlik'));
      right.appendChild(el('div', { class: 'opt-grid' },
        ...g('Korsan adı', nameIn),
        ...g('Cinsiyet', chips('gender', OPTIONS.gender)),
        ...g('Gövde', chips('body', OPTIONS.body)),
        ...g('Boy', slider('height', 0.9, 1.1, 0.01)),
        ...g('Vücut tipi', slider('build', 0.88, 1.18, 0.01)),
        ...g('Yaş', slider('age', 0, 1, 0.01)),
      ));
      right.appendChild(el('h3', {}, 'Yüz'));
      right.appendChild(el('div', { class: 'opt-grid' },
        ...g('Ten rengi', swatches('skin', SKIN_TONES, true)),
        ...g('Yüz şekli', chips('face', OPTIONS.face)),
        ...g('Yara izi', chips('scar', OPTIONS.scar)),
        ...g('Yüz izleri', chips('facemark', OPTIONS.facemark)),
      ));
      right.appendChild(el('h3', {}, 'Saç ve sakal'));
      right.appendChild(el('div', { class: 'opt-grid' },
        ...g('Saç rengi', swatches('hairColor', HAIR_COLORS, true)),
        ...(app.gender === 'm' && app.body !== 'kaba' ? [...g('Sakal', chips('beard', OPTIONS.beard)), ...g('Sakal rengi', swatches('beardColor', HAIR_COLORS, true))] : []),
      ));
      right.appendChild(el('h3', {}, 'Kıyafet ve aksesuar'));
      right.appendChild(el('div', { class: 'opt-grid' },
        ...g('Şapka', chips('hat', OPTIONS.hat)),
        ...g('Şapka rengi', swatches('hatColor', CLOTH_COLORS)),
        ...g('Ceket', chips('coat', OPTIONS.coat)),
        ...g('Ceket rengi', swatches('coatColor', CLOTH_COLORS)),
        ...g('Gömlek', swatches('shirtColor', CLOTH_COLORS)),
        ...g('Pantolon', swatches('pantsColor', CLOTH_COLORS)),
        ...g('Çizme', swatches('bootsColor', ['#2a2a2a', '#3b2516', '#5a3a1e', '#6b4a2c', '#1a1a2a'])),
        ...g('Deri işleri', swatches('beltColor', ['#6b4a2c', '#3b2516', '#8a5a2b', '#2a2a2a', '#7a1f1f'])),
        ...g('Pelerin', chips('cape', OPTIONS.cape)),
        ...g('Göz bandı', chips('eyepatch', OPTIONS.eyepatch)),
        ...g('Küpe', chips('earring', OPTIONS.earring)),
        ...g('Kolye', chips('necklace', OPTIONS.necklace)),
      ));
      const c = cost();
      const bar = el('div', { class: 'row', style: { marginTop: '14px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'rgba(241,226,189,.95)', padding: '8px 0' } },
        el('button', { class: 'btn', onclick: () => { app = randomAppearance(); app.name = nameIn.value || app.name; if (!shopMode) for (const k of ['hat', 'coat', 'necklace', 'earring', 'gloves']) if (isLocked(k, app[k])) app[k] = 'yok'; rebuild(); sections(); } }, 'Rastgele'),
        el('button', { class: 'btn', onclick: () => { app = { ...original }; rebuild(); sections(); } }, 'Geri al'),
        shopMode && c ? el('span', { class: 'gold-tag' }, `Toplam: ${c} altın`) : null,
        el('button', { class: 'btn gold', onclick: () => finish() }, shopMode && c ? 'Satın al ve giy' : confirm));
      right.appendChild(bar);
    };

    const finish = () => {
      if (!app.name || !app.name.trim()) app.name = 'Adsız Korsan';
      // kilitli kozmetikler
      for (const k of ['hat', 'coat', 'necklace', 'earring', 'gloves']) {
        if (isLocked(k, app[k])) {
          if (!shopMode) { app[k] = original[k] && !isLocked(k, original[k]) ? original[k] : 'yok'; continue; }
          if (!shop.unlockCosmetic(`${k}:${app[k]}`)) return;
        }
      }
      close();
      onDone && onDone({ ...app });
    };
    const close = () => { alive = false; ui.close(); r.dispose(); r.forceContextLoss?.(); };
    sections();
    ui.open(ui.panel(title, wrap, { onX: () => { close(); onCancel && onCancel(); } }), { kind: 'creator', onEsc: () => { close(); onCancel && onCancel(); } });
  },
};
