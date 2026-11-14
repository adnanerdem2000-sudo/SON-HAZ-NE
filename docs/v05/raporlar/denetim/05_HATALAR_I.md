# AUDIT_CURRENT §5 — Hatalar: I — Karakter, animasyon ve kamera

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — I — Karakter, animasyon ve kamera

### I-01 — Yürüme/koşma/sprint klip hızları kliplerin doğal adım hızıyla eşleşmiyor: sürekli ayak kayması (orta)

- **Dosya ve fonksiyon:** js/player/player.js — Player._locomotion (satır 681–699)
- **Kök neden:** Klip oynatma hızı hs/1,9 (Walk ve WalkBack), hs/5,2 (Run) ve hs/6,6 (Sprint) ile hesaplanıyor (player.js:685, 697–699). Bu referanslar KayKit kliplerinin oran düzeltmesi (kk.js:11 bacak ×1,4) ve 1,8 m ölçekleme sonrasındaki doğal hızlarına göre seçilmemiş. Aynı GLB ve kk.js hattıyla Node'da yapılan ileri kinematik ölçümde, destek evresindeki ayak hızı 4 gövde tipinde de aynı çıktı: Walking_A ≈0,7–0,9, Walking_Backwards ≈0,6–0,9, Running_A ≈3,6–3,9, Running_C ≈3,7–3,9 m/sn. Yalnız yan adım (≈3,5–3,9) için kullanılan 3,6 referansı doğru. Bacağı 0,43 m, kolu 0,47 m olan kısa uzuvlu rig için 1,9/5,2/6,6 değerleri fazla yüksek. 02 C13 sorunu 'Run 0,7 kıskacı' diye ele alıp eşiği 3,7'ye taşıdı; 'normal koşu ve eğilme tam eşleşiyor' varsayımı yanlış olduğundan 3 m/sn'deki kayma ~%14'ten ~%55'e çıktı.
- **Oyuncuya etkisi:** Her harekette ayaklar yerde kayıyor. Ağır kayma yürüme klibinin kullanıldığı hız bandında: çömelme 1,7, nişan/savunma 2,0, sandık 2,6–2,7 ve 2,6–3,7 m/sn arası hızlarda kayma ≈%61. 4,4 m/sn koşuda kayma ≈0,55–0,7 m/sn (%12–16), 7 m/sn sprintte ≈2,1–2,3 m/sn (%30–33). Sorun yalnız görsel, işlev kaybı yok. [Doğrulamayla düzeltildi: denetçi koşu ve sprintte bilek kemiğini ölçtüğü için kaymayı ~1,2 ve ~3 m/sn bulmuştu; koşu kliplerinde temas ayak ucunda. 'Sprint koşudan zor ayırt ediliyor' ifadesi abartılı: Running_C'nin dikey sıçraması ve adım genliği daha büyük (0,71 / 0,63 m), 7 m/sn'deki kadans 4,4 m/sn koşudakinden %25 yüksek.]
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 7
- **Önerilen çözüm:** 1) Klip doğal hızlarını yüklemede temas noktasından (toesl/toesr) ölç ya da temas noktası ölçümüne göre sabitle: Walk≈0,75, WalkBack≈0,72, Run≈Sprint≈4,5 m/sn; yan adımdaki 3,6 makul. [Doğrulama düzeltmesi: özgün öneri Run≈3,7 ve Sprint≈3,8 idi; uygulanırsa 4,4 m/sn'de ayak ters yönde ≈1 m/sn kayar.] 2) _locomotion'da timeScale = hs/doğalHız olsun; Walk→Run eşiğini histerezisle birlikte yeniden belirle ve kıskaçları yeni referans hızlara göre genişlet. 3) Eşik çevresinde iki klibi ağırlıkla karıştır (02 önerisi). 4) Oynatma hızını uzak oyunculara da gönder (I-15). [Faz 7 tasarım doğrulaması] Faz 7 tasarımı aynı klipleri destek ayağı yöntemiyle ölçtü: 1,5 cm eşikte Walking_A 0,71, Walking_Backwards 0,77, Running_A 3,75, Running_C 3,79 m/sn (inc_gait_med.mjs). Koşu referansı I karşı doğrulamasının temas noktası ölçümüyle (4,4–4,6 m/sn) çelişiyor; K7-9 klip hızını 1,5 cm eşikle ölçülen doğal hıza bağlamayı karara bağladı. Yukarıdaki sabit değerler Faz 7 ölçümüyle kesinleşmeden uygulanmamalı.
- **Tekrar üretme:** Tarayıcıda oyuncu karadayken DK.input.down.add('KeyW') ile 2 sn boyunca DK.sim(1/60) adımları at. Her adımda destek ayağının temas noktasının (p.char.bones.toesl/toesr ya da kemiğin kendi döngü minimumu) dünya yatay hızını ölç: koşuda ≈0,6 m/sn çıkar, olması gereken ≈0. Ağır kaymayı görmek için çömelerek (1,7 m/sn) ya da nişan alarak (2,0 m/sn) yürü. [Doğrulama düzeltmesi: özgün adım footl/footr'nin yere 2 cm yaklaştığı kareleri kullanıyordu; koşuda bilek kemikleri hiçbir karede yere 2 cm yaklaşmıyor.] Node: /tmp/denetim_alan/fk4.mjs (kk_anims.glb + kk.js kopyası) doğal hızları verir.
- **Kabul testi:** Yeni test (ör. 18_animasyon_senkron.js): 1,5 / 2,7 / 4,4 / 7,0 m/sn sabit hızda ve nişan/savunmada geri yürürken destek ayağı temas noktasının dünya yatay hızının medyanı &lt; 0,25 m/sn (ya da gövde hızının %10'u). 16 K05, K06 ve 04 C10 geçmeye devam etmeli; 04 C13 (3 m/sn'de Walk beklentisi) yeni eşiğe göre güncellenmeli [doğrulama eki].
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C13 (yanlış varsayımla kapatıldı; 06. belgede 'Düzeltildi'); 02 C_oyuncu önerisi 'Yürüme/koşma arasında hız tabanlı karıştırma'
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Kök neden doğrulandı. player.js:685 ve 697–699: Walk/WalkBack hs/1,9 (kıskaç 0,5–1,9), Run hs/5,2, Sprint hs/6,6. v0.3 player.js:570–575'te referanslar aynı (Walk eşiği 2,6, Run alt kıskacı 0,7). Gerçek js/core/kk.js hattıyla 5 gövde tipinde bağımsız Node ölçümü yaptım (/tmp/denetim_alan/karsit_karakter/fk_kayma.mjs, fk_bagimsiz.mjs, fk_iz.mjs, fk_yan.mjs). Sonuçlar: Walking_A temas hızı bilekte 0,63–0,72, parmakta 0,70–0,75 m/sn; Walking_Backwards 0,67–0,76 m/sn. Running_A ve Running_C bilekte 3,6–3,9 m/sn, ama koşuda temas ayak ucunda: temas anında bilek yerden ≈0,13 m, parmak ≈0,02 m yüksekte ve parmak hızı 4,4–4,6 m/sn. Yan adım bilekte 3,2–3,4, parmakta 3,9–4,0 m/sn. Oyunun eşlemesiyle temas noktasındaki kaymanın medyanı: 1,7 / 2,0 / 2,64 / 3,0 m/sn'de Walk ile %61–62 (1,0–1,9 m/sn); 4,4 m/sn'de Run ×0,85 ile 0,55–0,71 m/sn (%12–16); 7 m/sn'de Sprint ×1,06 ile 2,1–2,3 m/sn (%30–33). 3,0 m/sn'de kayma v0.3'te (Run ×0,7) %4–9, v0.4'te %61. C13'ün kaymayı büyüttüğü doğru. 02_HATA_LISTESI.md:787–789'da C13 'Düşük' derecelenmiş. Hata v0.3'te de var, v0.4'te de. Düzeltme/ek: 1) Koşu ve sprint etkisi abartılmış. Denetçi bilek kemiğini ölçmüş, oysa koşu kliplerinde temas ayak ucunda. 4,4 m/sn koşuda kayma ~1,2 değil, ≈0,55–0,7 m/sn (%12–16). 7 m/sn sprintte ~3 değil, ≈2,1–2,3 m/sn (%30–33). Ağır kayma yürüme bandında: çömelme 1,7, nişan/savunma 2,0, sandık 2,6–2,7 ve 2,6–3,7 m/sn arası; burada kayma %61. 2) Önerilen Run≈3,7 ve Sprint≈3,8 referansları yanlış. Uygulanırsa 4,4 m/sn'de ayak ters yönde ≈1 m/sn kayar. Temas noktası ölçümüne göre değerler şöyle olmalı: Walk≈0,75, WalkBack≈0,72, Run≈Sprint≈4,5 m/sn; yan adımdaki 3,6 makul. 3) Tekrar üretme adımı yazıldığı gibi çalışmaz: koşuda footl/footr hiçbir karede yere 2 cm yaklaşmaz. toesl/toesr ya da kemiğin kendi döngü minimumu kullanılmalı; W ile beklenen değer ≈0,6 m/sn. 4) Öncelik 'orta' olmalı: sorun yalnız görsel, işlev kaybı yok ve en sık durum olan koşuda kayma %12–16. 5) 'Sprint koşudan zor ayırt ediliyor' ifadesi abartılı: Running_C'nin dikey sıçraması ve adım genliği daha büyük (0,71 / 0,63 m), 7 m/sn'deki kadans 4,4 m/sn koşudakinden %25 yüksek. 6) Kabul testinde 04 C13'ün (3 m/sn'de Walk) güncellenmesi gerektiği de belirtilmeli. (uygulanan alanlar: oyuncuya etkisi, önerilen çözüm, tekrar üretme, kabul testi, öncelik) Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru (düzeltmeyle). Değerler düzeltmesi: destek ayağı yöntemiyle doğal hızlar farklı ölçüldü (1,5 cm eşikte Running_A 3,75, Running_C 3,79 m/sn); not Önerilen çözüm alanına eklendi (K7-9). Bilinen sorun: KI-114.

### I-02 — Nişan alırken omuz kamerası sağdaki duvarın içine yerleşiyor; kameradan çıkan tabanca ışını duvar arkasına isabet ediyor (yüksek)

- **Dosya ve fonksiyon:** js/player/camera.js — tpCamera.update (at() 68, blocked 112–113, ikili arama 114–127); combat.shoot/raycast (js/game/combat.js:244, 295)
- **Kök neden:** Aday kamera noktası at(d) = odak − dir·d + right·shoulder ile hesaplanıyor. İkili arama yalnız d'yi (0,4–2,3 m) kısaltıyor, 0,65 m'lik omuz kaydırmasını hiç küçültmüyor. Oyuncunun sağında 0,65 m içinde bir duvar varsa her d engelli çıkıyor ve kamera hit=max(0,4, lo−0,1)=0,4 m'ye, yani omuz kaydırmasıyla duvar kutusunun içine konuyor. combat.shoot ışını kamera konumundan başlatıyor (combat.js:244). physics.lineBlocked kutunun içinden başlayan doğruda t0=0 buluyor; bu değer tMin=0,05'in altında kaldığı için o kutu engel sayılmıyor (physics.js:231–243).
- **Oyuncuya etkisi:** Sağ omzu duvara dönük siper alıp nişan alan oyuncu duvarın içini/arkasını görebiliyor ve duvar arkasındaki düşmanı tabancayla vurabiliyor (görüş ve atış hilesi). Bu, kameranın duvar içinden geçmemesi hedefine de aykırı. Node'da gerçek camera.js ve physics.js ile: duvar 0,4 m sağdayken kamera duvar kutusunun 0,25 m içinde; içeriden çıkan ışında lineBlocked=false, dışarıdan çıkanda true. [Doğrulama eki] Etki duvarla sınırlı değil: gemi gövdesi ve kıçtaki kayık için de geçerli (I/UC5). Mermi kısmı C-06 ile örtüşüyor.
- **Öncelik:** yüksek · hedef faz: Faz 3
- **Önerilen çözüm:** camera.js'de önce odaktan omuz noktasına (f + right·shoulder) giden doğruyu dene; engelliyse omuz kaydırmasını ikili aramayla küçült, sonra mesafeyi ara. Alternatif: ~0,2 m yarıçaplı küre süpürme. combat.shoot'ta ışını gözden ya da namludan kamera yönüne at; ya da kamera→baş doğrusu engelliyse atışı baştan başlat. lineBlocked'a 'başlangıç kutu içindeyse engelli say' seçeneği ekle.
- **Tekrar üretme:** Liman binasının yanında (15 C03'teki bina) oyuncuyu sağ tarafı duvara 0,4 m uzaklıkta durdur, tabanca kuşan, Mouse2'yi basılı tut, DK.sim(1). DK.engine.camera.position, physics.all içindeki 'building' etiketli kutunun içinde kalır. Duvarın arkasına bir düşman koyup DK.combat.shoot(p) çağırınca isabet olur. Node: /tmp/denetim_alan/camtest/run.mjs ve run2.mjs.
- **Kabul testi:** Yeni test: duvar sağda 0,2 / 0,4 / 0,6 m uzaktayken nişan kamerası hiçbir çarpıştırıcı kutusunun içinde olmamalı ve baş→kamera doğrusu engelsiz olmalı. Duvar arkasındaki hedefe nişanlı atış isabet etmemeli (05 F-16'nın omuz kaydırmalı biçimi).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** C-06 (audit C: omuz kamerasıyla namlunun görmediği köşe arkası) [doğrulama eki]
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: camera.js:64 ve 68: aday noktaya her d için +right·0,65 ekleniyor. camera.js:114–120'deki ikili arama yalnız d'yi [0,4, dist] aralığında değiştiriyor; her d engelliyse hit=max(0,4, lo−0,1)=0,4, ardından 127. satırda at(_col,p). physics.js:231–243: kutu dilim testinde t0 0'dan başlıyor; doğru kutunun içinden başlıyorsa t=0 &lt; tMin=0,05 çıkıyor ve o kutu engel sayılmıyor. combat.js:244 ışını kamera konumundan başlatıyor; combat.js:295 lineBlocked'ı {tMin:0.05} ile çağırıyor. game.js:343'te nişan ayarı {dist 2.3, shoulder 0.65}. Denetçinin Node denemesini yeniden koştum (kopyalar orijinalle birebir aynı, diff boş): duvar 0,4 m sağdayken kamera [0,25; 1,59; 0,4] noktasında, kutunun içinde. İçeriden çıkan ışında lineBlocked=false, dışarıdan çıkanda true. Ek bulgu: aynı kök neden gemi gövdesinde de geçerli (hullBlocked). Gövde 0,45 m sağdayken zıpkın nişanında kamera [0,8; 0,4; −0,4] noktasında ve hullSolid=true (/tmp/denetim_alan/karsit_karakter/sim/govde_nisan.mjs). Liman binası kutuları görselden 0,2 m büyük (port.js:342), kale duvarı 1,7 m kalın (islands.js:888). Bu yüzden kamera çoğunlukla kutunun içinde kalıyor; 'duvar arkası' bina içinden, arka yüzler çizilmediği için görünüyor. Hata v0.3'te de var (orada kamera çarpışması da, tabanca engel denetimi de yoktu). Düzeltme/ek: Hüküm değişmiyor; iki ek yapılmalı: (a) Etki duvarla sınırlı değil, gemi gövdesi ve kıçtaki kayık için de geçerli. (b) Mermi kısmı audit C'deki C-06 ile ('omuz kamerasıyla namlunun görmediği köşe arkası') örtüşüyor, knownAs olarak C-06 eklenmeli. 'Yüksek' öncelik savunulabilir, 'orta' da kabul edilebilirdi. (uygulanan alanlar: oyuncuya etkisi, bilinen kimlik) Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. camtest/run.mjs (gerçek camera.js + physics.js): nişanda duvar 0,4 m sağdayken kamera kutunun içinde; içeriden çıkan ışında lineBlocked = false. Bilinen sorun: KI-030, KI-058 (ilgili).

### I-03 — Dümen ve top IK hedefleri kol boyunun dışında: eller çarka 0,39–0,53 m, kundağa 0,34–0,37 m kala havada (orta)

- **Dosya ve fonksiyon:** js/player/player.js — Player._updateHelm (905–924), Player._updateCannon (926–942); Character.update/twoBoneIK (js/player/character.js:384–400, 917–918)
- **Kök neden:** Hedefler doğru yerde (çark halkası, kundak tutamakları), ama oyuncu istasyonu çarkın 0,9 m gerisinde (shipModel.js:440'ta çark helmZ+0,15, 529'da istasyon helmZ−0,75) ve topun 1,2 m gerisinde (player.js:932). Rig'in kolu (üst+alt) 0,47 m; omuz ile hedef arası dümende ≈0,90 m, topta ≈0,82 m. twoBoneIK mesafeyi l1+l2'ye kıskaçladığından kol hedefe doğru gerilir ama ulaşamaz. 04 C08 yalnız ik.handL vektörünün çark merkezine 0,5 m olduğunu ölçüyor, bilek kemiğini ölçmüyor. Ayrıca dümende ve topta equip() (player.js:111–112) silahı yeniden ele veriyor.
- **Oyuncuya etkisi:** Dümende ve topta eller nesneye değmeden havaya uzanıyor; 06. belgedeki 'eller çark halkasında' iddiası gerçekleşmiyor. Node ölçümü (4 gövde × boy 0,94/1,0/1,06): dümende bilek ile hedef arası 0,39–0,53 m, topta 0,34–0,37 m.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** İstasyonları kol erimine getir: dümen istasyonunu çarka ~0,35–0,4 m yaklaştır (ya da kavrama noktalarını 1,0–1,05 m yüksekliğe ve 0,35 m yarıçapa indir) ve gövdeyi hafifçe öne eğ. Topta oyuncuyu kundağın ~0,6 m gerisine al ya da tutamak hedefini oyuncuya göre ölç. Test bilek kemiklerini ölçsün. Dümende ve topta equip()'i engelle ya da silahı gizli tut.
- **Tekrar üretme:** 04 C08 adımlarından sonra p.char.bones.wristl.getWorldPosition(v).distanceTo(p.char.ik.handL) ≈0,45 m döner. Node: /tmp/denetim_alan/char3.mjs.
- **Kabul testi:** 04 C08/C08b'ye ek kontrol: dümende ve topta iki bilek de hedefe &lt; 0,08 m; dümen tam sola/sağa kırılmışken de &lt; 0,1 m; 4 gövde tipi ve 0,94–1,06 boy için geçerli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C08 (06. belgede 'Düzeltildi' olarak kapatılmış)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). I/DOC1 ve I/DOC2 karşı doğrulamaları dümen ve top IK hedeflerinin belgelerdeki 'Düzeltildi' iddiasının aksine kol boyunun dışında kaldığını doğruladı. Denetçi güveni: yüksek. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char3.mjs: dümende 0,39–0,53 m, topta 0,34–0,37 m (4 gövde × 3 boy). Bilinen sorun: KI-115.

### I-04 — Sandık taşırken eller sandığın içine gömülü; büyük sandık baş üstüne çıkıyor; kaldırma/bırakma animasyonu yok (orta)

- **Dosya ve fonksiyon:** js/player/character.js — Character.update (o.carry 879–881); treasure._updateChest (js/treasure/treasure.js:289–294), treasure._applyCarry (366–375)
- **Kök neden:** Kollar sabit kök noktalarına (±0,30; 1,02; 0,42) IK ile çekiliyor. Sandık ise kademeye göre ölçeklenen chest.glb (1,18×0,90×0,82 m; ölçek 0,8–1,45), 0,55 m önde ve ayak +0,75−(ölçek−1)·0,3 tabanla konumlanıyor. Hedefler sandığın yan yüzlerine göre (yarı genişlik 0,47–0,86 m) hesaplanmadığından eller sandık hacminin içinde kalıyor; büyük ve efsane sandığın üstü 1,83/1,92 m. Suda küçük sandık taşırken yüzme IK'sı taşıma pozunu eziyor; sandık dik kalıp gövdeden kopuyor. Taşırken zıplamada JumpStart oynatılmıyor (player.js:563).
- **Oyuncuya etkisi:** Taşıma sırasında eller sandığın içinden geçiyor, büyük sandıklar karakterin başını kapatıyor. Sandık eldeyken yürüme klibi 1,4–1,9× oynuyor ve ~%55 kayıyor (I-01).
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Sandık kademesinin boyutlarından iki tutamak noktası hesapla (yan yüzlerin ortası ya da alt kenar) ve ik.handL/R'ye ver. Sandığı göğüs hizasına indir (taban ≈0,7–0,8 m, üst kenar ≤ omuz); büyük kademelerde iki kişilik taşıma ofsetini kollara göre ayarla. pickUp/drop'ta 0,4–0,6 sn PickUp klibi oynat ve sandığı gecikmeli bağla (02 önerisi). Suda taşıma pozunu yüzme pozuyla birleştir.
- **Tekrar üretme:** Küçük, orta ve büyük sandık doğur (DK.treasure.spawnChest), DK.treasure._grant ile al, DK.sim(0.5). bones.wristl konumunu sandık mesh'inin Box3'üne göre denetle: bilek kutunun içinde.
- **Kabul testi:** Yeni test: dört kademenin hepsinde iki bilek sandık kutusunun dışında ve yan yüzlere &lt; 0,08 m; sandık üstü ≤ baş kemiği yüksekliği; taşırken yürüyüşte ayak kayması &lt; 0,25 m/sn.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #8 (Açık, düşük); 02 C08 (sandık); 02 C_oyuncu önerisi 'Sandık kaldırma/bırakma animasyonu'
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-116.

### I-05 — Zıplama klibi fiziksel kalkıştan ~0,19 sn geç: gövde ~1 m havadayken hazırlık çömelmesi oynuyor (orta)

- **Dosya ve fonksiyon:** js/player/player.js — Player._updateGround (zıplama 557–565), Player._updateDeck (867–871), Player._locomotion (663–669)
- **Kök neden:** Zıplama tuşunda vel.y=7,4 m/sn anında veriliyor ve aynı anda Jump_Start (0,6 sn) 1,5× başlatılıyor. Node FK'ye göre Jump_Start'ta ayaklar klibin 0,29. sn'sinde, yani oyunda 0,19 sn sonra yerden kesiliyor. O ana kadar fizik gövdeyi y(t)=7,4t−11t² ile ≈1,0 m kaldırmış oluyor (tepe 1,24 m, 0,34. sn). airT>0,25 olunca Jump_Idle'a geçildiğinden klibin kalkış kısmı yalnız ~0,06 sn görünüyor.
- **Oyuncuya etkisi:** Her zıplamada karakter havaya çömelmiş, hazırlanır pozda yükseliyor; kalkış animasyonu fiziksel hareketten kopuk ve 'süzülüyor' gibi görünüyor. Güvertede de aynı.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Jump_Start'ı kalkış karesinden başlat (action.time ≈0,25–0,28 sn) ya da hazırlık evresini 0,05–0,08 sn'ye sıkıştır. Alternatif: giriş gecikmesi kabul edilirse fizik itkisini 0,1 sn ertele. Kalkış anını yüklemede ölçüp sakla.
- **Tekrar üretme:** DK.press('Space'), ardından her 1/60 adımda p.pos.y − zemin ve bones.footl yüksekliğini kaydet: 0,19. sn'de gövde ≈1 m yükseklikte, klipte ayaklar hâlâ yere basık pozda. Node: /tmp/denetim_alan/char4.mjs ('ayaklar yerden kesilme anı 0,29 sn').
- **Kabul testi:** Klipteki ayak kalkışı ile fiziksel kalkış arasındaki fark ≤ 0,05 sn. 03_fizik_dt tepe yüksekliği ±%3 içinde kalmalı, 16 K03 ve 04 C09 geçmeye devam etmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char4.mjs: Jump_Start ayak kalkışı 0,29 klip sn = 0,19 oyun sn. Denetçi güveni: yüksek. Bilinen sorun: KI-117.

### I-06 — Kaçınma (ve bazı eylem) kliplerindeki kök hareketi fiziksel yer değiştirmeye ekleniyor; kaçınma sonunda gövde 0,3–0,7 m geri sıçrıyor (orta)

- **Dosya ve fonksiyon:** js/core/kk.js — kk._prepClips (130–142); Player.startAction 'dodge' (js/player/player.js:265), Player._updateGround kaçınma itkisi (518–521)
- **Kök neden:** KayKit Dodge kliplerinin hips.position izinde yatay öteleme var ve klip sonunda başlangıca dönmüyor. Node FK: Dodge_F 0,27 m, Dodge_B 0,67 m, Dodge_L/R 0,56 m. AtkHeavy 0,48 m ileri gidip dönüyor, Death_A 0,37 m geride kalıyor. Oyun ayrıca karakteri fiziksel olarak ~2,3 m taşıyor (2,5+7,5k² m/sn, 0,46 sn), dolayısıyla görsel gövde fiziksel konumun önüne geçiyor. Eylem bitince Idle/Run'a 0,2–0,3 sn'lik geçişte kalça geri çekiliyor. Kök hareketi kliplerden ayıklanmıyor; _prepClips yalnız oran farkını ekliyor.
- **Oyuncuya etkisi:** Kaçınma sonunda karakter kısa bir geri 'lastik' sıçraması yapıyor; en belirgin hâli yan ve geri kaçınmada (0,56–0,67 m). Çarpışma ve vuruş fiziksel konumdan hesaplandığından görünen gövde ile isabet bölgesi 0,7 m'ye kadar ayrışıyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** _prepClips'te hips.position izinin yatay (x,z) bileşenini ilk kareye sabitle (yerinde klip), ya da kök hareketini klipten çıkarıp fiziksel itkiye dönüştür (kaçınma mesafesini klibin kök hareketinden türet). AtkHeavy ve Death gibi kliplerde de yatay kök hareketini sıfırla ya da eylem itkisiyle birleştir.
- **Tekrar üretme:** Duran oyuncuda V+S (Dodge_B) yap ve her karede bones.hips dünya konumu ile p.pos farkını ölç: eylem sonunda ≈0,6 m, ardından 0,3 sn içinde 0'a dönüyor. Node: /tmp/denetim_alan/char4.mjs.
- **Kabul testi:** Dört yönde de kaçınma boyunca |kalça(xz) − p.pos(xz) − bağlama pozu ofseti| &lt; 0,1 m, eylem bitişinde sıçrama yok. 03_fizik_dt kaçınma mesafesi ve 04 C09 geçmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char4.mjs: Dodge_F 0,27, Dodge_B 0,67, Dodge_L/R 0,56 m; AtkHeavy 0,50 m ileri gidip dönüyor; Death 0,37 m. Denetçi güveni: yüksek. Bilinen sorun: KI-118.

### I-07 — Limanda doğuşta kip geçişi tamamlanmıyor: silah/meşale görünmez, dümende ölünce kollar eski çark noktasına kilitli (orta)

- **Dosya ve fonksiyon:** js/main.js — handlers.respawn (226–241); Player.revive (js/player/player.js:236–245)
- **Kök neden:** respawn('port') oyuncuyu exitWater/leaveStation/exitBoat üzerinden değil, doğrudan p.mode='ground' ile karaya alıyor (main.js:233). Suda ölmüşse (enterWater hold(null), player.js:729–730), dümende/topta (shipControl.js:176/185 hold(null)) ya da kayıkta ölüp limanda doğulduğunda: equipped dolu ama char.heldType null kalıyor (silah görünmüyor, saldırı boş elle yapılıyor); meşale gizli kalıyor (_syncTorch çağrılmıyor); underwater bayrağı true kalıyor (dürbün açılmıyor, game.js:261). Dümende/topta ölünce char.ik.handL/R modül düzeyindeki _ikL/_ikR vektörlerine bağlı kalıyor ve Character.update kolları her karede o eski dünya noktasına çekiyor (character.js:917–918); dümen/top kilidi (interact.locks) de bırakılmıyor. 'Gemide uyan' seçeneği boardShip→_resetCombatFlags ile bunları temizliyor.
- **Oyuncuya etkisi:** Boğulup ya da dümende/topta ölüp limanda doğan oyuncu silahını görmeden saldırıyor, meşalesi yanmıyor. Dümende ölmüşse kolları suya girene ya da gemiye binene dek yüzlerce metre ötedeki çark konumuna uzanmış kalıyor. Co-op'ta dümen diğer oyunculara 'kullanımda' görünüyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Tek bir geçiş noktası kur (02 önerisi: Player.setMode(next)). respawn'da önce mevcut kipten çık (helm/cannon → shipControl.leaveStation, boat → exitBoat, swim → exitWater), sonra _resetCombatFlags, char.ik temizliği, hold(equipped), _syncTorch ve underwater=false uygula.
- **Tekrar üretme:** 1) Derin suda DK.G.godMode=false; p.hurt(999), ölüm ekranında 'Kırlangıç Limanı'nda uyan'ı seç: p.equipped==='sword' ama p.char.heldType===null ve p.underwater===true. 2) DK.shipControl.takeHelm(p, s); p.hurt(999), limanda doğ: p.char.ik.handL !== null, bilekler sabit bir dünya noktasına uzanıyor.
- **Kabul testi:** 16 P01'e ek: suda, dümende, topta ve kayıkta ölüp limanda doğunca heldType===equipped (silah varsa), meşale açıksa görünür, underwater false, ik.handL/R null ve interact.locks boş.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 E_gemi-ek-calistir-118 (kilit kısmı); 02 C12'nin benzeri (respawn yolu kapsanmamış). Silah/meşale ve underwater kısmı v0.3'te de var, IK ve dümende gizlenen silah kısmı yalnız v0.4'te.
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-119.

### I-08 — Yüzme/dalış IK pozu gövde eğimini hesaba katmıyor: kollar omzun gerisinde, bacaklar aşağı sarkık (orta)

- **Dosya ve fonksiyon:** js/player/character.js — Character.update (o.swim 891–898; W() kök uzayı 864)
- **Kök neden:** Yüzerken model 1,2–1,7 rad öne eğiliyor ve 1,0 m kaldırılıyor (player.js:788–791). Kol ve bacak IK hedefleri ise eğimsiz kök uzayında (this._w → root.localToWorld) sabit yükseklik/ileri değerlerle veriliyor. Node ölçümü (eğim 1,2): omuz kökte (−0,17; 1,37; 0,96), el hedeflerinin z değeri 0,3–0,8, yani eller omzun 0,16–0,66 m gerisinde kalıyor ve baştan öne hiç uzanmıyor. Bacak hedefleri y≈0,08 (kalça 1,17'de) olduğundan gövde–bacak açısı 129° (dalışta 122°); düz uzanmış gövde için ~180° beklenir.
- **Oyuncuya etkisi:** Yüzme ve dalış; yatay gövdede kolları göğsün altında çeviren, bacakları sarkan bir poz olarak görünüyor. İleri kulaç yok, poz ile hareket yönü arasındaki bağ zayıf.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Yüzme hedeflerini eğimli model uzayında tanımla (this.model.localToWorld) ya da kök hedeflerini eğim açısıyla döndür. Kulaç döngüsü baş önünden kalçaya uzanan bir yay olsun, bacak çırpması gövde ekseni doğrultusunda olsun; swimPhase'i yüzme hızına bağla.
- **Tekrar üretme:** Node: /tmp/denetim_alan/char1.mjs ve char2.mjs (gövde–bacak açısı, el–omuz konumu). Tarayıcıda 04 C01 sonrasında DK.snapFrom ile yandan bir kare al.
- **Kabul testi:** Yüzerken gövde–bacak açısı ≥ 160°; her kulaç döngüsünde el en az bir kez gövde ekseninde baş kemiğinin önüne geçmeli. 04 C01, 16 P01 ve 14 D01–D03 geçmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char2.mjs: gövde–bacak açısı yüzmede 129°, dalışta 122°. Denetçi güveni: orta. Bilinen sorun: KI-120.

### I-09 — Duran oyuncu saldırı/isabet/fırlatma sırasında hareket girişi verince tam gövde klibi oynarken 2,2 m/sn kayıyor (orta)

- **Dosya ve fonksiyon:** js/player/player.js — Player.startAction pick() (250–256), Player._speedFor (467–472), Player._updateGround atılım (522–525), Player._locomotion (660)
- **Kök neden:** pick() tam gövde ile üst katman arasındaki seçimi eylem başındaki hıza (>1,6 m/sn) göre bir kez yapıyor. Duran oyuncu saldırınca tam gövde klibi oynuyor ve _locomotion eylem boyunca erken döndüğü için bacaklar yürümüyor. Buna karşın _speedFor hızı saldırıda, isabet tepkisinde, fırlatmada ve yumrukta yalnız ×0,5 (2,2 m/sn); interact/pickup/land/parry'de ×0,1 kısıyor. Ayrıca atılım (lunge 1,4–2,6 m/sn) vuruş anına dek ayakları yere basılı klibe ekleniyor.
- **Oyuncuya etkisi:** Saldırırken W'ye basan ya da atılımlı vuruş yapan oyuncunun ayakları yerdeyken 0,35–1,5 m kayıyor (ağır saldırıda atılım 0,6 sn × 2,6 m/sn); fiziksel hareket ile animasyon kopuyor.
- **Öncelik:** orta · hedef faz: Faz 7
- **Önerilen çözüm:** Tam gövde eylemlerinde hareket girişini sıfırla, ya da hareket başlayınca eylemi üst katmana devret (playUpper, alt katmanda yürüyüş). Atılımı kliplerin kök hareketinden türet ya da bacak katmanına kısa bir adım klibi ekle.
- **Tekrar üretme:** Duran oyuncu kılıçla Mouse0'a basıp hemen W'yi basılı tutsun: 0,66 sn boyunca p.char.currentName 'Atk1' ve upper null; p.pos ~1,4 m ilerliyor; destek ayağının dünya hızı ≈2 m/sn.
- **Kabul testi:** Saldırı, isabet ve fırlatma eylemlerinde tam gövde klibi oynarken destek ayağının dünya hızı &lt; 0,3 m/sn. Hareket başlarsa eylem üst katmana geçmeli ve bacaklar yürüyüş klibi oynatmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-121.

### I-10 — Bazı tam gövde eylemleri klip bitmeden Idle'a kesiliyor; iki saldırıda vuruş anı salınımla örtüşmüyor (düşük)

- **Dosya ve fonksiyon:** js/game/combat.js — FIST_MOVES (25–29), SWORD_MOVES (18–24); Player.startAction (js/player/player.js:258–271); fishing.js:262 'cheer'
- **Kök neden:** Eylem süresi klip süresinin hıza bölümünden kısa: Punch 0,86 sn'lik klibin 0,6 sn'si oynuyor (%70), Punch2 %67, Cheer 1,67 sn'nin 1,2 sn'si (%72), isabet tepkisi 0,45 sn (%57–74), küçük inişte Jump_Land %63. Eylem bitince _locomotion klibi 0,3 sn geçişle Idle'a kesiyor. Node FK'de bilek hızı tepesi ile hitAt farkı: Atk2'de +0,11 sn (vuruş salınımdan sonra işleniyor), Counter'da −0,14 sn (salınımdan önce); Atk1/Atk3/Heavy/Punch'ta ≤0,08 sn. [Faz 7 tasarım doğrulaması — kısmen doğru] Atk2 sapması ve Atk3 doğru; Punch klibin %70'i, Punch2 %67'si oynuyor. Counter'daki −0,14 sn ölçüm yapıntısı: Block_Attack'ta sağ bilek neredeyse kıpırdamıyor, kılıç ucunun tepesi 0,305 oyun sn ve bugünkü değer tolerans içinde (inc_profile.mjs). Tekmede bugünkü 0,34 sn doğru (inc_strike2.mjs).
- **Oyuncuya etkisi:** Yumruk kombosunda toparlanma evresi atlanıyor ve karakter aniden Idle'a dönüyor. Atk2'de hasar kılıç geçtikten sonra işleniyor [Faz 7 düzeltmesi: karşı saldırıdaki erken hasar ölçüm yapıntısı].
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Eylem sürelerini klip süresi/hız oranına eşitle; ya da eylem bittiğinde klip bitmemişse hareketle kesilebilen bir toparlanma evresi olarak sürdür. hitAt değerlerini yüklemede bilek ya da kılıç ucu hız tepesinden türet (Counter ≈0,40, Atk2 ≈0,16–0,2).
- **Tekrar üretme:** Node: /tmp/denetim_alan/char5.mjs (oynatılan klip yüzdesi ve hız tepesi). Tarayıcıda yumrukla Mouse0'a bas: 0,6. sn'de currentName Punch'tan Idle'a geçiyor.
- **Kabul testi:** Tüm SWORD_MOVES/FIST_MOVES ile cheer/hit/land eylemlerinde eylem süresi klip süresinin ≥ %90'ı olmalı ya da toparlanma evresi bulunmalı; |hitAt − hız tepesi| ≤ 0,06 sn.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C_oyuncu önerisi 'Eylem kesme/kırpma zamanlamaları'
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): kısmen doğru. Atk2/Atk3 sapmaları ve klip kesilmesi doğru, Counter sapması ölçüm yapıntısı (char5.mjs, inc_profile.mjs); düzeltme Kök neden ve Oyuncuya etkisi alanlarına uygulandı. Denetçi güveni: orta. Bilinen sorun: KI-199.

### I-11 — Kip geçişinde üst katman durduruluyor ama eylem sürüyor: kalan süre boyunca taban klibi donuyor (düşük)

- **Dosya ve fonksiyon:** js/player/player.js — Player._resetCombatFlags (309–313), Player._locomotion (660), Player._wantAnim (423)
- **Kök neden:** boardShip, enterWater, startClimb, takeHelm/takeCannon ve enterBoat _resetCombatFlags ile char.stopUpper çağırıyor, ama this.action'ı (reload ≤1,8 sn, atk ≤1,1 sn, shoot, hit, throw…) sıfırlamıyor. Üst katman yokken eylem sürdüğü için _locomotion ve _wantAnim 'tam gövde eylemi oynuyor' varsayımıyla erken dönüyor; oysa oynayan klip önceki taban klibi.
- **Oyuncuya etkisi:** Dolum ya da saldırı sırasında gemiye binen veya suya giren oyuncu, kalan eylem süresi boyunca (≤1,8 sn) yerinde Walk/Run oynatıyor ya da yanlış klipte donuyor; suda Run klibiyle yüzüyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** _resetCombatFlags'te üst katmanda oynayan eylemleri (shoot, reload, use, throw, blockhit, parry ya da üst katmanda başlamış atk) da iptal et (this.action=null), ya da eylemi yeni kipe uygun biçimde sürdür. _locomotion'daki koşulu 'eylem tam gövde klibi mi' bayrağına bağla.
- **Tekrar üretme:** Tabanca boşken R ile dolum başlat (action 'reload', 1,8 sn) ve hemen p.boardShip(s, …) çağır: 1,8 sn boyunca p.char.currentName değişmiyor, yürüyünce de klip güncellenmiyor.
- **Kabul testi:** Her kip geçişinden sonra, p.action yoksa ya da oynayan tam gövde klibine karşılık geliyorsa _locomotion klibi günceller. Dolum sırasında binme testinde doğru taban klibi 0,1 sn içinde başlamalı.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-200.

### I-12 — Eğimli zemin ayak IK'sı hiç etkin değil (ik.ground atanmıyor) (düşük)

- **Dosya ve fonksiyon:** js/player/character.js — Character.update (920–935)
- **Kök neden:** Ayakları zemine yerleştiren kod mevcut, ama this.ik.ground hiçbir dosyada atanmıyor (grep yalnız okuma buluyor). Basamak yumuşatma (player.js:397–402) yalnız gövde yüksekliğini düzeltiyor.
- **Oyuncuya etkisi:** Yamaçta, iskele basamağında ve yalpalayan güvertede ayaklardan biri havada ya da zeminin içinde kalıyor. 07. belgedeki 'ayak yerleştirme IK' iddiası gerçekleşmiyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Player.update'te karadayken c.ik.ground=(x,z)=>physics.groundAt(x,z,this.pos.y+0.6), güvertede gemi yerel deckAt ile ver. Hareket hızı arttıkça ağırlığı azalt. model.position.y ofsetlerini (lift, crouch, ground) tek birikimli değişkende topla.
- **Tekrar üretme:** physics.groundAt eğiminin > 15° olduğu bir yamaçta dur: bones.footl/footr y değeri ile groundAt arasındaki fark 0,1–0,3 m.
- **Kabul testi:** Duran oyuncuda 20°'ye kadar yamaçta ve 0,3 m'lik basamakta iki ayak tabanı da zemine ±3 cm. Düz zeminde ve koşuda davranış değişmemeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C08 (ayak IK) ve 02 C_oyuncu önerisi 'Eğimli zeminde ayak IK'sını etkinleştir'
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. ik.ground yalnız okunuyor (character.js:860, 920, 923), hiçbir yerde atanmıyor. Denetçi güveni: kesin. Bilinen sorun: KI-201.

### I-13 — Kamera nokta olarak çarpışıyor ve 0,4 m'nin altına inmiyor: duvara dayalı oyuncuda ve ada yapılarında kamera duvarın içine girebiliyor (düşük)

- **Dosya ve fonksiyon:** js/player/camera.js — tpCamera.update (114–127)
- **Kök neden:** Görüş doğrusu yarıçapsız ve hit=max(0,4, lo−0,1). Baş bir duvara 0,4 m'den yakınken kamera 0,4 m'de duvar kutusunun içinde kalıyor (Node: sırtı duvara 0,35 m → kamera kutunun 5 cm içinde). Yakın düzlem 0,1 m uzaklıkta ve ±0,12 m genişlikte; sıyırma açılarında duvarı kesebilir. Ada yapılarının çarpışma kutuları görselden küçük (islands.js:496 colK 0,6–0,95; bilinen #43). Kale, kule, duvar ve maden yakın-kamera silinmesinin dışında (nearfade.js:113) olduğundan kamera görsel duvarın 0,1–1 m içinde durabilir.
- **Oyuncuya etkisi:** Dar yerlerde (bina araları, ada kasabaları, kale/kule yanı) ekranın bir kenarında duvarın içi ya da arkası görünebilir. 17 K08 yalnız orman/palmiye, 15 C03 ise yalnız 0,2 m büyütülmüş kutularla liman binasını ölçüyor.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** Kamerayı ~0,2 m yarıçaplı küre olarak süpür (doğruyu yan ofsetlerle ya da ek normal itmeyle sına). 0,4 m alt sınırı, engel varsa başın yanına kaydırmayla değiştir. Kamera için görsel kutuya eşit ayrı çarpıştırıcılar kullan ya da yapılara 'prop' silinmesi ekle.
- **Tekrar üretme:** Node: /tmp/denetim_alan/camtest/run.mjs ('sırtı duvara 0,35 m' satırı). Tarayıcıda kasaba halkasındaki taverna çevresinde 17 K08'deki gibi 2 eğim × 32 açı döndür; kameranın yapının görsel Box3'ü içinde kaldığı kareleri say.
- **Kabul testi:** Yeni test: limanda ve 2 ada kasabasında 4 yapı çevresinde 2 eğim × 32 açıda kamera hiçbir yapının görsel kutusunun içinde olmamalı ve karanlık kare çıkmamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #43 (çarpıştırıcı görselden küçük; kameraya etkisi belgelenmemiş)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi aynı kusuru bağımsız olarak buldu (C-13: kamera çarpışması yarıçapsız doğru testi). Denetçi güveni: orta. Ek doğrulama: Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. camtest: sırtı duvara 0,35 m dayalı oyuncuda kamera kutunun içinde. Bilinen sorun: KI-054.

### I-14 — Güverte topları, ambar kapağı, çapa ve fener ne kamera çarpışmasında ne de yakın-kamera silinmesinde (düşük)

- **Dosya ve fonksiyon:** js/ship/shipModel.js — cannonMesh (177–203); gemi modeli kurulumu (ambar kapağı, çapa, fener ve harita düzlemi malzemeleri)
- **Kök neden:** Yalnız küpeşte/direk/seren (railMat, spar) 'rail' ve yelken/bayrak 'sail' kategorisinde siliniyor (shipModel.js:281, 294, 306, 409). Topun demir ve ahşap malzemesi, ambar kapağı, çapa, fener ve harita düzlemi nearFade almıyor. hullSolid de yalnız gövde kabuğunu ve küpeşteyi katı sayıyor.
- **Oyuncuya etkisi:** Alttan bakışta (eğim ≤ −0,2) kamera güverte+0,45 m'ye inince bir topun namlusundan (0,23–0,61 m yükseklik) geçebilir ve koyu metal ekranı kaplar. 17 K04/K05 seçilen 3–4 noktada bunu yakalamadı.
- **Öncelik:** düşük · hedef faz: Faz 3
- **Önerilen çözüm:** cannonMesh ve güverte donanımı malzemelerine nearFade(…, 'prop') uygula, ya da topları kamera için hullSolid'e kutu olarak ekle.
- **Tekrar üretme:** Güvertede bir topun 1 m yanına geç, tpCamera.pitch=−0,25 yap ve yaw'ı topa doğru 24 adımda döndür; kamera top kutusunun içindeyken _lum() düşüşünü ölç.
- **Kabul testi:** 17 K05'e top yanı noktası eklendiğinde karanlık kare 0 olmalı; top malzemesi için nearFadeCategory 'prop' dönmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: orta. Bilinen sorun: KI-202.

### I-15 — Uzak oyuncu animasyonu eksik eşitleniyor: oynatma hızı, çömelme/su içinde durma/tırmanma/olta pozları ve dümen IK'sı gönderilmiyor (düşük)

- **Dosya ve fonksiyon:** js/net/net.js — RemotePlayer.update (87–124); Player.netState (js/player/player.js:986–993)
- **Kök neden:** netState anim, up, loop, mode, carry ve swimP gönderiyor; klip hızı (timeScale), crouch/tread/climb/fish/air bayrakları ve IK hedefleri gönderilmiyor. RemotePlayer klibi hız 1 ile başlatıyor (net.js:112), mod 'swim' iken overlay.swim'i hep açıyor (su içinde durma pozu yok). Art arda gelen aynı adlı tek seferlik klip (örneğin aynı saldırı) currentName değişmediği için yeniden başlatılmıyor.
- **Oyuncuya etkisi:** Co-op'ta diğer oyuncular yerel hızdan bağımsız olarak kayarak yürüyüp koşuyor; çömelen oyuncu ayakta, suda duran oyuncu kulaç atarken, dümendeki oyuncunun elleri çarkta değilken görünüyor. Art arda aynı saldırılar tek animasyon gibi görünüyor.
- **Öncelik:** düşük · hedef faz: Faz 5
- **Önerilen çözüm:** netState'e ts (taban klip hızı), ov bit alanı (crouch, tread, climb, fish, air) ve tek seferlik klipler için 'seq' sayacı ekle. RemotePlayer'da setSpeed ve overlay'leri uygula; seq değişince klibi yeniden başlat.
- **Tekrar üretme:** coop/06b düzeninde konukta C ile çömel: ev sahibindeki RemotePlayer.char.overlay.crouch tanımsız. Konuk koşarken ev sahibinde current.timeScale 1.
- **Kabul testi:** 2 oyunculu testte uzak oyuncunun taban klip hızı yereldekinden en çok ±0,05 farklı olmalı, crouch/tread pozları eşleşmeli, aynı saldırı art arda iki kez yapılınca iki kez başlamalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C_oyuncu önerisi 'Uzak oyuncu duruş senkronu' (C25'in kalan kısmı)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-203.

### I-16 — Ragdoll'dan kalkışta ilk karelerde karakter ayakta görünüp yere yatıyor (poz ve konum sıçraması) (düşük)

- **Dosya ve fonksiyon:** js/player/character.js — Character.stopRagdoll (796–809); Player.revive (js/player/player.js:236–245)
- **Kök neden:** stopRagdoll kemikleri bağlama pozuna döndürüp Idle'ı geçişsiz başlatıyor; ardından revive LieUp'ı 0,1 sn'lik crossFade ile başlatıyor. Bu yüzden ilk karede ağırlık tamamen Idle'da, yani karakter ayakta. Ragdoll gövdeyi fiziksel konumdan kaydırmışsa (Node: kalça 1,22 m) bu fark da tek karede sıfırlanıyor. Node: kalkışın ilk karesinde baş 1,134 m (ayakta), kalça x 1,22 → 0.
- **Oyuncuya etkisi:** Limanda ya da gemide uyanırken karakter bir an ayakta parlıyor, sonra yere yatıp kalkıyor; ölüm→kalkış geçişi kopuk görünüyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** stopRagdoll'da Idle yerine LieUp ya da Lie_Idle'ı geçişsiz ve ilk karesinden başlat (veya ragdoll'un son pozundan LieUp'a 0,2 sn karıştır); kök konumunu ragdoll kalçasına taşı.
- **Tekrar üretme:** Node: /tmp/denetim_alan/char6.mjs. Tarayıcıda tek oyunculu ölüm (ragdoll) sonrası 'Limanda uyan': ilk 3 karede bones.head y ≈1,13 m, sonra ≈0,2 m.
- **Kabul testi:** Kalkışın ilk 0,1 sn'sinde baş kemiği yüksekliği &lt; 0,5 m olmalı; 04 C19 geçmeye devam etmeli.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 02 C19 (statik mercekte 'ragdoll pozundan LieUp'a geçiş de sıçrardı' uyarısı)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-204.

### I-17 — Kazı animasyonu yere değmiyor ve toprak efekti klibe bağlı değil; sol el kürekte değil (düşük)

- **Dosya ve fonksiyon:** js/treasure/treasure.js — treasure.startDig (186–205); Player.startAction 'dig' (js/player/player.js:273), Player.startBusy (279–284)
- **Kök neden:** Kazı için 2H_Melee_Attack_Chop (Heavy2H) 0,85× döngüde oynatılıyor. Node FK'ye göre döngüde kürek ucu en az 0,30 m yüksekte kalıyor (kazı noktası 0,9 m önde, yerde) ve sol bilek kürek sapına 0,13–0,38 m uzakta. Toprak ve ses efekti gerçek zamanlı setInterval (380 ms) ile 7 kez üretiliyor; klibin en alçak anına (1,92 sn'lik döngünün 1,17. sn'si) bağlı değil ve oyun duraklatılsa da sürüyor. busy.cancelOnMove hiç okunmuyor.
- **Oyuncuya etkisi:** Kazarken kürek havayı dövüyor, toprak klipten bağımsız fışkırıyor; duraklatma menüsünde efekt ve ses devam ediyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Kürek ucunu yere indiren bir poz kullan (2H chop'a omurga/kol IK ile ek eğilme) ya da özel bir klip ekle. Efekt ve sesi oyun zamanında, klibin en alt karesinde üret (action.t ile). Sol eli IK ile kürek sapına bağla. cancelOnMove'u uygula ya da kaldır.
- **Tekrar üretme:** Node: /tmp/denetim_alan/char7.mjs. Tarayıcıda kürek kuşanıp Mouse0'a bas (2,6 sn); bu sırada G.paused=true yapınca efekt sürüyor.
- **Kabul testi:** Kazı döngüsünde kürek ucu kazı noktasında zemine ≤ 0,05 m inmeli; efekt bu ana ±0,05 sn içinde çıkmalı; duraklatmada efekt olmamalı; sol bilek sapa &lt; 0,08 m.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C08 (kazıda sol el); 02 C_oyuncu 'Ölü kod temizliği' (cancelOnMove)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char7.mjs: kürek ucu en alçak 0,30 m, sol bilek–sap 0,13–0,38 m. Denetçi güveni: yüksek. Bilinen sorun: KI-205.

### I-18 — Sandık açma, onarım, yangın söndürme, su boşaltma ve ganimet toplamada karakter animasyonu yok (düşük)

- **Dosya ve fonksiyon:** js/game/interact.js — interact.update (47–70)
- **Kök neden:** Basılı tutmalı etkileşimler yalnız holdT sayıyor, oyuncuya eylem ya da klip başlatmıyor. 'Interact' klibi oyuncuda yalnız hiç çağrılmayan startBusy (kazı dışı) yolunda; 'PickUp' yalnız deniz kabuğu toplamada kullanılıyor (details.js:387).
- **Oyuncuya etkisi:** 1,4–5 sn süren onarım, söndürme ve sandık açma sırasında karakter boşta duruyor ya da yürüyor; eylem ile animasyon arasında bağ yok.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Süreli (hold) adaylarda tuş basılıyken startBusy(label, hold, …, {anim:'interact' ya da 'use', cancelOnMove:true}) çağır ya da Interact/UseItem/PickUp klibini döngüde oynat. Tek basışlı toplama ve açmada startAction('pickup' ya da 'interact') kullan.
- **Tekrar üretme:** Güvertede bir deliğin yanında E'yi basılı tut: p.char.currentName 'Idle' olarak kalıyor.
- **Kabul testi:** Her basılı tutmalı etkileşimde ilk 0,1 sn içinde Interact ya da UseItem klibi başlamalı, tuş bırakılınca kesilmeli.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-206.

### I-19 — Güvertede ölen oyuncunun ragdoll'u dünya uzayında: gemi ilerlerken ceset güverteden kayıp denize düşüyor (düşük)

- **Dosya ve fonksiyon:** js/player/player.js — Player._ragdoll (224–235); Ragdoll.update/_step (js/player/ragdoll.js:110–154)
- **Kök neden:** Ragdoll noktaları dünya uzayında simüle ediliyor. Gemi yalnız ground() fonksiyonunda o anki dönüşümüyle örnekleniyor; noktalar gemiyle birlikte taşınmıyor.
- **Oyuncuya etkisi:** Seyir hâlindeki gemide ölünce ölüm ekranı açılana kadar (2,2 sn) beden geride kalıp suya düşüyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** opts.frame=ship.root verildiğinde noktaları gemi yerel uzayında tut ve _pose'da localToWorld uygula (02 önerisi).
- **Tekrar üretme:** Gemi 6 m/sn hızla seyrederken güvertede p.hurt(999): 2 sn içinde bones.hips ile gemi arasındaki yerel fark 5 m'yi aşıyor.
- **Kabul testi:** Seyir hâlindeki gemide ölümden 2,5 sn sonra kalça güverte izdüşümü içinde ve deckAt değerinin ±0,3 m'sinde olmalı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C_oyuncu önerisi 'Ragdoll'u gemi yerel uzayında simüle et'
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: orta. Bilinen sorun: KI-207.

### I-20 — Tabanca namlu alevi elden bağımsız sabit bir noktadan çıkıyor (düşük)

- **Dosya ve fonksiyon:** js/game/combat.js — combat.shoot (249–250)
- **Kök neden:** Alev konumu p.pos + ileri·0,6 + y 1,45 olarak sabit; tabanca modelinin userData.muzzle noktası kullanılmıyor. Node FK: nişan pozunda gerçek namlu kök uzayında (−0,19; 1,30; 0,61), yani alev ~0,24 m yanda ve yukarıda.
- **Oyuncuya etkisi:** Ateş ederken alev tabancanın değil başın sağ önünde beliriyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** p.char.held.userData.muzzle noktasını held grubunun localToWorld'üyle dünyaya çevirip alev konumu olarak kullan.
- **Tekrar üretme:** Node: /tmp/denetim_alan/char4.mjs (Aim satırı).
- **Kabul testi:** Ateş anında alev konumu ile tabanca namlusunun dünya konumu arasındaki fark &lt; 0,05 m.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. char4.mjs nişan pozu: namlu (−0,19; 1,30; 0,61), alev (0; 1,45; 0,6). Denetçi güveni: yüksek. Bilinen sorun: KI-208.

### I-21 — Güvertede animasyon hızı gerçek yer değiştirmeden değil girişten alınıyor: küpeşteye/direğe doğru yerinde koşma (düşük)

- **Dosya ve fonksiyon:** js/player/player.js — Player._updateDeck (894–898)
- **Kök neden:** ws = sp (giriş hızı) ve this.vel ile _locomotion buna göre ayarlanıyor. clampDeck (ship.js:184–196) oyuncuyu küpeşte ya da direk sınırında durdursa da klip ve hız değişmiyor. Karadaki çarpışma sonrası hız izdüşümü (player.js:592–595) güvertede yok.
- **Oyuncuya etkisi:** Güvertede küpeşteye ya da direğe doğru yürüyen oyuncu yerinde koşuyor ya da yürüyor.
- **Öncelik:** düşük · hedef faz: Faz 7
- **Önerilen çözüm:** Güvertede kare başına gerçek yerel yer değiştirmeyi (clampDeck sonrası local farkı / dt) hız olarak kullan ve _locomotion'a bu değeri ver.
- **Tekrar üretme:** Güvertede küpeşteye doğru W'yi basılı tut: p.local değişmiyor, p.char.currentName 'Run' ve timeScale ~0,85.
- **Kabul testi:** Küpeşteye ya da direğe dayanınca 0,2 sn içinde Idle'a geçilmeli; serbest güvertede davranış değişmemeli (04 C09 geçmeli).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 C_oyuncu önerisi (duvara dayanırken animasyon hızı gerçek yer değiştirmeden alınsın)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 7 tasarım belgesi §0.5 (docs/v05/tasarim/FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-209.

### I-M01 — Kamera ile oyuncu arasındaki noCam engeller (ağaç gövdesi, palmiye, NPC, iskele babası) tabanca atışını sessizce boşa çıkarıyor (orta)

- **Dosya ve fonksiyon:** js/game/combat.js — combat.shoot (235–268, ışın başlangıcı 244) / combat.raycast (271–298, engel denetimi 295); physics.lineBlocked (js/world/physics.js:194–252, kamera istisnası 220)
- **Kök neden:** v0.4'te ağaç ve palmiye (props.js:238–239, 249; islands.js:478), NPC (npcs.js:82–83) ve iskele babası/direk (port.js:236, 243, 373) çarpıştırıcıları noCam işaretli. Kamera görüş testi (camera.js:8 CAM_LOS camera:true, physics.js:220) bunları atlıyor. Bu yüzden kamera bu gövdelerin arkasına geçiyor; gövdeyi de yakın-kamera silinmesi ve görüş çizgisi silindiri ekrandan siliyor. Tabanca ışını ise kamera konumundan çıkıyor (combat.js:244) ve raycast'teki engel denetimi lineBlocked'ı camera seçeneği olmadan çağırıyor (combat.js:295, {tMin:0.05, tMax:0.98, rScale:1}). Bu çağrıda noCam gövdeler engel sayılıyor. Sonuçta kamera ile oyuncu arasında kalan bir gövde, oyuncunun önündeki hedefe yapılan atışı durduruyor. Hata yalnız v0.4'te var: v0.3'te raycast yalnız araziye bakıyordu (v0.3 combat.js:263–286). Bilinen bir kimliği yok. audit C'deki C-06 ışının kameradan çıktığını genel olarak yazıyor, ama bu yanlış-negatif durumu anlatmıyor. C-06'nın önerdiği 'hedef noktasını kameradan bul' düzeltmesi, kamera–oyuncu arası dışlanmazsa arkadaki ağacı nişan noktası yapar.
- **Oyuncuya etkisi:** Ormanda, palmiyeler arasında ya da kasabada arkasında NPC varken nişangâh düşmanın üstünde olsa bile atış isabet etmiyor. Oyuncuya geri bildirim de verilmiyor: iz efekti hedefin gerisinde, arazide çıkıyor. Tek mermili tabanca yine de yeniden doldurmaya giriyor ve atış sesi düşmanları uyarıyor. Nişansız atışta kamera 4,6 m geride olduğu için oyuncunun bu mesafe içindeki herhangi bir gövde yetiyor; nişanlı atışta 2,3 m geri-sağdaki bir gövde yetiyor. Gerçek camera.js ve physics.js ile Node denemesinin sonuçları: palmiye (r 0,32) oyuncunun 1,5 m arkasındayken kameradan çıkan ışın engelli (true), namludan aynı hedefe çıkan ışın engelsiz (false). Ağaç (r 0,8) 2,5 m arkada iken de true. Nişanlı atışta palmiye 1,0 m arka-sağda iken true.
- **Öncelik:** orta · hedef faz: Faz 3
- **Önerilen çözüm:** Atışı iki aşamaya böl. (1) Nişan noktasını kameradan bul, ama hem engel hem hedef aramasını oyuncunun kamera doğrultusundaki izdüşümünden sonra başlat (proj > kamera–baş uzaklığı). (2) İsabeti namludan ya da gözden bu noktaya lineBlocked ile doğrula. Kısa vadeli seçenek: kameradan yapılan lineBlocked çağrısında tMin'i kamera–baş uzaklığına göre ayarla (tMin = |kamera−baş| / |kamera−hedef|). Bu düzeltme I-02 ve C-06 düzeltmeleriyle birlikte tasarlanmalı, yoksa biri ötekini bozar.
- **Tekrar üretme:** Node: /tmp/denetim_alan/karsit_karakter/sim/agac_atis.mjs (gerçek camera.js ve physics.js kopyalarıyla). Tarayıcıda: oyuncuyu kumsalda bir palmiyenin 1–1,5 m önüne, sırtı palmiyeye dönük yerleştir. 10 m önüne bir düşman koy ya da DK.combat.targets'a sabit bir hedef ekle. Kamerayı oyuncunun arkasına çevir (tpCamera.yaw = oyuncunun yönü), nişansız DK.combat.shoot(p) çağır: hedefin canı değişmiyor. Palmiyenin çarpıştırıcısını physics'ten kaldırınca aynı atış isabet ediyor.
- **Kabul testi:** 05_dusman_ai'ye ya da 18 numaralı yeni senaryoya eklenecek test: oyuncunun 1,0 / 1,5 / 2,5 m arkasında noCam bir ağaç ya da NPC varken nişanlı ve nişansız atış öndeki hedefe isabet etmeli. Oyuncu ile hedef arasında kaya ya da duvar varken isabet etmemeli. Kamera ile oyuncu arasındaki düşman vurulmamalı (C-06). I-02'nin duvar senaryosu da geçmeye devam etmeli.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Kök neden (tabanca ışınının kameradan çıkması) C-06 ve C-M02 ile ortak; noCam engel belirtisi ayrıca sınanmadı. Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-058.

---

**5.J Alan J — Performans ve bellek** · 30 denetim maddesi, 2 kaçan madde, 2 ek madde · varsayılan hedef faz: Faz 8

Denetçi özeti: v0.4 (44d548c) performans/bellek alanında sızıntı denetimi ve donma önlemede v0.3'ün ilerisinde: ada/hayvan/düşman GPU kaynak bırakma 09_performans döngüleriyle, karelere bölünmüş ada kurulumu 13_donma ile (taban 9/9) sınanıyor; ancak çizim yükü fiilen azaltılmadı. Kullanıcının andığı 1 045 çağrı v0.3 raporundan (docs/12_PERFORMANS_RAPORU.md:10) geliyor; v0.4 son kodun taban ölçümü 1 035 çağrı / 1,25 M üçgen / 95 program, 10. belgedeki 999 değeri son kodda korunmamış. Statik okuma ve Node sayımlarına göre limandaki en büyük kaynaklar: görüş konisi ayıklaması kapalı karakter örgüleri (frustumCulled=false, her karede ana + gölge geçişi), tüm çekirdek adaları kapsayan tek parça bitki örtüsü (her karede ~200 K ana + ~175 K gölge üçgeni), 80 örgüsünün tamamı gölge atan oyuncu gemisi, parça başına örgülü hayvanlar (7 domuz = 140 çağrı) ve bina başına benzersiz malzemeler yüzünden 84 örgüde kalan liman birleştirmesi. Gölgelendirici ön derlemesi son işleme açıkken yanlış program varyantını derliyor (yüksek/orta 89, düşük 40 program), meşale ışık sayısını değiştirip tüm malzemeleri yeniden derletiyor ve sahnede her pikselde hesaplanan 7 kalıcı nokta ışığı var. Kalite ayarlarında yükleme sırası hataları (gölge çözünürlüğü yeniden açılışta uygulanmıyor, herhangi bir ayar değişince arazi LOD ön ayarı sıfırlanıyor), oyun içi gölge kapatmanın programları yenilememesi (bilinen A_motor-ek-statik-19) ve 75/100/144 Hz ekranlarda FPS sınırının hedefin çok altında kalması bulundu. Ölçüm altyapısı yalnız SwiftShader'da, tek karede ve 5 sahnede ölçüyor; kalabalık kasaba, mağara, açık deniz, deniz savaşı, gerçek boss savaşı, 4 oyunculu co-op ve gerçek GPU ayrımı yok, taban koşusunda Volkanik Dev sızıntı kontrolü kararsız. Kritik bulgu yok; 3 yüksek, 15 orta ve 12 düşük öncelikli madde Faz 8 için sıralı iş listesi oluşturuyor.

