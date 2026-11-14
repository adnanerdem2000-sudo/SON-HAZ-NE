# Faz 2 Nihai Tasarım — Host Otoritesi (A ve B'nin hakem birleşimi)

| | |
|---|---|
| **Proje** | Deniz Korsanları: Son Hazine — three.js; co-op PeerJS/WebRTC, 1–4 oyuncu; host da bir tarayıcı, sunucu yok |
| **Taban** | v0.4, commit `44d548c` (`/home/user/SON-HAZ-NE-w2`) |
| **Girdiler** | Faz 0 ağ denetimi `audit_B.json` (B-01…B-21, 38 ileti türü); Tasarım A `faz2_tasarim_A.md` (tam host otoritesi); Tasarım B `faz2_tasarim_B.md` (en az değişiklik) |
| **Durum** | Hakem belgesi ve uygulanacak nihai tasarım. Kod değiştirilmedi, depoya yazılmadı, tarayıcı testi koşulmadı. Bu belgedeki `dosya:satır` atıflarının hepsi v0.4 kodunda yeniden okundu. **[BELİRSİZ]** ve **[SUNUCU]** işaretli konular §13.8 ve §13.9'da toplu olarak listelenir. |
| **Tarih** | 14 Kasım 2026 |

**Terimler.** *Host*: odayı açan tarayıcı, dünyanın tek otoritesi. *Konuk*: odaya katılan tarayıcı. *c2h / h2c*: konuktan host'a / host'tan konuğa ileti. *Niyet*: "şunu yapmak istiyorum" talebi; sonucunu host hesaplar. *r.auth*: host'un konuk için tuttuğu doğrulanmış durum. *Profil*: konuğun bir dünyadaki envanteri, altını ve ilerlemesi; host'ta tutulur. *Defter*: host'un profile yaptığı her giriş ve çıkışın kaydı. *Anahtar*: dünya başına konuğa verilen gizli HMAC anahtarı. *Dwell*: basılı tutma eyleminin host'ta "hedefe kesintisiz yakın kalma süresi" olarak ölçülmesi.

---

## Hakem değerlendirmesi

### Puan tablosu (1–10; yüksek puan iyidir: risk ve maliyet ölçütlerinde "az risk / küçük iş" anlamına gelir)

| Ölçüt | A (tam host otoritesi) | B (en az değişiklik) | Nihai (hedef) | Gerekçe |
|---|---|---|---|---|
| **Kapsama** (5.1–5.5 ve kabul ölçütü) | **9** | **8** | 10 | **A:** Her alt madde bölüme ve teste bağlı. B-19 (konuk ilerlemesi) uçtan uca çözülmüş: GuestBook, HMAC, ithalat, defter ve yerel kurcalama tablosu. Eksikleri: gemi paneli XSS'i (B'nin N-1'i), `listPublic` yayma (N-4) ve tapınak sırası (N-6) görülmemiş. Konukta köpekbalığı ganimeti kaldırılmış; bu bir işlev kaybıdır, kapsama değildir. **B:** Her madde eşlenmiş ve 11 ek bulgu var (kritik N-1 dahil). Eksikleri: ada nitelikleri için yalnız 60 m kaba yakınlık var ve kesin çapa takvime bağlanmamış (5.3a zayıf). Konuğun `hello`'dan önce host'un `worldId` değerini öğrenme adımı tanımlanmamış; bu yüzden yeniden katılım akışı tanımsız. Sandık içeriğinin konuklara sızması (A'nın E-7'si) ele alınmamış. |
| **Güvenlik sağlamlığı** | **9** | **6** | 9 | **A:** Kimlik `hi` nonce'una ve iki uç kimliğine bağlı HMAC ile kanıtlanıyor; anahtar ağda bir kez gidiyor. Ham serileştirme sayesinde boyut ayrıştırmadan önce ölçülüyor. Bağlantı fazları, h2c şemaları, host'ta tutulan can ve fail-closed AOI var. Eksiği: XSS sink listesi gemi panelini kaçırıyor. Ancak c2h `shipFull` kaldırıldığı, h2c sayıları sonlu olmak zorunda olduğu ve CSP eklendiği için açık büyük ölçüde örtülüyor. **B:** Ayrıntılı ve açık işleyici denetimleri var. Buna karşın (1) taşıyıcı belirteç `hello`'da gidiyor. Konuk hangi belirteci göndereceğini ancak host'un `worldId`'sini önceden bilerek seçebilir. Bu bilgi herkese açık `info` ile verilirse sahte host belirteci toplayabilir. (2) JSON serileştirme korunuyor. PeerJS 1.5.5'in 16 300 baytlık gönderim sınırı ve `error`→`_dropPeer` zinciri (hakem bulgusu Y-1) bu yüzden kalıyor. (3) Ham boyut ölçümü PeerJS iç yapısına (`dc.onmessage`) yama yapılarak alınıyor. (4) Ada niteliklerinde 60 m kaba yakınlık yeterli değil. |
| **Meşru oynanışı bozma riski** (gecikme, his, tek oyunculu) | **5** | **8** | 8 | **A:** Konuğun canı ve kalkanı host'ta. Parry ve blok RTT kadar gecikiyor; telafi en çok 150 ms. Dümene ve topa geçiş host onayını bekliyor. Kayık host fiziğiyle sürülüyor, bu da lastik etkisi riski taşıyor. Balık türü ekranla uyuşmayabiliyor, konuk köpekbalığı ganimeti kayboluyor. Host konuk çevresinde 3 ek ada kuruyor (FPS riski). combat, treasure ve shop "aktör"e çevrildiği için tek oyunculu yolun da değişmesi gerekiyor. **B:** Yerel tahmin ve his korunuyor: yerel hasar, parry, kayık ve balık. Host maliyeti düşük. Tek oyunculu yollar varsayılan parametrelerle değişmeden kalıyor. Riskleri: konum düzeltmesinde yanlış pozitif ve gölge can uyuşmazlığı. |
| **Uygulama riski ve büyüklüğü** | **4** | **6** | 6 | **A:** Yaklaşık 10 300 satır ve 45–60 iş günü. 7 yeni modül var, paylaşılan kodda geniş yeniden düzenleme gerekiyor; AOI de ek risk. **B:** Yaklaşık 6 500–7 100 satır ve 33–41 iş günü; bu tahmin iyimser. Geçiş için yazılan "ön defter" sonradan atılacak kod. PeerJS iç yapısına yama da kırılgan. **Nihai:** ≈ 8 900 satır, ≈ 46 iş günü (§11.4). |
| **Test edilebilirlik** | **9** | **8** | 9 | **A:** `invariants()`, `ledger.check()`, 60 saniyelik bileşik kabul testi, `--latency`, gerçek v0.4 kopyasıyla sürüm testi ve yedi Node testi var. **B:** `--split`, `badClient` (`__rawQ` dahil), `audit()`, meşru akışlar için R1–R16 listesi ve saplamalı `_hostData` üzerinde 100 000 iletilik bulanık test var; test zamanlaması da ayrıca çözümlenmiş. Gecikme benzetimi ve gerçek eski sürüm testi yok. |
| **Toplam** | **36** | **36** | 42 | İki tasarım eşit puan aldı, ama güçlü yanları farklı: A güvenlik çekirdeğinde, B uygulanabilirlikte ve oynanış hissinde önde. Nihai tasarım A'nın güvenlik çekirdeğini B'nin az değişiklikli uygulama yolu üzerine kurar. |

### Bileşimin kaynakları (hangi kısım hangi tasarımdan alındı)

| Konu | Kaynak | Not / hakem değişikliği |
|---|---|---|
| Niyet/sonuç ayrımı, fail-closed `within()`, ağdan geleni yeniden kurma | A + B | Ortak ilke |
| Korunum ilkesi (eşya ve altın yalnız host olaylarından doğar) | A | |
| Tür adlarını koruma, varsayılan parametre, tek oyunculu yolu değiştirmeme | B | A'nın "aktör bağlamı" yerine ince sarmalayıcılar ve saf çekirdekler |
| PeerJS ad alanı `dksh-v1` korunur; eski istemciye JSON `reject` gönderilir | B | A'nın ikinci "tabela peer"ı gereksiz |
| `serialization:'raw'`, ayrıştırmadan önce boyut ölçümü, parçalı `worldPart` | A | Hakem: Y-1'i (16 KB gönderim sınırı) de kapatır |
| Katılmadan önce `info` yoklaması (`proto`) | A + B | Hakem: yeni konuğun eski host'a ham bağlantı açması engellenir |
| `hi` nonce'u ve HMAC meydan okumasıyla konuk kimliği | A | Hakem: konuk `hi.hid === conn.peer` olduğunu doğrular (aktarma saldırısı) |
| Bağlantı fazları (`pre/lobby/load/game`) | A | |
| Şema dilbilgisi, "kırpma değil ret" kuralı | B | `__proto__` / sözlük kuralları A'dan |
| Sınıf başına jeton kovası, bağlantı bayt kovası | B + A | Hakem: `st` kovası test zamanlamasına göre ayarlandı (§12.8) |
| İhlal puanı, uyarı/atma, kara liste, [At]/[Odayı kilitle] | A + B | Eşikler yeniden ayarlandı |
| `q` sıra numarası, `x` işlem kimliği, sonuç önbelleği | A + B | |
| Niyet kuyruğu | A — **alınmadı** | JS olay döngüsü ileti işleyicisini kare ortasında çalıştırmaz; kuyruk yalnız gecikme ekler |
| Profil deposu ayrı anahtarda (`dksh.gbook.<worldId>`), yazım sırası dünya → defter | A | B'nin kayıt içi `guests` alanı yerine. Gerekçe: v0.4'e dönüşte kaybolmaz |
| `dksh.guest.0` v0.5 konuğunda hiç yazılmaz, yalnız ithalat kaynağıdır | A | B'nin üzerine yazma yaklaşımı eski konuk ilerlemesini kaybettirebilir |
| Bağlı (`b`) eşya, `sid` yığın kimliği, saatlik yeni profil sınırı | B | |
| İthalat: host ayarı ve sıkı tavanlar | A (ayar, `importReq`) + B (tavanlar) | |
| Defter ve değişmezi | A | B'nin günlüğüyle birleştirildi |
| `tx` alt şemaları, beklenen fiyat `p`, devre kesici | B | |
| Saf ekonomi çekirdeği (plan → uygula) | A | Yerel `shop.*` ve host `tx` işleyicisi aynı çekirdeği kullanır |
| Saf XP çekirdeği, gerekçe kodları | A + B | Serbest metin yok (XSS) |
| Savaş: `cs` durum makinesi, vekil saldırgan, `_meleeHit(p, D, opts)` | B | |
| Savaş: uzak yakın dövüşte görüş hattı, hasar gözlemcisi | A | |
| Gölge can, yerel his, kayıtlı vuruşa karşı parry doğrulaması | B | A'nın host'ta kalkan modeli yerine (his) |
| Hareket: host benzetim saatine göre mesafe bütçesi | A | Hakem: zaman kaynağı belirsizdi, host benzetim saati olarak netleştirildi |
| Hareket: kip geçiş istisnaları, `r.auth` / görsel ayrımı, `posOf()` | B | |
| Etkileşim: tür başına açık işleyiciler, yarıçap tablosu | B | A'nın genel `use/useHold`'u yerine (sağlayıcı gövdeleri host'a uygun değil) |
| Basılı tutma süresi | Hakem | Ayrı başla/bitir iletisi yok; host'ta dwell ve ardışık süre bütçesi (§2.10) |
| Tehlike mantık kümeleri | B | A'nın AOI'si (ek ada kurulumu) yerine |
| Ada nitelikleri (`feat`, `featSt`, `templeOrder`) | B | Hakem: kesin çapa bir uygulama adımına bağlandı (§6.8, K-8) |
| Hikâye geçiş tablosu; tetikleyiciler yalnız host'ta | A + B | E-9 A'dan |
| Gemi istasyonlarının gemi yerel koordinatında denetlenmesi, kilit kuralları | B | Host önceliği A + B |
| Kayık: doğrulanmış `boatSt` | B | A'nın host fiziği yerine (his) |
| Balıkçılık host tablolarıyla; köpekbalığı ve zıpkın sınırlı beyanla | B | A konukta köpekbalığı ganimetini kaldırıyordu |
| XSS sink listelerinin birleşimi (N-1, N-2, N-4, E-6, E-8) ve `normItemData` | A + B | |
| h2c doğrulama tablosu | A + B | |
| Test: `--split`, kötü istemci yardımcıları, bulanık test | B | |
| Test: `invariants()`, `--latency`, v0.4 kopyası, 60 sn bileşik kabul | A | |
| Uygulama sırası: ucuz geçiş önlemleri erken (hasar sınırı, `gold` kapatma, ganimet bütçesi) | B | B'nin "ön defter"i alınmadı: profil öne çekildi (§11.3) |

### Hakemin kod doğrulaması

**Doğrulanan temel iddialar (iki tasarımda ortak):**

- Konuk sonucu bildiriyor, host yalnız kırpıyor. Kanıt: `net.js:278-291` (hasar), `:345-357` (`hold`), `:358` (`shipFull`), `:373-383` (`gold`), `:301-314` (`lootReq`). `st` ve `ping` oran ve boyut sınırından muaf: `:241`.
- Savaş çözümü için gereken dünya durumu host'ta var. Düşman grupları (`enemies.js:1543`), hayvanlar (`animals.js:791`) ve bosslar (`bosses.js:1080`) konukların çevresinde de host'ta doğuyor. Kraken dokunaçları `combat.targets` içinde ayrı hedef olarak duruyor (`bosses.js:200-206`). `enemy.hurt` host'ta çağrılırsa blok, kaçınma, `rise` ve `phased` kuralları çalışıyor (`enemies.js:340-363`). Bugün konuk dalı blok ve kaçınma zarından **sonra** geliyor (`:358`); F-04 bu yüzden oluşuyor.
- Saldıran konuğa ait durum host'ta **yok**: doğrulanmış konum (`r.pos` beyan edilen ve yumuşatılan değer, `net.js:87-124`), silah sahipliği, yetenek çarpanları (`G.mods` yalnız host'un), kombo ve dayanıklılık, mermi, can. Bunlar sırasıyla `r.auth`, profil, `cs` ve gölge candan gelir (§5, §8).
- `combat._meleeHit` yeniden kullanılabilir ama küçük değişiklik ister:
  - `by: G.myId` sabit yazılmış (`combat.js:201`, `:216`).
  - Yerel yan etkiler var (`:221-231`: `hitMarker`, `hitStop`, kamera sarsıntısı, `p.startAction('blockhit')`).
  - Yumruk tabanı `9 × G.mods.melee` (`:189`).
  - `_softLock` kamerayı (`tpCamera.yaw`, `:176`), `shoot` ise `engine.camera`'yı (`:243`) kullanıyor; ikisi de uzak aktörde çalışmaz.
  - `raycast` saf ve yeniden kullanılabilir (`:271-298`). Görüş hattı yalnız kurulu çarpıştırıcılarla ölçülüyor; arazi yüksekliğinin analitik yedeği var (`terrain.js:422-440`).
- `sellPrice` içinde `G.mods` kullanılıyor (`shop.js:63`). `shop.sell/buy/earn` doğrudan `G.player`'a bağlı (`:73-129`). `Inventory` saf bir sınıf (`inventory.js`), ancak `add` para yolunda tür denetimi yok (`:25`), `canAdd` negatif `data.weight` değerinde kapasiteyi sınırsız kılıyor (`:18-21`) ve `load` süzgeçsiz (`:76-81`). `progress.gain` tekil nesneye bağlı (`progress.js:115-127`).
- Adalar host'ta yalnız host oyuncusunun çevresinde kuruluyor (`islands.js:271-300`, `cam = G.player.pos`). Ada NPC'leri ve etkileşim noktaları (`B.inter`) yalnız kurulu adada var (`islands.js:528`, `:742-751`, `:955-968`). Bu noktaların konumları adanın tek RNG akışına bağlı (`_buildGen`, `R = rng(I.seed*31+7)`). Tehlike kümesi ise deterministik ve adadan bağımsız kurulabiliyor (`hazards.js:111-140`).
- Hedefleme konuğun beyan ettiği `r.downed/r.hp` değerine dayanıyor (`enemies.js:518-523`); B'nin N-10'u doğru. `Character.hold` dize olmayan `eq` değerinde hata veriyor, `kk:` öneki ise keyfî kit modeli yüklüyor (`character.js:645-656`); B-04 ve N-11 doğru.

**İki tasarımdaki hatalar ve düzeltmeler:**

| # | Tasarım | İddia | Hakem bulgusu | Nihai karar |
|---|---|---|---|---|
| D-1 | B | Konuk, `hello`'da yerel `dksh.tokens[worldId]` değerini gönderir | Oda kodu her kurulumda rastgele (`net.js:31-36`, `:208-211`). Konuk `hello`'dan önce host'un `worldId` değerini bilemez. `info` ile öğrenirse herkese açık bilgi olur ve sahte host belirteci toplar. | A'nın `hi` + HMAC akışı (§2.2) |
| D-2 | B | JSON serileştirme korunur, ham boyut `dc.onmessage` yamasıyla ölçülür | PeerJS 1.5.5'in JSON `_send` fonksiyonu kodlanmış boyut ≥ 16 300 bayt olduğunda iletiyi göndermiyor ve `emitError('message-too-big')` ile `'error'` olayı yayıyor (`vendor/peerjs/peerjs.min.js`). `net.js:233` bu olayda `_dropPeer` çağırıyor (Y-1). | `raw` serileştirme + parçalama (§2.4) |
| D-3 | A | XSS noktaları §9.2'deki listeyle sınırlı | Gemi paneli `innerHTML`'e `s.name`, `s.water` (stil içinde), `cannonballs` ve `planks` değerlerini basıyor (`hud.js:300-311`). Bu değerler ağdan geliyor: c2h `shipFull` (`net.js:615`), h2c `applyNet` (`ship.js:710-737`). | B'nin N-1'i listeye eklendi (§9.2) |
| D-4 | A | Eski istemciye yanıt vermek için `dksh-v1-CODE` üzerinde ikinci bir "tabela peer" açılır | Ad alanı korunursa eski istemci zaten yeni host'a bağlanır. Host, bağlantının JSON olduğunu görür ve okunur bir `reject` gönderir. | Ad alanı korunur (§2.1) |
| D-5 | A, B | `file://` ile açılan tek HTML'de `crypto.subtle` bulunmaz | Güvenli bağlam spesifikasyonu `file:` şemasını "potansiyel olarak güvenilir" sayar; Chrome bu sayfalarda `isSecureContext` değerini doğru döndürür. Projede doğrulanmadı. | **[BELİRSİZ]** Adım 0'da ölçülür; yoksa saf JS HMAC yedeği (§2.2) |
| D-6 | A | Hareket doğrulayıcısı `now` değerini kullanır | Zaman kaynağı belirtilmemiş. Gerçek zaman kullanılırsa testlerdeki `DK.sim(0.2)` gerçek zamandan hızlı aktığı için (`coop.cjs:58`) meşru konuk düzeltme yer. | Host benzetim saati (`game.playTime`) (§8.3) |
| D-7 | A | Sağlayıcılar `ctx.player` kullandığı için `candidatesFor(actor)` az değişiklik ister | Eylem gövdeleri `G.notify`, `G.emit('shipCmd')`, `G.mods` ve `G.myId` kullanıyor (`shipControl.js:84-128`, `treasure.js:686`). Host'ta çalıştırılırsa bildirimler host'a gider, ağ olayları yeniden yayılır. | Tür başına açık host işleyicileri (B) (§3, §6, §7) |
| D-8 | A | Köpekbalığı konukta ganimet üretmez | Bugünkü bir özelliği konuklardan kaldırır. | B'nin sınırlı beyanı (§4.16) |
| D-9 | B | Konuk `saveNow` her seferinde `dksh.guest.0`'ı yazar | Host'un "temiz başlangıç" profili, eski zengin konuk kaydının üzerine yazılır. `.bak` yalnız bir kuşak tutuyor (`save.js:15-30`). | Eski yuva salt okunur (A) (§4.2) |
| D-10 | B | Ada nitelikleri için ≤ 60 m kaba yakınlık; kesin çapa "sonraki adım" | 60 m, 5.3a'yı karşılamaz. Kesin çapa ada RNG akışına bağlı olduğu için ayrı bir tohum gerekir. | Tapınak çapaları sabit ofsetle hemen kesin; diğerleri Adım 13'te ayrı tohumla kesin (K-8) |
| D-11 | A | İthalat penceresi her yeni konukta host'a sorulur | Host'u sürekli bölen bir akış ve kötü UX | Host ayarı; varsayılan "Sınırlı (onaysız)" (§4.4) |
| D-12 | B | 30 `st` birikmesi en çok yaklaşık 3 puan eder; test tiki kovaya yeter | Hızlı `DK.sim` ile tik başına 3 `st` ve yalnız 40 ms bekleme oluyor; 20/sn'lik kova birkaç saniyede boşalır. | `st` kovası 30/sn (patlama 45) ve harness zaman oranı ≥ 0,5 (§12.8) |

**Hakemin yeni bulguları (iki tasarımda da yok):**

| ID | Önem | Bulgu | Kanıt | Kapatan |
|---|---|---|---|---|
| **Y-1** | yüksek | Tek konuk iletisiyle bütün konukları düşürme. PeerJS JSON kanalı ≥ 16 300 baytlık gönderimi yapmıyor ve `'error'` olayı yayıyor; host bu olayda `_dropPeer` çağırıyor. Konuk ham DataChannel'a 16 KB'lık bir `st` yazar. Host JSON sınıfı alım boyutunu sınırlamadığı için bu `st` her anlık görüntüye ham haliyle girer (`players[id] = r.target`). Host her konuğa gönderimde bu hatayı alır ve hepsini roster'dan siler. Meşru oyunda da `world` ve `welcome` iletileri uzun oturumda (çok kese, işaret ve ambar) 16 KB'ı aşarsa geç katılan konuk dünyayı alamaz ve düşürülür. | `peerjs.min.js` (JSON `_send`: `byteLength>=chunkedMTU` → `emitError`); `net.js:233`, `:241`, `:513-521`, `:737` | Adım 1 (`snapState`, `'error'` ayrımı), Adım 3 (`raw`, `worldPart`) |
| **Y-2** | orta | PeerJS JSON alım tarafı `JSON.parse`'ı try/catch'siz çalıştırıyor. Bozuk bayt dizisi PeerJS içinde yakalanmamış istisnaya yol açıyor; uygulama bunu sayamıyor ve cezalandıramıyor. | `peerjs.min.js` (JSON `_handleDataMessage`) | Adım 3 (`raw` + uygulama içi try/catch) |
| **Y-3** | düşük | Yumruk tabanı iki farklı yerde farklı hesaplanıyor: `weaponDamage` 8 × melee (`player.js:116-120`), `_meleeHit` 9 × melee (`combat.js:189`). Host hesabında tek kaynak gerekli. | Belirtilen satırlar | Adım 14 (`weaponBase()`) |

Denetimin B-01…B-21 bulgularının ve iki tasarımın ek bulgularının (A: E-1…E-9; B: N-1…N-11) kök nedenleri yeniden okundu. E-7 (`chestNet` içerik sızıntısı, `treasure.js:714`), E-8 (`Object.assign(quests.flags, m.flags)` ile `__proto__`, `net.js:568`), E-9 (hikâye tetikleyicileri her istemcide, `quests.js:276-289`), N-1, N-2 (`menu.js:261`, `:299`; `main.js:317`; `ui.js:99-104`), N-3 (`main.js:302-305`), N-4 (`net.js:460`), N-5 (`islands.js:742-751`, `:963`), N-6 (`islands.js:827`), N-10 ve N-11 kodda doğrulandı. Tarayıcıda koşulmadı.

---

## 0. Özet, ilkeler ve kapsam

### 0.1 Özet (nihai model)

1. **Model:** v0.4'te konuk sonucu bildiriyor, host kırpıyor. v0.5'te konuk niyet bildirir; host kendi dünyasında doğrular, sonucu hesaplar ve yayınlar. v0.4'teki 38 c2h türünün 15'i kaldırılır, 23'ü sertleştirilir ya da dönüştürülür, 6 tür eklenir; toplam 29 tür olur.
2. **Taşıma:** PeerJS ad alanı korunur (`dksh-v1-*`). v0.5 bağlantıları `raw` serileştirme kullanır; boyut ayrıştırmadan önce ölçülür. Büyük h2c iletileri ≤ 16 000 baytlık parçalara bölünür. Eski istemci okunur bir `reject` alır. Yeni istemci katılmadan önce `info` yoklamasıyla odanın sürümüne bakar.
3. **Kapı:** Sırasıyla faz, tür, boyut, oran, şema, `q` ve yetki denetlenir. Sınıf başına jeton kovası ve ihlal puanı vardır. Sürekli ihlal eden konuk ≤ 10 sn'de atılır. Host arayüzünde [At] ve [Odayı kilitle] bulunur.
4. **Kimlik ve profil:** Konuğun bu dünyadaki envanteri, altını, XP/rütbesi ve kişisel görevleri host'ta tutulur (`dksh.gbook.<worldId>`). Kimlik dünya başına bir anahtarla kanıtlanır: `hi` nonce'una, dünyaya ve iki peer kimliğine bağlı HMAC. Konuktaki değerler yalnız önbellektir. Eski konuk kaydı salt okunur kalır ve tavanlı ithalatın kaynağıdır.
5. **Ekonomi:** Konuk `tx{x,…}` talebi gönderir. Host tüccara yakınlığı, dükkân saatini, eşyanın profilde olup olmadığını, adedi, değeri, fiyatı ve `x` tekilliğini denetler. Planı atomik olarak uygular, payı `earnShared` ile hesaplar ve sonucu `txr` ile bildirir. Altın sonlu bir tamsayıdır: 0 ≤ altın ≤ 10⁹.
6. **Savaş:** Konuk `act{atk|shoot|throw|reload|parry|dodge}` gönderir. Host `cs` durum makinesini (bekleme, kombo, dayanıklılık, dolum) işletir. Vuruş `hitAt` anında doğrulanmış konumla, `_meleeHit`/`raycast` ve hedefin kendi `hurt()` fonksiyonuyla çözülür. Konuk animasyonu, sesi ve vuruş hissini yerelde tahmin eder. Konuğun canı host'ta gölge olarak tutulur.
7. **Hareket:** `st` iletisi şemalıdır. Host benzetim saatine göre kip başına mesafe bütçesi, kip geçiş tablosu ve dikey sınırlar uygulanır. Bütçeyi aşan konum kırpılır; büyük ya da süren sapmada `fix` gönderilir. Bütün yakınlık denetimleri `posOf(pid)` (r.auth) ile yapılır.
8. **Etkileşim ve dünya:** Sandık bir durum makinesiyle yönetilir. Ambar, kese ve yüzen nesne istekleri profil üzerinden işlenir. Kazı koordinatsızdır. Tehlikeler, ada nitelikleri (`feat`), hikâye ve diriltme için host kuralları vardır. Basılı tutma süresi dwell ile ölçülür.
9. **Gemi:** Kilitler beyaz listeli, gemi yerel koordinatında yakınlığa bağlı ve konuk başına birdir. `shipCmd` alt komutlarının şeması ve maliyeti vardır. Kayık durum makinesi uygulanır ve `boatSt` sonlu ve hız sınırlı olmalıdır. Konuktan `shipFull` kaldırılır.
10. **XSS:** Ağdan gelen hiçbir dize `innerHTML`'e girmez. Eşya verisi kaynağında yeniden kurulur. CSP savunma derinliği olarak eklenir.
11. **Sağlamlık:** Güncelleyiciler ayrılır, varlık başına `try/catch` ve karantina uygulanır, anlık görüntü bölüm başına korunur. Konuk da h2c iletilerini şemayla doğrular.
12. **Kalan sınır:** Host hilesi önlenemez (§1.5). Daha güçlü güvence için sunucu seçenekleri §1.6'dadır.
13. **Maliyet ve sıra:** 18 adım (0–17), ≈ 46 iş günü. İlk 5 adım (≈ 10 gün) bütün tek iletiyle çökertme, XSS ve sürüm açıklarını kapatır; hasar, altın ve ganimet sızıntılarını da geçici olarak sınırlar. Kalıcı ekonomi Adım 9'da, savaş Adım 15'te tamamlanır.

### 0.2 İlkeler

| # | İlke | Somut kural |
|---|---|---|
| P1 | Niyet, sonuç değil | Konuk hasar, altın, fiyat, ganimet tablosu, ambar/gemi/sandık tam durumu, hikâye aşaması ya da can göndermez. Gönderdiği sayılar yalnız sınırlı istek parametreleridir: nişan, dümen, adet. |
| P2 | Fail-closed | Eşik denetimi `within(a, b, r)` ile yazılır ve NaN'da reddeder. `d > eşik → reddet` biçimi yasaktır; kod incelemesinde bu kalıp aranır. |
| P3 | Yeniden kurma | Ağdan gelen nesne olduğu gibi saklanmaz, yayınlanmaz ya da bir nesneye atanmaz. Şema yeni bir nesne üretir. Yayınları yalnız host kurar. |
| P4 | Korunum | Eşya ve altın yalnız host olaylarından doğar: öldürme, kazı, sandık, ödül, satış. Konuk eylemleri var olanı yalnız yer değiştirir (çanta ↔ yer ↔ ambar ↔ tüccar). |
| P5 | Tek kural kaynağı, az değişiklik | Fiyat, hasar, XP ve ganimet kuralları saf çekirdeklerde durur. Yerel yol ve host işleyicisi aynı çekirdeği çağırır. Paylaşılan fonksiyonlara eklenen parametrelerin varsayılanı bugünkü davranışı verir. Tür adları korunur. |
| P6 | Zaman | Oran sınırı gerçek zamanla (`performance.now()`) ölçülür. Oyun kuralları (bekleme, kombo, dwell, dolum, hareket bütçesi, dükkân saati) host benzetim saatiyle (`game.playTime`, `time`) ölçülür. Konuk saati hiçbir kurala girmez. |
| P7 | Hata yalıtımı | Tek bozuk ileti ya da varlık host döngüsünü, anlık görüntüyü veya diğer konukları durduramaz. |
| P8 | Ölçülülük | Konukta tahmin kalır (animasyon, ses, yerel hasar hissi, kayık sürüşü). Host düzeltmeleri seyrek ve sınırlıdır. |
| P9 | Küçük adımlar | Her adım ayrı birleştirilir, kendi saldırı ve regresyon testleriyle kapanır. Yayın son adımdan sonra yapılır. |

### 0.3 Kapsam

- **Kapsamda:** 38 c2h türü ve bütün h2c türleri; ekonomi, konuk profili ve kimlik; savaş; hazine, etkileşim, tehlike, bulmaca ve hikâye; gemi ve kayık; hareket; XSS; hata yalıtımı; testler.
- **Kapsam dışı (yalnız etkisi yazıldı):** TURN ve oda sahibi devri (13. belge); kayıt sürümü göçü (Faz 4; bu tasarım yalnız isteğe bağlı yeni anahtarlar ekler); bot tespiti; sunucu otoriteli mimari (§1.6'da değerlendirildi).

---

## 1. Tehdit modeli ve güven sınırı

### 1.1 Korunan varlıklar

| Varlık | Yeri | Neden korunur |
|---|---|---|
| Host dünya kaydı: altın, eşya, gemi, hikâye, ada/tehlike/bulmaca durumu, boss yenilgileri | `dksh.online.N` | Kalıcıdır |
| Konuk profilleri (yeni) | Host'ta `dksh.gbook.<worldId>` | Konuk ilerlemesinin yetkili kopyası |
| Konuğun yerel verisi: tek oyunculu kayıtlar, kendi host kayıtları, eski konuk kaydı, diğer dünyaların anahtarları | Konuk localStorage | Kötü niyetli host'a karşı |
| Sayfa bütünlüğü | İki taraf | XSS kayıtları okur ve siler; aynı `github.io` kökenini paylaşan diğer projeler de etkilenir |
| Oturum sürekliliği | Host döngüsü, anlık görüntü | B-01…B-04, B-09 ve Y-1 tek iletiyle oturumu düşürüyor |
| Adalet: altın, XP, hasar, ganimet | Host | Kabul ölçütü |
| IP gizliliği | WebRTC | Eşler birbirinin IP adresini görür |

### 1.2 Saldırganlar

| Kod | Saldırgan | Yetenek | Bu tasarımdaki karşılığı |
|---|---|---|---|
| A1 | Değiştirilmiş konuk | DevTools ya da değiştirilmiş istemci. Her türü, her biçimi ve her sıklığı gönderebilir; zarfı (`q`, `x`) doğru üretebilir; ham DataChannel'a bayt yazabilir; yerel durumunu ve saatini değiştirebilir; yeni kimliklerle tekrar gelebilir (sybil). | Doğrulanır, sınırlanır ve atılır (G1–G5) |
| A2 | Kötü niyetli host | Dünyanın sahibidir; konuklara keyfî ileti gönderir. | §1.5 |
| A3 | Ağ | DataChannel DTLS ile şifreli olduğundan okuyamaz ve değiştiremez. Sinyal sunucusu SDP'yi taşır; DTLS parmak izi uçtan uca doğrulanmaz. | Sinyal sunucusuna güvenilir **[SUNUCU]** |
| A4 | Herkese açık yuva gaspı | `dksh-v1-pub-N` kimliklerini önceden kaplayıp sahte oda açar ve gelen konuklardan kimlik toplamaya çalışır. | Anahtar ağda gitmez; HMAC nonce'a ve `hid`'e bağlıdır (§2.2) |
| A5 | Yoklama seli | `info` bağlantılarıyla host'u meşgul eder. | Peer başına ve toplamda sınır (§2.1) |
| A6 | Kurallara uyan bot | Nişan ya da parry botu | Etkisi meşru üst sınırla sınırlı; tespit edilmez |

### 1.3 Güven sınırı

```
 KONUK TARAYICISI (güvenilmez)          DataChannel (DTLS, sıralı, güvenilir; raw JSON)   HOST TARAYICISI (dünyanın tek otoritesi)
 ┌───────────────────────────────┐  c2h: niyet (q; tx'te x)     ┌──────────────────────────────────────────────────────┐
 │ girdi → yerel tahmin           │ ───────────────────────────▶ │ KAPI: ham boyut → JSON → tür → faz → oran → şema → q  │
 │ önbellek: envanter/altın/XP    │                              │ YETKİ: r.auth (hareket), profil, cs, durum makineleri │
 │ h2c şema doğrulaması           │ ◀─────────────────────────── │ İŞLEYİCİ (try/catch) → sonuç → host kurar ve yayınlar  │
 │ yalnız textContent ile çizim   │  h2c: sonuç ve durum          │ KAYIT: dksh.online.N (worldId) ; dksh.gbook.<w>        │
 └───────────────────────────────┘                              └──────────────────────────────────────────────────────┘
   konuk localStorage: host verisi YALNIZ dksh.wtok.<w> ve dksh.wcache.<w> anahtarlarına yazılır
```

### 1.4 Güvenlik hedefleri

| Kod | Hedef | Ölçüt |
|---|---|---|
| G1 | Değiştirilmiş konuk, host'ta, diğer konuklarda ve kendi profilinde sınırsız altın, XP/rütbe, hasar ya da ganimet üretemez. Her kazancı meşru oyunun üst sınırıyla sınırlıdır. | §12.4 bileşik kabul testi |
| G2 | Tek konuk iletisi host döngüsünü, anlık görüntüyü ya da diğer konukları durduramaz. | Saldırılardan sonra `snapT` artar, sayfa hatası 0'dır (B-01/02/03/04/09, Y-1) |
| G3 | Ağdan gelen hiçbir veri, iki yönde de, betik çalıştıramaz. | 06g ve 06i'deki XSS kontrolleri |
| G4 | Kötü davranan bağlantı nedeni bildirilerek kapatılır. Host konuğu elle atabilir ve odayı kilitleyebilir. | B-17 testi |
| G5 | Farklı protokol sürümleri bağlanamaz ve kullanıcı açık bir ileti görür. | 06m |
| G6 | Kötü niyetli host, konuğun bu dünya dışındaki verisine dokunamaz. | 06i: `dksh.solo.*`, `dksh.guest.0`, `dksh.profile` bayt bayt aynı kalır |
| G7 | Tek oyunculu kip ve eski kayıtlar etkilenmez. | 00–17 senaryoları; v0.4 kayıt yükleme testi |
| G8 | Meşru oynanış bozulmaz; gecikmenin etkisi ölçülü kalır. | 06j (`--latency 120` dahil) |

### 1.5 Host hilesinin sınırı

P2P co-op'ta host, sunucunun ta kendisidir.

| Kötü niyetli host **yapabilir** | Kötü niyetli host **yapamaz** (bu tasarımla) |
|---|---|
| Kendi dünyasında her şeyi değiştirebilir: kendi altını, eşyası ve XP'si; düşman, boss, sandık, hikâye | Konuğun sayfasında betik çalıştıramaz (textContent, şema, CSP) |
| Kendi dünyasındaki konuk profilini şişirebilir, bozabilir ya da silebilir | Konuğun tek oyunculu kayıtlarına, kendi host kayıtlarına, eski konuk kaydına ve diğer dünyaların anahtarlarına yazamaz (§10.4) |
| Konuklara yanlış durum gösterebilir; konuğu öldürebilir, ışınlayabilir ya da atabilir | Konuğun anahtarını başka bir dünyada kullanamaz: anahtar ağda gitmez, HMAC nonce'a ve `hid`'e bağlıdır |
| Konuğun IP adresini görebilir (WebRTC'nin doğası) | Konuğun sekmesini h2c şeması, boyut sınırı ve ileti başına `try/catch` sayesinde çökertemez |

**Sonuç:** Güven modeli "güvendiğin arkadaşlarla co-op"tur. Herkese açık odaya katılırken şu uyarı gösterilir: "Oda sahibi bu dünyanın tek yetkilisidir; bu dünyadaki ilerlemen onun kaydında tutulur." Oda devri (13. belge) uygulanırsa varis aynı yetkiyi alır; GuestBook anahtarlarıyla birlikte devredilir. Host hilesini önlemek **[SUNUCU]** gerektirir (§1.6).

### 1.6 Sunucu otoriteli seçenekler

| Seçenek | Ne sağlar | Ne gerektirir | Geliştirme | İşletme | Öneri |
|---|---|---|---|---|---|
| **S0 — bu tasarım** (P2P, host otoriteli, konuk doğrulamalı) | Konuk hilesi host'un dünyasına ve diğer oyunculara geçmez. Host hilesi kendi dünyasıyla sınırlı kalır. | Sunucu gerekmez; statik yayın sürer | ≈ 46 iş günü | 0 | **Şimdi uygulanmalı** |
| S1 — TURN aktarıcısı | IP gizliliği; NAT arkasında bağlantı | Yönetilen TURN ya da coturn VPS | 5–10 gün | ~0,4–1 $/GB ya da 5–20 $/ay | IP gizliliği istenirse |
| S2 — İnce profil ve defter sunucusu (Cloudflare Workers + D1/Durable Objects, Supabase, Firebase) | Profiller sunucuda ve dünyalar arası taşınabilir. Ödüller saatlik bütçeyle sınırlanır, imzalı işlem günlüğü tutulur. Sybil kimlik/hesap ile sınırlanır. | Anonim ya da hesaplı kimlik; KVKK/GDPR yükümlülükleri. Sunucu host'un dünya beyanını doğrulayamaz, yalnız bütçeler. | 10–20 gün | 0–25 $/ay | Dünyalar arası ilerleme ya da lider tablosu istenirse |
| S3 — Başsız yetkili host (benzetim Node'da; konuklar WebSocket ya da sunucu tarafı WebRTC ile bağlanır) | Host hilesi biter | Benzetimin çizimden ayrılması gerekir (player, enemies, islands görsel kurulumla iç içe); izleme ve ölçekleme | 40–80 gün | Oda başına 0,3–1 vCPU; 10 eşzamanlı oda için ~20–60 $/ay | Yabancılarla eşleşme, rekabet ya da ödüllü içerik planlanırsa |
| S4 — Hazır çatı (Colyseus, Nakama) | Oda, eşleştirme ve ölçekleme hazır gelir | Oyun mantığı sunucuda yeniden yazılır; satıcıya bağımlılık | 80–150 gün | 25–200 $/ay | Ürün yönü değişirse |
| S5 — Karma | Arkadaş odaları S0 ile, herkese açık odalar S2/S3 ile çalışır | İki yolun birlikte bakımı | S2/S3'e ek ~5 gün | S2/S3 kadar | Uzun vadeli |

S0'daki niyet protokolü, saf kural çekirdekleri ve `posOf`/profil ayrımı S3'ün ön koşuludur. Aynı protokol sunucuya taşınabildiği için S0'a yapılan yatırım boşa gitmez.

### 1.7 Kalan riskler (özet; ayrıntısı §13.7'de)

Host hilesi **[SUNUCU]**. Sınırlı beyanlar (balık mücadelesi, köpekbalığı ganimeti, zıpkınla balık, yeni canlı görme) meşru üst hızla sınırlıdır ama doğrulanamaz. Tabanca sapması ve nişan desteği doğrulanamaz. Gölge dayanıklılık ve blok yaklaşık hesaplanır. Host'ta kurulu olmayan adalarda görüş hattı yalnız arazi ve tehlike kümeleriyle denetlenir. Sinyal sunucusu güvenilir varsayılır. IP adresi görünür.

---

## 2. Protokol

### 2.1 Ad alanı, sürüm ve el sıkışma

**Sabitler (`js/net/schema.js` başında):** `NS = 'dksh-v1'` (PeerJS kimlik ad alanı; **değişmez**), `PROTO = 2`, `PROTO_MIN = 2`, `BUILD = '0.5.0'` (yalnız tanı amaçlı).

**Sürüm kuralı (B-16):** Telde bir iletiyi, alanı ya da anlamı değiştiren her sürüm `PROTO`'yu bir artırır. Kural `schema.js` başında yazılıdır. Node testi `net_schema.mjs`, şema imzasının (türlerin ve alanların sıralı özeti) değişip `PROTO`'nun değişmediği durumu yakalar. Sürüm bir bağlantı özniteliğidir: bağlantıdaki her ileti, anlaşılan `PROTO`'nun şema kayıt defterine göre doğrulanır. Böylece kullanıcının istediği "her mesajda oyun sürümü" denetimi, ileti başına alan eklemeden karşılanır.

**Akış:**

```
Konuk (v0.5)                                                      Host (v0.5)
1) scout.connect('dksh-v1-<KOD>', {metadata:{type:'info'}, serialization:'json'})
                                                                  _onConn: info → {t:'info', name:cleanText(32), players, max, pw:B,
                                                                     started:B, ver:'dksh-v1', proto:2, build} ; 500 ms sonra kapat
   proto yok ya da < PROTO_MIN → "Bu oda eski sürümde (v0.4 ya da öncesi). Oda sahibinin oyununu güncellemesi gerekir." DUR
   proto > PROTO               → "Bu oda daha yeni sürümde. Sayfayı yenile (Ctrl+F5)." DUR
2) conn = peer.connect('dksh-v1-<KOD>', {serialization:'raw', reliable:true})
                                                                  _onConn: conn.serialization !== 'raw' (v0.3/v0.4 konuğu)
                                                                     → JSON {t:'reject', why:'Oyun sürümü farklı: bu oda v0.5. Sayfayı yenileyip
                                                                       güncel sürümü aç.'}; 300 ms sonra kapat; başka ileti işlenmez
                                                                  'open' → PeerGate (faz 'pre', 5 sn) →
   ◀── {"t":"hi","proto":2,"w":"<worldId>","n":"<16 B b64url nonce>","hid":"<host peer kimliği>"}
3) hi.proto !== PROTO ya da hi.hid !== conn.peer → kapat + ileti (aktarma koruması, §2.2)
   {"t":"hello","q":1,"proto":2,"build":"0.5.0","name":..,"app":{..},"pw":..|null,
    "auth":{"g":"<gid>","mac":"<b64url>"}|null,"legacy":{"lvl":..,"gold":..,"items":..}|null} ──▶
                                                                  sürüm → kara liste / oda kilidi → şifre → kapasite → kimlik (§2.2)
                                                                  → profil bağla ya da oluştur (§4.3–4.4)
   ◀── {"t":"welcome","id":pid,"color":..,"room":{..},"roster":[..],"started":B,"proto":2,
        "tok":{"w","g","k"}|yok,"lastTx":n,"prof":{inv,prog,pq,hp},"lim":{..}}
   ◀── (oyun sürüyorsa) worldPart{i,n,d} × n
```

| Karşılaşma | Davranış |
|---|---|
| v0.3/v0.4 konuk → v0.5 host | Konuk JSON serileştirmeyle bağlanır. Host aynı serileştirmeyle tek bir `reject` gönderir ve bağlantıyı kapatır. v0.4 bu metni `status.textContent` ile gösterir (`menu.js:226`); hızlı katılım yolunda (`menu.js:261`) gösterim v0.4'ün kendi sorunudur. |
| v0.5 konuk → v0.4 host | 1. adımdaki `info` yanıtında `proto` yoktur; konuk bağlanmadan durur ve açık bir ileti gösterir. |
| Herkese açık liste | `listPublic` gelen `info` nesnesini yaymaz, yeniden kurar: `{code:'PUB'+i, name, players:I(0,8), max:I(1,8), pw:B, started:B, proto:I(0,99), ping}` (N-4). `proto` yoksa ya da uyumsuzsa oda gri gösterilir, "Sürüm farklı" etiketi alır ve Katıl düğmesi kapalı olur. |
| `info` seli | Peer başına 10 sn'de en çok 3, toplamda 10 sn'de en çok 20 yoklama yanıtlanır (A5). |

**`hello` kuralları (B-15):**
- Bağlantı başına bir kez işlenir; ikinci `hello` bağlantıyı hemen kapatır.
- `pre` fazında `hello` ve `ping` dışındaki her ileti bağlantıyı hemen kapatır; meşru istemci bunu yapmaz.
- 5 sn içinde geçerli `hello` gelmezse bağlantı kapatılır.
- Şifre her bağlantıda tek kez denenir; yanlışsa `reject{code:'pw'}` gönderilir ve bağlantı kapanır. Oda 60 sn içinde 5 yanlış deneme alırsa 60 sn boyunca yeni bağlantıya `reject{code:'locked'}` döner.
- Ad `cleanName` ile ≤ 20 karaktere indirilir (`net.js:41`). `app` APP şemasından geçer (§2.5).
- Kapasite denetiminde aynı `gid` ile yeniden bağlanan konuk sayılmaz. Aynı `gid` zaten bağlıysa eski bağlantı `kick{code:'replaced'}` ile kapatılır; roster'da çift kayıt oluşmaz. Bugünkü ada göre eşleşme (`net.js:255`) kaldırılır.
- `reject` kodları: `version`, `pw`, `full`, `locked`, `banned`, `auth`, `proto`, `newLimit`.

### 2.2 Konuk kimliği: dünya anahtarı ve HMAC

- **`worldId`:** Online yuva ilk kez barındırılırken `crypto.randomUUID()` (yoksa `getRandomValues`) ile üretilir. İki yere yazılır: yuva kaydının üst düzeyindeki isteğe bağlı `worldId` alanına ve yedek eşleme `dksh.gslot.<N>`'e. v0.4'e dönülüp kayıt yeniden yazılırsa `worldId` düşer; eşlemeden geri bulunur.
- **İlk katılım:** `hello.auth = null`. Host yeni profil açar (§4.4): `gid = 'g' + base32(10 B)`, `key = 32 rastgele bayt`. `welcome.tok = {w, g, k}` yalnız bu bir kez gönderilir. Konuk `localStorage['dksh.wtok.'+w] = {g, k, room, at}` yazar.
- **Sonraki katılımlar:** Konuk `hi.w` için anahtarı bulursa şunu hesaplar:
  `mac = b64url(HMAC-SHA256(k, "dksh-auth|" + hi.n + "|" + hi.w + "|" + conn.peer + "|" + kendiPeerKimliği))`.
  Konuk `hi.hid === conn.peer` olduğunu doğrulamadan MAC hesaplamaz. Host aynı değeri kendi `this.peer.id` ve `conn.peer` değerleriyle hesaplar ve sabit süreli karşılaştırır.
- **Neden HMAC:** Anahtar ağda yalnız bir kez gider. Sahte host (A4) yalnız kendi nonce'una ve kendi peer kimliğine bağlı bir MAC alır; bu MAC gerçek host'ta geçmez. Aktarma girişimi (sahte host gerçek host'un `hi`'sini konuğa iletir) `hid` denetimine takılır. Konuğun MAC'i başka bir bağlantıda kullanılamaz, çünkü konuk peer kimliğine bağlıdır.
- **Doğrulama başarısız:** `gid` var ama MAC tutmuyorsa `reject{code:'auth'}` gönderilir ve 10 ihlal puanı yazılır. Konuk arayüzü "Yeni tayfa olarak katıl" seçeneğini sunar; bu seçenek `auth:null` ile yeni profil açar ve §4.4'teki sınırlara tabidir. Host "Tayfa" panelinden eski profili oyuncuya yeniden bağlayabilir: yeni anahtar üretilir ve `welcome.tok` ile gider.
- **Saklama:** Anahtar host'un GuestBook'unda düz olarak durur; host zaten dünyanın otoritesidir. `save.exportAll` (`save.js:77-81`) anahtarları da dışa aktarır. Bu durum belgelenir ve dışa aktarma penceresinde "konuk anahtarları dahil" uyarısı gösterilir.
- **Kriptografi:** `crypto.subtle.importKey/sign('HMAC', SHA-256)` kullanılır. **[BELİRSİZ]** `file://` ile açılan tek HTML'de `crypto.subtle` bulunması beklenir (`file:` güvenli bağlam sayılır), ama bu projede doğrulanmadı. Adım 0'da ölçülür; yoksa saf JS SHA-256/HMAC yedeği eklenir (~120 satır, birim testli).

### 2.3 Bağlantı fazları ve zaman aşımları

| Faz | Başlangıç | İzinli c2h türleri | Zaman aşımı |
|---|---|---|---|
| `pre` | `open` | `hello`, `ping` (diğerleri bağlantıyı kapatır) | 5 sn içinde `hello` |
| `lobby` | `welcome` | `ping`, `ready`, `app`, `chat`, `importReq`, `sync` | — |
| `load` | `start` ya da `worldPart` | `ping`, `chat`, `st`, `sync`, `importReq` | 60 sn (ilk geçerli `st` ile `game` fazına geçilir) |
| `game` | ilk geçerli `st` | `ready` dışında bütün türler | 15 sn sessizlik (bugünkü kural, `net.js:704`) |

### 2.4 İleti zarfı, `raw` serileştirme ve boyut

- **Serileştirme:** v0.5 bağlantıları `serialization:'raw'` kullanır. PeerJS 1.5.5 bunu destekler (`peerjs.min.js`: `None:"raw"`). Raw sınıfı dizeyi PeerJS içinde ayrıştırmadan ve boyut sınırı uygulamadan `_bufferedSend` ile iletir. Gönderen `JSON.stringify` yapar. Alıcı sırasıyla:
  1. `typeof raw === 'string'` değilse 10 puan ve düşür.
  2. `raw.length > HARD_MAX` (32 768) ise 10 puan ve **ayrıştırmadan** düşür.
  3. Bağlantı bayt kovası (`bytes.take(raw.length)`) boşsa düşür.
  4. `JSON.parse` `try/catch` içinde; hata 10 puan.
  5. Sonuç düz nesne olmalı ve `t` kayıtlı bir tür olmalı; değilse 5 puan.
  6. `raw.length ≤ S[t].max` olmalı; değilse 10 puan.
  7. Faz denetimi (§2.3).
  8. Tür kovası ve genel kova (§2.6).
  9. Şema (§2.5).
  10. `q` denetimi (§2.8).
  11. İşleyici (§2.9).
- **c2h zarfı:** `{t, q, …}`. `q` bağlantı başına 1'den başlar ve kesin artar. `tx` iletisinde ayrıca `x` bulunur (§4.10).
- **h2c zarfı:** `{t, …}`. Yanıtlarda isteğin `q` değeri (gerekirse `x`) bulunur. Anlık görüntüdeki `ak` alanı host'un işlediği son `st` sırasını taşır.
- **Büyük h2c iletileri:** `world` → `worldPart{i, n, d}`; her parça ≤ 16 000 bayt, toplam ≤ 512 KB. Konuk parçaları birleştirir ve şemadan geçirir. `welcome.prof` sınırlıdır (yığın ≤ 160). Anlık görüntü varlık sayısı sınırlarıyla en çok 64 KB'tır (§10.3). **[BELİRSİZ]** Tarayıcıların `max-message-size` değerleri farklı olduğu için parça boyu bilerek küçük tutuldu; Adım 3'te Chromium'da ölçülür, Firefox'ta da denenmelidir.
- **Y-1 kapanışı:** JSON kanalındaki 16 300 baytlık gönderim sınırı raw'da yoktur. `conn.on('error')` artık koşulsuz `_dropPeer` çağırmaz: `err.type === 'message-too-big'` ise yalnız günlüğe yazar ve sayar; diğer hatalarda bugünkü gibi düşürür. Ham `st` yansıtması kalkar (§8.7).

### 2.5 Şema kayıt defteri (`js/net/schema.js`)

Dilbilgisi; her doğrulayıcı ya geçerli değeri döndürür ya da başarısız olur, hiçbir girdide istisna atmaz:

| Gösterim | Anlam |
|---|---|
| `F(lo,hi)` | `Number.isFinite`, aralık içinde. Aralık dışı **ret** (kırpma yok). NaN, Infinity ve dize her zaman ret. |
| `I(lo,hi)` | `Number.isInteger`, aralık içinde |
| `B` | Yalnız `true`/`false` |
| `S(max, re?)` | Dize. Kontrol karakterleri (U+0000–001F, U+007F–009F) ve yön denetimleri (U+202A–202E, U+2066–2069) silinir, NFC'ye çevrilir, `max`'a indirilir, isteğe bağlı kalıpla denetlenir. |
| `ID(max=40)` | `/^[A-Za-z0-9_:.\-]+$/` |
| `E(…)` | Sabit küme |
| `V3(lo,hi)` | 3 elemanlı sonlu dizi |
| `DIR3` | Uzunluğu 0,95–1,05 olan vektör; host yeniden normalleştirir |
| `A(tip, n)` | En çok `n` elemanlı dizi |
| `O{…}` | Düz nesne (`Object.getPrototypeOf(x) === Object.prototype`); yalnız tanımlı alanlar kopyalanır; derinlik ≤ 3 |
| `N(x)`, `opt(x)` | `null` kabul / alan eksik olabilir |
| `DICT(k, v, n)` | En çok `n` anahtar. `__proto__`, `constructor` ve `prototype` ret; sonuç `Object.create(null)` (E-8) |

**Genel kurallar:** Tanımsız alanlar sessizce atılır. Zorunlu alan eksikse ret. Çıktı her zaman yeni bir nesnedir ve işleyiciler yalnız bunu görür (P3). Bugünkü `num(v, lo, hi, def=0)` yardımcısı (`net.js:39`) konum alanlarında kullanılmaz: NaN değerini 0 yapar ve oyuncu dünya merkezine ışınlanmış sayılır. Aynı kayıt defteri h2c yönünde de kullanılır (§10.3).

**Sabit kümeler:** `MODES = ground, deck, helm, cannon, swim, climb, boat`. `EQUIP = none, sword, pistol, shovel, rod, map, harpoon, net` (`player.js:22`); `kk:` önekine izin yoktur (N-11). `ANIMS`: `character.js` ve `kk.js` klip adlarından bir kez kurulan küme; bilinmeyen ad `Idle` sayılır. `ROLES = Object.keys(MERCHANTS)` ve `quest, shipwright, tailor, gambler, board, cartographer`. `SKILL_IDS` progress.js'teki SKILLS tablosundan alınır. `REASONS` ve `OPS` için bkz. §4.

**APP şeması** (`appearance.js` anahtarları): `name:S(40)`, `gender:E('m','f')`, `skin:I(0,9)`; saç, sakal, şapka ve ceket için appearance.js'teki sabit kümeler; renkler için `/^#[0-9a-f]{6}$/i` ya da `CLOTH_COLORS` dizini; `age:F(0,1)`, `build:F(0.8,1.25)`, `height:F(0.85,1.15)`. En büyük boyut 1 KB. Bilinmeyen anahtar atılır. Uzak karakter kurulumu `try/catch` içindedir; hata alınırsa varsayılan görünüm kullanılır.

### 2.6 Oran sınırı: jeton kovası

Sabit pencereli 120 ileti/sn sınırı (`net.js:241-247`) kaldırılır. Bağlantı başına ve sınıf başına jeton kovası kullanılır: `tok = min(cap, tok + rate·Δt)`, her ileti 1 jeton harcar. Ölçüm `performance.now()` ile yapılır. `st` ve `ping` artık muaf değildir.

| Sınıf | Türler | Dolum (/sn) | Kapasite | Aşımda |
|---|---|---|---|---|
| `state` | `st` | 30 | 45 | düşür, +1 |
| `drive` | `helm`, `boatSt` | 30 | 45 | düşür, +1 |
| `combat` | `act` | 8 | 10 | düşür, +1 |
| `interact` | `chestReq`, `pickupReq`, `floatReq`, `dig`, `hold`, `holdTake`, `item`, `feat`, `fish`, `hazard`, `boat`, `revive`, `story` | 6 | 12 | düşür, +1 |
| `ship` | `shipCmd`, `fire`, `lock` | 6 | 10 | düşür, +1 |
| `tx` | `tx` | 4 | 8 | düşür, +1; `txr{ok:false, why:'oran'}` |
| `social` | `chat`, `marker` | 1 | 4 | düşür, +1 |
| `session` | `ping`, `sync` | 1 | 3 | düşür, +1 |
| `lobby` | `ready`, `app` | 0,5 | 2 | düşür, +1 |
| `once` | `hello`, `importReq` | bağlantıda / oturumda 1 | — | §2.1 |
| **genel** | hepsi | 60 | 90 | düşür, +1 |
| **bayt** | hepsi | 48 KB | 64 KB | düşür, +1 |

Oran aşımı puanı saniyede en çok 10'dur. Meşru en kötü durum yaklaşık 15 `st` + 15 `helm` ya da `boatSt` + birkaç istekle saniyede ≈ 35 ileti ve ≤ 12 KB'tır. `st` ve `drive` kovaları 15 Hz'in iki katı payla ayarlandı (testler §12.8). Gerçek sıklık sınırlarını durum makineleri koyar: saldırı beklemesi, dwell, balık zamanlayıcısı. Kovalar ve `_rate`/`_gold` haritaları `_dropPeer`'da silinir (B-17).

### 2.7 İhlal puanı ve bağlantının sonlandırılması (`js/net/guard.js`)

| Olay | Puan |
|---|---|
| Ham boyut aşımı, ayrıştırılamayan JSON, dize olmayan veri | 10 |
| Bilinmeyen tür (kaldırılmış eski türler dahil) | 5 |
| Şema hatası | 5 |
| Faza uymayan ileti (`pre` hariç; orada bağlantı kapatılır) | 5 |
| `q` geri gitti ya da yinelendi | 5 |
| İşleyicide konuk verisinden kaynaklanan istisna | 10 |
| Yetkisiz eylem (kilitsiz `helm`, taşıyıcı olmayanın bırakması, profilde olmayan `sid`) | 3 |
| Menzil dışı istek | 1 (gecikme yüzünden meşru retler olabileceği için düşük) |
| Durum makinesi reddi (bekleme, sıra dışı komut) | 1 |
| Oran aşımı (saniyede en çok 10) | 1 |
| Konum düzeltmesi `fix` (olağan) / ışınlanma boyutu | 1 / 5 (hareketten saniyede en çok 10) |
| Kimlik doğrulama hatası | 10 |

- **Azalma:** saniyede 2 puan.
- **40 puan:** Host'a bir kez "‹ad› şüpheli veri gönderiyor" bildirimi gösterilir; olay türüyle birlikte günlüğe yazılır; konuğa `warn` gider.
- **100 puan:** `kick{code:'protocol', why:'Bağlantı kuralları ihlal edildi'}` gönderilir, 250 ms sonra `conn.close()` ve `_dropPeer` çalışır. `gid` ve peer kimliği oturum boyunca kara listeye alınır; yeniden bağlanan `reject{code:'banned'}` alır. Saniyede 500 ileti gönderen konuk ~2 sn'de atılır (B-17'nin ≤ 10 sn hedefi). Sürekli ışınlanma deneyen konuk ~20–35 sn'de atılır. Kısa bir gecikme sıçraması birkaç puan üretir ve söner.
- **Host arayüzü:** "Tayfa" paneli lobide ve duraklatma menüsünde bulunur. Her konuğun yanında [At] düğmesi vardır; panelde ayrıca [Odayı kilitle], profil listesi, "Profili bağla/sıfırla" ve "Defter" yer alır. `kick` iletisi artık gerçekten gönderilir; bugün yalnız konukta işleniyor (`net.js:577`).
- **`_dropPeer` savunmacı yazılır:** Her temizlik adımı (avatar, sandık taşıyıcıları, kilitler, kayık sürücüsü, kovalar, kapı) ayrı `try/catch` içindedir. `Array.isArray(carriers)` değilse dizi onarılır (B-10'daki `includes` TypeError'ı, `net.js:398`).

### 2.8 Tekrar engelleme

| Katman | Mekanizma | Ne korur |
|---|---|---|
| Ağ | DTLS | Üçüncü tarafın iletiyi tekrar oynatması |
| Kimlik | Nonce + `hid` + konuk peer kimliği HMAC'e bağlı | Kimlik kanıtının başka bağlantıda kullanılması |
| Bağlantı | `q` kesin artar; `q ≤ lastQ` → 5 puan, düşür | Aynı bağlantıda tekrar ya da sıra bozma |
| İşlem | `x` profil başına kesin artar ve kalıcıdır (`profile.txSeq`); son 32 sonuç önbellekte | Yeniden bağlandıktan sonra tekrar: çift satış, çift alış, çift ödül (5.1f, 5.1h) |
| Nesne | Her geçiş mevcut durumu yeniden denetler (karşılaştır ve değiştir); örneğin sandık `gone` ise `open` reddedilir, kese `remove` ise toplama reddedilir | Aynı sandığın, kesenin ya da yüzen nesnenin iki kez verilmesi (5.3b, 5.3c) |

`x` kuralları: `x ≤ txSeq` ve sonuç önbellekteyse aynı `txr` yeniden gönderilir, işlem tekrarlanmaz (idempotans). `x ≤ txSeq` ama sonuç önbellekte değilse `txr{ok:false, why:'dup'}` döner ve 3 puan yazılır. `x > txSeq + 1000` ise `why:'gap'`. `welcome.lastTx` sayesinde konuk sayacını kaldığı yerden sürdürür. Konuk bir `tx` yanıtını en çok 5 sn bekler; süre dolarsa aynı `x` ile bir kez yeniden gönderir.

### 2.9 İşleyici iskeleti

```js
// net.js — host
_onRaw(conn, raw) {
  const c = this.gates.get(conn.peer); if (!c || c.closing) return;
  const v = c.receive(raw);                  // §2.4 adım 1–10: boyut, bayt kovası, JSON, tür, faz, oran, şema, q
  if (!v) return;                            // ihlal puanı c.receive içinde yazıldı
  const h = HANDLERS[v.t];                   // hostOps / hostCombat / econ / moveAuth işleyicileri
  try {
    const r = h(c, v);                       // undefined (kabul) ya da {rej:puan, why} (ret)
    if (r?.rej) { c.violate(r.rej, v.t + ':' + r.why); if (r.reply) c.send(r.reply); }
  } catch (e) { c.violate(10, 'istisna ' + v.t); guard.logOnce(v.t, e); }
}
```

- İşleyiciler ileti gelir gelmez çalışır. Zaman damgası `game.playTime`'dır, yani host benzetim saati. A'nın niyet kuyruğu alınmadı: ileti olayları kare ortasında çalışmaz, kuyruk yalnız gecikme eklerdi.
- Host'un kendi eylemleri bu yoldan geçmez, bugünkü gibi yerel çalışır.
- Ev sahibi işleyicileri yalnız `G.online && G.isHost` iken kayıtlıdır. Konuk dalları `G.online && !G.isHost` koşuluna bağlıdır. Tek oyunculu kipte yeni kodun hiçbiri çalışmaz.

### 2.10 Basılı tutma süresi (dwell) ve ardışık süre bütçesi

Basılı tutmalı eylemler (sandık açma 1,4 sn, tutsak 2,5 sn, delik/top onarımı 2,2/`mods.repair`, direk 5/`mods.repair`, kova 0,6, yangın 1,4, kaya takozu 0,8, diriltme 2,5, kazı 2,6/`mods.dig`) için konuk yalnız tamamlanma iletisini gönderir. Ayrı başla/bitir iletisi yoktur. Host şu yardımcıyla denetler:

```js
guard.holdOk(c, target, radius, dur) :=
  now = game.playTime;  need = 0.85 * dur
  now - c.lastHoldEnd ≥ need                              // ardışık eylemler ardışık süre harcar
  && c.auth.hist.every(t ∈ [now − need, now] ⇒ within3(posAt(t), target, radius))  // kesintisiz yakınlık (r.auth geçmişi, 3 sn halka)
  → kabul edilirse c.lastHoldEnd = now
```

Böylece yakında durup aynı anda üç delik onarımı göndermek reddedilir. Eylem başına ayrıca bir bekleme vardır (ör. kova 0,48 sn). Konukta istemci değişikliği gerekmez; yalnız mevcut tamamlanma iletisi yeni şemaya uyar.

---

## 3. İleti kataloğu

### 3.1 v0.4'teki 38 tür → v0.5

Karar kodları: **K** = korunur ve sertleştirilir, **D** = biçimi dönüşür, **X** = konuk yönünde kaldırılır (bazıları h2c olarak yaşar). Yakınlık denetimleri her zaman `posOf(pid)` (r.auth, §8) ile ve istemci yarıçapı + `TOL` (0,8 m) ile yapılır. **Adım** sütunu kalıcı çözümün geldiği uygulama adımıdır (§11.3); "→" geçiş önleminden kalıcı çözüme geçişi gösterir.

| # | Tür | Karar | v0.5 biçimi (c2h) | Host doğrulaması (özet) | Host çıktısı | Bulgu | Adım |
|---|---|---|---|---|---|---|---|
| 1 | `hello` | D | `hello{q,proto,build,name,app,pw,auth,legacy}` | §2.1–2.2: faz, tek sefer, 5 sn, sürüm, kara liste, şifre, kapasite, HMAC, `cleanName`, APP | `welcome` / `reject{code}`; roster | B-15, B-16, B-19 | 3, 7 |
| 2 | `ping` | K | `ping{q,ts:F(0,1e12)}` | Sınıf `session`; ≤ 64 B | `pong{ts}` (doğrulanmış sayı) | B-15 | 3 |
| 3 | `ready` | K | `ready{q,v:B}` | Yalnız `lobby` | roster | B-15 | 4 |
| 4 | `app` | K | `app{q,name,app}` | APP şeması; `cleanName`; oyunda 10 sn'de 1; karakter `try/catch` içinde kurulur | roster | B-15 | 3 |
| 5 | `chat` | K | `chat{q,text:S(240)}` | Boş olamaz; sınıf `social` | `chat{from, text, color}` (`from` ve `color` host'tan) | B-21 | 4 |
| 6 | `st` | D | `st{q,s:{ts,x,y,z,yaw,anim,up,loop,mode,eq,torch,swimP,air,ship,lx,lz,ly,hp,down,carry}}` | Şema; hareket doğrulayıcısı (§8); `eq` profilde yoksa `none`; `hp` yalnız gölge canı düşürebilir; `down` ve `carry` yok sayılır | `snapState`; `fix`; türetilen gürültü ve yaralanma | B-04, N-10, N-11 | 1, 6, 15 |
| 7 | `act` | D | `act{q,a,…}` savaş niyeti (§5.2) | `cs` durum makinesi (§5.3) | Saldırana `hit`; diğerlerine `act{from: pid}` (host kurar) | B-07, B-20 | 4 → 14, 15 |
| 8 | `hurtEnemy` | X | `act{atk/shoot/throw}` | Adım 4–13 arası geçiş sertleştirmesi (§5.14) | — | B-07 | 4 → 14 |
| 9 | `hurtBoss` | X | Aynı | Aynı; mesafe denetimi ve `kind` beyaz listesi | — | B-07 | 4 → 14 |
| 10 | `stunEnemy` | X | `act{parry, aid}` | §5.10 | — | B-07 | 4 → 15 |
| 11 | `hurtAnimal` | X | `act` | Geçiş sertleştirmesi | — | B-07 | 4 → 14 |
| 12 | `hurtMarine` | X | `act` | Geçiş sertleştirmesi | — | B-07 | 4 → 14 |
| 13 | `dig` | D | `dig{q}` (koordinat yok) | Profilde kürek, `eq` shovel, kip `ground`, taşımıyor; gelgit ve ıslaklık kuralı; nokta = r.auth + 0,9 m ileri; dwell (§2.10); etkin alanlar profildeki haritalardan | `hole`; `chestSpawn`; `inv` (harita düşer); `xp` | B-10 | 12 |
| 14 | `chestReq` | D | `chestReq{q,a:'pick'\|'open'\|'drop'\|'stow'\|'boat',id,ship?}` | Durum makinesi (§6.2); yakınlık 3,4; `open` için dwell 1,4 sn | `carryOk`, `chestState`, `chestGone`; içerik profile (`inv`) | B-10 | 12 |
| 15 | `pickupReq` | K | `pickupReq{q,id}` | Kese var ve `remove` değil; 3,2 m (kayıkta 4,3); kapasite profilde | `pickupGone` / `pickupItems`; `inv` | B-10 | 12 |
| 16 | `chestState` | X | `chestReq` drop/stow/boat | — | h2c kalır (host kurar) | B-10 | 8 |
| 17 | `chestGone` | X | `tx{a:'sellChest'}` | — | h2c kalır | B-08, B-10 | 9 |
| 18 | `hold` | D | `hold{q,a:'put'\|'get',ship,sid?,id?,n,fi?}` | Konuk o geminin güvertesinde ve ambar istasyonuna ≤ 2,4 m; `sid` profilde; bağlı değil; kapasite | Süzülmüş `hold`; `inv` | B-05, N-8 | 4 → 8 |
| 19 | `shipFull` | X | `tx{a:'svc'}` | — | h2c kalır (şemalı, atomik) | B-01, N-1 | 5 |
| 20 | `marker` | K | `marker{q,x,z,note}` | ±10 000; `S(80)`; konuk başına ≤ 10; sınıf `social` | `marker{by: host'tan}`; bildirim 5 sn'de en çok 1 | B-21 | 4 |
| 21 | `hazard` | D | `hazard{q,id,a:'ignite'\|'release'\|'push',x?,z?}` | §6.7 | `hazard` (host kurar) | B-11 | 13 |
| 22 | `shipCmd` | D | `shipCmd{q,ship,cmd,…}` (alt şemalar) | §7.4 | `shipCmdFx`; gemi durumu anlık görüntüde | B-02 | 5 |
| 23 | `helm` | K | `helm{q,ship,rudder:F(-1,1),sail:F(0,1),back:B}` | Kilit bu konukta; kip `helm`; gemi batmamış; dümene ≤ 2,1 m | — | B-13 | 5 |
| 24 | `fire` | K | `fire{q,ship,i:I(0,15),yaw,pitch}` | `cannon<i>` kilidi; kip `cannon`; `i` < top sayısı; `canFire`; batmamış | `cannon` | B-13, B-02 | 5 |
| 25 | `boat` | D | `boat{q,cmd:'launch'\|'dock'\|'enter'\|'exit'}` (`who` yok) | §7.6 | `boat` durum yayını | B-03 | 5 |
| 26 | `boatSt` | K | `boatSt{q,x,z,yaw,sp,rp}` | Yalnız sürücü; sonlu; hız, dünya sınırı ve kara denetimi | Anlık görüntüde `rb` | B-03 | 5 |
| 27 | `lock` | K | `lock{q,id,on:B}` | Beyaz liste; gemide ve istasyona yakın; konuk başına 1; batmamış; host önceliği | `lock{who}`; `station{release}` | B-13 | 5 |
| 28 | `gold` | X | `tx` | Adım 4'te kapatılır | h2c `gold{g,d,r}` | B-08 | 4 → 9 |
| 29 | `maps` | X | — | Profildeki haritalardan türetilir | — | B-10 | 12 |
| 30 | `downed` | X | — | Gölge candan türetilir (Adım 15'e kadar `st.down` geçişinden, 1 bildirim/5 sn) | Host bildirimi | B-21 | 4 → 15 |
| 31 | `revive` | D | `revive{q,target}` | Hedef host'un bilgisine göre yaralı; dwell ≥ 2,2 sn, ≤ 3,3 m; kaldıran ayakta | Hedefe `revive`; `hp` | B-14 | 13 |
| 32 | `floatReq` | K | `floatReq{q,id}` | `within(reach + 0,8)`; kayıktan ya da güverteden sandık alınamaz | `inv` / `gold` / `carryOk`; `floatGone` | B-10 | 12 |
| 33 | `inter` | X | — (ölü tür) | — | — | B-21 | 4 |
| 34 | `prog` | X | — (ölü tür) | — | — | B-21 | 4 |
| 35 | `lootReq` | X | `item{drop}`; ganimet yalnız host olaylarından | Adım 4'te bütçeli geçiş (§4.18) | `pickupSpawn` | B-05, B-06 | 4 → 8 |
| 36 | `holdTake` | K | `holdTake{q,ship,idx:I(0,39),cid}` | Güvertede; ambara ≤ 2,4 m; taşımıyor; `hold.chests[idx].id === cid` | `carryOk`, `hold`, `chestState` | B-05 | 12 |
| 37 | `noise` | X | — | Host türetir (§8.8) | — | B-21 | 4 |
| 38 | `story` | D | `story{q,ev:'tuzla'\|'ilkHarita'\|'gunluk'}` | Geçiş tablosu (§6.9) | `story` | B-12 | 13 |

**Sayım:** 15 tür konuk yönünde kaldırılır (`hurtEnemy`, `hurtBoss`, `stunEnemy`, `hurtAnimal`, `hurtMarine`, `chestState`, `chestGone`, `shipFull`, `gold`, `maps`, `downed`, `inter`, `prog`, `lootReq`, `noise`). 23 tür korunur ya da dönüşür. 6 tür eklenir. Toplam 29 c2h türü.

### 3.2 Eklenen c2h türleri

| Tür | Biçim | Sınıf / en büyük | Bölüm |
|---|---|---|---|
| `tx` | `{q, x:I(1,2³¹−1), a:E(OPS), …}` alt şemalar | `tx` / 2 KB | §4.7–4.11 |
| `item` | `{q, a:'drop'\|'use', sid:ID, n:I(1,999)}` | `interact` / 128 B | §4.5, §6.3 |
| `feat` | `{q, id:S(64,/^(chest\|altar\|lever\|free\|wreck\|shell\|shark\|see\|pzc):[A-Za-z0-9_:.\-]*$/)}` | `interact` / 128 B | §6.8, §4.16 |
| `fish` | `{q, a:'cast'\|'catch'\|'net'\|'spear'\|'cancel', c:I, x?, z?, bait?, key?, ok?}` | `interact` / 192 B | §4.16 |
| `sync` | `{q, what:'inv'\|'prof'\|'world'}` | `session` / 64 B | §4.5 |
| `importReq` | `{q, inv:{gold, stacks:A(…,200)}, prog:{level, skills}, pq}` | `once` / 16 KB | §4.4 |

`act` alt türleri: `atk{mv:'light'|'heavy'|'counter', w:'sword'|'fist', yaw:F(-50,50)}`, `shoot{o:V3, dir:DIR3}`, `throw{o:V3, dir:DIR3}`, `reload{}`, `parry{aid:ID}`, `dodge{dir?:V3}` (sınıf `combat`, ≤ 320 B).

### 3.3 Host → konuk türleri

Her h2c iletisi konukta şemadan geçer (§10.3). Hiçbir h2c ileti ağdan gelen ham nesneyi yansıtmaz.

| Tür | Durum | Ne zaman | Not |
|---|---|---|---|
| `hi` | yeni | Bağlantı açılınca | `proto, w, n, hid` |
| `welcome`, `reject` | değişti | `hello` yanıtı | `tok` (yalnız ilk sefer), `lastTx`, `prof`; `reject.code` |
| `info` | değişti | Yoklama | `proto`, `build` eklendi |
| `pong`, `roster`, `start`, `chat` | korunur | | Şemalı; roster alanları beyaz listede (§3.4) |
| `worldPart` | yeni (`world` yerine) | Katılım ve oyun başı | ≤ 16 000 baytlık parçalar; sandık içeriği yok; `feats` var |
| `snap` | değişti | 15 Hz | `players` → `snapState` (host'un süzdüğü durum); bölüm başına `try/catch`; sayılar `fin()`; `ak` |
| `inv` | yeni | Profil envanteri değişince | `{rev, st:[{id,n,sid,d?,b?}] ≤ 160, g, cap}`; karede birleştirilir, en çok 5/sn |
| `prof` | yeni | XP, seviye ya da yetenek değişince | `{lvl, xp, pts, sk, seen, maxHp}` |
| `gold` | değişti | Altın değişince | `{g: yeni toplam, d: fark, r: gerekçe kodu}` |
| `xp` | değişti | XP kazanınca | `{d, r: REASONS kodu, L, X, P}`; serbest metin yok |
| `txr` | yeni | Her `tx` için | `{q, x, ok, why?, d?}` |
| `hit` | yeni | Konuğun saldırısı çözülünce | `{q?, r: [[id, 'hit'\|'blocked'\|'dodged'\|'immune', dmg]] ≤ 16}` |
| `hp` | yeni | Gölge can düzeltmesi, yaralanma, diriltme | `{v, down?, dead?}` |
| `hurt` | korunur | Düşman konuğa vurunca (yerel his için) | Şemalı: `dmg ≤ 500`, `kb ≤ 12`, `cause S(60)` |
| `fix` | yeni | Hareket düzeltmesi ya da host'un yaptırdığı ışınlama | `{x,y,z,mode,ship,lx,ly,lz,why}` |
| `station` | yeni | Host istasyonu devraldı ya da konuk uzaklaştı | `{a:'release', id}` |
| `bite` | yeni | Olta atışı | `{c, key, w, in}` |
| `featSt` | yeni | Ada niteliği ya da tehlike durumu değişince | `{id, st, until?}` |
| `give` | korunur, yalnız bildirim | Eşya verilince | Yetkili değişiklik `inv` ile gelir |
| `kick` | ilk kez gerçekten gönderilir | Atma | `{code, why: S(160)}` |
| `warn` | yeni | İhlal puanı 40'ı aşınca | |
| `revive` | korunur | Diriltme | Konukta yalnız yerel oyuncu yaralıysa uygulanır |
| `floatSpawn/Gone`, `chestSpawn/State/Gone`, `pickupSpawn/Gone/Items`, `hole`, `hold`, `shipFull`, `marker`, `hazard`, `story`, `weather`, `sleep`, `teleport`, `lock`, `cannon`, `boat`, `shipCmdFx`, `carryOk` | korunur | | Şemalı (§10.3); `chestSpawn` ve `chestState` içeriksiz |
| `mapUsed` | kaldırılır | | Yerine `inv` |

### 3.4 Alan düzeyindeki değişiklikler

- `chestNet(c)` konuklara `{id, tier, pos, state, carriers}` gönderir. `contents` ve `siteId` yalnız host'ta kalır (E-7, `treasure.js:714`).
- `hold` iletisi sandıklar için `{id, tier, w}`, eşyalar için `{id: n}` (0–999, ≤ 60 anahtar), balıklar için `{key, w}` taşır.
- `pickupNet.items[*][2]` (eşya verisi) yalnız şemalı türlerde (balık, harita, harita parçası) ve `normItemData` ile yeniden kurulmuş olarak gider (§9.4).
- Roster kaydı: `{id, name: cleanName, color: palet, ready: B, host: B, app: APP}`; fazladan alan atılır.
- `act.from` her zaman gönderenin peer kimliğidir (B-20). Bugün `broadcast(m, pid, {from: pid})` çağrısındaki üçüncü argüman yok sayılıyor (`net.js:277`, `:489`).
- `quests.flags` iki yönde de beyaz listedeki anahtarlarla kopyalanır; `Object.assign` kullanılmaz (E-8).

---

## 4. Ekonomi ve konuk profili

### 4.1 Model

Bugün konuğun envanteri, altını, rütbesi, yetenekleri ve kişisel görevleri yalnız konuğun localStorage'ında duruyor: `guest` yuvası ve `dksh.progress.guest` (`main.js:187-206`, `progress.js:94-110`). Host'ta konuk profili yok (B-19). v0.5'te:

- Konuğun **bu dünyadaki** envanteri, altını, XP/rütbe/yetenekleri, canı ve kişisel görevleri host'ta tutulur (`js/net/guestBook.js`).
- Konuktaki kopya yalnız önbellektir. Ekranda gösterilir, ama host hiçbir kararını ona dayandırmaz. Host her değişiklikte yetkili değeri gönderir (`inv`, `prof`, `gold`, `xp`, `hp`).
- Profilin `inv` alanı mevcut `Inventory` sınıfının bir örneğidir. `add`, `remove`, `removeStack`, `canAdd`, `count` ve `weight` olduğu gibi kullanılır; sınıf §4.12'deki gibi sertleştirilir.

```js
// Host: GuestBook.list[gid]
{
  gid, key,                                   // kimlik ve HMAC anahtarı (§2.2)
  name, createdAt, lastSeen, sessions,        // ad yalnız görüntü içindir
  inv:  { stacks: [{id, n, sid, data?, b?}], gold, capacity },  // YETKİLİ envanter; b=1 bağlı eşya; sid host'un verdiği yığın kimliği
  prog: { level, xp, points, skills, seen },  // YETKİLİ ilerleme
  pq:   { side, completed, discovered, collection, stats, achievements },
  hp, unlocked: [],                           // gölge can (oturum sonunda) ve açılmış kozmetikler
  txSeq, txCache: [[x, res], …32], sidSeq,
  ledger: { base: {g, items}, sum: {g, items, xp}, ring: [… 200] },
  flags: { imported: 'yok'|'sinirli'|'onayli' }
}
```

### 4.2 Kayıt entegrasyonu ve geriye uyumluluk

- **Ayrı anahtar:** Profiller `dksh.gbook.<worldId>` anahtarında durur ve `save.write('gbook', worldId, …)` ile yazılır (geçici kopya, doğrulama, `.bak`; `save.js:15-30`). Gerekçe: Host v0.4'e döner ve aynı yuvayı kaydederse v0.4'ün `game.serialize`'ı bilinmeyen alanları düşürür; ayrı anahtar bu durumdan etkilenmez.
- **Yazım sırası:** `saveNow` önce dünyayı (`dksh.online.N`), sonra defteri yazar. İkisinin arasında çökme olursa yalnız kayıp mümkündür, çoğaltma mümkün değildir. Sıra tersine çevrilseydi sandık dünyada açılmamış, eşya profilde görünebilirdi.
- **Sürüm alanı:** Üst düzey `version` değişmez; defterin kendi alanı `{v:1, w, list}`'tir. Faz 4'teki sürüm göçü `gbook` ve `gslot` anahtarlarını da kapsamalıdır.
- **Boyut ve sınır:** Profil başına ≈ 24 KB, dünya başına en çok 16 profil. 17. profil açılırken en eski `lastSeen` değerine sahip profil arşivlenir; host'a sorulur. `save.write` başarısız olursa host uyarılır.
- **Konuk tarafı:** v0.5 konuğu host verisini yalnız `dksh.wtok.<w>` (anahtar) ve `dksh.wcache.<w>` (son `inv`, `prof`, `pq`, `rev`) anahtarlarına yazar. `dksh.guest.0` ve `dksh.progress.guest` v0.5'te **salt okunur** olur; yalnız ithalat kaynağıdır (§4.4). Böylece eski konuk ilerlemesi kaybolmaz ve v0.4'e dönüşte sağlam kalır.
- **Tek oyunculu kayıt** (`dksh.solo.N`) değişmez. GuestBook yalnız `G.saveKind === 'online' && G.isHost` iken çalışır. `sid` ve `b` alanları tek oyunculu kayda yazılmaz.

### 4.3 Kimlik bağlama ve yeniden katılım

1. `hello.auth = {g, mac}` doğrulanırsa profil yüklenir (§2.2). Aynı `gid` başka bir bağlantıda açıksa eski bağlantı `kick{code:'replaced'}` alır.
2. `welcome.prof` konuğa profilin tam görüntüsünü verir. Konuk `game.start({save: {player: {inv: prof.inv, hp: prof.hp}, progress: prof.prog, quests: prof.pq}})` ile başlar; bu, `startOnlineGuest`'in (`main.js:187-197`) yeni biçimidir.
3. Atılan konuğun `gid`'i oturum boyunca kara listede kalır.

### 4.4 Yeni profil, ithalat ve sybil sınırları

- **Yeni profilin başlangıç donanımı** `game.js:133-136` ile aynıdır: 150 altın ve temel set. Başlangıç eşyaları **bağlıdır** (`b:1`): yere bırakılamaz, ambara konamaz, başkasına geçmez. Satılabilir, ama satış geliri tayfayla paylaşılmaz (§4.9).
- **Sybil sınırı:** Bir dünyada onaysız olarak saatte en çok 6 yeni profil açılır. Sınır aşılırsa host'a "Yeni tayfa: X katılmak istiyor [Kabul] [Reddet]" sorulur. Yanıt yoksa `reject{code:'newLimit'}` döner.
- **İthalat politikası (host ayarı; varsayılan "Sınırlı"):**

| Ayar | Davranış |
|---|---|
| **Sınırlı** (varsayılan) | Konuğun eski yerel kaydı (`dksh.guest.0`, `dksh.progress.guest`) varsa konuk ilk katılımında **bir kez** `importReq` gönderir ve host aşağıdaki tavanları onaysız uygular. |
| **Her seferinde sor** | Host'a `hello.legacy` özetiyle bir pencere açılır: "X eski ilerlemesini getirmek istiyor: seviye L, A altın, N eşya [Temiz başlat] [Sınırlı aktar]". |
| **Hep temiz** | İthalat yapılmaz; başlangıç donanımıyla başlanır. |

**Sınırlı ithalatın tavanları:**

| Alan | Kural |
|---|---|
| Altın | `min(yerel, 500)` |
| Eşya | Yalnız `silah`, `arac`, `sarf` ve `mermi` kategorileri. Kimlik başına tavan: silah ve araçta 1, sarfta 20, mermide 30. `ganimet`, `tas`, `koleksiyon`, `balik`, `harita` ve `gorev` alınmaz. Hepsi bağlı (`b:1`) olur. |
| Seviye ve yetenekler | Seviye `min(yerel, 10)`, XP 0. Harcanan puan `seviye − 1`'i aşmaz. Rütbe başına en çok 3. |
| Kişisel defter (keşif, koleksiyon, başarım, istatistik) | Aynen alınır; oyunsal değeri yoktur. |
| Yan görevler | Sıfırlanır. |

`importReq` profil başına bir kez işlenir. Deftere `import` kaydı düşülür ve profil `imported` olarak işaretlenir. Kalan sızıntı yolu: ithal altınla tüccardan mal alıp yere bırakmak. Al-sat kuralı (satışta liste değerinin en çok %90'ı, alışta %115'i; `shop.js:63-70`) bu yolu kayıplı kılar ve kimlik başına yaklaşık 400 altınla sınırlar (§13.7).

### 4.5 Envanter eşitleme

- Host profil değiştikçe `inv{rev,…}` gönderir; değişiklikler karede birleştirilir, saniyede en çok 5 ileti. Konuk bunu `Inventory.load()` ile uygular, ardından `unequipIfMissing()` çağırır ve önbelleğe yazar.
- Online konuk dalında yerel envantere doğrudan yazılmaz. Arayüz eylemleri niyete çevrilir. Sonuç gelene dek "İşleniyor…" gösterilir. Toplama ve vuruş gibi görsel tepkiler yerelde hemen oynatılır.
- Konuk bir `rev` atlarsa ya da bir işlemi reddedilirse `sync{what:'inv'}` gönderir; host tam durumu yollar.
- **`sid`:** Profil yığınlarına host'un verdiği kısa ve kararlı kimlik (`'s' + sidSeq`). Fiyat ya da kimlik taşıyan her niyet yığına `sid` ile başvurur. Verili tekil yığınlarda (balık, harita) bu zorunludur. Dizin kullanılmaz, çünkü araya giren bir toplama dizinleri kaydırır.

### 4.6 Konuğun envanterini, altınını ve XP'sini değiştiren bütün yollar

| Yol | Bugün (konukta) | v0.5 | Adım |
|---|---|---|---|
| Dünya sandığını açma | Host `give` → konuk yerelde ekler; taşan kısım `lootReq` (`treasure.js:93-99`, `:84-92`) | `chestReq{open}` → profile; taşan kısım host'ta kese olur | 7, 12 |
| Kese toplama | `pickupReq` → `give` | Aynı yol, profile yazılır | 7, 12 |
| Yüzen nesne | `floatReq` → `give` / `gold` | Aynı yol, profile yazılır | 7, 12 |
| Ada eski sandığı, tapınak sunağı, gizli bulmaca sandığı, batık sandığı (N-5, E-1, E-2) | Yerel `lootToBag` (`islands.js:742-751`, `hazards.js:649-657`) | `feat` → ganimet tablosunu host atar (konuğun `mods.gold` değeriyle) | 13 |
| Tutsak (+120 altın) | Yerel `inv.gold += 120` (`islands.js:963`) | `feat:free` → `gold` | 13 |
| Kabuk, istiridye | Yerel (`details.js`) | `feat:shell` → bekleme süresini host tutar | 13 |
| Balık (olta, ağ, zıpkın) | Yerel `makeCatch` (`fishing.js:232`) | `fish`; tür ve ağırlığı host belirler | 11 |
| Köpekbalığı ganimeti | Yerel → `lootReq` | `feat:shark` (sınırlı beyan) | 11 |
| Düşman ve hayvan ganimeti | Host'ta ölüm → `spawnLoot` | Değişmez; vuruş da host'ta çözülür | 14 |
| Kırık sandık | Konukta kırılır → `lootReq` | Host'ta vuruşla kırılır → kese | 4 → 14 |
| Satış (eşya, taşınan sandık, ambar) | Yerel `shop.*` + `gold` payı | `tx{sell, sellAll, sellChest, sellHold}` | 9 |
| Alış, hizmetler (aşçı, harita, şişe, kozmetik, zar, görev, tayfa) | Yerel | `tx{buy}`, `tx{svc}` | 9 |
| Gemiye gülle ve tahta yükleme | Yerel + `shipCmd addBalls/addPlanks` | `hold{put}` ya da `tx{buy, ship:true}` | 8, 9 |
| Ambara koyma ve ambardan alma | Yerel + tam durum `hold` | `hold{put/get}` | 8 |
| Yere bırakma | Yerel + `lootReq` | `item{drop}` | 8 |
| Yeme ve kullanma (hava kesesi, şişedeki mesaj) | Yerel | `item{use}` | 8 |
| Tabanca doldurma (mermi tüketimi) | Yerel (`combat.js:104-111`) | `act{reload}` | 15 |
| Yem tüketimi | Yerel | `fish{cast}` içinde | 11 |
| Kazıda haritanın kullanılması | Host `mapUsed` → konuk siler | Host haritayı profilden siler | 12 |
| Hikâye eşyası (günlük, ilk harita) | Yerel | `story{ev}` → profile | 13 |
| Yan görev ödülü (E-3) | Yerel `earn` → `gold` payı | Görevi host izler → profile ve paylaşım | 10 |
| XP (bütün kaynaklar) | Çoğu yerel | Host `awardXp` | 10 |

### 4.7 Satış talebi akışı

```
Konuk ("Sat")                     Host (econ.js + guestBook.js)                                     Diğer oyuncular
 tx{q,x:42,a:'sell',role:'treasure',
    it:[['s17',3]],p:540} ──────▶  1 kapı: boyut, şema, oran (tx 4/sn), q
                                   2 x > txSeq? ≤ ise önbellekteki sonuç ya da 'dup'
                                   3 tüccar: merchantAt(role, posOf(pid)) ve time.shopOpen(role)
                                   4 her [sid,n]: yığın profilde; n ≤ yığın.n; nosell/currency değil;
                                     ITEMS içinde ya da balik:<FISH>
                                   5 plan: Σ sellPrice(yığın, role, modsOf(profil), time.priceBonus())
                                     (birim fiyat 0 ise 'almaz')
                                   6 p verilmişse ve fiyat < p × 0,95 ise 'fiyat' (fiyat değişti; kullanıcı yeniden onaylar)
                                   7 devre kesici: konuğun son 60 sn satışı + toplam ≤ 60 000; aşılırsa 'butce' + 3 puan
                                   8 ATOMİK uygula: profilden düş → txSeq=42 → earnShared() → defter →
                                     olaylar (itemSold{by}, chestSold{by})
 ◀── txr{q,x:42,ok:true,d:+360} + inv{rev}                 ──── gold{g,d:+90,r:'share'} (+ host HUD) ────▶
```

**Doğrulamalar (5.1c–5.1e):**

| Denetim | Nasıl |
|---|---|
| Satış gerçekten gerçekleşti mi (5.1c) | Satış yalnız host'ta, bu işleyicide gerçekleşir. Online konuk dalında `shop.sell` yalnız `tx` gönderir. |
| Ürün oyuncuda mı (5.1d) | `sid` profilde var ve `n ≤ yığın.n` |
| Ürün sayısı (5.1e) | `I(1,999)` ve `≤ yığın.n`; bir `tx` en çok 20 kalem içerir |
| Ürünün değeri (5.1e) | `ITEMS[id].value`. Balıkta `FISH[key]` ve ağırlıktan host'ta hesaplanır (`fishing.js:232-241` formülü). Sandıkta `CHEST_TIERS[tier].value`; `tier` beyaz listede (N-9). |
| Tüccar (5.1e) | `role ∈ MERCHANTS`; eşyanın kategorisi `M.buys` içinde; `merchantAt` (§4.8) |
| Satış fiyatı (5.1e) | `sellPrice(stack, role, mods, bonus)` host'ta; konuğun gönderdiği `p` yalnız tutarlılık denetimi içindir |
| İşlem zamanı (5.1e) | Host saati: `time.shopOpen(role)`; `trader` yalnız `time.isActive('tradeShip')` iken; `smuggler` yalnız gece pazarında; fiyat artışı `time.priceBonus()`. Defter host'un zaman damgasını yazar. |
| İki kez işlenmez (5.1f, 5.1h) | `x` (§2.8) ve nesne durumu (sandık `gone`, ambar boş) |

**Taşınan sandık (`sellChest`):** Sandık var, durumu `carried`, `pid ∈ carriers` ve konuk Sedef Hanım'a yakın olmalı. Atomik sıra: önce `state = 'gone'` yapılır ve sandık listeden çıkar, sonra ödeme yapılır. Aynı sandık için ikinci istek `why:'durum'` alır. `chestGone` yayınlanır ve `chestSold{tier, gold, by}` olayı tetiklenir; hikâyenin 1→2 geçişi bu olayla olur.

**Ambar (`sellHold`):** Gemi `G.ship` olmalı, batmamış olmalı, `shop.shipNearPort()` doğru olmalı ve konuk Sedef Hanım'a yakın olmalı. Atomik sıra: `chests = s.hold.chests; s.hold.chests = []`, sonra ödeme. Eşzamanlı ikinci istek boş ambarla karşılaşır ve `why:'bos'` alır; çift satış biter (11 #16, 02 B16). Host'un kendi "Ambardaki sandıkları sat" seçeneği (`quests.js:417-420`) de aynı çekirdeği çağırır.

### 4.8 Fiyatın host'ta hesaplanması

- `sellPrice(stack, role, mods = G.mods, bonus = time.priceBonus())`: `shop.js:53-68`'deki formülün aynısıdır, yalnız `G.mods` (`:63`) parametreye çevrilir. Tek oyunculu çağrılar değişmez. Konuk için `modsOf(profil.prog)` geçilir.
- `buyPrice(id, role)` değişmez (`shop.js:70`).
- Balık değeri profil verisinden (`{key, w}`) her seferinde yeniden hesaplanır. Ağdan gelen değer hiçbir zaman kullanılmaz; 1e12 değerli balık (B-05) bu yüzden olanaksızdır.
- **`merchantAt(role, pos)`:**
  - **Ana liman:** `npcs.byRole(role)` (`npcs.js:62`) host'ta vardır ve günlük rutinle yürür. `within(pos, npc.pos, 3 + 1)`.
  - **Ada limanı:** NPC'ler yalnız ada kuruluysa vardır (`islands.js:528`). Ada host'ta kuruluysa NPC konumuyla kesin denetim yapılır. Kurulu değilse `ports.list` (`ports.js:30-52`, analitik) içinde rolün bulunduğu limanın noktasına ≤ 60 m kaba denetim yapılır. **[BELİRSİZ]** Kaba denetim kesin değildir; zarar sınırlıdır, çünkü fiyat ve stok host'tadır. Kesin çapa Adım 13 ile aynı yöntemle (K-8) eklenebilir.
  - **`trader`:** Ticaret gemisi host'ta vardır; tüccar noktasına 3 + 1 m.
  - **`smuggler`:** Kaçakçı kampına ≤ 60 m ve gece pazarı etkin olmalı.

### 4.9 Paylaşılan gelir (`earnShared`)

```
earnShared(total, seller, reason, {shared = true}):
  oyuncular = host ∪ {oyunda ('game' fazı) ve ayakta olan konuklar}
  N = oyuncular.length
  shared === false (bağlı eşya satışı) || G.shareGold === false || N === 1  →  seller.addGold(total)
  aksi: share = floor(total / N); seller.addGold(total − share·(N−1)); her diğerine addGold(share)
  her konuğa gold{g, d, r}; host kendi HUD'unu yeniler; defter: her alıcıya 'share' kaydı (kaynak: x, satıcının gid'i)
```

Aritmetik `shop.earn` ile aynıdır (`shop.js:120-129`) ama host'ta çalışır. Host'un kendi satışları da bu fonksiyondan geçer. `netShareGold` → `gold` yolu tamamen kalkar. Konuklara giden her altın miktarı host'un hesabıdır (5.1i, 5.1j). Yan görev ödülleri, tutsak ödülü ve kazazede ödülü bugünkü gibi paylaşılmaz.

### 4.10 İşlem kimliği, idempotans ve atomiklik

- `x` ve sonuç önbelleği için bkz. §2.8.
- **Plan → uygula:** Her `econ` işlemi tek fonksiyon içinde, arada `await` olmadan çalışır. Önce bir **plan** çıkarılır: silinecek yığınlar, eklenecek ya da düşülecek altın, değişecek nesne durumları. Plan aşamasında bir denetim başarısız olursa hiçbir şey değişmez ve `txr{ok:false, why}` döner. Uygulama adımları istisna atmayan basit atamalardır.
- **Ret nedenleri (`why`):** `dup`, `gap`, `oran`, `uzak`, `kapali`, `yok` (eşya ya da stok yok), `almaz`, `fiyat`, `yer` (kapasite), `altin`, `durum`, `bagli`, `butce`, `hostOnly`, `sunk`, `dead`.
- **Tek kaynak:** Saf çekirdek `js/economy/econ.js`'tedir. Yerel `shop.*` (host ve tek oyunculu) `econ.plan*(localCtx)` → `apply` yolunu, konuk `tx` işleyicisi `econ.plan*(guestCtx(pid))` → `apply` yolunu kullanır. `localCtx` bugünkü `G.player.inv`, `G.mods` ve `G.notify`'ı sarar; tek oyunculu davranış değişmez.

### 4.11 İşlem (`tx`) kataloğu

`OPS = sell, sellAll, sellChest, sellHold, buy, svc, learn`. Konuktan gelen her işlemde yakınlık (`merchantAt` ya da ilgili NPC için 3 + 1 m) ve varsa dükkân saati denetlenir. Konuk yaralı ya da ölüyse işlem `why:'dead'` ile reddedilir.

| `a` | Alanlar | Ek doğrulama | Etki |
|---|---|---|---|
| `sell` | `role, it:A([sid, n],20), p?` | §4.7 | Profilden düşülür; `earnShared` |
| `sellAll` | `role` | `shop.js:104-117` süzgeci (`keep` listesi) host'ta | Tek `x` ile toplu satış |
| `sellChest` | `id` | Satıcı taşıyıcı; Sedef Hanım'a yakın | `chestGone`; `earnShared`; `chestSold` |
| `sellHold` | `ship` | `G.ship`, batmamış, limanda | Ambar boşalır; `earnShared` |
| `buy` | `role, id, n:I(1,99), ship?:B` | `id ∈ MERCHANTS[role].sells`; altın ≥ `buyPrice × n`; `canAdd`; tekil eşya kuralı (`shop.js:80`). `ship:true` yalnız `gulle`/`tahta` için ve gemi limandayken (`ports.atShip(G.ship, 60)`) geçerli. | Altın düşer; profile ya da gemi stoğuna eklenir |
| `svc` `k:'repair'` | — | Gemi Ustası'na yakın; `G.ship` limanda; maliyet `repairCost()` host'ta (`shop.js:170-178`) | Host'un gemisine uygulanır; `shipFull` yayını |
| `svc` `k:'upgrade'` | `part:E('hull','sails','cannons')` | Seviye < 3; maliyet `UPG_COST` | Aynı |
| `svc` `k:'cook'` | `what:E('fish','meat'), n:I(1,20)` | Handa; `quests.js:369-401` kuralları; malzeme profilde | Envanter ve altın değişir |
| `svc` `k:'map'` / `'bottles'` | — | Haritacı'ya yakın; 150 altın / şişe profilde | Kazı alanını host seçer (`treasure.randomSite`) |
| `svc` `k:'dice'` | `npc:ID, bet:E(10,25,50,100)` | Zarcı'ya yakın; altın ≥ bet; host'ta NPC kesesi ≥ 3 × bet (günlük kese 400); saatte en çok 120 el | Zarları host atar (`dice.js:41-60` kuralları); `txr.d = {a1,a2,b1,b2,win}`; konuk animasyonu bu sonuçla oynatır (E-5) |
| `svc` `k:'cosmetic'` | `key:S(40)` | `COSMETIC_PRICES[key]` var ve profilde açık değil | Altın düşer; `profil.unlocked` |
| `svc` `k:'quest'` | `op:E('take','claim'), id:ID` | Panoya ya da NPC'ye yakın; `id ∈ SIDE`; en çok 4 görev | §4.15 |
| `svc` `k:'crew'` | — | Tuzla'ya yakın; altın ≥ 500; `G.crewHired` false | Dünya durumu; altın düşer |
| `learn` | `skill:E(SKILL_IDS)` | `points > 0`, rütbe < 3 | `prof` |
| **Yalnız host** | `buyShip`, `look`, `inn`/uyku, hızlı yolculuk, `raiseShip` | Konuktan gelirse `why:'hostOnly'` | — (K-6) |

### 4.12 Altın ve değer sınırları (5.1g)

- `Inventory.gold` erişimciyle korunur: `set gold(v) { this._gold = Number.isFinite(v) ? clamp(Math.floor(v), 0, GOLD_MAX) : this._gold; }`, `GOLD_MAX = 1 000 000 000`. Mevcut `p.inv.gold += x` kullanımları değişmeden çalışır. `toJSON` ve `load` aynı alan adıyla yazar ve okur, yani kayıt biçimi değişmez. Geçersiz atama geliştirme günlüğüne yazılır.
- `add(id, n, data)`: `n` 1–100 000 arasında tamsayı olmalı. Para yolu (`inventory.js:25`) da aynı denetimden geçer; bugün dize adet `gold += '5'` dize birleştirmesi üretiyor. ITEMS dışındaki bir kimlik yalnız `balik:<FISH anahtarı>` biçimindeyse kabul edilir. `data.weight` sonlu ve 0'dan büyük olmalı; aksi halde tablo değeri kullanılır (negatif ağırlıkla sınırsız kapasite kapanır).
- `load(o)` yığınları süzer: bilinmeyen kimlik, negatif ya da NaN adet düşer; adetler tamsayıya yuvarlanır; altın sınırlanır. Düşen yığınlar günlüğe yazılır, geçerli yığınlar korunur, yani eski kayıtlar açılır.
- Ambar sayıları `hold.items[id]` 0–999 aralığında tutulur. Ambar kapasitesi (`holdSlots`, `holdCapacity`) host'ta denetlenir.

### 4.13 Defter

- **Kayıt biçimi:** `[t, k, src, d]`. `t = Date.now()`. `k ∈ {start, grant, pick, open, sale, buy, share, spend, drop, use, xp, import, adjust, svc, feat, fish}`. `src` kaynaktır: `pk:<id>`, `ch:<id>`, `fl:<id>`, `tx:<x>`, `kill:<eid>`, `quest:<id>`, `feat:<id>`, `fish:<c>`. `d = {g: Δaltın, it: [[id, Δn]], xp: Δ}`.
- **Saklama:** Son 200 kayıt halka tamponda tutulur; toplamlar (`sum.g`, `sum.items[id]`, `sum.xp`) kalıcıdır.
- **Değişmez:** `inv.gold === base.g + sum.g` ve her `id` için `count(id) === base.items[id] + sum.items[id]`. Hata ayıklama kipinde ve `DK.netTest.invariants()` içinde denetlenir.
- **Rolü:** Güvenlik mekanizması defter değil, host'taki envanterdir. Envantere yalnız host yazar. Defter denetim izi ve kabul testlerinin ölçütüdür (§12.4).
- **Host arayüzü:** "Tayfa" paneli → konuk → "Defter": son 50 kayıt ve toplamlar.

### 4.14 XP, rütbe ve yetenekler (B-19)

- **Saf çekirdek** (`progress.js`): `applyXp(state, xp) → {state, levelUps}`, `learn(state, id)`, `modsOf(state)` (`recompute`'taki yetenek döngüsünün saf hali), `maxHpOf(state)`. Yerel `progress` nesnesi bu fonksiyonları kendisi için çağırır; tek oyunculu davranış değişmez.
- **`awardXp(pid, xp, reason)`** (host): `applyXp(profil.prog)` uygular, konuğa `xp{d, r, L, X, P}` ve gerekirse `prof` gönderir. `REASONS = kill, animal, boss, treasure, fish, discover, see, story, prisoner, temple, puzzle, chestSold, rare, dice, share, quest`. Konuk görüntü metnini kod tablosundan üretir; serbest metin yoktur (B-18, XSS).
- Online konuk dalında `progress.gain` yerelde çağrılmaz; yerel `G.on` XP dinleyicileri konukta kapalıdır. Yerel değerler `prof` ile ezilir.

| Kaynak | XP | Bugün (konuk) | v0.5 |
|---|---|---|---|
| Düşman / hayvan | `T.xp × 2` / `hp / 6` | Host `netXp` (`progress.js:67-80`) | Host `awardXp`; vuruş da host'ta çözülür |
| Tayfa payı | 1/3 | Host | Aynı |
| Boss | 600 | Host | Aynı |
| Hazine bulma | 60–300 | Host (`treasureFound.who`) | Aynı |
| Keşif | 25 | Yerel | Host, r.auth konumundan saniyede bir türetir (`quests.js:259-271` mantığı saf fonksiyona ayrılır); `pq.discovered` |
| Yeni canlı | 15 | Yerel | `feat:see:<tür>` sınırlı beyanı; sonlu küme, tür başına bir kez |
| Balık | 5–150 | Yerel | `fish{catch}` (§4.16) |
| Tutsak / bulmaca / tapınak | 80 / 150 / 250 | Yerel | `feat` |
| Sandık satışı | 20 | Yerel | `tx{sellChest, sellHold}` |
| Nadir buluntu | 80 | Yerel | `floatReq` çözümünde host verir |
| Zar | 5 | Yerel | `tx{svc, dice}` |
| Hikâye | 150 | Yalnız host'a | Değişmez (K-4) |

Sınırsız XP yolu kalmaz. Sonlu kümeler (keşif, yeni canlı) toplamda sınırlıdır. Tekrarlanabilir kaynaklar (öldürme, balık, zar) host'un zamanlayıcıları ve savaş kurallarıyla meşru oyun hızına bağlıdır.

### 4.15 Kişisel yan görevler ve başarımlar (E-3)

- Yan görevler profildedir (`pq.side`). Görev alma `tx{svc, k:'quest', op:'take'}` ile yapılır.
- İlerlemeyi host kendi olaylarından, konuğa atfederek izler: `kill` → `enemyKilled{by}`; `fishSell` → `itemSold{by}` ve rol `fisher`; `chestSell` → `chestSold{by}`; `collect` → profildeki sayı; `discover` → profildeki keşif; `fishRare` → `fish{catch}` sonucu.
- Tamamlanınca ödül host'ta `profil.addGold(ödül)` ile verilir (paylaşılmaz) ve deftere yazılır. Konuk yerel görev sayacını değiştirerek altın üretemez.
- Başarımlar ödül vermez (`quests.js:220-229`); konukta yerel gösterim olarak kalır.

### 4.16 Balıkçılık ve sınırlı beyanlar

| Adım | Konuk | Host |
|---|---|---|
| Atış | Şamandıra suya düşünce `fish{a:'cast', c, x, z, bait}` | Denetler: profilde olta ve (verildiyse) yem; `eq` rod; `within(posOf, (x,z), 30)`; `(x,z)`'de su derinliği > 0,4 m; önceki atıştan bu yana ≥ 3 sn. Türü `fishing._pickSpecies` mantığıyla host seçer (derinlik, bölge, yem, saat; sürüler konukta yerel olduğu için yok sayılır). Bekleme `waitT` aynı formülle, ağırlık `hook()` formülüyle hesaplanır. Çıktı: `bite{c, key, w, in}`. Yem ısırma anında profilden düşer. |
| Mücadele | Yerel mini oyun | — |
| Yakalama | `fish{a:'catch', c, ok}` | `c` açık atış olmalı; `ısırma + 1,5 sn ≤ şimdi ≤ ısırma + 60 sn`. `ok` ise `makeCatch(key, w, (x,z), yem)` host'ta çalışır; sonuç profile, doluysa ve konuk güvertedeyse ambara gider. XP `FISH_XP`'tan. |
| Ağ | `fish{a:'net', c, x, z}` | Profilde ağ, `eq` net, bekleme ≥ 4 sn; sayı ve türler host'ta seçilir; yırtılma olasılığı host'ta (yırtılırsa ağ profilden düşer). |
| Zıpkınla balık | `fish{a:'spear', key, x, z}` | **Sınırlı beyan:** Tür o bölge ve derinlikte mümkün olmalı, zıpkın menzilinde olmalı. Bekleme `max(def.reload, 4)` sn. Konuk başına saatlik tavan: `nadir ≤ 6`, `epik ≤ 2`, `efsanevi ≤ 1` (ayarlanabilir). Değer host tablosundan. |
| Köpekbalığı ganimeti | `feat{id:'shark'}` | **Sınırlı beyan:** Konuk başına 180 sn'de bir; kip swim/boat/deck; 30 m içinde derinlik > 8 m; profilde zıpkın ya da kılıç. Tablo host'ta: `[['kopekbaligi_eti',1,2],['kopekbaligi_disi',1,2]]`; saatte ≈ 2 300 altın değeri. |
| Yeni canlı | `feat{id:'see:<tür>'}` | Tür kümesi sonlu (`SPECIES ∪ MARINE ∪ {shark}`); profilde bir kez. |

Hileli konuk mücadeleyi her zaman kazanabilir. Ama türü, ağırlığı, değeri ve sıklığı host belirlediği için kazancı kusursuz oynayan meşru bir oyuncunun kazancını aşamaz. Balık profilde yalnız `{key, w}` olarak tutulur (§9.4).

### 4.17 Konuğun kendi yerel değerlerini değiştirmesinin etkisi

| Konuk konsolda ne yapar | Sonuç |
|---|---|
| `DK.G.player.inv.gold = 1e9` | Yalnız kendi ekranındaki sayı değişir. Bir sonraki `inv` ya da `gold` iletisi host değerini geri yazar. Satın alma host bakiyesiyle değerlendirilir ve `why:'altin'` ile reddedilir. |
| `inv.add('kraliyet_taci', 50)` | Host profilinde yok. "Yere bırak", "Sat" ve "Ambara koy" istekleri `sid` profilde olmadığı için reddedilir (3 puan). |
| `progress.level = 30`, yetenek değiştirme, `G.mods.melee = 100` | Hasar, fiyat, kazı ve dolum çarpanları host'taki profilden gelir; yalnız konuğun ekranı etkilenir. |
| `p.hp = 1e9`, `G.godMode = true` | Gölge can host'ta tutulur. 0'a inince konuk yaralı sayılır; saldırı ve etkileşim niyetleri reddedilir; düşmanlar onu hedeflemez, diğer oyuncular onu yaralı görür. |
| `p.pos.set(…)` (ışınlanma) | Host konumu bütçeyle kırpar ya da `fix` gönderir; yakınlık denetimleri host'taki konumla yapılır. |
| Saldırı hızını artırma, saati hızlandırma | Host'un kombo, bekleme ve dwell kuralları ile host benzetim saati geçerlidir; fazla istekler reddedilir. |
| Yerel kaydı (`dksh.guest.0`) düzenleme | Yalnız ilk katılımdaki tavanlı ithalatı etkiler (§4.4). |
| Yerel `quests.stage` ya da `G.ships` değiştirme | Yalnız görüntüyü etkiler; host anlık görüntüsü ve `story` iletisi düzeltir. |

**Sonuç:** Konuk yalnız kendi ekranını değiştirebilir. Dünyaya, diğer oyunculara ve kendi profiline etkisi host'un kurallarıyla sınırlıdır. Kabul ölçütündeki "konuğun kendi envanteri ve XP'si yerel" sorunu (B-19) böyle kapanır.

### 4.18 Geçiş önlemleri (Adım 4'ten kalıcı çözümlere kadar)

| Açık | Geçiş önlemi (Adım 4) | Kalıcı çözüm |
|---|---|---|
| B-08 `gold` (saatte 1,2 M) | Konuk `gold` iletisi kaldırılır. Konuğun satış payı Adım 9'a kadar tayfaya dağıtılmaz; dal içinde geçici işlev kaybı (K-7). | Adım 9 `tx` |
| B-05 `lootReq` ve `hold` | `lootReq`: yalnız ITEMS beyaz listesi; veri atılır (balık `normItemData` ile yeniden kurulur); konuk başına dakikada 1 500 altınlık değer bütçesi. `hold`: eşya anahtarları beyaz listede; konuğun yapabileceği değişiklik dakikada 1 500 altınlık bütçeyle sınırlı; `chests` yalnız host'ta var olan ve bu konuğun taşıdığı sandıklarla değişebilir. | Adım 8 (`item`, `hold{put/get}`) |
| B-07 hasar | §5.14: NaN'a kapalı mesafe, konuk bayraklarının yok sayılması, hedef başına bekleme ve silah başına tavan; `hurtBoss` mesafesi | Adım 14–15 |
| B-01/B-02/B-03 | Çökme kısımları Adım 1'de; mantık kısımları Adım 5'te | Adım 5 |

---

## 5. Savaş

### 5.1 Akış

```
konuk girdisi → yerel tahmin (animasyon, savurma sesi, namlu parlaması, kıvılcım) → act{atk|shoot|throw|reload|parry|dodge}
  → host kapısı → hostCombat: cs durum makinesi (kabul/ret) → zamanlanmış vuruş (şimdi + D.hitAt, host benzetim saati)
  → vuruş anında vekil saldırgan (posOf(pid), doğrulanmış yaw, profil silahı ve mods) ile combat._meleeHit / combat.raycast
  → hedef.hurt(…)  [blok / kaçınma / rise / phased / zayıf nokta / arkadan vuruş: hedefin kendi kodu]
  → saldırana hit{r}; diğerlerine act{from: pid}; can anlık görüntüde; XP ve ganimet "by = pid" ile host'ta
```

Saldıranın kimliği (5.2c) her zaman bağlantıdan gelen `pid`'dir; iletideki hiçbir alandan okunmaz. Bugün düşman `_aggro` fonksiyonu `info.by` değerinden `G.remotes`'a gidiyor (`enemies.js:419-424`); bu yol korunur.

### 5.2 Niyet iletileri (`act` alt türleri)

| Alt tür | Konukta nereden gönderilir | Alanlar | Host ne yapar |
|---|---|---|---|
| `atk` | `combat._attack` (bugün `netAction{a:'atk'}`, `combat.js:164`) | `mv` (`light`/`heavy`/`counter`), `w` (`sword`/`fist`), `yaw` (yerel yumuşak kilit yönü, yoksa `p.yaw`) | Durum makinesiyle kabul eder; vuruşu `hitAt` anına zamanlar (§5.3–5.4) |
| `shoot` | `combat.shoot` (`combat.js:235-269`) | `o` (kamera konumu), `dir` (birim vektör) | Dolu mu, bekleme, köken ve yön denetimi; ardından host'ta `combat.raycast` |
| `throw` | `seagear` zıpkın atışı | `o`, `dir` | Bekleme ve menzil denetimi; ışın host'ta |
| `reload` | Dolum dalı (`combat.js:104-111`) | — | Profilden mermi düşer; dolum zamanlayıcısı host'ta |
| `parry` | `player._parry` (bugün `netStunEnemy`, `player.js:192-203`) | `aid` (saldıran düşman) | Kayıtlı vuruşa karşı doğrulama (§5.10) |
| `dodge` | Kaçınma (`player.js:488-500`) | `dir?` | Dokunulmazlık 0,34 sn, dayanıklılık 16; ilerideki zamanlanmış vuruşlar iptal |

**Konuk tarafındaki değişiklik:** Online konuk dalında `enemy.hurt`, `animal.hurt`, `megafauna._hurtOrca`, `boss.hurt`, `boss._hurtTentacle` ve tehlike hedefleri ağa hiçbir şey göndermez. Denetim fonksiyonun **başına** taşınır (`if (G.online && !G.isHost) { this.hud.showT = 3; return null; }`). Böylece blok ve kaçınma zarı konukta atılmaz (F-04). Konuk vuruş anında yerel kıvılcım ve vuruş işaretçisini gösterebilir; yetkili sonuç `hit` ile gelir. `blocked` gelirse kılıç geri seker (`blockhit`); `dodged` gelirse düşmanın kaçınma animasyonu zaten anlık görüntüde görünür.

### 5.3 Host'ta konuk savaş durumu (`js/net/hostCombat.js`)

Zaman her yerde host benzetim saatidir (`game.playTime`).

```js
cs = {
  nextAtk: 0, chainClose: 0, step: 0,          // bir sonraki saldırının en erken anı, zincir penceresinin kapanışı, kombo adımı
  counterUntil: 0,                             // doğrulanmış parry sonrası karşı saldırı penceresi
  stamina: 100,                                // gölge dayanıklılık (§5.10)
  loaded: true, reloadUntil: 0, shootUntil: 0, // tabanca
  harpoonReady: 0, iframesUntil: 0,
  pending: [],                                 // zamanlanmış vuruşlar: {at, D, yaw, w, q}
  lastHitOn: new Map(),                        // hedef → son vuruş zamanı
}
```

**`atk` kabul kuralları (5.2d, 5.2g–5.2j):**

1. Konuk ayakta (gölge can; Adım 15'e kadar `st.down`). `r.auth.mode ∈ {ground, deck}`. Sandık taşımıyor (host'un `carriers` listesine göre). İstasyonda değil. Etkin bir basılı tutma eylemi varsa saldırı onu iptal eder.
2. **Silah türü:** `w === 'sword'` ise `r.auth.eq === 'sword'` olmalı ve profilde `kilic` ya da `usta_kilic` bulunmalı (`EQUIP_NEED`, `player.js:25`). `w === 'fist'` ise `eq ∈ {none, map}` olmalı.
3. **Bekleme ve hız:** `şimdi ≥ cs.nextAtk − 0,10`. Pay 15 Hz durum iletisi ve sarsıntı içindir.
4. **Kombo adımını host sayar** (`combat.js:143-154` kuralının aynısı; konuğun bildirdiği adım kullanılmaz):
   - `counter`: `w === 'sword'` ve `şimdi ≤ cs.counterUntil` → `D = SWORD_MOVES.counter`, adım 0.
   - `heavy`: `w === 'sword'` → `D = SWORD_MOVES.heavy`, adım 0.
   - `light`: `şimdi ≤ cs.chainClose` ise adım `(cs.step % 3) + 1`, değilse 1 → `D = (sword ? SWORD_MOVES : FIST_MOVES)[adım]`.
   - Konuk `counter` istediği halde pencere yoksa istek `light` olarak değerlendirilir ve 1 puan yazılır.
5. **Dayanıklılık:** `cs.stamina ≥ D.stam × 0,6` (`combat.js:155`); sonra `cs.stamina -= D.stam`.
6. **Animasyonun geçerli anı (5.2h):** Vuruş `şimdi + D.hitAt` anına zamanlanır. `hitAt` değerleri: 1 → 0,25; 2 → 0,27; 3 → 0,36; ağır → 0,6; karşı saldırı → 0,26; yumruk 0,24 / 0,26 / 0,34 (`combat.js:18-29`).
7. **Sonraki saldırı:** `cs.nextAtk = şimdi + (D.finisher || D.heavy || D.counter ? D.dur : D.chainAt)`; `cs.chainClose = şimdi + D.dur + 0,45`; `cs.step = D.finisher ? 0 : adım`.
8. Kabul edilmeyen `atk` 1 puan alır ve konuğa `hit{q, r:[]}` gider; konuk tahminini geri alabilir.

### 5.4 Yakın dövüş çözümü: `combat._meleeHit` yeniden kullanılır

`_meleeHit(p, D)` (`combat.js:188-232`) imzası `_meleeHit(p, D, opts = {})` olur. Varsayılanlar bugünkü davranışı verir:

- `by: opts.by ?? G.myId` (`:201`, `:216`).
- `base: opts.base ?? (p.equipped === 'sword' ? p.weaponDamage() : weaponBase('fist', G.mods))`. Yumruk tabanının tek kaynağı `weaponBase()`'dir (Y-3).
- `opts.remote === true` iken yalnız yerel oyuncuya ait yan etkiler atlanır: `hitMarker`, `G.hitStop`, `tpCamera.addShake`, `p.startAction('blockhit')`.
- `opts.tol = {range: 0.6, arc: 0.25}`: menzil `D.range + t.radius + 0,6`, yay `D.arc + 0,25`.
- `opts.los = true` (yalnız uzak aktör): `physics.lineBlocked(göğüs → hedef göğsü, {rScale: 0.8})` engel görürse o hedef atlanır. Tek oyunculu davranış değişmesin diye yerel oyuncuda kapalıdır.
- Fonksiyon sonuç listesini döndürür: `[[hedefId, 'hit'|'blocked'|'dodged', hasar]]`.

```js
const proxy = {
  id: pid, pos: posOf(pid),                            // vuruş anındaki doğrulanmış konum
  yaw: clampToward(intent.yaw, r.auth.yaw, 1.2),       // niyet yönü, son st yönüne en çok ±1,2 rad
  equipped: w === 'sword' ? 'sword' : 'none', mode: r.auth.mode, ship: r.auth.ship, startAction() {},
};
const res = combat._meleeHit(proxy, D, { by: pid, remote: true, base: weaponBase(w, profil, modsOf(profil.prog)),
                                         tol: { range: 0.6, arc: 0.25 }, los: true });
```

- **Gerçek menzil (5.2f):** Kural `combat.js:198-200` ile aynıdır, üstüne yalnız gecikme payı eklenir. Bugünkü "yakın 6 m, mermi 80 m" eşiği (`net.js:284`) kalkar.
- **Hedef konumu (5.2e):** Hedefler her zaman host'un kendi benzetimindedir.
- **Ağır vuruşun alan etkisi** (`D.aoe`) aynı koddan gelir.
- **Hedef başına sınır:** Bir savuruşta her hedef bir kez vurulur (`hitSet`). Aynı konuk ile aynı hedef arasında en az 0,2 sn bulunmalıdır (`lastHitOn`).
- **Sonuç:** Saldırana `hit` gider. Hasar sayıları ve ölüm anlık görüntüyle herkese ulaşır. Diğer konuklara `act{from: pid, a:'atk', anim: D.anim}` yayınlanır. Host 9 m'lik saldırı gürültüsünü kendisi üretir.

### 5.5 Tabanca, dolum ve mühimmat (5.2k)

| Durum | Kural |
|---|---|
| `shoot` | `r.auth.eq === 'pistol'`; profilde `tabanca` ya da `usta_tabanca`; `cs.loaded` (dolum bittiyse `şimdi ≥ cs.reloadUntil`); `şimdi ≥ cs.shootUntil`. Köken `o`, başa (posOf + 1,45 y) ≤ 7 m olmalı ve `!lineBlocked(baş → o)`: kamera duvarın arkasındaysa atış yapılamaz. `dir` normalleştirilir ve yatayda `r.auth.yaw`'a en çok 1,3 rad olmalıdır. |
| Çözüm | `combat.raycast(o, dir, 80, null)` host'ta (arazi ve görüş hattı dahil, `combat.js:271-298`). Hasar `weaponBase('pistol', profil, mods) × (kafa ? 1,5 : 1)`; `t.hurt(dmg, {kind:'bullet', pos: posOf(pid), by: pid})`. Ardından `cs.loaded = false`, `cs.shootUntil = şimdi + 0,45`; host 45 m gürültü üretir. |
| `reload` | `!cs.loaded`, dolum sürmüyor, profilde `mermi ≥ 1`. Profilden 1 mermi düşülür ve `cs.reloadUntil = şimdi + (usta_tabanca ? 1,3 : 2,0) × mods.reload` (`combat.js:107`) atanır; `inv` gönderilir. |
| Sapma | Konuk nişan almıyorken rastgele sapma ekleniyor (`combat.js:247`). Host verilen `dir`'i kabul eder. Sapmayı kaldıran hile doğrulanamaz; kalan risktir (§13.7). |

### 5.6 Zıpkın

`throw` kabul koşulları: `r.auth.eq === 'harpoon'`; profilde `zipkin` ya da `usta_zipkin` (en iyisi seçilir: menzil 9/13 m, hasar 30/48, dolum 1,1/0,8 sn); `şimdi ≥ cs.harpoonReady`; `o` ele ≤ 3 m. Host `def.range` uzunluğunda düz bir ışın atar; hedef yarıçapına 0,3 m pay eklenir (kısa uçuştaki yer çekimi bu payla karşılanır). Hasar `def.dmg × mods.melee`, tür `harpoon`. Ardından `cs.harpoonReady = şimdi + def.reload`. Zıpkınla balık için bkz. §4.16.

### 5.7 Top

Bkz. §7.3. Gülle stoğu yalnız host'ta değişir ve `fireCannon` → `ship.canFire` dolumu, gülleyi ve top canını denetler (`combat.js:300-318`, `ship.js:681`). `fireCannon` kendi gemisinde host'un `G.mods` değerini kullanıyor (`:304`, `:308`). Konuk topçu için bu değer `modsOf(profil)` olmalıdır: `fireCannon(ship, i, by, mods)`.

### 5.8 Hasar çarpanları (5.2l)

| Çarpan | Değer (kod) | Host'ta nereden |
|---|---|---|
| Silah tabanı | `kilic` 24, `usta_kilic` 34, `tabanca` 48, `usta_tabanca` 62, yumruk 9, `zipkin` 30, `usta_zipkin` 48 | Profildeki en iyi silah (`weaponBase`) |
| Hamle | `SWORD_MOVES`/`FIST_MOVES` `.mult`: 1,0 / 1,1 / 1,6 / ağır 2,3 / karşı 2,6; yumruk 1,0 / 1,1 / 1,5 | Host durum makinesinin seçtiği `D` |
| Yetenek | `mods.melee`, `mods.gun`, `mods.reload`, `mods.cannon` | `modsOf(profil.prog)`; konuğun yerel yetenekleri sayılmaz |
| Kafa | ×1,5 (`combat.js:256`) | Host `raycast` |
| Arkadan, sersem, yorgun | `T.backMult`, ×1,25, ×1,4 (`enemies.js:377-386`) | `applyDamage`, `info.pos = posOf(pid)` |
| Boss | `damageMul(info)` | `info.kind` ve `info.pos` host'tan |
| Ağır, bitiriş, karşı, blok kırma, geri tepme | `D.heavy`, `finisher`, `counter`, `guardBreak`, `kb` | Yalnız `D`'den; konuğun bayrağı kullanılmaz |

### 5.9 Boss zayıf noktaları (5.2m)

- **Kraken:** Dokunaçlar `combat.targets` içinde ayrı hedeflerdir (`bosses.js:200-206`). Host'ta yakın dövüş ya da ışın dokunaç hedefine değerse `_hurtTentacle` host'ta çalışır. `kind:'tentacle'` yalnız host'un iç çağrısından çıkar (`:226`). Baş derindeyken `damageMul` 0'dır, patlamada 0,2'dir (`:210-216`). Bugün `hurtBoss{kind:'tentacle'}` iletisi bu korumayı aşıyor; v0.5'te aşamaz.
- **Diğer bosslar:** Arkadan, çekirdek açık, rün sütunu, bordalanmış gibi kurallar `bosses.js`'teki `damageMul` fonksiyonlarından gelir. Bu fonksiyonların ihtiyaç duyduğu `info.pos` ve `info.kind` değerlerini artık host koyar.
- `netHurtBossApply` dinleyicisi (`bosses.js:1041-1046`) silinir. Mesafesiz boss vuruşu (B-07'de 9 km'den) yapısal olarak olanaksızdır, çünkü vuruş geometrik olarak çözülür.

### 5.10 Blok, parry, kaçınma ve gölge can (5.2n, N-10)

**(a) Konuğun saldırısını düşman bloklar ya da ondan kaçınır.** Host `enemy.hurt`'ü vekilin konumu ve düşmanın yönüyle çağırır; `_canBlock` ve kaçınma zarı host'ta atılır (`enemies.js:340-375`). Blok kırma yalnız ağır vuruşun `D`'sinden gelir. 02 F-04 böylece kapanır.

**(b) Düşmanın vuruşu konuğa.** `_hitPlayer` (`enemies.js:1000-1008`) uzak oyuncu için bugünkü `netHurtPlayer` → `hurt` iletisini korur; konuk yerel `hurt()` ile hissi yaşar. Host ayrıca:
1. Vuruşu kaydeder: `hits[pid].push({aid, t, dmg, melee, ub, from})` (son 1,5 sn).
2. Gölge cana uygular:
   - Kaçınma penceresindeyse (`cs.iframesUntil`) hasar 0.
   - Blok görüldüyse hasar ×0,12 ve `cs.stamina -= 0,9·dmg + 4`; dayanıklılık yetmezse hasar ×0,5. Blok görülmüş sayılması için: `st.up === 'Block'` değeri `[t − 0,25, t + 0,15 + rtt/2]` aralığındaki bir `st` iletisinde görülmüş, saldırı önden gelmiş (`|açı| < 1,35`), yakın dövüş ve engellenebilir olmalıdır.
   - Zorluk çarpanı `player.hurt` ile aynıdır.

**(c) Parry:** Konuk yerelde parry yapar ve `act{parry, aid}` gönderir. Host'ta kabul koşulları:
- Son 1,0 sn içinde `aid`'den gelen, yakın dövüş ve engellenebilir bir vuruş kayıtlıdır.
- Konuğun `st` akışında `up === 'Block'` o vuruştan önceki 0,45 sn içinde başlamıştır.
- Bir önceki Block bitişinden bu yana ≥ 0,25 sn geçmiştir (`blockCd`, `player.js:482-486`).
- `eq` sword'dur ve konuk saldırana dönüktür.
- Her vuruş için en çok bir parry kabul edilir.

Sonuç: düşman `stun(1,7, 'parry')` alır, `cs.counterUntil = şimdi + 1,3 + 0,15` atanır ve o vuruşun gölge can kaybı geri verilir. Kaldırılan `stunEnemy`'nin yerini alır; "8 m'deki düşmanı sürekli sersem tutma" yolu kapanır.

**(d) Gölge can:** `sh = {hp, maxHp = 100 + modsOf.hp, downT, dead, lastHurt}`.
- Konuğun bildirdiği `st.hp` gölgeden düşükse gölge ona iner: düşme, boğulma ve lav gibi yerel hasar kabul edilir; konuk ancak kendi aleyhine bildirebilir.
- Bildirilen can gölgeyi 2 sn boyunca 15'ten fazla aşarsa `hp{v}` düzeltmesi gönderilir.
- Yenilenme: son hasardan 6 sn sonra saniyede 1,5 (`player.js:347`). Yeme `item{use}` ile olur.
- Patlama ve kaya hasarı host'ta uzak avatarlara da uygulanır. Bugün patlama yalnız yerel oyuncuya vuruyor (`combat.js:44-54`).
- Gölge can 0 olunca: yaralanma, 35 sn, `hp{v:0, down:true}` ve host bildirimi gider. Düşmanlar konuğu hedeflemez: `enemies.js:518-523` artık gölge değeri okur, beyan edilen `down` değerini okumaz (N-10). Konuğun `act`, `tx`, `feat` ve etkileşim niyetleri reddedilir. Süre dolarsa ölüm olur; yeniden doğma ışınlaması yalnız bu durumda kabul edilir (§8.4) ve gölge 100'e döner.

**Kalan risk:** Konuk sürekli Block bildirerek hasarı azaltabilir, ama gölge dayanıklılık bunu sınırlar. Bu yalnız konuğun hayatta kalmasını etkiler; hasar, altın ya da XP üretmez. Parry botu meşru üst sınırla sınırlıdır: parry yalnız düşmanın gerçek vuruşunda oluşur.

### 5.11 Gecikme toleransı

- Varsayılan olarak yalnız tolerans uygulanır: menzil +0,6 m, yay +0,25 rad, zaman −0,10 sn, blok penceresi +0,15 sn + rtt/2. 100–150 ms gecikme ve 3–5 m/sn düşman hızıyla oluşan yaklaşık 0,5 m hata bu payla karşılanır.
- **İsteğe bağlı geri sarma (`LAG_REWIND`):** Düşmanlar son 1 sn'lik konumlarını 15 Hz halka tamponda tutar. Vuruş `şimdi − min(0,25; rtt/2 + 0,067)` anındaki konumlarla çözülür. Varsayılan olarak kapalıdır. **[BELİRSİZ]** Açılıp açılmayacağına Adım 14'te 06j `--latency 120` ölçümüyle karar verilir.

### 5.12 Azami meşru hasar/sn (kabul ölçütü)

Kılıç için en iyi durum: `usta_kilic` 34 × `keskin_pala` 3. kademe (×1,24) = **42,16** taban.

| Kaynak | Döngü | Hasar/sn |
|---|---|---|
| Kılıç kombosu 1-2-3 | 1,64 sn'de 42,16 × 3,7 = 156,0 | **95,1** |
| Kılıç ağır | 1,10 sn'de 97,0 | 88,2 (dayanıklılık 22/vuruş) |
| Usta tabanca | dolum 1,3 × 0,64 + atış 0,45 ≈ 1,28 sn; 80,6 (kafaya 120,9) | ≈ 94 (mermi sınırlı) |
| Usta zıpkın | 0,8 sn'de 59,5 | 74 |
| Top (tek top) | ≈ 1,66 sn'de ≈ 130 | ≈ 78 |

**Ölçüt:** Değiştirilmiş bir konuğun bir hedefe uyguladığı hasar/sn, `95,1 × hedef çarpanı × 1,10` değerini aşmamalıdır (hedef çarpanı: arkadan, sersem, yorgun ya da boss). Bugün ulaşılan 19 200 hasar/sn bu değerin yaklaşık 200 katıdır. Host'ta konuk başına bir **hasar gözlemcisi** çalışır: hedef başına 1 sn'lik toplam tutar ve eşik aşılırsa günlüğe yazıp host'a geliştirici uyarısı gösterir. Konuğa ceza yazılmaz, çünkü aşım ancak host kodundaki bir hatadan doğabilir. Kabul testi aynı eşiği kullanır.

### 5.13 Tek oyunculu savaş kodunun yeniden kullanımı

| Fonksiyon | Değişiklik | Tek oyunculu etkisi |
|---|---|---|
| `combat._meleeHit(p, D, opts={})` | `by`, `base`, `remote`, `tol`, `los`; sonuç listesi döndürür | Yok (varsayılanlar bugünkü davranış) |
| `combat.raycast` | Değişmez | Yok |
| `combat.fireCannon(ship, i, by, mods?)` | İsteğe bağlı `mods` | Yok |
| `combat._attack`, `shoot`, dolum; `seagear` atışı; `player._parry`, kaçınma | Online konuk dalında yerel görsel + `act` niyeti | Yok |
| `enemy.hurt`, `animal.hurt`, `megafauna._hurtOrca`, `boss.hurt`, `boss._hurtTentacle` | Konuk dalı başa taşınır; ağa gönderim kaldırılır | Yok |
| `bosses.init` | `netHurtBossApply` silinir | Yok |
| `enemies._players` | Uzak oyuncu için gölge `hp/down` | Yok |
| Yeni `hostCombat.js` | `cs`, zamanlanmış vuruşlar, vekil, parry, gölge can, gürültü türetme, hasar gözlemcisi; `update(dt)` yalnız host'ta bir oyun sistemi olarak | Yok |

### 5.14 Geçiş sertleştirmesi (Adım 4; Adım 14–15'e kadar)

`hurtEnemy`, `hurtAnimal`, `hurtMarine`, `hurtBoss` ve `stunEnemy` geçici olarak kalır, ama şu sınırlarla:
- Mesafe NaN'a kapalı `within` ile ölçülür.
- Konuk bayrakları (`heavy`, `fin`, `ctr`, `gb`, `kb`, `kind`) yok sayılır; `kind ∈ {melee, bullet}` dışındakiler (`tentacle` dahil) reddedilir.
- Konuk ve hedef çifti başına en az 0,35 sn beklenir.
- Silah başına tavan uygulanır: yakın 97, mermi 93, zıpkın 60.
- `hurtBoss` için boss'a ≤ 12 m (yakın) ya da ≤ 80 m (mermi) şartı aranır ve `ten` alanı yok sayılır.
- `stunEnemy` konuk başına 3 sn'de bir kabul edilir.

Bu önlemler 19 200 hasar/sn'yi yaklaşık 280 hasar/sn ile sınırlar ve uzaktan boss vuruşunu kapatır. Adım 14'te türler silinir.

---

## 6. Hazine, etkileşim, tehlike ve bulmaca yetkisi

### 6.1 Yakınlık yarıçapları (5.3a)

Host eşiği = istemdeki yarıçap + `TOL` (0,8 m). Konum her zaman `posOf(pid)`'den alınır; karşılaştırma `within`/`within3` ile yapılır. Aşağıdaki yarıçaplar kodda doğrulandı.

| Etkileşim | İstem yarıçapı (kod) | Host eşiği | Hedef konumu |
|---|---|---|---|
| Sandık taşıma ve açma | 2,6 (`treasure.js:684-685`) | 3,4 | `c.pos` (host) |
| Kese | 2,4; kayıktan 3,5 (`treasure.js:674`, `:700`) | 3,2 / 4,3 | `pk.pos` |
| Yüzen nesne | 2,6; güverteden 3,0; kayıktan 3,5 (`events.js:36`) | +0,8 | `f.pos` |
| Kazı | Konuğun 0,9 m önü; alan ≤ 2,8 (`treasure.js:196`, `:219`) | Nokta host'ta hesaplanır | posOf + yaw |
| Fıçı ateşleme | 1,9 (`hazards.js:646`) | 2,7 | `h.x, h.z` |
| Kaya takozu | `r + 2` (`hazards.js:648`) | `r + 2,8` | `h.pos` |
| Bulmaca bloğu itme | Blok yarı genişliği 0,75 + oyuncu 0,36 | Blok merkezine ≤ 1,9 | `h.bpos` |
| Gizli sandık (bulmaca) | 2,6 (`hazards.js:649`) | 3,4 | `h.C` |
| Ada eski sandığı | 2,4 (`islands.js:746`) | Kesin çapayla 3,2; kesin çapa yoksa ≤ 60 m (§6.8) | Çapa |
| Tapınak kolu / sunak | 2,6 / 3 (`islands.js:840`, `:857`) | 3,4 / 3,8 (sabit ofsetler) | Tapınak merkezine göre ofset |
| Tutsak hücresi | 2,4 (`islands.js:958`) | Kesin çapayla 3,2; kesin çapa yoksa ≤ 60 m | Çapa |
| Batık sandığı | 3,5, yüzerken (`seagear.js:122`) | 4,3, kip `swim` | `props.wreckChest` |
| Kabuk / istiridye | 1,8 (`details.js`) | 2,6 | Yer listesi |
| Tüccar / NPC | 3 (`npcs.js:51`) | 4,0 (ana liman); ada limanı §4.8 | `npcs` / `ports` |
| Günlük | 2,6 (`quests.js:300`) | 3,4 | `cave.journalSpot` |
| Diriltme | 2,5 (`net.js:725`) | 3,3 | İki oyuncunun posOf değeri |
| Gemi istasyonları | §7.1 | +0,8 (gemi yerel koordinatında) | `s.model.stations` |
| Kayığa binme | 3,0 (`shipControl.js:157`) | 3,8 | `G.rowboat` |

### 6.2 Sandık durum makinesi (5.3b, 5.3d)

Durumlar: `ground`, `water`, `carried(carriers[])`, `boat`, `hold` (ambar kaydında), `gone`. Yükselen sandık (`rising > 0`) alınamaz. Bütün geçişler host'ta yapılır ve her geçiş mevcut durumu yeniden denetler. Konuktan `carriers`, `pos` ya da `state` alınmaz.

| Geçiş | Niyet | Koşul (host) | Sonuç |
|---|---|---|---|
| `ground`/`water`/`boat` → `carried[pid]` | `chestReq{pick}` | Yakınlık 3,4; yükselmiyor; konuk başka bir şey taşımıyor; kip ground/swim/deck; kayıktaki sandık için konuk kayığa ≤ 3,8 m | `_grant(c, pid)` → `carryOk` → `chestState` |
| `carried[a]` → `carried[a, pid]` | `chestReq{pick}` | İki kişilik sandık (`T.twoPlayer`); tek taşıyıcı var ve o kişi `pid` değil; yakınlık | Aynı (`treasure.js:353`) |
| `ground`/`water` → `gone` | `chestReq{open}` | Yakınlık; taşınmıyor; yükselmiyor; dwell ≥ 0,85 × 1,4 sn (§2.10) | İçerik **host'taki `c.contents`'ten** profile; sığmayan kısım host'ta kese; `chestGone` |
| `carried` → `ground` | `chestReq{drop}` | `pid ∈ carriers` | Konum posOf + 0,55 m ileri; taşıyıcı kalmazsa `ground`; konuk güvertedeyse otomatik ambar (`treasure.js:388-391`) |
| `carried` → `hold` | `chestReq{stow, ship}` | `pid ∈ carriers`; konuk o geminin güvertesinde ve ambara ≤ 2,4 m; kapasite (`holdSlots`, `holdCapacity`) | `hold.chests.push({id, tier, contents, weight, siteId})`; değerlerin hepsi host'un sandık nesnesinden; `hold`, `chestGone` |
| `carried` → `boat` | `chestReq{boat}` | `pid ∈ carriers`; kayık suda; kayığa ≤ 3,8 m; yük < 2 | `chestState` |
| `hold` → `carried[pid]` | `holdTake{ship, idx, cid}` | Güverte; ambara ≤ 2,4 m; taşımıyor; `hold.chests[idx].id === cid` (iki oyuncu aynı dizini isterse ilk gelen alır) | `takeFromHoldFor`; `carryOk`, `hold`, `chestState` |
| `carried` → `gone` (satış) | `tx{sellChest}` | §4.7 | Ödeme |
| `hold` → `gone` (satış) | `tx{sellHold}` | §4.7 | Ödeme |
| Taşıyıcının bağlantısı koptu | `_dropPeer` | Savunmacı döngü (§2.7) | Taşıyıcılardan çıkar; kimse kalmazsa `ground` |

Başkasının taşıdığı sandığa yalnız iki kişilik sandıkta "birlikte taşı" ile katılınabilir. Hiçbir niyet taşıyıcı olmayan birinin sandığı bırakmasına, ambara ya da kayığa koymasına, satmasına veya konumunu değiştirmesine izin vermez.

### 6.3 Ambar ve envanter niyetleri

| Niyet | Koşul | Etki |
|---|---|---|
| `hold{a:'put', ship, sid, n}` | Konuk `G.ship`'in güvertesinde (`r.auth.mode ∈ {deck, helm, cannon}` ve `ship === s.id`). Eşya için ambara ≤ 2,4 m; gülle ve tahta için güvertede olmak yeter. `sid` profilde olmalı, bağlı (`b`) ya da `nosell` olmamalı; `n ≤ yığın`; ağırlık kapasitesi denetlenir. | Profilden düşer. `gulle` → `s.cannonballs`, `tahta` → `s.planks` (en çok 999); balık → `s.hold.fish` (`{key, w}`); diğerleri → `s.hold.items` |
| `hold{a:'get', ship, id\|fi, n}` | Aynı konum; `id ∈ hold.items` ve `n ≤ sayı` ya da geçerli balık dizini `fi`; profilde yer var | Profile eklenir; balık alımı da yayınlanır (N-8) |
| `item{a:'drop', sid, n}` | Yığın profilde; bağlı ya da `nosell` değil; `n ≤ yığın`; konuk ayakta | Host kese açar: konum posOf; içerik **profil yığınının kopyası**; `keep:true`, 30 dk. Güvertede bırakılan kese gemiye bağlanır (`treasure.js:566`). |
| `item{a:'use', sid}` | Yığın profilde. Yiyecek: gölge can dolu olmamalı. Hava kesesi: konuk suda olmalı. Şişedeki mesaj: harita üretilir. | Profilden düşer; gölge can artar ya da harita verilir; `inv`, `hp` |

Çıktı: süzülmüş `hold` yayını (`items` kimlik başına 0–999 ve en çok 60 anahtar; `chests` en çok `holdSlots`; `tier` beyaz listede; `fish` en çok 50, `{key, w}`) ve `inv`.

### 6.4 Kese ve ganimet (5.3c)

- Keseyi yalnız host doğurur. Kaynaklar: host'taki ölüm (düşman, hayvan, boss, deniz canlısı), host'ta kırılan sandık, `item{drop}`, çanta taşması (host hesabı), `feat` ödülünün sığmayan kısmı. Bütün tablolar host kodundadır (`T.loot`, `def.reward`, `LOOT`). Konuktan tablo, eşya kimliği ya da veri nesnesi alınmaz (B-05, B-06).
- Toplanan kese `pk.remove` bayrağıyla ikinci kez alınamaz (`treasure.js:631-641`); host kesenin kimliğini yeniden kullanmaz ve keseyi yeniden oluşturmaz.
- Kısmen alınan kesenin kalanı aynı kesede kalır (06d C04 korunur). Sığma hesabını host profil kapasitesiyle yapar.

### 6.5 Kazı ve haritalar

- `maps` kaldırılır. `treasure.activeSites(pid)` host'un kendi haritalarını, `pid`'in profilindeki haritaları ve `G.storySites` listesini birleştirir. Bugünkü `G.remoteMapSites` (`treasure.js:146-154`) bütün konukların haritalarını herkese açtığı için kaldırılır.
- `dig{}` kabul koşulları: profilde kürek; `r.auth.eq === 'shovel'`; kip `ground`; taşımıyor; gelgit ve ıslaklık kuralı (`treasure.js:181-190`) host'ta; dwell ≥ 0,85 × 2,6/`mods.dig` ve konuk aynı noktada (r.auth geçmişinde ≤ 0,6 m oynama). Nokta host'ta hesaplanır: `posOf + 0,9 m × (sin yaw, cos yaw)`. Ardından `_hole` ve `resolveDig(x, z, pid)` çalışır. Başarıda harita profilden düşer ve `inv` gider. Ayrıca `xp` gider.
- "123 kazı alanının tümünü sahiplenme" saldırısı (B-10) böylece kapanır: alan, ancak profilde o alanın haritası varsa etkin olur.

### 6.6 Yüzen nesneler

`collectFloatingById(id, pid)` NaN'a kapalı yazılır: `if (!f || f.gone || !within(f.pos, posOf(pid), reach(mode) + TOL)) return 'uzak'`. Bugün `> 6` karşılaştırması NaN'da açık kalıyor (`events.js:232-235`). Güverte ve kayıkta sandık türü alınamaz. Ödül profile yazılır. Kazazede altını (+50) `gold` ile gider; gök taşı XP'si `awardXp` ile verilir.

### 6.7 Tehlikeler: fıçı, kaya, kırılabilir sandık, bulmaca bloğu (5.3e)

**Ön koşul: host'ta mantık kümeleri.** Host bugün tehlikeleri yalnız kendi kurduğu adalar için oluşturuyor (`hazards.js:71-72`, `islands.js:271-300`). Uzaktaki bir konuğun yanındaki fıçıyı `hazards.byId` bulamaz. `hazards._buildIsland(id)` yalnız `EXTRA_ISLANDS` verisine, `rng(hashStr(id))`'ye ve `terrain.heightAt`'e (analitik yedekli) dayandığı için adadan bağımsız kurulabilir (`hazards.js:111-140`). Çözüm:

```js
// hazards.js — yalnız host'ta, saniyede bir
syncRemoteSets(points) {                  // points = bağlı konukların posOf değerleri
  for (const I of EXTRA_ISLANDS) {
    const near = points.some((p) => Math.hypot(I.x - p.x, I.z - p.z) - I.r < BUILD_D);
    if (near && !this.sets.has(I.id)) { this._buildIsland(I.id); this.sets.get(I.id).group.visible = islands.built.has(I.id); }
    // bırakma: bütün oyuncular DROP_D dışındaysa ve ada host'ta kurulu değilse _dropSet
  }
}
```

`islandBuilt` geldiğinde mantık kümesi zaten varsa yalnız `group.visible = true` yapılır. `islandDropped` geldiğinde yakında konuk varsa küme gizlenir, silinmez. Maliyeti ada başına birkaç nesnedir. Fıçı ve sandık çarpıştırıcıları uzaktaki adalarda görüş hattını da kısmen iyileştirir.

| Tehlike | Konuk niyeti | Host kuralı | Sonuç |
|---|---|---|---|
| Fıçı | `hazard{ignite}` | Fıçı `idle`; yakınlık 2,7; kip `ground` | `ignite(h, 3,2, true)` → `hazard{ignite, f:3.2}` yayını; patlama hasarı host'ta ve gölge canlara da uygulanır |
| Fıçıya vuruş | `act` | Host'un savaş çözümü fıçıyı vurur | `ignite(h, 1,6)` |
| Kırılabilir sandık | `act` | Host'un savaş çözümü (`h.hp -= dmg`) | `breakCrate(loot=true)` host'ta → kese |
| Kaya | `hazard{release}` | `state === 'set'`; yakınlık `r + 2,8`; dwell ≥ 0,85 × 0,8 sn | `release(h, true)`; yuvarlanma host'ta benzetilir; ezme hasarı düşmanlara ve gölge canlara; diğer eşlere `roll` gider |
| Bulmaca bloğu | `hazard{push, x, z}` (0,2 sn'de bir) | Konuk bloğa ≤ 1,9 m; yeni konum blok eksenlerinden birinde; adım ≤ 1,1 × Δt + 0,2 m; engel yok (`physics.resolve`); zemin farkı ≤ 0,6 | Blok host'ta ilerler; `hazard{block, x, z}` yayını. Plakaya 0,55 m'den yakınsa `solve` host'ta çalışır. |
| Gizli sandık | `feat{id:'pzc:<id>'}` | Çözülmüş ve batırılmış (`sink ≥ 1`); `!looted.has`; yakınlık 3,4 | `looted.add`; tablo host'ta; `puzzleLooted` XP'si konuğa |

`hazards.netApply` (`hazards.js:672-680`) ikiye ayrılır: `applyFromHost(m)` konukta yalnız host yayınını uygular; `requestFrom(pid, m)` host'ta konuk niyetini işler. `break`, `roll` ve `solve` artık yalnız host benzetiminden çıkar; `f` (fitil) alanı konuktan alınmaz (B-11).

### 6.8 Ada nitelikleri ve dünya sandıkları (N-5, N-6, E-1, E-2)

| Kimlik | Nitelik | Host kuralı | Kalıcı durum |
|---|---|---|---|
| `chest:<fid>` | Ada eski sandığı (`islands.js:742-751`) | `fid` `EXTRA_ISLANDS` niteliklerinde var; çapaya yakınlık (aşağıda); `!islands.opened.has(fid)` | `islands.opened` (host kaydı) |
| `altar:<fid>` | Tapınak sunağı | `templeState[fid].done`; sunağa ≤ 3,8 m (sabit ofset); `!opened.has('altar' + fid)` | Aynı |
| `lever:<fid>:<i>` | Tapınak kolu | Kola ≤ 3,4 m (sabit ofsetler `[[-26,42],[26,42],[0,52]]`). Sıra `templeOrder(fid)` ile denetlenir; yanlış kol diziyi sıfırlar; üçüncü doğru kolda `done` ve `templeOpened` XP'si. | `templeState` |
| `free:<fid>:<k>` | Tutsak hücresi | Çapaya yakınlık; dwell ≥ 0,85 × 2,5 sn; host'taki `enemies.list` içinde `group === fid` olan canlı gardiyan yok (gardiyanlar konuğun çevresinde host'ta doğar, `enemies.js:1543`); `!freed.has` | `islands.freed`; +120 altın konuğun profiline; 80 XP |
| `wreck` | Batık sandığı (`seagear.js:131-138`) | Kip `swim`; ≤ 4,3 m; host oturumunda bir kez | `seagear.wreckOpened` |
| `shell:<i>` | Kabuk / istiridye (`details.js:376-389`) | Kip `ground`; ≤ 2,6 m; o yer için `takenUntil < şimdi`; inci olasılığı %25, host'ta atılır | Host'ta 240 sn bekleme |
| `pzc:<id>` | Gizli bulmaca sandığı | §6.7 | `hazards.looted` |
| `shark`, `see:<tür>` | Sınırlı beyanlar | §4.16 | Profil |

- **N-6, tapınak kol sırası:** `islands.js:827`'deki `[0,1,2].sort(() => R() - 0.5)` ifadesi adanın ortak RNG akışına bağlıdır. Bu ifade `templeOrder(fid)` ile değiştirilir: `rng(hashStr(fid + ':sira'))` tohumuyla sabit bir karıştırma. Host adayı kurmadan sırayı bilir ve iki eşte aynı sıra çıkar; bilinen #35 de kapanır. Çözülmüş tapınaklar `done` olarak kalır; yarım diziler zaten kayda geçmiyor (`islands.js:834`).
- **Kesin çapa (K-8, Adım 13):** Sandık ve tutsak hücresinin konumu `_buildGen`'in ortak RNG akışından çıkıyor (`R = rng(I.seed*31+7)`; önce bitki örtüsü tüketiyor). Host bu yüzden adayı kurmadan konumu bilemez. Çözüm: bu iki niteliğin etkileşim noktası `rng(hashStr(fid + ':cap'))` ile ayrı bir tohumdan yerleştirilir ve saf `featAnchors(fid)` fonksiyonu host ile konukta aynı sonucu verir. **Yan etki:** mevcut dünyalarda bu sandıkların ve hücrelerin yeri değişir; `opened`/`freed` anahtarları kimliğe bağlı olduğu için kayıt bozulmaz. Bu, kullanıcı onayı isteyen bir karardır (K-8). Onay verilmezse kaba ≤ 60 m denetim kalır, ama ada host'ta kuruluysa `B.inter` noktasıyla kesin denetim yapılır. **[BELİRSİZ]**
- **Durum eşitleme:** Host her değişiklikte `featSt{id, st}` yayınlar. `worldPart` içine `feats: {opened, freed, temples, hazards:{gone, solved, looted}, wreck, shells}` eklenir. Konuğun adası açılmış sandığı, kurtarılmış tutsağı ve açık kapıyı host ile aynı gösterir. Bugün bu durumlar konukta her oturumda sıfırdan başlıyor (E-1).
- Online konuk dalında `B.inter` eylemleri yerel ödül vermez; yalnız `feat` gönderir.

### 6.9 Hikâye (B-12, E-9)

| `ev` | Host koşulu | Etki |
|---|---|---|
| `tuzla` | `quests.stage === 0`; Tuzla'ya (`npcs.byRole('quest')`) ≤ 4 m | `quests.advance(1)` |
| `ilkHarita` | `stage === 1`; `!flags.ilkHarita`; Haritacı'ya ≤ 4 m | `flags.ilkHarita = true`; `marti_1` haritası isteyen konuğun profiline; `G.storySites = ['marti_1']` |
| `gunluk` | `stage ≥ 2`; `!flags.gunluk`; `cave.journalSpot`'a ≤ 3,4 m; kip `ground` | `flags.gunluk = true`; `eski_gunluk` profile; `stage === 2` ise `advance(3)` |

- Diğer geçişler host olaylarından gelir: 1→2 `chestSold` (konuğun satışı dahil, §4.7); 3→4 `iskelet_kaptan` öldürülmesi; 4→5 `kizil_hancer` öldürülmesi. Savaş host'ta çözüldüğü için bu olaylar meşrudur.
- `advance(to)` başına `to < STORY.length` denetimi eklenir. Bugün `STORY[6]` tanımsızken aşama yine de yazılıyor ve ardından TypeError oluşuyor (`quests.js:127-135`).
- Bayrak beyaz listesi: `ilkHarita, ilkHazineBulundu, ilkSatis, gunluk, parca1, kizilYenildi, morvanSpawn, kizilSpawn`. Bayraklar konuktan hiçbir zaman alınmaz; h2c `story` de bu listeyle süzülür (E-8).
- Hikâye tetikleyicileri (Morvan ve Kızıl Hançer'in doğuşu, `quests.js:276-289`) yalnız host'ta, host ve bütün konukların posOf değerleri için çalışır. Bugün konukta da çalışıyor ve konukta yerel bir boss doğabiliyor (E-9).

### 6.10 Diriltme (B-14)

- `revive{target}` kabul koşulları: kaldıran ayakta (gölge can; Adım 15'e kadar `st.down`), kip `ground`; hedef **host'un bilgisine göre** yaralı (host oyuncusu için `G.player.downed`, konuk için gölge); iki oyuncunun posOf değerleri arası ≤ 3,3 m ve dwell ≥ 0,85 × 2,5 sn; hedef bu süre boyunca yaralı kalmış.
- Sonuç: Hedef host ise `G.player.revive()`. Hedef konuksa gölge can 45 olur, hedefe `revive` ve `hp` gider, herkese bildirim gösterilir.
- Konuk tarafında h2c `revive` yalnız yerel oyuncu yaralıyken uygulanır.

### 6.11 İşaret, sohbet, gürültü ve yaralanma bildirimi

`marker` ve `chat` sınıf `social`'dadır (saniyede 1, patlama 4). Konuk başına en çok 10 işaret tutulur (fazlası en eskiyi siler). `by`, `from` ve `color` alanlarını host koyar. Host HUD bildirimleri tür ve oyuncu başına 5 sn'de en çok bir kez gösterilir (B-21). `noise` ve `downed` host'ta türetilir (§8.8).

---

## 7. Gemi ve kayık komutları

### 7.1 İstasyonlar ve yarıçaplar

Bütün denetimler **gemi yerel koordinatında** yapılır: konuğun r.auth `lx, lz` değerleri ile `s.model.stations` arasındaki 2B mesafe ölçülür. Gemi hareket ettiği için dünya koordinatındaki gecikme hatası bu yöntemde oluşmaz. Ek koşullar: `r.auth.mode ∈ {deck, helm, cannon}`, `r.auth.ship === s.id`, güverteye geçiş doğrulanmış (§8.4) ve gemi batmamış.

| İstasyon | Yarıçap (`shipControl.js:_provide`) | Host eşiği |
|---|---|---|
| Dümen | 1,3 | 2,1 |
| Çapa | 1,8 | 2,6 |
| Yelken | 1,6 | 2,4 |
| Ambar | 1,6 | 2,4 |
| Kova | 1,5 | 2,3 |
| Top `i` (`cn.local` + 1,1 m geri) | 1,2 | 2,0 |
| Yangın | 1,9 | 2,7 |
| Top onarımı | 1,7 | 2,5 |
| Direk onarımı | 2,2 | 3,0 |
| Delik | 1,6 | 2,4 |
| Kayık askısı (davit) | 1,3 | 2,1 |

### 7.2 Kilitler (B-13; 5.4a, 5.4b, 5.4g)

- **Kimlik beyaz listesi:** `^<G.ship.id>:(helm|cannon[0-9]{1,2}|anchor|sails)$` ve top dizini `< s.model.cannons.length`. Düşman ve tüccar gemilerinin kilitleri alınamaz. İstisna: konuk bordalanmış bir gemideyse, bugünkü davranış gibi, yalnız o geminin dümeni ve topları alınabilir (`shipControl.js:90-103` kuralı).
- **`lock{on:true}`:** Kilit boş; konuk o gemide ve istasyona eşik içinde yakın; gemi batmamış; konuğun başka istasyon kilidi yok (konuk başına bir kilit). Kabul edilirse host kilidi yazar, konuğun r.auth kipini `helm` ya da `cannon` olarak kabul etmeye başlar ve `lock{id, on, who}` yayınlar.
- **`lock{on:false}`:** Yalnız kilit sahibi kaldırabilir (bugünkü kural).
- **Otomatik bırakma:** Host kilidi şu durumlarda kaldırır ve yayınlar: konuğun `st.mode` değeri artık `helm`/`cannon` değilse, istasyondan 3 m'den fazla uzaklaşırsa, yaralanırsa, bağlantısı koparsa ya da gemi batarsa.
- **Host önceliği:** Host kendi gemisinde bir konuğun tuttuğu istasyonu alabilir. Host'un istemi "(kullanımda — devral)" olarak görünür. Devralmada konuğa `station{a:'release', id}` gider ve konuk `shipControl.leaveStation` çağırır.
- **Komut sırası (5.4g):** kilit al → kullan (`helm`, `fire`) → bırak. Kilitsiz ya da bırakıldıktan sonra gelen `helm`/`fire` reddedilir ve 3 puan alır. `q` sırası iletilerin geliş sırasını garanti eder.
- Konuk tarafında `takeHelm`/`takeCannon` (`shipControl.js:168-188`) iyimser çalışır. Host reddederse `station{release}` ile geri alınır.

### 7.3 `helm` ve `fire` (5.4a–f)

- **`helm`:** `ship === G.ship.id` (ya da bordalanmış gemi); `!s.sunk`; `helm` kilidi `pid`'de; `r.auth.mode === 'helm'`; dümene ≤ 2,1 m. Değerler şemadan aralıkta gelir. Etki bugünkü kodla aynıdır: `setRudder`, `sailTarget`, `backing`. Konuk hız ya da konum beyan etmez; hız sınırı geminin fiziğidir (`ship.js`). Sınıf `drive`.
- **`fire`:** `i < s.cannonState.length`; `!s.sunk`; `cannon<i>` kilidi `pid`'de; `r.auth.mode === 'cannon'`; topa ≤ 2,0 m. `s.canFire(i)` dolumu, gülle stoğunu ve top canını denetler (5.4d, 5.4e). Nişan `aimCannon` ile kırpılır (yaw ±0,6, pitch −0,12…0,35, `shipControl.update` kırpmaları). Sonra `combat.fireCannon(s, i, pid, modsOf(profil))` çalışır.

### 7.4 `shipCmd` alt komutları (B-02; 5.4c, 5.4e, 5.4f, 5.4g)

Ortak koşullar: `ship === G.ship.id`; `!s.sunk`; konuk ayakta ve o geminin güvertesinde; istasyon yakınlığı (§7.1); komut başına bekleme; konuk başına toplam sınır saniyede 6 (sınıf `ship`).

| `cmd` | Alanlar | İstasyon / eşik | Koşul | Etki |
|---|---|---|---|---|
| `anchor` | — | Çapa 2,6 | Önceki çapa komutundan ≥ 0,5 sn; `anchor` kilidi boş ya da bu konukta | `toggleAnchor()` |
| `sails` | `v:F(0,1)` | Yelken 2,4 | ≥ 0,3 sn | `sailTarget = v` (bugün `'abc'` ve `1e9` kabul ediliyor, `net.js:624`) |
| `bail` | — | Kova 2,3 | `water > 0`; dwell 0,6 sn | `water -= 12` |
| `repair` | `hole:ID` | Deliğe 2,4 | Delik var; gemide tahta ≥ 1, yoksa profilde `tahta` ≥ 1 (önce gemi stoğu); dwell 2,2/`mods.repair` | Tahta düşer; `repairHole`. Tahta yoksa ret ("tahtasız onarım" kapanır, `net.js:626`) |
| `extinguish` | `fire:ID` | Yangına 2,7 | Yangın var; dwell 1,4 sn | `extinguish(id)` |
| `cannonFix` | `i:I(0,15)` | Topa 2,5 | `i < cannonHp.length`; `cannonHp[i] ≤ 0`; 1 tahta; dwell 2,2/`mods.repair` | `cannonHp[i] = 70` |
| `mastFix` | `i:I(0,3)` | Direğe 3,0 | `i < mastHp.length`; `mastHp[i] ≤ 0`; 4 tahta; dwell 5/`mods.repair` | `mastHp[i] = 35`; düzeltilmiş `rebuild` (§7.7) |
| `addBalls`, `addPlanks` | **kaldırılır** | — | — | Yerine `hold{put}` ya da `tx{buy, ship:true}` |

Dev dizinle sayfayı kilitleme (`cannonFix i = 4294967294`, `net.js:630`) şema (`I(0,15)`) ve dizi uzunluğu denetimiyle yapısal olarak olanaksızdır. Onarım komutları yalnız onarılacak bir şey varken (delik, `hp ≤ 0`, yangın) kabul edilir. `rebuild` düzeltmesiyle birlikte `mastFix → fire → mastFix` sırasıyla dolumu sıfırlama hilesi kapanır.

### 7.5 Gemi hizmetleri ve `shipFull`'un kaldırılması (B-01)

- Konuktan gelen `shipFull` kayıt defterinde yoktur; gelirse bilinmeyen tür olarak 5 puan alır ve düşer.
- Gemi Ustası hizmetleri (onarım, geliştirme) `tx{a:'svc'}` ile yapılır (§4.11). Ödeme konuğun profilinden alınır, hizmet host'un gemisine uygulanır.
- **Yalnız host** yapabilir: gemi satın alma (`buyShip`), görünüm (`look`), batan gemiyi kurtarma (`raiseShip`) (K-6).
- `_shipFull` (`net.js:610-619`) yalnız h2c yönünde kullanılır. Konukta önce şemadan geçer, sonra **doğrulamadan sonra atomik** olarak atanır: yeni değerlerin hepsi hesaplanır, sonra birlikte yazılır. Bugün atamalar doğrulamadan önce yapılıyor ve `s.upg` undefined kalabiliyor. `netReplaceShip` (`main.js:348-351`) yalnız `typeId ∈ SHIP_TYPES` ise çalışır; eski gemi atılmadan önce yenisinin kurulabildiği denetlenir.

### 7.6 Kayık durum makinesi (B-03; 5.4h, 5.4i)

```
docked ──launch──▶ water(sürücü yok) ──enter(pid)──▶ water(sürücü = pid) ──exit──▶ water(sürücü yok) ──dock──▶ docked
```

| Komut | Koşul (host) | Etki |
|---|---|---|
| `boat{launch}` | `state === 'docked'`; konuk `G.ship` güvertesinde ve askıya ≤ 2,1 m | `rb.launch()` |
| `boat{enter}` | `state === 'water'`; `driver === null`; konuk kayığa ≤ 3,8 m; kip `ground` ya da `swim` | `driver = pid`. `who` alanı olmadığı için konuk başkasını sürücü yapamaz. |
| `boat{exit}` | `driver === pid` | `driver = null`; konuğun yeni konumu §8.4'teki kayıktan inme kuralıyla denetlenir |
| `boat{dock}` | `driver === null`; konuk güvertede ve askıya ≤ 2,1 m; kayık gemiye ≤ 22 m | Yük ambara gider (`boatToHold` host'ta), sonra `rb.dock()`. Sürücü varken `dock` reddedilir; kayıktaki oyuncuyu askıya çekme hilesi kapanır. |
| `boatSt{x,z,yaw,sp,rp}` | `driver === pid`; şema: `x,z: F(±10 000)`, `yaw: F(-50,50)`, `sp: F(-8,8)`, `rp: F(0,1e6)`; yer değiştirme ≤ `6,5 × dt + 1,5` (host benzetim saati); dünya sınırı `WORLD_HALF − 250`; karada değil (`terrain.heightAt − tide < −0,25`); geminin içine girmiyor | Kabul edilen değerler yazılır: `x, z`, `yaw` (sarılır), `speed`, `rowPhase = rp % 6283`. Ret durumunda eski değerler kalır ve sürücüye `fix` gider. |

Kayık fiziği sürücü konukta kalır; his korunur. Konum ve hız host'ta fizik sınırlarıyla doğrulanır (5.4i). Anlık görüntüdeki `rb` dizisi `fin()` ile korunur. B-03'teki `rowPhase.toFixed` TypeError'ı ve onun yol açtığı kalıcı yayın kesintisi böylece kapanır (`net.js:740`).

### 7.7 `Ship.sanitize()` ve `rebuild` düzeltmeleri

- **`Ship.sanitize()` (yeni):**
  - `upg` → `{hull, sails, cannons}`, her biri `I(0,3)`.
  - `hp` → `[0, maxHp]`; `water` → `[0, 100]`.
  - `cannonHp` ve `mastHp` dizileri model uzunluğunda ve `[0, 100]` aralığında tutulur.
  - `cannonballs` ve `planks` → `I(0,999)`.
  - `hold` biçimi (§6.3) uygulanır; `name` → `S(24)`.
  
  Ağdan gelen her uygulamanın sonunda (`applyNet`, `_shipFull`, `applyWorld`) ve hata yalıtımında (§10.1) çağrılır.
- **`applyNet(s)` (`ship.js:710-737`):** Sayısal alanlar `Number.isFinite` ile denetlenir; geçersiz alan atlanır. `anchorState` beyaz listeden geçer. `s[16]`, `s[17]` ve `s[22]` dizileri model uzunluğuna kırpılır.
- **`rebuild(look)` (`ship.js:66-73`):** Eski model `disposeTree` ile bırakılır; bugün yalnız sahneden kaldırılıyor ve bellek sızıyor (`:56-63`). `cannonState` dolum değerleri korunur: yeni dizi eski `reload` değerlerini dizin dizin alır.

### 7.8 Batık gemi (5.4f)

Batık gemide (`s.sunk`) bütün istasyon, bakım, ambar ve kayık istekleri `why:'sunk'` ile reddedilir. Gemi ve kayığın konumu ve hızı yalnız host fiziğinden ya da doğrulanmış `boatSt`'ten gelir.

---

## 8. Konum/durum (`st`) iletisi

### 8.1 Şema

```js
st: { cls:'state', max:768, phase:['load','game'], f:{ s: O({
  ts:  F(0, 1e7),                                      // konuğun benzetim saati: yalnız sıralama ve tanı için; kurallarda kullanılmaz
  x: F(-10050, 10050), y: F(-300, 600), z: F(-10050, 10050),
  yaw: F(-50, 50),                                     // host'ta sarılır
  anim: S(24, /^[A-Za-z0-9_]+$/), up: N(S(24, /^[A-Za-z0-9_]+$/)), loop: I(0, 1),   // ANIMS dışı → 'Idle' / null
  mode: E(MODES), eq: E(EQUIP),                        // 'kk:' önekine izin yok (N-11)
  torch: B, swimP: F(-3, 3), air: I(0, 1),
  ship: N(ID), lx: F(-60, 60), lz: F(-60, 60), ly: F(-5, 10),
  hp: F(0, 400), down: B, carry: N(ID),                // hp yalnız gölgeyi düşürebilir; down ve carry yok sayılır
}) } }
```

- `eq`, profilde o silah yoksa `none` sayılır (`owns`, `EQUIP_NEED`). Sahip olunmayan silahla yapılan niyetler reddedilir. `torch` yalnız profilde `fener` varken `true` olarak yayılır.
- Bugün `eq` nesne olarak gelirse `Character.hold` içinde `type.startsWith` TypeError oluşuyor (B-04); `kk:` önekiyle ise keyfî kit modeli yükleniyor (N-11). Şema ikisini de kapatır.

### 8.2 Host'ta yetkili konum (`r.auth`) ve görsel konum

`RemotePlayer` iki ayrı durum tutar:
- `r.auth = {ht, x, y, z, yaw, mode, ship, lx, ly, lz, eq, up, anim, budget, divT, hist[]}`: doğrulanmış ve yumuşatılmamış durum. `ht` host benzetim saatidir. Bütün denetimler bunu kullanır. `hist` son 3 sn'yi tutar ve dwell (§2.10) ile blok penceresi (§5.10) için kullanılır.
- `r.pos` ve `r.char`: görsel ve yumuşatılmış durum. Bugünkü `update` (`net.js:87-124`) kalır, ama girdisi `r.auth` olur. 8 m'de ışınlanma kuralı yalnız görseli etkiler.
- `posOf(pid)`: Güverte kiplerinde dünya konumu her zaman host'un gemisinden hesaplanır (`s.localToWorld(lx, deckAt + ly, lz)`, bugünkü `net.js:92-95` mantığı); konuğun gönderdiği `x/y/z` yok sayılır. Kayıkta konum host'taki kayık oturağıdır. Konuk oyunda değilse `null` döner ve bütün yakınlık denetimleri reddeder.

### 8.3 Hareket doğrulayıcısı (`js/net/moveAuth.js`)

```js
applySt(r, s) {                                          // s şemadan geçti; now = game.playTime (host benzetim saati)
  if (hostDrivenMode(r.auth.mode)) { r.auth.look = pick(s, 'yaw','anim','up','loop','eq','torch'); return; }  // helm, cannon, boat, climb
  const dt = clamp(now - r.auth.ht, 0, 1.0); r.auth.ht = now;
  const vmax = VMAX(r, s.mode);                          // kip, taşıma, yorgunluk ve host'un uyguladığı geri itme penceresine göre
  r.auth.budget = Math.min(vmax * BUDGET_CAP, r.auth.budget + vmax * dt);
  const tr = transitionOk(r.auth, s);                    // §8.4; ışınlanma istisnaları ve grant
  if (!tr.ok) return corr(r, 'mode');
  const target = deckMode(s.mode) ? shipLocal(s) : world(s);
  const d = dist2D(r.auth, target);
  const lim = r.auth.budget * TOL + SLACK;
  const acc = d <= lim ? target : moveToward(r.auth, target, lim);   // bütçeyi aşan istek kırpılır (yakalama)
  if (!verticalOk(r.auth, s)) return corr(r, 'vertical');
  if (s.mode === 'ground' && wallCrossed(r.auth, acc)) { r.auth.wallHits++; if (r.auth.wallHits >= 3) return corr(r, 'wall'); }
  r.auth.budget -= dist2D(r.auth, acc); commit(r.auth, acc, s);
  const div = dist2D(acc, target);                       // iddia ile kabul arasındaki sapma
  r.auth.divT = div > 8 ? r.auth.divT + dt : 0;
  if (div > 30 || r.auth.divT >= 1.0) corr(r, div > 30 ? 'teleport' : 'speed');
}
```

| Sabit | Değer | Gerekçe |
|---|---|---|
| `VMAX.ground` | 7,0 m/sn (koşu); yorgunken 4,4; sandık taşırken 4,4 × `carrySpeed` | `player.js` hız formülü (`_speedFor`) |
| `VMAX.swim` | 5,5 m/sn (hızlı yüzme ve palet) | `player.js` yüzme hızı |
| `VMAX.deck` | 7,0 m/sn, gemi yerel koordinatında | Geminin hızı eklenmez |
| `VMAX.climb` | Dikey 3, yatay 1,5 | Merdiven |
| `TOL` | × 1,25 | Kare ve ağ titremesi |
| `SLACK` | 1,0 m | Yuvarlama ve geri itme artığı |
| `BUDGET_CAP` | 1,0 sn | Duraklayıp birden ışınlanma, en çok 1 sn'lik yol kadar kazanç sağlar |
| Geri itme payı | Host'un kendisi bir vuruş ya da patlama uyguladıysa 0,6 sn boyunca hıza +9 m/sn | `player.js:180-186`, `hazards.js:226` |
| Dikey | Yukarı ≤ 9·dt + 1,5. Kip `ground` iken `y ≥ zemin − 1,0`. Destek yüksekliğinin 2,5 m'den fazla üstünde 3 sn'den uzun kalınırsa `corr('fly')`. Aşağı düşüş serbest. | Zıplama hızı 7,4 |
| Duvar | `physics.lineBlocked(önceki → kabul, {rScale: 0.7})`; 2 sn içinde 3 kez → `corr('wall')` | Yalnız host'ta çarpıştırıcısı kurulu bölgede **[BELİRSİZ]** |
| Dünya sınırı | `abs(x), abs(z) ≤ WORLD_HALF − 250` | `player.js:761` |

**Zaman kaynağı (hakem düzeltmesi D-6):** Bütçe host benzetim saatiyle (`game.playTime`) birikir. Gerçek zaman kullanılsaydı testlerde `DK.sim` hızlı aktığı için meşru konuk ceza alırdı. Konuğun saatini hızlandırması etkisizdir, çünkü bütçe host saatine bağlıdır.

### 8.4 Kip geçiş tablosu ve ışınlanma istisnaları

| Geçiş | Kabul koşulu (host verisiyle) |
|---|---|
| İlk `st` (giriş) | Liman doğma alanına (`port.boardingPoint`) ±30 m, ya da host'un `fix` ile verdiği nokta |
| `ground` ↔ `swim` | Konumda su derinliği yeterli: `ocean.heightAt − terrain.heightAt > 1,0` (±0,5 histerezis) |
| `ground` → güverte (iskeleden biniş) | Önceki konum biniş noktasına ≤ 9 m (`ports.nearBoarding` 7 + 2) ve gemi limanda (`ports.atShip(s, 26)`) |
| `swim`/`ground` → `climb` → güverte | Geminin merdivenine ≤ 5 m; tırmanma ≥ 1,2 sn (host süresi); bu sürede konumu host hesaplar |
| `boat` → güverte | Kayık gemiye ≤ `L × 0,8 + 2` |
| güverte(A) → güverte(B) (bordalama) | İki gemi arası ≤ `A.B + B.B + 6` ve oyuncu A'nın küpeştesinde (`shipControl.js:90-103`) |
| güverte → `ground` (iskeleye inme) | `ports.atShip(s, 26)` ve yeni konum biniş noktasına ≤ 6 m |
| güverte → `swim` (düşme, atlama) | Yeni konum gövdeye ≤ 6 m |
| `boat` → `ground`/`swim` | Yeni konum kayığa ≤ 7 m (`shipControl.exitBoat`) |
| güverte → `helm`/`cannon` | Yalnız kilit onayıyla (§7.2); `st.mode`'dan alınmaz |
| herhangi → `boat` | Yalnız `boat{enter}` onayıyla |
| `helm`/`cannon`/`boat` → diğerleri | Kilit bırakılınca ya da `boat{exit}` ile |
| Ölüm → yeniden doğma | Gölge durumu `dead` ya da yaralanma süresi dolmuş; hedef bir liman doğma noktasına ≤ 30 m ya da geminin merdiven başı |
| Hızlı yolculuk, uyku, host ışınlaması | Host `teleport`/`fix` gönderdi; 10 sn içinde hedefe ≤ 10 m (grant) |

### 8.5 Düzeltme (`fix`) ve ihlal

- `fix{x, y, z, mode, ship, lx, ly, lz, why}`: Konuk `player.applyFix()` ile doğrudan uygular. Kip `ground`/`swim` ise `leaveShipToWorld` ya da konum ataması; güverte ise `boardShip` ve yerel konum. Hız sıfırlanır. Ardından host 1 sn boyunca konuğu o noktaya ≤ 3 m bekler.
- Host saniyede en çok 2 `fix` gönderir. Olağan `fix` 1 puan, ışınlanma boyutundaki `fix` 5 puandır; hareketten gelen puan saniyede en çok 10'dur.
- Konuk 10 sn'de 5'ten fazla düzeltme alırsa HUD'da "Bağlantı dalgalanması: konum düzeltildi" görünür.
- **Test kipi:** `?test=1` ile açılan **host**'ta `DK.netTest.teleportGuest(pid, x, y, z, mode)` vardır. Bu yardımcı `r.auth`'u ayarlar ve `fix{why:'test'}` gönderir. Konuk tarafında test kipi hiçbir yetki vermez.

### 8.6 NaN koruması

1. Şema sonlu olmayan değeri reddeder; `r.auth` hiçbir zaman NaN olamaz.
2. Konum alanlarında `num(…, def = 0)` kullanılmaz.
3. Bütün eşik denetimleri `within` ile yapılır. Bugün NaN'da açık kalan yerler: `net.js:284`, `:305`, `:319`, `:350` ve `events.js:234`.
4. Host'un yazdığı geri tepme (`kb`) her zaman iki sonlu konumdan (düşman ve posOf) hesaplanır. Bugün düşman konumu `enemies.js:390-395` yoluyla NaN olabiliyor.
5. `RemotePlayer.update` ve `_hostSnapshot` uzak oyuncu başına `try/catch` içindedir (§10.1).

### 8.7 Anlık görüntüye yansıtma

`_hostSnapshot` içinde `players[id] = r.target` (ham, `net.js:737`) yerine `players[id] = snapState(r)` yazılır. `snapState` `r.auth`'tan, gölge candan (`hp`, `down`), host'un taşıyıcı bilgisinden (`carry`) ve doğrulanmış `eq`, `anim`, `up`, `torch` alanlarından yeniden kurulur. Oyuncu başına ≤ 256 bayttır. Konukta bu nesne yine şemadan geçer. 64 KB'lık `st`'nin her konuğa çoğaltılması (B-04), bozuk `eq`'in diğer konukları düşürmesi ve 16 KB'lık `st` ile bütün konukların düşürülmesi (Y-1) böylece kapanır.

### 8.8 Host'un türettiği olaylar

- **Gürültü (`noise` yerine):** Host her 0,45 sn'de bir r.auth yatay hızından adım gürültüsü üretir: < 0,4 m/sn için 0; < 3 için 3,5 m; < 6 için 6,5 m; daha hızlıysa 11 m; taşırken ×1,4 (`combat.js:92-98` formülü). Saldırılar için yakın dövüş 9 m, tabanca 45 m, zıpkın 6 m, top 90 m üretilir. Düşmanları istenen noktaya çekme saldırısı (B-21) böylece kapanır.
- **Yaralanma (`downed` yerine):** Gölge can 0'a inince host "‹ad› yaralı düştü" bildirimini kendisi gösterir. Adım 15'e kadar `st.down` geçişinden türetilir ve 5 sn'de bir kez gösterilir.
- **Keşif ve yeni canlı:** §4.14.

---

## 9. XSS ve metin güvenliği

### 9.1 Kurallar

| # | Kural |
|---|---|
| R1 | Ağdan gelen hiçbir değer `innerHTML`, `el(…, {html})`, `insertAdjacentHTML` ya da `ui.alert(html)` içine kaçışsız girmez. Metin `textContent` ile ya da `el(tag, {}, metin)` ile yazılır (`util.js` metin düğümü kurar). |
| R2 | HTML şablonu gereken yerlerde (ipucu, gemi paneli) yalnız sabit metin ve `esc()`'lenmiş alanlar kullanılır. Sayılar `Number(x)` ile alınır; sonlu değilse `—` yazılır. Stil değerleri `clamp(Number(v), 0, 100)` ile kurulur. |
| R3 | Renkler `isHexColor` (`/^#[0-9a-f]{3,8}$/i`) kalıbına uymalıdır; uymazsa varsayılan renk kullanılır. |
| R4 | Görüntü verileri (ad, renk, değer) mümkünse yerel tablodan türetilir: `FISH`, `ITEMS`, `CHEST_TIERS`, `SHIP_TYPES`, `ISLANDS`. Eşya verisi kaynağında yeniden kurulur (§9.4). |
| R5 | Bütün ad yollarında `cleanName` uygulanır (`net.js:41`): `hello`, `app`, roster, sohbetin `from` alanı, işaretin `by` alanı, bildirimler. Sohbet ve notlarda `cleanText` uygulanır. |
| R6 | XP ve bildirim gerekçeleri ağda kod olarak gider; metin yerel tablodan üretilir. |
| R7 | CSP savunma derinliği olarak eklenir (§9.5). Kod incelemesinde `innerHTML\s*=\s*\`` ve `html:` kalıpları taranır. |

### 9.2 Dizeyi HTML'e çeviren noktalar (A ve B'nin birleşimi; hepsi kodda doğrulandı)

| Yer | Bugün | Verinin kaynağı | Düzeltme | Bulgu |
|---|---|---|---|---|
| `items.js:127-136` `iconSVG(color)` | Renk SVG dizgesine gömülüyor | Balık verisi (ağ) | R3; değiştirme yalnız geçerli renkle | B-06 |
| `items.js:107-110` `itemName` | `data.name` | Ağ | Balıkta `FISH[key].name` | B-06 |
| `panels.js:21-27` `itemTip` | Ad, `len`, `weight`, `zone`, `value`, `island` kaçışsız birleştiriliyor | Ağ | DOM ile kurulan `tipNode(s)` ya da her alan için `esc`; sayılar `Number()`; ada adı `ISLANDS`'tan | B-06 |
| `panels.js:29-40` `itemCell` (`html: iconSVG`) | — | Ağ | R3 | B-06 |
| `ui.js:82` `showTip(html)` | `innerHTML` | `itemTip` | `showTip(nodeOrText)`: düğüm eklenir; dize gelirse `textContent` | B-06 |
| `hud.js:55-63` `_xpPop` | `innerHTML`, `reason` alanı | Host `xp.r` | `textContent` + `REASONS` kod tablosu | B-18 |
| `hud.js:300-311` gemi paneli | `s.name`, `s.water` (stil içinde), `cannonballs`, `planks` innerHTML'de | c2h `shipFull` (v0.4), h2c `applyNet`/`netNeedShip` | `esc(s.name)`; sayılar `Number()`/`clamp` | **N-1 (kritik)** |
| `ui.js:99-104` `alert(title, html)` | `html:` özniteliği | `reject.why`, `kick.why`, `hostLeft` | Yeni `ui.alertText(başlık, metin)`; ağdan gelen metin yalnız bununla gösterilir | N-2, E-6 |
| `menu.js:261` hızlı katılım | `ui.alert(…, err.message)` | Herkese açık oda `reject.why` | `alertText` | N-2 |
| `menu.js:299`, `main.js:317` `hostLeft` | `ui.alert(…, why + '<br>…')` | `kick.why` | `alertText` | N-2, E-6 |
| `main.js:302-305` `sleepFade` | `${e.day}` innerHTML | Host `sleep.day` | `Number.isInteger`; `textContent` | N-3, E-6 |
| `hud.js:271` pusula işaretleri | `style="color:${m.color}"` innerHTML | Roster rengi | R3; DOM ile kurulum | E-6 |
| `menu.js:290` lobi kartı | `border: 4px solid ${r.color}`, `background: a.shirtColor` | Roster ve APP | R3 (CSS enjeksiyonu: `url()` izleme) | — |
| `net.js:460` `listPublic` | `{code, ...m}` yayma | Herkese açık `info` | Nesne yeniden kurulur | N-4 |
| `net.js:568`, `main.js:336` bayraklar | `Object.assign(quests.flags, m.flags)` | Host `story`/`world` | Beyaz listeyle kopya | E-8 |
| `hud.js:464-468` takım listesi; `main.js:363-371` sohbet; `hud.js` toast/istem; `journal.js`; `panels.js:221` diyalog (yerel metin) | `esc`, metin düğümü ya da yerel veri | — | Doğru; korunur (06a H02 GEÇTİ) | — |

### 9.3 Temizleyiciler

`js/core/util.js` şunları sağlar: `esc(s)` (`hud.js:465`'teki kopya buraya taşınır), `isHexColor(c)`, `cleanText(s, max)`. `js/net/schema.js` şunları sağlar: `fin(x, def)`, `normItemData(id, data)`. `cleanName` net.js'te kalır ve ad yollarının hepsinde kullanılır.

### 9.4 Veriyi kaynağında yeniden kurma

`normItemData(id, data)` host'ta ve konukta çalışır:

| Eşya | Kurulan veri |
|---|---|
| `balik:<key>` | Profilde yalnız `{key ∈ FISH, w: FISH ağırlık aralığına kırpılmış}` tutulur. `name`, `rarity`, `color = FISH[key].colors[0]`, `len` ve `value` her gösterimde `makeCatch` formülüyle (`fishing.js:232-241`) yeniden hesaplanır. `zone`, `bait`, `time` ve `date` alanları ya yerel tablodan gelir ya da kalıpla denetlenir; değilse atılır. |
| `hazine_haritasi` | `{site ∈ DIG_SITES, island: ISLANDS'taki ad, weight: 0,05}` |
| `harita_parcasi` | `{piece: I(1,4), name: sabit kalıp, weight: 0,05}` |
| Diğerleri | Veri atılır |

1e12 değerli balık ve renk alanı üzerinden XSS (B-05, B-06) böylece kaynağında kapanır. Konuktaki normalleştirme kötü niyetli host'a karşı savunma derinliğidir.

### 9.5 İçerik güvenlik politikası (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-<importmap özeti>';
  worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob: data:;
  connect-src 'self' https://0.peerjs.com wss://0.peerjs.com; object-src 'none'; base-uri 'none'; form-action 'none'">
```

- Satır içi `importmap` (`index.html:10-12`) betik kuralına tabidir; özeti CSP'ye yazılır. `style-src 'unsafe-inline'` takım listesi, pusula ve gemi panelindeki `style` öznitelikleri için gereklidir. Asıl önlem R1–R6'dır.
- Satır içi olay işleyicileri (`onerror=`) CSP ile çalışmaz: başka bir XSS yolu kalsa bile betik çalışamaz. WebRTC CSP kapsamında değildir.
- Test sunucusu (`?peerhost=127.0.0.1&peerport=9000`) için `http://127.0.0.1:9000 ws://127.0.0.1:9000` eklentisi yalnız `tests/` altındaki bir `index.test.html` girişinde bulunur; yayın girişine konmaz.
- **Tek HTML (`file://`):** `tools/build-single-html.mjs` satır içi betiklerin SHA-256 özetlerini hesaplayıp CSP'ye yazar. Bu yapılamazsa tek dosyalık sürüm CSP'siz kalır ve bu durum belgelenir (K-5).

---

## 10. Hata yalıtımı ve konuk tarafında host iletisi doğrulaması

### 10.1 Host döngüsü (B-09, Y-1)

| Yer | Bugün | v0.5 |
|---|---|---|
| `main.js:117-123` | Tek güncelleyici: `game` → `hud` → `net` → duraklatma tuşu → `input.endFrame` | Dört ayrı güncelleyici: `game.update`; `hud.update`; `net.update`; duraklatma tuşu + `input.endFrame`. `engine.js:65-67` her birini ayrı `try/catch` içinde çalıştırır. `input.endFrame` her karede çalışır; bugün bir hata `pressedSet`'in temizlenmesini atlatıyor. |
| `game.update` sistem döngüleri, `game._step` gemi döngüsü (`game.js:189-238`) | Korumasız | Sistem ve gemi başına `try/catch` ve hata sayacı; günlüğe sistem başına 5 sn'de bir kez yazılır. Hata veren gemide önce `s.sanitize()` çalışır. Aynı gemi 2 sn içinde 3 kez hata verirse **karantinaya** alınır: güncellenmez, anlık görüntüye girmez. Oyuncu gemisi karantinaya alınmaz; host her 10 sn'de aldığı `_lastGood = serialize()` kopyasından geri yüklenir. |
| `G.rowboat.update` | Korumasız | `try/catch` + `sanitize` (sonlu `x, z, yaw, rowPhase`) |
| `net.update` uzak oyuncular (`net.js:709`) | Korumasız | Uzak oyuncu başına `try/catch`; konuk verisinden kaynaklanan hata o konuğa 10 puan yazar |
| `_hostSnapshot` (`net.js:734-743`) | Tek blok | Bölüm başına `try/catch` (oyuncular, gemi başına gemiler, kayık, düşmanlar, bosslar, hayvanlar, deniz canlıları, zaman, hava, olaylar, sandıklar). Hatalı bölüm o karede atlanır; yayın sürer. Sayısal alanlar `fin(x, 0)` ile korunur. `players` → `snapState`. |
| `_hostData` | Korumasız `switch` (`net.js:272-387`) | §2.9 iskeleti (`try/catch` + ihlal) |
| `_dropPeer` (`net.js:390-403`) | `includes` istisnası temizliği yarıda bırakıyor (`:398`) | Her temizlik adımı ayrı `try/catch`; `Array.isArray` savunması; kovalar, `_rate`, `_gold` ve kapı silinir |
| `conn.on('error')` (`net.js:233`) | Her hatada `_dropPeer` | `message-too-big` için yalnız günlük ve sayaç; diğer hatalarda düşürme (Y-1) |
| Atomik uygulama | `_shipFull` (`:615`) ve `_applyChestState` (`:593-601`) önce atıyor, sonra denetliyor | "Doğrula → hesapla → ata"; yarım atama yok |
| Gözcü | — | Çevrimiçiyken 2 sn boyunca `net.snapT` artmazsa `console.error` yazılır ve host'a "Anlık görüntü durdu" bildirimi gösterilir; testler bu sayacı izler |

Kabul ölçütü (B-09): Bir gemiye test kancasıyla `upg = undefined` yazıldığında yalnız o gemi onarılır ya da karantinaya alınır. `snapT` artmaya devam eder ve `input.pressedSet` her karede temizlenir.

### 10.2 Konuk tarafı ağ işleyicisi

- `_clientData` (`net.js:526-579`) aynı şema kayıt defterini h2c yönünde kullanır (`H2C`). Her ileti ayrı `try/catch` içinde işlenir. `applySnap` (`:655-693`) bölüm başına korunur.
- Geçersiz ileti yok sayılır ve sayılır. 60 sn içinde 30 geçersiz ileti gelirse kullanıcıya bir kez "Oda sahibinden bozuk veri geliyor" uyarısı ve "Odadan çık" seçeneği gösterilir. Sorun host'taki bir hatadan kaynaklanıyor olabileceği için konuk bağlantıyı kendiliğinden kesmez.

### 10.3 Konukta h2c doğrulaması (B-18, N-3, N-7, E-8)

| Tür | Şema ve sınır (konukta) |
|---|---|
| `hi` | `proto I`, `w ID(64)`, `n S(32, b64url)`, `hid === conn.peer` |
| `welcome` | `id`, `color` (hex), `room{name S(40), code S(8), difficulty E}`, `roster` (≤ 4), `started B`, `proto`, `tok?{w,g,k}`, `lastTx I`, `prof` (yığın ≤ 160, altın ≤ `GOLD_MAX`, seviye 1–30) |
| `reject`, `kick` | `code E`, `why S(160)` → `ui.alertText` |
| `pong` | `ts F` |
| `roster` | ≤ 4 kayıt `{id, name→cleanName, app→APP, color→hex, ready B, host B}` |
| `start` | `difficulty E('kolay','normal','zor')`, `friendlyFire B` |
| `worldPart` | Parça ≤ 16 000 bayt; toplam ≤ 512 KB; birleşik içerik alt şemalardan: gemi (`serialize` alanları + `sanitize`), `chests` ≤ 200 (içeriksiz `chestNet`), `pickups` ≤ 300, `quests{stage I(0, STORY.length−1), flags (beyaz liste), markers ≤ 61}`, `time`, `rowboat`, `feats` |
| `snap` | `players` ≤ 4 (`snapState` şeması); `ships` ≤ 24 (`netState` dizisi alan alan: sayılar sonlu, `anchorState` beyaz listede, diziler model uzunluğunda); `floats` ≤ 64; `shots` ≤ 40; `rb` (sonlu sayılar, `cargo` ≤ 2, `driver` roster'da ya da null); `en` ≤ 256, `an` ≤ 256, `mf` ≤ 64 (kendi `applySnapshot` fonksiyonlarında sonluluk); `time` (`hour F(0,24)`, `weather E`, `forecast` ≤ 8); `ch` ≤ 200; en çok 64 KB |
| `inv` | `st` ≤ 160; `id` ITEMS içinde ya da `balik:<FISH>`; `n I(1,100 000)`; veri `normItemData`; `g I(0, GOLD_MAX)`; `cap F(1,500)` |
| `prof` | `lvl I(1,30)`; `sk` anahtarları `SKILL_IDS` içinde ve değerleri 0–3; `pts ≥ 0`; `maxHp I(100,400)` |
| `gold` | `g I(0, GOLD_MAX)`, `d I(-1e6, 1e6)`, `r E(REASONS)` |
| `xp` | `d I(0, 10 000)`, `r E(REASONS)`, `L I(1,30)`, `X ≥ 0`, `P ≥ 0` |
| `hurt` | `dmg F(0,500)`, `from N(V3)`, `cause S(60)`, `melee B`, `ub B`, `bullet B`, `aid N(ID)`, `kb F(0,12)` |
| `hp` | `v F(0, maxHp)`, `down B`, `dead B` |
| `fix`, `teleport` | V3 dünya sınırları içinde; `mode E(MODES)`; `why E` |
| `story` | `stage I(0, STORY.length−1)`; bayraklar beyaz listede ve `true`; `Object.assign` yok (E-8) |
| `sleep` | `day I(1, 1e6)`, `hour F(0,24)` (N-3) |
| `chat` | `from` → `cleanName`; `text S(240)`; `color` hex |
| `act` | `from` roster'da; `a E`; `anim E(ANIMS)`; `dir DIR3` |
| `give` | Yalnız bildirim; `items` ≤ 20 `[ITEM_ID ya da balik:FISH, I(1,9999)]`; `from S(40)` |
| `hold` | §6.3 süzülmüş biçim; `tier` beyaz listede (N-9) |
| `shipFull` | Gemi şeması; atomik atama; `replace` için `typeId ∈ SHIP_TYPES` |
| `chestSpawn`, `chestState`, `chestGone` | `tier ∈ CHEST_TIERS`, `pos V3` sonlu, `carriers` ≤ 2 ve roster'da, `state E` |
| `pickupSpawn/Gone/Items` | `items` ≤ 12; kimlikler beyaz listede; veri `normItemData`; `t F(0,1800)` |
| `marker` | `x, z` sınırlı; `by` → `cleanName`; `note S(80)` |
| `hazard` | `id ID`, `a E`, `f F(0,10)`, `x, z` sonlu |
| `lock`, `boat` | `id S(64)` / `cmd E`; `who` roster'da ya da null |
| `cannon` | `ship` var; `i` tamsayı ve `< cannonState.length` (N-7; bugün `net.js:573` TypeError atıyor); `yaw`, `pitch` sonlu |
| `revive` | `target === G.myId` **ve** yerel oyuncu yaralıysa uygulanır |
| `hit`, `txr`, `station`, `bite`, `featSt`, `warn` | §3.3 |

### 10.4 Konuğun yerel verisinin korunması (G6)

- Konuk host verisini **yalnız** `dksh.wcache.<worldId>` (önbellek) ve `dksh.wtok.<worldId>` (anahtar) anahtarlarına yazar. Online konuk dalında `saveNow` (`main.js:199-206`) yalnız önbelleği yazar.
- Host verisiyle **asla** yazılmayan anahtarlar: `dksh.solo.*`, `dksh.online.*` (konuğun kendi host kayıtları), `dksh.guest.0` (eski konuk kaydı), `dksh.progress.guest`, `dksh.profile`, `dksh.gbook.*`. Görünüm (`profile.appearance`) host'tan gelmez.
- XSS kapalı olduğu için (§9) host konukta betik çalıştırıp localStorage'a erişemez. Önbellek dünya başına ayrı olduğundan kötü niyetli host yalnız kendi dünyasının önbelleğini bozabilir.
- Oturum sonunda konuğa "Bu dünyada: +X altın, +Y XP, Z eşya" özeti gösterilir.

---

## 11. Dosya bazında değişiklik listesi ve uygulama sırası

### 11.1 Yeni modüller

| Dosya | Sorumluluk | Ana fonksiyonlar | ~Satır |
|---|---|---|---|
| `js/net/schema.js` | Dilbilgisi, C2H (29) ve H2C kayıtları, APP ve LOOK şemaları, sabit kümeler, temizleyiciler, sürüm | `F, I, B, S, ID, E, V3, DIR3, A, O, N, opt, DICT`, `validate(dir, t, obj)`, `normItemData`, `fin`, `within`, `within3`, `PROTO`, `MODES/EQUIP/ANIMS/REASONS/OPS` | 550 |
| `js/net/guard.js` | Bağlantı kapısı | `PeerGate` (faz, `lastQ`, kovalar, bayt kovası, ihlal puanı, hello zaman aşımı, uyarı, atma), `banList`, `roomLock`, `holdOk` (dwell), `logOnce` | 280 |
| `js/net/moveAuth.js` | Hareket doğrulaması | `applySt`, `transitionOk`, `verticalOk`, `wallCrossed`, `corr/fix`, `posOf`, `snapState`, `teleportGuest` (test) | 450 |
| `js/net/guestBook.js` | Konuk profilleri ve kimlik | `start(worldId)`, `save()`, `bind(auth, hi)`, `create()`, `issueKey()`, `rebind()`, `importLegacy()`, `sybil()`, `ledger.add/check`, `txGet/txPut`, `awardXp`, `profCtx(pid)`, `syncInv/syncProf` | 650 |
| `js/net/hostOps.js` | Etkileşim ve gemi işleyicileri | `chestReq, pickupReq, floatReq, dig, hold, holdTake, item, feat, story, revive, marker, hazard, lock, helm, fire, shipCmd, boat, boatSt, fish, sync, importReq` | 900 |
| `js/net/hostCombat.js` | Savaş niyetleri ve gölge can | `cs`, `onAct`, `update(dt)` (zamanlanmış vuruşlar), vekil saldırgan, `onEnemyHit`, `onParry`, gölge can ve yaralanma, gürültü türetme, hasar gözlemcisi | 550 |
| `js/economy/econ.js` | Saf ekonomi çekirdeği ve `tx` işleyicileri | `planSell, planSellAll, planSellChest, planSellHold, planBuy, planSvc, apply`, `earnShared`, `merchantAt`, `breaker`, `onTx` | 450 |
| `js/net/client.js` | Konuk istemci API'si | `act(t, payload)` (`q` ekler), `tx(a, args)` (`x`, 5 sn zaman aşımı, tek yeniden deneme), `sync`, `applyInv/applyProf/applyFix/applyHp` | 220 |
| `js/net/netTest.js` | Yalnız `?test=1` ve host (yayın derlemesinin dışında) | `invariants()`, `audit()`, `teleportGuest`, `grantItem`, `breakShip`, `advanceClock` | 180 |

### 11.2 Değişen dosyalar

| Dosya | Fonksiyonlar ve değişiklik |
|---|---|
| `js/net/net.js` | `VER/KNOWN` → `schema`. `host()`: `worldId`, `hi`. `_onConn`: serileştirme denetimi, `PeerGate`, `'error'` ayrımı. `_hostData` → `_onRaw` (§2.9) + `HANDLERS`; eski `switch` (`:272-387`) kaldırılır. `_dropPeer` savunmacı. `join()`: `info` yoklaması, raw, `hi`, HMAC, sürüm iletileri. `listPublic` yeniden kurma ve sürüm etiketi. `_clientData`: H2C şeması ve ileti başına `try/catch`; `revive` yalnız yaralıyken; `story` beyaz liste; `cannon` dizin denetimi. `broadcast`: yalnız host'un kurduğu nesneler. `_hostSnapshot`: `snapState`, bölüm başına koruma, `fin`. `_sendWorld` → `worldPart` (içeriksiz `chestNet`, `feats`). `relay` listesi (`:143-184`): `hurt*`, `gold`, `maps`, `noise`, `downed`, `chestState/chestGone/hold/shipFull/lootReq` gönderimleri kaldırılır; `act`, `tx`, `item`, `feat`, `fish` eklenir. Yeni: `kick(pid, code)`, `lockRoom(on)`. `RemotePlayer`: `auth` ile görsel ayrımı, sonlu sayı koruması, `setAppearance` `try/catch` içinde. |
| `js/main.js` | Güncelleyicilerin bölünmesi (`:117-123`). `startOnlineGuest`: `welcome.prof`. `saveNow`: konukta yalnız `wcache`; host'ta dünya, ardından `gbook`. `hostLeft` → `alertText`. `sleepFade` sayı ve `textContent`. `netReplaceShip`: `typeId` denetimi. `netTest`'in koşullu yüklenmesi. Tayfa paneli kancaları. |
| `js/game/game.js` | `update`/`_step`: sistem ve gemi başına `try/catch`, karantina, `_lastGood`. `serialize`/`start`: `worldId`. Sistem kaydı: `hostCombat` (yalnız host). |
| `js/game/combat.js` | `_meleeHit(p, D, opts)`; `weaponBase()`; `fireCannon(…, mods)`; online konuk dalında `_attack`, `shoot` ve dolum görsel + niyet; patlamanın uzak avatarlara gölge hasarı; `noise` konukta ağa gitmez. |
| `js/game/enemies.js` | `hurt`: konuk dalı başa taşınır, gönderim kaldırılır. `_hitPlayer`: uzak oyuncu için `hostCombat.onEnemyHit`. `_players`: gölge `hp/down`. Lav ve zehir hasarı gölgeye. |
| `js/game/bosses.js` | `hurt` ve `_hurtTentacle` konuk dalları gönderimsiz; `netHurtBossApply` silinir. |
| `js/wildlife/animals.js`, `megafauna.js` | Konuk dalları gönderimsiz; hedefleme gölge değerlerle. |
| `js/wildlife/fishing.js`, `seagear.js`, `fish.js` | Saf `rollWait`, `rollFish`, `makeCatch`. Konukta `fish{cast, catch, net, spear}` ve `bite` uygulanır. Zıpkın atışı `act{throw}`. Köpekbalığı ganimeti `feat:shark`. Batık sandığı `feat:wreck`. |
| `js/treasure/treasure.js` | `loot` dinleyicisi (konukta `lootReq` yok; taşma host'ta kese). `giveItems(target, items)`: profil ya da yerel envanter. `_grant/_openChest/_collect(…, pid)` profile yazar. `drop/stowInHold/stowInBoat` konukta `chestReq`. `activeSites(pid)`. `resolveDig(x, z, pid)`. `chestNet` içeriksiz. |
| `js/economy/shop.js` | `sellPrice(stack, role, mods, bonus)`. `buy/sell/sellAll/sellCarriedChest/sellHoldChests/repairShip/upgrade/buyForShip/unlockCosmetic`: yerelde `econ` çekirdeği, online konukta `client.tx`. `earn` → `econ.earnShared`. |
| `js/economy/items.js` | `iconSVG` renk kalıbı; `itemName` balıkta `FISH`. |
| `js/player/inventory.js` | `gold` erişimcisi ve sınırları; `add`/`remove` sayı denetimi; `load` süzgeci; `sid` ve `b` desteği (yalnız profil ve konuk önbelleğinde). |
| `js/player/player.js` | `netState` (`ts`); `applyFix`; `applyHostHp`; `_parry` → `act{parry}`; kaçınma → `act{dodge}`; `revive` yalnız yaralıyken; `weaponDamage` → `weaponBase`. |
| `js/game/progress.js` | Saf `applyXp`, `learnSkill`, `modsOf`, `maxHpOf`. Konuk dalında yerel kazanç yok, `prof` uygulanır. `_guestSave` kaldırılır. `share()` host'ta `guestBook.awardXp` üzerinden. |
| `js/game/quests.js` | `advance` (`to < STORY.length`); `takeJournal` ve diyaloglar online konukta `story` gönderir; bayrak beyaz listesi; tetikleyiciler yalnız host'ta; `_sideCheck` profil üzerinden; keşif için saf fonksiyon; konukta NPC hizmetleri `client.tx`. |
| `js/game/interact.js` | Değişiklik az: kilit API'si host'ta; konukta kilitli adayın iyimser geri alınması. |
| `js/game/shipControl.js` | Online konukta istasyon eylemleri gemi durumunu değiştirmeden `lock`/`shipCmd`/`boat` gönderir; host devralma istemi; `takeHelm/takeCannon` iyimser + `station{release}`. |
| `js/ship/ship.js` | `sanitize()`; `applyNet` (sonluluk); `rebuild` (`disposeTree`, dolumun korunması). |
| `js/world/hazards.js` | `netApply` → `applyFromHost` + `requestFrom`; `syncRemoteSets`; görünürlük; online konukta `_interact` niyet gönderir. |
| `js/world/islands.js` | `templeOrder(fid)`; `featAnchors(fid)` (K-8); nitelik eylemleri online konukta `feat`; tutsak altını host'ta; `netState`/`applyNet` (`opened`, `freed`, `temples`). |
| `js/world/details.js` | Kabuk toplama online konukta `feat:shell`. |
| `js/game/events.js` | `collectFloatingById(id, pid)` → `within`, kip yarıçapı, profile yazma. |
| `js/ui/hud.js` | `_xpPop` (`textContent`, `REASONS`); gemi paneli (`esc`, sayı); pusula rengi; Tayfa paneli (At, Kilitle, Defter, profiller). |
| `js/ui/panels.js` | `itemTip` → `tipNode`; `itemCell`; ambar paneli (`tier` beyaz listesi; `hold{put/get}`, `holdTake{cid}`); online konukta envanter menüsü `item` niyetine; dükkân `client.tx`. |
| `js/ui/ui.js` | `alertText`; `showTip(nodeOrText)`. |
| `js/ui/menu.js` | Sürüm iletileri; herkese açık listede sürüm etiketi ve uyarı; `quickJoin`/`hostLeft` → `alertText`; lobide [At] ve [Kilitle]; ithalat ayarı ve onay penceresi; "Yeni tayfa olarak katıl". |
| `js/ui/dice.js` | Online konukta `tx{svc, dice}`; animasyon `txr.d`'den. |
| `js/ui/creator.js` | Online konukta kozmetik satın alma `tx{svc, cosmetic}`. |
| `js/core/save.js` | `gbook`, `gslot`, `wtok`, `wcache` yardımcıları; `valid` değişmez. |
| `js/core/util.js` | `esc`, `isHexColor`, `cleanText`. |
| `index.html`, `tests/index.test.html` | CSP; test girişi. |
| `tools/build-single-html.mjs` | CSP özetleri; `netTest.js`'in derlemeden çıkarılması. |
| `tests/harness/coop.cjs` (+ `evil.cjs`) | `--split`, `--latency`, `--url2`, gerçek zaman oranı; kötü istemci yardımcıları. |
| Mevcut senaryolar `06a`–`06d` | Konuk ışınlamaları `teleportGuest`'e; kaldırılan türlerin beklentileri (§12.2) güncellenir. |

### 11.3 Uygulama sırası

Her adım ayrı bir commit ya da PR'dır. "Kabul" ölçütündeki testler geçmeden sonraki adıma geçilmez. Bütün adımlarda tek oyunculu 00–17 senaryoları ve (uyarlanmış) `06a`–`06d` yeşil kalmalı, sayfa hatası 0 olmalıdır. Adım 7'den sonra bazı konuk özellikleri kendi adımı gelene dek dal içinde geçici olarak kapalıdır; liste her adımın "Geçici" satırında verilir (K-7). Yayın Adım 17'den sonra yapılır.

**Adım 0 — Test altyapısı ve kırmızı taban** (1,5 gün)
- *Dosyalar:* `tests/harness/coop.cjs` (`--split`: her oyuncu ayrı Chromium süreci; `--latency <ms>`; `--url2`: ikinci URL; tik gerçek zaman/benzetim oranı ≥ 0,5), yeni `tests/harness/evil.cjs` (`raw(page, obj)`: `hostConn.dataChannel.send(bayt)`; `rawQ`: doğru `q` ile; `burst(m, n)`; `patch`: yerel değerleri bozma), yeni `js/net/netTest.js` (`invariants`, `audit`, `teleportGuest`, `grantItem`, `breakShip`), `main.js` (koşullu yükleme), `tools/build-single-html.mjs` (hariç tutma).
- *Test:* `06e`–`06i`, `06n` iskeletleri v0.4'e karşı koşulur. Kırmızılar `tests/out/faz2_taban.json`'a yazılır. Y-1 ölçümü yapılır: 16 KB'lık ham `st` sonrasında host roster'ı. `file://`'da `crypto.subtle` var mı (D-5)?
- *Kabul:* B-01, B-02, B-03, B-04, B-05, B-07, B-08 ve Y-1 tarayıcıda yeniden üretilir. Ölçümler belgelenir.

**Adım 1 — Hata yalıtımı ve anlık görüntü sınırı (B-09; B-01, B-03 ve Y-1'in çökme/düşürme kısımları)** (1,5 gün)
- *Dosyalar ve fonksiyonlar:* `main.js:117-123` dört güncelleyiciye bölünür. `game.js` `_step`/`update`: sistem ve gemi başına `try/catch`, karantina, `_lastGood`. `ship.js`: `sanitize()`, `rebuild()` (`disposeTree`, dolumun korunması), `applyNet` sonluluk denetimi. `net.js`: `_hostSnapshot` bölüm başına + `fin` + geçici `snapState`; `update` uzak oyuncu başına `try/catch`; `_dropPeer` savunmacı; `'error'` ayrımı.
- *Test:* `06f` B-09 (`breakShip`); B-01 (`shipFull{ship:{id,typeId}}`) ve B-03 (`rp` alanı olmayan `boatSt`) çökme kontrolleri; Y-1 (16 KB `st`); Node `ship_sanitize.mjs`.
- *Kabul:* Saldırılardan sonra 10 sn boyunca `snapT` artar. `input.pressedSet` her karede temizlenir. Roster küçülmez. 120 `mastFix`/sn sonrasında `renderer.info.memory.geometries` artmaz.

**Adım 2 — XSS kaçışları ve CSP (B-06, B-18'in XSS kısmı, N-1…N-4, E-6, E-8)** (1,5 gün)
- *Dosyalar ve fonksiyonlar:* `util.js` (`esc`, `isHexColor`, `cleanText`); `items.js` (`iconSVG`, `itemName`); `panels.js` (`itemTip` → `tipNode`, `itemCell`); `ui.js` (`showTip`, `alertText`); `hud.js` (`_xpPop`, gemi paneli, pusula); `menu.js` (`quickJoin`, `hostLeft`, lobi renkleri); `main.js` (`sleepFade`, `hostLeft`); `net.js` (`listPublic` yeniden kurma; bayrak beyaz listesi kopyası); `index.html` CSP; `tests/index.test.html`.
- *Test:* Node `xss_sinks.mjs` (kötü girdide `<` ve `"` kaçışlanır; `iconSVG({id:'balik:x'}, 'kötü')` varsayılan rengi üretir); `06i` XSS bölümü (kötü host: `xp.r`, `kick.why`, `sleep.day`, `snap` gemi `water` dizesi); `06g` B-06 (v0.4 `lootReq` yoluyla kötü balık rengi; bu adımda sink düzeltmesi sınanır).
- *Kabul:* DOM'da `img[onerror]` ya da `script` yok. `document.title` değişmez. Meşru akışlarda CSP ihlali günlüğü yok.

**Adım 3 — El sıkışma, sürüm ve raw serileştirme (B-15, B-16, Y-1, Y-2)** (2,5 gün)
- *Dosyalar ve fonksiyonlar:* `schema.js` (yalnız `PROTO` ve oturum türlerinin şemaları); `net.js` `host()` (`worldId` okuma/üretme), `_onConn` (serileştirme denetimi, `hi`, `pre` fazı, 5 sn), `hello` (tek sefer, şifre tek deneme ve oda kilidi, `cleanName`, APP), `join()` (`info` yoklaması, raw), `info` (`proto`, `build`, sel sınırı), `ping`, `app`, `listPublic` sürüm etiketi, gönderim sarmalayıcısı, `worldPart`; `menu.js` sürüm iletileri. Bu adımda ileti işleyicileri hâlâ v0.4 `switch`'idir; yalnız ham ayrıştırma ve boyut denetimi değişir.
- *Test:* `06m_surum_el_sikisma` (`--url2` ile v0.4 kopyası: iki yön ve herkese açık liste); `06e` B-15 (ikinci `hello`, 1000 × 70 KB `ping`, 5000 karakterlik HTML ad, 6 yanlış şifre); Node `wire_parts.mjs` (bölme ve birleştirme); 600 kese ve 61 işaretli dünyada geç katılım.
- *Kabul:* Eski ↔ yeni iki yönde de açık ileti gösterilir. Roster büyümez. 6 yanlış şifreden sonra oda 60 sn kilitlenir. 200 KB'lık ham ileti ayrıştırılmadan düşer. Büyük dünyada geç katılım çalışır.

**Adım 4 — Şema kapısı, oran, ihlal, atma ve geçiş önlemleri (B-17, B-20, B-21; B-05/B-07/B-08 için geçici sınırlar)** (3 gün)
- *Dosyalar ve fonksiyonlar:* `schema.js` (v0.4 türlerinin hepsi için geçiş şemaları); `guard.js` (`PeerGate`, kovalar, ihlal, uyarı, atma, kara liste, oda kilidi); `net.js` `_onRaw` iskeleti (§2.9); `act` yeniden kurma (`from = pid`); `inter/prog` silinir; `noise/downed` host'ta türetilir; `marker/chat` oranları; `kick` gönderimi; geçiş önlemleri (§4.18, §5.14): `gold` kapatılır, `lootReq/hold` bütçesi, `hurt*` sertleştirmesi; `hud.js`/`menu.js` Tayfa paneli [At]/[Odayı kilitle].
- *Test:* Node `net_schema.mjs` (her tür için geçerli ve geçersiz örnek; şema imzası ↔ `PROTO`), `bucket.mjs`, `net_fuzz.mjs` (saplamalı `_onRaw` ile 100 000 rastgele ileti); `06e` B-17 (15 sn × 500 ileti/sn; yeniden bağlanma; elle atma), B-20, B-21; `06h` geçiş (120 `hurtEnemy`/sn; 9 km'den `hurtBoss`); `06g` (300 × `gold`; 40 sahte sandıklı `hold`; 10 × 999 `lootReq`).
- *Kabul:* Sel gönderen konuk ≤ 10 sn'de atılır ve aynı `gid`/pid ile dönemez. Bulanık testte istisna 0'dır. Geçiş tavanıyla hasar/sn ≤ 300 olur. Uzaktan boss vuruşu reddedilir. `gold` iletisi host altınını değiştirmez. Konuk başına ganimet değeri dakikada ≤ 1 500 altındır.
- *Geçici:* Konuğun satış payı tayfaya dağıtılmaz (Adım 9'a kadar).

**Adım 5 — Gemi, kayık ve istasyonlar (B-01, B-02, B-03, B-13)** (2,5 gün)
- *Dosyalar ve fonksiyonlar:* `hostOps.js` `lock`, `helm`, `fire`, `shipCmd` (alt şemalar, tahta maliyeti, dwell, dizin aralığı), `boat`, `boatSt`; `net.js` c2h `shipFull` kaldırılır; `_shipFull` yalnız h2c ve atomik; `shipControl.js` iyimser istasyon ve devralma; `main.js` `netReplaceShip` `typeId` denetimi. Yakınlık bu adımda `posOf()` üzerinden yazılır; Adım 6'ya kadar beyan edilen ama NaN olamayan konumu kullanır, sonra kendiliğinden doğrulanmış konuma geçer.
- *Test:* `06f` B-01 (ücretsiz brigantin, `hp:1e9`), B-02 (`cannonFix i=4294967294`, `sails 'abc'`, `addBalls`, tahtasız `repair`, limandan `anchor`/`bail`), B-03 (sürücülük çalma, ışınlanma, `dock` ile askıya çekme), B-13 (iskeleden kilit, düşman gemisi kilidi, iki kilit, host'un devralması); `06j` R7 (dümen, top, devralma), R8 (kayık).
- *Kabul:* Denetimdeki yeniden üretme adımlarının hepsi etkisizdir. `G.ship.upg` nesne olarak kalır. `sailTarget ∈ [0,1]`. Meşru dümen, top ve kayık akışları geçer.
- *Geçici:* Konukta gemi ustası hizmetleri ve konuğun gemiye gülle/tahta yüklemesi kapalı (Adım 8–9).

**Adım 6 — Hareket doğrulaması (B-04, N-11)** (3 gün)
- *Dosyalar ve fonksiyonlar:* `moveAuth.js` (`applySt`, geçiş tablosu, `posOf`, `snapState`, `fix`, `teleportGuest`); `net.js` `RemotePlayer` (`auth` ile görselin ayrılması), `_remoteState`; `player.js` `netState` (`ts`) ve `applyFix`. Mevcut testlerdeki konuk ışınlamaları (`06a:52`, `06b:25/33/70/75/111`, `06d:24/37`) `teleportGuest`'e çevrilir.
- *Test:* Node `move_validator.mjs` (yürüme kabul; ışınlanma ret; düşme kabul; uçma ret; kip geçişleri; NaN; saat hızlandırma); `06l_hareket_dogrulama`; `06f` B-04 (`x:'a'`, 300 m ışınlanma + etkileşim, `eq:{}` ve `kk:x` 100 Hz, 2 KB `st`).
- *Kabul:* Meşru hareket kiplerinde dakikada ≤ 2 düzeltme olur (`--latency 120` ile ≤ 5). NaN ve dize konum reddedilir, `r.auth` sonlu kalır. 0,07 sn'de 15 m'lik ışınlanma düzeltilir. Uzaktaki etkileşim reddedilir. Bütün `06a`–`06d` senaryoları uyarlanmış halleriyle yeşildir.

**Adım 7 — Konuk profili, kimlik ve kayıt (B-19'un temeli)** (4,5 gün)
- *Dosyalar ve fonksiyonlar:* `guestBook.js`; `save.js` (`gbook`, `gslot`, `wtok`, `wcache`); `game.js` `serialize`/`start` (`worldId`); `main.js` `startOnlineGuest` (`welcome.prof`) ve `saveNow` (sıra: dünya → defter; konukta yalnız `wcache`); `net.js` `hello` HMAC ve `welcome.tok`; `inventory.js` sertleştirme (§4.12); `progress.js` saf çekirdekler; `client.js` (`applyInv`, `applyProf`); `treasure.giveItems` ve `_grant/_openChest/_collect` host'ta profile yazar; `events.collectFloating` profile yazar; `menu.js` ithalat ayarı ve "Yeni tayfa olarak katıl"; `hud.js` Tayfa paneli (profiller, defter, bağla).
- *Test:* Node `hmac.mjs` (WebCrypto ve gerekiyorsa saf JS yedeği aynı sonucu verir; aktarma senaryosu reddedilir), `ledger.mjs`, `inventory_sanitize.mjs`; `06k_profil_belirtec` (anahtar verme, yeniden katılma, host'un kaydedip yüklemesi, ithalat ayarları, profil bağlama, sahte host'tan MAC aktarma reddi, sybil sınırı); tek oyunculu `08_kalicilik` ve `12_kayit_dongusu` (v0.4 kayıtlarıyla).
- *Kabul:* Yeniden katılımda aynı profil yüklenir ve roster'da çift kayıt olmaz. v0.4 tek oyunculu, online ve konuk kayıtları açılır. `dksh.guest.0` bayt bayt aynı kalır. Konuk konsolunda `inv.gold = 1e9` yapılması host profilini etkilemez ve bir sonraki `inv` ile geri alınır.
- *Geçici:* Konuğun yerel envanter kaynakları (balık, ada sandıkları, dükkân, yeme) kendi adımına kadar kapalıdır; arayüzde "geliştirme dalı: Adım N" notu gösterilir.

**Adım 8 — Envanter niyetleri: bırakma, kullanma, ambar; `lootReq` ve tam durum `hold`'un kaldırılması (B-05, B-06'nın kaynağı, N-8, N-9, E-7)** (2,5 gün)
- *Dosyalar ve fonksiyonlar:* `hostOps.js` `item`, `hold`; `schema.js` `normItemData`; `treasure.js` `loot` (taşma host'ta), `chestNet` içeriksiz; `panels.js` envanter ve ambar paneli; `shop.js` `buyForShip` → `hold{put}`; `net.js` `lootReq`/`hold` c2h tam durumu kaldırılır.
- *Test:* `06g` B-05 (eski biçimli `hold` ve `lootReq` bilinmeyen tür ya da şema reddi alır; profilde olmayan `sid` reddedilir; yanlış `cid`); `06g` B-06 (veri kaynağında kurulur); `06j` R4 (ambar), 06b H03/H10 ve 06d C01–C05 eşdeğerleri; N-8 (ambardan balık).
- *Kabul:* Kötü konuk host'un ambarını, keselerini ve altınını değiştiremez. Defter tutarlıdır. Meşru ambar, bırakma ve yeme akışları çalışır.

**Adım 9 — Ekonomi işlemleri `tx` (B-08 kalıcı; 5.1a–5.1j; E-3'ün ödeme kısmı; E-5)** (3,5 gün)
- *Dosyalar ve fonksiyonlar:* `econ.js` (saf planlar, `earnShared`, `merchantAt`, devre kesici, `onTx`); `shop.js` (`sellPrice(…, mods, bonus)`; yerel yollar `econ` üzerinden; online konukta `client.tx`); `quests.js` NPC hizmetleri; `dice.js`; `creator.js`; `panels.js` dükkân (`p` beklenen fiyatı, "İşleniyor…"); `net.js` c2h `chestGone/chestState` kaldırılır.
- *Test:* Node `econ_tx.mjs` (fiyat, idempotans, atomiklik, `earnShared` toplamı, `GOLD_MAX`, al-sat döngüsünün olmaması); `06g` B-08 (aynı `x` iki kez; olmayan eşya; 100 m uzak tüccar; kapalı dükkân; iki konuktan eşzamanlı `sellHold`; devre kesici); `07_ekonomi` (tek oyunculu); `06j` R4, R5, R6.
- *Kabul:* Konuk iletileri, host'un kendi hesapladığı pay dışında host'un altınını artıramaz. Aynı `x` tek kez işlenir ve aynı `txr`'yi döndürür. Eşzamanlı ambar satışı yalnız bir ödeme üretir. Paylar host hesabıyla birebir eşleşir.

**Adım 10 — XP, yetenekler ve kişisel görevler (B-19'un tamamı, E-3)** (2 gün)
- *Dosyalar ve fonksiyonlar:* `guestBook.awardXp`; `progress.js` `share()` host'ta; `quests.js` keşfin saf fonksiyonu, `_sideCheck` profil üzerinden, görev alma ve teslim `tx{svc, quest}`; `hud.js` `REASONS` metinleri; `learn`.
- *Test:* `06g` XP saldırıları (yerel `progress.level = 30`; sahte `xp` iletisi; keşfin tekrarlanması); yan görev regresyonu; R1 (öldürme XP'si profile).
- *Kabul:* Konuk XP'si yalnız host olaylarıyla artar. Sonlu kümeler tekrar edilemez. Yerel sayaç sahteciliği altın üretmez.

**Adım 11 — Balıkçılık ve sınırlı beyanlar (E-4; B-05'in balık yolu)** (2 gün)
- *Dosyalar ve fonksiyonlar:* `fishing.js` saf fonksiyonlar; `hostOps.fish`, `feat:shark`, `feat:see`; `seagear.js` ağ ve zıpkın; `fish.js` köpekbalığı.
- *Test:* `06g` balık (oltasız `catch`; ısırmadan 0,5 sn sonra `catch`; ısırma olmadan `catch`; saatlik tavanın aşılması; 1e12 değerli balık); `14_deniz_ekipmani` (tek oyunculu); R5.
- *Kabul:* Balık verisi yalnız host'tan gelir. Saatlik tavanlar aşılamaz. Meşru balık tutma ve satma çalışır.

**Adım 12 — Sandık, kese, yüzen nesne, kazı ve harita yetkisi (B-10)** (2,5 gün)
- *Dosyalar ve fonksiyonlar:* `hostOps.chestReq` (durum makinesi, dwell, `cid`), `pickupReq`, `floatReq`, `holdTake`, `dig`; `treasure.activeSites(pid)`, `resolveDig`; `maps` kaldırılır; `events.collectFloatingById`; `_dropPeer` taşıyıcı temizliği.
- *Test:* Node `chest_sm.mjs` (bütün geçişler ve yasak geçişler); `06f` B-10 (4 km'den `chestReq`, `pickupReq`, `floatReq`, `dig`; host'un taşıdığı sandığa `drop`; `carriers:5`); `06j` R4, R16; `06d`.
- *Kabul:* Menzil dışı istekler reddedilir. Başkasının taşıdığı sandık değişmez. Haritasız kazı sandık çıkarmaz. Kopma temizliği tamamlanır.

**Adım 13 — Dünya durumları: tehlike, ada nitelikleri, hikâye, diriltme (B-11, B-12, B-14, E-1, E-2, E-9, N-5, N-6)** (3,5 gün)
- *Dosyalar ve fonksiyonlar:* `hazards.js` (`applyFromHost`, `requestFrom`, `syncRemoteSets`); `islands.js` (`templeOrder`, `featAnchors` (K-8), nitelik eylemleri `feat`, `netState/applyNet`); `details.js`; `seagear.js` batık sandığı; `hostOps.feat`, `hazard`, `story`, `revive`; `quests.js` geçiş tablosu ve host'ta tetikleyiciler; `net.js` `worldPart.feats`, `featSt`.
- *Test:* Node `temple_order.mjs`, `feat_anchors.mjs`; `06f` B-11 (`ignite f=0.01`, eski `solve`, 100 m'den fıçı, blok ışınlama), B-12 (art arda 5 `story`; uzaktan `tuzla`; bayrak sahteciliği), B-14 (yaralı olmayan host'a 20 Hz `revive`; uzaktan; dwell'siz); E-1/E-2 (ada sandığı yeniden katılımda yeniden açılamaz); E-9 (Kemik Adası'nda boss yalnız host'ta doğar); `06j` R10, R14.
- *Kabul:* Uzaktan fıçı, bulmaca, hikâye ve diriltme etkisizdir. Ada sandığı bir kez açılır ve herkes için açık görünür. `stage ≤ STORY.length − 1`.

**Adım 14 — Yakın dövüş host'ta (B-07, F-04)** (3 gün)
- *Dosyalar ve fonksiyonlar:* `hostCombat.js` (`cs`, `act{atk}`, zamanlanmış vuruş, vekil, hasar gözlemcisi, gürültü); `combat.js` (`_meleeHit(opts)`, `weaponBase`, online konukta `_attack` niyeti); `enemies/animals/megafauna/bosses` konuk dalları; `hurtEnemy/hurtAnimal/hurtMarine/hurtBoss` ve `netHurtBossApply` silinir.
- *Test:* Node `combat_fsm.mjs` (120 `atk`/sn → kabul sayısı; kombo; dayanıklılık; DPS ≤ 95,1 × 1,10); `06h` B-07 (120 `atk`/sn; parry'siz `counter`; kılıçsız ağır saldırı; Kraken derin evre; görüş hattı arkasından vuruş; eski türler); F-04 yeniden üretme adımları; `06j` R1; tek oyunculu `04_karakter`, `05_dusman_ai`, `16_kosu_poz_ganimet`. Gecikme ölçümüyle `LAG_REWIND` kararı verilir.
- *Kabul:* Değiştirilmiş konuğun hasar/sn değeri ≤ 95,1 × hedef çarpanı × 1,10. Blok host'ta zarla çözülür. Meşru kombo ve ağır saldırı çalışır.

**Adım 15 — Menzilli saldırı, parry, kaçınma ve gölge can (B-07'nin tamamı, N-10)** (3 gün)
- *Dosyalar ve fonksiyonlar:* `hostCombat.js` (`shoot`, `reload`, `throw`, `parry`, `dodge`, `onEnemyHit`, gölge can, yaralanma, yeniden doğma); `player.js` (`_parry`, kaçınma, `applyHostHp`); `enemies._players`, `_hitPlayer`; `combat.js` patlama; `stunEnemy` silinir.
- *Test:* `06h` mühimmat (mermisiz atış; dolum sırasında atış; duvar arkasından kökenli atış), parry seli (`guard` / `parry` sahteciliği), god-mode (`p.hp = 1e9`) ve `st{down:true}` gizlenmesi (N-10); `06j` R2, R3, R9.
- *Kabul:* Mermisiz atış yapılamaz. Parry yalnız kayıtlı düşman vuruşunda oluşur. `down:true` beyanı konuğu AI'dan saklamaz. Gölge can 0 olunca konuğun niyetleri reddedilir.

**Adım 16 — Konukta h2c doğrulamanın tamamlanması ve tek HTML CSP (B-18'in tamamı, N-7)** (1,5 gün)
- *Dosyalar ve fonksiyonlar:* `net.js` `_clientData` (§10.3 tablosunun tamamı), `applySnap` bölüm başına; bozuk veri sayacı; `tools/build-single-html.mjs` CSP özetleri; gerekiyorsa saf JS HMAC yedeği.
- *Test:* `06i` tamamı (`gold:-1e9`, `xp:'1e9'`, kötü `inv`, NaN `teleport`, 10⁶ elemanlı `snap`, `cannon{i:99}`, `story.flags.__proto__`); `02_tek_dosya`.
- *Kabul:* Kötü host betik çalıştıramaz ve konuğu çökertemez. Konuğun `dksh.solo.*`, `dksh.guest.0` ve `dksh.profile` kayıtları bayt bayt aynı kalır.

**Adım 17 — Kabul takımı, temizlik ve belgeler** (3 gün)
- *Dosyalar:* `06n_kabul_kotu_konuk` (§12.4), `06j_mesru_oyun` (+ `--latency 120`); geçiş şemalarının ve geçiş önlemlerinin kaldırılması; `docs/v05/PROTOKOL.md` şemadan üretilir; güven modeli belgesi; tam regresyon; 06c kararsızlığının ayrıca not edilmesi.
- *Kabul:* §12.4'ün altı ölçütü sağlanır. Bütün senaryolar yeşildir. Belgeler günceldir.

### 11.4 Tahmini büyüklük

| Kalem | Satır / gün |
|---|---|
| Yeni modüller (9) | ≈ 4 230 |
| Değişen ~32 dosyada ekleme / silme | ≈ +2 300 / −950 |
| Testler: 9 yeni co-op senaryosu (`06e`–`06n`), 12 Node testi, harness, `06a`–`06d` uyarlamaları | ≈ 2 400 |
| **Toplam ekleme** | **≈ 8 900 satır** (≈ 6 500 üretim kodu + 2 400 test) |
| **Süre** | Adım toplamı ≈ **46 iş günü**; risk payıyla 42–55 (tek geliştirici). İlk 5 adım (0–4) ≈ 10 gün; Adım 6'nın sonunda (≈ 15,5 gün) B-05 dışındaki kritik bulgular kalıcı ya da geçici olarak kapanır; Adım 9'un sonunda (≈ 25,5 gün) ekonomi, Adım 15'in sonunda (≈ 41 gün) savaş tamamlanır. |

---

## 12. Test planı

### 12.1 Altyapı

- **İki ayrı tarayıcı oturumu:** `coop.cjs` bugün her oyuncu için ayrı `browser.newContext()` açıyor (`coop.cjs:31-33`); her bağlamın localStorage'ı ayrıdır. `--split` her oyuncuyu ayrı bir Chromium sürecinde başlatır: ayrı süreç, ayrı profil, gerçek WebRTC bağlantısı. Güvenlik senaryoları `--split` ile koşar.
- **Değiştirilmiş istemci (`evil.cjs`):**
  - `raw(page, obj | string | bytes)`: `DK.net.hostConn.dataChannel.send(...)` ile istemcinin bütün doğrulamalarını atlar. Bozuk JSON, büyük ileti, yanlış tür, geri giden `q` ve eski türler bu yolla sınanır.
  - `rawQ(page, t, alanlar)`: İstemcinin kendi `q` sayacını kullanır. Şema kapısından geçen ama kurala aykırı iletiler (yetki, menzil, durum) sınanır; meşru iletilerin sırası bozulmaz.
  - `burst(page, m, n)`: Sel.
  - `patch(page)`: Yerel değerleri bozar: `inv.gold = 1e9`, `inv.add('kraliyet_taci', 50)`, `progress.level = 30`, `G.mods.melee = 100`, `G.godMode = true`, `p.pos.set(…)`.
- **Host gözlemcisi** `DK.netTest.invariants()` şunları döndürür: host altını, XP'si ve seviyesi; host envanter özeti (karma); her konuk profilinin altını, XP'si, envanter özeti ve `ledger.check()` sonucu; boss ve düşman canları; gemi durumu (`typeId`, `upg`, `hp`, ambar özeti, `cannonballs`, `planks`, `cannonHp.length`, `sailTarget`); `net.snapT`; keselerin ve sandıkların durumu; `renderer.info.memory.geometries`; her konuğun ihlal puanı. `DK.netTest.audit()` kabul ve ret sayaçlarını tür türüne verir.
- **Test kancaları:** `DK.netTest` yalnız `?test=1` iken ve yalnız host'ta yüklenir; yayın derlemesine girmez. Kancalar: `teleportGuest`, `grantItem` (deftere `adjust` kaydıyla), `breakShip` (B-09), `advanceClock`.
- **Gecikme:** `--latency <ms>` konuk tarafında `send`'i geciktirir.
- **Eski sürüm:** `git worktree add <geçici dizin> 44d548c` ile alınan v0.4 kopyası ikinci bir statik sunucudan (örneğin 8081) sunulur ve `--url2` ile açılır.

### 12.2 Bulgu başına saldırı testleri (B-01…B-21)

Dosyalar: `06e_kotu_konuk_oturum` (B-15, B-16, B-17, B-20, B-21, şema), `06f_kotu_konuk_dunya` (B-01…B-04, B-09…B-14; 3 oyuncu, diğer konuğa yansıma dahil), `06g_kotu_konuk_ekonomi` (B-05, B-06, B-08, B-19, `tx` tekrarı, XP, balık), `06h_kotu_konuk_savas` (B-07), `06i_kotu_ev_sahibi` (B-18, N-1…N-3, N-7, E-8), `06m_surum_el_sikisma` (B-16). **Her testin ortak ölçütü:** host'ta `snapT` son 10 sn'de artmıştır, host ve diğer konukta sayfa hatası 0'dır, `invariants()` farkı yalnız beklenen alanlardadır.

| Bulgu | Saldırı (değiştirilmiş konuk) | Beklenen sonuç | Adım |
|---|---|---|---|
| B-01 | `raw` `{t:'shipFull', ship:{id, typeId}}`; `replace:true` ile brigantin; `hp:1e9`. `rawQ` ile limandan uzakta ve altın yetersizken `tx{svc, upgrade}`. | Adım 1: çökme yok. Adım 5'ten sonra tür bilinmez: 5 puan ve düşürme. `G.ship.upg` nesne olarak kalır; `typeId`, `hp`, ambar ve altın değişmez. `svc` → `uzak` / `altin`. | 1, 5, 9 |
| B-02 | `cannonFix i:4294967294`; `sails v:'abc'`; `addBalls n:200`; tahtasız `repair`; limandan `anchor`/`bail`; saniyede 120 `mastFix` | Şema ya da dizin reddi; `cannonHp.length` değişmez; `sailTarget ∈ [0,1]`; stok değişmez; tahta yokken delik kapanmaz; uzaktan çapa ve kova reddedilir; geometri sayacı artmaz | 1, 5 |
| B-03 | Eski biçim `boat{cmd:'driver', who}`; uzaktan `boat{enter}`; sürücüyken `rp` alanı olmayan `boatSt`; 100 m ışınlanma; host kayıktayken `dock` | Şema reddi; `enter` → `uzak`; `snapT` artar; konum kırpılır ve sürücüye `fix` gider; `dock` reddedilir | 1, 5 |
| B-04 | `st{x:'a'}`, `p:[NaN]`, `eq:{}`, `eq:'kk:x'` (100 Hz); 0,07 sn'de 15 m; 2 KB `st`; ardından 300 m'deki düşmana saldırı | Şema reddi; `r.auth` sonlu kalır; ışınlanma `fix` alır; büyük ve sık iletiler düşer; uzaktaki saldırı hasar vermez | 4, 6 |
| B-05 | 40 sahte efsanevi sandıklı eski `hold`; 10 × 999 `lootReq`; `hold{put}` ile profilde olmayan `sid`; yanlış `cid` ile `holdTake` | Adım 4'te bütçe; Adım 8'den sonra eski türler düşer, olmayan `sid` ve yanlış `cid` reddedilir. Host ambarı, keseleri, altını ve defteri değişmez. | 4, 8 |
| B-06 | Balık rengi ya da adı `"/><img src=x onerror=…>` (v0.4'te `lootReq`; v0.5'te `importReq`/`fish{spear, key:'<img…'}`); host ve 3. oyuncu envanteri, ipucunu ve ambarı açar | Şema reddi ya da veri yeniden kurulur; DOM'da `img[onerror]` yok; `document.title` değişmez | 2, 8 |
| B-07 | Saniyede 120 `atk`; parry'siz `counter`; 9 km'den boss'a `shoot`; eski `hurtBoss{tentacle}` ve `hurtEnemy`; kılıç yokken `heavy`; mermisiz `shoot` | Hasar/sn ≤ 95,1 × hedef çarpanı × 1,10 (Adım 4–13 arasında ≤ 300); `counter` → `light`; uzaktan atış hasar vermez; eski türler düşer; Kraken derin evrede hasar almaz; yumruk hasarı; atış yok | 4, 14, 15 |
| B-08 | 300 × `gold{amount:5000}`; aynı `x` ile iki `tx{sell}`; olmayan eşya; 100 m uzak tüccar; kapalı dükkân; iki konuktan aynı anda `sellHold`; dakikada 60 000'i aşan satış | `gold` etkisiz (Adım 4); aynı `x` aynı `txr`'yi döndürür ve altın bir kez artar; `yok`, `uzak`, `kapali`, `butce`; `sellHold` yalnız bir ödeme üretir; host altını yalnız kendi payı kadar artar | 4, 9 |
| B-09 | `breakShip` (`upg = undefined`); kayıkta `rowPhase = 'x'` | Gemi onarılır ya da karantinaya alınır; `snapT` artar; `pressedSet` her karede temizlenir | 1 |
| B-10 | 4 km'den `chestReq{open}`, `pickupReq`, `floatReq`, `dig`; haritasız `dig`; host'un taşıdığı sandığa `drop`/`stow`; eski `chestState{carriers:5}` | `uzak` / `notCarrier` / şema reddi; taşıyıcı listesi değişmez; kopma temizliği tamamlanır | 1, 12 |
| B-11 | Eski `hazard{ignite, f:0.01}` ve `{a:'solve'}`; 100 m'den `hazard{ignite}`; `push` ile bloğu 10 m ışınlama | Fıçı patlamaz; `solved` değişmez; blok adımı kırpılır | 13 |
| B-12 | Eski `story{stage:1…5}`; uzaktan `story{ev:'tuzla'}`; aşama 0'da `gunluk` | Şema reddi; koşulsuz aşama ilerlemez; `stage ≤ STORY.length − 1`; bayraklar değişmez | 13 |
| B-13 | İskeleden `lock{helm}` + `helm`; düşman gemisi kilidi; iki kilit; host dümeni devralır; batık gemide `lock` | Kilit alınamaz ve dümen hareket etmez; beyaz liste dışı reddedilir; konuk başına tek kilit; devralmada `station{release}`; batık gemide `sunk` | 5 |
| B-14 | Yaralı olmayan host'a 20 Hz `revive`; uzaktan `revive`; dwell'siz `revive` | Hiçbiri etki etmez; host'un canı ve eylemi değişmez | 13 |
| B-15 | İki `hello`; 1000 × 70 KB `ping`; 5000 karakterlik HTML ad; 6 yanlış şifre | İkinci `hello` bağlantıyı kapatır; büyük `ping` ayrıştırılmadan düşer; `pong` saniyede ≤ 1; ad ≤ 20 karakter ve temiz; şifre hatasında bağlantı kapanır, 5 denemeden sonra oda 60 sn kilitlenir | 3 |
| B-16 | v0.4 konuk → v0.5 oda; v0.5 konuk → v0.4 oda; herkese açık liste | İki yönde de açık ileti; uyumsuz oda gri ve Katıl kapalı | 3 |
| B-17 | 15 sn × saniyede 500 ileti; ardından yeniden bağlanma; host arayüzünden [At] | ≤ 10 sn'de `kick{code:'protocol'}` ve kapanma; `reject{code:'banned'}`; elle atma çalışır | 4 |
| B-18 | (06i) Host'tan konuğa `xp{r:'<img…>'}`, `gold{g:-1e9}`, `xp{d:'1e9'}`, kötü `inv`, HTML'li `sleep.day` ve `kick.why`, NaN `teleport`, 10⁶ elemanlı `snap`, `cannon{i:99}`, `story.flags.__proto__` | DOM'a etiket enjekte edilmez; değerler reddedilir; konuk sayfası hatasız çalışır; `dksh.solo.*`, `dksh.guest.0`, `dksh.profile` bayt bayt aynı kalır | 2, 16 |
| B-19 | `patch` ile `inv.gold = 1e9`, `inv.add('kraliyet_taci', 50)`, `progress.level = 30`, `G.mods.melee = 100`; ardından `item{drop}`, `tx{sell}`, `act{atk}` | Profilde olmayan eşya bırakılamaz ve satılamaz; hasar profildeki yeteneklerle hesaplanır; bir sonraki `inv`/`prof` yerel değerleri ezer; defter tutarlı kalır | 7–10, 14 |
| B-20 | `raw` `act{a:'shoot', from:'<başka konuk>'}` | 3. oyuncuda `act.from === gönderen` | 4 |
| B-21 | Saniyede 120 `downed`, `marker` ve `chat`; eski `inter`, `prog`, `noise{radius:80}` | Eski ve ölü türler düşer (5 puan); `marker` ve `chat` saniyede 1; bildirim 5 sn'de en çok 1 | 4 |

### 12.3 Ek bulgu testleri

| ID | Test | Adım |
|---|---|---|
| Y-1 | Konuk ham DataChannel'a 16 KB'lık `st` yazar → host roster'ı ve diğer konukların `snap` alımı sürer; 600 kese ve işaretli dünyada geç katılım çalışır | 1, 3 |
| Y-2 | Bozuk bayt dizisi → host'ta 10 puan, sayfa hatası 0 | 3 |
| Y-3 | Yumrukla aynı vuruş tek oyunculuda ve host'ta aynı hasarı verir | 14 |
| N-1 | Eski `shipFull{name:'<img…>', water:'0%"><img…>'}` (şema reddi); `06i`'de host `snap` gemisine dize `water` koyar | 2, 16 |
| N-2 | Herkese açık oda `reject{why:'<img onerror…>'}` döner (Hızlı katıl) → metin olarak görünür | 2 |
| N-3 | Host `sleep{day:'<b>x</b>'}` → şema reddi | 2, 16 |
| N-4 | `info{code:'ABCDEF'}` döndüren yuva → liste `code`'u `PUB<i>` olarak tutar | 2 |
| N-5, E-1, E-2 | Konuk ada sandığını açar, ayrılıp yeniden katılır, tekrar dener → "Sandık boş"; profil yalnız bir kez değişir; host aynı sandığı açamaz; bulmaca ve batık sandığı için de aynı denetim | 13 |
| N-6 | `templeOrder` belirlenimcidir (Node) ve iki farklı yükleme sırasında aynıdır | 13 |
| N-7 | Host `cannon{i:99}` → konukta şema reddi, istisna yok | 16 |
| N-8 | Ambardan balık alındığında diğer oyuncuların ambar görüntüsü güncellenir | 8 |
| N-9 | Geçersiz `tier`'lı ambar sandığı → şema reddi; ambar paneli ve satış hatasız | 8 |
| N-10 | Konuk `st{down:true}` bildirir → gölge can dolu olduğu için düşmanlar hedeflemeye devam eder | 15 |
| N-11 | `st{eq:'kk:...'}` → şema reddi | 6 |
| E-3 | Konuğun yerel görev sayacı sahteciliği (`quests.side[0].progress = 99`) altın üretmez | 10 |
| E-4 | Oltasız `catch`, ısırmadan 0,5 sn sonra `catch` → ret | 11 |
| E-5 | Zarın sonucunu host belirler; NPC kesesi biterse `why:'kese'` | 9 |
| E-7 | Konuktaki `treasure.chests[*].contents` tanımsızdır | 8 |
| E-8 | Host'tan gelen `story.flags` içindeki `__proto__` konuktaki `quests.flags`'ın prototipini değiştirmez | 2 |
| E-9 | Konuk aşama 3'te Kemik Adası'na gider → boss yalnız host'ta doğar | 13 |

### 12.4 Bileşik kabul testi: "60 saniyelik kötü konuk" (`06n`)

`--split` ile 3 oyuncu (host, kötü konuk, dürüst konuk) koşar. Kötü konuk §12.2'deki bütün saldırıları 60 sn boyunca karışık ve azami hızda gönderir: `raw` ve `rawQ` iletileri ile `patch` ile yerel bozmaları. Atma eşiği bu test için `DK.netTest` ile kapatılır. Başta ve sonda `invariants()` alınır. **Ölçütler:**

1. Host altını, XP'si ve envanter özeti değişmez; değişiyorsa yalnız host'un kendi meşru olayları kadar değişir.
2. Kötü konuğun profilinde altın, XP ve envanter yalnız host'un kabul ettiği meşru niyetlerle değişir; bu niyetlerin üst sınırı meşru oyunun hızıdır.
3. Kötü konuk uzaktaysa boss ve düşman canı değişmez. Yakındaysa can düşüşü ≤ §5.12 üst sınırı × süre × 1,10'dur.
4. Her profil için `ledger.check()` true döner.
5. `snapT ≥ 15 × 55`. Host'ta ve dürüst konukta sayfa hatası 0'dır; dürüst konuk oynamayı sürdürür.
6. Atma eşiği açıkken aynı saldırıda kötü konuk ≤ 10 sn'de atılır.

Bu test kullanıcının kabul ölçütünü doğrudan karşılar: değiştirilmiş konuk istemcisi, iki ayrı tarayıcı oturumunda ve değiştirilmiş mesajlarla, sınırsız altın, XP/rütbe, hasar ya da ganimet üretemez.

### 12.5 Meşru oynanış regresyonu (`06j_mesru_oyun`; `--split`, ayrıca `--latency 120`)

| No | Senaryo | Beklenen |
|---|---|---|
| R1 | Konuk kılıçla haydudu 1→2→3 kombo ve ağır vuruşla öldürür | Ölüm `by = konuk`; XP konuğun profiline; ganimet host'ta doğar; konukta isabet ve `hit` gelir |
| R2 | Konuk tabancayı doldurur ve ateş eder | Mermi profilden 1 düşer; dolum bitince yeniden ateş edebilir |
| R3 | Konuk düşman saldırısını parry edip karşı saldırı yapar | Düşman 1,7 sn sersemler; karşı saldırı kabul edilir; gölge can düşmez |
| R4 | Konuk sandık bulur, taşır, ambara koyar; limanda ambarı satar | Profil artar; host payını alır; `txr ok`; hikâye 1→2 (`marti_1` ise) |
| R5 | Konuk balık tutar ve Balıkçı Yusuf'a satar | Tür ve ağırlık host'tan gelir; fiyat `sellPrice` ile tutarlı |
| R6 | Konuk Rıza'dan ekmek alır ve yer | Altın düşer, ekmek eklenir; yemek gölge canı artırır |
| R7 | Konuk dümene geçer, gemiyi sürer, topla ateş eder; host devralır | Kilit, dümen ve ateş çalışır; devralmada konuk istasyondan çıkar |
| R8 | Konuk kayığı indirir, biner, sürer, iner; host kayığı askıya çeker | Bütün geçişler kabul edilir; yük ambara gider |
| R9 | Konuk yaralanır; host onu kaldırır | Konuk 45 canla kalkar |
| R10 | Konuk Tuzla ile konuşur, ilk haritayı alır, günlüğü bulur | Hikâye aşamaları ilerler; harita ve günlük konuğun profiline gider |
| R11 | Konuk ayrılıp yeniden katılır (aynı tarayıcı) | Aynı `gid` ve profil; roster'da çift kayıt yok (06c D4-06'nın yeni hali) |
| R12 | Host kaydeder, oyunu kapatıp yeniden açar | `gbook` ile `worldId` eşleşir; profil korunur |
| R13 | v0.4 online kaydı (`worldId` ve `gbook` yok) v0.5 host'ta açılır | Dünya açılır; yeni konuk ithalat ayarıyla girer |
| R14 | Konuk ada tutsağını kurtarır, tapınak bulmacasını çözer, kabuk toplar | Ödüller profile gider; `featSt` host'ta ve diğer konukta aynıdır |
| R15 | Konuk silah sesi çıkarır (F-13'ün yeni hali) | Host'un düşmanı uyarılır |
| R16 | 3 oyuncu: iki konuk aynı ambar sandığını aynı anda almaya çalışır | Biri alır; diğeri `cid` uyuşmazlığıyla reddedilir |
| R17 | Konuk kazı yapar (harita kendi profilinde) | Sandık çıkar; harita düşer |
| R18 | Yürüme, koşma, yüzme, tırmanma, iskeleden biniş, bordalama | İyi ağda dakikada ≤ 2, `--latency 120` ile dakikada ≤ 5 düzeltme |

`06a`, `06a2`, `06b`, `06c` ve `06d` uyarlamalarla yeşil kalır. Kaldırılan türlerin eski beklentileri değişir. Örneğin 06a'daki "Altın bütçesi: ≤ 20 000 işlenir" kontrolü "0 işlenir" olur; "Yakından sahte 99999 hasar kırpılır" kontrolü "eski tür düşer, hasar yok" olur.

### 12.6 Node birim, bulanık ve özellik testleri (`tests/node/`)

| Dosya | İçerik |
|---|---|
| `net_schema.mjs` | Her C2H/H2C türü için geçerli ve geçersiz örnekler (NaN, Infinity, dize, nesne, `__proto__`, fazla alan, büyük dizi). Şema imzası ↔ `PROTO`. |
| `net_fuzz.mjs` | Saplanmış `G`, `treasure`, `enemies`, gemi ve kayıkla `_onRaw`'a 100 000 rastgele ileti (şemaya yakın ve uzak). İstisna, NaN durum ve dizi büyümesi olmamalı. Denetimin `sim*.mjs` yaklaşımı kalıcı teste dönüşür. |
| `bucket.mjs` | Jeton kovasının dolumu ve patlaması; sabit pencere açığının olmadığı |
| `wire_parts.mjs` | `worldPart` bölme ve birleştirme; parça ≤ 16 000 bayt |
| `move_validator.mjs` | Yapay yörüngeler: yürüme, koşu, yüzme kabul; ışınlanma, uçma ve duvar ret; kip geçişleri; saat hızlandırma etkisiz |
| `combat_fsm.mjs` | `cs` durum makinesi: 120 `atk`/sn → kabul sayısı; kombo; dayanıklılık; §5.12 hasar/sn; parry penceresi |
| `econ_tx.mjs` | `sellPrice`/`buyPrice`/`earnShared` (yuvarlama); idempotans; atomiklik (ret durumunda hiçbir alan değişmez); `GOLD_MAX`; al-sat döngüsünün olmaması; devre kesici |
| `chest_sm.mjs` | Sandık durum makinesinin bütün geçişleri ve yasak geçişler |
| `ledger.mjs` | Defter değişmezi; halka tampon |
| `hmac.mjs` | WebCrypto ve saf JS yedeği aynı sonucu verir; aktarma senaryosu (`hid` uyuşmazlığı) reddedilir |
| `xss_sinks.mjs` | `iconSVG`, `tipNode`, `_xpPop` şablonu, gemi paneli şablonu: kötü girdide `<` ve `"` kaçışlanır |
| `temple_order.mjs`, `feat_anchors.mjs`, `ship_sanitize.mjs`, `inventory_sanitize.mjs` | Belirlenimcilik ve sınırlar |

### 12.7 Tek oyunculu regresyon

00–17 senaryoları ve `tests/node/archipelago_sabit.mjs` değişmeden geçmelidir. Özellikle: `04_karakter`, `05_dusman_ai`, `07_ekonomi`, `08_kalicilik`, `12_kayit_dongusu`, `14_deniz_ekipmani`, `16_kosu_poz_ganimet`. `08_kalicilik` ayrıca v0.4 tek oyunculu ve online kayıtlarını yükler; alan sayıları ve değerler aynı kalmalı, `sid` ve `b` tek oyunculu kayda yazılmamalıdır. `09_performans`'ta tek oyunculu çizim çağrısı ve kare süresi değişmemelidir. 3 konuklu oturumda host'un ek maliyeti (`net.update`, kapı, `hostCombat`, `moveAuth`, mantık kümeleri) kare başına ≤ 1,5 ms olmalıdır. **[BELİRSİZ]** Bu değer ölçülecek.

### 12.8 Test zamanlaması (hakem notu)

- `tick()` (`coop.cjs:58`) her sayfada `DK.sim(0.2)` çalıştırır ve ardından yalnız 40 ms bekler. Konuk tik başına 3 `st` üretir. Hızlı makinede bu, gerçek zamanda saniyede 50'ye kadar `st` demektir.
- **Kural 1:** Oran kovaları gerçek zamanı, oyun kuralları host benzetim saatini kullanır (P6). Hareket bütçesi benzetim saatiyle aktığı için `DK.sim` ile tutarlıdır.
- **Kural 2:** Harness'e "gerçek zaman ≥ 0,5 × benzetim zamanı" koruması eklenir: `tick` bekleme süresini buna göre uzatır. `st` kovası 30/sn (patlama 45) olduğundan meşru test akışı düşmez.
- **Kural 3:** Oran sınırı testleri `DK.sim` kullanmaz; gerçek zamanla `waitForTimeout` kullanır.
- **[BELİRSİZ]** Co-op testlerinin süresi yaklaşık 1,5–2 katına çıkabilir; Adım 0'da ölçülür.

---

## 13. Riskler, geriye uyumluluk, belirsizlikler ve kararlar

### 13.1 Kayıt uyumluluğu ("kayıt formatı bozulmamalı")

| Kayıt | v0.5'te | v0.4'e dönülürse |
|---|---|---|
| Tek oyunculu `dksh.solo.N` | Değişmez; `sid`/`b` yazılmaz; `gold` erişimcisi aynı alan adıyla yazar | Sorunsuz |
| Online host `dksh.online.N` | Üst düzeye isteğe bağlı `worldId` eklenir; `version` aynı kalır; `save.valid` değişmez | v0.4 `worldId`'yi yok sayar ve kaydederken düşürür; v0.5 kimliği `dksh.gslot.N`'den geri bulur |
| Konuk defteri `dksh.gbook.<worldId>` (yeni) | Ayrı anahtar; `.bak` yedekli; yazım sırası dünya → defter | v0.4 dokunmaz; v0.5'e dönünce yeniden kullanılır |
| Eski konuk kaydı `dksh.guest.0`, `dksh.progress.guest` | **Yalnız okunur** (ithalat kaynağı) | v0.4 kullanmaya devam eder; ilerleme kaybolmaz |
| `dksh.wtok.*`, `dksh.wcache.*`, `dksh.gslot.*` (yeni) | Eklenir | v0.4 yok sayar |
| `dksh.profile` | Değişmez | — |
| `Inventory.load` süzgeci | Bozuk yığınlar düşer ve günlüğe yazılır; geçerli yığınlar korunur; NaN veya eksi altın 0 olur | — |

Faz 4 (kayıt sürümü) ile eşgüdüm gerekir: `worldId`, `gbook` ve `gslot` sürüm ve göç şemasına eklenir. Bu tasarım yalnız isteğe bağlı alan ve anahtar eklediği için sürüm numarası gerektirmez.

### 13.2 Tek oyunculu kip

- Yeni kodun hepsi `G.online && G.isHost` (host işleyicileri) ya da `G.online && !G.isHost` (konuk dalları) koşuluna bağlıdır. Tek oyunculuda `G.online === false` olduğu için hiçbiri çalışmaz.
- Paylaşılan fonksiyonlara eklenen parametrelerin varsayılanı bugünkü davranışı verir: `_meleeHit(…, opts)`, `sellPrice(…, mods, bonus)`, `fireCannon(…, mods)`. Saf çekirdekler (`applyXp`, `econ.plan*`) yerel yol için bugünkü sonucu üretir.
- Tek oyunculu davranışı değiştirebilecek ortak değişiklikler şunlardır:
  - `Inventory` sınırları (yalnız geçersiz değerlerde etkili).
  - `templeOrder` (çözülmemiş tapınaklarda kol sırası değişebilir; ipucu levhası aynı fonksiyonu okuduğu için oyun tutarlı kalır).
  - K-8 kabul edilirse ada sandıklarının ve hücrelerinin konumu.
  - Yumruk tabanının tekleştirilmesi (Y-3; 8 ya da 9 → tek değer).
  
  Hata yalıtımı tek oyunculuda da çalışır; bu bir iyileştirmedir.
- **Azaltma:** Davranışı değiştirmeyen yeniden düzenlemeler ayrı commit'lerde yapılır. Node birim testleri yazılır. 04/05/07/16 senaryoları koşulur. İsteğe bağlı olarak aynı `DK.sim` tohumuyla, yeniden düzenleme öncesi ve sonrası "altın, XP, can" izi karşılaştırılır.

### 13.3 Oynanış hissi ve gecikme

| Risk | Azaltma |
|---|---|
| Konuğun vuruş sonucu RTT/2 + `hitAt` sonra gelir | Animasyon, ses, kıvılcım ve isabet işareti yerelde tahmin edilir; `blocked` gelirse kılıç geri seker |
| Konuk tarafındaki blok ile host'un blok çıkarımı uyuşmaz | Blok penceresi +0,15 sn + rtt/2; gölge can düzeltmesi ancak 2 sn boyunca 15'i aşan farkta gelir |
| Hareket düzeltmesi ("lastik etkisi") | Kırpma ve yakalama; `fix` yalnız 8 m'yi 1 sn aşan ya da 30 m'yi aşan sapmada gönderilir; sayaçlar ölçülür (§12.5 R18) |
| İşlemler yanıt bekler | "İşleniyor…"; 5 sn zaman aşımı ve tek yeniden deneme; idempotans |
| İstasyon ve kayık onayı | İyimser geçiş; red gelirse geri alınır |
| Dal içinde geçici işlev kayıpları (K-7) | Yalnız geliştirme dalında; yayın son adımdan sonra |

### 13.4 Performans

Host'un ek işleri: ileti başına şema doğrulaması (mikrosaniyeler), konuk başına 15 Hz hareket doğrulaması (`lineBlocked` birkaç mikrosaniye), konuk vuruşları (yerel vuruşla aynı maliyet), uzaktaki adalarda tehlike mantık kümeleri (ada başına birkaç nesne), profil eşitlemesi (saniyede en çok 5 × ≤ 10 KB). `raw` serileştirme bugünkü `approxBytes` yeniden JSON'lamasından (`net.js:47`) ucuzdur. Hedef: 3 konuklu oturumda kare başına ≤ 1,5 ms (§12.7). AOI (konuk çevresinde ada kurmak) yapılmadığı için A'nın en büyük performans riski yoktur.

### 13.5 Davranış değişiklikleri (kullanıcıya duyurulmalı)

1. Konuk ilerlemesi artık **dünya başınadır**. Konuk yerel kaydıyla başka bir dünyaya "zengin" gelemez; eski kayıt yalnız host ayarına bağlı, tavanlı ithalatla taşınır (K-1). Anahtarını kaybeden konuğun profilini host yeniden bağlayabilir.
2. Konuk gemi satın alamaz, geminin görünümünü değiştiremez ve batan gemiyi kurtaramaz. Onarım ve geliştirmeyi kendi altınıyla yaptırabilir (K-6).
3. Ada sandıkları, sunaklar, tutsaklar ve bulmaca sandıkları paylaşımlıdır: biri açınca herkes için açılmış olur. Bugün konuk her oturumda yeniden açabiliyor.
4. Balık türünü host seçer; konuğun ekranındaki sürü ile yakalanan tür her zaman örtüşmeyebilir.
5. Konuğun canı host'ta gölge olarak tutulur; yerel ölümsüzlük işe yaramaz.
6. Başlangıç ve ithalat eşyaları profile bağlıdır: yere bırakılamaz, ambara konamaz, satış geliri paylaşılmaz.
7. Protokol değiştiği için v0.3/v0.4 ile v0.5 aynı odada oynayamaz; iki yönde de açık ileti gösterilir.

### 13.6 Uygulama riskleri

| Risk | Azaltma |
|---|---|
| Paylaşılan kodun yeniden düzenlenmesi (combat, treasure, shop, progress) | Saf çekirdek + varsayılan parametre; davranışı değiştirmeyen ayrı commit'ler; her adımda tam regresyon |
| Dal içinde geçici işlev kaybı (Adım 4–15) | Her adımda listelenir (K-7); yayın Adım 17'den sonra; canlı dallar (v0.3, v0.4) değişmez |
| PeerJS `raw` serileştirme ve tarayıcı farkları | Parçalar ≤ 16 000 bayt; Adım 3'te Chromium'da ölçülür; Firefox'ta da denenmelidir **[BELİRSİZ]** |
| `crypto.subtle` ve `file://` | Adım 0'da ölçülür; gerekiyorsa saf JS yedeği (birim testli) **[BELİRSİZ]** |
| Hareket sabitleri yanlış ayarlanırsa meşru oyuncu düzeltme yer | Bütün sabitler tek yerde (Ek B); düzeltme ve ret sayaçları `audit()`'te; 06l ve 06j gecikmeli koşu |
| Test süresinin uzaması | Gerçek zaman oranı yalnız gereken senaryolarda; oran testleri ayrı |
| 06c dört oyunculu testin bilinen kararsızlığı | Sonuçlar ayrı raporlanır; katılmanın yeniden denenmesi Faz 5'te |

### 13.7 Kalan (önlenemeyen ya da sınırlanan) riskler

| Risk | Sınır | Neden kalır |
|---|---|---|
| Host hilesi | Kendi dünyasıyla sınırlı (§1.5) | P2P mimarinin doğası **[SUNUCU]** S3 ile kapanır |
| Sınırlı beyanlar (balık mücadelesi, köpekbalığı, zıpkınla balık, yeni canlı) | Meşru üst hız ve saatlik tavanlar (§4.16) | Olaylar host'ta gözlemlenemez |
| Nişan desteği, tabanca sapmasının kaldırılması, parry botu | Hasar, menzil ve görüş hattı host'ta; parry yalnız gerçek vuruşta | Kurallara uyan insanüstü girdi ayırt edilemez |
| Gölge dayanıklılık ve blok | Yaklaşık; yalnız hayatta kalmayı etkiler | Blok yerel girdidir |
| Görüş hattı (host'ta kurulmamış adalar) | Arazi ve tehlike kümeleriyle sınırlı | Ada yapılarının çarpıştırıcıları host'ta yok; AOI pahalı |
| Ada niteliklerinde kaba yakınlık (K-8 reddedilirse) | ≤ 60 m; nitelik başına dünyada bir kez | RNG akışı |
| İthalatla değer taşıma | Kimlik başına ≈ 400 altın, kayıplı; saatte 6 yeni profil | Kimlik doğrulama yok **[SUNUCU]** |
| Sinyal sunucusunun araya girmesi | DTLS parmak izi uçtan uca doğrulanmaz | **[SUNUCU]** kendi sinyal sunucusu ya da imzalı el sıkışma |
| Herkese açık yuva gaspı | Anahtar ağda gitmez; HMAC'te `hid` bağı var | Yuva kimlikleri tahmin edilebilir **[SUNUCU]** lobi sunucusu |
| IP görünürlüğü | — | **[SUNUCU]** TURN (S1) |
| Konuğun kendine verdiği hasarı bildirmemesi | Yalnız kendi aleyhine | Düşme ve boğulma konukta hesaplanır |
| Host anahtarlarının dışa aktarılan kayıtta bulunması | Yalnız o dünya için | Uyarı gösterilir |

### 13.8 BELİRSİZ kalan konular (ölçüm ya da karar gerektirir)

| # | Konu | Nasıl kapanır | Adım |
|---|---|---|---|
| U-1 | Y-1'in pratik tetiklenme eşikleri (`snap`, `world` ve `welcome` boyutları) | Tarayıcıda ölçüm; kod yolu doğrulandı | 0 |
| U-2 | `file://` tek HTML'de `crypto.subtle` | Ölçüm; yoksa saf JS HMAC | 0, 7, 16 |
| U-3 | `raw` kanalda Chromium dışı tarayıcıların `max-message-size` değeri | Parça boyu 16 000; Firefox denemesi | 3 |
| U-4 | Hareket sabitleri (VMAX, TOL, SLACK, duvar denetimi) ve yanlış pozitif oranı | 06l, 06j (`--latency 120`); sayaçlar | 6 |
| U-5 | Gölge can ile yerel can uyuşmazlığının sıklığı | `hp` düzeltme sayacı | 15 |
| U-6 | Gecikme telafisinin (`LAG_REWIND`) gerekip gerekmediği | `--latency 120` ile isabet oranı ölçümü | 14 |
| U-7 | Ada limanı tüccarları için kaba (≤ 60 m) denetim | K-8 yöntemi ada limanlarına da uygulanabilir | 9, 13 |
| U-8 | Kesin ada çapası (K-8) ve bunun mevcut dünyalardaki görsel etkisi | Kullanıcı kararı | 13 |
| U-9 | Host'un 3 konukla ek kare maliyeti | `09_performans` + co-op profil ölçümü | 6, 14, 17 |
| U-10 | Co-op test süresinin uzaması (gerçek zaman oranı) | Adım 0 ölçümü | 0 |
| U-11 | Zıpkınla balık ve köpekbalığı tavanlarının oyun dengesine uygunluğu | Oyun testi; sabitler Ek B'de | 11 |
| U-12 | 06c kararsızlığının bu değişikliklerle etkileşimi | Ayrı raporlama | 17 |

### 13.9 SUNUCU gerektiren konular (bu tasarımla çözülmez)

| # | İhtiyaç | Gerekli seçenek (§1.6) |
|---|---|---|
| S-1 | Host'un kendi dünyasında hile yapmasını (altın, XP, ganimet, konuk profilini şişirme) önlemek | S3 (başsız yetkili sunucu); S2 yalnız ödülleri bütçeler |
| S-2 | Dünyalar arası taşınabilir ve hile korumalı konuk ilerlemesi, lider tablosu | S2 |
| S-3 | Sybil'i (yeni kimlikle başlangıç seti, ithalat) tam önlemek | Hesap ya da kimlik ile S2 |
| S-4 | IP gizliliği | S1 (TURN) |
| S-5 | Sinyal sunucusunun araya girmesine karşı uçtan uca kimlik | Kendi sinyal sunucusu ya da imzalı el sıkışma (S1/S2) |
| S-6 | Herkese açık oda yuvası gaspını önlemek | Lobi ve eşleştirme sunucusu (S2) |
| S-7 | Bot ve otomasyon tespiti | Sunucu tarafı telemetri (S2/S3); kısmi |

### 13.10 Karar noktaları (kullanıcı onayı)

| No | Karar | Önerilen varsayılan | Seçenekler |
|---|---|---|---|
| K-1 | Konuk ilerlemesinin dünya başına olması ve ithalat politikası | "Sınırlı" (altın ≤ 500; teçhizat ve sarf bağlı; seviye ≤ 10) | "Her seferinde sor"; "Hep temiz" |
| K-2 | Profil sınırları | 16 profil; saatte 6 yeni (sonrası host onayıyla) | Ayarlanabilir |
| K-3 | Konukta zar | Zarı host atar (`tx{svc, dice}`) | Konukta kapalı |
| K-4 | Hikâye, gemi ele geçirme ve batırma XP'si | Bugünkü gibi yalnız host'a | Tayfayla paylaşım |
| K-5 | Tek HTML'de CSP | Derleme aracında özetlerle | CSP'siz bırakıp belgelemek |
| K-6 | Konuğun gemi satın alması, görünüm değiştirmesi, batan gemiyi kurtarması | Kapalı (yalnız host) | Host onay penceresiyle açmak |
| K-7 | Dal içi geçici işlev kayıpları (Adım 4–15) | Uygula; yayın Adım 17'den sonra | Bütçeli eski yolları ilgili adıma kadar sürdürmek |
| K-8 | Ada sandığı ve tutsak hücresi etkileşim noktalarının ayrı tohuma alınması (kesin çapa) | Uygula (5.3a için gerekli) | Kaba ≤ 60 m'de kalmak (U-8) |
| K-9 | Gecikme telafisi (geri sarma) | Varsayılan kapalı; ölçüme göre | Açık |
| K-10 | Herkese açık oda uyarı metni | "Oda sahibi bu dünyanın tek yetkilisidir…" | — |

---

## Ek A. Gereksinim izlenebilirlik matrisi

| Gereksinim | Karşılayan bölüm | Adım | Test |
|---|---|---|---|
| 5.1a Konuk doğrudan altın gönderemez | §3.1 #28, §4.18, §4.7 | 4, 9 | B-08 |
| 5.1b Yalnız onaylanacak işlem talebi | §4.7 (`tx` → `txr`) | 9 | R4–R6 |
| 5.1c Satış host'ta gerçekleşir ve doğrulanır | §4.7, §4.10 | 9 | 06g |
| 5.1d Satılan ürün gerçekten oyuncuda | §4.1, §4.5 (`sid`), §4.7 | 7, 9 | B-19, B-08 (`yok`) |
| 5.1e Ürün sayısı, değer, tüccar, satış fiyatı, işlem zamanı | §4.7, §4.8 | 9 | B-08, `econ_tx` |
| 5.1f Aynı satış iki kez işlenmez | §2.8, §4.7, §4.10 | 9 | B-08 (aynı `x`, eşzamanlı `sellHold`) |
| 5.1g Altın negatif, sonsuz, NaN ya da sınır dışı olamaz | §4.12, §10.3 | 7 | `inventory_sanitize`, B-18 |
| 5.1h İşlem kimliği ve tekrar koruması | §2.8 | 9 | B-08, `econ_tx` |
| 5.1i Paylaşılan geliri host hesaplar | §4.9 | 9 | R4 |
| 5.1j Konuklara giden altın host'un hesabıdır | §4.9, §10.3 | 9 | R4, B-18 |
| 5.2a `hurtEnemy`, `hurtBoss`, `hurtAnimal`, `hurtMarine`, `stunEnemy` yeniden tasarımı | §3.1 #8–12, §5.2, §5.14 | 4, 14, 15 | B-07 |
| 5.2b Hasar miktarını konuk belirleyemez | §5.4, §5.8 | 14 | B-07 |
| 5.2c Saldıranın kimliği | §5.1 | 14 | R1 |
| 5.2d Oyuncunun konumu | §8 (`posOf`) | 6 | B-04, B-07 |
| 5.2e Hedefin konumu | §5.4, §5.9 | 14 | B-07 |
| 5.2f Gerçek saldırı mesafesi | §5.4, §5.11 | 14 | B-07, `combat_fsm` |
| 5.2g Silah türü | §5.3 (1–2) | 14 | B-07 (kılıçsız ağır saldırı) |
| 5.2h Saldırı animasyonunun geçerli anı | §5.3 (6) `hitAt` | 14 | `combat_fsm` |
| 5.2i Bekleme süresi | §5.3 (3, 7) | 14 | B-07 |
| 5.2j Saldırı hızı ve kombo sınırları | §5.3 (4), §5.12 | 14 | B-07 (hasar/sn) |
| 5.2k Mühimmat | §5.5, §5.7 | 15 | B-07 (mermisiz), R2 |
| 5.2l Hasar çarpanları | §5.8 | 14 | `combat_fsm` |
| 5.2m Boss zayıf noktaları | §5.9 | 14 | B-07 (Kraken) |
| 5.2n Engellenmiş ve parry edilmiş saldırılar | §5.10 | 14, 15 | R3, F-04 |
| 5.2o Hasar host'un savaş kurallarıyla | §5.13 | 14 | Bütün savaş testleri |
| 5.3a Yakınlık: `chestReq`, `pickupReq`, `chestState`, `chestGone`, `dig`, `hazard`, `shipFull`, `hold`, `marker` | §6.1–6.7, §6.11, §7.5 | 5, 8, 12, 13 | B-10, B-11, B-05, B-01, B-21 |
| 5.3b Aynı sandık iki kişiye verilemez | §6.2, §2.8 | 12 | R16, `chest_sm` |
| 5.3c Toplanan ganimet tekrar oluşturulamaz | P4, §6.4, §6.8 | 8, 12, 13 | B-05, N-5 |
| 5.3d Başkasının taşıdığı nesne uzaktan değiştirilemez | §6.2 | 12 | B-10 |
| 5.3e Bulmaca çözümleri ve çevre durumları yalnız yetkili işlemle | §6.7, §6.8 | 13 | B-11, R14 |
| 5.4a Oyuncu dümende mi | §7.2, §7.3 | 5 | B-13 |
| 5.4b Top başında mı | §7.2, §7.3 | 5 | B-13 |
| 5.4c Gemiyle etkileşim mesafesi | §7.1, §7.4, §7.6 | 5 | B-02, B-13 |
| 5.4d Top kullanılabilir mi | §7.3 (`canFire`, top canı) | 5 | B-02 |
| 5.4e Mühimmat var mı | §7.3, §7.4 | 5 | B-02 |
| 5.4f Gemi batmış mı | §7.8 | 5 | B-13 (batık gemi) |
| 5.4g Komut doğru sırada mı | §7.2, §2.8 | 5 | B-13 |
| 5.4h Kayığı kullanan gerçekten sürücü mü | §7.6 | 5 | B-03 |
| 5.4i Konum ve hız fizik sınırlarında mı | §7.6, §8.3 | 5, 6 | B-03, B-04 |
| 5.4 "Host doğrulamadan hiçbir istemci verisi dünya durumunu değiştiremez" | P1–P3, §3.1 | 4–15 | `net_fuzz`, 06n |
| 5.5a Şema doğrulaması | §2.5 | 4 | `net_schema` |
| 5.5b Tür ve veri tipi | §2.5 | 4 | `net_schema` |
| 5.5c Sonlu sayı | §2.5, §8.6 | 4, 6 | B-04 |
| 5.5d Min/max | §2.5, §3 | 4 | `net_fuzz` |
| 5.5e Paket boyutu | §2.4 (ayrıştırmadan önce) | 3 | B-15, B-04, Y-1 |
| 5.5f Mesaj sıklığı | §2.6 | 4 | B-17, B-21 |
| 5.5g Oyuncu yetkisi | §3.1, §6.2, §7.2 | 5, 12 | B-10, B-13 |
| 5.5h Oyun sürümü | §2.1 (bağlantı özniteliği + şema) | 3 | 06m |
| 5.5i Tekrar mesajı engelleme | §2.8 | 4, 9 | B-08, `net_schema` |
| 5.5j Hatalı bağlantıyı güvenli sonlandırma | §2.7, §10.1 | 4 | B-17 |
| **Kabul:** sınırsız altın, XP/rütbe, hasar, ganimet üretilemez | §4, §5, §6 | 4–15 | §12.4 (06n) |
| **Kabul:** iki ayrı tarayıcı oturumu ve değiştirilmiş istemci mesajları | §12.1 (`--split`, `evil.cjs`) | 0 | 06e–06n |
| **Not:** host hilesinin sınırı ve sunucu seçenekleri | §1.5, §1.6, §13.9 | — | 06i (konuk koruması) |
| **Önemli gerçeklik:** konuk envanteri, altını ve XP'si yerelde | §4.1–4.6, §4.14, §4.17, §10.4 | 7, 8, 10 | B-19, 06k |
| **Önemli gerçeklik:** kayıt formatı bozulmamalı, eski kayıtlar açılmalı | §4.2, §13.1 | 7 | 08_kalicilik, 12_kayit_dongusu, R13 |

## Ek B. Sabitler (tek yerde tanımlanır: `schema.js`, `guard.js`, `moveAuth.js`, `hostCombat.js`, `econ.js`)

| Sabit | Değer | Bölüm |
|---|---|---|
| `NS`, `PROTO`, `PROTO_MIN`, `BUILD` | `dksh-v1`, 2, 2, `0.5.0` | §2.1 |
| Ham c2h üst sınırı (`HARD_MAX`) | 32 768 bayt; tür başına daha düşük (`st` 768, `act` 320, `tx` 2 048, `hello` 4 096, `importReq` 16 384) | §2.4 |
| h2c parça / toplam | ≤ 16 000 bayt / ≤ 512 KB; `snap` ≤ 64 KB | §2.4 |
| Bağlantı toplamları | Saniyede 60 ileti (patlama 90); saniyede 48 KB (patlama 64 KB) | §2.6 |
| Sınıf kovaları | `state`/`drive` 30/45; `combat` 8/10; `interact` 6/12; `ship` 6/10; `tx` 4/8; `social` 1/4; `session` 1/3; `lobby` 0,5/2 | §2.6 |
| Zaman aşımları | `hello` 5 sn; yükleme 60 sn; sessizlik 15 sn | §2.3 |
| Şifre | Bağlantı başına 1 deneme; odada 60 sn'de 5 hata → 60 sn kilit | §2.1 |
| `info` yoklaması | Peer başına 10 sn'de 3; toplamda 10 sn'de 20 | §2.1 |
| İhlal puanı | Azalma saniyede 2; uyarı 40; atma 100; oran ve hareket puanı saniyede en çok 10 | §2.7 |
| `x` | Sonuç önbelleği 32; boşluk sınırı 1 000 | §2.8 |
| Yarıçap toleransı `TOL` | 0,8 m (istasyonlarda gemi yerel koordinatında +0,8) | §6.1, §7.1 |
| Dwell | Gereken süre ≥ 0,85 × eylem süresi; r.auth geçmişi 3 sn | §2.10 |
| Hareket | `VMAX` 7,0 (yorgun 4,4) / 5,5 (yüzme) / 7,0 (güverte, yerel) / tırmanma 3 dikey; `TOL` × 1,25; `SLACK` 1,0 m; `BUDGET_CAP` 1,0 sn; geri itme +9 m/sn × 0,6 sn; dikey yukarı ≤ 9·dt + 1,5; uçma 2,5 m / 3 sn; `fix`: 8 m × 1 sn ya da > 30 m; saniyede ≤ 2 `fix` | §8.3–8.5 |
| Savaş | Menzil +0,6 m; yay +0,25 rad; zaman −0,10 sn; yaw kırpması ±1,2 rad; hedef başına 0,2 sn; parry penceresi 0,24 + ≤ 0,15 sn; blok penceresi [t − 0,25, t + 0,15 + rtt/2]; gölge can düzeltmesi > 15 × 2 sn; gözlemci × 1,10 | §5 |
| Geçiş savaş tavanları (Adım 4–13) | Yakın 97, mermi 93, zıpkın 60; konuk-hedef başına 0,35 sn; `hurtBoss` ≤ 12 / 80 m; `stunEnemy` 3 sn'de 1 | §5.14 |
| Ekonomi | `GOLD_MAX` 10⁹; devre kesici konuk başına dakikada 60 000; beklenen fiyat toleransı %5; NPC yakınlığı 3 + 1 m; ada limanı ≤ 60 m (kaba) | §4 |
| Geçiş ganimet bütçesi (Adım 4–7) | Konuk başına dakikada 1 500 altın değerinde | §4.18 |
| Profil | Dünya başına 16 profil; saatte 6 yeni; defter halkası 200; ithalat: altın 500, seviye 10, kategori ve kimlik başına tavanlar | §4.2, §4.4 |
| Balık | Atış aralığı ≥ 3 sn; yakalama penceresi ısırmadan sonra [1,5; 60] sn; ağ 4 sn; zıpkın `max(reload, 4)` sn; saatlik tavanlar nadir 6, epik 2, efsanevi 1; köpekbalığı 180 sn | §4.16 |
| Diriltme | ≤ 3,3 m; dwell 0,85 × 2,5 sn; hedef yaralı | §6.10 |
| Kilit | Konuk başına 1; istasyondan 3 m uzaklaşınca bırakılır | §7.2 |
| Kayık | Hız ≤ 6,5 m/sn × dt + 1,5; dünya sınırı `WORLD_HALF − 250`; karada değil | §7.6 |
