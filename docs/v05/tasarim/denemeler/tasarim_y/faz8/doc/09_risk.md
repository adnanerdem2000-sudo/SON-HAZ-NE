## 9. Riskler ve iş büyüklüğü

| # | Risk | Olasılık / etki | Önlem | Kanıt/test |
|---|---|---|---|---|
| R1 | Karakter görüş konisi ayıklaması: animasyonda uzuv sınır küresinin dışına taşar, ekran kenarında karakter parçası kaybolur | Orta / orta | Bağlama pozu küresi × 1,5 ya da kök başına elle küre (r ≈ 1,6 m); ragdoll sırasında `frustumCulled=false` | 47, kamera_tarama b4, 17_kamera_kararma |
| R2 | Birleştirme/örnekleme görüntüyü değiştirir (doku ölçeği, renk, gece ışımaları, tabelalar) | Orta / yüksek (kullanıcı kuralı: görünür kalite düşmez) | Adım başına görüntü farkı eşiği; tutmayan adım dalda kalır | 48 |
| R3 | Gemi birleştirme hasar görselleri, direk devrilmesi, yelken animasyonu ve co-op `rebuild` ile çakışır | Orta / yüksek | Hareketli parçalar ayrık kalır; `rebuild` birleşik örgüyü yeniden kurar; P3.4 en son | 03_fizik_*, 14, 15, coop 06b, 48 |
| R4 | Bitki hücreleri çağrı sayısını artırır (tek dev örgü yerine hücre × tür) | Yüksek / düşük | Hücre boyu ölçüme göre (160/240/320 m); bütçe çağrı ve üçgen birlikte | 45 önce/sonra |
| R5 | Ekran boyutu/sis ayıklamasında belirme (pop-in) | Orta / orta | Eşik %99 sisin ya da 1,5 pikselin ötesinde; %10 histerezis; dürbünde FOV'a göre ölçek | 47 |
| R6 | Mağara bölge ayıklaması dışarıyı gösteren bir açıda nesne gizler | Düşük / orta | Ağza 30 m'den yakında ayıklama yok; tünelde 5 noktada görüntü farkı 0 | 49 |
| R7 | Sabit ışık havuzu: gece kasabada meşale yakılınca bir fener ışığı daha söner (havuz bugün de 4; meşale ve mağara artık havuzu paylaşır) | Yüksek / düşük | Öncelik ve uzaklık ağırlığı; fener ampulleri ışımalı malzemeyle görünür kalır | 46, gece kasaba görüntü karşılaştırması |
| R8 | Benzetim LOD'u co-op'ta oyun sonucunu değiştirir (konuğun yanındaki hayvan/düşman) | Orta / yüksek | En yakın oyuncu kuralı (Faz 5 odakları), hedefli düşman tam katman | 08e, 05 F-08 |
| R9 | SwiftShader ölçümü gerçek GPU darboğazını göstermez (doldurma, gölge, MSAA, `discard` J-28) | Kesin / orta | Çağrı/üçgen/CPU iyileştirmesi her donanımda geçerli; GPU süresi için P0.4/P0.5 ile kullanıcı makinesinde ölçüm; ölçülemezse raporda açıkça "ölçülmedi" | PERFORMANCE_REPORT B bölümü |
| R10 | JS ms ölçümü bu makinede gürültülü (aynı sahne 1,4–2,6 ms) | Kesin / düşük | İki koşunun en iyisi + bütçe 1,25×; çağrı/üçgen deterministik | 45 |
| R11 | Uzun gerçek zamanlı çizimde SwiftShader sayfası çöküyor (bu çalışmada 2 kez) | Orta / orta (yalnız test) | Testlerde `fpsLimit` kısılır, beklemeler `DK.sim` ile; çökme ayrıca raporlanır | 45, 52 |
| R12 | Faz 3'ün ÇİZİM evresi yoksa animasyon katmanlarının kancası yok | Düşük (Faz 8, Faz 3'ten sonra) | P2.2 ve P4 Faz 3 birleştikten sonra başlar | — |
| R13 | Faz 7 (AI/animasyon) tasarımı bu belge yazılırken yoktu; seyreltme kurallarını değiştirebilir | Orta / orta | `lod.js` API'si (`simTier`, `animStep`, `visible`); Faz 7 sonu kodunda taban yeniden ölçülür | 05, 37–44, 47 |
| R14 | Faz 6'nın yeni adaları/mağaraları/Ölü Sis yükü bütçeleri aşar | Orta / orta | Faz 6 §6.3 bütçeleri (hikâye alanı ≤ 60 çağrı, liman Ölü Sis ≤ 3, ışık havuzu 4) 45'in bütçe dosyasına eklenir | 34, 45 |
| R15 | Tuval `antialias` yalnız açılışta seçilebilir; oyun içinde efekt kalitesi "Kapalı"ya alınınca kenar yumuşatma yeniden başlatmaya dek yok | Kesin / düşük | Panelde "yeniden başlatınca" notu; ya da Düşük'te FXAA geçişi | 51 |

**İş büyüklüğü:** ≈ 39 gün (§7.2). En büyük kazanç/emek oranı: P2.1 karakter ayıklaması (1 gün, her sahnede ~−110 çağrı), P2.4 mağara bölgesi (1,5 gün, mağarada −1 000), P1.5 ışık havuzu (1,5 gün, en büyük tekil donma), P3.1 hayvanlar (2 gün, limanda −200). En riskli: P3.4 gemi ve P3.5 bitki hücreleri.
