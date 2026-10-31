# 4. Kök Neden Analizleri (büyük hatalar)

## 4.1 İşçisiz/çöken işçide yükleme sonsuza dek takılıyor (B-01/B-02, kritik)
- **Belirti:** Web Worker başlatılamazsa (dosya yok, CSP, tek dosya sürümünde blob adresi) ya da çalışırken hata verirse yükleme %53'te kalıyor; menü arkası arazi yok.
- **Kök neden:** `terrain.js` yerel yedeği (`_localJob`) yalnız karo işini tanıyordu; derinlik ve ızgara istekleri hiç sonuçlanmıyor, `prepare()` derinliği `await` ediyor, `mapArt.initMapBase` ızgarayı bekliyordu. Yerel karo sonucunda geometri alanları yoktu (`_apply` atlıyor). İşçi `onerror`'u izlenmiyordu; zaman aşımı yoktu.
- **Düzeltme:** Ortak üretici modülü (`terrainGen.js`), her iş türü için yerel yol, iş zaman aşımı + yeniden deneme, hazır sinyali, hata iletisi, tüm işçiler düşünce yedek kipi. Her söz (promise) ya sonuçla ya hatayla biter.
- **Doğrulama:** `?terrain=noworker|badurl|crash` kiplerinde oyun açılır, oyuncu zemine basar, uzak bölge hazırlanır, harita ızgarası gelir; oyun içinde `killWorkers()` sonrası karolar yerel üretilir.

## 4.2 Hazırlık odağı mevcut çevreyi düşük çözünürlüğe indiriyor; derinlik penceresi geri sıçrıyor (Aşama 2 teşhisi)
- **Belirti (yedek kipte görünür):** Uzak bölge hazırlanırken oyuncunun bulunduğu karolar 2 m'den 20 m çözünürlüğe iniyor, yüzlerce gereksiz iş kuyruğa giriyor; derinlik penceresi hazırlıktan sonra eski bölgeye dönüyor.
- **Kök neden:** `prepare()` LOD merkezini uzak noktaya taşıyordu; kamera döngüsü ile odak döngüsü aynı karo için farklı çözünürlük isteyip birbirinin isteğini eziyordu (`t.seg !== seg && t.pending !== seg` histerezisi iki kaynakla çalışmaz). `ocean.update` her kare kameraya göre derinlik istiyor, hazırlıkta istenen pencereyi eziyordu.
- **Düzeltme:** `update()` iki kaynağın isteğini birleştirir (en yüksek çözünürlük kazanır), bekleyen farklı LOD isteğini iptal eder; `prepare()` merkezi kamerada tutar; odak etkinken uzak kamera derinlik isteği bastırılır.
- **Doğrulama:** Yedek kipte hazırlık sonrası oyuncu karoları 2 m çözünürlükte kaldı (hires 0 → 32), derinlik penceresi hedefte kaldı.

## 4.2b Yedek kipte kuyruk 'duruyor' görünümü (Aşama 2 teşhisi)
- **Belirti:** İşçiler öldürüldükten sonra 149 iş 12 sn boyunca hiç azalmadı; oyun oynanabilir ama uzak karolar gelmiyor.
- **Kök neden:** Yerel pompa tek şeritliydi; sırada bir **harita ızgarası** işi (256² = 65 536 nokta × yükseklik + biyom) vardı. 20 ms'lik dilimlerle, yazılımsal GPU'da 10 FPS çizen bir sayfada bu tek iş dakikalar alıyor ve arkasındaki tüm karo işlerini bloke ediyordu (mini harita 3 ayrı ayrıntı ızgarası istiyordu).
- **Düzeltme:** İki şerit (karo / uzun işler), ızgara sonuç önbelleği; tanı için `_lanes` ve 'öksüz iş' değişmezi testi.
- **Doğrulama:** Aynı senaryoda kuyruk 120 → 0 (12 sn), öksüz iş 0.

## 4.2c Tek dosya sürümünde işçiler hiç başlamıyor
- **Belirti:** `DenizKorsanlari-SonHazine.html` yerel diskten açıldığında arazi işçisi 0; v0.3'te bu, yükleme ekranında sonsuz bekleme demekti (4.1 ile birleşik).
- **Kök neden:** `file://` sayfasının kökeni `null`; Chromium `blob:null/…` adresinden Worker kurmayı reddediyor.
- **Düzeltme:** `file:` protokolünde işçi kaynağı `data:text/javascript` URL'si olarak verilir (her kökenden kurulur); http(s) altında blob sürer.
- **Doğrulama:** `02_tek_dosya.js` (file://): 3 işçi, oyun açılır.

## 4.3 Hızlı yolculuk sonrası gemi 800 m/s ile fırlıyor (E-01, kritik)
- **Belirti:** Limana hızlı yolculuk sonrası gemi kilometrelerce öteye savruluyor, oyuncu gemiyi bulamıyor.
- **Kök neden:** Gemi taşındığında `anchorPt` (eski çapa noktası) kalıyor; zincir uzunluğu aşıldığı için `(d - chain) * 1.6 * dt` çekişi kilometre mertebesinde hız üretiyor.
- **Düzeltme:** Taşıma yollarında `anchorPt = null`; `ship.js`'de çekiş sınırı ve zincir 3×+40 m aşılırsa yeniden demirleme (savunma).
- **Doğrulama:** `03_fizik_duzeltmeler.js` "Taşınan demirli gemi…": 1500 m taşınan gemi 3 sn'de 0.4 m hareket etti.

## 4.4 Fizik sonuçları kare hızına bağlı (D-02, D-08, D-15, D-16)
- **Belirti:** Zıplama tepe noktası 15 FPS'te 1.00 m, 60 FPS'te 1.18 m; kaçınma mesafesi %6 fark; geri tepme 10 FPS'te 2.6 kat.
- **Kök neden:** Değişken `dt` ile tek adım; kare başına sabit çarpanlar (`knock` toplanması, `vel*0.2`, `tauntT -= 0.016`).
- **Düzeltme:** Sabit alt adımlı döngü (≤1/60 s, en çok 6), dt ölçekli sabitler, kenar tetikleyiciler ilk alt adımda.
- **Doğrulama:** 15/30/60 FPS sonuçları birebir aynı (bkz. 05. belge).

## 4.5 Uzun görüş hattı her zaman "açık" (D-04 ve denetim bulgusu "64 hücre")
- **Belirti:** 40 m görüşlü düşman kalın duvar arkasındaki oyuncuyu görüyor; uzun mermi yolları engel saymıyor.
- **Kök neden:** `lineBlocked` sınır kutusu 64 hücreyi (16 m) aşınca `false` dönüyordu; uçlarda %2 pay mermi süpürmesinde boşluk bırakıyordu.
- **Düzeltme:** DDA hücre yürüyüşü (yalnız doğrunun geçtiği hücreler, uzunluk sınırı yok), mermi için `tMin=0, tMax=1, rScale=1`.
- **Doğrulama:** 400 m doğruda engel bulunur, boş doğruda bulunmaz; kutu içinden başlayan mermi parçası engellenir.
