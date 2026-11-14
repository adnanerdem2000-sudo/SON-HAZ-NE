# Faz 8 — Performans ve Optimizasyon: Tasarım Belgesi

Proje: Deniz Korsanları: Son Hazine (three.js r187). Taban: v0.4, commit 44d548c (değişmeyen kopya, http://localhost:8080). Tarih: 14 Kasım 2026.
Kapsam: master_prompt.md "AŞAMA 11 — PERFORMANS VE OPTİMİZASYON"; denetim J (audit_J.json, J-01…J-30); Faz 1 (A-19), Faz 3, Faz 5, Faz 6 tasarımlarıyla uyum; KARARLAR.md test adları (tarayıcı 45–52, co-op 08d–08f).
Bu belge yazılırken **kod değiştirilmedi**; bütün ölçümler salt-okur betiklerle (`/tmp/tasarim_y/faz8/`) alındı.

> **Gerçek GPU ölçümü yoktur.** Ortam başsız Chromium + SwiftShader (yazılımsal WebGL), 4 sanal çekirdek. Çizim çağrısı, üçgen, kaynak/program sayısı ve JS süresi ölçüldü; FPS ve GPU kare süresi **ölçülmedi** (§1.1, §1.6).

## 0. Özet ve kararlar

### 0.1 Ne ölçüldü (taban, SwiftShader, 640×360, Yüksek)

- **Başlangıç limanı (09 kurulumu): 1 021–1 026 çağrı, 1,25 M üçgen** (taban kaydı 1 035; v0.3'ün "1 045"i). 764 ana + 246 gölge + 16 son işleme. 8 yönlü taramada 606–1 054 (medyan 691).
- Çağrıların **%67'si dört kaynaktan**: prosedürel hayvanlar 333 (7 domuz tek başına 140), statik süsler 207 (deniz kayalıkları, heykeller, mağara içi, kabuklar), NPC'ler 159 (görüş konisi ayıklaması kapalı), liman yapıları 108. Üçgenin %38'i her yöne çizilen çekirdek bitki örtüsü (473 K).
- Diğer sahneler (çağrı, tarama medyan / en çok): kasaba 1 130 (514 / 1 133), Kadim Tapınak ormanı 449 (384 / 519), Kırlangıç ormanı 497–777 (777–849 / 1 285–1 311), **mağara 388–1 246 (472–479 / 1 112–1 154)**, açık deniz 392 (397–423 / 980–984), fırtına 413 (438–445 / 995–999), deniz savaşı 568 (701 / 1 279), Kraken 437 (438 / 949), Volkanik Dev 552 (514 / 604). Dört oyunculu co-op ve uzun oturum: §1.5.
- Her sahnede limandaki NPC'ler (7 km uzaktan bile) **110 çağrı** harcıyor; mağara odasında dış dünyanın tamamı çiziliyor; açık denizde 1,6 km'deki adaya bakınca çağrı 2,5 katına çıkıyor.
- Program: son işleme açıkken 95 programın **42'si hiç kullanılmayan** tuval varyantı (yükleme ekranındaki ön derleme yanlış hedefe). Meşaleyi ilk yakmak **17–25 program** derletiyor (yazılımsal GPU'da 10 sn'lik kare). Her yeni ada türü ilk görüşte 1–5 program.
- JS güncelleme 0,85–2,6 ms/kare (koşudan koşuya ±%40); denizde en pahalısı balık sürüleri (0,43–0,78 ms), limanda NPC/balık/hayvan.
- **Volkanik Dev "dG 5": sızıntı değil, test kusuru** (kanıtlı, §5.4): boss uzak noktasında doğurulduğu için `bosses._check()` onu çoğunlukla ölçümden önce kaldırıyor; denetim evresi (31 alt adım) tutarsa `demon.glb`'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez GPU'ya yükleniyor. Deterministik yeniden üretim dG=5, düzeltilmiş döngü dG=0. Yan bulgular: `enemies.start` uçuştaki lav işaretlerini sahnede bırakıyor (gerçek sızıntı), kaldırılan boss'un mermileri uçmaya devam ediyor.

### 0.2 Kararlar

| # | Karar | Gerekçe | Bölüm |
|---|---|---|---|
| K8-1 | Ölçüt seti: çağrı (ana/gölge/son işleme), üçgen, geometri/doku/program, JS ms, ilk görüş derlemesi, bellek; 9 sahne × 8 yön; gerçek GPU ayrı tablo, ölçülmediyse "ÖLÇÜLMEDİ" | SwiftShader'da mutlak FPS anlamsız | §1, §8.5 |
| K8-2 | Önce **görünmeyeni çizmeme** (karakter ayıklaması, bölge, gölge budama, uzak ayrıntı), sonra **birleştirme/örnekleme**; örgü sadeleştirme yalnız gemide ve isteğe bağlı | Ölçülen yük, çizilmesi gerekmeyen nesnelerden geliyor; örgüler zaten düşük çokgenli | §3 |
| K8-3 | GPU örtme sorgusu yok; **veriyle tanımlı bölge (portal) ayıklaması** (mağaralar) var | Gecikmeli sorgu pop-in yapar; açık dünyada örtücü az; mağarada kazanç ~1 000 çağrı | §3.4 |
| K8-4 | Nokta ışığı havuzu **sabit 4** (Düşük 2); meşale, mağara, yıldırım ve fenerler havuzdan | Meşale yeniden derlemesi biter; Faz 6 "havuz 4" ile aynı | §6.2 |
| K8-5 | Benzetim LOD'u ön ayardan bağımsız ve **en yakın oyuncuya** göre (Faz 5 odakları); görsel LOD ön ayara bağlı | Co-op'ta oyun sonucu ön ayarla değişmemeli | §3.8, §4.2 |
| K8-6 | **Yüksek ön ayarın görüntüsü v0.4 ile aynı** (görüntü farkı testi zorunlu); DPR 2 korunur; dinamik çözünürlük varsayılan kapalı | Kullanıcı kuralı: FPS için görünür kaliteyi düşürme | §4.2, §8.3 |
| K8-7 | Volkanik Dev: test düzeltilir (boss yanında, denetim donuk, kimlik farkı); oyunda boss mermileri ve `enemies.start` işaretleri temizlenir | Kök neden kanıtlandı | §5.4–5.5 |
| K8-8 | Önkoşullar: Faz 1 A-19 (LOD ölçeği sırası), Faz 3 ÇİZİM evresi (animasyon katmanları); Faz 8 başında taban Faz 7 sonu kodunda yeniden ölçülür | Belgedeki sayılar v0.4 | §4.4, §7 |
| K8-9 | Liman bütçesi kademeli: P2 sonrası ≤ 850, P3 sonrası ≤ 550, son ≤ 500 (09 görünümü); tarama en çok ≤ 520 | Ölçülen gruplardan hesaplanan kazanç ~−560 | §8.4 |
| K8-10 | Ayar şeması geriye uyumlu (`preset`, `dynRes`, `dprCap` eklenir; eski ayar dosyası açılır) | Faz 4: kayıt biçimine dokunulmaz | §4.3 |

### 0.3 Kullanıcı isteklerinin karşılığı

| İstek | Bugün (ölçülen) | Bu tasarımda | Bölüm |
|---|---|---|---|
| Mevcut raporu başlangıç kabul et, ölçümleri yeniden yap | 09 yalnız 5 sahne, tek kare | 9 sahne × 8 yön yeniden ölçüldü; kalıcı matris 45 | §1.5, §8 |
| Limandaki ~1 045 çağrıyı iyileştir | 1 021–1 035 | Hedef ≤ 500 (−%51), görüntü değişmeden | §2, §7, §8.4 |
| Statik geometri birleştirme | Yalnız liman, 84 örgü | Liman ortak malzeme, süsler hücre birleştirme, gemi | §3.1 |
| InstancedMesh | Kısmen | Kabuk, kayalık, sarkıt, mezar, fener, top | §3.2 |
| LOD | Arazi, ada hücresi | Karakter/hayvan görünürlük + animasyon katmanları, bitki hücreleri | §3.3, §3.7 |
| Occlusion culling | Yok | Bölge ayıklaması (mağara); sorgu önerilmez | §3.4 |
| Gölge mesafesi | 110 m kutu, her şey atıyor | Budama, görünmezken güncellememe, texel hizalama, ön ayar | §3.5 |
| Uzak nesne ayrıntısı | 5 km, sise bağsız | Ekran boyutu + d99 | §3.6 |
| Bitki örtüsü | Tek parça | Hücreler, gölge yalnız yakında | §3.7 |
| Hayvan simülasyon LOD'u | 250 m; co-op'ta hepsi | Katmanlar, en yakın oyuncu | §3.8 |
| Düşman AI LOD'u | Var | Korunur + görünmezken animasyon | §3.9 |
| Parçacık havuzları | Tek Points, CPU verimsiz | SoA halka tampon | §3.10 |
| Doku önbelleği | FIFO 96 | Başvuru sayacı, atlas | §3.11 |
| Geometri ve malzeme paylaşımı | Kısmen | Hayvan türü, yüzen nesne, kabuk | §3.12 |
| Bellek temizliği | 3 açık + Volkanik Dev | Kök neden, 5 düzeltme, kimlik tabanlı test | §5 |
| Gereksiz çizim ve shader derlemesi | Yanlış ön derleme, meşale, duraklatma | Doğru hedef, sabit ışık, ön ısıtma, kısma | §6 |
| 9 test sahnesi | 5 sahne | Hepsi tarif + taban + bütçe | §1.4–1.5, §8.4 |
| Gerçek GPU / SwiftShader ayrımı | Yok | Ayrı tablolar, `--gpu`, `DK.perf.tour()` | §1.6, §8.5 |
| 60 FPS, düşük donanım, uzun oturum, kontrol altında çağrı | Doğrulanamaz / kısmen | Bütçeler, ön ayarlar, 52, gerçek GPU hedefleri | §4, §5, §8.4 |
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
### 1.5 Taban ölçümleri (v0.4, SwiftShader, 640×360, Yüksek ön ayar)

Dört geçiş yapıldı: **G1** (`f8_taban.js`, 9 sahne, beklemesiz, 194 sn, tamamlandı), **G2** (`f8_taban2.js`, arazi kuyruğu beklemeli; menü/liman/kasaba/Kadim Tapınak ölçüldü, sonra sayfa çöktü), **G3** (`f8_taban3.js`; Kırlangıç ormanı/mağara/açık deniz/fırtına ölçüldü, sonra çöktü), **G4** (`f8_taban4.js`, gerçek zamanlı çizim kısılarak `fpsLimit=0,01`, beklemeler `DK.sim` ile; tamamlandı, 95 sn). Aralıklar geçişler arası farktır (varsayılan kamera yönü ışınlanmaya göre değişir; 8 yönlü tarama daha kararlıdır).

**A. Çizim yükü** ("varsayılan" = sahne kurulunca kameranın baktığı yön; tarama = 8 yön):

| Sahne | Varsayılan yön çağrı | Ana / gölge / son işleme | Üçgen (varsayılan) | Tarama medyan / en az / en çok | Tarama üçgen en çok | Not |
|---|---|---|---|---|---|---|
| S0 Menü | 422 | 238 / 168 / 16 | 853 502 | — | — | 86 program (43 doğrusal + 42 tuval + 1) |
| **S1a Liman, 09 kurulumu** | **1 021–1 026** | 764 / 246 / 16 | 1 252 930–1 256 634 | — | — | geometri 750–755, doku 200, program 95 (42 tuval varyantı), yığın 122–129 MB |
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
### 1.6 Gerçek GPU ölçüm yolu (bu ortamda yapılamadı)

Bu oturumda gerçek GPU **yoktur**; aşağıdaki yol, kullanıcının ya da CI'daki bir GPU'lu makinenin aynı sayıları ve ek olarak kare/GPU süresini üretmesi içindir (P0.4, P0.5):

1. **Koşucu `--gpu` kipi**: `node tests/harness/run.cjs tests/scenarios/45_perf_matris.js --gpu --size 1920x1080` SwiftShader bayraklarını eklemez (`--use-gl=angle --use-angle=swiftshader` yerine sistem GPU'su; Windows'ta `--use-angle=d3d11`, macOS'ta `metal`), `headless:false` seçeneği; rapora `UNMASKED_RENDERER_WEBGL`, `devicePixelRatio`, ön ayar ve `ortam:'gercek-gpu'` yazılır.
2. **Oyun içi katman** (`?perf=1`): FPS p50/p95/p99 ve 60 kare histogramı, çağrı/üçgen/program, `EXT_disjoint_timer_query_webgl2` ile ana geçiş / gölge geçişi / son işleme GPU süreleri (sorgu sonucu 2–3 kare gecikmeli okunur; `GPU_DISJOINT_EXT` olursa o kare atılır), JS güncelleme ms.
3. **`DK.perf.tour()`**: kayıt yazmayan geçici bir oturumda §1.4'ün 9 sahnesini sırayla kurar; her sahnede 3 sn ısınma + 10 sn ölçüm (kamera 8 yöne döner); sonunda JSON'u panoya kopyalar. Kullanıcı tarayıcı konsolundan tek komutla çalıştırır; çıktı PERFORMANCE_REPORT.md'nin B tablosuna girer.
4. Raporlama kuralı: SwiftShader sayıları B tablosuna **asla** yazılmaz; gerçek GPU satırı yoksa "ÖLÇÜLMEDİ" yazılır (master_prompt: "Gerçek GPU ölçümü elde edilemiyorsa bunu açıkça belirt").
## 2. Başlangıç limanında çizim çağrısı dökümü

### 2.1 Toplam ve geçişler

09_performans'ın liman kurulumu (oyun başı + 2 sn, varsayılan kamera, saat 8,5) iki ayrı koşuda: **1 026 çağrı / 1 252 930–1 256 634 üçgen** (taban kaydı: 1 035 / 1 253 702). Bunun **764'ü ana geçiş, 246'sı gölge geçişi, 16'sı son işleme** (bloom + renk + çıkış + FXAA tam ekran dörtgenleri). Geometri 750–755, doku 200, program 95. v0.3 raporundaki 1 045 (docs/12_PERFORMANS_RAPORU.md:10, 960×540) ile aynı düzeydedir; 10. belgedeki 999 (§10.2) son kodda yoktur. Kullanıcının andığı "~1 045" v0.3 sayısıdır; v0.4'ün yeniden ölçülmüş değeri **1 026–1 035**'tir.

Aynı noktada saat 11:00'de 8 yönlü tarama: **606 / 651 / 676 / 682 / 691 / 810 / 943 / 1 054** çağrı (medyan 691, en çok 1 054); üçgen 1,12–1,24 M. Gölge geçişi her yönde **268–276 çağrıda sabittir**: gölge yükü kameranın baktığı yönden bağımsızdır (aşağıda nedenleri).

### 2.2 Nesne grubu dökümü (09 görünümü, 2. koşu, etiketli sınıflandırma)

Yöntem §1.3: her çizim çağrısı nesnesinin sahibi olan modüle göre etiketlendi. "A" ana geçiş, "G" gölge geçişi.

| # | Grup (kaynak) | A çağrı | A üçgen | G çağrı | G üçgen | Toplam çağrı | Pay | Kök neden (dosya:satır) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Prosedürel hayvanlar**: 7 domuz 140, 9 papağan 81, 6 maymun 72, yengeç 20 (+20 G) | 313 | 33 376 | 20 | 18 120 | **333** | %32 | Parça başına ayrı örgü/geometri/malzeme: `boarModel` 20 örgü (animals.js:21-68), `monkeyModel` 12 (:69-105), `parrotModel` 9 (:164-193); yengeç glb `Animated`, `frustumCulled=false` (character.js:967) |
| 2 | **Liman NPC'leri** (9 NPC + 1 rıhtım) | 59 | 37 284 | 100 | 42 766 | **159** | %15 | Kit örgülerinde `frustumCulled=false` (character.js:458, kk.js:93): her NPC her karede, gölge kutusunun dışında bile gölgeye çizilir; NPC başına ≥6 iskeletli gövde parçası + aksesuar |
| 3 | **Statik süsler** (etiketsiz üst düzey gruplar): deniz kayalıkları `rock_tallA` 36, kazı/harabe heykelleri `statue_column*` 42, adsız gruplar 51, kayalar 10, varil 10, sandık 10, çadır 8, `Root_Scene` 5, kamp ateşi 1; **mağara içi** adsız örgüler 30 (tünel, kubbe, 26 sarkıt, masa — tepenin içinde, limandan görünmez) | 203 | 17 629 | 4 | 188 | **207** | %20 | Her biri `assets.prop` klonu ya da tekil örgü, birleştirme/örnekleme yok: details.js:282-307 (kayalık başına `cloneMat`), props.js:221-231 ve :321-330 (`_placeProp`), :332-444 (`_statue/_grave/_deadTrees/_kemikRuins/_camp`), cave.js:50, :88, :93-101, :169 (mağara parçaları doğrudan sahneye) |
| 4 | **Liman yapıları** (`port-batched`) | 44 | 5 288 | 64 | 11 156 | **108** | %11 | `mergeStatic` malzeme uuid'ine göre birleştirir (batch.js:4-56) ama `texMat` her çağrıda yeni malzeme + doku klonu üretir (port.js:15-20), 7 fenerin her biri 2 benzersiz malzeme (port.js:397-409) → 84 örgü (denetim J-06) |
| 5 | **Arazi** | 44 | 209 024 | 8 | 107 520 | 52 | %5 | 4 LOD halkası (terrain.js:18-23), seg ≥ 32 karolar gölge atar (terrain.js:354) |
| 6 | **Çekirdek ada bitki örtüsü** (palmiye, orman ağacı, eğrelti, ot, çalı, kaya…) | 26 | 303 164 | 10 | 169 894 | 36 | %3,5 (üçgenin **%38**'i) | Tür/parça başına tek dev `InstancedMesh`, sınır küresi 606–871 m (ölçüldü): görüş konisi ve gölge kutusu ayıklaması işlemez (props.js:17-48, :254-266, :307-319) |
| 7 | Oyuncu karakteri | 16 | 5 845 | 14 | 5 709 | 30 | %3 | Kit parçaları + aksesuar |
| 8 | Balıkçı karakterleri (2) | 12 | 8 308 | 12 | 8 308 | 24 | %2 | `frustumCulled=false`; teknelerinin içinde (details.js:338-353) |
| 9 | Toplanabilir kabuk/istiridye (46) | 16 | 844 | 0 | 0 | 16 | %1,6 | Her biri ayrı geometri + malzeme (details.js:252-271) |
| 10 | Son işleme | 16 | 16 | — | — | 16 | %1,6 | post.js:75-91 |
| 11 | Tehlike setleri | 11 | 1 153 | 0 | 0 | 11 | | hazards.js |
| 12 | Balık sürüleri | 10 | 65 860 | 0 | 0 | 10 | (üçgen %5) | Tür başına `InstancedMesh`, `frustumCulled=false` (fish.js:326-329) |
| 13 | Oyuncu gemisi + kayık (görüş dışında) | 0 | 0 | 14 | 5 286 | 14 | | Gemi örgülerinin hepsi gölge atar (shipModel.js:524) |
| 14 | Okyanus | 1 | 178 802 | — | — | 1 | (üçgen %14) | 300² ızgara (ocean.js:64-89), `frustumCulled=false` (:241) |
| 15 | Bulut, gök, martı, dümen suyu, şelale, parçacık, defter | 10 | 21 108 | — | — | 10 | | weatherfx.js:64-77 vb. |
| | **Toplam** | **764** | | **246** | | **1 026** | | |

Sonuçlar:

1. **Çağrıların %67'si dört kaynaktan geliyor**: hayvanlar (333), statik süsler (207), NPC'ler (159), liman yapıları (108). Bunların hepsi görüntü değiştirmeden azaltılabilir (birleştirme, örnekleme, görüş ayıklaması). Denetimin "~200 karakter çağrısı" tahmini (10. belge §10.5) bugün 213'tür (NPC 159 + oyuncu 30 + balıkçı 24).
2. **Üçgenin %38'i çekirdek bitki örtüsü** (473 K: 303 K ana + 170 K gölge), %25'i arazi (316 K), %14'ü okyanus (179 K). Bitki örtüsü kamera nereye bakarsa baksın aynen çizilir; tarama boyunca üçgen sayısının 1,12–1,24 M'de dar kalmasının nedeni budur.
3. **Gölge geçişi (246–276 çağrı, 369 K üçgen) yönden bağımsız**: NPC'ler (100), liman (64), yengeçler (20), bitki (10 çağrı ama 170 K üçgen) ve arazi (8 çağrı, 108 K üçgen). NPC ve yengeçler `frustumCulled=false` olduğu için gölge kamerasının ±55 m kutusunun (sky.js:141) dışında da çiziliyor (three.module.js:9373); bitki örtüsünün dev sınır küresi her zaman kutuyla kesişiyor.

### 2.3 Kamera yönüne göre karakter çağrıları (J-01'in ölçümle doğrulanması)

| Kamera yaw'ı | Toplam | NPC (A/G) | Balıkçı (A/G) | Oyuncu (A/G) |
|---|---|---|---|---|
| 0 (denize) | 607 | 55 / 100 | 17 / 12 | 16 / 14 |
| π/2 | 683 | 81 / 100 | 17 / 12 | 16 / 14 |
| π (kasabaya) | 1 057 | 59 / 100 | 12 / 12 | 16 / 14 |
| −π/2 | 689 | 95 / 100 | 12 / 12 | 16 / 14 |

NPC'lere **sırtını dönmüşken de** 55 ana + 100 gölge çağrısı harcanıyor. Aynı etki uzakta da sürüyor: Kadim Tapınak ormanında (limandan ~7 km) **liman NPC'leri 55 + 55 çağrı**, Kraken savaşında (−4 450, −5 006; limandan ~6,7 km) **55 + 55**, Tuz Pazarı'nda (1,9 km) 15 NPC için **187 + 120 çağrı**.

### 2.4 Uzak ada ayrıntısı (ölçüm)

Açık denizde (en yakın kıyıya ~800 m) 8 yönün 6'sında 387–485 çağrı, Kırlangıç'a bakan iki yönde **962 / 980 çağrı ve 0,90 M üçgen**. Tuz Pazarı'nda limana bakan yön **1 133 çağrı**: o yönde 1,9 km ötedeki liman yapıları 85, deniz kayalıkları 66, adsız süsler 62, kabuklar 45, heykeller 40, demirli oyuncu gemisi 82, balıkçılar 54 çağrı. Kraken savaşında (−4 450, −5 006; limandan ~6,9 km, hayalet bölgesi sisi) Kırlangıç yönüne bakınca **961 çağrı**: liman NPC'leri 121 + 55, liman yapıları 85, adsız süsler 61, deniz kayalıkları 48, kabuklar 31, mağara içi 30, çekirdek bitki 26 (303 K üçgen). İkinci açık deniz koşusunda (−911, 3 057; en yakın kıyı 1,6 km) aynı yön 980 çağrı. Açık havada sis 1,95 km'de %99'a ulaşır (FogExp2 0,0011; sky.js:359), bölge sisinde çok daha yakında; yani bu nesneler ekranda 1–2 piksel ya da tamamen sis rengidir. Bunlar "görünür kaliteyi" düşürmeden kesilebilecek çağrılardır (§3.6). NPC'ler `frustumCulled=false` olduğu için 5 km'lik `camera.far`'ın ötesinde bile çizim çağrısı üretir (GPU kırpar ama çağrı ve köşe işleme harcanır).

### 2.5 Benzetilmiş co-op avatarları (limanda)

`net._remoteState` ile 3 uzak oyuncu (gerçek ağ yok) eklenince **+72 çağrı (30 A + 42 G), +31 K üçgen**: avatar başına ~24 çağrı. Dört oyunculu gerçek ölçüm §1.5 S9'dadır.
## 3. Tekniklerin değerlendirmesi

Ölçekler: "Kazanç" sütunundaki sayılar §2 ve §1.5'teki **ölçülmüş** grup değerlerinden hesaplanan tahminlerdir (uygulamadan sonra 45_perf_matris ile doğrulanacak). "Görsel risk": D = düşük (görüntü birebir aynı kalmalı; fark testiyle kanıtlanır), O = orta (eşik/geçiş anında fark olabilir; kamera taramasıyla denetlenir), Y = yüksek.

### 3.0 Özet tablo

| # | Teknik | Bugün | Karar | Beklenen kazanç (liman 09 görünümü / diğer) | Görsel risk | Bağımlılık |
|---|---|---|---|---|---|---|
| T1 | Statik geometri birleştirme | Yalnız liman (port.js:317), malzemeler benzersiz | **Uygula**: liman malzeme ortaklaştırma, çekirdek ada süsleri hücre birleştirmesi, gemi gövde parçaları | −68 (liman yapıları) −120…−170 (süsler); denizde gemi −120 | D–O | T12 |
| T2 | InstancedMesh | Bitki, mercan, martı, bulut, balık | **Uygula**: kabuklar, deniz kayalıkları, sarkıtlar, mezarlar, fenerler, gemi topları | −14 kabuk, −34 kayalık, −25 sarkıt | D | — |
| T3 | LOD (ayrıntı düzeyi) | Arazi halkaları, ada hücreleri, deniz devi 700 m | **Uygula**: karakter/hayvan görünürlük + animasyon katmanları, bitki hücreleri; örgü LOD'u yalnız gemide (isteğe bağlı) | −104 NPC (her sahnede ~−110 uzak liman NPC'si) | O | Faz 3 ÇİZİM evresi |
| T4 | Örtme (occlusion) | Yok | **Bölge ayıklaması uygula** (mağara içi/dışı), GPU örtme sorgusu **uygulama** | Mağarada −1 000 çağrı; limanda −30 | O | Faz 6 mağaraları |
| T5 | Gölge mesafesi | 110 m kutu, her şey gölge atıyor | **Uygula**: gölge atan budaması, mağara/su altı/gecede güncelleme yok, texel hizalama, ön ayara bağlı kutu | Gölge geçişi 246 → ~110 çağrı, 369 K → ~150 K üçgen; mağarada gölge 0 | D (hizalama iyileştirir) | T3 |
| T6 | Uzak nesne ayrıntısı | Yok (camera.far 5 km) | **Uygula**: ekran boyutu + sis görüşüne bağlı mesafe ayıklaması | Açık denizde en yoğun yön 980 → ~350; kasabada 1 133 → ~550 | O | T1, T2 |
| T7 | Bitki örtüsü | Çekirdek adalar tek parça | **Uygula**: çekirdek bitkiyi hücrelere böl (ada `Batch` deseni), gölge yalnız yakında | Üçgen −220 K (liman), gölge −120 K | D–O | — |
| T8 | Hayvan simülasyon LOD'u | 250 m dışında yok; co-op'ta hepsi | **Uygula**: mesafe katmanları (en yakın oyuncuya), parça birleştirme | −213 çağrı (liman); JS −0,1…−0,3 ms | O | Faz 3, Faz 5 |
| T9 | Düşman AI LOD'u | Var (enemies.js:1599-1605) | **Koru + genişlet**: görünmezken animasyon seyreltme | JS küçük; kamp/savaş sahnelerinde | D | Faz 7 |
| T10 | Parçacık havuzları | Tek Points (900), CPU verimsiz | **Uygula**: SoA halka tampon, kısmi yükleme | Çağrı 0; JS/GC küçük | D | Faz 3 |
| T11 | Doku önbelleği | Anahtarlı + FIFO 96 | **Uygula**: başvuru sayacı, liman atlası, doku bütçesi | Doku 200 → ≤ 170 | D | T1 |
| T12 | Geometri/malzeme paylaşımı | Kısmen | **Uygula**: hayvan türü önbelleği, yüzen nesneler, kabuklar | Bellek + yükleme takılması | D | — |
| T13 | Bellek temizliği | Çoğu var; 3 açık | **Uygula**: J-21, J-22, lav işaretleri, boss mermileri; 09 testi düzeltmesi | Uzun oturum düz | D | — |
| T14 | Gereksiz çizim ve derleme | Ön derleme yanlış varyant; meşale; duraklatma | **Uygula** | İlk kare derlemesi ~40 → ≤ 3 program; meşale 25 → 0 | D | — |

### 3.1 T1 — Statik geometri birleştirme

**Bugün.** `mergeStatic` (batch.js:4-56) yalnız Kırlangıç limanında kullanılıyor (port.js:317) ve malzeme uuid'ine göre birleştiriyor. `texMat` her çağrıda dokuyu klonlayıp yeni malzeme üretiyor (port.js:15-20), bina dokuları bina tohumuyla ayrı tuvallerden geliyor (port.js:34-59), 7 fenerin her biri iki benzersiz malzeme kullanıyor (port.js:397-409; `port.update` hepsine aynı parlaklığı veriyor, port.js:455). Sonuç: `port-batched` 84 örgü, limanda **108 çağrı** (44 A + 64 G). Çekirdek ada süsleri (deniz kayalıkları, kazı noktası işaretleri, heykel/mezar/harabe/kamp, mağara parçaları) hiç birleştirilmiyor: limanda **207 çağrı**.

**Öneri.**
1. *Liman*: duvar/çatı/temel türü başına **tek malzeme**; bina çeşitliliği köşe rengine (`color` özniteliği, `vertexColors`) ve 2×2 doku atlasının hücresine taşınır (UV'ye pişirilir: `repeat` birleştirmeden önce UV'ye uygulanır). Fenerler tek direk + tek ampul malzemesi. Deniz fenerinin hareketsiz parçaları birleşik gruba. Hedef `port-batched` ≤ 25 örgü.
2. *Çekirdek ada süsleri*: `assets.prop` klonları yerine `islands.js`'teki `Batch` (hücreli `InstancedMesh`) ya da hücre başına `mergeStatic` kullanılır. Seçim kuralı: aynı model ≥ 4 kez → örnekleme (T2); tekil ve hareketsiz → 160 m hücre ve malzeme başına birleştirme. Çarpıştırıcılar (`physics.addCircle`) değişmez.
3. *Gemi* (J-04): sloop 80 örgü / 19 malzeme, hepsi gölge atıyor (shipModel.js:524). Hareketsiz parçalar (gövde donanımı, küpeşte, merdiven, ambar kapağı, masa, kova, mataforalar) **malzeme başına** birleştirilir; dönen/oynayan parçalar (yelkenler, dümen çarkı, toplar, çapa ve zinciri, bayrak, fener) ayrı kalır; toplar `InstancedMesh`. Hasar görselleri (`_applyDamageVisuals`, ship.js:722; direk devrilmesi `masts`) birleşik örgüyü yeniden kurar (`rebuild`, ship.js:66). Hedef sloop ≤ 20 örgü, ≤ 10 gölge atan; brigantin ≤ 30.

**Kazanç.** Liman yapıları 108 → ~40; süsler 207 → ~40 (mağara içi T4 ile ayrıca 0); denizde oyuncu gemisi 161 → ~35 çağrı (açık deniz, fırtına, Kraken: her biri −125; deniz savaşında iki gemi −250).

**Görsel risk.** D–O. Doku ölçeği ve renkler birebir korunmalı (önce/sonra görüntü farkı, §8.3). Birleşik örgü tek sınır küresi taşıdığı için görüş konisi ayıklaması kabalaşır; bu yüzden birleştirme **hücre** (160 m) düzeyinde yapılır.

**Uyum.** Faz 3: birleşik örgüler yalnız görseldir; çarpıştırıcılar, platformlar ve `GORSEL` kamera kutuları ayrı kalır. Faz 6: yeni yapılar zaten `Batch`'e giriyor (Faz 6 §6.3: "Kit parçaları adanın Batch'ine… yapı başına ≤ 12 örnek grubu"); bu adım çekirdek adaları aynı düzene getirir. Faz 2/5: gemi görünüm/hasar iletileri (`shipDmg`) değişmez; konukta `rebuild` aynı kodu çalıştırır.

### 3.2 T2 — InstancedMesh

**Bugün.** Örnekleme bitki örtüsünde (props.js:17-48), ek ada hücrelerinde (islands.js:79-140), mercan/yosun/kabuk/martıda (details.js:24-37, :225-250, :324), bulutta (weatherfx.js:64-77) ve balıkta (fish.js:326) var. Yok: 46 toplanabilir kabuk/istiridye (details.js:252-271, her biri yeni geometri + malzeme), deniz kayalıkları (details.js:282-307, kayalık başına `cloneMat`), 26 sarkıt (cave.js:93-101), mezarlar (props.js:356-372), liman fenerleri, gemi topları.

**Öneri.** Tür başına `InstancedMesh`; toplanan/yok edilen örnek `setMatrixAt(i, sıfır ölçek)` ya da son örnekle yer değiştirme + `count--` ile gizlenir; Faz 4 K-3 gereği kabuk ve istiridye yenilenince örnek geri açılır. Deniz kayalıklarının kararmış rengi (details.js:299, `color×0,8`) örnek rengiyle (`setColorAt`) verilir: tek malzeme.

**Kazanç.** Limanda kabuk 16 → 2, kayalık 36 → 2, sarkıt 26 → 1 (dışarıdan T4 ile 0); Tuz Pazarı'ndan bakınca kabuk 45 → 2, kayalık 66 → 2.

**Görsel risk.** D. **Uyum.** Faz 4: toplama durumu kayıtta kimlikle tutuluyor; örnek indeksi kayda girmez (yalnız kimlik → indeks eşlemesi çalışma anında). Faz 5: kabuk toplama olayı değişmez.

### 3.3 T3 — LOD

**Bugün.** Arazi 4 halka (terrain.js:18-23), ek ada hücre görünürlüğü/gölgesi (islands.js:404-415), deniz devi 700 m (megafauna.js:405), düşman AI adımı (enemies.js:1597-1606). Karakter, hayvan, gemi, çekirdek bitki ve süslerde mesafe LOD'u yok; üstelik karakterlerde görüş konisi ayıklaması bile kapalı (character.js:458, :967; kk.js:93).

**Öneri.** Bu oyunda örgüler zaten düşük çokgenli (karakter parçası ~1 K üçgen, palmiye 156, orman ağacı 376); kazanç **örgü sadeleştirmesinden değil, çizilmeyen/güncellenmeyen nesneden** gelir. Ortak bir `js/core/lod.js` modülü:

- *Görünürlük katmanı* (çizim): `visible = d < dVis(kategori, ön ayar)` + %10 histerezis; kategori mesafeleri §4'te. Yakın-kamera silinmesinin (nearfade.js) tersi olarak geçişte 0,3 sn'lik titreşimli belirme/kaybolma (aynı `discard` kancası, ters yön) kullanılabilir; pop-in yerine.
- *Animasyon katmanı* (çizim evresi, Faz 3 `render(alpha, rdt)`): ≤ 40 m her kare; 40–120 m 15 Hz; > 120 m ya da görüş konisinin dışında 4 Hz; gizliyken hiç. `mixer.update(biriken rdt)` ile çağrılır: animasyon süresi kaymaz.
- *Benzetim katmanı* (adım evresi): §3.8–3.9.
- *Örgü LOD'u*: yalnız gemide, 300 m ötesinde ip/top/güverte süsleri gizlenir (birleştirmeden sonra kazanç küçükse yapılmaz).

**Kazanç.** J-01 düzeltmesi (görüş konisi ayıklaması geri) + mesafe gizleme: limanda NPC 159 → ~55; **diğer bütün sahnelerde** uzak liman NPC'lerinin 110 çağrısı ve 74 K üçgeni sıfırlanır (ölçüldü: Kadim Tapınak, Kraken, Volkanik Dev, açık deniz, fırtına, deniz savaşı). Animasyon katmanları NPC/balıkçı/uzak oyuncu güncellemesini azaltır (npcs.update 0,19–0,40 ms ölçüldü).

**Görsel risk.** O: animasyonlu iskeletli örgünün sınır küresi bağlama pozundan küçük kalırsa ekran kenarında kaybolma olur. Önlem: `SkinnedMesh.computeBoundingSphere()` bağlama pozunda, yarıçap ×1,5; ya da karakter kökü için elle küre testi (r ≈ 1,6 m) ve kök `visible` yönetimi. Kamera taraması (kamera_tarama b4, 17_kamera_kararma) kabul ölçütüdür.

**Uyum.** Faz 3: animasyon ve görsel güncellemeler ÇİZİM evresine taşınıyor (Faz 3 §1.3, C-14); LOD bu evreye kanca olarak eklenir, adım evresine dokunmaz. Faz 5: uzak oyuncu avatarları (net.js:57-124) aynı karakter LOD'unu kullanır; ağ ara değerlemesi (NetInterp) çizim evresinde konum hesaplar, LOD yalnız `visible`/animasyon sıklığını belirler. Faz 7: düşman ve boss animasyon değişiklikleri `lod.animStep(entity)` sorusuna uyar; hedefli/saldıran düşman her zaman tam katmanda.

### 3.4 T4 — Örtme ayıklaması

**Bugün.** Yalnız three.js görüş konisi. Mağaradayken dış dünya, dışarıdayken mağara içi çiziliyor (cave.js mağara parçalarını doğrudan sahneye ekliyor: :50, :88, :101, :169).

**Ölçüm.** Mağara odasında **1 246 çağrı** (561 hayvan, 152 süs, 151 NPC, 65 arazi, 56 liman, 36 çekirdek bitki — 473 K üçgen, okyanus 179 K); 8 yön medyanı 479, en çok 1 112. Odadan bunların hiçbiri görünmez. Limandayken mağara içinin 30 çağrısı (tepenin içinde) çiziliyor.

**Değerlendirme.** WebGL2 örtme sorguları (`ANY_SAMPLES_PASSED_CONSERVATIVE`) three.js'te hazır değil; sonuçlar 1–3 kare gecikmeli gelir (pop-in), sorgu başına sınır kutusu çizimi gerekir, açık deniz/ada dünyasında büyük örtücü azdır. **Önerilmez.** Bunun yerine **bölge (portal) ayıklaması**: veriyle tanımlı bölgeler (`zones.js`): Yankı Mağarası için `CAVE.chamber` + tünelin ağızdan ≥ 30 m içerisi (`cave.insideFactor`, cave.js:215-227, kamera konumuyla) "iç bölge"; içteyken dış gruplar (okyanus, bulut/sis, arazi karoları — mağara kabuğu hariç, ada içerikleri, liman, çekirdek bitki, hayvan/NPC/düşman kökleri, gemiler) `visible=false`; dışarıdayken ve ağza 40 m'den uzakken mağara grubu gizli. Ağız ile 30 m arasındaki geçiş bölgesinde hiçbir şey gizlenmez (dışarısı görülebilir).

**Kazanç.** Mağara odasında ~1 246 → ≤ 250 çağrı ve gölge geçişi 0 (T5 ile); limanda −30.

**Görsel risk.** O: yanlış bölge sınırı dışarıyı gösteren bir açıda nesne kaybettirir. Kabul: tünelin 5 noktasında (ağızdan 10/20/30/40/60 m) bölge ayıklaması açık/kapalı görüntülerinin piksel farkı = 0 (§8.3).

**Uyum.** Faz 6: yeni mağaralar (Ayaz Mağarası, Derin Galeri; Faz 6 K-4 "oyma" A planı) `CAVES` listesine giriyor (Faz 6 §6.4: `STORY_CAVES → CAVES`); bölge tanımı her mağara kaydına `zone: { chamber, path, minDepth }` olarak eklenir, ada kurulunca kaydolur, boşaltılınca silinir (`B.extras`). Faz 3: kamera mağara tavanı sınırlaması (game.js:345) değişmez.

### 3.5 T5 — Gölge mesafesi

**Bugün.** Tek yönlü ışık, 2048 (yüksek) / 1024 harita, ±55 m ortografik kutu, far 300 (sky.js:136-145); kutu her kare odağa kayıyor, texel hizalaması yok (sky.js:338-341). `frustumCulled=false` karakterler ve dev sınır küreli çekirdek bitki kutudan bağımsız gölgeye çiziliyor; geminin bütün örgüleri gölge atıyor (shipModel.js:524). Mağarada güneş ×0,03'e iniyor (sky.js:336) ama gölge haritası her kare çiziliyor.

**Öneri.**
1. *Gölge atanları budama*: T3 ile karakterler gölge kutusuna göre ayıklanır (three.module.js:9373 kendiliğinden işler); çekirdek bitki hücrelerinde gölge yalnız oyuncuya ≤ 120 m hücrelerde (ek adalarda bugün 220 m; kutu 55 m olduğu için 120 m yeter); yarıçapı < 0,25 m parçalar gölge atmaz (gemi parçaları, süsler).
2. *Görünmez gölgeyi çizmeme*: `renderer.shadowMap.autoUpdate=false` (castShadow'a dokunmadan, program değişmez) şu durumlarda: kamera mağara iç bölgesinde (T4), su altında (`sky.underwater`), güneş yoğunluğu ışık eşiğinin altında (derin gece, `sky.sun.intensity < 0,15`). Çıkışta `needsUpdate=true` ile aynı karede güncellenir.
3. *Texel hizalama*: gölge kamerasının konumu texel boyutuna (110 m / 2048 = 5,4 cm) yuvarlanır: yürürken gölge kenarı titremesi biter (görsel **iyileşme**).
4. *Ön ayar*: Yüksek ±55 m / 2048 (bugünkü görünüm), Orta ±40 m / 1024 (texel 7,8 cm), Düşük kapalı. Bugünkü "Orta"da (1024, ±55 m) texel 10,7 cm idi; yeni Orta daha keskin gölge verir.

**Kazanç.** Limanda gölge geçişi 246 → ~110 çağrı, 369 K → ~150 K üçgen (NPC −85, bitki −120 K üçgen, liman −40 T1 ile); mağarada 175 çağrı / 290 K üçgen → 0; açık denizde gemi gölgesi 80 → ~10 (T1).

**Görsel risk.** D. Gölge kutusu ve çözünürlük Yüksek'te değişmez. **Uyum.** Faz 3 çizim ara değerlemesiyle çakışmaz (gölge, çizim pozuyla çizilir).

### 3.6 T6 — Uzak nesne ayrıntısı

**Bugün.** `camera.far = 1500 + 3500·görüş` (settings.js:61; varsayılan 5 000 m), gök kubbesi 4 000 m yarıçaplı (sky.js:72), okyanus 3 200 m (ocean.js:66). Sis yoğunluğu açık havada 0,0011 (d99 = √(−ln 0,01)/ρ ≈ **1 951 m**), fırtınada 0,0076 (**282 m**), sisli havada 0,0101 (**212 m**) (sky.js:359; WEATHERS sky.js:10-17). Kesme mesafeleri sise bağlı değil (J-13).

**Ölçüm.** Açık denizde Kırlangıç'a bakan yön 962–980 çağrı (diğer yönler 387–485); Tuz Pazarı'nda limana bakan yön 1 133 çağrı. Kırlangıç'tan 1,6–1,9 km'de çizilen süsler ekranda 1–2 piksel ya da tamamen sis rengidir.

**Öneri.** `lod.js`'e iki kural:
1. *Ekran boyutu*: nesnenin ekrandaki çapı 1080 satırlık ekranda ~1,5 pikselin altına inince çizilmez: `dMax = k · r`, FOV 70°'de k ≈ 1 000 (odak 771 px; 1,5 px ⇔ d ≈ 1 028·r). Örnek: 0,12 m kabuk 120 m, 0,7 m sandık 700 m, 1 m NPC 1 000 m. Ön ayar çarpanı Yüksek 1,0 / Orta 0,7 / Düşük 0,5.
2. *Sis*: `dMax ≤ 1,1 · d99(hava, bölge)`; arazi halkası yarıçapı da `min(LOD.d·lodScale, 1,15·d99)` ile kırpılır (en yakın halka hiç kırpılmaz). Gök kubbesi ve okyanus kırpılmaz (camera.far değişmez: kubbe 4 km).
Statik nesnelerde denetim hücre düzeyinde ve 4 Hz'de (islands.js `_cellLod` deseni, 15 karede bir); dinamiklerde varlık başına.

**Kazanç.** Açık denizde en yoğun yön 980 → ~350; kasabada 1 133 → ~550 (T3 ile); fırtınada arazi ve ada hücreleri 280 m'de kesilir (09'daki fırtına ölçümü 697 K üçgen).

**Görsel risk.** O: eşikte belirme. Önlem: eşik %99 sisin ötesinde ya da 1,5 pikselin altında; %10 histerezis; kamera taramasında sınır geçişi görüntü farkı.

**Uyum.** Faz 5 dürbün odağı (`lk`, ±8° koni, 1 500 m): dürbün açıkken FOV küçüldüğü için ekran boyutu kuralı `k` değerini FOV'a göre büyütür (dürbünde uzak gemi ve ada görünür kalır). Faz 6 Ölü Sis: sis kabukları görüş mesafesini daha da düşürür; d99 hesabına bölge sisi (`regionFog`) zaten giriyor.

### 3.7 T7 — Bitki örtüsü

**Bugün.** Çekirdek 6 adanın bitkisi tür/parça başına tek `InstancedMesh`; ölçülen sınır küresi yarıçapları 606–871 m (props.js:17-48; bu çalışmada `boundingSphere.radius` okundu). Yüksek ayarda 1 598 örnek (palmiye 297, orman ağacı 264, ot 425, eğrelti 241, çalı 157, kaya 97…). Limanda **473 K üçgen** (303 K ana + 170 K gölge), kamera nereye bakarsa baksın. Bütün bitki malzemelerinde yakın-kamera silinmesi (`discard`, nearfade.js:64-92).

**Öneri.** Çekirdek bitkiyi ek adalardaki `Batch` ile aynı düzene getir: dönüşüm listeleri ve RNG sırası **birebir aynı** (props.js:164-251 değişmez), yalnız `instanced()`/`_inst()` çağrıları 160 m hücre × tür anahtarıyla gruplanır; `_cellLod` (islands.js:404-415) aynı kurallarla (büyük 850 m, küçük 240 m, gölge ≤ 120 m) bunlara da uygulanır. Küçük türler (ot, eğrelti, çiçek, mantar, küçük kaya) 200–240 m arasında titreşimli kaybolur. Alternatif (ileride): r187 `BatchedMesh` (nesne başına ayıklama, malzeme başına tek çağrı); rüzgâr kancası `USE_INSTANCING` yerine `USE_BATCHING` dalı ister, şimdilik ertelenir.

**Kazanç.** Limanda üçgen −200…−250 K (ana −100 K, gölge −120 K); çağrı 36 → 40–70 (hücre sayısı artar, ayıklama azaltır). Not: çağrı sayısında küçük artış kabul edilir; üçgen ve gölge kazancı büyüktür.

**Görsel risk.** D–O (küçük türlerin 240 m sınırı). **Uyum.** Faz 6 K-3 (bitki adaylarında sabit çekiliş) ek adalar içindir; çekirdek bitki RNG'si (`rng(4242)`) değişmez → Node eşdeğerlik testi (dönüşümlerin sıralı özeti aynı). Faz 3: bitki çarpıştırıcıları (props.js:236-249) değişmez.

### 3.8 T8 — Hayvan simülasyon LOD'u

**Bugün.** Bölge r+150 m'de doğar, r+230 m'de silinir, denetim 4 Hz (animals.js:793-807); güncelleme yalnız 250 m içinde **ama co-op'ta (`|| G.online`) bütün hayvanlar** (animals.js:810). 250 m içinde seyreltme yok. Modeller parça başına örgü/geometri/malzeme (domuz 20, timsah 34, yılan 22 örgü; animals.js:21-298).

**Ölçüm.** Limanda 27 hayvan, **333 çağrı**; `animals.update` 0,08–0,40 ms/kare (koşudan koşuya değişken). Mağarada 46 hayvan **617 çağrı**. Benzetilmiş co-op'ta (`G.online=true`) aynı 27 hayvan için fark ölçülemeyecek kadar küçük (0,08 → 0,11 ms): hepsi zaten 250 m içinde.

**Öneri.**
1. *Parça birleştirme* (J-05): pivot grubu başına (gövde, baş, her bacak/kanat) tek geometri; tür başına geometri önbelleği; renk farkı malzeme varyantıyla (tür × renk). Domuz 20 → 6, maymun 12 → 6, papağan 9 → 4, timsah 34 → 8, yılan 22 → 4 (segment dalgası köşe gölgelendiricisine taşınırsa 1).
2. *Benzetim katmanları* (en yakın oyuncuya uzaklık; Faz 5 odak noktalarıyla aynı küme: yerel oyuncu + `G.remotes`): ≤ 40 m her adım; 40–100 m AI 10 Hz; 100–250 m AI 4 Hz; > 250 m donuk. Seyrek adımlar birikmiş `dt` ile koşar (Faz 3 C-15/C-16'nın parçalı hareket kuralı: hareket alt parçalara bölünür, karar seyrek). `|| G.online` kaldırılır; yerine "herhangi bir oyuncuya ≤ 250 m".
3. *Görünürlük/animasyon*: T3 katmanları; 120 m ötesi gizli (ekran boyutu kuralı domuz için ~700 m verir ama sürü/av hayvanı için 120–160 m oynanış açısından yeterli görüş).

**Kazanç.** Limanda 333 → ~120 çağrı (birleştirme) ve uzaktakiler gizlenince ~90; mağarada 617 → 0 (T4); JS −0,05…−0,2 ms.

**Görsel risk.** O (bacak salınımı ve yılan dalgası birebir korunmalı; Node'da poz karşılaştırması). **Uyum.** Faz 3: AI/hareket ADIM'da, animasyon ÇİZİM'de (Faz 3 §3 tablosu). Faz 5: hayvan anlık görüntüsü ilgi alanı katmanlarıyla gider (K0 ≤ 40 m 7,5 Hz…); benzetim katmanı konukta değil, ev sahibinde işler; konuk yalnız ara değerler. Faz 2: hayvan hasarı/ganimeti host'ta, değişmez.

### 3.9 T9 — Düşman AI LOD'u

**Bugün.** Hedefsiz düşman 45–90 m'de 0,066 sn, 90 m ötesi 0,25 sn birikimle tek `e.update(edt)`; hedefli düşman seyreltilmez (enemies.js:1597-1606; 05_dusman_ai F-08 tabanda geçti). Gruplar 140 m'de doğar, 220 m'de kalkar (enemies.js:1539-1570). `e.char.update(edt)` aynı seyreklikte (yani animasyon da seyrek).

**Öneri.** Mevcut kural korunur (Faz 3 A6 bunu parçalı harekete çeviriyor). Eklenen: görüş konisinin dışındaki ve > 30 m düşmanın animasyonu 4 Hz (T3), gölgesi kutu dışında yok. Faz 7'nin yeni algı/taktik davranışları aynı `lod.simTier()` sorusunu kullanır; "hedefli/saldıran düşman tam katman" kuralı Faz 7'de de korunur.

**Kazanç.** Çağrı: kamp/deniz savaşı sahnelerinde düşman çağrıları görünür olanlarla sınırlanır (deniz savaşında tayfa 24 A + 59 G; gölgenin çoğu kutu dışında). JS küçük (0,01–0,35 ms ölçüldü).

**Görsel risk.** D. **Uyum.** Faz 7 AI tasarımı (henüz yok; tarayıcı 37–44, co-op 08a–08c) bu API'ye bağlanır; Faz 7 seyreltmeyi değiştirirse 05_dusman_ai F-08 ve 45 matrisi yeniden koşulur.

### 3.10 T10 — Parçacık havuzları

**Bugün.** Tek `Points`, en çok 900 (effects.js:9, :24-35); parçacık başına JS nesnesi, dolunca `shift()` (effects.js:45-48), ölüler `splice` (:121-146); her güncellemede 4 öznitelik × 900 öğe tam yükleme ve `setDrawRange(0, MAX)`; `effects` alt adım kümesinde (game.js:187) → düşük FPS'te kare başına 2–6 yükleme.

**Öneri.** SoA (`Float32Array` konum/hız/ömür/renk/boy) halka tampon; ölü parçacık son canlıyla yer değiştirir (O(1)); `setDrawRange(0, n)`; `attribute.addUpdateRange(0, n·itemSize)`; GPU yüklemesi kare başına bir kez, ÇİZİM evresinde (Faz 3 §3: "Parçacıklar … ÇİZİM (rdt)"). Ön ayar bütçesi: 900 / 700 / 450.

**Kazanç.** Çağrı değişmez (1). Fırtınada ve deniz savaşında JS ve çöp toplama baskısı azalır; parçacık yokken yükleme 0. **Görsel risk.** D. **Uyum.** Faz 3 doğrudan.

### 3.11 T11 — Doku önbelleği

**Bugün.** `textures.js:5` anahtarlı önbellek; liman `texMat` klonları aynı `Source`'u paylaşır (GPU belleği çoğalmaz) ama ayrı malzeme yüzünden birleştirmeyi engeller; bina tohumuna göre ~39 adet 256² tuval dokusu (port.js:34-59). Karakter renk atlası `kk.texture` FIFO 96 (kk.js:244): en eski doku, kullanılıp kullanılmadığına bakılmadan `dispose` ediliyor (J-22).

**Öneri.** Liman doku atlası (T1); `kk.texture` için başvuru sayacı (Character.build artırır, `_disposeModel` azaltır) ve yalnız sayacı 0 olanlar arasında LRU tahliye. 45 matrisinde doku sayısı bütçesi.

**Kazanç.** Limanda doku 200 → ≤ 170; uzun oturumda yeniden yükleme takılması yok. **Görsel risk.** D.

### 3.12 T12 — Geometri ve malzeme paylaşımı

**Bugün.** Paylaşılan: ada parça önbelleği (islands.js:44-77), deniz devi `GEO` (megafauna.js:135-210, init'te hazırlanıyor), mermi `PROJ_GEO` (enemies.js:1248-1281). Paylaşılmayan: hayvan bireyleri, kabuklar, yüzen olay nesneleri (events.js:158-197, her doğuşta yeni geometri + malzeme), yıldırım tüpleri (weatherfx.js:171-216, çakış başına 4 geometri).

**Öneri.** Hayvan türü geometri önbelleği (T8), kabuklar (T2), yüzen nesneler için modül düzeyinde paylaşımlı geometri/malzeme (J-21 de kapanır), yıldırım için 2 örgülük havuz (konumları güncellenir). Karakter klon malzemeleri (character.js:459) görünüm anahtarına göre paylaşılabilir; kazanç küçük olduğu için yalnız aynı tohumlu düşman dalgalarında değerlendirilir.

**Kazanç.** Yükleme anı takılması ve GPU kaynak sayısı; çağrı değişmez. **Görsel risk.** D.

### 3.13 T13 — Bellek temizliği

Ayrıntı §5. Özet: ada/hayvan/düşman/kese/gemi bırakma testleri tabanda 0/0; açık olanlar: yüzen olay nesneleri (J-21, bu çalışmada ölçüldü: şişe döngüsü başına +2 geometri), `kk.texture` FIFO (J-22), `enemies.start` uçuştaki yaylı atış işaretlerini sahnede bırakıyor (yeni bulgu), `bosses._clear` sahibi kaldırılan lav mermilerini uçuşta bırakıyor (yeni bulgu); 09'un Volkanik Dev kontrolü **sızıntı değil, ölçüm kusuru** (§5.4).

### 3.14 T14 — Gereksiz çizim ve gölgelendirici derlemeleri

Ayrıntı §6. Özet: yükleme ekranındaki `compileAsync` son işleme açıkken yanlış (tuval) varyantı derliyor (J-03; ölçüldü: limanda 95 programın 42'si kullanılmayan tuval çıkışlı); meşale ışık sayısını değiştirip **25 + 7 program** derletiyor (J-08; ölçüldü); sahnede sürekli 7 nokta ışığı (J-07; ölçüldü); ilk görülen ada içeriğinde tek karede yazılımsal GPU'da **5,3 sn** (J-17); duraklatmada ve menüde tam çizim sürüyor (J-19); tuval son işleme açıkken de 4× MSAA (J-14); oyun içi gölge kapatma programları yenilemiyor (J-11).
## 4. Kalite ayarları ve görüş mesafesi

### 4.1 Bugünkü durum

Ayarlar paneli (settingsPanel.js:33-42): çözünürlük ölçeği, grafik kalitesi (yeniden başlatma), FPS sınırı, görüş mesafesi, gölge, su (yeniden başlatma), efekt, FOV, FPS göster. Varsayılan her şey en yüksek (settings.js:12) + tuval 4× MSAA (engine.js:20) + piksel oranı `min(DPR, 2)` (engine.js:21). Bilinen hatalar: gölge çözünürlüğü açılışta uygulanmıyor (J-09), herhangi bir ayar değişince arazi LOD ön ayarı sıfırlanıyor (J-10) — **ikisi de Faz 1'de A-19 olarak düzeltiliyor** (faz1_brief madde 16: `terrain.init` `baseLod`'u kaliteye göre yazar, `lodScale = baseLod × (0,7 + 0,3·viewDistance)`, apply dünya kurulduktan sonra bir kez daha, `sky.build` gölge boyutunu `settings.v.shadows`'tan alır; test `02_ayar_lod.js`). Oyun içinde gölge kapatma programları yenilemiyor (J-11), FPS sınırı yüksek tazeleme hızlarında hedefin altında (J-12; bu çalışmada Node benzetimiyle doğrulandı: 60 sınırı 75 Hz'de **37,5**, 100 Hz'de 50, 144 Hz'de 48, 165 Hz'de 55 FPS; 30 sınırı 75/100 Hz'de 25).

10. belge §10.9.1'in el ölçümü (1280×720, sayfa yenilenerek): liman Yüksek 1 000 çağrı / 1,22 M üçgen, Orta 1 019 / 1,05 M, Düşük 737 / 0,57 M; program 89 / 89 / 40. Bu çalışmanın ön ayar ölçümü (`f8_kalite.js`, 640×360) §1.5'te.

### 4.2 Ön ayarlar (Faz 8 sonu)

İlke: **Yüksek ön ayarın görüntüsü v0.4 ile aynı ya da daha iyi** (texel hizalı gölge, titreşimsiz geçişler); kazanç yalnız görünmeyen işi kesmekten gelir. Orta ve Düşük, görünür ayrıntıyı bilinçli olarak azaltan ön ayarlardır ve kullanıcı seçer.

| Ayar | Düşük | Orta | Yüksek (varsayılan) | Uygulama |
|---|---|---|---|---|
| Piksel oranı üst sınırı | 1,0 | 1,5 | 2,0 (bugünkü) | Anında |
| Çözünürlük ölçeği | 0,8 | 1,0 | 1,0 | Anında |
| Dinamik çözünürlük (kare süresine göre 0,7–1,0) | Açık | Kapalı | Kapalı | Anında; isteğe bağlı |
| Son işleme | Kapalı (tuval MSAA) | Bloom + FXAA (tuval MSAA kapalı) | Bloom + 4× MSAA hedef (gerçek GPU) / FXAA (yazılımsal) | Anında (ısıtma karesiyle) |
| Gölge | Kapalı | 1024, ±40 m kutu | 2048, ±55 m kutu (bugünkü) | Anında; Açık↔Kapalı program yenilemesi (J-11) |
| Gölge atanlar | — | Yarıçap < 0,35 m atmaz | Yarıçap < 0,25 m atmaz | Kurulumda |
| Su ızgarası / parça gölgelendiricisi | 160² / sade (köpük ve kırılma yok) | 220² / tam | 300² / tam | Yeniden başlatma |
| Bitki yoğunluğu (props.js:166, islands.js:443) | 0,45 | 0,75 | 1,0 | Yeniden başlatma |
| Küçük bitki/süs mesafesi | 140 m | 200 m | 240 m | Anında (hücre LOD) |
| Ada hücre görünürlüğü | 600 m | 750 m | 850 m | Anında |
| Ekran boyutu ayıklaması çarpanı (§3.6) | 0,5 | 0,7 | 1,0 | Anında |
| Karakter/hayvan görünürlük mesafesi | 90 / 70 m | 140 / 110 m | 220 / 160 m | Anında |
| Animasyon katmanları (tam / 15 Hz / 4 Hz sınırları) | 20 / 60 m | 30 / 90 m | 40 / 120 m | Anında |
| Görüş mesafesi (arazi `lodScale` tabanı, Faz 1 A-19) | 0,7 × (0,7 + 0,3·vd) | 0,85 × (…) | 1,0 × (…) | Faz 1 kuralı |
| Sise bağlı kesme (d99) | Açık | Açık | Açık | Anında |
| Parçacık bütçesi | 450 | 700 | 900 | Anında |
| Bulut pufu ayrıntısı | 1 (80 üçgen) | 1 | 2 (bugünkü) | Yeniden başlatma |
| Nokta ışığı havuzu | 2 | 4 | 4 | Yeniden başlatma (program sayısı sabit kalsın) |
| FPS sınırı | 30 (öneri) | 60 | Sınırsız | Anında (biriktirmeli sınırlayıcı, J-12) |

"Benzetim" katmanları (hayvan/düşman AI sıklığı, ada kurulum bütçesi, ağ) **ön ayara bağlı değildir**: co-op'ta ev sahibinin ön ayarı oyun sonucunu değiştirmemeli.

### 4.3 Uygulama ayrıntıları

- **Ayar şeması.** `settings.v` yeni anahtarlar alır: `preset` (`'dusuk'|'orta'|'yuksek'|'ozel'`), `dynRes` (bool), `dprCap`. Yükleme `{...DEFAULT_SETTINGS, ...s}` ile birleştirdiği için (settings.js:31) eski ayar dosyaları bozulmaz (Faz 4 kayıt şemasına dokunulmaz; ayarlar `dksh.settings` anahtarında, kayıt yuvalarında değil). Tek bir ayar elle değişince `preset='ozel'`.
- **Kaynak tek yerde.** `js/core/quality.js` ön ayar tablosunu tutar; `settings.apply()` yalnız bu tablodan türetilen değerleri modüllere iletir (`lod.configure`, `lights.configure`, `effects.budget`, `sky.setShadow`, `terrain.lodScale`). Faz 1'in `baseLod` kuralı aynen kullanılır.
- **İlk açılışta öneri (otomatik değil).** `WEBGL_debug_renderer_info` dizgesi (post.js:48-58 zaten okuyor) ve 2 sn'lik görünmez bir kıyas (menü sahnesinde 60 kare, `EXT_disjoint_timer_query_webgl2` varsa GPU süresi) ile "Bu cihaz için Orta öneriliyor" bildirimi; kullanıcı onaylamazsa Yüksek kalır.
- **Dinamik çözünürlük.** Son 60 karenin p90 kare süresi hedefin (1/FPS sınırı ya da 16,7 ms) %90'ını 2 sn boyunca aşarsa ölçek 0,05 düşer (en az 0,7); %60'ın altında 4 sn kalırsa 0,05 artar. Yalnız composer hedefi yeniden boyutlanır (tuval değil), takılma olmaz.
- **FPS sınırlayıcı (J-12).** `engine.start` döngüsünde biriktirmeli zamanlama: `if (now < this._next − tol) return; this._next = max(this._next + minDt, now − minDt)`; `tol` = ölçülen rAF aralığının yarısı (üstel ortalama). Node benzetimi (`node/fpslimit.mjs`): 60 sınırı 60/75/100/120/144/165 Hz'de **60,0** FPS; 30 sınırı 29,9–30,0 FPS.

### 4.4 Görüş mesafesi ile LOD ölçeğinin sırası (A-19 uyumu)

Faz 1 düzeltmesinden sonra açılış sırası: `settings.load` → `engine.init` (tuval MSAA kararı burada; §6.2 madde 6) → `terrain.init(quality)` (`baseLod`) → dünya kurulumu → `settings.apply()` (gölge boyutu, `lodScale`, görüş). Faz 8 bu sıraya **`quality.js`'in hesapladığı değerleri** bağlar, yeni bir sıra getirmez. Sise bağlı kesme (`d99`) `lodScale`'i değiştirmez; yalnız halka yarıçaplarını kare bazında `min(..., 1,15·d99)` ile kırpar (Faz 1'in histerezisi A-07 korunur).
## 5. Bellek

### 5.1 Bugünkü bırakma (dispose) disiplini

| Kaynak türü | Oluşturan | Bırakan | Durum (taban + bu çalışma) |
|---|---|---|---|
| Ada içeriği (hücre `InstancedMesh`, `own` geometri, boyalı malzeme, NPC, çarpıştırıcı) | islands.js `_newJob/_buildGen` | `_release` (islands.js:427-436) | 3 kur/sök döngüsü dG=dT=0 (09 adım 13, bu çalışmada da 0) |
| Prosedürel hayvan, glb hayvan | animals.js:21-298 | `Animal.dispose` (animals.js:736-745) | boar/croc/snake/bat 0/0 |
| Karakter (düşman, NPC, uzak oyuncu) | character.js `build` | `_disposeModel` (character.js:492-500) | düşman 3×4 döngüsü 0/0 |
| Ganimet kesesi, gemi | treasure.js, ship.js | `disposeTree` (ship.js:739-743) | 0/0 |
| Boss | bosses.js | `BossBase.dispose` (bosses.js:126-134) | Kraken, Taş Muhafız 0/0; Volkanik Dev: §5.4 (sızıntı yok) |
| Yaylı atış işareti (lav, zehir) | enemies.js `lob` (:1416-1429) | `_impact` (:1433) | **`enemies.start` uçuştaki işaretleri sahnede bırakıyor** (§5.5) |
| Mermi örgüsü | `projMesh` (enemies.js:1249-1281, paylaşımlı geometri) | `scene.remove` (:1534) | Doğru (paylaşımlı) |
| Yüzen olay nesnesi (şişe, gök taşı, kazazede salı) | events.js `spawnFloating` (:158-197) | yalnız `scene.remove` (events.js:47, :79) | **Sızıntı (J-21)**: şişe döngüsü başına +2 geometri (+2 malzeme), bu çalışmada ölçüldü |
| Karakter renk atlası | kk.js `texture` (:207-247) | FIFO 96, kullanımdaki dokuyu da bırakabilir (:244) | **J-22** (kod okuması; uzun oturumda yeniden yükleme) |
| Yıldırım tüpleri | weatherfx.js `strike` (:171-216) | 0,45 sn sonra dispose | Doğru; çakış başına 4 geometri + 1 malzeme ayırma |
| Su hortumu | weatherfx.js:226-231 | `geometry.dispose` (:335) | Doğru |
| Arazi karosu | terrain.js:340-361 | LOD değişiminde/kaldırmada `geometry.dispose` (:347, :358) | Doğru (Faz 1 `02_arazi_yasam` sınayacak) |

### 5.2 Uzun oturum (10_uzun_oturum)

Senaryo (tests/scenarios/10_uzun_oturum.js): 30 dk oyun zamanı, 20 dilim × 90 sn (`DK.sim(30, 1/30)` × 3, dilim aralarında olay döngüsüne teslim ve `gc()`), liman yürüyüşü → seyir → düşman dalgaları → hava değişimi + Kraken → kayıt/yükleme. Ölçütler: U01 NaN yok, U02 son 10 dilimde geometri/doku artış medyanı ≤ 1 ve toplam ≤ 300, U03 benzetim maliyeti ≤ 3× ilk dilim, U04 yığın son dilimlerde ilk dilimlere göre ≤ +30 MB. Son kodda koşum sonucu §1.5 tablosunun altındadır (koşu bu çalışmada yapıldı; sonuç orada).

Eksikler: (1) program sayısı izlenmiyor (meşale, yeni ada → program artışı sızıntı gibi davranabilir); (2) yüzen olay nesneleri ve dünya olayları kapsam dışı (`events.eventT` doğal akıyor ama 30 dk'da 6–10 olay); (3) eşik "toplam ≤ 300" gevşek; (4) gerçek zamanlı çizimli koşu yok (yalnız `DK.sim`); (5) GPU süreç belleği ölçülmüyor. Bu çalışmada ikinci taban geçişinde (çok sayıda ışınlanma + 25 sn'lik gerçek zamanlı çizim beklemeleri, ~10 dk) **sayfa süreci çöktü** ("Target crashed"); birinci geçiş aynı sahneleri beklemesiz 194 sn'de sorunsuz tamamladı. Kök neden bu ortamda ayrıştırılamadı (yazılımsal GPU belleği olabilir); 52_uzun_oturum_gercek (§8) bu yüzden GPU süreç belleğini de kaydeder.

### 5.3 Önbellek ve bütçeler

| Önbellek | Yer | Sınır | Öneri |
|---|---|---|---|
| Model varlıkları (glb) | assets.js `models` | Sınırsız, açılışta 51 model | Değişmez (paylaşımlı); ilk çizimde GPU'ya yüklenir → §6 ön ısıtma |
| KayKit şablon/parça | kk.js | Sınırsız | Değişmez |
| Ada parça önbelleği `PARTS` | islands.js:44-77 | Sınırsız (model × kit) | Değişmez |
| `KIT_NF` kopya malzemeleri | islands.js:82 | Sınırsız, bilerek bırakılmaz (program kalsın) | Değişmez |
| Karakter renk atlası | kk.js:207-247 | FIFO 96 | Başvuru sayacı + LRU (J-22) |
| Prosedürel dokular | textures.js:5 | Anahtarlı | Liman atlası ile anahtar sayısı azalır |
| Deniz devi geometrisi | megafauna.js:135-210 | Tür başına 1 | Değişmez (init'te hazır) |

Bütçe (45 matrisi, Yüksek, 640×360): limanda geometri ≤ 760, doku ≤ 200 (taban 750–755 / 200; T1–T12 sonrası hedef doku ≤ 170). Uzun oturumda (52) program sayısı ısınmadan sonra +5'i geçmez.

### 5.4 Volkanik Dev "dG 5" kararsızlığının kök nedeni (kanıtlı) ve çözümü

**Belirti.** Taban koşusunda 09_performans adım 18-19: `volkanik_dev: {dG: 5, dT: 0}`; iki yeniden koşuda 0. Denetim J-16 "kök neden doğrulanmadı" diyordu; uçuştaki lav mermisi ve gecikmeli dispose hipotezleri sınandı.

**Bulgular (bu çalışmanın ölçümleri, `f8_volkan.js`, `f8_09tani.js`):**

1. 09'un döngüsü boss'u **kendi noktasında** doğuruyor: `DK.bosses.spawn('volkanik_dev')` → `BOSS_SITES` → Ateş Dağı (7 700, −900). Oyuncu o sırada Kadim Tapınak'ta (~8,2 km; ayrı denemede limanda 7 778 m).
2. `bosses.update` her 0,5 sn'de `_check()` çağırıyor (bosses.js:1106-1107) ve bütün oyuncular boss'a 650 m'den uzaksa boss'u `_clear()` ile kaldırıyor (bosses.js:1094-1099: "herkes uzaklaştıysa boss geri çekilir"). Testin `DK.sim(0.5)` penceresi içinde bu denetim çoğunlukla çalışır ve **ölçüm karesinden önce boss'u siler**: ölçüm boss'suz yapılır.
3. `checkT` 1/60'lık alt adımlarla azalır (`DK.sim(0.5)` = 15 × `game.update(1/30)` = 30 alt adım). Kayan nokta yüzünden 0,5 − 30·(1/60) = +1,04·10⁻¹⁶ > 0: denetim aralığı **31 alt adımdır** (Node ile doğrulandı). Boss ancak doğduğu anda `checkT` tam 0,5 ise (denetim bir önceki alt adımda çalıştıysa) pencereyi atlatır. Evre, önceki benzetim adımlarına ve adımlar arasındaki gerçek zamanlı karelere bağlıdır; bu yüzden sonuç koşudan koşuya değişir.
4. Boss ölçüm karesine kadar yaşadığında `demon.glb`'nin **5 paylaşımlı geometrisi** (`Demon_1` 2 500 köşe, `Demon_2` 761, `Demon_3` 472, `Demon_4` 42, `Trident` 392; varlık önbelleği, bilerek bırakılmaz — bosses.js:131 `skip: this.anim?.model`) GPU'ya **ilk kez** yüklenir. `Animated` örgüleri `frustumCulled=false` (character.js:967) olduğundan 8 km uzaktan da çizilir; ilk çizim gölge geçişindedir. Bu ilk yükleme ısınma döngüsünden (k=0) sonraki bir döngüye düşerse sayaç farkı **+5** çıkar.

**Deterministik yeniden üretim** (her döngüde doğurma anında `checkT` elle verilerek):

| Deney | Döngülerde `checkT` | Ölçümde boss etkin mi | Sonuç |
|---|---|---|---|
| A | 0,2 / 0,2 / 0,2 | hayır / hayır / hayır | dG = 1 (yalnız ilgisiz bir gemi parçasının gölgede ilk yüklenmesi: `BoxGeometry` 24 köşe, `ship-sloop`) |
| B | 0,2 / **0,5** / 0,2 | hayır / **evet** / hayır | **dG = 5**, fark kimliği = Demon_1..4 + Trident (kontrol `eq: 5` GEÇTİ) |
| C (önerilen test) | donuk (1e9), boss oyuncunun 28 m yanında | evet ×4 | **dG = 0, kalan kimlik yok** (GEÇTİ) |
| D | yakında gerçek savaş, uçuşta 1 lav (işaretli) varken `_clear()` | — | 3 sn sonra geometri 753 → 753; işaret halkası `_impact`'te bırakıldı (sahnede halka 0); **1 lav mermisi sahibi silinmiş boss'la uçmaya devam etti** |
| f8_09tani (09'un kopyası) | doğal | — | 3 + 6 döngüde dG = 0 (bu koşuda evre denk gelmedi) |

**Sonuç: sızıntı değil; testin ölçüm kusuru.** Uçuştaki lav mermisi hipotezi elendi (yükseliş 4 sn sürdüğü için testte atış yok; gerçek savaşta işaretler bırakılıyor). Gecikmeli dispose hipotezi elendi (dispose eşzamanlı). Ek olarak: bu kusur yüzünden 09, Volkanik Dev'in (ve Ateş Dağı'ndan uzakta doğurulan Kraken'in) GPU kaynak bırakmasını çoğu koşuda **hiç sınamıyordu**: boss çizilmeden siliniyordu.

**Çözüm.**
- *Test (09 ve 45/50)*: boss oyuncunun yanında doğurulur (`spawn(bid, {id: bid, x: p.x+30, z: p.z})`), döngü boyunca `DK.bosses.checkT = 1e9` (ya da test kancası `DK.bosses.noRetreat = true`); ölçüm karesinde `DK.bosses.active === ilk` doğrulanır (aksi hâlde kontrol **hata** verir, sessizce geçmez). Sayaç farkı yerine **kimlik farkı**: "döngüde GPU'ya yüklenip döngü sonunda sahnede olmayan ve paylaşımlı varlık kümesinde (assets.models, kk şablonları, `PARTS`, `PROJ_GEO`, deniz devi `GEO`) bulunmayan geometri/doku sayısı = 0". Bu ölçüt ilgisiz ilk yüklemeleri (A'daki gemi parçası) de dışarıda bırakır.
- *Oyun*: (1) `bosses._clear()`/`dispose` sahibi o boss olan uçuştaki mermileri kaldırır (`enemies.shots.filter(s => s.owner === boss)` → işaret bırakılır, mermi ölür) — geri çekilen boss'un hasar vermesi biter; (2) boss modelleri (demon, orc_brute) yükleme ekranında ön ısıtılır (§6): ilk karşılaşmadaki 5–11 geometri yüklemesi ve program derlemesi oyuna yansımaz.
- *Kabul*: düzeltilmiş döngü 5 ardışık koşuda dG = dT = 0 ve kimlik farkı boş; boss her ölçüm karesinde etkin; `checkT` evresi elle 0,5'e ayarlanmış döngüde de 0 (B'nin düzeltilmiş hâli).

### 5.5 Bu çalışmada bulunan ek bellek sorunları

| # | Sorun | Kanıt | Çözüm | Kabul |
|---|---|---|---|---|
| B-1 | `enemies.start()` (yeni oturum/yükleme) uçuştaki yaylı atışların **işaret halkalarını sahnede bırakıyor**: geometri + malzeme sızar ve kırmızı halka yerde kalır | f8_volkan E: 3 lav atışı uçarken `enemies.start(null)` → sahnede 3 `RingGeometry` (ebeveyn: sahne), `shots` 0; kod enemies.js:1313 yalnız `s.mesh`'i kaldırıyor | `start()` içinde `s.marker` için `parent.remove` + `geometry/material.dispose` | Aynı deneyde sahnede halka 0, kimlik farkı boş |
| B-2 | Boss kaldırılınca sahibi o boss olan mermiler uçmaya ve isabet edince `owner._hitPlayer` çağırmaya devam ediyor | f8_volkan D: `clearSonrasiSahipsizLav = 1` | §5.4 oyun çözümü (1) | `_clear` sonrası `owner===boss` mermi 0 |
| B-3 | Yüzen olay nesneleri bırakılmıyor (J-21) | f8_09tani: 3 şişe döngüsünde +2/döngü (`CylinderGeometry` 52 ve 40 köşe, sahnede değil) | Paylaşımlı geometri/malzeme ya da `disposeTree(f.mesh)` (varil/sandık prop klonlarının paylaşımlı kaynakları atlanarak) | 50'de şişe/gök taşı/kazazede 3 döngü, kimlik farkı boş |
| B-5 | Uzak oyuncu ayrılınca ad etiketi (`CanvasTexture` + `SpriteMaterial`, net.js:75-85) bırakılmıyor: `RemotePlayer.dispose` (net.js:125) → `Character.dispose` (character.js:949-953) yalnız `this.model` altını bırakıyor, etiket `char.root`'un çocuğu | Kod okuması (bu ortamda yeniden bağlanma döngüsü koşulmadı) | `RemotePlayer.dispose` etiketi de bırakır (`label.material.map.dispose()`, `label.material.dispose()`) | 08f: 5 katıl/ayrıl döngüsünde doku ve malzeme kimlik farkı boş |
| B-4 | Sayaç tabanlı sızıntı testleri ilgisiz ilk yüklemelere duyarlı | f8_volkan A: gemi parçası +1 | Kimlik farkı + paylaşımlı küme dışlama (§5.4) | 09/50 bütün döngüler kimlikle |
## 6. Gölgelendirici derlemeleri ve takılma

### 6.1 Ölçümler (SwiftShader; sayılar anlamlı, süreler yalnız göreli)

`f8_derleme.js`: her içerik aynı JS görevi içinde kurulup hemen çizildi (arka plandaki rAF döngüsü araya girip derlemeyi önceden yapmasın), ilk ve ikinci karenin süresi ve yeni program sayısı:

| Olay | Yeni program | İlk kare (ms) | İkinci kare (ms) | Not |
|---|---|---|---|---|
| Menü (yükleme sonrası) | — | — | — | 86 program: **43 doğrusal çıkışlı + 42 sRGB (tuval) çıkışlı** + 1 |
| Liman (oyun içi, ilk ölçüm) | 0 | 11 | 9 | 95 program: 52 doğrusal + **42 sRGB** + 1. Son işleme açıkken sahne composer hedefine (doğrusal, ton eşlemesiz) çizilir; 42 tuval varyantı hiç kullanılmaz (J-03) |
| Kadim Tapınak adası ilk görüş | 4 | 290 | 14 | Ada malzemeleri + `rimAll` (islands.js:364) sonrası `needsUpdate` |
| Tuz Pazarı ilk görüş | 5 | 236 | 21 | |
| Ateş Dağı ilk görüş | 3 | 111 | 10 | |
| Demirkapı | 1 | 72 | 29 | |
| Haydut / iskelet ilk doğuş | 0 / 1 | 45 / 113 | 30 / 16 | |
| Taş Muhafız / Volkanik Dev (yanında) | 1 / 0 | 64 / 21 | 17 / 37 | |
| Lav atışı + duman (ilk) | 2 | 43 | 8 | |
| Gece (22:00) | 0 | 18 | 13 | |
| **Meşale ilk yakış** | **17** | **9 992** | 226 | Nokta ışığı 7 → 8: `numPointLights` program anahtarında (three.module.js:7429), `lightsStateVersion` değişince yeni program (:18279) — **J-08** |
| Meşale söndürme / yeniden yakma | 0 / 2 | 12 / 173 | 8 / 13 | 1. taban geçişinde aynı akış: 100 → 125 → 132 program |
| Efekt kalitesi Yüksek → Düşük (oyun içinde) | 7 | 377 | 18 | Tuval varyantları çoğunlukla hazırdı (yükleme ekranındaki derleme) |
| Efekt Düşük → Yüksek | 0 | 14 | 6 | |
| Kadim Tapınak ilk görüş, 1. taban geçişi (ölçüm ışınlanma + adım sonrası) | — | **5 289** | — | Aynı karede ada içeriği + arazi karoları + gölge varyantları |

Görülen: (1) yükleme ekranındaki ön derleme **yanlış varyantı** derliyor (J-03 doğrulandı: 42 tuval programı); oyuncunun gördüğü ilk karelerde doğru varyantlar eşzamanlı derleniyor. (2) **En büyük tekil takılma meşale** (17 program; yazılımsal GPU'da 10 sn, gerçek GPU'da ölçülmedi; ANGLE/D3D11'de program başına onlarca ms beklenir → yüzlerce ms donma). (3) Her yeni ada türü ilk görüşte 1–5 program ve 4–20× uzun bir kare. (4) Sahnede sürekli 7 nokta ışığı (islands.js:236-243 havuz 4 + weatherfx.js:115 yıldırım + cave.js:117-123 mağara 2); meşale 8'e çıkarıyor (J-07).

### 6.2 Öneri

1. **Ön derlemeyi doğru hedefle yap (J-03).** `main.js:112` `compileAsync(scene, camera)` çağrısından önce composer hedefi bağlanır: `renderer.setRenderTarget(post.composer?.readBuffer ?? null)`; derlemeden sonra `null`. Son işleme kapalıysa (Düşük) bugünkü gibi tuval. Ayrıca yükleme ekranının son adımında görünmez bir **ısıtma karesi**: `post.render()` bir kez (tuval gizliyken), böylece gölge derinlik malzemeleri (`WebGLShadowMap` `_depthMaterial` varyantları) ve son işleme programları da derlenir. Efekt kalitesi değişince aynı ısıtma tekrar edilir (bekleme göstergesiyle).
2. **Sabit ışık sayısı (J-07, J-08).** `js/core/lights.js` — oturum boyunca sabit **N nokta ışığı** (Yüksek/Orta 4, Düşük 2; değişimi yeniden başlatma ister). Adaylar: oyuncunun meşalesi (öncelik 1), uzak oyuncuların meşaleleri (2), yıldırım (3, kısa ömürlü), mağara ışıkları (4), ada fenerleri (5, `B.lamps`). Her kare (ya da 10 Hz) kameraya/oyuncuya en yakın ve en öncelikli N aday ışık yuvalarına atanır; boş yuva `intensity = 0`, `visible = true` kalır. Meşalenin kendi `PointLight`'ı kaldırılır (character.js:336), yerine yuva. `weatherfx.boltLight` (weatherfx.js:115) ve `cave.lights` (cave.js:117-123) havuza aday olarak kaydolur. Faz 6 "ışık havuzu 4 kalır; mağara lambaları `_lamp` havuzu adayı" (Faz 6 §6.3) ile birebir uyumlu.
3. **İçerik ön ısıtması (J-17).** `js/core/warmup.js`: (a) yükleme ekranında, görünmez bir grupta her içerik ailesinden bir örnek (6 biyomun ada kit malzemeleri — boyalı kopyalar dahil, düşman türlerinin kit malzemeleri, boss modelleri `demon`/`orc_brute`, hayvan malzemeleri, lav/zehir/duman efekt malzemeleri) composer hedefi bağlıyken `compileAsync(warmGroup, camera, scene)`; ardından grup bırakılır ama malzemeler önbellekte kalır (programlar `KIT_NF` gibi kalıcı malzemelerle canlı tutulur). (b) Ada kurulumu bitince `scene.add(B.group)` öncesi `await renderer.compileAsync(B.group, camera, scene)` (KHR_parallel_shader_compile varsa arka planda); `rimAll` (islands.js:364) kancası paylaşımlı malzemelere yüklemede uygulanır ki ilk adada `needsUpdate` tetiklenmesin. (c) Geometri yüklemesi için ısıtma karesinde bu örnekler bir kez çizilir (GPU'ya ilk yükleme, Volkanik Dev'deki 5 geometrinin oyunda takılma yapmaması).
4. **Oyun içi gölge ayarı (J-11).** Gölge Açık ↔ Kapalı değişince sahnedeki bütün malzemelere `needsUpdate=true` (tek seferlik derleme, "Uygulanıyor…" bildirimi) ya da ayar "yeniden başlatınca" sınıfına alınır; Kapalı'da `sun.castShadow=false`. Bu çalışmada (4. geçiş, Volkanik Dev sahnesi) Yüksek → Kapalı'da gölge geçişi 125 → 0 çağrı oldu ama program sayısı 113 → 115 (yalnız +2): sahne malzemeleri yeniden derlenmedi, USE_SHADOWMAP'li programlar (son gölge haritasını örnekleyerek) kullanılmaya devam ediyor.
5. **Gereksiz çizim (J-19).** Duraklatma menüsü ve tam ekran panellerde son kare tutulur, çizim 2 FPS'e iner (ya da değişince); ana menü 30 FPS sınırı; `#modal` bulanıklığı (css/style.css:101) yakalanmış görüntüye uygulanır.
6. **Tuval MSAA (J-14).** Son işleme açıkken tuval `antialias:false` ile kurulur (karar `settings.v.effects`'e göre `engine.init` öncesinde verilir; main.js:94-97 sırası buna uygun: `settings.load()` önce). Görüntü değişmez: tuvale yalnız tam ekran dörtgen çizilir.

### 6.3 Kabul ölçütleri

| Ölçüt | Taban | Hedef |
|---|---|---|
| Yükleme sonrası programlar arasında kullanılmayan tuval varyantı (efekt Yüksek/Orta) | 42 | ≤ 2 (OutputPass/FXAA) |
| Yüklemeden sonraki ilk oyun karesinde yeni program | ölçülmedi (rAF önce davranıyor); hedef ölçümü 46'da yükleme biter bitmez | ≤ 3 |
| Meşale aç/kapa/aç: yeni program | 17 / 0 / 2 | 0 / 0 / 0 |
| Görünür nokta ışığı sayısı oturum boyunca | 7–8, değişken | Sabit N (4) |
| Yeni ada/düşman/boss/efekt ilk görüşünde yeni program | 1–5 | 0 |
| Aynı ilk görüş karesinin süresi / ikinci kare | 4–20× | ≤ 2× (SwiftShader'da göreli) |
| Gerçek GPU'da ilk kare ve meşale karesi | **ölçülmedi** | < 50 ms (gerçek makinede 46 `--gpu`) |
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
## 8. Test planı

### 8.1 Senaryo adları (KARARLAR.md: Faz 8 → tarayıcı `45`–`52`, co-op `08d`–`08f`)

| Ad | Ne sınar | Yöntem | Geçme ölçütü |
|---|---|---|---|
| **45_perf_matris.js** | 9 sahne + menü (§1.4 tarifleri), 8 yön tarama, kategori dökümü, `_simProf`, ilk kare | `tests/lib/perf_araclari.js`; bütçeler `tests/perf_butce.json` (§8.4); JSON çıktı `tests/out/perf/` | Her sahnede çağrı (medyan ve en çok), üçgen, gölge çağrısı, geometri, doku, program, JS ms bütçe içinde; aynı kodda iki koşu arasında medyan çağrı farkı ≤ %3 |
| **46_derleme_isitma.js** | J-03, J-07, J-08, J-17, J-14 | `f8_derleme.js` deseni: içerik aynı görevde kurulup çizilir | Menüde kullanılmayan tuval varyantı ≤ 2; yükleme sonrası ilk karede yeni program ≤ 3; meşale aç/kapa/aç 0/0/0 yeni program; görünür nokta ışığı oturum boyunca sabit N; ada/düşman/boss/efekt ilk görüşünde yeni program 0 ve ilk kare ≤ 2× ikinci kare; son işleme açıkken tuval `antialias=false` |
| **47_lod_gorunurluk.js** | J-01, T3, T5 budama, T6 (ekran boyutu + d99), animasyon katmanları | NPC'lere sırt dönük kamera; 1,5 km uzaktan liman; eşik çevresinde 20 m ileri-geri yürüyüş (titreme sayacı); dürbün açıkken uzak gemi; fırtına/sis | Sırt dönükken karakter çağrısı 0; uzak liman NPC'leri 0 çağrı; eşikte 10 sn'de görünürlük değişimi ≤ 2 (histerezis); dürbünde 1 km'deki gemi görünür; eşik konumlarında görüntü farkı ≤ %0,5 piksel (sis ötesi) |
| **48_birlestirme_esdegerlik.js** | T1, T2, T7, P3.1–P3.5 | (a) Sabit 26 kamera konumu (kamera_tarama) + gemi/hayvan/liman yakın çekimleri: önce/sonra `DK.snapFrom` görüntüleri; (b) Node: dönüşüm listelerinin sıralı özeti (bitki, süs), hayvan pozları (bacak/yılan) 120 karede | Görüntü farkı: ortalama mutlak fark ≤ 1,5/255, %99 piksel ≤ 8/255 (titreşimli silinme ve parçacıklar maskelenir); Node özetleri birebir aynı; çarpıştırıcı sayısı ve konumları aynı |
| **49_bolge_ayiklama.js** | T4, T5 (mağara) | Yankı odası, tünelde ağızdan 10/20/30/40/60 m, dış kapı; Faz 6 mağaraları eklendiğinde aynı düzen | Odada ≤ 250 çağrı, gölge 0; tünel noktalarında ayıklama açık/kapalı görüntü farkı 0; dışarıda mağara grubu 0 çağrı |
| **50_bellek_dongu.js** | J-16 düzeltilmiş, J-21, J-22, B-1…B-5, bütün kur/sök türleri | Kimlik farkı + paylaşımlı varlık kümesi; boss oyuncu yanında, `checkT` donuk, ölçümde `active` doğrulaması; ada, hayvan, düşman, kese, gemi, 3 boss, yüzen nesneler (şişe/gök taşı/kazazede/varil), yıldırım, hortum, deniz ekipmanı (zıpkın/ağ), lav atışı + `enemies.start`, 150 rastgele görünümlü düşman (kk atlas) | Her döngüde "döngüde yüklenip sahnede olmayan, paylaşımlı olmayan" geometri/doku/malzeme = 0; kk dokuları ≤ başlangıç + 96 ve kullanımdaki doku tahliye edilmez; 5 ardışık koşuda aynı sonuç |
| **51_kalite_onayar.js** | §4 ön ayarlar, J-11, J-12, J-19, dinamik çözünürlük, ayar göçü | Ayar kaydı + `location.reload()` (bu çalışmadaki `f8_kalite.js` yöntemi); sahte rAF zaman damgaları; eski `dksh.settings` biçimi | Düşük/Orta/Yüksek'te modül değerleri tablodaki gibi (lodScale, gölge haritası ve kutu, ışık havuzu, parçacık bütçesi, AA); FPS sınırı 60 → 75/100/144/165 Hz'de 59–60; duraklatmada ≤ 2 kare/sn; gölge Kapalı'da USE_SHADOWMAP'li program 0; eski ayar dosyası açılır |
| **52_uzun_oturum_gercek.js** | Uzun oturum belleği (10'un genişletilmişi) | 10_uzun_oturum akışı + yüzen olaylar açık + program sayısı + `fpsLimit` ile kısılmış gerçek zamanlı 20 dk; CDP ile GPU süreç belleği | 30 dk benzetimde son 10 dilim geometri/doku toplam artışı ≤ 50 (bugün ≤ 300), medyan ≤ 1; program ısınmadan sonra ≤ +5; JS yığını (gc sonrası) son 4 dilim ≤ ilk 4 + 20 MB; gerçek zamanlı bölümde GPU süreç belleği eğimi ≤ 2 MB/dk |
| **coop/08d_coop_perf_4.cjs** | Dört oyunculu co-op performansı | `f8_coop4.cjs` deseni; konuklar ev sahibinin yanında ve 3 farklı adada (iki düzen) | Ev sahibinde çağrı ≤ tek oyunculu aynı sahne + 3 × 25; JS ≤ 3 ms/kare; konuk başına giden ≤ 12 KB/sn (Faz 5 tavanı 96 kbit/sn) |
| **coop/08e_coop_lod_tutarlilik.cjs** | LOD'un oyun sonucunu değiştirmediği | Ev sahibinden 600 m uzaktaki konuğun yanında hayvan bölgesi ve düşman kampı; konuğu hedefleyen düşman | Konuk yanındaki hayvan/düşman ev sahibinde tam katmanda güncellenir (konum adımı 1/60); hedefli düşman seyreltilmez; konukta uzak avatar LOD'u yerel |
| **coop/08f_coop_uzun.cjs** | Co-op bellek ve katıl/ayrıl | 3 oyuncu, 10 dk benzetim, 5 katıl/ayrıl döngüsü | Uzak oyuncu ayrılınca etiket dokusu ve malzemesi bırakılır (B-5); kimlik farkı boş; program sabit |

### 8.2 Mevcut testlerde değişecekler

- **09_performans**: boss döngüsü §5.4'e göre düzeltilir (P0.6); liman bütçesi kademeli düşer: P2 sonrası ≤ 850, P3 sonrası ≤ 550, P7'de ≤ 500 (yalnız ölçülen değere göre). `_M` tek kare yerine 45'in kütüphanesini kullanır.
- **10_uzun_oturum**: 52 gelene dek değişmez; 52 eşikleri sıkılaştırır.
- **13_donma**: P01 en uzun ada karesi (taban 10,5 ms) P5.2 sonrası ≤ 5 ms hedefi (J-29), P02 eşdeğerlik aynen geçmeli (hücre değişiklikleri ada kurulum sırasını bozmaz).
- **17_kamera_kararma**, **kamera_tarama b1–b6**: P2.1 (karakter ayıklaması) ve P2.4 (mağara) sonrası birebir geçmeli (karanlık kare sayısı artmaz).
- **05_dusman_ai F-08**: P2.2/P4.1 sonrası değişmeden geçmeli.
- **Faz 6 34_hikaye_dunya_perf**: Ölü Sis liman farkı ≤ 3 çağrı, ışık havuzu 4 — P1.5 sonrası havuz `lights.js`'te 4 olarak kalır.

### 8.3 Görüntü eşdeğerliği

Optimizasyonun görünür dünya kalitesini düşürmediğinin kanıtı: `DK.snapFrom(from, to)` (main.js:138-143) ile 26 kamera_tarama konumu + 12 ek konum (liman yakın/orta/uzak, gemi güvertesi, açık denizden Kırlangıç 1,6 km, Tuz Pazarı, Kadim Tapınak ormanı, mağara odası ve tünel, fırtına, Volkanik Dev arenası, Kraken). Her konumda saat 11:00, rastgele olaylar kapalı, aynı tohum; önce (P0 tabanı) ve sonra görüntüleri; ölçüt §8.1/48. Yakın-kamera titreşimli silinme ve parçacıklar maske dışı bırakılır. Ayrıca SwiftShader'ın yazılımsal çizicisi deterministiktir: aynı kod ve aynı sahne aynı pikselleri üretir (bu çalışmada liman 09 görünümü dört koşuda 1 021–1 026 çağrı verdi; taban kaydı 1 035 — fark, oyun başı 2 sn'deki gerçek zamanlı karelerin hayvan/NPC konumlarını değiştirmesinden).

### 8.4 Sahne bütçeleri (ölçülebilir hedefler)

SwiftShader, 640×360, Yüksek ön ayar, saat 11, açık hava (fırtına hariç), 8 yön. "Taban" bu çalışmanın ölçümüdür (§1.5); "Hedef" P7 sonunda 45'in bütçesidir. JS = 60 × `game.update(1/60)` ortalaması (bu makinede; koşudan koşuya ±%40 oynuyor, bu yüzden bütçe tabanın 1,25 katı ve iki koşunun en iyisi alınır).

| Sahne | Taban çağrı (09 görünümü / tarama medyan / en çok) | Hedef çağrı (medyan / en çok) | Taban üçgen (en çok) | Hedef üçgen (en çok) | Taban gölge çağrısı | Hedef gölge | JS ms taban → hedef |
|---|---|---|---|---|---|---|---|
| Başlangıç limanı | 1 026 / 691 / 1 054 | ≤ 400 / ≤ 520 | 1,25 M | ≤ 0,95 M | 246–276 | ≤ 130 | 1,4–2,6 → ≤ 2,0 |
| Kalabalık kasaba (Tuz Pazarı) | 1 130–1 137 / 514–541 / 1 130–1 133 | ≤ 400 / ≤ 650 | 1,32 M | ≤ 1,0 M | 181–195 | ≤ 110 | 1,3–1,5 → ≤ 1,8 |
| Yoğun orman (Kadim Tapınak) | 449–458 / 384–386 / 498–519 | ≤ 300 / ≤ 400 | 0,81 M | ≤ 0,7 M | 111 | ≤ 70 | 0,9–1,5 → ≤ 1,8 |
| Yoğun orman (Kırlangıç) | 497–777 / 777–849 / 1 285–1 311 | ≤ 450 / ≤ 650 | 1,16 M | ≤ 0,85 M | 172–200 | ≤ 110 | 0,9–1,3 → ≤ 1,6 |
| Mağara odası | 388–1 246 / 472–479 / 1 112–1 154 | ≤ 200 / ≤ 250 | 1,13 M | ≤ 0,15 M | 161–175 | 0 | 1,1–2,1 → ≤ 1,5 |
| Açık deniz | 392–984 / 397 / 980 | ≤ 200 / ≤ 400 | 0,90 M | ≤ 0,6 M | 169 | ≤ 40 | 0,9–1,1 → ≤ 1,4 |
| Fırtına (denizde) | 413–998 / 438 / 999 | ≤ 220 / ≤ 420 | 1,03 M | ≤ 0,6 M | 169 | ≤ 40 | 2,2–2,5 → ≤ 2,0 |
| Deniz savaşı | 568 / 701 / 1 279 | ≤ 350 / ≤ 550 | 1,04 M | ≤ 0,7 M | 310 | ≤ 90 | 1,8 → ≤ 2,0 |
| Boss: Kraken | 437 / 438 / 949 | ≤ 250 / ≤ 450 | 0,99 M | ≤ 0,6 M | 177 | ≤ 50 | 1,7 → ≤ 1,8 |
| Boss: Volkanik Dev | 552 / 514 / 604 | ≤ 420 / ≤ 480 | 1,30 M | ≤ 1,0 M | 125 | ≤ 90 | 0,9 → ≤ 1,3 |
| Dört oyunculu co-op (ev sahibi, limanda yan yana) | §1.5 S9 | tek oyunculu liman + ≤ 75 | §1.5 | — | — | — | ≤ 3,0 |
| Menü | 422 | ≤ 300 | 0,85 M | ≤ 0,7 M | 168 | ≤ 120 | — |

Ek bütçeler: limanda geometri ≤ 760, doku ≤ 175, program ≤ 60 (son işleme açık; bugün 95'in 42'si boşa); ilk görüşte yeni program 0; meşale 0.

Gerçek GPU hedefleri (doğrulama gerçek makinede, P0.4/P0.5 ile; **bu ortamda ölçülemez**): Orta ön ayar, tümleşik GPU (ör. Intel Iris Xe sınıfı), 1080p: limanda ve kasabada p95 kare ≤ 16,7 ms, fırtına ve deniz savaşında p95 ≤ 20 ms; Yüksek ön ayar, orta sınıf ayrık GPU, 1080p: bütün sahnelerde p95 ≤ 16,7 ms; ilk görüş ve meşale karesi < 50 ms.

### 8.5 PERFORMANCE_REPORT.md biçimi

```
# Performans Raporu (Faz 8)
## Ortamlar
| Kimlik | Ortam | Çizici (UNMASKED_RENDERER) | CPU | Çözünürlük × DPR | Ön ayar | Tarih | Commit |
| S1 | SwiftShader (yazılımsal) | ANGLE … SwiftShader driver | 4 vCPU | 640×360 × 1 | Yüksek | … | … |
| G1 | Gerçek GPU (kullanıcı makinesi) | … | … | 1920×1080 × 1 | Orta | … | … |   ← ölçülmediyse satırda "ÖLÇÜLMEDİ"

## A. SwiftShader — çizim yükü (donanımdan bağımsız)
| Sahne | Çağrı önce → sonra (medyan / en çok) | Δ% | Üçgen önce → sonra | Gölge çağrısı | Geometri | Doku | Program | JS ms | Bütçe |
| Başlangıç limanı | 691 / 1 054 → … / … | … | 1,25 M → … | 268 → … | 755 → … | 200 → … | 95 → … | 1,9 → … | ✔/✘ |
…
## B. Gerçek GPU — kare süresi (yalnız gerçek makinede ölçülen; SwiftShader değerleri BURAYA YAZILMAZ)
| Sahne | FPS p50 | Kare p95 (ms) | Kare p99 | GPU ms (ana/gölge/son işleme) | İlk görüş karesi | Cihaz |
## C. Bellek (uzun oturum)
| Ölçü | Önce | Sonra | Ölçüt |
## D. Derleme ve takılma
| Olay | Yeni program önce → sonra | İlk kare / ikinci kare |
## E. Adım günlüğü (§7.3 satırları)
## F. Bilinen sınırlar ve ölçülemeyenler
```
## 9. Riskler ve iş büyüklüğü

| # | Risk | Olasılık / etki | Önlem | Kanıt/test |
|---|---|---|---|---|
| R1 | Karakter görüş konisi ayıklaması: animasyonda uzuv sınır küresinin dışına taşar, ekran kenarında karakter parçası kaybolur | Orta / orta | Bağlama pozu küresi × 1,5 ya da kök başına elle küre (r ≈ 1,6 m); ragdoll sırasında `frustumCulled=false` | 47, kamera_tarama b4, 17_kamera_kararma |
| R2 | Birleştirme/örnekleme görüntüyü değiştirir (doku ölçeği, renk, gece ışımaları, tabelalar) | Orta / yüksek (kullanıcı kuralı: görünür kalite düşmez) | Adım başına görüntü farkı eşiği; tutmayan adım dalda kalır | 48 |
| R3 | Gemi birleştirme hasar görselleri, direk devrilmesi, yelken animasyonu ve co-op `rebuild` ile çakışır | Orta / yüksek | Hareketli parçalar ayrık kalır; `rebuild` birleşik örgüyü yeniden kurar; P3.4 en son | 03_fizik_*, 14, 15, coop 06b, 48 |
| R4 | Bitki hücreleri çağrı sayısını artırır (tek dev örgü yerine hücre × tür) | Yüksek / düşük | Hücre boyu ölçüme göre (160/240/320 m); bütçe çağrı ve üçgen birlikte | 45 önce/sonra |
| R5 | Ekran boyutu/sis ayıklamasında belirme (pop-in) | Orta / orta | Eşik %99 sisin ya da 1,5 pikselin ötesinde; %10 histerezis; dürbünde FOV'a göre ölçek | 47 |
| R6 | Mağara bölge ayıklaması dışarıyı gösteren bir açıda nesne gizler | Düşük / orta | Ağza 30 m'den yakında ayıklama yok; tünelde 5 noktada görüntü farkı 0 | 49 |
| R7 | Sabit ışık havuzu: gece kasabada meşale yakılınca bir fener ışığı daha söner (havuz bugün de 4; meşale ve mağara artık havuzu paylaşır) | Yüksek / düşük | Öncelik ve uzaklık ağırlığı; fener ampulleri ışımalı malzemeyle görünür kalır | 46, gece kasaba görüntü karşılaştırması |
| R8 | Benzetim LOD'u co-op'ta oyun sonucunu değiştirir (konuğun yanındaki hayvan/düşman) | Orta / yüksek | En yakın oyuncu kuralı (Faz 5 odakları), hedefli düşman tam katman | 08e, 05 F-08 |
| R9 | SwiftShader ölçümü gerçek GPU darboğazını göstermez (doldurma, gölge, MSAA, `discard` J-28) | Kesin / orta | Çağrı/üçgen/CPU iyileştirmesi her donanımda geçerli; GPU süresi için P0.4/P0.5 ile kullanıcı makinesinde ölçüm; ölçülemezse raporda açıkça "ölçülmedi" | PERFORMANCE_REPORT B bölümü |
| R10 | JS ms ölçümü bu makinede gürültülü (aynı sahne 1,4–2,6 ms) | Kesin / düşük | İki koşunun en iyisi + bütçe 1,25×; çağrı/üçgen deterministik | 45 |
| R11 | Uzun gerçek zamanlı çizimde SwiftShader sayfası çöküyor (bu çalışmada 2 kez) | Orta / orta (yalnız test) | Testlerde `fpsLimit` kısılır, beklemeler `DK.sim` ile; çökme ayrıca raporlanır | 45, 52 |
| R12 | Faz 3'ün ÇİZİM evresi yoksa animasyon katmanlarının kancası yok | Düşük (Faz 8, Faz 3'ten sonra) | P2.2 ve P4 Faz 3 birleştikten sonra başlar | — |
| R13 | Faz 7 (AI/animasyon) tasarımı bu belge yazılırken yoktu; seyreltme kurallarını değiştirebilir | Orta / orta | `lod.js` API'si (`simTier`, `animStep`, `visible`); Faz 7 sonu kodunda taban yeniden ölçülür | 05, 37–44, 47 |
| R14 | Faz 6'nın yeni adaları/mağaraları/Ölü Sis yükü bütçeleri aşar | Orta / orta | Faz 6 §6.3 bütçeleri (hikâye alanı ≤ 60 çağrı, liman Ölü Sis ≤ 3, ışık havuzu 4) 45'in bütçe dosyasına eklenir | 34, 45 |
| R15 | Tuval `antialias` yalnız açılışta seçilebilir; oyun içinde efekt kalitesi "Kapalı"ya alınınca kenar yumuşatma yeniden başlatmaya dek yok | Kesin / düşük | Panelde "yeniden başlatınca" notu; ya da Düşük'te FXAA geçişi | 51 |

**İş büyüklüğü:** ≈ 39 gün (§7.2). En büyük kazanç/emek oranı: P2.1 karakter ayıklaması (1 gün, her sahnede ~−110 çağrı), P2.4 mağara bölgesi (1,5 gün, mağarada −1 000), P1.5 ışık havuzu (1,5 gün, en büyük tekil donma), P3.1 hayvanlar (2 gün, limanda −200). En riskli: P3.4 gemi ve P3.5 bitki hücreleri.
## Ek A — Denetim J bulgularının bu çalışmadaki sınanması

J alanının karşıt doğrulaması (`dogrulama_J.json`) yoktu; iddialar burada kod okuması, Node benzetimi ya da tarayıcı ölçümüyle sınandı.

| Kimlik | Konu | Sonuç | Kanıt (bu çalışma) |
|---|---|---|---|
| J-01 | Karakterlerde `frustumCulled=false` | **Ölçümle doğrulandı** | NPC'lere sırt dönükken 55 A + 100 G çağrı; 7 km uzakta (Kadim Tapınak, Kraken, Volkanik Dev) liman NPC'leri 55 + 55; Tuz Pazarı'nda 15 NPC 187 + 120 (§2.3) |
| J-02 | Çekirdek bitki tek dev `InstancedMesh` | **Ölçümle doğrulandı** | Sınır küresi yarıçapları 606–871 m; limanda 303 K + 170 K üçgen (§2.2) |
| J-03 | Ön derleme yanlış varyant | **Ölçümle doğrulandı** | Son işleme açıkken menüde 86 programın 42'si, limanda 95'in 42'si tuval (sRGB) çıkışlı; Düşük'te (son işleme kapalı) 44 programın hepsi tuval çıkışlı (§6.1) |
| J-04 | Gemi 80 örgü, hepsi gölge atıyor | **Ölçümle doğrulandı** | Oyuncu ve düşman sloop'u 80 örgü / 80 gölge atan; denizde gemi 81 A + 80 G çağrı |
| J-05 | Prosedürel hayvanlar parça başına | **Ölçümle doğrulandı** | 7 domuz 140, 9 papağan 81, 6 maymun 72 çağrı; mağarada 46 hayvan 617 çağrı |
| J-06 | Liman malzemeleri benzersiz | Ölçüm + kod | `port-batched` 44 A + 64 G = 108 çağrı (84 örgü sayısı denetimin Node sayımı) |
| J-07 | Sürekli 7 nokta ışığı | **Ölçümle doğrulandı** | Görünür nokta ışığı 7, meşaleyle 8 |
| J-08 | Meşale yeniden derletiyor | **Ölçümle doğrulandı** | İlk yakışta 17 (bir koşuda 25) yeni program; SwiftShader'da 9 992 ms'lik kare |
| J-09 | Gölge çözünürlüğü açılışta uygulanmıyor | Kod okuması (Faz 1 A-19) | Ön ayar ölçümünde harita boyutu grafik kalitesinden geldi (Düşük'te de 1024) |
| J-10 | LOD ölçeği sıfırlanıyor / görüş açılışta uygulanmıyor | **Ölçümle doğrulandı** | Düşük (görüş 0,3) açılışta `lodScale` 0,7 (olması gereken 0,553), Orta (0,65) 0,85 (olması gereken 0,76); `baseLod` her ikisinde 1 |
| J-11 | Oyun içi gölge kapatma programları yenilemiyor | **Ölçümle doğrulandı** | Volkanik Dev sahnesinde Yüksek → Kapalı: gölge geçişi 125 → 0 çağrı, toplam 509 → 384, ama program 113 → 115 (yalnız +2): sahne malzemeleri yeniden derlenmedi, USE_SHADOWMAP'li programlar kullanılmaya devam ediyor; Kapalı → Yüksek'te program değişmedi |
| J-12 | FPS sınırı yüksek Hz'de düşük | **Node benzetimiyle doğrulandı** | 60 sınırı: 75 Hz 37,5, 100 Hz 50, 144 Hz 48, 165 Hz 55 FPS; önerilen biriktirmeli sınırlayıcı hepsinde 60 (`node/fpslimit.mjs`) |
| J-13 | Sise bağlı olmayan kesme | Hesapla doğrulandı | d99: açık 1 951 m, fırtına 282 m, sisli 212 m; açık denizde 1,6 km'deki adaya bakan yön 980 çağrı |
| J-14 | Son işlemde tuval MSAA | **Ölçümle doğrulandı** | `getContextAttributes().antialias === true`, efekt Yüksek/Orta |
| J-15 | Ölçüm altyapısı dar | Doğrulandı | Bu çalışma 9 sahneyi, kategori dökümünü, ilk kare derlemesini ölçtü; altyapı P0 ile kalıcılaşır |
| J-16 | Volkanik Dev dG=5 | **Kök neden bulundu: sızıntı değil, ölçüm kusuru** | `bosses._check()` uzak boss'u ölçümden önce kaldırıyor; 31 alt adımlık denetim evresi tutarsa `demon.glb`'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez yükleniyor; deterministik yeniden üretim dG=5, düzeltilmiş döngü dG=0 (§5.4) |
| J-17 | İlk görüşte derleme | **Ölçümle doğrulandı** | Ada ilk görüşü 1–5 yeni program, ilk kare 72–290 ms (ikinci 10–29 ms); bir koşuda 5 289 ms |
| J-18 | Harita karosu `getImageData` | Ölçülmedi | Faz 8 kapsamında 13_donma'ya eklenmesi önerilir |
| J-19 | Duraklatmada tam çizim | Kod okuması (**ölçülmedi**) | engine.js:52-71 her rAF'ta `post.render()`; ölçüm adımı 2. geçişte çöktü, 4. geçişte çizim kısıldığı (`fpsLimit 0,01`) için anlamsız kaldı |
| J-20 | Parçacık CPU verimsizliği | Kod okuması | effects.js:45-48, :121-146 |
| J-21 | Yüzen nesneler bırakılmıyor | **Ölçümle doğrulandı** | Şişe döngüsü başına +2 geometri, sahnede değil |
| J-22 | `kk.texture` FIFO | Kod okuması | kk.js:244 |
| J-23 | Birleştirilmemiş süsler | **Ölçümle doğrulandı ve genişletildi** | Limanda statik süsler 207 çağrı (kayalık 36, heykel 42, mağara içi 30, kabuk 16…) |
| J-24 | Bulutlar | **Ölçümle doğrulandı** | Fırtınada hava efekti 17 çağrı / 152 K üçgen |
| J-25 | Mağarada gölge haritası | **Ölçümle doğrulandı** | Mağara odasında gölge 161–175 çağrı / 290 K üçgen |
| J-26 | Alt adımda tekrarlanan işler | Kod okuması | Faz 3 C-14 ile aynı; Faz 3 çözüyor |
| J-27 | Kare başı ayırmalar | Kod okuması | — |
| J-28 | `discard` erken derinlik testi | Ölçülemez (gerçek GPU) | — |
| J-29 | Ada kurulumunda 10–12 ms adım | Taban kaydı (13_donma P01 10,5 ms) | Yeniden ölçülmedi |
| J-30 | NPC/balıkçı/hayvan seyreltmesi yok | **Ölçümle doğrulandı** | Limandan 7 km uzakta `npcs.update` 0,35 ms/kare sürüyor |

**Bu çalışmada yeni bulunanlar:** B-1 `enemies.start` lav işaretlerini sahnede bırakıyor (ölçüldü), B-2 kaldırılan boss'un mermileri uçmaya devam ediyor (ölçüldü), B-5 uzak oyuncu etiketi bırakılmıyor (kod), mağarada dış dünya 1 246 çağrı (ölçüldü), uzak ada ayrıntısı 962–1 133 çağrı (ölçüldü), Orta ön ayar bugün çağrıyı azaltmıyor (1 021 / Yüksek 1 026; ölçüldü), denizde en pahalı JS sistemi balık sürüleri (0,43–0,78 ms; ölçüldü), uzun gerçek zamanlı SwiftShader çiziminde sayfa çökmesi (2 kez; test ortamı sınırı).

## Ek B — Bu çalışmanın betikleri ve ham çıktıları

`/tmp/tasarim_y/faz8/`: `tools.js` (sayfa araçları), `f8_taban.js` → `f8_taban.json` (1. geçiş, 9 sahne, 194 sn), `f8_taban2.js` / `f8_taban3.js` / `f8_taban4.js` (arazi beklemeli geçişler; 2 ve 3 çöktü, kayıtlar `.log`), `f8_kalite.js` → `f8_kalite.json` (Düşük/Orta), `f8_derleme.js` → `f8_derleme.json`, `f8_09tani.js` → `f8_09tani_1.json` / `_2.json`, `f8_volkan.js` → `f8_volkan.json`, `f8_coop4.cjs` → `f8_coop4.json`, `10_uzun_oturum.json`, `09_orijinal_*.json`, `node/fpslimit.mjs`. Hepsi kilit sarmalayıcısıyla (`/home/user/devtools/tk`) 8080'deki değişmeyen v0.4'e karşı koştu.
