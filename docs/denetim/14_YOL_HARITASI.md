# 14. Yol Haritası (v0.4 sonrası)

Öncelik sırası; her madde için neden ve tahmini iş.

## Kısa vade (kararlılık)
1. **Gerçek GPU doğrulaması**: 60 FPS hedefi, gölge/LOD ayarları ve görsel regresyon yalnız gerçek ekran kartında doğrulanabilir
   (bu ortam SwiftShader). El ile test listesi: 12. belge.
2. **Boss savaşları uçtan uca**: Kraken/Yılan/Taş Muhafız/Volkanik Dev/Amiral — gerçek oynanış ve co-op (ek-108 rün sütunları).
3. **Gecikme/kayıp emülasyonu** (tc/netem olan bir makinede) ve farklı ağlardan gerçek 2–4 oyunculu deneme (4 oyunculu yerel koşu Aşama 9'da yapıldı, 08. belge §8.3).
4. **Ambar otoritesi**: eşya aktarımını niyet iletilerine çevir (bilinen sorunlar #13).

## Orta vade (co-op dayanıklılığı)
5. **TURN desteği** (13. belge, Aşama A–B): bağlantı türü rozeti ve ICE yapılandırması.
6. **Oda sahibi devri** (13. belge, Aşama A–C): tam dünya anlık görüntüsü, varis, devralma.
7. Telgraf halkaları/iniş işaretleri konukta; Taş Muhafız sütunları; satış yarışı (#14–#16).

## İçerik / keşif
8. Aşama 7 kalemleri uygulandı (03. belge Aşama 7, 15. belge): ada ayırt edilebilirliği, kıyı dikişi, ana liman merdiveni. Kalan: yeni liman iskelelerine sudan çıkış ve barınak (#23), arazi-farkında otomatik özellik yerleşimi ve çeşitlilik (#22). (#21 ve #24 Aşama 7 devamında kapatıldı.)
9. Dikey derinlik: mağara/uçurum/yükselti çeşitliliği; tapınak sunağına erişim (basamak platformları).

## Teknik borç
10. 120 FPS'te ≤%3 entegrasyon farkı için sabit 1/60 birikimli adım + görsel ara değerleme.
11. Rijit cisim entegratörü, yedek kipte üretim bütçesi. (H23/H24 dinleyici sızıntıları Aşama 8'de kapatıldı.)

## Performans (Aşama 8–9 ölçümlerinden)
12. **Çizim çağrısı**: kit karakteri 14–29 ayrı örgü (NPC başına 13–32 çağrı) → gövde parçalarının tek iskeletli örgüde
    birleştirilmesi; prosedürel hayvan parçalarının birleştirilmesi; gölge atan nesne budaması (limanda gölge geçişi 258 çağrı).
13. **Kare başına Blink çöpü**: mini harita tuvali ve HUD stil yazımları kare başına ~5 KB Blink nesnesi üretir (gerçek zamanlı
    oynanışta toplanıyor, bellek düz); mini harita çizimini değişmeyen katmanları önbelleğe alarak (taban+sis bir kez, yalnız
    işaretler her kare) azaltmak.
14. **Kaynak ömrü kuralı**: yeni sistemlerde `disposeTree` (js/core/dispose.js) ya da paylaşımlı kaynak kullanımı; `09_performans.js`
    oluştur/kaldır döngüleri her yeni nesne türü için genişletilmeli.
15. **Kalan bellek ayırıcıları** (10. belge §10.8.4; bilinen #30): yelken normallerini yalnız yelken biçimi değiştiğinde ya da birkaç
    karede bir hesaplamak (ya da elle yazılmış ayırmasız normal hesabı), `ocean.heightAt`/`shoreFactor`'ı satır içi ve ayırmasız yapmak,
    balıklar için zemin/yüzey örneğini sürü düzeyinde önbelleğe almak, karakter IK yolundaki `new Vector3` çağrılarını geçici nesnelere
    çevirmek. Hedef: büyük çöp toplama sıklığını yarıya indirmek.
16. **Gölgelendirici ön derlemesi** (bilinen #31): ada grubunu sahneye eklemeden önce `renderer.compileAsync(grup, kamera, sahne)`;
    düşman/boss/hayvan malzeme çeşitlerini yükleme ekranında görünmez örneklerle derlemek.
17. **Ada kurulumunda soğuk ilk adım**: oturumdaki ilk liman kurulumunda yapı yerleşimi tek adımda ~12 ms (kit parçası önbelleği soğuk);
    `_port`'u da üretece çevirmek ya da kit parçalarını yükleme ekranında ısıtmak.
18. **Kumsalda yüzme/yürüme kip titreşimi** (bilinen #33): `player.js` giriş (`_updateGround`) ve çıkış (`_updateSwim`) kararlarında platform
    dışı için de `_wlp` (4 sn alçak geçiren su düzeyi) kullanmak; dalga tepesinde boyun hizasında yürüme görseli kabul edilebilir mi el ile
    bakılmalı. Doğrulama: sığ su bandı kontrolünün 30 dalga anı tekrarı (hedef 0/30 başarısız) + `07_dunya_kesif` D03 sudan çıkış.19. **LOD'dan bağımsız ada yerleşimi** (bilinen #35): bitki örtüsü ve yapı döngülerinde aday başına sabit sayıda rastgele sayı çekmek
    (reddedilse bile) ya da yerleşim kararlarını LOD'dan bağımsız analitik yükseklikle (`computeHeight`) vermek. Bu tüm adaların görünümünü
    bir kez değiştirir (kayıtlar etkilenmez); co-op'ta ev sahibi/konuk aynı yerleşimi görür.
20. **Konuk düşme nedeninin görünürlüğü** (bilinen #37): ev sahibi bir konuğu kalp atışıyla düşürdüğünde kapatmadan önce `kick` iletisiyle
    neden göndermek (konukta "bağlantı koptu" yerine gerçek neden), `coop.cjs`'in `console.warn` iletilerini de rapora yazması; 4 oyunculu
    testte konukları sırayla başlatırken önceki konukların çizimini kısmak (`fpsLimit` başlatmadan önce).

