## 3. Tekniklerin değerlendirmesi

Ölçekler: "Kazanç" sütunundaki sayılar §2 ve §1.5'teki **ölçülmüş** grup değerlerinden hesaplanan tahminlerdir (uygulamadan sonra 45_perf_matris ile doğrulanacak). "Görsel risk": D = düşük (görüntü birebir aynı kalmalı; fark testiyle kanıtlanır), O = orta (eşik/geçiş anında fark olabilir; kamera taramasıyla denetlenir), Y = yüksek.

### 3.0 Özet tablo

| # | Teknik | Bugün | Karar | Beklenen kazanç (liman 09 görünümü / diğer) | Görsel risk | Bağımlılık |
|---|---|---|---|---|---|---|
| T1 | Statik geometri birleştirme | Yalnız liman (port.js:317), malzemeler benzersiz | **Uygula**: liman malzeme ortaklaştırma, çekirdek ada süsleri hücre birleştirmesi, gemi gövde parçaları | −68 (liman yapıları) −120…−170 (süsler); denizde gemi −120 | D–O | T12 |
| T2 | InstancedMesh | Bitki, mercan, martı, bulut, balık | **Uygula**: kabuklar, deniz kayalıkları, sarkıtlar, mezarlar, fenerler, gemi topları | −14 kabuk, −34 kayalık, −25 sarkıt | D | — |
| T3 | LOD (ayrıntı düzeyi) | Arazi halkaları, ada hücreleri, deniz devi 700 m | **Uygula**: karakter/hayvan görünürlük + animasyon katmanları, bitki hücreleri; örgü LOD'u yalnız gemide (isteğe bağlı) | −104 NPC (her sahnede ~−110 uzak liman NPC'si) | O | Faz 3 ÇİZİM evresi |
| T4 | Örtme (occlusion) | Yok | **Bölge ayıklaması uygula** (mağara içi/dışı), GPU örtme sorgusu **uygulama** | Mağarada −1 000 çağrı; limanda −30 | O | Faz 6 mağaraları |
| T5 | Gölge mesafesi | 110 m kutu, her şey gölge atıyor | **Uygula**: gölge atan budaması, mağara/su altı/gecede güncelleme yok, texel hizalama, ön ayara bağlı kutu | Gölge geçişi 246 → ~110 çağrı, 369 K → ~150 K üçgen; mağarada gölge 0 | D (hizalama iyileştirir) | T3 |
| T6 | Uzak nesne ayrıntısı | Yok (camera.far 5 km) | **Uygula**: ekran boyutu + sis görüşüne bağlı mesafe ayıklaması | Açık denizde en yoğun yön 980 → ~350; kasabada 1 133 → ~550 | O | T1, T2 |
| T7 | Bitki örtüsü | Çekirdek adalar tek parça | **Uygula**: çekirdek bitkiyi hücrelere böl (ada `Batch` deseni), gölge yalnız yakında | Üçgen −220 K (liman), gölge −120 K | D–O | — |
| T8 | Hayvan simülasyon LOD'u | 250 m dışında yok; co-op'ta hepsi | **Uygula**: mesafe katmanları (en yakın oyuncuya), parça birleştirme | −213 çağrı (liman); JS −0,1…−0,3 ms | O | Faz 3, Faz 5 |
| T9 | Düşman AI LOD'u | Var (enemies.js:1597-1606) | **Koru + genişlet**: görünmezken animasyon seyreltme | JS küçük; kamp/savaş sahnelerinde | D | Faz 7 |
| T10 | Parçacık havuzları | Tek Points (900), CPU verimsiz | **Uygula**: SoA halka tampon, kısmi yükleme | Çağrı 0; JS/GC küçük | D | Faz 3 |
| T11 | Doku önbelleği | Anahtarlı + FIFO 96 | **Uygula**: başvuru sayacı, liman atlası, doku bütçesi | Doku 200 → ≤ 170 | D | T1 |
| T12 | Geometri/malzeme paylaşımı | Kısmen | **Uygula**: hayvan türü önbelleği, yüzen nesneler, kabuklar | Bellek + yükleme takılması | D | — |
| T13 | Bellek temizliği | Çoğu var; 3 açık | **Uygula**: J-21, J-22, lav işaretleri, boss mermileri; 09 testi düzeltmesi | Uzun oturum düz | D | — |
| T14 | Gereksiz çizim ve derleme | Ön derleme yanlış varyant; meşale; duraklatma | **Uygula** | İlk kare derlemesi ~40 → ≤ 3 program; meşale 25 → 0 | D | — |

### 3.1 T1 — Statik geometri birleştirme

**Bugün.** `mergeStatic` (batch.js:4-56) yalnız Kırlangıç limanında kullanılıyor (port.js:317) ve malzeme uuid'ine göre birleştiriyor. `texMat` her çağrıda dokuyu klonlayıp yeni malzeme üretiyor (port.js:15-20), bina dokuları bina tohumuyla ayrı tuvallerden geliyor (port.js:34-59), 7 fenerin her biri iki benzersiz malzeme kullanıyor (port.js:397-409; `port.update` hepsine aynı parlaklığı veriyor, port.js:455). Sonuç: `port-batched` 84 örgü, limanda **108 çağrı** (44 A + 64 G). Çekirdek ada süsleri (deniz kayalıkları, kazı noktası işaretleri, heykel/mezar/harabe/kamp, mağara parçaları) hiç birleştirilmiyor: limanda **207 çağrı**.

**Öneri.**
1. *Liman*: duvar/çatı/temel türü başına **tek malzeme**; bina çeşitliliği köşe rengine (`color` özniteliği, `vertexColors`) ve 2×2 doku atlasının hücresine taşınır (UV'ye pişirilir: `repeat` birleştirmeden önce UV'ye uygulanır). Fenerler tek direk + tek ampul malzemesi. Deniz fenerinin hareketsiz parçaları birleşik gruba. Hedef `port-batched` ≤ 25 örgü.
2. *Çekirdek ada süsleri*: `assets.prop` klonları yerine `islands.js`'teki `Batch` (hücreli `InstancedMesh`) ya da hücre başına `mergeStatic` kullanılır. Seçim kuralı: aynı model ≥ 4 kez → örnekleme (T2); tekil ve hareketsiz → 160 m hücre ve malzeme başına birleştirme. Çarpıştırıcılar (`physics.addCircle`) değişmez.
3. *Gemi* (J-04): sloop 80 örgü / 19 malzeme, hepsi gölge atıyor (shipModel.js:524). Hareketsiz parçalar (gövde donanımı, küpeşte, merdiven, ambar kapağı, masa, kova, mataforalar) **malzeme başına** birleştirilir; dönen/oynayan parçalar (yelkenler, dümen çarkı, toplar, çapa ve zinciri, bayrak, fener) ayrı kalır; toplar `InstancedMesh`. Hasar görselleri (`_applyDamageVisuals`, ship.js:722; direk devrilmesi `masts`) birleşik örgüyü yeniden kurar (`rebuild`, ship.js:66). Hedef sloop ≤ 20 örgü, ≤ 10 gölge atan; brigantin ≤ 30.

**Kazanç.** Liman yapıları 108 → ~40; süsler 207 → ~40 (mağara içi T4 ile ayrıca 0); denizde oyuncu gemisi 161 → ~35 çağrı (açık deniz, fırtına, Kraken: her biri −125; deniz savaşında iki gemi −250).

**Görsel risk.** D–O. Doku ölçeği ve renkler birebir korunmalı (önce/sonra görüntü farkı, §8.3). Birleşik örgü tek sınır küresi taşıdığı için görüş konisi ayıklaması kabalaşır; bu yüzden birleştirme **hücre** (160 m) düzeyinde yapılır.

**Uyum.** Faz 3: birleşik örgüler yalnız görseldir; çarpıştırıcılar, platformlar ve `GORSEL` kamera kutuları ayrı kalır. Faz 6: yeni yapılar zaten `Batch`'e giriyor (Faz 6 §6.3: "Kit parçaları adanın Batch'ine… yapı başına ≤ 12 örnek grubu"); bu adım çekirdek adaları aynı düzene getirir. Faz 2/5: gemi görünüm/hasar iletileri (`shipDmg`) değişmez; konukta `rebuild` aynı kodu çalıştırır.

### 3.2 T2 — InstancedMesh

**Bugün.** Örnekleme bitki örtüsünde (props.js:17-48), ek ada hücrelerinde (islands.js:79-140), mercan/yosun/kabuk/martıda (details.js:24-37, :225-250, :324), bulutta (weatherfx.js:64-77) ve balıkta (fish.js:326) var. Yok: 46 toplanabilir kabuk/istiridye (details.js:252-271, her biri yeni geometri + malzeme), deniz kayalıkları (details.js:282-307, kayalık başına `cloneMat`), 26 sarkıt (cave.js:93-101), mezarlar (props.js:356-372), liman fenerleri, gemi topları.

**Öneri.** Tür başına `InstancedMesh`; toplanan/yok edilen örnek `setMatrixAt(i, sıfır ölçek)` ya da son örnekle yer değiştirme + `count--` ile gizlenir; Faz 4 K-3 gereği kabuk ve istiridye yenilenince örnek geri açılır. Deniz kayalıklarının kararmış rengi (details.js:299, `color×0,8`) örnek rengiyle (`setColorAt`) verilir: tek malzeme.

**Kazanç.** Limanda kabuk 16 → 2, kayalık 36 → 2, sarkıt 26 → 1 (dışarıdan T4 ile 0); Tuz Pazarı'ndan bakınca kabuk 45 → 2, kayalık 66 → 2.

**Görsel risk.** D. **Uyum.** Faz 4: toplama durumu kayıtta kimlikle tutuluyor; örnek indeksi kayda girmez (yalnız kimlik → indeks eşlemesi çalışma anında). Faz 5: kabuk toplama olayı değişmez.

### 3.3 T3 — LOD

**Bugün.** Arazi 4 halka (terrain.js:18-23), ek ada hücre görünürlüğü/gölgesi (islands.js:404-415), deniz devi 700 m (megafauna.js:405), düşman AI adımı (enemies.js:1597-1606). Karakter, hayvan, gemi, çekirdek bitki ve süslerde mesafe LOD'u yok; üstelik karakterlerde görüş konisi ayıklaması bile kapalı (character.js:458, :967; kk.js:93).

**Öneri.** Bu oyunda örgüler zaten düşük çokgenli (karakter parçası ~1 K üçgen, palmiye 156, orman ağacı 376); kazanç **örgü sadeleştirmesinden değil, çizilmeyen/güncellenmeyen nesneden** gelir. Ortak bir `js/core/lod.js` modülü:

- *Görünürlük katmanı* (çizim): `visible = d < dVis(kategori, ön ayar)` + %10 histerezis; kategori mesafeleri §4'te. Yakın-kamera silinmesinin (nearfade.js) tersi olarak geçişte 0,3 sn'lik titreşimli belirme/kaybolma (aynı `discard` kancası, ters yön) kullanılabilir; pop-in yerine.
- *Animasyon katmanı* (çizim evresi, Faz 3 `render(alpha, rdt)`): ≤ 40 m her kare; 40–120 m 15 Hz; > 120 m ya da görüş konisinin dışında 4 Hz; gizliyken hiç. `mixer.update(biriken rdt)` ile çağrılır: animasyon süresi kaymaz.
- *Benzetim katmanı* (adım evresi): §3.8–3.9.
- *Örgü LOD'u*: yalnız gemide, 300 m ötesinde ip/top/güverte süsleri gizlenir (birleştirmeden sonra kazanç küçükse yapılmaz).

**Kazanç.** J-01 düzeltmesi (görüş konisi ayıklaması geri) + mesafe gizleme: limanda NPC 159 → ~55; **diğer bütün sahnelerde** uzak liman NPC'lerinin 110 çağrısı ve 74 K üçgeni sıfırlanır (ölçüldü: Kadim Tapınak, Kraken, Volkanik Dev, açık deniz, fırtına, deniz savaşı). Animasyon katmanları NPC/balıkçı/uzak oyuncu güncellemesini azaltır (npcs.update 0,19–0,40 ms ölçüldü).

**Görsel risk.** O: animasyonlu iskeletli örgünün sınır küresi bağlama pozundan küçük kalırsa ekran kenarında kaybolma olur. Önlem: `SkinnedMesh.computeBoundingSphere()` bağlama pozunda, yarıçap ×1,5; ya da karakter kökü için elle küre testi (r ≈ 1,6 m) ve kök `visible` yönetimi. Kamera taraması (kamera_tarama b4, 17_kamera_kararma) kabul ölçütüdür.

**Uyum.** Faz 3: animasyon ve görsel güncellemeler ÇİZİM evresine taşınıyor (Faz 3 §1.3, C-14); LOD bu evreye kanca olarak eklenir, adım evresine dokunmaz. Faz 5: uzak oyuncu avatarları (net.js:57-124) aynı karakter LOD'unu kullanır; ağ ara değerlemesi (NetInterp) çizim evresinde konum hesaplar, LOD yalnız `visible`/animasyon sıklığını belirler. Faz 7: düşman ve boss animasyon değişiklikleri `lod.animStep(entity)` sorusuna uyar; hedefli/saldıran düşman her zaman tam katmanda.

### 3.4 T4 — Örtme ayıklaması

**Bugün.** Yalnız three.js görüş konisi. Mağaradayken dış dünya, dışarıdayken mağara içi çiziliyor (cave.js mağara parçalarını doğrudan sahneye ekliyor: :50, :88, :101, :169).

**Ölçüm.** Mağara odasında **1 246 çağrı** (561 hayvan, 152 süs, 151 NPC, 65 arazi, 56 liman, 36 çekirdek bitki — 473 K üçgen, okyanus 179 K); 8 yön medyanı 479, en çok 1 112. Odadan bunların hiçbiri görünmez. Limandayken mağara içinin 30 çağrısı (tepenin içinde) çiziliyor.

**Değerlendirme.** WebGL2 örtme sorguları (`ANY_SAMPLES_PASSED_CONSERVATIVE`) three.js'te hazır değil; sonuçlar 1–3 kare gecikmeli gelir (pop-in), sorgu başına sınır kutusu çizimi gerekir, açık deniz/ada dünyasında büyük örtücü azdır. **Önerilmez.** Bunun yerine **bölge (portal) ayıklaması**: veriyle tanımlı bölgeler (`zones.js`): Yankı Mağarası için `CAVE.chamber` + tünelin ağızdan ≥ 30 m içerisi (`cave.insideFactor`, cave.js:215-227, kamera konumuyla) "iç bölge"; içteyken dış gruplar (okyanus, bulut/sis, arazi karoları — mağara kabuğu hariç, ada içerikleri, liman, çekirdek bitki, hayvan/NPC/düşman kökleri, gemiler) `visible=false`; dışarıdayken ve ağza 40 m'den uzakken mağara grubu gizli. Ağız ile 30 m arasındaki geçiş bölgesinde hiçbir şey gizlenmez (dışarısı görülebilir).

**Kazanç.** Mağara odasında ~1 246 → ≤ 250 çağrı ve gölge geçişi 0 (T5 ile); limanda −30.

**Görsel risk.** O: yanlış bölge sınırı dışarıyı gösteren bir açıda nesne kaybettirir. Kabul: tünelin 5 noktasında (ağızdan 10/20/30/40/60 m) bölge ayıklaması açık/kapalı görüntülerinin piksel farkı = 0 (§8.3).

**Uyum.** Faz 6: yeni mağaralar (Ayaz Mağarası, Derin Galeri; Faz 6 K-4 "oyma" A planı) `CAVES` listesine giriyor (Faz 6 §6.4: `STORY_CAVES → CAVES`); bölge tanımı her mağara kaydına `zone: { chamber, path, minDepth }` olarak eklenir, ada kurulunca kaydolur, boşaltılınca silinir (`B.extras`). Faz 3: kamera mağara tavanı sınırlaması (game.js:345) değişmez.

### 3.5 T5 — Gölge mesafesi

**Bugün.** Tek yönlü ışık, 2048 (yüksek) / 1024 harita, ±55 m ortografik kutu, far 300 (sky.js:136-145); kutu her kare odağa kayıyor, texel hizalaması yok (sky.js:338-341). `frustumCulled=false` karakterler ve dev sınır küreli çekirdek bitki kutudan bağımsız gölgeye çiziliyor; geminin bütün örgüleri gölge atıyor (shipModel.js:524). Mağarada güneş ×0,03'e iniyor (sky.js:336) ama gölge haritası her kare çiziliyor.

**Öneri.**
1. *Gölge atanları budama*: T3 ile karakterler gölge kutusuna göre ayıklanır (three.module.js:9373 kendiliğinden işler); çekirdek bitki hücrelerinde gölge yalnız oyuncuya ≤ 120 m hücrelerde (ek adalarda bugün 220 m; kutu 55 m olduğu için 120 m yeter); yarıçapı < 0,25 m parçalar gölge atmaz (gemi parçaları, süsler).
2. *Görünmez gölgeyi çizmeme*: `renderer.shadowMap.autoUpdate=false` (castShadow'a dokunmadan, program değişmez) şu durumlarda: kamera mağara iç bölgesinde (T4), su altında (`sky.underwater`), güneş yoğunluğu ışık eşiğinin altında (derin gece, `sky.sun.intensity < 0,15`). Çıkışta `needsUpdate=true` ile aynı karede güncellenir.
3. *Texel hizalama*: gölge kamerasının konumu texel boyutuna (110 m / 2048 = 5,4 cm) yuvarlanır: yürürken gölge kenarı titremesi biter (görsel **iyileşme**).
4. *Ön ayar*: Yüksek ±55 m / 2048 (bugünkü görünüm), Orta ±40 m / 1024 (texel 7,8 cm), Düşük kapalı. Bugünkü "Orta"da (1024, ±55 m) texel 10,7 cm idi; yeni Orta daha keskin gölge verir.

**Kazanç.** Limanda gölge geçişi 246 → ~110 çağrı, 369 K → ~150 K üçgen (NPC −85, bitki −120 K üçgen, liman −40 T1 ile); mağarada 175 çağrı / 290 K üçgen → 0; açık denizde gemi gölgesi 80 → ~10 (T1).

**Görsel risk.** D. Gölge kutusu ve çözünürlük Yüksek'te değişmez. **Uyum.** Faz 3 çizim ara değerlemesiyle çakışmaz (gölge, çizim pozuyla çizilir).

### 3.6 T6 — Uzak nesne ayrıntısı

**Bugün.** `camera.far = 1500 + 3500·görüş` (settings.js:61; varsayılan 5 000 m), gök kubbesi 4 000 m yarıçaplı (sky.js:72), okyanus 3 200 m (ocean.js:66). Sis yoğunluğu açık havada 0,0011 (d99 = √(−ln 0,01)/ρ ≈ **1 951 m**), fırtınada 0,0076 (**282 m**), sisli havada 0,0101 (**212 m**) (sky.js:359; WEATHERS sky.js:10-17). Kesme mesafeleri sise bağlı değil (J-13).

**Ölçüm.** Açık denizde Kırlangıç'a bakan yön 962–980 çağrı (diğer yönler 387–485); Tuz Pazarı'nda limana bakan yön 1 133 çağrı. Kırlangıç'tan 1,6–1,9 km'de çizilen süsler ekranda 1–2 piksel ya da tamamen sis rengidir.

**Öneri.** `lod.js`'e iki kural:
1. *Ekran boyutu*: nesnenin ekrandaki çapı 1080 satırlık ekranda ~1,5 pikselin altına inince çizilmez: `dMax = k · r`, FOV 70°'de k ≈ 1 000 (odak 771 px; 1,5 px ⇔ d ≈ 1 028·r). Örnek: 0,12 m kabuk 120 m, 0,7 m sandık 700 m, 1 m NPC 1 000 m. Ön ayar çarpanı Yüksek 1,0 / Orta 0,7 / Düşük 0,5.
2. *Sis*: `dMax ≤ 1,1 · d99(hava, bölge)`; arazi halkası yarıçapı da `min(LOD.d·lodScale, 1,15·d99)` ile kırpılır (en yakın halka hiç kırpılmaz). Gök kubbesi ve okyanus kırpılmaz (camera.far değişmez: kubbe 4 km).
Statik nesnelerde denetim hücre düzeyinde ve 4 Hz'de (islands.js `_cellLod` deseni, 15 karede bir); dinamiklerde varlık başına.

**Kazanç.** Açık denizde en yoğun yön 980 → ~350; kasabada 1 133 → ~550 (T3 ile); fırtınada arazi ve ada hücreleri 280 m'de kesilir (09'daki fırtına ölçümü 697 K üçgen).

**Görsel risk.** O: eşikte belirme. Önlem: eşik %99 sisin ötesinde ya da 1,5 pikselin altında; %10 histerezis; kamera taramasında sınır geçişi görüntü farkı.

**Uyum.** Faz 5 dürbün odağı (`lk`, ±8° koni, 1 500 m): dürbün açıkken FOV küçüldüğü için ekran boyutu kuralı `k` değerini FOV'a göre büyütür (dürbünde uzak gemi ve ada görünür kalır). Faz 6 Ölü Sis: sis kabukları görüş mesafesini daha da düşürür; d99 hesabına bölge sisi (`regionFog`) zaten giriyor.

### 3.7 T7 — Bitki örtüsü

**Bugün.** Çekirdek 6 adanın bitkisi tür/parça başına tek `InstancedMesh`; ölçülen sınır küresi yarıçapları ana türlerde 606–779 m (props.js:17-48; bu çalışmada `boundingSphere.radius` okundu). Yüksek ayarda 1 598 örnek (palmiye 297, orman ağacı 264, ot 425, eğrelti 241, çalı 157, kaya 97…). Limanda **473 K üçgen** (303 K ana + 170 K gölge), kamera nereye bakarsa baksın. Bütün bitki malzemelerinde yakın-kamera silinmesi (`discard`, nearfade.js:64-92).

**Öneri.** Çekirdek bitkiyi ek adalardaki `Batch` ile aynı düzene getir: dönüşüm listeleri ve RNG sırası **birebir aynı** (props.js:164-251 değişmez), yalnız `instanced()`/`_inst()` çağrıları 160 m hücre × tür anahtarıyla gruplanır; `_cellLod` (islands.js:404-415) aynı kurallarla (büyük 850 m, küçük 240 m, gölge ≤ 120 m) bunlara da uygulanır. Küçük türler (ot, eğrelti, çiçek, mantar, küçük kaya) 200–240 m arasında titreşimli kaybolur. Alternatif (ileride): r187 `BatchedMesh` (nesne başına ayıklama, malzeme başına tek çağrı); rüzgâr kancası `USE_INSTANCING` yerine `USE_BATCHING` dalı ister, şimdilik ertelenir.

**Kazanç.** Limanda üçgen −200…−250 K (ana −100 K, gölge −120 K); çağrı 36 → 40–70 (hücre sayısı artar, ayıklama azaltır). Not: çağrı sayısında küçük artış kabul edilir; üçgen ve gölge kazancı büyüktür.

**Görsel risk.** D–O (küçük türlerin 240 m sınırı). **Uyum.** Faz 6 K-3 (bitki adaylarında sabit çekiliş) ek adalar içindir; çekirdek bitki RNG'si (`rng(4242)`) değişmez → Node eşdeğerlik testi (dönüşümlerin sıralı özeti aynı). Faz 3: bitki çarpıştırıcıları (props.js:236-249) değişmez.

### 3.8 T8 — Hayvan simülasyon LOD'u

**Bugün.** Bölge r+150 m'de doğar, r+230 m'de silinir, denetim 4 Hz (animals.js:793-807); güncelleme yalnız 250 m içinde **ama co-op'ta (`|| G.online`) bütün hayvanlar** (animals.js:810). 250 m içinde seyreltme yok. Modeller parça başına örgü/geometri/malzeme (domuz 20, timsah 34, yılan 22 örgü; animals.js:21-298).

**Ölçüm.** Limanda 27 hayvan, **333 çağrı**; `animals.update` 0,08–0,40 ms/kare (koşudan koşuya değişken). Mağarada 46 hayvan **617 çağrı**. Benzetilmiş co-op'ta (`G.online=true`) aynı 27 hayvan için fark ölçülemeyecek kadar küçük (0,08 → 0,11 ms): hepsi zaten 250 m içinde.

**Öneri.**
1. *Parça birleştirme* (J-05): pivot grubu başına (gövde, baş, her bacak/kanat) tek geometri; tür başına geometri önbelleği; renk farkı malzeme varyantıyla (tür × renk). Domuz 20 → 6, maymun 12 → 6, papağan 9 → 4, timsah 34 → 8, yılan 22 → 4 (segment dalgası köşe gölgelendiricisine taşınırsa 1).
2. *Benzetim katmanları* (en yakın oyuncuya uzaklık; Faz 5 odak noktalarıyla aynı küme: yerel oyuncu + `G.remotes`): ≤ 40 m her adım; 40–100 m AI 10 Hz; 100–250 m AI 4 Hz; > 250 m donuk. Seyrek adımlar birikmiş `dt` ile koşar (Faz 3 C-15/C-16'nın parçalı hareket kuralı: hareket alt parçalara bölünür, karar seyrek). `|| G.online` kaldırılır; yerine "herhangi bir oyuncuya ≤ 250 m".
3. *Görünürlük/animasyon*: T3 katmanları; 120 m ötesi gizli (ekran boyutu kuralı domuz için ~700 m verir ama sürü/av hayvanı için 120–160 m oynanış açısından yeterli görüş).

**Kazanç.** Limanda 333 → ~120 çağrı (birleştirme) ve uzaktakiler gizlenince ~90; mağarada 617 → 0 (T4); JS −0,05…−0,2 ms.

**Görsel risk.** O (bacak salınımı ve yılan dalgası birebir korunmalı; Node'da poz karşılaştırması). **Uyum.** Faz 3: AI/hareket ADIM'da, animasyon ÇİZİM'de (Faz 3 §3 tablosu). Faz 5: hayvan anlık görüntüsü ilgi alanı katmanlarıyla gider (K0 ≤ 40 m 7,5 Hz…); benzetim katmanı konukta değil, ev sahibinde işler; konuk yalnız ara değerler. Faz 2: hayvan hasarı/ganimeti host'ta, değişmez.

### 3.9 T9 — Düşman AI LOD'u

**Bugün.** Hedefsiz düşman 45–90 m'de 0,066 sn, 90 m ötesi 0,25 sn birikimle tek `e.update(edt)`; hedefli düşman seyreltilmez (enemies.js:1597-1606; 05_dusman_ai F-08 tabanda geçti). Gruplar 140 m'de doğar, 220 m'de kalkar (enemies.js:1539-1570). `e.char.update(edt)` aynı seyreklikte (yani animasyon da seyrek).

**Öneri.** Mevcut kural korunur (Faz 3 A6 bunu parçalı harekete çeviriyor). Eklenen: görüş konisinin dışındaki ve > 30 m düşmanın animasyonu 4 Hz (T3), gölgesi kutu dışında yok. Faz 7'nin yeni algı/taktik davranışları aynı `lod.simTier()` sorusunu kullanır; "hedefli/saldıran düşman tam katman" kuralı Faz 7'de de korunur.

**Kazanç.** Çağrı: kamp/deniz savaşı sahnelerinde düşman çağrıları görünür olanlarla sınırlanır (deniz savaşında tayfa 24 A + 59 G; gölgenin çoğu kutu dışında). JS küçük (0,01–0,35 ms ölçüldü).

**Görsel risk.** D. **Uyum.** Faz 7 AI tasarımı (henüz yok; tarayıcı 37–44, co-op 08a–08c) bu API'ye bağlanır; Faz 7 seyreltmeyi değiştirirse 05_dusman_ai F-08 ve 45 matrisi yeniden koşulur.

### 3.10 T10 — Parçacık havuzları

**Bugün.** Tek `Points`, en çok 900 (effects.js:9, :24-35); parçacık başına JS nesnesi, dolunca `shift()` (effects.js:45-48), ölüler `splice` (:121-146); her güncellemede 4 öznitelik × 900 öğe tam yükleme ve `setDrawRange(0, MAX)`; `effects` alt adım kümesinde (game.js:187) → düşük FPS'te kare başına 2–6 yükleme.

**Öneri.** SoA (`Float32Array` konum/hız/ömür/renk/boy) halka tampon; ölü parçacık son canlıyla yer değiştirir (O(1)); `setDrawRange(0, n)`; `attribute.addUpdateRange(0, n·itemSize)`; GPU yüklemesi kare başına bir kez, ÇİZİM evresinde (Faz 3 §3: "Parçacıklar … ÇİZİM (rdt)"). Ön ayar bütçesi: 900 / 700 / 450.

**Kazanç.** Çağrı değişmez (1). Fırtınada ve deniz savaşında JS ve çöp toplama baskısı azalır; parçacık yokken yükleme 0. **Görsel risk.** D. **Uyum.** Faz 3 doğrudan.

### 3.11 T11 — Doku önbelleği

**Bugün.** `textures.js:5` anahtarlı önbellek; liman `texMat` klonları aynı `Source`'u paylaşır (GPU belleği çoğalmaz) ama ayrı malzeme yüzünden birleştirmeyi engeller; bina tohumuna göre ~39 adet 256² tuval dokusu (port.js:34-59). Karakter renk atlası `kk.texture` FIFO 96 (kk.js:244): en eski doku, kullanılıp kullanılmadığına bakılmadan `dispose` ediliyor (J-22).

**Öneri.** Liman doku atlası (T1); `kk.texture` için başvuru sayacı (Character.build artırır, `_disposeModel` azaltır) ve yalnız sayacı 0 olanlar arasında LRU tahliye. 45 matrisinde doku sayısı bütçesi.

**Kazanç.** Limanda doku 200 → ≤ 170; uzun oturumda yeniden yükleme takılması yok. **Görsel risk.** D.

### 3.12 T12 — Geometri ve malzeme paylaşımı

**Bugün.** Paylaşılan: ada parça önbelleği (islands.js:44-77), deniz devi `GEO` (megafauna.js:135-210, init'te hazırlanıyor), mermi `PROJ_GEO` (enemies.js:1248-1281). Paylaşılmayan: hayvan bireyleri, kabuklar, yüzen olay nesneleri (events.js:158-197, her doğuşta yeni geometri + malzeme), yıldırım tüpleri (weatherfx.js:171-216, çakış başına 4 geometri).

**Öneri.** Hayvan türü geometri önbelleği (T8), kabuklar (T2), yüzen nesneler için modül düzeyinde paylaşımlı geometri/malzeme (J-21 de kapanır), yıldırım için 2 örgülük havuz (konumları güncellenir). Karakter klon malzemeleri (character.js:459) görünüm anahtarına göre paylaşılabilir; kazanç küçük olduğu için yalnız aynı tohumlu düşman dalgalarında değerlendirilir.

**Kazanç.** Yükleme anı takılması ve GPU kaynak sayısı; çağrı değişmez. **Görsel risk.** D.

### 3.13 T13 — Bellek temizliği

Ayrıntı §5. Özet: ada/hayvan/düşman/kese/gemi bırakma testleri tabanda 0/0; açık olanlar: yüzen olay nesneleri (J-21, bu çalışmada ölçüldü: şişe döngüsü başına +2 geometri), `kk.texture` FIFO (J-22), `enemies.start` uçuştaki yaylı atış işaretlerini sahnede bırakıyor (yeni bulgu), `bosses._clear` sahibi kaldırılan lav mermilerini uçuşta bırakıyor (yeni bulgu); 09'un Volkanik Dev kontrolü **sızıntı değil, ölçüm kusuru** (§5.4).

### 3.14 T14 — Gereksiz çizim ve gölgelendirici derlemeleri

Ayrıntı §6. Özet: yükleme ekranındaki `compileAsync` son işleme açıkken yanlış (tuval) varyantı derliyor (J-03; ölçüldü: limanda 95 programın 42'si kullanılmayan tuval çıkışlı); meşale ışık sayısını değiştirip **25 + 7 program** derletiyor (J-08; ölçüldü); sahnede sürekli 7 nokta ışığı (J-07; ölçüldü); ilk görülen ada içeriğinde tek karede yazılımsal GPU'da **5,3 sn** (J-17); duraklatmada ve menüde tam çizim sürüyor (J-19); tuval son işleme açıkken de 4× MSAA (J-14); oyun içi gölge kapatma programları yenilemiyor (J-11).
