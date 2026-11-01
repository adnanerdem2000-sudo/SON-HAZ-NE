# 10. Performans Karşılaştırması (Aşama 8)

## 10.1 Ortam uyarısı (açıkça)
Bu ortamda **gerçek ekran kartı yok**: Chromium SwiftShader ile çizer. Bu nedenle FPS değerleri donanım FPS'i değildir ve
"gerçek GPU'da 60 FPS" hedefi burada **doğrulanamaz**. Ölçülebilenler: çizim çağrısı ve üçgen sayıları (`renderer.info`),
GPU kaynak sayaçları (geometri/doku/program), JS yığını (`performance.memory`) ve ana iş parçacığı **benzetim maliyeti**
(`game.update` ms/kare — CPU tarafı; gerçek makinede de benzer). Senaryo: `tests/scenarios/09_performans.js`.

## 10.2 Ölçümler
(Koşu sonrası doldurulur: menü, başlangıç limanı, orman adası (Kadim Tapınak), fırtına, boss (Kraken), 2 oyunculu profil.)

## 10.3 Sızıntı denetimi
(Ada içeriği kaldırılınca geometri/doku sayaçlarının düşüşü; `09_performans.js` "B-09" adımı.)

## 10.4 Yapılan optimizasyonlar
(Aşama 8'de yapılanlar ve önce/sonra değerleri buraya işlenir.)
