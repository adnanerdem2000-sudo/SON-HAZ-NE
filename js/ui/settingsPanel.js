import { ui } from './ui.js';
import { el } from '../core/util.js';
import { settings, DEFAULT_SETTINGS } from '../core/settings.js';
import { input, ACTION_LABELS, keyLabel, DEFAULT_BINDINGS } from '../core/input.js';
import { save } from '../core/save.js';
import { G } from '../game/ctx.js';

export function openSettings() {
  const v = settings.v;
  let tab = 'goruntu';
  const body = el('div', { class: 'col', style: { width: 'min(820px, 92vw)', height: 'min(660px, calc(90vh - 120px))' } });
  const commit = () => { settings.apply(); settings.save(); G.emit('settingsChanged'); };
  const slider = (key, min, max, step, fmt = (x) => x) => {
    const val = el('span', { style: { minWidth: '52px', textAlign: 'right' } }, fmt(v[key]));
    const s = el('input', { type: 'range', min, max, step, value: v[key] });
    s.addEventListener('input', () => { v[key] = parseFloat(s.value); val.textContent = fmt(v[key]); commit(); });
    return el('div', { class: 'row' }, s, val);
  };
  const check = (key) => { const c = el('input', { type: 'checkbox' }); c.checked = !!v[key]; c.addEventListener('change', () => { v[key] = c.checked; commit(); }); return c; };
  const select = (key, opts, needsReload = false) => {
    const s = el('select', {}, ...opts.map(([val, n]) => { const o = el('option', { value: val }, n); if (String(v[key]) === String(val)) o.selected = true; return o; }));
    s.addEventListener('change', () => { v[key] = isNaN(+s.value) || s.value === '' ? s.value : +s.value; commit(); if (needsReload) G.notify('Bu ayar oyun yeniden başlatıldığında tam uygulanır.', 'info'); });
    return s;
  };
  const row = (label, ctrl, note) => el('label', { class: 'set' }, el('span', {}, label, note ? el('div', { class: 'muted', style: { fontSize: '14px' } }, note) : null), ctrl);
  const render = () => {
    body.innerHTML = '';
    const tabs = el('div', { class: 'tabs' });
    for (const [k, n] of [['goruntu', 'Görüntü'], ['ses', 'Ses'], ['kontrol', 'Kontroller'], ['diger', 'Diğer']]) tabs.appendChild(el('div', { class: 'tab' + (tab === k ? ' active' : ''), onclick: () => { tab = k; render(); } }, n));
    body.appendChild(tabs);
    const sc = el('div', { class: 'scroll', style: { flex: 1, overflow: 'auto' } });
    if (tab === 'goruntu') {
      sc.append(
        row('Çözünürlük ölçeği', slider('renderScale', 0.5, 1.5, 0.05, (x) => Math.round(x * 100) + '%'), 'Düşük değer = daha yüksek FPS'),
        row('Grafik kalitesi', select('quality', [['low', 'Düşük'], ['medium', 'Orta'], ['high', 'Yüksek']], true), 'Arazi, su ve bitki yoğunluğu (yeniden başlatınca)'),
        row('FPS sınırı', select('fpsLimit', [[0, 'Sınırsız (ekran yenileme hızı)'], [30, '30'], [60, '60'], [120, '120']])),
        row('Görüş mesafesi', slider('viewDistance', 0.3, 1, 0.05, (x) => Math.round(x * 100) + '%')),
        row('Gölge kalitesi', select('shadows', [['off', 'Kapalı'], ['medium', 'Orta (1024)'], ['high', 'Yüksek (2048)']])),
        row('Su kalitesi', select('water', [['low', 'Düşük'], ['medium', 'Orta'], ['high', 'Yüksek']], true)),
        row('Efekt kalitesi', select('effects', [['low', 'Düşük'], ['medium', 'Orta'], ['high', 'Yüksek']]), 'Parlama (bloom), renk düzenleme ve kenar yumuşatma. Düşük = son işleme kapalı'),
        row('Görüş alanı (FOV)', slider('fov', 55, 95, 1, (x) => x + '°')),
        row('FPS göster', check('showFps')),
      );
    } else if (tab === 'ses') {
      const pct = (x) => Math.round(x * 100) + '%';
      sc.append(row('Ana ses', slider('master', 0, 1, 0.01, pct)), row('Müzik', slider('music', 0, 1, 0.01, pct)), row('Ortam sesleri', slider('ambient', 0, 1, 0.01, pct)), row('Ses efektleri', slider('sfx', 0, 1, 0.01, pct)), row('Diyalog sesleri', slider('voice', 0, 1, 0.01, pct), 'NPC konuşma mırıltıları'));
    } else if (tab === 'kontrol') {
      sc.append(row('Fare hassasiyeti', slider('sensitivity', 0.2, 3, 0.05, (x) => x.toFixed(2))), row('Kamera hassasiyeti (kumanda)', slider('padSensitivity', 0.2, 3, 0.05, (x) => x.toFixed(2))), row('Y eksenini ters çevir', check('invertY')), row('Kamera sarsıntısı', check('cameraShake')));
      sc.appendChild(el('h3', {}, 'Tuş atamaları'));
      sc.appendChild(el('div', { class: 'muted' }, 'Değiştirmek için bir tuşa tıkla, ardından yeni tuşa ya da fare düğmesine bas. Kumanda: standart düzen desteklenir (A zıpla, X etkileşim, RT saldırı, LT nişan, Y envanter, Back harita).'));
      for (const k in ACTION_LABELS) {
        const b = el('button', { class: 'btn small', style: { minWidth: '130px' } }, keyLabel(v.bindings[k]));
        b.addEventListener('click', () => {
          b.textContent = 'Bir tuşa bas…';
          input.captureNext = (code) => {
            if (code === 'Escape') { b.textContent = keyLabel(v.bindings[k]); return; }
            for (const o in v.bindings) if (v.bindings[o] === code && o !== k) v.bindings[o] = v.bindings[k];
            v.bindings[k] = code; commit(); render();
          };
        });
        sc.appendChild(row(ACTION_LABELS[k], b));
      }
      sc.appendChild(el('button', { class: 'btn small', onclick: () => { v.bindings = { ...DEFAULT_BINDINGS }; commit(); render(); } }, 'Varsayılan tuşlar'));
    } else {
      sc.append(
        row('Arayüz ölçeği', slider('uiScale', 0.8, 1.4, 0.05, (x) => Math.round(x * 100) + '%')),
        row('Yüksek kontrast', check('highContrast')),
        row('Hareketi azalt (animasyonlar)', check('reduceMotion')),
      );
      sc.appendChild(el('h3', {}, 'Kayıt dosyaları'));
      sc.appendChild(el('div', { class: 'row' },
        el('button', { class: 'btn small', onclick: () => {
          const blob = new Blob([save.exportAll()], { type: 'application/json' });
          const a = el('a', { href: URL.createObjectURL(blob), download: 'son-hazine-kayitlar.json' }); a.click();
        } }, 'Kayıtları dışa aktar'),
        el('button', { class: 'btn small', onclick: () => {
          const f = el('input', { type: 'file', accept: '.json' });
          f.addEventListener('change', async () => { const t = await f.files[0].text(); if (save.importAll(t)) G.notify('Kayıtlar içe aktarıldı.', 'good'); else G.notify('Dosya okunamadı.', 'warn'); });
          f.click();
        } }, 'Kayıtları içe aktar')));
      sc.appendChild(el('button', { class: 'btn small red', style: { marginTop: '10px' }, onclick: () => ui.confirm('Tüm ayarlar varsayılana dönsün mü?', () => { settings.reset(); render(); }) }, 'Ayarları sıfırla'));
    }
    body.appendChild(sc);
  };
  render();
  ui.open(ui.panel('Ayarlar', body), { kind: 'settings' });
  void DEFAULT_SETTINGS;
}
