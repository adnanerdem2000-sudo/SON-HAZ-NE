## 1. Ölçüm yöntemi

### 1.1 Ortam ve dürüstlük beyanı

- **Bu belgedeki bütün ölçümler yazılımsal GPU'da alındı.** Koşucu `tests/harness/run.cjs:36` Chromium'u `--use-gl=angle --use-angle=swiftshader` ile açar; ölçümlerde okunan çizici adı `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`, piksel oranı 1, tuval 640×360, efekt kipi `medium` (post.js:62: yazılımsal çizicide `high` → `medium`, yani 4× MSAA yerine FXAA). Makine: 4 sanal çekirdek, 15 GB, başsız.
- **Gerçek GPU ölçümü YOKTUR.** Bu ortamda donanım GPU'su olmadığından gerçek FPS, GPU kare süresi, aşırı çizim (overdraw) maliyeti, gölge haritası doldurma maliyeti ve gerçek sürücüde gölgelendirici derleme süresi **ölçülmedi**. Belgedeki hiçbir FPS hedefi bu ortamda doğrulanmış sayılmaz. §1.6'da gerçek makinede aynı ölçümü tek komutla alacak yol tanımlanır; raporda gerçek GPU ve SwiftShader tabloları ayrı tutulur (§8.5).
- Bütün sayılar v0.4 (44d548c) içindir ve **8080'deki değişmeyen kopyadan** alınmıştır. Faz 8 uygulamasına başlarken (Faz 1–7 kodu üstünde) aynı betikler yeniden koşulup taban güncellenecektir: Faz 6'nın yeni adaları, Ölü Sis ve Faz 7'nin AI değişiklikleri sayıları değiştirir.

### 1.2 SwiftShader'da neyin anlamlı, neyin anlamsız olduğu

| Ölçü | SwiftShader'da | Neden | Nasıl ölçüldü |
|---|---|---|---|
| Çizim çağrısı sayısı (ana + gölge + son işleme) | **Anlamlı, donanımdan bağımsız** | three.js'in CPU tarafındaki ayıklama/gruplama kararıdır; gerçek GPU'da da aynı çıkar | `renderer.info.autoReset=false` + `DK.post.render()` (09'daki `_M` ile aynı), geçiş başına ayrım için `renderBufferDirect` ve `shadowMap.render` sarmalayıcıları |
| Üçgen sayısı | **Anlamlı** | Aynı neden; köşe yükünün iyi göstergesi | aynı |
| Geometri/doku sayısı (`info.memory`) | **Anlamlı** (GPU'ya yüklenmiş kaynak) | Yükleme ilk çizimde olur: görünmeyen kaynak sayılmaz (sızıntı testinde kamera önemli) | `info.memory` + geometri kimlik izleyici (§1.3) |
| Program sayısı (`info.programs.length`) ve "ilk görüşte yeni program" | **Anlamlı** (sayı); **süre anlamsız** | Hangi varyantların derlendiği donanımdan bağımsız; derleme süresi SwiftShader'ın Subzero derleyicisine özgü | `info.programs` önce/sonra, `cacheKey` içindeki çıkış renk uzayı |
| JS güncelleme süresi (ms/kare, çizimsiz) | **Anlamlı ama makineye bağlı** | Ana iş parçacığının oyun mantığı maliyeti; bu sanal Xeon'da masaüstüne göre yavaş olabilir. Göreli karşılaştırma (önce/sonra) güvenilir | 60 × `DK.game.update(1/60)`; sistem başına `update` sarmalayıcıları (`_simProf`) |
| JS yığını, DOM düğümü, dinleyici | **Anlamlı** | Tarayıcı belleği; `--enable-precise-memory-info` ile kesin | `performance.memory`, CDP `Performance.getMetrics` |
| `post.render()` duvar süresi (renderMs) | **Yalnız göreli** | Komut kodlama + SwiftShader'ın bir kısmı karışık; ilk karedeki büyük sıçrama derlemeyi gösterir | `performance.now()` |
| Mutlak FPS, GPU süresi, aşırı çizim, gölge doldurma, MSAA bedeli | **Anlamsız** | Rasterleştirme CPU'da; GPU'nun paralelliği ve bant genişliği yok | — (gerçek GPU'da, §1.6) |

Ölçüm kuralları: (1) her sahnede tek kare yerine **8 yönlü tarama** (kamera yaw'ı 45° adımla, sabit eğim) ve medyan/en çok; (2) ölçümden önce **arazi kuyruğu boşalana kadar** beklenir (en çok 25 sn; SwiftShader'da uzak ışınlanmadan sonra kuyruk 25 sn'de boşalmadı, bu durum tabloda "arazi eksik" diye işaretli); (3) rastgele dünya olayları kapatılır (`DK.events.eventT=1e9`), saat 11:00 sabit (`DK.sky.locked`), açık hava, ölümsüzlük; (4) 09'un liman ölçümü (oyun başı + 2 sn, varsayılan kamera) ayrıca birebir tekrarlanır ki eski kayıtla karşılaştırılabilsin.

### 1.3 Ölçüm araçları (salt-okur, oyunun kodu değişmedi)

Bu belge için yazılan betikler (`/tmp/tasarim_y/faz8/`): `tools.js` (sayfaya enjekte edilen araçlar), `f8_taban.js` ve `f8_taban2.js` (9 sahne + menü), `f8_kalite.js` (ön ayarlar), `f8_derleme.js` (ilk görüş derlemesi), `f8_09tani.js` ve `f8_volkan.js` (Volkanik Dev tanısı), `f8_coop4.cjs` (4 oyunculu co-op), `node/fpslimit.mjs` (FPS sınırlayıcı benzetimi). Faz 8'in ilk adımı (§7, P0) bunları `tests/` altına kalıcı olarak taşır.

| Araç | Ne yapar | Not |
|---|---|---|
| `_MM(tag)` | Tek karede çağrı/üçgen/geometri/doku/program/yığın; **her çizim çağrısı** `renderer.renderBufferDirect` sarmalayıcısında nesnesine göre etiketlenir, `shadowMap.render` sarmalayıcısı gölge geçişini ayırır | three r187'de ana geçiş `_this.renderBufferDirect` (three.module.js:18005-18015), gölge geçişi `renderer.renderBufferDirect` (:9395, :9409) çağırır; iki yol da sarılabilir |
| Sahiplik haritası (`_buildOwn`) | Modüllerin (npcs, animals, enemies, ships, islands, terrain, ocean, sky, weatherfx, details, port…) tuttuğu Object3D'leri gezip etiket verir; çizilen nesnenin en yakın etiketli atası kategoridir; etiketsiz üst düzey çocuklar `sahne:<ad|tür[ilk adlı torun]>` olur | Örn. `sahne:Group[rock_tallA]` = deniz kayalıkları (details.js:282-307) |
| `_simProf(n)` | `game.systems`'deki her `update`, oyuncu, gemiler, `_camera`, `_env` sarılır; n×`game.update(1/60)` ve ayrıca `hud.update` | Sistem başına ms/kare |
| `_scan(tag, 8)` | `tpCamera.yaw` 8 yön; her yönde `_MM` | Medyan / en düşük / en yüksek |
| İlk kare | Ölçümden önce program sayısı, ilk ve ikinci `post.render()` süresi | Aynı JS görevi içinde kurulup çizilen içerikte derleme maliyetini yakalar (`f8_derleme.js`) |
| Geometri kimlik izleyici | `BufferGeometry.prototype.addEventListener` sarılır: three'nin `onGeometryDispose` dinleyicisini eklediği an (three.module.js:3909) = GPU'ya ilk yükleme; `dispose` sarılır. Döngü öncesi/sonrası küme farkı + **ilk çizildiği nesne** | Sayaç farkı yerine kimlik farkı: Volkanik Dev tanısı bununla yapıldı (§5.4) |

### 1.4 Sahne kurulum tarifleri (DK kancalarıyla)

Ortak ön hazırlık: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null})`, 4 sn bekleme, `DK.events.eventT=1e9; DK.G.godMode=true; DK.sky.hour=11; DK.sky.locked=true; DK.sky.setWeather('acik', true)`. Işınlanma `_g(x,z)` (oyuncuyu istasyondan/gemiden indirip `physics.groundAt` üstüne koyar), dümen `_helm(x,z,yaw)` (`p.boardShip(s, s.model.stations.helm)`, `shipControl.takeHelm`, çapa yukarı, yelken 0, gemi konumu). Her sahnede önce `terrain.prepare(x, z, {radius})`, sonra arazi kuyruğu beklemesi.

| # | Sahne | Kurulum (konum, saat, hava, doğurma) | Ne ölçer |
|---|---|---|---|
| S0 | Menü | Hazır olur olmaz | Menü yükü, program varyantları (J-03) |
| S1 | **Başlangıç limanı** | (a) 09 birebir: oyun başı + `DK.sim(2)`, varsayılan kamera, saat 8,5. (b) Saat 11, oyuncu doğuş noktasında (`port.boardingPoint.x−8, port.shoreZ−20`), 8 yön. (c) Aynı yerde 4 yön karakter dökümü (J-01). (d) 3 benzetilmiş uzak oyuncu: `DK.net._remoteState(id, {name, app, color}, {x,y,z,…})` + `rp.update()`. (e) Gece 22:00 + meşale aç/kapa | Kategori dökümü, gölge payı, co-op avatar bedeli, ışık ve program sayısı |
| S2 | **Kalabalık kasaba** | Tuz Pazarı (`EXTRA_ISLANDS.tuz_pazari`, `features.type==='port'`): `terrain.prepare(r=500)`, `islands._build(I)`, iskele başından karaya doğru yürüyüp yüksekliği >1,2 m ilk nokta; 5 NPC + pazar | Ada NPC'leri, ada hücreleri, uzaktaki liman NPC'leri |
| S3a | **Yoğun orman** (ek ada) | Kadim Tapınak (cangil): kurulu adanın `B.batch.map` içindeki ağaç/palmiye/çalı örneklerinden 25 m içinde en çok komşusu olan nokta | Ada hücreleri, hücre LOD'u |
| S3b | **Yoğun orman** (çekirdek ada) | Kırlangıç: `props.trees` içinde 20 m'de en çok komşulu ağaç | Tek parça çekirdek bitki örtüsü (J-02) |
| S4 | **Mağara** | Yankı Mağarası odası: `_g(164.2, −77.8, CAVE.floor)` (kamera_tarama b5'le aynı), eğim 0,5 | Mağaradayken dış dünyanın çizimi (bölge ayıklaması) |
| S5 | **Açık deniz** | Dümen; (160, 470) merkezli 1,6–2,8 km çemberinde derinliği < −25 m ve en yakın kıyıya en uzak nokta (ölçülen: (−917, …), kıyıya ~800 m); 3 sn benzetim | Deniz, gemi, uzak ada ayrıntısı |
| S6 | **Fırtına** | S5 + `sky.setWeather('firtina', true)`, 3 sn; `weatherfx.spawnSpout()` + `weatherfx.strike()` | Bulut, yağmur, hortum, yıldırım, sis |
| S7 | **Deniz savaşı** | S5 + `events.spawnEnemyShip()`; düşman sloop'u oyuncu gemisinin 55 m bordasına taşınır; 4 sn benzetim (toplar, tayfa) | İki gemi + tayfa + gülle/duman |
| S8a | **Boss savaşı (deniz)** | Kraken kendi noktasında (`BOSS_SITES.kraken`), gemi 70 m yanında, `bosses.spawn('kraken', site)` + 8 sn savaş | Dokunaçlar, gemi, su |
| S8b | **Boss savaşı (kara)** | Ateş Dağı: `terrain.prepare`, `islands._build`, oyuncu krater kenarında (kraterden `I.r·0,13+18` m); `bosses.spawn('volkanik_dev', site)`, 6,5 sn (yükseliş 4 sn + lav yağmuru) | Boss, lav mermileri, ada içeriği |
| S9 | **Dört oyunculu co-op** | `tests/harness/coop.cjs --players 4`: `net.host` → 3 × `net.join` → `startOnlineHost/Guest`; katılamayan konuğa bir yeniden deneme (06c'deki bilinen hata); konuklar ev sahibinin 2–6 m yanına; 5 sn; her sayfada `_MM` + `_simProf`, `net.broadcast/toHost/toPeer` sarmalayıcısıyla bayt/sn | Uzak avatarlar, ev sahibi benzetimi, ağ yükü |

Önemli kurulum tuzakları (bu çalışmada bulundu): (1) Boss'u **kendi noktasında** doğurup oyuncu 650 m'den uzaktaysa `bosses._check()` (bosses.js:1094-1099) onu 0,5 sn içinde kaldırır; ölçüm boss'suz yapılmış olur (§5.4). (2) Uzak ışınlanmadan sonra arazi işçi kuyruğu SwiftShader'da 25 sn'de boşalmayabiliyor; uzak arazi halkaları sayılmaz. (3) Ölçüm adımları ayrı `page.evaluate` çağrılarındaysa arka plandaki `requestAnimationFrame` döngüsü araya girip ilk görüş derlemesini önceden yapar; derleme ölçümü tek görev içinde yapılmalı.
