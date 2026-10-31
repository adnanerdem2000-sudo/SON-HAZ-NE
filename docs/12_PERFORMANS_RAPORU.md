# 12. Performans Raporu

Ölçüm ortamı: başsız Chromium + **yazılımsal WebGL (SwiftShader)**, 960×540, `DK.sim` ile 60 Hz adımlar.
Yazılımsal GPU gerçek ekran kartından onlarca kat yavaştır; bu nedenle **çizim süreleri gösterge değildir**,
CPU tarafı (oyun mantığı) süreleri ve çizim çağrısı/üçgen sayıları ise donanımdan bağımsız karşılaştırma verir.

## 12.1 Senaryolar (v0.3)
| Senaryo | Oyun mantığı (ms/kare) | Çizim çağrısı | Üçgen | Etkin düşman / hayvan / deniz devi |
|---|---|---|---|---|
| Kırlangıç Limanı (başlangıç) | 2,0 | 1 045 | 1,25 M | 0 / 27 / 0 |
| Kızıl Hançer Kampı (5 düşman) | 3,1 | 470 | 1,09 M | 5 / 36 / 5 |
| Kurt Adası (orman, kurtlar, kamp) | 1,5 | 507 | 1,07 M | 0 / 16 / 0 |
| Ada liman kasabası (Tuz Pazarı) | 1,3 | 478 | 0,92 M | 0 / 5 / 8 |
| Açık deniz, Buzul (balina, orka, buzdağı) | 2,2 | 380 | 0,45 M | 0 / 0 / 3 |

- 60 FPS için kare bütçesi 16,7 ms; oyun mantığı bütçenin **%8–19'unu** kullanır, kalan süre çizime kalır.
- JS yığını ~125 MB. Sayfa açılışı (modeller + dünya kurulumu) ~5 sn; oyun başlatma ~0,2 sn; ada kurulumu 25–100 ms (karede en fazla bir ada).
- En pahalı sistemler: balık sürüleri (0,2–0,9 ms), düşman AI (yakın kamp, 0,2 ms), hayvanlar (0,15 ms).
- Yeni sistemlerin maliyeti: deniz devleri 0,01–0,04 ms, çevre etkileşimleri 0,01 ms, bağlama duyarlı olaylar 0,02 ms.

## 12.2 Uygulanan optimizasyonlar
- **Arazi:** 160 m karolar, 4 LOD halkası, Web Worker'da üretim, kenar perdeleri; `heightAt` 0,6–0,75 µs.
- **Ada içeriği:** yaklaşınca kurulur/uzaklaşınca boşaltılır; 160 m hücreli InstancedMesh, hücre başına görünürlük ve
  gölge LOD'u (gölge yalnız 220 m içinde, küçük nesneler 240 m'de gizlenir); bitki sayısı üst sınırı.
- **Karakter dokuları:** KayKit atlas renklendirmesi önbellekli piksel + DataTexture (karakter başına 300–1400 ms → ~1 ms).
- **AI LOD:** uzak düşmanlar seyrek güncellenir; hayvanlar 250 m dışında güncellenmez; bölge kontrolleri saniyede 4 kez.
- **Işıklar:** sabit 4 noktasal ışıktan oluşan havuz (gölgelendiriciler yeniden derlenmez), en yakın fenerlere atanır.
- **Deniz devleri:** geometri tür başına bir kez üretilir ve paylaşılır; 700 m dışında gizlenir.
- **Parçacıklar:** tek `Points` nesnesinde en çok 900 parçacık.

## 12.3 Ayarlar
Görüntü ölçeği, kalite, FPS sınırı, dikey eşitleme, görüş mesafesi, gölge/su/efekt kalitesi, görüş açısı ayarlanabilir
(Ayarlar → Görüntü). Zayıf donanımda gölgeleri kapatmak ve görüntü ölçeğini 0,75'e indirmek önerilir.

## 12.4 İyileştirme fırsatları (yapılmadı)
- Başlangıç limanında ~1 000 çizim çağrısı: çekirdek ada yapılarının birleştirilmesi/örneklenmesi ile azaltılabilir.
- Uzak arazi karoları için impostor ya da tek parça uzak manzara.
- Gerçek GPU'da FPS ölçümü (bu ortamda donanım GPU yok).
