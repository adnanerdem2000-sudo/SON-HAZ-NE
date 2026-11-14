// Arazi işçisi: karo geometrisi, okyanus derinlik penceresi ve harita ızgaraları ana iş parçacığını
// yormadan burada üretilir. Üretim kodu terrainGen.js'de; işçi kullanılamazsa aynı kod ana iş parçacığında çalışır.
import { generate, runAll } from './terrainGen.js';

self.onmessage = (e) => {
  const m = e.data;
  // test kipi: işçi her işte çöker (ana iş parçacığının kurtarma yolunu sınamak için; terrain.js ?terrain=crash)
  if (self.name === 'test-crash') throw new Error('Test: arazi işçisi çökmesi');
  try {
    const { out, transfer } = runAll(generate(m));
    self.postMessage(out, transfer);
  } catch (err) {
    self.postMessage({ t: 'error', id: m.id, msg: String(err && err.stack || err) });
  }
};
self.postMessage({ t: 'ready' });
