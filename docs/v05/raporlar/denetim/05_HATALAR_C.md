# AUDIT_CURRENT §5 — Hatalar: C — Fizik, döngü, çarpışma, görüş hattı

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — C — Fizik, döngü, çarpışma, görüş hattı

### C-01 — Döngü gerçek bir sabit adım değil: alt adım boyu kare süresine bağlı (h = dt/n); biriktirici ve ara değerleme yok (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.update / game._step
- **Kök neden:** game.js:201-207 her karede n = ceil(dt/STEP) alt adım atıyor ve h = dt/n alıyor. Adım boyu kare süresiyle değişiyor (1/60, 1/80, 1/90, 1/120, 1/144…); kalan süre biriktirilmiyor, çizimde ara değerleme yok. Yarı örtük Euler (player.js:566-588) ile adıma duyarlı ayrık itkiler (knock: player.js:541-546; bodies sekme ve sürtünmesi: bodies.js:141-151) adım boyuna göre farklı sonuç veriyor. game.js:180-184'teki yorum '30/60/120 FPS aynı sıçrama' diyor ama bu doğru değil.
- **Oyuncuya etkisi:** Aynı girdi farklı kare hızında farklı sonuç veriyor. Zıplama tepesi 15/20/30/60 FPS'te 1,183 m; 40/45/50 FPS'te 1,198/1,204/1,208 m; 59,94 Hz ve 120 FPS'te 1,214 m; 144 FPS'te 1,219 m (Node hesabı, 05 §5.1 ile birebir aynı). Geri tepme 144 FPS'te %10 kısa (05 §5.2 #3: 1,597 → 1,439 m), rijit cisim düşüşü 120 FPS'te x ekseninde 1,3 m farklı (05 §5.1). Zıplamayla çıkılabilen yükseklik (~1,78–1,82 m) ekran hızına bağlı; co-op'ta farklı ekranlı oyuncular farklı fizik yaşıyor. [Doğrulamayla düzeltildi — C/UC2, orta güven] '15/20/30/60 FPS'te birebir aynı' sonucu yalnız testlerdeki tam dt değerleri için geçerli. Gerçek tarayıcıda rAF zaman damgaları kabalaştırıldığı için (Chrome ≈0,1 ms, Firefox 1 ms) Node modelinde 60 Hz'de karelerin 2/3'ünde n = 2; 30 FPS'te n 2↔3, 15 FPS'te 4↔5 arasında gidip geliyor. Zıplama tepesi 60 Hz'de 1,203–1,205 m, 30 ve 15 FPS'te ≈1,19 m; geri tepme 60 Hz'de 1,50–1,53 m (testte 1,597).
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Biriktiricili sabit adıma geç: acc += dt; k = 0; while (acc >= STEP && k &lt; MAX_SUB) { _step(STEP); acc -= STEP; k++ }; MAX_SUB aşılırsa acc = 0 (zaman yavaşlar). Kalan alpha = acc/STEP ile oyuncu, gemi, düşman, gülle ve kamera odağını önceki ve şimdiki durum arasında ara değerle. pressed() mantığını 'ilk alt adım' yerine 'karede bir kez tüket' modeline çevir; adım atılmayan karelerde girdi kaybolmasın.
- **Tekrar üretme:** Konsolda oyuncuyu düz zemine koy, zıpla, 2 sn boyunca her karede DK.game.update(1/144) çağır ve en yüksek p.pos.y farkını ölç (≈1,219 m). Aynısını DK.game.update(1/60) ile yap (1,183 m). Ya da /tmp/denetim_alan/C_fizik/los_test2.mjs çalıştır (ziplamaTepe).
- **Kabul testi:** 03_fizik_dt.js beklentili hale gelsin: 15/30/45/59,94/60/90/120/144 FPS'te yürüme, sprint, zıplama tepesi, kaçınma, geri tepme ve sandık düşüşü 60 FPS sonucundan en çok %0,5 sapsın; 8–100 ms arası rastgele kare süresi dizisinde de aynı sonuç çıksın.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #1 (yalnız 120 FPS zıplama kayıtlı; kapsam daha geniş), 14 yol haritası #10
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (dolaylı doğrulama). C/UC2 karşı doğrulaması kök nedeni kabul etti ama '15/20/30/60 FPS'te birebir aynı' sonucunu yalnız tam dt değerleri için geçerli buldu; düzeltme Oyuncuya etkisi alanına uygulandı (doğrulayıcı: zaman damgası modeline dayanıyor, orta güven). Denetçi güveni: kesin. Bilinen sorun: KI-046.

### C-02 — Alt adım sayısı kareden kareye gidip geliyor (1e-6 eşiği): 60 Hz'de 1↔2, 30 FPS'te 2↔3, 15 FPS'te 4↔5 (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.update
- **Kök neden:** game.js:201 n = clamp(Math.ceil(dt / this.STEP - 1e-6), 1, this.MAX_SUB). Tolerans oran cinsinden 1e-6, yani yaklaşık 0,017 µs. rAF zaman damgası farkı (Timer.update, three.core.js:51836-51846) 16,6667 ms'yi çok az aşsa bile n=2 oluyor. Tarayıcıların 0,1 ms'ye yuvarladığı damgalarda (16,6/16,7 ms) ve 59,94 Hz panellerde (16,68 ms) karelerin yarısı ya da tamamı iki alt adıma (h≈8,3 ms) bölünüyor. Node: 16,6 ms → 1, 16,667/16,7/16,68 ms → 2.
- **Oyuncuya etkisi:** Gerçek 60 Hz ekranda benzetim fiilen 120 Hz alt adımla ya da karışık adımla koşuyor. (a) Alt adımdaki sistemlerin CPU maliyeti bu karelerde iki katına çıkıyor; 09_performans 'benzetim ms/kare' ölçümü yalnız n=1 (game.update(1/60)) ile yapıldığı için bu görünmüyor. (b) Belgelerdeki '60 FPS ile birebir' sonuçlar gerçek ekranda geçerli değil: zıplama tepesi 1,183 yerine 1,199–1,214 m. (c) Güverte oyuncusunun gemiden gecikmesi (C-08) kare kare 0,18↔0,09 m değişip titreme yapıyor. [Doğrulamayla düzeltildi] Salınım yalnız 60 Hz'de değil, 30 ve 15 FPS'te de var. Etkiler fizik farkının ötesine geçiyor: top nişanı (C-03), yapay zekâ olasılık hızları (C-M01), güvertedeki oyuncunun titremesi (C-M03) ve ≈1,67 kat CPU (C-M04). Öncelik 'orta' uygun; düzeltme basit (ör. ceil(dt/STEP − 0,01) ya da biriktirici).
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** C-01'deki biriktiricili sabit adım bu sorunu kökten çözer. Geçici çözüm: toleransı büyüt (ceil(dt/STEP − 0,05)) ve dt'yi son birkaç karenin medyanıyla yumuşat.
- **Tekrar üretme:** Konsol: for (const ms of [16.6, 16.7, 16.68]) { DK.game.update(ms/1000); DK.input.endFrame(); console.log(DK.game.lastSubsteps); } çıktısı 1, 2, 2. Gerçek tarayıcıda 10 sn boyunca lastSubsteps ortalamasını kaydet; 60 Hz'de 1'den büyük çıkar.
- **Kabul testi:** 16,5–16,9 ms titreşimli ve 59,94 Hz kare dizilerinde ortalama alt adım 1,00 ± 0,02 olsun; zıplama tepesi 60 FPS değerinden en çok %0,5 sapsın.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: game.js:201'deki `ceil(dt/STEP − 1e-6)` yüzünden 16,66668 ms'yi aşan her karede n = 2. Node modeli (jitter.mjs): 0,1 ms ve 1 ms yuvarlamada 600 karenin 400'ünde n = 2 (saniyede 100 alt adım); 30 FPS'te n 2↔3, 15 FPS'te 4↔5 (jitter2.mjs). Testler hep tam dt (DK.sim, game.update(1/60)) kullandığı için görünmüyor; 09_performans.js:6 maliyeti de n = 1 ile ölçüyor. Düzeltme/ek: Bulgu doğru ama kapsamı dar. Salınım yalnız 60 Hz'de değil, 30 ve 15 FPS'te de var. Etkileri fizik farkının ötesine geçiyor: top nişanı (C-03), yapay zekâ olasılık hızları, güvertedeki oyuncunun titremesi ve ≈1,67 kat CPU (missed maddeleri). Öncelik 'orta' uygun; düzeltme basit (ör. ceil(dt/STEP − 0,01) ya da biriktirici). (uygulanan alanlar: başlık, oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-047.

### C-03 — Top nişan hızı alt adım sayısıyla çarpılıyor (kare hızına bağlı nişan) (yüksek)

- **Dosya ve fonksiyon:** js/game/shipControl.js — shipControl.update (+ input.lookDelta)
- **Kök neden:** shipControl.update game._step içinde her alt adımda çağrılıyor (game.js:225). Top kipinde input.lookDelta() (input.js:151-161) karede biriken fare farkını tüketmeden döndürüyor; endFrame (163-165) sıfırlaması kare sonunda yapılıyor. shipControl.js:292-294 bu farkı her alt adımda cannonYaw/cannonPitch'e yeniden ekliyor. v0.3'te shipControl.update kare başına bir kez çağrılıyordu (v0.3 game.js:186).
- **Oyuncuya etkisi:** Top nişan hızı FPS'e bağlı: 60 FPS'te 1×, 30 FPS'te 2×, 15 FPS'te 4×, 10 FPS'te 6×. 60 Hz'de C-02 nedeniyle bazı karelerde 2× olduğu için nişan sıçrıyor; deniz savaşında isabet zorlaşıyor. Gamepad sağ çubuk da aynı biçimde çarpılıyor. [Doğrulama düzeltmesi] Öncelik en az 'yüksek': top nişanı deniz savaşının ana girdisi; sıradan 60 Hz ekranda her top kullanımında duyarlılık 1,67 kat ve kareden kareye değişken.
- **Öncelik:** yüksek (denetçi: orta; karşı doğrulamayla düzeltildi) · hedef faz: Faz 3
- **Önerilen çözüm:** Top nişan girişini kare başına işle: fare/çubuk bölümünü game.update'te tpCamera.rotate'in yanına taşı, ya da shipControl.update içinde yalnız !input.subframe iken uygula. Uzun vadede girdi tüketimini tek yerde topla.
- **Tekrar üretme:** Oyuncuyu bir topa geçir (DK.shipControl.takeCannon(p, s, 0)). DK.input.mouseDX = 100; DK.game.update(1/15); DK.input.endFrame() sonrası cannonYaw değişimi, aynı işlemi DK.game.update(1/60) ile yaptığındakinin 4 katı çıkar.
- **Kabul testi:** mouseDX=100, 1/10, 1/15, 1/30, 1/60, 1/144 sn'lik karelerde aynı cannonYaw/cannonPitch değişimini ±%1 içinde üretsin; bu kontrol 03_fizik_duzeltmeler'e eklensin.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: shipControl.update _step içinde çalışıyor (game.js:225). input.lookDelta (input.js:151-161) değeri tüketmiyor; mouseDX ancak endFrame'de (163-165) sıfırlanıyor. shipControl.js:292-295 bu yüzden her alt adımda aynı deltayı ekliyor. v0.3'te (game.js:183-186) kare başına bir kez çalışıyordu. Node (jitter.mjs): gerçek 60 Hz dizisinde 60 karede 0,60 rad yerine 1,01 rad dönüş (×1,67), kare deseni ×2, ×2, ×1 (sarsıntı); ortalama 30 FPS'te ×2,33, 15 FPS'te ×4,67. Hiçbir test top nişanını sınamıyor (04 C08 yalnız el IK'sini denetliyor). Düzeltme/ek: Kök neden ve 'v0.4'e özgü gerileme' tespiti doğru, ama öncelik en az 'yuksek' olmalı. Top nişanı deniz savaşının ana girdisi; sıradan 60 Hz ekranda her top kullanımında duyarlılık 1,67 kat ve kareden kareye değişken. Kritik/yüksek listesinin boş bırakılması bu madde için yanlış. (uygulanan alanlar: oyuncuya etkisi, öncelik) Denetçi güveni: kesin. Bilinen sorun: KI-021.

### C-04 — lineBlocked yüksekliği tek noktada sınıyor (2,5B): eğik görüş hattında sonuç yöne bağlı ve hatalı (orta)

- **Dosya ve fonksiyon:** js/world/physics.js — physics.lineBlocked
- **Kök neden:** physics.js:221-246 kutu için yalnız giriş parametresi t0'daki, çember için yalnız en yakın yaklaşma noktasındaki y değerinin c.y0–c.y1 aralığında olup olmadığına bakıyor. Doğru engelin izdüşümüne üst yüzün üstünden girip izdüşüm içinde y1'in altına inerse engel sayılmıyor. v0.3'te de aynı kural vardı (physics.js:167-191).
- **Oyuncuya etkisi:** Node denemesi (kopya physics.js, v0.3 ve v0.4 aynı sonuç): 6 m yüksek, 8×8 m bir bina. 12 m yükseklikten binanın arkasındaki hedefe doğru 'açık' (false), ters yönde 'engelli' (true). Sonuç olarak tepe, sur ya da yüksek kayadaki düşman binanın veya kalın engelin arkasındaki oyuncuyu görüyor ve vuruyor (_los da aynı işlevi kullanıyor). Oyuncu yüksek kameradan kalın engel arkasındaki düşmanı vurabiliyor. Algı asimetrik.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Kutu için [t0,t1] kiriş aralığında doğrunun y değerinin en küçüğünü ve en büyüğünü al; [ymin, ymax] ile [y0, y1] kesişiyorsa engel say. Çember için kiriş giriş–çıkış t'leriyle aynı yöntemi uygula. tMin/tMax kırpmasını bu aralığa uygula.
- **Tekrar üretme:** P=DK.physics; P.addBox(0,0,4,4,0,0,6,'t'); P.lineBlocked(-10,12,0, 6,0.5,0) → false; P.lineBlocked(6,0.5,0, -10,12,0) → true; P.removeTag('t'). Alternatif: /tmp/denetim_alan/C_fizik/los_height.mjs.
- **Kabul testi:** Birim testi: rastgele 50 eğik doğru × kutu/çember için lineBlocked(a,b) === lineBlocked(b,a) olsun ve sonuç 0,05 m adımlı nokta örneklemesiyle bulunan gerçek kesişimle uyuşsun. 05_dusman_ai'ye 'yüksekteki düşman bina arkasındaki oyuncuyu görmez' senaryosu eklensin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: physics.js:243-245 yüksekliği yalnız giriş noktasında sınıyor (kutuda t0, dairede en yakın nokta). Node (los_h.mjs; 8 m genişliğinde, 4 m yüksekliğinde bina, x 16–24): (0, 13,6, 0)→(30, 1,4, 0) false, ters yön true, PROJ_LOS ile de false. Algı (enemies.js:555), _los (1015), mermi (1531), tabanca (combat.js:295), zıpkın ve kamera aynı fonksiyonu kullanıyor. Denetçi güveni: kesin. Bilinen sorun: KI-048.

### C-05 — Gülle statik çarpıştırıcıları (bina, deniz kayalığı, fener, iskele, duvar, ağaç) yok sayıyor (orta)

- **Dosya ve fonksiyon:** js/game/effects.js — effects.update (gülle döngüsü)
- **Kök neden:** effects.js:166-195 gülleyi yalnız gemi kutularına (0,5 m süpürme), araziye ve 'big' savaş hedeflerine (projectileTest, combat.js:55-69) karşı sınıyor; physics hücre ızgarası ve lineBlocked hiç çağrılmıyor. Deniz kayalıkları gemi engeli (Ship.obstacles) ve physics çemberi olarak ekleniyor (details.js:302-303, islands.js:1074-1076), ama gülle ikisini de görmüyor.
- **Oyuncuya etkisi:** Gülle kaya sütunlarının, liman binalarının, fenerin, iskelenin ve kale duvarlarının içinden geçip arkasındaki gemiyi veya hedefi vuruyor. Kayalığı siper olarak kullanmak işe yaramıyor; düşman gemisi limandaki oyuncuyu binaların arkasından vurabiliyor. Patlama yalnız arazide oluşuyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Her alt adımda prev→pos parçası için physics.lineBlocked(…, {tMin:0, tMax:1, rScale:1}) çağır, ya da en yakın isabet t'sini döndüren bir süpürme işlevi kullan. Gemi, arazi ve statik isabetlerden en erkenini seç; statik isabette patlama ve toz efekti üret. Güllenin sahibi olan geminin kendi gövdesini muaf tut.
- **Tekrar üretme:** Bir deniz kayalığı bul (DK.physics.all.filter(c=>c.tag==='seastack')). Bir gemiyi kayanın arkasına yerleştir ve kayanın öbür yanından DK.effects.cannonball(muzzle, yön*58, sahte_sahip, 1) ile gemiye doğru ateşle: gülle kayayı geçip gemiye isabet ediyor.
- **Kabul testi:** Statik engelin (kutu ya da çember) arkasındaki gemiye atılan 20 gülleden hiçbiri isabet etmesin; engelsiz yoldaki isabet oranı değişmesin. 03_fizik_duzeltmeler'e 'gülle kayalıktan/binadan geçmez' kontrolü eklensin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: effects.js:149-198 yalnız şunlara bakıyor: gemi kutusu süpürmesi (170-176), arazi (177, 184), su (190) ve projectileTest (179; combat.js:55-70, yalnız büyük hedefler). physics.lineBlocked ya da resolve çağrısı yok; bu yüzden kaya, bina, kale duvarı ve iskele direği gülleyi durdurmuyor. v0.3 effects.js:149-172 aynı (nokta testiyle). Denetçi güveni: kesin. Bilinen sorun: KI-049.

### C-06 — Görüş ve mermi kuralları tek sistemde değil: gemi gövdesi ve platform güvertesi yalnız kamera için engel, tabanca ışını kameradan çıkıyor, düşman mermisinde oyuncu isabeti engelden önce sınanıyor (orta)

- **Dosya ve fonksiyon:** js/game/combat.js — combat.shoot / combat.raycast; Enemy._perceive/_los; enemies._updateShots
- **Kök neden:** physics.js:100-101'deki yoruma göre lineBlocked platformları kasıtlı olarak içermiyor; slabBlocked yalnız camera.js:112'de, gemi gövdesi testi (hullSolid, camera.js:15-29) yalnız kamerada kullanılıyor. Tabanca ışını kameradan çıkıyor (combat.js:243-254) ve namlu–hedef görüşü denetlenmiyor. raycast'te proj ≥ 0 şartı (281) kamera ile oyuncu arasındaki hedefi de kabul ediyor. Düşman mermisinde oyuncu kapsül isabeti (enemies.js:1496-1513) engel süpürmesinden (1531) önce sınanıyor.
- **Oyuncuya etkisi:** Mermiler ve düşman görüşü iskele tahtasının ve gemi gövdesi/küpeştenin içinden geçiyor: güvertede küpeşte arkasına eğilmek siper olmuyor, iskele altındaki düşman üstteki oyuncuyu görüyor. Oyuncu omuz kamerasıyla namlunun görmediği köşe arkasını ya da kendi arkasındaki (kamera tarafındaki) düşmanı vurabiliyor. Duvar ile oyuncu aynı alt adım parçasındaysa (≤1,6 m) mermi duvarın arkasındaki oyuncuya isabet ediyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Tek bir los/sweep API'si kur: statik + platform düzlemi + gemi gövdesi (yerel uzayda) + isteğe bağlı mağara katmanları; her çağıran maskeyle seçsin (AI, mermi, kamera). Tabanca için hedef noktasını kameradan bul, isabeti namludan o noktaya lineBlocked ile doğrula ve proj > kamera–oyuncu mesafesi şartını ekle. Düşman mermisinde engel kesişim t'si ile oyuncu kesişim t'sini karşılaştır; küçük olan kazansın.
- **Tekrar üretme:** (1) Bordalama sırasında güvertede küpeşteye çömel; karşı gemideki nişancının mermisi yine isabet ediyor. (2) Kamera ile oyuncu arasına bir düşman koy, nişangâh üstündeyken DK.combat.raycast(kamera, yön, 80, p) o düşmanı döndürüyor. (3) Oyuncunun 0,5 m önüne bir duvar koy; prev duvarın önünde, pos oyuncunun içinde olacak şekilde 95 m/s mermi oluştur: isabet oyuncuya yazılıyor.
- **Kabul testi:** 05_dusman_ai'ye eklensin ve geçsin: küpeşte/iskele tahtası arkasındaki hedef görülmez ve vurulmaz; namlu–hedef doğrusu duvarla kesilen atış isabet etmez; kamera ile oyuncu arasındaki düşman vurulmaz; duvar ve oyuncu aynı parçadayken isabet duvarda kalır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** F-16 (tabancanın çarpıştırıcıları yok sayması v0.4'te giderildi; kalan kısımlar kayıtlı değil)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). C/UC3 karşı doğrulaması slabBlocked ve hullSolid'in yalnız camera.js'te geçtiğini ve tabanca ışınının kökeninin kamera olduğunu (combat.js:244), C/SYS4 doğrulaması 'mermi ve yapay zekâ için güverte engeli olmadığı tespiti (C-06) doğru' sonucunu verdi. Denetçi güveni: yüksek. Bilinen sorun: KI-050, KI-058 (ilgili).

### C-07 — Zıpkın süpürmesi görüş hattı uç paylarıyla yapılıyor: yaklaşık %4 olasılıkla kaya, duvar ya da ağaçtan geçiyor (düşük)

- **Dosya ve fonksiyon:** js/wildlife/seagear.js — seagear._flySpear
- **Kök neden:** seagear.js:280 physics.lineBlocked(h.prev…, h.pos…) çağrısını varsayılan tMin=0,02 / tMax=0,98 / rScale=0,8 ile yapıyor. Bu, D-04'te düşman mermisi için PROJ_LOS ile düzeltilen hatanın aynısı: parçanın ilk/son %2'sine düşen giriş görülmüyor, sonraki parça engelin içinden başladığı için (t0=0 &lt; tMin) engel bütünüyle deliniyor. Ayrıca seagear alt adım sistemi değil; zıpkın kare başına dt ile uçuyor (seagear.js:217).
- **Oyuncuya etkisi:** Node denemesi (kopya physics.js): 0,4 m'lik ardışık parçalarla 400 engel konumunda hem çemberde hem ince kutuda 16/400 (%4) kaçırma; PROJ_LOS ile 0/400. Zıpkın ara sıra kayadan, iskele direğinden ya da duvardan geçip arkadaki balığı veya köpekbalığını vuruyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** lineBlocked'ı {tMin:0, tMax:1, rScale:1} (PROJ_LOS) ile çağır. Zıpkın uçuşunu alt adıma taşı ('seagear' sistemini SUBSTEP'e al ya da yalnız _flySpear'i alt adımlı çağır).
- **Tekrar üretme:** node /tmp/denetim_alan/C_fizik/los_test.mjs (zipkin_varsayilan: 16/400, zipkin_PROJ_LOS: 0/400). Oyunda: zıpkın yoluna 0,3 m yarıçaplı bir çember çarpıştırıcı ekleyip 24 m/s ile defalarca at.
- **Kabul testi:** 400 ofsetli ardışık parça denemesinde kaçırma 0 olsun; 14_deniz_ekipmani'ne 'zıpkın duvardan geçmez' kontrolü (20 atış, 0 geçiş) eklensin.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** D-04 (aynı sınıf; düzeltme zıpkına uygulanmamış)
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: seagear.js:280 lineBlocked'ı varsayılan tMin 0,02 / tMax 0,98 / rScale 0,8 ile, kare başına alınan parça için çağırıyor (seagear.js:217). Kutunun giriş noktası t0 parçanın son %2'sine düşerse yok sayılıyor; sonraki parça kutunun içinden başladığı için t0 = 0 &lt; tMin oluyor ve yine yok sayılıyor (physics.js:231-241, 243). Sonuçta zıpkın duvardan geçebiliyor (geçiş başına ≈%4 olasılık). Etkisi düşük, çünkü zıpkın çoğunlukla su altında kullanılıyor. Denetçi güveni: kesin. Bilinen sorun: KI-168.

### C-08 — Güverte, dümen, top ve kayık kiplerinde oyuncu gemiden bir alt adım geride konumlanıyor (düşük)

- **Dosya ve fonksiyon:** js/game/game.js — game._step; Player._updateDeck/_updateHelm/_updateCannon/_updateBoat
- **Kök neden:** game.js:225-235 sırası şöyle: p.update (oyuncunun dünya konumu ve IK el hedefleri gemi matrisinden hesaplanıyor: player.js:889, 915-921, 934-939, 949), sonra gemiler güncelleniyor (ship.update → updateTransform matrisi yeniliyor, ship.js:380, 558-561), sonra kayık. Çizimde gemi yeni konumunda, oyuncu eski matrisle çiziliyor. Güverte düşmanları alt adım sistemlerinde gemiden sonra güncellendiği için (game.js:237, enemies.js:1162-1166) yeni matrisi kullanıyor.
- **Oyuncuya etkisi:** 11 m/s seyirde oyuncu gemiye göre yaklaşık 0,18 m (60 Hz) geride çiziliyor ve dümendeyken eller çarktan ayrı duruyor. C-02 nedeniyle adım boyu değiştikçe bu kayma 0,18↔0,09 m arasında titriyor. Güverte düşmanlarıyla menzil ve vuruş açısı 0,1–0,2 m kayıyor. v0.3'te kayma v·dt kadardı (30 FPS'te 0,37 m).
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** Gemiler ve kayık güncellendikten sonra gemi kipindeki oyuncunun dünya konumunu ve IK hedeflerini yeniden türet (_step sonunda bir p.syncToShip() çağrısı). Alternatif: gemileri oyuncudan önce güncelle.
- **Tekrar üretme:** Gemiyi 11 m/s'de seyrettir. Dümendeyken her game.update'ten sonra p.char.ik.handL ile çark tutamağının o anki dünya konumu arasındaki farkı ölç (≈0,18 m). Güvertede p.pos ile s.localToWorld(local + deckAt) farkını ölç.
- **Kabul testi:** 11 m/s seyirde ve fırtına yalpasında her karede oyuncu konumu ile güverte noktası farkı 0,01 m'den küçük olsun; dümende el–tutamak mesafesi 0,03 m'den küçük olsun; 1/45, 1/60 ve 1/144 sn'lik karelerde sonuç aynı çıksın.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (C-M03: güverte, dümen ve top kipindeki oyuncu gemi güncellemesinden önce konumlanıyor). Denetçi güveni: yüksek. Bilinen sorun: KI-051.

### C-09 — Ambar doluyken güverteye bırakılan sandık güvertenin içinden denize düşüyor (rijit cisim dünyasında gemi yok) (orta)

- **Dosya ve fonksiyon:** js/treasure/treasure.js — treasure.drop / stowInHold / _updateChest; bodies._step
- **Kök neden:** treasure.js:388-391 güvertede bırakılan sandığı stowInHold(p.ship, c, true) ile ambara koymaya çalışıyor. Ambar doluysa 406'da yalnız c.state='ground' yapılıp çıkılıyor. Ardından _updateChest (302) sandığa bir bodies cismi ekliyor. bodies._step zemini yalnız physics.groundAt'ten (arazi + statik platform; bodies.js:136) alıyor; gemi güvertesi ve gövdesi rijit cisim dünyasında tanımlı değil. Ayrıca p.ship bordalanan düşman gemisi olabildiğinden sandık o geminin ambarına konuyor.
- **Oyuncuya etkisi:** 'Ambar dolu' uyarısından sonra hazine sandığı gövdenin içinden suya düşüp yüzüyor; gemi ilerledikçe geride kalıyor. Taşınan sandık kayda da yazılmadığı için (B04) kalıcı kayıp riski var. Co-op'ta diğer eşlerde sandık 'taşınıyor' hayaleti olarak kalıyor (H_coop_ui-ek-statik-194). Bordalamada düşman gemisine bırakılan sandık o gemiyle birlikte yok oluyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Ambar doluysa sandığı ganimet kesesi gibi gemi köküne bağlanan bir 'güverte sandığı' yap (_attachDeck mantığı, 16 T04) ya da bırakmayı reddedip taşımayı sürdür. stowInHold'u yalnız G.ship için çağır. bodies'e gemi güvertesi zemini ekle (yerel uzayda deckAt).
- **Tekrar üretme:** G.ship.hold.chests'i T.holdSlots kadar doldur, bir sandık taşı, güvertede bırakma tuşuna bas: c.state 'ground' oluyor, birkaç saniye sonra 'water' oluyor ve sandık gövdenin altında ya da yanında yüzüyor.
- **Kabul testi:** Ambar doluyken güverteye bırakılan sandık güvertede kalsın ve gemiyle hareket etsin (11 m/s'de 30 sn sonra güverte yerelinde kayma 0,1 m'den az) ya da bırakma reddedilsin. Düşman gemisinde bırakılan sandık kaybolmasın; bu kontrol 16_kosu_poz_ganimet'e eklensin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** H_coop_ui-ek-statik-194 (yalnız ağ yönü kayıtlı), B04 (kayıt yönü)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-052.

### C-10 — Gemi ve kayık iskele, direk ve bina çarpıştırıcılarını yok sayıyor (orta)

- **Dosya ve fonksiyon:** js/ship/ship.js — Ship.update/_grounding/_obstacles; Rowboat.update
- **Kök neden:** Ship.update yalnız _grounding (arazi, 9 sonda) ve _obstacles (Ship.obstacles daireleri) kullanıyor (ship.js:370-372, 417-459); physics hücre ızgarasındaki iskele yan kutuları, direkler ve binalar sorgulanmıyor. Rowboat.update yalnız araziye ve kendi gemisine bakıyor (ship.js:805-827); diğer gemiler ve kayalıklar da hesaba katılmıyor.
- **Oyuncuya etkisi:** Gemi iskelenin ve rıhtımın içinden geçiyor, limana yanaşırken iskeleyi deliyor. Kayık iskele ayaklarının, diğer gemilerin ve deniz kayalıklarının içinden geçiyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Gemi kapsülünü (baş–kıç doğru parçası, yarıçap B·0,45) physics.cells içindeki su hattını kesen kutu ve çemberlere karşı sına, tepkiyi _collide ile ver. Demir/dock bölgesinde geminin sıkışıp titrememesi için halat kuvvetini sınırla. Kayık için physics.resolve (r≈1,0), Ship.obstacles ve diğer gemi gövdeleri eklensin.
- **Tekrar üretme:** Limanda çapayı kaldır, gemiyi iskeleye dik doğrult, yelkenleri tam aç: gemi iskelenin içinden geçiyor.
- **Kabul testi:** Gemi iskeleye/rıhtıma 5 m/s'de çarptığında kutunun 0,3 m'den fazla içine girmesin ve 'crash' olayı üretsin. Kayık iskele ayağı ve diğer gemiyle çakışmasın. Demirli gemi iskeleye sıkışıp titremesin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #39
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). C/REQ5 karşı doğrulaması gemi ve kayığın iskeleye çarpmasının sınanmadığını ve Ship.obstacles'ın iskeleyi içermediğini doğruladı (ship.js:442-459; bilinen #39 açık). Direk ve bina kısmı ayrıca sınanmadı. Denetçi güveni: kesin. Bilinen sorun: KI-053.

### C-11 — Güvertede karakter itişmesi yok: bordalayan düşmanlar oyuncunun içinden geçiyor (düşük)

- **Dosya ve fonksiyon:** js/game/crowd.js — crowd.update
- **Kök neden:** crowd.js:17 oyuncuyu yalnız 'ground' ve 'swim' kiplerinde ajan sayıyor. Güverte düşmanlarının e.pos'u her _place'te gemi yerelinden yeniden türetildiği için (enemies.js:1162-1166, 1182) crowd'un yaptığı düzeltme bir sonraki adımda siliniyor.
- **Oyuncuya etkisi:** Güverte savaşında düşman ile oyuncu üst üste biniyor; vuruş açısı ve menzil tutarsızlaşıyor; oyuncu düşmanın içinden geçerek kaçabiliyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** Her gemi için yerel bir ajan listesi tut (oyuncu.local ve e.local), aynı itme hesabını yerel koordinatta uygula, ardından clampDeck çağır.
- **Tekrar üretme:** Bordalama sırasında düşmana doğru yürü: |p.local − e.local| uzun süre 0,3 m'nin altında kalıyor.
- **Kabul testi:** Güverte savaşında oyuncu–düşman yerel mesafesi her karede (r1 + r2) − 0,05 m'den büyük ya da eşit olsun.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** D-20 / 11 #5
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). H alanının denetçisi bağımsız olarak aynı belirtiyi kaydetti (H-23 etkisi: 'Bordalamada düşmanlar oyuncunun ve direklerin içinden geçiyor'). Denetçi güveni: kesin. Bilinen sorun: KI-169.

### C-12 — Güvertede yalnız direkler engel: toplar, dümen ve ambar kapağı gibi güverte nesnelerinin içinden yürünüyor (düşük)

- **Dosya ve fonksiyon:** js/ship/ship.js — Ship.clampDeck
- **Kök neden:** ship.js:184-196 clampDeck yalnız gövde sınırını ve 0,45 m'lik direk dairesini uyguluyor. model.cannons ve stations (helm, hold, bucket) için itme yok; düşmanlar da aynı işlevi kullanıyor (enemies.js:1118).
- **Oyuncuya etkisi:** Oyuncu ve güverte düşmanları topların ve dümen çarkının içinde durabiliyor; görsel iç içe geçme oluşuyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** clampDeck'e top (r≈0,7), dümen (r≈0,6) ve ambar kapağı (kutu) itmeleri ekle. Etkileşim noktaları dairelerin dışında kalacak şekilde konumlandırılsın.
- **Tekrar üretme:** Güvertede cn.local konumuna doğru yürü: p.local top merkezine 0,3 m'den fazla yaklaşabiliyor.
- **Kabul testi:** Güverte nesnelerinin merkezine nesne yarıçapından daha fazla yaklaşılamasın; bu kontrol 04_karakter'e eklensin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 D_fizik iyileştirme önerisi 'Güverte çarpıştırıcıları: toplar, dümen, ambar kapağı'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-170.

### C-13 — Kamera çarpışması yarıçapsız doğru testi; görselden küçük ada yapı kutularında kamera duvarın içine giriyor (orta)

- **Dosya ve fonksiyon:** js/player/camera.js — tpCamera.update
- **Kök neden:** camera.js:112-120 yalnız baş→kamera doğrusunu sınıyor; kamera için yarıçap ya da küre süpürmesi yok (yakın düzlem 0,1 m, köşe ≈0,14 m). Engel bulunca kamera doğru boyunca yalnız 0,1 m geri çekiliyor (119), bu yüzden sıyırarak yaklaşılan duvarda dik uzaklık birkaç cm'ye inebiliyor. Ada yapılarının çarpışma kutuları görselin %60–90'ı (islands.js:496, colK 0,6–0,9), ve bu yapılar yakın-kamera silinmesine bilerek dahil edilmemiş: nearfade.js:114 'zemin/yapı: kamera çarpışması korur' diyor. Çarpışma aramasından sonra yapılan dikey kıskaçlar (zemin 136, güverte 141-144, su 150-152) yeniden sınanmıyor.
- **Oyuncuya etkisi:** Ada kasabası, kule, değirmen, kale ve maden yapılarının yanında kamera dönerken görsel duvarın 0,3–1,2 m içine girebiliyor; ekranı yapının iç yüzü ya da boşluk kaplıyor ('kamera duvar içinden geçiyor'). Başlangıç limanında kutular 0,2 m büyük tutulduğu için orada sorun yok.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Kamera için 0,25 m yarıçaplı süpürme ekle (lineBlocked'a 'pad' seçeneği: çember r+pad, kutu hw/hd+pad). Ada yapı kutularını görsel sınırlara getir (colK ≥ 1 ya da yalnız kamera için ayrı pay). Kıskaçlardan sonraki son konumu bir kez daha blocked() ile sına.
- **Tekrar üretme:** Bir adada kasaba halkasındaki bir yapının (colK 0,78) ya da değirmenin (0,6) duvarına sırtını daya, kamerayı 360° döndür; kamera konumunun yapının görsel sınır kutusu (Box3.setFromObject) içinde kaldığı kareleri say.
- **Kabul testi:** 6 ada yapısı × 2 eğim × 48 açıda kamera konumu hiçbir yapının görsel sınır kutusunun içinde olmasın ve yakın düzlemin 4 köşesi de dışarıda kalsın; bu kontrol 17_kamera_kararma'ya K13 olarak eklensin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #43 (oyuncunun duvara gömülmesi kayıtlı; kamera yönü kayıtlı değil)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). I alanının denetçisi bağımsız olarak aynı kusuru buldu (I-13: kamera nokta olarak çarpışıyor, duvara dayalı oyuncuda ve ada yapılarında kamera duvarın içine girebiliyor); C/SYS2 karşı doğrulaması ada yapı kutularının görselden küçük olduğunu (colK 0,6–0,9; islands.js:495-500, bilinen #43) doğruladı. Denetçi güveni: yüksek. Bilinen sorun: KI-054.

### C-14 — Görsel güncellemeler alt adımda koşuyor: düşük FPS'te maliyet alt adım sayısıyla katlanıyor (düşük)

- **Dosya ve fonksiyon:** js/game/game.js — game._step; Ship.updateTransform/_animate; Player.update; enemies.update; effects.update
- **Kök neden:** Ship.update → updateTransform → _animate (yelken köşe noktası animasyonu; ship.js:380, 562, 584+), Player.update sonundaki c.update(dt) (karakter karıştırıcısı ve IK; player.js:416), enemies.update içindeki e.char.update(edt) (enemies.js:1606) ve effects parçacık tamponu (effects.js:121-147) hep alt adım sistemlerinin içinde.
- **Oyuncuya etkisi:** 10–30 FPS'te bu işler kare başına 2–6 kez yapılıyor; zaten yavaş olan cihazda kare süresi daha da uzuyor. MAX_SUB=6 sınırı sarmalı durdursa da oyun zamanı yavaşlıyor. 09_performans yalnız n=1 ölçtüğü için bu maliyet görünmüyor; C-02 nedeniyle 60 Hz'de de 2× oluyor.
- **Öncelik:** düşük · hedef faz: Faz 3 (+Faz 8)
- **Önerilen çözüm:** Alt adımda yalnız durum entegrasyonu kalsın. Animasyon karıştırıcısı, yelken köşe animasyonu, parçacık tamponu yazımı ve root.position kopyası kare başına bir kez (C-01'deki ara değerlemeyle) yapılsın.
- **Tekrar üretme:** 09_performans'taki ölçüm işlevini (window._M) game.update(1/15) ile çalıştır: kare başına ms, game.update(1/60)'a göre yaklaşık 4 kat çıkıyor.
- **Kabul testi:** game.update(1/15)'in kare başına maliyeti game.update(1/60)'ın en çok 1,5 katı olsun (yalnız fizik alt adımlansın).
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının karşı doğrulayıcısı (C-M04) ve J alanının denetçisi (J-26) aynı kusuru bağımsız olarak buldu: alt adım döngüsü görsel ve animasyon işlerini her alt adımda yapıyor. Denetçi güveni: yüksek. Bilinen sorun: KI-055.

### C-15 — Hayvanlar 1,6 m'lik basamakla platformlara ışınlanıyor; yerçekimleri yok (düşük)

- **Dosya ve fonksiyon:** js/wildlife/animals.js — Animal._pose / Animal._walk
- **Kök neden:** animals.js:625 physics.groundAt(x, z, pos.y + 1) kullanıyor; bu 1,6 m'lik basamak penceresi demek (oyuncuda 0,6, düşmanda 0,65; D-14 yalnız düşmanda düzeltildi). _walk (555-568) yalnız arazi yüksekliği eşiğine bakıyor (h > 0,35); pos.y = gy anında atanıyor, düşüş yok.
- **Oyuncuya etkisi:** Domuz, maymun ve yengeç iskeleye, sunağa ve yük yığınına anında tırmanıyor, kenardan anında iniyor. Oyuncu platforma çıkarak saldırgan hayvandan kaçamıyor; hayvanlar beklenmedik yerlerde beliriyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** groundAt(x, z, pos.y + 0.05) kullan. Hareketten önce basamak denetimi yap: yeni zemin pos.y + 0,65'ten yüksekse yön değiştir. Basit yerçekimli düşüş ekle.
- **Tekrar üretme:** İskele kenarındaki kumda bir domuzu iskelenin altına doğru yürüt: tek adımda iskele üstüne çıkıyor.
- **Kabul testi:** Hayvanın ardışık iki alt adım arasındaki yukarı yönlü sıçraması 0,7 m'yi geçmesin; 0,65 m'den yüksek bir platforma yandan çıkamasın.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** D-14 (düşmanda düzeltildi, hayvanda düzeltilmedi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-171.

### C-16 — Hedefsiz uzak düşmanlar 0,066 ya da 0,25 sn'lik tek adımla güncelleniyor; alt adım korumasını boşa çıkarıp ince engelden geçebiliyor (düşük)

- **Dosya ve fonksiyon:** js/game/enemies.js — enemies.update (AI seyreltme)
- **Kök neden:** enemies.js:1599-1606: hedefi olmayan düşman 45–90 m'de 0,066 sn, 90 m'nin ötesinde 0,25 sn biriktirdiği edt ile e.update(edt) çağrısı alıyor. _move tek physics.resolve yapıyor (1123): 4,3 m/s × 0,25 sn = 1,07 m'lik adımda resolve 'en yakın kenar' kuralıyla düşmanı duvarın öbür yanına çıkarabiliyor (02 F-08 koşusu).
- **Oyuncuya etkisi:** Kampına dönen, kaçan ya da araştıran düşman ince duvar, çit veya mezar levhasının arkasına geçebiliyor; oyuncu yaklaştığında düşman yapının içinde ya da duvarın yanlış tarafında bulunuyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** edt'yi ≤ 1/30 sn'lik parçalara bölüp e.update'i parçalı çağır, ya da yalnız algı ve karar katmanını seyrelt, hareketi her alt adımda yap. 'return', 'flee' ve 'investigate' durumlarını seyreltmeden muaf tut.
- **Tekrar üretme:** Oyuncudan 100 m uzakta, hedefsiz bir haydudu 'return' durumunda (eve koşarken) 0,3 m kalın bir duvara doğru gönder; 60 kez enemies.update(1/60) çağır (0,25 sn birikir): düşman duvarı geçiyor.
- **Kabul testi:** Seyreltilen düşmanın tek adımdaki yer değiştirmesi kendi yarıçapını (≈0,4 m) geçmesin; 0,3 m'lik duvar 20 denemede hiç delinmesin.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** F-08 (kısmen düzeltildi: hedefli düşman artık muaf)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). C/REQ1 karşı doğrulaması uzak ve hedefsiz düşmanların enemies.js:1599-1606'da 0,25 sn + h'lik tek adımla ilerlediğini, bunun küresel 0,1 sn sınırından da büyük olduğunu doğruladı. Denetçi güveni: yüksek. Bilinen sorun: KI-172.

### C-17 — Oyuncu düşüşünde son hız sınırı ve platform süpürmesi yok: 36 m/s'yi aşan düşüş platformu kaçırıyor (düşük)

- **Dosya ve fonksiyon:** js/player/player.js — Player._updateGround
- **Kök neden:** player.js:588 pos.y += vel.y*dt yapıyor, ardından 596'da groundAt(x, z, pos.y) çağırıyor (pencere 0,6 m). bodies'teki max(prevBottom) düzeltmesi (bodies.js:133-136) oyuncuya uygulanmamış; GRAV −22 ile son hız sınırı da yok. h=1/60'ta düşüş hızı 36 m/s'yi (≈29,5 m düşüş) aşarsa iskele, sunak ya da T başlık güvertesi kaçırılıyor.
- **Oyuncuya etkisi:** Çok yüksekten (uçurum, fener) su üstündeki iskeleye düşen oyuncu iskeleden geçip suya düşüyor ve ölümcül düşüşten kurtuluyor. Yüksek bir platformun (top > 3) içine düşerse yan kutu onu yana fırlatıyor. v0.3'te eşik FPS'e bağlıydı: 10 FPS'te 0,8 m, 30 FPS'te 7,4 m düşüş yetiyordu.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** groundAt'i max(önceki ayak y, yeni y) ile sorgula (bodies gibi) ya da prev→new dikey parça platform düzlemini kesiyorsa oyuncuyu platforma yerleştir; 45 m/s civarında bir son hız sınırı ekle.
- **Tekrar üretme:** Oyuncuyu iskelenin (top 2,25) 40 m üstüne koy (p.pos.y = 42, vel = 0, onGround = false) ve DK.sim(4, 1/60) çalıştır: sonunda pos.y pierTop'un altında.
- **Kabul testi:** 5–80 m yüksekten iskele, sunak ve T başlık üzerine yapılan düşüşlerde oyuncu her kare hızında (1/10–1/144) platformun üstünde dursun ve düşme hasarı alsın.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** D-07 (cisimler için düzeltildi; oyuncu için düzeltilmedi)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). C/SYS3 ve C/REQ2 karşı doğrulamaları düşüşte süpürme olmadığını ve pencerenin v·h ≤ 0,6 m, yani h = 1/60'ta en çok 36 m/s olduğunu doğruladı; hızlı düşüşü sınayan test yok. Denetçi güveni: kesin. Bilinen sorun: KI-173.

### C-18 — Fizik testlerinin kanıt gücü zayıf: 03_fizik_dt beklenti içermiyor, #6 eski 64 hücre hatasını ayırt etmiyor, istenen test türleri eksik (orta)

- **Dosya ve fonksiyon:** tests/scenarios/03_fizik_dt.js — senaryo adımları (03_fizik_dt.js ve 03_fizik_duzeltmeler.js #6)
- **Kök neden:** 03_fizik_dt.js yalnız sayı döndürüyor ve hiç expect içermiyor (grep: 0); 12. belgedeki 'GEÇTİ' sonuçları elle okunmuş. Ölçülen 15/30/60 FPS değerlerinin hepsi 60'ın tam böleni (45/50/59,94/144 yok). 03_fizik_duzeltmeler #6 eksene paralel 400 m'lik bir doğru kullanıyor (AABB'de 26 hücre); v0.3 kodu da bu doğruda true döndürüyor (Node: eksenParalel400m=true), oysa v0.3'ün atladığı çapraz doğru (≥ 9×9 hücre) sınanmıyor. Ani FPS düşüşünde hareket, dar kapı, gülle–statik engel, yüksekten düşme hasarı, sandık–güverte, kamera yarıçapı ve gemi merdiveni senaryoları hiç yok.
- **Oyuncuya etkisi:** v0.4'teki iddiaların bir kısmı (FPS bağımsızlığı, 64 hücre düzeltmesi) testle kanıtlanmış görünüyor ama bu testler regresyonu yakalamıyor. C-01–C-05, C-09 ve C-17 testlerden kaçmış durumda.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** 03_fizik_dt'ye beklenti ekle (60 FPS'e göre ≤ %1) ve 45/59,94/90/144 FPS'i dahil et. #6'ya 204 m'lik çapraz doğru ekle (v0.3'te false dönüyor). Requirements tablosundaki eksik senaryoları yaz ve 12. belgeye işle.
- **Tekrar üretme:** 03_fizik_duzeltmeler #6'yı v0.3'ün physics.js'iyle çalıştır: yine geçiyor. Doğrulama için /tmp/denetim_alan/C_fizik/los_test.mjs ve los_test2.mjs kullanılabilir.
- **Kabul testi:** #6'nın çapraz sürümü v0.3 kodunda KALSIN, v0.4'te GEÇSİN. 03_fizik_dt beklentili olarak 7 kare hızında koşsun. Eksik senaryolar eklenip 12. belgede kayıt altına alınsın.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C/DOC1 karşı doğrulaması 04 §4.5'teki 'Doğrulama'nın kanıt değeri taşımadığını ve testin 64 hücre farkını göstermediğini doğruladı; K alanının denetçisi (K-13) expect'siz betiklerin her durumda geçtiğini bağımsız olarak kaydetti. Denetçi güveni: kesin. Bilinen sorun: KI-056.

### C-M01 — Düşman yapay zekâsındaki çağrı başına (dt'siz) olasılıklar alt adım hızıyla ölçekleniyor; saldırganlık ekran tazeleme hızına bağlı (orta)

- **Dosya ve fonksiyon:** js/game/enemies.js — Enemy._act (828, 848), Enemy._meleeOrStrafe (879, 897)
- **Kök neden:** `Math.random() < p` her güncellemede dt'siz sınanıyor: 828 ikincil menzilli saldırı ve bıçak p = 0,02; 848 yan adım yön değişimi p = 0,004; 879 alay p = 0,01; 897 kuşatmacı fırsat saldırısı p = 0,05. enemies sistemi alt adımda çalıştığı için (game.js:187, 237) saniyedeki deneme sayısı saniyedeki alt adım sayısına eşit: testlerin tam dt'sinde 60, gerçek 60 Hz'de (zaman damgası yuvarlaması + 1e-6 eşiği, C-02) ≈100, 120/144 Hz'de 120/144. v0.3: var; aynı satırlar (817, 837, 868, 886) kare başına çalışıyordu ve FPS'e bağlıydı. v0.4: var; biçimi değişti ve test ortamında görünmüyor. 02 ve 11'de kaydı yok.
- **Oyuncuya etkisi:** Bıçak veya ikincil tabanca için bekleme ortalaması saniyede 60 denemede 0,83 sn, gerçek 60 Hz'de 0,50 sn, 144 Hz'de 0,35 sn. Kuşatmacı fırsat saldırısında 0,33 → 0,20 → 0,14 sn; yön değiştirmede 4,2 → 2,5 → 1,7 sn. Aynı zorluk ayarında düşmanlar 144 Hz'de ve (C-02 yüzünden) sıradan 60 Hz ekranda testlerdekinden daha saldırgan ve hareketli. Dengeleme testleri tam 1/60 dt kullandığından bunu göremiyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Olasılıkları orana çevir: `Math.random() < 1 - Math.exp(-λ·dt)`, λ = −ln(1−p)·60 (ör. p = 0,02 → λ ≈ 1,21/sn). Alternatif olarak kararları sabit 10–20 Hz'lik bir yapay zekâ tıkına taşı. C-01/C-02 için gerçek sabit adım + biriktirici kurulursa bu sorun da kendiliğinden düzelir.
- **Tekrar üretme:** Node: p = 0,02 için 1/60, gerçek 60 Hz dizisi (16,7/16,7/16,6 ms) ve 1/144 adımlarında ilk başarıya kadar geçen süreyi 10 000 denemede ölç; ortalamalar 0,83 / 0,50 / 0,35 sn çıkar. Sayfada: Avcı düşmanını 8 m'ye koy, görüş açık, rangedCd = 0; game.update'i 1/60 ve 1/144 ile ilerletip _startRanged'e kadar geçen süreyi say.
- **Kabul testi:** Aynı durumda karar gecikmesi ortalaması 1/60, 1/144 ve 16,7/16,7/16,6 ms dizisinde ±%5 içinde kalır. Bunu doğrulayan bir kontrol 05_dusman_ai.js'e eklenir.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-057.

### C-M02 — Tabanca ışını kameradan çıkıyor; kamera ile oyuncu arasındaki (oyuncunun arkasındaki) düşman vuruluyor (orta)

- **Dosya ve fonksiyon:** js/game/combat.js — combat.shoot (243-254), combat.raycast (271-298)
- **Kök neden:** Işının kökeni engine.camera.position (244). raycast hedefleri yalnız `proj < 0 || proj > maxD` koşuluyla eliyor (281) ve en küçük proj değerini seçiyor (283). Oyuncunun kendisi `ignore` ile dışarıda, ama kamera ile oyuncu arasındaki hedefler dışarıda değil. Engel denetimi de kameradan yapılıyor (295, tMin 0,05). v0.3: var (combat.js:236, 263-287). v0.4: var. 02 ve 11'de kaydı yok (F-16 yalnız çarpıştırıcıları kapsıyor).
- **Oyuncuya etkisi:** Kalça atışında (kamera 4,6 m geride, omuz 0) oyuncunun 1–2 m arkasında kamera ekseninde duran düşman ya da hayvan, öndeki nişan alınan hedefin yerine vuruluyor. Nişanlıyken (2,3 m, omuz 0,65) sağ-arkada 1,2 m'deki düşman vuruluyor. Node kopyası (/tmp/denetim_alan/karsit_C/pistol.mjs): arkadaki 1,0/1,5/2,0 m'lik düşman d = 3,6/3,1/2,6 m'de isabet alıyor. Kuşatma halkası (enemies.js:891, 3,2–4,3 m) ve arkadan saldıran kuşatmacılar yüzünden yakın dövüşte sık görülür. Tek mermi (2 sn dolum) boşa gidiyor ya da oyuncu kendi bedeninin içinden arkaya ateş edebiliyor.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** İki aşamalı ışın kullan. Önce kamera ışınıyla nişan noktasını bul: kamera–baş uzaklığı + 0,3 m'den yakın hedefleri at, oyuncunun önündeki ilk engel ya da hedefi al. Sonra namludan (249) bu noktaya ikinci bir ışın at; isabeti ve lineBlocked denetimini bu ışınla yap.
- **Tekrar üretme:** Sayfada: düz zeminde oyuncu, kameranın yaw/pitch'i öne dönük. Bir düşmanı oyuncunun 1,5 m arkasına, kamera eksenine; ikinci düşmanı nişangâhın altında 10 m öne koy. p.equipped = 'pistol', p.loaded = true; DK.combat.shoot(p) çağır: arkadaki düşmanın canı düşer, öndekinin düşmez.
- **Kabul testi:** Oyuncunun 0,3–4 m arkasındaki hiçbir hedef, kamera hangi kipte olursa olsun, ateşle hasar almaz; öndeki hedef isabet alır. Kontrol 05_dusman_ai.js'e eklenir.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi aynı kök nedeni kaydetti (C-06: 'tabanca ışını kameradan çıkıyor'). Bilinen sorun: KI-058.

### C-M03 — Güverte, dümen ve top kipindeki oyuncu gemi güncellemesinden önce konumlanıyor; bir alt adım geride çiziliyor ve alt adım boyu değiştikçe gemiye göre titriyor (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game._step (225-233); Player._updateDeck (player.js:889), _updateHelm (915, 920-921), _updateCannon (934), _updateClimb (962)
- **Kök neden:** _step'te önce p.update çalışıyor (226). Güverte kiplerinde dünya konumu s.localToWorld ile (ship.js:170, root.matrixWorld) hesaplanıyor ve karakter kökü bu konuma yerleştiriliyor (player.js:394). Gemi ise sonra ilerliyor (228-230) ve matrisi updateTransform'da yenileniyor (ship.js:561). Adımdan sonra yeniden eşitleme yok; bu yüzden oyuncu ve dümen IK hedefleri gemiden v·h kadar geride kalıyor. C-02 yüzünden 60 Hz'de h 1/60 ile 1/120 arasında değiştiğinden bu gecikme kareden kareye değişiyor. v0.3: var (game.js:186-191'de aynı sıra), ama sabit FPS'te sabit ofset olarak, titreşim yok. v0.4: var ve titreşiyor. 02 ve 11'de kaydı yok.
- **Oyuncuya etkisi:** Sloop tam hızda (11 m/s, shipModel.js:10) ofset 18,3 cm ile 9,2 cm arasında değişiyor (60 Hz'de 2,2,1 deseni). Güvertede yürüyen, dümende ya da topta duran karakter gemiye göre ~9 cm sarsılıyor; eller dümenin parmaklıklarının arkasında kalıyor. Güverte kipinde kamera gecikmiş başı izlediği için gemi de ekranda titriyor. Seyir oyunun ana etkinliği olduğundan sık görülür; görsel bir sorun, ilerlemeyi etkilemiyor (kod analizi, orta güven).
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Gemiler güncellendikten sonra (_step sonunda ya da tüm alt adımlardan sonra bir kez) güverte, dümen, top ve tırmanış kipindeki oyuncunun dünya konumunu ve karakter kökünü yerel koordinattan yeniden hesapla. Alternatif olarak karakteri gemi köküne bağla. Uzun vadede sabit adım + ara değerleme.
- **Tekrar üretme:** Sayfada: gemi tam yelkenle 11 m/s, oyuncu dümende. game.update'i 0,0167/0,0167/0,0166 dizisiyle 30 kare ilerlet; her kare sonunda |p.pos − s.localToWorld(dümenin yerel noktası)| değerini ölç. Değer 0,092/0,092/0,183 m arasında dönüşümlü gider.
- **Kabul testi:** Her kare sonunda oyuncunun dünya konumu ile gemi yerel konumunun dünyaya çevrilmiş hali arasındaki fark dt dizisinden bağımsız olarak &lt; 1 cm. 04'teki C08 dümen IK testi gemi 11 m/s'de giderken de geçer.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi aynı kusuru bağımsız olarak buldu (C-08). Bilinen sorun: KI-051.

### C-M04 — Alt adım döngüsü görsel ve arayüz işlerini de n kez yapıyor; gerçek 60 Hz'de benzetim maliyeti ölçülenin ≈1,67 katı, düşük FPS'te 2–6 katı (orta)

- **Dosya ve fonksiyon:** js/game/game.js — game.update/_step (201-207, 222-238); Character.update (character.js:845-853, player.js:416); enemies.update e.char.update (enemies.js:1606); animals anim.update (animals.js:636); bosses anim.update (bosses.js:625, 686, 805); effects.update parçacık döngüsü (effects.js:121-146); interact.update aday taraması ve 'prompt' olayı (interact.js:21-71); shipControl yangın parçacıkları (shipControl.js:282-283)
- **Kök neden:** Animasyon karıştırıcısı ve IK, parçacık tamponunun doldurulması, etkileşim adayı taraması ve istem olayı, alt adımda çalışan sistemlerin içinde. Oysa game.js:183'teki yorum görsel sistemlerin kare başına çalıştığını söylüyor. C-02 yüzünden 60 Hz'de karelerin 2/3'ünde n = 2. 10. belgedeki 'benzetim ≤ 2 ms/kare' ölçümü 09_performans.js:6'da `DK.game.update(1/60)` ile, yani n = 1 ile alındığı için bu artış hiç ölçülmedi. v0.3: yok (tek geçiş). v0.4: var. 02 ve 11'de kaydı yok.
- **Oyuncuya etkisi:** Gerçek 60 Hz'de alt adım sistemlerinin CPU maliyeti ortalama ≈1,67 kat; 30 FPS'te 2–3 kat, 10 FPS'te 6 kat. Maliyet tam da kare bütçesi zaten aşılmışken artıyor (6 alt adımla sınırlı bir 'ölüm sarmalı'); zayıf dizüstülerde FPS düşüşünü derinleştirir. Top güllesi izi, yangın ve lav parçacıklarının yoğunluğu da alt adım sayısıyla artıyor (orta güven; büyüklük zaman damgası modeline dayanıyor).
- **Öncelik:** orta · hedef faz: Faz 3 (+Faz 8)
- **Önerilen çözüm:** Karakter animasyonunu, IK'yi, parçacık tamponunu, etkileşim adayını ve istem olayını tüm alt adımlardan sonra bir kez, toplam dt ile çalıştır; alt adımda yalnız durum bütünleştirmesi kalsın. C-02 eşiğini zaman damgası yuvarlamasını yutacak biçimde düzelt (ör. ceil(dt/STEP − 0,01)) ya da biriktiriciye geç. Performans testine gerçekçi bir dt dizisi (16,7/16,7/16,6 ms) ekle.
- **Tekrar üretme:** Sayfada, limanda: 300 kareyi önce dt = 1/60 ile, sonra 0,0167/0,0167/0,0166 dizisiyle game.update'le koş. performance.now ile süreyi, sayaçla Character.update çağrı sayısını ölç; ikinci dizide maliyet ≈1,67 kat çıkar.
- **Kabul testi:** Kare başına Character.update/mixer, parçacık doldurma ve 'prompt' olayı n'den bağımsız olarak bir kez çalışır. Gerçekçi 60 Hz dizisinde benzetim maliyeti tam 1/60 ölçümünün ≤1,1 katıdır. 10. belge yeni ölçümle güncellenir.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi (C-14) ve J alanının denetçisi (J-26) aynı kusuru bağımsız olarak buldu. Bilinen sorun: KI-055.

### C-M05 — Algı ve _los görüş hattı varsayılan uç paylarıyla (tMax 0,98) sınanıyor: hedefin dibindeki ince engel uzaktan yok sayılıyor (düşük)

- **Dosya ve fonksiyon:** js/game/enemies.js:555; js/world/physics.js:194-195 (lineBlocked varsayılanları tMin 0,02 / tMax 0,98 / rScale 0,8) — Düşman algısı / _los → physics.lineBlocked
- **Kök neden:** Düşman algısı ve _los, lineBlocked'ı varsayılan oransal uç paylarıyla çağırıyor (physics.js:195: tMin 0,02, tMax 0,98). Doğrunun son %2'si sınanmıyor; uzak mesafede bu pay metrelerce uzunluğa karşılık geldiği için hedefin hemen önündeki ince engel sorgunun dışında kalıyor. v0.3'te de aynı paylar var (v0.3 physics.js:189: `t > 0.02 && t < 0.98`).
- **Oyuncuya etkisi:** Çite ya da alçak duvara yaslanan oyuncu uzaktaki düşman tarafından engelin içinden görülüyor; siper güvenilmez. Karşı doğrulamanın Node ölçümünde 0,2 m'lik çite yaslanan oyuncu 27 m ve üstünden, 0,4 m'lik duvarda bu eşik ≈36,5 m.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** Uç payını oran yerine sabit uzunlukla tanımla (ör. hedef yarıçapı kadar, 0,3–0,5 m) ya da hedefin kendi çarpıştırıcısını sorgudan hariç tutup tMax=1 kullan; zıpkın süpürmesiyle (C-07) birlikte tek görüş hattı yardımcısında topla.
- **Tekrar üretme:** Node'da lineBlocked'ı 0,2 m kalınlıkta bir çit kutusu ve çitin hemen arkasındaki hedefle 10–40 m mesafelerden varsayılan paylarla çağır: 27 m ve üstünde false döner (karşı doğrulama C/UC3'teki ölçüm).
- **Kabul testi:** Hedefin 0,5 m önündeki 0,2 m'lik engel 5–80 m arası tüm mesafelerde görüşü kesmeli; hedefin kendi kutusu sorguyu engellememeli.
- **Sürüm:** v0.3 ve v0.4 (v0.3 için rapor yazımında kod okumasıyla: v0.3 physics.js:189)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). C/UC3 karşı doğrulama düzeltmesinden rapor yazımında ayrı madde olarak çıkarıldı; önerilen çözüm, tekrar üretme ve kabul testi rapor yazımında yazıldı ve ayrıca sınanmadı. Bilinen sorun: KI-168.

---

**5.D Alan D — Kayıt ve dünya kalıcılığı** · 19 denetim maddesi, 2 kaçan madde, 1 ek madde · varsayılan hedef faz: Faz 4

Denetçi özeti: v0.4'te kayıtlar localStorage'da tutuluyor: 3 tek oyunculu, 3 online ve 1 konuk yuvası var, yazım .tmp → .bak → ana sırasıyla yapılıyor, ayrıca yüzeysel bir şema denetimi (save.valid) eklenmiş. v0.3'e göre ada sandıkları, tutsaklar, tapınak bulmacası, patlamış fıçı/kırık sandık, batık gemi ve gemi bölge hasarı artık kayda geçiyor; bunlar 08_kalicilik, 12_kayit_dongusu ve 13_donma P08 testleriyle doğrulanmış. Buna karşın kayıt sürümü v0.3'teki gibi sabit 'version: 1'. Değer okunmuyor, migrasyon zinciri yok ve gelecekteki bir sürüm (999) sorgusuz yükleniyor. İçe aktarma doğrulama yapmıyor, atomik değil ve onay almadan bütün yuvaları .bak yedekleriyle birlikte ezebiliyor; bunu Node ile yaptığım salt-okur denemelerle doğruladım. Dünya kalıcılığında kaya tuzağı ve Martı Batığı sandığı kayda yazılmıyor. Tutsak eylemi kayıtlı 'freed' durumunu denetlemediği için E tuşu basılı tutuldukça sınırsız altın ve XP veriyor. Düşman kampının 'spawned' bayrağı da kayıttan aynen geri yüklendiği için oyuncu kampın yakınında kaydettiyse yüklemede kamp boş geliyor. Co-op'ta ada ve tehlike durumu sonradan katılan konuğa gönderilmiyor, konuğun ada eylemleri de yalnız kendi tarafında kalıyor; konuk ilerlemesi sadece konuğun tarayıcısında ve periyodik kayıt olmadan tutuluyor. Üstelik konuk kaydı başka dünyalardan taşıdığı hikâye bayraklarını ev sahibine sızdırarak ev sahibinin hikâyesini aşama 2'de kilitleyebiliyor. Rütbe, yetenek, görev, keşif, koleksiyon, başarım, kozmetik ve gemi geliştirmelerinin kayıt/yükleme yolu kodda var ama hiçbiri otomatik testle doğrulanmamış; gerçek bir v0.3 kayıt örneğiyle uyumluluk testi de yok.

