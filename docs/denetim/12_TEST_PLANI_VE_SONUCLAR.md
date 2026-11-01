# 12. Test Planı ve Sonuçları (19 senaryo)

Ortam: başsız Chromium + SwiftShader (yazılımsal GPU; **gerçek ekran kartı yok**, bu nedenle FPS değerleri donanım değeri
değildir ve 60 FPS hedefi bu ortamda doğrulanamaz — yalnız CPU tarafı benzetim maliyeti ve çizim çağrısı/üçgen sayıları ölçülür).
Çözünürlükler: 640×360 (çoğu senaryo), 480×270 (co-op), 960×540 (arayüz). Her senaryo `tests/harness/run.cjs` ya da
`tests/harness/coop.cjs` ile tekrarlanabilir; rapor JSON'ları koşuda `--report` ile yazılır. "Kanıt" sütunu ilgili belgeyi gösterir.

| # | Senaryo | Dosya | Durum | Kanıt / not |
|---|---|---|---|---|
| 1 | Yeni oyun başlatma ve ilk 10 dakika akışı | `00_acilis.js`, `v03/*` | GEÇTİ | menü→oyun, oyuncu zeminde, HUD; 10 dk gerçek zamanlı oynanış yerine benzetimli akış |
| 2 | Kayıt/yükleme (3 kez üst üste) | `08_kalicilik.js` | GEÇTİ (1 döngü; 3 ardışık döngü Aşama 9'da) | 09. belge |
| 3 | Gemiye biniş, yelken, çapa, top atışı | `03_fizik_dt.js`, `03_fizik_duzeltmeler.js`, `04_karakter.js` | GEÇTİ | 05/06. belgeler (gülle süpürmesi, dümen/top IK) |
| 4 | Gemi–kara / gemi–gemi çarpışması | `03_fizik_duzeltmeler.js` | GEÇTİ | kinematik gemi çarpışması; kara oturması v0.3 mantığı (statik) |
| 5 | Fırtınada seyir | `09_performans.js` (fırtına ölçümü) | KISMİ | hava anahtarı 'firtina' ile ölçüm; seyir hissi gerçek GPU'da el ile |
| 6 | Yüzme, dalış, kayıktan geçiş | `04_karakter.js`, `03_fizik_duzeltmeler.js` | GEÇTİ | yüzme kaldırması, mod histerezisi, kayık/biniş silah durumu |
| 7 | Mağara, tapınak, bulmaca | `08_kalicilik.js` (tapınak mekanizması kaydı) | KISMİ | mekanizma çözümü ve kaydı; bulmaca akışı uçtan uca oynanmadı |
| 8 | Hazine haritası ve kazı | v0.3 referans senaryoları | GEÇTİ (v0.3) | bu aşamada değişmedi |
| 9 | Dövüş: kılıç, parry, tabanca, kaçınma | `05_dusman_ai.js`, `04_karakter.js` | GEÇTİ | savunma histerezisi, tabanca ışını engeli, telgraf |
| 10 | Boss savaşı (en az 2 boss) | `05_dusman_ai.js` (evre/zayıf nokta birim), `09_performans.js` (kraken) | KISMİ | evre/ödül mantığı birim düzeyinde; tam savaş el ile (bilinen sorunlar #12) |
| 11 | Ekonomi: alış/satış/geliştirme | `07_ekonomi.js` | GEÇTİ (al-sat döngüsü, 'Tümünü sat'); geliştirme akışı v0.3 referansı | B01/B07 düzeltildi; gemi geliştirme UI akışı el ile |
| 12 | 2 oyunculu co-op | `coop/06b_esitlik_senkron.cjs` | (koşu sonucu 08. belgede) | |
| 13 | 4 oyunculu co-op | — | ERTELENDİ | bellek baskısı; iş akışları durdurulduktan sonra Aşama 9'da |
| 14 | Konuk ayrılıp geri geliyor | `coop/06a2_mesaj_kopma.cjs` (kopma temizliği) | GEÇTİ (3/3; kopma 12 sn'de algılandı, kilit temizliği yayıldı) | geri dönüş eşleşmesi H04 testiyle dolaylı; kalp atışı eklendi (08 §8.1) |
| 15 | Ev sahibi kaydedip yeniden açıyor | `08_kalicilik.js` | GEÇTİ | |
| 16 | Düşük FPS'te oyun kararlılığı | `03_fizik_dt.js` (15 FPS adımı), `03_fizik_duzeltmeler.js` (alt adım sınırı) | GEÇTİ | 15/30/60 FPS aynı sonuç; 0.1 s kare → 6 alt adım |
| 17 | Uzun oturum (30+ dakika) | — | YAPILMADI | Aşama 9'da benzetimli 30 dk koşu planlandı |
| 18 | Hızlı yolculuk | `03_fizik_duzeltmeler.js` (çapa sıfırlama) | GEÇTİ | E-01 düzeltildi |
| 19 | Yanlış girdi/spam/hile girişimi | `coop/06a_ag_guvenligi.cjs` | GEÇTİ (7/9; 2 kontrol 06a2'de) | oran/boyut/hasar/altın/sahte ad |

Her koşuda kaydedilen: geçti/kaldı, konsol/sayfa hataları (`pageErrors`), ölçümler (metre/saniye/sayaç), ekran görüntüleri
(`shot`/`snapjs` adımları), bellek (`performance.memory`, yalnız 09. senaryo), yeniden üretme adımları (senaryo dosyasının kendisi).
