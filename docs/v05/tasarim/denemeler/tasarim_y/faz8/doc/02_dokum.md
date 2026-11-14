## 2. Başlangıç limanında çizim çağrısı dökümü

### 2.1 Toplam ve geçişler

09_performans'ın liman kurulumu (oyun başı + 2 sn, varsayılan kamera, saat 8,5) bu çalışmanın altı koşusunda **1 005–1 026 çağrı** (etiketli iki koşuda 1 026 çağrı / 1 252 930–1 256 634 üçgen) (taban kaydı: 1 035 / 1 253 702). Bunun **764'ü ana geçiş, 246'sı gölge geçişi, 16'sı son işleme** (bloom + renk + çıkış + FXAA tam ekran dörtgenleri). Geometri 750–755, doku 200, program 95. v0.3 raporundaki 1 045 (docs/12_PERFORMANS_RAPORU.md:10, 960×540) ile aynı düzeydedir; 10. belgedeki 999 (§10.2) son kodda yoktur. Kullanıcının andığı "~1 045" v0.3 sayısıdır; v0.4'ün yeniden ölçülmüş değeri **1 026–1 035**'tir.

Aynı noktada saat 11:00'de 8 yönlü tarama: **606 / 651 / 676 / 682 / 691 / 810 / 943 / 1 054** çağrı (medyan 691, en çok 1 054); üçgen 1,12–1,24 M. Gölge geçişi her yönde **268–276 çağrıda sabittir**: gölge yükü kameranın baktığı yönden bağımsızdır (aşağıda nedenleri).

### 2.2 Nesne grubu dökümü (09 görünümü, 2. koşu, etiketli sınıflandırma)

Yöntem §1.3: her çizim çağrısı nesnesinin sahibi olan modüle göre etiketlendi. "A" ana geçiş, "G" gölge geçişi.

| # | Grup (kaynak) | A çağrı | A üçgen | G çağrı | G üçgen | Toplam çağrı | Pay | Kök neden (dosya:satır) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Prosedürel hayvanlar**: 7 domuz 140, 9 papağan 81, 6 maymun 72, yengeç 20 (+20 G) | 313 | 33 376 | 20 | 18 120 | **333** | %32 | Parça başına ayrı örgü/geometri/malzeme: `boarModel` 20 örgü (animals.js:21-68), `monkeyModel` 12 (:69-105), `parrotModel` 9 (:164-193); yengeç glb `Animated`, `frustumCulled=false` (character.js:967) |
| 2 | **Liman NPC'leri** (9 NPC + 1 rıhtım) | 59 | 37 284 | 100 | 42 766 | **159** | %15 | Kit örgülerinde `frustumCulled=false` (character.js:458, kk.js:93): her NPC her karede, gölge kutusunun dışında bile gölgeye çizilir; NPC başına ≥6 iskeletli gövde parçası + aksesuar |
| 3 | **Statik süsler** (etiketsiz üst düzey gruplar): deniz kayalıkları `rock_tallA` 36, kazı/harabe heykelleri `statue_column*` 42, adsız gruplar 51, kayalar 10, varil 10, sandık 10, çadır 8, `Root_Scene` 5, kamp ateşi 1; **mağara içi** adsız örgüler 30 (tünel, kubbe, 26 sarkıt, masa — tepenin içinde, limandan görünmez) | 203 | 17 629 | 4 | 188 | **207** | %20 | Her biri `assets.prop` klonu ya da tekil örgü, birleştirme/örnekleme yok: details.js:282-307 (kayalık başına `cloneMat`), props.js:221-231 ve :321-330 (`_placeProp`), :332-444 (`_statue/_grave/_deadTrees/_kemikRuins/_camp`), cave.js:50, :88, :93-101, :169 (mağara parçaları doğrudan sahneye) |
| 4 | **Liman yapıları** (`port-batched`) | 44 | 5 288 | 64 | 11 156 | **108** | %11 | `mergeStatic` malzeme uuid'ine göre birleştirir (batch.js:4-56) ama `texMat` her çağrıda yeni malzeme + doku klonu üretir (port.js:15-20), 7 fenerin her biri 2 benzersiz malzeme (port.js:397-409) → 84 örgü (denetim J-06) |
| 5 | **Arazi** | 44 | 209 024 | 8 | 107 520 | 52 | %5 | 4 LOD halkası (terrain.js:18-23), seg ≥ 32 karolar gölge atar (terrain.js:354) |
| 6 | **Çekirdek ada bitki örtüsü** (palmiye, orman ağacı, eğrelti, ot, çalı, kaya…) | 26 | 303 164 | 10 | 169 894 | 36 | %3,5 (üçgenin **%38**'i) | Tür/parça başına tek dev `InstancedMesh`, sınır küresi ana türlerde 606–779 m (ölçüldü; mercan/yosun gibi detay örneklerinde 780–871 m): görüş konisi ve gölge kutusu ayıklaması işlemez (props.js:17-48, :254-266, :307-319) |
| 7 | Oyuncu karakteri | 16 | 5 845 | 14 | 5 709 | 30 | %3 | Kit parçaları + aksesuar |
| 8 | Balıkçı karakterleri (2) | 12 | 8 308 | 12 | 8 308 | 24 | %2 | `frustumCulled=false`; teknelerinin içinde (details.js:338-353) |
| 9 | Toplanabilir kabuk/istiridye (46) | 16 | 844 | 0 | 0 | 16 | %1,6 | Her biri ayrı geometri + malzeme (details.js:252-271) |
| 10 | Son işleme | 16 | 16 | — | — | 16 | %1,6 | post.js:75-91 |
| 11 | Tehlike setleri | 11 | 1 153 | 0 | 0 | 11 | | hazards.js |
| 12 | Balık sürüleri | 10 | 65 860 | 0 | 0 | 10 | (üçgen %5) | Tür başına `InstancedMesh`, `frustumCulled=false` (fish.js:326-329) |
| 13 | Oyuncu gemisi + kayık (görüş dışında) | 0 | 0 | 14 | 5 286 | 14 | | Gemi örgülerinin hepsi gölge atar (shipModel.js:524) |
| 14 | Okyanus | 1 | 178 802 | — | — | 1 | (üçgen %14) | 300² ızgara (ocean.js:64-89), `frustumCulled=false` (:241) |
| 15 | Bulut (3), gök, martı, dümen suyu, şelale, parçacık, defter | 9 | 21 094 | — | — | 9 | | weatherfx.js:64-77 vb. |
| | **Toplam** | **780** (764 sahne + 16 son işleme) | | **246** | | **1 026** | | |

Sonuçlar:

1. **Çağrıların %79'u dört kaynaktan geliyor**: hayvanlar (333), statik süsler (207), NPC'ler (159), liman yapıları (108). Bunların hepsi görüntü değiştirmeden azaltılabilir (birleştirme, örnekleme, görüş ayıklaması). Denetimin "~200 karakter çağrısı" tahmini (10. belge §10.5) bugün 213'tür (NPC 159 + oyuncu 30 + balıkçı 24).
2. **Üçgenin %38'i çekirdek bitki örtüsü** (473 K: 303 K ana + 170 K gölge), %25'i arazi (316 K), %14'ü okyanus (179 K). Bitki örtüsü kamera nereye bakarsa baksın aynen çizilir; tarama boyunca üçgen sayısının 1,12–1,24 M'de dar kalmasının nedeni budur.
3. **Gölge geçişi (246–276 çağrı, 369 K üçgen) yönden bağımsız**: NPC'ler (100), liman (64), yengeçler (20), bitki (10 çağrı ama 170 K üçgen) ve arazi (8 çağrı, 108 K üçgen). NPC ve yengeçler `frustumCulled=false` olduğu için gölge kamerasının ±55 m kutusunun (sky.js:141) dışında da çiziliyor (three.module.js:9373); bitki örtüsünün dev sınır küresi her zaman kutuyla kesişiyor.

### 2.3 Kamera yönüne göre karakter çağrıları (J-01'in ölçümle doğrulanması)

| Kamera yaw'ı | Toplam | NPC (A/G) | Balıkçı (A/G) | Oyuncu (A/G) |
|---|---|---|---|---|
| 0 (denize) | 607 | 55 / 100 | 17 / 12 | 16 / 14 |
| π/2 | 683 | 81 / 100 | 17 / 12 | 16 / 14 |
| π (kasabaya) | 1 057 | 59 / 100 | 12 / 12 | 16 / 14 |
| −π/2 | 689 | 95 / 100 | 12 / 12 | 16 / 14 |

NPC'lere **sırtını dönmüşken de** 55 ana + 100 gölge çağrısı harcanıyor. Aynı etki uzakta da sürüyor: Kadim Tapınak ormanında (limandan ~7 km) **liman NPC'leri 55 + 55 çağrı**, Kraken savaşında (−4 450, −5 006; limandan ~6,7 km) **55 + 55**, Tuz Pazarı'nda (1,9 km) 15 NPC için **187 + 120 çağrı**.

### 2.4 Uzak ada ayrıntısı (ölçüm)

Açık denizde (en yakın kıyıya ~800 m) 8 yönün 6'sında 387–485 çağrı, Kırlangıç'a bakan iki yönde **962 / 980 çağrı ve 0,90 M üçgen**. Tuz Pazarı'nda limana bakan yön **1 133 çağrı**: o yönde 1,9 km ötedeki liman yapıları 85, deniz kayalıkları 66, adsız süsler 62, kabuklar 45, heykeller 40, demirli oyuncu gemisi 82, balıkçılar 54 çağrı. Kraken savaşında (−4 450, −5 006; limandan ~6,9 km, hayalet bölgesi sisi) Kırlangıç yönüne bakınca **961 çağrı**: liman NPC'leri 121 + 55, liman yapıları 85, adsız süsler 61, deniz kayalıkları 48, kabuklar 31, mağara içi 30, çekirdek bitki 26 (303 K üçgen). İkinci açık deniz koşusunda (−911, 3 057; en yakın kıyı 1,6 km) aynı yön 980 çağrı. Açık havada sis 1,95 km'de %99'a ulaşır (FogExp2 0,0011; sky.js:359), bölge sisinde çok daha yakında; yani bu nesneler ekranda 1–2 piksel ya da tamamen sis rengidir. Bunlar "görünür kaliteyi" düşürmeden kesilebilecek çağrılardır (§3.6). NPC'ler `frustumCulled=false` olduğu için 5 km'lik `camera.far`'ın ötesinde bile çizim çağrısı üretir (GPU kırpar ama çağrı ve köşe işleme harcanır).

### 2.5 Benzetilmiş co-op avatarları (limanda)

`net._remoteState` ile 3 uzak oyuncu (gerçek ağ yok) eklenince **+72 çağrı (30 A + 42 G), +31 K üçgen**: avatar başına ~24 çağrı. Dört oyunculu gerçek ölçümde (§1.5 F) ev sahibinde 3 avatar 67 çağrı, her konukta 93 çağrı.
