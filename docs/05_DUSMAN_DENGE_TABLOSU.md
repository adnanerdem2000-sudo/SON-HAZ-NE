# 5. Düşman Denge Tablosu (uygulanan değerler)

Değerler doğrudan oyunun veri tablosundan alınmıştır (`ENEMY_TYPES`). Hasar, saldırı setindeki çarpanla (`mult`, 0,7–1,8)
ölçeklenir; zorluk ayarı ve gece (hayaletler) ek çarpan uygular.

| Düşman | Can | Hasar | Hız (m/s) | Menzil (m) | Görüş (m) | Açı | İşitme | Moral | XP |
|---|---|---|---|---|---|---|---|---|---|
| Haydut | 100 | 12 | 4.3 | 1.9 | 24 | 125° | 1 | 0.22 | 10 |
| Nişancı | 80 | 20 | 3.9 | 1.7 | 32 | 110° | 1 | 0.3 | 12 |
| Ağır Zırhlı | 250 | 25 | 3 | 2.1 | 20 | 110° | 0.8 | 0.05 | 25 |
| Avcı | 150 | 18 | 4.9 | 1.8 | 30 | 140° | 1.4 | 0.15 | 20 |
| Haydut Kaptanı | 500 | 30 | 3.9 | 2.5 | 26 | 130° | 1.1 | 0 | 60 |
| Kızıl Hançer | 650 | 26 | 4.5 | 2.2 | 30 | 140° | 1.2 | 0 | 150 |
| İskelet | 90 | 15 | 3.4 | 1.9 | 20 | 120° | 1.2 | — | 8 |
| İskelet Nişancı | 75 | 22 | 3.2 | 1.7 | 30 | 110° | 1 | — | 12 |
| Ağır İskelet | 300 | 30 | 2.7 | 2.1 | 18 | 110° | 0.8 | — | 25 |
| Altın İskelet | 450 | 35 | 3.2 | 2 | 22 | 120° | 1 | — | 40 |
| İskelet Kaptan Morvan | 800 | 35 | 3.4 | 2.3 | 30 | 160° | 1.5 | — | 200 |
| Hayalet Korsan | 120 | 20 | 3.9 | 2 | 24 | 150° | 1.4 | — | 15 |
| Boğulmuş Denizci | 180 | 25 | 3 | 1.8 | 16 | 120° | 1.6 | — | 18 |
| Hayalet Nişancı | 100 | 30 | 3.4 | 1.7 | 30 | 150° | 1.2 | — | 18 |
| Lanetli Muhafız | 400 | 35 | 3 | 2.1 | 20 | 120° | 1 | — | 40 |
| Lanetli Amiral | 900 | 38 | 3.6 | 2.4 | 40 | 360° | 2 | — | 300 |
| Hayalet Kaptan | 1000 | 40 | 3.7 | 2.5 | 30 | 170° | 1.6 | — | 250 |

## 5.1 Saldırı zamanlamaları (hazırlık = kaçınma/parry penceresi)
| Set | Vuruşlar (hazırlık sn / çarpan) |
|---|---|
| Tek el kılıç | 0,42 / 1,0 · 0,44 / 1,0 · 0,52 / 1,3 (geri itme) · 0,58 / 1,15 (uzun menzil) |
| Kalkan | 0,50 / 1,0 · kalkan darbesi 0,38 / 0,7 (güçlü itme) · 0,68 / 1,35 |
| İki el | 0,52 / 1,0 · 0,62 / 1,1 · **ağır 1,15 / 1,8 — savuşturulamaz, 2,2 m alan** |
| Çift bıçak | 0,40 / 0,85 · 0,47 / 1,0 · 0,55 / 1,2 |
| Yumruk/tekme | 0,44 / 1,0 · 0,52 / 1,1 · tekme 0,45 / 1,2 (itme) |
| Kaptan özel | Dönen kılıç (3 vuruş, 360°, savuşturulamaz) · hamle (9 m atılma, savuşturulamaz) |

## 5.2 Oyuncu tarafı (karşılaştırma için)
- Oyuncu canı 100 (+15/rütbe "Demir Bilek"), pala 24 / usta pala 34 hasar (kombo ve ağır vuruş çarpanlarıyla), tabanca 48 / gümüş kakmalı 62; yumruk 9.
- Parry penceresi kısa ve ödüllüdür (karşı saldırı, sersemletme); blok dayanıklılık harcar, ağır vuruş korumayı kırar.
- Arkadan vuruş zırhlı/kalkanlı düşmanlara ek hasar verir (zayıf nokta).

## 5.3 Co-op ölçekleme
Bosslarda can, oyuncu başına +%50 artar (`1 + 0,5 × konuk sayısı`); kamp düşmanları sayı olarak sabittir.
