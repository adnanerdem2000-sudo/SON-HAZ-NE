# 6. Boss Tasarımı (uygulanan)

Kaynak: `js/game/bosses.js`. Her boss evrelidir, saldırıları önceden işaretlenir (yerde kırmızı halka / parıltı),
zayıf noktası vardır, oda sahibi tarafından yönetilir ve konuklara anlık görüntüyle aktarılır. Co-op'ta can
`1 + 0,5 × konuk` ile çarpılır. Yenilince ödül ganimeti düşer, macera günlüğüne yazılır ve +600 XP verilir.

| Boss | Unvan | Can | Tür | Konum | Ödül |
|---|---|---|---|---|---|
| Kraken | Kara Girdabın Efendisi | 3000 | deniz | Kara Girdap Kayaları (Hayalet Denizleri) | altin_para 900–1300, kraliyet_taci ×1, elmas ×2, inci ×4 |
| Derinlik Yılanı | Buzların Altındaki Kraliçe | 2400 | deniz | Derin Yarık Kayalıkları (Buzul) | altin_para 700–1000, zumrut ×2, elmas ×1, antik_vazo ×1 |
| Taş Muhafız | Kadim Tapınağın Bekçisi | 2200 | kara | Kadim Tapınak (Zümrüt Takımadaları) | altin_para 600–900, altin_heykelcik ×2, yakut ×2, antik_vazo ×1 |
| Volkanik Dev | Ateşin Bekçisi | 3200 | kara | Ateş Dağı krateri (Kül Adaları) | altin_para 1000–1500, yakut ×3, elmas ×2, altin_kulce ×3 |
| Lanetli Amiral | Sisin İçindeki Filo | 1400 | deniz + güverte | Sis Adası açıkları (Hayalet Denizleri) | altin_para 900–1400, korsan_madalyonu ×2, kraliyet_taci ×1 |

## 6.1 Kraken
- **Evre 1:** dokunaçlar gemiyi çevreler, telgraflı halkadan sonra güverteye iner (gemi hasarı, oyuncuyu fırlatır).
  Dokunaç kırılabilir (kılıç/tabanca/top); kırılınca baş kısa süre açığa çıkar.
- **Evre 2 (%60):** yüzeye çıkar, mürekkep bulutu; dokunaç gemiyi kavrayıp sarsar. **Zayıf nokta: göz/baş** (top atışı).
- **Evre 3 (%30):** girdap gemiyi merkeze çeker, saldırılar sıklaşır.

## 6.2 Derinlik Yılanı
- Gemiyi çevreler, gövdeye toslar, zehir tükürür, alttan fırlar; **toslamadan sonra baş açıkta** (zayıf nokta).
- Evre 2 (%50) hızlanır, daha fazla mermi; evre 3 (%20) son güç saldırıları.

## 6.3 Taş Muhafız
- Tapınak bulmacası çözülünce uyanır. Yumruk, süpürme, kaya fırlatma (yay atış), tepinme şok dalgası.
- **Evre 2 (%55):** rün sütunları kalkan verir — sütunlar kırılmadan hasar azalır. **Zayıf nokta: sırttaki kristal** (arkadan vuruş).
- Evre 3 (%25): öfke, ×1,35 hız.

## 6.4 Volkanik Dev
- Lav topu yağmuru (düştüğü yerde yanan alanlar), ateş halkası şok dalgası, süpürme.
- **Zayıf nokta: göğüs çekirdeği** — büyük atıştan sonra kısa süre açılır.
- Evre 2 (%60) lav yağmuru sıklaşır; evre 3 (%30) krater patlar, gökten ateş yağar.

## 6.5 Lanetli Amiral
- Hayalet gemi yan yatıp yaylım ateşi açar (gemi bölgesel hasarı). Yarı canında oyuncunun gemisine çatar;
  Amiral ve hayalet tayfası **güverteye çıkar (bordalama)**. Amiral düşünce lanet kalkar, gemi batar.

## 6.6 Tetikleme ve test
Bosslar bölgelerine yaklaşınca doğar (`bosses._check`); test için `DK.bosses.spawn(id)` kullanılabilir.
Beş bossun doğuşu, evre geçişleri ve yenilgi/ödül akışı başsız tarayıcıda doğrulandı (bkz. TEST_RAPORU.md). Volkanik Dev testi, yazılımsal GPU'nun krater sahnesinde çökmesi nedeniyle çekirdek adada çağrılarak yapıldı; boss mantığı konumdan bağımsızdır.
