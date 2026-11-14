## 8. Test planı

### 8.1 Senaryo adları (KARARLAR.md: Faz 8 → tarayıcı `45`–`52`, co-op `08d`–`08f`)

| Ad | Ne sınar | Yöntem | Geçme ölçütü |
|---|---|---|---|
| **45_perf_matris.js** | 9 sahne + menü (§1.4 tarifleri), 8 yön tarama, kategori dökümü, `_simProf`, ilk kare | `tests/lib/perf_araclari.js`; bütçeler `tests/perf_butce.json` (§8.4); JSON çıktı `tests/out/perf/` | Her sahnede çağrı (medyan ve en çok), üçgen, gölge çağrısı, geometri, doku, program, JS ms bütçe içinde; aynı kodda iki koşu arasında medyan çağrı farkı ≤ %3 |
| **46_derleme_isitma.js** | J-03, J-07, J-08, J-17, J-14 | `f8_derleme.js` deseni: içerik aynı görevde kurulup çizilir | Menüde kullanılmayan tuval varyantı ≤ 2; yükleme sonrası ilk karede yeni program ≤ 3; meşale aç/kapa/aç 0/0/0 yeni program; görünür nokta ışığı oturum boyunca sabit N; ada/düşman/boss/efekt ilk görüşünde yeni program 0 ve ilk kare ≤ 2× ikinci kare; son işleme açıkken tuval `antialias=false` |
| **47_lod_gorunurluk.js** | J-01, T3, T5 budama, T6 (ekran boyutu + d99), animasyon katmanları | NPC'lere sırt dönük kamera; 1,5 km uzaktan liman; eşik çevresinde 20 m ileri-geri yürüyüş (titreme sayacı); dürbün açıkken uzak gemi; fırtına/sis | Sırt dönükken karakter çağrısı 0; uzak liman NPC'leri 0 çağrı; eşikte 10 sn'de görünürlük değişimi ≤ 2 (histerezis); dürbünde 1 km'deki gemi görünür; eşik konumlarında görüntü farkı ≤ %0,5 piksel (sis ötesi) |
| **48_birlestirme_esdegerlik.js** | T1, T2, T7, P3.1–P3.5 | (a) Sabit 26 kamera konumu (kamera_tarama) + gemi/hayvan/liman yakın çekimleri: önce/sonra `DK.snapFrom` görüntüleri; (b) Node: dönüşüm listelerinin sıralı özeti (bitki, süs), hayvan pozları (bacak/yılan) 120 karede | Görüntü farkı: ortalama mutlak fark ≤ 1,5/255, %99 piksel ≤ 8/255 (titreşimli silinme ve parçacıklar maskelenir); Node özetleri birebir aynı; çarpıştırıcı sayısı ve konumları aynı |
| **49_bolge_ayiklama.js** | T4, T5 (mağara) | Yankı odası, tünelde ağızdan 10/20/30/40/60 m, dış kapı; Faz 6 mağaraları eklendiğinde aynı düzen | Odada ≤ 250 çağrı, gölge 0; tünel noktalarında ayıklama açık/kapalı görüntü farkı 0; dışarıda mağara grubu 0 çağrı |
| **50_bellek_dongu.js** | J-16 düzeltilmiş, J-21, J-22, B-1…B-5, bütün kur/sök türleri | Kimlik farkı + paylaşımlı varlık kümesi; boss oyuncu yanında, `checkT` donuk, ölçümde `active` doğrulaması; ada, hayvan, düşman, kese, gemi, 3 boss, yüzen nesneler (şişe/gök taşı/kazazede/varil), yıldırım, hortum, deniz ekipmanı (zıpkın/ağ), lav atışı + `enemies.start`, 150 rastgele görünümlü düşman (kk atlas) | Her döngüde "döngüde yüklenip sahnede olmayan, paylaşımlı olmayan" geometri/doku/malzeme = 0; kk dokuları ≤ başlangıç + 96 ve kullanımdaki doku tahliye edilmez; 5 ardışık koşuda aynı sonuç |
| **51_kalite_onayar.js** | §4 ön ayarlar, J-11, J-12, J-19, dinamik çözünürlük, ayar göçü | Ayar kaydı + `location.reload()` (bu çalışmadaki `f8_kalite.js` yöntemi); sahte rAF zaman damgaları; eski `dksh.settings` biçimi | Düşük/Orta/Yüksek'te modül değerleri tablodaki gibi (lodScale, gölge haritası ve kutu, ışık havuzu, parçacık bütçesi, AA); FPS sınırı 60 → 75/100/144/165 Hz'de 59–60; duraklatmada ≤ 2 kare/sn; gölge Kapalı'da USE_SHADOWMAP'li program 0; eski ayar dosyası açılır |
| **52_uzun_oturum_gercek.js** | Uzun oturum belleği (10'un genişletilmişi) | 10_uzun_oturum akışı + yüzen olaylar açık + program sayısı + `fpsLimit` ile kısılmış gerçek zamanlı 20 dk; CDP ile GPU süreç belleği | 30 dk benzetimde son 10 dilim geometri/doku toplam artışı ≤ 50 (bugün ≤ 300), medyan ≤ 1; program ısınmadan sonra ≤ +5; JS yığını (gc sonrası) son 4 dilim ≤ ilk 4 + 20 MB; gerçek zamanlı bölümde GPU süreç belleği eğimi ≤ 2 MB/dk |
| **coop/08d_coop_perf_4.cjs** | Dört oyunculu co-op performansı | `f8_coop4.cjs` deseni; konuklar ev sahibinin yanında ve 3 farklı adada (iki düzen) | Ev sahibinde çağrı ≤ tek oyunculu aynı sahne + 3 × 25; JS ≤ 3 ms/kare; konuk başına giden ≤ 12 KB/sn (Faz 5 tavanı 96 kbit/sn) |
| **coop/08e_coop_lod_tutarlilik.cjs** | LOD'un oyun sonucunu değiştirmediği | Ev sahibinden 600 m uzaktaki konuğun yanında hayvan bölgesi ve düşman kampı; konuğu hedefleyen düşman | Konuk yanındaki hayvan/düşman ev sahibinde tam katmanda güncellenir (konum adımı 1/60); hedefli düşman seyreltilmez; konukta uzak avatar LOD'u yerel |
| **coop/08f_coop_uzun.cjs** | Co-op bellek ve katıl/ayrıl | 3 oyuncu, 10 dk benzetim, 5 katıl/ayrıl döngüsü | Uzak oyuncu ayrılınca etiket dokusu ve malzemesi bırakılır (B-5); kimlik farkı boş; program sabit |

### 8.2 Mevcut testlerde değişecekler

- **09_performans**: boss döngüsü §5.4'e göre düzeltilir (P0.6); liman bütçesi kademeli düşer: P2 sonrası ≤ 850, P3 sonrası ≤ 550, P7'de ≤ 500 (yalnız ölçülen değere göre). `_M` tek kare yerine 45'in kütüphanesini kullanır.
- **10_uzun_oturum**: 52 gelene dek değişmez; 52 eşikleri sıkılaştırır.
- **13_donma**: P01 en uzun ada karesi (taban 10,5 ms) P5.2 sonrası ≤ 5 ms hedefi (J-29), P02 eşdeğerlik aynen geçmeli (hücre değişiklikleri ada kurulum sırasını bozmaz).
- **17_kamera_kararma**, **kamera_tarama b1–b6**: P2.1 (karakter ayıklaması) ve P2.4 (mağara) sonrası birebir geçmeli (karanlık kare sayısı artmaz).
- **05_dusman_ai F-08**: P2.2/P4.1 sonrası değişmeden geçmeli.
- **Faz 6 34_hikaye_dunya_perf**: Ölü Sis liman farkı ≤ 3 çağrı, ışık havuzu 4 — P1.5 sonrası havuz `lights.js`'te 4 olarak kalır.

### 8.3 Görüntü eşdeğerliği

Optimizasyonun görünür dünya kalitesini düşürmediğinin kanıtı: `DK.snapFrom(from, to)` (main.js:138-143) ile 26 kamera_tarama konumu + 12 ek konum (liman yakın/orta/uzak, gemi güvertesi, açık denizden Kırlangıç 1,6 km, Tuz Pazarı, Kadim Tapınak ormanı, mağara odası ve tünel, fırtına, Volkanik Dev arenası, Kraken). Her konumda saat 11:00, rastgele olaylar kapalı, aynı tohum; önce (P0 tabanı) ve sonra görüntüleri; ölçüt §8.1/48. Yakın-kamera titreşimli silinme ve parçacıklar maske dışı bırakılır. Ayrıca SwiftShader'ın yazılımsal çizicisi deterministiktir: aynı kod ve aynı sahne aynı pikselleri üretir (bu çalışmada liman 09 görünümü Yüksek ön ayarda altı koşuda 1 005–1 026 çağrı verdi; taban kaydı 1 035 — fark, oyun başı 2 sn'deki gerçek zamanlı karelerin hayvan/NPC konumlarını değiştirmesinden).

### 8.4 Sahne bütçeleri (ölçülebilir hedefler)

SwiftShader, 640×360, Yüksek ön ayar, saat 11, açık hava (fırtına hariç), 8 yön. "Taban" bu çalışmanın ölçümüdür (§1.5); "Hedef" P7 sonunda 45'in bütçesidir. JS = 60 × `game.update(1/60)` ortalaması (bu makinede; koşudan koşuya ±%40 oynuyor, bu yüzden bütçe tabanın 1,25 katı ve iki koşunun en iyisi alınır).

| Sahne | Taban çağrı (09 görünümü / tarama medyan / en çok) | Hedef çağrı (medyan / en çok) | Taban üçgen (en çok) | Hedef üçgen (en çok) | Taban gölge çağrısı | Hedef gölge | JS ms taban → hedef |
|---|---|---|---|---|---|---|---|
| Başlangıç limanı | 1 026 / 691 / 1 054 | ≤ 400 / ≤ 520 | 1,25 M | ≤ 0,95 M | 246–276 | ≤ 130 | 1,4–2,6 → ≤ 2,0 |
| Kalabalık kasaba (Tuz Pazarı) | 1 130–1 137 / 514–541 / 1 130–1 133 | ≤ 400 / ≤ 650 | 1,32 M | ≤ 1,0 M | 181–195 | ≤ 110 | 1,3–1,5 → ≤ 1,8 |
| Yoğun orman (Kadim Tapınak) | 449–458 / 384–386 / 498–519 | ≤ 300 / ≤ 400 | 0,81 M | ≤ 0,7 M | 111 | ≤ 70 | 0,9–1,5 → ≤ 1,8 |
| Yoğun orman (Kırlangıç) | 497–777 / 777–849 / 1 285–1 333 | ≤ 450 / ≤ 650 | 1,16 M | ≤ 0,85 M | 172–200 | ≤ 110 | 0,9–1,3 → ≤ 1,6 |
| Mağara odası | 388–1 246 / 472–489 / 1 112–1 166 | ≤ 200 / ≤ 250 | 1,13 M | ≤ 0,15 M | 161–175 | 0 | 1,1–2,1 → ≤ 1,5 |
| Açık deniz | 392–984 / 389–423 / 980–984 | ≤ 200 / ≤ 400 | 0,90 M | ≤ 0,6 M | 169 | ≤ 40 | 0,9–1,1 → ≤ 1,4 |
| Fırtına (denizde) | 413–1 003 / 438–445 / 995–999 | ≤ 220 / ≤ 420 | 1,03 M | ≤ 0,6 M | 169 | ≤ 40 | 2,2–2,5 → ≤ 2,0 |
| Deniz savaşı | 568–1 169 / 548–701 / 1 175–1 279 | ≤ 350 / ≤ 550 | 1,04 M | ≤ 0,7 M | 193–310 | ≤ 90 | 1,8–2,0 → ≤ 2,0 |
| Boss: Kraken | 430–437 / 438–456 / 949–961 | ≤ 250 / ≤ 450 | 0,99 M | ≤ 0,6 M | 177 | ≤ 50 | 1,7 → ≤ 1,8 |
| Boss: Volkanik Dev | 508–552 / 511–514 / 592–604 | ≤ 420 / ≤ 480 | 1,30 M | ≤ 1,0 M | 125 | ≤ 90 | 0,9 → ≤ 1,3 |
| Dört oyunculu co-op (ev sahibi, limanda yan yana) | 1 121 / 767 / 1 121 (konuk 1 181–1 193) | ≤ 450 / ≤ 600 (tek oyunculu liman + ≤ 75) | 1,26 M | ≤ 1,0 M | 316 (konuk 341–351) | ≤ 150 | 2,4 (konuk 2,1–3,3) → ≤ 3,0 |
| Menü | 422 | ≤ 300 | 0,85 M | ≤ 0,7 M | 168 | ≤ 120 | — |

Ek bütçeler: limanda geometri ≤ 760, doku ≤ 175, program ≤ 60 (son işleme açık; bugün 95'in 42'si boşa); ilk görüşte yeni program 0; meşale 0.

Ana iş parçacığı bütçesi (60 FPS'in CPU tarafı): 10. belge §10.9.2 limanda çizimin işlemci süresini CDP iz kaydıyla **10,9 ms** (1 022 çağrı, ~10,7 µs/çağrı, bu sanal Xeon) ölçmüştü. Aynı yöntemle (45'e eklenir: her `post.render()` ayrı görevde, iş parçacığı işlemci süresi) hedef: limanda çizim CPU medyanı ≤ 6 ms ve JS güncelleme + HUD + çizim CPU toplamı ≤ 8,5 ms (16,7 ms'lik karenin yarısı; kalan pay GC ve tarayıcıya).

Gerçek GPU hedefleri (doğrulama gerçek makinede, P0.4/P0.5 ile; **bu ortamda ölçülemez**): Orta ön ayar, tümleşik GPU (ör. Intel Iris Xe sınıfı), 1080p: limanda ve kasabada p95 kare ≤ 16,7 ms, fırtına ve deniz savaşında p95 ≤ 20 ms; Yüksek ön ayar, orta sınıf ayrık GPU, 1080p: bütün sahnelerde p95 ≤ 16,7 ms; ilk görüş ve meşale karesi < 50 ms.

### 8.5 PERFORMANCE_REPORT.md biçimi

```
# Performans Raporu (Faz 8)
## Ortamlar
| Kimlik | Ortam | Çizici (UNMASKED_RENDERER) | CPU | Çözünürlük × DPR | Ön ayar | Tarih | Commit |
| S1 | SwiftShader (yazılımsal) | ANGLE … SwiftShader driver | 4 vCPU | 640×360 × 1 | Yüksek | … | … |
| G1 | Gerçek GPU (kullanıcı makinesi) | … | … | 1920×1080 × 1 | Orta | … | … |   ← ölçülmediyse satırda "ÖLÇÜLMEDİ"

## A. SwiftShader — çizim yükü (donanımdan bağımsız)
| Sahne | Çağrı önce → sonra (medyan / en çok) | Δ% | Üçgen önce → sonra | Gölge çağrısı | Geometri | Doku | Program | JS ms | Bütçe |
| Başlangıç limanı | 691 / 1 054 → … / … | … | 1,25 M → … | 268 → … | 755 → … | 200 → … | 95 → … | 1,9 → … | ✔/✘ |
…
## B. Gerçek GPU — kare süresi (yalnız gerçek makinede ölçülen; SwiftShader değerleri BURAYA YAZILMAZ)
| Sahne | FPS p50 | Kare p95 (ms) | Kare p99 | GPU ms (ana/gölge/son işleme) | İlk görüş karesi | Cihaz |
## C. Bellek (uzun oturum)
| Ölçü | Önce | Sonra | Ölçüt |
## D. Derleme ve takılma
| Olay | Yeni program önce → sonra | İlk kare / ikinci kare |
## E. Adım günlüğü (§7.3 satırları)
## F. Bilinen sınırlar ve ölçülemeyenler
```
