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
- `e56f49a` Son rapor: Aşama 9 commit kimlikleri
- `105acd8` Donma denetimi: ada içeriği karelere bölünerek kurulur; balık sürüsü çöpsüz; tapınak durumu korunur (16.8)
- `3b4f28d` İnceleme sonrası düzeltmeler: çift kurulum koruması, aynı karede LOD, lav düzeyi; harness istisnayı başarısızlık sayar (16.8)

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

## 16.8 Ek: Donma ve FPS denetimi (Aşama 9 sonrası kullanıcı sorusu)
Soru: "Oyunda donma oluyor mu, yeterli FPS alınıyor mu?" Ayrıntı: 10. belge §10.8–10.9; kalıcı test `13_donma.js` (P01–P08).
- **Ölçülebilen**: oyun mantığının kare maliyeti (60 Hz tempo), tek seferlik işler, çizimin ana iş parçacığı maliyeti (izleme kaydı,
  iş parçacığı işlemci süresi), uzun karelerin nedeni (çöp toplama / işlemci beklemesi / kod), V8 çöp toplama günlüğü, ayırma profili.
  **Ölçülemeyen**: ekran kartındaki çizim süresi, yani gerçek FPS (bu ortam yazılımsal GPU).
- Oyun mantığı karede ortalama ~1,4 ms (p99 5–12 ms). Çizimin ana iş parçacığı maliyeti (2,3 GHz sanal Xeon): liman ~10,9 ms
  (1 022 çağrı), orman adası ~4,3 ms, açık deniz ~3,5 ms → en ağır sahnede bile toplam ~12,5 ms < 16,7 ms (60 FPS bütçesi), pay az.
- **Bulunan tekrarlanabilir donma — giderildi**: ada içeriği tek karede kuruluyordu (gemiyle yaklaşırken 55–58 ms, ışınlanmada 142 ms;
  Ateş Dağı gibi büyük adada ~80 ms). Kurulum karelere bölündü (3 ms/kare): 7–19 kareye yayılıyor, karedeki ada işi 6–11 ms, adanın
  tamamlandığı kare (tehlike seti dahil) 2,5–3,7 ms; 67 adada içerik eskisiyle birebir aynı.
- Kalan seyrek uzun kareler (130 sn rotada > 12 ms olan 13 kare): 9'u V8 çöp toplama (büyük toplama ~5–10 sn'de bir, bu ortamda tek
  karede tipik 7–12 ms), 4'ü bu test makinesinin işlemci çekişmesi. Balık sürüsü güncellemesinin çöpü %64 azaltıldı (simülasyon bit
  düzeyinde aynı); uçtan uca toplama sayısındaki düşüş ölçüm gürültüsü içinde kaldı; kalan ayırıcılar yol haritasında (#15).
- Ayar ön tanımları: düşük ayar limanda çizim çağrısını %26, üçgeni %53 azaltır; orta ayar çağrı sayısını değiştirmez (10.9.1).
- **Bağımsız kod incelemesi** (4 açı, her bulguya çürütme amaçlı doğrulayıcılar, eksiklik eleştirmeni; 14 ajan):
  - Önceden var olan bir ilerleme engeli bulundu ve düzeltildi: Kadim Tapınak bulmacası ada yeniden kurulunca/kayıt yüklenince
    bozuluyordu (levye hatası, kapı kapanıyor, Taş Muhafız tetiklenmiyor; 02. belge T05, P08).
  - Doğrulanan test tasarımı sorunu: P03/P04/P06 yarım işi saat süresine bağlıyordu → adım sayısına bağlandı. Eşzamanlı yolun hata
    temizliği, çift kurulum koruması, tamamlanan adanın aynı karede LOD'u, Volkanik Dev lav düzeyinin sonradan güncellenmesi eklendi.
  - Test altyapısı sıkılaştırıldı: `js` adımı istisnası artık başarısızlık. v03 referans senaryoları eski/yeni A/B: 21'in 20'si iki kodda
    temiz; boss1'deki istisnaların oyuncunun rastgele ölümüne bağlı olduğu ve eski kodda da oluştuğu gösterildi, senaryo düzeltildi.
- **Önceden var olan, bu turda değiştirilmeyen iki davranış** (ölçümle doğrulandı, eski ve yeni kodda aynı):
  - Ada yerleşimi kurulum anındaki arazi ayrıntı düzeyine bağlı: yaklaşırken ve yüklemeden sonra kurulan ada arasında bitki örtüsü, NPC
    adları ve tapınak levye sırası farklı olabiliyor (bilinen #35, yol haritası #19). Kalıcı kimlikler etkilenmez; yarım levye dizisi artık
    kurulumlar arasında taşınmıyor.
  - Kumsalda ~1,4 m derinlikte dalga, yüzme↔yürüme kipini 4 sn'de 2–3 kez değiştirebiliyor; `03_fizik_duzeltmeler` "sığ su bandı"
    kontrolü 30 dalga anının 7'sinde kalıyor (bilinen #33, yol haritası #18).
- Öneri: gerçek makinede Ayarlar → "FPS göster" ile liman, seyir, fırtına ve savaş sahnelerinde el ile kontrol; düşük FPS'te gölge ve
  görüş mesafesi ilk düşürülecek ayarlardır. Gölgelendiriciler başlangıç sahnesi için yüklemede önceden derleniyor; sonradan görünen
  içerik ilk görüldüğünde derleniyor (gerçek GPU'da oturumda bir kez kısa takılma olabilir; bilinen #31).

## 16.9 Ek: İskele/duvar, kamera kararması, dalış, deniz ekipmanı (kullanıcı bildirimi)
Bildirim: başlangıç iskelesinde gövde tahtanın içinde ("duvarların içine giriyorum"); kamerayı çevirince "arkama duvar
geliyormuş gibi" siyah ekran; dalış ve sınırlı nefes; zıpkın/olta/ağ gibi deniz ekipmanı ganimeti ve balık tutma; duraklatma
menüsünde "null" yazısı. Ayrıntı: 03. belge (son bölüm), 12. belge (önce/sonra tablosu), 11. belge #38–#43.
- **Önemli:** kullanıcının oynadığı yayındaki sürüm v0.3'tür (`claude/hopeful-cray-o1jw6w` @ 762f1c7). Orada iskele yan
  çarpıştırıcısı ve kamera görüş testi hiç yok, dalış tuşu Sol Ctrl (Ctrl+W sekmeyi kapatır). Düzeltmeler geliştirme dalında ve
  `dist/` tek dosyasındadır; yayına alma kullanıcı onayı bekler.
- **İskele (kök neden ölçüldü):** liman kanalı kazısı kumu iskele kökünde 1,49 m'ye indiriyordu → 0,76 m basamak (sınır 0,6).
  Kök kumla aynı hizaya uzatıldı (z0−9, basamak 0,27 m), sığ kesimin altı tam yükseklikte kapatıldı, direk/baba çarpıştırıcıları
  eklendi, havada duran yük yığını kuma indirildi, varil malzemesi düzeltildi. Ada limanlarında aynı kural (≤ 12 m uzatma + gerekirse
  ≤ 0,5 m'lik basamak; 5 limanın 4'ünde uzatma yeterli, Kuzey Fener'de 1 basamak); karaya oturmuş gemi çarpıştırıcısı gövdeyle hizalandı.
- **Kamera (kök nedenler ölçüldü):** (1) kamera iskele güvertesinin/gemi gövdesinin altına iniyordu (96 açının 61'inde, görüntü
  parlaklığı 3,5) → güverte düzlemi görüşü keser, üzerinde durulan güverte zemin sayılır: 0/96, parlaklık ≥ 93; (2) iskele feneri
  gibi ince engeller kamerayı başın 0,56 m dibine çekiyor, siyah şapka ekranı kaplıyordu → ince/hareketli engeller yok sayılır: 4,6 m;
  (3) duvara yaslanınca kamera 0,4 m'de → karakter örgüleri gizlenir (meşale ışığı sönmez). Ek: su yüzeyi kararı odağa göre,
  dalışta kamera su altında, mağarada tavan.
- **Dalış:** zaten vardı (C basılı = dal, Boşluk = çık, nefes 50 sn, boğulma hasarı, nefes çubuğu) ama README "Ctrl" diyordu ve
  oyunda ipucu yoktu → ilk suya girişte tuş/nefes ipucu, README düzeltildi; dalış maskesi (nefes ×1,6), yüzme paleti (×1,35), hava
  kesesi (+45, nefes < 12'de kendiliğinden).
- **Deniz ekipmanı ve balıkçılık:** zıpkın (6; su altında ve kıyıdan nişanla, köpekbalığına hasar), yaylı zıpkın, balık ağı (7;
  sürüye en çok 6 balık, %5 yırtılma), olta (vardı; uçtan uca doğrulandı, mücadelede A/D oyuncuyu artık yürütmüyor — önce iskeleden
  suya düşüp balığı kaçırıyordu). Ganimet: Balıkçı Yusuf, Tüccar Rıza, Halil Reis, Kaçakçı; hazine/ada sandıkları, balıkçı varili,
  Martı Batığı'nın 24 m dibindeki sandık.
- **Test:** `15_iskele_kamera.js` düzeltme öncesi kodda 12 kontrolün 9'unda kaldı, son kodda hepsi geçti; `14_deniz_ekipmani.js`
  15 kontrolün hepsi geçti. Dar ekranda (640×360) 7 yuvalı araç çubuğu küçülüp mini haritanın soluna yaslanır (ekran görüntüsüyle doğrulandı).
- **Doğrulanamayan / sınırlı:** gerçek GPU'da el ile oynanış; gerçek fare ile nişan hissi (testte kamera yönü ve doğrudan yön
  verildi); co-op'ta zıpkın/ağ atışı diğer oyunculara çizilmez (balık sürüleri istemciye yerel, olta gibi; 11. belge #38).

## 16.10 Ek: Koşarken takılma, başını yere gömme, av eti ganimeti, yerden toplananlar çantaya (kullanıcı bildirimi)
Bildirim: "bazen karakter koşarken takılır gibi oluyor", "bazen karakter yere düşer gibi kafasını aşağı gömüyor", "hayvanları
öldürdükten sonra içlerinden etler vs. düşsün, çantamıza atabilelim", "yerden aldıklarımız çantamıza alınabilsin". Ayrıntı:
03. belge (son bölüm), 12. belge (önce/sonra tablosu), 11. belge #33 (kapandı) ve #44–#52.
- **Koşarken takılma (ölçülen nedenler):** (1) Shift basılıyken dayanıklılık bitince sprint 1,0–1,3 sn'de bir açılıp kapanıyor, hız
  7 ↔ 4,4 m/s kare kare sıçrıyordu → tükenme kilidi + yumuşak fren (K05: 16 sn'de 8 geçiş → 3, kare başı hız düşüşü 0,51 → 0,15 m/s);
  (2) yürü/koş/sprint eşiklerinde histerezis yoktu, dönüşte ve engel kenarında klip kare kare değişip baştan başlıyordu → histerezis +
  titreşim bastırma (K06, 04 C13); (3) engele çarpınca hız korunuyor, oyuncu yerinde koşuyordu → çarpışma sonrası hız izdüşümü;
  (4) görünmeyen/gömülü kaya çemberleri ve kalın ağaç çarpıştırıcıları → görsele göre küçültüldü; (5) kumsalda yüzme↔yürüme her
  dalgada değişiyordu (#33) → K01: 36 durumda en çok 1 geçiş (önce 2–6); (6) 0,9 m'lik inişte 0,3 sn iniş duraksaması → yalnız ≥ 1,8 m
  (K03); (7) koşan oyuncu ganimet kesesini 3 m fırlatıyordu (T07: 3,02 → 0 m). Ayrıca basamak yumuşatma, kamera sıyırma beklemesi,
  fare sıçrama süzgeci. **Açık kalan:** yeni harita karosu boyanırken bir kerelik takılma (yazılımsal GPU'da 100–650 ms, #45).
- **Başını yere gömme (kök neden ölçüldü):** three.js karıştırıcısı bir eylem etkinleşirken kemiğin o anki değerini "özgün" sayıyor;
  klibi o kemiğe iz yazmayan pozlarda (Idle'da omurga yok) çömelme/kürek/IK eğimi her karede üst üste biniyordu. Dururken C ile
  çömelince baş 3 sn'de −0,28 m'ye (yerin altına) iniyordu → 0,82–0,84 m'de sabit, ayağa kalkınca 1,15–1,17 m'ye döner. Ragdoll
  sonrası bağlama pozu bozuluyordu (yürüyüşte en düşük baş 0,35 m) → 1,06 m. Yüzme eğimi yüzme dışındaki her kipte sıfırlanır (P01).
- **Av ganimeti:** 15 kara hayvanı türü türüne göre et, post, diş, boynuz, tüy, deri, zehir kesesi düşürür; köpekbalığı et ve diş
  (önce boş tablo); maymunun kaptığı muz geri düşer; çiğ et yenebilir (Can +5…+12), handa ayrı seçenekle Kızarmış Et (Can +45, 5 altın;
  çanta sınırını aşmaz, balıklara dokunmaz). Co-op'ta konuğun avının XP'si konuğa yazılır (önce ev sahibine).
- **Yerden toplananlar çantaya:** sandık açılınca içerik doğrudan çantaya (kazılan, ada, tapınak, gizli, batık); çanta doluysa kese
  yerinde kalır, kısmen sığarsa kalan aynı kesede kalır (önce kese alınıp ayağın dibine yeniden fırlıyordu); HUD'da çanta yükü;
  güverteye düşen kese gemiye bağlı (önce tahtadan denize düşüp kayboluyordu); kayıktan ve güverteden (kancayla) yüzen nesne/kese
  toplanır (önce hiç alınamıyordu); co-op'ta konuğun "Yere bırak"ı ev sahibinde doğar (önce eşya kayboluyordu).
- **Bağımsız inceleme (çürütme turlu):** 4 boyutta (ganimet akışı, co-op, hareket/kamera, veri/arayüz/testler) 23 bulgu; her boyutta
  ayrı bir doğrulayıcı bulguları çürütmeye çalıştı: 22'si gerçek, 1'i çürütüldü. Örnekler: kayıktaki sandığı açınca hayalet yük yeri,
  sınırdaki ağırlıkta "Ganimeti topla" görünüp alınamayan kese, güverte kesesinin dümen istemini gizlemesi, konuk avında diğer
  konukların XP payının kaybolması, kamera beklemesinin nişandan çıkışı dondurması, çömelme eğiminin eylem değişiminde kalıcı
  olması, zıplayınca basamak yumuşatmasının bir karede sıfırlanması. Hepsi düzeltildi. Kamera düzeltmesinin ilk hali başlangıçtaki
  sonsuz değeri sönümleyip NaN üretiyor, kamera duvarlarda hiç yaklaşmıyordu; tam regresyon (04 C07, 15 C03) bunu yakaladı, düzeltildi.
- **Test:** `16_kosu_poz_ganimet.js` (23 kontrol) eski kodda 20 kontrol kaldı (K02 ve K06 eski kodda da geçiyor), son kodda 23/23;
  `coop/06d_ganimet_canta.cjs` (2 oyuncu) eski kodda 5 kontrol kaldı, son kodda 9/9. Tam regresyon (son kod): 16/16 senaryo + Node
  testi geçti; `13_donma`, `coop/06b` 18/18 ve `coop/06d` 9/9 tek başına geçti; `09_performans` yalnız paralel şeritte çöktü, tek
  başına hem son kodda hem eski kodda geçiyor (ayrıntı 12. belgede). Tek dosya `02_tek_dosya` 4/4.
- **Bellek uyarısı (bu turda bulundu ve geri alındı):** harita karosu boyamasını hızlandırma denemeleri (CPU tuvali, dilimli boyama,
  doğrudan piksel dizisi) test ortamında sayfa belleğini ~2 katına çıkardı; tuval yolu eski haline döndürüldü, yalnız piksel
  döngüleri ayırmasız bırakıldı (04_karakter: 1,17 GB / 36 sn, eski kod 1,18 GB / 40 sn).
- **Doğrulanamayan / sınırlı:** gerçek GPU'da el ile oynanış ve görsel his (çömelme/kürek eğimi, basamak yumuşatma), gerçek fareyle
  sıçrama süzgeci; harita karosu takılmasının gerçek GPU'daki süresi. Yayındaki sürüm (v0.3) bu düzeltmeleri içermez; yayına alma
  kullanıcı onayı bekler.
