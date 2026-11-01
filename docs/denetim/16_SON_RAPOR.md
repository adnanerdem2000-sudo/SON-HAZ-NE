# 16. Son Rapor — Kapsamlı Teknik Denetim, Hata Giderme ve Kalite Yükseltme (v0.3 → v0.4 geliştirme dalı)

> Bu belge 01–15. belgelerin özetidir; ayrıntı ve kanıt ilgili belgededir.

## 16.1 Kapsam ve kurallar
- Denetlenen sürüm: v0.3 (`762f1c7`, etiket `yedek-v0.3`); canlı GitHub Pages sürümü, ana dal ve kökteki tek HTML dosyası **değiştirilmedi**.
- Tüm çalışma `claude/denetim-v0.4` geliştirme dalında (çalışma ağacı `claude/denetim-v0.4-w2` üzerinden itildi). Canlıya alma kararı ve
  dalın yayın dalıyla birleştirilmesi kullanıcıya bırakıldı (16.7).
- Yöntem: her aşama kendi testlerini geçmeden sonrakine geçilmedi; her düzeltme önce/sonra ölçümüyle raporlandı; test edilmeyen hiçbir
  şey test edilmiş gibi yazılmadı (test edilemeyenler 16.6'da).
- Ortam: başsız Chromium + SwiftShader (**gerçek GPU yok**) — FPS donanım değeri değildir; çizim çağrısı/üçgen/kaynak sayaçları ve CPU
  benzetim maliyeti ölçüldü. Bellek cgroup sınırı: aynı anda birden çok ağır tarayıcı OOM ile çökebildi (tek tarayıcı kuralı).

## 16.2 Aşamalar ve sonuçlar (özet)
| Aşama | Konu | Başlıca düzeltmeler | Test | Belge |
|---|---|---|---|---|
| 1 | Denetim, yedek, test ortamı | 8 alan grubu: 147 hata iddiası (142 doğrulandı, 3 çürütüldü, 2 belirsiz; önem: 2 kritik, 17 yüksek, 45 orta, 78 düşük) + doğrulayıcıların 51 ek bulgusu; statik + çalıştırarak çift mercek (kapsam 16.6) | — | 01, 02 |
| 2 | Arazi işçisi yedeği ve yükleme kurtarma | işçisiz/çöken işçide takılma, hazırlık odağı LOD düşürmesi, tek dosya sürümünde işçi | `02_*` 4 kip + kurtarma + file:// | 03, 04 §4.1–4.2c |
| 3 | Fizik, çarpışma, gemi | sabit alt adım, DDA görüş hattı (64 hücre), 3 geçişli çözüm, gülle süpürmesi, hızlı yolculuk 800 m/s | `03_fizik_dt` (kare hızı farkı %6,4 → %0,9), `03_fizik_duzeltmeler` 13 | 05 |
| 4 | Karakter, animasyon, IK, kamera | yüzme kaldırması, meşgul iptali, kamera çarpışması, dümen/top IK, histerezisler | `04_karakter` 20 | 06 |
| 5 | Düşman AI, boss | sersemlik/çağrı iptali, grup sayaçları, kaçınma, LOD, lav/uzak oyuncu | `05_dusman_ai` 19 | 07 |
| 6 | Co-op, kayıt, kalıcılık, arayüz | mesaj doğrulama/oran/boyut, altın bütçesi, ganimet/sandık eşitliği, yüzen nesneler, kalp atışı, ada/tehlike kalıcılığı, Ctrl+W, 960×540 | `06a` (3 oyuncu), `06a2`, `06b` (2 oyuncu), `08_kalicilik` 13, `07_ekonomi`, `06_arayuz_960` | 08, 09, 13 |
| 7 | Dünya ve keşif | kıyı dikişi (tüm şekiller, 1 mm metriği 433 → 0), iskeleye sudan çıkış (merdiven + yüzme zemini), liman barınağı, adacık özellikleri (determinizm korunarak) | `07_dunya_kesif` D01–D08, Node determinizm | 15 |
| 8 | Performans ve sızıntılar | karakter/hayvan/tehlike/hava/olay kaynakları bırakılır (düşman döngüsü +97 doku → 0), oluşturucu/harita dinleyicileri, ölçüm altyapısı | `09_performans`, `11_arayuz_sizinti` | 10 |
| 9 | Uzun oturum, tam regresyon, tek HTML, son rapor | HUD her karede DOM yazıyordu (dümende 90 sn'de 58 636 → 784 düğüm); ganimet kesesi, kazı çukuru, gemi ve boss GPU kaynakları bırakılmıyordu (gemi başına 80 geometri); uzun benzetim yönteminin bellek sınırı (gc teslimi) | `10_uzun_oturum` 5/5, `12_kayit_dongusu` 4/4, 4 oyunculu co-op 7/7, tam regresyon 25 koşu (12. belge), tek dosya file:// 4/4 | 08, 09, 10, 12, 16 |

## 16.3 Belgeler (docs/denetim/)
01 İlk denetim raporu · 02 Hata listesi (kanıtlı) · 03 Dosya düzeyinde değişiklik listesi · 04 Kök nedenler · 05 Fizik/gemi testleri ·
06 Animasyon/savaş testleri · 07 AI/boss testleri · 08 Co-op testleri · 09 Kayıt testleri · 10 Performans karşılaştırması · 11 Bilinen sorunlar ·
12 Test planı ve sonuçları (19 senaryo) · 13 TURN ve oda sahibi devri tasarımı · 14 Yol haritası · 15 Dünya/keşif testleri · 16 Son rapor.

## 16.4 Commit geçmişi (geliştirme dalı)
Taban `34977c5` (Aşama 1 belgeleri) üzerine, eskiden yeniye (Aşama 9 commit'i son adımda eklenir):
- `903abe2` Aşama 2: arazi işçisi yedeği — ana iş parçacığı fallback, zaman aşımı/yeniden deneme, odak koruması
- `463d01f` Aşama 2 (devam): iki şeritli yerel üretim, ızgara önbelleği, odak birleştirme, file:// işçisi
- `3f8d547` Aşama 3: sabit alt adımlı döngü, DDA görüş hattı, süpürmeli mermiler, çapa/çarpışma düzeltmeleri
- `57e7816` Denetim belgeleri: değişiklik listesi, kök nedenler, fizik testleri, bilinen sorunlar; ara doğrulama raporu
- `0ab6977` Aşama 4: karakter hareketi, animasyon, IK ve kamera düzeltmeleri
- `4f4fa9d` Aşama 5: düşman AI ve boss düzeltmeleri (tek oyunculu mantık)
- `20a6c96` Aşama 6: ağ katmanı — konuk mesajı doğrulama, güvenlik, ganimet/sandık eşitliği, yüzen nesne ve düşman/gemi senkronu
- `8616d08` Aşama 6: giriş ve arayüz — eğilme tuşu Sol Ctrl→C, küçük pencere düzeni, takvim metni, işlevsiz seçenek
- `0526ef4` A grubu: motor/ayarlar/varlık yükleme/kayıt doğrulama/konuk ilerlemesi
- `e73d142` Aşama 6: kalıcılık ve ekonomi — ada ödülleri/tutsaklar/tapınak, patlamış fıçı/kırık sandık, al-sat döngüsü
- `7a68983` Aşama 6 testleri ve belgeleri: co-op (2/3 oyuncu), kalıcılık, ekonomi, 960×540 arayüz; 08/09/10/12/13/14 belgeleri
- `e1978a8` Aşama 7: kıyı dikişi, iskeleye sudan çıkış, adacık ayırt edilebilirliği (20×20 km korunur)
- `e1b16f3` Aşama 7 testleri ve belgeleri: 07_dunya_kesif (D01–D06 önce/sonra), Node determinizm testi + v0.3 sabiti, 15. belge (karşıt inceleme), 03/04/11/12/14, görseller
- `6a4a6d7` Aşama 7 devam: bataklık/atol kıyı dikişleri ve liman barınağı (yerel dalga sönümü)
- `1c9b6f9` Aşama 7 devam testleri ve belgeleri: D02b (1 mm dikiş), D03 faz taraması + sağanak, D07 barınak, D08 bekleme; inceleme bulguları R6–R11, bayat belge değerleri düzeltildi
- `ac8f452` Aşama 8: GPU kaynak ve dinleyici sızıntıları (B14, B-09, H23, H24)
- `2e2a1f6` Aşama 8 testleri ve belgeleri: 09_performans (sayaç düzeltmesi, sızıntı döngüleri), 11_arayuz_sizinti; 10. belge ölçümleri
- `dbf50ab` Aşama 9: HUD DOM yazımları değişiklik algılamalı; kese/çukur/gemi/boss GPU kaynakları bırakılır
- `3bfb7b8` Aşama 9 testleri ve belgeleri: uzun oturum (bellek teşhisi), 3 kayıt döngüsü, 4 oyuncu, tam regresyon ve test düzeltmeleri

## 16.5 Bilinen sorunlar ve ertelenenler
11. belgedeki açık maddeler (özet): 19 açık madde:
- #1 120 FPS'te zıplama tepe noktası ≤%3 farklı — Açık (düşük)
- #2 Gemi hız/dönüş testi koşular arası ±%4 oynar — Açık (test)
- #3 Yedek (işçisiz) kipte uzak bölge hazırlığı ağır CPU yükünde 45 s sınırına ulaşabiliyor — Açık (orta)
- #4 Yuvarlanan kaya ezmek üzere olduğu fıçı/sandıktan önce sekiyor (D-11) — Açık (düşük)
- #5 Güvertedeki oyuncu kalabalık itişmesinde ajan değil (D-20) — Açık (düşük)
- #6 Deniz bossları arazi kontrolü yapmıyor (D-19) — Açık
- #7 Gemi gövdesi kamera çarpışmasına dahil değil — Açık (düşük)
- #8 Kürek/sandık için el IK hedefleri yok — Açık (düşük)
- #10 Yedek (işçisiz) kipte ana iş parçacığı üretimi 60 FPS'lik gerçek makinede kare süresini uzatır (dilim 10–20 ms… — Açık (tasarım)
- #11 F-09 geniş engel dolaşma: yalnız statik doğrulandı — Açık (test)
- #12 Boss savaşları (Kraken/Yılan/Taş Muhafız/Volkanik Dev/Amiral) bu ortamda uçtan uca oynanmadı — Açık (test)
- #13 Ambar içeriği (`hold`) konuk tarafından bildirilir; ev sahibi sınır/yakınlık doğrular ama tam ev sahibi otorit… — Açık (orta)
- #14 Taş Muhafız rün sütunları konukta oluşmuyor (ek-108) — Açık (orta)
- #15 Düşman telgraf halkaları ve iniş işaretleri konukta görünmüyor (mermiler görünüyor) — Açık (düşük)
- #16 Ambardaki sandığı ev sahibi ve konuk aynı anda satabilir (B16) — Açık (düşük)
- #17 Ana menü 'DEVAM ET' online kayıt yuvasını taşımıyor (H18) — Açık (düşük)
- #19 Yuvarlanan kaya durumu kaydedilmiyor (yüklemede yeniden kurulur) — Açık (düşük)
- #22 Otomatik adacık özellikleri yalnız şekle göre seçilir (arazi sorgusu `archipelago.js` içinde yapılamaz: `geo.j… — Açık (düşük, çeşitlilik)
- #23 Yalnız ana limanda denize inen merdiven var; yeni liman iskelelerine (ports.js) sudan çıkış yok (B-07'nin ikin… — Açık (orta)

## 16.6 Test edilemeyen / sınırlı doğrulananlar (dürüst kapsam)
- Gerçek GPU'da FPS, gölge/son işleme kalitesi, ses ve kontrol hissi: el ile oynanış gerekir.
- Gerçek ağ gecikmesi/paket kaybı ve farklı ağlardan bağlantı (TURN): yerel PeerJS sunucusuyla doğrulanamaz (13. belge tasarım).
- Aşama 1 çift mercekli doğrulama kapsamı: statik mercek 8/8 grup (D_fizik ve H_coop_ui Aşama 9'da tamamlandı), çalıştırarak mercek A/B/E grupları; C/D/F/G/H
  grupları için çalıştırarak doğrulama yapılmadı (bellek sınırı nedeniyle durduruldu); bu grupların iddialarının çoğu Aşama 3–8
  testleriyle dolaylı olarak sınandı (02. belgede her maddenin durumu).
- Denetim sırasında bir yanlışlık: 31 Ekim 21:43–22:20 arasında bir yama betiğinin "kuru çalıştırması" ana çalışma ağacındaki iki
  dosyayı (input.js, game.js) geçici olarak değiştirdi ve geri alındı; bu pencerede koşan Aşama 1 E/B grubu çalıştırma doğrulamaları
  etkilenmiş olabilir (ilgili iddialar sonraki aşama testleriyle yeniden sınandı).
- Uzun oturum 30 dk oyun zamanını `DK.sim` ile hızlandırarak koşar (gerçek 30 dk değil); alt dilimler arasında olay döngüsüne teslim
  edilip `gc()` çağrılır (`--expose-gc`). Gerçek zamanlı yalnız 3 dk ölçüldü (bellek düz). Gerçek bir 30+ dk oynanış el ile önerilir.
- 04_karakter ve co-op senaryoları gerçek zamanlı çizimi kısarak (mantığı `DK.sim` ile) sınar; yazılımsal GPU'da kalabalık
  sahne kareleri saniyeler sürdüğü için çizim performansı bu ortamda ölçülemez (10. belge).
- 06b F-06 kontrolünde nişancının doğal atışı bu ortamda iki koşuda da gelmedi; mermi görselinin konuğa aktarımı ev sahibinde
  oluşturulan mermiyle doğrulandı. Nişancının ateş kararı 05_dusman_ai senaryosunda ayrıca sınanır.
- Ses, dokunmatik/gamepad girişi ve farklı ekran oranları (1366×768, 1920×1080) el ile denenmedi; arayüz yalnız 640×360 ve 960×540'ta
  otomatik sınandı.

## 16.7 Yayın önerisi ve sonraki adımlar
- Geliştirme dalı canlıya alınmadan önce: gerçek GPU'da el ile oynanış turu (16.6), kayıtlı v0.3 oyunlarıyla yükleme denemesi,
  2–4 oyunculu gerçek ağ denemesi. Yayın için `claude/denetim-v0.4` dalının `claude/hopeful-cray-o1jw6w` (canlı) dalına
  birleştirilmesi ve tek dosya sürümünün (`dist/`) kökteki dosya yerine konması gerekir — **bu adımlar kullanıcı onayı bekler**.
- Yol haritası: 14. belge.
