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
