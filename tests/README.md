# Test altyapısı

Oyunun otomatik testleri başsız Chromium (Playwright) ile çalışır. Bu ortamda gerçek ekran kartı yoktur;
çizim yazılımsal WebGL (SwiftShader) ile yapılır. Bu yüzden **FPS ölçümleri donanım değeri değildir**; oyun mantığı
süreleri (ms/kare), çizim çağrısı/üçgen sayıları ve bellek ölçümleri anlamlıdır.

## Hazırlık
```bash
python3 -m http.server 8080            # depo kökünde statik sunucu
node tests/peer-server.cjs &           # yalnız co-op testleri için (npm i peer)
```
Playwright: `require('playwright')` ve bir Chromium kurulu olmalı (`npx playwright install chromium`).

## Tek sayfalı senaryolar
```bash
node tests/harness/run.cjs tests/scenarios/<ad>.js --size 960x540 --report /tmp/rapor.json
```
Senaryo dosyası adım dizisi döndürür (`js`, `wait`, `expect`, `snap`, `view`, `shot`…; ayrıntı `tests/harness/run.cjs` başında).
Sayfadaki yardımcılar (`window.DK`):
- `DK.sim(saniye, dt=1/30)` — oyunu çizmeden ileri sarar (deterministik adım).
- `DK.press(kod, süre)`, `DK.tap(kod)` — tuş simülasyonu; `DK.G.noAutoPause = true` odak kaybı duraklatmasını kapatır.
- `DK.snap()` / `DK.snapFrom(from, to)` — yalnız 3B tuvali yakalar (sayfa ekran görüntüsünden daha kararlı).
- `DK.handlers.startGame({kind:'solo', slot:2, data:null})` — yeni oyun; `DK.terrain.prepare(x, z, {radius})` — bölge hazırlığı.
- Tüm sistemler `DK` üzerinde: `DK.G` (oyuncu, gemi, durum), `DK.enemies`, `DK.bosses`, `DK.animals`, `DK.megafauna`,
  `DK.hazards`, `DK.events`, `DK.worldEvents`, `DK.net`, `DK.progress`, `DK.terrain`, `DK.physics`, `DK.bodies`…

## Co-op senaryoları
```bash
node tests/harness/coop.cjs tests/scenarios/coop/<ad>.cjs --players 2 --size 640x360
```
Senaryo modülü `async ({ pages, host, guests, ev, tick, check, log }) => {}` dışa aktarır.

## Tek dosya sürümü
```bash
node tests/harness/run.cjs tests/scenarios/<ad>.js --url file://$PWD/DenizKorsanlari-SonHazine.html
```

## Dizinler
- `tests/scenarios/` — bu sürümün kabul/regresyon senaryoları
- `tests/scenarios/v03/` — v0.3 geliştirme sırasında kullanılan senaryolar (referans)
- `tests/out/` — raporlar ve görüntüler (git'e girmez)
