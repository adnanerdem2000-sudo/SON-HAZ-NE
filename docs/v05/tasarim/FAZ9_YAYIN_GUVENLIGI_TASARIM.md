# Faz 9 — Yayın Güvenliği, Tek HTML, Test Kayıt Sistemi ve Son Regresyon: Tasarım Belgesi

Tarih: 14 Kasım 2026.

- **Okunan kod:** v0.4 `44d548c` (`/home/user/SON-HAZ-NE`, dal `claude/denetim-v0.4`). Bu ağaç çalışma boyunca değişmedi.
- **Canlı dal:** `claude/hopeful-cray-o1jw6w` (`762f1c7`, v0.3). Deponun varsayılan dalıdır ve Pages buradan yayınlanır.
- **Çalışma dalı:** `claude/v0.5-saglamlastirma` (uç `7858a89`; şimdilik yalnız Faz 0 belgeleri var).
- **Bu belge için yapılanlar:** Hiçbir depo dosyası değiştirilmedi. Denemeler salt-okur olarak `/tmp/tasarim_y/faz9/` altında yapıldı (Ek A). Tarayıcı koşuları kilit sarmalayıcısıyla (`/home/user/devtools/tk`) yapıldı.
- **GitHub durumu:** Salt-okur API ile okundu (14 Kasım): dallar ve koruma bayrakları, iş akışı koşuları. Ayar değiştiren hiçbir çağrı yapılmadı.
- **İnceleme (inceleme düzeltmesi):** Bu sürüm, taslağın karşıt incelemeden geçmiş nihai hâlidir. Düzeltmeler "(inceleme düzeltmesi)" ile işaretlidir. İnceleme sırasında da hiçbir depo dosyası değiştirilmedi. Ölçümler `/tmp/tasarim_y/faz9_inceleme/` altında yapıldı, tarayıcı koşuları kilit sarmalayıcısıyla koşuldu (Ek B). Bulunan sorunların önem sıralı listesi belgenin sonundadır (§İ).

**Kaynaklar:**
- `master_prompt.md` §14 (Aşama 12), §15 (Aşama 13), §16, §17
- `audit_K.json`: K-01…K-20 ve T1–T62 gereksinim durumları
- `audit_A.json`: A-01, A-03, A-16
- Faz 2–6 nihai tasarımları, `KARARLAR.md`, `00_BASLANGIC_KAYDI.md`
- `faz1_brief.md`: Faz 1 test adları ve yeni `?terrain` kipleri

**İşaretler:** Her çözüm, nerede yapılacağını gösteren bir işaret taşır:

| İşaret | Anlamı |
|---|---|
| **[İA]** | İş akışı dosyası, v0.5 dalına commit ile |
| **[DA]** | Derleme aracı (`tools/`) |
| **[KO]** | Test koşucusu (`tests/harness/`, `tests/kos.mjs`) |
| **[OK]** | Oyun kodu (`js/`, `index.html`) |
| **[KU]** | Kullanıcının GitHub ayarlarında elle yapacağı adım. Bu oturumdaki araçlar ayar değiştiremez. |
| **[BE]** | Belge |

---

## 0. Özet ve kararlar

### 0.1 Özet

Faz 9 dört sonuç üretir.

**1. Canlıya tek kapıdan çıkış.** Canlıya yalnız tanımlı yayın dalı (`claude/hopeful-cray-o1jw6w`) çıkar ve tek yayıncı GitHub Actions'tır. Yayına giden yol sırasıyla şöyledir:
- birleştirilmiş PR,
- yeşil CI,
- `_site/` dizininde yalnız gerekli dosyalardan oluşan bir yapıt,
- ortam onayı,
- yayın sonrası canlı duman testi.

Feature dalları her push'ta CI koşar ama yayına çıkamaz. (inceleme düzeltmesi) CI yalnız `ci.yml`'yi taşıyan, yani v0.5 tabanlı dallarda koşar. Canlıya alınana dek varsayılan daldan (v0.3) açılan yeni bir dalda ne CI ne yayın denetimi vardır. Bu yüzden T62 depo geneli API taramasıyla izlenir (§1.3-7). Yayın politikası üç katmanda kurulur:
- iş akışı içi korumalar [İA],
- kullanıcı ayarları [KU] (Pages kaynağı, ortam dal politikası, dal kuralı),
- denetleyen testler (T61, T62).

**2. Tek HTML'in güncel kaynaktan üretilmesi.**
- Tek HTML yalnız CI'da, güncel kaynaktan üretilir. Kökteki bayat v0.3 kopyası depodan çıkar.
- İki çeşit derlenir. Üretim derlemesinde test kancası yoktur. Test derlemesi yalnız CI yapıtıdır.
- Derleme sonrasında statik denetim yapılır: gömülü dosya sayısı, `import.meta`, işçi ifadesi, lisanslar, katı kip, kanca yokluğu, damga ve belirlenimcilik.
- Tarayıcı senaryoları şunları sınar: `file://` altında `data:` işçisi, http altında `blob:` işçisi, çevrimdışı açılış, `assets` adlı klasörden açılış ve gömülü ses ile modeller.
- Modüler sürümle **eşdeğerlik**, aynı senaryo alt kümesinin iki hedefte koşulmasıyla ve özellik izi karşılaştırmasıyla sınanır.

**3. Test kancalarının yalnız test kipinde açık olması.**
- `window.DK` ve yardımcıları yalnız şu koşullarda açılır: `?test=1` verilmişse **ve** köken yerelse (`localhost`, `127.0.0.1`, `[::1]` ya da `file:`). Bu kural Faz 2, Faz 5 ve Faz 6 tasarımlarının `?test=1` kararıyla uyumludur.
- `?peerhost`, `?terrain`, Faz 5'in `?turn*` parametreleri ve Faz 3'ün `?dongu` parametresi de yalnız test kipinde okunur.
- Üretim yapıtlarında (Pages `_site` ve üretim tek HTML'i) test modülleri saplamayla değiştirilir.
- Koşucular kipi kendiliğinden açar. Mevcut senaryoların API'si birebir korunur.

**4. Test kayıt sistemi ve raporlar.**
- Kullanıcının 62 testi bir katalogla senaryo kontrollerine bağlanır.
- Koşucular her kontrol için 8 alanı otomatik üretir: sonuç, tekrar komutu, hata, ilgili dosya, önce/sonra, ekran görüntüsü, ortam ve tür (gerçek tarayıcı ya da benzetim). Çıktı JSON ve Markdown tablosu olarak yazılır.
- Konsol hataları, 404'ler, yutulan istisnalar ve onaysız senaryolar başarısızlık sayılır (K-11, K-12, K-13).
- 10 teslim raporu fazlar boyunca bu kayıttan beslenir. (inceleme düzeltmesi) Faz 1–8'de ham raporlar arşivlenir ve `durum.json` elle güncellenir; kayıt araçları Faz 9'da yazılır ve raporları bu arşivlerden üretir (§7.3). Son regresyon v0.4 taban koşusuyla (tabanda geçen 23 koşu ve 246 kontrol) karşılaştırılır. Eski özellikler için canlı v0.3 de karşılaştırmaya girer (§7.4-8).

### 0.2 Bu belgede ilk kez ölçülen ya da doğrulanan bulgular

| No | Bulgu | Kanıt |
|---|---|---|
| N9-1 | **Push olayında iş akışı gönderilen commit'teki dosyadan okunuyor; bu ampirik olarak doğrulandı.** Actions'ta toplam 16 koşu var ve hepsi canlı dalda. v0.5 dalına 3 commit gönderildi (`e194d59`, `3725aac`, `7858a89`; dosyaları v0.4 `pages.yml` taşıyor), `claude/denetim-v0.4` dalı da gönderildi (ilk commit'i `d6e716f`, filtre baştan daraltılmış; (inceleme düzeltmesi) belirleyici olan her gönderimin uç commit'idir, dalın bütün uçları `d6e716f`'den türediği için hepsi daraltılmış filtreyi taşır). Bu iki daldan **hiç koşu doğmadı.** Varsayılan dalın `'claude/**'` kuralı geçerli olsaydı koşu doğardı. | `actions_list list_workflow_runs` → `total_count: 16`, `head_branch` hep `claude/hopeful-cray-o1jw6w`; `git log --reverse 762f1c7..44d548c` ilk satırı `d6e716f`; (inceleme düzeltmesi) 14 Kasım'da yeniden okundu: 16 koşunun ve 6 `github-pages` dağıtımının hepsi canlı dalda (Ek B.4) |
| N9-2 | **K-09 gerçek tarayıcıda yeniden üretildi.** v0.4 tek HTML'i (dist, sha256 `75587dd9…`) `/tmp/…/k09/assets/eski.html` konumundan açıldı. Sonuç: `__ready` hiç gelmedi (240 sn zaman aşımı); 258 konsol hatası; 53 × "Model yüklenemedi"; 15 kk dosyası "URL scheme "file" is not supported" (istenen yol `…/assets/assets/models/kk/…`). `kk.js:70-71` hata atıyor ve `boot()` düşüyor. Denetim bunu yalnız Node benzetimiyle göstermişti. | `rapor/k09_eski_assets.json` (Ek A.4) |
| N9-3 | **Yalnız `testmode.js`'i saplamak üretim derlemesinden test kancalarını çıkarmıyor.** esbuild 0.24.2 modüller arası sabit yayılımı yapmıyor: `if (TEST) await import('./test/hooks.js')` kalıbında `TEST=false` saplanınca kanca modülü yine pakete giriyor (323 B çıktıda işaret dizgesi duruyor). Tanım (`define`) ile aynı modülde koşul yazmak da modülü çıkarmadı (579 B). **Kanca modülünün kendisi** saplanınca işaret 0 oluyor (253 B). Bu yüzden üretim derlemesi kanca modüllerini doğrudan saplar ve CI işaret dizgesini tarar (§4.2, §5.5). | Ek A.2 `esb/deneme.mjs`, `deneme2.mjs` |
| N9-4 | v0.4 kaynağı bugünkü ayarlarla **0 uyarıyla** paketleniyor; çıktıda `import.meta` 0, `new URL("./…")` 0. Uyarıları ölümcül yapmak (K-16) bugünkü derlemeyi bozmaz. `legalComments:'eof'` ile `"use strict"` başlığı oyun paketine yalnız 106 bayt ekler; three.js lisans başlığı çıktıda görünür olur. Aynı kaynaktan yeniden derleme sha256 `75587dd9…` verir, yani derleme belirlenimcidir. | Ek A.1, A.3 |
| N9-5 | Önerilen `key()` (sayfa dizinine göre göreli yol) 9 sayfa konumunun 9'unda gömülü varlıkları çözüyor; yanlış pozitif yok. Eski `key()` 5 konumda başarısız: `assets/`, `game-assets/`, `oyun_assets/`, `assets/models/`, `/assets/oyun/`. Eski `key()` ayrıca `data:` adresinde yanlış pozitif veriyor. | Ek A.5 `keysim/key_sim.mjs` |
| N9-6 | **Önerilen derleme düzeltmeleri birlikte çalışıyor.** Değişiklikler: `"use strict"` başlığı, `legalComments:'eof'`, `logOverride` ve yeni `key()`. Bu derleme `assets/` ve `game-assets/` klasöründen (`?test=1` sorgusuyla da) açılınca 02_tek_dosya **4/4** geçti; `errors` 0, `pageErrors` 0. | §4.9, Ek A.6 |
| N9-7 | **Tek HTML'in http altındaki `blob:` işçi yolu çalışıyor (T60).** `http://localhost:8080/dist/…` adresinde 4/4; işçi adresi `blob:http://…`, 3 işçi. Bu yol daha önce hiç sınanmamıştı. | §4.9 |
| N9-8 | **Tek HTML ağ tamamen kapalıyken açılıyor (T58).** Dış istek 0, başarısız istek 0, konsol hatası 0; oyun başlıyor ve kayıt yazılıyor. 34 THREE uyarısı var; kayıt sistemi uyarıları tekilleştirmeli. | §4.9 |
| N9-9 | **Eşdeğerlik örneklemi FARK 0.** Dört mevcut senaryo (00, 08, 05, 13) hiç değiştirilmeden tek HTML'e karşı koşuldu: 45/45 kontrol modüler tabanla aynı sonucu verdi, hata 0. | §4.9, Ek A.6 |
| N9-10 (inceleme düzeltmesi) | **Taslaktaki `pages.yml` hiç başlamazdı.** `pages.yml`'nin `test` işi `ci.yml`'yi `workflow_call` ile çağırıyor ve çağıran yalnız `contents: read` veriyor. `ci.yml`'deki `yayin_denetimi` (`actions: read`, `deployments: read`) ve `yayin_onkosul` (`pages: read`) bunun üstünde izin istiyor. GitHub, çağrılan iş akışındaki bir işin çağıranın verdiğinden geniş izin istemesini koşu başlamadan reddeder ("The nested job '…' is requesting '…', but is only allowed '…'", sonuç `startup_failure`). Bu, işlerin `if:` ile atlanacak olmasından bağımsızdır. Sonuç: her yayın koşusu başlamadan kırmızı olurdu. Düzeltme §3.2: bu iki iş ayrı `yayin-denetimi.yml`'ye taşınır; `ci.yml`'de hiçbir iş `contents: read`'den fazlasını istemez; YP11 bunu statik olarak denetler. | GitHub "Reusable workflows" belgesi ("permissions … can be only downgraded") ve topluluk kayıtları (Ek B.6). Actions bu ortamda koşturulamadığı için ölçülemedi. |
| N9-11 (inceleme ölçümü) | **Gizli 404 ölçüldü.** Bugünkü koşucunun 404 süzgeci kaldırılmış bir kopyası kullanıldı; bu kopya her konsol hatası ve uyarısını, her ≥ 400 yanıtı ve her `requestfailed`'ı kaydeder. v0.4'te 00_acilis ve 08_kalicilik'te gizli 404 ve konsol hatası **0** çıktı. 02_arazi_yedek `?terrain=badurl` koşusunda 3 × `404 …/terrainWorker.missing.js` yanıtı ve 3 × `requestfailed net::ERR_FAILED` var; bugünkü koşucu bunların 3'ünü `errors`'a yazıyor ama çıkış kodu 0. Sayfa düzeyindeki 404 (`fetch`, `<img>`) Chromium'da "Failed to load resource: the server responded with a status of 404 (…)" konsol hatası üretir. **Adres metinde yoktur**, yalnız `location().url`'dedir. Sonuç: izin listesi yalnız metne bakarsa V4 ve SU05'teki izinli 404'ler yine KALDI üretir (§6.3-1 düzeltmesi). | Ek B.1, B.2 |
| N9-12 (inceleme ölçümü) | **TK05'in sahte kökeni çalışıyor ve https olmalı.** `context.route('https://oyun.ornek/**')` gezinmeyi, bütün alt kaynakları ve **modül işçisi betiğini** (3 istek) yakaladı. Sayfada `isSecureContext === true`; `crypto.subtle` ve `navigator.locks` var. v0.4 bu yerel olmayan kökende `?terrain=crash`'i uyguladı: 3 işçi çöktü, yedek açıldı. Yani K-08 github.io benzeri bir kökende yeniden üretildi. `http://oyun.ornek` güvenli bağlam olmazdı. Faz 2 (`crypto.subtle` HMAC) ve Faz 4 (Web Locks, `crypto.randomUUID`) bu API'leri kullanacağı için TK05 https ile yapılır. | Ek B.3 |
| N9-13 (inceleme ölçümü) | **Bellek.** 08_kalicilik (640×360) koşusunda koşucu ve Chromium süreç ağacının toplam RSS'i en çok **2,4 GB** oldu (açılışta); oyun sırasında 1,8–2,3 GB. Dört oyunculu ve oyuncu başına ayrı Chromium'lu (`--split`, Faz 2) koşuda üst sınır ≈ 4 × 2,4 ≈ 10 GB'tır. Bu 16 GB'lık koşucuya sığar, ama aynı işte iki tarayıcı paketi paralel koşmamalıdır. | Ek B.5 |
| N9-14 (inceleme ölçümü) | **Bu oturumdan okunabilen GitHub uçları.** Vekil üzerinden şunlar okunabiliyor: `actions/runs` (16 koşu; `event=dynamic` süzgeci çalışıyor, 762f1c7 için 1 sonuç), `deployments` (6 kayıt; `762f1c7` ve `ba85510` için ikişer, yani iki yayıncı), `commits/{sha}/pulls` (762f1c7 için 0), `rulesets` (`[]`) ve `rules/branches/claude/hopeful-cray-o1jw6w` (`[]`; canlı dalda bugün hiçbir kural yok). `/pages` ve `/environments*` vekil tarafından 403 ile reddediliyor. Depo herkese açık (`visibility: public`). | Ek B.4 |

### 0.3 Kararlar

Kullanıcı "bana soru sorma" dediği için her karar **varsayılanla** verilmiştir (KARARLAR.md ilkesi). Alternatifler son sütundadır.

| No | Karar | Uygulanan (varsayılan) | Seçenek ve etkisi |
|---|---|---|---|
| K9-1 | Yayın dalı | **`claude/hopeful-cray-o1jw6w`** kalır. Adı iş akışlarında sabit dizgedir; tutarlılığını `tests/node/yayin_politikasi.mjs` denetler. | `main`'e yeniden adlandırma (§2.1; kullanıcı adımı, ayarlar ve iş akışı birlikte güncellenir). Canlı adresi değiştirmez ama tetikleyici, ortam ve kural adlarının değişmesi gerekir. |
| K9-2 | Pages kaynağı | **GitHub Actions** (tek yayıncı). Dal tabanlı Jekyll yayını kapatılır [KU]. | Dal tabanlı yayın: iş akışındaki kapılar etkisiz kalır (K-05). Önerilmez. |
| K9-3 | Test kipi | `?test=1` **ve** yerel köken. Üretim yapıtlarında `js/core/testmode.js` ile test modülleri saplanır. Koşucular `test=1`'i kendileri ekler. | Yalnız `?test=1`: canlıda bağlantıyla açılabilir (K-08 açık kalır). Yalnız derleme bayrağı: modüler sürümde derleme adımı gerekir. |
| K9-4 | Üretimde tanı | `window.__dkDurum()` üretimde de kalır. **Salt-okur** bir anlık görüntü döndürür: sürüm, damga, hazır, işçi sayısı, yedek, eksik varlık, katı kip, tek dosya. Denetim nesnesi döndürmez. | Hiç tanı vermemek: yayın sonrası testte işçi ve varlık doğrulanamaz (T59–T61 yalnız dolaylı kalır). |
| K9-5 | Kökteki tek HTML (A-01, K-01) | v0.5 dalında **depodan çıkarılır**. Aynı adres (`…/DenizKorsanlari-SonHazine.html`) Pages yapıtından servis edilir. | CI her sürümde yeniden üretip commit eder. Bu, bot commit'leri, dal kuralı istisnası ve her sürümde 21 MB git geçmişi demektir. |
| K9-6 | Tek HTML çeşitleri | Üretim çeşidi `DenizKorsanlari-SonHazine.html` (kancasız). Test çeşidi `DenizKorsanlari-SonHazine.test.html` yalnız CI yapıtıdır, Pages'e girmez. | Tek çeşit: ya üretimde kanca kalır ya da tek HTML tarayıcıda test edilemez. |
| K9-7 | Bağımlılıklar | `package.json` + `package-lock.json`. Kesin sürümler: esbuild 0.24.2, playwright 1.63.0, peer 1.0.2 (yalnız devDependencies). `"type": "module"`. CI'da `npm ci`. | Kilitsiz sürüm: derleme özeti ve SwiftShader davranışı makineye göre değişir (K-15). |
| K9-8 | CI katmanları | `statik`, `duman` ve `tek` her push ve PR'da koşar (`duman` ile `tek` paralel). `coop2` ve `tam` yayın dalına açılan PR'da, `[tam]` etiketli commit'te ve elle tetiklemede koşar. | Her push'ta tam koşu: 1–2 saat, gereksiz. |
| K9-9 | PR'dan gelmeyen commit | Yayın işinde API denetimi yapılır: commit, yayın dalına birleştirilmiş bir PR'ın `merge_commit_sha`'sı olmalıdır [İA]. Ayrıca dal kuralı [KU] uygulanır. | `workflow_run` ve `pull_request closed` seçenekleri §2.4'te; ikisi de reddedildi. |
| K9-10 | `github-pages` ortamı | Dal politikası yalnız yayın dalı [KU]. **Zorunlu onaylayıcı: depo sahibi** ("canlıya al" düğmesi). Ortamın dal politikası canlıyı değiştirmeden **hemen** kurulabilir (§2.13). | Onaylayıcısız: birleştirme anında otomatik yayın. |
| K9-11 | Lisans metinleri (K-19) | `legalComments:'eof'` + `<script type="text/plain" id="dk-lisanslar">` bloğu (three ve PeerJS MIT, iki OFL, CC0). Krediler panelinden bağlantı verilir. | Yalnız başlıklar: OFL tam metni eksik kalır. |
| K9-12 | Katı kip (K-20) | Oyun paketine `banner: '"use strict";'` eklenir. IIFE biçimi korunur. | `format:'esm'` + `<script type="module">`: satır içi modül ertelenir ve `import.meta` belgeye bağlanır. Daha riskli. |
| K9-13 | Test kaydı | Katalog `tests/kabul/kullanici_testleri.mjs`, rapor şeması `dk-test-raporu/2`, toplayıcı `tools/test-kaydi.mjs`. Çıktılar `docs/v05/raporlar/TEST_KAYDI.{json,md}`. | Elle tablo: 62 × 8 alan sürdürülemez. |
| K9-14 | Teslim raporları | `docs/v05/raporlar/<AD>.md` (10 rapor). README'den bağlantı verilir. Her faz kapanışında ilgili rapor güncellenir. | Depo kökü: köke 10 dosya daha eklenir. |
| K9-15 | Davet bağlantısı (K-10) | `file:` altında Pages adresi + `?join=`. Adres derlemede `package.json` `homepage` alanından gömülür. | Yalnız oda kodu: davet bağlantısı olmaz. |
| K9-16 | Uygulama zamanı | (inceleme düzeltmesi) Şu adımlar Faz 1'in **ilk adımı** olarak öne çekilir: **Y1** (koşucu sıkılaştırma ve rapor şeması 2), **Y3** (test kipi; `surum.js` ve `__dkDurum` dahil, §8.2), Y0'ın bunlara ait kırmızı taban araçları ve **Y9a** (v0.5'teki bugünkü `pages.yml`'nin `deploy` işine ref koşulu ve `cancel-in-progress: false`; K-03'ün v0.5 için açık yolunu kapatır, canlıya dokunmaz). Y2 (`package.json`, kilit, `kos.mjs`) Y3'ün önkoşulu değildir ve Faz 9'da kalır. Faz 1–8 kapanışlarında ham `dk-test-raporu/2` raporları `docs/v05/kosular/faz<N>/` altına arşivlenir. `docs/v05/raporlar/` iskeleti ve elle güncellenen `durum.json` da Y1 commit'iyle açılır (§7.3). **Uygulama koşulu:** `faz1_brief.md` bu kararla çelişiyor: K-08'i Faz 9'a bırakıyor ve Y1–Y3'ü içermiyor. Faz 1 başlamadan önce brief'e Y1, Y3 ve Y9a eklenmeli, "K-08 Faz 9'da" notu kaldırılmalıdır. Gerekçe: Faz 2, 5 ve 6 `?test=1`'e dayanıyor; yutulan hatalar her fazın sonucunu bozar; K-08 ve K-03 güvenlik açığıdır (master_prompt §16: "acil güvenlik düzeltmeleri" istisnası). | Hepsi Faz 9'da: Faz 1–8 sonuçları onaysız ve hata yutan koşucuyla alınır. |
| K9-17 | Faz 3 ad çakışması | Faz 3'ün `23_guverte`, `24_sandik`, `25_yuksek_dusme` ve `26_gulle_nesne` adları Faz 4'ün `23`–`26` ayırmasıyla çakışıyor. Öneri: `22a_guverte`, `22b_sandik`, `22c_yuksek_dusme`, `22d_gulle_nesne`. Eksik gemi dalga testi için `22e_gemi_dalga`. Katalog benzersiz ad ister. (inceleme düzeltmesi) Kontrol kodları da çakışıyor: Faz 3'ün `YP01` (yapı türleri) ve `YD01–YD04` (yüksek düşme) kodları bu belgenin `YP01–YP13` (yayın politikası) ve `YD01–YD09` (canlı duman) kodlarıyla aynı. Toplayıcı ve raporlar kodu her zaman senaryo adıyla yazar (`yayin_duman:YD05`, `25_yuksek_dusme:YD01`); çıplak kodla eşleme yapılmaz. Bu düzeltmeler ve `22e_gemi_dalga`'nın Faz 3'e atanması (§6.8 T17) `KARARLAR.md`'ye ek olarak işlenir. | Faz 3 kendi adlarını seçer. Katalog denetimi ancak çakışma çözülünce geçer. |
| K9-18 (inceleme düzeltmesi) | Canlıya almadan önce sunucu tarafı koruma | §2.13'teki ortam dal kuralına ek olarak **durum denetimi içermeyen ilk ruleset** hemen kurulur: silme yasağı, zorla push yasağı, PR zorunlu (0 onay), atlama listesi boş. Canlı içeriği değiştirmez. Yanlış dala yapılan bir push'u (ajan dahil) sunucu tarafında reddeder. Durum denetimleri canlıya almada eklenir (§2.12 adım 5). Doğrulama API ile yapılabilir: `rules/branches/<yayın dalı>` (N9-14). | Yalnız canlıya almada kurmak: Faz 1–8 boyunca canlı dal yalnız dosya düzeyindeki filtreye ve dikkate kalır. |
| K9-19 (inceleme düzeltmesi) | Gerekli kontrol adları | Ruleset'te matris adları (`tam (1)`…) yerine iki kararlı ad gerekli yapılır: `ci.yml`'deki toplayıcı **`kapi`** işi ve `yayin-denetimi.yml`'deki `yayin_onkosul`. `kapi`, o olayda koşması gereken her işin `success` olmasını ister; atlanan iş başarı sayılmaz. | Matris adlarını tek tek gerekli yapmak: parça sayısı değişince ruleset de değişmeli. Ayrıca GitHub `if:` ile atlanan gerekli bir işi "başarılı" sayar. |
| K9-20 (inceleme düzeltmesi) | Test kipinde sinyal sunucusu | `?peerhost` test kipinde bile yalnız geri döngü adresi olabilir (`127.0.0.1`, `localhost`, `[::1]`); başka değer yok sayılır. | Her değer: README'nin "Yerel" yönergesiyle oyunu `localhost`'ta açan bir oyuncu, bağlantıyla kötü bir sinyal sunucusuna yönlendirilebilir (§5.1). |
| K9-21 (inceleme düzeltmesi) | CI süre bütçesi | `coop2` 2 parçaya bölünür: hesap ~75 dk ediyor, tek işte 120 dk sınırına yakın. `tam` 4 parça kalır (hesap ~2,8 sa → ~42 dk/parça). Hedef "en uzun parça ≤ 45 dk"tır; parça sayısı ilk ölçüm koşusundan sonra `tests/kabul/sureler.json`'a göre ayarlanır ve K9-19 sayesinde ruleset değişmez. 20 dakikadan uzun ya da tekrarlı koşular `dayaniklilik` işine gider: 52_uzun_oturum_gercek, 08f_coop_uzun, 06c/06z `--repeat 10`, 10_uzun_oturum, kamera_tarama. | Taslaktaki tek `coop2` işi ("30–60 dk") ve `tam`'daki uzun koşular: daha yavaş bir koşucuda zaman aşımı. |

---

## 1. Mevcut yayın hattının haritası

### 1.1 Akış

```
geliştirici/ajan ──push──► dal X ──(X'in UCUNDAKİ pages.yml'nin on.push filtresi X'i kapsıyor mu?)──┐
                                                                                                  ▼
"GitHub Pages" (pages.yml) : check ─ curl /repos/{r}/pages → 200 mü? ─► deploy (ortam: github-pages)
      checkout → configure-pages → esbuild 0.24.2 ile tek HTML (depo KÖKÜNE yazar) →
      upload-pages-artifact (path: .) → deploy-pages                                          ─► site
Pages kaynağı "Deploy from a branch" iken, kaynak dala her push'ta ayrıca:
      "pages build and deployment" (dinamik, jekyll-build-pages v1.0.13) → dalın ham içeriği      ─► site
      (iki yayıncı yarışır; sonra biten kazanır)
workflow_dispatch: Actions → Run workflow → herhangi bir dal → o dalın pages.yml'si koşar
```

### 1.2 İş akışı dosyasının sürümleri

| Satır | Canlı dal v0.3 (`762f1c7`, `git show origin/claude/hopeful-cray-o1jw6w:.github/workflows/pages.yml`) | v0.4/v0.5 (`44d548c`, `7858a89`) | Sorun |
|---|---|---|---|
| 1-3 | "derleme adımı yok"; "her push'ta otomatik yayınlanır" | aynı | Yorum gerçeği yansıtmıyor (K-17) |
| 8 | `branches: [main, master, 'claude/**']` | `[main, master, 'claude/hopeful-cray-o1jw6w']` (`d6e716f`) | K-02 (v0.3) |
| 9 | `workflow_dispatch:` (girdisiz, dal kısıtsız) | aynı | K-03 |
| 11-14 | `pages: write`, `id-token: write` iş akışı düzeyinde | aynı | Yetkiler `check` işine de gidiyor (K-18) |
| 16-18 | `group: pages`, `cancel-in-progress: true` | aynı | Süren üretim yayını iptal edilebilir |
| 21-31 | `check`: yalnız HTTP 200 → `enabled=true`; başka her kod sessiz atlama | aynı | K-18 |
| 33-36 | `deploy`: `needs: check`, `if: enabled == 'true'`; **ref koşulu yok** | aynı | K-02, K-03 |
| 37-39 | `environment: name: github-pages` | aynı | **Önemli:** iki sürümde de ortam bildirildiği için ortamın dal politikası iki sürümü de durdurabilir (§2.5, §2.13) |
| 44-47 | `npm i … esbuild@0.24.2`; `node tools/build-single-html.mjs DenizKorsanlari-SonHazine.html` (köke yazar) | aynı | Test ve çıktı denetimi yok (K-04, K-16) |
| 48-50 | `upload-pages-artifact@v3` `path: .` | aynı | K-06 (docs/, tests/, tools/ yayında) |

### 1.3 K-02 risk analizi: push olayında iş akışı gönderilen commit'teki dosyadan okunur

**Kural.** GitHub, `push` olayında `GITHUB_SHA`'daki (gönderilen dalın ucu) iş akışı dosyalarını değerlendirir. `on.push.branches` filtresi de **o sürümdeki** dosyadan okunur. Bu bir varsayım değildir; N9-1 iki bağımsız dalda doğrular. `claude/denetim-v0.4`'ün bütün gönderimleri, uç commit'leri `d6e716f`'den türediği için daraltılmış filtreyi taşıyordu ((inceleme düzeltmesi) belirleyici olan dalın ilk commit'i değil, her gönderimin ucudur). v0.5'in üç gönderimi de v0.4 `pages.yml`'sini taşıyordu. İkisinden de hiç koşu doğmadı.

**Sonuçlar:**

1. **Daraltma yalnız dosyayı taşıyan dalları korur.** v0.4 ve v0.5 tabanlı dallara gönderim yayın tetiklemez. Bu, `00_BASLANGIC_KAYDI.md` §1'deki iddiayı **push için** doğrular.
2. **Asıl risk: canlı daldan açılan yeni dallar.** Canlı dal varsayılan daldır ve `pages.yml:8`'de `'claude/**'` taşır. GitHub arayüzünden "yeni dal" ya da varsayılan daldan başlayan yeni bir Claude Code oturumu `claude/<ad>` dalını **v0.3 dosyasıyla** açar. Bu dala yapılan ilk push şu zinciri tetikler:
   - "GitHub Pages" koşar.
   - `deploy` işi ref denetlemez (`pages.yml:33-36`).
   - `deploy-pages` incelenmemiş içeriği canlıya gönderir.

   Bu zinciri yalnız `github-pages` ortamının dal politikası durdurabilir. O ayar okunamadı (`/environments` API 403). (inceleme düzeltmesi) GitHub, `github-pages` ortamını kendiliğinden oluştururken birçok depoda varsayılan dala sınırlı bir dağıtım kuralı da kuruyor. Topluluk kayıtlarında sık görülen "Branch … is not allowed to deploy to github-pages due to environment protection rules" hatası bundan gelir. Yani bu kaza yolu bugün zaten kapalı olabilir. Ancak bu depoda doğrulanamadığı için buna dayanılmaz ve §2.13'teki ara önlem geçerliliğini korur. Bugün depoda v0.3 tabanlı başka bir feature dalı yok (yalnız 3 dal var: canlı, `claude/denetim-v0.4`, `claude/v0.5-saglamlastirma`; hepsi `protected:false`). Risk gelecekte açılacak dallar içindir ve **canlı dal düzeltilene kadar** sürer.
3. **v0.5'i düzeltmek K-02'yi kapatmaz.** Kapatmanın iki yolu vardır:
   - (a) Düzeltilmiş `pages.yml`'nin **canlı dala** girmesi. Böylece yeni dallar düzgün dosyayı devralır. Bu ancak "canlıya al" ile olur.
   - (b) **Sunucu tarafı** bir ayar: ortam dal politikası. Bu ayar commit'teki dosyadan bağımsızdır ve hemen yapılabilir (§2.13).
4. **Dosya düzeyindeki filtre güvenlik sınırı değildir.** Herhangi bir dala yazabilen biri kendi `pages.yml`'sine kendi dalını ekleyerek yayın tetikleyebilir. Kaza durumlarına karşı dosya düzeyi koruma yeterlidir. Kasıtlı durumlara karşı yalnız sunucu tarafı ayarlar korur: ortam dal politikası, ortam onaylayıcısı ve dal kuralı. Ortam bildirmeyen bir işin `deploy-pages`'i kullanıp kullanamayacağı bu ortamda doğrulanamadı **[BELİRSİZ]**. Bugün var olan **bütün** `pages.yml` sürümleri ortam bildirdiği için (satır 37-39) ortam politikası kaza yollarının hepsini kapatır.
5. **Birleştirme anı.** v0.5 canlıya birleştirildiğinde canlı dala yapılan push, **v0.5'in** `pages.yml`'sini koşturur. Yani ilk yayın yeni ve korumalı hatla yapılır. Pages kaynağı hâlâ "dal" ise aynı push Jekyll yayınını da tetikler (K-05). Bu yüzden kaynak ayarı birleştirmeden **önce** değişmelidir (§2.12).
6. **`pull_request` olayı.** İş akışı PR'ın birleştirme commit'indeki (`refs/pull/N/merge`) dosyadan okunur. Canlı dalda `ci.yml` olmasa da v0.5→canlı PR'ında v0.5'in `ci.yml`'si koşar. Bu, CI'ı canlıya almadan önce sınamayı mümkün kılar.
7. (inceleme düzeltmesi) **İzleme sınırı.** `ci.yml` ve `yayin-denetimi.yml` push olayında gönderilen commit'ten okunur. Yani yalnız onları taşıyan dallarda koşarlar. K-02'nin riskli yolu, v0.3'ten açılan yeni dal, bu dosyaları taşımaz. Böyle bir dalda yapılan yayını hiçbir depo içi denetim göremez. Bu yüzden T62'nin çalışma anı denetimi (YP10) **depo geneline** bakar: son 30 günde `head_branch ≠ yayın dalı` olan "GitHub Pages" koşusu ve `ref ≠ yayın dalı` olan `github-pages` dağıtımı 0 olmalıdır. Aynı sorgu bu oturumun vekilinden de çalışıyor (N9-14). Ajan bunu her faz kapanışında `node tests/node/yayin_politikasi.mjs --canli --tum` ile koşar ve sonucu DEPLOYMENT_REPORT'a yazar. Canlıya alındıktan sonra açılan dallar `yayin-denetimi.yml`'yi devralır.
8. (inceleme düzeltmesi) **Bugünkü durum yeniden okundu (14 Kasım).** `deployments` 6 kayıt döndürdü; hepsinde `ref = claude/hopeful-cray-o1jw6w`. `rules/branches/claude/hopeful-cray-o1jw6w` boş liste döndürdü. Yani bugüne dek kaza olmamış, ama canlı dalda sunucu tarafında hiçbir kural yok. K9-18 bunu kapatır.

### 1.4 K-03: elle tetikleme

`workflow_dispatch` seçilen dalın dosyasını koşturur. "Run workflow" düğmesi, iş akışı varsayılan dalda bulunduğu için görünür. v0.5 dalının bugünkü dosyasında da ref koruması yoktur. Biri v0.5'i elle tetiklerse v0.5 canlıya çıkar. Bu oturumun araçlarında da bir tetikleme aracı vardır (`mcp__github__actions_run_trigger`). Yani yol bir ajan için de açıktır. Çözüm, yayın işinde ref koşuludur [İA] (§2.3); ortam politikası da bu yolu kapatır [KU]. `concurrency: cancel-in-progress: true` (16-18) süren bir canlı yayını iptal edebilir; yeni değer `false`'tur. (inceleme düzeltmesi) Bu yol bugün v0.5 dalı için de açıktır: v0.5'teki `pages.yml` hâlâ v0.4 sürümüdür ve `deploy` işinde ref koşulu yoktur. Y9a (K9-16) bu koşulu Faz 1 başında ekler. Ajan canlıya almadan önce hiçbir iş akışını elle tetiklemez (R20). Ortam dal kuralı (§2.13) kurulursa yol sunucu tarafında da kapanır.

### 1.5 K-05: iki yayıncı

Actions API'si (14 Kasım) aynı commit'ler için iki yayıncı gösteriyor:
- `762f1c7`: "GitHub Pages" koşusu 41221950903 (16:54:52 → 16:55:24) ve "pages build and deployment" (dinamik) koşusu 41221950864 (16:54:52 → **16:55:36**).
- `ba85510`: 41221472309 ve 41221473027.

Dal tabanlı derleme her iki seferde de sonra bitti. Bundan şu çıkar: kaynak "Deploy from a branch" ve canlıdaki içerik **dalın ham Jekyll çıktısıdır**. Bu çıktıya kökteki v0.3 tek HTML'i, `docs/` ve `tests/` dahildir. İş akışına eklenecek her kapı (test, `_site`, damga) bu yayıncıyı etkilemez. Çözümler:
- Kaynak = GitHub Actions [KU].
- İş akışı kaynağı denetler ve kaynak dal tabanlıysa **kırmızı** olur [İA] (§2.7).
- Yayın sonrası testte damga ve dinamik koşu yokluğu denetlenir (T61).

### 1.6 K-18: sessiz atlama

`pages.yml:30-31`, HTTP 200 dışındaki her yanıtta `enabled=false` yazıyor ve koşu yeşil kalıyor (örnek: run 41205990018). Yeni hatta yayın işinin ilk adımı `/pages`'i okur ve şöyle davranır:
- `build_type=workflow` ise devam eder.
- 404 alırsa ("Pages kapalı") hata verir.
- Diğer kodlarda yeniden dener, sonra hata verir.

Sessiz atlama yoktur (§2.10). İzinler iş düzeyine iner.

### 1.7 Tek HTML derleme aracının haritası (`tools/build-single-html.mjs`)

| Satır | Öğe | Durum ve ölçüm |
|---|---|---|
| 13 | `require('esbuild')` (`createRequire`) | Sürüm sabit değil (K-15). `npm i` olmadan `NODE_PATH` gerekiyor. |
| 15 | `OUT` varsayılanı `dist/…` (`.gitignore:2`) | Kök dosya bu araçla güncellenmedi (K-01) |
| 16, 24-28 | `WORKER_URL` kalıbı → `window.__DK_WORKER_URL`; kalıp yoksa hata (26) | Doğru. Ölçüm: çıktıda `new URL("./`) 0 (N9-4). |
| 22-23 | `three`, `three/addons/*` çözümü (importmap karşılığı) | Doğru |
| 32-38 `bundle()` | `format:'iife'`, `minify`, `legalComments:'none'` (35), `logLevel:'warning'` | Uyarı ölümcül değil (K-16); lisans siliniyor (K-19); `"use strict"` yok (K-20) |
| 41 `scriptSafe` | `</script` ve `<!--` kaçışı | Doğru |
| 59-67 | `assets/` yürüyüşü; `assets/fonts/` ve `*.txt` atlanıyor (63) | 87 dosya (53 model + 15 kk + 17 sfx + 1 müzik + `icon.svg`). OFL ve CC0 metinleri dışarıda kalıyor (K-19). |
| 68-72 | CSS `url(../assets/…)` → `data:` | 10 woff2 |
| 79-85 `key()` | URL'deki **ilk** `assets/` geçişi | K-09 (N9-2, N9-5) |
| 86-99 | `bytes()`, `window.fetch` yaması | Doğru; `C[k]` önbelleği `F[k]`'yi boşaltıyor (bellek) |
| 100-103 | `file:` → `data:` işçisi, değilse `blob:` | Köken `null` olan bağlamlar ele alınmıyor (A-16) |
| 104 | `window.__DK_SINGLE_FILE = true` | Davet bağlantısı (K-10) bunu kullanmalı |
| 110-123 `swap()` | Eksik işaretçide hata (111) | Doğru (derleme düşer) |
| 116 | importmap'in kaldırılması (`replace`, denetimsiz) | importmap biçimi değişirse sessizce kalabilir. Statik denetim yakalar (§4.3). |
| 131 | `main().catch` → `exit(1)` | Doğru |

**Ölçüm (Ek A.1):** v0.4 kaynağının yeniden derlemesi sha256 `75587dd9…` verdi (dist ile aynı). Oyun paketi 1 709 567 B, işçi 31 620 B, uyarı 0. Üretim derlemesinde `window.DK` 8 kez geçiyor ve `DK.sim` var (K-07).

### 1.8 Test altyapısının haritası

| Dosya:satır | Öğe | Sorun |
|---|---|---|
| `run.cjs:26` | `--url` varsayılanı `http://localhost:8080/index.html` | — |
| `run.cjs:36` | Chromium bayrakları (SwiftShader) | Yalnız Chromium; `--browser` yok |
| `run.cjs:38-42` | `console`: **`404` içeren hata tümüyle atılıyor** (40) | K-11 |
| `run.cjs:44` | `requestfailed` → `errors` | `errors` çıkış koduna girmiyor (96) |
| `run.cjs:59` | Senaryo dosyası `eval` ile adım dizisi | Meta alanı yok |
| `run.cjs:65-69` | `js` adımı istisnası → `fails++` (02 T09 düzeltmesi) | Doğru |
| `run.cjs:70-83` | `expect` (eq, truthy, gte, lte) | Beklenen değer rapora yazılmıyor |
| `run.cjs:96` | Çıkış = `fails` ya da `pageErrors` | Konsol hatası, ağ hatası ve onay sayısı 0 olan senaryo geçiyor (K-11, K-13) |
| `coop.cjs:20` | URL varsayılanı `…?peerhost=127.0.0.1&peerport=9000` | Test kipine bağlanacak |
| `coop.cjs:34` | Yalnız `error` ve `404` süzgeci; `warning` kaydı yok | K-11, K-12 |
| `coop.cjs:53` `ev()` | İstisna `EVALERR` yazılıp **yutuluyor** | K-12. Taban: 06a'da 19, 06a2'de 18, 06c'de 5 `EVALERR` var; **hepsi** kasıtlı kapatılan sekmeden ("closed"). |
| `coop.cjs:54` `tick()` | **Kapalı sayfalar da** `DK.sim` alıyor | `EVALERR`'lerin kaynağı |
| `coop.cjs:61` | Çıkış = `fails` ya da `pageErrors` | `checks.length === 0` geçiyor (`v03_coop3_referans.cjs` zaten koşucu kullanmıyor) |
| `tests/peer-server.cjs:4` | `require('peer')` (sürümsüz) | K-15 |

**Envanter:**
- `tests/scenarios/*.js`: 21 dosya. 20'sinde onay var; `03_fizik_dt.js`'de 0.
- `coop/*.cjs`: 6 dosya (biri v03 referansı).
- `tests/node`: 1 dosya.
- `v03/`: 99 dosya, hiçbirinde onay yok.
- `kamera_tarama/`: 6 ölçüm betiği. (inceleme düzeltmesi) Her birinde 1 onay var ("Oyun başladı"). K-13'ten sonra bunlar 1/1 GEÇTİ görünür, oysa asıl ölçüt `analiz.cjs`'tedir. Bu yüzden `{meta:{olcum:true}}` alırlar ve katalogda kanıt sayılmazlar. `coop/v03_coop3_referans.cjs` kendi tarayıcısını açar ve `coop.cjs`'den geçmez; `testUrl` onu kapsamaz. Yalnız v0.3/v0.4'e karşı koşulur ve kataloğa girmez.

Taban: 25 koşunun 23'ü tam geçti. Kalanlar 09_performans 8/9 ve 06c 2/7 (`00_BASLANGIC_KAYDI.md` §4). Taban JSON'larında `errors` dizileri hep 0. (inceleme düzeltmesi) Bu tek başına "K-11 sıkılaştırması yeni kırmızı üretmez" sonucunu taşımaz. `404` içeren konsol iletileri süzüldüğü ve bir 404 yanıtı `requestfailed` üretmediği için gizli 404'ler tabanda zaten görünmezdi. Ölçüm (Ek B.1): 00_acilis ve 08_kalicilik'te gizli 404 ve konsol hatası 0. 02_arazi_yedek'in `badurl` kipinde beklenen 3 × 404 ve 3 × `requestfailed` var; bu kip tabanda koşulmamıştı ve gerekçeli izin ister (§6.3-2). Kalan 22 koşunun kanıtı Y1 kabulüdür: tabanda geçen her koşu yeni koşucuyla da geçmelidir. Geçmeyen her izinsiz hata ya düzeltilir ya da gerekçesiyle izin listesine girer.

### 1.9 Test kancaları ve test URL parametreleri envanteri

| Kanca / parametre | Yer | Bugün | Faz 9 sonrası |
|---|---|---|---|
| `window.DK = {…49 alan}` | `main.js:134` | Koşulsuz | Yalnız test kipi (`js/test/kancalar.js`) |
| `DK.snap`, `DK.snapFrom` | `main.js:136-143` | Koşulsuz | Test kipi |
| `DK.sim(sn, dt)` | `main.js:145-149` | Koşulsuz | Test kipi + çağrı sayacı (§6.1) |
| `DK.tap`, `DK.press` | `main.js:150-152` | Koşulsuz | Test kipi |
| `window.__ready` | `main.js:153` | Koşulsuz | **Kalır** (zararsız; koşucu bekler) |
| `G.godMode` | `player.js:143` | `DK.G` üzerinden | `DK` yoksa erişilemez |
| `G.noAutoPause` | `main.js:377` | `DK.G` üzerinden | Aynı |
| `terrain.killWorkers()` | `terrain.js:189` | `DK.terrain` üzerinden | Aynı |
| `?terrain=noworker\|crash\|badurl` ve `window.__DK_TERRAIN_MODE` | `terrain.js:47, 61, 65, 69, 248-249` | Üretimde açık (K-08) | `TEST ? (__DK_TERRAIN_MODE \|\| testParam('terrain')) : ''`. Faz 1'in yeni kipleri (`ctorthrow`, `noready`, `hang`, `crash1`) de bu yoldan okunur. |
| `self.name === 'test-crash'` | `terrainWorker.js:8` | Ad yalnız `crash` kipinde veriliyor (`terrain.js:69`) | Erişilemez (kip kapalı). Satır kalabilir. |
| `?peerhost/peerport/peerpath/peersecure` | `net.js:49-55` `peerOpts()` | Üretimde açık; davet bağlantısıyla sinyal ele geçirme (K-08) | Yalnız `testParam(...)` |
| `?join=` | `main.js:132-133` | Meşru davet | Kalır |
| `?test=1` (Faz 2, 5, 6) | Planlanan | — | Test kipinin tek anahtarı (§5.1) |
| `DK.netTest` (Faz 2 `js/net/netTest.js`) | Planlanan | — | Yalnız test kipi ve host; dinamik `import`; üretimde saplama |
| `DK.netTest.stall/cut/busy…` (Faz 5 `js/net/netShape.js`) | Planlanan | — | Aynı kural |
| `DK.story` (Faz 6 §8.1) | Planlanan | "yayında Faz 9 kararına göre kapalı" | Test kipi |
| `DK.worldState.audit`, `DK.game._failStart` (Faz 4) | Planlanan | — | Test kipi (`_failStart` yalnız test kipinde okunur) |
| `onStep`, `DK.frames` (Faz 3) | Planlanan | — | Test kipi |
| `?dongu=eski` (Faz 3 K8; A11'de ya da A3 regresyonundan sonra kaldırılır) | Planlanan | — | Kaldırılmadıysa yalnız test kipi |
| `?turn=…&turnuser&turnpass`, `?turnapi=` (Faz 5 §7.4: "yalnız test için") | Planlanan | — | Yalnız `testParam`. `?turnapi` üretimde açık kalırsa ?peerhost türünde bir sızma olurdu: saldırganın TURN'ü IP'yi görür ve trafiği düşürebilir. |

### 1.10 K-01…K-20 (ve A-01, A-16) için çözüm tablosu

| No | Sorun (kısa) | Çözüm | Yer | Adım (§8.2) | Kabul |
|---|---|---|---|---|---|
| K-01 / A-01 | Kökteki tek HTML v0.3 | Depodan çıkar (`git rm`); yalnız CI üretir; damga (`<meta name="dk-build">`); README Pages adresini gösterir | [DA] [İA] [BE] | Y4, Y10 | Depoda tek HTML yok. Canlıdaki dosyanın damgası = `github.sha`. sha256 = CI yapıtı. 02_tek_dosya bu dosyaya karşı geçiyor. |
| K-02 | Canlı dalda `'claude/**'` | v0.5'te yeni `pages.yml` (push yalnız yayın dalı + ref koşulu); canlıya alınca yeni dallar devralır; **hemen**: ortam dal politikası; (inceleme düzeltmesi) hemen: durum denetimsiz ilk ruleset (K9-18) | [İA] [KU] | Y9, Y12, §2.13 | Yeni bir `claude/*` dalına push'ta yayın işi yok (koşu yok ya da `skipped`). `deployments?sha=` boş. (inceleme düzeltmesi) Depo geneli: son 30 günde yayın dalı dışında "GitHub Pages" koşusu ve `github-pages` dağıtımı 0 (YP10 `--tum`, §1.3-7). |
| K-03 | Kısıtsız dispatch | Yayın işinde `if: github.ref == 'refs/heads/<yayın>'`; ilk adımda kabukta yeniden denetim; ortam politikası; `cancel-in-progress: false` | [İA] [KU] | Y9 | Başka daldan dispatch → yayın işi `skipped`. Ortamda yalnız yayın dalı. |
| K-04 | Test ve PR kapısı yok | `ci.yml` (push, PR); yayın `needs: test`; PR denetimi; dal kuralı | [İA] [KU] | Y8, Y9 | Doğrudan push reddedilir; kırmızı CI'da yayın yok. |
| K-05 | İki yayıncı | Kaynak = Actions; `build_type` denetimi (değilse kırmızı); yayın sonrası damga ve dinamik koşu denetimi | [KU] [İA] | Y9, Y12 | Yayın dalına push sonrasında yalnız "GitHub Pages" koşar. sha başına 1 dağıtım var; damga = sha (90 sn sonra da). |
| K-06 | Artifact `path: .` | `tools/site-hazirla.mjs` → `_site/` izin listesi; `tools/site-denetle.mjs`; canlıda `docs/`, `tests/`, `tools/` 404 | [DA] [İA] | Y6 | Artifact listesinde izin listesi dışında dosya yok. Canlı yoklamada 404. |
| K-07 | `window.DK` üretimde | Test kipi (`testmode.js`, `test/kancalar.js`); üretim saplaması; işaret taraması | [OK] [DA] [KO] | Y3, Y4, Y6 | Üretim sayfasında ve üretim tek HTML'inde `typeof DK === 'undefined'` (`?test=1` ile bile). İşaret dizgesi 0. Test kipinde taban sonuçları aynı (§5.8). |
| K-08 | `?peerhost`, `?terrain` | `testParam()` yalnız test kipinde; (inceleme düzeltmesi) `peerhost` test kipinde de yalnız geri döngü adresi (K9-20) | [OK] | Y3 | 53_test_kipi: test kipi yokken `?peerhost` yok sayılır, `?terrain=crash` `mode===''`. (inceleme düzeltmesi) Test kipinde `peerhost=10.9.9.9` yok sayılır, `127.0.0.1` kabul edilir (TK08). |
| K-09 | `assets` klasörü | Yeni `key()` (sayfa dizinine göre) | [DA] | Y4 | 55_tek_varlik `assets/`, `game-assets/` ve yüzde kodlu klasörde 0 eksik varlık. 02_tek_dosya 4/4. |
| K-10 | `file://` davet bağlantısı | `davetBaglantisi(kod)`: `file:` altında `homepage` + `?join=` | [OK] [DA] | Y5 | 56_tek_uretim: lobide bağlantı `https://…github.io/SON-HAZ-NE/?join=`. http'de değişmez. |
| K-11 | Konsol hatası ve 404 sayılmıyor | Koşucu: her konsol hatası ve ağ hatası başarısızlıktır; izin listesi senaryo metasında ve gerekçeli. (inceleme düzeltmesi) İzin, ileti metni ve `location().url` üzerinde eşlenir; adres içermeyen "Failed to load resource" iletisi ağ kaydıyla tekilleştirilir (N9-11, §6.3-1). Kural oyun döngüsündeki istisnaları da kapsar: `engine.js:66` güncelleyici istisnalarını yalnız `console.error`'a yazıyor ve bugün bunlar çıkış kodunu etkilemiyor (`00_BASLANGIC_KAYDI.md` §4, 14 Kasım düzeltmesi) | [KO] | Y1 | Bozuk kopya (`chest.glb` silinmiş) ile 02_tek_dosya kalıyor. (inceleme düzeltmesi) Tabanda geçen 23 koşu yeni koşucuyla da geçiyor. badurl kipinde yalnız izinli 3 × 404 ve 3 × `requestfailed` var. |
| K-12 | coop `ev()` yutuyor | `tick()` kapalı sayfayı atlar. `ev(p, js, etiket, {kapaliIzinli})`; diğer istisnalar `fails`'e gider. Uyarılar kaydedilir. | [KO] | Y1 | Tabandaki 42 `EVALERR` (hepsi "closed") artık görünmüyor. Yapay bir istisna koşuyu kaldırıyor. |
| K-13 | Onaysız senaryo "GEÇTİ" | Onay sayısı 0 olan senaryo kalır; `meta.olcum` ise durumu `OLCUM` olur, asla GEÇTİ olmaz. 06a H07'yi Faz 2 tersine çevirir. | [KO] [BE] | Y1, Y7 | 03_fizik_dt (Faz 3 öncesi) `OLCUM`; v03 betikleri kataloğa giremez. (inceleme düzeltmesi) `kamera_tarama/*.js` (1 onay) `meta.olcum` alır; `coop/v03_coop3_referans.cjs` kataloğa girmez. |
| K-14 | tests/README bayat komut | Komut `npm run test:tek` olur (taze derleme + test derlemesi) | [BE] | Y10 | İki yönerge aynı taze dosyayı gösteriyor. |
| K-15 | Sürüm sabitleme yok | `package.json` + kilit; `npm ci` | [İA] [BE] | Y2 | `npm ci && npm run build:tek` iki makinede aynı sha256'yı veriyor. |
| K-16 | Uyarılar ölümcül değil | `logOverride: {'empty-import-meta':'error'}` + `warnings.length > 0` → hata; çıktı taraması | [DA] | Y4 | Sentetik `new URL('./x.js', import.meta.url)` ile derleme 1 koduyla çıkıyor (Ek A.2'de `ERROR … will be empty` doğrulandı). Gerçek kaynak 0 uyarı veriyor. |
| K-17 | Bayat belgeler | README sürüm/özellik/bağlantı; docs/11 ve 13'e "v0.4'te giderildi" notları; `pages.yml` yorumu | [BE] | Y10 | Sürüm dizgesi her yerde `SURUM` ile aynı (Node testi). |
| K-18 | 200 dışı sessiz atlama | Kaynak denetimi adımı (yeniden dene ve kırmızı ol); izinler iş düzeyinde | [İA] | Y9 | `/pages` 5xx → koşu kırmızı. |
| K-19 | Lisans notları siliniyor | `legalComments:'eof'` + lisans bloğu + Krediler bağlantısı | [DA] [OK] | Y4, Y5 | Tek HTML'de "Three.js Authors", PeerJS MIT, iki OFL ve CC0 metni var (statik denetim). |
| K-20 | Katı kip düşüyor | `banner: '"use strict";'`; `__dkDurum().kati` | [DA] [OK] | Y4 | Tek HTML'de `kati === true`; eşdeğerlik paketi aynı sonuçları veriyor. |
| A-16 | Köken `null` bağlamı | (inceleme düzeltmesi) **Faz 1 uygular** (`faz1_brief.md` madde 13): `location.protocol==='file:' \|\| self.origin==='null'` → `data:`; `blob:` kurulumu hata atarsa `data:` ile ikinci deneme. Faz 9 prelude'u ikinci kez yazmaz, yalnız 54'teki http'den sunulan iframe testini ekler. | [DA] (Faz 1) | Faz 1; Y4 (yalnız test) | 54_tek_isci: `sandbox="allow-scripts"` iframe içinde ≥ 1 işçi ya da açık yedek, sayfa hatası 0. |

---

## 2. Hedef yayın politikası

### 2.1 Yayın dalının tanımı (main dalı yokken)

- **Tanım (K9-1):** Yayın dalı, deponun varsayılan dalı olan `claude/hopeful-cray-o1jw6w`'dir. Canlı Pages yalnız bu dala birleştirilen commit'lerden üretilir. `main` ve `master` adları iş akışlarından **çıkar**: depoda bu dallar yok ve biri ileride açılırsa kendiliğinden yayın kapısı olmamalı.
- **Tek yer:** Ad, iş akışlarında sabit dizge olarak geçer. `on.push.branches` ifade kabul etmez; `if:` koşulları da bu yüzden sabit yazılır. Geçtiği yerler:
  - `pages.yml`: `on.push.branches`, `env.YAYIN_DALI`, iki `if:`;
  - `ci.yml`: `branches-ignore`, `pull_request.branches`;
  - `geri-donus.yml`;
  - (inceleme düzeltmesi) `yayin-denetimi.yml` (`branches-ignore`, `pull_request.branches`) ve `ci.yml`'deki `coop2`, `tam`, `kapi` koşulları (`github.ref != 'refs/heads/…'`).

  `tests/node/yayin_politikasi.mjs` bu dizgelerin hepsinin aynı olduğunu ve `package.json`'daki `"dkYayinDali"` alanıyla eşleştiğini denetler.
- **`claude/` öneki uyarısı:** Yayın dalı da `claude/**` kalıbına uyar. Feature dalları için yazılacak kurallarda `claude/**` kullanılmaz; yayın kuralları **tam adla** yazılır.
- **İsteğe bağlı `main`'e geçiş [KU]:** Yalnız "canlıya al"dan sonra ve ayrı bir PR olarak yapılır.
  1. Settings → Branches → varsayılan dalın yanındaki kalem simgesi → yeni ad `main` → Rename. GitHub açık PR'ları ve dal kurallarını taşır.
  2. Bir PR ile iş akışlarındaki bütün dizgeler ((inceleme düzeltmesi) düzeltilmiş dosyalarda sayı 7'den fazladır; YP08 hepsini bulur) `main` olur. Yayın politikası testi bunu zorunlu kılar.
  3. Settings → Environments → `github-pages` → dal kuralı `main`.
  4. Ruleset hedefi `main`.
  5. Yerel klonlarda `git fetch && git branch -m claude/hopeful-cray-o1jw6w main && git branch -u origin/main main`.

  Canlı adres (`…github.io/SON-HAZ-NE/`) değişmez.

### 2.2 Tetikleyiciler

| İş akışı | Olay | Filtre | Ne koşar |
|---|---|---|---|
| `pages.yml` | `push` | `branches: ['claude/hopeful-cray-o1jw6w']` | test (hızlı) → derle → yayınla (onay) → canlı duman |
| `pages.yml` | `workflow_dispatch` | Girdisiz | Aynı akış. Yayın işi yalnız yayın dalında koşar (dalın ucunu yeniden yayınlamak için). |
| `geri-donus.yml` | `workflow_dispatch` | `ref` (zorunlu) | Yalnız yayın dalında. `ref` yayın dalının **atası** olmalı. Eski ağaç yeni araçlarla derlenir, onaylanır, yayınlanır, kısıtlı duman testi koşar (§2.12). |
| `ci.yml` | `push` | `branches-ignore: ['claude/hopeful-cray-o1jw6w']` | statik, duman, tek, `kapi`; yayın dalı dışında `[tam]` etiketiyle coop2 ve tam. (inceleme düzeltmesi) Yayın denetimi `yayin-denetimi.yml`'ye taşındı (N9-10). |
| `ci.yml` | `pull_request` | `branches: ['claude/hopeful-cray-o1jw6w']` | statik, duman, tek, coop2 (2 parça), tam (4 parça), `kapi`, kayıt |
| `ci.yml` | `workflow_call` | `kapsam: hizli` | `pages.yml`'den çağrılır |
| `ci.yml` | `workflow_dispatch`, `schedule` | — | Tam kapsam. İkisi de iş akışının **varsayılan dalda** olmasını ister; yani canlıya alındıktan sonra çalışır. O zamana dek tam kapsam PR ve `[tam]` ile tetiklenir. |
| `yayin-denetimi.yml` (inceleme düzeltmesi, yeni) | `push` | `branches-ignore: ['claude/hopeful-cray-o1jw6w']` | `yayin_denetimi`: YP10 depo geneli (T62) |
| `yayin-denetimi.yml` | `pull_request` | `branches: ['claude/hopeful-cray-o1jw6w']` | `yayin_onkosul`: Pages kaynağı `workflow` mı (ruleset'te gerekli) |
| `dayaniklilik.yml` (inceleme düzeltmesi, yeni) | `schedule` (haftalık), `workflow_dispatch` | — | Uzun ve tekrarlı koşular (K9-21). İkisi de iş akışının varsayılan dalda olmasını ister; canlıya almadan önce aynı paket bir kez yerelde koşulur. |

Hiçbir iş akışında `pull_request_target` yok. Hiçbir iş akışı sır kullanmaz.

### 2.3 Yayın işinde ref koruması

```yaml
yayinla:
  if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w' && github.repository == 'adnanerdem2000-sudo/SON-HAZ-NE' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
  steps:
    - name: Ref denetimi
      run: test "$GITHUB_REF" = "refs/heads/$YAYIN_DALI" || { echo "::error::Yalnız $YAYIN_DALI yayınlanır ($GITHUB_REF)"; exit 1; }
```

- **İki katman:** Biri ifade (`if:`) düzeyinde, biri kabukta. İfadede bir yazım hatası olursa (ör. `refs/head/`) iş sessizce atlanırdı. Kabuk adımı ise kırmızı olur.
- **Depo koşulu:** Bir çatalda (fork) bu iş akışı kopyalanırsa yayın işi koşmaz.
- **Ortam:** Yayın işi `environment: github-pages` bildirir. Ortamın dal politikası (§2.5) üçüncü katmandır ve sunucu tarafındadır. Commit'teki dosyayla atlatılamaz.

### 2.4 PR'dan gelmeyen commit'in yayınlanmaması: iş akışı içi seçenekler

| Seçenek | Nasıl | Artısı | Eksisi | Karar |
|---|---|---|---|---|
| **A. Commit–PR ilişkisi** | Yayından önce `GET /repos/{r}/commits/{sha}/pulls`: `merged_at != null`, `merge_commit_sha == sha`, `base.ref == YAYIN_DALI` | Ayarsız çalışır. Doğrudan push'u (dal kuralı yokken ya da yönetici atlamasıyla) yakalar. Birleştirme, sıkıştırma ve yeniden temellendirme yöntemlerinin üçünde de `merge_commit_sha` yayın dalındaki yeni uca eşittir. | Aynı commit'te denetimi silen kişi atlatabilir; yani kasıtlı kişiye karşı değil, kazaya karşıdır. Dizin gecikmesi için 6 × 10 sn yeniden deneme gerekir. | **Uygulanır** [İA] |
| B. `workflow_run` | Yayın iş akışı CI tamamlanınca koşar; deploy mantığı varsayılan dalın dosyasından okunur | Feature dalı deploy mantığını değiştiremez | `head_branch` adının çatalda taklit edilmesine karşı ek denetim gerekir. `GITHUB_REF` hep varsayılan dal olduğu için ortam politikası anlamsızlaşır ve doğrulama iş akışına kalır. İki iş akışı arasında yapıt aktarımı gerekir. | Uygulanmaz |
| C. `pull_request: closed` + `merged` | PR kapanınca yayınla | PR zorunlu | Ref `refs/pull/N/merge` olur ve ortam dal politikası reddeder. `GITHUB_SHA` yayın dalının ucu değildir. | Uygulanmaz |
| D. Ortam onaylayıcısı | `github-pages` ortamında zorunlu onay (depo sahibi) | İnsan kapısı, yani "canlıya al" düğmesi. Ortam bildiren iş için dosyayla atlatılamaz. Herkese açık depoda ücretsizdir. | Elle onay gerekir | **Uygulanır** [KU] (K9-10) |
| E. Dal kuralı (ruleset) | PR zorunlu, gerekli kontroller, zorla push ve silme yasak, atlama listesi boş | Sunucu tarafı. Doğrudan push reddedilir. | Kullanıcı ayarıdır; kontrol adları ancak ilk koşudan sonra seçilebilir | **Uygulanır** [KU] |
| F. Etiketle yayın | Yalnız `v*` etiketinde yayın | Bilinçli sürüm | Bu ortamın git vekili etiket gönderimini 403 ile reddediyor (`00_BASLANGIC_KAYDI.md` §2); iş yükü artar | Uygulanmaz |

**A'nın betiği** (yayın işinde, `pull-requests: read`):

```bash
set -euo pipefail
for i in 1 2 3 4 5 6; do
  n=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/pulls" \
       --jq "[.[] | select(.merged_at != null and .merge_commit_sha == \"$GITHUB_SHA\" and .base.ref == \"$YAYIN_DALI\")] | length")
  [ "$n" -ge 1 ] && { echo "PR denetimi geçti"; exit 0; }
  sleep 10
done
echo "::error::$GITHUB_SHA, $YAYIN_DALI dalına birleştirilmiş bir PR'ın birleştirme commit'i değil; yayın durduruldu."
exit 1
```

**Nasıl sınanır (Y9):**
- `tests/node/yayin_politikasi.mjs` adımın varlığını ve `--jq` süzgecini denetler.
- Süzgecin mantığı, `gh` yerine kaydedilmiş JSON yanıtlarıyla (`tests/fixtures/yayin/pulls_*.json`) Node'da sınanır. Örnekler: birleşmiş PR, açık PR, başka tabana birleşmiş PR, boş liste.

### 2.5 Ortam koruma kuralları [KU]

Adım adım (GitHub web arayüzü):

1. Depo → **Settings** → sol menü **Environments** → **github-pages**.
2. **Deployment branches and tags** → **Selected branches and tags** → **Add deployment branch or tag rule**.
   - Ref type: **Branch**, Name pattern: `claude/hopeful-cray-o1jw6w` → **Add rule**.
   - Listede başka kural kalmasın.
3. **Required reviewers** kutusunu işaretleyin → `adnanerdem2000-sudo` ekleyin.
   - **Prevent self-review işaretlenmesin.** Tek geliştirici kendi birleştirdiği yayını onaylayabilmelidir.
4. **Allow administrators to bypass configured protection rules** işaretini kaldırın.
5. **Save protection rules**.

**Etkisi:**
- Ortam bildiren **her** `pages.yml` sürümü (v0.3 dahil, satır 37-39) yayın dalı dışındaki ref'te "Branch … is not allowed to deploy to github-pages due to environment protection rules" hatasıyla durur.
- Yayın dalında yayın işi "Waiting for review" durumunda bekler. Actions → koşu → **Review deployments** → `github-pages` → **Approve and deploy**.
- Onaysız bekleyen yayın 30 gün sonra kendiliğinden iptal olur.

**Doğrulama:** Bu oturumun belirteci `/environments` için 403 alıyor. Doğrulamayı kullanıcı arayüzde yapar. Bir sonraki yayın koşusunda "Waiting for review" görülmesi kanıttır ve DEPLOYMENT_REPORT'a yazılır. Dal politikası, §2.13'teki ara önlem olarak canlıya almadan önce de kurulabilir. (inceleme düzeltmesi) Ruleset ve dal kuralları bu oturumdan API ile doğrulanabilir: `gh api repos/{r}/rules/branches/claude/hopeful-cray-o1jw6w` (14 Kasım'da `[]`). Ortam ayarı vekilde 403 olduğu için yalnız ekran görüntüsüyle (E4) ve ilk "Waiting for review" gözlemiyle doğrulanır. CI içinde `GITHUB_TOKEN` okumaya izin verirse `yayin_onkosul` `environments/github-pages/deployment-branch-policies`'i de okur ve sonucu bilgi olarak yazar. Okuyamazsa kırmızı olmaz, "doğrulanamadı" yazar **[BELİRSİZ]**.

### 2.6 Dal kuralı (ruleset) ve Actions ayarları [KU]

**A. Settings → Rules → Rulesets → New ruleset → New branch ruleset:**
- Ruleset name: `yayin-dali`
- Enforcement status: **Active**
- Bypass list: **boş**
- Target branches: **Add target → Include by pattern** → `claude/hopeful-cray-o1jw6w`
- Kurallar:
  - ✔ Restrict deletions
  - ✔ Block force pushes
  - ✔ **Require a pull request before merging** (Required approvals: **0**; tek geliştirici kendi PR'ını onaylayamaz. PR zorunluluğu ve kontroller yine geçerlidir.)
  - ✔ **Require status checks to pass** → ✔ Require branches to be up to date before merging → kontroller: (inceleme düzeltmesi) yalnız **`kapi`** ve **`yayin_onkosul`** (K9-19). `kapi`, `ci.yml`'deki bütün test işlerinin (statik, duman, tek, coop2 ×2, tam ×4) `success` olmasını ister. Matris adları gerekli yapılmaz. Aksi hâlde parça sayısı değişince ruleset'in de değişmesi gerekirdi; ayrıca GitHub, `if:` ile atlanan gerekli bir işi "başarılı" sayar.

  Kontrol adları listede ancak bir kez koştuktan sonra görünür. Bu yüzden ruleset, v0.5→canlı PR'ının ilk CI koşusundan **sonra** kurulur (§2.12 adım 5). (inceleme düzeltmesi) Bu, durum denetimli **son** sürüm içindir. Durum denetimsiz ilk sürüm (silme ve zorla push yasağı, PR zorunlu) hemen kurulur (K9-18, §2.13). Son sürümde ona yalnız iki gerekli kontrol eklenir.
- Klasik alternatif: Settings → Branches → Add branch protection rule. Aynı seçenekler + **Do not allow bypassing the above settings**.

**B. Settings → Actions → General:**
- **Workflow permissions:** "Read repository contents and packages permissions". İş akışları gereken yetkiyi iş düzeyinde ister.
- **"Allow GitHub Actions to create and approve pull requests":** kapalı.
- (İsteğe bağlı) **Actions permissions:** "Allow … and select non-… actions" → `actions/*`. Bu, tedarik zinciri yüzeyini daraltır.

**C. Settings → Pages:** Kaynak ayarı için bkz. §2.7.

### 2.7 Dal tabanlı ikinci yayıncı (K-05)

1. **[KU] Settings → Pages → Build and deployment → Source: GitHub Actions.**
   - Bu ayarla dinamik "pages build and deployment" iş akışı artık tetiklenmez.
   - Mevcut yayının yeni bir dağıtım gelene dek sunulmaya devam ettiği GitHub belgelerinden anlaşılıyor, ancak burada doğrulanamadı **[BELİRSİZ]**. Bu yüzden ayar birleştirmeden hemen önce yapılır ve ardından ya v0.3'ün kendi iş akışı (bkz. §2.12 adım 7, prova) ya da birleştirme gelir.
2. **[İA] Kaynak denetimi:** Yayın işinin ilk adımı `gh api repos/{r}/pages --jq .build_type` çalıştırır:
   - sonuç `workflow` değilse kırmızı olur ("Kaynak dal tabanlı; Settings → Pages → Source: GitHub Actions yapılmadan yayın yapılmaz");
   - 404 alırsa kırmızı olur (Pages kapalı);
   - 5xx alırsa üç denemeden sonra kırmızı olur (K-18).

   Böylece ayar yapılmamışsa yayın görünür biçimde durur.
3. **[İA] Yayın sonrası denetim:**
   - Damga 0. ve 90. saniyede okunur ve `github.sha`'ya eşit olmalıdır. Sonra biten dal derlemesi damgasız ham `index.html` yayınlarsa yakalanır.
   - `GET /repos/{r}/actions/runs?head_sha={sha}&event=dynamic` → `total_count` 0 olmalı.
   - `GET /repos/{r}/deployments?sha={sha}&environment=github-pages` → 1 kayıt olmalı.
4. **`.nojekyll` neden çözüm değil?** K-05'in önerisindeki `.nojekyll` yalnız dal tabanlı derlemede Jekyll'ı kapatır. İkinci yayıncıyı kaldırmaz ve dalın ham içeriğini yine yayınlar. GitHub Actions yayınında Jekyll hiç koşmaz. Bu yüzden depo köküne `.nojekyll` **eklenmez**. Asıl çözüm 1. adımdır.

### 2.8 Pages yapıtı: yalnız gerekli dosyalar (`_site/`, K-06)

`tools/site-hazirla.mjs [--kaynak .] [--cikis _site] --damga <sha> [--onek /SON-HAZ-NE/]` [DA]:

| Yol | Kaynak | İşlem |
|---|---|---|
| `index.html` | `index.html` | `<meta name="dk-build" content="gelistirme">` → `content="<sha40>"`; `<meta name="dk-version">` → `SURUM` |
| `css/style.css` | aynı | kopya |
| `js/**` | `js/**` | Kopyalanır. **Hariç:** `js/test/**`, `js/net/netTest.js`, `js/net/netShape.js`. **Saplama:** `js/core/testmode.js` → `export const TEST = false; export function testParam() { return null; }` |
| `vendor/**` | aynı | Kopya (`three/LICENSE`, `peerjs/LICENSE` dahil) |
| `assets/**` | aynı | Kopya (`fonts/OFL-*.txt`, `CC0-1.0.txt` dahil) |
| `CREDITS.md` | aynı | Kopya (Krediler panelinin gösterdiği lisans kaydı) |
| `DenizKorsanlari-SonHazine.html` | `dist/` üretim çeşidi | Kopya. Damga aynı sha'dır. |
| `surum.json` | üretilir | `{surum, commit, tarih (commit tarihi), tekHtml:{bayt, sha256}}` |

**Dışarıda kalanlar:** `README.md`, `TEST_RAPORU.md`, `docs/`, `tests/`, `tools/`, `dev/`, `dist/`, `.github/`, `package*.json`, `node_modules/`, test çeşidi tek HTML.

`tools/site-denetle.mjs` [DA] şunları denetler:
1. `_site`'daki her yol izin listesinde mi?
2. Yasak kalıplar: `js/test/`, `netTest`, `netShape`, `.md` (yalnız `CREDITS.md` serbest), `test.html`.
3. Saplama birebir metin mi?
4. **İçe aktarma grafı.** `index.html`'deki importmap, `<script src>` ve `<link href>` başvuruları ile `js/**/*.js` içindeki `import … from '…'`, `export … from '…'`, `import('…')` ve `new URL('…', import.meta.url)` hedefleri `_site`'da var mı? `three` ve `three/addons/` importmap ile çözülür. Test modüllerine giden dinamik `import()`'lar bilerek yoktur ve hariç tutulur; onları 5. madde denetler.
5. Test modüllerine başvuru yalnız `if (TEST …)` arkasındaki dinamik `import()` ile mi? Statik `import` 0 olmalı (§5.3).
6. Toplam boyut ≤ 48 MB. Bugün yaklaşık 40 MB: varlık 14,8 MB + js 1,4 MB + vendor 2,4 MB + tek HTML 21 MB.

Çıktı `tests/out/site_denetim.json` dosyasıdır.

### 2.9 Derleme ya da test başarısızsa yayın yok

- Zincir: `test` (ci.yml) → `derle` → `yayinla` → `canli-duman`. Her halka `needs:` ile bağlıdır. Önceki kırmızıysa sonraki `skipped` olur.
- `derle` içinde şunlardan biri yayını durdurur:
  - esbuild uyarısı ya da hatası (K-16),
  - `swap` işaretçisinin eksikliği,
  - statik denetimin herhangi bir maddesi (§4.3),
  - `_site` denetimi,
  - **yerel yayın provası:** 56_tek_uretim ve 57_site_uretim, aynı `_site` dizinine `/SON-HAZ-NE/` alt yolunda koşar.
- Bütün `run:` blokları `set -euo pipefail` ile başlar.
- `yayinla` içinde şunlar yayını durdurur: ref, kaynak ve PR denetimi.
- `canli-duman` yayından sonra koştuğu için canlıyı durduramaz. Kırmızıysa koşu kırmızı olur, DEPLOYMENT_REPORT'a düşer ve §2.12'deki geri dönüş kararına girdi olur.

### 2.10 Hedef `pages.yml`

```yaml
# Deniz Korsanları — üretim yayını (GitHub Pages). Yalnız yayın dalına birleştirilen PR'lar canlıya çıkar:
#   test (ci.yml, hızlı) → derle (_site + tek HTML + statik denetim + yerel prova) →
#   yayınla (ref, Pages kaynağı ve PR denetimi; github-pages ortam onayı) → canlı duman (T61).
# Gerekli kullanıcı ayarları: docs/v05/raporlar/DEPLOYMENT_REPORT.md "Ayarlar" bölümü.
name: GitHub Pages
on:
  push:
    branches: ['claude/hopeful-cray-o1jw6w']
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: pages-uretim
  cancel-in-progress: false
env:
  YAYIN_DALI: claude/hopeful-cray-o1jw6w
jobs:
  test:
    if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'
    permissions:
      contents: read      # (inceleme düzeltmesi) çağrılan ci.yml'deki her iş bununla yetinir; fazlasını isteyen iş koşuyu başlamadan düşürür (N9-10, YP11)
    uses: ./.github/workflows/ci.yml
    with:
      kapsam: hizli
  derle:
    needs: test
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    outputs:
      tek_sha256: ${{ steps.tek.outputs.sha256 }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci
      - id: tek
        name: Tek HTML (üretim + test) ve statik denetim
        run: |
          set -euo pipefail
          npm run build:tek -- --damga "$GITHUB_SHA"
          npm run build:tek:test -- --damga "$GITHUB_SHA"
          npm run denetle:tek
          echo "sha256=$(sha256sum dist/DenizKorsanlari-SonHazine.html | cut -d' ' -f1)" >> "$GITHUB_OUTPUT"
      - name: _site hazırla ve denetle
        run: |
          set -euo pipefail
          npm run build:site -- --damga "$GITHUB_SHA"
          npm run denetle:site
      - run: npx playwright install --with-deps --only-shell chromium
      - name: Yapıtın yerel provası (56_tek_uretim, 57_site_uretim; /SON-HAZ-NE/ alt yolu)
        run: node tests/kos.mjs yerel-yayin --site _site --onek /SON-HAZ-NE/ --rapor tests/out/yerel_yayin
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site, retention-days: 30 }   # (inceleme düzeltmesi) R1b: yeniden koşma penceresiyle (30 gün) aynı
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: derle-raporlari, path: tests/out/, retention-days: 14 }
  yayinla:
    needs: derle
    if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w' && github.repository == 'adnanerdem2000-sudo/SON-HAZ-NE' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions:
      contents: read
      pages: write
      id-token: write
      pull-requests: read
    environment:
      name: github-pages
      url: ${{ steps.dagitim.outputs.page_url }}
    outputs:
      page_url: ${{ steps.dagitim.outputs.page_url }}
    steps:
      - name: Ref denetimi
        run: test "$GITHUB_REF" = "refs/heads/$YAYIN_DALI" || { echo "::error::Yalnız $YAYIN_DALI yayınlanır ($GITHUB_REF)"; exit 1; }
      - name: Pages kaynağı GitHub Actions mı (tek yayıncı)
        env: { GH_TOKEN: '${{ github.token }}' }
        run: |
          set -uo pipefail
          for i in 1 2 3; do
            bt=$(gh api "repos/$GITHUB_REPOSITORY/pages" --jq .build_type 2>err.txt) && break
            grep -q "HTTP 404" err.txt && { echo "::error::Pages bu depoda kapalı."; exit 1; }
            sleep 10
          done
          [ "${bt:-}" = "workflow" ] || { echo "::error::Pages kaynağı '${bt:-okunamadı}'. Settings → Pages → Source: GitHub Actions yapılmadan yayın yapılmaz."; exit 1; }
      - name: PR denetimi
        env: { GH_TOKEN: '${{ github.token }}' }
        run: bash .github/betikler/pr_denetimi.sh   # §2.4'teki betik; dosyada durur, Node testi süzgeci sınar
      - uses: actions/configure-pages@v5
      - id: dagitim
        uses: actions/deploy-pages@v4
  canli-duman:
    needs: [derle, yayinla]
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions:
      contents: read
      actions: read
      deployments: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci && npx playwright install --with-deps --only-shell chromium
      - name: Yayın sonrası duman testi (T61)
        env: { GH_TOKEN: '${{ github.token }}' }
        run: node tests/yayin/yayin_duman.mjs --url "${{ needs.yayinla.outputs.page_url }}" --sha "$GITHUB_SHA" --tek-sha256 "${{ needs.derle.outputs.tek_sha256 }}" --rapor tests/out/yayin_duman
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: canli-duman, path: tests/out/yayin_duman, retention-days: 30 }
```

**Notlar:**
- **Yayın sonrasında `pages build and deployment` görülürse:** `canli-duman` bunu dinamik koşu sayacıyla yakalar.
- **Neden yayın dalı push'unda `kapsam: hizli`?** PR'da `tam` zaten koştu ve dal kuralı "up to date" ister. Bu yüzden birleştirme sonrası commit'in ağacı PR'ın birleştirme önizlemesiyle aynıdır.
- **Eylem sürümleri:** `actions/*@v4`, `@v5` ve `@v3` büyük sürüm etiketleriyle kalır. İsteğe bağlı sıkılaştırma olarak SHA sabitleme ve Dependabot (`.github/dependabot.yml`, `github-actions` ekosistemi) önerilir.
- (inceleme düzeltmesi) **İzinler ve çağrılan iş akışı.** `test` işi `ci.yml`'yi çağırır. Çağrılan iş akışındaki hiçbir iş, çağıranın verdiğinden (`contents: read`) geniş izin isteyemez; isterse koşu başlamadan düşer (N9-10). İzin isteyen denetimler bu yüzden `yayin-denetimi.yml`'dedir. YP11 bunu her commit'te denetler.
- (inceleme düzeltmesi) **`[tam]` etiketi yayın hattını uzatmaz.** `ci.yml`'deki `[tam]` koşulu yalnız yayın dalı dışındaki push'ta geçerlidir (§3.2). Sıkıştırılmış birleştirmenin iletisinde `[tam]` geçse bile yayın hattında yalnız hızlı kapsam koşar.
- (inceleme düzeltmesi) **Yapıt saklama süresi 30 gün.** Önceki bir yayın, o koşunun `yayinla` işi yeniden koşturularak aynı baytlarla geri getirilebilir (R1b, §2.12). GitHub yeniden koşmayı 30 günle sınırlar; saklama süresi bu yüzden 30 gündür. Yeniden koşturulan işin aynı koşunun yapıtını kullandığı burada doğrulanamadı **[BELİRSİZ]**.

### 2.11 `geri-donus.yml` (yalnız acil durum)

```yaml
name: Geri dönüş
on:
  workflow_dispatch:
    inputs:
      ref: { description: 'Yayın dalı geçmişinden önceki iyi commit; 40 haneli sha (ilk yayında 762f1c76674cad279931e28b5148a94933832b43)', required: true }
permissions: { contents: read }
concurrency: { group: pages-uretim, cancel-in-progress: false }
env:
  YAYIN_DALI: claude/hopeful-cray-o1jw6w
  HEDEF: ${{ inputs.ref }}          # (inceleme düzeltmesi) kabuğa ${{ }} ile değil ortam değişkeniyle gelir (YP12)
jobs:
  derle:
    if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4                      # araçlar: yayın dalının ucu (güvenilir)
        with: { path: arac, fetch-depth: 0 }
      - name: ref biçimi ve yayın dalının atası mı
        run: |
          set -euo pipefail
          [[ "$HEDEF" =~ ^[0-9a-f]{40}$ ]] || { echo "::error::ref 40 haneli küçük harfli sha olmalı"; exit 1; }
          git -C arac merge-base --is-ancestor "$HEDEF" "origin/$YAYIN_DALI"
      - uses: actions/checkout@v4                      # içerik: geri dönülen ağaç
        with: { path: kaynak, ref: '${{ inputs.ref }}' }
      - name: Eski ağacı yeni araçlarla derle, denetle ve yerelde prova et   # (inceleme düzeltmesi)
        run: |
          set -euo pipefail
          cd arac && npm ci
          node tools/build-single-html.mjs --kok ../kaynak --eski-agac-izni --damga "$HEDEF" --cikis ../kaynak/dist/DenizKorsanlari-SonHazine.html
          node tools/tek-html-denetle.mjs ../kaynak/dist/DenizKorsanlari-SonHazine.html --eski-agac-izni
          node tools/site-hazirla.mjs --kaynak ../kaynak --cikis ../_site --damga "$HEDEF" --eski-agac-izni
          npx playwright install --with-deps --only-shell chromium
          node tests/kos.mjs yerel-yayin --site ../_site --onek /SON-HAZ-NE/ --profil geri-donus --rapor ../rapor/geri_donus_prova
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site, retention-days: 30 }
  yayinla:
    needs: derle
    if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    outputs: { page_url: '${{ steps.d.outputs.page_url }}' }
    steps:
      - uses: actions/configure-pages@v5
      - id: d
        uses: actions/deploy-pages@v4
  duman:                                               # (inceleme düzeltmesi) taslakta metinde vardı, YAML'da yoktu
    needs: yayinla
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npx playwright install --with-deps --only-shell chromium
      - run: node tests/yayin/yayin_duman.mjs --profil geri-donus --url "$SAYFA" --sha "$HEDEF" --rapor tests/out/geri_donus
        env: { SAYFA: '${{ needs.yayinla.outputs.page_url }}' }
```

- (inceleme düzeltmesi) `--eski-agac-izni` üç araçta da gerekir:
  - `build-single-html.mjs`: eski `index.html`'de `dk-build`/`dk-version` meta'sı yoksa onları `<head>`'e **ekler**. CSP meta'sı yoksa CSP adımını atlar ve özete `csp:'yok'` yazar.
  - `tek-html-denetle.mjs`: S9, S10 ve S13 yerine "eski ağaç" notu yazar; v0.3 ve v0.4'te `window.DK` koşulsuzdur.
  - `site-hazirla.mjs`: `testmode.js` yoksa saplama adımını uyarıyla atlar.

  v0.3 ağacının işçi ifadesi (`terrain.js:44`: `new Worker(new URL('./terrainWorker.js', import.meta.url), …)`) `WORKER_URL` dizgesini içerdiği için derleme düşmez. Lisans dosyaları v0.3'te de var (`git ls-tree 762f1c7`).
- Kısıtlı duman testi (`yayin_duman.mjs --profil geri-donus`) damga ve açılışa bakar. v0.3'te `window.DK` açık olduğu için `DK` yokluğunu denetlemez. (inceleme düzeltmesi) Taslakta bu test metinde vardı ama YAML'da iş yoktu; `duman` işi eklendi. `ref` girdisi kabuğa `${{ }}` ile değil ortam değişkeniyle gelir ve 40 haneli sha olarak doğrulanır (betik enjeksiyonu, YP12).
- (inceleme düzeltmesi) **Prova (Y9 kabulü).** `derle` adımları yerelde 762f1c7 ve 44d548c ağaçlarına karşı koşulur. Her ikisinde `_site` üretilmeli ve `kos.mjs yerel-yayin --profil geri-donus` geçmelidir. Prova geçmeden R1 "hazır" sayılmaz.

### 2.12 "Canlıya al" geçiş planı (sırayla) ve geri dönüş

**Ön koşullar (kapı):**
- Faz 1–8 kabul ölçütleri geçmiş olmalı.
- Faz 9 Y1–Y11 bitmiş olmalı.
- v0.5 ucunda `tam` CI yeşil olmalı.
- REGRESSION_REPORT'ta v0.4 tabanına göre **0 regresyon** olmalı (§7.4).
- DEPLOYMENT_REPORT'ta ayar listesi hazır olmalı.
- Kullanıcı açıkça "canlıya al" demiş olmalı.
- (inceleme düzeltmesi) "Canlıya al" komutu bu tablodaki [AJ] adımlarını, birleştirme dahil, kapsar; ajan ayrıca soru sormaz. [KU] adımlarını DEPLOYMENT_REPORT'ta yapılacaklar listesi olarak bildirir ve kullanıcının yapmasını bekler.

Adımları kim yapar: [KU] kullanıcı, [AJ] ajan (kullanıcının komutuyla), [OT] otomatik.

| # | Kim | Adım | Doğrulama |
|---|---|---|---|
| 1 | [AJ] | Aday commit'i dondur ve sha'yı DEPLOYMENT_REPORT'a yaz. Ucu `[tam]` etiketli değilse boş bir `[tam]` commit'i gönder. | `ci.yml` tam koşusu yeşil |
| 2 | [KU] | §2.5 ortam kuralları (§2.13'te yapılmadıysa) | Arayüz |
| 3 | [KU] | §2.6-B Actions izinleri | Arayüz |
| 4 | [AJ] | PR aç: taban `claude/hopeful-cray-o1jw6w` ← `claude/v0.5-saglamlastirma` (araç: `mcp__github__create_pull_request`). Gövdede raporlar ve ayar listesine bağlantı olsun. | `pull_request` olayı: statik, duman, tek, coop2 ×2, tam ×4, `kapi`, kayıt; `yayin-denetimi.yml`: `yayin_onkosul` ((inceleme düzeltmesi)) |
| 5 | [KU] | §2.6-A ruleset (kontrol adları artık listede) | Arayüz; PR sayfasında "Required" etiketleri (inceleme düzeltmesi) K9-18'deki ilk ruleset'e `kapi` ve `yayin_onkosul` gerekli kontrolleri eklenir; doğrulama `rules/branches/…` API'siyle yapılır. |
| 6 | [OT]/[AJ] | CI yeşil. Kırmızıysa v0.5 dalında düzelt ve gönder; PR kendiliğinden güncellenir. **İstisna:** `yayin_onkosul` 7. adıma dek bilinçli olarak kırmızıdır. | `yayin_onkosul` dışındaki kontroller ✔ |
| 7 | [KU] | Settings → Pages → Source: **GitHub Actions**. Ardından PR'da `yayin_onkosul` yeniden koşturulur (Re-run) ve yeşil olur. (inceleme düzeltmesi) **Zorunlu prova** (kaynak değişince mevcut yayının sunulmaya devam ettiği doğrulanamadı, §2.7; prova ortam onayını da gerçek birleştirmeden önce sınar): Actions → "GitHub Pages" → Run workflow → branch: `claude/hopeful-cray-o1jw6w` → v0.3 iş akışı v0.3'ü bu kez Actions yoluyla yeniden yayınlar. İçerik değişmez; tek yayıncıya geçiş ve ortam onayı sınanır. | Koşu yeşil; dinamik koşu yok; (inceleme düzeltmesi) prova sonrasında açılış ve tek HTML adresi 200 (`yayin_duman --profil geri-donus --url …`) |
| 8 | [KU] (ya da "canlıya al" komutu kapsamında [AJ]: `mcp__github__merge_pull_request`, yöntem: merge) | PR'ı birleştir | Yayın dalında yeni uç = birleştirme commit'i |
| 9 | [OT] | v0.5 `pages.yml`: test (hızlı) → derle → yayınla **onay bekler** | "Waiting for review" |
| 10 | [KU] | Actions → koşu → Review deployments → **Approve and deploy** | Yayın işi yeşil |
| 11 | [OT] | `canli-duman` (T61) | Rapor yapıtı; özet sayfası |
| 12 | [AJ] | DEPLOYMENT_REPORT "Canlıya alma kaydı": sha, koşu kimliği, saat, duman sonuçları, `deployments` sayısı, dinamik koşu 0. README'deki bağlantıları sına. | Rapor commit'i (v0.5 dalına; sonraki PR ile canlıya gider) |
| 13 | [KU] | İlk 24 saatte elle kontroller (§7.5): gerçek GPU'da 30 dk oyun; gerçek ağda 2–4 oyuncu; Firefox ve Safari'de tek HTML | ELLE kayıtları |

**Geri dönüş tetikleyicileri:**
- canlı duman kırmızı ve 30 dk içinde ileri düzeltme (yeni PR) mümkün değil;
- oyun açılmıyor (`__ready` gelmiyor);
- kayıt bozulması şüphesi. Bu en ağır durumdur: hemen R1 uygulanır.

| Yol | Ne | Süre | Not |
|---|---|---|---|
| **R1** (içerik, hızlı) | Actions → **Geri dönüş** → Run workflow (dal: yayın dalı) → `ref` = önceki iyi commit (ilk yayında `762f1c7`) → onay | ~10 dk | Yayın dalının ucu v0.5 kalır; bir sonraki birleştirme ileri düzeltmeyi yayınlar. **Uyarı:** v0.3'e dönülünce `DK` yeniden açılır. v0.5'e özgü kayıt bölümleri v0.3'te görünmez ve oyuncu v0.3'te kaydederse kaybolur (Faz 4 §2.7, "yalnız ekleme" ve `.pre3`). Bu yüzden pencere kısa tutulur; **ileri düzeltme önceliklidir.** |
| **R1b** (inceleme düzeltmesi; ikinci ve sonraki yayınlar) | Bir önceki başarılı yayın koşusunda `yayinla` işini **Re-run** etmek (30 gün içinde; yapıt 30 gün saklanır) | ~5 dk + onay | Aynı baytları yeniden yayınlar; eski ağacı yeni araçla derlemez. Yeniden koşturulan işin aynı koşunun yapıtını kullandığı doğrulanamadı **[BELİRSİZ]**; kullanılamazsa R1. |
| **R2** (kalıcı, git; son çare) | Yayın dalına PR: `git revert -m 1 --no-commit <birleştirme> && git checkout HEAD -- .github tools package.json package-lock.json && git commit`. Hat dosyaları korunur. | ~30 dk + CI | İş akışları v0.3'e **dönmez**; aksi hâlde `'claude/**'` kuralı geri gelirdi (K-02). **Sınır:** v0.5 testleri v0.3 koduna karşı koşulamayacağı için gerekli kontroller kırmızı olur. Bu PR ancak kullanıcı ruleset'e geçici atlama eklerse birleşir. Bu yüzden olağan yol **R1 + ileri düzeltme PR'ı**dır. |
| R3 | 31 Ekim'deki başarılı koşuyu (41221950903) **Re-run** etmek: `762f1c7`'yi eski hatla (path `.`) yeniden yayınlar | ~2 dk | (inceleme düzeltmesi) **Pratikte yok.** GitHub yeniden koşmayı 30 günle sınırlar; pencere yaklaşık 30 Kasım 2026'da kapanır. Faz 1–8 o tarihe dek bitmeyeceği için canlıya almada kullanılamaz. Yerine R1 ve R1b vardır. |
| (yapılmaz) | Kaynağı yeniden "Deploy from a branch" yapmak | — | Dal artık v0.5 olduğu için içerik geri dönmez; iki yayıncı geri gelir |

### 2.13 Canlıya almadan önce yapılabilecek ara önlem (önerilir)

`github-pages` ortamının **dal politikası** (§2.5 adım 1–2, 4–5) ve isteğe bağlı onaylayıcı **hemen** kurulabilir:
- canlı dalı, kökteki tek HTML'i ve canlı içeriği **değiştirmez**;
- v0.3 dosyasını taşıyan her yeni dalın ve her elle tetiklemenin yayınını sunucu tarafında durdurur (K-02 ve K-03'ün kaza yolları);
- yayın dalının kendi yayınını etkilemez. Onaylayıcı seçilirse canlı dala yapılacak bir sonraki push onay bekler.

Bu, kullanıcının "canlı yalnız 'canlıya al' ile değişir" kuralıyla çelişmez; tersine kuralı sunucu tarafında güvenceye alır. Ayar yapılınca DEPLOYMENT_REPORT "Ayarlar" tablosunda tarih ve yapan kişiyle işaretlenir.

(inceleme düzeltmesi) **Durum denetimsiz ilk ruleset (K9-18); hemen kurulabilir:**
- Settings → Rules → Rulesets → New branch ruleset → ad `yayin-dali-koruma`, Enforcement **Active**, Bypass list **boş**, hedef `claude/hopeful-cray-o1jw6w`.
- ✔ Restrict deletions, ✔ Block force pushes, ✔ Require a pull request before merging (Required approvals: 0). **Require status checks işaretlenmez**; kontroller canlıya almada eklenir (§2.12 adım 5).
- Etkisi: canlı içerik ve canlı dalın ucu değişmez. Faz 1–8 boyunca yanlış dala yapılan bir push (ajan dahil) sunucu tarafında reddedilir. Bu, "Ana dalı ve canlı oyunu koru" kuralının (master_prompt §2, madde 2) sunucu tarafı güvencesidir.
- Doğrulama: `gh api repos/adnanerdem2000-sudo/SON-HAZ-NE/rules/branches/claude/hopeful-cray-o1jw6w` çıktısında `deletion`, `non_fast_forward` ve `pull_request` kuralları görünmeli. Bu oturumun vekili bu yolu okuyabiliyor; 14 Kasım'da sonuç `[]` idi (N9-14). Sonuç DEPLOYMENT_REPORT'un "Ayarlar" tablosuna yazılır.

---

## 3. CI iş akışı (feature dalları ve PR'lar)

### 3.1 Katmanlar

Süreler bu ortamdaki taban ölçümüne dayanır (`taban_kosusu_44d548c/summary.txt`). Ortam: 4 çekirdek, SwiftShader. GitHub'ın herkese açık depolardaki `ubuntu-24.04` koşucusu 4 vCPU ve 16 GB'tır. (inceleme düzeltmesi) Deponun herkese açık olduğu API ile doğrulandı (N9-14). Koşucunun SwiftShader hızının bu ortama "benzer" olduğu ise **ölçülmedi**. Bu yüzden ilk CI koşusu bir ölçüm koşusudur: senaryo süreleri `tests/kabul/sureler.json`'a yazılır ve parçalar bu dosyaya göre yeniden dengelenir.

(inceleme düzeltmesi) **Süre bütçesinin hesabı.** Taban ortalamaları kullanıldı: tek sayfa senaryosu ortalaması 61 sn (20 senaryoda Σ 1 229 sn), iki oyunculu co-op 173 sn (06b, 06d), üç oyunculu 313 sn (06a, 06a2), dört oyunculu 581 sn (06c), tek HTML açılışlı senaryo 21–30 sn (Ek A.6). Planlanan senaryo sayıları KARARLAR.md aralıklarından ve faz tasarımlarından alındı:
- Tek sayfa: bugünkü 20 + Faz 1'in 4 + Faz 3'ün 10 (22e dahil) + Faz 4'ün 4 + Faz 6'nın 10 + Faz 7'nin 8 + Faz 8'in 8 + Faz 9'un 8 = 72. 52_uzun_oturum_gercek haftalık işe gider; geriye 71 kalır.
- İki oyunculu co-op: 06b, 06d + Faz 2'nin 8 + Faz 4'ün 3 + Faz 5'in 7 + Faz 6'nın 2 + Faz 7'nin 3 + Faz 8'in 1 = 26.
- Üç ve dört oyunculu: 06a, 06a2, 06c, 06f, 06n, 06y, 06z (tek koşu), 08d = 8. 08f haftalık işe gider.

Bu hesapla `tam` şöyle toplanır: 71 × 61 sn + 02_arazi_yedek'in iki ek kipi (≈ 76 dk), eşdeğerlik paketi (~30 senaryo, ≈ 30 dk) ve 3–4 oyunculu 8 senaryo (≈ 60 dk). Toplam ≈ **2,8 sa**, 4 parçada ≈ 42 dk/parça + kurulum. Koşucu bu ortamdan 2 kat yavaşsa 90 dk sınırı zorlanır. `coop2` ≈ 26 × 173 sn ≈ **75 dk** eder. Taslaktaki "30–60 dk" bunun altında kalıyordu; 1,5 kat yavaş bir koşucuda 120 dk sınırına yaklaşılır. Karar K9-21: `coop2` 2 parça (≈ 38 dk + kurulum). `tam` 4 parça kalır, ama hedef en uzun parça ≤ 45 dk'dır ve gerekirse parça sayısı artırılır.

(inceleme düzeltmesi) **Bellek bütçesi.** Tek sayfalık koşuda süreç ağacının RSS tepe değeri 2,4 GB'tır (N9-13). Dört oyunculu `--split` koşusunda üst sınır ≈ 10 GB'tır. 16 GB'lık koşucuda bir işte aynı anda tek tarayıcı paketi koşar (`kos.mjs` paralelliği 1). kamera_tarama grupları her okumada bellek bıraktığı için (README notu) CI'a girmez, `dayaniklilik`'te tek tek koşar.

| İş | Ne zaman | İçerik | Süre (hesap) | Zaman aşımı | Kapı mı? |
|---|---|---|---|---|---|
| `statik` | Her push, PR ve çağrı | `npm ci`; `test:node` (archipelago + Faz 1–8 Node testleri); tek HTML üretim ve test çeşidi; `denetle:tek` (belirlenimcilik için ikinci derleme); `build:site` + `denetle:site`; `yayin_politikasi.mjs` (YP01–YP09, YP11–YP13); katalog bütünlüğü (`tests/node/katalog.mjs`) | ~3 dk (derleme 1,7 sn ölçüldü) | 15 dk | `kapi` üzerinden |
| `duman` | Her push, PR ve çağrı | Chromium kurulumu; 00_acilis (32 sn); 02_arazi_yedek normal ve noworker (2 × 68); 02_arazi_kurtarma (52); 08_kalicilik (43); 12_kayit_dongusu (35); 13_donma (40); 53_test_kipi (6 açılış, ~70); 59_ana_menu (~60); Faz 1'in 02_hizli_yolculuk ve 02_depolama_kapali (~2 × 61) | ~10 dk + kurulum 2–3 dk | 30 dk | `kapi` üzerinden |
| `tek` | Her push, PR ve çağrı (`duman` ile paralel) | 02_tek_dosya (test çeşidi, `file://`, 21–28 sn); 54_tek_isci (5 açılış); 55_tek_varlik (3 klasör + ses) ve `--cevrimdisi`; 56_tek_uretim (`file://` + http); 57_site_uretim; 58_ozellik_izi (modüler + tek) | ~8 dk + kurulum | 30 dk | `kapi` üzerinden |
| `coop2` (2 parça) | Yayın dalına PR, yayın dalı dışında `[tam]`, elle, zamanlı | `tests/peer-server.cjs`; 26 iki oyunculu senaryo (yukarıdaki hesap) | ~2 × 38 dk + kurulum | 90 dk/parça | `kapi` üzerinden |
| `tam` (4 parça) | Aynı | 71 tek sayfa senaryosu; 02_arazi_yedek'in badurl ve crash kipleri; 3–4 oyunculu 8 senaryo; **eşdeğerlik paketi** (§4.4) | ~4 × 42 dk + kurulum | 90 dk/parça | `kapi` üzerinden |
| `kapi` (inceleme düzeltmesi) | Her `ci.yml` koşusu (`if: always()`) | `needs` sonuçlarını toplar. O olayda koşması gereken her iş `success` olmalıdır; atlanan iş başarı sayılmaz. | <1 dk | 5 dk | **Evet** (ruleset'te gerekli ad) |
| `yayin_denetimi` (`yayin-denetimi.yml`) | Push, yayın dalı **dışı** | YP10 depo geneli (§1.3-7): son 30 günde yayın dalı dışında "GitHub Pages" koşusu ve `github-pages` dağıtımı 0; bu sha için koşu yok ya da `skipped`. 2 dk bekler. Bu sha için kaza eseri bir koşu varsa bitmesini en çok 10 dk bekler. | 2–12 dk | 15 dk | Hayır (kırmızısı DEPLOYMENT_REPORT'a düşer) |
| `yayin_onkosul` (`yayin-denetimi.yml`) | Yalnız yayın dalına PR | `/pages` `build_type==='workflow'` olmalı (R1). Ruleset'te gerekli kontroldür; kaynak ayarı yapılmadan birleştirme düğmesi kapalı kalır. | <1 dk | 5 dk | **Evet** |
| `kayit` | Her zaman (`if: always()`) | Bütün rapor yapıtlarını indirir → `tools/test-kaydi.mjs` → `TEST_KAYDI.{json,md}` + koşu özeti (`$GITHUB_STEP_SUMMARY`) | ~1 dk | 10 dk | Hayır (rapor) |
| `dayaniklilik` (`dayaniklilik.yml`, inceleme düzeltmesi, 3 parça) | Haftalık (canlıya alındıktan sonra); canlıya almadan önce bir kez yerelde | 52_uzun_oturum_gercek (≥ 20 dk gerçek zaman), 08f_coop_uzun, 06z ve 06c `--repeat 10` (her biri ~100 dk), 10_uzun_oturum, kamera_tarama b1–b6 (tek tek, grup başına ≤ 24 dk) | ~6 sa toplam, parça başına ~2 sa | 180 dk/parça | Hayır (REGRESSION_REPORT'a girer) |

Faz 5'in 06c/06z kabulü `--repeat 10` ile yaklaşık 100 dk sürer (Faz 5 §9: "06c'nin 10 koşusu yaklaşık 100 dk"). Bu, CI'ın `tam` işinde değil, canlıya almadan önce **bir kez** koşulur ve REGRESSION_REPORT'a yazılır. Canlıya alındıktan sonra haftalık `dayaniklilik` işine geçer.

Parçalama `tests/kos.mjs --parca i/N` ile yapılır. (inceleme düzeltmesi) Senaryolar depoda tutulan `tests/kabul/sureler.json`'daki sürelere göre açgözlü dengelenir. Dosyada olmayan senaryo için taban ortalaması kullanılır: tek sayfa 61 sn; co-op'ta oyuncu sayısına göre 173, 313 ya da 581 sn. "Son kaydın süreleri" önceki koşunun yapıtından okunmaz. Böylece parçalama belirlenimci olur ve aynı commit her koşuda aynı parçalara bölünür.

### 3.2 Hedef `ci.yml`

```yaml
name: CI
on:
  push:
    branches-ignore: ['claude/hopeful-cray-o1jw6w']
  pull_request:
    branches: ['claude/hopeful-cray-o1jw6w']
  workflow_dispatch:
    inputs:
      kapsam: { type: choice, options: [hizli, tam], default: tam }
  workflow_call:
    inputs:
      kapsam: { type: string, default: hizli }
  schedule:
    - cron: '23 1 * * *'        # yalnız varsayılan dalda koşar: canlıya alındıktan sonra anlamlı
# (inceleme düzeltmesi) Bu dosya pages.yml'den çağrılır: hiçbir iş contents: read'den fazlasını istemez (N9-10, YP11).
# İzin isteyen yayın denetimleri .github/workflows/yayin-denetimi.yml'dedir.
permissions:
  contents: read
concurrency:
  group: ci-${{ github.event_name }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  statik:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci
      - run: npm run test:node
      - name: Tek HTML, statik denetim, belirlenimcilik
        run: |
          set -euo pipefail
          npm run build:tek -- --damga "$GITHUB_SHA"
          npm run build:tek:test -- --damga "$GITHUB_SHA"
          npm run denetle:tek -- --belirlenim
      - name: _site ve yayın politikası
        run: |
          set -euo pipefail
          npm run build:site -- --damga "$GITHUB_SHA"
          npm run denetle:site
          node tests/node/yayin_politikasi.mjs
      - uses: actions/upload-artifact@v4
        with: { name: tek-html, path: dist/*.html, retention-days: 7 }
  duman:
    needs: statik
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: npm }
      - run: npm ci
      - uses: actions/cache@v4
        with: { path: ~/.cache/ms-playwright, key: "pw-${{ hashFiles('package-lock.json') }}" }
      - run: npx playwright install --with-deps --only-shell chromium
      - run: node tests/kos.mjs duman --rapor tests/out/duman
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: rapor-duman, path: tests/out/duman, retention-days: 14 }
  tek:
    needs: statik
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:   # (duman adımlarının aynısı; ayrıca tek-html yapıtını dist/'e indirir ve `kos.mjs tek` koşar)
      - …
  coop2:
    needs: statik
    # (inceleme düzeltmesi) [tam] yalnız yayın dalı DIŞINDAKİ push'ta geçerli; pages.yml'den çağrıda (kapsam: hizli) koşmaz
    if: github.event_name == 'pull_request' || github.event_name == 'schedule' || inputs.kapsam == 'tam' || (github.event_name == 'push' && github.ref != 'refs/heads/claude/hopeful-cray-o1jw6w' && contains(github.event.head_commit.message, '[tam]'))
    strategy: { fail-fast: false, matrix: { parca: [1, 2] } }          # (inceleme düzeltmesi) K9-21
    runs-on: ubuntu-24.04
    timeout-minutes: 90
    steps: [ …, run: node tests/kos.mjs coop2 --parca ${{ matrix.parca }}/2 --rapor tests/out/coop2-${{ matrix.parca }} ]
  tam:
    needs: statik
    if: github.event_name == 'pull_request' || github.event_name == 'schedule' || inputs.kapsam == 'tam' || (github.event_name == 'push' && github.ref != 'refs/heads/claude/hopeful-cray-o1jw6w' && contains(github.event.head_commit.message, '[tam]'))
    strategy: { fail-fast: false, matrix: { parca: [1, 2, 3, 4] } }    # sureler.json ölçümünden sonra ayarlanabilir (K9-21)
    runs-on: ubuntu-24.04
    timeout-minutes: 90
    steps: [ …, run: node tests/kos.mjs tam --parca ${{ matrix.parca }}/4 --rapor tests/out/tam-${{ matrix.parca }} ]
  kapi:   # (inceleme düzeltmesi) ruleset'te gerekli tek ci.yml kontrolü (K9-19)
    needs: [statik, duman, tek, coop2, tam]
    if: always()
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - name: Koşması gereken bütün işler başarılı mı (atlanan iş başarı sayılmaz)
        env:
          SONUC: ${{ toJSON(needs) }}
          TAM: ${{ github.event_name == 'pull_request' || github.event_name == 'schedule' || inputs.kapsam == 'tam' || (github.event_name == 'push' && github.ref != 'refs/heads/claude/hopeful-cray-o1jw6w' && contains(github.event.head_commit.message, '[tam]')) }}
        run: |
          node -e '
            const n = JSON.parse(process.env.SONUC), tam = process.env.TAM === "true";
            const gerekli = ["statik", "duman", "tek", ...(tam ? ["coop2", "tam"] : [])];
            const kotu = gerekli.filter((j) => n[j].result !== "success");
            if (kotu.length) { console.log("::error::Başarısız ya da atlanan gerekli işler: " + kotu.map((j) => j + "=" + n[j].result).join(", ")); process.exit(1); }'
  kayit:
    needs: [statik, duman, tek, coop2, tam]
    if: always()
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with: { pattern: rapor-*, path: indirilen }
      - run: node tools/test-kaydi.mjs --kosu indirilen --taban docs/v05/taban_kosusu_44d548c --cikis tests/out/kayit --ozet "$GITHUB_STEP_SUMMARY"
      - uses: actions/upload-artifact@v4
        with: { name: test-kaydi, path: tests/out/kayit, retention-days: 30 }
```

**`.github/workflows/yayin-denetimi.yml` (inceleme düzeltmesi, yeni):**

```yaml
name: Yayın denetimi
on:
  push:
    branches-ignore: ['claude/hopeful-cray-o1jw6w']
  pull_request:
    branches: ['claude/hopeful-cray-o1jw6w']
permissions:
  contents: read
jobs:
  yayin_denetimi:      # T62, YP10: depo geneli (v0.3 tabanlı dalları da kapsar, §1.3-7)
    if: github.event_name == 'push'
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions: { contents: read, actions: read, deployments: read }
    steps:
      - uses: actions/checkout@v4
      - run: node tests/node/yayin_politikasi.mjs --canli --tum --gun 30 --sha "$GITHUB_SHA" --dal "$GITHUB_REF_NAME" --bekle 120 --azami 600
        env: { GH_TOKEN: '${{ github.token }}' }
  yayin_onkosul:       # ruleset'te gerekli kontrol (K9-19)
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    permissions: { contents: read, pages: read }
    steps:
      - env: { GH_TOKEN: '${{ github.token }}' }
        run: |
          set -euo pipefail
          bt=$(gh api "repos/$GITHUB_REPOSITORY/pages" --jq .build_type) || { echo "::error::Pages ayarı okunamadı"; exit 1; }
          [ "$bt" = "workflow" ] || { echo "::error::Pages kaynağı '$bt'. Birleştirmeden önce Settings → Pages → Source: GitHub Actions yapın (DEPLOYMENT_REPORT, Ayarlar)."; exit 1; }
```

**`.github/workflows/dayaniklilik.yml` (inceleme düzeltmesi, yeni):**

```yaml
name: Dayanıklılık
on:
  schedule:
    - cron: '41 2 * * 0'        # haftalık; yalnız varsayılan dalda koşar (canlıya alındıktan sonra)
  workflow_dispatch:
permissions:
  contents: read
jobs:
  dayaniklilik:
    strategy: { fail-fast: false, matrix: { parca: [1, 2, 3] } }
    runs-on: ubuntu-24.04
    timeout-minutes: 180
    steps: [ …, run: node tests/kos.mjs dayaniklilik --parca ${{ matrix.parca }}/3 --rapor tests/out/dayaniklilik-${{ matrix.parca }} ]
```

YAML çapaları GitHub Actions'ta desteklendiği hâlde okunurluk için gerçek dosyada adımlar açık yazılır. `…` yalnız bu belgede kısaltmadır.

- **`concurrency` neden böyle?** `workflow_call` ile çağrıldığında `github.event_name` çağıranın olayıdır (`push`). Yayın dalı push'u yalnız `pages.yml`'yi tetikler, yani grup çakışması olmaz.
- **`cancel-in-progress: true` ne zaman ne yapar?** Aynı dala art arda yapılan iki gönderimde ilki iptal edilir. Yayın dalında bu, önceki commit'in `test` işini iptal eder; sonuçta yalnız yeni commit yayınlanır.
- (inceleme düzeltmesi) **Taslaktaki üç hata giderildi.** (1) `yayin_denetimi` ve `yayin_onkosul` çağrılan iş akışında izin yükseltiyordu; bu `pages.yml`'yi başlamadan düşürürdü (N9-10). (2) `[tam]` koşulu yayın hattında da geçerliydi. (3) Gerekli kontroller matris adlarına bağlıydı ve atlanan iş başarı sayılıyordu (K9-19).
- (inceleme düzeltmesi) **`kapi` ve `workflow_call`.** `pages.yml`'den çağrıda `kapi` hızlı kapsamı (statik, duman, tek) denetler. `kapi` kırmızıysa çağıran `test` işi de kırmızı olur ve `derle` atlanır.

### 3.3 Tarayıcı ortamı, kararsızlık ve yeniden deneme

- **Bayraklar:** `run.cjs:36` ve `coop.cjs:27` bayrakları aynen korunur. (inceleme düzeltmesi) İkisinde de SwiftShader (`--use-gl=angle`, `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`), `--ignore-gpu-blocklist` ve `--disable-gpu-watchdog` var. Arka plan kısmasını kapatan üç bayrak (`--disable-background-timer-throttling`, `--disable-renderer-backgrounding`, `--disable-backgrounding-occluded-windows`) ise **yalnız `coop.cjs:27`'de** var. `run.cjs:36`'da bunların yerine `--autoplay-policy=no-user-gesture-required` ve `--enable-precise-memory-info` var. Tek sayfalık senaryolar tek sekmede koştuğu için bu fark bugün sonucu etkilemiyor. Birden çok sekme açan bir tek sayfa senaryosu yazılırsa bayraklar eşitlenir. Koşucu GL dizgesini rapora yazar (`WEBGL_debug_renderer_info`). Dizgede "SwiftShader" varsa `gercekGPU:false` kaydedilir.
- **Süreye bağlı eşikler:** P01 ≤ 35 ms ve 09_performans ölçümleri koşucunun işlemcisine bağlıdır. Bu kontroller katalogda `ortamDuyarli: true` taşır. Kalırlarsa yine **KALDI** sayılır (gizlenmez); rapor nedeni gösterir. Eşik değiştirmek yalnız gerekçeli bir PR ile yapılır.
- **Yeniden deneme:**
  - **Onay başarısızlığı yeniden denenmez.**
  - Altyapı hatası tek bir yeniden denemeyle tekrarlanır ve her iki deneme de rapora yazılır (`deneme: 2`). Altyapı hatası şunlardır: tarayıcı başlatılamadı; senaryo başlamadan `HARNESS ERROR` (`goto` ağ hatası, sunucu hazır değil); sinyal sunucusu ayakta değil.
- **Kararlılık ölçümü:** `--tekrar N` ile yapılır (06c ve 06z). Sonuç "k/N" olarak kaydedilir.

### 3.4 Bağımlılık sabitleme (K-15)

**`package.json` (yeni) [İA]:**

```json
{
  "name": "deniz-korsanlari-son-hazine",
  "version": "0.5.0",
  "private": true,
  "type": "module",
  "homepage": "https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/",
  "dkYayinDali": "claude/hopeful-cray-o1jw6w",
  "engines": { "node": ">=22.12 <23" },
  "scripts": {
    "build:tek": "node tools/build-single-html.mjs --cikis dist/DenizKorsanlari-SonHazine.html",
    "build:tek:test": "node tools/build-single-html.mjs --test --cikis dist/DenizKorsanlari-SonHazine.test.html",
    "denetle:tek": "node tools/tek-html-denetle.mjs dist/DenizKorsanlari-SonHazine.html dist/DenizKorsanlari-SonHazine.test.html",
    "build:site": "node tools/site-hazirla.mjs --cikis _site",
    "denetle:site": "node tools/site-denetle.mjs _site",
    "test:node": "node tests/kos.mjs node",
    "test:duman": "node tests/kos.mjs duman",
    "test:tek": "node tests/kos.mjs tek",
    "test:coop": "node tests/kos.mjs coop2",
    "test:tam": "node tests/kos.mjs tam",
    "kayit": "node tools/test-kaydi.mjs"
  },
  "devDependencies": { "esbuild": "0.24.2", "peer": "1.0.2", "playwright": "1.63.0" }
}
```

**Gerekçeler:**

1. **Kilit dosyası gerekli.** Tek HTML'in baytları esbuild sürümüne bağlıdır; bayt eşitliği yalnız 0.24.2 ile doğrulandı (N9-4). Platform ikilisi (`@esbuild/linux-x64@0.24.2`) de kilitlenir. `peer` 1.0.2'nin geçişli bağımlılıkları (express, ws …) kilitlenmezse sinyal sunucusunun davranışı değişebilir. Faz 5 tasarımı `expire_timeout` gibi değerleri bu sürümün koduna dayandırıyor. Playwright sürümü de Chromium yapısını sabitler. Bu yüzden `package-lock.json` (lockfileVersion 3) commit'lenir ve CI `npm ci` kullanır.
2. **Yeni bağımlılık yok.** Üç paket de bugün kullanılıyor; yalnız sürümleri sabitleniyor:
   - esbuild: `pages.yml:46`, README.md:18;
   - playwright: `run.cjs:17`; bu ortamda `/opt/node-tools` altında 1.63.0;
   - peer: `tests/peer-server.cjs:4`; bu ortamda `/home/user/devtools` altında 1.0.2.

   Hepsi `devDependencies`'dir. **Oyunun çalışma zamanına hiçbir npm paketi girmez.** three.js r187 ve PeerJS `vendor/` altında kalır ve npm'e taşınmaz (kural 15). YAML ayrıştırıcı da eklenmez: `yayin_politikasi.mjs` satır tabanlı ve dar kapsamlı denetim yapar.
3. **Tek HTML derlemesiyle uyum.** `tools/build-single-html.mjs:12-13`, esbuild'i `createRequire(import.meta.url)` ile kendi konumundan arar. Kökte `node_modules` olunca `NODE_PATH` gereği kalkar. **Kabul (Y2):** `npm ci` sonrasında v0.4 ağacı (`44d548c`) aracın v0.4 sürümüyle derlenir ve sha256 `75587dd9…` çıkar. Bu, kilitli esbuild'in denetlenmiş çıktıyı birebir verdiğini gösterir.
4. **`"type": "module"`:**
   - `js/**/*.js` dosyaları Node testlerinde (`tests/node/archipelago_sabit.mjs:10` → `import('../../js/world/archipelago.js')`) bugün Node 22'nin sözdizimi algılamasıyla ESM sayılıyor. `package.json` eklenip `type` verilmezse her içe aktarmada `MODULE_TYPELESS_PACKAGE_JSON` uyarısı ve çift ayrıştırma olur.
   - `.cjs` dosyaları (koşucular, co-op senaryoları, `peer-server`) etkilenmez.
   - `tests/scenarios/*.js` Node modülü olarak yüklenmez; `run.cjs:59` dosyayı `fs` ile okuyup `eval` eder.
5. **Diğer sabitler.** Node sürümü `engines` alanında ve `actions/setup-node` ile 22'ye sabitlenir. Playwright tarayıcıları `npx playwright install --only-shell chromium` ile Playwright sürümüne bağlı gelir.

### 3.5 Güvenlik ve izinler

- Her iş akışında varsayılan `permissions: contents: read`. Yazma izni yalnız `yayinla` işinde vardır (`pages: write`, `id-token: write`). Okuma izinleri yalnız gereken işte verilir (`pull-requests`, `actions`, `deployments`).
- Sır kullanılmaz. `pull_request_target` yoktur. Yalnız `actions/*` eylemleri kullanılır.
- `yayin_politikasi.mjs` şunları denetler:
  - başka bir iş akışının `deploy-pages` kullanmadığını (`pages.yml` ve `geri-donus.yml` dışında),
  - `pull_request_target` bulunmadığını,
  - `permissions` yazımlarını.

### 3.6 Yerel eşdeğeri

`tests/kos.mjs <paket>` [KO] CI ile aynı paketleri yerelde koşar:
- `tests/sunucu.cjs` adlı statik sunucuyu (bağımlılıksız Node http) boş bir porta kendisi kurar. Co-op paketlerinde `tests/peer-server.cjs`'i de kendisi başlatır.
- `DK_TARAYICI_KILIDI` ortam değişkeni verilmişse her tarayıcı koşusunu `flock` ile sarar. Bu ortamda `/home/user/devtools/tk` ile aynı kilit kullanılır.
- `--taban http://localhost:8080` seçeneği aynı paketi v0.4 kopyasına karşı koşar ve "önce" verisini üretir (§6.6).
- (inceleme düzeltmesi) Metasında `sinyal: true` olan tek sayfa senaryoları için de `tests/peer-server.cjs`'i başlatır ve adrese `peerhost=127.0.0.1&peerport=<p>` ekler (59_ana_menu AM09, 60_dunya_degisimi DD05). Faz 2'nin CSP'si (`connect-src 'self' https://0.peerjs.com wss://0.peerjs.com`, Faz 2 §9.5) yerel sinyal sunucusunu `index.html`'de engeller. Bu yüzden bu senaryolar Faz 2'den sonra `tests/index.test.html` girişinde koşar. Faz 5'in `--peer-server own` seçeneğiyle sunucuyu kendisi yöneten senaryolarda `kos.mjs` ayrı sunucu başlatmaz.

`run_baseline.sh` ile `regresyon.sh` bu betiğin yerini almaz. Taban koşusunun yeniden üretilebilir kaydı olarak oldukları gibi kalırlar.

---

## 4. Tek HTML

### 4.1 Güncel kaynaktan derleme

```
node tools/build-single-html.mjs [--test] [--kok <kaynak ağacı>] [--damga <sha>] [--cikis <dosya>] [--ozet <json>]
```

| Seçenek | Anlamı |
|---|---|
| `--kok` | Kaynak ağacı. Varsayılan deponun köküdür. `geri-donus.yml` eski ağacı yeni araçla derlemek için kullanır. |
| `--test` | Test çeşidi. `testmode.js` ve kanca modülleri saplanmaz. Ad `….test.html` olur; `<meta name="dk-cesit" content="test">` eklenir. |
| `--damga` | Varsayılan olarak `GITHUB_SHA`, yoksa `git -C <kok> rev-parse HEAD`. Çalışma ağacı kirliyse (`git status --porcelain` boş değil) sona `-kirli` eklenir. Yerel derleme hangi kaynaktan geldiğini dürüstçe söyler. **Tarih eklenmez:** belirlenimcilik için yalnız commit tarihi (`git log -1 --format=%cI`) `surum.json`'a gider. |
| `--ozet` | `{cikis, cesit, damga, bayt, sha256, gomuluDosya, oyunBayt, isciBayt, uyari, sure}`. CI bu dosyadan okur. |

**Kurallar:**
- Kökte tek HTML tutulmaz (K9-5, §4.8). `dist/` git dışında kalır (`.gitignore:2`); `_site/` da `.gitignore`'a eklenir.
- Pages'teki tek HTML, aynı koşunun `derle` işinin çıktısıdır. Canlı duman testi sha256'nın bu çıktıyla aynı olduğunu denetler (T61).

### 4.2 Derleme aracındaki değişiklikler (`tools/build-single-html.mjs`)

| Fonksiyon / satır | Değişiklik | Sorun |
|---|---|---|
| `bundle()` 32-38 | Şunlar eklenir: `legalComments:'eof'`; `banner:{js:'"use strict";'}`; `logOverride:{'empty-import-meta':'error'}`; `if (r.warnings.length) throw new Error('esbuild uyarısı: …')`; `plugins: [plugin, ...(test ? [] : [uretimSaplama])]` | K-16, K-19, K-20, K-07 |
| Yeni `uretimSaplama` eklentisi | Bu eklenti iki iş yapar: (1) `onLoad /[\\/]js[\\/]core[\\/]testmode\.js$/` → `export const TEST = false; export function testParam() { return null; }`; (2) `onLoad /[\\/]js[\\/](test[\\/][^\\/]+\|net[\\/]net(Test\|Shape))\.js$/` → `export function install() {}`. N9-3'e göre ikinci saplama **zorunludur**: yalnız `TEST=false` yetmez. (inceleme düzeltmesi) **Tek mekanizma:** Faz 2'nin Adım 16'daki "`netTest.js`'in derlemeden çıkarılması" işi ayrı bir yöntemle yazılmaz. Bu eklenti Faz 2'de ilk kez `js/test/**` ve `js/net/netTest.js` desenleriyle eklenir; Y4 `netShape`'i, S9'u ve `--test` çeşidini ekler. Saplama yalnız `install` verdiği için bu modüller dışarıya yalnız `install(api)` (ve `MARK`) verebilir. Faz 2'nin `netTest` işlevleri (`invariants`, `audit`, `teleportGuest`…) ve Faz 5'in `netShape` işlevleri (`shape`, `stall`, `cut`, `busy`, `hide`) `install` içinde `DK.netTest`'e bağlanır; `net.js` bunları statik içe aktarmaz. Kural `test_kipi.mjs` kural 2 ile denetlenir. Aksi hâlde üretim derlemesi "No matching export" ile düşer. | K-07, Faz 2, Faz 5 |
| prelude `key()` 79-85 | Sayfa dizinine göre göreli yol kullanılır (§4.7). Ölçüm: 9/9 konum, 0 yanlış pozitif (N9-5). | K-09 |
| prelude 100-103 | (inceleme düzeltmesi) **Faz 1 yapar** (`faz1_brief.md` madde 13, A-16): `opak = location.protocol === 'file:' \|\| String(self.origin) === 'null'` → `data:`, değilse `blob:`; `blob:` kurulumu hata verirse `data:` ile ikinci deneme. Y4 bu satırları yeniden yazmaz; S7'yi (katı kip) ve 54'ü ekler. | A-16 |
| prelude sonu | `window.__DK_KANONIK = <package.json homepage>` | K-10 |
| HTML montajı 107-123 | `<meta name="dk-build" content="<damga>">` ve `<meta name="dk-version" content="<SURUM>">` doldurulur. `</body>` öncesine lisans bloğu (§4.7) eklenir. importmap kaldırma (116) `swap` gibi denetimli olur: eşleşme yoksa hata atar. (inceleme düzeltmesi) `--eski-agac-izni` ile (geri dönüş, §2.11) meta işaretçisi yoksa `<head>`'e eklenir. CSP meta'sı yoksa CSP adımı atlanır ve özete `csp:'yok'` yazılır. v0.3 ve v0.4'ün `index.html`'inde bu meta'lar yok. | K-01, K-19 |
| Son adım | Faz 2 K-5: satır içi yürütülebilir betiklerin SHA-256 özetleri CSP `<meta>`'sına yazılır. Bu adım **en sonda** yapılır: lisans bloğu `type="text/plain"` olduğu için CSP kapsamına girmez; damga ise `meta`dır. | Faz 2 uyumu |
| `main()` 54-129 | `--kok`, `--test`, `--damga`, `--cikis`, `--ozet` seçenekleri. `OUT` varsayılanı `dist/…` olarak kalır. | — |

### 4.3 Statik denetim (`tools/tek-html-denetle.mjs <üretim> <test> [--belirlenim]`) [DA]

Bu araç denetimin analiz_tek.mjs'teki (Faz 0 denetimi) Node çözümlemesinin kalıcı ve eşikli hâlidir. Çıktısı `tests/out/tek_denetim.json`'dur; T56 kaydını besler.

| # | Denetim | Üretim | Test | Ölçüt |
|---|---|---|---|---|
| S1 | `dk-build` = `--damga`; `dk-version` = `package.json` `version` = `js/core/surum.js` `SURUM` | ✓ | ✓ | Eşit |
| S2 | `__DK_FILES` anahtar kümesi = `assets/` yürüyüşü (fonts ve `*.txt` hariç) | ✓ | ✓ | Bugün 87/87 |
| S3 | Her gömülü dosyanın base64 çözümü kaynağın sha256'sına eşit | ✓ | ✓ | 87/87 |
| S4 | CSS'te göreli `url(` sayısı; `data:font/woff2` sayısı = `assets/fonts/*.woff2` | ✓ | ✓ | 0; 10 |
| S5 | importmap, `<script type="module"`, dış `src=`/`href=` | ✓ | ✓ | 0 |
| S6 | `import.meta`, `new URL("./`, `new URL('./`, `terrainWorker.js'` | ✓ | ✓ | 0 (N9-4: bugün 0) |
| S7 | Oyun betiği ve işçi kaynağı `"use strict"` ile başlıyor | ✓ | ✓ | Evet |
| S8 | Lisans: `Three.js Authors` ≥ 1; `#dk-lisanslar` bloğundaki her metnin özeti kaynak dosyayla (`vendor/three/LICENSE`, `vendor/peerjs/LICENSE`, iki OFL, CC0, `CREDITS.md`) aynı | ✓ | ✓ | Evet |
| S9 | Kanca işareti `dk-test-kancalari-v1`; `/window\.DK\b/`; `/\bDK\.sim\b/` | **0** | ≥ 1 | — |
| S10 | `<meta name="dk-cesit" content="test">` | 0 | 1 | — |
| S11 | Boyut | ≤ 24 MB (bugün 21,0 MB) | — | — |
| S12 | `--belirlenim`: aynı girdiyle ikinci derleme | Bayt bayt aynı | Aynı | N9-4: v0.4'te doğrulandı |
| S13 | CSP özetleri (Faz 2 K-5 uygulandıktan sonra): her yürütülebilir satır içi betiğin özeti CSP'de var; CSP'deki her özet bir betiğe karşılık geliyor | ✓ | ✓ | Eşit kümeler |
| S14 | `__DK_KANONIK` = `package.json` `homepage` | ✓ | ✓ | Eşit |

### 4.4 Modüler sürüm ile tek HTML'in eşdeğerliği

"Tek HTML ile modüler sürüm aynı özellikleri taşımalı" isteği üç katmanda sınanır.

**(a) Davranış paketi** (`tests/kos.mjs esdegerlik`, `tam` işinde):
- Aynı senaryo listesi iki hedefte koşar:
  - modüler: `http://127.0.0.1:<p>/index.html?test=1`;
  - tek HTML test çeşidi: `file:///…/DenizKorsanlari-SonHazine.test.html?test=1`.
- `tools/esdegerlik.mjs` iki raporu **kontrol etiketi kontrol etiketi** karşılaştırır:
  - iki hedefte de geçti ya da ikisinde de kaldı (hata nedeni aynı) → **EŞ**;
  - yalnız birinde geçti → **FARK** (paket kalır).
- Değer eşitliği yalnız katalogda `degerEsit:true` olan kontrollerde aranır (sayımlar ve kimlikler). Süre ölçümleri karşılaştırılmaz.
- **Liste:** §4.9'daki ölçümle bugün tek HTML'de geçenler, `import()` kullananların `DK.mod` dönüşümünden sonraki hâlleri ve Faz 1–8'in tek sayfa senaryoları. Ayrıntı §9.2'de.
- **02_arazi_yedek `badurl` kipi (inceleme düzeltmesi).** Bugünkü kodda bu kip yalnız `file://` altında anlamsızdır: `terrain.js:61` `data:` adresine `#missing` ekler ve adres yine yüklenir. http altında ise adres `blob:…#missing` → `blob:…-missing` olur ve işçi gerçekten yüklenemez. Faz 1, kipi `data:`/`blob:` altında da bozuk içerik verecek biçimde düzeltecek (`faz1_brief.md` madde 14, A-17). Bu yüzden kip Faz 1'den sonra eşdeğerlik paketine **alınır**. Faz 1 bunu yapmazsa kip paket dışında kalır; tek HTML'de "işçi bulunamadı" durumu noworker ve 54'teki kurulum hatasıyla sınanır.

**(b) Özellik izi** (58_ozellik_izi.js):
- Sayfada belirlenimci bir "özellik izi" JSON'u hesaplanır ve sha256'sı alınır. İçeriği:
  - kayıtlı sistem adları (`DK.game.systems.map(s => s.name)`, `game.js:32, 38`);
  - `ITEMS` anahtarları (`items.js:18`) ve `MERCHANTS` rolleri ile satış listeleri (`shop.js:11`);
  - `STORY` aşama başlıkları (`quests.js:24`);
  - `MODEL_LIST` (`assets.js:9`, 53), kk şablonları (15), `assets.missing`, `SFX` (`audio.js:4`, 17);
  - `EXTRA_ISLANDS` kimlikleri ve özellik sayıları;
  - düşman ve boss tür anahtarları;
  - ağ ileti türleri (`net.js:46` `KNOWN` ((inceleme düzeltmesi) satır 46); Faz 2'den sonra `schema` kaydı) ve `VER`/`PROTO`;
  - ayarların varsayılan anahtarları; ana menü düğme metinleri;
  - `document.fonts.check('40px "Pirata One"')`;
  - 16 sabit noktada `DK.terrain.heightAt`;
  - yeni bir oyunun `game.serialize()` yapısı (anahtar yolları ve türler; zaman damgaları hariç).
- Senaryo iki hedefte koşar. `tools/esdegerlik.mjs` iki izin özetini karşılaştırır ve eşit olmasını ister. İzin verilen farklar listede açıkça yazılıdır: `tekDosya`, işçi adresi şeması.
- Bu test, tek HTML'e bir modülün, varlığın ya da yazı tipinin eksik girmesini, ya da `"use strict"` nedeniyle bir kaydın düşmesini yakalar.

**(c) Statik kapsam:**
- esbuild `metafile` ile tek HTML'e giren `js/` modül kümesi çıkarılır.
- Bu küme, `site-denetle`'nin modüler içe aktarma grafındaki kümeyle karşılaştırılır.
- Fark yalnız şu olabilir: test modülleri ve `js/world/terrainWorker.js` (işçi ayrı pakette).

**Önkoşul:** `import()` kullanan senaryolar tek HTML'de koşamaz (`07_ekonomi.js:5,7`, `14_deniz_ekipmani.js:80,83`, `15_iskele_kamera.js:33,61`, `16_kosu_poz_ganimet.js:62,71,89,118,134`, `17_kamera_kararma.js:32,48,57,82,91,116`, `coop/06d_ganimet_canta.cjs:31`). Bunlar `DK.mod('<yol>')`'a çevrilir (§5.4).
- Kayıt defteri `js/test/kancalar.js`'te durur. Bu modüller statik olarak içe aktarılır, yani modüler sürümde aynı modül örnekleri kullanılır.
- Gereken anahtarlar: `economy/shop`, `economy/items`, `treasure/treasure`, `world/props`, `world/ports`, `ui/menu`, `ui/panels`, `wildlife/seagear`, `ship/shipModel`, `core/nearfade`, `world/worldData`, `game/quests`, `core/assets`, `core/audio`.

### 4.5 İşçi blob ve data dönüşümü (T60) — 54_tek_isci.js

Test çeşidiyle beş açılış yapılır. Her açılışta önce `DK.handlers.startGame`, sonra `DK.sim(2)` ve zemin denetimi gelir.

| Açılış | Beklenen |
|---|---|
| `file://…test.html?test=1` | `location.protocol==='file:'`, `__DK_WORKER_URL` `data:text/javascript` ile başlıyor, `workers.length ≥ 1`, `fallback===false`, `failures.length===0`, `G.state==='playing'` |
| `http://127.0.0.1:<p>/dist/…test.html?test=1` | Aynısı, `blob:` ile |
| `tests/fixtures/tek/iframe.html` (`<iframe sandbox="allow-scripts" src="…test.html?test=1">`; köken `null`; (inceleme düzeltmesi) sabit sayfa `tests/sunucu.cjs` ile **http'den** sunulur. Böylece iframe'de `location.protocol === 'http:'` ve `self.origin === 'null'` olur. `file://`'dan açılsaydı A-16'nın kendi dalı değil `file:` dalı sınanırdı) | A-16: `data:` işçisi ≥ 1 ya da açık yedek (`fallback:true` ve sebep kaydı); sayfa hatası 0. Faz 1 A-18 (depolama kapalıyken açılış) önkoşuldur. |
| `?test=1&terrain=noworker` | `fallback===true`, karolar üretiliyor (≥ 20 ağ), oyun açılıyor |
| `?test=1&terrain=crash` | Bütün işçiler düşüyor, yedek açılıyor, kuyruk ilerliyor (02_arazi_kurtarma ölçütleri) |

İsteğe bağlı ve **engelleyici olmayan** ek: canlıya alındıktan sonra gecelik işte Firefox ve WebKit (`run.cjs --browser`). İlk iki açılış koşulur. Sonuç tür sütununda "gerçek tarayıcı (Firefox/WebKit, yazılımsal çizim)" olarak kaydedilir.

### 4.6 Gömülü varlıklar ve fetch yönlendirmesi (T59, T58) — 55_tek_varlik.js

| Kontrol | Ölçüt |
|---|---|
| V1 | `DK.assets.missing.length===0`, `DK.kk.ready===true`, `Object.keys(__DK_FILES).length===87` (derleme özetindeki sayıyla aynı) |
| V2 | Açılıştan oyun başlangıcına kadar, adresinde `/assets/` geçen ve şeması `file:`/`http:` olan istek sayısı **0**. Koşucu `request` olaylarını sayar; `data:` ve `blob:` hariç. |
| V3 | `await DK.audio.init()` → `Object.keys(DK.audio.buffers).length===17`; `fetch('assets/audio/music/battle_theme_a.mp3')` gömülü dosyanın bayt sayısını döndürüyor |
| V4 | Gömülü olmayan `fetch('assets/models/yok.glb')` gerçek ağa düşüyor ve reddediliyor. Bu hata yalnız bu adım için izin listesindedir. (inceleme düzeltmesi) İzin adres üzerinden eşlenir (`yok\.glb`). `file:` altında ileti adresi içerir ("Fetch API cannot load file:///…/yok.glb …"). http altında ise "Failed to load resource: … 404" iletisi adresi yalnız `location().url`'de taşır (N9-11). |
| V5 | `tests/kos.mjs` aynı dosyayı üç klasöre kopyalayıp senaryoyu üç kez koşar: `…/assets/`, `…/game-assets/`, `…/Masaüstü Oyun/` (boşluk ve ASCII dışı karakter). Üçünde de V1–V3 geçmeli (K-09). |
| V6 | URL `?test=1#x` iken de geçer (sorgu ve parça `key()`'i bozmaz) |
| `--cevrimdisi` (T58) | `context.setOffline(true)` sonrasında açılır: V1–V3, `navigator.onLine===false`, **başarısız istek 0**, `startGame` → `playing`, `DK.sim(10)` hatasız |

Üretim çeşidinde `DK` olmadığı için aynı açılışlar 56_tek_uretim'de `__dkDurum()` ile kısaltılmış olarak tekrarlanır: `eksikVarlik===0`, `isci ≥ 1`, `kati===true`.

### 4.7 K-09, K-16, K-19, K-20, A-16 ve K-10 düzeltmeleri

**K-09: `key()`.** Yedek dalı yoktur: sayfa dizini dışındaki adres gerçek ağa gider. Node benzetiminde yedekli ve yedeksiz iki biçim de 9/9 sonuç verdi. Gerçek tarayıcıda, `assets/` klasöründe 02_tek_dosya 4/4 geçti (§4.9).

```js
var BASE = String(document.baseURI).split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
function key(u) {
  var s;
  try { s = new URL(String(u), document.baseURI).href; } catch (e) { return null; }
  s = s.split('#')[0].split('?')[0];
  if (s.indexOf(BASE) !== 0) return null;            // sayfa dizini dışı: gömülü değil
  s = s.slice(BASE.length);
  try { s = decodeURIComponent(s); } catch (e) { /* olduğu gibi */ }
  return (F[s] || C[s]) ? s : null;
}
```

**K-16: uyarılar.** §4.2'deki seçenekler ve S6 taraması. Kabul: sentetik `new URL('./x.js', import.meta.url)` derlemesi `ERROR: "import.meta" is not available with the "iife" output format and will be empty` ile düşer (Ek A.2'de doğrulandı). Gerçek kaynak 0 uyarı verir.

**K-19: lisanslar.**

```js
const LISANS = [['three.js (MIT)', 'vendor/three/LICENSE'], ['PeerJS (MIT)', 'vendor/peerjs/LICENSE'],
  ['Pirata One (SIL OFL 1.1)', 'assets/fonts/OFL-PirataOne.txt'], ['Crimson Text (SIL OFL 1.1)', 'assets/fonts/OFL-CrimsonText.txt'],
  ['Varlıklar (CC0 1.0)', 'assets/CC0-1.0.txt'], ['Kaynak kayıtları', 'CREDITS.md']];
swap('</body>', `<script type="text/plain" id="dk-lisanslar">${scriptSafe(LISANS.map(([a, p]) => `== ${a} ==\n` + read(p)).join('\n\n'))}</script>\n</body>`);
```

Krediler paneline (`menu.js:319-331`) "Lisans metinleri" düğmesi eklenir [OK]:
- Tek HTML'de (`window.__DK_SINGLE_FILE`) metin, `#dk-lisanslar` bloğunun `textContent`'inden bir okuma paneline aktarılır. `innerHTML` kullanılmaz.
- Modüler sürümde dosyalara bağlantı verilir: `vendor/three/LICENSE`, `vendor/peerjs/LICENSE`, `assets/fonts/OFL-*.txt`, `assets/CC0-1.0.txt`. Bu dosyalar `_site`'a girer (§2.8).

**K-20: katı kip.**
- Ölçüm: başlık oyun paketine 106 B ekliyor. `assets/` klasöründe tek HTML 4/4 geçti (§4.9).
- `main.js` modül düzeyinde `const KATI = (function () { return this === undefined; })();` tanımlanır. Bu değer `__dkDurum().kati` olarak verilir. Modüler sürümde her zaman `true`'dur; tek HTML'de başlık varsa `true` olur.

**A-16:** §4.2'deki prelude koşulu ve 54'teki iframe açılışı.

**K-10: davet bağlantısı.** `js/ui/menu.js`'te tek yardımcı tanımlanır. `lobby()` (266) ve duraklatma menüsündeki kopyalama (353) bunu kullanır.

```js
export function davetBaglantisi(kod) {
  const yerel = location.protocol === 'file:' || String(self.origin) === 'null' || !!window.__DK_SINGLE_FILE;
  const kok = yerel ? (window.__DK_KANONIK || 'https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/') : `${location.origin}${location.pathname}`;
  return `${kok}?join=${encodeURIComponent(kod)}`;
}
```

Tek HTML'deki davet, arkadaşı canlı web sürümüne götürür. Sürümler farklıysa Faz 2'nin `PROTO` el sıkışması açık bir ileti gösterir. `file:` altında yerel klasör yolu artık paylaşılmaz.

### 4.8 Kökteki bayat tek HTML'in akıbeti (A-01, K-01)

- **Ne yapılır:** v0.5 dalında `git rm DenizKorsanlari-SonHazine.html` (Y10).
- **Gerekçe (kural 6):**
  - Dosya bayt bayt v0.3 derlemesidir (blob `3a912c30`, sha256 `f0ac8cb0…`).
  - README.md:15-17 ve tests/README.md:33-36 kullanıcıyı ve test edeni bu bayat dosyaya yönlendiriyor (K-14).
  - Dal tabanlı yayında sitede de bayat dosya duruyordu.
  - Güncel kopya her yayında CI'dan üretilir.
- **Dosya kaybolmaz.** Şu yerlerde kalır:
  - git geçmişi;
  - yerel `yedek-v0.3` etiketi ((inceleme düzeltmesi) kalıcı değildir: etiket GitHub'a gönderilemedi ve oturum klasörü silinince kaybolur, `00_BASLANGIC_KAYDI.md` §2; kalıcı kopya git geçmişi ve canlı daldır);
  - canlı dal (canlıya alınana dek);
  - 31 Ekim yayını.
- **Adres sürekliliği:**
  - `https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/DenizKorsanlari-SonHazine.html` aynı yolda kalır (yapıttan gelir).
  - GitHub depo sayfasındaki "raw" bağlantısı canlıya alındıktan sonra 404 olur. README'deki "İndir" bağlantısı Pages adresine çevrilir.
- **Sıra:** Pages kaynağı hâlâ dal tabanlıyken birleştirme yapılsaydı, dalın ham içeriği (artık kökte tek HTML yok) yayınlanır ve indirme adresi 404 olurdu. Bu da kaynak değişikliğinin birleştirmeden önce yapılmasının (§2.12 adım 7) bir gerekçesidir.

### 4.9 Ölçümler (bu tasarım için yapılan tarayıcı koşuları; Ek A.6)

Ortak koşullar:
- Bütün koşular gerçek tarayıcıda yapıldı (Chromium başsız 153.0.8010.12, SwiftShader, gerçek GPU yok), görünüm 640×360, kilit sarmalayıcısıyla.
- Bütün koşular **bugünkü** koşucuyla yapıldı; yani `404` süzgeci hâlâ etkindi.
- "Değişik derleme", v0.4 kaynağının `/tmp/tasarim_y/faz9/build_varyant.mjs` ile derlenmesidir: `legalComments:'eof'`, `"use strict"` başlığı, `logOverride`, uyarıda hata ve yeni `key()`. Depo dosyası değişmedi.

| Koşu | Yapıt | Açılış | Sonuç | Anlamı |
|---|---|---|---|---|
| `k09_eski_assets` | dist v0.4 (`75587dd9…`) | `file:///tmp/…/k09/assets/eski.html` | `__ready` yok (240 sn); 258 konsol hatası | K-09 gerçek tarayıcıda (N9-2) |
| `k09_yeni_assets` | Değişik derleme (`8ab34183…`) | `file:///tmp/…/k09/assets/yeni.html` | **4/4**; `errors` 0, `pageErrors` 0; hazır 5,3 sn; 3 işçi, `data:` adresi `"use strict"` ile başlıyor | **N9-6:** K-09, K-19 ve K-20 düzeltmeleri birlikte çalışıyor. Katı kip açılışı ve oyunu bozmuyor. |
| `k09_yeni_gameassets_q` | Aynı | `file:///tmp/…/k09/game-assets/yeni.html?test=1` | **4/4**; `errors` 0; hazır 5,6 sn | `game-assets` klasörü ve `file:` adresindeki sorgu (`?test=1`) `key()`'i bozmuyor |
| `blob_http` | dist v0.4 | `http://localhost:8080/dist/DenizKorsanlari-SonHazine.html` | **4/4**; `proto:'http:'`; işçi adresi `blob:http://localhost:8080/…`; 3 işçi, `fallback:false`, `errors` 0 | **N9-7:** T60 `blob:` yolu ilk kez gerçek tarayıcıda doğrulandı. Denetimde bu yol "doğrulanmamış"tı. 02_tek_dosya'nın etiketi http'de de "(file://)" diyor; 54'te etiketler ayrılır. |
| `cevrimdisi` | dist v0.4 | `file:///…/dist/…?test=1`, `context offline` | Hazır 6,1 sn; `navigator.onLine:false`; **dış istek 0, başarısız istek 0, konsol hatası 0, sayfa hatası 0**; 3 işçi (`data:`); eksik model 0; gömülü 87; `startGame` → `playing`, zemin doğru, yuva kaydı yazıldı. 34 uyarı: 33 × `THREE.BufferGeometry.toNonIndexed(): … already non-indexed`, 1 × `KHR_parallel_shader_compile … not supported`. | **N9-8:** T58 bugün sağlanıyor. Uyarı kaydı (K-12) iletileri **tekilleştirip sayarak** yazmalıdır, yoksa gürültü olur. |

**Eşdeğerlik örneklemi (N9-9).** `import()` kullanmayan dört mevcut senaryo, hiç değiştirilmeden dist v0.4 tek HTML'ine `file://` ile koşuldu. Modüler taban koşusuyla (`taban_kosusu_44d548c`) kontrol kontrol karşılaştırma:

| Senaryo | Modüler (taban) | Tek HTML (`file://`) | Hata | Hazır / süre (tek HTML) |
|---|---|---|---|---|
| 00_acilis | 6/6 | **6/6** (aynı etiketler) | `errors` 0, `pageErrors` 0 | 5,3 sn / 21,8 sn |
| 08_kalicilik | 12/12 | **12/12** | 0 / 0 | 5,8 sn / 27,3 sn |
| 05_dusman_ai | 18/18 | **18/18** | 0 / 0 | 5,7 sn / 29,7 sn |
| 13_donma | 9/9 | **9/9** | 0 / 0 | 4,7 sn / 27,8 sn |

**Sonuç:** 45 kontrolün 45'i iki hedefte aynı sonucu verdi (FARK 0). §4.4 (a) paketi bugünkü senaryolarla da kurulabilir.

**Sınırlar:**
- Örneklem küçüktür ve gevşek kipteki (bugünkü) derlemeyle alınmıştır. Katı kipli derleme yalnız 02_tek_dosya ile sınandı (N9-6). Tam paket Y4 ve Y11'de koşulacak.
- `import()` kullanan altı senaryo `DK.mod` dönüşümü olmadan tek HTML'de koşamaz (§4.4 önkoşulu).

---

## 5. Test kancaları ve test kipi

### 5.1 Test kipinin tanımı (K9-3)

Yeni modül `js/core/testmode.js` [OK]:

```js
// Test kipi: YALNIZ ?test=1 VE yerel köken (localhost, 127.0.0.1, [::1], file:).
// Üretim yapıtlarında (Pages _site ve üretim tek HTML) bu dosya saplamayla değişir: TEST=false, testParam()=null.
const YEREL = new Set(['localhost', '127.0.0.1', '[::1]']);
function tespit() {
  try {
    if (new URLSearchParams(location.search).get('test') !== '1') return false;
    return location.protocol === 'file:' || YEREL.has(location.hostname);
  } catch (e) { return false; }
}
export const TEST = tespit();
// Test URL parametreleri (?peerhost, ?terrain, ?turn…, ?dongu): test kipi kapalıyken her zaman null
export function testParam(ad) {
  if (!TEST) return null;
  try { return new URLSearchParams(location.search).get(ad); } catch (e) { return null; }
}
```

**Tasarım gerekçeleri:**

- **`?test=1`:** Faz 2 (§8.5, §12.1), Faz 5 (§8, `netShape.js`) ve Faz 6 (§8.1) bu anahtarı kullanıyor. Geliştirici de elle `localhost:8080/?test=1` açarak hata ayıklayabilir.
- **Yerel köken şartı:** K-08'in saldırısı **bağlantıyla** yapılır. Saldırgan kurbana `…github.io/SON-HAZ-NE/?join=…&test=1&peerhost=kotu.ornek` gönderebilir. github.io kökeninde test kipi açılmadığı için hem `DK` hem `?peerhost` yok sayılır. Bir bağlantı kurbanın tarayıcısında yerel kökenli bir sayfa açtıramaz. Tek istisna kurbanın kendisinin yerel sunucu çalıştırmasıdır; bu geliştirici durumudur ve belgelenir. (inceleme düzeltmesi) Bu istisna yalnız geliştiriciyi ilgilendirmez: README'nin "Oynamak için → Yerel" maddesi (README.md:19-23) oyunculara da `python3 -m http.server 8080` ile `http://localhost:8080` açmalarını söylüyor. Sunucusu açık bir oyuncu `http://localhost:8080/?join=…&test=1&peerhost=kotu.ornek` bağlantısıyla yine yönlendirilebilir. Bu yüzden `peerhost` test kipinde de yalnız geri döngü adresi olabilir (K9-20, §5.4). `DK`'nin yerelde açılması kabul edilen kalıntıdır, çünkü yalnız oyuncunun kendi tarayıcısını etkiler. README'nin "Yerel" maddesine şu not eklenir (Y10): "Oynamak için canlı adresi ya da tek HTML'i kullanın; yerel sunucu geliştirme içindir."
- **`file:` yerel sayılır:** Test çeşidi tek HTML `file://` ile sınanır. Üretim tek HTML'inde `testmode.js` saplandığı için `file:` altında da test kipi açılamaz (56_tek_uretim TK06).
- **Neden addInitScript değil?** Yalnız `window.__DK_TEST` bayrağı da güvenli olurdu, ama Faz 2/5/6 tasarımlarıyla uyumsuz olurdu ve elle hata ayıklamayı zorlaştırırdı. Bu yüzden URL anahtarı seçildi.
- **İstemci tarafında gizleme bir güvenlik sınırı değildir.** Asıl sınır Faz 2'nin host doğrulamasıdır. Test kipi yalnız kolay erişimi (`DK.G.player.inv.gold=1e9`) ve bağlantıyla yapılan saldırıyı kapatır.

### 5.2 Neler test kipine bağlanır

| Kanca / parametre | Önce | Sonra |
|---|---|---|
| `window.DK` + `snap`, `snapFrom`, `sim`, `tap`, `press` | `main.js:134-152` koşulsuz | `if (TEST) { (await import('./test/kancalar.js')).install(api) }` |
| `?peerhost/peerport/peerpath/peersecure` | `net.js:50-53` doğrudan `URLSearchParams` | `testParam('peerhost')` … |
| `?terrain`, `window.__DK_TERRAIN_MODE` | `terrain.js:249` | `TEST ? (window.__DK_TERRAIN_MODE \|\| testParam('terrain') \|\| '') : ''` |
| Faz 1 kipleri (`ctorthrow`, `noready`, `hang`, `crash1`) | Planlanan (`faz1_brief.md`: "yeni kipleri mevcut ?terrain parametresinin yanına ekle") | Aynı yol, ek iş yok |
| Faz 2 `DK.netTest` (`js/net/netTest.js`) | Planlanan (koşullu yükleme) | `if (TEST && G.isHost) (await import('./net/netTest.js')).install(DK)` |
| Faz 5 `netShape.js`, `?turn`, `?turnuser`, `?turnpass`, `?turnapi` | Planlanan ("yalnız test için") | `netShape` aynı kural; parametreler `testParam` |
| Faz 3 `DK.frames`, `onStep`, `?dongu=eski` | Planlanan | `DK.frames` kancalar modülünde; `onStep` dizisi oyun kodunda kalır (boş dizi zararsız); `?dongu` yalnız `testParam` |
| Faz 4 `DK.worldState.audit`, `DK.game._failStart` | Planlanan | `_failStart` yalnız `TEST &&` ile okunur; `audit` kancalar modülünden bağlanır |
| Faz 6 `DK.story` | Planlanan ("Faz 9 kararına göre kapalı") | Kancalar modülünden bağlanır |
| `G.godMode`, `G.noAutoPause`, `terrain.killWorkers` | Yalnız `DK` üzerinden erişilebilir | Değişmez. `DK` yoksa erişilemez. |
| `window.__ready` | `main.js:153` | **Kalır** |
| `window.__dkDurum()` | — | **Yeni**, üretimde de var, salt-okur (K9-4) |

### 5.3 Modül kuralları (statik denetimle zorunlu)

1. Teste özgü kod yalnız `js/test/` altında ya da saplama düzenli ifadesindeki dosyalarda durur (`js/net/netTest.js`, `js/net/netShape.js`).
2. Bu modüller **yalnız** `if (TEST …)` arkasındaki dinamik `import()` ile yüklenir. Dışarıya yalnız `install(api)` verirler. Oyun kodu bunlardan statik içe aktarma yapmaz.
3. Oyun kodu `window.DK`'yi hiçbir yerde okumaz. Bugün de okumuyor: grep yalnız `main.js`'i buluyor.
4. Oyun kodunda `location.search` yalnız iki yerde okunur: `testmode.js` ve `main.js` (`?join`).

`tests/node/test_kipi.mjs` [KO] bu dört kuralı `js/**` üzerinde tarar. Ayrıca `tespit()` için bir doğruluk tablosu sınar (Node'da `location` taklidiyle 12 durum):

| Adres | Beklenen `TEST` |
|---|---|
| `http://localhost:8080/?test=1` | true |
| `http://127.0.0.1:9/?test=1` | true |
| `http://[::1]:8080/?test=1` | true |
| `file:///x.html?test=1` | true |
| `https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/?test=1` | false |
| `http://192.168.1.5:8080/?test=1` | false |
| `http://localhost:8080/?test=0` | false |
| `?test=true` | false |
| `?test=1&test=0` | true (`get` ilk değeri alır) |
| `?join=X&test=1` | true |

### 5.4 `main.js`, `net.js` ve `terrain.js` değişiklikleri [OK]

**`main.js`:** `boot()` sonundaki 134-153 satırlarının yerine geçen kod.

```js
import { TEST } from './core/testmode.js';
import { SURUM, derleme } from './core/surum.js';
const KATI = (function () { return this === undefined; })();   // K-20 yoklaması (ESM'de her zaman true)
…
  const join = new URLSearchParams(location.search).get('join');
  if (join) menu.joinScreen(join);
  // salt-okur tanı (üretimde de var): yayın sonrası duman testi ve hata bildirimi için; denetim nesnesi döndürmez
  window.__dkDurum = () => ({ surum: SURUM, derleme: derleme(), hazir: !!window.__ready, test: TEST, kati: KATI,
    tekDosya: !!window.__DK_SINGLE_FILE, isci: terrain.workers.length, yedek: !!terrain.fallback,
    isciHata: terrain.failures.length, araziKip: terrain.mode, eksikVarlik: assets.missing.length, kk: !!kk.ready,
    sinyal: net.sinyalSunucusu() });
  if (TEST) {
    const { install } = await import('./test/kancalar.js');
    install({ G, assets, archipelago, physics, islands, bosses, ports, game, input, engine, post, settings, tpCamera, interact,
      npcs, Ship, kk, Character, handlers, net, ui, creator, hud, quests, treasure, enemies, animals, megafauna, hazards,
      progress, fish, fishing, seagear, shipControl, THREE, save, port, combat, effects, events, worldEvents, sky, time,
      bodies, weatherfx, details, terrain, ocean, crowd, audio });
  }
  window.__ready = true;
```

**`js/test/kancalar.js` (yeni):**
- `export const MARK = 'dk-test-kancalari-v1'`.
- `install(api)` şunları yapar:
  1. `window.DK = { ...api }`. Bugünkü **49 alan** birebir aynıdır; yalnız `audio` eklenir.
  2. `snap`, `snapFrom`, `sim`, `tap` ve `press`'i `main.js:136-152`'deki gövdelerle **aynen** kurar. Faz 3 `DK.sim`'i değiştirecekse bu dosyayı değiştirir.
  3. `DK.__sayac = { sim: 0, adim: 0, press: 0, tap: 0 }` sayacını tutar. `sim` ve `press` sayacı artırır; davranış değişmez (§6.1, tür alanı).
  4. `DK.mod(ad)` modül kayıt defterini sunar (§4.4). Statik `import * as shop from '../economy/shop.js'` vb. ile kurulur; bilinmeyen adda açık bir hata atar.
  5. `window.__DK_TEST_KIPI = MARK` yazar.

**`net.js`:**
- `peerOpts()` (49-55) şu hâle gelir:

  ```js
  const GERI_DONGU = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);   // (inceleme düzeltmesi) K9-20
  const h = testParam('peerhost');
  if (h && GERI_DONGU.has(h)) { o.host = h; o.port = +(testParam('peerport') || 9000); o.path = testParam('peerpath') || '/'; o.secure = testParam('peersecure') === '1'; }
  ```

- Yeni dışa aktarım: `sinyalSunucusu()` → `h ? \`${h}:${port}\` : 'varsayilan'`. Bu yalnız tanı içindir. Faz 5 `peerOpts`'u eşzamansız yaptığında aynı kural `ice.servers()`'taki `?turn*` için de geçerlidir.

**`terrain.js:249`:**

```js
this.mode = TEST ? (window.__DK_TERRAIN_MODE || testParam('terrain') || '') : '';
```

### 5.5 Üretim saplaması

- **Tek HTML:** `uretimSaplama` eklentisi (§4.2) iki dosya kümesini saplar. Etkisi S9 ile doğrulanır (`dk-test-kancalari-v1`, `window.DK`, `DK.sim` 0 kez).
- **`_site`:** `tools/site-hazirla.mjs` `js/core/testmode.js`'i aynı saplama metniyle değiştirir ve test modüllerini **kopyalamaz** (§2.8). `TEST` sabit `false` olduğu için dinamik `import()` hiç çağrılmaz; dosyanın yokluğu 404 de üretmez. 57_site_uretim bunu ağ günlüğüyle denetler: `js/test/` isteği 0.

### 5.6 Koşucuların kipi kendiliğinden açması [KO]

- **`run.cjs`:** Yeni `testUrl(u)`: `u` bir `http(s)` ya da `file` adresiyse ve `test` parametresi yoksa `test=1` ekler. Diğer parametreleri korur. Davranış seçeneklere göre değişir:
  - `--uretim` verilmezse: `__ready`'den sonra `typeof window.DK === 'object'` aranır. Değilse koşu `KOSUCU_HATASI` olur: "Test kipi açılmadı: sayfa üretim yapıtı mı ya da köken yerel değil mi?".
  - `--uretim` verilirse: `test` eklenmez. Kendiliğinden bir kontrol eklenir: `U00 Üretimde test kancası yok` (`typeof window.DK === 'undefined'`).
- **`coop.cjs`:** Aynı `testUrl`. Varsayılan adres `…?peerhost=127.0.0.1&peerport=9000&test=1` olur. Faz 2'nin CSP gevşetilmiş test girişi `tests/index.test.html` (Faz 2 §9.5) geldiğinde varsayılan adres oraya döner.
- **Eski sürümlerle uyum:** v0.4 (8080) ve v0.3 (8083) `test=1`'i yok sayar, `DK`'leri de koşulsuzdur. Yeni koşucu eski sürümleri sürmeye devam eder. Faz 4'ün fikstür üretimi (Faz 4 §10.1) ve "önce" koşuları (§6.6) bu sayede çalışır.
- (inceleme düzeltmesi) **`goto` adımı ve `beforeunload`.** `main.js:382-384` oyun sürerken `beforeunload`'da `preventDefault()` çağırıyor. Sayfada kullanıcı etkileşimi (tıklama) olmuşsa gezinme bir onay penceresi açar. Playwright pencereleri varsayılan olarak kapatır ve bu gezinmeyi durdurabilir. `goto` adımı bu yüzden `beforeunload` penceresini kabul eder (`page.on('dialog', d => d.type() === 'beforeunload' && d.accept())`) ve bunu rapora yazar.
- (inceleme düzeltmesi) **Koşu değişkenleri.** Senaryo dosyaları durağandır. Beklenen damga gibi koşuya özgü değerler `--degisken ad=deger` ile verilir ve `addInitScript` ile sayfaya `window.__KOSUCU = {…}` olarak konur. 02_tek_dosya'nın "damga = beklenen", TU04 ve SU04 kontrolleri bunu kullanır. Bu olmadan bu kontrollerin karşılaştıracağı bir değer yoktur.

### 5.7 Mevcut 25+ senaryonun bozulmadığının kanıtı

1. **API eşliği (Node, `tests/node/test_kipi.mjs`):** `git show 44d548c:js/main.js` satır 134'teki 49 anahtar ile `kancalar.js`'in kurduğu anahtarlar statik ayrıştırmayla karşılaştırılır. Eksik 0 olmalı. Fazla yalnız `audio`, `mod`, `__sayac` olabilir. Yardımcı adlar aynıdır.
2. **Zamanlama:** `install` beklenir (`await`), sonra `__ready=true` yazılır. Koşucu `__ready`'yi beklediği için (`run.cjs:56`, `coop.cjs:37`) senaryo başlarken `DK` hazırdır. Modüler sürümde ek maliyet tek bir modül isteğidir; tek HTML'de satır içidir.
3. **Tarayıcı kanıtı (Y3 kabulü):** Taban listesi yeni kod ve yeni koşucuyla (`test=1` kendiliğinden) koşulur:
   - 20 tek sayfa senaryosu, 5 co-op senaryosu ve 02_arazi_yedek'in dört kipi.
   - (inceleme düzeltmesi) Ölçüt kararsız testlere dayanmaz: tabanda geçen **23 koşunun ve 246 kontrolün hepsi** geçmelidir. 09_performans ve 06c'nin sonucu kaydedilir; geçmeleri de kalmaları da kabul edilir, ama kalırlarsa yalnız tabanda kalan kontrollerde. 06c tabanda kararsızdı (önceki kayıtlarda 5/7 koşuda geçti); 09'un kalan kontrolü de "kararsız ya da sızıntı" diye kayıtlı. Taslaktaki "aynı iki kalan" ölçütü bu yüzden ölçülemezdi. `DK.mod` dönüşümü yapılan altı dosyada kontrol sayıları değişmemelidir.
   - (inceleme düzeltmesi) 02_arazi_yedek'in noworker, badurl ve crash kipleri v0.4 tabanında koşulmadı; taban betiği yalnız normal kipi koşturdu (`00_BASLANGIC_KAYDI.md` §4, 14 Kasım düzeltmesi). Bu üç kipin "önce" kaydı Faz 1'in "önce" ölçümünde v0.4'e (8080) karşı alınır. Y1 aynı koşuyu yinelemez, o raporu kullanır; yeni kod onunla karşılaştırılır.
4. **Ters kanıt:** Aynı sayfa `--uretim` ile (test parametresiz) açılınca `DK` yok, `__ready` true, `__dkDurum().test===false` olmalı (53_test_kipi).
5. **`DK.mod` örnek eşitliği:** Modüler hedefte `DK.mod('economy/shop').MERCHANTS === (await import('./js/economy/shop.js')).MERCHANTS` → true. Dönüşüm aynı modül örneğini kullanır.

---

## 6. Test kayıt sistemi

### 6.1 Sekiz kayıt alanı ve nasıl otomatik üretildikleri

| Kullanıcının alanı | Rapor alanı (`dk-test-raporu/2`) | Üreten |
|---|---|---|
| Başarılı / başarısız | `kontroller[].ok`; `sonuc.durum` (GECTI, KALDI, OLCUM, KOSUCU_HATASI, ZAMAN_ASIMI); test düzeyinde durum (§6.5) | Koşucu + toplayıcı |
| Tekrar üretme adımları | `tekrar.komut` (tam komut satırı, mutlak senaryo yolu), `tekrar.sunucular` (`node tests/sunucu.cjs --kok . --port 8080`; co-op'ta sinyal sunucusu), `tekrar.commit` (+ `-kirli`), `tekrar.adim` (ilk başarısız adımın numarası ve `js` gövdesinin ilk 400 karakteri), `tekrar.url` | Koşucu (`process.argv`, `git rev-parse`, `kos.mjs`'in verdiği sunucu bilgisi) |
| Hata mesajı | `kontroller[].hata` (`beklenen` {eq, gte, lte, truthy} ↔ `deger`; istisna metni); `hatalar.konsol`, `hatalar.sayfa`, `hatalar.ag`, `hatalar.degerlendirme` (izin listesindekiler ayrı alanda) | Koşucu |
| İlgili dosya | `meta.dosyalar` (senaryo düzeyi), katalogda test düzeyinde `dosyalar`; senaryo yolu | Senaryo metası + katalog |
| Önce / sonra | `once` (v0.4 tabanı ya da aynı senaryonun v0.4'e karşı koşusu; durum ve değer), `sonra` (bu koşu) | Toplayıcı (§6.6) |
| Ekran görüntüsü | `kontroller[].goruntu` (ilk başarısız kontrolde `page.screenshot` ve varsa `DK.snap()` tuvali); `--goruntu hep` ile senaryo sonunda `son.png` | Koşucu |
| Test ortamı | `ortam`: makine (CI ya da yerel), işletim sistemi, çekirdek ve bellek, Node, Playwright, tarayıcı sürümü (`browser.version()`), GL dizgesi (`WEBGL_debug_renderer_info`), `gercekGPU`, görünüm, hedef türü (modüler, tek-test, tek-üretim, site, canlı), commit, dal, tarih | Koşucu |
| Gerçek tarayıcı mı, benzetim mi | `kontroller[].tur`, `sonuc.tur` | Koşucu, **ölçümle** (aşağıda) |

**Tür değerleri (sabit liste):**

| Değer | Anlamı | Nasıl belirlenir |
|---|---|---|
| `tarayici` | Gerçek tarayıcı (Chromium başsız, SwiftShader yazılımsal GPU). Oyun kendi döngüsüyle (rAF) ve **çizimle** koştu. | (inceleme düzeltmesi) Son gezinmeden (`goto`/`reload`) bu kontrole kadar `DK.__sayac` hiç değişmedi. Yalnız kontrolün kendi adımına bakmak yanlıştır: denetlenen durumu önceki bir `js` adımındaki `DK.sim` üretmiş olabilir. |
| `tarayici+benzetim` | Gerçek tarayıcı, ama oyun mantığı `DK.sim`, `DK.press`, `DK.frames` ya da `DK.simSteps` (Faz 3) ile **çizimsiz ve benzetilmiş kare süreleriyle** ileri sarıldı | Aynı aralıkta sayaç farkı > 0. (inceleme düzeltmesi) Aralık son gezinmeden başlar; `frames` ve `simSteps` de sayılır. Fark (`sim` çağrısı, adım sayısı) kayda yazılır. |
| `tarayici+webrtc` | Co-op: ayrı tarayıcı bağlamları, gerçek WebRTC veri kanalı, **yerel** PeerJS sinyal sunucusu (127.0.0.1:9000); gerçek internet ve TURN yok | `coop.cjs` |
| `node` | Tarayıcısız saf modül ya da benzetim (`tests/node`) | `kos.mjs` |
| `statik` | Dosya veya yapıt çözümlemesi (tek HTML, `_site`, iş akışı metni) | Araç |
| `ci` | GitHub API ya da iş akışı durumu (dağıtım, koşu) | Araç |
| `canli` | Yayındaki siteye karşı gerçek tarayıcı | `yayin_duman.mjs` |
| `elle` | İnsanın gerçek ekran kartlı makinede yaptığı ve formla kaydettiği deneme | `tests/kabul/elle/Txx.json` |

**Dürüstlük kuralı ("gerçek tarayıcı testini simülasyon gibi gösterme"):**
- Tür **ölçülür**, beyan edilmez. Katalogdaki `beklenenTur` yalnız denetim içindir.
- Ölçülen tür beklenenle uyuşmazsa kayıtta ölçülen yazılır ve "TÜR UYUMSUZ" uyarısı çıkar.
- "15/30/60/120 FPS" testleri her zaman `tarayici+benzetim`'dir: kare süreleri benzetilir. Raporda şu not sabittir: "gerçek 120 Hz ekran yok; SwiftShader".

### 6.2 Rapor şeması `dk-test-raporu/2` (geriye uyumlu)

Bugünkü alanlar korunur: `scenario`, `url`, `size`, `steps`, `errors`, `pageErrors`, `fails`, `evalErrors`, `readyMs`, `ms`. Faz 4'ün `ayikla.cjs`'i `steps[].result` okuyor; bu yüzden eski alanlar kalmalı. Yeni alanlar eklenir:

```json
{
  "sema": "dk-test-raporu/2",
  "senaryo": "tests/scenarios/08_kalicilik.js",
  "meta": { "testler": ["T08", "T42", "T43", "T45", "T47"], "dosyalar": ["js/core/save.js", "js/game/game.js"], "izinliHatalar": [], "olcum": false },
  "hedef": { "tip": "moduler", "url": "http://127.0.0.1:8080/index.html?test=1", "gorunum": [640, 360] },
  "ortam": { "makine": "yerel konteyner", "isletim": "linux 6.18.44", "cekirdek": 4, "bellekGB": 15, "node": "v22.22.0",
             "playwright": "1.63.0", "tarayici": "chromium-headless-shell (Chrome/…)", "gl": "ANGLE (Google, Vulkan … SwiftShader …)",
             "gercekGPU": false, "ci": false, "commit": "…", "dal": "claude/v0.5-saglamlastirma", "kirli": false, "tarih": "2026-…Z" },
  "tekrar": { "komut": "node tests/harness/run.cjs /…/08_kalicilik.js --url http://127.0.0.1:8080/index.html --size 640x360",
              "sunucular": ["node tests/sunucu.cjs --kok . --port 8080"], "commit": "…", "adim": null },
  "kontroller": [
    { "n": 9, "id": "B04", "etiket": "B04 Taşınan sandık kayıtta; yüklemede oyuncunun yanında yerde", "ok": true, "deger": true,
      "beklenen": { "truthy": true }, "sure_ms": 812, "benzetim": { "sim": 2, "adim": 60 }, "tur": "tarayici+benzetim",
      "hata": null, "goruntu": null }
  ],
  "hatalar": { "konsol": [], "konsolIzinli": [], "sayfa": [], "ag": [], "agIzinli": [], "degerlendirme": [] },
  "uyarilar": [],
  "sonuc": { "durum": "GECTI", "onaySayisi": 12, "kalan": 0, "cikisKodu": 0, "neden": [], "tur": "tarayici+benzetim" },
  "sure": { "hazirMs": 6900, "toplamMs": 43000 }
}
```

**Kontrol kimliği (`id`)** etiketin başındaki koddan çıkarılır (örnekler: `K01`, `D4-01`, `H07/H22`, `B02/B-08`, `E-13/A1`, `F-07`, `ek-110`). Kod yoksa etiketin kısa özeti kullanılır. Önce/sonra eşlemesi etiket metniyle yapılır, çünkü kimlikler senaryolar arasında tekrar ediyor (`K01` hem 12'de hem 16'da var).

### 6.3 Koşucu değişiklikleri (K-11, K-12, K-13) [KO]

**`tests/harness/run.cjs`:**

1. **Konsol (K-11).** `:40`'taki `!/404/.test(t)` süzgeci kaldırılır. Her `console.error` `hatalar.konsol`'a yazılır; izin listesine uyan `konsolIzinli`'ye gider. İzin listesinin kaynakları:
   - senaryo metası `izinliHatalar` (düzenli ifade dizgeleri, her biri gerekçeli),
   - CLI `--izin-hata`.

   `warning` türü `uyarilar`'a **tekilleştirilerek** yazılır: `{ileti, sayi}`, en çok 200 farklı ileti. Başarısızlık sayılmaz. N9-8'deki 33 aynı THREE uyarısı tek satır olur.

   (inceleme düzeltmesi) **Eşleme ve tekilleştirme.** İzin listesi ileti metniyle birlikte iletinin `location().url`'sine de uygulanır. Sayfa düzeyindeki bir 404, Chromium'da adres içermeyen "Failed to load resource: the server responded with a status of 404 (…)" iletisi üretir (N9-11). Bu ileti, ağ kaydındaki aynı adresli ≥ 400 yanıtıyla eşlenir ve yalnız bir kez, `hatalar.ag`'da sayılır. Eşlenemeyen "Failed to load resource" iletisi konsol hatası olarak kalır.
2. **Ağ (K-11).** `requestfailed` ve `response.status() ≥ 400` `hatalar.ag`'a yazılır. Varsayılan izin listesi yalnız `/favicon\.ico$/`'dur. Kipe özgü gerekçeli izinler paket tanımında (`tests/kabul/suitler.mjs`) `--izin-hata` olarak verilir. Örnekler: 02_arazi_yedek `badurl` kipinde `terrainWorker\.missing\.js` (beklenen 404); `crash` kipinde `Test: arazi işçisi çökmesi` (sayfaya yansırsa). Böylece aynı senaryonun normal kipinde bu iletiler yine başarısızlık sayılır. (inceleme düzeltmesi) Ölçüm: modüler sürümde badurl kipi 3 × 404 yanıtı ve 3 × `requestfailed net::ERR_FAILED` üretiyor; ikisi de aynı izinle kapanır. crash kipinde işçideki istisna sayfa konsoluna yansımadı (Ek B.3); izin gerekmeyebilir, gerekirse koşu bunu gösterir.
3. **Onay sayısı (K-13).** `expect` adımı sayısı 0 ise ve `meta.olcum !== true` ise sonuç KALDI olur. Neden: "senaryo hiç onay içermiyor (ölçüm betiği mi? meta.olcum ile işaretleyin)". `meta.olcum: true` ise sonuç `OLCUM` olur, çıkış kodu 0'dır ve katalog bu senaryoyu hiçbir testte GEÇTİ saymaz.
4. **Çıkış kodu (96. satırın yerine).** 1 olur, eğer `fails > 0` ya da `pageErrors > 0` ya da izinsiz konsol veya ağ hatası > 0 ya da `evalErrors > 0` ya da onaysız senaryo ya da koşucu hatası ya da zaman aşımı varsa. `sonuc.neden[]` hepsini sayar.
5. **Kayıt alanları:**
   - `beklenen`, `sure_ms`, `id` alanları.
   - `benzetim` farkı: adım öncesinde ve sonrasında `DK.__sayac` okunur; `DK` yoksa (üretim kipi) okunmaz.
   - `ortam`, `tekrar`, ekran görüntüsü (`--goruntu kalan|hep|yok`; varsayılan `kalan`).
6. **Meta.** Senaryo dizisinin ilk öğesi `{meta: {...}}` ise kaydedilir ve adım sayılmaz. Mevcut senaryolarda meta yoktur; varsayılanlar geçerli olur.
7. **Yeni seçenekler ve adım türleri:**
   - `--uretim`, `--cevrimdisi`, `--browser chromium|firefox|webkit`.
   - Adımlar: `goto` (`{goto: url, testParam: true|false}`), `agSay` (`{agSay: {desen, enCok, label}}`; koşucunun ağ günlüğünden sayar, onay gibi davranır), `rotaKok` (`{rotaKok: {kok: 'http://oyun.ornek', dizin: '.'}}`; `context.route` ile sahte kökeni yerel dosyalardan sunar ve MIME türünü uzantıdan verir; 53_test_kipi TK05). `context.route` seçilmesinin nedeni, işçi betiği isteklerinin de yakalanmasıdır. Yakalanmasa da TK05'in ölçütleri işçiye bağlı değildir.
   - Faz 1'in başlatma betiği desteği ve Faz 4'ün `reload`, `initStorage`, `storageFault` adımları aynı şemaya eklenir. Hangi faz önce eklerse diğeri o şemayı kullanır; Faz 9 bunları değiştirmez.
   - (inceleme düzeltmesi) Eksik adım türleri:
     - `tikla` (`{tikla: 'css=…'}` ya da `{tikla: {metin: 'YENİ MACERA'}}`): `page.locator(…).click()` ile görünürlük ve isabet denetimli tıklama. Bugünkü `click: [x, y]` koordinat adımı bunun yerini tutmaz.
     - `bekleSecici` (`waitForSelector`).
     - `degisken` (§5.6).
     - `metrikKarsilastir` (`{metrikKarsilastir: {once: 'm1', sonra: 'm2', alan: 'listeners', enCokFark: 5, label}}`). Bugünkü `metrics` adımı (`run.cjs:87`) CDP değerlerini yalnız yazar, onaylayamaz.

     56 TU05, 57 SU06, 59 AM01–AM10 ve 60 DD05 bu adımlara dayanır.
   - (inceleme düzeltmesi) **Etiket eşleme dosyası.** Bir faz bir taban kontrolünün etiketini değiştirirse eski → yeni eşlemesi gerekçesiyle `tests/kabul/etiket_esleme.json`'a yazılır. Yoksa toplayıcı eski etiketi "KAYIP" sayar ve kapı kalır (§7.4-7).

**`tests/harness/coop.cjs`:**

1. **`ev(p, js, etiket, {kapaliIzinli = false} = {})` (K-12).**
   - Sayfa kapalıysa (`p.isClosed()`) çağrı yapılmaz ve `report.kapaliAtlama` artar.
   - İstisna olursa: o anda sayfa kapanmışsa izinlidir. Değilse `report.evalErrors.push({oyuncu, etiket, hata})` yapılır ve `fails++` olur.
2. **`tick()` yalnız açık sayfalarda koşar** (`pages.filter(p => !p.isClosed())`). Tabandaki 42 "closed" `EVALERR` (06a 19, 06a2 18, 06c 5) böylece kaybolur. Kasıtlı kapatma, `p.on('close')` ile kendiliğinden işaretlenir; senaryo değişikliği gerekmez.
3. **Konsol ve ağ.** Konsolda `404` süzgeci kalkar. Uyarılar oyuncu başına kaydedilir; Faz 5'in `--log warn` isteği bununla varsayılan olur. `requestfailed` ve 4xx/5xx kaydedilir.
4. **`checks.length === 0`** ise sonuç KALDI olur (`meta.olcum` değilse).
5. **Diğer.** `module.exports.meta` okunur. Ortam ve tekrar alanları yazılır. İlk başarısız kontrolde **her oyuncunun** ekran görüntüsü alınır.
6. **Uyum.** Faz 2'nin (`--split`, `--latency`, `--url2`), Faz 4'ün (`--sameContext`) ve Faz 5'in (`--netem`, `--repeat`, `--parallel-start`, `--peer-server own`) seçenekleri bu şemayla uyumludur.

**Negatif testler (Y1 kabulü):** `tests/node/kosucu_negatif.mjs` küçük sabit sayfalarla (`tests/fixtures/kosucu/*.html`) koşucuyu sınar:

| Sabit sayfa | Beklenen |
|---|---|
| (a) `console.error('x 404 y')` | KALDI |
| (b) Olmayan bir görsel isteği | KALDI (ağ) |
| (c) Onaysız senaryo | KALDI |
| (d) `meta.olcum` | OLCUM, çıkış 0 |
| (e) İzin listesindeki hata | GECTI |
| (f) Co-op `ev` istisnası | KALDI |
| (g) Kapatılmış sayfada `tick` | GECTI |

Ek olarak K-11'in kabul denemesi yapılır: tek HTML kopyasının `__DK_FILES`'ından `assets/models/chest.glb` silinir ve 02_tek_dosya'nın kaldığı görülür ("Model yüklenemedi" konsol hatası).

### 6.4 Katalog: `tests/kabul/kullanici_testleri.mjs`

```js
// Kullanıcının 62 testi (master_prompt §15) ↔ senaryo kontrolleri. Toplayıcı ve tests/node/katalog.mjs bu dosyayı okur.
export default [
  { no: 'T01', ad: 'Normal Worker açılışı', grup: 'acilis', faz: [1, 9], kapsam: 'tam',
    kontroller: [
      { senaryo: '00_acilis', etiket: /^Arazi işçileri çalışıyor$/ },
      { senaryo: '02_arazi_yedek', kip: 'normal' },                       // kalıp yoksa senaryonun bütün kontrolleri
      { senaryo: '54_tek_isci', etiket: /^TI0[12] / },
    ],
    beklenenTur: ['tarayici', 'tarayici+benzetim'],
    dosyalar: ['js/world/terrain.js', 'js/world/terrainWorker.js', 'tools/build-single-html.mjs'] },
  { no: 'T14', ad: '120 FPS hareket', grup: 'fizik', faz: [3], kapsam: 'tam',
    kontroller: [{ senaryo: '03_fizik_dt', etiket: /120/ }, { senaryo: '18_fps_dususu', etiket: /^FS0[1-9] / }],
    beklenenTur: ['tarayici+benzetim'], not: 'Kare süreleri benzetilir; gerçek 120 Hz ekran yok (SwiftShader).',
    once: { senaryo: '03_fizik_dt', deger: 'gemi 12 sn: 82,64 m (60 FPS: 87,5 m; %5,7 eksik); zıplama tepesi 1,214 m (+%2,6)' },
    dosyalar: ['js/game/game.js', 'js/main.js', 'js/ship/ship.js', 'js/player/player.js'] },
  { no: 'T23', ad: 'Şifreli oda', grup: 'cokOyunculu', faz: [2], kapsam: 'tam',
    kontroller: [{ senaryo: 'coop/06e_kotu_konuk_oturum', etiket: /^B-15|şifre/i, planlanan: true }],
    beklenenTur: ['tarayici+webrtc'], dosyalar: ['js/net/net.js'] },
  // … T02–T62 (§6.8 tablosu birebir)
];
```

**`tests/node/katalog.mjs` (statik işte) şunları denetler:**
- Tam 62 kayıt var: T01–T62, her biri bir kez.
- Her `senaryo` başvurusu ya bir dosyaya karşılık gelir (`tests/scenarios/`, `tests/scenarios/coop/`, `tests/node/`, `tests/yayin/`) ya da `planlanan: true` ve faz bilgisi taşır.
- **Senaryo adları benzersizdir.** Faz 3 ile Faz 4'ün `23`–`26` çakışmasını yakalar (K9-17).
- Sayısal önekler KARARLAR.md'deki faz aralığına uyar. (inceleme düzeltmesi) Kural yalnız `planlanan: true` başvurulara uygulanır; sahibi faz `planlayan` alanında yazılır. Bugünkü senaryolara (00–17) her faz başvurabilir (ör. T01, `faz: [1, 9]` ile 00_acilis'e). Örnek: `planlayan: 4` olan yeni bir başvuru `23`–`26` ya da `06o`–`06q` kullanır.
- Her kayıtta `dosyalar` ve `beklenenTur` boş değildir.

### 6.5 Test düzeyinde durum kuralları

| Durum | Koşul |
|---|---|
| **GEÇTİ** | Katalog kalıbına uyan ≥ 1 kontrol var. Hepsi `ok`. İlgili senaryoların `sonuc.durum`'u `GECTI` (izinsiz hata yok). Kayıtta `kapsam: 'tam'`. |
| **KISMİ** | Kontroller geçti ama katalogda `kapsam: 'kismi'` var: kullanıcı testinin bir bölümü sınanıyor ve eksik kısım `eksik` alanında yazılı. Örnek: T06 için 59_ana_menu gelene dek. |
| **KALDI** | Eşleşen bir kontrol kaldı ya da senaryo koşucu hatası, zaman aşımı ya da izinsiz hatayla bitti |
| **KALDI (bilinen)** | KALDI ve `tests/kabul/bilinen_sorunlar.json`'da kayıtlı (sorun kimliği, sahibi faz, gerekçe, bitiş tarihi). **Gizlenmez**, ayrı sayılır ve raporlarda ilk tabloda görünür. |
| **EŞLEŞME YOK** | Senaryo koştu ama kalıba uyan kontrol yok. KALDI sayılır; katalog bakımı gerekir. |
| **EKSİK** | Katalogdaki senaryo henüz yazılmadı (`planlanan`); sahibi faz yazılır |
| **KOŞULMADI** | Senaryo var ama bu koşuda yok (ör. hızlı kapsamda co-op) |
| **ÖLÇÜM** | Yalnız `meta.olcum` senaryoları eşleşti. Asla GEÇTİ değildir. |
| **ELLE** | Kanıt `tests/kabul/elle/Txx.json` dosyasındadır: tarih, kişi, donanım (GPU modeli), tarayıcı, adımlar, sonuç, ekran görüntüsü yolları. Durum dosyadan okunur; tür `elle`. |

### 6.6 Önce ve sonra verisinin üretilmesi

- **Önce, kaynak 1:** `docs/v05/taban_kosusu_44d548c/*.json` (v0.4 taban koşusu, 25 rapor). Aynı senaryo ve aynı etiketle eşleşen kontrolün `ok` ve `value` alanları alınır.
- **Önce, kaynak 2:** Tabanda olmayan senaryolar için `tests/kos.mjs <paket> --taban http://localhost:8080` aynı yeni senaryoyu **v0.4'e karşı** koşar. v0.4 `test=1`'i yok sayar ve `DK`'si koşulsuzdur (§5.6). Çoğu yeni kontrolün v0.4'te kalması beklenir; özelliğin olmaması dürüst bir "önce" kaydıdır. (inceleme düzeltmesi) Yeni bir senaryo v0.4'te özellik yüzünden değil test API'si yüzünden de kalabilir (`DK.mod is not a function`, `DK.frames` yok…). Bu, özelliğin yokluğu demek değildir. Toplayıcı bu hatayı "ÖNCE UYGULANAMAZ (test API'si yok)" diye ayrı yazar ve KALDI saymaz. Faz 7'nin F7-0 gözlem kipinde "uygulanamaz" diye raporladığı kontroller (Faz 7 Ç-9) de aynı durumla kaydedilir. CI'da 8080 sunucusu yoktur; orada "önce kaynak 2" için `--taban-commit 44d548c` bir `git worktree` açar ve onu sunar.
- **Sonra:** Bu koşu.
- **Değer karşılaştırması:** Katalogdaki `deger` alanı sayısal önce/sonra çıkarımı tanımlar. Örnek: T14'te gemi mesafesi (82,64 → 87,5 m).
- **Biçim:** Markdown'da "önce → sonra" olarak yazılır, ör. "ÖLÇÜM (onay yok) → GEÇTİ 9/9".

### 6.7 Toplayıcı: `tools/test-kaydi.mjs`

```
node tools/test-kaydi.mjs --kosu <rapor dizini(leri)> [--taban docs/v05/taban_kosusu_44d548c] [--katalog tests/kabul/kullanici_testleri.mjs]
                          [--bilinen tests/kabul/bilinen_sorunlar.json] [--elle tests/kabul/elle] --cikis <dizin> [--ozet $GITHUB_STEP_SUMMARY]
```

- **Çıktılar:**
  - `TEST_KAYDI.json`: 62 kayıt × 8 alan, ayrıca senaryo dökümü ve ortam.
  - `TEST_KAYDI.md`: özet tablo + test başına ayrıntı bölümleri.
  - `esdegerlik.md`: §4.4 karşılaştırması.
- **Markdown düzeni:**

```
# Test kaydı — <commit> (<dal>) — <tarih>
Ortam: yerel konteyner | Linux 6.18 | 4 çekirdek | 15 GB | Node 22.22 | Playwright 1.63 | Chromium başsız (SwiftShader, gerçek GPU yok)
Özet (örnek değerler): GEÇTİ 31 · KISMİ 12 · KALDI 2 (bilinen 2) · EKSİK 14 · KOŞULMADI 3 · ELLE 0 / 62

| T | Test | Durum | Kontrol | Tür | Önce (v0.4) | Sonra | Görüntü | Ayrıntı |
|---|---|---|---|---|---|---|---|---|
| T01 | Normal Worker açılışı | GEÇTİ | 19/19 | tarayıcı, tarayıcı+benzetim | GEÇTİ 18/18 | GEÇTİ 19/19 | — | [T01](#t01) |
| T25 | Dört oyuncu | KALDI (bilinen #37) | 2/7 | tarayıcı+webrtc | KALDI 2/7 | KALDI 2/7 | [D4-02](…/06c/D4-02_Tayfa.png) | [T25](#t25) |

## T25 — Dört oyuncu
- Durum: KALDI (bilinen: KNOWN #37, sahibi Faz 5, bitiş: Faz 5 kapanışı)
- Kontroller: 06c_dort_oyuncu D4-01 ✔, D4-02 ✘ (["playing","menu","playing","playing"]), …
- Tekrar: `node tests/harness/coop.cjs …/06c_dort_oyuncu.cjs --players 4 --size 480x270 --timeout 1200 --url "http://127.0.0.1:8080/index.html?peerhost=127.0.0.1&peerport=9000&test=1"`; sunucular: …; commit …
- Hata: D4-02 beklenen hepsi "playing", gerçek ["playing","menu","playing","playing"]
- İlgili dosyalar: js/net/net.js (join :410-422), js/main.js (startOnlineGuest :187-197)
- Ortam: …; Tür: gerçek tarayıcı + gerçek WebRTC (yerel sinyal sunucusu; gerçek ağ ve TURN yok)
```

### 6.8 62 testin eşlemesi

**Tür kısaltmaları:**

| Kısaltma | Anlamı |
|---|---|
| TR | `tarayici` |
| TR+B | `tarayici+benzetim` |
| TR+W | `tarayici+webrtc` |
| ND | `node` |
| ST | `statik` |
| CI | `ci` |
| CN | `canli` |
| EL | `elle` |

**Taban durumu** `audit_K.json` gereksinim değerlendirmesinden ve taban koşusundan alınmıştır. **F*n*** sahip fazı gösterir. Planlanan adlar KARARLAR.md aralıklarına ve ilgili faz tasarımına göredir; (inceleme düzeltmesi) Faz 7'nin adları nihai Faz 7 tasarımından (`FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md`: 37_dusman_algi … 44_kamera_dar_alan; 08a_savas_esitligi, 08b_boss_konuk, 08c_dusman_ag_lod), Faz 8'inkiler taslaktan (`faz8_tasarim.md`: 45_perf_matris … 52_uzun_oturum_gercek; 08d–08f) alındı. Nihai Faz 8 belgesinde değişirse katalog güncellenir. `katalog.mjs`, dosyası henüz olmayan senaryoyu `planlanan` alanıyla ayırt eder.

| T | Test | Mevcut kontroller (v0.4) | Planlanan | Tür | İlgili dosyalar | Taban |
|---|---|---|---|---|---|---|
| T01 | Normal Worker açılışı | 00_acilis "Arazi işçileri çalışıyor" (6/6); 02_arazi_yedek normal (12/12) | F1 02_arazi_yasam (açılış kipleri), node arazi_kuyruk; F9 54 TI01–TI02 | TR | terrain.js:64-80 `_initWorkers`; terrainWorker.js; build-single-html.mjs:100-103 | GEÇTİ |
| T02 | Worker bulunamadığında | 02_arazi_yedek `badurl`, `noworker` (12. belge 12/12×4; v0.5 tabanında koşulmadı) | F1 02_arazi_yasam `ctorthrow`, `noready`; F9 54 TI04; CI duman: noworker | TR+B | terrain.js:58-62, 65, `_setFallback` | GEÇTİ (eski kayıt) |
| T03 | Worker çöktüğünde | 02_arazi_yedek `crash`; 02_arazi_kurtarma (7/7) | F1 `hang`, `crash1`; F9 54 TI05 | TR+B | terrain.js:85-102 `_workerFailed`, 189; terrainWorker.js:8 | GEÇTİ |
| T04 | Arazi mesh oluşturulması | 00 "Arazi karoları yüklendi"; 02_arazi_yedek "Menü sahnesinde karo ağları…", "Yüksek çözünürlüklü karolar…", "Tuz Pazarı…" | F1 02_arazi_yasam (sızıntı, LOD yarışı), node arazi_sozlesme | TR+B | terrain.js; terrainGen.js | GEÇTİ |
| T05 | Harita derinliği | 02_arazi_yedek "Okyanus derinlik penceresi hazır", "…yeni bölgeye taşındı", "Harita ızgarası isteği sonuçlanıyor" | F1 `_depthSeq` (02_arazi_yasam, arazi_kuyruk) | TR+B | terrain.js `requestDepth`, `requestGrid` (411-420); mapArt.js:115-122 | GEÇTİ |
| T06 | Ana menü | 00 "Ana menü görünür", "Menü düğmeleri" (≥ 8); 06_arayuz_960 H05 | **F9 59_ana_menu** (§9.1) | TR | menu.js:88-105, 319-331 | KISMİ |
| T07 | Yeni oyun | 00 "Oyun başladı", "Oyuncu dünyada" (`startGame`) | F4 24 (F4-T1); F9 59 arayüz akışı | TR, TR+B | main.js:157-167; menu.js `slotScreen`; creator.js | GEÇTİ (arayüz yok) |
| T08 | Kayıt yükleme | 08 "Kayıt yüklendi…" (12/12); 12 K01–K03 | F4 24 (F4-T6), 26; F9 59 "Dünyalar"dan yükleme | TR+B | save.js; main.js:169-172 | GEÇTİ |
| T09 | Hızlı yolculuk | 03_fizik_duzeltmeler "Taşınan demirli gemi…" | F1 02_hizli_yolculuk | TR+B | main.js:270-301 `fastTravel`; net.js `teleport`; quests.js:439 | KISMİ |
| T10 | Dünya değişimi | 12 (aynı sayfada 3 `startGame`); 13 P04; 06c D4-06 (kaldı) | **F9 60_dunya_degisimi** | TR+B | main.js `toMenu`; game.js `start/stop` (144, 153) | KISMİ |
| T11 | 15 FPS hareket | 03_fizik_dt ölçüm (onay yok; yürüme 12,596 m); 03_fizik_duzeltmeler "Alt adım sayısı…", "Geri tepme…" | F3 03_fizik_dt beklentili FD01–FD09; 18_fps_dususu D4 | TR+B | game.js `update`/`_step`; main.js:117-123; player.js | ÖLÇÜM |
| T12 | 30 FPS hareket | Aynı (1/30) | F3 FD (30) | TR+B | Aynı | ÖLÇÜM |
| T13 | 60 FPS hareket | Aynı (referans) | F3 FD (60) | TR+B | Aynı | ÖLÇÜM |
| T14 | 120 FPS hareket | Gemi 82,64 m (−%5,7), zıplama 1,214 m (+%2,6) | F3 FD (120, 144), FS01–FS09 | TR+B | ship.js; game.js | ÖLÇÜM (bilinen #1) |
| T15 | Karakter çarpışmaları | 03 "Yüksek platforma yandan girilmez"; 15 I02, I05; 05 "Yığılma yok" | F3 19_hizli_hareket, 20_dar_gecit (DG01–DG07), 21_orman_kaya, 22_merdiven_iskele, YP01 | TR+B | physics.js; player.js; crowd.js | GEÇTİ (kapsam kısmi) |
| T16 | Kamera çarpışması | 04 C07; 15 C01–C05; 17 K04–K08 | F3 17 K13–K14, 22a GV06; (inceleme düzeltmesi) F7 44_kamera_dar_alan; EL gerçek GPU turu | TR+B, EL | camera.js; nearfade.js | GEÇTİ |
| T17 | Gemi dalga hareketi | — | F3 FD06 (yatay yol ve hız; dalga değil), 22a GV01 (güverte–oyuncu farkı); **eksik:** yalpa, vurma ve kalkma genliği; batmama; dalga tepkisinin FPS'ten bağımsızlığı. (inceleme düzeltmesi) Hiçbir faz bunu planlamıyordu. **`22e_gemi_dalga` Faz 3'e atanır** (KARARLAR.md eki): GD01 sabit hava ve `resetClock` ile 15/60/144 FPS'te 20 sn boyunca yalpa, vurma ve kalkma tepe değerleri ≤ 1 cm ve ≤ 0,05° (Faz 3 FD ölçütleri); GD02 fırtınada su alma kapalıyken batma yok; GD03 karaya oturma (T18). | TR+B | ship.js (kaldırma, `_animate`); ocean.js | YOK |
| T18 | Gemi çarpışmaları | 03 "Kinematik gemiye çarpma…" | F3 MI04 (iskele), 22d GN01; 22e GD03 karaya oturma ((inceleme düzeltmesi) Faz 3'e atandı) | TR+B | ship.js:394-411, 442-458 | KISMİ |
| T19 | Sandık fiziği | 03_fizik_dt cisim düşüşü (ölçüm); 16 T04, T07 | F3 FD07, 22b SD01–SD06 | TR+B | bodies.js; treasure.js | KISMİ |
| T20 | Top gülleleri | 03 gülle ve mermi süpürmesi | F3 FD08 (menzil ≤ 1 cm), 22d GN01–GN06 | TR+B | effects.js `cannonball`; combat.js | KISMİ |
| T21 | Oda kurma | Bütün co-op (`DK.net.host`); 06c D4-01; 06_arayuz_960 H05 | F2 06e; F5 06r R7; F9 59 Oda Kur paneli (yerel sinyal) | TR+W | net.js `host`; menu.js `hostScreen` | GEÇTİ (arayüz kısmi) |
| T22 | Odaya katılma | 06d "Konuk odaya bağlandı"; 06b | F2 06m; F5 06r (arayüzden Katıl önerisi) | TR+W | net.js `join` (:410-422); menu.js `joinScreen` | GEÇTİ |
| T23 | Şifreli oda | — (hepsi `pw:''`) | F2 06e B-15 (yanlış şifre ve kilit). (inceleme düzeltmesi) Doğru şifreyle katılım hiçbir fazda planlı değildi; **Faz 2'nin `06j_mesru_oyun` senaryosuna eklenir** (KARARLAR.md eki): şifreli oda kur → doğru şifreyle katıl → `info.pw === true` ve roster 2. | TR+W | net.js:252 | YOK |
| T24 | İki oyuncu | 06b 18/18; 06d 9/9 | F2 06j; F5 06r–06x | TR+W | net.js | GEÇTİ |
| T25 | Dört oyuncu | 06c 2/7 | F5 06z (`--repeat 10` → 10/10), 06y | TR+W | net.js | KALDI (bilinen #37) |
| T26 | Hareket senkronu | 06b F-12; 06c D4-05 (kaldı) | F5 06s S1–S3 (`--netem`); F2 06l | TR+W | net.js `st`; RemotePlayer; Faz 5 interp.js | KISMİ |
| T27 | Gemi kontrolü | 06a/06a2 H13 (yalnız kilit) | F5 06u U1–U6; F2 06f (B-02, B-13) | TR+W | shipControl.js; net.js `shipCmd/helm` | KISMİ |
| T28 | Ganimet toplama | 06b H01; 06d C01–C04; 16 T01–T10 | F2 06f/06g | TR+W, TR+B | treasure.js; net.js | GEÇTİ |
| T29 | Altın paylaşımı | 06a H07 (açığı başarı sayıyor, K-13) | F2 06g B-08 (`gold` etkisiz; satış payı); F5 06t T6, 06v V1 | TR+W | net.js:44 `GOLD_PER_MIN`; Faz 2 econ.js | KISMİ (yanlış ölçüt) |
| T30 | Saldırı ve hasar | 05 (18/18); 06a H07; 06b F-11, F-15 | F2 06h; (inceleme düzeltmesi) F7 40_savas_adaleti, 08a_savas_esitligi | TR+B, TR+W | combat.js; enemies.js; Faz 2 hostCombat.js | GEÇTİ |
| T31 | Boss savaşı | 05 "Boss evreleri…" (birim); 09 kur/sök | (inceleme düzeltmesi) F7 41_boss_deniz, 42_boss_kara_insan, 08b_boss_konuk; F6 28–32, 35 | TR+B | bosses.js | KISMİ (bilinen #12) |
| T32 | Yüzen olay nesneleri | 06b B08/H08; 16 T05, V01 | F5 06t T1–T10 | TR+W | events.js; net.js `floatReq` | GEÇTİ |
| T33 | Konuk rütbesi | 06d C06 (yalnız öldüren kimliği) | F5 06w W1–W4; F2 06k | TR+W | progress.js; Faz 2 guestBook.js | KISMİ |
| T34 | Bağlantı kopması | 06a2 H13 (3/3); 06c D4-07 | F5 06r R2, R11, R12 | TR+W | net.js:441, 577, 706 | GEÇTİ |
| T35 | Yeniden bağlanma | 06c D4-06 (kaldı) | F5 06r R2–R3; 06z Z5 | TR+W | net.js `join`; Faz 5 session.js | KISMİ |
| T36 | Host ayrılması | — | F5 06x X1–X3, 06y Y1 | TR+W | net.js `hostLeft`; main.js:313-318; Faz 5 migrate.js | YOK |
| T37 | Hatalı mesaj / hile | 06a 10/10 (kısmi) | F2 06e–06i, 06n; node şema testleri | TR+W, ND | Faz 2 schema.js, guard.js | KISMİ |
| T38 | Tekrarlanan mesaj / ödül | — | F2 06g (aynı `x` ile iki `tx`), N-5/E-1/E-2, 06f B-10; F5 06v V2 | TR+W | Faz 2 econ.js, hostOps.js | YOK |
| T39 | Yeni kayıt | (08 ve 12 `save.write`'ı doğrudan çağırıyor) | F4 24 (F4-T1) | TR+B | main.js:166; save.js | KISMİ |
| T40 | Otomatik kayıt | — | F4 24 (F4-T2), 06p (F4-T2b) | TR+B, TR+W | game.js:217-218 | YOK |
| T41 | Manuel kayıt | 10_uzun_oturum (onaysız `saveNow`) | F4 24 (F4-T3); F9 59 Duraklat → Kaydet | TR+B | main.js:199 `saveNow`; menu.js `pause` | KISMİ |
| T42 | Yedekten kurtarma | 08 "Bozuk ana kayıt varken .bak…" | F4 24 (F4-T4) | TR+B | save.js:38-45 | GEÇTİ |
| T43 | Bozuk kayıt | 08 "Bozuk kayıt dosyası güvenle reddedilir…" | F4 24 (F4-T5); node kayit_sema | TR+B, ND | save.js; Faz 4 validate | GEÇTİ |
| T44 | Eski sürüm kaydı | 13 P08 (eski tapınak biçimi) | F4 24 (F4-T6, F4-T6b; v0.3/v0.4 fikstürleri) | TR+B, ND | Faz 4 migrate | KISMİ |
| T45 | Ada durumu | 08 B02; 12 K01 | F4 23 (F4-T7, F4-T8), 06o | TR+B, TR+W | islands.js; hazards.js; Faz 4 worldState | GEÇTİ |
| T46 | Bulmaca durumu | 13 P08 | F4 23 (F4-T9) | TR+B | islands.js:35-39, 810-816 | KISMİ |
| T47 | Envanter ve gemi | 08 E-13/A1; 14 L03; 12 K01 | F4 26 (F4-T12) | TR+B | inventory.js; ship.js | GEÇTİ |
| T48 | İçe / dışa aktarma | — | F4 25 (F4-T10); node kayit_aktarma | TR+B, ND | save.js:77-87; settingsPanel.js:73-78 | YOK |
| T49 | İlk beş aşamanın regresyonu | v03/g2b (onaysız, 0→2) | F6 27_hikaye_1_5 | TR+B | quests.js:24-31 | KISMİ (onaysız) |
| T50 | 6. aşamaya geçiş | — (quests.js:30 yer tutucu) | F6 28_bolum6_ates; node hikaye_cekirdek K19 | TR+B, ND | Faz 6 kernel | YOK |
| T51 | Yeni bölgelerin açılması | — | F6 29–32; node K13, W03 | TR+B, ND | Faz 6 | YOK |
| T52 | Görev nesnelerinin yeri | node archipelago_sabit (geçti) | F6 node hikaye_dunya W04–W06, W13–W14 | ND | archipelago.js; Faz 6 worldIds | KISMİ |
| T53 | Boss karşılaşmalarının tetiklenmesi | 13 P08 (Taş Muhafız koşulu) | F6 27 (Morvan 45/60 m), 28, 30, 32; 07a | TR+B, TR+W | quests.js:276-290; bosses.js:1088 | KISMİ |
| T54 | Son görev ve final | — | F6 32_bolum10_final, 07b; node K02, K16 | TR+B, TR+W, ND | Faz 6 | YOK |
| T55 | Kaynak modüllerin açılması | 00_acilis (modüler, 6/6) | **F9 57_site_uretim** (üretim `_site`, `/SON-HAZ-NE/`); site-denetle; canlı duman | TR, ST, CN | index.html; js/** | GEÇTİ (üretim yapıtı sınanmıyor) |
| T56 | Single HTML derlemesi | Elle derleme kayıtları (12. belge) | **F9** tek-html-denetle S1–S14; 56_tek_uretim | ST, TR | tools/build-single-html.mjs | KISMİ |
| T57 | Single HTML açılışı | 02_tek_dosya 4/4 (dist, `file://`) | F9 02_tek_dosya (test çeşidi), 56 (üretim; `file://` + http), eşdeğerlik paketi, canlı duman (https) | TR+B, CN | build-single-html.mjs | GEÇTİ (kök dosya sınanmıyor) |
| T58 | Çevrimdışı açılış | — (ağ açık); bu tasarımda bir kez ölçüldü: sağlanıyor (N9-8) | **F9 55 `--cevrimdisi`** | TR+B | build-single-html.mjs prelude | KISMİ (kalıcı test yok) |
| T59 | Gömülü asset kontrolü | Dolaylı | **F9** 55 V1–V6; tek-html-denetle S2–S4, S8 | TR, ST | build-single-html.mjs:59-72, 79-99; assets.js:49-55; audio.js:29, 246 | KISMİ |
| T60 | Worker blob kontrolü | 02_tek_dosya (`data:`, `file://`); http `blob:` yolu bu tasarımda bir kez ölçüldü: çalışıyor (N9-7) | **F9 54** TI01–TI05; canlı duman (https `blob:`); EL Firefox/Safari | TR+B, CN, EL | build-single-html.mjs:100-103; terrain.js:58-80 | KISMİ (kalıcı test yok) |
| T61 | Pages deploy kontrolü | — | **F9** `tests/yayin/yayin_duman.mjs` (`canli-duman`), 57 (yerel prova). (inceleme düzeltmesi) GEÇTİ ancak canlıya almada (Y12) olabilir; Faz 9 kapısında beklenen durum KISMİ'dir (yerel prova YD01–YD06) | CN, CI | pages.yml | YOK |
| T62 | Feature branch canlıya çıkmıyor | Yapılandırma + Actions geçmişi (N9-1) | **F9** `tests/node/yayin_politikasi.mjs` (statik); CI `yayin_denetimi`; EL ortam ayarının ekran görüntüsü | ST, CI, EL | pages.yml; ci.yml; ortam ayarı | KISMİ |

**Sayım (taban):**

| Durum | Sayı | Testler |
|---|---|---|
| GEÇTİ | 22 | |
| KISMİ | 25 | |
| ÖLÇÜM | 4 | T11–T14 |
| KALDI (bilinen) | 1 | T25 |
| YOK | 10 | T17, T23, T36, T38, T40, T48, T50, T51, T54, T61 |

Bu sayım `audit_K.json`'daki "22 karşılanıyor, 30 kısmen, 10 yok" sayımıyla aynıdır. Orada ölçümler ve T25 "kısmen" içinde sayılmıştı. Toplayıcının ilk koşusu bu sayımı makineyle yeniden üretmelidir (Y7 kabulü).

---

## 7. Teslim raporları ve son regresyon

### 7.1 Konum ve ortak şablon (K9-14)

Raporlar `docs/v05/raporlar/` altında durur. README'ye bir "Raporlar" bölümü eklenir. `docs/` Pages yapıtına girmez (§2.8).

Her rapor aynı başlıkla açılır:

```
# <RAPOR>
Sürüm 0.5.x · Commit <sha> · Dal claude/v0.5-saglamlastirma · Tarih … · Test kaydı: TEST_KAYDI.json (<koşu kimliği>)
Ortam: … — Uyarı: otomatik testlerde gerçek GPU yok (Chromium başsız + SwiftShader); FPS değerleri donanım değeri değildir.
```

**Doldurma:**
- Otomatik bölümleri `tools/rapor-uret.mjs <rapor>` doldurur. Bu bölümler `<!-- OTOMATIK:<ad> -->` … `<!-- /OTOMATIK -->` işaretleri arasında durur.
- Elle yazılan değerlendirme bölümleri işaretlerin dışındadır ve araç onlara dokunmaz.
- Kaynaklar: `TEST_KAYDI.json`, `denetim_ham/*.json`, `docs/v05/raporlar/durum.json` (sorun → durum, commit, test) ve `git log`.

### 7.2 On raporun yapısı ve doldurulma takvimi

| Rapor | Bölümler | Veri kaynağı | Dolduran fazlar |
|---|---|---|---|
| `AUDIT_CURRENT.md` | Kapsam ve yöntem (A–K alanları, `44d548c`); sistem durumu tabloları (`systems[]`); öncelik × alan sorun sayıları; kullanıcı ve belge iddialarının doğrulaması; karşıt doğrulama sonuçları (A, B, C, D, F; J ve K'nın doğrulaması yok, notla); **son denetim**: aynı sistem tablolarının v0.5 durumu | `audit_*.json`, `dogrulama_*.json` | Faz 0; Faz 9 (son denetim) |
| `KNOWN_ISSUES.md` | Açık sorunlar (kimlik, başlık, öncelik, alan, sahip faz, durum, ilgili T, muafiyet); kapanan sorunlar (FIX_REPORT'a bağlantı); test edilemeyenler (gerçek GPU, gerçek ağ, Safari) | audit JSON'ları + `durum.json` + `bilinen_sorunlar.json` | Her faz kapanışı |
| `FIX_REPORT.md` | Faz → adım → sorun kimliği: kök neden (1–3 cümle), değişiklik (dosya:fonksiyon), commit, kanıt (önce → sonra, T-no, senaryo ve kontrol), kayıt uyumluluğu notu | `durum.json` + TEST_KAYDI önce/sonra + git | Her faz adımı (adımın commit'iyle) |
| `MULTIPLAYER_SECURITY_REPORT.md` | Tehdit modeli (Faz 2 §1); B-01…B-21 ve Y/N/E bulgularında saldırı → sonuç; 06e–06n ve 06r–06z sonuçları; T21–T38; sınırlar (gerçek ağ ve TURN yok, K5-3/K5-4) | TEST_KAYDI (`cokOyunculu`) | Faz 2, Faz 5, Faz 9 |
| `PHYSICS_REPORT.md` | Sabit adım özeti; FPS tablosu (15/30/45/59,94/60/90/120/144 × ölçüm; önce = 03_fizik_dt tabanı, sonra = FD); HH, DG, OK, MI, GV, SD, YD ve GN senaryoları; kamera; T11–T20; "benzetilmiş kare süresi" uyarısı | TEST_KAYDI (`fizik`) | Faz 3, Faz 9 |
| `SAVE_PERSISTENCE_REPORT.md` | Şema (`version:3`, `minReader`); göç zinciri; v0.3 ve v0.4 fikstür sonuçları; T39–T48; **mevcut kayıtlarla uyumluluk beyanı**; geri dönüşte (v0.3) kayıt etkisi (§2.12 R1) | TEST_KAYDI (`kayit`) + `kayit_*` Node çıktıları | Faz 4, Faz 9 |
| `STORY_COMPLETION_REPORT.md` | Aşamalar 1–10 ve final: alan, NPC, bulmaca, boss, karar, ödül; Faz 6 kararları; çekirdek ve tam kapsam (Faz 6 K-13); T49–T54 | TEST_KAYDI (`hikaye`) | Faz 6, Faz 9 |
| `PERFORMANCE_REPORT.md` | Ortam uyarısı; önce/sonra: çizim çağrısı (taban liman 1 035), üçgen (1,25 M), geometri (753), benzetim ms/kare, bellek, uzun oturum; sahneler; gerçek GPU elle ölçümü (ELLE) | 09, 10, Faz 8 45–52 raporları | Faz 8, Faz 9 |
| `DEPLOYMENT_REPORT.md` | Yayın hattı (§1–§3 özeti); **Ayarlar tablosu**: her [KU] maddesi için durum, tarih, yapan ve doğrulama yolu; tek HTML (sha256, boyut, damga, 87 gömülü dosya, S1–S14); `_site` listesi ve boyutu; T55–T62; canlıya alma kaydı; geri dönüş planı ve yerel provası | `tek_denetim.json`, `site_denetim.json`, canlı duman raporu, Actions koşu kimlikleri | Faz 9 ve canlıya alma |
| `REGRESSION_REPORT.md` | §7.4'ün çıktısı: senaryo başına v0.4 ↔ v0.5; **regresyon listesi** (hedef 0); eski özellik eşlemesi; eşdeğerlik; 62 test özeti; bilinen kalanlar; kararlılık (k/N); elle kontroller; **tamamlanmamış işler**; yeni bağımlılıklar ve mimari değişiklikler; değişen dosyalar (`git diff --stat 44d548c..HEAD`) | TEST_KAYDI + taban + `esdegerlik.md` + git | Faz 9 |

**Kullanıcının "Ayrıca" maddeleri (§17):**
- değişen dosyalar → REGRESSION_REPORT;
- değişikliklerin gerekçeleri → FIX_REPORT;
- koşulan testler → TEST_KAYDI.md + REGRESSION_REPORT;
- başarısız testleri gizlememe → durum kuralları §6.5; "KALDI (bilinen)" ilk tabloda görünür;
- tamamlanmamış işler → REGRESSION_REPORT + KNOWN_ISSUES;
- yeni bağımlılıklar ve mimari → REGRESSION_REPORT + DEPLOYMENT_REPORT (`package.json`);
- mevcut kayıtlarla uyumluluk → SAVE_PERSISTENCE_REPORT.

### 7.3 Faz kapanış kapısı

Her fazın son adımı `node tools/faz-kapisi.mjs <faz>` [KO] koşar. Kapı şunları sınar:

1. Fazın katalog testleri GEÇTİ ya da gerekçeli KISMİ mi?
2. Bir önceki faz kaydına göre **yeni regresyon** var mı (§7.4-7)?
3. Fazın raporlarında otomatik bölümlerin commit'i bu koşuya eşit mi?
4. `durum.json`'da fazın sorunları kapandı mı ya da sahipleri yazıldı mı?

Çıktı "KAPI GEÇTİ" ya da "KAPI KALDI: <nedenler>" olur. Bu, master_prompt §16'daki "kabul kriterleri geçilmeden sonraki faza geçme" kuralının denetlenebilir hâlidir.

(inceleme düzeltmesi) **Araçların zamanı.** `faz-kapisi.mjs`, katalog, toplayıcı ve `rapor-uret.mjs` Y7'de, yani Faz 9'da yazılır. Faz 1–8 kapanışları bu araçları kullanamaz. Bu yüzden Faz 1–8'in kapısı şudur:
1. Fazın kendi tasarımındaki kabul listesi.
2. Taban listesinin yeni koşucuyla yeniden koşusu: tabanda geçen 23 koşu ve 246 kontrol geçer.
3. Bütün ham `dk-test-raporu/2` raporlarının `docs/v05/kosular/faz<N>/` altına commit'lenmesi.
4. `docs/v05/raporlar/durum.json` ve FIX_REPORT girdilerinin elle güncellenmesi. İskelet Y1 commit'iyle açılır.

Y7, `faz-kapisi.mjs`'i Faz 1–8 arşivleri üzerinde geriye dönük koşar ve TEST_KAYDI'nı bu arşivlerden üretir. PERFORMANCE_REPORT'un otomatik bölümünü Faz 8'in `tools/perf_rapor.mjs`'i üretir (`faz8_tasarim.md` P0.3). `rapor-uret.mjs` o bölümü yeniden üretmez, yalnız ortak başlığı ve T özetini yazar.

### 7.4 Son regresyon planı (Faz 9)

1. **Aday:** v0.5'in ucu dondurulur. CI `[tam]` koşar (PR açılmadıysa boş commit ile).
2. **Koşucu uyumunun kanıtı:** Taban listesi (25 koşu: 20 tek sayfa + 5 co-op) **yeni** koşucuyla **v0.4'e** (8080) karşı koşulur. Sonuç ((inceleme düzeltmesi)): tabanda geçen 23 koşu ve 246 kontrol yine geçer; 09_performans dG ve 06c katılma kontrollerinin sonucu kaydedilir (kararsızdırlar, §5.7-3). Böylece "önce" verisi yeni şemada yeniden üretilmiş olur ve yeni koşucunun eski sonuçları değiştirmediği kanıtlanır.
3. **Tam v0.5 koşusu (modüler):**
   - bütün tek sayfa senaryoları (`00`–`60`, `02_*` kipleri);
   - co-op (`06a`–`06z`, `07a`/`07b`, `08a`–`08f`);
   - bütün Node testleri.
4. **Eşdeğerlik:** §4.4 (a), (b) ve (c).
5. **Yayın yapıtı provası:** `_site` → 56 ve 57 (`/SON-HAZ-NE/` alt yolunda); `yayin_duman.mjs --yerel http://127.0.0.1:<p>/SON-HAZ-NE/`.
6. **Kararlılık:** İlk koşuda kalanlar ve v0.4'te kararsız olanlar `--tekrar 3` ile yeniden koşulur. 06c ve 06z `--repeat 10` ile **bir kez** koşulur. Sonuç k/N olarak yazılır. Tekrarda geçen bir kontrol "KARARSIZ" diye kaydedilir; **GEÇTİ sayılmaz**.
7. **Regresyon karşılaştırması** (`tools/test-kaydi.mjs --regresyon`). Taban 252 kontrol içerir (tek sayfa 205, co-op 47); 246'sı geçmişti. Her taban kontrolü şu sınıflardan birine girer:
   - **korundu**: v0.4 ✔ → v0.5 ✔;
   - **REGRESYON**: v0.4 ✔ → v0.5 ✘. Hedef **0**. Her biri ya düzeltilir ya da gerekçesiyle kullanıcıya açıkça raporlanır.
   - **düzeldi**: v0.4 ✘ → v0.5 ✔;
   - **DEĞİŞTİ**: beklenti gerekçeli olarak değiştirildi. Liste yalnız faz tasarımlarındaki maddelerden oluşur: Faz 3 §10.6, Faz 4 §10.5, Faz 5 §9.5, Faz 6 §8.5. Örnekler: 06a H07'nin ters çevrilmesi, 08 `r.version===1` → `>=1`.

   **"Eski kontrolü silme, yenisini ekle"** kuralı geçerlidir (`faz1_brief.md`). Silinmiş taban kontrolü "KAYIP" diye işaretlenir ve kapıyı kaldırır.
8. **Eski özellik eşlemesi:** `tests/kabul/eski_ozellikler.mjs` README v0.3 özellik maddelerini ((inceleme düzeltmesi) README.md:27-128: "Kontroller", "Dalış, balıkçılık ve deniz ekipmanı", "Avcılık ve toplama", "0.3/0.2 sürümünde yenilikler" ve "Bu sürümde neler var" bölümleri) kontrol kalıplarına bağlar. Örnekler: dünya, karakter, gemi, canlılar, balıkçılık, hazine, ekonomi, savaş, hikâye, online, kayıt, hava, zaman çizelgesi, harita, dürbün, zar. Hiçbir kontrolle karşılanmayan madde "KAPSANMAYAN ÖZELLİK" listesine girer; ya ELLE kaydı ya da yeni bir test ister. (inceleme düzeltmesi) Kullanıcının "yeni sürüm yayınlandığında çalışan eski sistemler kaybolmamalı" isteğindeki eski sürüm **canlı v0.3'tür**; v0.4 hiç yayınlanmadı. Bu yüzden eşlemenin kontrolleri yerelde v0.3'e (8083) karşı da koşulur ve REGRESSION_REPORT'a bir "canlı (v0.3) → v0.5" sütunu girer. v0.3'te koşamayan kontrol (test API'si yok) "uygulanamaz" yazılır ve elle denetim listesine (E1) alınır.
9. **Elle kontroller:** §7.5.
10. **Kapı (canlıya almaya hazır):**
    - Regresyon 0 (ya da kullanıcıya açıkça bildirilmiş ve KNOWN_ISSUES'ta olanlar);
    - 62 testin hiçbiri v0.4 durumundan kötü değil;
    - eşdeğerlikte FARK 0;
    - S1–S14 ve `_site` denetimi geçti;
    - DEPLOYMENT_REPORT'taki Ayarlar tablosu dolu;
    - REGRESSION_REPORT yazılmış.

### 7.5 Elle doğrulama listesi (ELLE, `tests/kabul/elle/Txx.json`)

| No | Ne | Testler | Neden otomatik değil |
|---|---|---|---|
| E1 | Gerçek GPU'lu masaüstü (Chrome): 30 dk oyun, kare hızı göstergesi, kamera, gemi hissi, ekran kararması yok ; (inceleme düzeltmesi) Faz 7'nin animasyon akışı göz kontrol listesi (Faz 7 nihai tasarımı: "Faz 9 elle tur") | T16, T17, T30, T31, PERFORMANCE | Ortamda GPU yok |
| E2 | Gerçek internet üzerinden 2 ve 4 oyunculu oturum, farklı ağlardan (PeerJS bulutu; TURN "garantisiz", K5-4) | T24–T27, T34–T36 | Konteynerde gerçek ağ ve TURN yok |
| E3 | Firefox ve Safari: tek HTML (`file://` ve Pages) ve modüler site | T57, T60 | Playwright Firefox/WebKit ancak gecelik işte ve gözlem amaçlı |
| E4 | Ayar ekran görüntüleri: Pages kaynağı, ortam dal politikası ve onaylayıcı | T62, K-05 | API 403 (vekil). (inceleme düzeltmesi) Ruleset bu listeden çıktı: `rules/branches/<yayın dalı>` API ile okunabiliyor (N9-14). |

Form alanları: `{test, tarih, kisi, cihaz: {isletim, tarayici, gpu, ekranHz}, adimlar[], sonuc, notlar, goruntuler[]}`.

---

## 8. Dosya bazında değişiklik ve uygulama sırası

### 8.1 Dosyalar

**Yeni dosyalar:**

| Dosya | Sorumluluk | Ana öğeler | ~Satır | Adım |
|---|---|---|---|---|
| `.github/workflows/ci.yml` | CI | `statik`, `duman`, `tek`, `coop2` (2 parça), `tam`, `kapi`, `kayit` ((inceleme düzeltmesi) `yayin_denetimi` ayrı dosyada) | 170 | Y8 |
| `.github/workflows/geri-donus.yml` | Acil geri dönüş | `derle`, `yayinla` | 45 | Y9 |
| `.github/betikler/pr_denetimi.sh` | PR ilişkisi denetimi (§2.4) | — | 15 | Y9 |
| `package.json`, `package-lock.json` | Sürüm sabitleme ve betikler (§3.4) | — | 30 + kilit | Y2 |
| `js/core/testmode.js` | Test kipi | `TEST`, `testParam` | 20 | Y3 |
| `js/core/surum.js` | Sürüm ve damga | `SURUM = '0.5.0'`, `derleme()` (meta okur) | 10 | Y3 ((inceleme düzeltmesi) `__dkDurum` Y3'te bunu içe aktarıyor) |
| `js/test/kancalar.js` | Test kancaları | `install`, `MARK`, `DK.mod` kaydı, `__sayac` | 90 | Y3 |
| `tools/site-hazirla.mjs` | `_site` (§2.8) | `hazirla`, `saplama`, `damgala`, `surumJson` | 120 | Y6 |
| `tools/site-denetle.mjs` | `_site` denetimi | `izinListesi`, `iceAktarmaGrafi`, `boyut` | 140 | Y6 |
| `tools/tek-html-denetle.mjs` | S1–S14 (§4.3) | — | 180 | Y4 |
| `tools/esdegerlik.mjs` | §4.4 karşılaştırması | — | 90 | Y7 |
| `tools/test-kaydi.mjs` | Toplayıcı (§6.7) | `topla`, `durum`, `onceSonra`, `regresyon`, `md` | 300 | Y7 |
| `tools/rapor-uret.mjs` | Raporların otomatik bölümleri | — | 200 | Y7 |
| `tools/faz-kapisi.mjs` | Faz kapısı (§7.3) | — | 80 | Y7 |
| `tests/kos.mjs` | Paket koşucusu (§3.6) | `paket`, `sunucular`, `parca`, `taban`, `kilit`, klasör kopyaları (55-V5) | 250 | Y2 |
| `tests/sunucu.cjs` | Bağımlılıksız statik sunucu (`--kok`, `--port`, `--onek`, `Cache-Control: no-store`, MIME tablosu) | — | 70 | Y2 |
| `tests/kabul/kullanici_testleri.mjs` | 62 test kataloğu (§6.4, §6.8) | — | 450 | Y7 |
| `tests/kabul/suitler.mjs` | Paket tanımları (§9.2) | — | 120 | Y2 |
| `tests/kabul/bilinen_sorunlar.json` | Muafiyetler (§6.5) | — | — | Y7 |
| `tests/kabul/eski_ozellikler.mjs` | README özellik eşlemesi (§7.4-8) | — | 120 | Y11 |
| `tests/kabul/elle/` | Elle kayıt formları (§7.5) | — | — | Y11 |
| `tests/scenarios/53_test_kipi.js` … `60_dunya_degisimi.js` | Faz 9 senaryoları (§9.1) | — | 8 × 40–120 | Y3–Y7 |
| `tests/yayin/yayin_duman.mjs` | Canlı duman testi (T61) | `--url`, `--sha`, `--tek-sha256`, `--profil`, `--yerel` | 200 | Y9 |
| `tests/node/yayin_politikasi.mjs` | T62, statik ve `--canli` | — | 180 | Y8 |
| `tests/node/test_kipi.mjs` | Test kipi kuralları, doğruluk tablosu, API eşliği (§5.3, §5.7) | — | 120 | Y3 |
| `tests/node/katalog.mjs` | Katalog bütünlüğü (§6.4) | — | 80 | Y7 |
| `tests/node/tek_html_anahtar.mjs` | `key()` birim testi (Ek A.5 durumları) | — | 60 | Y4 |
| `tests/node/kosucu_negatif.mjs` + `tests/fixtures/kosucu/*.html` | Koşucu negatif testleri (§6.3) | — | 120 | Y1 |
| `tests/fixtures/tek/iframe.html` | Köken `null` iframe (54) | — | 10 | Y4 |
| `tests/fixtures/yayin/pulls_*.json` | PR süzgeci örnekleri | — | — | Y9 |
| `.github/workflows/yayin-denetimi.yml` (inceleme düzeltmesi) | `yayin_denetimi` (YP10 depo geneli), `yayin_onkosul` | — | 40 | Y8 |
| `.github/workflows/dayaniklilik.yml` (inceleme düzeltmesi) | Haftalık uzun ve tekrarlı koşular (K9-21) | — | 30 | Y8 |
| `tests/node/belge_tutarlilik.mjs` (inceleme düzeltmesi: Y10 kabulünde vardı, listede yoktu) | README ve tests/README sürüm ve komut tutarlılığı | — | 60 | Y10 |
| `tests/kabul/sureler.json` (inceleme düzeltmesi) | Parçalama için senaryo süreleri | — | — | Y2 |
| `tests/kabul/etiket_esleme.json` (inceleme düzeltmesi) | Etiketi değişen taban kontrollerinin eşlemesi (§6.3) | — | — | Y7 |
| `docs/v05/kosular/faz<N>/` (inceleme düzeltmesi) | Faz 1–8 ham rapor arşivi (§7.3) | — | — | Faz 1'den başlayarak |
| `docs/v05/raporlar/*.md` (10) + `durum.json` | Raporlar (§7) | — | — | Y7, her faz |

**Değişen dosyalar:**

| Dosya | Fonksiyon / satır | Değişiklik | Adım |
|---|---|---|---|
| `.github/workflows/pages.yml` | Tümü | §2.10 (yeniden yazım) | Y9 |
| `js/main.js` | Modül başı; `boot()` 132-153 | `TEST`, `KATI`, `SURUM`; test kipi bloğu; `__dkDurum` (§5.4) | Y3 ((inceleme düzeltmesi) `__dkDurum` ve `SURUM` Y3'te) |
| `js/net/net.js` | `peerOpts()` 49-55; yeni `sinyalSunucusu()` | `testParam`; (inceleme düzeltmesi) `peerhost` yalnız geri döngü (K9-20) | Y3 |
| `js/world/terrain.js` | `init()` 248-249 | `TEST` + `testParam` | Y3 |
| `js/ui/menu.js` | 109 ve 112 (sürüm dizgeleri); `lobby()` 266, 273; duraklatma 353; `credits()` 319-331 | `SURUM`; `davetBaglantisi` (K-10); lisans düğmesi (K-19) | Y5 |
| `index.html` | `<head>` | `<meta name="dk-build" content="gelistirme">`, `<meta name="dk-version" content="0.5.0">` | Y5 |
| `tools/build-single-html.mjs` | `bundle()`, eklenti, prelude, `main()`, montaj | §4.2 | Y4 |
| `tests/harness/run.cjs` | 26, 36, 38-44, 59, 65-96 | §6.3 | Y1 |
| `tests/harness/coop.cjs` | 20, 27-41, 53-61 | §6.3 | Y1 |
| `tests/scenarios/02_tek_dosya.js` | 1-2, 4-10 | Başlık (taze test derlemesi). Eski 4 kontrol korunur; eklenenler: `DK.assets.missing.length===0`, damga = beklenen, `__dkDurum().kati===true` | Y4 |
| `tests/scenarios/03_fizik_dt.js` | Baş | `{meta:{olcum:true}}`. Faz 3 beklentili sürümü yazınca kalkar. | Y1 |
| `tests/scenarios/02_arazi_yedek.js` | — | Değişmez. Kipe özgü izinler (`badurl`: `terrainWorker\.missing\.js`; `crash`: işçi çökme iletisi) `tests/kabul/suitler.mjs`'te `--izin-hata` olarak verilir. | Y1 |
| `07_ekonomi.js`, `14_deniz_ekipmani.js`, `15_iskele_kamera.js`, `16_kosu_poz_ganimet.js`, `17_kamera_kararma.js`, `coop/06d_ganimet_canta.cjs` | `import(…)` satırları (§4.4 listesi) | `DK.mod(…)` | Y3 |
| `tests/README.md` | 7-36 | npm betikleri, test kipi, taze tek HTML komutu (K-14), katalog ve kayıt | Y10 |
| `README.md` | 8, 13-18, 101-132, 153 | Sürüm, Pages ve indirme bağlantıları, raporlar, "dost ateşi" satırı (K-17) | Y10 |
| `TEST_RAPORU.md` | Baş | "v0.3 tarihsel raporu; güncel kayıt: docs/v05/raporlar" notu | Y10 |
| `docs/11_ONLINE_TEST_RAPORU.md`, `docs/13_BILINEN_HATALAR.md` | 4, 19, 30; 9 | "v0.4'te giderildi" notları + v05 raporlarına bağlantı | Y10 |
| `.gitignore` | — | `_site/` | Y6 |
| `tests/scenarios/kamera_tarama/*.js` (inceleme düzeltmesi) | Baş | `{meta:{olcum:true}}` (K-13) | Y1 |
| `README.md` (inceleme düzeltmesi) | 19-23 ("Yerel") | Oyuncular için canlı adres ve tek HTML; yerel sunucu geliştirme içindir (K9-20) | Y10 |
| `.github/workflows/pages.yml` (inceleme düzeltmesi, Y9a) | `deploy` 33-36; `concurrency` 16-18 | Faz 1 başında: `if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'` ve `cancel-in-progress: false`. Tam yeniden yazım Y9'da. | Y9a |

**Silinen dosya:** `DenizKorsanlari-SonHazine.html` (kök). Gerekçe §4.8'de (K-01, A-01). Adım Y10.

### 8.2 Uygulama sırası

Her adım ayrı bir commit (ya da PR) olur. Bir adımın kabulü geçmeden sonrakine geçilmez. Her adımda taban listesi yeşil kalmalıdır ((inceleme düzeltmesi) tabanda geçen 23 koşu ve 246 kontrol geçer; 09 ve 06c'nin sonucu kaydedilir, §5.7-3).

**K9-16: öne çekme.** (inceleme düzeltmesi) **Y1, Y3, Y9a ve Y0'ın bunlara ait araçları Faz 1'in ilk adımları olarak** yapılır. Y2 bağımlılığı kaldırıldı: Y3 `package.json` gerektirmiyor. `faz1_brief.md` güncellenmeden Faz 1 başlamaz. Brief bugün Y1–Y3'ü içermiyor ve K-08'i Faz 9'a bırakıyor. Gerekçeler:
- Faz 2, 5 ve 6 `?test=1`'e dayanıyor;
- hata yutan ve onaysız geçen koşucuyla alınan faz sonuçları güvenilir değil;
- K-08 bir güvenlik açığı.

Kalan adımlar Faz 9'dadır. (inceleme düzeltmesi) Faz 1–8'in kapısı §7.3'teki araçsız kapıdır.

**Y0 — Kırmızı taban (½ gün).** Önce denetim araçları yazılır ve bugünkü duruma karşı koşulur. Sonuçlar `tests/out/faz9_taban.json`'a "önce" olarak yazılır. Beklenen kırmızılar:

| Araç | Beklenen kırmızı |
|---|---|
| `kosucu_negatif.mjs` | Bugünkü koşucu (a), (b), (c), (f) durumlarını yanlışlıkla geçirir |
| `tek-html-denetle` (bugünkü dist) | S1 damga ✘, S7 katı kip ✘, S8 lisans ✘, S9 kanca var ✘ |
| `yayin_politikasi.mjs` | Ref koşulu ✘, `path: .` ✘, `main`/`master` ✘, `cancel-in-progress` ✘ |
| `test_kipi.mjs` | ✘ |

*Kabul:* Her madde belirtilen nedenle kalır. Bu, testlerin sorunu gerçekten yakaladığını kanıtlar. (inceleme düzeltmesi) Y0'ın `kosucu_negatif` ve `test_kipi` kısımları Faz 1 başında (K9-16), `tek-html-denetle` ve `yayin_politikasi` kısımları Faz 9 başında koşar.

**Y1 — Koşucu sıkılaştırma ve rapor şeması 2 (1 gün; Faz 1 başında).** §6.3.
*Kabul:*
- Negatif testler beklenen sonucu verir.
- (inceleme düzeltmesi) Taban listesi (25) yeni koşucuyla **v0.4'e** (8080) karşı koşulur. Tabanda geçen 23 koşu ve 246 kontrol geçer; 09 ve 06c'nin sonucu kaydedilir. 02_arazi_yedek'in noworker, badurl ve crash kipleri yeni koşucuyla da koşulur; "önce" kaydı Faz 1'in "önce" ölçümüdür (`00_BASLANGIC_KAYDI.md` §4). badurl yalnız gerekçeli izinle geçer (3 × 404 + 3 × `requestfailed`, Ek B.1).
- 06a, 06a2 ve 06c'de `EVALERR` 0 ve `kapaliAtlama > 0`.
- `chest.glb` silinmiş kopyada 02_tek_dosya KALDI.

**Y2 — `package.json`, kilit, `tests/kos.mjs`, `tests/sunucu.cjs`, paket tanımları (1 gün).**
*Kabul:*
- `npm ci` sonrasında aracın v0.4 sürümüyle v0.4 ağacı sha256 `75587dd9…` verir.
- `npm run test:duman` yerelde (kilitle) tabandaki karşılıklarıyla aynı sonucu verir.
- `--parca 1/4 … 4/4` listelerinin birleşimi tam listeye eşittir (Node testi).

**Y3 — Test kipi (1 gün; Faz 1 başında).** `testmode.js`, `kancalar.js`, `main.js`, `net.js`, `terrain.js`; (inceleme düzeltmesi) `surum.js` ve `__dkDurum`. 53'ün TK02–TK05'i `__dkDurum`'u okuyor; taslakta bu ikisi Y5'teydi ve Y3'ün `main.js` kodu henüz var olmayan `surum.js`'i içe aktarıyordu. Ayrıca altı dosyada `DK.mod` dönüşümü, `test_kipi.mjs` ve 53_test_kipi.
*Kabul:* §5.7'nin beş maddesi; 53 TK01–TK06 ve TK08. (inceleme düzeltmesi) TK07 `davetBaglantisi`'ni sınar; o Y5'te geldiği için Y5'in kabulüne taşındı.

**Y4 — Derleme aracı (1,5 gün).** (inceleme düzeltmesi) Y5'ten sonra yapılır. §4.2 (A-16 prelude'u hariç; o Faz 1'in), tek-html-denetle, `key()` birim testi, 02_tek_dosya'nın yeni kontrolleri, 54, 55 (çevrimdışı dahil), 56'nın ilk sürümü.
*Kabul:*
- S1–S14, üretim ve test çeşidinde.
- 02_tek_dosya test çeşidiyle `assets/`, `game-assets/` ve yüzde kodlu klasörde geçer.
- 54 TI01–TI05; 55 TV01–TV08.
- K-16 sentetik denemesi derlemeyi düşürür.
- Belirlenimcilik.
- Faz 2 CSP adımı henüz yoksa S13 "uygulanmadı" diye kaydedilir; bu adımı engellemez.
- (inceleme düzeltmesi) 56 TU01–TU07: üretim tek HTML'i bu adımda üretilir; taslakta bu kontroller Y5'in kabulündeydi.

**Y5 — Oyun içi yayın parçaları (½ gün).** (inceleme düzeltmesi) Y4'ten önce yapılır. `index.html` meta'ları; `menu.js` (sürüm dizgeleri, K-10 `davetBaglantisi`, K-19 lisans düğmesi). `surum.js` ve `__dkDurum` Y3'e taşındı.
*Kabul (inceleme düzeltmesi):* 53 TK07 (http'de davet bağlantısı değişmemiş); `tests/node/test_kipi.mjs`'e eklenen `davetBaglantisi` doğruluk tablosu (`file:`, köken `null` ve `__DK_SINGLE_FILE` → Pages adresi; http → `location` tabanlı); `index.html`'de iki meta var ve `SURUM`'la eşit. `file:`'daki davet (TV08) Y4'te, lisans paneli (59 AM08) Y7'de sınanır.

**Y6 — `_site` (½ gün).** `site-hazirla`, `site-denetle`, `.gitignore`, 57.
*Kabul:*
- İzin listesi geçer; içe aktarma grafı eksiksiz.
- 57 SU01–SU06 `/SON-HAZ-NE/` alt yolunda geçer.

**Y7 — Test kayıt sistemi (1,5 gün).** Katalog, toplayıcı, `esdegerlik`, `rapor-uret`, `faz-kapisi`; 58, 59, 60; on raporun iskeleti ve `durum.json`.
*Kabul:*
- Tek bir koşudan 62 satırlık TEST_KAYDI üretilir.
- Her satırda 8 alan ya dolu ya da yokluk nedeni yazılı.
- Taban sayımı (22 / 25 / 4 / 1 / 10) yeniden üretilir.
- `katalog.mjs` geçer. Faz 3 ad çakışması çözülmemişse kalır; K9-17 bunu bilinçli olarak kapı yapar.
- 58 iki hedefte aynı özeti verir.

**Y8 — `ci.yml` ve `yayin_politikasi.mjs` (1 gün).**
*Kabul:*
- v0.5'e push sonrasında CI koşar; statik, duman ve tek yeşil.
- (inceleme düzeltmesi) `yayin-denetimi.yml`'deki `yayin_denetimi`, YP10'u depo geneli geçer: son 30 günde yayın dalı dışında "GitHub Pages" koşusu ve `github-pages` dağıtımı 0. Bugün 16 koşunun ve 6 dağıtımın hepsi canlı dalda. `pages.yml`'den çağrılan `ci.yml` YP11'i geçer: hiçbir iş `contents: read`'den fazlasını istemez. Bir işi kasıtlı olarak kırmızı yapan bir deneme commit'inde (yayın dalı dışında) `kapi` kırmızı olur.
- `[tam]` commit'i coop2 ve tam işlerini koşturur; kayıt yapıtı üretilir.

**Y9 — `pages.yml`, `geri-donus.yml`, `yayin_duman.mjs` (1 gün).**
*Kabul:*
- YP01–YP09.
- `yayin_duman.mjs --yerel` `_site` provasında YD01–YD06'yı geçer.
- (inceleme düzeltmesi) Geri dönüş provası: `geri-donus.yml`'nin `derle` adımları 762f1c7 ve 44d548c ağaçlarına karşı yerelde koşar. İki `_site` üretilir ve `kos.mjs yerel-yayin --profil geri-donus` ikisinde de geçer.
- (inceleme düzeltmesi) YP11, YP12 ve YP13 geçer.
- v0.5'e push yayın tetiklemez (YP10).
- Gerçek yayın ancak Y12'de sınanır.

**Y10 — Belgeler ve kök dosya (½ gün).** README, tests/README, docs notları, TEST_RAPORU başlığı, `git rm` kök tek HTML.
*Kabul:*
- `tests/node/belge_tutarlilik.mjs`: README'deki sürüm = `SURUM`; tests/README'deki komut çalışıyor; kökte tek HTML yok.
- 02_tek_dosya taze derlemeyle geçer.

**Y11 — Son regresyon (2–3 gün; çoğu makine süresi).** §7.4.
*Kabul:* §7.4-10 kapısı.

**Y12 — Canlıya alma (yalnız kullanıcı komutuyla).** §2.12.
*Kabul:*
- T61 GEÇTİ (YD01–YD09).
- Dinamik koşu 0, dağıtım 1, damga = sha.
- DEPLOYMENT_REPORT'ta canlıya alma kaydı var.

**Bağımlılıklar (inceleme düzeltmesi):** Y1 → Y3 ve Y9a (Faz 1 başında). Y2 bağımsızdır (Faz 9 başında). Y5 ← Y3. Y4 ← Y3, Y5. Y6 ← Y3. Y7 ← Y1, Y4 (58 tek HTML ister). Y8 ← Y2, Y4, Y6. Y9 ← Y8. Y11 ← bütün fazlar. Y12 ← Y11 + kullanıcı komutu.

**Diğer fazlarla uyum:**

| Faz | Uyum noktası |
|---|---|
| Faz 1 | A-04 (`index.html`'e eklenecek klasik satır içi betik) Faz 2'nin CSP özet adımına girer. Yeni `?terrain` kipleri `testParam`'dan okunur. Koşucuya eklenecek başlatma betiği desteği §6.3-7'ye uyar. (inceleme düzeltmesi) A-16 (prelude) Faz 1'indir, Faz 9 onu yinelemez. A-17 badurl düzeltmesi eşdeğerlik paketini etkiler (§4.4). `faz1_brief.md`'ye Y1, Y3 ve Y9a eklenir; "K-08 Faz 9'da" notu kalkar (K9-16). |
| Faz 2 | `?test=1`; `netTest.js` dinamik ve saplanır; `tests/index.test.html`; derleme aracında CSP özetleri (S13) (inceleme düzeltmesi) `netTest.js`'i derleme dışı bırakma işi `uretimSaplama` eklentisinin ilk sürümüdür (tek mekanizma); `netTest` dışarıya yalnız `install` verir. Doğru şifreyle katılım 06j'ye eklenir (T23). CSP yerel sinyal sunucusunu `index.html`'de engellediği için 59 AM09 ve 60 DD05 test girişinde koşar. |
| Faz 3 | `DK.sim` `kancalar.js`'e taşınır ve Faz 3 onu orada değiştirir; `DK.frames`/`onStep`; `?dongu` → `testParam`; ad çakışması (K9-17) (inceleme düzeltmesi) Faz 3 §4.3'teki kancalar (`DK.frames`, `DK.simSteps`, `DK.sim` parçalaması) `main.js`'te değil `js/test/kancalar.js`'te yazılır; `__sayac` `frames` ve `simSteps`'i de sayar. `22e_gemi_dalga` (GD01–GD03) Faz 3'e eklenir. Faz 3'ün YP01 ve YD01 kodları bu belgeninkilerle çakışır; raporlar kodu senaryo adıyla yazar. |
| Faz 4 | `reload`/`initStorage`/`storageFault` adımları; v0.3/v0.4 fikstür üretimi yeni koşucuyla çalışır; `_failStart` `TEST` ile korunur |
| Faz 5 | `--log warn` varsayılan olur; `netShape` ve `?turn*` test kipinde; `--repeat` (inceleme düzeltmesi) F5-0'ın "harness uyarılarını rapora yaz" kısmı Y1 ile zaten gelir; F5-0 yalnız `net.diag` dökümünü ekler. `netShape` dışarıya yalnız `install(api)` verir; `shape`, `stall`, `cut`, `busy` ve `hide` `DK.netTest`'e bağlanır, `net.js` onu statik içe aktarmaz (§4.2). |
| Faz 6 | `DK.story` `kancalar.js` üzerinden; 27–36; STORY raporu |
| Faz 7, Faz 8 | 37–52 aralıkları; PERFORMANCE raporu (inceleme düzeltmesi) Faz 7'nin adları nihai tasarımından, Faz 8'inkiler taslaktan §6.8'e işlendi. Faz 7'nin F7-0 gözlem kipi (37–44, Faz 6 S6'dan önce) bu belgenin koşucusunu kullanır; araç gerektiren kontrollerin "uygulanamaz" durumu toplayıcıda tanınır (§6.6). Faz 8'in `tools/perf_rapor.mjs`'i PERFORMANCE_REPORT'un otomatik bölümünü üretir; `rapor-uret.mjs` o bölüme dokunmaz. 52_uzun_oturum_gercek ve 08f haftalık işe gider (K9-21). |

---

## 9. Test planı

### 9.1 Faz 9 senaryoları (53–60; KARARLAR.md ayırması)

**53_test_kipi.js** — tür: tarayıcı; hedef: modüler (yerel); adımlar `goto` ve `rotaKok`:

| Kontrol | Açılış | Beklenen |
|---|---|---|
| TK01 | `?test=1` (koşucu ekler) | `typeof DK==='object'`; 49 alan + 5 yardımcı + `mod`/`audio`/`__sayac`; `__dkDurum().test===true` |
| TK02 | `goto index.html` (`testParam:false`) | `typeof DK==='undefined'`, `__ready`, `__dkDurum().test===false`, menü görünür |
| TK03 | `goto index.html?terrain=crash&peerhost=10.9.9.9&peerport=1` (test yok) | `araziKip===''`, `isci ≥ 1`, `sinyal==='varsayilan'` (K-08) |
| TK04 | `goto index.html?test=1&terrain=noworker&peerhost=127.0.0.1&peerport=9000` | `araziKip==='noworker'`, `yedek===true`, `sinyal==='127.0.0.1:9000'` |
| TK05 | `rotaKok: https://oyun.ornek` + `goto https://oyun.ornek/index.html?test=1&peerhost=10.9.9.9&terrain=crash`. (inceleme düzeltmesi) Köken https'tir: github.io gibi güvenli bağlamdır; Faz 2 ve 4'ün `crypto.subtle`, `crypto.randomUUID` ve Web Locks kullanımı http'de bulunmazdı. Ölçüm (Ek B.3): yönlendirme gezinmeyi ve işçi betiğini yakalıyor. v0.4 bu kökende `?terrain=crash`'i uyguluyor; yani kontrol bugün kalır, düzeltmeden sonra geçer. | `DK` yok, `test===false`, `araziKip===''`, `sinyal==='varsayilan'`. **Gerçek** `testmode.js` ile yerel olmayan köken: bağlantı saldırısının kapandığının kanıtı. |
| TK06 | (inceleme düzeltmesi) TK01'in açılışında, test kipsiz `goto`'lardan önce | `DK.mod('economy/shop').MERCHANTS === (await import('./js/economy/shop.js')).MERCHANTS` (aynı örnek) |
| TK07 | http'de `DK.mod('ui/menu').davetBaglantisi('ABCDEF')` | `location.origin + location.pathname + '?join=ABCDEF'` (K-10, http'de değişmez) (inceleme düzeltmesi) Y5'te eklenir; TK01'in açılışında koşar. |
| TK08 (inceleme düzeltmesi) | `goto index.html?test=1&peerhost=10.9.9.9&peerport=1`, sonra `goto index.html?test=1&peerhost=127.0.0.1&peerport=9000` | İlkinde `sinyal==='varsayilan'` (geri döngü dışı adres yok sayılır, K9-20), ikincisinde `'127.0.0.1:9000'` |

**54_tek_isci.js** (TI01–TI05): §4.5.

**55_tek_varlik.js** (TV01–TV08; çevrimdışı koşu TV07; inceleme düzeltmesi: başlık TV08'i de kapsar):
- §4.6'daki V1–V6 ve çevrimdışı koşu.
- **TV08:** `file:`'da `DK.mod('ui/menu').davetBaglantisi('ABCDEF')` → `https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/?join=ABCDEF` (K-10).

**56_tek_uretim.js** — `--uretim`; üretim tek HTML'i hem `file://` hem http ile açılır:

| Kontrol | Beklenen |
|---|---|
| TU01 | `__ready`; `typeof DK==='undefined'` (U00); `window.__DK_TEST_KIPI` tanımsız |
| TU02 | `?test=1&terrain=crash&peerhost=10.9.9.9` ile de TU01 aynı (saplama; `file:` yerel olsa bile) |
| TU03 | `__dkDurum()`: `tekDosya`, `kati`, `isci ≥ 1`, `!yedek`, `eksikVarlik===0`, `kk` |
| TU04 | `meta[name=dk-build]` = beklenen damga; `dk-version` = `SURUM` |
| TU05 | `#dk-lisanslar` 6 bölüm. Krediler → "Lisans metinleri" panelinde "MIT" ve "SIL Open Font License" geçiyor (tıklamayla) |
| TU06 | Açılışta `/assets/` isteği 0; dış ağ isteği 0 |
| TU07 | http'de (`/dist/…`) `blob:` işçisi: `isci ≥ 1` |

**57_site_uretim.js** — `--uretim`; `_site`, `tests/sunucu.cjs --onek /SON-HAZ-NE/` ile sunulur:

| Kontrol | Beklenen |
|---|---|
| SU01 | `__ready`, menü görünür, `typeof DK==='undefined'` |
| SU02 | `goto ?test=1&peerhost=10.9.9.9&terrain=crash` → SU01 aynı; `araziKip===''`; `sinyal==='varsayilan'` |
| SU03 | Ağ günlüğü: `js/test/`, `netTest`, `netShape`, `docs/`, `tests/` isteği 0; 4xx 0 |
| SU04 | `__dkDurum()`: `isci ≥ 1`, `eksikVarlik===0`, `kati`, `derleme` = sha |
| SU05 | `fetch('DenizKorsanlari-SonHazine.html')` 200 ve bayt = özet; `surum.json` alanları doğru; `tests/README.md`, `docs/`, `tools/build-single-html.mjs` → 404 (bu üç 404 yalnız bu adımda izinli) |
| SU06 | Tıklamayla Yeni Macera (YENİ MACERA → yuva → oluştur) → HUD görünür. Gerçek arayüz yolu, `DK` olmadan. |

**58_ozellik_izi.js** (OI01–OI03): §4.4 (b). İki hedefte koşar; karşılaştırmayı `tools/esdegerlik.mjs` yapar.

**59_ana_menu.js** — T06, T07, T08, T21 (arayüz), T41; tür: tarayıcı (tıklama, rAF); `DK` yalnız durum okumak için:

| Kontrol | Beklenen |
|---|---|
| AM01 | 8 düğme + Online alt satırında 3 çip |
| AM02 | YENİ MACERA (`menu.js:95` → `slotScreen('solo', true)`, :128) → boş yuva → oluşturucunun onay düğmesi (`creator.js:139`, `.btn.gold`) → `playing`; `save.list('solo')`'da yuva dolu. Düğme metniyle değil seçiciyle tıklanır; metin çağırana göre değişiyor. |
| AM03 | Esc → Duraklatıldı → Kaydet → "Oyun kaydedildi." ve `savedAt` arttı → Ana menüye dön → onay → menü |
| AM04 | DÜNYALAR → kayıtlı yuva → `playing`; konum kayıtla aynı (≤ 1 m) |
| AM05 | KORSANIM aç/kapat, `ui.stack` boş |
| AM06 | KORSAN DEFTERİ aç/kapat |
| AM07 | AYARLAR: bir ayar değişir, `localStorage`'da kalır, geri alınır |
| AM08 | KREDİLER → "Lisans metinleri" |
| AM09 | ONLINE → Oda kur. Yerel sinyal sunucusu ayaktaysa oda kurulur, lobide oda kodu görünür ve davet bağlantısı `location` tabanlıdır. (inceleme düzeltmesi) `kos.mjs` sinyal sunucusunu bu senaryo için başlatır (`meta.sinyal: true`), yani kontrol CI'da da koşar. KOŞULMADI yalnız sunucu başlatılamazsa yazılır ve `kapi`'yi kaldırır. Faz 2'den sonra senaryo `tests/index.test.html` girişinde koşar (CSP). |
| AM10 | ÇIKIŞ → onay penceresi → "Hayır" |

**60_dunya_degisimi.js** — T10:

| Kontrol | Beklenen |
|---|---|
| DD01 | Yuva A'da durum: altın 1 234, envanter, kırık sandık, düşman grubu, gemi konumu → kaydet → menü |
| DD02 | Yuva B (yeni) → A'nın altını, envanteri, ada durumu ve keseleri yok; sayılar B'nin başlangıç değerleri |
| DD03 | 3 A↔B döngüsünde `renderer.info.memory.geometries/textures` ve `scene.children.length` ≤ ilk döngü + %5 |
| DD04 | B → menü → A → A'nın durumu birebir (altın, envanter, konum ≤ 1 m) |
| DD05 | Tek oyunculu → online host (yerel sinyal) → menü → tek oyunculu: `G.online===false`, uzak oyuncu 0, `JSEventListeners` sabit (± 5) (inceleme düzeltmesi) Dinleyici sayısı `metrics` adımıyla (CDP `Performance.getMetrics`, `run.cjs:87`) alınır ve yeni `metrikKarsilastir` adımıyla onaylanır. Sinyal sunucusu ve test girişi AM09'daki gibidir. |
| DD06 | 10 sn döngü hatasız |

**`tests/yayin/yayin_duman.mjs`** (T61; YD01–YD09):

| Kontrol | Beklenen |
|---|---|
| YD01 | `index.html?v=<sha>` damgası = sha; 90 sn sonra da = sha (sonra biten dal derlemesini yakalar) |
| YD02 | Tek HTML'in sha256'sı = `derle` çıktısı; damgası = sha |
| YD03 | `surum.json` alanları |
| YD04 | `docs/`, `tests/README.md`, `tools/build-single-html.mjs`, `js/test/kancalar.js`, `README.md` → 404 |
| YD05 | Canlıda `?test=1&peerhost=127.0.0.1&terrain=crash` ile: `__ready` (≤ 240 sn), `DK` yok, `__dkDurum()` `test:false`, `araziKip:''`, `sinyal:'varsayilan'`, `isci ≥ 1`, `eksikVarlik 0` |
| YD06 | Canlı tek HTML (https, `blob:`): `isci ≥ 1`, `kati`, `tekDosya` |
| YD07 | `deployments?sha=…&environment=github-pages` = 1 |
| YD08 | `actions/runs?head_sha=…&event=dynamic` = 0 |
| YD09 | İki sayfada konsol hatası 0 |

Profiller: `--profil geri-donus` → YD01–YD03 ve `__ready`. `--yerel <url>` → YD01–YD06, API adımları olmadan.

(inceleme düzeltmesi) Kod çakışması: Faz 3'ün 25_yuksek_dusme senaryosu da YD01–YD04 kodlarını kullanıyor. Raporlarda `yayin_duman:YD05` biçimi kullanılır (K9-17).

**`tests/node/yayin_politikasi.mjs`** (T62):

| Kontrol | Beklenen |
|---|---|
| YP01 | `pages.yml` `on.push.branches` yalnız yayın dalı |
| YP02 | Yayın işinde `if:` ref koşulu ve kabuk ref denetimi |
| YP03 | `deploy-pages` yalnız `pages.yml` ve `geri-donus.yml`'de |
| YP04 | `upload-pages-artifact` `path: _site` |
| YP05 | `cancel-in-progress: false` (`pages-uretim`) |
| YP06 | İş akışı düzeyinde yalnız `contents: read`; yazma izni yalnız yayın işinde |
| YP07 | `pull_request_target` yok; `ci.yml` push'ta yayın dalını dışlar, PR'da yalnız yayın dalını hedefler; `yayin_onkosul` işi var |
| YP08 | Yayın dalı dizgesi her yerde aynı = `package.json` `dkYayinDali` |
| YP09 | PR süzgeci örneklerde doğru |
| YP10 (`--canli`) | Bu sha için `github-pages` dağıtımı 0; "GitHub Pages" koşusu yok ya da yayın işi `skipped`; dinamik koşu 0. (inceleme düzeltmesi) `--tum`: depo genelinde son 30 günde `head_branch ≠ yayın dalı` olan "GitHub Pages" koşusu 0 ve `ref ≠ yayın dalı` olan `github-pages` dağıtımı 0. Bu, v0.3 tabanlı dalları da kapsar (§1.3-7). |
| YP11 (inceleme düzeltmesi) | Çağrılan iş akışlarında (`uses: ./.github/workflows/…`) hiçbir iş, çağıran işin verdiğinden geniş izin istemez; `ci.yml`'de her iş ≤ `contents: read` |
| YP12 (inceleme düzeltmesi) | Hiçbir `run:` bloğunda `${{ inputs.` ya da `${{ github.event.` geçmez; girdiler ortam değişkeniyle gelir |
| YP13 (inceleme düzeltmesi) | `ci.yml`'de `kapi` işi var, `if: always()` taşır ve `needs`'i bütün test işlerini kapsar. DEPLOYMENT_REPORT'taki gerekli kontrol adları `kapi` ve `yayin_onkosul`'dur. `rules/branches/<yayın dalı>` okunabiliyorsa `required_status_checks` bu iki adı içerir. |

### 9.2 CI'da koşanlar

| İş | Senaryolar ve testler |
|---|---|
| `statik` | Node: `archipelago_sabit`; Faz 1 `arazi_sozlesme`, `arazi_kuyruk`; Faz 2 şema; Faz 3 `fizik_dongu`, `gorus_sorgu`; Faz 4 `kayit_*`, `kimlik_sabit`; Faz 5 `interp_buffer` vb.; Faz 6 `hikaye_*`; Faz 9 `test_kipi`, `katalog`, `tek_html_anahtar`, `kosucu_negatif`, `yayin_politikasi` (YP01–YP09), `belge_tutarlilik`. Ayrıca `tek-html-denetle` (S1–S14) ve `site-denetle`. |
| `duman` | 00_acilis; 02_arazi_yedek (normal, noworker); 02_arazi_kurtarma; 08_kalicilik; 12_kayit_dongusu; 13_donma; 53_test_kipi; 59_ana_menu. Faz 1 yazınca `02_hizli_yolculuk` ve `02_depolama_kapali` eklenir. Bütçe ≤ 12 dk. |
| `tek` | 02_tek_dosya (test çeşidi); 54; 55 (3 klasör + çevrimdışı); 56 (`file://` + http); 57; 58 (iki hedef) |
| `coop2` | 06b, 06d; F2 06e–06m (iki oyunculular); F4 06o–06q; F5 06r–06x; F6 07a, 07b (inceleme düzeltmesi) F7 08a–08c; F8 08e. İki parça (K9-21). |
| `tam` (4 parça) | Bütün tek sayfa senaryoları (`00`–`60`, `02_*` dört kip, `03_fizik_dt`, `09`, F3–F8); 3–4 oyunculu co-op (06a, 06a2, 06c, 06f, 06n, 06y, 06z tek koşu); **eşdeğerlik paketi**: tek HTML'de 00, 02_arazi_yedek (normal, noworker, crash), 02_arazi_kurtarma, 03_fizik_duzeltmeler, 04, 05, 07_ekonomi, 08, 12, 13, 14, 15, 16, 17 ve F1–F8'in uygun tek sayfa senaryoları (inceleme düzeltmesi) 52_uzun_oturum_gercek ve 08f bu pakette değil, `dayaniklilik`'tedir; 08d (4 oyunculu) bu pakettedir. badurl kipi Faz 1'in A-17 düzeltmesinden sonra eşdeğerlik paketine girer. |
| `yayin_denetimi` (`yayin-denetimi.yml`) | YP10 `--tum` |
| `kapi` (inceleme düzeltmesi) | `needs` toplayıcı; ruleset'te gerekli |
| `dayaniklilik` (inceleme düzeltmesi) | 52, 08f, 06c/06z `--repeat 10`, 10_uzun_oturum, kamera_tarama b1–b6; canlıya almadan önce bir kez yerelde |
| `pages.yml` → `derle` | 56 ve 57 (yerel prova) |
| `pages.yml` → `canli-duman` | YD01–YD09 |
| Elle | E1–E4 (§7.5) |

10_uzun_oturum (30 dk benzetim) tabana alınmamıştı. Faz 8'in kararına göre ya `tam`'a ya da haftalık işe girer.

### 9.3 Faz 9 kabul ölçütleri (ölçülebilir)

| No | Ölçüt | Nasıl ölçülür |
|---|---|---|
| A1 | Yayın dalı dışındaki bir dala push'ta **yayın yok**: `deployments?sha=` boş, "GitHub Pages" koşusu yok ya da `yayinla: skipped` | YP10, her CI koşusunda (T62) |
| A2 | Yayın dalı dışından elle tetiklemede yayın işi `skipped`, ortam politikası dalı reddeder | YP02; Ayarlar tablosu ve E4 ekran görüntüsü |
| A3 | Yayın dalına PR'sız commit yayınlanmaz (PR denetimi kırmızı); dal kuralı doğrudan push'u reddeder | YP09; (inceleme düzeltmesi) `gh api repos/{r}/rules/branches/claude/hopeful-cray-o1jw6w` çıktısında `pull_request`, `non_fast_forward` ve `deletion` kuralları var (K9-18'den sonra); canlıya almada `required_status_checks` da. Doğrudan push denemesi yapılmaz. |
| A4 | Kırmızı CI'da `derle` ve `yayinla` `skipped` | (inceleme düzeltmesi) Statik YP denetimi: `derle.needs ∋ test`, `yayinla.needs ∋ derle`, `canli-duman.needs ⊇ {derle, yayinla}` ve bu işlerde `always()`, `failure()` ya da `!cancelled()` yok. Taslaktaki "yapay kırmızı dalda gözlem" bunu ölçmez, çünkü yayın dalı dışında `pages.yml` hiç koşmaz. Çalışma anı kanıtı canlıya almadaki ilk koşudur. |
| A5 | Tek yayıncı: yayın dalına push sonrasında dinamik koşu 0; sha başına 1 dağıtım; damga = sha (0. ve 90. sn) | YD01, YD07, YD08 |
| A6 | Pages yapıtında izin listesi dışında dosya 0; canlıda `docs/`, `tests/`, `tools/` 404; yapıt ≤ 48 MB | `site-denetle`, YD04 |
| A7 | Üretimde `typeof DK === 'undefined'`: modüler site, tek HTML, `?test=1` ile bile, `file:` ve https'de; işaret dizgesi 0 | S9, TU01–TU02, SU01–SU02, YD05 |
| A8 | `?peerhost`, `?terrain` ve `?turn*` yerel olmayan kökende ve üretimde yok sayılır | TK03, TK05, SU02, YD05 |
| A9 | (inceleme düzeltmesi) Test kipinde tabanda geçen 23 koşu ve 246 kontrol geçer; kontrol sayıları değişmez; 09 ve 06c'nin sonucu kaydedilir | §5.7-3 |
| A10 | Tek HTML güncel kaynaktan üretilir: damga = commit; iki derleme bayt bayt aynı; kökte tek HTML yok | S1, S12, Y10 |
| A11 | Eşdeğerlik: paket FARK 0; özellik izi özetleri eşit; modül kümeleri eşit (izinli farklar dışında) | §4.4 |
| A12 | `file://` ve http altında işçi ≥ 1 (`data:` ve `blob:`); köken `null` iframe'de işçi ya da açık yedek; canlıda `blob:` | TI01–TI03, TU07, YD06 |
| A13 | Gömülü varlık: 87/87 sha eşit; eksik model 0; ses tamponu 17; `/assets/` ağ isteği 0; `assets/`, `game-assets/` ve yüzde kodlu klasörde açılış | S2–S3, TV01–TV06 |
| A14 | Çevrimdışı açılış: başarısız istek 0, oyun başlıyor | TV07 |
| A15 | K-16: `import.meta` içeren sentetik derleme 1 koduyla düşer; gerçek kaynak 0 uyarı | Ek A.2; S6 |
| A16 | K-19/K-20: lisans metinleri ve katı kip tek HTML'de var | S7, S8, TU03, TU05 |
| A17 | K-11/12/13: negatif testler doğru; tabanda yanlış alarm yok; `EVALERR` yutulmuyor; onaysız senaryo GEÇTİ olamıyor | §6.3 |
| A18 | Test kaydı: 62 satır, 8 alan; tür ölçülmüş; önce/sonra dolu (ya da nedenli boş) | Y7 |
| A19 | (inceleme düzeltmesi) 10 raporun her birinde §7.2'deki bölümler var; her `OTOMATIK` bloğunun commit'i son koşunun commit'ine eşit (`rapor-uret --denetle` çıkış kodu 0); "TODO" ya da boş blok yok; REGRESSION_REPORT'ta regresyon 0 ya da her biri gerekçesiyle listelenmiş | §7.4 |
| A20 | Bağımlılık sabit: `npm ci` ile iki makinede aynı sha256; v0.4 ağacından `75587dd9…` (inceleme düzeltmesi: makineler bu ortam ve CI'ın `statik` işidir; `tek_sha256` çıktısı yerel derlemeyle aynı olmalı) | Y2 |
| A21 (inceleme düzeltmesi) | Çağrılan iş akışında izin yükseltme yok; `pages.yml` koşusu `startup_failure` vermez | YP11 (statik). Çalışma anı kanıtı canlıya almadaki ilk koşudur; ajan canlıya almadan önce hiçbir iş akışını elle tetiklemez (R20). |
| A22 (inceleme düzeltmesi) | Depo genelinde yayın dalı dışından yayın yok: son 30 günde yayın dalı dışında "GitHub Pages" koşusu 0, `github-pages` dağıtımı 0 | YP10 `--tum`; her faz kapanışında ajan da koşar (vekil bu okumaya izin veriyor) |
| A23 (inceleme düzeltmesi) | CI bütçesi: `duman` ≤ 15 dk, `tek` ≤ 15 dk, en uzun `tam`/`coop2` parçası ≤ 45 dk (ilk ölçüm koşusundan sonra); bir işte tarayıcı paralelliği 1 | `sureler.json` ve koşu süreleri; aşılırsa parça sayısı artırılır |

---

## 10. Riskler

| No | Risk | Etki | Önlem |
|---|---|---|---|
| R1 | Kullanıcı ayarları (Pages kaynağı, ortam politikası, ruleset) yapılmadan birleştirme yapılır | Dal tabanlı yayıncı ham v0.5 dalını yayınlar: `docs/` ve `tests/` sitede olur, tek HTML adresi 404 verir. Yeni hattın yayın işi kaynak denetiminde kırmızı olur. | (1) §2.12 sırası. (2) **PR'da `yayin_onkosul` işi:** yayın dalına açılan PR'larda `/pages` `build_type==='workflow'` değilse kırmızı olur. Bu iş ruleset'te gerekli kontrol yapılır ve kaynak ayarı yapılana dek birleştirme düğmesi kapalı kalır (§3.2 ek iş). (3) DEPLOYMENT_REPORT'taki Ayarlar tablosu kapıdır. (4) Ortam politikası için ara önlem (§2.13). |
| R2 | Ortam bildirmeyen bir iş `deploy-pages`'i kullanabilir mi? | Kasıtlı biri ortam politikasını atlatabilir | **[BELİRSİZ]**, doğrulanamadı. YP03 depodaki dosyaları denetler. Kasıtlı kişiye karşı dal kuralı ve PR incelemesi vardır. Tek geliştiricili, herkese açık depo için kalıntı risk kabul edilir. |
| R3 | Test kipine geçiş senaryoları bozar (API farkı, zamanlama) | Faz 1–8 sonuçları kayar | §5.7: API eşliği testi ve taban kanıtı; `install` beklenir; Y3 tek commit'tir ve geri alınabilir |
| R4 | Koşucu sıkılaştırması yeni kırmızılar üretir (gizli 404'ler, beklenen konsol hataları) | Fazlarda gürültü | Taban JSON'larında `errors` hep 0 (§1.8). İzin listesine yalnız gerekçeli kalıp girer ve her izinli hata raporda görünür (`konsolIzinli`). Bu susturma değil, kayıttır. |
| R5 | GitHub koşucularında SwiftShader süreleri farklı | Zaman eşikli kontroller kararsız olur | `ortamDuyarli` etiketi; onay başarısızlığında yeniden deneme yok; eşik değişikliği gerekçeli PR ile; kararlılık ölçümü (§7.4-6) |
| R6 | Katı kip, tek HTML'de gizli bir gevşek kip bağımlılığını ortaya çıkarır | Tek HTML'de çalışma anı hatası | Ölçüldü: başlıklı derleme `assets/` klasöründe 4/4 geçti, hata 0 (§4.9). Eşdeğerlik paketi var. ES modül kaynağı zaten katı kipte çalışıyor. |
| R7 | Kök tek HTML silinince eski "raw" bağlantıları kırılır | İndirme bağlantısı 404 verir | Pages adresi aynı yolda kalır; README bağlantısı güncellenir; DEPLOYMENT_REPORT'ta not |
| R8 | PR denetimi API'si gecikir ya da değişir | Meşru yayın durur | 6 × 10 sn yeniden deneme; açık hata iletisi; aynı sha'yı elle yeniden yayınlama; süzgecin Node testi |
| R9 | `main`'e yeniden adlandırma sonradan yapılır, sabit dizgeler eskir | Yayın durur (güvenli taraf) | YP08 tutarlılık testi; §2.1 adım listesi |
| R10 | Ortam onaylayıcısı yayını geciktirir | Birleştirme ile yayın arasında bekleme olur | Kasıtlıdır ("canlıya al" düğmesi); onay 30 gün geçerli; istenirse kaldırılabilir (K9-10) |
| R11 | v0.3'e geri dönüş | v0.3'te kaydeden oyuncu v0.5'e özgü ilerlemeyi kaybeder | İleri düzeltme önceliklidir; R1 penceresi kısa tutulur; Faz 4 `.pre3` ve yalnız ekleme kuralı; SAVE_PERSISTENCE_REPORT'ta açık uyarı |
| R12 | Eylem sürümleri (`@v3`, `@v4`, `@v5`) eskir | Uyarı ya da kırmızı koşu | İsteğe bağlı Dependabot; YP denetimleri sürümden bağımsız |
| R13 | Tam paket süresi (~2,5 sa işlemci) | CI süresi uzar | 4 parça; yalnız PR, `[tam]` ve gece; herkese açık depoda dakika ücretsiz |
| R14 | Faz 3–4 ad çakışması çözülmez | Katalog testi kırmızı kalır | K9-17 önerisi; katalog kapısı bilinçli olarak kırmızı kalır |
| R15 | `__dkDurum` üretimde "test kancası" sayılabilir | Kullanıcı isteğiyle çelişki algısı | Yalnız ilkel değerler döner, denetim işlevi yoktur; gerekçe T59–T61. Kaldırılırsa YD05, YD06 ve SU04 DOM ve damga denetimine iner (K9-4 seçeneği). |
| R16 | `data:` modül işçisi Firefox ya da Safari'de çalışmayabilir | Bu tarayıcılarda tek HTML ana iş parçacığı yedeğiyle (yavaş) açılır | Faz 1'in yedek yolu; E3 elle kontrol; gecelik gözlem işi |
| R17 | Faz 2 CSP ile yeni satır içi betikler (Faz 1 A-04) çakışır | Tek HTML'de özet uyuşmazlığı betiği engeller | Her derlemede S13; CSP adımı montajın en sonunda |
| R18 | 06c/06z kararsızlığı kapıyı tıkar | Canlıya alma gecikir | Faz 5 kabulü (10/10); bilinen sorun muafiyeti görünür kalır; son karar kullanıcıda |
| R19 | Kilit dosyası ve `"type": "module"` başka araçları etkiler | Node betiklerinde beklenmeyen davranış | `.cjs`/`.mjs` uzantıları açık; senaryolar `eval` ile okunur; Y2 kabulü (taban aynı kalır) |
| R20 | Bu oturumun ajan araçları (`actions_run_trigger`, `merge_pull_request`) canlıyı yanlışlıkla tetikler | İstenmeyen yayın | Ref koşulu + ortam politikası + onaylayıcı. Ajan yalnız kullanıcı "canlıya al" deyince birleştirir. |
| R21 (inceleme düzeltmesi) | Çağrılan iş akışında izin yükseltme (N9-10) | `pages.yml` hiç başlamaz; yayın durur (güvenli tarafta, ama canlıya alma takılır) | İzin isteyen işler `yayin-denetimi.yml`'de; YP11 statik denetimi; A21 |
| R22 (inceleme düzeltmesi) | GitHub koşucusu bu ortamdan yavaş | `coop2`/`tam` zaman aşımı; kararsız süre eşikleri | K9-21 bütçesi; ilk koşu ölçüm koşusu; `sureler.json`; parça sayısı `kapi` sayesinde ruleset'e dokunmadan artırılır |
| R23 (inceleme düzeltmesi) | `faz1_brief.md` K9-16'ya göre güncellenmez | Y1/Y3 yapılmadan Faz 1 biter; K-08 açık kalır; Faz 2 `?test=1`'i kendi yöntemiyle yazar (çift iş) | K9-16'nın uygulama koşulu; Faz 1 kabulüne 53_test_kipi ve `kosucu_negatif` eklenir |
| R24 (inceleme düzeltmesi) | Faz 2'nin CSP'si yerel sinyal sunucusunu `index.html`'de engeller | 59 AM09, 60 DD05 ve CSP'li sayfada oda kuran her yeni senaryo kalır | Test girişi `tests/index.test.html`; `kos.mjs` `meta.sinyal` senaryolarını oraya yönlendirir |
| R25 (inceleme düzeltmesi) | Yayın dalı dışındaki v0.3 tabanlı bir dalda yayın, depo içi denetimle görülmez | Kaza fark edilmez | YP10 `--tum`; faz kapanışında ajan sorgusu; K9-18 ve §2.13 sunucu tarafı ayarları |
| R26 (inceleme düzeltmesi) | Faz 2/5'in test modülleri `install` dışında dışa aktarım yapar | Üretim derlemesi "No matching export" ile düşer | `test_kipi.mjs` kural 2; §4.2 tek mekanizma notu; Faz 2/5 için KARARLAR eki |

---

## Ek A — Denemeler (salt-okur, `/tmp/tasarim_y/faz9/`)

**A.1 Yeniden derleme.**
- Komut: `NODE_PATH=/home/user/devtools/node_modules node /home/user/SON-HAZ-NE/tools/build-single-html.mjs /tmp/tasarim_y/faz9/v04_yeniden.html`
- Sonuç: 21,0 MB, 1,7 sn; sha256 `75587dd915dc…e3` (dist ile aynı); konsolda uyarı yok.

**A.2 esbuild 0.24.2 davranışları** (`esb/deneme.mjs`, `esb/deneme2.mjs`):

| Deneme | Sonuç |
|---|---|
| `if (TEST) await import('./test/hooks.js')`, saplamasız | 570 B, işaret var (beklenen) |
| Yalnız `testmode.js` saplanmış (`TEST=false`) | **323 B, işaret hâlâ var**: dinamik içe aktarma satır içine alınmış, koşul katlanmamış |
| `define: {'globalThis.__DK_URETIM__':'true'}` + aynı modülde `!URETIM && TEST` | 579 B, işaret var (`var p=!0` korunuyor) |
| Kanca modülü + `testmode.js` saplanmış | **253 B, işaret yok** → tasarımdaki yöntem |
| `new URL('./x.js', import.meta.url)`, varsayılan | Uyarı `empty-import-meta`; çıktı `new URL("./x.js",n.url)` (`n={}`) |
| Aynısı + `logOverride:{'empty-import-meta':'error'}` | `Build failed with 1 error: … "import.meta" is not available with the "iife" output format and will be empty` |
| `banner:{js:'"use strict";'}` | Çıktı `"use strict";` ile başlıyor |

**A.3 Gerçek kaynak** (`gercek_paket.mjs`, v0.4 ağacı):

| Paket | Uyarı | Bayt | Not |
|---|---|---|---|
| Oyun | 0 | 1 709 567 | `import.meta` 0; `new URL("./` 0; "Three.js Authors" yok; `"use strict"` yok; `window.DK` 8; `DK.sim` var |
| İşçi | 0 | 31 620 | — |
| `eof` + katı kip | 0 | 1 709 673 (+106) | Lisans ve katı kip var |
| `logOverride` | 0 | — | Derleme geçiyor |

**A.4 K-09'un tarayıcıda yeniden üretilmesi** (`rapor/k09_eski_assets.json`).
- Kurulum: dist v0.4 → `/tmp/tasarim_y/faz9/k09/assets/eski.html`, `02_tek_dosya` (`file://`).
- Sonuç: `harnessError: page.waitForFunction: Timeout 240000ms exceeded`; `errors` 258.
  - 53 × "Model yüklenemedi … Failed to fetch".
  - 15 × "Fetch API cannot load file:///tmp/tasarim_y/faz9/k09/assets/assets/models/kk/… URL scheme "file" is not supported".
- `kk.js:70-71` hata atar; `boot()` düşer; `__ready` gelmez.
- Bu koşu bugünkü koşucunun (K-11 düzeltmesinden önce) bile **koşucu hatasıyla** kaldığını gösteriyor. Ama 258 hata `errors`'a yazıldı ve çıkış kodunu tek başına belirlemiyor.

**A.5 `key()` benzetimi** (`keysim/key_sim.mjs`, `key_sim_yedeksiz.mjs`).
- Durumlar: 9 sayfa konumu × 7 istek = 63.
- Eski `key()`: 5 konumda gömülü varlık çözülemiyor; `data:` adresinde yanlış pozitif.
- Yeni `key()`: yedekli ve yedeksiz iki biçimde de çözülemeyen 0, yanlış pozitif 0.

**A.6 Tarayıcı koşuları** (`olcumler.sh`, `olcumler2.sh`; raporlar `/tmp/tasarim_y/faz9/rapor/`).
- Komut kalıbı: `/home/user/devtools/tk node /home/user/SON-HAZ-NE/tests/harness/run.cjs <senaryo> --url <adres> --size 640x360 --timeout 900 --report …`.
- Çevrimdışı koşu `cevrimdisi.cjs` ile yapıldı: Playwright ile `newContext({offline:true})`; dış, başarısız ve konsol istekleri sayıldı.
- Süreler kilit beklemesini de içerir; aynı anda Faz 7 ve Faz 8 tasarım ölçümleri koşuyordu.

| Koşu | rc | PASS/FAIL | Toplam süre (bekleme dahil) | Koşunun kendi süresi |
|---|---|---|---|---|
| `k09_eski_assets` | 1 | 0/0 (koşucu hatası: zaman aşımı) | 373 sn | 240,7 sn |
| `k09_yeni_assets` | 0 | 4/0 | 606 sn | 21,1 sn |
| `k09_yeni_gameassets_q` | 0 | 4/0 | 808 sn | 24,1 sn |
| `blob_http` | 0 | 4/0 | — (ilk betik durdurulduktan sonra kendi başına tamamlandı) | 21,6 sn |
| `cevrimdisi` | 0 | — (sayım) | 242 sn | 23,3 sn |
| `tek_00_acilis` (dist, `file://`) | 0 | 6/0 | 443 sn | 21,8 sn |
| `tek_08_kalicilik` | 0 | 12/0 | 169 sn | 27,3 sn |
| `tek_05_dusman_ai` | 0 | 18/0 | 138 sn | 29,7 sn |
| `tek_13_donma` | 0 | 9/0 | 124 sn | 27,8 sn |

Planlanan sekiz senaryoluk eşdeğerlik örneklemi, kilit yoğunluğu nedeniyle dörde indirildi. Çıkarılanlar: 02_arazi_kurtarma, 03_fizik_duzeltmeler, 04_karakter, 12_kayit_dongusu. Bunlar Y4'te koşulacak.

**A.7 GitHub salt-okur sorguları (14 Kasım).**
- `list_branches`: 3 dal (`claude/denetim-v0.4` `44d548c`, `claude/hopeful-cray-o1jw6w` `762f1c7`, `claude/v0.5-saglamlastirma` `7858a89`); üçü de `protected:false`.
- `list_workflow_runs`: `total_count 16`; hepsi canlı dalda. "pages build and deployment" (dinamik) koşuları: 41221950864 (`762f1c7`, 16:54:52 → 16:55:36) ve 41221473027 (`ba85510`). İş akışı koşuları: 41221950903 (`762f1c7`, 16:54:52 → 16:55:24), 41221472309 (`ba85510`), 41219635984 (`workflow_dispatch`, `47976be`).
- Ortam ve Pages ayar uçları bu oturumda okunamıyor; denetim 403 kaydetmişti.

**A.8 `"type": "module"` gerekçesinin denemesi** (`tipdeneme/`, Node v22.22.0). Bir `.mjs` dosyasından ESM sözdizimli bir `.js` içe aktarıldı:

| Durum | Sonuç |
|---|---|
| `type`'sız `package.json` | `[MODULE_TYPELESS_PACKAGE_JSON] Warning: … Reparsing as ES module … performance overhead` |
| `"type":"module"` | Uyarı yok |
| `package.json` yok (bugünkü durum) | Uyarı yok (sessiz algılama) |

Sonuç: `package.json` eklenecekse `"type":"module"` gerekir (§3.4-4).

---

## Ek B — İnceleme ölçümleri (inceleme düzeltmesi; salt-okur, `/tmp/tasarim_y/faz9_inceleme/`)

Bütün tarayıcı koşuları kilit sarmalayıcısıyla (`/home/user/devtools/tk`) ve 8080'deki değişmeyen v0.4 kopyasına karşı yapıldı. Depo dosyası değişmedi.

**B.1 Gizli 404 ve konsol hataları.** `run_tam_kayit.cjs`, `tests/harness/run.cjs`'in kopyasıdır. Ek olarak her konsol hatasını ve uyarısını `location().url` ile, her ≥ 400 yanıtı ve her `requestfailed`'ı kaydeder. Senaryolar değiştirilmedi.

| Koşu | Sonuç | ≥ 400 yanıt | `requestfailed` | Konsol hatası | Konsol uyarısı (tekil) | Bugünkü koşucunun `errors`'u |
|---|---|---|---|---|---|---|
| 00_acilis (normal) | 6/6, 24 sn | 0 | 0 | 0 | 33 × `toNonIndexed`, 1 × `KHR_parallel_shader_compile` | 0 |
| 02_arazi_yedek `?terrain=badurl` | 12/12, 86 sn | 3 × `404 /js/world/terrainWorker.missing.js` | 3 × `net::ERR_FAILED` (aynı adres) | 0 | aynı + 4 arazi işçisi uyarısı | 3 (çıkış kodu 0) |
| 08_kalicilik (normal) | 12/12, 38 sn | 0 | 0 | 0 | aynı | 0 |

**B.2 Sayfa düzeyindeki 404'ün ileti biçimi** (`s_404.js`). `fetch('assets/models/yok.glb')` 404 döndü, `<img src="yok.png">` hata verdi. İkisi de konsolda `Failed to load resource: the server responded with a status of 404 (File not found)` üretti. Metinde adres **yok**; adresi `location().url` taşıyor. `requestfailed` olayı **yok**. Bugünkü koşucu ikisini de görmedi (`errors` boş).

**B.3 Sahte https kökeni** (`sahte_koken.cjs`). `context.route('https://oyun.ornek/**')` v0.4 dosyalarını diskten sundu. 189 istek yakalandı; aralarında 3 modül işçisi isteği (`/js/world/terrainWorker.js`) var. `https://oyun.ornek/index.html?test=1&terrain=crash&peerhost=10.9.9.9` açılışı:
- hazır 5,5 sn;
- `isSecureContext: true`; `crypto.subtle` ve `navigator.locks` var;
- `terrain.mode: 'crash'`, 3 işçi çöktü, yedek açık;
- başarısız istek, konsol hatası ve sayfa hatası 0.

Sonuç: TK05'in yöntemi çalışıyor, köken https olmalı ve v0.4'te K-08 yerel olmayan güvenli bir kökende yeniden üretiliyor.

**B.4 GitHub salt-okur sorguları** (14 Kasım; `gh api`, bu oturumun vekili üzerinden).
- `repos/{r}`: `visibility: public`, `default_branch: claude/hopeful-cray-o1jw6w`, `has_pages: true`.
- `actions/runs`: 16 koşu, hepsinde `head_branch = claude/hopeful-cray-o1jw6w`. 14'ü "GitHub Pages" (13 push, 1 `workflow_dispatch`), 2'si "pages build and deployment" (`event: dynamic`). `?event=dynamic` süzgeci 2, `?head_sha=762f1c7…&event=dynamic` 1 sonuç döndürüyor; yani YD08'in sorgusu çalışıyor.
- `deployments`: 6 kayıt; hepsinde `environment: github-pages` ve `ref: claude/hopeful-cray-o1jw6w`. `762f1c7` ve `ba85510` için ikişer kayıt var (iki yayıncı, K-05).
- `commits/762f1c7…/pulls`: 0 (canlı uç doğrudan push'tur).
- `rulesets`: `[]`. `rules/branches/claude/hopeful-cray-o1jw6w`: `[]`.
- `pages`, `environments`, `environments/github-pages` ve `…/deployment-branch-policies`: vekil 403 döndürüyor ("Access to this GitHub API path is not permitted through this proxy").

**B.5 Bellek** (`bellek_olc.sh`, 08_kalicilik). Koşucunun ve Chromium süreç ağacının toplam RSS'i 2 sn arayla örneklendi. Tepe değer 2 418 MB (açılışın 16. saniyesi); oyun sırasında 1 801–2 257 MB. RSS paylaşılan sayfaları birden çok kez sayar; değer bir üst sınırdır.

**B.6 İş akışı izinleri (belge).** GitHub'ın "Reusable workflows" belgesine göre çağrılan iş akışına geçen `GITHUB_TOKEN` izinleri yalnız daraltılabilir, genişletilemez. Topluluk kayıtlarında hata iletisi "The nested job '…' is requesting '…', but is only allowed '…'", sonuç ise `startup_failure`'dır. Bu ortamda Actions koşturulamadığı için ölçülemedi. YP11 statik denetimi bu yüzden zorunludur.

---

## İ. İnceleme: bulunan sorunlar (önem sırasıyla)

| # | Önem | Sorun | Yer (taslak) | Düzeltme (bu belgede) |
|---|---|---|---|---|
| 1 | KRİTİK | Taslaktaki `pages.yml` hiç başlamazdı. `test` işi `ci.yml`'yi `workflow_call` ile çağırıyor. Çağrılan `yayin_denetimi` (`actions`/`deployments: read`) ve `yayin_onkosul` (`pages: read`), çağıranın verdiği `contents: read`'den geniş izin istiyor. GitHub bunu `if:`'ten bağımsız olarak koşu başlamadan reddeder (`startup_failure`). Her yayın kırmızı kalırdı. | §2.10, §3.2 | N9-10; iki iş `yayin-denetimi.yml`'ye taşındı; `test` işinde açık `contents: read`; YP11, A21, R21 |
| 2 | YÜKSEK | K9-16 (Y1–Y3'ün Faz 1'e çekilmesi) uygulanamaz durumdaydı. `faz1_brief.md` Y1–Y3'ü içermiyor ve K-08'i Faz 9'a bırakıyor. Y2 (`package.json`) yapay bir önkoşuldu. v0.5'teki bugünkü `pages.yml` Faz 1–8 boyunca K-03'e açık kalıyordu. | §0.3 K9-16, §8.2 | K9-16 yeniden yazıldı: Y1, Y3 ve Y9a Faz 1 başında; brief güncellemesi uygulama koşulu; Y2 bağımsız; R23 |
| 3 | YÜKSEK | T62'nin izleme kör noktası. `yayin_denetimi` yalnız `ci.yml`'yi taşıyan dallarda koşar. K-02'nin asıl riski olan v0.3 tabanlı yeni dalları hiç göremez. Ayrıca canlı dalda bugün sunucu tarafında hiçbir kural yok (`rules/branches` boş). | §1.3, §3.1, §9.1 YP10 | §1.3-7 ve 8; YP10 `--tum` (depo geneli, vekilden de okunabiliyor); K9-18 (durum denetimsiz ilk ruleset, hemen); A22, R25 |
| 4 | YÜKSEK | Adım sırası hatası. Y3'ün `main.js` kodu Y5'te yazılacak `surum.js`'i içe aktarıyor. 53 TK02–TK05 `__dkDurum`'a (Y5), TK07 `davetBaglantisi`'ne (Y5) dayanıyor. Y4'ün kabulü (S1, damga, TV08) Y5'e, Y5'in kabulü (56) Y4'e, 59 AM08 ise Y7'ye dayanıyor. Bu hâliyle Faz 1 başındaki Y3 başarısız olurdu. | §5.4, §8.2 | `surum.js` ve `__dkDurum` Y3'e alındı; sıra Y5 → Y4; kabul maddeleri taşındı; bağımlılık satırı düzeltildi |
| 5 | YÜKSEK | Faz kapısı ve rapor araçları (`faz-kapisi`, katalog, toplayıcı, `rapor-uret`, `durum.json`) Y7'de, yani Faz 9'da yazılıyor. Oysa §7.2 ve §7.3 bunların her faz kapanışında kullanılmasını istiyor. | §7.2, §7.3 | §7.3: Faz 1–8 için araçsız kapı, ham rapor arşivi (`docs/v05/kosular/faz<N>/`) ve elle tutulan `durum.json`; Y7 bunları geriye dönük üretir |
| 6 | YÜKSEK | K-11'in kanıtı ve eşlemesi hatalı. "Taban `errors` 0, yani yeni kırmızı yok" çıkarımı geçersiz, çünkü 404'ler zaten süzülüyordu. Ölçüm: 00 ve 08'de gizli 404 yok; badurl'da 3 + 3 ağ hatası var. Sayfa düzeyindeki 404'ün konsol iletisi adres içermiyor, bu yüzden metin tabanlı izin listesi V4'ü ve SU05'i yanlışlıkla kaldırırdı. | §1.8, §6.3, §4.6 V4 | N9-11, Ek B.1–B.2; izin metin + `location().url` ile eşlenir, ağ kaydıyla tekilleştirilir; `engine.js:66` notu |
| 7 | YÜKSEK | K-08 tam kapanmıyordu. README'nin "Yerel" maddesi oyunculara `localhost` sunucusu öneriyor ve test kipinde `?peerhost` her değeri kabul ediyordu. Yani bağlantıyla sinyal ele geçirme yerelde sürüyordu. | §5.1, §5.4 | K9-20: `peerhost` yalnız geri döngü adresi; TK08; README notu |
| 8 | YÜKSEK | CI bütçesi gerçekçi değildi. `coop2` tek işte ~75 dk (taslakta 30–60 dk) ve 120 dk sınırına yakın. Gerekli kontroller matris adlarına bağlıydı ve GitHub atlanan gerekli işi başarı sayıyor. "Koşucu benzer güçte" ölçülmemiş bir varsayımdı ve bellek bütçesi yoktu. | §3.1, §2.6-A | Taban ortalamalarıyla hesap; bellek ölçümü (2,4 GB/sayfa); K9-19 `kapi`; K9-21 (`coop2` 2 parça, `dayaniklilik.yml`, `sureler.json`); A23, R22 |
| 9 | YÜKSEK | Faz 2'nin CSP'si (`connect-src`) yerel sinyal sunucusunu `index.html`'de engelliyor. 59 AM09 ve 60 DD05 bu sayfada oda kuruyor. AM09 ayrıca CI'da sinyal sunucusu olmadığı için hep KOŞULMADI kalırdı. | §9.1, §3.6 | `kos.mjs` `meta.sinyal` senaryoları için sunucu başlatır ve test girişini kullanır; R24 |
| 10 | ORTA | Sahipsiz kullanıcı testleri vardı. T17 (gemi dalga hareketi) için önerilen `22e_gemi_dalga`'yı hiçbir faz yazmıyordu; T18'in karaya oturma kısmı da öyle. T23'ün olumlu yolu (doğru şifreyle katılım) Faz 2'de yok, yalnız yanlış şifre var. | §6.8 | 22e (GD01–GD03) Faz 3'e, doğru şifreli katılım Faz 2 06j'ye atandı (KARARLAR eki) |
| 11 | ORTA | Aynı iş iki kez planlanmıştı: A-16 prelude'u (Faz 1 brief madde 13 ve Faz 9 Y4); Faz 2'nin "netTest'i derleme dışı bırak" işi ve `uretimSaplama`; Faz 8'in `perf_rapor.mjs`'i ve `rapor-uret.mjs`; Faz 5 F5-0'ın harness uyarıları ve Y1. Ayrıca Faz 2/5 test modüllerinin dışa aktarımları yalnız `install` veren saplamayla uyumsuzdu. | §1.10, §4.2, §7.3, §8.2 | A-16 Faz 1'e bırakıldı; tek saplama mekanizması; perf bölümü Faz 8'den; F5-0 sınırı; `install`-yalnız kuralı; R26 |
| 12 | ORTA | Ölçülemeyen ya da kararsız ölçütler vardı. "23/25 ve aynı iki kalan" kararsız 06c ve 09'a bağlıydı. A3 yalnız ekran görüntüsüne, A4 ölçmeyen bir gözleme dayanıyordu; A19 "dolu", A20 "iki makine" diye belirsiz kalıyordu. | §5.7, §7.4, §8.2, §9.3 | "Tabanda geçen 23 koşu ve 246 kontrol geçer"; A3 API ile; A4 statik `needs` denetimiyle; A19 ve A20 somutlaştırıldı |
| 13 | ORTA | Faz 1'in badurl düzeltmesi (A-17) §4.4'teki "badurl tek HTML'de anlamsız" kararını eskitiyordu. Ayrıca kip http/`blob:` altında bugün de anlamlıdır. | §4.4 | badurl Faz 1'den sonra eşdeğerlik paketine alınır |
| 14 | ORTA | `geri-donus.yml` sorunluydu: `${{ inputs.ref }}` kabukta kullanılıyordu (betik enjeksiyonu); metindeki duman işi YAML'da yoktu; eski ağaçta meta `swap`'ı ve CSP adımı derlemeyi düşürürdü; prova kabulü yoktu. | §2.11 | YAML yeniden yazıldı; üç araçta `--eski-agac-izni`; 762f1c7/44d548c provası Y9 kabulüne girdi; YP12 |
| 15 | ORTA | R3 gerçek dışıydı: yeniden koşma penceresi yaklaşık 30 Kasım 2026'da kapanıyor. 7 günlük yapıt saklama süresi de yeniden koşmayla geri dönüşü engelliyordu. | §2.12 | R3 "pratikte yok"; R1b; `retention-days: 30` |
| 16 | ORTA | TK05'in `http://oyun.ornek` kökeni güvenli bağlam değil. Faz 2/4'ün `crypto.subtle`, `randomUUID` ve Web Locks kullanımıyla bozulur. | §9.1 TK05 | https kökeni; ölçüm: yönlendirme ve işçi yakalanıyor (N9-12) |
| 17 | ORTA | Tür sınıflaması yalnız kontrol adımının kendi sayaç farkına bakıyordu. Önceki adımdaki `DK.sim` ile üretilmiş durum "gerçek tarayıcı" sayılırdı; bu, kullanıcının "gerçek tarayıcıyı benzetim gibi gösterme" isteğinin tersi yönde bir hatadır. | §6.1 | Aralık son gezinmeden başlar; `frames` ve `simSteps` de sayılır |
| 18 | ORTA | Senaryoların dayandığı koşucu yetenekleri tanımsızdı: seçiciyle tıklama (56, 57, 59), beklenen damga değişkeni (02_tek_dosya, TU04, SU04), metrik karşılaştırma (DD05) ve `goto`'da `beforeunload` (`main.js:382-384`). | §5.6, §6.3 | `tikla`, `bekleSecici`, `degisken`, `metrikKarsilastir`; `beforeunload` kabulü |
| 19 | ORTA | §2.12 adım 7'deki prova isteğe bağlıydı, oysa kaynak değişince yayının sunulmaya devam edip etmediği [BELİRSİZ]. | §2.12 | Zorunlu prova ve sonrasında açılış denetimi |
| 20 | DÜŞÜK | `[tam]` koşulu yayın hattında da geçerliydi; sıkıştırılmış birleştirmenin iletisinde geçerse yayın hattı saatlerce uzardı. | §3.2 | Koşul yalnız yayın dalı dışındaki push'ta |
| 21 | DÜŞÜK | §3.3'teki bayrak iddiası yanlıştı: arka plan kısması bayrakları yalnız `coop.cjs:27`'de var, `run.cjs:36`'da yok. | §3.3 | Düzeltildi |
| 22 | DÜŞÜK | Kontrol kodları çakışıyor (Faz 3'ün YP01'i ve YD01–YD04'ü). Faz 7 adları artık nihai, Faz 8 adları taslakta. | §0.3 K9-17, §6.8 | Kod senaryo adıyla yazılır; adlar tabloya işlendi |
| 23 | DÜŞÜK | `kamera_tarama/*.js` tek onaylı ölçüm betikleri K-13'ten sonra GEÇTİ görünürdü. `v03_coop3_referans.cjs` `testUrl`'den geçmiyor. | §1.8, §1.10 K-13 | `meta.olcum`; katalog dışı |
| 24 | DÜŞÜK | Eski özellik eşlemesinin README aralığı eksikti (101-128 yerine 27-128 olmalı). Kullanıcının "eski sürüm"ü canlı v0.3'tür, karşılaştırma yalnız v0.4'e yapılıyordu. | §7.4-8 | README aralığı düzeltildi; "canlı (v0.3) → v0.5" sütunu |
| 25 | DÜŞÜK | Küçük tutarsızlıklar: `yedek-v0.3` yerel etiketi kalıcı değil; 55'in başlığı TV08'i kapsamıyordu; `belge_tutarlilik.mjs` dosya listesinde yoktu; iframe sabit sayfası http'den sunulmalı; etiket değişikliği eşlemesi ve "önce uygulanamaz" durumu yoktu; §2.1'deki "7 dizge" sayısı; N9-1'de "ilk commit" yerine "uç commit" olmalı. | çeşitli | Hepsi işaretli düzeltmelerle giderildi |

**Doğrulanan, sorun bulunmayan noktalar:**
- **K-02 analizinin özü doğru.** Push olayında iş akışı ve `on.push.branches` süzgeci, gönderilen ucun dosyasından okunur. API'de 16 koşunun ve 6 dağıtımın hepsi canlı dalda; v0.4 ve v0.5 dallarından hiç koşu doğmamış. Canlı daldan açılacak yeni `claude/*` dalı v0.3 dosyasını devralır ve tek sunucu tarafı engel ortam kuralıdır.
- **62 testin hepsi eşlenmiş** (62/62). Taban sayımı (22/25/4/1/10) audit_K'nin 22/30/10'uyla test test aynı. Belgede anılan mevcut kontrol etiketleri ve kimlikleri depoda var.
- **Dosya ve satır başvuruları** (`build-single-html.mjs`, `run.cjs`, `coop.cjs`, `main.js:134` (49 alan), `terrain.js`, `net.js`, `menu.js`) doğru. Tek fark: `KNOWN` `net.js:46`'dadır.
- `DK.mod` dönüşümü senaryolardaki `await import(…)` kullanımıyla uyumludur.
- `"type": "module"` mevcut dosyaları bozmaz; `require` kullanan `.js` dosyası yok.
- dist sha256 `75587dd9…`, kök sha256 `f0ac8cb0…`; esbuild 0.24.2, Playwright 1.63.0 ve peer 1.0.2 bu ortamda doğrulandı.
