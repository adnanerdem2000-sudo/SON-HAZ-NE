// Sahte Web Worker (Node): terrain.js iş kuyruğunun hata yollarını sınamak için. Gerçek üretim terrainGen.js ile yapılır.
export function installFakeWorker(ROOT, G) {
  const workers = [];
  class FakeWorker {
    constructor(url, opts = {}) {
      this.name = opts.name; this.terminated = false; this.onmessage = null; this.onerror = null; this.onmessageerror = null;
      this.idx = workers.length; workers.push(this); this.received = [];
      const cfg = G.cfg;
      if (cfg.ctorThrows) throw new Error('SecurityError (sahte): Worker engellendi');
      if (cfg.loadError) { setTimeout(() => this._err('yükleme hatası (sahte 404)'), 5); return; }
      if (!cfg.noReady) setTimeout(() => this._post({ t: 'ready' }), cfg.readyDelay ?? 5);
    }
    _post(data) {
      if (this.terminated && !G.cfg.deliverAfterTerminate) return;
      this.onmessage && this.onmessage({ data });
    }
    _err(message) { if (this.terminated) return; this.onerror && this.onerror({ message, preventDefault() {} }); }
    postMessage(msg) {
      if (this.terminated) return;
      if (G.cfg.loadError || G.cfg.noReady) return; // betik yüklenmedi / hiç yanıt yok
      this.received.push(msg.t + '#' + msg.id);
      const cfg = G.cfg;
      const m = structuredClone(msg);
      const pol = cfg.policy ? cfg.policy(this, m) : 'ok';
      if (pol === 'hang') return;
      if (pol === 'crash') { setTimeout(() => this._err('Uncaught Error: sahte çökme'), cfg.crashDelay ?? 1); return; }
      if (pol === 'error') { setTimeout(() => this._post({ t: 'error', id: m.id, msg: 'sahte üretim hatası' }), 1); return; }
      const delay = typeof cfg.delay === 'function' ? cfg.delay(this, m) : (cfg.delay ?? 2);
      setTimeout(() => {
        if (this.terminated && !cfg.deliverAfterTerminate) return;
        const { out } = G.runAll(G.generate(m));
        this._post(out);
      }, delay);
    }
    terminate() { this.terminated = true; }
  }
  globalThis.Worker = FakeWorker;
  return workers;
}
