# AUDIT_CURRENT §5 — Hatalar: D — Kayıt ve dünya kalıcılığı

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — D — Kayıt ve dünya kalıcılığı

### D-01 — Tutsak kurtarma eylemi kalıcı 'freed' durumunu denetlemiyor: E basılı tutuldukça sınırsız altın ve XP (kritik)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._prison (hücre etkileşiminin action kapanımı); interact.update (hold dalı, js/game/interact.js:61-65)
- **Kök neden:** freed kümesi yalnız ada kurulurken okunuyor (islands.js:956 `if (!this.freed?.has(...))`). Eylem (958-967) freed'i denetlemiyor, etkileşim B.inter'den çıkarılmıyor ve 'cond' tanımlı değil. interact.js:61-65'teki hold dalı tuş basılı kaldıkça holdT'yi sıfırlayıp eylemi her 2,5 sn'de yeniden çağırıyor. npcs.remove(nid) tekrarı zararsız geçiyor ama `G.player.inv.gold += 120` ve `G.emit('prisonerFreed')` (progress.js:84, +80 XP) her seferinde çalışıyor.
- **Oyuncuya etkisi:** Gardiyanlar yokken (öldürülmüşse ya da D-07 yüzünden kayıt sonrası doğmamışsa) hücre kapısında E'yi basılı tutan oyuncu dakikada yaklaşık 2.880 altın ve 1.920 XP kazanıyor; ekonomi ve rütbe ilerlemesi çöküyor. Durum kaydedildiği hâlde etkileşimde uygulanmadığı için 7.2'deki 'kayıtlı durum uygulanmalı' ilkesi de bozuluyor. [Doğrulama eki] Konukta gardiyan koşulu hiç işlemiyor (D-03 doğrulamasına göre konukta gardiyan sayımı her zaman 0, enemies.js:1655); sınırsız kazanç savaşmadan elde ediliyor.
- **Öncelik:** kritik · hedef faz: Faz 4 (+Faz 2)
- **Önerilen çözüm:** Eylemin başına `const key = `${f.id}_${k}`; if (this.freed?.has(key)) return;` eklenmeli; etkileşime `cond: () => !this.freed?.has(key)` verilmeli (ya da serbest bırakınca B.inter'den silinmeli). Ödül ve XP tek seferlik olaya bağlanmalı. Co-op'ta kurtarma ev sahibine niyet iletisiyle gitmeli, freed ev sahibinde tutulmalı.
- **Tekrar üretme:** DK.handlers.startGame({kind:'solo',slot:2,data:null}); await DK.terrain.prepare(-6700,2500,{radius:450}); oyuncuyu Demirkapı hücrelerine ışınla; DK.enemies.list.filter(e=>e.group==='demirkapi_prison_0').forEach(e=>e.applyDamage(9999,{})); const it=DK.islands.built.get('demirkapi').inter.find(x=>x.id.startsWith('free:')); const g0=DK.G.player.inv.gold; it.action(); it.action(); it.action(); → altın g0+360 olur, DK.progress.xp her çağrıda artar. Oyun içinde: kapıda E'yi 10 sn basılı tut.
- **Kabul testi:** Aynı hücre için ikinci ve sonraki action çağrıları altını ve XP'yi değiştirmiyor, 'Hücrenin kilidini kır' istemi kayboluyor. 10 sn basılı tutmada toplam +120 altın, +80 XP. Kayıt/yüklemeden sonra istem çıkmıyor (otomatik senaryo). [Doğrulama eki] Kabul testi bir co-op senaryosu da içermeli: konukta da ödül tek seferlik olmalı ve gardiyan koşulu ev sahibinin durumuna göre işlemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02:G_icerik-ek-statik-159 (Yüksek; 11. belgede yok, kodda açık)
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: v0.4 islands.js:956 freed'i yalnız kurulumda okuyor. Eylem (958-967) yalnız gardiyan sayıyor, freed ve cond denetimi yok. _interactables (1149-1156) 'once' alanını taşımıyor ve süzgeç uygulamıyor. interact.js:61-65 hold dalı holdT'yi sıfırlayıp tuş basılıyken her 2,5 sn'de action çağırıyor. npcs.remove (npcs.js:90-95) tekrar çağrılınca erken dönüyor. Buna karşın +120 altın (963) ve prisonerFreed → progress.js:84 (+80 XP) her çağrıda çalışıyor. 60/2,5 = 24 çağrı/dk, yani 2.880 altın ve 1.920 XP; hesap doğru. v0.3'te kod aynı: islands.js:762-773, interact.js:61-65, progress.js:80. 02_HATA_LISTESI.md:1340'ta G_icerik-ek-statik-159 (Yüksek) olarak kayıtlı; 03 ve 11'de düzeltme ya da açık kaydı yok. Etkide anılan D-07 de doğru: enemies.js:1319 groupState'i spawned dahil aynen yüklüyor, 1549'daki '!st.spawned' koşulu yüzünden kampa yakın yüklemede gardiyan doğmuyor. Ağırlaştırıcı bir durum daha var: konukta gardiyan sayımı her zaman 0. enemies.applySnapshot (1650-1656) düşmanı yalnız {id} ile doğuruyor, group taşınmıyor (Enemy.group = opts.group, 219), _populate de yalnız ev sahibinde çalışıyor (1593). Bu yüzden co-op konuğu gardiyanlar yaşarken bile E'yi basılı tutarak aynı kazancı alıyor (başka alan denetiminde G-02 olarak kayıtlı). Verilen ölçeğe göre 'kritik' önceliği doğru. Düzeltme/ek: Etki tanımına konuk durumu eklenmeli: konukta gardiyan koşulu hiç işlemiyor, sınırsız kazanç savaşmadan elde ediliyor. Kabul testi bir co-op senaryosu da içermeli. (uygulanan alanlar: oyuncuya etkisi, kabul testi) Denetçi güveni: yüksek. Bilinen sorun: KI-011.

### D-02 — Konuk kaydı başka dünyaların hikâye bayraklarını taşıyor; katılımda birleşip ev sahibine sızıyor ve ev sahibinin hikâyesini aşama 2'de kilitleyebiliyor (yüksek)

- **Dosya ve fonksiyon:** js/main.js — handlers.startOnlineGuest, wire/applyWorld; quests.save/advance/takeJournal (js/game/quests.js); net._hostData case 'story' (js/net/net.js:326-331)
- **Kök neden:** B06 düzeltmesinin yan etkisi: v0.4'te konuk kaydına quests.save()'in tamamı, stage ve flags dahil, yazılıyor (main.js:203). Katılımda quests.start bu bayrakları yüklüyor (main.js:193), applyWorld da onları ev sahibininkilerle değiştirmek yerine birleştiriyor (main.js:336 `Object.assign(quests.flags || {}, m.quests.flags)`). Konuk advance (quests.js:134) ya da takeJournal (317) çağırdığında netStory bayrak nesnesinin tamamını gönderiyor; ev sahibi true olan her bayrağı aşama ya da beyaz liste denetimi yapmadan kendi bayraklarına yazıyor (net.js:329) ve kaydına geçiriyor.
- **Oyuncuya etkisi:** Başka bir dünyada günlüğü almış (flags.gunluk) bir konuk, aşama 0–2'deki bir ev sahibine katılıp herhangi bir hikâye ilerlemesini tetiklerse ev sahibinde gunluk=true oluyor. 'Eski günlüğü al' istemi (quests.js:297 `!this.flags.gunluk`) hiç çıkmıyor; aşama 2→3 yalnız takeJournal ile ilerlediği için (316) ev sahibinin dünyası kalıcı olarak kilitleniyor. ilkHazineBulundu, morvanSpawn gibi bayraklar da yanlış tetiklemelere yol açıyor. Kirlenme ev sahibinin online kaydına yazılıyor. [Doğrulama düzeltmesi] morvanSpawn/kizilSpawn sızıntısı kalıcı değil: oyuncu 200 m uzaklaşınca bu bayraklar sıfırlanıyor (quests.js:282, 290). ilkHazineBulundu herhangi bir sandık satışıyla 1. aşamanın atlanmasına yol açıyor (quests.js:145). ilkHarita ilk harita seçeneğini gizliyor (quests.js:404); yeniden yüklemede storySites ile aşılabiliyor. Kalıcı kilidi yaratan bayrak gunluk. Doğrulayıcı 'yüksek'i kabul etti, ana hikâyeyi kalıcı kilitlediği için 'kritik'i de savunulabilir buldu.
- **Öncelik:** yüksek · hedef faz: Faz 2 + Faz 4
- **Önerilen çözüm:** Konuk kaydında yalnız kişisel alanlar saklanmalı (side, completed, discovered, fog, stats, collection, achievements); stage, flags, markers ve çalışma zamanı bayrakları kaydedilmemeli. applyWorld'de bayraklar `quests.flags = { ...m.quests.flags }` ile değiştirilmeli. Ev sahibi 'story' iletisinde yalnız aşamaya uygun, beyaz listedeki bayrağı kabul etmeli (ör. 2→3 için yalnız gunluk). Göç adımı: online kayıtta stage&lt;3 iken gunluk=true ise bayrak sıfırlanmalı.
- **Tekrar üretme:** İki tarayıcı bağlamı kur. Konuk bağlamında localStorage['dksh.guest.0'] = JSON.stringify({inv:{stacks:[],gold:0}, quests:{stage:5, flags:{gunluk:true, ilkHazineBulundu:true}}}) yaz. Ev sahibi yeni bir online dünya (aşama 0) kursun, konuk katılsın. Konuk Yaşlı Kaptan Tuzla ile konuşup 'Martı benim mi?' seçsin → ev sahibinde DK.quests.flags.gunluk === true ve stage 1 olur. Ev sahibi aşama 2'ye geldiğinde mağaradaki etkileşim adaylarında 'journal' yoktur.
- **Kabul testi:** Co-op senaryosunda bu kurulumdan sonra ev sahibinin flags kümesi yalnız kendi ilerlemesini içeriyor, aşama 2'de 'Eski günlüğü al' istemi çıkıyor ve aşama 3'e geçiliyor; konuk kaydında stage ve flags bulunmuyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: main.js:203 konuk kaydına quests.save()'in tamamını (stage, flags, markers) yazıyor. main.js:193 ve quests.js:79 bu bayrakları yüklüyor. main.js:336 Object.assign ile ev sahibinin bayraklarıyla birleştiriyor, değiştirmiyor. quests.js:134 (advance) ve 317 (takeJournal) netStory ile bayrak nesnesinin tamamını gönderiyor. net.js:174'te konuk bunu toHost ile iletiyor. net.js:329'da ev sahibi true olan her bayrağı beyaz liste ya da aşama denetimi olmadan kendi bayraklarına yazıyor; 330 yalnız aşamayı denetliyor. quests.js:297 gunluk=true iken günlük istemini göstermiyor ve 2→3 geçişinin tek yolu takeJournal (316; grep'te başka advance(3) yok). Bayrak quests.save ile ev sahibinin online kaydına giriyor. v0.3'te konuk kaydı yalnız envanterden oluşuyordu (v0.3 main.js:191, 201) ve konuk netStory'yi ev sahibine göndermiyordu (v0.3 net.js:146). 'yalniz_v04' hükmü doğru. Olasılığı artıran bir etken daha var: konuk katıldığı her dünyanın bayraklarını birleştirip kaydına yazdığı için sızıntı yalnız kendi dünyası ilerlemiş konuklarla sınırlı değil. Ayrıca 09_KAYIT_TESTLERI.md'deki 'hikâye aşaması ve bayraklar her katılımda ev sahibinden gelir' ifadesi kodla çelişiyor. Düzeltme/ek: Küçük düzeltme: morvanSpawn/kizilSpawn sızıntısı kalıcı değil. Oyuncu 200 m uzaklaşınca bu bayraklar sıfırlanıyor (quests.js:282, 290). ilkHazineBulundu, herhangi bir sandık satışıyla aşama 1'in atlanmasına yol açıyor (quests.js:145). ilkHarita ilk harita seçeneğini gizliyor (404); yeniden yüklemede storySites ile aşılabiliyor. Kalıcı kilidi yaratan gunluk. 'Yüksek' öncelik kabul edilebilir; ana hikâyeyi kalıcı kilitlediği için 'kritik' de savunulabilir. (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-013.

### D-03 — Co-op'ta dünya kalıcılık durumu eşitlenmiyor: geç ya da yeniden katılan konuk yok edilmiş ve yağmalanmış nesneleri sağlam görüp yeniden yağmalıyor; konuk eylemleri ev sahibi kaydına girmiyor (kritik)

- **Dosya ve fonksiyon:** js/net/net.js — net._sendWorld; islands._chest/_temple/_prison eylemleri; hazards.start; seagear.start
- **Kök neden:** _sendWorld (net.js:510-522) yalnız gemi, sandık, kese, hikâye, zaman ve kayık gönderiyor; islands.opened/freed/templeState, hazards.gone/solved/looted ve seagear.wreckOpened gönderilmiyor. Konuk game.start'ta bu sistemleri boş veriyle başlatıyor (islands.js:260-266, hazards.js:78-80, seagear.js:128). Ada sandığı, sunak, tapınak levyeleri ve tutsak eylemleri konukta yerel çalışıp lootToBag ile ödülü doğrudan konuk çantasına koyuyor (islands.js:746-751, 840-849, 857-862, 958-967; treasure.js:95-100). 'inter' iletisi KNOWN listesinde (net.js:46) ama işleyicisi yok. Tehlike olayları (netHazard) yalnız o an bağlı eşlere gidiyor.
- **Oyuncuya etkisi:** Geç katılan konuk patlamış fıçıları ve kırık sandıkları sağlam görüyor, onları kırıp ganimet isteği gönderiyor (ev sahibi lootReq ile keseyi doğuruyor). Her yeniden katılımda ada sandıklarını (40–260 altın + değerli eşya), tapınak sunağını (400–700 altın + taç/elmas), gizli bulmaca sandığını ve tutsakları yeniden yağmalayabiliyor; bu sınırsız kazanç demek. Konuğun çözdüğü tapınak ev sahibinde kapalı kalıyor ve Taş Muhafız tetiklenmiyor (bosses.js:1088). Ev sahibinin kaydı konuğun yaptıklarını içermediği için dünyalar birbirinden ayrışıyor. [Doğrulamayla düzeltildi] (1) Yeniden katılımla yinelenen ödül D-01 ile aynı sınıfta (sınırsız kazanç); öncelik kritik. 02'deki 164 numaralı kaydın 'Düşük' önceliği de hafife alınmış. (2) Ev sahibi adaları yalnız kendi oyuncusunun konumuna göre kuruyor (islands.js:273); konuk uzak bir adadayken onun fıçı, sandık ve bulmaca olayları ev sahibinde byId olmadığı için yok sayılıyor (hazards.js:672-674) ve hiçbir kayda girmiyor. Konukta gardiyan sayımı da her zaman 0 (enemies.js:1655). (3) Tutsak ödülü lootToBag ile değil doğrudan altın olarak veriliyor (islands.js:963); levyeler eşya vermiyor, yalnız +250 XP veriyor (templeOpened, progress.js:86).
- **Öncelik:** kritik (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 2 (+Faz 4, Faz 5)
- **Önerilen çözüm:** World iletisine `persist: { islands: islands.save(), hazards: hazards.save(), wreck: seagear.wreckOpened }` eklenmeli; konuk applyWorld'de bunu uygulayıp kurulu adaları yeniden kurmalı. Ada etkileşimleri ev sahibi otoritesine taşınmalı ('inter' iletisi: konuk niyet gönderir, ev sahibi kalıcı kümeyi günceller, ödülü netGive ile verir, durumu yayınlar). opened/freed/temple değişiklikleri tüm eşlere yayınlanmalı.
- **Tekrar üretme:** Ev sahibi çekirdek kampta bir fıçıyı patlatsın (DK.hazards._explode) ve bir ada sandığını açsın; ardından konuk katılsın → konukta DK.hazards.list('keg') patlamış kimliği hâlâ içerir, DK.islands.opened.size===0 olur. Konuk aynı sandığı açar ve çantası dolar; menüye dönüp tekrar katılır ve sandığı yine açar.
- **Kabul testi:** Co-op testinde geç katılan konuğun hazards.gone/solved/looted ve islands.opened/freed/templeState kümeleri ev sahibininkilerle aynı. Konuğun açtığı sandık ev sahibinde ve kayıtta açık görünüyor; yeniden katılımdaki ikinci açılış 'Sandık boş' veriyor ve envanter değişmiyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02:G_icerik-ek-statik-164 (Düşük)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Kök neden doğru. net.js:510-522'deki _sendWorld ada, tehlike ve seagear durumunu göndermiyor. Konukta islands.start (260-266), hazards.start (78-80) ve seagear.start (128) boş veriyle başlıyor. 'inter' iletisi KNOWN listesinde (46) ama _hostData'da bir case karşılığı yok. treasure.js:95-100'deki lootToBag konukta yerel çalışıyor. Konuk hayalet sandığı kırınca 'loot' → netLootReq (treasure.js:84-90) ile ev sahibine gidiyor ve ev sahibi lootReq'te (net.js:301-313) keseyi doğuruyor. 'break' olayı ise ev sahibinde byId bulunmadığı için yok sayılıyor (hazards.js:672-674). Taş Muhafız tetiği yalnız ev sahibinin templeState'ine bakıyor (bosses.js:1088). Yeniden katılımda opened/looted/freed boş geldiği için orta ve zengin sandık (40–260), sunak (400–700), gizli sandık (140–320) ve tutsak ödülü (+120) her katılımda yeniden alınabiliyor. Düzeltme/ek: (1) Öncelik: yeniden katılımla tekrarlanan ödül D-01 ile aynı sınıfta, yani sınırsız kazanç. Verilen ölçeğe göre 'kritik' olmalı; tutarlılık için ya bu kritik yapılmalı ya da D-01 de yüksek. 02'deki 164 numaralı kaydın 'Düşük' önceliği de hafife alınmış. (2) Etkide eksik var: ev sahibi adaları yalnız kendi oyuncusunun konumuna göre kuruyor (islands.js:273). Konuk uzak bir adadayken onun fıçı, sandık ve bulmaca olayları ev sahibinde byId olmadığı için yok sayılıyor (hazards.js:672-674) ve hiçbir kayda girmiyor. Konukta gardiyan sayımı da her zaman 0 (enemies.js:1655). (3) Ayrıntı düzeltmesi: tutsak ödülü lootToBag ile değil doğrudan altın olarak veriliyor (islands.js:963). Levyeler eşya vermiyor, yalnız +250 XP veriyor (templeOpened, progress.js:86). (uygulanan alanlar: oyuncuya etkisi, öncelik) Denetçi güveni: yüksek. Bilinen sorun: KI-012.

### D-04 — İçe aktarma doğrulamasız, atomik değil ve onaysız: eski ya da bozuk bir dosya yuvaları .bak yedekleriyle birlikte sessizce eziyor (yüksek)

- **Dosya ve fonksiyon:** js/core/save.js — save.importAll; settingsPanel içe aktarma dinleyicisi (js/ui/settingsPanel.js:76-79); save.exportAll
- **Kök neden:** importAll (save.js:82-87) yalnız JSON.parse sonucuna ve 'dksh.' önekine bakıp değerleri tek tek setItem ile ham yazıyor; değer türü, şema, sürüm ve boyut denetlenmiyor. Önceki durum yedeklenmiyor. Kota istisnası yakalanmıyor (try yok), settingsPanel.js:78'deki async dinleyici de yakalamıyor. 'dksh.' anahtarı içermeyen dosya da true döndürüyor. exportAll (77-81) .bak/.tmp anahtarlarını da dışa aktardığı için içe aktarma yedekleri de değiştiriyor.
- **Oyuncuya etkisi:** Kullanıcı eski bir dışa aktarım dosyasını içe aktarırsa dosyada bulunan yuvalar uyarı olmadan eski hâline dönüyor [doğrulama düzeltmesi: yalnız dosyadaki yuvalar eziliyor]; .bak'lar da ezildiği için yeni ilerleme kurtarılamıyor. Bozuk ya da elle düzenlenmiş bir dosya yuvaya '[object Object]' yazdırıyor [doğrulama düzeltmesi: .bak varsa read() sessizce bir önceki kayda düşüyor, yuva okunamaz olmuyor ama son ilerleme kayboluyor], yine de 'Kayıtlar içe aktarıldı' bildirimi çıkıyor. Kota dolarsa yarım bir içe aktarma kalıyor ve hiç bildirim görünmüyor. [Doğrulama eki] dksh.profile ilkel bir değerle (ör. "5") içe aktarılırsa oyun bir daha açılmıyor (D-M02).
- **Öncelik:** yüksek · hedef faz: Faz 4
- **Önerilen çözüm:** Sürümlü bir dışa aktarma biçimi ({format:'dksh-export', exportVersion, createdAt, entries}) ve anahtar beyaz listesi kullanılmalı. İçe aktarmada her yuva için parse → validate → migrate uygulanmalı. Boyut sınırları konmalı (dosya ≤2 MB, yuva ≤256 KB). Yuva başına savedAt karşılaştırmalı bir onay kutusu gösterilmeli. Yazmadan önce mevcut dksh.* anahtarlarının anlık görüntüsü alınmalı, hata olursa geri yüklenmeli. try/catch ve doğru bildirim eklenmeli; .bak/.tmp anahtarları dışa aktarılmamalı.
- **Tekrar üretme:** Node: node /tmp/denetim_alan/save_probe.mjs /home/user/SON-HAZ-NE-w2/js/core/save.js → importObjectValue.stored '[object Object]', read null, returned true; importNoKeys true. node /tmp/denetim_alan/save_quota.mjs /home/user/SON-HAZ-NE-w2/js/core/save.js → QuotaExceededError yakalanmıyor; yuva 0 içe aktarılan kayıt, yuva 1 eski kayıt (yarım içe aktarma). Tarayıcıda: Ayarlar → Kayıtları dışa aktar, oyna ve kaydet, sonra aynı dosyayı içe aktar → yuva ve .bak eski kayda döner, uyarı çıkmaz.
- **Kabul testi:** Bozuk değer ya da şema içeren dosya reddediliyor ve mevcut anahtarlar bit düzeyinde aynı kalıyor. Kota hatasında bütün anahtarlar içe aktarma öncesi hâline dönüyor ve kullanıcı uyarılıyor. Daha eski savedAt içeren yuva için onay isteniyor. Node birim testi ve tarayıcı senaryosuyla doğrulanıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02:A14 (içe aktarma doğrulaması kısmı)
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: save.js:82-87'deki importAll'da try yok; yalnız JSON.parse sonucu ve 'dksh.' öneki denetleniyor. settingsPanel.js:78'deki async dinleyici istisnayı yakalamıyor ve onay istemiyor. Kendi Node denemem (/tmp/denetim_alan/karsit_kayit/import_probe.mjs) şunu gösterdi: eski bir dışa aktarım içe aktarılınca ana kayıt ve .bak eski hâline döndü, yeni kayıt hiçbir anahtarda kalmadı (C.yeniKurtarilabilir=false). Dışa aktarım .bak anahtarlarını da içeriyor (B_exportKeys). '[]', '5' ve '"abc"' girdileri true döndürüyor. Denetçinin save_quota.mjs dosyasını yeniden koştum: QuotaExceededError yukarıya yayıldı, yuva 0 içe aktarılmış, yuva 1 eski hâlinde kaldı (yarım içe aktarma). v0.3'te save.js:75-80 ve settingsPanel.js:81 aynı kodu içeriyor. Düzeltme/ek: Etki ayrıntısı: '[object Object]' yazılan yuva .bak varsa okunamaz hâle gelmiyor. read() sessizce bir önceki kayda düşüyor; denememde 'ikinci' yerine 'ilk' döndü. Yine de son ilerleme kayboluyor. 'Bütün yuvalar' ifadesi de abartılı: yalnız dosyada bulunan yuvalar eziliyor. Ek ve daha ağır bir etki var: dksh.profile ilkel bir değerle (ör. "5") içe aktarılırsa oyun bir daha açılmıyor; bunu missed listesine ayrı yazdım. (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: kesin. Bilinen sorun: KI-022.

### D-05 — Kayıt sürümü işlevsiz: v0.3 ve v0.4 aynı 'version: 1' damgasını yazıyor, değer okunmuyor, migrasyon yok; bilinmeyen sürüm sorgusuz yüklenip eski şemayla yeniden yazılıyor (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.serialize; save.valid (js/core/save.js:33-37); game.start
- **Kök neden:** game.js:164'te version sabit 1 (v0.3 game.js:156 ile aynı). v0.4'ün eklediği islands, hazards.gone, ship.sunk/parts gibi şema değişiklikleri sürüm artışıyla işaretlenmemiş. save.valid (save.js:36) yalnız türü denetliyor, game.start sürüme göre dallanmıyor ve göç fonksiyonu yok.
- **Oyuncuya etkisi:** Aynı kökende (ör. Chromium'da file:// tek HTML ya da geri alınan bir Pages yayını) v0.4 kaydını açan v0.3, bilmediği alanları yok sayıp ilk kayıtta siliyor: ada sandıkları ve tutsaklar yeniden yağmalanabiliyor, patlamış fıçılar ve batık gemi geri geliyor. Faz 4'teki gibi gelecek bir şema değişikliği eski kayıtları ayırt edemeyecek. Yeni bir sandık kademesi ya da gemi tipi içeren kayıt, eski sürümde yüklemeyi çökertebilir (treasure.js:266-268, ship.js:20/59) [doğrulama düzeltmesi: v0.3 ve v0.4'te sandık kademeleri (small/medium/large/legend) ve gemi tipleri (sloop/brigantine) aynı; bu çökme bugün yalnız gelecekteki bir sürüm için varsayımsal]. [Doğrulamayla düzeltildi] Bugünkü somut risk yalnız aynı kökende sürüm geri dönüşü ya da file:// paylaşımı; öncelik orta (02'de A14 'Düşük'). parts/mastHp/cannonHp v0.3 kaydında da vardı (v0.3 ship.js:692'de yazılıyor, yalnız yüklenmiyordu); gemideki tek yeni alan sunk. v0.4'ün asıl yeni kayıt alanları islands, hazards.gone, ship.sunk ve konuk kaydındaki progress/quests.
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 4
- **Önerilen çözüm:** SAVE_SCHEMA sabiti (v0.3=1, v0.4=2) ve kayıt üst bilgisi eklenmeli. read() schema>CURRENT ise yuvayı salt-okunur işaretlemeli ve üzerine yazmamalı. schema&lt;CURRENT için sıralı bir migrate zinciri kurulmalı. Bilinmeyen üst düzey alanlar korunup kayda geri yazılmalı. v0.3/v0.4 kayıt örnekleriyle Node ve tarayıcı testi eklenmeli.
- **Tekrar üretme:** localStorage['dksh.solo.0'] = JSON.stringify({version:999,name:'x',savedAt:1,player:{inv:{stacks:[],gold:5}},gelecekAlani:{a:1}}) yaz → menüde yuva dolu görünür ve yüklenir; DK.handlers.saveNow(true) sonrası kayıtta version 1 olur, gelecekAlani düşer. Node: save_probe.mjs çıktısında futureVersionRead 999.
- **Kabul testi:** version 999 olan kayıt yüklenmiyor, 'daha yeni sürüm' uyarısı gösteriliyor ve anahtar değişmiyor. v0.3 örnek kaydı yüklenip schema 2 olarak kaydediliyor ve bütün alanları korunuyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02:A14
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: game.js:164'te version: 1 yazılıyor; v0.3 game.js:156 ile aynı. grep'e göre .version yalnız save.js:36'da tür denetimi için okunuyor. Node denememde version 999 olan kayıt okundu ve listelendi. serialize (game.js:161-177) yeni bir nesne kurduğu için bilinmeyen alanlar ilk kayıtta düşüyor. Kök neden ve 'sorgusuz yükleme' iddiası doğru. Düzeltme/ek: (1) Öncelik 'orta' daha uygun. 02'de A14 'Düşük' olarak kayıtlı. Bugünkü somut risk yalnız aynı kökende sürüm geri dönüşü ya da file:// paylaşımı. v0.3 ve v0.4'te sandık kademeleri (small/medium/large/legend) ve gemi tipleri (sloop/brigantine) aynı, dolayısıyla treasure.js:266-268 ve ship.js:20/59 çökmesi yalnız gelecekteki bir sürüm için varsayımsal. (2) parts/mastHp/cannonHp v0.3 kaydında da vardı (v0.3 ship.js:692'de yazılıyor, yalnız yüklenmiyordu); gemideki tek yeni alan sunk. v0.4'ün asıl yeni alanları islands, hazards.gone, ship.sunk ve konuk kaydındaki progress/quests. (uygulanan alanlar: oyuncuya etkisi, öncelik) Denetçi güveni: kesin. Bilinen sorun: KI-059.

### D-06 — Yükleme sırasında bir sistemin start() istisnası oturumu yarım bırakıyor; otomatik kayıt bu karışık durumu yuvanın üstüne yazıyor (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.start; handlers.startGame (js/main.js:157-167); quests._loadFog; treasure.start
- **Kök neden:** game.start önce G.state='playing' yapıyor (game.js:103), sonra sistem start'larını try olmadan sırayla bekliyor (144); handlers.startGame (main.js:162) de hatayı yakalamıyor. save.valid yüzeysel olduğu için alt alanı bozuk kayıt 'geçerli' sayılıyor ve .bak'a düşülmüyor. Örneğin bozuk quests.fog atob'da InvalidCharacterError atıyor (quests.js:101/104; Node'da doğrulandı), bilinmeyen sandık kademesi treasure.js:266-268'de TypeError veriyor. Hatadan sonra başlatılmamış sistemler (progress, events, details…) önceki oturumun değerleriyle kalıyor. game.update çalışmaya devam ettiğinden 120 sn sonra autosave (game.js:218) ya da menüye dönüş/sekme gizlenme kaydı karışık durumu diske yazıyor.
- **Oyuncuya etkisi:** Tek bir bozuk alan yuvayı yüklenemez yapıyor. Daha kötüsü, yarım oturum (önceki yuvanın rütbe/XP'si dahil) birkaç dakika içinde önce ana kaydı, ardından .bak'ı eziyor: ilerleme kaybı ve yuvalar arası karışma.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** game.start try/catch ile sarılmalı: hata olursa sistemler stop() edilmeli, menüye dönülmeli, otomatik kayıt kilitlenmeli, sıradaki yedek (.bak/.tmp/eski kuşaklar) denenmeli ve kullanıcıya bildirilmeli. validate() alt alan türlerini (sis dizesi, sandık kademesi, gemi tipi) denetlemeli. Her sistemin start(data)'sı kendi alanı bozuksa güvenli varsayılana düşmeli.
- **Tekrar üretme:** Önce herhangi bir yuvayla oyun başlat. Sonra: const d=DK.save.read('solo',2); d.quests.fog='v2:!!!'; DK.save.write('solo',2,d); DK.handlers.startGame({kind:'solo',slot:2,data:DK.save.read('solo',2)}).catch(e=>e.name) → 'InvalidCharacterError'. DK.G.state==='playing' kalır; DK.sim(125) sonrası DK.save.read('solo',2) önceki oturumun progress değerlerini içerir.
- **Kabul testi:** Bozuk alanlı kayıt yüklendiğinde oyun menüde kalıyor ya da yedekle açılıyor; yuva anahtarları değişmiyor ve otomatik kayıt tetiklenmiyor (Node/tarayıcı senaryosu).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D/REQ11 karşı doğrulaması bozuk sis dizesinin atob çağrısında istisna attığını (D-06) doğruladı; K/REQ18 doğrulaması anlamsal bozulmanın valid()'i geçtiğini kaydetti. Denetçi güveni: yüksek. Bilinen sorun: KI-060.

### D-07 — Düşman kampının 'spawned' bayrağı kayıttan geri yükleniyor ama düşmanlar kaydedilmiyor: kampın yakınında kaydedilip yüklenen oyunda kamp boş kalıyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies.start, enemies._populate
- **Kök neden:** start(data) groupState'i olduğu gibi kopyalıyor (enemies.js:1319); kayıt anında oyuncunun 140 m yakınındaki grup spawned:true durumunda. Yüklemede düşman listesi boş, _populate ise yalnız `!st.spawned` iken düşman doğuruyor (1549). Bayrak ancak bütün oyuncular 220 m uzaklaşınca sıfırlanıyor (1559-1567); killed>0 ise üstüne 420 sn bekleme ekleniyor. v0.3 groupState'i yüklemediği için (start'ta {}) bu durum A5/F-07 düzeltmesiyle geldi. v0.3 kayıtlarındaki spawned bayrakları da v0.4'te aynen uygulanıyor.
- **Oyuncuya etkisi:** Kampta ya da çatışma sırasında otomatik kayıt alıp çıkan oyuncu yüklemede kampı boş buluyor. Hapishane muhafızları doğmadığı için tutsaklar savaşmadan kurtarılabiliyor (islands.js:959-960); D-01 ile birleşince sınırsız altın. Kamp ganimeti ve XP döngüsü bozuluyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** start(data)'da her grup için spawned=false ve nightDone=false olarak normalize edilmeli (cooldown ve killed korunmalı); aynı adım eski kayıtlar için göç olarak da uygulanmalı.
- **Tekrar üretme:** Oyuncuyu çekirdek 'kamp' grubunun (-40,-228) 140 m içine götür, DK.sim(1) → DK.enemies.groupState.kamp.spawned===true. Sonra: const d=DK.game.serialize(); DK.save.write('solo',2,d); await DK.handlers.startGame({kind:'solo',slot:2,data:DK.save.read('solo',2)}); DK.sim(5) → DK.enemies.list.filter(e=>e.group==='kamp').length===0 ve groupState.kamp.spawned===true.
- **Kabul testi:** Yüklemeden sonraki 1 sn içinde yakın kampın düşmanları doğuyor, cooldown ve killed değerleri korunuyor; 08_kalicilik'e spawned:true durumlu bir kontrol ekleniyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D-01 karşı doğrulaması: 'Etkide anılan D-07 de doğru: enemies.js:1319 groupState'i spawned dahil aynen yüklüyor, 1549'daki !st.spawned koşulu yüzünden kampa yakın yüklemede gardiyan doğmuyor.' Denetçi güveni: yüksek. Bilinen sorun: KI-061.

### D-08 — Martı Batığı sandığı kalıcı değil: her oturumda ve kayıt yüklemede yeniden açılabiliyor (orta)

- **Dosya ve fonksiyon:** js/wildlife/seagear.js — seagear.start, seagear.openWreck
- **Kök neden:** wreckOpened yalnız bellekte tutuluyor (seagear.js:115, 133) ve start() her oturumda false yapıyor (128). seagear'da save()/saveKey yok, dolayısıyla game.serialize'a girmiyor.
- **Oyuncuya etkisi:** Kaydet → menü → yükle döngüsüyle sandık sınırsız kez açılıyor; her açılış 60–140 altın ve maske/palet/hava kesesi/zıpkın/inci veriyor. Co-op'ta her oyuncu kendi kopyasını açıyor ve yeniden katılarak tekrarlayabiliyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** Durum islands.opened'a 'marti_batigi' kimliğiyle ya da seagear.save() { wreckOpened } ile kaydedilmeli ve start(data)'da yüklenmeli. Co-op'ta ev sahibi otoritesine bağlanıp world iletisine eklenmeli.
- **Tekrar üretme:** 14_deniz_ekipmani L02 adımlarını uygula (dal, 'Batık sandığını aç'). Ardından DK.handlers.saveNow(true) → DK.handlers.toMenu() → DEVAM ET (ya da startGame(read)) → sandığa yeniden dal: istem yine 'Batık sandığını aç', altın yine artar.
- **Kabul testi:** L03 benzeri bir senaryoda kayıt/yüklemeden sonra etkileşim adaylarında 'wreckchest' yok ve altın değişmiyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11:#41 (Açık, düşük)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). G alanının denetçisi aynı kusuru bağımsız olarak buldu (G-05: Martı Batığı sandığı kayda yazılmıyor). Denetçi güveni: kesin. Bilinen sorun: KI-062.

### D-09 — Konuk ilerlemesi periyodik olarak kaydedilmiyor; iki ayrı konuk kaydı zaman damgasına bakılmadan seçiliyor (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.update (autosave); handlers.saveNow (js/main.js:199-206); progress.start/_guestSave (js/game/progress.js); menu.pause (js/ui/menu.js:348)
- **Kök neden:** autosave olayı yalnız G.isHost iken yayınlanıyor (game.js:218); progress'in autosave dinleyicisi (progress.js:91) konukta hiç tetiklenmiyor; konuğun duraklatma menüsünde 'Kaydet' düğmesi yok (menu.js:348). Konuk kaydı yalnız menüye dönüş, ev sahibi ayrılışı, sekme gizlenme/kapanma ve WebGL bağlam kaybında yazılıyor (main.js:218, 315, 380, 382-385). Ayrıca dksh.progress.guest seviye atlama ve yetenek öğrenmede yazılıyor (progress.js:138, 149) ama dksh.guest.0 o anlarda yazılmıyor; start'ta dksh.guest.0.progress varsa daha yeni olan dksh.progress.guest yok sayılıyor (progress.js:95-99).
- **Oyuncuya etkisi:** Sekme ya da tarayıcı çökmesi, bellek yetersizliği veya güç kesintisinde konuğun bütün oturumu (envanter, altın, keşif, koleksiyon, son seviye atlamaları) kayboluyor. Ev sahibinin kaybı en çok 2 dk ile sınırlıyken konukta üst sınır yok.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** Konuk için de 120 sn'lik otomatik kayıt eklenmeli (yalnız yerel kişisel kayıt). Duraklatma menüsünde konuğa 'Kişisel ilerlemeyi kaydet' seçeneği verilmeli. Tek bir konuk kaydı (dksh.guest.0) kullanılmalı ve progress yalnız oradan okunup yazılmalı; ya da savedAt karşılaştırılıp en yeni kayıt seçilmeli.
- **Tekrar üretme:** Konuk olarak katıl; DK.G.player.inv.gold += 500; DK.progress.gain(5000); DK.sim(150) → JSON.parse(localStorage['dksh.guest.0'] || 'null') değişmemiş (ya da yok). Tarayıcı bağlamını beforeunload çalıştırmadan kapat (page.close({runBeforeUnload:false}) ya da süreci öldür), yeniden katıl → altın eski değerinde.
- **Kabul testi:** Konukta 130 sn benzetimden sonra dksh.guest.0.savedAt güncelleniyor ve altın/progress yeni değerleri içeriyor; seviye atlamanın ardından çökme senaryosunda yeni seviye korunuyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02:A7 (kısmen giderildi: kapanış ve odak kaybında kayıt eklendi, periyodik kayıt yok)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-15: konuk ilerlemesi için periyodik kayıt yok, eski yuva kaydı daha yeni rütbeyi eziyor). Denetçi güveni: kesin. Bilinen sorun: KI-063.

### D-10 — İçe aktarma ve yuva silme sonrasında bayat oturum/menü verisi diske geri yazılıyor (orta)

- **Dosya ve fonksiyon:** js/ui/settingsPanel.js — settingsPanel içe aktarma dinleyicisi; menu.render ve handlers.continueLatest (js/main.js:169-172); handlers.saveNow
- **Kök neden:** Ayarlar paneli duraklatma menüsünden de açılıyor (menu.js:352); içe aktarma oynanmakta olan yuvayı değiştirse de oturum kapanmıyor, bu yüzden sonraki otomatik kayıt ya da menüye dönüş (game.js:218, main.js:218) oturumu aynı yuvaya yazıyor. Ana menüde menu.render yalnız init ve show(true) sırasında çalışıyor (menu.js:57, 62); içe aktarma ya da yuva silme sonrasında 'DEVAM ET' kartı önceden ayrıştırılmış latest.data nesnesini yüklüyor (main.js:169-171).
- **Oyuncuya etkisi:** İçe aktarılan kayıt ilk kayıtta .bak'a, ikinci kayıtta tamamen dışarı itiliyor (dosya diskte durduğu için yeniden içe aktarılabilir). Silinen bir yuva 'DEVAM ET' ile açılıp ilk otomatik kayıtta geri diriliyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** Oyun sürerken içe aktarma engellenmeli ya da önce oturum kaydetmeden kapatılmalı. İçe aktarma ve silme sonrasında menu.render() çağrılmalı. continueLatest veriyi tıklama anında save.read ile yeniden okumalı.
- **Tekrar üretme:** Ana menüde DEVAM ET kartı görünürken Ayarlar → Kayıtları içe aktar (farklı içerikli bir dosya) → paneli kapat → DEVAM ET → DK.sim(125) → DK.save.read(kind,slot) içe aktarılan değil eski veri olur. Oyun içinde: Duraklat → Ayarlar → içe aktar → DK.handlers.saveNow(false) iki kez → içe aktarılan veri kalmaz.
- **Kabul testi:** İçe aktarmadan sonra DEVAM ET içe aktarılan kaydı açıyor; oyun içinde içe aktarma düğmesi devre dışı ya da oturum kapanıyor; silinen yuva DEVAM ET kartında görünmüyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-064.

### D-11 — Aynı yuvanın iki sekmede açılmasına karşı kilit ya da uyarı yok: son yazan kazanıyor (orta)

- **Dosya ve fonksiyon:** js/core/save.js — save.write; visibilitychange/beforeunload kaydı (js/main.js:382-385)
- **Kök neden:** Kayıt katmanında sekmeler arası kilit (Web Locks), BroadcastChannel ya da storage olayı dinleyicisi yok (js/ altında arama sonucu 0). write() diskteki kaydın oturumunkinden daha yeni olup olmadığına bakmıyor. Arka plandaki sekme visibilitychange (main.js:385) ve beforeunload (382-384) ile kendi eski durumunu yazıyor.
- **Oyuncuya etkisi:** Oyunu yanlışlıkla iki sekmede açıp aynı yuvayı yükleyen oyuncunun bir sekmedeki ilerlemesi, diğer sekmeye geçişte ya da sekme kapanırken sessizce eziliyor; .bak de iki sekmenin durumları arasında karışıyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** navigator.locks.request('dksh-slot-&lt;kind>-&lt;n>') ile yuva başına özel kilit alınmalı; kilit alınamazsa yuva salt-okunur açılıp kullanıcı uyarılmalı. BroadcastChannel ile diğer sekme bilgilendirilmeli. write() öncesinde ana kaydın savedAt'i oturumun yüklediğinden yeniyse yazmak yerine kullanıcıya sorulmalı.
- **Tekrar üretme:** Aynı tarayıcıda iki sekme aç, ikisinde de Yuva 1'i yükle. B'de DK.G.player.inv.gold=9999; DK.handlers.saveNow(true). A sekmesine geç (A'nın görünürlüğü değişir ve kendi durumunu kaydeder) → DK.save.read('solo',0).player.inv.gold artık B'nin değeri değil.
- **Kabul testi:** İkinci sekme yuvayı açarken uyarı veriyor ya da salt-okunur kipe geçiyor; çok sekmeli Playwright senaryosunda B'nin kaydı A tarafından ezilmiyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-23: çoklu sekme kilidi yok). Denetçi güveni: kesin. Bilinen sorun: KI-065.

### D-12 — Yedekleme tek kuşak ve doğrulamasız; kurtarma sessiz; JSON.stringify hata yakalamanın dışında (orta)

- **Dosya ve fonksiyon:** js/core/save.js — save.write, save.read
- **Kök neden:** write() önceki ana kaydı geçerli olup olmadığına bakmadan .bak'a kopyalıyor (save.js:21-22) ve yalnız bir kuşak tutuyor; 2 dakikalık otomatik kayıtla .bak en fazla iki kayıt geriye uzanıyor. JSON.stringify try bloğunun dışında (17): döngüsel ya da BigInt içeren veri saveNow'dan olay işleyicisine istisna fırlatıyor (Node denemesinde TypeError yakalanmadı). read() .bak/.tmp'ye düştüğünde (41-44) kullanıcıya bildirim yapılmıyor.
- **Oyuncuya etkisi:** Mantıksal olarak bozulmuş ama ayrıştırılabilir bir durum (ör. hatalı bir sistem kaydı ya da D-06) iki otomatik kayıt içinde bütün yedekleri eziyor; geri dönülebilecek eski bir anlık görüntü kalmıyor. Kullanıcı yedekten yüklendiğini bilmiyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** N kuşak döner yedek (.bak1..3) ve günlük bir anlık görüntü tutulmalı. Önceki kayıt ancak validate'ten geçerse .bak'a kopyalanmalı. stringify try içine alınmalı. Yedekten yüklemede bildirim ve yuva kartında 'yedekten kurtarıldı' rozeti gösterilmeli; ayarlara 'yedekten geri yükle' listesi eklenmeli.
- **Tekrar üretme:** Node: save_probe.mjs çıktısında circularWrite 'YAKALANMADI: TypeError'. Tarayıcı: DK.save.write('solo',2,d1); DK.save.write('solo',2,d2); DK.save.write('solo',2,d3) → yalnız d3 (ana) ve d2 (.bak) okunabilir, d1 kurtarılamaz.
- **Kabul testi:** Üç ardışık kayıttan sonra en az iki eski kuşak okunabiliyor; geçersiz ana kayıt .bak'ı ezmiyor; stringify hatası false döndürüp bildiriliyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-066.

### D-13 — Kaya tuzağı durumu kaydedilmiyor: ada yeniden kurulunca ve yüklemede tepede, takozuyla yeniden doğuyor (düşük)

- **Dosya ve fonksiyon:** js/world/hazards.js — hazards._boulderSite, hazards.release, hazards.save
- **Kök neden:** _boulderSite (297-345) her kurulumda state:'set' oluşturuyor; release (347-356) ve dinlenme (416-425) hiçbir kalıcı kümeye yazmıyor; save() (86) kayayı içermiyor.
- **Oyuncuya etkisi:** Bir kez kullanılmış tuzak her dönüşte yeniden kuruluyor ve kampa karşı tekrar tekrar kullanılabiliyor; dünya tutarlılığı bozuluyor (kullanıcının 7.2 hedefi).
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** hazards.used kümesi ve dinlenme konumu kaydı ({id:[x,z]}) eklenmeli; kurulumda tuzak kullanılmışsa kaya dinlenme konumunda, takoz sökülmüş olarak kurulmalı.
- **Tekrar üretme:** Bir kampta DK.hazards.release(b,true); DK.sim(10) (state 'rest' olur); DK.islands._drop(adaId); DK.islands._build(I) → DK.hazards.list('boulder').find(h=>h.id===b.id).state==='set'.
- **Kabul testi:** _drop/_build ve kayıt/yükleme sonrasında aynı kimlikli kaya 'rest' durumunda ve son konumunda; 'Takozu sök' istemi çıkmıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11:#19
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D/UC4 karşı doğrulaması kaya tuzaklarının her kurulumda 'set' durumuyla yeniden oluştuğunu ve save()'in kayayı içermediğini doğruladı (v0.3:81, v0.4:86). Denetçi güveni: kesin. Bilinen sorun: KI-174.

### D-14 — Ganimet keseleri kaydedilmiyor: çanta dolu diye yere bırakılan eşyalar kayıt/yüklemede kayboluyor (düşük)

- **Dosya ve fonksiyon:** js/treasure/treasure.js — treasure.save, treasure.giveItems
- **Kök neden:** save() (120-127) pickups'ı yazmıyor. Sandık açma ve envanter taşmasında artan eşyalar giveItems ile 'keep' kese olarak doğuyor (643-661) ama yalnız bellekte duruyor.
- **Oyuncuya etkisi:** Sandığı açıp çanta dolu olduğu için yanında kalan değerli eşyayı (mücevher, külçe) toplamadan çıkan ya da oyunu yenileyen oyuncu bu eşyaları kaybediyor.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** keep=true keseler (en çok 40) {id, pos, items, ship, local} olarak kaydedilmeli. Yüklemede ada kurulmadan düşmemeleri için konum zemine sabitlenmeli ya da adanın kurulması beklenmeli.
- **Tekrar üretme:** DK.G.player.inv.capacity = DK.G.player.inv.weight(); bir sandığı aç (taşma kesesi doğar) → DK.game.serialize() → save.write → startGame(read) → DK.treasure.pickups.length===0.
- **Kabul testi:** Taşma kesesi kayıt/yüklemeden sonra aynı içerikle aynı yerde duruyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11:#44
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D/SYS6 karşı doğrulaması çanta doluyken taşan ödül kesesinin kaydedilmediğini (treasure.js:99, D-14), B-05 doğrulaması lootReq keselerinin kayda yazılmadığını doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-175.

### D-15 — Kozmetik kilidi profile anında yazılıyor, altın düşüşü ise ancak sonraki kayıtta kalıcı; kilitler yuvalardan bağımsız (düşük)

- **Dosya ve fonksiyon:** js/economy/shop.js — shop.unlockCosmetic
- **Kök neden:** unlockCosmetic altını oturum envanterinden düşüyor ve profile.unlocked'ı profileChanged ile hemen dksh.profile'a yazıyor (shop.js:250-254, main.js:86); yuva kaydı ise ancak sonraki saveNow'da yazılıyor. Profil yuva kaydının parçası değil ve yedeği yok.
- **Oyuncuya etkisi:** Satın aldıktan sonra kayıttan önce çöken ya da çıkan oyuncu altınını geri alıyor ama kozmetik açık kalıyor. Bir yuvada açılan kozmetik bütün yuvalarda ve konuk kimliğinde açık. Profil bozulursa bütün kilitler ve görünüm sıfırlanıyor.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** Satın almanın hemen ardından saveNow çağrılmalı; ya da kilitler yuva kaydına taşınmalı (hesap düzeyi isteniyorsa profile .bak ve sürüm eklenmeli). Tasarım kararı belgelenmeli.
- **Tekrar üretme:** Terzide bir kozmetik al → kayıttan önce sekmeyi öldür → yeniden yükle: altın eski değerinde, karakter oluşturucuda kilit açık.
- **Kabul testi:** Satın alma sonrası çökme senaryosunda altın ve kilit tutarlı: ya ikisi birden kalıcı ya hiçbiri.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-176.

### D-16 — Kayıtta hareket bağlamı kayboluyor: kayıktaki oyuncu suda, kayık gemide başlıyor; seyirdeki gemi dümensiz yol alıyor (düşük)

- **Dosya ve fonksiyon:** js/game/game.js — game.serialize, game.start, shipControl.createPlayerShip (js/game/shipControl.js:22-39)
- **Kök neden:** serialize onShip'i yalnız deck/helm/cannon için yazıyor; 'boat' kipini ve kayık durumunu kaydetmiyor (game.js:170-175). Kayık her yüklemede gemiye bağlı kuruluyor (shipControl.js:37); kayıktaki sandıklar zemin sandığı olarak yazılıyor (treasure.js:124). Dümendeki oyuncu yüklemede güverteye konuyor (game.js:131), ama anchorState 'up' ve sailTarget geri yükleniyor (shipControl.js:32-33).
- **Oyuncuya etkisi:** Açık denizde kayıkla kaydeden oyuncu yüklemede gemiden uzakta yüzüyor, kayıktaki sandıklar suya düşüyor. Seyirde kaydedilen gemi yüklemede dümende kimse yokken yol alıp karaya oturabiliyor.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** rowboat {state, x, z, yaw, cargo} ve oyuncu kipi (boat/helm) kaydedilmeli; dümende kimse yoksa yüklemede yelkenler indirilmeli ya da çapa atılmalı.
- **Tekrar üretme:** Kayığa bin, kıyıdan 300 m açıl → serialize/save/startGame(read) → DK.G.player.mode==='swim', DK.G.rowboat.state==='docked'.
- **Kabul testi:** Yüklemeden sonra oyuncu kayıkta, kayık son konumunda; seyirde kaydedilmiş gemi dümen boşsa sail 0.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-177.

### D-17 — Hikâye boss tetik bayrakları (morvanSpawn/kizilSpawn) kalıcı bayraklarda tutuluyor: boss sahnesinde kaydedilip yüklenince boss doğmuyor (düşük)

- **Dosya ve fonksiyon:** js/game/quests.js — quests.update, quests.save
- **Kök neden:** Çalışma zamanı tetik bayrakları flags içinde kaydediliyor (quests.js:276-290, 121-124). Yüklemede boss enemies.list'te yok ama bayrak true; bayrak yalnız oyuncu 200 m uzaklaşınca sıfırlanıyor (282, 290).
- **Oyuncuya etkisi:** Morvan ya da Kızıl Hançer arenasında kaydedip yükleyen oyuncu boss'u bulamıyor; 200 m uzaklaşıp dönmesi gerektiğini bilmediği için hikâyede takılmış gibi hissediyor.
- **Öncelik:** düşük · hedef faz: Faz 6 (+Faz 4)
- **Önerilen çözüm:** Tetik bayrakları kayda yazılmamalı (save'de silinmeli) ya da start'ta boss yoksa false yapılmalı.
- **Tekrar üretme:** Aşama 3'te (-520,-440) yakınına git (Morvan doğar) → serialize/save/startGame(read) → DK.quests.flags.morvanSpawn===true ve DK.enemies.list.some(e=>e.type==='iskelet_kaptan')===false; DK.sim(10) sonrasında da doğmaz.
- **Kabul testi:** Yüklemeden sonraki 1 sn içinde arenada boss doğuyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). F-02 karşı doğrulaması aynı kök nedeni (morvanSpawn/kizilSpawn bayrağının kayda yazılması) ve önerilen çözümü doğru buldu; tetiklenme yolu düzeltmesi F-02'de. Denetçi güveni: yüksek. Bilinen sorun: KI-079.

### D-18 — Ana menüdeki 'DEVAM ET' online kayıt yuvasını taşımıyor (düşük)

- **Dosya ve fonksiyon:** js/main.js — handlers.continueLatest, menu.hostScreen (js/ui/menu.js:180-193)
- **Kök neden:** continueLatest online kayıt için menu.hostScreen()'i yuva bilgisi olmadan çağırıyor (main.js:170); hostScreen'de f.slot=0 ve seçim kutusunun varsayılanı 0 (menu.js:181, 193).
- **Oyuncuya etkisi:** En son online dünyası yuva 2 ya da 3'te olan oyuncu 'DEVAM ET' ile yuva 1'deki farklı bir dünyayı açıyor ya da yeni dünya başlatıyor (veri kaybı yok, karışıklık var).
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** hostScreen({slot}) parametresi eklenmeli ve seçim varsayılanı f.slot'tan okunmalı.
- **Tekrar üretme:** Online yuva 3'te bir kayıt oluştur (en yeni kayıt olsun) → ana menüde DEVAM ET → oda kurma ekranında 'Yuva 1' seçili gelir.
- **Kabul testi:** DEVAM ET'ten sonra oda kurma ekranında en son online yuva seçili.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11:#17, 02:H18
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-178.

### D-19 — Açılmış ada sandıkları ve sunak görsel olarak kapalı kalıyor; 'Sandığı aç' istemi sürüyor (düşük)

- **Dosya ve fonksiyon:** js/world/islands.js — islands._chest, islands._interactables
- **Kök neden:** Sandık modeli örneklenmiş toplu çizimin parçası (islands.js:744) ve opened durumuna göre değişmiyor. Etkileşimde cond yok; eylem yalnız 'Sandık boş.' bildirimi veriyor (747).
- **Oyuncuya etkisi:** Oyuncu yüklemeden sonra sandıkların yeniden dolduğunu sanıyor; dünya durumunun korunduğu görsel olarak anlaşılmıyor.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** Açılmış sandıklar için açık kapaklı model ya da soluk görünüm kullanılmalı veya model kaldırılmalı; `cond: () => !this.opened.has(id)` ile istem gizlenmeli.
- **Tekrar üretme:** Bir harabe sandığını aç → adadan uzaklaşıp dön ya da kaydet/yükle → model aynı, istem yine 'Sandığı aç'.
- **Kabul testi:** Açılmış sandık açık görünüyor ve istem çıkmıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-179.

### D-M01 — v0.4 gerilemesi: gemi satın alınınca eski geminin direk ve top can dizileri yeni tipe taşınıyor; Brigantine'in ikinci direği teslimde devrik, 4 topu ve 2. direği hasar almıyor, bozuk dizi kayda yazılıyor (yüksek)

- **Dosya ve fonksiyon:** js/game/shipControl.js — shipControl.replaceShip (41-53) / createPlayerShip (22-39); Ship kurucusu (js/ship/ship.js:43-44, 54); Ship._applyDamageVisuals (119-134); shop.buyShip (js/economy/shop.js:208-223)
- **Kök neden:** A1 düzeltmesinden sonra createPlayerShip kayıttaki parts/mastHp/cannonHp değerlerini Ship'e geçiriyor (shipControl.js:30). replaceShip eski geminin serialize çıktısını kullanıyor ve yalnız hp, holes, water ve upg alanlarını sıfırlıyor (44-46). Böylece sloop'un mastHp (1 eleman) ve cannonHp (4 eleman) dizileri, 2 direkli ve 8 toplu Brigantine'e aynen geçiyor. Ship kurucusu dizi uzunluğunu tipe göre normalleştirmiyor (ship.js:43-44). Kurucudaki _applyDamageVisuals(true) çağrısı (54) mastHp[1] undefined olduğu için 'mastHp[i] > 0' koşulunu (124) geçemiyor ve ikinci direği anında devriyor (t=1, ~77°). cannonHp[4..7] undefined olduğu için bu toplar hasar almıyor (ship.js:96) ama canFire '?? 100' sayesinde ateş edebiliyor (681). İlk isabette mastHp[1] NaN oluyor (88-90), JSON'da null'a dönüyor ve yüklemede sailFactor bu direği kırık sayıyor (115). repairShip diziyi aynı uzunlukta eşlediği için (shop.js:187) isabet olmadan düzeltmiyor; repairCost da yalnız 1 direği hesaplıyor (175). v0.3'te createPlayerShip bu dizileri geçirmediğinden (v0.3 shipControl.js:25-30) yeni gemi doğru uzunlukta dizilerle kuruluyordu.
- **Oyuncuya etkisi:** v0.4'te Brigantine satın alan (9.000 altın) her oyuncu ikinci direği ve yelkeni yan yatmış bir gemi teslim alıyor. Bu görünüm kayıt/yükleme ve tamirden sonra da sürüyor; ancak '4 tahtayla acil direk dik' etkileşimi ve ardından liman tamiri (shipControl.js:114-121) düzeltiyor. 4 top ve 2. direk hasar almıyor, bu da dengesizlik yaratıyor. Bir isabet ve kayıt/yükleme sonrası yelken çarpanı 0,5'e düşüyor. Bozuk dizi kayda ve netState ile konuklara gidiyor. Gemi satın almayı sınayan bir test yok. Hesap /tmp/denetim_alan/karsit_kayit/hp_mast_probe.mjs ile doğrulandı: devrik direk [1], hasar alabilen toplar yalnız 0–3, kayıt sonrası dizi [100,null] ve yelken çarpanı 1 → 0,5.
- **Öncelik:** yüksek · hedef faz: Faz 4
- **Önerilen çözüm:** replaceShip'te parts, mastHp ve cannonHp sıfırlanmalı (undefined bırakılıp yeni tipe göre kurulmalı). Ship kurucusunda yüklenen diziler tipe göre normalleştirilmeli: uzunluk type.masts.length ve model.cannons.length olmalı, sayı olmayan değerler 100 sayılmalı. Faz 4 yükleme göçü mevcut kayıtlardaki uzunluk uyuşmazlığını onarmalı. repairShip dizileri tip uzunluğunda yeniden kurmalı.
- **Tekrar üretme:** Tarayıcıda: DK.handlers.startGame({kind:'solo',slot:2,data:null}); yüklendikten sonra DK.G.player.inv.gold=20000; const {shop}=await import('./js/economy/shop.js'); shop.buyShip('brigantine', DK.shipControl, DK.engine.scene); ({m:DK.G.ship.mastHp.length, c:DK.G.ship.cannonHp.length, devrik:!!DK.G.ship._fallen?.[1]}) çağrısı {m:1, c:4, devrik:true} döndürür. Ardından const d=DK.game.serialize(); DK.save.write('solo',2,d); DK.handlers.startGame({kind:'solo',slot:2,data:DK.save.read('solo',2)}) ile yükleyince aynı sonuç alınır. Oyun içinde: Usta Bora'dan Brigantine satın al, ikinci direk yan yatmış görünür.
- **Kabul testi:** Satın almadan hemen sonra mastHp.length === 2, cannonHp.length === 8 ve _fallen boş. 5 numaralı topa isabet onun canını düşürüyor. Kayıt/yükleme sonrasında da aynı. Uzunluğu bozuk eski bir kayıt yüklenince diziler onarılmış geliyor. Bunlar gemi satın alma ve kayıt döngüsünü içeren otomatik bir senaryoyla sınanıyor.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-023.

### D-M02 — İçe aktarılan profil ilkel bir değer içeriyorsa oyun bir daha açılmıyor (boot'ta TypeError, oyun içinden kurtarma yok) (yüksek)

- **Dosya ve fonksiyon:** js/main.js — boot (83-85); save.profile (js/core/save.js:70-72); save.importAll (js/core/save.js:82-87)
- **Kök neden:** importAll 'dksh.profile' değerini doğrulamadan yazıyor. save.profile() JSON ilkel bir değer (5, true, "x") döndürebiliyor. boot() 'G.profile = prof || {...}' ile bu ilkel değeri kabul ediyor, ardından 'G.profile.appearance = …' ataması ES modülünün katı kipinde TypeError atıyor. Hata boot().catch'e düşüyor ve her sayfa açılışında tekrarlanıyor. İçe aktarma Ayarlar'da olduğu ve Ayarlar'a ancak boot tamamlanınca ulaşılabildiği için oyun içinden geri dönüş yolu yok. writeProfile her zaman nesne yazdığından bu durumu yalnız içe aktarma ya da elle düzenleme tetikliyor. Kod v0.3'te de aynı (v0.3 main.js:81-85).
- **Oyuncuya etkisi:** Bozuk, elle düzenlenmiş ya da kötü niyetle paylaşılmış bir kayıt dosyası içe aktarılınca yükleme ekranında 'Oyun başlatılamadı: Cannot create property 'appearance' on number…' görünüyor ve oyun hiç açılmıyor. Kullanıcı ancak tarayıcıdaki site verisini, yani bütün kayıtlarını silerek kurtulabiliyor. Etki ölçekte 'oyun açılmıyor' (kritik) sınıfında; tetiklenmesi bozuk bir dosyanın içe aktarılmasını gerektirdiği için 'yüksek' önerildi. D-04'te bu etki yok, başka alan denetimlerinde de bulunmadı.
- **Öncelik:** yüksek · hedef faz: Faz 4
- **Önerilen çözüm:** save.profile() yalnız düz nesne döndürmeli (dizi ya da ilkel değer için null). boot'ta profil alanları türlerine göre doğrulanmalı: appearance nesne, unlocked ve recentRooms dizi olmalı. importAll anahtar beyaz listesi ve değer şeması doğrulaması uygulamalı (D-04 ile birlikte). boot hatasında 'güvenli kip' seçeneği (profili ve ayarları varsayılana döndür) sunulmalı.
- **Tekrar üretme:** Node: node /tmp/denetim_alan/karsit_kayit/import_probe.mjs /home/user/SON-HAZ-NE-w2/js/core/save.js → E_profilePrimitive.boot = "TypeError: Cannot create property 'appearance' on number '5'". Tarayıcıda: içeriği {"dksh.profile":"5"} olan dosyayı Ayarlar → Kayıtları içe aktar ile yükle (ya da konsolda localStorage.setItem('dksh.profile','5')), sonra sayfayı yenile; oyun yükleme ekranında takılır.
- **Kabul testi:** Aynı dosya içe aktarmada reddediliyor ya da profil varsayılana düşüyor ve sayfa yenilenince oyun açılıyor. İlkel, dizi ve eksik alanlı profil değerleriyle boot yolunu sınayan bir birim testi geçiyor.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-024.

### D-M03 — 'Demir Bilek' becerisi olan oyuncunun canı her yüklemede şişiyor (50 → 73 → 106 → 145) (düşük)

- **Dosya ve fonksiyon:** js/game/game.js:130; js/player/player.js:42; js/game/progress.js:159-161 — game yükleme (oyuncu canı) → progress.recompute
- **Kök neden:** Yüklemede game.js:130 kayıtlı canı, azami can henüz varsayılan 100 iken (player.js:42) atıyor. Ardından progress.recompute (progress.js:159-161) oranı bu değerle (hp/100) hesaplayıp beceri bonuslu yeni azami cana uyguluyor; kayıtlı can böylece büyütülüyor.
- **Oyuncuya etkisi:** Azami canı 145 olan oyuncuda art arda yüklemelerde can 50 → 73 → 106 → 145'e çıkıyor (/tmp/denetim_alan/karsit_kayit/hp_mast_probe.mjs); kaydet-yükle ile ücretsiz iyileşme. Denge sorunu, işlev kaybı yok.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** Yüklemede önce becerileri uygula (recompute), sonra kayıtlı canı yeni azami cana kıskaçlayarak ata; ya da recompute'ta oranı yalnız becerinin değiştiği anda uygula.
- **Tekrar üretme:** Demir Bilek becerisi olan (azami can 145) ve canı 50 olan bir kaydı yükle, kaydet, yeniden yükle: can 73, 106, 145 olarak artar.
- **Kabul testi:** Becerili oyuncuda üç kaydet-yükle döngüsünden sonra can kayıttaki değerle aynı kalmalı (12 K01 benzeri kontrol, beceri açık).
- **Sürüm:** v0.3 ve v0.4 (v0.3 için rapor yazımında kod okumasıyla çıkarım: v0.3 game.js:123, progress.js:146-154)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). D/SYS1 karşı doğrulama düzeltmesinden rapor yazımında ayrı madde olarak çıkarıldı; önerilen çözüm, tekrar üretme ve kabul testi rapor yazımında yazıldı ve ayrıca sınanmadı. Bilinen sorun: KI-180.

---

**5.E Alan E — Co-op senkronu ve oturum dayanıklılığı** · 23 denetim maddesi, 4 kaçan madde · varsayılan hedef faz: Faz 5

Denetçi özeti: v0.4'te co-op, tek bir güvenilir ve sıralı PeerJS veri kanalı üzerinden ev sahibi otoriteli çalışıyor: anlık görüntü 15 Hz, ağır kısımlar 7,5 Hz, yanında olay iletileri var. v0.3'e göre yüzen nesneler (varil, şişe, kazazede, gök taşı parçası) artık konuğa iletiliyor; kalp atışı, kopma temizliği ve kısmi mesaj doğrulaması eklenmiş. Uzak varlıklar ise zaman damgası olmadan 'son hedefe sönümlü yaklaşma' ile çiziliyor. Benzetimde 1,2 sn'lik bir tıkanma, koşan oyuncuyu 8 m'den fazla ışınlıyor. Yakın/uzak ayrımı (ilgi alanı) yok. Gemi kumandasında tahmin ve uzlaştırma yok. Konuğun dümende Boşluk ile yelken açıp kapaması basışların yalnız %37–50'sinde tutuyor. Otomatik yeniden bağlanma, oda sahibi devri ve projenin yönettiği bir TURN sunucusu yok. 13. belgedeki tasarım hiç uygulanmamış. PeerJS 1.5.5'in kendi ücretsiz TURN sunucuları örtük olarak kullanılıyor; belgeler ise 'TURN yok' diyor. Ev sahibi otoritesi 'shipFull', 'hold', 'lootReq' ve 'st' iletilerinde delinebiliyor: bir konuk ev sahibinin gemisini değiştirebiliyor, gemi adına kalıcı XSS yerleştirebiliyor, ambara ve keselere sınırsız eşya koyabiliyor. Normal oyunda bile herhangi bir konuğun ambar işlemi, ev sahibi ambarındaki balıkları siliyor. Geç katılan konuğa yüzen nesneler, kilitler ve bulmaca/ada durumu aktarılmıyor. Ada sandıkları, tutsaklar ve tapınaklar istemciye yerel olduğu için ödüller çoğaltılabiliyor. Ortak zar oyunu ve oyuncular arası ticaret hiç yok. Konuk rütbesi kaydediliyor ama periyodik kayıt yok ve co-op testinde hiç ölçülmemiş. Co-op testleri çekirdek akışları sınıyor; varil/kazazede/gök taşı, zar, yeniden bağlanma, ev sahibi ayrılması, gecikme/kayıp ve konuk kaydı için senaryo yok. 4 oyunculu 06c senaryosu taban koşusunda 2/7 ile kaldı.

