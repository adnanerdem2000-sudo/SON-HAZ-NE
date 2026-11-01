# 11. Bilinen ve Çözülmemiş Sorunlar (sürekli güncellenir)

| # | Konu | Durum | Not |
|---|---|---|---|
| 1 | 120 FPS'te zıplama tepe noktası ≤%3 farklı | Açık (düşük) | Alt adım 1/120 s; sabit 1/60 birikimli adım + görsel ara değerleme gerekir |
| 2 | Gemi hız/dönüş testi koşular arası ±%4 oynar | Açık (test) | Rüzgâr esintisi/dalga rastgele; tohumlanabilir rastgelelik yok |
| 3 | Yedek (işçisiz) kipte uzak bölge hazırlığı ağır CPU yükünde 45 s sınırına ulaşabiliyor | Açık (orta) | Yalnız yazılımsal GPU + 4 paralel tarayıcı yükünde görüldü; eksik karolar arka planda tamamlanır, oyun oynanabilir kalır |
| 4 | Yuvarlanan kaya ezmek üzere olduğu fıçı/sandıktan önce sekiyor (D-11) | Açık (düşük) | Çarpıştırıcı iptal etiket filtresi gerekir |
| 5 | Güvertedeki oyuncu kalabalık itişmesinde ajan değil (D-20) | Açık (düşük) | Bordalama düşmanları oyuncunun içinden geçebilir — Aşama 5'te değerlendirilecek |
| 6 | Deniz bossları arazi kontrolü yapmıyor (D-19) | Açık | Aşama 5 |
| 7 | Gemi gövdesi kamera çarpışmasına dahil değil | Açık (düşük) | Yalnız fizik çarpıştırıcıları (kaya/duvar/bina) |
| 8 | Kürek/sandık için el IK hedefleri yok | Açık (düşük) | Dümen ve top için eklendi (Aşama 4); kürek/sandık geometrisi için ölçüm gerekir |
| 9 | Test ortamı: aynı bellek grubunda 16+ tarayıcı süreci çalışırken test sayfaları OOM ile öldürülüyor ("Target crashed") | Ortam | Doğrulayıcı iş akışları ile oyun testleri sırayla koşturulur; kodla ilgisi yok |
| 10 | Yedek (işçisiz) kipte ana iş parçacığı üretimi 60 FPS'lik gerçek makinede kare süresini uzatır (dilim 10–20 ms) | Açık (tasarım) | Yalnız işçi kurulamayan ortamlar; tek dosya sürümü artık data: URL işçisiyle çalışıyor |
| 11 | F-09 geniş engel dolaşma: yalnız statik doğrulandı | Açık (test) | Çalışma zamanı dolaşma senaryosu yazılmadı |
| 12 | Boss savaşları (Kraken/Yılan/Taş Muhafız/Volkanik Dev/Amiral) bu ortamda uçtan uca oynanmadı | Açık (test) | Evre/ödül mantığı birim düzeyinde test edildi; tam savaş gerçek GPU'da el ile doğrulanmalı |
| 13 | Ambar içeriği (`hold`) konuk tarafından bildirilir; ev sahibi sınır/yakınlık doğrular ama tam ev sahibi otoritesi yok | Açık (orta) | Eşya aktarımını niyet iletilerine (put/take) çevirmek gerekir; yol haritasında |
| 14 | Taş Muhafız rün sütunları konukta oluşmuyor (ek-108) | Açık (orta) | Boss `netExtra` ile sütun durumu yayınlanmalı |
| 15 | Düşman telgraf halkaları ve iniş işaretleri konukta görünmüyor (mermiler görünüyor) | Açık (düşük) | F-06'nın ikinci yarısı |
| 16 | Ambardaki sandığı ev sahibi ve konuk aynı anda satabilir (B16) | Açık (düşük) | Satış niyeti ev sahibinde sıraya alınmalı |
| 17 | Ana menü 'DEVAM ET' online kayıt yuvasını taşımıyor (H18) | Açık (düşük) | |
| 18 | Dünya haritası/karakter oluşturucu dinleyici sızıntıları (H23/H24) | Açık (düşük) | Aşama 8'de ele alınacak |
| 19 | Yuvarlanan kaya durumu kaydedilmiyor (yüklemede yeniden kurulur) | Açık (düşük) | |
| 20 | Dost ateşi seçeneği kaldırıldı; oyuncular arası hasar yok (tasarım kararı) | Kapalı (kayıt) | İleride PvP istenirse yakın dövüş/ışın uzak oyuncuları hedef almalı |
| 21 | `swamp`/`atoll` şekilli 13 adacıkta kıyı profili dik (0,25 m'de 1,5 m'ye kadar yükselir; sürekli rampa, dikiş değil) | Açık (düşük, tasarım) | Bataklık için düz/alçak kıyı profili; atol halkası için yumuşak kumsal (geo.js şekil fonksiyonları) |
| 22 | Otomatik adacık özellikleri yalnız şekle göre seçilir (arazi sorgusu `archipelago.js` içinde yapılamaz: `geo.js` bu modülü içe aktarır); bu yüzden volkan/spire/bataklık adacıkları hep batık aldı, fener/mezarlık seçilmedi | Açık (düşük, çeşitlilik) | Arazi-farkında yerleşim ada kurulurken (`islands.js`, `terrain.heightAt` ile aday açı denemesi) |
| 23 | Yalnız ana limanda denize inen merdiven var; yeni liman iskelelerine (ports.js) sudan çıkış yok (B-07'nin ikinci yarısı) | Açık (orta) | `islands._pier` için aynı basamak yapısı; kumsaldan iskeleye basamak |
| 24 | Liman kanalı 9 m derin olduğundan merdivende dalga sönümsüz (±1,1 m, fırtınada daha çok): su hattındaki basamakta duran oyuncu dalga tepesinde yine de suya girebilir (0,5 s gecikme ve 0,3 m derin eşikle seyrekleştirildi, sıfırlanmadı) | Açık (düşük) | Merdiven çevresinde yerel dalga sönümü (`ocean.shoreFactor` için yapay sığlık) ya da platformda tam histerezis |
