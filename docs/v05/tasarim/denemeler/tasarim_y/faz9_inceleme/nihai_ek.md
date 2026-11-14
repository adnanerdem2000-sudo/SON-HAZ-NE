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
