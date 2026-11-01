# 8. Co-op Testleri (Aşama 6)

Ortam: aynı makinede 2–3 başsız Chromium sekmesi (SwiftShader), yerel PeerJS sinyal sunucusu (`tests/peer-server.cjs`, :9000),
gerçek WebRTC veri kanalları (loopback). Koşucu: `tests/harness/coop.cjs`; senaryolar `tests/scenarios/coop/06a_*.cjs` (3 oyuncu) ve
`06b_*.cjs` (2 oyuncu). Oyun başladıktan sonra çizim döngüsü 2 FPS'e kısılır, benzetim `DK.sim` ile ilerletilir; böylece
sonuçlar yazılımsal GPU'dan bağımsızdır. Gerçek ağ gecikmesi/kayıp bu ortamda üretilemez (bkz. 8.4).

## 8.1 Ağ güvenliği ve oturum (06a, 3 oyuncu)
Üç koşu yapıldı; ilk ikisi test kalibrasyonu (ad temizliği beklentisi, zamanlayıcı günlükleri) ve koşu yavaşlığı nedeniyle
eksik kaldı. Üçüncü koşu ve kısa `06a2` senaryosundaki sonuçlar:

| # | Kontrol | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | H02 Konuk adı `<img src=x onerror=…>Kötü` → roster'da `Kötü` | GEÇTİ | etiketler ve `< > & " '` temizlenir, 20 karakter |
| 2 | H04 Ev sahibiyle aynı adlı konuk katılınca ev sahibi listede kalır | GEÇTİ | roster 3 kayıt, ev sahibi dahil (önce: ev sahibi düşüyordu) |
| 3 | 3 oyuncu da oyunda | GEÇTİ | |
| 4 | H02 HUD takım listesinde `<img`/`onerror` yok, ad metin olarak | GEÇTİ | `innerHTML` kaçışlı |
| 5 | H11 Ev sahibinin atış efekti konukta işlenir | GEÇTİ | `_remoteAct` 1 çağrı (önce: `from` alanı yok → hiç) |
| 6 | H07 300 × 100 altın 'gold' iletisi | GEÇTİ | işlenen +12000 (oran sınırı 120/s; bütçe ≤20000/dk) |
| 7 | H07 300 m uzaktaki düşmana 99999 hasar | GEÇTİ | can 170/170, işlenmedi |
| 8 | H07 yakından 99999 hasar | GEÇTİ | 160 üst sınır × sersemlik çarpanı → 160 hasar (170→10) |
| 9 | H07/H22 200 KB sohbet düşürülür, normal sohbet işlenir | GEÇTİ (06a2) | 1 sohbet olayı (normal), büyük ileti yok sayıldı |
| 10 | H13 kopan konuğun dümen kilidi ev sahibinde ve diğer konukta kalkar | GEÇTİ (06a2, 4. koşu) | kopma 12 sn'de algılandı; `remotes` 2→1, kilit iki tarafta `null` (önce: 30 sn içinde algılanmıyordu) |

Koşu yavaşlığı: üç sekmede `DK.sim(0.2)` çağrıları beklenenden 10–20 kat uzun sürdü; nedeni 8.2'deki profil adımıyla ölçüldü
(aşağıda).

**H13 koşu geçmişi.** 2. koşuda sekme kapatılan konuk 30 sn boyunca ev sahibinde kaldı (`remotes` 2, dümen kilidi duruyor):
PeerJS/WebRTC `close` olayı sekme kapanışında gecikmeli geliyor. Uygulama katmanına kalp atışı eklendi (ev sahibi 15 sn
sessiz konuğu düşürür ve kilit/sandık/kayık temizliğini yayar; konuk 25 sn veri gelmeyince 'ev sahibi ayrıldı', 6 sn'de zayıf
bağlantı uyarısı). 3. koşuda bu kez konuklar hiç oyuna giremedi (`menu`): dünya yüklenirken konuk 15 sn sessiz kalıyor ve
haksız yere düşürülüyordu. Eşik oyun içi ilk iletiye bağlandı (ev sahibi konuktan ilk `st`, konuk ev sahibinden ilk `snap`
aldıktan sonra sayar; `startGame`/`_sendWorld` sıfırlar). 4. koşu 3/3 geçti, sayfa hatası 0.

## 8.2 Ganimet/sandık eşitliği ve düşman/gemi senkronu (06b, 2 oyuncu)
Benzetim maliyeti profili (koşu başında, 6 kare ortalaması): ev sahibi `DK.sim(0.2)` 31 ms (≈5 ms/kare; en pahalı sistem
`crowd` 1.4 ms/kare), konuk 29 ms. Yani co-op benzetimi ucuzdur; önceki koşuların yavaşlığı yazılımsal GPU çiziminin ana iş
parçacığını doyurmasıydı (çizim durdurulunca aynı senaryo 15 dk yerine 107 sn sürdü).

| # | Kontrol | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | B03/H01 Konuğun kırdığı sandığın kesesi ev sahibinde doğar, konukta aynı kimlikle görünür | GEÇTİ | `pk…` kimliği iki tarafta aynı (önce: kese yalnız konukta, alınamıyordu) |
| 2 | H01 Konuk keseyi alır: eşya konuğa, kese ev sahibinde kalkar | GEÇTİ | `itemsGained` 1, ev sahibinde kese yok |
| 3 | H10/H03 Konuk ambardan sandık alır | GEÇTİ | ev sahibi ambarı 0, sandık konuğun taşımasında (carrier = konuk) |
| 4 | H03 Konuk sandığı ambara koyunca ev sahibinde hayalet kalmaz | GEÇTİ (yeniden koşu) | kök neden: `netHold` aktarımı `gone` kimliğini düşürüyordu; ev sahibi ambarı 1, hayalet 0 |
| 5 | B08/H08 Yüzen şişe konukta ağ kopyası olarak görünür | GEÇTİ (düzeltme sonrası) | ilk koşuda duvar saatine bağlı süre aşımı siliyordu → anlık görüntü sayacı |
| 6 | H08 Konuk şişeyi alır: eşya konuğa, nesne iki tarafta kalkar | GEÇTİ | `sise_mesaj` konukta |
| 7 | F-02 Ev sahibinde uzak oyuncunun gemi referansı | GEÇTİ | `ship_main`, güverte |
| 8 | F-12 Zıplayan konuk ev sahibinde havada | GEÇTİ | `onGround=false` |
| 9 | E-02/E-06/E-07 Delik, gülle/tahta sayısı, devrik direk konukta | GEÇTİ | 1 delik, 42 gülle, 7 tahta, direk devrik |
| 10 | E-07/E-02 Direk ve delik onarımı konukta geri alınır | GEÇTİ | 0 delik, direk dik |
| 11 | H12 Batık bayrağı: gemi konukta görünmez | GEÇTİ | |
| 12 | F-15 Lav havuzu uzak oyuncuyu yakar | GEÇTİ | 100 → 72 |
| 13 | F-13 Konuğun silah sesi ev sahibi düşmanını uyarır | GEÇTİ | farkındalık 1.2, kuşatma |
| 14 | F-11 Boss geri tepmesi konukta | GEÇTİ (eşik düzeltildi) | 0.3 sn sonra kalıntı 0.16 m/s (9/s sönüm; önce: hiç uygulanmıyordu) |
| 15 | F-06 Düşman mermileri konukta görsel | GEÇTİ | 1 görsel mermi |
| 16 | Senaryo sonunda iki taraf oyunda, sayfa hatası yok | GEÇTİ | |

## 8.3 4 oyuncu (06c, Aşama 9)
Senaryo `tests/scenarios/coop/06c_dort_oyuncu.cjs` (4 sekme, 480×270, yerel PeerJS sunucusu). Koşu 423 sn, 7/7 GEÇTİ, sayfa hatası 0.

| # | Kontrol | Sonuç | Ölçüm |
|---|---|---|---|
| D4-01 | Lobide 4 kayıt | GEÇTİ | Kaptan, Tayfa, Lostromo, Topçu |
| D4-02 | 4 oyuncu da oyunda | GEÇTİ | 4 × `playing` |
| D4-03 | Her oyuncu 3 uzak oyuncu görür | GEÇTİ | [3, 3, 3, 3] |
| D4-04 | Bir konuğun sohbeti diğer 3 oyuncuya ulaşır | GEÇTİ | her sekmede 1 sohbet olayı |
| D4-05 | Konuğun hareketi başka bir konukta görünür | GEÇTİ | (8,2; 214) → (14,2; 218): ~7 m |
| D4-06 | Arayüzdeki "menüye dön" yoluyla ayrılan konuk aynı adla geri gelir | GEÇTİ | ayrılınca roster 3, dönünce 4, çift ad yok, konuk 3 uzak oyuncu görüyor |
| D4-07 | Sekmesi kapanan konuk herkeste kalkar | GEÇTİ | 13 sn'de (kalp atışı), kalan 3 oyuncuda uzak sayısı 2 |


## 8.4 Gecikme / kayıp / kopma / yeniden bağlanma
- Kopma: 06a'da bir konuğun sekmesi kapatılır; ev sahibi ve diğer konukta dümen kilidi ve uzak oyuncu temizliği doğrulanır.
- Gecikme/kayıp: loopback WebRTC'de yapay gecikme üretilemedi (tc/netem konteynerde yok). Mevcut kod 100 ms tek yön gecikme
  emülasyonunu v0.3 denetiminde (E-15) ölçmüştü; bu aşamada yeniden ölçülmedi.
- Yeniden bağlanma: aynı adla yeniden katılım roster eşleşmesiyle korunur (06a H04 testi ev sahibi kaydının düşmediğini doğrular);
  oturum ortası yeniden bağlanma senaryosu yazılmadı (bilinen sorunlar).

## 8.5 Arayüz: 960×540 (H05/H14), `tests/scenarios/06_arayuz_960.js`
| # | Kontrol | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | 'Oda kur' panelinde "Odayı oluştur" düğmesi görünür alanda | GEÇTİ (düzeltme sonrası) | düğme alt kenarı 545 px → 514 px (pencere 540); panel gövdesi artık kaydırılabilir, küçük yükseklikte sıkı dolgu |
| 2 | Kalıcı HUD panelleri (gemi, görev, sohbet, zaman, mini harita, hotbar) çakışmıyor | GEÇTİ (düzeltme sonrası) | önce: gemi paneli görev takipçisiyle 290×75 px ve zaman paneliyle 288×18 px çakışıyordu; şimdi 0 çakışma |
| 3 | Bildirim yığını | Geçici çakışma kabul | küçük pencerede sol sütun, 36vw genişlik; 3+ eşzamanlı bildirim sohbet/görevle kısa süre çakışabilir |

Ekran görüntüleri: `/tmp/p6/ui_oda_kur_960.png`, `/tmp/p6/ui_hud_960.png` (ortam geçici dizini; rapora gömülmedi).

## 8.6 Aşama 6 sonrası tek oyunculu regresyon
Aynı derlemede (A grubu + Aşama 6 değişiklikleri) `00_acilis`, `03_fizik_duzeltmeler`, `04_karakter`, `05_dusman_ai` yeniden
koşturuldu: 4/4 senaryo 0 hata, 0 sayfa hatası. Kalıcılık (`08_kalicilik`) 13/13, ekonomi (`07_ekonomi`) 2/2, arayüz
(`06_arayuz_960`) 2/2.

## 8.7 Aşama 9 tam regresyon (co-op)
| Senaryo | Oyuncu | Sonuç | Not |
|---|---|---|---|
| `06b_esitlik_senkron.cjs` | 2 | 17/18 → düzeltme sonrası 18/18 GEÇTİ (doğal atış yine gelmedi; ev sahibinde oluşturulan mermi konukta görüldü: `vis 1`) | F-06: nişancı bu koşuda 10 sn içinde ateş etmedi (ev sahibinde de mermi 0: senkron hatası değil, kontrol rastlantısaldı). Kontrol, doğal atış gelmezse ev sahibinde doğrudan mermi oluşturacak şekilde belirlenimli yapıldı |
| `06a_ag_guvenligi.cjs` | 3 | 9/10 → düzeltme sonrası 10/10 GEÇTİ (kopma 14 sn'de algılandı, kilit iki tarafta kalktı) | H13: kontrol kalp atışından önce yazılmıştı (kapanıştan sonra yalnız ~4 sn bekliyordu); 06a2 gibi en çok 30 sn bekleyecek şekilde düzeltildi |
| `06a2_mesaj_kopma.cjs` | 3 | 3/3 GEÇTİ | büyük ileti düşürme, kopma temizliği |
| `06c_dort_oyuncu.cjs` | 4 | 7/7 GEÇTİ | §8.3 |
