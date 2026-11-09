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

## Kullanıcı bildirimi turu: koşarken takılma, başını yere gömme, av eti, yerden toplananlar çantaya
Senaryolar: `tests/scenarios/16_kosu_poz_ganimet.js` (tek oyunculu) ve `tests/scenarios/coop/06d_ganimet_canta.cjs` (2 oyuncu).
"Önce" sütunu aynı test kodunun önceki sürümde (HEAD 0a2d8cc, 8080) koşturulmasıdır; ölçümler başsız Chromium + SwiftShader, 640×360.

| Kontrol | Önce (HEAD 0a2d8cc) | Sonra (son kod) |
|---|---|---|
| K01 açık kumsalda 1,0–1,5 m derinlikte 20 sn bekleme (36 durum) | KALDI: 1,25–1,4 m'de 2–6 kip geçişi (en çok 6) | GEÇTİ: en çok 1 geçiş |
| K02 kıyı boyunca ≈1,2 m derinlikte 8 sn yürüyüş | GEÇTİ: 0 geçiş | GEÇTİ: 0 geçiş |
| K03 iniş duraksaması | KALDI: yerinde zıplamada ve 1,2 m inişte 0,3 sn duraksama | GEÇTİ: zıplama ve 1,2 m'de yok, 2,5 m'de var |
| P01 yüzme eğimi yüzme dışında | KALDI: karada gövde eğimi 1,2 rad (yüzüstü), kaldırma 1 m kalıyor; doğmada 0,05 m havada | GEÇTİ: 0 |
| V01 varil/kristal kaya modeli merkezi | KALDI: 2,5 m kaymış; yüzen varil toplama noktasından 10 m ötede çiziliyor | GEÇTİ: 0 / 0,01 m |
| A01–A04 av ganimeti, köpekbalığı, et kızartma, maymun muzu | KALDI: domuzdan et yok (A01 hata), köpekbalığı kesesi yok, et ve kızartma seçeneği yok | GEÇTİ: 15 tür, köpekbalığı eti/dişi, kızartma (çanta sınırında 6 pişti 4 çiğ kaldı), muz geri düştü |
| T01–T02 dolu çantada kabuk, bırak/geri al | KALDI | GEÇTİ |
| K05 16 sn W+Shift (dayanıklılık biter) | KALDI: 8 sprint geçişi, kare başı en büyük hız düşüşü 0,51 m/s | GEÇTİ: 3 geçiş, 0,15 m/s |
| K06 koşarken 4 × 90° dönüş | GEÇTİ (bu senaryoda titreme üretilemedi) | GEÇTİ |
| Çömelme (C basılı, 3 sn bekleme) — baş yüksekliği | −0,28 … 0,85 m (baş yerin altına iner) | 0,82–0,84 m sabit; ayağa kalkınca 1,15–1,17 m |
| Ragdoll sonrası yürüyüşte en düşük baş (ölüm öncesi 1,06 m) | 0,35 m | 1,06 m |
| T07 koşarak kesenin üstünden geçme | KALDI: kese 3,02 m fırladı | GEÇTİ: 0 m |
| T03 kısmen sığan kese | KALDI: kese silindi, yanına yeni kese fırladı; dolu çantada istem yine "Ganimeti topla" | GEÇTİ: aynı kesede 2 post kaldı; "Ganimet — çantan dolu" (öncelik 0,4) |
| T04 güverteye düşen kese | KALDI: kese güvertenin (1,12 m) içinden 0,27 m'ye düştü, güverteden alınamıyor ("Yelkenleri aç" istemi) | GEÇTİ: güvertede, gemiyle 3,8 m gider, E ile alınır; gemi kalkınca suya düşüp yüzer |
| T05 kayıktan yüzen varil/kese | KALDI: istem "Gemiye çık" | GEÇTİ: "Yüzen varili al", içerik çantaya; kese de alınır |
| T06 envanterden "Yere bırak" | KALDI: kılıç elde kaldı, kese 400 sn sonra yok | GEÇTİ |
| T08 sandık açma | KALDI: içerik kese olarak doğdu (kazılan, ada, batık) | GEÇTİ: doğrudan çantaya, kese 0 |
| T09 HUD çanta yükü | KALDI: gösterge yok | GEÇTİ: "Çanta 27/45 kg", dolunca kırmızı |
| T10 güverteden yüzen nesne | KALDI: istem "Yelkenleri aç" | GEÇTİ: "Şişeyi al (kancayla)" |
| coop C01–C06 (konuk bırakma/geri alma, konuğun açtığı sandık, kısmi kese eşitleme, güverte kesesi, av XP'si) | 5 kontrol KALDI (konuğun bıraktığı kese ev sahibinde hiç doğmadı) | 9/9 GEÇTİ |

Toplam: `16_kosu_poz_ganimet.js` (23 kontrol) eski kodda 20 kontrol kaldı (K02 ve K06 eski kodda da geçiyor), son kodda 23/23;
`coop/06d_ganimet_canta.cjs` eski kodda 5 kontrol kaldı, son kodda 9/9. Harita karosu: skaler piksel döngüleri eski çıktıyla birebir
aynı (4 karoda 8×8 ortalama farkı 0); karo başına uzun görev (yazılımsal GPU) eski 69–653 ms, yeni 98–635 ms — değişmedi (11. belge #45).
Bellek (yalnız testin kendi süreç ağacı): 04_karakter tepe 1,17 GB / 36 sn (eski 1,18 GB / 40 sn); 09_performans tepe 2,55 GB (eski 2,68 GB).

**Bu turun tam regresyonu (son kod, iki şerit paralel, 640×360; 06 için 960×540):** `00_acilis`, `02_arazi_kurtarma`, `02_arazi_yedek`,
`03_fizik_dt`, `03_fizik_duzeltmeler`, `04_karakter`, `05_dusman_ai`, `06_arayuz_960`, `07_dunya_kesif`, `07_ekonomi`, `08_kalicilik`,
`11_arayuz_sizinti`, `12_kayit_dongusu`, `14_deniz_ekipmani`, `15_iskele_kamera`, `16_kosu_poz_ganimet` → 16/16 geçti (hata, sayfa
hatası, adım istisnası 0); Node `archipelago_sabit.mjs` GEÇTİ. `09_performans` paralel şeritte "Target crashed" ile kaldı (düşman
doğur/kaldır adımından hemen sonra; bellek sonlandırması yok); tek başına yinelendiğinde son kodda 0 hata (tepe 2,55 GB), eski kodda da
0 hata (2,68 GB) — bu ortamda iki tarayıcıyla bellek sınırına yakın, kodla ilgili değil. Tek başına: `13_donma` 0 hata, `coop/06b`
18/18, `coop/06d` 9/9. Tek dosya derleme (21,0 MB) + `02_tek_dosya.js` (file://) 4/4; tek dosyada yeni toplama/poz kodu ve HUD çanta
göstergesi doğrulandı.
- Bu turun ilk iki tam koşusu geçersiz sayıldı: (1) üçüncü bir tarayıcı (ek ölçüm) ve inceleme ajanlarıyla işlem grubunun 14,3 GB sınırı
  aşıldı, çekirdek sayfaları sonlandırdı (11. belge #52); (2) ikinci koşu, inceleme bulgusu için yapılan kamera düzeltmesindeki bir hatayı
  yakaladı: `_col` başlangıçtaki sonsuz değerden sönümlenince NaN oluyor, kamera duvarlarda hiç yaklaşmıyordu (04 C07, 15 C03 kaldı) →
  düzeltildi, son koşuda ikisi de geçti.

## Kullanıcı bildirimi turu: kamera dönerken ekran kararması
Senaryo: `tests/scenarios/17_kamera_kararma.js` (K01–K12). "Önce" sütunu aynı test kodunun önceki sürümde (HEAD 78c9103, 8080)
koşturulmasıdır; başsız Chromium + SwiftShader, 640×360. Parlaklık testleri (K05, K08) sahneyi 160×90'lık yarım kayan noktalı hedefe
çizip okur (11. belge #57), K10 son işlemli ekranı okur.

| Kontrol | Önce (HEAD 78c9103) | Sonra (son kod) |
|---|---|---|
| K01 Kenney modellerinde tam metal malzeme (18 model) | KALDI: tüm malzemeler metalness 1 | GEÇTİ: 0 |
| K02 yakın-kamera silinme kancaları | KALDI (modül yok) | GEÇTİ: 11 örnekli bitki çizimi, gemi `sail`+`rail`, oyuncu `self`, NPC/hayvan `char` |
| K03 silinme gölgelendiricisi (siyah düzlem 0,3 / 1,1 / 4 m) | KALDI (modül yok) | GEÇTİ: 0,3 m'de görüntü düzlemsizle aynı (siyah oranı 0,027), 1,1 m'de 0,533, 4 m'de 1,0 |
| K04 güverte 4 nokta × 2 eğim × 24 açı: görüş hattı gövdeyi kesiyor | KALDI: 4 / 5 / 10 / 6 ihlal (ambar, baş, kıç direk, yelken açık) | GEÇTİ: 0 |
| K05 güverte alttan bakış (−0,25), 3 nokta × 16 açı | KALDI: kıç direkte en düşük 36 (medyan 85), 3 karanlık kare | GEÇTİ: en düşük 80–85, karanlık 0 |
| K06 iskelede gemi yanında 2 × 24 açı | KALDI: 1 ihlal | GEÇTİ: 0 |
| K07 mağara: kamera tünel kesitinin dışında (72 konumdan) | KALDI: tünel 53, tünel-2 56, duvar dibi 47, oda 35 | GEÇTİ: 0 / 0 / 0 / 0; kamera–baş medyanı 2,45 / 2,51 / 0,97 / 2,77 m |
| K08 orman (2 × 32 açı) ve palmiyeler (2 × 16) | KALDI: ormanda en düşük 38 (medyan 66), 1 karanlık kare | GEÇTİ: en düşük 56,6 (medyan 70), 0 |
| K09 su altı histerezisi (+50 / −6 / −20 / −2 / +5 cm) | KALDI: −6 cm'de sis açılıyor, −2 cm'de kapanıyor | GEÇTİ: kapalı / kapalı / açık / açık / kapalı |
| K10 kameranın 1 m önünde NaN / Inf yazan 5 cm'lik yüzey | KALDI: kare tümden siyah (parlaklık 131 → 0 / 0) | GEÇTİ: 131,6 / 131,6 (değişmez) |
| K11 sıfır normalli yüzey: yarım kayan noktalı hedefte bozuk piksel | KALDI: yumuşak gölgede 768 NaN/Inf piksel | GEÇTİ: 0 (yumuşak ve düz gölge) |
| K12 görüş çizgisi silindiri: 2,6 m'deki siyah bitki düzlemi (ekran ortası 1/8) | KALDI (modül yok) | GEÇTİ: silindir açıkken düzlem ortada görünmez (siyah oranı 0,125 = düzlemsiz), kapalıyken 1,0 |

Toplam: eski kodda K01–K11'in 10'u kaldı (K12 eski kodda da kalır: modül yok), son kodda 12/12 (tepe bellek 2,3 GB).

**Tam siyah kare avı:** 4 konumda (iskele feneri, pazar, gemi başı, gemi yanında iskele) 3 tur × 3 eğim × 96 açı = 3 456 kare; her
siyah karede sahne yarım kayan noktalı hedefe çizilip NaN/Inf pikseller sayıldı ve görünür nesneler ikiye bölünerek suçlu arandı. Eski
kodda 1 siyah kare yakalandı (pazar, eğim −0,25): 3 bozuk piksel (ekranın sol kenarı), 11 adımda suçlu tek nesneye indi — rüzgârla
sallanan, düz gölgeli prosedürel orman ağacı (264 örnek, MeshStandardMaterial, roughness 0,9). Önceki taramalarda aynı türden tek
siyah kareler: pazar ve açık deniz (eski kod), iskele feneri (ara sürüm). Düzeltme: sıfır/NaN normal koruması + parlama girişini
arındırma (K10, K11). Aynı av, normal korumasından önceki ara sürümde paralel koşuldu ve siyah kare yakalamadan 1 877 sn'de tarayıcı
belleği yüzünden çöktü (ekran arabelleği okumaları, 11. belge #57); son kodla av yinelenmedi. Siyah kare seyrek (tüm ölçümlerde
~9 500 karede 4 kez, yaklaşık 2 400 karede bir) olduğundan düzeltme olasılıksal av yerine K10/K11'in belirlenimci denemeleriyle doğrulandı.

**Bu turun tam regresyonu (son kod, iki şerit paralel, 640×360; 06 için 960×540):** `00_acilis` 6/6, `02_arazi_kurtarma` 7/7,
`02_arazi_yedek` 12/12, `03_fizik_dt` (hata 0), `03_fizik_duzeltmeler` 14/14, `04_karakter` 21/21, `05_dusman_ai` 18/18,
`06_arayuz_960` 4/4, `07_dunya_kesif` 10/10, `07_ekonomi` 3/3, `08_kalicilik` 12/12, `11_arayuz_sizinti` 6/6, `12_kayit_dongusu` 4/4,
`14_deniz_ekipmani` 16/16, `15_iskele_kamera` 14/14, `17_kamera_kararma` 13/13 (sayılar başlangıç kontrolü dahil) → hata, sayfa
hatası, adım istisnası 0. Görüş çizgisi silindiri ve derinde başlama dalış kuralı bu koşudan sonra eklendi; çizime ve yüzmeye
duyarlı senaryolar son kodla yinelendi: `04_karakter` 21/21, `14_deniz_ekipmani` 16/16, `15_iskele_kamera` 14/14, `17` 13/13,
`13_donma` 9/9, `09_performans` 9/9. `16_kosu_poz_ganimet` ilk koşuda T04'ten sonra 9 kontrolde kaldı: rastgele başlayan düşman gemisi olayında
`events.crew` hiç başlatılmamıştı, sonraki her güncelleme `crew.filter`'da çöktü (önceden var olan, rastgeleliğe bağlı hata) →
`events.js` düzeltildi, tek başına 23/23; o yolu bilerek tetikleyen deneme eski kodda çöküyor, yenide çökmüyor. Tek başına:
`09_performans` 9/9, `13_donma` 9/9, `coop/06b` 18/18, `coop/06d` 9/9; Node `archipelago_sabit.mjs` GEÇTİ.

**Parlaklık taraması (önce / sonra):** 26 konumda kamera oyuncu gibi tam tur döndürüldü (her eğimde 48 açı; 2 eğim, açık denizde
2 × 96), 320×180, saat 11:00, açık hava; son işlemli ekranın ortalama parlaklığı (Rec.709 luma, 0–255). "Karanlık" = parlaklık
konumun medyanının %60'ının altında ya da piksellerin yarısından fazlası koyu (luma < 28); parantezdeki sayı yalnız parlaklık
düşüşü ölçütü. Önce: HEAD 78c9103 (ek adalar grubu, ağaç bulma hatası düzeltilmiş tarama betiğiyle yinelendi); sonra: son kod.

| Konum | Kare | Önce: medyan / en düşük / karanlık (parlaklık düşüşü) | Sonra: medyan / en düşük / karanlık (parlaklık düşüşü) |
|---|---|---|---|
| Kasaba (doğuş) | 96 | 127,4 / 104,1 / 0 (0) | 127,4 / 104,1 / 0 (0) |
| İskele ortası | 96 | 129,1 / 95,3 / 0 (0) | 129 / 95,3 / 0 (0) |
| İskele, gemi yanı | 96 | 119,7 / 69,8 / 1 (1) | 120,1 / 83,8 / 0 (0) |
| İskele feneri | 96 | 128,7 / 115,1 / 0 (0) | 128,6 / 115,1 / 0 (0) |
| Güverte, ambar | 96 | 103,7 / 49 / 5 (2) | 108,3 / 93,3 / 0 (0) |
| Güverte, baş | 96 | 113,7 / 64,4 / 1 (1) | 118,1 / 100,7 / 0 (0) |
| Güverte, kıç direk | 96 | 97,7 / 16,9 / 17 (14) | 102,1 / 77 / 0 (0) |
| Güverte, yelken açık | 96 | 81,1 / 26,4 / 16 (5) | 97,1 / 63,7 / 0 (0) |
| Yüzme, gemi yanı | 96 | 135,9 / 112,9 / 0 (0) | 135,9 / 113 / 0 (0) |
| Yüzme, iskele yanı | 96 | 118,9 / 85,8 / 0 (0) | 118,8 / 85,7 / 0 (0) |
| Kayık | 96 | 134,4 / 113,1 / 0 (0) | 134,4 / 113,2 / 0 (0) |
| Açık deniz (tabandan yükselme) | 192 | 128,6 / 0 / 1 (1) | 128,8 / 114,1 / 0 (0) |
| Orman (ağaç dibi) | 96 | 55,5 / 17 / 42 (8) | 60,1 / 41,7 / 26 (0) |
| Orman (gövdeden 4 m) | 96 | 69,9 / 32,3 / 4 (1) | 71,3 / 43,2 / 0 (0) |
| Kumsal palmiyeleri | 96 | 103,9 / 77,8 / 0 (0) | 107,5 / 80,2 / 0 (0) |
| Kasaba NPC (Nevra) | 96 | 115,7 / 92,1 / 0 (0) | 115,7 / 93,6 / 0 (0) |
| Pazar tezgâhı | 96 | 118,9 / 0 / 1 (1) | 119 / 101,7 / 0 (0) |
| Tersane çatısı | 96 | 87 / 66,1 / 0 (0) | 87 / 66,2 / 0 (0) |
| Gözcü tepesi | 96 | 105,4 / 84,5 / 0 (0) | 105,4 / 84,9 / 0 (0) |
| Kamp | 96 | 121,2 / 48,6 / 2 (2) | 123,3 / 91,7 / 0 (0) |
| Mağara ağzı | 96 | 41,5 / 24,8 / 80 (2) | 46,5 / 25,9 / 72 (7) |
| Mağara tüneli | 96 | 4,1 / 1,8 / 96 (25) | 2,5 / 2 / 96 (0) |
| Mağara odası | 96 | 4,7 / 3,5 / 96 (0) | 4,3 / 3 / 96 (0) |
| Zümrüt Koy ormanı | 96 | 50,7 / 5,8 / 44 (32) | 72,2 / 39,7 / 8 (8) |
| Zümrüt Koy limanı | 96 | 82,6 / 50,6 / 2 (0) | 82,7 / 50,8 / 2 (0) |
| Kurt Adası ormanı | 96 | 107,6 / 43,7 / 3 (3) | 126,8 / 92,6 / 0 (0) |

Mağara hariç toplam: karanlık kare 139 → 36, parlaklık düşüşü 71 → 8; tam siyah kare (en düşük 0) 2 → 0. Görsel: `gorseller/17_kamera_kararma_once_sonra.jpg`
(dört konumda tam turdaki en koyu kare, önce/sonra). Kalanlar: ağaç dibinde 26
kare yalnız "pikselerin yarısı koyu" ölçütüne takılıyor (gölgeli orman zemini; en koyu karede oyuncu ortada görünüyor), Zümrüt Koy'da
kamera büyük bir ağaç tacının içinden geçerken çevreyi yeşil yapraklar sarıyor (önce siyah, en düşük 5,8 → 39,7), limandaki 2 kare
kameranın bir yapıya yaslandığı an (önce de aynı). Mağara tasarım gereği karanlık (meşale yokken medyan 2–5): parlaklık ölçütü
burada anlamsız, mağara K07'nin geometrik testiyle doğrulandı (tünelde kesitin dışına çıkan kamera 53–56/72 → 0); ağızda
parlaklık düşüşü 2 → 7, çünkü kamera artık kayanın içinden dışarıyı göstermiyor, tünelin içinde kalıyor.
