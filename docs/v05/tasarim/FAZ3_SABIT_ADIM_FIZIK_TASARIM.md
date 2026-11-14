# Faz 3 — Fiziği Kare Hızından Bağımsızlaştırma: Tasarım Belgesi (NİHAİ, karşıt inceleme sonrası)

| | |
|---|---|
| Proje | Deniz Korsanları: Son Hazine (three.js r187, PeerJS co-op) |
| Taban | v0.4, commit `44d548c` (dal `claude/v0.5-saglamlastirma`, HEAD `e194d59` yalnız Faz 0 belgelerini ekler; `js/` aynı) |
| Girdi | Faz 0 fizik denetimi `audit_C.json` (C-01…C-18), taban koşusu `docs/v05/taban_kosusu_44d548c/`. (inceleme düzeltmesi) Ayrıca Faz 2 nihai tasarımı `faz2_tasarim_NIHAI.md` (protokol, şema, saat ilkesi P6) ile tutarlılık denetlendi. |
| Yöntem | Kaynak kodun okunması (bütün satır numaraları 44d548c'ye göre) ve `/tmp/tasarim_x/` altında salt-okur Node denemeleri (Ek A). **Kod değiştirilmedi, tarayıcı testi çalıştırılmadı.** (inceleme düzeltmesi) Karşıt inceleme her önemli iddiayı koddan yeniden okudu ve üç ek Node denemesi koştu (Ek A.6: `inceleme3_knock.mjs`, `inceleme3_netclock.mjs`, `inceleme3_hooks.mjs` + `inceleme3_loader_test.mjs`). |
| Durum | Tasarım. Uygulama Faz 3'te, §9'daki sırayla, küçük ve ayrı test edilebilir adımlarla yapılır. (inceleme düzeltmesi) Düzeltilen yerler "(inceleme düzeltmesi)" notuyla işaretlidir; bulunan sorunların listesi belgenin sonundadır. |

---

## 0. Özet ve kararlar

**Sorun.** v0.4 döngüsü (`game.js:201-207`) her karede `n = ceil(dt/STEP − 1e-6)` alt adım atıyor ve adım boyunu `h = dt/n` alıyor. Biriktirici yok, çizim ara değerlemesi yok. Adım boyu kare süresiyle değişiyor (1/60, 1/80, 1/90, 1/120, 1/144…). Bu yüzden sonuçlar yalnız 60'ın tam bölenlerinde (15/20/30/60 FPS) aynı çıkıyor. 60 Hz ekranda 1e-6 eşiği alt adım sayısını 1 ile 2 arasında oynatıyor (C-02). Görsel işler de alt adımın içinde koşuyor (C-14).

**Kararlar (gerekçeleri ilgili bölümde):**

| # | Karar | Bölüm |
|---|---|---|
| K1 | Sabit adım **STEP = 1/60 s**. Biriktiricili döngüde kare başına **en çok 6 adım** atılır. Kareye en çok **0,1 s** benzetim zamanı eklenir (`engine.js:62` kırpması korunur). Gizli sekmede `Timer.connect(document)` kullanılır. (inceleme düzeltmesi) Adım sınırı **sabit 6**'dır; uyarlanır bütçe kaldırıldı (testlerde belirlenimi bozuyordu). `DK.sim`/`DK.frames` 0,1 s'den uzun kareyi ≤ 0,1 s'lik parçalara böler; böylece bugünkü "sn saniye ileri sar" sözleşmesi korunur. | §2.1–2.3, §4.3 |
| K2 | Çizim, önceki ve şimdiki benzetim durumu arasında **alpha = acc/STEP** ile ara değerlenir. Gemi ve kayık için "poz takası" kullanılır: adımlar sırasında kökte benzetim pozu, çizimde ara poz bulunur. | §2.5 |
| K3 | Üç zaman ölçeği ayrılır: **STEP** (benzetim), **rdt** (çizim zamanı farkı: animasyon, parçacık, su; benzetim saatini izler), **frameDt** (gerçek süre: kamera yumuşatma, HUD, ağ, ses). | §2.4, §3 |
| K4 | Girdi kenarları (pressed) **adım tamponunda** tutulur ve yürütülen ilk adımda tüketilir. Bakış farkı kare başına bir kez alınır (`takeLook`). Gamepad bakışı `frameDt` ile ölçeklenir (yeni bulgu N-01). | §4 |
| K5 | Tek bir **`physics.segmentQuery`** (maskeli, ilk isabet t'si, yükseklik aralığı, metrik uç payları, `pad` yarıçapı, platform ve gemi gövdesi dahil) eklenir. Görüş, mermi, zıpkın, gülle, tabanca ve kamera bu sorguyu kullanır (C-04/05/06/07/13). (inceleme düzeltmesi) Başlangıç noktasını içeren çarpıştırıcı yok sayılır (kameradaki gövde kuralı, camera.js:78). GORSEL kutuları yalnız KAMERA maskesindedir. | §8 |
| K6 | Çarpıştırıcılar katman bitleri taşır (`LAYER`/`MASK`). `noCam` bir katman kuralına dönüşür. (inceleme düzeltmesi) `noCam` çarpıştırıcı BITKI ya da INCE katmanına **atanır**; katmandan maske biti silinmez (§7.3). Katmanlar (A4) segmentQuery'den (A5) **önce** gelir ve önce davranışı birebir korur. | §7 |
| K7 | Ortam saati benzetime bağlanır. `ocean.time` adımda ilerler. Rüzgâr esintisi `performance.now()` yerine benzetim zamanından hesaplanır. Su hortumu kuvveti de adıma taşınır (yeni bulgu N-02). | §1.5, §3 |
| K8 | Uygulama, eski döngüye dönülebilen bir bayrakla (`?dongu=eski`) 12 adımda (inceleme düzeltmesi: A2 bölündüğü için 13 adımda) yapılır. A0'da önce beklentili ölçüm testleri yazılır (bu testlerin önce kalması beklenir). (inceleme düzeltmesi) Oyuncunun yatay koruyucu ilerlemesi A6'dan A1'e alındı (geri tepme gerçekte 31 m/s, §6). A2 ikiye bölündü (A2a/A2b). | §9 |
| K9 | (inceleme düzeltmesi) **Ağ kapsamı daraltıldı.** Faz 3'te yalnız uzak varlık yumuşatması adımdan çizim evresine taşınır ve çevrimiçi hit-stop kuralı gelir. Zaman damgalı ara değerleme tamponu Faz 5'e kalır. Orada Faz 2'nin şema kayıt defteri ve `PROTO` kuralıyla, duvar saati yerine **kare saatiyle** yapılır. | §5 |

**Kullanıcı isteklerinin karşılığı:**

| İstek | Bugün (Faz 0) | Bu tasarımda | Bölüm |
|---|---|---|---|
| (1) Sabit zaman adımı | Kısmen (h = dt/n) | STEP = 1/60, biriktirici | §2.1–2.2 |
| (2) Çizim ile benzetimin ayrılması | Kısmen (görsel işler adımda) | ADIM / KARE / ÇİZİM / UI ayrımı, ara değerleme | §2.5, §3 |
| (3) Kontrollü biriktirici | Yok | `acc`, EPS, düşen zaman sayacı | §2.2 |
| (4) En çok adım ve zaman sıçraması sınırları | Karşılanıyor | 6 adım, 0,1 s, `Timer.connect`, ~~uyarlanır bütçe~~ (inceleme düzeltmesi: kaldırıldı; `DK.sim` parçalama ve `stats.kirpilan`), C-16 LOD parçalı ilerleme | §2.3, §4.3 |
| (5) Hızlı nesnelerde süpürme | Kısmen | Nesne tablosu, `segmentQuery`. (inceleme düzeltmesi) Oyuncunun yatay koruyucu ilerlemesi A1'de gelir: büyük geri tepme gerçekte 31,4 m/s'ye çıkıyor (0,52 m/adım, §6). | §6, §8 |
| (6) FPS düşüşünde zemine girmeme | Karşılanıyor (testsiz) | Sabit adım + dikey süpürme + FS05 | §6, §10.3 |
| (7) Karakter ve engel iç içe geçmesi, takılma | Kısmen | Güverte itişmesi, itmeden sonra resolve, LOD, dar geçit testleri. (inceleme düzeltmesi) Denetim planındaki **iç köşe** testi eklendi (DG07). | §7.4–7.5, §10.4 |
| (8) Platform, iskele, bina, kaya, güverte | Kısmen | C-09/10/12/17, GORSEL kutusu (yalnız kamera), colK. (inceleme düzeltmesi) Denetim planındaki **her yapı türü için "içinden yürünmez"** testi eklendi (YP01). | §7.4–7.5, §10.4 |
| (9) Kamera duvardan ve güverteden geçmesin | Kısmen | pad 0,25, yeniden sınama, görsel kutu | §7.4 C-13 |
| (10) Katmanlar ve kurallar | Yok | LAYER/MASK, matris, R1–R6, (inceleme düzeltmesi) R7 (başlangıcı içeren çarpıştırıcı), R8 (maske eşitliği) | §7 |
| Görüş hattı ve DDA | DDA var (doğrulandı) | Birleşik sorgu, C-04 düzeltmesi | §8 |
| (inceleme düzeltmesi) Test listesindeki ayrıntılar | Eksikti | Denetim planına göre eklenenler: "çok hızlı hareket" testinde **0,2 m'lik duvar** (HH01/HH02), "merdivenler" testinde **basamakta zıplama** (MI06), "ani FPS düşüşü" testinde **8–250 ms** rastgele kareler (D3) | §10.3–10.4 |

**Kanıt: sadeleştirilmiş Node kopya modeli** (`player.js:509-623` çekirdeği, Ek A.1). Değerler eski döngü → yeni döngü olarak verilmiştir:

| Ölçüm | 15/30/60 FPS | 45/90 FPS | 59,94 Hz | 120 FPS | 144 FPS | 8–100 ms rastgele |
|---|---|---|---|---|---|---|
| Zıplama tepesi (m) | 1,1833 → 1,1833 | 1,2037 → **1,1833** | 1,2138 → **1,1833** | 1,2139 → **1,1833** | 1,2190 → **1,1833** | 1,1957 → **1,1833** |
| Geri tepme (10 hasar, m) | 1,5972 → 1,5972 | 1,5050 → **1,5972** | 1,4608 → **1,5972** | 1,4605 → **1,5972** | 1,4394 → **1,5972** | 1,5607 → **1,5972** |
| Kaçınma 1,2 sn (m) | 2,4517 → 2,4517 | 2,4304 → **2,4517** | 2,4210 → **2,4517** | 2,4198 → **2,4517** | 2,4112 → **2,4517** | 2,4400 → **2,4517** |

Eski döngünün kopya değerleri denetimle birebir uyuşuyor: 144 FPS'te geri tepme 1,597'den 1,439'a iniyor (05 §5.2 #3), zıplama 1,183 / 1,214 / 1,219 m. Yeni döngüde aynı adım sayısına gelindiğinde durum farkı **0 m** (rastgele kare dizisi, 300 adım). 60 Hz titreşimli karelerde (16,6–16,9 ms) iki alt adımlı kare oranı **%78'den %0,6'ya** iniyor (Ek A.1).

(inceleme düzeltmesi) Kopya model, geri tepmeyi yerde kalan oyuncu için hesaplıyor (ivme 13). Gerçek kodda k = 7 ancak ≥ 46 hasarla oluşur (player.js:183). 20'nin üstündeki her hasar oyuncuyu havaya kaldırır (player.js:185: `vel.y = 3,5`, `onGround = false`). Havada ivme 2,5'tir (player.js:537). Gerçek kod yolunda tepe hız **31,4 m/s**, adım başına **0,523 m**, savrulma ~10 m'dir. h = 1/144'te bu değer 0,206 m/adımdır (Ek A.6). Sonuç tablodaki 10 hasarlık değerleri değiştirmez; §6'nın tünelleme değerlendirmesini değiştirir.

---

## 1. Mevcut döngünün tam haritası

### 1.1 Kare akışı

```
requestAnimationFrame(loop)                                   engine.js:53-54
 ├─ fpsLimit süzgeci (kare atlama)                            engine.js:55-58
 ├─ timer.update(now); dt = timer.getDelta()                  engine.js:60-61   (Timer.connect yok: gizli sekme dönüşünde dt dev)
 ├─ dt = min(dt, 0.1)                                         engine.js:62
 ├─ fps sayacı                                                engine.js:63-64
 ├─ updaters (tek updater: main.js:117-123)
 │   ├─ game.update(dt)                                       game.js:189-219
 │   ├─ hud.update(dt)                                        main.js:119
 │   ├─ net.update(dt)   → uzak oyuncular r.update(dt)        main.js:120 → net.js:696-731 (709)
 │   ├─ duraklatma tuşu (input.pressed('duraklat'))           main.js:121
 │   └─ input.endFrame()  → pressedSet, mouseDX/DY, wheel = 0 main.js:122 → input.js:163-168
 └─ post.render()                                             engine.js:68
```

`game.update(dt)` (game.js:189-219):

| Satır | İş | Çalışma sıklığı |
|---|---|---|
| 190 | Menü: `menuUpdate(dt)`. Menü gemisi `s.update(dt)` değişken adımla güncellenir (86); kamera, `_env`, `menuUpdate` | kare |
| 191-192 | Oyun yoksa ya da duraklatılmışsa çık | kare |
| 194 | Hit-stop: `G.hitStop -= dt; dt *= 0.12` (çevrimiçide ev sahibinin dünyasını da yavaşlatır, §5.3) | kare |
| 197 | `_globalKeys()` (242-252): ekipman, fener, envanter, harita, defter, yetenek, işaret, bırak, pusula, sohbet, dürbün | kare |
| 198-200 | `input.lookDelta()` → `tpCamera.rotate` (top kipinde değil), tekerlek → `zoom` | kare |
| 201-202 | `n = clamp(ceil(dt/STEP − 1e-6), 1, 6)`, `h = dt/n` | kare |
| 203-208 | `for i<n: input.subframe = i>0; _step(h)` | n kez |
| 209 | `lastSubsteps = n` | kare |
| 212 | SUBSTEP dışındaki sistemler `s.update(dt)` | kare |
| 214 | `_camera(dt)` (309-376) → `tpCamera.update` (camera.js:55-169) | kare |
| 215 | `_env(dt, p.pos)` (379-412): `terrain.update`, `sky.update` (sky.js:233), `post.update`, `time.update`, `ocean.update` (ocean.js:270-280, **`time += dt` 271**), `props.update`, `port.update`, ses | kare |
| 217-218 | Otomatik kayıt (120 sn, yalnız ev sahibi) | kare |

### 1.2 `_step(h)` içeriği (game.js:222-238) ve sıra

1. `playTime += h` (224)
2. `shipControl.update(h)` (225): istasyon bırakma (276), gemi yangınları (278-289), **top nişanı `input.lookDelta()` (292-295)**, top ateşi (296-299)
3. `p.update(h)` (226): `player.js:325-417`. Kip dallanması 360-366, görsel kuyruk 393-416.
4. Gemiler (228-233): ev sahibi ya da çevrimdışıysa `s.update(h)` (ship.js:267-381), konuksa `s.clientUpdate(h)` (566-579). Ardından `s.tickCannons(h)` ve gemi olayları.
5. `Ship.collideAll(G.ships, h)` (234; yalnız ev sahibi): ship.js:462-511
6. `G.rowboat?.update(h)` (235): ship.js:790-844
7. `interact.update(h)` (236): interact.js:21-72. **`G.emit('prompt')` her alt adımda (71).**
8. SUBSTEP sistemleri (237). Sıra kayıt sırasıdır (`main.js:103`): **bodies → effects → combat → enemies → animals → megafauna → hazards → bosses → events → crowd**

Kare başına çalışan sistemler (212) de kayıt sırasıyla: misc (update yok), time, treasure, fish, fishing, seagear, npcs, islands, quests, progress, worldEvents, weatherfx, details.

(inceleme düzeltmesi) İlk sürüm "time (update yok)" ve "progress (update yok)" diyordu. İkisinin de `update` yöntemi var:
* `time.update()` (time.js:147-171): gün geçişini ve günlük olayları sky.hour'dan okur. Karede **iki kez** çağrılır: sistem döngüsünde (game.js:212) ve `_env` içinde (game.js:390). Durumsuz olduğu için zararsızdır. Yeni düzende tek çağrı kalmalıdır.
* `progress.update()` (progress.js:165-168): `G.ship.speedMul` ve `dmgTakenMul`'ı her karede yazar. Gemi itkisi (ship.js:307) bunu okur. KARE'de kalabilir, çünkü değer yalnız yetenek değişince değişir.

### 1.3 Alt adımın içinde koşan görsel işler (C-14)

| İş | Yer | Bedeli |
|---|---|---|
| Oyuncu kök konumu, basamak yumuşatma `_visDY`, örtüler, **`Character.update` (karıştırıcı + IK)** | player.js:393-416 | Kare başına n kez karıştırıcı ve IK |
| Dümen ve top IK el hedefleri | player.js:918-922, 937-940 | Gemi daha güncellenmeden eski matristen hesaplanıyor (C-08) |
| Gemi kök matrisi + `updateMatrixWorld(true)` + **`_animate`** (yelken köşe noktaları, `computeVertexNormals` ×3, bayrak, zincir, çark, fener) | ship.js:558-562, 584-665 | Gemi başına n kez köşe yazımı |
| Kayık örgüsü ve kürekler | ship.js:839-843 | |
| Cisim örgüsü konum/dönüş yazımı | bodies.js:107-111 | |
| Parçacık entegrasyonu ve 900'lük tampon yazımı | effects.js:122-146 | Kare başına n kez 4 öznitelik tamponu |
| Düşman `e.char.update(edt)` ve HUD | enemies.js:1606-1608 | |
| Hayvan `anim.update` | animals.js:636, 729 | |
| Boss `anim.update` | bosses.js:625, 686, 805 | |
| Etkileşim istemi olayı | interact.js:71 | Kare başına n kez UI olayı |

### 1.4 Kendi saatini tutan ya da adımı atlayan özel durumlar

* **Ragdoll** (ragdoll.js:9, 110-121): kendi 1/60 biriktiricisi var (`acc ≤ 4·STEP`). `Character.update` içinden çağrılır (character.js:846).
* **Düşman AI seyreltme** (enemies.js:1597-1606): hedefsiz düşman 45–90 m'de 0,066 sn, 90 m'nin ötesinde 0,25 sn biriktirip **tek** `e.update(edt)` çağrısı alıyor (C-16).
* **bodies iç bölmesi** (bodies.js:101, `dt > 0.034 → 2 adım`): oyunda h ≤ 1/60 olduğundan hiç tetiklenmiyor.
* **Zıpkın** kare başına `dt` ile uçuyor (seagear.js:217, sistem SUBSTEP'te değil).
* **Su hortumu** gemilere kare başına `dt` ile kuvvet uyguluyor: weatherfx.js:322-332 (yeni bulgu **N-02**).

### 1.5 Ortam saati: fiziği besleyen kare bazlı ve duvar saatine bağlı değerler

| Değer | Yer | Sorun |
|---|---|---|
| `ocean.time` | ocean.js:271 (`_env` içinden, kare başına) | Bir karenin bütün alt adımları aynı dalga anını görüyor (gemi dalga eğimi ship.js:313-315, kaldırma 524, cisim kaldırması bodies.js:118). Sonuç adım sayısına bağlı. |
| `sky.gust` | **sky.js:257 `performance.now()`** | Gemi itkisi `windF = 0.45 + 0.75·windStrength` (ship.js:305) **duvar saatine** bağlı. `DK.sim` ile ileri sarılan testlerde sonuç koşunun ne zaman yapıldığına göre değişiyor (yeni bulgu **N-03**). |
| `sky.windStrength`, `windDir`, `ocean.waveScale`, `ocean.tide` | sky.js:256-260 (kare) | Testin yazdığı `DK.sky.windStrength = 0.55` (03_fizik_dt.js:30) bir sonraki karede 258. satırda eziliyor. |

Node denemesine göre (Ek A.4) duvar saatine bağlı esinti, 0,8–3 sn'lik pencerelerde gemi itki çarpanının ortalamasını **0,801 ile 0,924 arasında (%14)** oynatıyor. Bu, taban ölçümündeki gemi farkının (aşağıda) en olası açıklamasıdır. Tarayıcıda doğrulanmadı.

### 1.6 `DK.sim`, `DK.press`, `DK.tap` döngüyü nasıl sürüyor

* `DK.sim(seconds, dt = 1/30)` (main.js:145-149) `round(seconds/dt)` kare boyunca `game.update(dt)`, `hud.update(dt)`, `net.update(dt)` ve `input.endFrame()` çağırır. `post.render` ve rAF yok. **Motorun 0,1 s kırpmasını atlar**, yalnız `MAX_SUB = 6` uygulanır: `dt > 0,1` olursa `h > 1/60` olur. Testlerde kullanılan dt'ler: 1/30 (158 kez), 1/60 (59), 03_fizik_dt'de 1/15…1/120. Co-op `tick()` `DK.sim(0.2)` çağırır (coop.cjs:54).
* `DK.press(code, dur=0.1)` (152): kodu `pressedSet`'e ve `down`'a ekler, `sim(dur)`, bırakır, `sim(1/30)`.
* `DK.tap(code)` (150): `pressedSet` ve `down`, 150 ms gerçek süre sonra bırakılır.
* Test sayfasında rAF döngüsü de koşar. Ancak tek bir `page.evaluate` eşzamanlıdır ve rAF araya giremez.
* (inceleme düzeltmesi) Birçok senaryo rAF döngüsünü fiilen durdurur: `DK.engine.fpsLimit = 0.01` ile 100 sn'de bir kare çizilir. Bunlar 13, 14, 15, 16 ve 17 numaralı senaryolar ile coop 06a, 06a2, 06b ve 06c'dir. Bu testlerde zaman **yalnız `DK.sim` ile** ilerler. Co-op'ta her `tick` `DK.sim(0.2)` + 40 ms gerçek beklemedir (coop.cjs:54). Benzetim saati gerçek zamandan hızlı akar. Bu yüzden duvar saatine bağlı her mekanizma bu testlerde makineye bağımlı sonuç verir (§5).
* (inceleme düzeltmesi) 0,1'den büyük dt ile `DK.sim` çağıran senaryolar da var: v03/full.js:17 ve full2.js:17 `DK.sim(need, 0.25)` ile hava tahminini ileri sarıyor. v03 senaryoları 25'lik regresyon kümesinde değildir. Yine de §4.3'teki parçalama kuralı bu sözleşmeyi korur.
* Sistemleri doğrudan çağıran testler: `DK.effects.update(0.1)` (03 #11), `DK.bodies.update(dt)` (03_fizik_dt.js:47), `DK.enemies.update(1/60)` (05 F-08), `DK.interact.update(1/60)` (04 C22), `DK.treasure.update(0/0.016)` (09, 16), co-op 06b profil anında her `s.update(1/60)`.

### 1.7 Faz 0 taban ölçümünün açıklaması

| Ölçüm (03_fizik_dt) | Taban | Neden |
|---|---|---|
| Yürüme 3 sn | 15/30/60: 12,596 m, 120: 12,585 m | `damp` ve yarı örtük Euler'in h'ye bağımlılığı. Kopya modelde 12,7469 → 12,7292 (%−0,14). |
| Zıplama tepesi | 1,183 m; 120 FPS'te 1,214 m | Yarı örtük Euler (player.js:566-588). Ayrık tepe `h·Σ(7,4 − 22·k·h)`: h=1/60 → 71/60 = 1,1833; h=1/120 → 1,2139. Kopya model birebir aynı sonucu verdi. |
| Gemi 12 sn | 87,5–87,8 m; 120 FPS'te 82,64 m (−%5,7) | Gemi entegrasyonu üstel ve h'ye neredeyse duyarsız (ship.js:311, 317). Asıl değişken **duvar saatine bağlı esinti** (sky.js:257, N-03): 120 FPS koşusu 1 440 kareyle en uzun duvar süresini alıyor. İkinci etken kare başına donan `ocean.time` (1.5). 15/30/60 arasındaki %0,3'lük fark da büyük olasılıkla aynı kaynaktan geliyor. |
| Cisim düşüşü 4 sn | x: −60,72 / −60,73 / −61,28 / −62,06 | **Ölçüm yapaylığı:** test `bodies.update`'i döngüyü atlayarak doğrudan çağırıyor (03_fizik_dt.js:47). İç bölme yüzünden 15 FPS'te h=1/30, 30 FPS'te h=1/30, 60'ta 1/60, 120'de 1/120. `while (t<4) t+=dt` kayan nokta döngüsü 60/121/241/481 kare atıyor, yani 4,000/4,033/4,017/4,008 sn (Ek A.5). Oyun içinde cisimler h ≤ 1/60 ile koşar. |

---

## 2. Hedef döngü

### 2.1 Adım boyu: neden 1/60

| Ölçüt | 1/60 | 1/120 |
|---|---|---|
| Oynanış değerleri | Bugünkü 60 Hz değerleri (zıplama 1,183 m, geri tepme, kaçınma) **herkes için** geçerli olur. Ayarlama gerekmez. | 60 Hz oyuncusu için zıplama %+2,6, geri tepme %−8,6 değişir. Bütün sabitler ve tabanlar yeniden ayarlanmalı. |
| Mevcut testler | `DK.sim(…,1/30)` kare başına 2, `1/60` 1 adım atar. Adım dizisi bugünküyle aynı kalır ve sonuçlar büyük ölçüde birebir çıkar. | Bütün senaryoların adım dizisi değişir. |
| CPU | 15 FPS'te 4, 30 FPS'te 2 adım | 15 FPS'te 8 adım (6 sınırı aşılır, 20 FPS altında oyun yavaşlar) |
| Tünelleme | 60 Hz sınırları evrenselleşir: düşüşte 36 m/s, gülle 0,97 m/adım. (inceleme düzeltmesi) Büyük geri tepmede 0,523 m/adım. **Süpürme ve yatay koruyucu ilerleme zorunlu** (§6). | Sınırlar yarıya iner ama gülle ve mermi için süpürme yine gerekir. |
| Ragdoll | Kendi 1/60 adımıyla aynı | Farklı |
| Ekran 120/144 Hz | Ara değerleme şart (144 Hz'de karelerin %58'inde adım atılmaz, Ek A.1) | Ara değerleme yine gerekir (144 Hz) |

**Karar: STEP = 1/60.** Bu kararın bir yan etkisi var: 60 Hz'in tünelleme sınırları artık 120/144 Hz oyuncularına da uygulanır. Bugün 144 FPS'te h=1/144 olduğu için yüksekten düşüşte platform hiç kaçırılmıyor. Sabit adımla bu oyuncular da 60 Hz davranışını alır (Ek A.3). Bu yüzden §6'daki dikey süpürme (C-17) sabit adımla **aynı sürümde** gelmelidir. (inceleme düzeltmesi) Aynı gerekçe yatay hareket için de geçerlidir. Büyük geri tepmede 144 Hz oyuncusu bugün 0,206 m/adım ilerliyor, sabit adımla 0,523 m/adım ilerler (Ek A.6). Oyuncunun yatay koruyucu ilerlemesi de A1'de gelir.

### 2.2 Biriktirici algoritması (game.js:185-238 yerine)

```js
STEP: 1/60, MAX_STEPS: 6, MAX_SIM_PER_FRAME: 0.1, EPS: 1e-9,
acc: 0, stepCount: 0, renderTime: 0, lastSteps: 0, frameClock: 0,   // (inceleme düzeltmesi) simTime alanı yok (aşağı bakın); frameClock: frameDt toplamı (§5)
stats: { dropped: 0, kirpilan: 0, stepMs: 0 },  // (inceleme düzeltmesi) stepMsEma/maxSteps (uyarlanır bütçe) kaldırıldı; kirpilan sayılır
onStep: [],                                   // test kancası: her adımdan sonra (stepCount)
// (inceleme düzeltmesi) Benzetim saati ayrı bir simTime değildir: adımda zaten STEP kadar artan game.playTime (game.js:224) kullanılır.
// Faz 2 (P6) oyun kurallarını game.playTime'a bağladı; ikinci bir saat iki fazı ayrıştırırdı. Belgenin geri kalanında "simTime" = game.playTime.

update(frameDt) {                             // frameDt: engine.js:62'de ≤ 0,1; gizli sekmede 0
  if (G.state === 'menu') { this.menuUpdate(frameDt); return; }
  if (G.state !== 'playing' || !G.player || G.paused) return;
  const p = G.player;
  input.beginFrame();                         // yeni kenarları adım tamponuna aktar (§4)
  if (!G.uiOpen && !p.dead) this._globalKeys();                       // kare bağlamı
  const look = input.takeLook(frameDt);                               // bir kez tüketilir (§4.2)
  if (p.mode === 'cannon') shipControl.aimInput(look); else if (!G.uiOpen) tpCamera.rotate(look.dx, look.dy);
  // (inceleme düzeltmesi) aimInput bugünkü koşulları korur: p.ship var ve !G.uiOpen (shipControl.js:290)
  ...zoom...
  let simDt = Math.min(frameDt, this.MAX_SIM_PER_FRAME);
  this.stats.kirpilan += frameDt - simDt;     // (inceleme düzeltmesi) FS03 bunu ölçer (yalnız DK.frames 0,1'i aşan kare verirse)
  this.frameClock += frameDt;                 // (inceleme düzeltmesi) ağ saat eşlemesi bu saate bağlanır (§5)
  if (G.hitStop > 0) { G.hitStop -= frameDt; if (!G.online) simDt *= 0.12; }   // §5.3
  this.acc += simDt;
  const willStep = this.acc >= this.STEP - this.EPS;
  if (willStep) { for (const s of G.ships) s.beginSim(); G.rowboat?.beginSim(); }  // (inceleme düzeltmesi) adımsız karede poz takası yok
  const maxSteps = this.MAX_STEPS;            // (inceleme düzeltmesi) sabit 6; uyarlanır bütçe kaldırıldı (§2.3)
  let k = 0;
  while (this.acc >= this.STEP - this.EPS && k < maxSteps) {
    interp.capture();                         // önceki durum ← şimdiki durum
    input.inStep = true; this._step(this.STEP); input.inStep = false;
    input.endStep();                          // adım kenarları tüketildi
    this.acc -= this.STEP; this.stepCount++; k++;          // (inceleme düzeltmesi) playTime += STEP zaten _step içinde (game.js:224)
    for (const f of this.onStep) f(this.stepCount);
    if (G.state !== 'playing' || !G.player) break;
  }
  if (this.acc >= this.STEP) { const d = this.acc - (this.acc % this.STEP); this.stats.dropped += d; this.acc -= d; }
  if (this.acc < 0) this.acc = 0;
  this.lastSteps = k;
  if (G.state !== 'playing' || !G.player) return;   // (inceleme düzeltmesi) game.js:210'daki koruma korunur
  const alpha = this.acc / this.STEP;
  const rt = this.playTime - this.STEP + this.acc;          // çizilen an (bir adım geride) (inceleme düzeltmesi: playTime)
  const rdt = Math.max(0, rt - this.renderTime); this.renderTime = rt;
  for (const s of this.systems) if (s.update && !this.SUBSTEP.has(s.name)) s.update(rdt);  // kare mantığı
  this._render(alpha, rdt, frameDt);          // §2.5 ve §3: ara poz, animasyon, parçacık, kamera, ortam
  this.autosaveT += frameDt; …
}
```

* **EPS = 1e-9 s**: kayan nokta birikimi `acc`'yi STEP'in bir ULP altına düşürüp adım kaçırmasın diye vardır. 1/30'luk karelerde her kare tam 2 adım atılır. C-02'deki 1e-6 eşiğinden farkı şudur: o eşik adım **boyunu** bölüyordu, bu ise yalnız **sayımı** korur. Uzun vadede zaman kaybı olmaz.
* `acc` sıfırlanır: `game.start`, `stop`, kayıt yükleme, duraklatmadan dönüş, `DK.game.resetClock()`.
* `lastSubsteps` adı `lastSteps` olur. 03_fizik_duzeltmeler #1'in anlamı değişir (§10.6).
* (inceleme düzeltmesi) `acc` sıfırlanan her yerde `renderTime = playTime − STEP + acc` de kurulur. Kurulmazsa ilk karede `rdt` oturumun bütün süresi kadar büyür; KARE sistemleri ve karıştırıcılar bir karede dakikalarca ileri sarar.
* (inceleme düzeltmesi) Döngünün ardından bugünkü gibi durum koruması vardır (game.js:210). Adım içinde oyun durumu değişirse KARE ve çizim evresi atlanır.
* (inceleme düzeltmesi) Menü (`menuUpdate`, game.js:81-98) adım atmaz. Menüde `ocean.time`, gök ve rüzgâr kare saatiyle (`frameDt`) ilerlemeye devam eder. Yoksa A3'ten sonra menü denizi donar.

### 2.3 Sınırlar: zaman sıçraması, uzun kare, sekme, "spiral of death"

| Durum | Kural | Sonuç |
|---|---|---|
| Kare ≤ 0,1 s | `acc` önceki kalan (< STEP) + dt < 7·STEP olduğundan **6 adım her zaman yeter**. Zaman kaybı yok. | 10 FPS'e kadar gerçek zamanlı |
| Kare > 0,1 s (GC, ada kurulumu, hata ayıklayıcı) | `engine.js:62` kırpar. Kırpılan süre `engine.stats.kirpilan`'a yazılır (yeni sayaç). | Oyun bir an yavaşlar, tünelleme olmaz |
| Sekme arka plana geçti | `engine.timer.connect(document)` (engine.js:9'a ek). Görünür olunca ilk dt = 0. `input` blur'da `down` ile birlikte adım tamponunu da temizler (input.js:69). | Dönüşte hızlanma ya da yığılma yok |
| < 10 FPS | Kare başına 6 adım, yani 0,1 s benzetim | Oyun zamanı yavaşlar ve `stats` görünür olur |
| Spiral of death | Durağan kare süresi F = r / (1 − s/STEP) (r: çizim, s: adım maliyeti). s → STEP olunca ıraksar. Sınır: `MAX_STEPS = 6`, yani F ≤ r + 6s. (inceleme düzeltmesi) İlk sürümdeki **uyarlanır bütçe** (`maxSteps = clamp(floor(25 ms / stepMsEma), 2, 6)`) **kaldırıldı**. Gerekçeler: (a) `stepMsEma` `performance.now()` ile ölçülür. Bütçe 6'nın altına inerse `DK.sim`/`DK.frames` istenen süreyi sessizce eksik ilerletir ve sonuç makineye bağlı olur (SwiftShader test ortamında ağır sahnede adım 4,2 ms'yi aşabilir). (b) 6 adım sınırı sarmalı zaten sınırlar. (c) Çevrimiçide ev sahibinin yavaşlaması bütün dünyayı yavaşlatır. Gerekirse Faz 8'de ölçüme dayalı, varsayılan kapalı ve testlerde her zaman 6 olacak biçimde yeniden ele alınır. | Taban ölçümünde `simMsPerFrame` 0,5–2,67 ms (09_performans, liman). Bu, kare mantığı dahil 1 adımlık maliyettir. 6 × 2,67 = 16 ms: 10 FPS sınırında kabul edilebilir. |
| İzleme | `game.stats = { dropped, kirpilan, stepMs, lastSteps }`. (inceleme düzeltmesi) `kirpilan` hem motor kırpmasını (engine.js:62) hem `MAX_SIM_PER_FRAME` kırpmasını sayar. `stepMs` yalnız ölçümdür, döngüyü etkilemez. Ayarlar panelindeki FPS satırına "benzetim hızı %" eklenebilir. | 09_performans bu değerleri raporlar |

**vsync yuvarlaması** (16,2–17,2 ms → 1/60, sapma bir borç değişkeninde tutulur): Node'da yalnız küçük bir kazanç verdi. 16,6/16,7 ms damgalı karelerde 0 adımlı kare sayısı 15'ten 7'ye, 2 adımlı kare sayısı 8'den 0'a iniyor (Ek A.1). Biriktirici tek başına C-02'yi çözdüğü için yuvarlama **isteğe bağlı** (A1'de bayrakla) bırakılır.

### 2.4 Zaman ölçekleri

| Ad | Tanım | Kullananlar |
|---|---|---|
| **STEP** | 1/60 sabit | Bütün benzetim (§3 ADIM) |
| **rdt** | `renderTime` farkı = k·STEP + (α_şimdi − α_önce)·STEP. Benzetim saatini izler (hit-stop'ta yavaşlar, düşen zamanı içermez) ve karede yumuşaktır. | Karıştırıcılar, yelken, parçacık, su `uTime`, gök görseli, NPC yürüyüşü, balık sürüsü, bulut, kare mantığı zamanlayıcıları |
| **frameDt** | Gerçek süre (≤ 0,1) | Kamera `damp`'ları (camera.js:57-58, 124-127, 135, 163, 167), HUD, ses, ağ zamanlayıcıları, otomatik kayıt |
| **frameClock** (inceleme düzeltmesi) | Σ frameDt (game.update içinde) | Uzak varlık ara değerlemesinin saat eşlemesi (Faz 5). Testlerde `DK.sim` ile birlikte ilerler, duvar saatinden bağımsızdır (§5) |

### 2.5 Ara değerleme

**Genel mekanizma: yeni `js/core/interp.js`.**

```js
// izleyici: { capture(), apply(alpha), snap() }
interp.track(t) / interp.untrack(t)
interp.capture()      // her adımın BAŞINDA: prev ← cur
interp.apply(alpha)   // çizimde: görsel = lerp(prev, cur, alpha)
// hazır izleyiciler: PosYaw(src.pos, src.yaw → obj3d), PosQuat(body), Pose6(ship/rowboat), Point(mermi)
// ışınlanma: |cur − prev| eşiği aşarsa prev = cur (karakter 3 m, gemi 2 m, cisim 2 m, mermi 10 m) + elle interp.snap(x)
```

Durum ile görsel ayrılır. Benzetim yalnız `pos`, `yaw` ve `quat` alanlarına yazar. `Object3D.position` ve `quaternion` yalnız çizim evresinde yazılır.

| Nesne | Benzetim durumu | Önceki/şimdiki | Çizim | Not |
|---|---|---|---|---|
| Yerel oyuncu | `p.pos`, `p.yaw` | `p.prevPos`, `p.prevYaw` (adım başı) | `root.position = lerp + _visDY`; `rotation.y = lerpAngle`; yeni `p.rpos` (kamera odağı) | `_visDY` (player.js:397-402) çizime taşınır (rdt). Nişanda çizilen yaw kamera yaw'ına kenetlenebilir. |
| Oyuncu: dümen, top, tırmanma, kayık | Gemiye/kayığa göre hesaplanan `p.pos` | Aynı | Dünya uzayında lerp. **IK el hedefleri çizimde**, gemi ara pozu uygulandıktan sonra hesaplanır (918-922, 937-940 taşınır). | Gemi pozu doğrusal değil ama adım başına dönme küçük (0,005 rad), hata < 0,1 mm |
| Gemiler | `x, y, z, yaw, pitch, roll` | `prevPose` | **Poz takası:** `beginSim()` kökü benzetim pozuna geri yükler (adımlardan önce). `applyRenderPose(alpha)` kökü ara poza getirir ve `updateMatrixWorld(true)` çağırır (çizim evresi). Ardından `_animate(rdt)`. (inceleme düzeltmesi) Bu tam ağaç güncellemesi, gemi başına karede 2 ek `updateMatrixWorld(true)` demektir; 60 FPS'te bugüne göre net artıştır. Önerilen ucuz biçim: kökte yalnız `root.matrix`/`matrixWorld` yazımı (kökün ebeveyni sahnedir, O(1)). Çocuk matrisleri yalnız okunacakları yerde `updateWorldMatrix(true, false)` ile güncellenir: `cannonWorld` (ship.js:668-674), `aimCannon`, IK el hedefleri. Çizim geçişi renderer'ın kendi `scene.updateMatrixWorld()` çağrısına bırakılır. Adımsız karede `beginSim` atlanır (§2.2). | Adımlardaki bütün `localToWorld`, `cannonWorld` ve çocuk matrisleri değişmeden benzetim pozunu görür. Kare dışı olay işleyicileri (ağ, setTimeout) ara pozu görür; bunlar `s.simToLocal()` kullanmalıdır. (inceleme düzeltmesi) KARE sistemleri döngüden sonra, çizimden önce koştuğu için gemide benzetim pozunu, karakter `Object3D`'lerinde ise önceki karenin çizim pozunu görür. Örnekler: olta ucu (fishing.js:270), el kemiği (seagear.js:199-203). Bu bir karelik görsel gecikme kabul edilir. Zıpkın atış noktası adıma taşınınca (A5) el kemiği yerine benzetim konumundan türetilir (seagear.js:202 yedeği). Aksi halde atış noktası kare zamanlamasına bağlı kalır. |
| Kayık | `x, y, z, yaw, p, r` | `prevPose` | (inceleme düzeltmesi) Gemideki gibi **poz takası**. Adım `mesh` pozunu benzetim pozuna yazmaya devam eder (ship.js:839-841). `applyRenderPose` çizimde ara pozu yazar. Kürekler (842-843) çizime taşınır. Bağlı kayık (`updateDocked`, ship.js:763-768) çizimde geminin ara pozundan konumlanır. | (inceleme düzeltmesi) İlk sürüm 839-843'ü tümüyle çizime alıyordu. Ancak `seatWorld()` (ship.js:845-847) `mesh.position/quaternion`'dan okur ve adımda kayık kipindeki oyuncuyu konumlar (player.js:949). Örgü yazımı adımdan çıkarsa adımlar kare başındaki pozu görürdü. Seçenek: `seatWorld` analitik `(x, y, z, yaw, p, r)`'den hesaplanır. |
| Rijit cisimler | `b.pos`, `b.quat` | `b.prevPos`, `b.prevQuat` | `mesh.position = lerp − offsetY`; `quaternion.slerp` (bodies.js:107-111 çizime) | |
| Taşınan sandık | Sahibin konumundan | — | Sahibinin **çizim** konumu + ofset (treasure.js:289-296 çizime) | Uzak taşıyıcıda ağ tamponu. (inceleme düzeltmesi) Kayıktaki yük sandığı ('boat' durumu, treasure.js:330-335, `b.mesh` pozundan) da çizime alınır. |
| Gülle | **`b.pos` (yeni)**. Bugün durum `b.m.position`'da (effects.js:160-161) | `b.prevPos` | `m.position = lerp` | 58 m/s: adım başına 0,97 m; 144 Hz'de ara değerlemesiz titrer |
| Düşman mermisi, zıpkın | `s.pos` / `h.pos` (önceki zaten var: enemies.js:1490, seagear.js:251) | Saklanır | `mesh.position = lerp`, ip çizimde | |
| Düşmanlar, hayvanlar, megafauna, boss kökü | `pos`, `yaw` | `prevPos`, `prevYaw` | `root` lerp; karıştırıcı `rdt` ile. Uzaktakiler seyrek: rdt biriktirilir, 2–4 karede bir. | Ragdoll'daki ceset atlanır (kemikler dünya uzayında) |
| Ev sahibinde uzak oyuncular | Ağ | (inceleme düzeltmesi) Faz 3'te bugünkü üstel yumuşatma çizim evresinde (`frameDt`). Zaman damgalı tampon Faz 5'te, kare saatiyle (§5). | — | alpha kullanılmaz. (inceleme düzeltmesi) Oyun mantığı (AI hedefi, düşman mermisi isabeti, crowd) uzak oyuncunun çizim konumunu değil, son doğrulanmış konumunu kullanır: Faz 2'deki `r.auth`/`posOf(pid)`. Çizim konumu ayrı bir alanda tutulur (`r.rpos`). |
| Konukta gemi, düşman, hayvan, sandık | Ağ (konuk benzetimi `clientUpdate`/`_interp`) | (inceleme düzeltmesi) Konuk gemisi `clientUpdate` adımda kalır (üstel, dt'den bağımsız). Düşman ve hayvan `_interp` çizime taşınır. Tampon Faz 5'te. | | |
| NPC'ler | Kare mantığı (npcs.js:118-145, rdt) | — | Doğrudan | Benzetim değil |
| Kamera | Kendi ara değerlemesi yok. Her kare ara değerlenmiş odaktan (`p.rpos` başı) hesaplanır. Gemi gövdesi testi ara pozları görür, yani çizilenle tutarlıdır. | — | `frameDt` yumuşatması aynen kalır | camera.js:58 odak lerp'i korunur. (inceleme düzeltmesi) `_camera` içindeki bütün benzetim okumaları çizim pozuna geçer. Dümen kipi odağı `head.set(s.x, s.y + 5, s.z)` (game.js:316) geminin ara pozundan alınır, yoksa 144 Hz'de kamera gemiye göre 60 Hz adımlarla titrer. Dürbün `p.pos.clone()` (game.js:278) ve karakter gizleme mesafesi `p.headPos` (game.js:373; headPos `this.pos` okur, player.js:291) `rpos`'tan alınır. |
| Parçacıklar | Çizim (rdt) | — | — | Doğum adımda yapılır, entegrasyon çizimde |
| Su yüzeyi | `ocean.time` adımda | — | `uTime = renderTime` ile uyumlu | Su ile gemi y'si aynı anı gösterir. (inceleme düzeltmesi) `ocean.time` benzetim anını, çizilen su ise `renderTime`'ı (≤ 1 adım geride) gösterir. Çizim evresinde su yüksekliği okuyan bütün kodlar `ocean.heightAt(x, z, renderTime)` kullanmalıdır (ocean.js:43'te `t` parametresi var). Bunlar: kamera su kıskacı (camera.js:83, 88, 149-152), su altı kararı (game.js:382-385), dürbün (game.js:280, 285). Fırtınada dalga yüzeyi bir adımda ~5 cm oynar; su altı histerezisi 3–12 cm olduğundan bu fark 17_kamera_kararma'daki su altı kararmasını geri getirebilir. |

**Sim içi sıra değişikliği (C-08).** `_step` sırası şöyle olur: shipControl (kare girişi hariç) → **gemiler** (`update`/`clientUpdate`, `tickCannons`, olaylar) → `collideAll` → kayık → **oyuncu** → interact → SUBSTEP. Böylece güverte, dümen, top ve kayık kiplerinde `p.pos` aynı adımın gemi matrisinden türetilir. Güverte düşmanları zaten gemilerden sonra güncelleniyor (enemies.js:1162-1166). Dümen girdisi (`setRudder`) bir adım (16,7 ms) gecikir; bu fark edilmez. `_shipHullPush` (player.js:703-718) da güncel gemi konumunu görür.

(inceleme düzeltmesi) Bir eksik var: `Ship.collideAll` (ship.js:462-511) gemileri `x/z`'de iter (487-488) ama kök matrisini yenilemez. Oyuncu ve güverte düşmanları ise `localToWorld` ile kök matrisinden (ship.js:170) konumlanır. Bordalamada itme kadar (en çok 1,5 m'lik örtüşmede metrelerce) sapma olur. Bu yüzden `collideAll` sonrasında itilen gemilerin kök matrisi O(1) yenilenir: `root.position` + `updateMatrix` + `matrixWorld`. Bunun için `collideAll`'ın itme yapıldığını bildirmesi gerekir.

**Gecikme.** Ara değerleme çizimi bir adım geride gösterir (16,7 ms). Girdi en çok bir adım bekler. (inceleme düzeltmesi) İki gecikme toplanır: adımsız karede girdinin bir sonraki adımı beklemesi (≤ 1 STEP) ve çizimin bir adım geride olması (≤ 1 STEP). Toplam görsel gecikme bugünkünden **ortalama ~1 STEP, en kötü ~2 STEP (≈ 33 ms)** fazladır. İlk sürüm "en çok 1 STEP" diyordu. R2'deki önlem (nişanda çizilen yaw'ın kameraya kenetlenmesi) bu yüzden önemlidir.

(inceleme düzeltmesi) **Testlere etkisi.** `DK.sim(…, 1/30 | 1/60)` her karede `acc`'yi sıfıra indirir. Bu yüzden döngü sonunda alpha = 0 olur ve çizim tam **1 adım geride** kalır. Çizilen konumla benzetim konumunu karşılaştıran testler `DK.game.syncRender()` çağırmalı ya da 1 adımlık pay bırakmalıdır (koşuda ~0,12 m). Etkilenebilecek testler: 04 C07 ve C08, 15, 16 ve 17'deki baş/kamera ölçümleri.

---

## 3. Sistem sistem sınıflandırma

Sınıflar: **ADIM** (sabit 1/60), **KARE** (kare mantığı, rdt), **ÇİZİM** (alpha/rdt, yalnız görsel), **UI** (frameDt).

| Sistem / iş | Kaynak | Şimdi | Hedef | Not |
|---|---|---|---|---|
| Oyuncu durum ve fiziği | player.js:325-392, 509-970 | alt adım | **ADIM** | Sıra gemilerden sonra |
| Oyuncu görseli (kök, `_visDY`, örtüler, `Character.update`, IK) | player.js:393-416, 918-922, 937-940 | alt adım | **ÇİZİM** | `Player.render(alpha, rdt)` |
| Kamera | game.js:309-376; camera.js:55-169 | kare | **ÇİZİM** (frameDt) | `p.rpos` odak; C-13 |
| Dürbün | game.js:272-307 | kare | ÇİZİM | `performance.now()` titremesi görsel, kalabilir |
| Global tuşlar, duraklatma | game.js:240-253; main.js:121 | kare | **UI** | Kare kenarları |
| Top nişanı (fare/çubuk) | shipControl.js:290-295 | alt adım (C-03) | **KARE girişi** | `takeLook` bir kez |
| Top ateşi, yangın hasarı, istasyon bırakma | shipControl.js:276-289, 296-299 | alt adım | ADIM | |
| Yangın parçacığı doğumu | shipControl.js:282-283 | alt adım | ADIM (doğum) | Yoğunluk 60 Hz'e sabitlenir |
| Gemi fiziği, çapa, halat, kara/kaya çarpışması | ship.js:267-379, 383-459 | alt adım | ADIM | C-10 eklenir |
| Gemi kaldırma yayı (y/pitch/roll) | ship.js:545-557 | alt adım | ADIM | |
| Gemi kök matrisi | ship.js:558-561 | alt adım | ADIM (sim pozu) + ÇİZİM (ara poz) | Poz takası |
| Yelken, bayrak, zincir, çark, fener (`_animate`) | ship.js:562, 584-665 | alt adım (C-14) | **ÇİZİM** (rdt) | `computeVertexNormals` karede 1 kez |
| Direk devrilme açısı | ship.js:146-151 | alt adım | ADIM (durum) | Görsel çizimde de okunabilir |
| Konuk gemi takibi | ship.js:566-579 | alt adım | ADIM (A10'da tampon) | |
| Gemi–gemi | ship.js:462-511 | alt adım | ADIM | |
| Kayık fiziği / örgüsü | ship.js:790-838 / 839-843 | alt adım | ADIM / ÇİZİM | (inceleme düzeltmesi) 839-841 (kök pozu) ADIM'da kalır (poz takası, `seatWorld` için); ÇİZİM'e yalnız ara poz ve kürekler (842-843) gider |
| interact aday seçimi ve basılı tutma | interact.js:21-70 | alt adım | ADIM | |
| interact istemi | interact.js:71 | alt adım ×n | **KARE** (1 kez) | |
| Rijit cisimler | bodies.js:98-106, 114-212 | alt adım | ADIM | İç bölme (101) kaldırılır |
| Cisim örgüleri | bodies.js:107-111 | alt adım | ÇİZİM | |
| Gülle balistiği ve isabeti | effects.js:149-198 | alt adım | ADIM | C-05 |
| Parçacıklar | effects.js:122-146 | alt adım (C-14) | **ÇİZİM** (rdt) | |
| combat (yakın dövüş, tabanca, ses olayları, `combat.time`) | combat.js:86-122 | alt adım | ADIM | C-06 |
| Düşman AI, hareket, mermi | enemies.js:1592-1615 | alt adım | ADIM | C-16 |
| Düşman karıştırıcı, HUD, halka | enemies.js:1606-1609 | alt adım | ÇİZİM | |
| Hayvan AI ve hareket / animasyon | animals.js:465-569 / 636, 729 | alt adım | ADIM / ÇİZİM | C-15 |
| Megafauna (sürü, ev sahibi) / görsel bölüm | megafauna.js:372-397 / 398-… | alt adım | ADIM / ÇİZİM | |
| hazards (kaya yuvarlama, itme bloğu, gayzer) | hazards.js:358-385, 525-554, 607-… | alt adım | ADIM | |
| Bosslar / `anim.update` | bosses.js:1102-1115 / 625, 686, 805 | alt adım | ADIM / ÇİZİM | |
| crowd | crowd.js:13-45 | alt adım | ADIM | C-11; itmeden sonra resolve |
| events (yüzen nesneler, ipler) | events.js:57-… | alt adım | ADIM; örgü ve ip ÇİZİM | |
| treasure: kazı girişi | treasure.js:159 | kare | KARE | Kare kenarı |
| treasure: sandık fiziği ve durum | treasure.js:297-329 | kare | **ADIM** | C-09 |
| treasure: taşınan sandık, keseler, salınım | treasure.js:289-296, 163-177 | kare | ÇİZİM | |
| seagear: donanım taraması, ipucu, hava kesesi | seagear.js:154-175 | kare | KARE (rdt) | |
| seagear: zıpkın ve ağ uçuşu | seagear.js:176-177, 208-286 | kare, alt adımsız | **ADIM** | C-07; ip ve mızrak çizimde |
| fishing | fishing.js:65-… | kare | KARE (rdt) | |
| fish (sürüler) | fish.js:387-… | kare | KARE (rdt) | Zıpkın balık konumunu adımda okur; balıklar yavaş, kabul edilir |
| npcs (rutin, yürüyüş, karıştırıcı) | npcs.js:118-176 | kare | KARE (rdt) | Çarpıştırıcı taşıma: §7.5 |
| islands (akış, `B.tick`: tapınak kapısı) | islands.js:271-…, 810-816 | kare | KARE (rdt) | |
| quests, progress | | kare | KARE | |
| worldEvents (buzdağı sürüklenmesi, meteor) | worldEvents.js:358-370 | kare | KARE (rdt) | Buzdağı `Ship.obstacles` 0,12 m/s; adıma gerek yok |
| weatherfx görsel (bulut, gökkuşağı, hortum örgüsü ve parçacığı) | weatherfx.js:237-320 | kare | ÇİZİM (rdt) | |
| **weatherfx su hortumu kuvveti** | weatherfx.js:322-332 | kare (N-02) | **ADIM** (`weatherfx.step(h)`) | Gemi hızına, dönüşüne, canına etki eder |
| details (martı, yosun, istiridye) | details.js:500-… | kare | ÇİZİM (rdt) | 507: `performance.now()` görsel |
| Dünya saati | `time.update` (game.js:390) | kare | KARE (rdt) | Gelgit benzetim saatini izler. (inceleme düzeltmesi) `time.update` bugün karede iki kez çağrılıyor (game.js:212 ve 390); tek çağrıya indirilir. Saati ilerleten `sky.update` (sky.js:235) olduğu için gelgit (time.js:82, sky.js:260) ancak saat ilerlemesi de rdt ile yapılırsa benzetim saatini izler. |
| Gök görseli | sky.js:233-255, 261-… | kare | ÇİZİM (rdt) | |
| **Rüzgâr, esinti, dalga ölçeği, gelgit** | sky.js:256-260 | kare + duvar saati (N-03) | **ADIM** (`sky.stepPhysics(h)`, esinti `simTime` = `game.playTime`'dan) | Menüde kare saatiyle |
| **`ocean.time`** | ocean.js:271 | kare | **ADIM** | `uTime = renderTime`. (inceleme düzeltmesi) Çizim evresi okuyucuları `heightAt(x, z, renderTime)` kullanır (§2.5). Menüde kare saatiyle ilerler. |
| Su örgüsü ve uniformlar | ocean.js:272-279 | kare | ÇİZİM | |
| Arazi akışı | game.js:381 | kare | KARE | |
| props, port görselleri | game.js:392-394 | kare | ÇİZİM (rdt) | |
| Ses, müzik, dinleyici | game.js:396-411 | kare | UI (frameDt) | |
| HUD | main.js:119 | kare | UI | |
| Ağ gönderimi ve uzak oyuncular | main.js:120; net.js:696-731 | kare | KARE (frameDt) + ÇİZİM (tampon) | §5. (inceleme düzeltmesi) Faz 3'te tampon yok. Uzak oyuncu (net.js:87-124), konuktaki düşman ve hayvan yumuşatması (`_interp`, enemies.js:1621-1638, animals.js:818-826) çizim evresine taşınır, `frameDt` ile ve bugünkü üstel `damp`la. Tampon Faz 5'e kalır. |
| Ragdoll | ragdoll.js:110-121 | `Character.update` içinde | ÇİZİM içinde, kendi 1/60 biriktiricisiyle (değişmez) | Yalnız görsel |
| Otomatik kayıt | game.js:217-218 | kare | UI (frameDt) | |
| Menü sahnesi | game.js:81-98 | kare | KARE (değişmez) | Oynanış yok |

Görsel yoğunluk kare hızına bağlı kalır ama önemsizdir: weatherfx.js:320, details.js:539, islands.js:681 ve 816'da kare başına olasılıkla parçacık doğuyor. Çizim evresinde `rdt·60` ile ağırlıklandırılabilir.

---

## 4. Girdi

### 4.1 Kenar olayları: adım tamponu

**Bugün:** `pressedSet` (input.js:58) kare boyunca durur ve `endFrame`'de silinir (163-168). `pressed()` ilk alt adımdan sonra `subframe` yüzünden false döner (106-110). Biriktiricili döngüde 120/144 Hz'deki adımsız karelerde bu kenarlar **kaybolurdu**: 144 Hz'de karelerin %58'inde adım atılmıyor.

**Hedef:**

```js
stepEdges: new Set(),                 // adım bağlamında okunan kenarlar
inStep: false,
beginFrame() {                        // game.update başında
  for (const c of this.pressedSet) this.stepEdges.add(c);
  const p = this._padState(); if (p) for (const a in this.PAD) { const b = this.PAD[a];
    if (p.buttons[b]?.pressed && !this.padPrev[b]) this.stepEdges.add('Pad' + b); }
},
pressed(action) {
  const c = this.bindings[action];
  if (this.inStep) return (c && this.stepEdges.has(c)) || this.stepEdges.has('Pad' + this.PAD[action]);
  return (c && this.pressedSet.has(c)) || this._padPressed(action);      // kare bağlamı (UI)
},
endStep() { this.stepEdges.clear(); },  // yürütülen İLK adım kenarı tüketir
consume(action) { …pressedSet.delete(c); this.stepEdges.delete(c); … },
// blur: down.clear() + stepEdges.clear()   (input.js:69)
```

* **Kayıp yok:** adımsız karede kenar tamponda kalır ve sonraki ilk adımda okunur (gecikme ≤ 1 STEP).
* **Çift tetik yok:** kenarı yalnız ilk yürütülen adım görür. `subframe` (input.js:43, game.js:204, 208) kaldırılır.
* **Basıp bırakma** adımsız karede olsa da (`down` false iken) kenar okunur. Hafif saldırı ve kısa etkileşim doğru çalışır (combat.js:127-132).
* **Adım bağlamında okuyanlar:** player.js:489 (kaçın), 512 ve 830 (eğil), 557 ve 867 (zıpla), 912 (yelken); combat.js:101, 104, 127; interact.js:51, 66; shipControl.js:296; seagear.js:214 ve 393 (A5'te adıma taşınınca; inceleme düzeltmesi: ağ atışı 393 de).
* **Kare bağlamında okuyanlar:** game.js:242-252, main.js:121, treasure.js:159, fishing.js:70, 73, (inceleme düzeltmesi) fishing.js:92, 100 (olta toplama ve vurma). Aynı eylemi iki bağlamda okuyan çiftler ('saldiri': kazı/olta karede, kılıç/tabanca/top adımda) birbirini dışlayan ekipman koşullarına bağlı olduğu için çakışmaz.

### 4.2 Bakış ve kamera dönüşü

* `takeLook(frameDt)` fare farkını **döndürüp sıfırlar**: bir kez tüketilir. C-03'ün kökü kapanır: `lookDelta` alt adımda yeniden okunuyordu (shipControl.js:292).
* **Yeni bulgu N-01:** gamepad sağ çubuğu kare başına sabit 0,045/0,035 rad ekliyor (input.js:154-157). Dönüş hızı FPS'le doğru orantılı: 30 FPS'te 1,35, 60'ta 2,7, 144'te 6,5 rad/s. Düzeltme: çubuk payı `× frameDt × 60`.
* Kamera dönüşü kare başına ve tam farkla yapılır (bugünkü gibi). Hareket yönü (`_moveDir`, player.js:435-442) adım içinde kameranın o karedeki yaw'ını kullanır.
* Top nişanı `shipControl.aimInput(look)` ile kare başına bir kez işlenir. `aimCannon` adımda uygulanmaya devam eder.

### 4.3 Test kancaları (main.js)

| Kanca | Davranış |
|---|---|
| `DK.sim(sec, dt)` | Değişmez. Başında `game.acc = 0` yapılır (rAF kalıntısı belirlenimi bozmasın). dt'si 1/30 ve 1/60 olan bütün mevcut çağrılar aynı adım sayısını atar. (inceleme düzeltmesi) `dt > 0,1` ise her kare ⌈dt/0,1⌉ eşit parçaya bölünür. Bugün `DK.sim` motor kırpmasını atlıyor (main.js:145-149). Yeni `MAX_SIM_PER_FRAME` kırpması game.update içinde olduğu için parçalama yapılmazsa `DK.sim(sn, 0.25)` (v03/full.js:17) istenen sürenin yalnız %40'ını ilerletirdi. |
| `DK.frames(dts[])` (yeni) | Rastgele kare dizisi oynatır (ani FPS düşüşü testleri). (inceleme düzeltmesi) Motor kırpmasını (engine.js:62) taklit etmek için kareleri 0,1'de keser ve kesilen süreyi `stats.kirpilan`'a yazar. |
| `DK.simSteps(n)` (yeni) | Tam n adım atar |
| `DK.game.resetClock(t0?)` (yeni) | `acc = 0`; isteğe bağlı `playTime = ocean.time = t0` (gemi testlerinde esinti ve dalga anı aynı olsun). (inceleme düzeltmesi) `renderTime` de kurulur (§2.2). Uyarlanır bütçe olmadığı için başka kurulum gerekmez. |
| `DK.game.onStep.push(fn)` | Adım başına ölçüm: tepe yükseklik, havada adım, gömülme |
| `DK.game.syncRender()` | alpha=1 ile çizim evresini koşturur (konum atayıp hemen görsel okuyan testler için) |
| `DK.press`, `DK.tap` | Değişmez. Kenar tamponu gecikmesiz okur. |

---

## 5. Ağ (co-op) ile etkileşim

### 5.1 Bugünkü durum

| Akış | Hız | Gönderen | Alıcıda yumuşatma |
|---|---|---|---|
| Oyuncu durumu `st` (konum, yaw, kip, güverte yereli) | 15 Hz (`sendT = 1/15`, net.js:712-714) | Konuk → ev sahibi; ev sahibi `snap.players` içinde | `RemotePlayer.update`: kare başına üstel `k = 1 − e^(−14·dt)`, 8 m'de atlama (net.js:87-124). Güvertede gemi yerelinden (92-95). Hız konum farkından (101). |
| Gemiler (`netState`) | 15 Hz | Ev sahibi | Konuk `clientUpdate`: ≤ 0,25 sn dışdeğerleme ve **alt adımda** `damp(…,8,h)` (ship.js:566-579) |
| Düşman, boss, hayvan, megafauna, zaman, hava, dünya olayları, sandık | 7,5 Hz (her 2. anlık görüntü, net.js:741) | Ev sahibi | Düşman ve hayvan **alt adımda** `damp(…,10,h)` (enemies.js:1621-1638, animals.js:818-826). Sandık konumu doğrudan atanıyor (net.js:689-691): 7,5 Hz'de sıçrar. |
| Dümen, kayık durumu | 15 Hz | Konuk | |
| Düşman mermileri | 15 Hz (yalnız görsel) | Ev sahibi | Doğrudan atama (enemies.js:1644-1649) |

Zaman damgası yok, hız tahmini yok, çizim zamanı tanımlı değil. Gönderim zamanlayıcısı kare dt'siyle ilerliyor.

### 5.2 Hedef

(inceleme düzeltmesi) **Kapsam kararı (K9).** Aşağıdaki 1–5. maddelerden Faz 3'te yalnız 5. maddenin "yumuşatma çizim evresine" kısmı ve §5.3'teki hit-stop kuralı uygulanır. 1–4. maddeler (zaman damgası, saat eşleme, tampon, hız türetme) **Faz 5'e (co-op tamamlanması)** kalır. Gerekçeler:

* (a) **Saat eşleme duvar saatine bağlıydı.** İlk sürüm `ofs = EMA(ts − now/1000)` öneriyordu. Co-op testlerinde `DK.sim(0.2)` gerçek zamandan hızlı akar ve rAF `fpsLimit = 0.01` ile durdurulmuştur (coop.cjs:54). Bu yüzden konukta uzak varlık gecikmesi makine hızına bağlı olurdu. Node modelinde (Ek A.6, `inceleme3_netclock.mjs`) evaluate süresi 20 ms iken gecikme ortalaması 0,48 s, 60 ms iken 0,30 s, 150 ms iken −0,12 s (öne geçme) çıktı. Kare saatiyle (`game.frameClock`, Σ frameDt) her durumda 0,12 s'dir. Faz 2 aynı sorunu kendi hareket doğrulayıcısında görüp benzetim saatine geçti (faz2 D-6, ilke P6). Tampon gelince eşleme `ofs = EMA(ts − frameClock)` olmalıdır.
* (b) **Faz 2 ile protokol çakışması.** Faz 2 bir şema kayıt defteri ve `PROTO` sürüm kuralı getiriyor ("teldeki alanı değiştiren her sürüm PROTO'yu artırır", bilinmeyen anahtarlar atılır). Faz 2 `st` iletisine zaten `ts` koyuyor (konuğun benzetim saati, yalnız sıralama için). İlk sürümdeki "isteğe bağlı alan, eski istemciyle uyum" yaklaşımı bu kuralla çelişir. `snap.ts`/`seq` Faz 5'te şemaya eklenir ve PROTO artırılır. `ts` = `game.playTime`.
* (c) **Gerekli değil.** Faz 3'ün asıl ihtiyacı, adım dışına çıkan uzak varlıkların 144 Hz'de 60 Hz basamaklarıyla titrememesidir. Bunun için bugünkü üstel yumuşatmanın (`k = 1 − e^(−14·dt)`, `damp(…,10,dt)`) çizim evresinde `frameDt` ile koşması yeter. Üstel yumuşatma kare bölünmesinden bağımsızdır.

İlk sürümün maddeleri Faz 5 için referans olarak aşağıda kalır (1–4 → Faz 5):

1. **Zaman damgası:** her `snap`'e `ts = game.simTime` ve `seq` eklenir (inceleme düzeltmesi: Faz 5'te; `ts = game.playTime`, Faz 2 şemasına ve PROTO artırımıyla). Konuğun `st`'sine kendi `ts`'i eklenir. Alanlar isteğe bağlıdır: `ts` yoksa eski yöntem kullanılır, böylece eski istemciyle uyum korunur.
2. **Saat eşleme:** ~~alıcı her eş için `ofs = EMA(ts − now/1000, 0.1)` tutar. `hostNow = now/1000 + ofs`.~~ (inceleme düzeltmesi) Alıcı `ofs = EMA(ts − game.frameClock, 0.1)` tutar ve `hostNow = game.frameClock + ofs` olur. |hata| > 0,5 s ise `ofs` doğrudan atanır (sekme dönüşü, takılma).
3. **Ara değerleme tamponu** (yeni `js/net/interpBuffer.js`): varlık başına son ~1 sn'lik (ts, durum) halkası tutulur. Çizim anı `renderTs = hostNow − D`. **D = 0,10 s** (15 Hz akışlar: oyuncu, gemi), **D = 0,20 s** (7,5 Hz akışlar: düşman, hayvan, sandık). İki örnek arasında lerp ve lerpAngle yapılır. Yeni örnek gelmezse en çok 0,25 s hızla dışdeğerlenir, sonra beklenir. 8 m'den büyük farkta atlanır. Hız tampondan türetilir (düşman nişanı `pl.vel` için, enemies.js:1060).
4. **Gönderim hızları Faz 3'te değişmez.** Bant genişliği aynı kalır. Gönderim zamanlayıcısı gerçek süreyle (`frameDt`) çalışmayı sürdürür. Zaman damgası benzetim saatidir. Hız artırımı (yakın düşmanlar 15 Hz) Faz 5'e bırakılır.
5. Uzak varlıkların yumuşatması adımdan çıkarılıp **çizim evresine** taşınır: `enemies._interp`, `animals._interp`, `RemotePlayer.update`. Konuk gemisinin benzetim pozu tampondan örneklenir. Konuğun güverte oyuncusu bu pozdan türetildiği için çizim tutarlı kalır. (inceleme düzeltmesi) Faz 3'te: `_interp` ve `RemotePlayer.update` çizim evresinde `frameDt` ile koşar. Konuk gemisi `clientUpdate` adımda kalır. "Tampondan örnekleme" Faz 5'e kalır.

### 5.3 Ev sahibi ile konuk arasındaki fark

| | Ev sahibi | Konuk |
|---|---|---|
| Sabit adım benzetimi | Herkes: oyuncu, gemiler, AI, cisimler, gülle isabeti, gemi–gemi, sandık fiziği | Yalnız yerel oyuncu, kendi zıpkını, sürdüğü kayık, görsel gülleler (`visual`, effects.js:117), yerel parçacıklar |
| Yerel varlık çizimi | alpha ara değerlemesi | Kendi oyuncusu: alpha |
| Uzak varlık çizimi | Uzak oyuncular: tampon (D=0,1). (inceleme düzeltmesi) Faz 3'te çizim evresinde üstel yumuşatma, tampon Faz 5'te | Gemi, düşman, hayvan, sandık, öteki oyuncular: tampon (D 0,1/0,2). (inceleme düzeltmesi) Faz 3'te çizim evresinde üstel yumuşatma; gemi adımda `clientUpdate` + alpha |
| İsabet | Ev sahibi kendi benzetim konumlarına göre | ~~Konuk yakın dövüşü kendi gördüğüne göre yapar (bugünkü gibi)~~ (inceleme düzeltmesi) Faz 2'de konuk niyet (`act`) gönderir ve isabeti ev sahibi `hitAt` anında doğrulanmış konumla çözer. Konuğun yerel isabeti yalnız tahmin ve histir. Faz 3 bu modeli değiştirmez. |
| Fizik eşitliği | Sabit adım sayesinde iki taraf **aynı** zıplamayı, geri tepmeyi ve kaçınmayı yaşar. Bugün 144 Hz konuk farklı fizik görüyor (C-01). | Aynı |

**Co-op riskleri ve kurallar:**

* **Hit-stop** (game.js:194) ev sahibinde bütün dünyanın benzetimini %12'ye düşürüyor. Konuklar AI'nın ve gemilerin takıldığını görür. Kural: çevrimiçide hit-stop yalnız kamera sarsıntısı ve yerel animasyon hızı olarak uygulanır, benzetimi yavaşlatmaz.
* **Ev sahibi sekmesi arka plandaysa** rAF durur ve dünya donar. Ping/pong setInterval'la sürdüğü için (net.js:447) konuk bağlantıyı koparmaz. Faz 5'te değerlendirilecek: arka plan sekmesinde Worker zamanlayıcısıyla düşük hızlı benzetim (ör. 10 Hz, kare başına ≤ 6 adım) ya da konuğa "ev sahibi duraklattı" bildirimi.
* D tamponu konukta uzak varlıkları 100–200 ms geride gösterir. Yakın dövüş isabet hissi için ev sahibinde ≤ 200 ms geri sarma (lag compensation) Faz 5/7'nin konusudur. (inceleme düzeltmesi) Bugünkü üstel yumuşatmanın zaman sabiti 71–100 ms'dir. Tampon gelince (Faz 5) konuğun gördüğü konum ev sahibininkinden daha geride kalır. Faz 2'nin host çözümlü savaşında bu ıskalamayı artırır. Bu yüzden tampon ile geri sarma aynı fazda (Faz 5) tasarlanmalıdır.
* (inceleme düzeltmesi) **Sandık ve kese durumları.** C-09'daki "güverte yükü" durumu (§7.4) Faz 2'nin sandık durum makinesine ve `chestState` şemasına eklenmelidir. Aksi halde konuk bu durumu doğrulamada reddeder.

---

## 6. Süpürmeli (sürekli) çarpışma

Adım boyu herkes için 1/60 olunca tünelleme eşikleri sabitlenir. Aşağıdaki tablo her hızlı nesnenin bir adımda aldığı yolu ve korunma durumunu gösterir.

| Nesne | En yüksek hız | Adım başına yol | Bugünkü koruma | Açık | Yapılacak | Test |
|---|---|---|---|---|---|---|
| Oyuncu düşüşü | Sınırsız (GRAV −22) | 36 m/s'de 0,6 m | `groundAt(y)` 0,6 m pencere (player.js:596) | **C-17** | `groundAt(x, z, max(öncekiY, yeniY))` (bodies.js:136 ile aynı yöntem); son hız −45 m/s | YD02 |
| Oyuncu yatay (geri tepme k=7) | ~~16,9 m/s~~ (inceleme düzeltmesi) **31,4 m/s**. k = 7 ancak ≥ 46 hasarla oluşur; 20'nin üstündeki hasar oyuncuyu havaya kaldırır (player.js:183-185) ve havada ivme 2,5'tir (player.js:537). Koşu yönünde vurulunca ~35,6 m/s | ~~0,28 m~~ **0,523 m** (koşuyla ~0,59 m). Bugün 144 Hz'de 0,206 m | resolve 3 geçiş (physics.js:134-141) | (inceleme düzeltmesi) Eşik **aşılıyor**: 0,4 m kutuda eşik 0,53 m (pay 7 mm; koşuyla aşılır); fener direği r 0,15 (port.js:407) için 0,48 m; 0,2 m'lik duvar (denetim planı) için 0,43 m | (inceleme düzeltmesi) **Zorunlu** koruyucu ilerleme **A1'de**: `|v|·h > 0,5·r` ise hareketi `ceil(hız·h / (0,5·r))` parçaya böl, her parçada resolve. Düşman ve cisim için A6'da kalır | HH01 |
| Kaçınma | 7,2 m/s | 0,12 m | resolve | — | — | HH02 |
| Uzak düşman (LOD) | 4,3 m/s × 0,25 s | **1,07 m** | Tek resolve | **C-16** | `_move` içinde koruyucu ilerleme (hareket parçalı, karar seyrek) | HH04 |
| Hayvan | — | — | 1,6 m basamak (animals.js:625) | **C-15** | Basamak 0,65 m + yerçekimi. (inceleme düzeltmesi) Basamak sınırı yalnız **platformlar** içindir. `groundAt` arazi yüksekliğini sınırsız alır (physics.js:88), arazi oturması bugünkü gibi kalır; yoksa hayvanlar dik yamaçlara çıkamaz. Yerçekimi yalnız platform kenarından inişte devreye girer. | HH05 |
| Rijit cisim | ≤ 14 m/s itki (bodies.js:62) | 0,23 m | `max(prevBottom)` platform süpürmesi (133-136) | Yatay ince duvar (r·0,9 > yol) | Koruyucu ilerleme (nadir); gemi güvertesi (C-09) | GN04 |
| Gülle | 58 m/s + gemi hızı (combat.js:306) | 0,97–1,2 m | Gemi kutusu 0,5 m örnekleme (effects.js:166-178), arazi, büyük hedef parça–nokta (combat.js:55-70) | **C-05** statik engeller | `segmentQuery(prev→pos, MERMI)` ile en erken t. Gemi için yerel uzayda analitik kutu girişi. En küçük t kazanır. | GN01–GN03 |
| Düşman kurşunu, ok, bıçak | 95 / 42–44 / 26 m/s | 1,6 / 0,7 / 0,43 m | Oyuncu kapsülü `segSegDist` (enemies.js:1496-1513), sonra PROJ_LOS (1531) | **C-06 sıra**: duvarla oyuncu aynı parçadaysa oyuncu kazanıyor | Oyuncu t'si (`segSegDist`'in s parametresi) ile engel t'si karşılaştırılır | GN06 |
| Zıpkın | 20–24 m/s | 0,4 m | `lineBlocked` varsayılan %2 uç payı (seagear.js:280), kare dt'si | **C-07** (Node: 16/400 kaçırma) | ADIM'a taşınır + `segmentQuery(MERMI)` (Node: 0/400) | GN05 |
| Tabanca | Anlık | — | Kameradan ışın (combat.js:243-254), arazi döngüsü (290-293), lineBlocked (295) | **C-06**: namlu görüşü yok, kamera tarafındaki hedef vuruluyor | §8.4 | AI-C06c/d |
| Lav bombası, lob | Balistik | — | `aoe` iniş testleri (enemies.js:1517-1527) | Platform | Lob iniş testi `segmentQuery` slab'ı ile | GN04 |
| Gemi | ≤ 12 m/s | 0,2 m | Ayrık çakışma yeterli | **C-10** statik | §7.4 | MI04 |

**Yüksekten düşme, Node faz taraması** (H 0,01 m adımla, Ek A.3). Kaçırma oranları eski / yeni:

| Yükseklik | 10/30/60 FPS (h=1/60) | 144 FPS (bugün h=1/144) |
|---|---|---|
| 5–29 m | %0,0 / %0,0 | %0,0 / %0,0 |
| 30–40 m | **%5,2** / %0,0 | %0,0 / %0,0 |
| 40–60 m | **%20,7** / %0,0 | %0,0 / %0,0 |
| 60–80 m | **%33,2** / %0,0 | %0,0 / %0,0 |

1/60 için eşik yüksekliği 29,45 m. Sabit adımla 144 Hz oyuncusu da 1/60 davranışını alacağı için C-17 süpürmesi A1 ile birlikte gelmelidir (§9).

(inceleme düzeltmesi) **Geri tepme, gerçek kod yolu** (Ek A.6, `inceleme3_knock.mjs`). İlk sürümün kopya modeli (loop_sim.mjs) oyuncuyu yerde tutuyordu (ivme 13). Bu yüzden tepe hız 16,9 m/s çıktı. Gerçekte k = 7'lik her vuruş oyuncuyu havaya kaldırır:

| h | Yerde (model) tepe / adım | Havada (gerçek) tepe / adım | Savrulma |
|---|---|---|---|
| 1/60 | 16,90 m/s / 0,282 m | **31,36 m/s / 0,523 m** (12. adımda) | 10,08 m |
| 1/144 | 15,24 m/s / 0,106 m | 29,67 m/s / 0,206 m | 9,64 m |

Sonuç: sabit adım 144 Hz oyuncusunun adım başına yolunu 2,5 katına çıkarır ve ince engel eşiklerini aşar. Oyuncunun yatay koruyucu ilerlemesi C-17 ile aynı gerekçeyle **A1'de** gelir. Ayrıca kopya model (Ek A.1) A0'da `tests/node/fizik_dongu.mjs`'e taşınırken havada kalma dalı (player.js:185, 537) eklenmelidir.

---

## 7. Çarpışma katmanları ve etkileşim kuralları

### 7.1 Çarpıştırıcı türleri ve kaynakları

| Tür (yeni katman) | Örnekler (dosya:satır) |
|---|---|
| **ENGEL**: kutu ve daire | Bina +0,2 (port.js:342), tezgâh (286), yük (315), tahta, sıra, kereste (374-394), fener (451), ada yapıları colK (islands.js:490-503), tapınak duvarı ve kapısı (800, 810), mezar (props.js:370), çit (439), heykel (353), kaya (246, 248), mağara sütunları (cave.js:137, 144), deniz kayalığı (details.js:303), tehlikeler (hazards.js:183-501) |
| **BITKI**: gövde, kamerayı kesmez | Palmiye 0,32 (props.js:238), ağaç 0,5·s (239), ölü ağaç (249), ada ağaç ve kaktüsleri (islands.js:478) |
| **INCE**: direk, kazık, fener direği | İskele kazıkları 0,22 (port.js:236, islands.js:633), baba (port.js:243), gölgelik direkleri (373), fener 0,15 (407) |
| **YAN**: platform yan yüzü | `addPlatform` yan kutusu (physics.js:76), sığ kesim kutusu (port.js:182, islands.js:646), basamak yan kutuları (port.js:214, islands.js:664) |
| **NPC** | npcs.js:82-83 (`noCam`). Taşınırken hücre güncellenmiyor (133, 180; §7.5). |
| **GORSEL** (yeni): görsel sınır kutusu | Ada yapıları colK 1,0 + 0,1 (§7.4 C-13) |
| **PLATFORM** (ayrı harita): yürünebilir üst yüzey | `physics.platforms` (physics.js:71-78), iskele ve merdiven (port.js:176-213, islands.js:642-663) |
| **MAGARA**: kesit | cave.camE/camClamp (camera.js:102-110) |
| Dinamik: **gemi gövdesi, güverte, güverte nesneleri, kayık** | `hullSolid` (camera.js:15-29), `deckAt` ve `insideDeck` (ship.js:176-182), direkler (190-194), `Ship.obstacles` (details.js:302, islands.js:1074, worldEvents.js:136, 331) |

### 7.2 Etkileşim matrisi

Gösterim: ✔ var, ◐ kısmen, ✘ yok, **→ hedef (sorun numarası)**.

| Hareket eden ＼ engel | Statik kutu/daire (ENGEL·BITKI·INCE·YAN) | Arazi | Platform (üst yüzey) | Gemi gövdesi | Güverte nesneleri |
|---|---|---|---|---|---|
| **Oyuncu** | ✔ resolve r 0,33/0,35 (player.js:590, 772); hızın engele dik bileşeni silinir (594-595) | ✔ zemin + eğim (570-587, 596) | ◐ 0,6 m pencere, süpürme yok **→ dikey süpürme (C-17)** | ✔ dışarıdan itme (703-718, yalnız kara ve yüzme) | ◐ yalnız direk (ship.js:190-194) **→ top, dümen, çıkrık, ambar kapağı, masa (C-12)** |
| **Düşman** | ✔ r 0,42/0,5/0,65 (enemies.js:1123, 1191) **→ LOD'da parçalı (C-16)** | ✔ anında oturma (1197) | ✔ 0,65 m pencere | ✘ karadaki düşman gövdeye girer **→ ✔ ortak itme** | ◐ direk (1118) **→ C-12** |
| **Hayvan** | ✔ (animals.js:568) | ◐ yalnız h > 0,35 eşiği (566) | ✘ 1,6 m basamak (625) **→ 0,65 m + yerçekimi (C-15)** | ✘ **→ ✔** | — |
| **Cisim** (sandık, varil, kese) | ✔ r·0,9 + sekme (bodies.js:160-167) | ✔ normal + sürtünme (137-157) | ✔ prevBottom (133-136) | ✘ **→ dışarıdan itme** | ✘ güverte zemini yok **→ güverte yerel zemini (C-09)** |
| **Gemi** | ◐ yalnız `Ship.obstacles` daireleri (ship.js:442-459) **→ su hattı bandındaki ENGEL·INCE·YAN (C-10)** | ✔ 9 sonda (417-439) | ✘ iskele ve rıhtım **→ izdüşüm engeli (C-10)** | ✔ gemi–gemi (462-511, ev sahibi) | — |
| **Kayık** | ✘ **→ resolve r≈1,0 + Ship.obstacles (C-10)** | ✔ (805-808) | ✘ **→ ✔** | ◐ yalnız kendi gemisi (813-827) **→ bütün gemiler** | — |
| **Mermi** (gülle, kurşun, ok, zıpkın, tabanca) | Gülle ✘ (C-05), kurşun ✔ PROJ_LOS (1531, yükseklik C-04), zıpkın ◐ (C-07), tabanca ✔ (combat.js:295) **→ `segmentQuery(MERMI)`** | ✔ uç ve örnekleme | ✘ **→ slab (C-06)** | Gülle ✔ 0,5 m örnek **→ analitik**; diğerleri ✘ **→ hullSolid (C-06)** | Gövde kabuğu kapsar |
| **Kamera** | ✔ CAM_LOS (camera.js:8, 112); noCam ve r < 0,2 atlanır (physics.js:220); yarıçap yok **→ pad 0,25 + GORSEL (C-13)** | ✔ zemin kıskacı (camera.js:132-136) | ✔ slab (112) + floorMax (132) | ✔ hullSolid + güverte kıskacı (84-99, 138-145) | Direk ve yelken yakın-kamera silinmesiyle |
| **Görüş (AI)** | ✔ %2 uç payı, rScale 0,8 (physics.js:195) **→ metrik pay** | ✔ 1,5 m örnek | ✘ **→ slab (C-06)** | ✘ **→ ✔ (C-06)** | — |

**Karakter ile karakter:** yerde crowd çalışıyor (crowd.js:17-41). Uzak oyuncu ve NPC sonsuz kütleli. **Güvertede ✘ (C-11).** İtmeden sonra resolve ✘. Hedef: güverte yerel ajanları ve itmeden sonra resolve.

### 7.3 Katman API'si (physics.js)

```js
export const LAYER = { ENGEL: 1, BITKI: 2, INCE: 4, YAN: 8, NPC: 16, GORSEL: 32, MAGARA: 64 };
export const MASK = {
  HEPSI:   ENGEL | BITKI | INCE | YAN | NPC,          // (inceleme düzeltmesi) A4'te bütün mevcut lineBlocked çağıranları (bugünkü davranış)
  HAREKET: ENGEL | BITKI | INCE | YAN | NPC,          // oyuncu, düşman, hayvan, cisim resolve
  GORUS:   ENGEL | BITKI | YAN,                       // + slab + gemi + arazi (segmentQuery bayrakları). (inceleme düzeltmesi) GORSEL çıkarıldı (R7, C-13); INCE/NPC dışlaması A5'te bilinçli değişiklik
  MERMI:   ENGEL | BITKI | INCE | YAN | NPC,          // + slab + gemi + arazi. (inceleme düzeltmesi) GORSEL çıkarıldı, NPC eklendi (bugün kurşun NPC'de duruyor)
  KAMERA:  ENGEL | YAN | GORSEL | MAGARA,             // + slab + gemi + arazi; BITKI·INCE·NPC yok (noCam yerine)
  GEMI:    ENGEL | INCE | YAN,                        // + platform izdüşümü; yalnız su hattı bandı
};
addCircle(x, z, r, y0, y1, tag, m = LAYER.ENGEL)      // eski çağrılar varsayılan katmanla aynı davranır
addBox(…, m = LAYER.ENGEL); addPlatform(… yan kutu m = LAYER.YAN)
resolve(pos, r, y, h = 1.8, mask = MASK.HAREKET)
move(c, x, z)                                          // dinamik çarpıştırıcı: hücreleri yeniden yazar
// (inceleme düzeltmesi) İLK SÜRÜM: "noCam = true → m &= ~KAMERA". YANLIŞ: katman ile maskeyi karıştırıyor.
// Varsayılan m = ENGEL (1) iken 1 & ~(1|8|32|64) = 0 olur: ağaç, palmiye ve direk çemberleri (props.js:238-249, islands.js:478, 633,
// port.js:236, 243, 373) HAREKET maskesinden de düşer, oyuncu ağaçların içinden geçerdi.
// DOĞRUSU: noCam bir katman ATAMASIDIR, bit silme değildir:
noCam = true  →  m = (c.t === 'c' && c.r <= 0.3) ? LAYER.INCE : LAYER.BITKI   // NPC çarpıştırıcısı (npcs.js:82-83) → LAYER.NPC
r < camThinR (0,2) çemberler (physics.js:220, ör. fener 0,15 port.js:407) → LAYER.INCE   // bugünkü kamera kuralı birebir
// geçiş: c.noCam okunmaya devam eder; A4 (katmanlar) sonunda kamera kuralı yalnız maskeden okunur
```

**Kurallar:**

* **R1** Karakterler ve cisimler yalnız HAREKET maskesiyle itilir. Görüş, mermi ve kamera kendi maskesiyle sorgulanır. Aynı çarpıştırıcı birden çok maskeye girebilir.
* **R2** Platform üst yüzeyi karakter ve cisim için **zemindir** (süpürmeli). Mermi, görüş ve kamera için **slab** (güverte düzlemi) sayılır. Gemi için su hattındaysa **engel** sayılır.
* **R3** Gemi gövdesi karakter ve cisimleri dışarıdan iter. Güverteyi yerel uzayda zemin olarak verir. Mermi, görüş ve kamera için yerel uzayda `hullSolid` katıdır.
* **R4** Güverte nesneleri yalnız aynı gemideki güverte karakterlerini ve cisimlerini engeller (yerel uzayda).
* **R5** Kamera BITKI, INCE ve NPC'yi görmez. Onları yakın-kamera silinmesi saydamlaştırır (nearfade.js).
* **R6** Dinamik çarpıştırıcılar (NPC, tapınak kapısı) `move()` ya da y aralığı değişikliğiyle güncellenir. Doğrudan `c.x =` atanmaz.
* **R7** (inceleme düzeltmesi) Bir sorgunun **başlangıç noktasını içeren** çarpıştırıcı (xz izdüşümü + yükseklik bandı) o sorgu için yok sayılır. Bu, kameradaki gövde kuralının (camera.js:78) genellemesidir. Gerekçe: oyuncu bugün yapı duvarlarına 0,1–1 m gömülebiliyor (bilinen #43, `docs/denetim/11_BILINEN_SORUNLAR.md`) ve model AABB'si saçak/çatı taşmasını içeriyor. Bu yüzden göz, baş ya da namlu bir GORSEL ya da hareket kutusunun içinde kalabilir. Kural olmazsa o noktadan çıkan her görüş, mermi ve kamera sorgusu ilk santimde engellenir. Sonuç: AI duvar dibindeki oyuncuyu hiç görmez (gizlenme açığı), tabanca ve zıpkın boşa gider, kamera başa çekilir.
* **R8** (inceleme düzeltmesi) **Maske eşitliği.** Bugün `lineBlocked` (physics.js:194-252) kamera dışındaki bütün çağıranlarda **her** çarpıştırıcıyı sayar: NPC, ince direk, ağaç. İlk sürümdeki GORUS maskesi INCE ve NPC'yi, MERMI maskesi NPC'yi dışlıyordu. Bu bir **davranış değişikliğidir**: AI direk ve NPC arkasını görür, mermi NPC'den geçer. "A4 birebir" iddiası bu maskelerle tutmaz. Karar: A4'te (katmanlar) bütün mevcut çağıranlar bugünkü kümeyle çalışır (`MASK.HEPSI`, kamera için bugünkü noCam/ince kuralı). Daraltmalar A5'te bilinçli değişiklik olarak, kendi testleriyle gelir (AI-C04, GN06). GORSEL yalnız KAMERA maskesindedir (§7.4 C-13).

### 7.4 Sorun bazında çözümler

| Sorun | Çözüm | Dosya | Test |
|---|---|---|---|
| **C-05** gülle statiği görmüyor | Her adımda `prev→pos` için `segmentQuery(MERMI)` en erken t'yi verir. Gemi isabeti yerel uzayda analitik slab girişiyle bulunur (`|lz| < L/2+0,3`, `|lx| < B/2+0,2`, y ∈ [−1,5, deckY+2,5]; effects.js:175 ile aynı kutu). Büyük hedef (combat.js:55-70) de t döndürür. En küçük t kazanır. Statik isabette toz ve kıvılcım çıkar, ses `audio.boom` olur, `explosion` olayı küçük yarıçaplı tetiklenir. Sahip gemi muaftır. | effects.js:149-198, combat.js:55-70, physics.js | GN01–GN03 |
| **C-06** kurallar dağınık | §8'deki birleşik sorgu. (a) AI görüşü slab ve gemi gövdesini görür (küpeşte üstü güverte+0,75: çömelen oyuncunun başı güverte+0,9'da, siper olur). (inceleme düzeltmesi) Parantezdeki çıkarım yanlış. Çömelmiş hedef noktası güverte+0,9 (enemies.js:555), katı küpeşte ise güverte ile güverte+0,8 arası (camera.js:20-28). Hedef noktası küpeşteden **yüksektir**. Aynı ya da daha yüksek bir gözden (başka güverte, iskele: göz +1,6) çıkan doğru küpeşteyi üstten aşar, yani siper olmaz. Küpeşte yalnız alçaktaki atıcıya (su, kayık, alçak kıyı) siperdir. AI-C06a bu yüzden atıcı konumuyla tanımlanır (§10.4). (b) Tabanca namlu görüşü + kamera tarafı süzgeci. (c) Düşman mermisinde t karşılaştırması. | enemies.js:555, 1015, 1496-1531; combat.js:235-298 | AI-C06a–d, GN06 |
| **C-09** dolu ambar, sandık denize düşüyor | (1) `stowInHold` yalnız `G.ship` için çağrılır (treasure.js:390). Ambar doluysa sandık **güverte yükü** olur: kese bağlama mantığı (`_attachDeck`, treasure.js:513-551) sandığa genişletilir, gemi köküne çocuk olarak eklenir, yerel konum `clampDeck`'lenir, ağ durumuna `ship`+`local` yazılır. (2) Uzun vade: bodies güverte zemini (A7b). Cisim bir geminin `insideDeck` izdüşümündeyse ve y güverteye yakınsa zemin = gemi yerel `deckAt`; gemi hızı taşınır. (inceleme düzeltmesi) **Kalıcılık eksikti.** `treasure.save()` (treasure.js:120-126) yalnız ground, water, carried ve boat sandıklarını **dünya koordinatıyla** yazar. Yeni "güverte yükü" durumu ya kayıttan düşer (sandık kaybolur) ya da dünya konumuyla yüklenir; cisim dünyasında güverte olmadığı için (2 yapılmadan) denize düşer. Kayda `state: 'deck'`, `ship` (yalnız `G.ship` kaydedildiği için onun kimliği) ve `local` yazılır. Yüklemede sandık `G.ship`'e yeniden bağlanır, gemi yoksa ambar dolu bildirimiyle iskeleye bırakılır. Bu alan Faz 4'ün kayıt şemasına ve göçüne, Faz 2'nin sandık durum makinesine eklenir. | treasure.js:120-126, 377-418; bodies.js:133-157 | SD02, SD03, (inceleme düzeltmesi) SD06 |
| **C-10** gemi ve kayık iskeleden geçiyor | `Ship._statics(dt)`: gemi kapsülü (baş–kıç ±0,4L, r = B·0,45) ile kapsülün AABB hücrelerindeki GEMI maskeli çarpıştırıcılar karşılaştırılır. Yalnız `y0 < tide+0,5` ve `y1 > tide−draft` olanlar (draft ship.js:421). Daire için segment–nokta, kutu için kutunun yerel uzayında segment–OBB uzaklığı (7 örnek, collideAll ile aynı). Platform izdüşümü, `top > tide−0,3` ise kutu sayılır. Tepki `_collide(…, 'iskele')` (391-415). Demirli gemi (`Ship.dock`, 325-332): halatın çektiği denge noktası iskele kutusunun en az 0,3 m dışında olmalı. Değilse dock noktası kaydırılır. Titremeyi önlemek için tepki yalnız `pen > 0,05` olduğunda verilir. Kayık: `physics.resolve(boat, 1.0, tide−0.3, 1.2, MASK.GEMI)`, `Ship.obstacles` daireleri ve bütün gemilerin kapsülü. | ship.js:370-373, 790-827 | MI04, MI05 |
| **C-11** güvertede itişme yok | crowd.js'e gemi başına yerel ajan listesi eklenir: oyuncu (`p.ship===s && kip deck`) için `p.local`, düşman için `e.local`. Aynı itme yerel xz'de uygulanır, sonra `clampDeck` çağrılır, dünya konumu yeniden türetilir (`_deckWorld`, `localToWorld`). Böylece `_place`'in düzeltmeyi silmesi (enemies.js:1182) sorun olmaz. | crowd.js:13-45 | GV04 |
| **C-12** güverte nesneleri | `shipModel` çıktısına `deckObstacles` eklenir: toplar (`cannons[i].local`, shipModel.js:466-471), dümen (helmZ), çıkrık (capZ), ambar kapağı (kutu, hatchZ, 475-477) ve harita masası. `clampDeck` (ship.js:184-196) bunları direk döngüsüyle aynı biçimde iter. Direkte olduğu gibi itme yarıçapına oyuncu payı dahildir (direk 0,45). **İstasyon kısıtı** (shipModel.js:529-534; nesne konumları 427-449, 480-489): dümen istasyonu dümen direğinden 0,75 m, çıkrık istasyonu 0,7 m, harita istasyonu masadan 0,7 m, ambar istasyonu kapak merkezinden 1,0 m, top istasyonu top merkezinden 1,2 m uzakta (player.js:932). Bu yüzden itme yarıçapları dümen ≤ 0,7, çıkrık ve masa ≤ 0,65, top ≤ 1,15 olmalı; kapak yarı boyu ile pay toplamı ≤ 0,95 olmalı. Değerler model sınırlarından türetilir ve GV03 testiyle doğrulanır. (inceleme düzeltmesi) **Kova istasyonu unutulmuş.** `stations.bucket` = (−0,9; hatchZ − 0,6) (shipModel.js:533), kapak merkezine göre (−0,9; −0,6) konumdadır. Kapak 1,4 × 1,4 m (yarı boy 0,7, shipModel.js:476). Kutu itmesinde `abs(lx) = 0,9` ve `abs(lz) = 0,6` olduğundan kapak yarı boyu + pay **≤ 0,85** olmalı (≤ 0,95 olursa kova istasyonundaki oyuncu itilir). GV03 bütün istasyonları dolaşır: helm, anchor, sails, hold, bucket, map, davit ve bütün toplar. | ship.js, shipModel.js | GV03 |
| **C-13** kamera duvar içine giriyor | (1) `blocked(q)` → `segmentQuery(f→q, KAMERA, pad: 0,25)`. Slab pad'li, `hullSolid(…, pad)` +0,25. (2) Ada yapılarına **GORSEL** katmanlı ikinci bir kutu eklenir (colK 1,0 + 0,1 m). Hareket kutusu (colK) oynanış hissi için ayrı kalır. (inceleme düzeltmesi) GORSEL kutusu **yalnız KAMERA maskesindedir** (GORUS ve MERMI'de değil). **Açık yapılara** (çadır ve iskele kafesi: islands.js:578, 686, 874, 905) konmaz, çünkü görselleri katı değildir. Odak (baş) bir GORSEL kutusunun içindeyse o kutu sorguda yok sayılır (R7). Bu durumda kameranın duvara girmesini 0,25 m pad ve yakın-kamera silinmesi (nearfade.js) karşılar. (3) Kıskaçlardan sonra (camera.js:132-155) son nokta **yeniden** sınanır. Engelliyse odak→nokta doğrusunda ikili arama tekrarlanır. (4) Geri çekme 0,1 m sabiti (119) pad'e devredilir. | camera.js:55-169; islands.js:490-503; physics.js | K13, K14; 15 C01–C05, 17 K04–K09 |
| **C-17** düşüşte platform kaçırma | player.js:588-596: `const y0 = this.pos.y; … this.pos.y += vy·dt; g = groundAt(x, z, Math.max(y0, this.pos.y))`; `vel.y = max(vel.y, −45)`. `lastPlatform` son sorgudan okunur. Yüzme (770) ve düşman/hayvan zemin sorguları da aynı yöntemi kullanır. | player.js:566-613 | YD01–YD04 |

### 7.5 Platform, iskele, bina, kaya ve güverte iyileştirmeleri (istek 8)

* (inceleme düzeltmesi) **Doğrulama boşluğu:** denetim planı (audit_C, istek 8) "her yapı türü için içinden yürünmez testi" istiyordu. İlk sürümde yalnız geçit bağlantısı (DG06) vardı. YP01 eklendi (§10.4).
* **Bina ve ada yapıları:** hareket kutuları görselin %60–90'ı (islands.js:558 0,78; 567 0,6; 570 0,7; 578 0,7; 686 0,75; 700 0,8; 703 0,75; 873 0,8; 874 0,7; 905 0,7; 920 0,75; 945 0,75; 948 0,8). Bilinen #43'e göre oyuncu duvara gömülüyor. Öneri: kapalı yapılarda (ev, kale, kule, kışla, maden) hareket colK 0,92–0,95, açık yapılarda (çadır, iskele kafes) 0,7 kalır. Kamera, görüş ve mermi için GORSEL kutusu 1,0+0,1. Geçitlerin kapanmadığı bir bağlantı testiyle doğrulanır (DG06).
* **İskele ve merdiven:** üst yüzey süpürmesi (C-17). Gemi ve kayık engeli (C-10). Liman merdiveni 0,5 m basamak + 0,6 m pencere (port.js:213-214) korunur.
* **Kaya ve ağaç:** daire yarıçapları (props.js:239 0,5·s; 246 0,45·s; 248 0,42·s) görsel yarıçapla ölçülüp karşılaştırılır (OK02, oran ≤ 1,15). Takılma: resolve köşelerde 3 geçiş yapıyor. Duvara açılı yürürken hız izdüşümü (player.js:594-595) kaymayı sağlıyor. 45° testiyle (DG05) korunur.
* **NPC çarpıştırıcısı:** `n.col.x = t.x` (npcs.js:133, 180) hücre kaydını güncellemiyor. Handa ya da başka bir hücrede NPC çarpıştırıcısı bulunamıyor (crowd yine itiyor). `physics.move(col, x, z)` ile düzeltilir.
* **Güverte:** C-11, C-12, C-09. Güvertede zıplama ve kaçınma sabit adımla FPS'ten bağımsız olur (GV05).
* **İtişmeden sonra resolve:** crowd.js'te itilen dinamik ajanlar için `physics.resolve` çağrılır. Oyuncu ve düşman, kalabalık itmesiyle duvara gömülmez.

---

## 8. Birleşik görüş ve isabet sorgusu

### 8.1 Bugünkü çağıranlar

| Çağıran | Satır | Seçenekler | Sorun |
|---|---|---|---|
| Düşman algısı | enemies.js:555 | Varsayılan (tMin 0,02, tMax 0,98, rScale 0,8) | C-04; oransal pay; platform ve gövde yok |
| `_los` (0,25 sn önbellek) | enemies.js:1015 | Varsayılan | Aynı |
| Düşman mermisi | enemies.js:1531 | PROJ_LOS (77) | Oyuncu önce (C-06) |
| Tabanca | combat.js:295 (+ arazi döngüsü 290-293) | tMin 0,05, tMax 0,98, rScale 1 | Kameradan çıkıyor (C-06) |
| Zıpkın | seagear.js:280 | Varsayılan | C-07 |
| Kamera | camera.js:112 | CAM_LOS + `slabBlocked` + `hullBlocked` + `caveBlocked` | Yarıçap yok (C-13) |
| Gülle | — | Yok | C-05 |

**Ek kusur:** varsayılan uç payları **oransal**. 40 m'de son 0,8 m yok sayılıyor. Node'da hedefin 0,35 m önündeki 0,3 m duvar 40 m'den **görülmüyor** (`lineBlocked = false`, Ek A.2).

### 8.2 `physics.segmentQuery(a, b, opts) → { t, point, kind, collider|ship } | null`

`opts = { mask, pad = 0, startPad = 0, endPad = 0, terrain = true, slab = true, ships = G.ships, skipShip, deckShip, cave = null }`. Metrik uç payları metre cinsindendir. `t` doğru boyunca 0–1 arasındadır.

0. (inceleme düzeltmesi) **Başlangıcı içeren çarpıştırıcı:** `a` noktası bir kutunun ya da dairenin (pad'siz xz izdüşümü ve [y0, y1] bandı) içindeyse o çarpıştırıcı bu sorguda atlanır (R7). Gemi gövdesinde camera.js:78'deki kural aynen kalır. Böylece duvara gömülü oyuncunun gözü, başı ya da namlusu "her yön engelli" durumuna düşmez.
1. **Hücre yürüyüşü:** physics.js:207-250'deki DDA aynen kullanılır. `pad > 0` ise her ziyaret edilen hücrenin 8 komşusu da gezilir (seen kümesi tekrarları süzer; kamera doğruları 1–2 hücre).
2. **xz giriş–çıkış aralığı [t0, t1]:** kutu için yerel uzayda slab testi (yarı boyutlar + pad). Daire için ikinci derece denklemin iki kökü (r + pad). Bugünkü daire testi yalnız en yakın yaklaşma noktasını alıyor ve rScale'i r²'ye uyguluyor (physics.js:225-227). Bu yöntem bırakılır.
3. **Yükseklik (C-04 düzeltmesi):** [t0, t1] uç paylarıyla kırpılır. Doğrunun y'si bu aralıkta doğrusal olduğundan, bandın (y0 − pad, y1 + pad) içine girdiği ilk t analitik olarak bulunur. **Girilmiyorsa engel değildir.** Bugün yalnız tek noktaya bakılıyor (physics.js:243-246).
4. **İlk isabet:** bütün adaylar arasında en küçük t döner (gülle ve mermi için). Görüş için ilk adayda erken çıkılabilir (`first: false`).
5. **Platform (slab):** `slabBlocked` (physics.js:102-117) t döndürecek biçimde genelleştirilir. Kalınlık (top − 0,15 … top) ve pad eklenir.
6. **Gemi gövdesi:** AABB elemesinden sonra doğru gemi yerel uzayına çevrilir (ters matris gemi başına ve sorgu başına bir kez). Gövde kutusunda analitik [t0, t1] bulunur, aralık 0,15 m adımla `hullSolid` ile örneklenir (camera.js:91-96 ile aynı). `skipShip` (dümende kendi gemisi) ve `deckShip` kuralları kameradan taşınır. **Benzetim sorgularında benzetim pozu, kamerada çizim pozu kullanılır.** Ters matris kamerada kare başına, benzetimde adım başına önbelleğe alınır.
7. **Arazi:** `min(1,0, uzunluk/8)` m adımla örnekleme. Engelli ilk örnekle önceki serbest örnek arasında 6 yinelemeli ikiye bölme yapılır (≈ 2 cm). Uçlar uç paylarıyla dışarıda tutulur.
8. **Mağara:** `cave.camE` örneklemesi yalnız `cave` verildiğinde (kamera) yapılır.
9. **Uyumluluk:** `lineBlocked(…, opts)` ince bir sarmalayıcı olarak kalır. `tMin`/`tMax` uzunlukla çarpılıp metreye çevrilir ve geçiş süresince kullanımdan kaldırıldı uyarısı verilir. Yeni kod metrik payları kullanır.

### 8.3 Node doğrulaması (Ek A.2)

| Deneme | Eski `lineBlocked` | Yeni `segmentQuery` |
|---|---|---|
| C-04 örneği (6 m bina, 12 m'den eğik doğru) | a→b **false**, b→a true | a→b true (t=0,522), b→a true (t=0,125) |
| 4 000 rastgele eğik doğru × kutu/daire (mermi seçenekleri), 1 cm kaba kuvvetle karşılaştırma | **20 asimetrik, 15 yanlış** | 0 asimetrik, 0 yanlış; ilk isabet konum hatası ≤ 0,010 m |
| pad = 0,25, 300 doğru (şişirilmiş kaba kuvvet) | — | 0 uyumsuz |
| 40 m, hedefin 0,35 m önünde 0,3 m duvar | Görülüyor (false) | Engelli (`endPad` 0,3 m) |
| Zıpkın, 0,4 m'lik parçalar, 400 konum | **16 kaçırma** | 0 kaçırma |
| DDA tamlığı: 3 000 rastgele doğru ≤ 600 m, 5 cm örneklemeyle bulunan hücreler | 0 eksik (en çok 54 hücre) | Aynı DDA |

**DDA doğrulaması:** v0.4'teki Amanatides–Woo yürüyüşü (physics.js:207-250) doğru ve tam çalışıyor. 64 hücre erken dönüşü yok, yalnız 4 096 hücrelik bir güvenlik sınırı var (213). Uzun doğruda maliyeti arazi örneklemesi belirler: 400 m'de 267 `heightAt` çağrısı. İyileştirme olarak önce çarpıştırıcılar sınanır, arazi sonra örneklenir (erken çıkışta tasarruf). 03 #6'nın çapraz sürümü C-18 kapsamında eklenir (§10.6).

### 8.4 Çağıranların geçişi

| Çağıran | Yeni çağrı |
|---|---|
| `_perceive` | `segmentQuery(göz, hedef göğsü, { mask: GORUS, startPad: 0.3, endPad: 0.35, first: false })`. (inceleme düzeltmesi) Hedef noktası bugünkü gibi kalır: `t.pos.y + (çömelme ? 0,9 : 1,4)` (enemies.js:555). "Göğüs" adıyla bir değişiklik yapılmaz, çünkü gizlenme dengesi bu yüksekliklere ayarlı. A4'te `mask: HEPSI` (birebir), A5'te `GORUS`. |
| `_los` | Aynı (önbellek 0,25 sn korunur) |
| Düşman mermisi | `q = segmentQuery(prev, pos, { mask: MERMI })`. Oyuncu kapsülü için `segSegDist` s parametresi `tP` hesaplanır (enemies.js:1666-1684'e s döndürme eklenir). `q && q.t < tP` ise isabet duvardadır. |
| Tabanca | (1) Nişan noktası: kameradan 80 m ışınla hedef, statik ve arazi isabetlerinden en yakını. **Kamera–oyuncu arasındaki hedefler atlanır:** `proj > dot(baş − kamera, yön) + 0,3`. (2) Namlu→nişan noktası `segmentQuery(MERMI, startPad 0,1)`. Engel nişan noktasından önceyse isabet engele yazılır (kıvılcım). Arazi döngüsü (290-293) kaldırılır. |
| Zıpkın | ADIM'a taşınır: `seagear.step(h)` → `_flySpear(h)`. `segmentQuery(prev, pos, { mask: MERMI })`. Balık ve savaş hedefi t'leriyle karşılaştırılır. |
| Gülle | §7.4 C-05 |
| Kamera | §7.4 C-13 |
| `findCover` (enemies.js:1388-1404) | Değişmez (siper adayları dairelerden). Siperin görüşü kestiği yeni sorguyla doğrulanabilir (isteğe bağlı). |

---

## 9. Dosya bazında değişiklik listesi ve uygulama sırası

### 9.1 Uygulama sırası

Her adım ayrı bir commit'tir. Her adım kendi testleriyle doğrulanır ve ardından tam regresyon koşulur. A1–A3 bayrak arkasında gelir (`G.loopMode = 'sabit' | 'eski'`, `?dongu=eski`). Bayrak A11'de kaldırılır. (inceleme düzeltmesi) A2 sonrası kod eski döngüde de çalışmalıdır. Eski döngüde çizim evresi `alpha = 1`, `rdt = dt` ile çağrılır, poz takası yapılmaz. Çift döngü bakımının yükü yüzünden bayrak, A3'ün regresyonu geçince kaldırılabilir; A11'i beklemek gerekmez.

(inceleme düzeltmesi) Sıra değişiklikleri: **A4 ↔ A5 yer değiştirdi** (katmanlar segmentQuery'den önce gelir, maskeler ancak katman bitleri varken anlamlıdır). **Oyuncunun yatay koruyucu ilerlemesi A6'dan A1'e** taşındı (§6). **A2, A2a ve A2b'ye bölündü.** **A10 daraltıldı** (§5.2, K9).

| Adım | Amaç | Dosyalar | Doğrulama |
|---|---|---|---|
| **A0** | Ölçüm altyapısı. Kod davranışı değişmez. | main.js (DK.frames, simSteps, resetClock, onStep, syncRender), 03_fizik_dt.js beklentili, 18_fps_dususu.js, tests/node/fizik_dongu.mjs, tests/node/gorus_sorgu.mjs (Ek A betikleri) | Yeni beklentiler **eski döngüde kalmalı** (FD01–FD07: 45/59,94/90/120/144). Node testleri eski kodda C-04/C-07'yi yakalamalı. (inceleme düzeltmesi) Kancaların eski döngüdeki anlamı tanımlanır: `onStep` her alt adımda çağrılır (h ≠ STEP olabilir), `resetClock` `acc` yoksa yalnız `playTime`/`ocean.time`'ı kurar, `syncRender` boştur. `physics.js` düz Node'da yüklenmez (terrain.js → 'three', `ERR_MODULE_NOT_FOUND`). `gorus_sorgu.mjs` bir çözüm kancası kullanır: `module.register` ile `./terrain.js` → sahte arazi (Ek A.6'da doğrulandı). `fizik_dongu.mjs` kopya modeline havada geri tepme dalı eklenir (§6). |
| **A1** | Biriktiricili döngü, girdi tamponu, `takeLook`, C-02, C-03, N-01, `Timer.connect`, istem olayı karede, ~~uyarlanır bütçe~~, **C-17 dikey süpürme**, (inceleme düzeltmesi) **oyuncunun yatay koruyucu ilerlemesi**, `DK.sim` parçalama, `stats.kirpilan` | engine.js, game.js, input.js, shipControl.js, interact.js, player.js:566-613 (inceleme düzeltmesi: ve 586-595), main.js (`DK.sim`) | (inceleme düzeltmesi) FD01–FD05, FD07 (benzetim durumu; **FD06 A3'e kadar geçemez**, çünkü esinti duvar saatine bağlı, N-03), FS01–FS08, YD01–YD04, **HH01** (0,2 m ve 0,4 m duvar), 03_fizik_duzeltmeler. 144 Hz'de çizim titrer (ara değerleme A2'de), bu yüzden varsayılan "eski" kalır. |
| **A2a** | (inceleme düzeltmesi) Çekirdek çizim ayrımı: `core/interp.js`, `game._render`, oyuncu (render, IK, `rpos`), gemi poz takası (O(1) kök biçimi) ve `_animate`, kayık (poz takası, kürekler), kamera (`rpos`, dümen kipi ara poz, su `renderTime`), C-08 sırası ve `collideAll` sonrası kök yenileme | interp.js, game.js, player.js, ship.js, camera.js | FD09, FS09 (oyuncu ve gemi), GV01, GV02, 04 C08, 17 K04–K06 |
| **A2b** | (inceleme düzeltmesi) Kalan varlıkların çizim ayrımı: bodies, effects (`b.pos`, parçacık), enemies, animals, megafauna, bosses, events, treasure (taşınan ve kayıktaki sandık), seagear. Uzak varlık yumuşatması (`_interp`, `RemotePlayer.update`) çizim evresine. **Varsayılan "sabit" olur.** | listelenen dosyalar | FS09 (bütün karakterler), 16, 14, coop 06b/06d |
| **A3** | Ortam saati: `ocean.time` adımda, `sky.stepPhysics` (esinti `simTime` = `game.playTime`'dan), `weatherfx.step` (N-02), su `uTime = renderTime`, (inceleme düzeltmesi) menüde kare saati | ocean.js, sky.js, weatherfx.js, game.js `_env` | FD06 gemi ≤ 1 cm (aynı adım sayısı), 07 D03/D07/D08, 15 C04 |
| **A4** | (inceleme düzeltmesi; eski A5) Katmanlar (davranışı koruyan yeniden düzenleme), `physics.move`, NPC. `noCam` → BITKI/INCE/NPC **ataması** (§7.3). Bütün mevcut çağıranlar `MASK.HEPSI`. | physics.js, props.js, port.js, islands.js, cave.js, hazards.js, details.js, npcs.js | Tam regresyon birebir. gorus_sorgu.mjs maske denemeleri. (inceleme düzeltmesi) Ağaç, palmiye ve direk çemberlerinin HAREKET'te kaldığını sınayan Node denemesi. |
| **A5** | (inceleme düzeltmesi; eski A4) `segmentQuery` (R7 başlangıç kuralı dahil) + çağıranlar: C-04, C-05, C-06, C-07; zıpkın adıma. Maske daraltmaları (GORUS, MERMI) burada bilinçli değişiklik olarak gelir. | physics.js, enemies.js, combat.js, seagear.js, effects.js, camera.js (yalnız API) | gorus_sorgu.mjs, 05 + AI-C04/C06, GN01–GN06, 14 G02–G05. (inceleme düzeltmesi) Duvara gömülü oyuncu görülebilir ve vurabilir (R7). |
| **A6** | C-16 (LOD koruyucu ilerleme), C-15 (hayvan basamak ve yerçekimi), yatay koruyucu ilerleme (~~oyuncu,~~ düşman, cisim; inceleme düzeltmesi: oyuncu A1'de) | enemies.js:1072-1124, 1597-1606; animals.js:556-631; bodies.js | HH02–HH05, 05 F-08, 16 A01 |
| **A7** | Güverte: C-12, C-11, C-09 (a: güverte yükü; b: bodies güverte zemini). (inceleme düzeltmesi) Güverte yükünün kaydı ve yüklemesi; kova istasyonu kısıtı | shipModel.js, ship.js:184-196, crowd.js, treasure.js:120-126, 377-418, bodies.js | GV03 (bütün istasyonlar), GV04, SD02, SD03, (inceleme düzeltmesi) SD06, 16 T04/T10, coop 06b H03, 06d C05, 08_kalicilik, 12_kayit_dongusu |
| **A8** | C-10 gemi ve kayık × statik + dock | ship.js | MI04, MI05, 03 #8/#9 |
| **A9** | C-13 kamera pad'i, GORSEL kutuları (yalnız kamera, kapalı yapılar), yeniden sınama; hareket colK güncellemesi (ayrı alt commit) | camera.js, islands.js, physics.js | K13, K14, DG06, (inceleme düzeltmesi) YP01, 15 C01–C05, 17 K04–K09 (özellikle K07 medyan ≥ 0,9 m) |
| **A10** | Ağ: ~~`ts`, `seq`, saat eşleme, ara değerleme tamponu,~~ hit-stop çevrimiçi kuralı. (inceleme düzeltmesi) Tampon ve zaman damgası Faz 5'e kaldı (K9). Yumuşatmanın çizime taşınması A2b'de yapıldı. | game.js | Bütün coop senaryoları, 06b F-12 (zıplayan konuk havada), 06c D4-05 |
| **A11** | Belgeler (08_FIZIK_RAPORU §8.6, katman tablosu, 12. belge), bayrağın kaldırılması, 25 senaryo + yenilerinin tam koşusu | docs/, tests/ | Tam regresyon |

### 9.2 Dosya → değişiklik

| Dosya | Değişiklik | Adım | Sorun |
|---|---|---|---|
(inceleme düzeltmesi) Tablo yeni adım numaralarına göre güncellendi: A4 = katmanlar, A5 = segmentQuery, A2 → A2a/A2b, A10 daraltıldı.

| Dosya | Değişiklik | Adım | Sorun |
|---|---|---|---|
| js/core/engine.js | `timer.connect(document)`; kırpılan süre sayacı (62) | A1 | §2.3 |
| js/game/game.js | 185-238 yeniden: biriktirici, `_render`, sıra, `onStep`, `resetClock`, `syncRender`, `stats` (`kirpilan` dahil), `frameClock`; ~~uyarlanır bütçe~~; `_camera` → `p.rpos` ve dümen kipinde gemi ara pozu (316), dürbün (278), gizleme mesafesi (373); `_env` ikiye (adım ortamı ve çizim ortamı), çizim ortamında `heightAt(…, renderTime)`; `time.update` tek çağrı; hit-stop çevrimiçi kuralı | A1–A3, A10 | C-01, C-02, C-08, C-14 |
| js/core/input.js | `stepEdges`, `beginFrame`, `endStep`, `inStep`, `takeLook(frameDt)`, pad kenarları, blur temizliği; `subframe` kaldırılır | A1 | C-01, C-03, N-01 |
| js/main.js | DK kancaları; updater sırası aynı. (inceleme düzeltmesi) `DK.sim` dt > 0,1 parçalaması (A1) | A0, A1 | C-18 |
| js/core/interp.js (yeni) | İzleyiciler | A2a | §2.5 |
| js/player/player.js | `update` = benzetim; `render(alpha, rdt)` = 393-416 + IK; `prevPos`, `rpos`; dikey süpürme ve son hız; `_visDY` çizime; (inceleme düzeltmesi) yatay koruyucu ilerleme (586-595, A1) | A1, A2a | C-08, C-14, C-17 |
| js/player/camera.js | `segmentQuery(KAMERA, pad)`, yeniden sınama, `hullSolid(pad)`; (inceleme düzeltmesi) su kıskacında `renderTime` (A2a) | A2a, A9 | C-13 |
| js/ship/ship.js | `beginSim`, `applyRenderPose` (O(1) kök), `prevPose`; `_animate` çizime; `simToLocal`, `simToWorld`; `_statics`; `clampDeck` + `deckObstacles`; kayık poz takası ve kürekler çizime; (inceleme düzeltmesi) `collideAll` sonrası kök yenileme; `cannonWorld` öncesi `updateWorldMatrix(true, false)` | A2a, A7, A8 | C-08, C-10, C-12, C-14 |
| js/ship/shipModel.js | `deckObstacles` verisi (kapak yarı boyu + pay ≤ 0,85) | A7 | C-12 |
| js/world/bodies.js | İç bölme kaldırılır; `prevPos`, `prevQuat`; çizim; koruyucu ilerleme; güverte zemini | A2b, A6, A7 | C-09 |
| js/game/effects.js | `b.pos`; gülle sorgusu ve analitik gemi; parçacıklar çizime | A2b, A5 | C-05, C-14 |
| js/game/combat.js | Tabanca namlu ve kamera tarafı; raycast yeni sorguyla; arazi döngüsü kalkar | A5 | C-06 |
| js/game/enemies.js | Görüş sorgusu; mermi sırası; LOD koruyucu ilerleme; `char.update` çizime; mermi örgüsü lerp; `_interp` çizime | A2b, A5, A6 | C-04, C-06, C-14, C-16 |
| js/wildlife/animals.js | Basamak (yalnız platform), yerçekimi; animasyon çizime; `_interp` çizime | A2b, A6 | C-15 |
| js/wildlife/megafauna.js, js/game/bosses.js, js/world/hazards.js, js/game/events.js | Görsel kısımlar çizime; izleyiciler | A2b | C-14 |
| js/game/crowd.js | Güverte yerel ajanları; itmeden sonra resolve | A7 | C-11 |
| js/game/interact.js | İstem olayı karede | A1 | C-14 |
| js/game/shipControl.js | `aimInput(look)` karede | A1 | C-03 |
| js/wildlife/seagear.js | `step(h)`: zıpkın ve ağ uçuşu; sorgu; ip çizimi; (inceleme düzeltmesi) atış noktası benzetim konumundan | A5 | C-07 |
| js/treasure/treasure.js | Sandık fiziği adımda; taşınan ve kayıktaki sandık çizimde; dolu ambar → güverte yükü; `stowInHold` yalnız `G.ship`; (inceleme düzeltmesi) güverte yükünün kaydı ve yüklemesi (120-126) | A2b, A7 | C-09 |
| js/world/physics.js | LAYER, MASK (`HEPSI` dahil), `m` alanı, `segmentQuery` (R7 başlangıç kuralı), `lineBlocked` sarmalayıcısı, `resolve(mask)`, `move`, slab t'si | A4, A5 | C-04 – C-07, C-13, C-18 |
| js/world/ocean.js | `time` adımda; `renderTime` uniformu; menüde kare saati | A3 | N-03 |
| js/world/sky.js | `stepPhysics(h)`: rüzgâr, esinti (`simTime` = `playTime`), dalga, gelgit; görsel `update(rdt)` | A3 | N-03 |
| js/world/weatherfx.js | `step(h)`: hortum kuvveti | A3 | N-02 |
| js/world/islands.js | GORSEL kutuları (yalnız kapalı yapılar, yalnız kamera); hareket colK; katmanlar | A4, A9 | C-13, #43 |
| js/world/props.js, port.js, cave.js, details.js, hazards.js | Katman bitleri (`noCam` → BITKI/INCE ataması) | A4 | §7 |
| js/game/npcs.js | `physics.move` (133, 180) | A4 | §7.5 |
| ~~js/net/net.js, js/net/interpBuffer.js (yeni)~~ | ~~`ts`, `seq`, tampon, çizim zamanı~~ (inceleme düzeltmesi) Faz 5'e kaldı; Faz 3'te net.js'de yalnız `RemotePlayer.update`'in çizim evresine taşınması (A2b) | A2b | §5 |
| tests/… | §10 | A0+ | C-18 |
| docs/08_FIZIK_RAPORU.md | §8.6 güncel döngü; katman tablosu | A11 | — |

---

## 10. Test planı

### 10.1 Ölçüm ilkeleri

* **Birincil ölçüt: benzetim durumu aynı adım sayısında.** Girdiler aynı adımlara düştüğü için beklenen fark 0'dır. Eşik **≤ 1 mm** (kayan nokta payı).
* **İkincil ölçüt: çizilen konum aynı duvar süresinde** (kare süreleri toplamı = T). Eşik **≤ max(5 cm, %1)**. 59,94 Hz için toplam süre farkı adım sayısına çevrilerek karşılaştırılır.
* Her ölçümden önce `DK.game.resetClock(t0)`, `sky.setWeather('acik', true)`, sabit rüzgâr yönü ve aynı başlangıç durumu ayarlanır. Tepe değerleri, havada adım sayısı ve gömülme gibi ölçümler `onStep` kancasıyla adım başına alınır (kare örneklemesi değil).
* FPS kümesi: **15, 30, 45, 59,94, 60, 90, 120, 144** (kullanıcının 15/30/60/120'si + denetimin ekledikleri).

### 10.2 03_fizik_dt'nin beklentili sürümü

Döngü `DK.frames(kare dizisi)` ile sürülür. **Sistemlere doğrudan çağrı yapılmaz** (03_fizik_dt.js:47'deki yapaylık kalkar).

| No | Ölçüm | Girdi | Eşik |
|---|---|---|---|
| FD01 | Yürüme 3 sn yatay yol | W basılı, düz liman meydanı (−60, 120) | Bütün FPS'ler 60 FPS referansından ≤ 1 mm (aynı adım); çizim ≤ 5 cm |
| FD02 | Sprint 3 sn | Shift+W | Aynı |
| FD03 | Zıplama tepesi (adım başına en yüksek) ve havada adım sayısı | Boşluk, ilk karede | Tepe 1,183 m ± 1 mm; havada adım sayısı birebir |
| FD04 | Kaçınma 1,2 sn | V+W | ≤ 1 mm |
| FD05 | Geri tepme (10 ve 60 hasar) | `p.hurt` | ≤ 1 mm. Bugünkü 03 #3'ün %20 eşiği bunun yerine geçer. |
| FD06 | Gemi 12 sn yol, son hız, 8 sn dönüş | Tam yelken, sabit hava, `resetClock(1000)` | ≤ 1 cm ve ≤ 0,05° (A3 sonrası) |
| FD07 | Cisim düşüşü 4 sn (−60, 20, 120), vx=3 | Oyun döngüsüyle. (inceleme düzeltmesi) Oyuncu ve düşmanlar 10 m'den uzak tutulur; crowd her adımda cisimleri itiyor (crowd.js:43-44). Taban koşusunda cisim y ≈ 11,4'te durup −x'e sekiyor (taban 03_fizik_dt.json), yani bir yapıya çarpıyor: ölçüm bu çarpmayı da içerir. | ≤ 1 mm |
| FD08 | Gülle menzili (sabit hava, 58 m/s, 10° yükseliş) | `effects.cannonball` | Suya değme noktası ≤ 1 cm |
| FD09 | Çizilen kök konumu, T=3,000 sn duvar süresinde | FD01 | ≤ max(5 cm, %1) |

### 10.3 Ani FPS düşüşü (`18_fps_dususu.js`)

Kare dizileri (ms): **D1** 60×16,67 + **250** + 120×16,67. **D2** 16 / 50 dönüşümlü. **D3** ~~8–100 ms~~ (inceleme düzeltmesi) **8–250 ms** rastgele (tohum 42; denetim planındaki aralık; 0,1'i aşan kareler kırpılır). **D4** 5 sn boyunca 125 ms (8 FPS). **D5** 144 Hz + adımsız karede tuş. **D6** 16,6–16,9 ms titreşim, 59,94 Hz, 0,1 ms'ye yuvarlanmış damgalar.

| No | Kontrol | Eşik |
|---|---|---|
| FS01 | D1–D3'te koşu ve zıplama durumu, aynı adım sayısında 60 FPS referansıyla aynı | ≤ 1 mm |
| FS02 | Her adımın boyu STEP, kare başına adım ≤ 6 | Kesin |
| FS03 | D1 ve D4'te düşen ya da kırpılan zaman = Σ max(0, kare − 0,1) | ≤ 1 ms. (inceleme düzeltmesi) `stats.kirpilan` (§2.2) ile ölçülür. İlk sürümde bu kırpma sayılmıyordu; yalnız acc taşması (`dropped`) sayılıyordu. |
| FS04 | D5: adımsız karede basılan zıplama **tam bir kez** yürür. Gecikme ≤ 1 STEP. | Kesin |
| FS05 | D1–D4 boyunca her adımda `p.pos.y − groundAt(x, z, y+0,6) ≥ −0,02` (zemine gömülme yok); iskele kenarı ve yamaçta da. (inceleme düzeltmesi) `groundAt(x, z, y+0,6)` ayağın 1,2 m üstüne kadarki platformu sayar (physics.js:87-92; iskele kenarında yanlış "gömülme") ve `lastPlatform` yan etkisi vardır. Ölçüm `floorAt(x, z, y + 0,05)` (physics.js:121, yan etkisiz) ile yapılır. | Kesin |
| FS06 | D3 sırasında ince duvara (0,4 m) koşu: duvar delinmez | 20/20 |
| FS07 | D6: ortalama adım/kare 1,00 ± 0,02 (C-02) | |
| FS08 | Top nişanı: mouseDX=100, 1/10, 1/15, 1/30, 1/60, 1/144 karelerinde aynı `cannonYaw` değişimi (C-03); gamepad dönüşü FPS'ten bağımsız (N-01) | ± %1 |
| FS09 | `game.update(1/15)` sonrası `Character.update`, `Ship._animate` ve parçacık yazımı karakter ya da gemi başına **1 kez** (sayaçla, C-14) | Kesin |

### 10.4 Kullanıcı testleri

| Kullanıcı testi | Senaryo / kontrol | Ölçüm | Eşik |
|---|---|---|---|
| 15/30/60/120 FPS | 03_fizik_dt FD01–FD09 | §10.2 | ≤ 1 mm (benzetim), ≤ max(5 cm, %1) (çizim) |
| Ani FPS düşüşü | 18_fps_dususu FS01–FS09 | §10.3 | §10.3 |
| Çok hızlı hareket | **19_hizli_hareket**: HH01 geri tepme k=7 ile (inceleme düzeltmesi: **gerçek kod yolu**, `p.hurt(≥46)` ile havaya kalkarak; ayrıca koşu yönünde vurulma) **0,2 m** (denetim planı) ve 0,4 m kutuya ve r 0,15 direğe 20 faz; HH02 kaçınma ile **0,2 m** duvar; HH03 40 m/s cisim → iskele platformu; HH04 LOD'lu düşman (0,25 sn) 0,3 m duvara 20 deneme (C-16); HH05 domuz iskele kenarında (C-15) | Delinme sayısı; adım başına yukarı sıçrama | 0/20; 0/20; platform üstünde kalır; 0/20; ≤ 0,7 m sıçrama, 0,65 m'den yüksek platforma yandan çıkılmaz |
| Dar kapılar | **20_dar_gecit**: DG01 iki kutu arası 0,70/0,80/0,90/1,00/1,20 m geçit, oyuncu (r 0,33); DG02 düşman (r 0,42) ve takılınca sapma; DG03 tapınak kapısı açılınca (islands.js:810-816); DG04 hapishane hücre kapısı (952); DG05 duvara 45° koşuda kayma hızı; DG06 kasaba halkası geçitleri açık (colK değişikliği sonrası); (inceleme düzeltmesi) **DG07 iç köşe**: 90° ve 60° açılı iki kutunun birleşimine 8 yönden koşu, oyuncu ve düşman (denetim planı, istek 7) | Geçiş süresi; takılma (girdi varken hız < 0,3 m/s süresi); kayma hızı; (DG07) köşede ardışık adımlar arası konum salınımı ve gömülme | ≥ 0,70 m'de oyuncu geçer ve takılma ≤ 0,2 sn; düşman ≥ 0,90 m'de geçer, daha darda ≤ 3 sn'de sapar; kayma ≥ 2,5 m/s (4,4·sin45 = 3,1); (DG07) gömülme ≤ 0,02 m, salınım ≤ 0,01 m, girdi bırakılınca serbest |
| (inceleme düzeltmesi) Yapı türleri | **YP01** (denetim planı, istek 8): her yapı türü için (ev, kale, kule, kışla, maden, değirmen, kuyu, çadır, mezar, mahzen, sütun, çit, liman binası, tezgâh, fener) 8 yönden 3 sn duvara koşu | Oyuncu merkezinin görsel sınır kutusuna göre içeri girme derinliği (kapalı yapı: görsel AABB; açık yapı: hareket kutusu) | Kapalı yapıda ≤ 0,05 m (colK sonrası), açık yapıda hareket kutusuna gömülme 0; bilinen #43 bu testle kapanır |
| Ağaçlar ve kayalar | **21_orman_kaya**: OK01 orman adasında 8 yön × 2 hız × 6 sn koşu; OK02 çarpıştırıcı / görsel yarıçap oranı; OK03 kamera (17 K08 + pad) | Çember içine girme (> 2 cm) adım sayısı; toplam takılma; yarıçap oranı | 0; ≤ 0,5 sn/koşu; ≤ 1,15 |
| Merdivenler | **22_merdiven_iskele**: MI01 liman merdiveni (port.js:213-214) 15/60/144 FPS; MI02 ada iskelesi basamakları (islands.js:650-664); MI03 gemi merdiveni `startClimb` dalgada (player.js:955-983, bugün testsiz); (inceleme düzeltmesi) **MI06 basamakta zıplama** (denetim planı): liman ve ada merdiveninde her basamakta yerinde ve ileri zıplama, 15/60/144 FPS | Tepeye çıkış, kip değişimi, süre; (MI06) inişte basamağa oturma, basamak yan kutusuna (port.js:214) takılma | Her FPS'te çıkılır; ≤ 1 kip değişimi; tırmanma 1,6 sn ± 1 STEP; (MI06) her inişte bir basamağa oturur, gömülme ≤ 0,02 m, düşme hasarı 0 |
| İskeleler | MI04 gemi 5 m/s ve kayık 3 m/s iskeleye çarpar (C-10); MI05 demirli gemi 60 sn; 15 I01–I07 korunur | İçeri girme; `crash` olayı; konum sapması | ≤ 0,3 m ve olay var; std < 2 cm, `crash` 0 |
| Gemi güvertesi | **23_guverte**: GV01 11 m/s seyir ve fırtına yalpasında oyuncu–güverte noktası farkı (çizim) 1/45, 1/60, 1/144 (C-08); GV02 dümende el–tutamak; GV03 top, dümen, kapak (C-12) (inceleme düzeltmesi: ve bütün istasyonlarda (helm, anchor, sails, hold, bucket, map, davit, toplar) oyuncunun itilmediği); GV04 bordalamada itişme (C-11); GV05 güvertede zıplama ve kaçınma FPS bağımsız; GV06 pad'li kamera K04 | Mesafeler | < 0,01 m; < 0,03 m; merkeze ≥ nesne r; ≥ r1+r2−0,05; ≤ 1 mm; ihlal 0 |
| Düşen ve taşınan sandıklar | **24_sandik**: SD01 kumsal, iskele, su, platform kenarına bırakma, 15–144 FPS; SD02 dolu ambarla güverteye bırakma (C-09); SD03 düşman gemisine bırakma; SD04 taşınan sandık taşıyıcının çizim konumunu izler; SD05 konukta sandık (A10); (inceleme düzeltmesi) **SD06** güverte yükü kayıt → yükleme döngüsü (kaybolmaz, güverteden düşmez; 12_kayit_dongusu ile) | Son konum farkı; güverte yerelinde kayma; izleme hatası | ≤ 1 cm (aynı adım); 30 sn'de < 0,1 m; kaybolmaz; ≤ 5 cm |
| Yüksekten düşme | **25_yuksek_dusme**: YD01 düz zeminde 7/10/20 m; YD02 iskele (2,25), sunak, T başlığına 30/40/60/80 m, her H için 20 faz; YD03 suya 30 m; YD04 FPS 10/30/60/144 | Hasar = (düşüş − 7)·7; platformda kalma; su hasarı | ± 0,5 HP; **20/20** (bugün %5–33 kaçırma, Ek A.3); 0 |
| Hızlı gülle ve fiziksel nesneler | **26_gulle_nesne**: GN01 deniz kayalığı, liman binası, fener, iskele ve kale duvarı arkasındaki gemiye 20 atış (C-05); GN02 açık yolda isabet oranı; GN03 120 m/s gövde (03 #11); GN04 patlama itkisi ≤ 14 m/s ve enkaz iskeleden düşmez; GN05 zıpkın kayadan geçmez (C-07); GN06 duvar ve oyuncu aynı parçada (C-06) | İsabet sayısı | 0/20; değişim ≤ %5; isabet; ≤ 14 m/s ve 0 düşme; 0/20; isabet duvarda |
| Görüş | 05_dusman_ai ekleri: AI-C04 12 m yükseklikteki düşman bina arkasını görmez; AI-C06a küpeşte arkasındaki çömelmiş oyuncu görülmez ve vurulmaz (inceleme düzeltmesi: **atıcı alçakta**, ör. suda ya da kayıkta, göz güverte düzleminin altında. Aynı yükseklikteki atıcı için beklenti tersine "görülür" olur, çünkü hedef noktası güverte+0,9 küpeşteden (+0,8) yüksektir. İki durum da sınanır); AI-C06b iskele altındaki düşman üstteki oyuncuyu görmez; AI-C06c namlu–hedef doğrusu duvarla kesiliyorsa isabet yok; AI-C06d kamera ile oyuncu arasındaki düşman vurulmaz; (inceleme düzeltmesi) **AI-R7** duvara 0,3 m gömülü (bilinen #43) ya da saçak altındaki oyuncu açık alandaki düşmanca görülür ve oyuncunun tabancası açık hedefi vurur (başlangıç kuralı, R7) | Doğru/yanlış | Hepsi geçer |
| Kamera | 17_kamera_kararma K13: 6 ada yapısı × 2 eğim × 48 açı, kamera ve yakın düzlemin 4 köşesi görsel sınır kutusunun dışında (C-13). K14: kıskaçlardan sonra son nokta engelli değil. | İhlal sayısı | 0 |

### 10.5 Node birim testleri (tarayıcısız, hızlı)

* `tests/node/fizik_dongu.mjs`: Ek A.1 modeli; eski ve yeni döngü, kare dizileri, girdi tamponu, düşen zaman.
* `tests/node/gorus_sorgu.mjs`: Ek A.2 ve A.5. physics.js gerçek modülü sahte arazi (`heightAt → −100`) ile yüklenir. 4 000 rastgele doğru, simetri, pad, metrik pay, zıpkın, DDA, 204 m çapraz doğru (C-18), maskeler. (inceleme düzeltmesi) Yükleme yolu: `physics.js` → `terrain.js` → `'three'` zinciri düz Node'da `ERR_MODULE_NOT_FOUND` verir. `tests/node/hooks.mjs`'te bir `resolve` kancası (`./terrain.js` → sahte modül, gerekirse `'three'` → `vendor/three/three.module.js`) ve `node:module` `register()` kullanılır. Ek A.6'da Node 22'de doğrulandı. Ayrıca katman denemesi: `noCam` çemberler HAREKET maskesinde kalır (§7.3), R7 başlangıç kuralı.

### 10.6 Mevcut testlerde değişecekler

| Test | Etki | Yapılacak |
|---|---|---|
| 03_fizik_duzeltmeler #1 (`lastSubsteps` 4/1/6) | Anlam "kare başına yürütülen adım" olur | `resetClock()` sonrasında 1/15 → 4, 1/60 → 1, 0,1 → 6, ayrıca 0,25 → 6 + kırpılan 0,15 |
| 03 #3 geri tepme %20 | Birebir olur | FD05'e taşınır |
| 03 #6 (eksene paralel 400 m) | Eski hatayı ayırt etmiyor (C-18) | 204 m çapraz doğru eklenir |
| 03 #11 `effects.update(0.1)` + elle eklenen `{m, vel}` | `b.pos` yok | Uyum: `b.pos ??= b.m.position.clone()`; ya da test güncellenir |
| 03_fizik_dt | Ölçüm → beklentili | §10.2 |
| 04 C08 (IK) | IK çizim evresinde | DK.sim çizimi de koşturduğu için geçer; gerekirse `syncRender` |
| 05 F-08 (`_lodAcc` 0,2 + `enemies.update(1/60)`) | LOD birikim anlamı korunur, hareket parçalanır | Değişmeden geçmeli |
| 14 G02–G05 (zıpkın) | Adıma taşınma ve slab. G05'te iskeleden atış güverte düzlemini ancak izdüşüm içinde keser. | Geçmeli; G05'in atış açısı gözden geçirilir |
| 15 C01–C05, 17 K04–K09 | Kamera pad'i mesafeleri kısaltabilir | K07 "medyan ≥ 0,9 m" ve C02 "kamera–baş > 3 m" izlenir |
| 16 T04, T07, T10 | Cisim ve güverte | Geçmeli |
| 09_performans | `simMsPerFrame` (60 × `update(1/60)`) | Ek ölçüm: `update(1/15)`, adım ms, ~~`maxSteps`~~ (inceleme düzeltmesi: uyarlanır bütçe yok), poz takasının kare başına maliyeti (gemi sayısı × ms) |
| 10_uzun_oturum U03 | Benzetim maliyeti (görseller kare başına 1 olunca azalır) | — |
| coop 06b F-12, 06c D4-05 | Uzak oyuncu tamponu (D = 0,1 sn) | Bekleme süreleri D'yi kapsıyor (tick 0,2 sn adımlarla). (inceleme düzeltmesi) Bu gerekçe duvar saatine bağlı eşlemede tutmuyordu: gecikme makine hızına göre 0,48 s … −0,12 s arasında oynardı (Ek A.6). Faz 3'te tampon yok. Yumuşatma çizim evresinde `frameDt` ile koştuğu için davranış bugünküyle aynıdır. Faz 5'te tampon kare saatiyle gelir (gecikme sabit ~0,12 s). |
| (inceleme düzeltmesi) Çizim/benzetim karşılaştıran testler | `DK.sim` sonunda alpha = 0, çizim 1 adım geride (§2.5) | 04 C07/C08, 15, 16, 17'de baş, kamera ve kemik ölçümleri ya `syncRender()` sonrası alınır ya da 1 adımlık pay tanınır |
| (inceleme düzeltmesi) v03/full.js:17, full2.js:17 | `DK.sim(need, 0.25)` | Parçalama kuralıyla (§4.3) değişmeden geçer; parçalama yapılmasaydı sürenin %40'ı ilerlerdi |

---

## 11. Riskler

| # | Risk | Etki | Önlem |
|---|---|---|---|
| R1 | **Oynanış hissi:** 120/144 Hz oyuncularında zıplama tepesi 1,214/1,219'dan 1,183 m'ye iner (%−2,5 ile %−2,9), geri tepme %+11, kaçınma %+1,7 olur. Ulaşılabilir yükseklik ~1,78 m'ye sabitlenir. | 1,8 m'ye yakın engellere zıplayarak çıkılan yerler yüksek Hz'de zorlaşabilir | Seviyelerin 60 Hz'de tasarlandığı varsayılır. Zıplanabilirlik denetimi: 1,7–1,85 m'lik platform ve kaya listesi. Gerekirse zıplama hızı 7,4'ten 7,5'e çıkarılır (ayrı karar). |
| R2 | Görsel gecikme +1 STEP (16,7 ms), girdi gecikmesi ≤ 1 STEP | Hızlı nişanda his | Nişanda çizilen yaw kameraya kenetlenir. Kamera dönüşü zaten kare başına. (inceleme düzeltmesi) İki gecikme toplanır: en kötü durum ≈ 2 STEP (33 ms), ortalama ≈ 1 STEP (§2.5). FS04'e "girdiden çizilen tepkiye ≤ 2 STEP" ölçümü eklenir. |
| R3 | Ara değerleme hataları: ışınlanma bulaşması, kip değişimi, poz takası unutulursa yanlış matris, kare dışı olay işleyicileri ara pozu görür, gemi `rebuild()` yeni kök | Görsel sıçrama; yanlış konumda isabet | Sıçrama eşikleri ve `interp.snap`; `simToLocal` yardımcıları; `rebuild` sonrası izleyici yenileme; GV01/FD09 testleri |
| R4 | **Performans:** düşük FPS'te 4–6 adım; poz takası gemi başına 2 ek `updateMatrixWorld(true)` | Zayıf cihazda kare süresi | C-14 ile görsel işler adımdan çıkar (bugün n kat koşuyorlar; net kazanç beklenir). ~~Uyarlanır bütçe.~~ 144 Hz'de karelerin %58'i adımsız olduğundan CPU tasarrufu. 09_performans'a adım ms ve `update(1/15)` ölçümü. (inceleme düzeltmesi) Net kazanç yalnız 60'tan düşük ve yüksek FPS'te vardır. Tam 60 FPS'te kare başına 1 adım + 1 çizim + izleyici kopyalama + poz takası yapılır, bugünkü tek alt adımdan pahalıdır. Önlem: O(1) kök poz takası ve adımsız karede takasın atlanması (§2.5). Uyarlanır bütçe kaldırıldı (§2.3). |
| R5 | Belirlenimin sınırları: AI'da `Math.random`; `performance.now()` kullanan mantık (sky.js:257 düzeltilir; details.js:507 ve dürbün görsel) | Testlerde salınım | Testler yalnız fizik ölçülerine bakar; rastgelelik içeren sistemler ölçümden yalıtılır |
| R6 | **Co-op:** protokole `ts` ve `seq` eklenir (isteğe bağlı alanlar). Tampon konukta 100–200 ms gecikme getirir. Ev sahibi hit-stop'u dünyayı yavaşlatıyor. Arka plan sekmesinde ev sahibi duruyor. | Eski–yeni sürüm karışımı; isabet hissi | `ts` yoksa eski yöntem; hit-stop kuralı (§5.3); Faz 5'e not; coop senaryolarında bekleme süreleri D'yi kapsamalı. (inceleme düzeltmesi) Faz 3'te protokol **değişmez** (K9). Tampon ve `ts`/`seq` Faz 5'te Faz 2 şemasına eklenir, PROTO artırılır ve saat eşlemesi kare saatiyle yapılır. "Eski istemci uyumu" gerekçesi Faz 2'nin el sıkışma ve PROTO kuralıyla geçersizdir. |
| R7 | **Mevcut 25 regresyon senaryosu** | Bazı eşiklerin kayması | DK.sim(1/30 \| 1/60) adım dizisi değişmez. Etkilenebilecekler §10.6'da listelendi. Her adımdan sonra tam koşu; bayrakla (`?dongu=eski`) karşılaştırmalı koşu. Taban: 23/25 tam geçiyor (09_performans dG ve 06c katılma bilinen sorun). (inceleme düzeltmesi) Adım dizisi aynı kalsa da C-08 sıra değişikliği (oyuncu gemilerden sonra) ve Character.update'in çizime taşınması güverte, dümen ve animasyon testlerinde küçük farklar doğurabilir. DK.sim sonunda çizim 1 adım geride kalır (§2.5). |
| R8 | Kamera pad'i ve yeniden sınama dar yerlerde kamerayı başa yaklaştırır | 0,8 m karakter gizleme eşiği daha sık tetiklenir | pad 0,25 m; K07 ve C02 izlenir; mağarada pad 0,15 |
| R9 | Hareket colK artışı geçitleri kapatabilir | Ada içinde yol tıkanması | GORSEL kutusu ayrı (kamera, görüş, mermi); hareket colK ayrı alt commit + DG06 bağlantı testi |
| R10 | Gemi–iskele çarpışması limanda yanaşmayı zorlaştırabilir; demirli gemi titreyebilir | Liman deneyimi | Dock denge noktası iskele dışına; `pen > 0,05` eşiği; MI05 |
| R11 | Güverte nesne engelleri istasyonlara erişimi kapatabilir | Dümen, top, ambar etkileşimi | İtme yarıçapları (oyuncu payı dahil) istasyon uzaklığından küçük tutulur: dümen ≤ 0,7, çıkrık ≤ 0,65, top ≤ 1,15 (§7.4 C-12). GV03 bunu doğrular. interact yarıçapları değişmez. |
| R12 | Adımda doğan parçacıklar 144 Hz'de kümelenir (60 Hz doğum) | Önemsiz görsel | Gerekirse doğum anı alpha ile kaydırılır |
| R13 | Testler rAF ile yarışır: `acc` kalıntısı | Sınırda bir adım fark | `DK.sim` ve `DK.frames` başında `acc = 0`; ölçümler tek `evaluate` içinde |
| R14 | (inceleme düzeltmesi) **Büyük geri tepmede tünelleme:** sabit adımla 144 Hz oyuncusunun adım başına yatay yolu 0,206 m'den 0,523 m'ye çıkar (koşuyla 0,59 m) | 0,4 m kutuda eşik 7 mm payla; ince direk ve 0,2 m duvardan geçiş | Oyuncunun yatay koruyucu ilerlemesi A1'de, HH01 gerçek kod yoluyla (§6) |
| R15 | (inceleme düzeltmesi) **Kutu içinden başlayan sorgu:** bilinen #43 ve AABB saçak taşması yüzünden göz, baş ya da namlu bir kutunun içinde kalabilir | AI görmez (gizlenme açığı), tabanca ve zıpkın boşa gider, kamera başa çekilir | R7 başlangıç kuralı; GORSEL yalnız kamera ve yalnız kapalı yapılar; AI-R7, YP01 |
| R16 | (inceleme düzeltmesi) **Faz 2/4/5 ile eşgüdüm:** iki saat (`simTime`/`playTime`), `st.ts` iki kez tanımlı, şema/PROTO, sandık durum makinesi, kayıt şeması | Fazlar arasında çakışan uygulama | Benzetim saati `game.playTime`; ağ değişiklikleri Faz 5'te Faz 2 şemasıyla; güverte yükü Faz 2 sandık durum makinesine ve Faz 4 kayıt şemasına |
| R17 | (inceleme düzeltmesi) **`noCam` → maske biti silme** kuralının olduğu gibi uygulanması | Ağaç, palmiye ve direk çemberleri HAREKET'ten düşer, oyuncu içlerinden geçer | §7.3'teki atama kuralı; A4'te Node katman denemesi ve tam regresyon (16 K04 orman koşusu, 21 OK01) |

---

## Ek A — Node denemeleri

Bu belgenin betikleri `/tmp/tasarim_x/` altındadır: `loop_sim.mjs`, `los_fix.mjs` (ve physics.js:5-265'in kopyası `physics_body.txt`), `fall.mjs`, `gust.mjs`, `dda_check.mjs`. Klasördeki öteki dosyalar başka tasarım çalışmalarına aittir. Betikler oyun kodunu yalnız okur ve kopyalar. A0 adımında `tests/node/` altına taşınmaları önerilir. Çalıştırmak için: `node /tmp/tasarim_x/loop_sim.mjs` (öteki betikler de aynı biçimde).

### A.1 `loop_sim.mjs`: eski ve yeni döngü (player.js:509-623 çekirdeği, düz zemin)

* Zıplama, yürüme, kaçınma ve geri tepme değerleri §0 tablosundaki gibidir. Geri tepme k=7: eski 4,2441 (60) / 3,8175 (144), yeni 4,2441.
* Ani düşüş (250 ms kare, ikisi de 0,1'e kırpılıyor): eski = yeni (186 adım).
* Rastgele 8–100 ms dizisinde 300 adımda durum farkı: **0 m**.
* Geri tepme k=7 tepe hızı **16,90 m/s (0,282 m/adım)**; kaçınma tepe hızı 7,16 m/s.
* Adım/kare dağılımı (6 000 kare):

| Kare dizisi | Eski (h = dt/n) | Yeni | Yeni + vsync yuvarlaması |
|---|---|---|---|
| 16,6–16,9 ms rastgele | 1: 1 322, **2: 4 678** | 0: 4, 1: 5 962, 2: 34 (ort. 1,005) | 1: 5 971, 2: 29 |
| 59,94 Hz | **2: 6 000** | 1: 5 994, 2: 6 (ort. 1,001) | Aynı |
| 16,6 / 16,7 ms (0,1 ms damga) | 1: 3 029, 2: 2 971 | 0: 15, 1: 5 977, 2: 8 | 0: 7, 1: 5 993 |
| 144 Hz | 1: 6 000 | **0: 3 500**, 1: 2 500 | Aynı |

### A.2 `los_fix.mjs`: `lineBlocked` kopyası ve `segmentQuery` öneri prototipi

Sonuçlar §8.3'tedir. Prototip; xz giriş–çıkışı, yükseklik bandına ilk giriş, pad, metrik uç payları ve en küçük t'yi içerir. Arazi ve slab bu denemede kapalıdır.

### A.3 `fall.mjs`: yüksekten iskeleye düşüş (platform üstü 2,25 m, 0,6 m pencere)

Sonuçlar §6'dadır. Eşik yükseklik (1/60) 29,45 m. Yeni yöntem (`max(öncekiY, yeniY)` + son hız −45 m/s) bütün yüksekliklerde ve FPS'lerde %0 kaçırma verdi.

### A.4 `gust.mjs`: duvar saatine bağlı esinti

`W.wind = 0,55` için 10 dakikalık rastgele başlangıçlarda, 0,8 ve 3 sn'lik pencerelerin ortalama `windF` değeri 0,8010–0,9239 aralığında (%14,2). Gemi hedef hızı bu çarpanla doğru orantılı (ship.js:307).

### A.5 `dda_check.mjs` ve ek kontroller

* DDA: 3 000 rastgele doğru (≤ 600 m), 0 eksik hücre, en çok 54 hücre.
* 03_fizik_dt cisim döngüsü: `while (t<4) t+=dt` → 15 FPS 60 kare (4,000 sn, h=1/30), 30 FPS 121 kare (4,033 sn, h=1/30), 60 FPS 241 kare (4,017 sn), 120 FPS 481 kare (4,008 sn).

### A.6 (inceleme düzeltmesi) Karşıt inceleme denemeleri

Betikler `/tmp/tasarim_x/` altında, `inceleme3_` önekiyle. Oyun kodunu değiştirmezler.

* **`inceleme3_knock.mjs`, gerçek kod yolunda geri tepme** (player.js:183-185, 537-545). k = 7: h=1/60'ta yerde (A.1 modeli) tepe 16,90 m/s ve 0,282 m/adım; havada (gerçek yol) **31,36 m/s ve 0,523 m/adım**, savrulma 10,08 m. h=1/144'te havada 29,67 m/s ve 0,206 m/adım. A.1 ve §0'daki 10 hasarlık değerler (yerde kalan dal) geçerliliğini korur.
* **`inceleme3_netclock.mjs`, co-op test saati.** Model: `tick` = `DK.sim(0.2)` (6 × 1/30, 15 Hz gönderim) + 40 ms bekleme, 25 tick. İlk sürümün duvar saatli eşlemesinde konuğun gördüğü gecikmenin ortalama ve en büyük değeri: evaluate 20 ms → 0,478 / 0,518 s; 60 ms → 0,295 / 0,303 s; 150 ms → −0,118 / 0,247 s. Kare saatli eşlemede üç durumda da 0,120 / 0,247 s.
* **`inceleme3_hooks.mjs` + `inceleme3_loader_test.mjs`, Node'da gerçek `physics.js`.** Düz `import` `ERR_MODULE_NOT_FOUND` verir (terrain.js → 'three'). `module.register` + `resolve` kancasıyla `./terrain.js` sahte modüle yönlendirilince modül yüklenir ve `lineBlocked` çalışır (Node 22.22).
* **Kod okumasıyla doğrulanan ek noktalar:** taban 03_fizik_dt değerleri belgeyle birebir (yürüme 12,596/12,585; zıplama 1,183/1,214; gemi 87,5–87,8/82,64; cisim x −60,72…−62,06). DK.sim dt kullanımı 1/30: 158, 1/60: 59, varsayılan: 21 (25'lik küme). `Timer.connect` r187'de var (three.core.js `class Timer`). İlk sürümün Node betikleri (loop_sim, los_fix, fall, gust) yeniden koşuldu ve çıktıları belgeyle uyuştu.

## Ek B — Bu belgede ilk kez kaydedilen bulgular

| No | Bulgu | Yer | Öncelik |
|---|---|---|---|
| N-01 | Gamepad sağ çubuk bakışı kare başına sabit ekleniyor; dönüş hızı FPS ile doğru orantılı | input.js:154-157 | Orta |
| N-02 | Su hortumu gemilere kare dt'siyle kuvvet uyguluyor (adım dışında) | weatherfx.js:322-332 | Düşük |
| N-03 | Rüzgâr esintisi `performance.now()` kullanıyor; gemi itkisi duvar saatine bağlı. Gemi testleri tekrarlanamıyor ve testin rüzgâr ataması eziliyor. | sky.js:257-258; 03_fizik_dt.js:30 | Orta |
| N-04 | Görüş varsayılan uç payları oransal: 40 m'de hedefin 0,8 m yakınındaki ince duvar yok sayılıyor | physics.js:195, 243 | Orta (A5'te kapanır; inceleme düzeltmesi: adım numarası) |
| N-05 | NPC çarpıştırıcısı taşınınca hücre kaydı güncellenmiyor | npcs.js:133, 180 | Düşük |
| N-06 | Hit-stop çevrimiçi ev sahibinde bütün dünyanın benzetimini yavaşlatıyor | game.js:194 | Düşük–orta |
| N-07 | 03_fizik_dt cisim ölçümü oyun döngüsünü atlıyor; taban "120 FPS'te 1,3 m" farkının bir bölümü test yapaylığı | 03_fizik_dt.js:47; bodies.js:101 | Test |
| N-08 | (inceleme düzeltmesi) 20'nin üstündeki hasar oyuncuyu havaya kaldırır ve havada ivme 2,5'tir. Bu yüzden k = 7'lik geri tepme 31 m/s'ye, ~10 m savrulmaya ulaşır. Bugün 144 Hz'de ince engel eşiği altında kalıyor (0,206 m/adım), 1/60'ta eşikte (0,523 m/adım). | player.js:183-185, 537 | Orta (A1) |
| N-09 | (inceleme düzeltmesi) `time.update` karede iki kez çağrılıyor (sistem döngüsü ve `_env`) | game.js:212, 390; time.js:147 | Düşük |
| N-10 | (inceleme düzeltmesi) `Ship.collideAll` gemileri iter ama kök matrisini yenilemez. Aynı adımda `localToWorld` ile konumlanan güverte oyuncusu ve düşmanlar itme öncesi pozu görür. | ship.js:487-488, 170 | Düşük–orta (A2a) |
| N-11 | (inceleme düzeltmesi) Dolu ambarda güverteye bırakılan sandık (C-09) için kayıt formatı yok. `treasure.save` dünya koordinatı yazar. | treasure.js:120-126, 404-407 | Orta (A7) |

---

## Karşıt incelemede bulunan sorunlar (önem sırasıyla)

Her madde: sorun, kanıt (dosya:satır ya da deneme) ve belgede düzeltildiği yer. "(inceleme düzeltmesi)" notları bu maddelere karşılık gelir.

### Yüksek

1. **Geri tepme tepe hızı yanlış modellenmiş, tünelleme eşiği aşılıyor.** k = 7 ancak ≥ 46 hasarla oluşur (player.js:183). 20'nin üstündeki her hasar oyuncuyu havaya kaldırır (player.js:185) ve havada ivme 2,5'tir (player.js:537). Gerçek tepe 16,9 değil **31,4 m/s**: adım başına 0,523 m, koşuyla 0,59 m, bugün 144 Hz'de 0,206 m (Ek A.6, `inceleme3_knock.mjs`). 0,4 m kutu eşiği (0,53 m) 7 mm payla, fener direği (r 0,15, port.js:407; eşik 0,48 m) ve denetimin istediği 0,2 m duvar (eşik 0,43 m) ise aşılıyor. → §0, §2.1, §6, §9.1: oyuncunun yatay koruyucu ilerlemesi **A1'e** alındı; HH01 gerçek kod yoluyla, 0,2/0,4 m ve direkle; R14.
2. **Ağ ara değerlemesinin saat eşlemesi duvar saatine bağlıydı.** `ofs = EMA(ts − now/1000)` co-op testlerinde makineye bağlı sonuç verir: testler rAF'ı `fpsLimit = 0.01` ile durdurur ve zaman `DK.sim(0.2)` + 40 ms ile ilerler (coop.cjs:54). Konukta gecikme 0,48 s … −0,12 s arasında oynar, kare saatiyle sabit 0,12 s'dir (`inceleme3_netclock.mjs`). Faz 2 aynı sorunu D-6/P6'da benzetim saatiyle çözmüştü. İlk sürümün §10.6'daki "bekleme süreleri D'yi kapsıyor" gerekçesi de bu yüzden geçersiz. → §5.2 (K9): eşleme `game.frameClock` ile; tampon Faz 5'e.
3. **`noCam → m &= ~KAMERA` kuralı katman ile maskeyi karıştırıyor.** Varsayılan ENGEL (1) katmanında 1 & ~105 = 0 olur. Ağaç, palmiye, iskele direği ve baba çemberleri (props.js:238-249, islands.js:478, 633, port.js:236, 243, 373) HAREKET maskesinden de düşer, oyuncu içlerinden geçerdi. → §7.3: `noCam` bir **katman ataması** (BITKI/INCE/NPC); r < 0,2 çemberler INCE; R17.
4. **GORSEL kutusu ve "kutu içinden başlayan sorgu".** Oyuncu duvarlara 0,1–1 m gömülebiliyor (bilinen #43). Model AABB'si (islands.js:490-503) saçak taşmasını içeriyor. Göz, baş ya da namlu kutu içindeyse segmentQuery ilk santimde engellenir (§8.2 yalnız uç payıyla kırpıyordu). Sonuç: AI duvar dibindeki oyuncuyu hiç görmez, tabanca ve zıpkın boşa gider, kamera başa çekilir. → R7 başlangıç kuralı (§7.3, §8.2 adım 0); GORSEL yalnız KAMERA maskesinde ve yalnız kapalı yapılarda (§7.4 C-13); AI-R7 testi; R15.
5. **Uyarlanır adım bütçesi belirlenimi bozar.** `stepMsEma` `performance.now()` ile ölçülür. Bütçe 6'nın altına inerse `DK.sim`/`DK.frames` istenen süreyi sessizce eksik ilerletir ve sonuç makineye bağlı olur. 6 adım sınırı zaten yeterli; çevrimiçide ev sahibi yavaşlaması bütün dünyayı yavaşlatır. → §2.2–2.3: kaldırıldı (gerekirse Faz 8'de, varsayılan kapalı).
6. **`DK.sim` sözleşmesi sessizce değişiyordu.** Yeni `MAX_SIM_PER_FRAME` kırpması game.update içinde; bugün `DK.sim` kırpmasızdır (main.js:145-149). `DK.sim(need, 0.25)` (v03/full.js:17, full2.js:17) istenen sürenin %40'ını ilerletirdi. → §4.3: dt > 0,1 eşit parçalara bölünür; `DK.frames` motor kırpmasını taklit eder ve `stats.kirpilan`'a yazar.

### Orta

7. **Kayık için çelişkili karar.** "Poz takası" ile "ship.js:839-843 çizime" birlikte yazılmış. `seatWorld()` (ship.js:845-847) `mesh` pozundan okur ve adımda oyuncuyu konumlar (player.js:949). Örgü yazımı adımdan çıkarsa adımlar kare başı pozunu görürdü. → §2.5, §3: adım kök pozunu yazmaya devam eder, yalnız ara poz ve kürekler çizimde; `updateDocked` çizimde.
8. **Kamera çizim pozuna tam geçirilmemiş.** Dümen kipi odağı `head.set(s.x, s.y + 5, s.z)` (game.js:316), dürbün `p.pos` (game.js:278), gizleme mesafesi `p.headPos` (game.js:373; player.js:291 `this.pos`) benzetim alanlarını okur. 144 Hz'de kamera gemiye göre titrer. → §2.5 kamera satırı.
9. **`ocean.time` adıma taşınınca çizim evresindeki su okuyucuları benzetim anını görür.** Kamera su kıskacı (camera.js:83, 88, 149-152), su altı kararı (game.js:382-385) ve dürbün (game.js:280, 285) çizilen sudan ≤ 1 adım ileride. Fırtınada ~5 cm, histerezis 3–12 cm; 17_kamera_kararma'daki su altı kararması geri gelebilir. Menüde (game.js:96) deniz donardı. → §2.5, §2.2, §3: `heightAt(x, z, renderTime)`, menüde kare saati.
10. **Adım sırası: maskeli sorgu (eski A4), katmanlardan (eski A5) önceydi; maskeler bugünkü davranışla eşit değildi.** Bugün `lineBlocked` NPC, ince direk ve ağaç dahil her çarpıştırıcıyı sayar (physics.js:194-252). GORUS INCE/NPC'yi, MERMI NPC'yi dışlıyordu, bu yüzden "birebir" iddiası tutmaz. → §9.1: A4 = katmanlar (`MASK.HEPSI`, birebir), A5 = segmentQuery (daraltmalar bilinçli ve testli); R8.
11. **Denetim planındaki kullanıcı test istekleri eksikti** (audit_C requirements): iç köşe (istek 7), her yapı türü için "içinden yürünmez" (istek 8), basamakta zıplama (merdivenler), 0,2 m duvar (çok hızlı hareket), 8–250 ms kareler (ani FPS düşüşü). → §0 tablo, §10.3 D3, §10.4 DG07, YP01, MI06, HH01/HH02.
12. **C-09 güverte yükünün kalıcılığı yoktu.** `treasure.save` (treasure.js:120-126) yalnız ground/water/carried/boat sandıklarını dünya koordinatıyla yazar. Güverte yükü kayıtta kaybolur ya da yüklemede güverteden denize düşer. → §7.4 C-09: `state:'deck'`, `ship`, `local`; Faz 4 şeması ve Faz 2 sandık durum makinesi; SD06; N-11.
13. **Faz 2 ile tutarsızlıklar.** İki ayrı benzetim saati vardı (`simTime` ve Faz 2'nin `game.playTime`). `st.ts` Faz 2'de zaten tanımlı. "İsteğe bağlı alan, eski istemci uyumu" yaklaşımı Faz 2'nin şema kayıt defteri ve PROTO kuralıyla çelişiyordu. §5.3'teki "konuk kendi gördüğüne göre vurur" Faz 2'nin host çözümlü savaşıyla çelişiyordu. → §2.2 (simTime = playTime), §5.2–5.3, R6, R16.
14. **C-12 istasyon kısıtında kova istasyonu unutulmuş.** `stations.bucket` kapak merkezine göre (−0,9; −0,6) konumda (shipModel.js:533, kapak 1,4 m, 476). Kapak yarı boyu + pay ≤ 0,95 olursa kovadaki oyuncu itilir; sınır ≤ 0,85 olmalı. → §7.4 C-12; GV03 bütün istasyonlarda.
15. **AI-C06a kendi sayılarıyla çelişiyor.** Çömelmiş hedef noktası güverte+0,9 (enemies.js:555), katı küpeşte en çok güverte+0,8 (camera.js:20-28). Aynı yükseklikten bakan atıcıda küpeşte siper olmaz. → §7.4 C-06, §10.4: atıcı alçakta tanımlandı, iki durum da sınanır.
16. **Poz takası maliyeti ve "net kazanç" iddiası.** Gemi başına kare başına 2 ek `updateMatrixWorld(true)` gerekir; tam 60 FPS'te bu net artıştır. → §2.5: O(1) kök biçimi, çocuklarda gerektiğinde `updateWorldMatrix(true, false)`, adımsız karede takas yok; R4.
17. **`collideAll` itmesinden sonra kök matrisi eski kalıyor** (ship.js:487-488). C-08 sırasıyla güverte oyuncusu itme öncesi pozdan konumlanır; bordalamada sapma olur. → §2.5 C-08 paragrafı; N-10.
18. **A2 tek adımda çok büyüktü** (15 dosya). Çift döngü bakımı A11'e kadar uzuyordu. → §9.1: A2a/A2b; bayrak A3 sonrası kaldırılabilir; eski döngüde çizim evresi `alpha = 1`.
19. **A0'ın Node testi yazıldığı gibi koşamazdı.** `physics.js` düz Node'da `ERR_MODULE_NOT_FOUND` verir (terrain.js → 'three'). → §9.1 A0, §10.5: `module.register` çözüm kancası (Ek A.6'da doğrulandı).

### Düşük

20. **Gecikme eksik verilmiş.** "En çok 1 STEP" denmiş; adımsız karede bekleme ile çizim gecikmesi toplanır, en kötü durum ~2 STEP (33 ms). → §2.5, R2.
21. **Yanlış okunmuş kod.** "time (update yok)" ve "progress (update yok)" yanlış (time.js:147, progress.js:165). `time.update` karede iki kez çağrılıyor (game.js:212, 390). → §1.2, §3, N-09.
22. **Kare bağlamı listesi eksikti.** fishing.js:92, 100 ve seagear.js:393 'saldiri' okuyor. → §4.1.
23. **Ölçülemeyen ya da yanlış ölçen test tanımları.** FS03'ün ölçtüğü `MAX_SIM_PER_FRAME` kırpması sayılmıyordu. FS05 `groundAt(x, z, y+0,6)` 1,2 m yukarıdaki platformu sayar ve `lastPlatform` yan etkisi vardır. A1 doğrulamasındaki FD06 A3'ten önce geçemez. → §2.2 (`stats.kirpilan`), §10.3 FS03/FS05, §9.1 A1.
24. **`acc` sıfırlanırken `renderTime` kurulmuyordu.** İlk karede `rdt` oturum süresi kadar büyürdü. Döngüden sonraki durum koruması (game.js:210) yalancı kodda düşmüştü. → §2.2.
25. **DK.sim sonunda çizim 1 adım geride (alpha = 0).** Çizim ile benzetimi karşılaştıran testler için not eksikti. → §2.5, §10.6.
26. **Küçük kapsam boşlukları.** Kayıktaki yük sandığı (treasure.js:330-336) çizim sınıflandırmasında yoktu. Hayvan basamak sınırının yalnız platformlar için olduğu yazılmamıştı (arazi oturması physics.js:88). Zıpkın atış noktası el kemiğinden (seagear.js:199-203) okunduğu için adıma taşınınca kare zamanlamasına bağlı kalırdı. AI hedef noktasının "göğüs"e çevrilmesi gizlenme dengesini değiştirirdi. FD07 cismi bir yapıya çarpıyor. → §2.5, §6, §8.4, §10.2.
