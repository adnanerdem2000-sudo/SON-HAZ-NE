# 3. Ada ve Biyom Tasarımı (uygulanan)

## 3.1 Biyomlar
| Biyom | Arazi ve bitki örtüsü | Yapı/öğe paleti | Canlılar |
|---|---|---|---|
| Tropik (Ticaret Denizi) | Kumsal, palmiye, çalı, çiçek | Liman kasabaları, kamplar, harabeler | Yengeç, papağan, yaban domuzu, yılan |
| Cangıl (Zümrüt Takımadaları) | Sık orman, bataklık havuzları, lagün | Kadim tapınak, batık şehir, kamp | Maymun, timsah, kurbağa, papağan, domuz, yılan |
| Buzul | Karlı tepeler, çam ormanı, buz kayalıkları | Kuzeyfener limanı, kamplar, harabe | Kurt sürüsü, tilki, geyik, erkek geyik, kutup ayısı, kar canavarı |
| Volkan (Kül Adaları) | Kara kum, bazalt, lav gölü, kükürt gayzerleri | Kül Limanı, obsidyen madeni | Dev yengeç, yengeç, yılan |
| Çöl/kanyon (Kızıl Kum Kıyıları) | Kızıl kaya, mesa, kaktüs | Hapishane, gümüş madeni, kanyon harabesi | Yılan, tilki, dev yengeç |
| Hayalet | Ölü ağaçlar, mezar taşları, yeşil sis | Korsan mezarlığı, sis adası | İskeletler, hayaletler (gece), yengeç |

Bitki örtüsü biyom tablosundan ağırlıklı seçilir; yosun/kar/kül tonları biyoma göre boyanır.

## 3.2 Ada biçimleri
`normal`, `spire` (sivri kayalık), `atoll` (lagünlü halka), `glacier` (buzul), `volcano` (krater + lav gölü),
`mesa` (basamaklı kayalık), `swamp` (havuzlu bataklık). Biçim, yükseklik fonksiyonunda (`geo.js`) ayrı bir profil olarak uygulanır.

## 3.3 Çekirdek takımada (v0.2'den korunan)
| Ada | Yarıçap | Biyom |
|---|---|---|
| Kırlangıç Adası | 270 m | tropik |
| Martı Adacığı | 82 m | tropik |
| Kemik Adası | 135 m | hayalet |
| Papağan Kayalıkları | 48 m | tropik |
| İkiz Adacıklar (Batı) | 44 m | tropik |
| İkiz Adacıklar (Doğu) | 38 m | tropik |

## 3.4 Özel adalar (23)
| Ada | Bölge | Biçim | Yarıçap | Yükseklik | İçerik |
|---|---|---|---|---|---|
| Tuz Pazarı | Ticaret Denizi | normal | 230 m | 34 m | liman (Tuz Pazarı Limanı) |
| Terk Edilmiş Korsan Kasabası | Ticaret Denizi | normal | 210 m | 30 m | yıkık kasaba, haydut kampı, haydut kalesi |
| Gizli Korsan Pazarı | Ticaret Denizi | sivri kayalık | 125 m | 40 m | gizli pazar |
| Fener Kayası | Ticaret Denizi | sivri kayalık | 70 m | 22 m | fener |
| Mercan Halkası | Ticaret Denizi | atol (lagünlü) | 190 m | 7 m | harabe |
| Kuzeyfener | Buzul Denizi | normal | 260 m | 48 m | liman (Kuzeyfener Limanı) |
| Buzdişi Adası | Buzul Denizi | buzul | 430 m | 105 m | haydut kampı, harabe |
| Kurt Adası | Buzul Denizi | normal | 240 m | 60 m | haydut kampı |
| Derin Yarık Kayalıkları | Buzul Denizi | sivri kayalık | 60 m | 26 m | deniz bossu alanı (Derinlik Yılanı) |
| Zümrüt Koy | Zümrüt Takımadaları | normal | 250 m | 46 m | liman (Zümrüt Koy Limanı) |
| Kadim Tapınak Adası | Zümrüt Takımadaları | normal | 480 m | 72 m | kadim tapınak (Taş Muhafız), harabe |
| Timsah Bataklığı | Zümrüt Takımadaları | bataklık | 320 m | 12 m | haydut kampı |
| Batık Şehir | Zümrüt Takımadaları | sivri kayalık | 70 m | 10 m | batık şehir |
| Kül Limanı | Kül Adaları | normal | 230 m | 40 m | liman (Kül Limanı) |
| Ateş Dağı | Kül Adaları | volkan | 540 m | 165 m | kara bossu alanı (Volkanik Dev), haydut kampı |
| Obsidyen Adası | Kül Adaları | normal | 210 m | 50 m | maden |
| Kumsaati | Kızıl Kum Kıyıları | normal | 240 m | 36 m | liman (Kumsaati Limanı) |
| Demirkapı Hapishanesi | Kızıl Kum Kıyıları | mesa (basamaklı) | 270 m | 54 m | hapishane |
| Terk Edilmiş Gümüş Madeni | Kızıl Kum Kıyıları | mesa (basamaklı) | 320 m | 70 m | maden |
| Kızıl Kanyon | Kızıl Kum Kıyıları | mesa (basamaklı) | 380 m | 80 m | harabe |
| Korsan Mezarlığı | Hayalet Denizleri | normal | 320 m | 40 m | mezarlık, mezarlık |
| Sis Adası | Hayalet Denizleri | normal | 210 m | 30 m | harabe, deniz bossu alanı (Lanetli Amiral) |
| Kara Girdap Kayaları | Hayalet Denizleri | sivri kayalık | 55 m | 24 m | deniz bossu alanı (Kraken) |

## 3.5 Yordamsal dolgu adaları (44)
Bölge başına: Ticaret Denizi 8, Buzul Denizi 8, Zümrüt Takımadaları 9, Kül Adaları 7, Kızıl Kum Kıyıları 7, Hayalet Denizleri 5. Her biri bölgesine uygun ad, biçim ve
olasılığa bağlı içerik alır (haydut kampı, harabe/mezarlık, karaya oturmuş gemi), 1–3 kazı noktası ve balık bölgesi.

## 3.6 Özellik sayıları (yeni adalar)
| Özellik | Adet |
|---|---|
| harabe | 14 |
| karaya oturmuş gemi | 12 |
| haydut kampı | 11 |
| liman kasabası | 5 |
| deniz bossu alanı | 3 |
| maden | 2 |
| mezarlık | 2 |
| yıkık kasaba | 1 |
| haydut kalesi | 1 |
| gizli pazar | 1 |
| fener | 1 |
| kadim tapınak | 1 |
| batık şehir | 1 |
| kara bossu alanı | 1 |
| hapishane | 1 |

## 3.7 Çevre etkileşimleri (adalarda)
- Kamplara 2, kalelere 4, madenlere 3 **barut fıçısı**; kamplara/kalelere **kırılabilir sandıklar**.
- Kamp ve madenlerin yamaçlarında (uygun eğim varsa) **kaya tuzağı**.
- Harabelerin yaklaşık %60'ında **basınç plakası bulmacası** (taş blok + kafesli gizli sandık).
- Volkan adalarında 3–5 **buhar gayzeri**; krater lav gölleri yakar.
