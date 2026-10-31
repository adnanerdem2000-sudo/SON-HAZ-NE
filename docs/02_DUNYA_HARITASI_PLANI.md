# 2. Dünya Haritası Planı (uygulanan)

Bu belge **oyunda gerçekten bulunan** dünyayı anlatır; değerler `js/world/archipelago.js`, `js/world/worldData.js`
ve `js/world/terrain.js` kaynaklarından otomatik çıkarılmıştır.

## 2.1 Ölçek ve koordinatlar
- Dünya: **20 × 20 km** (±10 000 m), merkezde v0.2'nin çekirdek takımadası (±1 200 m) korunmuştur.
- Gemiyle her yere gidilebilir; harita kenarına 250 m kala gemi durdurulur ve uyarı verilir (`ship.js`, `WORLD_HALF - 250`).
- Toplam **73 ada**: 6 çekirdek ada + 67 yeni ada (23 el ile tasarlanmış özel ada, 44 yordamsal dolgu adası, sabit tohumla her oyunda aynı).
- 6 liman (Tuz Pazarı Limanı, Kuzeyfener Limanı, Zümrüt Koy Limanı, Kül Limanı, Kumsaati Limanı, Kırlangıç Limanı), 62 ilgi noktası, 123 kazı noktası, 14 batık, 81 balıkçılık bölgesi.

## 2.2 Bölgeler
Bölge, konuma göre `regionAt(x, z)` ile belirlenir (merkezde Ticaret Denizi; kuzey, güney, doğu, batı ve uzak kuzeybatı).

| Kimlik | Ad | Biyom | Yeni ada sayısı | Açıklama |
|---|---|---|---|---|
| `merkez` | Ticaret Denizi | tropik | 13 | Ticaret yollarının kesiştiği ılık sular; limanlar ve küçük adalar. |
| `buzul` | Buzul Denizi | buzul | 12 | Kuzeyin soğuk suları: karlı adalar, buzdağları, kutup ayıları ve kurtlar. |
| `tropik` | Zümrüt Takımadaları | cangil | 13 | Güneyin sık ormanları, bataklıklar ve kadim tapınaklar. |
| `volkan` | Kül Adaları | volkan | 10 | Doğunun kara kumları, lav gölleri ve dumanı tüten dağları. |
| `col` | Kızıl Kum Kıyıları | col | 11 | Batının kavruk kayalıkları, kanyonları, terk edilmiş madenleri. |
| `hayalet` | Hayalet Denizleri | hayalet | 8 | Uzak kuzeybatının sisli, lanetli suları. Ölüler burada uyumaz. |

Her bölgenin kendi atmosferi vardır (`sky.js`): sis rengi/yoğunluğu, ışık tonu, buzulda kar, volkanda kül, Hayalet Denizleri'nde yeşil sis.

## 2.3 Akışlı (streaming) yükleme
| Katman | Yöntem | Değerler |
|---|---|---|
| Arazi | 160 m karolar, Web Worker'da geometri üretimi, LOD halkaları, kenar perdeleri (skirt) | LOD: 380 m → 2 m çözünürlük, 950 m → 5 m, 1 750 m → 10 m, 2 700 m → 20 m |
| Deniz tabanı / derinlik | Oyuncuyu izleyen derinlik penceresi (yarım kayan nokta doku), Worker'da hesap | Derin deniz karoları 300 m içinde |
| Ada içeriği | Yaklaşınca kurulur, uzaklaşınca boşaltılır; karede en fazla bir ada | Kurma 750 m, boşaltma 1 150 m; örneklenmiş çizim (160 m hücreli InstancedMesh) |
| Düşman kampları | Oyuncu yaklaşınca doldurulur, uzaklaşınca kaldırılır | Grup yarıçapı + akış mesafesi |
| Hayvan bölgeleri | 193 bölge; 150 m içinde doğar, 230 m dışında silinir | Saniyede 4 kontrol |
| Deniz devleri | Oyuncu çevresinde 170–370 m'de doğar, 820 m dışında silinir | 3 sn'de bir kontrol |

## 2.4 Keşif ve harita
- Dünya haritası (M): 1024 px temel resim (≈20 m/px), yakınlaştırınca 1 250 m'lik ayrıntı karoları (≈2,4 m/px) istek üzerine çizilir.
- Keşif sisi 256 × 256 hücre (≈78 m), kayıt dosyasına sıkıştırılarak yazılır; v0.2 kayıtlarındaki 64 × 64 sis otomatik dönüştürülür.
- Mini harita bölge ayrıntısını ve gemi görünümünü gösterir; bölgeye/adaya girişte sinematik konum afişi çıkar.

## 2.5 Hızlı yolculuk ve limanlar
Rota Kaptanları keşfedilmiş limanlar arasında ücretli hızlı yolculuk sunar; ölünce en yakın limanda doğulur.
