# Faz 4 — Kayıt ve Dünya Kalıcılığı: Nihai Tasarım Belgesi (karşıt inceleme sonrası)

| | |
|---|---|
| **Durum** | Nihai tasarım (uygulama yok). Bu belge ve karşıt incelemesi yazılırken **kod değiştirilmedi, depoya yazılmadı, tarayıcı testi çalıştırılmadı.** |
| **Kod tabanı** | `/home/user/SON-HAZ-NE-w2` @ `e194d59`. Bu commit `44d548c` (v0.4) koduna yalnız Faz 0 belgelerini ekler; `git diff 44d548c e194d59 -- js` boştur. v0.3: `/home/user/SON-HAZ-NE-v03` @ `762f1c7`. |
| **Girdiler** | `audit_D.json` (D-01…D-19, 30 gereksinim, 36 sistem satırı); `audit_B.json` (B-19, ayrıca B-06, B-12, B-18); `faz2_tasarim_A.md`, `faz2_tasarim_B.md` |
| **Faz 2 nihai belgesi** | (inceleme düzeltmesi) `faz2_tasarim_NIHAI.md` **var** (aynı gün yazıldı; ilk taslak onu görmeden hazırlanmıştı). Faz 2 ile temas eden ⟷UYUM noktaları onun kararlarına göre kapatıldı: konuk profilleri host'ta `dksh.gbook.<worldId>` (`{v:1, w, list}`, dünya başına ≤ 16 profil); `dksh.guest.0` ve `dksh.progress.guest` v0.5'te **salt okunur** ithalat kaynağı; konuk yalnız `dksh.wtok.<w>` ve `dksh.wcache.<w>` yazar; `worldId` = `crypto.randomUUID()` + `dksh.gslot.<N>`; dünya durumu `worldPart.feats` + `featSt` ile taşınır, konuk eylemleri `feat` niyetidir; `story` beyaz listesi ve `proto` sürüm denetimi Faz 2'dedir. Tam liste §8.6. |
| **Yöntem** | Kod okuma (dosya:satır `w2` ağacına göredir) ve Node ile salt-okur denemeler (`/tmp/tasarim_x/*.mjs`, Ek A) |
| **İnceleme** | (inceleme düzeltmesi) Bu sürüm karşıt incelemeden geçti: önemli iddialar `w2` kodunda yeniden okundu; Faz 2 nihai belgesi ve Faz 3 tasarımıyla çakışmalar giderildi. Düzeltilen yerler "(inceleme düzeltmesi)" ile işaretlidir; bulunan sorunların listesi belgenin sonundadır. Ek Node denemesi: `/tmp/tasarim_x/inceleme_yakinlik.mjs` (Ek A). |

---

## 0. Özet ve karar noktaları

**Özet**

1. **Sürüm alanı:** v0.4'te kayıt sürümü işlevsiz. v0.3 de v0.4 de `version: 1` yazıyor (v0.3 game.js:156, v0.4 game.js:164). Bu değer yalnız türü için denetleniyor (save.js:36). Yeni şemada `version` **kayıt şeması sürümüdür**: v0.3 = 1, v0.4 = 2, v0.5 = 3. v0.3 ile v0.4 kayıtları içerikteki işaretlerden ayırt edilir. Ayırt etme, Node prototipiyle denendi.
2. **Migrasyon:** Saf fonksiyonlardan oluşan bir zincir kullanılır (1→2→3). Göç **tembeldir**: yalnız yuva açılınca bellekte yapılır. İlk v3 yazımından önce özgün kayıt `.pre3` anahtarına bir kez kopyalanır. Zincir aynı girdiye tekrar uygulanınca sonuç değişmez. (inceleme düzeltmesi) Prototipteki denetim yalnız v3 girdisinde göçün işlemsiz olduğunu gösteriyordu (döngü boş); asıl ölçüt `prepare(serialize(prepare(x)))`'in `prepare(x)`'e eşitliğidir ve `kayit_sema.mjs`'de sınanır.
3. **Gelecek sürüm:** Kayıt reddedilir ve yuvaya **asla yazılmaz**. `minReader ≤ 3` ise salt-okunur oynanabilir. Gelecek sürüm kaydında eski yedeğe sessizce düşülmez.
4. **Doğrulama:** Yerel okuma, içe aktarma, eski konuk kaydı (ithalat kaynağı) ve ağdan gelen dünya verisi tek bir doğrulayıcıdan (`saveSchema.validate`) geçer. **RET** yalnız yapısal bozulmada uygulanır. Diğer bütün ihlaller **ONARılır** ve not düşülür. Bilinmeyen kimlikler silinmez. (inceleme düzeltmesi) Bilinmeyen eşya kimliği envanterde kalır (envanter, dükkân ve arayüz kodu bunu zaten tolere ediyor); yalnız çöken yollar (bilinmeyen sandık kademesi, gemi tipi) ve tanınmayan yan görev `extra`'ya alınır ve tanındığında geri birleştirilir. Balık verisinde yakalamaya özgü alanlar (`zone`, `bait`, `time`, `date`, ağırlığa bağlı `value`) korunur; yalnız `name/rarity/color` FISH'ten türetilir. Ambar balıkları (`ship.hold.fish`) şemaya eklendi.
5. **Depolama:** Ana kayıt yazıldıktan sonra yalnız **doğrulanmış** önceki kayıt yedeklere kaydırılır. Yuva başına dört kuşak tutulur: `.bak` (önceki), `.h1`, `.h2`, `.gun` (önceki oyun günü). Kayıtta FNV-1a bütünlük işareti, yuva başına `saveSeq` çakışma sayacı, sekme içinde yeniden girişli Web Locks kilidi ve kotaya göre budama vardır. (inceleme düzeltmesi) Önceki kayıt 60 sn'den gençse kuşak döndürülmez (olay tetikli kayıt ve kapanıştaki üçlü yazım `.bak`'ı saniyelik kopyaya çevirmesin); kuşaklar `worldId` ile süzülür; yuva silinince bütün kuşaklar `.sil` paketine alınır. Yedek kira kilidi ve BroadcastChannel çıkarıldı: `saveSeq` iyimser denetimi kilitsiz ortamda da D-11'i karşılıyor.
6. **Yükleme işlemi:** `game.start` artık "yükleniyor" durumunda çalışır. Her sistem ayrı `try/catch` içinde başlar. Hata olursa oturum geri alınır, otomatik kayıt kilitlenir ve bir sonraki yedek önerilir (D-06). (inceleme düzeltmesi) Kaydı olan her sistem (misc, time, treasure, enemies, islands, hazards, bosses, quests, progress, worldState) kritiktir; yalnız kaydı olmayan sistemler varsayılana düşebilir. İlk taslakta `time`, `enemies` ve `bosses` varsayılana düşüp ilk otomatik kayıtta yenilmiş boss'ları ve takvimi silebiliyordu.
7. **İçe/dışa aktarma:** Dosya biçimi geriye uyumludur: düz `dksh.*` haritası korunur, üst bilgi `dksh.__meta` anahtarındadır. Dosya ≤ 2 MB, anahtarlar beyaz listeden. Uygulamadan önce yuva bazında önizleme ve onay alınır. Oyun içinden içe aktarma kapalıdır (D-04, D-10). (inceleme düzeltmesi) Geri alma kaydı etkilenen yuvanın **bütün** anahtarlarını (`k`, `.bak`, `.h1`, `.h2`, `.gun`, `.pre3`, `.bad`; online yuvada `gslot/gbook`) kapsar ve içe aktarma sırasında kuşak döndürme yapılmaz. Eski dosyalardaki `dksh.progress.guest` ithalat kaynağı olarak okunur.
8. **Dünya kalıcılığı:** Mevcut düz kimlik biçimi (`<adaId>_<tür>_<sıra>` + ek) korunur ve resmîleştirilir. Saf bir **kimlik kataloğu** eklenir: Node ile sayılan 155 statik nesne, Martı Batığı ve en çok 46 kabuk (details.js:254 döngüsü). Uygulama kuralı "önce üret, sonra uygula"dır: kayıtlı durum RNG akışını ve yerleşim çarpıştırıcılarını değiştirmez. (inceleme düzeltmesi) **WorldState sahiplik devralmaz:** `islands.opened/freed/templeState` ve `hazards.gone/solved/looted` yerinde kalır, `islands.start`/`hazards.start` kayıttan okumaya devam eder (13_donma P08 `islands.start`'ı doğrudan çağırıyor). WorldState bu kümeler üzerinde ince bir cephedir (`has/mark/tryClaim/on('change')`) ve yalnız yeni verileri (kaya, kaynak zamanlayıcıları) kaydeder.
9. **Yeni bulgu (YB-1):** Demirkapı'da tutsak kurtarılınca `_npc`'nin iki `R()` çekilişi atlanıyor (islands.js:956-957, 528-531). Bu yüzden ada yeniden kurulunca deniz kayalıkları ve çarpıştırıcıları başka yere kayıyor (`_seaStacks` islands.js:1058-1076). Ayrıntı §1.6 ve §6.2'de.
10. **11 ilerleme alanı:** Hepsinin kayıt yolu var. Yalnız envanter ve gemi hasarı testli. Her alan için tür ve aralık kuralı, onarım ve test tanımlandı. Kozmetik satın alma kalıcılığı atomik hâle getirilir ve yuvada satın alma defteri tutulur (D-15).
11. **Co-op:** (inceleme düzeltmesi) Taşıma ve host otoritesi Faz 2 nihai tasarımındadır: geç katılan konuğa dünya durumu `worldPart.feats` ile gider, değişiklikler `featSt` ile yayılır, konuk eylemleri `feat` niyetidir. Faz 4 paralel bir `ws` kanalı **kurmaz**; yalnız `feats`'in veri kaynağını (WorldState cephesi) ve Faz 4'ün eklediği kalıcı durumun (kaya `used` + konum) şema uzantısını sağlar. Faz 2 kararı gereği `dksh.guest.0` ve `dksh.progress.guest` salt okunurdur; D-09'un periyodik konuk kaydı `dksh.wcache.<w>`'ye yazılır, yetkili kopya host'taki `dksh.gbook.<worldId>`'dir (K-10). D-02'nin kayıt tarafı: eski konuk kaydı ithalatta doğrulanır, kirli host kayıtları yüklemede onarılır. Korsan Kodu ve host imzalı özet seçenek olarak belgelenir; uygulamaları Faz 5'e (co-op tamamlanması) bırakılır (K-9).
12. **Uygulama sırası:** On iki küçük adım var (Adım 0–11, §9.3). İlk adım gerçek v0.3/v0.4 kayıt fikstürlerinin üretilmesidir. Her adım ayrı Node ve tarayıcı testiyle kabul edilir. (inceleme düzeltmesi) Yeni senaryo adları Faz 2 (`coop/06e`–`06n`) ve Faz 3 (`18`–`22`) ile çakışmayacak biçimde `23`–`26` ve `coop/06o`–`06q` olarak verildi.

**Karar noktaları (kullanıcı onayı gerekir)**

| No | Soru | Öneri | Gerekçe |
|---|---|---|---|
| K-1 | `version` alanı şema sürümü mü olsun (3), yoksa sabit 1 kalıp yeni `schema` alanı mı eklensin? | **`version: 3`** + `minReader` | Tek alan, açık anlam. Eski okuyucular sayıyı kabul ediyor (v0.4 save.js:36; v0.3 hiç bakmıyor). Etkisi: 08_kalicilik.js satır 43'teki `r.version===1` beklentisi güncellenir (§10.5). |
| K-2 | Kozmetik kilitleri hesap (profil) düzeyinde mi, yuva düzeyinde mi olsun? | **Hesap düzeyi kalsın.** Yuvaya bir satın alma defteri eklenir (`misc.cosmetics`). | Bugünkü davranış korunur, güç vermiyor. Defter tutarsızlığı onarır (D-15). |
| K-3 | Hangi kaynaklar "önemli", yani tek seferlik? | Kabuk/istiridye **yenilenen** kalır; zamanlayıcıları oyun saatiyle kaydedilir. (inceleme düzeltmesi) Tek seferlik düğüm altyapısı içerikle birlikte Faz 6'da kurulur; Faz 4'te yalnız kimlik kalıbı (`<fid>_kaynak<i>`) ve şema yeri ayrılır. Kazı alanları tasarım gereği yenilenir. | Bugün tek seferlik kaynak türü yok (audit_D 7.2 satırı). İçeriksiz altyapı Faz 4'te sınanamaz. |
| K-4 | ~~Konuk profilleri nerede tutulsun?~~ | (inceleme düzeltmesi) **Karara bağlandı (Faz 2 nihai §4.2):** ayrı anahtar `dksh.gbook.<worldId>`, biçim `{v:1, w, list}`; Faz 4 yalnız isteğe bağlı `slotSeq` alanını ekler. | İlk taslağın önerisiyle aynı; artık kullanıcı kararı gerekmez. ⟷UYUM-2 |
| K-5 | Gelecek sürüm kaydı `minReader ≤ 3` ise salt-okunur oynanabilsin mi? | **Evet.** Kayıt kapalı, uyarı sürekli görünür. | Veri kaybı riski yok, kullanıcı oyunu görebilir. |
| K-6 | YB-1 düzeltmesinden sonra Demirkapı kayalıkları "kurtarılmamış" yerleşime bir kez geri dönsün mü? | **Evet.** (inceleme düzeltmesi) Ayrı bir "güvenli konuma kaydırma" adımı eklenmez: yükleme anında adalar henüz kurulu değildir (islands.js:255-256), kayalıklar `Ship.obstacles`'a ancak ada kurulunca girer; o andan sonra `Ship._obstacles` (ship.js:442-458) örtüşen gemiyi dışarı iter ve 1,6 m/s altındaki çarpmada hasar vermez (ship.js:394-411). T7'de doğrulanır. | Deterministik tek yerleşim, ek kod yok. |
| K-7 | Bulut hesabı (sunucu) bu sürümde olsun mu? | **Hayır.** Yalnız arayüz hazırlığı yapılır (depolama arka ucu soyutlaması, `saveSeq`, sunucuda yeniden kullanılabilir şema). | Altyapı, maliyet ve KVKK kararı kullanıcıya ait. |
| K-8 | Silinen yuva 24 saat geri alınabilsin mi? (`.sil`) | Evet, isteğe bağlı. Kota baskısında ilk o budanır. | Başarısız ya da yanlış işlemde önceki kayıt korunur. |
| K-9 | (inceleme düzeltmesi) Korsan Kodu (S-b) ve host imzalı özet (S-c) Faz 4'te mi uygulansın? | **Hayır, Faz 5'te.** Faz 4 seçenek analizini ve `gbook`/`wtok` için depolama ve doğrulayıcı desteğini verir. | İkisi de Faz 2'nin kimlik ve defter yapısına dayanır; kayıt sürümü işinden bağımsızdır. |
| K-10 | (inceleme düzeltmesi) D-09'un kabul ölçütü ("konukta `dksh.guest.0.savedAt` güncelleniyor") Faz 2 kararıyla çelişiyor. Ölçüt nasıl okunacak? | **Yetkili kopya host'ta:** host'un `dksh.gbook.<w>` kaydı ve konuğun `dksh.wcache.<w>` önbelleği ≤ 120 sn'de güncellenir; `dksh.guest.0` bayt bayt aynı kalır. | Faz 2 nihai §4.2 ve G6/B-18 kabulleri `dksh.guest.0`'ın değişmemesini şart koşuyor. |
| K-11 | (inceleme düzeltmesi) Yedek kira kilidi ve BroadcastChannel gerekli mi? | **Hayır.** Web Locks (varsa, sekme içinde yeniden girişli) + `saveSeq` iyimser denetimi. | D-11 kabulü `saveSeq` ile kilitsiz de sağlanıyor; kira kilidi 5 sn'de bir yazım, bayat kilit riski (R-6) ve ek test yükü getiriyordu. |

---

## 1. Mevcut kayıt şemasının haritası (v0.4, w2)

### 1.1 Depolama anahtarları ve yazım yolu

`js/core/save.js` (88 satır) yalnız `localStorage` kullanıyor. Önek `dksh.` (3), yuva sayısı `SLOT_COUNT = 3` (4).

| Anahtar | Yazan (dosya:satır) | Okuyan | İçerik / not |
|---|---|---|---|
| `dksh.solo.{0,1,2}` | `save.write` (save.js:15-30) ← `handlers.saveNow` (main.js:212) | `save.read` (38-45) ← `menu.slotScreen` (menu.js:139, 145), `save.latest` (61-68), `save.list` (52-59) | `game.serialize()` + `appearance` (main.js:211) |
| `dksh.online.{0,1,2}` | aynı yol (`G.saveKind==='online'`, main.js:212) | `handlers.startOnlineHost` (main.js:178), `menu.hostScreen` (menu.js:186) | aynı biçim |
| `<anahtar>.tmp` | save.js:19 (yazımda); başarıda silinir (24) | save.js:43 (ana kayıt geçersizse) | ara kopya |
| `<anahtar>.bak` | save.js:21-22: önceki ana kayıt **doğrulanmadan** kopyalanır | save.js:43 | **tek kuşak** (D-12) |
| `dksh.guest.0` | main.js:203 (`saveNow` konuk dalı) | main.js:191 (`startOnlineGuest`) | `{inv, progress, quests, savedAt, name}` |
| `dksh.progress.guest` | `progress._guestSave` (progress.js:110); çağıranlar 91 (autosave, konukta hiç tetiklenmez), 108 (stop), 138 (seviye), 149 (yetenek) ve (inceleme düzeltmesi) main.js:204 (`saveNow` konuk dalı) | progress.js:98 (yalnız `guest.0.progress` yoksa) | `progress.save()`; ikinci kaynak (D-09) |
| `dk_progress_guest` | v0.3 progress.js:58 | progress.js:98 → yeni anahtara taşınır, eskisi silinir | v0.3 kalıntısı |
| `dksh.profile` | `save.writeProfile` (save.js:73-75) ← `'profileChanged'` (main.js:86) | `save.profile` (70-72) ← `boot` (main.js:83-85) | `{appearance, unlocked, recentRooms}`; yedeği ve sürümü yok |
| `dksh.settings` | `settings.save` (settings.js:36) | `settings.load` (24-35) | ayarlar; eski tuş göçü (30) |
| `dksh.t` | `save.available` (save.js:10) | — | yoklama, hemen silinir |

- **Yazım (save.js:15-30):** `JSON.stringify` **try dışında** (17). Ardından `.tmp`'ye yazılır (19), okunup ayrıştırılarak denetlenir (20), önceki ana kayıt `.bak`'a kopyalanır (21-22), ana kayıt yazılır (23), `.tmp` silinir (24). Hata olursa `false` döner (26-29).
- **Okuma (save.js:33-45):** `valid()` yalnız `player.inv` varlığına ve `version`'ın türüne bakar (36). Ana kayıt geçersizse sırayla `.bak` ve `.tmp` denenir (43).
- **Dışa aktarma (save.js:77-81):** `dksh.` önekli **bütün** anahtarları, `.bak`/`.tmp` dahil, düz `{anahtar: dize}` olarak verir. Dosya adı `son-hazine-kayitlar.json` (settingsPanel.js:72-75).
- **İçe aktarma (save.js:82-87):** Önekli her değeri ham `setItem` ile yazar. Doğrulama, onay, kota yakalama ve geri alma yok (D-04).

### 1.2 Kayıt verisi: `game.serialize` (game.js:161-178) ve yükleme (`game.start`, game.js:101-150)

| Alan | Yazılan (game.js) | Yükleyen | Not |
|---|---|---|---|
| `version` | 164: sabit `1` | yalnız save.js:36 (tür) | D-05 |
| `savedAt` | 165: `Date.now()` | save.js:56, 65; menu.js:80, 143 | |
| `playTime` | 166 | game.js:142 | |
| `name` | 167: `G.playerName` | menü kartları; main.js:165 bildirimi | |
| `player.pos` | 169; yüzüyorsa 175 → `lastSafe` | game.js:122-125 (arazi hazırlığı 124) | |
| `player.hp` | 169 | game.js:130 | |
| `player.inv` | 169 → `Inventory.toJSON` (inventory.js:76) | `p.inv.load` (game.js:129; inventory.js:77-82, şema denetimi yok) | |
| `player.onShip/lx/lz` | 170 (yalnız deck/helm/cannon; `boat` yok) | game.js:131 `boardShip` | D-16 |
| `ship` | 172 → `Ship.serialize` (ship.js:694-703) | `shipControl.createPlayerShip` (game.js:117; shipControl.js:22-39) | `sunk` 34; kayık her zaman yanaşık kurulur (37) |
| `world` | 173: `{hour, weather, windDir, wetness}` | game.js:137-141, 146 | **Dikkat:** `world` anahtarı dolu; yeni dünya bölümü başka bir ad alır (§6.3) |
| `appearance` | main.js:211 (serialize dışında) | main.js:161 | |
| sistem bölümleri | 176: `data[s.saveKey \|\| s.name] = s.save()` | 144: `await s.start(data, opts)` (try yok) | sıra kayıt sırasıdır (main.js:103) |

### 1.3 Sistemlerin kaydettikleri

Kayıt sırası (main.js:103): `misc, time, bodies, effects, combat, treasure, enemies, animals, megafauna, fish, fishing, seagear, npcs, islands, hazards, bosses, quests, progress, events, worldEvents, weatherfx, details, crowd`.

| Bölüm | `save()` | `start(data)` | Alanlar | Test (audit_D) |
|---|---|---|---|---|
| `misc` | main.js:78 | main.js:77 | `crewHired`, `ownedShips` | yok |
| `time` | time.js:77 | time.js:69-75 | `day`, `log` (son 200; bellekte en çok 250, 136-139) | yok |
| `treasure` | treasure.js:120-127 | treasure.js:105-117 | `found{siteId: Date.now()}` (230; 8 dk soğuma 218), `chests` (ground/water/carried/boat; 124), `holes` (son 20) | 08 (taşınan sandık) |
| `enemies` | enemies.js:1662 | enemies.js:1311-1322 (1319 aynen kopya) | `groups{id:{spawned, cooldown, nightDone, killed}}` | 08, 12 (yalnız `spawned:false`); D-07 |
| `islands` | islands.js:269 | islands.js:253-267 | `opened[]`, `freed[]`, `temples{fid:{seq, done}}` (eski sarmalayıcı onarımı `puzzleState` 35-39) | 08, 12, 13 P08 |
| `hazards` | hazards.js:86 | hazards.js:76-84 | `solved[]`, `looted[]`, `gone[]` | 08 (yalnız `core_kamp`) |
| `bosses` | bosses.js:1053 | bosses.js:1048-1051 | `defeated{id:true}` (1067) | yok |
| `quests` | quests.js:121-124 | quests.js:76-94 | `stage, flags, side, completed, discovered, fog, stats, collection, achievements, markers, boardSeed` | yok |
| `progress` | progress.js:109 | progress.js:94-107 | `level, xp, points, skills, seen` | yok |

**Kaydetmeyen ama kalıcı olması gereken durum:**

| Durum | Yer | Sorun |
|---|---|---|
| `seagear.wreckOpened` | seagear.js:115, 128 (`start()` sıfırlar), 133 | D-08 |
| Kaya tuzağı durumu | hazards.js:297-345 (her kurulumda `'set'`), 347-356, 416-425 | D-13 |
| Ganimet keseleri | treasure.js:550-576 (`keep` kese 30 dk, 179) | D-14 |
| Kabuk/istiridye zamanlayıcısı | details.js:368-370 (start hepsini geri getirir), 381 (`taken=240` sn), 503 | yenilenen kaynak; yüklemede sıfırlanıyor |
| Kayık ve oyuncu kipi | game.js:170-175; shipControl.js:37 | D-16 |

**Kalıcı olmaması gereken ama kaydedilen durum:** `quests.flags.morvanSpawn/kizilSpawn` (quests.js:276-290; D-17) ve `enemies.groups[*].spawned/nightDone` (D-07).

**(inceleme düzeltmesi) İlk taslakta gözden kaçan, kayda giren alanlar:**

| Alan | Yer | Not |
|---|---|---|
| `ship.hold.fish` | fishing.js:248 (`store`: çanta doluysa güvertede ambara), panels.js:101 ("Ambara koy"), panels.js:150-151 (ambar paneli); `Ship.serialize` `hold`'u olduğu gibi yazar (ship.js:698) | Balık verisi dizisi. Gemi şemasında bulunmalı; yoksa doğrulayıcı ambar balıklarını siler. Panel `itemCell` → `iconSVG(s, color)` üzerinden YB-2 yüzeyidir. |
| Balık yığını `data` | `fishing.makeCatch` (fishing.js:232-243) | `zone` = yakalanan adanın adı (`terrain.islandAt`) ya da "Açık deniz"; `bait` = yem ya da araç adı (fishing.js:255); `time`/`date` = yakalama anı; `value` = `round(FISH.value·(0,6+0,4·ağırlık/ortalama))` (236). Bunlar FISH'te yok ya da başka anlamdadır (FISH.zone `reef/open`, FISH.bait dizi, FISH.time en uygun saat). Defter koleksiyonu bu alanları gösterir (journal.js:163). |
| `quests.markers` (online host) | net.js:359: host konuk işaretlerini `> 60 → shift` ile 61'e kadar tutar, `note` 80 karaktere kadar | Tek oyunculu sınır 30'dur (`placeMarker`), online host kaydında 61. Faz 2 şeması da `markers ≤ 61`. |

### 1.4 Konuk kaydı, profil ve ayarlar

- **Konuk (main.js:187-206):** Katılımda `{player:{inv, hp:100}, progress, quests}` yüklenir (193). Kayıt yalnız menüye dönüş (218), host ayrılışı (315), WebGL kaybı (380), `beforeunload` (382-384) ve `visibilitychange` (385) anlarında yazılır. Periyodik kayıt yalnız host'ta (game.js:218) ve konuğun "Kaydet" düğmesi yok (menu.js:348) (D-09). Konuk kaydı hikâye `stage`/`flags`'ini de taşıyor (main.js:203). `applyWorld` bayrakları değiştirmek yerine birleştiriyor (main.js:336). Konuk ilerlettiğinde `netStory` bayrakların tamamını gönderiyor (quests.js:134, 317), host da bunları denetimsiz yazıyor (net.js:329) (D-02). (inceleme düzeltmesi) Konuk tarafında host'tan gelen `story` iletisi de bayrakları birleştiriyor (net.js:568).
- **Profil:** Kilitler bütün yuvalarda ortak (shop.js:248-254, creator.js:14-15). Yedeği, sürümü ve doğrulaması yok.
- **Ayarlar:** `{...DEFAULT_SETTINGS, ...s}` (settings.js:31). Bilinmeyen anahtarlar da yüklenir.

### 1.5 v0.3 ile v0.4 kayıtlarının farkları

| Alan | v0.3 (`762f1c7`) | v0.4 (`44d548c`) |
|---|---|---|
| `version` | `1` (game.js:156) | `1` (game.js:164): **aynı damga** |
| `islands` | **yok**. `opened/freed` yalnız bellekte (v03 islands.js:566-567, 672-673, 762-767); başlatmada sıfırlanmaz, oturumda yuvalar arasında sızar | `{opened, freed, temples}` (islands.js:269) |
| `hazards` | `{solved, looted}` (v03 hazards.js:81) | `+ gone` (86) |
| `ship.sunk` | yok (v03 ship.js:687-695) | var (ship.js:701) |
| `treasure.chests` | yalnız ground/water (v03 treasure.js:75) | + carried/boat (124) |
| `enemies.groups` | **yazılır ama okunmaz**: start `groupState = {}` (v03 enemies.js:1290-1297), save 1620 | yazılır ve okunur (1319) → v0.3 kaydındaki `spawned` bayrakları v0.4'te D-07'yi tetikler |
| Konuk kaydı | `{inv, savedAt, name}` (v03 main.js:201) + `dk_progress_guest` | `+ progress, quests` (main.js:203) + `dksh.progress.guest` |
| `save.read` | doğrulamasız (v03 save.js:32-38) | `valid()` (33-37) |
| Envanter, verili yığın | `data ? 1 : n` yığın (v03 inventory.js:38) | `n` ayrı yığın (38) |
| `misc`, `time`, `bosses`, `quests`, `progress`, `profile`, `settings` | biçim aynı (`diff` ile doğrulandı; settings.js'de yalnız eski tuş göçü eklendi) | aynı |

**Ayırt etme işaretleri:** İki sürüm de `version: 1` yazdığı için ayrım içerikten yapılır. v0.4 kaydında `islands` anahtarı **her zaman** vardır (`islands.save` her kayıtta çalışır). Ayrıca `hazards.gone` bir dizidir ve `ship` doluysa `sunk` alanı bulunur. Üçünden biri varsa kayıt v0.4'tür, hiçbiri yoksa v0.3'tür (§2.3).

### 1.6 Zayıflık eşlemesi ve yeni bulgular

D-01…D-19 audit_D.json'daki tanımlarıyla aynen geçerli. Bu tasarımda ele alındıkları yer: D-01 §6.4/§6.7; D-02 §8.2; D-03 §8.1; D-04 §5; D-05 §2; D-06 §4.6; D-07 §6.6; D-08, D-13, D-14, D-19 §6.4 ve §6.7; D-09 §8.3; D-10 §5.5; D-11 §4.8; D-12 §4.3-4.5; D-15 §7.2; D-16 §6.5; D-17 §6.6; D-18 §9.2.

Kod okumasında audit'te olmayan şu bulgular çıktı. Hepsi kalıcılık ya da kayıtla ilgili.

| No | Bulgu | Kanıt | Etki | Ele alındığı yer |
|---|---|---|---|---|
| **YB-1** | Kalıcı durum ada üretiminin RNG akışını kaydırıyor | `_prison` kurtarılmış tutsağın `_npc`'sini atlıyor (islands.js:956-957). `_npc` iki `R()` çekiyor (530-531). Aynı `R`, özelliklerden sonra `_seaStacks`'e geçiyor (358, 1058-1076). Demirkapı'nın tek özelliği hapishane; r=270, 3 kayalık (Ek A). | Tutsak kurtarıldıktan sonra yeniden kurulumda kayalıklar ve onların `Ship.obstacles` ile çarpıştırıcıları (1073-1076) yer değiştiriyor. Demirli gemi kayanın içinde kalabilir. | §6.2 |
| **YB-2** | Kayıttan gelen veri `innerHTML`'e giriyor | Balık yığını `data.color` → `iconSVG` (items.js:134; panels.js:33). `data.name/zone` ve harita `data.island` → `itemTip` (panels.js:22-26). Yuva adı → `ui.confirm(html)` (menu.js:146; ui.js:92) | İçe aktarılan, yani başkasından gelen bir kayıt dosyası saklı XSS taşıyabilir (B-06'nın kayıt yolu) | §3.3 (veri yeniden türetilir); kaçış Faz 2 B-06'da |
| **YB-3** | Yan görev ödülü kayıttan okunuyor | `acceptSide` şablonu kopyalıyor (quests.js:238). `_sideCheck` `shop.earn(q.reward)` çağırıyor (213) | İçe aktarılan dosyayla ödül keyfî değiştirilebilir | §3.3 (şablondan yeniden türetme) |
| **YB-4** | `game.start` hatasında `autosaveT` sıfırlanmıyor | Sıfırlama 147'de, sistem döngüsünden (144) sonra | D-06'daki karışık durum, önceki oturumdan kalan sayaçla birkaç saniyede yazılabilir | §4.6 |
| **YB-5** | GitHub Pages kökeni paylaşımlı | Canlı adres `adnanerdem2000-sudo.github.io/SON-HAZ-NE/` (Faz 0 belgesi §1). Köken, kullanıcının **bütün** Pages projeleri için ortak | localStorage kotası (~5 MB) diğer projelerle bölüşülür. "Site verisini sil" hepsini siler. | §4.9, §11 |
| **YB-6** | Ölü alan `once: true` | islands.js:746; hiçbir yerde okunmuyor | D-19'un kök nedenine katkı (`cond` yok) | §6.4 |

**(inceleme düzeltmesi) İncelemede doğrulanan ve tasarımı etkileyen ek gerçekler:**

- `js/` altında `game.js` dışında **29** `G.state` okuması var (main.js de hariç tutulursa 20); ilk taslaktaki "16" yanlıştı. Hiçbiri bir sistemin `start`'ında değil; `islands.update` (islands.js:273) ve `details._updateTrader` (472) yalnız `update`'te okur ve "yükleniyor" durumunda `update` zaten çalışmaz.
- 13_donma P08 `islands.start({islands: d})`'yi doğrudan çağırır (13_donma.js:59); `startGame` kullanmaz. 08_kalicilik.js:8-10 ve 12_kayit_dongusu.js:7 `DK.islands.opened/freed/templeState` ve `DK.hazards.gone`'a doğrudan erişir.
- 08_kalicilik.js:30, 12_kayit_dongusu.js:7 ve 14_deniz_ekipmani.js:86 aynı sekmede `toMenu` olmadan aynı yuvaya ikinci kez `startGame` çağırır. Yuva kilidi bu yüzden sekme içinde yeniden girişli olmalıdır (§4.8).
- Konuk→host iletilerinin 64 KB sınırı (net.js:42, 248) host→konuk yönüne uygulanmaz. Host→konuk JSON iletisinde bağlayıcı sınır PeerJS 1.5.5'in 16 300 baytlık gönderim eşiğidir: aşılırsa ileti gönderilmez, `'error'` yayılır (vendor/peerjs/peerjs.min.js, `_send`), net.js:233 de bağlantıyı düşürür (Faz 2 nihai Y-1).
- Bugün hiçbir adada plakalı harabe (`_puzzleSite`), aynı adanın kamp/kale/maden fıçılarından **sonra** kurulmuyor (Node: `inceleme_yakinlik.mjs`, 0 çift). Kalıcı duruma bağlı çarpıştırıcıların plaka aramasını etkilemesi bugün kuramsaldır.

---

## 2. Sürümlü şema

### 2.1 Üst bilgi alanları (v3)

v3 kaydı **düz nesne olarak kalır**. `player`, `ship`, `quests`… üst düzeyde durur. Böylece v0.3 ve v0.4 okuyucuları v3 kaydını açabilir (ileri okuma, §2.7). Üst bilgi alanları da aynı düzeyde yer alır.

| Alan | Tür | Anlam | Yazan |
|---|---|---|---|
| `version` | tamsayı | **Kayıt şeması sürümü.** 1 = v0.3, 2 = v0.4 (diskte 1 yazılıdır; içerikten ayırt edilir), 3 = v0.5 | `game.serialize` |
| `minReader` | tamsayı | Kaydı güvenle açabilecek en eski şema. Yalnız alan ekleyen sürümde `version`'dan küçük olabilir. v0.5'te 3. | `game.serialize` |
| `game` | dize ≤ 16 | Yazan derleme (`'0.5.0'`). Yalnız bilgi ve mesaj için. | `game.serialize` |
| `kind` | `'solo' \| 'online' \| 'guest'` | Yuva türü. Tek yuvalık içe aktarmada hedefi belirler. | `game.serialize` / konuk yazıcısı |
| `worldId` | dize 8-40 `[A-Za-z0-9_-]` | Dünya kimliği. İlk başlatmada üretilir, sonra değişmez. ⟷UYUM-1 | `game.start` (yoksa üretir) |
| `createdAt` | ms | Dünyanın ilk kaydı. v2'den göçte `savedAt` kullanılır. | göç / ilk kayıt |
| `savedAt` | ms | Kaydın zamanı | `store.commit` |
| `saveSeq` | tamsayı ≥ 0 | Yuva başına her yazımda bir artar. İki sekme ve çakışma denetimi için. | `store.commit` (serialize yazmaz) |
| `_sum` | 8 onaltılık | Gövdenin FNV-1a 32 özeti. **Son anahtardır.** Bütünlük işaretidir, güvenlik sağlamaz. | `store.commit` |
| `extra` | nesne ≤ 32 KB | Bilinmeyen üst alanlar; çöken yolları olan bilinmeyen sandık kademesi ve gemi tipi; tanınmayan yan görev. Korunur, geri yazılır ve tanınınca geri birleştirilir (§2.6). (inceleme düzeltmesi: bilinmeyen eşyalar envanterde kalır) | `saveSchema.prepare` / serialize |

**K-1 kararının gerekçesi:** v0.4 `valid()` her sayısal sürümü kabul ediyor (save.js:36), v0.3 hiç denetlemiyor (v03 save.js:32-38). Bu yüzden `version: 3` eski okuyucuları kırmaz. `saveSeq` ve `_sum` serialize çıktısında yer almaz, depo yazımda ekler. Bu sayede 12_kayit_dongusu.js'deki kayma karşılaştırması etkilenmez (§10.5).

**Bütünlük işareti (FNV-1a):** `json0 = JSON.stringify(gövde)`, `sum = fnv(json0)`. Yazılan değer `json0.slice(0,-1) + ',"_sum":"' + sum + '"}'` olur. Okurken dizenin sonundaki `,"_sum":"xxxxxxxx"}` ayrılır ve özet karşılaştırılır. Yeniden ayrıştırma gerekmez, birebir sonuç verir. v0.4 okuyucusu `_sum`'ı bilinmeyen alan sayıp yok sayar. Node'da denendi (Ek A): mühür doğru, kurcalanmış dize `false`, mühürsüz eski kayıt `null` ("bilinmiyor") döndü. **Özet uyuşmazlığı tek başına ret nedeni değildir.** Kayıt sıkı doğrulamaya alınır ve kullanıcıya "elle değiştirilmiş olabilir" uyarısı gösterilir (§4.5).

### 2.2 Şema sürümleri

| Şema | Sürüm | Tanıma | Fark |
|---|---|---|---|
| 1 | v0.3 | `version` 1 ya da yok + hiçbir v0.4 işareti yok | §1.5 |
| 2 | v0.4 | `version` 1 ya da yok + v0.4 işareti var | §1.5 |
| 3 | v0.5 | `version === 3` | §2.4 ve §6.3 |
| ≥ 4 | gelecek | `version > 3` | §2.5 |

### 2.3 v0.3 ve v0.4 kayıtlarını ayırt etme

```js
// js/core/saveSchema.js
export function detect(d) {
  if (!isPlainObject(d)) return { v: null, why: 'nesne değil' };
  if (d.version === undefined || d.version === 1) {
    const v04 = ('islands' in d) || Array.isArray(d.hazards?.gone)
             || (isPlainObject(d.ship) && 'sunk' in d.ship);
    return { v: v04 ? 2 : 1 };
  }
  if (Number.isInteger(d.version) && d.version >= 2 && d.version <= 999)
    return { v: d.version, min: Number.isInteger(d.minReader) ? d.minReader : d.version };
  return { v: null, why: 'geçersiz sürüm alanı' };      // '3', -1, 1.5 … → bozuk kayıt muamelesi
}
```

- **Kenar durumu:** v0.4 kaydını v0.3 açıp kaydederse kayıt v0.3 biçimine düşer (`islands` kaybolur) ve doğru olarak 1 tanınır. v0.3 kaydını v0.4 açıp kaydederse 2 tanınır. İçerik neyse şema da odur.
- **Konuk kaydı:** v0.3 `{inv, savedAt, name}` → 1. `progress` ya da `quests` alanından biri varsa → 2. `version` 3 ise → 3.
- **Node prototipi** (`/tmp/tasarim_x/proto_migrate.mjs`, Ek A): v0.3 benzeri → 1, v0.4 benzeri → 2, `{version:999}` → gelecek, `{version:4, minReader:3}` → gelecek-uyumlu, `{version:'3'}` → geçersiz.

### 2.4 Migrasyon zinciri

Kurallar:
- Her adım saf bir fonksiyondur: `M[n](d, notes) → d'`. Girdinin kopyası üzerinde çalışır (prototipte "girdi değişmedi" doğrulandı). Rastgelelik ve zaman kullanmaz; `worldId` gibi üretilen değerler göçte değil `game.start`'ta atanır.
- `migrate(d)`: `detect` → `for v in [from..2]: d = M[v](d)`. Her adım `version`'ı bir artırır.
- **Tembel göç.** Kayıt yalnız bellekte dönüştürülür. Diske v3 ancak oyun o yuvayı kaydettiğinde yazılır. İlk v3 yazımından önce özgün dize `<anahtar>.pre3`'e **bir kez** kopyalanır. Önyüklemede toplu göç yapılmaz: bir göç hatası bütün yuvaları aynı anda bozamaz.
- **Ayrıca onarım katmanı:** Göçten sonra `validate` her zaman çalışır (§3). Göç "biçim değişikliği", doğrulama "değer düzeltmesi" yapar.

| Adım | İşlem | Gerekçe / kaynak |
|---|---|---|
| **1→2** | `islands = {opened:[], freed:[], temples:{}}` | v0.3 bu durumu hiç saklamıyordu. Kurtarılacak veri yok; adalar "açılmamış" sayılır. Not: bilgi. |
| | `hazards.gone = []`; `solved/looted` korunur | v03 hazards.js:81 |
| | `ship.sunk = false` (ship doluysa) | v03 ship.js:687-695 |
| | `enemies.groups = {}` | v0.3 bu durumu yazıyor ama hiç okumuyordu (v03 enemies.js:1290-1297). Korunursa D-07 tetiklenir. |
| | Konuk (ithalat kaynağı, yalnız bellekte): `progress` alanı depo katmanında `dk_progress_guest` ya da `dksh.progress.guest`'ten doldurulur (§8.3). (inceleme düzeltmesi) Diske geri yazılmaz; Faz 2 nihai §4.2 gereği bu anahtarlar salt okunurdur. | v03 progress.js:58 |
| **2→3** | Üst bilgi: `version:3, minReader:3, game, kind, createdAt = createdAt ?? savedAt`. `saveSeq` yoksa 0. | §2.1 |
| | `enemies.groups[*]`: `spawned=false, nightDone=false`; `cooldown` ve `killed` korunur | D-07 |
| | `quests.flags`: `morvanSpawn` ve `kizilSpawn` silinir | D-17 |
| | Hikâye tutarlılığı (§3.4): aşamaya göre olanaksız bayraklar silinir (`gunluk` aşama < 3 vb.) | D-02 kirlenmesinin temizlenmesi |
| | `quests.side` şablondan yeniden türetilir: `id` ile `SIDE_TEMPLATES` eşlenir; `title/text/type/key/need/reward` şablondan gelir; `progress` 0…need aralığına sıkıştırılır; bilinmeyen `id` → `extra.side`; (inceleme düzeltmesi) `completedIds` başlıklardan türetilir (§3.3) | YB-3 |
| | Konuk kaydı (ithalat kaynağı, yalnız bellekte): `quests.stage/flags/markers/boardSeed` atılır; kalan kişisel alanlar **`quests` adı altında** kalır. (inceleme düzeltmesi) İlk taslaktaki `quests → pq` yeniden adlandırması §2.6'daki yalnız-ekleme kuralını bozuyordu (v0.4 main.js:193 `guest.quests` okur); ayrıca Faz 2 kararıyla `dksh.guest.0` hiç yazılmaz. `pq` adı yalnız Faz 2'nin `wcache`/`gbook` profillerinde kullanılır. | D-02 |
| | Yeni bölüm `worldState: {v:1, gen, boulders:{}, res:{}}`; `ship.boat = null` (inceleme düzeltmesi: kayık gemi bölümünde, `taken` Faz 6'da) | §6.3 (`world` anahtarı dolu, §1.2) |
| | `treasure.pickups = []`, `misc.cosmetics = []`, `player.mode = onShip ? 'deck' : 'ground'` | D-14, D-15, D-16 |

**Göç notları** `{düzey:'bilgi'|'onarım'|'kayıp', metin}` biçimindedir. Yükleme diyaloğunda yalnız `onarım` ve `kayıp` düzeyindekiler gösterilir. Hepsi `console.info`'ya yazılır. Prototip çıktısı Ek A'da.

### 2.5 Bilinmeyen ve gelecek sürüm

| Durum | Davranış | Kullanıcı mesajı |
|---|---|---|
| `version` tamsayı değil, negatif ya da 999'dan büyük | **Bozuk kayıt** sayılır. Kurtarma akışı yedekleri dener (§4.5). | "Yuva 1'in son kaydı okunamadı (biçim hatası). En yeni sağlam yedek: …" |
| `version > 3` ve `minReader ≤ 3` | **Salt-okunur açılabilir** (K-5). Oturumda `G.saveBlocked='readonly'` (inceleme düzeltmesi: ilk taslakta burada `'future'`, §4.7'de `'readonly'` yazıyordu): otomatik ve elle kayıt kapalı. Yalnız "Boş yuvaya kopya kaydet" serbesttir; bu kopya v3 olur ve yeni sürüm verileri kaybolur, kullanıcı ayrıca onaylar. | "Bu kayıt oyunun daha yeni bir sürümüyle (0.6.0) yapılmış. Bu sürümde **yalnız izleme amaçlı** açılabilir; ilerleme kaydedilmez. Kayıt değiştirilmedi." |
| `version > 3` ve `minReader > 3` | **Açılmaz.** Kart kilitli görünür. İzin verilen işlemler: "Dışa aktar" ve çift onaylı "Sil". | "Bu kayıt oyunun daha yeni bir sürümüyle (0.6.0) oluşturulmuş. Bu sürüm onu güvenle açamaz; kayıt değiştirilmedi. Oyunu güncelleyip yeniden dene ya da kaydı dışa aktar." |
| Ana kayıt gelecek sürüm, `.bak`/`.h1` daha eski şema | Eski yedeğe **sessizce düşülmez**: bu bir sürüm düşürmedir, ilk kayıtta yeni sürüm verisi ezilirdi. Yedekler panelinde yalnız "Yedeği **boş bir yuvaya** kopyala" seçeneği çıkar. | "Bu yuvanın v0.5 ile yapılmış eski bir yedeği var (12.11 22:10). Yeni sürüm kaydını korumak için yedek yalnız boş bir yuvaya kopyalanabilir." |

### 2.6 İleri uyumluluk

- **Yalnız ekleme kuralı (v3.x):** v0.5 ömrü boyunca mevcut v0.4 alanlarının adı, türü ya da anlamı değişmez. Yalnız alan eklenir. Mevcut bir alanın biçimi değişecekse `version` 4 olur ve `minReader` 4'e çıkar. Bu kural sayesinde v0.4 bir v3 kaydını açtığında yalnız yeni bölümleri kaybeder (§2.7).
- **Bilinmeyen üst alanlar** (`prepare` sırasında tanınmayan anahtarlar) `extra.top`'a taşınır; `serialize` bunları kayda aynen geri yazar; sınır 32 KB, aşılırsa not düşülür. Bilinen üst bilgi alanları (`version, minReader, game, kind, worldId, createdAt, savedAt, saveSeq, _sum, appearance`) bu kurala girmez.
- (inceleme düzeltmesi) **Bilinmeyen eşya kimliği envanterde kalır.** Kod bunu zaten tolere ediyor: `itemName` kimliği döndürür (items.js:109), `itemWeight` 0,1 kg varsayar (118-119), `sellPrice` 0 döndürür (shop.js:55-56), simge `map` olur (items.js:131). İlk taslaktaki envanterden `extra.items`'a taşıma gereksizdi ve geri birleştirme kuralı yoktu. Bilinmeyen balık anahtarı (`balik:<x>`) da yerinde kalır; görüntü alanları metin olarak temizlenir.
- **`extra`'ya yalnız çöken ya da anlamsız kalan veriler alınır:** bilinmeyen sandık kademesi (`extra.chests`; treasure.js:266-268 `T.scale` çöküşü), bilinmeyen gemi tipi (`extra.ship`; ship.js:20 `SHIP_TYPES[typeId]`; gemi `sloop` olarak kurulur, `kayıp` notu), tanınmayan yan görev (`extra.side`). Böylece bugünkü çökme yolları kapanır.
- (inceleme düzeltmesi) **Geri birleştirme:** `prepare` her yüklemede `extra.chests/ship/side` öğelerini katalogla yeniden dener; tanınanlar asıl yerine döner (gemi: `typeId` tanınıyorsa `extra.ship` geri yüklenir ve `ownedShips`'e eklenir). Gerekçe: yalnız-ekleme kuralında yeni içerik `version`'ı artırmaz; v0.5.0 bir v0.5.1 kaydını açıp kaydedebilir, v0.5.1 tekrar açınca veri asıl yerine dönmelidir. `kayit_sema.mjs` bu gidiş-dönüşü sınar.

### 2.7 Sürüm düşürme: v3 kaydını eski sürümün açması

- **v0.4:** Kaydı yükler, çünkü `version` sayıdır. `worldState`, `treasure.pickups`, `misc.cosmetics`, `player.mode` ve `extra` bölümlerini yok sayar ve ilk kayıtta düşürür. `islands` ve `hazards` biçimi değişmediği için ada sandıkları, tutsaklar, fıçılar ve bulmacalar korunur. **Martı Batığı** `islands.opened`'a yazıldığı için (§6.4) v0.4'te de korunur, ama v0.4 onu okumaz. (inceleme düzeltmesi) `ship.boat` ve `quests.completedIds` de düşer; ikisi de yalnız ek alandır.
- **v0.3:** Kaydı doğrulamasız yükler. `islands`, `hazards.gone` ve yeni bölümler kaybolur. Bu durum v0.3'ün kendi sınırıdır (D-05 etkisi).
- **İsteğe bağlı kurtarma (düşük öncelik, Adım 11):** Ana kayıtta `version:1` ve `_sum` yok, ama `.bak` ya da `.h1` `version:3` ise yuva "eski sürümle üzerine yazılmış" sayılır. Bu durumda ana kayıt 2→3 göçünden geçer. Yalnız v3'e özgü bölümler (`worldState`, `treasure.pickups`, `misc.cosmetics`, `extra`) en yeni v3 kuşağından geri birleştirilir. Kullanıcıya şu bildirim gösterilir: "Bu yuva eski bir sürümle kaydedilmiş; yeni sürüme özgü dünya ayrıntıları son v0.5 kaydından geri alındı." (inceleme düzeltmesi) Bu kurtarma `worldId` ve `createdAt`'i de geri alır. Online yuvada `worldId` önce Faz 2'nin `dksh.gslot.<N>` eşlemesinden okunur (Faz 2 nihai §2.2); böylece v0.4 gidiş-dönüşünde `gbook` bağı kopmaz. `worldId` geri alımı isteğe bağlı değildir, Adım 3'te uygulanır; yalnız bölüm birleştirmesi Adım 11'de kalır.

---

## 3. Doğrulama

### 3.1 İlkeler

1. **Tek doğrulayıcı.** `saveSchema.validate(d, {kind, cat, strict})` saf bir fonksiyondur ve Node'da test edilir. Kullanıldığı yerler: yerel okuma, içe aktarma, eski konuk kaydı (ithalat kaynağı), host'un konuk profilleri (⟷UYUM-2) ve konuğun host'tan aldığı dünya verisi (inceleme düzeltmesi: Faz 2'nin `worldPart.feats`'i; ⟷UYUM-4, B-18).
2. **RET yalnız yapısal bozulmada uygulanır:** JSON ayrıştırılamıyor, kök nesne değil, `player` ya da `player.inv` nesne değil (konukta `inv`), boyut sınırı aşılmış, nesne derinliği 12'den fazla, `version` geçersiz. RET olan kayıt yerine yedek denenir.
3. **Diğer her şey ONARılır:** sayı sıkıştırılır, tür düzeltilir, eksik bölüm varsayılana döner, dizi kırpılır, çöken yolu olan bilinmeyen öğe `extra`'ya taşınır (inceleme düzeltmesi: bilinmeyen eşya yerinde kalır, §2.6). Her onarım not düşer. `kayıp` düzeyindeki notlar (eşya ya da altın azaldı, bölüm sıfırlandı) yükleme öncesinde kullanıcıya gösterilir.
4. **Bilinmeyen kimlik silinmez.** Biçimi geçerli (`/^[A-Za-z0-9_\-]{1,64}$/`) ama katalogda olmayan kimlikler korunur ama uygulanmaz. 08_kalicilik testi `test_chest_1`, `altartest`, `tapinak_x_1` yazıyor (satır 8-10), gelecekteki içerik de böyle kimlikler getirebilir. Biçimsiz kimlik atılır.
5. **Görüntülenen metin mümkünse katalogdan türetilir, değilse metin olarak temizlenir.** (inceleme düzeltmesi) Balığın `name`, `rarity` ve `color` alanları `FISH[key]`'den gelir (`color = FISH[key].colors[0]`); `value` aynı formülle ağırlıktan yeniden hesaplanır (fishing.js:236). Yakalamaya özgü `zone`, `bait`, `time`, `date` FISH'ten türetilemez: korunur, `<>&"'` ve ters tırnak karakterlerinden arındırılır, ≤ 40 karaktere kısaltılır. Harita adası `DIG_SITES`'tan, yan görev metni ve ödülü şablondan gelir (YB-2, YB-3). Bu savunma derinliğidir. Asıl kaçış düzeltmesi Faz 2 B-06'dadır; ⟷UYUM-4.
6. **Sayılar** sonlu olmalıdır (JSON `NaN` yazamaz, `null` yazar). Konumlar dünya sınırları içinde olmalıdır: `WORLD_SIZE = 20000` (worldData.js:5) → |x|, |z| ≤ 10 500.
7. (inceleme düzeltmesi) **Sıkı kip (`strict`) tanımı.** İlk taslakta tanımsızdı. `strict:true` iki yerde kullanılır: (a) `commit` kendi çıktısını denetlerken yalnız RET ve `kayıp` notu üretir, yazılan veriyi değiştirmez; (b) `_sum` uyuşmazlığında yükleme, normal kipteki onarımlara ek olarak kullanıcıya "elle değiştirilmiş olabilir" bildirimini zorunlu kılar. Onarım kuralları iki kipte aynıdır; `kayit_sema.mjs` iki kipin aynı veriyi ürettiğini, yalnız notların farklı olduğunu sınar.

### 3.2 Katalog: doğrulayıcıya enjekte edilen sözlük

`saveSchema` saf kalmalıdır. Oysa FISH, SHIP_TYPES, SKILLS ve STORY THREE içe aktaran modüllerde duruyor (fish.js:1, shipModel.js:1, progress.js:1-5, quests.js:1). Bu yüzden katalog dışarıdan verilir:

```js
// js/main.js (boot) — canlı modüllerden
const cat = buildSaveCatalog({ ITEMS, CHEST_TIERS, FISH, RARITY, SHIP_TYPES, SKILLS, STORY, SIDE_TEMPLATES,
  ACHIEVEMENTS, COSMETIC_PRICES, DEFAULT_UNLOCKED, DIG_SITES, ISLANDS, POIS, BOSS_DEFS, ENEMY_TYPES, WEATHERS, worldIds });
```

- Node testleri katalog fikstürünü kullanır: `tests/fixtures/katalog_v05.json`. Fikstür bir tarayıcı adımıyla (`DK.saveCatalog()`) bir kez üretilir. Saf modüllerden (items.js, appearance.js, worldData/archipelago.js) gelen kısımlar Node'da doğrudan alınır.
- **Sapma testi:** Tarayıcı senaryosu canlı kataloğu fikstürle karşılaştırır. Yeni içerik eklenince fikstür bilinçli olarak güncellenir.
- (inceleme düzeltmesi) `SIDE_TEMPLATES` (quests.js:33) ve `CORE_SETS` (hazards.js:34) bugün dışa aktarılmıyor; katalog ve §8.1'deki `hazards.rebuildCore()` için `export` eklenir (davranış değişmez).

### 3.3 Alan alan şema

Kısaltmalar: **O** = onar, **R** = ret, **E** = `extra`'ya taşı. Aralıklar kapalıdır. "int" tamsayıya yuvarlanır.

**Üst bilgi ve oyuncu**

| Alan | Tür / aralık | En büyük | İhlalde |
|---|---|---|---|
| kök | düz nesne, derinlik ≤ 12, anahtar ≤ 64 | yuva 256 KB, konuk 64 KB | R |
| `version`, `minReader` | int 1…999 | | R (§2.5) |
| `savedAt`, `createdAt` | int ms ≥ 0; `savedAt > şimdi+1 gün` → şimdi | | O (bilgi) |
| `playTime` | sonlu 0…1e8 sn | | O |
| `name` | dize ≤ 20 (creator.js:96 `maxlength`); denetim karakterleri silinir, boşsa `'Korsan'`. (inceleme düzeltmesi) `cleanName` (net.js:41) tek oyunculu kayda uygulanmaz: kesme işareti, tırnak ve `&` içeren meşru adları ("Deniz'in Korsanı") her yüklemede değiştirirdi. Kaçış görüntüde yapılır (§5.5 `confirmText`, Faz 2 B-06). | 20 | O |
| `player` | nesne | | R |
| `player.pos` | {x,y,z} sonlu; \|x\|,\|z\| ≤ 10 500; y −60…600 | | O → liman doğuşu (game.js:122) |
| `player.hp` | 1…(100 + `demir_bilek` 45) | | O |
| `player.onShip` / `lx`,`lz` | bool / sonlu ≤ 30 | | O |
| `player.mode` (v3) | `ground\|deck\|helm\|cannon\|swim\|boat` | | O → `onShip?'deck':'ground'` |
| `player.inv` | nesne | | R |
| `inv.gold` | sonlu → int 0…1e9 | | O (1e9'u aşıyorsa `kayıp` notu) |
| `inv.capacity` | int 45…200 | | O → 45 |
| `inv.stacks` | dizi | 400 yığın | O (fazlası `kayıp`) |
| yığın `id` | ITEMS anahtarı ya da `balik:<FISH anahtarı>`; (inceleme düzeltmesi) biçimi geçerli ama bilinmeyen kimlik envanterde kalır (§2.6), yalnız biçimsiz kimlik atılır | 48 kr | O |
| yığın `n` | int 1…9999; yığılamayan eşyada (`ITEMS[id].stack` değil) n=1 | | O (yığılamayanda n>1 → en çok 50 ayrı yığına bölünür) |
| yığın `data` (balık) | (inceleme düzeltmesi) `{key = id'deki anahtar, weight 0…2000, len 0…2000}`; `name`, `rarity`, `color` (= `colors[0]`) FISH'ten; `value` = `round(FISH.value·(0,6+0,4·weight/ortalama))` (fishing.js:236); `zone`, `bait`, `time`, `date` korunur, metin olarak temizlenir (≤ 40). Anahtar FISH'te yoksa yalnız metin temizliği. İlk taslaktaki "`zone/bait/time/value` FISH'ten yeniden" kuralı bütün kayıtlarda balık değerini ve yakalama kaydını değiştirirdi. | | O (YB-2) |
| yığın `data` (`hazine_haritasi`) | `{site ∈ DIG_SITES.id \| null}`; `island` yeniden türetilir | | O |
| yığın `data` (`harita_parcasi`) | `{piece 1…4}`; `name`, `weight` yeniden (quests.js:177, 184) | | O |
| diğer eşyalarda `data` | yok | | O (silinir) |
| `sid` (Faz 2-B yığın kimliği) | tek oyunculu kayıtta olmaz; konuk profilinde dize ≤ 12 | | O (solo'da silinir) ⟷UYUM-9 |
| `appearance` | nesne ≤ 60 anahtar; değer sayı, bool ya da dize ≤ 32; renkler `/^#[0-9a-f]{3,8}$/i`; ad `name` kuralıyla (inceleme düzeltmesi: `cleanName` değil) | | O |

**Gemi** (`ship`; ship.js:18-55, 694-703)

| Alan | Kural | İhlalde |
|---|---|---|
| `ship` | nesne ya da `null` (`null` → varsayılan gemi, game.js:117-118) | O |
| `typeId` | ∈ SHIP_TYPES (`sloop`, `brigantine`) | O → `'sloop'`, özgün nesne `extra.ship` (kayıp notu) |
| `id` ≤ 40, `name` ≤ 24 (panels.js:564 maxlength) | metin temizliği | O |
| `look` | nesne ≤ 20 anahtar; değer sayı ya da dize ≤ 32 | O |
| `upg.{hull,sails,cannons}` | int 0…3 (shop.js:197) | O |
| `x`,`z`,`yaw` | sonlu, sınır içinde | O → limandaki demir yeri (shipControl.js:23-27) |
| `hp` | 0…`maxHp` (= tip.hp·(1+0,25·upg.hull)) | O |
| `water` | 0…1e4 | O |
| `holes` | ≤ 64 `{id, x, z, size 0…3}` | O |
| `hold.items` | ≤ 100 anahtar; değer int 0…999 (net.js:351 ile aynı); (inceleme düzeltmesi) bilinmeyen eşya kimliği yerinde kalır (`holdWeight` bilinmeyeni 1 kg sayar) | O |
| `hold.fish` | (inceleme düzeltmesi) ≤ 100 balık verisi; her biri balık yığını `data` kuralıyla (fishing.js:248, panels.js:101) | O |
| `hold.chests` | ≤ 40; `tier ∈ CHEST_TIERS`; `contents` ≤ 16 `[id, n 1…9999, data?]`; `data` yığın kurallarıyla (inceleme düzeltmesi) | O / E |
| `cannonballs`, `planks` | int 0…9999 | O |
| `sailTarget` | 0…1 | O |
| `parts` | 6 anahtar 0…100 (ship.js:42) | O |
| `mastHp` | uzunluk = tip direk sayısı, değer 0…100 | O (doldur ya da kırp) |
| `cannonHp` | uzunluk = model top sayısı | O |
| `anchorState` | `up \| down` | O |
| `sunk` | bool | O |

**Diğer bölümler**

| Bölüm.alan | Kural | İhlalde |
|---|---|---|
| `world` (v0.4 anlamı) | `hour` 0…24; `weather` dize ≤ 16 (`sky.setWeather` zaten temizliyor, sky.js:189-191); `windDir` sonlu; `wetness` 0…1 | O |
| `misc.crewHired` / `ownedShips` | bool / ⊆ SHIP_TYPES, ≤ 8, `ship.typeId`'yi içerir | O |
| `misc.cosmetics` (v3) | ≤ 64; ⊆ COSMETIC_PRICES anahtarları | O |
| `time.day` / `log` | int 1…100 000 / ≤ 200 `{day int, hour 0…24, text ≤ 160, kind ∈ {info,good,warn,story,boss}}` | O |
| `treasure.found` | ≤ 200 anahtar (DIG_SITES; bilinmeyen korunur), değer int ms | O |
| `treasure.chests` | ≤ 200; `tier ∈ CHEST_TIERS`; konum sınır içinde; `contents` ≤ 16 | O / E |
| `treasure.holes` | ≤ 20 `{x,z}` | O |
| `treasure.pickups` (v3) | ≤ 40 `{id ≤ 40, pos[3], items ≤ 16, from ≤ 40, ship id\|null, local[3]\|null, t 0…1800}`; `items` satırları `[id, n, data?]`, `data` yığın kurallarıyla (inceleme düzeltmesi) | O |
| `enemies.groups` | ≤ 400; `{spawned:false, cooldown 0…3600, nightDone:false, killed int 0…999}` | O (D-07) |
| `islands.opened` / `freed` | ≤ 4096 kimlik (biçim §3.1-4) | O |
| `islands.temples` | ≤ 64; `puzzleState` (islands.js:35-39) kuralı: `seq` ≤ 3 öğe ⊆ {0,1,2}, `done` bool | O |
| `hazards.solved` / `looted` / `gone` | her biri ≤ 4096 kimlik | O |
| `bosses.defeated` | ≤ 32 anahtar, değer `true` (bilinmeyen boss korunur) | O |
| `quests.stage` | int 0…STORY.length−1 (bugün 5) | O (üstü sıkıştırılır, `kayıp` notu) |
| `quests.flags` | ≤ 64 anahtar, yalnız `true`; çalışma zamanı bayrakları silinir; §3.4 tutarlılık kuralları | O |
| `quests.side` | ≤ 4; şablondan yeniden türetilir (§2.4) | O / E |
| `quests.completed` | ≤ 64 dize ≤ 80 (şablon başlıkları; bilinmeyen korunur). (inceleme düzeltmesi) Audit 7.2 kimlik planı yan görevlerin kimlikle tanımlanmasını istiyordu: v3'te ek alan `completedIds` (`SIDE_TEMPLATES` `id`'leri) yazılır, `boardQuests` (quests.js:234) ikisine birden bakar; `completed` v0.4 uyumu için kalır | O |
| `quests.discovered` | ≤ 512 `{id: true}` | O |
| `quests.fog` | `'v2:'` + base64, **uzunluk 3 + 10 924** (8192 bayt; Ek A) **ya da** eski 64×64 biçimi (base64 4096 bayt). Ayrıca `atob` ön-denemesi. | O → boş sis (`kayıp`: "keşif sisi sıfırlandı"); D-06'daki çökme kapanır |
| `quests.stats` | düz nesne, sonlu ≥ 0; `kills` ≤ 64 anahtar | O |
| `quests.collection.fish` | anahtar ∈ FISH; değer `{weight, len, count int ≥ 1}` + yakalama kaydı `zone, bait, time, date` (korunur, metin temizliği; journal.js:163 bunları "Bölge · Yem · Saat · tarih" olarak gösterir); `name/rarity/color/value` balık yığını kuralıyla (inceleme düzeltmesi) | O / E |
| `quests.collection.animals` | ≤ 64; `{first: dize ≤ 20}` | O |
| `quests.achievements` | ≤ 64; değer dize ≤ 20 | O |
| `quests.markers` | (inceleme düzeltmesi) ≤ 64 (tek oyunculu 30, online host 61: net.js:359) `{x,z, by ≤ 20, note ≤ 80 (net.js:359 `str(m.note, 80)`), color: renk deseni}` | O |
| `quests.boardSeed` | int 0…0xffff | O |
| `progress.level` | int 1…30 (`MAX_LEVEL`, progress.js:10) | O |
| `progress.xp` | int 0…`need(level)` (progress.js:11); 30. seviyede 0 | O |
| `progress.skills` | anahtar ∈ SKILLS (12 kimlik), değer int 1…3 (`SKILL_MAX`) | O |
| `progress.points` | int ≥ 0; ≤ `level−1−Σskills` | O (§3.4) |
| `progress.seen` | ≤ 64 dize ≤ 24 | O |
| `worldState` (v3) | §6.3 | O |
| `extra` | düz nesne ≤ 32 KB | O (fazlası atılır, `kayıp`) |

**Konuk kaydı:** (inceleme düzeltmesi) v0.5 `dksh.guest.0`'ı **yazmaz** (Faz 2 nihai §4.2); v0.3/v0.4 biçimindeki kayıt yalnız ithalat kaynağı olarak okunur ve bellekte doğrulanır: `{inv, progress, quests:{side, completed, discovered, fog, stats, collection, achievements}, savedAt, name}`. `stage`, `flags`, `markers` ve `boardSeed` atılır (D-02). İç alanlar yuva kurallarıyla aynıdır. Konuğun yeni önbelleği `dksh.wcache.<w>` (`{inv, prof, pq, rev}`) Faz 2'nin şemasıyla, aynı yığın ve ilerleme kurallarından geçer.

**Profil (v2):** `{version:2, appearance, unlocked ⊆ COSMETIC_PRICES ∪ DEFAULT_UNLOCKED (bilinmeyen korunur) ≤ 64, recentRooms ≤ 6 {code /^[A-Z0-9]{1,8}$/, name ≤ 30 metin, at int}}`. Ana anahtar ve `.bak` kullanılır. Bu, D-15 için gereklidir.

**Ayarlar:** Yalnız `DEFAULT_SETTINGS` anahtarları alınır (settings.js:10-19) ve türü varsayılanla aynı olmalıdır. `bindings`: eylem → `KeyX` biçiminde dize ≤ 24. Bilinmeyen anahtarlar atılır.

### 3.4 Hikâye tutarlılık kuralları

Bayrakların koyulduğu ve aşamanın ilerlediği yerler (quests.js) aşağıdaki kuralları verir. Meşru oyunda bu kurallar hiç ihlal edilmez. İhlal, D-02 kirlenmesinin ya da elle oynamanın işaretidir.

| Bayrak | Koyulduğu yer | Kural | İhlalde |
|---|---|---|---|
| `ilkSatis` | 145 (hemen `advance(2)`) | aşama ≥ 2 | bayrak silinir |
| `gunluk` | 305 (aşama 2'de → `advance(3)`, 316; istem aşama ≥ 2, 297) | aşama ≥ 3 | bayrak silinir; günlük nesnesi yeniden görünür (90) |
| `parca1` | 176 (→ `advance(4)`, 179) | aşama ≥ 4 | silinir |
| `kizilYenildi` | 183 (→ `advance(5)`, 187) | aşama ≥ 5 | silinir |
| `ilkHarita` | 404 (haritacı yalnız `st === 1` iken verir) | (inceleme düzeltmesi) aşama ≥ 1 | bayrak silinir. Not: aşama 1'deki kirlenmeyi (haritacının ilk haritayı vermemesi) kayıt onarımı ayırt edemez; bunu Faz 2'nin `story` beyaz listesi önler. |
| `ilkHazineBulundu` | 140 | aşama 0'da da koyulabilir (`marti_1` başka haritayla kazılabilir) | **kural yok** |
| `morvanSpawn`, `kizilSpawn` | 277, 284 | çalışma zamanı | her zaman silinir (D-17) |

İlerleme tutarlılığı: `Σskills + points ≤ level − 1` olmalıdır. Aşılıyorsa `points = max(0, level−1−Σ)`. Yetenekler silinmez, yalnız not düşer; tek oyunculu oyunda oyuncunun kendi kaydıdır. Host'un konuk profilinde ise Faz 2'nin ithal tavanları geçerlidir (⟷UYUM-2).

### 3.5 Boyut sınırları

Node ölçümleri (Ek A): sis dizesi tek başına 10 927 karakter. Tipik v0.4 kaydı yaklaşık 16,5 KB (09. belge §9.1). Kaba en kötü durum yaklaşık 88 KB; varsayım: 200 günlük kaydı, 120 balık yığını, 60 efsanevi sandık, 30 tür koleksiyon.

| Nesne | Sert sınır | Uyarı eşiği |
|---|---|---|
| Yuva kaydı (dize uzunluğu) | 256 KB | 128 KB ("Kayıt büyüyor; eski sandıklar/günlük kırpılabilir") |
| Konuk kaydı | 64 KB | 32 KB |
| Profil, ayarlar | 16 KB | — |
| Konuk defteri (`gbook`) | 384 KB | 256 KB (Faz 2 nihai: profil başına ≈ 24 KB × en çok 16; inceleme düzeltmesi) |
| İçe aktarma dosyası | 2 MB (`File.size` okumadan önce denetlenir); (inceleme düzeltmesi) anahtar sınırı tür başına: yuva 7, `profile`/`settings` 1'er, `gbook.*` ≤ 3, `gslot.*` ≤ 3, `wtok.*` ≤ 64; beyaz liste dışı anahtarlar dosyayı reddettirmez, yok sayılır | — |
| `extra` | 32 KB | — |
| Toplam `dksh.*` (yumuşak bütçe) | 1,5 M karakter | %70: budama ve bildirim (§4.9) |

---

## 4. Depolama

### 4.1 Arka uç soyutlaması

Yeni `js/core/storage.js`:

```js
export function createStore(backend = localStorageBackend()) → store
// backend: { get(k), set(k, v), remove(k), keys() }  — senkron
// localStorageBackend: try/catch; QuotaExceededError → {code:'quota'} (Chrome adı/22, Firefox NS_ERROR_DOM_QUOTA_REACHED/1014)
// memoryBackend({quota, failAt}) — Node testleri: kota ve "N. yazımda çök" enjeksiyonu
```

- `beforeunload`, `pagehide` ve `visibilitychange` sırasında yazım **senkron** olmalıdır. Bu yüzden birincil arka uç localStorage kalır.
- IndexedDB ve Electron dosya arka ucu aynı arayüzle sonradan eklenebilir; save.js:1'deki "masaüstü sürümde dosyaya taşınabilir" notu bunu öngörüyor. Bu belgede yalnız arayüz kurulur (K-7).

### 4.2 Anahtar düzeni

Yuva anahtarı `k = dksh.<kind>.<n>` için:

| Anahtar | İçerik | Ömür |
|---|---|---|
| `k` | ana kayıt (v3, `_sum` sonda) | |
| `k.bak` | **önceki** geçerli ana kayıt; v0.4 anlamı korunur | her yazımda |
| `k.h1` | en az 15 dk önceki geçerli kayıt | §4.4 |
| `k.h2` | en az 2 sa önceki geçerli kayıt | §4.4 |
| `k.gun` | bir önceki takvim gününün son kaydı | §4.4 |
| `k.pre3` | göç öncesi özgün dize (bir kez) | yuva silinene dek |
| `k.bad` | son okunamayan ana kayıt (teşhis ve dışa aktarma için) | kota baskısında ilk budanır |
| `k.sil` | (inceleme düzeltmesi) silinen yuvanın ya da aynı yuvada yerini yeni dünyaya bırakan eski dünyanın **bütün** anahtarları tek pakette `{at, worldId, keys:{k, k.bak, k.h1, k.h2, k.gun, k.pre3}}` (K-8); online yuvada `gslot.N` de | 24 sa |
| `k.tmp` | **yalnız okunur** (v0.4 kalıntısı); v3 yazmaz | ilk v3 yazımında silinir |
| ~~`dksh.lock.<kind>.<n>`~~ | (inceleme düzeltmesi) yedek kira kilidi çıkarıldı (K-11, §4.8) | — |
| `dksh.undo.import` | içe aktarma geri alma kaydı (§5.4) | bir sonraki içe aktarmaya ya da 7 güne dek |
| Konuk ve ağ anahtarları | (inceleme düzeltmesi, Faz 2 nihai) `dksh.gbook.<w>` ve `dksh.gslot.<N>` (host), `dksh.wtok.<w>` ve `dksh.wcache.<w>` (konuk); `dksh.guest.0` ve `dksh.progress.guest` salt okunur | ⟷UYUM-2, UYUM-5, UYUM-10, UYUM-12 |

### 4.3 Atomik yazma (`store.commit`)

Web Storage'da tek bir `setItem` atomiktir: ya tamamen uygulanır ya da istisna atar ve eski değer yerinde kalır. Çok anahtarlı işlemin güvenliği aşağıdaki sıradan gelir. Hangi adımda kesilirse kesilsin, ana kayıt **ya eski ya yeni** hâlde ve tam geçerli olur.

```js
commit(kind, slot, data, { expectSeq, reason }) {
  // 0) hazırlık — hiçbir şey yazılmadı
  let body; try { body = JSON.stringify(data); } catch (e) { return { ok:false, code:'serialize', e }; }   // D-12
  const v = saveSchema.validate(JSON.parse(body), { kind, cat, strict:true });
  if (v.reject) return { ok:false, code:'invalid', notes:v.notes };   // yapısal bozuk çıktı asla yazılmaz (D-06)
  if (v.notes.some(n => n.level === 'kayıp')) report(v.notes);        // yazılır ama bir kez bildirilir: kaydı reddetmek bütün oturumu kaybettirirdi
  if (body.length > LIMIT[kind]) return { ok:false, code:'size' };
  const prevRaw = backend.get(k);
  const prev = prevRaw && store.inspect(prevRaw);           // parse + _sum + detect + validate (≈1 ms)
  // 1) çakışma (iki sekme / dış yazım)
  if (prev?.ok && expectSeq != null && prev.seq > expectSeq) return { ok:false, code:'conflict', theirs: prev }; // §4.8
  // 2) ana kaydı yaz + geri oku
  const seq = Math.max(prev?.seq ?? 0, expectSeq ?? 0) + 1;
  const raw = seal({ ...data, savedAt: Date.now(), saveSeq: seq });
  if (prev && !prev.ok) safeSet(k + '.bad', prevRaw);       // bozuk ana kayıt yedeklere kaydırılmaz (D-12)
  if (prev?.ok && prev.v < 3 && !backend.get(k + '.pre3') && !trySetWithPrune(k + '.pre3', prevRaw).ok)
    return { ok:false, code:'quota' };                      // (inceleme düzeltmesi) göç öncesi kopya yazılamazsa ilk v3 yazımı yapılmaz (R-1)
  const w = trySetWithPrune(k, raw);                       // §4.9 kota budaması + 1 yeniden deneme
  if (!w.ok) return { ok:false, code: w.code };             // ana kayıt değişmedi
  if (backend.get(k) !== raw) return { ok:false, code:'verify' };
  // 3) kuşak döndürme — yalnız doğrulanmış prev; hata ölümcül değil
  if (prev?.ok && prev.worldId && prev.worldId !== data.worldId) parkToSil(k, prevRaw, prev);   // (inceleme düzeltmesi) başka dünyanın kayıtları kuşaklara karışmaz
  else if (prev?.ok && (!backend.get(k + '.bak') || Date.now() - prev.savedAt >= BAK_MIN_AGE))
    rotate(k, prevRaw, prev);                                // §4.4; BAK_MIN_AGE = 60 sn (inceleme düzeltmesi)
  backend.remove(k + '.tmp');
  return { ok:true, seq, bytes: raw.length };
}
```

- v0.4 sırası (`.tmp` → `.bak` → ana) değişir: önce **ana kayıt** yazılır, sonra önceki kayıt **bellekteki kopyadan** yedeklere kaydırılır. Böylece kotaya takılan bir yedek kaydırması ana kaydı hiçbir zaman etkilemez. `.tmp` gereksizleşir: `setItem` zaten atomik ve sonrasında geri okuma yapılıyor.
- **`expectSeq` kaynağı:** Oturum yüklenince `G.session.seq` yüklenen kaydın `saveSeq`'ine (eski kayıtta 0) eşitlenir ve her başarılı `commit`'te güncellenir. Kullanıcı bir **yedeği** bilerek yüklediyse `expectSeq` ana kaydın `saveSeq`'ine eşitlenir. Bu bilinçli bir üzerine yazmadır ve çakışma sayılmaz. Karışık oturum durumunun (D-06) yazılmasını şema doğrulaması değil, yükleme işlemindeki `G.saveBlocked` engeller (§4.6).
- İki anahtarı birlikte yazmak gereken işlemlerde (host yuvası + konuk defteri) iki ayrı `commit` yapılır. Defter, yazıldığı andaki yuva `saveSeq`'ini (`slotSeq`) taşır. Uyuşmazlık en çok bir otomatik kayıt aralığı kadar kayıp demektir ve yüklemede bildirilir (⟷UYUM-2).
- (inceleme düzeltmesi) **Kuşak döndürmenin alt sınırı:** Olay tetikli kayıt (§4.7, en sık 10 sn) ve kapanıştaki `visibilitychange` + `pagehide` + `beforeunload` üçlüsü ardışık yazımlar üretir. Her yazımda döndürme yapılsaydı `.bak` ana kaydın saniyeler önceki kopyası olurdu. Bu yüzden önceki kayıt 60 sn'den gençse (ve `.bak` doluysa) döndürme atlanır; ana kayıt yine yazılır. D-12'nin "üç ardışık kayıttan sonra iki eski kuşak" ölçütü gerçekçi aralıkla (saat taklidiyle 2'şer dk) ölçülür; anlık ardışık yazımlar bilerek birleştirilir.
- (inceleme düzeltmesi) **Başka dünyanın kayıtları:** Önceki ana kaydın `worldId`'si doluysa ve yazılan kaydınkinden farklıysa (aynı yuvada yeni dünya; testlerde yaygın), eski dünyanın ana kaydı ve kuşakları yeni dünyanın kuşaklarına karışmaz, `.sil` paketine alınır (K-8). Yedekler paneli de yalnız `worldId`'si ana kayıtla aynı olan (ya da `worldId`'siz eski) kuşakları listeler.
- (inceleme düzeltmesi) **`.pre3` yazılamazsa** ilk v3 yazımı yapılmaz ve `quota` döner: göç hatasına karşı tek koruma budur (R-1). Kota budamasında `.pre3` ancak yuvada en az üç başarılı v3 yazımı varsa silinebilir (§4.9).

### 4.4 Çok kuşaklı yedek politikası

Her başarılı `commit`'te, önceki kayıt `P` doğrulanmışsa:

1. `k.bak ← P`. (inceleme düzeltmesi) Yalnız `P` en az 60 sn eskiyse ya da `.bak` boşsa; aksi hâlde döndürme bütünüyle atlanır (§4.3).
2. `k.h1` yoksa ya da `P.savedAt − h1.savedAt ≥ 15 dk` ise: önce, `h2` yoksa ya da `h1.savedAt − h2.savedAt ≥ 2 sa` ise `k.h2 ← k.h1`; ardından `k.h1 ← P`.
3. `günü(P.savedAt) ≠ günü(şimdi)` ve `k.gun` yoksa ya da `günü(gun.savedAt) ≠ günü(P.savedAt)` ise `k.gun ← P`. Böylece önceki oyun gününün son durumu saklanır.

| Kuşak | Geri götürdüğü süre (120 sn otomatik kayıtla) |
|---|---|
| `bak` | (inceleme düzeltmesi) olağan durumda bir otomatik kayıt aralığı (≈ 2 dk), en az 60 sn; yalnız `.bak` boşken yapılan ilk döndürmede daha yeni olabilir |
| `h1` | (inceleme düzeltmesi) ≈ 2–17 dk (döndürüldüğü anda bir önceki kayıtla aynıdır) |
| `h2` | (inceleme düzeltmesi) ≈ 17 dk – 2,5 sa |
| `gun` | önceki oynama günü |

(inceleme düzeltmesi) İlk taslaktaki "h1: 15–30 dk, h2: 2–4 sa" değerleri kuralla uyuşmuyordu: kural `h1 ← P`'yi `P` bir kayıt aralığı (≈ 2 dk) yaşındayken yapar, bu yüzden `h1` döndürmeden hemen sonra `bak` kadar yenidir; `h2 ← h1` döndürmesi de `h1` en az ≈ 17 dk yaşındayken olur. Kural korunur, tablo düzeltildi. Kullanıcıya gösterilen "yedek yaşı" her zaman kuşağın kendi `savedAt`'inden hesaplanır.

D-12'nin kabul ölçütü ("üç ardışık kayıttan sonra en az iki eski kuşak okunabiliyor") `bak` ve `h1` ile karşılanır. Mantıksal olarak bozulmuş bir durum bütün yedekleri ancak 2 saatten uzun sürede ezebilir. Üstelik §4.3 adım 0 yapısal olarak bozuk çıktıyı, §4.6'daki kayıt kilidi (`G.saveBlocked`) de yarım yüklenmiş oturumu hiç yazdırmaz.

### 4.5 Okuma, bozuk kayıtta kurtarma ve kullanıcıya bildirim

```js
store.load(kind, slot) → { status, data, source, notes, seq, candidates }
// adaylar: k, k.bak, k.h1, k.h2, k.gun, k.tmp(eski), k.pre3
// her aday: boyut → JSON.parse → _sum → detect → (gelecek? dur) → migrate → validate
```

| Ana kayıt | Davranış |
|---|---|
| Geçerli | Doğrudan yüklenir. Onarım notu varsa yükleme sonrası bildirim gösterilir. |
| Özet uyuşmuyor ama şema geçerli | Sıkı doğrulamayla yüklenir. Bildirim: "Bu kayıt elle değiştirilmiş olabilir; tutarlılık denetiminden geçirildi." |
| RET (bozuk) | **Otomatik yükleme yapılmaz**, önce diyalog gösterilir (aşağıda). Bozuk ana kayıt `k.bad`'e alınır. Yedekle devam edilirse ilk `commit` bozuk kaydı kuşaklara karıştırmaz. |
| Gelecek sürüm | §2.5; yedeğe düşülmez |
| Yuva boş, `.bak` dolu | (inceleme düzeltmesi) Yalnız ana kayıt kullanıcı silmesi dışında kaybolduysa (`.sil` paketi yok) kart "yedekten kurtarılabilir" rozetiyle görünür. Kullanıcının sildiği yuva boş görünür; geri alma 24 sa boyunca `.sil` üzerinden sunulur. |

**Kurtarma diyaloğu:**
> **Kayıt okunamadı** — Yuva 1'in son kaydı bozuk (neden: JSON biçim hatası).
> En yeni sağlam yedek: **14.11.2026 22:10** (2 dakika önce) · Rütbe 7 · 2.340 altın · Hikâye: Eski Günlük
> [Yedekle devam et] [Bütün yedekleri göster] [Vazgeç]

- **Yuva kartı rozetleri** (menu.js:139-146 ve 77-85'teki kart): "Yedekten kurtarılabilir", "Eski sürüm (v0.3) — açılınca güncellenecek", "Daha yeni sürüm — açılamaz", "Başka sekmede açık", "Onarıldı".
- **Yedekler paneli:** yuva kartı → "Yedekler". Kuşaklar `savedAt`, oyun süresi, rütbe, altın ve aşamayla listelenir. "Bu yedeğe dön" seçilince mevcut ana kayıt `commit` yoluyla `bak`'a kayar. "Dışa aktar" seçilir yedek tek yuvalık dosya olarak iner.
- **Göç bildirimi:** İlk açılışta bir kez gösterilir: "Bu kayıt v0.3 ile oluşturulmuş; güncel biçime dönüştürüldü. Özgün kopya saklandı."

### 4.6 Yükleme işlemi (D-06)

`game.start` değişiklikleri (game.js:101-150):

```js
async start(opts) {
  G.state = 'loading';                  // 103: önce 'playing' idi → update çalışmaz (game.js:190-191)
  this.autosaveT = 0;                   // YB-4: önceki oturumun sayacı taşınmasın (147'den başa)
  G.saveBlocked = 'loading';
  this.resetClock?.();                  // (inceleme düzeltmesi) Faz 3: sabit adım biriktiricisi (acc) sıfırlanır
  …gemi, oyuncu (117-136)…
  const failed = [];
  for (const s of this.systems) if (s.start) {
    try { await s.start(data, opts); }
    catch (e) {
      if (s.save) throw new LoadError(s.name, e);   // (inceleme düzeltmesi) kaydı olan her sistem kritik: misc, time, treasure, enemies, islands, hazards, bosses, quests, progress, worldState
      failed.push(s.name); console.error(e);
      try { await s.start(null, opts); } catch (e2) { throw new LoadError(s.name, e2); } // varsayılana düş
    }
  }
  G.state = 'playing'; G.saveBlocked = opts.readOnly ? 'readonly' : null;
}
```

- `handlers.startGame` (main.js:157-167) şunu yapar: `prepared = saveSchema.prepare(data)` (göç + doğrulama; `data` testlerden ham nesne olarak gelse de çalışır: 08, 12 ve 14 `startGame`'e ham nesne verir. (inceleme düzeltmesi) İlk taslaktaki "13_donma P08 uyumu" yanlıştı: P08 `startGame` kullanmaz, `islands.start`'ı doğrudan çağırır.) → kilit (§4.8) → `game.start`.
- `LoadError` olursa: `game.abortStart()` çağrılır (sistemler `stop()`, `G.state='menu'`, `setupMenuScene`), menüye dönülür ve diyalog gösterilir: "Kayıt yüklenirken hata oluştu (bölüm: görevler). Kayıt değiştirilmedi. [Bir önceki yedeği dene] [Menüye dön]". Yuva anahtarları **bayt düzeyinde aynı** kalır (test §10.3-T5). (inceleme düzeltmesi) Online host'ta `abortStart` ayrıca `net.leave()` ile odayı kapatır ve `hud.show(false)`, `menu.show(true)` çağırır; aksi hâlde lobide bekleyen konuklar asılı kalır. Tutulan yuva kilidi de bırakılır.
- **Kontrol maddesi:** `start()` içinde `G.state==='playing'` okuyan bir sistem var mı? (inceleme düzeltmesi) `js/` altında game.js dışında **29** `G.state` okuması var (main.js de hariç tutulursa 20); hiçbiri bir sistemin `start`'ında değil. time.js:46'daki `L` `init` içindeki dinleyicilerde yalnız günlük yazımını engeller; zararsız. net.js:263 host yüklenirken bağlanan konuğa dünyayı göndermez; main.js:182 başlangıçtan sonra `sendWorldAll` çağırdığı için sorun olmaz.

### 4.7 Kayıt kilidi ve olay tetikli kayıt

- **`G.saveBlocked`** değerleri: `'loading'`, `'readonly'` (gelecek sürüm, kilit kaybı), `'conflict'`, `'serialize'`. `handlers.saveNow` (main.js:199) bu alan doluysa yazmaz. Elle kaydetmede neden gösterilir: "Bu sekme salt-okunur: yuva başka bir sekmede açık."
- **Olay tetikli kayıt:** `G.emit('saveSoon', neden)` en geç 2 sn içinde, en sık 10 sn'de bir kayıt yapar (birleştirilir). Tetikleyiciler: `storyAdvanced`, `bossDefeated`, `templeOpened`, `shipBought`, `shipUpgraded`, kozmetik satın alma (D-15), `levelUp`, ada sandığı ya da bulmaca ödülü, içe aktarmadan dönüş. Böylece kayıp penceresi 120 sn'den önemli olaylarda yaklaşık 2 sn'ye iner. (inceleme düzeltmesi) Olay tetikli kayıtlar §4.3'teki 60 sn alt sınırı yüzünden kuşak döndürmez; yalnız ana kaydı tazeler.
- **`pagehide`** dinleyicisi eklenir (main.js:382-385 yanına). Mobil Safari'de `beforeunload` güvenilir değil.
- Ölü ya da yaralıyken kayıt yapılmaması (main.js:209) korunur.

### 4.8 İki sekme kilidi (D-11)

1. **Web Locks** (güvenli bağlam: https, localhost; `file://`'de tarayıcıya göre bulunmayabilir). Yuva açılırken `navigator.locks.request('dksh:solo:0', {ifAvailable:true}, holdUntilSessionEnds)` çağrılır. Kilit alınamazsa şu diyalog gösterilir:
   > **Bu dünya başka bir sekmede açık.** [Salt-okunur aç] [Diğer sekmeyi kapat ve buradan devam et] [Vazgeç]
   "Devam et" `{steal:true}` ile çalışır. Kilidi kaybeden sekmede kilit sözü reddedilir: `G.saveBlocked='readonly'` olur ve şu kalıcı bant görünür: "Bu dünya başka bir sekmede açıldı; bu sekmede kayıt durduruldu."
   (inceleme düzeltmesi) **Sekme içinde yeniden girişli:** `saveLock` tuttuğu kilidi `{name, release}` olarak saklar. Aynı sekme aynı yuvaya yeniden `startGame` çağırırsa (08_kalicilik.js:30, 12_kayit_dongusu.js:7, 14_deniz_ekipmani.js:86) kilit yeniden istenmez, eldeki kullanılır; başka yuvaya geçişte, `toMenu`'de ve `abortStart`'ta bırakılır. Web Locks aynı sekmede tutulan kilidi ikinci kez vermez; bu kural olmadan üç mevcut test "başka sekmede açık" diyaloğuna düşerdi.
2. ~~Yedek kira~~ (inceleme düzeltmesi, K-11) çıkarıldı. Web Locks yoksa açılışta uyarı verilmez; ezilmeye karşı koruma madde 4'teki `saveSeq` denetimidir.
3. ~~BroadcastChannel~~ (inceleme düzeltmesi, K-11) çıkarıldı: kilit devralındığında eski sahibin kilit sözü zaten reddedilir (madde 1).
4. **Yazımda iyimser denetim:** `commit({expectSeq})`. Diskteki `saveSeq` oturumun bildiğinden büyükse yazılmaz (`code:'conflict'`). Oturum durumu `k.cakisma` anahtarına bir kez kopyalanır ve kullanıcıya iki seçenek sunulur: "Diğer sekmenin kaydı daha yeni. [Diğer kaydı yükle] [Bu sekmenin durumunu ayrı yuvaya kaydet]". Bu adım kilit olmadan da D-11'in kabul ölçütünü karşılar: B'nin kaydı A tarafından ezilmez. (inceleme düzeltmesi) Eski yüz `save.write` `expectSeq` göndermez; testlerin doğrudan yazımı çakışma sayılmaz.
5. Salt-okunur sekme `beforeunload`, `pagehide` ve `visibilitychange` anlarında yazmaz (main.js:380-385).
6. (inceleme düzeltmesi) Konuk kilidi gerekmez: Faz 2 kararıyla konuk `dksh.guest.0`'a yazmaz; dünya başına `dksh.wcache.<w>` yazar ve aynı `gid` ikinci bağlantıda açılırsa host eskisini `kick{code:'replaced'}` ile düşürür (Faz 2 nihai §4.3).

### 4.9 Kota hatası ve depolama paneli

`trySetWithPrune` kota hatasında sırayla dener:

1. Bütün yuvaların `.tmp`, `.bad`, `.sil` ve `k.cakisma` anahtarlarını siler → yeniden dener.
2. Bu yuvanın `.gun` ve `.h2` kuşaklarını ve (inceleme düzeltmesi) yuvada en az üç başarılı v3 yazımı varsa `.pre3`'ü siler → yeniden dener.
3. Bu yuvanın `.h1` kuşağını siler → yeniden dener.
4. Yine olmazsa ana kayıt değişmez ve `code:'quota'` döner. Bildirim:
   > **Depolama dolu: kayıt yapılamadı.** Ayarlar → Kayıt dosyaları → Depolama'dan eski yedekleri silebilir ya da kayıtlarını dışa aktarabilirsin. (Bu sitedeki diğer projeler de aynı alanı kullanıyor olabilir.)

Hiçbir durumda başka bir yuvanın ana kaydına ya da `.bak`'ına dokunulmaz.

- **Depolama paneli:** Anahtar başına boyut gösterilir; `dksh.*` toplamı ve `navigator.storage.estimate()` (varsa) yanında "bu kökendeki diğer veriler" ayrıca belirtilir (YB-5). Silinebilir yedekler buradan seçilir. İlk kayıtta bir kez `navigator.storage.persist()` istenir; bu yalnız bir istektir, garanti vermez.
- (inceleme düzeltmesi) **Yetim anahtarlar:** Silinen ya da üzerine yeni dünya kurulan online yuvanın `gbook.<w>`'si (en çok 384 KB) kendiliğinden silinmez; depolama panelinde "sahipsiz konuk defteri" olarak listelenir ve onayla silinir. Yuva silmede `gslot.N` `.sil` paketine girer.
- **localStorage hiç yoksa** (gizli pencere, kapatılmış depolama; `save.available()` false, main.js:93) şu kalıcı bant gösterilir: "Kayıt yapılamıyor (tarayıcı depolamaya izin vermiyor). İlerleme kaydedilmeyecek; oturum sonunda dışa aktarmayı kullan."

---

## 5. İçe ve dışa aktarma

### 5.1 Dosya biçimi

Geriye uyumluluk için **düz `{"dksh.<anahtar>": "<dize>"}` haritası korunur**. v0.3 ve v0.4 dışa aktarımları da aynı biçimdedir. Üst bilgi tek bir ek anahtardadır:

```json
{
  "dksh.__meta": "{\"format\":\"dksh-export\",\"exportVersion\":1,\"game\":\"0.5.0\",\"createdAt\":1763140000000,\"keys\":[\"dksh.solo.0\",\"dksh.profile\"],\"sum\":\"9c1e4a07\"}",
  "dksh.solo.0": "{\"version\":3,…,\"_sum\":\"…\"}",
  "dksh.profile": "{…}",
  "dksh.settings": "{…}"
}
```

- **Neden bu biçim:** v0.4'ün `importAll`'ı (save.js:85) yalnız `dksh.` önekli anahtarları yazar. Bu dosyayı v0.4'e (sürüm düşürme) aktarmak da çalışır; yalnız zararsız bir `dksh.__meta` anahtarı yazılır. Kök düzeyde `{format, entries}` gibi bir yapı seçilseydi v0.4 hiçbir şey yazmadan "içe aktarıldı" derdi.
- **Dışa aktarılanlar (beyaz liste):** `solo.0-2`, `online.0-2`, `guest.0` (salt okunur eski kayıt, olduğu gibi), `profile`, `settings`; (inceleme düzeltmesi) Faz 2 nihai anahtarları `gbook.*`, `gslot.*`, `wtok.*`. `wcache.*` dışa aktarılmaz (host'tan yeniden gelir). **Yedekler (`.bak`, `.h1`, `.h2`, `.gun`, `.pre3`, `.bad`, `.tmp`, `.sil`), kilitler ve geri alma kaydı dışa aktarılmaz** (D-04).
- **`sum`:** anahtar sırasıyla birleştirilmiş değerlerin FNV-1a özeti.
- **Seçenekler:** "Tümünü dışa aktar" (`son-hazine-kayitlar-AAAAGGSS-SSDD.json`) ve yuva kartından "Bu dünyayı dışa aktar" (`son-hazine-<ad>-AAAAGGSS.json`; yalnız o yuva ve `__meta`).
- **Gizlilik uyarısı:** Dosya konuk belirteçlerini içerebilir. Dışa aktarma düğmesinin altında şu not durur: "Bu dosya dünyalarına giriş anahtarlarını içerir; yalnız kendine sakla." (⟷UYUM-5)

### 5.2 Boyut ve biçim sınırları

- `File.size ≤ 2 MB`. Dosya okunmadan önce denetlenir (bugün okunduktan sonra bile denetlenmiyor, settingsPanel.js:78).
- (inceleme düzeltmesi) Anahtar sayısı tür başına sınırlıdır (§3.5); beyaz liste dışı anahtarlar yok sayılır, dosyayı reddettirmez. Her değer dize olmalı (bugün nesne değerler `'[object Object]'` olarak yazılıyor, D-04). Her değer kendi türünün boyut sınırına uymalı (§3.5).
- Tanınan biçimler: (a) `__meta`'lı v0.5 dosyası; (b) eski düz harita (v0.3/v0.4; `.bak`/`.tmp` anahtarları **yok sayılır**); (c) tek kayıt nesnesi (kökünde `player` var; elle kopyalanmış kayıt) — hedef yuva sorulur. Bunların dışındakiler reddedilir: "Bu dosya bir Son Hazine kayıt dosyası değil." (inceleme düzeltmesi) Eski dosyalardaki `dksh.progress.guest` (ve varsa `dksh.guest.0`) ithalat kaynağıdır: yerelde yoksa olduğu gibi yazılır, varsa dokunulmaz (Faz 2 nihai §4.2); önizlemede "eski konuk ilerlemesi (seviye L)" satırı gösterilir. Audit 7.1 planı bu anahtarı beyaz listede sayıyordu; ilk taslak atlamıştı.

### 5.3 İçe aktarma hattı ve önizleme

```
dosya seç → boyut → metin → JSON.parse → biçim tanıma → anahtar beyaz listesi
  → her yuva: değer dize mi → boyut → parse → _sum → detect → (gelecek? → atla) → migrate → validate
  → özet: {ad, savedAt, oyun süresi, rütbe, altın, aşama, gemi, notlar}
  → ÖNİZLEME (onay) → uygula (§5.4)
```

**Önizleme tablosu** (yuva başına bir satır):

| Yuva | Dosyadaki kayıt | Mevcut kayıt | İşlem |
|---|---|---|---|
| Tek oyunculu 1 | Mira · 01.11 21:00 · Rütbe 4 · 900 altın | Mira · **12.11 22:10** · Rütbe 7 | ◯ Üzerine yaz ◉ **Atla** ◯ Boş yuvaya aktar (Yuva 3) — ⚠ *Dosyadaki kayıt mevcut kayıttan daha eski* |
| Tek oyunculu 2 | Deniz · 10.11 · Rütbe 3 | (boş) | ◉ **İçe aktar** ◯ Atla |
| Online 1 | — geçersiz kayıt (oyuncu verisi yok) | … | **Atlanacak** |
| Profil | 4 kozmetik kilidi | 2 kozmetik kilidi | ☑ Kilitleri birleştir (kilit asla silinmez) ☐ Görünümü değiştir |
| Ayarlar | | | ☐ Ayarları değiştir |

- **Varsayılan seçimler:** Dosya daha eskiyse "Atla", boş yuva için "İçe aktar". Onarım notları satırda katlanır biçimde gösterilir ("2 bilinmeyen eşya saklandı, sis sıfırlandı").
- **Oyun sürerken içe aktarma kapalıdır** (D-10). Duraklatma menüsünden açılan Ayarlar'da düğme pasiftir: "İçe aktarmak için ana menüye dön". Bayat oturum yuvanın üstüne yazılamaz.

### 5.4 Atomik uygulama ve geri alma

1. **Geri alma kaydı:** (inceleme düzeltmesi) Etkilenen her yuvanın **bütün** anahtarlarının (`k`, `k.bak`, `k.h1`, `k.h2`, `k.gun`, `k.pre3`, `k.bad`; online yuvada `gslot.N` ve ilgili `gbook.<w>`) ve `profile`/`settings`'in mevcut değeri (yoksa `null`) `dksh.undo.import = {state:'applying', at, keys:{k: eskiDeğer|null}}` olarak yazılır. Bu kayıt yazılamazsa (kota) içe aktarma **hiçbir şey yazmadan** iptal edilir: "İçe aktarma için yeterli alan yok."
2. Her yuva `store.commit(..., {reason:'import', rotate:false})` ile yazılır. (inceleme düzeltmesi) İçe aktarma sırasında kuşak döndürme yapılmaz; önceki ana kayıt yalnız `k.bak`'a bir kez kopyalanır (`k.bak`'ın eski değeri geri alma kaydındadır). Profil ve ayarlar doğrudan yazılır. İlk taslakta `commit` her yuvada `.bak/.h1/.h2/.gun`'u döndürüyor, geri alma kaydı ise yalnız ana anahtarları tutuyordu: başarısız içe aktarma bir yedek kuşağını yok ediyor ve `kayit_aktarma.mjs`'nin "bütün anahtarlar bayt düzeyinde önceki hâline döner" ölçütü sağlanamıyordu.
3. **Herhangi bir hatada** yazılmış anahtarların hepsi geri alma kaydından eski değerlerine döndürülür (`null` olanlar silinir). Ardından `state:'rolledBack'` işaretlenir. Bildirim: "İçe aktarma geri alındı: depolama alanı yetersiz. Kayıtların değişmedi."
4. Başarıda `state:'done'` işaretlenir, `menu.render()` çağrılır (D-10) ve özet bildirimi gösterilir.
5. **Çökme kurtarması:** Önyüklemede `dksh.undo.import.state === 'applying'` ise yarım kalmış içe aktarma geri alınır. Bildirim: "Yarım kalan içe aktarma geri alındı."
6. **Geri alma:** Ayarlar → Kayıt dosyaları → "Son içe aktarmayı geri al (14.11 22:10)". Bu seçenek yedi gün ya da bir sonraki içe aktarmaya kadar görünür. Anahtarlar `commit` yoluyla eski hâllerine döner. (inceleme düzeltmesi) Onay metni içe aktarmadan sonra yapılan ilerlemenin geri alınacağını söyler; o anki ana kayıt `commit` ile `.bak`'a kaydığından bu da geri alınabilir.

### 5.5 Menü tazeliği (D-10, D-18)

- `menu.render()` içe aktarmadan, yuva silmeden ve yedeğe dönüşten sonra çağrılır.
- `handlers.continueLatest` (main.js:169-172) veriyi tıklama anında `store.load` ile yeniden okur. Önceden ayrıştırılmış `latest.data` kullanılmaz.
- Online "DEVAM ET" için `menu.hostScreen({slot: latest.slot})` çağrılır; seçim kutusunun varsayılanı `f.slot`'tan gelir (menu.js:181, 193; D-18).
- Yuva silme onayında `ui.confirm` metin olarak çağrılır (yeni `confirmText`; ui.js:90-97, menu.js:146; YB-2).

---

## 6. Dünya kalıcılığı

### 6.1 Kalıcı kimlik şeması

**İlke:** Mevcut düz kimlikler hem v0.4 kayıtlarında hem de Faz 2'nin aday kimliklerinde kullanılıyor (`chest:<id>`, `keg:<id>`, `free:<f>:<k>`…; Faz 2-A §6.1 aday listesi, Faz 2-B §6.7 tablosu). Bu yüzden kimlikler **değiştirilmez, resmîleştirilir**. Mantıksal kimlik `(adaId, yerelId)` çiftidir. Kayıtta ve ağda düz dize kullanılır. İkisi arasındaki dönüşüm katalogla birebirdir.

| Tür | Düz kimlik (kayıtta) | Oluştuğu yer | Kanonik gösterim | Durum alanı |
|---|---|---|---|---|
| Özellik | `<adaId>_<tür>_<sıra>` | archipelago.js:296-297 (sıra = `I.features` dizini) | `<ada>/<tür>_<sıra>` | — |
| Ada sandığı | `fid` | islands.js:738, 784, 896, 928, 1021 | `<ada>/<tür>_<sıra>/sandik` | `opened` |
| Batık şehir sandığı | `fid_<0-3>` | islands.js:1036 | `…/sandik.<n>` | `opened` |
| Tapınak sunağı | `'altar' + fid` *(önek; tarihsel istisna)* | islands.js:858-859 | `…/sunak` | `opened` |
| Tapınak bulmacası | `fid` (`templeState` anahtarı) | islands.js:830-835 | `…/bulmaca` | `{seq, done}` |
| Tutsak | `fid_<k>`, k ∈ {−1,0,1} | islands.js:956, 961 | `…/tutsak.<k+1>` | `freed` |
| Barut fıçısı | `fid_keg<i>`, `core_kamp_keg<i>` | hazards.js:107, 122 | `…/fici.<i>` | `gone` |
| Kırılabilir sandık | `fid_cr<i>`, `core_kamp_cr<i>` | hazards.js:108, 126 | `…/kasa.<i>` | `gone` |
| Kaya tuzağı | `fid_kaya` | hazards.js:320 | `…/kaya` | `used` + konum (yeni) |
| Basınç plakası / gizli sandık | `fid_bulmaca` | hazards.js:430 | `…/plaka`, `…/plaka_sandik` | `solved` / `looted` |
| Martı Batığı sandığı | **`marti_batigi`** (yeni; `WRECKS` kimliğiyle aynı, worldData) | seagear.js:115-139 | `marti/batik/sandik` | `opened` |
| Kabuk / istiridye | **`kabuk_<i>`** (yeni; i = details.js:254 döngü sırası). (inceleme düzeltmesi) Faz 2'nin niyet kimliği `shell:<i>` aynı `i`'yi kullanır; eşleme `shell:<i>` ↔ `kabuk_<i>` | details.js:252-271 | `<ada>/kiyi/kabuk.<i>` | `res` (oyun saati; birim Faz 2'nin `featSt.until`'iyle ortak) |
| Tek seferlik kaynak (K-3) | `<fid>_kaynak<i>` | Faz 6 içeriği | `…/kaynak.<i>` | `taken` |

**Node ile sayım** (`/tmp/tasarim_x/id_catalog.mjs`, Ek A):
- 155 statik nesne: 57 ada sandığı, 35 fıçı, 31 kasa, 13 kaya adayı, 14 plaka, 1 tapınak, 1 sunak, 3 tutsak. Bunlara Martı Batığı ve en çok 46 kabuk eklenir (details.js:254'teki döngü 46 kez döner; yer bulunamayan kabuk kurulmaz, kimliği yine döngü sırasıdır).
- Bütün kimlikler benzersiz. En uzunu 29 karakter (`korsan_kasabasi_ruined_town_0`). Karakter kümesi `[-0-9_a-z]`.
- **Hiçbir ada kimliği başka bir adanın `<id>_` öneki değil.** Bu yüzden ada kimliği düz kimlikten en uzun önek eşleşmesiyle güvenle çıkarılır. Tek istisna `altar` önekidir.

**Kimlik kataloğu** (`js/world/worldIds.js`, saf):

```js
export const GEN;            // dünya üretim imzası: fnv(JSON.stringify(EXTRA_ISLANDS.map(I => [I.id, I.seed, I.features.map(f => f.id)])))
export function catalog();   // [{id, ada, tur, fid, n}] — archipelago verisinden, ada kurmadan
export function parse(id);   // → {ada, tur, fid, n} | null (bilinmeyen)
export const byIsland;       // Map<adaId, id[]>
export const ALIAS = {};     // gelecekteki yeniden adlandırmalar: eskiId → yeniId (bugün boş)
```

- **Kaya** varlığı araziye bağlı (hazards.js:319'daki eğim koşulu). Katalog bu yüzden "aday" listeler. Var olmayan bir kayanın durumu hiç uygulanmaz.
- **Donma testi:** `tests/node/kimlik_sabit.mjs` kataloğu `tests/fixtures/kimlik_katalogu_v05.json` ile karşılaştırır. **Yeni kimlik eklenebilir. Mevcut bir kimlik kaybolur ya da türü değişirse test kalır,** meğer `ALIAS`'ta bir karşılığı ola. Bu test mevcut `archipelago_sabit.mjs`'nin kalıcılık açısından tamamlayıcısıdır.
- **Kural (Faz 6 ve sonrası):** Yeni özellikler `I.features` dizisinin **sonuna** eklenir ya da açık bir `id` alanıyla tanımlanır. Araya ekleme, sonraki özelliklerin sıra dizinine dayalı kimliklerini kaydırır.
- **Kayıtta:** `worldState.gen = GEN`. Yüklemede `GEN` farklıysa `ALIAS` uygulanır ve bilinmeyen kimlikler sayılıp not düşülür (bilgi düzeyi).

### 6.2 Deterministik üretimle uyum: "önce üret, sonra uygula"

**Değişmezler:**
1. Kalıcı durum adanın `R` akışını değiştirmez (`rng(I.seed*31+7)`, islands.js:342; tehlikeler `rng(hashStr(id)%100000+17)`, hazards.js:116). Bir nesne kurulmayacak olsa da onun için yapılan çekilişler aynen yapılır.
2. Yerleşim aramaları (`_puzzleSite` içindeki `physics.resolve`, hazards.js:443) kalıcı duruma bağlı çarpıştırıcıları görmez: fıçı ve kasa çarpıştırıcıları (`hz:` etiketi), açık tapınak kapısı (islands.js:835'teki `gateCol.y1 = -999`) bunlara dahildir. (inceleme düzeltmesi) Bugün hiçbir adada bu bağımlılık oluşmuyor (Node: kamp/kale/maden'den sonra gelen plakalı harabe yok, Ek A). Bu yüzden `physics.resolve`'a etiket süzgeci **eklenmez**; değişmez, `kimlik_sabit.mjs`'e eklenen statik bir denetimle ("aynı adada kamp/kale/maden'den sonra plakalı harabe yok") ve T7 ile korunur. Faz 6 içeriği bu denetimi kırarsa süzgeç o zaman eklenir.
3. Durum, nesne kurulduktan **sonra** uygulanır: istem gizlenir (`cond`), görsel değiştirilir, çarpıştırıcı kaldırılır.

**YB-1 düzeltmesi** (islands.js:950-969):

```js
for (let k = -1; k <= 1; k++) {
  …duvarlar (952-954)…
  const roll = this._npcRoll(R);                       // her zaman 2 çekiliş (ad, görünüm) — 530-531 ile aynı sıra
  const key = `${f.id}_${k}`;
  if (worldState.has(key, 'freed')) continue;           // kurtarılmış: NPC ve etkileşim yok, R akışı aynı
  const nid = this._npc(B, 'prisoner', nx, nz, yaw + Math.PI, roll, {...});   // _npc önceden çekilmiş değerleri kullanır
  B.inter.push({ id: `free:${f.id}:${k}`, …, cond: () => !worldState.has(key, 'freed'), action: () => {
    if (enemies.list.some((e) => e.alive && e.group === f.id)) { G.notify('Gardiyanlar hâlâ burada…', 'warn'); return; } // (inceleme düzeltmesi) önce gardiyan denetimi (islands.js:959-960)
    if (!worldState.tryClaim(key, 'freed')) return;     // D-01: ikinci çağrı etkisiz; tryClaim gardiyan denetiminden SONRA
    … }});
}
```

- (inceleme düzeltmesi) `_puzzleSite` için şimdilik kod değişikliği yok (yukarıdaki değişmez 2 notu). İlk taslaktaki "arama sırasını değiştirme" seçeneği aynı `R` akışını yeniden sıraladığı için bütün fıçı/kasa/kaya konumlarını kaydırırdı; kullanılmaz.
- **Determinizm testi** (tarayıcı, §10.3-T7): Demirkapı'da `freed = ∅` ve `freed = {3 tutsak}` için `_drop` → `_build` yapılır; `B.obstacles` konumları birebir aynı olmalı. Kadim Tapınak'ta tapınak açık ve kapalıyken plaka konumu (`h.C`, `h.P`) aynı olmalı. Bir kampta `gone = ∅` ve `gone = {bütün fıçı/kasalar}` için kaya ve plaka konumları aynı olmalı.
- **K-6:** Düzeltmeden sonra v0.4'te tutsakları kurtarmış oyuncunun kayalıkları bir kez "özgün" yerleşime döner. (inceleme düzeltmesi) Ek bir kaydırma adımı yok: `createPlayerShip` anında Demirkapı henüz kurulmamıştır (islands.js:255-256); kayalık ada kurulunca `Ship.obstacles`'a girer ve `Ship._obstacles` (ship.js:442-458) örtüşen gemiyi her güncelleme adımında en çok 0,9 m iter, 1,6 m/s altındaki çarpmada hasar vermez (ship.js:394-411). T7'ye "kayalığın içinde demirli gemi ada kurulunca hasarsız dışarı çıkar" maddesi eklenir.

### 6.3 WorldState kayıt defteri

Yeni sistem `js/world/worldState.js`, `saveKey: 'worldState'`. main.js:103'te `misc, time`'dan hemen sonra, `islands`, `hazards` ve `details`'tan **önce** kaydedilir.

(inceleme düzeltmesi) **Sahiplik devralmaz, cephe olur.** İlk taslakta kümelerin sahipliği WorldState'e geçiyor, `islands.start`/`hazards.start` veriyi WorldState'ten alıyordu. Bu, 13_donma P08'i bozardı: P08 `islands.start({islands: d})`'yi doğrudan çağırıp kayıt-yükleme ve eski biçim onarımını sınar (13_donma.js:59). 08 ve 12 de `DK.islands.opened/freed/templeState` ve `DK.hazards.gone`'a doğrudan yazar. Düzeltilmiş yapı:

```js
worldState = {
  // mevcut kümeler yerinde kalır; her çağrıda güncel nesneye bakılır (start yeni Set kurar)
  sets: () => ({ opened: islands.opened, freed: islands.freed, gone: hazards.gone, solved: hazards.solved, looted: hazards.looted }),
  temples: () => islands.templeState,
  // yalnız YENİ kalıcı veriler burada tutulur ve kaydedilir
  boulders: { [id]: [x, z, s] },              // s: 0 dinlenmede, 1 denize düştü
  res: { [kabukId]: untilTotalHours },        // yenilenen kaynaklar (time.totalHours, time.js:79)
  has(id, flag), mark(id, flag), tryClaim(id, flag) /* test-ve-ata, tek iş parçacığı */, on('change', fn),
  feats() /* Faz 2 worldPart.feats için veri kaynağı */, audit(islandId),
  save() → { v:1, gen, boulders, res },       // yalnız YENİ veriler
  start(data) → yalnız data.worldState'i okur,
};
islands.start/save, hazards.start/save → değişmez (islands.js:253-269, hazards.js:76-86)
```

- `mark` ve `tryClaim` ilgili kümeye yazar ve `change` olayı yayar; Faz 2'nin `featSt` yayını bu olaya bağlanır.
- Kayık durumu WorldState'te değil, gemi bölümünde (`ship.boat`) tutulur (§6.5): kayık `createPlayerShip` içinde, sistemler başlamadan önce kurulur (game.js:117).
- Tek seferlik kaynak kümesi (`taken`) içeriğiyle birlikte Faz 6'da eklenir (K-3).

**Kayıt eşlemesi (yalnız ekleme, §2.6):**

| Veri | v2'deki yer | v3'teki yer | v0.4 bu kaydı açarsa |
|---|---|---|---|
| opened, freed, temples | `islands` | `islands` (aynı) | korunur |
| gone, solved, looted | `hazards` | `hazards` (aynı) | korunur |
| Martı Batığı | — | `islands.opened` içinde `'marti_batigi'` | v0.4 kümeyi geri yazar, **korunur** (okumaz) |
| Kaya, kaynak zamanlayıcıları | — | `worldState` | düşer |
| Kayık (inceleme düzeltmesi) | — | `ship.boat` | düşer (v0.4 `Ship.serialize` yeniden kurar) |
| Ganimet keseleri | — | `treasure.pickups` | düşer |

### 6.4 Sekiz nesne türü: kayıt, yükleme ve yeniden kurulumda uygulama

| # | Tür | Kimlik ve durum | Bugün (v0.4) | Kayıt | Yükleme ve yeniden kurulum | Değişiklik (dosya:fonksiyon) | Test |
|---|---|---|---|---|---|---|---|
| 1 | **Barut fıçısı** | `…_keg<i>`; `gone` | Kalıcı (hazards.js:164, 202, 80, 86). Co-op'ta geç katılana gitmiyor (D-03). | `hazards.gone` | `_keg` gone ise kurulmaz (164). Konum `R` ile önceden hesaplanır (121), akış değişmez. | `_explode` (200-202) → `worldState.mark`. Fitil yanarken kaydedilirse yüklemede yine sağlam olur (ganimeti yok, zararsız). | T7 (ada seti `_drop/_build`), T8 |
| 2 | **Kırılabilir sandık** | `…_cr<i>`; `gone` | Kalıcı (263, 284) | `hazards.gone` | `_crate` kurulmaz (263) | `breakCrate` (281-294) → `mark`. Konuk kırması host otoritesine geçer (⟷UYUM-8). | T7, T8 |
| 3 | **Kaya tuzağı** | `…_kaya`; `used` + `[x,z,s]` | **Kalıcı değil** (297-345 her kurulumda `'set'`) (D-13) | `worldState.boulders` | `_boulderSite` eğim aramasını **aynen** yapar (20 `R()`, 301-302). Kullanılmışsa takozsuz, dinlenme konumunda ve orada çarpıştırıcıyla kurulur (`s=1` ise hiç kurulmaz: denizde). İstem çıkmaz (648'de `state==='set'`). | `release` (347-356) → `mark(used)`; dinlenme anında (418, 423) ve kayıt anında yuvarlanıyorsa o anki konum yazılır. | T8: kayayı bırak → kaydet → yükle → aynı konumda `rest`, istem yok |
| 4 | **Önemli kaynaklar** | `kabuk_<i>`: `res` (oyun saati); `<fid>_kaynak<i>`: `taken` (Faz 6) | Kabuklar yüklemede hep dolu (details.js:368-370). Tek seferlik tür yok. | `worldState.res` | `details.start` `c.taken = max(0, (until − time.totalHours())·60)` sn'ye ayarlar. 1 oyun saati 60 sn (`dayMinutes 24`, sky.js:45, 235). | `details.collect` (376-389): `res[id] = totalHours + 4` (bugünkü 240 sn ile aynı). İstem kimliği `'shell'+c.x` → `kabuk_<i>` (278). Kazı alanları tasarım gereği yenilenir (`treasure.found`, gerçek saat, 218, 230; günlük gösterimi gerçek tarih kullanıyor, journal.js:143); değişmez (K-3). (inceleme düzeltmesi) Co-op'ta kabuklar bugün istemci başına yereldir; host yetkisi Faz 2'nin `feat:shell` niyetiyle gelir ("host'ta 240 sn bekleme"). Birim uyumu için Faz 2'nin `until`'i de oyun saati (`time.totalHours`) olur; Faz 4 konuğa ayrıca `res` göndermez. | T8: kabuk topla → kaydet → yükle → görünmez; 4 oyun saati benzetiminden sonra görünür |
| 5 | **Açılan geçitler** | Tapınak kapısı: `temples[fid].done`. Plaka kafesi: `solved`. | Kalıcı (islands.js:835; hazards.js:495-502). Plaka testsiz. | `islands.temples`, `hazards.solved` | Kapı açık kurulur (835). Kafes gömülü ve çarpıştırıcısız kurulur (501-502). | Canlı fark: kapı ve kafes `worldState.on('change')` ile açılır (co-op). Faz 6 geçitleri aynı `open` bayrağını kullanır. | T9 |
| 6 | **Çözülen bulmacalar** | Tapınak `{seq, done}`; plaka `solved` | Kalıcı. Yarım dizi bilinçli olarak taşınmaz (834, bilinen #35). | aynı | Levye eylemi `done` ise "zaten çözüldü" der (841). +250 XP (`templeOpened`, progress.js:86) yalnız çözüm anında verilir. | `solve` (508-519) ve levye eylemi `tryClaim` kullanır (çift tetikleme yok). | T9 (levyeler gerçek etkileşimle çevrilir) |
| 7 | **Gizli hazineler** | Ada sandıkları ve batık şehir: `opened`. Sunak: `opened('altar'+fid)`. Gizli sandık: `looted`. Martı Batığı: `opened('marti_batigi')`. | Ada sandığı, sunak ve gizli sandık kalıcı. **Martı Batığı her oturumda yeniden açılıyor** (D-08). **Açılmış sandık görsel olarak kapalı, istem duruyor** (D-19). | `islands.opened`, `hazards.looted` | Ada sandığına `cond: () => !has(id,'opened')` eklenir (D-19). Model ve çarpıştırıcı aynen kurulur (değişmez 2). Açılmışsa sandık soluk renkte kurulur ve yanına açık kapak ilkel nesnesi konur. Kit'te açık sandık parçası yok: yalnız `kk:dungeon:chest` ve `chest_gold` var. (inceleme düzeltmesi) Oturum içinde açılan sandıkta örneklenmiş toplu çizimin (`B.batch`) tek örneğinin rengi değiştirilmez; yalnız kapak ilkel nesnesi `B.group`'a eklenir, istem `cond` ile kaybolur. Soluk renk yalnız yeniden kurulumda `_place(..., {tint})` ile verilir. Batık sandığının kapağı bugün de aralıktır (props.js:472-473); kapak nesnesine tutamak saklanır, açılınca açısı artırılır. | `_chest` (742-752; ölü `once:true` alanı kaldırılır, YB-6); sunak (857-862); `seagear.openWreck` (130-139) → `tryClaim('marti_batigi','opened')`; seagear sağlayıcısı (117-124) `has` kullanır; `start` (128) artık sıfırlamaz. | T8 (ada sandığı, batık), T9 (sunak, gizli sandık) |
| 8 | **Özel etkileşim nesneleri** | Tutsaklar: `freed`. Eski günlük: `flags.gunluk`. Boss parçaları: `bosses.defeated` + `flags.parca1`/`kizilYenildi`. | Tutsak kalıcı, ama **eylem durumu denetlemiyor**: E basılı tutulunca sınırsız altın ve XP (D-01; interact.js:61-65). Günlük D-02 ile kirlenebiliyor. | `islands.freed`, `quests.flags`, `bosses.defeated` | §6.2 kod örneği: `cond` + `tryClaim` + R değişmezliği. Kurtarılmış tutsak kurulmaz. | `_prison` (932-970) | T8: hücrede 10 sn E basılı tut → toplam +120 altın, +80 XP; kaydet → yükle → istem yok |

**"Ada yeniden yüklenince kayıtlı durum uygulanmalı" denetimi:** `islandBuilt` olayından sonra (islands.js:392) `worldState.auditIsland(id)` test kancası çalışır. Bu kanca adanın kataloğundaki her nesne için "beklenen durum ↔ kurulan nesne" eşleşmesini döndürür (`DK.worldState.audit('korsan_kasabasi')`).

### 6.5 Dinamik nesneler

**Ganimet keseleri (D-14):** `treasure.save` (120-127) yalnız `keep:true` keseleri yazar (en çok 40). Kese `{id, pos, items, from, ship, local, t}` biçimindedir; `pickupNet` (579-580) ile aynı alanlar. Normal keseler (10 dk ömür) geçicidir ve yazılmaz. Yüklemede kese, arazi hazırlandıktan sonra doğar. Güverte kesesi gemi kimliğine bağlanır. Ada çarpıştırıcıları kurulmamışsa kese `physics.groundAt` yerine arazi yüksekliğine sabitlenir ve ada kurulunca yeniden yerleşir.

**Kayık ve oyuncu kipi (D-16):**
- `player.mode` yazılır; `onShip` geriye uyumluluk için kalır.
- (inceleme düzeltmesi) `ship.boat = {state, x, z, yaw, cargo}` (Rowboat, ship.js:748+). Gemi bölümüne eklenir, çünkü kayık `createPlayerShip` içinde, sistemler başlamadan önce kurulur (game.js:117, shipControl.js:37); WorldState o anda henüz yüklenmemiştir. v0.4 `Ship.serialize` bu alanı düşürür (yalnız-ekleme kuralına uygun).
- Yüklemede kayık suyun içindeyse son konumunda kurulur, oyuncu kayıkta başlar ve kayıktaki sandıklar kayığa geri yüklenir. Bugün kayıktaki sandık zemin sandığı olarak yazılıyor (treasure.js:124). (inceleme düzeltmesi) Sandıklar `treasure.start`'ta `ship.boat.cargo` kimlik listesine göre kayığa bağlanır; kayık `createPlayerShip`'te (game.js:117) sandıklardan önce kurulduğu için sıra uygundur; v0.4 için sandıklar `treasure.chests`'te zemin sandığı olarak da yazılmaya devam eder.
- Dümende kimse yokken `anchorState==='up'` ve `sailTarget > 0` olan gemi yüklemede `sail = sailTarget = 0` yapılır (shipControl.js:32-33 sonrası).

### 6.6 Düşman kampları ve boss tetikleri

- **D-07:** `enemies.start` (1311-1322) her grup için `spawned = false, nightDone = false` yapar. `cooldown` ve `killed` korunur. Aynı işlem 2→3 göçünde de yapılır (§2.4). Kabul: yakın kampın düşmanları yüklemeden sonraki 1 sn içinde doğar (`_populate`, 1549).
- **D-17:** `morvanSpawn` ve `kizilSpawn` `quests.flags`'ten çıkarılıp `quests.rt`'ye (çalışma zamanı, kaydedilmez) taşınır (276-290). Göçte silinir. Kabul: arenada kaydedilip yüklenince boss 1 sn içinde doğar.

### 6.7 D-xx çözümlerinin özeti (dünya)

| Bulgu | Kök neden (kısa) | Çözüm | Yer |
|---|---|---|---|
| D-01 | Tutsak eylemi `freed`'i denetlemiyor, `cond` yok | `cond` + `tryClaim`; ödül tek seferlik olaya bağlanır | islands.js:956-967 |
| D-07 | `spawned` kayıttan aynen yükleniyor | `start`'ta ve göçte normalize | enemies.js:1319 |
| D-08 | `wreckOpened` kaydedilmiyor, `start` sıfırlıyor | `islands.opened('marti_batigi')` + `has/tryClaim` | seagear.js:115-139 |
| D-13 | Kaya her kurulumda `'set'` | `boulders` kaydı; dinlenme konumunda kurulur | hazards.js:297-356, 416-425 |
| D-14 | Keseler kaydedilmiyor | `keep` keseleri ≤ 40 kaydedilir | treasure.js:120-127, 550-580 |
| D-17 | Tetik bayrakları kalıcı | `quests.rt`; göçte silinir | quests.js:121-124, 276-290 |
| D-19 | Sandık modeli ve istemi duruma bağlı değil | `cond` + soluk görünüm + kapak; değişmez 2 korunur | islands.js:742-752, 1149-1158 |
| YB-1 | Kurtarılan tutsak R akışını kaydırıyor | `_npcRoll` | islands.js:950-969, 528-542 |

---

## 7. Oyuncu ilerlemesi

### 7.1 On bir alanın bugünkü durumu ve hedef

"Test" sütunu audit_D'deki durumdur. Hedef testler §10'dadır.

| # | Alan | Kayıt / yükleme (bugün) | Test | Sorun | Hedef |
|---|---|---|---|---|---|
| 1 | **Korsan rütbesi** | `progress.level` (progress.js:100, 109); rütbe türetiliyor (`rankOf`, 17) | yok | doğrulama yok | int 1…30; rütbe kaydedilmez, türetilir. Test T11: seviye 7 → kaydet → yükle → `rankOf` aynı. |
| 2 | **Deneyim** | `progress.xp` (101, 109) | yok | `xp > need(level)` olabilir (elle) | 0…need(level) aralığına sıkıştırılır; 30. seviyede 0 (125). T11. |
| 3 | **Yetenekler** | `skills`, `points` (102-104); `recompute` → `G.mods` (153-163) | yok | anahtar ve rütbe denetimi yok | Anahtar ∈ 12 kimlik, rütbe 1…3, `points` kuralı (§3.4). T11: `G.mods.melee` yüklemeden sonra aynı. |
| 4 | **Envanter** | `inv.stacks` (inventory.js:76-82; game.js:129, 169) | 12 K01 (kılıç), 14 L03 (deniz ekipmanı) | `load` şema denetimi yapmıyor; balık verisi `innerHTML`'e giriyor (YB-2) | §3.3 yığın kuralları; görüntü alanları katalogdan; bilinmeyen eşya `extra`. T12: yığın sayıları, balık, harita, parça verisi korunur. |
| 5 | **Para** | `inv.gold` (76, 79; game.js:129) | **yok** (hiçbir testte) | `NaN`/`null` → 0, sınır yok | int 0…1e9. T12'de altın birebir karşılaştırılır. Kozmetik atomikliği §7.2. |
| 6 | **Gemi geliştirmeleri** | `ship.upg/typeId/look/hold` (ship.js:696-698; shipControl.js:25-30); `misc.ownedShips/crewHired` (main.js:75-79) | yok | Bilinmeyen tip çöküyor (ship.js:20). `ownedShips` tasarım gereği "sahip olunmuş" kaydı: eski gemiye dönüş yeniden fiyat ister, geliştirmeler sıfırlanır ("mevcut gemin limanda satılır", panels.js:53; shop.js:208-218; shipControl.js:46). | §3.3 gemi kuralları. Davranış değişmez; panelde metin netleştirilebilir. T12: upg 2/1/3, brigantine, görünüm, ambar, gülle ve tahta korunur. |
| 7 | **Kozmetik kilitleri** | `profile.unlocked` (shop.js:248-254 → main.js:86) | yok | D-15: kilit hemen yazılıyor, altın düşüşü ise sonraki kayıtta; profilin yedeği yok | §7.2 |
| 8 | **Görev ilerlemesi** | `stage, flags, side, completed, boardSeed` (quests.js:76-94, 121-124) | yok | D-17, D-02, YB-3 | Göç ve onarım (§2.4, §3.4); yan görev şablondan; `rt` bayrakları. T13: aşama, bayraklar, alınmış yan görevin ilerlemesi, tamamlananlar. |
| 9 | **Keşif verileri** | `discovered` (82), `fog` (84, 98-119), `markers` (88) | yok | Bozuk sis `atob` istisnasıyla yüklemeyi kesiyor (D-06) | Sis uzunluk ve `atob` ön-denemesi; bozuksa yalnız sis sıfırlanır. T13: keşif sayısı ve sis bit sayısı birebir. |
| 10 | **Koleksiyonlar** | `collection` (86), `stats` (85) | yok | Balık verisi tam kopyalanıyor (158); XSS yüzeyi | Görüntü alanları FISH'ten; `count`, `weight` korunur. T13. |
| 11 | **Başarımlar** | `achievements` (87, 220-229) | yok | — | Anahtar ≤ 64, değer tarih dizesi ≤ 20. T13: açılmış başarımlar korunur, yeniden "açıldı" bildirimi çıkmaz. |

### 7.2 Kozmetik satın alma atomikliği (D-15) ve profil sürümü

- (inceleme düzeltmesi) Satın alma toplu yapılır: `creator.finish` kilitli parçaları tek tek `unlockCosmetic` ile alıyor (creator.js:146-150), tek onayda en çok 5 parça. Yeni `shop.unlockCosmetics(keys)` toplam fiyatı bir kez denetler ve aşağıdaki sırayı **bir kez** uygular (tek onayda tek `commit`). İlk taslaktaki "her parçada hemen `saveNow`" en çok 5 ardışık tam kayıt üretip kuşakları anlamsız kopyalarla dolduruyordu. Sıra:
  1. Altın düşülür ve yuvanın `misc.cosmetics` defterine anahtar eklenir.
  2. **Hemen** `saveNow(false, 'cosmetic')` çağrılır.
  3. Yuva kaydı başarılıysa `profile.unlocked`'a eklenir ve `profileChanged` yayınlanır.
  4. Yuva kaydı başarısızsa altın geri verilir ve kilit açılmaz: "Satın alma kaydedilemedi; altının iade edildi."
- **Onarım:** Önyüklemede bütün yuvaların `misc.cosmetics` defterleri `profile.unlocked`'a birleştirilir. Kilit hiçbir zaman silinmez. "İkisi birden ya da hiçbiri" ölçütü böylece sağlanır: 2. ile 3. adım arasında bir çökme olursa defter profili onarır. Konuk kipinde satın alma Faz 2'deki `cosmetic` işlemine bağlıdır (⟷UYUM-2). (inceleme düzeltmesi) Online konukta satın alma Faz 2'nin `tx{svc:'cosmetic'}` işlemidir ve kilit konuğun host'taki profiline (`gbook` → `unlocked`) yazılır; `misc.cosmetics` defteri yalnız tek oyunculu ve host yuvası içindir.
- **Profil v2:** `{version:2, …}` (§3.3). Yazım `store.commitAux('profile')` ile yapılır (ana + `.bak`). Profil bozulursa `.bak`'tan kurtarılır, o da yoksa yuva defterlerinden kilitler yeniden kurulur.

---

## 8. Co-op

### 8.1 Geç katılan konuğa dünya durumu (D-03)

(inceleme düzeltmesi) Bu alt bölüm Faz 2 nihai tasarımına göre yeniden yazıldı. İlk taslaktaki `ws` anlık görüntüsü, `{t:'ws', ops}` fark iletisi, `islands.applyChange` ve `applyNetSnapshot` **kaldırıldı**: Faz 2 aynı işi `worldPart.feats` (`{opened, freed, temples, hazards:{gone, solved, looted}, wreck, shells}`), `featSt{id, st, until?}` yayını, `feat` niyeti, `islands.netState/applyNet` ve `hazards.applyFromHost/syncRemoteSets` ile yapıyor (Faz 2 nihai §6.8, §11). İki paralel kanal aynı kümeleri iki kez yazar ve h2c şemasının "kırpma değil ret" kuralı yüzünden reddedilirdi.

- **Faz 4'ün payı:**
  1. `worldState.feats()` Faz 2'nin `worldPart.feats` alanına veri kaynağıdır; `mark/tryClaim` → `change` olayı → Faz 2'nin `featSt` yayını.
  2. **Şema uzantısı:** Faz 4'ün eklediği kaya durumu (`<fid>_kaya`: `used` + `[x, z, s]`) Faz 2'nin `feats.hazards`'ına `boulders:{id:[x,z,s]}` olarak, `featSt`'ye `{id, st:'used', pos:[x,z,s]}` olarak eklenir. Bu, Faz 2 `schema.js` h2c şemasının güncellenmesini gerektirir (⟷UYUM-3). Kaya yuvarlanması bugün her istemcide ayrı benzetilir (hazards.js:358-427, `netApply` 'roll'); kalıcı dinlenme konumu host'unkidir ve konuğa `featSt` ile gider.
  3. **Konukta yeniden kurulum:** `applyNet` kurulu bir adanın durumunu değiştirince ada `_drop`/`_build` ile yeniden kurulur; YB-1 düzeltmesi (§6.2) bu yeniden kurulumun yerleşimi değiştirmemesini sağlar. Çekirdek kamp seti için `hazards.rebuildCore()` eklenir (`CORE_SETS` hazards.js:34'te dışa aktarılmıyor; ilk taslaktaki `hazards._buildCore(CORE_SETS[0])` main.js'den çağrılamazdı).
  4. `day` alanı bugün `world` iletisinde yok (net.js:519); Faz 2 `worldPart.time`'ına `day` eklenmesi Faz 4'ün isteğidir (kabuk zamanlayıcısı, gelgit, takvim).
- **Boyut:** (inceleme düzeltmesi) Host→konuk JSON iletisinde bağlayıcı sınır 64 KB değil, PeerJS 1.5.5'in 16 300 baytlık eşiğidir (peerjs.min.js `_send` → `message-too-big`; net.js:233 `_dropPeer`). Bu yüzden `ws`'nin v0.4 `world` iletisine eklenmesi (ilk taslaktaki geçici yol) **yapılmaz**: uzun oturumda iletiyi eşiğin üstüne itip geç katılan konuğu düşürebilirdi. Faz 2 gecikirse Faz 4 yalnız ayrı bir iletiyle, parça başına ≤ 15 000 bayt ölçerek gönderir.
- **Kabul:** Geç katılan konukta kümeler host'la aynı; host'un kayıt-yükleme döngüsünden sonra da aynı (Faz 4'ün kalıcılık katkısı). Konuğun yaptığı eylemin host kaydına girmesi ve yeniden katılımda "Sandık boş" Faz 2'nin R14/E-1 testleridir.

### 8.2 Konuk kaydı başka dünyadan bayrak sızdırmamalı (D-02)

1. **Yazım:** (inceleme düzeltmesi) Faz 2 kararıyla v0.5 konuğu `dksh.guest.0`'a yazmaz; `saveNow`'ın konuk dalı (main.js:199-206) yalnız `dksh.wcache.<w>`'yi yazar. Önbellek kişisel alanları `pq` altında tutar; `stage`, `flags`, `markers` ve `boardSeed` önbelleğe girmez.
2. **Göç ve ithalat:** Eski `dksh.guest.0` ithalat kaynağı olarak okunurken bu alanlar bellekte atılır (§2.4); kayıt diske geri yazılmaz.
3. **Katılım:** `applyWorld` (ya da Faz 2'nin `worldPart` uygulayıcısı) bayrakları **değiştirir**, birleştirmez (main.js:336); (inceleme düzeltmesi) konuk tarafındaki `story` işleyicisi de değiştirir (net.js:568 bugün `Object.assign` ile birleştiriyor). `quests.start` konukta `flags = {}` ile başlar.
4. **Host tarafı onarım:** §3.4 tutarlılık kuralları online yuva yüklenirken çalışır. Daha önce kirlenmiş host kayıtları (aşama < 3 iken `gunluk=true`) temizlenir, günlük yeniden görünür ve aşama 2'de alınabilir.
5. **Canlı koruma:** `story` iletisinde aşamaya uygun bayrak beyaz listesi Faz 2'nin işidir (B-12; ⟷UYUM-7). Faz 4'ün tutarlılık kuralı bu listenin kaynağı olarak kullanılabilir (`STORY_REQ`).

### 8.3 Konuk ilerlemesinin periyodik kaydı (D-09)

- (inceleme düzeltmesi) **Yetkili kopya host'ta:** Faz 2 kararıyla konuğun ilerlemesi host'un `dksh.gbook.<w>` defterinde tutulur ve host'un her kaydında (dünya → defter sırası, Faz 2 nihai §4.2) yazılır; host'un otomatik kaydı 120 sn, olay tetikli kayıt (§4.7) ≈ 2 sn'dir. Konuk sekmesi çökse de ilerleme en çok bu aralık kadar kaybolur.
- **Konukta periyodik önbellek:** game.js:218 → `if (this.autosaveT > 120) { this.autosaveT = 0; G.emit(G.isHost ? 'autosave' : 'guestAutosave'); }`. main.js:251 yanına `G.on('guestAutosave', () => handlers.saveNow(false))`; konuk dalı yalnız `dksh.wcache.<w>`'yi yazar.
- **Eski anahtarlar:** `progress._guestSave` (110) ve `GUEST_KEY` yazımları kaldırılır (91, 108, 138, 149 ve main.js:204). (inceleme düzeltmesi) `dksh.progress.guest` ve `dk_progress_guest` **silinmez ve taşınmaz** (Faz 2: salt okunur ithalat kaynağı; progress.js:98'deki taşıma ve `removeItem` de kaldırılır). İthalat özetinde iki kaynaktan `(level, xp)` sözlük sırasıyla büyük olan, eşitlikte yetenek toplamı büyük olan seçilir.
  - Sürüm düşürmede risk yok: v0.4 `guest.0.progress` varsa onu kullanır (progress.js:96); eski kayıtlar değişmediği için v0.4 aynen açar.
- **Duraklatma menüsü** (menu.js:348): Konuğa "Kişisel ilerlemeyi kaydet" düğmesi eklenir (önbelleği yazar, host'tan defter kaydı ister). Bildirim (main.js:205): "Kişisel ilerlemen kaydedildi."
- **Kabul (K-10):** 130 sn benzetimden sonra konukta `dksh.wcache.<w>` ve host'ta `dksh.gbook.<w>` içindeki profil güncel (altın, seviye); konuk sekmesi `beforeunload`'sız kapatılıp yeniden katılınca profil host'tan geliyor; `dksh.guest.0` ve `dksh.progress.guest` bayt bayt aynı (T-K2).

### 8.4 Host yetkili konuk profili: Faz 4'ün depolama payı

(inceleme düzeltmesi) Faz 2 nihai tasarımı konuk ilerlemesini host'ta `GuestBook` ile tutar (A'nın deposu; B'nin bağlı eşya ve `sid` alanları). Konuğun yerel kopyası yalnız önbellektir (`wcache`). Faz 4 bu modelin kayıt tarafını tanımlar:

| Konu | Tasarım |
|---|---|
| Yer (K-4, ⟷UYUM-2) | (inceleme düzeltmesi) `dksh.gbook.<worldId>` = Faz 2 biçimi `{v:1, w, list:{gid: profil}}` + Faz 4'ün eklediği isteğe bağlı `slotSeq`. Yuva içi `guests` seçeneği düştü. |
| Profil şeması | A ve B'nin ortak alanları: `inv` (§3.3 yığın kuralları; `sid` ve `b` bağlı-eşya alanı izinli), `prog`/`progress` (§3.3), `pq`/`quests` (kişisel alanlar), `unlocked`, `name` (`cleanName`), `createdAt/lastSeen`, `txLast`/`txSeq`, defter halkası (≤ 200, A). Anahtar ve belirteç özetleri: A `key` (base64url 32 B), B profil anahtarı (`sha256(tok)`'un ilk 32 onaltılığı ya da `f:`+FNV). |
| Sınırlar | Profil başına ≤ 24 KB. Dünya başına ≤ 16 profil (Faz 2 nihai §4.2; 17.'de en eski arşivlenir). Defter ≤ 384 KB (§3.5). (inceleme düzeltmesi) |
| Yedek | Yuvayla aynı kuşak politikası (`commitAux`). Bozuk profil **silinmez**, `quarantine` listesine alınır ve host'un "Tayfa" panelinde görünür. |
| Bağ | `gbook.w` yuvanın `worldId`'si ile eşleşmezse defter yüklenmez ve uyarı gösterilir (yanlış yedek eşleşmesi). (inceleme düzeltmesi) Yuvada `worldId` yoksa (v0.4 gidiş-dönüşü) önce `dksh.gslot.<N>`'den alınır. `slotSeq` uyuşmazlığı en çok bir kayıt aralığıdır; bildirim gösterilir. |
| Dışa aktarma | Host'un dışa aktarımı defteri içerir. Faz 2-A notu: belirteç ve anahtarlar host'un kendi dosyasında açıkta durur, bu belgelenir. |
| İlk katılım ithali | Kaynak, konuğun salt okunur `dksh.guest.0` (+ `dksh.progress.guest`) kaydıdır. Tavanlar Faz 2 nihai §4.4'teki "Sınırlı" politikadır (altın ≤ 500, seviye ≤ 10, yalnız silah/araç/sarf/mermi). Faz 4 bu kaynağın **doğrulanmış** biçimini verir. (inceleme düzeltmesi) |

### 8.5 Tarayıcıdan bağımsız konuk ilerlemesi: seçenekler

**Sunucu gerektirmeyenler** (v0.5'te uygulanabilir):

| Seçenek | Ne sağlar | Sınır | Öneri |
|---|---|---|---|
| **S-a. Host'ta profil** (§8.4) | Konuğun tarayıcısı silinse de ilerleme host'ta durur. Konuk yeniden katılınca profili geri gelir. | Konuk belirtecini kaybederse host profili elle bağlar (Faz 2-A §4.12). | **Temel** (Faz 2 + 4) |
| **S-b. "Korsan Kodu" (profil kodu)** | Konuğun dünya belirteci taşınabilir olur. Başka bir tarayıcı ya da cihazda aynı kimlikle katılınır, host yetkili profili geri verir. Biçim: `DKSH1.<base64url(JSON{f:'dksh-profil', v:1, w, room, g, k, at})>.<fnv32>` (inceleme düzeltmesi: Faz 2 nihai A'nın `wtok` `{g, k}` belirtecini seçti). Yaklaşık 200 karakter; metin, QR ya da dosya olarak aktarılır. | Kod bir **taşıyıcı sırdır**. Arayüz uyarır: "Bu kodu kimseyle paylaşma; kodu bilen kişi bu dünyada senin karakterinle girer." Host anahtarı "Tayfa" panelinden yenileyebilir. | **Önerilir**; uygulama Faz 5'te (K-9, inceleme düzeltmesi) |
| **S-c. Host imzalı özet** | Host konuğa periyodik olarak yetkili profilinin özetini ve `sig = HMAC-SHA256(hostSecret, kanonikJSON(özet))`'i gönderir. `hostSecret` yalnız host yuvasında durur. Konuk bunu önbellekte ve Korsan Kodu dosyasında saklar. Host eski bir yedeğe döndüyse ya da defter bozulduysa konuk özeti sunar. Host imzayı doğrular ve `rev` daha yüksekse profili geri yükler. | Host'un kaydı varsa eski özetler `rev` denetimiyle reddedilir (geri sarma yok). Host defteri kaybettiğinde konuk, host'un imzaladığı daha yeni bir durumu seçebilir; bu "arkadaşlarla co-op" güven modelinde kabul edilir. `file://`'de saf JS HMAC yedeği kullanılır (Faz 2-A §2.2). | İsteğe bağlı; Faz 5 (K-9, inceleme düzeltmesi) |
| **S-d. Yerel dayanıklılık** | Periyodik kayıt (D-09), `navigator.storage.persist()` isteği, oturum sonunda "dışa aktar" hatırlatması | Tarayıcı verisinin silinmesine, gizli pencereye ve Safari'nin 7 gün kuralına karşı garanti vermez | Uygulanır |
| **S-e. Dünyalar arası taşıma** | Konuğun `guest.0` kaydı yeni dünyalara ithal kaynağıdır | Başka host'un imzası doğrulanamaz; sunucusuz modelde dünyalar arası güven **olanaksız** → tavanlı ithal (Faz 2 nihai §4.4) | Faz 2 politikası |

**Sunucu gerektirenler** (ayrı karar, K-7):

| Seçenek | Gereken | Sağladığı | Maliyet ve yük |
|---|---|---|---|
| **H-1. Hesap + bulut kayıt** (Supabase, Firebase, Cloudflare Workers + D1/KV) | Kimlik doğrulama (anonim → e-posta/OAuth), kayıt API'si, `rev`/`If-Match` çakışma çözümü, sunucu tarafı şema doğrulaması (**aynı `saveSchema.js` modülü**), yedek geçmişi | Cihazlar arası kayıt; tarayıcı silinmesine dayanıklılık; konuk profillerinin dünyalar arası taşınması (Faz 2'deki S1/S2) | 10–20 iş günü; 0–25 $/ay; KVKK/GDPR yükümlülükleri; kendi alan adı |
| **H-2. Üçüncü taraf depolar** (Google Drive `appDataFolder`, Dropbox) | OAuth istemci kaydı, https kökeni (`file://`'de çalışmaz) | Kendi sunucusu olmadan bulut yedeği | Dış hizmete bağımlılık; izin ekranı |
| **H-3. Otoriter oyun sunucusu** | Benzetimi sunucuda çalıştırmak | Hile önleme (host hilesi dahil) | En yüksek maliyet; bu sürüm kapsamı dışında |

**Faz 4'ün H-1'e hazırlığı** (kod maliyeti düşük):
- Depolama arka ucu arayüzü (§4.1).
- `saveSeq`/`rev` alanı (§2.1).
- Bağımsız ve saf `saveSchema` modülü; sunucuda yeniden kullanılır.
- `worldId` ve profil kimlikleri (§8.4).

### 8.6 Faz 2 ile uyum noktaları

| Kod | Konu | Faz 2 nihai / Faz 3 kararı (inceleme düzeltmesi) | Faz 4 kararı |
|---|---|---|---|
| ⟷UYUM-1 | `worldId` | `crypto.randomUUID()`; yuva üst düzeyi + `dksh.gslot.<N>` (A) | Online yuvada Faz 2'ninki kullanılır; Faz 4 tek oyunculu yuvalarda da üretir (aynı biçim). v0.4 gidiş-dönüşünde `gslot`'tan ya da son v3 kuşağından geri alınır (§2.7). |
| ⟷UYUM-2 | Konuk profili deposu | `dksh.gbook.<worldId>`, `{v:1, w, list}`, ≤ 16 profil (A) | §8.4; Faz 4 `slotSeq` ekler, doğrulayıcı ve kuşak politikası (`commitAux`) sağlar. |
| ⟷UYUM-3 | Dünya durumunun taşınması | `worldPart.feats` + `featSt{id, st, until?}` + `feat` niyeti (B'nin adları, A'nın parçalı `worldPart`'ı) | Faz 4 paralel kanal kurmaz; `worldState.feats()` veri kaynağıdır; kaya `used` + konum için şema uzantısı (§8.1). |
| ⟷UYUM-4 | Konuğun host verisini doğrulaması (B-18) | h2c şeması (`schema.js`) | `saveSchema` alan kuralları h2c şemasıyla aynı sınırları kullanır (ör. `markers ≤ 61`); sınırlar tek tabloda tutulur. |
| ⟷UYUM-5 | Belirteçler | `dksh.wtok.<w>` = `{g, k, room, at}` (A) | Dışa aktarma beyaz listesinde; gizlilik uyarısı (§5.1). |
| ⟷UYUM-6 | `version` alanı | Faz 2 üst düzey `version`'ı değiştirmez | `version` Faz 4'e aittir (K-1, 3 olur). Çatışma yok. |
| ⟷UYUM-7 | Hikâye bayrak beyaz listesi | `story` beyaz listesi (B-12), `worldPart.quests.flags` beyaz listesi | Kaynak `STORY_REQ` (§3.4) |
| ⟷UYUM-8 | Etkileşimlerin host otoritesi | Tür başına açık işleyiciler; `feat` kimlikleri `chest:`, `altar:`, `lever:`, `free:`, `wreck`, `shell:`, `pzc:` | `worldState.tryClaim`; D-01 düzeltmesi aynı `_prison` eylemine dokunur, sıra: gardiyan denetimi → `tryClaim` → ödül (online konukta ödül host'ta). |
| ⟷UYUM-9 | Yığın kimliği `sid`, bağlı eşya `b` | Profil yığınlarında (B) | Tek oyunculu kayıtta silinir, profilde korunur. |
| ⟷UYUM-10 | Konuk önbelleği | `dksh.wcache.<w>` (`{inv, prof, pq, rev}`) (A) | Depo tanır; dışa aktarılmaz; kilit gerekmez (§4.8-6). |
| ⟷UYUM-11 | Faz sırası | Faz 2, Faz 4'ten önce uygulanır | Adım 10 Faz 2'den sonra; geçici `world.ws` yolu kaldırıldı (§8.1). |
| ⟷UYUM-12 | Eski konuk kaydı | `dksh.guest.0`, `dksh.progress.guest` salt okunur; yalnız ithalat kaynağı | Faz 4 bunları yazmaz, silmez, `.pre3` paketine almaz; yalnız bellekte doğrular (§2.4, §8.3). |
| ⟷UYUM-13 | Test adları | Faz 2 `coop/06e`–`06n`; Faz 3 `18`–`22` | Faz 4: `23`–`26`, `coop/06o`–`06q`. |
| ⟷UYUM-14 | Faz 3 `game.update` | Sabit adım biriktiricisi `acc`, `resetClock()` | Faz 4'ün `game.start` değişikliği `resetClock()`'u korur (§4.6). |

---

## 9. Dosya bazında değişiklik listesi ve uygulama sırası

### 9.1 Yeni dosyalar

| Dosya | İçerik | Tahmini satır |
|---|---|---|
| `js/core/saveSchema.js` | `CURRENT`, `detect`, `migrations{1,2}`, `migrate`, `validate` (bölüm doğrulayıcıları), `prepare(data, ctx) → {data, notes, readOnly, extra}`, `LIMITS`, `STORY_REQ`, `seal/unseal` (FNV); **saf**, Node'da test edilir | 650 |
| `js/core/storage.js` | Arka uçlar (localStorage, bellek), `createStore`, `commit`, `commitAux`, `load/peek/inspect`, kuşak döndürme, kota budaması, `backups(kind, slot)`, `restore`, `.pre3/.bad/.sil` | 450 |
| `js/core/saveLock.js` | (inceleme düzeltmesi) Web Locks; sekme içinde yeniden girişli tutucu; `acquire(kind, slot) → {mode:'owner'\|'readonly'\|'nolock', release, onLost}`. Kira yedeği ve BroadcastChannel yok (K-11). | 80 |
| `js/core/saveIO.js` | Dışa aktarma (tümü / yuva), içe aktarma hattı (biçim tanıma, beyaz liste, önizleme modeli), `apply` (geri alma kaydıyla), `undoLastImport`, önyüklemede yarım içe aktarma kurtarması | 350 |
| `js/world/worldIds.js` | Kimlik kataloğu, `GEN`, `parse`, `byIsland`, `ALIAS`; **saf** | 150 |
| `js/world/worldState.js` | (inceleme düzeltmesi) Mevcut kümeler üzerinde cephe (§6.3): `has/mark/tryClaim/on('change')`, `feats()` (Faz 2 veri kaynağı), kaya ve kaynak verisi için `save/start`, `audit`. Ağ uygulayıcıları Faz 2'de. | 180 |
| `js/ui/saveUi.js` | Kurtarma diyaloğu, yedekler paneli, içe aktarma önizlemesi, depolama paneli, yuva rozetleri, salt-okunur bandı | 420 |
| `tests/node/kayit_sema.mjs` | `detect`/`migrate`/`validate`: fikstürler + kenar durumları + rastgele bozma (hiçbir girdi istisna attırmaz) | 300 |
| `tests/node/kayit_depo.mjs` | `commit`/kuşak/çakışma/kota/çökme enjeksiyonu (bellek arka ucu) | 260 |
| `tests/node/kayit_aktarma.mjs` | İçe aktarma hattı, atomiklik, geri alma, eski dışa aktarma dosyaları | 220 |
| `tests/node/kimlik_sabit.mjs` | Katalog donma testi; (inceleme düzeltmesi) "aynı adada kamp/kale/maden'den sonra plakalı harabe yok" statik değişmez denetimi | 70 |
| `tests/fixtures/kayit/*.json` (+ `*.beklenen.json`) | Gerçek v0.3/v0.4 kayıtları ve beklenen değerler (§10.1) | — |
| `tests/fixtures/katalog_v05.json`, `kimlik_katalogu_v05.json` | Doğrulama kataloğu, kimlik kataloğu | — |
| `tests/fixtures/uretim/v03_kayit_uret.js`, `v04_kayit_uret.js`, `ayikla.cjs` | Fikstür üretim senaryoları (§10.1) | 250 |
| `tests/scenarios/23_dunya_kaliciligi.js` (inceleme düzeltmesi: 18 Faz 3'ün) | Kabul: ada ve nesne durumları (T7–T9) | 260 |
| `tests/scenarios/24_kayit_surum_kurtarma.js` (inceleme düzeltmesi: 19 Faz 3'ün) | Yeni, otomatik ve manuel kayıt; eski sürüm, gelecek sürüm, bozuk kayıt, yedekten kurtarma, yükleme hatası, kota (T1–T6b, T15) | 260 |
| `tests/scenarios/25_ice_dis_aktarma.js` (inceleme düzeltmesi: 20 Faz 3'ün) | T10 | 200 |
| `tests/scenarios/26_ilerleme_kayit.js` (inceleme düzeltmesi: 22 Faz 3'ün) | T11–T13 | 200 |
| `tests/scenarios/coop/06o_kalicilik_gec_katilim.cjs`, `06p_konuk_onbellek.cjs`, `06q_iki_sekme.cjs` (inceleme düzeltmesi: 06e/06f Faz 2'nin) | Co-op kalıcılık, konuk önbelleği, iki sekme | 300 |

### 9.2 Değişen dosyalar

| Dosya:satır | Fonksiyon | Değişiklik | Bulgu |
|---|---|---|---|
| `js/core/save.js` (tümü) | `save.*` | `storage.js` üzerine ince bir yüz. API korunur: `write/read/list/latest/remove/profile/writeProfile/exportAll/importAll`. `read` **ham ama doğrulanmış** en iyi adayı döndürür (testler için; göç `prepare`'de). `write` `expectSeq` göndermez. (inceleme düzeltmesi) `remove` bütün kuşakları `.sil` paketine alır (bugün yalnız '', `.bak`, `.tmp` siliniyor, save.js:47-50). Yeni: `load/peek/backups/restore/commit`. Faz 2'nin `gbook/gslot/wtok/wcache` yardımcıları bu yüzde durur. `importAll` → `saveIO`. | D-04, D-05, D-12 |
| `js/game/game.js:101-150` | `start` | `'loading'` durumu, `autosaveT` başta sıfırlanır, sistem başına `try/catch`, `LoadError`, `abortStart` | D-06, YB-4 |
| `js/game/game.js:152-158` | `stop` | `autosaveT=0`, `saveBlocked` temizliği, kilidin bırakılması | |
| `js/game/game.js:161-178` | `serialize` | v3 üst bilgi (`version, minReader, game, kind, worldId, createdAt`), `player.mode`, `extra` geri yazımı. `saveSeq` ve `_sum` **yazılmaz** (depo ekler). | D-05, D-16 |
| `js/game/game.js:216-218` | `update` | Konuk otomatik kaydı (`guestAutosave`), `saveSoon` kuyruğu | D-09 |
| `js/main.js:75-79` | `misc` | `cosmetics` defteri | D-15 |
| `js/main.js:83-86` | `boot` | Profil v2 doğrulaması ve yedeği, kozmetik defter birleştirmesi, yarım içe aktarma kurtarması (`saveIO.recover`), `buildSaveCatalog` | D-15, D-04 |
| `js/main.js:103` | `boot` | `worldState` kaydı (`misc`, `time`'dan sonra) | §6.3 |
| `js/main.js:157-167` | `handlers.startGame` | `prepare` → kilit (yeniden girişli, §4.8; inceleme düzeltmesi) → `start` → hata ve kurtarma diyaloğu; yeni oyunda `worldId` | D-05, D-06, D-11 |
| `js/main.js:169-172` | `continueLatest` | Tıklama anında yeniden okuma; online için `hostScreen({slot})` | D-10, D-18 |
| `js/main.js:174-185` | `startOnlineHost` | `store.load`, `worldId`, kilit, `gbook` yükleme (⟷UYUM-2) | |
| `js/main.js:187-197` | `startOnlineGuest` | (inceleme düzeltmesi) Faz 2'nin `welcome.prof` akışı; Faz 4 yalnız eski `guest.0` ithalat kaynağını doğrular | D-02 |
| `js/main.js:199-214` | `saveNow` | `saveBlocked`, `commit` sonuç kodları (`conflict`, `quota`, `invalid`, `serialize`, `size`), nedenli bildirimler; (inceleme düzeltmesi) konukta yalnız `wcache` (Faz 2); `progress._guestSave()` çağrısı (204) kalkar | D-06, D-09, D-11, D-12 |
| `js/main.js:216-224` | `toMenu` | Kayıt → kilit bırakma → `menu.render` | D-10 |
| `js/main.js:251` | `wire` | `guestAutosave`, `saveSoon` | D-09 |
| `js/main.js:325-342` | `applyWorld` | Bayraklar değiştirilir (336). (inceleme düzeltmesi) Dünya durumu uygulaması Faz 2'nin `worldPart` uygulayıcısındadır | D-02 |
| `js/main.js:380-385` | dinleyiciler | `pagehide`; salt-okunur sekme yazmaz | D-11 |
| `js/game/progress.js:58-59, 91, 94-99, 108-110, 138, 149` | `start/_guestSave/_levelUp/learn` | Ayrı konuk anahtarı yazımı kaldırılır, `saveSoon` tetiklenir; (inceleme düzeltmesi) progress.js:98'deki taşıma ve `removeItem(GUEST_KEY_OLD)` de kaldırılır: eski anahtarlar salt okunur | D-09 |
| `js/game/quests.js:76-94` | `start` | Doğrulanmış veri; yan görevin şablondan türetilmesi; `rt` | D-17, YB-3 |
| `js/game/quests.js:121-124` | `save` | `rt` hariç; yeni `savePersonal()` (Faz 2 `wcache.pq` için); (inceleme düzeltmesi) `completedIds` ek alanı | D-02, D-17 |
| `js/game/quests.js:210-217` | `_sideCheck` | Ödül `SIDE_TEMPLATES`'ten; (inceleme düzeltmesi) tamamlanınca `completedIds`'e de `id` eklenir; `boardQuests` (234) ikisine bakar | YB-3 |
| `js/game/quests.js:276-290` | `update` | `this.rt.morvanSpawn/kizilSpawn` | D-17 |
| `js/world/islands.js:253-269` | `start/save` | (inceleme düzeltmesi) **Değişmez** (WorldState cephe; P08 `islands.start`'ı doğrudan çağırır) | §6.3 |
| `js/world/islands.js:528-542` | `_npc` | Önceden çekilmiş değerleri (`_npcRoll`) kabul eder | YB-1 |
| `js/world/islands.js:742-752` | `_chest` | `cond`, `tryClaim`, açılmış görünüm; `once` kaldırılır | D-19, YB-6 |
| `js/world/islands.js:830-862` | `_temple` | Levye ve sunakta `tryClaim`; canlı kapı farkı | §6.4-5/6/7 |
| `js/world/islands.js:932-970` | `_prison` | §6.2 kod örneği | D-01, YB-1 |
| `js/world/islands.js:1149-1158` | `_interactables` | (`cond` zaten destekleniyor, 1154) | — |
| `js/world/islands.js` | `_chest` eylemi | (inceleme düzeltmesi) Açılınca kapak ilkel nesnesi eklenir (yerel). Ağ uygulayıcısı (`netState/applyNet`) Faz 2'de | D-19 |
| `js/world/hazards.js:76-87` | `start/save` | (inceleme düzeltmesi) Değişmez; `rebuildCore()` eklenir (konukta yeniden kurulum için) | |
| `js/world/hazards.js:297-356, 416-425` | `_boulderSite/release/_rollBoulder` | `used` + konum; dinlenme kurulumu | D-13 |
| ~~`js/world/hazards.js:429-506`~~ | `_puzzleSite` | (inceleme düzeltmesi) Değişiklik yok; değişmez statik denetimle korunur | §6.2 |
| `js/world/hazards.js:641-669` | `_interact` | `tryClaim`; (inceleme düzeltmesi) ağ farkları Faz 2'nin `applyFromHost`'unda | |
| `js/wildlife/seagear.js:115-139` | `init/start/openWreck` | `marti_batigi` | D-08 |
| `js/world/props.js:466-486` | batık sandığı | Kapak görünümü için tutamak | D-08 |
| `js/world/details.js:252-280, 368-389, 503` | toplanabilirler | `kabuk_<i>` kimliği, `res` zamanlayıcısı | 7.2 kaynak |
| `js/treasure/treasure.js:105-127` | `start/save` | `pickups` (keep) | D-14 |
| `js/game/enemies.js:1311-1322` | `start` | `spawned/nightDone` normalizasyonu | D-07 |
| `js/game/shipControl.js:22-39` | `createPlayerShip` | Dümensiz seyir güvenliği, kayık geri yükleme (`data.ship.boat`). (inceleme düzeltmesi) "Engel içindeyse kaydırma" yok (K-6) | D-16 |
| `js/ship/ship.js:694-703, 748+` | `Ship.serialize`, `Rowboat` | `serialize/restore`; (inceleme düzeltmesi) kayık durumu `Ship.serialize` çıktısına `boat` olarak eklenir | D-16 |
| `js/economy/shop.js:244-258` | `unlockCosmetic` → `unlockCosmetics(keys)` | §7.2 sırası, tek `commit` (inceleme düzeltmesi) | D-15 |
| `js/ui/creator.js:143-153` | `finish` | (inceleme düzeltmesi) Kilitli parçalar tek çağrıda `unlockCosmetics` ile alınır (bugün 146-150'de parça başına) | D-15 |
| `js/ui/menu.js:65-113` | `render` | Rozetler, `peek` özetleri | D-12, D-10 |
| `js/ui/menu.js:128-157` | `slotScreen` | Rozetler, "Yedekler", "Dışa aktar", metin olarak silme onayı, `.sil` | D-12, YB-2, K-8 |
| `js/ui/menu.js:180-193` | `hostScreen` | `hostScreen({slot})` | D-18 |
| `js/ui/menu.js:343-357` | `pause` | Konuğa "Kişisel ilerlemeyi kaydet", salt-okunur bilgisi | D-09 |
| `js/ui/settingsPanel.js:70-80` | Kayıt dosyaları | Yeni içe ve dışa aktarma arayüzü; oyun içinde pasif; geri alma; depolama paneli | D-04, D-10 |
| `js/ui/ui.js:90-97` | `confirm` | `confirmText` (metin) | YB-2 |
| ~~`js/net/net.js:510-522, 532`~~ | `_sendWorld` | (inceleme düzeltmesi) Faz 4'te değişmez; `feats` uzantısı ve `day` Faz 2'nin `schema.js`/`worldPart`'ına eklenir | D-03 |
| `js/net/net.js:326-333` | `story` | ⟷UYUM-7 (Faz 2) | D-02 |
| `js/net/net.js:568` | istemci `story` | (inceleme düzeltmesi) Bayrakları birleştirmek yerine değiştirir (Faz 2'nin h2c `story` işleyicisiyle birlikte) | D-02 |
| `tests/harness/run.cjs` | adım türleri | `reload: true` (sayfa yeniden yüklenir, `__ready` beklenir), `initStorage: {k: v}` (`addInitScript` ile önyüklemeden önce), `storageFault: {failAt, quota}` (`Storage.prototype.setItem` sarmalayıcısı) | test altyapısı |
| `tests/harness/coop.cjs` | seçenek | `--sameContext` (iki sekme, ortak localStorage) | D-11 testi |
| `tests/scenarios/08_kalicilik.js:43` | beklenti | `r.version===1` → `r.version>=1 && !!r.player` (K-1) | |
| `tests/scenarios/13_donma.js` (P08) | — | (inceleme düzeltmesi) Değişiklik gerekmez; `islands.start` biçimi korunduğu için geçer | |

### 9.3 Uygulama sırası

Her adımın sonunda tam tarayıcı regresyonu koşulur (Faz 0 taban listesi) ve **o adıma kadar** gelen yeni testler eklenir.

| Adım | İş | Bağımlılık | Test | Kabul |
|---|---|---|---|---|
| **0** | Test altyapısı (`run.cjs` `reload/initStorage/storageFault`; `coop.cjs --sameContext`) + **v0.3/v0.4 fikstür üretimi** (§10.1) + katalog fikstürleri | — | Fikstürler v0.3 ve v0.4 sunucularında üretilir; `ayikla.cjs` beklenti dosyalarını yazar | `tests/fixtures/kayit/` en az 9 dosya; v0.3 ve v0.4 kayıtları kendi sürümlerinde yeniden yüklenebiliyor |
| **1** | `saveSchema.js` (yalnız saf modül; oyuna bağlanmaz) | 0 | `kayit_sema.mjs` | Bütün fikstürler 3'e göçüyor; beklenen değerler birebir; göç idempotent (`prepare(serialize(prepare(x)))` = `prepare(x)`; inceleme düzeltmesi); 10 000 rastgele bozmada istisna yok |
| **2** | `storage.js` + `save.js` yüzü (davranış: kuşaklar, `_sum`, kota) + `buildSaveCatalog` (inceleme düzeltmesi: `commit` doğrulaması katalog ister; bu adımda `serialize` hâlâ `version:1` yazar, doğrulama `detect` sonucuna göre yapılır) | 1 | `kayit_depo.mjs`; 08, 12 ve 14 yeşil | Çökme enjeksiyonunda ana kayıt her an "eski ya da yeni ve geçerli"; kota senaryosunda ana kayıt değişmiyor; 60 sn içindeki ardışık yazımlarda kuşak döndürülmüyor |
| **3** | v3 `serialize` + yükleme işlemi (`prepare`, `game.start`), `worldId` (Faz 2'nin `gslot`'uyla) | 1, 2 | 24 (T3, T4, T5, T6) | v0.3/v0.4 fikstürleri oyunda açılıyor; gelecek sürüm açılmıyor ve anahtar değişmiyor; yükleme hatasında anahtarlar birebir aynı; (inceleme düzeltmesi) kaydı olan sistemin `start` hatası her zaman `LoadError` |
| **4** | Kurtarma arayüzü, rozetler, yedekler paneli, `continueLatest`, `hostScreen` | 2, 3 | 24 (T4; inceleme düzeltmesi: ilk taslaktaki "T4b" tanımsızdı), 06_arayuz_960 | Bozuk ana kayıtta diyalog çıkıyor; yedeğe dönüş çalışıyor; D-18 düzeliyor; silinen yuva "kurtarılabilir" görünmüyor |
| **5** | İçe ve dışa aktarma (`saveIO`, arayüz) | 1, 2 | `kayit_aktarma.mjs`, 25 (T10) | D-04 ve D-10 kabul ölçütleri |
| **6** | İki sekme kilidi (Web Locks + `saveSeq`) | 2 | `coop/06q_iki_sekme.cjs`; 08, 12, 14 (inceleme düzeltmesi: yeniden girişli kilit) | D-11 kabul ölçütü; aynı sekmede aynı yuvaya ikinci `startGame` diyalogsuz |
| **7** | `worldIds` + `worldState` cephesi (inceleme düzeltmesi: sahiplik devri yok) + YB-1 + yerleşim değişmezliği (statik denetim) | 3 | `kimlik_sabit.mjs`, 23 (T7), `archipelago_sabit.mjs`, 08, 12, 13 (P08 değişmeden) | Determinizm denetimleri birebir |
| **8a** | D-01, D-19 | 7 | 23 (T8 tutsak ve sandık) | |
| **8b** | D-08, D-13 | 7 | 23 (T8 batık ve kaya), 14 | |
| **8c** | Kaynaklar (kabuk `res`; inceleme düzeltmesi: tek seferlik altyapı Faz 6'da) | 7 | 23 (T8 kabuk) | |
| **8d** | D-07, D-17 | 3 | 23 (T8 kamp), 05_dusman_ai | |
| **8e** | D-14, D-16 | 3 | 26 (T12 kese ve kayık) | |
| **9** | İlerleme doğrulaması (11 alan) + D-15 + profil v2 | 1, 3 | 26 (T11–T13), 07_ekonomi | |
| **10** | (inceleme düzeltmesi) Co-op kayıt tarafı: eski konuk kaydının ithalat doğrulaması (D-02), konuk önbelleği `wcache`'in periyodik yazımı (D-09), `gbook` doğrulayıcısı ve kuşakları, `worldState.feats()` + kaya şema uzantısı (D-03). Korsan Kodu ve imzalı özet Faz 5'e (K-9) | 7, **Faz 2** (⟷UYUM-11) | `coop/06o`, `coop/06p`; Faz 2'nin `06e`–`06n` ve mevcut co-op testleri | D-02 kayıt tarafı, D-03 kalıcılık tarafı, D-09 (K-10 okuması) |
| **11** | Belgeler (09. belge güncellemesi, bilinen sorunlar); isteğe bağlı sürüm düşürme kurtarması (§2.7); `file://` tek dosya denetimi (02_tek_dosya; kilit ve kripto yedekleri) | hepsi | tam regresyon | |

---

## 10. Test planı

### 10.1 Gerçek v0.3 ve v0.4 kayıt fikstürlerinin üretilmesi

**Ortam (Adım 0, uygulama aşamasında):**
```bash
(cd /home/user/SON-HAZ-NE-v03 && python3 -m http.server 8083) &   # v0.3 (762f1c7) — tests/ dizini yok; w2 koşucusu kullanılır
(cd /home/user/SON-HAZ-NE     && python3 -m http.server 8084) &   # v0.4 (44d548c)
node tests/harness/run.cjs tests/fixtures/uretim/v03_kayit_uret.js --url http://localhost:8083/index.html --report /tmp/f03.json
node tests/harness/run.cjs tests/fixtures/uretim/v04_kayit_uret.js --url http://localhost:8084/index.html --report /tmp/f04.json
node tests/fixtures/uretim/ayikla.cjs /tmp/f03.json /tmp/f04.json tests/fixtures/kayit/
```
v0.3 test kancalarını sağlıyor (`window.DK`, `DK.sim`, `DK.press`, `__ready`; v03 main.js:133-152). Bu yüzden w2 koşucusu v0.3'ü sürebilir.

**Üretim senaryosu** (sürüme duyarlı; yalnız o sürümde var olan API'ler kullanılır):
- **Tek oyunculu, yuva 0 "zengin":** Rütbe yaklaşık 6 (`progress.gain`), 3 yetenek, envanter (kılıç, tabanca, mermi, 2 balık, `hazine_haritasi{site}`, mücevher yığınları), 4 321 altın.
- Gemi `brigantine` (`shop.buyShip`), `upg {2,1,3}`, görünüm, ambarda 5 tahta ve 1 sandık, hasarlı pruva.
- `crewHired`, kozmetik kilidi (profil), alınmış yan görevin ilerlemesi, bir tamamlanmış yan görev, aşama 3 (`gunluk` dahil).
- 6 keşif, sis, koleksiyon (2 balık, 3 hayvan), 2 başarım, 3 işaret.
- Zemindeki ve taşınan sandıklar, 2 kazı çukuru, 30 günlük kaydı.
- Kampın 140 m içinde kaydedilmiş `spawned:true` grubu (D-07 regresyonu); arenada `morvanSpawn` (D-17).
- `hazards.solved/looted`. **Yalnız v0.4:** gerçek etkileşimle açılmış ada sandığı ve tutsak, tapınak `done`, `hazards.gone` (fıçı ve kasa), batık gemi çeşitlemesi.
- **Online yuva 1:** D-02 kirlenmiş host (aşama 1, `gunluk:true`) — yalnız v0.4.
- **Konuk:** v0.3 `dksh.guest.0` + `dk_progress_guest`; v0.4 `dksh.guest.0` (`quests.stage/flags` ile) + `dksh.progress.guest` (daha yüksek seviyeyle; D-09 iki kaynak). (inceleme düzeltmesi) Konuk kayıtları için co-op oturumu gerekmez: tek sayfalı koşucuda tek oyunculu oturum açılır, `DK.G.online = true; DK.G.isHost = false;` yapılıp `DK.handlers.saveNow(false)` çağrılır; bu, sürümün kendi konuk yazım yolunu (v0.4 main.js:203-204) çalıştırır. Ardından bayraklar geri alınır. v0.3'te aynı yol main.js'teki konuk dalıyla çalışır.
- **Dışa aktarma dosyaları:** Her sürümün `save.exportAll()` çıktısı (`.bak` anahtarları dahil).

**Çıktı:**
- `tests/fixtures/kayit/v03_solo0.json`, `v03_guest.json`, `v03_export.json`, `v04_solo0.json`, `v04_solo_batik.json`, `v04_online1_kirli.json`, `v04_guest.json`, `v04_export.json`.
- Her biri için `*.beklenen.json` (göç sonrası beklenen kehanet değerleri): altın, seviye, xp, yetenekler, yığın sayıları, gemi tipi ve `upg`, aşama, bayraklar, keşif sayısı, sis bit sayısı, koleksiyon ve başarım anahtarları, ada ve tehlike kümeleri, kamp normalizasyonu. (inceleme düzeltmesi) Fikstürlere ambarda balık (`hold.fish`), envanterde ve koleksiyonda yakalama kaydı (`zone/bait/time/date`) ve online host fikstürüne 30'dan fazla işaret eklenir.
- Ad `Test Korsanı` olarak anonimleştirilir; `savedAt` sabitlenir. **Fikstürler bir kez üretilir ve depoya girer.** Üretim senaryoları yeniden üretilebilirlik için saklanır.

### 10.2 Node birim testleri (tarayıcısız, hızlı)

| Dosya | Kapsam |
|---|---|
| `kayit_sema.mjs` | `detect` tablosu (§2.3); 1→2→3 göç adımları ve notları; idempotentlik; `validate`'in her kuralı (bir pozitif + bir negatif örnek); fikstürler × beklenti; **rastgele bozma** (alan silme, tür değiştirme, `NaN`/`null`, aşırı uzun dizi, derin iç içe): hiçbir girdide istisna yok, sonuç RET ya da ONAR; (inceleme düzeltmesi) balık yığını, ambar balığı (`hold.fish`) ve koleksiyonda yakalamaya özgü alanların gidiş-dönüşte birebir korunması; `extra` geri birleştirmesi (v0.5.1 → v0.5.0 → v0.5.1); `strict` ile normal kipin aynı veriyi üretmesi; online host kaydında 61 işaretin korunması |
| `kayit_depo.mjs` | `commit` ve kuşak politikası (zaman taklidi: 15 dk, 2 sa, gün değişimi); doğrulanmamış önceki kayıt yedeğe kaymıyor; `saveSeq` çakışması; kota budama sırası; `failAt=N` ile her adımda çökme → değişmez "ana kayıt eski ya da yeni ve geçerli; en az bir geçerli kuşak var"; `_sum` uyuşmazlığı → uyarı ama yükleme; (inceleme düzeltmesi) 60 sn içindeki ardışık yazımlarda kuşak döndürülmemesi; farklı `worldId`'li önceki kaydın `.sil` paketine alınması; `.pre3` yazılamazsa ilk v3 yazımının reddi; silmede bütün kuşakların pakete girmesi |
| `kayit_aktarma.mjs` | v0.3, v0.4 ve v0.5 dosya biçimleri; beyaz liste; dize olmayan değer → giriş reddi; 2 MB sınırı; kota enjeksiyonu → etkilenen yuvaların bütün anahtarları (`.bak/.h1/.h2/.gun/.pre3` dahil) bayt düzeyinde önceki hâline döner (inceleme düzeltmesi); eski dosyadaki `dksh.progress.guest` ithalat kaynağı olarak alınıyor; yarım içe aktarma kurtarması; geri alma |
| `kimlik_sabit.mjs` | Katalog donması, benzersizlik, önek çakışması yok, `GEN` |
| `archipelago_sabit.mjs` (mevcut) | Değişmeden geçmeli |

### 10.3 Tarayıcı senaryoları (kullanıcının kayıt test listesi)

Her senaryo sonunda: `pageErrors = 0`, `G.state==='playing'` (ya da beklenen menü durumu).

| No | Kullanıcı başlığı | Senaryo | Adımlar | Beklenen |
|---|---|---|---|---|
| T1 | **Yeni kayıt** | 24 | `startGame({kind:'solo', slot:2, data:null})` (main.js:166 ilk kaydı yapar) | Anahtar `version:3`, `worldId` (desen), `saveSeq:1`, geçerli `_sum`; menü kartı adı ve yuvayı gösteriyor; ikinci yeni oyun başka yuvada, `worldId` farklı |
| T2 | **Otomatik kayıt** | 24 | `DK.sim(125)`; ardından önemli olay (`advance`) → `DK.sim(3)`; (inceleme düzeltmesi) kuşak denetimi için `Date.now` taklidi (+16 dk) | `saveSeq +1`, `savedAt` arttı, "Otomatik kayıt yapıldı" bildirimi; olay tetikli kayıt 2 sn içinde ve kuşak döndürmüyor (önceki kayıt < 60 sn); `bak` 120 sn önceki kayıt; saat taklidiyle 16 dk sonra `h1` döndü. `DK.sim` oyun saatini ilerletir, `savedAt` ise gerçek saattir; ilk taslaktaki "`DK.sim(16·60)` sonrasında `h1` dolu" ölçütü kuşak kuralını sınamıyordu. |
| T2b | Otomatik kayıt (konuk) | 06p | (inceleme düzeltmesi) Konuk: host üzerinden altın kazanımı (Faz 2), `progress.gain(5000)`, `DK.sim(130)` | Konukta `dksh.wcache.<w>` ve host'ta `dksh.gbook.<w>` profili güncel; sayfa `beforeunload`'sız kapatılıp yeniden katılınca profil host'tan geliyor; `dksh.guest.0` bayt bayt aynı (K-10) |
| T3 | **Manuel kayıt** | 24 | Duraklat → "Kaydet" (`saveNow(true)`); salt-okunur sekmede tekrar; bayılmışken | Bildirim "Oyun kaydedildi."; salt-okunurda "Bu sekme salt-okunur…" ve anahtar değişmiyor; bayılmışta "Bayılmışken kayıt yapılamaz." (main.js:209) |
| T4 | **Yedekten kurtarma** | 24 | 3 kayıt (zaman taklidiyle `h1` dolu) → ana kayda çöp yaz → `reload` → menü | Kartta "Yedekten kurtarılabilir"; diyalog en yeni yedeği gösteriyor; "Yedekle devam et" → oyun açılıyor, bozuk kayıt `.bad`'de; ilk kayıttan sonra `bak` bozuk değil; Yedekler panelinden `h1`'e dönüş → durum `h1`'deki gibi, eski ana kayıt `bak`'ta |
| T5 | **Bozuk kayıt** | 24 | (a) `{"slot":1,"broken":` (08:42 benzeri); (b) `player` yok; (c) `quests.fog='v2:!!!'` (D-06); (d) bilinmeyen sandık kademesi; (e) 300 KB kayıt; (f) test kancası `DK.game._failStart='quests'` | (a), (b), (e) RET → yedek önerisi; (c) oyun açılıyor, sis sıfır, notta "keşif sisi sıfırlandı"; (d) sandık `extra.chests`'te, oyun çökmüyor; (f) menüye dönülüyor, yuvanın bütün anahtarları birebir aynı, 125 sn benzetimde yazım yok |
| T6 | **Eski sürüm kaydını açma** | 24 | `initStorage` ile `v03_solo0` ve `v04_solo0` fikstürleri → menüden aç | Kartta "Eski sürüm" rozeti; yükleme sonrası değerler `*.beklenen.json` ile birebir; yakın kamp 1 sn içinde doğuyor (D-07); arenada boss doğuyor (D-17); `saveNow` → `version:3`, `.pre3` = özgün dize; yeniden açınca değerler aynı; (inceleme düzeltmesi) v0.3 konuk kaydı + `dk_progress_guest` → ithalat özeti tek kaynakta birleşiyor, iki anahtar bayt bayt aynı kalıyor |
| T6b | Gelecek sürüm | 24 | `{version:999, minReader:999,…}` ve `{version:4, minReader:3,…}` | 999: açılmıyor, mesaj, anahtar bayt düzeyinde aynı; 4/3: salt-okunur açılıyor, `saveNow` yazmıyor, bant görünüyor |
| T7 | **Ada durumu (determinizm)** | 23 | Demirkapı `freed ∅` ↔ `{3}`; Kadim Tapınak açık ↔ kapalı; kamp `gone ∅` ↔ hepsi; her biri `_drop/_build` | Engel ve kayalık konumları, plaka `C/P`, kaya konumu birebir (YB-1); (inceleme düzeltmesi) kayalığın içine konmuş demirli gemi ada kurulunca hasarsız dışarı itiliyor (K-6) |
| T8 | **Ada durumu (kabul)** | 23 | `korsan_kasabasi`'na ışınlan (kamp, kale, yıkık kasaba; Ek A); (inceleme düzeltmesi) önce `DK.hazards.list('boulder')` ile kampta kaya kurulduğu doğrulanır (kaya arazi eğimine bağlı bir adaydır, hazards.js:319), yoksa kayalı başka kamp seçilir; gerçek etkileşimlerle: fıçı ateşle (`ignite` → patlama), kasa kır, takozu sök (basılı E), kasaba sandığını aç; Demirkapı'da muhafızları öldür, hücrede 10 sn E; Martı Batığı'na dal, sandığı aç; çekirdek adada kabuk topla → `saveNow(true)` → `toMenu` → **`reload`** → menüden yükle → aynı yerlere dön | Fıçı ve kasa yok; kaya `rest` ve aynı konumda, istem yok; sandık soluk ve istemsiz, E ile altın değişmiyor; tutsak yok, toplam +120 altın ve +80 XP; batık sandığı istemi yok; kabuk görünmez, 4 oyun saati sonra görünür; `worldState.audit()` hatasız; ayrıca `_drop/_build` sonrasında aynı sonuç |
| T9 | **Bulmaca durumu** | 23 | Kadim Tapınak: yazıttan sırayı oku (`plaque`), üç levyeyi gerçek etkileşimle çevir → kapı açılır → sunağı aç; `ruin_1` plakası: bloğu oyuncu hareketiyle it (`_pushBlock`) → kafes gömülür → gizli sandığı aç → kaydet → `reload` → yükle | Kapı açık, levye "zaten çözüldü", sunak boş, kafes gömülü ve çarpıştırıcısız, gizli sandık boş; XP (+250, +150) tekrar verilmiyor; Taş Muhafız koşulu sağlanıyor (bosses.js:1088) |
| T10 | **İçe/dışa aktarma** | 25 | Tümünü dışa aktar → içerik denetimi → oyunu ilerlet ve kaydet → aynı dosyayı içe aktar → önizleme → "Atla" varsayılanı → "Üzerine yaz" → uygula → menü kartı güncel → geri al; bozuk, aşırı büyük, yabancı ve gelecek sürüm dosyaları; `storageFault{failAt:2}`; oyun içinde düğme; v0.3 ve v0.4 dışa aktarma fikstürleri | Dışa aktarmada yedek anahtarı yok, `__meta` ve `sum` doğru; daha eski dosya uyarısı; uygulamadan sonra DEVAM ET içe aktarılanı açıyor (D-10); geri alma önceki hâle döndürüyor; hatalı dosyalar reddediliyor ve `localStorage` anlık görüntüsü birebir aynı; kota hatasında geri alma ve bildirim; oyun içinde düğme pasif; eski dosyalar göçle içe aktarılıyor, `.bak` anahtarları yok sayılıyor |
| T11 | Rütbe, deneyim, yetenekler | 26 | Seviye 7, xp 123, 4 yetenek → kaydet → `reload` → yükle | Birebir; `G.mods` aynı; elle `points` şişirilmiş kayıtta kural onarımı ve not |
| T12 | **Envanter ve gemi durumu** | 26 | Yığınlar (balık verisi, harita, parça), 4 321 altın, `keep` kesesi (çanta dolu), gemi `brigantine` + `upg` + görünüm + ambar + gülle/tahta + hasar, `ownedShips`, `crewHired`, kayıkta açık denizde kayıt, seyirde kayıt | Hepsi birebir; kese aynı yerde (D-14); oyuncu kayıkta, kayık son konumda (D-16); seyirde kaydedilen gemi `sail 0`; balık adı ve rengi FISH'ten (dosyadaki `<img…>` rengi etkisiz, YB-2); (inceleme düzeltmesi) ambar balığı (`hold.fish`) ve balığın yakalama kaydı (`zone/bait/time/date`, ağırlığa bağlı `value`) birebir |
| T13 | Görev, keşif, koleksiyon, başarım | 26 | Aşama 3, yan görev (2/3), tamamlanan; 6 keşif, sis; koleksiyon; 2 başarım; ödülü değiştirilmiş yan görev içeren kayıt | Birebir; yeniden "başarım açıldı" ya da "keşfedildi" bildirimi yok; yan görev ödülü şablondaki değer (YB-3); (inceleme düzeltmesi) koleksiyondaki yakalama kaydı ("Bölge · Yem · Saat · tarih") birebir, `completedIds` başlıklardan türetilmiş |
| T14 | İki sekme | 06q | Aynı bağlamda iki sekme; A yuva 1'i açar, B de açmayı dener → diyalog → B devralır; (inceleme düzeltmesi) A'da görünürlük değişimi benzetilir (`Object.defineProperty(document,'hidden',{get:()=>true})` + `visibilitychange` olayı; başsız tarayıcıda sekme değişimi bu olayı güvenilir üretmez) | B diyalog görüyor; devralmada A salt-okunur ve bant görünüyor; B'nin altını (9 999) A'nın görünürlük kaydıyla ezilmiyor; kilit yokken (`navigator.locks` silinmiş) `saveSeq` çakışması aynı sonucu veriyor |
| T15 | Kota | 24 | `storageFault{quota: mevcut + 5 KB}` → `saveNow` | Budama sırası uygulanıyor; başarısızsa ana kayıt aynı, bildirim çıkıyor; diğer yuvalar etkilenmiyor |

### 10.4 Co-op senaryoları

| No | Senaryo | Adımlar | Beklenen |
|---|---|---|---|
| T-K1 | `06o_kalicilik_gec_katilim.cjs` (inceleme düzeltmesi: `06e` Faz 2'nin) (2 oyuncu) | Host: çekirdek kampta fıçı patlatır, ada sandığı açar, tapınağı çözer, kaya bırakır → konuk katılır | Konukta `gone/solved/looted/opened/freed/temples/boulders` host'la aynı; konuk aynı sandığı açınca "Sandık boş" ve envanter değişmiyor; menüye dönüp yeniden katılınca da aynı (D-03); konuğun yaptığı eylem host kaydında var (Faz 2 sonrası) |
| T-K2 | `06p_konuk_onbellek.cjs` (inceleme düzeltmesi) | Konuk kaydına `quests:{stage:5, flags:{gunluk:true}}` koy (D-02 repro) → yeni online dünyaya (aşama 0) katıl → hikâye ilerlet; T2b | Host bayraklarında `gunluk` yok; aşama 2'de "Eski günlüğü al" istemi var; `dksh.guest.0` bayt bayt aynı, `wcache`'te `stage/flags` yok; kirli v0.4 online fikstürü yüklenince `gunluk` silinmiş |
| ~~T-K3~~ | Korsan Kodu | (inceleme düzeltmesi) Faz 5'e taşındı (K-9) | — |

### 10.5 Mevcut testlere etkisi

| Test | Etki | Yapılacak |
|---|---|---|
| 08_kalicilik.js:43 | `window._saved` artık `version:3`; `r.version===1` kalır | Beklenti `r.version>=1 && !!r.player` olur (K-1) |
| 08_kalicilik.js:8-10 | Katalog dışı kimlikler (`test_chest_1`, `altartest`…) | Korunur (§3.1-4); değişiklik yok |
| 12_kayit_dongusu.js | Kayma karşılaştırması `savedAt/playTime/world`'ü çıkarıyor | `saveSeq` ve `_sum` serialize çıktısında yok; değişiklik gerekmez. Yeni sabit alanlar (`version`, `worldId`…) döngüler arasında aynı. |
| 13_donma.js P08 | (inceleme düzeltmesi) P08 `islands.start({islands: d})`'yi **doğrudan** çağırır (13_donma.js:59); `startGame`/`prepare` kullanmaz | `islands.start` kayıttan okumaya devam ettiği ve `puzzleState` (islands.js:35-39) yerinde kaldığı için geçer. İlk taslaktaki sahiplik devri bu testi bozardı (§6.3). |
| 14_deniz_ekipmani.js L02/L03 | Batık sandığı | L02 aynı oturumda değişmez; L03'e "kayıt/yükleme sonrası batık sandığı istemi yok" eklenir |
| coop 06a/06b/06d | (inceleme düzeltmesi) Faz 4 `world` iletisini büyütmez (§8.1) | Faz 2'nin `worldPart` parçalaması geçerlidir. v0.4 `world` iletisinde bağlayıcı sınır PeerJS'in 16 300 baytıdır; 64 KB (net.js:42, 248) konuk→host alım sınırıdır. |
| 08, 12, 14 (aynı yuvaya ikinci `startGame`) | (inceleme düzeltmesi) Yuva kilidi | Kilit sekme içinde yeniden girişli olduğu için geçer (§4.8); aksi hâlde "başka sekmede açık" diyaloğu çıkardı. |

### 10.6 Uçtan uca kabul (kullanıcının kabul cümlesi)

> "Adaya git, önemli nesneleri yok et/topla, bulmaca çöz, kaydet, çık, yükle, adaya dön → durum korunmalı; eski (v0.3 ve v0.4) kayıtlar kaybolmamalı."

Bu cümle **T8 + T9** (gerçek etkileşimler, `reload` ile gerçek "çıkış", menüden yükleme, adaya dönüş) ile **T6** (gerçek v0.3/v0.4 fikstürleri, göç, yeniden açma) birlikte karşılanır. Kalıcılık bölümünde değiştirilen alanlar dışında kayıt biçimi değişmez (§6.3 eşlemesi); mevcut kayıt dosyaları yerinde göç etmez (tembel göç + `.pre3`). Bu iki kural "kayıt formatı ve mevcut kayıt dosyaları bozulmamalı" koşulunu karşılar. (inceleme düzeltmesi) Senaryo adları: T8 + T9 `23_dunya_kaliciligi.js`, T6 `24_kayit_surum_kurtarma.js`.

---

## 11. Riskler

| No | Risk | Olasılık / etki | Azaltma |
|---|---|---|---|
| R-1 | Göç hatası canlıdaki gerçek v0.3 kullanıcı kayıtlarını bozar (GitHub Pages'te v0.3 yayında) | Orta / yüksek | Tembel göç; `.pre3`; gerçek fikstürlerle Node testleri; yükleme hatasında yedeğe düşme; toplu yeniden yazım yok |
| R-2 | Doğrulama fazla katı → meşru kayıt reddedilir | Orta / yüksek | RET yalnız yapısal; bilinmeyen kimlik ve eşya korunur; rastgele bozma testi; `kayıp` notları kullanıcıya gösterilir |
| R-3 | Ortak Pages kökeninde kota diğer projelerle paylaşılıyor (YB-5); 4 kuşak + `.pre3` yuva başına yaklaşık 6 kopya; online dünya başına `gbook` ≤ 384 KB | Orta / orta | Yumuşak bütçe ve budama sırası; depolama paneli; `.gun/.h2` ve (≥ 3 v3 yazımından sonra) `.pre3` önce budanır; yetim `gbook` panelde listelenir (inceleme düzeltmesi); tipik toplam yaklaşık 600 KB |
| R-4 | Sürüm düşürme (Pages geri alınır ya da eski tek HTML açılır): v0.3 yeni bölümleri siler | Düşük / orta | Yalnız ekleme kuralı; Martı Batığı `islands.opened`'da; isteğe bağlı sürüm düşürme kurtarması (§2.7) |
| R-5 | `file://` tek HTML'de Web Locks, BroadcastChannel ya da `crypto.subtle` yok | Orta / düşük | (inceleme düzeltmesi) Kira kilidi çıkarıldı (K-11); `saveSeq` çakışma denetimi kilitsiz de çalışır; HMAC gereksinimi Faz 2/5'tedir |
| ~~R-6~~ | (inceleme düzeltmesi) Kira kilidi çıkarıldı (K-11); Web Locks'ta çöken sekmenin kilidini tarayıcı bırakır | — | — |
| R-7 | YB-1 düzeltmesi Demirkapı kayalıklarını bir kez taşır; gemi kayanın içinde kalabilir | Düşük / orta | (inceleme düzeltmesi) Mevcut `Ship._obstacles` itmesi hasarsız çözer; T7 denetimi (K-6) |
| R-8 | (inceleme düzeltmesi) Faz 2 nihai kararı biliniyor; risk artık **uygulama sırası**: Faz 2 gecikirse Faz 4'ün co-op kalıcılık katkısı (Adım 10) bekler | Orta / orta | Adım 0–9 Faz 2'den bağımsız; Adım 10 Faz 2'den sonra; geçici `world.ws` yolu yok (§8.1) |
| R-9 | Kayıt kaynaklı XSS (YB-2) Faz 2 B-06 kaçışı gelmeden içe aktarmayla taşınır | Orta / yüksek | Doğrulamada görüntü alanları katalogdan türetilir ya da (yakalama kaydı gibi türetilemeyenler) metin olarak temizlenir (inceleme düzeltmesi); yuva adı onayı metin olarak gösterilir; B-06'nın önceliği Faz 2'de |
| R-10 | `game.start` sırasında `'loading'` durumu bir sistemin `G.state==='playing'` varsayımını bozar | Düşük / orta | 29 okumanın taranması (inceleme düzeltmesi) (§4.6); 00–17 regresyonu |
| R-11 | Tarayıcı depolamayı tahliye eder (Safari 7 gün, depolama baskısı) | Orta / yüksek | `persist()` isteği; dışa aktarma hatırlatması; konuk için host profili (Faz 2) ve Korsan Kodu (Faz 5, K-9; inceleme düzeltmesi); bulut seçeneği (K-7) |
| R-12 | Yeniden yükleme (`reload`) içeren testler SwiftShader'da yavaş (her yükleme yaklaşık 30 sn) | Yüksek / düşük | Senaryo başına en çok 2 `reload`; Node testleri mantığın çoğunu kapsar |
| R-13 | Sıra dizinine dayalı özellik kimlikleri ileride içerik eklenince kayar | Orta / yüksek | `kimlik_sabit.mjs` donma testi; "sona ekle ya da açık `id`" kuralı; `ALIAS` |
| R-14 | Kozmetik onarımı (yuva defterlerinin birleştirilmesi) silinmiş bir yuvadaki satın almayı geri getirmez | Düşük / düşük | Profil `.bak` yedeği; kilit hiçbir zaman silinmez |
| R-15 | Konuk defteri ile host yuvasının ayrı yazımı arasında tutarsızlık | Düşük / düşük | `slotSeq` çapraz denetimi; en çok bir kayıt aralığı; bildirim |
| R-16 | (inceleme düzeltmesi) Host→konuk JSON iletisinin PeerJS 16 300 bayt eşiğini aşması geç katılan konuğu düşürür (Faz 2 Y-1) | Orta / yüksek (co-op) | Faz 4 `world` iletisine veri eklemez; yeni kalıcı durum Faz 2'nin parçalı `worldPart`'ıyla gider (§8.1) |
| R-17 | (inceleme düzeltmesi) Aynı yuvada yeni dünya kurulunca eski dünyanın kuşaklarının yedekler panelinde görünmesi ve "bu yedeğe dön" ile başka dünyanın yüklenmesi | Orta / yüksek | Kuşaklar `worldId` ile süzülür; farklı dünyanın kayıtları `.sil` paketine alınır; silmede bütün kuşaklar pakete girer (§4.3, §4.5) |
| R-18 | (inceleme düzeltmesi) Doğrulayıcının yakalamaya özgü balık alanlarını ya da ambar balıklarını sessizce silmesi | Orta / orta | §3.3 balık ve `hold.fish` kuralları; fikstürlerde balık ve ambar balığı bulunur; `kayit_sema.mjs` gidiş-dönüşte bu alanları birebir karşılaştırır |

---

## Ek A — Node denemeleri (salt-okur; `/tmp/tasarim_x/`)

| Betik | Ne yapıldı | Sonuç |
|---|---|---|
| `arch_list.mjs` | `archipelago.js` içe aktarıldı, özellikler sayıldı | 67 ada, 79 özellik. Hapishane yalnız `demirkapi` adasında ve adanın tek özelliği. Tapınak `kadim_tapinak`'ta (+ `ruin_1`). |
| `id_catalog.mjs` | Kalıcı nesne kimlikleri kod kurallarıyla (islands.js/hazards.js) üretildi | **155 kimlik**: 57 ada sandığı, 35 fıçı, 31 kasa, 13 kaya adayı, 14 plaka, 1 tapınak, 1 sunak, 3 tutsak. Hepsi benzersiz; en uzunu 29 karakter; karakter kümesi `[-0-9_a-z]`; ada kimliklerinde önek çakışması **yok**; JSON dizisi yaklaşık 4 KB. |
| `items_probe.mjs` | Saf katalog modülleri | 68 eşya (tek para birimi `altin_para`), 4 sandık kademesi, 9 ücretli kozmetik, 73 ada (`ISLANDS`), 84 POI, 123 kazı alanı, 28 batık. Çekirdek batığın kimliği `marti_batigi`. |
| `proto_sum.mjs` | FNV-1a mühürü, ayırt etme, boyut | Sis dizesi **10 927** karakter. Mühür doğru; kurcalanmış → `false`; mühürsüz → `null`; v0.4 okuyucusu `JSON.parse` ile açabiliyor. Ayırt etme: v0.4 → 2, v0.3 → 1, `999` → 999, `'2'` → geçersiz. Sentetik tipik kayıt 11,5 KB; kaba en kötü durum **88 KB**; 100 × (mühürle, çöz, ayrıştır) yaklaşık 100 ms (kayıt başına yaklaşık 1 ms). |
| `proto_migrate.mjs` | 1→2→3 göç prototipi | v0.3 notları: ada durumu boş başlatıldı; kamp durumu atıldı; `morvanSpawn` silindi; aşama 1'de `gunluk` silindi. v0.4: `kamp spawned=false` (D-07) ve aynı bayrak notları. Bilinmeyen kimlik `test_chest_1` korundu. v3 üzerinde göç işlem yapmadı (inceleme düzeltmesi: bu yalnız boş döngüyü gösterir; asıl idempotentlik ölçütü §0-2'de). Gelecek sürüm `gelecek` ya da `gelecek_uyumlu`; `'3'` → `gecersiz`. Girdi nesnesi değişmedi (saf). |
| `test_islands.mjs`, `puz_islands.mjs` | Kabul testi için ada seçimi | `korsan_kasabasi` (−1850, 1450; yıkık kasaba, kamp, kale; başlangıca 2,2 km). Plakalı harabeler arasında `kadim_tapinak_ruin_1` ve `mercan_halkasi_ruin_0` (başlangıca 3,3 km) var. |
| `demirkapi.mjs`, `kadim.mjs` | YB-1 ve yerleşim etkileşimi | Demirkapı r=270, tohum 503, hedef 3 kayalık, özellik yalnız `demirkapi_prison_0`. Kadim Tapınak'ta tapınak ile `ruin_1` arası 297 m; kapı çarpıştırıcısının plaka aramasını etkilemesi bu adada olası değil, ama ilke testle korunur (T7). |
| `inceleme_yakinlik.mjs` | (inceleme düzeltmesi) Aynı adada plakalı harabeden önce kurulan kamp/kale/maden var mı? | **0 çift**: hiçbir adada `_puzzleSite` aramasından önce aynı adanın fıçı/kasa çarpıştırıcısı kurulmuyor. Demirkapı: r 270, tohum 503, tek özellik `demirkapi_prison_0`, şekil `mesa`. |

---

## İncelemede bulunan sorunlar (önem sırasıyla)

Her madde: sorun, kanıt (dosya:satır) ve bu belgede düzeltildiği yer. Türler: **[K]** kod yanlış okunmuş, **[İ]** eksik kullanıcı isteği, **[B]** mevcut oynanışı/kayıtları/co-op'u bozacak karar, **[T]** test edilemeyen ya da çelişen adım, **[G]** gereksiz büyük değişiklik.

1. **Yüksek [B] — Faz 2 nihai kararıyla çelişen konuk kaydı.** İlk taslak "Faz 2 nihai belgesi yok" varsayımıyla konuğu her 120 sn `dksh.guest.0`'a yazdırıyor, `dksh.progress.guest` ve `dk_progress_guest`'i `.pre3` paketine alıp siliyordu (eski §8.3). Faz 2 nihai §4.2: bu anahtarlar v0.5'te salt okunur ithalat kaynağıdır; G6, B-18 ve §11 kabulleri "bayt bayt aynı kalır" der. Düzeltme: §0-11, §2.4, §3.3, §8.2, §8.3, K-10, UYUM-12 (periyodik konuk kaydı `dksh.wcache.<w>`'ye, yetkili kopya host'taki `gbook`).
2. **Yüksek [G][B] — Faz 2 ile paralel dünya kanalı.** Eski §8.1'deki `ws` anlık görüntüsü, `{t:'ws', ops}`, `islands.applyChange`, `applyNetSnapshot` Faz 2'nin `worldPart.feats` / `featSt` / `feat` / `islands.netState-applyNet` / `hazards.applyFromHost` mekanizmasını ikinci kez kuruyordu; h2c şemasında ret ve çift yazım riski vardı. Düzeltme: §8.1 (Faz 4 yalnız veri kaynağı ve kaya şema uzantısı), §9.2, UYUM-3.
3. **Yüksek [B][K] — PeerJS 16 300 bayt eşiği.** Geçici yolda `ws`'nin v0.4 `world` iletisine eklenmesi, JSON kanalının gönderim eşiğini aşma riskini artırıp geç katılan konuğu düşürebilirdi (vendor/peerjs/peerjs.min.js `_send` → `message-too-big`; net.js:233 `_dropPeer`). Eski §10.5'teki "≤ 64 KB (net.js:42)" ters yönün sınırıydı (net.js:248, konuk→host). Düzeltme: §1.6 notu, §8.1, §10.5, R-16.
4. **Yüksek [K][B] — Balık verisini FISH'ten "yeniden türetmek" yakalama kaydını silerdi.** `fishing.makeCatch` (fishing.js:232-243): `zone` = yakalanan ada adı, `bait` = yem/araç adı (255), `time`/`date` = yakalama anı, `value` ağırlığa bağlı formül (236). FISH'teki `zone/bait/time` başka anlamdadır. Uygulansaydı bütün kayıtlarda balık değerleri değişir, defterin "Bölge · Yem · Saat · tarih" kaydı (journal.js:163) silinirdi. Düzeltme: §1.3, §3.1-5, §3.3 (balık yığını, koleksiyon), R-18.
5. **Yüksek [K][B] — `ship.hold.fish` şemada yoktu.** fishing.js:248 ve panels.js:101 balığı ambara koyar; `Ship.serialize` `hold`'u olduğu gibi yazar (ship.js:698). Doğrulayıcı ambar balıklarını silerdi; aynı dizi YB-2 yüzeyidir (panels.js:150-151). Düzeltme: §1.3, §3.3 `hold.fish`.
6. **Yüksek [T] — Atomik içe aktarma kendi kabul ölçütüyle çelişiyordu.** Geri alma kaydı yalnız "yazılacak" ana anahtarları tutuyor, her yuvayı yazan `commit` ise `.bak/.h1/.h2/.gun`'u döndürüyordu: geri almadan sonra `kayit_aktarma.mjs`'nin "bütün anahtarlar bayt düzeyinde aynı" ölçütü sağlanamaz, başarısız içe aktarma bir yedek kuşağını yok ederdi. Düzeltme: §5.4 (bütün yuva anahtarları geri alma kaydında, içe aktarmada döndürme yok), §0-7, §10.2.
7. **Yüksek [B] — Kaydı olan sistemin varsayılana düşmesi veri silerdi.** Eski §4.6'da `time`, `enemies`, `bosses` kritik listesinde değildi; `start(null)`'dan sonra `G.saveBlocked = null` olduğu için ilk otomatik kayıt yenilmiş boss'ları (`bosses.defeated`) ve takvimi silerdi (D-06'nın amacına ters). Düzeltme: §4.6 (`s.save` olan her sistem kritik), §0-6.
8. **Orta-yüksek [K][B] — WorldState'in sahiplik devri mevcut testleri bozardı.** 13_donma P08 `islands.start({islands: d})`'yi doğrudan çağırır (13_donma.js:59); eski §10.5'teki "P08 `startGame` ile" ifadesi yanlıştı. 08_kalicilik.js:8-10 ve 12_kayit_dongusu.js:7 kümelere doğrudan yazar. Düzeltme: §6.3 (cephe), §9.2 (islands/hazards `start/save` değişmez), §10.5.
9. **Orta [B] — Yuva kilidi yeniden girişli değildi.** 08_kalicilik.js:30, 12_kayit_dongusu.js:7, 14_deniz_ekipmani.js:86 aynı sekmede aynı yuvaya ikinci kez `startGame` çağırır; Web Locks aynı sekmede tutulan kilidi ikinci kez vermez → "başka sekmede açık" diyaloğu. Düzeltme: §4.8-1, §9.3 Adım 6, §10.5.
10. **Orta [B] — Silinen dünyanın kuşakları geri dönebiliyordu.** "Yuva boş, `.bak` dolu → kurtarılabilir" kuralı kullanıcının sildiği yuvayı geri getirir; aynı yuvada kurulan yeni dünyanın yedekler panelinde eski dünyanın `h1/h2/gun`'u görünür ve "bu yedeğe dön" başka dünyayı yükler. v0.4 `remove` üç anahtarı birden siliyordu (save.js:47-50). Düzeltme: §4.2 `.sil`, §4.3 (farklı `worldId` → `.sil`), §4.5, §9.2 `save.js`, R-17.
11. **Orta [İ] — Eski dosyalarda `dksh.progress.guest` beyaz listede yoktu.** Audit 7.1 planı bu anahtarı sayıyordu; v0.4 dışa aktarımından konuğun rütbe ve yetenekleri kaybolabilirdi. "≤ 32 anahtar" sınırı da çok sayıda `wtok` taşıyan meşru v0.5 dosyalarını reddedebilirdi. Düzeltme: §5.1, §5.2, §3.5.
12. **Orta [B] — Yalnız-ekleme kuralının ihlali.** Konuk kaydında `quests → pq` yeniden adlandırması v0.4'e dönüşte kişisel keşif, koleksiyon ve başarımları düşürürdü (main.js:193 `guest.quests` okur). Düzeltme: §2.4, §3.3 (Faz 2 kararıyla `guest.0` zaten yazılmıyor; bellekteki biçim `quests` adını korur).
13. **Orta [K][B] — `quests.markers` sınırları yanlıştı.** Online host 61 işaret ve 80 karakterlik not tutar (net.js:359); ≤ 30 / ≤ 40 kuralı meşru online kayıtları her yüklemede kırpar, her kayıtta `kayıp` bildirimi üretirdi. Faz 2 şeması da `markers ≤ 61`. Düzeltme: §1.3, §3.3.
14. **Orta [B] — Kozmetik satın alma ardışık tam kayıt üretirdi.** `creator.finish` kilitli parçaları tek tek alır (creator.js:146-150); "her satın almada hemen `saveNow`" tek onayda en çok 5 tam kayıt ve kuşak döndürmesi demekti. Düzeltme: §7.2 (`unlockCosmetics(keys)`, tek `commit`); online konuk için Faz 2 `tx{svc:'cosmetic'}`.
15. **Orta [K][T] — Kuşak tablosu kuralla uyuşmuyordu; `.bak` saniyelik kopyaya dönüşebiliyordu.** Kural gereği `h1` ≈ 2–17 dk, `h2` ≈ 17 dk – 2,5 sa geridedir (tablo 15–30 dk ve 2–4 sa diyordu). Olay tetikli kayıt ve kapanıştaki `visibilitychange` + `pagehide` + `beforeunload` üçlüsü her yazımda döndürme yapıyordu. Tarayıcı testi (T2) `DK.sim` ile gerçek saate bağlı kuşak kuralını sınayamıyordu. Düzeltme: §4.3 (60 sn alt sınırı), §4.4 tablosu, §4.7, T2 (`Date.now` taklidi).
16. **Orta [G][T] — `extra` için geri birleştirme yoktu; bilinmeyen eşyaları taşımak gereksizdi.** Kod bilinmeyen eşyayı zaten tolere ediyor (items.js:109, 118-119, 131; shop.js:55-56). Yalnız-ekleme kuralında yeni içerik `version`'ı artırmadığı için v0.5.0'ın kaydettiği v0.5.1 kaydında veri `extra`'da kalırdı. Düzeltme: §2.6, §2.1, §0-4, §10.2.
17. **Orta [B] — `.pre3` sessizce yazılamayabiliyordu ve budanamıyordu.** `safeSet` hatası yutuyordu; göç hatasına karşı tek koruma (R-1) kota baskısında sessizce kaybolurdu; budanamaz anahtar da kotayı kilitleyebilirdi. Düzeltme: §4.3 (yazılamazsa ilk v3 yazımı yapılmaz), §4.9 (≥ 3 v3 yazımından sonra budanabilir), R-3.
18. **Düşük-orta [T] — Test adları Faz 2/3 ile çakışıyordu.** Faz 3 `18_fps_dususu`, `19_hizli_hareket`, `20_dar_gecit`, `21_orman_kaya`, `22_merdiven_iskele`; Faz 2 `coop/06e`–`06n` kullanıyor. Düzeltme: `23`–`26`, `coop/06o`–`06q` (§9.1, §9.3, §10, UYUM-13).
19. **Düşük-orta [K][G] — K-6 kaydırma adımı etkisiz ve gereksizdi.** `createPlayerShip` (game.js:117) anında adalar kurulmamıştır (islands.js:255-256), Demirkapı kayalıkları `Ship.obstacles`'ta yoktur; `Ship._obstacles` örtüşmeyi zaten hasarsız çözer (ship.js:394-411, 442-458). Düzeltme: K-6, §6.2, §9.2, R-7, T7.
20. **Düşük-orta [G] — Kapsam büyümesi.** Korsan Kodu ve HMAC'li özet (Faz 2 kimliğine dayanan Faz 5 işi), kira kilidi ve BroadcastChannel (`saveSeq` yeterli; R-6'yı doğuruyordu), `_puzzleSite` için `physics.resolve` etiket süzgeci (bugün gereksiz: Node 0 çift), içeriksiz tek seferlik kaynak altyapısı (sınanamaz), kanonik kimlik gösterimi için ayrı katman. Düzeltme: K-3, K-9, K-11, §4.8, §6.2, §6.3, §9.1.
21. **Düşük [K] — D-01 örnek kodunda sıra.** `tryClaim` gardiyan denetiminden (islands.js:959-960) önce çalışırsa muhafızlar varken E'ye basmak tutsağı ödülsüz "kurtarılmış" işaretler ve istemi kaybettirirdi. Düzeltme: §6.2 kod örneği, UYUM-8.
22. **Düşük [B] — `cleanName`'in tek oyunculu ada uygulanması.** net.js:41 kesme işareti, tırnak ve `&`'yi siler; "Deniz'in Korsanı" gibi meşru adlar her yüklemede değişirdi. Düzeltme: §3.3 `name`, `appearance`.
23. **Düşük [İ] — Yan görevlerin kimlikle tanımlanması eksikti.** Audit 7.2 kimlik planı bunu istiyordu; `completed` başlık tutuyor (quests.js:214, 234). Düzeltme: §3.3 ve §2.4 `completedIds` (ek alan; v0.4 uyumu korunur).
24. **Düşük [T] — `strict` kipi tanımsızdı.** §2.1, §4.3 ve §4.5'te kullanılıyor ama hiçbir yerde tanımlanmıyordu. Düzeltme: §3.1-7.
25. **Düşük [K] — `ilkHarita` kuralı.** Haritacı ilk haritayı yalnız aşama 1'de verir (quests.js:404); "aşama 0'da da koyulabilir" yalnız `ilkHazineBulundu` için doğruydu. Düzeltme: §3.4.
26. **Düşük [B] — Online host'ta `abortStart`.** `net.leave()`, menü gösterimi ve kilit bırakma yoktu; lobideki konuklar asılı kalırdı. Düzeltme: §4.6.
27. **Düşük [K] — Olgu hataları.** game.js dışında 29 (main.js de hariç 20) `G.state` okuması var, 16 değil; `_guestSave` çağıranlarında main.js:204 eksikti; Adım 4'te tanımsız "T4b"; Faz 2 parça sınırı 16 000 bayttır (32 KB değil); `gbook` hesabındaki "× 12" (Faz 2 nihai: 16); `CORE_SETS` (hazards.js:34) ve `SIDE_TEMPLATES` (quests.js:33) dışa aktarılmıyor, örnek kod main.js'den çağrılamazdı; prototipte bölüm adı `persist`, belgede `worldState`; prototipteki idempotentlik denetimi v3 girdisinde boş döngüyü ölçüyordu; §2.5'te `G.saveBlocked='future'`, §4.7'de `'readonly'` yazıyordu; net.js:568'deki konuk `story` birleştirmesi atlanmıştı; kayık durumu `createPlayerShip` sırasında WorldState'ten okunamazdı (game.js:117) → `ship.boat`. Düzeltme: §1.1, §1.6, §3.2, §3.5, §4.6, §6.3, §6.5, §8.1, §8.2, §9.3.
28. **Düşük [T] — Test uygulanabilirliği.** T8'de kampta kayanın kurulduğu önce doğrulanmalı (kaya arazi eğimine bağlı bir aday, hazards.js:319); T14'te görünürlük değişimi başsız tarayıcıda benzetilmeli; konuk fikstürleri co-op oturumu olmadan `G.online/G.isHost` geçişiyle sürümün kendi yazım yolundan üretilebilir; 2. adımda `buildSaveCatalog` kurulmazsa `commit` doğrulaması çalışmaz. Düzeltme: §9.3, §10.1, §10.3.

**Doğrulanan ve değişmeden kalan iddialar (örnekleme):** YB-1 (islands.js:956-957, 530-531, 1058-1076; R akışı tutsağa bağlı), YB-4 (game.js:147), YB-6 (`once` hiçbir yerde okunmuyor; islands.js:1149-1158), D-01'in tutma dalı (interact.js:61-65), v0.3/v0.4 ayırt etme işaretleri (v03 hazards.js:81, v03 ship.js:687-695, v04 islands.js:269), sis uzunluğu (10 927 karakter; `FOG_N = 256`), 155 kimlik ve önek çakışmasızlığı (Node ile yeniden koşuldu), `dayMinutes 24` (sky.js:45, 235), save.js akışı (15-45, 77-87), `game.start`/`serialize` satırları (101-178).
