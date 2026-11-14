// Oyun bağlamı: sistemler arası ortak referanslar ve basit olay yolu.
export const G = {
  scene: null, camera: null, renderer: null,
  player: null,
  remotes: new Map(),
  ships: [],
  ship: null,
  rowboat: null,
  state: 'menu',
  online: false,
  isHost: true,
  myId: 'local',
  playerName: 'Korsan',
  difficulty: 'normal',
  friendlyFire: false,
  slot: null,
  _ev: new Map(),

  on(evt, fn) {
    if (!this._ev.has(evt)) this._ev.set(evt, new Set());
    this._ev.get(evt).add(fn);
    return () => this._ev.get(evt).delete(fn);
  },
  emit(evt, data) {
    const s = this._ev.get(evt);
    if (s) for (const fn of [...s]) { try { fn(data); } catch (e) { console.error(evt, e); } }
  },
  notify(text, kind = 'info', ms = 3500) { this.emit('notify', { text, kind, ms }); },
};
