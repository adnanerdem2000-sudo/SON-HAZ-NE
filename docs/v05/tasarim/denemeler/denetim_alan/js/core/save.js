// Kalıcı kayıt: tarayıcı localStorage (masaüstü sürümde dosyaya taşınabilir)
// Bozulmaya karşı: önce geçici anahtara yaz, doğrula, sonra asıl anahtara kopyala; bir önceki kayıt yedek tutulur.
const PREFIX = 'dksh.';
export const SLOT_COUNT = 3;

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }

export const save = {
  available() {
    try { localStorage.setItem(PREFIX + 't', '1'); localStorage.removeItem(PREFIX + 't'); return true; } catch (e) { return false; }
  },

  key(kind, slot) { return `${PREFIX}${kind}.${slot}`; },

  write(kind, slot, data) {
    const k = this.key(kind, slot);
    const json = JSON.stringify(data);
    try {
      localStorage.setItem(k + '.tmp', json);
      if (!safeParse(localStorage.getItem(k + '.tmp'))) throw new Error('doğrulama başarısız');
      const prev = localStorage.getItem(k);
      if (prev) localStorage.setItem(k + '.bak', prev);
      localStorage.setItem(k, json);
      localStorage.removeItem(k + '.tmp');
      return true;
    } catch (e) {
      console.error('Kayıt hatası', e);
      return false;
    }
  },

  // Şema doğrulaması: yarım/elle bozulmuş kayıtlar geçerli yuva sayılmaz
  valid(kind, d) {
    if (!d || typeof d !== 'object') return false;
    if (kind === 'guest') return !!d.inv && typeof d.inv === 'object';
    return !!d.player && typeof d.player === 'object' && !!d.player.inv && (d.version === undefined || typeof d.version === 'number');
  },
  read(kind, slot) {
    const k = this.key(kind, slot);
    const d = safeParse(localStorage.getItem(k));
    if (this.valid(kind, d)) return d;
    // asıl kayıt bozuksa yedeği dene
    for (const s of ['.bak', '.tmp']) { const b = safeParse(localStorage.getItem(k + s)); if (this.valid(kind, b)) return b; }
    return null;
  },

  remove(kind, slot) {
    const k = this.key(kind, slot);
    for (const s of ['', '.bak', '.tmp']) localStorage.removeItem(k + s);
  },

  list(kind) {
    const out = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const d = this.read(kind, i);
      out.push(d ? { slot: i, name: d.name, savedAt: d.savedAt, playTime: d.playTime, gold: d.player?.inv?.gold, stage: d.quests?.stage, ship: d.ship?.name } : { slot: i, empty: true });
    }
    return out;
  },

  latest() {
    let best = null;
    for (const kind of ['solo', 'online']) for (let i = 0; i < SLOT_COUNT; i++) {
      const d = this.read(kind, i);
      if (d && (!best || d.savedAt > best.data.savedAt)) best = { kind, slot: i, data: d };
    }
    return best;
  },

  profile() {
    return safeParse(localStorage.getItem(PREFIX + 'profile')) || null;
  },
  writeProfile(p) {
    try { localStorage.setItem(PREFIX + 'profile', JSON.stringify(p)); } catch (e) { /* yoksay */ }
  },

  exportAll() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX)) o[k] = localStorage.getItem(k); }
    return JSON.stringify(o);
  },
  importAll(json) {
    const o = safeParse(json);
    if (!o) return false;
    for (const k in o) if (k.startsWith(PREFIX)) localStorage.setItem(k, o[k]);
    return true;
  },
};
