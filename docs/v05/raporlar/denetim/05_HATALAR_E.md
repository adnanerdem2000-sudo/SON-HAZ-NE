# AUDIT_CURRENT §5 — Hatalar: E — Co-op senkronu ve oturum dayanıklılığı

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — E — Co-op senkronu ve oturum dayanıklılığı

### E-01 — 'shipFull' iletisi doğrulanmadan uygulanıyor: konuk ev sahibinin gemisini değiştirebiliyor, gemi adıyla kalıcı XSS yerleştirebiliyor (kritik)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData 'shipFull' (358) → _shipFull (610-619); main.js netReplaceShip (348-351); hud.js:302/310 (innerHTML)
- **Kök neden:** Konuktan gelen tam gemi nesnesi (serialize) olduğu gibi uygulanıyor. replace bayrağı ev sahibinin gemisini shipControl.replaceShip ile değiştiriyor; upg, hold, hp, holes, cannonballs, planks, name ve look doğrudan atanıyor. Ad HTML'den arındırılmıyor ve hud.js'de innerHTML ile basılıyor. Bu değerler ship.serialize ile ev sahibi kaydına giriyor.
- **Oyuncuya etkisi:** Herkese açık odaya katılan bir yabancı ev sahibinin gemisini sloop'a çevirip geliştirmelerini ve ambarını silebilir; otomatik kayıtla bu kalıcı ilerleme kaybına dönüşür. Gemi adına betik koyarak ev sahibinde ve tüm konuklarda kalıcı XSS çalıştırabilir: kayıt her yüklenip gemiye binildiğinde yeniden tetiklenir ve localStorage kayıtları okunabilir/silinebilir. Meşru kullanımda da konuğun bayat ambar/gülle/tahta değerleri ev sahibininkini eziyor. [Doğrulama eki] innerHTML ataması hud.js:311'de. İkinci kalıcı XSS yolu: quests.js:471'deki Usta Bora diyaloğu gemi adını panels.js:220'deki 'html: d.text' ile basıyor (util.js:130, innerHTML). Meşru akışta da sorun var: konuğun tersanede brigantine satın alması (panels.js:53 → shop.buyShip; ev sahibi denetimi yok) ev sahibinin gemisini değiştiriyor, geliştirmelerini sıfırlıyor ve denizdeki ev sahibini limana ışınlıyor; ev sahibinin G.ownedShips listesi güncellenmiyor. Geçersiz typeId gelirse replaceShip eski gemiyi sildikten sonra Ship kurucusunda çökebilir (ship.js:19) ve paylaşılan gemi o oturumda kaybolur (doğrulayıcı: orta güven).
- **Öncelik:** kritik · hedef faz: Faz 2
- **Önerilen çözüm:** Konuktan tam durum kabul edilmemeli. Tersane işlemleri niyet iletisine çevrilmeli ({t:'shipOp', op:'repair'|'upgrade'|'look'|'buyShip', ...}); ev sahibi koşulları ve sınırları doğrulayıp kendi gemisine uygulamalı. Ad cleanName ile arındırılmalı, HUD'da textContent kullanılmalı. replace yalnız ev sahibinin kendi işleminde geçerli olmalı.
- **Tekrar üretme:** 2 oyunculu oda. Konuk konsolu: DK.net.toHost({t:'shipFull', ship:{...DK.G.ship.serialize(), name:'&lt;img src=x onerror=alert(1)>'}}) → ev sahibi gemiye binince betik çalışır. DK.net.toHost({t:'shipFull', replace:true, ship:{id:DK.G.ship.id, typeId:'sloop', name:'x', upg:{hull:0,sails:0,cannons:0}, hold:{items:{},chests:[]}}}) → ev sahibinin gemisi sloop olur, ambar boşalır, otomatik kayıtla kalıcılaşır.
- **Kabul testi:** Yeni co-op senaryosu: sahte shipFull/replace iletilerinden sonra ev sahibinde typeId, upg, hold ve name değişmez; HUD'da ad metin olarak görünür; konuğun meşru tamir/geliştirme/görünüm niyetleri ev sahibinde uygulanır ve konuğa geri yansır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: H07 (kısmen giderildi), E_gemi-ek-statik-114, H_coop_ui-ek-statik-192
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: v0.4 ve v0.3'te doğrulandı. net.js:358 'shipFull' iletisini hiçbir denetim yapmadan _shipFull'e (610-619) veriyor ve diğer konuklara da yayıyor. 'replace' bayrağı ya da typeId farkı main.js:348-351'deki netReplaceShip'i çağırıyor. Bu yol shipControl.replaceShip'e gidiyor (shipControl.js:41-53): geliştirmeler sıfırlanıyor, gemideki ev sahibi 51. satırda limana ışınlanıyor, ardından Object.assign ile id, name, upg ve hold atanıyor. Replace olmayan yol (615) name, upg, hp, holes, water, hold, cannonballs ve planks değerlerini doğrudan atıyor; görünüm farklıysa gemi yeniden kuruluyor (617). Ad, hud.js:302'deki şablonla birleştirilip hud.js:311'de sp.innerHTML ile basılıyor; index.html'de CSP yok. Ad game.js:172 ile kayda giriyor, yüklemede shipControl.js:26 ile aynen geri geliyor ve _sendWorld (net.js:515) ile geç katılan konuklara da gidiyor. v0.3'te net.js:254, _shipFull 470-479, hud.js:281 ve main.js:342-345 aynı. Bilinen kimlikler (02: H07, E_gemi-ek-statik-114, H_coop_ui-ek-statik-192) belgede mevcut. Düzeltme/ek: Satır düzeltmesi ve ekler. innerHTML ataması 310'da değil, hud.js:311'de. İkinci bir kalıcı XSS yolu var: quests.js:471'deki Usta Bora diyaloğu gemi adını panels.js:220'deki 'html: d.text' ile basıyor (util.js:130, innerHTML). Meşru akışta da sorun var: konuğun tersanede brigantine satın alması (panels.js:53 → shop.buyShip; ev sahibi denetimi yok) ev sahibinin gemisini değiştiriyor, ev sahibinin geliştirmelerini sıfırlıyor ve denizdeki ev sahibini limana ışınlıyor; ev sahibinin G.ownedShips listesi güncellenmiyor. Geçersiz bir typeId gelirse replaceShip eski gemiyi sildikten sonra Ship kurucusunda çökebilir (ship.js:19'da SHIP_TYPES[typeId] tanımsız) ve paylaşılan gemi o oturumda kaybolur (orta güven). (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: kesin. Bilinen sorun: KI-001, KI-010 (ilgili).

### E-02 — Ambar konuktan tam nesne olarak kabul ediliyor: balıklar siliniyor, son yazan kazanıyor, yakınlık denetimi atlatılıyor, keyfî eşya giriyor (yüksek)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData 'hold' (345-357); treasure.stowInHold (treasure.js:398-418); panels.js 'Ambara koy' (101) ve balık alma (150-152); fishing.store (fishing.js:245-250)
- **Kök neden:** Ambar niyet olarak değil, konuğun yerel kopyasının tamamı olarak gönderiliyor. Ev sahibi bunu {items, chests} olarak yeniden kuruyor ve hold.fish alanını atıyor (net.js:351-352). Balık ambara konunca ya da alınınca hiç ağ iletisi gönderilmiyor (fishing.js:248, panels.js:151). Yakınlık denetimi konuğun kendi bildirdiği r.target.ship değerine dayanıyor (net.js:349). Anahtar başına 0–999 adet herhangi bir eşya kabul ediliyor.
- **Oyuncuya etkisi:** Normal oyunda: konuk ambara bir sandık ya da eşya koyduğunda ev sahibi ambarındaki tüm balıklar silinir ve kayda böyle yazılır; çanta doluyken otomatik ambara giden nadir ve epik balıklar da buna dahil. İki oyuncu aynı anda ambara bir şey koyarsa biri kaybolur; sandık dünyadan zaten kalkmış olur. Kötü niyetle: ambar her yerden boşaltılabilir ya da altin_para gibi eşyalarla 999'ar doldurulup sınırsız altın elde edilir. [Doğrulamayla düzeltildi] (1) 'Balık ambara konunca hiç ileti gitmiyor' kısmen yanlış: panels.js:101'deki 'Ambara koy' balıklar dahil netHold yayınlıyor; iletisiz yollar yalnız fishing.js:248 (çanta doluyken otomatik saklama) ve panels.js:150-152 (ambardan balık alma). (2) Her konuk ambar işleminde balıkların silinmesi v0.4 gerilemesi (B-M05); v0.3'te yalnız otomatik saklanan balıklar kayboluyordu. (3) Ters yönde konuk balığı yalnız kendi kopyasından alıyor; balık normal oyunda çoğaltılabiliyor (E-M03). (4) chests dizisine konan keyfî nesneler kalıcı bozulma da yaratıyor: geçersiz tier panels.js:133-134 ve shop.js:136/160'ta TypeError atıyor; ambar paneli açılmıyor, ambar satışı yapılamıyor, boş ambar isteyen gemi satın alma (shop.js:213) engelleniyor; 40 sahte kayıt slotları dolduruyor; ambar kayda yazıldığı için bozulma yüklemeden sonra da sürüyor (tek çıkış gemiyi batırmak, events.js:420). Kötü niyetli yolun önceliği kritik (B-05 kümesi); normal oyundaki balık kaybı için yüksek.
- **Öncelik:** yüksek · hedef faz: Faz 2
- **Önerilen çözüm:** Ambar işlemleri holdPut/holdTake niyet iletilerine çevrilmeli ({kind:'item'|'chest'|'fish', id, n, data}). Ev sahibi tek kaynak olarak balıkları da içeren tam ambarı yayınlamalı. Yakınlık ve gemide olma bilgisi ev sahibindeki gerçek konumla doğrulanmalı.
- **Tekrar üretme:** Ev sahibi güvertede 'Ambara koy' ile ambara balık koyar ya da çanta doluyken balık tutar; ardından konuk güvertede herhangi bir eşyayı 'Ambara koy' yapar → ev sahibinde DK.G.ship.hold.fish undefined olur. Kötü niyetli yol: konuk DK.net.toHost({t:'hold', ship:DK.G.ship.id, hold:{items:{altin_para:999}, chests:[]}}). Node kopyası: /tmp/denetim_alan/ev_sahibi_dogrulama_sim.mjs (madde 1).
- **Kabul testi:** 06b'ye yeni kontrol: ev sahibi ambara 2 balık koyar, konuk bir sandık ve bir eşya koyar → ev sahibinde 2 balık, sandık ve eşya birlikte durur; eşzamanlı iki koyma işleminde hiçbir şey kaybolmaz; sahte 'hold' iletisi ev sahibi ambarını değiştirmez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11: #13; 02: G_icerik-ek-statik-161, H07
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Çekirdek iddia doğru. net.js:345-357 ambarı konuğun gönderdiği nesneden {items, chests} olarak yeniden kuruyor ve fish alanını atıyor (351-352). Yakınlık denetimi, konuğun kendi 'st' iletisindeki r.target.ship değerine dayanıyor (349). Eşya sayısı anahtar başına 0–999 aralığında; chests dizisi ise hiçbir şemadan geçmiyor (352). Node denemesi /tmp/denetim_alan/karsit_E/balik_cogaltma.mjs: konuk ambara ekmek koyunca ev sahibinde hold.fish undefined oluyor. Bilinen kayıtlar (11: #13; 02: G_icerik-ek-statik-161, H07) doğru. Düzeltme/ek: (1) 'Balık ambara konunca hiç ileti gitmiyor' ifadesi kısmen yanlış. panels.js:101'deki 'Ambara koy', balıklar dahil netHold yayınlıyor. İletisiz yollar yalnız ikisi: fishing.js:248 (çanta doluyken otomatik saklama) ve panels.js:150-152 (ambardan balık alma). (2) Her konuk ambar işleminde balıkların silinmesi bir v0.4 gerilemesi. v0.3'te net.js:253 ambarı konuğun kopyasıyla aynen değiştiriyordu; ev sahibinin yayınladığı balıklar konuk kopyasında da bulunduğu için korunuyordu. v0.3'te yalnız otomatik saklanan balıklar kayboluyordu. (3) Ters yön gözden kaçmış: konuk balığı yalnız kendi kopyasından alıyor, bu yüzden normal oyunda balık çoğaltılabiliyor (missed listesine eklendi). (4) chests dizisine konan keyfî nesneler sınırsız kazancın yanında kalıcı bozulma da yaratıyor. Geçersiz bir tier panels.js:133-134'te (CHEST_TIERS[h.tier].name) ve shop.js:136/160'ta (chestPrice) TypeError atıyor. Sonuçta ambar paneli açılmıyor, ambar satışı yapılamıyor ve boş ambar isteyen gemi satın alma (shop.js:213) engelleniyor. 40 sahte kayıt slotları dolduruyor. Ambar kayda yazıldığı için bozulma yüklemeden sonra da sürüyor; tek çıkış gemiyi batırmak (events.js:420 ambarı siliyor). Bu kötü niyetli yolun önceliği 'kritik' olmalı (kalıcı ilerleme kaybı ve sınırsız kazanç); normal oyundaki balık kaybı için 'yuksek' uygun. (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: kesin. Bilinen sorun: KI-025, KI-005 (ilgili).

### E-03 — Konuk belirlediği ganimet tablosunu doğurtabiliyor; sandık/kese/kazı/boss/tehlike iletileri mesafe ve sahiplik denetimsiz (kritik)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData: lootReq (301-314), chestReq (293-299), pickupReq (300), dig (292), maps (384), hurtBoss (288; bosses.js:1041-1046), hazard (360), shipCmd (361 → _shipCmd 620-633), boat/boatSt (364-365), revive (386), story (326-333), app (274)
- **Kök neden:** Ev sahibi konuğun gönderdiği ganimet tablosunu (eşya kimliği ve 0–999 adet, 10 satır) olduğu gibi doğuruyor. Sandık açma/taşıma, kese toplama, kazı, boss hasarı ve tehlike iletilerinde mesafe ya da sahiplik denetimi yok. shipCmd 'sails' değeri sınırlanmıyor; cannonFix/mastFix indisleri doğrulanmıyor ve mastFix her seferinde gemiyi yeniden kuruyor. boatSt ham sayı atıyor; revive hedef ve mesafe denetimsiz; story bayrakları her anahtar için true yapılabiliyor.
- **Oyuncuya etkisi:** Bir konuk saniyede 120 iletiyle dilediği yere 10×999 altın/mücevher kesesi doğurabilir; bunu herkes alabilir ve ev sahibi kaydına girer (sınırsız kazanç). Ayrıca dünyanın her yerindeki sandıkları ve keseleri uzaktan açıp alabilir, bossları uzaktan öldürebilir, tüm fıçıları patlatıp bulmacaları çözebilir, hikâye bayraklarını değiştirebilir, kayığı NaN ile bozabilir, mastFix seliyle ev sahibinin kare hızını düşürebilir. [Doğrulama eki] (a) boatSt'deki sayı olmayan değer kayığı yalnız NaN ile bozmuyor: _hostSnapshot'ta (net.js:740) toFixed TypeError atıyor, anlık görüntü her karede kesiliyor ve input.endFrame atlanıyor (E-M02). (b) 'sails' değeri ship.js:285'teki damp'a giriyor; NaN ya da dev değer ev sahibi gemisinin fiziğini bozuyor; sailTarget kayda yazılıyor (ship.js:698) ve yüklemede geri geliyor (shipControl.js:33). (c) Son aşamada stage+1 gönderilirse quests.js:130-132'de STORY[to] tanımsız kalıyor, TypeError oluşuyor ve aşama geçersiz değerde kalıyor. (d) 'Keseler ev sahibi kaydına girer' ifadesi doğru değil: keseler kaydedilmiyor (11 #44); kayda giren keseyi toplayan oyuncunun altını. (e) 'gold' iletisi hâlâ karşılıksız (net.js:373-383): konuk satış yapmadan dakikada 20 000 altını diğer oyunculara verebiliyor (B-08).
- **Öncelik:** kritik · hedef faz: Faz 2
- **Önerilen çözüm:** Tür başına şema tablosu ve ortak bir doğrulayıcı kurulmalı. lootReq yalnız ev sahibinin bildiği kaynaklara bağlanmalı: kırılan sandık kimliği, ölen düşman kimliği ya da bütçeli taşma iadesi. chestReq, pickupReq, dig, hurtBoss ve hazard için ev sahibindeki uzak oyuncu konumuyla mesafe denetimi yapılmalı. shipCmd değerleri num() ile sınırlanmalı; revive yalnız yaralı hedefe ve ≤3 m içinde kabul edilmeli; story bayrakları beyaz listeden geçmeli. İhlal sayacı tutulup eşik aşılınca bağlantı düşürülmeli.
- **Tekrar üretme:** Konuk konsolu: for(let i=0;i&lt;100;i++) DK.net.toHost({t:'lootReq', pos:DK.G.player.pos.toArray(), table:[['altin_para',1,999]], exact:true}) → ev sahibinde 100 kese, toplam 99 900 altın. DK.net.toHost({t:'chestReq', a:'open', id:'&lt;uzaktaki sandık kimliği>'}) → sandığın içeriği konuğa gelir.
- **Kabul testi:** 06a'ya sahte lootReq, chestReq, pickupReq, dig, hurtBoss, hazard, shipCmd, boatSt ve revive kontrolleri eklenir; hiçbiri ev sahibi durumunu değiştirmez. Meşru akışlar (06b, 06d) geçmeye devam eder.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: H07 (kısmen giderildi); 4. bölüm 'Mesaj şeması doğrulama ve oran sınırı yardımcısı'
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: Alt iddiaların hepsi v0.4 ve v0.3 kodunda var. lootReq (net.js:301-314) tabloyu kırpıyor ama içeriği konuğa bırakıyor. 30 m denetimi konuğun kendi bildirdiği r.pos'a göre yapılıyor (305). exact tablo treasure.js:500'de olduğu gibi kullanılıyor. chestReq (293-299), pickupReq (300) ve dig (292) mesafe denetimi yapmıyor. 'maps' (384) G.remoteMapSites'ı keyfî dolduruyor; treasure.activeSites (147-153) ve resolveDig (213-238) bunu kabul ediyor, böylece konuk her kazı alanını sahiplenebiliyor. hurtBoss (288 → bosses.js:1040-1046) mesafesiz. hazard (360 → hazards.js:672-680): fitil süresi, blok konumu ve 'solve' ham geçiyor. _shipCmd (620-633): 'sails' değeri ham atanıyor (624), cannonFix/mastFix indeksi doğrulanmıyor, mastFix her iletide gemiyi yeniden kuruyor (631). _boatCmd sürücüyü m.who'dan atıyor (639), boatSt değerleri ham (365). revive (386) hedef ve mesafe denetimsiz. story (326-333) her anahtarı true yapıyor ve her iletide bir aşama ilerletiyor. app (274) adı cleanName'den geçirmiyor. Düzeltme/ek: Bazı etkiler eksik ya da kesinleştirilmeli. (a) boatSt'deki sayı olmayan değer kayığı yalnız NaN ile bozmuyor: _hostSnapshot'ta (net.js:740) toFixed çağrısı TypeError atıyor, anlık görüntü her karede kesiliyor ve input.endFrame atlanıyor (missed: hata yalıtımı; /tmp/denetim_alan/karsit_E/kayik_cokme.mjs). (b) 'sails' değeri ship.js:285'teki damp'a giriyor. NaN ya da dev bir değer ev sahibi gemisinin fiziğini bozuyor; sailTarget kayda yazılıyor (ship.js:698) ve yüklemede geri geliyor (shipControl.js:33). (c) Son aşamada stage+1 gönderilirse quests.js:130-132'de STORY[to] tanımsız kalıyor, TypeError oluşuyor ve aşama geçersiz değerde kalıyor. (d) 'Keseler ev sahibi kaydına girer' ifadesi doğru değil: keseler kaydedilmiyor (11 #44); kayda giren, keseyi toplayan oyuncunun altını. (e) 'gold' iletisi hâlâ karşılıksız (net.js:373-383): konuk satış yapmadan dakikada 20 000 altını diğer oyunculara verebiliyor (diğer denetimde B-08). (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: kesin. Bilinen sorun: KI-002 (ilgili), KI-003 (ilgili), KI-005 (ilgili), KI-007 (ilgili), KI-008 (ilgili), KI-015 (ilgili), KI-016 (ilgili), KI-017 (ilgili), KI-019 (ilgili), KI-039 (ilgili).

### E-04 — Oyuncu durumu ('st') doğrulanmıyor, oran ve boyut sınırından muaf: NaN ile mesafe denetimleri atlanıyor, yeniden yayınla bant genişliği tüketiliyor (yüksek)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData (241-249 muafiyet, 276 'st') → _remoteState (643-647) → RemotePlayer.apply/update (86-124); _hostSnapshot (737) yeniden yayın
- **Kök neden:** Oran sınırı ve 64 KB boyut sınırı yalnız 'st' ve 'ping' dışındaki iletilere uygulanıyor. 'st' yükü hiç doğrulanmadan r.target olarak saklanıyor ve her anlık görüntüde (15 Hz) tüm konuklara yeniden gönderiliyor. Sayı olmayan x/z değeri uzak oyuncu konumunu kalıcı olarak NaN yapıyor; far denetimi NaN>8 karşılaştırması false döndüğü için kendini düzeltmiyor.
- **Oyuncuya etkisi:** Konum NaN olunca 'd > sınır' biçimindeki tüm mesafe denetimleri (hurtEnemy, lootReq, hold/holdTake, floatReq) atlanır. [Doğrulamayla düzeltildi] Stok PeerJS 1.5.5 JSON kanalı kodlanmış boyutu 16 300 bayt ve üstü olan iletiyi hiç göndermiyor (chunkedMTU=16300); konuk 50 KB'lık 'st' gönderemez. Gerçek risk daha ağır: ~15,9 KB'lık bir 'st' ev sahibinin sonraki anlık görüntüsünü 16,5 KB'a çıkarıyor, her konuk bağlantısında 'message-too-big' hatası oluşuyor, net.js:233 _dropPeer'i çağırıyor ve bütün oda aynı karede düşüyor; konuklar pong almaya devam ettikleri için (net.js:269) donuk dünyada kalıyor (E-M01). Dizgi olmayan bir 'eq' değeri Character.hold'da (character.js:653) TypeError atıyor; ev sahibinde ve diğer konuklarda net.update (net.js:709) her yeni 'st' iletisinde yarıda kesiliyor. NaN diğer konuklara da yayılır. ['NaN düşman yapay zekâsına yayılır' kısmı E doğrulamasında sınanmadı; B-04 denetçisi düşmana NaN geri tepme yazıldığını ve düşman konumunun kalıcı NaN olduğunu ölçtü (enemies.js:390-395, 1187-1190).]
- **Öncelik:** yüksek · hedef faz: Faz 2
- **Önerilen çözüm:** 'st' için alan şeması tanımlanmalı: sayılar num() ile ±10 000 içinde, anim/up/eq/mode beyaz listeden, ship var olan bir gemi kimliği. 1 KB boyut sınırı ve saniyede en çok 30 'st' uygulanmalı; NaN ya da sonsuz içeren ileti yok sayılmalı. RemotePlayer.update'e NaN koruması eklenmeli.
- **Tekrar üretme:** Konuk konsolu: DK.net.toHost({t:'st', s:{...DK.G.player.netState(), x:'x'}}) → ev sahibinde [...DK.G.remotes.values()][0].pos.x NaN olur. Ardından 300 m uzaktaki düşmana DK.net.toHost({t:'hurtEnemy', id, dmg:160, kind:'melee'}) → hasar uygulanır. Node kanıtı: /tmp/denetim_alan/ev_sahibi_dogrulama_sim.mjs (madde 2).
- **Kabul testi:** Sahte ya da dev 'st' iletileri yok sayılır ve uzak oyuncu konumu sonlu kalır. 06a'daki uzak hasar kontrolü NaN konumla denendiğinde de reddedilir. Boyut sınırını aşan bir 'st' (ör. 15–16 KB) reddedilir, diğer konuklara yansımaz ve ev sahibinin anlık görüntüsü 16 300 baytın altında kalır [doğrulama düzeltmesi: 50 KB'lık 'st' stok istemciyle üretilemez].
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: H07 ('st' kapsam dışında kaldı)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: NaN kısmı doğru. net.js:241 'st' ve 'ping' iletilerini oran ve boyut sınırından muaf tutuyor. 276 → _remoteState (643-647) → apply (86) zinciri yükü ham saklıyor. update (96-100), x dizgi olunca konumu NaN yapıyor; 'far' karşılaştırması (NaN>8) false döndüğü için NaN kalıcı oluyor. '>' kalıbındaki denetimler NaN'da geçiyor: hurtEnemy 284, lootReq 305, hold 350, holdTake 319, floatReq (events.js:233). '&lt;' kalıbındakiler ise reddediyor: stunEnemy 289, hurtAnimal 290, hurtMarine 291, chestState 337. Denetçinin bu ayrımı doğru. _hostSnapshot 737 r.target'ı ham haliyle yayıyor. Düzeltme/ek: Boyut ve bant genişliği mekanizması yanlış kurulmuş. Stok PeerJS 1.5.5 JSON kanalı, kodlanmış boyutu 16 300 bayt ya da üstü olan iletiyi hiç göndermiyor (vendor/peerjs/peerjs.min.js, JSON _send, chunkedMTU=16300). Konuk 50 KB'lık bir 'st' gönderemez; kabul testindeki 50 KB 'st' stok istemciyle üretilemez. Gerçek risk daha ağır: ~15,9 KB'lık bir 'st' gönderilebiliyor ve ev sahibinin sonraki anlık görüntüsünü 16,5 KB'a çıkarıyor. Bu durumda her konuk bağlantısında 'message-too-big' hatası oluşuyor, net.js:233 _dropPeer'i çağırıyor ve bütün oda aynı karede düşüyor. Konuklar pong almaya devam ettikleri için (net.js:269) donuk dünyada kalıyor (missed listesinde; /tmp/denetim_alan/karsit_E/peerjs_sinir.mjs). Ayrıca dizgi olmayan bir 'eq' değeri Character.hold'da (character.js:653) TypeError atıyor; ev sahibinde ve diğer konuklarda net.update (net.js:709) her yeni 'st' iletisinde yarıda kesiliyor. 'NaN düşman yapay zekâsına yayılır' kısmı bu incelemede doğrulanmadı. (uygulanan alanlar: oyuncuya etkisi, kabul testi) Denetçi güveni: yüksek. Bilinen sorun: KI-004.

### E-05 — Geç katılan ya da yüklenmekte olan konuğa yüzen nesneler, kilitler, tehlike/bulmaca ve ada durumu aktarılmıyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — _sendWorld (510-522); events.applyFloats (events.js:239-248); treasure.start ve events.start (treasure.js:105-117, events.js:46-54); main.js applyWorld (325-342)
- **Kök neden:** Dünya iletisi yalnız gemi, sandık, kese, görev, zaman ve kayığı taşıyor. Yüzen nesneler, interact.locks, hazards (gone/solved/looted) ve islands (opened/freed/temples) gönderilmiyor. applyFloats tanımadığı kimliği atlıyor. Konuk yüklenirken gelen chestSpawn, floatSpawn, pickupSpawn, lock ve marker iletileri systems.start() tarafından siliniyor ve yeniden gönderilmiyor.
- **Oyuncuya etkisi:** Oyun sürerken katılan ya da yeniden katılan konuk ev sahibinin denizdeki varil, şişe, kazazede ve gök taşı parçalarını hiç görmez. Dolu dümeni veya topu boş sanıp alır, girdileri yok sayılır. Ev sahibinin kırdığı sandıkları ya da patlattığı fıçıları yeniden kırıp ganimeti çoğaltabilir. Çözülmüş bulmacayı çözülmemiş görür ve kafes çarpıştırıcısına takılır. Yükleme sırasında doğan sandık konukta hiç belirmez.
- **Öncelik:** orta · hedef faz: Faz 2 (+Faz 4, Faz 5)
- **Önerilen çözüm:** Dünya iletisine netFloats (tür bilgisiyle birlikte), locks, hazards.save() ve islands.save() eklenmeli. Konukta sessionStart'tan sonra ev sahibinden ikinci bir tam eşitleme ({t:'resync'}) istenmeli. applyFloats tanımadığı kimliği türüyle oluşturabilmeli.
- **Tekrar üretme:** Ev sahibi oyundayken DK.events.spawnFloating('barrel', &lt;yakın bir konum>) çağırır ve dümene geçer; ardından konuk katılır → konukta DK.events.floating boş kalır ve DK.interact.locks dümen kilidini içermez.
- **Kabul testi:** 06b'ye geç katılım bölümü eklenir: ev sahibi önce varil doğurur, dümene geçer, bir fıçı patlatır, bir bulmaca çözer; sonra katılan konukta varil görünür, dümen kilitli, fıçı yok ve bulmaca çözülmüş olur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: G_icerik-ek-statik-164
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D-03 ve G-02 karşı doğrulamaları yeniden katılımda opened/looted/freed ve tehlike/bulmaca durumunun konuğa boş geldiğini doğruladı. Yüzen nesne ve kilit kısmı ayrıca sınanmadı. Denetçi güveni: kesin. Bilinen sorun: KI-012.

### E-06 — Ada ödül sandıkları, tutsaklar, sunak ve tapınak durumu her istemcide ayrı; co-op'ta ödüller çoğaltılabiliyor (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — _chest (741-750), sunak sandığı (858-859), tutsak hücresi (956-963), update (271-292)
- **Kök neden:** islands.js'de hiç ağ kodu yok: opened, freed ve templeState her istemcide ayrı tutuluyor. Ada içeriği her istemcide yalnız kendi oyuncusunun çevresinde kuruluyor (islands.js:273). Konuğun ada durumu konuk kaydına yazılmıyor (main.js:203).
- **Oyuncuya etkisi:** Co-op'ta her oyuncu aynı ada sandığını ayrı ayrı açıp ganimeti alabilir; konuk her oturumda yeniden açabilir, bu kalıcı bir çoğaltmadır. Ev sahibi tutsakları kurtardığında konukta tutsaklar hücrede görünmeye devam eder ve konuk +120 altını yeniden alır. Tapınak kapısı ve mekanizması iki tarafta farklı durumda olabilir.
- **Öncelik:** orta · hedef faz: Faz 2 (+Faz 4, Faz 5)
- **Önerilen çözüm:** Ada işlemleri ev sahibine istek olarak gönderilmeli ({t:'islandAct', id, a}); ev sahibi durumu değiştirip yayınlamalı, ödülü netGive ile vermeli. Dünya iletisine islands.save() eklenmeli.
- **Tekrar üretme:** Ev sahibi ve konuk aynı adada. Ev sahibi 'Sandığı aç' yapar → konukta aynı sandık hâlâ açılabilir ve içerik konuğun çantasına girer. Konuk menüye dönüp yeniden katılınca sandığı bir kez daha açabilir.
- **Kabul testi:** Co-op testi: ev sahibi sandığı açınca konukta 'Sandık boş' görünür. Konuk tutsakları kurtarınca ev sahibinde tutsaklar kalkar ve islands.freed bunu içerir; ev sahibi kaydında da görünür.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: G_icerik-ek-statik-164 (geç katılım kısmı)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). D-03 ve G-02 karşı doğrulamaları ada sandıkları, tutsaklar, sunak ve bulmaca durumunun konukta ayrı tutulduğunu ve ödüllerin yeniden alınabildiğini doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-012.

### E-07 — Ev sahibi sekmesi arka plandayken dünya ve anlık görüntüler donuyor; konuklar uyarılmıyor (orta)

- **Dosya ve fonksiyon:** js/core/engine.js — loop (54, 70: yalnız requestAnimationFrame); net.update (net.js:696-732); _hostData 'ping' (net.js:269); _clientData (net.js:527)
- **Kök neden:** Benzetim ve anlık görüntü gönderimi yalnız rAF döngüsünde çalışıyor; sekme gizlenince rAF duruyor. Ev sahibinin olay işleyicisi ping'lere pong yanıtı vermeye devam ettiği için konuklarda _lastHostMsg tazeleniyor. Bu yüzden 6 sn zayıf bağlantı uyarısı ve 25 sn zaman aşımı hiç tetiklenmiyor.
- **Oyuncuya etkisi:** Ev sahibi alt-tab yaptığında düşmanlar, gemi (dümende konuk olsa bile), olaylar ve zaman tüm konuklar için açıklamasız donar. Konuk istekleri işlenir ama sonuçları anlık görüntüyle yansımaz; ortaya yarım bir durum çıkar.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Ev sahibi görünürlük değişiminde {t:'hostPause', on} yayınlamalı ve konukta 'Kaptan uzakta' göstergesi çıkmalı; ya da Worker tabanlı bir zamanlayıcıyla arka planda 5–10 Hz benzetim ve görüntü sürdürülmeli. Konuk zayıf bağlantıyı pong'a göre değil, son 'snap' iletisinin yaşına göre değerlendirmeli.
- **Tekrar üretme:** 2 oyunculu oda. Ev sahibi sekmesini 30 sn arka plana alır → konukta DK.enemies.list konumları ve DK.G.ship.x değişmez, hiçbir bildirim çıkmaz.
- **Kabul testi:** Ev sahibi gizlendikten sonra 2 sn içinde konukta duraklama göstergesi çıkar; ya da arka plan benzetimiyle anlık görüntüler en az 5 Hz sürer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: 4. bölüm H_coop_ui 'Kalp atışı zaman aşımı ve yeniden bağlanma akışı'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-067.

### E-08 — Uzak varlık yumuşatması zaman damgasız ve ara belleksiz: tıkanmada lastik bant etkisi ve ışınlanma oluyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — RemotePlayer.update (87-124); ship.clientUpdate (ship.js:566-579); enemies._interp (enemies.js:1621-1638); join() kanal seçenekleri (418)
- **Kök neden:** İletilerde zaman damgası ya da sıra numarası yok. Alıcı yalnız son hedefe 1−e^(−14dt) oranıyla yaklaşıyor ve fark 8 m'yi aşınca tek karede ışınlıyor. Tüm trafik tek güvenilir ve sıralı kanalda olduğu için paket kaybı yeniden iletim bekletmesine (HOL) ve ardından toplu varışa dönüşüyor.
- **Oyuncuya etkisi:** /tmp/denetim_alan/uzak_oyuncu_sim.mjs ölçümleri: 7 m/sn koşuda tıkanma olmadan bile 1,1 m geriden izleniyor; 0,6 sn tıkanmada kare başına 0,87 m sıçrama (normalin ~7,5 katı); 1,2 sn ve üstü tıkanmada 8,4–14 m ışınlanma. Gemi 12 m'de sıçrıyor. Kullanıcının 'paket kaybında ışınlanma olmamalı' hedefi karşılanmıyor.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Görüntüye ev sahibi zamanı (ms) ve sıra numarası eklenmeli. Konukta 100–150 ms geriden ara bellekli interpolasyon yapılmalı; boşlukta en çok 250 ms dış değerleme, sonrasında hız sınırlı yakalama uygulanmalı. Işınlama yalnız açık olaylarda (gemiye biniş, teleport) yapılmalı. Durum iletileri için ordered:false ve maxRetransmits:0 ayarlı ikinci bir DataChannel açılmalı.
- **Tekrar üretme:** Node benzetimi (yukarıdaki dosya); ya da tarayıcıda ev sahibinin net.update'ini 1,5 sn atlatıp koşan ev sahibini konuktan izlemek → tek karede 8 m'den büyük sıçrama görülür.
- **Kabul testi:** Yapay gecikme/kayıp testi (%5 kayıp, 100 ms gecikme): uzak oyuncu kare başına normal adımın en çok 2 katı ilerler; 1,5 sn tıkanmada ışınlanma olmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-068.

### E-09 — İlgi alanı yönetimi yok: tüm varlıklar her konuğa aynı sıklıkta ve tam liste olarak gidiyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — _hostSnapshot (734-743), broadcast (489)
- **Kök neden:** Tüm oyuncular, gemiler, yüzen nesneler ve mermiler her görüntüde; tüm düşman, hayvan ve deniz devi listeleri her iki görüntüde bir gönderiliyor. Konuğun konumu dikkate alınmıyor ve her konuğa aynı JSON gidiyor.
- **Oyuncuya etkisi:** 02. belge ölçümü: 2,3–3 KB/görüntü, konuk başına ~20–36 KB/sn, 3 konukta ev sahibi çıkışı ~1 Mbit/sn. Uzak adadaki konuk ilgisiz varlıkları da alır; zayıf bağlantıda tıkanma ve E-08'deki ışınlanma riski artar.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Konuk başına görüntü üretilmeli: ≤150 m her görüntüde, ≤600 m üç görüntüde bir, ötesi 1 Hz ya da hiç. Değişmeyen alanlar gönderilmemeli (delta); kısaltılmış anahtar ya da ikili serileştirme kullanılmalı; yeni varlıklar ayrı bir 'spawn' iletisiyle bildirilmeli.
- **Tekrar üretme:** 06b'nin profil adımında ev sahibinde JSON.stringify(snap).length ölçülür; konuk 2 km uzağa taşınır → boyut değişmez.
- **Kabul testi:** Uzaktaki konuğa giden görüntü, yakındaki konuğunkinin en çok %40'ı kadardır; 4 oyunculu oturumda ev sahibi çıkışı 300 kbit/sn'yi aşmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: 4. bölüm H_coop_ui 'Snapshot bant genişliği'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-069.

### E-10 — Konuk dümende: yelken komutu anlık görüntüyle eziliyor (basışların yarıdan fazlası kayboluyor), dümen bırakılınca dümen açısı ev sahibinde kalıyor (orta)

- **Dosya ve fonksiyon:** js/ship/ship.js — applyNet (714: this.sailTarget = s[6]); player._updateHelm (player.js:905-912); net.update 'helm' (net.js:719); shipControl.leaveStation (shipControl.js:194-213)
- **Kök neden:** Konuk dümende sailTarget'ı yerelde değiştirip 15 Hz'lik 'helm' iletisiyle gönderiyor. Ancak her ev sahibi görüntüsü yerel sailTarget'ı ev sahibinin eski değeriyle eziyor ve konuk bir sonraki iletide bu eski değeri geri gönderiyor. leaveStation dümeni yalnız yerelde sıfırlıyor; ev sahibine rudder:0 gitmiyor ve 'lock' kapanışı da dümeni sıfırlamıyor.
- **Oyuncuya etkisi:** /tmp/denetim_alan/dumen_yelken_sim.mjs: konuğun Boşluk ile yelken aç/kapa basışlarının yalnız %37–50'si tutuyor ve bu gecikmeden bağımsız. W/S ayarı yavaş ve titrek. Konuk A ya da D basılıyken dümeni bırakırsa (ya da bağlantısı koparsa) gemi ev sahibinde dönmeye devam eder.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Dümendeki konuk için applyNet sailTarget'ı ezmemeli; ya da girdi sıra numarasıyla ev sahibinin onayladığı son değer esas alınmalı. Yelken aç/kapa 'shipCmd sails' niyetiyle gitmeli. leaveStation ve _dropPeer'da ev sahibi setRudder(0) uygulamalı; istasyon kilidi kapanınca o istasyonun girdileri sıfırlanmalı.
- **Tekrar üretme:** 2 oyunculu oda. Konuk dümende aralıklarla 10 kez Boşluk'a basar → ev sahibinde DK.G.ship.sailTarget 10'dan az kez değişir. Konuk A basılıyken E ile dümeni bırakır → ev sahibinde rudderInput sıfırdan farklı kalır.
- **Kabul testi:** Co-op kontrolü: konuğun 10 aç/kapa basışının 10'u da ev sahibinde uygulanır; dümen bırakılınca ev sahibinde rudderInput 0 olur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: E-15, H_coop_ui-ek-statik-197
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-070.

### E-11 — Kilit isteği reddedilince konuğa bildirilmiyor; reddedilen istek diğer konuklara yine de 'on' olarak yayılıyor (düşük)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData 'lock' (366-372); shipControl.takeHelm/takeCannon (174-192)
- **Kök neden:** Ev sahibi kilidi vermese bile {t:'lock', on:true, who:pid} yayınlıyor; kilidin sahibi olmayan konuğun 'off' iletisini de yayınlıyor. İstekte bulunan konuğa ret dönülmüyor ve konuk kilidi yerelde kendine yazmış oluyor.
- **Oyuncuya etkisi:** Eşzamanlı istasyon almada ya da geç katılımda konuk 'Dümendesin' mesajını görür ama girdileri yok sayılır. Diğer konuklarda kilidin sahibi yanlış görünür ya da dümen boş sanılır.
- **Öncelik:** düşük · hedef faz: Faz 5
- **Önerilen çözüm:** Kilit kararı yalnız ev sahibinde verilmeli: istek → {t:'lockResult', id, ok, who}. Yayın yalnız gerçek durum değiştiğinde yapılmalı; konuk ret alınca istasyondan çıkmalı.
- **Tekrar üretme:** Ev sahibi dümendeyken geç katılan bir konuk E ile dümene geçer → konukta mode 'helm' olur, ev sahibinde kilit ev sahibinde kalır; üçüncü bir oyuncuda locks.get(gemi+':helm') konuğun kimliğini gösterir.
- **Kabul testi:** Reddedilen istekte konuk istasyondan çıkarılır ve bildirim görür; tüm eşlerde kilit sahibi aynıdır.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-181.

### E-12 — Konuğun tersanede yaptığı tam tamir ev sahibine yalnız gövde/delik/su olarak ulaşıyor; direk, top, bölge hasarı ve yangın onarılmıyor ama ücret tam alınıyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — _shipFull (610-619); shop.repairShip (shop.js:179-192), repairCost (shop.js:170-178)
- **Kök neden:** _shipFull yalnız name, upg, hp, holes, water, hold, cannonballs, planks ve look alanlarını uyguluyor; parts, mastHp, cannonHp ve fires atlanıyor. Konuk ise bölge, direk ve top dahil tam ücreti kendi tarafında ödüyor.
- **Oyuncuya etkisi:** Konuk Usta Bora'ya tamir parası öder; ev sahibinde direkler, toplar, bölge hasarı ve yangın onarılmaz. Bir sonraki görüntüyle direk konukta da yeniden devrilir; altın boşa gider, gemi yavaş ya da topsuz kalır.
- **Öncelik:** orta · hedef faz: Faz 2
- **Önerilen çözüm:** Tamir de E-01'deki gibi niyet iletisine çevrilmeli: ev sahibi repairShip'teki sıfırlamaların tamamını (parts, mastHp, cannonHp, fires, rebuild) kendi gemisine uygulamalı. Ücret, ev sahibinin onayı geldikten sonra düşülmeli.
- **Tekrar üretme:** Ev sahibinde s.mastHp[0]=0 ve s.cannonHp[0]=20 yapılır; konuk limanda 'Gemiyi tamir et' seçer → ev sahibinde mastHp[0] hâlâ 0, cannonHp[0] 20 kalır; 1 sn sonra konuğun kopyası da 0'a döner.
- **Kabul testi:** Co-op testi: konuk tamirinden sonra hem ev sahibinde hem konukta tüm parts=100, mastHp ve cannonHp=100, fires=[] olur ve direk dik durur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: E-07 (önerinin _shipFull kısmı), E_gemi-ek-statik-114
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Mekanizma (gemi hizmetleri konukta yerel uygulanıyor, ev sahibine 'shipFull' ile gidiyor) B-01 denetçisinin kök neden tanımıyla örtüşüyor; ev sahibinin hangi alanları uyguladığı ayrıca sınanmadı. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-071.

### E-13 — Konuğun 'Batan gemimi kurtar' (600 altın) ve 'Tayfa kirala' (500 altın) işlemleri yalnız yerelde çalışıyor; ödenen altın boşa gidiyor (orta)

- **Dosya ve fonksiyon:** js/game/events.js — raiseShip (428-440); quests.js 'Tayfa kirala' (364-368) ve 'Batan gemimi kurtar' seçeneği (470); events.update tayfa bloğu (82-87)
- **Kök neden:** Her iki işlem de G.online/G.isHost denetimi yapmadan yerelde çalışıyor ve ev sahibine hiçbir ileti gitmiyor. Konuktaki gemi kopyası bir sonraki görüntüyle (applyNet: sunk, x, z) geri alınıyor. G.crewHired konuk kaydına da girmiyor; yalnız ev sahibi kaydında tutuluyor (main.js:77-78).
- **Oyuncuya etkisi:** Konuk 600 altın öder; gemi konukta bir an yüzeye çıkar, sonra yeniden batar, ev sahibinde ise batık kalır. 500 altınlık tayfa yalnız konuğun yerel kopyasında su boşaltıp tahta harcar ve her oturumda yeniden satın alınması gerekir.
- **Öncelik:** orta · hedef faz: Faz 2
- **Önerilen çözüm:** Konukta bu işlemler ev sahibine niyet olarak gönderilmeli ({t:'shipOp', op:'raise'|'hireCrew'}) ve ücret ev sahibinin onayıyla düşülmeli; ya da seçenekler konukta 'Bunu kaptan yapabilir' açıklamasıyla devre dışı bırakılmalı.
- **Tekrar üretme:** Ev sahibinde gemi batırılır (s.sunk=true). Konuk Usta Bora'da 'Batan gemimi kurtar' seçer → konuğun altını 600 azalır; 1 sn sonra konukta DK.G.ship.sunk yine true olur, ev sahibinde de true kalır.
- **Kabul testi:** Konuğun kurtarma isteği ev sahibinde gemiyi kurtarır: iki tarafta da sunk=false ve gemi limanda. Ya da seçenek konuğa hiç sunulmaz ve konuğun altını değişmez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: E_gemi-ek-statik-113, H_coop_ui-ek-statik-193, E_gemi-ek-statik-115
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-072.

### E-14 — Ev sahibi ayrılınca açık paneller ve G.uiOpen temizlenmiyor; sonraki oturumda girdi kilitli başlıyor (orta)

- **Dosya ve fonksiyon:** js/main.js — G.on('hostLeft') (313-318); ui.close (ui.js:51-67); openChat (main.js:354)
- **Kök neden:** hostLeft işleyicisi ui.closeAll() çağırmadan game.stop() ile G.state'i 'menu' yapıyor. ui.close G.uiOpen'ı yalnız G.state 'playing' iken sıfırladığı için bayrak true kalıyor. Sohbet girişi odaktayken de G.uiOpen=true kalıyor.
- **Oyuncuya etkisi:** Ev sahibi ayrıldığında açık olan envanter ya da dükkân paneli ana menünün üstünde kalır. Sonraki oturumda oyuncu yürüyemez, kamera dönmez, kısayollar çalışmaz (player.js:353, game.js:197-199); bu durum Esc ile duraklatma menüsü açılıp kapatılana kadar sürer.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** hostLeft'te önce ui.closeAll() çağrılmalı, sohbet kutusu kapatılmalı, G.uiOpen=false yapılmalı ve input.unlockPointer() çağrılmalı. game.start başında da G.uiOpen=false atanmalı.
- **Tekrar üretme:** Konukta envanter (Tab) açıkken ev sahibi sekmesini kapatır → konukta ana menü ve üstünde açık envanter görünür. Yeni bir oyun başlatılınca DK.G.uiOpen === true olur ve WASD çalışmaz.
- **Kabul testi:** Senaryo: konukta panel açıkken hostLeft gelir → ui.stack boş ve G.uiOpen false olur; yeni oturumda hareket hemen çalışır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: H_coop_ui-ek-statik-190
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-073.

### E-15 — Konuk ilerlemesi için periyodik kayıt yok; çökmeden sonra eski yuva kaydı daha yeni rütbeyi eziyor (orta)

- **Dosya ve fonksiyon:** js/game/progress.js — start (94-107), _guestSave (110); game.update otomatik kayıt (game.js:218); menu.pause (menu.js:348); handlers.saveNow (main.js:199-206)
- **Kök neden:** Otomatik kayıt yalnız G.isHost iken yapılıyor. Konukta kayıt yalnız seviye atlama, yetenek öğrenme, sekme gizlenmesi/kapanması, menüye dönüş ve hostLeft anlarında oluyor. progress.start, yuva kaydında progress varsa daha yeni olabilecek dksh.progress.guest anahtarına hiç bakmıyor; seviye atlama ise yalnız bu anahtarı güncelliyor.
- **Oyuncuya etkisi:** Tarayıcı ya da sekme çöktüğünde veya işlem öldürüldüğünde (özellikle mobilde) son kayıttan bu yana kazanılan XP, eşya ve keşif kaybolur. Çökmeden önce seviye atlanmışsa bir sonraki katılımda eski yuva yüklenir ve yeni seviye kalıcı olarak silinir, çünkü bir sonraki _guestSave eski değeri yazar. Konuk elle de kaydedemiyor.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** Konukta 60–120 sn'de bir yerel kayıt alınmalı ve duraklatma menüsüne 'Kişisel ilerlemeyi kaydet' eklenmeli. progress.start iki kaynaktan (yuva ve anahtar) savedAt ya da seviye+XP'si büyük olanı seçmeli; _guestSave anahtara savedAt yazmalı.
- **Tekrar üretme:** Konuk XP kazanıp seviye atlar (dksh.progress.guest yeni seviyeyi içerir). Sekme, beforeunload çalışmadan süreç öldürülerek kapatılır. Konuk yeniden katılınca progress.level eski seviyede başlar.
- **Kabul testi:** 2 oyunculu test: konuk seviye atlar, sayfa beforeunload olmadan zorla yeniden yüklenir (localStorage korunur); yeniden katılınca seviye ve XP korunur. 120 sn'lik oynamada en az bir konuk kaydı yazılır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: H16 (03. belgede kapatıldı deniyor, kodda hâlâ açık), A7 (giderildi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-09). Denetçi güveni: yüksek. Bilinen sorun: KI-063.

### E-16 — Otomatik yeniden bağlanma yok; aynı adla eşleşme ölü kod; dolu odada hayalet yuva; renk çakışması; düşürme nedeni bildirilmiyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — join (410-443; kapanışta yalnız hostLeft, 441); _hostData 'hello' (250-268); _dropPeer (390-403); update kalp atışı (704)
- **Kök neden:** Kopmada konuk doğrudan menüye düşürülüyor; otomatik yeniden deneme ya da ICE yeniden başlatma yok. Yeniden katılım eşleşmesi (255) roster'da bağlantısız kayıt arıyor, ama _dropPeer kaydı roster'dan siliyor (394); bu yüzden eşleşme fiilen hiç çalışmıyor. Eski bağlantı, oyundaysa 15 sn, değilse WebRTC kapanışına (30 sn+) kadar yuvayı tutuyor. Renk roster uzunluğundan seçiliyor (257). Ev sahibi düşürdüğü konuğa neden göndermiyor; 'kick' iletisi hiçbir yerde gönderilmiyor.
- **Oyuncuya etkisi:** Kısa bir kopmada konuk menüye atılır, kodu yeniden girmek zorunda kalır, limanda doğar (main.js:341) ve taşıdığı sandık yerde kalır. 4/4 dolu odada çöken konuk 15–30 sn boyunca 'Oda dolu' alır. Geri gelen konuk başka bir oyuncuyla aynı rengi alabilir. Ekrandaki 'Oda sahibi ayrıldı' metni yanıltıcıdır. 06c taban koşusu 2/7 ile kaldı (bilinen #37).
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Konukta otomatik yeniden katılma eklenmeli: aynı kod, 1-2-4-8 sn üstel bekleme, 60 sn'ye kadar. Ev sahibi oturum belirteciyle 60 sn boyunca koltuk, konum ve rengi ayırmalı; aynı belirteçle gelen yeni bağlantı eskisini hemen düşürmeli. 'kick'/'drop' nedeni iletisi gönderilmeli, renk boş renk havuzundan seçilmeli, ICE 'failed' durumunda yeniden bağlanma denenmeli.
- **Tekrar üretme:** 3 oyunculu oda. Konuk sekmesini yeniler ve hemen aynı kodla katılır → ev sahibinde roster'da aynı adla 2 kayıt ve 15 sn boyunca hayalet bir uzak oyuncu görünür. 4/4 dolu odada aynı işlem 'Oda dolu.' ile reddedilir.
- **Kabul testi:** Konuk sekmesi yenilenince en çok 10 sn içinde aynı renk ve konumla oyuna döner; roster'da çift ad olmaz; dolu odada ret alınmaz. 06c 10 ardışık koşuda 7/7 geçer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11: #37; 02: 4. bölüm 'Kalp atışı zaman aşımı ve yeniden bağlanma akışı'
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). B/SYS3, E/DOC2 ve E/UC9 karşı doğrulamaları otomatik yeniden bağlanmanın olmadığını ve aynı adla eşleşme dalının ölü kod olduğunu (net.js:255, 394) doğruladı. Renk çakışması ve düşürme nedeninin bildirilmemesi ayrıca sınanmadı. Denetçi güveni: yüksek. Bilinen sorun: KI-074.

### E-17 — Olaylar ev sahibi merkezli: konuk çevresinde olay çıkmıyor; bildirim, ödül ve XP konuğa ulaşmıyor (orta)

- **Dosya ve fonksiyon:** js/game/events.js — update (89-95), _classic (122-156), collectFloating (217-219), _updateEnemyShip (301-319); worldEvents.context (worldEvents.js:78-84), _updateWisps (worldEvents.js:163-190); net.js _clientData 'story' (568)
- **Kök neden:** Olay zamanlayıcısı ve konum seçimi yalnız ev sahibinin oyuncusuna ve gemisine göre yapılıyor. Olay bildirimleri G.notify ile yalnız ev sahibinde çıkıyor. Düşman gemisini ele geçirme altını p.inv.gold ile yalnız ev sahibine gidiyor; shipCaptured ve enemyShipSunk XP'si de yalnız ev sahibine yazılıyor. Gök taşı için rareFind yalnız toplayan ev sahibiyse tetikleniyor. Hayalet ışıklar yalnız ev sahibi yaklaşınca ilerliyor ve olayı yalnız o bitirebiliyor. Konukta 'story' iletisi aşamayı doğrudan yazıyor; advance çağrılmadığı için bildirim ve XP yok.
- **Oyuncuya etkisi:** Ev sahibinden uzaktaki konuğun çevresinde hiç olay üretilmez. Ev sahibinin yanındaki konuk nesneyi görür, ama gözcü uyarısını, fırtına ya da düşman gemisi bildirimini ve kuş olayını almaz. Düşman gemisini birlikte yenen konuk altın ve XP alamaz. Konuk hikâye ilerlediğinde 'Yeni görev' görmez ve 150 XP'yi kaçırır.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Olay bağlamı rastgele ya da en uygun oyuncuya göre seçilmeli; uzak oyuncu konumları ev sahibinde zaten mevcut. Bildirimler {t:'notify', text, kind} ile yayınlanmalı; ödüller shop.earn ve netXp ile paylaştırılmalı; ışıklar en yakın oyuncuya göre ilerlemeli. Konukta 'story' gelince advance'e eşdeğer bildirim ve XP verilmeli.
- **Tekrar üretme:** Konuk ev sahibinden 1 km uzakta 10 dk denizde kalır → konukta hiç olay çıkmaz. Ev sahibinin yanında DK.events.trigger('enemyShip') çağrılır → düşman tayfası yenilince yalnız ev sahibinin altını artar.
- **Kabul testi:** Co-op testi: konuğun yakınında tetiklenen olay konukta bildirim üretir; ele geçirme altını ve XP her oyuncuya paylaştırılır; konuk hikâye ilerleyince 'Yeni görev' bildirimini görür.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: G_icerik-ek-statik-163; 4. bölüm 'Dünya olaylarını konuklarla paylaş' (kısmen uygulandı) ve 'Konuk hayalet ışık kurulumu'
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). E/UC4 ve E/UC5 karşı doğrulamaları olayların ev sahibine göre konumlandığını, konukta rareFind ve özel bildirimin olmadığını doğruladı (events.js:217-219, worldEvents.js:78-91). Denetçi güveni: kesin. Bilinen sorun: KI-075.

### E-18 — Konuklar gülle ve lav bombası patlamalarından hasar almıyor (orta)

- **Dosya ve fonksiyon:** js/game/combat.js — init → G.on('explosion') (44-54); effects.update gülle zemin çarpması (effects.js:186-187)
- **Kök neden:** 'explosion' işleyicisi yalnız yerel G.player'a hasar veriyor (combat.js:53). Ev sahibindeki patlamada uzak oyuncular denetlenmiyor. Konukta gülleler ve lav bombaları yalnız görsel (G.visualOnlyBalls; net.js:573, worldEvents.js:292) olduğundan konukta hiç patlama olayı üretilmiyor.
- **Oyuncuya etkisi:** Volkanik bombardıman ve düşman gemisinin karaya düşen gülleleri yalnız ev sahibine zarar veriyor; konuklar bağışık kalıyor. Bu hem denge hem adalet sorunu.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Ev sahibinin patlama işleyicisinde G.remotes için mesafe denetimi yapılmalı ve vurulan oyunculara netHurtPlayer({cause:'Patlama'}) gönderilmeli.
- **Tekrar üretme:** Ev sahibi ve konuk yan yana. Ev sahibinde DK.G.emit('explosion', {pos:&lt;konuğun konumu>, radius:3.5, dmg:40}) çağrılır → konuğun canı değişmez.
- **Kabul testi:** Co-op testi: konuğun 2 m yakınındaki bir patlama konuğun canını düşürür.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: F_dusman-ek-statik-138
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). H alanının denetçisi aynı kusuru bağımsız olarak buldu (H-17); E/UC5 doğrulaması konukta güllelerin yalnız görsel olduğunu doğruladı (effects.js:117, 187). Denetçi güveni: kesin. Bilinen sorun: KI-076.

### E-19 — Konuğun satış payı ev sahibi sınırında kırpılıyor; aradaki fark kayboluyor (düşük)

- **Dosya ve fonksiyon:** js/net/net.js — _hostData 'gold' (373-383); shop.earn (shop.js:120-129)
- **Kök neden:** Satış yapan konuk payı (gold/(n+1)) kendi altınından önceden düşüyor. Ev sahibi ise iletiyi 5000'e kırpıyor ve dakikalık 20 000 bütçeyi aşan iletiyi tamamen atıyor. Aradaki fark kimseye gitmiyor.
- **Oyuncuya etkisi:** 2 oyunculu odada konuk 12 000 altınlık satış yaparsa ev sahibi 6000 yerine 5000 alır ve 1000 kaybolur. 4 oyunculu odada 30 000'lik satışta üç alıcı 7500 yerine 5000 alır; toplam 7500 kaybolur. Bir dakika içinde çok satış yapan konuğun bütçeyi aşan payı tümden kaybolur.
- **Öncelik:** düşük · hedef faz: Faz 2
- **Önerilen çözüm:** Pay ev sahibinde hesaplanmalı (konuk satışı bildirir, ev sahibi doğrular); ya da kırpılan fark satan konuğa geri gönderilmeli ({t:'goldRefund'}) ve bütçe aşımında red bildirilmeli.
- **Tekrar üretme:** /tmp/denetim_alan/ev_sahibi_dogrulama_sim.mjs (madde 3). Oyunda: 2 oyunculu odada konuk ambardaki 4 efsane sandığı (12 000) satar → ev sahibi yalnız +5000 alır.
- **Kabul testi:** Meşru bir satışta tüm oyunculara dağıtılan toplam, yuvarlama dışında satış tutarına eşittir.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). B alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (B-M04). Denetçi güveni: kesin. Bilinen sorun: KI-044.

### E-20 — Uzak oyuncunun görünüm değişikliği, meşalesi ve yaralı düşme bildirimi eşitlenmiyor (düşük)

- **Dosya ve fonksiyon:** js/net/net.js — _remoteState (643-647), _hostData 'app' (274) ve 'downed' (385), RemotePlayer.update (87-124), _clientData (526-578)
- **Kök neden:** RemotePlayer yalnız ilk görüldüğünde kuruluyor; terzide görünüm değişince ('app') karakter yeniden kurulmuyor ve isim etiketi güncellenmiyor. 'st' içindeki torch alanı hiç uygulanmıyor. 'downed' ev sahibinde yalnız yerel bildirim olarak kalıyor, diğer konuklara yayılmıyor; konukta 'downed' işleyicisi de yok.
- **Oyuncuya etkisi:** Terzide kıyafet değiştiren oyuncu diğerlerinde eski görünümüyle kalır. Gece meşale ışığı diğer oyuncularda görünmez. Yaralı düşen tayfa için diğer konuklar bildirim almaz; yalnız takım listesinde 'YARALI' yazar.
- **Öncelik:** düşük · hedef faz: Faz 5
- **Önerilen çözüm:** 'app' gelince RemotePlayer.char.build(app) çağrılmalı ve etiket yenilenmeli. Uzak oyuncuya meşale görseli ve ışığı eklenmeli. 'downed' ev sahibinde yayınlanmalı ve konukta işlenmeli.
- **Tekrar üretme:** Konuk terzide şapka değiştirir → ev sahibindeki uzak karakter değişmez. Konuk F ile meşale yakar → ev sahibinde ışık görünmez.
- **Kabul testi:** Co-op testi: görünüm değişikliği en çok 1 sn içinde diğer oyunculara yansır; meşale durumu eşittir; yaralı bildirimi tüm eşlerde çıkar.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-182.

### E-21 — Ev sahibinden uzaktaki konukta buzdağı örgüleri saniyede ~7 kez kurulup siliniyor (düşük)

- **Dosya ve fonksiyon:** js/game/worldEvents.js — update (363-373), applyNet (325-337)
- **Kök neden:** Konukta update, yerel oyuncudan 1400 m'den uzaktaki buzdağını 'gone' işaretleyip siliyor. Ev sahibi görüntüsü (7,5 Hz) aynı tohumu yeniden gönderdiği için applyNet onu yeniden kuruyor.
- **Oyuncuya etkisi:** Buzul olayı sırasında ev sahibinden 1400 m'den uzaktaki konuk her saniye ~7 kez 3–6 ikosahedron örgüsü ve malzemesi kurup bırakır. Ekranda görünmez, ama gereksiz GPU yüklemesi, çöp ve Ship.obstacles dalgalanması yaratır.
- **Öncelik:** düşük · hedef faz: Faz 5
- **Önerilen çözüm:** applyNet ile gelen (remote:true) buzdağları konukta mesafe ya da süreye göre silinmemeli; ya da ilgi alanı süzgeciyle (E-09) uzak konuğa hiç gönderilmemeli.
- **Tekrar üretme:** Ev sahibi buzul bölgesinde DK.worldEvents.trigger('iceberg') çağırır; konuk 2 km uzaktadır → konukta 5 sn boyunca icebergs uzunluğu ve geometri sayacı sürekli dalgalanır.
- **Kabul testi:** Uzaktaki konukta buzdağı sayısı sabit kalır ve renderer.info.memory.geometries dalgalanmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-183.

### E-22 — Herkese açık odalar 12 küresel ve öngörülebilir yuvayla sınırlı; ev sahibinin oyuncu atma aracı yok (düşük)

- **Dosya ve fonksiyon:** js/net/net.js — host (198-221), listPublic (451-467); menu.lobby (menu.js:264-302)
- **Kök neden:** Açık odalar PeerJS bulutunda sabit dksh-v1-pub-0..11 kimliklerini kullanıyor; dünya genelinde en çok 12 açık oda olabiliyor ve bu adreslere herkes bağlanabiliyor. 'kick' işleyicisi var ama ev sahibinin bunu gönderebileceği bir arayüz ya da kod yolu yok.
- **Oyuncuya etkisi:** Açık odaya giren kötü niyetli bir oyuncu (E-01..E-04) odadan atılamaz. Yuvalar başka kişilerce işgal edilebilir; 13. açık oda kurulamaz.
- **Öncelik:** düşük · hedef faz: Faz 2
- **Önerilen çözüm:** Lobi ve duraklatma menüsüne 'At' düğmesi ve oturum içi engel listesi eklenmeli. Yuva kimlikleri sürüme bağlı bir tuz ya da önekle türetilmeli; uzun vadede küçük bir lobi sunucusu düşünülmeli.
- **Tekrar üretme:** 13 sekmede herkese açık oda kurulmaya çalışılır → 13. sekmede 'Tüm herkese açık oda yuvaları dolu' hatası alınır.
- **Kabul testi:** Ev sahibi lobide ve oyunda bir konuğu atabilir; atılan konuk 'Odadan çıkarıldın' mesajını görür ve aynı oturumda yeniden katılamaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02: 4. bölüm 'Oyuncu atma / engelleme arayüzü'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). 'Ev sahibinin oyuncu atma aracı yok' kısmı B-17 ile örtüşüyor; 12 küresel yuva kısmı ayrıca sınanmadı. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-041.

### E-23 — Çoklu sekme kilidi yok: aynı dünya yuvası ya da konuk kaydı iki sekmede birbirini eziyor (düşük)

- **Dosya ve fonksiyon:** js/core/save.js — write/read (15-45); main.js startOnlineHost/startOnlineGuest (174-197)
- **Kök neden:** Aynı tarayıcıda iki sekme aynı online yuvayı ya da tek ve küresel konuk anahtarlarını (dksh.guest.0, dksh.progress.guest) kullanabiliyor. BroadcastChannel ya da navigator.locks kullanılmıyor.
- **Oyuncuya etkisi:** İki sekmede aynı dünyayı barındırmak ya da iki farklı odaya konuk olarak katılmak kayıtları birbirine ezdirir; son yazan kazanır ve dünya ya da rütbe geri sarılır.
- **Öncelik:** düşük · hedef faz: Faz 4
- **Önerilen çözüm:** navigator.locks.request('dksh-slot-'+kind+slot) ile yuva kilidi alınmalı; kilit alınamazsa 'Bu dünya başka bir sekmede açık' uyarısı gösterilmeli. Konuk anahtarına savedAt ve sekme kimliği yazılmalı.
- **Tekrar üretme:** İki sekmede aynı online yuva 'Oda kur' ile açılır ve farklı ilerlemeler yapılır → yalnız son kaydeden sekmenin durumu kalır.
- **Kabul testi:** İkinci sekme aynı yuvayı açmaya çalıştığında engellenir ve uyarı görür.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-11). Denetçi güveni: kesin. Bilinen sorun: KI-065.

### E-M01 — PeerJS JSON kanalının 16 300 baytlık sınırı: aşan ileti 'error' üretiyor, ev sahibi konuğu düşürüp bağlantıyı açık bırakıyor; konuk pong aldığı için donuk dünyada 'hayalet' kalıyor (tek 'st' tüm odayı düşürüyor, büyük 'world' geç katılımı sessizce bozuyor) (yüksek)

- **Dosya ve fonksiyon:** js/net/net.js — _onConn 'error' → _dropPeer (233, 390-403); broadcast (489); _hostSnapshot (734-743); _sendWorld (510-522); _hostData 'ping' (269); vendor/peerjs/peerjs.min.js JSON DataConnection._send (chunkedMTU=16300)
- **Kök neden:** PeerJS 1.5.5 JSON serileştirmesi, kodlanmış boyutu 16 300 bayt ya da üstü olan iletiyi göndermiyor; bunun yerine 'message-too-big' error olayı yayıyor. Ev sahibi her bağlantı hatasını kopma sayıp _dropPeer'i çağırıyor. _dropPeer conns, roster ve uzak oyuncu kaydını siliyor ama conn.close() çağırmıyor ve konuğa neden bildirmiyor. 'ping' conns denetiminden önce yanıtlandığı için (269) düşürülen konuğun _lastHostMsg değeri tazelenmeye devam ediyor; 6 sn uyarısı ve 25 sn zaman aşımı (705-707) hiç tetiklenmiyor. Gönderimden önce boyut denetimi yok: 'st' 64 KB ve oran sınırından muaf (241) ve her anlık görüntüye ham giriyor (737); 'world' tek parça gönderiliyor. 64 KB'lık MAX_MSG_BYTES dalı (248) stok istemcinin zaten gönderemeyeceği bir boyutta. FAZ2 tasarımındaki hakem bulgusu Y-1 ile örtüşüyor; hayalet konuk durumu ve test geçerliliği bu incelemenin ek bulgusu.
- **Oyuncuya etkisi:** Kötü niyetli yol: konuk ~15,9 KB'lık tek bir 'st' gönderir; kendi PeerJS'i bunu gönderebilir. Ev sahibinin sonraki anlık görüntüsü 16,5 KB'a çıkar ve bütün konuklar aynı karede düşer. Konuklar menüye dönmez, donmuş dünyada kalır; ev sahibi tek başına kalır. Meşru yol: uzun bir oturumda (ör. 8 sandık, 20 kese, 60 işaret ve dolu brigantine ambarı, ≈16,7 KB) geç katılan konuğun 'world' iletisi gönderilemez. Konuk düşürülür ama bunu bilmeden kendi yerel dünyasında tek başına oynar. Test geçerliliği: 06a/06a2'deki 'H07/H22 200 KB sohbet düşürülür' kontrolü ileti konuktan hiç çıkmadığı için geçiyor; ev sahibinin boyut sınırı sınanmamış. 08. belgedeki 'büyük ileti yok sayıldı' yorumu yanlış.
- **Öncelik:** yüksek · hedef faz: Faz 2 (+Faz 5)
- **Önerilen çözüm:** Ağ katmanında göndermeden önce boyutu ölç ve gerekirse parçala: 'raw'/'binary' serileştirme ile kendi çerçeveleme ya da 'world' ve anlık görüntüyü bölümlere ayırma. 'message-too-big' hatasını kopma sayma; konuğu yalnız 'close' olayıyla ya da kalp atışıyla düşür. _dropPeer'den önce {t:'kick', why} gönder ve conn.close() çağır. 'ping'i yalnız kayıtlı bağlantılara yanıtla. 'st' için 1 KB'lık, diğer iletiler için 16 KB'ın altında bir uygulama sınırı koy. 06a'daki sohbet kontrolünü ev sahibine gerçekten ulaşan bir iletiyle yeniden yaz.
- **Tekrar üretme:** 2 oyuncu. Konuk konsolunda: DK.net.toHost({t:'st', s:{...DK.G.player.netState(), pad:'A'.repeat(15800)}}). Ev sahibinde bir sonraki karede DK.net.conns.size ve DK.G.remotes.size 0 olur. Konukta 30 sn sonra DK.G.state hâlâ 'playing', DK.net.hostConn.open true ve DK.G.ping güncelleniyor. Meşru yol: ev sahibinde 60 işaret, 20 kese ve dolu bir ambar oluşturduktan sonra yeni bir konuk katılır; konuğa 'world' gelmez ve ev sahibinin roster'ında konuk görünmez. Node: /tmp/denetim_alan/karsit_E/peerjs_sinir.mjs ve dunya_boyutu.mjs.
- **Kabul testi:** Yeni bir co-op kontrolü: 15,9 KB'lık 'st' gönderildikten sonra hiçbir konuk düşmüyor ya da yalnız gönderen, nedeni bildirilerek atılıyor. 25 KB'lık dünya durumu olan bir odada geç katılan konuk dünyayı eksiksiz alıyor. Ev sahibi bir konuğu düşürdüğünde konuk en geç 5 sn içinde nedenini gösteren bir bildirimle menüye dönüyor. Sohbet boyut kontrolü ev sahibine ulaşan bir ileti üzerinden ölçülüyor.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). B alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (B-M01). Bilinen sorun: KI-009.

### E-M02 — Ana döngüde hata yalıtımı yok: sahte 'boat'+'boatSt' iletisi ev sahibinin anlık görüntüsünü her karede çökertiyor ve input.endFrame atlanıyor; oturum donuyor (diğer denetimdeki B-03/B-09 ile aynı kök, E-03 bunu yalnız 'kayığı NaN ile bozma' olarak anmış) (yüksek)

- **Dosya ve fonksiyon:** js/net/net.js — _boatCmd (634-641), _hostData 'boatSt' (365), _hostSnapshot m.rb (740); main.js engine updater (117-123); engine.js loop (65-67); RemotePlayer.update → Character.hold (net.js:115, character.js:646-653)
- **Kök neden:** 'boat' iletisindeki cmd:'driver' sürücüyü 'who' değerini doğrulamadan atıyor (639); böylece herhangi bir konuk kayığın sürücüsü olabiliyor. 'boatSt' x, z, yaw, sp ve rp değerlerini ham yazıyor (365). _hostSnapshot (740) bu alanlarda toFixed çağırıyor; sayı olmayan bir değer TypeError atıyor. Kayık 'water' durumundayken Rowboat.update (ship.js:790-806) dizgi olan x değerini düzeltmiyor, bu yüzden hata her karede tekrarlanıyor. main.js:117-123'teki güncelleyici tek bir fonksiyon: net.update hata atınca input.endFrame (input.js:163-168) çalışmıyor. engine.js:66 hatayı yalnız console.error ile yutuyor. Benzer şekilde 'st' içindeki dizgi olmayan bir 'eq' değeri Character.hold'da (character.js:653) TypeError atıyor; bu da uzak oyuncu döngüsünü (net.js:709) ve o karedeki gönderimi kesiyor.
- **Oyuncuya etkisi:** Tek bir konuk tek iletiyle bütün oturumu kilitleyebilir. Ev sahibi anlık görüntü göndermeyi bırakır ve tüm konukların dünyası donar; pong sürdüğü için zaman aşımı uyarısı da çıkmaz. Ev sahibinde pressedSet ve fare hareketleri hiç sıfırlanmaz: bir kez basılan E, Tab ya da 1-5 tuşu her karede yeniden tetiklenir, fare hareketi birikerek kamerayı döndürür. Oyun sayfa yenilenene kadar oynanamaz. Durum, ev sahibi kayığı limana çekene ya da konuk geçerli bir boatSt gönderene kadar sürer.
- **Öncelik:** yüksek · hedef faz: Faz 2
- **Önerilen çözüm:** Güncelleyicileri birbirinden ayır: input.endFrame'i try/finally içinde her karede çağır. net.update içinde uzak oyuncular, anlık görüntü bölümleri ve kalp atışını ayrı try/catch bloklarıyla yalıt. 'boat' sürücü atamasını yalnız boş kayıkta ve isteyen oyuncunun kendi kimliği için kabul et. boatSt alanlarını num() ile sonlu ve hız sınırlı yaz. 'st' alanlarını şemayla doğrula (eq, anim ve up için beyaz liste). Anlık görüntü üretiminde toFixed'den önce Number.isFinite denetimi yap.
- **Tekrar üretme:** 2 oyuncu, kayık suda ya da limanda. Konuk konsolunda: DK.net.toHost({t:'boat', cmd:'driver', who:DK.G.myId}); DK.net.toHost({t:'boatSt', x:'a', z:0, yaw:0, sp:0, rp:0}). Ev sahibi konsolunda her karede 'b.x.toFixed is not a function' hatası görülür. Konukta gemi ve düşman konumları değişmez. Ev sahibi bir kez Tab'a basınca envanter her karede açılıp kapanır. Node: /tmp/denetim_alan/karsit_E/kayik_cokme.mjs.
- **Kabul testi:** Sahte boat, boatSt ve st iletilerinden sonra: ev sahibi anlık görüntü göndermeye devam ediyor (konukta snap sayacı artıyor), ev sahibinde input.pressed bir kare sonra false dönüyor, kayık sürücüsü değişmiyor ve konsolda kare başına hata görülmüyor.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). B alanının denetçisi aynı kusuru bağımsız olarak buldu (B-09, doğrudan doğrulandı). Bilinen sorun: KI-014.

### E-M03 — Konuk ambardan balığı yalnız kendi kopyasından alıyor: ev sahibinin ambarı değişmiyor, balık normal oyunda çoğaltılabiliyor (orta)

- **Dosya ve fonksiyon:** js/ui/panels.js — panels.hold içinde balık 'Al' (150-152); net.js _clientData 'hold' (563); panels.js 'Ambara koy' (101); treasure.stowInHold netHold (treasure.js:417)
- **Kök neden:** Ambar ev sahibinden konuğa tam nesne olarak kopyalanıyor (net.js:563, s.hold = m.hold). Ev sahibinin 'Ambara koy' işlemi ve diğer ambar işlemleri balıkları da yayınlıyor (panels.js:101, treasure.js:417). Konuk ambar panelinde balığı alınca balık yalnız yerel kopyadan silinip çantasına ekleniyor; netHold ya da holdTake gönderilmiyor (panels.js:151). Ev sahibinin her yeni ambar yayını konuğun kopyasını balıkla yeniden dolduruyor.
- **Oyuncuya etkisi:** Normal oyunda, hile aracı olmadan çoğaltma mümkün. Ev sahibi epik bir balığı (değeri 280–420) ambara koyar; konuk onu alır, ev sahibi de alır. Ev sahibi ambara başka bir şey koydukça konuk aynı balığı yeniden alabilir. Balıklar satılarak altın, koleksiyon kaydı da çoğaltılır; ev sahibi ile konuğun ambar görünümü ayrışır. E-02 balığın silinmesini anlatıyor; bu bulgu ters yön ama ikisi aynı kök nedene bağlı.
- **Öncelik:** orta · hedef faz: Faz 2
- **Önerilen çözüm:** Balık dahil tüm ambar alma ve koyma işlemleri holdPut/holdTake niyet iletileriyle ev sahibinde yapılmalı. Konuk yerel kopyayı değiştirmemeli, ev sahibinin yayınını beklemeli. Balıklar kimlik taşımalı (fish[i].id) ki aynı balığın ikinci kez alınması reddedilebilsin.
- **Tekrar üretme:** Ev sahibi güvertede bir balığı Envanter → 'Ambara koy' ile ambara koyar. Konuk gemiye binip ambar panelinden balığı 'Al'ır. Ev sahibinin ambar panelinde balık hâlâ görünür ve alınabilir. Ev sahibi ambara bir tahta koyar; konuğun panelinde aynı balık yeniden görünür. Node: /tmp/denetim_alan/karsit_E/balik_cogaltma.mjs (1 balık → toplam 3).
- **Kabul testi:** 06b'ye eklenecek kontrol: ev sahibi 1 balık koyar, konuk alır → ev sahibinin ambarında balık sayısı 0, konuğun çantasında 1. Ev sahibi yeni bir ambar işlemi yapınca balık konukta yeniden görünmez. Toplam balık sayısı korunur.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metninden çıkarım; açıkça belirtilmedi)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-077, KI-025 (ilgili).

### E-M04 — Ganimet kesesinin konumu doğuştan sonra eşitlenmiyor: ev sahibinde sekip suda sürüklenen kese konukta doğduğu yerde kalıyor (orta)

- **Dosya ve fonksiyon:** js/treasure/treasure.js — spawnLoot (550-577), update kese dalı (163-180); net.js pickupSpawn/_spawnPickup (168, 559, 581-591), _hostSnapshot (734-743)
- **Kök neden:** Ev sahibinde kese fiziksel bir gövde (bodies.add, treasure.js:573): fırlatma hızı var, yüzerliği 1,6, varsayılan rüzgâr sürüklenmesi 0,4 (bodies.js:29, 126-127). Konumu gövdeden güncelleniyor (172). Konukta kese net:true ile gövdesiz doğuyor ve doğduğu noktada zemine ya da su yüzüne oturtuluyor (173-177). pickupNet yalnız doğuşta gidiyor; anlık görüntüde kese konumu yok. Oysa sandıklar m.ch, yüzen nesneler de floats ile eşitleniyor. pickupReq'de mesafe denetimi olmadığı için (net.js:300) alma işlemi bugün yine de çalışıyor. Bu bulgu statik okumaya dayanıyor, çalıştırılmadı; güven orta.
- **Oyuncuya etkisi:** Karada kese ev sahibinde 1–2 m sekip yuvarlanıyor, konukta ise doğduğu yerde duruyor. Suda (deniz boss ödülü, batan gemide ölen düşmanlar, yüzerken 'Yere bırak') kese 10–30 dk boyunca rüzgârla sürükleniyor, konukta yerinde kalıyor. Oyuncular aynı keseyi farklı yerlerde görüyor. E-03'ün önerdiği mesafe denetimi eklenirse konuğun gördüğü yerdeki kese ev sahibine göre uzakta kalacağı için konuk bu keseleri alamaz hale gelir.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Keseleri ağır anlık görüntüye ekleyin: m.ch'ye benzer biçimde kimlik ve konum, yalnız değiştiğinde. Ya da suya düşen ve hareket eden keselerin konumunu periyodik olarak gönderin; konukta yumuşatarak uygulayın. Mesafe denetimi eklenecekse, ev sahibindeki kese konumu ile konuğun ev sahibindeki konumu karşılaştırılmalı ve konukta görünen konum önce bununla eşitlenmiş olmalı.
- **Tekrar üretme:** 2 oyuncu, rüzgârlı havada iskele yanında. Ev sahibi konsolunda suya bir kese doğurulur: DK.treasure.spawnLoot(new DK.THREE.Vector3(x,0.5,z), [['altin_para',1,50]], 'Test', true). 60 sn sonra ev sahibi ve konuktaki aynı kimlikli kesenin pos değerleri karşılaştırılır; fark metrelerce. Karada doğan kesede fark 1–2 m.
- **Kabul testi:** Co-op kontrolü: suya doğan kese 60 sn sonra ev sahibinde ve konukta en çok 1 m farkla aynı yerde. Karada sekmeden sonra fark en çok 0,5 m. Mesafe denetimi eklendiğinde konuk gördüğü keseyi alabiliyor.
- **Sürüm:** belirtilmedi (karşı doğrulama metninde belirtilmedi)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). E/SYS1 doğrulama notunda aynı doğrulayıcı tarafından kaydedildi; ayrı bir kaynakla sınanmadı. Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-078.

---

**5.F Alan F — Ana hikâye ve görevler** · 11 denetim maddesi, 3 kaçan madde · varsayılan hedef faz: Faz 6

Denetçi özeti: v0.4'te hikâye içeriği ve tetikleyicileri v0.3 ile aynıdır; quests.js'deki tek fark han aşçısı seçeneğidir. STORY dizisi 6 girdi içerir: 0–4. aşamalar (Tuzla → Martı Adacığı hazinesi → Yankı Mağarası günlüğü → İskelet Kaptan Morvan → Kızıl Hançer) gerçek mekaniklere bağlıdır; 6. girdi 'Yitik Ufuk'a Doğru' ise tetikleyicisi olmayan bir yer tutucudur, bu yüzden hikâye 2/4 harita parçasında ve finalsiz biter. Kaptan Mira Veyl, Son Hazine, Gelgit Pusulası, Yitik Ufuk ve 3–4. parçalar yalnız metinde geçer. Kodda hiç doğmayan 'Mira Veyl'in Sandığı' (legend) kademesi dışında final için bir oyun nesnesi yoktur. Beş efsanevi boss sabit konumlarda yaklaşma koşuluyla doğar ve yenilince kalıcı olarak işaretlenir, ama hikâyeyle hiçbir kod bağı yoktur; Kızıl Hançer'in mektubu Volkanik Dev'i ('Ateşin Bekçisi') ve Derinlik Yılanı'nı ('Buzların Altındaki Kraliçe') işaret etse de bu bosslar yenilince parça vermez. Bu yüzden kullanıcının ikinci iddiası kısmen doğrudur: bosslar hikâyeye bağlı değildir ama rastgele de değildir; Morvan ile Kızıl Hançer ise hikâyeye bağlıdır. Birinci iddia doğrudur: README ve eski yol haritası 6–10. aşamaları eksik olarak yazar; ancak v0.4'ün kendi yol haritası (denetim/14) ve bilinen sorunlar listesi (denetim/11) bu maddeyi hiç anmaz. En ciddi bulgu yalnız v0.4'te olan bir co-op hatasıdır: konuğun başka dünyalardan kalan hikâye bayrakları ev sahibinin kaydına sızar ve 'gunluk' bayrağı 2. aşamayı kalıcı olarak kilitler. Ayrıca hikâye bossunun doğuş bayrağı kayda yazıldığı için, boss alanının yakınında yüklenen oyunda boss 200 m uzaklaşılmadan doğmaz. v0.4'te hikâye akışını sınayan etiketli bir test yoktur; dünya (6 bölge, 23 özel ada, 17 düşman türü, 5 boss, bulmacalar, olaylar) 6–10. aşamalar için zengin bir altyapı sunar, ancak yeni bir ada eklemek deterministik dünya testini bozacağı için Yitik Ufuk ayrı bir mekanizmayla eklenmelidir.

