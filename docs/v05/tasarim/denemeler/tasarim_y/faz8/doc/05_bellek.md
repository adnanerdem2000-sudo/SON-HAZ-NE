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

Senaryo (tests/scenarios/10_uzun_oturum.js): 30 dk oyun zamanı, 20 dilim × 90 sn (`DK.sim(30, 1/30)` × 3, dilim aralarında olay döngüsüne teslim ve `gc()`), liman yürüyüşü → seyir → düşman dalgaları → hava değişimi + Kraken → kayıt/yükleme. Ölçütler: U01 NaN yok, U02 son 10 dilimde geometri/doku artış medyanı ≤ 1 ve toplam ≤ 300, U03 benzetim maliyeti ≤ 3× ilk dilim, U04 yığın son dilimlerde ilk dilimlere göre ≤ +30 MB. Son kodda bu çalışmada koşuldu: **5/5 geçti** (§1.5 E): geometri bölgeye göre 574–1 102 arasında iniş çıkış yapıp düzlüyor, doku 227–259, yığın +11,7 MB, dinleyici 58 sabit. Sürekli sızıntı görülmedi; ancak bu senaryo yüzen olay nesnelerini (J-21) ve uzak oyuncu katıl/ayrıl döngüsünü (B-5) içermiyor.

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
| 09_performans **orijinali**, 3 yeni koşu | doğal | — | 2 geçti; 1 kaldı: `volkanik_dev dG = 1` (bu kez demon değil, başka bir nesnenin ilk yüklemesi — deney A'daki gemi parçası gibi). Sayaç farkı yöntemi döngü sırasında **herhangi** bir nesnenin ilk GPU yüklemesine duyarlı |
| f8_09tani (09'un birebir kopyası, elle müdahale yok) | doğal | — | 1. koşu: 3 + 6 döngüde dG = 0. **2. koşu: 09'un 3 döngüsünde 0, ek 6 döngünün sonuncusunda (k=5) dG = 5**; o döngüde yeni kalan kimlikler yine `Demon_1..4` + `Trident` — taban koşusundaki FAIL'in **doğal yeniden üretimi** |

**Sonuç: sızıntı değil; testin ölçüm kusuru.** Uçuştaki lav mermisi hipotezi elendi (yükseliş 4 sn sürdüğü için testte atış yok; gerçek savaşta işaretler bırakılıyor). Gecikmeli dispose hipotezi elendi (dispose eşzamanlı). Ek olarak: bu kusur yüzünden 09, Volkanik Dev'in (ve Ateş Dağı'ndan uzakta doğurulan Kraken'in) GPU kaynak bırakmasını çoğu koşuda **hiç sınamıyordu**: boss çizilmeden siliniyordu.

**Çözüm.**
- *Test (09 ve 45/50)*: boss oyuncunun yanında doğurulur (`spawn(bid, {id: bid, x: p.x+30, z: p.z})`), döngü boyunca `DK.bosses.checkT = 1e9` (ya da test kancası `DK.bosses.noRetreat = true`); ölçüm karesinde `DK.bosses.active === ilk` doğrulanır (aksi hâlde kontrol **hata** verir, sessizce geçmez). Sayaç farkı yerine **kimlik farkı**: "döngüde GPU'ya yüklenip döngü sonunda sahnede olmayan ve paylaşımlı varlık kümesinde (assets.models, kk şablonları, `PARTS`, `PROJ_GEO`, deniz devi `GEO`) bulunmayan geometri/doku sayısı = 0". Bu ölçüt ilgisiz ilk yüklemeleri (A'daki gemi parçası) de dışarıda bırakır.
- *Oyun*: (1) `bosses._clear()`/`dispose` sahibi o boss olan uçuştaki mermileri kaldırır (`enemies.shots.filter(s => s.owner === boss)` → işaret bırakılır, mermi ölür) — geri çekilen boss'un hasar vermesi biter; (2) boss modelleri (demon, orc_brute) yükleme ekranında ön ısıtılır (§6): ilk karşılaşmadaki 5–11 geometri yüklemesi ve program derlemesi oyuna yansımaz.
- *Kabul*: düzeltilmiş döngü 5 ardışık koşuda dG = dT = 0 ve kimlik farkı boş; boss her ölçüm karesinde etkin; `checkT` evresi elle 0,5'e ayarlanmış döngüde de 0 (B'nin düzeltilmiş hâli).

Düzeltilmiş döngünün özü (09/50 için; `perf_araclari.js` kimlik izleyicisiyle):

```js
const p = DK.G.player, M = () => { DK.post.render(); };
const site = { id: bid, x: p.pos.x + 30, z: p.pos.z };          // boss kameranın önünde, 650 m kuralının içinde
DK.bosses.checkT = 1e9;                                          // uzaklık denetimi döngü boyunca çalışmaz
let ref = null;
for (let k = 0; k < 4; k++) {
  const once = _geoSnap();
  const b = DK.bosses.spawn(bid, site); DK.sim(0.5); M();
  if (DK.bosses.active !== b) throw new Error('boss ölçümden önce kalktı');   // sessizce geçmesin
  DK.bosses._clear(); DK.sim(0.2); M();
  if (k === 0) ref = _geoSnap();                                 // ısınma: paylaşımlı demon geometrisi burada yüklenir
}
const sizan = _geoDiff(ref).filter((g) => !g.sahnede && !PAYLASIMLI.has(g.geo)); // = [] olmalı
DK.bosses.checkT = 0.5;
```

### 5.5 Bu çalışmada bulunan ek bellek sorunları

| # | Sorun | Kanıt | Çözüm | Kabul |
|---|---|---|---|---|
| B-1 | `enemies.start()` (yeni oturum/yükleme) uçuştaki yaylı atışların **işaret halkalarını sahnede bırakıyor**: geometri + malzeme sızar ve kırmızı halka yerde kalır | f8_volkan E: 3 lav atışı uçarken `enemies.start(null)` → sahnede 3 `RingGeometry` (ebeveyn: sahne), `shots` 0; kod enemies.js:1313 yalnız `s.mesh`'i kaldırıyor | `start()` içinde `s.marker` için `parent.remove` + `geometry/material.dispose` | Aynı deneyde sahnede halka 0, kimlik farkı boş |
| B-2 | Boss kaldırılınca sahibi o boss olan mermiler uçmaya ve isabet edince `owner._hitPlayer` çağırmaya devam ediyor | f8_volkan D: `clearSonrasiSahipsizLav = 1` | §5.4 oyun çözümü (1) | `_clear` sonrası `owner===boss` mermi 0 |
| B-3 | Yüzen olay nesneleri bırakılmıyor (J-21) | f8_09tani: 3 şişe döngüsünde +2/döngü (`CylinderGeometry` 52 ve 40 köşe, sahnede değil) | Paylaşımlı geometri/malzeme ya da `disposeTree(f.mesh)` (varil/sandık prop klonlarının paylaşımlı kaynakları atlanarak) | 50'de şişe/gök taşı/kazazede 3 döngü, kimlik farkı boş |
| B-5 | Uzak oyuncu ayrılınca ad etiketi (`CanvasTexture` + `SpriteMaterial`, net.js:75-85) bırakılmıyor: `RemotePlayer.dispose` (net.js:125) → `Character.dispose` (character.js:949-953) yalnız `this.model` altını bırakıyor, etiket `char.root`'un çocuğu | Kod okuması (bu ortamda yeniden bağlanma döngüsü koşulmadı) | `RemotePlayer.dispose` etiketi de bırakır (`label.material.map.dispose()`, `label.material.dispose()`) | 08f: 5 katıl/ayrıl döngüsünde doku ve malzeme kimlik farkı boş |
| B-4 | Sayaç tabanlı sızıntı testleri ilgisiz ilk yüklemelere duyarlı | f8_volkan A: gemi parçası +1 | Kimlik farkı + paylaşımlı küme dışlama (§5.4) | 09/50 bütün döngüler kimlikle |
