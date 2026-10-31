# 3. Dosya Düzeyinde Değişiklik Listesi (v0.3 `762f1c7` → v0.4 geliştirme dalı)

Her madde: dosya · ne değişti · neden · nasıl test edildi. "Test" sütununda yalnız gerçekten çalıştırılan testler yazılır.

## Aşama 1 — Denetim ve test ortamı
| Dosya | Değişiklik | Neden | Test |
|---|---|---|---|
| `.github/workflows/pages.yml` | Yayın yalnız `main`/`master`/`claude/hopeful-cray-o1jw6w` dallarında | Geliştirme dalı canlı sürümü değiştirmesin (kural 6) | Dal adı denetimi (statik) |
| `tests/harness/run.cjs`, `tests/harness/coop.cjs`, `tests/peer-server.cjs`, `tests/README.md` | Senaryo koşucusu (tek oyuncu / 1–4 oyuncu), yerel PeerJS sunucusu | Yeniden üretilebilir test ortamı | 100+ senaryo bu koşucuyla çalıştırıldı |
| `tests/scenarios/00_acilis.js`, `tests/scenarios/v03/*`, `tests/scenarios/coop/*` | Referans senaryolar | Regresyon tabanı | Çalıştırıldı (bkz. 10/12. belgeler) |
| `docs/denetim/01_*.md`, `02_*.md` | İlk denetim raporu ve hata listesi | Teslimat | — |

## Aşama 2 — Arazi işçisi yedeği ve yükleme kurtarma
| Dosya | Değişiklik | Neden | Test |
|---|---|---|---|
| `js/world/terrainGen.js` (yeni) | Karo/derinlik/ızgara üretimi tek modülde, dilimlenebilir üreteçler (`tileGen`, `depthGen`, `gridGen`, `generate`, `runAll`) | Aynı kod işçide ve ana iş parçacığında çalışsın; yerel yedek kareyi kilitlemesin | `02_arazi_yedek.js` 4 kip |
| `js/world/terrainWorker.js` | `generate/runAll` kullanımı, `{t:'ready'}` sinyali, `{t:'error'}` iletisi, `name==='test-crash'` ile çökme kipi | Hata/zaman aşımı algılama ve test edilebilirlik | `?terrain=crash` |
| `js/world/terrain.js` | İş kuyruğu yeniden yazıldı: iş kimliği/zaman aşımı (karo 20 s, derinlik 45 s, ızgara 60 s), 3 deneme, işçi hazır sinyali 8 s, işçi hatasında işlerin yeniden kuyruğa alınması, tüm işçiler düşünce **ana iş parçacığı yedeği** (`_localPump`, MessageChannel dilimleri, 10/20/40 ms bütçe); `prepare()` 45 s üst sınır + odak (`focus`) koruması; `update()` kamera ve odak isteklerini **birleştirir** (ikisinden yükseği) ve bekleyen farklı LOD isteğini iptal eder (`_cancel`); `requestDepth` sıra denetimi (`_depthSeq`) ve odak etkinken uzak kamera isteğinin bastırılması; `heightAt` ağ üçgenlemesiyle tutarlı; `killWorkers()` test kancası; `stats()` | Denetimde doğrulanan kritik hata: işçi yoksa/çökerse `buildWorld` ve `initMapBase` sonsuza dek bekliyordu (yükleme %53'te kalıyor) | `02_arazi_yedek.js` (normal/noworker/badurl/crash), `02_arazi_kurtarma.js` |
| `js/world/terrain.js` (devam) | Yerel pompa **iki şeritli**: kısa karo işleri ile uzun derinlik/ızgara işleri ayrı şeritlerde dönüşümlü ilerler; `requestGrid` sonuç önbelleği (aynı ızgara bir kez üretilir) | Teşhis: 256² harita ızgarası tek şeritte tüm karoları dakikalarca bloke ediyordu (kuyruk 149 → 149, 12 sn) | `02_arazi_kurtarma.js`: öksüz iş 0, kuyruk 120 → 0 (12 sn) |
| `js/game/game.js` | Yükleme sırasında `terrain.localBudget = 40`, sonra 10 | Yedek kipte yükleme süresi | aynı |
| `tools/build-single-html.mjs` (devam) | `file://` altında işçi kaynağı **data: URL** ile verilir (blob: `null` kökenden reddediliyor) | Tek dosya sürümünde işçiler hiç başlamıyordu; v0.3'te bu yükleme ekranında takılma demekti, v0.4'te yedek kipe düşüyordu | `02_tek_dosya.js`: file:// altında 3 işçi, oyun açılır, oyuncu zemine basar |
| `js/world/ocean.js` | `uTide` üniforması güncelleniyor | Denetim bulgusu B-03/E-04: gelgit çizilen suya yansımıyordu | `02_arazi_yedek.js` (hatasız döngü) |
| `tools/build-single-html.mjs` | İşçi adresi ifadesi tek dosyada blob adresiyle değiştirilir; `import.meta` derlemede kalmaz | Tek dosya sürümünde işçi çalışsın | Derleme uyarısız |

## Aşama 3 — Fizik, çarpışma ve gemi hareketi
| Dosya | Değişiklik | Neden | Test |
|---|---|---|---|
| `js/game/game.js` | Sabit alt adımlı döngü: `update(dt)` → en çok 6 adet ≤1/60 s `_step(h)`; fizik/savaş/AI sistemleri alt adımda, içerik/görsel sistemler kare başına; `lastSubsteps` | Kare hızına bağlı fizik (D-02, D-08, D-15, D-16; zıplama tepe noktası 15→60 FPS'te %19 farklı) | `03_fizik_dt.js` önce/sonra, `03_fizik_duzeltmeler.js` |
| `js/core/input.js` | `subframe` bayrağı: alt adımlarda `pressed()` tetiklenmez | Çift zıplama/çift etkileşim önlemi | `03_fizik_duzeltmeler.js` ("tek zıplama") |
| `js/world/physics.js` | `lineBlocked` DDA hücre yürüyüşü (64 hücre erken dönüşü kaldırıldı), `opts {tMin,tMax,rScale}`; `resolve` en çok 3 geçiş; `addPlatform(..., sides=true)` yan yüz çarpıştırıcısı | Uzun görüş hattı her zaman `false` dönüyordu (40 m görüşlü düşmanlar duvar arkasını "görüyordu"); köşelerde gömülme; yüksek platformun içinde yürüme (D-04, D-13, D-17) | aynı |
| `js/game/effects.js`, `js/game/combat.js` | Gülle için önceki→yeni konum süpürmesi (gemi gövdesi, zemin, büyük hedefler) | Hızlı gülle gövdeden geçiyordu (D-10) | "Hızlı gülle…" |
| `js/world/bodies.js` | `impulse` hız üst sınırı 14 m/s; `force()` (sürekli kuvvet); platforma düşen hızlı cisim için önceki taban yüksekliği; itilen uyuyan cisim uyanır | D-03, D-05, D-07, D-09 | döngü hatasız; D-03/D-05 görsel (bkz. bilinen sorunlar) |
| `js/world/hazards.js` | Fıçı: önce itki sonra enkaz; gayzer: kare başı itki yerine `force(…, dt)`; yuvarlanan kaya oyuncuyu daireden dışarı iter | D-03, D-05, D-12 | aynı |
| `js/player/player.js` | Geri tepme `knock*60*dt`; eğim kayması güncel platform bilgisiyle; dik yamaç sabitleri dt ölçekli; yüzme↔yürüme histerezisi + 0.35 s mod kilidi; savunma histerezisi (başla >10, sürdür >0, 0.25 s yeniden başlama); güvertede kaldırılan/batan gemi → denize; yüzen oyuncu dünya sınırı | D-02, D-06, D-16, D-01/C02, C03, E-09, E-10, D-18 | `03_fizik_duzeltmeler.js` |
| `js/ship/ship.js` | Çapa çekişi sınırlı (≤6 m/s²·dt) ve zincir 3×+40 m aşılırsa yeniden demirleme; `collideAll` tanımsız hız → 0, kütle oranı ≤1.5; kürek sandalı dünya sınırı | E-01 (kritik: hızlı yolculuk sonrası gemi 800 m/s fırlıyordu), E-05, D-18 | "Taşınan demirli gemi…", "Kinematik gemiye çarpma…" |
| `js/main.js`, `js/game/events.js` | Hızlı yolculukta `anchorPt=null`; `raiseShip` yangın/çapa/hız sıfırlama; batık gemide düşman gemisi çift güncellenmiyor | E-01, E-11, E-12 | döngü hatasız |
| `js/game/enemies.js` | Alay zamanlayıcısı `dt`; basamak 0.65 m (1.6 m "ışınlanma" yok); mermi görüş hattı `PROJ_LOS` | D-14, D-15, D-04 | döngü hatasız (AI testleri Aşama 5) |
