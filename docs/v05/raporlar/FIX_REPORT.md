# FIX_REPORT — Düzeltilen hatalar

Bu rapor v0.5 çalışmasında düzeltilen sorunları faz faz kaydeder. Her girdide şunlar yazar: sorun, kök neden, değişiklik, değişen dosyalar, koşulan testler ve sonuçları, kalan iş.

**Kurallar:**
- Kimlikler `KNOWN_ISSUES.md`'deki `KI-xxx` kimlikleridir. Bir madde ancak kabul testi koşulup geçtiyse "düzeltildi" sayılır ve KNOWN_ISSUES'tan buraya taşınır.
- "Kısmen düzeltildi" diye yazılan maddeler KNOWN_ISSUES'ta kalır; burada yalnız tamamlanan kısmı anlatılır.
- Ham test raporları `docs/v05/kosular/faz<N>/` altındadır. Başarısız ya da kararsız sonuçlar gizlenmez.
- Testler, aksi yazılmadıkça yerelde başsız Chromium ve yazılımsal GL (SwiftShader) ile koşuldu. Gerçek GPU'da ölçüm yapılmadı.

---

## Faz 1 — Arazi işçisi yedeği ve açılış hataları (sürüyor)

**Durum:** Faz 1 kapanmadı. Bu bölüm şimdilik Adım A1'i ve "önce" kapısını içerir.

Henüz bu rapora girmeyenler:
- **Adım A2:** test kipi, üretimde `DK`'nin kapatılması, `pages.yml` yayın koruması.
- **Adım B:** arazi işçisi kuyruğu ve açılış akışı.

Bunlar commit'lenip sınandıkça eklenecek.

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
