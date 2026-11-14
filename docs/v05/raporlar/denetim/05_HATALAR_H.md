# AUDIT_CURRENT §5 — Hatalar: H — Düşman AI, boss ve savaş

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — H — Düşman AI, boss ve savaş

### H-01 — Kraken dokunacının vuruş hedefi ucun gerisinde (R=38 m'de 8,8–16,9 m, R=30 m'de 6,1–14,2 m): güverteye inen dokunaç kılıçla çoğu durumda kesilemiyor (yüksek)

- **Dosya ve fonksiyon:** js/game/bosses.js — Kraken._updateTentacles (bosses.js:296-364); dokunaç hedefi Kraken.constructor (199-200)
- **Kök neden:** Hedef `if (k === TSEG - 6) ten.target.pos.copy(p).setY(p.y - 1)` (bosses.js:358) ile ikinci dereceden Bezier eğrisinin u=(k+1)/TSEG=13/18≈0,72 noktasına konuyor. Eğrinin tabanı Kraken merkezine 6 m uzakta ve Kraken gemiden 30–38 m uzakta duruyor (248-250). Bu yüzden hedef, ucun ~0,34×(taban–uç mesafesi) gerisinde, çoğunlukla küpeştenin dışında, suyun üstünde kalıyor. Yakın dövüş erimi 2,5 + 1,3 = 3,8 m (combat.js:198).
- **Oyuncuya etkisi:** Oyunun kendi yönergesi ('Dokunacı kes…', bosses.js:207, 228, 333) çoğu durumda uygulanamıyor. Evre 1'de baş derindeyken bağışık olduğu için (212) ilerlemenin tek yolu dokunaç kesmek; savaş tabanca ve topa kalıyor, 9 sn'lik kavrama kılıçla kırılamıyor. Kod geometrisinin salt-okur Node kopyası (/tmp/denetim_alan/kraken_hitbox.cjs) sonuçları: sloop ve R=38 m'de 1296 durumun yalnız 100'ünde (%7,7) hedefe güverteden ulaşılıyor, hedef ortalama 8,3 m dışarıda; brigantine ve R=30 m'de oran %31. [Doğrulama düzeltmesi] Uç ile hedef arasındaki yatay mesafe R=38'de 8,8–16,9 m (medyan 13 m), R=30'da 6,1–14,2 m; başlıktaki özgün '5–14 m' yalnız evre 3'e uyuyor, çünkü denetçinin betiği uca değil güverte kenarına olan mesafeyi ölçüyor. Kök neden, etki ve 'yüksek' öncelik doğru.
- **Öncelik:** yüksek · hedef faz: Faz 7
- **Önerilen çözüm:** Vuruş hedefini uca taşıyın (k=TSEG-1 ya da ucun 1 m gerisi) veya eğrinin son üçte birine 2–3 kapsül hedef koyun. 'stuck' ve 'grab' durumlarında hedefi güverte noktasına (deckPt + 1 m) sabitleyin. Konuk için hedef konumunu netExtra ile gönderin.
- **Tekrar üretme:** v03/boss1.js kurulumunu kullanın (DK.G.godMode=true, oyuncu güvertede) ve b=DK.bosses.spawn('kraken') çalıştırın. DK.sim ile bir dokunacın state'i 'stuck' olana dek ilerletin. t.target.pos ile G.ship.localToWorld(t.local) arasındaki yatay mesafeyi ölçün; R=38 m'de 8,8–16,9 m (medyan 13 m), R=30 m'de 6,1–14,2 m [doğrulama ölçümü]. Oyuncuyu iniş noktasına koyup DK.combat._attack(p,'light') ve DK.sim(0.5) çalıştırın: t.hp 220'de kalır.
- **Kabul testi:** Boss senaryosunda 20 rastgele ezmenin hepsinde 'stuck' veya 'grab' dokunacın hedefi güverte noktasına ≤1,5 m uzakta olmalı. İniş noktasında yapılan hafif saldırı t.hp'yi düşürmeli. Konukta da aynı sonuç alınmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: v0.4 bosses.js:358 `if (k === TSEG - 6) ten.target.pos.copy(p).setY(p.y - 1)` satırı hedefi ikinci dereceden Bezier eğrisinin u=13/18 noktasına koyuyor. Taban, Kraken merkezinden 6 m uzakta (301); kontrol noktası tabandan uca doğru %35'te ve 4 m yukarıda (345); Kraken gemiden R=38 m'de, evre 3'te R=30 m'de duruyor (248-250). Hedefin yatay konumu taban + 0,662×(uç−taban); yani hedef ucun 0,338×(taban–uç) gerisinde. Yakın dövüş erimi combat.js:198 `d > D.range + t.radius`: hafif saldırıda 2,5+1,3, ağır saldırıda 2,9+1,3; ağır saldırının alan etkisi (209-218) en çok ~4,6 m'ye ulaşıyor. Oyuncu güvertede ship.js:184-188 clampDeck ile (0,38 m pay) gövde çizgisinin içinde kalıyor. Güvertede atılım yok (player.js:522-524 yalnız karada çalışıyor); yüzerken ya da kayıktayken yakın dövüş yapılamıyor (combat.js:99). Bağımsız Node kopyası /tmp/denetim_alan/karsit_dusman/kraken_reach.cjs gerçek hullHalfWidth eğrisini, 36×12 yörünge ve taban açısını ve 25 iniş noktasını kullandı. Hafif/ağır saldırıyla hedefe erişim oranları: sloop R=38 %4,6/%7,7; brigantine R=38 %14,1/%17,9; sloop R=30 %16,1/%22,9; brigantine R=30 %27,3/%35,4. Dikey fark (hedef ~1,8 m, güverte 1,45 m) sorun değil; sorun yataydaki uzaklık. v0.3'te kod birebir aynı (bosses.js:351). Bu davranışı sınayan test yok: tests/scenarios/v03/boss1.js menzil denetimini atlayıp t.target.hurt(60,{}) çağırıyor. Tabanca (combat.js:254-256, 80 m'lik ışın) ve top (projectileTest 55-69, big:true hedef) dokunacı kesebiliyor; bu yüzden savaş kazanılabilir, ancak oyunun 'kılıçla kes' yönergesi (207, 228, 333) çoğu durumda uygulanamıyor. Düzeltme/ek: Sayısal düzeltme: R=38'de uç ile hedef arasındaki yatay mesafe 8,8–16,9 m (medyan 13 m), R=30'da 6,1–14,2 m. Başlıktaki '5–14 m' yalnız evre 3'e uyuyor; denetçinin betiği uca olan mesafeyi değil, güverte kenarına olan mesafeyi ölçüyor. Kök neden, etki ve 'yuksek' öncelik doğru. (uygulanan alanlar: başlık, oyuncuya etkisi, tekrar üretme) Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. kraken_hitbox.cjs: sloop R=38 m'de 1296 durumun 100'ünde (%7,7) erişilebilir, hedef ortalama 8,33 m dışarıda; brigantine R=30'da %31. Bilinen sorun: KI-028.

### H-02 — Taş Muhafız ve Volkanik Dev'in hasarı vuruş animasyonundan sonra geliyor (denetimde 0,4–0,7 sn; Faz 7 ölçümüyle 0,33–0,57 sn) (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — StoneGuardian.update / _go (bosses.js:712-756); VolcanicGiant.update / _go (857-894)
- **Kök neden:** Hasar sabit sürelerde uygulanıyor. Taş Muhafız: slam T=1,1/fast (Punch, hız 0,75), sweep 0,9/fast (Weapon, hız 0,8), stomp 1,4/fast (Jump, hız 0,4), kaya atışı 0,9/fast (Wave, hız 1,2). Volkanik Dev: sweep 1,0/fast (Weapon, hız 0,7), slam 1,2/fast (Jump, hız 0,45). orc_brute.glb ve demon.glb meshopt çözülerek ölçüldü (/tmp/denetim_alan/glb_peak.mjs): Punch ve Weapon'da kolun açısal hız tepesi klibin ~0,31. sn'sinde (klip 0,833 sn), Jump klibi toplam 0,333 sn, Wave'de kol tepesi 0,44 sn. Gerçek zamanda vuruş karesi ~0,39–0,45 sn'ye düşerken hasar 0,9–1,1 sn'de geliyor. Stomp ve slam hasarı Jump klibi bittikten 0,4–0,57 sn sonra geliyor; bu arada boss sıçrama pozunda donuk kalıyor.
- **Oyuncuya etkisi:** Görünen yumruğa ya da süpürmeye göre kaçınan oyuncunun 0,34 sn'lik dokunulmazlığı (player.js:495) vuruş gelmeden bitiyor ve oyuncu hasar alıyor. Halka doğru zamanı gösterse de animasyonla çelişiyor. 'Animasyon ile gerçek hasar anı tutarlı olmalı' hedefi karşılanmıyor. [Doğrulama düzeltmesi] Öncelik orta: telgraf halkası (bosses.js:597-604) tam hasar anında (T) doluyor, oyuncunun doğru bir zamanlama ipucu var ve savaşlar oynanabilir; aynı sınıftaki H-09 da 'orta'. Konukta sorun daha büyük: GiantBase.clientUpdate (623-631) klipleri 1,0 hızla oynatıyor ve konukta halka hiç çizilmiyor (H-M03, H-15). [Faz 7 tasarım doğrulaması — büyüklük düzeltmesi] İlk ölçüm kolun açısal hız tepesini (0,313 klip sn) vuruş karesi saymıştı; elin en ileri anına göre (inc_giant.mjs) Taş Muhafız yumruğunda (slam) fark +0,43 sn, süpürmede +0,33 sn; dev bosslarda fark 0,33–0,57 sn.
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 7
- **Önerilen çözüm:** Hasar zamanını klipteki vuruş karesine bağlayın (hitT = strikeClip/speed, değerler veri tablosunda), ya da klip hızını hasar zamanına göre ayarlayın. Stomp ve slam için Jump + Jump_Land dizisi kullanıp hasarı iniş anına koyun. Halka büyümesini aynı zamana eşitleyin.
- **Tekrar üretme:** b=DK.bosses.spawn('tas_muhafiz',{id:'tas_muhafiz',x:p.pos.x+6,z:p.pos.z}); b.atkT=99; b._go('slam'). Her karede b.st, b.anim.current.time ve p.hp kaydedin. p.hp b.st≈1,1'de düşüyor; Punch klibinin vuruş karesi (time≈0,31) ise b.st≈0,42'de geçiyor. Volkanik Dev için aynı adımları b._go('sweep') ile tekrarlayın.
- **Kabul testi:** Her dev boss saldırısında hasar karesi ile klip vuruş karesi arasındaki fark ≤0,1 sn olmalı; bu otomatik ölçümle doğrulanmalı. Slam ve stomp hasarı iniş klibinin temas karesine denk gelmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Süreler kodla birebir örtüşüyor. Taş Muhafız: slam T=1,1/fast (bosses.js:714-716), Punch hızı 0,75 (751); süpürme 0,9/fast (721-723), Weapon 0,8 (752); stomp 1,4/fast (728-730), Jump 0,4 (753); kaya atışı 0,9/fast (736), Wave 1,2 (754). Volkanik Dev: slam 1,2/fast (858-861), Jump 0,45 (890); süpürme 1,0/fast (877-879), Weapon 0,7 (891). orc_brute.glb ve demon.glb'yi meshopt ile bağımsız çözdüm (/tmp/denetim_alan/karsit_dusman/anim_peak.mjs, anim_curve.mjs). Sonuçlar: Punch 0,833 sn, UpperArm.R açısal hız tepesi 0,313 sn (kol en açık hâline 0,21–0,42 sn arasında ulaşıyor, 0,83 sn'de dinlenme pozunda); Weapon'da UpperArm.L tepesi 0,313 sn; Jump toplam 0,333 sn; Wave'de UpperArm.L tepesi 0,438 sn. Gerçek zamanlı gecikme, evre 1: slam 0,68 sn, Taş Muhafız süpürmesi 0,51, Volkanik Dev süpürmesi 0,55, stomp klip bitiminden 0,57, Volkanik Dev slam 0,46 sn (artı halkanın yayılma süresi). Evre 3 ve 2'de 0,37–0,51 sn. Kaçınma dokunulmazlığı 0,34 sn (player.js:495). v0.3'te kod aynı. Düzeltme/ek: Kök neden ve ölçümler doğru, ancak öncelik 'orta' olmalı. Telgraf halkası (bosses.js:597-604) tam hasar anında (T) doluyor; yani oyuncunun doğru bir zamanlama ipucu var ve savaşlar oynanabilir durumda. Aynı sınıftaki H-09'u (normal düşmanlar) denetçi de 'orta' saymış. Not: konukta sorun daha büyük, çünkü GiantBase.clientUpdate (623-631) klipleri 1,0 hızla oynatıyor ve konukta halka hiç çizilmiyor (kaçırılanlar listesinde ayrı madde). (uygulanan alanlar: başlık, oyuncuya etkisi, öncelik) Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru (düzeltmeyle). Büyüklük düzeltmesi: elin en ileri anına göre slam +0,43 sn, süpürme +0,33 sn (inc_giant.mjs); düzeltme başlığa ve Oyuncuya etkisi alanına uygulandı. Bilinen sorun: KI-091.

### H-03 — Konuktan gelen boss hasarı ve sersemletme ev sahibinde doğrulanmıyor: boss uzaktan, saniyeler içinde öldürülebiliyor (yüksek)

- **Dosya ve fonksiyon:** js/net/net.js — ev sahibi ileti işleyicisi case 'hurtBoss' ve 'stunEnemy' (net.js:288-289); bosses.init netHurtBossApply (bosses.js:1041-1046)
- **Kök neden:** hurtBoss yalnız dmg değerini 220'ye kırpıyor (DMG_MAX, net.js:45). Menzil kontrolü yok; konuğun gönderdiği 'kind' ve 'pos' doğrudan damageMul'e giriyor. Sonuçları: 'tentacle' ile Kraken başı derindeyken bile ×1 (bosses.js:211); 'cannon' ile Amiral'e 0,35 yerine ×1 (932); sahte pos ile Taş Muhafız'a arkadan ×2,2, Volkanik Dev'e önden ×2,2. 'ten' dizini doğrulanmıyor; ev sahibinde vurulamayan boştaki dokunaçlar da kabul ediliyor (1044). stunEnemy yalnız 8 m mesafeye bakıyor, gerçekten parry yapılıp yapılmadığını denetlemiyor. Oran sınırı 120 ileti/sn (net.js:43).
- **Oyuncuya etkisi:** Değiştirilmiş istemci kullanan bir konuk Kraken'i dünyanın herhangi bir yerinden ~1 sn'de öldürebilir (120×220 ≈ 26 400 hasar/sn). İnsan bossları sürekli sersemletebilir. Boss ödülü ve +600 XP herkese verilir. Ödül boss başına bir kez verildiği için kazanç sınırsız değil. 06a testi yalnız hurtEnemy'yi sınıyor. [Doğrulama düzeltmesi] (1) Volkanik Dev'deki ×2,2 yalnız çekirdek açıkken geçerli (exposed>0, yaylımdan sonraki 3,2 sn). (2) Lanetli Amiral hurtBoss ile en çok %50'ye indirilebilir: bordalamadan sonra damageMul=0 (932); kalan can Amiral düşmanı üzerinden hurtEnemy ile gidiyor ('bullet' türüyle 80 m'ye kadar). (3) v0.4 hurtBoss için 0–220 kırpmayı ve genel oran sınırını eklemiş; eksik olan mesafe, tür ve konum doğrulaması. (4) 8 m'lik sersemletme denetimi doğrulanmayan 'st' konum iletisiyle atlatılabiliyor (B-04). Kazanç boss başına bir kez olduğu için 'yüksek' doğru.
- **Öncelik:** yüksek · hedef faz: Faz 2
- **Önerilen çözüm:** hurtBoss için şunları ekleyin: konuk ile boss (ya da dokunaç hedefi) arası mesafe, silah menzili artı gecikme payını aşmasın; 'kind' beyaz listede olsun (melee/bullet; cannon ve explosion yalnız ev sahibi simülasyonundan gelsin); 'pos' yerine ev sahibindeki RemotePlayer.pos kullanılsın; 'ten' tamsayı olsun ve durumu idle veya gone olmasın; konuk başına saniyelik hasar bütçesi konsun. stunEnemy yalnız düşman o anda konuğa saldırırken ve vuruş penceresinde kabul edilsin.
- **Tekrar üretme:** Co-op'u iki oyuncuyla açın (tests/harness/coop.cjs); ev sahibi Kraken'i doğursun. Konuk 1 km uzaktayken konsoldan döngüyle DK.net.toHost({t:'hurtBoss', id:'kraken', dmg:220, kind:'tentacle'}) göndersin. Ev sahibinde DK.bosses.active.hp 1–2 sn'de 0'a iner ve DK.bosses.defeated.kraken true olur. Sersemletme için konuk DK.net.toHost({t:'stunEnemy', id:&lt;kizil_hancer id>, dur:3}) iletisini 0,5 sn'de bir göndersin: boss sürekli 'stunned' kalır.
- **Kabul testi:** coop/06a'ya eklenecek kontrollerin hepsi geçmeli: uzaktan gelen hurtBoss işlenmemeli; kind ve pos sahteciliği çarpanı değiştirmemeli; saniyedeki toplam hasar silah üst sınırını aşınca kırpılmalı; parry olmadan gelen stunEnemy yok sayılmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** H07 (02_HATA_LISTESI; v0.4'te hurtEnemy kısmı kapatıldı, hurtBoss için 0–220 kırpma ve genel oran sınırı eklendi, 03_DEGISIKLIK_LISTESI.md:62; eksik olan mesafe, tür ve konum doğrulaması) [doğrulama düzeltmesi]
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: v0.4 net.js:288 `case 'hurtBoss': G.emit('netHurtBossApply', { ...m, dmg: num(m.dmg, 0, DMG_MAX.hurtBoss), by: pid })` satırı konuğun konumunu, menzili, kind ve pos alanlarını denetlemiyor. bosses.js:1041-1046 m.kind ile m.pos'u doğrudan damageMul'e veriyor; m.ten için yalnız dizinin varlığına bakıyor. Bu yüzden 'idle' durumundaki boştaki dokunaç da kabul ediliyor (_hurtTentacle 217-218 yalnız 'gone' durumunu reddediyor). Sahte alanların etkisi: Kraken 211 'tentacle' → ×1; Amiral 932 'cannon' → ×1; Taş Muhafız 654-659 behindMul(info.pos) → ×2,2; Volkanik Dev 788-796 çekirdek açıkken önden ×2,2. net.js:289 stunEnemy yalnız 3B'de 8 m mesafeye bakıyor ve süreyi 0,2–3 sn'ye kırpıyor; enemies.js:448'de boss süresi ×0,6 = 1,8 sn, ileti 0,5 sn'de bir yinelenince boss sürekli sersem kalıyor. net.js:43 oran sınırı 120 ileti/sn, net.js:45 DMG_MAX 220. Tek konuklu oyunda Kraken'in canı 4500; 'tentacle' ile 21 ileti, yani ~0,2 sn yetiyor. Ödül bosses.js:1066-1075'te bir kez veriliyor; progress.js:77 herkese +600 XP veriyor. coop/06a_ag_guvenligi.cjs:47-58 yalnız hurtEnemy iletisini sınıyor. v0.3'te net.js:238 `G.emit('netHurtBossApply', m)` hiç kırpma yapmıyor (tek ileti bossu öldürmeye yetiyor); 239'daki stunEnemy'de mesafe denetimi ve süre sınırı yok. Yani açık v0.3'te daha ağır. Düzeltme/ek: Küçük düzeltmeler: (1) Volkanik Dev'deki ×2,2 yalnız çekirdek açıkken geçerli (exposed>0, yaylımdan sonraki 3,2 sn). (2) Lanetli Amiral hurtBoss ile en çok %50'ye indirilebilir: bordalamadan sonra damageMul=0 (932) ve kalan can Amiral düşmanı üzerinden, hurtEnemy ile gidiyor ('bullet' türüyle 80 m'ye kadar). (3) knownAs alanı: v0.4 hurtBoss için 0–220 kırpmayı ve genel oran sınırını eklemiş (03_DEGISIKLIK_LISTESI.md:62); eksik olan mesafe, tür ve konum doğrulaması. (4) 8 m'lik sersemletme denetimi, doğrulanmayan 'st' konum iletisiyle atlatılabiliyor (güvenlik alanında B-04). Aynı açık güvenlik alanında B-07 olarak 'kritik' verilmiş; görev tanımına göre kazanç boss başına bir kez olduğu için 'yuksek' doğru. (uygulanan alanlar: oyuncuya etkisi, bilinen kimlik) Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-007.

### H-04 — Uyarı halkası gerçek hasar alanından küçük: Kraken ezmesi (halka 2,45–2,8 m, hasar 3,4 m), Derinlik Yılanı dalışı (halka 4,5 m, hasar ~6,2 m) (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — Kraken._updateTentacles (bosses.js:318, 328); SeaSerpent.update case 'dive' (499, 506); enemies._impact (enemies.js:1440)
- **Kök neden:** İşaret ve hasar yarıçapları farklı sabitlerden geliyor. Kraken halkası 2,8×(0,5+0,5·min(1,st/2)); evre 3'te ezme st=1,5'te başladığı için 2,45 m. Halka ezme sırasında güncellenmediğinden gemi hareket ederse kayıyor. Hasar koşulu ise `p.pos.distanceTo(target) < 3.4`. Yılan'da halka ölçeği 4,5, hasar koşulu `distanceTo(tgt) < 6.5` (3B mesafe; güvertede ~6,2 m yatay). Yaylı atışlarda işaret aoe, hasar aoe+0,4; bu fark oyuncu yarıçapı kadar olduğu için kabul edilebilir.
- **Oyuncuya etkisi:** Halkanın dışında duran oyuncu 22 hasar ve 6–7 birimlik geri itme alıyor. Oyuncu uyarıya uyduğu halde vuruluyor; 'kaçınılan saldırı sebepsiz hasar vermemeli' hedefi ihlal ediliyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Her saldırı için tek bir yarıçap sabiti kullanın ve işaret ölçeğini hasar yarıçapına eşitleyin. Mesafeyi yatay (2B) hesaplayın. Ezme sırasında işareti güverte noktasıyla birlikte güncelleyin.
- **Tekrar üretme:** Kraken: dokunaç 'rise' durumundayken oyuncuyu güverte noktasından 3,1 m uzağa, halkanın dışına koyun; ezmede p.hp 22 düşer. Yılan: b.mode='dive' ve b.mt=0 yapın, oyuncuyu hedef noktadan 5,5 m uzağa (4,5 m'lik halkanın dışına) koyup DK.sim(2.3) çalıştırın; 22 hasar gelir.
- **Kabul testi:** Kraken ezme ve kavraması, Yılan dalışı ve tüm lob türleri için test: halka yarıçapının 0,2 m dışındaki oyuncu hasar almamalı, 0,3 m içindeki almalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod: bosses.js:318 (2,8 × büyüme), :328 (&lt; 3,4, 3B); :499 (4,5), :506 (&lt; 6,5, 3B). Denetçi güveni: yüksek. Bilinen sorun: KI-092.

### H-05 — Kaçınılan ya da engellenen saldırının yan etkileri yine uygulanıyor (Boğulmuş Denizci yavaşlatması, düşman ve boss geri itmesi) (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._hitPlayer (enemies.js:1000-1008); bosses.js hitPlayer (bosses.js:42-46); konuktaki 'hurt' işleyicisi (net.js:536-539)
- **Kök neden:** Player.hurt (player.js:142-191) sonuç döndürmüyor; çağıranlar etkileri koşulsuz uyguluyor. Yakalamadaki `G.player.slowT = 2.2` (enemies.js:1005) kaçınma, parry ve blokta da çalışıyor. Düşman geri itmesi yalnız `!G.player.blocking` ile korunuyor; kaçınmada blocking=false olduğu için (player.js:496) oyuncu itiliyor (1007). Boss hitPlayer geri itmeyi her çağrıda yazıyor (bosses.js:45); bloklanan süpürmede blok yolunun azalttığı itmenin üstüne tam itme (9–11) yazılıyor. Konukta m.kb koşulsuz uygulanıyor (net.js:538).
- **Oyuncuya etkisi:** Kusursuz kaçınma ya da parry sonrasında bile 'Boğulmuş denizci seni yakaladı — yavaşladın!' mesajı geliyor ve oyuncu 2,2 sn %45 yavaşlıyor. Kaçınılan boss saldırısı oyuncuyu 6–11 m/sn fırlatabiliyor (uçurum ya da lav kenarında tehlikeli). Bloklanan süpürmede tam geri itme uygulanıyor. Yavaşlatma kısmı yalnız v0.4'te görülüyor; v0.3'te slowT hiç okunmuyordu (ek-137).
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Player.hurt 'dodged', 'parried', 'blocked' ya da 'hit' döndürsün. slowT, knock ve poison yalnız 'hit' sonucunda uygulansın; blokta yalnız azaltılmış itme kalsın. Konuğa giden 'hurt' iletisine grab ve poison alanları eklensin; konuk bunları kendi sonucuna göre uygulasın.
- **Tekrar üretme:** e=DK.enemies.spawn('hayalet_bogulmus', p.pos.x+1.5, p.pos.z); e.awareness=1; e.target=e._targetInfo(p, DK.G.myId); e._setState('chase'). Durum 'attack' olunca vuruş anından hemen önce p.invuln=0.34 yapın: p.hp değişmez, ama p.slowT≈2.2 olur ve bildirim çıkar. Taş Muhafız slam'inde p.invuln>0 iken de p.hp aynı kalır, p.knock ise ≈8 olur.
- **Kabul testi:** invuln ya da parry durumunda hp, slowT ve knock değişmemeli. Blokta knock azaltılmış değerde kalmalı. Konukta da aynı davranış co-op testiyle doğrulanmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. enemies.js:1004-1007, bosses.js:45, player.js:144-147. Denetçi güveni: yüksek. Bilinen sorun: KI-093.

### H-06 — Saldırgan hayvanların ısırığı uyarısız ve bloklanamıyor; hasar animasyondan önce, görüş hattı ve yön kontrolü olmadan geliyor (orta)

- **Dosya ve fonksiyon:** js/wildlife/animals.js — Animal.update case 'attack' (animals.js:499-515); Animal._walk (556-569); Animal._pose ısırık klipleri (638, 645, 654, 698)
- **Kök neden:** Hayvan menzile girip atkCd≤0 olduğu karede `G.player.hurt(dmg, this.pos, { cause, poison })` çağrılıyor; ısırık animasyonu da ancak o anda başlıyor (bite=0,35). 'melee' ve 'attacker' iletilmediği için player.hurt'ün blok/parry dalı (player.js:149) hiç çalışmıyor. Mesafe 3B ölçülüyor; yön ve görüş hattı kontrolü yok. Konuğa giden iletide zehir alanı yok (508). _walk'ta takılma ya da sapma mantığı yok.
- **Oyuncuya etkisi:** Kurt, kutup ayısı, yeti, timsah, dev yengeç, domuz, geyik ve yılan saldırıları savunmayla azaltılamıyor. Hasar, görünen vuruştan ~0,2–0,3 sn önce geliyor (kurt Attack klibinde ön bacak tepesi 0,23 sn, yeti Punch'ta 0,31 sn). Çit ya da duvar ardından ısırık mümkün. Yılan konuğu zehirlemiyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** 0,3–0,5 sn hazırlık ekleyin: animasyon başlasın, hasar klibin vuruş karesinde gelsin. hurt çağrısına `{ melee: true, attacker: this }` geçirin ve parry'de hayvanı kısa süre sersemletin. physics.lineBlocked ile görüş hattı kontrolü yapın. netHurtPlayer'a poison ekleyin. Enemy._move'daki gibi takılma sapması ekleyin.
- **Tekrar üretme:** Kurt Adası'na ışınlanın ya da DK.animals.list'ten bir kurt seçin. Oyuncu kılıçla, yüzü kurda dönük şekilde savunma yapsın (sağ tık). Her ısırıkta p.hp 16 düşer ve düşüş, a.bite=0,35 olduğu kareyle aynı karede olur.
- **Kabul testi:** Isırık hasarı saldırı başlangıcından en az 0,3 sn sonra gelmeli. Önden blok hasarı %12'ye indirmeli, parry hasarsız olmalı. 1 m'lik duvarın ardından ısırık olmamalı. Yılan ısırığı konuğu da zehirlemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. animals.js:503-508 (melee/attacker yok, ısırık aynı karede). Denetçi güveni: yüksek. Bilinen sorun: KI-094.

### H-07 — Hayalet Nişancı'nın güdümlü küresi kaçınmadan sonra geri dönüp vurabiliyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies._updateShots (enemies.js:1483-1486, 1506)
- **Kök neden:** Güdüm (`s.vel.lerp(want, dt·homingK)`) merminin 4 sn'lik ömrü boyunca, hedefi geçse bile sürüyor. Kaçınma dokunulmazlığında mermi yok edilmiyor, içinden geçiriliyor (`s.dead = false; continue`).
- **Oyuncuya etkisi:** Kaçınma yalnız vuruşu erteliyor; kaçınılmış saldırıdan 30 hasar (gece ×1,18–1,35) gelebiliyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Mermi hedefi geçince (dot(vel, hedef−konum) &lt; 0) ya da kaçınma sırasında güdümü kapatın; dönüş hızını sınırlayın; ömrü 2 sn'ye indirin.
- **Tekrar üretme:** Gece (DK.sky.hour=23) hayalet_nisanci'yi 12 m'ye doğurup hedef verin. Küre 1 m'ye yaklaşınca p.invuln=0.34 yapın ve oyuncuyu 3 m yana taşıyın. DK.sim(2) çalıştırın: küre geri döner ve p.hp düşer.
- **Kabul testi:** Dokunulmazlık sırasında oyuncunun 1 m yakınından geçen küre sonradan hasar vermemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi: 'Hayalet mermisi (ghostbolt) kaçınmayı boşa çıkarıyor'
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. enemies.js:1483-1486 güdüm sürüyor; :1506 kaçınmada mermi yok olmuyor. Denetçi güveni: yüksek. Bilinen sorun: KI-095.

### H-08 — Yakın dövüş ve alan saldırıları duvarın ya da kayanın arkasına geçiyor (düşmandan oyuncuya ve oyuncudan düşmana) (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._resolveMelee (enemies.js:979-998); GiantBase.aoe (bosses.js:606-619); enemies._impact (enemies.js:1431-1455); combat._meleeHit (combat.js:188-232)
- **Kök neden:** Vuruş testleri yalnız mesafe, açı ve yükseklik farkına bakıyor; saldıran ile hedef arasında physics.lineBlocked çağrılmıyor. _reachable (863-869) duvarı dikkate almıyor; bu yüzden düşman ince bir duvara dayanıp erim içinde (range+0,6) saldırıya başlıyor.
- **Oyuncuya etkisi:** 0,3–0,5 m'lik duvar, çit ya da kapının ardındaki oyuncu vurulabiliyor; oyuncu da duvarın ardındaki düşmanı vurabiliyor. Boss alan saldırıları tapınak duvarlarından geçiyor. 'Engeller' hedefine aykırı.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** hitOne, aoe, _impact ve _meleeHit içine göğüs yüksekliğinde `!physics.lineBlocked(..., { rScale: 1 })` koşulu ekleyin. Düşman tarafında saldırıyı başlatmadan önce aynı kontrolü yapın.
- **Tekrar üretme:** 05 senaryosundaki duvar kurulumunu 0,3 m kalınlıkla tekrarlayın: ph.addBox(p.pos.x, p.pos.z+1.0, 4, 0.15, 0, -50, 100, 'test:w'). Bir haydut'u duvarın öbür yanına (z+1.8) koyun; awareness=1, durum chase. DK.sim(3) çalıştırın: p.hp düşer.
- **Kabul testi:** Arada 0,3 m'lik duvar varken düşmanın yakın dövüşü, alan hasarı ve oyuncunun yakın dövüşü isabet etmemeli; duvar kaldırılınca etmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. enemies.js:979-998, bosses.js:606-619, enemies.js:1431-1455 ve combat.js:188-232'de görüş hattı yok. Denetçi güveni: yüksek. Bilinen sorun: KI-096.

### H-09 — Düşman hamlelerinde hasar anı animasyonun vuruş karesiyle uyuşmuyor (kesme/doğrama hamleleri 0,13–0,21 sn, DASH 0,33 sn geç; çift bıçak kesiği erken); sersemlik ve insan çağırmasında donuk poz (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — MOVES tablosu (enemies.js:24-55); Enemy._startMelee (901-925); stun (446-456); _act case 'summon' (777-789)
- **Kök neden:** hitAt·speed değerleri klipteki vuruş karesine göre ayarlanmamış. kk_anims.glb'de vuran kolun açısal hız tepesiyle ölçüldü (/tmp/denetim_alan/glb_peak.mjs); değerler klip saniyesi olarak hasar ↔ vuruş karesi biçiminde: AtkStab 0,78 ↔ 0,38 (gerçek zamanda ~0,30 sn geç); Stab2H 0,74 ↔ 0,38 (~0,30 sn geç); DualStab 0,77 ↔ 0,38 (~0,28 sn geç); Atk2 0,51 ↔ 0,25 (~0,22 sn geç); Heavy2H 0,94 ↔ 0,78 (~0,2 sn geç); Punch2 0,65 ↔ 0,38–0,48 (~0,14–0,22 sn geç); DualSlice 0,50 ↔ 0,58–0,78 (0,07–0,22 sn erken). Atk1, Atk3 ve kalkan setleri ±0,1 sn içinde. Ayrıca sersemlik 1,0–1,7 sn sürerken Hit_B klibi 0,96 sn; insan çağırması 2,2 sn sürerken Taunt klibi 1,03 sn. Bu yüzden klip sonunda poz donuyor. [Faz 7 tasarım doğrulaması — kısmen doğru] Ölçüm iki bilekten büyüğünün hız tepesini aldığı için bazı hamlelerde sol bilek, tekmede bilek ölçülmüş. Sınıfa göre ölçümde (silah eli, uç ve en ileri erişim; inc_strike.mjs) gerçek gecikmeler: Atk2 +0,21, Atk2H +0,15, Heavy2H +0,14, Punch2 +0,13 sn, DASH +0,33 sn ve ardından 0,33 sn donma, kalkanlı Atk1 +0,07; sınırdakiler baltalı Atk1 +0,06, Kick +0,06, DualChop +0,02…+0,07; DualSlice −0,06…−0,21 (erken). AtkStab, Stab2H ve DualStab'daki ~0,3 sn gecikme ölçüm yapıntısı: en ileri erişim hitAt ile örtüşüyor (+0,01 / −0,02 / 0,00).
- **Oyuncuya etkisi:** Görsel kesme ya da doğrama hamlesine göre parry yapan oyuncu [Faz 7 düzeltmesi: bıçaklamalarda gecikme yok] (pencere 0,24 sn) normal blok ya da hasar alıyor; kaçınma zamanlaması animasyonla çelişiyor. Donuk pozlar düşmanın takıldığı izlenimini veriyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Her hamleye klipteki vuruş karesini (strikeClip) ekleyin ve hitAt = strikeClip/speed olarak hesaplayın. Sersemlik ve çağırma sürelerini klip uzunluğuna eşitleyin ya da bitince IdleCombat'a dönün.
- **Tekrar üretme:** Math.random'ı sabitleyerek bir haydut'a AtkStab (MOVES.sword1h[3]) hamlesini seçtirin. Her karede klip zamanını (e.char.current.time) ve hasar karesini kaydedin: hasar klibin ~0,78. sn'sinde geliyor, kol tepesi ise ~0,38. sn'de.
- **Kabul testi:** Tüm MOVES girdilerinde |hitAt·speed − strikeClip| ≤ 0,06 sn (klip zamanı) olmalı. Sersemlik ve çağırma sırasında 0,2 sn'den uzun donuk poz olmamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi: 'Bazı saldırı durumları klipten uzun sürüyor' (yalnız DASH/çağırma kısmı)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): kısmen doğru. Kesme/doğrama gecikmeleri doğru, dürtmelerdeki gecikme ölçüm yapıntısı (inc_strike.mjs); düzeltme başlığa, Kök neden ve Oyuncuya etkisi alanlarına uygulandı. Denetçi güveni: orta. Bilinen sorun: KI-097.

### H-10 — Hayalet Kaptan'ın hamle (DASH) saldırısı hiç tetiklenmiyor; verisi de animasyonla uyumsuz (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._startMelee (enemies.js:901-925); çağrı yerleri _meleeOrStrafe (887, 897) ve _attackUpdate (971)
- **Kök neden:** DASH koşulu `T.dash && d > 4 && d < 10` (905). Oysa _startMelee yalnız d ≤ range+0,3 (887), d &lt; range+0,7 (897; yalnız kuşatmacılar) ya da d &lt; range+0,5 (971) iken çağrılıyor; Hayalet Kaptan için bu en çok 3,0 m demek. Koşul hiçbir zaman doğru olmuyor. Ayrıca DASH verisi Atk3 klibini (1H_Melee_Attack_Chop, 1,067 sn) dur 1,4 ve hitAt 0,9 ile kullanıyor: klibin vuruş karesi ~0,55–0,62 sn, atılma 0,5–1,05 sn arasında yani vuruştan sonra, sonda da 0,33 sn donma var.
- **Oyuncuya etkisi:** docs/05 §5.1'deki '9 m atılma, savuşturulamaz' kaptan hamlesi oyunda yok; boss beklenenden tekdüze. Koşul düzeltilirse animasyon, hasar ve hareket uyumsuzluğu ortaya çıkacak.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Kovalama dalında 4&lt;d&lt;10 ve görüş hattı varken DASH'ı yaklaşmadan önce başlatın. Atılmayı hazırlık sırasında yapın; hasarı 2H hamle klibinin vuruş karesine bağlayın; dur = klip/hız yapın.
- **Tekrar üretme:** e=DK.enemies.spawn('hayalet_kaptan', p.pos.x+6, p.pos.z) ile 60 sn benzetim yapın; e._startMelee'yi sarmalayıp e.move===DASH sayacı tutun: sayaç 0 kalır. Statik olarak da üç çağrı yerinde d ≤ 3,0.
- **Kabul testi:** 5–9 m mesafede 60 sn'lik savaşta en az bir DASH görülmeli; hasar karesi klipteki vuruş karesiyle ±0,1 sn uyuşmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi (DASH klip süresi); tetiklenmediği bu denetimde yeni tespit edildi
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). H/DOC2 karşı doğrulaması belgelenen Kaptan hamlesinin (9 m atılma) oyunda gerçekleşmediğini doğruladı. Denetçi güveni: kesin. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Tarayıcı ölçümü M6: 30 sn'de 13 yakın saldırı başlangıcı, 0 DASH, en küçük başlama uzaklığı 2,39 m. Bilinen sorun: KI-098.

### H-11 — Nişancının siperi kendi görüş hattını kapatıyor: siperden ateş etmiyor, 2,5 sn sonra hedefi kaybedip araştırmaya çıkıyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies.findCover (enemies.js:1388-1405); Enemy._act case 'cover' (817-837); Enemy._think kayıp mantığı (679-683)
- **Kök neden:** Siper noktası çarpıştırıcının tam arkasında, hedefle aynı doğru üzerinde seçiliyor (1397). Bu yüzden _los (1011-1018) yanlış dönüyor ve menzilli atış koşulu (828) sağlanmıyor. _perceive de engellendiği için lostT birikiyor ve 2,5 sn sonra durum 'investigate'e geçiyor. Siperden 'göz atıp ateş etme' davranışı yok. Atıştan sonra %50 olasılıkla eski siper noktasına dönüyor (1049-1050).
- **Oyuncuya etkisi:** haydut_nisanci siper bulduğunda pasifleşip dolaşıyor; 'siper' hedefi fiilen işlemiyor. findCover ayrıca tüm physics.all dizisini 6 Hz ile tarıyor (performans yükü).
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Siper noktasını çarpıştırıcının yanına (yanal r+0,6) koyup ayrı bir 'göz atma' noktası tanımlayın. cover durumunda saklan / çık-ateş et döngüsü kurun. Yakın zamanda görülmüş hedef için siperdeyken lostT saymayın. Aramayı physics.cells ile sınırlayın.
- **Tekrar üretme:** ph.addCircle(p.pos.x, p.pos.z+10, 1) ile bir engel koyun. Nişancıyı (p.pos.x, p.pos.z+12) noktasına yerleştirin; awareness=1, hedef oyuncu, durum chase. DK.sim(4) çalıştırın: durum 'cover' olur, DK.enemies.shots artmaz, ~2,5 sn sonra durum 'investigate'e döner.
- **Kabul testi:** Oyuncu açıkta durdukça siperdeki nişancı en geç reloadT·1,5 sn'de bir ateş etmeli ve 'investigate'e geçmemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Tarayıcı ölçümü M4: 8 sn'de 1 atış; ~1,3. sn'de 'cover', ~4,0. sn'de 'investigate'. Denetçi güveni: yüksek. Bilinen sorun: KI-099.

### H-12 — Kovalayan düşman görüş kesildikten sonra 2,5–6 sn boyunca oyuncunun canlı konumunu izliyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._meleeOrStrafe (enemies.js:884-895); _act menzilli dal (838-852); _think (679-683)
- **Kök neden:** Kovalama ve kuşatma hedefi ile bakış yönü `tgt.pos` (oyuncunun canlı konum vektörü) üzerinden hesaplanıyor. Oyuncu görülmediğinde lastKnown'a geçilmiyor. Kayıp eşiği 2,5 sn, 6 m içinde 6 sn.
- **Oyuncuya etkisi:** Köşe dönüp saklanan oyuncuyu düşman duvar arkasından kusursuz izliyor. 'Oyuncuyu kaybetme' gecikmeli ve düşman fiilen her şeyi biliyor; gizlilik oynanışı zayıflıyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** seen=null iken hedef noktası olarak lastKnown kullanın ve yüzü son görülen yöne çevirin. İsterseniz ≤0,5 sn'lik kısa bir hız tahmini ekleyin.
- **Tekrar üretme:** Bir haydut oyuncuyu kovalarken oyuncu bir kutunun ardına geçip 8 m yana gitsin. Her karede düşmanın hareket hedefini kaydedin: lostT 2,5'i geçene kadar düşman oyuncunun güncel konumuna yöneliyor.
- **Kabul testi:** Görüş kesildikten sonra düşman önce son görülen noktaya (≤1 m) gitmeli, aramaya ancak orada başlamalı; duvar arkasındaki yeni konuma doğrudan yönelmemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Tarayıcı ölçümü M3b: görüş 2 sn kesikken 120/120 adımda yeni (canlı) konuma, 0 adımda son görülen noktaya yöneldi. Denetçi güveni: yüksek. Bilinen sorun: KI-100.

### H-13 — Konuk oyuncuların algı değiştiricileri (meşale, eğilme, mağara, su altı, saldırı) ev sahibi AI'sına ulaşmıyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js — RemotePlayer.update (net.js:74-108); Player.netState (player.js:986-992); Enemy._perceive (enemies.js:532-574)
- **Kök neden:** netState torch alanını gönderiyor ama RemotePlayer.update onu kopyalamıyor. crouch, inCave, underwater ve action hiç gönderilmiyor. _perceive ise bu alanları okuyor (543-560).
- **Oyuncuya etkisi:** Konuk eğilerek gizlenemiyor, mağarada görünmez olmuyor; su altında görünürlüğü 0,15 yerine 0,6 sayılıyor. Gece meşalesi olsa bile ×0,5 cezası alıyor; saldırırken fark edilme ×2'si uygulanmıyor. Sonuçta ev sahibi ve konuk farklı bir AI ile karşılaşıyor.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** netState'e crouch, inCave, underwater ve aksiyon türünü ekleyin; RemotePlayer.update'te torch dahil hepsini kopyalayın. Testte konuk ile yerel oyuncunun farkındalık artış hızlarını karşılaştırın.
- **Tekrar üretme:** Co-op'ta konuk gece meşaleyle eğilerek bir nöbetçinin 10 m önüne gelsin. Ev sahibinde [...DK.G.remotes.values()][0].crouch ve .torch undefined çıkar; düşmanın farkındalığı ayaktaki oyuncudaki hızla artar.
- **Kabul testi:** Eğilen konukta farkındalık artış hızı, eğilen yerel oyuncudakinin ±%10 içinde olmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi: 'Uzak oyuncuların algı değiştiricileri eşitlenmiyor'
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). H/REQ4 karşı doğrulaması co-op'ta konuk için görüş mesafesi değiştiricilerinin uygulanmadığını (H-13) doğruladı. Denetçi güveni: kesin. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. net.js:87-124 crouch/torch/inCave/underwater/action alanlarını kopyalamıyor. Bilinen sorun: KI-101.

### H-14 — F-04: konuk vuruşlarında blok, kaçınma ve dokunulmazlık kararı asimetrik (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy.hurt (enemies.js:340-365); Enemy.hear (577-594) ve 'noise' dinleyicisi (1302); net.js case 'hurtEnemy' (278-287)
- **Kök neden:** Konukta hurt() önce _canBlock ve _dodge'u konuğun yerel durumuyla çalıştırıyor; bu durum anlık görüntüyle güncellenmiyor, yerel hear() ile değişiyor. Bloklanan vuruş ev sahibine hiç gönderilmiyor. Ev sahibi ise 'hurtEnemy'yi doğrudan applyDamage ile uyguluyor; böylece kalkış (rise) ve faz (phased) dokunulmazlığı, kalkan ve kaçınma atlanıyor.
- **Oyuncuya etkisi:** Konuğun vuruşları rastgele kayboluyor ya da hayaletin faz dokunulmazlığını, iskeletin kalkışını ve kalkanları deliyor. Ev sahibi ile konuk farklı bir savaş yaşıyor.
- **Öncelik:** orta · hedef faz: Faz 2
- **Önerilen çözüm:** Konuktaki blok ve kaçınma kararını kaldırın (yalnız yerel efekt kalsın) ve her vuruşu gönderin. Ev sahibinde hurt() kullanıp sonucu ('blocked', 'dodged' ya da 'hit') konuğa geri bildirin. hear() yalnız ev sahibinde çalışsın.
- **Tekrar üretme:** 02_HATA_LISTESI F-04'teki adımlar: konuk sayfasında G.online=true, G.isHost=false; haydut_agir anlık görüntüsünü uygulayın, 'noise' yayınlayın, Math.random=()=>0 yapın. e.hurt(10,{kind:'melee',pos:p.pos,by:G.myId}) 'blocked' döner ve netHurtEnemy gönderilmez.
- **Kabul testi:** Co-op testinde konuğun 20 vuruşunda ev sahibindeki blok, kaçınma ve dokunulmazlık oranı yerel oyuncununkiyle aynı dağılımda olmalı. Fazdaki hayalete konuğun verdiği hasar 0 olmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** F-04 (02_HATA_LISTESI; v0.4 değişiklik listesinde kapatılmadı)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). B/DOC2 karşı doğrulaması F-04'ün ele alınmadığını doğruladı: ev sahibi hâlâ applyDamage çağırıyor (net.js:285), blok/kaçınma konukta (enemies.js:343-357). Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-102.

### H-15 — Konukta saldırı uyarıları ve boss ipuçları yok: halkalar, iniş işaretleri, Volkanik Dev'in ateş halkası, lav havuzları, duman, evre ve zayıf nokta bildirimleri (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — GiantBase.clientUpdate (bosses.js:623-631); VolcanicGiant ateş halkası (861-872); Kraken.clientUpdate (371-384); SeaSerpent.clientUpdate (550-555); enemies.js _telegraph (928-939), lob (1416-1430), _updatePools (1456-1475), _smokeBomb (501-511), boss çubuğu (1617-1618)
- **Kök neden:** Uyarı nesneleri ve G.notify çağrıları yalnız ev sahibinin simülasyon yollarında üretiliyor. netExtra yalnız konum, yön, animasyon ve durum taşıyor. Anlık görüntüde telgraf, iniş işareti, ateş halkası ve havuz bilgisi yok. İnsan boss çubuğu konuğun yerel e.state değerine bağlı ve bu değer anlık görüntüyle güncellenmiyor.
- **Oyuncuya etkisi:** Konuk savuşturulamaz saldırıları ve lav topu inişlerini görmeden yiyor. Zıplayarak kaçması gereken ateş halkasını göremiyor, görünmeyen lav havuzunda yanıyor (0,5 sn'de 7 hasar). 'Çekirdek açıldı — önden vur' gibi ipuçlarını kaçırıyor.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Ev sahibi aktif telgrafları ([x, z, r, ilerleme, renk]), lob işaretlerini, ateş halkası yarıçapını ve havuzları anlık görüntüye eklesin; boss bildirimlerini yayınlasın. Konuktaki clientUpdate bunları çizsin. İnsan boss çubuğu için durum bayrağı gönderilsin.
- **Tekrar üretme:** Co-op'u iki oyuncuyla açın. Ev sahibinde Volkanik Dev'i doğurup b._go('slam') çalıştırın. Konuk sekmesinde DK.bosses.active.wave.visible ve ringA.visible her an false kalıyor; konuk dalga anında hasar alıyor.
- **Kabul testi:** Her telgraf ve işaret konukta ev sahibine göre en çok 0,15 sn farkla görünmeli. Co-op testinde konuk ateş halkasını görüp zıplayarak kaçabilmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11_BILINEN_SORUNLAR #15 (F-06'nın ikinci yarısı; orada 'düşük' önemde); 02 F_dusman önerileri (konukta hasar sayıları, boss çubuğu)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). H-02 karşı doğrulaması konukta telgraf halkasının hiç çizilmediğini doğruladı. İniş işaretleri, ateş halkası, lav havuzları, duman ve bildirimler ayrıca sınanmadı. Denetçi güveni: kesin. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-103.

### H-16 — Taş Muhafız'ın rün sütunları konukta oluşmuyor; konuk görünmez bir %80 hasar direnciyle savaşıyor (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — StoneGuardian.onPhase (bosses.js:660-683); GiantBase.netExtra (622)
- **Kök neden:** Sütunlar yalnız ev sahibinde, applyDamage→onPhase içinde yaratılıyor. netExtra ve applyNetExtra sütun durumunu taşımıyor. damageMul'deki ×0,2 konuğun vuruşlarına da uygulanıyor.
- **Oyuncuya etkisi:** Konuk sütunları göremiyor ve vuramıyor; neden hasar veremediğini anlamıyor.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** netExtra'ya sütun dizisi ([x, z, alive]) ekleyin. Konukta sütun nesnelerini ve hedeflerini oluşturun. Sütuna verilen hasar netHurtBoss ile, sütun indeksiyle birlikte ev sahibine gitsin.
- **Tekrar üretme:** Co-op'ta ev sahibinde b=DK.bosses.spawn('tas_muhafiz', ...) ve b.applyDamage(b.maxHp*0.5,{}) çalıştırın. Konukta DK.bosses.active.pillars.length 0 çıkar.
- **Kabul testi:** Konukta 3 sütun görünmeli ve vurulabilmeli; sütunlar kırılınca kalkan iki tarafta da kalkmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11_BILINEN_SORUNLAR #14 / ek-108 / F_dusman-ek-statik-135
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: kesin. Bilinen sorun: KI-104.

### H-17 — Co-op'ta bazı savaş etkileri konuklara uygulanmıyor (tükürük zehri, yılan zehri, gülle/patlama hasarı, yakalama, düşman yakın dövüşünün geri itmesi) (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies._impact (enemies.js:1443); Enemy._hitPlayer (1005-1007); combat.js 'explosion' dinleyicisi (combat.js:44-54); animals.js:508; net.js:150
- **Kök neden:** Zehir ve yavaşlatma yalnız G.myId için uygulanıyor. netHurtPlayer iletisi poison ve slow alanlarını, düşman yakın dövüşünde de geri itmeyi taşımıyor. Patlama hasarı yalnız yerel oyuncuya uygulanıyor, G.remotes taranmıyor. Konukta gülleler yalnız görsel olduğu için patlama hiç üretilmiyor.
- **Oyuncuya etkisi:** Konuk Derinlik Yılanı'nın zehrinden, yılan ısırığının zehrinden, düşman topçusunun karaya düşen gülle patlamalarından ve Boğulmuş Denizci'nin yakalamasından etkilenmiyor; ev sahibi etkileniyor. Zorluk iki oyuncu için eşit değil.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** netHurtPlayer'a poison, slow ve kb alanlarını ekleyin. explosion dinleyicisinde ev sahibi G.remotes için mesafe kontrolü yapıp netHurtPlayer yayınlasın.
- **Tekrar üretme:** Co-op'ta konuğu Yılan tükürüğünün iniş noktasına koyun: konukta p.poison 0 kalır. Ev sahibi ile konuğun yanına top güllesi düşürün (patlama yarıçapı 3,5 m): yalnız ev sahibi hasar alır.
- **Kabul testi:** Co-op testinde aynı saldırıda ev sahibi ve konuk aynı hasarı, zehri ve yavaşlatmayı almalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** F_dusman-ek-statik-138, F_dusman-ek-statik-139 (02_HATA_LISTESI, doğrulanmamış ek bulgular)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). E alanının denetçisi aynı kusuru bağımsız olarak buldu (E-18); E/UC5 doğrulaması konukta güllelerin yalnız görsel olduğunu doğruladı. Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-076.

### H-18 — Hikâye bossları (Morvan, Kızıl Hançer) her istemcide yerel konuma göre tetikleniyor; kayıttan sonra doğuş bayrağı takılı kalıyor (orta)

- **Dosya ve fonksiyon:** js/game/quests.js — quests.update hikâye tetikleyicileri (quests.js:276-292); quests.start (76-79)
- **Kök neden:** quests.update'te isHost kontrolü yok. Konuk mezara yaklaşınca enemies.spawnBoss yerelde çalışıyor ve bir sonraki anlık görüntü bu yerel kopyayı siliyor (enemies.js:1658); boss yalnız ev sahibi 45/50 m içindeyse var oluyor. morvanSpawn ve kizilSpawn bayrakları kayda yazılıp aynen geri yükleniyor. Otomatik kayıt 120 sn'de bir, savaş kontrolü olmadan alınıyor (game.js:218); dövüş sırasında alınan kayıt boss yokken yüklenince boss, oyuncu 200 m uzaklaşıp geri dönmedikçe yeniden doğmuyor.
- **Oyuncuya etkisi:** Konuk 'Morvan uyandı' mesajıyla birlikte anında kaybolan bir iskelet görüyor. Tek oyunculu modda kayıt yükleyen oyuncu mezarda boss bulamıyor ve hikâyenin ilerlemediğini sanıyor.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** Hikâye bossu tetiklemesini ev sahibine taşıyın ve konukların konumunu da hesaba katın. *Spawn bayraklarını kaydetmeyin ya da yüklemede boss listede yoksa sıfırlayın.
- **Tekrar üretme:** Tek oyuncu: aşama 3'te mezara gidin (Morvan doğar), kaydedip kaydı yükleyin. DK.quests.flags.morvanSpawn true kalır, DK.enemies.list'te iskelet_kaptan yoktur ve mezar başında 30 sn beklense de doğmaz. Co-op: konuk mezara tek başına gider; konukta boss bir kare görünür, ev sahibinde hiç yoktur.
- **Kabul testi:** Yüklemeden sonra mezarın 45 m içine gelindiğinde boss doğmalı. Co-op'ta konuk tetiklediğinde boss ev sahibinde doğmalı ve iki tarafta da görünmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının denetçisi (F-02, F-04) ve karşı doğrulayıcısı (F-M02) aynı kusuru bağımsız olarak buldu; F-02 doğrulaması doğuş bayrağının kayda yazıldığını doğruladı. Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-105, KI-079 (ilgili), KI-080 (ilgili).

### H-19 — Gece dalgaları her gece yeniden doğuyor; gündüz kaybolmayan türler (iskelet, Lanetli Muhafız, Hayalet Kaptan) birikiyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies._populate (enemies.js:1539-1571); Enemy.update gündüz kaybolma (637-641)
- **Kök neden:** Gece listesi `near && night && !nightDone` olduğunda doğuyor; grubun bekleme süresine ve önceki gecenin yaşayan üyelerine bakılmıyor. nightDone gündüz sıfırlanıyor. Gündüz kaybolma yalnız T.night bayraklı türlerde (hayalet, hayalet_bogulmus, hayalet_nisanci) çalışıyor; gece listelerindeki iskelet (182-186), hayalet_muhafiz ve hayalet_kaptan (archipelago.js:160-161) bu bayrağı taşımıyor. Ayrıca spawned=false iken, yani bekleme süresinde doğan gece üyeleri oyuncu uzaklaşınca silinmiyor (1559).
- **Oyuncuya etkisi:** Bir grubun 140–220 m çevresinde birkaç gece geçiren oyuncunun yanında her gece yeni iskeletler, Lanetli Muhafızlar ve Hayalet Kaptan bossları birikiyor. Örnek: Kırlangıç Limanı yakınındaki sahil_gece grubu (150, 160). Temizlenmiş kampa bekleme süresi dolmadan da gece dalgası geliyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Gece üyelerini işaretleyip şafakta kaldırın (ya da gece türlerine night: true verin). Önceki gecenin üyeleri yaşıyorsa yeniden doğurmayın, bekleme süresine uyun ve gece üyelerini de uzaklık temizliğine dahil edin.
- **Tekrar üretme:** DK.sky.hour=21 yapıp oyuncuyu sahil_gece grubunun 100 m yakınına koyun ve DK.sim(5) çalıştırın. Sonra DK.sky.hour=12 ile DK.sim(60), ardından DK.sky.hour=21 ile DK.sim(5) çalıştırın. group==='sahil_gece' olan düşman sayısı 2'den 4'e çıkar.
- **Kabul testi:** Ardışık 3 gecede bir gruptaki canlı gece üyesi sayısı gece listesinin uzunluğunu aşmamalı; gündüz gece üyesi kalmamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). H/SYS4 karşı doğrulaması gece dalgasının bekleme kuralını çiğnediğini doğruladı. Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Tarayıcı ölçümü M7: sahil_gece grubunda 3 gecede canlı üye sayısı 2, 2, 4, 4, 6, 6. Bilinen sorun: KI-106.

### H-20 — Hafif vuruş zinciri poise'sız düşmanları sürekli kesiyor (sersemletme kilidi) (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy.applyDamage tepki dalı (enemies.js:400-414); combat.js SWORD_MOVES (combat.js:19-24)
- **Kök neden:** Poise'sız ve boss olmayan düşman her hafif vuruşta 0,45 sn'lik 'hit' durumuna geçiyor ve hazırladığı saldırı iptal oluyor. Oyuncu zinciri 0,4 sn arayla vuruyor (hitAt 0,25); bitirici vuruş düşmanı 1 sn sersemletiyor. Bir zincir 1,64 sn'de ~23 dayanıklılık harcıyor (≈14/sn); yenilenme 18/sn (player.js:388), yani dayanıklılık bitmiyor. [Faz 7 tasarım doğrulaması — kök neden düzeltmesi] Asıl kilit her döngüde 3. vuruşun (finisher, combat.js:21) verdiği 1,0 sn'lik sersemlik (enemies.js:401-402). Gerçek zincirle (chainAt kapısına uyan girdi, 10 sn'de 18 savuruş) düşman 10–11 saldırı başlatıyor ve 0'ını vuruş anına ulaştırıyor; bitirici sersemliğine azalan getiri eklenince 6 başlatmadan 2'si vuruş anına ulaşıyor (inc_olcum.js MA, 3/3 koşu).
- **Oyuncuya etkisi:** Tek düşmana karşı savaş tek tuşa basmaya indirgenebiliyor; düşmanın saldırı fırsatı çok kısa pencerelerle sınırlı kalıyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Düşmana ≈1–1,5 sn'lik vuruş tepkisi bekleme süresi ya da poise ölçeri ekleyin; ölçer dolmadan yalnız üst gövde tepkisi oynasın. Saldırı hazırlığının son %30'unda düşman kesilemez olsun.
- **Tekrar üretme:** Bir haydut ile 20 sn boyunca DK.combat._attack(p,'light') çağrısını 0,42 sn'de bir tekrarlayın; e.state ve p.hp kaydedin. Düşman çok az saldırısını tamamlıyor, p.hp neredeyse sabit kalıyor.
- **Kabul testi:** Sürekli hafif zincir altında poise'sız düşman 10 sn'de en az 2 saldırısını tamamlayabilmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi: 'Hafif vuruş kesme kilidi'
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru (düzeltmeyle). Ölçüm düzeni ve kök neden düzeltildi: asıl kilit bitirici sersemliği (inc_olcum.js MA); düzeltme Kök neden alanına uygulandı. Denetçi güveni: orta. Bilinen sorun: KI-107.

### H-21 — İnsan bosslar (boss bayraklı 4 tür) öldürülünce XP vermiyor; ENEMY_TYPES'taki xp değerleri kullanılmıyor (orta)

- **Dosya ve fonksiyon:** js/game/progress.js — progress.init 'enemyKilled' dinleyicisi (progress.js:75)
- **Kök neden:** `if (T && !T.boss) share(...)` koşulu boss bayraklı türleri dışlıyor; 'bossDefeated' olayı ise yalnız efsanevi bosslardan geliyor (bosses.js:1073). Kural muhtemelen Lanetli Amiral'in güverte formunun çift ödül vermesini önlemek için konmuş; bu sorun noLoot ile zaten çözülmüş.
- **Oyuncuya etkisi:** Hayalet Kaptan (xp 250) hiç XP vermiyor. Morvan (200) ve Kızıl Hançer (150) yalnız hikâyeden +150 XP veriyor. docs/04 kartlarındaki 'Deneyim … (oyuncuya ×2 XP)' bilgisi yanlış.
- **Öncelik:** orta · hedef faz: Faz 6
- **Önerilen çözüm:** noLoot olmayan boss bayraklı düşmanlara da T.xp·2 XP verin; co-op paylaşımını aynı share fonksiyonuyla yapın.
- **Tekrar üretme:** const x0=DK.progress.xp; const e=DK.enemies.spawn('hayalet_kaptan', p.pos.x+5, p.pos.z); e.applyDamage(99999,{pos:p.pos.clone()}). Sonuçta DK.progress.xp === x0. Aynı adımlar haydut ile yapılınca XP +20 artıyor.
- **Kabul testi:** Boss bayraklı her türün ölümü (noLoot hariç) xp·2 kazandırmalı; Lanetli Amiral'in güverte formu (noLoot) kazandırmamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). F alanının denetçisi aynı kusuru bağımsız olarak buldu (F-08); H/DOC1 karşı doğrulaması boss XP değerlerinin verilmediğini doğruladı. Denetçi güveni: kesin. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-083.

### H-22 — Boss isabet hacimleri ve çarpışmaları görselle uyumsuz: dev bosslar çarpışmasız, hayalet gemi hedefi merkezde ve 6 m yukarıda, Yılan'ın gövdesi vurulamıyor (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — GiantBase (bosses.js:561-632); StoneGuardian.update (693-702); VolcanicGiant.update (824-833); CursedAdmiral (925-928, 1008); combat.js projectileTest (55-70); crowd.js:21
- **Kök neden:** bosses.js fizik modülünü hiç kullanmıyor: dev bosslar çarpıştırıcıların içinden geçiyor ve kalabalık itişmesine girmiyor (crowd yalnız enemies.list'i işliyor). Arena ya da krater sınırında konum değişmese de 'Walk' oynatılıyor. Hayalet gemi hedefi (gs.x, gs.y+3) noktasında, yarıçap 7, yükseklik 6; gülle testi merkezin 6 m üstündeki noktaya 7,6 m yarıçapla yapılıyor. Bu yüzden su hattının 1 m üstünde 20 m'lik gövdenin yalnız orta ±5 m'si (%50) isabet sayıyor. Gemi G.ships'e eklenmediği için katı değil. Yılan'da yalnız baş (r 2,4) hedef.
- **Oyuncuya etkisi:** Oyuncu devin içinde durabiliyor; Taş Muhafız tapınağın sütunlarından ve duvarlarından geçiyor, arena sınırında yerinde yürüyor. Pruvaya ya da kıça isabet eden gülleler etkisiz kalıp gemiden geçiyor. Yılan'ın gövdesine atılan atışlar boşa gidiyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Dev bosslara physics.resolve ve yüksek kütleli kalabalık ajanı ekleyin; sınırda Idle oynatın. Hayalet gemi için gövde boyunca üç hedef küre (pruva, orta, kıç) ya da kutu testi kullanın. Yılan'ın gövdesinde birkaç segmenti ek hedef yapıp hasarı başa aktarın.
- **Tekrar üretme:** Taş Muhafız'ı bir kolon çarpıştırıcısına doğru yürütün (oyuncuyu kolonun arkasına koyun): b.pos çarpıştırıcının içinden geçiyor. Oyuncuyu b.pos'a koyun: itilmiyor. Amiral'de bir gülleyi pruvadan 8 m ileriden, su hattının 1 m üstünden geçirin: b.hp değişmiyor.
- **Kabul testi:** Dev bosslar çarpıştırıcıya girmemeli ve oyuncuyu itmeli. Hayalet geminin görünen gövdesine çarpan her gülle hasar vermeli. Sınırda yürüme animasyonu oynamamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. bosses.js physics'i içe aktarmıyor; yarıçap height·0,18 (:580); hayalet gemi hedefi gs.y+3 (:1008) + height·0,5 (combat.js:58). Denetçi güveni: yüksek. Bilinen sorun: KI-108.

### H-23 — Yol bulma yok: büyük ve iç bükey engellerde takılma, yükseltideki oyuncuya ulaşamama, yamaçta dikey ışınlanma, güverte engellerinden geçme (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._move (enemies.js:1072-1146); Enemy._reachable (863-869); Enemy._place (1193-1198); crowd.js:17
- **Kök neden:** Hareket yalnız 1,3 m'lik ileri sonda ve 1,4 sn süren ±63° sapmadan oluşuyor (1087-1090, 1125-1139); A* ya da navmesh yok. Koddaki 'uçuruma girme' yorumuna rağmen yalnız su kontrol ediliyor (1091-1095). y değeri her karede arazi yüksekliğine anında oturtuluyor; eğim ya da düşüş sınırı yok. Hedef 2,4 m'den yüksekteyse 'ulaşılamaz' sayılıyor ve düşman aşağıda alay ediyor. Güverte düşmanları direk ve ambar engellerini yok sayıyor (yalnız clampDeck var); güvertedeki oyuncu kalabalık ajanı değil.
- **Oyuncuya etkisi:** Uzun duvar, çit ve U biçimli engellerde düşmanlar takılabiliyor. Oyuncu 2,4 m'lik bir kayaya ya da kuleye çıkarak yakın dövüşçüleri etkisiz bırakabiliyor. Düşmanlar dik yamaçlara koşarak tırmanıyor ve yüksekten ışınlanır gibi iniyor. Bordalamada düşmanlar oyuncunun ve direklerin içinden geçiyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Ada başına kaba bir ızgara üzerinde A* (çarpıştırıcı ve eğim maliyetli) kurun; takılınca yol isteği yapılsın. Eğim sınırı ve düşme ekleyin; yükseltilere çıkan merdiven ve rampa noktaları tanımlayın. Güverte engellerini (Ship.obstacles) yerel çözümlemeye ekleyin ve güvertedeki oyuncuyu ajan yapın.
- **Tekrar üretme:** ph.addBox ile 12 m uzunluğunda U biçimli bir duvar kurun; oyuncuyu U'nun arkasına, haydut'u önüne koyup 30 sn benzetim yapın: düşman ulaşamıyor, konumu çok az değişiyor. Oyuncuyu 3 m'lik bir kayanın üstüne koyun: yakın dövüşçüler 4 m'de bekliyor.
- **Kabul testi:** Çalışma zamanı dolaşma senaryosunda (F-09) düşman U biçimli ve 20 m'lik duvarın etrafından 20 sn içinde hedefe ulaşmalı. 60°'den dik yamaçta yürümemeli. Bordalama düşmanı direkten geçmemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11_BILINEN_SORUNLAR #11 (F-09 çalışma zamanı testi yok), #5 (D-20 güverte itişmesi)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Doğru ve ek bulgu. Tarayıcı ölçümü M2: U biçimli (12 m) ve 20 m düz duvarın arkasındaki hedefe 30 sn'de ulaşılamadı; M1b: yoğun çarpıştırıcılı hücrede 6 devriyeciden hiçbiri 60 sn'de ilk noktaya varamadı. Bordalamada oyuncunun içinden geçme belirtisi C-11 ile de örtüşüyor. Denetçi güveni: yüksek. Bilinen sorun: KI-109.

### H-24 — Boss savaşları ve 13 düşman türü için doğrulayıcı otomatik test yok (orta)

- **Dosya ve fonksiyon:** tests/scenarios/05_dusman_ai.js — 05_dusman_ai.js (18 beklenti); tests/scenarios/v03/boss1–5.js (beklenti yok)
- **Kök neden:** 05 senaryosu yalnız haydut, haydut_agir, kizil_hancer ve iskelet_kaptan ile algı ve eşik birimlerini sınıyor. Efsanevi boss betikleri yalnız JSON çıktısı üretiyor, beklenti (expect) içermiyor ve hasarı doğrudan applyDamage ile veriyor.
- **Oyuncuya etkisi:** H-01, H-02, H-04 ve H-10 gibi kusurlar regresyonlarda yakalanmadı; 'çalışıyor' iddiaları kanıtsız kalıyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Her tür için kısa bir duman testi yazın (doğ, algıla, saldır, öl, ganimet bırak). Her boss için uçtan uca, beklentili bir senaryo yazın: uyarı ile hasar zamanı, halka = hasar yarıçapı, zayıf nokta çarpanı, evre, ödül ve konukta görünürlük.
- **Tekrar üretme:** grep -c expect tests/scenarios/v03/boss*.js komutu her dosya için 0 veriyor. 05'te kullanılan türler yalnız haydut, haydut_agir, kizil_hancer ve iskelet_kaptan.
- **Kabul testi:** 17 tür ve 5 boss için beklentili senaryolar regresyonda geçmeli ve 12. belgeye kaydedilmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11_BILINEN_SORUNLAR #12, #11
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). F/SYS1 karşı doğrulaması boss dövüşünün yalnız evre eşiklerinin sınandığını, G/UC1 doğrulaması özel bölgelerin oynanış amacını uçtan uca sınayan test olmadığını doğruladı. Denetçi güveni: kesin. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Bilinen sorun: KI-110.

### H-25 — Derinlik Yılanı dalış sonunda ~21 m ışınlanıyor ve gövde izi kopuyor; Kraken'de arazi kontrolü yok (düşük)

- **Dosya ve fonksiyon:** js/game/bosses.js — SeaSerpent.update case 'dive' (bosses.js:495-511); SeaSerpent._pose (533-548); Kraken.update (246-251)
- **Kök neden:** Dalışın 2,2. sn'sinde `this.pos.copy(tgt).setY(-1)` çalışıyor; yılanın o anki konumuna bakılmıyor. Hareket kuralının Node kopyası (/tmp/denetim_alan/serpent_dive.cjs) ortalama 21 m, en çok 27 m sıçrama gösterdi. İz yalnız başın önüne eklendiği için gövde segmentleri eski, derin yolda kalıyor. Kraken'in yörüngesi gemi+R noktasına sönümleniyor ve arazi testi yapılmıyor; D-19 düzeltmesi yalnız Yılan'a ve hayalet gemiye uygulanmış.
- **Oyuncuya etkisi:** Geminin yanında gövdesiz bir baş beliriyor ve sersemlik penceresi boyunca öyle kalıyor. Adaya yakın bir Kraken savaşında baş ve dokunaçlar kayaların içine girebiliyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Dalışta yılan hedefe varmadan fırlamayı erteleyin ya da hızı mesafeye göre ayarlayın. Işınlanma gerekiyorsa izi yeniden örnekleyin. Kraken için yörünge noktasını su derinliğine göre seçin.
- **Tekrar üretme:** b=DK.bosses.spawn('derinlik_yilani'); b.mode='dive'; b.mt=0 ile dalış öncesi ve sonrası b.pos farkını ölçün (≥15 m çıkıyor). b.trail[2] ile b.pos arasındaki mesafe de büyük kalıyor.
- **Kabul testi:** Dalış sonunda başın sıçraması ≤3 m olmalı. Kraken'in baş merkezi her zaman terrain.heightAt &lt; ocean.tide − 4 koşulunu sağlayan bir noktada olmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11_BILINEN_SORUNLAR #6 / D-19 (Kraken kısmı açık; 11. belgede tümü hâlâ 'Açık' görünüyor)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. serpent_dive.cjs: 432 örnekte ortalama 21 m, en çok 27,1 m sıçrama. Denetçi güveni: orta. Bilinen sorun: KI-193.

### H-26 — Lanetli Amiral geri çekilince güvertedeki Amiral ve hayalet tayfa kalıyor; boss yeniden bordalayabiliyor (düşük)

- **Dosya ve fonksiyon:** js/game/bosses.js — bosses._check geri çekilme (bosses.js:1094-1099); CursedAdmiral._board (936-947); CursedAdmiral.dispose (1017)
- **Kök neden:** _clear yalnız CursedAdmiral'i ve hayalet gemiyi temizliyor; enemies.list'teki güverte Amirali (noLoot) ve hayalet tayfa silinmiyor. Boss 'defeated' sayılmadığı için yeniden doğup ikinci kez bordalayabiliyor.
- **Oyuncuya etkisi:** Oyuncunun gemisinde ödülsüz, sahipsiz bir Lanetli Amiral kalıyor; nadir durumlarda iki Amiral oluşabiliyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** CursedAdmiral.dispose içinde this.admiral'ı ve bayrakla işaretlenmiş bordalama tayfasını kaldırın.
- **Tekrar üretme:** Amiral'i bordalatın (b.applyDamage(b.maxHp*0.55,{kind:'cannon'})), sonra oyuncuyu gemiden 700 m uzağa ışınlayıp DK.sim(1) çalıştırın. DK.bosses.active null olur, ama DK.enemies.list'te lanetli_amiral canlı kalır.
- **Kabul testi:** Boss geri çekilince güverte Amirali ve hayalet tayfa da kaldırılmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: orta. Bilinen sorun: KI-194.

### H-27 — Hayalet düşmanlar birbirinden ayrışmıyor; oyuncu ve NPC'lerle de itişmiyor (düşük)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies.near (enemies.js:1364-1368); crowd.update (crowd.js:21)
- **Kök neden:** near() komşu listesinden tüm hayaletleri çıkarıyor; crowd da hayalet düşmanları ajan listesine almıyor.
- **Oyuncuya etkisi:** Gece dalgalarında ve bordalamada hayaletler üst üste biniyor ve oyuncunun içinden geçiyor. 'Birbirlerine takılmamalı' hedefinin tersine iç içe geçmiş bir görüntü oluşuyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Hayalet-hayalet çiftleri için daha küçük yarıçaplı bir ayrışma uygulayın (`!o.T.ghost || e.T.ghost`); isterseniz oyuncuyla hafif itişme ekleyin.
- **Tekrar üretme:** 05'teki yığılma testinin hayalet sürümünü çalıştırın: aynı noktada 3 hayalet doğurup DK.sim(2) yapın. En yakın çift arası 0,3 m'nin altında kalıyor.
- **Kabul testi:** Hayalet yığılma testinde 2 sn sonra en yakın çift arası 0,6 m'den büyük olmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02_HATA_LISTESI F_dusman önerisi: 'Hayaletler arasında ayrışma yok'
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. enemies.js:1366 (!o.T.ghost), crowd.js:21. Denetçi güveni: kesin. Bilinen sorun: KI-195.

### H-28 — Dokunulmaz düşmana (hayalet fazı, iskelet kalkışı) vuruşta sahte isabet geri bildirimi; konukta boss vuruşu her zaman 'hit' dönüyor (düşük)

- **Dosya ve fonksiyon:** js/game/combat.js — combat._meleeHit (combat.js:201-206); Enemy.hurt (enemies.js:341); BossBase.hurt (bosses.js:103)
- **Kök neden:** Enemy.hurt, düşman faz, kalkış ya da ölü durumundayken null döndürüyor; _meleeHit null'u isabet sayıp kan kıvılcımı, vuruş sesi ve hitMarker üretiyor. Konukta BossBase.hurt, damageMul=0 olan durumlarda bile 'hit' döndürüyor.
- **Oyuncuya etkisi:** Oyuncu hasar verdiğini sanıyor; faz, kalkış ve bağışıklık pencereleri anlaşılmıyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** hurt 'immune' döndürsün ve _meleeHit bunu ayrı bir efektle (gri kıvılcım) göstersin. Konukta boss için yerel bir damageMul tahmini kullanılsın.
- **Tekrar üretme:** Fazdaki bir hayalete (e.phased=true) hafif vuruş yapın: hitMarker olayı ve kan kıvılcımı oluşuyor, ama e.hp değişmiyor.
- **Kabul testi:** Dokunulmaz hedefte isabet efekti ve hitMarker olmamalı; onun yerine 'bağışık' efekti görünmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** F_dusman-ek-statik-140 (boss kısmı)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: kesin. Bilinen sorun: KI-196.

### H-29 — Volkanik Dev'in ganimeti lav gölüne düşebilir (düşük)

- **Dosya ve fonksiyon:** js/game/bosses.js — VolcanicGiant.die (bosses.js:896-901); groundAt (787); islands._updateLava (islands.js:1112-1120)
- **Kök neden:** Ganimet bossun 12 m doğusuna bırakılıyor. Krater yarıçapı lav gölünün yarıçapına eşit (I.r·0,13 ≈ 70 m); boss kraterin içinde ya da kenarında ölürse groundAt lav düzeyini döndürüyor. Lav 0,4 sn'de 14 hasar veriyor.
- **Oyuncuya etkisi:** Ödülü almak için lava girmek gerekebilir.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Ganimeti en yakın lav dışı noktaya ya da deniz bosslarındaki gibi oyuncunun yanına bırakın.
- **Tekrar üretme:** b=DK.bosses.spawn('volkanik_dev'); b.rise=1; b.pos.set(b.crater.x, b.lavaY, b.crater.z); b.applyDamage(1e6,{}). 'loot' olayının pos değeri kraterin içinde, merkeze 70 m'den yakın çıkıyor.
- **Kabul testi:** Ganimet her zaman lav yarıçapının dışında konumlanmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: orta. Bilinen sorun: KI-197.

### H-30 — Kuşatma ve yana kayma sırasında ileri yürüme/koşu animasyonu oynuyor (ayak kayması) (düşük)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._animate (enemies.js:1148-1160); kuşatma halkası _meleeOrStrafe (889-895); menzilli yana kayma (846-850)
- **Kök neden:** Kuşatmada düşman yüzünü hedefe dönük tutuyor (face, 821), ama hareketi teğetsel. _animate yalnız hıza göre Walk, Run ya da WalkBack seçiyor. ANIM_MAP'teki StrafeL ve StrafeR klipleri (kk.js) oyuncu tarafından kullanılıyor (player.js:684), düşmanlarda hiç kullanılmıyor.
- **Oyuncuya etkisi:** Kuşatan düşmanlar yana kayarken ileri yürüyor gibi görünüyor; 'animasyon ve fiziksel hareket tutarlı olmalı' hedefine aykırı.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Oyuncudaki mantığı kullanın: hız vektörünün bakış yönüne göre açısına bakarak Walk, WalkBack, StrafeL ya da StrafeR seçin.
- **Tekrar üretme:** Bir düşmanı 'strafe' (kuşatma) durumuna sokun. Her karede yaw ile hız yönü arasındaki açıyı ve currentName'i kaydedin: açı ~90° iken Walk ya da Run oynuyor.
- **Kabul testi:** Bakış yönüne göre 45°'den büyük yanal harekette strafe klibi oynamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Doğru ve ek bulgu: yan adımda klip seçimi yok (enemies.js:1148-1160); düşman yürüyüş klipleri de doğal hızla eşlenmemiş. Denetçi güveni: kesin. Bilinen sorun: KI-198.

### H-M01 — Art arda (zincir) saldırıda stateT sıfırlanmıyor: Avcı ve dört insan bossun ikinci hamlesi hazırlıksız (0,02–0,05 sn) vuruyor (yüksek)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._attackUpdate zincir dalı (enemies.js:966-972); Enemy._startMelee (901-925, 917); Enemy._setState (600-604)
- **Kök neden:** Zincir dalı, durum zaten 'attack' iken _startMelee'yi çağırıyor. _startMelee durumu _setState('attack') ile kuruyor; _setState aynı duruma geçişte erken dönüyor ve stateT'yi sıfırlamıyor. Bu yüzden önceki saldırının stateT değeri (≥ atkDur, 0,9–2,0 sn) yeni hamleye taşınıyor. Bir sonraki karede `t >= atkHit[0]` hemen doğru oluyor ve vuruş işleniyor; çoğu zaman `t >= atkDur` de doğru olduğu için hamle de hemen bitiyor. Savuşturulamaz hamlede _telegraph halkası (952-959) neredeyse tam boyutta açılıp 1–3 kare sonra kapanıyor. Animasyon baştan başladığı için görünen savuruş hasardan sonra geliyor. Hata v0.3'te de var (enemies.js:589-593, 959-960); 02/11 belgelerinde ve denetçinin listesinde yok.
- **Oyuncuya etkisi:** Zincir olasılığı %45 (970). Oyuncu menzildeyken çift bıçaklı Avcı ile Kızıl Hançer, Morvan, Lanetli Amiral ve Hayalet Kaptan'ın saldırılarının yaklaşık yarısı, hazırlıksız ikinci bir vuruşla devam ediyor. Node kopyası /tmp/denetim_alan/karsit_dusman/chain_windup.cjs ile ölçülen hazırlık süreleri: Avcı DualStab 0,017 sn, Morvan/Amiral SPIN'in ilk vuruşu 0,017 sn, Amiral/Hayalet Kaptan Heavy2H 0,05 sn. Heavy2H savuşturulamaz ve 1,8× hasar veriyor (Hayalet Kaptan'da 72). Parry (0,24 sn) ve kaçınma zamanlanamıyor; savuşturulamaz zincir hamle pratikte kaçınılmaz. Bu durum ≥0,35 sn telgraf hedefini ve 'sebepsiz hasar olmamalı' kuralını çiğniyor. Mevcut test (05:20) zincir yapmayan haydutu kullandığı için bunu yakalamıyor.
- **Öncelik:** yüksek · hedef faz: Faz 7
- **Önerilen çözüm:** _startMelee içinde durumu zorla yeniden başlatın: `this.state = 'attack'; this.stateT = 0;` (ya da _setState'e bir force parametresi ekleyin). teleT ve halkayı yeni hamle için sıfırlayın. Zincirden önce 0,15–0,25 sn'lik bir toparlanma aralığı ekleyin. Aynı yeniden giriş sorununu 'hit' ve 'stunned' durumları için de gözden geçirin.
- **Tekrar üretme:** Tek oyunculu oyunda: `const p=DK.G.player; p.hp=100; p.invuln=0; const e=DK.enemies.spawn('haydut_avci', p.pos.x+1.6, p.pos.z, {}); e.pos.set(p.pos.x+1.6, DK.terrain.heightAt(p.pos.x+1.6,p.pos.z), p.pos.z); e.yaw=Math.atan2(p.pos.x-e.pos.x, p.pos.z-e.pos.z); e.awareness=1; const tg=e._nearestPlayer(); e.target=tg; e._setState('attack'); e.stateT=1.0; e._startMelee(tg, 1.6);` Bu çağrıdan sonra e.stateT hâlâ 1.0'dır. Tek bir `DK.game.update(1/60); DK.input.endFrame();` adımından sonra e.hitIdx===1 olur ve p.hp düşer (hazırlık 1 kare). Aynı adımları 'hayalet_kaptan' ile e.move Heavy2H olana dek yineleyin: savuşturulamaz vuruş da 1–3 karede gelir.
- **Kabul testi:** Zincirde ikinci hamlenin başlangıcıyla ilk vuruşu arasındaki süre, hamlenin hitAt değerinden (öfkede /1,2; en az 0,35 sn) en çok 1 kare kısa olmalı. Savuşturulamaz zincir hamlede kırmızı halka bu süre boyunca görünmeli. 05_dusman_ai'ye, Math.random sabitlenerek Avcı ve dört insan boss için 20'şer zincir ölçen bir test eklenmeli ve tüm örnekler geçmeli.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-029.

### H-M02 — 05_dusman_ai 'Saldırı telgrafı' testi vuruş anını ölçmüyor: 'vuruş hazırlıktan önce işlenmez' koşulu her zaman geçiyor (orta)

- **Dosya ve fonksiyon:** tests/scenarios/05_dusman_ai.js — 'Saldırı telgrafı: hazırlık ≥0.35 sn, vuruş hazırlıktan önce işlenmez' adımı (05_dusman_ai.js:20); dayandığı alan Enemy.hitDone (enemies.js:915, 1021, 1038-1039)
- **Kök neden:** Test vuruş karesini `e.hitDone` ile yakalıyor. hitDone yalnız menzilli saldırıda (_rangedUpdate, enemies.js:1038-1039) true yapılıyor. Yakın dövüşte _startMelee onu false yapıyor (915) ve bir daha değiştirmiyor; vuruşlar hitIdx ile izleniyor (961-964). Bu yüzden window._hitFrame tanımsız kalıyor ve `r.hitFrame===null || …` kendiliğinden doğru dönüyor. Test yalnız tablo verisini (atkHit[0] ≥ 0,35) ve saldırının başladığını doğruluyor. Üstelik zincir yapmayan haydut kullanılıyor.
- **Oyuncuya etkisi:** Taban koşusu çıktısı (docs/v05/taban_kosusu_44d548c/05_dusman_ai.json): {started:0, hitAt:0.44, hitFrame:null, hp:74.2}. Oyuncu iki vuruş almış ama vuruşların zamanı ölçülmemiş. 12. belgedeki '18/18' kaydı telgraf süresinin doğrulandığı izlenimini veriyor ve SYS2 bu yüzden 'calisiyor_test_edilmis' sayılıyor. Zincir saldırı hatası gibi hazırlık süresini sıfırlayan gerilemeler bu testten geçiyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Vuruş anını hitIdx değişimiyle ya da p.hp'nin düştüğü kareyle ölçün; hitFrame null kalırsa testi başarısız sayın. Zincir için Math.random sabitlenmiş ayrı bir adım ekleyin (çift bıçaklı tür ve boss için). Savuşturulamaz hamlede halkanın görünür kaldığı süreyi de ölçün.
- **Tekrar üretme:** Senaryoyu çalıştırın ya da taban koşusunun JSON çıktısına bakın: 13. adımda `window._tel.hitFrame === null` iken `hp < 100`. `grep -n hitDone js/game/enemies.js` komutu, true atamasının yalnız 1039. satırda (menzilli dal) yapıldığını gösterir.
- **Kabul testi:** Test, zinciri zorlayan adımda mevcut kodla başarısız olmalı ve zincir düzeltmesinden sonra geçmeli. hitFrame her koşuda sayı olmalı ve ≥ (hitAt − 1 kare) olmalı.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-111.

### H-M03 — Dev bossların animasyon hızı ve yeniden başlatması konuğa iletilmiyor: konukta Jump/Punch/Weapon 1,0 hızla oynuyor, görünen hamle ile hasar arası ~0,5–1,0 sn (orta)

- **Dosya ve fonksiyon:** js/game/bosses.js — GiantBase.netExtra (bosses.js:622) ve GiantBase.clientUpdate (623-631); ev sahibi hızları StoneGuardian._go (751-755), VolcanicGiant._go (890-893), yaylım 852
- **Kök neden:** netExtra yalnız klip adını (an) ve durumu gönderiyor. clientUpdate klibi hız vermeden ve restart olmadan oynatıyor (`anim.play(s.an, 0.15, {once})`), bu yüzden Animated.play timeScale=1 kullanıyor (character.js:1004). Ev sahibi ise Jump'ı 0,4/0,45, Punch'ı 0,75, Weapon'ı 0,7/0,8, Walk'ı 0,6–0,7 hızla oynatıyor. Yaylımda Punch her atışta restart:true ve 1,4 hızla yeniden başlıyor; konukta klip adı değişmediği için yeniden başlamıyor. Kod v0.3'te de aynı (bosses.js:606, 613). H-02 yalnız ev sahibini, H-15 halka ve bildirimleri ele alıyor; klip hızı hiçbir maddede yok.
- **Oyuncuya etkisi:** Konukta stomp için Jump 0,33 sn'de bitiyor (ev sahibinde 0,83 sn). Hasar ise ev sahibinin zamanlamasıyla 1,4 sn'de geliyor; konuk hasarı klip bitiminden ~1,0 sn sonra alıyor. Slam'de fark ~0,7 sn, süpürmede 0,5–0,6 sn (ev sahibinde 0,46–0,68 sn). Konukta halka da yok (H-15), bu yüzden konuğun kaçınma ya da zıplama zamanlaması için güvenilir bir ipucu kalmıyor. Volkanik Dev yaylımındaki 3–5 atış konukta tek yumrukla gösteriliyor; yürüyüşte ayak kayıyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** netExtra'ya klip hızını (sp) ve bir oynatma sıra numarasını (seq) ekleyin; konukta `play(s.an, 0.15, { once, restart: s.seq !== last, speed: s.sp })` çağırın. Daha iyisi, durumda geçen süreyi (st) gönderip konuktaki klip zamanını buna hizalayın. H-02 düzeltmesinde tanımlanacak vuruş karesi verisini iki tarafta da kullanın.
- **Tekrar üretme:** İki oyunculu co-op açın (tests/harness/coop.cjs). Ev sahibinde, konuğun 6 m yanında `b=DK.bosses.spawn('tas_muhafiz', {id:'tas_muhafiz', x:gx+6, z:gz}); b.atkT=99; b._go('stomp')` çalıştırın. Ev sahibinde b.anim.current.timeScale 0,4, konukta DK.bosses.active.anim.current.timeScale 1 çıkar. Konukta Jump'ın bitiş zamanını ve p.hp'nin düştüğü zamanı kaydedin: fark ~1,0 sn olur.
- **Kabul testi:** Konuktaki klip timeScale değeri ev sahibininkine eşit olmalı. H-02 düzeltmesinden sonra konukta klip vuruş karesi ile hasar arasındaki fark ≤ 0,15 sn artı ağ gecikmesi olmalı. Yaylımdaki her atış konukta ayrı bir yumruk olarak oynamalı.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-112.

### H-M04 — Derinlik Yılanı'nın zehir topu doğrudan hasar vermiyor: SeaSerpent'te _hitPlayer yok, 12 hasar kimseye uygulanmıyor, konuk hiç etkilenmiyor (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies._impact (enemies.js:1431-1455, 1442-1443); SeaSerpent.update 'spit' dalı (bosses.js:481-494, lob 489); SeaSerpent sınıfı (bosses.js:391-556)
- **Kök neden:** _impact alan hasarını yalnız `s.owner?._hitPlayer` varsa uyguluyor (1442). Taş Muhafız (bosses.js:757), Volkanik Dev (895) ve Lanetli Amiral (1010) bu yöntemi tanımlıyor; SeaSerpent tanımlamıyor ve BossBase'de de yok. Bu yüzden lob'a verilen dmg:12 hiç uygulanmıyor. Kalan tek etkiler yerel oyuncuya 6 sn zehir (1443) ve gemiye 3 hasar. Kod v0.3'te de aynı (bosses.js:480, enemies.js:1420-1421). 02_HATA_LISTESI'ndeki F_dusman-ek-statik-139 maddesi 'konukta yalnız 12 hasar verir' diyor; bu yanlış, çünkü konuğa da hasar gitmiyor.
- **Oyuncuya etkisi:** Tek oyunculuda tükürük saldırısı (3–5 top) tasarlanan 36–60 doğrudan hasar yerine yalnız ~13 can götürüyor (6 sn zehir × 2,2/sn; zehir üst üste binmiyor). Co-op'ta konuk tükürükten hiç etkilenmiyor. Boss tasarlanandan belirgin biçimde kolay ve zorluk iki oyuncu için eşit değil.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** SeaSerpent'e `_hitPlayer(id, pl, dmg, mv) { hitPlayer({ id, ref: pl, pos: pl.pos }, dmg, this.pos, 'Derinlik Yılanı zehri', { kb: mv?.kb || 3 }); }` yöntemini ekleyin. Zehri hitPlayer ve netHurtPlayer iletisine bir poison alanı olarak taşıyın (player.hurt'ün opts.poison desteği zaten var, player.js:176). Alternatif olarak, sahibinde yöntem yoksa _impact genel hitPlayer'a düşsün.
- **Tekrar üretme:** `DK.G.godMode=false; const p=DK.G.player; p.hp=100; p.poison=0; const b=DK.bosses.spawn('derinlik_yilani'); DK.enemies.lob({kind:'venom', from:p.pos.clone().add(new DK.THREE.Vector3(0,6,0)), to:p.pos.clone(), time:0.5, dmg:12, shipDmg:3, aoe:2.4, owner:b}); DK.sim(0.6)` çalıştırın. İsabet anında p.hp düşmez, yalnız p.poison=6 olur; ayrıca `typeof b._hitPlayer === 'undefined'`. Co-op'ta aynı isabette konuğun p.hp ve p.poison değerleri değişmez.
- **Kabul testi:** Zehir topu ev sahibine ve konuğa isabet edince 12 hasar (zorluk çarpanıyla) ve 6 sn zehir uygulanmalı. Kaçınma dokunulmazlığı iki tarafta da korunmalı. Boss senaryosunda bunu ölçen bir kontrol bulunmalı.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). Faz 7 tasarım belgesinin incelemesi aynı kusuru bağımsız olarak kaydetti (§0.5 N-11): SeaSerpent'te _hitPlayer yok (bosses.js:391-556), enemies._impact hasarı yalnız s.owner?._hitPlayer varsa uyguluyor (enemies.js:1442); tarayıcı ölçümünde isabette can 100 → 100. Bilinen sorun: KI-113.

---

**5.I Alan I — Karakter, animasyon ve kamera** · 21 denetim maddesi, 1 kaçan madde · varsayılan hedef faz: Faz 7

Denetçi özeti: v0.4'te (44d548c) hareket mantığı büyük ölçüde test kapsamında: yürü/koş/sprint geçiş histerezisi, sprint tükenmesi, iniş eşikleri, güverte zıplama/kaçınma, yüzme kaldırması, dalış ve kamera senaryoları taban koşusunda tam geçiyor (04_karakter 21/21, 15_iskele_kamera 14/14, 16_kosu_poz_ganimet 23/23, 17_kamera_kararma 13/13). ANIM_MAP'in 89 girişinin tamamı kk_anims.glb'de var; çömelme ve ragdoll sonrası poz düzeltmelerini Node'da yeniden ölçtüm, çalışıyorlar. Asıl sorun animasyonun fiziksel hareketle uyumu. Aynı GLB ve kk.js hattıyla Node'da yaptığım ileri kinematik ölçüme göre kliplerin doğal hızı Walking_A için ≈0,7–0,9 m/sn, Running_A/C için ≈3,6–3,9 m/sn; kod ise 1,9/5,2/6,6 m/sn referans alıyor. Bu yüzden her harekette sürekli ayak kayması var. 02 C13 düzeltmesi 3 m/sn'deki kaymayı ~%14'ten ~%55'e çıkarmış. Dümen ve top IK hedefleri 0,47 m'lik kolun ulaşamayacağı uzaklıkta: eller çarka 0,39–0,53 m, kundağa 0,34–0,37 m kala havada kalıyor. C08 testi bilek kemiğini değil yalnız hedef vektörünü ölçtüğü için bunu yakalamıyor. Sandık taşırken eller sandığın içinde kalıyor. Zıplama klibi fiziksel kalkıştan 0,19 sn geç kalkıyor. Kaçınma kliplerindeki 0,27–0,67 m kök hareketi gövdeyi fiziksel konumdan koparıyor. Yüzme pozu gövde eğimini hesaba katmıyor. Kamera v0.3'e göre çok ilerledi: duvar, iskele güvertesi, gemi gövdesi, mağara ve su yüzeyi testlerle doğrulanmış; ağaçlar bilinçli olarak çarpıştırılmıyor, titreşimle siliniyor. Ancak nişan alırken omuz kaydırması daraltılmadığından kamera sağdaki duvarın içine giriyor. Tabanca ışını da kameradan çıktığı için duvar arkasına görüş ve atış mümkün; bunu gerçek camera.js ve physics.js ile Node'da ürettim. Limanda doğuşta kip geçişi tamamlanmıyor: silah ve meşale görünmez kalıyor, dümende ölünce kollar eski çark noktasına kilitli kalıyor. Saldırı, parry, tabanca doldurma, merdiven ve ani durma için otomatik test yok.

