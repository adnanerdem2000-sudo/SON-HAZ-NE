// Faz 0 birleştirme kararları (rapor yazımı). Kod değiştirmez; yalnız uret.cjs tarafından okunur.
'use strict';

const ALAN_FAZ = { A: 'F1', B: 'F2', C: 'F3', D: 'F4', E: 'F5', F: 'F6', G: 'F6', H: 'F7', I: 'F7', J: 'F8', K: 'F9' };
const FAZ_AD = {
  F1: 'Faz 1 — Arazi işçisi ve açılış',
  F2: 'Faz 2 — Ağ güvenliği ve host otoritesi',
  F3: 'Faz 3 — Fizik, çarpışma ve görüş hattı',
  F4: 'Faz 4 — Kayıt ve dünya kalıcılığı',
  F5: 'Faz 5 — Co-op',
  F6: 'Faz 6 — Hikâye ve dünya içeriği',
  F7: 'Faz 7 — AI, animasyon ve kamera',
  F8: 'Faz 8 — Performans',
  F9: 'Faz 9 — Yayın',
};
// KARARLAR.md "Test adları" tablosu
const TEST_KISA = { F1: '`02_` grubu', F2: 'co-op `06e`–`06n`', F3: '`18`–`22`, `22a`–`22e`', F4: '`23`–`26`, co-op `06o`–`06q`', F5: 'co-op `06r`–`06z`', F6: '`27`–`36`, co-op `07a`/`07b`', F7: '`37`–`44`, co-op `08a`–`08c`', F8: '`45`–`52`, co-op `08d`–`08f`', F9: '`53`–`60`' };
const TEST_ADLARI = {
  F1: "`02_` arazi grubu (`02_hizli_yolculuk`, `02_arazi_yasam`, `02_ayar_lod`, `02_depolama_kapali`, `02_acilis_akisi`) ve Faz 9'dan öne alınan `53_test_kipi`",
  F2: 'co-op `06e`–`06n`',
  F3: 'tarayıcı `18`–`22`, `22a`–`22e`',
  F4: 'tarayıcı `23`–`26`, co-op `06o`–`06q`',
  F5: 'co-op `06r`–`06z`',
  F6: 'tarayıcı `27`–`36`, co-op `07a`, `07b`',
  F7: 'tarayıcı `37`–`44`, co-op `08a`–`08c`',
  F8: 'tarayıcı `45`–`52`, co-op `08d`–`08f`',
  F9: 'tarayıcı `53`–`60`',
};

// "kısmen" hükümlerinden gelen öncelik düzeltmeleri
const ONCELIK = {
  'C-03': 'yuksek', 'D-03': 'kritik', 'D-05': 'orta', 'F-02': 'orta', 'H-02': 'orta',
  'I-01': 'orta', 'J-01': 'orta', 'J-02': 'orta', 'J-03': 'orta', 'K-01': 'orta',
};

// Alan düzeltmeleri: r = metni değiştir, sub = [eski, yeni] parça değişimi, e = sona ek
const DUZELTME = {
  'B-01': { impact: { e: "[Doğrulama eki] Otomatik kayıt dursa da sayfa yenileme/kapama (main.js:382-383 beforeunload) ve sekme değiştirme (main.js:385 visibilitychange) saveNow çağırıyor; ship.serialize (ship.js:694-703) upg/hold/hp alanlarını undefined yazıyor ve yüklemede shipControl.js:25-30 varsayılanlara dönüyor: gemi geliştirmeleri ve ambar içeriği kalıcı olarak kayboluyor. upg geçerli verilirse çökme olmadan gemi adı da yazılıyor; ad hud.js:302/311'de innerHTML'e girdiği için kalıcı XSS doğuyor (B-M02)." } },
  'B-02': {
    rootCause: { e: "[Doğrulama düzeltmesi] 'İleti oranı denetlenmiyor' değil: genel 120/sn sınırı (net.js:241-247) shipCmd'ye de uygulanıyor; eksik olan komut başına sınır." },
    impact: { e: "[Doğrulama düzeltmesi] cannonFix yolunda kayıt bozulmuyor; JSON.stringify (save.js:17, try dışında) hata verdiği için kayıt hiç yazılamıyor. Asıl kalıcı bozulma sails yolunda: sailTarget kayda giriyor (ship.js:697), yüklemede shipControl.js:33 `ship.sailTarget = ship.sail = 'abc'` ile geri geliyor; gemi her yüklemede NaN hızla kayboluyor ve co-op'ta netState'te `this.sail.toFixed` TypeError'u anlık görüntüyü durduruyor." },
  },
  'B-03': { impact: { e: "[Doğrulama eki] rp dize ise ev sahibi kürek çekse de düzelmez (`rowPhase += dt*4.5` dize birleştirir); _dropPeer (net.js:400) sürücüyü sıfırlar ama rowPhase'i sıfırlamaz, bozulma sayfa yenilenene dek kalıcıdır." } },
  'B-04': {
    impact: {
      sub: [
        ["(3) eq nesne ya da sayı olursa Character.hold'da `type.startsWith` TypeError oluşuyor ve ev sahibinin net.update'i her yeni 'st'de düşüyor.",
          "(3) eq nesne ya da sayı olursa Character.hold'da `type.startsWith` TypeError oluşuyor ve ev sahibinin net.update'i düşüyor [doğrulama düzeltmesi: sayı türündeki eq yalnız değer değiştiğinde istisna atar, çünkü heldType character.js:650'de istisnadan önce atanıyor; 'her yeni st'de' etkisi nesne eq için geçerli]."],
        ["(4) 64 KB'ı aşan 'st' 15 Hz anlık görüntüyle her konuğa çoğaltılıyor (bant genişliği büyütme).",
          "(4) [Doğrulamayla düzeltildi] Stok PeerJS 1.5.5 JSON kanalı kodlanmış boyutu 16 300 bayt ve üstü olan iletiyi göndermiyor ('message-too-big'); konuk 64 KB'lık 'st' yollayamaz, ev sahibi de büyük 'snap'i iletemez. Gerçek etki daha ağır: ~15 KB'lık bir 'st' ev sahibinin sonraki 'snap'ini eşiğin üstüne itiyor, her konuğa gönderim 'error' üretiyor ve net.js:233'teki koşulsuz `conn.on('error', () => this._dropPeer(conn.peer))` bütün konukları düşürüyor (B-M01)."],
      ],
    },
  },
  'B-05': { impact: { e: "[Doğrulama eki] lootReq keseleri kayda yazılmıyor (treasure.js:120-126; 11 #44), kalıcılık ancak alınınca oluşuyor. ~16 KB'lık sahte ambar 'world' iletisini PeerJS'in 16 300 baytlık eşiğinin üstüne itip dünyayı kalıcı olarak katılınamaz yapıyor (B-M01)." } },
  'B-06': { impact: { e: "[Doğrulama eki] Sink listesi eksik: gemi adı hud.js:302/311'de kaçışsız innerHTML'e giriyor ve 'shipFull' ile konuktan yazılabiliyor, kayıtta kalıcı (B-M02). Hazine haritasının data.island alanı da itemTip'te (panels.js:24) kaçışsız." } },
  'B-08': { impact: { e: "[Doğrulama eki] Sabit pencere (net.js:379) sınır anında ~1 sn içinde 40 000 altına izin veriyor. Aynı kırpma/bütçe dürüst büyük satış paylarını sessizce yok ediyor (B-M04)." } },
  'B-09': {
    impact: {
      sub: [
        ["Bu eksiklik B-01, B-02, B-03 ve B-04'ü tek iletiyle oturum çökmesine dönüştürüyor.",
          "Bu eksiklik B-01, B-03 ve B-04'ü tek iletiyle oturum çökmesine dönüştürüyor [doğrulama düzeltmesi: B-02 bu sınıfta değil; cannonFix/mastFix kilitlenmesi istisna değil, 2^32 uzunluklu seyrek dizinin netState (ship.js:707) ve hud.js:310'da dolaşılmasından gelen CPU kilidi; sails NaN da istisna üretmiyor. Hata yalıtımı B-02'yi önlemez, girdi doğrulaması gerekir]."],
        ["input.endFrame çağrılmadığı için basılan tuşlar her karede 'basıldı' kalıyor",
          "input.endFrame çağrılmadığı için [doğrulama düzeltmesi: B-03 yolunda her karede değil, yalnız anlık görüntü karelerinde, ~15/sn] basılan tuşlar 'basıldı' kalıyor"],
      ],
    },
  },
  'B-11': { impact: { e: "[Doğrulama düzeltmesi] f=0 'anında' patlatmıyor: netApply `m.f || 1.2` ile 1,2 sn fitile dönüyor; anında patlama için negatif ya da çok küçük pozitif f gerekiyor." } },
  'C-01': { impact: { e: "[Doğrulamayla düzeltildi — C/UC2, orta güven] '15/20/30/60 FPS'te birebir aynı' sonucu yalnız testlerdeki tam dt değerleri için geçerli. Gerçek tarayıcıda rAF zaman damgaları kabalaştırıldığı için (Chrome ≈0,1 ms, Firefox 1 ms) Node modelinde 60 Hz'de karelerin 2/3'ünde n = 2; 30 FPS'te n 2↔3, 15 FPS'te 4↔5 arasında gidip geliyor. Zıplama tepesi 60 Hz'de 1,203–1,205 m, 30 ve 15 FPS'te ≈1,19 m; geri tepme 60 Hz'de 1,50–1,53 m (testte 1,597)." } },
  'C-02': {
    title: { r: "Alt adım sayısı kareden kareye gidip geliyor (1e-6 eşiği): 60 Hz'de 1↔2, 30 FPS'te 2↔3, 15 FPS'te 4↔5" },
    impact: { e: "[Doğrulamayla düzeltildi] Salınım yalnız 60 Hz'de değil, 30 ve 15 FPS'te de var. Etkiler fizik farkının ötesine geçiyor: top nişanı (C-03), yapay zekâ olasılık hızları (C-M01), güvertedeki oyuncunun titremesi (C-M03) ve ≈1,67 kat CPU (C-M04). Öncelik 'orta' uygun; düzeltme basit (ör. ceil(dt/STEP − 0,01) ya da biriktirici)." },
  },
  'C-03': { impact: { e: "[Doğrulama düzeltmesi] Öncelik en az 'yüksek': top nişanı deniz savaşının ana girdisi; sıradan 60 Hz ekranda her top kullanımında duyarlılık 1,67 kat ve kareden kareye değişken." } },
  'D-01': {
    impact: { e: "[Doğrulama eki] Konukta gardiyan koşulu hiç işlemiyor (D-03 doğrulamasına göre konukta gardiyan sayımı her zaman 0, enemies.js:1655); sınırsız kazanç savaşmadan elde ediliyor." },
    acceptance: { e: "[Doğrulama eki] Kabul testi bir co-op senaryosu da içermeli: konukta da ödül tek seferlik olmalı ve gardiyan koşulu ev sahibinin durumuna göre işlemeli." },
  },
  'D-02': { impact: { e: "[Doğrulama düzeltmesi] morvanSpawn/kizilSpawn sızıntısı kalıcı değil: oyuncu 200 m uzaklaşınca bu bayraklar sıfırlanıyor (quests.js:282, 290). ilkHazineBulundu herhangi bir sandık satışıyla 1. aşamanın atlanmasına yol açıyor (quests.js:145). ilkHarita ilk harita seçeneğini gizliyor (quests.js:404); yeniden yüklemede storySites ile aşılabiliyor. Kalıcı kilidi yaratan bayrak gunluk. Doğrulayıcı 'yüksek'i kabul etti, ana hikâyeyi kalıcı kilitlediği için 'kritik'i de savunulabilir buldu." } },
  'D-03': { impact: { e: "[Doğrulamayla düzeltildi] (1) Yeniden katılımla yinelenen ödül D-01 ile aynı sınıfta (sınırsız kazanç); öncelik kritik. 02'deki 164 numaralı kaydın 'Düşük' önceliği de hafife alınmış. (2) Ev sahibi adaları yalnız kendi oyuncusunun konumuna göre kuruyor (islands.js:273); konuk uzak bir adadayken onun fıçı, sandık ve bulmaca olayları ev sahibinde byId olmadığı için yok sayılıyor (hazards.js:672-674) ve hiçbir kayda girmiyor. Konukta gardiyan sayımı da her zaman 0 (enemies.js:1655). (3) Tutsak ödülü lootToBag ile değil doğrudan altın olarak veriliyor (islands.js:963); levyeler eşya vermiyor, yalnız +250 XP veriyor (templeOpened, progress.js:86)." } },
  'D-04': {
    impact: {
      sub: [
        ['bütün yuvalar uyarı olmadan eski hâline dönüyor', 'dosyada bulunan yuvalar uyarı olmadan eski hâline dönüyor [doğrulama düzeltmesi: yalnız dosyadaki yuvalar eziliyor]'],
        ["Bozuk ya da elle düzenlenmiş bir dosya yuvayı okunamaz hâle getiriyor ('[object Object]'), yine de",
          "Bozuk ya da elle düzenlenmiş bir dosya yuvaya '[object Object]' yazdırıyor [doğrulama düzeltmesi: .bak varsa read() sessizce bir önceki kayda düşüyor, yuva okunamaz olmuyor ama son ilerleme kayboluyor], yine de"],
      ],
      e: "[Doğrulama eki] dksh.profile ilkel bir değerle (ör. \"5\") içe aktarılırsa oyun bir daha açılmıyor (D-M02).",
    },
  },
  'D-05': {
    impact: {
      sub: [
        ['Yeni bir sandık kademesi ya da gemi tipi içeren kayıt, eski sürümde yüklemeyi çökertiyor (treasure.js:266-268, ship.js:20/59).',
          'Yeni bir sandık kademesi ya da gemi tipi içeren kayıt, eski sürümde yüklemeyi çökertebilir (treasure.js:266-268, ship.js:20/59) [doğrulama düzeltmesi: v0.3 ve v0.4\'te sandık kademeleri (small/medium/large/legend) ve gemi tipleri (sloop/brigantine) aynı; bu çökme bugün yalnız gelecekteki bir sürüm için varsayımsal].'],
      ],
      e: "[Doğrulamayla düzeltildi] Bugünkü somut risk yalnız aynı kökende sürüm geri dönüşü ya da file:// paylaşımı; öncelik orta (02'de A14 'Düşük'). parts/mastHp/cannonHp v0.3 kaydında da vardı (v0.3 ship.js:692'de yazılıyor, yalnız yüklenmiyordu); gemideki tek yeni alan sunk. v0.4'ün asıl yeni kayıt alanları islands, hazards.gone, ship.sunk ve konuk kaydındaki progress/quests.",
    },
  },
  'E-01': { impact: { e: "[Doğrulama eki] innerHTML ataması hud.js:311'de. İkinci kalıcı XSS yolu: quests.js:471'deki Usta Bora diyaloğu gemi adını panels.js:220'deki 'html: d.text' ile basıyor (util.js:130, innerHTML). Meşru akışta da sorun var: konuğun tersanede brigantine satın alması (panels.js:53 → shop.buyShip; ev sahibi denetimi yok) ev sahibinin gemisini değiştiriyor, geliştirmelerini sıfırlıyor ve denizdeki ev sahibini limana ışınlıyor; ev sahibinin G.ownedShips listesi güncellenmiyor. Geçersiz typeId gelirse replaceShip eski gemiyi sildikten sonra Ship kurucusunda çökebilir (ship.js:19) ve paylaşılan gemi o oturumda kaybolur (doğrulayıcı: orta güven)." } },
  'E-02': { impact: { e: "[Doğrulamayla düzeltildi] (1) 'Balık ambara konunca hiç ileti gitmiyor' kısmen yanlış: panels.js:101'deki 'Ambara koy' balıklar dahil netHold yayınlıyor; iletisiz yollar yalnız fishing.js:248 (çanta doluyken otomatik saklama) ve panels.js:150-152 (ambardan balık alma). (2) Her konuk ambar işleminde balıkların silinmesi v0.4 gerilemesi (B-M05); v0.3'te yalnız otomatik saklanan balıklar kayboluyordu. (3) Ters yönde konuk balığı yalnız kendi kopyasından alıyor; balık normal oyunda çoğaltılabiliyor (E-M03). (4) chests dizisine konan keyfî nesneler kalıcı bozulma da yaratıyor: geçersiz tier panels.js:133-134 ve shop.js:136/160'ta TypeError atıyor; ambar paneli açılmıyor, ambar satışı yapılamıyor, boş ambar isteyen gemi satın alma (shop.js:213) engelleniyor; 40 sahte kayıt slotları dolduruyor; ambar kayda yazıldığı için bozulma yüklemeden sonra da sürüyor (tek çıkış gemiyi batırmak, events.js:420). Kötü niyetli yolun önceliği kritik (B-05 kümesi); normal oyundaki balık kaybı için yüksek." } },
  'E-03': { impact: { e: "[Doğrulama eki] (a) boatSt'deki sayı olmayan değer kayığı yalnız NaN ile bozmuyor: _hostSnapshot'ta (net.js:740) toFixed TypeError atıyor, anlık görüntü her karede kesiliyor ve input.endFrame atlanıyor (E-M02). (b) 'sails' değeri ship.js:285'teki damp'a giriyor; NaN ya da dev değer ev sahibi gemisinin fiziğini bozuyor; sailTarget kayda yazılıyor (ship.js:698) ve yüklemede geri geliyor (shipControl.js:33). (c) Son aşamada stage+1 gönderilirse quests.js:130-132'de STORY[to] tanımsız kalıyor, TypeError oluşuyor ve aşama geçersiz değerde kalıyor. (d) 'Keseler ev sahibi kaydına girer' ifadesi doğru değil: keseler kaydedilmiyor (11 #44); kayda giren keseyi toplayan oyuncunun altını. (e) 'gold' iletisi hâlâ karşılıksız (net.js:373-383): konuk satış yapmadan dakikada 20 000 altını diğer oyunculara verebiliyor (B-08)." } },
  'E-04': {
    impact: {
      sub: [
        ["Büyük 'st' iletileri konuk sayısı × 15 Hz oranında yeniden yayılarak ev sahibinin yükleme bant genişliğini tüketir ve oturumu düşürebilir.",
          "[Doğrulamayla düzeltildi] Stok PeerJS 1.5.5 JSON kanalı kodlanmış boyutu 16 300 bayt ve üstü olan iletiyi hiç göndermiyor (chunkedMTU=16300); konuk 50 KB'lık 'st' gönderemez. Gerçek risk daha ağır: ~15,9 KB'lık bir 'st' ev sahibinin sonraki anlık görüntüsünü 16,5 KB'a çıkarıyor, her konuk bağlantısında 'message-too-big' hatası oluşuyor, net.js:233 _dropPeer'i çağırıyor ve bütün oda aynı karede düşüyor; konuklar pong almaya devam ettikleri için (net.js:269) donuk dünyada kalıyor (E-M01). Dizgi olmayan bir 'eq' değeri Character.hold'da (character.js:653) TypeError atıyor; ev sahibinde ve diğer konuklarda net.update (net.js:709) her yeni 'st' iletisinde yarıda kesiliyor."],
        ['NaN düşman yapay zekâsına ve diğer konuklara da yayılır.',
          "NaN diğer konuklara da yayılır. ['NaN düşman yapay zekâsına yayılır' kısmı E doğrulamasında sınanmadı; B-04 denetçisi düşmana NaN geri tepme yazıldığını ve düşman konumunun kalıcı NaN olduğunu ölçtü (enemies.js:390-395, 1187-1190).]"],
      ],
    },
    acceptance: {
      sub: [
        ["50 KB'lık bir 'st' diğer konuklara yansımaz.",
          "Boyut sınırını aşan bir 'st' (ör. 15–16 KB) reddedilir, diğer konuklara yansımaz ve ev sahibinin anlık görüntüsü 16 300 baytın altında kalır [doğrulama düzeltmesi: 50 KB'lık 'st' stok istemciyle üretilemez]."],
      ],
    },
  },
  'F-01': { impact: { e: "[Doğrulama eki] Sızan ilkHarita bayrağı ev sahibinde Nevra'nın ilk harita seçeneğini de gizliyor (quests.js:404); bu kilit kalıcı değil, yeniden yüklemede quests.js:91 storySites=['marti_1'] kurduğu için Martı haritasız da kazılabiliyor. Bu ayrıntı önceliği değiştirmiyor." } },
  'F-02': {
    impact: {
      sub: [
        ["Oyuncu ölüp menüden 'Devam Et' derse ya da oyunu kapatıp açarsa harabede/kampta başlar ve boss doğmaz.",
          "[Doğrulamayla düzeltildi] Ölüm yolu yanlış: ölüm ekranı yalnız 'Gemide uyan' ve 'Kırlangıç Limanı'nda uyan' seçeneklerini sunuyor (menu.js:360-366), oyun yeniden yüklenmiyor ve grubu olmayan boss enemies.list'te canlı kalıyor. Hata yalnız bayrak true iken boss alanının 200 m içinde alınmış bir kayıt yeniden yüklenince çıkar (savaş sırasındaki otomatik kayıttan sonra menüye çıkış ya da sekmenin kapanması, veya adaya yakın gemide uyanıp oyundan çıkma); bu durumda oyuncu harabede/kampta başlar ve boss doğmaz."],
      ],
      e: "[Doğrulama düzeltmesi] Öncelik orta: ilerleme kaybı yok; oyuncu 200 m uzaklaşınca (ör. limana dönünce) bayrak kendiliğinden sıfırlanıyor. Geçici ve ipucusuz bir yumuşak kilit.",
    },
  },
  'G-01': {
    knownAs: { r: "02: G_icerik-ek-statik-159 (Yüksek, doğrulanmamış ek bulgu, v0.4'te açık); ilgili madde: 02 G_icerik-ek-statik-163 (tutsak altını shop.earn dışından veriliyor) [doğrulama düzeltmesi]" },
    impact: { e: "[Doğrulama eki] Tuşu bırakıp yeniden 2,5 sn basılı tutmak da ödülü yineliyor; sömürü sürekli basılı tutmaya bağlı değil." },
  },
  'G-02': { impact: { e: "[Doğrulama düzeltmesi] _chest ile kurulan sabit ada sandığı 57 adet (harabe 22, mezarlık 2, maden 2, yıkık kasaba 1, karaya oturmuş gemi 26, batık şehir 4); 58 sayısı sunak eklenince çıkıyor, metinde sunak ayrıca sayıldığı için çift sayım var. Sunak sandığı G-03 nedeniyle erişilemiyor, bu yüzden 'sunağı yeniden alma' pratikte yapılamıyor. Yeniden katılım gerekmeden de konuk aynı oturumda ev sahibinin açtığı her sandığı bir kez daha açabiliyor (çift ganimet)." } },
  'H-01': {
    title: { r: "Kraken dokunacının vuruş hedefi ucun gerisinde (R=38 m'de 8,8–16,9 m, R=30 m'de 6,1–14,2 m): güverteye inen dokunaç kılıçla çoğu durumda kesilemiyor" },
    impact: { e: "[Doğrulama düzeltmesi] Uç ile hedef arasındaki yatay mesafe R=38'de 8,8–16,9 m (medyan 13 m), R=30'da 6,1–14,2 m; başlıktaki özgün '5–14 m' yalnız evre 3'e uyuyor, çünkü denetçinin betiği uca değil güverte kenarına olan mesafeyi ölçüyor. Kök neden, etki ve 'yüksek' öncelik doğru." },
    repro: { sub: [['tipik değer 5–14 m', "R=38 m'de 8,8–16,9 m (medyan 13 m), R=30 m'de 6,1–14,2 m [doğrulama ölçümü]"]] },
  },
  'H-02': {
    title: { r: "Taş Muhafız ve Volkanik Dev'in hasarı vuruş animasyonundan sonra geliyor (denetimde 0,4–0,7 sn; Faz 7 ölçümüyle 0,33–0,57 sn)" },
    impact: { e: "[Doğrulama düzeltmesi] Öncelik orta: telgraf halkası (bosses.js:597-604) tam hasar anında (T) doluyor, oyuncunun doğru bir zamanlama ipucu var ve savaşlar oynanabilir; aynı sınıftaki H-09 da 'orta'. Konukta sorun daha büyük: GiantBase.clientUpdate (623-631) klipleri 1,0 hızla oynatıyor ve konukta halka hiç çizilmiyor (H-M03, H-15). [Faz 7 tasarım doğrulaması — büyüklük düzeltmesi] İlk ölçüm kolun açısal hız tepesini (0,313 klip sn) vuruş karesi saymıştı; elin en ileri anına göre (inc_giant.mjs) Taş Muhafız yumruğunda (slam) fark +0,43 sn, süpürmede +0,33 sn; dev bosslarda fark 0,33–0,57 sn." },
  },
  'H-09': {
    title: { r: "Düşman hamlelerinde hasar anı animasyonun vuruş karesiyle uyuşmuyor (kesme/doğrama hamleleri 0,13–0,21 sn, DASH 0,33 sn geç; çift bıçak kesiği erken); sersemlik ve insan çağırmasında donuk poz" },
    rootCause: { e: "[Faz 7 tasarım doğrulaması — kısmen doğru] Ölçüm iki bilekten büyüğünün hız tepesini aldığı için bazı hamlelerde sol bilek, tekmede bilek ölçülmüş. Sınıfa göre ölçümde (silah eli, uç ve en ileri erişim; inc_strike.mjs) gerçek gecikmeler: Atk2 +0,21, Atk2H +0,15, Heavy2H +0,14, Punch2 +0,13 sn, DASH +0,33 sn ve ardından 0,33 sn donma, kalkanlı Atk1 +0,07; sınırdakiler baltalı Atk1 +0,06, Kick +0,06, DualChop +0,02…+0,07; DualSlice −0,06…−0,21 (erken). AtkStab, Stab2H ve DualStab'daki ~0,3 sn gecikme ölçüm yapıntısı: en ileri erişim hitAt ile örtüşüyor (+0,01 / −0,02 / 0,00)." },
    impact: { sub: [['Görsel bıçaklamaya göre parry yapan oyuncu', 'Görsel kesme ya da doğrama hamlesine göre parry yapan oyuncu [Faz 7 düzeltmesi: bıçaklamalarda gecikme yok]']] },
  },
  'H-20': { rootCause: { e: "[Faz 7 tasarım doğrulaması — kök neden düzeltmesi] Asıl kilit her döngüde 3. vuruşun (finisher, combat.js:21) verdiği 1,0 sn'lik sersemlik (enemies.js:401-402). Gerçek zincirle (chainAt kapısına uyan girdi, 10 sn'de 18 savuruş) düşman 10–11 saldırı başlatıyor ve 0'ını vuruş anına ulaştırıyor; bitirici sersemliğine azalan getiri eklenince 6 başlatmadan 2'si vuruş anına ulaşıyor (inc_olcum.js MA, 3/3 koşu)." } },
  'I-10': {
    rootCause: { e: "[Faz 7 tasarım doğrulaması — kısmen doğru] Atk2 sapması ve Atk3 doğru; Punch klibin %70'i, Punch2 %67'si oynuyor. Counter'daki −0,14 sn ölçüm yapıntısı: Block_Attack'ta sağ bilek neredeyse kıpırdamıyor, kılıç ucunun tepesi 0,305 oyun sn ve bugünkü değer tolerans içinde (inc_profile.mjs). Tekmede bugünkü 0,34 sn doğru (inc_strike2.mjs)." },
    impact: { sub: [["Karşı saldırıda hasar kılıç hedefe varmadan, Atk2'de ise kılıç geçtikten sonra işleniyor.", "Atk2'de hasar kılıç geçtikten sonra işleniyor [Faz 7 düzeltmesi: karşı saldırıdaki erken hasar ölçüm yapıntısı]."]] },
  },
  'H-03': {
    impact: { e: "[Doğrulama düzeltmesi] (1) Volkanik Dev'deki ×2,2 yalnız çekirdek açıkken geçerli (exposed>0, yaylımdan sonraki 3,2 sn). (2) Lanetli Amiral hurtBoss ile en çok %50'ye indirilebilir: bordalamadan sonra damageMul=0 (932); kalan can Amiral düşmanı üzerinden hurtEnemy ile gidiyor ('bullet' türüyle 80 m'ye kadar). (3) v0.4 hurtBoss için 0–220 kırpmayı ve genel oran sınırını eklemiş; eksik olan mesafe, tür ve konum doğrulaması. (4) 8 m'lik sersemletme denetimi doğrulanmayan 'st' konum iletisiyle atlatılabiliyor (B-04). Kazanç boss başına bir kez olduğu için 'yüksek' doğru." },
    knownAs: { r: "H07 (02_HATA_LISTESI; v0.4'te hurtEnemy kısmı kapatıldı, hurtBoss için 0–220 kırpma ve genel oran sınırı eklendi, 03_DEGISIKLIK_LISTESI.md:62; eksik olan mesafe, tür ve konum doğrulaması) [doğrulama düzeltmesi]" },
  },
  'I-01': {
    impact: { r: "Her harekette ayaklar yerde kayıyor. Ağır kayma yürüme klibinin kullanıldığı hız bandında: çömelme 1,7, nişan/savunma 2,0, sandık 2,6–2,7 ve 2,6–3,7 m/sn arası hızlarda kayma ≈%61. 4,4 m/sn koşuda kayma ≈0,55–0,7 m/sn (%12–16), 7 m/sn sprintte ≈2,1–2,3 m/sn (%30–33). Sorun yalnız görsel, işlev kaybı yok. [Doğrulamayla düzeltildi: denetçi koşu ve sprintte bilek kemiğini ölçtüğü için kaymayı ~1,2 ve ~3 m/sn bulmuştu; koşu kliplerinde temas ayak ucunda. 'Sprint koşudan zor ayırt ediliyor' ifadesi abartılı: Running_C'nin dikey sıçraması ve adım genliği daha büyük (0,71 / 0,63 m), 7 m/sn'deki kadans 4,4 m/sn koşudakinden %25 yüksek.]" },
    fix: { r: "1) Klip doğal hızlarını yüklemede temas noktasından (toesl/toesr) ölç ya da temas noktası ölçümüne göre sabitle: Walk≈0,75, WalkBack≈0,72, Run≈Sprint≈4,5 m/sn; yan adımdaki 3,6 makul. [Doğrulama düzeltmesi: özgün öneri Run≈3,7 ve Sprint≈3,8 idi; uygulanırsa 4,4 m/sn'de ayak ters yönde ≈1 m/sn kayar.] 2) _locomotion'da timeScale = hs/doğalHız olsun; Walk→Run eşiğini histerezisle birlikte yeniden belirle ve kıskaçları yeni referans hızlara göre genişlet. 3) Eşik çevresinde iki klibi ağırlıkla karıştır (02 önerisi). 4) Oynatma hızını uzak oyunculara da gönder (I-15).", e: "[Faz 7 tasarım doğrulaması] Faz 7 tasarımı aynı klipleri destek ayağı yöntemiyle ölçtü: 1,5 cm eşikte Walking_A 0,71, Walking_Backwards 0,77, Running_A 3,75, Running_C 3,79 m/sn (inc_gait_med.mjs). Koşu referansı I karşı doğrulamasının temas noktası ölçümüyle (4,4–4,6 m/sn) çelişiyor; K7-9 klip hızını 1,5 cm eşikle ölçülen doğal hıza bağlamayı karara bağladı. Yukarıdaki sabit değerler Faz 7 ölçümüyle kesinleşmeden uygulanmamalı." },
    repro: { r: "Tarayıcıda oyuncu karadayken DK.input.down.add('KeyW') ile 2 sn boyunca DK.sim(1/60) adımları at. Her adımda destek ayağının temas noktasının (p.char.bones.toesl/toesr ya da kemiğin kendi döngü minimumu) dünya yatay hızını ölç: koşuda ≈0,6 m/sn çıkar, olması gereken ≈0. Ağır kaymayı görmek için çömelerek (1,7 m/sn) ya da nişan alarak (2,0 m/sn) yürü. [Doğrulama düzeltmesi: özgün adım footl/footr'nin yere 2 cm yaklaştığı kareleri kullanıyordu; koşuda bilek kemikleri hiçbir karede yere 2 cm yaklaşmıyor.] Node: /tmp/denetim_alan/fk4.mjs (kk_anims.glb + kk.js kopyası) doğal hızları verir." },
    acceptance: { r: "Yeni test (ör. 18_animasyon_senkron.js): 1,5 / 2,7 / 4,4 / 7,0 m/sn sabit hızda ve nişan/savunmada geri yürürken destek ayağı temas noktasının dünya yatay hızının medyanı < 0,25 m/sn (ya da gövde hızının %10'u). 16 K05, K06 ve 04 C10 geçmeye devam etmeli; 04 C13 (3 m/sn'de Walk beklentisi) yeni eşiğe göre güncellenmeli [doğrulama eki]." },
  },
  'I-02': {
    impact: { e: "[Doğrulama eki] Etki duvarla sınırlı değil: gemi gövdesi ve kıçtaki kayık için de geçerli (I/UC5). Mermi kısmı C-06 ile örtüşüyor." },
    knownAs: { e: "C-06 (audit C: omuz kamerasıyla namlunun görmediği köşe arkası) [doğrulama eki]" },
  },
  'J-01': {
    impact: { r: "KayKit gövdesi 6 iskeletli örgü olduğundan her karakter kameranın arkasında, 1 km uzakta ya da 110 m gölge kutusunun dışında olsa da en az 6 ana + 6 gölge çağrısı harcıyor; insan karakteri her geçişte ~4 K üçgen. Limandaki 12 karakterin koşulsuz yükü ≈144 çağrı ve ≈100 K üçgen; bu, 10. belge §10.5'te 10 karakter için ölçülen ≈95 K ile uyumlu. Liman NPC'leri açık denizde de çiziliyor; kurulu ada kasabalarının 5 NPC'si 1 150 m'ye kadar aynı yükü taşıyor; deniz savaşında tayfa ekleniyor. Gerçek FPS ölçülmedi; §10.9.2'ye göre çağrı başına ~10,7 µs, yani ~1,5 ms CPU, artı 12 iskelet güncellemesi. Gölge kutusundaki NPC'ler ayıklama açılsa da gölge geçişinde çizilmeye devam edeceği için limandaki kazanç 144 çağrıdan küçük kalır; asıl kazanç açık denizde ve diğer adalarda (~132 çağrı). [Doğrulamayla düzeltildi: denetçi ~6 K üçgen/karakter ve ≈144 K üçgen demişti; 'açık deniz 203 çağrısıyla tutarlı' ifadesi doğrulanamadı, çünkü §10.9.1'in ölçüm betiği depoda yok.]" },
    fix: { e: "[Doğrulama eki] Önerilen sınır küresi payının ragdoll sırasında yetmeyebileceği not edilmeli." },
    acceptance: { r: "Ana geçişte: kamera NPC'lere sırtını dönmüşken ve liman 1 km uzaktayken karakter kaynaklı çağrı farkı 0. Gölge geçişinde odak çevresindeki ±55 m gölge kutusunda kalan NPC'ler (sky.js:139-141, 339-340) haklı olarak çizilmeye devam eder; 'gizleme farkı 0' ölçütü onlara uygulanmaz [doğrulama düzeltmesi]. Kamera taramasında (kamera_tarama b4 kasaba NPC konumları) karakter kaybolması/titremesi yok." },
  },
  'J-02': {
    impact: { e: "[Doğrulama düzeltmesi] Kök neden ve üçgen sayıları doğru; çizim çağrısına etkisi küçük (~15 ana + ~10 gölge); yük köşe işlemede ve gölge haritasında. Gerçek GPU ölçümü yapılmadan ve kare bütçesinin aşıldığı gösterilmeden öncelik orta." },
    repro: { sub: [['yarıçaplar ~1 000 m', "yarıçaplar ~610–780 m [doğrulama ölçümü; özgün metinde ~1 000 m]"]] },
  },
  'J-03': {
    impact: { e: "[Doğrulama düzeltmesi] Etki büyüklüğü ölçülmedi. İlk karede yalnız görünen içeriğin programları derleniyor, kalanlar ilk görüldüklerinde derleniyor (J-17 ile aynı mekanizma); takılma oturum başına bir kez oluyor ve tarayıcının gölgelendirici disk önbelleği sonraki açılışları hafifletiyor. Öncelik orta (J-17 ile tutarlı)." },
    repro: { r: "Efekt ayarı 'low' ve 'high' iken iki ayrı açılış yap; yükleme bitip menü ilk kez çizildikten sonra DK.engine.renderer.info.programs.length değerlerini karşılaştır (10. belge §10.9.1'e göre yüksek/orta 89, düşük 40) ve Chrome Performance kaydında ilk karedeki compileShader/linkProgram sürelerine bak. [Doğrulama düzeltmesi: özgün adımdaki 'ilk kare çizilmeden ölç' koşulu güvenilir değil, çünkü window.DK motor başladıktan sonra tanımlanıyor.]" },
  },
  'J-16': {
    title: { r: "09_performans'ta Volkanik Dev oluştur/kaldır döngüsü geometri +5 ile kalıyor: sızıntı değil ölçüm kusuru (Faz 8 doğrulaması)" },
    rootCause: { e: "[Faz 8 tasarım doğrulaması — kök neden bulundu] Sızıntı değil ölçüm kusuru: 09'un döngüsü boss'u kendi noktasında (Ateş Dağı) doğuruyor, oyuncu yaklaşık 9,9 km uzakta; bosses._check() (bosses.js:1094-1099, 0,5 sn'de bir) uzak boss'u çoğunlukla ölçüm karesinden önce kaldırıyor. 31 alt adımlık denetim evresi tutarsa demon.glb'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez yükleniyor ve dG=5 görünüyor; düzeltilmiş döngüde dG=0 (Faz 8 §5.4; kod ve Node ile bağımsız doğrulandı, dG=5 olasılığı ≈ %6,5). 09'un Kraken ölçümü de boss'suz yapılıyor. Karar: K8-7." },
  },
  'K-01': { impact: { e: "[Doğrulamayla düzeltildi] Bugün oyuncuya etkisi yok: canlı dal da kök dosya da v0.3 ve ikisi tutarlı. Risk, v0.4 birleştirilirken kök dosya yeniden üretilmezse doğuyor (§16.7'de yazılı adım). 'file:// data: işçisi' eksikliği işlevsel açık sayılmamalı: v0.3 tek dosyası işçiyi klasik işçi olarak kuruyor (762f1c7:tools/build-single-html.mjs:16,27); blob reddi 903abe2'de tek dosyada modül işçisine geçilince görüldü (v0.4 terrain.js:69). 01_ILK_DENETIM_RAPORU.md:43 v0.3 dist'inin file:// altında 3 işçiyle açıldığını kaydediyor. Bu doğrulamada tarayıcı koşulmadı." } },
  'K-05': { impact: { r: "Aynı commit için iki yayıncı var (dal tabanlı Jekyll yayını ve iş akışı yayını); hangisinin kazanacağı bitiş sırasına bağlı, yani sonuç belirlenimsiz. İş akışındaki dal filtresi, derleme adımı ve eklenecek test kapıları dal yayınını durdurmuyor. [Doğrulamayla düzeltildi] Bugün oyuncuya yansıyan bir fark yok: 762f1c7 için iş akışının yeniden ürettiği tek HTML commit'li dosyayla bayt bayt aynı (f0ac8cb0…) ve canlı commit'te tests/ klasörü yok. 'docs/ ve tests/ dahil' tespiti dal yayınına özgü değil: upload-pages-artifact@v3 'path: .' ile yalnız .git ve .github'ı dışarıda bırakıyor (K-06). 'Ham' ifadesi de tam doğru değil: Pages'in Jekyll'i Markdown'u HTML'e çeviriyor, ön bilgisi olmayan oyun dosyalarını olduğu gibi kopyalıyor; depoda '_' ile başlayan dosya ve .md'lerde Liquid etiketi yok, derleme güvenli. Etki ileriye dönük: v0.4 birleştirilince bayat kök dosya sunulabilir (K-01) ve eklenecek CI kapıları dal yayınıyla atlanır. Öncelik yayın güvenliği açısından yüksek." } },
  'K-17': { impact: { e: "[Doğrulamayla düzeltildi — F/UC1, K/DOC1] 'README güncellenmemiş' ifadesi doğru değil: v0.4 README'sinde kontroller (C ve N tuşları) güncellenmiş, 'Dalış, balıkçılık ve deniz ekipmanı' ile 'Avcılık ve toplama' bölümleri eklenmiş (README.md:33-79). Bayat olanlar sürüm satırı (README.md:8 'Bu sürüm: 0.3') ve 'Henüz olmayanlar' paragrafı (README.md:130); asıl sorun v0.4'ü ayırt eden bir sürüm ya da derleme damgasının olmaması (menu.js:109,112 ve README birlikte güncellenmeli)." } },
};

// Doğrudan hükmü olmayan maddelerin dolaylı / iki kaynaklı doğrulaması: [tur, durum, not]
const D = 'dogrulandi', KD = 'kismen_duzeltildi';
const DOLAYLI = {
  'A-01': ['iki_kaynak', D, "K alanının denetçisi aynı sorunu bağımsız olarak buldu (K-01: v0.4 dalındaki kök tek HTML bayt bayt v0.3 derlemesi; karşı doğrulama K-01'i öncelik düzeltmesiyle kabul etti). A/DOC1 karşı doğrulaması da kök dosyanın md5'inin v0.3 dosyasıyla aynı olduğunu (42d9e9bb…) ve güncel derlemenin yalnız git dışındaki dist/'te durduğunu doğruladı."],
  'A-06': ['dolayli', D, "A/SYS7 karşı doğrulaması (karsit_A/butce_izgara.mjs) dilim süresini üreteç parçasının belirlediğini yeniden ölçtü: bütçe 10 ms iken en uzun dilim 15–17 ms. Doğrulayıcı, ızgara süresine etkinin ölçülemeyecek kadar küçük olduğunu not etti (1024² ızgara 10 ms bütçede 290–321 ms, 40 ms'de 278–317 ms)."],
  'A-17': ['dolayli', D, "Ana kusur (Faz 1 zorunlu testlerinin bir kısmı depoda yok) A/SYS1 ve A/REQ4 karşı doğrulamalarıyla doğrulandı: hazır sinyali yok, iş zaman aşımı, MAX_TRIES ve kurucu hatası kiplerinin depo testi yok. 'badurl kipi file:// altında etkisiz' ve 'tests/out raporları eski' alt iddiaları ayrıca sınanmadı."],
  'B-15': ['dolayli', D, "B/SYS3 karşı doğrulaması aynı pid'den tekrarlanan 'hello'nun roster'ı şişirdiğini (sim.mjs 1: HOST,g1,g1,g1), B/SYS2 doğrulaması 'app' adının cleanName'den geçmediğini doğruladı. 'ping' yansıtması ve sınırsız şifre denemesi alt iddiaları ayrıca sınanmadı."],
  'B-16': ['iki_kaynak', D, "E alanının karşı doğrulayıcısı bağımsız olarak aynı sonuca vardı (E/SYS3): VER iki sürümde de 'dksh-v1' (v0.3 net.js:26, v0.4 net.js:27), canlıdaki v0.3 istemcisi bir v0.4 odasına katılabiliyor. 'Yeni iletiler sessizce yutuluyor' sonucu ayrıca sınanmadı."],
  'B-21': ['dolayli', D, "F/SYS2 karşı doğrulaması 'inter' türünün net.js:46'daki KNOWN listesinde olup _hostData'da işleyicisinin olmadığını, E/SYS2 doğrulaması sohbete özgü oran sınırı olmadığını (yalnız genel 120/sn) doğruladı. 'prog', 'noise', 'downed' ve 'marker' ayrıca sınanmadı."],
  'C-01': ['dolayli', KD, "C/UC2 karşı doğrulaması kök nedeni kabul etti ama '15/20/30/60 FPS'te birebir aynı' sonucunu yalnız tam dt değerleri için geçerli buldu; düzeltme Oyuncuya etkisi alanına uygulandı (doğrulayıcı: zaman damgası modeline dayanıyor, orta güven)."],
  'C-06': ['dolayli', D, "C/UC3 karşı doğrulaması slabBlocked ve hullSolid'in yalnız camera.js'te geçtiğini ve tabanca ışınının kökeninin kamera olduğunu (combat.js:244), C/SYS4 doğrulaması 'mermi ve yapay zekâ için güverte engeli olmadığı tespiti (C-06) doğru' sonucunu verdi."],
  'C-08': ['iki_kaynak', D, "C alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (C-M03: güverte, dümen ve top kipindeki oyuncu gemi güncellemesinden önce konumlanıyor)."],
  'C-10': ['dolayli', D, "C/REQ5 karşı doğrulaması gemi ve kayığın iskeleye çarpmasının sınanmadığını ve Ship.obstacles'ın iskeleyi içermediğini doğruladı (ship.js:442-459; bilinen #39 açık). Direk ve bina kısmı ayrıca sınanmadı."],
  'C-11': ['iki_kaynak', D, "H alanının denetçisi bağımsız olarak aynı belirtiyi kaydetti (H-23 etkisi: 'Bordalamada düşmanlar oyuncunun ve direklerin içinden geçiyor')."],
  'C-13': ['iki_kaynak', D, "I alanının denetçisi bağımsız olarak aynı kusuru buldu (I-13: kamera nokta olarak çarpışıyor, duvara dayalı oyuncuda ve ada yapılarında kamera duvarın içine girebiliyor); C/SYS2 karşı doğrulaması ada yapı kutularının görselden küçük olduğunu (colK 0,6–0,9; islands.js:495-500, bilinen #43) doğruladı."],
  'C-14': ['iki_kaynak', D, "C alanının karşı doğrulayıcısı (C-M04) ve J alanının denetçisi (J-26) aynı kusuru bağımsız olarak buldu: alt adım döngüsü görsel ve animasyon işlerini her alt adımda yapıyor."],
  'C-16': ['dolayli', D, "C/REQ1 karşı doğrulaması uzak ve hedefsiz düşmanların enemies.js:1599-1606'da 0,25 sn + h'lik tek adımla ilerlediğini, bunun küresel 0,1 sn sınırından da büyük olduğunu doğruladı."],
  'C-17': ['dolayli', D, "C/SYS3 ve C/REQ2 karşı doğrulamaları düşüşte süpürme olmadığını ve pencerenin v·h ≤ 0,6 m, yani h = 1/60'ta en çok 36 m/s olduğunu doğruladı; hızlı düşüşü sınayan test yok."],
  'C-18': ['iki_kaynak', D, "C/DOC1 karşı doğrulaması 04 §4.5'teki 'Doğrulama'nın kanıt değeri taşımadığını ve testin 64 hücre farkını göstermediğini doğruladı; K alanının denetçisi (K-13) expect'siz betiklerin her durumda geçtiğini bağımsız olarak kaydetti."],
  'D-06': ['dolayli', D, "D/REQ11 karşı doğrulaması bozuk sis dizesinin atob çağrısında istisna attığını (D-06) doğruladı; K/REQ18 doğrulaması anlamsal bozulmanın valid()'i geçtiğini kaydetti."],
  'D-07': ['dolayli', D, "D-01 karşı doğrulaması: 'Etkide anılan D-07 de doğru: enemies.js:1319 groupState'i spawned dahil aynen yüklüyor, 1549'daki !st.spawned koşulu yüzünden kampa yakın yüklemede gardiyan doğmuyor.'"],
  'D-08': ['iki_kaynak', D, "G alanının denetçisi aynı kusuru bağımsız olarak buldu (G-05: Martı Batığı sandığı kayda yazılmıyor)."],
  'D-09': ['iki_kaynak', D, "E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-15: konuk ilerlemesi için periyodik kayıt yok, eski yuva kaydı daha yeni rütbeyi eziyor)."],
  'D-11': ['iki_kaynak', D, "E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-23: çoklu sekme kilidi yok)."],
  'D-13': ['dolayli', D, "D/UC4 karşı doğrulaması kaya tuzaklarının her kurulumda 'set' durumuyla yeniden oluştuğunu ve save()'in kayayı içermediğini doğruladı (v0.3:81, v0.4:86)."],
  'D-14': ['dolayli', D, "D/SYS6 karşı doğrulaması çanta doluyken taşan ödül kesesinin kaydedilmediğini (treasure.js:99, D-14), B-05 doğrulaması lootReq keselerinin kayda yazılmadığını doğruladı."],
  'D-17': ['dolayli', D, "F-02 karşı doğrulaması aynı kök nedeni (morvanSpawn/kizilSpawn bayrağının kayda yazılması) ve önerilen çözümü doğru buldu; tetiklenme yolu düzeltmesi F-02'de."],
  'E-05': ['dolayli', D, "D-03 ve G-02 karşı doğrulamaları yeniden katılımda opened/looted/freed ve tehlike/bulmaca durumunun konuğa boş geldiğini doğruladı. Yüzen nesne ve kilit kısmı ayrıca sınanmadı."],
  'E-06': ['dolayli', D, "D-03 ve G-02 karşı doğrulamaları ada sandıkları, tutsaklar, sunak ve bulmaca durumunun konukta ayrı tutulduğunu ve ödüllerin yeniden alınabildiğini doğruladı."],
  'E-15': ['iki_kaynak', D, "D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-09)."],
  'E-16': ['dolayli', D, "B/SYS3, E/DOC2 ve E/UC9 karşı doğrulamaları otomatik yeniden bağlanmanın olmadığını ve aynı adla eşleşme dalının ölü kod olduğunu (net.js:255, 394) doğruladı. Renk çakışması ve düşürme nedeninin bildirilmemesi ayrıca sınanmadı."],
  'E-17': ['dolayli', D, "E/UC4 ve E/UC5 karşı doğrulamaları olayların ev sahibine göre konumlandığını, konukta rareFind ve özel bildirimin olmadığını doğruladı (events.js:217-219, worldEvents.js:78-91)."],
  'E-18': ['iki_kaynak', D, "H alanının denetçisi aynı kusuru bağımsız olarak buldu (H-17); E/UC5 doğrulaması konukta güllelerin yalnız görsel olduğunu doğruladı (effects.js:117, 187)."],
  'E-19': ['iki_kaynak', D, "B alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (B-M04)."],
  'E-23': ['iki_kaynak', D, "D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-11)."],
  'F-04': ['iki_kaynak', D, "F alanının karşı doğrulayıcısı (F-M02) ve H alanının denetçisi (H-18) aynı kusuru bağımsız olarak buldu."],
  'F-05': ['iki_kaynak', D, "F alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (F-M03)."],
  'F-06': ['iki_kaynak', D, "B alanının denetçisi aynı kusuru bağımsız olarak buldu (B-12, doğrudan doğrulandı); E-03 doğrulaması son aşamada stage+1'in TypeError ürettiğini doğruladı (quests.js:130-132)."],
  'F-08': ['iki_kaynak', D, "H alanının denetçisi aynı kusuru bağımsız olarak buldu (H-21); H/DOC1 karşı doğrulaması boss kartlarındaki XP değerlerinin oyunda verilmediğini doğruladı."],
  'G-05': ['iki_kaynak', D, "D alanının denetçisi aynı kusuru bağımsız olarak buldu (D-08)."],
  'G-06': ['dolayli', D, "G/DOC1 ve G/SYS1 karşı doğrulamaları Node sayımını yineledi: harabe 22, karaya oturmuş gemi 26, kamp 11; 44 yordamsal adacık."],
  'G-08': ['dolayli', D, "G/SYS9 karşı doğrulaması _pier'de (islands.js:601-673) sudan çıkış merdiveni olmadığını doğruladı."],
  'G-13': ['iki_kaynak', D, "C alanının denetçisi (C-13) ve I alanının denetçisi (I-13) aynı kusuru bağımsız olarak buldu; C/SYS2 karşı doğrulaması colK 0,6–0,9 değerini doğruladı."],
  'G-14': ['dolayli', D, "G/SYS6 karşı doğrulaması 7 000 örnek sınırının bitki yoğunluğunu kırptığını doğruladı (Buzdişi'nde istenen yoğunluğun %74,5'i kalıyor)."],
  'G-15': ['dolayli', D, "G/UC3 ve G/UC6 karşı doğrulamaları açıklamaların oyunda karşılıksız olduğunu doğruladı (ör. Gizli Pazar 'yalnızca geceleri kurulan' ama saat koşulu olmadan kuruluyor; madende ocak içi ya da geçit yok)."],
  'H-10': ['dolayli', D, "H/DOC2 karşı doğrulaması belgelenen Kaptan hamlesinin (9 m atılma) oyunda gerçekleşmediğini doğruladı."],
  'H-13': ['dolayli', D, "H/REQ4 karşı doğrulaması co-op'ta konuk için görüş mesafesi değiştiricilerinin uygulanmadığını (H-13) doğruladı."],
  'H-14': ['dolayli', D, "B/DOC2 karşı doğrulaması F-04'ün ele alınmadığını doğruladı: ev sahibi hâlâ applyDamage çağırıyor (net.js:285), blok/kaçınma konukta (enemies.js:343-357)."],
  'H-15': ['dolayli', D, "H-02 karşı doğrulaması konukta telgraf halkasının hiç çizilmediğini doğruladı. İniş işaretleri, ateş halkası, lav havuzları, duman ve bildirimler ayrıca sınanmadı."],
  'H-17': ['iki_kaynak', D, "E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-18); E/UC5 doğrulaması konukta güllelerin yalnız görsel olduğunu doğruladı."],
  'H-18': ['iki_kaynak', D, "F alanının denetçisi (F-02, F-04) ve karşı doğrulayıcısı (F-M02) aynı kusuru bağımsız olarak buldu; F-02 doğrulaması doğuş bayrağının kayda yazıldığını doğruladı."],
  'H-19': ['dolayli', D, "H/SYS4 karşı doğrulaması gece dalgasının bekleme kuralını çiğnediğini doğruladı."],
  'H-21': ['iki_kaynak', D, "F alanının denetçisi aynı kusuru bağımsız olarak buldu (F-08); H/DOC1 karşı doğrulaması boss XP değerlerinin verilmediğini doğruladı."],
  'H-24': ['dolayli', D, "F/SYS1 karşı doğrulaması boss dövüşünün yalnız evre eşiklerinin sınandığını, G/UC1 doğrulaması özel bölgelerin oynanış amacını uçtan uca sınayan test olmadığını doğruladı."],
  'I-03': ['dolayli', D, "I/DOC1 ve I/DOC2 karşı doğrulamaları dümen ve top IK hedeflerinin belgelerdeki 'Düzeltildi' iddiasının aksine kol boyunun dışında kaldığını doğruladı."],
  'I-13': ['iki_kaynak', D, "C alanının denetçisi aynı kusuru bağımsız olarak buldu (C-13: kamera çarpışması yarıçapsız doğru testi)."],
  'J-09': ['iki_kaynak', D, "A alanının karşı doğrulayıcısı aynı sıra sorununun gölge haritasında da olduğunu bağımsız olarak kaydetti (A-M02, kod okumasıyla)."],
  'J-10': ['iki_kaynak', D, "A alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (A-M02)."],
  'J-26': ['iki_kaynak', D, "C alanının denetçisi (C-14) ve karşı doğrulayıcısı (C-M04) aynı kusuru bağımsız olarak buldu."],
  'K-03': ['dolayli', D, "K/UC1 karşı doğrulaması pages.yml'de workflow_dispatch'in dal kısıtı taşımadığını ve deploy işinin ref denetlemediğini doğruladı (satır 9, 33-35)."],
  'K-06': ['dolayli', D, "K-05 karşı doğrulaması upload-pages-artifact@v3'ün 'path: .' ile yalnız .git ve .github'ı dışarıda bıraktığını doğruladı."],
  'K-07': ['dolayli', D, "K/UC2 karşı doğrulaması v0.3 main.js:133-152 ve v0.4 main.js:134-153'te window.DK, snap, snapFrom, sim, tap, press ve __ready'nin koşulsuz atandığını doğruladı."],
  'K-08': ['dolayli', D, "K/UC2 karşı doğrulaması üretim derlemesinde 'peerhost' parametresinin bulunduğunu (v0.3 net.js:39-40, v0.4 net.js:53) ve __DK_TERRAIN_MODE'un v0.4'te olduğunu doğruladı."],
  'K-11': ['iki_kaynak', D, "K alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (K-M05: döngü istisnaları console.error'a çevriliyor, koşucular saymıyor)."],
  'K-13': ['iki_kaynak', D, "C alanının denetçisi (C-18), H alanının karşı doğrulayıcısı (H-M02), B alanının karşı doğrulayıcısı (B-M07) ve E/SYS2 doğrulaması mekanizmayı sınamayan kontroller bulunduğunu bağımsız olarak kaydetti."],
  'K-14': ['dolayli', D, "A alanında tests/README.md:33-35 iddiasının karşı doğrulaması (A/DOC1) bu yolun depo kökündeki bayat v0.3 dosyasını sınadığını doğruladı."],
  'K-17': ['dolayli', KD, "F/UC1 ve K/DOC1 karşı doğrulamaları kusuru kabul etti ama 'README güncellenmemiş' ifadesini düzeltti; düzeltme Oyuncuya etkisi alanına uygulandı."],
  // kaçırılan maddeler
  'A-M02': ['iki_kaynak', D, "J alanının denetçisi aynı kusuru bağımsız olarak buldu (J-10; ayrıca J-09 gölge kalitesi)."],
  'B-M01': ['iki_kaynak', D, "E alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (E-M01; /tmp/denetim_alan/karsit_E/peerjs_sinir.mjs)."],
  'B-M02': ['iki_kaynak', D, "E alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (E-01 doğrulaması: hud.js:311 ve Usta Bora diyaloğu panels.js:220)."],
  'B-M04': ['iki_kaynak', D, "E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-19)."],
  'B-M05': ['iki_kaynak', D, "E alanının karşı doğrulayıcısı aynı v0.4 gerilemesini bağımsız olarak kaydetti (E-02 doğrulaması, madde 2)."],
  'C-M02': ['iki_kaynak', D, "C alanının denetçisi aynı kök nedeni kaydetti (C-06: 'tabanca ışını kameradan çıkıyor')."],
  'C-M03': ['iki_kaynak', D, "C alanının denetçisi aynı kusuru bağımsız olarak buldu (C-08)."],
  'C-M04': ['iki_kaynak', D, "C alanının denetçisi (C-14) ve J alanının denetçisi (J-26) aynı kusuru bağımsız olarak buldu."],
  'E-M01': ['iki_kaynak', D, "B alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (B-M01)."],
  'E-M02': ['iki_kaynak', D, "B alanının denetçisi aynı kusuru bağımsız olarak buldu (B-09, doğrudan doğrulandı)."],
  'F-M02': ['iki_kaynak', D, "F alanının denetçisi (F-04) ve H alanının denetçisi (H-18) aynı kusuru bağımsız olarak buldu."],
  'F-M03': ['iki_kaynak', D, "F alanının denetçisi aynı kusuru bağımsız olarak buldu (F-05)."],
  'G-M02': ['iki_kaynak', D, "D alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak kaydetti (D-03 doğrulaması, madde 2: islands.js:273, hazards.js:672-674)."],
  'H-M04': ['iki_kaynak', D, "Faz 7 tasarım belgesinin incelemesi aynı kusuru bağımsız olarak kaydetti (§0.5 N-11): SeaSerpent'te _hitPlayer yok (bosses.js:391-556), enemies._impact hasarı yalnız s.owner?._hitPlayer varsa uyguluyor (enemies.js:1442); tarayıcı ölçümünde isabette can 100 → 100."],
  'J-M02': ['iki_kaynak', D, "B alanının karşı doğrulayıcısı aynı sızıntıyı bağımsız olarak kaydetti (B-02 doğrulaması: mastFix her iletide rebuild; _build eski kökü yalnız sahneden çıkarıyor, disposeTree yok)."],
  'K-M03': ['iki_kaynak', D, "A alanının denetçisi aynı çelişkiyi bağımsız olarak kaydetti (A belge iddiaları: 04 §4.2c 'kısmen', 02_HATA_LISTESI B-01 'doğru' satırları)."],
  'K-M04': ['iki_kaynak', D, "D alanının denetçisi aynı eksikliği bağımsız olarak kaydetti (tests/fixtures yalnız archipelago_v03.json içeriyor; v0.3 kayıt örneğiyle yükleme senaryosu yok)."],
  'K-M05': ['iki_kaynak', D, "K alanının denetçisi aynı kusuru bağımsız olarak buldu (K-11). Taban koşusunun sahibi olan ana oturum da 8d8fb8a'da başlangıç kaydına aynı notu düştü (run.cjs console.error'ı rapora yazıyor ama çıkış kodunda saymıyor)."],
  'K-M02': ['dolayli', D, "A/REQ8 karşı doğrulaması '12/12 × 4' kaydının Aşama 9'a ait olduğunu ve 44d548c'de yinelenmediğini doğruladı. Taban koşusunun sahibi olan ana oturum 8d8fb8a'da başlangıç kaydını düzeltti: taban betiği `?terrain=` parametresi vermedi, senaryo etkin kipi doğrulamıyor ve işçisiz kipler tabanda denenmedi. Kayıttaki yanlış ifade böylece giderildi ve f80f205'te noworker, badurl ve crash kipleri v0.4 üzerinde ayrıca koşuldu (üçü de 12/12); senaryonun etkin kipi doğrulamaması açık."],
};

// Faz 7 tasarım belgesi §0.5'teki yeniden sınama (H ve I alanları): [tip, not]
// tip: dogru | dogru_kod (yalnız kod okuması) | dogru_duzeltme (doğru, büyüklük/kök neden düzeltmesiyle) | kismen
const FAZ7_BELGE = 'Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md)';
const FAZ7_DOG = {
  'H-01': ['dogru', "kraken_hitbox.cjs: sloop R=38 m'de 1296 durumun 100'ünde (%7,7) erişilebilir, hedef ortalama 8,33 m dışarıda; brigantine R=30'da %31."],
  'H-02': ['dogru_duzeltme', "Büyüklük düzeltmesi: elin en ileri anına göre slam +0,43 sn, süpürme +0,33 sn (inc_giant.mjs); düzeltme başlığa ve Oyuncuya etkisi alanına uygulandı."],
  'H-04': ['dogru', "Kod: bosses.js:318 (2,8 × büyüme), :328 (< 3,4, 3B); :499 (4,5), :506 (< 6,5, 3B)."],
  'H-05': ['dogru', 'enemies.js:1004-1007, bosses.js:45, player.js:144-147.'],
  'H-06': ['dogru', "animals.js:503-508 (melee/attacker yok, ısırık aynı karede)."],
  'H-07': ['dogru', "enemies.js:1483-1486 güdüm sürüyor; :1506 kaçınmada mermi yok olmuyor."],
  'H-08': ['dogru', "enemies.js:979-998, bosses.js:606-619, enemies.js:1431-1455 ve combat.js:188-232'de görüş hattı yok."],
  'H-09': ['kismen', "Kesme/doğrama gecikmeleri doğru, dürtmelerdeki gecikme ölçüm yapıntısı (inc_strike.mjs); düzeltme başlığa, Kök neden ve Oyuncuya etkisi alanlarına uygulandı."],
  'H-10': ['dogru', "Tarayıcı ölçümü M6: 30 sn'de 13 yakın saldırı başlangıcı, 0 DASH, en küçük başlama uzaklığı 2,39 m."],
  'H-11': ['dogru', "Tarayıcı ölçümü M4: 8 sn'de 1 atış; ~1,3. sn'de 'cover', ~4,0. sn'de 'investigate'."],
  'H-12': ['dogru', 'Tarayıcı ölçümü M3b: görüş 2 sn kesikken 120/120 adımda yeni (canlı) konuma, 0 adımda son görülen noktaya yöneldi.'],
  'H-13': ['dogru', 'net.js:87-124 crouch/torch/inCave/underwater/action alanlarını kopyalamıyor.'],
  'H-19': ['dogru', "Tarayıcı ölçümü M7: sahil_gece grubunda 3 gecede canlı üye sayısı 2, 2, 4, 4, 6, 6."],
  'H-20': ['dogru_duzeltme', 'Ölçüm düzeni ve kök neden düzeltildi: asıl kilit bitirici sersemliği (inc_olcum.js MA); düzeltme Kök neden alanına uygulandı.'],
  'H-22': ['dogru', "bosses.js physics'i içe aktarmıyor; yarıçap height·0,18 (:580); hayalet gemi hedefi gs.y+3 (:1008) + height·0,5 (combat.js:58)."],
  'H-23': ['dogru', "Doğru ve ek bulgu. Tarayıcı ölçümü M2: U biçimli (12 m) ve 20 m düz duvarın arkasındaki hedefe 30 sn'de ulaşılamadı; M1b: yoğun çarpıştırıcılı hücrede 6 devriyeciden hiçbiri 60 sn'de ilk noktaya varamadı. Bordalamada oyuncunun içinden geçme belirtisi C-11 ile de örtüşüyor."],
  'H-25': ['dogru', 'serpent_dive.cjs: 432 örnekte ortalama 21 m, en çok 27,1 m sıçrama.'],
  'H-27': ['dogru', 'enemies.js:1366 (!o.T.ghost), crowd.js:21.'],
  'H-30': ['dogru', 'Doğru ve ek bulgu: yan adımda klip seçimi yok (enemies.js:1148-1160); düşman yürüyüş klipleri de doğal hızla eşlenmemiş.'],
  'I-01': ['dogru_duzeltme', "Değerler düzeltmesi: destek ayağı yöntemiyle doğal hızlar farklı ölçüldü (1,5 cm eşikte Running_A 3,75, Running_C 3,79 m/sn); not Önerilen çözüm alanına eklendi (K7-9)."],
  'I-02': ['dogru', 'camtest/run.mjs (gerçek camera.js + physics.js): nişanda duvar 0,4 m sağdayken kamera kutunun içinde; içeriden çıkan ışında lineBlocked = false.'],
  'I-03': ['dogru', 'char3.mjs: dümende 0,39–0,53 m, topta 0,34–0,37 m (4 gövde × 3 boy).'],
  'I-05': ['dogru', 'char4.mjs: Jump_Start ayak kalkışı 0,29 klip sn = 0,19 oyun sn.'],
  'I-06': ['dogru', "char4.mjs: Dodge_F 0,27, Dodge_B 0,67, Dodge_L/R 0,56 m; AtkHeavy 0,50 m ileri gidip dönüyor; Death 0,37 m."],
  'I-08': ['dogru', 'char2.mjs: gövde–bacak açısı yüzmede 129°, dalışta 122°.'],
  'I-10': ['kismen', 'Atk2/Atk3 sapmaları ve klip kesilmesi doğru, Counter sapması ölçüm yapıntısı (char5.mjs, inc_profile.mjs); düzeltme Kök neden ve Oyuncuya etkisi alanlarına uygulandı.'],
  'I-12': ['dogru', 'ik.ground yalnız okunuyor (character.js:860, 920, 923), hiçbir yerde atanmıyor.'],
  'I-13': ['dogru', 'camtest: sırtı duvara 0,35 m dayalı oyuncuda kamera kutunun içinde.'],
  'I-17': ['dogru', 'char7.mjs: kürek ucu en alçak 0,30 m, sol bilek–sap 0,13–0,38 m.'],
  'I-20': ['dogru', 'char4.mjs nişan pozu: namlu (−0,19; 1,30; 0,61), alev (0; 1,45; 0,6).'],
};
// Faz 8 tasarım belgesi Ek A (J alanı) ve Faz 9 tasarım belgesi §0.2 (K-09)
const FAZ8_BELGE = 'Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md)';
const FAZ9_BELGE = 'Faz 9 tasarım belgesi §0.2 (docs/v05/tasarim/FAZ9_YAYIN_GUVENLIGI_TASARIM.md)';
const FAZ8_DOG = {
  'J-01': ['dogru', "Ölçümle doğrulandı: NPC'lere sırt dönükken 55 ana + 100 gölge çağrı; 7 km uzakta liman NPC'leri 55 + 55; Tuz Pazarı'nda 15 NPC 187 + 120 çağrı; düzeltmenin etkisi limanda 213 → 146."],
  'J-02': ['dogru', 'Ölçümle doğrulandı: sınır küresi yarıçapları ana türlerde 606–779 m; limanda 303 K + 170 K üçgen.'],
  'J-03': ['dogru', "Ölçümle doğrulandı: son işleme açıkken menüde 86 programın 42'si, limanda 95'in 42'si tuval (sRGB) çıkışlı; Düşük'te 44 programın hepsi tuval çıkışlı."],
  'J-04': ['dogru', 'Ölçümle doğrulandı: sloop 80 örgü, hepsi gölge atıyor; denizde gemi 81 ana + 80 gölge çağrı.'],
  'J-05': ['dogru', 'Ölçümle doğrulandı: 7 domuz 140, 9 papağan 81, 6 maymun 72 çağrı; mağarada 46 hayvan 617 çağrı.'],
  'J-06': ['dogru', 'Ölçüm ve kod okumasıyla: port-batched 44 ana + 64 gölge = 108 çağrı.'],
  'J-07': ['dogru', 'Ölçümle doğrulandı: görünür nokta ışığı 7, meşaleyle 8.'],
  'J-08': ['dogru', "Ölçümle doğrulandı: ilk yakışta 17 (bir koşuda 25) yeni program; SwiftShader'da 9 992 ms'lik kare."],
  'J-09': ['dogru', "Kod okumasıyla; ön ayar ölçümünde harita boyutu grafik kalitesinden geldi (Düşük'te de 1024)."],
  'J-10': ['dogru', 'Ölçümle doğrulandı: Düşük (görüş 0,3) açılışta lodScale 0,7 (olması gereken 0,553), Orta (0,65) 0,85 (olması gereken 0,76); baseLod ikisinde de 1.'],
  'J-11': ['dogru', 'Ölçümle doğrulandı: Volkanik Dev sahnesinde Yüksek → Kapalı geçişte gölge çağrısı 125 → 0, ama program 113 → 115; sahne malzemeleri yeniden derlenmedi.'],
  'J-12': ['dogru', "Node benzetimiyle doğrulandı: 60 sınırında 75 Hz'de 37,5, 100 Hz'de 50, 144 Hz'de 48, 165 Hz'de 55 FPS."],
  'J-13': ['dogru', "Hesapla doğrulandı: d99 açıkta 1 951 m, fırtınada 282 m, siste 212 m; açık denizde 1,6 km'deki adaya bakan yön 980 çağrı."],
  'J-14': ['dogru', 'Ölçümle doğrulandı: efekt Yüksek/Orta iken getContextAttributes().antialias === true.'],
  'J-15': ['dogru', 'Doğrulandı: Faz 8 çalışması 9 sahneyi, kategori dökümünü ve ilk kare derlemesini ayrıca ölçmek zorunda kaldı.'],
  'J-16': ['kismen', 'Kök neden bulundu: sızıntı değil ölçüm kusuru (§5.4); düzeltme başlığa ve Kök neden alanına uygulandı (karar K8-7).'],
  'J-17': ['dogru', 'Ölçümle doğrulandı: ada ilk görüşünde 1–5 yeni program, ilk kare 72–290 ms (ikinci 10–29 ms); bir koşuda 5 289 ms.'],
  'J-18': ['dogru_kod', 'Kod okumasıyla (mapArt.js:99-108, getImageData :102).'],
  'J-19': ['dogru_kod', "Kod okumasıyla, ölçülmedi (engine.js:52-71 her rAF'ta post.render())."],
  'J-20': ['dogru_kod', 'Kod okumasıyla (effects.js:45-48, :121-146).'],
  'J-21': ['dogru', 'Ölçümle doğrulandı: şişe döngüsü başına +2 geometri, sahnede değil.'],
  'J-22': ['dogru_kod', 'Kod okumasıyla (kk.js:244).'],
  'J-23': ['dogru', 'Ölçümle doğrulandı ve genişletildi: limanda statik süsler 207 çağrı.'],
  'J-24': ['dogru', 'Ölçümle doğrulandı: fırtınada hava efekti 17 çağrı / 152 K üçgen.'],
  'J-25': ['dogru', 'Ölçümle doğrulandı: mağara odasında gölge 161–175 çağrı / 290 K üçgen.'],
  'J-26': ['dogru_kod', "Kod okumasıyla; animasyon ve parçacık yüklemesini Faz 3 C-14 çözüyor."],
  'J-27': ['dogru_kod', null],
  'J-29': ['dogru', 'Taban kaydıyla: 13_donma P01 10,5 ms.'],
  'J-30': ['dogru', 'Ölçümle doğrulandı: limandan 7 km uzakta npcs.update 0,35 ms/kare.'],
};
const FAZ9_DOG = {
  'K-09': ['dogru', "N9-2: v0.4 tek HTML'i assets/ klasöründen açıldığında __ready hiç gelmedi (240 sn), 258 konsol hatası, 53 'Model yüklenemedi'; kk.js:70-71 hata atıyor ve boot() düşüyor (gerçek tarayıcı; denetim yalnız Node benzetimi yapmıştı)."],
};
// Tek tabloda birleşik tasarım doğrulaması: id → [belge, tip, not]
const TASARIM_DOG = {};
for (const [id, v] of Object.entries(FAZ8_DOG)) TASARIM_DOG[id] = [FAZ8_BELGE, ...v];
for (const [id, v] of Object.entries(FAZ9_DOG)) TASARIM_DOG[id] = [FAZ9_BELGE, ...v];
for (const id of ['H-03', 'H-14', 'H-15', 'H-16', 'H-17', 'H-18', 'H-21', 'H-24', 'H-26', 'H-28', 'H-29', 'I-04', 'I-07', 'I-09', 'I-11', 'I-14', 'I-15', 'I-16', 'I-18', 'I-19', 'I-21']) FAZ7_DOG[id] = ['dogru_kod', null];
for (const [id, v] of Object.entries(FAZ7_DOG)) TASARIM_DOG[id] = [FAZ7_BELGE, ...v];

// Belirsiz kalan ama kısmi destek ya da açıklama notu olan maddeler
const BELIRSIZ_NOT = {
  'A-02': "Karşı doğrulama notu (A/REQ9): bu açılış engeli işçisiz senaryoya bağlı değil; işçi yokken ızgara yerelde üretiliyor, red ancak gridGen istisnası ya da MAX_TRIES yoluyla mümkün.",
  'A-03': "K alanındaki T9 (Hızlı yolculuk) satırı hızlı yolculuğun test edilmediğini kaydediyor; yeniden giriş ve bekleme sırasındaki durum değişimi kısımları ayrıca sınanmadı.",
  'B-17': "'Tayfayı at' aracının olmaması E alanının denetçisinin E-22 bulgusuyla örtüşüyor; ihlal puanı ve sabit pencereli oran sınırı kısımları ayrıca sınanmadı.",
  'E-12': "Mekanizma (gemi hizmetleri konukta yerel uygulanıyor, ev sahibine 'shipFull' ile gidiyor) B-01 denetçisinin kök neden tanımıyla örtüşüyor; ev sahibinin hangi alanları uyguladığı ayrıca sınanmadı.",
  'E-22': "'Ev sahibinin oyuncu atma aracı yok' kısmı B-17 ile örtüşüyor; 12 küresel yuva kısmı ayrıca sınanmadı.",
  'F-11': "Kitap kısmı (konuk günlüğü alınca ev sahibinde kitap görünür kalıyor) F-01 ve F/DOC3 karşı doğrulamalarında doğrulandı; harita parçalarının yalnız ev sahibine gitmesi ayrıca sınanmadı.",
  'I-M01': "Kök neden (tabanca ışınının kameradan çıkması) C-06 ve C-M02 ile ortak; noCam engel belirtisi ayrıca sınanmadı.",
  'J-28': "Faz 8 tasarım belgesi (Ek A) bu maddeyi gerçek GPU olmadan ölçülemez olarak işaretledi.",
  'B-M07': "Sohbet kısmı (200 KB sohbet kontrolü ileti ev sahibine hiç ulaşmadığı için geçiyor) E/SYS2 karşı doğrulamasıyla bağımsız olarak doğrulandı; altın bütçesi kısmı ayrıca sınanmadı.",
  'E-M04': "E/SYS1 doğrulama notunda aynı doğrulayıcı tarafından kaydedildi; ayrı bir kaynakla sınanmadı.",
};

// Kaçırılan maddelerin sürüm ve faz bilgisi (metinden çıkarım)
const MISSED_META = {
  'A-M01': { presentIn: 'v03_ve_v04' }, 'A-M02': { presentIn: 'yalniz_v04' },
  'B-M01': { presentIn: 'v03_ve_v04' }, 'B-M02': { presentIn: 'v03_ve_v04' }, 'B-M03': { presentIn: 'yalniz_v04' },
  'B-M04': { presentIn: 'yalniz_v04' }, 'B-M05': { presentIn: 'yalniz_v04' }, 'B-M06': { presentIn: 'v03_ve_v04', cikarim: true },
  'B-M07': { presentIn: 'yalniz_v04' },
  'C-M01': { presentIn: 'v03_ve_v04' }, 'C-M02': { presentIn: 'v03_ve_v04' }, 'C-M03': { presentIn: 'v03_ve_v04' }, 'C-M04': { presentIn: 'yalniz_v04' },
  'D-M01': { presentIn: 'yalniz_v04' }, 'D-M02': { presentIn: 'v03_ve_v04' },
  'E-M01': { presentIn: 'v03_ve_v04' }, 'E-M02': { presentIn: 'v03_ve_v04' }, 'E-M03': { presentIn: 'v03_ve_v04', cikarim: true }, 'E-M04': { presentIn: null },
  'F-M01': { presentIn: 'v03_ve_v04' }, 'F-M02': { presentIn: 'v03_ve_v04' }, 'F-M03': { presentIn: 'v03_ve_v04' },
  'G-M01': { presentIn: 'v03_ve_v04' }, 'G-M02': { presentIn: 'v03_ve_v04' },
  'H-M01': { presentIn: 'v03_ve_v04' }, 'H-M02': { presentIn: 'yalniz_v04' }, 'H-M03': { presentIn: 'v03_ve_v04' }, 'H-M04': { presentIn: 'v03_ve_v04' },
  'I-M01': { presentIn: 'yalniz_v04' },
  'J-M01': { presentIn: 'v03_ve_v04' }, 'J-M02': { presentIn: 'v03_ve_v04' },
  'K-M01': { presentIn: 'yalniz_v04' }, 'K-M02': { presentIn: 'yalniz_v04' }, 'K-M03': { presentIn: 'yalniz_v04' }, 'K-M04': { presentIn: 'yalniz_v04' }, 'K-M05': { presentIn: 'yalniz_v04' },
};

// Hedef faz istisnaları (varsayılan: alanın fazı)
const FAZ = {
  'D-01': 'F4 (+F2)', 'G-01': 'F4 (+F2)',
  'D-03': 'F2 (+F4, F5)', 'G-02': 'F2 (+F4, F5)', 'E-05': 'F2 (+F4, F5)', 'E-06': 'F2 (+F4, F5)',
  'F-01': 'F2 + F4', 'D-02': 'F2 + F4',
  'E-01': 'F2', 'E-02': 'F2', 'E-03': 'F2', 'E-04': 'F2', 'E-12': 'F2', 'E-13': 'F2', 'E-19': 'F2', 'E-22': 'F2',
  'E-M01': 'F2 (+F5)', 'E-M02': 'F2', 'B-M01': 'F2 (+F5)',
  'H-03': 'F2', 'H-14': 'F2',
  'H-13': 'F5', 'H-15': 'F5', 'H-16': 'F5', 'H-17': 'F5', 'E-18': 'F5',
  'H-18': 'F6', 'H-21': 'F6', 'F-08': 'F6',
  'I-02': 'F3', 'I-14': 'F3', 'I-13': 'F3', 'I-M01': 'F3', 'C-M02': 'F3', 'G-13': 'F3',
  'I-15': 'F5',
  'G-14': 'F8', 'G-05': 'F4', 'D-08': 'F4', 'G-M02': 'F5',
  'J-10': 'F1', 'J-09': 'F1', 'A-M02': 'F1',
  'J-26': 'F3 (+F8)', 'C-14': 'F3 (+F8)', 'C-M04': 'F3 (+F8)',
  'K-01': 'F9', 'A-01': 'F9',
  'K-11': 'F1', 'K-M05': 'F1', 'K-M02': 'F1',
  'K-12': 'F1', 'K-13': 'F1 (+F9)', 'K-03': 'F1 (+F9)', 'K-07': 'F1 (+F9)', 'K-08': 'F1', 'K-M01': 'F5', 'K-M04': 'F4',
  'F-M01': 'F5 (+F6)', 'F-02': 'F6 (+F4)', 'D-17': 'F6 (+F4)', 'F-04': 'F6 (+F5)', 'F-M02': 'F6 (+F5)',
  'F-05': 'F6 (+F2)', 'F-M03': 'F6 (+F2)', 'F-06': 'F2', 'B-12': 'F2',
  'D-09': 'F4', 'E-15': 'F4', 'D-11': 'F4', 'E-23': 'F4',
  'E-M04': 'F5', 'E-M03': 'F2',
};

// Doğrulama düzeltmelerinden çıkan ek maddeler (rapor yazımında ayrı madde yapıldı)
const EK_MADDELER = [
  {
    id: 'C-M05', alan: 'C', kaynak_ref: 'C/UC3',
    title: "Algı ve _los görüş hattı varsayılan uç paylarıyla (tMax 0,98) sınanıyor: hedefin dibindeki ince engel uzaktan yok sayılıyor",
    file: 'js/game/enemies.js:555; js/world/physics.js:194-195 (lineBlocked varsayılanları tMin 0,02 / tMax 0,98 / rScale 0,8)',
    func: 'Düşman algısı / _los → physics.lineBlocked',
    rootCause: "Düşman algısı ve _los, lineBlocked'ı varsayılan oransal uç paylarıyla çağırıyor (physics.js:195: tMin 0,02, tMax 0,98). Doğrunun son %2'si sınanmıyor; uzak mesafede bu pay metrelerce uzunluğa karşılık geldiği için hedefin hemen önündeki ince engel sorgunun dışında kalıyor. v0.3'te de aynı paylar var (v0.3 physics.js:189: `t > 0.02 && t < 0.98`).",
    impact: "Çite ya da alçak duvara yaslanan oyuncu uzaktaki düşman tarafından engelin içinden görülüyor; siper güvenilmez. Karşı doğrulamanın Node ölçümünde 0,2 m'lik çite yaslanan oyuncu 27 m ve üstünden, 0,4 m'lik duvarda bu eşik ≈36,5 m.",
    priority: 'dusuk',
    fix: "Uç payını oran yerine sabit uzunlukla tanımla (ör. hedef yarıçapı kadar, 0,3–0,5 m) ya da hedefin kendi çarpıştırıcısını sorgudan hariç tutup tMax=1 kullan; zıpkın süpürmesiyle (C-07) birlikte tek görüş hattı yardımcısında topla.",
    repro: "Node'da lineBlocked'ı 0,2 m kalınlıkta bir çit kutusu ve çitin hemen arkasındaki hedefle 10–40 m mesafelerden varsayılan paylarla çağır: 27 m ve üstünde false döner (karşı doğrulama C/UC3'teki ölçüm).",
    acceptance: "Hedefin 0,5 m önündeki 0,2 m'lik engel 5–80 m arası tüm mesafelerde görüşü kesmeli; hedefin kendi kutusu sorguyu engellememeli.",
    presentIn: 'v03_ve_v04', presentIn_not: 'v0.3 için rapor yazımında kod okumasıyla: v0.3 physics.js:189', hedef_faz: 'F3',
  },
  {
    id: 'D-M03', alan: 'D', kaynak_ref: 'D/SYS1',
    title: "'Demir Bilek' becerisi olan oyuncunun canı her yüklemede şişiyor (50 → 73 → 106 → 145)",
    file: 'js/game/game.js:130; js/player/player.js:42; js/game/progress.js:159-161',
    func: 'game yükleme (oyuncu canı) → progress.recompute',
    rootCause: "Yüklemede game.js:130 kayıtlı canı, azami can henüz varsayılan 100 iken (player.js:42) atıyor. Ardından progress.recompute (progress.js:159-161) oranı bu değerle (hp/100) hesaplayıp beceri bonuslu yeni azami cana uyguluyor; kayıtlı can böylece büyütülüyor.",
    impact: "Azami canı 145 olan oyuncuda art arda yüklemelerde can 50 → 73 → 106 → 145'e çıkıyor (/tmp/denetim_alan/karsit_kayit/hp_mast_probe.mjs); kaydet-yükle ile ücretsiz iyileşme. Denge sorunu, işlev kaybı yok.",
    priority: 'dusuk',
    fix: "Yüklemede önce becerileri uygula (recompute), sonra kayıtlı canı yeni azami cana kıskaçlayarak ata; ya da recompute'ta oranı yalnız becerinin değiştiği anda uygula.",
    repro: "Demir Bilek becerisi olan (azami can 145) ve canı 50 olan bir kaydı yükle, kaydet, yeniden yükle: can 73, 106, 145 olarak artar.",
    acceptance: "Becerili oyuncuda üç kaydet-yükle döngüsünden sonra can kayıttaki değerle aynı kalmalı (12 K01 benzeri kontrol, beceri açık).",
    presentIn: 'v03_ve_v04', presentIn_not: 'v0.3 için rapor yazımında kod okumasıyla çıkarım: v0.3 game.js:123, progress.js:146-154', hedef_faz: 'F4',
  },
  {
    id: 'J-M03', alan: 'J', kaynak_ref: 'J/SYS1',
    title: "Efekt kalitesi her değiştiğinde UnrealBloomPass'in 11 HalfFloat hedefi bırakılmıyor (1080p'de ~15 MB, 2880×1800'de ~38 MB)",
    file: 'js/core/post.js:60-76 (setQuality; composer.dispose 65)',
    func: 'post.setQuality',
    rootCause: "setQuality eski composer'ı composer.dispose() ile bırakıyor (post.js:65), ama EffectComposer.dispose yalnız kendi hedeflerini bırakıyor (EffectComposer.js:354-361); UnrealBloomPass'in kendi 11 HalfFloat render hedefi serbest bırakılmıyor.",
    impact: "Efekt ayarı her değiştiğinde GPU belleği sızıyor: 1080p'de ~15 MB, 2880×1800'de ~38 MB. Ayar sık değiştirilmedikçe etkisi düşük.",
    priority: 'dusuk',
    fix: "Composer'ı bırakmadan önce bloom geçişinin dispose() yöntemini (ve diğer geçişlerin kendi hedeflerini) çağır; ya da composer'ı yeniden kurmak yerine geçiş parametrelerini değiştir.",
    repro: "Efekt ayarını yüksek ↔ düşük arasında 10 kez değiştir; renderer.info.memory.textures her döngüde artar.",
    acceptance: "10 ayar değişikliğinden sonra doku sayısı başlangıç değerine döner (11_arayuz_sizinti benzeri kontrol).",
    presentIn: 'v03_ve_v04', presentIn_not: 'v0.3 için rapor yazımında kod okumasıyla: v0.3 post.js:60-76 aynı yapı', hedef_faz: 'F8',
  },
  {
    id: 'J-M04', alan: 'J', kaynak_ref: 'J/SYS1',
    title: "Uzak oyuncunun ad etiketi sprite'ı ve CanvasTexture'ı bırakılmıyor",
    file: 'js/net/net.js:75-85, 125 (RemotePlayer._label / dispose)',
    func: 'RemotePlayer._label / RemotePlayer.dispose',
    rootCause: "RemotePlayer ad etiketini bir CanvasTexture ve SpriteMaterial ile kuruyor (net.js:75-85); dispose (net.js:125) kökü sahneden çıkarıp karakteri bırakıyor, ama etiketin dokusu ve malzemesi bırakılmıyor.",
    impact: "Her konuk ayrılıp yeniden katıldığında bir etiket dokusu ve malzemesi GPU'da kalıyor; uzun co-op oturumlarında küçük, birikimli sızıntı.",
    priority: 'dusuk',
    fix: "dispose'ta etiket sprite'ının material.map.dispose() ve material.dispose() çağrılarını ekle.",
    repro: "Co-op'ta bir konuğu 10 kez çıkarıp yeniden kat; ev sahibinde renderer.info.memory.textures her döngüde artar.",
    acceptance: "10 katılma/ayrılma döngüsünden sonra doku sayısı başlangıçla aynı.",
    presentIn: 'v03_ve_v04', presentIn_not: "v0.3 için rapor yazımında kod okumasıyla: v0.3 net.js:44-109; v0.3 dispose karakteri de bırakmıyor", hedef_faz: 'F8',
  },
];

// Kaçırılan maddelerin diğer belgelerdeki adları
const TAKMA = { 'A-M02': "Faz 8 tasarımı ve KARARLAR.md (K8-8) bu maddeyi 'A-19' olarak anıyor" };

// KNOWN_ISSUES 'Durum' notları
const DURUM_NOT = { 'K-M02': "Açık (başlangıç kaydı 8d8fb8a'da düzeltildi ve işçisiz kipler f80f205'te tabana eklendi; senaryonun etkin kipi doğrulamaması açık)" };

// Bilinen sorun kümeleri (aynı kusurun farklı alanlardaki kayıtları)
const KUMELER = [
  { kod: 'K01', uyeler: ['B-01', 'E-01'], faz: 'F2', baslik: "Konuktan gelen 'shipFull' iletisi doğrulanmıyor: ev sahibinin gemisi değiştirilebiliyor ya da silinebiliyor, ambar ve kaynaklar keyfî yazılıyor; kapanış kaydıyla kayıp kalıcı" },
  { kod: 'K02', uyeler: ['B-M02'], kismi: ['E-01', 'B-06'], faz: 'F2', baslik: "Gemi adıyla kalıcı (stored) XSS: ad hud.js:302/311 ve Usta Bora diyaloğunda (panels.js:220) kaçışsız innerHTML'e giriyor" },
  { kod: 'K03', uyeler: ['B-04', 'E-04'], faz: 'F2', baslik: "'st' durum iletisi şemasız ve oran sınırı dışında: sahte ya da NaN konum yakınlık denetimlerini aşıyor, bozuk 'eq' ağ döngüsünü kesiyor" },
  { kod: 'K04', uyeler: ['B-M01', 'E-M01'], faz: 'F2 (+F5)', baslik: "PeerJS 16 300 baytlık gönderim sınırı ve koşulsuz _dropPeer: tek büyük ileti bütün konukları düşürüyor, konuklar pong aldığı için donuk dünyada kalıyor" },
  { kod: 'K05', uyeler: ['B-05'], kismi: ['E-03', 'E-02'], faz: 'F2', baslik: null },
  { kod: 'K06', uyeler: ['E-02', 'B-M05'], kismi: ['E-M03'], faz: 'F2', baslik: "Ambar konuktan tam nesne olarak kabul ediliyor: balıklar siliniyor (v0.4 gerilemesi), son yazan kazanıyor, keyfî eşya giriyor" },
  { kod: 'K07', uyeler: ['B-07', 'H-03'], kismi: ['E-03'], faz: 'F2', baslik: "Savaş sonuçlarını konuk belirliyor: hasar, boss hasarı ve sersemletme mesafe, tür ve konum doğrulamasız" },
  { kod: 'K08', uyeler: ['B-M04', 'E-19'], faz: 'F2', baslik: "Altın paylaşım sınırı dürüst büyük satışlarda konuk ve tayfa payını kırpıyor; kırpılan altın yok oluyor" },
  { kod: 'K09', uyeler: ['B-09', 'E-M02'], faz: 'F2', baslik: "Ana döngüde hata yalıtımı yok: tek bozuk ileti ya da nesne benzetimi, anlık görüntüyü ve girdi temizliğini durduruyor" },
  { kod: 'K10', uyeler: ['B-12', 'F-06'], kismi: ['E-03'], faz: 'F2', baslik: "'story' iletisi yalnız '+1 aşama' kuralıyla doğrulanıyor: yeniden gönderimle tüm aşamalar atlanıyor, bayraklar koşulsuz birleşiyor" },
  { kod: 'K11', uyeler: ['F-01', 'D-02'], faz: 'F2 + F4', baslik: "Konuk kaydındaki başka dünyaların hikâye bayrakları ev sahibine sızıyor; 'gunluk' bayrağı 2. aşamayı kalıcı kilitliyor (v0.4 gerilemesi)" },
  { kod: 'K12', uyeler: ['B-15', 'B-M06'], kismi: ['E-03'], faz: 'F2', baslik: "Oturum iletileri ('hello', 'app', 'ping') doğrulanmıyor: roster şişiyor, ad temizlenmiyor, bozuk görünüm geç katılan konuğun dünyasını donduruyor" },
  { kod: 'K13', uyeler: ['B-17', 'E-22'], faz: 'F2', baslik: "Kötü niyetli bağlantıya yaptırım yok: ihlal puanı ve 'tayfayı at' yok; açık odalar 12 öngörülebilir yuvayla sınırlı" },
  { kod: 'K14', uyeler: ['C-08', 'C-M03'], faz: 'F3', baslik: "Güverte, dümen ve top kipinde oyuncu gemiden bir alt adım geride konumlanıyor ve gemiye göre titriyor" },
  { kod: 'K15', uyeler: ['C-14', 'C-M04', 'J-26'], faz: 'F3 (+F8)', baslik: "Alt adım döngüsü görsel, arayüz ve animasyon işlerini de her alt adımda yapıyor: maliyet alt adım sayısıyla katlanıyor" },
  { kod: 'K16', uyeler: ['C-M02', 'I-M01'], kismi: ['C-06', 'I-02'], faz: 'F3', baslik: "Tabanca ışını kameradan çıkıyor: oyuncunun arkasındaki düşman vuruluyor, kamera ile oyuncu arasındaki noCam engeller atışı boşa çıkarıyor" },
  { kod: 'K17', uyeler: ['C-07', 'C-M05'], faz: 'F3', baslik: "Görüş hattı ve zıpkın süpürmesi oransal uç paylarıyla yapılıyor: ince engeller ve hedefin dibindeki engel yok sayılıyor" },
  { kod: 'K18', uyeler: ['C-13', 'I-13', 'G-13'], faz: 'F3', baslik: "Kamera ve oyuncu ada yapılarının içine giriyor: çarpıştırıcı kutuları görselden küçük, kamera çarpışması yarıçapsız" },
  { kod: 'K19', uyeler: ['D-01', 'G-01'], faz: 'F4 (+F2)', baslik: "Tutsak kurtarma ödülü sınırsız tekrarlanıyor: kalıcı 'freed' durumu denetlenmiyor, konukta gardiyan koşulu işlemiyor" },
  { kod: 'K20', uyeler: ['D-03', 'G-02', 'E-05', 'E-06'], faz: 'F2 (+F4, F5)', baslik: "Co-op'ta dünya kalıcılık durumu eşitlenmiyor: konuk her katılışta sandık, sunak, tutsak ve bulmaca ödüllerini yeniden alıyor; konuk eylemleri ev sahibi kaydına girmiyor" },
  { kod: 'K21', uyeler: ['D-08', 'G-05'], faz: 'F4', baslik: "Martı Batığı sandığı kayda yazılmıyor: kaydet-yükle ile sınırsız açılabiliyor" },
  { kod: 'K22', uyeler: ['D-09', 'E-15'], faz: 'F4', baslik: "Konuk ilerlemesi periyodik kaydedilmiyor; eski konuk kaydı daha yeni ilerlemeyi ezebiliyor" },
  { kod: 'K23', uyeler: ['D-11', 'E-23'], faz: 'F4', baslik: "Çoklu sekme kilidi yok: aynı yuva ya da konuk kaydı iki sekmede birbirini eziyor" },
  { kod: 'K24', uyeler: ['F-02', 'D-17'], kismi: ['H-18'], faz: 'F6 (+F4)', baslik: "Hikâye bossunun doğuş bayrağı kayda yazılıyor: boss alanının 200 m içinde yüklenen oyunda Morvan ya da Kızıl Hançer doğmuyor" },
  { kod: 'K25', uyeler: ['F-04', 'F-M02'], kismi: ['H-18'], faz: 'F6 (+F5)', baslik: "Co-op: hikâye bossu tetikleyicisi yalnız yerel oyuncunun konumuna bakıyor; konukta sahte boss doğup siliniyor" },
  { kod: 'K26', uyeler: ['E-18', 'H-17'], faz: 'F5', baslik: "Co-op'ta bazı savaş etkileri konuklara uygulanmıyor (gülle ve lav patlaması, zehir, yakalama, geri itme)" },
  { kod: 'K27', uyeler: ['F-05', 'F-M03'], faz: 'F6 (+F2)', baslik: "Co-op 1. aşama: Martı sandığını konuk satarsa hikâye ilerlemiyor ('chestSold' ağda yok)" },
  { kod: 'K28', uyeler: ['F-08', 'H-21'], faz: 'F6', baslik: "Hikâye ve insan bossları öldürülünce XP vermiyor; tanımlı xp değerleri kullanılmıyor" },
  { kod: 'K29', uyeler: ['A-M02', 'J-10'], kismi: ['J-09'], faz: 'F1', baslik: "Ayar sırası: kayıtlı görüş mesafesi açılışta araziye uygulanmıyor, herhangi bir ayar değişince arazi LOD ön ayarı sıfırlanıyor" },
  { kod: 'K30', uyeler: ['K-01', 'A-01'], faz: 'F9', baslik: "Depodaki kök tek HTML hâlâ v0.3 derlemesi; güncel derleme yalnız git dışındaki dist/'te" },
];
// Tekil KI'lerde kısmi üyeler
const KISMI_TEKIL = { 'B-02': ['E-03'], 'B-03': ['E-03'], 'B-08': ['E-03'], 'B-10': ['E-03'], 'B-11': ['E-03'], 'B-14': ['E-03'], 'D-14': ['B-05'] };
// Kendi KI'si olmayan (içeriği kısmi üyelikle başka KI'lere dağıtılan) maddeler
const KI_DISI = ['E-03'];

// Sistem kararları (referans: test edilmiş sistemlerin sıra numarası)
const T = 'calisiyor_test_edilmis', U = 'dogrulanmamis', G = 'calisiyor_gelistirilmeli';
const SYS_KARAR = {
  A: {
    SYS3: { split: [["'ready' ve 'test-crash' iletileri", T], ["'error' iletisi yolu (depo testi yok)", U]] },
    SYS4: { split: [["prepare()'in her durumda sonlanması", T], ['Odak koruması (uzak kamerada karoların korunması, odakta LOD yükseltme) ve zaman aşımı dalı', U]] },
    SYS5: { split: [['Temel pencere üretimi ve taşıma', T], ['_depthSeq ve odak bastırması', U]] },
    SYS6: { split: [['heightAt/normalAt sorgusunun çalışması', T], ["'Ağ üçgenlemesiyle tutarlı' özelliği (yalnız Node'da doğrulandı, depo testiyle korunmuyor)", U]] },
    SYS8: { split: [['Menü ekranının açılması', T], ['3B menü sahnesi mantığı (yalnız dolaylı duman testi)', U]] },
  },
  B: { SYS1: { to: G }, SYS2: { to: G }, SYS3: { to: G }, SYS4: { to: G }, SYS5: { to: G } },
  C: {
    SYS1: { to: U }, SYS5: { to: G },
    SYS7: { split: [['Çapa sıfırlaması', T], ['Liman halatı ve çekiş sınırı', U]] },
    SYS8: { to: U },
  },
  D: {
    SYS1: { to: G },
    SYS2: { split: [['Envanter', T], ['Altın (yükleme sonrası hiçbir senaryoda ölçülmüyor)', U]] },
    SYS3: { to: G }, SYS6: { to: G },
    SYS8: { split: [['Taşınan sandık', T], ['Yerdeki, sudaki ve kayıktaki sandık (kayıt/yükleme testi yok)', U]] },
  },
  E: { SYS2: { to: G }, SYS3: { to: G } },
  F: {
    SYS1: { split: [['Evre eşikleri', T], ["Dövüş davranışının bütünü ('rise' doğuşu, dönen saldırı, tabanca, duman bombası, tam savaş)", U]] },
    SYS2: { to: G },
    SYS3: { split: [['Dünya verisi ve geometrisi', T], ['Bölgelerin oynanabilir içeriği ve efsanevi boss karşılaşmaları', U]] },
  },
  G: {
    SYS2: { split: [["Kırlangıç limanı ve iskelesi, mağara kamerası, Martı Batığı sandığı", T], ['Çekirdek adaların geri kalan içeriği', U]] },
    SYS8: { to: G }, SYS11: { to: G }, SYS12: { to: G },
    SYS13: { split: [['Kırılabilir sandık ve kalıcılık', T], ['Barut fıçısının patlama mekaniği', U]] },
  },
  H: { SYS2: { to: 'hatali_kararsiz' }, SYS4: { to: G } },
  I: {
    SYS2: { split: [['ANIM_MAP ad çözümü', T], ['Oran düzeltme ve üst/alt katman bölme', U]] },
    SYS3: { split: [['Sprint bayrağı histerezisi ve tükenme kilidi', T], ['Walk↔Run klip histerezisi ve A→B→A bastırma', U]] },
    SYS4: { to: G },
  },
  J: { SYS1: { to: G }, SYS2: { split: [['Dinleyici ve rAF temizliği', T], ['WebGL temizliği', U]] }, SYS5: { to: G } },
  K: {},
};

// Kullanıcı iddiası hüküm düzeltmeleri
const UC_KARAR = {
  D: { UC1: { v04: 'dogru' }, UC2: { v04: 'kismen' }, UC3: { v04: 'kismen' }, UC6: { v04: 'kismen' }, UC7: { v04: 'kismen' } },
  I: { UC3: { v03: 'dogru' }, UC5: { v04: 'kismen' } },
  J: { UC1: { v04: 'dogru' } },
};

// §10 test → faz
function tFaz(n) {
  if (n <= 10) return n === 8 || n === 10 ? 'F1 (+F4)' : 'F1';
  if (n <= 20) return 'F3';
  if (n === 23 || n === 29 || n === 30) return 'F2';
  if (n === 31) return 'F7';
  if (n === 33) return 'F2 (+F4)';
  if (n === 37 || n === 38) return 'F2';
  if (n <= 36) return 'F5';
  if (n <= 48) return 'F4';
  if (n <= 54) return 'F6';
  return 'F9';
}

// §2: en önemli bulgular (sıra önemli)
const ONEMLI = [
  { ids: ['B-01', 'E-01'], metin: "Konuktan gelen 'shipFull' iletisi doğrulanmadan uygulanıyor: tek bir ileti ev sahibinin gemisini değiştirebiliyor ya da silebiliyor, ambarı ve kaynakları keyfî yazabiliyor. Sayfa kapanışı ve sekme değişimi kaydı nedeniyle gemi geliştirmeleri ve ambar kalıcı olarak kaybolabiliyor." },
  { ids: ['B-M02', 'B-06'], metin: "Gemi adı ve ağdan gelen eşya verisi kaçışsız innerHTML'e giriyor (hud.js:302/311, panels.js:220, balık color/name): konuk ev sahibine, diğer konuklara ve kayda kalıcı XSS yerleştirebiliyor." },
  { ids: ['B-M01', 'E-M01'], metin: "PeerJS 1.5.5 JSON kanalı 16 300 bayt ve üstü iletiyi göndermiyor; ev sahibi her gönderim hatasında konuğu düşürüyor (net.js:233). ~15 KB'lık tek bir 'st' ya da sahte ambar bütün odayı düşürüyor; konuklar pong aldığı için donuk dünyada kalıyor. Bulgu küçültülmüş vendor kaynağının okunmasına ve Node modeline dayanıyor; gerçek iki tarayıcıda yeniden üretilmeli." },
  { ids: ['B-04', 'E-04'], metin: "'st' durum iletisi şemasız: sahte konum tüm yakınlık denetimlerini aşıyor, NaN konum 'd > sınır' biçimli denetimleri açıyor (707 m uzaktaki düşmana hasar işlendi), bozuk 'eq' ev sahibinin ağ döngüsünü kesiyor." },
  { ids: ['B-02', 'B-03', 'B-09', 'E-M02'], metin: "Gemi komutları ve kayık durumu doğrulanmıyor, ana döngüde hata yalıtımı yok: tek ileti ev sahibi sekmesini CPU kilidine sokabiliyor (cannonFix/mastFix), yelkeni kayıtta kalıcı NaN yapabiliyor ya da anlık görüntü yayınını kalıcı olarak kesebiliyor." },
  { ids: ['B-05', 'B-10', 'B-11', 'E-03'], metin: "Ganimet, ambar, sandık, kazı ve tehlike iletileri konuğun beyanına dayanıyor: sınırsız ganimet ve altın üretimi, uzaktan etkileşim, uzaktan fıçı patlatma ve bulmaca çözme mümkün." },
  { ids: ['B-07', 'H-03', 'B-08'], metin: "Savaş ve ekonomi sonuçlarını konuk belirliyor: hasar ve boss hasarı mesafe, tür ve konum doğrulamasız (v0.4 yalnız 0–220 kırpma ve genel oran sınırı ekledi); 'gold' iletisiyle satış yapmadan dakikada 20 000 altın aktarılabiliyor." },
  { ids: ['B-12', 'F-06'], metin: "v0.4'te eklenen 'story' iletisi yalnız '+1 aşama' kuralıyla doğrulanıyor: yeniden gönderimle tüm aşamalar atlanabiliyor, keyfî bayrak yazılabiliyor." },
  { ids: ['F-01', 'D-02'], metin: "v0.4 gerilemesi: konuk kaydındaki başka dünyaların hikâye bayrakları katılımda ev sahibine sızıyor; 'gunluk' bayrağı ev sahibinin ana hikâyesini 2. aşamada kalıcı kilitleyebiliyor." },
  { ids: ['D-01', 'G-01'], metin: "Tutsak kurtarma kalıcı 'freed' durumunu denetlemiyor: gardiyanlar yokken (öldürülmüş ya da kayıt sonrası doğmamışsa, D-07) E basılı tutuldukça ya da bırakılıp yeniden basıldıkça her 2,5 sn +120 altın ve +80 XP; tek oyunculuda da geçerli, konukta gardiyan koşulu hiç işlemiyor." },
  { ids: ['D-03', 'G-02', 'E-05', 'E-06'], metin: "Co-op'ta dünya kalıcılık durumu konuğa aktarılmıyor ve konuk eylemleri ev sahibi kaydına girmiyor: konuk her katılışta sandık, sunak, tutsak ve bulmaca ödüllerini yeniden alıyor; ev sahibinin kurmadığı adadaki konuk olayları hiçbir kayda girmiyor." },
  { ids: ['F-03'], metin: "Ana hikâye 5. aşamada çıkmaz sokakta bitiyor: 6–10. aşamalar ve final yok (bilinen ürün boşluğu, Faz 6)." },
  { ids: ['C-03', 'C-02'], metin: "v0.4 gerilemesi: top nişan hızı alt adım sayısıyla çarpılıyor; alt adım sayısı 60/30/15 FPS'te kareden kareye gidip geldiği için nişan duyarlılığı 60 Hz'de 1,67 kata kadar ve değişken." },
  { ids: ['D-M01', 'D-M02', 'D-04'], metin: "Kayıt bütünlüğü: gemi tipi değişince eski direk ve top can dizileri yeni gemiye taşınıyor (v0.4 gerilemesi); içe aktarma doğrulamasız ve atomik değil, ilkel değerli bir profil oyunu bir daha açılmaz yapıyor." },
  { ids: ['K-02', 'K-04', 'K-05'], metin: "Yayın güvenliği: canlı dalın pages.yml'si, canlı daldan açılan 'claude/**' dallarına yapılan push'larda üretim yayınını tetikliyor; üretim yayınından önce test ya da PR kapısı yok ve canlı dal korumasız; aynı commit için iki yayıncı var. Bugün oyuncuya yansıyan fark yok; risk v0.4 birleştirmesinde ve sonraki push'larda." },
];

const V04_GIDERILEN = [
  "**Arazi işçisi yedek yolu** (A/UC1, A/UC2: v0.3'te doğru, v0.4'te yanlış; A/UC3 v0.4'te kısmen; üçü de karşı doğrulandı): yerel yol tile/depth/grid işlerinin hepsini üretiyor, yerel karo gerçek ağ kuruyor, prepare() 45 sn üst sınırla sonuçlanıyor. Kalan açıklar: kök tek dosya v0.3 (A-01/K-01), ızgara reddinde açılış düşmesi (A-02), site verisi engelliyken açılmama (A-M01).",
  "**lineBlocked 64 hücre sınırı** (C/UC1: v0.3 kısmen, v0.4 yanlış; karşı doğrulandı): uzun doğrularda çarpıştırıcı atlanmıyor.",
  "**Kamera çarpışması** (I/UC1–UC8): v0.3'te nesne çarpışması yoktu; v0.4'te duvar/kaya/bina çarpışması, güverte altı, ince engeller, gizleme, gövde/kayık, mağara, su altı ve yakın-kamera silinmesi eklendi. Karşı doğrulama I/UC5'i 'kısmen'e düşürdü (nişanda kamera gövdeye ve kayığa giriyor, I-02).",
  "**Tek oyunculu dünya kalıcılığı** (D/UC2, UC3, UC6, UC7): barut fıçıları, kırılabilir sandıklar, geçitler ve bulmacalar tek oyunculuda korunuyor. Karşı doğrulama v0.4 hükümlerini 'yanlış'tan 'kısmen'e çevirdi, çünkü co-op konuğunda hepsi yeniden kuruluyor (KI kümesi D-03/G-02). Kaya tuzakları (D/UC4, D-13) ve toplanan kaynaklar (D/UC5) hâlâ yeniden doğuyor; kayıt sürümü ve migrasyon yok (D/UC1, D-05).",
  "**Co-op dinamik olay nesneleri** (E/UC1–UC5, v0.4 kısmen): yüzen varil, şişede mesaj, kazazede ve gök taşı co-op'a kısmen taşındı. Konuk rütbesi kalıcılığı (E/UC6) ve kopma/yeniden bağlanma (E/UC9) kısmen; ortak zar (E/UC7), oyuncular arası ticaret (E/UC8) ve ev sahibi ayrılınca oturumun sürmesi (E/UC10) hâlâ yok.",
  "**Co-op hikâye senkronu** (02_HATA_LISTESI B05; F/DOC3): aşama ve bayrakların advance ile ev sahibine ulaşmaması v0.4'te giderildi; advance dışındaki bayrak değişimleri hâlâ gitmiyor ve yeni 'story' iletisi doğrulanmıyor (B-12).",
  "**Ağ sınırları** (B/UC1, B/UC2: v0.4 kısmen): genel 120/sn ileti sınırı, altın bütçesi (5 000/ileti, 20 000/dk/konuk) ve hurtBoss 0–220 kırpması eklendi; ancak sonuçlar hâlâ konuğun beyanı (B-07, B-08 kritik) ve altın bütçesi dürüst payları kırpıyor (B-M04).",
  "**Yayın tetikleyicisi** (K/UC1: v0.4 kısmen): v0.4 dalında pages.yml'nin push tetikleyicisi daraltıldı; canlı dalda açık (K-02) ve workflow_dispatch dal kısıtsız (K-03).",
];

const RISKLER = `**Yöntem sınırları**

- Bu Faz 0 denetimi statik kod okuması ve Node'da salt-okur kopyalarla yapıldı. Tarayıcı testleri ayrı taban koşusunda yürütüldü; sonuçları ana oturum §9'a ekleyecek. Bu raporda taban koşusu sonucu yalnız denetim maddelerinin kendi kanıtında anıldığı kadarıyla geçer.
- Gerçek GPU yok: taban koşusu headless Chromium ve SwiftShader ile yapıldı. Performans bulgularının (J alanı) hiçbiri gerçek GPU'da ölçülmedi; karşı doğrulama J-01, J-02 ve J-03'ün önceliğini bu yüzden 'orta'ya çekti.
- Gerçek ağ yok: co-op testleri yerel PeerJS sunucusu ve loopback üzerinde koşuyor. Gerçek sinyal sunucusu, NAT, TURN, gecikme ve paket kaybı hiç denenmedi. PeerJS 16 300 bayt bulgusu (B-M01/E-M01) küçültülmüş vendor kaynağının okunması ve Node modeliyle elde edildi; gerçek iki tarayıcıda yeniden üretilmeden düzeltme tasarımı kesinleşmemeli.
- Kanıt betikleri denetim sırasında \`/tmp/denetim_alan/…\` altında koşuldu. Ana oturum a47f88c'de bunların kalıcı kopyasını \`docs/v05/tasarim/denemeler/\` altına arşivledi; belgelerdeki \`/tmp/…\` yolları bu klasöre karşılık gelir. Bunlar test senaryosu değil, salt-okur denemelerdir; düzeltme fazlarında ilgili tekrar üretme adımları kalıcı test senaryolarına dönüştürülmeli.

**Doğrulama kapsamı**

- Karşı doğrulama kritik ve yüksek hatalara, 'çalışıyor ve test edilmiş' sistemlere, 'karşılanıyor' gereksinimlere, 'yanlış' belge iddialarına ve tüm kullanıcı iddialarına odaklandı. H, I ve J dışındaki alanlarda orta ve düşük maddelerin büyük bölümü tek kaynaklıdır ve 'belirsiz' olarak işaretlendi (sayılar §2'de); bunlar düzeltmeden önce kendi tekrar üretme adımıyla yeniden üretilmeli.
- 'Doğrulandı (dolaylı)' ve 'Doğrulandı (iki bağımsız kaynak)' maddelerinde ana kusur ikinci bir kaynakla doğrulandı; alt iddiaların sınanmayan kısımları maddenin Doğrulama sonucu notunda yazılı.
- H, I ve J alanlarında karşı doğrulama yalnız kritik/yüksek maddeleri kapsıyordu; bu alanların diğer maddeleri Faz 7 (§0.5) ve Faz 8 (Ek A) tasarım belgelerinin madde bazındaki doğrulama tablolarına dayanarak doğrulandı. Bu tablolarda bir kısım madde yalnız kod okumasıyla sınandı (Faz 7'de 21 madde; Faz 8'de J-18…J-20, J-22, J-26, J-27); J-28 gerçek GPU olmadan ölçülemedi.
- I-01'in klip doğal hızları iki kaynak arasında çelişkili: I karşı doğrulaması temas noktasından koşuda 4,4–4,6 m/sn, Faz 7 tasarımı destek ayağı yöntemiyle 1,5 cm eşikte 3,75–3,79 m/sn ölçtü. K7-9 ölçüm yöntemini karara bağladı; sabit referans değerleri Faz 7 ölçümünden önce uygulanmamalı.
- Öncelik ölçeği (kritik/yüksek/orta/düşük) denetçilerce görev tanımından çıkarıldı; alanlar arasındaki tutarsızlıklar karşı doğrulamayla kısmen giderildi (§6.1).
- 'Çalışıyor ancak geliştirilmeli', 'Hatalı veya kararsız', 'Eksik' ve 'Doğrulanmamış' sistem kategorileri ile 'kısmen'/'yok' gereksinim durumları denetçinin değerlendirmesidir; karşı doğrulamadan geçmedi.

**Kimlik çakışmaları**

- Faz 0 kimlikleri (A-01…K-20, \`<alan>-Mxx\`) eski 02_HATA_LISTESI kimlikleriyle (D-04, F-04, H07, B05 …) ve tasarım belgelerindeki karar numaralarıyla (K-1…K-14, FAZ2 D-10) çakışıyor. KNOWN_ISSUES.md bu yüzden yeni KI-xxx kimlikleri kullanıyor; 'Bilinen kimlik' alanı eski kimlikleri taşır. Belgelerde bir kimlik anılırken kaynağı (Faz 0, 02, tasarım) belirtilmeli.

**Ürün ve sürüm riskleri**

- Kritik ağ açıklarının çoğu canlı v0.3'te de var ('v0.3 ve v0.4'): canlı oyunun co-op odalarında kötü niyetli bir konuk ev sahibinin kaydını kalıcı bozabilir. Canlı dal bu fazda değiştirilmedi.
- v0.3 istemcileri v0.4 odalarına katılabiliyor (B-16: protokol kimliği iki sürümde de 'dksh-v1'); karışık sürümlü oturumlarda yeni iletiler sessizce işlenmiyor. v0.4/v0.5 yayımlanmadan önce sürüm reddi gerekiyor.
- Kayıt uyumluluğu: kayıt sürümü işlevsiz (D-05) ve v0.3 kayıtlarının v0.4'te yüklenmesini sınayan fikstür yok (K-M04). Aynı kökende v0.4'ten v0.3'e geri dönüş yeni alanları ilk kayıtta siliyor.
- Yayın: canlı dalın pages.yml'si 'claude/**' push'larında üretimi tetikliyor (K-02), test/PR kapısı ve dal koruması yok (K-04), aynı commit için iki yayıncı var (K-05), kök tek HTML v0.4 dalında v0.3 (K-01/A-01). Canlı daldan açılan her yeni \`claude/*\` dalı eski push kuralını devralıyor ve push'ta üretime yayın yapabilir (K-02); \`claude/v0.5-saglamlastirma\` v0.4'ün daraltılmış pages.yml'sini taşıdığı için onun push yolu kapalı, ancak workflow_dispatch herhangi bir daldan elle yayına izin veriyor (K-03). Bu riskler Faz 9'dan önce de geçerli.
- Kararsız ölçümler: 09_performans'taki Volkanik Dev 'dG 5' sonucunun sızıntı değil ölçüm kusuru olduğu Faz 8 tasarımında gösterildi (J-16, K8-7); test düzeltilene dek bu kontrolün sonucu güvenilir değil. 4 oyunculu co-op senaryosunda konuğun menüye düşmesi (#37) E/SYS2 doğrulamasında anılıyor.
- Zayıf test kanıtı: bazı kontroller iddia ettikleri mekanizmayı sınamıyor (K-13, H-M02, B-M07, K-M01, K-M02) ve 'sayfa hatası 0' ölçütü döngü istisnalarını görmüyor (K-11, K-M05). Bu maddeler düzeltilene dek 'GEÇTİ' sonuçları sınırlı güvenle okunmalı.`;

module.exports = {
  ALAN_FAZ, FAZ_AD, TEST_ADLARI, TEST_KISA, ONCELIK, DUZELTME, DOLAYLI, BELIRSIZ_NOT, MISSED_META, FAZ, EK_MADDELER,
  KUMELER, KISMI_TEKIL, KI_DISI, DURUM_NOT, FAZ7_BELGE, FAZ7_DOG, TASARIM_DOG, TAKMA, SYS_KARAR, UC_KARAR, tFaz, ONEMLI, V04_GIDERILEN, RISKLER,
};
