# Test Raporu — Aşama 1 (İlk Oynanabilir Sürüm / MVP)

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
