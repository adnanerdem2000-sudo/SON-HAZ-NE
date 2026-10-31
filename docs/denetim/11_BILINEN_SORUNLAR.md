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
