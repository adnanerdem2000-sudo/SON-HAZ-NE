# v0.5 Tasarım Kararları

Tarih: 14 Kasım 2026.

Faz 2–6 tasarım belgelerinde "kullanıcı onayı" bekleyen karar noktaları var. Kullanıcı açıkça "bana asla bir şey sorma" dediği
için bu kararlar **her belgenin önerdiği varsayılanla** verildi. Aşağıdaki tablolar hangi seçeneğin uygulanacağını kayda geçirir.
Her karar sonradan değiştirilebilir. Değişiklik gerekirse ilgili fazın tasarım belgesindeki "Seçenekler" sütunu alternatifi
ve etkisini gösterir.

Belgeler: `docs/v05/tasarim/FAZ2_AG_GUVENLIGI_TASARIM.md` (§13.10), `FAZ3_SABIT_ADIM_FIZIK_TASARIM.md` (§0),
`FAZ4_KAYIT_KALICILIK_TASARIM.md` (§0), `FAZ5_COOP_TAMAMLAMA_TASARIM.md` (§0.2), `FAZ6_HIKAYE_6_10_TASARIM.md` (§0.3).

## Çakışma çözümü

- **Hikâye, gemi ele geçirme ve batırma XP'si:** Faz 2 K-4 "bugünkü gibi yalnız host'a" diyor, Faz 5 K5-2 "olayın 300 m
  yakınındaki herkese tam" diyor. Faz 2 davranışı değiştirmez. Faz 5 K5-2'yi uygular, Faz 6 K-12 de aynı kuralı kullanır.
  Sonuç: Faz 5'ten itibaren 300 m kuralı geçerlidir.
- **Test adları:** Faz 1 yeni tarayıcı senaryolarını `02_` arazi grubuna ekler (`02_hizli_yolculuk`, `02_arazi_yasam`,
  `02_ayar_lod`, `02_depolama_kapali`). Diğer fazların ayırdığı adlar:

| Faz | Tarayıcı senaryoları | Co-op senaryoları |
|---|---|---|
| Faz 2 | — | `06e`–`06n` |
| Faz 3 | `18`–`22` | — |
| Faz 4 | `23`–`26` | `06o`–`06q` |
| Faz 5 | — | `06r`–`06z` |
| Faz 6 | `27`–`36` | `07a`, `07b` |
| Faz 7 | `37`–`44` | `08a`–`08c` |
| Faz 8 | `45`–`52` | `08d`–`08f` |
| Faz 9 | `53`–`60` | — |

## Faz 2 — Ağ güvenliği

| No | Karar | Uygulanan |
|---|---|---|
| K-1 | Konuk ilerlemesi ve ithalat | Dünya başına profil. "Sınırlı" ithalat: altın ≤ 500, teçhizat ve sarf bağlı, seviye ≤ 10 |
| K-2 | Profil sınırları | 16 profil; saatte 6 yeni profil, sonrası host onayıyla |
| K-3 | Konukta zar | Zarı host atar (`tx{svc, dice}`) |
| K-4 | Hikâye/gemi XP'si | Faz 2'de bugünkü gibi; Faz 5'te K5-2 ile değişir (yukarıya bakın) |
| K-5 | Tek HTML'de CSP | Derleme aracında özetlerle |
| K-6 | Konuğun gemi satın alması, görünüm değiştirmesi, batan gemiyi kurtarması | Kapalı (yalnız host) |
| K-7 | Dal içi geçici işlev kayıpları | Kabul. Ara adımlar yalnız geliştirme dalında kalır; yayın Faz 2'nin son adımından sonra |
| K-8 | Sandık ve tutsak hücresi noktalarının ayrı tohuma alınması | Uygulanır |
| K-9 | Gecikme telafisi (geri sarma) | Varsayılan kapalı; ölçüme göre açılır |
| K-10 | Herkese açık oda uyarı metni | "Oda sahibi bu dünyanın tek yetkilisidir…" |

## Faz 3 — Sabit adımlı fizik

Faz 3 kararları (K1–K9) teknik tasarım kararıdır, kullanıcı onayı gerektirmez:

- STEP = 1/60 s, kare başına en çok 6 adım, kare başına en çok 0,1 s.
- Çizim ara değerlemesi kullanılır.
- Üç zaman ölçeği vardır.
- Girdi kenarları tampona alınır.
- Görüş, mermi ve kamera tek bir `segmentQuery` kullanır.
- Çarpışma katmanları eklenir.
- Ortam saati benzetime bağlanır.
- Eski döngü `?dongu=eski` bayrağıyla korunur.
- Ağ ara değerleme tamponu Faz 5'e bırakılır.

## Faz 4 — Kayıt ve kalıcılık

| No | Karar | Uygulanan |
|---|---|---|
| K-1 | Şema sürümü | `version: 3` + `minReader` |
| K-2 | Kozmetik kilitleri | Hesap düzeyinde kalır; yuvaya satın alma defteri eklenir |
| K-3 | Tek seferlik kaynaklar | Kabuk ve istiridye yenilenir. Tek seferlik düğüm altyapısı içerikle birlikte Faz 6'da gelir |
| K-4 | Konuk profilleri | Faz 2 kararı: `dksh.gbook.<worldId>` |
| K-5 | Gelecek sürüm kaydı | `minReader ≤ 3` ise salt-okunur açılır, kayıt kapalıdır, uyarı görünür |
| K-6 | Demirkapı kayalıkları | Deterministik tek yerleşime bir kez döner |
| K-7 | Bulut hesabı | Bu sürümde yok; yalnız depolama soyutlaması |
| K-8 | Silinen yuvanın geri alınması | 24 saat (`.sil`); kota baskısında ilk o silinir |
| K-9 | Korsan Kodu / host imzalı özet | Faz 5'te (K5-11) |
| K-10 | D-09 kabul ölçütü | Yetkili kopya host'ta (`gbook`); `dksh.guest.0` değişmez |
| K-11 | Kira kilidi / BroadcastChannel | Yok; Web Locks + `saveSeq` |

## Faz 5 — Co-op tamamlama

| No | Karar | Uygulanan |
|---|---|---|
| K5-1 | Host devri | Planlı devir özel odada açık, herkese açık odada kapalı. Çökme devri, güvenlik testleri 10/10 geçene dek kapalı |
| K5-2 | Hikâye/gemi XP'si | Olayın 300 m yakınındaki bütün oyunculara tam |
| K5-3 | TURN | Kodda kullanıcı yapılandırması ve geçici kimlik uç noktası desteği. **Proje sunucusu yok.** Kurulup kurulmayacağına proje sahibi karar verir |
| K5-4 | PeerJS'in ücretsiz TURN'ü | Açık kalır, arayüzde "garantisiz" etiketiyle |
| K5-5 | Zar masası | Meyhane payı %0; 6-6 bonusu zarcının günlük kesesinden |
| K5-6 | Ticaret kısıtları | Yeni profil ilk 20 dk veremez; ithal altın (`gb`) ve bağlı eşya verilemez |
| K5-7 | Dümende yerel tahmin | Bayrakla gelir; gecikme ölçümüne göre açılır |
| K5-8 | Geri sarma altyapısı | Gelir, özellik kapalı başlar |
| K5-9 | Host sekmesi arka plandayken | Worker saatiyle 10 Hz benzetim |
| K5-10 | Çoğunluk yoksa "Tek başına devam et" | Elle seçilir, yeni `worldId` (açık çatal) |
| K5-11 | Korsan Kodu / imzalı özet | Korsan Kodu (S-b) uygulanır, imzalı özet (S-c) ertelenir |
| K5-12 | Oda kodu dünyaya bağlı mı | Evet; yeniden barındırmada önce aynı kod denenir |
| K5-13 | Tek hayatta kalan konuğun devralması | Yalnız host kimliği sinyal sunucusunda yokken otomatik; yoksa 60 sn sonra elle (çatal) |

## Faz 6 — Hikâye 6–10 ve final

| No | Karar | Uygulanan |
|---|---|---|
| K-1 | Yitik Ufuk'un yeri | (300, −2100), Ölü Sis'in içi |
| K-2 | Ölü Sis baştan görünsün mü | Evet, geçilmez sis duvarı olarak; şimşek ve gürleme 5. aşamadan sonra |
| K-3 | Bitki adaylarında sabit çekiliş | Evet (S1) |
| K-4 | Mağaralar | Oyma (A planı); S9 kabul ölçütleri tutmazsa yer üstü oda (B planı) |
| K-5 | Büyük Cezir | Ayrı adımda (S13); tutmazsa Plan B (lagün dolu, final teraslarda) |
| K-6 | Kararları kim verir | Oda sahibi; konuk "Kaptana öner" |
| K-7 | Bölüm araçları | Dünya bayrağı + herkese hatıra eşyası |
| K-8 | PROTO | Faz 5 değeri + 1 |
| K-9 | F-07/F-08/F-09 | Faz 6'da düzeltilir |
| K-10 | Kraken sis kapısında | Zorunlu (önceden yenilmediyse) |
| K-11 | Final sonrası Pusula gücü | Küresel gelgit geçersiz kılma (günde bir kez) |
| K-12 | Aşama XP'si | Faz 5 K5-2 (300 m) |
| K-13 | Kapsam | Önce çekirdek kapsam (§9.2). Çekirdekte her aşamanın yeni alanı, NPC'si, görev zinciri, bulmacası, düşman yeniliği, boss'u, kararı ve ödülü, ayrıca Yitik Ufuk, Ölü Sis, Gelgit'in Gölgesi ve Son Hazine bulunur. Tam kapsamın ek parçaları, çekirdek testleri geçtikten sonra yapılır |
| K-14 | Halat ve asansör | Yok; merdiven platformu ve gayzer |
