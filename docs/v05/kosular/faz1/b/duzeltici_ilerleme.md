# B0 test düzeltici — ilerleme (2. deneme, 15 Kasım)

## 00:07 UTC başlangıç durumu
- Makine yeniden başlamıştı (uptime 3 dk); 8080/8081/8083 ve 9000 kapalıydı → yeniden başlatıldım (PID 736/739/742/745).
- w2 HEAD 0140a05 (A2 iş akışı 5479e3b'den sonra commit'ler eklemiş). Koşucu run.cjs 591dff27aa01, ortak.cjs df191a997375 (önceki denemeyle aynı).
- w2 çalışma ağacı yedek yamayla (b0_yarim_w2.patch) birebir aynı (git apply -R --check temiz).
- Önceki deneme (fb0/): 17 bulgunun hepsi 'duzeltildi' olarak işaretlenmiş (I17 kısmen, konuk teleport ertelenmiş).
  son/ altındaki kayıtlar senaryo sha'larıyla uyumlu; YALNIZ 02_arazi_yasam 7237d45803da (LY13 sarmalayıcı TypeError düzeltmesi)
  normal+noworker koşuldu, crash koşusu kesildi.
- Yeni ortam bulgusu (işaretçi kilidi → sentetik fare seli) henüz hiçbir sınıflandırmada not edilmemiş.

## Plan
1. Her bulguyu yeniden doğrula (kod + son kayıt), gerekiyorsa düzelt.
2. İşaretçi kilidi notu: zaman kontrolleri (AYS-01, HYS-01, AH*, LY13, ...) için ayrım; tanı koşusu exitPointerLock ile.
3. Son/ kayıtlarını duzeltme/son_onceki_deneme/ altına taşı, hepsini yeniden koş.

## 00:25 UTC — yeniden doğrulama (okuma) ve düzeltmeler
- Kontrol kimlikleri: B0 özgünüyle (fb0/b0_ilk) ve HEAD'le karşılaştırıldı; hiçbir kimlik silinmemiş (b0d/etiketler.py).
- KUSUR 1 (önceki düzeltmede): LY13 p99 = f[⌈0,99·n⌉−1] → n < 100'de EN UZUN dilim (çizim durdurulunca n 66–84). "Tek GC
  duraklamasına dayanıklı" iddiası geçersizdi. Düzeltildi: p99 = f[⌊(n−1)·0,99⌋] (n ≤ 101'de en uzun 1 dilim dışarıda).
  v0.4 son kayıtlarıyla yeniden hesap: normal 2. en uzun +5,1 ms (>4) ve en uzun +21,6 → yine KIRMIZI; noworker 2. +10,9 → KIRMIZI.
- KUSUR 2: LY09 işçisiz dalı hâlâ T.focus.until okuyordu (B0-I15 yarım). Düzeltildi: işçisiz kipte B'nin 3 karo işinin _finish'i
  14 sn geciktirilir (LY07/LY08 yöntemi); karar B bittikten 5 sn sonra (her iki dal). focus.until yalnız tanı.
  Doğrulama için A-12 mutant ağacı: b0d/mut_a12 (v0.4 + 'if (this.focus === F)' asgari düzeltme), 127.0.0.1:8098.
- 02_arazi_yasam yeni sha 1f67faee95b8 (önceki 7237d45803da kopyası b0d/02_arazi_yasam_7237d4_onceki.js).
- B0-I14 yeniden doğrulandı (Node eşdeğerleri, fb0/ly08b): v0.4 tamam/tamam; m8 LY08 'geç sonuç silinen karoya yazıldı', LY07 'ezildi'
  → duzeltme2/B0-I14_ly08_ly07_mutasyon_yeniden.log
- Node testleri (son/): arazi_sozlesme 36/36 GECTI; arazi_kuyruk 67/89 KALDI (aynı 22 kalan).
- Eski son/ → duzeltme/son_1deneme/ (43 dosya). Yeni koşular: b0d/zincir1.sh (son: yasam×3; duzeltme2: mut_yasam×2; son: geri kalan 16).
- Ortam: 00:2x'te k17 düzelticisinin chrome'u cgroup OOM ile öldürüldü (dmesg: tarayıcı anon-rss 11,4 GB) — işaretçi seli bulgusuyla uyumlu.

## 00:30 UTC — 02_arazi_yasam 1f67faee95b8 son/ koşuları (v0.4)
- noworker: 12/18; LY13 KIRMIZI (63 dilim, p99 sıra 61: +15,9 ms, en uzun +17,3); LY09 KIRMIZI (_finish gecikmesi: A 20,9 sn, B 36,5 sn;
  B bitişinde 0 ağ, derinlik 6 m; 5 sn sonra 0 ağ, 5214 m) — B'nin karoları A'nın kısalttığı odak bitince düşürülmüş.
- normal: 12/18; LY13 KIRMIZI (+6 / +8,1 ms; 3/63 aşım); LY09 KIRMIZI (işçi gecikmesi: A 0,56, B 14,4 sn; 20 ağ, derinlik 5214 m).
- crash: 13/18; LY13 YESIL (1 aşım +8,8 tolere, p99 +2,6); LY09 KIRMIZI (A 19,6 / B 33,8 sn; 20 ağ, derinlik 5214 m).
- Yeni coop senaryosu tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs (B0-I17 konuk teleport) yazıldı; ilk deneme koşusu kuyrukta
  (duzeltme2/coop_02_hizli_yolculuk_konuk_deneme1).

## 3. DENEME — 00:51 UTC (container ~00:49'da yine yeniden başladı; uptime 2 dk)
- Sunucular ayakta (8080/8081/8083/9000; PID 230/232/234/238, başkası başlatmış). 8098 (mut_a12) kapalı. Kilit serbest.
- cgroup: /sys/fs/cgroup/memory/process_api/01a1dcad-e97f-729a-b0d2-8d966898bb6e/claude-code-bash (betiklerde ls -d ile bulunacak).
- 2. denemenin son işleri (transkript satır 351–386): coop deneme1 (00:30) → HK03/HK04/HK07 KIRMIZI, HK06 YESIL (doğru neden);
  arazi_kuyruk.mjs'ye KY25 eklendi (sha 5bf96a733963; geo.js computeHeight 5 µs yavaşlatma + _localSlice ölçümü; realpath düzeltmesi);
  KY25 doğrulaması duzeltme2/KY25_dogrulama.log: v0.4 KALDI (p99 +89,9 ms, 39 dilim), mut_a06 (her satırda yield) GECTI (+2,5 ms, 174 dilim).
  son/arazi_kuyruk tam koşusu 00:49'da kesildi (çıkış 137) → GEÇERSİZ, yeniden koşulacak.
- son/ geçerli (tam, çıkış satırlı, güncel sha): arazi_sozlesme, 02_arazi_yasam ×3 (1f67faee95b8), 02_acilis_hatalari, 02_acilis_akisi,
  00_acilis, 02_yukleme_bekleme, 02_depolama_kapali. Kesik: 02_ayar_lod (00:48), arazi_kuyruk (00:49) → duzeltme2/kesik/ altına taşınacak.
- Kalan son/: arazi_kuyruk, ayar_lod, isci_hata, yedek×4, hizli×2, tek×3, coop. Sonra işaretçi tanı koşuları (zincir2 planı).
- 00:57 son/arazi_kuyruk (5bf96a733963) TAMAM: 69/92 KALDI; 23 kalan = önceki 22 + KY25 (v0.4: 39 dilim, p99 +90,2 ms, en uzun +90,2;
  KY25-D/-S geçti). Parça 1 (b0d/parca1.sh) sürüyor: ayar_lod, isci_hata.
- 01:02 parça 1 BİTTİ: son/02_ayar_lod 4/11 (önceki gibi), son/02_arazi_isci_hata 5/9 (HI03/04/05/07 KIRMIZI). 
- Zincir 3 (b0d/zincir3.sh, pid 1944): son/ yedek×4 → hizli×2 → tek×3 → coop. Zincir 4 (b0d/zincir4.sh, pid 2361) zincir 3'ü bekler:
  işaretçi tanısı → once_v04/duzeltme3/isaretci/ (hizli_noworker_birak; yedek_crash_say/birak; yasam_normal/noworker_birak;
  hizli_normal_birak; yedek_noworker_birak). Kesilirse: son/ozet.txt ve duzeltme3/isaretci/ozet.txt'ye bak, kalanları toplu.sh ile ver.
- Tablo üreteci b0d/tablo3.py (fb0/tablo_son.py + KY25 + coop HK + B0 ilk tablosunun SZ gruplaması ve 8 UYGULANAMAZ yeni-kip satırı;
  TABLO_NOT=<json> ile satır notları).
- 01:15 son/02_arazi_yedek ×4 (7d4819041d89) hepsi GECTI 16/16. AYS-01 ortanca: normal 211 (211/211/181), noworker 150 (123/150/180),
  crash 181 (181/241/175), badurl (aşağıda) ms; çizim durdu (0 kare). Tuz Pazarı tanısı (çizim açık): normal 273 ms 9 kare (en uzun 72),
  noworker 446 ms 17 kare (en uzun 67, en uzun dilim boşluğu 46), crash 185 ms 0 kare (dilimler arka arkaya, boşluk ≤ 2,2 ms).
- 01:15 son/02_arazi_yedek_badurl GECTI 16/16 (AYS-01 ortanca 151 ms; Tuz Pazarı 150 ms 0 kare, dilimler arka arkaya).
- 01:20 son/02_hizli_yolculuk_normal (604e10f23ede) 23/34 KALDI: HYS-01 1111 ms YESIL; KIRMIZI HYS-02, HYU-02, HYU-05, HY10, HY11, HY13,
  HY14, HY17, HY18, HY19, HY21 (1. denemeyle aynı). Sırada hizli_noworker (≤ 15 dk), sonra tek×3 + coop, sonra zincir 4.
- 01:27 son/02_hizli_yolculuk_noworker (604e10f23ede) 23/34: HYS-01 noworker 366 ms → YESIL (önceki üç v0.4 koşusu 30 331 / 33 366 /
  44 718 ms KIRMIZI). Yolculuktan hemen önceki 'm_once' ölçüm adımı bu koşuda 4,7 sn (1. denemede 5 ms) → yolculuk başlangıç bölgesinin
  kuyruğu boşaldıktan sonra başlamış olabilir: HYS-01'in noworker sonucu önkoşula (yolculuk anındaki kuyruk) bağlı, KARARSIZ.
  YENİ BULGU (test kalitesi; B0-I04'e ek). Düzeltme: 02_hizli_yolculuk.js → abf125923f9a: yolculuk başlarken kuyruk durumu tanı olarak
  yazılır (window.__ftOnce → 'yolculukOncesiKuyruk'); kontrol değişmedi. Önceki 604e10 son/ hizli kayıtları duzeltme3/hizli_604e10/'a taşındı.
- Zincir 4 durduruldu (bekleme döngüsündeydi); yerine zincir 5 (b0d/zincir5.sh): son/ hizli_noworker → isaretci hizli_noworker_birak →
  son/ hizli_normal → isaretci yedek_crash_say/birak, yasam_normal/noworker_birak, hizli_normal_birak, yedek_noworker_birak, hizli_noworker_say.
- 01:29 son/02_tek_dosya_kipler 3/4 (TK02 KIRMIZI, beklenen).
- 01:33–01:41 son/: tek_blob 3/4 (TB01 KIRMIZI), tek_cerceve 2/5 (TC02–04 KIRMIZI), coop_02_hizli_yolculuk_konuk 5/8 (HK03/HK04/HK07 KIRMIZI,
  HK06 YESIL). ZINCIR3 BİTTİ 01:41:46; ZINCIR5 BAŞLADI 01:41:47. Bulgu sonuç taslağı: b0d/cikti/sonuclar_taslak.py (T[..] tanıdan doldurulacak).
- 01:48 son/02_hizli_yolculuk_noworker (abf125923f9a) 22/34: HYS-01 30 949 ms KIRMIZI; yolculuk anında kuyruk BOŞ (jobs 0, queue 0,
  125 ağ, sayfa 7,65 sn; m_once 11 ms). "Kuyruk dolu" varsayımı ÇÜRÜDÜ: gecikme kuyruktan değil. 366 ms'lik koşuda yolculuk sayfanın
  ~25,9. sn'sinde başlamıştı (m_once 4,7 sn). Sırada isaretci hizli_noworker_birak (karar verici tanı).
- 01:53 isaretci/02_hizli_yolculuk_noworker_birak: kilit 1 kez alındı ve hemen bırakıldı (kilitli 0 sn; sayfaya ulaşan mousemove 1).
  HYS-01 noworker 10 274 ms → yine KIRMIZI (> 3 sn); yolculuk anında kuyruk jobs 3 / queue 2. Diğer sonuçlar son/ ile aynı (22/34).
  Yorum: işçisiz hızlı yolculuk gecikmesi kilit seli olmadan da var (10 sn); 31 sn ↔ 10 sn farkı sele bağlı olabilir (tek örnek).
- 02:03 son/02_hizli_yolculuk_normal (abf125) GEÇERSİZ: HY05'te sayfa çöktü (cgroup OOM, renderer anon-rss 5,4 GB; dmesg) →
  duzeltme3/kesik/02_hizli_yolculuk_normal_abf125_sayfa_coktu_oom.*; HYS-01 normal o koşuda geçmişti. Yeniden koşu: b0d/zincir6.sh
  (zincir 5'i bekler).
- 02:06 isaretci/02_arazi_yedek_crash_say (kilitli 62 sn; sayfaya ulaşan mousemove yalnız 24 → sel sayfa JS'ine ULAŞMIYOR, tarayıcı/
  compositor tarafında) GECTI 16/16, AYS-01 ortanca 151 (151/151/159); Tuz Pazarı 152 ms, 0 kare, dilim boşluğu ≤ 0,2 ms.
  isaretci/02_arazi_yedek_crash_birak (kilit hemen bırakıldı) GECTI 16/16, AYS-01 150 (150/137/162); Tuz Pazarı 270 ms, 13 kare
  (en uzun 31 ms, boşluk 20,7). → AYS-01 kilitten etkilenmiyor; kilitliyken yedek hazırlık sırasında kare çizilmemesi kilitle ilişkili
  (bırakılınca kareler düzenli) → B0-I08'in rAF kontrolü bu ortamda anlamsız, erteleme gerekçesi güçlendi.
- 02:10 ÖNEMLİ: isaretci/02_arazi_yasam_{normal,noworker}_birak (kilit hemen bırakıldı): LY13 her iki kipte YESIL — normal 54 dilim,
  0 aşım, p99 +3,0, en uzun +3,8 ms; noworker 47 dilim, 0 aşım, p99 +0,8, en uzun +1,2 ms. Kilitli son/ koşularında normal +6/+8,1
  (3/63 aşım), noworker +15,9/+17,3 (6/63). → LY13'ün v0.4'teki tarayıcı kırmızısı bu makinede ORTAM (işaretçi kilidi seli/CPU)
  kaynaklı; A-06 'önce' kanıtı KY25 (Node, belirlenimci). Diğer sonuçlar kilitliyle aynı (13/18: LY05, LY10, LY11, LY14, LY09 KIRMIZI).
- 02:14 isaretci/02_hizli_yolculuk_normal_birak 23/34 (son/ ile aynı kırmızılar): HYS-01 normal 2196 ms YESIL (kuyruk boş).
- 02:15 isaretci/02_arazi_yedek_noworker_birak GECTI 16/16: AYS-01 151 (151/181/151) — kilitli son/ 150 ile aynı; Tuz Pazarı 346 ms,
  15 kare. Koşu süresi 65 sn (kilitli 240 sn). Sırada: isaretci hizli_noworker_say, sonra zincir 6 (son/ hizli_normal yeniden).
- 02:22 isaretci/02_hizli_yolculuk_noworker_say (kilitli + sayaç; kilitli 65+ sn, sayfaya ulaşan mousemove 20): HYS-01 28 677 ms KIRMIZI,
  yolculuk anında kuyruk boş. Özet HYS-01 noworker: kilitli 30 949 / 28 677 (bugün) [+ 30 331, 33 366, 44 718 önceki; 366 tek aykırı],
  bırakılmış 10 274 → sel gecikmeyi ~3 kat büyütüyor, selsiz de > 3 sn. ZINCIR5 BİTTİ 02:22; ZINCIR6 (son/ hizli_normal) 02:22'de başladı.
- 02:29 son/02_hizli_yolculuk_normal (abf125) 23/34: HYS-01 1810 ms YESIL (kuyruk boş); kırmızılar önceki gibi. ZINCIR6 BİTTİ.
- son/ TAMAM: 22 kayıt, hepsi güncel sha ve çıkış satırlı (b0d doğrulaması 02:30). isaretci_tani.js kopyası duzeltme3/isaretci/'de.
- Çıktı dosyaları: b0d/cikti/kontroller.json (258 satır: YESIL 153, KIRMIZI 95, UYGULANAMAZ 10), kosular.json, sonuclar.json
  (sonuclar_taslak.py + tani.json), tablo_not.json. Sıradaki: son gözden geçirme + StructuredOutput.
- 02:35 çıktı JSON'ları yeniden üretildi (kosular.json 38 kayıt, ölçümlü). Sıradaki: özet + StructuredOutput.
- 02:40 son çıktı dosyaları: b0d/cikti/kontroller_son2.json (247 satır), kosular_son2.json (38), sonuclar.json (17). StructuredOutput yazılıyor.
