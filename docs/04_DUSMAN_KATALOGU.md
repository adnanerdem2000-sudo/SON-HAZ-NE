# 4. Düşman Kataloğu (uygulanan)

Kaynak: `js/game/enemies.js` → `ENEMY_TYPES`. Tüm insan ve iskelet modelleri KayKit (CC0) karakterleri ve ortak
iskeletin 89 klipten oluşan animasyon kütüphanesini kullanır; hayaletler aynı gövdelerin yarı saydam, parlayan sürümleridir.

## 4.1 Yapay zekâ özeti
- **Algı:** görüş konisi + görüş hattı (`physics.lineBlocked`: arazi, kaya, ağaç, duvar), gece/sis/eğilme görüşü azaltır;
  **ses olayları** (adım, silah 45 m, top 90 m, patlama 90 m) şüphe yaratır.
- **Durumlar:** devriye → şüpheli → araştırma → kovalama → yan adım/çevreleme → saldırı; ayrıca siper, geri çekilme,
  kaçış, iyileşme, eve dönüş, sendeleme/sersemleme, kaçınma, çağırma, mezardan kalkış, ölüm (toplam 17 durum).
- **Koordinasyon:** saldırı jetonları (aynı anda en fazla 2 yakın saldırgan), kuşatma açıları, grup alarmı, moral şoku
  (lider/arkadaş ölünce kaçma), nişancılar siper arar ve mesafe korur.
- **Telgraf:** her vuruşun hazırlık süresi (`hitAt`) vardır; savuşturulamayan vuruşlar kırmızı parıltıyla işaretlenir.
- **Hareket:** ivmeli yürüme/koşu, çarpıştırıcılara karşı çözümleme (duvar içinden geçme yok), ışınlanma yok;
  uzak düşmanlar düşük sıklıkla güncellenir (AI LOD).
- **Güverte düşmanları:** düşman gemisinin tayfası güvertede durur, kancayla bordalamada oyuncunun gemisine atlar.

## 4.2 Kartlar
### Haydut (`haydut`)
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 100 · **Hasar:** 12 · **Koşu/Yürüyüş:** 4.3/1.5 m/s · **Menzil:** 1.9 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 24 m, görüş açısı 125°, işitme ×1, moral 0.22
- **Roller:** patrol, rest, sentry · **Ganimet:** altin_para 15–40, mermi %40, ekmek %30 · **Deneyim:** 10 (oyuncuya ×2 XP)

### Nişancı (`haydut_nisanci`)
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 80 · **Hasar:** 20 · **Koşu/Yürüyüş:** 3.9/1.4 m/s · **Menzil:** 1.7 m
- **Saldırı seti:** Yumruk/tekme (menzilli birimin yakın savunması); menzilli: Tabanca (95 m/s mermi, 2,4 sn dolum)
- **Algı:** görüş 32 m, görüş açısı 110°, işitme ×1, moral 0.3
- **Roller:** sentry, patrol · **Ganimet:** altin_para 20–45, mermi %80 · **Deneyim:** 12 (oyuncuya ×2 XP)

### Ağır Zırhlı (`haydut_agir`)
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 250 · **Hasar:** 25 · **Koşu/Yürüyüş:** 3/1.2 m/s · **Menzil:** 2.1 m
- **Saldırı seti:** Kalkan (blok, kalkan darbesi, ağır vuruş)
- **Algı:** görüş 20 m, görüş açısı 110°, işitme ×0.8, moral 0.05
- **Roller:** sentry · **Ganimet:** altin_para 30–70, gumus_kulce %40, merhem %30 · **Deneyim:** 25 (oyuncuya ×2 XP)

### Avcı (`haydut_avci`)
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 150 · **Hasar:** 18 · **Koşu/Yürüyüş:** 4.9/1.6 m/s · **Menzil:** 1.8 m
- **Saldırı seti:** Çift bıçak (hızlı kesik, saplama)
- **Algı:** görüş 30 m, görüş açısı 140°, işitme ×1.4, moral 0.15
- **Roller:** patrol · **Ganimet:** altin_para 25–60, hayvan_postu %40 · **Deneyim:** 20 (oyuncuya ×2 XP)

### Haydut Kaptanı (`haydut_kaptani`)
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 500 · **Hasar:** 30 · **Koşu/Yürüyüş:** 3.9/1.4 m/s · **Menzil:** 2.5 m
- **Saldırı seti:** İki el silah (ağır, savuşturulamaz alan vuruşu)
- **Algı:** görüş 26 m, görüş açısı 130°, işitme ×1.1, moral 0
- **Roller:** sentry · **Ganimet:** altin_para 120–220, altin_kulce %60, yakut %30, korsan_madalyonu %25 · **Deneyim:** 60 (oyuncuya ×2 XP)

### Kızıl Hançer (`kizil_hancer`) — boss
- **Grup:** Kızıl Hançer çetesi (insan) · **Can:** 650 · **Hasar:** 26 · **Koşu/Yürüyüş:** 4.5/1.5 m/s · **Menzil:** 2.2 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 30 m, görüş açısı 140°, işitme ×1.2, moral 0
- **Roller:** — · **Ganimet:** altin_para 400–600, kizil_mektup ×1, altin_kulce ×2 · **Deneyim:** 150 (oyuncuya ×2 XP)

### İskelet (`iskelet`)
- **Grup:** İskeletler · **Can:** 90 · **Hasar:** 15 · **Koşu/Yürüyüş:** 3.4/1.2 m/s · **Menzil:** 1.9 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 20 m, görüş açısı 120°, işitme ×1.2 (moral yok: kaçmaz)
- **Roller:** patrol, sentry · **Ganimet:** altin_para 8–25, lanetli_kafatasi %8 · **Deneyim:** 8 (oyuncuya ×2 XP)

### İskelet Nişancı (`iskelet_nisanci`)
- **Grup:** İskeletler · **Can:** 75 · **Hasar:** 22 · **Koşu/Yürüyüş:** 3.2/1.2 m/s · **Menzil:** 1.7 m
- **Saldırı seti:** Yumruk/tekme (menzilli birimin yakın savunması); menzilli: Arbalet (44 m/s ok, 2,0 sn dolum)
- **Algı:** görüş 30 m, görüş açısı 110°, işitme ×1 (moral yok: kaçmaz)
- **Roller:** sentry · **Ganimet:** altin_para 12–30, inci %10 · **Deneyim:** 12 (oyuncuya ×2 XP)

### Ağır İskelet (`iskelet_agir`)
- **Grup:** İskeletler · **Can:** 300 · **Hasar:** 30 · **Koşu/Yürüyüş:** 2.7/1 m/s · **Menzil:** 2.1 m
- **Saldırı seti:** Kalkan (blok, kalkan darbesi, ağır vuruş)
- **Algı:** görüş 18 m, görüş açısı 110°, işitme ×0.8 (moral yok: kaçmaz)
- **Roller:** sentry · **Ganimet:** altin_para 30–60, eski_kilic %25, lanetli_kafatasi %15 · **Deneyim:** 25 (oyuncuya ×2 XP)

### Altın İskelet (`iskelet_altin`)
- **Grup:** İskeletler · **Can:** 450 · **Hasar:** 35 · **Koşu/Yürüyüş:** 3.2/1.2 m/s · **Menzil:** 2 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 22 m, görüş açısı 120°, işitme ×1 (moral yok: kaçmaz)
- **Roller:** sentry · **Ganimet:** altin_para 60–120, altin_kulce %60, yakut %25, altin_heykelcik %10 · **Deneyim:** 40 (oyuncuya ×2 XP)

### İskelet Kaptan Morvan (`iskelet_kaptan`) — boss
- **Grup:** İskeletler · **Can:** 800 · **Hasar:** 35 · **Koşu/Yürüyüş:** 3.4/1.2 m/s · **Menzil:** 2.3 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 30 m, görüş açısı 160°, işitme ×1.5 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 150–250, lanetli_kafatasi ×1, korsan_madalyonu ×1 · **Deneyim:** 200 (oyuncuya ×2 XP)

### Hayalet Korsan (`hayalet`)
- **Grup:** Hayaletler · **Can:** 120 · **Hasar:** 20 · **Koşu/Yürüyüş:** 3.9/1.3 m/s · **Menzil:** 2 m
- **Saldırı seti:** Tek el kılıç (3'lü kombo + bıçaklama)
- **Algı:** görüş 24 m, görüş açısı 150°, işitme ×1.4 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 10–30, inci %25 · **Deneyim:** 15 (oyuncuya ×2 XP)

### Boğulmuş Denizci (`hayalet_bogulmus`)
- **Grup:** Hayaletler · **Can:** 180 · **Hasar:** 25 · **Koşu/Yürüyüş:** 3/1 m/s · **Menzil:** 1.8 m
- **Saldırı seti:** Yumruk/tekme (menzilli birimin yakın savunması)
- **Algı:** görüş 16 m, görüş açısı 120°, işitme ×1.6 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 15–35, istiridye %40, inci %20 · **Deneyim:** 18 (oyuncuya ×2 XP)

### Hayalet Nişancı (`hayalet_nisanci`)
- **Grup:** Hayaletler · **Can:** 100 · **Hasar:** 30 · **Koşu/Yürüyüş:** 3.4/1.2 m/s · **Menzil:** 1.7 m
- **Saldırı seti:** Yumruk/tekme (menzilli birimin yakın savunması); menzilli: Hayalet küresi (güdümlü, 15 m/s)
- **Algı:** görüş 30 m, görüş açısı 150°, işitme ×1.2 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 25–60, eski_mucevher %30 · **Deneyim:** 18 (oyuncuya ×2 XP)

### Lanetli Muhafız (`hayalet_muhafiz`)
- **Grup:** Hayaletler · **Can:** 400 · **Hasar:** 35 · **Koşu/Yürüyüş:** 3/1 m/s · **Menzil:** 2.1 m
- **Saldırı seti:** Kalkan (blok, kalkan darbesi, ağır vuruş)
- **Algı:** görüş 20 m, görüş açısı 120°, işitme ×1 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 50–100, eski_mucevher %50, zumrut %20 · **Deneyim:** 40 (oyuncuya ×2 XP)

### Lanetli Amiral (`lanetli_amiral`) — boss
- **Grup:** Hayaletler · **Can:** 900 · **Hasar:** 38 · **Koşu/Yürüyüş:** 3.6/1.3 m/s · **Menzil:** 2.4 m
- **Saldırı seti:** İki el silah (ağır, savuşturulamaz alan vuruşu)
- **Algı:** görüş 40 m, görüş açısı 360°, işitme ×2 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 400–700, kraliyet_taci ×1, elmas ×1, korsan_madalyonu ×1 · **Deneyim:** 300 (oyuncuya ×2 XP)

### Hayalet Kaptan (`hayalet_kaptan`) — boss
- **Grup:** Hayaletler · **Can:** 1000 · **Hasar:** 40 · **Koşu/Yürüyüş:** 3.7/1.3 m/s · **Menzil:** 2.5 m
- **Saldırı seti:** İki el silah (ağır, savuşturulamaz alan vuruşu)
- **Algı:** görüş 30 m, görüş açısı 170°, işitme ×1.6 (moral yok: kaçmaz)
- **Roller:** — · **Ganimet:** altin_para 300–500, kraliyet_taci %50, elmas ×1 · **Deneyim:** 250 (oyuncuya ×2 XP)
