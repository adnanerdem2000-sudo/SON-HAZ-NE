// Arazi işçisi: karo geometrisi, okyanus derinlik penceresi ve harita ızgaraları ana iş parçacığını
// yormadan burada üretilir. Üretim kodu terrainGen.js'de; işçi kullanılamazsa aynı kod ana iş parçacığında çalışır.
import { generate, runAll } from './terrainGen.js';

// Test kipleri işçinin adından okunur (terrain.js _isciAdi; yalnız test kipinde ?terrain= ile, A-17):
//   test-crash   her işte çöker (ana iş parçacığının kurtarma yolunu sınamak için; ?terrain=crash)
//   test-crash1  ikinci işinde bir kez çöker (tek işçi belirli bir işte çöker; yeniden başlatılan işçi sağlıklıdır; ?terrain=crash1)
//   test-hang    hazır sinyali gönderir ama hiçbir işe yanıt vermez (askıda işçi; ?terrain=hang)
//   test-noready hazır sinyali göndermez, işlere yanıt vermez (başlamayan işçi; ?terrain=noready)
const AD = self.name || '';
let alinan = 0;
self.onmessage = (e) => {
  const m = e.data;
  alinan++;
  if (AD === 'test-crash') throw new Error('Test: arazi işçisi çökmesi');
  if (AD === 'test-crash1' && alinan === 2) throw new Error('Test (crash1): arazi işçisi ikinci işinde çöktü');
  if (AD === 'test-hang' || AD === 'test-noready') return;
  try {
    const { out, transfer } = runAll(generate(m));
    self.postMessage(out, transfer);
  } catch (err) {
    self.postMessage({ t: 'error', id: m.id, msg: String(err && err.stack || err) });
  }
};
if (AD !== 'test-noready') self.postMessage({ t: 'ready' });
