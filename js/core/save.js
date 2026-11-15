// Kalıcı kayıt: tarayıcı localStorage (masaüstü sürümde dosyaya taşınabilir)
// Bozulmaya karşı: önce geçici anahtara yaz, doğrula, sonra asıl anahtara kopyala; bir önceki kayıt yedek tutulur.
const PREFIX = 'dksh.';
export const SLOT_COUNT = 3;

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
// A-18: tarayıcı site verisini engellediğinde (çerez/site verisi engeli, allow-same-origin'siz sandbox iframe) window.localStorage
// özelliğini OKUMAK bile SecurityError atar. Bütün erişimler bu güvenli erişimciden ve try içinden geçer: depo yoksa okumalar
// null/boş liste, yazmalar false döner; istisna çağırana (boot, menü, çevrimiçi akış) çıkmaz.
function depo() { try { return window.localStorage || null; } catch (e) { return null; } }
function oku(k) { const d = depo(); if (!d) return null; try { return d.getItem(k); } catch (e) { return null; } }

export const save = {
  available() {
    const d = depo();
    if (!d) return false;
    try { d.setItem(PREFIX + 't', '1'); d.removeItem(PREFIX + 't'); return true; } catch (e) { return false; }
  },

  key(kind, slot) { return `${PREFIX}${kind}.${slot}`; },

  write(kind, slot, data) {
    const k = this.key(kind, slot);
    const d = depo();
    if (!d) return false; // A-18: depo yok (site verisi engelli): hata değil, beklenen durum; çağıran oyuncuya bildirir
    const json = JSON.stringify(data);
    try {
      d.setItem(k + '.tmp', json);
      if (!safeParse(d.getItem(k + '.tmp'))) throw new Error('doğrulama başarısız');
      const prev = d.getItem(k);
      if (prev) d.setItem(k + '.bak', prev);
      d.setItem(k, json);
      d.removeItem(k + '.tmp');
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
    const d = safeParse(oku(k));
    if (this.valid(kind, d)) return d;
    // asıl kayıt bozuksa yedeği dene
    for (const s of ['.bak', '.tmp']) { const b = safeParse(oku(k + s)); if (this.valid(kind, b)) return b; }
    return null;
  },

  remove(kind, slot) {
    const k = this.key(kind, slot);
    const d = depo();
    if (!d) return;
    for (const s of ['', '.bak', '.tmp']) { try { d.removeItem(k + s); } catch (e) { /* depo kapalı/kilitli */ } }
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
    return safeParse(oku(PREFIX + 'profile')) || null;
  },
  writeProfile(p) {
    const d = depo();
    if (!d) return;
    try { d.setItem(PREFIX + 'profile', JSON.stringify(p)); } catch (e) { /* yoksay */ }
  },

  exportAll() {
    const o = {};
    const d = depo();
    if (d) {
      try { for (let i = 0; i < d.length; i++) { const k = d.key(i); if (k && k.startsWith(PREFIX)) o[k] = d.getItem(k); } } catch (e) { /* depo kapalı/kilitli */ }
    }
    return JSON.stringify(o);
  },
  importAll(json) {
    const o = safeParse(json);
    const d = depo();
    if (!o || !d) return false;
    try { for (const k in o) if (k.startsWith(PREFIX)) d.setItem(k, o[k]); } catch (e) { return false; }
    return true;
  },
};
