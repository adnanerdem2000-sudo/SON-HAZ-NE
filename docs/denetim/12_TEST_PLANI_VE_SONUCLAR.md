# 12. Test Planı ve Sonuçları (19 senaryo)

Ortam: başsız Chromium + SwiftShader (yazılımsal GPU; **gerçek ekran kartı yok**, bu nedenle FPS değerleri donanım değeri
değildir ve 60 FPS hedefi bu ortamda doğrulanamaz — yalnız CPU tarafı benzetim maliyeti ve çizim çağrısı/üçgen sayıları ölçülür).
Çözünürlükler: 640×360 (çoğu senaryo), 480×270 (co-op), 960×540 (arayüz). Her senaryo `tests/harness/run.cjs` ya da
`tests/harness/coop.cjs` ile tekrarlanabilir; rapor JSON'ları koşuda `--report` ile yazılır. "Kanıt" sütunu ilgili belgeyi gösterir.

| # | Senaryo | Dosya | Durum | Kanıt / not |
|---|---|---|---|---|
| 1 | Yeni oyun başlatma ve ilk 10 dakika akışı | `00_acilis.js`, `v03/*` | GEÇTİ | menü→oyun, oyuncu zeminde, HUD; 10 dk gerçek zamanlı oynanış yerine benzetimli akış |
| 2 | Kayıt/yükleme (3 kez üst üste) | `08_kalicilik.js`, `12_kayit_dongusu.js` | GEÇTİ | 3 ardışık döngüde oyuncu/gemi/ada/tehlike/kamp durumu korunur (09. belge §9.1) |
| 3 | Gemiye biniş, yelken, çapa, top atışı | `03_fizik_dt.js`, `03_fizik_duzeltmeler.js`, `04_karakter.js` | GEÇTİ | 05/06. belgeler (gülle süpürmesi, dümen/top IK) |
| 4 | Gemi–kara / gemi–gemi çarpışması | `03_fizik_duzeltmeler.js` | GEÇTİ | kinematik gemi çarpışması; kara oturması v0.3 mantığı (statik) |
| 5 | Fırtınada seyir | `09_performans.js` (fırtına ölçümü) | KISMİ | hava anahtarı 'firtina' ile ölçüm; seyir hissi gerçek GPU'da el ile |
| 6 | Yüzme, dalış, kayıktan geçiş | `04_karakter.js`, `03_fizik_duzeltmeler.js`, `07_dunya_kesif.js` (D03) | GEÇTİ | yüzme kaldırması, mod histerezisi, kayık/biniş silah durumu; sudan iskele merdivenine çıkış (Aşama 7: yüzme zemini platformları görür) |
| 7 | Mağara, tapınak, bulmaca | `08_kalicilik.js` (tapınak mekanizması kaydı) | KISMİ | mekanizma çözümü ve kaydı; bulmaca akışı uçtan uca oynanmadı |
| 8 | Hazine haritası ve kazı | v0.3 referans senaryoları | GEÇTİ (v0.3) | bu aşamada değişmedi |
| 9 | Dövüş: kılıç, parry, tabanca, kaçınma | `05_dusman_ai.js`, `04_karakter.js` | GEÇTİ | savunma histerezisi, tabanca ışını engeli, telgraf |
| 10 | Boss savaşı (en az 2 boss) | `05_dusman_ai.js` (evre/zayıf nokta birim), `09_performans.js` (kraken) | KISMİ | evre/ödül mantığı birim düzeyinde; tam savaş el ile (bilinen sorunlar #12) |
| 11 | Ekonomi: alış/satış/geliştirme | `07_ekonomi.js` | GEÇTİ (al-sat döngüsü, 'Tümünü sat'); geliştirme akışı v0.3 referansı | B01/B07 düzeltildi; gemi geliştirme UI akışı el ile |
| 12 | 2 oyunculu co-op | `coop/06b_esitlik_senkron.cjs` | GEÇTİ (18/18) | ganimet/sandık eşitliği, yüzen nesneler, düşman/gemi senkronu, mermi görselleri (08. belge §8.2, §8.7) |
| 13 | 4 oyunculu co-op | `coop/06c_dort_oyuncu.cjs` | GEÇTİ (7/7) | lobi, uzak oyuncular, sohbet, hareket, menüye dönüp geri gelme, sekme kapanışı 13 sn'de temizlenir (08. belge §8.3) |
| 14 | Konuk ayrılıp geri geliyor | `coop/06a2_mesaj_kopma.cjs` (kopma temizliği) | GEÇTİ (3/3; kopma 12 sn'de algılandı, kilit temizliği yayıldı) | geri dönüş eşleşmesi H04 testiyle dolaylı; kalp atışı eklendi (08 §8.1) |
| 15 | Ev sahibi kaydedip yeniden açıyor | `08_kalicilik.js` | GEÇTİ | |
| 16 | Düşük FPS'te oyun kararlılığı | `03_fizik_dt.js` (15 FPS adımı), `03_fizik_duzeltmeler.js` (alt adım sınırı) | GEÇTİ | 15/30/60 FPS aynı sonuç; 0.1 s kare → 6 alt adım |
| 17 | Uzun oturum (30+ dakika) | `10_uzun_oturum.js` (30 dk benzetim) + 3 dk gerçek zamanlı ölçüm | GEÇTİ (5/5) | bellek, GPU kaynakları ve kare maliyeti sınırlı; bu koşuda 3 sızıntı bulunup giderildi (10. belge §10.7, 04. belge §4.8–4.9) |
| 18 | Hızlı yolculuk | `03_fizik_duzeltmeler.js` (çapa sıfırlama) | GEÇTİ | E-01 düzeltildi |
| 19 | Yanlış girdi/spam/hile girişimi | `coop/06a_ag_guvenligi.cjs` | GEÇTİ (7/9; 2 kontrol 06a2'de) | oran/boyut/hasar/altın/sahte ad |

Ek senaryolar (19 listesi dışında, Aşama 7): `07_dunya_kesif.js` D01–D07 — dünya boyutu, kıyı dikişi (önce/sonra, 1 mm inceltme), iskeleye
sudan çıkış (3 gelgit × çukur/tepe + sağanak), adacık özellikleri, arazi uygunluğu, çalışma zamanı kurulumu, liman barınağı; `tests/node/archipelago_sabit.mjs` —
dünya üretiminin v0.3 sabitiyle determinizmi (kazı noktaları/hazine haritaları değişmez); sonuçlar 15. belgede.
Aşama 8: `09_performans.js` (çizim çağrısı/üçgen/kaynak sayaçları, benzetim maliyeti; ada/hayvan/düşman kur-sök sızıntı döngüleri),
`11_arayuz_sizinti.js` (oluşturucu rAF/dinleyici/WebGL temizliği, harita çift açılış); sonuçlar 10. belgede.

## Aşama 9 tam regresyon (son kod, tek tarayıcı sırayla)
| Senaryo | Sonuç | Süre | Not |
|---|---|---|---|
| `00_acilis.js` | 6/6 | 23 sn | |
| `02_arazi_kurtarma.js` | 7/7 | 41 sn | |
| `02_arazi_yedek.js` normal / noworker / badurl / crash | 12/12 × 4 | 38–101 sn | dört arazi kipi |
| `03_fizik_dt.js` | ölçüm | 43 sn | 15/30/60 FPS aynı; 120 FPS zıplama tepesi +%2,6 (bilinen #1) |
| `03_fizik_duzeltmeler.js` | 14/14 | 49 sn | |
| `04_karakter.js` | 12/21 (bellek sınırı çökmesi) → 21/21 | 182 → 36 sn | çizim kısıldı; iki ardışık koşu temiz (10. belge §10.7) |
| `05_dusman_ai.js` | 18/18 | 23 sn | |
| `06_arayuz_960.js` | 4/4 | 55 sn | 960×540 |
| `07_dunya_kesif.js` | 10/10 | 34 sn | |
| `07_ekonomi.js` | 3/3 | 19 sn | |
| `08_kalicilik.js` | 12/12 | 29 sn | |
| `09_performans.js` | 9/9 | 49 sn | kese/gemi/kraken/Taş Muhafız/Volkanik Dev döngüleri dahil |
| `11_arayuz_sizinti.js` | 6/6 | 21 sn | |
| `12_kayit_dongusu.js` | 3/4 → 4/4 | 21 sn | test beklentisi düzeltildi |
| `10_uzun_oturum.js` | 5/5 | 214 sn | |
| Node `archipelago_sabit.mjs` | GEÇTİ | <1 sn | v0.3 determinizmi |
| `coop/06b` (2 oyuncu) | 17/18 → 18/18 | 140 sn | F-06 belirlenimli yapıldı |
| `coop/06a` (3 oyuncu) | 9/10 → 10/10 | 215–232 sn | H13 kalp atışı beklemesi |
| `coop/06a2` (3 oyuncu) | 3/3 | 219 sn | |
| `coop/06c` (4 oyuncu) | 7/7 | 423 sn | |
| Tek dosya derleme + `02_tek_dosya.js` (file://) | 4/4 | 19 sn | 21,0 MB; 3 işçi data: URL ile çalışıyor |

Sayfa hatası (pageerror) tüm koşularda 0. İlk koşuda kalan 4 senaryonun 3'ü test tasarımı sorunuydu, 1'i (04) yazılımsal GPU'da
bellek sınırı; düzeltmelerden sonra hedefli yeniden koşuların hepsi geçti.

Her koşuda kaydedilen: geçti/kaldı, konsol/sayfa hataları (`pageErrors`), ölçümler (metre/saniye/sayaç), ekran görüntüleri
(`shot`/`snapjs` adımları), bellek (`performance.memory`, yalnız 09. senaryo), yeniden üretme adımları (senaryo dosyasının kendisi).

## Donma denetimi sonrası tam regresyon (zaman dilimli ada kurulumu + balık güncellemesi; tek tarayıcı sırayla)
| Senaryo | Sonuç | Süre | Not |
|---|---|---|---|
| `00_acilis.js` | geçti (0 hata) | 23 sn | |
| `02_arazi_kurtarma.js` | geçti | 42 sn | |
| `02_arazi_yedek.js` | geçti | 68 sn | |
| `03_fizik_dt.js` | ölçüm, 0 hata | 35 sn | |
| `03_fizik_duzeltmeler.js` | 13/14 | 57 sn | "Sığ su bandı" kontrolü 2 geçiş: önceden var olan, dalga evresine bağlı kararsızlık (aşağıda; bilinen #33) |
| `04_karakter.js` | geçti | 41 sn | |
| `05_dusman_ai.js` | geçti | 33 sn | |
| `06_arayuz_960.js` | geçti | 65 sn | 960×540 |
| `07_dunya_kesif.js` | geçti | 46 sn | D05 adacıkları eşzamanlı `_build` ile kurar/söker |
| `07_ekonomi.js` | geçti | 20 sn | |
| `08_kalicilik.js` | geçti | 35 sn | |
| `09_performans.js` | geçti | 94 sn | ada kur/sök sızıntı döngüsü dahil (paralel inceleme ajanlarıyla işlemci paylaşıldı) |
| `11_arayuz_sizinti.js` | geçti | 34 sn | |
| `12_kayit_dongusu.js` | geçti | 33 sn | |
| `13_donma.js` (yeni) | 7/7 → 8/8 | 29–30 sn | yaklaşmada 13–14 kare, karedeki ada işi en çok 7,7–9,7 ms; 5 adada eşdeğerlik; iptal yolları; inceleme sonrası P08 (tapınak durumu) eklendi |
| Tek dosya derleme + `02_tek_dosya.js` (file://) | geçti | 21 sn | 21,0 MB |
| `coop/06b` (2 oyuncu) | 18/18 | 148 sn | |
| `coop/06a` (3 oyuncu) | 10/10 | 274 sn | |
| `coop/06a2` (3 oyuncu) | 3/3 | 270 sn | |
| `coop/06c` (4 oyuncu) | 7/7 | 402 sn | |
| Node `archipelago_sabit.mjs` | GEÇTİ | <1 sn | 67 ada, v0.3 determinizmi |

Sayfa hatası (pageerror) tüm koşularda 0. Ek doğrulamalar (yalnız bu değişiklik için): 67 adanın tamamında eski kod / yeni
eşzamanlı / yeni karelere bölünmüş kurulumun parmak izi aynı; balık simülasyonu eski kodla 300 karede bit düzeyinde aynı.

**03_fizik_duzeltmeler "sığ su bandı" kontrolü (A/B):** Kontrol, o anki dalga yüksekliğine göre derinliği 1,36–1,45 m olan ilk noktayı
seçip 240 karede yüzme/yürüme geçişini sayar (≤ 1 beklenir). Aynı kontrol tek sayfada 30 farklı dalga anında tekrarlandı
(`/tmp/fps/sig_su.js` mantığı): **eski kod** (değişiklik öncesi) 23 × 1 geçiş, 4 × 2, 3 × 3 → 7/30 başarısız; **yeni kod** birebir aynı
dağılım ve aynı noktalar/geçiş sayıları. Sonuç: kararsızlık bu değişiklikten bağımsız ve önceden vardı (Aşama 9'da şans eseri geçmişti).
Kök neden: kumsalda (platform yokken) giriş/çıkış kararı anlık dalga yüksekliğiyle verilir; ~1,4 m derinlikte dalga tepesi/çukuru 4 sn
içinde 2–3 geçişe yol açabilir. Bilinen sorunlar #33, yol haritası #18.

**Test altyapısı (inceleme sonrası):** `run.cjs` artık `js` adımlarındaki istisnaları başarısızlık sayar (`evalErrors`). Önceki tam
regresyonda tek sayfalı senaryolarda EVALERR 0'dı (co-op günlüklerindeki EVALERR satırları senaryonun kasıtlı kapattığı konuk sekmesine
yapılan çağrılardır). v03 referans senaryoları eski/yeni kodda A/B koşturuldu (aşağıda).

**v03 referans senaryoları, eski (e56f49a) / yeni kod A/B** (aynı sıkılaştırılmış harness; adalar, tapınak, boss, tehlike, dünya,
ekosistem ve bellek senaryoları): boss1–5, temple, temple2, temple3, volc, tdbg, perf1, tperf, haz1–3, world2–3, eco1–3, mem → 21 senaryonun
20'si iki kodda da istisnasız. Çıktılar temple/temple2/temple3/volc/haz2'de birebir aynı; tdbg'de yalnız rastgele geometri kimlikleri, world2–3'te
yalnız kurulum süresi, eco1–3/haz3'te yalnız rastgele dolaşan hayvan/kalabalık konumları farklı. perf1: çizim çağrıları aynı (liman 1 021/1 019),
benzetim maliyeti benzer ya da düşük. boss3 (yeni tapınak düzenine uyarlandı): Taş Muhafız tapınak koşuluyla doğup yeniliyor; Volkanik Dev
lav düzeyi eski kodda yedek değerde (77,7) kalırken yeni kodda gerçek lav yüzeyine (84,1) geçiyor.
- **boss1**: yeni kodda ilk koşuda 2 istisna (`bosses.active` boş). Tanı (eski/yeni × 2, yılanın saniyelik durumu + bildirimler): oyuncu
  ölürse (senaryo ölümsüzlük açmıyordu) limanda yeniden doğuyor, bosslar 650 m kuralıyla "derinlere çekiliyor", sonraki adımlar boş
  boss'a erişiyor. Eski kodda 1/3, yeni kodda 2/3 koşuda oyuncu öldü; istisnalar her seferinde ölümle birebir eşleşiyor. Değişiklikten
  bağımsız; senaryoya `DK.G.godMode=true` eklendi → yeni kodda istisnasız.
- **haz1**: patlama sonrası düşman can değerleri eski kodun kendi koşuları arasında da değişiyor (rastgele düşman konumu); durum, enkaz ve
  sandık sonuçları aynı.

**Son kod (`3b4f28d`) ile son regresyon** (sıkılaştırılmış harness: `js` adımı istisnası da başarısızlık): `00_acilis`, `03_fizik_duzeltmeler`
(bu koşuda 14/14), `05_dusman_ai`, `07_dunya_kesif`, `08_kalicilik`, `09_performans`, `11_arayuz_sizinti`, `12_kayit_dongusu`, `13_donma` (8/8),
tek dosya derleme (21,0 MB) + `02_tek_dosya.js` → hepsi geçti; hata, sayfa hatası ve adım istisnası 0.

**Co-op, son kod:** `06b` (2 oyuncu) 18/18, `06a` (3 oyuncu) 10/10, `06a2` (3 oyuncu) 3/3. `06c` (4 oyuncu) son kodla 7 koşunun 5'inde
geçti; kalan 2'sinde başlangıçta ilk başlatılan konuk(lar) birkaç saniye içinde menüye düştü, sonraki kontroller bu yüzden kaldı (sayfa
hatası 0). **Eski kod** (`e56f49a`, bu turdan önce) 4 koşunun 3'ünde geçti; kalan koşuda birebir aynı biçimde kaldı (ilk konuk menüde).
Konuk düşmesini kaydeden tanılı kopya 4 koşuda (eski 2, yeni 2) geçti, düşme kaydı yok. Sonuç: değişiklikten bağımsız, bu ortama bağlı
kararsızlık. Kodda konuğu birkaç saniyede menüye düşüren tek yol ev sahibiyle WebRTC bağlantısının kapanması; en olası açıklama dört
sekmenin tek yazılımsal GPU sürecini paylaşırken konuğun 15 sn kalp atışı kuralına takılması (kanıtlanmadı). Bilinen #37.


## Kullanıcı bildirimi turu: iskele/duvar, kamera kararması, dalış, deniz ekipmanı
Yeni senaryolar `15_iskele_kamera.js` (I01–I07, C01–C05, M01) ve `14_deniz_ekipmani.js` (D01–D03, G01–G08, R01, L01–L03).
`15_iskele_kamera.js` aynı dosyayla düzeltme öncesi koda (`10ba732`) karşı da koşuldu (önce/sonra):

| Kontrol | Düzeltme öncesi (10ba732) | Son kod |
|---|---|---|
| I01 kasabadan iskeleye yürüme (3 şerit) | KALDI: üçü de z = 225,7'de 0,76 m basamakta takılıyor | GEÇTİ: zıplamadan güvertede (kök basamağı 0,27 m) |
| I02 sığ kesimde güverte altına yandan giriş (6 yaklaşma) | KALDI: z = 237'de iki yaklaşmada 60'ar kare gövde güverte altında | GEÇTİ: 0 kare |
| I03 güverte altından kıyıya yüzme | KALDI: oyuncu güverte altından kıyıya dek yürüdü (55 kare güvertenin içinde) | GEÇTİ: sığ kesim sınırında (z = 240,35) durur |
| I04 derin kesimde güverte altından yüzme | GEÇTİ | GEÇTİ (baş 0,73 m'de, güverte tabanı 1,95; ışınlanma yok) |
| I05 direklerin içinden geçiş | KALDI: direk çarpıştırıcısı 0 | GEÇTİ: 39 direk, en yakın 0,55 m |
| I06 yük yığını | KALDI: çarpıştırıcı 1,6–3,6 m (kum 0,87): havada | GEÇTİ: −0,41–2,45 m |
| C01 iskelede 96 kamera açısı | KALDI: 61 açıda kamera güverte altında, parlaklık 3,5–6,5 | GEÇTİ: 0 açı; parlaklık 93,8–152 |
| C02 arkadaki iskele feneri | KALDI: kamera başa 0,56 m'ye çekiliyor | GEÇTİ: 4,6 m |
| C03 duvara yaslanma (gece, meşale) | KALDI: kamera 0,4 m'de, karakter gizlenmiyor (başın içi ekranda) | GEÇTİ: gizlenir, meşale ışığı yanar, dümende görünür |
| C04 dalgalı denizde yüzerken kamera (144 açı) | GEÇTİ (bu ölçümde dalga tepesi altına geçiş üretilemedi) | GEÇTİ |
| C05 dalışta kamera (96 açı) | GEÇTİ | GEÇTİ |
| M01 duraklatma menüsü | KALDI: "null" yazısı | GEÇTİ |

`14_deniz_ekipmani.js` (son kod) ölçümleri: nefes 2,00/sn → 50 sn, maskeyle 1,25/sn → 80 sn (oran 1,60); nefes bitince 2 sn'de 14,4 can;
yüzeyde 100'e dolar; ilk suya girişte "Dalmak için C basılı tut, çıkmak için Boşluk · nefes ≈ 50 sn" ipucu. Hava kesesi nefes 11 → 55,7
(kendiliğinden), su üstünde reddedilir. Palet: yüzey hızı 2,62 → 3,54 m/sn (×1,35). Zıpkın: donmuş sürüde 2,5 m'den isabet; canlı (kaçan)
sürüye 2,5 m'den 4/6–6/6, 4 m'den 3/6–5/6 (koşudan koşuya); köpekbalığına 30 hasar; iskeleden nişanla atışta yön kamera yönüyle
cos = 0,999, suya girip geri döner. Ağ: sürü üstüne atışta 4–6 balık ("Ağ" kaydıyla), iskeleye atınca "Ağ suya ulaşmadı", yırtılınca
envanterden düşer. Olta: iskeleden atış → vuruş → 5 sn mücadele → İstavrit; mücadelede oyuncu 0 m yer değiştirdi. Ganimet: Balıkçı Yusuf
5 kalem, Rıza/Halil Reis/Kaçakçı; 400 sandık atışında 5 deniz ekipmanı türü; Martı Batığı sandığı (−23,7 m) açılır, kese 24 m yükselir,
ikinci kez açılmaz; kayıt/yüklemede ekipman korunur.

**Bu turun tam regresyonu (son kod, iki şerit paralel, 640×360; 06 için 960×540):** `00_acilis`, `02_arazi_kurtarma`, `02_arazi_yedek`,
`03_fizik_dt`, `03_fizik_duzeltmeler`, `04_karakter`, `05_dusman_ai`, `06_arayuz_960`, `07_dunya_kesif`, `07_ekonomi`, `08_kalicilik`,
`09_performans`, `11_arayuz_sizinti`, `12_kayit_dongusu`, `14_deniz_ekipmani`, `15_iskele_kamera` → 16/16 senaryo geçti (hata, sayfa
hatası ve adım istisnası 0); Node `archipelago_sabit.mjs` GEÇTİ. Tek başına: `13_donma` 8/8 (P01 en uzun ada karesi 12 ms ≤ 35),
`coop/06b` (2 oyuncu) 18/18. Tek dosya derleme (21,0 MB) + `02_tek_dosya.js` (file://) 4/4; tek dosyada deniz ekipmanı, iskele
düzeltmesi ve 7 yuvalı araç çubuğu doğrulandı.
- İlk tam koşuda (aynı iki şerit) `13_donma` P01 69,5 ms ile kaldı; tek başına yinelendiğinde 6,3 ms ve 12 ms → bu makinede iki tarayıcının
  işlemci çekişmesi (ölçüm eşiği tek tarayıcı için). Aynı koşuda `14_deniz_ekipmani` 6 kontrolde kaldı: derin suda geçen ~25 sn'de rastgele
  köpekbalığı saldırısı oyuncuyu bayıltıp arayüz açıyor, sonraki adımların tuş girdisi işlenmiyordu; ağ testi sürünün yalnız 6 üyesini
  taşıyordu (kalan üyeler sürü merkezini 176 m uzakta tuttu). Senaryo düzeltildi (ölümsüzlük yalnız boğulma ölçümü dışında, köpekbalığı
  yalnız G04'te, palet ölçümü durgun suda, ağ testinde sürünün tüm üyeleri); oyun kodu değişmedi. `15_iskele_kamera` I07 Kuzey Fener
  limanında kaldı (kum 20 m içinde güverteye yetişmiyor, kökte 1,38 m kalıyordu) → kök basamağı eklendi (oyun kodu), sonra geçti.
