# Test Raporu — Aşama 2 (Görsel İyileştirmeler, Hava Olayları, Zaman Çizelgesi, Fizik)

Test ortamı: başsız Chromium (Playwright) + yazılımsal WebGL (SwiftShader), Linux. Online testler iki ayrı tarayıcı
bağlamı ve yerel PeerJS sinyal sunucusuyla yapıldı. Testler oyunun kendi kodunu `window.DK` hata ayıklama kancalarıyla
ileri sararak çalıştırır; ekran görüntüleriyle görsel kontrol yapıldı. Tüm test koşularında konsol hatası: **0**.

## 1. Bu aşamada tamamlanan özellikler
| Alan | İçerik | Durum |
|---|---|---|
| Son işleme | HDR → bloom → günün saatine/havaya göre renk düzenleme + vinyet → ACES → FXAA/4×MSAA; Efekt kalitesi ayarı | Tamam |
| Su ve kıyı | Sığ sularda hareketli kostik desenler, eğime duyarlı kıyı köpüğü, gelgit çizgisinde ıslak kum, yağmurda ıslanan zemin, yağmur halkaları | Tamam |
| Dünya ayrıntıları | Mercan, yosun, deniz kabuğu/yıldızı, toplanabilir kabuk ve istiridye (inci), 17 deniz kaya sütunu, martı sürüleri, şelale, balıkçı tekneleri, dümen suyu ve pruva serpintisi | Tamam |
| Dinamik hava | 8 hava türü, Markov zinciriyle kendiliğinden değişim, 3'lü hava tahmini, rüzgâr cepheleri, 3B bulutlar, yıldırım çarpması, gökkuşağı, su hortumu, sis bulutları | Tamam |
| Zaman çizelgesi | Gün sayacı, gelgit (12,42 sa / ±0,55 m), günlük program, dönemsel olaylar (ticaret gemisi, pazar günü, korsan şenliği), HUD zaman şeridi, Defter'de Zaman Çizelgesi sekmesi, macera günlüğü, dükkân saatleri, NPC günlük rutini, handa uyuma | Tamam |
| Fizik | 8 noktalı gemi kaldırma kuvveti, kütleye bağlı yalpa/vurma, rüzgârla yatma, omurga direnci, çapa zinciri, limanda halatla bağlanma, kaya/gemi çarpışmaları, kürek darbeli kayık, rijit cisimler (sandık, yüzen nesneler), patlama itkisi, karakter itişmesi ve geri tepme, güvertede kayma, gülle hava direnci | Tamam |
| Karakter ve eşya | Kenar ışığı, sırmalı/tüylü şapkalar, kavisli pala, pirinç kakmalı tabanca, 40+ yeniden çizilmiş eşya simgesi, dürbün (Z) | Tamam |
| Harita | Suluboya dünya haritası, yumuşak keşif sisi, yer simgeleri, mini harita, eskitilmiş hazine haritası | Tamam |
| Online | Gün/saat/hava/tahmin/ıslaklık/su hortumu eşitleme; uyuma yayını; ticaret gemisi her iki tarafta yerel ve kararlı | Tamam |

## 2. Otomatik testle doğrulanan mekanikler (bu aşama)
- Açılış ve menü: dünya + deniz haritası + gölgelendirici ön derlemesi ~4 sn'de hazır; 0 hata.
- **Zaman şeridi:** gün, saat, hava simgesi, gelgit yönü/seviyesi; önümüzdeki 12 saatin olayları, tahmin ve gelgit simgeleri; "Şu an / Sıradaki" satırı.
- **Defter → Zaman Çizelgesi:** bugünün programı (geçmiş/etkin/gelecek), 7 günlük takvim, hava tahmini kartları, gelgit tablosu, dükkân saatleri, macera günlüğü.
- **Handa uyuma:** saat 21:30'dan 06:00'ya geçildi, gün 1→2, can doldu, 20 altın düşüldü, günlükte kaydı var, ekran karartma çalıştı; hava tahmini yeni zamana göre yeniden kuruldu.
- **Dükkân saatleri:** gece 22:11'de Tüccar Rıza "Dükkân kapalı, 06:00'da açarım" dedi.
- **NPC rutini:** 22:00 sonrası 6 tüccar hanın önüne yürüdü (Sedef Hanım 24:00'e kadar açık kaldı); sabah açılış saatine göre sırayla dükkânlarına döndüler.
- **Ticaret gemisi:** ticaret gününde 10:00'da ufukta belirdi, 11:00'da yanaştı; Halil Reis ile konuşuldu, %15 indirimle "Baharat Kesesi" alındı (68 altın); satış fiyatlarına +%15 uygulandı.
- **Pazar günü:** dükkânda "+%20" bandı göründü ve satış fiyatına yansıdı.
- **Gelgit kazısı:** yüksek suda (+0,55 m) "Kum şu an su altında… alçak su ~07:46" uyarısı; alçak suda (−0,55 m) aynı noktada Denizci Sandığı çıktı.
- **Balık akını / hayalet saatleri:** 06:12'de `fishFrenzy`, 01:30'da `ghostHours` etkin.
- **Hava:** fırtına → yıldırım gemiye 10 hasar verdi; su hortumu oluştu ve gemiyi etkiledi; sağanak → parçalı geçişinde gökkuşağı belirdi (opaklık 0,24); hava tahmini sırası zamanla tüketildi ve yenisi eklendi.
- **Gemi fiziği:** demir alındı, yelkenler açıldı, 28 sn'de ~215 m yol (8,6 m/s), yalpa −0,08 rad / vurma 0,02 rad; kaya sütununa 6 m/s çarpış: gövde kayaya girmedi, darbe hasarı ve "kaya" çarpışma olayı; gemi-gemi çarpışmasında iki gemi de geri itildi ve hasar aldı.
- **Limanda demirli gemi:** sert rüzgârda 20 sn sonra iskele noktasından sapma < 1 m, yön sapması 0.
- **Kayık:** 6 sn kürekte 3,8 m/s.
- **Rijit cisimler:** 6 m yükseklikten bırakılan sandık zemine tam oturdu ve uyudu; denize bırakılan sandık yüzdü ("water" durumu); patlama itkisi sandığı savurdu.
- **Karakter itişmesi:** aynı noktada doğan 3 düşman ≥0,9 m aralıkla ayrıldı.
- **Yakın dövüş:** iskelet 3 vuruşta öldü, ganimet düştü.
- **Dürbün:** Z ile açıldı, kamera baş hizasına geçti, "Kırlangıç Adası · 279 m" hedef tanımlaması yapıldı.
- **Harita:** suluboya dünya haritası, mini harita (kamera yönü yukarıda, kuzey işareti, hedef yıldızı, gemi), hazine haritası.
- **Kaydet/yükle:** gün (2), macera günlüğü, hava (bulutlu) ve ıslaklık (0,4) geri geldi.
- **Hikâye regresyonu:** Tuzla → harita → Martı Adacığı'nda kazı → sandık taşıma → ambar → Sedef Hanım'a satış → 2. aşama (yeniden doğrulandı).
- **Önceki testler:** yüzme/dalış/oksijen, top ateşleme, mağara, kaydet-yükle, ölüm-yeniden doğma, arayüz ekranları (oluşturucu, ayarlar, oda kurma, dükkân, envanter, harita, defter, tersane) yeniden koşturuldu.
- **Online co-op:** şifreli oda + katılım; oda sahibinin ayarladığı gün 4 / 10:16 / sağanak / tahmin / ıslaklık konukta aynen göründü; su hortumu konuk tarafında aynı konumda belirdi; ticaret gemisi iki tarafta da "yanaşmış" durumda ve ağ anlık görüntüsü tarafından silinmedi; konuğun uyuma isteği reddedildi, oda sahibi uyuyunca konukta gün 5 / 06:00 ve karartma ekranı göründü.

## 3. Bu aşamada bulunan hatalar
1. Zaman ileri atlayınca (uyuma/yükleme) hava tahmini ara durumları tek tek oynatıp bildirim yağdırıyordu.
2. Kumsallarda çok düz alanlar su çizgisine denk geldiğinde arazi köpüğü geniş beyaz lekeler oluşturuyordu.
3. Okyanus kıyı köpüğü düz ve sığ kumsallarda çok geniş bir bandı kaplıyordu.
4. Karakter kenar ışığı gece fazla güçlüydü (neon mavi görünüm).
5. Deniz feneri hüzmesi düz, katı bir koni gibi görünüyordu.
6. Dürbün açıkken etkileşim istemi ve gemi paneli görüş alanında kalıyordu.
7. Kayık gemi gövdesine yakınken her karede hızı sıfırlanıyordu (ileri gidemiyordu).
8. Çapadaki gemi rüzgârla salınıp iskelenin içine girebiliyordu.
9. Yüzen sandık dalga tepesinde anlık "karada" durumuna geçebiliyordu.
10. Güverteden karaya ışınlanan oyuncu eski zemin yüksekliği yüzünden "yüksekten düştün" hasarı alabiliyordu.
11. Envanter hücreleri panel yüksekliğine uzayıp çok uzun görünüyordu.
12. Timsah Lagünü tabanında okyanus mercanlarının renkli lekeleri görünüyordu.
13. 960 px genişlikte zaman paneli pusula şeridinin üstüne biniyordu.
14. Yazılımsal GPU'da çok örnekli HDR hedeflerle ekran görüntüsü alınırken tarayıcı çöküyordu.

## 4. Düzeltilen hatalar
14 hatanın tamamı düzeltildi: tahmin zaman atlamasında yeniden kuruluyor; arazi köpüğü kaldırıldı ve okyanus köpüğü arazi
eğimine göre kıyıya yatay uzaklıkla hesaplanıyor; gece kenar ışığı azaltıldı; fener hüzmesi uca doğru sönümlenen toplamalı
gölgelendiriciye geçti; dürbünde HUD öğeleri gizleniyor; kayıkta yalnızca gövdeye doğru hız bileşeni sönümleniyor; limanda
demirli gemi halatla yerinde ve iskeleye paralel tutuluyor; yüzme durumu derin su kontrolüyle kararlı; gemiden inişte düşme
yüksekliği sıfırlanıyor; envanter ızgarası üstten hizalı; lagün tabanı çamurlu renkte; dar ekranlarda HUD küçülüyor;
yazılımsal çizicide (SwiftShader/llvmpipe) son işleme otomatik olarak FXAA moduna düşüyor.

## 5. Kalan sorunlar / bilinen sınırlamalar
- Test ortamı yazılımsal GPU olduğu için 10–15 FPS ölçüldü; gerçek ekran kartında çok daha yüksek olması beklenir. Düşük
  donanımda Ayarlar → Efekt kalitesi "Düşük" son işlemeyi tamamen kapatır.
- Yazılımsal GPU'da uzun karelerde tarayıcının GPU bekçisi devreye girebiliyor (yalnızca test ortamına özgü; testler
  `--disable-gpu-watchdog` ile koşturuldu).
- Ticaret gemisi betikle hareket eder (fiziksel değil); çarpışmalarda sonsuz kütleli kabul edilir.
- Gelgit görseli tüm denizde aynıdır (bölgesel akıntı yok); şelale görsel bir şerittir (su akışı fiziği yok).
- Aşama 1'deki sınırlamalar (TURN sunucusu yok, host aktarımı yok, şartnamenin tam sürüm hedeflerinin bir kısmı) geçerli.

## 6. Performans durumu
- Açılış: dünya üretimi + harita çizimi + gölgelendirici ön derlemesi ~4 sn (yazılımsal GPU).
- Oyun mantığı karesi 1,4–2,9 ms; çizim sayısı ~690 (son işleme kapalıyken ölçüldü); bellek kararlı (25 sn seyirde artış yok).
- Mercan, yosun, kabuk, martı ve bulutlar `InstancedMesh`; dümen suyu şeritleri tek geometride güncellenir.
- Dünya haritası 1000×1000 tuvale bir kez çizilip önbelleğe alınır; mini harita 30 Hz'de bu tuvalden döndürülerek çizilir.

## 7. Sonraki aşamanın hedefleri
1. Masaüstü (Windows exe) paketi: Electron ile paketleme, tam ekran, dosyaya kayıt.
2. Yeni bölgeler (Volkanik Adalar, Hayalet Adalar genişletmesi), Altın İskele ve Kara Fener limanları.
3. Hikâye 6–10. aşamalar, Kraken ve Lanetli Amiral, Hayalet Gemi.
4. Hava olaylarının oynanışa daha derin etkisi (sis içinde kaybolma, fırtınada direk kırılması), mevsimler.
5. Online: TURN desteği, oda sahibi aktarımı.

---

# Test Raporu — Aşama 1 (İlk Oynanabilir Sürüm / MVP) — arşiv

Test ortamı: başsız Chromium (Playwright) + yazılımsal WebGL (SwiftShader), Linux.
Online testler: iki ayrı tarayıcı bağlamı + yerel PeerJS sinyal sunucusu.
Testler oyunun kendi kodunu çalıştırır (`window.DK` hata ayıklama kancaları ile simülasyon ileri sarılır),
ekran görüntüleriyle görsel kontrol yapılmıştır. Tüm otomatik test koşularında konsol hatası: **0**.

## 1. Tamamlanan özellikler
| Alan | Durum |
|---|---|
| Korsan temalı ana menü (11 buton) ve alt ekranlar | Tamam |
| Korsan oluşturma (3B önizleme, 25+ seçenek, kilitli kozmetikler) | Tamam |
| Ayarlar (görüntü, ses, kontroller + tuş atama, diğer) | Tamam |
| Korsan Defteri (hikâye, görevler, adalar, hazineler, canlılar, balıklar, başarımlar, istatistik) | Tamam |
| Dünya: 6 ada, liman kasabası, mağara, batık, okyanus, gün-gece, 6 hava durumu | Tamam |
| Karakter hareketi, yüzme/dalış/oksijen, güverte, merdiven, sandık taşıma | Tamam |
| Sloop + Brigantine, dümen/yelken/çapa/top/onarım/su boşaltma/batma, kayık | Tamam |
| 8 kara canlısı, 12 balık türü, köpekbalığı, manta, kaplumbağa, yunus | Tamam |
| Balıkçılık mini oyunu + koleksiyon defteri | Tamam |
| Hazine haritası → ipucu → kazı → sandık → ambar → satış döngüsü | Tamam |
| Liman ekonomisi (7 tüccar + han + görev panosu + tersane) | Tamam |
| Savaş (pala/tabanca/top), 7 düşman tipi + 2 boss + düşman gemisi | Tamam |
| Hikâye aşama 1–5, yan görevler, başarımlar, rastgele olaylar | Tamam |
| Online co-op (oda kur/katıl/açık oda listesi/şifre/lobi/sohbet/senkron) | Tamam (ayrıntı aşağıda) |
| Kayıt sistemi (3+3 yuva, otomatik kayıt, yedekli yazma, dışa/içe aktarma) | Tamam |

## 2. Çalışan mekanikler (otomatik testle doğrulanan)
- Yeni oyun başlatma, HUD, görev takibi, keşif bildirimleri.
- Tuzla ile konuşma → hikâye 1. aşama; Haritacı'dan harita → Martı Adacığı'nda kürekle kazı → küçük sandık çıktı →
  sandık taşındı → gemi ambarına kondu → Sedef Hanım'a satıldı (+160 altın) → hikâye 2. aşama.
- Gemiye binme (iskeleden), çapa kaldırma, dümene geçme, yelken açma: gemi ~9 m/s seyretti, dönüş ve karaya oturma hasarı çalıştı.
- Yüzme → dalış (7,6 m), oksijen azalması, su altı görünümü.
- Top kullanma ve ateşleme (gülle sayısı azaldı, balistik + sıçrama).
- Kılıç savaşı: iskelet 3 vuruşta öldü (yumuşak hedef kilidi ile), iskeletin oyuncuya hasar vermesi.
- Gece Kemik Adası: iskeletler + hayaletler doğdu.
- İskelet Kaptan Morvan doğdu ve yenildi → harita parçası 1/4, hikâye 4. aşama.
- Kızıl Hançer doğdu, %50 canda haydut çağırdı, yenildi → harita parçası 2/4, büyük sandık, hikâye 5. aşama.
- Düşman korsan gemisi olayı: gemi geldi ve top ateşledi.
- Fırtına: dalga ölçeği 2,4'e çıktı.
- Kaydet → ana menü → kaydı yükle: altın, envanter ve gemi konumu geri geldi.
- Ölüm → "Bayıldın" ekranı → limanda yeniden doğma.
- Online: şifreli oda (yanlış şifre reddedildi), doğru şifreyle katılım, iki oyuncunun birbirini doğru konumda görmesi,
  konuğun dümene geçip çapayı kaldırması ve gemiyi oda sahibinde de hareket ettirmesi, sohbet mesajı, konuğun haritası oda sahibine bildirildi.

## 3. Bulunan hatalar
1. Meshopt ile sıkıştırılmış modellerde (palmiye vb.) matris uygulanınca köşe verisi kırpılıyordu → yapraklar görünmüyordu.
2. `skeleton.pose()` ölçekli Quaternius iskeletinde karakteri dev boyuta getiriyordu.
3. Kemik ölçeklemesi (beden/yüz) animasyon karesinde birikiyordu.
4. Gemi limanda kıyıya dönük demirliydi; ilk kalkışta karaya oturuyordu ve oturduğunda kurtulamıyordu.
5. Dümen ve kayık etkileşim noktaları çakışıyordu (yanlış komut seçiliyordu).
6. Kılıç vuruşları kamera yönüne dönüldüğü için yandaki düşmanı ıskalıyordu.
7. Bir hazine noktası (kir_1) su içindeydi; kazı yapılamıyordu.
8. Konuk dünyaya katılırken dünya verisi oyun başlamadan gelirse hata oluşuyordu.
9. Konuk kazı yaptığında haritası düşmüyordu (tekrar kazı ile sandık çoğaltma riski).
10. Kızıl Hançer ganimetinde harita parçası iki kez veriliyordu.
11. Dükkânda yığınlı eşyaların satış fiyatı ekranda yanlış (çift çarpılmış) görünüyordu (satılan tutar doğruydu).
12. Kapatılan panel aynı tuşla (Tab/M/J/Esc) anında yeniden açılıyordu.
13. Gece sahnesi oynanamayacak kadar karanlıktı; kamp sandıkları mor görünüyordu.
14. 720p ekranda ana menü ve bazı paneller taşıyordu.

## 4. Düzeltilen hatalar
Yukarıdaki 14 hatanın tamamı düzeltildi ve ilgili testler yeniden koşturuldu.

## 5. Kalan sorunlar / bilinen sınırlamalar
- GitHub Pages iş akışı, depo ayarlarında Pages açılana kadar yayın yapmaz (bu ayarı yalnızca depo sahibi açabilir).
- Online mod internet üzerinden PeerJS'in ücretsiz genel sinyal sunucusunu kullanır; bazı sıkı NAT/kurumsal ağlarda
  TURN sunucusu olmadığı için eşler arası bağlantı kurulamayabilir. Oda sahibi ayrılırsa oturum kapanır (host aktarımı yok).
- Konuk oyuncunun envanteri kendi tarayıcısında saklanır (oda sahibinin dünyasında değil).
- Kamera bazı dar yerlerde (direk arkası, ağaç gövdesi) nesnelerin içinden geçebilir.
- Karakter animasyonları Quaternius setinden gelir; zıplama/yüzme/tırmanma/kürek pozları kodla (prosedürel) üretilir,
  sandık taşıma ve kazı hareketi mevcut kliplerin uyarlamasıdır.
- Şartnamenin tam sürüm hedeflerinden (12×12 km dünya, 6 biyomun tamamı, 3 liman şehri, kalyon/hayalet gemi, Kraken ve
  diğer bosslar, donanma/arananlık, müzayede, halat/tırmanma, Steam entegrasyonu) bu aşamada yer almayanlar README'de listelidir.

## 6. Performans durumu
- Dünya üretimi (arazi ızgarası + parçalar + su + bitki örtüsü + liman): yazılımsal GPU'da ~1,7 sn içinde hazır.
- Liman kasabası malzemeye göre birleştirildi (statik toplu çizim); bitki örtüsü `InstancedMesh` ile çizilir.
- Yazılımsal WebGL ile 10–25 FPS ölçüldü; bu donanım hızlandırmasız bir test ortamıdır. Gerçek bir ekran kartında çok daha
  yüksek olması beklenir. Düşük donanım için Ayarlar'da çözünürlük ölçeği, gölge/su/bitki kalitesi ve görüş mesafesi var.
- Uzak hayvan/düşman grupları oyuncu uzaklaşınca kaldırılır; balık sürüleri yalnızca oyuncu çevresinde simüle edilir.

## 7. Sonraki aşamanın hedefleri
1. Masaüstü (Windows exe) paketi: Electron ile paketleme, tam ekran, dosyaya kayıt, Ctrl+W koruması.
2. Yeni bölgeler: Volkanik Adalar ve Hayalet Adalar'ın genişletilmesi, Altın İskele ve Kara Fener limanları.
3. Hikâye 6–10. aşamalar, Kraken ve Lanetli Amiral boss karşılaşmaları, Hayalet Gemi.
4. Daha fazla balık (hedef 20+) ve canlı türü, iguana/kutup ayısı vb.
5. Online: TURN desteği, oda sahibi aktarımı, Steam lobileri (exe sürümünde).
6. Performans: uzak ada LOD'u, gölge kaskadları, mobil olmayan düşük kalite ön ayarı.
