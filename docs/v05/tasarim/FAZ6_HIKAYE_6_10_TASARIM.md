# Faz 6 — Ana Hikâyenin 6–10. Aşamaları ve Final: NİHAİ Tasarım Belgesi (hakem birleşimi)

| | |
|---|---|
| Taban | v0.4, commit `44d548c`. `/home/user/SON-HAZ-NE-w2` HEAD `3725aac` yalnız `docs/` ekliyor (`git diff --stat 44d548c HEAD`); `js/` aynı. Bütün satır numaraları bu tabana göredir. |
| Girdiler | `faz6_tasarim_A.md` (keşif ve atmosfer öncelikli), `faz6_tasarim_B.md` (sistemleri yeniden kullanan). Uyum: Faz 2 NİHAİ (PROTO, şema kapısı, `gbook`, `worldPart`, `feat/featSt`, `story` beyaz listesi, hareket doğrulayıcı), Faz 3 NİHAİ (STEP 1/60, KARE/ADIM sınıfları, `frameClock`, çarpışma katmanları), Faz 4 NİHAİ (şema v3, yalnız-ekleme, WorldState cephesi, kimlik kataloğu, `quests.rt`), Faz 5 NİHAİ (PROTO 3, `tel`/`ntf`/`bossFx`, ilgi alanı, host devri replikası, K5-2). |
| Yöntem | İki belge baştan sona okundu. Belgelerdeki ~60 `dosya:satır` atfı kodda yeniden okundu. Koordinat, eğim, fizik ve yerleşim iddiaları `/tmp/tasarim_y/hakem/` altındaki salt-okur Node betikleriyle yeniden ölçüldü (Ek A). **Kod değiştirilmedi, depoya yazılmadı, tarayıcı testi koşulmadı.** |
| Numaralandırma | **Aşama N = `STORY[N−1]`.** Aşama 6–10 = `STORY[5..9]`. `STORY[10]` = Epilog ("Ufkun Ötesi"). Bugünkü `STORY[5]` yer tutucusunun (`yitik`, quests.js:30) yerini Aşama 6 alır. |

---

## Hakem değerlendirmesi

### H.1 Puan tablosu (1–10; 4. satırda yüksek puan düşük risk demektir)

| Ölçüt | A | B | Gerekçe |
|---|---|---|---|
| 1. Her aşamada istenen 8 öğe (yeni bölge, NPC, görev zinciri, keşif + çevre bulmacası, yeni düşman/davranış, boss/özel karşılaşma, karar, ödül + kalıcı ilerleme) | **9** | **7** | A: her bölümde kapalı ya da yeni bir alan (Kor Damarı, Mürettebat Mahzeni, Buz Sarayı, Lanetli Ocak, Gelgit Kuyusu, Yitik Ufuk), adlandırılmış NPC, 6–8 adımlı zincir, bulmaca, yeni tür, boss, karar ve bölüm aracı. Eksi: birkaç öğe en riskli mekaniklere (halat, asansör, eğimli tüp) dayanıyor; A'nın kendi çekirdek kapsamı bunları açık çukura ya da genişlemeye atıyor. B: sekiz öğe her aşamada var ve kapsama tablosu (§3.6) açık. Eksi: 7. aşamanın "yeni alanı" mevcut adalardaki iki yapı (Zincir Taşı, yakılan fener), 6. aşamanınki inşa edilmiş bir kule; keşfedilen yeni bir iç mekân yok. |
| 2. Hikâye tutarlılığı ve finalin tatmini | **9** | **7** | A: Ölü Sis başlangıç limanının 2,1 km kuzeyinde ("hep oradaydı"), Fener Kayası'nın feneri anahtar, Tuzla Mira'nın miçosu, Büyük Cezir ve Mira kılığındaki Gölge, beş kararın kapanış cümleleri. B: her harita parçasının finalde bir bekçi sütununa karşılık gelmesi ve kişi başı Son Hazine payı çok iyi. Ama Yitik Ufuk'un yeri hikâyeyle ilgisiz; final bossu Taş Muhafız sınıfının yeniden boyanmış hâli ve aynı bölümde gerçek Taş Muhafız'la da dövüşülüyor (aynı yumruk/süpürme/tepinme/rün sütunu kalıbı iki kez). |
| 3. Keşif kalitesi | **9** | **7** | A: yedi dikey türün hepsi ve birden çok örneği; Obsidyen Kazma ile dünyaya dağılmış çatlak duvar sırları; bölüm araçlarının açtığı geri dönüş içeriği. B: yedi tür var ama çoğu tek örnek; sır az (kanal sandığı, isteğe bağlı Ay Odası); manzara noktalarıyla sis açma iyi bir ucuz ek. |
| 4. Uygulama riski ve büyüklüğü | **4** | **7** | A: 95 ± 15 gün, 17 mekanik. 94 m tırmanan eğimli lav tüpü ve yükselen lav, halat (oyunda tırmanma animasyonu yok: `kk_anims.glb`'deki 81 klipte Climb yok, Ek A.5), asansör, 7 oyma/çukur, okyanus bölgeleri, başlangıç bölgesinde sis duvarı. B: 60 gün; yeniden kullanım, B planı mağara (K-C), gizli merdiven yedeği. Kalan riskler: gayzer yatay yolu yanlış hesaplanmış (H.2 B-2), konukta hikâye bossunun yeri (B-3). |
| 5. Test edilebilirlik | **8** | **9** | A: 6 Node + 10 tarayıcı + 2 co-op senaryosu, `DK.story` kancaları, `hikaye_gecis` olumlu/olumsuz durumları. B: saf çekirdekle 5→10 zincirinin ve 32 karar birleşiminin tarayıcısız sınanması, `STORY_OPEN` bölüm kapısıyla her bölümün ayrı yayımlanması, 40 000 noktalık arazi özeti fikstürü. |
| 6. Kayıt / co-op / performans uyumu | **7** | **6** | A: PROTO artırımı Faz 2 B-16'ya uygun, hareket doğrulayıcı ve `storyFx` ayrıntılı. Eksi: bayrak sınırını gereksiz yere 64 → 128 yapıyor (52 bayrak 64'e sığar), yeni `worldState.hk` kümesi v0.4 gidiş-dönüşünde düşer, ışık havuzu 4 → 6 (bütün sahnenin maliyeti), co-op test adları `06r/06s` Faz 5'in `06r–06z`'siyle çakışıyor. B: ≤ 64 bayrak, mevcut kümeler (v0.4 korur), `07a/07b` adları doğru. Eksi: "PROTO 2 içinde yalnız enum genişler" Faz 2 B-16 ve Faz 5 (PROTO 3) ile çelişiyor; H-15'i Faz 7'ye bırakıyor oysa Faz 5 `tel` getiriyor; `hk_` kimlikleri ada önekli değil (Faz 4 en uzun önek ayrıştırması); hikâye XP'si Faz 5 K5-2 ile uyumsuz. |
| **Ortalama** | **7,7** | **7,2** | A daha iyi bir oyun, B daha iyi bir uygulama planı. Nihai tasarım A'nın hikâye ve keşif omurgasını B'nin uygulama iskeletine oturtur; A'nın en riskli dört mekaniği (eğimli lav tüpü, halat, asansör, dört ek oyma) çıkarılır, B'nin final bossu yerine A'nınki alınır. |

### H.2 Kodla doğrulanan iddialar ve düzeltmeler

**Doğrulanan (iki belgenin dayandığı temel gerçekler):** `STORY` 6 girdi, 5. girdi tetiksiz (quests.js:24-31, :275-290); `storyTarget` 5'te `null` (hud.js:452-460); `bossDefeated` yalnız progress.js:77'de dinleniyor; boss unvanları "Ateşin Bekçisi"/"Buzların Altındaki Kraliçe" (bosses.js:26, :29) mektuptaki kancalarla aynı (panels.js:98); tek etkin boss (bosses.js:1057, :1082); Volkanik Dev tetiği `I.r·0,24` = 129,6 m, düzlemde (bosses.js:1089); ada içeriği tek `R = rng(I.seed*31+7)` akışı, evre sırası bitki → özellik → kazı → kayalık → lav → batch (islands.js:340-365); bitki adayında `h < 0,7`, `keep`, iskele ve `ny < 0,62` retleri çekilişten önce (islands.js:454-460); `_npc` iki `R()` tüketir (islands.js:530-531); ışık havuzu 4 `PointLight` (islands.js:236-243); tapınak sunağı `y0 + 5,1·1,6·0,98 = y0 + 8,0` platformu, merdiven yalnız görsel (G-03, islands.js:821-822); hapishane avlusunun yönü `R()` (islands.js:934), köşe kuleleri merkeze 37,5 m; gayzer `p.vel.y = 16`, 4 hasar, kip `ground` (hazards.js:595-600); `_explode` `kind:'explosion'` ile bütün `combat.targets`'a vurur (hazards.js:226-235); plaka adayı `hashStr(f.id) % 10 < 6` (hazards.js:130); GRAV −22 (player.js:17), koşu 4,4 / sprint 7,0 m/sn (player.js:445, :458), havada `damp` oranı 2,5 (player.js:537), nefes tabanı 50 sn ve `G.mods.breath` (player.js:780-785); `baseMods` içinde `breath, hull, ship, repair, cannon` var (progress.js:51); insan bosslar XP vermiyor (progress.js:75, F-08); `npcs.add` dinamik NPC (npcs.js:89); basılı tutma etkileşimi (interact.js:61-65); `time.tide()`, `nextTides`, `sleepUntil` (time.js:81-95, :174-183); okyanus `heightAt` ve tek `uShelter` (ocean.js:29-51, :115-149); `groundAt` basamak sınırı 0,6 (physics.js:87); dünya sınırı kalıbı (ship.js:373-379, :810-811; player.js:760-765); `regionFog` (sky.js:277-285); `ENEMY_TYPES` 17 tür (enemies.js:79-177), `lob` + `firePools` (enemies.js:1416-1475); `sk_mage` yüklü (kk.js:9); `archipelago_sabit.mjs` yalnız `archipelago.js` dışa aktarımlarını karşılaştırıyor.

**A'da bulunan sorunlar**

| # | Sorun | Kanıt | Nihai tasarımda |
|---|---|---|---|
| A-1 | Halat/Buz Kancası mekaniği `startClimb/_updateClimb`'ten türetilemez: bu kod gemi merdivenine özgü (`s.model.stations.ladder`, sonda `boardShip`) ve tırmanırken `Idle` oynatır. Animasyon kütüphanesinde tırmanma klibi yok. 20–30 m'lik halat tırmanışı ayakta süzülen bir karakter gösterirdi. | player.js:955-983; Ek A.5 (81 klip) | Halat ve asansör çıkarıldı. Dikey yollar platform merdiveni (`_pier` basamak kalıbı) ve gayzerle. |
| A-2 | Kule Zindanı (−6683, 2573) hapishane merkezine 39,1 m. Köşe kuleleri 37,5 m'de ve avlu yönü `R()`'ye bağlı; K-3 (sabit çekiliş) sonrası yön değişir. Kule bir köşe kulesine binebilir. | islands.js:934-946; Ek A.4 | B'nin noktası (−6684, 2517): 43,8 m. |
| A-3 | Bayrak sınırı 64 → 128 önerisi gereksiz (A'nın 52 bayrağı 64'e sığar) ve Faz 4 şemasını değiştirir. | Faz 4 §3.3 | Sınır 64 kalır; bu belge 49 bayrak kullanır. |
| A-4 | Işık havuzu 4 → 6, her ışıklı malzemenin gölgelendiricisini bütün sahnede ağırlaştırır. | islands.js:236-243 | Havuz 4 kalır. |
| A-5 | Co-op senaryo adları `06r/06s` Faz 5'in `06r–06z` aralığıyla çakışıyor. | Faz 5 NİHAİ s. 9 | `07a`, `07b`. |
| A-6 | Yeni `worldState.hk` kümesi v0.4 kaydı açıp yazınca düşer; `islands.opened` korunur. | Faz 4 §2.7 | Sırlar ve kapılar `islands.opened`'da. |
| A-7 | H-15 için anlık görüntüye telgraf eklemek (S13) gereksiz: Faz 5 `tel{n,k,dur}` ve `bossFx` getiriyor. | Faz 5 §3.2 | Faz 5 iletileri kullanılır. |
| A-8 | Büyük Cezir'de `ocean.tide`'ı doğrudan okuyan tüketiciler belgede yok: treasure.js:190 ve :307, weatherfx.js:279, details.js:404, `shoreFactor` (ocean.js:35), arazi gölgelendiricisinin `uTide`'ı (sky.js:263). Ayrıca `treasure.spawnChest` fiziksel cisimdir: −6 m'deki mahzende su geri gelince Son Hazine yüzerdi (bodies.js:118, treasure.js:288-307). | kod | `ocean.levelAt(x,z)` tek API; Son Hazine statik hikâye sandığı (§4.4). |
| A-9 | `npcs._create` zemini `max(groundAt, spot.minY ?? 2,4)` alır: −6 m'deki Mira NPC'si 2,4 m'de havada durur. | npcs.js:78 | Hikâye NPC'leri `y` ve `minY:-50` verir (islands.js `_npc` gibi). |
| A-10 | Ölü Sis'in başlangıçtan görünmesi 09_performans "liman" ölçümünü (1 035 çizim) ve 17_kamera_kararma taramalarını etkiler; kabul ölçütü yok. | taban koşusu | §6.3'te ölçüt: Kırlangıç limanında çizim farkı ≤ 3, kare süresi farkı ≤ %5. |
| A-11 | Mürettebat Mahzeni ağzı mezarlık çitinin içinde (merkeze 8,5 m); mezarları sonradan silmek örneklenmiş `Batch`'ten çıkarma ister. | islands.js:755-783 | Mahzen çıkarıldı; ritüel çitin dışında (§3.2). |

**B'de bulunan sorunlar**

| # | Sorun | Kanıt | Nihai tasarımda |
|---|---|---|---|
| B-1 | "PROTO 2 içinde yalnız enum genişler" yanlış. Faz 2 B-16: "Telde bir iletiyi, alanı ya da anlamı değiştiren her sürüm PROTO'yu bir artırır"; `net_schema.mjs` bunu yakalar. Faz 5 zaten PROTO 3 yapıyor. Eski yapı bir konuk `story{stage:6}`'yı `to < STORY.length` ile reddeder. | Faz 2 §2.1, Faz 5 §8.5 | PROTO = Faz 5 değeri + 1 (K-8). |
| B-2 | Kor Kulesi'nde "havada 2,5 m/s² ivme → 1,2 sn'de ≈ 1,8 m" hesabı yanlış: 2,5 bir `damp` oranıdır. Node: koşu isteğinde (4,4 m/sn) 4,4 m'lik kata inişte 3,1 m, sprintte (7,0) 5,0 m yatay yol. 4×4'lük T2'den taşma olası. | player.js:537; Ek A.3 | Katlar 6×6, gayzer üst kenara 0,5 m, uzak kenarda 0,4 m'lik korkuluk kutusu. |
| B-3 | Konukta `bosses.applySnapshot` bossu `BOSS_SITES.find` ile kurar; listede olmayan hikâye bossu oyuncunun 30 m yanında, yanlış `site` ile doğar. `TideGuardian` arenayı ve sütunları `site`'tan aldığı için konukta sütunlar yanlış yerde çıkardı. | bosses.js:1056-1060, :1119-1123, :640-641 | Final bossu `bosses.js` sınıfı değil, insan boss çatısı (`enemies.js`); hikâye `bosses.js`'e sınıf eklemez. |
| B-4 | Final bossu Taş Muhafız sınıfının yeniden boyanmış hâli; aynı bölümde gerçek Taş Muhafız'la da dövüşülüyor. | bosses.js:635-765 | A'nın Gelgit'in Gölgesi alındı. |
| B-5 | H-15 (konukta telgraf yok) Faz 7'ye bırakılmış; Faz 5 `tel` bunu karşılıyor. | Faz 5 §3.1 satır 10 | Faz 5 `tel`/`bossFx`. |
| B-6 | `hk_<ad>` kimlikleri ada önekli değil; Faz 4 `worldIds.parse` adayı en uzun önek eşleşmesiyle çıkarır. | Faz 4 §6.1 | `<adaId>_hk_<ad>[n]` (A'nın biçimi). |
| B-7 | Aşama XP'si "herkese tam" Faz 5 K5-2 (olayın 300 m'sindeki herkes) ile uyumsuz. | Faz 5 K5-2 | K5-2 (K-12). |
| B-8 | 9. aşamadaki "Kervan Kâhyası Sare", 7. aşamada alınan Mezarcı Sare ile çakışır. | — | Kervanbaşı Nur (A'nın adı). |

### H.3 Hangi kısım nereden alındı

| Kısım | Kaynak | Not |
|---|---|---|
| Hikâye omurgası: Ölü Sis, Yitik Ufuk'un yeri (300, −2100), Fener Kayası'nın anahtar rolü, Tuzla = Mira'nın miçosu, Mira'nın Pusula'ya bağlı ruhu | **A** | Tuzla'nın 10. aşamadaki itiraf sahnesi **B** |
| Teknik model: saf çekirdek (`storyKernel.js`) + saf veri (`storyData.js`) + çalışma zamanı (`story.js`); `STORY_OPEN` bölüm kapısı; `reconcile` geriye dönük işleme | **B** | Adım kayıtları A'nın `STORY_EV` satır alanlarını (`stage/need/at/r/mode/night/lantern`) taşır |
| Aşama 6: Kor Kulesi gayzer tırmanışı, Kor Sunağı, Kor Kalbi akışı, arena fıçıları, manzara noktası | **B** | Katlar hakem düzeltmesiyle 6×6 |
| Aşama 6: Demirci Kevser, Kor Selim (teslim olan insan boss), K6, Obsidyen Kazma, Kevser'in atölyesi | **A** | Lav tüpü ve lav kaçışı çıkarıldı |
| Aşama 7: Mira'nın Evi kileri (Kazma), Mezarcı Sare ve gece mum ritüeli (Hayalet Kaptan bekçi) | **A** | Ritüel çemberi çit dışına taşındı (hakem) |
| Aşama 7: Feneri yakıp Ruh Feneri'ni almak, Zincir Taşı ayini, Zincirli Ruh (`lightBound`), K7 (Amiral Kasvet) | **B** | Mürettebat Mahzeni ve çan bulmacası çıkarıldı |
| Aşama 8: Ayaz Kulesi, Ayaz Mağarası (göl, çukur, buz perdesi altından geçit), Ruh Feneri kaynaklı ayna bulmacası, Buz Kâhini, K8 alıcısı Ayaz | **B** | Buz Sarayı ve halat duvarı çıkarıldı |
| Aşama 8: Kraliçe Ayaz Ana'nın ruhu, Kutsama etkisi (buzdağı hasarı) | **A** | |
| Aşama 9: İbre'yi Ay Gümüşü'nden dövme anlatısı, Kervanbaşı Nur, Madenbaşı Gümüşdiş (karanlık evresi), örs savunması, K9 (damar), K6'ya bağlı zindan yolları | **A** | Lanetli Ocak çukuru, asansör ve halatlar çıkarıldı |
| Aşama 9: Seyir Ustası Yadigâr, Zindan Kulesi'nin konumu, fıçıyla açılan galeri, Derin Galeri, `_puzzleAt` basınç plakası, Güneş Taşı konumu, Kadran'ın gelgit göstergesi (İbre'ye taşındı) | **B** | |
| Aşama 10: seyir defteri kazısı, Sunak Katı + Gözlem Katı (G-03), yıldız sırası, Gelgit Kızı batığına dalış, dört bekçi yuvası (parça → yuva) | **B** | |
| Aşama 10: Gelgit Merceği → Ufuk Işını, fener dış merdiveni, Ölü Sis koridoru, Kraken kapısı, Mira'nın Son Kampı, Veyl Filosu | **A** | Gelgit Kızı A'nın filo mezarlığına yerleşti (hakem, Ek A.6) |
| Final: Büyük Cezir, Mahzen terasları, Gelgit'in Gölgesi, başarısızlık kuralı, kapanış cümle tablosu | **A** | Plan B (§4.7) hakem |
| Final: kişi başı Son Hazine payı, epilog akışı (karartma, sinematik, okuma paneli, jenerik), Gelgit Çağrısı (`time.tideOverride`), Gelgit Hazineleri | **B** | Son Hazine statik sandık (hakem, A-8) |
| Kayıt: ≤ 64 bayrak, mevcut kümelerin kullanımı, ileri/geri tutarlılık kuralları | **B** | Kimlik biçimi ve "aşama geçerliliği" kuralı **A** |
| Co-op: ileti tablosu (`npc/secim/bekle`, `feat hk:`), geç katılım uzlaştırması, `07a/07b` | **B** | PROTO artırımı, `storyFx`, hareket doğrulayıcı notları **A**; Faz 5 `tel/ntf/bossFx`, replika, K5-2 **hakem** |
| Performans: ışık havuzu 4, hikâye alanında ≤ 60 çizim farkı | **B** | Kurulum bütçesi, Ölü Sis bütçesi **A**; liman ölçütü **hakem** |
| Deterministik dünya: `archipelago.js`'e dokunulmaz, ayrı `storyWorld.js` | **A + B** | 40 000 noktalık özet fikstürü **B**; `kaldera` biçimi ve cezir bandı doğrulaması **A** |
| Uygulama sırası | **B** iskeleti | A'nın S0 regresyon testi ve "her etkileşim baştan `story.request`'ten" kuralı; Cezir ve Ölü Sis ayrı adımlar (hakem) |
| Test planı | **B** (K/W kodları) | A'nın `okyanus_bolge`, `hikaye_gecis` durumları, 35 (düşmanlar) ve 36 (bileşen kum havuzu) |

---

## 0. Özet ve kararlar

### 0.1 Özet

1. **Çıkmaz (F-03).** Hikâye bugün Kızıl Hançer'den sonra `STORY[5]`'te tetiksiz bir metinde duruyor (quests.js:30); `update` yalnız 3. ve 4. dizini işliyor (:275-290), HUD hedefi yok (hud.js:458), defter "6–10 sonraki sürümlerde" diyor (journal.js:116). Beş efsanevi boss hikâyeye bağlı değil; mektuptaki iki kanca (panels.js:98) boss unvanlarıyla aynı ama hiçbir şey olmuyor.
2. **Omurga** (yol haritası sırası, docs/14_YOL_HARITASI.md:13): **6 Ateşin Bekçisi** (Kül Adaları = "Volkanik Adalar"; parça 3), **7 Sisin İçindeki Filo** (Hayalet Denizleri; Mira'nın akıbeti), **8 Buzların Altındaki Kraliçe** (Buzul Denizi = "Buz Krallığı"; parça 4), **9 Gelgit İbresi** (Kızıl Kum Kıyıları = "Çöl Adaları"; Pusula'nın ikizi), **10 Yitik Ufuk** (yeni ada + final).
3. **Büyük sürpriz.** Yitik Ufuk, Kırlangıç'ın 2,1 km kuzeyinde, oyunun başından beri ufukta duran **Ölü Sis**'in içindedir (merkez 300, −2100). Fener Kayası'nın (−1243, −1950) feneri 7. aşamada yakılır, 10. aşamada Gelgit Merceği takılınca sis kapısını gösterir.
4. **Her aşamanın yeni alanı:** 6 Kor Kulesi (Ateş Dağı yamacında üç katlı bazalt kule) ve Kor Sunağı; 7 Mira'nın Evi ve kileri, Halil'in mezar çemberi, Zincir Taşı; 8 Ayaz Kulesi (zirve), Ayaz Mağarası (yeraltı gölü, su altı geçidi); 9 Zindan Kulesi, Derin Galeri (gizli maden), Güneş Örsü; 10 Sunak/Gözlem Katı, Ufuk Feneri galerisi, **Yitik Ufuk** adası (lagün, Gelgit Kızı batığı, Mira'nın Mahzeni). Mevcut adalarda arazi değişikliği yalnız iki mağara oymasıdır; tek yeni ada Yitik Ufuk'tur.
5. **Bosslar hikâyeye bağlı:** Volkanik Dev (6), Hayalet Kaptan ve Lanetli Amiral (7), Derinlik Yılanı (8), Taş Muhafız ve Kraken (10, kapı bekçileri). Yeni: Kor Selim (6, teslim olur), Madenbaşı Gümüşdiş (9), **Gelgit'in Gölgesi** (final). Önceden yenilmiş boss geriye dönük işlenir.
6. **Bölüm araçları (kalıcı ilerleme):** Obsidyen Kazma (çatlak duvarlar, dünyaya dağılmış sırlar), Ruh Feneri (ruhlar, ışığa bağlı düşmanlar, ayna kaynağı, sisteki yol), Gelgit İbresi (sisteki koridor, alçak su saati), finalde Gelgit Pusulası ya da Mira'nın Kutsaması. Kararlar kalıcı güçler (boon) de verir.
7. **Beş karar** (K6–K10) ikilidir ve kalıcıdır; her biri finali değiştirir: Kraken'e karşı bombalar (K6), sisteki koridorun gündüz görünmesi ya da boğulmuş tayfanın zayıflaması (K7), su basma evresinde nefes (K8), koridor genişliği (K9), Ölü Sis'in kalkması ve kapanış (K10).
8. **Final:** Gelgit Sunağı'nda İbre çağrılır, **Büyük Cezir** lagünü boşaltır; dört parça dört bekçi yuvasını yakar; Mira'nın Mührü Mahzen'i açar; Pusula'dan **Gelgit'in Gölgesi** çıkar (dört evre, su düzeyi evrelerle değişir); Mira'nın ruhu serbest kalır; K10; **Son Hazine** (Mira Veyl'in Sandığı) açılır ve tayfadaki herkese pay verir; kapanış metni, jenerik, Epilog.
9. **Teknik model** (B): saf `storyKernel.js` + saf `storyData.js` + çalışma zamanı `story.js`. Host olayı çekirdeğe verir, çıkan etkileri yürütür, konuklara beyaz listedeki durumu gönderir. 5→10 zinciri ve 32 karar birleşimi Node'da sınanır. `STORY_OPEN` bitmemiş bölümleri "yakında" metniyle kapalı tutar; bölümler tek tek yayımlanabilir.
10. **Deterministik dünya:** `archipelago.js` değişmez, `archipelago_sabit.mjs` aynen geçer. Hikâye verisi `js/world/storyWorld.js`'tedir; `worldData.ISLANDS` 73 → 74 olur. Hikâye yapıları ortak `R` akışını tüketmez; bitki ayıklaması bütün çekilişlerden sonra yapılır.
11. **Kayıt** (Faz 4 v3, yalnız ekleme): 43 yeni bayrak, toplam 49 ≤ 64. Çalışma zamanı durumu `quests.rt`'de. Sırlar ve kapılar mevcut `islands.opened`, `hazards.gone/solved/looted` kümelerinde. Eski 5. aşama kayıtları Aşama 6'nın başına düşer.
12. **Co-op:** Hikâye yalnız host'ta ilerler. Konuk `story{ev:'npc'|'secim'|'bekle'}` ve `feat{id:'hk:…'}` niyeti gönderir; bayrak hiçbir zaman konuktan alınmaz. Kararları oda sahibi verir. Hatıra eşyaları bütün tayfaya gider (F-11). Telgraf, bildirim ve boss efektleri Faz 5'in `tel/ntf/bossFx` iletileriyle gider. PROTO bir artar.
13. **Uygulama:** 17 adım (S0–S16), her biri kendi Node ya da tarayıcı testiyle kapanır. Okyanus bölgesi (Büyük Cezir) ve mağara genelleştirmesi ayrı adımlardır; ikisinin de yedek planı vardır.
14. **İş büyüklüğü:** tam kapsam ≈ **72 ± 10 iş günü** (≈ 8 000 satır kod + 2 800 satır test); çekirdek ≈ **58 ± 8 gün** (§9.2).

### 0.2 İlkeler

| # | İlke | Somut kural | Kaynak |
|---|---|---|---|
| İ1 | Önce yer | Her bölüm bir mekân kimliği (siluet, ışık, ses, dikey yol) tanımlar; zincir o mekânın içinden geçer. | A |
| İ2 | Metin yetmez | Her adımın bir kod tetiği, bir dünya nesnesi ya da alanı ve etiketli bir test kontrolü vardır (audit_F gereksinimi). | A + B |
| İ3 | Önce yeniden kullan | Yeni kod yalnız var olan sistem isteği karşılamıyorsa yazılır (§5.1'de her mekaniğin gerekçesi). | B |
| İ4 | Mevcut adada arazi değişikliği yok | İstisna iki mağara oyması (Ayaz Mağarası, Derin Galeri), S1'deki sabit çekilişten sonra. Arazi isteyen her şey Yitik Ufuk'tadır. | B |
| İ5 | `R` akışını bozma | Hikâye yapıları `_buildGen`'de lav evresinden sonra, kendi tohumlarıyla (`rng(hashStr(id))`) kurulur. Bitki ayıklaması çekilişlerden sonra. | A + B |
| İ6 | R'ye bağlı zarflardan uzak dur | Yerleşimi `R()`'ye bağlı özelliklerin olası en geniş ayak izinin (yıkık kasaba binaları ≤ 40 m, harabe ≤ 16 m, plaka sitesi ≤ 20,4 m, mezarlık çiti 22 m, hapishane köşe kuleleri 37,5 m) ≥ 4 m dışında kal; `hikaye_dunya.mjs` W05 denetler. | hakem |
| İ7 | Saf çekirdek | Aşama/adım geçişleri, kararlar, geriye dönük işleme, tutarlılık kuralları DOM ve THREE kullanmayan tek modüldedir. | B |
| İ8 | Host yetkisi | Konuk sonuç değil niyet gönderir; host konumu ve koşulu **veri konumlarından** doğrular (ada host'ta kurulu olmasa da). | A + B |
| İ9 | Ağda serbest metin yok | Bildirim ve okuma metinleri `storyData.TEXT` kimlikleriyle gider (Faz 2 §9, Faz 5 `ntf`). | A + B |
| İ10 | Açık dünya korunur | Hiçbir boss ya da bölge hikâye için kilitlenmez (hikâyenin hedefi olan Ölü Sis hariç). Önceden yenilen boss geriye dönük sayılır. | A + B |
| İ11 | Bekletme yok | Gece/öğle isteyen her adımda host "bekle" seçeneği vardır (`time.sleepUntil`, time.js:174). | B |
| İ12 | Bütçe | Kurulum 3 ms dilimlerle (islands.js:31); çalışma anında yeni `PointLight` yok; ışık havuzu 4. | A + B |

### 0.3 Karar noktaları (kullanıcı onayı)

| No | Soru | Öneri | Gerekçe | Alternatif |
|---|---|---|---|---|
| K-1 | Yitik Ufuk nerede? | **(300, −2100), Ölü Sis'in içi** (A) | "Hep oradaydı" sürprizi; final yolculuğu 2–3 dk (co-op oturumu için iyi); Fener Kayası 1,56 km'de. Node: en yakın ada etki alanına pay 1 216 m; 1,5 km içinde kazı/batık/boss yok (Ek A.1). | (5000, 7100), Zümrüt'ün doğusu (B); Ölü Sis yerine tropikte bir Perde. Başlangıç bölgesine etki yok ama yolculuk uzun, anlatı bağı zayıf. |
| K-2 | Ölü Sis oyunun başından görünsün mü? | **Evet, geçilmez sis duvarı olarak; şimşek ve gürleme aşama ≥ 5'te** | Ada fiziksel olarak baştan vardır (arazi aşamaya bağlı olamaz); sis olmadan erken oyuncu adaya ulaşırdı. Tuzla'ya isteğe bağlı bir soru eklenir; ilk beş aşamanın akışı değişmez. | Yalnız aşama ≥ 5'te çizmek: o zaman engel de olmamalı, ada erken bulunur. |
| K-3 | Bitki adaylarında sabit sayıda çekiliş (G-07) | **Evet, S1'de** (A K-3 = B K-A) | Mağara oymalarının etkisi yerel kalır; co-op ve LOD'a bağlı yerleşim farkı azalır. Bütün adalarda bitki ve süs bir kez yeniden dizilir; ada, özellik konumu ve kimlikler değişmez. | Hayır: yeniden dizilim yalnız Buzdişi ve Gümüş Madeni'nde. |
| K-4 | Mağaralar oymayla mı? | **Oyma (A planı); S9 kabul ölçütleri tutmazsa yer üstü kit odaları (B planı)** (B K-C) | Yankı'nın kamera, karanlık ve müzik desteğini genelleştirir. | B planı 3 gün kısa, "mağara" hissi zayıf. |
| K-5 | Büyük Cezir okyanus bölgesiyle mi? | **Evet, ayrı adımda (S13); tutmazsa Plan B** (§4.7) | Finalin görsel doruğu. Node: boşaltılmış su yüzeyi her açıda arazinin ≥ 6,3 m altında (Ek A.7). | Plan B: lagün dolu kalır, final teraslarda. |
| K-6 | Kararları kim verir? | **Yalnız oda sahibi**; konuk "Kaptana öner" | Faz 2 host yetkisi; onay penceresi ve zaman aşımı kodu gerekmez. | — |
| K-7 | Bölüm araçları kime ait? | **Dünya bayrağı + herkese hatıra eşyası** | Konuk ilerlemesi sorunsuz; F-11 kapanır; konuğun kendi dünyasına sızmaz. | — |
| K-8 | PROTO | **Faz 5 değeri + 1** (geliştirmede Faz 5 §8.5 "taslak" kuralı) | Faz 2 B-16; `story.ev/a` kümeleri, `feat hk:` öneki, `storyFx`, `epilog` teli değiştirir. | Bütün v0.5 tek yayınsa tek PROTO değerinde birleştirilebilir. |
| K-9 | F-07/F-08/F-09 Faz 6'da düzeltilsin mi? | **Evet** (küçük) | Hikâyenin girişi ve insan boss XP'si. | — |
| K-10 | Kraken sis kapısında zorunlu mu? | **Evet** (önceden yenilmediyse) | "Bosslar hikâyeye bağlı" isteği; önceden yenen için kapı boştur. | — |
| K-11 | Final sonrası Pusula gücü | **Küresel `time.tideOverride`** (B): günde bir kez 1 oyun saati gelgit −0,55 | Okyanus bölgesini açık denizde ve gemilerin yanında kullanmaz (risk). | A'nın yerel cezir ve "Durgun Su"su: genişleme. |
| K-12 | Aşama XP'si kime? | **Faz 5 K5-2** (olayın 300 m'sindeki herkes, tam) | Faz 5 kararıyla tutarlılık. | Bütün tayfa (A, B). |
| K-13 | Kapsam | **Önce çekirdek** (§9.2) | Takvim ve risk. | — |
| K-14 | Halat ve asansör | **Yok**; merdiven platformu ve gayzer | Tırmanma animasyonu yok (A-1); hareket doğrulayıcıda yeni kip gerekmez. | Animasyon eklenirse genişleme. |

---

## 1. Mevcut hikâyenin envanteri ve 5. aşamanın çıkmazı

### 1.1 Aşamalar (v0.4 = v0.3 içeriği; quests.js'de tek fark han aşçısı seçeneği)

| Aşama | `STORY` | Tetik ve geçiş | Bayraklar | Ödül | Açık hata |
|---|---|---|---|---|---|
| 1 | [0] `basla` | Tuzla diyaloğu "Martı benim mi?" → `advance(1)` (quests.js:350-353) | — | +150 XP (progress.js:81) | — |
| 2 | [1] `ilk_hazine` | Nevra (`cartographer`, :402-405) `giveMap('marti_1')`; `treasureFound` (:138-142) → `chestSold` (:143-147) → `advance(2)` | `ilkHarita`, `ilkHazineBulundu`, `ilkSatis` | 160 altın + XP | F-05, **F-07** |
| 3 | [2] `gunluk` | Yankı masası `_provide` (:294-302) → `takeJournal` (:304-318) | `gunluk` | `eski_gunluk` | F-01 |
| 4 | [3] `parca1` | (−520, −440) 45 m → `spawnBoss('iskelet_kaptan')` (:276-281); ölüm (:175-181) | `parca1` (+ `morvanSpawn` → `rt`) | Parça 1/4 | F-02, F-04, **F-08** |
| 5 | [4] `kizil` | (−40, −228) 50 m → `spawnBoss('kizil_hancer')` (:283-289); ölüm (:182-189) | `kizilYenildi` (+ `kizilSpawn` → `rt`) | Parça 2/4, mektup, büyük sandık | F-02, F-04, F-08, **F-09** |
| 6 | [5] `yitik` | **Yok** | — | — | **F-03** |

### 1.2 Karakterler, eşyalar, metindeki kancalar

| Öğe | Bugün | Bu tasarımda |
|---|---|---|
| Yaşlı Kaptan Tuzla | Han önünde, rol `quest` (port.js:323; npcs.js:22) | Mira'nın miçosuydu; Mira onu son yolculuktan bir filikayla geri yolladı (10. aşamada itiraf). Kapanışta Fener Kayası'nda. |
| Kaptan Mira Veyl | Yalnız metin (quests.js:312-314, :352) | 7'de evi ve mektubu, 10'da ruhu (hayalet NPC). |
| Serdümen Halil | Günlüğün yazarı (quests.js:310-314) | 7'de mezarı ve ruhu. v0.3'teki tüccar "Halil Reis"le karışmaması için her zaman "Serdümen Halil". |
| Morvan, Kızıl Hançer | Parça 1–2 | Değişmez. Kızıl Hançer'in yardımcısı **Kor Selim** 6. aşamanın rakibi. |
| Harita parçaları | `harita_parcasi` `{piece}` (items.js:71); 1–2 veriliyor | 3: aşama 6; 4: aşama 8; 10'da Tuzla'nın masasında **Mira'nın Haritası**; finalde dört bekçi yuvası. |
| Gelgit Pusulası | Yalnız metin | 9'da ikizi **Gelgit İbresi** dövülür; 10'da Mahzen'deki asıl Pusula ve K10. |
| Mira Veyl'in Sandığı | `CHEST_TIERS.legend` (items.js:104), `LOOT.legend` (treasure.js:22); hiç doğmuyor | **Son Hazine**'nin kendisi (§4.4). |
| "Volkanik Adalar", "Buz Krallığı" | Metin; dünyada "Kül Adaları", "Buzul Denizi" (archipelago.js:11-13) | Diyalog köprüsü: "eski denizcilerin Volkanik Adalar dediği Kül Adaları"; Buz Krallığı = buzula gömülü Ayaz Krallığı. |

### 1.3 Bosslar

| Boss | Tanım / tetik | Bugünkü hikâye bağı | Bu tasarımda |
|---|---|---|---|
| Volkanik Dev "Ateşin Bekçisi" | bosses.js:29; krater merkezine 129,6 m (bosses.js:1089) | Yok | **6**: Kor Kalbi'nin bekçisi; parça 3'ün mührü. |
| Hayalet Kaptan | `ENEMY_TYPES.hayalet_kaptan`; mezarlık-2 gece listesi (archipelago.js:161) | Yok | **7**: Halil'in mezar çemberinin bekçisi. |
| Lanetli Amiral "Sisin İçindeki Filo" | bosses.js:28; Sis Adası açığı 240 m, gemide (:1090) | Yok | **7**: Mira'nın tayfasını boğan Amiral Kasvet. |
| Derinlik Yılanı "Buzların Altındaki Kraliçe" | bosses.js:26; Derin Yarık 240 m | Yok | **8**: Kraliçe Ayaz Ana'nın dönüşmüş bedeni; parça 4. |
| Taş Muhafız | bosses.js:27; tapınak çözülmüş + 26 m + |Δy| < 8 (:1088) | Yok | **10**: Gözlem Katı'nın bekçisi. |
| Kraken | bosses.js:25; Kara Girdap 240 m; gemiye 40 m'de doğar (:150) | Yok | **10**: Ölü Sis kapısının bekçisi. |
| Haydut Kaptanı (mini) | Demirkapı avlusu grubu | Yok | **9**: alarm yolunda "Gardiyanbaşı". |

Bosslar yenilince kalıcı işaretlenir (bosses.js:1067), +600 XP verir (progress.js:77) ve herkes 650 m uzaklaşırsa geri çekilir (bosses.js:1096-1099).

### 1.4 Özel bölgeler (audit_G) ve bu tasarımdaki amaçları

| Bölge | Kod | Bugün | Bu tasarımda (aşama) |
|---|---|---|---|
| Terk edilmiş maden — Obsidyen | islands.js:870-897 | Kapalı cephe, dışarıda grup | **6**: Kor Selim'in kampı ve teslim sahnesi (maden meydanı). |
| Terk edilmiş maden — Gümüş | aynı | Kapalı cephe | **9**: fıçıyla açılan **Derin Galeri**, Madenbaşı, basınç plakası, Ay Gümüşü. |
| Korsan Mezarlığı | 755-785 | Sandık + gece grubu | **7**: Sare, gece mum ritüeli, Halil'in ruhu. |
| Kadim Tapınak | 788-867 | Kol bulmacası, erişilemeyen sunak (G-03) | **10**: Sunak Katı merdiveni (G-03 düzeltmesi) + Gözlem Katı, yıldız sırası, Taş Muhafız. |
| Gizli Korsan Pazarı | 900-911 | Gece satıcısı | **7**: Kandil Yağı (gece). |
| Demirkapı Hapishanesi | 932-970 | Sömürülebilir tutsaklar (G-01) | **9**: Zindan Kulesi, Yadigâr, K6'ya bağlı iki giriş yolu (D-01 `tryClaim` sonrası). |
| Deniz Feneri (Fener Kayası) | 973-998 | Dekor | **7**: fener yakılır (kalıcı), **10**: dış merdiven, mercek, Ufuk Işını. |
| Yıkık Korsan Kasabası | 914-929 | Sandık + kamp + kale | **7**: Mira'nın Evi ve kileri; **10**: meyhane bahçesinde seyir defteri kazısı. |
| Batık Şehir | 1025-1038 | 26 rastgele kalıntı, 4 sandık | **10 (isteğe bağlı)**: Mavi Kırıklar kral mezarı — üç sütunlu dalış sırası, lore ve `mavi_kiriklar_muhru`. |

### 1.5 5. aşamanın çıkmazı ve ilgili hatalar

| Bulgu | Özet | Çözüldüğü yer | Faz 6'nın payı |
|---|---|---|---|
| F-01 | Konuk bayrakları host kaydına sızıyor | Faz 2 (`story` beyaz listesi), Faz 4 (D-02) | Beyaz liste `storyData.FLAGS`'ten türetilir (+43 bayrak) |
| F-02 | Doğuş bayrağı kayda yazılıyor | Faz 4 D-17 (`quests.rt`) | Yeni doğuşlar da yalnız `rt`'de |
| F-03 | Çıkmaz | **Faz 6** | Bu belge |
| F-04 | Tetikler yerel | Faz 2 E-9 (yalnız host, `posOf`) | Bütün yeni tetikler aynı kurala uyar |
| F-05 | Konuğun satışı ağda yok | Faz 2 §4.7 | — |
| F-06 | `story` doğrulaması zayıf | Faz 2 B-12 | Geçiş koşulları 6–10 için çekirdekte |
| F-07 | Martı sandığı açılırsa yönlendirme yok | **Faz 6 S2** | `chestOpened` dinlenir; 3 sn içinde yönlendirme; Nevra ücretsiz yedek harita verir |
| F-08 | İnsan bosslar XP vermiyor | **Faz 6 S2** | progress.js:75 → `!T.boss || !e.enemy?.noLoot` (hikâye bossları XP verir) |
| F-09 | Metin uyumsuzluğu | **Faz 6 S2** | events.js:273 düşman gemisi metni `kizilYenildi`'ye göre; mektup doğrudan çantaya; quests.js:30 metni kalkar |
| F-10 | Görev panosu sınırlı | Kapsam dışı | — |
| F-11 | Hikâye ödülü yalnız host'a | Faz 2 profili | `storyGive` bütün tayfaya + geç katılım uzlaştırması (§6.2) |

---

## 2. Hikâye omurgası

### 2.1 Bölüm özeti (8 öğe)

| Aşama (`STORY`) | Başlık | Yeni bölge/alan | Yeni NPC | Görev zinciri | Bulmaca | Yeni düşman / davranış | Boss / özel karşılaşma | Karar | Ödül ve kalıcı ilerleme |
|---|---|---|---|---|---|---|---|---|---|
| 6 [5] `ates` | Ateşin Bekçisi | Kül Adaları: **Kor Kulesi** (Ateş Dağı batı yamacı), Kor Sunağı; Obsidyen maden meydanı | Demirci **Kevser**; rakip **Kor Selim** | 6 adım | Gayzerle kule tırmanışı | **Kül Bombacısı** (lav lob + ateş havuzu); `surrender` | Kor Selim (teslim olur); **Volkanik Dev** | K6: Selim'i bağışla / teslim et | Parça 3; **Obsidyen Kazma**; manzara noktası |
| 7 [6] `sis` | Sisin İçindeki Filo | **Mira'nın Evi** (Korsan Kasabası), Halil'in mezar çemberi, **Zincir Taşı**, fener | Mezarcı **Sare**; Serdümen **Halil**'in ruhu; Amiral **Kasvet**'in gölgesi | 7 adım | Gece mum ritüeli; ışık kuralı ve zincirler | **Zincirli Ruh** (`lightBound`) | Hayalet Kaptan (ritüel bekçisi); **Lanetli Amiral**; Zincir Taşı ayini | K7: Kasvet'i affet / fenerde yak | **Ruh Feneri**; fener kalıcı yanar; Amiral'in defteri |
| 8 [7] `buz` | Buzların Altındaki Kraliçe | **Ayaz Kulesi** (Buzdişi zirvesi), **Ayaz Mağarası** (göl, çukur, buz perdesi altından geçit) | Buzkıran **Ayaz**; Kraliçe **Ayaz Ana**'nın ruhu | 6 adım | Ruh Feneri kaynaklı **buz aynaları** (64 düzenden tek çözüm) | **Buz İskeleti** (`slowHit`), **Buz Kâhini** (`sk_mage`) | **Derinlik Yılanı**; ayna sırasında dalgalar | K8: Ayaz Tacı'nı Ayaz'a ver / kendine al | Parça 4; Kraliçe'nin Mührü; manzara noktası |
| 9 [8] `ibre` | Gelgit İbresi | **Zindan Kulesi** (Demirkapı), **Derin Galeri** (gizli maden), **Güneş Örsü** (Kızıl Kanyon) | Kervanbaşı **Nur**; Seyir Ustası **Yadigâr** | 5 adım | Fıçı + çatlak duvar; basınç plakası; öğle penceresi | **Kum Hayaleti** (gömülü pusu), Madenci İskelet (`rise 0,5`) | **Madenbaşı Gümüşdiş** (karanlık evresi); örs savunması; (alarm yolu) Gardiyanbaşı | K9: damarın kalbini sök / arındır | **Gelgit İbresi**; galeri sandıkları |
| 10 [9] `ufuk` | Yitik Ufuk | Sunak/Gözlem Katı, Ufuk Feneri galerisi, **Ölü Sis**, **Yitik Ufuk** (lagün, Gelgit Kızı, Mahzen) | Tuzla'nın itirafı; **Mira Veyl**'in ruhu | 9 adım (+1 isteğe bağlı) | Yıldız sırası; mercek ve ışın; sis koridoru; dalış; bekçi yuvaları; sunak | Veyl tayfası (sis içinde gündüz de) | Taş Muhafız; Kraken (kapı); **Büyük Cezir**; **Gelgit'in Gölgesi** | K10: Pusula'yı Mira'ya ver / kendin al | **Son Hazine**; Pusula ya da Kutsama; "Ufkun Kaptanı" |
| — [10] `son` | Ufkun Ötesi (epilog) | Açık dünya | — | — | — | — | — | — | Unvan, Gelgit Hazineleri |

### 2.2 Finalin anlamı

- **Dört parça** hem harita hem anahtardır. Halil'in günlüğüne göre her parça "ayrı bir adaya, ayrı bir bekçiye" emanet edildi (quests.js:312). Parça 1 sadık topçu Morvan'da, parça 2 levazımcının torunu Kızıl Hançer'de ("Mira'nın haritası benim hakkım!", quests.js:287). Parça 3 ve 4 için Mira insan değil, ölümsüz bekçiler seçti: ateşin bekçisi ve buzların altındaki kraliçe. Birleşen harita Yitik Ufuk'un yerini ve Ölü Sis'teki tek güvenli akıntıyı gösterir; finalde dört parça dört bekçi yuvasını yakar.
- **Gelgit Pusulası** Mavi Kırıklar Krallığı'nın eseridir; denizin akışını değiştirir. İçinde **Gelgit'in Gölgesi** yaşar ve kullananı tüketir; krallık bu yüzden battı (Batık Şehir, Kadim Tapınak).
- **Yitik Ufuk** krallığın kutsal adasıdır. Mira oraya ulaştı, hazineyi Mahzen'e koydu, Pusula'yla **Ölü Sis**'i yükseltti. Peşindeki Amiral Kasvet'in filosu sisin içinde boğuldu; tayfanın ruhları Amiral'in zincirinde kaldı (7). Denizciler sisi her şafak görür ama hiç giremez.
- **Mira Veyl'in kaderi:** Pusula'yı mühürlemek için ruhunu ona bağladı; altmış yıldır Gölge'yle çekişen bir bekçidir. Miço Tuzla'yı son yolculuktan bir filikayla geri yolladı: "Biri haritayı tamamlarsa ona yol göster."
- **Son Hazine:** Mira Veyl'in Sandığı (altın, kayıp krallığın eserleri) ve Pusula. Son seçim (K10) Pusula'nın ve Mira'nın kaderini belirler. İki yolda da hikâyenin hedefi kapanır: Son Hazine bulunur ve açılır, Mira'nın akıbeti öğrenilir.

### 2.3 Tuzla'nın yayı ve metin tutarlılığı

| An | Tuzla'nın satırı (özet) | Etki |
|---|---|---|
| Aşama 0–4, isteğe bağlı | "Kuzeydeki sis mi? Ölü Sis. Giren dönmez, evlat." | Ölü Sis'in merak kancası; akış değişmez |
| 6 başı (`st ≥ 5` dalı, quests.js:358) | "Kül Adaları'na git; eski denizciler Volkanik Adalar derdi. Kül Limanı'nda Kevser adında bir demirci var, ninesi Mira'yı tanırdı." | HUD hedefi |
| 7 sonu | Halil'in ruhu Tuzla'nın adını söyler; Mira'nın mektubu Tuzla'ya teslim edilir. | 10'un kancası |
| 10 başı | İtiraf: "Ben Gelgit Kızı'nın miçosuydum…" Dört parçayı masasında birleştirir: harita Yitik Ufuk'u kendi limanının burnunun dibinde, Ölü Sis'in içinde gösterir. | Büyük açılım |
| Kapanış | Fener Kayası'nın galerisinde: "Martı'yı denize geri getirdin evlat." | Kapanış metni |
| Epilog | Han önünde Mira'nın bayrağı; Gelgit Haritaları | Final sonrası |

İlk beş aşamanın metni, tetikleri, kimlikleri ve bayrak adları değişmez. Halil'in günlüğü ve Kızıl Hançer'in mektubu olduğu gibi doğrulanır.

### 2.4 Kararlar ağı

| Karar | Seçenek A (bayrak) | Seçenek B (bayrak) | Sonraki etki ve final etkisi |
|---|---|---|---|
| **K6** Kor Selim | `k6_af`: "Git ve Hançer'in adını bir daha anma." | `k6_teslim`: Kül Limanı'na teslim et | A → 9'da Selim Zindan Kulesi'nin arkasında bekler, iskele yolunu gösterir (alarmsız giriş); 10'da 3 **Kor Bombası** (Kraken dokunacına ×2). B → anında +400 altın, Kül Limanı tüccarlarında %10 indirim; 9'da Selim yan hücrededir: serbest bırakılırsa hücre kodunu söyler (alarmsız), bırakılmazsa bağırır (alarm, Gardiyanbaşı). |
| **K7** Amiral Kasvet'in ruhu | `k7_af`: affet, sessiz geçidi söylesin | `k7_yak`: ruhunu fenerde yak | A → `amiral_kilici` (pala, hasar 40); Ölü Sis koridorunun şamandıra ışıkları gündüz de görünür (gece/ışın şartı kalkar); Hayalet Denizleri'nde gece "sis filosu" olayı kapanır. B → Ruh Feneri güçlenir: boon `ghost ×1,5` (hayalet ailesine bütün hasar); finalin 2. evresinde boğulmuş tayfanın canı ×0,5. |
| **K8** Ayaz Tacı | `k8_ver`: tacı Ayaz'a ver | `k8_al`: tacı kendine al | A → **Kraliçe'nin Kutsaması**: nefes ×1,5 (player.js:783), buzdağı çarpma hasarı ×0,5; Kuzeyfener'de Ayaz bayrağı ve final sonrası repliği; finalin su basma evresinde belirgin avantaj. B → `ayaz_taci` (2 500, satılabilir); Ayaz Kuzeyfener'den ayrılır (NPC kalkar). |
| **K9** Ay Gümüşü damarı | `k9_kalp`: kalbini sök | `k9_arin`: Madenbaşı'nın ruhunu serbest bırak, yalnız gerekeni al | A → **Kalp İbresi**: Ölü Sis koridoru 60 m geniş, akıntı zayıf; Derin Galeri çöker (girilmez); Kızıl Kum'da gece iskeletleri +1. B → **Arı İbre**: koridor 35 m, rüzgâr savrulmaları; galeri arınır: oyun günü başına 1 `gumus_kulce` veren damar (`worldState.res`). |
| **K10** Gelgit Pusulası | `k10_mira`: Mira'ya ver | `k10_pusula`: kendin al | A → Ölü Sis kalıcı olarak kalkar; Yitik Ufuk normal ada (Mira'nın taş heykeli, iskele); **Mira'nın Kutsaması** (gemi hızı ×1,08, fırtına hasarı ×0,7); unvan "Ufkun Özgürleştiricisi". B → `gelgit_pusulasi`: **Gelgit Çağrısı** (K-11); koridor kalıcı açık; Mira sunakta bekçi NPC; unvan "Gelgitin Efendisi". |

Kararlar yalnız host'ta `story.choose()` ile verilir (K-6). Her çift karşılıklı dışlayıcıdır (§6.1). Her karar kapanış metnine bir cümle ekler (§4.5).

### 2.5 Dikey keşif haritası

| Tür | Yer (aşama) | Yükseklik | Mekanik |
|---|---|---|---|
| Dağ zirvesi | Kor Kulesi (6), Ayaz Kulesi (8), Ufuk Feneri galerisi (10) | 107 → 123,8 m; 89,3 m; 12,8 → 31,8 m | Gayzer fırlatması + kat platformları; yürüyüş; dış sarmal merdiven |
| Mağara | Ayaz Mağarası (8), Derin Galeri (9) | taban 9,5 → oda; taban 9 | `CAVES` genelleştirmesi (S9) |
| Yeraltı gölü | Ayaz Mağarası gölü (8) | göl −4, mabet çukuru −9 | Deniz seviyesinin altına oyma (okyanus düzlemi göl olur) + durgun su bölgesi |
| Su altı geçidi | Ayaz Mağarası buz perdesi (8), Gelgit Kızı iç geçidi (10) | −1,5; −9,3 | Perde çarpıştırıcısı `y0 = −1,5`; gövde içi kit odası + tavan sınırı + kabarcık |
| Batık gemi odaları | Gelgit Kızı: ambar ve kaptan köşkü (10) | −9,3 m | Prosedürel gövde (`woodPlanks`), kabarcık |
| Gizli maden | Derin Galeri (9) | yarık 5,9–10,9 m | Fıçıyla açılan giriş, oda, plaka |
| Tapınak katları | Sunak Katı (+8), Gözlem Katı (+14) (10); Mahzen terasları T0 −6 … T4 +6 (10); Batık Şehir kral mezarı (10, ops.) | y0 50,1 → 64,1 | Platform merdiveni (`addPlatform(..., false)` + alt kutu) |
| Kule | Zindan Kulesi (9) | 19,8 m tabanlı kule | Kit kulesi + hücre |

### 2.6 Bölüm araçları (kalıcı ilerleme)

| Araç (bayrak / eşya) | Aşama | Kullanım | Açık dünyada açtığı içerik |
|---|---|---|---|
| Obsidyen Kazma (`t_kazma` / `obsidyen_kazma`) | 6 | "Çatlak duvar" etkileşimi, basılı 1,2 sn | Mira'nın kileri (7, zorunlu), Kevser'in ninesinin atölyesi (Kül Limanı), Kızıl Kanyon'da kayıp kervanın odası, Yankı Mağarası'nda Halil'in taş yığını (isteğe bağlı sırlar) |
| Ruh Feneri (`t_fener` / `ruh_feneri`) | 7 | F tuşu (player.js:122-126) yeşil alev; 15 m'de ruh NPC'lerini görünür/konuşulur kılar; Zincirli Ruh yalnız ışığında hasar alır; ayna bulmacasının kaynağı; Ölü Sis'te ışık yolu | Halil, Kraliçe ve Mira'yla konuşma; Hayalet Denizleri'nde gece savaşı |
| Gelgit İbresi (`t_ibre` / `gelgit_ibresi`) | 9 | HUD pusulasında koridor yönü; zaman panelinde "sonraki alçak su" (`time.nextTides`, time.js:84-95) | Final sonrası: en yakın açılmamış hikâye sırrını gösterir |
| Gelgit Pusulası ya da Mira'nın Kutsaması | 10 | K10 (§2.4, K-11) | Gelgit Hazineleri'ne her an erişim (Pusula) |

### 2.7 Sıra esnekliği ve geriye dönük işleme

- Bir aşama içinde mantıkça bağımsız adımlar her sırayla yapılabilir; HUD ilk eksik adımı gösterir, defter bütün adımları işaretli listeler (B).
- `storyKernel.reconcile(state, world)` aşama başında, yüklemede ve her `bossDefeated` olayında çalışır; `bosses.defeated` ve dünya kümeleriyle adımları kapatır. Örnek: Volkanik Dev önceden yenildiyse 6.4 kapanır ve Kor Kalbi sunağın dibinde "soğumuş" bulunur.
- Kaybolan hikâye eşyası bayraktan yeniden verilir (yüklemede uzlaştırma; kayıt onarımı değil).

---

## 3. Aşamalar

Her aşamada: (a) bölge, (b) NPC, (c) görev zinciri, (d) çevre bulmacası, (e) düşman, (f) boss/özel karşılaşma, (g) karar, (h) ödül ve kalıcı ilerleme, (i) geriye dönük ve sıra. Koordinatlar v0.4 arazisinde Node ile ölçüldü (Ek A); yeni yapıların kesin yeri S4'te `hikaye_dunya.mjs` (W04–W06) ile doğrulanır.

### 3.0 Ortak altyapı

**Adım modeli** (`storyData.js`, saf; B'nin biçimi, A'nın koşul alanları):

```js
export const CHAPTERS = [
  { stage: 5, id: 'ates', title: 'Ateşin Bekçisi', steps: [
    { id: '6.1', flag: 'a6_kevser', goal: 'G_6_1', at: 'kul_limani_hk_kevser',
      trig: { t: 'npc', a: 'kul_limani_hk_kevser' }, r: 4, mode: 'ground' },
    { id: '6.2', flag: 'a6_selim', goal: 'G_6_2', at: 'obsidyen_hk_kamp', needs: ['a6_kevser'],
      zone: { r: 45, fx: 'spawnSelim' }, trig: { t: 'surrender', a: 'kor_selim' }, choice: 'K6', give: ['kor_anahtari'] },
    { id: '6.3', flag: 'a6_kule', goal: 'G_6_3', at: 'ates_dagi_hk_sunak', needs: ['a6_selim'],
      trig: { t: 'feat', a: 'ates_dagi_hk_sunak' }, r: 3, dy: 3.5, take: ['kor_anahtari'] },
    // …
  ], done: 't_kazma' },
];
export const FLAGS = [/* 6 mevcut + 43 yeni; Faz 2 beyaz listesi ve Faz 4 STORY_REQ bundan türetilir */];
export const CHOICES = { K6: ['k6_af', 'k6_teslim'], K7: ['k7_af', 'k7_yak'], K8: ['k8_ver', 'k8_al'], K9: ['k9_kalp', 'k9_arin'], K10: ['k10_mira', 'k10_pusula'] };
export const TEXT = {/* G_6_1: '…', D_KEVSER_1: '…', R_HALIL: '…', N_SIS_ITER: '…' */};
export const ENDING = {/* K10 tabanı × 2 + her karar × 2 cümle */};
export const STORY_OPEN = 5; // bölüm kapısı: bu dizinden sonrası "yakında"; S7…S14'te 6…10 yapılır
```

**Çekirdek** (`storyKernel.js`, saf; B): `step(state)`, `apply(state, ev, world) → {state, effects[]} | {rej}`, `reconcile(state, world)`, `validate(save)` (§6.1), `prereq(stage, choices)` (test), `seq(def, state, i)` (sıra motoru; tapınak kolu kalıbı islands.js:836-849, Faz 2 `templeOrder`), `beam(mirrors, src, target)` (ayna), `sisAllowed(state, pos, ctx)` (Ölü Sis engeli). Olay türleri: `npc, feat, kill, boss, surrender, enter, dig, choice, time`. Etki türleri (yalnız host yürütür): `msg, reader, give (bütün tayfaya), take, xp, spawnBoss, spawnGroup, open, fog, poi, boon, fx, advance, log, ach, epilog`.

**Çalışma zamanı** (`js/game/story.js`): `game.register` listesinde `quests`'ten hemen sonra (main.js:103); Faz 3 sınıfı **KARE**. Kayıt anahtarı yok; durum `quests.stage/flags/rt`'dedir. Görevleri: (1) host'ta saniyede bir bölge tetikleri (bütün oyuncuların `posOf`'u); (2) `bossDefeated / enemyKilled / enemySurrender / treasureFound / npcTalk / chestOpened` olaylarını çekirdeğe iletmek; (3) etkileri yürütmek; (4) HUD hedefi (`target()`, `goal()`); (5) konuk niyetlerinin host işleyicisi (`hostOps.story`, `hostOps.feat` genişlemesi); (6) epilog. **Her etkileşim baştan `story.request(ev, a)` üzerinden yazılır** (A): tek oyunculu ve host'ta yerelde `apply`, konukta ağ niyeti (S15'te açılır).

**Hikâye yapıları** (`storyWorld.js` veri + `storyBuild.js` kurucu): `STORY_SITES` ada kimliğine göre gruplanır; her kaydın açık bir kimliği vardır: **`<adaId>_hk_<ad>[n]`** (Faz 4 §6.1 en uzun önek kuralına uyar; `I.features`'a eklenmez). `islands._buildGen`'e lav evresinden sonra `J.phase = 'story'` evresi eklenir; her yapıdan sonra `yield`. Etkileşimler `B.inter`'e `cond` ile eklenir (istem yalnız ilgili adım etkinken). Eylem host'ta `story.use(id)`, konukta `feat{id:'hk:'+id}`. R-nötr bitki ayıklaması: `_vegetation`'da `B.batch.add`'den hemen önce (islands.js:470) `if (storyClear(I.id, x, z)) continue;`.

**Hikâye NPC'leri** `npcs.add(spot)` ile (npcs.js:89); `islands._npc` `R` tükettiği için kullanılmaz. `npcs._create`'e (npcs.js:64-86) dört seçenek eklenir: `spot.ghost` (`anim.ghostly(renk, 0.55)`, enemies.js:287 yöntemi), `spot.hours = [20, 5]` (görünürlük ve istem saatlik), `spot.lantern` (yalnız Ruh Feneri yanan oyuncuya 15 m'de görünür ve konuşulur), her zaman `spot.y` ve `minY: -50` (hakem A-9). Diyaloglar `quests.dialog`'a eklenen `case 'story': return story.dialog(npc)` dalından.

**Bulmaca motorları ve yeniden kullanım**

| Motor | Kaynak | Kullanım |
|---|---|---|
| Sıra | `_temple` kol eylemi → saf `kernel.seq` | Mum ritüeli (7), yıldız yuvaları (10), Batık Şehir sütunları (10, ops.) |
| Gayzer | `hazards._geyser/_updateGeyser` (557-604) + **`y` parametresi** | Kor Kulesi (6) |
| Fıçı + duvar | `hazards._keg/_explode` (163-243) + **`wall` hazard'ı** (yalnız `kind:'explosion'`) | Gümüş Madeni girişi (9) |
| Basınç plakası | `hazards._puzzleSite/solve` (429-554) + **`_puzzleAt`** (sabit konum) | Derin Galeri kafesi (9) |
| Basılı tutma | `interact` hold dalı (interact.js:61-65) | Çatlak duvarlar, zincirler (7), hücre kilidi (9), sandık (10) |
| Zaman | `sky.hour`, `sky.isNight()`, `time.sleepUntil` | Gece (7, 10), öğle (9) |
| Dalış ve nefes | player.js:780-785 | Ayaz gölü (8), Gelgit Kızı (10), kral mezarı (10, ops.) |
| Kazı | `treasure.startDig/resolveDig` (186-239), `G.storySites` | Seyir defteri (10), Gelgit Hazineleri (epilog) |
| Ayna | **Yeni**, saf `kernel.beam` | Ayaz Mağarası (8) |

**Düşman grupları:** `enemies.addGroup`'a `cond` alanı (enemies.js:1306-1309); `_populate` (:1539) grubu yalnız `cond()` doğruyken doldurur. Gece dalgası birikimine (H-19) karşı hikâye gruplarında `max 6`.

**Kalıcı güçler (boon):** `progress.recompute` (progress.js:153-162) bayraklardan çarpan türetir; kayda ayrı alan yazılmaz. Yeni mod anahtarları: `ghost` (hayalet ailesine hasar), `ice` (buzdağı hasarı), `storm` (fırtına hasarı); mevcut: `breath`, `ship`.

**Bekleme:** "Gece/öğle olana kadar bekle" istemi ilgili yapıda çıkar; `main.js` `sleepAtInn` işleyicisi (257-268) `waitUntil{until, where, cost:0}` olarak genelleşir. Kural aynı: online'da yalnız host, çatışmada olmaz.

**Atmosfer bölgeleri** (A): `storyWorld.ZONES` `{x, z, r0, r1, color, density, night}`; `sky.js`'in sis karışımı (sky.js:277-285, :353-360) bu listeyi okur. Ölü Sis'in gözü (altın, durgun), Ayaz Mağarası (buz mavisi), Derin Galeri (toz), örs ayini (kum fırtınası).

---

### 3.1 Aşama 6 — "Ateşin Bekçisi" (`STORY[5]`, `ates`)

**(a) Bölge.** Kül Adaları (`volkan`; kül sisi sky.js:357, parçacıklar :383). Arazi değişikliği yok.

| Alan | Konum (Node) | Ölçek, siluet | Hikâye yapısı |
|---|---|---|---|
| Kül Limanı | Kevser (5155, 421), h 2,8 (liman düzlüğü) | Kara kumlu liman | Kevser'in tezgâhı; isteğe bağlı **atölye** sırrı (çatlak duvar, kit odası 6×6, `kul_limani_hk_atolye`) |
| Obsidyen maden meydanı | `obsidyen_mine_0` (6387, 2663), düzlük r 26, h 10,4 | Cam gibi kara kristaller | Kor Selim'in kampı: tetik 45 m; iki hikâye fıçısı (`obsidyen_hk_fici0..1`) |
| **Kor Kulesi** (yeni alan, dağ zirvesi) | Taban (7538, −900): 6 m içinde 107,3–110,5 m; krater merkezine 162 m (Dev tetiği 129,6 m'nin dışında) | Volkan tonlu `rock_tall` sütunlar (0x403838, islands.js:1070 tonu), dört kat: B0 8×8 (üst 110,6), T1 6×6 (115,0), T2 6×6 (119,4), T3 sunak 6×6 (123,8) | Üç hikâye gayzeri; T3'te **Kor Sunağı** (turuncu yayan malzeme + `_lamp`) |
| Krater | (7700, −900), lav gölü r 70 | Mevcut | Volkanik Dev (mevcut tetik) |

Katlar `physics.addPlatform`, yan yüzler `sides` ile katı; kat farkı 4,4 m (basamak sınırı 0,6 m, zıplama 1,24 m → katlar yürüyerek aşılmaz). Atmosfer: kül, lav ışığı (islands.js:1106), sunağın ışığı havuzdan.

**(b) NPC.**

| NPC | Rol | Diyalog özeti | Model |
|---|---|---|---|
| Demirci **Kevser** (`kul_limani_hk_kevser`) | `story` | "Ninem Mira'ya obsidyenden bir **Kor Anahtarı** dövmüştü; ateşin bekçisinin sunağını açar. Kızıl Hançer'in yardımcısı Kor Selim onu çaldı, Obsidyen'deki eski madene saklandı." Dönüşte: "Mira'nın miçosu küçük Tuzla'yı ninem hep anlatırdı…" | `Character`, kadın, `body:'kahin'`, deri önlük (`coatColor #4a3020`, `shirtColor #a05a2a`), `age 0.55` |
| **Kor Selim** | Rakip (insan boss) | "Hançer öldü ama harita onun hakkıydı!" — %15 canda: "Dur! Teslim oluyorum…" | `ENEMY_TYPES.kor_selim`, `body:'kaba'`, kül renkli giysi, `scale 1.12` |

**(c) Görev zinciri**

| No | Hedef (HUD) | Yer | Tetik / host koşulu | Önkoşul | Bayrak | Etki |
|---|---|---|---|---|---|---|
| 6.1 | "Kül Limanı'nda Demirci Kevser'i bul." | (5155, 421) | `npc kul_limani_hk_kevser`, ≤ 4 m, `ground` | aşama 5 | `a6_kevser` | Okuma metni; Obsidyen POI'si görünür |
| 6.2 | "Obsidyen Adası'ndaki madende Kor Selim'den Kor Anahtarı'nı al." | (6387, 2663) | Bölge 45 m → host `enemies.spawnBoss('kor_selim', …, {homeR: 18})`; `enemySurrender{type:'kor_selim'}` → K6 penceresi | `a6_kevser` | `a6_selim`, `k6_*` | `give kor_anahtari` (bütün tayfa); Selim XP'si (F-08) |
| 6.3 | "Ateş Dağı'nın batı yamacındaki Kor Kulesi'ne gayzerlerle tırman, Kor Anahtarı'nı sunağa yerleştir." | (7538, −900), T3 | `feat ates_dagi_hk_sunak` (≤ 3 m, |Δy| ≤ 3,5; islands.js:1155) | `a6_selim` | `a6_kule` | `take kor_anahtari`; sunak yanar: "Bekçi yaşadıkça mühür çözülmez." |
| 6.4 | "Kraterde Ateşin Bekçisi'ni yen." | (7700, −900) | `boss volkanik_dev` ya da `reconcile` | aşama 5 (6.3'ten bağımsız) | `a6_dev` | `give kor_kalbi` **doğrudan** (H-29: ganimet lava düşebilir) |
| 6.5 | "Kor Kalbi'ni sunağa koy, 3. harita parçasını al." | T3 | `feat ates_dagi_hk_sunak` | `a6_kule ∧ a6_dev` | `parca3` | `give harita_parcasi {piece:3}`, `take kor_kalbi`; manzara noktası: Kül Adaları'nın sisi 1 200 m yarıçapta açılır |
| 6.6 | "Kevser'e dön." | (5155, 421) | `npc kul_limani_hk_kevser` | `parca3` | `t_kazma` | `give obsidyen_kazma`; `advance(6)` |

**(d) Çevre bulmacası — Kor Kulesi gayzer tırmanışı** (B; hakem düzeltmesiyle).
- Mevcut gayzer durum makinesi aynen: 1,3 sn gürleme uyarısı, 2,4 sn püskürme, 7–12 sn bekleme (hazards.js:576-603); fırlatma `vel.y = 16` → tepe 5,82 m > kat farkı 4,4 m; her fırlatma 4 hasar (`unblockable`).
- Yeni olan yalnız gayzerin platform üstünde kurulmasıdır: `_geyser(S, id, x, z, R, y)`; `h.y` platform tepesi. Hikâye gayzerleri `hazards._buildIsland` sonunda, hikâye kayıtlarından ve kendi tohumlarıyla kurulur (mevcut gayzerlerin `R` akışı değişmez).
- Yerleşim (Node, Ek A.3): koşu isteğinde inişte yatay yol 3,1 m, sprintte 5,0 m. Gayzer bir üst katın kenarına **0,5 m**; katlar 6×6; uzak kenarda 0,4 m'lik alçak korkuluk kutusu (taşmayı keser, iniş görüşünü kapatmaz).
- Zamanlama bir saldırı değil, bekleme bulmacasıdır; püskürme `bodies.force` ile fıçı ve sandık da fırlatır.
- **Yedek:** S7 kabulünde fizik testi tutmazsa her kata `_pier` basamak kalıbıyla (islands.js:650-665) gizli bir taş merdiven eklenir; bulmaca kolaylaşır, ilerleme kilitlenmez.

**(e) Düşman.** **Kül Bombacısı** (`haydut_kulcu`, `haydut_nisanci` türevi): yeni `RANGED.lav = { aim:'CastRaise', shoot:'Cast', aimT:1.0, reloadT:3.2, lob:'lava', aoe:2.4, pool:true }`; menzilli dal (enemies.js:838-852) `RANGED[x].lob` ise `enemies.lob({kind:'lava', aoe, pool:true})` çağırır (enemies.js:1416); iniş halkası kırmızı, yanan alan 6 sn (`firePools`, :1451); `keep [8, 15]`, hp 85, dmg 16, `kk:weapons:smokebomb`. Arenadaki iki hikâye fıçısı lav topuyla zincirleme patlar (hazards.js:229): çevre silah olarak kullanılır.

**(f) Boss ve özel karşılaşma.**
1. **Kor Selim** (`kor_selim`, `haydut_kaptani` + `kizil_hancer` karışımı): `boss:true`, hp 700, dmg 26, `moves:'sword1h'`, `ranged2:'lav'`, `summonAt:[0.5]` → 2 Kül Bombacısı, `smoke:true`, `callHelp:true`, yeni **`surrender: 0.15`**: %15 canda saldırmayı keser, diz çöker (`Sit_Floor_Down`), dokunulmaz olur; host `G.emit('enemySurrender', {type, id, pos})` yayar. Uyarılar mevcut kalıplar (enemies.js:427-511). Doğuş host'ta, `rt.selim` kayda yazılmaz.
2. **Volkanik Dev** (mevcut): evreler, lav yağmuru, ateş halkası, zayıf nokta (yağmurdan sonra 3,2 sn göğüs çekirdeği önden ×2,2, bosses.js:788-796, :854). Faz 6 yalnız `bossDefeated` bağını ekler.

**(g) Karar K6** — Selim diz çökünce host'ta pencere: [Bağışla] [Kül Limanı'na teslim et]. Konuk ekranında "Kaptan karar veriyor…" ve "Kaptana öner" seçenekleri. Sonuçlar §2.4.

**(h) Ödül.** Parça 3/4, **Obsidyen Kazma**, aşama XP'si (+150, K5-2), Selim XP'si, başarım **"Ateşin Bekçisi"** (`ach_ates`), Kor Kulesi tepesinde kalıcı manzara noktası, Kevser'in atölye sırrı (isteğe bağlı, `rich` sandık).

**(i) Geriye dönük ve sıra.** Dev önceden yenildiyse 6.4 yüklemede kapanır; Kor Kalbi 6.5'te sunağın dibinde "soğumuş" bulunur. 6.3 ile 6.4 her sırayla yapılır.

---

### 3.2 Aşama 7 — "Sisin İçindeki Filo" (`STORY[6]`, `sis`)

**(a) Bölge.** Hayalet Denizleri (`hayalet`; gece yoğunlaşan yeşil sis, sky.js:284) + merkezden Korsan Kasabası, Fener Kayası, Gizli Pazar.

| Alan | Konum (Node) | Not |
|---|---|---|
| **Mira'nın Evi** (yeni alan) | Yıkık kasaba merkezinden (−1789, 1492) 50 m: **(−1755, 1455)**, h 7,5 (6 m'de 7,1–9,4) | Bina halkasının olası zarfı (≤ 40 m; `rr ≤ 34`, `TOWN_S 6,2`, islands.js:914-929) dışında. Tek ayakta kalan taş ev (`kk:town:home_A_red`, soluk tint) + arka duvarda çatlak duvarlı **kiler** (kit odası 6×6, platform zemin). |
| Korsan Mezarlığı — Sare | (−6525, −6368), h 2,8, doğu kıyısı | Kulübe + 12 m'lik iskele (`_pier` kalıbı) |
| **Halil'in mezar çemberi** | Mezarlık-2 merkezinden (−6951, −6309) ada merkezine doğru 28 m: **(−6927, −6323)**, h 4,8, düz | Çitin (r 22) dışında; mezar taşı (`kk:graveyard:gravestone`), üç mum yuvası (`kk:graveyard:candle_triple`), havuz lambası (0x80ffc0). Mezarlık-2'nin gece listesindeki **Hayalet Kaptan** (archipelago.js:161) çemberin çevresinde doğar. |
| Fener Kayası | Fener (−1243, −1950); kapı **(−1246, −1950)** | Feneri yakma etkileşimi kapıda; yanınca `_lighthouse` hüzmesi (islands.js:997) gündüz de döner. |
| Gizli Pazar | (2443, −1698) | Kaçakçı (20:00–05:00, quests.js:448-453): **Kandil Yağı** |
| Sis Adası açığı | Lanetli Amiral sahası (−6000, −8400) | Mevcut deniz bossu |
| **Zincir Taşı** | Sis Adası harabesinden 24,5 m: **(−5268, −7850)**, h 8,5 | Harabe plaka adayı (`hashStr % 10 = 3`); plaka sitesinin zarfı ≤ 20,4 m (Ek A.4) → çakışmaz. `kk:graveyard:arch` + `bone_*` + üç zincir noktası (taşın çevresinde 2,5 m). |

**(b) NPC.**

| NPC | Rol | Diyalog özeti | Model |
|---|---|---|---|
| Mezarcı **Sare** (`korsan_mezarligi_hk_sare`) | `story` | "Halil'in mezarı batıdaki küçük mezarlıkta. Ölüler sözünü ancak gece, üç ruh mumu yanınca söyler. Ama o mezarı bir kaptan bekler…" → 3 `ruh_mumu` | Kadın, `body:'kukuleta'`, gri pelerin, `age 0.7` |
| Serdümen **Halil**'in ruhu (`korsan_mezarligi_hk_halil`) | `story`, `ghost 0x9fffe0`, `hours [20,5]` | 7.3: "Ben Halil, Gelgit Kızı'nın serdümeni. Mira Pusula'nın içinde bir gölge gördü… Kandili Fener Kayası'nın lamba odasında kaldı; feneri yeniden yakarsan tutuşur." 7.7: Mira'nın kaderi ve Tuzla'nın adı. | Erkek, `body:'subay'`, `hat:'tricorn'`, `coat:'uzun'` |
| Amiral **Kasvet**'in gölgesi (`sis_adasi_hk_kasvet`) | `story`, `ghost` | Zincir Taşı'nın son zincirinde belirir, saldırmaz, K7'yi sorar. | `lanetli_amiral` görünümü |

**(c) Görev zinciri**

| No | Hedef | Yer | Tetik / host koşulu | Önkoşul | Bayrak | Etki |
|---|---|---|---|---|---|---|
| 7.1 | "Korsan Kasabası'nda Mira'nın evini bul; kilerin çatlak duvarını Kazma'yla kır." | (−1755, 1455) | `feat korsan_kasabasi_hk_kiler` (`t_kazma`; ≤ 2,8 m; basılı 1,2 sn) | aşama 6 | `a7_kiler` | `islands.opened`; kiler sandığı: `mira_mektubu` (Tuzla'ya), okuma metni: Halil'in mezarı |
| 7.2 | "Gece Halil'in mezarında üç ruh mumunu yak." | (−6927, −6323) | Sare'den 3 `ruh_mumu`; 3× `feat korsan_mezarligi_hk_mum<i>` (gece; 15 m içinde canlı düşman yok; host `enemies.list` + `posOf`) | `a7_kiler` | — (`rt.mum`) | Üçüncü mumda Halil'in ruhu belirir |
| 7.3 | "Halil'in ruhuyla konuş." | aynı | `npc korsan_mezarligi_hk_halil` (gece) | `rt.mum = 3` | `a7_halil` | Okuma metni; Fener POI'si |
| 7.4 | "Gizli Pazar'dan Kandil Yağı al, Fener Kayası'nın fenerini gece yak." | (−1246, −1950) | `feat fener_kayasi_hk_fener` + `kandil_yagi` + gece | `a7_halil` | `t_fener` | `take kandil_yagi`, `give ruh_feneri` (bütün tayfa); fener kalıcı yanar; Fener Kayası POI simgesi `peak` → `lighthouse` (G-15) |
| 7.5 | "Sis Adası açığında Lanetli Amiral'in filosunu batır." | (−6000, −8400) | `boss lanetli_amiral` / `reconcile` | aşama 6 | `a7_amiral` | `give amiral_defteri` (lore: "Sis Pusula'nın nefesidir; ikizi olan ibre sisi yarar") |
| 7.6 | "Sis Adası'ndaki Zincir Taşı'nda üç zinciri Ruh Feneri'nin ışığında kır (gece)." | (−5268, −7850) | 3× `feat sis_adasi_hk_zincir<i>` (basılı 2,5 sn; Ruh Feneri yanık; gece) | `t_fener ∧ a7_amiral` | `a7_zincir`, `k7_*` | Her tutuşta 2 Zincirli Ruh; sonda Kasvet'in gölgesi → K7 |
| 7.7 | "Halil'e dön; Mira'nın akıbetini öğren." | (−6927, −6323) | `npc korsan_mezarligi_hk_halil` (gece) | `a7_zincir` | `a7_son` | Okuma metni; `advance(7)` |

**(d) Çevre bulmacası — gece, ışık ve zincirler.**
- **Mum ritüeli** (A): zaman kapısı (20:00–05:00, `sky.isNight()`), çevre koşulu (15 m'de canlı düşman yok: Hayalet Kaptan ve çağırdıkları önce yenilir), üç mum `feat`; mumlar `rt`'de, oyuncular 120 m uzaklaşırsa söner. "Gece olana kadar bekle" yalnız host.
- **Ruh Feneri** bir meşaledir (B): `toggleTorch` (player.js:122-126) `fener` ya da `ruh_feneri` ister; `_syncTorch` yeşil alev; ağ durumunda `torch` zaten var (player.js:990). Host konuğun ışığını `st.torch` + profilindeki eşyayla doğrular.
- **Zincirler:** her biri gece, Ruh Feneri yanıkken 2,5 sn basılı tutmayla kırılır; tutuş bırakılırsa ilerleme sıfırlanır; tutuş sürerken zincir başına 2 Zincirli Ruh doğar.

**(e) Düşman — Zincirli Ruh** (`zincirli_ruh`, B): hayalet tabanlı (`ghost 0x80ffd0`, `night:true`, `phase:false`), hp 90, dmg 18. **`lightBound`:** `applyDamage` başında hasarı veren oyuncunun 6 m içinde yanan Ruh Feneri yoksa `'blocked'` döner ve kıvılcım geri bildirimi gösterilir (bosses.js:109'daki gibi); ışığa giren ruh 0,6 sn sersemler. Öğretilen kural: "fenerini yak, sonra vur".

**(f) Boss ve özel karşılaşma.**
1. **Hayalet Kaptan** (mevcut insan boss, 1 000 can, %50 çağırma): ritüel bekçisi; ölmeden ritüel başlamaz. H-10 nedeniyle hamle saldırısı tetiklenmez; hikâye buna dayanmaz.
2. **Lanetli Amiral** (mevcut deniz bossu): yaylım uyarısı 1,6 sn (bosses.js:986), bordalama, güverte bossu; zayıf nokta top/patlama (`:932`).
3. **Zincir Taşı ayini** (B): üç zincir, her biri iki ruh dalgası, bölgenin gece grupları; son zincirde Kasvet'in gölgesi.

**(g) Karar K7** — [Affet, sessiz geçidi söylesin] [Ruhunu fenerde yak]. Sonuçlar §2.4.

**(h) Ödül.** Ruh Feneri (araç), kalıcı yanan fener (dünya değişikliği), Amiral'in defteri, Mira'nın mektubu, başarım **"Sisin Ötesi"** (`ach_sis`), K7 ödülü.

**(i) Geriye dönük ve sıra.** Amiral önceden yenildiyse 7.5 kapanır, defter doğrudan verilir. 7.4 ile 7.5 her sırayla; 7.6 ikisini ister.

---

### 3.3 Aşama 8 — "Buzların Altındaki Kraliçe" (`STORY[7]`, `buz`)

**(a) Bölge.** Buzul Denizi (kar, soğuk sis, sky.js:356, :376). Buz Krallığı = buzula gömülü Ayaz Krallığı'nın kalıntıları.

| Alan | Konum (Node) | Not |
|---|---|---|
| Kuzeyfener iskelesi | Ayaz **(293, −5056)**, h 2,0 | İskele başı (293, −5044) |
| **Ayaz Kulesi** (dağ zirvesi) | Buzdişi zirvesi **(−1456, −7316)**, h 89,3 (6 m'de 85,6–89,6); kıyıdan minimax eğim 12,5° | Buz tonlu yıkık kule (`kk:dungeon:wall_broken/wall_half`, tint 0xd8e4f0), yazıt (`kk:graveyard:plaque`) |
| **Ayaz Mağarası** (mağara + yeraltı gölü + su altı geçidi) | Giriş **(−1223, −7419)** arazi 11,9 / taban 9,5; oda **(−1180, −7437)** r 12 (halka tabanı +0,8; göl r 6,5 / −4; mabet çukuru r 2,4 / −9); kanal (−1105, −7469) denize | Tüp ve kubbe büyük ölçüde arazinin üstünde (tüp 1,4–3,9 m, kubbe tepesi 8,5 m); yarık yok; oyma ≤ 1,012·r, deniz kayalığı halkasının (1,12–1,52·r, islands.js:1064) dışında; 30 m içinde nesne yok (B, Ek A.4). Buz mavisi kubbe, `crystal.glb` buz tonu, iki `_lamp`, Yankı'daki gibi `sky.inCave` karanlığı ve `cave` müziği. |
| Derin Yarık | Boss sahası (1300, −8080) | Mevcut deniz bossu |

**(b) NPC.**

| NPC | Rol | Diyalog özeti | Model |
|---|---|---|---|
| Buzkıran **Ayaz** (`kuzeyfener_hk_ayaz`) | `story` | "Kraliçemiz Ayaz Ana denize gömüldüğünde buzlar onu Derin Yarık'ın yılanına dönüştürdü derler. Mira parçasını kraliçenin mabedine koydu. Zirvedeki kulede yolu gösteren yazıt var." K8'de taç ister. | Erkek, `body:'kaba'`, kürk renkli ceket (`#d8d0c0`), sakal, `age 0.55` |
| Kraliçe **Ayaz Ana**'nın ruhu (`buzdisi_hk_kralice`) | `story`, `ghost 0xbfe6ff`, `lantern` (yalnız Ruh Feneri ışığında) | "Mira bana bir parça emanet etti; mührüm gölümdedir, bedenim Derin Yarık'ta yüzer. Tacımı halkıma ver ya da al; seçim senin." | Kadın, `body:'kahin'`, pelerin |

**(c) Görev zinciri**

| No | Hedef | Yer | Tetik | Önkoşul | Bayrak | Etki |
|---|---|---|---|---|---|---|
| 8.1 | "Kuzeyfener iskelesinde Buzkıran Ayaz ile konuş." | (293, −5056) | `npc kuzeyfener_hk_ayaz` | aşama 7 | `a8_ayaz` | — |
| 8.2 | "Buzdişi'nin zirvesindeki Ayaz Kulesi'nde buz yazıtını oku." | (−1456, −7316) | `feat buzdisi_hk_yazit` | `a8_ayaz` | `a8_zirve` | Sis 1 200 m açılır; mağara POI'si; ayna ipucu |
| 8.3 | "Ayaz Mağarası'nda Ruh Feneri'ni kaideye tut, buz aynalarıyla ışığı Kraliçe Kristali'ne düşür." | Oda | `feat buzdisi_hk_kaide` (Ruh Feneri), 3× `feat buzdisi_hk_ayna<i>` (45° döndür) | `a8_zirve` (mağara her zaman girilebilir) | `a8_ayna` | Göl çukurunun buz mührü kalkar; Kraliçe'nin ruhu görünür |
| 8.4 | "Kraliçe'nin ruhuyla konuş, gölün dibindeki mührü al." | Çukur −9 m | `npc buzdisi_hk_kralice` → `feat buzdisi_hk_muhur` (kip `swim`, ≤ 3 m) | `a8_ayna` | `a8_muhur` | `give kralice_muhru`; Yılan önceden yenildiyse burada `give harita_parcasi {piece:4}` |
| 8.5 | "Derin Yarık'ta Buzların Altındaki Kraliçe'yi yen." | (1300, −8080) | `boss derinlik_yilani` / `reconcile` | aşama 7 | `a8_yilan`, `parca4` | `give harita_parcasi {piece:4}` (verilmediyse) |
| 8.6 | "Kuzeyfener'e dön, Ayaz Tacı'na karar ver." | (293, −5056) | `npc kuzeyfener_hk_ayaz` → K8 | `a8_muhur ∧ a8_yilan` | `k8_*`, `a8_son` | `advance(8)` |

**(d) Çevre bulmacası — buz aynaları** (B).
- Oda halkasında üç ayna (M1–M3), tünel ağzında kaide (L), gölün öbür yanında duvarda Kraliçe Kristali (T). Her ayna 45° adımlarla 4 yönde döner; 64 düzenden **tek biri** ışığı T'ye ulaştırır (Node K12).
- Işık kaynağı oyuncunun **Ruh Feneri**'dir: kaideye tutulunca (`feat`) kaide yeşil yanar; 7. aşamanın ödülü burada işe yarar. Kaynak yoksa ışın yoktur.
- Görsel: ışın parçaları ince, toplamalı karışımlı silindirler; her döndürmede yeniden kurulur (en çok 6 parça). Çözümde buz mührü (`addPlatform(..., top −4.5, sides:false)` + buz diski) kaldırılır; platform yüzücüyü yukarıdan durdurur (physics.js:87-98), mühür yalnız yukarıdan kapatır.
- İpucu yazıtı (8.2): "Ayaz'ın üç gözü: biri doğan güne, biri kuzey yıldızına, biri göle bakar."
- **Su altı geçidi:** odanın deniz tarafındaki kubbe kenarı su yüzünün 1,5 m altına inen bir buz perdesidir (duvar çarpıştırıcıları o yayda `y0 = −1,5`'ten başlar). Kanaldan perdenin altından dalarak göle gizli bir giriş vardır; bulmacayı atlatmaz (mabet çukuru aynalara bağlı). Kanal ağzında batık sandık (`_chest mid`, `buzdisi_hk_kanal_sandik`).
- Göl durgun su bölgesidir (okyanus bölge yuvası 1, `calm 0.1`; §5.1 M17).

**(e) Düşman** (B).
- **Buz İskeleti** (`iskelet_buz`): `base:'sk_warrior'`, buz tonu, hp 140, `rise:0.2`, **`slowHit:2.0`** — Boğulmuş Denizci'nin yavaşlatması (enemies.js:1005) genelleştirilir ve **yalnız gerçek isabette** uygulanır (H-05 bu kod yolunda düzelir). Ağır vuruş ve ateşe ×1,5 ("kırılgan buz", A).
- **Buz Kâhini** (`buz_kahini`): `base:'sk_mage'` (kk.js:9, bugün kullanılmıyor), `RANGED.buz = { ...RANGED.ghost, proj:'icebolt', homing:0 }`, isabette `slowT 1.5`; güdümsüz olduğu için H-07 taşınmaz.
- Mağarada 2 iskelet + 1 kâhin (`cond`: 8.3 etkin). Buzdişi'nin mevcut grupları değişmez.

**(f) Boss ve özel karşılaşma.** **Derinlik Yılanı** (mevcut; lineup, toslama, tükürük, dalış; zayıf nokta sersemken/tükürürken ×2, bosses.js:428-431). Mühür alınınca "Derin Yarık'ta bir şey uyandı" bildirimi; tetik değişmez (240 m, gemide). Özel karşılaşma: ayna bulmacası sırasında iki Buz İskeleti dalgası.

**(g) Karar K8** — [Tacı Ayaz'a ver] [Tacı kendine al]. Sonuçlar §2.4.

**(h) Ödül.** Parça 4/4, Kraliçe'nin Mührü (anlatı; finalde Buz yuvası), zirve manzara noktası, mağara POI'si ve kanal sandığı, başarım **"Buzların Altında"** (`ach_buz`), K8 sonucu.

**(i) Geriye dönük ve sıra.** Yılan önceden yenildiyse 8.5 kapanır, parça 8.4'te verilir. 8.4 ile 8.5 her sırayla; 8.6 ikisini ister.

---

### 3.4 Aşama 9 — "Gelgit İbresi" (`STORY[8]`, `ibre`)

**(a) Bölge.** Kızıl Kum Kıyıları (`col`; rüzgârlı toz, sky.js:358, :383). Arazi oyması yalnız Derin Galeri'de. **Önkoşul:** Faz 4 D-01 (`tryClaim`) uygulanmış olmalı.

| Alan | Konum (Node) | Not |
|---|---|---|
| Kumsaati | Nur **(−5121, 717)**, h 2,8 | Liman düzlüğü |
| **Zindan Kulesi** (kule) | Demirkapı hapishane merkezi (−6653, 2548) → ada merkezine doğru 43,8 m: **(−6684, 2517)**, h 19,8 | Köşe kuleleri 37,5 m'de ve avlu yönü `R()`'ye bağlı (islands.js:934): 44 m her yönde dışarıda. `kk:town:tower_base_red` (s 5) + iki `wall_gated` hücre (Yadigâr; K6=teslim ise Selim) + arka yüzde iskele (`kk:town:scaffolding`) ve üst pencereye merdiven platformları (K6=af yolu). |
| Gümüş Madeni | Cephe (−7552, −1549), ağız (−7546, −1566) | Kemer önüne hikâye fıçısı (`gumus_madeni_hk_fici`) + `wall` hazard'ı (`gumus_madeni_hk_duvar`) |
| **Derin Galeri** (gizli maden) | Tüp ağızdan içeri 38 m (taban 10,2 → 9,0, eğim ≤ 2,5°), oda **(−7529, −1615)** r 14, taban 9 | Yarık derinliği 5,9–10,9 m, oda çukuru 5–17 m; oyma ≤ 0,443·r (B, Ek A.4). Yarık kenarlarına iskele ve çarpıştırıcılı çit: "açık ocak yarması". Sabit konumlu basınç plakası + kafes. Ay Gümüşü damarı. |
| **Güneş Örsü** | Kızıl Kanyon harabesinden 18,4 m: **(−5124, 3947)**, h 10,2 | Harabe zarfı ≈ 16 m (islands.js:716-735); plaka adayı değil (`%10 = 7`). `obelisk.glb` (gölge çubuğu) + kaya örs + `kk:dungeon:column` halkası. |

**(b) NPC.**

| NPC | Rol | Diyalog özeti | Model |
|---|---|---|---|
| Kervanbaşı **Nur** (`kumsaati_hk_nur`) | `story` | "Kervanlar Demirkapı'da kırk yıldır yatan bir ihtiyardan söz eder: Mira'nın seyir ustası. İkiz ibreyi yalnız o dövebilir." | Kadın, `body:'cevik'`, sarık (`hat:'bandana'`, `#c08040`) |
| Seyir Ustası **Yadigâr** (`demirkapi_hk_yadigar`; kurtarılınca `kumsaati_hk_yadigar`, ayinde `kizil_kanyon_hk_yadigar`) | `story` | "Pusula'nın ikizini Ay Gümüşü'nden dövmeliyim; madenciler onu Gümüş'ün derin galerisine gömdü. Girişi barutla aç. Sonra Güneş Örsü'nde, gün ortasında, ayin bitene dek beni koru." | Erkek, `body:'kahin'`, `age 0.95` |
| Kor Selim (K6'ya göre) | `story` | K6=af: kulenin arkasında, "Buradan gir, kimse görmez." K6=teslim: yan hücrede, "Beni çıkar, kodu söyleyeyim." | — |

**(c) Görev zinciri**

| No | Hedef | Yer | Tetik | Önkoşul | Bayrak | Etki |
|---|---|---|---|---|---|---|
| 9.1 | "Kumsaati'nde Kervanbaşı Nur'u bul." | (−5121, 717) | `npc kumsaati_hk_nur` | aşama 8 | `a9_nur` | Zindan POI'si |
| 9.2 | "Demirkapı'nın Zindan Kulesi'nden Seyir Ustası Yadigâr'ı çıkar." | (−6684, 2517) | `feat demirkapi_hk_hucre` (basılı 2,5 sn; host: alarmsız yol ya da avlu grubunda canlı gardiyan yok; `worldState.tryClaim`) | `a9_nur` | `a9_yadigar` | Yadigâr Kumsaati'ne geçer |
| 9.3 | "Gümüş Madeni'nin mühürlü galerisini barutla aç." | (−7546, −1566) | `hazard gumus_madeni_hk_fici` patlaması → `wall gumus_madeni_hk_duvar` kırılır | `a9_yadigar` | `a9_maden` | `_mine` kemer çarpıştırıcısı `y1 = −999`, karanlık düzlem gizlenir (tapınak kapısı kalıbı, islands.js:815); `hazards.gone` |
| 9.4 | "Derin Galeri'de Madenbaşı Gümüşdiş'i yen, kafesi plakayla indir, Ay Gümüşü'nü al." | Oda | Bölge (oda r 14) → `spawnBoss('madenbasi')`; `hazard solve gumus_madeni_hk_plaka`; damarda Madenbaşı'nın ruhu → K9 | `a9_maden` | `a9_gumus`, `k9_*` | `give ay_gumusu`; kafes sandığı (orta ganimet) |
| 9.5 | "Güneş Örsü'nde gün ortasında (11:00–13:30) dövme ayini bitene dek Yadigâr'ı koru." | (−5124, 3947) | `feat kizil_kanyon_hk_ors` + `sky.hour ∈ [11, 13.5]`; ayin 90 sn, örse 6 m'den yakın canlı düşman varken sayaç durur | `a9_gumus` | `t_ibre` | `give gelgit_ibresi`; `advance(9)` |

**(d) Çevre bulmacaları.**
- **Zindan, K6'ya bağlı iki yol** (A): K6=af → Selim'in iskele yolu üst pencereden hücre koridoruna çıkar, avlu grubu fark etmez. K6=teslim → Selim yan hücrede: önce onun kilidi kırılırsa (`feat demirkapi_hk_selim`) kodu söyler ve Yadigâr'ın hücresi alarmsız açılır; kırılmazsa Yadigâr'ın kilidi kırılırken bağırır: avlu grubu `awareness = 1` ve Gardiyanbaşı (mevcut `haydut_kaptani`; yardım çağırma, parry, ölünce tayfa %55 kaçar, enemies.js:1369-1377) gelir. Ödül bir kez (D-01 `tryClaim`, G-01 sömürüsü yok).
- **Barut ve çatlak duvar** (B): `wall` bir `combat` hedefidir, yalnız `info.kind === 'explosion'` ile kırılır (hazards.js:226-235 hedef döngüsü patlama hasarını zaten veriyor). Oyuncu fitili ateşleyip kaçar. Kırılan duvar `hazards.gone`'a yazılır.
- **Basınç plakası** (B): yeni `_puzzleAt(S, id, C, P, B0, yaw)` rastgele yer araması yapmaz, odada sabit konumlara kurar; sandık içeriği tablo yerine `ay_gumusu` erişimi + orta ganimet.
- **Öğle penceresi:** mevcut `ogle` günlük olayıyla (time.js:16) tutarlı; dikilitaşın gölgesi saat 12'de "gelgit" yazıtının üstüne düşer. Pencere dışında "Öğleyi bekle" (host).

**(e) Düşman.**
- **Kum Hayaleti** (`kum_hayaleti`, `iskelet_nisanci`/`sk_rogue` türevi, kum tint 0xe0c090) — A/B'deki aynı mekanik: **`burrow`**: `buried` durumunda model gizli, çarpıştırıcı yok; oyuncu 7 m'ye girince 0,8 sn kum püskürmesi uyarısı (`effects.dirt` halkası) ve `SpawnGround` kalkışı (enemies.js:258, `opts.rise`); 8 sn hedefsiz kalırsa yeniden gömülür. Kanyon yolunda ve örs ayininde.
- **Madenci İskelet** (`iskelet_madenci`): `base:'sk_minion'`, `kk:weapons:Skeleton_Axe`, elinde `kk:graveyard:lantern_hanging`, hp 100, **`rise:0.5`** ("lanetli ocak", B).

**(f) Boss ve özel karşılaşma.**
1. **Madenbaşı Gümüşdiş** (`madenbasi`, A; yeni insan/iskelet bossu): `base:'sk_mage'`, `kk:weapons:Skeleton_Staff`, hp 1 100, dmg 30. Evre 1: asa vuruşu + kaya atışı (`lob{kind:'boulder'}`; B'nin `cavein` kalıbı: oyuncunun 12 m üstünden, iniş halkası). %66: 3 Madenci İskelet çağırır. %40: **Karanlık** — host `storyFx{k:'karanlik', t:12}`: bütün oyuncuların meşalesi söner (Ruh Feneri sönmez), havuz lambaları kapanır; **zayıf nokta**: fenerini yeniden yakarken 2 sn (`Spellcast_Raise`) ×2. %15: öfke ×1,3. Uyarılar: "Madenbaşı feneri söndürüyor!", mavi parıltı, yer halkaları.
2. **Örs savunması** (A): 90 sn ayin, 3 dalga × 3 Kum Hayaleti; örse 6 m'den yakın canlı düşman varken sayaç durur (başarısızlık yok); kum fırtınası atmosfer bölgesiyle (hava durumu değişmez).
3. (Alarm yolunda) **Gardiyanbaşı** (mevcut mini boss).

**(g) Karar K9** — Damarın başında Madenbaşı'nın ruhu: [Kalbini sök] [Ruhunu serbest bırak]. Sonuçlar §2.4.

**(h) Ödül.** **Gelgit İbresi** (araç), galeri sandıkları (2× `_chest mid`), Madenbaşı XP'si, başarım **"İbrenin Ustası"** (`ach_ibre`), K9 sonucu.

**(i) Sıra.** 9.2 → 9.3 sırayla (Yadigâr anlatır); 9.4'te plaka ile boss her sırayla.

---

### 3.5 Aşama 10 — "Yitik Ufuk" (`STORY[9]`, `ufuk`)

**(a) Bölge kimlik kartları.**

| Alan | Konum (Node) | Kimlik |
|---|---|---|
| Kırlangıç Hanı | Tuzla (port.js:323) | İtiraf; dört parça masada birleşir |
| Meyhane bahçesi (Korsan Kasabası) | Kazı noktası **`korsan_kasabasi_hk_defter` (−1796, 1448)**, h 7,1; kasaba merkezine 44,6 m (bina zarfı ≤ 40 m) | Mira'nın seyir defteri (hikâye kazı noktası, rastgele harita havuzunda yok) |
| **Kadim Tapınak — Sunak Katı ve Gözlem Katı** (tapınak katları) | Tapınak (1900, 7400), y0 50,1; sunak platformu (1900, 7388), üst y0+8,0 | **G-03 düzeltmesi:** merdiven boyunca 14 basamak × ≤ 0,58 m (`addPlatform(..., false)` + alt kutu). Sunağın üstünde **Gözlem Katı** (y0+14): 10 basamak + 6×6 platform, 4 `pillar_decorated` taşıyıcı, 4 yıldız yuvası. |
| **Ufuk Feneri** (Fener Kayası) | (−1243, −1950), zemin 12,8; lamba y ≈ 31,8 | Kulenin dışında sarmal merdiven (r 3,6, ≈ 40 basamak × 0,5 m, 1,6 tur), galeri platformu. Gece **Ufuk Işını**: lambadan sis kapısına (−560, −2070) 693 m'lik sabit ışın. |
| **Ölü Sis** | Merkez (300, −2100); duvar r 480–760; kapı (−560, −2070); koridor (−560, −2070) → P2 (−250, −2090) → (40, −2105) | Dışarıdan: 160 m yüksekliğinde dönen gri sis duvarı (aşama ≥ 5'te içinde şimşek). Yaklaşınca akıntı gemiyi geri iter. İçeride (r < 480): **göz** — altın renkli durgun ışık, sessizlik. |
| **Yitik Ufuk** (yeni ada) | (300, −2100), r 260, **`kaldera`** biçimi, h 34, biyom `hayalet`, `hidden:true` | Bazalt sırtların çevrelediği lagün (taban −6 … −2,2), iç uçurum 80,8°, dış yamaç ≤ 67° (yürünmez), batı **Fırtına Boğazı** eyeri 38° (iniş; (40, −2100) h −0,1 → (100, −2100) h 7,5). Kuzey sırtta **Mira'nın Son Kampı** (300, −2282) h 26,5; doğu sırtta **Gelgit Sunağı** (482, −2100) h 27,2; güney dış resifte **Veyl Filosu** (3 karaya oturmuş gövde) ve **Gelgit Kızı batığı (495, −1762), −9,3 m** (8 m'de 1,6 m fark); lagün ortasında **Mira'nın Mahzeni** (40×40 m basamaklı yapı: T0 −6 taban ve mühürlü kapı, T1 −3, T2 0, T3 +3, T4 +6 taht). |
| Batık Şehir (isteğe bağlı) | (3300, 5760), −11 m | Mavi Kırıklar kral mezarı: merkezden 25 m'de üç sütun |

Yitik Ufuk'un tam kimlik kartı: siluet nal biçimli kayalık, batıda alçak eyer, ortada lagünden yükselen taş basamaklar; bitki örtüsü hayalet tablosu + "göz"de altın tonlu ölü palmiyeler ve mor kristaller; düşman grubu Veyl tayfası (`hayalet`, `hayalet_nisanci`, sis içinde gündüz de); gizli alan Gelgit Kızı'nın kaptan köşkü; özel keşif "Ufkun Gözü" (taht tepesinden 360° sis duvarı); atmosfer göz bölgesi (sis rengi 0xf2d8a0, düşük yoğunluk, deniz durgun, martı yok, uzak çan), finalde fırtına bulutu.

**(b) NPC.**

| NPC | Rol | Diyalog özeti | Model |
|---|---|---|---|
| Tuzla (mevcut, `quest`) | İtiraf | "Ben Gelgit Kızı'nın miçosuydum. Sis kalkarken Mira beni bir filikaya koydu: 'Biri haritayı tamamlarsa ona yol göster.' Altmış yıldır bekliyorum. Yıldızların sırası Mira'nın seyir defterindeydi; defteri eski korsan kasabasındaki meyhanenin bahçesine gömdüm." | mevcut |
| **Mira Veyl**'in ruhu (`yitik_ufuk_hk_mira`) | Mahzen'de bağlı; Gölge yenilince serbest; K10=pusula ise sunakta kalıcı | "Altmış yıl… Gölgeyi sen mi yendin? O zaman Pusula'nın kime ait olduğunu sen seç." | Kadın, kaptan şapkası ve uzun ceket (`#1a2a4a`), pelerin, gümüş saç, `age 0.35`, `ghost 0x9fe0ff`; `y` ve `minY:-50` |

**(c) Görev zinciri** (final ayrıntısı §4)

| No | Hedef | Yer | Tetik | Önkoşul | Bayrak | Etki |
|---|---|---|---|---|---|---|
| 10.1 | "Kırlangıç Hanı'nda Tuzla'ya dört parçayı göster." | Tuzla | `npc tuzla` | aşama 9, `parca1..4` | `a10_tuzla` | İtiraf (okuma); `give mira_haritasi`; `G.storySites += korsan_kasabasi_hk_defter` |
| 10.2 | "Yıkık Korsan Kasabası'nda eski meyhanenin bahçesinde Mira'nın seyir defterini kaz." | (−1796, 1448) | `dig` (`treasureFound`) | `a10_tuzla` | `a10_defter` | Küçük sandık + `give mira_seyir_defteri` (yıldız sırası, Mira'nın son satırları) |
| 10.3 | "Kadim Tapınak'ın Gözlem Katı'nda, gece, dört parçayı defterdeki yıldız sırasıyla yerleştir." | (1900, 7388), +14 m | 4× `feat kadim_tapinak_hk_yildiz<i>` (sıra, gece; yanlışta sıfırlanır) | `a10_defter`, `templeState.done` | `a10_gozlem` | `give gelgit_mercegi`; harita Yitik Ufuk'u Ölü Sis'in içinde gösterir; gizli ada açılır (M15) |
| 10.4 | "Fener Kayası'nın dış merdiveninden lambaya çık, merceği gece takıp Ufuk Işını'nı yak." | (−1243, −1950), y ≈ 31,8 | `feat fener_kayasi_hk_lamba` + gece (K7=af: gündüz de) | `a10_gozlem`, `t_fener` | `a10_isin` | Işın sis kapısına döner; koridor görünür |
| 10.5 | "Işını ve İbre'yi izleyerek Ölü Sis'i geç." | Koridor | Host: gemi koridorda (`channelDist ≤ w/2`); ilk geçişte P2'de Kraken (canlıysa, zorunlu); iniş batı eyerinde | `a10_isin`, `t_ibre` | `a10_sis` | Okuma metni; Veyl tayfası grupları açılır |
| 10.6 | "Gelgit Kızı batığının kaptan köşkünden Mira'nın Mührü'nü al." | (495, −1762), −9,3 m | `feat yitik_ufuk_hk_kizi_muhur` (kip `swim`, ≤ 3 m) | `a10_sis` | `a10_muhur` | `give mira_muhru`; Mira'nın Son Kampı'nda son mektup (isteğe bağlı, kamp sandığı) |
| 10.7 | "Gelgit Sunağı'nda İbre'yi çağır." | (482, −2100) | `feat yitik_ufuk_hk_sunak` (`t_ibre`, `mira_haritasi`, ≤ 3 m) | `a10_muhur` | `a10_cezir` | **Büyük Cezir**: lagün 25 sn'de boşalır (§4.1) |
| 10.8 | "Dört bekçi yuvasını parçalarla yak, Mahzen'i Mira'nın Mührü ile aç, Gelgit'in Gölgesi'ni yen." | Lagün, T1/T0 | 4× `feat yitik_ufuk_hk_yuva<i>` → `feat yitik_ufuk_hk_mahzen` → final | `a10_cezir`, `rt.cezir ≥ 0,95` | `a10_golge` | §4.2–4.3 |
| 10.9 | "Mira'ya Pusula'yı ver ya da al; Son Hazine'yi aç." | Mahzen | K10 (host) → `feat yitik_ufuk_hk_sandik` (basılı 3 sn) | `a10_golge` | `k10_*`, `hikayeBitti` | §4.4–4.5; `advance(10)` |
| 10.x (ops.) | "Batık Şehir'de Mavi Kırıklar'ın kral mezarını uyandır." | (3300, 5760) | 3× `feat batik_sehir_hk_sutun<i>` (kip `swim`, sıra: hilal–yarım–dolunay) | aşama 9 | — (`islands.opened`) | Kral mezarı sandığı: `mavi_kiriklar_muhru` + Pusula'nın tarihi (lore) |

**(d) Bulmacalar.** Tapınak kolu (mevcut, Faz 2 `templeOrder`), yıldız yuvaları (sıra motoru, gece; sıra defterde yazar: "Ölü Yıldız, Kızıl Yıldız, Akşam Yıldızı, Kutup Yıldızı" = Kemik → Kızıl → Kor → Buz; sabit, LOD'dan bağımsız; gündüz "Yıldızlar görünmüyor; geceyi bekle"), mercek + ışın, sis koridoru (İbre), Gelgit Kızı dalışı (iki oda, güvertedeki delikten giriş, tavan sınırı, hava kabarcığı; nefes tabanı 50 sn, maske ×1,6, K8=ver ×1,5), bekçi yuvaları, sunak.

**Ölü Sis kuralı** (`kernel.sisAllowed(state, pos, ctx)`, saf; A + B):
- Halka: `r0 = 480` (göz sınırı), `r1 = 760` (dış duvar). `a10_isin` yoksa gemi/kayık/yüzücü `r0`'ın içine giremez: radyal olarak `r0 + 2`'ye itilir, hız yarıya iner, `sis` olayı ve bildirim ("Akıntı seni geri itiyor") çıkar. Dış bant (480–760) geçilebilir (kuzey rotasını kesmez).
- `a10_isin` sonrası yalnız koridor içinde (`channelDist ≤ w/2`; K9: kalp 60 m, arın 35 m) girilebilir. `a10_sis` sonrası (ilk geçiş) koridor kalıcı açık; K10=mira sonrası engel ve sis tamamen kalkar.
- Kancalar: ship.js'deki dünya kenarı kalıbının hemen ardı (ship.js:373-379; `Ship` sınıfında olduğu için düşman ve tüccar gemileri de uyar), kayık (ship.js:810-811), yüzücü (player.js:760-765). Co-op: Faz 2 `moveAuth`'a "yasak bölge" kuralı; konukta aynı saf fonksiyon yerel olarak da çalışır.
- Düşman gemisi doğuşu (events.js:251-256) `r1` içine düşmez (bir satırlık ret).

**(e) Düşman.** Veyl tayfası: mevcut hayalet türleri; sis içinde gündüz kaybolmaz (grup bayrağı **`allDay`**: enemies.js:637-641'deki gündüz kaybolma koşulu atlanır). Boğulmuş Denizci finalde sudan çıkar. Yeni tür yalnız final bossu.

**(f) Boss ve özel karşılaşmalar.**
- **Taş Muhafız** (Gözlem Katı bekçisi): mevcut tetik aynen (tapınak çözülmüş + avlunun 26 m'si + |Δy| < 8). Önceden yenildiyse kat boştur. Gözlem Katı y0+14'te olduğundan tetik avluda, tırmanıştan önce çalışır.
- **Kraken** (sis kapısı bekçisi): host, ilk geçişte gemi P2'ye 240 m yaklaşınca `bosses.spawn('kraken', {id:'kraken', x:-250, z:-2090})`; Kraken gemiye 40 m'de doğar (bosses.js:150; P2 açık deniz, −30 m, H-25'ten uzak). %60 mürekkep + kavrama, %30 girdap; kesilen dokunaçtan sonra 6 sn göz ×2. H-01 (kılıçla dokunaç zor) nedeniyle toplar ve K6=af **Kor Bombası** (dokunaca ×2). Konukta Kraken'in yeri önemsizdir (gemiye göre doğar), `applySnapshot` sorunu yok.
- **Büyük Cezir** ve **Gelgit'in Gölgesi**: §4.

**(g) Karar K10** — §4.5. **(h) Ödül** — §4.4–4.6.

---

## 4. Final

### 4.1 Büyük Cezir (lagünün boşaltılması) — A

- **Mekanik:** okyanus bölge yuvası 0 Yitik Ufuk lagününe ayrılır: `{x:300, z:-2100, r0:150, r1:175, calm:0.12, drop:0}`. Sunak etkinleşince host `drop`'u 25 sn'de 0 → 9 m'ye çıkarır (`rt.cezir` 0 → 1). `ocean.levelAt(x, z) = tide − Σ drop·smoothstep(r1, r0, d)`; `heightAt` = dalga·s·calm + `levelAt` (ocean.js:43-51); köşe gölgelendiricisi (ocean.js:136-149) aynı formülü `uZone[4]`/`uZoneP[4]` ile uygular.
- **Görünmeyen geçiş bandı:** `kaldera` profilinde iç uçurum d 0,50–0,58, sırt 0,58–0,80; 150–175 m'lik bant uçurumun üst yarısıyla sırtın altında kalır. Node (Ek A.7): boşaltılmış su yüzeyi 360 açının hepsinde arazinin altında; en küçük pay 6,32 m; geçiş bandında en alçak arazi +7,5 m (batı eyeri). Görüntü "lagün boşaldı"dır.
- **Fizik ve tüketiciler (hakem A-8):** oyuncu kipi, kamera su altı algısı (game.js:382-385), cisimler (bodies.js:118) `heightAt`'i okur; boşalan tabanda oyuncu `ground` kipine geçer (player.js:796-800). `ocean.tide`'ı doğrudan okuyan beş yer `ocean.levelAt(x, z)`'ye geçer: treasure.js:190 (gelgit kazısı), treasure.js:307 (sandık su durumu), weatherfx.js:279 (yağmur sıçraması), details.js:404, ocean.js:35 (`shoreFactor` derinliği). Arazi gölgelendiricisinin `uTide`'ı değişmez: boşalan taban ıslak deniz tabanı gibi görünür (istenen). Balık ve köpekbalığı doğuşu bölge 0'ı dışlar. Lagünde gemi yoktur (kapalı halka).
- **Co-op:** `rt.cezir` host'ta; `storyFx{k:'cezir', v}` 4 Hz yalnız değişirken; konuk `game.frameClock`'a göre yumuşatır (Faz 3 §5). Fark ≤ 0,2 m.
- **Kayıt:** `rt.cezir` kaydedilmez; düzey bayraklardan türetilir: `a10_golge ∧ ¬hikayeBitti ⇒ 1` (boş), aksi hâlde yüklemede 0 (dolu). `a10_cezir` varsa sunak yeniden kullanılabilir (bekleme 1 oyun saati).

### 4.2 Bekçi yuvaları ve Mahzen — B + A

- Lagün boşalınca T1 terasında (−3) Mahzen'in dört yüzünde dört **bekçi yuvası** açığa çıkar: Kemik (`parca1`), Kızıl (`kizilYenildi`), Kor (`parca3`), Buz (`parca4`). Her yuva `feat` ile yanar (`featSt`); parçalar **tüketilmez** (co-op'ta herkesin kopyası var). Lagün doluyken yuvalar su altındadır: sıra kendiliğinden sunak → yuvalar olur.
- Dört yuva yanınca T0'daki mühürlü kapıya **Mira'nın Mührü** takılır (`feat yitik_ufuk_hk_mahzen`): kapı tapınak kapısı kalıbıyla iner (`wall_gated`, `gateCol.y1 = −999`, islands.js:804-818); durum `islands.opened`'a.
- **Mahzen içi** (kit odası 10×12, taban −6, tavanı T1/T2 platformları; kamera `slabBlocked` ile içeride kalır): Pusula kaidesi (prosedürel: altın halka + dönen ibre + mavi öz ışık), su zincirleriyle bağlı Mira'nın ruhu (yarı saydam silindirler), sikke yığınları (`kk:dungeon:coin_stack_large/medium`), raflar (`shelves`, `sword_shield_gold`, `kk:furniture:book_set`), ortada Mira Veyl'in Sandığı (statik, §4.4). Mahzen ışığı havuzdan iki `_lamp`.
- Kapı açılınca Pusula'dan **Gelgit'in Gölgesi** çıkar, oyuncuları kapıdan tabana fırlatır ("Gölge seni mahzenden fırlattı!"; itme `knock`) → dövüş açık tabanda ve teraslarda.

### 4.3 Final karşılaşması: Gelgit'in Gölgesi — A (+ B'nin evre etkileri)

**Arena:** lagün tabanı T0 (−6) ve teraslar T1 −3, T2 0, T3 +3, T4 +6; her teras `addPlatform` (+ kısa yan kutular) ve geniş merdivenlerle (`kk:dungeon:stairs_wide`) bağlıdır; Mira'nın mavi sancakları (`kk:dungeon:banner_blue`), mavi-yeşil tint 0x90b8b0.

**Boss:** `ENEMY_TYPES.gelgit_golgesi` — insan boss çatısı (evre mekanizması enemies.js:427-444; 05_dusman_ai ile sınanmış), `bosses.js`'e yeni sınıf eklenmez (hakem B-3). Mira görünümlü hayalet (`ghost 0x2060ff`, `scale 1.35`, `kk:2H_Sword`), `faction:'hayalet'`, `moves:'twoh'`, `spin:true`, `parry:0.25`, hp 1 600 (co-op ölçeği 1 + 0,35·konuk, enemies.js:222), dmg 34, `fov:360`, `summonAt:[0.7, 0.4]`, `enrageAt:0.15`, `phase:true` (yalnız saldırı aralarında), `noLoot` (ödül Son Hazine), `homeR 22`. DASH kullanılmaz (H-10). Doğuş `enemies.spawnBoss` (host).

| Evre | Can | Olay | Uyarı | Zayıf nokta |
|---|---|---|---|---|
| 1 | 100–70 | Düello: 2H vuruşlar, savuşturulamaz dönen saldırı | Kırmızı halka (`_telegraph`, enemies.js:928; konukta Faz 5 `tel`) | Savuşturma sonrası sersem ×1,25 |
| 2 | 70–40 | "Deniz geri dönüyor!": `rt.cezir` 1 → 0,6 (su −9 → −5,4; tabanda 0,6 m su, kip `ground` korunur); 3 Boğulmuş Denizci + 1 Hayalet Nişancı sudan çıkar (K7=yak: canları ×0,5) | `ntf` + HUD su çubuğu | **Gelgit Çağrısı** sırasında (2,2 sn mavi parıltı) ×2 |
| 3 | 40–15 | Üç **Gelgit Taşı** T1, T2, T3'te yükselir; taşlar dururken Gölge ×0,2 (Taş Muhafız rün sütunu kalıbı, bosses.js:660-681; taşlar `combat.addTarget`, 300 can, `featSt` ile eşitlenir); su −2'ye yükselir (taban 4 m su → oyuncu teraslara çıkar; yüzerken kılıç yok, combat.js:99). K8=ver nefes ×1,5 burada belirgin avantaj. | "Taşları kır!" | Taşlar kırılınca ×1 |
| 4 | 15–0 | Öfke ×1,3; **dalga halkası** (7,5 m, zıplanarak kaçılır; bosses.js:730 kalıbı) | Mavi halka genişler | — |

- Gölge hayalet olduğu için su üstünde süzülür ve yüzen oyuncuyu kovalar (mevcut hayalet davranışı) → final dikeydir.
- **Başarısızlık:** bütün oyuncular yaralı/ölü ya da 6 dk dolarsa su tamamen geri gelir (`cezir` → 0), Gölge Pusula'ya çekilir ve canı yenilenir; sunak 1 oyun saati sonra yeniden çağrılır (host "bekle"). Ölüm cezası normal kural.
- **Co-op:** boss düşman anlık görüntüsüyle (Faz 5 `snap.e` + `ent`), telgraflar Faz 5 `tel` ile (≤ 80 m), su düzeyi ve evre `storyFx`, taşlar `featSt` ile gider. **Host devri** (Faz 5 §6): `story.rt` replikanın geçici durumuna girer; devirde boss canı korunur, evre zamanlayıcıları baştan başlar, su düzeyi `rt.cezir`'den sürer.

### 4.4 Son Hazine'nin açılması — B + A

1. Gölge ölünce `enemyKilled{type:'gelgit_golgesi'}` → `a10_golge`; herkese bildirim ve günlük kaydı. Su boşaltılmış kalır (§4.1 kayıt kuralı).
2. Mira'nın ruhu zincirlerinden kurtulur, kaideden doğrulur; K10 penceresi (host, §4.5).
3. **Mira Veyl'in Sandığı statik bir hikâye nesnesidir** (`yitik_ufuk_hk_sandik`; `CHEST_TIERS.legend` görünümü ve tinti, treasure.js:268-272; fiziksel `treasure.spawnChest` değil, hakem A-8). Basılı 3 sn → host:
   - **Kişi başı pay** (B): o an adada (Ölü Sis'in gözünde) bulunan **her oyuncuya bir kez**: 2 500 altın, `kraliyet_taci` ×1, `elmas` ×3, `altin_heykelcik` ×2, `antik_vazo` ×1 ve benzersiz `son_hazine_nisani`. Co-op'ta Faz 2 profil işlemleri, işlem kimliği `story:son_hazine:<pid>` (idempotent); çanta taşarsa kese (`keep`, Faz 4 D-14).
   - **Sandığın kendi içeriği** (A): `mavi_kiriklar_muhru` (2 000 değer; kral mezarı yapıldıysa ikincisi verilmez, yerine 1 000 altın) ve `mira_sapkasi` (kozmetik kilidi, Faz 4 `misc.cosmetics`). Açana gider.
   - Sandık satılamaz ve taşınamaz; epilogda boş sandık Kırlangıç Hanı'nın önüne hatıra olarak konur.
4. K10=pusula ise `gelgit_pusulasi` K10 seçiminde verilir; K10=mira ise Pusula Mira'yla birlikte kaybolur.

### 4.5 K10 ve kapanış — A (metin) + B (akış)

**Karar penceresi (host):** Mira: "Pusula'yı bana ver, gölgeyi yanımda götüreyim; sis kalkar, ben de giderim. Ya da onu sen al; ben burada kalır, gölgeyi beklerim." [Pusula'yı Mira'ya ver] [Pusula'yı al]. Konuk "Kaptan karar veriyor…" görür.

**Kapanış sahnesi** (`story.epilog`, B):
1. `sleep-fade` öğesi (main.js:279-280) "Son Hazine" başlığıyla açılır.
2. 6 sn sinematik: `tpCamera.yaw` Mahzen'in çevresinde döner, `G.uiOpen` iken giriş kilitli; müzik `island`.
3. Kapanış metni okuma panelinde (panels.js:51). Metin `storyData.ENDING` tablosundan derlenir: K10'a göre taban paragraf + her karar için bir cümle (5 × 2) + Tuzla cümlesi. Konuklar aynı metni yerel tablodan kurar (h2c `epilog{v}`; serbest metin yok); co-op'ta tayfanın adları sona "Tayfa: …" olarak eklenir (Faz 2 `cleanName`).
4. **Jenerik:** `menu.credits()` (menu.js:319-332) "Hikâye" bölümüyle genişler ve oyun içinden açılır.
5. Kapatınca `advance(10)` (Epilog), otomatik kayıt.

Örnek (K6=af, K7=yak, K8=ver, K9=arın, K10=mira):

> Büyük Cezir'in son damlası Mahzen'in basamaklarından çekilirken Mira Veyl Pusula'yı iki eliyle tuttu. Gölge onunla birlikte eridi; ufku altmış yıldır örten sis bir sabah rüzgârı gibi dağıldı. Tuzla, Fener Kayası'nın galerisinden onun gidişini izledi: "Martı'yı denize geri getirdin evlat," dedi, "o da bunu istiyordu." Kor Selim Kül Adaları'nda dürüst bir kaptan oldu. Ruh Feneri'nin ışığı Hayalet Denizleri'nin en karanlık gecesinde bile sönmedi. Kuzeyfener'de Ayaz Tacı'yla yeni bir bayram kuruldu. Gümüş Madeni'nde madenciler yeniden gümüş çıkarıyor. Ve Mavi Kırıklar'ın her meyhanesinde aynı hikâye anlatılıyor: Son Hazine'yi bulan korsan, onu altından daha değerli bir şeyle takas etti.

Diğer karar cümleleri (B): K6=teslim "Kül Limanı'nın zindanında Kor Selim hâlâ Hançer'in adını sayıklıyor."; K7=af "Amiral Kasvet'in filosu son kez selam verip sise karıştı."; K8=al "Ayaz Tacı Sedef Hanım'ın vitrininde parladı."; K9=kalp "Gümüş Madeni'nin derin galerisi bir gece gürültüyle çöktü."; K10=pusula tabanı: "Pusula avucunda ısındı. Deniz bir an durdu, sonra senin nefesinle birlikte çekildi. Mira başını salladı: 'Ufku ben korurum, sen denizi gez.'"

### 4.6 Final sonrası oyun

| Konu | Davranış |
|---|---|
| Aşama | `stage = 10` (`son`, "Ufkun Ötesi"); HUD takipçisi "Hikâye tamamlandı — Ufkun Kaptanı"; menü kartında ★ (menu.js:84-87); defterde bütün aşamalar ✓, karar özeti, parçalar 4/4, "Bekçiler" sayacı (5 efsanevi boss + Gölge). |
| Açık dünya | Her şey açık; yenilen bosslar yenilmiş kalır. Yan görevler, haritalar sürer. NG+ kapsam dışı. |
| K10=mira | Ölü Sis kabukları ve engel kaldırılır; Yitik Ufuk keşfedilebilir normal ada (batı eyerinde küçük iskele, sunakta Mira'nın taş heykeli: taş tintli tek `Character`, animasyonsuz). Mira'nın Kutsaması `progress.recompute`'a. Ada kâşif başarımına dahil. |
| K10=pusula | Koridor kalıcı açık; Mira sunakta bekçi NPC. `gelgit_pusulasi` kullan → **Gelgit Çağrısı**: oyun günü başına bir kez 1 oyun saati gelgit −0,55'e sabitlenir: `time.tideOverride = {until, v}`; `time.tide()` buna uyar (time.js:81); host'ta, zaman eşitlemesine bir alan eklenir (K-11). |
| Her iki yol | Tuzla 4 **Mira'nın Gelgit Haritası** verir (B'nin doğal gelgit kumsalları, arazi değişmez; `tide:true` hikâye kazı noktaları, treasure.js:189-194 kuralı): Kül Limanı (5520, 400), Kuzeyfener (602, −5300), Kumsaati (−5086, 886), Zümrüt Koy (−58, 5300). K10=pusula her an erişir; K10=mira doğal alçak suyu bekler (İbre zaman panelinde gösterir). |
| NPC'ler | Tuzla, Kevser, Halil (K10=mira'dan sonra mezarlıkta görünmez), Ayaz, Nur ve Yadigâr için epilog replikleri. |
| Başarımlar | "Ufkun Kaptanı" (`ach_son_hazine`), "Bekçiler" (`ach_bekciler`) + 4 bölüm başarımı. `kasif` gizli adayı yalnız `a10_gozlem`'den sonra sayar (quests.js:50). |

### 4.7 Plan B (S13 kabul ölçütleri tutmazsa)

Okyanus bölgesi (M17) görsel ya da fizik hatası verirse (lagün kenarında köpük/kesit, kamera su algısı titremesi, ≥ %5 kare süresi farkı) final şöyle kurulur: lagün dolu kalır; Mahzen kapısı T2 (0 m) terasındadır; bekçi yuvaları T3'tedir; Gölge'nin 2. ve 3. evrelerinde su düzeyi değişimi yerine "dalga kabarması" (sis + dalga ölçeği, `ocean.waveScale`) ve Gelgit Taşları kalır; Mahzen içi ve Son Hazine aynıdır. Bekçi yuvası ve kapı konumlarının iki biçimi S12'de `storyWorld`'de birlikte tanımlanır, seçim tek bayrakla (`STORY_CEZIR = true/false`) yapılır. Maliyet ≈ 1,5 gün.

---

## 5. Gerekli yeni mekanikler ve varlıklar

### 5.1 Mekanikler

| Kod | Mekanik | Neden var olan yetmiyor | Türetildiği kod | Yer | Satır (≈) | Kaynak |
|---|---|---|---|---|---|---|
| M1 | Hikâye çekirdeği + veri | Bugünkü elle yazılmış `if` dalları (quests.js:175-189, :276-290) 40 adım için sınanamaz, host doğrulaması yazılamaz | `advance`, olaylar, tapınak kolu | `storyKernel.js`, `storyData.js` | 600 + 1 000 (metin) | B |
| M2 | Çalışma zamanı | Etki yürütme, bölge tetiği, HUD hedefi, epilog | — | `js/game/story.js` | 500 | B |
| M3 | Hikâye dünyası verisi | `I.features`'a ekleme sabit testi ve `R` akışını bozar | `UNIQUE`, `TERRAIN_MODS` | `js/world/storyWorld.js` | 350 | A + B |
| M4 | Yapı evresi ve kurucular | — | `_place/_lamp/_chest/_pier`, tapınak kapısı | `js/world/storyBuild.js`; `islands._buildGen` `story` evresi | 900 | B |
| M5 | Sıra motoru | Tapınak kolu ortak `R`'ye bağlı ve yerel | islands.js:836-849, Faz 2 `templeOrder` | `kernel.seq` | 60 | A + B |
| M6 | Çatlak duvar (Kazma) | Yok | `_place(..., {col})`, hold | `storyBuild.crackWall` (basılı 1,2 sn, `effects.dirt`) | 60 | A |
| M7 | Kat ve merdiven kurucu | Tapınak merdiveni yalnız görsel (G-03) | `_pier` basamak kalıbı (islands.js:650-665), `addPlatform` | `storyBuild.stairs/levels` | 150 | A + B |
| M8 | Gayzer `y` parametresi | Gayzer araziye oturuyor | hazards.js:557-604 | `hazards._geyser` | 15 | B |
| M9 | `_puzzleAt` + `wall` hazard'ı | Plaka rastgele aranıyor; patlamayla kırılan duvar yok | hazards.js:429-554, :200-243 | `hazards.js` | 70 | B |
| M10 | Ayna ışını | Işık bulmacası yok | — | `kernel.beam` + `storyBuild.mirrors` | 160 | A + B |
| M11 | Hava kabarcığı | Dalış odalarında nefes | player.js:780-785 | `storyBuild.vent` (yüzücü r içindeyse nefes +40/sn) | 30 | A |
| M12 | Ruh Feneri | Meşale yalnız `fener` | player.js:122-140 | `toggleTorch`, `_syncTorch` | 50 | B |
| M13 | Hikâye NPC'si | `ghost/hours/lantern/y` yok | npcs.js:64-86 | `npcs._create` | 60 | A + B |
| M14 | Bekleme | Han dışında zaman atlatma yok | main.js:257-268 | `waitUntil` | 30 | B |
| M15 | Gizli ada süzgeci | `ISLANDS` 7 tüketicide doğrudan | quests.js:50, :261; hud.js:81; game.js:300; panels.js:419; journal.js:125; mapArt.js taban haritası | `I.hidden` + `story.revealed(I)` | 80 | A |
| M16 | Mağara genelleştirmesi | Yankı sabit kodlu (geo.js:128-155; cave.js; player.js:391 `y < 9`) | Yankı'nın tamamı | `CAVES = [CAVE, ...STORY_CAVES]`; `cave.build(scene, C)`; `_camSec/camClamp/insideFactor` en yakın mağaradan; nokta başına taban, göl, çukur, kanal | 300 | B |
| M17 | Okyanus bölgeleri | Tek `uShelter` (ocean.js:29-33) | `uShelter` | `ocean.zones[4]`, `setZone`, `levelAt`; liman sığınağı yuva 2'ye taşınır; 5 tüketici `levelAt`'e | 160 | A |
| M18 | Ölü Sis | Bölgesel engel yok | Dünya kenarı kalıbı (ship.js:373-379), fener ışını (islands.js:988-997) | `js/world/oluSis.js` (2 kabuk, şimşek, Ufuk Işını, koridor şamandıraları), `kernel.sisAllowed` | 350 | A + B |
| M19 | Atmosfer bölgeleri | Yalnız Kemik `regionFog` | sky.js:277-285, :353-360 | `sky.zones` | 80 | A |
| M20 | `kaldera` ada biçimi | Mevcut `atoll` sivri halka ve 75° dış yamaç veriyor | geo.js `islandH` dalları | `geo.js` | 40 | A |
| M21 | Final betiği | Yok | Taş Muhafız sütunları (bosses.js:660-681), Dev halkası | `js/game/finale.js` (Cezir denetimi, evreler, taşlar, başarısızlık, Mira) | 450 | A |
| M22 | Kapanış | Yok | `sleep-fade`, okuma paneli, `credits` | `story.epilog` + `js/ui/ending.js` | 200 | A + B |
| M23 | Boonlar | Bayraktan türeyen çarpan yok | progress.js:51, :153-162 | `recompute` | 40 | A + B |
| M24 | Düşman davranışları | §5.2 | §5.2 | `enemies.js` | 450 | A + B |
| M25 | Grup `cond` | Hikâye grupları her zaman doğardı | enemies.js:1306, :1539 | `addGroup/_populate` | 10 | B |
| M26 | Kor Bombası | Fırlatılabilir eşya yok | `_explode` hedef döngüsü | eşya eylemi (önüne 6 m'ye patlama) | 40 | A |
| M27 | Gelgit Çağrısı | Gelgit değiştirilemez | time.js:81 | `time.tideOverride` | 30 | B |
| M28 | Sis açma ve gizli POI | Manzara ödülü yok | `quests.fog` | `story.fog(x, z, r)` | 40 | B |

### 5.2 Düşman türleri ve davranışlar (`ENEMY_TYPES` 17 → 26)

| Anahtar | Ad | Taban | Can / hasar | Davranış | Aşama |
|---|---|---|---|---|---|
| `haydut_kulcu` | Kül Bombacısı | `haydut_nisanci` | 85 / 16 | `ranged:'lav'` (B1), `keep [8,15]`, `xp 18` | 6 |
| `kor_selim` | Kor Selim | `haydut_kaptani` + `kizil_hancer` | 700 / 26 | `boss`, `summonAt [0.5]`, `smoke`, `ranged2:'lav'`, `surrender 0.15` (B2), `xp 180` | 6 |
| `zincirli_ruh` | Zincirli Ruh | `hayalet` | 90 / 18 | `lightBound` (B3), `night` | 7 |
| `iskelet_buz` | Buz İskeleti | `sk_warrior` | 140 / 16 | `slowHit 2.0` (B4), `rise 0.2`, kırılgan ×1,5 | 8 |
| `buz_kahini` | Buz Kâhini | `sk_mage` | 120 / 18 | `ranged:'buz'` (B1), `keep [10,16]` | 8 |
| `kum_hayaleti` | Kum Hayaleti | `iskelet_nisanci` | 95 / 20 | `burrow` (B5) | 9 |
| `iskelet_madenci` | Madenci İskelet | `iskelet` | 100 / 18 | `rise 0.5` | 9 |
| `madenbasi` | Madenbaşı Gümüşdiş | yeni boss | 1 100 / 30 | `boss`, `summonAt [0.66]`, `enrageAt 0.15`, karanlık evresi (B6, betik), `xp 260` | 9 |
| `gelgit_golgesi` | Gelgit'in Gölgesi | yeni final | 1 600 / 34 | §4.3 | 10 |

| Kod | Davranış | Yer |
|---|---|---|
| B1 | `RANGED.lav/buz`: `RANGED[x].lob` ise menzilli dal (enemies.js:838-852) `enemies.lob` çağırır; `buz` güdümsüz `icebolt` + isabette `slowT` | enemies.js:60-66 |
| B2 | `surrender`: `applyDamage` sonrası can ≤ `T.surrender` → `state='surrender'`, dokunulmaz, `Sit_Floor_Down`; host `enemySurrender` yayar | `Enemy.applyDamage` |
| B3 | `lightBound`: vuranın 6 m'sinde yanan Ruh Feneri yoksa `'blocked'`; ışıkta 0,6 sn sersem | `Enemy.applyDamage` başı |
| B4 | `slowHit`: yavaşlatma yalnız `hurt` sonucu gerçek isabetse (kaçınma, parry, blok değil); `grab` aynı yoldan (H-05) | `_hitPlayer` (enemies.js:1000-1008) |
| B5 | `burrow`: `buried`/`emerge` durumları (`_think/_act`), ağ gizleme, `SpawnGround` | enemies.js:658-861 |
| B6 | Karanlık evresi: host `storyFx{k:'karanlik', t:12}`; her istemci yerelde meşaleyi söndürür (Ruh Feneri hariç), havuz lambaları kapanır | `finale/story` betiği |
| B7 | `allDay`: grup bayrağı; gece türleri gündüz kaybolmaz | enemies.js:637-641 |

Mevcut 17 tür olduğu gibi kalır.

### 5.3 Yeni eşyalar (`items.js`)

| Kimlik | Ad | Kategori | Değer | Not |
|---|---|---|---|---|
| `kor_anahtari` | Kor Anahtarı | gorev | 0 | `nosell` |
| `kor_kalbi` | Kor Kalbi | gorev | 0 | `nosell` |
| `obsidyen_kazma` | Obsidyen Kazma | arac | 0 | `nosell`; çatlak duvar |
| `mira_mektubu` | Mira'nın Mektubu | gorev | 0 | okunur |
| `ruh_mumu` | Ruh Mumu | sarf | 0 | Sare verir ×3 |
| `kandil_yagi` | Kandil Yağı | sarf | 80 | Kaçakçı (gece, aşama 6) |
| `ruh_feneri` | Ruh Feneri | arac | 0 | `nosell`; F ile yeşil alev |
| `amiral_defteri` | Amiral'in Seyir Defteri | gorev | 0 | okunur |
| `amiral_kilici` | Amiral'in Kılıcı | silah | 1 500 | hasar 40; K7=af; `weaponDamage` ve `EQUIP_NEED.sword` (player.js:24, :116-120) en iyi kılıcı seçer |
| `kralice_muhru` | Kraliçe'nin Mührü | gorev | 0 | `nosell` |
| `ayaz_taci` | Ayaz Tacı | koleksiyon | 2 500 | K8=al |
| `ay_gumusu` | Ay Gümüşü | gorev | 0 | `nosell` |
| `gelgit_ibresi` | Gelgit İbresi | arac | 0 | `nosell`; HUD koridor + alçak su |
| `mira_haritasi` | Mira'nın Haritası | gorev | 0 | okunur (Yitik Ufuk'un yeri) |
| `mira_seyir_defteri` | Mira'nın Seyir Defteri | gorev | 0 | okunur (yıldız sırası) |
| `gelgit_mercegi` | Gelgit Merceği | gorev | 0 | `nosell` |
| `mira_muhru` | Mira'nın Mührü | gorev | 0 | `nosell` |
| `kor_bombasi` | Kor Bombası | sarf | 0 | ×3, K6=af; kullan: önüne 6 m'de patlama |
| `gelgit_pusulasi` | Gelgit Pusulası | arac | 0 | K10=pusula; efsanevi |
| `son_hazine_nisani` | Son Hazine Nişanı | koleksiyon | 0 | benzersiz kupa |
| `mavi_kiriklar_muhru` | Mavi Kırıklar Mührü | koleksiyon | 2 000 | Son Hazine / kral mezarı |

`harita_parcasi` `{piece: 3|4}` verisiyle yeniden kullanılır (Faz 4 şeması `piece 1…4`'ü kapsıyor). `mira_sapkasi` eşya değil, kozmetik kilidi (Faz 4 `misc.cosmetics`). Hikâye eşyaları `cat:'gorev'`, `nosell`; katalog `buildSaveCatalog` ile güncellenir, Faz 4 `katalog_v05.json` bilinçli olarak yalnız eklemeyle güncellenir.

### 5.4 Varlıklar (yeni dosya yok)

| İhtiyaç | Kaynak |
|---|---|
| Kapı, duvar, sütun, merdiven, ızgara, sancak, mum, sandık, sikke, raf | `assets/models/kk/kit_dungeon.glb` (102 parça): `wall_gated`, `wall_doorway`, `wall_broken`, `wall_half`, `wall_cracked`, `barrier_column`, `pillar(_decorated)`, `stairs(_wide/_walled)`, `floor_tile_grate/large`, `banner_blue`, `candle_lit`, `torch_mounted`, `chest_gold`, `coin_stack_large/medium`, `shelves`, `sword_shield_gold`, `rubble_*` |
| Mezar, mum üçlüsü, yazıt, kemer, kemik, fener | `kit_graveyard.glb` (57): `gravestone`, `candle_triple`, `plaque`, `arch`, `bone_*`, `ribcage`, `lantern_hanging`, `post_lantern`, `shrine_candles` |
| Ev, kule, iskele, çit, el arabası | `kit_town.glb` (88): `home_A_red`, `tower_base_red`, `scaffolding`, `fence_wood_straight`, `wheelbarrow` |
| Kaptan köşkü eşyası, kitap | `kit_furniture.glb`: `table_medium_long`, `book_set`, `rug_oval_A`, `cabinet_medium_decorated` |
| Şişe, asa, balta | `kit_weapons.glb`: `smokebomb`, `Skeleton_Staff`, `Skeleton_Axe`, `2H_Sword` |
| Karakterler | `kk_*.glb` (barbarian/knight/mage/rogue/rogue_hooded/`sk_*`); `kk_anims.glb` (81 klip: `Spellcast_*`, `Sit_Floor_*`, `Spawn_Ground_Skeletons`, `Skeletons_Awaken_*`) |
| Kristal, dikilitaş, kaya | `crystal.glb`, `crystal_rock.glb`, `obelisk.glb`, `rock_tall.glb`, `rock_large.glb` |
| Prosedürel | Ölü Sis kabukları (açık uçlu silindir, kayan döşenen gürültü dokusu), ışınlar (toplamalı silindir), Pusula (halka + küre), Gelgit Kızı gövdesi ve odaları (kutu + düzlem, `woodPlanks`), buz mührü diski, aynalar, Gelgit Taşları |
| Ses | Mevcut `audio.play` + `audio.tone` (gürleme, çan, şimşek); müzik izleri `cave`, `ghost`, `island`, `sea` |

### 5.5 Başarımlar (`quests.js` `ACHIEVEMENTS`, :44-58)

`ach_ates` (`parca3`), `ach_sis` (`a7_zincir`), `ach_buz` (`parca4`), `ach_ibre` (`t_ibre`), `ach_son_hazine` "Ufkun Kaptanı" (`hikayeBitti`), `ach_bekciler` (5 efsanevi boss + Gölge). `kasif` (quests.js:50) gizli adayı yalnız `a10_gozlem`'den sonra sayar.

---

## 6. Kayıt, co-op ve performans

### 6.1 Kayıt (Faz 4 şema v3, yalnız ekleme)

| Alan | Değişiklik |
|---|---|
| `quests.stage` | int 0…10 (`STORY.length − 1`); doğrulayıcı aralığı `storyData`'dan alır. Eski 5. aşama (yer tutucu) aynen Aşama 6'nın başı olur; veri dönüşümü yok. |
| `quests.flags` | 43 yeni bayrak, hepsi yalnız `true`; toplam 49 ≤ 64 (Faz 4 sınırı değişmez). |
| `quests.rt` | Kaydedilmez (Faz 4 D-17): `morvanSpawn kizilSpawn selim mum zincir aynalar[3] kaide ayin karanlik madenbasi cezir final seq yuva`. |
| `bosses.defeated` | Değişmez (yeni boss `bosses.js`'e girmez). |
| `islands.opened` | Hikâye sandıkları ve geçitleri: `korsan_kasabasi_hk_kiler`, `kul_limani_hk_atolye`, `kizil_kanyon_hk_kervan`, `kirlangic_hk_nis`, `buzdisi_hk_kanal_sandik`, `gumus_madeni_hk_sandik<i>`, `yitik_ufuk_hk_kamp`, `yitik_ufuk_hk_mahzen`, `batik_sehir_hk_mezar`. v0.4 bu kümeyi korur (Faz 4 §2.7). |
| `islands.freed` | Zindan hücreleri: `demirkapi_hk_hucre`, `demirkapi_hk_selim` (D-01 `tryClaim`). |
| `hazards.gone` / `solved` / `looted` | `gumus_madeni_hk_fici`, `gumus_madeni_hk_duvar`, `obsidyen_hk_fici<i>` / `gumus_madeni_hk_plaka` / plaka sandığı. |
| `worldState.res` | K9=arın damarı `gumus_madeni_hk_damar` (oyun saati; Faz 4 birimi). |
| `time` | `tideOv {until, v}` (K10=pusula; kısa ömürlü; v0.4 düşürür, zararsız). |
| `misc.cosmetics` | `mira_sapkasi`. |

**Bayraklar** (Faz 2 beyaz listesi ve Faz 4 `STORY_REQ` bunlardan türetilir):
`a6_kevser a6_selim k6_af k6_teslim a6_kule a6_dev parca3 t_kazma · a7_kiler a7_halil t_fener a7_amiral a7_zincir k7_af k7_yak a7_son · a8_ayaz a8_zirve a8_ayna a8_muhur a8_yilan parca4 k8_ver k8_al a8_son · a9_nur a9_yadigar a9_maden a9_gumus k9_kalp k9_arin t_ibre · a10_tuzla a10_defter a10_gozlem a10_isin a10_sis a10_muhur a10_cezir a10_golge k10_mira k10_pusula hikayeBitti` (43) + mevcut `ilkHarita ilkHazineBulundu ilkSatis gunluk parca1 kizilYenildi` (6).

**Tutarlılık kuralları** (Faz 4 §3.4'ün genişlemesi; `storyKernel.validate`):

| Kural | İhlalde |
|---|---|
| İleri yön: `a6_* parca3 k6_*` ⇒ aşama ≥ 5; `a7_* t_fener k7_*` ⇒ ≥ 6; `a8_* parca4 k8_*` ⇒ ≥ 7; `a9_* k9_*` ⇒ ≥ 8; `a10_* k10_*` ⇒ ≥ 9. Kapanış bayrakları (`t_kazma`, `a7_son`, `a8_son`, `t_ibre`, `hikayeBitti`) ⇒ aşama ≥ bölüm + 1. | Bayrak silinir (`onarım` notu) |
| Geri yön: ≥ 3 ⇒ `gunluk`; ≥ 4 ⇒ `parca1`; ≥ 5 ⇒ `kizilYenildi`; ≥ 6 ⇒ `t_kazma ∧ parca3 ∧ (k6_af ∨ k6_teslim)`; ≥ 7 ⇒ `a7_son ∧ t_fener ∧ (k7_af ∨ k7_yak)`; ≥ 8 ⇒ `a8_son ∧ parca4 ∧ (k8_ver ∨ k8_al)`; ≥ 9 ⇒ `t_ibre ∧ (k9_kalp ∨ k9_arin)`; = 10 ⇒ `hikayeBitti ∧ (k10_mira ∨ k10_pusula)` | Aşama, koşulun sağlandığı en yüksek aşamaya indirilir. F-06 ile şişirilmiş "aşama 99" kayıtları 5'e iner; v0.4'ün açıp yeniden yazdığı v0.5 kayıtları bayrakları koruduğu için (quests.js:79, :123) aşamasını kaybetmez. |
| Karar çiftleri dışlayıcı | İkisi birden varsa ilk seçenek korunur (`onarım`) |
| Hikâye eşyası ↔ bayrak | `reconcile` eksik eşyayı yeniden verir (oyun içi uzlaştırma) |

**Kimlik kataloğu** (Faz 4 `worldIds.js`): hikâye kimlikleri `<adaId>_hk_<ad>[n]` biçimindedir; kanonik gösterim `<ada>/hk/<ad>.<n>`. Hiçbir ada kimliği başka bir adanın `<id>_` öneki değildir (`yitik_ufuk` dahil). `kimlik_sabit.mjs` yalnız eklemeyi görür ve geçer.

**Göç:** 2→3 adımına ek iş yok. Geriye dönük işleme ilk yüklemede `reconcile` ile. **Sürüm düşürme:** v0.4 aşama 7'yi `STORY[min(stage,5)]` ile yer tutucu gösterir (hud.js:278, menu.js:75), tetik çalıştırmaz, bilinmeyen bayrakları ve eşyaları korur; v0.5'e dönünce aşama bayraklarla doğrulanır ve korunur.

### 6.2 Co-op (host otoritesi, konuk ilerlemesi)

**İleti tablosu** (Faz 2 şema kayıt defterine ekler):

| Yön | Tür | Şema | Host kuralı |
|---|---|---|---|
| c2h | `story{q, ev:'npc', a}` | `a ∈ STORY_NPC_IDS ∪ {'tuzla'}` | Etkin adım bu NPC'yi istiyor; `posOf(pid)` NPC'nin **veri konumuna** ≤ 4 m (fail-closed, Faz 2 P2); saat; `lantern` ise konuğun `st.torch` + profilinde `ruh_feneri` |
| c2h | `story{q, ev:'secim', a}` | `a ∈ CHOICES` | Yalnız host (K-6). Konuktan gelirse reddedilir, host'a "öneri" bildirimi |
| c2h | `story{q, ev:'bekle', a}` | `a ∈ {'gece', 'ogle'}` | Yalnız host |
| c2h | `feat{q, id:'hk:<id>'}` | `id ∈ STORY_FEATURE_IDS` (Faz 2 deseni `^(chest|altar|…|hk):`) | Veri konumuna yakınlık (r + 1), kip (`ground`/`swim`), dwell (0,85 × basılı süre), adım koşulu, profilde gereken eşya, gece/öğle, ışık |
| h2c | `story{stage, flags, m?}` | `flags` beyaz listeden; `m` TEXT kimliği | Konuk metni yerel tablodan kurar; Faz 5 `quests.onRemoteAdvance(stage)` "Yeni görev" arayüzünü çalıştırır |
| h2c | `featSt{id:'hk:…', st}` | Yuva, ayna, mum, zincir, kapı, fener, Gelgit Taşı durumları | Kalıcı olanlar (`opened`, `gone`, `solved`) `worldPart.feats`'te; ara durum katılımda sıfırlanır (tapınağın yarım dizisi gibi) |
| h2c | `storyFx{k, v, t?}` (yeni) | `k ∈ {cezir, final, ayin, karanlik}`, `v ∈ [0,1]`, `t ∈ [0, 600]` | 4 Hz, yalnız etkin efekt varken |
| h2c | `epilog{v}` (yeni) | `v ∈ {mira, pusula}` | Bütün konuklarda kapanış |
| h2c | `ntf{k, a?}`, `tel{n, k, dur}`, `bossFx{k, …}` | Faz 5 | Hikâye bildirimleri, Selim/Madenbaşı/Gölge telgrafları (≤ 80 m) |

**Kurallar:**
- **Tetikler yalnız host'ta** (F-04); bölge tetikleri `posOf` ile host + bütün konuklar. Konukta `story.update` yalnız görsel iş yapar (ışın, sis, aynalar, şamandıralar).
- **Hatıra eşyaları bütün tayfaya** (F-11): `storyGive(id, n, data)` host'un çantasına ve bağlı her konuğun profiline (Faz 2 profil işlemi, işlem kimliği `story:<bayrak>:<pid>`). **Geç katılım uzlaştırması:** katılımda host dünya bayraklarına göre konuğun profilinde eksik hikâye eşyasını bir kez verir. Araçların işlevi dünya bayrağına bağlıdır; konuk kendi dünyasında bu araçları kullanamaz (K-7).
- **XP:** aşama XP'si Faz 5 K5-2'ye göre (olayın 300 m'sindeki herkes, tam); boss ve adım XP'si `share` kuralıyla (progress.js:67-73).
- **Kararlar ve zaman atlatma** yalnız host; konuk "Bu kararı kaptan verecek" metnini ve "Kaptana öner" seçeneğini görür (öneri `social` sınıfı, oran sınırlı).
- **Hareket doğrulayıcı** (Faz 2 §8.3): Ölü Sis yasak bölge kuralı `kernel.sisAllowed`; gayzer fırlatması mevcut dikey kurala sığar (15 Hz'de 16 m/sn × 1/15 sn = 1,07 m ≤ 9·dt + 1,5 = 2,1 m; uçuş < 1,5 sn < 3 sn `fly` sınırı). Yeni kip yok (halat yok).
- **Konuk kaydı:** Faz 2 kuralı gereği `dksh.guest.0` yazılmaz; hikâye durumu dünyaya (host'a) aittir. Başka dünyadan gelen hikâye bayrakları hiçbir yolla host'a ulaşmaz (F-01).
- **İlgi alanı** (Faz 5): `story`, `featSt` ve `storyFx` küresel olaylardır (süzülmez).
- **Host devri** (Faz 5 §6): `story.rt` replikanın geçici durumuna girer; devirde final evre zamanlayıcıları baştan başlar, can korunur.
- **Sınıf ve oran:** `story` ve `feat` Faz 2'deki `interact` sınıfında (saniyede 6, patlama 12).
- **PROTO** (K-8): `story.ev/a` kümeleri, `feat hk:` öneki, `storyFx` ve `epilog` teli değiştirir → Faz 5 değeri + 1; `net_schema.mjs` imzası güncellenir.

### 6.3 Performans

| Kalem | Bütçe | Önlem |
|---|---|---|
| Ada kurulumu | Hikâye evresi ada başına ≤ 25 ms toplam, 3 ms dilimler | Her yapıdan ve her NPC'den sonra `yield` (islands.js:346-356 kalıbı); 13_donma P01/P02 ölçütü |
| Çizim çağrısı | Hikâye alanında `renderer.info.render.calls` farkı ≤ 60; **Kırlangıç limanında Ölü Sis'le fark ≤ 3** (taban 1 035, hakem A-10) | Kit parçaları adanın `Batch`'ine (örneklenmiş, hücre LOD'lu); yapı başına ≤ 12 örnek grubu; sis 2 kabuk, ışın 1, Pusula 2 çağrı |
| Kare süresi | Kırlangıç limanında Ölü Sis'li/sissiz fark ≤ %5 (SwiftShader) | Kabuklar `depthWrite:false`, döşenen 256² gürültü dokusu (fbm yerine), 3 km'den uzakta gizli |
| Işık | Yeni `PointLight` yok; **havuz 4 kalır** | Hikâye lambaları ve mağara lambaları `_lamp` havuzu adayı |
| Mağaralar | Mağara ada kurulunca kurulur, boşaltılınca bırakılır (`B.extras`, `B.tag`) | Arazi oyması yalnız ilgili 1 km hücrelerinde maliyet (geo.js uzamsal dizini) |
| Yitik Ufuk | İçerik yalnız aşama ≥ 9'da kurulur (`BUILD_ISLANDS` süzgeci); öncesinde yalnız arazi | Sis bandından geçen oyuncu için kurulum maliyeti yok |
| Okyanus | `uZone[4]` + `uZoneP[4]`, döngü 4 | 09_performans liman ölçümü |
| Bellek | Kur/sök döngüsünde geometri/doku artışı 0 | `own` geometriler `_release`'te (islands.js:429); 34'te 5 döngü |
| Fizik | Platform ≈ 140 (tapınak katları 30, fener 40, Mahzen 40, kule 10, mağara/zindan 20) | 16 m hücreli dizin; yan kutular kısa |
| Ağ | Hikâye iletileri < 1/sn; `featSt` ≤ 3 Hz (ayna); `storyFx` ≤ 4 Hz × ≤ 40 B; kalıcı `feats` < 200 B | — |
| Kayıt | +43 bayrak ≈ +0,9 KB | Faz 4 128 KB uyarı eşiğinin çok altında |
| Çekirdek | Olay başına O(adım); bölge denetimi saniyede bir, ≤ 4 oyuncu × ≤ 3 bölge | — |

### 6.4 Deterministik dünya ve `archipelago_sabit`

| Değişiklik | Nerede | Etki |
|---|---|---|
| Yitik Ufuk | `storyWorld.STORY_ISLANDS` → `worldData.ISLANDS` (74) | `archipelago_sabit` yalnız `EXTRA_ISLANDS`'ı karşılaştırır → **değişmeden geçer**. Etki alanları kesişmez (pay 540 m). 40 000 noktalık yükseklik özeti (Yitik Ufuk'un 1,6 km dışında) eklemeden önce ve sonra aynıdır (B, W02). |
| Hikâye düzlükleri, Yitik Ufuk düzenlemeleri | `STORY_MODS` → `TERRAIN_MODS` | Ayrı liste; `EXTRA_MODS` aynı |
| Mağaralar | `STORY_CAVES` → `CAVES` | Yankı yükseklikleri değişmez (W10) |
| Hikâye kazı noktaları | `STORY_DIG_SITES` → `DIG_SITES` (`story:true`, `treasure.randomSite` dışında) | `EXTRA_DIG_SITES` aynı |
| Hikâye POI'leri | `STORY_POIS` → `POIS` (gizliler UI'da süzülür) | `EXTRA_POIS` aynı |
| `I.features` | Değişmez | v0.3 özellik eşitliği korunur; sıra dizinli kimlikler kaymaz |
| Ada içi yerleşim | S1 (K-3) ile bir kez değişir | Kimlikler, `opened/freed/solved` etkilenmez; Faz 4 T7 belirlenim testi aynı sürümde geçer |
| Arazi | Yalnız iki mağara (Buzdişi, Gümüş Madeni) ve Yitik Ufuk | `computeHeight` işçide ve ana iş parçacığında aynı (geo.js `terrainWorker` aynı modülü kullanır); 02_arazi_* eşitliği korunur |

**R-nötr kuralları:** hikâye yapıları lav evresinden sonra kendi tohumlarıyla kurulur; bitki ayıklaması bütün çekilişlerden sonra (`storyClear`); mağara oymaları S1'den sonra yalnız kendi alanını etkiler; Gümüş Madeni'nin kaya tuzağı yer araması (eğime bağlı) değişebilir ve o adanın tehlike döngüsünün son öğesi olduğundan başka bir şey kaymaz (Faz 4 `boulders` konumu tutar). Faz 4 §6.2 değişmez 2 ("kamp/kale/maden'den sonra plakalı harabe yok") yeni bir ihlal görmez: hikâye plakası `_puzzleAt` ile sabit konumdadır ve `physics.resolve` aramasına girmez.

---

## 7. Dosya bazında değişiklikler ve uygulama sırası

### 7.1 Yeni dosyalar

| Dosya | İçerik | Satır (≈) | Adım |
|---|---|---|---|
| `js/game/storyData.js` | `CHAPTERS` (5–10), `FLAGS`, `CHOICES`, `STORY_NPCS` (kimlik, ad, unvan, görünüm, konum, saat, ışık), `TEXT`, `ENDING`, `STORY_OPEN`, `STORY_CEZIR` | 1 100 | S2 |
| `js/game/storyKernel.js` | `step, apply, reconcile, validate, prereq, seq, beam, sisAllowed` | 600 | S2 |
| `js/game/story.js` | Çalışma zamanı (§3.0), diyaloglar, `request/use/choose`, epilog, `DK.story` kancaları | 500 | S2 |
| `js/world/storyWorld.js` | `STORY_ISLANDS, STORY_MODS, STORY_CAVES, STORY_SITES, STORY_DIG_SITES, STORY_POIS, ZONES, OLU_SIS, TIDE_SITES` (saf) | 350 | S4 |
| `js/world/storyBuild.js` | Kurucular: Kor Kulesi, Mira'nın Evi, mezar çemberi, Zincir Taşı, Ayaz Kulesi, mağara süsleri ve aynalar, Zindan Kulesi, Güneş Örsü, tapınak katları, fener dış merdiveni, Gelgit Kızı, Mahzen ve terasları, yuvalar, çatlak duvar, kabarcık | 900 | S4–S14 |
| `js/world/oluSis.js` | Sis kabukları, şimşek, Ufuk Işını, koridor şamandıraları | 250 | S12 |
| `js/game/finale.js` | Cezir denetimi, evreler, Gelgit Taşları, başarısızlık, Mira | 450 | S14 |
| `js/ui/ending.js` | Kapanış paneli (metin derleme, istatistik, karar özeti) | 120 | S14 |
| `tests/node/hikaye_cekirdek.mjs`, `hikaye_dunya.mjs`, `bitki_cekilis.mjs`, `okyanus_bolge.mjs` | §8.2 | 1 000 | ilgili adım |
| `tests/fixtures/arazi_ozeti_v05.json` | Faz 6'dan önce üretilen 40 000 noktalık yükseklik özeti | — | S2 |
| `tests/scenarios/27_…`–`36_…`, `tests/scenarios/coop/07a_…`, `07b_…` | §8.3–8.4 | 1 800 | ilgili adım |

### 7.2 Değişen dosyalar

| Dosya:satır (fonksiyon) | Değişiklik | Adım |
|---|---|---|
| `js/game/quests.js:24-31` (`STORY`) | 11 girdi: 0–4 aynen; 5–10 `storyData.CHAPTERS`'tan (`title`, `goal` = bölüm özeti) | S2 |
| `quests.js:127-135` (`advance`) | `to < STORY.length` ve `to ≤ STORY_OPEN`; `netStory` Faz 2 biçiminde | S2 |
| `quests.js:137-200` (`_wire`) | `bossDefeated`, `enemySurrender`, `enemyKilled` (hikâye bossları), `treasureFound` (hikâye kazısı), `chestOpened` (F-07) → `story.onEvent` | S2 |
| `quests.js:246-292` (`update`) | Tetikler yalnız host'ta, `rt` ile (Faz 2/4); `story.update(dt)`; keşif döngüsü (:261) gizli ada süzgeci | S2, S12 |
| `quests.js:332-481` (`dialog`) | Tuzla `st ≥ 5` dalı (:358) → `story.tuzlaLine(st)` ve isteğe bağlı Ölü Sis sorusu; `case 'story'` → `story.dialog(npc)`; `cartographer` (:402-411) F-07 yedek haritası; `smuggler` (:448-453) hikâye satışı | S2, S8 |
| `quests.js:44-58` (`ACHIEVEMENTS`) | 6 yeni başarım; `kasif` gizli ada kuralı | S2, S14 |
| `js/ui/hud.js:276-285, 452-460` | Takip metni ve `storyTarget()` 5–10 için `story.goal()/target()` (pusula :264 ve mini harita :421 aynı kaynağı kullanır); :81 konum afişi gizli ada süzgeci; İbre koridor yönü; zaman panelinde sonraki alçak su; final su çubuğu | S2, S12, S14 |
| `js/ui/journal.js:110-128` | Hikâye sekmesi: bölümler/adımlar, kararlar, parça sayacı `parca1..4`, "Kayıp Sayfalar"; :116 notu kalkar; :125 adalar sekmesi gizli ada süzgeci | S2 |
| `js/ui/panels.js:90-98, 419` | Lore eşyalarını okuma, Kor Bombası ve Pusula eylemleri; büyük harita gizli ada süzgeci | S2, S12, S14 |
| `js/ui/mapArt.js` | Gizli adanın taban haritasında okyanus rengiyle maskelenmesi (`a10_gozlem`'e kadar) | S12 |
| `js/ui/menu.js:75-87, 319-332` | Kart hikâye satırı ★; jenerik "Hikâye" bölümü, oyun içinden çağrılabilir | S14 |
| `js/economy/items.js:71-104` | §5.3 eşyaları | S2, S7–S14 |
| `js/economy/shop.js:40-44` | Kaçakçı listesi aşamaya göre `kandil_yagi` | S8 |
| `js/game/enemies.js:60-66, 79-177` | `RANGED.lav/buz`, 9 yeni tür | S6 |
| `enemies.js:1000-1008` | `slowHit`/`grab` yalnız gerçek isabette (H-05) | S6 |
| `enemies.js` `applyDamage`, `_think/_act` (:658-861), :637-641 | `surrender`, `lightBound`, `burrow`, `allDay` | S6 |
| `enemies.js:1306-1309, 1539-1571` | `addGroup` `cond`; `_populate` denetimi; grup `max` | S6 |
| `js/game/progress.js:51, 75, 153-162` | Yeni mod anahtarları `ghost/ice/storm`; F-08 kuralı; bayraklardan boon | S2, S6 |
| `js/game/events.js:251-256, 273` | Düşman gemisi Ölü Sis'e doğmaz; F-09 metni | S2, S12 |
| `js/game/npcs.js:64-86` | `spot.ghost`, `spot.hours`, `spot.lantern`, rol `story`; `y/minY` | S4 |
| `js/world/worldData.js:42, 46-64, 75-83, 104, 172` | `ISLANDS += STORY_ISLANDS`; `TERRAIN_MODS += STORY_MODS`; `CAVES = [CAVE, ...STORY_CAVES]`; `POIS += STORY_POIS`; `DIG_SITES += STORY_DIG_SITES` | S4, S9, S12 |
| `js/world/geo.js:36-117, 128-155` | `islandH`'ye `kaldera` dalı; mağara oyması `CAVES` üzerinde (her mağaranın sınır kutusu, nokta başına taban, göl, çukur, kanal) | S9, S12 |
| `js/world/cave.js` | `build(scene, C)` mağara başına; `_camSec`, `camE`, `camClamp`, `insideFactor` en yakın mağarayı kullanır; Yankı davranışı değişmez | S9 |
| `js/player/player.js:22-24, 116-140, 391, 759-764` | En iyi kılıç (`amiral_kilici`); Ruh Feneri; `inCave` mağaraya göre tavan (bugün `y < 9`); Ölü Sis kuralı | S8, S9, S12 |
| `js/ship/ship.js:373-379, 810-811` | Ölü Sis kuralı (gemi, kayık) | S12 |
| `js/game/game.js:61, 300, 345-347, 382-387, 409` | `caves` kurulumu; dürbün etiketleri gizli ada; kamera tavanı ve mağara müziği etkin mağaradan | S9, S12 |
| `js/world/sky.js:263, 270-285, 353-360` | `sky.zones` atmosfer bölgeleri; Ölü Sis gözü | S4, S12 |
| `js/world/ocean.js:29-51, 115-149` | `zones[4]`, `setZone`, `levelAt`; `shoreFactor` derinliği `levelAt`'ten; gölgelendirici `uZone/uZoneP`; `setShelter` yuva 2'ye | S13 |
| `js/treasure/treasure.js:130-153, 189-194, 213-239, 307` | `siteById/resolveDig` hikâye kazısını görür, `randomSite` görmez; gelgit kazısı ve sandık su durumu `levelAt` | S4, S13 |
| `js/world/weatherfx.js:279`, `js/world/details.js:404` | `ocean.tide` → `ocean.levelAt(x, z)` | S13 |
| `js/world/islands.js:245-248, 279, 340-365, 438-482, 650-665, 815-822, 870-897, 997` | Hikâye grupları; akış listesi `BUILD_ISLANDS`; `story` evresi; S1 sabit çekiliş + `storyClear`; tapınak merdiveni (G-03); maden kemeri tutamakları; fener `t_fener` ile kalıcı | S1, S4, S7–S14 |
| `js/world/hazards.js:111-143, 429-554, 557-604` | `_buildIsland` `BUILD_ISLANDS`'tan arar; hikâye tehlikeleri: gayzer `y`, `_puzzleAt`, `wall`, hikâye fıçıları | S5 |
| `js/world/time.js:81` | `tideOverride` | S14 |
| `js/main.js:103, 257-268` | Sistem listesine `story` (`quests`'ten sonra); `waitUntil` | S2, S4 |
| Faz 2 dosyaları: `js/net/schema.js`, `hostOps.js`, `net.js`, `moveAuth.js` | §6.2 iletileri; beyaz liste `storyData.FLAGS`'ten; `feat hk:`; `storyFx`, `epilog`; yasak bölge; PROTO | S15 |
| Faz 4 dosyaları: `js/core/saveSchema.js`, `js/world/worldIds.js`, `js/world/worldState.js` | Aralık 0…10, bayraklar, §6.1 kuralları, `hk` kimlikleri, `res` damarı | S3 |
| `README.md`, `docs/14_YOL_HARITASI.md`, `docs/13_BILINEN_HATALAR.md` | "6–10 eksik" ifadeleri, hikâye bölümü | S16 |

### 7.3 Uygulama sırası (her adım ayrı birleştirilir; kabul testleri geçmeden sonrakine geçilmez)

| Adım | İş | Kabul | Gün |
|---|---|---|---|
| **S0** | Ön koşul doğrulaması (Faz 2/3/4/5 ilgili adımları uygulanmış; F-01/02/04/05/06 kapalı). **27_hikaye_1_5** mevcut koda karşı yazılır, kod değişmez. | 27 yeşil; 00–26 yeşil | 1,5 |
| **S1** | K-3: `_vegetation`'da aday başına sabit çekiliş (`a, rr, pick, hh, yaw, t1, t2` her zaman çekilir; reddedilen aday yalnız eklenmez) + `storyClear` kancası (boş liste) | Node `bitki_cekilis`; 13_donma P01/P02; 07 D04–D06; 08_kalicilik; Faz 4 T7 | 1,5 |
| **S2** | Çekirdek + veri (5–10 metinleri, `STORY_OPEN = 5`: 6–10 "yakında"); quests entegrasyonu; HUD/defter; `DK.story`; F-07/F-08/F-09; 40 000 nokta fikstürü | Node `hikaye_cekirdek` K01–K22; 27 (0–5 regresyonu + Aşama 6 başlangıcı); 05_dusman_ai 18/18 | 5 |
| **S3** | Kayıt kuralları (Faz 4 `saveSchema`/`worldIds`): aralık, bayraklar, ileri/geri kurallar, kimlik biçimi | K08, K14, K19, K20; `kayit_sema` ve `kimlik_sabit` (yalnız ekleme); 33'ün göç kontrolleri | 2,5 |
| **S4** | Hikâye dünyası altyapısı: `storyWorld`/`storyBuild` iskeleti, `story` evresi, hikâye NPC'si (hayalet, saat, ışık, `y`), hikâye kazısı, gizli POI, sis açma, `waitUntil`, grup `cond`, `sky.zones` | Node `hikaye_dunya` W01–W08; 34-a (kurulum bütçesi, kur-sök); 13_donma P08 | 4 |
| **S5** | Bileşenler: `seq`, çatlak duvar, kat/merdiven kurucu, gayzer `y`, `_puzzleAt`, `wall`, ayna + `beam`, kabarcık, Ruh Feneri ışığı | Node K11, K12; **36_hikaye_bilesenler** (kum havuzu adasında her bileşen tek tek) | 4 |
| **S6** | Düşmanlar ve boss bağı (§5.2), F-08, H-05 yolu | 05_dusman_ai 18/18 (H-05 beklentisi "isabette yavaşlatır, kaçınmada yavaşlatmaz" olarak genişler); **35_hikaye_dusmanlar** | 5 |
| **S7** | Aşama 6 içeriği; `STORY_OPEN = 6` | **28_bolum6_ates** | 4 |
| **S8** | Aşama 7 içeriği; `STORY_OPEN = 7` | **29_bolum7_sis** | 4,5 |
| **S9** | Mağara genelleştirmesi (geo/cave/kamera/oyuncu/gökyüzü); Yankı aynen. K-4: tutmazsa B planı | W09–W10 (mağara dışı özet aynı); 34-b (3 mağarada kamera ve karanlık); 17_kamera_kararma K07 | 5 |
| **S10** | Aşama 8 içeriği; `STORY_OPEN = 8` | **30_bolum8_buz** | 4,5 |
| **S11** | Aşama 9 içeriği (Faz 4 D-01'den sonra); `STORY_OPEN = 9` | **31_bolum9_ibre** | 5 |
| **S12** | Yitik Ufuk (`kaldera`, gizli ada M15, içerik süzgeci), Ölü Sis (kabuklar, engel, koridor, Ufuk Işını), düşman gemisi süzgeci | W11–W14; 32-a (sis kuralı); 34-c (Kırlangıç limanı çizim farkı ≤ 3, kare farkı ≤ %5); 00, 09, 17 yeşil | 5 |
| **S13** | Okyanus bölgeleri (M17) ve `levelAt` tüketicileri. **K-5 kapısı:** tutmazsa Plan B (§4.7) | Node `okyanus_bolge`; 32-b (cezir: lagün tabanında oyuncu `ground`, kamera su algısı titremesiz, kenarda kesit yok); 14_deniz_ekipmani ve 15_iskele_kamera yeşil (liman sığınağı yuva 2'de bozulmaz) | 4 |
| **S14** | Aşama 10, final, kapanış, final sonrası; `STORY_OPEN = 10` | **32_bolum10_final** | 9 |
| **S15** | Co-op katmanı (§6.2), PROTO; Faz 5 `tel/ntf/bossFx`, replika `rt` | **coop/07a**, **07b**; 06a/06b ve Faz 5 06r–06z uyarlanmış hâlleriyle yeşil | 5 |
| **S16** | Kalıcılık, denge, metin, belgeler, tam regresyon | **33_hikaye_kayit**, **34_hikaye_dunya_perf**; 00–36, coop | 4 |
| | **Toplam** | | **≈ 72,5** |

Bağımlılıklar: S2, Faz 2'nin `story/feat` adımından ve Faz 4'ün şema/`rt` adımından sonra gelir; bu fazlar gecikirse çekirdek tek oyunculu yolla devreye girer, ağ işleyicileri S15'te bağlanır (S2'den itibaren her etkileşim `story.request` üzerinden yazıldığı için). S9, S10 ve S11'in önkoşuludur. S12 → S13 → S14. S7 ve S8 birbirinden bağımsızdır.

---

## 8. Test planı

### 8.1 Kancalar (`window.DK.story`; yalnız `?test=1`, yayında Faz 9 kararına göre kapalı)

| Kanca | Görev |
|---|---|
| `state()` | `{stage, flags, step, rt}` |
| `goto(stage, {choices, step})` | `kernel.prereq` ile tutarlı bayraklar ve geriye dönük işleme; oyuncu adım başlangıcına |
| `ev(e)` | Çekirdeğe olay ver (host) |
| `tp(id)` | `terrain.prepare` + ada kurulumu + oyuncuyu ya da gemiyi adımın veya yapının hedefine koy |
| `use(id)` | Yapı eylemini gerçek etkileşim yolundan (`B.inter`) çağır |
| `choose(group, flag)` | Host kararı |
| `kill(type)` | Gerçek `applyDamage` yolu |
| `fx()` | `storyFx` durumu |
| `kernel` | Saf modül (Node ile aynı) |

Var olan kancalar: `DK.sim`, `DK.press/tap`, `DK.bosses.spawn`, `DK.enemies`, `DK.islands._build/_drop`, `DK.hazards`, `DK.treasure`, `DK.save.read/write`, `DK.game.serialize`, `DK.sky.hour`, `DK.time`.

### 8.2 Node testleri (tarayıcısız)

**`hikaye_cekirdek.mjs`** (B'nin K01–K20 + A'nın geçiş durumları)

| Kod | Kontrol |
|---|---|
| K01 | 5→10 zinciri betiklenmiş olaylarla sonuna kadar gider; her adım tam bir kez kapanır |
| K02 | 32 karar birleşiminin hepsi geçerli bir finale varır; etkiler beklenen boonları, eşyaları ve kapanış cümlelerini üretir |
| K03 | Geriye dönük: beş boss önceden yenilmiş → `reconcile` doğru adımları kapatır; Kor Kalbi sunakta, parça 4 gölde |
| K04 | Sıra dışı: 6.4 6.3'ten önce; 8.5 8.4'ten önce; 9.4'te plaka bossdan önce; 7.5 7.4'ten önce |
| K05 | Geçersiz olaylar reddedilir: yanlış aşama, eksik bayrak, eksik eşya, uzak konum (NaN dahil, fail-closed), yanlış kip, gündüz gece adımı, öğle dışı, Ruh Feneri kapalı |
| K06 | `secim` yalnız host olarak kabul edilir; konuk olayı `rej` |
| K07 | Bayrak sayısı ≤ 64; `FLAGS` beyaz listesi bütün `set` edilen bayrakları kapsar |
| K08 | `validate`: ileri ve geri kurallar; aşama 9 + eksik bayrak → indirilir; çift karar → onarım; idempotentlik `validate(serialize(validate(x)))` |
| K09 | `TEXT` tamlığı: her adımın hedefi, diyaloğu ve bildirimi var; HTML yok (XSS) |
| K10 | Ağ etkilerinde serbest metin yok (yalnız kimlik) |
| K11 | `seq`: mum, yıldız ve kral mezarı sıraları tek ve yanlışta sıfırlanır |
| K12 | `beam`: 64 ayna düzeninden tam biri hedefe ulaşır; ışın çıkmazda durur; kaynak yokken ışın yok |
| K13 | `sisAllowed`: `a10_isin` öncesi göze girilmez; dış bant geçilebilir; koridor genişliği K9'a göre; `a10_sis` sonrası serbest; K10=mira sonrası engel yok |
| K14 | `prereq(n)` → `validate` temiz |
| K15 | Eşya uzlaştırma: bayrak var, eşya yok → yeniden ver |
| K16 | `ENDING` her bayrak birleşiminde (2⁵) metin üretir |
| K17 | `STORY_OPEN` kapısı: kapalı bölüme `advance` yok |
| K18 | Faz 2 şema örnekleri (geçerli/geçersiz `story`, `feat hk:`, `storyFx`, `epilog`) |
| K19 | v0.4 aşama 5 kaydı → Aşama 6, adım 6.1 |
| K20 | F-06 ile şişirilmiş "aşama 99" kaydı → 5 |
| K21 | Art arda aynı olay ikinci kez etkisiz (idempotans) |
| K22 | Kimlikler `<adaId>_hk_` biçiminde, benzersiz; `worldIds.parse` adayı doğru çıkarır |

**`hikaye_dunya.mjs`** (B'nin W01–W12 + A'nın dünya kontrolleri)

| Kod | Kontrol |
|---|---|
| W01 | `archipelago_sabit.mjs` alt süreçte GEÇER |
| W02 | 40 000 noktalık yükseklik özeti fikstürle aynı (hikâye bölgeleri dışında) |
| W03 | Yitik Ufuk etki alanı başka hiçbir adayla kesişmez (pay ≥ 300 m; ölçülen 540 m); Ölü Sis halkası başka ada, kazı, batık, balık bölgesi içermez |
| W04 | Her adım hedefi beklenen yükseklik aralığında (Ek A değerleri ±1 m); karada olanlar kıyıdan minimax eğimle ≤ 35° |
| W05 | Hikâye yapıları mevcut özellik ayak izlerine, kazı noktalarına ve **R'ye bağlı özelliklerin olası zarfına** ≥ 4 m (İ6) |
| W06 | Bölge tetiği yarıçapları; HUD hedefi ile yapı konumu ≤ 5 m |
| W07 | Volkanik Dev tetiği (129,6 m) hiçbir hikâye adımı alanını kapsamaz (Kor Kulesi 162 m) |
| W08 | Kimlik kataloğu yalnız ekleme |
| W09 | Mağara oymaları: ≤ 1,05·r, deniz kayalığı halkasının dışı, 30 m içinde nesne yok, taban eğimi ≤ 16° |
| W10 | Yankı Mağarası yükseklikleri değişmemiş |
| W11 | `kaldera`: iç uçurum ≥ 60°, batı eyeri ≤ 40°, 0,65 m adımda süreksizlik yalnız iç uçurumda |
| W12 | Cezir bandı: boşaltılmış su yüzeyi 360 açıda arazinin ≥ 5 m altında (ölçülen 6,32 m) |
| W13 | Gelgit Kızı (495, −1762) −9 … −11 m, 8 m içinde ≤ 2 m fark; Ölü Sis'in gözünde (r < 480) |
| W14 | Gelgit Hazineleri noktaları −0,35 ≤ h ≤ −0,05, 3 m çevresi düz |

**`bitki_cekilis.mjs`** (S1): aday başına çekiliş sayısı sabit; iki farklı yükseklik fonksiyonuyla akış konumu aynı.

**`okyanus_bolge.mjs`** (S13, A): `heightAt/levelAt` bölge formülü: r1 dışında değişiklik 0; r0 içinde −drop; geçişte süreklilik (1 cm adımda sıçrama < 2 cm); `calm` dalgayı ölçekler; liman sığınağının yuva 2'ye taşınmasıyla eski `uShelter` sonucu birebir.

### 8.3 Tarayıcı senaryoları (`tests/scenarios/`)

| Senaryo | Kontroller |
|---|---|
| **27_hikaye_1_5.js** | Yeni oyun → Tuzla (1) → Nevra haritası → `marti_1` kazısı → satış (2) → günlük (3) → Morvan 45 m'de doğar, 60 m'de doğmaz → ölüm (4, parça 1) → Kızıl Hançer (5, parça 2, mektup **çantada**, F-09). Her aşamada kaydet/yükle; F-02: boss savaşında kaydet, yükle → 2 sn içinde yeniden doğar. F-07: Martı sandığı açılınca 3 sn içinde yönlendirme ve ücretsiz harita. F-08: Morvan XP'si ≥ 400. `STORY` 0–4 başlık, metin ve bayrak adları v0.4 ile aynı; aşama 5'te HUD hedefi Kevser. |
| **28_bolum6_ates.js** | `goto(5)`. Kevser istemi 30 m'de yok, 3 m'de var. Obsidyen'de 60 m'de Selim yok, 44 m'de host'ta var; Kül Bombacısı lavı halkalı iner, yanan alan bırakır; fıçı zincirleme patlar. Selim %15'te ölmez, `surrender`; K6 penceresi (iki dal, kayıt anlık görüntüsüyle). Kor Kulesi: G1 püskürmesinde ileri girdiyle T1'e iniş (`onStep` ile tepe ≥ 4,6 m), G2→T2, G3→T3; sprintle korkuluk taşmayı keser; düşme hasarı 0. Sunak anahtarsız tepki vermez. `DK.bosses.spawn('volkanik_dev')` → öldür → Kor Kalbi çantada. Parça 3; Kevser → Kazma, aşama 6. **Geriye dönük:** Dev önceden yenilmiş → 6.4 kapalı, Kor Kalbi sunakta. |
| **29_bolum7_sis.js** | `goto(6)`. Kiler duvarı Kazmasız kırılmaz, Kazmayla 1,2 sn'de kırılır, yüklemede açık kalır (`islands.opened`). Sare → 3 mum. Mumlar gündüz yanmaz; düşman 15 m'deyken yanmaz; Hayalet Kaptan ölünce yanar. Halil gündüz yok, gece var. "Geceyi bekle" yalnız host. Kandil Yağı gece satılır, gündüz satılmaz. Fener yanınca Ruh Feneri; fener gündüz de döner. Zincirli Ruh fenersiz vuruşta `blocked`, fenerle hasar alır. Amiral (gemide spawn + öldür) → defter. Zincir tutuşu bırakılırsa ilerleme 0. K7 iki dalı (af: `amiral_kilici` hasarı 40; yak: `G.mods.ghost` 1,5). Halil → aşama 7. |
| **30_bolum8_buz.js** | `goto(7)`. Ayaz. Zirve yazıtı → sis hücreleri açıldı. Mağara: `camE ≤ 1` (K07 ölçütü), `inCave > 0,5`, tavan sınırı. Kaideye fener tutulmadan ışın yok; yanlış düzende mühür kapalı, doğru düzende platform kalktı. Kraliçe'nin ruhu yalnız fener ışığında. Çukura dalış (nefes ≥ 0), mühür. Su altı geçidi: kanaldan perde altına dalış göle varır. Buz İskeleti blokta yavaşlatmaz, isabette 2 sn yavaşlatır. Yılan öldür → parça 4. K8 iki dalı (ver: `G.mods.breath` 1,5; al: Ayaz NPC'si kalkar). **Geriye dönük:** Yılan önceden yenilmiş → parça gölde. |
| **31_bolum9_ibre.js** | `goto(8)`. Nur. K6=af: iskele yolundan alarmsız hücreye (avlu grubu `awareness < 1`). K6=teslim: Selim'i çıkar → kod, alarmsız; çıkarma → alarm, Gardiyanbaşı. Hücre ödülü tek seferlik (`tryClaim`). Fıçı patlar → duvar `gone`, kemer çarpıştırıcısı `y1 = −999`, galeriye yürünür. Madenbaşı oda girişinde doğar; karanlıkta meşale söner, Ruh Feneri sönmez; yeniden yakmada ×2. Plaka → kafes iner → Ay Gümüşü. K9 iki dalı (kalp: galeri girişi kapanır; arın: 1 oyun günü sonra damar `gumus_kulce` verir). Saat 10:00'da örs reddeder, 12:00'de kabul eder; düşman yakınken sayaç durur → İbre, aşama 9. |
| **32_bolum10_final.js** | `goto(9)`. (a) Tuzla itirafı, Mira'nın Haritası. Defter kazısı (rastgele haritada **çıkmaz**). Tapınak: **G-03** merdiveninden 20 sn içinde sunağa ve Gözlem Katı'na yürüyerek (`pos.y ≥ y0+13,9`); gündüz yuva reddi, gece doğru sıra → mercek; harita ve mini haritada Yitik Ufuk görünür. Fener dış merdiveni → lamba; ışın gece var, gündüz yok (K7=af'ta koridor gündüz görünür). **Ölü Sis:** `a10_isin` öncesi gemi r ≥ 482'ye itilir; dış bant geçilir; koridorda itilmez; Kraken P2'de doğar. (b) Cezir: sunak → `fx.cezir` 25 sn'de 1; lagün tabanında oyuncu `ground`, kamera su altı değil. Gelgit Kızı dalışı → mühür. Yuvalar parçalarla yanar; kapı açılır. Gölge evreleri 70/40/15; su düzeyi evrelerle eşleşir; taşlar dururken ×0,2, kırılınca ×1; başarısızlık dalı (6 dk) suyu geri getirir, boss iyileşir. K10 iki dalı (mira: sis kabukları kalkar, engel yok; pusula: eşya ve Gelgit Çağrısı gelgiti −0,55'e sabitler). Son Hazine payı çantada, ikinci açışta yok. Kapanış paneli, aşama 10, otomatik kayıt; yeniden yüklemede Epilog; menü ★. |
| **33_hikaye_kayit.js** | Her adım sınırında (≥ 40 nokta) kaydet → `reload` → yükle → `state()` aynı (bayraklar, açık geçitler, çözülmüş bulmacalar). `rt` kayıtta yok; yarım diziler sıfırlanır. Bozuk kayıt (aşama 9, eksik bayrak) → indirilir. Çift karar → onarım. v0.4 biçimli aşama 5 kaydı → Aşama 6, 6.1. Beş boss önceden yenilmiş kayıt → doğru adımlar kapalı. Eşya kaybı → uzlaştırma. Finalde kaydet → yükle: Gölge yenilmişse lagün boş, değilse dolu, sunak yeniden kullanılır. Faz 4 `prepare(serialize(prepare(x)))` eşitliği. v0.4 gidiş-dönüşü: `islands.opened`'daki sırlar korunur. |
| **34_hikaye_dunya_perf.js** | (a) Hikâye yapılı adalarda kurulum karelere bölünür, en uzun kare P01 eşiğinin altında; kur-sök × 5 → geometri ve malzeme sayısı sabit. (b) Ayaz Mağarası, Derin Galeri ve Yankı'da kamera ve karanlık (17 K07 yöntemi). (c) Kırlangıç limanında Ölü Sis'li/sissiz çizim farkı ≤ 3, kare süresi farkı ≤ %5; Yitik Ufuk yakınında hikâye alanı farkı ≤ 60; ışık havuzu 4. |
| **35_hikaye_dusmanlar.js** | 9 yeni tür için duman testi (doğ, algıla, saldır, öl, ganimet): lav havuzu, teslim, `lightBound`, yavaşlatma yalnız isabette, gömülme-çıkma uyarısı ≥ 0,8 sn, karanlık evresi; hikâye bossu XP'si (Selim ≥ 360). |
| **36_hikaye_bilesenler.js** | Kum havuzu adasında her bileşen: sıra bulmacası, çatlak duvar (araçsız/araçlı), platform gayzeri, kat merdiveni, `_puzzleAt`, `wall`, ayna, kabarcık, Ruh Feneri ışığı, gizli POI. |

### 8.4 Co-op senaryoları (`tests/scenarios/coop/`)

| Senaryo | Kontroller |
|---|---|
| **07a_hikaye_host.cjs** | (1) Konuk Kevser'le konuşur → host'ta `a6_kevser`, konukta yayın. (2) Konuk 2 km'den `story{ev:'npc'}` (ham) → ret, ihlal +1. (3) Konuk `story` ile bayrak/aşama göndermeyi dener → şema reddi. (4) Konuk tek başına Obsidyen'e gider → Selim **host'ta** doğar ve konukta görünür, konukta yerel boss oluşmaz (F-04). (5) Konuk karar seçemez, öneri host'a ulaşır. (6) Parça 3, Kazma ve Ruh Feneri iki çantada (F-11). (7) Geç katılan konuk eksik hikâye eşyalarını bir kez alır; `worldPart` bayrakları ve `opened` sırları aynı. (8) Konuğun `wcache`'inde aşama 9 bayrakları → host'ta değişiklik yok (F-01). (9) Konuk 20 m'den `feat hk:ates_dagi_hk_sunak` → ret. (10) Zaman atlatma yalnız host. (11) Konuk Ölü Sis'e `a10_isin` öncesi girmeye çalışır → `moveAuth` düzeltmesi. (12) Aşama XP'si K5-2'ye göre (300 m içi tam, dışı yok). |
| **07b_hikaye_final.cjs** | İki oyuncu lagünde: host sunak → konukta `ocean.heightAt` 1 sn içinde host'tan ≤ 0,2 m farklı. Gölge canı ×1,35; evreler ve su düzeyi iki tarafta eşit; Gelgit Taşları konukta görünür, konuğun kırdığı taş host'ta düşer; konuk telgrafı `tel` ile görür. K10 yalnız host; kapanış metni iki tarafta aynı (yerel tablodan). Son Hazine payı iki oyuncuya birer kez. Konuk yeniden katılınca Epilog durumu ve (K10=mira) Ölü Sis'in olmayışı aynı. Host devri (Faz 5, planlı) final 3. evresinde: Gölge canı korunur, su düzeyi sürer. |

### 8.5 Regresyon ve mevcut testlere etki

- Her adımda: 00–26 senaryoları, `archipelago_sabit`, Faz 2/3/4/5 Node testleri, coop 06a–06z (uyarlanmış). Özel olarak 13_donma (ada kurulumu, P08 tapınak), 09_performans (sızıntı, liman), 17_kamera_kararma K07 (Yankı), 07_dunya_kesif (D02/D02b `EXTRA_ISLANDS` üzerinde; etkilenmez), 08_kalicilik, 12_kayit_dongusu, 05_dusman_ai, 16_kosu_poz_ganimet (T08).
- 06_arayuz_960: takip paneli metni uzar; yerleşim kontrolü yeniden ölçülür.
- 05_dusman_ai: H-05 düzeltmesiyle `ek-110` beklentisi "isabette yavaşlatır, kaçınmada yavaşlatmaz" olarak genişler.
- 13_donma P02 ve 08_kalicilik: S1'den sonra yerleşim karşılaştırması aynı sürümde yapıldığı için geçer.
- Faz 4 `katalog_v05.json` ve `kimlik_katalogu_v05.json` bilinçli olarak yalnız eklemeyle güncellenir.

---

## 9. Riskler ve kapsam

### 9.1 Riskler

| # | Risk | Olasılık / etki | Önlem |
|---|---|---|---|
| R1 | Mağara genelleştirmesi Yankı'yı bozar ya da yeni mağarada kamera kayaya girer | Orta / yüksek | S9 ayrı; W10 ve K07; 34-b; B planı (K-4) |
| R2 | Okyanus bölgesi ile arazi/gölgelendirici uyumsuzluğu (köpük, kesit, su algısı titremesi) | Orta / orta | S13 ayrı; Node formül testi; `levelAt` tüketici listesi; Plan B (§4.7) |
| R3 | Gayzer tırmanışı fizik ayarı | Orta / orta | Faz 3 sabit adımla belirlenimli; 6×6 katlar, 0,5 m gayzer, korkuluk (H.2 B-2); 28'de `onStep`; gizli merdiven yedeği |
| R4 | Ölü Sis başlangıç bölgesinde performans ve görüntü değiştirir | Orta / orta | Liman ölçütü (çizim ≤ 3, kare ≤ %5); şimşek ve ses aşama ≥ 5; 3 km'den uzakta gizli; 17 taraması |
| R5 | Yeni oyuncu Ölü Sis'e takılır ya da kuzey rotası uzar | Düşük / düşük | Engel yalnız gözde (r < 480); dış bant geçilir; bir kez bildirim; Tuzla'nın isteğe bağlı açıklaması |
| R6 | Gizli adanın sızması (dürbün, harita, afiş, kâşif başarımı, taban haritası) | Orta / düşük | M15 süzgeç listesi (7 tüketici) + 32'de kontrol; içerik aşama ≥ 9'a kadar kurulmaz |
| R7 | Faz 2/4/5'e bağımlılık sırası | Yüksek / yüksek (planlama) | S2–S14 tek oyunculu yolla ilerleyebilir; ağ bağları S15'te; `story.request` baştan |
| R8 | Faz 7 bağımlılıkları: H-01 (Kraken dokunacı), H-10 (DASH), H-25 (Kraken arazi), H-29 (ganimet lavda), H-19 (gece dalgası) | Yüksek / orta | Hikâye bunlara dayanmaz: toplar ve Kor Bombası, DASH kullanılmaz, Kraken P2'de açık denizde, parçalar doğrudan, grup `max 6` |
| R9 | Co-op karar ve efekt eşitliği (`storyFx` gecikmesi) | Orta / orta | Host tek kaynak, 4 Hz + `frameClock` yumuşatması; 07b ölçütü |
| R10 | Host devri finalin ortasında | Düşük / orta | `rt` replikada; evre zamanlayıcıları baştan, can korunur (Faz 5) |
| R11 | Tutsak/hücre ödülü sömürüsü (G-01) | Düşük / yüksek | Aşama 9, Faz 4 D-01 (`tryClaim`) sonrasına bağlı |
| R12 | Metin hacmi (≈ 150 diyalog satırı, 20 okuma metni) ve tutarlılık | Yüksek / düşük | `TEXT` tek dosyada; K09 tamlık testi; anlatı kuralları §2.3 |
| R13 | Gece/öğle beklemesi oyuncuyu sıkar | Düşük / orta | `waitUntil` her adımda; İbre alçak suyu gösterir |
| R14 | Mağara gölünde balık/köpekbalığı doğması | Orta / düşük | Doğuşta `caves.insideFactor > 0` ve okyanus bölgesi dışlaması |
| R15 | Final uzun ve başarısızlıkta tekrar | Orta / orta | Başarısızlık ölümsüz, sunak bekleme kısa; denge S16 |
| R16 | Çekirdek kapsam ile tam kapsam arasında kayma | Orta / orta | `STORY_OPEN` ile bölüm bölüm yayın; §9.2'deki kesintiler önceden tanımlı |

### 9.2 İş büyüklüğü (tek, kod tabanını bilen geliştirici)

| İş paketi | Satır (≈) | Gün (≈) |
|---|---|---|
| S0 ön koşul + 27 | 350 (test) | 1,5 |
| S1 sabit çekiliş | 60 | 1,5 |
| S2 çekirdek, veri, entegrasyon, F düzeltmeleri | 2 100 | 5 |
| S3 kayıt kuralları | 250 | 2,5 |
| S4 hikâye dünyası altyapısı | 700 | 4 |
| S5 bileşenler | 600 | 4 |
| S6 düşmanlar ve boss bağı | 550 | 5 |
| S7–S8, S10–S11 dört bölüm içeriği | 1 800 | 18 |
| S9 mağaralar | 300 | 5 |
| S12 Yitik Ufuk + Ölü Sis | 600 | 5 |
| S13 okyanus bölgeleri | 160 | 4 |
| S14 Aşama 10, final, kapanış, final sonrası | 1 100 | 9 |
| S15 co-op | 500 | 5 |
| S16 kalıcılık, denge, belge, regresyon | 200 | 4 |
| Testler (4 Node + 10 senaryo + 2 co-op; adımların içinde) | ≈ 2 800 | (yukarıdakilere dahil) |
| **Toplam (tam kapsam)** | **≈ 8 000 kod + 2 800 test** | **≈ 72 ± 10** |

**Çekirdek kapsam (≈ 58 ± 8 gün):** Plan B final (Cezir yok, −2,5); isteğe bağlı Kazma sırları (Kevser'in atölyesi, kervan odası, Halil'in taş yığını) ve Batık Şehir kral mezarı (−2,5); Gelgit Hazineleri ve Gelgit Çağrısı (−2); Kum Hayaleti'nin gömülme davranışı yerine düz pusu grubu (−1); Ayaz Kulesi ve Kor Kulesi manzara noktalarının sis açması (−1); sinematik kamera (−1); Buz Kâhini (yalnız Buz İskeleti, −1); S16'nın yarısı (−2); S1'i atlayıp iki adada yerel yeniden dizilimi kabul etmek (−1,5). Çekirdekte bile her aşamada yeni alan, NPC, zincir, bulmaca, düşman yeniliği, boss, karar ve ödül kalır; Yitik Ufuk, Ölü Sis, bekçi yuvaları, Gelgit'in Gölgesi ve Son Hazine çekirdektedir.

### 9.3 Kapsam dışı

Seslendirme ve yeni müzik; yeni karakter modelleri ve tırmanma animasyonu; halat, asansör, yükselen lav kaçışı (A'nın Kor Damarı), Mürettebat Mahzeni, Buz Sarayı, Lanetli Ocak çukuru, Gelgit Kuyusu (genişleme adayları); dost NPC savaşçılar ve müttefik gemi yapay zekâsı; oyuncu filosu; NG+; ikinci dil; görev panosunun yenilenmesi (F-10); Hayalet Denizleri limanı; A'nın yerel "Durgun Su" ve açık denizde yerel cezir gücü; Kraken arazi kontrolü (Faz 7).

---

## Ek A — Hakem denemeleri (salt-okur, `/tmp/tasarim_y/hakem/`)

| # | Betik | Bulgu |
|---|---|---|
| A.1 | `yer.mjs` | (300, −2100): en yakın ada `ada_merkez_6` 1 534 m (etki alanına pay 1 216 m), Fener Kayası 1 557 m, Kemik 1 851 m; Ölü Sis halkasından (r 760) en yakın kıyıya 652 m; 1,5 km içinde kazı/batık/boss yok; bölge `merkez`. (5000, 7100): en yakın ada `ada_volkan_3` 2 040 m; Perde halkasından kıyıya 982 m; Kadim Tapınak 3 114 m. İki aday da geçerli; A'nınki seçildi (K-1). |
| A.2 | `yukseklik.mjs` | A ve B'nin 40 noktası `geo.computeHeight` ile yeniden ölçüldü; iki belgenin değerleri ±1 m içinde doğru (ör. Kor Kulesi tabanı 108,9 m / 6 m'de 107,3–110,5; Ayaz Kulesi 89,3 m; Zindan Kulesi 19,8 m; Güneş Taşı 10,2 m; tapınak 50,1 m; fener 12,8 m; sis kapısı ve iki ada adayı −30 m açık deniz). Volkanik Dev tetiği 129,6 m: Kor Kulesi 162 m (dışarıda); A'nın Kor Damarı bacası (7616, −832) 108 m (içeride; A'nın mağara muafiyeti gerekçesi doğru). |
| A.3 | `gayzer.mjs` | Gayzer `vel.y 16`, GRAV −22: tepe 5,82 m. 4,4 m'lik kat hizasına yükselişte t = 0,37 sn, inişte t = 1,09 sn. Havada `damp` oranı 2,5 ile yatay yol: istek 2,2 m/sn → 1,57 m; 4,4 m/sn (koşu) → 3,14 m; 7,0 m/sn (sprint) → 4,99 m. B'nin "≈ 1,8 m" hesabı düşük; katlar 6×6'ya büyütüldü. |
| A.4 | `yerlesim.mjs` | Yıkık kasaba merkezi (−1789, 1492), düzlük r 46; Mira'nın Evi 50 m'de (−1755, 1455) h 7,5; B'nin defter kazısı 44,6 m'de. Mezarlık-2 merkezi (−6951, −6309); çit dışında 28 m: (−6927, −6323) h 4,8 düz. Hapishane merkezi (−6653, 2548): A'nın kulesi 39,1 m (köşe kuleleri 37,5 m → çakışma riski), B'ninki 43,8 m. Güneş Taşı harabe merkezine 18,4 m (harabe zarfı ≈ 16 m, islands.js:716-735). |
| A.5 | `kk_anims.glb` klip listesi (Node ile GLB JSON başlığı) | 81 klip; `Climb` ya da tırmanma klibi yok (`Jump_*`, `Interact`, `Use_Item` var). Halat/Buz Kancası bu yüzden çıkarıldı. |
| A.6 | `batik_yer.mjs` | A'nın `kaldera` prototipiyle Yitik Ufuk'un güney dış resifi: r 340 m'de −8,0, r 380 m'de −12,3. −9 … −11 m ve 8 m içinde < 4 m fark koşulunu 25 nokta sağlıyor; seçilen **(495, −1762), −9,3 m, fark 1,6 m** (merkeze 390 m, Ölü Sis'in gözünde). Gelgit Sunağı (482, −2100) 27,2 m; Mira'nın Son Kampı (300, −2282) 26,5 m; batı eyeri (40, −2100) −0,1 → (100, −2100) 7,5 m. |
| A.7 | A'nın `cezir_bant.mjs`, `kaldera.mjs` (yeniden koşuldu) | Boşaltılmış su yüzeyi (r0 150, r1 175, drop 9) 360 açının hepsinde araziden alçak; en küçük pay 6,32 m; r 150/160/170'te su −9,00/−5,83/−0,94, en alçak arazi 7,50 m. `kaldera`: iç uçurum 80,8°, dış yamaç 67,1°, batı eyeri 38,1°. |
| A.8 | Kod okuması | `applySnapshot` (bosses.js:1119-1123) listede olmayan bossu `{x: oyuncu+30}` sitesiyle kurar (B-3). `npcs._create` `minY` varsayılanı 2,4 (A-9). `ocean.tide`'ın doğrudan okunduğu yerler: treasure.js:190, :307; weatherfx.js:279; details.js:404; ocean.js:35; sky.js:263 (A-8). Faz 2 dikey kuralı (≤ 9·dt + 1,5) gayzer fırlatmasını kabul eder. |
