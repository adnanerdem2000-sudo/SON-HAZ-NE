# 1. Mevcut Proje Analiz Raporu (v0.2 → v0.3 başlangıcı)

Ölçümler v0.2 kodu (commit `b2be13e`, yerel yedek etiketi `yedek-v0.2`) üzerinde, başsız Chromium + yazılımsal WebGL
(SwiftShader) ile oyunun kendi hata ayıklama kancalarıyla (`window.DK`) alındı.

## 1.1 Sorular ve cevaplar

| Soru | Cevap (ölçüm) |
|---|---|
| Kaç km² oynanabilir alan var? | Dünya sınırı 2,4 × 2,4 km = **5,76 km²** (gemiyle her yeri gezilebilir). Kara yüzeyi yalnızca **0,345 km²**, sığ su (0–6 m) 0,26 km². Alanın %94'ü açık deniz. |
| Harita hangi parçalardan oluşuyor? | Tek parça yükseklik fonksiyonu (`terrain.heightAt`): ada şekilleri + tümsekler + düzleştirme/çukur düzenlemeleri + mağara yolu. Görsel arazi 160 m'lik 225 karoya bölünmüş, hepsi açılışta bir kerede üretiliyor. Okyanus kamera çevresinde hareket eden tek ızgara, derinlik 512² yükseklik dokusundan okunuyor. |
| Kaç ada var, büyüklükleri? | **6 ada**: Kırlangıç (r 270 m, 58 m yükseklik, liman + mağara), Martı Adacığı (r 82 m), Kemik Adası (r 135 m, hayalet biyomu), Papağan Kayalıkları (r 48 m), İkiz Adacıklar (r 44 m ve 38 m). |
| Deniz-kara geçişleri nasıl çalışıyor? | Aynı yükseklik fonksiyonu hem karayı hem deniz tabanını üretiyor; kıyıda oyuncu yürümeden yüzmeye su derinliğine göre geçiyor. Gelgit (±0,55 m) su seviyesini kaydırıyor. Yükleme ekranı yok. |
| Harita yükleme sistemi | Akış (streaming) yok: tüm arazi, bitki örtüsü ve yapılar açılışta üretiliyor (~4 sn). Bu yaklaşım 2,4 km için yeterli, 10+ km için yetersiz. |
| Gerçekten oynanabilir bölgeler | Kırlangıç Adası'nın tamamı (liman, orman, tepe, lagün, mağara, kamp), Martı Adacığı ve batık, Kemik Adası (harabe/mezarlık), resif ve İkiz Adacıklar çevresi. |
| Yalnızca dekoratif bölgeler | Papağan Kayalıkları ve İkiz Adacıklar'ın içi (hazine/düşman yok, yalnız bitki), açık denizdeki kaya sütunları, uzak deniz. |
| Karakter hareketleri | `player.js`: kinematik karakter + uzaysal karma tabanlı çarpıştırıcılar; yürüme/koşma/sprint/zıplama/düşme/eğilme/yüzme/dalış/merdiven/güverte; ivme yok denecek kadar az (hız doğrudan hedef hıza yaklaşıyor). |
| Animasyon sistemi | three.js `AnimationMixer`; Quaternius "adventurer" modellerinin hazır klipleri (~24 klip) + yüzme/tırmanma/kürek/kazı için kodla üretilmiş pozlar. IK yok, ragdoll yok. |
| Gemi fiziği | `ship.js`: ileri/yanal hız ayrıştırma, rüzgâr verimi, omurga direnci, 8 noktalı kaldırma kuvveti (yay-sönüm), çapa zinciri, kaya/gemi çarpışması, delik başına su alma. Tek "gövde canı" + delikler; bölgesel hasar, direk kırılması, yangın, bordalama yok. |
| Deniz fiziği ve dalgalar | 5 sinüs dalgası (Gerstner benzeri) JS ve GLSL'de aynı formülle; hava durumuna göre ölçek; kıyıda sönümleme. |
| Balık ve hayvan AI | Var: 12 balık türü sürü hareketi (basit), köpekbalığı/manta/kaplumbağa/yunus; 8 kara hayvanı durum makinesi (dolaşma, kaçma, saldırma). |
| Düşman saldırı sistemi | `enemies.js`: 7 tip + 2 boss; durum makinesi (boşta → kovala → saldır), tek tip yakın/menzilli saldırı, gece güçlenmesi. Algı (görüş konisi, ses), koordinasyon, siper, geri çekilme yok. |
| Online senkronizasyon | PeerJS/WebRTC, oda sahibi otoriteli; 15 Hz anlık görüntü (oyuncular, gemiler, düşmanlar, hayvanlar, sandıklar, zaman/hava). |
| Kayıt sistemi yeni içeriği destekler mi? | Evet: sistem başına `saveKey` ile JSON bölümleri; yeni sistemler kendi bölümünü ekleyebilir. Keşif sisi 64×64 sabit — büyük dünya için genişletilmeli. |
| FPS ve bellek | Yazılımsal GPU'da 10–18 FPS; oyun mantığı karesi 1,4–2,9 ms; ~690 çizim çağrısı (son işleme kapalı), 928 geometri, 222 doku, 85 gölgelendirici programı, JS yığını ~81 MB, sahne düğümü ~2 700. `heightAt` ortalama 0,13 µs. |

## 1.2 Özelliklerin sınıflandırması

| Sınıf | Özellikler |
|---|---|
| **1. Tamamlanmış ve sorunsuz** | Ana menü ve 11 düğme, kayıt yuvaları, gün-gece + 8 hava türü + tahmin, zaman çizelgesi/gelgit, hazine haritası → kazı → taşıma → satış döngüsü, liman ekonomisi, balıkçılık mini oyunu, online oda kur/katıl, son işleme. |
| **2. Çalışıyor ama geliştirilmeli** | Karakter modelleri (düz renkli, basit), animasyon seti (az, kombo/blok/kaçınma yok), düşman AI (tek kalıp), gemi hasarı (tek can), dünya haritası (küçük), bitki örtüsü (tek tip), deniz canlıları (az çeşit), olay sistemi (rastgele zamanlayıcı), NPC yaşamı. |
| **3. Eksik** | Biyom çeşitliliği (yalnız tropik + hayalet), büyük ölçekli dünya, şehirler/kaleler/tapınaklar, efsanevi bosslar, silah çeşitliliği, bordalama, çevresel bulmacalar, aktiviteler (yarış, han oyunları), ilerleme ağacı. |
| **4. Hatalı** | Bu aşamanın testlerinde açık kritik hata kalmadı (v0.2 raporunda 14 hata düzeltildi). Bilinen kusurlar: yazılımsal GPU'da uzun karelerde GPU bekçisi; kamera dar alanlarda nesne içinden geçebiliyor. |
| **5. Henüz oluşturulmamış** | Bölgesel yükleme, ragdoll, IK, Kraken/Derinlik Yılanı/Taş Muhafız/Lanetli Amiral/Volkanik Dev, balina/orka/dev kalamar, bölgesel gemi hasarı, gizli korsan pazarı, batık şehir, korsan hapishanesi. |

## 1.3 Görsellerin basit görünmesinin nedenleri
1. Karakterler ve doğa nesneleri düz renkli, dokusuz düşük poligon modeller (Quaternius/Kenney temel kitleri).
2. Tek biyom paleti: her ada aynı kum-yeşil renklerde, aynı 4–5 ağaç modeli.
3. Yakın plan ayrıntı yok: çimen, çiçek, taş/çakıl, sarmaşık, kamp kalıntısı gibi küçük öğeler seyrek.
4. Yapılar az ve tek tip; şehir hayatı (tezgâh, vinç, ağ, tekne) eksik.
5. Animasyonlar az ve kopuk; savaşta tek vuruş klibi.
6. Dünya küçük ve boş: kara oranı %6.

## 1.4 Ücretsiz varlık araştırması (bu oturumun ağ politikasıyla)
| Kaynak | Durum |
|---|---|
| kenney.nl, quaternius.com, Poly Haven, ambientCG, Fab (Unreal), Sketchfab, itch.io, Google Drive, poly.pizza, opengameart.org | **Ortamın ağ politikası tarafından engellendi** (bağlantı reddedildi). |
| npm kayıt defteri | Erişilebilir: `@netforge/asset-library-files` (Quaternius/Kenney CC0 kopyaları, 222 model), `@pmndrs/assets` (CC0 HDRI/normal haritaları). |
| GitHub (herkese açık depolar) | Erişilebilir: **KayKit (Kay Lousberg) CC0 paketleri** — Adventurers (5 karakter, 75 animasyon), Skeletons (4 iskelet, 90+ animasyon), Dungeon Remastered (200+ yapı/eşya), Halloween Bits (mezarlık seti), Medieval Hexagon (kale, kule, han, değirmen, maden binaları), Furniture Bits. |

Fab varlıkları ayrıca hesap girişi ve Unreal biçimi (uasset) gerektirdiğinden bu web oyununa doğrudan aktarılamaz.

## 1.5 Yol haritası (uygulanan sıra)
1. Yedek (etiket `yedek-v0.2`) ve bu rapor.
2. Varlık hattı: KayKit CC0 paketlerinin optimize edilip oyuna eklenmesi.
3. Karakterler: KayKit gövdeleri + hafif oran düzenlemesi + paylaşılan 90+ animasyonluk kütüphane, renk özelleştirme, korsan aksesuarları.
4. Dünya: bölgesel akış (karo yükleme/boşaltma), biyomlar, yeni adalar, limanlar ve özel bölgeler.
5. Düşmanlar/AI/bosslar, savaş derinliği, gemi hasarı/bordalama, ekosistem, etkileşimler.
6. Olaylar, aktiviteler, ilerleme, arayüz.
7. Online, performans, belgeler, kabul testleri.

Mevcut çalışan sistemler silinmeden genişletilir; her aşama ayrı commit olarak dalda saklanır.
