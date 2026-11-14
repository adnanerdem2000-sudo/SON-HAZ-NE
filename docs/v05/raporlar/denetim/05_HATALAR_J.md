# AUDIT_CURRENT §5 — Hatalar: J — Performans ve bellek

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — J — Performans ve bellek

### J-01 — Karakter örgülerinde görüş konisi ayıklaması kapalı: her NPC/düşman/uzak oyuncu/balıkçı her karede ana ve gölge geçişinde çiziliyor (orta)

- **Dosya ve fonksiyon:** js/player/character.js — Character.build (458-460), Animated constructor (967); kk._prepChar (js/core/kk.js:93)
- **Kök neden:** Kit örgülerine (iskeletli gövde parçaları, kit şapka/pelerin) ve glb Animated örgülerine frustumCulled=false atanıyor; three.js r187 ayıklaması kapalı nesneyi hem ana listede (three.module.js:17726/17750) hem gölge haritasında (three.module.js:9373 '! object.frustumCulled || intersectsFrustum') koşulsuz çizer. Kök düzeyinde mesafe gizlemesi de yok.
- **Oyuncuya etkisi:** KayKit gövdesi 6 iskeletli örgü olduğundan her karakter kameranın arkasında, 1 km uzakta ya da 110 m gölge kutusunun dışında olsa da en az 6 ana + 6 gölge çağrısı harcıyor; insan karakteri her geçişte ~4 K üçgen. Limandaki 12 karakterin koşulsuz yükü ≈144 çağrı ve ≈100 K üçgen; bu, 10. belge §10.5'te 10 karakter için ölçülen ≈95 K ile uyumlu. Liman NPC'leri açık denizde de çiziliyor; kurulu ada kasabalarının 5 NPC'si 1 150 m'ye kadar aynı yükü taşıyor; deniz savaşında tayfa ekleniyor. Gerçek FPS ölçülmedi; §10.9.2'ye göre çağrı başına ~10,7 µs, yani ~1,5 ms CPU, artı 12 iskelet güncellemesi. Gölge kutusundaki NPC'ler ayıklama açılsa da gölge geçişinde çizilmeye devam edeceği için limandaki kazanç 144 çağrıdan küçük kalır; asıl kazanç açık denizde ve diğer adalarda (~132 çağrı). [Doğrulamayla düzeltildi: denetçi ~6 K üçgen/karakter ve ≈144 K üçgen demişti; 'açık deniz 203 çağrısıyla tutarlı' ifadesi doğrulanamadı, çünkü §10.9.1'in ölçüm betiği depoda yok.]
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 8
- **Önerilen çözüm:** frustumCulled=true'ya dön: her SkinnedMesh için bağlama pozunda computeBoundingSphere() ve yarıçapı ~1,5× büyüt (animasyon payı) ya da kök Group için elle küre testi (kök konumu, r≈1,6 m) yapıp root.visible'ı yönet; NPC/balıkçı/ada NPC'lerine mesafe gizlemesi (>150–200 m) ve gizliyken animasyon güncellemesini atla; ikinci adımda 6 gövde parçasını aynı iskelet ve atlasla tek SkinnedMesh'e birleştir (14 #12). [Doğrulama eki] Önerilen sınır küresi payının ragdoll sırasında yetmeyebileceği not edilmeli.
- **Tekrar üretme:** Limanda konsolda: r=DK.engine.renderer; r.info.autoReset=false; r.info.reset(); DK.post.render(); a=r.info.render.calls; DK.npcs.list.forEach(n=>n.root&&(n.root.visible=false)); DK.details.boats.forEach(b=>b.fisher.root.visible=false); r.info.reset(); DK.post.render(); a-r.info.render.calls → kamera NPC'lere sırtını dönmüşken de >0 (≈100+). Gemiyle limandan 1,5 km uzaktayken de >0.
- **Kabul testi:** Ana geçişte: kamera NPC'lere sırtını dönmüşken ve liman 1 km uzaktayken karakter kaynaklı çağrı farkı 0. Gölge geçişinde odak çevresindeki ±55 m gölge kutusunda kalan NPC'ler (sky.js:139-141, 339-340) haklı olarak çizilmeye devam eder; 'gizleme farkı 0' ölçütü onlara uygulanmaz [doğrulama düzeltmesi]. Kamera taramasında (kamera_tarama b4 kasaba NPC konumları) karakter kaybolması/titremesi yok.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #28 ve 14 #12 ile ilişkili (birleştirme önerisi var; frustumCulled=false kök nedeni belgelenmemiş)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Kök neden doğrulandı. character.js:456-463'te build kit örgülerinin tümüne frustumCulled=false veriyor (:458). Aynısı :967'de Animated'da ve kk.js:93'te _prepChar'da var; v0.3'te character.js:403/851 ve kk.js:87 aynı. three.module.js:17750 (ana liste) ve :9373 (gölge, renderObject) ayıklamayı yalnız frustumCulled true iken yapıyor. WebGLObjects.update iskelet güncellemesini de her karede çalıştırıyor. Mesafeye bağlı gizleme yok: npcs.update (npcs.js:147-169) görünürlüğe hiç dokunmuyor. Balıkçılar details.js:346-352 ve :550'de. Ada NPC'leri DROP_D=1150 (islands.js:27, kıyıdan ölçülür) içinde kalıyor. Liman noktalarının 9'u modelli (port.js:322-333). Node sayımı (/tmp/denetim_alan/karsit_J/kkbody.mjs): insan gövdesi 6 iskeletli örgü, 3 921–4 263 üçgen. İskelet düşman 9 iskeletli örgü, 5 104–5 288 üçgen. Kit şapka 396–830, pelerin 78–84 üçgen. 12 karakter × (6+6) = 144 çağrı doğru. Düzeltme/ek: Üçgen etkisi abartılmış. İnsan karakteri her geçişte ~6 K değil ~4 K üçgen harcıyor. Limandaki 12 karakterin koşulsuz yükü ≈144 çağrı, ama ≈100 K üçgen (144 K değil); bu değer 10. belge §10.5'te 10 karakter için ölçülen ≈95 K ile uyumlu. Kabul ölçütü de düzeltilmeli: ayıklama açılsa bile odak çevresindeki ±55 m gölge kutusunda kalan NPC'ler (sky.js:139-141, 339-340) gölge geçişinde haklı olarak çizilmeye devam eder. 'Gizleme farkı 0' ölçütü yalnız ana geçiş için, bir de liman 1 km uzaktayken geçerli. Bu yüzden limandaki kazanç 144 çağrıdan küçük kalır; asıl kazanç açık denizde ve diğer adalarda (~132 çağrı). 'Açık deniz 203 çağrısıyla tutarlı' ifadesi doğrulanamadı, çünkü §10.9.1'in ölçüm betiği depoda yok. Önerilen küre payının ragdoll sırasında yetmeyebileceği not edilmeli. Gerçek FPS ölçülmeden 'orta' öncelik daha savunulabilir: §10.9.2'ye göre çağrı başına ~10,7 µs, yani ~1,5 ms CPU, artı 12 iskelet güncellemesi. (uygulanan alanlar: oyuncuya etkisi, önerilen çözüm, kabul testi, öncelik) Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: NPC'lere sırt dönükken 55 ana + 100 gölge çağrı; 7 km uzakta liman NPC'leri 55 + 55; Tuz Pazarı'nda 15 NPC 187 + 120 çağrı; düzeltmenin etkisi limanda 213 → 146. Bilinen sorun: KI-122.

### J-02 — Çekirdek adaların bitki örtüsü tür başına tek dev InstancedMesh: ayıklama yok, tüm örnekler her karede ana ve gölge geçişinde (orta)

- **Dosya ve fonksiyon:** js/world/props.js — instanced (17-48), props.build (164-285; orman ağacı 254-266), _inst (307-319)
- **Kök neden:** 6 çekirdek adanın (Kırlangıç r=270 dahil) tüm örnekleri tek InstancedMesh'e yazılıyor; sınır küresi tüm takımadayı kapsadığı için görüş konisi ve 110 m gölge kutusu onunla hep kesişiyor, ayıklama işlemiyor. Ek adalardaki 160 m hücre + mesafe/gölge LOD'u (islands.js:79-140, 404-415) çekirdek adalara uygulanmamış; castShadow palmiye/ağaç/çalı/kaya/kütük/kuru ağaçta açık (props.js:41, 265, 390).
- **Oyuncuya etkisi:** Node sayımı (/tmp/denetim_alan/J_perf/props_count.mjs): yüksek ayarda 1 598 örnek; GLB ve prosedürel üçgenlerle (glbtris.mjs, clouds.mjs: orman ağacı 376 üçgen) ≈202 K ana + ≈175 K gölge üçgeni — limandaki 1,25 M üçgenin ~%30'u, kamera nereye bakarsa baksın; gölge geçişindeki 370 K üçgenin yaklaşık yarısı. Zayıf GPU'da köşe işleme ve gölge haritası maliyeti. [Doğrulama düzeltmesi] Kök neden ve üçgen sayıları doğru; çizim çağrısına etkisi küçük (~15 ana + ~10 gölge); yük köşe işlemede ve gölge haritasında. Gerçek GPU ölçümü yapılmadan ve kare bütçesinin aşıldığı gösterilmeden öncelik orta.
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 8
- **Önerilen çözüm:** Çekirdek ada bitki örtüsünü islands.js Batch'iyle (160 m hücre) üret ya da props.instanced'ı hücreli yap; _cellLod benzeri mesafe gizleme (850/240 m) ve gölgeyi yalnız oyuncunun ≤80–120 m çevresindeki hücrelere ver; gerekirse r187 BatchedMesh (nesne başına ayıklama). Rastgele sayı sırası ve dönüşüm listeleri değişmemeli (yalnız hücrelere bölünür).
- **Tekrar üretme:** Limanda: DK.engine.scene.children.filter(o=>o.isInstancedMesh&&o.count>50).map(o=>[o.count, Math.round(o.boundingSphere.radius)]) → yarıçaplar ~610–780 m [doğrulama ölçümü; özgün metinde ~1 000 m]; bu örgülerde castShadow=false yapılıp r.info ile gölge geçişi üçgen farkı ≈175 K.
- **Kabul testi:** Limanda toplam üçgen ≥ %20, gölge geçişi üçgeni ≥ %40 azalır; örnek dönüşümleri eskisiyle birebir aynı (Node karşılaştırması); kamera taramasında bitki eksikliği/pop-in yok.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 14 #12 'gölge atan nesne budaması' (bu kök neden belgelenmemiş)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: props.build (props.js:163-285) 6 çekirdek adanın (CORE_ISLANDS: kirlangic r=270, marti, kemik, papagan, ikiz1, ikiz2) tüm örneklerini tür ve parça başına tek bir InstancedMesh'e yazıyor. İlgili yerler: instanced :17-48 (castShadow :41), orman ağacı :254-266 (:265), _inst :307-319, kuru ağaç :390. islands.js:75-140 (VCELL=160 Batch) ve :404-415 (_cellLod) yalnız EXTRA_ISLANDS'a uygulanıyor. Sayımı yeniden yaptım (J_perf/props_count.mjs ve kendi üçgen hesabım): yüksek ayarda 1 598 örnek. GLB üçgenleri: palmiye 190, çalı 32, kaya 80, uzun kaya 136, çiçek 76, kütük 56, mantar 48. Prosedürel: orman ağacı 56+4×80=376, eğrelti 56, ot 24, kuru ağaç 124. Sonuç ana geçişte 201,6 K, gölgede 174,7 K üçgen; doğru. Orman ağacı indekssiz olduğu için üçgen başına 3 köşe gidiyor, yani köşe yükü daha da yüksek. Küre yarıçapları (/tmp/denetim_alan/karsit_J/props_sphere.mjs) 609–782 m; kamera ve 110 m gölge kutusu bu kürelerle her zaman kesişiyor. v0.3'te de aynı. Düzeltme/ek: Kök neden ve üçgen sayıları doğru. Küre yarıçapı ~1 000 m değil ~610–780 m; bu sonucu değiştirmiyor. Çizim çağrısına etkisi küçük (~15 ana + ~10 gölge); yük köşe işlemede ve gölge haritasında. Gerçek GPU ölçümü yapılmadan ve kare bütçesinin aşıldığı gösterilmeden 'yüksek' değil 'orta' öncelik uygun. (uygulanan alanlar: oyuncuya etkisi, tekrar üretme, öncelik) Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: sınır küresi yarıçapları ana türlerde 606–779 m; limanda 303 K + 170 K üçgen. Bilinen sorun: KI-123.

### J-03 — Yükleme ekranındaki gölgelendirici ön derlemesi son işleme açıkken yanlış program varyantını derliyor (orta)

- **Dosya ve fonksiyon:** js/main.js — boot (97, 112); post.setQuality (js/core/post.js:60-93)
- **Kök neden:** compileAsync(engine.scene, engine.camera) bağlı çizim hedefi yokken çağrılıyor; three.js programı tuval için (ACES ton eşleme + sRGB çıkış) üretiyor (three.module.js:7257-7263, 7295). Efekt kalitesi orta/yüksekken (varsayılan) sahne EffectComposer'ın RenderPass hedefine çizildiği için gerçekte ton eşlemesiz + doğrusal çıkış varyantı gerekiyor; bunlar ilk karede eşzamanlı derleniyor.
- **Oyuncuya etkisi:** Yükleme ekranı 8 sn'ye kadar kullanılmayacak programları derliyor; menünün ilk karesinde ve ilk görülen içerikte tüm sahne programları yeniden derleniyor → gerçek GPU'da (özellikle Windows/ANGLE) yüzlerce ms–saniyeler süren donma. Kanıt: 10. belge §10.9.1 program sayısı yüksek/orta 89, düşük 40; fark son işleme (~10) ve gölge derinlik programlarıyla açıklanamayacak kadar büyük (~35–40 ikiz varyant). [Doğrulama düzeltmesi] Etki büyüklüğü ölçülmedi. İlk karede yalnız görünen içeriğin programları derleniyor, kalanlar ilk görüldüklerinde derleniyor (J-17 ile aynı mekanizma); takılma oturum başına bir kez oluyor ve tarayıcının gölgelendirici disk önbelleği sonraki açılışları hafifletiyor. Öncelik orta (J-17 ile tutarlı).
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 8
- **Önerilen çözüm:** Ön derlemeyi composer hedefi bağlıyken yap: renderer.setRenderTarget(post.composer.readBuffer); await compileAsync(...); renderer.setRenderTarget(null). Ya da yükleme ekranında görünmez 1×1 pencerede bir kez post.render() ile ısıt (gölge derinlik malzemeleri de derlenir); efekt kalitesi değişince aynı ısıtmayı tekrarla.
- **Tekrar üretme:** Efekt ayarı 'low' ve 'high' iken iki ayrı açılış yap; yükleme bitip menü ilk kez çizildikten sonra DK.engine.renderer.info.programs.length değerlerini karşılaştır (10. belge §10.9.1'e göre yüksek/orta 89, düşük 40) ve Chrome Performance kaydında ilk karedeki compileShader/linkProgram sürelerine bak. [Doğrulama düzeltmesi: özgün adımdaki 'ilk kare çizilmeden ölç' koşulu güvenilir değil, çünkü window.DK motor başladıktan sonra tanımlanıyor.]
- **Kabul testi:** Efekt yüksek/orta iken yükleme sonrası ilk karede yeni program ≤ 3; liman 'progs' değeri düşük ayardaki sayı + son işleme programları (≈50) düzeyine iner; gerçek GPU'da ilk kare &lt; 50 ms.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #31 / 02 T04 / 14 #16 ile ilişkili (yanlış varyant kök nedeni belgelenmemiş)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: main.js:97'deki settings.apply() post.setQuality'yi (post.js:60-93) çağırıp composer'ı kuruyor. main.js:112'deki compileAsync(engine.scene, engine.camera) ise hiçbir çizim hedefi bağlı değilken çalışıyor: oyun kodunda setRenderTarget hiç yok, yalnız post.js:71 hedef oluşturuyor. three.module.js:7257-7263 ton eşlemeyi yalnız hedef null iken açıyor, :7295 outputColorSpace'i aynı koşula bağlıyor. İkisi de program önbellek anahtarında (:7532, :7580); bu yüzden RenderPass hedefine çizim ayrı bir program istiyor. compile() (:17223-17330) sahneyi traverse ediyor ama gölge derinlik ve son işleme malzemelerini derlemiyor. 10. belge §10.9.1 (yüksek/orta 89, düşük 40) ve taban koşusu (menü 86, liman 95 program) bu açıklamayla tutarlı. v0.3 main.js:111 ve aynı engine/post ayarları. Düzeltme/ek: Kök neden doğru. Etki büyüklüğü ölçülmedi. İlk karede yalnız görünen içeriğin programları derleniyor; kalanlar ilk görüldüklerinde derleniyor (J-17 ile aynı mekanizma). Takılma oturum başına bir kez oluyor ve tarayıcının gölgelendirici disk önbelleği sonraki açılışları hafifletiyor. J-17 'orta' iken bunun 'yüksek' olması tutarsız; 'orta' öneriyorum. Tekrar üretme adımındaki 'ilk kare çizilmeden' koşulu güvenilir değil, çünkü window.DK motor başladıktan sonra tanımlanıyor. Bunun yerine efekt 'low' ve 'high' iken iki ayrı açılışta program sayıları karşılaştırılmalı. (uygulanan alanlar: oyuncuya etkisi, tekrar üretme, öncelik) Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: son işleme açıkken menüde 86 programın 42'si, limanda 95'in 42'si tuval (sRGB) çıkışlı; Düşük'te 44 programın hepsi tuval çıkışlı. Bilinen sorun: KI-124.

### J-04 — Gemi modeli 80 (sloop) / 118 (brigantin) ayrı örgüden oluşuyor ve hepsi gölge atıyor (orta)

- **Dosya ve fonksiyon:** js/ship/shipModel.js — buildShipModel (239-534; 524'te tüm örgülere castShadow=true)
- **Kök neden:** Tekerlek parmakları, merdiven basamakları, top parçaları, harita, kova gibi küçük parçalar ayrı örgü ve 19–27 malzemeyle kuruluyor; birleştirme yok; son traverse castShadow=false olanları da gölge atar yapıyor.
- **Oyuncuya etkisi:** Node kurulumu (/tmp/denetim_alan/J_perf/shipcount.mjs): sloop 80 örgü / 80 gölge atan / 19 malzeme / 6 264 üçgen, brigantin 118/118/27. Limanda demirli oyuncu gemisi görünürken ≈160 çağrı (toplamın ~%15'i); ticaret gemisi limandayken +≈236; deniz savaşında düşman gemisi + tayfa ile 400+ çağrı.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Hareketsiz parçaları (gövde donanımı, küpeşte, merdiven, ambar kapağı, masa, kova, mataforalar) gemi başına malzemeye göre mergeStatic ile birleştir; dönen/oynayan parçaları (yelkenler, dümen tekerleği, toplar, çapa, bayrak) ayrı tut; topları InstancedMesh yap; yarıçapı &lt;0,15 m parçalarda castShadow=false; hasar/kırık direk görsellerini koru.
- **Tekrar üretme:** let n=0,c=0; DK.G.ship.root.traverse(o=>{if(o.isMesh){n++; if(o.castShadow)c++;}}); [n,c] → [80,80].
- **Kabul testi:** Sloop ≤ 20 örgü ve ≤ 10 gölge atan, brigantin ≤ 30 örgü; gemi görünümü snapFrom karşılaştırmasında aynı; top nişanı, yelken animasyonu ve hasar görselleri çalışır; 03/04 gemi testleri geçer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #28 ile ilişkili (gemi kaynağı belgelenmemiş)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: sloop 80 örgü, hepsi gölge atıyor; denizde gemi 81 ana + 80 gölge çağrı. Denetçi güveni: yüksek. Bilinen sorun: KI-125.

### J-05 — Prosedürel hayvanlar parça başına ayrı örgü, geometri ve malzeme kullanıyor; bireyler arası paylaşım yok (orta)

- **Dosya ve fonksiyon:** js/wildlife/animals.js — boarModel (21-68), monkeyModel (69-105), crocModel (106-163), parrotModel (164-193), snakeModel (194-217), polarModel (249-298)
- **Kök neden:** Her birey için her parça new Geometry + std() malzemesiyle kuruluyor (yılanda her segment ayrı malzeme); katı alt gruplar birleştirilmiyor; tür başına geometri önbelleği yok.
- **Oyuncuya etkisi:** /tmp/denetim_alan/J_perf/animal_meshes.mjs: domuz 20 örgü, timsah 34, yılan 22 (22 malzeme), kutup ayısı 33. Limanda etkin bölgeler (zones.mjs: domuz 7, maymun 6, papağan 9, yılan 6, yengeç 5 = 33 hayvan); 10. belgedeki '7 adsız grup × 20 örgü = 140 çağrı' 7 domuzdur. Her doğuşta 20–34 geometri yükleme maliyeti.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Tür başına geometri önbelleği (renk farkı köşe rengi ya da malzeme varyantı); pivot grubu başına (gövde, baş grubu, her bacak) parçaları tek geometride birleştir → domuz 20→6 örgü; uzun vadede basit iskelet + tek SkinnedMesh; küçük parçalarda gölgeyi kapat.
- **Tekrar üretme:** Limanda: DK.animals.list.filter(a=>a.kind==='boar').map(a=>{let n=0;a.root.traverse(o=>{if(o.isMesh)n++});return n}) → [20,20,…]; 09 'liman' çağrısını önce/sonra karşılaştır.
- **Kabul testi:** Domuz ≤ 6, timsah ≤ 8, yılan ≤ 4 örgü; 7 domuzluk bölge ≤ 50 çağrı; 09 hayvan sızıntı döngüsü dG=dT=0 kalır; bacak salınımı ve yılan dalgası görsel olarak aynı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 14 #12 (prosedürel hayvan parçalarının birleştirilmesi)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: 7 domuz 140, 9 papağan 81, 6 maymun 72 çağrı; mağarada 46 hayvan 617 çağrı. Denetçi güveni: yüksek. Bilinen sorun: KI-126.

### J-06 — Başlangıç limanında bina/aksesuar başına benzersiz doku ve malzeme: birleştirme 84 örgüde kalıyor (orta)

- **Dosya ve fonksiyon:** js/world/port.js — texMat (15-20), makeBuilding (29-125), _lantern (397-409), _board (378-395), port.build (151-334)
- **Kök neden:** texMat her çağrıda dokuyu klonlayıp yeni MeshStandardMaterial üretiyor; temel/duvar/çatı dokuları bina tohumuna göre ayrı tuvallerden geliyor (stone(seed), woodPlanks(.., seed), roofTiles(.., seed)); mergeStatic malzeme uuid'ine göre grupladığı için her bina 3–4 ayrı örgü bırakıyor. 7 fener 2'şer benzersiz malzeme kullanıyor ama port.update (455-457) hepsine aynı parlaklığı veriyor; babalar ve pano da ayrı malzeme.
- **Oyuncuya etkisi:** /tmp/denetim_alan/J_perf/portcount.mjs: 'port-batched' 84 örgü / 84 malzeme (51 dokulu, 26 düz, 7 fener ampulü), 63 gölge atan; deniz feneri ayrı 5 örgü. 10. belge §10.5: 106 çağrı; ayrıca ~39 adet 256² tuval dokusu.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Duvar/çatı/temel türü başına tek malzeme + doku atlası; tekrar (repeat) değerlerini birleştirmeden önce UV'ye pişir; bina renk farkını köşe rengine taşı; tek fener ampulü ve tek direk malzemesi; tabelaları tek atlasa topla; deniz fenerinin hareketsiz parçalarını birleşik gruba al.
- **Tekrar üretme:** const g=DK.engine.scene.children.find(o=>/port-batched/.test(o.name)); [g.children.length, new Set(g.children.map(m=>m.material)).size] → [84, 84].
- **Kabul testi:** port-batched ≤ 25 örgü; liman çağrısı ≥ 60 azalır; doku ölçeği, renkler ve tabelalar önce/sonra ekran görüntüsünde eşdeğer; gece fener/pencere ışımaları korunur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #28; docs/12 §12.4 'çekirdek ada yapılarının birleştirilmesi' (yapılmadı)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçüm ve kod okumasıyla: port-batched 44 ana + 64 gölge = 108 çağrı. Denetçi güveni: yüksek. Bilinen sorun: KI-127.

### J-07 — Sahnede sürekli 7 nokta ışığı var; her aydınlatılmış pikselde hepsi hesaplanıyor (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — islands.init (236-243); weatherfx.init (js/world/weatherfx.js:115-116); cave.build (js/world/cave.js:117-123)
- **Kök neden:** Ada fener havuzunun 4 ışığı (yoğunluk 0, y=-500), yıldırım ışığı (yoğunluk 0) ve mağaranın 2 ışığı (mağaradan km'lerce uzaktayken de) kalıcı olarak sahnede; three.js görünür her ışığı NUM_POINT_LIGHTS'e katar ve lights_fragment döngüsü yoğunluk/mesafeden bağımsız her ışık için BRDF hesaplar.
- **Oyuncuya etkisi:** Her MeshStandardMaterial pikselinde 7 ek ışık değerlendirmesi → zayıf/tümleşik GPU'da 1080p ve aşırı çizimle birkaç ms; docs/12 §12.2'deki 'sabit 4 ışıklı havuz' gerçek sayıyı yansıtmıyor.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Toplam nokta ışığını sabit ve küçük tut (2–3): mağara ışıklarını ve meşaleyi aynı havuzdan yakınlığa göre ata, yıldırımı yarımküre/yönlü ışık artışıyla ver; düşük kalitede havuzu 0–1'e indir (oturum boyunca sabit, yeniden derleme olmasın).
- **Tekrar üretme:** let n=0; DK.engine.scene.traverse(o=>{if(o.isPointLight&&o.visible)n++}); n → limanda 7 (meşale yanınca 8).
- **Kabul testi:** Görünür nokta ışığı sayısı oturum boyunca sabit ve ≤ 3; mağara ve gece fener aydınlatması görsel olarak korunur; gerçek GPU'da limanda kare süresi önce/sonra ölçülür.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş (docs/12 §12.2 iddiasıyla çelişiyor)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: görünür nokta ışığı 7, meşaleyle 8. Denetçi güveni: yüksek. Bilinen sorun: KI-128.

### J-08 — Meşale yakılıp söndürülünce ışık sayısı değişiyor; tüm aydınlatılmış malzemeler yeniden derleniyor (orta)

- **Dosya ve fonksiyon:** js/player/player.js — Player.toggleTorch / _syncTorch (122-138); makeTorch (js/player/character.js:328-341)
- **Kök neden:** Meşalenin PointLight'ı _torchObj.visible ile açılıp kapanıyor; numPointLights program anahtarında (three.module.js:7429) ve lightsStateVersion değişince setProgram yeni program istiyor (:18279). İlk kullanımda görünür her malzeme için yeni varyant derleniyor.
- **Oyuncuya etkisi:** Oyuncu F'ye ilk bastığında (gece/mağara) eşzamanlı derleme → gerçek GPU'da belirgin donma; toplam nokta ışığı 8'e çıkıyor.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Meşale ışığını oyuncu karakterinde sürekli sahnede tut (visible=true), kapalıyken intensity=0; ya da J-07'deki sabit havuza dahil et.
- **Tekrar üretme:** n0=DK.engine.renderer.info.programs.length; DK.G.player.inv.add('fener',1); DK.G.player.toggleTorch(); DK.post.render(); DK.engine.renderer.info.programs.length-n0 → >0 (ilk açışta).
- **Kabul testi:** Meşale aç/kapa programs.length'i değiştirmez; ilk açışta kare süresi normal karenin 2 katını aşmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** Belgelenmemiş
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: ilk yakışta 17 (bir koşuda 25) yeni program; SwiftShader'da 9 992 ms'lik kare. Denetçi güveni: yüksek. Bilinen sorun: KI-129.

### J-09 — 'Gölge kalitesi' seçimi yeniden açılışta uygulanmıyor; harita boyutu grafik kalitesinden geliyor (orta)

- **Dosya ve fonksiyon:** js/core/settings.js — settings.apply (46-67, özellikle 53-60); js/main.js boot (97 → 106); sky.build (js/world/sky.js:137-139)
- **Kök neden:** settings.apply açılışta dünya kurulmadan çağrılıyor (main.js:97); güneş ışığı sonra sky.build'de (js/game/game.js:52) yaratılıp mapSize'ı grafik kalitesine göre (yüksek 2048, diğer 1024) alıyor; apply bir daha çağrılmadığı için seçilen gölge kalitesi ancak oyun içinde bir ayar değişince uygulanıyor. Grafik kalitesi 'düşük'te castShadow=false olduğundan gölge seçeneği tümden etkisiz.
- **Oyuncuya etkisi:** Performans için 'Orta (1024)' seçen kullanıcı her açılışta 2048 haritayla (4× gölge doldurma) oynar ya da tersi; panel ile gerçek durum tutarsız.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** Dünya kurulduktan sonra settings.apply()'ı bir kez daha çağır ya da sky.build gölge boyutunu settings.v.shadows'tan alsın; quality 'low' ile shadows seçimini tek kurala bağla.
- **Tekrar üretme:** Ayarlar: Grafik kalitesi Yüksek, Gölge Orta (1024) → sayfayı yenile → DK.sky.sun.shadow.mapSize.x → 2048.
- **Kabul testi:** Yenilemeden sonra mapSize ayarla aynı (1024/2048); quality 'low' + shadows 'high' birleşimi panelde engellenir ya da tutarlı uygulanır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 A4 (03. belgede A1–A4 kapsamında giderildi sayılıyor; yalnız oyun içi değişiklikte giderilmiş)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). A alanının karşı doğrulayıcısı aynı sıra sorununun gölge haritasında da olduğunu bağımsız olarak kaydetti (A-M02, kod okumasıyla). Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla; ön ayar ölçümünde harita boyutu grafik kalitesinden geldi (Düşük'te de 1024). Bilinen sorun: KI-130, KI-038 (ilgili).

### J-10 — Herhangi bir ayar değişince arazi LOD ön ayarı sıfırlanıyor; görüş mesafesi açılışta araziye uygulanmıyor (orta)

- **Dosya ve fonksiyon:** js/core/settings.js — settings.apply (63-65); terrain.init (js/world/terrain.js:247)
- **Kök neden:** Açılışta apply, terrain.init'ten önce çalıştığı için terrain.lodScale tanımsız → baseLod=1 sabitleniyor; terrain.init sonra lodScale'ı kaliteye göre (0,7/0,85/1) yazıyor ve görüş mesafesini yok sayıyor. Oyun içinde herhangi bir ayar (ses kaydırıcısı dahil; settingsPanel.js:12 commit) apply'ı tekrar çalıştırınca lodScale = 1 × (0,7 + 0,3·görüş) oluyor, kalite ön ayarı kayboluyor; ayrıca her commit setRenderScale ile tuvali/hedefleri yeniden boyutluyor.
- **Oyuncuya etkisi:** Düşük kalite kullanıcısında ses ayarı bile arazi LOD yarıçapını 0,7→1,0'a (~2× karo) çıkarır; görüş mesafesini %30 yapan kullanıcı yeniden açılışta tam mesafeyle başlar.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** terrain.baseLod'u terrain.init'te kaliteye göre ata; apply'da lodScale = baseLod × (0,7 + 0,3·vd); dünya kurulunca apply'ı bir kez daha çağır; görüntü dışı ayarlarda render hedeflerini yeniden boyutlama.
- **Tekrar üretme:** Kalite 'Düşük' kaydet, yenile → DK.terrain.lodScale 0.7; Ayarlar → Ses → Ana ses kaydırıcısını oynat → DK.terrain.lodScale 1.0 ve DK.terrain.stats().tiles artar.
- **Kabul testi:** lodScale her zaman kaliteTabanı × (0,7 + 0,3·vd); ses/kontrol ayarı değişince değişmez; yenileme sonrası ve oyun içi değerler aynı.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). A alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (A-M02). Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: Düşük (görüş 0,3) açılışta lodScale 0,7 (olması gereken 0,553), Orta (0,65) 0,85 (olması gereken 0,76); baseLod ikisinde de 1. Bilinen sorun: KI-038.

### J-11 — Oyun içinde 'Gölge: Kapalı' seçilince malzeme programları yenilenmiyor (gölgeler donuyor, piksel maliyeti sürüyor) (orta)

- **Dosya ve fonksiyon:** js/core/settings.js — settings.apply (52-60)
- **Kök neden:** Yalnız renderer.shadowMap.enabled değişiyor; three.js shadowMapEnabled'ı yalnız program kurulurken okuyor (three.module.js:7450), setProgram'ın değişim koşullarında yok (:18279-18340); gölge geçişi atlanıyor (:8939) ama derlenmiş malzemeler USE_SHADOWMAP ile son haritayı/matrisi örneklemeye devam ediyor. Yüksek→Kapalı'da harita boyutu değiştiği için harita bırakılıyor (56-59).
- **Oyuncuya etkisi:** Orta→Kapalı'da gölgeler eski yerinde donar; her durumda gölge örnekleme maliyeti sürer, düşük donanımda beklenen kazanç gelmez; 02 kaydına göre Kapalı→Açık'ta gölgeler yeniden başlatmaya dek gelmeyebilir.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Gölge ayarı değişince sahnedeki tüm malzemelere needsUpdate=true (tek seferlik derleme, bekleme göstergesiyle) ya da ayarı 'yeniden başlatınca' sınıfına al; Kapalı'da sun.castShadow=false + needsUpdate.
- **Tekrar üretme:** Limanda gölge 'Orta' → 'Kapalı', oyuncuyu 10 m yürüt: gölgesi eski yerde kalır; programların önbellek anahtarında shadowMapEnabled hâlâ true.
- **Kabul testi:** Kapalı'da hiçbir program USE_SHADOWMAP içermez ve görüntü 'Kapalı' ile açılmış oturumla eşdeğer; Kapalı→Açık'ta gölgeler aynı karede döner.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 A_motor-ek-statik-19 (açık; 11. belgede listelenmemiş)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: Volkanik Dev sahnesinde Yüksek → Kapalı geçişte gölge çağrısı 125 → 0, ama program 113 → 115; sahne malzemeleri yeniden derlenmedi. Denetçi güveni: yüksek. Bilinen sorun: KI-131.

### J-12 — FPS sınırı yüksek tazeleme hızlı ekranlarda hedefin çok altında kalıyor (orta)

- **Dosya ve fonksiyon:** js/core/engine.js — engine.start döngüsü (52-71; sınır 55-59)
- **Kök neden:** Kare atlama kararı 'now − _last &lt; 1000/limit − 1' ile veriliyor ve çizimden sonra _last=now atanıyor (faz birikmiyor); rAF yalnız ekran tazeleme aralıklarında geldiğinden hedef aralığın biraz altındaki kareler atlanıyor.
- **Oyuncuya etkisi:** /tmp/denetim_alan/J_perf/fpslimit.mjs: 60 FPS sınırı 75 Hz ekranda 37,4, 100 Hz'de 50, 144 Hz'de 47,9, 165 Hz'de 55 FPS; 30 sınırı 75/100 Hz'de 25. Güç tasarrufu için sınır koyan dizüstü kullanıcıları gereksiz takılma yaşar.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Biriktirmeli zamanlama: if (now − _last &lt; minDt − tolerans) return; _last += minDt; (now − _last > minDt ise _last = now ile yakalama); ya da sınırı en yakın tazeleme bölenine yuvarla.
- **Tekrar üretme:** Node: /tmp/denetim_alan/J_perf/fpslimit.mjs; tarayıcıda 144 Hz ekranda Ayarlar → FPS sınırı 60 + 'FPS göster' → ~48.
- **Kabul testi:** 60 sınırında 75/100/144/165 Hz ekranlarda 57–60 FPS; 30 sınırında 29–30 FPS (benzetim ve gerçek ekran).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Node benzetimiyle doğrulandı: 60 sınırında 75 Hz'de 37,5, 100 Hz'de 50, 144 Hz'de 48, 165 Hz'de 55 FPS. Denetçi güveni: kesin. Bilinen sorun: KI-132.

### J-13 — Sis ve hava koşullarından bağımsız çizim mesafesi: tamamen sis rengindeki uzak içerik çiziliyor (orta)

- **Dosya ve fonksiyon:** js/core/settings.js — settings.apply (61, camera.far); sky.update (js/world/sky.js:359 sis yoğunluğu); terrain.update/_wantSeg (js/world/terrain.js:258-320); islands._cellLod (js/world/islands.js:404-415)
- **Kök neden:** camera.far = 1500 + 3500·görüş (varsayılan 5 000 m), arazi halkaları 2 700 m'ye, ada hücreleri 850 m'ye kadar; FogExp2 yoğunluğu açık havada 0,0011 (≥%99 sis ≈1,95 km), fırtınada ≈0,0076 (≈280 m), sisli havada ≈0,0101 (≈210 m). Kesme mesafeleri sise bağlı değil.
- **Oyuncuya etkisi:** Sisli/fırtınalı havada ve açık havada ~2 km ötesinde görünmeyen arazi, ada içeriği, bulut ve karakterler için çağrı/üçgen harcanıyor; fırtına zaten en ağır sahnelerden.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Etkin görüş d99 = √(−ln 0,01)/yoğunluk hesapla; camera.far = min(ayar, 1,1·d99); terrain.lodScale ve islands hücre mesafelerini d99'a göre kırp (yumuşak geçişle).
- **Tekrar üretme:** Limanda DK.sky.setWeather('sisli', true); DK.sim(3); r.info ile çağrı/üçgen ölç → açık havadakine yakın kalıyor.
- **Kabul testi:** Sisli/fırtınada aynı konumda çağrı ve üçgen ≥ %30 azalır; d99 sınırında görünür pop-in yok (kamera taraması).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Hesapla doğrulandı: d99 açıkta 1 951 m, fırtınada 282 m, siste 212 m; açık denizde 1,6 km'deki adaya bakan yön 980 çağrı. Denetçi güveni: yüksek. Bilinen sorun: KI-133.

### J-14 — Son işleme açıkken tuval yine 4× MSAA ile oluşturuluyor; varsayılan piksel oranı 2'ye kadar (orta)

- **Dosya ve fonksiyon:** js/core/engine.js — engine.init (20-21), setRenderScale (38-42)
- **Kök neden:** WebGLRenderer antialias:true ile kuruluyor; efekt orta/yüksekken sahne composer hedefine çizilip tuvale yalnız tam ekran dörtgen düşüyor, tuvalin çok örnekli arabelleği boşa çözümleniyor. Piksel oranı min(devicePixelRatio, 2) × ölçek (varsayılan 1) → HiDPI dizüstünde 4× piksel.
- **Oyuncuya etkisi:** Yüksek efektte 4× MSAA HalfFloat hedef + 4× MSAA tuval: yüksek çözünürlüklü ekranlarda yüzlerce MB GPU belleği ve bant genişliği; tümleşik GPU'larda FPS kaybı.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Bağlamı antialias:false ile kur (efekt 'low' ise FXAA ya da tek MSAA hedef kullan); varsayılan DPR üst sınırını 1,5 yap ya da ilk açılışta GPU/çözünürlüğe göre ölçek öner; isteğe bağlı dinamik çözünürlük.
- **Tekrar üretme:** DK.engine.renderer.getContext().getContextAttributes().antialias → true; retina ekranda DK.engine.renderer.getPixelRatio() → 2.
- **Kabul testi:** Efekt orta/yüksekte tuval antialias=false; varsayılan DPR ≤ 1,5; kenar yumuşatma önce/sonra ekran görüntüsünde eşdeğer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: efekt Yüksek/Orta iken getContextAttributes().antialias === true. Denetçi güveni: yüksek. Bilinen sorun: KI-134.

### J-15 — Performans ölçüm altyapısı: tek kare, 5 sahne, yalnız SwiftShader, tek gevşek bütçe (orta)

- **Dosya ve fonksiyon:** tests/scenarios/09_performans.js — _M (6), sahne adımları (7-18), liman bütçesi (10); tests/harness/run.cjs:36
- **Kök neden:** Ölçüm tek kare ve tek kamera açısı; sahneler menü, liman, Kadim Tapınak kıyısı, aynı noktada fırtına ve aynı noktada doğurulan kraken; koşucu SwiftShader'ı zorluyor; yalnız limanda ≤1100 çağrı / &lt;40 ms bütçesi var; v0.3 perf1.js'deki kasaba, düşman kampı ve açık deniz sahneleri v0.4 ölçümüne taşınmamış.
- **Oyuncuya etkisi:** Kalabalık kasaba, mağara, açık deniz, deniz savaşı, gerçek boss savaşı, 4 oyunculu co-op, gece/meşale ölçülmüyor; 999→1 035 gibi çağrı artışları yakalanmıyor; gerçek GPU sonuçları ayrıştırılamıyor.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** 09'u sahne matrisine genişlet (bkz. requirements): sahne başına 360° kamera taraması (kamera_tarama konumları), 60–120 karede medyan/p95 çağrı-üçgen, ilk karede yeni program sayısı, varsa GPU zamanı (EXT_disjoint_timer_query_webgl2), renderer adı/DPR/ön ayar JSON'a; sahne başına bütçe; SwiftShader bayraksız '--gpu' kipi ve gerçek makinede aynı senaryo.
- **Tekrar üretme:** docs/v05/taban_kosusu_44d548c/09_performans.json yalnız menu/liman/orman_adasi/firtina/boss_kraken içerir; 09_performans.js:10 tek bütçe.
- **Kabul testi:** Senaryo ≥ 10 sahne ölçer, her sahnede bütçe kontrolü vardır, sonuçlarda renderer adı ve kip yazılıdır; aynı kodda iki koşu arası medyan çağrı farkı ≤ %3.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #32 (ortam: gerçek FPS ölçülemez)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Doğrulandı: Faz 8 çalışması 9 sahneyi, kategori dökümünü ve ilk kare derlemesini ayrıca ölçmek zorunda kaldı. Denetçi güveni: kesin. Bilinen sorun: KI-135.

### J-16 — 09_performans'ta Volkanik Dev oluştur/kaldır döngüsü geometri +5 ile kalıyor: sızıntı değil ölçüm kusuru (Faz 8 doğrulaması) (orta)

- **Dosya ve fonksiyon:** tests/scenarios/09_performans.js — nesne sızıntı döngüsü (33-38); VolcanicGiant (js/game/bosses.js:768-907), BossBase.dispose (126-134)
- **Kök neden:** Doğrulanmadı. Gözlem: dG=5 ve demon.glb'nin primitive sayısı 5 (/tmp/denetim_alan/J_perf/glbtris.mjs); dev ilk 4 sn kraterden yükseldiği için (bosses.js:811) testin 0,5 sn'lik benzetiminde lav atışı olmuyor, uçuştaki işaret halkası hipotezi zayıf. Paylaşımlı demon geometrisinin ölçüm anlarında farklı yüklenme durumu ya da başka bir geç yüklenen kaynak olası. [Faz 8 tasarım doğrulaması — kök neden bulundu] Sızıntı değil ölçüm kusuru: 09'un döngüsü boss'u kendi noktasında (Ateş Dağı) doğuruyor, oyuncu yaklaşık 9,9 km uzakta; bosses._check() (bosses.js:1094-1099, 0,5 sn'de bir) uzak boss'u çoğunlukla ölçüm karesinden önce kaldırıyor. 31 alt adımlık denetim evresi tutarsa demon.glb'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez yükleniyor ve dG=5 görünüyor; düzeltilmiş döngüde dG=0 (Faz 8 §5.4; kod ve Node ile bağımsız doğrulandı, dG=5 olasılığı ≈ %6,5). 09'un Kraken ölçümü de boss'suz yapılıyor. Karar: K8-7.
- **Oyuncuya etkisi:** Bilinen tek başarısız performans kontrolü; gerçek sızıntıysa her Volkanik Dev karşılaşmasında 5 geometri birikir; kararsızsa regresyon sinyalini maskeler.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Döngüye önce/sonra geometri kimlik kümesi farkını yazan tanı ekle (renderer.info yerine nesne kümesi); ısınma için bir döngü daha koş; gerçek sızıntı çıkarsa ilgili kaynağı BossBase/VolcanicGiant dispose'a ekle.
- **Tekrar üretme:** node tests/harness/run.cjs tests/scenarios/09_performans.js --size 640x360 → adım 19 volkanik_dev dG (taban: 5); 5 ardışık koşuda dağılımı kaydet.
- **Kabul testi:** 5 ardışık koşuda volkanik_dev dG=0, dT=0; tanı çıktısında fark kümesi boş.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** docs/v05/00_BASLANGIC_KAYDI.md:58 (taban 09_performans 8/9, Faz 8'de incelenecek)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): kısmen doğru. Kök neden bulundu: sızıntı değil ölçüm kusuru (§5.4); düzeltme başlığa ve Kök neden alanına uygulandı (karar K8-7). Denetçi güveni: orta. Bilinen sorun: KI-136.

### J-17 — Sonradan görünen içerik (ada, düşman, boss, hayvan, efekt) ilk görüldüğünde gölgelendirici derlemesi (orta)

- **Dosya ve fonksiyon:** js/world/islands.js — _buildGen sonu rimAll (364), _runJob sahneye ekleme (388); enemies.spawn, bosses.spawn, animals._spawnZone
- **Kök neden:** Yalnız yükleme anındaki sahne ön derleniyor (o da yanlış varyantla, J-03); ada grubu, düşman/boss/hayvan malzemeleri ve paylaşımlı malzemelere ilk adada eklenen kenar ışığı kancası (js/core/rim.js applyRim → needsUpdate) ilk çizimde derleniyor.
- **Oyuncuya etkisi:** Her yeni içerik türünde oturumda bir kez takılma (10. belge §10.8.5: turda 5+1 yeni program, yazılımsal GPU'da 38–81 ms kareler); gerçek GPU'da ölçülmedi.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Ada grubunu sahneye eklemeden önce composer hedefi bağlıyken compileAsync(group, camera, scene); düşman/boss/hayvan/efekt malzeme çeşitlerini yükleme ekranında görünmez örneklerle ısıt; rim kancasını paylaşımlı malzemelere yüklemede uygula.
- **Tekrar üretme:** Yeni oturumda programs.length kaydet; gemiyle yeni bir biyom adasına yaklaş; ada kurulduğu karede programs.length artışı > 0.
- **Kabul testi:** Oturumdaki ilk ada/düşman/boss karşılaşmasında programs.length artışı 0; P01 benzeri yaklaşmada en uzun kare ≤ 2× ortalama.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #31; 02 T04; 14 #16
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: ada ilk görüşünde 1–5 yeni program, ilk kare 72–290 ms (ikinci 10–29 ms); bir koşuda 5 289 ms. Denetçi güveni: yüksek. Bilinen sorun: KI-137.

### J-18 — Harita ayrıntı karosu boyanırken tuvalden geri okuma (getImageData) ana iş parçacığını kilitliyor (orta)

- **Dosya ve fonksiyon:** js/ui/mapArt.js — paint (99-114; getImageData 102)
- **Kök neden:** Parşömen zemini tuvalden piksel olarak eşzamanlı geri okunup işleniyor.
- **Oyuncuya etkisi:** Yazılımsal GPU'da karo başına 100–650 ms; koşarken/seyrederken yeni karoya girişte bir kez takılma (gerçek GPU'da ölçülmedi).
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Boyamayı arazi işçisine taşı (ham piksel dizisi / OffscreenCanvas) ve sonucu ImageBitmap olarak aktar; bellek etkisini 04_karakter tepe değeriyle ölç.
- **Tekrar üretme:** 11. belge #45: harita ayrıntı karosu sınırını geçerken Performance kaydında getImageData uzun görevi.
- **Kabul testi:** Karo geçişinde ana iş parçacığında > 16 ms görev yok; 04_karakter bellek tepesi ≤ 1,2 GB.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #45
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla (mapArt.js:99-108, getImageData :102). Denetçi güveni: yüksek. Bilinen sorun: KI-138.

### J-19 — Duraklatma menüsü, ana menü ve tam ekran paneller açıkken tam sahne çizimi sürüyor (düşük)

- **Dosya ve fonksiyon:** js/core/engine.js — engine.start döngüsü (52-71); game.update (js/game/game.js:192)
- **Kök neden:** Döngü her rAF'ta post.render() çağırıyor; G.paused yalnız benzetimi durduruyor; #modal arka planı canlı tuval üstünde backdrop-filter blur uyguluyor (css/style.css:101); ana menü dünyayı sınırsız FPS'le çiziyor (menü 422 çağrı).
- **Oyuncuya etkisi:** Menüde/duraklatmada GPU boşuna tam yükte (pil, ısı, fan); düşük donanımda menü takılır.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Duraklatma/tam ekran panelde son kareyi tut, çizimi durdur ya da 5–10 FPS'e indir; ana menüde 30 FPS sınırı; bulanıklığı tek kez yakalanan görüntüye uygula.
- **Tekrar üretme:** Oyunda Esc → DK.engine.renderer.info.render.frame 1 sn arayla iki kez okunur → ~60 artar.
- **Kabul testi:** Duraklatmada render.frame artışı ≤ 10/sn; menüye dönüş ve devam görsel olarak kesintisiz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla, ölçülmedi (engine.js:52-71 her rAF'ta post.render()). Denetçi güveni: yüksek. Bilinen sorun: KI-210.

### J-20 — Parçacık sistemi: parçacık başına nesne ayırma, O(n) kaydırma/silme, her güncellemede 900'lük tamponun tamamı yükleniyor ve çiziliyor (düşük)

- **Dosya ve fonksiyon:** js/game/effects.js — effects.spawn (45-48), effects.update (121-146)
- **Kök neden:** Her spawn yeni JS nesnesi; dolunca shift(), ölüler splice ile siliniyor; dört öznitelik her çağrıda needsUpdate ve setDrawRange(0, MAX) → ölü (alfa 0) parçacıklar da işleniyor; 'effects' alt adım kümesinde (js/game/game.js:187) olduğundan düşük FPS'te kare başına 2–6 kez yükleniyor.
- **Oyuncuya etkisi:** Çöp toplama baskısı ve gereksiz GPU yükü (fırtınada kare başına 6 yağmur sıçraması, deniz savaşında duman); düşük FPS'te artan maliyet.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Tipli dizilerle halka tampon (SoA), canlı sayısı n ile setDrawRange(0, n) ve addUpdateRange ile yalnız n öğe yükleme; GPU güncellemesini kare başına bir kez yap.
- **Tekrar üretme:** Ayırma örnekleyicisiyle fırtınada 30 sn: effects.spawn/update ayırmaları; parçacık yokken de her karede 4×900 öğe bufferSubData.
- **Kabul testi:** Parçacık yokken tampon yüklemesi 0; fırtınada effects kaynaklı ayırma ~0; görsel eşdeğer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla (effects.js:45-48, :121-146). Denetçi güveni: yüksek. Bilinen sorun: KI-211.

### J-21 — Deniz olayı yüzen nesneleri (şişe, gök taşı, kazazede salı) kaldırılınca geometri/malzeme bırakılmıyor (düşük)

- **Dosya ve fonksiyon:** js/game/events.js — spawnFloating (158-197), events.update (79), events.start (47)
- **Kök neden:** Şişe, gök taşı ve kazazede her doğuşta yeni geometri + MeshStandardMaterial yaratıyor; toplanınca, süresi dolunca ya da oturum başında yalnız scene.remove yapılıyor.
- **Oyuncuya etkisi:** Olay başına 1–3 geometri ve malzeme GPU'da kalır; uzun oturumda yavaş ama sınırsız büyüme; 09 ve 10_uzun_oturum bu türü kapsamıyor.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Modül düzeyinde paylaşımlı geometri/malzeme kullan ya da kaldırırken disposeTree(f.mesh) (varil/sandık gibi assets.prop klonlarındaki paylaşımlı kaynakları atlayarak).
- **Tekrar üretme:** 4 kez: f=DK.events.spawnFloating('bottle', DK.G.player.pos.clone().add(new DK.THREE.Vector3(3,0,3))); DK.post.render(); f.gone=true; DK.events.update(0.016) → renderer.info.memory.geometries döngü başına +2.
- **Kabul testi:** 09'a eklenecek şişe/gök taşı/kazazede döngüsünde ısınma sonrası dG=dT=0.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: şişe döngüsü başına +2 geometri, sahnede değil. Denetçi güveni: yüksek. Bilinen sorun: KI-212.

### J-22 — Karakter renk atlası önbelleği (FIFO 96) kullanılan dokuyu da bırakabiliyor (düşük)

- **Dosya ve fonksiyon:** js/core/kk.js — kk.texture (207-247; tahliye 244); Character._disposeModel (js/player/character.js:492-500)
- **Kök neden:** Önbellek 96'yı aşınca en eski anahtarın dokusu kullanımda olup olmadığına bakılmadan dispose ediliyor; three.js onu bir sonraki çizimde yeniden yüklüyor ama doku artık önbellekte değil ve karakter dispose'u dokuları bırakmıyor.
- **Oyuncuya etkisi:** Rastgele görünümlü çok düşman/NPC görülen uzun oturumlarda en eski dokular (ör. liman NPC'leri) yeniden yüklenir (küçük takılma); sahipsiz dokular GPU'da çöp toplanana dek kalır, sayaç kayar.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Anahtar başına başvuru sayacı (Character.build artırır, _disposeModel azaltır); yalnız sayacı 0 olanları tahliye et.
- **Tekrar üretme:** 150 farklı rastgele görünümlü düşmanı 4'lü dalgalarla doğur/kaldır; info.memory.textures başlangıç + 96'yı aşar, liman NPC'sinin atlası önbellekte değildir.
- **Kabul testi:** Aynı döngü sonrası info.memory.textures ≤ başlangıç + 96; kullanımdaki hiçbir doku tahliye edilmez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 10. belge §10.4 notu ('sızıntı değil' denmiş)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla (kk.js:244). Denetçi güveni: orta. Bilinen sorun: KI-213.

### J-23 — Kalıcı sahnede birleştirilmemiş/örneklenmemiş küçük nesneler (toplanabilir kabuklar, mezarlar, harabeler, sarkıtlar, deniz kayalıkları) (düşük)

- **Dosya ve fonksiyon:** js/world/details.js — details.init (toplanabilirler 252-271, deniz kayalıkları 282-307); props._grave/_statue/_kemikRuins/_camp (js/world/props.js:332-444); cave.build sarkıtlar (js/world/cave.js:93-101)
- **Kök neden:** 46 kabuk/istiridye her biri kendi geometri+malzemesiyle; deniz kayalıkları kayalık başına klon malzeme; 16 mezar × 3 örgü ve mezar başına 2 yeni malzeme; 26 sarkıt ayrı geometri; Kemik harabesi/kamp props'ları ayrı klonlar; hiçbiri mergeStatic/InstancedMesh kullanmıyor.
- **Oyuncuya etkisi:** Görünür olduklarında onlarca ek çağrı (Kemik adası, mağara, kıyılar) ve ~100 ek geometri/malzeme; mağara sahnesinde belirgin.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Toplanabilirler için tür başına InstancedMesh (alınanı ölçek 0 ile gizle); mezar/harabe/kamp ve mağara süslerini mergeStatic ile birleştir; deniz kayalıklarında tek kararmış malzeme.
- **Tekrar üretme:** Kemik mezarlığına ve mağara odasına bakarken r.info çağrı sayısı; DK.details.collectibles.length=46 ayrı örgü.
- **Kabul testi:** Mağara odası ve Kemik mezarlığı görünümlerinde çağrı ≥ %30 azalır; toplama/yeniden belirme davranışı aynı.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı ve genişletildi: limanda statik süsler 207 çağrı. Denetçi güveni: yüksek. Bilinen sorun: KI-214.

### J-24 — Bulut katmanı ayıklamasız ve yüksek ayrıntılı (tam kapalı gökte ~151 K üçgen); sis sprite'ları ayrı malzemeli (düşük)

- **Dosya ve fonksiyon:** js/world/weatherfx.js — cloudGeometry (15-42), weatherfx.init (64-89)
- **Kök neden:** Puflar IcosahedronGeometry(detay 2) = 180 üçgen, bulut başına 7–11 puf; 3 InstancedMesh × 30 örnek frustumCulled=false (kameranın arkası da çiziliyor); 28 sis sprite'ı her biri ayrı SpriteMaterial (28 çağrı).
- **Oyuncuya etkisi:** /tmp/denetim_alan/J_perf/clouds.mjs: tam kapalı gökte 151 200 üçgen (09 fırtına ölçümündeki +145 K ile uyumlu); sisli havada +28 çağrı.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Puf ayrıntısını 1'e indir (80 üçgen) ya da uzaktakileri billboard yap; bulutları kamera çevresinde sektörlere bölüp ayıklamayı aç; sis sprite'larını tek Points/InstancedMesh'e topla.
- **Tekrar üretme:** DK.sky.setWeather('firtina', true); DK.sim(3); bulut InstancedMesh'lerinde count × geometri üçgeni topla.
- **Kabul testi:** Fırtınada bulut üçgeni ≤ 60 K, sis efekti ≤ 2 çağrı; gökyüzü görünümü önce/sonra eşdeğer.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: fırtınada hava efekti 17 çağrı / 152 K üçgen. Denetçi güveni: yüksek. Bilinen sorun: KI-215.

### J-25 — Gölge haritası mağarada, su altında ve derin gecede de her kare çiziliyor; texel hizalama ve kaskad yok (düşük)

- **Dosya ve fonksiyon:** js/world/sky.js — sky.update ışık bölümü (333-341)
- **Kök neden:** Mağarada güneş yoğunluğu ×0,03'e iniyor, su altında ve gece etkisi çok az ama shadowMap.autoUpdate her kare açık; gölge kamerası odağa sürekli kayıyor (texel hizalama yok); tek 110 m kutu.
- **Oyuncuya etkisi:** Mağara/dalış/gece sahnelerinde gereksiz gölge geçişi (limanda 258 çağrı düzeyinde yük); yürürken gölge kenarı titremesi.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** inCave > 0,8, su altı ya da güneş yoğunluğu eşik altındayken renderer.shadowMap.autoUpdate=false (castShadow'a dokunmadan, yeniden derleme olmasın); gölge kamerasını texel boyutuna yuvarla; yüksek ayarda 2 kaskad değerlendir.
- **Tekrar üretme:** Mağara odasında r.info ile shadowMap.autoUpdate true/false çağrı farkı > 0.
- **Kabul testi:** Mağara/su altında gölge geçişi 0 çağrı; dışarı çıkınca aynı karede gölge döner; yürürken titreme gözle yok.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: mağara odasında gölge 161–175 çağrı / 290 K üçgen. Denetçi güveni: yüksek. Bilinen sorun: KI-216.

### J-26 — Sabit adım alt döngüsünde animasyon, parçacık yüklemesi ve O(n²) itişme her alt adımda tekrarlanıyor (düşük)

- **Dosya ve fonksiyon:** js/game/game.js — game.update/_step (185-238; SUBSTEP 187); enemies.update (js/game/enemies.js:1592-1622), Animal.update (js/wildlife/animals.js:465-, anim.update 636), crowd.update (js/game/crowd.js:13-45)
- **Kök neden:** effects, enemies, animals, bosses, crowd alt adım kümesinde; içlerindeki animasyon karıştırıcıları (char.update, anim.update), parçacık tampon yüklemesi ve crowd'un her alt adımda yeni ajan dizisi + O(n²) taraması 30 FPS'te 2×, 10–20 FPS'te 3–6× çalışıyor.
- **Oyuncuya etkisi:** Düşük FPS'te CPU maliyeti katlanıyor (MAX_SUB=6 ile sınırlı kendini besleyen yavaşlama); limanda 33 hayvan + NPC ile crowd taraması kare başına yüzlerce–binlerce çift.
- **Öncelik:** düşük · hedef faz: Faz 3 (+Faz 8)
- **Önerilen çözüm:** Animasyon karıştırıcısı ve görsel tampon güncellemelerini kare başına bir kez (son alt adımdan sonra) yap; crowd'u kare başına ya da uzamsal ızgarayla çalıştır, ajan dizisini yeniden kullan.
- **Tekrar üretme:** fpsLimit=20 iken profilde char.update/anim.update/crowd.update kare başına 3 kez.
- **Kabul testi:** Alt adım sayısından bağımsız animasyon güncellemesi kare başına 1; 20 FPS'te game.update süresi 60 FPS'tekinin ≤ 1,6 katı; 03_fizik_dt sonuçları değişmez.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi (C-14) ve karşı doğrulayıcısı (C-M04) aynı kusuru bağımsız olarak buldu. Denetçi güveni: yüksek. Ek doğrulama: Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla; animasyon ve parçacık yüklemesini Faz 3 C-14 çözüyor. Bilinen sorun: KI-055.

### J-27 — Kare başına çöp üreten ayırmalar (gökyüzü, hava efektleri, dümen suyu, yelken normalleri, odak listeleri) (düşük)

- **Dosya ve fonksiyon:** js/world/sky.js — sky.update (297-298, 344-345); weatherfx.update (js/world/weatherfx.js:246-247); Wake.update (js/world/details.js:175,178); Ship._animate (js/ship/ship.js:604,624,635); animals.update (js/wildlife/animals.js:791); enemies._populate (js/game/enemies.js:1543)
- **Kök neden:** Her karede yeni Color/Vector3, dizi değişmezleri, spread ile kurulan odak listeleri ve yelken normallerinin baştan hesabı.
- **Oyuncuya etkisi:** Büyük çöp toplama ~5–10 sn'de bir, bu ortamda tek karede 7–12 ms (4–22 ms) → periyodik takılma (10. belge §10.8.3).
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Geçici nesneleri modül düzeyinde yeniden kullan; Wake'te diziye doğrudan indeksle yaz; yelken normallerini yalnız biçim değişince ya da birkaç karede bir hesapla; odak listelerini yeniden kullan.
- **Tekrar üretme:** Chrome ayırma örnekleyicisiyle 40 sn seyir: sky.update, weatherfx.update, Wake.update, _animate ayırmaları.
- **Kabul testi:** 40 sn seyirde toplam ayırma ≥ %40 azalır; büyük toplama aralığı ≥ 2× uzar.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 11 #30; 02 T03; 14 #15
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Kod okumasıyla; satırlar belgenin ilgili bölümlerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-217.

### J-28 — Yakın-kamera silinmesi tüm bitki/karakter/aksesuar malzemelerine discard ekliyor; erken derinlik testi kapanıyor (düşük)

- **Dosya ve fonksiyon:** js/core/nearfade.js — nearFade (64-92), addShaderHook (39-51)
- **Kök neden:** Kanca parça gölgelendiricisine koşullu discard ekliyor (88); discard içeren programlarda GPU'lar erken-Z'yi kapatır; 'veg' kategorisinde görüş çizgisi silindiri hesabı da her pikselde yapılıyor.
- **Oyuncuya etkisi:** Yoğun ormanda ve kalabalık karakterli sahnelerde aşırı çizim maliyeti artabilir; gerçek GPU'da ölçülmedi.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Silinmeyi yalnız kameraya yakın nesnelere uygula (nesne mesafesine göre malzeme varyantı) ya da alpha-to-coverage; gerçek GPU'da ormanda önce/sonra GPU zamanı ölç.
- **Tekrar üretme:** Gerçek GPU'da yoğun ormanda NEAR_FADE aralıklarını 0'a çekip GPU kare süresini karşılaştır.
- **Kabul testi:** Ormanda GPU kare süresi farkı ölçülüp belgelenir; fark > %10 ise discard yalnız yakın nesne varyantında kalır.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #54
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Faz 8 tasarım belgesi (Ek A) bu maddeyi gerçek GPU olmadan ölçülemez olarak işaretledi. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: orta). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-218.

### J-29 — Ada kurulumunda bölünemeyen tek adım 10–12 ms sürüyor (3 ms bütçenin 3–4 katı) (düşük)

- **Dosya ve fonksiyon:** js/world/islands.js — _runJob (368-394), _npc (528-543), _port (544-600), Batch.steps (96-140)
- **Kök neden:** NPC karakter modeli kurulumu (Character, 1–10 ms) ve ilk liman kurulumunda soğuk kit parçası önbelleği tek adımda çalışıyor.
- **Oyuncuya etkisi:** Taban 13_donma P01: en uzun ada karesi 10,5 ms; ağır sahnede 60 FPS bütçesini aşan tekil kareler.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Kit parçalarını ve karakter şablonlarını yükleme ekranında ısıt; NPC kurulumunu alt adımlara böl (klon / atlas boyama / aksesuar) ya da sonraki kareye ertele.
- **Tekrar üretme:** 13_donma P01 çıktısı enUzunAdaKaresiMs (taban 10,5).
- **Kabul testi:** P01'de en uzun ada karesi ≤ 5 ms.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 14 #17
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Taban kaydıyla: 13_donma P01 10,5 ms. Denetçi güveni: yüksek. Bilinen sorun: KI-219.

### J-30 — NPC, balıkçı ve yakın hayvanlarda mesafeye bağlı animasyon/güncelleme seyreltmesi yok (düşük)

- **Dosya ve fonksiyon:** js/game/npcs.js — npcs.update (147-166); details.update balıkçılar (js/world/details.js:543-551); animals.update (js/wildlife/animals.js:810)
- **Kök neden:** Tüm NPC animasyonları her karede güncelleniyor (oyuncu açık denizdeyken liman NPC'leri dahil); balıkçı karakterleri mesafeden bağımsız; hayvanlar 250 m içinde her alt adımda tam güncelleniyor; co-op ev sahibinde '|| G.online' ile tüm hayvanlar.
- **Oyuncuya etkisi:** Gereksiz CPU (iskelet karıştırma, kemik matrisleri) ve kemik dokusu yüklemesi; kalabalık kasaba ve 4 oyunculu co-op'ta artar.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Mesafe/görünürlük katmanları: &lt;40 m tam, 40–120 m 15 Hz, >120 m ya da görünmezken dondur; co-op'ta en yakın oyuncu mesafesine göre.
- **Tekrar üretme:** Gemiyle limandan 1 km uzaklaş; npcs.update içinde anim.update kare başına 9+ kez çağrılıyor.
- **Kabul testi:** Görünmeyen/uzak NPC'lerde animasyon güncellemesi ≤ 1 Hz; yakındaki NPC davranışı değişmez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 8 tasarım belgesi Ek A (docs/v05/tasarim/FAZ8_PERFORMANS_TASARIM.md): doğru. Ölçümle doğrulandı: limandan 7 km uzakta npcs.update 0,35 ms/kare. Denetçi güveni: yüksek. Bilinen sorun: KI-220.

### J-M01 — Elde tutulan prosedürel eşyalar (kılıç, tabanca, kürek, olta, zıpkın, ağ, meşale) her hold() çağrısında yeniden kuruluyor; eskisi ve ölen düşmanın silahı GPU'dan hiç bırakılmıyor (orta)

- **Dosya ve fonksiyon:** js/player/character.js — Character.hold (646-694), Character._disposeModel (492-500), std (12), makeSword (194), makePistol (230), makeTorch (328). Çağıranlar: player.js:97/111-112/305/729/816/968, shipControl.js:176/185/211/236/260, net.js:115, enemies.js:284/1029/1047
- **Kök neden:** hold() önceki eşyayı yalnız parent.remove ile çıkarıyor, dispose etmiyor (character.js:648-649). make* fabrikaları her çağrıda yeni geometri, std() de her çağrıda yeni malzeme üretiyor; Node ile denedim, iki çağrı arasında hiç ortak geometri yok. _disposeModel yalnız build() sırasında ownGeo/ownMat işaretlenen örgüleri bırakıyor. hold() ile sonradan eklenen eşyalar işaretsiz kaldığı için Character.dispose (düşmanın ölmesi ya da kaldırılması, uzak oyuncunun ayrılması) onları da bırakmıyor. three.js r187'de bir kez çizilip dispose edilmemiş geometrinin tamponları WebGLBindingStates önbelleğinde kalıyor (three.module.js:1684 bindingStates[geometry.id], :1804-1846 saveCache). renderer.info.memory.geometries de yalnız dispose'ta azalıyor (:3863-3900). v0.3'te de aynı (character.js:566-569; v0.3'te dispose hiçbir şey bırakmıyordu). J listesinde ve 11/02 belgelerinde yok.
- **Oyuncuya etkisi:** Node ölçümüne göre (/tmp/denetim_alan/karsit_J/held_leak.mjs) kılıç 12 geometri, 9 malzeme ve ~49 KB tampon; tabanca 10 geometri, 3 malzeme, ~58 KB; meşale 3 geometri, 3 malzeme ve bir PointLight. Oyuncu her dümen, top, kürek, tırmanma, yüzme ya da taşıma geçişinde ve her kuşanma tuşunda yeni bir eşya kuruyor. Bu yüzden uzun oturumda geometri sayacı ile GPU ve JS belleği adım adım büyüyor; saatte yüzlerce geçişte onlarca MB. Düşmanlarda haydutların ~%33'ü kılıç (enemies.js:83), Nişancıların hepsi tabanca (:89) taşıyor; her ölüm ya da kaldırma bir silah sızdırıyor. Kızıl Hançer (:112) her menzilli atış döngüsünde kılıçla tabanca arasında geçiş yapıyor (:1029/:1047) ve her seferinde yeni tabanca kuruyor. Co-op'ta uzak oyuncunun her ekipman değişikliği diğer istemcilerde sızıntı yaratıyor. Meşalenin yeniden kurulması ışık sayısını da değiştiriyor (J-08). 09_performans düşman döngüsü bunu yakalayamıyor: 103 tohumlu haydut kılıç alıyor ama kamera başka yere baktığı için kılıç GPU'ya hiç yüklenmiyor.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** Prosedürel eşyaların geometri ve malzemelerini modül düzeyinde tür başına bir kez üretip paylaştır (kit eşyalarındaki gibi; clone(true) yalnız Object3D'yi kopyalar). Bu olmazsa hold() içinde eski prosedürel eşyayı disposeTree ile bırak; kit klonlarını hariç tut, çünkü onlar şablonla paylaşımlı. _disposeModel'de held ve heldL'yi de bırak. Tercihen karakter başına tür önbelleği tutup yalnız görünürlüğü değiştir; böylece dümen ve yüzme geçişlerinde yeniden kurma olmaz. Meşale ışığını kalıcı bir ışığa bağla (J-08). 09_performans düşman döngüsü kamerayı doğan düşmanlara çevirmeli.
- **Tekrar üretme:** Limanda, kamera oyuncuya bakarken: r=DK.engine.renderer.info.memory; p=DK.G.player; DK.post.render(); g0=r.geometries; for(let i=0;i&lt;20;i++){ p.char.hold('sword'); DK.post.render(); p.char.hold(null); DK.post.render(); } r.geometries-g0 → ≈ +240 (20×12). Düşman için: kamera oyuncuya bakarken e=DK.enemies.spawn('haydut', p.pos.x+3, p.pos.z+3, {seed:103}); DK.post.render(); e.dispose(); DK.post.render(); her döngüde geometri ≈ +12 artar.
- **Kabul testi:** Isınmadan sonra 20 hold/bırak döngüsünde geometri ve doku büyümesi 0. Kılıç ve tabanca taşıyan düşmanlar kameranın görüşündeyken 3×4 doğur/kaldır döngüsünde dG=dT=0. 09_performans düşman döngüsü kamerayı düşmanlara çevirir ve kılıçlı bir tohum içerir. Eşyalar görsel olarak değişmez.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-139.

### J-M02 — Gemi yeniden kurulumu (rebuild) eski gemi modelini ve delik görsellerini bırakmıyor: her limanda tamirde, görünüm değişikliğinde ve acil direkte tüm model sızıyor (orta)

- **Dosya ve fonksiyon:** js/ship/ship.js — Ship._build (57-64), Ship.rebuild (66-73), Ship._syncHoles (235-251). Çağıranlar: shop.js:179-191 repairShip (:188), shop.js:234-242 setShipLook (:238), shipControl.js:120, net.js:617/631, ship.js:722, main.js:332
- **Kök neden:** _build eski kökü yalnız scene.remove ile çıkarıyor (ship.js:58); disposeTree yalnız Ship.dispose'ta çağrılıyor (ship.js:739-744). Gemi modeli her gemi için kendi geometri ve malzemelerini üretiyor (shipModel.js; ship.js:736-738'deki yorum da bunu söylüyor). _syncHoles her çağrıda tüm delik gruplarını dispose etmeden atıp yeniden kuruyor; her delik 1 CircleGeometry+MeshBasicMaterial ve 4 BoxGeometry+MeshStandardMaterial içeriyor. Ağ tarafı biliniyor: B-02 (her mastFix iletisinde rebuild) ve docs/v05/tasarim/FAZ2_AG_GUVENLIGI_TASARIM.md:1247 (rebuild düzeltmesi planlı). Ama J listesinde ve 11. belgede yok. v0.3'te de aynı (ship.js:56-63, 234-237).
- **Oyuncuya etkisi:** Node sayımına göre (/tmp/denetim_alan/karsit_J/ship_leak.mjs) her rebuild'de sloop için 82 geometri, 21 malzeme ve ~226 KB; brigantin için 120 geometri, 29 malzeme ve ~316 KB köşe ve indis tamponu GPU'da (bindingStates üzerinden JS yığınında da) kalıyor. Tek oyunculuda olay başına ~0,2–0,3 MB GPU artı benzer miktarda JS belleği gidiyor; bu her limanda tamirde ve her görünüm değişikliğinde tekrarlanıyor. Co-op'ta konuklar her görünüm, mastFix ve netShipFull iletisinde modeli yeniden kuruyor; B-02 açığıyla bu sınırsız tetiklenebilir. 09_performans'ın gemi döngüsü yalnız new Ship ve dispose'u sınadığı için bunu yakalamıyor.
- **Öncelik:** orta · hedef faz: Faz 8
- **Önerilen çözüm:** _build'de önce eski kökteki userData.loot çocuklarını ayır (Ship.dispose'ta olduğu gibi; treasure.js:546 keseyi yeni köke taşıyor), sonra eski köke disposeTree uygula. Gemiye bağlı düşman işaretçilerini (enemies.js:1427, ship.root.attach) yeni köke taşı. _syncHoles'ta eski grupların geometri ve malzemelerini bırak ya da delik geometrisi ve malzemesini modül düzeyinde paylaştır.
- **Tekrar üretme:** Limanda gemi görünürken: r=DK.engine.renderer.info.memory; DK.post.render(); g0=r.geometries; for(let i=0;i&lt;5;i++){ DK.G.ship.rebuild({}); DK.post.render(); } r.geometries-g0 → ≈ +400 (5×~80). Delik için: 8 kez DK.G.ship.addHole(new DK.THREE.Vector3(1,0,i-3)) çağırıp her seferinde render et, sonra tüm delikleri repairHole ile onar → geometri sayacı başlangıç değerine dönmüyor.
- **Kabul testi:** Isınmadan sonra 5 rebuild ve 8 delik ekle/onar döngüsünün sonunda dG=dT=0. Rebuild'den sonra ganimet keseleri güvertede kalıyor. 09_performans'ın gemi döngüsüne rebuild ve delik adımları eklenmiş.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). B alanının karşı doğrulayıcısı aynı sızıntıyı bağımsız olarak kaydetti (B-02 doğrulaması: mastFix her iletide rebuild; _build eski kökü yalnız sahneden çıkarıyor, disposeTree yok). Bilinen sorun: KI-140.

### J-M03 — Efekt kalitesi her değiştiğinde UnrealBloomPass'in 11 HalfFloat hedefi bırakılmıyor (1080p'de ~15 MB, 2880×1800'de ~38 MB) (düşük)

- **Dosya ve fonksiyon:** js/core/post.js:60-76 (setQuality; composer.dispose 65) — post.setQuality
- **Kök neden:** setQuality eski composer'ı composer.dispose() ile bırakıyor (post.js:65), ama EffectComposer.dispose yalnız kendi hedeflerini bırakıyor (EffectComposer.js:354-361); UnrealBloomPass'in kendi 11 HalfFloat render hedefi serbest bırakılmıyor.
- **Oyuncuya etkisi:** Efekt ayarı her değiştiğinde GPU belleği sızıyor: 1080p'de ~15 MB, 2880×1800'de ~38 MB. Ayar sık değiştirilmedikçe etkisi düşük.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** Composer'ı bırakmadan önce bloom geçişinin dispose() yöntemini (ve diğer geçişlerin kendi hedeflerini) çağır; ya da composer'ı yeniden kurmak yerine geçiş parametrelerini değiştir.
- **Tekrar üretme:** Efekt ayarını yüksek ↔ düşük arasında 10 kez değiştir; renderer.info.memory.textures her döngüde artar.
- **Kabul testi:** 10 ayar değişikliğinden sonra doku sayısı başlangıç değerine döner (11_arayuz_sizinti benzeri kontrol).
- **Sürüm:** v0.3 ve v0.4 (v0.3 için rapor yazımında kod okumasıyla: v0.3 post.js:60-76 aynı yapı)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). J/SYS1 karşı doğrulama düzeltmesinden rapor yazımında ayrı madde olarak çıkarıldı; önerilen çözüm, tekrar üretme ve kabul testi rapor yazımında yazıldı ve ayrıca sınanmadı. Bilinen sorun: KI-221.

### J-M04 — Uzak oyuncunun ad etiketi sprite'ı ve CanvasTexture'ı bırakılmıyor (düşük)

- **Dosya ve fonksiyon:** js/net/net.js:75-85, 125 (RemotePlayer._label / dispose) — RemotePlayer._label / RemotePlayer.dispose
- **Kök neden:** RemotePlayer ad etiketini bir CanvasTexture ve SpriteMaterial ile kuruyor (net.js:75-85); dispose (net.js:125) kökü sahneden çıkarıp karakteri bırakıyor, ama etiketin dokusu ve malzemesi bırakılmıyor.
- **Oyuncuya etkisi:** Her konuk ayrılıp yeniden katıldığında bir etiket dokusu ve malzemesi GPU'da kalıyor; uzun co-op oturumlarında küçük, birikimli sızıntı.
- **Öncelik:** düşük · hedef faz: Faz 8
- **Önerilen çözüm:** dispose'ta etiket sprite'ının material.map.dispose() ve material.dispose() çağrılarını ekle.
- **Tekrar üretme:** Co-op'ta bir konuğu 10 kez çıkarıp yeniden kat; ev sahibinde renderer.info.memory.textures her döngüde artar.
- **Kabul testi:** 10 katılma/ayrılma döngüsünden sonra doku sayısı başlangıçla aynı.
- **Sürüm:** v0.3 ve v0.4 (v0.3 için rapor yazımında kod okumasıyla: v0.3 net.js:44-109; v0.3 dispose karakteri de bırakmıyor)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). J/SYS1 karşı doğrulama düzeltmesinden rapor yazımında ayrı madde olarak çıkarıldı; önerilen çözüm, tekrar üretme ve kabul testi rapor yazımında yazıldı ve ayrıca sınanmadı. Bilinen sorun: KI-222.

---

**5.K Alan K — Yayın, tek HTML, test altyapısı ve belgeler** · 20 denetim maddesi, 5 kaçan madde · varsayılan hedef faz: Faz 9

Denetçi özeti: Yayın hattı v0.4'te yalnız kısmen sağlamlaştırılmış. v0.4 dalının pages.yml'si push tetiklemesini canlı dala daraltıyor (d6e716f). Buna karşılık canlı/varsayılan dal hâlâ v0.3'ün 'claude/**' kuralını taşıyor, workflow_dispatch her daldan yayın yapabiliyor, canlı dal korumasız (GitHub API: protected=false) ve hiçbir CI/PR test kapısı yok. Actions geçmişine göre 31 Ekim'de aynı commit'ler için iş akışı yayınının yanında GitHub'ın dal tabanlı Jekyll yayını da çalıştı ve her seferinde sonra bitti; yani canlı site fiilen dalın ham içeriğinden sunuluyor (kökteki commit'li tek HTML ile docs/ ve tests/ dahil). Kökteki DenizKorsanlari-SonHazine.html, v0.4 dalında bayt bayt v0.3 derlemesi: v0.3 kaynağı yeniden derlendiğinde sha256 f0ac8cb0… eşleşti. Güncel v0.4 derlemesi yalnız git dışındaki dist/'te duruyor (sha256 75587dd9…, kaynakla bayt bayt aynı) ve 02_tek_dosya ile file:// altında 4/4 geçiyor. window.DK, DK.sim/tap/press/snap ve ?peerhost/?terrain test parametreleri v0.3'te de v0.4'te de üretimde koşulsuz açık; ?peerhost, davet bağlantısıyla konuğun sinyal sunucusunu saldırgana yönlendirmeye izin veriyor. Tek HTML'in fetch yaması, dosya adı 'assets' ile biten bir klasördeyken oyunu hiç açtırmıyor (Node benzetimiyle doğrulandı); IIFE derlemesi katı kipi (strict) de düşürüyor ve lisans notlarını siliyor. Test altyapısı tabanda 25 koşunun 23'ünü geçiriyor. Ancak konsol hataları ve 404'ler başarısızlık sayılmıyor, coop.cjs istisnaları yutuyor, 03_fizik_dt ve 99 v03 betiği hiç onay içermediği hâlde belgelerde 'GEÇTİ' görünüyor. 62 testin 22'si karşılanıyor, 30'u kısmen, 10'u hiç yok. README ve eski belgeler v0.4 dalında bayat (sürüm 0.3, dost ateşi seçeneği, yüzen nesne sınırı).

