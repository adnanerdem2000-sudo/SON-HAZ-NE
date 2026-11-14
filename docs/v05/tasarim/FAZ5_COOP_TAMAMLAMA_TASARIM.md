# Faz 5 — Co-op Sisteminin Tamamlanması: Nihai Tasarım Belgesi (karşıt inceleme sonrası)

| | |
|---|---|
| **Proje** | Deniz Korsanları: Son Hazine. three.js, 20×20 km açık dünya; co-op PeerJS 1.5.5 / WebRTC, 1–4 oyuncu, yıldız topoloji, host bir tarayıcı (sunucu yok) |
| **Taban** | v0.4, commit `44d548c` (`/home/user/SON-HAZ-NE-w2`; HEAD `e194d59` yalnız Faz 0 kaydını ekler, kod aynı) |
| **Girdiler** | `audit_E.json` (E-01…E-23, 21 senkron maddesi, 10 kullanıcı iddiası, 21 gereksinim); `docs/denetim/13_TURN_VE_ODA_SAHIBI_DEVRI_TASARIMI.md`; `js/net/net.js`; Faz 2/3/4 nihai tasarımları; taban koşusu `docs/v05/taban_kosusu_44d548c/coop_06c.*` |
| **Uyum** | **Faz 2:** `PROTO`, şema kapısı (`schema.js`, `guard.js`), `raw` serileştirme, `worldPart` (≤ 16 000 B parça), `hi`+HMAC kimliği, `gbook` konuk profili, defter, `tx`/`x`, `feat`/`featSt`, `story` beyaz listesi, `posOf`/`r.auth`. **Faz 3:** `STEP = 1/60`, `game.playTime` benzetim saati, `game.frameClock` (Σ frameDt), uzak varlık yumuşatması çizim evresinde; zaman damgalı tampon bu faza bırakıldı (Faz 3 K9). **Faz 4:** şema v3, `worldId`, `saveSeq`, `game.start`'ta `'loading'` durumu ve `abortStart`, WorldState cephesi, `wcache` periyodik konuk önbelleği, test adları `06o–06q`. |
| **Bu belge** | `PROTO`'yu **2 → 3** yapar. Yeni co-op senaryoları **`06r`–`06z`** adlarını kullanır. |
| **Durum** | Tasarım. Kod değiştirilmedi, depoya yazılmadı, tarayıcı testi koşulmadı. Node denemeleri salt-okur olarak `/tmp/tasarim_y/` altında yapıldı (Ek A). Bütün `dosya:satır` atıfları v0.4 kodunda yeniden okundu. **[BELİRSİZ]** işaretli konular ölçüm ister. **[SUNUCU]** işaretli konular sunucusuz çözülemez. (inceleme düzeltmesi) Bu sürüm `faz5_tasarim.md`'nin karşıt incelemesidir. İddialar v0.4 kodunda, PeerJS 1.5.5 kaynağında (`vendor/peerjs/peerjs.min.js`) ve test sinyal sunucusu `peer` 1.0.2 kaynağında (`/home/user/devtools/node_modules/peer/dist/index.cjs`) yeniden sınandı. Yeni Node denemesi: `/tmp/tasarim_y/devir_inceleme.mjs` (Ek A). Düzeltmeler "(inceleme düzeltmesi)" ile işaretlidir; bulunan sorunların listesi belgenin sonundadır. |
| **Tarih** | 14 Kasım 2026 |
| **İnceleme özeti** | (inceleme düzeltmesi) En ağır düzeltmeler host devrindedir: seçim kuralı canlı ama bölünmüş host'ta çift host üretiyordu, saat güdümlü turlar algılama kaymasında tıkanıyordu, sinyal sunucusunun zamanlaması gerçek dışı varsayılmıştı, takma ad kimliği herkesçe alınabildiği için host tek iletiyle düşürülebiliyordu ve replika konuk anahtarlarını varise veriyordu. Ayrıca oturum saatleri rAF'a bağlıydı (testte ve gizli sekmede çalışmaz), Faz 2 kapısıyla `warm` fazı çelişiyordu, gemi komut onayı retlerde kilitleniyordu ve oda kodu dünyaya bağlı değildi. |

**Terimler.** *R kanalı*: PeerJS'in güvenilir ve sıralı veri kanalı (olaylar, istekler, `worldPart`, replika). *U kanalı*: aynı `RTCPeerConnection` üzerinde açılan, sırasız ve yeniden iletimsiz ikinci veri kanalı (durum: `snap`, `st`, `helm`, `boatSt`). *Dilim*: tek bir U paketi olarak giden ve kendi başına anlamlı anlık görüntü parçası (≤ 1 100 B). *K0–K4*: ilgi alanı katmanları. *NetInterp*: zaman damgalı ara bellek ve oynatıcı. *pc*: alıcının oynatma saati (host zamanı cinsinden). *Isınma fazı*: konuğun dünyayı yükledikten sonraki ağır ilk kareleri. *Hayalet yuva*: bağlantısı kopan oyuncu için 60 sn ayrılan yer. *Dönem (epoch)*: her host devrinde bir artan oturum sayacı. *Varis*: host devrinde aday sırasındaki konuk. *Replika*: host'un varislere gönderdiği tam dünya kopyası.

---

## 0. Özet ve kararlar

### 0.1 Özet

1. **D4-02'nin kök nedeni** (§1.7): Konuğu menüye düşüren yolun en olası adayı (inceleme düzeltmesi: kanıtlanmış değil, aşağıya bakın) ev sahibinin 15 sn'lik sessizlik kuralıdır (`net.js:704`). Bu kural ilk `st` ile kuruluyor (`net.js:239`). İlk `st` ise konuğun yüklemeden sonraki ilk karesinde, ağır ilk çizimden **önce** gidiyor (inceleme düzeltmesi: ilk taslakta "ve yakın adanın eşzamanlı kurulumundan önce" yazıyordu, bu yanlıştı). Yazılımsal GPU'yu paylaşan dört sekmede konuğun ana iş parçacığı 15 sn'den uzun takılabiliyor. Bu sırada `ping` de gitmiyor, çünkü o da ana iş parçacığındaki bir `setInterval`. Ev sahibi konuğu düşürüyor; konuk `close` → `hostLeft` → menü yolunu izliyor. **İlk başlatılan konuk** en uzun süre açıkta kalıyor: senaryo diğer iki konuğu sırayla yüklüyor ve çizimi ancak hepsinden sonra durduruyor. İkinci, simetrik bir yol da var: ev sahibi takıldıktan sonra rAF kuyruktaki iletilerden önce çalışırsa sahte bir düşürme olur. Kanıt zinciri, bunun neden şimdiye dek "kanıtlanmadığı" ve Node modeli §1.7'dedir. Çözüm adımları F1–F7'dir. (inceleme düzeltmesi) Bu zincir güçlü bir hipotezdir, gözlenmiş bir kanıt değildir. Aynı belirti konuğun 25 sn kuralıyla da oluşur (`net.js:705-706`). 11. belge #37 düşmenin "birkaç saniye içinde" olduğunu yazar, ama zamanlama hiç ölçülmemiştir. Sıra da düzeltildi: ana döngüde `game.update` `net.update`'ten önce koşar (`main.js:118-120`). Bu yüzden ilk `st` yakın ada kurulumundan **sonra**, ağır ilk `post.render`'dan **önce** gider. F5-0 düzeltmeden önce değiştirilmemiş 06c'de neden kaydını gözlemle alır. Önerilen düzeltme kanal kapanışının nedeninden bağımsız olarak menüye düşmeyi kaldırır.
2. **Kopma algılama iki sinyale dayanır** (§5.2): taşıma katmanı (ICE durumu ve DataChannel kapanışı) ile uygulama katmanı (ileti sessizliği). ICE "bağlı" ama iletiler gelmiyorsa karşı tarafın JS'i takılmıştır ya da sekmesi arka plandadır. Bu durumda oyuncu önce "yanıt vermiyor" olarak işaretlenir; sessizlik 30 sn'yi aşarsa hayalet yuvaya alınır. Bağlantı ICE koptuğunda ya da kanal kapandığında koparılmış sayılır. Her iki durumda da düşürme hemen olmaz: 60 sn'lik hayalet yuva ve otomatik yeniden bağlanma devreye girer. (inceleme düzeltmesi) Oturum saatleri rAF'a bağlı `net.update`'te değil, ayrı bir `setInterval(250 ms)`'de koşar. rAF testlerde `fpsLimit = 0.01` ile, gerçek oyunda gizli sekmede durur. ICE `disconnected` için bekleme 3 sn değil 8 sn'dir.
3. **Anlık görüntü v2** (§3): İki kanal kullanılır. Durum U kanalından, sırasız ve kayba izinli gider; olaylar R kanalında kalır. `snap` her konuk için ayrı üretilir: `ts` (host benzetim saati, ms), `sq`, `ak`, `hk` ve `tp` alanları vardır; varlık kimlikleri oturum içi kısa sayılardır (`ent` spawn/despawn ile eşlenir); konum ve açı nicemlenir. Alıcı kendi ham kare saatini host'un ham kare saatiyle (`fc`) eşler (penceredeki en küçük gecikme; inceleme düzeltmesi: ilk taslakta `frameClock` ↔ `ts`). Uyarlanır `D` (100–350 ms) kadar geriden ara değerler; geride kalınca oynatma hızı en çok 2×, öndeyken en az 0,5× olur (zaman bükme). En yeni örneğin en çok `Emax` (250 ms) ötesine dış değerleme yapılır; süreksizlikler görsel hata ofsetiyle söndürülür. Atlama yalnız açık `tp` olayında ya da 3 sn'yi aşan kopmada olur. Node modelinde 1,5–2 sn'lik tıkanmada kare adımı v0.4'te 10,7–14,5 m (normalin 92–124 katı) iken öneride **0,233 m (2×), ışınlanma 0**'dır (§3.4, Ek A). (inceleme düzeltmesi) Node modeli gönderici ve alıcı saatlerini eşit hızda varsayar. Host < 10 FPS'te ya da kırpılan uzun karelerde `playTime` gerçek zamandan geri kalır. Bu yüzden oynatma eşlemesi host'un kırpılmamış kare saatiyle (`fc`) yapılır; `ts` = `playTime` sıralama ve geri sarma için kalır (§3.3). Işınlanmanın kalkması avatarı gerçeğe yaklaştırmaz: 1,5 sn tıkanmada gerçeğe uzaklık öneride de 9,6–9,8 m'dir (§3.4).
4. **İlgi alanı** (§3.5): K0 ≤ 40 m 15 Hz, K1 ≤ 80 m 7,5 Hz, K2 ≤ 250 m 3 Hz, K3 ≤ 1 000 m 1 Hz (yalnız oyuncu, gemi, deniz devi, boss), K4 ötesi 0,5 Hz (yalnız oyuncu ve gemi). Histerezis %15'tir. Konuğun gemisi, taşıdığı sandık ve onu hedefleyen düşman her zaman ilgilidir. Konuk başına bir **öncelik biriktirici** 96 kbit/sn tavanı uygular. Modelde konuk başına akış v0.4'te 262–659 kbit/sn, öneride **48–143 kbit/sn**'dir. 3 konuklu host çıkışı v0.4'te 787–1 977 kbit/sn, öneride 151–228 kbit/sn olur; en kötü durum tavanla 288 kbit/sn'de kalır (§3.7).
5. **Gemi kumandası** (§3.8, E-10): Yelken ve çapa sıra numaralı komutla (`shipCmd{cs}`) güvenilir kanaldan gider. Konuk, komutunun onayını (`hk ≥ cs`) görene kadar görüntüdeki `sailTarget`'ı yok sayar. Modelde basış başarısı %100'dür; denetim v0.4 için %37–50 ölçmüştü. Dümen bırakılınca, kilit düşünce ve bağlantı kopunca host dümeni sıfırlar. İkinci aşamada dümendeki konuk için yerel tahmin ve girdi yeniden oynatmalı uzlaştırma gelir (bayraklı, K5-7). (inceleme düzeltmesi) `hk` son **işlenen** (kabul ya da ret) komuttur. "Son onaylanan" tanımında reddedilen komutun beklemesi hiç kapanmazdı. F5-7B'nin "rüzgâr ve dalga zamanı zaten eşittir" varsayımı yanlıştır: `ocean.time` her istemcide yereldir. Ada kaya engelleri de yalnız adayı kuran istemcide vardır (§3.8).
6. **Kullanıcının 10 maddesi** (§4): Yüzen varil, şişe, kazazede ve gök taşı için olay merkezi bütün oyuncular arasında döner. Bildirimler kodlu `ntf` ile yayılır (serbest metin yoktur). Ödüller toplayan oyuncunun `gbook` profiline yazılır. Geç katılan konuk nesneleri görür. Hayalet ışıklar, düşman gemisi, patlama hasarı, buzdağı ve kuşlar da tamamlanır. Konuk rütbesi `gbook`'ta yaşar; kalıcılık testi, Korsan Kodu ve devir sonrası koruma eklenir. **Ortak zar masası** host otoriteli ve emanetsizdir: bahis düşme, zar atma ve ödeme tek atomik adımdır, bu yüzden kopma ya da devir altın kaybettiremez. **Ticaret** iki aşamalıdır (kilitle → onayla); `rev` denetimi ve host'ta atomik takas vardır; değişmez korunum defterle doğrulanır.
7. **Bağlantı** (§5): Fazlar `pre/lobby/load/warm/game` olur. `warm` fazından `game`'e konuğun açık `loaded` iletisiyle geçilir. Ev sahibi kendi takılmasını telafi eder ve "iki vuruş" kuralı uygular. Düşürmede neden kodu gönderilir. Konuk aynı profil belirteciyle (Faz 2 `wtok` + HMAC) otomatik yeniden bağlanır: 1-2-4-8 sn aralıkla, 60 sn'ye kadar. Sayfa yenilenmemişse dünya yeniden yüklenmez, yerinde eşitlenir. Hayalet yuvada oyuncunun rengi, konumu ve koltuğu korunur.
8. **Host devri** (§6): Varsayılan olarak özel odada açık, herkese açık odada kapalıdır (K5-1). Host varislere periyodik olarak **replika** gönderir: tam kayıt, `gbook`, geçici durum ve sahibin profili. Seçim deterministiktir: aday sırasını `heirs` iletisi belirler. ~~Tur `r`'de aday `c_r` dönem `e+r` için oy toplar.~~ (inceleme düzeltmesi: saat güdümlü turların yerini olay güdümlü oy kirası aldı, §6.4.) Devralmak için çoğunluk (`Q`) gerekir. Sinyal sunucusunun iki kez "yok" dediği üye çoğunluk hesabından çıkar (tanık kuralı). ~~Node taramasında çift host 0 durumda oluştu ve bütün tam bağlantılı durumlar kendiliğinden sürdü (§6.4).~~ Varis dünyayı replikadan sıcak yeniden başlatmayla kurar ve kendi Peer kimliğiyle host olur. Varis önce özgün oda kimliğini ister; dönem eki (`<KOD>-e<N>`) yalnız yedektir (inceleme düzeltmesi). Kayıt bütünlüğü `(dönem, worldRev)` sıralamasıyla korunur; sahip ve varisin profilleri yer değiştirir. Eski host döndüğünde daha yüksek dönemi görür ve konuğa dönüşür. (inceleme düzeltmesi) İlk taslağın "çift host 0" sonucu, host'u her durumda ölü, sinyal sunucusunu anında ve kusursuz tanık, turları da eşzamanlı sayan bir modele aitti. Canlı ama bölünmüş host'ta aynı kural iki oyunculu oyunda, konuğun kendi interneti ya da yalnız host'la bağı kopunca, konuğu kendini seçtirir (2/2). Dört oyunculu oyunda eski host'a bağlı konuk varken ikinci bir host seçer (56 durumun 6'sı). Algılama kaymasında saat güdümlü turlar, tam bağlantılı durumların ancak 23/49 (2 kişi) ve 289/343'ünde (3 kişi) kendiliğinden sürer (`devir_inceleme.mjs`). Nihai kurallar şunlardır: (a) Host, sinyal sunucusu `peer-unavailable` diyene dek çoğunluk nüfusunda "hayır" oyu sayılır. (b) Seçime yalnız sinyal bağlantısı açık düğümler girer. (c) Turlar saatle değil olayla ilerler; oy kirası kullanılır. (d) Varis 1 diğer konuklarla ön bağlantı tutar. (e) Eski host yalnız çoğunluk sertifikası görünce geri çekilir. (f) Replika anahtarların kendisini değil, bir sonraki dönemin türetilmiş anahtarını taşır. Devralmada önce özgün oda kimliği istenir, takma ad yalnız yedektir. Devir süresi temiz kapanışta 10–20 sn, host'un ağı koptuğunda 30–100 sn'dir. Çökme devri, güvenlik testleri geçene dek varsayılan olarak kapalıdır (K5-1).
9. **TURN** (§7): Doğrulandı. Vendored PeerJS 1.5.5 `config` verilmezse `turn:eu-0/us-0.turn.peerjs.com:3478` (kullanıcı `peerjs`, parola `peerjsp`) ve Google STUN'unu **örtük olarak** kullanıyor (`peerjs.min.js` `defaultConfig`; `net.js:49-55` `config` vermiyor). Bu sunucunun garantisi ve SLA'sı yoktur, 443/TLS desteği de yoktur. **Her ağda bağlantıyı garanti etmek için TURN sunucusu gerekir ve proje bugün kendi TURN sunucusuna sahip değildir.** Tasarım sunucu kurmaz. ICE yapılandırmasını açık hâle getirir; kullanıcının kendi TURN'ünü girebileceği arayüzü, geçici kimlik uç noktası desteğini, bağlantı türü tanılamasını ve TURN tanımlıysa relay zorunlu yeniden denemeyi ekler. (inceleme düzeltmesi) TURN, NAT kaynaklı ulaşılamazlığı azaltır ama ortadan kaldırmaz: UDP'yi engelleyen ağda `turns:` (TCP/TLS 443) gerekir, sinyal WebSocket'i de ayrı bir engel olabilir. Çoğu durumda tek tarafta çalışan TURN yeter. Açık `config` verildiğinde PeerJS varsayılanı tümüyle değiştirilir, birleştirilmez. Bu konteynerde yalnız Chromium var (`/opt/pw-browsers/chromium-1243`); coturn kurulu değil.
10. **Sıra ve büyüklük** (§8): 18 adım (F5-0 … F5-17), ilk taslakta yaklaşık 46 iş günü ve 9 500 satır. (inceleme düzeltmesi) F5-1, F5-1a ve F5-1b olarak ikiye bölündü. TURN adımı (F5-12) F5-2'nin hemen ardına alındı. Devir adımları büyüdü. Yeni toplam yaklaşık 52 iş günü ve 10 800 satırdır (7 000 üretim, 3 800 test). D4-02'nin düzeltmesi ilk üç adımda (yaklaşık 4,5 gün) tamamlanır. Testler önce 2 oyunculu (`06r`–`06x`), sonra 4 oyunculu (`06y`, `06z`) koşulur (§9).

### 0.2 Karar noktaları (kullanıcı onayı)

| No | Karar | Önerilen varsayılan | Seçenekler |
|---|---|---|---|
| K5-1 | Host devri | Özel odada açık, herkese açık odada kapalı. ~~Varis adayları dünyanın tam kopyasını (konuk anahtarları ve sandık içerikleri dahil) alır.~~ (inceleme düzeltmesi) Planlı devir (F5-15) özel odada varsayılan açıktır. Çökme devri (F5-16), X4/X5/Y5/Y6 güvenlik testleri 10/10 geçene dek varsayılan kapalıdır. Varis adayları dünyanın tam kopyasını alır, ama konuk anahtarlarının kendisini değil, bir sonraki dönemin türetilmiş anahtarını (§6.3). Sandık içerikleri yine gider. | Her odada kapalı; her odada açık |
| K5-2 | Hikâye, gemi ele geçirme ve batırma XP'si (Faz 2 K-4 ile çakışır) | Bildirim herkese gider; XP olayın 300 m yakınındaki bütün oyunculara tam verilir | Yalnız host (Faz 2 K-4 varsayılanı) |
| K5-3 | TURN | Kodda kullanıcı yapılandırması ve geçici kimlik uç noktası desteği hemen. Proje sunucusu (coturn ya da ücretli servis) proje sahibinin kararı. | Yalnız PeerJS'in örtük TURN'ü (bugünkü hal) |
| K5-4 | PeerJS'in ücretsiz TURN'ü | Açık listede kalır, varsayılan açık, arayüzde "garantisiz" etiketi taşır | Kapalı (yalnız STUN + kullanıcı TURN'ü) |
| K5-5 | Zar masasında meyhane payı ve 6-6 bonusu | Pay %0; 6-6 bonusu zarcının günlük kesesinden 1 bahis | Pay %5 (altın yutağı); bonus yok |
| K5-6 | Ticaret kısıtları | Yeni profil ilk 20 dk ticarette veremez; ithal altın ve bağlı eşya verilemez. (inceleme düzeltmesi) Faz 2 profilinde "bağlı altın" yoktur (`inv.gold` tek bir sayı); bu yüzden profile `gb` alanı eklenir (§4.8). | Kısıtsız |
| K5-7 | Dümende yerel tahmin (Adım F5-7B) | Bayrakla gelir; `--netem lat=120` ölçümüne göre varsayılan açılır | Yalnız komut onayı (F5-7A) |
| K5-8 | Geri sarma (Faz 2 K-9) | Altyapı (`act.vt`, host geçmiş halkası) gelir, özellik kapalı başlar | Açık |
| K5-9 | Host sekmesi arka plandayken Worker saatiyle 10 Hz benzetim | Açık | Yalnız "Kaptan uzakta" göstergesi |
| K5-10 | Çoğunluk sağlanamayınca "Tek başına devam et" | Elle seçilir; dünya **yeni `worldId`** alır (açık çatal). (inceleme düzeltmesi) Çatal `gbook`'u yeni `worldId` altına kopyalar; konukların eski `wtok`'ları `forkOf` eşlemesiyle tanınır. | Hiç sunulmaz |
| K5-11 | Korsan Kodu (Faz 4 S-b) / host imzalı özet (Faz 4 S-c) | S-b uygulanır, S-c ertelenir | İkisi de |
| K5-12 | (inceleme düzeltmesi) Oda kodu dünyaya bağlı mı? | Evet: online yuva kodunu saklar, yeniden barındırmada önce aynı kodu dener. Davet bağlantıları ve `recentRooms` böylece çalışmaya devam eder (audit_E gereksinim 10). | Her seferinde yeni kod (bugünkü davranış, `net.js:208-211`) |
| K5-13 | (inceleme düzeltmesi) Tek hayatta kalan konuğun devralması | Yalnız host kimliği sinyal sunucusunda "yok" iken otomatik. Yoksa 60 sn sonra elle "[Tek başına devam et (çatal)]" seçilir. | İlk taslaktaki gibi hemen (Q = 1); host canlıysa çatal üretir |

### 0.3 Kapsam

- **Kapsamda:** D4-02 kök nedeni ve çözümü; 21 senkron maddesi; anlık görüntü v2 (zaman damgası, ara bellek, ilgi alanı, U kanalı, bant genişliği); gemi kumandasında tahmin; kullanıcının 10 maddesi; kopma ve yeniden bağlanma; host devri; TURN planı; test altyapısı ve `06r`–`06z`.
- **Faz 2'ye ait, yalnız kullanılan:** şema ve kapı, HMAC kimliği, `gbook` ve defter, `tx`, savaş niyetleri, hareket doğrulaması, XSS kuralları. Bu belge bunları değiştirmez, yalnız yeni türler ekler ve `PROTO`'yu artırır.
- **Faz 4'e ait:** kayıt şeması, kuşaklı yedek, `wcache`. Bu belge kayıt başlığına isteğe bağlı devir alanları ekler (§6.6).
- **Kapsam dışı:** sunucu otoriteli mimari, hesap sistemi, lobi sunucusu (yalnız seçenek olarak, §7.7).

---

## 1. Mevcut co-op mimarisinin haritası

### 1.1 Topoloji, kimlikler ve kanal

| Öğe | Kod | Not |
|---|---|---|
| Ad alanı ve sürüm | `VER = 'dksh-v1'` (`net.js:27`) | Faz 2 bunu korur ve `PROTO` ekler |
| Oda kimliği | Özel oda: `dksh-v1-<6 harf>` (`net.js:208-211`, `makeCode` `:31-36`). Herkese açık oda: 12 sabit yuva `dksh-v1-pub-0..11` (`:28`, `:202-206`) | Host'un PeerJS kimliği oda kodunun kendisidir |
| Konuk kimliği | Rastgele PeerJS kimliği (`join` → `_newPeer(null)`, `:414`) | Roster'da `id` |
| Sinyal | PeerJS bulutu `0.peerjs.com:443`. Testte `?peerhost=127.0.0.1&peerport=9000` (`:49-55`, `tests/peer-server.cjs`) | Sinyal kopması DataChannel'ı kapatmaz. Host `disconnected` olunca `peer.reconnect()` çağırır (`:217`); konukta bunun karşılığı yok. (inceleme düzeltmesi) Test sunucusu `peer` 1.0.2'nin değerleri: `expire_timeout` 5 sn, `alive_timeout` 90 sn, `cleanup_out_msgs` 1 sn (`index.cjs:25-32`). PeerJS bulutunun değerleri bilinmiyor **[BELİRSİZ]**. Kayıtlı olmayan bir kimliğe giden OFFER kuyruğa alınır ve 5–6 sn sonra EXPIRE ile düşer (`index.cjs:196-219`). İstemci bunu `peer-unavailable` olarak Peer nesnesinde yayar, bağlantı nesnesinde değil (`peerjs.min.js`: `case eD.Expire: this.emitError(eR.PeerUnavailable, …)`). Ağı kopmuş ama soketi kapanmamış bir kimliğe giden OFFER ise sessizce kaybolur (`index.cjs:386-404`). Sunucu bu kimliği ancak `alive_timeout` dolunca siler (`index.cjs:134-148`). |
| ICE | `peerOpts()` `config` vermiyor (`:49-55`). PeerJS varsayılanı kullanılıyor (§7.1). | Örtük TURN |
| Kanal | Konuk başına tek kanal: `peer.connect(target, {reliable:true, serialization:'json'})` (`:418`). PeerJS bunu `{ordered:true}` yapar; yeniden iletim sınırsızdır. | Kayıp → yeniden iletim bekletmesi ve HOL tıkanması |
| Topoloji | Yıldız: konuklar birbirine bağlı değil | Devirde konuklar birbirini sinyal sunucusu üzerinden bulmalı |
| Gönderim | `broadcast` (`:489`), `toHost` (`:490`), `toPeer` (`:491-495`), `sendGame` (`:496`) | Her konuğa aynı nesne gider |

### 1.2 Oturum yaşam döngüsü

```
Host: menu.hostScreen → net.host() (net.js:198) → menu.lobby (menu.js:264)
Konuk: net.join(code) (net.js:410) → hello → welcome (:250-268) → _pingLoop 2 sn (:445-448) → lobi
Host "Oyunu başlat": handlers.startOnlineHost (main.js:174)
   → game.start(...) (game.js:101; :103 G.state='playing' EN BAŞTA; :124 await terrain.prepare; :126 G.player; :144 sistemler (hepsi eşzamanlı))
   → net.startGame() (net.js:504-507: her bağlantıda inGame=false + 'start' yayını)
   → 400 ms sonra net.sendWorldAll() (main.js:182 → net.js:510-523: inGame=false + 'world')
Konuk: 'start' → netStart (menu.js:298 yalnız lobi açıksa) → handlers.startOnlineGuest (main.js:187-197)
   'world' oyun başlamadıysa bekletilir (main.js:320-324) → sessionStart'ta applyWorld (main.js:325-342; :341 limanda doğar)
Oyun: net.update (net.js:696-732) her karede, ana döngüde (main.js:117-123 → engine.js:52-71 rAF)
   host: 15 Hz _hostSnapshot (:734-743), yarısında tam liste (:741)
   konuk: 15 Hz st (:718), dümende helm (:719), kayıkta boatSt (:720)
Bitiş: konuk hostLeft (net.js:441 close / :706 25 sn / :577 kick) → main.js:313-318 (kaydet, game.stop, net.leave, menü)
       host _dropPeer (net.js:390-403): kapanış (:232), hata (:233), 15 sn sessizlik (:704)
```

### 1.3 İleti akışları

**Konuk → host (38 tür, `KNOWN` `net.js:46`):** Durum: `st` (15 Hz), `helm`, `boatSt` (15 Hz). Oturum: `hello`, `ping`, `ready`, `app`, `chat`. İstekler: `hurt*`, `stunEnemy`, `dig`, `chestReq`, `pickupReq`, `floatReq`, `holdTake`, `lootReq`, `shipCmd`, `fire`, `boat`, `lock`, `revive`, `story`, `marker`, `hazard`. Tam durum: `hold`, `shipFull`, `chestState`, `chestGone`, `gold`, `maps`, `downed`, `noise`. Ölü türler: `inter`, `prog`. Faz 2 bunları 29 türe indirir ve sertleştirir (Faz 2 §3.1). (inceleme düzeltmesi) Listede savaş niyeti `act` eksikti (`net.js:277`).

**Host → konuk:** `welcome`, `reject`, `roster`, `start`, `world`, `snap`, `chat`, `act`, `hurt`, `xp`, `give`, `gold`, `carryOk`, `teleport`, `sleep`, `weather`, `story`, `marker`, `lock`, `cannon`, `boat`, `shipCmdFx`, `hazard`, `hole`, `hold`, `shipFull`, `chest*`, `pickup*`, `float*`, `mapUsed`, `revive`, `pong`, `kick` (yalnız işleniyor; hiçbir yerde gönderilmiyor, `:577`). Olay kaynakları `init` içindeki `relay` listesidir (`net.js:143-184`).

### 1.4 Anlık görüntü

| Alan | Üretici | Sıklık | Alıcı |
|---|---|---|---|
| `players` | `p.netState()` (`player.js:986-993`) + konukların ham `r.target`'ı (`net.js:737`) | 15 Hz | `_remoteState` → `RemotePlayer.apply` (`net.js:643-647`, `:86`) |
| `ships` | `s.netState()` 23 elemanlı dizi (inceleme düzeltmesi: 0–22, `ship.js:705-707`) (`ship.js:704-708`) + her seferinde `typeId`, `look`, `name` | 15 Hz | `applyNet` (`ship.js:710-737`) → `clientUpdate` (`:566-579`) |
| `floats`, `shots`, `rb` | `events.netFloats` (`events.js:238`), `enemies.netShots` (`enemies.js:1643`) | 15 Hz | `applyFloats` (`events.js:239-248`; tanımadığı kimliği atlar, `:243`), `applyShots` |
| `en`, `bo`, `an`, `mf` | `netSnapshot` (`enemies.js:1641`, `bosses.js:1118`, `animals.js:828`, `megafauna.js:725`) — **tam liste** | 7,5 Hz | `applySnapshot`; listede olmayan varlık silinir (`enemies.js:1658`, `animals.js:837`) |
| `time`, `wfx`, `we`, `ch` | `sky`, `weatherfx.netState`, `worldEvents.netState` (`worldEvents.js:312-320`), sandık konumları | 7,5 Hz | `_applySnap` (`net.js:678-692`) |

Zaman damgası, sıra numarası, delta ve konuk başına süzme yok. Paket boyutu 1,3–9,2 KB arasında değişir: hafif görüntü 1 318–2 559 B, tam görüntü 3 055–9 192 B (Ek A, `bw_budget.mjs`; 02. belge 2,3–3 KB ölçmüştü).

### 1.5 Kalp atışı, kopma ve düşürme

| Kural | Kod | Saat |
|---|---|---|
| Host: her geçerli ileti `lastSeen` değerini tazeler; ilk `st` `inGame=true` yapar | `net.js:239` | İleti işleyicisi |
| Host: `inGame && now − lastSeen > 15 000` → `conn.close()` + `_dropPeer` (nedensiz) | `net.js:704` | **rAF döngüsü** (`net.update`) |
| `startGame`/`_sendWorld`: `inGame=false` | `net.js:505`, `:511` | — |
| Konuk: `ping` 2 sn | `net.js:445-448` | **Ana iş parçacığındaki `setInterval`** |
| Konuk: ilk uygulanan `snap` `_snapSeen=true` yapar; 6 sn'de "zayıf", 25 sn'de `hostLeft` | `net.js:533`, `:705-708` | rAF |
| Konuk: kanal `close` → `hostLeft` | `net.js:441` | Olay |
| `hostLeft` → kaydet, `game.stop`, `net.leave`, menü; açık paneller kapanmaz (E-14) | `main.js:313-318` | — |
| Yeniden katılım ad eşleşmesi (fiilen ölü kod; E-16) | `net.js:255` ↔ `:394` | — |
| Kanal `error` → `_dropPeer` (Y-1: JSON ≥ 16 300 B) | `net.js:233` | — |

### 1.6 Alıcı tarafında yumuşatma

| Varlık | Kod | Yöntem |
|---|---|---|
| Uzak oyuncu | `RemotePlayer.update` (`net.js:87-124`) | Son hedefe `1 − e^(−14·dt)`, fark > 8 m ise tek karede atlama (`:96-97`) |
| Konuk gemisi | `ship.clientUpdate` (`ship.js:566-579`) | 0,25 sn hız öngörüsü + `damp(8)`; 12 m'de (`:571`) ve 30 m'de (`:712`) atlama |
| Düşman, hayvan, deniz devi | `_interp` (`enemies.js:1621-1638`, `animals.js:818-826`, `megafauna.js:742-750`) | `damp(10)` / `damp(8)` |
| Yüzen nesne | `events.update` (`events.js:64-69`) | `lerp(8)`; 45 kare görünmezse silinir |
| Sandık | `_applySnap` (`net.js:689-692`) | Doğrudan atama (7,5 Hz basamak) |

### 1.7 D4-02: kök neden analizi

**Belirti** (`coop_06c.json`, 4 oyuncu): `D4-02` durumları `["playing","menu","playing","playing"]`, `D4-03` uzak oyuncu sayıları `[2,0,2,2]`, `D4-04` sohbet sayıları `[0,1,0,0]`, `D4-06 rosterAfterLeave` `["Kaptan","Lostromo"]`. Test, menüye düşen ilk konuk ("Tayfa") için yine de `"guest-started"` kaydetti.

**Çıkarım 1 — yol:** Tayfa'nın kendi sohbetini kendi sayması (`[0,1,0,0]`) yalnız `G.isHost === true` iken olur (`net.js:501`). Bu değeri `net.leave()` atar (`:483`). Oyundaki bir konuğu `net.leave`'e götüren tek yol `hostLeft`'tir (`main.js:316`). Kaynakları üçtür: kanal kapanışı (`net.js:441`), 25 sn kuralı (`:706`) ve `kick` (`:577`; hiç gönderilmiyor). Host roster'ında Tayfa yok, yani bağlantı kapanmış.

**Çıkarım 2 — neden ilk konuk:** 06c konukları sırayla başlatıyor (`06c_dort_oyuncu.cjs:16`). Çizimi durduran `fpsLimit=0.01` ise ancak bütün konuklar başladıktan sonra veriliyor (`:17`). Bu arada dört sayfa tek SwiftShader GPU sürecinde, 4 çekirdekte gerçek zamanlı çiziyor. Tayfa'nın "oyunda" geçirdiği süre, Lostromo ve Topçu'nun yüklenme süreleri kadardır. Log'da ilk `tick` 58,8 sn'de başlıyor, yani konuk başına yaklaşık 10–15 sn. Lostromo'nun açıkta kaldığı süre yalnız Topçu'nun yüklemesidir; Topçu'nunki sıfıra yakındır. Hata da bu sırayla dağılıyor: 12. belgeye göre "ilk başlatılan konuk(lar)" düşüyor. 06a2'de (3 oyuncu) ilk konuk yalnız bir yükleme süresi açıkta kalıyor; testin bu yüzden geçtiği tahmin ediliyor (taban koşusu 3/3).

**Çıkarım 3 — mekanizma A (konuk takılması):** Host'un 15 sn kuralı, Tayfa'nın **ilk** `st`'siyle kuruluyor. `sendT` 0'dan başladığı için (`net.js:137`, `:712-714`) bu ileti yüklemeden sonraki ilk karede, `net.update` içinde gidiyor (`main.js:117-121`). Aynı karenin devamında `post.render()` dünyayı ilk kez oyuncu gözünden çiziyor (`engine.js:68`). Açılıştaki `compileAsync` (`main.js:112`) yalnız o an sahnede olanları önceden derlemişti; oyuncu karakteri (`game.js:125-126`), ada içerikleri, düşmanlar ve hayvanlar sonradan eklendiği için ilk görüşte derleniyor. Yakındaki ada da sınırsız tek iş olarak kuruluyor (`islands.js:289-290` beklemeden `_build`; `:297` `_runJob(J, near ? Infinity : STEP_MS)`). `ping` aynı ana iş parçacığında çalıştığı için (`net.js:447`) takılma süresince hiçbir ileti gitmiyor. Bu ortamda 15 sn'yi aşan takılmaların önceden ölçülmüş kaydı var: 08. belge §8.1'e göre H13'ün 3. koşusunda konuk "dünya yüklenirken 15 sn sessiz kaldı ve haksız yere düşürüldü"; 10. belgeye göre yazılımsal GPU'da gerçek zamanlı çizim açıkken "bazı adımlar 10–15 sn sürdü". Eşik o zaman "ilk `st`"ye taşındı, ama ilk `st` ağır işten **önce** gittiği için açık kapanmadı.

(inceleme düzeltmesi) **Sıra düzeltmesi:** Ana döngüde `game.update`, `net.update`'ten önce koşar (`main.js:118-120`). `islands.start` `checkT = 0` yaptığı için (`islands.js:258`) ilk karedeki `islands.update` yakındaki adayı (`NEAR_D` 250 m, `islands.js:31`) eşzamanlı kurar (`islands.js:289-290`). Yani ilk `st` yakın ada kurulumundan **sonra**, ağır ilk `post.render`'dan (`engine.js:68`) **önce** gider. Konuk liman kıyısında doğduğu için (`main.js:341`) bu adımda yakında çoğu zaman ada yoktur. Mekanizmanın ağır kısmı ilk çizim ile sonraki karelerdir: dört sayfa tek bir GPU sürecini paylaşır ve eşzamanlı WebGL çağrıları bu süreci bekler.

**Çıkarım 4 — mekanizma B (host takılması):** Denetim rAF içinde yapılıyor. Ev sahibi kendisi 15 sn'den uzun takılırsa, takılma bitince tarayıcı render açlığını önlemek için rAF'yi kuyruktaki DataChannel iletilerinden **önce** çalıştırabilir. O anda `now − lastSeen > 15 000` görülür ve konuk düşürülür; oysa iletileri kuyrukta beklemektedir. Bu durumda da yalnız `inGame` olan, yani o an ilk konuk etkilenir.

(inceleme düzeltmesi) Mekanizma B'nin dayanağı, uzun bir görevden sonra rAF'ın kuyruktaki ileti görevlerinden önce çalışmasıdır. Bu tarayıcı zamanlayıcısına bağlıdır, kesin değildir **[BELİRSİZ]**. Z3 bu durumu `busy` ve hemen ardından denetim çağrısıyla zorlar; yani olayı yeniden üretmez, yalnız kuralın kırılganlığını gösterir. **Konuk tarafı eşi:** Konuğun 25 sn kuralı (`net.js:705-706`) aynı biçimde işler ve aynı belirtiyi üretir: konukta `hostLeft` → `net.leave` → `peer.destroy`, host'ta `close` → `_dropPeer`. Bu yolda da host roster'ından Tayfa düşer ve `G.isHost=true` olur. 06c'nin kanıtı iki yolu birbirinden ayırt etmez.

**Çıkarım 5 — neden "kanıtlanamadı":** Harness yalnız `console.error`'u kaydediyor (`coop.cjs:34`), düşürme ise `console.warn` ile yazılıyor (`net.js:704`). `kick` gönderilmediği için konuk nedeni bilmiyor (`:577`). Tanılı koşular zamanlama yüzünden hatayı yinelemedi (11. belge #37).

(inceleme düzeltmesi) **Kanıt düzeyi:** 11. belge #37 ve 12. belge düşmeyi "birkaç saniye içinde" olmuş gibi anlatır. 06c ise yalnız 58,8. saniyedeki toplu denetimi kaydeder (`coop_06c.log`); düşmenin anı ölçülmemiştir. Gerçekten birkaç saniyede olduysa 15 sn kuralı bunu açıklayamaz. Kök neden bu yüzden **güçlü bir hipotezdir**. F5-0'ın ilk işi, değiştirilmemiş 06c'yi `--repeat 5` ile tanı kaydı açık olarak koşmaktır. Bu kayıt düşen konuğun bağlantısının nasıl kapandığını yazar: host'ta `drop:silence`, konukta `hostLeft:silence`, `close` ya da `error:<tür>`. Düzeltmenin (iki sinyal, hayalet yuva ve yeniden bağlanma) kabulü bu kayda bağlı değildir: kanal hangi nedenle kapanırsa kapansın konuk menüye düşmez.

**Node modeli** (`/tmp/tasarim_y/heartbeat_sim.mjs`):

| Durum | v0.4 kuralı | Önerilen kural |
|---|---|---|
| Konuk ilk karesinden sonra 16 sn takılır | 20,1. sn'de düşürülür | Düşürülmez |
| Konuk 12 sn takılır | Düşürülmez | Düşürülmez |
| Host 16 sn takılır, önce rAF çalışır | 36,0. sn'de düşürülür | Düşürülmez |
| Host 16 sn takılır, önce iletiler işlenir | Düşürülmez | Düşürülmez |
| Konuk gerçekten kopar | 35. sn'de düşürülür | Modelde ICE bilgisi yok, yalnız sessizlik var: 8 sn'de şüpheli, ardından hayalet yuva; 88. sn'de yuva serbest. Gerçekte kanal kapanışı ve ICE kopması bunu birkaç saniyede bildirir (§5.2). |

**Neden değil:** Y-1 (16 300 B JSON sınırı) değil: taze dünyada `snap` 1,3–3 KB ve `world` küçük; ayrıca `error` yalnız mesaj çok büyükse ya da kanal açık değilse çıkar ve `broadcast` önce `open` denetler (`net.js:489`). Sinyal sunucusu kopması da değil: DataChannel'ı kapatmaz.

**Gizli ilgili hata L-1 (zombi oturum):** `game.start`, `G.state='playing'` değerini ilk `await`'ten önce atıyor (`game.js:103`, `:124`). `terrain.prepare` beklenirken host bağlantısı kapanırsa `hostLeft` koruması (`main.js:314`) geçilir: `game.stop` ve `net.leave` çalışır, ama `game.start` kaldığı yerden sürer. Sonuçta menünün üstünde HUD'lu, bağlantısız bir oturum kalır. Faz 4 §4.6'nın `'loading'` durumu bu kez `hostLeft`'i yok saydırır ve yükleme ölü bir oturumda biter. Her iki durumda da bir iptal belirteci gerekir (F6).

**Düzeltmeler:**

| No | Değişiklik | Yer | Adım |
|---|---|---|---|
| F1 | Isınma fazı: `game` kalp atışı ilk `st` ile değil, konuğun `loaded` iletisiyle kurulur. ~~Konuk `loaded` iletisini dünya uygulandıktan ve 60 kare (en çok 20 sn) geçtikten sonra gönderir; yakın adanın kurulmuş olması da koşuldur.~~ (inceleme düzeltmesi) Konuk `loaded` iletisini dünya uygulandıktan sonra gönderir: ya 60 kare geçmiş ve `NEAR_D` içinde kurulmamış ada kalmamıştır, ya da 20 sn dolmuştur (koşulsuz tavan, §5.3). `load` ve `warm` fazlarında sessizlik sınırı 90 sn'dir. `warm` fazının izinleri `game` ile aynıdır (§1.8). | `session.js`, `net.js:239` | F5-1b (inceleme düzeltmesi) |
| F2 | Kendi takılmasını telafi: ~~`net.update`'ler arası boşluk 1 sn'yi aşarsa~~ 3 sn erteleme uygulanır. Her karar 1 sn arayla iki ardışık denetimde doğrulanır. (inceleme düzeltmesi) Denetim `net.update`'te değil, ayrı `setInterval(250 ms)` ile koşan `session.tick`'te yapılır. Kendi takılması, aralığın beklenenden ne kadar geç çalıştığıyla ölçülür (> 2,5 sn ise 3 sn erteleme). rAF'a bağlı denetim testlerde (`fpsLimit = 0.01`, `coop.cjs` tıkları arası > 1 sn) erteleme kuralını sürekli tetikler. Gizli sekmede ise hiç çalışmaz (§5.2). | `session.js` | F5-1a (inceleme düzeltmesi) |
| F3 | İki sinyalli algılama: ICE "bağlı" iken sessizlik düşürme değil, "yanıt vermiyor" durumudur (§5.2). (inceleme düzeltmesi) ICE `disconnected` için 8 sn beklenir (§5.2). | `session.js` | F5-2 (inceleme düzeltmesi) |
| F4 | Nedenli düşürme: kapatmadan önce `kick{code:'timeout'}` ya da `bye{code}` gönderilir. Konuk nedeni gösterir. | `net.js:704`, `:577` | F5-1a (inceleme düzeltmesi) |
| F5 | Geçici kopmada menü yok: otomatik yeniden bağlanma ve hayalet yuva | §5.4–5.5 | F5-2 |
| F6 | Yükleme iptal belirteci: `game.start(opts.token)` her `await`'ten sonra belirteci denetler. `hostLeft` yükleme sırasında `abortStart`'ı (Faz 4) tetikler ve yeniden bağlanmaya geçer. (inceleme düzeltmesi) Geçici kopma yüklemeyi iptal etmez: konuk yüklemeyi bitirir ve `yeniden` durumuna geçer. Belirteç yalnız oturum kesin bitince (`bitti`) geçersiz olur (§5.3). | `game.js:101-150`, `main.js:313` | F5-1b (inceleme düzeltmesi) |
| F7 | Test altyapısı: harness uyarıları ve `net.diag` halkasını rapora yazar. 06z'de D4-02'nin deterministik yeniden üretimi yapılır (`DK.netTest.busy(17000)` konukta ve host'ta; host'ta ardından hemen `DK.net.update`). (inceleme düzeltmesi) Önce değiştirilmemiş 06c'de gözlemsel kayıt alınır (yukarıda). Harness yerel sinyal sunucusunu başlatıp durdurabilir (R9). `cut` komutunun bir de taşıma kipi vardır (§9.1). | `coop.cjs`, `netShape.js` | F5-0 (inceleme düzeltmesi) |

**Kabul:** Z2 ve Z3 (06z) v0.4 kodunda "menu" üretir, F5-1'den sonra üretmez. 06c 10 ardışık koşuda 7/7 geçer (E-16 kabulü). 06a2 H13'te kopma hâlâ ≤ 30 sn'de algılanır. (inceleme düzeltmesi) Z2'de konuğun `busy` çağrısı beklenmez (`Promise.all`); bu sırada host 18 sn tıklanır. Z3'te `busy`'nin hemen ardından `DK.net.session.tick()` çağrılır (v0.4'te `DK.net.update(0)`).

### 1.8 Faz 2–4'ten sonra beklenen taban

Faz 5 şu tabanın üstüne kurulur:

- **Faz 2:** `raw` kanal; `PeerGate` (faz, kova, şema, `q`); 29 c2h türü; `snapState` ve `r.auth`/`posOf`; `gbook` ve HMAC; `worldPart` parçaları; `kick`/`warn`; `feat`/`featSt`; `inv`/`prof`/`gold`/`xp` h2c; `hostCombat` ve gölge can; `[At]` arayüzü.
- (inceleme düzeltmesi) **Faz 2 kapısıyla çakışma ve uyum:** Faz 2 §2.3'te `load` fazında yalnız `ping`, `chat`, `st`, `sync` ve `importReq` serbesttir. Diğer her ileti 5 ihlal puanı alır (§2.7); 20 iletide puan 100'e ulaşır ve `kick{protocol}` gelir. Faz 5'in `warm` fazında ise konuk oynamaktadır (eylem, `tx`, `feat` gönderir). Bu yüzden `warm` fazının izinleri `game` ile aynıdır, yalnız zaman aşımları farklıdır. Faz 2'nin `load` 60 sn ve `game` 15 sn sessizlik kuralları kapıdan çıkarılır ve `session`'a devredilir. `st` şemasındaki faz listesi `['load','warm','game']` olur.
- **Faz 3:** biriktiricili `STEP`; `game.frameClock`; uzak yumuşatmanın çizim evresinde olması.
- **Faz 4:** `worldId`, `saveSeq`, `'loading'` + `abortStart`, `worldState.feats()`, `wcache` 120 sn, olay tetikli kayıt.

Faz 5'in ilk iki adımı (F5-0, F5-1) bu tabandan bağımsız olarak v0.4 üstüne de uygulanabilir. Önerilen sıra yine de Faz 2 Adım 3'ten sonradır (§8.5).

---

## 2. 21 senkron maddesi

Sıklıklar ilgi katmanı başına verilmiştir: **K0** ≤ 40 m, **K1** ≤ 80 m, **K2** ≤ 250 m, **K3** ≤ 1 000 m, **K4** ötesi (§3.5). "R" olay kanalını, "U" durum dilimini gösterir. İleti adları Faz 2 kataloğundadır. Yeni türler **kalın** yazılmıştır ve §3.2'de tanımlanır.

| # | Madde | Şu an (v0.4) | Hedef | İleti | Sıklık | İlgi alanı |
|---|---|---|---|---|---|---|
| 1 | Oyuncu konumu | `st` 15 Hz (`net.js:718`), host ham `r.target`'ı yansıtır (`:737`). Alıcıda üstel yaklaşma ve 8 m'de atlama (`:96-97`). Zaman damgası yok. | Kaynak zaman damgalı `st` (U). Host `r.auth`'u konuğun saat ofsetiyle host zamanına çevirip yeniden damgalar. Alıcıda NetInterp (D 100 ms, Emax 250 ms, zaman bükme). Atlama yalnız `tp` değişince olur. | c2h `st{sq,s:{ts,…}}` (Faz 2 şeması + `sq`); h2c `snap.p[]` = nicemlenmiş `snapState` | K0 15, K1 7,5, K2 3, K3 1, K4 0,5 Hz | Her uzaklık (haritada görünür) |
| 2 | Oyuncu animasyonu | `anim/up/loop/swimP/air/mode` `st` içinde (`player.js:989-991`). 15 Hz'de kısa tek seferlik klipler kaçabilir. Ragdoll yalnız adla tetikleniyor. | `snap.p` içinde klip dizini ve `aq` (eylem sayacı). Tek seferlik eylemler (saldırı, zıplama, düşüş) R'den `act{from}` (Faz 2) ile gider. Alıcı `aq` değişince klibi yeniden başlatır. | `snap.p[animIdx, upIdx, aq]`; `act` | Konumla aynı | K0–K2 (K3+ yalnız `Idle/Run/Swim` sınıfı) |
| 3 | Ekipman ve görünüm | `eq` → `c.hold` (`net.js:115`). `torch` uygulanmıyor. Terzi değişikliği yansımıyor (E-20). | `eq`, `torch` bayrakları `snap.p` içinde. Görünüm `app` (Faz 2 APP şeması) ile gider; host roster'ı yayınlar, alıcı `RemotePlayer.setAppearance` çağırır. Meşale ışığı ≤ 30 m'de gerçek ışıkla, ötesinde parlama sprite'ıyla gösterilir. | `snap.p[eqIdx, flags]`; R `app` → `roster` | Bayraklar konumla; görünüm değişince | Her uzaklık |
| 4 | Can ve bayılma | `hp/down` konuğun beyanı (`player.js:990`). `downed` yalnız host'ta bildirim üretiyor (`net.js:385`). Konukta işleyici yok (E-20). | Faz 2 gölge canı yetkili kaynaktır. `snap.p[hp, down]` host'tan gider. Yaralı düşme herkese `ntf{k:'downed', who}` ile bildirilir. Kaldırma Faz 2 §6.10'a göre çalışır, istem her oyuncuda görünür. | h2c `hp` (kendi), `snap.p`, **`ntf`** | `hp` değişince; konumla | Her uzaklık; bildirim ≤ 600 m |
| 5 | Gemiler (konum, hız, dümen) | 23 elemanlı `netState` ve her seferinde `look/name/typeId` (`net.js:738`). 0,25 sn öngörü, 12/30 m atlama (`ship.js:566-579`, `:712`). | `snap.s[]`: konum, yaw, hız, `vx, vz, yawRate`, dümen, yelken, çapa, `hk`. Statik alanlar `ent+` içinde gider. NetInterp gemi parametreleriyle çalışır (D 120 ms). Dümendeki konuk tahmin yapar (§3.8). (inceleme düzeltmesi) Konukta geminin pozu tampondan **adım evresinde** örneklenir, çünkü güverte fiziği bu pozu kullanır. Çizim de aynı örneği kullanır (Faz 3 K9, madde 5). | U `snap.s`; R **`ent`** | K0 15, K1 7,5, K2 3, K3 1, K4 0,5 Hz; konuğun bindiği gemi her zaman 15 Hz | Her uzaklık (harita); ayrıntı 1 500 m |
| 6 | Gemi hasarı | `parts`, `mastHp`, `cannonHp`, `fires` ve `holes` her görüntüde gidiyor (`ship.js:705-708`). Tersane tamiri kısmen işliyor (E-12). | Değişince R **`shipDmg`** gider. Hizmetler Faz 2 `tx{svc}` ile yapılır. `snap.s` yalnız `hp` ve `water` taşır. | **`shipDmg{id,parts,mast,can,fires,holes}`** | Değişince (en çok 5/sn) | Gemi ilgi alanındaysa; girişte `ent+` tam durum |
| 7 | Gemi topları | `fire` → host; `cannon` yayını; konukta görsel gülle (`net.js:363`, `:573`) | Değişmez (Faz 2 `fire`). `cannon` ilgi alanına göre süzülür. Gülle sayısı `snap.s`'te 1 Hz ya da değişince gider. | c2h `fire`; h2c `cannon` | Olay | `cannon` ≤ 800 m |
| 8 | Yelkenler | `helm` içindeki `sail` her görüntüde eziliyor; basışların %37–50'si tutuyor (E-10) | Yelken komutu `shipCmd{cmd:'sails', v, cs}` (R). Konuk `hk ≥ cs` olana kadar görüntüdeki değeri yok sayar. `helm` artık `sail` taşımaz (**PROTO 3**). | R `shipCmd`; U `snap.s[sail, sailT, hk]` | Komut anında; durum geminin sıklığında | Gemiyle aynı |
| 9 | Çapa | `shipCmd anchor` → `toggleAnchor` (`net.js:623`) | `shipCmd{cmd:'anchor', cs}` (Faz 2 alt şeması + `cs`). Durum `snap.s[anchorT, aState]` içinde, ses `shipCmdFx` ile gider. | R `shipCmd`; U `snap.s` | Aynı | Aynı |
| 10 | Düşmanlar | 7,5 Hz tam liste (`net.js:741`). Listede olmayan silinir. `damp(10)` uygulanır. Telgraf halkaları konukta yok (11. belge #15). | `ent+` (tür, `maxHp`, grup) ve `ent−` (`dead`/`far`). `snap.e[n, x, y, z, yaw, anim, hp, flags]` nicemlenir. NetInterp (D 100–200 ms). Ağır saldırı telgrafı R **`tel`** ile gider. Geri sarma için host konum geçmişi tutar (§3.9). | U `snap.e`; R `ent`, **`tel`** | K0 15, K1 7,5, K2 3 Hz | 250 m (+%15 histerezis); konuğu hedefleyen düşman her zaman |
| 11 | Bosslar | Yalnız etkin boss, türe özel `netExtra` (`bosses.js:1118-1122`). Rün sütunları konukta yok (11. belge #14). | `snap.b`: temel alanlar + `netExtra`. Evre değişimleri ve özel efektler R **`bossFx`** ile gider. Hasar Faz 2 `act` ile işlenir. | U `snap.b`; R `bossFx` | ≤ 300 m'de 15 Hz | 600 m |
| 12 | Kara hayvanları | Tam liste 7,5 Hz; paketin en büyük payı (1,4–1,9 KB) | `ent±` + `snap.a[n, x, y, z, yaw, st]` | U `snap.a` | K0 7,5, K1 7,5, K2 3 Hz | 250 m |
| 13 | Deniz canlıları | Deniz devleri 7,5 Hz tam liste. Balık sürüleri yerel. | Deniz devleri `ent±` + `snap.m`. Balık sürüleri bilinçli olarak yerel dekordur; tür Faz 2 gereği host'ta seçilir. | U `snap.m` | K0–K1 7,5, K2 3, K3 1 Hz | 600 m |
| 14 | Hazine sandıkları | `chestSpawn/State/Gone` olayları + 7,5 Hz konum (`net.js:741`, `:689-692`) | Olaylar R'de kalır (içeriksiz `chestNet`, Faz 2 E-7). Hareketli sandık (`water`, `boat`) `snap.c` dilimiyle gider. Taşınan sandık taşıyıcının çizim pozunu izler (Faz 3). | R `chest*`; U `snap.c` | Olay; hareketliyse 7,5 Hz | Olaylar küresel; konum 250 m |
| 15 | Ganimet keseleri | `pickupSpawn/Gone/Items` ve `worldPart` | Değişmez (statik nesne). Geç katılım ve yeniden bağlanma eşitlemesi `worldPart` ile yapılır. | R `pickup*` | Olay | Küresel |
| 16 | Bulmacalar | Blok itme ve çözme olayları. Tapınak, sunak ve tutsak yerel (E-05, E-06). | Faz 2 `feat`/`featSt` + `worldPart.feats`. Hareketli blok `hazard{block}` ile en çok 5 Hz gider. | R `featSt`, `hazard` | Olay; itme sırasında 5 Hz | Küresel durum; görsel 300 m |
| 17 | Çevre tehlikeleri | `hazard` olayları doğrulamasız. Patlama konuğa işlemiyor (E-18). | Faz 2 §6.7 (host kuralı, mantık kümeleri). Yuvarlanan kaya `snap.h` dilimiyle gider. Patlama hasarı host'ta gölge canlara uygulanır. | R `hazard`; U `snap.h` | Olay; yuvarlanırken 7,5 Hz | 300 m |
| 18 | Hava | `weather` olayı + `time` 7,5 Hz içinde hava anahtarı, tahmin ve ıslaklık. Su hortumları `wfx` ile gidiyor. | Hava değişimi R `weather`. Ayrıntılar `snap.tm` (1 Hz). Su hortumları `ent±` + `snap.w`. | R `weather`; U `snap.tm`, `snap.w` | Değişince; 1 Hz; 3 Hz | Hava küresel; hortum 1 500 m |
| 19 | Zaman | `time[0], time[3]` 7,5 Hz; `sleep`, `teleport` olayları | `snap.tm` 1 Hz. Konuk saati yerelde ilerletir ve sapmayı yavaşça kapatır (\|Δ\| < 0,05 sa ise kayar, değilse atar). `sleep` ve `teleport` R'de kalır; `teleport` `tp` sayacını artırır. | U `snap.tm`; R `sleep`, `teleport` | 1 Hz | Küresel |
| 20 | Dinamik olaylar | `floatSpawn/Gone` + `floats` 15 Hz; `worldEvents.netState` 7,5 Hz; olay ev sahibi merkezli (E-17); buzdağı sürekli yeniden kuruluyor (E-21) | Olay bağlamı oyuncular arasında döner (§4, ortak altyapı). Bildirimler **`ntf`**, görseller **`evt`** ile gider. Yüzen nesneler `snap.f` (3 Hz) ile, dünya olayı durumu `snap.w` (1 Hz) ile gider. Geç katılımda `worldPart.floats` gönderilir. (inceleme düzeltmesi) Host'ta host oyuncusuna bağlı silme kuralları da en yakın oyuncuya göre yazılır: buzdağı 1 400 m kuralı (`worldEvents.js:368`) ve plankton (`:385-386`). Aksi hâlde uzak konuğun yanında doğan olay host'ta ilk karede silinir. | R `float*`, `ntf`, `evt`; U `snap.f`, `snap.w` | Olay; 3 Hz; 1 Hz | Yüzen nesne 400 m; buzdağı 1 500 m; meteor ve volkan küresel |
| 21 | Görev ilerlemesi | `story` yayını. Konukta aşama doğrudan yazılıyor, bildirim ve XP yok (E-17). Bayraklar `Object.assign` ile birleşiyor (E-8). | Faz 2 §6.9 (beyaz liste, host tetikleyicileri). Konukta `quests.onRemoteAdvance(stage)` "Yeni görev" arayüzünü çalıştırır. XP kararı K5-2'ye bağlıdır. Yan görevler profildedir (`pq`). | R `story`, `marker`, `prof` | Olay | Küresel |

---

## 3. Anlık görüntü sistemi

### 3.1 İki kanal

| | R (olay) | U (durum) |
|---|---|---|
| Oluşturma | PeerJS `DataConnection`, `serialization:'raw'`, `reliable:true` (Faz 2 §2.4) | Her iki uçta `conn.peerConnection.createDataChannel('dksh-u', {negotiated:true, id:8, ordered:false, maxRetransmits:0})` (inceleme düzeltmesi: ilk taslakta `id:512` idi. PeerJS bağlantı başına tek bir kanal açar, kimliği 0 ya da 1 olur. Küçük bir kimlik, bazı yığınlarda akış sayısını genişletme gereğini ortadan kaldırır **[BELİRSİZ]**.) |
| Neden negotiated | PeerJS her in-band kanalı kendi bağlantısına bağlıyor: `pc.ondatachannel = e => getConnection(...)._initializeDataChannel(e.channel)` (`peerjs.min.js`, negotiator `_setupListeners`). İkinci bir in-band kanal PeerJS kanalının yerine geçerdi. Negotiated kanal `ondatachannel` olayını tetiklemez. | |
| Taşıdıkları | Oturum, istek, olay, `ent`, `worldPart`, `repl`, ticaret, zar | c2h `st`, `helm`, `boatSt`; h2c `snap` dilimleri |
| Sıra | Faz 2 `q` (kesin artan) | Kanal başına `sq`. Eskiyse düşürülür; **ihlal puanı yazılmaz**. Bu, Faz 2 §2.8'e eklenen bir istisnadır: U türleri `q` denetimine girmez. |
| Boyut | Faz 2 sınırları; büyük iletiler ≤ 16 000 B parçalara bölünür | Paket ≤ 1 100 B (tek SCTP yığınına sığar; kayıpta parçalı ileti oluşmaz) |
| Tıkanıklık | `bufferedAmount` > 256 KB ise replika ve `worldPart` parçaları bekletilir | `bufferedAmount` > 32 KB ise o tikin dilimleri atlanır |
| Yedek | — | U 5 sn içinde açılmazsa ya da tarayıcı reddederse aynı iletiler R üstünden gider (`diag: uFallback`). Davranış değişmez, yalnız HOL riski geri gelir. |

**[BELİRSİZ]** Negotiated kanalın PeerJS bağlantısı kurulduktan sonra Firefox ve Safari'de açılması standarttır, ama projede denenmedi; F5-4'te ölçülür.

(inceleme düzeltmesi) Bu ortamda yalnız Chromium kurulu (`/opt/pw-browsers/chromium-1243`); Firefox ve WebKit yok. F5-4'ün kabulü bu yüzden Chromium'la sınırlıdır; Firefox ve Safari elle yapılan tarayıcı turunda denenir. U iletileri de `PeerGate.receive`'ten geçer (boyut, bayt kovası, şema, faz); farkı, `q` denetimi yerine `sq` kullanılmasıdır.

### 3.2 İleti biçimleri (PROTO 3)

```js
// h2c, U kanalı: konuk başına dilim (≤ 1 100 B). Hepsi isteğe bağlı listelerdir; bir tikte birden çok dilim gidebilir.
snap: { sq, ts,            // sq: konuk başına dilim sırası; ts: host game.playTime (ms, tamsayı)
        ak,                // bu konuğun host'ta işlenen son st.sq değeri (Faz 2 'ak')
        hk,                // bu konuğun son onaylanan gemi komutu cs (§3.8)
        tp,                // bu konuğun ışınlama sayacı (fix/teleport/biniş): değişirse alıcı yumuşatmaz
        p: [[n, x, y, z, yaw, anim, up, aq, flags, hp, mode, eq, sn, lx, ly, lz, tpn]],  // oyuncular (n: roster dizini; tpn: o oyuncunun tp sayacı)
        s: [[n, x, z, yaw, spd, vx, vz, yr, rud, sail, sailT, anchT, aSt, hp, water, flags]],
        e: [[n, x, y, z, yaw, anim, hp, flags]], a: [[n, x, y, z, yaw, st]], m: [[n, x, y, z, yaw, pitch, roll, blowN, splashN, flags]],
        b: {…bosses.net()}, f: [[n, x, y, z]], x: [[kind, x, y, z]], r: [st, x, z, yaw, rp, driver], c: [[n, x, y, z, st]], h: [[n, x, y, z, rx, rz]],
        w: {…worldEvents.netState()}, tm: [hour, wKey, wind, day, wet, forecast] }
// Nicemleme: konum dm tamsayı (K0–K1 oyuncu ve gemi cm), yaw 1/100 rad (gemi 1/1000), hız 1/10.

// h2c, R kanalı: varlık ilgi alanına girer ya da çıkar
ent: { a:'+', c:'e'|'a'|'m'|'s'|'f'|'c'|'h'|'w', n, id, ty, mh?, grp?, look?, name?, kind?, full? }  // full: gemi girişinde tam hasar durumu
ent: { a:'-', c, n, why:'far'|'dead'|'gone' }

// c2h, U kanalı (Faz 2 şeması + sq; PROTO 3'te helm.sail kalkar)
st:   { sq, s:{ ts, x,y,z, yaw, anim, up, aq, loop, mode, eq, torch, swimP, air, ship, lx, lz, ly, hp, down, carry, fl } }   // aq: eylem sayacı; fl: bit alanı (1 = dürbün açık)
helm: { sq, ship, rudder, back }          // yelken artık komutla gider (§3.8)
boatSt: { sq, x, z, yaw, sp, rp }

// R kanalı yeni türler (şema ve kova sınıfları §8.5)
ntf{ k, a?, x?, z? }  evt{ k, x, z, … }  tel{ n, k, dur }  bossFx{ k, … }  shipDmg{ id, … }
hb{ ts }  loaded{ }  bye{ code }  hostPause{ on }   // oturum (§5)
heirs repl replD vote claim stale handoff handoffAck  // devir (§6)
trade tradeSt dice diceSt                              // §4.7–4.8
```

- (inceleme düzeltmesi) **Birimler ve ek alan:** `ts`, host `playTime`'ının milisaniye cinsinden tamsayı değeridir; şema aralığı `I(0, 2^53)`'tür, çünkü `playTime` kayıtla birlikte birikir (`game.js:142`). Faz 2'nin `st.ts: F(0, 1e7)` alanı saniye cinsindendir ve öyle kalır; milisaniye olsaydı 2,8 saatte taşardı. Her dilime ayrıca `fc` eklenir: host'un **kırpılmamış** kare saati (ms; ham kare sürelerinin toplamı, `DK.sim`'de `dt` toplamı). Oynatma eşlemesi `fc` ile, sıralama ve geri sarma `ts` ile yapılır (§3.3). Oyun sırasında `hb` `ping`'in yerini alır: `hb{ts}` ↔ `hbA{ts}` RTT'yi de ölçer, `ping`/`pong` yalnız lobide kalır. İkisi birden gitseydi Faz 2'nin `session` kovası (1/sn) aşılırdı.
- **Kimlik eşlemesi:** Bir dilim, `ent+` iletisi henüz gelmemiş bir `n`'yi kullanabilir, çünkü U, R'den hızlıdır. Alıcı tanımadığı `n` verisini 1 sn bekletir; `ent+` gelmezse atar. `n` en az 30 sn yeniden kullanılmaz.
- **Silme kuralı değişir:** v0.4'teki "görüntüde yoksa sil" kuralı (`enemies.js:1658`, `animals.js:837`, `net.js:664`, `:672`) kaybolan U paketlerinde varlığı silerdi. Silme yalnız `ent−` ile yapılır. `ent−` gelmezse varlık 10 sn sonra soluklaşır, 20 sn sonra silinir (güvenlik ağı).
- **Kaynak zaman damgası:** Host, konuğun `st.ts` değerini o konuğun saat ofsetiyle (§3.3) kendi zamanına çevirir. `p` dizisi bu zamanla damgalanır; böylece konuk→host bacağının titreşimi diğer konuklara taşınmaz. Konuk saati hiçbir kurala girmez, yalnız çizimde kullanılır (Faz 2 P6 korunur). (inceleme düzeltmesi) Yeniden damgalanan zaman, geliş anına göre `[geliş − 0,5 sn, geliş]` aralığına kırpılır; böylece konuk sahte bir `ts` ile başkalarının çizimini bozamaz.
- **Konukta doğrulama:** Bütün yeni türler Faz 2 `schema.js` H2C kaydına girer: listeler sınırlıdır (`p ≤ 4`, `e ≤ 64` ve paket başına), sayılar `fin()`'den geçer, `n` ve `id` beyaz listedeki kalıba uymalıdır.

### 3.3 Kare saati ve zaman damgası

- **Gönderici:** `ts = Math.round(game.playTime * 1000)` (Faz 3: benzetim saati). Dilim üretimi `frameDt` biriktiricisiyle yapılır, yani adımdan bağımsızdır (Faz 3 §2.4).
- **Alıcı:** Her dilimde `d = frameClock − ts/1000` hesaplanır. Son 5 sn'nin en küçük `d` değeri `dMin`'dir (en hızlı gelen paket). `hostNow = frameClock − dMin`. Faz 3'ün EMA önerisi yerine pencere minimumu seçildi: tıkanmadan sonra toplu gelen geç paketler eşlemeyi bozmaz. (inceleme düzeltmesi) Bu eşlemede `ts` yerine `fc` kullanılır ve `frameClock` yerine alıcının ham kare saati alınır; pencere 2 sn'dir (aşağıya bakın).
- **Sıçrama:** `dMin` 0,5 sn'den fazla değişirse (sekme dönüşü, uzun takılma) doğrudan atanır ve `pc` yeniden kurulur.
- **Testlerde:** `DK.sim` hem `playTime`'ı hem `frameClock`'u ilerletir. Bu yüzden eşleme makine hızından bağımsızdır (Faz 3 K9 gerekçesi).
- (inceleme düzeltmesi) **Saat hızı farkı:** Node modelleri (`interp_sim3.mjs`) gönderici ve alıcı saatlerini eşit hızda varsayar. Gerçekte host `playTime`'ı iki durumda gerçek zamandan geri kalır: < 10 FPS'te (Faz 3 `MAX_SUB` 6 × 1/60) ve 0,1 sn'yi aşan her karede (ada kurulumu, çöp toplama; `engine.js:62`, Faz 3 `stats.kirpilan`). 5 sn'lik pencere minimumu bu kaymayı ancak pencere boyunca izler. Örneğin host saati 0,8× akarsa `hostNow` en yeni örneğin yaklaşık 1 sn önüne geçer ve oynatma sürekli `Emax` sınırında bekler. Sıçrama kuralı tetiklenmez, çünkü `dMin` yavaş değişir. Nihai çözüm: eşleme host'un ham kare saatiyle (`fc`) yapılır ve alıcıda da ham kare saati kullanılır. Bunun için Faz 3 `frameClock`'unun kırpılmamış bir eşi tutulur (`game.update(dt, rawDt)`; `engine.js:61-62`'de kırpmadan önceki `dt`). Pencere 2 sn'dir. Bu, Faz 3 K9'un "duvar saati değil kare saati" ilkesini korur, çünkü `DK.sim` iki saati de aynı `dt` ile ilerletir. `interp_buffer.mjs` 0,8× host hızını ve 0,3 sn'lik host takılmasını da sınar.

### 3.4 Ara bellek (NetInterp)

`js/net/interp.js`, varlık başına:

```js
class NetInterp {                       // buf: [[ts, durum]] ≤ 1,5 sn; pc: oynatma saati (host zamanı, sn)
  push(ts, st)                          // sq/ts sıralı ekleme; aynı ts atılır
  sample(hostNow, frameDt) {
    D ← yumuşak(clamp(aralık·1,05 + p95(d − dMin) + 0,01, Dmin, 0,35))   // artışta hızlı (0,2), azalışta yavaş (0,02)
    hedef ← hostNow − D;  en ← buf.son.ts;  amaç ← min(hedef, en + Emax)
    if (en − pc > 3) pc ← hedef                                          // çok uzun kopma: açık atlama (0,15 sn solma)
    else pc += frameDt · clamp(1 + (amaç − pc)·2, 0,5, 2)                 // zaman bükme
    pc ← min(pc, en + Emax)                                              // dış değerleme sınırı: ötesinde bekle
    s ← doğrusal ara değer (açılar lerpAngle) ya da en son hızla dış değerleme
    ofset: önceki çizilen → s sıçraması > 2·v·dt ise fark ofsete alınır, τ = 0,15 sn ile söner
    return s + ofset
  }
  teleport()                            // tp sayacı değişince: buf temizlenir, pc ← hedef, ofset 0
}
```

| Varlık | `Dmin` | `Emax` | Not |
|---|---|---|---|
| Oyuncu (K0–K1) | 0,10 | 0,25 | Hız tampondan türetilir; düşman nişanı için host'ta `r.vel` (`enemies.js:1060`) |
| Gemi | 0,12 | 0,35 | Yaw + `yawRate` ile dış değerleme; güvertedeki oyuncular gemiye göre konumlanır |
| Düşman, hayvan | 0,10 (K0) – 0,35 (K2) | 0,25 | Ragdoll'da örnekleme durur |
| Deniz devi, boss | 0,15 | 0,4 | Boss `netExtra` alanları son değerden alınır |
| Yüzen nesne, sandık | 0,35 | 0,5 | Yavaş nesneler |
| K3–K4 | 0,6 | 0,6 | 1 Hz ve 0,5 Hz akış |

**Node sonuçları** (`/tmp/tasarim_y/interp_sim3.mjs`; 7 m/sn koşu, 60 FPS; normal kare adımı 0,117 m):

| Senaryo | v0.4: en büyük kare adımı (oran) | Öneri, R kanalı | Öneri, U kanalı |
|---|---|---|---|
| Tıkanma 0,6 sn | 0,97 m (8,3×) | 0,18 m (1,6×) | 0,19 m (1,7×) |
| Tıkanma 1,2 sn | 8,87 m (76×), 1 ışınlanma | 0,233 m (2×), 0 | 0,233 m (2×), 0 |
| Tıkanma 1,5 sn | 10,73 m (92×) | 0,233 m (2×) | 0,233 m (2×) |
| Tıkanma 2,0 sn | 14,47 m (124×) | 0,233 m (2×) | 0,233 m (2×) |
| Tıkanma 4,0 sn | 28,5 m (244×) | Bilinçli atlama (solmalı) | Bilinçli atlama |
| %5 kayıp, 30 ms titreşim, 120 ms gecikme | 0,50 m (4,2×) | 0,12 m (1,0×) | 0,117 m (1,0×) |
| %15 kayıp, 60 ms titreşim | 0,51 m (4,4×) | 0,41 m (3,5×) | 0,28 m (2,4×) |
| %30 kayıp, 60 ms titreşim | 0,53 m (4,5×) | 0,13 m (1,1×) | 0,13 m (1,1×) |
| Zikzak, %5 kayıp | 0,81 m (6,9×) | — | 0,115 m (1,0×) |
| Zikzak + 1,5 sn tıkanma | — | — | 0,29 m (2,5×) |

Bedel olarak ortalama çizim gecikmesi artar: kayıpsız durumda 137 ms; 120 ms tek yön gecikmede 217–264 ms, bu gecikmenin kendisini de içerir. v0.4'ün üstel yumuşatması da yaklaşık 70–100 ms geriden izliyordu (Faz 3 §5.3). E-08'in kabul ölçütü ("kare başına en çok 2×; 1,5 sn tıkanmada ışınlanma yok") U kanalında ve %5 kayıpta karşılanır. %15 kayıp ve 60 ms titreşimde oran 2,4×'tür.

(inceleme düzeltmesi) Aynı koşunun "gerçeğe en büyük uzaklık" sütunu tabloya alınmamıştı. 1,5 sn tıkanmada bu değer öneride 9,6–9,8 m, v0.4'te 11,3 m; 2 sn tıkanmada 13,1 m ve 14,8 m'dir. Işınlanmanın kalkması bilginin daha erken gelmesini sağlamaz: avatar tıkanmadan sonra yaklaşık 1,5 sn eski konumları 2× hızla oynatarak yetişir. Bu sürede K5-8 geri sarma penceresi (0,25 sn) yetmez ve konuğun o anki yakın dövüş vuruşları ıskalanabilir.

### 3.5 İlgi alanı (`js/net/aoi.js`)

**Odak noktaları:** Konuğun `posOf(pid)` değeri; gemideyse ayrıca geminin konumu; dürbün açıksa (`st.fl` biti) bakış doğrultusunda 1 500 m'ye kadar yalnız oyuncu ve gemi.

(inceleme düzeltmesi) `st` iletisinde bakış yönü yoktur; `yaw` gövdenin yönüdür (`player.js:988`). Dürbün odağı için `st.s` iletisine `lk` alanı (kamera yaw'ı, yalnız `fl&1` iken) eklenir. v0.4'te konuk dürbünle 250 m ötesindeki düşman ve hayvanları da görüyordu, çünkü tam liste gidiyordu; K2 sınırı bunu kaldırır. Bu yüzden dürbün açıkken ±8°'lik bir koni içinde 1 500 m'ye kadar düşman, hayvan ve deniz devi de 1 Hz ile gönderilir.

| Katman | Uzaklık | Oyuncu / gemi | Düşman | Hayvan | Deniz devi / boss | Diğer |
|---|---|---|---|---|---|---|
| K0 | ≤ 40 m | 15 Hz | 15 Hz | 7,5 Hz | 7,5 / 15 Hz | Sandık 7,5, yüzen nesne 3, kaya 7,5 Hz |
| K1 | ≤ 80 m | 7,5 | 7,5 | 7,5 | 7,5 / 15 | Aynı |
| K2 | ≤ 250 m | 3 | 3 | 3 | 3 / 15 (≤ 300 m) | Yüzen nesne ≤ 400 m 3 Hz |
| K3 | ≤ 1 000 m | 1 | — | — | 1 (deniz devi ≤ 600 m) | Buzdağı, hortum ≤ 1 500 m 1 Hz |
| K4 | Ötesi | 0,5 | — | — | — | — |

- **Her zaman ilgili:** konuğun bindiği gemi (15 Hz), taşıdığı sandık, onu hedefleyen düşman (`target.id === pid`), etkin boss savaşı (konuk 300 m içindeyse), kayık (sürücüsüyse).
- **Histerezis:** Katmana `r` ile girilir, `r × 1,15` ile çıkılır. İlgi alanı dışına çıkan varlık için `ent−{why:'far'}` gönderilir.
- **Öncelik biriktirici:** Her (konuk, varlık) çifti için `acc += hz × dt` hesaplanır. Her tikte `acc ≥ 1` olan varlıklar büyükten küçüğe dilime eklenir. Dilim 1 100 B'ı doldurunca yenisi açılır. Konuk başına tik bütçesi `cap/tikHz`'dir (varsayılan tavan 96 kbit/sn = 12 KB/sn). Bütçe aşılırsa kalan varlıklar sonraki tike kalır ve `acc` birikmeye devam eder. Böylece en kötü durumda oranlar orantılı düşer, ama hiçbir varlık aç kalmaz.
- **Olay iletilerinde ilgi alanı:** Seyrek ve durum taşıyan olaylar küreseldir: sandık, kese ve yüzen nesnenin doğması ya da kalkması, `story`, `marker`, `weather`, `featSt`. Bunlar hem harita için gerekir hem de ilgi alanına sonradan giren konukta tutarlılık sağlar. Sık ve yalnız görsel olaylar süzülür: `cannon` ≤ 800 m, `hazard` görselleri ≤ 300 m, `evt`/`ntf` türüne göre, `tel` ≤ 80 m, `shipDmg` yalnız ilgi alanındaki gemi için.

### 3.6 Parça bölme

| İleti | Kanal | Parça | Toplam sınır | Akış |
|---|---|---|---|---|
| `worldPart` (Faz 2) | R | ≤ 16 000 B | 512 KB | Katılımda, yeniden bağlanmada, `loaded` sonrası yeniden eşitlemede |
| `repl` (replika, §6.3) | R | ≤ 16 000 B; `deflate-raw` + base64 | 512 KB sıkıştırılmış | Konuk başına en çok 64 kbit/sn, yani 16 000 B'lık parça en çok 2 sn'de bir (inceleme düzeltmesi: ilk taslaktaki "50 ms'de 1 parça" 2,5 Mbit/sn ederdi ve 64 kbit/sn ile çelişiyordu); dilimler ve olaylar araya girer |
| `snap` | U | ≤ 1 100 B | — | §3.5 |

Parçalar tek tek doğrulanır. Birleştirilmiş içerik Faz 4 `saveSchema.validate` ile Faz 2 H2C şemasından geçer. Eksik parça 10 sn içinde tamamlanmazsa konuk `sync{what:'world'}` ister (Faz 2).

### 3.7 Bant genişliği bütçesi

`/tmp/tasarim_y/bw_budget2.mjs`. v0.4 biçimleri kaynak koddan alındı; öneri §3.2 ve §3.5'e göredir. R olay akışı için konuk başına sabit 600 B/sn payı eklendi.

| Senaryo | v0.4 paket (hafif / tam) | v0.4 konuk başına | v0.4 host çıkışı (3 konuk) | Öneri konuk başına | Öneri host çıkışı | En büyük dilim |
|---|---|---|---|---|---|---|
| S1 liman, 4 oyuncu bir arada | 1 318 / 3 055 B | 262 kbit/sn | 787 kbit/sn | 53–60 kbit/sn | 168 kbit/sn | 451 B |
| S2 üç adaya dağılmış | 1 447 / 9 192 B | 638 | 1 915 | 61–84 | 228 | 698 B |
| S3 deniz savaşı | 2 297 / 3 265 B | 334 | 1 001 | 48–55 | 151 | 293 B |
| S4 kalabalık kamp (30 düşman, 50 hayvan) | 2 559 / 8 427 B | 659 | 1 977 | 131–143 | 416 (tavanla 288) | 1 181 B (bölünür) |

- **Hedefler:** Konuk başına ortalama ≤ 64 kbit/sn, tavan 96 kbit/sn. 4 oyunculu oturumda host çıkışı ≤ 300 kbit/sn (E-09 kabulü). c2h `st` 15 Hz × yaklaşık 200 B ≈ 24 kbit/sn olur.
- **Replika:** Varis başına ≈ 1 KB/sn (tipik 30–70 KB ham, 4–6 kat sıkıştırma, 20 sn'de bir; §6.3).
- **[BELİRSİZ]** Değerler modeldir. F5-5'te `DK.net.diag.bytes` ile S1–S4 benzeri sahnelerde ölçülür; sabitler (`cap`, Hz) Ek B'de tek yerdedir.

### 3.8 Gemi kumandası: tahmin ve uzlaştırma (E-10)

**F5-7A — komut onayı (zorunlu):**

1. Boşluk (`toggleSails`, `player.js:912`), W/S (`adjustSail`, `:911`) ve çapa konukta yerel olarak hemen uygulanır (görsel tepki). Ardından R'den `shipCmd{cmd:'sails', v, cs}` gider. `cs` geminin komut sırasıdır. W/S basılı tutulurken komut en çok 3 Hz'de gönderilir (Faz 2 §7.4'teki `sails` için 0,3 sn bekleme kuralına uyar).
2. Konuk `pending = {cs, v}` tutar. `snap.s` içindeki `hk` değeri `cs`'ye ulaşana kadar görüntüdeki `sailTarget` ve `anchorState` yok sayılır (`ship.applyNet`'in v0.4'teki ezen satırı `ship.js:714`). 1,5 sn'de onay gelmezse komut aynı `cs` ile bir kez yeniden gönderilir. (inceleme düzeltmesi) `hk` "son onaylanan" değil, **son işlenen** `cs`'dir. Host komutu Faz 2 §7.4'teki bekleme (≥ 0,3 sn), istasyon yakınlığı ya da kilit denetimiyle reddetse de `hk` ilerler; ret konuğa `shipCmdR{cs, why}` ile bildirilir. İlk tanımda reddedilen son komutun beklemesi hiç kapanmazdı ve konuk görüntüdeki `sailTarget`'ı kalıcı olarak yok sayardı. Bekleyen komut iki yeniden denemeden (3 sn) sonra bırakılır ve host'un değeri esas alınır.
3. `helm` (U, 15 Hz) yalnız `rudder` ve `back` taşır.
4. Dümen sıfırlama: `leaveStation` dümeni yerelde sıfırlıyor (`shipControl.js:194-200`). Host ayrıca kilit bırakıldığında (`lock{on:false}`), otomatik bırakmada (Faz 2 §7.2), hayalet yuvaya geçişte ve `_dropPeer`'da `setRudder(0)` ve `backing=false` uygular.

Node (`/tmp/tasarim_y/helm_ack_sim.mjs`): Tek yön 10–150 ms gecikmede tek ve üç basışın **%100**'ü hem host'ta hem konukta doğru sonuçlanır. Denetimin v0.4 ölçümü %37–50'ydi; benim modelim konuk görüntüsünü de saydığı için v0.4'e %0–33 verdi. (inceleme düzeltmesi) Model bütün komutların kabul edildiğini ve hiç kaybolmadığını varsayar. Kalıcı test `helm_ack.mjs` ret ve kayıp durumlarını da içerir.

**F5-7B — dümendeki konuk için yerel tahmin (bayraklı, K5-7):**

- Konuk dümendeyken gemisi `predicted` kipine geçer: `Ship.update(dt)` konukta aynı fizik koduyla koşar (`game.js:229-230`'daki `clientUpdate` dalı yerine). (inceleme düzeltmesi) İlk taslağın "rüzgâr (`sky.windDir`) ve dalga zamanı zaten eşittir" varsayımı yanlıştır. `ocean.time` her istemcide sayfa açılışından beri yerel olarak artar (`ocean.js:271`) ve gemi fiziğine girer (`ship.js:362`, `:537`, `:591`). Esinti `performance.now()`'dan türetilir (`sky.js:257`); Faz 3'te `playTime`'dan türetilecek, ama konukta `playTime` 0'dan başlar. `windDir` hedefine 20 sn zaman sabitiyle yaklaşır (`sky.js:256`). Tahmin için konukta `ocean.time` ve esinti saati host saatinden türetilir; `snap.tm`'e `ot` (okyanus saati), `wd` (`windDir`) ve `ws` (esinti fazı) eklenir. Engeller konusunda da varsayım tutmuyor: arazi yüksekliği, karo yoksa analitik `computeHeight`'a düşer (`terrain.js:422-441`) ve iki tarafta eşittir. Ada kaya engelleri (`Ship.obstacles`) ise yalnız adayı kuran istemcide vardır (`islands.js:1074`), ve host adaları yalnız kendi oyuncusunun çevresinde kurar (`islands.js:273`; Faz 2 nihai belge bunu kaydeder). Host uzaktayken gemi host'ta kayaların içinden geçer, konuğun tahmini ise çarpışır. Bu yüzden F5-7B yalnız host ile dümendeki konuk aynı adanın kurulum uzaklığı içindeyken (`BUILD_D` 750 m) açıktır; aksi hâlde F5-7A uygulanır.
- Girdi kaydı: `[seq, rudder, back, sailT]`, adım başına (1/60).
- **Uzlaştırma:** `snap.s` geldiğinde host durumu `ts` anına aittir ve `ak` alanı o ana kadar işlenen girdiyi gösterir. Konuk durumu host durumuna kurar ve `ak`'dan sonraki girdileri yeniden oynatır. 120 ms RTT'de bu yaklaşık 8 adım eder; bir `Ship.update` yaklaşık 0,05 ms sürer **[BELİRSİZ]**. Yeniden oynatılan konum ile gösterilen konum arasındaki hata için kural: < 0,3 m ise yok sayılır; < 6 m ise görsel ofsete alınıp 0,3 sn'de söndürülür; ≥ 6 m ise atlanır (`tp`).
- Güvertedeki diğer konuklar gemiyi NetInterp ile görür. Her konuk kendi görüşünü çizer; konum doğrulaması gemi yerel koordinatında yapıldığı için (Faz 2 §7.1) zaman farkı denetimi bozmaz.
- **Kabul (06u):** `--netem lat=120` ile dönüş sırasında tahmin hatası ≤ 1,5 m; düzeltmede kare sıçraması ≤ 0,5 m. Ölçüm tutmazsa bayrak kapalı kalır, F5-7A yine de E-10'u kapatır.

### 3.9 Konuğun kendi oyuncusu ve geri sarma altyapısı

- Konuğun hareketi yerelde benzetilir. Host `r.auth` ile doğrular, gerekirse `fix` gönderir (Faz 2 §8). Bu, oyuncu için zaten tahmin ve uzlaştırmadır. Faz 5 yalnız `fix` ve `teleport` geldiğinde `tp` sayacını artırır; uzak görünümde atlama yumuşatılmaz.
- **Geri sarma altyapısı (K5-8):** Host, düşman, hayvan, deniz devi ve boss için 15 Hz'de 0,5 sn'lik konum halkası (`hist`) tutar. Konuğun `act` iletisi `vt` alanını taşır: girdi anındaki `pc`, yani konuğun gördüğü host zamanı. Özellik açıkken `hostCombat` isabeti `max(vt, şimdi − 0,25)` anındaki konumlarla sınar. Varsayılan kapalıdır; Faz 2 U-6 ölçümüne göre açılır.

### 3.10 Host sekmesi arka planda (E-07, K5-9)

- `visibilitychange` olayında host `hostPause{on}` yayınlar. Konukta "Kaptan uzakta (sekme arka planda)" göstergesi 2 sn içinde çıkar.
- **Worker saati:** Gizli sekmede `engine` 100 ms'lik bir Worker zamanlayıcısına geçer. Kaynak bir `blob:` URL'sidir: `setInterval(()=>postMessage(0),100)`. Her mesajda çizim yapılmadan `game.update(0.1)` ve `net.update(0.1)` çalışır (0,1 sn); dilimler 10 Hz akar. Faz 3'ün `Timer.connect(document)` kuralı yalnız görünür kareler için geçerlidir.
- **Sınırlar:** iOS Safari gizli sekmeyi dondurur; Worker yardım etmez. O durumda ICE en geç yaklaşık 30 sn'de kopar ve devir ya da bekleme akışı başlar (§5.2, §6). CSP'de `worker-src blob:` gerekir (Faz 2 §9.5 ile eşgüdüm) **[BELİRSİZ]**. (inceleme düzeltmesi) Oturum saatleri (§5.2) zaten `setInterval` ile koşar; bu yüzden host gizliyken de kopma algılama ve `hb` sürer, Worker yalnız benzetim içindir. Gizli sekmede Worker'dan ana iş parçacığına gelen iletilerin kısılmaması Chromium'da beklenir, Firefox ve Safari'de bilinmiyor **[BELİRSİZ]**. 06r R6 gerçek kısmayı değil, yalnız kod yolunu sınar: Playwright'ta sekme gerçekten arka plana alınamaz.

---

## 4. Eksik on madde

Ortak altyapı:

- **Olay bağlamı rotasyonu:** `events.update`'teki zamanlayıcı (`events.js:89-98`) her tetiklemede bağlam oyuncusunu seçer. Ağırlık `1 + (o oyuncunun yakınında son olaydan bu yana geçen süre)/120 sn`'dir; olayın en az 600 m yakınında başka bir oyuncu olması +0,5 ekler. `events._classic(r, ctxPlayer)` (`:122-156`) ve `worldEvents.context(player)` (`worldEvents.js:78-85`) sabit `G.player` yerine bu oyuncuyu alır. Konum ve gemi bilgisi host'taki `posOf(pid)` ve geminin konumundan gelir.
- (inceleme düzeltmesi) **Host'taki ömür kuralları:** Rotasyon yalnız olayın doğduğu bağlamı değil, host'taki ömür ve silme kurallarını da kapsar. `worldEvents.update` buzdağını host oyuncusuna 1 400 m uzaklıkta siler (`worldEvents.js:368`), planktonu host gemisine göre üretir (`:385-386`), gök taşı sarsıntısını host'a göre verir (`:221`). Bu kurallar `nearestPlayer(x, z)` (host + `posOf`) ile yeniden yazılır. Aksi hâlde uzak konuğun yanında doğan buzdağı host'ta ilk karede silinir.
- **`ntf{k, a, x, z}`:** Bildirim kodu ve argümanlar. Metin, konuktaki sabit tablodan üretilir (Faz 2 B-18 ve XSS ilkesi: serbest metin yok). Olayın türüne göre bir yarıçap içindeki oyunculara gider. Host kendi bildirimini aynı tablodan gösterir.
- **Ödül:** Toplayan `pid`'in `gbook` profiline yazılır (Faz 2 §6.6). XP `awardXp` ile verilir.

### 4.1 Yüzen varil

| | |
|---|---|
| Şu an | Host doğurur ve `floatSpawn` yayınlar (`events.js:193`). Konuk 6 m doğrulamalı `floatReq` ile toplar (`net.js:324`, `events.js:232-236`; NaN'a açık). İçerik `netGive` ile gider. Olay yalnız host çevresinde çıkar (`:124`); gözcü bildirimi yalnız host'ta görünür (`:136`); geç katılımda görünmez (E-05). |
| Hedef | Bağlam rotasyonu; `ntf{k:'gozcu_varil', x, z}` (≤ 600 m). Varil tablosu (`events.js:207-212`) host'ta toplayana göre atılır, sonuç profile yazılır, taşan kısım host'ta kese olur. Geç katılım ve yeniden bağlanmada `worldPart.floats` gönderilir (tür dahil). `applyFloats` tanımadığı kimliği türüyle kurar. Konukta konum NetInterp'ten (`snap.f`) gelir. |
| İleti | `floatSpawn{id,kind,x,z}` (R, küresel), `snap.f` (U, 3 Hz, 400 m), c2h `floatReq` (Faz 2: `within`), `ntf`, `inv` |
| Test | 06t T1, T8 |

### 4.2 Şişede mesaj

| | |
|---|---|
| Şu an | Çekirdek akış geçiyor (06b B08/H08). Bildirim yalnız host'ta (`events.js:140`); geç katılım yok. |
| Hedef | Bildirim `ntf{k:'sise'}`. Okuma `item{use}` (Faz 2 §6.3) ile yapılır: haritayı host üretir (`treasure.randomSite`; konuğun profilindeki siteler dışlanır). Kazı Faz 2 `dig{}` ile: profil haritası → `hole` → `chestSpawn` → `chestReq{open}`. Uçtan uca konuk testi eklenir. |
| Test | 06t T2 |

### 4.3 Kazazede

| | |
|---|---|
| Şu an | Konuk kurtarınca host harita ve 50 altın gönderir. Site host'un envanterine göre seçilir (`events.js:227`, `treasure.js:131-137`). Konuğa diyalog gitmez. |
| Hedef | `randomSite(exclude = profil haritaları ∪ etkin hikâye siteleri)` kullanılır. 50 altın toplayana gider ve paylaşılmaz (Faz 2 §4.9). Toplayana `ntf{k:'kazazede'}` (diyalog metni tablodan), diğerlerine `ntf{k:'kazazede_kurtarildi', a:[ad]}` (≤ 600 m) gider. |
| Test | 06t T3 |

### 4.4 Gök taşı

| | |
|---|---|
| Şu an | Düşüş görseli `we.met` ile gidiyor (`worldEvents.js:312-320`, `:344-351`). Parçayı yalnız host doğuruyor (`:223`). Konuk alınca `rareFind` ve 80 XP almıyor (`events.js:219`). Olay host'un gece ve sakin hava bağlamında çıkıyor. |
| Hedef | Bağlam rotasyonu: gece ve sakin hava, seçilen oyuncunun bölgesinde değerlendirilir. Düşüş anında `evt{k:'meteor', from, to, t0}` (R, küresel) gider; konuk görseli `ts`'e göre aynı fazda oynatır. Parça `floatSpawn{kind:'meteor'}` ile doğar. Toplayana `gok_tasi` ve `awardXp(pid, 80, 'rare')` verilir; düşüş bildirimi `ntf{k:'meteor'}` (≤ 2 km). |
| Test | 06t T4 |

### 4.5 Diğer dinamik olay nesneleri

| Olay | Şu an | Hedef |
|---|---|---|
| Yüzen sandık, fırtına enkazı | `floatSpawn` var. Kayıktan ya da güverteden sandık alınamıyor; yüzerek alınıyor (`events.js:33`). | Değişmez. Bildirim `ntf`. Toplama Faz 2 `floatReq` → `carryOk`. |
| Hayalet ışıklar | Yalnız host ilerletiyor ve tamamlıyor (`worldEvents.js:163-190`; konukta `W.remote` erken dönüyor, `:178`) | Host'ta en yakın oyuncunun (`posOf`) konumuyla ilerler (`_updateWisps(dt, me = enYakın)`). Tamamlama: herhangi bir oyuncu 30 m içinde. Sandık `floatSpawn`; `rareFind` XP'si tamamlayana gider. |
| Düşman gemisi | Ele geçirme altını ve XP yalnız host'a gidiyor (`events.js:301-316`, `progress.js:82-83`) | Katılımcılar: ele geçirme ve batma anında düşman gemisine ≤ 150 m olan oyuncular. Altın `earnShared` ile paylaşılır (Faz 2 §4.9). XP K5-2'ye göre verilir. Enkaz varilleri `floatSpawn` ile doğar. |
| Gülle ve lav bombası patlaması | Yalnız yerel oyuncuya hasar veriyor (`combat.js:52-53`; E-18) | Host patlamada `posOf` ile gölge canlara hasar uygular ve `hurt` gönderir (Faz 2 `hostCombat`). Volkan bombaları host'ta benzetilir; konukta görsel kalır. |
| Buzdağı | Ev sahibinden 1 400 m uzaktaki konukta saniyede yaklaşık 7 kez kurulup siliniyor (`worldEvents.js:368`; E-21) | `ent±` ile yönetilir: `remote` buzdağı konukta uzaklıkla silinmez. İlgi alanı 1 500 m. `Ship.obstacles` yalnız `ent±`'da değişir. |
| Volkan, plankton | Görsel senkron | `snap.w` 1 Hz; `ntf{k:'volkan'}` ≤ 2 km |
| Kuşlar | Konukta hiçbir şey üretmiyor (`events.js:154`) | (inceleme düzeltmesi) v0.4'te bu olay host'ta da yalnız bir bildirimdir (`events.js:153-154`); görsel sürü ya da balık etkisi yoktur. Eşitlik için `ntf{k:'kuslar', x, z}` (≤ 600 m) yeter. Görsel sürü ayrı bir içerik işidir (isteğe bağlı). İlk taslaktaki "konuk sürüyü yerelde oynatır" ifadesi var olmayan bir görseli varsayıyordu. |
| Fırtına | `weather` yayını | `ntf{k:'firtina'}` küresel |

**Test:** 06t T5–T7, T9–T10.

### 4.6 Konuk korsan rütbesinin kalıcı ilerlemesi

| | |
|---|---|
| Şu an | `dksh.guest.0` ve `dksh.progress.guest` konukta tutuluyor. Periyodik kayıt yok (`game.js:218`). Duraklatma menüsünde konuk için Kaydet yok (`menu.js:348`). Eski yuva kaydı daha yeni anahtarın önüne geçiyor (`progress.js:95-99`; E-15). Co-op testinde ölçülmedi. |
| Faz 2 / 4'ün getirdiği | Yetkili rütbe host'un `dksh.gbook.<worldId>` deposundadır (`prof`, `awardXp`). Konukta yalnız `wcache` tutulur (120 sn ve olay tetikli). Eski kayıt salt okunur ithalat kaynağıdır. |
| Faz 5'in payı | (1) **Uçtan uca doğrulama** (06w): XP → seviye → host kaydı (olay tetikli, ≤ 2 sn) → host sayfası yeniden yüklenir → konuk aynı profille döner. Konuk sekmesi `beforeunload` olmadan kapanır ve yeniden katılır; seviye ve yetenekler korunur. (2) **Görünürlük:** roster kaydına `lvl` ve `rank` eklenir (host profilden yazar); lobide ve takım listesinde (`hud.js:467`) gösterilir. (3) **Korsan Kodu** (Faz 4 S-b, K5-11): duraklatma menüsünde "Korsan Kodumu göster/al" seçeneği. Kod `DKSH1.<base64url(JSON{f:'dksh-profil', v:1, w, room, g, k, at})>.<fnv32>` (inceleme düzeltmesi: Faz 4 §8.5 S-b biçimiyle birebir) biçimindedir; başka cihazda içe aktarılır. Aynı `gid` iki bağlantıda açılırsa eskisi `kick{code:'replaced'}` alır (Faz 2). Arayüz uyarır: "Bu kodu bilen, bu dünyada senin karakterinle girer." (4) **Devirde koruma:** profiller replikayla taşınır (§6.3, §6.6). (inceleme düzeltmesi) Roster kaydına `lvl` ve `rank` eklemek Faz 2 roster beyaz listesini (`{id, name, color, ready, host, app}`) değiştirir; bu nedenle PROTO 3'e girer. |
| Test | 06w W1–W4; 06x/06y'de devir sonrası profil eşitliği |

### 4.7 Ortak zar oyunu ("Tayfa Masası")

**Kurallar** (tek oyunculu Korsan Zarı'nın çok oyunculu biçimi; `dice.js:6-8` ruhu korunur):

1. Masa zarcı NPC'nin yanında kurulur (≤ 4 m). Kuran oyuncu bahsi seçer: 10, 25, 50 ya da 100 altın. Masa 2–4 kişiliktir.
2. Oyuncu masaya katılır (≤ 6 m; altını ≥ bahis olmalı) ve "Hazırım" der. Oturan ve hazır olan en az iki oyuncu varsa 3 sn sayılır.
3. Her oyuncu iki zar atar. **6-6 (Kara Bayrak)** herkesi yener (puan 13). **1-1 (Yılan Gözü)** eler (puan −1). Diğerlerinde toplam alınır.
4. En yüksek puan potu alır. Tepede eşitlik varsa yalnız eşit olanlar yeniden atar, en çok 3 kez. Yine eşitse pot bölünür; kalan altın oturma sırasına göre ilk oyuncuya gider.
5. Kara Bayrak'la kazanan oyuncuya zarcı günlük kesesinden (400, her gün yenilenir; `dice.js:13`, `:18`; inceleme düzeltmesi: 400 değeri 18. satırda) 1 bahis ek öder (K5-5). Meyhane payı %0'dır.

**Host otoritesi ve atomiklik (emanet yok):**

```
diceRound(T):                                    // tek fonksiyon, arada await yok
  oyuncular ← T.seats.filter(oturuyor, 'game' fazında, ayakta, within(posOf, T.pos, 8), altın ≥ bahis)   // host için yerel envanter
  if (oyuncular.length < 2) return iptal('az')                      // hiç altın oynamaz
  plan: her oyuncu −bahis; pot ← n·bahis; zarlar ← host RNG (crypto.getRandomValues);
        eşitlik turları; kazanan(lar) +pay; Kara Bayrak bonusu (kese ≥ bahis ise)
  uygula: profiller (gbook) ve host envanteri; defter kayıtları {k:'zar', src:'zar:<T.id>:<tur>'}; T.tur++
  yayın: diceSt{m, tur, zarlar:[[n,a1,a2]], tb:[[…]], kazanan:[n], pot, bonus} + her oyuncuya gold{g,d,r:'dice'}
```

- Bahis yalnız atış anında, aynı fonksiyon içinde düşülür. Kopma, sekmenin kapanması ya da host devri yarım kalmış bir emanet bırakamaz. Bu, denetimin "emanet + iade" önerisinden daha sağlamdır.
- Konuk animasyonu sonucu 1,2 sn boyunca oynatır; sonuç zaten uygulanmıştır.
- **Sınırlar:** Masa başına 5 sn'de 1 tur; konuk başına saatte en çok 120 el (Faz 2 `svc dice` ile aynı). Zar XP'si (5) saatte en çok 12 kez verilir; bu, arkadaşlar arasında karşılıklı XP çiftçiliğini sınırlar.
- **Şeffaflık (isteğe bağlı):** Masa açılırken `h = SHA-256(tohum)` yayınlanır. Turdan sonra tohum açıklanır; zarlar `HMAC(tohum, tur|n)`'den türetilir ve konuk doğrular. Host yine de hile yapabilir (Faz 2 §1.5), ama bahisler belli olduktan sonra tohumu değiştiremez. (inceleme düzeltmesi) Tohum taahhüdü host'un tohumu sonradan değiştirmesini engeller, ama sonucu önceden bilmesini engellemez: host oyuncu olarak masadaysa, geri sayımda kalkıp kalkmamaya sonucu bilerek karar verebilir. Bu yüzden zarlar `HMAC(tohum, tur | n | nonce'lar)`'dan türetilir. Oturan her oyuncu "Hazırım" ile birlikte rastgele bir `nonce` gönderir. Geri sayım başlayınca koltuklar kilitlenir: geri sayımda kalkan oyuncunun bahsi pota düşer.
- **İletiler:** c2h `dice{q, a:'open'|'join'|'leave'|'ready', m?, bet?, npc?}` (sınıf `interact`). h2c `diceSt{m, st:'bekliyor'|'sayim'|'sonuc'|'kapandi', seats:[{n, ready}], bet, tur, …}`. NPC'ye karşı tek kişilik oyun Faz 2 `tx{svc, k:'dice'}` olarak kalır.
- **Arayüz:** `js/ui/dice.js`'e "Tayfa masası" sekmesi eklenir: koltuklar, hazır düğmeleri, aynı SVG zarlar, sonuç tablosu.
- **Test:** 06v V6–V8; Node `dice_table.mjs` (dağılım, korunum, eşitlik turları, eksik altın).

### 4.8 Oyuncular arası ticaret

**Akış** (iki taraflı onay, host defterinde atomik takas):

```
A: trade{a:'ask', to:B}  → host: ikisi de 'game' fazında, ayakta, within(posOf A, posOf B, 6) → B'ye tradeSt{st:'davet', from:A} (20 sn)
B: trade{a:'reply', id, ok:true} → host: oturum T{id, a, b, oa:{it:[], g:0}, ob:{…}, rev:0, kilitA, kilitB, onayA, onayB}
X: trade{a:'offer', id, it:[[sid,n]] ≤ 20, g} → host: her sid X'in profilinde; n ≤ yığın; bağlı (b) değil; nosell/görev eşyası değil;
                                                    g ≤ altın (bağlı altın hariç, K5-6) → teklif değişir, rev++, kilit ve onaylar sıfırlanır
X: trade{a:'lock', id, rev}   → rev güncelse kilitX=true. İki taraf da kilitliyken teklif değiştirilemez (önce kilit açılmalı → rev++)
X: trade{a:'confirm', id, rev} → iki kilit de varsa ve rev güncelse onayX=true. İki onay → takas()
takas(T):  // tek fonksiyon, arada await yok
  yeniden doğrula: mesafe ≤ 8 m, ikisi de bağlı ve ayakta, her kalem hâlâ profilde, altınlar yeterli,
                   alıcı kapasiteleri (canAdd: ağırlık ve yuva) iki yön için ayrı ayrı
  herhangi biri tutmazsa → tradeSt{st:'iptal', why:'yer'|'yok'|'uzak'|'altin'} (hiçbir şey değişmez)
  uygula: A'dan düş, B'ye ekle; B'den düş, A'ya ekle; altınları aktar; donanılmış eşya düşerse unequipIfMissing
  defter: iki profile {k:'takas', src:'tr:<id>', d:{g, it}} (aynı src)
  inv{rev} her iki tarafa; tradeSt{st:'tamam'}
İptal: 'cancel' iletisi, 120 sn hareketsizlik, mesafe > 8 m, kopma ya da hayalet yuva, yaralanma, host devri
```

- **Host bir taraf olduğunda** kendi yerel envanteri Faz 2'nin `localCtx` soyutlamasıyla kullanılır.
- **Korunum (Faz 2 P4):** Takas yalnız var olanın yerini değiştirir. Test: ticaretten önceki ve sonraki toplam altın ve eşya sayıları eşittir; `ledger.check()` iki profilde de true döner.
- **Dolandırıcılık önleme:** Kilitten sonra değişiklik yoktur. Onay ekranı iki listeyi ve son görülenden beri değişenleri vurgular. Her değişiklik onayı sıfırlar.
- **Sybil ve ithalat sızıntısı:** İthal edilen 500 altın ve başlangıç eşyaları ticarette verilemez (bağlı). Yeni profil ilk 20 dakikasında ticarette bir şey veremez (K5-6). Faz 2 §4.4'teki "kimlik başına ≈ 400 altın" sınırı böylece ticaret yoluyla delinmez. (inceleme düzeltmesi) Faz 2 profilinde altın tek bir sayıdır (`inv.gold`, Faz 2 §4.1); "bağlı altın" yoktur, bağ yalnız eşyalarda (`b`) vardır. Bu yüzden profile `gb` alanı (bağlı altın: başlangıçtaki 150 + en çok 500 ithal) eklenir. Harcamada önce `gb` düşer, bağlı altınla alınan eşya `b:1` olur, takasta `g ≤ gold − gb` koşulu aranır. Bu, Faz 2 `inv`/`gold` h2c şemasına ve Faz 4 profil şemasına (§8.4) yeni bir alan demektir (PROTO 3). Faz 2 §4.4'te kalan "ithal altınla mal alıp yere bırakma" sızıntısı da böylece kapanır.
- **Kapsam dışı:** Taşınan sandık ticaret penceresine girmez; fiziksel olarak bırakılıp alınır.
- **İletiler:** c2h `trade{q, a, …}` (sınıf `trade`: 4/sn, patlama 8). h2c `tradeSt{id, st, rev, oa, ob, kilit, onay, why?}`. Eşya adları ve verisi Faz 2 `normItemData` ile yeniden kurulur.
- **Arayüz:** `js/ui/tradePanel.js`. Oyuncuya bakıp "Ticaret teklif et" (etkileşim sağlayıcısı) ya da takım listesinden açılır. İki sütunlu pencere: envanter sürükle-bırak, altın girişi, Kilitle/Onayla düğmeleri.
- **Test:** 06v V1–V5; Node `trade_atomic.mjs`.

### 4.9 Bağlantı kopması ve tekrar bağlanma

Özet; ayrıntı §5'tedir. Kopma iki sinyalle algılanır. Geçici kopmada menüye dönülmez: konuk aynı belirteçle otomatik yeniden bağlanır. 60 sn'lik hayalet yuva rengi, konumu ve koltuğu korur. Sayfa yenilense de oyuncu son konumunda döner (`welcome.spawn` + `fix`). Düşürmenin nedeni bildirilir. Test: 06r. (inceleme düzeltmesi) Sayfa yenilendiğinde konuk ana menüde açılır ve bugün geri dönmesini sağlayan bir yol yoktur. `pagehide` sırasında `sessionStorage['dksh.rejoin'] = {code, w, at}` yazılır. Açılışta bu kayıt 2 dakikadan yeniyse "Odaya geri dönülüyor…" gösterilir ve katılım kendiliğinden başlar.

### 4.10 Host ayrılması ve oturumun sürdürülmesi

Özet; ayrıntı §6'dadır. Planlı ayrılmada (menüden) devir kayıpsızdır. Çökmede seçim yapılır, varis replikadan devralır, dönem artar ve konuklar yeniden bağlanır. Devir kapalıysa ya da çoğunluk sağlanamazsa oturum düzgün kapanır: `bye{code:'hostClosing'}` gider, konuk profili host'ta güvendedir. Test: 06x (2 oyuncu), 06y (4 oyuncu).

---

## 5. Bağlantı

### 5.1 Bağlantı durum makinesi (`js/net/session.js`)

**Host'ta, konuk başına:**

```
pre ──geçerli hello──▶ lobby ──start / worldPart──▶ load ──ilk oyun karesi──▶ warm ──loaded──▶ game
game ──sessizlik ≥ 8 sn, ICE bağlı──▶ yanıtsız ──ileti geldi──▶ game
yanıtsız ──sessizlik ≥ 30 sn (iki vuruş)──▶ hayalet
game | yanıtsız ──ICE disconnected ≥ 8 sn, failed ya da kanal kapandı──▶ hayalet (60 sn)   // inceleme düzeltmesi: 3 sn → 8 sn
hayalet ──aynı gid ile hello──▶ resume ──▶ game (aynı koltuk, renk ve konum)
hayalet ──aynı bağlantıdan geçerli ileti (sessizlik hayaleti)──▶ game   // inceleme düzeltmesi: yerinde sürdürme
hayalet ──60 sn──▶ ayrıldı (koltuk serbest; profil gbook'ta kalır)
load | warm ──90 sn sessizlik──▶ ayrıldı (kick{code:'timeout'})
```

**Konukta:** `bagli → zayif (4 sn sessizlik) → yanitsiz (ICE bağlı, 8 sn) | koptu (ICE koptu ya da kanal kapandı) → yeniden (otomatik deneme) → bagli`. Host kaybı kesinleşirse (§6.4) `devir` durumuna, devir kapalıysa `bitti` durumuna geçilir.

(inceleme düzeltmesi) **Eksik geçişler ve izinler:**
- `hayalet ──aynı bağlantıdan geçerli ileti──▶ game`: Sessizlik yüzünden hayalete alınan konuğun bağlantısı açık kalır. Takılması biten konuğun ilk iletisi yerinde sürdürme sayılır; gerekirse `fix` gönderilir. Hayalet fazında gelen iletiler faz ihlali sayılmaz. İlk taslakta bu geçiş yoktu ve iletiler Faz 2 §2.7 uyarınca ihlal puanı alırdı.
- `warm` fazında izinli türler `game` ile aynıdır, Faz 2 §2.3'ün `load` listesi değildir (§1.8).
- Bütün zaman aşımları ayrı bir `setInterval` (250 ms) ile koşan `session.tick` içinde değerlendirilir; `net.update` yalnız veri gönderir (§5.2).

### 5.2 Kopma algılama: iki sinyal

| Sinyal | Kaynak | Anlamı |
|---|---|---|
| Taşıma | `conn.on('iceStateChanged')` (PeerJS her durumda yayıyor; `failed` olunca bağlantıyı kapatıyor), `conn.peerConnection.connectionState`, DataChannel `close` | ICE onay denetimleri (RFC 7675) WebRTC'nin ağ iş parçacığında yanıtlanır, karşı tarafın JS'i takılı olsa da sürer. ICE `connected` kaldıkça karşı süreç ve ağ yaşıyordur. |
| Uygulama | Herhangi bir kanaldan gelen son iletinin zamanı. Boş durumda 1 sn'de bir `hb{ts}` gider (R). (inceleme düzeltmesi: `hb` `session.tick`'ten gider ve rAF'tan bağımsızdır.) | JS'in çalışıp çalışmadığı |

| Durum | Host'un tepkisi | Konuğun tepkisi |
|---|---|---|
| İleti var | Normal | Normal |
| ICE bağlı, 4 sn sessiz | Takım listesinde "yanıt vermiyor" simgesi | "Bağlantı zayıf" küçük göstergesi |
| ICE bağlı, 8 sn sessiz | Avatar soluklaşır (`r.away`); düşmanlar hedeflemez (`enemies._players`, `enemies.js:518-523` süzgeci) | "Kaptan yanıt vermiyor (sekmesi arka planda olabilir)" bindirmesi; girdi açık kalır |
| ICE bağlı, ≥ 30 sn sessiz (iki vuruş) | Hayalet yuva: kilitler bırakılır, dümen sıfırlanır, taşınan sandık bırakılır, ticaret iptal edilir | ≥ 60 sn: "Kaptan 60 sn'dir yanıt vermiyor: [Bekle] [Dümeni devral]". Devir yalnız konuklar arası çoğunlukla başlar (§6). (inceleme düzeltmesi) Host canlıyken nüfusta "hayır" sayılır: 4 oyunculuda üç konuğun üçü de istemelidir; 2 oyunculuda bu yol yalnız K5-13 çatalına çıkar. |
| ICE `disconnected` ≥ 8 sn (inceleme düzeltmesi: 3 sn, kısa Wi-Fi dolaşmalarında taşınan sandığı, kilidi, ticareti ve zar koltuğunu bıraktırırdı; v0.4 15 sn tolere ediyordu) ya da `failed`, ya da kanal kapandı | Hayalet yuva | `yeniden` durumu (§5.4); devir açıksa host kaybı sayacı başlar |
| `bye`/`kick` | Neden koduna göre (§5.6) | Neden koduna göre |

**Kendi takılmasının telafisi (F2)** (inceleme düzeltmesi): `session.tick` `net.update`'ten değil, ayrı bir `setInterval(…, 250)`'den çağrılır. İlk taslaktaki rAF'a bağlı denetimin iki sorunu vardı. (1) Testlerde rAF `fpsLimit = 0.01` ile durur (`engine.js:55-58`) ve `net.update` yalnız `DK.sim` tıklarında çalışır. Tıklar arasındaki boşluk 1 sn'yi aştığı için erteleme her tıkta yeniden kurulur. Kısa tıklarda (ör. 06c D4-07'deki "1 sn bekle + `tick(0.2)`" döngüsü, `06c_dort_oyuncu.cjs:56`) sessizlik zaman aşımları hiç ateşlenmez; uzun tıklarda ise gecikir ve makine hızına bağlı olur. (2) Gerçek oyunda gizli sekmede rAF durur; kopma algılama ve `hb` de dururdu. Yeni kural: aralık beklenenden 2,5 sn'den fazla geç çalışırsa (ana iş parçacığı takılmış ya da sekme dondurulmuş) `ertele = now + 3 000` olur. Bu süre içinde hiçbir düşürme ya da durum yükseltmesi yapılmaz; kuyruktaki iletiler önce işlenir. Arka plan sekmesinde zamanlayıcılar en az 1 sn'de bir çalışır; 2,5 sn eşiği bunu takılma saymaz. Durum yükseltmeleri en az 1 sn arayla iki ardışık denetimde doğrulanır (iki vuruş). Chromium'un 5 dakikadan uzun gizli kalan sayfalara uyguladığı yoğun kısmanın (dakikada bir) etkin WebRTC bağlantısı olan sayfaya uygulanmadığı varsayılıyor **[BELİRSİZ]**. Uygulanırsa, ICE bağlıyken iki taraflı `hb` sessizliği düşürme değil, yalnız "yanıt vermiyor" durumu üretir.

### 5.3 Yükleme ve ısınma muafiyeti (F1)

- **`load`:** Konuk `game.start`'ı çalıştırıyor. Faz 4 bu sırada `G.state='loading'` yapar, `net.update` `st` göndermez. Sessizlik sınırı 90 sn'dir. `ping`/`hb` sürer.
- **`warm`:** İlk oyun karesinden itibaren. Konuk `st` gönderir, ama host bunu yalnız konum olarak işler; kalp atışı sınırı 90 sn'de kalır. (inceleme düzeltmesi) Konuk `loaded{}` iletisini `sessionStart` ve `worldPart` uygulandıktan sonra, şu iki koşuldan biri sağlanınca gönderir: (a) en az 60 kare geçmiş ve `NEAR_D` (250 m) içinde kurulmamış ada kalmamış; (b) 20 sn geçmiş (koşulsuz tavan). İlk taslaktaki `islands.job === null` koşulu 750 m'ye kadar süren arka plan kurulumunu da (`islands.js:27`, `BUILD_D`) beklerdi. Oyuncu hareket ettikçe bu koşul hiç sağlanmayabilirdi; 20 sn tavanı ise yalnız kare koşuluna bağlıydı.
- **Yükleme sırasında ileti kaybı (E-05):** Konuk `start` ile `sessionStart` arasında gelen olayları (inceleme düzeltmesi: `sessionStart`'tan sonra olaylar doğrudan uygulanabilir) bir kuyrukta biriktirir ve `sessionStart`'tan sonra sırayla uygular. Host `loaded` gelince bu konuğa bir `worldPart` eşitlemesi daha gönderir. Böylece `treasure.start` ve `events.start`'ın sildiği olaylar (`treasure.js:105-110`, `events.js:46-48`) geri gelir. `worldPart`'a Faz 2 içeriğine ek olarak `floats` (türüyle, ≤ 64) ve `locks` (istasyon kilitleri) eklenir; böylece E-05'in kalan iki parçası da kapanır. (inceleme düzeltmesi) `loaded` sonrasındaki `worldPart` `resync:true` bayrağıyla gelir. Bu durumda konum (`main.js:341`'deki limanda doğma), gemi konumu ve hava anında atanmaz; yalnız nesne kümeleri (sandık, kese, yüzen nesne, kilit, `feats`) değiştirilir. Aksi hâlde ikinci uygulama konuğu limana ışınlardı.
- **İptal belirteci (F6)** (inceleme düzeltmesi): `game.start(opts)` `opts.token`'ı her `await`'ten sonra denetler. Host bağlantısının yükleme sırasında kopması yüklemeyi **iptal etmez**: konuk yüklemeyi bitirir ve `yeniden` durumuna geçer (§5.4). Bağlantı geri gelince `welcome{resume}` ve `worldPart{resync}` gelir; dünyayı ikinci kez yüklemek gerekmez. Belirteç yalnız oturum kesin bittiğinde geçersiz olur (`bitti`: `kick`, `bye{hostClosing}` ya da yeniden bağlanmanın tükenmesi); o zaman `game.abortStart({keepNet:false})` çağrılır. Faz 4'ün `abortStart`'ı online host'ta `net.leave()` çağırır (Faz 4 §4.6). Faz 5 buna `keepNet` seçeneğini ekler; varis terfisi bu seçeneği kullanır (§6.5).

### 5.4 Otomatik yeniden bağlanma

1. **Tetik:** `koptu` durumu. `kick` ile atılan, `banned`, `version`, `full` ya da `pw` nedenli konuk yeniden bağlanmaz.
2. **Sinyal:** `peer.disconnected` ise önce `peer.reconnect()` denenir; bu, konuğun Peer kimliğini korur. Bugün konukta `disconnected` işleyicisi yok, eklenir.
3. **Deneme:** Hedef host'un Peer kimliğidir (devirden sonra yeni host, §6.5). Yeni bir `DataConnection` açılır; PeerJS'te ICE yeniden başlatma yok, yeni bağlantı gerekir. Faz 2 akışı izlenir: `info` → `hi` → `hello{auth:{g, mac}, resume:{w, e, sq, rev, pos, mode, ship, lx, lz}}`. (inceleme düzeltmesi) PeerJS `peer-unavailable` hatasını bağlantı nesnesinde değil, Peer nesnesinde yayar. Hangi denemeye ait olduğu ileti metninden (`Could not connect to peer <id>`) ayrılır. Kayıtlı olmayan bir kimlik için bu hata yaklaşık 5–6 sn sürer (sunucunun `expire_timeout` değeri). Ağı kopmuş ama sinyal sunucusunda hâlâ kayıtlı bir host'a yapılan deneme ise ne yanıt ne hata üretir. Bu yüzden her deneme 8 sn zaman aşımıyla sınırlanır.
4. **Bekleme:** 1, 2, 4, 8, 8, 8 … sn; toplam 60 sn. Eski bağlantı yarı açıksa yeni bağlantı onun yerine geçer ve host eskisini `kick{code:'replaced'}` ile kapatır. (inceleme düzeltmesi) Host'un eski bağlantıya gönderdiği `kick{code:'replaced'}`, konuğun kendi bıraktığı bağlantıya da ulaşabilir. Konuk `replaced` iletisini yalnız etkin `hostConn`'dan gelirse uygular; eski bağlantıdan geleni yok sayar.
5. **Dünya korunuyor mu:**
   - **Sayfa yenilenmedi:** Konuk dünyasını korur. `welcome{resume:true}` ve ardından **yerinde** `worldPart` gelir: `applyWorld` yerine geçirme anlamıyla ve tekrar uygulanabilir biçimde çalışır (Faz 2/4). Dilimler yeniden akar ve NetInterp tamponları sıfırlanır.
   - **Sayfa yenilendi:** Normal katılım yapılır. Host `welcome.spawn` içinde son yetkili konumu ve kipi gönderir (güverte ise gemi ve yerel konum). Limanda doğma (`main.js:341`) yalnız `spawn` yoksa uygulanır. İlk `st` `fix` noktasına yakın olmalıdır (Faz 2 §8.4). (inceleme düzeltmesi) Yenilemeden sonra katılımı `sessionStorage['dksh.rejoin']` başlatır (§4.9).
6. **Girdi:** `yeniden` durumunda girdi kapalıdır ve karakter boşta durur. Bu, "kopmayı ışınlanma için kullanma" hilesini kapatır. Dönüşte konuk konumu host'un son `r.auth` değerinden 3 m'den fazla saparsa `fix` gönderilir.
7. **Kabul:** Konuk sekmesi yenilenirse en çok 10 sn içinde aynı renk ve konumla oyuna döner. Ağ 10 sn kesilirse bağlantı geri gelince en çok 5 sn içinde sürer. Roster'da çift kayıt olmaz (E-16).
8. (inceleme düzeltmesi) **Oda kodu dünyaya bağlıdır (K5-12):** Bugün oda kodu her `host()` çağrısında yeniden üretilir (`net.js:208-211`) ve yalnız profilin `recentRooms` listesine yazılır (`net.js:469-472`). Nihai tasarımda online yuva kaydına `room:{code}` yazılır; bu, Faz 4 §2.6'nın yalnız-ekleme kuralına uyan bir üst alandır. Aynı yuva yeniden barındırılırken önce bu kod denenir. `unavailable-id` hatası gelirse kod başkasındadır (devredilmiş oturum ya da çakışma) ve §6.8 akışı çalışır; kod hiç yoksa yeni kod üretilir. Davet bağlantıları ve `recentRooms` böylece çalışmaya devam eder (audit_E gereksinim 10'un kısa vadeli maddesi). §6.8'deki eski host dönüşü de bu koda dayanır.

### 5.5 Hayalet yuva

- **Host'ta:** Bağlantı kaydı `away` durumuna geçer ve 60 sn tutulur. Koltuk kapasitede sayılır, ama yalnız aynı `gid` alabilir. Dolu odada çöken konuk "Oda dolu" almaz (E-16).
- **Avatar:** Soluk görünür ve "bağlantı koptu" etiketi taşır. Düşmanlar hedeflemez. Gelir payına girmez (Faz 2 `earnShared`: yalnız `game` fazı).
- **Temizlik:** Bağlantı koparken hemen uygulanır (v0.4 `_dropPeer`'daki gibi, `net.js:398-400`): kilitler, dümen sıfırlama, taşınan sandık ve kayık sürücülüğü serbest bırakılır, ticaret iptal edilir, zar koltuğundan kalkılır.
- **Renk:** Boş renk havuzundan seçilir, roster uzunluğuna bağlı değildir (`net.js:257`). Renk `gid`'e bağlanır; aynı `gid` aynı rengi alır.
- **60 sn sonra:** `ayrıldı` olur, koltuk boşalır, profil `gbook`'ta kalır.

### 5.6 Düşürme ve ayrılma nedenleri

| Kod | Gönderen | Konuk ekranı | Otomatik yeniden bağlanma |
|---|---|---|---|
| `timeout` | Host (sessizlik ve hayalet süresi bitti) | "Bağlantı zaman aşımına uğradı." | Evet (inceleme düzeltmesi: hayalet süresi bitince koltuk boşalmıştır; dönen konuk yeni bir koltuk ister, aynı `gid` ile profili korunur) |
| `replaced` | Host | "Bu karakterle başka bir yerden bağlanıldı." | Hayır |
| `kicked` | Host (`[At]`) | "Kaptan seni odadan çıkardı." | Hayır (oturum kara listesi) |
| `protocol` | Host (Faz 2 ihlal) | "Bağlantı kuralları ihlal edildi." | Hayır |
| `full`, `pw`, `version`, `auth`, `banned`, `locked`, `newLimit` | Host (`reject`, Faz 2) | Koda göre | Hayır |
| `hostClosing` | Host (menüye dönüş, devir kapalı) | "Kaptan oturumu kapattı. İlerlemen kaydedildi." | Hayır |
| `migrating` | Host (planlı devir) | "Dümen devrediliyor…" | Yeni host'a (§6.9) |
| `menu` | Konuk (menüye dönüş, `toMenu`) | — | — (bilerek ayrılma: host koltuğu hemen boşaltır, hayalet yuva açılmaz; 06c D4-06 akışı) |
| `closing` | Taraflar (`beforeunload`/`pagehide`, en iyi çaba) | — | — |
| `stale` | Daha yüksek dönemli host | "Oturum yeni kaptanla sürüyor." | Yeni host'a (§6.8) |

`bye` ve `kick` R kanalından gider; ardından 250 ms içinde `conn.close()` çağrılır.

### 5.7 Arayüz

- Bağlantı rozeti (lobi kartları ve takım listesi): "Doğrudan / Aktarımlı (TURN)", RTT ve kayıp yüzdesi (§7.5).
- Kopma ve yeniden bağlanma bindirmesi: "Bağlantı koptu, yeniden bağlanılıyor (3/8)…" ve [Menüye dön] düğmesi.
- **E-14 temizliği:** Oturum bitişinde `ui.closeAll()` çağrılır, sohbet kutusu kapatılır, `G.uiOpen = false` yapılır, `input.unlockPointer()` çağrılır. `game.start` başında da `G.uiOpen = false` atanır.

---

## 6. Host devri

### 6.1 Gerçekçi sınırlar (tarayıcı P2P)

1. **Sinyal sunucusu şarttır.** Yeni bağlantılar (oy, yeniden bağlanma) ancak sunucu erişilebilirken kurulur. Sunucu çöktüyse devir olmaz. Mevcut DataChannel'lar sürer, ama host gitmiştir. (inceleme düzeltmesi) Sinyal sunucusu bir eşin gittiğini geç ve iki farklı biçimde öğrenir. Sekmesi kapanan eşin kimliği WebSocket kapanınca hemen silinir. Ağı kopan eşin kimliği ise `alive_timeout` boyunca kayıtlı kalır (test sunucusu `peer` 1.0.2'de 90 sn; PeerJS bulutunda bilinmiyor) ve bu sürede ona gönderilen OFFER sessizce kaybolur. `peer-unavailable` yalnız EXPIRE ile, yaklaşık 5–6 sn sonra gelir (`expire_timeout` 5 sn + `cleanup_out_msgs` 1 sn). Tanık bu yüzden üç durum ayırır: "var", "yok" ve "bilinmiyor".
2. **NAT.** Konuklar birbirine doğrudan bağlanamayabilir. TURN olmadan bazı durumlarda kimse çoğunluk toplayamaz; Node taramasında 3 hayatta kalanlı 56 durumun 13'ünde bu oldu (§6.4). Bu durumda oturum kendiliğinden sürmez, kullanıcıya sorulur. (inceleme düzeltmesi) Yıldız topolojide konukların birbirine ulaşıp ulaşamadığı host kaybına kadar hiç sınanmaz. Bu yüzden varis 1, oyun sırasında diğer konuklarla ön bağlantı tutar (§6.4a); ulaşılamazlık önceden görünür.
3. **Kayıp penceresi.** Dünya durumu en çok son replikadan bu yana geçen süre kadar (varis için ≤ 20 sn) kaybolabilir. Profil ve defter değişiklikleri `replD` ile yaklaşık RTT sürede iletilir. Havadaki mermiler kaybolur. Düşman yapay zekâsı konum ve candan yeniden başlar. Boss evre zamanlayıcıları baştan başlar; can korunur.
4. **Güven.** Varisler host'un sırlarını alır: konuk HMAC anahtarları ve sandık içerikleri. Bu yüzden devir herkese açık odada varsayılan olarak kapalıdır (K5-1). (inceleme düzeltmesi) Anahtarların kendisi varise verilseydi varis, canlı host'a başka bir konuk olarak girip onun eşyalarını ticaretle kendine aktarabilirdi. Bu yüzden replika yalnız bir sonraki dönemin türetilmiş anahtarını taşır (§6.3, dönem anahtar zinciri). Sandık içerikleri yine sızar; bu, arkadaşlar arası co-op'ta küçük bir hile olarak kabul edilir.
5. **Kayıt çatallanması.** Eski host'un tarayıcısındaki kayıt bayatlar. Uzlaştırma ancak iki taraf aynı anda çevrimiçiyken yapılabilir; çevrimdışı birleştirme yoktur.
6. **iOS ve mobil arka plan.** Dondurulan host, kopmuş sayılır. Geri geldiğinde daha yüksek dönemi görür ve konuğa dönüşür.
7. **Kesintisiz değil.** (inceleme düzeltmesi) Host'un sekmesi kapandıysa (temiz kapanış) devir yaklaşık 10–20 sn sürer. Host'un ağı koptuysa 30–100 sn sürer: ICE `failed` yaklaşık 30 sn'de gelir, sinyal sunucusu kimliği en geç `alive_timeout` sonunda düşürür. İlk taslaktaki 10–35 sn yalnız temiz kapanışa uyuyordu. Ekranda "Dümen devrediliyor…" yazar. Sonrasında "Son birkaç saniyelik ilerleme kaybolmuş olabilir" notu gösterilir.
8. Tasarım en çok 4 oyuncu içindir, yani hayatta kalan en çok 3 kişidir. Daha büyük gruplar için yeniden değerlendirilmelidir.
9. (inceleme düzeltmesi) **Bölünme ile ölüm ayırt edilemez.** Bir konuk açısından "host öldü" ile "host canlı ama bana ulaşamıyor" aynı görünür (host'un ya da konuğun ağı kopmuş, NAT eşlemesi değişmiş ya da TURN düşmüş olabilir). İlk taslağın Node taraması host'u her durumda ölü varsayıyordu. Host canlı bırakılarak sınanınca, iki oyunculu oyunda konuğun kendi interneti ya da yalnız host'la bağı kopunca kendini seçtiği; dört oyunculu oyunda eski host'a bağlı bir konuk varken ikinci bir host seçildiği görüldü (§6.4, Ek A). Bu yüzden canlı olabilecek host, çoğunluk hesabında "hayır" oyu olarak yer alır.

### 6.2 Ayar

Oda kurma ekranına (`menu.js:180-209`) "Oda sahibi ayrılırsa: [Dümen tayfaya geçsin] / [Oturum kapansın]" seçeneği eklenir. Varsayılan özel odada açık, herkese açık odada kapalıdır. Ayar `info` ve `welcome` içinde yayınlanır, konuk lobide görür. Kapalıysa replika gönderilmez ve sırlar paylaşılmaz. (inceleme düzeltmesi) Planlı devir varsayılan olarak açıktır. Çökme devri, F5-16'nın güvenlik testleri 10/10 geçene dek varsayılan olarak kapalıdır (K5-1).

### 6.3 Durum aktarımı (replika)

**Konukta zaten bulunanlar:** Gemiler (konum, hız, hasar), düşman, hayvan, deniz devi ve boss konum ve canları (yalnız ilgi alanında), sandık ve kese konumları (içeriksiz), yüzen nesneler, kilitler, `quests` aşaması, bayrakları ve işaretleri, `feats` (Faz 2), zaman ve hava, kendi profili (`wcache`).

**Yalnız host'ta bulunanlar, yani replikaya girmesi gerekenler:**

| Bölüm | İçerik | Kaynak | Sıklık |
|---|---|---|---|
| `save` | `game.serialize()`: host oyuncusu, gemi, dünya, bütün sistemlerin `save()` çıktısı (treasure `found`, `chests` içerikleriyle, düşman grupları, ada ve tehlike kümeleri, bosslar, görevler, zaman günlüğü, WorldState) | `game.js:161-178` + Faz 4 başlığı | Tam replikada |
| `gbook` | Bütün profiller, anahtarlar, `txSeq`, `txCache`, defter halkası (inceleme düzeltmesi) Anahtarlar düz gönderilmez: her profil için yalnız `k_{e+1}` gider (aşağıda). | Faz 2 `guestBook` | Tam replikada + `replD` (değişince) |
| `owner` | Host'un sahip kimliği `{gid, key}` (host bir gün konuk olarak dönebilsin diye) (inceleme düzeltmesi) `ownerKey` yerine `k_{e+1}(owner)` gider. | `dksh.wtok.<w>` (§6.6) | Bir kez |
| `transient` | İlgi alanı dışındakiler dahil bütün düşman, hayvan ve deniz devleri (`id, ty, pos, yaw, hp, grup, durum`); boss (`id, hp, evre`); sandık ve keseler (içerikle); yüzen nesneler (`id, kind, pos, t`); `events` (zamanlayıcı, düşman gemisi ve tayfa kimlikleri); `worldEvents` (durum ve süreler); gemiler (`serialize` + `vx, vz, yawRate, sail, rudder, anchorT`); kayık; tahmin; zarcı keseleri; ticaret gemisi stokları | Sistemlerin yeni `netFull()` fonksiyonları | Tam replikada |
| `room` | Ad, şifre özeti, `max`, zorluk, devir ayarı, roster (`gid, ad, renk, app`), `heirs` sırası, `epoch`, `worldRev` | `net.room` | Tam replikada |

- **Sıklık:** Varis 1'e tam replika 20 sn'de bir gider. Diğer adaylara 60 sn'de bir. Önemli olaylardan sonra (hikâye aşaması, boss yenilgisi, gemi satın alma) 2 sn içinde tam replika planlanır. `replD{rev, ops}` defter ve `feat` değişikliklerini hemen taşır (işlem başına ≈ 100 B).
- **Boyut:** Kayıt tipik olarak 16,5 KB, en kötü 88 KB'tır (Faz 4 §3.5). `gbook` tipik 4 × 5–10 KB, en kötü 384 KB'tır. `transient` 5–40 KB'tır. Tipik replika 30–70 KB ham, `deflate-raw` ile 6–15 KB olur, yani 1 parça. En kötü durum yaklaşık 500 KB ham, yaklaşık 100 KB sıkıştırılmış, 7 parçadır. `CompressionStream` yoksa sıkıştırmasız gönderilir; sınır 512 KB'tır **[BELİRSİZ: oranlar F5-14'te ölçülür]**. (inceleme düzeltmesi) Host'un ana iş parçacığında 20 sn'de bir yapılan `serialize` + `netFull` + `JSON.stringify` + sıkıştırma maliyeti ölçülmedi **[BELİRSİZ]**. F5-14'te ölçülür. Kare başına 8 ms'yi aşarsa bölümler karelere yayılır ya da otomatik kaydın serileştirmesi yeniden kullanılır.
- **Saklama:** Replika varisin belleğinde tutulur. `sessionStorage`'a yazılmaz, çünkü konuk anahtarlarını içerir. Oturum sonunda silinir.
- (inceleme düzeltmesi) **Dönem anahtar zinciri:** İlk taslakta varis bütün konukların HMAC anahtarlarını alıyordu. Varis bunlarla canlı host'a başka bir konuk olarak girebilir (Faz 2 §2.2 akışı) ve o konuğun eşyalarını yeni ticaret özelliğiyle kendine aktarabilirdi. Nihai tasarım: dönem `E`'deki doğrulama anahtarı `k_E = HMAC(k_{E−1}, 'dksh-epoch|' + w + '|' + E)`'dir ve `k_0 = k`'dır. Dönem 0 Faz 2 ile birebir aynıdır. Host dönem `e`'de `k_e` ile doğrular; replika yalnız `k_{e+1}` değerlerini taşır. Varis `k_{e+1}`'den `k_e`'yi türetemez (tek yönlü), dolayısıyla canlı host'a başkası olarak giremez; terfiden sonra ise dönem `e+1`'de doğrulama yapabilir. Konuk kendi `k`'sından her `k_E`'yi türetir; `hi` iletisi dönem `e`'yi taşır. Oylar `k_{e+1}` ile imzalanır, bu yüzden hem aday (replikadan) hem eski host (`k`'dan türeterek) oyu doğrulayabilir. Korsan Kodu (S-b) `k_0`'ı taşır.
- **Doğrulama:** Varis replikayı Faz 4 `saveSchema.validate` ve Faz 2 `gbook` şemasından geçirir. Geçmezse son geçerli replika tutulur.

### 6.4 Yeni host seçimi (deterministik)

**`heirs{e, w, order:[{n, gid, pid}], q}`:** Host bu iletiyi roster ya da faz değişince ve her 10 sn'de yayınlar. `order`'a yalnız `game` fazındaki konuklar girer. Sıralama ölçütleri sırasıyla: (1) son 30 sn'de tam replika almış olmak; (2) doğrudan bağlantı (relay değil); (3) düşük RTT; (4) erken katılım; (5) `gid` sözlük sırası. Herkes aynı listeyi görür. (inceleme düzeltmesi) Sıralamanın yeni ilk ölçütü, diğer adayların en çoğuna ön bağlantısı açık olmaktır (§6.4a). Ardından yukarıdaki ölçütler gelir.

**Seçim protokolü (ilk taslak; inceleme sonrası aşağıdaki nihai protokolle değiştirildi):**

```
Host kaybı (§5.2: ICE koptu ya da kanal kapandı + 3 sn bekleme; ya da "Dümeni devral" çoğunluk kararı):
  S ← order (son heirs);  S' ← S − {sinyal sunucusunun 2 sn arayla iki yoklamada 'peer-unavailable' dediği üyeler}   // tanık kuralı
  Q ← floor(|S'|/2) + 1
  tur r = 1..|S|:  aday c_r, dönem E_r = e + r, tur süresi 6 sn
    c_r (canlıysa ve bir host'a katılmamışsa): kendi Peer'inde bağlantı kabul etmeye başlar; kendi oyunu sayılır
    seçmen v (S'de, henüz bir host'a katılmamış, dönem E_r'de oy vermemiş): c_r'ye bağlanır, vote{E_r, w, gid, mac} gönderir
    c_r: oy ≥ Q → claim{E_r, w, worldRev, hostGid} → devralma (§6.5); seçmenler ona katılır
    tur süresi dolarsa sonraki tura geçilir (dönem bir artar)
  Hiçbir tur Q'ya ulaşamazsa: "Tayfaya ulaşılamıyor. [Bekle ve yeniden dene] [Tek başına devam et]"
    "Tek başına" yeni bir worldId ile açık bir çataldır (K5-10)
```

(inceleme düzeltmesi) **İlk taslağın kusurları:** (1) Turlar saatle ilerliyordu: tur `r = floor((t − algılama_i)/6) + 1`. Algılama anları farklı olunca (kanal kapanışı ~0 sn, ICE `failed` ~30 sn, elle "Dümeni devral") düğümler farklı turlarda farklı adaylara oy vermeye çalışır ve tam bağlantılı durumlar da tıkanır. (2) Çoğunluk yalnız konuklardan sayılıyordu; host canlıyken iki etkin host oluşabiliyordu. (3) Sinyali kopuk bir konuk tek başına Q = 1 ile kendini seçebiliyordu. (4) Tanık "2 sn arayla iki yoklama" diye tanımlanmıştı, oysa bir yoklama ~5–6 sn sürer ve ağı kopmuş host'ta yanıt hiç gelmez.

**(inceleme düzeltmesi) Seçim protokolü (nihai, olay güdümlü):**

```
Ön koşullar (bir düğüm ancak bunlar sağlanınca seçime girer):
  Ö1  Kendi sinyal bağlantısı açık: peer.open && !peer.disconnected.
      Değilse aday olmaz, oy vermez; yalnız yeniden bağlanmayı dener.
  Ö2  Host'a yeniden bağlanma (§5.4) en az bir kez denenmiş ve başarısız olmuş; ya da ICE bağlıyken host ≥ 60 sn yanıt vermediği için oyuncu "Dümeni devral"ı seçmiş.
  Ö3  Host tanığı: hostDurum = 'yok' (2 ardışık yoklamada peer-unavailable; her yoklama ~5–6 sn)
      ya da 'bilinmiyor' (yanıt yok ya da host kayıtlı).
Nüfus ve çoğunluk:
  S' = heirs.order − {sinyalin 'yok' dediği konuklar}
  P  = S' ∪ {host}          // host yalnız hostDurum = 'yok' ise çıkar
  Q  = floor(|P| / 2) + 1
  Host ve host'a hâlâ bağlı konuklar "hayır" sayılır: oy vermez, aday olmaz.
Oy (dönem E = e + 1'den başlar; her düğüm her dönemde tek oy verir):
  Seçmen v, Ö1–Ö2 sağlanınca order sırasında ulaşabildiği ilk adaya (kendisi dahil) şunu gönderir:
    vote{E, w, gid, mac = HMAC(k_{e+1}, 'vote|' + E + '|' + adayGid), kira: 15 sn}   // önce ön bağlantıdan (§6.4a)
  Aday reddederse (host'a bağlı, Ö1/Ö2 sağlanmıyor ya da daha öndeki bir adaya oy vermiş),
    seçmen beklemeden sıradaki adaya geçer; reddedilen oy verilmiş sayılmaz.
  Kira dolar ve aday claim yayınlamazsa seçmen E + 1'e geçer ve sırayı baştan dener.
Devralma:
  Aday, kirası dolmamış oy(E) ≥ Q olunca claim{E, w, worldRev, cert: [oy MAC'leri]} yayınlar.
    claim en geç kira bitiminden 3 sn önce yapılır (ileti gecikmesi ön bağlantıda ölçülür).
  claim'i alan seçmenler katılır. Seçilmiş bir host'a ulaşan her düğüm katılır; geç algılayanlar da.
Tek hayatta kalan (|S'| = 1):
  Host P içindeyken Q = 2'dir, konuk devralamaz. Host 'yok' olunca devralır: sekme kapandıysa birkaç saniye içinde,
  host'un ağı koptuysa sinyal sunucusu kimliği alive_timeout ile düşürünce.
  60 sn sonra: "Kaptana ulaşılamıyor. [Bekle] [Tek başına devam et (çatal)]" (K5-13).
Çoğunluk sağlanamazsa: "Tayfaya ulaşılamıyor. [Bekle ve yeniden dene] [Tek başına devam et]".
  "Tek başına" yeni worldId'li açık bir çataldır (K5-10).
```

- **Tekillik:** Her düğüm bir dönemde tek oy verir ve `Q > |P|/2`'dir; bu yüzden bir dönemde en çok bir host olur.
- **Canlı host:** Host P içinde "hayır" sayılır. Bu yüzden host'tan kopan azınlık çoğunluk toplayamaz. Konukların çoğunluğu host'tan koptuysa (sorun host tarafındaysa) devir meşrudur; eski host sertifikayı görünce geri çekilir (§6.7).
- **Kira:** Bir seçmen E + 1'e geçtiğinde E'nin adayı artık claim yapamaz. Bu, ileti gecikmesinin 3 sn'yi aşmadığı varsayımına dayanır.
- **Bedel:** hostDurum "bilinmiyor" iken (host'un ağı koptu, sinyal kimliği hâlâ kayıtlı) devir, sinyal sunucusunun `alive_timeout` süresine kadar (test sunucusunda ≤ 90 sn) bekleyebilir; güvenliğin bedeli budur. Host'suz çoğunluk varsa hiç beklenmez: 4 oyunculuda üç konuğun üçü de birbirine ulaşıyorsa (P = 4, Q = 3), 3 oyunculuda iki konuk birbirine ulaşıyorsa (P = 3, Q = 2).

- **Oy kuralı:** Seçmen her dönemde tek oy verir. Canlı bir host'a bağlı konuk oy vermez. `heirs` listesinde olmayan, geç katılmış konuğun oyu sayılmaz. Böylece iki ayrı grup aynı anda çoğunluğa ulaşamaz. (inceleme düzeltmesi: Bu madde ilk taslağa aittir; "iki ayrı grup aynı anda çoğunluğa ulaşamaz" sonucu yalnız host ölüyken geçerlidir. Nihai kurallar yukarıdadır.)
- **Tanık kuralı:** Sinyal sunucusu herkese aynı yanıtı verir. Ölmüş, yani sunucudan düşmüş üye çoğunluk hesabından çıkar; canlı ama NAT nedeniyle ulaşılamayan üye çıkmaz. (inceleme düzeltmesi: "Sunucu herkese aynı yanıtı verir" doğrudur, ama yanıt geç gelir; ağı kopmuş üyede de hiç gelmez. Bu yüzden nihai kural "yok" ile "bilinmiyor"u ayırır.)

**Node taraması** (`/tmp/tasarim_y/election_sim2.mjs`; her üye için canlı/ölü × her çift için simetrik ulaşılabilirlik): (inceleme düzeltmesi: Bu tablo host'u her durumda ölü varsayan, tanığı anında ve herkes için aynı uygulayan ve turları eşzamanlı yürüten bir modele aittir.)

| Listedeki konuk | Durum | Herkes sürdü | Çoğunluk sürdü, azınlık bekledi | Kimse sürdüremedi (elle karar) | Çift host | Tam bağlantılı durum | Tam bağlantılıda kendiliğinden |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 0 | 0 | **0** | 1 | 1 |
| 2 | 6 | 5 | 0 | 1 | **0** | 5 | 5 |
| 3 | 56 | 38 | 5 | 13 | **0** | 37 | 37 |

Tanık kuralı olmadan aynı taramada 3 hayatta kalanlı 56 durumun 37'si elle karar istiyordu (`election_sim.mjs`). Elle karar gereken durumların hepsi canlı ama birbirine ulaşamayan üyeler içerir; TURN bu durumları azaltır, ortadan kaldırmaz (inceleme düzeltmesi: UDP'yi engelleyen ağda `turns:443` olmadan relay de kurulamaz; §7).

(inceleme düzeltmesi) **İnceleme denemesi** (`/tmp/tasarim_y/devir_inceleme.mjs`; A = ilk taslak, B/C = nihai):

| Deneme | Durum | İlk taslak (A) | Nihai (B/C) |
|---|---|---|---|
| Algılama kayması; tam bağlantılı; host ölü; 2 hayatta kalan; algılama anları {0, 1, 2, 4, 7, 13, 25} sn | 49 | 23 kendiliğinden sürdü | 49 |
| Aynısı, 3 hayatta kalan | 343 | 289 | 343 |
| Host canlı; 1 konuk (konuğun sinyali ya da host bağı kopuk) | 2 | 2 haksız devir (çatal; host takma adı görünce çekilir) | 0 |
| Host canlı; 3 konuk; en az bir bağ kopuk | 56 | 10 devir; 6'sında eski host'a bağlı konuk varken ikinci host | 1 devir (üç konuk da host'tan kopmuş); iki etkin host 0 |
| Host sekmesi kapandı; 1 konuk | 2 | 2 (sinyali kopuk konuk da kendini seçer) | 1 (sinyal dönünce ikincisi de) |
| Host ağı koptu, sinyalde kayıtlı; 3 konuk | 8 | 4 hemen | 1 hemen (üçü de birbirine bağlı); diğerleri `alive_timeout` sonrasında |

Model iletilerin anında gittiğini varsayar. Kiranın ve gecikmenin etkisi 06y Y6'da ölçülür.

### 6.4a Varis ön bağlantısı (inceleme düzeltmesi)

Yıldız topolojide konukların birbirine ulaşıp ulaşamadığı, host kaybına kadar hiç sınanmaz. İlk taslakta oylar, host kaybı anında, sinyalin ve NAT'ın durumu bilinmeden kurulan yeni bağlantılarla gidiyordu.

- `heirs` her değiştiğinde varis 1 (`order[0]`), diğer adaylara R kanalından `metadata:{type:'heir'}` ile bir bağlantı açar. Bu bağlantının PeerGate fazı `heir`'dir; yalnız `hb`, `vote`, `claim` ve `hello{resume}` izinlidir. Konuk yalnız güncel `order[0]`'dan gelen `heir` bağlantısını kabul eder.
- Sonuç host'a `heirOk{to, ok, rtt, tip}` ile bildirilir (`tip`: host, srflx ya da relay). Sıralamanın ilk ölçütü buna göre belirlenir (§6.4).
- Takım listesinde "Devir hazır" ya da "Devir hazır değil: Lostromo varise bağlanamıyor (TURN gerekebilir)" görünür.
- Host kaybında oylar ve host durumu gözlemleri açık bağlantılardan anında gider; oylama 1 sn'nin altında biter. Varis 1 de kayıpsa adaylar §6.4'teki gibi yeni bağlantı kurar.
- Maliyet: 4 oyuncuda en çok 2 ek `RTCPeerConnection` ve 1 Hz `hb`. Devir kapalıysa ön bağlantı kurulmaz.

### 6.5 Devralma, yeni host kimliği ve yeniden bağlanma

**Varis (terfi, "sıcak yeniden başlatma"):**

1. `G.state='loading'` (Faz 4) yapılır; "Dümen devrediliyor…" bindirmesi açılır, girdi kapanır. Ölü host'a giden kanallar kapatılır; Peer korunur.
2. `save` = replika kaydı. `player` alanına varisin kendi verisi konur: envanter, ilerleme ve kişisel görevler `gbook` profilinden; konum, kip ve gemi yerel yerleşimi ise o anki yerel oyuncudan gelir, yani varis olduğu yerde kalır.
3. `game.start({save, online:true, isHost:true, resume: transient, epoch: E})` çağrılır, ardından `applyTransient()` çalışır: düşman, hayvan, deniz devi ve boss kendi kimlikleriyle doğar; sandık, kese ve yüzen nesneler kimlikleriyle gelir; olay zamanlayıcıları kurulur; gemi hızları ve kayık geri yüklenir; kilitler boş, dümen 0 olur. Aynı yol kayıtlı online dünya yükleme yoludur, yani test edilmiş akışın üstüne kurulur. Adalar oyuncu çevresinde yeniden kurulur; bu bindirme altında kısa bir takılmadır. (inceleme düzeltmesi) Faz 4'ün `game.start`'ı `LoadError` durumunda `abortStart` çağırır; online host'ta bu `net.leave()` demektir (Faz 4 §4.6) ve terfide bütün oturumu kapatırdı. Terfi bu yüzden `abortStart({keepNet:true})` kullanır: varis `claimFail{E}` yayınlar, seçmenler sıradaki adaya geçer, varis de yeni host'a konuk olarak katılır.
4. `gbook` yüklenir. **Rol değişimi:** varisin profili listeden çıkar, çünkü artık yerel sahip oyuncudur. Eski host'un oyuncu verisi `ownerGid` ve `ownerKey` ile konuk profili olarak eklenir. Her iki işlem deftere değer değişmeden `devir` kaydı olarak yazılır. (inceleme düzeltmesi) Varisin kendi `gid`'i ve anahtarı silinmez; yeni dünyada `ownerGid`/`ownerKey` olur. Böylece dünya sahibine geri verildiğinde (§6.6) varis yeniden konuk olarak doğrulanabilir. Terfiden sonra doğrulama `k_{e+1}` ile yapılır.
5. Ağ: aynı Peer'de `peer.on('connection')` açılır. Oy için kurulmuş bağlantılar oyun bağlantısına yükseltilir (R kanalı; U açılır). (inceleme düzeltmesi) Arka planda önce **özgün oda kimliği** `dksh-v1-<KOD>` ikinci bir Peer nesnesiyle istenir; istek 5 sn'de bir, `alive_timeout` + 30 sn boyunca yinelenir. Host'un sekmesi kapandıysa kimlik hemen boştur; davet bağlantıları, `recentRooms` ve yeni katılanlar hiçbir şey değişmeden çalışır. `unavailable-id` yanıtı, eski host'un kimliği hâlâ tuttuğunu gösterir; bu da tanık bilgisidir. Özgün kimlik alınamazsa takma ad `dksh-v1-<KOD>-e<E>` istenir. İki kimlikte de `info` yanıtı `e` ve `cert` alanlarını taşır. Oda bilgileri ad, şifre, kapasite, zorluk ve devir ayarıyla aynı kalır.
6. Kayıt hemen yazılır (§6.6). `G.state='playing'` yapılır. Bildirim: "Dümen sende: Kaptan ayrıldı, oturum sürüyor (dönem E)."

**Diğer konuklar:** Sahnelerini korurlar. `welcome{resume:true}` ve yerinde `worldPart` gelir, dilimler akar, NetInterp sıfırlanır. Konumları `resume.pos` ile replikadaki son konum arasında ≤ 30 m ise kabul edilir, değilse `fix` gönderilir.

**Yeni katılanlar:** Oda kodunu yazan konuk `info` yoklamasını `<KOD>`, `<KOD>-e1` … `<KOD>-e5` kimliklerine paralel gönderir ve yanıt verenler içinde **en yüksek dönemi** seçer. `recentRooms` ve davet bağlantıları değişmeden çalışır. Herkese açık yuvalarda (`dksh-v1-pub-i`) devir desteklenmez (K5-1). (inceleme düzeltmesi) Var olmayan her kimlik için `peer-unavailable` yaklaşık 5–6 sn sürer. Bu yüzden katılan önce `<KOD>`'u dener ve yanıt gelirse onu kullanır. `<KOD>` yanıt vermezse ya da `stale` derse takma adları paralel yoklar ve en çok 6 sn bekler; yanıt verenler içinden geçerli `cert`'i olan en yüksek dönemi seçer. Sertifikayı yalnız anahtarı olan, yani dönen konuk doğrulayabilir; yeni katılan için sahte takma ad riski §10 R16'da yazılıdır.

### 6.6 Kayıt bütünlüğü

**Dünya kimliği ve sürümü.** Faz 4 v3 başlığına isteğe bağlı, yalnız eklemeli alanlar gelir; Faz 4 §2.6 kuralına uyar ve `minReader` değişmez. Faz 4 `saveSchema` bunları bilinen alanlara ekler:

| Alan | Anlam |
|---|---|
| `epoch` | Dönem (varsayılan 0) |
| `worldRev` | Dünyanın tarayıcılar arası sürüm sayacı. Her kayıtta ve her tam replikada +1. `saveSeq`'ten (Faz 4, yuva içi) farklıdır. |
| `ownerGid` | Bu kopyanın sahibinin (onu barındıran host'un) kimliği |
| `lineage` | ≤ 8 kayıt: `[{e, gid, ad, at}]` |
| `inherited` | `{fromGid, fromName, e}`: devralınmış kopya |
| `handedOff` | `{e, toGid, toName, at}`: bu kopya devredildi, son hal başkasında |
| `room` | (inceleme düzeltmesi) `{code}`: bu dünyanın oda kodu (K5-12, §5.4-8) |

- **Sıralama:** İki kopyadan `(epoch, worldRev)` sözlük sırasıyla büyük olan daha yenidir.
- **Varisin yazımı:** Varis aynı `worldId`'yi taşıyan bir yuvası varsa ve onun sırası daha küçükse o yuvaya yazar; yoksa ilk boş online yuvaya (`SLOT_COUNT = 3`, `save.js:4`). Boş yuva da yoksa geçici `dksh.inherit.<worldId>` anahtarına yazar ve oturum sonunda "Devralınan dünyayı hangi yuvaya kaydedelim?" diye sorar. Yazım Faz 4 `commit` ve kuşak politikasıyla yapılır. `gbook` sırası korunur: önce dünya, sonra defter (Faz 2 §4.2). (inceleme düzeltmesi) `dksh.inherit.<worldId>` anahtarı Faz 4'ün anahtar düzenine (§4.2), kota bütçesine ve dışa aktarma beyaz listesine eklenir. Yuvaya yazım Faz 4'ün yuva kilidini (`dksh:online:N`) alır.
- **Sahip ve kimlik:** Devir açık bir odada host ilk kez barındırırken `ownerGid` ve `ownerKey` üretir ve `dksh.wtok.<w>` içine konuk gibi yazar. Böylece eski host döndüğünde Faz 2 HMAC akışıyla normal bir konuk olarak katılır ve profili (eski oyuncu verisi) ona geri gelir.
- (inceleme düzeltmesi) **Oda kodu:** Kayıt başlığına `room:{code}` yazılır (K5-12, §5.4-8). Eski host'un dönüşü ve takma ad yoklaması bu koda dayanır. İlk taslak kodun nereden bilineceğini belirtmiyordu (`net.host` kodu her seferinde yeniden üretir, `net.js:208-211`).
- **Konuk önbelleği:** `wcache.<w>` içine `{e, rev}` eklenir. Konuk ileride aynı dünyanın daha küçük sıralı bir kopyasını barındıran host'a katılırsa host'a "Bu dünyanın daha yeni bir kopyası (dönem 2) Tayfa'da" uyarısı gider. Sessiz ilerleme kaybı böyle önlenir.
- **Sahibine geri verme:** Eski host aynı oturuma konuk olarak dönerse yeni host'un Tayfa panelinde "Dümeni sahibine geri ver" çıkar. Bu planlı bir devirdir (§6.9) ve dönem E+1 olur. Eski host kendi yuvasına `(E+1, rev)` ile yazar. Yazımdan önce kullanıcı onayı alınır ve yuvanın eski hali `.bak` kuşağına geçer (Faz 4).
- **İki sekme:** Faz 4 Web Locks ve `saveSeq` geçerlidir. Devralınan kopya ayrı bir yuvaya yazıldığı için aynı tarayıcıdaki kilitle çakışmaz.

### 6.7 Çift host engeli

1. **Dönem kuralı:** Dönem her iletide taşınmaz; yalnız `hi`, `welcome`, `heirs`, `claim`, `vote` ve `stale` iletilerinde bulunur. Daha küçük dönemli bir host'tan gelen bağlantı reddedilir: `stale{e, hostPid}`. (inceleme düzeltmesi) `stale` yalnız geçerli bir `cert` ile birlikte anlam taşır.
2. **Oy tekliği ve çoğunluk:** Bir dönemde en çok bir host olabilir (§6.4).
3. **Eşit dönemli iki host** (yalnız elle çatal ya da hatalı istemcide): Çatal yeni `worldId` aldığı için aynı dünya sayılmaz. Hatalı durumda düşük sıralı aday (`order` dizini büyük olan) geri çekilir.
4. **Takma ad yoklaması:** Host her 30 sn'de `<KOD>-e<e+1..e+3>` kimliklerini yoklar. ~~Yanıt alırsa kendisinin aşıldığını anlar ve geri çekilir (§6.8).~~ (inceleme düzeltmesi) Takma ad kimliğini, oda kodunu bilen herkes alabilir. İlk taslakta canlı host bir takma ad yanıtı görünce geri çekiliyordu; yani tek bir iletiyle düşürülebiliyordu. Nihai kural: host yalnız `cert`'i doğrulanmış bir `claim` ya da `stale` görünce geri çekilir. `cert`, dönem `e+1` için Q oy demektir; host oyların MAC'lerini `k`'dan türettiği `k_{e+1}` ile doğrular. Sertifikasız takma ad yok sayılır ve `diag`'a yazılır. Geçerli bir sertifika ancak host çoğunluğu kaybetmişse var olabilir, çünkü P'de host ve ona bağlı konuklar "hayır" sayılır.
5. **Geri çekilen host:** Benzetimi durdurur, konuklarına `bye{code:'stale'}` ve yeni host kimliğini gönderir. Kendi kopyasını `handedOff` olmadan, yalnız `lineage` notuyla saklar. Konuk olarak katılmayı önerir. (inceleme düzeltmesi) Geri çekilme yalnız doğrulanmış `cert` ile yapılır (madde 4).

### 6.8 Eski host geri gelirse

| Durum | Ne olur |
|---|---|
| Ağ birkaç saniye kesildi, ICE kendiliğinden toparlandı, devir başlamadan önce (3 sn bekleme + tur) | Bağlantılar sürer; devir başlamamıştır. |
| Devir oldu, eski host'un sekmesi açık | Konuklara bağlantısı kopmuştur. Kendi takma ad yoklaması ya da `stale` yanıtıyla aşıldığını anlar: "Oturum Tayfa'ya devredildi (dönem 2). [Konuk olarak katıl] [Ana menü]". Konuk olarak katılırsa `ownerGid`/`ownerKey` ile profili gelir. (inceleme düzeltmesi) Geri çekilme yalnız doğrulanmış `cert` ile yapılır. |
| Devir oldu, eski host sayfayı yeniden açtı | Dünyasını "Online: devam et" ile barındırmak ister. Önce takma adları yoklar; daha yüksek dönem yanıt verirse "Bu dünya şu an Tayfa'nın odasında sürüyor. [Odaya katıl] [Yine de ayrı aç (çatal)]" sorulur. Çatal seçilirse dünya yeni `worldId` alır. (inceleme düzeltmesi) Eski host önce kayıt başlığındaki `room.code`'u dener (§6.6). `unavailable-id` alırsa kodu varis tutuyordur. |
| Oturum bitti, ikisi ayrı ayrı açtı | `(epoch, worldRev)` bilgisi kopyalarda durur. Bir konuk (`wcache`) ya da sahip ileride karşılaştığında uyarı çıkar. Otomatik birleştirme yoktur (§6.1-5). |

### 6.9 Planlı devir (host menüden çıkarken)

1. Host duraklatma menüsünde "Ana menüye dön" seçeneğini kullanır. Devir açık ve en az bir konuk varsa şu sorulur: "[Dümeni ‹varis›'e bırak] [Oturumu kapat (herkes menüye döner)]".
2. Bırakma seçilirse: `handoff{to, E:e+1}` ve son tam replika varise gider. Diğerlerine `bye{code:'migrating', to}` gider. Varis `handoffAck`'ı en çok 5 sn içinde gönderir. Host kendi kaydını `handedOff` ile yazar ve ayrılır. Konuklar doğrudan varise bağlanır; seçim gerekmez. Kayıp yoktur. (inceleme düzeltmesi) `handoff` iletisi de `k_{e+1}` değerlerini taşır, anahtarların kendisini taşımaz. Varis önce özgün oda kimliğini ister (§6.5); host ayrılınca kimlik boşalır.
3. `beforeunload` ve `pagehide` anında en iyi çaba olarak `bye{code:'closing'}` ve son `replD` gönderilir; tarayıcı bunları düşürebilir, o zaman çökme yolu işler.

### 6.10 Zaman çizelgesi ve arayüz

| Olay | Tipik süre |
|---|---|
| Algılama: temiz kapanış / ağ kopması | 0–2 sn / 5–30 sn (inceleme düzeltmesi: Chromium'da ICE `disconnected` ~2,5–5 sn, `failed` ~30 sn **[BELİRSİZ]**) |
| Yeniden bağlanma denemesi ve tanık | (inceleme düzeltmesi) Temiz kapanışta 6–12 sn (`peer-unavailable` ×2). Ağ kopmasında `alive_timeout`'a kadar (test sunucusunda ≤ 90 sn); host'suz çoğunluk varsa beklenmez (3 oyunculuda iki konuk, 4 oyunculuda üç konuk) |
| Oylama | (inceleme düzeltmesi) Ön bağlantıyla < 1 sn; yeni bağlantıyla 2–10 sn |
| Varisin sıcak yeniden başlatması | 2–5 sn (gerçek GPU); SwiftShader testinde 10–30 sn **[BELİRSİZ]** |
| Diğer konukların yeniden eşitlenmesi | 1–3 sn |
| **Toplam** | **(inceleme düzeltmesi) Temiz kapanışta ≈ 10–20 sn; ağ kopmasında ≈ 30–100 sn** |

Arayüz bindirmeleri: "Kaptanla bağlantı koptu…", "Yeni kaptan seçiliyor (Tayfa)…", "Dümen devrediliyor…", "Dümen sende!", "Tayfaya ulaşılamıyor".

---

## 7. TURN planı

### 7.1 Mevcut durum (doğrulandı)

- **`vendor/peerjs/peerjs.min.js` (PeerJS 1.5.5):** Varsayılan yapılandırma `eu = {iceServers:[{urls:"stun:stun.l.google.com:19302"}, {urls:["turn:eu-0.turn.peerjs.com:3478","turn:us-0.turn.peerjs.com:3478"], username:"peerjs", credential:"peerjsp"}], sdpSemantics:"unified-plan"}`. `this.defaultConfig = eu` olarak atanıyor; `Peer` kurucusu `config: ef.defaultConfig, …kullanıcı seçenekleri` biçiminde birleştiriyor. Müzakereci `new RTCPeerConnection(this.connection.provider.options.config)` çağırıyor. Sinyal varsayılanı `0.peerjs.com:443`.
- **`net.js:49-55` `peerOpts()`:** `config` vermiyor. Yani **her bağlantı PeerJS'in ücretsiz TURN'ünü örtük olarak kullanıyor.** 13. belge §1'deki "yalnızca STUN, TURN yok" ifadesi yanlıştır (denetim docClaims).
- **Bu TURN'ün sınırları:** Garanti, SLA ya da kapasite bilgisi yoktur; PeerJS ekibinin topluluk hizmetidir. Yalnız 3478 numaralı port vardır ve URL'de taşıma belirtilmemiştir; RFC 7065'e göre `turn:` için varsayılan UDP'dir **[BELİRSİZ: tarayıcı davranışı F5-12'de `getStats` ile doğrulanır]**. TLS/443 (`turns:`) yoktur, bu yüzden UDP'yi ve 3478'i engelleyen kurumsal ve okul ağlarında çalışmaz. Kimlik bilgileri herkese açıktır ve kötüye kullanım nedeniyle her an kapatılabilir. (inceleme düzeltmesi) PeerJS'in ücretsiz TURN'ü ve Google STUN da oyuncuların IP adreslerini ve trafiğin üst verisini görür; KVKK notu yalnız kendi sunucumuz için değil, bunlar için de geçerlidir. Açık bir `config` verildiğinde PeerJS varsayılanıyla birleştirilmez, onun yerine geçer (`config: ef.defaultConfig, …kullanıcı` yayılımında `config` alanı tümüyle ezilir). Bu yüzden K5-4 açıkken PeerJS'in iki girişi listeye açıkça yazılmalıdır.
- **Eksikler:** Projenin kendi TURN sunucusu, geçici kimlik uç noktası, bağlantı türü tanılaması (`getStats`) ve relay zorunlu yeniden deneme yoktur. Gerçek NAT testi yapılmadı (16. belge §16.6).

### 7.2 Gereklilik (açık ifade)

> **Her ağda (simetrik NAT, mobil operatör CGNAT, UDP'yi engelleyen kurumsal ağ) bağlantıyı garanti etmek için bir TURN sunucusu GEREKİR. Proje bugün kendi TURN sunucusuna sahip değildir. Bu tasarım sunucu kurmaz; sunucu kullanılabilsin diye yapılandırma, tanılama ve yedek stratejiyi ekler. Sunucunun kurulması ya da satın alınması, maliyeti ve kişisel veri yükümlülükleri proje sahibinin kararıdır [SUNUCU].** Arayüz ve belgeler var olmayan desteği varmış gibi göstermez: TURN tanımlı değilse lobide "Aktarım sunucusu yok: bazı ağlarda bağlantı kurulamayabilir" notu görünür.
>
> (inceleme düzeltmesi) TURN gereklidir ama tek başına yeterli değildir. Sinyal sunucusuna giden WebSocket de (`0.peerjs.com:443`) engellenebilir. TLS'i açıp inceleyen kurumsal vekiller `turns:` trafiğini de kesebilir. "Garanti" ancak kendi TURN'ü (`turns:443`) ve kendi sinyal sunucusu olan bir kurulumda, gerçek ağlarda yapılan sınamayla söylenebilir **[SUNUCU]**.

### 7.3 Seçenekler

| Seçenek | Ne sağlar | Gereken | Artı / eksi |
|---|---|---|---|
| **A. Kendi coturn sunucusu** | UDP 3478 + TLS 443 (`turns:`), geçici HMAC kimlikleri (`use-auth-secret`) | Küçük bir VPS, alan adı ve sertifika, kimlik üreten küçük bir HTTPS uç noktası (GitHub Pages statik olduğu için ayrı barındırma: serverless fonksiyon ya da aynı VPS). İsteğe bağlı olarak aynı VPS'te kendi PeerJS sinyal sunucusu (§7.7). | Tam denetim; aylık sabit maliyet ve trafik; bakım ve güvenlik güncellemeleri; aktarılan trafik için kayıt ve KVKK değerlendirmesi |
| **B. Ücretli ya da kotalı TURN servisi** | Yönetilen, çok bölgeli TURN | API anahtarı arka uçta durmalı, istemciye gömülmez; geçici kimlik uç noktası yine gerekir | Hızlı; trafik başına ücret; üçüncü taraf bağımlılığı. Fiyatlar ve ücretsiz kotalar değişkendir, karar anında doğrulanmalıdır. |
| **C. Kullanıcı yapılandırması** | Oyuncu kendi TURN'ünü ya da bir arkadaşının TURN'ünü girer | Yalnız istemci arayüzü | Proje maliyeti yok; teknik kullanıcıya yöneliktir |
| **D. PeerJS'in ücretsiz TURN'ü** | Bugünkü örtük davranış, açık ve etiketli olarak | Hiçbir şey | Garantisiz, 443 yok (K5-4) |

**Öneri (K5-3):** C ve D kodda hemen yapılır. A ya da B için tasarım hazırdır (geçici kimlik uç noktası arayüzü); sunucu kararı verildiğinde yalnız URL girilir. (inceleme düzeltmesi) Çoğu durumda tek tarafta çalışan TURN yeter: relay adresi herkese açıktır ve öteki tarafın NAT'ı dışa doğru UDP'ye izin veriyorsa bağlantı kurulur. UDP'yi tümüyle engelleyen ağdaki oyuncunun ise kendi `turns:` (TCP/TLS 443) erişimi gerekir. Lobide bu ayrım açıkça yazılır.

### 7.4 ICE yapılandırma arayüzü (`js/net/ice.js`)

```js
ice.servers() → [ kullanıcıTURN?, projeTURN? (uç noktadan, ttl önbellekli), peerjsTURN? (K5-4), STUN ]  // en çok 4 giriş (fazlası keşfi yavaşlatır)
peerOpts() → { ...sinyal, config: { iceServers: await ice.servers(), iceTransportPolicy: ice.relayOnly ? 'relay' : 'all', sdpSemantics: 'unified-plan' } }
```

- **Kaynaklar, öncelik sırasıyla:**
  1. Adres parametreleri `?turn=turns:host:443?transport=tcp&turnuser=…&turnpass=…` (13. belge biçimi; yalnız test için, çünkü parola geçmişte kalır).
  2. Ayarlar → yeni "Online" sekmesi (`settingsPanel.js`): TURN URL'leri, kullanıcı adı, parola; "Yalnız aktarım (IP adresimi gizle)"; "PeerJS'in ücretsiz TURN'ü (garantisiz)"; "Bağlantıyı sına".
  3. Derleme sabiti ya da `?turnapi=` ile geçici kimlik uç noktası: `GET → {iceServers, ttl}`. Sonuç `ttl`'e kadar `sessionStorage`'da tutulur; alınamazsa sessizce diğerlerine düşülür.
- **Saklama:** `dksh.net` (ayarlar). Parola dışa aktarılmaz (Faz 4 dışa aktarma beyaz listesi) ve arayüzde bunun yazdığı belirtilir.
- **`peerOpts` eşzamansız olur:** `_newPeer` (`net.js:188-196`) önce `await ice.servers()` çağırır.

### 7.5 Tanılama

- **Bağlantı kurulduktan sonra:** `conn.peerConnection.getStats()` çağrılır. Seçili aday çiftinden (`transport.selectedCandidatePairId` ya da `nominated` ve `succeeded`) yerel ve uzak `candidateType` (`host`/`srflx`/`prflx`/`relay`), `protocol`, `relayProtocol` ve `currentRoundTripTime` okunur. 5 sn'de bir yenilenir.
- **Gösterim:** "Doğrudan (yerel ağ)", "Doğrudan (NAT)", "Aktarımlı (TURN/UDP)", "Aktarımlı (TURN/TLS 443)" ve RTT. Host bu bilgiyi roster'a ekler (`nt`, `rtt`); herkes takım listesinde görür.
- **"Bağlantıyı sına" (karşı taraf gerektirmeyen öz-sınama):** Yapılandırılmış sunucularla bir `RTCPeerConnection` kurulur, `createDataChannel` + `createOffer` + `setLocalDescription` çağrılır ve adaylar 6 sn toplanır. `relay` adayı varsa TURN çalışıyordur, `srflx` varsa STUN çalışıyordur. Yalnız `host` adayı varsa NAT dışına çıkılamıyordur. Sonuç kullanıcıya açıkça yazılır.

### 7.6 Başarısızlıkta strateji

1. Bağlantı 12 sn içinde açılmazsa ya da ICE `failed` olursa ve bir TURN tanımlıysa (D hariç) aynı hedefe `iceTransportPolicy:'relay'` ile bir kez daha denenir. (inceleme düzeltmesi) `iceTransportPolicy:'all'` relay adaylarını zaten dener; bu yüzden ikinci denemenin yararı sınırlıdır. Yararlı olduğu durumlar: geçici kimliğin geç gelmesi, TCP/TLS relay'in ilk denemede 12 sn'ye sığmaması ve kullanıcının yalnız aktarım istemesi. Ucuz olduğu için kalır.
2. Yine başarısızsa ileti: "Doğrudan bağlantı kurulamadı. Ağın eşler arası bağlantıyı engelliyor olabilir. Ayarlar → Online'dan bir TURN sunucusu tanımla ya da başka bir ağ dene."
3. (inceleme düzeltmesi) Devirde ön bağlantı (§6.4a) zaten yapılandırılmış ICE sunucularıyla kurulur; host kaybında ayrıca relay denemesi gerekmez. İlk taslaktaki 6 sn'lik tur, doğrudan ve relay denemesini birlikte içine alamazdı (12 sn zaman aşımı).

### 7.7 Sinyal sunucusu

PeerJS bulutu (`0.peerjs.com`) da garantisiz bir üçüncü taraftır. Seçenek: aynı VPS'te `peer` paketiyle kendi PeerServer'ı; testler zaten bunu kullanıyor (`tests/peer-server.cjs`). Ek getirisi: dönem takma adlarında daha kısa `alive_timeout` ve ileride 12 sabit herkese açık yuvanın (E-22) yerini alacak küçük bir lobi uç noktası **[SUNUCU]**.

### 7.8 Test edilebilirlik

- **Bu ortamda sınanabilen:** Yapılandırma birleşimi (`ice_config.mjs`). Oyun içinde `RTCPeerConnection.getConfiguration().iceServers` değerinin TURN'ü içermesi. Öz-sınamanın arayüzü. Relay yeniden deneme yolu (zorla `failed` benzetimi).
- **Bu ortamda sınanamayan:** Gerçek NAT ve gerçek TURN aktarımı; dış ağ ve NAT yok (08. belge §8.4). İsteğe bağlı olarak konteynere `coturn` kurulabilirse (127.0.0.1) `iceTransportPolicy:'relay'` ile mekanik aktarım sınanır. Gerçek NAT testi üretim öncesi elle yapılır: iki farklı ev ağı, mobil hotspot, UDP'yi engelleyen ağ. (inceleme düzeltmesi) Konteynerde coturn kurulu değil; yalnız test için kurmak yeni bir bağımlılık demektir ve gerekçe ister. Ayrıca yalnız Chromium var. Chromium'un geri döngü adresli (127.0.0.1) bir TURN sunucusundan relay adayı toplayıp toplamadığı bilinmiyor **[BELİRSİZ]**.

---

## 8. Dosya bazında değişiklik ve uygulama sırası

### 8.1 Yeni modüller

| Dosya | Sorumluluk | Ana fonksiyonlar | ~Satır |
|---|---|---|---|
| `js/net/session.js` | Bağlantı durum makinesi, kalp atışı, iki sinyal, kendi takılmasının telafisi, yeniden bağlanma, nedenler, hayalet yuva | `Session` (host: konuk başına; konuk: tek), `tick(now)`, `onIce`, `onMsg`, `reconnect()`, `ghost()`, `bye(code)` (inceleme düzeltmesi) `tick` ayrı bir `setInterval(250 ms)` ile koşar. Eklenenler: hayaletten oyuna geçiş, `warm` izinleri, ICE için 8 sn bekleme. Yaklaşık +60 satır. | 450 |
| `js/net/stateChannel.js` | U kanalı (negotiated), yedek, `sq`, tıkanıklık | `open(conn)`, `send(obj)`, `onMsg`, `fallback` | 160 |
| `js/net/interp.js` | NetInterp, saat eşleme | `NetInterp`, `ClockMap{dMin,hostNow}`, `push/sample/teleport` | 260 |
| `js/net/aoi.js` | İlgi alanı, öncelik biriktirici, konuk başına dilim, `ent±` | `buildSlices(pid)`, `tiers`, `acc`, `entEnter/Leave`, nicemleme | 450 |
| `js/net/replica.js` | Replika üretme ve uygulama, sıkıştırma, parçalar, `heirs`, `replD` | `buildFull()`, `applyTransient()`, `pack/unpack`, `heirsOrder()` | 400 |
| `js/net/migrate.js` | Seçim, oy, `claim`, dönem, takma ad, geri çekilme, planlı devir | `onHostLost()`, `round(r)`, `vote()`, `claim()`, `promote(replica)`, `handoff(to)`, `probeAliases()`, `demote()` (inceleme düzeltmesi) Eklenenler: nüfusta host, oy kirası, `cert` üretme ve doğrulama, dönem anahtar zinciri (`keyChain`), varis ön bağlantısı (`heirLink`), önce özgün kimlik sonra takma ad. Yaklaşık +300 satır. | 550 |
| `js/net/ice.js` | ICE yapılandırma, kimlik uç noktası, tanılama, öz-sınama | `servers()`, `stats(conn)`, `selfTest()` | 260 |
| `js/net/trade.js` | Host ticaret motoru + konuk istemcisi | `ask/reply/offer/lock/confirm/cancel`, `execute(T)` | 380 |
| `js/net/diceTable.js` | Host zar masası motoru | `open/join/leave/ready`, `round(T)` | 260 |
| `js/ui/tradePanel.js` | Ticaret penceresi | `openTrade(T)` | 260 |
| `js/net/netShape.js` | **Yalnız `?test=1`**: gecikme, titreşim, kayıp, tıkanma, kesme, `busy` | `shape(conn, {lat, jit, kayip})`, `stall(ms)`, `cut(ms)`, `busy(ms)`, `hide(on)` (inceleme düzeltmesi) `cut(ms, {tasima:true})`: `peerConnection.close()` ile birlikte `blockPeer`. | 180 |
| `js/net/diag.js` | Tanı halkası (son 500 olay), bayt sayaçları | `diag.push(k, d)`, `diag.dump()`, `diag.bytes` | 120 |

### 8.2 Değişen dosyalar

| Dosya | Fonksiyonlar ve değişiklik |
|---|---|
| `js/net/net.js` | `peerOpts` → `ice.servers()` (eşzamansız). `host()`: devir ayarı, `ownerGid`, takma ad talebi. `_onConn`: U kanalı, `Session`. `_hostData` (Faz 2 `_onRaw`): `st`, `helm`, `boatSt` U'dan `sq` ile gelir; yeni türler `loaded`, `hb`, `bye`, `trade`, `dice`, `vote`. Kalp atışı `:704` → `session`. `_dropPeer` → hayalet yuva + dümen sıfırlama. `join()`: takma ad yoklaması, `resume`, `disconnected` → `peer.reconnect()`, kapanışta `hostLeft` yerine `session.lost()`. `_clientData`: `snap` dilimleri → `aoi`/`interp`; `ent`, `ntf`, `evt`, `tel`, `bossFx`, `shipDmg`, `heirs`, `repl*`, `claim`, `stale`, `tradeSt`, `diceSt`, `hostPause`. `_hostSnapshot` → `aoi.buildSlices`. `RemotePlayer`: NetInterp, `setAppearance`, meşale, `away` görünümü. `kick(pid, code)` gerçekten gönderilir. (inceleme düzeltmesi) `host()`: önce kayıttaki `room.code` denenir (K5-12). İkinci Peer nesnesiyle özgün kimlik ya da takma ad istenir. `replaced` yalnız etkin `hostConn`'dan gelirse uygulanır. `hb`/`hbA` oyunda `ping`'in yerini alır. `shipCmdR`, `heirOk` ve `claimFail` eklenir. |
| `js/main.js` | `hostLeft` (`:313-318`) → oturum durumuna göre: yeniden bağlanma, devir ya da menü; E-14 temizliği. `startOnlineGuest` (`:187-197`): `welcome.spawn`, `token`. `applyWorld` (`:325-342`): yerinde ve tekrar uygulanabilir; `spawn` yoksa liman. Duraklatma menüsü: Korsan Kodu, planlı devir. `pagehide`. (inceleme düzeltmesi) `sessionStorage['dksh.rejoin']` ile yenileme sonrası katılım; `worldPart{resync}` dalı (konum, gemi ve hava atanmaz). |
| `js/game/game.js` | `start(opts)`: `token` denetimi (F6), `resume` → `applyTransient`, `epoch`. `serialize`: devir başlık alanları. `update`: Worker saati kipi (§3.10). Gemi döngüsünde `predicted` dalı (F5-7B). (inceleme düzeltmesi) Eklenenler: `update(dt, rawDt)` ile kırpılmamış kare saati (`fc`) ve `abortStart({keepNet})`. |
| `js/core/engine.js` | `bgClock` (Worker), `visibilitychange` (inceleme düzeltmesi) Kırpmadan önceki `rawDt` (`engine.js:61-62`) güncelleyicilere iletilir. |
| `js/ship/ship.js` | `applyNet` → NetInterp örneği + `hk` onay kuralı (`:714`). `clientUpdate` (`:566-579`) → `interp.sample`. `predictUpdate`, `reconcile`. Hasar alanları `shipDmg`'ye taşınır. `netFull()`. (inceleme düzeltmesi) `shipCmdR` işlenir. Tahminde `ocean.time` ve esinti host saatinden türetilir. |
| `js/game/shipControl.js` | Yelken ve çapa komutları `cs` ile. `leaveStation` (`:194-213`) ve kilit düşüşünde host'ta dümen sıfırlama. |
| `js/player/player.js` | `netState` (`:986-993`): `aq`, `flags`. `_updateHelm` (`:905-923`): yelken komutu ve bekleyen komut. |
| `js/game/enemies.js`, `js/wildlife/animals.js`, `js/wildlife/megafauna.js`, `js/game/bosses.js` | `applySnapshot` → `ent±` + dilim; "listede yoksa sil" kuralı kalkar (`enemies.js:1658`, `animals.js:837`, `megafauna.js:739-740`). `_interp` → NetInterp. `_players` (`enemies.js:518-523`): `away` süzgeci. `netFull()`; host `hist` halkası. Boss `bossFx`; telgraf `tel`. |
| `js/game/events.js` | Bağlam rotasyonu (`:89-98`, `_classic` `:122-156`). Bildirimler `ntf`. `collectFloating` (`:200-230`) ödülü `pid`'e yazar (Faz 2 profili); kazazede sitesi dışlamalı; gök taşı XP'si. Düşman gemisi katılımcıları ve paylaşım (`:301-316`). `netFull()`. |
| `js/game/worldEvents.js` | `context(player)` (`:78-85`), `_updateWisps` en yakın oyuncu (`:163-190`), buzdağı `ent±` (`:321-337`, `:368`), meteor `evt`, `netFull()` (inceleme düzeltmesi) `:368` ve `:385-386` en yakın oyuncuya göre (`nearestPlayer`). |
| `js/game/combat.js` | Patlama (`:44-54`) → uzak oyuncular (Faz 2 `hostCombat` ile) |
| `js/treasure/treasure.js` | `worldPart.floats`; yükleme kuyruğu sonrası yeniden eşitleme; `randomSite(exclude)`; `netFull()` |
| `js/game/quests.js` | `onRemoteAdvance(stage)` (konuk bildirimi); K5-2'ye göre XP |
| `js/game/progress.js` | Roster `lvl/rank` (host); konukta yerel kazanç yok (Faz 2) |
| `js/ui/dice.js` | "Tayfa masası" sekmesi |
| `js/ui/hud.js` | Takım listesi (`:462-469`): RTT, bağlantı türü, yanıt vermiyor, hayalet, seviye. `:283` ağ satırı. Bindirmeler. |
| `js/ui/menu.js` | Oda kurma: devir ayarı. Lobi: bağlantı rozetleri, takma adlı katılma. Duraklatma (`:343-357`): Korsan Kodu, planlı devir, konuk için "Kişisel ilerlemeyi kaydet" (Faz 4). |
| `js/ui/settingsPanel.js` | "Online" sekmesi (TURN, yalnız aktarım, öz-sınama) |
| `js/world/ocean.js`, `js/world/sky.js` | (inceleme düzeltmesi) Konukta `ocean.time`, `windDir` ve esinti fazı host saatinden alınır (F5-7B). |
| `js/net/guestBook.js` (Faz 2) | (inceleme düzeltmesi) Profile `gb` (bağlı altın) eklenir; dönem anahtarı türetilir (`k_E`). |
| `js/core/save.js` | `dksh.inherit.*`; devir başlık alanları (Faz 4 `saveSchema`'ya kayıt) (inceleme düzeltmesi) `room` başlık alanı. `dksh.inherit.*` Faz 4'ün anahtar düzenine, kota bütçesine ve dışa aktarma kurallarına eklenir. |
| `js/net/schema.js`, `js/net/guard.js` (Faz 2) | PROTO 3; yeni türlerin şemaları; U türleri için `sq` istisnası; yeni kova sınıfları `trade`, `dice`, `migr` |
| `tests/harness/coop.cjs` | `--log warn`, rapora `diag`, `--netem`, `--repeat N`, `--parallel-start`; Faz 2 `--split`, `--latency` (inceleme düzeltmesi) `--peer-server own` (sinyal sunucusunu alt süreç olarak başlatıp durdurma; R9), beşinci sayfa için ad (R7), tanı kaydıyla taban koşusu (`--repeat`). |

### 8.3 Uygulama sırası

Her adım ayrı bir commit ya da PR'dır. Kabul testi geçmeden sonraki adıma geçilmez. Her adımda tek oyunculu 00–17 senaryoları ile uyarlanmış `06a`–`06d` ve Faz 2–4 senaryoları yeşil kalmalıdır. (inceleme düzeltmesi) Tablo uygulama sırasıyla dizilmiştir: F5-12 numarasını korur ama F5-2'nin hemen ardından gelir. Bağlantı sorunlarını görünür kılar ve Faz 2–4'e bağlı değildir (13. belgenin önerdiği sıra).

| Adım | İş | Dosyalar | Test / kabul | Gün |
|---|---|---|---|---|
| **F5-0** | Test altyapısı ve tanı. (inceleme düzeltmesi) Önce değiştirilmemiş 06c `--repeat 5` ile tanı kaydı açık koşulur. Sonra D4-02'nin deterministik zorlaması (kırmızı taban), harness'te sinyal sunucusu denetimi ve `cut` taşıma kipi gelir. | `coop.cjs`, `netShape.js`, `diag.js`, `06z` iskeleti | Taban koşusunda düşen konuğun kapanış nedeni kaydedilir. Z2/Z3 v0.4 kodunda "menu" üretir. `diag` içinde `drop:silence` kaydı görünür | 2 |
| **F5-1a** | (inceleme düzeltmesi) Oturum saati (`session.tick`, ayrı `setInterval`), kendi takılmasının telafisi (aralık gecikmesi), iki vuruş, nedenli düşürme (`kick`/`bye`) | `session.js`, `net.js:239`, `:704`, `:705-708`, `:577` | Node `heartbeat_rules.mjs`; 06z Z3; 06r R1, R12 | 1 |
| **F5-1b** | (inceleme düzeltmesi) Fazlar: `warm`/`loaded` (20 sn tavanlı), PeerGate izinleri (`warm` = `game`), yükleme iptal belirteci (yalnız `bitti`), `worldPart{resync}`, E-14 temizliği | `session.js`, `guard.js`, `game.js:101-150`, `main.js:313-342` | 06z Z1–Z2; 06c × 10 = 10/10 (D4-07 beklentisi §9.5'e göre uyarlanır); 06a2 H13; 06r R5, R8 | 1,5 |
| **F5-2** | ICE iki sinyali (8 sn), hayalet yuva (yerinde sürdürme dahil), otomatik yeniden bağlanma, yerinde yeniden eşitleme, `welcome.spawn`, renk havuzu. (inceleme düzeltmesi) Ayrıca oda kodu kalıcılığı (K5-12) ve yenileme sonrası geri dönüş | `session.js`, `net.js`, `main.js:325-342`, `save.js` | 06r R1–R3, R7–R9, R11 | 3,5 |
| **F5-12** | (inceleme düzeltmesi: öne alındı) TURN ve ICE: yapılandırma (PeerJS girişleri açıkça yazılır), ayarlar, tanılama, öz-sınama, relay yeniden deneme | `ice.js`, `settingsPanel.js`, `menu.js`, `hud.js` | Node `ice_config.mjs`; 06r R10 | 2,5 |
| **F5-3** | PROTO 3 zaman damgası, `ClockMap`, NetInterp (uzak oyuncu ve konuk gemisi), kaynak zaman damgasıyla yeniden damgalama; (inceleme düzeltmesi) `fc` ile eşleme, 2 sn pencere, `ts` birimi | `interp.js`, `net.js`, `ship.js`, `schema.js` | Node `interp_buffer.mjs`; 06s S1–S3 | 3 |
| **F5-4** | U kanalı, yedek, `sq`, tıkanıklık | `stateChannel.js`, `guard.js` | 06s S6; kayıplı koşular | 2 |
| **F5-5** | İlgi alanı, `ent±`, nicemleme, öncelik biriktirici, `shipDmg`, `tm` 1 Hz; (inceleme düzeltmesi) dürbün konisi (`st.s.lk`) | `aoi.js`, sistemlerin `applySnapshot` fonksiyonları | Node `aoi_tiers.mjs`, `priority_acc.mjs`; 06s S4–S5; 06b/06d regresyonu | 3,5 |
| **F5-6** | Kalan varlıklar NetInterp'e; `hist` ve `act.vt` (K5-8 kapalı) | `enemies/animals/megafauna/bosses/events/treasure` | 06b F-06/F-13; Node | 2 |
| **F5-7** | Gemi: A) komut onayı ve dümen sıfırlama; (inceleme düzeltmesi) `hk` son işlenen komuttur, ret `shipCmdR` ile bildirilir. B) Tahmin ve uzlaştırma (bayraklı; okyanus ve esinti saati host'tan; yalnız `BUILD_D` içinde) | `ship.js`, `shipControl.js`, `player.js:905-923`, `game.js`, `ocean.js`, `sky.js` | 06u U1–U6; Node `helm_ack.mjs` (ret ve kayıp dahil) | 3,5 |
| **F5-8** | Dinamik olaylar (madde 1–5). (inceleme düzeltmesi) Host'taki host-merkezli ömür ve silme kuralları da en yakın oyuncuya göre yazılır | `events.js`, `worldEvents.js` (`:368`, `:385-386`), `combat.js`, `treasure.js` | 06t T1–T10 | 3,5 |
| **F5-9** | Konuk rütbesi uçtan uca, roster `lvl`, Korsan Kodu | `menu.js`, `net.js`, `hud.js` | 06w W1–W4 | 2 |
| **F5-10** | Ticaret. (inceleme düzeltmesi) Profile `gb` (bağlı altın) eklenir; şema PROTO 3'e girer | `trade.js`, `tradePanel.js`, `guard.js`, `guestBook.js` | 06v V1–V5; Node `trade_atomic.mjs` | 3,5 |
| **F5-11** | Zar masası; (inceleme düzeltmesi) konuk nonce'ları ve geri sayımda koltuk kilidi | `diceTable.js`, `dice.js` | 06v V6–V8; Node `dice_table.mjs` | 2 |
| ~~F5-12~~ | (inceleme düzeltmesi) F5-2'nin ardına taşındı | | | |
| **F5-13** | Host arka planda: `hostPause` ve Worker saati | `engine.js`, `game.js`, `net.js` | 06r R6 | 1,5 |
| **F5-14** | Devir A: replika, `heirs`, `replD`, boyut ve serileştirme maliyeti ölçümü, devir ayarı. (inceleme düzeltmesi) Ayrıca dönem anahtar zinciri ve varis ön bağlantısı (`heirOk`) | `replica.js`, `migrate.js` (`keyChain`, `heirLink`), sistemlerin `netFull()` fonksiyonları | Node `replica_roundtrip.mjs`, `key_chain.mjs`; 06x X0 | 4 |
| **F5-15** | Devir B: terfi (sıcak yeniden başlatma) ve planlı devir (2 oyuncu); (inceleme düzeltmesi) `abortStart({keepNet:true})`, `claimFail`, `handoff` içinde `k_{e+1}`, önce özgün kimlik | `migrate.js`, `game.js`, `main.js`, `save.js` | 06x X1 | 3 |
| **F5-16** | Devir C: çökmede seçim. (inceleme düzeltmesi) Nüfusta host, oy kirası, `cert`, önce özgün kimlik sonra takma ad, sertifikalı geri çekilme, çökme devri bayrağı (varsayılan kapalı). Ayrıca dönem, eski host dönüşü ve kayıt bütünlüğü | `migrate.js`, `net.js`, `save.js`, Faz 4 şeması | 06x X2–X5; 06y Y1–Y6; Node `election.mjs` (`devir_inceleme.mjs` genişletilmiş) | 5 |
| **F5-17** | 4 oyunculu kabul takımı; 13. belgenin ve TEST_RAPORU'nun güncellenmesi; tam regresyon | belgeler | 06z × 10, 06y, tam regresyon | 2,5 |
| | **Toplam** | | | **≈ 52** (inceleme düzeltmesi; ilk taslak ≈ 46) |

### 8.4 Büyüklük tahmini

Yeni modüller yaklaşık 3 900 satır, değişen yaklaşık 25 dosyada +2 100 / −600 satırdır. Testler: 9 co-op senaryosu (yaklaşık 2 500), 10 Node testi (yaklaşık 700), harness eki (yaklaşık 300). Toplam yaklaşık 9 500 satır, bunun yaklaşık 6 000'i üretim kodudur. Süre yaklaşık 46 iş günü; risk payıyla 40–55 gündür. (inceleme düzeltmesi) İnceleme eklemeleriyle üretimde yaklaşık +1 000, testte yaklaşık +300 satır gelir: toplam ≈ 10 800 satır. Süre ≈ 52 iş günüdür; risk payıyla 45–62.

### 8.5 Faz bağımlılıkları ve PROTO

- **F5-0 / F5-1:** v0.4 üstünde de çalışır. Önerilen başlangıç Faz 2 Adım 3'ün (raw, `hi`) ardındandır, çünkü `session.js` Faz 2'nin `PeerGate` fazlarını genişletir. (inceleme düzeltmesi) F5-12 de Faz 2'ye bağlı değildir; v0.4'ün `peerOpts` (`net.js:49-55`) yolu üstünde çalışır.
- **F5-3 ve sonrası:** Faz 3 (`frameClock`, çizim evresi) gerekir.
- **F5-9, F5-10, F5-11:** Faz 2 Adım 7–10 gerekir (`gbook`, `tx`, `awardXp`).
- **F5-14 ve sonrası:** Faz 4 gerekir (v3 başlık, `worldId`, `saveSeq`, `'loading'`/`abortStart`, `wcache`).
- **PROTO:** İlk tel değişikliği F5-3'tedir ve `PROTO` 3 olur. Geliştirme dalındaki sonraki adımlar şema imzası fikstürünü "PROTO 3 taslak" olarak günceller; yayında imza dondurulur. Faz 2'nin `net_schema.mjs` testi buna göre ayarlanır.
- **Faz 2 kapısına eklenenler:** U türleri (`st`, `helm`, `boatSt`) için `sq` istisnası. Yeni kova sınıfları: `trade` (4/sn, patlama 8), `dice` (2/sn, patlama 4), `migr` (`vote`, `repl` onayları; 2/sn). `session` sınıfına `hb` ve `loaded` eklenir (1/sn, patlama 3). (inceleme düzeltmesi) Ayrıca: `warm` fazı (`game` izinleriyle); `heir` fazı (`hb`, `vote`, `claim`, `hello`); oyunda `hb`/`hbA` (`ping` yalnız lobide); `shipCmdR`, `heirOk`, `claimFail`; profilde `gb`; roster'da `lvl` ve `rank`; `hi`, `info` ve `welcome`'da `e`; `snap` dilimlerinde `fc`; `st.s.lk`; `snap.tm` içinde `ot`, `wd`, `ws`. Faz 2'nin `load` 60 sn ve `game` 15 sn kuralları kapıdan çıkar.

---

## 9. Test planı

### 9.1 Altyapı

| Araç | Ne yapar |
|---|---|
| `--log warn` | `console.warn` ve `info` iletilerini de rapora yazar (bugün yalnız `error`, `coop.cjs:34`) |
| `report.diag` | Her sayfanın `DK.net.diag.dump()` çıktısı: düşürme, yükseltme, kopma, yeniden bağlanma, seçim, bayt sayaçları |
| `--netem "lat=120,jit=30,kayip=5"` | `netShape` her iki kanalı biçimlendirir: U'da kayıp ve gecikme; R'de kayıp yerine yeniden iletim bekletmesi (RTO ≈ 200 ms) ve HOL. Konteynerde tc/netem yok (08. belge §8.4), bu yüzden uygulama katmanında yapılır. |
| `DK.netTest.stall(ms)`, `cut(ms)`, `busy(ms)`, `hide(on)`, `blockPeer(pid)` | Tıkanma, iki yönlü kesme, ana iş parçacığı takılması, görünürlük benzetimi, iki konuk arasında NAT benzetimi (`peer.connect` hedefini reddeder) (inceleme düzeltmesi) `cut(ms, {tasima:true})`, konuk tarafında `conn.peerConnection.close()` çağırır ve süre boyunca `blockPeer(host)` uygular. Uygulama katmanındaki kesme ICE'yi düşürmez (aynı Chromium içinde, geri döngü üzerinden); bu yüzden kopma senaryoları taşıma kipini kullanır. Harness, yerel sinyal sunucusunu kendi alt süreci olarak başlatıp durdurabilir (`--peer-server own`; R9). |
| `--repeat N`, `--parallel-start` | Aynı senaryoyu N kez koşar; konukları aynı anda başlatır |
| Faz 2 | `--split`, `--latency`, `evil.cjs`, `invariants()` |
| Kare ölçümü | `DK.netTest.trace(pid, sn)`: uzak avatarın çizim konumunu kare kare (`DK.sim` küçük dt ile) kaydeder; en büyük adım ve ışınlanma sayılır |

### 9.2 İki oyunculu senaryolar (önce bunlar)

| Dosya | Kontroller |
|---|---|
| **`06r_baglanti.cjs`** | R1 Host `[At]` → konukta "Kaptan seni odadan çıkardı", otomatik bağlanma yok. R2 `cut(10000, {tasima:true})` (inceleme düzeltmesi: uygulama kesmesinde ICE bağlı kalır ve 10 sn yalnız "yanıt vermiyor" üretir) → host'ta hayalet yuva, konukta "yeniden bağlanılıyor"; kesme bitince ≤ 5 sn'de sürer, renk aynı, roster tek kayıt. R3 Konuk sayfası yenilenir → ≤ 10 sn'de aynı konum (≤ 3 m), renk ve profil. R4 Host `busy(17000)` + hemen `session.tick()` (inceleme düzeltmesi; v0.4'te `net.update`) → konuk düşmez. R5 Konuk ilk karesinden sonra `busy(17000)` → `playing` kalır. R6 `hide(true)` → konukta ≤ 2 sn'de "Kaptan uzakta"; Worker saatiyle dilim ≥ 5 Hz. R7 4/4 dolu odada çöken konuk geri girer, yeni 5. kişi "Oda dolu" alır (`--players 4` ile ayrı koşu). R8 Konukta envanter açıkken oturum biter → `ui.stack` boş, `G.uiOpen=false`. R9 Sinyal sunucusu 5 sn durdurulup başlatılır → oturum sürer; ardından yeniden bağlanma çalışır. R10 `?turn=` ile `getConfiguration().iceServers` TURN'ü içerir; rozet "Doğrudan (yerel ağ)" gösterir. (inceleme düzeltmesi) R11 `cut(12000)` (uygulama kipi): host'ta 4 sn'de "yanıt vermiyor", 8 sn'de soluk avatar; hayalet yuva yok; kesme bitince oturum yerinde sürer. R12 `fpsLimit = 0.01` iken bir konuk bağlamı kapanır: host'ta `tick` çağrılmadan da en çok 15 sn'de hayalet yuva (oturum saati rAF'tan bağımsız). |
| **`06s_akicilik.cjs`** | S1 Dilimlerde `ts/sq` (inceleme düzeltmesi: ve `fc`) var; `dMin` yakınsıyor. S2 `--netem lat=100,jit=30,kayip=5` → koşan konuğun host'taki görüntüsünde en büyük kare adımı ≤ 2 × normal adım, ışınlanma 0. S3 `stall(1500)` → ışınlanma 0, adım ≤ 2×. S4 Konuk 2 km uzakta → bayt/sn yakın konuğunkinin ≤ %40'ı; 300 m'deki düşman gönderilmiyor; 2 km'deki oyuncu ≈ 0,5 Hz. S5 Konuk başına ≤ 96 kbit/sn. S6 `dksh-u` kanalı açık ya da `uFallback` kaydı var. |
| **`06t_dinamik_olaylar.cjs`** | T1 Varil konuğun yakınında doğar (`DK.netTest.eventNear(pid,'barrel')`) → konukta `ntf` + nesne → konuk alır → profilde eşya, iki tarafta da nesne kalkar. T2 Şişe → `item{use}` → harita → kazı → sandık → açma. T3 Kazazede → konukta harita (site önceki haritalarda yok) + 50 altın + diyalog. T4 Gök taşı → görsel → parça → `gok_tasi` + 80 XP konuğa. T5 Hayalet ışıklar host'tan uzakta, konuğun liderliğinde tamamlanır. T6 Düşman gemisi birlikte ele geçirilir → altın paylaşılır, XP K5-2'ye göre. T7 Konuğa 2 m'de patlama → konuğun canı düşer. T8 Host varil doğurur, sonra konuk katılır → konuk varili görür. T9 Konuk 2 km uzakta, buzul olayı sürerken → geometri sayacı dalgalanmaz. T10 Fırtına ve volkan bildirimleri konukta görünür. |
| **`06u_dumen.cjs`** | U1 `--netem lat=60` ile rastgele anlarda 10 Boşluk → host'ta 10 geçiş, konuk görüntüsü de doğru. U2 A basılıyken E ile bırakma → host'ta `rudderInput = 0` (≤ 1 dilim). U3 Dümende `cut` → host'ta dümen 0, kilit boş. U4 (F5-7B) `lat=120` ile dönüşte tahmin hatası ≤ 1,5 m, düzeltme sıçraması ≤ 0,5 m. U5 Güvertedeki diğer gözlemci gemiyi akıcı görür (kare adımı ≤ 2×). (inceleme düzeltmesi) U6 Komut reddi: konuk yelken istasyonundan uzaklaştırılıp `sails` gönderir → `shipCmdR` gelir, bekleme ≤ 3 sn'de kapanır, görüntü host'un değerine döner. |
| **`06v_ticaret_zar.cjs`** (2 oyuncu, V6 için ayrıca 3 oyuncu) | V1 İki yönlü eşya ve altın takası; korunum: önce ve sonra toplamlar eşit, `ledger.check()` true. V2 Ret, zaman aşımı, 8 m'den uzaklaşma, takas sırasında `cut` → hiçbir şey değişmez. V3 Kilitten sonra teklif değiştirilemez; kilitten önceki değişiklik onayları sıfırlar. V4 Alıcının çantası dolu → `yer`, hiçbir şey değişmez. V5 Bağlı eşya ve ithal altın verilemez. V6 Zar: 2 ve 3 oyunculu tur; altın toplamı korunur (bonus hariç); kazanan atılan zarlara göre doğru; eşitlik turu. V7 Atış anında altını yetmeyen oyuncu masadan kalkar, tur diğerleriyle sürer. V8 Hız ve saatlik sınırlar. |
| **`06w_konuk_rutbe.cjs`** | W1 Konuk XP kazanır ve seviye atlar → host kaydı → host sayfası yeniden yüklenir ve dünya devam eder → konuk döner; seviye, XP ve yetenek aynı. W2 Konuk bağlamı `beforeunload` olmadan kapanır; aynı `storageState` ile yeni bağlamda katılır; profil aynı. W3 Korsan Kodu yeni bağlamda içe aktarılır; aynı profil gelir, eski bağlantı `replaced` alır. W4 Roster ve takım listesinde seviye görünür. `dksh.guest.0` bayt bayt aynı kalır (Faz 2/4). |
| **`06x_devir_iki.cjs`** | X0 Varise replika gidiyor; boyut ölçülür. X1 Planlı devir: host menüden çıkar ve "Tayfa'ya bırak" seçer → konuk host olur (dönem 1); altın, gemi, sandık ve görev aynı; konuğun kaydı yazılır (`inherited`). X2 Çökme: host bağlamı kapanır → tek hayatta kalan (Q=1) en çok 60 sn içinde devralır (SwiftShader payı); dünya sürer. X3 Eski host yeni sayfayla döner → "Bu dünya şu an Tayfa'nın odasında sürüyor" → konuk olarak katılır ve eski oyuncu verisini alır → "Dümeni sahibine geri ver" → dönem 2; eski host'un yuvası `(2, rev)` olur. (inceleme düzeltmesi) X4 Host canlı ama bölünmüş: konukta `blockPeer(host)` ve `cut(…, {tasima:true})`, host sinyal sunucusunda kayıtlı → konuk 60 sn boyunca devralmaz, host geri çekilmez; engel kalkınca normal yeniden bağlanma olur. X5 Sertifikasız takma ad: üçüncü bir sayfa `<KOD>-e1` kimliğini alır → host geri çekilmez, `diag`'da `alias:nocert` görünür. |

### 9.3 Dört oyunculu senaryolar (iki oyunculular geçtikten sonra)

| Dosya | Kontroller |
|---|---|
| **`06y_devir_dort.cjs`** | Y1 Host bağlamı kapanır → varis `heirs` sırasının ilki → diğer iki konuk ona bağlanır (≤ 60 sn) → herkes 2 uzak oyuncu görür; gemi konumu ≤ 20 m, sandık ve kese sayıları son replikayla eşit, profiller aynı, görev aşaması aynı; yeni host kaydında dönem 1. Y2 Çift host engeli: `blockPeer` ile Tayfa ↔ Lostromo ulaşılamaz → yalnız Tayfa host olur (Topçu'nun oyuyla Q = 2); Lostromo "Tayfaya ulaşılamıyor" görür; sayfalar arasında host sayısı = 1. Y3 Eski host döner → daha yüksek dönemi görür, geri çekilir (inceleme düzeltmesi: yalnız doğrulanmış `cert` ile), konuk olur. Y4 Yalnız bir konuğun host'la bağlantısı kesilir (inceleme düzeltmesi: `cut(…, {tasima:true})` ve `blockPeer(host)`; uygulama kipindeki `cut` ICE'yi düşürmez) → devir başlamaz (diğerleri host'a bağlı; seçmen yok). (inceleme düzeltmesi) Y5 İki konuğun host bağı kesilir, üçüncüsü bağlı kalır → yeni host seçilmez (Q = 3; host ve ona bağlı konuk "hayır"); sayfalar arasında etkin host sayısı 1'dir. Y6 Algılama kayması: konukların kopuşu 0, 7 ve 14 sn arayla benzetilir → 60 sn içinde tek host. |
| **`06z_dort_dayaniklilik.cjs`** | Z1 06c akışı (D4-01…D4-07). Z2 D4-02 yeniden üretimi: Tayfa başladıktan hemen sonra `busy(17000)` → v0.4'te "menu"; F5-1 sonrası "playing". Z3 Host `busy(17000)` + hemen `session.tick()` (inceleme düzeltmesi; v0.4'te `net.update`) → kimse düşmez. Z4 Konuklar `--parallel-start` ile aynı anda başlar → 4 × "playing". Z5 Bir konukta `cut(10000, {tasima:true})` (inceleme düzeltmesi) → hayalet yuva → geri gelir; renk ve konum aynı. Z6 `--netem lat=80,jit=20,kayip=3` ile D4-03…D4-05. Z7 Host çıkışı ≤ 300 kbit/sn (`diag.bytes`). **Kabul:** `--repeat 10` ile 10/10. |

### 9.4 Node testleri (`tests/node/`)

| Dosya | İçerik |
|---|---|
| `interp_buffer.mjs` | Ek A modelinin kalıcı testi: tıkanma 0,6–2 sn'de oran ≤ 2; kayıp %5'te ≤ 1,5; `tp` ile atlama (inceleme düzeltmesi) Ayrıca 0,8× host saati ve 0,3 sn host takılması; `fc` ile eşleme. |
| `aoi_tiers.mjs`, `priority_acc.mjs` | Katman sınırları, histerezis, tavan altında açlık olmaması |
| `heartbeat_rules.mjs` | §1.7 tablosu: v0.4 düşürür, yeni kural düşürmez; gerçek kopma yakalanır (inceleme düzeltmesi) Kendi takılması `setInterval` gecikmesiyle ölçülür; `fpsLimit` benzeri seyrek tıklar da sınanır. |
| `election.mjs` | (inceleme düzeltmesi) `devir_inceleme.mjs`'nin genişletilmiş hâli: canlı, kapanmış ve sessiz host × konuk sinyali × bağlar; algılama kayması; kural C ve oy kirası. Kabul: iki etkin host 0, tek konukta haksız devir 0, tam bağlantılı ve kaymalı durumlarda kendiliğinden sürme %100 |
| `helm_ack.mjs` | Komut onayı (inceleme düzeltmesi: ret ve kayıp dahil; `hk` son işlenen; bekleyen komut ≤ 3 sn'de kapanır) |
| `trade_atomic.mjs`, `dice_table.mjs` | Atomiklik, korunum, reddedilen planın hiçbir alanı değiştirmemesi |
| `replica_roundtrip.mjs` | `buildFull` → `pack` → `unpack` → `validate` → `applyTransient` eşitliği |
| `ice_config.mjs` | Kaynak sırası, en çok 4 giriş, parolanın dışa aktarılmaması |
| `key_chain.mjs` | (inceleme düzeltmesi) `k_{e+1}`'den `k_e` türetilemez; konuk, eski host ve varis aynı `k_E`'yi bulur; `cert` doğrulaması |

### 9.5 Mevcut testlerin uyarlanması

- **06a H13 ve 06a2:** Kopma algılama süresi değişir. Gerçek kapanışta kanal kapanışı ve ICE yine ≤ 30 sn'de bildirir. Hayalet yuva süresince uzak oyuncu soluk görünür; "uzak sayısı 1" beklentisi "`away` olmayan uzak sayısı 1" olur.
- **06c D4-07:** "≤ 25 sn'de kalkar" beklentisi "≤ 25 sn'de `away`, ≤ 90 sn'de kalkar" olur. (inceleme düzeltmesi) 06c'nin 10 koşusu yaklaşık 100 dk sürer (taban koşusu 579 sn); kilit sarmalayıcısıyla (`/home/user/devtools/tk`) sıralı koşulur.
- **06b ve 06d:** `snap` biçimi değişir. Doğrudan `snap` alanı okuyan kontroller `DK.net.diag` ve `DK.enemies.list` üzerinden yazılır.

---

## 10. Riskler

| # | Risk | Olasılık / etki | Azaltma |
|---|---|---|---|
| R1 | PeerJS iç yapısına bağımlılık: `conn.peerConnection`, negotiated kanal, `iceStateChanged` | Orta / orta | Vendored sürüm sabit (1.5.5). Erişimler `stateChannel.js` ve `session.js` içinde yalıtılır. U açılmazsa R'ye düşülür (§3.1). |
| R2 | Tarayıcı farkları (Firefox, Safari): negotiated kanal, `CompressionStream`, Worker saati, `getStats` alanları | Orta / orta | Özellik denetimi ve yedekler. F5-4, F5-12 ve F5-13'te elle tarayıcı turu **[BELİRSİZ]**. |
| R3 | Test ortamının (SwiftShader, 4 çekirdek) kararsızlığı yeni zamanlamalarla sürer | Yüksek / orta | `diag` ve uyarı kaydı. Testler gerçek zamanlı çizimi erken keser. `--repeat 10` kabulü. Zaman sınırları test kipinde 1,5 kat. |
| R4 | Host devrinin karmaşıklığı ve gerileme riski | Yüksek / yüksek | Üç adıma bölündü (F5-14/15/16). ~~Varsayılan açık ama ayarla kapatılabilir.~~ (inceleme düzeltmesi) Planlı devir varsayılan açık; çökme devri güvenlik testleri geçene dek varsayılan kapalı (K5-1). Planlı devir önce gelir. Terfi kayıtlı dünya yükleme yolunu yeniden kullanır. |
| R5 | Replikayla sır paylaşımı (konuk anahtarları, sandık içerikleri) | Orta / orta | K5-1 (herkese açık odada kapalı). Replika bellekte kalır. Arayüzde uyarı. (inceleme düzeltmesi) Anahtarların kendisi değil `k_{e+1}` gider (dönem anahtar zinciri, §6.3); sandık içerikleri yine sızar. |
| R6 | Kayıt çatallanması ve kullanıcının kafa karışıklığı | Orta / orta | `(epoch, worldRev)`, `lineage` ve `handedOff` alanları; açık iletiler; elle çatal yeni `worldId` alır. |
| R7 | Bant genişliği değerleri modele dayanıyor | Orta / düşük | F5-5'te ölçülür; tavan ve öncelik biriktirici güvenlik sağlar. |
| R8 | Dümen tahmininin sapması (arazi ve engel farkları) | Orta / düşük | Bayraklı (K5-7). F5-7A tek başına E-10'u kapatır. |
| R9 | Worker saati ve CSP (`worker-src blob:`), tek HTML | Düşük / düşük | Faz 2 CSP ile eşgüdüm; yoksa yalnız `hostPause` göstergesi. |
| R10 | TURN maliyeti, gizlilik ve hukuki yükümlülükler | — / yüksek | Kodda yalnız yapılandırma; sunucu kararı K5-3 **[SUNUCU]**. |
| R11 | Geliştirme sırasında PROTO ve şema imzasının sık değişmesi | Orta / düşük | §8.5'teki "PROTO 3 taslak" kuralı. |
| R12 | Ticaret ve zarla ekonomi istismarı (sybil, XP çiftçiliği) | Orta / orta | K5-6 kısıtları; bağlı eşya ve altın; saatlik zar XP tavanı; defter denetimi. |
| R13 | Gecikme artışı (100–250 ms çizim gecikmesi) yakın dövüşte ıskalamayı artırır | Orta / orta | K5-8 geri sarma altyapısı; uyarlanır `D`; ölçüm (Faz 2 U-6). |
| R14 | Isınma ve `loaded` koşulu hatalı kurulursa konuk `warm` fazında takılı kalır | Düşük / orta | 20 sn üst sınır; 90 sn sessizlik sınırı yine işler; `diag` kaydı. |
| R15 | İki sinyal varsayımı: ICE onayının JS takılmasından bağımsız olduğu | Düşük / orta | Chrome ve Firefox'ta WebRTC ağ iş parçacığı ayrı. 06r R4/R5 ve 06z Z2/Z3 doğrular. Tutmazsa iki vuruş ve kendi takılmasının telafisi yine korur. (inceleme düzeltmesi) Konteynerde yalnız Chromium'da sınanabilir; Firefox ve Safari yok. |
| R16 | (inceleme düzeltmesi) Takma ad ya da sahte host: yeni katılan `cert`'i doğrulayamaz | Düşük / orta | Önce özgün kimlik; `info` `cert` taşır; dönen konuk doğrular; oda kodu yalnız arkadaşlarla paylaşılır |
| R17 | (inceleme düzeltmesi) Sinyal sunucusu zamanlamaları (`alive_timeout`, `expire_timeout`) bulutta bilinmiyor | Orta / orta | Değerler Ek B'de tek yerde; PeerJS bulutunda elle ölçüm (internet gerekir) **[BELİRSİZ]**; kendi sinyal sunucusu seçeneği (§7.7) |
| R18 | (inceleme düzeltmesi) Varis ön bağlantısının maliyeti ve NAT'ta kurulamaması | Orta / düşük | En çok 2 bağlantı, 1 Hz `hb`; kurulamazsa arayüzde "Devir hazır değil" |
| R19 | (inceleme düzeltmesi) Host'ta 20 sn'de bir replika serileştirmesi takılma yaratabilir | Orta / orta | F5-14'te ölçüm; bölümleme ya da otomatik kayıtla birleştirme |
| R20 | (inceleme düzeltmesi) Bölünmüş host'ta çoğunluk devri sahibin dünyasını çatallar | Düşük / orta | `(epoch, worldRev)`, `lineage`, "Dümeni sahibine geri ver"; sertifikasız geri çekilme yok |
| R21 | (inceleme düzeltmesi) Uzak ada engelleri host'ta kurulu değil; gemi ve konuk fiziği host'ta kayaları yok sayar | Orta / düşük | Mevcut sınır (Faz 2 nihai belgesinde kayıtlı); F5-7B yalnız `BUILD_D` içinde; ileride yalnız çarpıştırıcı kuran ada kurulumu |

### 10.1 BELİRSİZ konular

U-1 Negotiated kanalın Firefox ve Safari davranışı (F5-4). U-2 `turn:` varsayılan taşıması ve tarayıcıdaki gerçek relay protokolü (F5-12). U-3 Replika sıkıştırma oranları (F5-14). U-4 SwiftShader'da terfi süresi (F5-15). U-5 `Ship.update` yeniden oynatma maliyeti (F5-7B). U-6 Bant genişliği sabitleri (F5-5). U-7 Worker saati ve CSP (F5-13). U-8 `getStats` seçili çift alanlarının tarayıcılar arası farkı (F5-12). (inceleme düzeltmesi) U-9 PeerJS bulutunun `alive_timeout` ve `expire_timeout` değerleri (F5-16). U-10 Chromium'da ICE `disconnected` ve `failed` süreleri (F5-2). U-11 Chromium'un 5 dakikadan uzun gizli kalan, WebRTC'li sayfaya yoğun kısma uygulayıp uygulamadığı (F5-13). U-12 Geri döngü adresli TURN sunucusundan relay adayı toplanıp toplanmadığı (F5-12). U-13 Replika serileştirmesinin maliyeti (F5-14). U-14 Mekanizma B'deki rAF ile ileti görevi sırası (F5-0).

### 10.2 SUNUCU gerektiren konular

S-1 Her ağda bağlantı garantisi: TURN (§7.2). S-2 PeerJS bulutuna bağımlılığın kaldırılması: kendi sinyal sunucusu (§7.7). S-3 Herkese açık oda listesinin 12 sabit yuvadan kurtarılması: lobi uç noktası (E-22). S-4 Çevrimdışı kayıt çatallarının birleştirilmesi ve cihazlar arası tek doğru kayıt: bulut kayıt (Faz 4 H-1). S-5 Host hilesine karşı güvence: sunucu otoriteli benzetim (Faz 2 §1.6).

---

## Ek A — Node denemeleri (`/tmp/tasarim_y/`, salt-okur)

| Dosya | Ne modeller | Ana sonuç |
|---|---|---|
| `interp_sim.mjs` | İlk taslak: uzaysal hız sınırlı yakalama | Tıkanmadan sonra hedef hızı yanlış ölçüldüğü için 5–12 m sıçradı; **reddedildi**. |
| `interp_sim2.mjs` → `interp_sim3.mjs` | Zaman bükmeli ara bellek + `Emax` + görsel hata ofseti; v0.4 `RemotePlayer.update` kopyasıyla karşılaştırma | §3.4 tablosu: 0,6–2 sn tıkanmada oran ≤ 2, ışınlanma 0; %5 kayıpta 1,0×; zikzakta 1,0× (inceleme düzeltmesi) Model iki saati eşit hızda varsayar. Aynı koşuda gerçeğe en büyük uzaklık 1,5 sn tıkanmada 9,6–9,8 m'dir (v0.4'te 11,3 m). |
| `bw_budget.mjs` → `bw_budget2.mjs` | v0.4 biçimleri (kaynak koddan) ile önerilen katmanlı ve nicemlenmiş biçim | §3.7 tablosu |
| `heartbeat_sim.mjs` | D4-02 mekanizmaları A/B ve yeni kurallar | §1.7 tablosu |
| `election_sim.mjs`, `election_sim2.mjs` | Dönem + çoğunluk; tanık kuralıyla ve tanık kuralı olmadan | Çift host 0; tanık kuralıyla tam bağlantılı durumların hepsi kendiliğinden sürer (inceleme düzeltmesi) Yalnız host'un ölü olduğu durumlar modellenmiştir; canlı host, sinyali kopuk konuk ve algılama kayması yoktur. |
| `helm_ack_sim.mjs` | Yelken komut onayı | %100 (10–150 ms) (inceleme düzeltmesi: yalnız kabul edilen ve kaybolmayan komutlar) |
| `devir_inceleme.mjs` (inceleme) | Bölüm 1: algılama kayması (anlar {0, 1, 2, 4, 7, 13, 25} sn), tam bağlantılı, host ölü; saat güdümlü turlar ile olay güdümlü oy kirası. Bölüm 2: canlı, kapanmış ve sessiz host × konuk sinyali × konuk–host bağı; ilk taslak kuralı (A) ile nüfusa host'u katan kural (C) | Kayma: A 23/49 ve 289/343, B 49/49 ve 343/343. Canlı host: A tek konukta 2/2 haksız devir, 3 konukta 6/56 iki etkin host; C 0 ve 0 (§6.4 tablosu) |

## Ek B — Sabitler (tek yerde: `session.js`, `interp.js`, `aoi.js`, `migrate.js`)

| Sabit | Değer |
|---|---|
| Sessizlik eşikleri (ICE bağlı) | 4 sn zayıf · 8 sn yanıt vermiyor · 30 sn hayalet (iki vuruş) |
| Oturum saati | (inceleme düzeltmesi) `setInterval` 250 ms; oyunda `hb` 1 Hz (`ping` yerine) |
| Gemi komutu | (inceleme düzeltmesi) `hk` = son işlenen `cs`; bekleyen komut en çok 2 yeniden deneme / 3 sn |
| Varis ön bağlantısı | (inceleme düzeltmesi) Varis 1 → diğer adaylar; `hb` 1 Hz; `heirOk` |
| ICE kopuk | (inceleme düzeltmesi) `disconnected` 8 sn, ya da `failed`, ya da kanal kapanışı → hayalet |
| Hayalet yuva | 60 sn |
| `load`/`warm` sessizlik sınırı | 90 sn |
| `loaded` koşulu | (inceleme düzeltmesi) 60 kare ve `NEAR_D` içinde kurulmamış ada yok, ya da 20 sn (koşulsuz tavan) |
| Kendi takılması | (inceleme düzeltmesi) `session.tick` `setInterval(250 ms)`; aralık > 2,5 sn geç çalışırsa 3 sn erteleme |
| Yeniden bağlanma | 1, 2, 4, 8, 8 … sn; toplam 60 sn |
| NetInterp | `Dmin` 0,10 (oyuncu) / 0,12 (gemi); `Emax` 0,25; `D ≤ 0,35`; hız 0,5–2×; > 3 sn → atlama; ofset τ 0,15 sn (inceleme düzeltmesi) Eşleme `fc` ile yapılır, pencere 2 sn. |
| İlgi alanı | 40 / 80 / 250 / 1 000 m; histerezis %15; konuk tavanı 96 kbit/sn; dilim ≤ 1 100 B |
| Replika | Varis 1: 20 sn; diğer adaylar: 60 sn; önemli olaydan sonra 2 sn; ≤ 64 kbit/sn; ≤ 512 KB (inceleme düzeltmesi) 16 000 B'lık parça en çok 2 sn'de bir. |
| Seçim | (inceleme düzeltmesi) Oy kirası 15 sn; `claim` kira bitiminden ≥ 3 sn önce; tanık 2 yoklama (her biri ~5–6 sn); host, sinyal "yok" diyene dek nüfusta; özgün kimlik isteği 5 sn'de bir, `alive_timeout` + 30 sn boyunca; takma ad `-e1…-e5` yalnız yedek |
| Zar | Bahis 10/25/50/100; 5 sn'de 1 tur; saatte 120 el; zar XP'si saatte ≤ 12 kez |
| Ticaret | Davet 20 sn; hareketsizlik 120 sn; mesafe 6 m (başlama) / 8 m (sürme); ≤ 20 kalem; yeni profil 20 dk |


---

## İncelemede bulunan sorunlar (önem sırasıyla)

Her madde şu sırayla yazılmıştır: sorun; kanıt (dosya:satır ya da deneme); düzeltmenin belgedeki yeri.

### Yüksek

1. **Seçim kuralı, canlı ama bölünmüş host'ta haksız devir ve iki etkin host üretiyordu.** "Çift host 0" sonucu, host'u her durumda ölü sayan bir modele aitti: `election_sim2.mjs`'te `alive` yalnız konuklar için tanımlıdır. `devir_inceleme.mjs` Bölüm 2'de ilk taslağın kuralı, tek konuklu oyunda 2 durumun 2'sinde haksız devir yaptı (konuğun kendi interneti ya da yalnız host'la bağı kopunca Q = 1 ile kendini seçiyor; bağlantı dönünce canlı host takma adı görüp geri çekiliyor). Üç konuklu oyunda 56 durumun 6'sında eski host'a bağlı konuk varken ikinci bir host seçildi. Nihai kural (C) iki sayıyı da 0'a indirir. → §6.1-9, §6.4 (nüfusta host, Ö1–Ö3), K5-13, testler X4 ve Y5.
2. **Saat güdümlü 6 sn'lik turlar, algılama kaymasında tıkanıyordu.** Tam bağlantılı ve host'u ölü durumlarda, algılama anları {0, 1, 2, 4, 7, 13, 25} sn alınınca kendiliğinden sürme 2 hayatta kalanda 23/49'a, 3 hayatta kalanda 289/343'e düştü. Olay güdümlü oy kirasıyla bu oranlar 49/49 ve 343/343 oldu (`devir_inceleme.mjs` Bölüm 1). → §6.4 nihai protokol, Y6.
3. **Sinyal sunucusunun zamanlaması gerçek dışı varsayılmıştı.** `peer-unavailable` yalnız EXPIRE ile, yaklaşık 5–6 sn sonra gelir (`peer` 1.0.2: `index.cjs:25-32`, `:196-219`). Ağı kopan eşin kimliği 90 sn kayıtlı kalır ve ona giden OFFER sessizce kaybolur (`:134-148`, `:386-404`). Bu yüzden "2 sn arayla iki yoklama", "6 sn tur" ve "devir 10–35 sn" tutmaz. Gerçekçi süre temiz kapanışta 10–20 sn, ağ kopmasında 30–100 sn'dir. → §1.1, §6.1-1, §6.1-7, §6.10, Ek B, R17.
4. **Takma ad işgaliyle host tek iletiyle düşürülebiliyordu.** `<KOD>-e<N>` kimliğini oda kodunu bilen herkes alabilir. §6.7-4 canlı host'u herhangi bir takma ad yanıtıyla geri çekiyordu; yeni katılanlar da en yüksek dönemli takma ada yönleniyordu. → Geri çekilme yalnız sertifikayla (dönem `e+1` için Q oy MAC'i); önce özgün oda kimliği istenir (§6.5, §6.7); X5, R16.
5. **Replika, konukların HMAC anahtarlarını varise veriyordu.** Varis bu anahtarlarla Faz 2 §2.2 akışını izleyerek canlı host'a başka bir konuk olarak girebilir ve o konuğun eşyalarını yeni ticaret özelliğiyle kendine aktarabilirdi. → Dönem anahtar zinciri `k_E = HMAC(k_{E−1}, …)`: replika yalnız `k_{e+1}` taşır; dönem 0 Faz 2 ile birebir aynıdır (§6.3); `key_chain.mjs`.
6. **Oturum saatleri rAF'a bağlıydı.** F2 denetimi `net.update`'te çalışıyordu. Testlerde rAF `fpsLimit = 0.01` ile durur (`engine.js:55-58`) ve `coop.cjs` tıkları arasındaki boşluk 1 sn'yi aşar; bu yüzden "boşluk > 1 sn → 3 sn erteleme" kuralı her tıkta yeniden kurulur. Kısa tıklarda (06c D4-07 döngüsü: 1 sn bekle + `tick(0.2)`) sessizlik zaman aşımları hiç ateşlenmez, uzun tıklarda gecikir ve makine hızına bağlı olur. Gerçek oyunda gizli sekmede kopma algılama ve `hb` dururdu. → `session.tick` ayrı `setInterval(250 ms)` ile koşar; kendi takılması aralığın gecikmesiyle (> 2,5 sn) ölçülür (§5.2); R12.
7. **`warm` fazı Faz 2 kapısıyla çelişiyordu.** Faz 2 §2.3'e göre `load` fazında yalnız `ping`, `chat`, `st`, `sync` ve `importReq` serbesttir; diğer her ileti 5 ihlal puanı alır (§2.7). `warm` fazında oynayan konuk 20 eylemde 100 puana ulaşır ve `kick{protocol}` alırdı. Sessizlik hayaletinden aynı bağlantıyla dönme geçişi de yoktu. → `warm` = `game` izinleri; `st` faz listesi; hayaletten oyuna geçiş (§1.8, §5.1).

### Orta

8. **Test beklentileri kurallarla çelişiyordu.** R2, Z5 ve Y4'te `cut(10000)` sonrasında "hayalet yuva" bekleniyordu. Oysa konteynerde ICE her zaman bağlıdır (aynı Chromium içinde, geri döngü üzerinden); uygulama katmanındaki kesme 10 sn içinde yalnız "yanıt vermiyor" durumu üretir, hayalet ancak 30 sn'de gelir. → `cut(ms, {tasima:true})` (§9.1); R11 (uygulama kipi) ayrı bir test oldu.
9. **Gemi komut onayı retlerde kilitleniyordu.** `hk` "son onaylanan" diye tanımlanmıştı. Faz 2 §7.4'ün bekleme (≥ 0,3 sn) ya da istasyon yakınlığı reddinden sonra bekleme hiç kapanmaz ve konuk görüntüdeki `sailTarget`'ı kalıcı olarak yok sayar. `helm_ack_sim.mjs` yalnız kabul edilen komutları modeller. → `hk` son işlenen komuttur; ret `shipCmdR` ile bildirilir; bekleme 3 sn'de bırakılır (§3.8); U6.
10. **F5-7B'nin eşitlik varsayımları yanlıştı.** `ocean.time` her istemcide yereldir (`ocean.js:271`) ve gemi fiziğine girer (`ship.js:362`, `:537`, `:591`). Esinti `performance.now()`'dan türetilir (`sky.js:257`); `windDir` 20 sn zaman sabitiyle değişir (`sky.js:256`). Ada kaya engelleri yalnız adayı kuran istemcide vardır (`islands.js:1074`), host ise adaları yalnız kendi oyuncusunun çevresinde kurar (`islands.js:273`). → `snap.tm` içinde `ot`, `wd`, `ws`; F5-7B yalnız `BUILD_D` içinde açık (§3.8); R21.
11. **Saat eşlemesi hız farkını yok sayıyordu.** Host < 10 FPS'te ya da kırpılan karelerde (Faz 3 `MAX_SUB`, `engine.js:62`) `playTime` gerçek zamandan geri kalır. 5 sn'lik pencere minimumu bu durumda oynatmayı sürekli `Emax` sınırında dış değerlemeye iter; Node modelleri iki saati eşit hızda varsayar. → `fc` (host'un ham kare saati) ve 2 sn pencere; Faz 3 K9'un kare saati ilkesi korunur (§3.2, §3.3).
12. **`ts` biriminin ve şema aralığının tanımı yoktu.** `snap.ts` milisaniye cinsindendir, Faz 2'nin `st.ts: F(0, 1e7)` alanı ise saniye; milisaniye olsaydı 2,8 saatte taşardı. `playTime` kayıtla birlikte birikir (`game.js:142`). → §3.2.
13. **Oda kodu dünyaya bağlı değildi.** `net.host` kodu her seferinde yeniden üretir (`net.js:208-211`); kod yalnız profilin `recentRooms` listesine yazılır (`net.js:469-472`). Eski host'un dönüşü (§6.8) ve audit_E gereksinim 10'un "aynı yuvayla eski kodu dene" maddesi bu bağı varsayıyordu. → K5-12, §5.4-8, §6.6 (`room` alanı).
14. **"Bağlı altın" Faz 2 profilinde yok.** Faz 2'de `inv.gold` tek bir sayıdır, bağ yalnız eşyalarda (`b`) vardır; K5-6'daki "ithal altın verilemez" kuralı bu yüzden uygulanamazdı. → `gb` alanı, PROTO 3 ve Faz 4 profil şeması (§4.8).
15. **Bağlam rotasyonu host'taki host-merkezli silme kurallarını atlıyordu.** Buzdağı host oyuncusuna 1 400 m uzaklıkta siliniyor (`worldEvents.js:368`), plankton host gemisine göre üretiliyor (`:385-386`). Uzak konuğun yanında doğan buzdağı host'ta ilk karede silinirdi. → §4, §2 madde 20, F5-8.
16. **`loaded` koşulu takılabiliyordu.** `islands.job === null` koşulu 750 m'ye kadar arka plan kurulumunu (`islands.js:27`) bekler; 20 sn tavanı ise yalnız kare koşuluna bağlıydı. → §5.3, Ek B.
17. **İkinci `worldPart` konuğu ışınlıyordu.** `loaded` sonrasındaki eşitleme `applyWorld`'ü yeniden çalıştırırsa konuğu limana ışınlar (`main.js:341`) ve gemi konumunu ezerdi. → `resync:true` (§5.3).
18. **ICE `disconnected` için 3 sn çok kısaydı.** Kısa bir Wi-Fi dolaşmasında taşınan sandık, kilit, ticaret ve zar koltuğu bırakılırdı; v0.4 15 sn tolere ediyordu. → 8 sn (§5.2, Ek B).
19. **Faz 4 `abortStart` ile çakışma vardı.** Faz 4 §4.6'da `abortStart` online host'ta `net.leave()` çağırır; varisin terfisinde `LoadError` bütün oturumu kapatırdı. Konuk yüklemesinde F6'nın "`hostLeft` → `abortStart`" kuralı da gereksiz bir yeniden yükleme demekti. → `abortStart({keepNet})`, `claimFail`; geçici kopma yüklemeyi iptal etmez (§5.3, §6.5).
20. **Konukların birbirine ulaşabildiği önceden bilinmiyordu.** Oylar host kaybı anında kurulan bağlantılarla gidiyordu. 6 sn'lik tur, doğrudan deneme ile relay denemesini (12 sn zaman aşımı) içine alamazdı. → Varis ön bağlantısı ve `heirOk` (§6.4a); §7.6-3.
21. **D4-02'nin kök nedeni kanıtlanmış gibi sunuluyordu.** Aynı belirti konuğun 25 sn kuralıyla da oluşur (`net.js:705-706`). 11. ve 12. belgeler düşmenin "birkaç saniye içinde" olduğunu yazar, ama zamanlama ölçülmemiştir. "İlk `st`, yakın ada kurulumundan önce gider" sırası da yanlıştı (`main.js:118-120`, `islands.js:258`, `:289-290`). → §1.7; F5-0 önce gözlemsel kayıt alır.
22. **`replaced` iletisi yanlış bağlantıda işlenebiliyordu.** Konuğun kendi bıraktığı eski bağlantıya gelen `kick{replaced}` otomatik yeniden bağlanmayı kalıcı olarak durdurabilirdi. → §5.4-4.
23. **Sayfasını yenileyen konuğun geri dönüş yolu yoktu.** Konuk ana menüde açılıyordu; R3 yalnız harness çağrısıyla sınanıyordu. → `sessionStorage['dksh.rejoin']` (§4.9, §5.4).

### Düşük

24. **TURN ifadeleri düzeltildi.** "TURN bu durumları ortadan kaldırır" yerine "azaltır" yazıldı. Açık `config` PeerJS varsayılanının yerine geçer, onunla birleşmez. Tek tarafta çalışan TURN çoğu durumda yeter. PeerJS TURN'ü ve Google STUN için de KVKK notu geçerlidir. `iceTransportPolicy:'all'` politikasında ikinci relay denemesinin yararı sınırlıdır. Konteynerde coturn yok, yalnız Chromium var. TURN gerekli ama tek başına yeterli değildir: sinyal WebSocket'i ve TLS'i inceleyen vekiller de engel olabilir. → §7.
25. **Replika hız sınırı kendi içinde çelişiyordu.** "Konuk başına ≤ 64 kbit/sn" ile "50 ms'de 1 parça" (2,5 Mbit/sn) bağdaşmaz. → §3.6.
26. **`hb` ile `ping` birlikte Faz 2'nin `session` kovasını (1/sn) aşıyordu.** → Oyunda `hb` `ping`'in yerini alır (§3.2, §8.5).
27. **Kuşlar olayı için var olmayan bir görsel varsayılmıştı.** Bu olay v0.4'te host'ta da yalnız bir bildirimdir (`events.js:153-154`); "konuk sürüyü oynatır" ifadesi yanlıştı. → §4.5.
28. **Zar şeffaflığı yetersizdi.** Tohum taahhüdü host'un sonucu önceden bilmesini engellemez. → Konuk nonce'ları ve geri sayımda koltuk kilidi (§4.7).
29. **Dürbün ilgi alanında bakış yönü eksikti.** `st` iletisinde bakış yönü yok (`player.js:988`). K2 sınırı, v0.4'te dürbünle görülebilen uzak düşmanları da kaldırıyordu. → `lk` alanı ve dar koni (§3.5).
30. **Replika serileştirmesinin host'taki maliyeti ölçülmemişti.** → **[BELİRSİZ]**; §6.3, R19, F5-14.
31. **Firefox ve Safari davranışları bu ortamda ölçülemez.** Konteynerde yalnız Chromium var (`/opt/pw-browsers/chromium-1243`). U kanalının kimliği 512'den 8'e indirildi. → §3.1, U-1.
32. **Küçük atıf ve şema hataları düzeltildi.** Gemi `netState` 23 elemanlıdır, 24 değil (`ship.js:705-707`). Zarcı kesesindeki 400 değeri `dice.js:18`'dedir. §1.3'teki c2h listesinde `act` eksikti. Korsan Kodu biçimi Faz 4 S-b ile birebir değildi. §5.6'da `timeout` için "aynı koltuk" ifadesi çelişkiliydi. Roster'a `lvl`/`rank` eklemek Faz 2'nin beyaz listesini değiştirdiği hâlde PROTO 3 kaydında yoktu. Yeniden damgalanan `ts` için kırpma sınırı tanımlı değildi.
33. **Adım boyutları yeniden düzenlendi.** F5-1 sekiz değişikliği tek adımda topluyordu ve parçaları ayrı ayrı sınanamıyordu; F5-1a ve F5-1b'ye bölündü. F5-12 (TURN) Faz 2–4'e bağlı olmadığı ve bağlantı sorunlarını görünür kıldığı için öne alındı. Toplam süre ≈ 52 iş günü, risk payıyla 45–62 gündür (§8.3, §8.4).
