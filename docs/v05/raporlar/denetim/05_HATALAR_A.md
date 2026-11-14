# AUDIT_CURRENT §5 — Hatalar: A — Açılış ve arazi işçisi

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — A — Açılış ve arazi işçisi

### A-01 — Depoda izlenen kök tek dosya (DenizKorsanlari-SonHazine.html) hâlâ v0.3 derlemesi: arazi yedeği ve v0.4 düzeltmeleri yok (orta)

- **Dosya ve fonksiyon:** DenizKorsanlari-SonHazine.html (depo kökü); README.md:15-17; tests/README.md:33-35; tools/build-single-html.mjs — tek dosya derlemesi (prelude __DK_WORKER_URL) / gömülü v0.3 terrain._localJob
- **Kök neden:** v0.4 dalında araç ve kod değişti ama depodaki kök dosya yeniden derlenmedi. md5'i (42d9e9bb1387883fb57307ee087d27ab) v0.3 deposundaki dosyayla aynı. İçinde v0.3 yedeği (`local:!0,maxH:Math.max(...s)` = _localJob) ve yalnız log yazan onerror var. Güncel derleme yalnız .gitignore'daki dist/ altında. README ve tests/README bu kök dosyayı gösteriyor.
- **Oyuncuya etkisi:** Depodan indirip çevrimdışı oynayan v0.3 davranışını alır. Chromium'da file:// altında klasik blob işçisi çalıştığı için normalde açılır (01 belgesi satır 43 koşusu). İşçinin kurulamadığı ya da yüklenemediği her ortamda ise (blob işçisini reddeden köken, eski tarayıcı) yükleme %53'te sonsuza dek kalır (B-01/B-02). v0.4'ün diğer düzeltmeleri de bu dosyada yok. tests/README'ye göre koşulan tek dosya testi bayat dosyayı sınar. Pages iş akışı yayında dosyayı yeniden derlediği için yalnız depo kopyası etkilenir.
- **Öncelik:** orta · hedef faz: Faz 9
- **Önerilen çözüm:** Kök dosyayı güncel araçla yeniden derleyip işle; ya da depodan kaldırıp README ve tests/README'yi Pages/dist çıktısına yönlendir. Dosyaya derleme kimliği (commit) göm. CI'a bir denetim adımı ekle: derlenen dosyada `local:!0` olmamalı, `location.protocol === 'file:'` dalı bulunmalı. README'deki 'Bu sürüm: 0.3' satırını güncelle.
- **Tekrar üretme:** md5sum /home/user/SON-HAZ-NE-w2/DenizKorsanlari-SonHazine.html /home/user/SON-HAZ-NE-v03/DenizKorsanlari-SonHazine.html → aynı. grep -o 'local:!0[^}]*' kök dosya → v0.3 _localJob çıkar. dist/ dosyasında 'hazır sinyali gelmedi' ve uNearFade var, kökte yok. İşçi kurulamayan ortam için Node eşdeğeri: /tmp/denetim_alan/sim_v03.mjs → 15 sn sonra prepare/requestGrid sonuçlanmadı, 125 karonun hiçbirinde ağ yok.
- **Kabul testi:** Kök dosyanın md5'i v0.3'ten farklı; içinde `local:!0` yok, `location.protocol === 'file:'` dalı var. 02_tek_dosya.js kök dosyaya karşı file:// ile 4/4 geçer. Aynı dosya ?terrain=noworker ile yükleme ekranını geçer.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #42 (yayın v0.3); 04 §4.2c (araç düzeltildi, kök dosya yeniden derlenmedi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). K alanının denetçisi aynı sorunu bağımsız olarak buldu (K-01: v0.4 dalındaki kök tek HTML bayt bayt v0.3 derlemesi; karşı doğrulama K-01'i öncelik düzeltmesiyle kabul etti). A/DOC1 karşı doğrulaması da kök dosyanın md5'inin v0.3 dosyasıyla aynı olduğunu (42d9e9bb…) ve güncel derlemenin yalnız git dışındaki dist/'te durduğunu doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-141.

### A-02 — Harita ızgarası isteği reddedilirse açılış düşüyor: initMapBase ve boot hatayı yakalamıyor (orta)

- **Dosya ve fonksiyon:** js/main.js:109, 388-392; js/ui/mapArt.js:115-122; js/world/terrain.js:410-419 — boot / initMapBase / terrain.requestGrid
- **Kök neden:** requestGrid hatayı önbellekten silip yeniden fırlatır (terrain.js:415). initMapBase (mapArt.js:117) ve boot (main.js:109) try/catch içermez; boot().catch (388-392) yükleme ekranına 'Oyun başlatılamadı … WebGL…' yazar. Red iki yoldan gelebilir: (1) işçinin {t:'error'} iletisi (terrain.js:108); (2) ızgara işini alan işçilerin üst üste 3 kez ölmesi (MAX_TRIES, terrain.js:97). İkinci yolda yerel yedek o anda devrede olsa bile denenmez.
- **Oyuncuya etkisi:** İsteğe bağlı bir özellik (dünya haritası tabanı) tüm oyunun açılmasını engeller; oyuncu yanıltıcı bir WebGL mesajı görür. Bugün bilinen kalıcı bir tetikleyici yok, olasılık düşük. Ancak gridGen/biomeAt'e eklenecek tek bir hata ya da bellek kısıtlı cihazda işçi ölümleri açılışı kilitler.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** initMapBase'i try/catch ile sar: hata olursa geçici parşömenle devam et, arka planda yerel yedekte yeniden dene. MAX_TRIES'ta işi reddetmek yerine yerel şeride devret (A-05). boot().catch mesajını hata türüne göre ayır.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_fault.mjs: C5'te işçi ızgaraya {t:'error'} döner → 'RED: sahte üretim hatası'. C6'da ızgara işini alan her işçi çöker → 3 işçi ölür, fallback=true iken 'Arazi işi grid tekrarlanan işçi hatası' reddi gelir. Tarayıcıda: gridGen başına geçici throw koyup sayfayı aç → 'Oyun başlatılamadı'.
- **Kabul testi:** gridGen hata verdiğinde ya da her işçi ızgara işinde öldüğünde window.__ready=true olur ve menü açılır. Dünya haritası önce geçici parşömenle görünür, yerel üretim bitince dolar.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulama notu (A/REQ9): bu açılış engeli işçisiz senaryoya bağlı değil; işçi yokken ızgara yerelde üretiliyor, red ancak gridGen istisnası ya da MAX_TRIES yoluyla mümkün. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-034.

### A-03 — Hızlı yolculuk işleyicisi test edilmemiş; yeniden girişe ve bekleme sırasındaki durum değişimine korumasız (orta)

- **Dosya ve fonksiyon:** js/main.js:270-301; js/net/net.js:544-552; js/game/quests.js:439 — G.on('fastTravel') / net mesaj işleyicisi case 'teleport'
- **Kök neden:** Ücret 278. satırda peşin düşülür. 1,2 sn bekleme ve await terrain.prepare(…, {radius: 450}) (en çok 45 sn) boyunca oyun ve girdi sürer; meşgul bayrağı yoktur. Devam kodu G.state, G.player === p, G.ship === s, s.sunk ve p.dead değerlerini yeniden denetlemez. prepare zaman aşımı (terrain.js:380) çağırana bildirilmez. Konuk tarafındaki 'teleport' işleyicisi de bayat p'yi yakalar ve durumu denetlemez.
- **Oyuncuya etkisi:** Bekleme sırasında rota kaptanıyla yeniden konuşan oyuncu ikinci kez ücret öder ve art arda iki kez taşınır. Bekleme sırasında menüye dönülürse menü gemisi uzak limana demirlenir, zaman ve günlük değişir; kayıtta altın düşmüş ama oyuncu yerinde kalır. Normal kipte pencere ~1,5 sn, yedek kipte onlarca saniye. Akışın kendisi (taşıma, derinlik, karolar) hiçbir testte sınanmıyor.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** travelBusy bayrağı ekle; bekleme boyunca G.uiOpen ya da girdi kilidi uygula. Ücreti varışta düş ya da iptalde iade et. Devamda oturum belirteci ile G.state, G.player, G.ship, s.sunk ve p.dead denetimi yap. prepare'in 'timeout' sonucunu oyuncuya bildir. Konuk işleyicisine de aynı denetimleri ekle.
- **Tekrar üretme:** Kırlangıç Limanı'nda rota kaptanıyla konuş → hedef seç → kararma sürerken E ile yeniden konuş → ikinci hedefi seç: altın iki kez düşer, gemi önce birinci sonra ikinci limana taşınır. ?terrain=noworker ile hedef seç, bekleme sırasında Esc → Ana menüye dön: menü arka planındaki gemi uzak limanda demirli görünür.
- **Kabul testi:** Yeni senaryo 18_hizli_yolculuk.js normal ve noworker kipinde geçer: G.emit('fastTravel') sonrası gemi ve oyuncu hedefte, gemi hızı &lt; 1 m/s, derinlik penceresi hedefte, hedefte ≥ 6 karo ağı. Bekleme sırasında gelen ikinci emit yok sayılır ve altın bir kez düşer. Bekleme sırasında toMenu yapılırsa devam kodu hiçbir şeyi değiştirmez ve ücret iade edilir.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). K alanındaki T9 (Hızlı yolculuk) satırı hızlı yolculuğun test edilmediğini kaydediyor; yeniden giriş ve bekleme sırasındaki durum değişimi kısımları ayrıca sınanmadı. Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-035.

### A-04 — Açılışta genel hata yakalayıcı yok: modül grafiği yüklenemezse yükleme ekranı sonsuza dek 'Rüzgâr bekleniyor…' yazar (orta)

- **Dosya ve fonksiyon:** index.html:10-12, 20-28, 82-83; js/main.js:388-392 — index.html betik yükleme / boot().catch
- **Kök neden:** Tek giriş noktası `<script type=module src=js/main.js>`. Import map desteklemeyen tarayıcıda (Safari &lt; 16.4, Firefox &lt; 108) ya da bir modül 404/sözdizimi hatası verdiğinde boot() hiç çalışmaz, catch de kurulmaz. index.html'de klasik window.onerror/unhandledrejection dinleyicisi ya da __ready zaman aşımı denetimi yok. Ayrıca boot().catch mesajı her hatayı WebGL eksikliğine bağlıyor.
- **Oyuncuya etkisi:** Desteklenmeyen ya da eski tarayıcıda, eksik dağıtımda oyuncu nedenini bilmeden sonsuza dek yükleme ekranında kalır.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** head içine küçük klasik bir betik ekle: error/unhandledrejection dinleyicisi #load-text'e açıklayıcı mesaj yazsın. HTMLScriptElement.supports?.('importmap') ile destek denetimi yapıp tek dosya sürümüne yönlendir. 30–60 sn içinde window.__ready gelmezse uyarı göster. boot().catch mesajını hata türüne göre ayır.
- **Tekrar üretme:** index.html'den import map'i kaldır (ya da js/core/util.js'i geçici olarak yeniden adlandır) ve sayfayı aç: konsolda modül çözümleme hatası çıkar, ekran sonsuza dek 'Rüzgâr bekleniyor…' gösterir.
- **Kabul testi:** Aynı bozuk koşullarda en geç 5 sn içinde yükleme ekranında anlaşılır bir hata ve çözüm önerisi görünür. Normal açılış etkilenmez (00_acilis 6/6).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-036.

### A-05 — Tekrarlanan işçi hatasında iş yerel yedeğe devredilmiyor; kalıcı hatada geri çekilme yok (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:95-100, 108, 333, 404 — _workerFailed / _onMsg / _requestTile.catch / requestDepth.catch
- **Kök neden:** MAX_TRIES (3) dolunca iş, yerel şerit denenmeden reddedilir (97). İşçinin {t:'error'} iletisi doğrudan red olur (108). Karo reddi pending'i 0 yapar ve aynı karo 12 karede bir yeniden istenir. Derinlik reddi _depthPending'i null yapar ve ocean.update her karede yeniden ister. Her redde failures dizisi sınırsız büyür ve console.error yazılır.
- **Oyuncuya etkisi:** Bir işte işçiyi öldüren ya da hata veren durumda karo kalıcı delik kalır; sürekli yeniden istek ve konsol seli oluşur. Izgarada bu durum A-02 üzerinden açılışı düşürür.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** MAX_TRIES'ta işi 'yerel' işaretiyle kuyruğa geri koy ve şeritte üret. Kalıcı hatada karo başına üstel geri çekilme (ör. 1→30 sn) ve bozuk karo işareti uygula. failures dizisini son 50 kayıtla sınırla.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_fault.mjs C6: ızgara işini alan her sahte işçi çöker → workers 0 ve fallback true olur, ama requestGrid 'tekrarlanan işçi hatası' ile reddedilir.
- **Kabul testi:** Aynı denemede ızgara yerel yedekte üretilir. Kalıcı hatalı bir karo için istek sıklığı ≤ 1/30 sn ve failures.length ≤ 50 olur.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-153.

### A-06 — Yedek kipte dilim süresini bütçe değil üreteç parça boyutu belirliyor (düşük)

- **Dosya ve fonksiyon:** js/world/terrainGen.js:25, 47, 93, 108; js/world/terrain.js:160-187 — depthGen / gridGen / tileGen / _localSlice
- **Kök neden:** Bütçe yalnız yield noktalarında denetlenir (terrain.js:181). depthGen 32 satırda bir yield eder (512×32 = 16 384 yükseklik); gridGen 16 satırda bir yield eder (1024² için 16 384 yükseklik+biyom). Bu yüzden bir dilim = bütçe + en az bir bölünmez parça.
- **Oyuncuya etkisi:** İşçi yokken ya da çöktüğünde kamera ~520 m ilerleyip derinlik penceresi yenilenince ve harita ayrıntı karoları üretilirken kare süresi bütçeyi aşar. Node ölçümü (hızlı CPU, sıcak): derinlik parçası en çok ~14 ms (soğukta 38 ms), 1024² ızgara parçası ~27 ms, seg-80 karo parçası ~8 ms; dilim en çok 51 ms (40 ms bütçe) ve ~20 ms (10 ms bütçe). Yavaş cihazda süreler 3–5 kat uzar.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** Zaman tabanlı yield kullan (ör. her 1024 noktada performance.now denetimi) ya da satır başına yield et. Derinlik penceresini parça parça kaydır.
- **Tekrar üretme:** Node: /tmp/denetim_alan/depth_bench.mjs ve /tmp/denetim_alan/sim_noworker.mjs (Worker yok) yukarıdaki parça ve dilim sürelerini verir.
- **Kabul testi:** Yedek kipte 8 km'lik dolaşımda en uzun yerel dilim ≤ bütçe + 4 ms (Node ve tarayıcı ölçümü).
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #10 ('dilim 10–20 ms' ifadesi parça süresini hesaba katmıyor)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). A/SYS7 karşı doğrulaması (karsit_A/butce_izgara.mjs) dilim süresini üreteç parçasının belirlediğini yeniden ölçtü: bütçe 10 ms iken en uzun dilim 15–17 ms. Doğrulayıcı, ızgara süresine etkinin ölçülemeyecek kadar küçük olduğunu not etti (1024² ızgara 10 ms bütçede 290–321 ms, 40 ms'de 278–317 ms). Denetçi güveni: yüksek. Bilinen sorun: KI-154.

### A-07 — Derin deniz karoları 300 m dışında ~3,2 km'ye kadar sahnede kalıyor; LOD eşiklerinde histerezis yok (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:19-25, 258-265, 285, 315-319 — update / _wantSeg
- **Kök neden:** Kara içermeyen karo yalnız DEEP_VIEW (300 m) içinde istenir, ama düşürme eşiği genel halka yarıçapıdır (R + 2·TILE ≈ 3 180 m). LOD eşikleri tek değerden oluşur (380/950/1750/2700 × lodScale); giriş ve çıkış eşiği arasında fark yok.
- **Oyuncuya etkisi:** Açık denizde seyirde, su yüzeyinin altında görünmeyen onlarca–yüzlerce seg-8 karo ağı ayrı çizim çağrısı olarak sahnede kalır. LOD sınırında gidip gelen kamerada 80↔32 arasında yeniden üretim ve görsel atlama olur.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** Derin karolar için ayrı düşürme eşiği kullan (ör. DEEP_VIEW + 200 m). LOD eşiklerine %10–15 histerezis bandı ekle: yükseltme hemen, düşürme gecikmeli.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_traverse.mjs (yedek kip; kamera z=-6200'de x 0→8000, sonra kuzeye): örnek noktalarda 600 m ötesinde 76–142 derin seg-8 karo, toplam karo en çok 239.
- **Kabul testi:** Aynı dolaşımda 600 m ötesinde derin karo sayısı ≤ 10. LOD sınırında ±20 m salınımda yeniden üretim olmaz.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 öneri listesi: 'LOD histerezis bandı ve deniz karosu düşürme' (numarasız)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-155.

### A-08 — İptal yalnız kuyruktaki karo işlerinde çalışıyor; işçideki, şeritteki ve eski derinlik işleri boşa hesaplanıyor (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:95-98, 129-132, 176, 398-404 — _cancel / _localSlice / _workerFailed / requestDepth
- **Kök neden:** _cancel yalnız _queue'daki işi çözer; işçideki ya da yerel şeritteki iş tamamlanana dek sürer. 176. satırdaki 'iptal edildi' denetimi hiç tetiklenmez, çünkü şeritteki iş _jobs'tan silinmez (ölü kod). Yeni zorunlu derinlik isteği eskisini iptal etmez; _depthSeq yalnız sonucu yok sayar. Ölen işçiden geri kuyruğa alınan işler, karo hâlâ var mı diye bakılmadan yeniden üretilir. Kapanan haritanın ızgara işleri de iptal edilmez.
- **Oyuncuya etkisi:** Özellikle yedek kipte ana iş parçacığında boşa üretim olur (ör. ışınlanmada eski 512² derinlik penceresi ~0,1–0,2 sn) ve kuyruk gecikir. İşçi kipinde kapasite israf edilir.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** İşlere cancelled bayrağı ekle; _cancel şeritteki işi de sonlandırsın. requestDepth yeni zorunlu istekte eski derinlik işini iptal etsin. _workerFailed işleri geri kuyruklarken karo işlerinde t.req eşleşmesini denetlesin.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_lane.mjs: seg-80 karo işi yerel şeritteyken _drop çağrıldı → iş _jobs'ta kaldı ve sonuna kadar üretildi (441 ms duvar süresi), sonuç atıldı.
- **Kabul testi:** Şeritteki iş, _drop'tan sonraki ilk dilimde sonlanır (_jobs küçülür). Işınlanmada yalnız son derinlik işi hesaplanır (Node sayaç testi).
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-156.

### A-09 — Sonlandırılmış işçinin geç iletisi yeni işçide hayalet iş yuvası bırakabilir (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:103-116 — _onMsg / _finish
- **Kök neden:** _onMsg işi _jobs'ta bulamazsa rec.jobs.delete yapmadan döner (106). _finish de işi bulunduğu işçinin rec.jobs kümesinden silmez. Ölen işçinin yanıtı terminate'ten sonra teslim edilirse iş ilk yanıtla biter; yeni işçideki kopya yuvayı kalıcı doldurur. Zamanlayıcısı da temizlendiği için durum fark edilmez.
- **Oyuncuya etkisi:** Etkilenen işçi kalıcı olarak daha az iş alır ya da hiç almaz (paralellik düşer); bu durum teşhis edilemez.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** _onMsg başında koşulsuz rec.jobs.delete(m.id) çağır; _finish içinde job.rec?.jobs.delete(job.id) ekle. Kuyruk değişmezi testi ekle: her işçinin jobs anahtarları _jobs içinde bulunmalı.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_fault.mjs C9 (sahte işçi terminate'ten sonra da ileti teslim eder): işçi 1'de 2 hayalet yuva kalır ve işçi 1 bir daha iş almaz.
- **Kabul testi:** Aynı denemede hayalet yuva 0. Değişmez testi tüm 02 senaryolarında 0 verir.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: orta). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-157.

### A-10 — Oyun başlatma ve kayıt yüklemede prepare beklemesi sırasında G.state 'playing' ama oyuncu yok; geri bildirim yok (düşük)

- **Dosya ve fonksiyon:** js/game/game.js:101-125; js/main.js:121, 157-167 — game.start / handlers.startGame
- **Kök neden:** G.state='playing' (103), prepare beklemesinden (124) önce atanır; G.player ancak 125. satırda kurulur. Bu sürede game.update erken döner, ekran son menü karesinde donar ve yükleme göstergesi yoktur. Esc ile duraklatma menüsü açılabilir. 'Ana menüye dön' seçilirse start() kaldığı yerden devam eder: oyuncuyu kurar, HUD'u menünün üstünde açar ve işaretçiyi kilitler.
- **Oyuncuya etkisi:** Uzak adada kayıt yüklemede ya da yedek kipte saniyelerce (en çok 45 sn) donmuş ekran görülür; nadiren menü ve HUD tutarsız kalır.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** prepare süresince yükleme katmanı göster ve G.state='loading' kullan. start()'a oturum belirteci ekle, devamda iptal denetimi yap. Duraklatma menüsü için G.player şartı koy.
- **Tekrar üretme:** ?terrain=noworker ile uzak bir adada kaydedilmiş oyunu yükle; bekleme sırasında Esc → Ana menüye dön: bir süre sonra HUD menünün üstünde açılır.
- **Kabul testi:** Bekleme süresince yükleme katmanı görünür ve Esc duraklatma açmaz. İptal edilen start hiçbir durumu değiştirmez.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-158.

### A-11 — Sessiz ya da askıda işçi açılışı 8–20 sn geciktiriyor; prepare zaman aşımını bildirmiyor (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:27-28, 75, 144, 379-382 — _initWorkers (readyTimer) / _pump (job.timer) / prepare
- **Kök neden:** Hazır sinyali göndermeyen işçi 8 sn (READY_TIMEOUT), hazır olup yanıt vermeyen işçi ise karo işi için 20 sn sonra devre dışı kalır. İşler hazır olmayan işçilere de gönderilir. prepare'in 'timeout' sonucu atılır, çağıranlar (buildWorld, start, fastTravel) bundan haberdar olmaz ve kullanıcıya bilgi verilmez.
- **Oyuncuya etkisi:** Kalıcı takılma yok, ama yükleme ekranı 'Arazi örülüyor…' metninde 8–20 sn hareketsiz kalır.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** İlk iş için kısa bir gözetim süresi kullan (3–5 sn). Hazır olmayan işçi varken yerel şeridi paralel başlat. prepare dönüş değerini ('ok'/'timeout') ilet ve yükleme metnine yansıt.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_fault2.mjs: C10'da (hazır sinyali yok) prepare 8 517 ms, C11'de (yanıt yok) 20 434 ms sürdü; ikisi de sonunda 125 ağ üretti.
- **Kabul testi:** Aynı denemelerde açılış hazırlığı ≤ normal süre + 5 sn; yükleme metni gecikmenin nedenini gösterir.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 11 #3 ile ilişkili
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-159.

### A-12 — Örtüşen iki prepare çağrısında, biten eski çağrı yeni odağın süresini 12 sn'ye kısaltıyor (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:366-385, 393-395 — prepare
- **Kök neden:** Odak tek bir alanda tutulur (this.focus). Her prepare sonunda `if (this.focus) this.focus.until = now + 12000` çalışır; o anda this.focus başka bir prepare'e ait olabilir.
- **Oyuncuya etkisi:** Yedek kipte ya da yavaş cihazda üst üste iki hazırlıkta (konuk 'teleport' + start, art arda iki hızlı yolculuk) ikinci hedefin odağı erken düşer. Kamera uzaktaysa hedef karolar düşürülür ve prepare erken biter. Odak kalkınca kameranın derinlik isteği _depthSeq'i artırır, hedef penceresi uygulanmaz.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** const F = this.focus = {...} kullan; sonda yalnız `if (this.focus === F)` ise güncelle (ya da odak listesi tut).
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_extra.mjs E1: prepare(A) ve hemen ardından prepare(B, uzak) başlatıldı. A bitince B'nin odağında 90 sn yerine yalnız 12 sn kaldı.
- **Kabul testi:** Aynı denemede B'nin odağı B bitene dek korunur; B'nin hedef karoları ve derinlik penceresi uygulanır.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-160.

### A-13 — requestGrid önbelleği çözülmüş ham ızgaraları gereksiz yere tutuyor (~35 MB'a kadar) (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:410-419; js/ui/mapArt.js:115-150 — requestGrid / initMapBase / mapDetail
- **Kök neden:** Önbellek, çözülmüş sözleri (Float32 yükseklik + Uint8 biyom) 24 kayda kadar saklar. mapArt aynı veriyi boyanmış tuval olarak zaten önbelleğe alıyor (detail ≤ 28, baseCache).
- **Oyuncuya etkisi:** 512² ayrıntı karosu başına ~1,25 MB, 1024² dünya ızgarası ~5 MB: toplamda en çok ~35 MB gereksiz bellek. Sınırlı; sızıntı değil.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** Önbellekte yalnız bekleyen sözleri tut, çözülünce sil; ya da yalnız küçük ızgaraları sakla.
- **Tekrar üretme:** Haritada 25'ten fazla ayrıntı karosu gez: DK.terrain._gridCache.size 24 olur ve her kayıt çözülmüş dizileri tutar.
- **Kabul testi:** Aynı gezintiden sonra çözülmüş ızgara tutan önbellek kaydı ≤ 2; JS yığını farkı ≤ 5 MB.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-161.

### A-14 — Yeniden doğmada uzak limana ya da gemiye arazi hazırlığı yapılmıyor (düşük)

- **Dosya ve fonksiyon:** js/main.js:226-241 — handlers.respawn
- **Kök neden:** Oyuncu en yakın keşfedilmiş limana (km'lerce uzakta olabilir) ya da uzaktaki gemiye doğrudan konur. terrain.prepare çağrılmaz; yükseklik analitik fonksiyondan alınır.
- **Oyuncuya etkisi:** Uyanınca kısa süre karo ağları ve derinlik penceresi eksik ya da kaba görünür. Ada içeriği 250 m içinde eşzamanlı kurulduğu için tek uzun bir kare oluşur.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** respawn'ı async yap; kararma altında await terrain.prepare(sx, sz, {radius: 400}) çağır.
- **Tekrar üretme:** Uzak bir adada öl, 'Kırlangıç Limanı'nda uyan'ı seç: ilk karelerde çevre karoları ve derinlik yüklenmemiş olur.
- **Kabul testi:** Uzak ölümden sonra uyanışın ilk karesinde oyuncu çevresinde ≥ 6 karo ağı ve hedefte derinlik penceresi bulunur.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-162.

### A-15 — Kısmi işçi kurulum hatasında yanlış yedek işareti; ölen işçiler hiç yeniden başlatılmıyor (düşük)

- **Dosya ve fonksiyon:** js/world/terrain.js:64-83, 85-101 — _initWorkers / _setFallback / _workerFailed
- **Kök neden:** Döngüde i>0 olan işçinin kurucusu hata verirse önceki işçi canlı kalır, ama fallback=true olur ve 'ana iş parçacığına alındı' uyarısı yazılır. Ölen işçiler oturum boyunca yeniden kurulmaz.
- **Oyuncuya etkisi:** İstatistik ve teşhis yanlış olur. Tek bir geçici hata (iş zaman aşımı) oturum boyunca kalıcı kapasite kaybı ya da tam yedek kip (ana iş parçacığında üretim, A-06 takılmaları) demektir.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** Kısmi kurulumda fallback yerine yalnız uyarı ver. Ölen işçi için sınırlı sayıda (ör. 2) gecikmeli yeniden başlatma ekle.
- **Tekrar üretme:** Node /tmp/denetim_alan/sim_extra.mjs E2: ikinci kurucu hata verdi → workers 1 ama fallback true.
- **Kabul testi:** Aynı denemede fallback=false ve 1 işçi çalışır; geçici hatadan sonra 30 sn içinde işçi sayısı geri gelir.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 öneri listesi: 'Kısmi işçi kurulum hatasında temizlik' (v0.3 biçimi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-163.

### A-16 — Tek dosyada işçi adresi seçimi yalnız file: protokolüne bakıyor; diğer 'null' kökenli bağlamlar ve Chromium dışı tarayıcılar sınanmadı (düşük)

- **Dosya ve fonksiyon:** tools/build-single-html.mjs:100-103 — prelude (__DK_WORKER_URL)
- **Kök neden:** data: URL yalnız location.protocol === 'file:' iken seçilir. Kökeni 'null' olan bağlamlarda (sandbox'lı iframe, ör. oyun portalı gömmeleri; content:// görüntüleyiciler) modül tipli blob: işçisi büyük olasılıkla reddedilir. 02_tek_dosya yalnız Chromium'da koşuldu.
- **Oyuncuya etkisi:** Bu ortamlarda oyun açılır, ama tüm arazi ana iş parçacığında üretilir (A-06 takılmaları).
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** Koşulu `self.origin === 'null' || location.protocol === 'file:'` yap. blob ile kurulum hata verirse data: ile ikinci kez dene. Firefox ve Safari'de file:// tek dosya testi ekle.
- **Tekrar üretme:** Tek dosyayı `<iframe sandbox=allow-scripts>` içinde aç; DK.terrain.workers.length ve failures değerlerine bak.
- **Kabul testi:** Sandbox'lı iframe ve Firefox file:// koşullarında 02_tek_dosya 4/4 geçer, en az 1 işçi çalışır.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: orta). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-164.

### A-17 — Faz 1 zorunlu testlerinin bir kısmı depoda yok; badurl kipi file:// altında etkisiz; tests/out raporları eski (düşük)

- **Dosya ve fonksiyon:** tests/scenarios/02_arazi_yedek.js, 02_arazi_kurtarma.js, 02_tek_dosya.js; js/world/terrain.js:47, 58-63; tests/out/02_*.json; tests/README.md:33-35 — terrain._workerUrl / test kipleri
- **Kök neden:** Şu durumlar için senaryo yok: kurucu hatası, sessiz işçi (hazır yok), askıda işçi (iş zaman aşımı), MAX_TRIES, LOD yarışı, silinen karonun geç sonucu, karo yaşam döngüsü sayaçları ve hızlı yolculuk. 'badurl' kipi data: URL'ye '#missing' ekler; parça yok sayıldığı için işçi yine yüklenir (Node: URL hash '#missing', gövde bozulmadan okunuyor). tests/out/02_*.json 903abe2 öncesi bir ara sürüme ait (1–4 başarısızlık, eski etiketler). tests/README tek dosya testini bayat kök dosyayla tarif ediyor.
- **Oyuncuya etkisi:** Hata yolları gerilemeye karşı korumasız; eski raporlar ve README yanıltıcı.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** ?terrain=ctorthrow|noready|hang kiplerini ekle. Sahte Worker'lı bir Node kuyruk testini (bu denetimdeki /tmp/denetim_alan/sim_fault*.mjs benzeri) CI'a koy. 18_hizli_yolculuk ve karo yaşam döngüsü senaryolarını yaz. badurl'ü data: URL'de geçersiz içerikle değiştir. tests/out'u temizle ve tests/README'yi dist/'e yönlendir.
- **Tekrar üretme:** tests/ altında 'fastTravel', 'teleport', 'ctorthrow', 'noready', 'hang' geçmiyor (grep). 02_tek_dosya'yı ?terrain=badurl ile file:// altında koş: işçiler çalışmaya devam eder.
- **Kabul testi:** Yeni senaryolar ve Node testi tüm kiplerde geçer; badurl kipi file:// altında 0 işçi ile yedek kipe geçer.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). Ana kusur (Faz 1 zorunlu testlerinin bir kısmı depoda yok) A/SYS1 ve A/REQ4 karşı doğrulamalarıyla doğrulandı: hazır sinyali yok, iş zaman aşımı, MAX_TRIES ve kurucu hatası kiplerinin depo testi yok. 'badurl kipi file:// altında etkisiz' ve 'tests/out raporları eski' alt iddiaları ayrıca sınanmadı. Denetçi güveni: yüksek. Bilinen sorun: KI-165.

### A-M01 — Site verisi (localStorage) engelliyken oyun hiç açılmıyor: boot, save.profile() ve menu.render'da SecurityError ile düşüyor; 'kayıtsız oyna' yedeği ölü kod (v0.3 ve v0.4) (orta)

- **Dosya ve fonksiyon:** js/main.js:82-93, 114, 388-392; js/core/save.js:38-45, 61-72; js/ui/menu.js:57, 66 — boot / save.profile / save.read / save.latest / menu.init → menu.render
- **Kök neden:** save.js'deki safeParse yalnız JSON.parse'ı sarıyor; localStorage özelliğine erişim ve getItem çağrısı try dışında kalıyor (save.js:40, 43, 71). Tarayıcı site verisini engellediğinde window.localStorage erişimi SecurityError atar. boot, try içindeki settings.load()'dan hemen sonra main.js:83'te save.profile()'ı çağırıyor; istisna boot()'tan dışarı çıkıyor. main.js:93'teki save.available() denetimi try'lı ve 'kayıt yapılamayacak' uyarısıyla devam etmeyi amaçlıyor, ama akış oraya hiç ulaşmıyor. profile() düzeltilse bile menu.init (main.js:114) → render → save.latest → save.read (menu.js:66, save.js:40) aynı istisnayı atar. startOnlineHost/Guest'teki save.read çağrıları (main.js:178, 191) ve her menu.show(true) de korumasız.
- **Oyuncuya etkisi:** Çerezleri ya da site verisini engelleyen oyuncuda (Chrome'da 'siteler veri kaydedemez', Firefox/Safari'de 'tüm çerezleri engelle'), allow-same-origin içermeyen sandbox iframe'de veya kısıtlı bir gömme ortamında oyun tamamen açılmaz. Yükleme ekranında 'Oyun başlatılamadı: Failed to read the 'localStorage' property… WebGL destekli güncel bir tarayıcı gerekiyor' yazar; mesaj yanıltıcıdır. Kayıtsız tek oyunculu oynamak mümkünken engelleniyor. Etkilenen oyuncu için tam engel, ama yapılandırma nadir; bu yüzden orta. Sürüm: v0.3 ve v0.4'te aynı (save.js profile 63-65 / 70-72). Bilinen kimlik yok (02, 11 ve denetim_ham'da geçmiyor).
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** save.js'e tek bir güvenli erişimci ekle: `const LS = () => { try { return window.localStorage; } catch { return null; } }`. read/list/latest/profile/write/remove/exportAll/importAll içindeki bütün getItem/setItem/removeItem/key/length çağrılarını try içine al; depo yoksa null ya da boş liste dönsün. boot'ta save.available() en başa alınsın ve G.noStorage işaretlensin; menüde ve kayıt denemesinde 'Tarayıcı kayda izin vermiyor' bildirimi gösterilsin. boot().catch mesajı hata türüne göre ayrılsın (A-04 ile birlikte).
- **Tekrar üretme:** Node: `DK_ROOT=/home/user/SON-HAZ-NE-w2 node --import /tmp/denetim_alan/register.mjs /tmp/denetim_alan/karsit_A/depolama_engelli.mjs` → settings.load tamam, save.profile 'ATTI: SecurityError', save.available false, save.latest ve save.list 'ATTI: SecurityError'. DK_ROOT=v03 ile de aynı sonuç. Tarayıcıda: Chrome → Site ayarları → localhost:8080 için 'Çerezler ve site verileri'ni engelle → index.html'i aç → ekran hata metninde kalır, window.__ready gelmez.
- **Kabul testi:** Playwright'ta context.addInitScript ile `Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Access is denied','SecurityError')}})` kurulup index.html açıldığında: window.__ready=true olur, ana menü görünür, DK.handlers.startGame({kind:'solo',slot:0}) ile oyun başlar, kayıt denemesi 'kayıt yapılamıyor' bildirimi verir; sayfa hatası 0 ve SecurityError konsol hatası 0. Normal açılış, 00_acilis ve 08_kalicilik değişmeden geçer.
- **Sürüm:** v0.3 ve v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-037.

### A-M02 — Arazi LOD ölçeği açılış sırası yüzünden yanlış: kayıtlı 'Görüş mesafesi' açılışta araziye uygulanmıyor, oyun içinde herhangi bir ayar değişince düşük/orta kalitenin LOD indirimi kayboluyor (yalnız v0.4) (orta)

- **Dosya ve fonksiyon:** js/core/settings.js:63-65; js/main.js:97, 106; js/game/game.js:45; js/world/terrain.js:247, 263, 285; js/ui/settingsPanel.js:12 — settings.apply / boot / game.buildWorld → terrain.init / terrain._wantSeg / terrain.update
- **Kök neden:** boot, settings.apply()'ı (main.js:97) terrain.init'ten önce çağırıyor (main.js:106 → game.js:45). apply'ın ilk çağrısındaki `terrain.baseLod = terrain.lodScale || 1`, lodScale henüz tanımsız olduğu için baseLod'u kalite ölçeği yerine kalıcı olarak 1 yapıyor. Ardından terrain.init (terrain.js:247) lodScale'i yalnız kaliteye göre (0,7 / 0,85 / 1) yeniden yazıyor ve görüş mesafesi çarpanını siliyor. Sonraki her apply (settingsPanel.js:12, yani herhangi bir ayar değişimi) lodScale = 1 × (0,7 + 0,3·görüş) yazıyor; kalite çarpanı kayboluyor. Bu kod 8616d08'de (02 A11 düzeltmesi) eklendi; 03. belge satır 72 'görüş mesafesi ayarı etkin', 10. belge satır 189 'görüş mesafesi anında uygulanır' diyor.
- **Oyuncuya etkisi:** (1) Kayıtlı görüş mesafesi açılışta arazi akış ve LOD yarıçaplarına (terrain.js:263, 285) hiç uygulanmıyor; yalnız camera.far değişiyor, yani 02 A11 açılışta hâlâ açık. (2) Düşük kalitedeki oyuncu oyun içinde ses gibi herhangi bir ayarı değiştirince lodScale 0,7'den 0,79–1,0'a çıkıyor: hires halkası 266 → 380 m, en dış halka 1 890 → 2 700 m. Karo alanı yaklaşık iki katına çıkıyor, üçgen ve işçi yükü artıyor; en zayıf cihazda FPS düşüyor. Görüşü %30'a indirmek bile ölçeği 0,7'den 0,79'a yükseltiyor. Orta kalitede 0,85 → 0,79–1,0. Durum sayfa yenilenene kadar sürüyor. 10. belgedeki 'Düşük' ölçümleri görüş %30'un arazi etkisini içermiyor. Aynı sıra sorunu gölge haritasında da var (kod okumasıyla): apply'ın 55-60. satırları güneş ışığı henüz kurulmadan çalışıyor, sky.js:137-139 kaliteye göre 2048 seçiyor, bu yüzden 'Gölgeler: orta' açılışta uygulanmıyor. Sürüm: yalnız v0.4 (v0.3'te apply yalnız camera.far yazıyordu). Bilinen kimlik: 02 A11'in eksik düzeltmesi.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** baseLod'u terrain.init yazsın (kalite ölçeği) ve init'te de lodScale = baseLod × (0,7 + 0,3·settings.v.viewDistance) hesaplansın. settings.apply'daki `baseLod === undefined` dalı kaldırılsın (init'ten önce lodScale'e dokunmasın) ya da boot'ta buildWorld'den sonra settings.apply() bir kez daha çağrılsın. sky.build gölge haritası boyutunu settings.v.shadows'tan alsın.
- **Tekrar üretme:** Node: `DK_ROOT=/home/user/SON-HAZ-NE-w2 node --import /tmp/denetim_alan/register.mjs /tmp/denetim_alan/karsit_A/lod_ayar_sirasi.mjs` (kalite 'low' ve görüş 0,3 kayıtlı; boot sırası taklit ediliyor) → apply sonrası baseLod 1, lodScale 0,79; terrain.init sonrası lodScale 0,7 (beklenen 0,553); ardından görüş 1 ile apply → lodScale 1 (beklenen 0,7). Tarayıcıda: Ayarlar'da Grafik kalitesi Düşük, Görüş %30 → sayfayı yenile → DK.terrain.lodScale 0,7; Ayarlar'da ses kaydırıcısını oynat → 0,79; görüşü %100 yap → 1.
- **Kabul testi:** Kalite düşük ve görüş %30 iken açılışta DK.terrain.lodScale ≈ 0,553 olur ve DK.terrain.stats().tiles görüş %100'e göre belirgin biçimde azdır. Oyun içinde sesi değiştirmek lodScale'i değiştirmez; görüş %100'e çekilince 0,7 olur; yüksek kalite + %100 → 1. Gölgeler 'orta' iken açılışta DK.sky.sun.shadow.mapSize.x === 1024. Yeni bir senaryo (ör. 18_ayar_lod.js) bu değerleri hem açılışta hem sayfa yenilendikten sonra denetler.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** Faz 8 tasarımı ve KARARLAR.md (K8-8) bu maddeyi 'A-19' olarak anıyor
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). J alanının denetçisi aynı kusuru bağımsız olarak buldu (J-10; ayrıca J-09 gölge kalitesi). Bilinen sorun: KI-038.

---

**5.B Alan B — Multiplayer güvenliği ve host otoritesi** · 21 denetim maddesi, 7 kaçan madde · varsayılan hedef faz: Faz 2

Denetçi özeti: v0.4'te ağ katmanına bilinen tür listesi, konuk başına 120 ileti/sn oran sınırı, 64 KB boyut sınırı, hasar üst sınırları, bazı mesafe denetimleri, kilit sahipliği ve dakikada 20 000 altınlık bütçe eklendi. Bu nedenle v0.3'teki ham 'gold += m.amount' ve ham hasar uygulaması kısmen kapandı. Ancak mimari hâlâ 'sonucu konuk bildirir, ev sahibi kırpar' modelinde: hasar miktarı, satış payı, ambar ve gemi durumu, ganimet tablosu ve oyuncu konumu konuğun beyanı. Ayrıca 'st' ve 'ping' iletileri oran ve boyut sınırının dışında kalıyor. Kod okuması ve Node saplama denemeleri (/tmp/denetim_alan/sim.mjs, sim2.mjs) şunları doğruladı: tek bir shipFull, cannonFix indeksli shipCmd ya da sürücüsü olunan kayıkta eksik alanlı boatSt iletisi ev sahibinin oyun döngüsünü veya anlık görüntü yayınını kalıcı olarak durdurabiliyor. hold ve lootReq ile sınırsız eşya ve altın üretilebiliyor (40 sahte efsanevi sandık, 1e12 değerli balık); 'gold' iletisiyle konuk başına saatte 1,2 M altın aktarılabiliyor; 120 ileti/sn ile 19 200 hasar/sn elde ediliyor ve boss hasarında mesafe denetimi hiç yok. Mesafe denetimleri 'd > eşik' biçiminde yazıldığı için NaN konum bunları açık bırakıyor; ağdan gelen balık verisi (color/name) de iconSVG ve itemTip üzerinden kaçışsız innerHTML'e girerek ev sahibinde ve diğer konuklarda saklı XSS oluşturuyor. 06a/06a2 testleri yalnız altın bütçesini, tek hurtEnemy iletisini, sohbet boyutunu, ad temizliğini ve kopma temizliğini sınıyor; buna karşın 12. belgedeki 'hile girişimi GEÇTİ' kaydı kapsamı geniş gösteriyor, F-04 ve E_gemi-ek-statik-114 gibi açık maddeler de 11. belgede izlenmiyor. Kabul ölçütü karşılanmıyor: konuğun kendi envanteri ve XP'si zaten yerel kayıtta tutuluyor. Bu ölçüt ancak niyet tabanlı protokol, ev sahibinde hareket/savaş/ekonomi çözümü ve dünya başına ev sahibinde tutulan konuk profiliyle sağlanabilir. Ev sahibi her durumda dünyanın tek otoritesi olduğundan hilesi önlenemez; bu sınır belgelenmeli ve konuk tarafına doğrulama ile HTML kaçışı eklenmeli.

