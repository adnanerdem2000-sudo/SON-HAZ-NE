# 13. Bilinen Hatalar ve Sınırlamalar

Bu sürümde düzeltilen önemli hatalar en altta listelenmiştir. Aşağıdakiler **açık** kalan konulardır.

## 13.1 Açık konular
| # | Konu | Etki | Durum / geçici çözüm |
|---|---|---|---|
| 1 | Ana hikâyenin 6–10. aşamaları yok | Hikâye 5. aşamada biter; bölgeler ve bosslar serbest keşifle oynanır | Yol haritasında |
| 2 | Yüzen olay nesneleri (varil, şişe, kazazede, gök taşı) co-op'ta yalnız ev sahibinde | Konuk bunları göremez | Senkron eklenecek |
| 3 | Konuğun rütbesi konuğun tarayıcısında saklanır | Farklı tarayıcıdan katılınca rütbe sıfırdan başlar | Profil senkronu planlandı |
| 4 | Barut fıçıları, sandıklar, kaya tuzakları ada yeniden kurulunca yenilenir | Aynı ada tekrar ziyarette yeniden kullanılabilir | Bulmaca çözümleri ve gizli sandıklar kalıcıdır |
| 5 | Zar ustasının günlük kesesi oturuma özeldir | Yeniden yüklemede kese dolar | Önemsiz |
| 6 | Başlangıç limanında ~1 000 çizim çağrısı | Zayıf GPU'da FPS düşebilir | Ayarlardan gölge/ölçek düşürülebilir |
| 7 | Kamera dar alanlarda (bina arası, güverte altı) nesnelerin içinden görebilir | Görsel | Geliştirme dalında giderildi: güverte/gemi gövdesi altına inmez, başa çok yaklaşınca karakter gizlenir; ince direk/NPC'lerin içinden kısa süre görülebilir (denetim 11. belge #40) |
| 8 | Bina/kaya çarpışmaları kutu/silindir yaklaşımıdır | Köşelerde küçük boşluklar | — |
| 9 | Kutup ayısı ve bazı hayvanlar prosedürel modeldir | Diğer hayvanlara göre daha basit görünür | Ağ politikası CC0 hayvan paketlerine erişimi engelledi |
| 10 | Unreal Fab varlıkları kullanılamadı | Fab hesap girişi ve uasset biçimi ister; ağ politikası da engelliyor | GitHub/npm üzerinden CC0 KayKit/Quaternius/Kenney kullanıldı |
| 11 | Yazılımsal GPU (test ortamı) ağır sahnelerde çökebiliyor | Yalnızca otomatik testleri etkiler | Testler küçük pencere ve tuval yakalamayla yapıldı |
| 12 | Masaüstü (exe) paketi yok | — | Yol haritasında (Electron/Tauri) |

## 13.2 Bu sürümde düzeltilenler (seçme)
- Gemi eski ±1 150 m dünya sınırına kilitliydi; 20 km haritada açık denize çıkılamıyordu → sınır ±9 750 m.
- `audio.tone` çağrılarına ses kanalı yerine konum veriliyordu; gerçek tarayıcıda (ses açıkken) düşman/boss/hayvan
  güncellemesinde istisna fırlatabiliyordu → konum desteği eklendi.
- Uyuyan hayvanlar uyandıktan sonra yan yatık kalıyordu → duruş sıfırlanıyor.
- Yengeçlerin saldırı/tepki animasyonu yanlış klip adını arıyordu → doğru klipler.
- `main.js`'deki yükleme çubuğu fonksiyonu yeni ilerleme sisteminin adını gölgeliyordu → yeniden adlandırıldı.
- Ada içerik kurulumu 26 sn sürüyordu (doku geri okuma) → 25–100 ms.
- Boss/düşman can çubuğu kayması, menzilli saldırıların yakın vuruş sayılması, ölçek/yön hataları (v0.3 ara adımlarında).
