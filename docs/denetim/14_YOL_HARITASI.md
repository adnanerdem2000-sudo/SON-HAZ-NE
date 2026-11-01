# 14. Yol Haritası (v0.4 sonrası)

Öncelik sırası; her madde için neden ve tahmini iş.

## Kısa vade (kararlılık)
1. **Gerçek GPU doğrulaması**: 60 FPS hedefi, gölge/LOD ayarları ve görsel regresyon yalnız gerçek ekran kartında doğrulanabilir
   (bu ortam SwiftShader). El ile test listesi: 12. belge.
2. **Boss savaşları uçtan uca**: Kraken/Yılan/Taş Muhafız/Volkanik Dev/Amiral — gerçek oynanış ve co-op (ek-108 rün sütunları).
3. **4 oyunculu co-op koşusu** ve gecikme/kayıp emülasyonu (tc/netem olan bir makinede).
4. **Ambar otoritesi**: eşya aktarımını niyet iletilerine çevir (bilinen sorunlar #13).

## Orta vade (co-op dayanıklılığı)
5. **TURN desteği** (13. belge, Aşama A–B): bağlantı türü rozeti ve ICE yapılandırması.
6. **Oda sahibi devri** (13. belge, Aşama A–C): tam dünya anlık görüntüsü, varis, devralma.
7. Telgraf halkaları/iniş işaretleri konukta; Taş Muhafız sütunları; satış yarışı (#14–#16).

## İçerik / keşif
8. Aşama 7 kalemleri (ada ayırt edilebilirliği, kıyı süreksizliği, iskele basamakları) — uygulandıysa 03. belgede.
9. Dikey derinlik: mağara/uçurum/yükselti çeşitliliği; tapınak sunağına erişim (basamak platformları).

## Teknik borç
10. 120 FPS'te ≤%3 entegrasyon farkı için sabit 1/60 birikimli adım + görsel ara değerleme.
11. Dinleyici sızıntıları (H23/H24), rijit cisim entegratörü, yedek kipte üretim bütçesi.
