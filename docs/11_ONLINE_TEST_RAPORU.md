# 11. Online Test Raporu

Mimari: PeerJS/WebRTC, oda sahibi otoriteli (host simüle eder, konuklar anlık görüntü alır), 1–4 oyuncu, oda kodu/şifre,
açık oda listesi. Testler iki başsız Chromium sekmesiyle ve yerel PeerJS sinyal sunucusuyla yapıldı (`coop3.cjs`).

## 11.1 Senkronize edilenler
| Veri | Yöntem |
|---|---|
| Oyuncu konumu, kip, animasyon, üst gövde katmanı, ragdoll | 15 Hz durum + olaylar |
| Gemiler (konum, yelken, dümen, hasar bölgeleri, yangın, su) | Anlık görüntü + komut (shipCmd) |
| Düşmanlar, bosslar (evre, can, saldırı) | Anlık görüntü (2 karede bir) |
| Kara hayvanları, deniz devleri | Anlık görüntü; konuk vuruşları ev sahibine iletilir |
| Hazine sandıkları, ganimet | İstek/onay mesajları |
| Zaman, hava, tahmin, hava efektleri | Anlık görüntü |
| Bağlama duyarlı olaylar (buzdağı, hayalet ışık, gök taşı, volkan, plankton) | Anlık görüntü (görseller konukta kurulur) |
| Çevre etkileşimleri (fıçı, sandık, kaya, bulmaca bloğu ve çözüm) | Olay mesajı (`hazard`) |
| Deneyim | Ev sahibi, öldüren konuğa tam XP, diğerlerine üçte bir pay gönderir |

## 11.2 v0.3 test sonuçları (`coop3.cjs`, 0 hata)
| Test | Sonuç |
|---|---|
| Oda kur, katıl, oyunu başlat | ✔ İki oyuncu aynı dünyada |
| Ev sahibi kamptaki barut fıçısını ateşler | ✔ Konukta da aynı fıçı patladı (`gone`) |
| Ev sahibi, konuğun öldürdüğü haydudu bildirir | ✔ Konuğun XP'si 50 → 70 (+20) |
| Buzul denizinde orka sürüsü + buzdağı olayı | ✔ Konukta orka/balina görselleri ve 5 buzdağı oluştu |
| Konuk bir orkaya vurur | ✔ Ev sahibinde orka canı 280 → 240, sürü avlanma kipine geçti |
| v0.2 testleri (hava/zaman, harita, kazı, sandık taşıma) | ✔ Önceki raporda (TEST_RAPORU.md) |

## 11.3 Bilinen sınırlar
- Yüzen olay nesneleri (varil, şişe, kazazede, gök taşı) yalnızca ev sahibinde görünür ve toplanabilir.
- Konuğun korsan rütbesi konuğun tarayıcısında saklanır (dünya kaydı ev sahibindedir).
- Zar oyunu tek oyunculu bir paneldir (oyuncular arasında oynanmaz).
- Yazılımsal GPU ile iki sekme aynı anda ağır sahne çizdiğinde tarayıcı süreci çökebiliyor; testler küçük pencerede yapıldı.
