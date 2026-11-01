<!-- Aşama 6 teslimatı: uygulanmamış tasarım; bkz. 03_DEGISIKLIK_LISTESI.md -->
# TURN Desteği ve Oda Sahibi Devri — Teknik Tasarım ve Aşamalı Uygulama Planı

Bu belge **uygulanmamış** bir tasarımdır; mevcut kodda yalnızca Aşama A (tanılama) ve Aşama B'nin konfigürasyon kısmı
uygulanabilir durumdadır. Hangi aşamanın uygulandığı `docs/denetim/03_DEGISIKLIK_LISTESI.md` içinde ayrıca belirtilir.

## 1. Mevcut durum
- Bağlantı: PeerJS (WebRTC DataChannel, `reliable: true`, JSON serileştirme). Sinyal sunucusu PeerJS'in genel sunucusu
  (ya da `?peerhost=` ile yerel sunucu). ICE sunucusu olarak yalnızca PeerJS'in varsayılan STUN listesi kullanılır.
- Topoloji: yıldız. Oda sahibi (host) her konuğa ayrı DataChannel açar; konuklar birbirine bağlanmaz. Tüm dünya
  otoritesi ev sahibindedir (anlık görüntü 15 Hz; konuklar istek/komut gönderir).
- Sonuçlar: (a) simetrik NAT / kurumsal ağ arkasındaki oyuncular STUN ile bağlanamaz (TURN yok); (b) ev sahibi
  ayrılınca oturum biter (`hostLeft` → menü).

## 2. TURN desteği

### 2.1 Hedef
Doğrudan eşler arası bağlantı kurulamayan oyuncuların (simetrik NAT, mobil ağ, bazı kampüs ağları) TURN aktarımıyla
bağlanabilmesi; kullanıcıya bağlantı türünü (doğrudan / aktarımlı) ve kaliteyi göstermek.

### 2.2 Tasarım
1. **ICE yapılandırması:** `peerOpts()` içine `config: { iceServers: [...] }`. Kaynaklar sırayla:
   - `?turn=turns:host:5349&turnuser=...&turnpass=...` adres parametreleri (test/özel sunucu),
   - `localStorage` içindeki kullanıcı ayarı (Ayarlar → Online → "TURN sunucusu"),
   - varsayılan STUN listesi (`stun:stun.l.google.com:19302`, PeerJS varsayılanı).
   Kimlik bilgisi tarayıcıda saklanır; oyun kodu içine gömülmez.
2. **Kısa ömürlü kimlik (önerilen üretim yolu):** statik parola yerine, coturn'un `use-auth-secret` kipi ile
   HMAC tabanlı geçici kullanıcı adı/parola (`timestamp:kullanıcı`, 12 saat). Bunu üreten küçük bir HTTPS uç noktası
   (`/turn-credentials`) ev sahibinin ya da proje sahibinin sunucusunda çalışır; oyun bunu `fetch` ile alır. Oyunun
   GitHub Pages'te barındırılması bu uç noktayı dışarıda tutmayı gerektirir (Pages statik).
3. **Bağlantı tanılama:** DataChannel açılınca `RTCPeerConnection.getStats()` ile seçili aday çifti okunur
   (`candidateType: relay|srflx|host`), lobide ve HUD'da (`Konuk` yazısının yanında) "doğrudan" / "aktarımlı" rozetleri
   ve RTT gösterilir. Bağlantı 12 sn'de kurulamazsa kullanıcıya "TURN sunucusu tanımlamayı deneyin" iletisi.
4. **Yedek strateji:** ICE `failed` olursa aynı odaya TURN zorunlu (`iceTransportPolicy: 'relay'`) ikinci bir
   deneme yapılır (yalnızca TURN tanımlıysa).

### 2.3 Aşamalar
| Aşama | İş | Kabul |
|---|---|---|
| A | `getStats()` tanılaması, lobide bağlantı türü/RTT rozeti | İki yerel sekme "doğrudan (host)" gösterir |
| B | `peerOpts()` ICE yapılandırması (adres parametresi + ayarlar paneli) | `?turn=` ile başlatılan oyunda `RTCPeerConnection.getConfiguration().iceServers` TURN'u içerir |
| C | Geçici kimlik uç noktası (coturn `use-auth-secret`) ve `fetch` ile alma | Kimlik 12 sn içinde alınır; alınamazsa STUN ile devam |
| D | ICE başarısızlığında relay zorunlu yeniden deneme | Yapay olarak engellenen STUN'da bağlantı TURN üzerinden kurulur (gerçek NAT testi gerekir; bu ortamda doğrulanamaz) |

Risk: Bu geliştirme ortamında dış ağ erişimi ve gerçek NAT bulunmadığından C ve D yalnızca üretimde doğrulanabilir.

## 3. Oda sahibi devri (host migration)

### 3.1 Hedef
Ev sahibi ayrıldığında (sekme kapanması, bağlantı kopması) oyunun devam etmesi: dünya durumu kalan oyunculardan
birine devredilir; diğerleri yeni ev sahibine bağlanır; kayıp ≤ son anlık görüntü (≈ 1 sn).

### 3.2 Neden kolay değil
- Dünya durumu yalnız ev sahibinde: düşman/boss/hayvan iç durumları, olay zamanlayıcıları, ada içerik durumu, hazine
  sandıkları, kayıt dosyası (localStorage ev sahibinin tarayıcısında).
- Konuklar birbirinin PeerJS kimliğini bilir (roster) ama birbirine bağlı değildir.
- Konukların dünya kaydı yoktur; devir için tam bir "dünya anlık görüntüsü" gerekir.

### 3.3 Tasarım
1. **Tam dünya anlık görüntüsü (`worldFull`)**: `game.serialize()` (kayıt verisi) + geçici durum (düşman/boss/hayvan/deniz
   devi/olay/hazine konumları: zaten `netSnapshot` üretilebiliyor). Ev sahibi bunu her 15 sn'de bir **sırayla** konuklara
   gönderir (sıkıştırılmış JSON, ~100–300 KB; bant genişliğini dağıtmak için her seferinde bir konuk). Her konuk son
   anlık görüntüyü `sessionStorage`'da tutar (sekme yenilemesine dayanır).
2. **Aday sırası:** roster'daki katılım sırasına göre ilk konuk "varis"tir; ev sahibi sırayı `roster` ile yayınlar.
   Varis, tam anlık görüntüyü diğerlerinden daha sık (5 sn) alır.
3. **Kopma algılama:** DataChannel `close`/`error` ya da 6 sn ping yanıtsızlığı. Varis 2 sn bekler (ev sahibinin
   `peer.reconnect()` ile dönmesi için), sonra devralır.
4. **Devralma:** varis `net.host()` ile **aynı oda koduyla** yeni Peer açar (kod PeerJS kimliğinin parçası olduğu için ev
   sahibinin eski kimliği serbest kalana kadar başarısız olabilir → 3 deneme, aralarında 1 sn; başarısız olursa yeni kod
   üretir ve eski roster'a özel bir "devir" mesajı yerine… konuklar varisin kimliğini roster'dan bildiği için doğrudan ona
   bağlanır: `peer.connect(varisId)`). Ardından `game.start({save: worldFull, online: true, isHost: true})` ile dünyayı
   anlık görüntüden kurar; kendi oyuncusunu olduğu konumda tutar.
5. **Diğer konuklar:** `hostLeft` yerine `hostMigrating` olayı: 2 + 3 sn bekleme, sonra roster'daki varise `hello`
   (yeniden katılım; ad eşleşmesiyle aynı renk/yer korunur). Oyun dünyası bu sırada dondurulur (giriş kapalı, "Dümen
   devrediliyor…" iletisi).
6. **Kayıt:** devirden sonra dünya kaydı yeni ev sahibinin tarayıcısına yazılır; eski ev sahibi geri gelirse konuk
   olarak katılır (kaydı güncel olmadığı için "dünyayı yükle" seçeneği uyarı verir).
7. **Çatışma önleme:** aynı anda iki varis olmasın diye roster sırası tek kaynak; varis devralırken `t:'claim'`
   mesajını önce diğer konuklara (bağlanınca) gönderir; daha küçük sıra numaralı bir ev sahibi görünürse geri çekilir.

### 3.4 Mesajlar
| Mesaj | Yön | İçerik |
|---|---|---|
| `worldFull` | host → konuk | `{ save, transient, seq }` |
| `heir` | host → herkes | `{ order: [peerId…] }` (roster'a eklenir) |
| `claim` | yeni host → konuklar | `{ code, seq }` |
| `hello` (mevcut) | konuk → yeni host | `{ name, app, ver, pw, resume: true }` |

### 3.5 Aşamalar
| Aşama | İş | Kabul (bu ortamda test edilebilir) |
|---|---|---|
| A | `worldFull` üretimi (serialize + transient) ve boyut ölçümü; konukta sessionStorage'a yazma | 2 oyunculu test: konukta son anlık görüntü var, boyut < 400 KB |
| B | Varis sırası ve `hostMigrating` dondurma arayüzü | Ev sahibi sekmesi kapatılınca konukta "devrediliyor" durumu |
| C | Varisin `host()` + `game.start(save)` ile devralması | Ev sahibi kapatılınca varis aynı dünyada oynamaya devam eder (tek konuk) |
| D | Üçüncü oyuncunun varise yeniden bağlanması, renk/konum koruma | 3 oyunculu test: iki konuk devirden sonra aynı dünyada |
| E | Eski ev sahibinin geri dönüşü, kayıt uyumu | Eski ev sahibi konuk olarak katılır |

Tahmini iş: A 1 gün, B 0,5 gün, C 2 gün, D 1 gün, E 0,5 gün. En riskli kısım C'dir (dünyanın anlık görüntüden
kesintisiz kurulması: ada içeriği yeniden kurulur, düşmanlar `applySnapshot` yerine tam durumdan doğar).

## 4. Öncelik önerisi
1. Önce TURN A+B (düşük risk, bağlantı sorunlarını görünür kılar).
2. Sonra oda sahibi devri A–C (tek konukla).
3. TURN C–D üretim sunucusu gerektirir; proje sahibi bir TURN/coturn hizmeti ayarladığında eklenir.
