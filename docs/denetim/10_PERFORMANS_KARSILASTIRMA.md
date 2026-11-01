# 10. Performans Karşılaştırması (Aşama 8)

## 10.1 Ortam uyarısı (açıkça)
Bu ortamda **gerçek ekran kartı yok**: Chromium SwiftShader ile çizer. Bu nedenle FPS değerleri donanım FPS'i değildir ve
"gerçek GPU'da 60 FPS" hedefi burada **doğrulanamaz**. Ölçülebilenler: çizim çağrısı ve üçgen sayıları (`renderer.info`),
GPU kaynak sayaçları (geometri/doku/program), JS yığını (`performance.memory`) ve ana iş parçacığı **benzetim maliyeti**
(`game.update` ms/kare — CPU tarafı; gerçek makinede de benzer). Senaryo: `tests/scenarios/09_performans.js`.

## 10.2 Ölçümler (önce — Aşama 7 sonu kodu, `09_performans.js`, 640×360)
Not: `renderer.info.render` sayaçları son işleme zincirinde her geçişte sıfırlandığı için ilk koşuda tüm sahnelerde "1 çağrı / 1 üçgen"
okunuyordu; ölçüm yardımcısı `info.autoReset=false` + `info.reset()` ile düzeltildi (tüm geçişler toplanır; gölge geçişi dahil).
`performance.memory.usedJSHeapSize` bu başsız tarayıcıda sabit 98 MB döndürür (anlamsız) — yığın ölçümü yok.

| Sahne | Çizim çağrısı | Üçgen | Geometri | Doku | Program | Benzetim ms/kare (CPU) |
|---|---|---|---|---|---|---|
| Ana menü | 420 | 866 874 | 225 | 137 | 80 | 0,33 |
| Başlangıç limanı (oyuncu iskelede) | 1 032 | 1 238 540 | 842 | 200 | 91 | 1,81 |
| Orman adası (Kadim Tapınak, oyuncu adada) | 308 | 598 560 | 786 | 200 | 92 | 0,93 |
| Fırtına (adada) | 319 | 686 556 | 791 | 201 | 94 | 0,86 |
| Boss: Kraken (adada) | 370 | 709 038 | 842 | 201 | 95 | 0,78 |

Okuma: CPU tarafı benzetim ucuzdur (≤ 2 ms/kare). Çizim çağrısı limanda yüksektir (1 032; liman yapıları `mergeStatic` ile
birleştirilmesine karşın NPC'ler, gemi, iskele/kasaba aksesuarları, bitki örtüsü hücreleri ve gölge geçişi). Çağrı dağılımı 10.5'te.

**Sonra (Aşama 8 sonu, tek tarayıcı, aynı senaryo):**

| Sahne | Çizim çağrısı | Üçgen | Geometri | Doku | Program | Benzetim ms/kare (CPU) |
|---|---|---|---|---|---|---|
| Ana menü | 419 | 853 466 | 225 | 137 | 80 | 0,39 |
| Başlangıç limanı | **999** (−37) | 1 242 808 | 811 | 200 | 91 | 1,42 |
| Orman adası (Kadim Tapınak) | 308 | 604 652 | 484 (−302: önceki ziyaretlerin hayvan/düşman kaynakları artık bırakılıyor) | 180 | 91 | 1,84 |
| Fırtına | 320 | 719 598 | 492 | 181 | 94 | 1,32 |
| Boss: Kraken | 340 | 713 248 | 512 | 181 | 93 | 2,21 |

Çizim çağrısı azalması küçük parçaların (göz, toynak, küpe, düğme…) gölge atmamasından gelir (gölge geçişinde ayrı çağrıydı); üçgen
sayısı değişmedi. Daha büyük kazanımlar (karakter iskeletli parçalarının birleştirilmesi: NPC başına ~10 çağrı; prosedürel hayvan
parçalarının birleştirilmesi; gölge atan nesne budaması) riskli yapısal değişikliklerdir ve 14. belgeye bırakıldı.

## 10.3 Sızıntı denetimi (önce)
Yöntem: kur/sök (ya da doğur/sil) döngüleri; her ölçümden önce bir kare çizilir ve `renderer.info.memory` okunur. GPU'ya
yüklenmemiş (görünmeyen) geometri sayaçlara girmediği için kamera ölçülen nesnelere bakacak şekilde konumlanır.

| Döngü | Sonuç (önce) | Not |
|---|---|---|
| Ada içeriği kur/sök ×3 (Kadim Tapınak, kamerada) | büyüme 0 geometri / 0 doku | ada içeriği örneklenmiş kit geometrisi (paylaşımlı) + `own` işaretli özel geometriler; `_drop` tam |
| Tehlike seti kur/sök ×3 | büyüme 0 / 0 | (kamerada değil; doğrulama Aşama 8 sonrası kamerada yinelenir) |
| Hayvan bölgesi doğur/sil ×3 (limanda, görünür) | domuz (7): +140 geometri/döngü; maymun (6): +72; timsah (3): +102; papağan (9): +81; yılan (6): +132; kutup ayısı (1): +33 | prosedürel modeller her hayvan için geometri+malzeme yaratır, `dispose()` yalnız sahneden kaldırır (B14) |
| Yarasa (glb klonu, 7) doğur/sil ×3 | +2 geometri, +28 doku/döngü | klon iskeletin kemik dokusu (`Skeleton.boneTexture`) ve klon malzemeler bırakılmıyor |
| Düşman doğur/kaldır 3×4 (haydut/iskelet, oyuncunun yanında) | +9 geometri, +97 doku (12 düşman → ~8 doku/düşman) | `Character.dispose` yalnız sahneden kaldırır + mixer durdurur: klon malzemeler ve kemik dokuları sızar — her ölüm/yeniden doğuşta (uzun oturumda birikir) |

## 10.4 Yapılan düzeltmeler ve sonuçları (sonra)
Öncelik sızıntılardı: uzun oturumda birikerek kare süresini ve belleği büyüten kaynaklar. Çizim çağrısı azaltma (10.5) bu
ortamda FPS'e dönüştürülemediği için yalnız kaynak sayaçlarıyla ölçülen, riski düşük adımlar yapıldı; mimari değişiklik yok.

| Düzeltme | Önce | Sonra |
|---|---|---|
| `Character`/`Animated` dispose: klon malzeme, klon iskelet kemik dokusu, prosedürel aksesuar geometrisi; `build()` yeniden çağrısında eski model bırakılır | düşman 3×4 doğur/kaldır: +9 geometri, +97 doku | `Character` ×4 oluştur/bırak: 0 geometri / 0 doku; sabit görünümlü haydut 4×4 döngü: +1 geometri, +2 doku (yalnız ilk yükleme: balta geometrisi, atlas); rastgele görünümlü düşmanlarda kalan artış kit gövdesi/şapka geometrilerinin ilk kez yüklenmesidir (paylaşımlı, kit büyüklüğüyle sınırlı) — 09 testi bu yüzden sabit tohum ve ısınma döngüsüyle ölçer: sabit görünümlü 4 düşman × 3 döngü (ısınma sonrası): geometri 0 / doku 0 (sayaçlar 555/184 sabit) |
| `Animal.dispose`: prosedürel geometri/malzeme, glb klonunda Animated.dispose | domuz bölgesi +140 geometri/döngü, timsah +102, yılan +132; yarasa +2 geometri +28 doku/döngü | domuz/timsah/yılan 0/0 (kamerada); yarasa 0/0 (ısınma sonrası) |
| `hazards._dropSet`: `own()` işaretli geometri/malzemeler | (kamerada ölçülmedi) | ada kur/sök döngüsü büyüme 0 (kamerada) |
| weatherfx/details/worldEvents dispose | — (kod incelemesi) | — |
| HUD DOM yazımları değişiklik algılamalı (pusula işaretleri her karede `innerHTML`, istem metinleri kare başına 2 kez) | 60 sn benzetimde 1 800 pusula yazımı; dümende 90 sn'de CDP düğüm sayısı 58 636 | pusula yalnız tür/renk değişince yeniden kurulur; dümende 90 sn'de 784 düğüm |
| Oluşturucu `onClose` temizliği, harita çift açılış (H23/H24) | açılış başına +1 window dinleyicisi; rAF döngüsü sürüyor; 2 harita | 0 dinleyici; kapanıştan sonra oluşturucu rAF çağrısı yok; 1 harita (`11_arayuz_sizinti.js`) |

Not: `kk.texture` renk atlası önbelleği 96 girişle sınırlıdır (FIFO, eski doku bırakılır); rastgele görünümlü düşmanlarla ilk
dakikalarda doku sayısı bu sınıra kadar büyür, sonra sabitlenir — sızıntı değil.

## 10.5 Çizim çağrısı dağılımı (liman, önce)
Yöntem: sahnenin üst düzey çocukları tek tek gizlenip çağrı farkı ölçüldü (gölge geçişi dahil; toplam 1 036 çağrı, 1,24 M üçgen).

| Kaynak | Çağrı | Üçgen | Not |
|---|---|---|---|
| Gölge geçişi (yönlü ışık gölge haritası) | 258 | 369 803 | gölge kapalıyken toplam 778 çağrı |
| Liman yapıları (`port-batched`, 85 örgü) | 106 | 16 056 | malzemeye göre birleştirilmiş; kalan farklı malzeme/sprite/çizgi |
| Arazi (125 karo, görünenler) | 48 | 312 448 | |
| Karakterler (oyuncu + liman NPC'leri, 10 adet) | 13–32 / karakter, toplam ≈ 200 | ≈ 95 000 | kit karakteri 14–29 ayrı örgüden oluşur (gövde parçaları, aksesuar) |
| 7 adsız grup × 20 örgü (844 üçgen) | 140 | 5 908 | kimlik tespiti aşağıda |
| Diğer (gemi, su, gökyüzü, efektler, HUD öğeleri) | ≈ 280 | | |

## 10.6 Sonuç
- Sızıntılar: ada kur/sök, tehlike seti, hayvan bölgesi (domuz/timsah/yılan/yarasa) ve düşman doğur/kaldır döngülerinde geometri ve doku
  sayaçları ısınma sonrası **sabit** (önce: domuz başına 20 geometri, düşman başına ~8 doku birikiyordu). Uzun oturum eğilimi Aşama 9'da
  (`10_uzun_oturum.js`).
- Dinleyici/rAF sızıntıları (oluşturucu, harita) kapatıldı; `11_arayuz_sizinti.js` önce 2/6 → sonra 6/6.
- Çizim çağrısı: liman 1 036 → 999; 10.5 dağılımı ve adaylar yol haritasında. Gerçek GPU'da 60 FPS hedefi bu ortamda doğrulanamaz
  (10.1); CPU benzetimi ≤ 2,5 ms/kare.

## 10.7 Bellek: gerçek zamanlı oynanış ve uzun benzetim
| Ölçüm | Sonuç |
|---|---|
| Gerçek zamanlı 3 dk (DK.sim yok, ~10 FPS yazılımsal) | RSS 1,05–1,16 GB düz; JS yığını 41–53 MB; ArrayBuffer ~65 MB; DOM ~745 düğüm |
| Hızlandırılmış benzetim, 90 sn'lik dilim (çöp toplama yok) | Blink yığını dilim sonunda 430–650 MB, RSS dilim başına ~+0,5 GB → 30 dk'da OOM (test yöntemi sınırı, §4.8) |
| Aynı, dilimler arasında `gc()` | Blink yığını ~200 MB'a, RSS ~0,8 GB'a döner; tepe ≤ 1,5 GB |
| 30 dk benzetimli oturum (`10_uzun_oturum.js`, alt dilim + olay döngüsüne teslim + gc) | 5/5 GEÇTİ; RSS tepesi 959 MB (çoğunlukla 0,47–0,85 GB); JS yığını 103–115 MB (kesin ölçüm), Blink yığını 5–46 MB; geometri 4.–16. dilimde 1 143–1 152 (artış medyanı ≤ 1/dilim); doku 236 sabit; kare maliyeti 1,5–1,9 ms |
| `04_karakter.js` (güverteye/dümene ışınlanma adımları) | Yazılımsal GPU'da gerçek zamanlı çizim açıkken bazı adımlar 10–15 sn sürüp RSS 3–6 GB'a çıkıyordu (bir regresyon koşusunda bellek sınırı); CPU profili ana iş parçacığını çoğunlukla boşta/yerel kodda gösterdi (JS < 0,1 sn). Senaryo DK.sim ile sınadığı için çizim kısıldı (`fpsLimit 2`): 36 sn, RSS ≤ 1,2 GB, iki ardışık koşu 21/21 |

## 10.8 Donma (takılma) ve kare süresi denetimi (Aşama 9 sonrası, kullanıcı isteği)
Soru: "Oyunda donma oluyor mu, yeterli FPS alınıyor mu?" Bu ortamda gerçek ekran kartı olmadığından (10.1) **gerçek FPS ölçülemez**.
Ölçülen: 60 Hz tempoda (`game.update(1/60)` + HUD + ağ, çizim kısılmış) karenin **oyun mantığı** süresi, tek seferlik ağır işler,
Chrome izleme kaydıyla (CDP Tracing: ana iş parçacığı duvar/işlemci süresi, V8 çöp toplama olayları) uzun karelerin nedeni, V8
`--trace-gc` günlüğü ve örneklemeli bellek ayırma profili. Kare bütçesi 60 FPS'te 16,7 ms'dir; çizimin işlemci tarafı ayrıca eklenir.

### 10.8.1 Oyun turu (önceki kod; 640×360, dt = 1/60)
| Evre | Kare | Ort. ms | p95 | p99 | Maks | > 16,7 ms |
|---|---|---|---|---|---|---|
| Limanda boşta (10 sn) | 600 | 1,64 | 4,1 | 8,5 | 62,0 | 2 |
| Limanda yürüyüş (20 sn) | 1 200 | 1,57 | 3,5 | 11,3 | 26,4 | 5 |
| Gemiyle seyir (180 sn, 1,6 km) | 10 800 | 1,43 | 3,1 | 8,4 | 38,7 | 24 |
| Adaya ışınlanma + yürüyüş (15 sn) | 900 | 1,43 | 3,0 | 11,1 | **143,7** | 3 |
| Savaş, 6 düşman (20 sn) | 1 200 | 1,42 | 3,2 | 7,6 | 21,4 | 1 |
| Fırtına (20 sn) | 1 200 | 1,60 | 3,5 | 12,0 | 166,5 | 6 |
| Dünya haritası açık (3 sn) | 180 | 1,38 | 3,1 | 9,8 | 14,7 | 0 |
| Boss: Kraken (10 sn) | 600 | 1,24 | 2,5 | 5,6 | 19,1 | 1 |

Tek seferlik işler: harita açma 9,7 ms, elle kayıt 3,8 ms (otomatik kayıt en çok 9,3 ms), boss doğması 2,2 ms, düşman doğması ≤ 15,5 ms,
mini harita çizimi ≤ 20,5 ms (seyrek), arazi karosu iletisi ≤ 5,8 ms. **Tekrarlanabilir tek takılma ada içeriği kurulumuydu**:
ışınlanmada 142 ms (soğuk), ayrı ölçümde ılık 4–65 ms (bitki örtüsü 13–45 ms, liman yapısı 18–36 ms ki bunun ~12 ms'si 5 NPC karakter
modeli, örneklenmiş çizim kurulumu 3–22 ms). 62 ms ve 166 ms'lik iki tekil kare sistem bazlı ölçümde yinelenmedi (10.8.3: çöp toplama
ya da işletim sistemi beklemesi).

### 10.8.2 Düzeltme: ada içeriği karelere bölünerek kurulur
`js/world/islands.js`: kurulum bir üreteçtir; her `yield` bir bölünme noktası (bitki örtüsü 64 örnekte bir, her yapı, her NPC — karakter
modeli ayrı adımda, her örnek grubu). Arka plan işi kare başına 3 ms bütçeyle ilerler; grup sahneye iş bitince eklenir. Oyuncu adanın
kıyısına 250 m'den yakınsa (ışınlanma, kayıt yükleme, hızlı yolculuk — hızlı yolculuk ekranı kararmışken yapılır) kurulum aynı karede
tamamlanır. Uzaklaşma, `_drop` ve yeni oturum yarım işi iptal edip tüm kaynaklarını bırakır.

| Ölçüm (gemi 12 m/sn ile Tuz Pazarı'na yaklaşır, gerçek `islands.update` yolu) | Önce | Sonra |
|---|---|---|
| Ada kurulumu | tek karede 54,9–57,5 ms | 11–14 kareye yayılır (toplam iş 38–70 ms) |
| Karedeki en uzun ada işi (`islands.update`) | 55,5–58,3 ms | 6,2–10,8 ms (ilk/soğuk liman kurulumu en çok ~12 ms'lik tek adım) |
| Tur boyunca en uzun kare | 56,8–60,3 ms | 29,8–40,9 ms (ada dışı: çöp toplama/işlemci beklemesi, 10.8.3) |

Tehlike setli adalar (aynı yaklaşma yöntemi; tamamlama karesi = sahneye ekleme + `islandBuilt` → tehlike seti kurulumu):

| Ada | Kare | Toplam iş | Karedeki en uzun ada işi | Tamamlama karesi (tehlike seti) |
|---|---|---|---|---|
| Ateş Dağı (volkan, kamp, boss alanı; 10 tehlike) | 19 | 81,3 ms (bitki örtüsü 69 ms: karo yüklenmemiş bölgede analitik yükseklik) | 8,3 ms | 3,7 ms (2,5 ms) |
| Korsan Kasabası (yıkık kasaba, kamp, kale) | 7 | 22,4 ms | 5,9 ms | 2,5 ms (1,0 ms) |

Eşdeğerlik: 67 adanın tamamında eski kod, yeni eşzamanlı kurulum ve yeni karelere bölünmüş kurulum **birebir aynı** içeriği üretir
(örnek matrisleri, çarpıştırıcılar, platformlar, NPC adı/konumu, fenerler, etkileşimler, engeller, lav); söküm sonrası artık 0.
Adım profili (soğuk/ılık): bitki dilimi ≤ 6,5 ms, örnek grubu ≤ 5,6 ms, NPC ≤ 10 ms, tamamlama (tehlike seti dahil) ≤ 5,9 ms.
Kalıcı test: `tests/scenarios/13_donma.js` (P01–P07; P08 tapınak durumu, inceleme bulgusu).

### 10.8.3 Kalan uzun karelerin nedeni (Chrome izleme kaydı, 130 sn yaklaşma rotası, 7 800 kare)
Her kare ayrı görev olarak çalıştırıldı; 12 ms'yi aşan her kare için kareyi içeren görevin duvar/işlemci süresi ve kareyle çakışan V8
çöp toplama süresi çıkarıldı.

| | Uzun kare (> 12 ms) | Çöp toplama | İşlemci beklemesi (ortam) | Kod |
|---|---|---|---|---|
| Balık düzeltmesinden önce | 18 | 13 | 3 | 2 |
| Sonra | 13 | 9 | 4 | 0 |

- Bu makinede ana iş parçacığı uzun görevlerde zamanın yalnız **%28'inde** işlemcideydi (4 çekirdek; yazılımsal GPU ve arazi işçileri
  aynı çekirdeklerde). Görev duvar süresi 115 ms iken işlemci süresi 9,5 ms olan örnekler var: bu ortamın ölçüm gürültüsü.
- V8 günlüğü (`--trace-gc`): JS yığını küçük (büyük toplamadan sonra 35–37 MB, önce 45–65 MB). Büyük toplama (mark-compact) yaklaşık
  5–10 sn'de bir; son duraklama bu ortamda tipik 7–12 ms (4–22 ms). Küçük toplama (scavenge) ortalama 0,40–0,47 ms, her biri ~2,6 MB.
- Masaüstü işlemcide ve çekişmesiz ortamda bu duraklamaların daha kısa olması beklenir; ancak bu ortamda doğrulanamaz.

### 10.8.4 Bellek ayırma (çöp) azaltma: balık sürüleri
Örneklemeli ayırma profili (40 sn oyun): toplam ayırmanın en büyük kaynağı `fish.update` idi (her balık için her karede yeni vektör,
her sürü için `filter` dizisi, sürü içi her çift için `Vector3.length()` çağrısı — orta seviye V8 derleyicisinde ondalık dönüşler kutulanır).
Düzeltme: geçici nesneler yeniden kullanılır, canlı üyeler yerinde süzülür, ayrılma döngüsü aynı işlem sırasıyla skaler.

| Ölçüm (198 balık, 16 sürü) | Önce | Sonra |
|---|---|---|
| Çağrı başına ayırma | 97,5 KB | 35,1 KB (−%64) |
| Çağrı süresi | 0,18 ms | 0,14 ms |
| Profildeki toplam ayırma (40 sn) | 630 MB (balık 291 MB) | 366 MB (balık 64 MB) |
| Simülasyon sonucu (300 kare, yüzen oyuncu tehdidiyle) | — | konum/hız farkı **0** (bit düzeyinde aynı); çizim matrisi ≤ 1,7·10⁻¹⁶ |

Dürüst not: uçtan uca çöp toplama sayısındaki düşüş ölçüm gürültüsü içinde kaldı (aynı rota A/B: küçük toplama 1 714 → 1 660, büyük
toplama 25 → 23). Kalan büyük ayırıcılar: yelken normallerinin her karede yeniden hesabı (`ship._animate` → `computeVertexNormals`),
`ocean.heightAt` (balık, gemi kaldırma kuvveti), karakter güncellemesi, arazi örneklemesi — yol haritasında (14. belge).

### 10.8.5 Sonuç
- Oyun mantığı karede ortalama ~1,4 ms (p99 5–12 ms); 16,7 ms'lik 60 FPS bütçesinin küçük bir kısmı. Tekrarlanabilir tek donma kaynağı
  (ada kurulumu, 55–142 ms) giderildi; kalan seyrek uzun kareler çöp toplama (tek kare, ~10 ms) ve bu test makinesinin işlemci
  çekişmesinden kaynaklanıyor.
- **Gerçek FPS** (ekran kartında çizim süresi) bu ortamda ölçülemez. Çizim yükü 10.2'deki gibidir (liman ~1 000 çizim çağrısı); ayar
  ön tanımlarına göre yük 10.9'da. Yükleme ekranında başlangıç sahnesinin gölgelendiricileri önceden derleniyor
  (`renderer.compileAsync`, `main.js`); sonradan görünen içerik (hayvan, ada içeriği, düşman/boss, efekt) ilk görüldüğünde derleniyor:
  turda liman yürüyüşünde 5, seyirde 1 yeni program (yazılımsal GPU'da bu karelerin çizimi 38–81 ms). Gerçek GPU'da bu, her içerik türü
  için oturumda bir kez kısa bir takılma olabilir — ada grubunu sahneye eklemeden önce `compileAsync` ile derlemek yol haritasında.
  Ayarlardaki **FPS göster** seçeneği (`showFps`) ile gerçek makinede doğrulama önerilir.

## 10.9 Çizim yükü: grafik ön ayarları ve çizimin işlemci maliyeti
### 10.9.1 Ön ayarlara göre çizim yükü (1280×720)
"Grafik kalitesi" (arazi/su ızgarası, bitki yoğunluğu) yalnız yükleme anında uygulanır; orta/düşük ölçümleri ayarlar kaydedilip sayfa
yeniden yüklenerek alındı. Gölge, efekt ve görüş mesafesi anında uygulanır. Çağrı/üçgen sayılarına gölge ve son işleme geçişleri dahildir.

| Sahne | Yüksek (çağrı / üçgen) | Orta | Düşük |
|---|---|---|---|
| Liman (başlangıç) | 1 000 / 1,22 M | 1 019 / 1,05 M | 737 / 0,57 M |
| Orman adası (Kadim Tapınak) | 302 / 551 K | 299 / 466 K | 175 / 250 K |
| Açık deniz | 203 / 490 K | 195 / 277 K | 100 / 258 K |
| Gölgelendirici programı | 89 | 89 | 40 |

- Orta ayar çizim çağrısını azaltmaz (gölge açık, 1 024 harita); kazancı üçgen (−%14…−%43) ve GPU doldurma yükündedir (gölge haritası
  4 kat küçük; gerçek GPU'da "yüksek" son işleme 4× MSAA kullanır — yazılımsal GPU'da otomatik olarak ortaya düşer).
- Düşük ayar: gölge ve son işleme kapalı, görüş %30, bitki %45, su ızgarası 160² → limanda çağrı −%26, üçgen −%53; orman adasında
  çağrı −%42; açık denizde çağrı −%51. Düşük FPS'te ilk düşürülecekler gölge ve görüş mesafesidir.

### 10.9.2 Çizimin ana iş parçacığı maliyeti (Chrome izleme kaydı, iş parçacığı işlemci süresi)
Her `post.render()` ayrı görevde çalıştırıldı; görevin işlemci süresi (tdur: three.js sahne gezintisi, matris/uniform hazırlığı ve
WebGL komut kodlaması; işletim sistemi beklemesi hariç) ölçüldü. Ekran kartının kendi çizim süresi bu ölçüme girmez ve burada ölçülemez.
Makine: Intel Xeon 2,30 GHz sanal çekirdek (4 çekirdek). Yüksek ayar, 30 çizim/sahne.

| Sahne | Çizim çağrısı | Çizim CPU medyan (min–maks) | + oyun mantığı | Ana iş parçacığı toplamı |
|---|---|---|---|---|
| Liman | 1 022 | 10,9 ms (7,4–20,6) | ~1,5 ms | ~12,5 ms |
| Orman adası | 308 | 4,3 ms (3,6–5,6) | ~1,5 ms | ~6 ms |
| Açık deniz | 226 | 3,5 ms (3,0–5,6) | ~1,0 ms | ~4,5 ms |

Yorum: bu (yavaş, paylaşımlı) işlemcide bile ana iş parçacığı 60 FPS bütçesinin (16,7 ms) içinde; en ağır sahne liman (~12,5 ms,
pay az). Masaüstü işlemcilerde tek çekirdek hızı genelde daha yüksektir, ancak bu ortamda doğrulanamaz. **Gerçek FPS'i belirleyen
ekran kartı tarafı** (gölge, su, son işleme, çözünürlük) burada ölçülemez; gerçek makinede "FPS göster" ile liman, seyir, fırtına ve savaş
sahnelerinde kontrol edilmeli. Limanda çağrı sayısını düşürme adayları 10.5 ve 14. belge #12'de.
