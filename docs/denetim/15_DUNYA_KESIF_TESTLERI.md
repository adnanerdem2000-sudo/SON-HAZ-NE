# 15. Dünya ve Keşif Kalitesi Testleri (Aşama 7)

Kapsam: 20×20 km dünya korunarak üç kalem ele alındı — kıyı çizgisi süreksizliği (B-05), iskeleye sudan çıkış (B-07) ve
özelliksiz yordamsal adacıklar (ayırt edilebilirlik). Her kalem için önce taban sürümde (v0.3 `762f1c7` + Aşama 1 belgeleri,
`http://localhost:8080`) ölçüm alındı, sonra geliştirme dalında (`http://localhost:8081`) aynı senaryo koşturuldu.
Senaryo: `tests/scenarios/07_dunya_kesif.js` (640×360, yazılımsal GPU; sonuçlar çizimden bağımsız sayısal ölçümlerdir).

## 15.1 Sonuç tablosu

| # | Kontrol | Önce (taban) | Sonra (v0.4 dalı) |
|---|---|---|---|
| D01 | Dünya yarı boyutu 10 km (20×20 km korunur) | GEÇTİ (10000) | GEÇTİ (10000) |
| D02 | Dik olmayan 54 adacıkta su çizgisi yakınında (|h| < 1 m) 0,25 m adımda yükseklik sıçraması ≤ 0,40 m | KALDI: 81 sıçrama > 0,40 m, en kötü 0,71 m (`buzdisi`, glacier) | GEÇTİ: 0 sıçrama (ilk yamada en kötü 0,356 m `ada_volkan_0` — otomatik harabe kaidesinin ürünüydü, §15.7; düzeltme sonrası Node 72 ışın: en kötü 0,251 m) |
| D03 | Yüzen oyuncu üç gelgit (−0,55 / 0 / +0,55 m) × iki dalga fazında iskele merdiveninden T başlığına çıkar | KALDI (3/3 gelgit): oyuncu güverte altına kadar yüzdü, yüzmede kaldı (x 17,4; y −1,98 / −1,15 / −0,52) | GEÇTİ (3 gelgit: 3,75–4 sn'de güvertede); 6 koşulu nihai sürüm §15.7'de |
| D04 | Her yordamsal adacıkta en az bir geçerli belirleyici özellik | KALDI: 67 adadan 22'si özelliksiz | GEÇTİ: 0 özelliksiz; 22 adacığa havuzdan özellik (13 harabe, 5 batık, 2 fener, 2 mezarlık) |
| D05 | Havuz özellikli 6 adacık çalışma zamanında hatasız kurulup sökülür | — (özellik yok) | GEÇTİ: 6/6 kuruldu, `console.error` 0, 1–7 ms |
| D06 | Otomatik özellikler araziye uygun (yapı çevresi 10 m'de arazi ≥ 1 m, batık merkezi ≥ −0,6 m) | — | §15.7 (inceleme sonrası eklendi) |

Konsol/sayfa hatası: 0 (her iki koşu). Not: ilk taban koşusu testin tek-metrikli ilk sürümüyle yapıldı (182 sıçrama, en kötü 1,55 m);
yukarıdaki "önce" sütunu nihai test dosyasının taban sürümde yeniden koşturulmasıyla alındı (`/tmp/p7/once2.json`).

## 15.2 Kıyı çizgisi dikişi (B-05)

Ölçüm yöntemi: her adacık çevresinde 8 ışın, merkezden 0,6·r → 1,6·r arası 0,25 m adımla `terrain.heightAt` (karo yoksa
analitik `computeHeight`; aynı kod işçide ve ana iş parçacığında). Su çizgisine yakın (|h| < 1 m) ardışık örnekler arasındaki
yükseklik farkı kaydedildi. `swamp` ve `atoll` şekilleri tasarım gereği dik kıyılıdır (sürekli rampa, 0,25 m'de 1,5 m'ye kadar
yükselir) ve ayrı sayıldı.

| Küme | Önce: >0,40 m sıçrama / en kötü | Sonra: >0,40 m sıçrama / en kötü |
|---|---|---|
| 54 adacık, dik olmayan şekiller (tarayıcı; önce 64 653 / sonra 63 851 örnek) | 81 / 0,71 m | 0 / 0,356 m |
| 13 adacık, swamp/atoll (tarayıcı, 11 120 örnek) | 101 / 1,55 m (`ada_tropik_0`) | 86 / 1,55 m (en kötü değer değişmedi: tasarım eğimi; 15 dikiş sıçraması kalktı) |
| Tüm 73 ada (Node, 16 ışın, 139 k örnek), dik olmayan 60 | 188 / 0,727 m | 4 / 0,485 m |
| Tüm 73 ada, swamp/atoll 13 | 203 / 1,662 m | 171 / 1,662 m |

Kök neden ve düzeltme: `geo.js` ada yükseklik fonksiyonunda d ≥ 1 (kıyı dışı) dalı `fbm·0,9·(1−t)` ile başlıyordu; d → 1⁻
tarafında kumsal ve tepe terimleri 0'a iner. Böylece tam kıyı çizgisinde ±0,9 m'lik bir basamak halkası oluşuyordu. Gürültü
terimi `smoothstep(1.0, 1.3, d)` ile kıyıdan sıfırlanarak açılır. İlk yamada bant 1,12·r idi; karşıt inceleme (§15.7) bunun
kıyı ötesinde pozitif gürültüyü su üstüne çıkarıp kum setleri bıraktığını buldu (72 ışın × 60 ada Node taraması: su hattını
geçtikten sonra yeniden kara çıkan ışın oranı taban %29,8 → 1,12 bandı %15,9 → 1,3 bandı %0,14). İlk yamadaki "kalan 4
sıçrama ana adalarda" atfı yanlıştı: hepsi otomatik harabelerin volkan adacıklarındaki düzlük kaidesindendi; düzeltme sonrası
72 ışınlı taramada dik olmayan 60 adada >0,40 m sıçrama 0, en kötü 0,251 m. swamp/atoll dik profili ayrı bir tasarım
kararıdır (11. belge #21).

## 15.3 İskeleye sudan çıkış (B-07)

İki kök neden bulundu:
1. `player.js` `_updateSwim`: yüzme zemini yalnız `terrain.heightAt` ile alınıyordu; platformlar (iskele, basamak, batık taş)
   yüzen oyuncu için yoktu. Bu yüzden hiçbir basamak/iskeleye sudan çıkılamıyor, oyuncu basamağın içinden geçiyordu.
   Düzeltme: `physics.groundAt(x, z, pos.y, 0.6)` — yürüme kipiyle aynı 0,6 m basamak kuralı.
2. Ana liman T başlığında denize inen merdiven yoktu. Doğu kenarına 10 basamaklı taş merdiven eklendi: su altı basamakları
   0,3 m (−1,8 → −0,6 m), su üstü 0,55 m (−0,05 → 2,15 m), güverte 2,25 m. Tasarım kısıtı: yüzen oyuncunun ayağı su yüzeyinin
   1,35 m altındadır; gelgit ±0,55 m ve dalga ile ayak −2,3…−0,4 m arasında değişir; her fazda ayak hizasının 0,6 m içinde bir
   basamak bulunur ve bir basamağın yan yüzü (üst−1,0…üst−0,6) oyuncu gövdesine çarpmaz.

Koşu geçmişi (test etmeden tamamlandı denmedi):
- 1. koşu (6 basamak, en alt −0,9 m): oyuncu x 23,85'te takıldı — dalga çukurunda ayak −1,54 m, en alt basamağın yan yüzü
  (−1,9…−1,5) gövdeye çarpıyor; basamak 0,6 m penceresinin dışında.
- 2. koşu (9 basamak, en alt −1,5 m): x 24,55, y −1,74 — oyuncu basamağın içinde yüzüyor; `_updateSwim` platformları
  görmüyordu (kök neden 1).
- 3. koşu (kök neden 1 düzeltildi): GEÇTİ, 3,75 sn'de güvertede. Gelgit genliği (±0,55 m) ölçüldükten sonra −1,8 m basamağı
  eklendi; nihai koşu 15.1'de.

## 15.4 Adacık ayırt edilebilirliği

`archipelago.js` yordamsal adacıklarda kamp/harabe/mezarlık yalnız yarıçap > 80–90 m'de, batık %35 olasılıkla üretiliyordu;
22 adacık (çoğu 55–80 m) tamamen boştu ve birbirinden ayrılamıyordu. Her özelliksiz adacığa bölgeye göre bir özellik eklendi:
merkez fener/harabe/batık, buzul harabe/batık/kamp, tropik harabe/batık/fener, volkan maden/harabe/batık, çöl maden/harabe/kamp,
hayalet mezarlık/harabe (küçük adada kamp/maden → harabe; atolde özellik halkaya, 0,62·r). Seçim adacığın konumundan tohumlanan
ayrı bir `rng` ile yapılır: ana rastgele akış değişmez, 67 adanın konumu/şekli/tohumu ve mevcut özellikleri Node ile taban
sürümle birebir karşılaştırıldı (67/67 aynı). Yeni özellikler `auto: true` ile işaretlidir (test/teşhis için).

## 15.5 Görsel doğrulama
Ekran görüntüleri (yazılımsal GPU; ilk ikisi 960×540, diğerleri 800×450 — 960×540'ta ikinci tarayıcı bellek cgroup sınırında
öldürüldü, kalanlar tek başına alındı): `docs/denetim/gorseller/`
- `07_merdiven_sudan.jpg`: doğudan bakış; taş merdiven T başlığının kenarından suya iner, üst basamak güverteyle hizalı, demirli gemiyle çakışma yok.
- `07_merdiven_guverteden.jpg`: güverteden bakış; üst basamak T başlığının doğu ucunda görünür, babalar/kazıklarla çakışma yok.
- `07_merdiven_yandan.jpg`: yandan; su üstü 5 basamak görünür, su altı basamaklar opak su altında (tasarım gereği görünmez).
- `07_adacik_kiyi_buzul0.jpg`: `ada_buzul_0` kıyısı; kumsal–deniz geçişinde set/çukur halkası yok, harabe duvarları ağaçlar arasında seçiliyor.
- `07_adacik_harabe_buzul0.jpg`: havuzdan eklenen harabe (biyom tonlu duvarlar) adacığın ortasında açıklıkta; yerleşim ve ölçek uygun.

## 15.6 Regresyon
Aşama 7 kodu ile tek oyunculu regresyon (640×360): `07_dunya_kesif` 6/6, `00_acilis` 6/6, `03_fizik_duzeltmeler` 14/14,
`04_karakter` 21/21 (yüzme kaldırması/mod histerezisi dahil), `05_dusman_ai` 18/18, `08_kalicilik` 12/12; sayfa hatası 0.
Yüzme zemini değişikliği (`groundAt`) yüzme/dalış kontrollerini bozmadı; co-op senaryoları bu değişiklikten etkilenmez (uzak
oyuncu konumu ağdan gelir), Aşama 9 tam regresyonunda yeniden koşturulacak.

## 15.7 Karşıt inceleme (iş akışı: 4 mercek, tarayıcısız) ve düzeltmeler
Aşama 7 farkı dört bağımsız inceleyiciye (fizik/yüzme, arazi/determinizm, liman/oynanış, test kalitesi) verildi; iki mercek
somut, Node ile kanıtlanmış bulgular döndürdü. Bulgular bağımsız olarak doğrulandı ve düzeltildi:

| # | Bulgu (inceleyici) | Doğrulama | Düzeltme |
|---|---|---|---|
| R1 | Merdiven taş kolonları deniz tabanına (−9 m) kadar dolu çiziliyor, çarpıştırıcı yalnız platformun [üst−1,0, üst−0,6] bandı: yüzücü T başlığı altından doğuya yüzünce üst basamakların taşına giriyor, dalgıç tüm kolonlardan geçiyor, içeride yüzeye çıkınca 0,75 m fırlıyor (orta) | Kod yolu: `physics.addPlatform` sides=true → `addBox(top−1, top−0.6)`; liman kanalı arazi −8,9…−9,0 m | Basamaklar `addPlatform(..., 'pier', false)` + taban→üst−0,6 tam yükseklik `addBox`; basamak penceresi (üst 0,6 m) korunur |
| R2 | Liman kanalı 9 m derin → dalga sönümsüz (±1,1 m): su hattındaki basamakta duran oyuncu dakikada 7–17 kez yüzme/yürüme kipi değiştirir; "en alt basamak her fazda erişilir" iddiası gelgit −0,55'te %7–35 yanlış (düşük) | Eşikler player.js 568/698; `shoreFactor` derinlik 9 m'de ≈ 1 | Platform üzerinde su girişi 0,3 m daha derin ve 0,5 s süreklilik ister (`_wetT`); merdivene −2,1 ve −2,4 m basamaklar eklendi (en düşük gelgit + dalga çukurunda ayak −3,0 → 0,6 m penceresinde) |
| R3 | Otomatik batıkların `yaw: R()` çağrısı paylaşımlı `rng(4321)` akışını tüketiyor → 44 adacıkta 55 kazı noktası/ipucu ve 12 batık yönü sessizce değişti; v0.3 kaydındaki hazine haritası başka yeri gösterir (orta) | Node: `EXTRA_DIG_SITES` 111 kayıttan 55 farklı (ortalama kayma 58 m) — doğrulandı | Otomatik özelliklerde yaw için konumdan tohumlanan ayrı `rng`; Node testi `tests/node/archipelago_sabit.mjs` v0.3 sabitiyle (kazı/balık/boss dizileri birebir; batık/POI/düzlük kimliğiyle aynı) → GEÇTİ (67 ada, 22 otomatik özellik; eklenen: 14 batık, 22 POI, 8 düzlük) |
| R4 | Otomatik yerleşim araziyi denetlemiyor: volkan adacıklarında 24+18 m düzlük 27–30 m'lik kaideyle denize iniyor (D02'nin kalan sıçramaları), iki fener bataklık çukuru kenarında, bir batık suda (orta) | Node profil: `ada_volkan_0` düzeltilmiş yükseklik 48 m'de 27,3 m, en dik iniş 67° — doğrulandı | Dik/çukurlu şekillerde (volcano, spire, swamp) kıyı özelliği (batık) seçilir; mezarlık yalnız r ≥ 100; batık 0,82·r; küçük adacıkta (r < 110) düzlük yarıçapı `min(rr, 0,22·r)`, geçiş `min(18, 0,12·r)`. Arazi sorgusu `archipelago.js` içinde yapılamaz (`geo.js` bu modülü içe aktarır); yeni D06 kontrolü yerleşimi tarayıcıda doğrular |
| R5 | Kıyı bandı 1,12·r kıyı ötesinde 0,3–0,43 m kum setleri bırakıyor (not) | Node: ışınların %15,9'u | Bant 1,3·r (%0,14) |

İnceleme sonrası otomatik özellik dağılımı: 14 batık (atol 1, normal 3, spire 5, swamp 2, volkan 3), 8 harabe (normal 6, glacier 1,
mesa 1); fener/mezarlık seçilmedi (küçük adacıklar). Çeşitlilik için arazi-farkında yerleşim (ada kurulurken `terrain.heightAt`
ile aday seçimi) yol haritasına eklendi (14. belge).

Düzeltme sonrası koşular: Node determinizm testi GEÇTİ; tarayıcı D01–D06 ve regresyon (04 karakter, 03 fizik) sonuçları:
- `07_dunya_kesif.js` 7/7 GEÇTİ: D02 dik olmayan 54 adacıkta sıçrama 0 (en kötü 0,251 m, `kara_girdap`), D03 6/6 koşu (gelgit
  −0,55/0/+0,55 × dalga fazı; en düşük su hattı −1,05 m dahil) 3,5–3,75 sn'de güvertede, D04 0 özelliksiz, D05 6/6 kuruldu,
  D06 22/22 otomatik özellik araziye uygun; sayfa hatası 0.
- Regresyon: `04_karakter` 21/21 (yüzme kaldırması, mod histerezisi, kayık/biniş), `03_fizik_duzeltmeler` 14/14; sayfa hatası 0.
- Görsel: merdiven 12 basamakla yeniden çekildi (`gorseller/07_merdiven_sudan.jpg` güncel).

