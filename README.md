# Deniz Korsanları: Son Hazine
### Pirates: The Last Treasure — açık dünya 3B korsan macerası (tek oyunculu + online co-op)

Mavi Kırıklar takımadasında küçük, eski bir sloop ile denize açıl; adaları keşfet, hazine haritalarındaki
ipuçlarını çöz, kürekle kaz, sandıkları gemine taşı, limanda sat; balık tut, vahşi hayvanlarla karşılaş,
iskeletler, hayaletler ve Kızıl Hançer'in korsanlarıyla savaş — ve efsanevi Kaptan Mira Veyl'in **Son Hazine**'sinin peşine düş.

> **Bu sürüm:** 0.3 — 20 × 20 km dünya, altı bölge, beş efsanevi boss, yeni karakterler ve animasyonlar, algıya dayalı
> düşman zekâsı, gemi bölgesel hasarı ve bordalama, deniz devleri, çevre bulmacaları, korsan rütbesi ve yeni ana menü.
> Tarayıcıda çalışır, kurulum gerektirmez. Masaüstü (exe) paketi bir sonraki adımda hazırlanacak.

## Oynamak için
- **GitHub Pages:** depo ayarlarında *Settings → Pages → Source: GitHub Actions* seçildikten sonra
  `https://<kullanıcı>.github.io/<depo>/` adresinde açılır (iş akışı: `.github/workflows/pages.yml`).
- **Tek dosya (çevrimdışı):** `https://<kullanıcı>.github.io/<depo>/DenizKorsanlari-SonHazine.html` dosyasını indir ve
  çift tıkla — sunucu gerekmez; kod, modeller, sesler ve yazı tipleri dosyanın içindedir (~21 MB). Yerelde üretmek için:
  `npm i esbuild && node tools/build-single-html.mjs` (çıktı: `dist/DenizKorsanlari-SonHazine.html`).
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
| K | Korsan Rütbesi ve yetenek ağacı |
| Sol fare | Saldırı · kazma · olta atma/sarma · top ateşleme |
| Sağ fare | Nişan alma (tabanca) · savunma (pala) |
| R | Tabanca doldurma · olta yemi değiştirme |
| V | Kaçınma (yuvarlanma) |
| G | Taşınan sandığı bırak |
| 1–5 | Pala, tabanca, kürek, olta, hazine haritası |
| C | Pusula şeridi |
| Z | Dürbün (tekerlek: yakınlaştır; bakılan ada/gemi/canlı ve uzaklığı yazılır) |
| Enter | Sohbet (online) |
| Esc | Duraklat menüsü |

Gemide: dümende **A/D** yön, **W/S** yelken miktarı; çapa için baştaki ırgata, toplar için borda boyundaki toplara git.
Oyun kumandası (standart düzen) desteklenir.

## 0.3 sürümünde yenilikler
- **Dünya:** 20 × 20 km akışlı dünya (arazi karoları Web Worker'da, LOD halkaları; adalar yaklaşınca kurulur), 6 bölge ve
  biyom (Ticaret Denizi, Buzul Denizi, Zümrüt Takımadaları, Kül Adaları, Kızıl Kum Kıyıları, Hayalet Denizleri), 73 ada,
  6 liman kasabası, yıkık korsan kasabası, gizli korsan pazarı, kadim tapınak (bulmaca + boss), Demirkapı Hapishanesi,
  batık şehir, terk edilmiş maden, korsan mezarlığı, fener; bölgeye özgü atmosfer (kar, kül, hayalet sisi); büyük
  yakınlaştırılabilir harita, keşif sisi, rota kaptanlarıyla hızlı yolculuk, bölgeye/adaya girişte konum afişi.
- **Karakterler ve animasyon:** KayKit (CC0) karakterleri, 89 girişlik animasyon kütüphanesi, alt/üst gövde katmanları,
  ragdoll, IK, ivmeli hareket ve iniş tepkileri.
- **Savaş ve yapay zekâ:** kombo, ağır vuruş, blok, parry, yönlü kaçınma, sersemletme, karşı saldırı, vuruş anı duraksaması;
  17 düşman türü, görüş/ses algısı, 17 durumlu davranış, saldırı jetonları, kuşatma, siper, geri çekilme, moral.
- **Bosslar:** Kraken, Derinlik Yılanı, Taş Muhafız, Volkanik Dev, Lanetli Amiral — evreli, telgraflı, zayıf noktalı.
- **Gemi:** bölgesel hasar (pruva, kıç/dümen, bordalar, her direk, yelken, her top), direk devrilmesi, yelken yırtığı,
  yangın ve söndürme, acil onarımlar; düşman gemisinde güverte tayfası, kancayla bordalama ve ele geçirme.
- **Ekosistem:** kurt sürüleri, tilki, geyik, erkek geyik, kutup ayısı, kar canavarı, dev yengeç; kambur balina (yavrusuyla,
  nefes, kuyruk kaldırarak dalış, sıçrama), orka sürüsü (yüzeni avlar), pruvada yüzen yunuslar, hayalet balina; 32 balık türü.
- **Çevre ve bulmacalar:** barut fıçıları (zincirleme patlama), kırılabilir sandıklar, kaya tuzakları, basınç plakası
  bulmacaları, buhar gayzerleri, lav gölleri.
- **Bağlama duyarlı olaylar:** buzdağları, hayalet ışıklar, gök taşı, volkanik bombardıman, ışıldayan plankton, fırtına enkazı.
- **İlerleme ve etkinlik:** 30 seviyelik korsan rütbesi ve 4 dallı yetenek ağacı (K); limanlarda **Korsan Zarı**.
- **Arayüz:** yeni ana menü (son macera kartı, simgeli düğmeler, yenilikler paneli), HUD'da rütbe ve XP, seviye atlama afişi.
- **Belgeler:** `docs/` klasöründe 14 belge (analiz, dünya planı, biyomlar, düşman kataloğu ve denge tablosu, bosslar,
  animasyonlar, fizik, deniz/gemi fiziği, ekosistem, online test, performans, bilinen hatalar, yol haritası).

## 0.2 sürümünde yenilikler
- **Görüntü:** son işleme zinciri (HDR → parlama/bloom → günün saatine ve havaya göre renk düzenleme + vinyet → ACES ton eşleme → kenar yumuşatma; Ayarlar → Efekt kalitesi), sığ sularda hareketli kostik ışık desenleri, gelgit çizgisinde ıslak kum, eğime duyarlı kıyı köpüğü, yağmurda ıslanan zemin, yumuşak hacimli deniz feneri hüzmesi, gece daha okunur ay ışığı.
- **Dünya ayrıntıları:** mercan resifleri, sallanan yosunlar, kumsalda deniz kabukları ve deniz yıldızları, toplanabilir kabuk/istiridye (inci çıkabilir), açık denizde kaya sütunları (gemiler çarpabilir), martı sürüleri (seyreden gemiyi takip eder), Timsah Lagünü'ne dökülen şelale, kıyıda gezinen balıkçı tekneleri, gemilerin arkasında dümen suyu köpüğü ve pruva serpintisi.
- **Dinamik hava olayları:** 8 hava türü (açık, parçalı, bulutlu, çiseleme, sağanak, fırtına, sisli, rüzgârlı) Markov zinciriyle kendiliğinden değişir; hava tahmini (sonraki 3 değişim), rüzgâr cepheleri, 3B bulut katmanı, gerçek yıldırım çarpmaları (gemiye isabet edebilir, gök gürültüsü mesafeye göre gecikir), yağmur sonrası gökkuşağı, fırtınada su hortumları (gemiyi çeker, döndürür, hasar verir), denizde yağmur halkaları ve sıçramalar, sis bulutları.
- **Zaman çizelgesi:** gün sayacı, gelgit (≈12,4 saatlik döngü, ±0,55 m; bazı hazineler yalnızca alçak suda kazılabilir), günlük program (şafak/akşam balık akını, liman açılış-kapanış, handa akşam eğlencesi, gece yarısı hayalet saatleri) ve dönemsel olaylar (iki günde bir **ticaret gemisi "Altın Martı"** — nadir mallar ve +%15 alım; üç günde bir **pazar günü** +%20 satış; beş günde bir **korsan şenliği**). Ekranın sağ üstünde 12 saatlik zaman şeridi; Korsan Defteri'nde **Zaman Çizelgesi** sekmesi (bugünün programı, 7 günlük takvim, hava tahmini, gelgit tablosu, dükkân saatleri, macera günlüğü). Tüccarların çalışma saatleri var; dükkân kapanınca NPC'ler hana yürür, sabah geri döner. Handa oda tutup sabaha / akşama kadar uyunabilir.
- **Fizik altyapısı:** sekiz noktalı kaldırma kuvvetiyle gemi yalpası/baş-kıç vurması (kütleye göre), rüzgârla yatma, omurga yanal direnci, çapa zinciri ve rüzgâra dönme, limanda halatla bağlı kalma, kayalara ve gemilere çarpışma (itki, dönme, darbe hasarı), kürek darbeli kayık; sandık ve yüzen nesneler için rijit cisimler (düşme, sekme, yuvarlanma, eğimde kayma, suda yüzme, dalga ve rüzgârla sürüklenme, patlamayla savrulma); karakterlerin birbirini itmesi, darbeyle geri tepme, güvertede eğim ve ivmeyle kayma, top güllelerinde hava direnci ve rüzgâr sapması.
- **Karakterler ve eşyalar:** kenar ışığı (siluetler gündüz ufuk, gece ay ışığıyla belirginleşir), altın sırmalı ve tüylü şapkalar, kavisli korsan palası (kabuk siper, sargılı kabza), pirinç kakmalı çakmaklı tabanca, yeni ayrıntılı eşya simgeleri, **dürbün**.
- **Harita:** suluboya deniz haritası (tepe gölgelendirme, eş yükselti eğrileri, kıyı mürekkebi, dalga işaretleri, deniz canavarı, kartuş, dama çerçeve), yumuşak kenarlı keşif sisi, yer simgeleri; ekranda dönen **mini harita**; eskitilmiş, el boyaması hazine haritaları.
- **Online:** gün, saat, hava, tahmin, ıslaklık ve su hortumları oda sahibinden eşitlenir; uyuma tüm tayfaya yansır.

## Bu sürümde neler var
- **Ana menü** (gün batımında seyreden gemi): son macera kartı ve Devam Et, Yeni Macera, Dünyalar (3 kayıt yuvası), Online (Oda kur / Odaya katıl / Hızlı katıl), Korsanım, Korsan Defteri, Ayarlar, Krediler, Çıkış.
- **Korsan oluşturma:** erkek/kadın, boy, vücut tipi, yaş, ten, yüz şekli, burun, çene, göz rengi, yara izleri, yüz izleri, dövmeler, 6 saç modeli, 5 sakal tipi, şapkalar (üç köşeli, kaptan, korsan, bandana), ceket/yelek, kıyafet renkleri, göz bandı, küpe, kolye, eldiven, kemer/kuşak. Bazı kozmetikler Terzi'den altınla açılır (savaş gücü vermez).
- **Hareket:** yürüme, koşma, sprint, zıplama, düşme, eğilme, yüzme, dalış (oksijen + derinlik), merdivenden gemiye tırmanma, güvertede yürüme, küpeşteden denize atlama, sandık taşıma.
- **Gemi:** fizik tabanlı Küçük Sloop (dalgalara göre yalpa, rüzgâr verimi, atalet, karaya oturma hasarı), dümen, yelken miktarı, çapa, 4 top + gülle balistiği, gövde delikleri, su alma ve batma, tahta ile onarım, kova ile su boşaltma, kürek sandalı (indir/çek/kıyıya çık), ambar, harita masası. Satın alınabilir **Brigantine** (2 direk, 8 top). Gemi geliştirmeleri ve görünümü (renkler, yelken deseni, bayrak, ad).
- **Dünya:** Kırlangıç Adası (liman kasabası, iskele, deniz feneri, orman, Gözcü Tepesi, Timsah Lagünü, Yankı Mağarası, Kızıl Hançer kampı), Martı Adacığı ve batığı, Kemik Adası (hayalet biyomu: mezarlık, harabeler, sis), Papağan Kayalıkları, İkiz Adacıklar; gün-gece döngüsü; güneşli, bulutlu, yağmurlu, sisli, fırtınalı hava (dalga ve rüzgâra etki eder); keşfedildikçe açılan sisli dünya haritası.
- **Canlılar:** 15 kara hayvanı türü (yaban domuzu, maymun — muz çalar!, timsah — pusu, papağan, zehirli yılan, yengeç, kurbağa, yarasa, kurt sürüsü, tilki, geyik, erkek geyik, kutup ayısı, kar canavarı, dev yengeç); 32 balık türü, bölgeye özgü (palyaço, melek, balon — tehlikede şişer, baraküda — avlanır, orkinos, morina, somon, buz balığı, kor balığı, obsidyen vatoz, kılıç balığı, fener balığı, hayalet balık…); kaplan köpekbalığı, manta, deniz kaplumbağası, yunus sürüleri, kambur balina, orka sürüsü, hayalet balina.
- **Balıkçılık:** atış gücü, yem seçimi, vuruş anı, ip gerginliği mücadelesi; koleksiyon defteri (boy, ağırlık, bölge, saat, yem, tarih).
- **Hazine:** ipuçlu haritalar (ipuçlarındaki nesneler adada gerçekten var), kürekle kazı, 4 sandık türü, tek başına yavaş / iki kişiyle hızlı taşıma, kayıkla taşıma, ambara yükleme, açma veya kapalı satma.
- **Ekonomi:** Kırlangıç Limanı tüccarları — Hazine alıcısı, Genel tüccar, Balıkçı, Silah ustası, Haritacı, Terzi, Gemi ustası, Han; görev panosu.
- **Savaş:** pala (savunma, kaçınma), tabanca (nişan, doldurma), gemi topları; iskelet korsanlar (yeniden kalkabilir), altın kaplı iskeletler, hayaletler (gece; sise karışıp kaybolur), Kızıl Hançer haydutları (kılıçlı/tabancalı); bosslar: İskelet Kaptan Morvan, Kızıl Hançer; düşman korsan gemisi saldırıları.
- **Hikâye:** Son Hazine Efsanesi'nin ilk 5 aşaması (Başlangıç → İlk Hazine → Eski Günlük → İlk Harita Parçası → Kızıl Hançer) + yan görevler, başarımlar, rastgele olaylar (yüzen varil, şişede mesaj, kazazede, fırtına, sürüklenen sandık, korsan gemisi).
- **Online co-op (1–4 oyuncu):** oda kur (özel/herkese açık, kapasite, şifre, kayıt seçimi, zorluk, dost ateşi), oda koduyla / davet bağlantısıyla / açık oda listesinden katıl, lobi (hazır durumu, sohbet). Aynı gemide gezme, dümen/top kilitleri, ortak sandık taşıma, paylaşılan satış geliri, yaralı arkadaşı kaldırma. Bağlantı WebRTC (PeerJS) ile eşler arası kurulur; dünya oda sahibinde kaydedilir.
- **Kayıt:** 3 tek oyunculu + 3 online yuva, 2 dakikada bir otomatik kayıt, bozulmaya karşı geçici-yazma ve yedek; kayıtları dışa/içe aktarma.

## Henüz olmayanlar (sonraki aşamalar)
Şartnamedeki tam sürüm hedeflerinden bu sürümde **yer almayanlar**: ana hikâyenin 6–10. aşamaları, oyuncunun kullanabileceği
Büyük Kalyon ve Hayalet Gemi, kraliyet donanması ve arananlık sistemi, müzayede evi, halatla sallanma ve kayalık tırmanışı,
Steam entegrasyonu, oda sahibi aktarımı, masaüstü (exe) paketi. Ayrıntılı liste: `docs/13_BILINEN_HATALAR.md`, `docs/14_YOL_HARITASI.md`.
Şartname Unity/C#/URP öngörüyor; "önce GitHub linkiyle oynanabilir sürüm" hedefi nedeniyle bu sürüm tarayıcıda çalışan three.js ile yazıldı.
Exe için en hızlı yol bu web sürümünü Electron ile paketlemek.

## Proje yapısı
```
index.html, css/style.css
js/main.js              giriş noktası, oturum akışları, kayıt
js/core/                motor, son işleme, kenar ışığı, giriş, ses, kayıt, ayarlar, varlıklar, dokular
js/world/               akışlı arazi (Worker), takımada/bölgeler, ada içeriği, limanlar, okyanus, gökyüzü/hava, zaman çizelgesi,
                        rijit cisimler, fizik, çevre etkileşimleri (hazards), dünya ayrıntıları, mağara
js/player/              karakter ve özelleştirme, oyuncu kontrolcüsü, kamera, envanter
js/ship/                gemi modeli ve fiziği, kürek sandalı
js/wildlife/            kara hayvanları, deniz devleri (megafauna), balıklar/köpekbalığı, balıkçılık
js/treasure/            haritalar, kazı, sandıklar, ganimet
js/economy/             eşya veritabanı, tüccarlar
js/game/                oyun döngüsü, etkileşim, savaş, düşmanlar, bosslar, NPC'ler, görevler, olaylar, bağlama duyarlı
                        olaylar (worldEvents), korsan rütbesi (progress)
js/net/                 online co-op
js/ui/                  menüler, HUD (zaman şeridi, mini harita, rütbe), paneller, harita çizimi, karakter editörü, defter,
                        ayarlar, yetenek paneli, zar oyunu
docs/                   14 tasarım/test belgesi
assets/                 CC0 modeller ve sesler, OFL yazı tipleri
```
Krediler ve lisanslar: [CREDITS.md](CREDITS.md)
