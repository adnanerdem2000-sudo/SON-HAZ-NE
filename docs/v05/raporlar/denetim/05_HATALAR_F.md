# AUDIT_CURRENT §5 — Hatalar: F — Ana hikâye ve görevler

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — F — Ana hikâye ve görevler

### F-01 — Co-op: konuğun eski dünyalardan kalan hikâye bayrakları ev sahibinin kaydına sızıyor; 'gunluk' bayrağı 2. aşamayı kalıcı olarak kilitliyor (kritik)

- **Dosya ve fonksiyon:** js/main.js; js/net/net.js; js/game/quests.js — startOnlineGuest (main.js:193), applyWorld (main.js:336), _hostData case 'story' (net.js:326-332), quests.start (quests.js:79), quests._provide (quests.js:297)
- **Kök neden:** Konuğun kişisel kaydı (dksh.guest.0) quests.save() ile bütün hikâye bayraklarını saklıyor (main.js:203); yeni odada quests.start bu bayrakları yüklüyor (quests.js:79). applyWorld aşamayı ev sahibinden alıyor ama bayrakları Object.assign ile birleştiriyor (main.js:336), bu yüzden eski dünyanın gunluk, ilkHazineBulundu, parca1 ve kizilYenildi bayrakları konukta kalıyor. Konuk bir aşama ilerletince (Tuzla ile konuşma ya da eski ilkHazineBulundu bayrağıyla satış) netStory bütün bayraklarını gönderiyor (quests.js:134, net.js:174). Ev sahibi, aşama kontrolünden önce her true bayrağı kendi quests.flags'ine yazıyor (net.js:329). flags.gunluk hiçbir yerde sıfırlanmıyor; 2→3 geçişi yalnız takeJournal'dan geçiyor, o da yalnız !flags.gunluk iken sunuluyor (quests.js:297-301, :316).
- **Oyuncuya etkisi:** Daha önce başka bir dünyada 3. aşamaya ulaşmış bir konuk, yeni bir dünyada Tuzla ile konuştuğu anda ev sahibinin kaydına gunluk=true yazılır. Ev sahibi 2. aşamaya gelince mağaradaki günlüğü alamaz: kitap masada görünür ama etkileşim istemi çıkmaz, oyun yeniden yüklenince kitap da kaybolur. Hikâye o dünyada 'Eski Günlük'te kalıcı olarak takılır; Morvan ve Kızıl Hançer hiç doğmaz. Ayrıca ilkHazineBulundu sızarsa Martı hazinesi atlanır ve defter hiç boss yenilmeden 2/4 parça gösterir. [Doğrulama eki] Sızan ilkHarita bayrağı ev sahibinde Nevra'nın ilk harita seçeneğini de gizliyor (quests.js:404); bu kilit kalıcı değil, yeniden yüklemede quests.js:91 storySites=['marti_1'] kurduğu için Martı haritasız da kazılabiliyor. Bu ayrıntı önceliği değiştirmiyor.
- **Öncelik:** kritik · hedef faz: Faz 2 + Faz 4
- **Önerilen çözüm:** applyWorld'de bayrakları birleştirmek yerine ev sahibininkilerle değiştir (quests.flags = {...m.quests.flags}). Konuğun kişisel kaydından hikâye alanlarını (stage/flags) çıkar ya da bunları dünya kimliğiyle anahtarla. 'story' iletisini bayrak listesi yerine niyet iletisine çevir ({t:'storyReq', action:'tuzla'|'journal'|'chestSold'}); ev sahibi koşulu kendi durumunda doğrulasın ve yalnız o aşamaya ait beyaz listedeki bayrakları kabul etsin. Bozulmuş kayıtlar için göçte stage&lt;3 && gunluk durumunu onar.
- **Tekrar üretme:** Konuk A ile X'in dünyasında 3. aşamaya gelin; A'nın dksh.guest.0 kaydında flags.gunluk=true olur. A, Y'nin yeni (0. aşamadaki) dünyasına katılıp Tuzla ile konuşsun → Y'de DK.quests.flags.gunluk === true. Y 2. aşamaya gelip Yankı Mağarası'ndaki masaya gitsin: 'Eski günlüğü al' istemi çıkmaz. Mantık kopyası: node /tmp/denetim_alan/flag_chain.mjs (ev sahibi bayrakları sızar; aşama 2'de istem false; defter 2/4).
- **Kabul testi:** Yeni bir 2 oyunculu co-op testi: konuğun dksh.guest.0 kaydına {quests:{stage:5, flags:{gunluk:true, ilkHazineBulundu:true, parca1:true, kizilYenildi:true}}} yazılır; konuk 0. aşamadaki odaya katılıp Tuzla ile konuşur. Beklenen: ev sahibinde stage 1, flags'te yalnız 1. aşamaya ait bayraklar; 2. aşamada günlük istemi görünür; defter 0/4 gösterir; bozuk eski kayıt göçle onarılır.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** Belgelenmemiş; 09_KAYIT_TESTLERI.md:21'deki 'bayraklar ev sahibinden gelir' iddiasıyla çelişiyor
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: Zincir kodda birebir doğrulandı. Konuk kaydı quests.save() içeriyor (main.js:203). Katılımda guest.quests yükleniyor (main.js:193) ve quests.start flags=d.flags yapıyor (quests.js:79). applyWorld aşamayı ev sahibinden alıyor ama bayrakları Object.assign ile birleştiriyor (main.js:336). Konuk advance() yapınca netStory tüm bayrakları taşıyor (quests.js:134) ve ileti ev sahibine gidiyor (net.js:174). Ev sahibi her true bayrağı aşama denetiminden ÖNCE yazıyor (net.js:329, denetim :330), bu yüzden reddedilen iletiler de bayrak sızdırıyor. gunluk hiçbir yerde false yapılmıyor (yalnız quests.js:90/297/305, net.js:568, main.js:336). 2→3 geçişi yalnız takeJournal'da (quests.js:316), o da yalnız _provide'dan (297-301) çağrılıyor; panels.js:97 'Günlüğü oku' takeJournal'ı çağırmıyor, yalnız varlığını sınıyor. Ev sahibinin 'story' işleyicisi journalMesh'i güncellemiyor (net.js:326-332; güncelleyenler yalnız istemci işleyicisi net.js:568 ve applyWorld) → kitap görünür kalıyor, yeniden yüklemede quests.js:90 gizliyor. Parça sayacı bayraklardan hesaplanıyor (journal.js:114) → 2/4. chestSold satan konukta yayılıyor (shop.js:150, :160), bu yüzden eski ilkHazineBulundu bayrağıyla advance(2) de mümkün. v0.3'te konuk kaydı yalnız envanter (v0.3 main.js:191, :201) ve konuğun netStory'si yutuluyor (v0.3 net.js:146) → hata yalnız v0.4'te. 'kritik' öncelik savunulabilir: kayda yazılan, oyun içinden geri alınamayan kalıcı bir hikâye kilidi. Düzeltme/ek: Ek bilgi: Sızan ilkHarita bayrağı ev sahibinde Nevra'nın ilk harita seçeneğini de gizliyor (quests.js:404). Ancak bu kilit kalıcı değil: yeniden yüklemede quests.js:91 storySites=['marti_1'] kurduğu için Martı haritasız da kazılabiliyor. Bu ayrıntı önceliği değiştirmiyor. (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-013.

### F-02 — Hikâye bossunun doğuş bayrağı (morvanSpawn/kizilSpawn) kayda yazılıyor; boss alanının 200 m içinde yüklenen oyunda Morvan ya da Kızıl Hançer doğmuyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js — update (276-290), save (121-124), start (76-79)
- **Kök neden:** 'Boss bu oturumda doğdu' bilgisi kalıcı flags nesnesinde tutuluyor ve save() ile kayda yazılıyor. Yüklemede enemies.start düşman listesini boşaltıyor (enemies.js:1311-1317) ama bayrak true kalıyor. Bayrağı sıfırlayan tek koşul 'boss yok VE oyuncu 200 m'den uzak' (quests.js:282, :290); tetik yarıçapı ise 45/50 m. Kemik Adası'nın yarıçapı 135 m olduğundan sıfırlama için adayı tamamen terk etmek gerekiyor.
- **Oyuncuya etkisi:** Boss dövüşü sırasında otomatik kayıt (2 dakikada bir, game.js:218) ya da sekme kapanışı/menüye dönüş kaydı (main.js:383-385) alınır. [Doğrulamayla düzeltildi] Ölüm yolu yanlış: ölüm ekranı yalnız 'Gemide uyan' ve 'Kırlangıç Limanı'nda uyan' seçeneklerini sunuyor (menu.js:360-366), oyun yeniden yüklenmiyor ve grubu olmayan boss enemies.list'te canlı kalıyor. Hata yalnız bayrak true iken boss alanının 200 m içinde alınmış bir kayıt yeniden yüklenince çıkar (savaş sırasındaki otomatik kayıttan sonra menüye çıkış ya da sekmenin kapanması, veya adaya yakın gemide uyanıp oyundan çıkma); bu durumda oyuncu harabede/kampta başlar ve boss doğmaz. HUD yıldızı aynı yeri göstermeye devam eder, hiçbir ipucu yoktur; oyuncu ana hikâyenin bozulduğunu düşünür. [Doğrulama düzeltmesi] Öncelik orta: ilerleme kaybı yok; oyuncu 200 m uzaklaşınca (ör. limana dönünce) bayrak kendiliğinden sıfırlanıyor. Geçici ve ipucusuz bir yumuşak kilit.
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 6 (+Faz 4)
- **Önerilen çözüm:** Doğuş bayraklarını kalıcı flags'ten çıkarıp oturumluk bir alana taşı (ör. this.spawned, kayda yazılmaz) ya da start()'ta morvanSpawn/kizilSpawn'ı false yap. Daha sağlam çözüm: bayrağa değil, enemies.list'te canlı boss olup olmadığına bak ve yoksa yeniden doğur.
- **Tekrar üretme:** 3. aşamadaki bir kayıtla Kemik Harabeleri'ne (-520,-440) git; Morvan doğsun. Esc → Kaydet (ya da 2 dk bekle), menüye dön, kaydı yükle. Harabede 10 dk bekle: Morvan doğmaz (DK.quests.flags.morvanSpawn === true, DK.enemies.list'te iskelet_kaptan yok). 210 m uzaklaşıp dönünce doğar. Mantık kopyası: node /tmp/denetim_alan/reload_flag.mjs.
- **Kabul testi:** Etiketli test: flags.morvanSpawn=true olan 3. aşama kaydı harabe merkezinde yüklenince 2 sn içinde iskelet_kaptan doğar; aynı kontrol 4. aşama ve kamp için de geçer; kayıt verisinde doğuş bayrağı bulunmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş (01_ILK_DENETIM_RAPORU.md:227 'uzaklaşınca sıfırlanıp yeniden doğuyor' diyor; yükleme durumu atlanmış)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Mekanizma doğru. morvanSpawn ve kizilSpawn kalıcı flags nesnesinde tutuluyor (quests.js:277, :284) ve save() ile kayda yazılıyor (quests.js:123). Yüklemede bayrak geri geliyor (quests.js:79), ama enemies.start düşman listesini boşaltıyor (enemies.js:1311-1322; v0.3'te enemies.js:1290-1298 aynı). Bayrağı sıfırlayan tek koşul 'boss yok ve oyuncu 200 m'den uzak' (quests.js:282, :290). Kemik Adası yarıçapı 135 m ve merkezi harabeyle aynı nokta (-520,-440) (worldData.js:21-23); kamp (-40,-228). Kayıt yolları: 120 sn'de bir otomatik kayıt (game.js:218), menüye dönüş (main.js:218), beforeunload ve visibilitychange (main.js:382-385). saveNow savaş durumuna bakmıyor (main.js:199-214). v0.3 quests.js aynı kodu taşıyor. Düzeltme/ek: (1) 'Oyuncu ölüp menüden Devam Et derse' yolu yanlış. Ölüm ekranı yalnız 'Gemide uyan' ve 'Kırlangıç Limanı'nda uyan' seçeneklerini sunuyor (menu.js:360-366); oyun yeniden yüklenmiyor. Grubu olmayan boss enemies.list'te canlı kalıyor ve oyuncu dönünce yerinde duruyor. Hata yalnız bayrak true iken boss alanının 200 m içinde alınmış bir kayıt yeniden yüklenince çıkar: savaş sırasındaki otomatik kayıttan sonra menüye çıkış ya da sekmenin kapanması, veya adaya yakın gemide uyanıp oyundan çıkma. (2) Öncelik 'orta' olmalı: ilerleme kaybı yok; oyuncu 200 m uzaklaşınca (örneğin limana dönünce) bayrak kendiliğinden sıfırlanıyor. Bu geçici ve ipucusuz bir yumuşak kilit. Kök neden ve önerilen çözüm doğru. (uygulanan alanlar: oyuncuya etkisi, öncelik) Denetçi güveni: yüksek. Bilinen sorun: KI-079.

### F-03 — Ana hikâye 5. aşamada çıkmaz sokakta bitiyor: metin kalan parçaları mevcut bosslara işaret ediyor ama aradaki bağ, 6–10. aşamalar ve final yok (yüksek)

- **Dosya ve fonksiyon:** js/game/quests.js; js/game/bosses.js; js/ui/panels.js — STORY (quests.js:24-31), dialog 'quest' st≥5 (quests.js:358), _wire (quests.js:137-200), bosses.victory (bosses.js:1066-1075)
- **Kök neden:** STORY'nin 6. girdisinin ('yitik') hedefi yalnız metin; 5. aşama için hiçbir tetikleyici yok (update yalnız 3. ve 4. aşamayı işliyor, 276-290). quests 'bossDefeated' olayını dinlemiyor. hud.storyTarget 5. aşamada ve sonrasında null (hud.js:458).
- **Oyuncuya etkisi:** Kızıl Hançer yenildikten sonra oyuncu 'kalan parçalar ateşin bekçisi ve buzların altındaki kraliçede' bilgisini alıyor (panels.js:98, quests.js:358). Bunlar tam olarak Volkanik Dev'in ve Derinlik Yılanı'nın unvanları (bosses.js:26, :29) ve oyuncu bu bossları yenebiliyor — ama hiçbir şey olmuyor. Hedef metni bu bölgelerin 'bir sonraki geliştirme aşamasında açılacağını' söylüyor, oysa bölgeler zaten açık. Hikâye 2/4 parçada ve finalsiz bitiyor; Son Hazine bulunamıyor.
- **Öncelik:** yüksek · hedef faz: Faz 6
- **Önerilen çözüm:** Faz 6'da 6–10. bölümleri veri güdümlü olarak ekle (bkz. requirements planı). Ara çözüm: 5. aşama metnini düzelt ('Kül Adaları'ndaki Ateş Dağı'nı ve Buzul Denizi'ndeki Derin Yarık'ı araştır'), bossDefeated olayını parça 3/4 ve 4/4'e bağla, mevcut kayıtlar için bosses.defeated'tan geriye dönük parça ver.
- **Tekrar üretme:** 4. aşamada Kızıl Hançer'i yen → 5. aşama. Tuzla ile konuş. DK.bosses.spawn('volkanik_dev') ile bossu doğurup yen → DK.quests.stage 5'te kalır, bayraklar değişmez, defter 2/4 gösterir.
- **Kabul testi:** 5. aşamada Volkanik Dev ile Derinlik Yılanı yenilince parça 3/4 ve 4/4 verilir ve aşama ilerler. Önceden yenilmiş bosslar bölüm açıldığında geriye dönük işlenir. Hikâye bir final karşılaşması ve 'tamamlandı' bayrağıyla biter; bunların hepsi etiketli testlerle sınanır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** docs/13_BILINEN_HATALAR.md #1 (yalnız v0.3 listesi); docs/denetim/11 ve denetim/14'te yok
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: STORY dizisi 6 girdiden oluşuyor (quests.js:24-31) ve 'yitik' aşamasının tetikleyicisi yok; update yalnız 3. ve 4. aşamayı işliyor (quests.js:276-290). quests 'bossDefeated' olayını dinlemiyor; tek dinleyici progress.js:77. storyTarget st≥5 için null döndürüyor (hud.js:452-459; return satır 459'da, 458'de değil). Mektup ve Tuzla metni (panels.js:98, quests.js:358) Volkanik Dev ile Derinlik Yılanı'nın unvanlarıyla eşleşiyor (bosses.js:26, :29). Bölgeler açık (archipelago.js:11, :13); Node çıktısında BOSS_SITES volkanik_dev (7700,-900) ve derinlik_yilani (1300,-8080) olarak var. Final için oyun nesnesi yok: 'legend' kademesi yalnız items.js:104 ve treasure.js:22'de tanımlı, hiçbir spawnChest çağrısı bu kademeyi kullanmıyor. journal.js:116 oyuncuya 6–10. aşamaların sonraki sürümde geleceğini zaten söylüyor. v0.3'te aynı; quests.js'deki tek fark aşçı seçeneği. 'yuksek' öncelik ve 'eksik' niteliği uygun. Denetçi güveni: kesin. Bilinen sorun: KI-026.

### F-04 — Co-op: hikâye bossu tetikleyicileri yalnız yerel oyuncunun konumuna bakıyor; konukta sahte bir boss doğup anlık görüntüyle siliniyor, ev sahibi yaklaşmadan Morvan/Kızıl Hançer doğmuyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js; js/game/enemies.js — quests.update (246-291), enemies.spawnBoss (1331-1336), enemies.applySnapshot (1650-1660)
- **Kök neden:** quests.update her istemcide çalışıyor (game.js:212) ve yalnız G.player'a bakıyor (quests.js:247, :276, :283); ev sahibinde konukların konumu hiç sorgulanmıyor. Konukta enemies.spawnBoss yerel bir düşman yaratıyor; bu düşman ev sahibinin 7,5 Hz'lik düşman anlık görüntüsünde bulunmadığı için en geç ~0,13 sn içinde siliniyor.
- **Oyuncuya etkisi:** Ev sahibi gemide ya da limanda kalıp konuklar Kemik Harabeleri'ne veya kampa giderse, konuklar 'Morvan uyandı!' bildirimini, boss sesini ve macera günlüğü kaydını görür ama boss bir an sonra kaybolur. Konuğun morvanSpawn bayrağı true kaldığı için 200 m uzaklaşmadan yeniden denenmez. Boss ancak ev sahibi 45/50 m yaklaşınca doğar.
- **Öncelik:** orta · hedef faz: Faz 6 (+Faz 5)
- **Önerilen çözüm:** Hikâye tetikleyicilerini yalnız ev sahibinde (ya da tek oyunculuda) çalıştır ve bütün oyuncu konumlarını (G.player + G.remotes) değerlendir. Konukta spawnBoss çağrısını engelle; bildirimi ev sahibi yayınlasın.
- **Tekrar üretme:** 2 oyunculu odada 3. aşama: ev sahibi limanda beklesin, konuk (-520,-440)'a ışınlansın. Konukta bildirim gelir; ≤0,2 sn sonra DK.enemies.list'te iskelet_kaptan yoktur; ev sahibinde de yoktur.
- **Kabul testi:** Co-op testi: yalnız konuk 45 m'ye girdiğinde ev sahibinde iskelet_kaptan doğar ve konuğun anlık görüntüsünde görünür; konukta yerel boss nesnesi oluşmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının karşı doğrulayıcısı (F-M02) ve H alanının denetçisi (H-18) aynı kusuru bağımsız olarak buldu. Denetçi güveni: yüksek. Bilinen sorun: KI-080.

### F-05 — Co-op: 1→2 geçişini sağlayan 'chestSold' olayı ağda yok; Martı hazinesi konuk oturumdayken bulunduysa konuğun satışı hikâyeyi ilerletmiyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js; js/economy/shop.js — _wire chestSold ve treasureFound (quests.js:138-147); shop.sellCarriedChest (137-152), shop.sellHoldChests (156-166)
- **Kök neden:** chestSold yalnız satışı yapan istemcide yerel olarak yayılıyor (shop.js:150, :160). ilkHazineBulundu bayrağı ev sahibinde treasureFound ile kuruluyor (resolveDig ev sahibinde çalışıyor) ve konuğa yayınlanmıyor; netStory yalnız advance ve takeJournal'da gönderiliyor.
- **Oyuncuya etkisi:** HUD herkese 'Sedef Hanım'a sat' diyor. Konuk sandığı taşıyıp satarsa sandık harcanır ama hikâye 1. aşamada kalır; ev sahibinin başka bir sandık satması gerekir ve oyun bunu söylemez.
- **Öncelik:** orta · hedef faz: Faz 6 (+Faz 2)
- **Önerilen çözüm:** Konuğun satışında ev sahibine bir 'storyReq: chestSold' niyeti gönder ya da satışı ev sahibinde doğrula. ilkHazineBulundu kurulduğunda netStory yayınla.
- **Tekrar üretme:** Co-op, 1. aşama: konuk Nevra'dan haritayı alsın, Martı Adacığı'nda kazsın (sonucu ev sahibi çözer), sandığı limana taşıyıp Sedef Hanım'a satsın → ev sahibinde de konukta da stage 1 kalır.
- **Kabul testi:** Co-op testi: konuğun satışından sonra hem ev sahibinde hem konukta stage 2 olur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (F-M03). Denetçi güveni: yüksek. Bilinen sorun: KI-081.

### F-06 — Ev sahibi, konuktan gelen 'story' iletisini yalnız '+1 aşama' kuralıyla doğruluyor: ön koşul yok, bayraklar koşulsuz birleşiyor, üst sınır yok (6. aşama ve sonrasında TypeError) (orta)

- **Dosya ve fonksiyon:** js/net/net.js; js/game/quests.js — _hostData case 'story' (net.js:326-332); quests.advance (quests.js:127-135)
- **Kök neden:** İşleyici num(m.stage, 0, 99) ile 0–99 arasını kabul ediyor ve aşamaya ait koşulu (Morvan öldü mü, günlük alındı mı) denetlemiyor; bayrakları aşama kontrolünden önce birleştiriyor. advance, STORY[to] tanımsızken s.title'ı okuyor (quests.js:130-132).
- **Oyuncuya etkisi:** window.DK konsolu açık olduğundan (main.js:134) değiştirilmiş bir konuk (ör. DK.quests.advance ya da DK.net.toHost'u art arda çağırarak) ev sahibinin hikâyesini saniyeler içinde 5. aşamaya taşıyabilir: Morvan ve Kızıl Hançer dövüşleri atlanır, ev sahibi 4×150 XP alır. Aşama 6–99'a da çıkarabilir; bu durumda advance istisna fırlatır ama stage yine de kaydedilir, ileride 6–10 eklendiğinde bu kayıtlar içeriği atlar. Sınırsız kazanç yok (XP 5. aşamada durur).
- **Öncelik:** orta · hedef faz: Faz 2
- **Önerilen çözüm:** 'story' iletisini F-01 ile birlikte niyet tabanlı yap; ev sahibi koşulu kendi dünyasında doğrulasın. to ≤ STORY.length-1 sınırı ekle; advance'te STORY[to] yoksa erken dön; bayrakları yalnız beyaz listeden ve koşul sağlandıktan sonra kabul et.
- **Tekrar üretme:** Konuk konsolunda ev sahibinin aşamasına göre art arda DK.net.toHost({t:'story', stage: &lt;ev sahibi aşaması+1>, flags:{}}) gönder → ev sahibinde DK.quests.stage 5'i aşar; konsolda "Cannot read properties of undefined (reading 'title')". Node: /tmp/denetim_alan/story_probe.mjs çıktısı STORY.length=6, STORY[6]=undefined ve aynı TypeError'ı gösterir.
- **Kabul testi:** 06a_ag_guvenligi'ne ek kontroller: önceki aşamanın koşulu sağlanmadan gelen 'story' iletisi reddedilir; stage>5 ya da +2 atlama reddedilir; istisna oluşmaz.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** Belgelenmemiş (B05 düzeltmesinin yan etkisi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). B alanının denetçisi aynı kusuru bağımsız olarak buldu (B-12, doğrudan doğrulandı); E-03 doğrulaması son aşamada stage+1'in TypeError ürettiğini doğruladı (quests.js:130-132). Denetçi güveni: yüksek. Bilinen sorun: KI-017.

### F-07 — 1. aşamada Martı sandığını açan oyuncu yönlendirilmiyor; 2. aşama yalnız kapalı sandığın satışıyla açılıyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js — _wire chestSold (143-147) ve treasureFound (138-142)
- **Kök neden:** advance(2) yalnız chestSold olayına bağlı; chestOpened (treasure.js:491) dinlenmiyor. Bildirim yalnız 'Sedef Hanım'a sat' diyor (quests.js:140). G.storySites boşaltıldığı ve harita harcandığı için Martı yeniden kazılamıyor.
- **Oyuncuya etkisi:** Yeni oyuncu sandığı açarsa (E basılı tut) hikâye takılır. İlerlemek için 150 altına rastgele harita alıp başka bir sandık bulmak ve onu satmak gerektiğini oyun hiçbir yerde söylemez; ilk 10 dakikada terk etme riski doğar.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** chestOpened olayını dinle: stage===1 && ilkHazineBulundu ise ya ganimetin Sedef Hanım'a satışını ilk satış say ya da açık bir yönlendirme göster ve Nevra'dan ücretsiz yeni harita ver.
- **Tekrar üretme:** Yeni oyun → Tuzla → Nevra → Martı Adacığı'nda kaz → sandığı aç → stage 1'de kalır; HUD hâlâ 'Sedef Hanım'a sat' der.
- **Kabul testi:** Etiketli test: sandık açılınca 3 sn içinde yönlendirme bildirimi gelir ve bir ilerleme yolu vardır (2. aşamaya geçiş ya da ücretsiz harita).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI.md §4 G_icerik önerisi (satır 1658: 'Hikâye 1. aşamada sandığı açan oyuncuya yönlendirme')
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-082.

### F-08 — Hikâye bossları (Morvan, Kızıl Hançer) ve Hayalet Kaptan öldürme XP'si vermiyor; tanımlı xp değerleri ölü veri (düşük)

- **Dosya ve fonksiyon:** js/game/progress.js; js/game/enemies.js — progress.init içindeki enemyKilled dinleyicisi (progress.js:75); ENEMY_TYPES (enemies.js:111-116, :138-143, :171-176)
- **Kök neden:** progress.js:75'teki 'if (T && !T.boss)' koşulu, efsanevi bossların +600 XP'si bossDefeated'dan gelsin diye boss bayraklı bütün düşmanları XP dışında bırakıyor. Hikâye bossları ve Hayalet Kaptan bossDefeated yaymadığı için hiç öldürme XP'si almıyor.
- **Oyuncuya etkisi:** 800 canlı Morvan toplam yalnız 150 XP veriyor (aşama ödülü); sıradan bir Haydut Kaptanı 120 XP, 1000 canlı Hayalet Kaptan ise 0 XP. Hikâyenin doruk anlarında ödül hissi zayıf kalıyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Yalnız efsanevi bossları (bosses.js sınıfları) XP dışında bırak; hikâye bossları ve Hayalet Kaptan için xp·2 ya da sabit bir boss ödülü ver.
- **Tekrar üretme:** DK.progress.xp değerini oku → DK.enemies.spawn('iskelet_kaptan', x, z).applyDamage(99999, {}) → xp değişmez (3. aşamada değilsen).
- **Kabul testi:** Etiketli test: Morvan öldürülünce xp, aşama ödülü hariç en az 400 artar; efsanevi bosslarda çift XP oluşmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş (01. belge :207 boss tiplerinin XP'den dışlanmasını doğru kabul ediyor)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). H alanının denetçisi aynı kusuru bağımsız olarak buldu (H-21); H/DOC1 karşı doğrulaması boss kartlarındaki XP değerlerinin oyunda verilmediğini doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-083.

### F-09 — Hikâye metni ile oyun durumu uyumsuz: Kızıl Hançer yenildikten sonra da düşman gemisi 'Kızıl Hançer'in korsanları'; mektup 'alındı' deniyor ama yerdeki kesede; 4. aşama bildirimi Tuzla'ya yönlendirirken HUD kampı gösteriyor (düşük)

- **Dosya ve fonksiyon:** js/game/events.js; js/game/quests.js; js/game/enemies.js; js/ui/hud.js — events.spawnEnemyShip (events.js:273); quests._wire enemyKilled (quests.js:180, :188); ENEMY_TYPES.kizil_hancer.loot (enemies.js:115); hud.storyTarget (hud.js:457)
- **Kök neden:** Olay metinleri hikâye durumunu okumuyor. Mektup ganimet tablosundan keseye düşüyor ve doğrudan çantaya verilmiyor; kesenin ömrü 10 dakika (treasure.js:179).
- **Oyuncuya etkisi:** Anlatı tutarlılığı bozuluyor. Mektup kesesi toplanmazsa 10 dakika sonra kayboluyor ve mektup okunamıyor (ilerlemeyi engellemiyor).
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** events.js:273'teki metni flags.kizilYenildi'ye göre değiştir; kizil_mektup'u da harita parçası gibi doğrudan çantaya ekle; 4. aşama bildirimini HUD hedefiyle uyumlu yap.
- **Tekrar üretme:** 5. aşamada DK.events.trigger('enemyShip') → bildirim hâlâ Kızıl Hançer'i anıyor. Kızıl Hançer'i öldür, keseyi alma, 10 dk bekle → mektup yok.
- **Kabul testi:** 5. aşamadan sonra düşman gemisi bildirimi farklı bir metin gösterir; Kızıl Hançer ölünce çantada kizil_mektup bulunur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-184.

### F-10 — Görev panosu sınırlı ve gevşek: 8 sabit şablon tükenince pano kalıcı olarak boşalıyor; konum koşulları sayılmıyor; post görevi postu tüketmiyor; keşif/toplama görevleri kabul anında tamamlanıyor (düşük)

- **Dosya ve fonksiyon:** js/game/quests.js — SIDE_TEMPLATES (33-42), boardQuests (231-235), acceptSide (236-244), _wire enemyKilled/itemsGained (173-174, 192-195)
- **Kök neden:** Şablonlar tek seferlik: 'completed' başlığa göre süzülüyor ve boardSeed hiç değişmiyor. 'kill' sayacı yalnız türün başına bakıyor (e.type.startsWith('iskelet')); ada ya da çete denetimi yok. 'collect' ilerlemesi envanter sayısından okunuyor; teslim ya da tüketim yok.
- **Oyuncuya etkisi:** Oyunda en fazla 8 yan görev var; sonra pano sonsuza dek 'Şimdilik yeni ilan yok' diyor. 'Kemik Adası'nda 5 iskelet' görevi herhangi bir yerdeki iskeletlerle (Morvan dâhil) tamamlanıyor. Zaten keşfedilmiş İkiz Resifi görevi kabul anında 110 altın veriyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Günlük ve bölgesel olarak yenilenen bir şablon havuzu kur; kill/collect görevlerine konum ve teslim koşulu ekle, teslimde eşyayı al; hikâye bölümlerine bağlı yan görevler ekle.
- **Tekrar üretme:** DK.quests.boardQuests() → 4 ilan; 8 görevi bitir → liste boş. İkiz Resifi keşfedilmişken 'Resif Haritası'nı kabul et → anında ödül.
- **Kabul testi:** Pano her oyun gününde yenilenir ve en az 3 bölgesel şablon içerir; konum koşulu etiketli testle sınanır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-185.

### F-11 — Co-op: hikâye ödül eşyaları (harita parçaları) yalnız ev sahibinin çantasına gidiyor; konuk günlüğü alınca ev sahibinin masasında kitap görünür kalıyor (düşük)

- **Dosya ve fonksiyon:** js/game/quests.js; js/net/net.js — _wire enemyKilled (quests.js:177, :184; G.player.inv.add); _hostData case 'story' (net.js:326-332)
- **Kök neden:** Ödül G.player'a, yani ev sahibine yazılıyor; öldüren oyuncuya ya da bütün tayfaya dağıtılmıyor. Ev sahibi işleyicisi bayrağı birleştiriyor ama journalMesh.visible'ı güncellemiyor (konuk tarafı net.js:568'de güncelliyor).
- **Oyuncuya etkisi:** Konuk Morvan'ı yense de parça ev sahibinde kalıyor; parçalar ileride bir birleştirme mekaniğinde kullanılırsa konuklar eksik kalır. Ev sahibi, alınmış günlüğü masada görüyor ama alamıyor.
- **Öncelik:** düşük · hedef faz: Faz 6
- **Önerilen çözüm:** Hikâye eşyalarını bütün tayfaya netGive ile dağıt (ya da paylaşımlı bir hikâye envanteri kullan); ev sahibi 'story' işleyicisinde journalMesh.visible = !flags.gunluk yap.
- **Tekrar üretme:** Co-op, 3. aşama: konuk Morvan'ı öldürsün → DK.G.player.inv.count('harita_parcasi') konukta 0, ev sahibinde 1.
- **Kabul testi:** Co-op testi: her oyuncunun çantasında parça bulunur; günlük alınınca kitap iki tarafta da gizlenir.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş (eşya kısmı v0.3'te de var; kitap görünürlüğü kısmı v0.4'teki B05 düzeltmesiyle ortaya çıktı)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Kitap kısmı (konuk günlüğü alınca ev sahibinde kitap görünür kalıyor) F-01 ve F/DOC3 karşı doğrulamalarında doğrulandı; harita parçalarının yalnız ev sahibine gitmesi ayrıca sınanmadı. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-186.

### F-M01 — Co-op: konuğun 'öldür' türü yan görevleri (Kemiklerin Huzuru, Kızıl Tehdit) hiç ilerlemiyor; v0.4'te kalıcı konuk kaydı bu görevlerle 4 görev yuvasını kilitliyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js; js/game/enemies.js; js/net/net.js; js/main.js — quests._wire 'enemyKilled' (quests.js:171-191) ve 'treasureFound' (138-142), quests.acceptSide (236-244), Enemy.hurt konuk dalı (enemies.js:358-361), Enemy.die (enemies.js:458-484), enemies.update (1604-1605), handlers.saveNow konuk dalı (main.js:203), startOnlineGuest (main.js:193)
- **Kök neden:** enemyKilled yalnız die() çalışan istemcide, yani ev sahibinde yayılıyor (enemies.js:483). Konukta hurt() hasarı netHurtEnemy ile ev sahibine gönderip çıkıyor (enemies.js:358-361); konuk düşmanları yalnız _interp ile izliyor (enemies.js:1604-1605). Ev sahibinden konuğa öldürme bilgisi taşıyan bir ileti yok; net.js'de yalnız XP iletiliyor (netXp, satır 149). Bu yüzden konukta quests._side('kill', …) ve stats.kills hiç işlenmiyor. treasureFound da yalnız ev sahibinde çözülüyor (treasure.js:207-211, 237). acceptSide görev türüne bakmıyor, görevi bırakma seçeneği yok ve en çok 4 yan görev alınabiliyor (quests.js:237). v0.4 konuk kaydı yan görevleri saklıyor (main.js:193, :203).
- **Oyuncuya etkisi:** Konuk panodan 'Kemiklerin Huzuru'nu (5 iskelet) ya da 'Kızıl Tehdit'i (4 haydut) alırsa, son vuruşu kendisi yapsa bile ilerleme 0'da kalır ve ödül hiç gelmez. v0.4'te görev konuk kaydında kalıcı olduğu için her yeni oturumda yuvayı işgal etmeye devam eder; bırakma seçeneği olmadığından yuvalar dolar. Konuğun 'Kemik Kıran', 'Morvan'ın Sonu', 'Hançeri Kıran' ve 'İlk Kürek' başarımları da hiç açılmaz. Hata v0.3'te de var (orada oturumla sıfırlanıyordu); v0.4'te kalıcılıkla ağırlaştı. denetim/02 ve 11'de kaydı bulunamadı.
- **Öncelik:** orta · hedef faz: Faz 5 (+Faz 6)
- **Önerilen çözüm:** Ev sahibi die() sonrasında öldürme bilgisini yaysın: {t:'kill', type, by} iletisi öldürene, tercihen tüm tayfaya gitsin; konuk bunu alınca stats.kills ve _side('kill') işlesin. Kazı yapan konuğa {t:'found', site, tier} gönderilsin. Korsan Defteri'ne 'görevi bırak' seçeneği eklensin ve kalıcı kayıttaki tamamlanamayan görevler bir göçle temizlensin.
- **Tekrar üretme:** 2 oyunculu co-op kurun. Konuk limandaki panodan 'Kemiklerin Huzuru'nu alsın ve Kemik Adası'nda 5 iskeleti son vuruşu kendisi yaparak öldürsün. Konukta DK.quests.side.find(q=>q.id==='iskelet_av').progress === 0 kalır; ev sahibinde DK.quests.stats.kills.iskelet ≥ 5 olur. Konuk çıkıp yeniden katılınca görev hâlâ listededir (dksh.guest.0 → quests.side).
- **Kabul testi:** Yeni co-op senaryosu (örn. coop/06e): konuk öldür türü görevi alır ve son vuruşu kendisi yapar → görev 5/5 tamamlanır, ödül bir kez verilir. Konuk kazı yapınca konukta stats.treasures artar. Görev defterden bırakılabilir ve kayıt/yükleme sonrasında listede görünmez.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-084.

### F-M02 — Co-op: hikâye bossu tetikleyicisi yalnız ev sahibinin konumuna bakıyor; harabeye ya da kampa yalnız giden konukta sahte bir Morvan/Kızıl Hançer doğup anında siliniyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js; js/game/enemies.js — quests.update hikâye tetikleyicileri (quests.js:246-247, 275-290), enemies.spawnBoss (enemies.js:1331-1336), enemies.applySnapshot (enemies.js:1650-1660)
- **Kök neden:** quests.update her istemcide çalışıyor ve yalnız yerel G.player konumuna bakıyor (quests.js:247, 276, 283). Ev sahibi konukların konumunu hiç denetlemiyor; oysa efsanevi bossların _check'i G.remotes'u da tarıyor (bosses.js:1080). enemies.spawnBoss'ta ev sahibi denetimi yok, bu yüzden konukta yerel kimlikli bir boss yaratılıyor. Bu boss ev sahibinin listesinde olmadığı için bir sonraki düşman anlık görüntüsünde (net.js:741, iki anlık görüntüde bir) applySnapshot tarafından siliniyor.
- **Oyuncuya etkisi:** Konuk tek başına Kemik Harabeleri'ne (4. aşamada kampa) giderse 'Yer sarsılıyor… İskelet Kaptan Morvan uyandı!' bildirimi ve boss sesi çıkar, macera günlüğüne 'karşılaşıldı' yazılır (time.js:56), boss bir an görünüp kaybolur. Konuğun yerel morvanSpawn bayrağı 200 m uzaklaşana kadar true kalır. Gerçek boss ancak ev sahibi 45/50 m içine gelince doğar; yani 3. ve 4. aşamalar konuk tarafından ilerletilemez ve oyuncu hikâyenin bozulduğunu düşünür. v0.3'te ve v0.4'te aynı.
- **Öncelik:** orta · hedef faz: Faz 6 (+Faz 5)
- **Önerilen çözüm:** Hikâye tetikleyicilerini yalnız ev sahibinde çalıştırın (if (G.online && !G.isHost) return) ve [G.player, ...G.remotes.values()] konumlarından herhangi biri yarıçap içindeyse bossu doğurun. enemies.spawnBoss konukta hiçbir şey yaratmasın; bildirim ev sahibinin 'bossSpawn' yayınıyla herkese gitsin. Not: denetçinin orta düzey F-04/F-05 maddelerinden biri bunu kapsıyorsa birleştirilmeli.
- **Tekrar üretme:** 2 oyunculu co-op kurun; ev sahibinde DK.quests.advance(3) çalıştırın (yayınla konuk da 3. aşamaya geçer). Ev sahibi limanda kalsın, konuk (-520,-440)'a ışınlansın. Konukta bildirim çıkar, DK.enemies.list kısa süre iskelet_kaptan içerir ve yaklaşık 0,2 sn sonra boşalır. Ev sahibinin DK.enemies.list'inde iskelet_kaptan yoktur ve DK.quests.flags.morvanSpawn false kalır.
- **Kabul testi:** Co-op testi: ev sahibi uzaktayken konuk 45 m içine girer → 2 sn içinde ev sahibinde iskelet_kaptan doğar ve konuk aynı kimliği görür; konukta hiçbir yerel boss kimliği oluşmaz. Aynı kontrol 4. aşama ve Kızıl Hançer için de geçer.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının denetçisi (F-04) ve H alanının denetçisi (H-18) aynı kusuru bağımsız olarak buldu. Bilinen sorun: KI-080.

### F-M03 — Co-op 1. aşama: Martı sandığını konuk satarsa hikâye ilerlemiyor ('ilkHazineBulundu' yalnız ev sahibinde, 'chestSold' yalnız satan istemcide) (orta)

- **Dosya ve fonksiyon:** js/game/quests.js; js/treasure/treasure.js; js/economy/shop.js; js/net/net.js — quests._wire 'treasureFound' (quests.js:138-142) ve 'chestSold' (143-147), treasure.finishDig/resolveDig (treasure.js:207-239), shop.sellCarriedChest (shop.js:138-153), shop.sellHoldChests (156-167), net _hostData 'chestGone'/'hold' (net.js:340-357) ve _chestGone (602-609)
- **Kök neden:** 1→2 geçişinin koşulu (stage===1 && flags.ilkHazineBulundu) satışı yapan istemcide değerlendiriliyor. ilkHazineBulundu yalnız treasureFound olayıyla kuruluyor; konuğun kazısı ev sahibinde çözüldüğü için (treasure.js:209) bu olay yalnız ev sahibinde yayılıyor. Ev sahibi bayrak değişimlerini advance() dışında yaymıyor; netStory yalnız quests.js:134 ve :317'de gönderiliyor. Konuk satınca chestSold konukta tetikleniyor ama konukta bu bayrak yok. Ev sahibine yalnız netChestGone ya da netHold gidiyor, ev sahibinde chestSold oluşmuyor. Aynı biçimde konuğun Nevra'dan aldığı ilk harita bayrağı (ilkHarita, quests.js:404) da ev sahibine ulaşmıyor.
- **Oyuncuya etkisi:** Co-op'ta ilk hazineyi konuk taşıyıp satarsa (ya da ambar satışını konuk yaparsa) hikâye 'İlk Hazine'de kalır. HUD Sedef Hanım'ı (ilk haritayı konuk aldıysa Nevra'yı) göstermeye devam eder ve Nevra ev sahibine ikinci bir Martı haritası verir. Hikâye ancak ev sahibi başka bir sandık satınca ilerler; oyuncular ana hikâyenin bozulduğunu düşünür. Hata v0.3'te ve v0.4'te var; v0.4'te F-01'deki eski bayraklı konuk ise tersine, satışla aşamayı atlatır. Mantık kopyası: node /tmp/denetim_alan/karsit_hikaye/coop_marti_satis.mjs → konuk 1. aşamada, ev sahibi 1. aşamada, ev sahibinin bayrakları {ilkHazineBulundu:true}.
- **Öncelik:** orta · hedef faz: Faz 6 (+Faz 2)
- **Önerilen çözüm:** Hikâye koşullarını ev sahibinde değerlendirin. Konuk sandık satınca ev sahibine bir niyet iletisi gitsin ({t:'storyReq', action:'chestSold', tier}); ev sahibi koşulu kendi bayraklarıyla doğrulayıp advance(2) çalıştırsın. ilkHazineBulundu ve ilkHarita gibi aşama içi bayraklar değiştiğinde ev sahibi 'story' yayınlasın. Not: denetçinin orta düzey F-04/F-05 maddelerinden biri bunu kapsıyorsa birleştirilmeli.
- **Tekrar üretme:** 2 oyunculu co-op, 1. aşama: konuk Nevra'dan haritayı alsın ve Martı Adacığı'nda (478,352) kazsın. Sandık ev sahibinde doğar ve ev sahibinde DK.quests.flags.ilkHazineBulundu === true olur. Konuk sandığı taşıyıp Sedef Hanım'a satsın. Beklenen 2. aşama; gerçekleşen: iki tarafta da DK.quests.stage === 1.
- **Kabul testi:** İki varyantlı co-op testi: (a) ev sahibi satar, (b) konuk satar (hem taşıyarak hem ambardan). Her iki varyantta iki istemci de 1 sn içinde 2. aşamaya geçer ve 'Yeni görev' bildirimi herkeste görünür. İlk haritayı kim alırsa alsın Nevra ikinci bir harita önermez.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının denetçisi aynı kusuru bağımsız olarak buldu (F-05). Bilinen sorun: KI-081.

---

**5.G Alan G — Dünya ve keşif kalitesi** · 15 denetim maddesi, 2 kaçan madde · varsayılan hedef faz: Faz 6

Denetçi özeti: v0.4'te 20×20 km dünya, 6 bölge ve 6 biyom, 73 adalık yapı (6 çekirdek + 23 el yapımı özel + 44 yordamsal) v0.3 ile birebir korunuyor. Node determinizm testi bu denetimde de GEÇTİ, kıyı sürekliliği ölçümünün (D02b) analitik kopyası da 73 adada 0 süreksizlik verdi. Kullanıcının saydığı sekiz özel bölgenin hepsi kodda var, ama çoğu ortak 'sandık + düşman' şablonundan ibaret: deniz fenerinin oynanış amacı yok, maden girişleri kapalı cephe, batık şehir rastgele saçılmış kalıntılarla 4 sandıktan oluşuyor, gizli pazar fiziksel olarak 'yalnız gece' kurulmuyor. İki kritik açık bulundu. Birincisi hapishanede: tutsak ödülü, E basılı tutuldukça her 2,5 sn'de +120 altın ve +80 XP olarak tekrarlanıyor (v0.3 ve v0.4). İkincisi co-op'ta: ada ve tehlike durumu konuğa ne aktarılıyor ne de konukta kaydediliyor; konuk her katılışta sandık, sunak, tutsak ve bulmaca ödüllerini yeniden alıyor, gardiyan denetimi de konukta çalışmıyor. Kadim Tapınak'ın sunak sandığı 8 m'lik platformda duruyor ve merdiveni yalnız görsel olduğu için alınamıyor (02'de kayıtlı, hâlâ açık). Node taramasında 123 kazı noktasından 6'sı su altında olduğu için kazılamıyor; bir otomatik harabe de mesa terasında kaldığından yürüyerek ulaşılamıyor. Dikey keşif zayıf: tek bir mağara var; yeraltı gölü, batık gemi odası, su altı geçidi, gizli maden ve tapınak katı yok. Tekrar hissi yüksek (22 aynı harabe, 26 aynı batık, 11 aynı kamp, 5 aynı liman). Özel bölgelerin, bulmacaların ve kazının çoğu v0.4'te gerçekten sınayan bir testle doğrulanmamış.

