# AUDIT_CURRENT §5 — Hatalar: G — Dünya ve keşif kalitesi

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — G — Dünya ve keşif kalitesi

### G-01 — Hapishane: tutsak kurtarma ödülü sınırsız tekrarlanıyor (E basılı tutuldukça her 2,5 sn +120 altın, +80 XP) (kritik)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._prison (hücre etkileşimi, satır 956-967) + interact.update hold dalı (js/game/interact.js:61-65)
- **Kök neden:** Hücre kapısı eylemi `this.freed.has(key)` denetlemiyor. Serbest bırakmadan sonra B.inter kaydı silinmiyor ve kaydın `cond` alanı yok (islands.js:958). interact.update, hold süresi olan adaylarda tuş basılı kaldıkça her 2,5 sn'de `best.action(p)` çağırıyor (interact.js:62-64). Gardiyan sayısı 0 kaldıkça her çağrı `G.player.inv.gold += 120` (963) ve prisonerFreed (965 → progress.js:84, +80 XP) üretiyor. Kayıt yalnız ada yeniden kurulunca eklenmiyor (956).
- **Oyuncuya etkisi:** Gardiyanları bir kez temizleyen oyuncu, hücre kapısında E'yi basılı tutarak dakikada yaklaşık 2 880 altın ve 1 920 XP kazanıyor. Ekonomi ile rütbe/yetenek ilerlemesi tümden kırılıyor. Etki tek oyunculu oyunda, ev sahibinde ve konukta aynı; ada boşaltılana kadar (1 150 m) sürüyor. [Doğrulama eki] Tuşu bırakıp yeniden 2,5 sn basılı tutmak da ödülü yineliyor; sömürü sürekli basılı tutmaya bağlı değil.
- **Öncelik:** kritik · hedef faz: Faz 4 (+Faz 2)
- **Önerilen çözüm:** Eylemin başına `if (this.freed?.has(key)) return;` ekle. Kayda `cond: () => !this.freed?.has(key)` ver ya da serbest bırakınca B.inter'den çıkar. prisonerFreed yalnız ilk serbest bırakmada yayılsın. Altın shop.earn üzerinden verilsin (paylaşım ve istatistik için). Co-op'ta karar ev sahibinde verilsin (G-02).
- **Tekrar üretme:** Yeni oyun aç. Konsolda: `const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='demirkapi'); await DK.terrain.prepare(-6653,2548,{radius:400}); DK.islands._build(I)`. Oyuncuyu 'free:demirkapi_prison_0:0' kaydının konumuna ışınla. `DK.enemies.list.filter(e=>e.group==='demirkapi_prison_0').forEach(e=>{e.alive=false})` (ya da gardiyanları öldür). Ardından `DK.input.down.add('KeyE'); DK.sim(10)`. Sonuç: altın +480, 'Tutsak kurtarıldı' XP olayı 4 kez.
- **Kabul testi:** Yeni senaryo kontrolü: (1) İlk serbest bırakmada altın tam +120, prisonerFreed 1 kez. (2) Aynı kapıda 10 sn daha E basılıyken altın değişmez, istem görünmez. (3) Üç hücrenin toplamı en çok +360. (4) Ada yeniden kurulunca ve kayıt yüklenince istem çıkmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: G_icerik-ek-statik-159 (Yüksek, doğrulanmamış ek bulgu, v0.4'te açık); ilgili madde: 02 G_icerik-ek-statik-163 (tutsak altını shop.earn dışından veriliyor) [doğrulama düzeltmesi]
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Hatanın kendisi doğrulandı. islands.js:956-967 (_prison): hücre kaydında cond yok, eylemde freed.has denetimi yok; kayıt yalnız kurulumda atlanıyor (956). islands.js:1149-1157 _interactables freed kümesine bakmıyor. interact.js:61-65 hold dalında holdT eşiğe ulaşınca sıfırlanıyor ve best.action yeniden çağrılıyor; aday kimliği aynı kaldığı için süre korunuyor (44), input.isDown tüketilmiyor. Gardiyan sayısı 0 iken (959) her çağrı +120 altın (963) ve prisonerFreed üretiyor (965 → progress.js:84, +80 XP). 60/2,5 = 24 tetik/dk → dakikada 2 880 altın ve 1 920 XP (XP seviye tavanına kadar). v0.3'te islands.js:762-773 ve interact.js:61-65 birebir aynı. Kök neden, etki, öncelik (kritik: sınırsız kazanç), düzeltme ve kabul testi doğru. YANLIŞ olan knownAs: hata 02_HATA_LISTESI.md:1340-1342'de 'G_icerik-ek-statik-159 — Tutsak kurtarma etkileşimi serbest bırakmadan sonra kalıyor: E basılı tutulduğunda her 2.5 s +120 altın ve +80 XP yeniden veriliyor' başlığıyla kayıtlı. Önem: Yüksek; §2c 'Ek bulgular (tek mercek, doğrulanmadı)' altında. 03, 11 ve 16'da kapatma kaydı yok ve kod değişmemiş, yani madde açık. Düzeltme/ek: knownAs şöyle olmalı: '02: G_icerik-ek-statik-159 (Yüksek, doğrulanmamış ek bulgu, v0.4'te açık); ilgili madde: 02 G_icerik-ek-statik-163 (tutsak altını shop.earn dışından veriliyor)'. Ek not: Tuşu bırakıp yeniden 2,5 sn basılı tutmak da ödülü yineliyor. Sömürü sürekli basılı tutmaya bağlı değil. (uygulanan alanlar: bilinen kimlik, oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-011.

### G-02 — Co-op: ada/tehlike kalıcı durumu konuğa aktarılmıyor ve konukta kaydedilmiyor — konuk her katılışta sandık/sunak/tutsak/bulmaca ödüllerini yeniden alıyor, gardiyan denetimi konukta işlemiyor (kritik)

- **Dosya ve fonksiyon:** js/net/net.js — net._sendWorld (510-522); main.js handlers.startOnlineGuest (187-194) ve saveNow konuk dalı (201-205); islands.start (253-267); hazards.start (76-84); enemies.net (1240-1242) / applySnapshot (1650-1660)
- **Kök neden:** Dünya iletisi yalnız gemi, sandık, kese, görev, zaman ve kayık bilgisini taşıyor; islands (opened, freed, temples) ve hazards (solved, looted, gone) yok. Konuk game.start'a yalnız {player, progress, quests} veriyor (main.js:193), bu yüzden islands.start ve hazards.start konukta boş kümelerle başlıyor. Konuk kaydı (203) da bu kümeleri yazmıyor. Ödüller konukta yerel üretiliyor: sandık ve sunak lootToBag ile doğrudan konuğun çantasına (islands.js:749, 860; treasure.js:95-100), tutsak altını doğrudan (963), XP olayları da yerel (progress.js:84-86). Ayrıca düşman ağ görüntüsünde grup kimliği yok (enemies.js:1241); konukta yaratılan kopyaların `group` alanı boş (1655), bu yüzden gardiyan sayımı (islands.js:959) konukta hep 0. v0.3'te konuğun sandık ganimeti toplanamayan keseye dönüşüyordu (B03), sömürü tutsak altını ve XP ile sınırlıydı.
- **Oyuncuya etkisi:** Konuk odadan çıkıp yeniden katılarak şunları sınırsız yineliyor: ada sandıkları (58 sabit sandık; zengin tablo 120–260 altın + külçe/mücevher), tapınak sunağı, gizli bulmaca sandıkları (140–320 altın, +150 XP), tutsak ödülleri (+120 altın, +80 XP) ve tapınak XP'si (+250). Kazanç konuk kaydına yazılıyor. Gardiyanlar canlıyken bile konuk tutsakları serbest bırakabiliyor. Ayrıca ev sahibinin açtığı tapınak kapısı ve kafes konukta kapalı görünüyor ve çarpıştırıcısı yerinde duruyor (dünya tutarsızlığı). [Doğrulama düzeltmesi] _chest ile kurulan sabit ada sandığı 57 adet (harabe 22, mezarlık 2, maden 2, yıkık kasaba 1, karaya oturmuş gemi 26, batık şehir 4); 58 sayısı sunak eklenince çıkıyor, metinde sunak ayrıca sayıldığı için çift sayım var. Sunak sandığı G-03 nedeniyle erişilemiyor, bu yüzden 'sunağı yeniden alma' pratikte yapılamıyor. Yeniden katılım gerekmeden de konuk aynı oturumda ev sahibinin açtığı her sandığı bir kez daha açabiliyor (çift ganimet).
- **Öncelik:** kritik · hedef faz: Faz 2 (+Faz 4, Faz 5)
- **Önerilen çözüm:** Bir kerelik kümeleri ev sahibi tutsun. Dünya iletisine islands.save() ve hazards.save() eklensin; değişiklikler (opened, freed, temple, solved, looted, gone) olay olarak yayınlansın. Konuğun sandık/sunak/tutsak/bulmaca eylemi, kaynak kimliğiyle ev sahibine istek olarak gitsin; ev sahibi kümede yoksa ödülü üretip netGive ile versin. enemies.net() içine grup kimliği eklensin ya da gardiyan denetimi ev sahibinde yapılsın.
- **Tekrar üretme:** tests/harness/coop.cjs ile iki sekme aç: ev sahibi oda açar, konuk katılır. Konuk korsan_kasabasi'na ışınlanıp `DK.islands.built.get('korsan_kasabasi').inter.find(i=>i.id.startsWith('chest:')).action()` çalıştırır; altın artar. Konuk ayrılıp yeniden katılır ve aynı eylemi tekrarlar; altın yine artar. Demirkapı'da ev sahibinin gardiyanları canlıyken konukta hücre eylemi +120 altın verir.
- **Kabul testi:** Co-op testi: (1) Konuğun açtığı ada sandığı ev sahibinin opened kümesine girer. (2) İkinci denemede ve yeniden katılımdan sonra 'Sandık boş' çıkar. (3) Ev sahibinde gardiyan canlıyken konuk tutsağı serbest bırakamaz. (4) Tapınak kapısı ve kafes durumu iki istemcide aynıdır. (5) Konuk kaydı bir kerelik ödülleri tekrar vermez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: G_icerik-ek-statik-164 (düşük olarak kayıtlı, sömürü boyutu yazılmamış); 02 B_dunya özeti 'Ada kalıcı durumu … co-op konuklar için de paylaşılmıyor'
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: net.js:510-522: _sendWorld yalnız ship, chests, pickups, quests, time ve rowboat taşıyor. main.js:193: konuğun game.start verisi yalnız {player, progress, quests}. islands.start (253-267) ve hazards.start (76-84) boş kümelerle başlıyor. main.js:203: konuk kaydı opened, freed, temples, solved, looted ve gone kümelerini yazmıyor. main.js:320-336: applyWorld bu durumları uygulamıyor. Tapınak, tutsak ve sandık için ağ iletisi yok; yalnız netHazard canlı olayları var (net.js:148, 360, 566). Ödüller konukta yerel üretiliyor: lootToBag (treasure.js:95-100), tutsak altını (islands.js:963), XP (progress.js:84-86). enemies.js:1240-1242: net() grup kimliği taşımıyor. applySnapshot (1655) kopyayı {id} ile yaratıyor, bu yüzden islands.js:959'daki gardiyan sayımı konukta 0. Düşman AI'si yalnız ev sahibinde (1593, 1604). Konuk menüye dönünce toMenu→saveNow (main.js:216-219, 201-205) kazancı kaydediyor. v0.3'te de aynı eksik var (v0.3 net.js:386-397, main.js:191). v0.3'te ada sandığı ganimeti konukta toplanamayan yerel keseydi (v0.3 treasure.js:418-447, net.js:141 ve 250); tutsak altını ve XP ise kalıcıydı (v0.3 main.js:201, progress.js:92-103). knownAs doğru (02:1516-1518 G_icerik-ek-statik-164 'Düşük'; 02:1585 özet). Öncelik 'kritik' tanıma uyuyor (yeniden katılımla sınırsız kazanç). Düzeltme/ek: Küçük düzeltmeler: (1) _chest ile kurulan sabit ada sandığı 57 adet: harabe 22, mezarlık 2, maden 2, yıkık kasaba 1, karaya oturmuş gemi 26, batık şehir 4. 58 sayısı sunak eklenince çıkıyor; metinde sunak ayrıca da sayıldığı için çift sayım var. (2) Sunak sandığı G-03 nedeniyle erişilemiyor, bu yüzden 'sunağı yeniden alma' pratikte yapılamaz. (3) Yeniden katılım gerekmeden de, aynı oturumda konuk ev sahibinin açtığı her sandığı bir kez daha açabiliyor (çift ganimet). (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-012.

### G-03 — Kadim Tapınak sunak sandığı erişilemez: 8 m'lik sunak platformunun merdiveni yalnız görsel (yüksek)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._temple (satır 821-824, 857-862) + physics.addPlatform (js/world/physics.js:71-77)
- **Kök neden:** `kk:dungeon:stairs_wide` çarpıştırıcı ya da platform olmadan yerleştiriliyor (islands.js:821; model 7×5,1×4 birim, ölçek ×1,6). Sunak tek bir platform; üstü y0 + 5,1·1,6·0,98 ≈ y0+8,0 m (822). v0.4'te addPlatform, `top > 3` olduğunda yan kutuyu −50'den başlatıyor (physics.js:76), yani sunak 8 m'lik katı bir blok. Oyuncu en çok 0,6 m'lik basamak çıkabiliyor, zıplama yaklaşık 1,24 m (player.js:17, 558). Etkileşim |Δy| ≤ 3,5 m istiyor (islands.js:1155), sunak istemi ise y0+8,96'da (857).
- **Oyuncuya etkisi:** Tapınak bulmacasının asıl ödülü hiçbir oyuncuya ulaşmıyor: 400–700 altın, %60 Kraliyet Tacı, altın heykelcik, %50 elmas, antik vazo. templeLooted hiç tetiklenmiyor. Bulmaca yalnız +250 XP ve Taş Muhafız savaşını açıyor.
- **Öncelik:** yüksek · hedef faz: Faz 6
- **Önerilen çözüm:** Merdiven boyunca basamak platformları ekle: örneğin 10 basamak × 0,8 m yükselme, `addPlatform(..., false)` + tam yükseklikte yan kutu (port.js:202-216 kalıbı). Ya da eğimli bir rampa ekle. Alternatif olarak sunağı alçalt ya da istemi platformun dibinden de ver. Yol haritası 14 #9'daki işin karşılığı.
- **Tekrar üretme:** `const I=DK.archipelago.EXTRA_ISLANDS.find(i=>i.id==='kadim_tapinak'); await DK.terrain.prepare(I.x,I.z,{radius:500}); DK.islands._build(I)`. Yazıttaki sırayla levyeleri çevir (P08'deki gibi). Kapı açılınca merdivene (x 1900, z ≈ 7396) W ile yürü: oyuncunun y değeri y0'da kalıyor, 'Sunak sandığını aç' istemi çıkmıyor. `DK.physics.groundAt(1900, 7394, y0+1)` y0 döndürüyor.
- **Kabul testi:** Senaryo: bulmaca çözüldükten sonra ışınlanmadan kapıdan yürüyen oyuncu 20 sn içinde platformun üstüne çıkar (pos.y ≥ y0+7,9). İstem görünür, ganimet bir kez verilir, ikinci denemede 'Sandık boş' çıkar.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: B_dunya-ek-statik-34, B_dunya-ek-calistir-37 (ve D-13); 14. belge #9 'tapınak sunağına erişim (basamak platformları)'. 11'de açık madde olarak yok.
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: islands.js:821: stairs_wide col'suz, yalnız görsel. islands.js:822: addPlatform(cx, cz−12, 6, 6, 0, y0+5,1·1,6·0,98 ≈ y0+8,0). physics.js:71-77: top>3 olduğu için yan kutu −50 ile top−0,6 arasında, yani katı blok. physics.js:87-96: groundAt platformu yalnız top ≤ ayak+0,6 iken sayıyor. player.js:17 GRAV −22 ve player.js:558 vel.y=7,4 → zıplama 1,24 m. Sütunlar kutu çarpıştırıcı, üstlerine çıkılamıyor. Tırmanma kipi yalnız gemi merdiveni için var (player.js:957-976). Sunak etkileşimi (857): y=y0+8,96, r=3, konum cz−14. _interactables (1155) |Δy|>3,5 iken istemi vermiyor. Yan kutu (cz−18…cz−6, cx±6) yatayda da sunak noktasına 3 m'den yaklaşmayı engelliyor. GLB ölçümü (kit_dungeon.glb, nicemlenmiş POSITION × düğüm ölçeği 3,5): stairs_wide 7×5,1×4 birim; ×1,6 ile 11,2×8,16×6,4 m. v0.3'te yan kutu yok (physics.js:69-75), ama aynı basamak kuralı ve |Δy| şartı (v0.3 islands.js:959 ve 671) olduğu için sunak yine erişilemez. templeLooted'ı dinleyen kod yok (grep); kayıp yalnız ödülün kendisi. Kayıtlar: 02:1328-1335 (B_dunya-ek-statik-34 ve çalıştır-37, Yüksek), 02:968 D-13, 14_YOL_HARITASI.md:19 (#9); 11'de yok. 12_TEST_PLANI satır 16: 'bulmaca akışı uçtan uca oynanmadı' (KISMİ). Denetçi güveni: yüksek. Bilinen sorun: KI-027.

### G-04 — 6 üretilmiş kazı noktası su altında (atol lagünü/bataklık havuzu): bu hazine haritaları kazılamıyor (orta)

- **Dosya ve fonksiyon:** js/world/archipelago.js — kazı noktası üretimi (üst düzey blok, satır 330-346) + treasure.startDig (js/treasure/treasure.js:186-205)
- **Kök neden:** Kazı noktaları ada merkezinden (0,25–0,70)·r uzaklığa, arazi sorgusu yapılmadan konuyor (archipelago.js:333); modül geo.js'e bağımlı olamıyor. Atolde d &lt; 0,66 bölgesinde lagün tabanı −3,6…0,9 m (geo.js:74), bataklıkta havuzlar −1,4 m (geo.js:86-91). startDig, oyuncunun bastığı zeminin ≥ 0,2 m olmasını istiyor (treasure.js:195). randomSite (131-137) ve harita satan NPC'ler bu noktaları da dağıtıyor.
- **Oyuncuya etkisi:** Node (computeHeight) ölçümü: 123 noktanın 9'u 0,2 m'nin altında. Bunların 6'sının 3,7 m çevresinde hiç kuru zemin yok: mercan_halkasi_kazi_1 (−1,03), ada_merkez_0_kazi_0 (−3,37), ada_merkez_1_kazi_0 (−3,52), ada_merkez_6_kazi_1 (−2,57), ada_tropik_5_kazi_0 (−1,40), ada_tropik_8_kazi_0 (−2,79). Rastgele ya da 150 altına alınan haritaların yaklaşık %5'i hiç kazılamıyor ('Burası kazmak için fazla ıslak'). İpucu nesneleri de su altında kalıyor.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** geo.js yüklendikten sonra, TERRAIN_MODS çözümünün yapıldığı yerde üretilmiş kazı noktalarını computeHeight ile doğrula. 0,3 m'nin altındaki noktayı kimliğini koruyarak en yakın kuru ve erişilebilir noktaya taşı (ipucu nesnesiyle birlikte) ya da randomSite'tan ve satıştan çıkar. tests/fixtures/archipelago_v03.json'u bilinçli olarak güncelle; eski kayıtlardaki haritalar kimlikle eşleşmeye devam etsin.
- **Tekrar üretme:** Node: DIG_SITES'i computeHeight ile tara (bu denetimdeki geçici betik /tmp/denetim_alan/kazi_su.mjs). Oyunda: `DK.treasure.giveMap('ada_merkez_1_kazi_0')`, adaya git, X'te kürekle kaz → 'Burası kazmak için fazla ıslak.'
- **Kabul testi:** Node testi: gelgit noktaları dışında her DIG_SITE için computeHeight ≥ 0,3 ve nokta kıyıdan yürünerek erişilebilir. Oyunda önceden ıslak 6 noktada kazı sandık çıkarır. archipelago_sabit kimlik eşitliği korunur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Kayıtlı değil
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-085.

### G-05 — Martı Batığı sandığı kayda yazılmıyor: kaydet-yükle döngüsüyle sınırsız açılabiliyor (orta)

- **Dosya ve fonksiyon:** js/wildlife/seagear.js — seagear.init/start/openWreck (satır 115-138)
- **Kök neden:** wreckOpened yalnız bellekte tutuluyor. start() her oturumda, kayıt yüklenirken de, bayrağı false yapıyor (128). seagear'da save()/saveKey yok; durum islands.opened'a da yazılmıyor.
- **Oyuncuya etkisi:** Sandık açılıyor (60–140 altın; maske, palet, hava kesesi, zıpkın ve inci olasılığı), oyun kaydediliyor, kayıt yüklenince sandık yeniden açılabiliyor. Döngü tekrarlanabilir kazanç veriyor; içerik v0.4'te eklendi.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** Durumu islands.opened'a ('wreck:marti_batigi') ya da seagear.save() ile kayda yaz. Yalnız yeni oyunda sıfırla. Co-op'ta ev sahibine bağla.
- **Tekrar üretme:** Martı Batığı'na (545, 470) dal ve 'Batık sandığını aç'. Kaydet, kaydı yükle, yeniden dal: istem yine çıkıyor, ganimet yine geliyor.
- **Kabul testi:** 08_kalicilik benzeri kontrol: açılmış batık sandığı kayıt/yükleme sonrasında istem vermez ve ikinci denemede altın değişmez.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #41 (Açık, düşük)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-08). Denetçi güveni: yüksek. Bilinen sorun: KI-062.

### G-06 — Tekrar hissi: 44 yordamsal adacıkta yalnız 3 yapı türü var, tüm dünyada aynı şablonlar kullanılıyor (harabe 22, batık 26, kamp 11, liman 5) (orta)

- **Dosya ve fonksiyon:** js/world/archipelago.js — generate (satır 201-279) + islands._ruin/_wreck/_camp/_port
- **Kök neden:** Yordamsal özellik kuralı yalnız kamp, harabe ve batık üretiyor (archipelago.js:238-240). Havuz eklemesi (243-262) arazi sorgulayamadığı için dik ya da çukurlu şekillerde hep batığa düşüyor; fener, mezarlık ve maden hiç seçilmiyor. Kurucuların her biri tek düzenli: _ruin her yerde aynı kare avlu + 6 sütun + 1 sandık (islands.js:716-739), _wreck aynı yarım silindir gövde (1001-1022), _camp aynı çadır halkası (676-694), _port aynı 10 binalık halka ve 5 NPC (544-599).
- **Oyuncuya etkisi:** Oyuncu farklı bölgelerde aynı yapıyı, aynı ganimet tablosunu ve aynı düşman karışımını görüyor. Yeni adaların 31/67'sinde düşman grubu, 17/67'sinde sabit sandık yok; 21 adacıkta yalnız aynı batık var.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** Şablonlara tohumlu varyantlar ekle (avlu biçimi/boyutu, kırık duvar düzeni, yapı seti); bölgeye özgü kitler ve süsler kullan. Arazi farkında yerleşimle (islands.js'te terrain.heightAt ile aday açı denemesi) fener, mezarlık, maden, gözetleme kulesi ve mağara girişi gibi yeni türleri aç. Her adaya benzersiz bir 'imza' öğe ver; limanlarda bölgeye göre farklı yerleşim ve NPC kadrosu kur.
- **Tekrar üretme:** Node envanteri (EXTRA_ISLANDS özellik sayımı): yordamsal adacıklarda beach_wreck 26, ruin 17, camp 6; graveyard, lighthouse ve mine 0.
- **Kabul testi:** Node testi: yordamsal adacıklarda ≥ 6 özellik türü var ve hiçbir tür %30'u aşmıyor. Her kurucuda ≥ 3 düzen varyantı var. Görsel karşılaştırmada aynı türden iki yapı farklı düzende görünüyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #22 (Açık, düşük)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). G/DOC1 ve G/SYS1 karşı doğrulamaları Node sayımını yineledi: harabe 22, karaya oturmuş gemi 26, kamp 11; 44 yordamsal adacık. Denetçi güveni: kesin. Bilinen sorun: KI-086.

### G-07 — Ada yerleşimi kurulum anındaki arazi LOD'una bağlı: bitki, yapı yönü, NPC adı ve tapınak levye sırası değişebiliyor; co-op'ta iki istemci farklı yerleşim görüyor (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._vegetation (438-482) ve _buildGen (340-365)
- **Kök neden:** Tek rastgele akış (rng(I.seed*31+7)) önce bitki döngüsünde tüketiliyor. terrain.heightAt/normalAt'a bağlı redler (454-465) LOD'a göre farklı sayıda sayı tüketiyor. Bu yüzden sonraki tüm yapıların sayı dizisi kayıyor: harabe ve hapishane yönü (718, 934), levye sırası (827), NPC adı (530).
- **Oyuncuya etkisi:** Aynı ada, gemiyle yaklaşınca ve kayıt yüklendikten sonra farklı kuruluyor. Co-op'ta ev sahibi düşmanları kendi duvar ve çarpıştırıcı düzenine göre yürütürken konuk farklı duvarlar görüyor. Tapınak yazıtındaki sıra, oyuncunun hatırladığı sıradan farklı olabiliyor.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** Her özellik için kimliğinden tohumlanan ayrı bir rng kullan (rng(hash(f.id))). Bitki adaylarında, aday reddedilse bile sabit sayıda sayı çek. Yerleşim kararlarını LOD'dan bağımsız computeHeight ile ver (14 #19).
- **Tekrar üretme:** 11 #35'teki ölçüm: Kadim Tapınak gemiyle 750 m'den kurulduğunda ve terrain.prepare sonrasında kurulduğunda yazıt sırası farklı ('ay>yıldız>güneş' ↔ 'güneş>ay>yıldız').
- **Kabul testi:** P02 benzeri test: her ada kaba LOD'da ve hazırlanmış LOD'da kurulduğunda örnek dönüşümleri, NPC kimlik ve adları, levye sırası ve çarpıştırıcı listesi birebir aynı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #35 (Açık, orta); 14 #19
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-087.

### G-08 — Yeni 5 limanın iskelesinde sudan çıkış merdiveni ve liman barınağı yok (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._pier (601-673)
- **Kök neden:** Taş merdiven ve ocean.setShelter yalnız ana limanda var (port.js:196-217). _pier yalnız iskelenin kara ucunu ve kökteki basamağı kuruyor.
- **Oyuncuya etkisi:** Tuz Pazarı, Kuzeyfener, Zümrüt Koy, Kül Limanı ve Kumsaati'nde suya düşen ya da yüzen oyuncu iskeleye çıkamıyor, kıyıya yüzmek zorunda kalıyor; iskele çevresinde dalga sönümlenmiyor.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** port.js'teki merdiven üretecini _pier'e taşı (iskele ucunun kenarına) ve her limana ocean.setShelter ekle.
- **Tekrar üretme:** Tuz Pazarı iskele ucunun yanında suya gir (ports.byId('tuz_pazari_port_0').pierEnd) ve iskeleye yüz: güverteye çıkılamıyor.
- **Kabul testi:** 07 D03 kontrolünün 5 ada limanı için kopyası: üç gelgit durumunda yüzen oyuncu güverteye çıkıyor ve merdivende dalga genliği ≤ 0,35 m.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #23 (Açık, orta) ve #24 notu
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). G/SYS9 karşı doğrulaması _pier'de (islands.js:601-673) sudan çıkış merdiveni olmadığını doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-088.

### G-09 — Kızıl Kaya (ada_col_2) otomatik harabesi ve kazı noktası mesa terasında kalıyor: yürüyerek ulaşılamıyor (düşük)

- **Dosya ve fonksiyon:** js/world/archipelago.js — otomatik özellik seçimi (243-262; mesa şeklinde 'ruin' kalıyor) + geo.js mesa profili (64-70)
- **Kök neden:** Havuz seçimi yalnız volcano, spire ve swamp için batığa geçiyor; mesa'da harabe 11 m'lik terasa düşüyor. Kıyıdan en yumuşak yol bile 58,3° (ny 0,525) tırmanış ve en az 3,24 m dik yükselme gerektiriyor (Node minimax/Dijkstra, yalnız arazi). Oyuncu ny &lt; 0,6'da tırmanamıyor (player.js:566-576), zıplama yaklaşık 1,24 m. D06 yalnız 10 m çevrede ≥ 1 m yükseklik ölçüyor, erişilebilirliği ölçmüyor.
- **Oyuncuya etkisi:** Adacığın tek içeriği yürüyerek erişilemiyor: harabe sandığı, iskelet grubu, bulmaca adayı ve ada_col_2_kazi_0 kazı noktası. Bu noktanın haritası kazılamıyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Küçük mesa adacıklarında da kıyı özelliği seç ya da yapıyı en alçak terasa koy. Kazı noktaları dahil tüm hedefler için Node erişilebilirlik testi (kıyıdan minimax eğim) ekle.
- **Tekrar üretme:** Node: kıyıdan BFS ve minimax hesabı (bu denetimdeki /tmp/denetim_alan/minimax.mjs ve dik_tirmanis.mjs). Oyunda adacığın kumsalına çık ve harabeye yürümeyi dene.
- **Kabul testi:** Node testi: tüm özellik merkezleri ve kazı noktaları kıyıdan ny ≥ 0,6 ile ya da ≤ 1 m dik yükselmeyle erişilebilir. Tarayıcıda otomatik yürüyüş harabe sandığına ulaşıyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** Kayıtlı değil (15. belge D06 bu durumu yakalamıyor; kazı noktası v0.3'te de aynı yerdeydi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: orta). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-187.

### G-10 — Zümrüt Takımadaları bölgesine özgü atmosfer yok (RW.tropik hesaplanıyor ama kullanılmıyor) (düşük)

- **Dosya ve fonksiyon:** js/world/sky.js — sky.update bölge ağırlıkları (270-284), sis/deniz/parçacık (354-383)
- **Kök neden:** regionW.tropik hesaplanıyor (183, 270-275), ancak sis rengi ve yoğunluğu, deniz tonları ve parçacıklar yalnız buzul, volkan, col ve hayalet ağırlıklarını kullanıyor.
- **Oyuncuya etkisi:** Güneydeki cangıl bölgesi (Kadim Tapınak dahil 13 ada) merkez bölgeyle aynı havaya sahip; bölgeye özgü atmosfer hedefi karşılanmıyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** RW.tropik için nemli yeşil-gri pus, hafif ek sis yoğunluğu, turkuaz deniz tonu, böcek/yaprak parçacıkları ve orman ses katmanı ekle.
- **Tekrar üretme:** Zümrüt Koy (−300, 5300) ile Tuz Pazarı (1900, 950) arasında aynı saat ve havada fog.color/density değerlerini karşılaştır: değerler aynı.
- **Kabul testi:** Bölge geçişinde tropik bölgedeki fog ve ocean uShallow değerleri merkezden farklı; görsel karşılaştırma da farkı gösteriyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 B_dunya özeti 'Güney bölge (Zümrüt Takımadaları) atmosferi'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-188.

### G-11 — Mercan resifi, yosun, kabuk/istiridye ve kumsal ayrıntıları yalnız 6 çekirdek adada var (düşük)

- **Dosya ve fonksiyon:** js/world/details.js — details.init (9, 196-271)
- **Kök neden:** details.js yalnız CORE_ISLANDS ve CORE_FISH_ZONES'u içe aktarıyor. 67 yeni ada ve onların 'reef' balık bölgeleri (archipelago.js:348) için mercan, yosun, kabuk ve toplanabilir üretilmiyor.
- **Oyuncuya etkisi:** Atol ve cangıl adalarında 'resif' olarak işaretli sularda mercan yok; Mercan Halkası boş. Kabuk/istiridye/inci toplama yalnız başlangıç takımadasında yapılabiliyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Ada içeriği kurulumuna (islands._buildGen) örneklenmiş mercan, yosun ve kumsal ayrıntısı adımı ekle; ada boşaltılınca kaldırılsın. Toplanabilirleri ada etiketiyle üret.
- **Tekrar üretme:** Mercan Halkası (2700, 2600) lagününe dal: hiç mercan örneği yok. details.collectibles yalnız çekirdek adalardan oluşuyor.
- **Kabul testi:** 'reef' bölgesi olan her adada kurulumdan sonra mercan örnek sayısı > 0; en az bir yeni adada toplanabilir kabuk var.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Kayıtlı değil
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-189.

### G-12 — Serbest bırakılan tutsağın 0,35 m'lik çarpıştırıcısı ada boşaltılana kadar hücrede kalıyor (düşük)

- **Dosya ve fonksiyon:** js/game/npcs.js — npcs.remove (90-95)
- **Kök neden:** _create, çarpıştırıcıyı ada etiketiyle ekliyor (82); remove yalnız modeli kaldırıyor.
- **Oyuncuya etkisi:** Hücrede görünmez bir engel kalıyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** remove içinde n.col.y0 = n.col.y1 = 9999 ile çarpıştırıcıyı devre dışı bırak ya da tekil çarpıştırıcı silme API'si ekle.
- **Tekrar üretme:** Tutsağı serbest bırak ve hücreye gir: 0,35 m'lik görünmez engel var.
- **Kabul testi:** Serbest bırakmadan sonra hücre içinde physics.resolve oyuncuyu itmiyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 B15 (açık; 11'de yok)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-190.

### G-13 — Ada yapılarında çarpıştırıcı kutuları görselden küçük (colK 0,6–0,9): oyuncu duvarlara gömülebiliyor (düşük)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._place (490-503) ve kurucular (_port 558/567/570/578, _camp 686, _market 905)
- **Kök neden:** Kutunun yarı boyutu model kutusu × colK: kasaba halkasında 0,78, değirmen ve kulede 0,6, kuyu ve çadırda 0,7.
- **Oyuncuya etkisi:** Oyuncu ve kamera bazı yapıların 0,1–1 m içine girebiliyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** colK değerlerini yapı bazında gözden geçir (kapı ve geçitler dar kalmasın); gerekirse yapı başına birden çok kutu kullan.
- **Tekrar üretme:** Tuz Pazarı'nda değirmen ya da kule duvarına doğru yürü.
- **Kabul testi:** Her kasaba yapısında oyuncu kapsülü görsel duvarın en çok 0,15 m içine giriyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #43 (Açık, düşük)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi (C-13) ve I alanının denetçisi (I-13) aynı kusuru bağımsız olarak buldu; C/SYS2 karşı doğrulaması colK 0,6–0,9 değerini doğruladı. Denetçi güveni: yüksek. Bilinen sorun: KI-054.

### G-14 — Büyük adalarda bitki örtüsü 7 000 örnek sınırı nedeniyle seyreliyor (Kadim Tapınak'ta istenen yoğunluğun %26'sı) (düşük)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._vegetation (445)
- **Kök neden:** Örnek sayısı n = min(7000, alan/34·çarpan); büyük adalarda tavan devreye giriyor.
- **Oyuncuya etkisi:** 'Orman içinde devasa tapınak' adası (r 480) seyrek kalıyor. Node hesabı: Timsah Bataklığı %59, Ateş Dağı %65, Buzdişi ve Korsan Mezarlığı %74, Kızıl Kanyon %81.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Tavanı hücre başına bütçeye çevir (ör. 160 m'lik hücre başına sabit sayı) ya da uzak hücreler için düşük ayrıntılı örnek kullan. Zaman dilimli kurulum kare bütçesini zaten koruyor.
- **Tekrar üretme:** Node hesabı: istenen = π·r²·ex·ez/34·çarpan; kadim_tapinak için 26 611 → 7 000.
- **Kabul testi:** Aynı biyomda büyük adaların m² başına örnek yoğunluğu küçük adalarınkiyle ±%20 içinde; 13_donma P01 bütçesi korunuyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Kayıtlı değil
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). G/SYS6 karşı doğrulaması 7 000 örnek sınırının bitki yoğunluğunu kırptığını doğruladı (Buzdişi'nde istenen yoğunluğun %74,5'i kalıyor). Denetçi güveni: kesin. Bilinen sorun: KI-191.

### G-15 — Ada açıklamaları ve özellik bayrakları oyunda karşılıksız (Mercan Halkası 'batık sandıklarla dolu', Gizli Pazar 'yalnızca geceleri kurulan', Gümüş Madeni 'ocakların derinliği', mini/undead bayrakları) (düşük)

- **Dosya ve fonksiyon:** js/world/archipelago.js — UNIQUE tanımları (52, 56-58, 66-68, 146-149) ve POI_ICON (292)
- **Kök neden:** Açıklamalar tasarım niyetini anlatıyor ama kurucular bunları uygulamıyor. Mercan Halkası'nda batık sandık yok, yalnız harabe var. Pazarın çadırları, fenerleri ve alıcısı her saatte duruyor (islands.js:900-911); yalnız kaçakçı diyaloğu saate bakıyor (quests.js:448-452). Maden girişi kapalı bir cephe (islands.js:876-889). `mini: true` ve `undead: true` bayrakları hiçbir yerde okunmuyor. Fener POI'si 'peak' simgesiyle gösteriliyor.
- **Oyuncuya etkisi:** Oyuncunun beklentisi ile içerik uyuşmuyor; harita ve keşif bilgisi güvenilmez hale geliyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Ya içeriği ekle (lagün batıkları, gece kurulan pazar, maden içi) ya da açıklamaları gerçeğe göre düzelt. Kullanılmayan bayrakları uygula ya da kaldır; fener için ayrı bir simge kullan.
- **Tekrar üretme:** Mercan Halkası'nda dal: batık sandık yok. Gizli Pazar'a öğlen git: çadırlar ve 'Sorgusuz Alıcı' hazır bekliyor.
- **Kabul testi:** Her özel ada açıklamasındaki somut öğe oyunda bulunuyor (kontrol listesi); mini/undead bayrakları kodda kullanılıyor ya da kaldırılmış.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Kayıtlı değil
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). G/UC3 ve G/UC6 karşı doğrulamaları açıklamaların oyunda karşılıksız olduğunu doğruladı (ör. Gizli Pazar 'yalnızca geceleri kurulan' ama saat koşulu olmadan kuruluyor; madende ocak içi ya da geçit yok). Denetçi güveni: kesin. Bilinen sorun: KI-192.

### G-M01 — Karaya oturmuş gemi sandığı gövde çarpıştırıcısının içinde kalabiliyor: batıkların yaklaşık %16'sında 'Sandığı aç' istemi hiç çıkmıyor (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._wreck (satır 1001-1022) + islands._interactables (1149-1157) + physics._resolveOnce (js/world/physics.js:142-185)
- **Kök neden:** Gövde rastgele bir yönle döndürülüyor (1009: g.rotation.y = R()*6.28) ve aynı yönle 17×6,4 m'lik bir kutu çarpıştırıcısı alıyor (1018: physics.addBox(x, z, 8.5, 3.2, g.rotation.y, y-2, y+4)). Sandık ise gövdeye göre değil, dünya eksenine göre sabit (x+4, z+2) ofsetle konuyor (1021). Kutunun yerel koordinatında sandık lz = 4·sin(yaw)+2·cos(yaw) noktasında duruyor. |lz| &lt; 1,13 m olduğunda oyuncu (yarıçap 0,33; _resolveOnce onu kutunun dışına itiyor) sandık noktasına etkileşim yarıçapı olan 2,4 m'den (1155) yaklaşamıyor. Kutunun üstü de yürünebilir değil, çünkü groundAt yalnız platformlara bakıyor. Yaw düzgün dağıldığı için olasılık %16,3; v0.3'teki 3×8 m kutuyla (v0.3 islands.js:823) %13,3. Yaw ada RNG akışından geliyor ve bitki örtüsü döngüsü arazi LOD'una göre farklı sayıda sayı tüketiyor (11 #35, G-07). Bu yüzden aynı batık bir kurulumda erişilebilir, başka bir kurulumda erişilemez olabilir. Ayrıca beach_wreck'in f.r'si olmadığından bitki dışlama listesine girmiyor (446); palmiye ve kaya çarpıştırıcıları da gövdenin ve sandığın çevresine düşebiliyor.
- **Oyuncuya etkisi:** En yaygın ada özelliği olan 26 karaya oturmuş geminin beklenen yaklaşık 4'ünde sandık gövdenin içinde ya da altında görünüyor ama açılamıyor. Kaybedilen içerik: 40–110 altın, %60 gümüş külçe, inci ve mücevher, %15 zıpkın, %15 maske, %30 hava kesesi. 26 batıktan en az birinin etkilenme olasılığı yaklaşık %99. Oyuncu ödülü kaybediyor ve 'bozuk sandık' izlenimi ediniyor. Yeniden kurulumda bazen düzelip bazen bozulması hatayı kararsız gösteriyor. Sürüm: v0.3 ve v0.4. 02 ve 11'de kayıt yok. Güven: yüksek. Hesap analitik; hangi batığın etkilendiği kuruluma bağlı.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** Sandığı gövdenin yerel ekseninde ve çarpıştırıcının dışında konumla. Örneğin yerel (0, ±(3.2+1.0)) ya da (±(8.5+1.2), 0) noktasını g.rotation.y ile döndürüp dünya koordinatına çevir. Alternatif olarak sandık noktasının 2,0 m içinde çarpıştırıcısız, yürünebilir bir nokta olduğunu physics.resolve ile doğrula ve gerekirse sandığı kaydır. beach_wreck için bir bitki dışlama yarıçapı tanımla (f.r ≈ 12). Kayıtlar bozulmasın diye sandık kimliği (f.id) değişmesin.
- **Tekrar üretme:** Tarayıcı konsolunda her beach_wreck için şunu çalıştır: `await DK.terrain.prepare(f.x,f.z,{radius:300}); DK.islands._build(I); const b=DK.physics.all.find(c=>c.tag==='isl:'+I.id && c.t==='b' && c.hw===8.5 && Math.abs(c.x-f.x)<0.01 && Math.abs(c.z-f.z)<0.01); const [lx,lz]=DK.physics._local(b,f.x+4,f.z+2);`. |lz| &lt; 1,13 çıkan batıkta oyuncuyu sandığa doğru her yönden yürüt: DK.interact.current hiçbir zaman 'Sandığı aç' olmuyor. Olasılık hesabı için Node betiği: /tmp/denetim_alan/batik_sandik.mjs (v0.4 %16,3; v0.3 %13,3).
- **Kabul testi:** Yeni senaryo: 26 batığın tümü, iki farklı arazi kalitesi ve LOD ile kurulduğunda, sandık noktasının 2,4 m içinde ve tüm çarpıştırıcıların dışında yürünebilir bir nokta bulunur. Oyuncu o noktaya yürüyünce 'Sandığı aç' istemi görünür, ganimet bir kez verilir, ikinci denemede 'Sandık boş.' çıkar.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-089.

### G-M02 — Co-op: ada içeriği yalnız yerel oyuncunun çevresinde kuruluyor; ev sahibinden uzaktaki konuğun adasında ev sahibi otoriteli düşmanlar duvar ve bina çarpıştırıcısı olmadan çalışıyor, konuğun fıçısı ve kaya tuzağı düşmana işlemiyor (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — islands.update (satır 271-301; odak satırı 273) + enemies._populate/update (js/game/enemies.js:1539-1570, 1593, 1604) + hazards.netApply (js/world/hazards.js:672-679)
- **Kök neden:** islands.update kurulacak ve boşaltılacak adayı yalnız G.player konumuna göre seçiyor (273); G.remotes dikkate alınmıyor. Oysa ev sahibinde düşman grupları herhangi bir oyuncunun 140 m yakınında doğuyor (enemies.js:1543-1548; focusPts konukları da içeriyor) ve yapay zekâ yalnız ev sahibinde çalışıyor (1593, 1604); konuk yalnız ara değerleme yapıyor. Ev sahibi o adanın kıyısından BUILD_D (750 m) uzaktaysa, adanın duvar, bina, kale ve hapishane çarpıştırıcıları ile tehlike seti (hazards 'islandBuilt' olayıyla kurulur, 66-71) ev sahibinde hiç yok. Bu durumda düşman hareketi physics.resolve (1090, 1123, 1191), görüş testi lineBlocked (555, 1015) ve mermiler (1531) yalnız araziye çarpıyor. Konuğun 'ignite', 'break' ve 'roll' iletileri ev sahibinde byId'de bulunamadığı için yok sayılıyor (hazards.js:673-674). Düşmana hasar yalnız ev sahibinde uygulandığından (229, 399) bu etkiler hiç işlenmiyor. Tapınağın Taş Muhafız tetikleyicisi de ev sahibindeki islands.temples'a bakıyor (bosses.js:1088). v0.3'te de aynı durum var (v0.3 islands.js:232, enemies.js:1514).
- **Oyuncuya etkisi:** Konuk tek başına bir yere gittiğinde (kayıkla, yüzerek ya da ev sahibi gemiyle uzaklaşınca) hapishane, kale, mezarlık ve harabe gibi yerlerde gardiyanlar ve haydutlar duvarların ve binaların içinden geçiyor. Duvar arkasındaki konuğu görüp ok ve kurşunla vuruyorlar; isabet ev sahibinde hesaplanıp konuğa 'hurt' olarak gidiyor. Konuğun ateşlediği barut fıçısı ve saldığı kaya düşmana hasar vermiyor. Taş Muhafız konuk için doğmuyor. Oyuncular ayrıldığında co-op savaşı ve keşfi tutarsızlaşıyor. Sürüm: v0.3 ve v0.4. 11 #36 yalnız ters yönü anıyor (konukta henüz kurulmamış ada); 02'de kayıt yok. Güven: kod yolu açısından yüksek. Öncelik, oyuncuların ne sıklıkla ayrıldığına göre orta ile yüksek arasında.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Ev sahibinde islands.update aday mesafesini yerel oyuncu ile G.remotes konumlarının en küçüğüne göre hesaplasın. Yalnız uzak bir oyuncunun yakınındaki adalar için en azından çarpıştırıcılar, tehlike seti ve tapınak/hapishane çalışma zamanı durumu kurulsun; bitki ve örnekli görseller atlanabilir. _drop yalnız tüm oyuncular DROP_D dışındayken yapılsın. Bu kurulum zaman dilimli iş kuyruğuna bağlansın (aynı anda en çok bir uzak ada) ve 13_donma ile 09_performans eşikleri korunsun.
- **Tekrar üretme:** tests/harness/coop.cjs ile iki sekme aç; ev sahibi Kırlangıç'ta kalsın. Konukta şunu çalıştır: `await DK.terrain.prepare(-6653,2548,{radius:400}); DK.G.player.pos.set(-6620, DK.terrain.heightAt(-6620,2548)+0.5, 2548)` (Demirkapı avlusu). Birkaç saniye sonra ev sahibinde: `DK.islands.built.has('demirkapi')` → false; `DK.enemies.list.filter(e=>e.group==='demirkapi_prison_0').length` → 5; `DK.physics.all.filter(c=>c.tag==='isl:demirkapi').length` → 0. Konukta bir gardiyanın duvar kutusunun içinden geçtiği ve duvar arkasındaki konuğu hedef aldığı görülüyor. Konuk yakındaki bir kampın fıçısını ateşleyince ev sahibinde `DK.hazards.byId.has(id)` false dönüyor ve 7 m içindeki düşmanın canı değişmiyor.
- **Kabul testi:** Co-op testi: ev sahibi en az 2 km uzaktayken konuk Demirkapı'ya gittiğinde ev sahibinde 'isl:demirkapi' çarpıştırıcıları ve hazards.sets.has('demirkapi') bulunur. 30 sn boyunca hiçbir gardiyanın konumu duvar kutularının içine girmez. Duvar arkasındaki konuk için ev sahibindeki lineBlocked engelli döner. Konuğun ateşlediği fıçı 7 m içindeki düşmanın canını düşürür. 13_donma ve 09_performans eşikleri korunur.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). D alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak kaydetti (D-03 doğrulaması, madde 2: islands.js:273, hazards.js:672-674). Bilinen sorun: KI-090.

---

**5.H Alan H — Düşman AI, boss ve savaş** · 30 denetim maddesi, 4 kaçan madde · varsayılan hedef faz: Faz 7

Denetçi özeti: Kodda 17 düşman türü ve 5 efsanevi boss hem v0.3'te hem v0.4'te aynen var. 17 türün 12'si normal düşman, 1'i mini boss, 4'ü insan boss; hepsinin dünyada doğduğu bir yer var. Görüş konisi, görüş mesafesi, görüş hattı, ses, gece/sis, eğilme, grup alarmı, kuşatma jetonu, siper, geri çekilme ve kaybetme→araştırma→eve dönüş döngüsü kodda mevcut. Ancak otomatik testle sınanan yalnız haydut, ağır zırhlı ve iki insan bossun eşikleri (05_dusman_ai, 18/18). Kalan 13 tür ve 5 efsanevi boss için beklenti içeren test yok. Kod incelemesi ve Node ile yapılan salt-okur ölçümler önemli kusurlar ortaya çıkardı: Kraken dokunacının vuruş hedefi ucun 5–14 m gerisinde olduğu için kılıçla kesme çoğu durumda imkânsız. Dev bossların hasarı vuruş animasyonundan 0,4–0,7 sn, bıçaklama hamlelerininki ~0,3 sn sonra geliyor. Bazı uyarı halkaları gerçek hasar alanından küçük; kaçınılan ya da bloklanan saldırılar yine yavaşlatma ve geri itme uyguluyor; hayvan saldırıları uyarısız ve bloklanamıyor. Ayrıca siper davranışı kendi görüşünü kapatıp pasifleşiyor, Hayalet Kaptan'ın hamle saldırısı hiç tetiklenmiyor, insan bosslar XP vermiyor, gece dalgaları birikebiliyor. Co-op'ta konuk uyarı halkalarını ve ipuçlarını görmüyor, Taş Muhafız sütunları konukta oluşmuyor, konuğun algı değiştiricileri ve zehir/patlama etkileri eşitlenmiyor. Konuktan gelen boss hasarı menzil ve tür doğrulamasından geçmediği için bir boss saniyeler içinde öldürülebiliyor. v0.4, F-01/02/03/05/06(mermi)/07/08/10/11/12/13/15/16, ek-109/110 maddelerini ve D-19'un Yılan/hayalet gemi kısmını düzeltmiş; burada listelenen hataların neredeyse tamamı iki sürümde de var.

