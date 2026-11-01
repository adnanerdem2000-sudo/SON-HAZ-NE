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

