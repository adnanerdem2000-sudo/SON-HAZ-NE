# v0.5 Tasarım Kararları

Tarih: 14 Kasım 2026.

Faz 2–6 tasarım belgelerinde "kullanıcı onayı" bekleyen karar noktaları var. Kullanıcı açıkça "bana asla bir şey sorma" dediği
için bu kararlar **her belgenin önerdiği varsayılanla** verildi. Aşağıdaki tablolar hangi seçeneğin uygulanacağını kayda geçirir.
Her karar sonradan değiştirilebilir. Değişiklik gerekirse ilgili fazın tasarım belgesindeki "Seçenekler" sütunu alternatifi
ve etkisini gösterir.

Belgeler: `docs/v05/tasarim/FAZ2_AG_GUVENLIGI_TASARIM.md` (§13.10), `FAZ3_SABIT_ADIM_FIZIK_TASARIM.md` (§0),
`FAZ4_KAYIT_KALICILIK_TASARIM.md` (§0), `FAZ5_COOP_TAMAMLAMA_TASARIM.md` (§0.2), `FAZ6_HIKAYE_6_10_TASARIM.md` (§0.3),
`FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md` (§0.2), `FAZ8_PERFORMANS_TASARIM.md` (§0.2), `FAZ9_YAYIN_GUVENLIGI_TASARIM.md` (§0.3).

## Çakışma çözümü

- **Hikâye, gemi ele geçirme ve batırma XP'si:** Faz 2 K-4 "bugünkü gibi yalnız host'a" diyor, Faz 5 K5-2 "olayın 300 m
  yakınındaki herkese tam" diyor. Faz 2 davranışı değiştirmez. Faz 5 K5-2'yi uygular, Faz 6 K-12 de aynı kuralı kullanır.
  Sonuç: Faz 5'ten itibaren 300 m kuralı geçerlidir.
- **Faz 7'nin ilk adımı öne alınır:** F7-0 kod değiştirmez; mevcut düşman, boss, savaş, animasyon ve kamera davranışını
  37–44 numaralı senaryolarda "gözlem" kipinde kayda geçirir. Kullanıcının "yeni içerik eklemeden önce mevcut davranışları test
  et" isteği yüzünden **Faz 6'nın yeni düşman türlerini ekleyen adımından (S6) önce** koşulur. Faz 2–5'ten sonra koştuğu için
  tabanı v0.4 değil, o anki koddur (`tests/out/faz7_taban.json`). Faz 7'nin geri kalanı (F7-1…F7-19) Faz 6'dan sonra gelir.
- **Faz 9'un üç adımı Faz 1'in başına alınır (K9-16):** test koşucusunun sıkılaştırılması ve rapor şeması 2 (Y1), test kipi
  (`?test=1` + yerel köken; `testmode.js`, `kancalar.js`, `surum.js`, `__dkDurum`; Y3) ve v0.5 dalındaki `pages.yml`'nin yayın
  işine dal koşulu (Y9a). Gerekçe: Faz 2, 5 ve 6 `?test=1`'e dayanıyor; hata yutan koşucuyla alınan faz sonuçları güvenilir
  değil; üretimde açık test parametreleri (K-08) ve koşulsuz elle yayın tetiklemesi (K-03) güvenlik açığıdır (kullanıcının
  "acil güvenlik düzeltmeleri" istisnası). Bu yüzden "K-08 Faz 9'da" notu geçersizdir.
- **Faz 3'ün test adları (K9-17):** Faz 3 tasarımındaki `23_guverte`, `24_sandik`, `25_yuksek_dusme`, `26_gulle_nesne` Faz 4'ün
  `23`–`26` ayırmasıyla çakışıyordu. Yeni adlar: `22a_guverte`, `22b_sandik`, `22c_yuksek_dusme`, `22d_gulle_nesne`; eksik gemi
  dalga testi `22e_gemi_dalga` Faz 3'e atanır. Kontrol kodları raporlarda her zaman senaryo adıyla yazılır
  (`25_yuksek_dusme:YD01` gibi), çünkü Faz 3 ve Faz 9 aynı kısa kodları kullanıyor.
- **Doğru şifreyle odaya katılım (T23'ün olumlu yolu)** Faz 2'nin `06j` senaryosuna eklenir.
- **Depo ve Pages ayarları (Faz 9 [KU] maddeleri, K9-2, K9-10, K9-18):** dal kuralı (ruleset), `github-pages` ortamının dal
  politikası ve Pages kaynağının "GitHub Actions" yapılması depo sahibinin ayarıdır. Bu oturumda **uygulanmaz**: kullanıcı depo
  ayarlarının değiştirilmesini istemedi, bu ortamın vekili `/pages` ve `/environments` uçlarını reddediyor ve PR zorunlu bir
  kural sahibin kendi doğrudan gönderimlerini de engeller. Adımlar DEPLOYMENT_REPORT'ta yazılır. Bu süre boyunca koruma:
  oturum yalnız `claude/v0.5-saglamlastirma` dalına gönderim yapar; canlı dal ve v0.4 dalına dokunulmaz.
- **Bloklanan saldırının sızıntısı:** Faz 2 §5.10(b) gölge can kuralındaki ×0,12, Faz 7 K7-1 ile ×0 olur. İki faz da tek sabiti
  (`BLOCK_LEAK`) okur.
- **Test adları:** Faz 1 yeni tarayıcı senaryolarını `02_` arazi grubuna ekler (`02_hizli_yolculuk`, `02_arazi_yasam`,
  `02_ayar_lod`, `02_depolama_kapali`, `02_acilis_akisi`). Faz 9'dan öne alınan Y3 adımının senaryosu `53_test_kipi` adını
  Faz 9 aralığından alır ve Faz 1'de yazılır. Diğer fazların ayırdığı adlar:

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

## Faz 7 — Düşman AI, boss, savaş adaleti, animasyon ve kamera

| No | Karar | Uygulanan |
|---|---|---|
| K7-1 | Başarılı blokta can kaybı | %0; bedel dayanıklılık. Dayanıklılık yetmezse savunma kırılır (×0,5 hasar, sendeleme). Blokta zehir ve yavaşlatma da 0 |
| K7-2 | Telgraf alt sınırı | Normal 0,40 sn; engellenemez ve alan saldırısı 0,60 sn. Zorluk (`hitAt`) korunur, yalnız hazırlık evresi bükülür |
| K7-3 | Yol bulma | Navmesh/A* yok: yönlendirme, duvar izleme, kademeli takılma kurtarma |
| K7-4 | Hayaletlerin itişmesi | Yalnız hayalet–hayalet (0,6 m) |
| K7-5 | Vuruş tepkisi kilidi | Poise ölçeri + hazırlığın son %30'unda zırh + bitirici sersemliğine 2,0 sn azalan getiri |
| K7-6 | Yılan toslamasında güverte hasarı | Rastgelelik kalkar; çarpma noktasına 5 m'den yakın oyuncular hasar alır |
| K7-7 | Dümen ve top erişimi | İstasyonlar nesneye yaklaştırılır; Faz 3 C-12 yarıçapları yeniden türetilir |
| K7-8 | Kamera ve ağaç | Karma kural: r ≥ 0,45 gövdeler yeni `GOVDE` katmanında çarpışır (başa ≥ 1,2 m kalıyorsa); diğerleri soldurulur |
| K7-9 | Yürüyüş hızları | Oyun hızları değişmez; klip hızı 1,5 cm eşikle ölçülen doğal hıza bağlanır, kadans sınırı var |
| K7-9b | Nişan/savunmada geri yürüme | 2,0 → 1,5 m/sn |
| K7-10 | Kök hareketi | Kaçınma ve ağır saldırıda yatay kalça hareketi yüklemede sıfırlanır |
| K7-11 | Ağ alanları | Tek PROTO artırımı (Faz 6 değeri + 1) |
| K7-12 | Konuğun algı bilgisi | `inCave`/`underwater` host'ta hesaplanır; `crouch` hız > 2,0 m/sn ise yok sayılır |
| K7-13 | Büyük sandık taşıma pozu | Önde "kucaklama"; kamera +0,3 m |
| K7-14 | Saldırı atılımı | Ayaklar yerdeyken tam gövde eyleminde 0 (oynanış değişikliği; Faz 2 06j yeniden koşulur) |
| K7-15 | Konuğun kaçınma/blok zamanı | Faz 5 `act.vt` ile en çok 0,25 sn geri sarma |
| K7-16 | Vuruş karesinin tanımı | Hamle sınıfına göre (uç hızı, en ileri erişim, en alçak temas); kontak sayfasıyla gözle onay |

## Faz 8 — Performans

Faz 8 kararları teknik tasarım kararıdır; kullanıcının "görünür kaliteyi düşürme" kuralına bağlıdır.

| No | Karar | Uygulanan |
|---|---|---|
| K8-1 | Ölçüt seti | Çağrı (ana/gölge/son işleme), üçgen, geometri/doku/program, JS ms, ilk görüş derlemesi, bellek; 9 sahne × 8 yön. Gerçek GPU ayrı tablo; ölçülmediyse "ÖLÇÜLMEDİ" |
| K8-2 | Sıra | Önce görünmeyeni çizmeme, sonra birleştirme/örnekleme |
| K8-3 | Örtme | GPU örtme sorgusu yok; mağaralarda veriyle tanımlı bölge ayıklaması |
| K8-4 | Nokta ışığı havuzu | Yüksek 6 / Orta 4 / Düşük 2; oturum boyunca sabit |
| K8-5 | Benzetim LOD'u | Ön ayardan bağımsız, en yakın oyuncuya göre |
| K8-6 | Yüksek ön ayar | Görüntüsü v0.4 ile aynı (görüntü farkı testi zorunlu); sabit metre kesmesi yok, her kesme ekran boyutu ve ölçülmüş farka (≤ 8/255) bağlı |
| K8-7 | Volkanik Dev "dG 5" | Sızıntı değil test kusuru; test düzeltilir, boss mermileri ve işaretleri temizlenir |
| K8-8 | Önkoşullar | Faz 1 A-19, Faz 3 çizim evresi, Faz 2 §7.7, Faz 5 `RemotePlayer`, Faz 6 mağaralar, Faz 7 §7; Faz 8 başında taban yeniden ölçülür |
| K8-9 | Liman bütçesi | P2 sonrası ≤ 900 (≤ 840), P3 sonrası ≤ 550, son ≤ 500; geçici, Faz 7 sonunda yeniden hesaplanır |
| K8-10 | Ayar şeması | Geriye uyumlu; yeni anahtarlar `DEFAULT_SETTINGS`'te |
| K8-11 | Düşman LOD politikası | `lod.simTier(e, ctx)`; Faz 7'nin T0/T1/T2 tablosu ve değişmezleri aynen |
| K8-12 | Gerçek GPU turu | Üretimde `?perf=1` "Performans turu" düğmesi; test kipinde `DK.perf.tour()` |
| K8-13 | Uyarlanır adım bütçesi | Uygulanmaz; `MAX_STEPS = 6` |
| K8-14 | Uzun oturum testleri | `10_uzun_oturum` tam pakette; `52_uzun_oturum_gercek` haftalık ya da elle |

## Faz 9 — Yayın güvenliği, tek HTML, test kaydı

| No | Karar | Uygulanan |
|---|---|---|
| K9-1 | Yayın dalı | `claude/hopeful-cray-o1jw6w` kalır |
| K9-2 | Pages kaynağı | GitHub Actions, tek yayıncı (depo ayarı; sahibin adımı) |
| K9-3 | Test kipi | `?test=1` **ve** yerel köken; üretim yapıtlarında test modülleri saplanır |
| K9-4 | Üretimde tanı | `window.__dkDurum()` salt-okur anlık görüntü |
| K9-5 | Kökteki tek HTML | v0.5'te depodan çıkar, Pages yapıtından servis edilir ("canlıya al" ile) |
| K9-6 | Tek HTML çeşitleri | Üretim (kancasız) ve test (yalnız CI yapıtı) |
| K9-7 | Bağımlılıklar | `package.json` + kilit; esbuild 0.24.2, playwright 1.63.0, peer 1.0.2 (yalnız geliştirme) |
| K9-8 | CI katmanları | `statik`, `duman`, `tek` her gönderimde; `coop2` ve `tam` yayın PR'ında, `[tam]` etiketinde ve elle |
| K9-9 | PR'dan gelmeyen commit | Yayın işinde API denetimi: commit birleştirilmiş bir PR'ın `merge_commit_sha`'sı olmalı |
| K9-10 | `github-pages` ortamı | Dal politikası yalnız yayın dalı, onaylayıcı depo sahibi (sahibin ayarı) |
| K9-11 | Lisanslar | `legalComments:'eof'` + lisans bloğu, krediler panelinden bağlantı |
| K9-12 | Katı kip | Oyun paketine `"use strict"` başlığı; IIFE korunur |
| K9-13 | Test kaydı | Katalog `tests/kabul/kullanici_testleri.mjs`, şema `dk-test-raporu/2`, toplayıcı `tools/test-kaydi.mjs`; çıktı `docs/v05/raporlar/TEST_KAYDI.{json,md}` |
| K9-14 | Teslim raporları | `docs/v05/raporlar/<AD>.md`; her faz kapanışında ilgili rapor güncellenir |
| K9-15 | Davet bağlantısı | `file:` altında Pages adresi + `?join=` |
| K9-16 | Uygulama zamanı | Y1, Y3, Y9a Faz 1'in başında (yukarıya bakın); Faz 1–8 ham raporları `docs/v05/kosular/faz<N>/` altında |
| K9-17 | Faz 3 ad çakışması | `22a`–`22e` (yukarıya bakın) |
| K9-18 | Canlıdan önce dal kuralı | Sahibin ayarı; bu oturumda uygulanmaz (yukarıya bakın) |
| K9-19 | Gerekli kontrol adları | `kapi` ve `yayin_onkosul` |
| K9-20 | Test kipinde sinyal sunucusu | `?peerhost` yalnız geri döngü adresi |
| K9-21 | CI süre bütçesi | `coop2` 2 parça, `tam` 4 parça; uzun koşular `dayaniklilik` işinde |
