# FIX_REPORT — Düzeltilen hatalar

Bu rapor v0.5 çalışmasında düzeltilen sorunları faz faz kaydeder. Her girdide şunlar yazar: sorun, kök neden, değişiklik, değişen dosyalar, koşulan testler ve sonuçları, kalan iş.

**Kurallar:**
- Kimlikler `KNOWN_ISSUES.md`'deki `KI-xxx` kimlikleridir. Bir madde ancak kabul testi koşulup geçtiyse "düzeltildi" sayılır ve KNOWN_ISSUES'tan buraya taşınır.
- "Kısmen düzeltildi" diye yazılan maddeler KNOWN_ISSUES'ta kalır; burada yalnız tamamlanan kısmı anlatılır.
- Ham test raporları `docs/v05/kosular/faz<N>/` altındadır. Başarısız ya da kararsız sonuçlar gizlenmez.
- Testler, aksi yazılmadıkça yerelde başsız Chromium ve yazılımsal GL (SwiftShader) ile koşuldu. Gerçek GPU'da ölçüm yapılmadı.

---

## Faz 1 — Arazi işçisi yedeği ve açılış hataları (sürüyor)

**Durum:** Faz 1 kapanmadı. Bu bölüm şimdilik Adım A1'i, "önce" kapısını ve Adım A2'yi içerir.

Henüz bu rapora girmeyen:
- **Adım B:** arazi işçisi kuyruğu ve açılış akışı. Commit'lenip sınandıkça eklenecek.

### Adım A1 — Test koşucusu artık hataları gizlemiyor (Y0 + Y1)

**Commit'ler:**
- `b2748cc`: koşucu ve testler.
- `5479e3b`: ham koşu kayıtları ve `.gitignore` düzeltmesi.

**Neden önce bu?** Faz 1 ve sonraki fazların kabul kararları bu koşucunun sonuçlarına dayanacak. Eski koşucu konsol hatalarını, 404'leri ve co-op adım istisnalarını yutuyordu. Bu yüzden "GEÇTİ" sonuçları güvenilir değildi. Tasarım: `docs/v05/tasarim/FAZ9_YAYIN_GUVENLIGI_TASARIM.md` §6.3; öne çekme kararı K9-16.

#### KI-146 (K-11): Konsol hataları, 404'ler ve başarısız istekler sayılmıyordu — **kısmen düzeltildi**

- **Kök neden:**
  - `run.cjs:40`: `404` içeren her konsol hatası atılıyordu.
  - `run.cjs:96`: çıkış kodu yalnız `fails` ve `pageErrors`'tan hesaplanıyordu.
  - `coop.cjs:34`: aynı süzgeç vardı.
- **Değişiklik:**
  - Süzgeç kaldırıldı. Her `console.error`, her ≥ 400 yanıt ve her `requestfailed` kaydediliyor ve çıkış kodunu etkiliyor.
  - İzin listesi yalnız gerekçeli olarak, iki yerden veriliyor: senaryo metası (`izinliHatalar`) ve `--izin-hata 'desen # gerekçe'`. Varsayılan izin yalnız `favicon.ico`.
  - "Failed to load resource" iletisi aynı adresli ağ kaydıyla tekilleştiriliyor; eşleşmeyen ileti konsol hatası olarak kalıyor.
  - Rapor şeması `dk-test-raporu/2` oldu (`sonuc.durum`, `kontroller[]`, `hatalar`, `ortam`, `tur`). Eski alanlar korundu.
- **Dosyalar:**
  - `tests/harness/run.cjs`
  - `tests/harness/coop.cjs`
  - `tests/harness/ortak.cjs` (yeni; iki koşucunun ortak kodu)
- **Testler:**
  - `tests/node/kosucu_negatif.mjs` (yeni):
    - Eski koşucuya karşı KALDI: a, b, c ve f durumları yanlışlıkla geçti (`kosular/faz1/kosucu_negatif/once_eski_kosucu/`).
    - Son koşucuyla **45/45 GEÇTİ** (`a1_duzeltme/son/`).
  - **Eksik model denemesi:** `chest.glb` tek HTML kopyasından silindi (`kosular/faz1/chest_glb/`).
    - Eski koşucu: 4/4 GEÇTİ, hata gizlendi.
    - Yeni koşucu: **KALDI**; 4 izinsiz konsol hatası, "Model yüklenemedi: chest".
  - **v0.4 kısa alt kümesi** (`kosular/faz1/once_v04_yeni_kosucu/`): tabanda geçen 65 kontrolün 65'i geçti. `?terrain=badurl` kipi yalnız gerekçeli izinle geçiyor (3 × 404 + 3 × başarısız istek). İzinsiz koşusu KALDI.
  - **Tam taban:** bkz. "Önce kapısı" aşağıda.
- **Kalan (KNOWN_ISSUES'ta açık):** Tek dosya testinde gömülü varlık ve ses denetimi yok. Faz 9'da yapılacak (tasarım §4.6, `55_tek_varlik`).

#### KI-225 (K-12): `coop.cjs` adım istisnalarını yutuyordu; uyarılar kaydedilmiyordu — **düzeltildi**

- **Kök neden:**
  - `coop.cjs:53`: `ev()` istisnayı `EVALERR` diye basıp yutuyordu.
  - `coop.cjs:34`: uyarı kaydı yoktu.
  - Tabandaki 42 `EVALERR`'in hepsi kasıtlı kapatılan sekmeden geliyordu ("closed").
- **Değişiklik:**
  - `ev(p, js, etiket, {kapaliIzinli})`: açık sayfadaki istisna `evalErrors` ve `fails`'e giriyor.
  - Kapalı sayfaya çağrı yapılmıyor (`kapaliAtlama`). `tick()` kapalı sekmeleri atlıyor. Kasıtlı `page.close` kendiliğinden işaretleniyor.
  - Uyarılar tekilleştirilip kaydediliyor.
  - Aynı adla yeniden katılan sekmenin hataları kaybolmuyor; anahtar `Ad#2` oluyor.
- **Dosyalar:**
  - `tests/harness/coop.cjs`
  - `tests/harness/ortak.cjs`
- **Testler:**
  - `kosucu_negatif`'teki co-op durumları beklenen sonucu verdi:
    - `f`: `ev()` istisnası → KALDI.
    - `g`: kapalı sayfada `tick()`.
    - `r`: co-op konsol hatası → KALDI.
    - `aa`: `await`'siz `check()` → KALDI.
    - `ac`: senaryodan sonra gelen hata → KALDI.
    - `ai`: aynı adla `mk()` → önceki hata korunur.
  - Ayrıca yakalanmamış söz reddi denemesi KOSUCU_HATASI verdi (`a1_duzeltme/sonra/coop_yakalanmamis_soz`).
  - co-op 06a2 v0.4'te, geçen koşularda: `EVALERR` 0, `kapaliAtlama` 17–18.
  - 06b: 18/18.

#### KI-147 (K-13): Onaysız ölçüm betikleri "GEÇTİ" görünüyordu — **kısmen düzeltildi**

- **Değişiklik:**
  - Onay sayısı 0 olan senaryo KALDI oluyor.
  - `meta.olcum` taşıyan ölçüm senaryosunun durumu `OLCUM` oluyor; asla GEÇTİ olmuyor.
  - `03_fizik_dt.js` ve `kamera_tarama/batch_b1…b6.js` dosyalarına yalnız `{meta:{olcum:true}}` satırı eklendi. Onaylara dokunulmadı.
- **Testler:**
  - `03_fizik_dt` v0.4'te `OLCUM`. Metasız hâli KALDI oluyor (`once_v04_yeni_kosucu/03_fizik_dt_metasiz_KALDI`).
  - Kesilmiş kamera taraması `OLCUM` 1/1 verdi.
- **Kalan (KNOWN_ISSUES'ta açık):**
  - Açığı kabul eden kontroller duruyor, örneğin 06a H07. Bunları Faz 2 tersine çevirecek.
  - Belgelerdeki eski "GEÇTİ" kayıtları Faz 9'un test kataloğuyla yeniden üretilecek.

#### A1 incelemesinin bulguları (koşucunun kendi hataları; KNOWN_ISSUES'ta yoktu)

Uygulamadan sonra ayrı bir inceleme 13 bulgu çıkardı. Ayrı bir düzeltici 12'sini düzeltti; 13.'yü ana oturum düzeltti. Kanıtlar: `kosular/faz1/inceleme_a1/` (bulgular) ve `kosular/faz1/a1_duzeltme/{once,sonra,son}/`. Son koşucu sha256 değerleri: `run.cjs` 591dff27, `coop.cjs` a6e0e14c, `ortak.cjs` df191a99, `kosucu_negatif.mjs` 098ac29b.

| Kimlik | Önem | Sorun | Durum |
|---|---|---|---|
| A1-01 | orta | Rapor yazımı istisna atınca koşucu süresiz asılı kalıyor ve tarayıcı kilidini tutuyordu (döngüsel ya da BigInt sonuç, yazılamayan rapor yolu). | Düzeltildi: tek seferlik bitiş, güvenli JSON, yedek rapor, 120 sn'lik bekçi. |
| A1-02 | orta | Aynı adla `mk()` önceki sekmenin sayfa hatasını siliyordu. | Düzeltildi: `Ad#2` anahtarı. |
| A1-03 | orta | Tür ölçümü `DK.game.update` ile ileri sarılan kontrolleri "tarayıcı" sayıyordu. | Düzeltildi. |
| A1-04 | orta | Yazım hatalı ya da eksik `expect` karşılaştırıcısı onayı sessizce geçiriyordu. | Düzeltildi: KOSUCU_HATASI. |
| A1-05 | orta | Negatif test aracı, hiç rapor yazmayan bir koşucuyu da geçiriyordu. | Düzeltildi: rapor zorunlu. |
| A1-06 | düşük | Kanıt adımlarının (`snap`, `view`…) istisnaları raporda iz bırakmıyordu. | Düzeltildi. |
| A1-07 | düşük | `check()`'e verilen söz (Promise) her zaman PASS sayılıyordu. | Düzeltildi. |
| A1-08 | düşük | Son adımdan sonra gelen eşzamansız hata sayılmıyordu. | Düzeltildi: 1 sn yerleşme. |
| A1-09 | düşük | Gerekçesiz ya da her şeyle eşleşen izin deseni kabul ediliyordu. | Düzeltildi: KOSUCU_HATASI. |
| A1-10 | düşük | Bozuk `--izin-hata` deseni yakalanmamış istisna veriyordu. | Düzeltildi: kullanım hatası, çıkış 2. |
| A1-11 | düşük | Sayfa kendini yeniden yükleyince sayaç kurulmuyordu. | Düzeltildi. |
| A1-12 | düşük | `kamera_tarama/*.js` ölçüm betiklerinde `meta.olcum` eksikti. | Düzeltildi. |
| A1-13 | düşük | Ham koşu günlükleri (`*.log`) git dışında kalıyordu. | Düzeltildi (`5479e3b`): `.gitignore`'a `!docs/v05/**/*.log` eklendi. |

**Koşucu davranışındaki değişiklikler (geriye uyum):**
- Her koşu yaklaşık 1 sn uzar (yerleşme).
- Yeni kalma nedenleri `FAIL` satırı üretmez: izinsiz konsol ya da ağ hatası, onaysız senaryo, KOSUCU_HATASI. `regresyon.sh` gibi araçlar sonuç için çıkış koduna bakmalı.
- 126 senaryo dosyası yeni okuma denetiminden tarayıcısız geçti. KOSUCU_HATASI verecek dosya çıkmadı.
- **Ortam notu:** Playwright 1.63 yalnız varsayılan ortamda bulunur. Koşucular `NODE_PATH` ile koşulmamalı; o yol yalnız esbuild ve PeerJS sunucusu içindir.

### Önce kapısı — yeni koşucuyla v0.4 tam taban

**Commit:** `87cfdcf`. **Ayrıntı:** `docs/v05/kosular/faz1/once_v04_tam/ONCE_KAPISI.md`.

**Sonuç:** Tabanda tümüyle geçen 23 koşunun 20'si, tabanda geçen 246 kontrolün 233'ü geçti. Kalan 3 koşu iki koşucuyla da tekrarlandı ve **KARARSIZ** diye kaydedildi; GEÇTİ sayılmadı:

| Koşu | Yeni koşucu | Eski koşucu | İlk kalmanın nedeni |
|---|---|---|---|
| `17_kamera_kararma` | 2/3 | — | Bellek: cgroup OOM sayfayı çökertti. A2'nin daraltmasına göre koşucunun rAF sarmalayıcısıyla ilişkili olabilir; araştırılıyor. |
| `14_deniz_ekipmani` | 3/4 | 3/3 | Testin ön koşulu eksik: çanta önceki adımların rastgele balıklarıyla doluyor. |
| `coop_06a2` | 3/4 | 3/3 | Konuk menüye düştü (KI-233 belirtisi); kök neden kanıtlanmadı. |

**Araç:** `tests/harness/taban_karsilastir.cjs` (yeni) faz kapısı karşılaştırmasını kontrol kontrol yapar. Kaydedilen çıktıyı bayt bayt yeniden üretir.

### Adım A2 — Test kipi, yayın koruması, durum kaydı (Y3, Y9a, A5)

**Commit'ler:**
- `1709023` (Y3)
- `0079178` (Y9a)
- `0d57650` (A5 ve ham kayıtlar)

**Tasarım:** `FAZ9_YAYIN_GUVENLIGI_TASARIM.md` §5 (K9-3, K9-4, K9-20) ve §2.3. Öne çekme kararı K9-16.

**Süreç:** Uygulamadan sonra iki bağımsız karşıt inceleme yapıldı (güvenlik ve uyumluluk; 8 bulgu). Bulguların 7'si düzeltildi, 1'i ertelendi. Ham kayıtlar: `docs/v05/kosular/faz1/a2/{once,sonra,inceleme,duzeltme}/`.

#### KI-144 (K-08): Üretimde URL test parametreleri açıktı — **düzeltildi**

- **Kök neden:**
  - `net.js:49-55` `peerOpts()` herkesin verdiği `?peerhost`'u okuyordu. Bir davet bağlantısıyla sinyal sunucusu saldırgana yönlendirilebiliyordu.
  - `terrain.js:249` `?terrain`'i her kökende okuyordu; oyun bozuk kipte açılabiliyordu.
- **Değişiklik:**
  - `js/core/testmode.js` (yeni): `TEST` yalnız `?test=1` VE yerel kökende (localhost, 127.0.0.1, [::1], file:) doğru. `testParam()` test kipi kapalıyken `null` döner.
  - `net.js` ve `terrain.js` parametreleri yalnız `testParam()` ile okuyor.
  - `peerhost` test kipinde de yalnız geri döngü adresini kabul ediyor; başka değer yok sayılır ve varsayılan sunucu kullanılır.
- **Testler:**
  - `tests/scenarios/53_test_kipi.js` (yeni): önce KALDI 2/13, sonra **GEÇTİ 25/25** (`a2/duzeltme/son/53_test_kipi.log`). Sınanan durumlar:
    - TK03: test kipi yok.
    - TK08: test kipinde geri döngü dışı adres.
    - TK05: `https://oyun.ornek` sahte yerel olmayan köken; saldırgan sunucusuna istek 0, varsayılan sunucuya istek ≥ 1.
  - `tests/node/test_kipi.mjs` (yeni): **GEÇTİ 100/100**. Kapsam:
    - URL okuma kuralı K4;
    - gerçek `net.js` üzerinde 36 durumluk geri döngü tablosu;
    - mutasyon öz-sınamaları.

#### KI-143 (K-07): `window.DK` ve test yardımcıları üretimde koşulsuz açıktı — **kısmen düzeltildi**

- **Değişiklik:**
  - `js/main.js` artık `window.DK`'yi kendisi kurmuyor.
  - Test kipinde `js/test/kancalar.js` dinamik `import()` ile yüklenir ve `install()` ile kurulur:
    - v0.4'ün 49 alanı ve `audio`;
    - `snap`, `snapFrom`, `sim`, `tap`, `press` (gövdeler 44d548c'den aynen);
    - `DK.__sayac` ve `DK.mod` kayıt defteri.
  - Kurulum menü açılmadan önce yapılır; `window.__ready` ondan sonra yazılır. Kanca modülü yüklenemezse açılış hatası yükleme ekranında görünür (TK09).
  - `window.__dkDurum()` (yeni) üretimde de var: salt-okur, dondurulmuş, 13 ilkel alan.
- **Testler:**
  - 53_test_kipi: TK01, TK02, TK02b, TK05b, TK09.
  - `test_kipi.mjs`: modül kuralları K1–K5 ve 44d548c ile API eşliği.
  - `--uretim` koşuları (dist ve http) U00 GEÇTİ: `DK` yok.
- **Kalan (KNOWN_ISSUES'ta açık):** Tek HTML'de kanca modülü hâlâ pakette ve `file:` altında `?test=1` ile açılıyor. Üretim saplaması Faz 9 Y4'te (tasarım §5.5).
- **Yan etki:** Dinamik `import()` yüzünden esbuild tek HTML'de 87 modülü tembel başlatıyor; önce 12'ydi. Değerlendirme sırası korunuyor ve 02_tek_dosya 4/4 geçiyor. Faz 9'un eşdeğerlik paketi bunu izleyecek.

#### KI-142 (K-03): Yayın işinde ref koruması yoktu — **kısmen düzeltildi**

- **Değişiklik** (`.github/workflows/pages.yml`, yalnız bu dalda):
  - `deploy.if` koşuluna `github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'` eklendi.
  - Ref'i harfe duyarlı biçimde ikinci kez denetleyen bir kabuk adımı eklendi.
  - `cancel-in-progress: false` yapıldı.
  - Tetikleyiciler değişmedi.
- **Testler:** `tests/node/yayin_ref.mjs` (yeni): önce KALDI 5/8, sonra **GEÇTİ 9/9**. Kabuk denetimi bash'te doğru ref'le ve 8 yanlış ref'le (3 harf varyantı dahil) koşturuldu. İş akışı tetiklenmedi; GitHub'ın `if` değerlendirmesi ölçülmedi.
- **Kalan (KNOWN_ISSUES'ta açık):**
  - Canlı dal ancak canlıya alımla değişir.
  - Ref korumasız `pages.yml` taşıyan öteki uzak dallar (`claude/denetim-v0.4`) elle tetiklemeyle hâlâ yayın yapabilir.
  - `github-pages` ortamının dal politikası kullanıcı ayarıdır.
  - Bunlar Faz 9 Y9/Y12'de ele alınacak (A2-G-04).

#### A2 incelemesinin bulguları

| Kimlik | Önem | Sorun | Durum |
|---|---|---|---|
| A2-G-01 | orta | K-08 denetimleri saldırı yolunu sınamıyordu. Açık geri getirilince 53 ve `test_kipi` yine geçiyordu. | Düzeltildi: davet bağlantısıyla oda taraması, saldırgan adresine istek sayımı. |
| A2-G-02 | düşük | `test_kipi.mjs` kuralları sözdizimseldi. `__DK_TERRAIN_MODE` kapısı ve K9-20 denetlenmiyordu. | Düzeltildi: K1–K5 genişletildi, SN00–SN36. |
| A2-G-03 | düşük | YR4 harf duyarlılığını sınamıyordu; `pages.yml` yorumu yanlıştı. | Düzeltildi. |
| A2-G-04 | düşük | K-03 depo genelinde kapanmadı (öteki uzak dallar). | Ertelendi: Faz 9, kullanıcı ayarı. |
| A2-UY-01 | düşük | Modül kuralları bazı ihlal biçimlerinde yanlış GEÇTİ veriyordu. | Düzeltildi. |
| A2-UY-02 | düşük | Kanca modülü yüklenemezse menü açılıyor, hata görünmüyordu. | Düzeltildi: kurulum menüden önce, TK09. |
| A2-UY-03 | düşük | TK05, `--url`'deki ağacı değil çalışma dizinindekini sınıyordu. | Düzeltildi: TK05e ön koşulu. |
| A2-UY-04 | düşük | `durum.json` KNOWN_ISSUES ve FIX_REPORT ile çelişiyordu. | Düzeltildi. |

**A2'nin bulduğu başka sorunlar:**
- **`17_kamera_kararma` bellek çökmesi:** A1 koşucusunun rAF sarmalayıcısıyla ilişkili olabilir. Ayrı ölçümle inceleniyor; bkz. önce kapısı notu.
- **`14_deniz_ekipmani` L03 ön koşulu (çanta yeri):** Test sağlamlaştırması hazırlanıyor.
- **Tasarımdaki Y3 kodunda ölçülen bir zamanlama sorunu:** Boot sonunda başlatılan `import()`, `__ready`'yi ağır ilk karenin arkasına itiyordu. Uygulamada söz boot başında başlatılıyor. Ölçüldü: `__ready` v0.4 ile aynı yerde.

**Davranış değişiklikleri:**
- Elle hata ayıklamada co-op'un yerel sinyal sunucusu ve arazi kipleri artık `&test=1` ister, ör. `http://localhost:8080/?test=1&peerhost=127.0.0.1&peerport=9000`. Koşucular `test=1`'i kendileri ekler.
- 53_test_kipi ağaç kökünden koşulmalıdır.

**Durum kaydı:** `docs/v05/raporlar/durum.json` (A5, şema `dk-durum/1`) her KI'nin durumunu, commit'ini, testlerini ve kanıtını tutar. Faz 1–8'de elle güncellenir (tasarım §7.3-4).

### Test sağlamlaştırması — `14_deniz_ekipmani` çanta yeri ön koşulu

**Bulgu:** Önce kapısında görüldü; A2 tanısı aynı yeri gösterdi. Önceki adımların rastgele balıkları ve L02'nin geçici kapasite artışı çantayı dolduruyordu. Bu yüzden G06 (ağ), R01 (olta) ve L03 (kayıt) sığmayan eşyayı sessizce kaybedip kalabiliyordu. Oyunun davranışı tasarım gereği doğru; kusur testteydi.

**Değişiklik** (`tests/scenarios/14_deniz_ekipmani.js`):
- `_yerAc(kg)` yardımcısı eklendi: eski balıkları bırakır, yine yer yoksa kapasiteyi büyütür.
- **G06:** Atış süresince kapasiteyi büyütür, sonra ağın balıklarını çıkarıp kapasiteyi geri koyar (iz bırakmaz).
- **R01:** `_yerAc(200,5)` uygulanır; iskelede yakalanabilen en ağır tür 200 kg.
- **L03:** `_yerAc(7,5)` uygulanır.
- Onay ifadeleri ve 16 etiket bayt bayt aynı.

**Kanıt** (`docs/v05/kosular/faz1/t14/README.md`): Yapay dolu çantayla kalma iki sürümde de belirlenimli yeniden üretildi; özgün test v0.4'te ve w2'de G06/L03'te KALDI. Düzeltmenin ilk iki sürümünde iki ayrı kırılganlık bulundu:
- G06'nın kapasiteyi yalnız geri koyması, R01'in oltasını eklenemez hâle getiriyordu.
- R01'in kendi yer ön koşulu yoktu.

Son sürüm 6 çeşidin 6'sında ve commit'lenen dosyayla w2'de 16/16 GEÇTİ.

