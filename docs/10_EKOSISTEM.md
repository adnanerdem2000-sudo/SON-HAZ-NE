# 10. Ekosistem Dokümanı (uygulanan)

Kaynaklar: `js/wildlife/animals.js`, `js/wildlife/fish.js`, `js/wildlife/fishing.js`, `js/wildlife/megafauna.js`.

## 10.1 Kara hayvanları (15 tür, 193 doğma bölgesi)
Davranış: dolaşma, otlama/yemek, dinlenme, gece uyku, kaçma, saldırı, pusu (timsah suda), tünemek (papağan),
merak ve muz çalma (maymun); vurulunca tepki animasyonu, ölünce ganimet (post, deri, inci…). Bölgeler oyuncu
yaklaşınca (150 m) doğar, uzaklaşınca (230 m) boşaltılır; içinde hayvan öldürülmüş bölge 2 dakika boyunca yeniden dolmaz.

| Tür | Can | Hasar | Yürüme/koşu (m/s) | Tutum | Nerede |
|---|---|---|---|---|---|
| Yaban Domuzu | 120 | 20 | 2.2/7 | köşeye sıkışınca / koşarak yaklaşılınca saldırır | Cangıl, büyük tropik adalar |
| Maymun | 35 | — | 2.5/6.5 | kaçar | Çekirdek ada, Cangıl |
| Timsah | 250 | 35 | 1.4/5.5 | alanına gireni saldırır | Lagün, Timsah Bataklığı havuzları |
| Papağan | 8 | — | 6/9 | kaçar | Palmiyeler (tüner), Cangıl, tropik adalar |
| Zehirli Yılan | 50 | 10 | 1.2/2.5 | çok yaklaşanı ısırır (zehir) | Cangıl, çöl, volkan, tropik |
| Kurt | 90 | 16 | 2.4/8.5 | sürü: gece 16 m, gündüz 8 m içinde saldırır, sürüyü çağırır | Buzul adaları (Kurt Adası: iki sürü) |
| Tilki | 30 | — | 2/8 | kaçar | Buzul, büyük çöl adaları |
| Geyik | 60 | — | 1.6/9.5 | kaçar | Büyük buzul adaları |
| Erkek Geyik | 110 | 18 | 1.6/9 | köşeye sıkışınca / koşarak yaklaşılınca saldırır | Büyük buzul adaları |
| Kutup Ayısı | 400 | 45 | 1.6/7.5 | alanına gireni saldırır | Buzul biçimli / büyük buzul adaları (kıyıya yakın) |
| Kar Canavarı | 380 | 38 | 1.8/6.5 | alanına gireni saldırır | Yalnızca Buzdişi Adası |
| Dev Yengeç | 180 | 25 | 1.4/4.2 | alanına gireni saldırır | Volkan ve çöl kumsalları |
| Yengeç | 15 | — | 1.6/3.5 | kaçar | Tüm biyomların kumsalları |
| Lagün Kurbağası | 6 | — | 1/3 | kaçar | Lagün ve bataklık kıyısı |
| Mağara Yarasası | 10 | — | 5/8 | kaçar | Yankı Mağarası |

## 10.2 Deniz devleri
| Canlı | Davranış |
|---|---|
| Kambur Balina | 13,5 m; yüzeyde 7–12 sn'de bir nefes (V biçimli sis sütunu), 22–36 sn sonra kuyruğunu kaldırıp dalar, 30–60 sn derinde yüzer; oyuncu yakınsa %30 olasılıkla sudan fırlar (yakın gemi yalpalar). %35 olasılıkla yavrusuyla gezer. Gemilerden kaçınır. |
| Orka (Katil Balina) | 3–5'lik sürü, yüzeyi kavisli kırarak yüzer; hızlı giden gemilerin bordasında 25 sn yüzer, bir orka başını sudan çıkarıp izler (spyhop). **Yüzen oyuncuyu avlar:** 5 sn çevrede döner (uyarı), sonra tek tek dalarak 14 hasar verir (orka başına 8–11 sn bekleme). Vurulursa saldırgana döner ya da kaçar. |
| Yunus | 4–7'lik sürü, sudan tamamen çıkan sıçrayışlar ve su sıçraması; 3 m/s üstünde giden geminin pruvasına gelip hızına kilitlenir (70 sn). |
| Hayalet Balina | Yalnızca Hayalet Denizleri'nde, gece ya da sisli havada; yarı saydam, ışıldayan, iz bırakan, ürkütücü şarkılı; gemilerin içinden geçer. |
| Kaplan köpekbalığı | Derin suda belirir, yüzene saldırır, daire çizer; vurulunca kaçar. |
| Manta, deniz kaplumbağası, çekirdek yunus sürüsü | Çekirdek takımada sularında dolaşır. |

Doğurma kuralları (bölge başına grup hedefi): Ticaret Denizi balina 1, yunus 2 · Zümrüt Takımadaları balina 2, yunus 2 ·
Buzul balina 2, orka 1 · Kül Adaları yunus 1 · Kızıl Kum balina 1, orka 1, yunus 1 · Hayalet orka 1, hayalet balina 1 (gece/sis).

## 10.3 Balıklar (32 tür)
Sürü hareketi (ayrılma/hizalanma/bütünlük), avcıdan kaçış, şişen balon balığı; resif ve açık deniz bölgeleri,
bölgeye özgü türler. Olta mini oyunu bölgeye ve yeme göre türü seçer.

| Balık | Nadirlik | Bölge tipi | Bulunduğu denizler | Değer |
|---|---|---|---|---|
| Palyaço Balığı | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 18 |
| Melek Balığı | Nadir | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 55 |
| Kelebek Balığı | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 22 |
| Papağan Balığı | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 40 |
| Cerrah Balığı | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 26 |
| Balon Balığı | Nadir | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 60 |
| Aslan Balığı | Nadir | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 75 |
| Kırmızı Snapper | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 45 |
| Baraküda | Nadir | Açık deniz | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları, Kül Adaları | 90 |
| Orkinos | Epik | Açık deniz | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları, Kül Adaları | 260 |
| Sardalya | Sıradan | Açık deniz | Her yer | 6 |
| Dev Orfoz | Epik | Resif | Ticaret Denizi, Zümrüt Takımadaları, Kızıl Kum Kıyıları | 320 |
| İstavrit | Sıradan | Açık deniz | Ticaret Denizi, Kızıl Kum Kıyıları | 9 |
| Çipura | Yaygın | Resif | Ticaret Denizi, Kızıl Kum Kıyıları | 38 |
| Kefal | Yaygın | Resif | Ticaret Denizi, Zümrüt Takımadaları | 20 |
| Morina | Yaygın | Açık deniz | Buzul Denizi | 48 |
| Ringa | Sıradan | Açık deniz | Buzul Denizi | 8 |
| Somon | Nadir | Resif | Buzul Denizi | 95 |
| Kalkan | Nadir | Resif | Buzul Denizi, Ticaret Denizi | 110 |
| Buz Balığı | Epik | Açık deniz | Buzul Denizi | 240 |
| Kor Balığı | Nadir | Resif | Kül Adaları | 120 |
| Kükürt Yılan Balığı | Nadir | Resif | Kül Adaları | 85 |
| Obsidyen Vatoz | Epik | Açık deniz | Kül Adaları | 280 |
| Lüfer | Yaygın | Açık deniz | Kızıl Kum Kıyıları, Ticaret Denizi | 52 |
| Levrek | Nadir | Resif | Kızıl Kum Kıyıları, Ticaret Denizi | 78 |
| Zargana | Yaygın | Açık deniz | Kızıl Kum Kıyıları, Zümrüt Takımadaları | 26 |
| Kılıç Balığı | Epik | Açık deniz | Zümrüt Takımadaları | 420 |
| Napolyon Balığı | Epik | Resif | Zümrüt Takımadaları | 300 |
| Uçan Balık | Yaygın | Açık deniz | Zümrüt Takımadaları, Ticaret Denizi | 30 |
| Müren | Nadir | Resif | Zümrüt Takımadaları, Kızıl Kum Kıyıları | 95 |
| Fener Balığı | Epik | Açık deniz | Hayalet Denizleri | 350 |
| Hayalet Balık | Nadir | Açık deniz | Hayalet Denizleri | 140 |

## 10.4 Bağlama duyarlı deniz olayları (ekosistemle ilişkili)
Işıldayan plankton (ılık sular, gece), buzdağları (Buzul), hayalet ışıklar (Hayalet Denizleri), martıların işaret
ettiği balık sürüsü, fırtına sonrası enkaz alanı.
