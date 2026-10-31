import { G } from '../game/ctx.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import { el } from '../core/util.js';

// Modal yönetimi: menü alt ekranları ve oyun içi paneller aynı katmanı kullanır
export const ui = {
  stack: [],
  modal: null,

  init() {
    this.modal = document.getElementById('modal');
    this.tooltip = document.getElementById('tooltip');
    window.addEventListener('keydown', (e) => {
      if (!this.stack.length) return;
      const top = this.stack[this.stack.length - 1];
      if (e.code === 'Escape' || (top.closeKeys && top.closeKeys.includes(e.code))) {
        if (input.captureNext) return;
        e.preventDefault();
        // aynı tuş oyun tarafından yeniden açılmasın
        setTimeout(() => input.pressedSet.delete(e.code), 0);
        input.pressedSet.delete(e.code);
        this._justClosed = performance.now();
        if (top.onEsc) top.onEsc(); else this.close();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.tooltip.classList.contains('hidden')) {
        this.tooltip.style.left = Math.min(window.innerWidth - 340, e.clientX + 16) + 'px';
        this.tooltip.style.top = Math.min(window.innerHeight - 160, e.clientY + 16) + 'px';
      }
    });
  },

  // panel: DOM elemanı; opts: {clear, closeKeys, onClose, onEsc, keepGame}
  open(panel, opts = {}) {
    // aynı türden panel varsa kapat
    while (this.stack.length && opts.replace) this.close(true);
    const wrap = el('div', { class: 'modal-wrap', style: { display: 'contents' } }, panel);
    this.modal.appendChild(wrap);
    for (const s of this.stack) s.wrap.style.display = 'none';
    this.stack.push({ wrap, panel, ...opts });
    this.modal.classList.add('active');
    this.modal.classList.toggle('clear', !!opts.clear);
    if (G.state === 'playing') { G.uiOpen = true; input.unlockPointer(); }
    audio.play('ui', { vol: 0.25 });
    return panel;
  },

  close(silent = false) {
    const top = this.stack.pop();
    if (!top) return;
    top.wrap.remove();
    if (top.onClose) top.onClose();
    if (this.stack.length) {
      const nt = this.stack[this.stack.length - 1];
      nt.wrap.style.display = 'contents';
      this.modal.classList.toggle('clear', !!nt.clear);
    } else {
      this.modal.classList.remove('active');
      this.modal.classList.remove('clear');
      if (G.state === 'playing') { G.uiOpen = false; setTimeout(() => input.lockPointer(), 30); }
    }
    this.hideTip();
    if (!silent) audio.play('ui', { vol: 0.15, rate: 0.8 });
  },

  closeAll() { while (this.stack.length) this.close(true); },
  isOpen() { return this.stack.length > 0; },
  topIs(kind) { return this.stack.length && this.stack[this.stack.length - 1].kind === kind; },

  panel(title, body, opts = {}) {
    const p = el('div', { class: 'panel ' + (opts.cls || ''), style: opts.style || {} });
    if (title) p.appendChild(el('h2', {}, title));
    if (opts.closable !== false) p.appendChild(el('button', { class: 'close-x', title: 'Kapat (Esc)', onclick: () => (opts.onX ? opts.onX() : this.close()) }, '✕'));
    if (body) p.appendChild(body);
    return p;
  },

  showTip(html) { this.tooltip.innerHTML = html; this.tooltip.classList.remove('hidden'); },
  hideTip() { this.tooltip?.classList.add('hidden'); },
  tipOn(elm, html) {
    elm.addEventListener('mouseenter', () => this.showTip(typeof html === 'function' ? html() : html));
    elm.addEventListener('mouseleave', () => this.hideTip());
    return elm;
  },

  confirm(text, onYes, yes = 'Evet', no = 'Vazgeç') {
    const body = el('div', { class: 'col' },
      el('div', { style: { fontSize: '20px', margin: '6px 0 14px', maxWidth: '560px' }, html: text }),
      el('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        el('button', { class: 'btn', onclick: () => this.close() }, no),
        el('button', { class: 'btn gold', onclick: () => { this.close(); onYes(); } }, yes)));
    this.open(this.panel('Emin misin?', body, { closable: false }));
  },

  alert(title, html) {
    const body = el('div', { class: 'col' },
      el('div', { style: { fontSize: '19px', maxWidth: '620px' }, html }),
      el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '12px' } }, el('button', { class: 'btn gold', onclick: () => this.close() }, 'Tamam')));
    this.open(this.panel(title, body));
  },
};
