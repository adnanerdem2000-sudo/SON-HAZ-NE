### 1.5 Taban ölçümleri (v0.4, SwiftShader, 640×360, Yüksek ön ayar)

Dört geçiş yapıldı: **G1** (`f8_taban.js`, 9 sahne, beklemesiz, 194 sn, tamamlandı), **G2** (`f8_taban2.js`, arazi kuyruğu beklemeli; menü/liman/kasaba/Kadim Tapınak ölçüldü, sonra sayfa çöktü), **G3** (`f8_taban3.js`; Kırlangıç ormanı/mağara/açık deniz/fırtına ölçüldü, sonra çöktü), **G4** (`f8_taban4.js`, gerçek zamanlı çizim kısılarak `fpsLimit=0,01`, beklemeler `DK.sim` ile; tamamlandı, 95 sn). Aralıklar geçişler arası farktır (varsayılan kamera yönü ışınlanmaya göre değişir; 8 yönlü tarama daha kararlıdır).

**A. Çizim yükü** ("varsayılan" = sahne kurulunca kameranın baktığı yön; tarama = 8 yön):

| Sahne | Varsayılan yön çağrı | Ana / gölge / son işleme | Üçgen (varsayılan) | Tarama medyan / en az / en çok | Tarama üçgen en çok | Not |
|---|---|---|---|---|---|---|
| S0 Menü | 422 | 238 / 168 / 16 | 853 502 | — | — | 86 program (43 doğrusal + 42 tuval + 1) |
| **S1a Liman, 09 kurulumu** | **1 005–1 026** (6 koşu) | 764 / 246 / 16 | 1 252 930–1 256 634 | — | — | geometri 750–755, doku 200, program 95 (42 tuval varyantı), yığın 122–129 MB |
| S1b Liman, 11:00 | 1 048 | 764 / 268 / 16 | 1 227 218–1 240 906 | **691 / 606 / 1 054** | 1 241 530 | |
| S2 Kasaba (Tuz Pazarı) | 1 130–1 137 | 919–926 / 195 / 16 | 1 065 872–1 317 284 | 514–541 / 389–393 / **1 130–1 133** | 1 317 624 | 15 NPC (5 yerel + 10 liman, 1,9 km), 174 ada hücresi |
| S3a Orman (Kadim Tapınak) | 449–458 | 322–331 / 111 / 16 | 736 584–788 912 | 384–386 / 290–310 / 498–519 | 810 090 | Arazi eksik (G2'de 136 karonun 72'si örülmüştü) |
| S3b Orman (Kırlangıç) | 497–777 | 309–561 / 172–200 / 16 | 1 073 043–1 079 213 | 777–849 / 418–458 / **1 285–1 333** | 1 170 704 | 5 düşmanlı kamp yakında; en yoğun yönde 565 hayvan çağrısı |
| S4 Mağara odası | 388–1 246 | 211–1 055 / 161–175 / 16 | 1 033 392–1 127 959 | 472–489 / 382–395 / **1 112–1 166** | 1 147 784 | Görünür iç: tünel + oda; geri kalan her şey dış dünya |
| S5 Açık deniz (en yakın kıyı 0,8–1,6 km) | 392–984 | 207–799 / 169 / 16 | 399 570–898 500 | 389–423 / 381–387 / **980–984** | 898 500–902 842 | En yoğun yön = Kırlangıç'a bakan |
| S6 Fırtına (denizde) + hortum + yıldırım | 413–1 003 | 228–818 / 169 / 16 | 538 140–1 047 918 | 438–445 / 403 / **995–999** | 1 033 652–1 047 126 | Bulutlar 17 çağrı / 152 K üçgen; 57–69 parçacık |
| S7 Deniz savaşı (2 sloop + 4 tayfa) | 568–1 169 | 242–960 / 193–310 / 16 | 487 482–955 098 | 548–701 / 443 / **1 175–1 279** | 955 266–1 037 908 | Her sloop 80 örgü, 80'i gölge atıyor |
| S8a Boss: Kraken | 430–437 | 237–244 / 177 / 16 | 461 043–476 931 | 438–456 / 411 / **949–961** | 905 840–992 468 | Limandan ~6,9 km; liman içeriği yine çiziliyor |
| S8b Boss: Volkanik Dev | 508–552 | 367–411 / 125 / 16 | 959 298–1 041 885 | 511–514 / 443–446 / 592–604 | 1 296 176–1 297 000 | Yükseliş + lav yağmuru (uçuşta 1–3 lav) |

**B. JS güncelleme süresi** (60 × `game.update(1/60)`, ms/kare; bu makinede koşudan koşuya ±%40) ve en pahalı sistemler:

| Sahne | ms/kare | İlk üç sistem (ms) |
|---|---|---|
| Liman (09) | 1,42–2,60 | balık 0,47–0,72, gemiler 0,18–0,51, hayvan 0,21–0,40 |
| Liman 11:00 | 1,62–1,93 | NPC 0,24–0,40, balık 0,20–0,33, düşman 0,01–0,35 |
| Kasaba | 1,26–1,49 | NPC 0,31–0,39, balık 0,23, gemi 0,17–0,22 |
| Orman (Kadim Tapınak) | 0,86–1,48 | NPC 0,19–0,35 (**liman NPC'leri 7 km'de**), balık 0,04–0,25, gemi 0,16–0,19 |
| Açık deniz | 0,87–2,11 | balık 0,25–0,79, kamera 0,03–0,31, detay 0,07–0,23 |
| Fırtına | 1,71–2,46 | balık 0,53–0,78, NPC 0,14–0,91, gemi 0,14–0,27 |
| Deniz savaşı | 1,80–1,98 | balık 0,43–0,65, gemi 0,23–0,32, detay 0,22–0,29 |
| Kraken | 1,44–1,65 | balık 0,65, NPC 0,09–0,22, boss 0,09–0,16 |
| Volkanik Dev | 0,85–1,71 | gemi 0,14–0,41, detay 0,08–0,29, ortam 0,22–0,26 |
| HUD (ayrı) | 0,04–0,12 | — |

**C. Ön ayarlar** (`f8_kalite.js`, ayar kaydı + sayfa yenileme; liman 09 kurulumu):

| Ön ayar (kalite/gölge/efekt/su/görüş) | Liman çağrı | Üçgen | Gölge | Program | `lodScale` (beklenen) | Kırlangıç ormanı tarama medyan / en çok | Açık deniz medyan / en çok |
|---|---|---|---|---|---|---|---|
| Yüksek (high/high/high/high/1) | 1 021–1 026 | 1,25 M | 246 | 95 | 1,0 (1,0) | 777–849 / 1 285–1 333 | 389–423 / 980–984 |
| Orta (medium/medium/medium/medium/0,65) | 1 021 | 1,07 M | 246 | 95 | **0,85 (0,76)** | 636 / 1 103 | ölçülemedi (sayfa çöktü) |
| Düşük (low/off/low/low/0,3) | 741 | 0,56 M | 0 | 43 | **0,70 (0,55)** | 486 / 912 | 201 / 285 |

Bugünkü "Orta" çağrı sayısını **azaltmıyor**; "Düşük"ün kazancı yalnız gölge geçişinin ve son işlemenin kalkmasından ve bitki yoğunluğundan geliyor. Açılışta görüş mesafesi araziye uygulanmıyor (J-10/A-19, ölçüldü).

**D. Derleme ve kaynak** (§6.1): menüde/limanda 42 kullanılmayan tuval programı; meşale ilk yakışta 17–25 yeni program; ada ilk görüşünde 1–5; mağara ilk görüşü 1 yeni program ve 2 502 ms'lik kare (G3).

**E. Uzun oturum** (`tests/scenarios/10_uzun_oturum.js`, son kodda bu çalışmada ilk kez; `DK_JSFLAGS=--expose-gc`, 207 sn): **5/5 GEÇTİ**. 20 dilim × 90 sn = 30 dk oyun zamanı. Geometri 591 → (yeni bölge, 49 hayvan + 4 düşman) 1 086–1 102 → (bölgeden ayrılınca) 574–587; son 10 dilimde dilim başı artışlar −1, 3, 1, 0, 1, 0, −263, −262, −3, 13 (medyan 0). Doku 227 → 259 → 233. JS yığını (gc sonrası) 102–121 MB, ilk 4 dilim 102,3 → son 4 dilim en çok 114 MB (+11,7 MB). JS güncelleme 1,27–2,20 ms/kare. DOM 784–833 düğüm, dinleyici 58 sabit. Eksikleri §5.2'de (program sayısı izlenmiyor, eşik gevşek, gerçek zamanlı çizim yok).

**F. Dört oyunculu co-op** (`f8_coop4.cjs`, `coop.cjs --players 4`, 480×270, yerel PeerJS sinyal sunucusu, tek tarayıcıda 4 bağlam; 406 sn; bu koşuda dört oyuncu da ilk denemede katıldı — 06c'deki katılma hatası yeniden üretilmedi). Konuklar ev sahibinin 2–6 m yanında, limanda:

| Sayfa | Çağrı (varsayılan / 4 yön medyan / en çok) | Ana / gölge | Üçgen | Uzak avatar çağrısı (A + G) | JS ms/kare (ilk üç) | Giden veri |
|---|---|---|---|---|---|---|
| Ev sahibi | 1 121 / 767 / 1 121 | 789 / 316 | 1 260 770 | 25 + 42 = 67 (3 avatar) | 2,40 (balık 0,99, hayvan 0,40, gemi 0,23) | 543 KB / 5 sn oyun zamanı = **~109 KB/sn** (yalnız `snap`; konuk başına ~36 KB/sn ≈ 290 kbit/sn) |
| Konuk 1–3 | 1 181–1 193 / 804–815 / 1 181–1 193 | 823–826 / 341–351 | 1,25–1,26 M | 51 + 42 = 93 | 2,09–3,27 (balık 0,62–1,47) | ~3,3 KB/sn |

Ev sahibinde hayvan güncellemesi co-op'ta 0,058 ms, tek oyunculu kipte 0,057 ms (27 hayvanın hepsi zaten 250 m içinde; `|| G.online` farkı bu düzende görünmez, oyuncular farklı adalara dağıldığında ölçülecek: 08d). Tek oyunculu limana göre ev sahibinde +95 çağrı (avatarlar 67). Giden veri Faz 5'in v0.4 modeliyle uyumlu (konuk başına 262–659 kbit/sn).
