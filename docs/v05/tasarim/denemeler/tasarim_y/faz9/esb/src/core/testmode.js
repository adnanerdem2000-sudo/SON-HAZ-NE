// gerçek (geliştirme) sürüm
export const TEST = (() => { try { const q = new URLSearchParams(location.search); return q.get('test') === '1' && (location.protocol === 'file:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname)); } catch (e) { return false; } })();
