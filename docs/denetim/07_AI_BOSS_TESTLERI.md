# 7. Düşman AI ve Boss Testleri (Aşama 5)

Ortam: başsız Chromium + SwiftShader, 640×360, `tests/scenarios/05_dusman_ai.js` (19 beklenti). Algı testleri "nöbetçi" rolü ve
her karede oyuncuya dönük bakışla koşturulur (devriye yolu rastgeleliği dışlanır; ölçülen şey algı hattı — mesafe, görüş açısı,
görüş hattı, duyma — ve durum makinesidir). Boss evreleri doğrudan hasar vererek tetiklenir.

## 7.1 Sonuçlar
| # | Konu | Sonuç | Ölçüm / not |
|---|---|---|---|
| 1 | Algı: açık görüş hattında 15 m (görüş 24 m) | GEÇTİ | 3 sn'de farkındalık 1.2, hedef alındı, kuşatma durumu |
| 2 | Algı: 1 m kalın duvar arkası | GEÇTİ | farkındalık 0 (DDA görüş hattı engeli bulur; eski 64 hücre sınırı 15 m'de zaten sınırdaydı) |
| 3 | Duyma: sırtı dönük düşman silah sesi | GEÇTİ | farkındalık 0 → 1.2, son bilinen konum, kuşatma |
| 4 | Yığılma: aynı noktada doğan 4 düşman | GEÇTİ | 2 sn'de en yakın çift 1.32 m |
| 5 | Saldırı telgrafı | GEÇTİ | hazırlık 0.58 sn; vuruş hazırlıktan önce işlenmedi |
| 6 | F-03 sersemlik hafif vuruşla iptal olmaz | GEÇTİ | durum `stunned`, süre korunur |
| 7 | F-05 çağırma hazırlığı vuruşla bozulmaz | GEÇTİ | durum `summon` korunur |
| 8 | F-07 kamp bekleme süresi kayıt/yükleme | GEÇTİ | 123 sn → 123 sn |
| 9 | F-07 tümü öldürülmüş kamp | GEÇTİ | uzaklaşınca bekleme 300 sn (önce: cesetler silinince 0 → anında yeniden doğma) |
| 10 | F-16 tabanca ışını duvar | GEÇTİ | duvarsız: hedef isabet; 1 m duvar arada: isabet yok (önce: duvar yok sayılıyordu) |
| 11 | ek-110 yakalama yavaşlatması | GEÇTİ | 4.40 → 2.42 m/s |
| 12 | F-10 ganimetsiz boss düşmanı | GEÇTİ | noLoot: 0 ganimet/0 XP olayı; normal: 1/1 |
| 13 | F-08 hedefi olan uzak düşman seyreltilmez | GEÇTİ | 100 m: hedefsiz birikim 0.217 s; hedefli aynı karede güncellendi |
| 14 | ek-109 batan gemi tayfası | GEÇTİ | gemi batınca canlı tayfa boğulur |
| 15 | Zayıf nokta (arkadan 1.6×) | GEÇTİ | önden 10, arkadan 16 hasar |
| 16 | Boss evreleri | GEÇTİ | Kızıl Hançer %55'te çağırma; İskelet Kaptan %66/%33'te iki çağırma, %33'te öfke (her vuruşta en çok bir evre — tasarım) |

## 7.2 Test edilmeyenler / statik doğrulananlar
- F-09 (geniş engel etrafından dolaşma): yön koruma mantığı statik olarak doğrulandı; çalışma zamanı dolaşma testi yazılmadı (kararsız olurdu).
- D-19 (deniz bossları karaya oturma): yön sapması statik; boss savaşı senaryosu bu aşamada koşturulmadı.
- Geri çekilme (moral), yardım çağrısı/alarm ve kuşatma açıları: mevcut v0.3 mantığı değiştirilmedi; 3. test kuşatma durumuna geçişi gösterir.
- Co-op'a özgü AI bulguları (F-01, F-02, F-04, F-06, F-11, F-12, F-13, F-15, ek-108/111/112/113) Aşama 6'da ele alınır.
