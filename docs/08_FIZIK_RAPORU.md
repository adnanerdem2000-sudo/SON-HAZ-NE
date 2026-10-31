# 8. Fizik Raporu (uygulanan)

Oyun özel, hafif bir fizik katmanı kullanır (harici motor yok). Kaynaklar: `js/world/physics.js`, `js/world/bodies.js`,
`js/player/player.js`, `js/player/ragdoll.js`, `js/world/hazards.js`.

## 8.1 Statik çarpışma dünyası (`physics.js`)
- 16 m hücreli uzaysal karma; dikey silindir (ağaç, kaya, fıçı), yönlü kutu (duvar, bina, kafes) ve yürünebilir platform
  (iskele, güverte, zemin) türleri.
- `resolve()`: karakter/canlı dairesini çarpıştırıcılardan dışarı iter (yükseklik aralığı denetimli).
- `groundAt()`: arazi + ayak altındaki platformlar (basamak toleransı 0,6 m).
- `lineBlocked()`: görüş hattı — arazi örneklemesi + silindir/kutu kesişimi (düşman algısı, siper).
- Ada içeriği etiketle eklenir ve ada boşaltılınca `removeTag()` ile silinir (akışlı dünya).

## 8.2 Karakter denetleyicisi (`player.js`)
- Kinematik denetleyici: ivmeli yer hareketi (hızlanma 9, yavaşlama 13, havada 2,5 m/s²), yerçekimi −22 m/s²,
  zıplama 7,4 m/s, eğim tırmanma sınırı, basamak, kenardan düşme; 7 m üstü düşüşte hasar.
- Kip geçişleri: yer ↔ yüzme (derinliğe göre) ↔ dalış (oksijen), tırmanma, güverte (gemi yerel koordinatlarında yürüme),
  dümen/top başı, kayık.
- Savaş hareketleri: yönlü kaçınma (yuvarlanma), hamle, geri itme (knockback), sendeleme; vuruş anında kısa ağır çekim.

## 8.3 Rijit cisimler (`bodies.js`)
- Küre yaklaşımlı cisimler: yerçekimi, **kaldırma kuvveti** (batma oranıyla), suda sürüklenme, rüzgâr/akıntı kayması,
  zemin ve platform çarpışması, sürtünme, sekme, devrilme ve yere oturma, cisimler arası çarpışma, uyku.
- Kullanım: hazine sandıkları (taşınır, suya düşer, yüzer), ganimet keseleri, yüzen variller/şişeler/kazazede salı,
  patlama ve kırılma parçaları.
- `impulse()`: patlama itkisi (gülle, barut fıçısı, gayzer); `push()`: karakter ve düşmanlar serbest cisimleri iter.

## 8.4 Ragdoll ve IK
- Ragdoll: KayKit iskeleti üzerinde Verlet parçacık zinciri (kalça, gövde, baş, kollar, bacaklar), uzunluk kısıtları,
  diz/dirsek açı sınırı, zemin çarpışması, ilk hız/itki; ölümde ve ağır darbede (patlama, kaya) çalışır, kalkışta animasyona döner.
- IK: analitik iki kemikli çözüm (ayak/el yerleştirme).

## 8.5 Çevre fiziği ve bulmacalar (`hazards.js`)
| Öğe | Fizik |
|---|---|
| Barut fıçısı | Hasar/patlamayla fitil (0,25–3,2 sn), 7 m yarıçap, mesafeyle azalan hasar (15–85 oyuncu, 20–105 düşman), geri savrulma, `impulse`, zincirleme patlama, gemiye hasar |
| Kırılabilir sandık | 14 can; parçalar rijit cisim olarak saçılır (9–13 sn sonra silinir) |
| Kaya tuzağı | Yuvarlanan küre: eğim boyunca 5/7·g ivme, yuvarlanma sürtünmesi, çarpışmada sekme, hızla orantılı ezme hasarı, denize düşerse durur |
| Basınç plakası | Taş blok yalnızca kendi eksenlerinde itilir (oyuncu hızının %35'i, en çok 1,1 m/s), engel/basamak denetimi; plakaya oturunca kafes toprağa gömülür |
| Buhar gayzeri | 7–12 sn döngü: gürleme → 2,4 sn fışkırma; üstündekini 16 m/s fırlatır (~5,8 m, düşme hasarı eşiğinin altında) |
| Lav gölü | Temas eden oyuncuya 0,4 sn'de bir 14 hasar |

## 8.6 Sınırlar
- Fizik kare hızına bağlı adımlarla çalışır; çok düşük FPS'te (yazılımsal GPU) cisimler 2 alt adımla kararlı tutulur.
- Gerçek çokgen çarpışma yoktur; binalar kutu, kayalar silindir olarak yaklaşıklanır.
