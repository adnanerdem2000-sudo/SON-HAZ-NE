# 9. Kayıt / Kalıcılık Testleri (Aşama 6 — kalıcılık)

Ortam: başsız Chromium + SwiftShader, `tests/scenarios/08_kalicilik.js` (13 beklenti). Yöntem: oyun içinde durum değiştirilir,
`game.serialize()` ile kayıt verisi üretilip `save.write` ile yazılır, aynı yuva `startGame` ile yüklenir ve durum karşılaştırılır.
Ayrıca bozuk kayıt dosyası ve `.bak` yedeği sınanır.

| # | Konu | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | Kayıt verisi: ada ödülleri (`opened`), tutsaklar (`freed`), tapınak mekanizması (`temples`), patlamış fıçı/kırık sandık (`hazards.gone`), taşınan sandık, batık gemi, kamp bekleme | GEÇTİ | 7/7 alan kayıtta |
| 2 | Yükleme: ada ödülleri/tutsaklar/tapınak geri gelir | GEÇTİ | B02/B-08 (önce: yenilemeyle tekrar ganimet, mekanizma sıfırlanıyordu) |
| 3 | Kırık sandık ve patlamış fıçı yüklemede yeniden kurulmaz | GEÇTİ | `gone`: 3 kimlik; liste yeniden kurmadı |
| 4 | Taşınan sandık kayıtta ve yüklemede oyuncunun yanında | GEÇTİ | 0.6 m (B04; önce: sandık içeriğiyle yok oluyordu) |
| 5 | Batık gemi batık yüklenir; parça/direk/top hasarı korunur; oyuncu güverteye bindirilmez | GEÇTİ | pruva 50, direk 0, top 30, görünmez, oyuncu karada (E-13, A1) |
| 6 | Kamp bekleme süresi | GEÇTİ | 222 sn → yükleme sonrası 220 sn (geçen süre düşülür) (A5/F-07) |
| 7 | Sandık ve kese kimlikleri benzersiz | GEÇTİ | `uid()` tabanlı |
| 8 | Bozuk kayıt dosyası (`{"slot":1,"broken":`) | GEÇTİ | `read` null döner, liste çökmez (A14 `save.valid`) |
| 9 | Ana kayıt bozuk, `.bak` sağlam | GEÇTİ | yedek okunur (version 1) |
| 10 | Yükleme sonrası döngü hatasız | GEÇTİ | sayfa hatası 0 |

Konuk kaydı (co-op): `dksh.guest.0` kaydında envanter + rütbe/yetenek + kişisel görev/keşif/koleksiyon (`quests.save()`) saklanır;
hikâye aşaması ve bayraklar her katılımda ev sahibinden gelir (A7/A16/B06). Bu yol 2 oyunculu senaryoda doğrudan ölçülmedi
(bilinen sorunlar listesine bakınız).

Kaydedilmeyenler (bilinçli): yuvarlanan kaya konumu (yüklemede yeniden kurulur), yüzen olay nesneleri, ganimet keseleri (oturum geçici).

## 9.1 Üç ardışık kayıt/yükleme döngüsü (Aşama 9, `tests/scenarios/12_kayit_dongusu.js`)
Her döngüde oyuncu konumu/sağlığı/envanteri, gemi gövde ve pruva hasarı, ada ödülü, kırık sandık ve kamp beklemesi değiştirilir;
`game.serialize()` → `save.write` → `startGame(data)` ile yüklenip doğrulanır. Sonuç 4/4 GEÇTİ (ilk regresyon koşusunda K01 test
beklentisi yüzünden kaldı: kamp beklemesi zamanla azalır, kayıttan önce ve yüklemeden sonra geçen 1 sn hesaba katılmamıştı; düzeltildi).

| Döngü | Sağlık | Gemi gövde / pruva | Ada ödülü (birikimli) | Kamp beklemesi (beklenen 100+k−1) | Konum | Kayıt boyutu |
|---|---|---|---|---|---|---|
| 1 | 65 ✓ | 51 / 41 ✓ | 1 ✓ | 100,0 ✓ | (−57, 120) ✓ | 16 452 B |
| 2 | 70 ✓ | 52 / 42 ✓ | 2 ✓ | 101,0 ✓ | (−54, 120) ✓ | 16 536 B |
| 3 | 75 ✓ | 53 / 43 ✓ | 3 ✓ | 102,0 ✓ | (−51, 120) ✓ | 16 606 B |

Kayıt boyutu döngüler arasında yalnız eklenen durum kadar büyüdü (+84 B, +70 B); yüklemeden sonra oyun açık, sayfa hatası 0.
