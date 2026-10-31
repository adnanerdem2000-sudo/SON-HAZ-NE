# 5. Fizik ve Gemi Testleri (Aşama 3)

Ortam: başsız Chromium + SwiftShader (yazılımsal GPU), 640×360, `tests/harness/run.cjs`. Fizik testleri **oyun döngüsünü
doğrudan sabit adımlarla** ilerletir (`DK.game.update(dt)`), bu yüzden ölçülen değerler kare süresinden değil yalnızca
benzetimden etkilenir ve gerçek bir ekran kartında da aynı çıkar. FPS değerleri bu ortamda donanım değeri değildir.

## 5.1 Kare hızı tutarlılığı (`tests/scenarios/03_fizik_dt.js`)

Aynı girdi 15 / 30 / 60 / 120 FPS adımlarıyla benzetildi. "Önce" = `762f1c7` (v0.3), "Sonra" = Aşama 3 (sabit alt adımlı döngü).

| Ölçüm | 15 FPS | 30 FPS | 60 FPS | 120 FPS | Yayılım önce → sonra |
|---|---|---|---|---|---|
| Yürüme 3 sn (m) önce | 12.650 | 12.616 | 12.596 | 12.585 | %0.5 |
| Yürüme 3 sn (m) sonra | 12.596 | 12.596 | 12.596 | 12.585 | **%0.1** |
| Sprint 3 sn (m) önce | 20.291 | 20.209 | 20.164 | 20.140 | %0.7 |
| Sprint 3 sn (m) sonra | 20.165 | 20.165 | 20.165 | 20.141 | **%0.1** |
| Zıplama tepe (m) önce | 1.000 | 1.122 | 1.183 | 1.214 | %19 |
| Zıplama tepe (m) sonra | 1.183 | 1.183 | 1.183 | 1.214 | **%2.6** (yalnız 120 FPS) |
| Kaçınma mesafesi (m) önce | 5.611 | 5.416 | 5.317 | 5.267 | %6.4 |
| Kaçınma mesafesi (m) sonra | 5.317 | 5.317 | 5.317 | 5.267 | **%0.9** |

Yorum: 60 FPS'in altındaki tüm kare hızları artık 60 FPS ile birebir aynı sonucu verir (alt adım ≤ 1/60 sn). 120 FPS'te
alt adım 1/120 sn olduğu için yarı-örtük Euler entegrasyonundan kaynaklanan ≤ %3 fark kalır; bu, sabit 1/60 birikimli adım +
görsel ara değerleme ile sıfırlanabilir (yol haritasında; şimdilik his bozulmaması için bilinçli olarak yapılmadı).

Gemi (12 sn tam yelken + 8 sn dümen): 80.5–87.0 m yol, 165–175° dönüş. Rüzgâr esintileri ve dalga rastgele olduğundan bu
ölçüm koşular arasında ±%4 oynar; kare hızına bağlı sistematik bir eğilim görülmedi (önce de sonra da aynı bant).
Rijit cisim düşüşü (`bodies.update` doğrudan çağrılır): 15–60 FPS'te aynı, 120 FPS'te x ekseninde 1.3 m fark (kendi iç
entegratörü; oyun döngüsünde artık ≤ 1/60 adımla çağrıldığı için 60 FPS ve altı tutarlıdır).

## 5.2 Düzeltme doğrulamaları (`tests/scenarios/03_fizik_duzeltmeler.js`)

Koşu: sakin makinede (doğrulayıcı iş akışları duraklatılmış), 13/13 geçti. Daha önceki iki koşuda son adımlar
"Target crashed" ile kesilmişti; `dmesg` bunun bellek grubu OOM öldürmesi olduğunu gösterdi (aynı anda 16–18 tarayıcı
süreci) — kodla ilgisi yok, kayıt için not edildi.

| # | Senaryo | Sonuç | Ölçüm |
|---|---|---|---|
| 1 | Alt adım sayısı 1/15 s → 4, 1/60 s → 1, 0.1 s → 6 (üst sınır) | GEÇTİ | — |
| 2 | 1/15 s karede basılı zıplama tuşu tek zıplama üretir (kenar tetikleyici alt adımlarda kapalı) | GEÇTİ | 1 zıplama / 30 kare |
| 3 | Geri tepme mesafesi 15/60/144 FPS | GEÇTİ | 1.597 / 1.597 / 1.439 m (144 FPS'te %10 az: alt adım 1/144) |
| 4 | 1.44 m derinlik bandında yüzme↔yürüme titreşimi | GEÇTİ | 4 sn'de 1 geçiş (önce: her karede) |
| 5 | Düşük dayanıklılıkta savunma bayrağı | GEÇTİ | 3 sn'de 2 geçiş: başla → tükenince bırak (önce: kare kare) |
| 6 | `lineBlocked` 400 m doğru: engel bulunur / boş doğruda bulunmaz / kaldırılınca bulunmaz | GEÇTİ | önce: 64 hücre üstü her zaman `false` |
| 7 | Mermi süpürmesi: kutu içinden başlayan parça engellenir (`tMin=0`) | GEÇTİ | — |
| 8 | 1.5 km taşınan demirli gemi eski çapa noktasına çekilmez | GEÇTİ | 3 sn'de 0.38 m, 0.09 m/s (önce: 790 m/s, 1209 m) |
| 9 | Kinematik (ticaret) gemiye 4 m/s çarpma | GEÇTİ | NaN yok, hasar 30/100, geri sekme −1.2 m/s (önce: hız alanı tanımsız → tepki yok / 1e6 kat hasar) |
| 10 | 5 m yüksek platforma yandan yürüme | GEÇTİ | oyuncu bloğun dışında kaldı (önce: içinde yürüyor) |
| 11 | 120 m/s gülle tek adımda 4.4 m'lik gövdeyi aşsa da isabet | GEÇTİ | gemi 100→86 HP, gülle kaldırıldı (nokta testi kaçırırdı) |
| 12 | Yüzen oyuncu 20 km harita kenarı | GEÇTİ | x ≤ 9750 (sınır 9750) |
| 13 | Düzeltmelerden sonra 2 sn oyun döngüsü hatasız | GEÇTİ | sayfa hatası yok |
