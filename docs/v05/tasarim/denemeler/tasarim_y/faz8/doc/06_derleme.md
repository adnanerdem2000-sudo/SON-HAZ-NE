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
