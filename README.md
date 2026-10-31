# Deniz Korsanları: Son Hazine
### Pirates: The Last Treasure — açık dünya 3B korsan macerası (tek oyunculu + online co-op)

Mavi Kırıklar takımadasında küçük, eski bir sloop ile denize açıl; adaları keşfet, hazine haritalarındaki
ipuçlarını çöz, kürekle kaz, sandıkları gemine taşı, limanda sat; balık tut, vahşi hayvanlarla karşılaş,
iskeletler, hayaletler ve Kızıl Hançer'in korsanlarıyla savaş — ve efsanevi Kaptan Mira Veyl'in **Son Hazine**'sinin peşine düş.

> **Bu sürüm:** İlk oynanabilir sürüm (MVP). Tarayıcıda çalışır, kurulum gerektirmez.
> Masaüstü (exe) paketi bir sonraki adımda hazırlanacak.

## Oynamak için
- **GitHub Pages:** depo ayarlarında *Settings → Pages → Source: GitHub Actions* seçildikten sonra
  `https://<kullanıcı>.github.io/<depo>/` adresinde açılır (iş akışı: `.github/workflows/pages.yml`).
- **Yerel:** depo klasöründe bir statik sunucu başlat, tarayıcıda aç:
  ```bash
  python3 -m http.server 8080
  ```
  sonra `http://localhost:8080` (dosyayı çift tıklayarak açmak çalışmaz; ES modülleri sunucu ister).

Gereken: WebGL2 destekli güncel Chrome / Edge / Firefox. Online mod için internet bağlantısı.

## Kontroller (Ayarlar → Kontroller'den değiştirilebilir)
| Tuş | İşlev |
|---|---|
| W A S D | Hareket |
| Shift | Koşma / sprint |
| Boşluk | Zıplama · suda yukarı yüzme · dümende yelkenleri aç/kapat |
| Ctrl | Eğilme · suda dalış |
| E | Etkileşim (basılı tut: sandık açma, delik onarma, su boşaltma) |
| F | Meşale |
| Q | Haritaya işaret koy |
| Tab | Envanter |
| M | Dünya haritası (sol tık işaret, sağ tık rota) |
| J | Korsan Defteri |
| Sol fare | Saldırı · kazma · olta atma/sarma · top ateşleme |
| Sağ fare | Nişan alma (tabanca) · savunma (pala) |
| R | Tabanca doldurma · olta yemi değiştirme |
| V | Kaçınma (yuvarlanma) |
| G | Taşınan sandığı bırak |
| 1–5 | Pala, tabanca, kürek, olta, hazine haritası |
| C | Pusula şeridi |
| Enter | Sohbet (online) |
| Esc | Duraklat menüsü |

Gemide: dümende **A/D** yön, **W/S** yelken miktarı; çapa için baştaki ırgata, toplar için borda boyundaki toplara git.
Oyun kumandası (standart düzen) desteklenir.

## Bu sürümde neler var
- **Ana menü** (gün batımında seyreden gemi): Devam Et, Oyna, Tek Oyunculu (3 kayıt yuvası), Online, Oda Kur, Odaya Katıl, Korsanım, Korsan Defteri, Ayarlar, Krediler, Çıkış.
- **Korsan oluşturma:** erkek/kadın, boy, vücut tipi, yaş, ten, yüz şekli, burun, çene, göz rengi, yara izleri, yüz izleri, dövmeler, 6 saç modeli, 5 sakal tipi, şapkalar (üç köşeli, kaptan, korsan, bandana), ceket/yelek, kıyafet renkleri, göz bandı, küpe, kolye, eldiven, kemer/kuşak. Bazı kozmetikler Terzi'den altınla açılır (savaş gücü vermez).
- **Hareket:** yürüme, koşma, sprint, zıplama, düşme, eğilme, yüzme, dalış (oksijen + derinlik), merdivenden gemiye tırmanma, güvertede yürüme, küpeşteden denize atlama, sandık taşıma.
- **Gemi:** fizik tabanlı Küçük Sloop (dalgalara göre yalpa, rüzgâr verimi, atalet, karaya oturma hasarı), dümen, yelken miktarı, çapa, 4 top + gülle balistiği, gövde delikleri, su alma ve batma, tahta ile onarım, kova ile su boşaltma, kürek sandalı (indir/çek/kıyıya çık), ambar, harita masası. Satın alınabilir **Brigantine** (2 direk, 8 top). Gemi geliştirmeleri ve görünümü (renkler, yelken deseni, bayrak, ad).
- **Dünya:** Kırlangıç Adası (liman kasabası, iskele, deniz feneri, orman, Gözcü Tepesi, Timsah Lagünü, Yankı Mağarası, Kızıl Hançer kampı), Martı Adacığı ve batığı, Kemik Adası (hayalet biyomu: mezarlık, harabeler, sis), Papağan Kayalıkları, İkiz Adacıklar; gün-gece döngüsü; güneşli, bulutlu, yağmurlu, sisli, fırtınalı hava (dalga ve rüzgâra etki eder); keşfedildikçe açılan sisli dünya haritası.
- **Canlılar:** yaban domuzu, maymun (muz çalar!), timsah (pusu), papağan, zehirli yılan, yengeç, kurbağa, yarasa; 12 balık türü (palyaço, melek, kelebek, papağan, cerrah, balon — tehlikede şişer, aslan, snapper, baraküda — avlanır, orkinos, sardalya sürüleri, dev orfoz), kaplan köpekbalığı, manta, deniz kaplumbağası, yunuslar.
- **Balıkçılık:** atış gücü, yem seçimi, vuruş anı, ip gerginliği mücadelesi; koleksiyon defteri (boy, ağırlık, bölge, saat, yem, tarih).
- **Hazine:** ipuçlu haritalar (ipuçlarındaki nesneler adada gerçekten var), kürekle kazı, 4 sandık türü, tek başına yavaş / iki kişiyle hızlı taşıma, kayıkla taşıma, ambara yükleme, açma veya kapalı satma.
- **Ekonomi:** Kırlangıç Limanı tüccarları — Hazine alıcısı, Genel tüccar, Balıkçı, Silah ustası, Haritacı, Terzi, Gemi ustası, Han; görev panosu.
- **Savaş:** pala (savunma, kaçınma), tabanca (nişan, doldurma), gemi topları; iskelet korsanlar (yeniden kalkabilir), altın kaplı iskeletler, hayaletler (gece; sise karışıp kaybolur), Kızıl Hançer haydutları (kılıçlı/tabancalı); bosslar: İskelet Kaptan Morvan, Kızıl Hançer; düşman korsan gemisi saldırıları.
- **Hikâye:** Son Hazine Efsanesi'nin ilk 5 aşaması (Başlangıç → İlk Hazine → Eski Günlük → İlk Harita Parçası → Kızıl Hançer) + yan görevler, başarımlar, rastgele olaylar (yüzen varil, şişede mesaj, kazazede, fırtına, sürüklenen sandık, korsan gemisi).
- **Online co-op (1–4 oyuncu):** oda kur (özel/herkese açık, kapasite, şifre, kayıt seçimi, zorluk, dost ateşi), oda koduyla / davet bağlantısıyla / açık oda listesinden katıl, lobi (hazır durumu, sohbet). Aynı gemide gezme, dümen/top kilitleri, ortak sandık taşıma, paylaşılan satış geliri, yaralı arkadaşı kaldırma. Bağlantı WebRTC (PeerJS) ile eşler arası kurulur; dünya oda sahibinde kaydedilir.
- **Kayıt:** 3 tek oyunculu + 3 online yuva, 2 dakikada bir otomatik kayıt, bozulmaya karşı geçici-yazma ve yedek; kayıtları dışa/içe aktarma.

## Henüz olmayanlar (sonraki aşamalar)
Şartnamedeki tam sürüm hedeflerinden bu MVP'de **yer almayanlar**: 12×12 km dünya ve 6 biyomun tamamı (şu an Tropikal ve Hayalet biyomları var),
Altın İskele ve Kara Fener limanları, Büyük Kalyon ve Hayalet Gemi, Kraken / Derinlik Yılanı / Lanetli Amiral boss'ları, kraliyet donanması ve arananlık sistemi,
müzayede evi, halatla sallanma ve kayalık tırmanışı, Steam entegrasyonu (arkadaş listesi, Steam lobileri), oda sahibi aktarımı.
Şartname Unity/C#/URP öngörüyor; "önce GitHub linkiyle oynanabilir sürüm" hedefi nedeniyle bu sürüm tarayıcıda çalışan three.js ile yazıldı.
Exe için en hızlı yol bu web sürümünü Electron ile paketlemek.

## Proje yapısı
```
index.html, css/style.css
js/main.js              giriş noktası, oturum akışları, kayıt
js/core/                motor, giriş, ses, kayıt, ayarlar, varlıklar, dokular
js/world/               arazi, okyanus, gökyüzü/hava, bitki örtüsü, liman, mağara, fizik
js/player/              karakter ve özelleştirme, oyuncu kontrolcüsü, kamera, envanter
js/ship/                gemi modeli ve fiziği, kürek sandalı
js/wildlife/            kara hayvanları, balıklar/köpekbalığı, balıkçılık
js/treasure/            haritalar, kazı, sandıklar, ganimet
js/economy/             eşya veritabanı, tüccarlar
js/game/                oyun döngüsü, etkileşim, savaş, düşmanlar, NPC'ler, görevler, olaylar
js/net/                 online co-op
js/ui/                  menüler, HUD, paneller, karakter editörü, defter, ayarlar
assets/                 CC0 modeller ve sesler, OFL yazı tipleri
```
Krediler ve lisanslar: [CREDITS.md](CREDITS.md)
