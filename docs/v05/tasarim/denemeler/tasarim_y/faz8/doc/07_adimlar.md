## 7. Dosya bazında değişiklik ve uygulama sırası

Kurallar: her adım ayrı bir commit; adımdan **önce ve sonra** 45_perf_matris (en az liman + adımın etkilediği sahne) ve ilgili regresyon koşulur; sonuç `tests/out/perf/<adım>_once.json` / `_sonra.json` olarak saklanır ve `tools/perf_rapor.mjs` ile PERFORMANCE_REPORT.md tablosuna eklenir. Görsel değişiklik yapmayan adımlarda sabit kamera konumlarında (kamera_tarama'nın 26 konumu + §8.3) **görüntü farkı** kabul ölçütüdür. Faz 8 başlarken taban, Faz 7 sonu kodunda yeniden ölçülür (bu belgedeki sayılar v0.4'tür).

### 7.1 Sıra ve bağımlılıklar

```
P0 ölçüm altyapısı ──► P1 küçük doğruluk düzeltmeleri ──► P2 görünmeyeni çizme ──► P3 birleştirme/örnekleme
                                    │                          │                         │
                                    └──► P5 ön ısıtma ◄────────┘                         │
                                                               └──► P4 benzetim/CPU      │
                                                                                         └──► P6 ön ayarlar ──► P7 son ölçüm, rapor
```

### 7.2 Adımlar

| Adım | Ne | Dosya: işlev (satır) | Ölçüm (önce → sonra hedefi) | Test | İş (gün) |
|---|---|---|---|---|---|
| **P0.1** | Ölçüm araçlarını kalıcı yap | Yeni `tests/lib/perf_araclari.js` (bu çalışmanın `tools.js`'i: `_MM`, çağrı sınıflandırma, `_simProf`, `_scan`, geometri/doku kimlik izleyici, paylaşımlı varlık kümesi) | — | Kendisi | 1 |
| **P0.2** | Sahne matrisi + bütçe dosyası | Yeni `tests/scenarios/45_perf_matris.js`, `tests/perf_butce.json` (sahne başına üst sınırlar, §8.4) | Taban = §1.5 | 45 | 1 |
| **P0.3** | Önce/sonra rapor aracı | Yeni `tools/perf_rapor.mjs` (iki JSON → PERFORMANCE_REPORT tablosu, fark %) | — | Node | 0,5 |
| **P0.4** | Gerçek GPU kipi | `tests/harness/run.cjs:36`, `coop.cjs:27`: `--gpu` bayrağı (SwiftShader bayrakları yok, `UNMASKED_RENDERER` rapora yazılır, `ortam:'gercek-gpu'|'swiftshader'`) | — | `--gpu` ile 45 (gerçek makinede) | 0,5 |
| **P0.5** | Oyun içi performans katmanı ve tur | Yeni `js/core/perf.js` (`?perf=1` ya da Ayarlar → "Performans katmanı"): FPS p50/p95/p99, kare süresi histogramı, çağrı/üçgen/program, `EXT_disjoint_timer_query_webgl2` ile GPU ms (ana/gölge/son işleme), JS güncelleme ms; `DK.perf.tour()` 9 sahneyi kayıtsız geçici oturumda gezip JSON üretir (gerçek makinede kullanıcı çalıştırır). `js/ui/hud.js:282` FPS yazısı buradan beslenir | — | 45'te `perf.tour()` SwiftShader'da da koşar (yalnız sayılar) | 1,5 |
| **P0.6** | 09 boss döngüsünü düzelt (J-16) | `tests/scenarios/09_performans.js:33-38`: boss yanında, `checkT` donuk, ölçümde `active` doğrulaması, kimlik farkı | Volkanik Dev dG kararsız (0/5) → 5 koşuda 0 | 09 ×5 | 0,5 |
| **P1.1** | FPS sınırlayıcı (J-12) | `js/core/engine.js` `start` döngüsü (52-71): biriktirmeli `_next` | 75/100/144/165 Hz'de 60 sınırı 37,5/50/48/55 → 60 (benzetim) | 51 (sahte rAF zaman damgalarıyla) | 0,5 |
| **P1.2** | Duraklatmada/menüde çizim kısma (J-19) | `engine.js` döngüsü + `game.update` (game.js:192) `G.paused`, menü 30 FPS; css/style.css:101 bulanıklık yakalanmış görüntüye | Duraklatmada `render.frame` artışı: her rAF → ≤ 2/sn | 51 | 0,5 |
| **P1.3** | Tuval MSAA kararı (J-14) | `engine.init` (engine.js:20): `antialias: settings.v.effects === 'low'`; main.js:94-97 sırası korunur | Son işlemde tuval AA true → false; görüntü farkı 0 | 46 | 0,5 |
| **P1.4** | Ön derlemeyi doğru hedefle (J-03) + ısıtma karesi | `js/main.js:112`; `js/core/post.js` (`warmTarget()`): composer `readBuffer` bağlıyken `compileAsync`, sonra gizli bir `post.render()` | Limanda tuval varyantı 42 → ≤ 2; ilk oyun karesinde yeni program ≤ 3 | 46 | 1 |
| **P1.5** | Sabit ışık havuzu (J-07, J-08) | Yeni `js/core/lights.js` (`configure(n)`, `request(owner, pos, color, intensity, range, prio)`, `update(cam)`); `islands.js:236-243` havuzu buraya taşınır (`_updateLamps` :1124 aday verir); `weatherfx.js:115` yıldırım, `cave.js:117-123`, `character.js:328-341` meşale ışığı kaldırılır, `player.js:127-138` `_syncTorch` yuva ister | Nokta ışığı 7–8 → sabit 4; meşale ilk yakışta yeni program 17 → 0, ilk kare (SwiftShader) 9 992 ms → ≤ 2× normal | 46, 17_kamera_kararma (mağara K07), 34 (Faz 6 ışık havuzu) | 1,5 |
| **P1.6** | Oyun içi gölge aç/kapa (J-11) | `js/core/settings.js:52-60`: değişimde `scene.traverse` ile `material.needsUpdate=true` + `sun.castShadow`; "Uygulanıyor…" bildirimi | Kapalı'da USE_SHADOWMAP'li program 0; görüntü "Kapalı ile açılmış oturum"a eşdeğer | 51 | 0,5 |
| **P1.7** | Bellek düzeltmeleri | `js/game/enemies.js:1313` (`start`: işaretleri bırak, B-1); `js/game/bosses.js:126-134, :1054` (sahipli mermileri kaldır, B-2); `js/game/events.js:47, :79, :158-197` (paylaşımlı geometri ya da `disposeTree`, J-21/B-3); `js/core/kk.js:207-247` + `character.js:492-500` (başvuru sayacı, J-22); `js/net/net.js:125` (etiket, B-5) | f8_volkan E: sahnede halka 3 → 0; şişe döngüsü +2 → 0 | 50 | 1,5 |
| **P2.1** | Karakterlerde görüş konisi ayıklaması (J-01) | `js/player/character.js:458, :967`, `js/core/kk.js:93`: `frustumCulled=true`; iskeletli örgülere bağlama pozunda `computeBoundingSphere()` × 1,5 | Liman NPC 159 → ≤ 60; NPC'lere sırt dönükken NPC çağrısı 155 → 0; diğer sahnelerde −110 (uzak liman NPC'leri) | 47, kamera_tarama b4, 17_kamera_kararma, 04_karakter | 1 |
| **P2.2** | `lod.js`: görünürlük + animasyon katmanları | Yeni `js/core/lod.js`; `npcs.js:147-166`, `details.js:543-551` (balıkçı), `net.js:87-124` (uzak oyuncu), `enemies.js:1597-1610`, `animals.js:788-812`; Faz 3'ün `render(alpha, rdt)` evresine kanca | Kasaba (Tuz Pazarı) NPC 307 → ≤ 120; `npcs.update` 0,19–0,40 → ≤ 0,15 ms | 47, 05_dusman_ai, 16_kosu_poz_ganimet | 2 |
| **P2.3** | Gölge: budama, görünmezken güncellememe, texel hizalama | `js/world/sky.js:136-145, :333-341`; `game.js` `_env` (mağara/su altı bayrağı); gölge atan yarıçap kuralı (character.js:480 deseni genelleştirilir) | Limanda gölge 246 → ≤ 130 çağrı, 369 K → ≤ 180 K üçgen; mağarada gölge 175 → 0 | 47, 49, 17_kamera_kararma | 1 |
| **P2.4** | Bölge (mağara) ayıklaması | Yeni `js/world/zones.js`; `js/world/cave.js` (mağara parçalarını tek gruba topla: :50, :88, :101, :169; `insideFactor` :215-227); `game.js` `_env`'de kamera bölgesi | Mağara odası 1 246 / tarama en çok 1 112–1 154 → ≤ 250; limanda mağara içi 30 → 0 | 49 | 1,5 |
| **P2.5** | Ekran boyutu + sis mesafesi ayıklaması (J-13) | `lod.js` (`dMax = min(k·r·çarpan, 1,1·d99)`); `islands.js:404-415` `_cellLod`; `terrain.js:258-265` `_wantSeg` (halka kırpma) | Açık deniz en yoğun yön 962–980 → ≤ 400; kasaba 1 133 → ≤ 650; fırtınada üçgen −%30 | 47 | 1,5 |
| **P3.1** | Hayvan parça birleştirme + tür önbelleği (J-05) | `js/wildlife/animals.js:21-298` (model kurucuları pivot grubu başına `mergeGeometries`), `:736-745` | Liman hayvan 333 → ≤ 130; 7 domuz 140 → ≤ 42 | 48 (poz eşdeğerliği Node), 09 hayvan döngüsü | 2 |
| **P3.2** | Çekirdek ada süsleri: örnekleme/hücre birleştirme | `js/world/props.js:218-232, :321-444`; `js/world/details.js:252-307` (kabuk, kayalık); `js/world/cave.js:93-101` (sarkıt) | Limanda süs 207 → ≤ 50; Tuz Pazarı yönünde kabuk 45 → 2, kayalık 66 → 2 | 48, 07_dunya_kesif (toplama), 08_kalicilik | 2 |
| **P3.3** | Liman malzeme ortaklaştırma + atlas (J-06) | `js/world/port.js:15-125` (`texMat`, `makeBuilding`), `:397-409` (`_lantern`), `:449-457`; `js/core/textures.js` (atlas) | `port-batched` 84 örgü → ≤ 25; liman yapıları 108 → ≤ 45 çağrı; doku 200 → ≤ 175 | 48 (görüntü farkı gündüz/gece), 15_iskele_kamera | 2 |
| **P3.4** | Gemi birleştirme (J-04) | `js/ship/shipModel.js:239-534` (statik parçalar malzeme başına, toplar `InstancedMesh`, `:524` gölge kuralı); `js/ship/ship.js:59-70` (`rebuild`), `:584-665` (`_animate` yalnız ayrık parçalar), `:722` | Sloop 80 → ≤ 20 örgü; açık denizde gemi 161 → ≤ 40 çağrı | 48, 03_fizik_*, 14_deniz_ekipmani, 15_iskele_kamera, coop 06b | 2,5 |
| **P3.5** | Çekirdek bitki hücreleri (J-02) | `js/world/props.js:17-48, :253-275, :307-319` (hücre anahtarı), `islands.js:404-415` (`_cellLod` genel modüle) | Liman üçgen 1,25 M → ≤ 1,0 M; gölge üçgen −120 K | 48 (Node dönüşüm eşdeğerliği), kamera_tarama b4 | 2 |
| **P4.1** | Hayvan benzetim katmanları | `js/wildlife/animals.js:788-812` (`|| G.online` yerine en yakın oyuncu), Faz 3 parçalı hareket | `animals.update` limanda ≤ 0,15 ms; co-op ev sahibi 08d | 47, 08e | 1 |
| **P4.2** | Balık sürüsü LOD'u | `js/wildlife/fish.js:346-400` (`_populate`, `update`): oyuncudan > 120 m ya da oyuncu karada ve sudan > 60 m uzaktaki sürüler 10 Hz; ayrılma kuvveti uzak sürüde atlanır | `fish.update` 0,2–0,7 ms (ölçülen) → ≤ 0,15 ms | 13_donma P07, 14_deniz_ekipmani | 1 |
| **P4.3** | `crowd` uzamsal ızgara (J-26) | `js/game/crowd.js:13-45` (8 m ızgara, dizi yeniden kullanımı; Faz 3 sonrası kare başına bir kez) | Limanda çift sayısı O(n²) → O(n) | 04_karakter, 16 | 0,5 |
| **P4.4** | Parçacık SoA (J-20) | `js/game/effects.js:9-150` | Parçacık yokken yükleme 0; fırtınada `effects` ayırma ~0 | 46 (görüntü), 13 | 1 |
| **P4.5** | Kare başı ayırmalar (J-27) | `sky.js:297-298, :344-345`; `weatherfx.js:246-247`; `details.js:175, :178`; `ship.js:604, :624, :635`; `animals.js:791`; `enemies.js:1543` | 40 sn seyirde ayırma −%40 (CDP örnekleyici) | 52 | 1 |
| **P5.1** | İçerik ön ısıtması (J-17) | Yeni `js/core/warmup.js`; `main.js:110-113` (yükleme son adımı) | Ada/düşman/boss/efekt ilk görüşünde yeni program 1–5 → 0 | 46 | 1,5 |
| **P5.2** | Ada grubu sahneye eklenmeden derleme | `js/world/islands.js:388` (`_runJob` sonundaki `scene.add`), `:364` (`rimAll` yükleme anına) | İlk görüş karesi / ikinci kare 4–20× → ≤ 2× | 46, 13_donma P01 | 0,5 |
| **P6.1** | Ön ayar tablosu ve panel | Yeni `js/core/quality.js`; `js/core/settings.js:10-71`; `js/ui/settingsPanel.js:33-42` | Düşük/Orta/Yüksek değerleri modüllerde (51) | 51, 06_arayuz_960 | 1,5 |
| **P6.2** | Dinamik çözünürlük + ilk açılış önerisi | `js/core/perf.js`, `post.js` (composer ölçeği) | Sahte kare süreleriyle ölçek 1,0 → 0,7 → 1,0 | 51 | 1 |
| **P7** | Son ölçüm, rapor | `PERFORMANCE_REPORT.md` | §8.4 hedefleri | 45–52, 08d–08f, 09, 10, tam regresyon | 1,5 |

Toplam ≈ **39 gün** (tek geliştirici): P0 5, P1 6, P2 7, P3 10,5, P4 4,5, P5 2, P6 2,5, P7 1,5. P3.4 (gemi) ve P3.5 (bitki hücreleri) en riskli; P0 en önce.

### 7.3 Adım başına "önce/sonra" kayıt biçimi

Her commit mesajı ve PERFORMANCE_REPORT.md satırı: `adım | sahne | çağrı önce→sonra | üçgen önce→sonra | gölge çağrısı | JS ms | yeni program | görüntü farkı | test sonuçları`. Bir adım kendi hedefini tutturamazsa geri alınmaz; nedeni rapora yazılır ve bütçe dosyası yalnız ölçüme dayanarak güncellenir (bugünkü 09'daki "≤ 1 100" gibi tek ve gevşek bütçe yerine).

### 7.4 Limanda beklenen kazancın hesabı (09 görünümü, ölçülen gruplardan)

| Aşama | Grup | Önce | Sonra (tahmin) | Fark |
|---|---|---|---|---|
| P2.1–P2.2 | NPC (59 A + 100 G) | 159 | ~45 (görünen NPC'ler, kutudaki gölgeler) | −114 |
| P2.1 | Balıkçılar (12 + 12) | 24 | ~12 | −12 |
| P2.1/P2.3 | Yengeç gölgesi (kutu dışı) | 20 | 0 | −20 |
| P2.4 | Mağara içi (tepenin içinde) | 30 | 0 | −30 |
| P2.5 | Uzak süs/kabuk (ekran boyutu) | — | — | ~−30 |
| **P2 sonrası** | | **1 026** | **~820** | **−206** |
| P3.1 | Hayvanlar (domuz 140, papağan 81, maymun 72, yengeç 20) | 313 | ~100 | −213 |
| P3.2 | Statik süsler (mağara hariç) + kabuklar | 193 | ~42 | −151 |
| P3.3 | Liman yapıları | 108 | ~45 | −63 |
| P3.4 | Gemi + kayık gölgesi | 14 | ~4 | −10 |
| P3.5 | Çekirdek bitki (hücre artışı) | 36 | ~50 | +14 |
| **P3 sonrası** | | | **~400** | **−423** |

Bütçe: P2 sonrası ≤ 850, P3 sonrası ≤ 550, son ≤ 500 (yaklaşık %25 pay bırakılır; Faz 6/7 içerikleri bu sayıları artıracak). Üçgen: P3.5 ve P2.3 ile 1,25 M → ~0,9 M (bitki −220 K, NPC gölgesi −40 K, hayvan −30 K).
