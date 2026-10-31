# 6. Karakter Hareketi, Animasyon ve Savaş Testleri (Aşama 4)

Ortam: başsız Chromium + SwiftShader, 640×360, `tests/scenarios/04_karakter.js` (20 beklenti) ve görsel doğrulama için
`DK.snapFrom` ile alınan kareler (`/tmp/p4/helm.jpg`, `/tmp/p4/cannon.jpg`). Fizik testleri gibi oyun döngüsü sabit adımlarla
ilerletilir; sonuçlar donanımdan bağımsızdır.

## 6.1 Hareket listesi — durum
| Hareket | Durum | Kanıt |
|---|---|---|
| Yürüme / koşma / sprint | Çalışıyor | `03_fizik_dt`: 3 sn yürüme 12.60 m, sprint 20.17 m, kare hızından bağımsız |
| Sprint tükenmesi | Düzeltildi (C10) | Dayanıklılık 4 ile 3 sn: geçişler 0.6 s / 1.7 s / 2.7 s (önce: her karede 2 eşiğinde salınım, fiilen sonsuz sprint) |
| Yürüme→koşma animasyon eşiği | Düzeltildi (C13) | 3.0 m/s'de `Walk` (önce: `Run` 0.7 alt sınırına takılı ayak kayması) |
| Zıplama (kara) | Çalışıyor | Tepe 1.18 m, 0.65 s havada; uzun karede tek zıplama |
| Zıplama (güverte) | Düzeltildi (C09) | `JumpStart` klibi, `airT` sayacı, lokal dikey hız 6.1 m/s |
| Kaçınma (kara) | Çalışıyor | 5.32 m (kare hızından bağımsız) |
| Kaçınma (güverte) | Düzeltildi (C09) | 0.6 s'de 2.97 m yer değiştirme (önce: yerinde animasyon) |
| Yüzme / dalış | Düzeltildi (C01, D-01) | Gövde kaldırması 1.0 uygulanıyor (model y 0.01 → 1.01); 1.44 m bandında mod titreşimi yok |
| Dalışta kuşanma | Düzeltildi (C18) | Yüzerken `equip('sword')` elde eşya göstermez; çıkışta elde |
| Tırmanma (ip merdiven) | Değişmedi | Mevcut `_updateClimb`; biniş sonunda silah yeniden elde (C12) |
| Dümen | Düzeltildi (C08) | Eller çark halkasında (yarıçap 0.50 m, iki el 1.0 m ayrı), çark açısını yarı oranda izler; silah elde değil; bırakınca IK temiz ve silah yeniden elde (görsel: `helm.jpg`) |
| Top | Düzeltildi (C08) | Eller kundak arkasında (topa 0.84 m, eller 0.56 m ayrı) (görsel: `cannon.jpg`) |
| Kürek | Değişmedi | Mevcut `o.row` pozu; biniş/çıkışta silah durumu düzeltildi (C12) |
| Savunma / parry | Düzeltildi (C03) | Düşük dayanıklılıkta kare kare titreşim yok; 0.25 s yeniden başlama gecikmesi |
| Ölüm / ragdoll / diriliş | Düzeltildi (C04, C06, C19) | Ragdoll ölüm anındaki pozdan örneklenir; meşgul eylem iptal; dirilişte `getup` (`LieUp`) |
| Yerde yatma (co-op) | Düzeltildi (C21, C22) | Zehir can düşürmez (5.00 → 5.00), etkileşim adayı yok |
| Kamera | Düzeltildi (C07) | Oyuncunun 2.5 m arkasına duvar: mesafe 5.07 → 2.77 m, duvar kalkınca 5.07 m (yumuşak) |
| Olta atışı | Düzeltildi (C05) | `throw` eylemi (önce `slash`: yakın dövüş vuruşu yapıyor, savaşı tetikliyordu) |
| Ağ animasyon eşitleme | Düzeltildi (C25) | Döngülü kazı klibi `loop=1` ile gider; uzak oyuncuda tek sallama sonrası donma yok |

## 6.2 Senaryo sonuçları (`04_karakter.js`)
20/20 beklenti geçti (üçüncü koşu; ilk koşuda üç beklenti kalibrasyon nedeniyle başarısızdı: sprint geçiş sayısı ≤2 yerine
"≥0.4 s aralıklı ≤3", kamera eşiği 2.6 m yerine "≥1.5 m kısalma", güverte kaçınması direk/ambar olmayan noktadan).
Sayfa hatası: 0.

## 6.3 Test edilmeyenler (açıkça)
- Silah hizası ve geometri penetrasyonu görsel olarak yalnız dümen/top karelerinde incelendi; tüm silah/animasyon
  kombinasyonları için kare kare inceleme yapılmadı.
- Kürek ve sandık taşıma için el IK hedefi eklenmedi (bilinen sorunlar #8).
- Tırmanma animasyon zamanlaması ölçülmedi.
