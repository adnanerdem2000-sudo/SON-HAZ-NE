# 9. Deniz ve Gemi Fiziği Raporu (uygulanan)

Kaynaklar: `js/world/ocean.js`, `js/ship/ship.js`, `js/ship/shipModel.js`, `js/game/shipControl.js`.

## 9.1 Deniz
- Beş Gerstner benzeri dalga; aynı formül JS (`ocean.heightAt`) ve GLSL'de çalışır (görüntü ile fizik eşleşir).
- Hava durumuna göre dalga ölçeği (açık 0,75 → fırtına 2,4), rüzgâr yönü/şiddeti, gelgit (±0,55 m), kıyıda sönümleme.
- Derinlik penceresi: oyuncuyu izleyen derinlik dokusu (Web Worker) — kıyı köpüğü, sığ su rengi, su altı görüşü.

## 9.2 Gemi hareketi
- İleri/yanal hız ayrıştırması; yelken itkisi = azami hız × yelken açıklığı × rüzgâr verimi (rüzgâra göre açı) × gövde/
  su/pruva sağlığı × yelken sağlığı × fırtına çarpanı × "Rüzgâr Okuyucu" yeteneği.
- Omurga yanal kaymaya direnir; rüzgâr yan kuvveti sürüklenme yaratır; dalga sırtından inerken hızlanma.
- Dümen dönüş hızı, dümen sağlığıyla ölçeklenir; çapa zinciri gemiyi yerinde tutar; limanda halatlar.
- **Kaldırma:** 8 noktalı (baş, kıç, iki borda, dört köşe) yay-sönüm modeli → yalpa (roll), baş-kıç vurma (pitch), dalıp çıkma (heave).
- **Çarpışma:** kara (9 örnek nokta, eğimden normal), deniz kayalıkları/buzdağları (daire engeller), gemi-gemi;
  sekme, teğetsel sürtünme, açısal itki, hıza bağlı gövde hasarı.
- Dünya sınırı: ±9 750 m.

## 9.3 Bölgesel hasar
| Bölge | Etki |
|---|---|
| Pruva (baş) | Hız çarpanı (%72–100) |
| Kıç / dümen | Dönüş hızı azalır |
| İskele / sancak bordası | Delik → su alma |
| Direkler (her biri ayrı can) | Kırılınca direk devrilir (pivot animasyonu), arma gizlenir, yelken itkisi düşer |
| Yelkenler | Yırtık dokusu (alfa haritası), yelken verimi düşer |
| Toplar (her biri ayrı can) | Kırık top ateşlenemez |
| Yangın | Gülle/patlama/lav ile tutuşur, yayılır, gövdeyi yakar; güvertede söndürülür |

Onarım: delik (tahta, 2,2 sn basılı tut), top (1 tahta), acil direk (4 tahta, 5 sn), yangın söndürme (1,4 sn);
"Usta Marangoz" yeteneği süreleri kısaltır. Su 100'e ulaşınca gemi batar; limanda kurtarılabilir (600 altın).

## 9.4 Deniz savaşı ve bordalama
- Toplar: 58 m/s namlu hızı, hava direnci ve rüzgâr sapması, gemi hızının eklenmesi; isabet noktasına bölgesel hasar.
- Düşman gemisi (Kızıl Diş): yaklaşır, yan döner, yaylım ateşi açar; 4 kişilik güverte tayfası.
- **Bordalama:** kancalar atılınca iki gemi halatlarla bağlanır, tayfa güverteye atlar; güverte savaşı;
  gemi ele geçirilince ganimet/altın.
- Lanetli Amiral bossunda hayalet tayfa güverteye çıkar.

## 9.5 Deniz olayları ve canlılar
Buzdağları gemiye engel olarak eklenir (çarpışma hasarı); volkanik bombardımanda lav bombaları gemiye bölgesel hasar
verir ve yangın çıkarabilir; balinanın sıçraması yakındaki gemiyi yalpalatır; yunuslar pruvada hıza kilitlenir.
