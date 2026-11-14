# -*- coding: utf-8 -*-
# Faz 9 tasarım taslağından nihai belgeyi üretir: satır numarasına bağlı, ön ek ve alt dizge denetimli düzenlemeler.
import sys
SP = '/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/'
SRC = SP + 'faz9_tasarim.md'
DST = SP + 'faz9_tasarim_NIHAI.md'
EK = '/tmp/tasarim_y/faz9_inceleme/nihai_ek.md'

lines = open(SRC, encoding='utf-8').read().split('\n')
ops = []
def rep(n, prefix, new): ops.append((n, len(ops), 'rep', prefix, new))
def ins(n, new): ops.append((n, len(ops), 'ins', None, new))
def sub(n, old, new): ops.append((n, len(ops), 'sub', old, new))
def app(n, add): ops.append((n, len(ops), 'app', None, add))
def cel(n, add): ops.append((n, len(ops), 'cel', None, add))
def rng(a, b, prefix, new): ops.append((a, len(ops), 'rng', (b, prefix), new))
D = '(inceleme düzeltmesi)'

# ---------------- Başlık ----------------
ins(9, r'''- **İnceleme (inceleme düzeltmesi):** Bu sürüm, taslağın karşıt incelemeden geçmiş nihai hâlidir. Düzeltmeler "(inceleme düzeltmesi)" ile işaretlidir. İnceleme sırasında da hiçbir depo dosyası değiştirilmedi. Ölçümler `/tmp/tasarim_y/faz9_inceleme/` altında yapıldı, tarayıcı koşuları kilit sarmalayıcısıyla koşuldu (Ek B). Bulunan sorunların önem sıralı listesi belgenin sonundadır (§İ).''')

# ---------------- §0.1 ----------------
sub(44, "Feature dalları her push'ta CI koşar ama yayına çıkamaz. Yayın politikası üç katmanda kurulur:",
    "Feature dalları her push'ta CI koşar ama yayına çıkamaz. " + D + " CI yalnız `ci.yml`'yi taşıyan, yani v0.5 tabanlı dallarda koşar. Canlıya alınana dek varsayılan daldan (v0.3) açılan yeni bir dalda ne CI ne yayın denetimi vardır. Bu yüzden T62 depo geneli API taramasıyla izlenir (§1.3-7). Yayın politikası üç katmanda kurulur:")
sub(66, "- 10 teslim raporu fazlar boyunca bu kayıttan beslenir. Son regresyon v0.4 taban koşusuyla (23/25) karşılaştırılır.",
    "- 10 teslim raporu fazlar boyunca bu kayıttan beslenir. " + D + " Faz 1–8'de ham raporlar arşivlenir ve `durum.json` elle güncellenir; kayıt araçları Faz 9'da yazılır ve raporları bu arşivlerden üretir (§7.3). Son regresyon v0.4 taban koşusuyla (tabanda geçen 23 koşu ve 246 kontrol) karşılaştırılır. Eski özellikler için canlı v0.3 de karşılaştırmaya girer (§7.4-8).")

# ---------------- §0.2 ----------------
sub(72, "`claude/denetim-v0.4` dalı da gönderildi (ilk commit'i `d6e716f`, filtre baştan daraltılmış).",
    "`claude/denetim-v0.4` dalı da gönderildi (ilk commit'i `d6e716f`, filtre baştan daraltılmış; " + D + " belirleyici olan her gönderimin uç commit'idir, dalın bütün uçları `d6e716f`'den türediği için hepsi daraltılmış filtreyi taşır).")
sub(72, "`git log --reverse 762f1c7..44d548c` ilk satırı `d6e716f` |",
    "`git log --reverse 762f1c7..44d548c` ilk satırı `d6e716f`; " + D + " 14 Kasım'da yeniden okundu: 16 koşunun ve 6 `github-pages` dağıtımının hepsi canlı dalda (Ek B.4) |")
ins(80, r'''| N9-10 (inceleme düzeltmesi) | **Taslaktaki `pages.yml` hiç başlamazdı.** `pages.yml`'nin `test` işi `ci.yml`'yi `workflow_call` ile çağırıyor ve çağıran yalnız `contents: read` veriyor. `ci.yml`'deki `yayin_denetimi` (`actions: read`, `deployments: read`) ve `yayin_onkosul` (`pages: read`) bunun üstünde izin istiyor. GitHub, çağrılan iş akışındaki bir işin çağıranın verdiğinden geniş izin istemesini koşu başlamadan reddeder ("The nested job '…' is requesting '…', but is only allowed '…'", sonuç `startup_failure`). Bu, işlerin `if:` ile atlanacak olmasından bağımsızdır. Sonuç: her yayın koşusu başlamadan kırmızı olurdu. Düzeltme §3.2: bu iki iş ayrı `yayin-denetimi.yml`'ye taşınır; `ci.yml`'de hiçbir iş `contents: read`'den fazlasını istemez; YP11 bunu statik olarak denetler. | GitHub "Reusable workflows" belgesi ("permissions … can be only downgraded") ve topluluk kayıtları (Ek B.6). Actions bu ortamda koşturulamadığı için ölçülemedi. |
| N9-11 (inceleme ölçümü) | **Gizli 404 ölçüldü.** Bugünkü koşucunun 404 süzgeci kaldırılmış bir kopyası kullanıldı; bu kopya her konsol hatası ve uyarısını, her ≥ 400 yanıtı ve her `requestfailed`'ı kaydeder. v0.4'te 00_acilis ve 08_kalicilik'te gizli 404 ve konsol hatası **0** çıktı. 02_arazi_yedek `?terrain=badurl` koşusunda 3 × `404 …/terrainWorker.missing.js` yanıtı ve 3 × `requestfailed net::ERR_FAILED` var; bugünkü koşucu bunların 3'ünü `errors`'a yazıyor ama çıkış kodu 0. Sayfa düzeyindeki 404 (`fetch`, `<img>`) Chromium'da "Failed to load resource: the server responded with a status of 404 (…)" konsol hatası üretir. **Adres metinde yoktur**, yalnız `location().url`'dedir. Sonuç: izin listesi yalnız metne bakarsa V4 ve SU05'teki izinli 404'ler yine KALDI üretir (§6.3-1 düzeltmesi). | Ek B.1, B.2 |
| N9-12 (inceleme ölçümü) | **TK05'in sahte kökeni çalışıyor ve https olmalı.** `context.route('https://oyun.ornek/**')` gezinmeyi, bütün alt kaynakları ve **modül işçisi betiğini** (3 istek) yakaladı. Sayfada `isSecureContext === true`; `crypto.subtle` ve `navigator.locks` var. v0.4 bu yerel olmayan kökende `?terrain=crash`'i uyguladı: 3 işçi çöktü, yedek açıldı. Yani K-08 github.io benzeri bir kökende yeniden üretildi. `http://oyun.ornek` güvenli bağlam olmazdı. Faz 2 (`crypto.subtle` HMAC) ve Faz 4 (Web Locks, `crypto.randomUUID`) bu API'leri kullanacağı için TK05 https ile yapılır. | Ek B.3 |
| N9-13 (inceleme ölçümü) | **Bellek.** 08_kalicilik (640×360) koşusunda koşucu ve Chromium süreç ağacının toplam RSS'i en çok **2,4 GB** oldu (açılışta); oyun sırasında 1,8–2,3 GB. Dört oyunculu ve oyuncu başına ayrı Chromium'lu (`--split`, Faz 2) koşuda üst sınır ≈ 4 × 2,4 ≈ 10 GB'tır. Bu 16 GB'lık koşucuya sığar, ama aynı işte iki tarayıcı paketi paralel koşmamalıdır. | Ek B.5 |
| N9-14 (inceleme ölçümü) | **Bu oturumdan okunabilen GitHub uçları.** Vekil üzerinden şunlar okunabiliyor: `actions/runs` (16 koşu; `event=dynamic` süzgeci çalışıyor, 762f1c7 için 1 sonuç), `deployments` (6 kayıt; `762f1c7` ve `ba85510` için ikişer, yani iki yayıncı), `commits/{sha}/pulls` (762f1c7 için 0), `rulesets` (`[]`) ve `rules/branches/claude/hopeful-cray-o1jw6w` (`[]`; canlı dalda bugün hiçbir kural yok). `/pages` ve `/environments*` vekil tarafından 403 ile reddediliyor. Depo herkese açık (`visibility: public`). | Ek B.4 |''')

# ---------------- §0.3 ----------------
rep(103, '| K9-16 |', r'''| K9-16 | Uygulama zamanı | (inceleme düzeltmesi) Şu adımlar Faz 1'in **ilk adımı** olarak öne çekilir: **Y1** (koşucu sıkılaştırma ve rapor şeması 2), **Y3** (test kipi; `surum.js` ve `__dkDurum` dahil, §8.2), Y0'ın bunlara ait kırmızı taban araçları ve **Y9a** (v0.5'teki bugünkü `pages.yml`'nin `deploy` işine ref koşulu ve `cancel-in-progress: false`; K-03'ün v0.5 için açık yolunu kapatır, canlıya dokunmaz). Y2 (`package.json`, kilit, `kos.mjs`) Y3'ün önkoşulu değildir ve Faz 9'da kalır. Faz 1–8 kapanışlarında ham `dk-test-raporu/2` raporları `docs/v05/kosular/faz<N>/` altına arşivlenir. `docs/v05/raporlar/` iskeleti ve elle güncellenen `durum.json` da Y1 commit'iyle açılır (§7.3). **Uygulama koşulu:** `faz1_brief.md` bu kararla çelişiyor: K-08'i Faz 9'a bırakıyor ve Y1–Y3'ü içermiyor. Faz 1 başlamadan önce brief'e Y1, Y3 ve Y9a eklenmeli, "K-08 Faz 9'da" notu kaldırılmalıdır. Gerekçe: Faz 2, 5 ve 6 `?test=1`'e dayanıyor; yutulan hatalar her fazın sonucunu bozar; K-08 ve K-03 güvenlik açığıdır (master_prompt §16: "acil güvenlik düzeltmeleri" istisnası). | Hepsi Faz 9'da: Faz 1–8 sonuçları onaysız ve hata yutan koşucuyla alınır. |''')
sub(104, "Katalog benzersiz ad ister. |",
    "Katalog benzersiz ad ister. " + D + " Kontrol kodları da çakışıyor: Faz 3'ün `YP01` (yapı türleri) ve `YD01–YD04` (yüksek düşme) kodları bu belgenin `YP01–YP13` (yayın politikası) ve `YD01–YD09` (canlı duman) kodlarıyla aynı. Toplayıcı ve raporlar kodu her zaman senaryo adıyla yazar (`yayin_duman:YD05`, `25_yuksek_dusme:YD01`); çıplak kodla eşleme yapılmaz. Bu düzeltmeler ve `22e_gemi_dalga`'nın Faz 3'e atanması (§6.8 T17) `KARARLAR.md`'ye ek olarak işlenir. |")
ins(104, r'''| K9-18 (inceleme düzeltmesi) | Canlıya almadan önce sunucu tarafı koruma | §2.13'teki ortam dal kuralına ek olarak **durum denetimi içermeyen ilk ruleset** hemen kurulur: silme yasağı, zorla push yasağı, PR zorunlu (0 onay), atlama listesi boş. Canlı içeriği değiştirmez. Yanlış dala yapılan bir push'u (ajan dahil) sunucu tarafında reddeder. Durum denetimleri canlıya almada eklenir (§2.12 adım 5). Doğrulama API ile yapılabilir: `rules/branches/<yayın dalı>` (N9-14). | Yalnız canlıya almada kurmak: Faz 1–8 boyunca canlı dal yalnız dosya düzeyindeki filtreye ve dikkate kalır. |
| K9-19 (inceleme düzeltmesi) | Gerekli kontrol adları | Ruleset'te matris adları (`tam (1)`…) yerine iki kararlı ad gerekli yapılır: `ci.yml`'deki toplayıcı **`kapi`** işi ve `yayin-denetimi.yml`'deki `yayin_onkosul`. `kapi`, o olayda koşması gereken her işin `success` olmasını ister; atlanan iş başarı sayılmaz. | Matris adlarını tek tek gerekli yapmak: parça sayısı değişince ruleset de değişmeli. Ayrıca GitHub `if:` ile atlanan gerekli bir işi "başarılı" sayar. |
| K9-20 (inceleme düzeltmesi) | Test kipinde sinyal sunucusu | `?peerhost` test kipinde bile yalnız geri döngü adresi olabilir (`127.0.0.1`, `localhost`, `[::1]`); başka değer yok sayılır. | Her değer: README'nin "Yerel" yönergesiyle oyunu `localhost`'ta açan bir oyuncu, bağlantıyla kötü bir sinyal sunucusuna yönlendirilebilir (§5.1). |
| K9-21 (inceleme düzeltmesi) | CI süre bütçesi | `coop2` 2 parçaya bölünür: hesap ~75 dk ediyor, tek işte 120 dk sınırına yakın. `tam` 4 parça kalır (hesap ~2,8 sa → ~42 dk/parça). Hedef "en uzun parça ≤ 45 dk"tır; parça sayısı ilk ölçüm koşusundan sonra `tests/kabul/sureler.json`'a göre ayarlanır ve K9-19 sayesinde ruleset değişmez. 20 dakikadan uzun ya da tekrarlı koşular `dayaniklilik` işine gider: 52_uzun_oturum_gercek, 08f_coop_uzun, 06c/06z `--repeat 10`, 10_uzun_oturum, kamera_tarama. | Taslaktaki tek `coop2` işi ("30–60 dk") ve `tam`'daki uzun koşular: daha yavaş bir koşucuda zaman aşımı. |''')

# ---------------- §1.3 ----------------
sub(141, "ilk commit'i `d6e716f` olduğu için daraltılmış filtreyi taşıyordu.",
    "uç commit'leri `d6e716f`'den türediği için daraltılmış filtreyi taşıyordu (" + D + " belirleyici olan dalın ilk commit'i değil, her gönderimin ucudur).")
sub(639, "| `pull_request` olayı: statik, duman, tek, coop2, tam ×4, kayıt |",
    "| `pull_request` olayı: statik, duman, tek, coop2 ×2, tam ×4, `kapi`, kayıt; `yayin-denetimi.yml`: `yayin_onkosul` (" + D + ") |")
sub(151, "O ayar okunamadı (`/environments` API 403).",
    "O ayar okunamadı (`/environments` API 403). " + D + " GitHub, `github-pages` ortamını kendiliğinden oluştururken birçok depoda varsayılan dala sınırlı bir dağıtım kuralı da kuruyor. Topluluk kayıtlarında sık görülen \"Branch … is not allowed to deploy to github-pages due to environment protection rules\" hatası bundan gelir. Yani bu kaza yolu bugün zaten kapalı olabilir. Ancak bu depoda doğrulanamadığı için buna dayanılmaz ve §2.13'teki ara önlem geçerliliğini korur.")
ins(157, r'''7. (inceleme düzeltmesi) **İzleme sınırı.** `ci.yml` ve `yayin-denetimi.yml` push olayında gönderilen commit'ten okunur. Yani yalnız onları taşıyan dallarda koşarlar. K-02'nin riskli yolu, v0.3'ten açılan yeni dal, bu dosyaları taşımaz. Böyle bir dalda yapılan yayını hiçbir depo içi denetim göremez. Bu yüzden T62'nin çalışma anı denetimi (YP10) **depo geneline** bakar: son 30 günde `head_branch ≠ yayın dalı` olan "GitHub Pages" koşusu ve `ref ≠ yayın dalı` olan `github-pages` dağıtımı 0 olmalıdır. Aynı sorgu bu oturumun vekilinden de çalışıyor (N9-14). Ajan bunu her faz kapanışında `node tests/node/yayin_politikasi.mjs --canli --tum` ile koşar ve sonucu DEPLOYMENT_REPORT'a yazar. Canlıya alındıktan sonra açılan dallar `yayin-denetimi.yml`'yi devralır.
8. (inceleme düzeltmesi) **Bugünkü durum yeniden okundu (14 Kasım).** `deployments` 6 kayıt döndürdü; hepsinde `ref = claude/hopeful-cray-o1jw6w`. `rules/branches/claude/hopeful-cray-o1jw6w` boş liste döndürdü. Yani bugüne dek kaza olmamış, ama canlı dalda sunucu tarafında hiçbir kural yok. K9-18 bunu kapatır.''')
app(161, " " + D + " Bu yol bugün v0.5 dalı için de açıktır: v0.5'teki `pages.yml` hâlâ v0.4 sürümüdür ve `deploy` işinde ref koşulu yoktur. Y9a (K9-16) bu koşulu Faz 1 başında ekler. Ajan canlıya almadan önce hiçbir iş akışını elle tetiklemez (R20). Ortam dal kuralı (§2.13) kurulursa yol sunucu tarafında da kapanır.")

# ---------------- §1.8 ----------------
rep(229, '- `kamera_tarama/`', r'''- `kamera_tarama/`: 6 ölçüm betiği. (inceleme düzeltmesi) Her birinde 1 onay var ("Oyun başladı"). K-13'ten sonra bunlar 1/1 GEÇTİ görünür, oysa asıl ölçüt `analiz.cjs`'tedir. Bu yüzden `{meta:{olcum:true}}` alırlar ve katalogda kanıt sayılmazlar. `coop/v03_coop3_referans.cjs` kendi tarayıcısını açar ve `coop.cjs`'den geçmez; `testUrl` onu kapsamaz. Yalnız v0.3/v0.4'e karşı koşulur ve kataloğa girmez.''')
rep(231, 'Taban: 25 koşunun', r'''Taban: 25 koşunun 23'ü tam geçti. Kalanlar 09_performans 8/9 ve 06c 2/7 (`00_BASLANGIC_KAYDI.md` §4). Taban JSON'larında `errors` dizileri hep 0. (inceleme düzeltmesi) Bu tek başına "K-11 sıkılaştırması yeni kırmızı üretmez" sonucunu taşımaz. `404` içeren konsol iletileri süzüldüğü ve bir 404 yanıtı `requestfailed` üretmediği için gizli 404'ler tabanda zaten görünmezdi. Ölçüm (Ek B.1): 00_acilis ve 08_kalicilik'te gizli 404 ve konsol hatası 0. 02_arazi_yedek'in `badurl` kipinde beklenen 3 × 404 ve 3 × `requestfailed` var; bu kip tabanda koşulmamıştı ve gerekçeli izin ister (§6.3-2). Kalan 22 koşunun kanıtı Y1 kabulüdür: tabanda geçen her koşu yeni koşucuyla da geçmelidir. Geçmeyen her izinsiz hata ya düzeltilir ya da gerekçesiyle izin listesine girer.''')

# ---------------- §1.10 ----------------
rep(263, '| K-02 |', r'''| K-02 | Canlı dalda `'claude/**'` | v0.5'te yeni `pages.yml` (push yalnız yayın dalı + ref koşulu); canlıya alınca yeni dallar devralır; **hemen**: ortam dal politikası; (inceleme düzeltmesi) hemen: durum denetimsiz ilk ruleset (K9-18) | [İA] [KU] | Y9, Y12, §2.13 | Yeni bir `claude/*` dalına push'ta yayın işi yok (koşu yok ya da `skipped`). `deployments?sha=` boş. (inceleme düzeltmesi) Depo geneli: son 30 günde yayın dalı dışında "GitHub Pages" koşusu ve `github-pages` dağıtımı 0 (YP10 `--tum`, §1.3-7). |''')
rep(269, '| K-08 |', r'''| K-08 | `?peerhost`, `?terrain` | `testParam()` yalnız test kipinde; (inceleme düzeltmesi) `peerhost` test kipinde de yalnız geri döngü adresi (K9-20) | [OK] | Y3 | 53_test_kipi: test kipi yokken `?peerhost` yok sayılır, `?terrain=crash` `mode===''`. (inceleme düzeltmesi) Test kipinde `peerhost=10.9.9.9` yok sayılır, `127.0.0.1` kabul edilir (TK08). |''')
rep(272, '| K-11 | Konsol', r'''| K-11 | Konsol hatası ve 404 sayılmıyor | Koşucu: her konsol hatası ve ağ hatası başarısızlıktır; izin listesi senaryo metasında ve gerekçeli. (inceleme düzeltmesi) İzin, ileti metni ve `location().url` üzerinde eşlenir; adres içermeyen "Failed to load resource" iletisi ağ kaydıyla tekilleştirilir (N9-11, §6.3-1). Kural oyun döngüsündeki istisnaları da kapsar: `engine.js:66` güncelleyici istisnalarını yalnız `console.error`'a yazıyor ve bugün bunlar çıkış kodunu etkilemiyor (`00_BASLANGIC_KAYDI.md` §4, 14 Kasım düzeltmesi) | [KO] | Y1 | Bozuk kopya (`chest.glb` silinmiş) ile 02_tek_dosya kalıyor. (inceleme düzeltmesi) Tabanda geçen 23 koşu yeni koşucuyla da geçiyor. badurl kipinde yalnız izinli 3 × 404 ve 3 × `requestfailed` var. |''')
sub(274, "v03 betikleri kataloğa giremez. |",
    "v03 betikleri kataloğa giremez. " + D + " `kamera_tarama/*.js` (1 onay) `meta.olcum` alır; `coop/v03_coop3_referans.cjs` kataloğa girmez. |")
rep(282, '| A-16 |', r'''| A-16 | Köken `null` bağlamı | (inceleme düzeltmesi) **Faz 1 uygular** (`faz1_brief.md` madde 13): `location.protocol==='file:' \|\| self.origin==='null'` → `data:`; `blob:` kurulumu hata atarsa `data:` ile ikinci deneme. Faz 9 prelude'u ikinci kez yazmaz, yalnız 54'teki http'den sunulan iframe testini ekler. | [DA] (Faz 1) | Faz 1; Y4 (yalnız test) | 54_tek_isci: `sandbox="allow-scripts"` iframe içinde ≥ 1 işçi ya da açık yedek, sayfa hatası 0. |''')

# ---------------- §2.1–2.2 ----------------
rep(294, '  - `geri-donus.yml`.', r'''  - `geri-donus.yml`;
  - (inceleme düzeltmesi) `yayin-denetimi.yml` (`branches-ignore`, `pull_request.branches`) ve `ci.yml`'deki `coop2`, `tam`, `kapi` koşulları (`github.ref != 'refs/heads/…'`).''')
sub(300, "iş akışlarındaki 7 dizge", "iş akışlarındaki bütün dizgeler (" + D + " düzeltilmiş dosyalarda sayı 7'den fazladır; YP08 hepsini bulur)")
rep(314, '| `ci.yml` | `push` |', r'''| `ci.yml` | `push` | `branches-ignore: ['claude/hopeful-cray-o1jw6w']` | statik, duman, tek, `kapi`; yayın dalı dışında `[tam]` etiketiyle coop2 ve tam. (inceleme düzeltmesi) Yayın denetimi `yayin-denetimi.yml`'ye taşındı (N9-10). |''')
rep(315, '| `ci.yml` | `pull_request` |', r'''| `ci.yml` | `pull_request` | `branches: ['claude/hopeful-cray-o1jw6w']` | statik, duman, tek, coop2 (2 parça), tam (4 parça), `kapi`, kayıt |''')
ins(317, r'''| `yayin-denetimi.yml` (inceleme düzeltmesi, yeni) | `push` | `branches-ignore: ['claude/hopeful-cray-o1jw6w']` | `yayin_denetimi`: YP10 depo geneli (T62) |
| `yayin-denetimi.yml` | `pull_request` | `branches: ['claude/hopeful-cray-o1jw6w']` | `yayin_onkosul`: Pages kaynağı `workflow` mı (ruleset'te gerekli) |
| `dayaniklilik.yml` (inceleme düzeltmesi, yeni) | `schedule` (haftalık), `workflow_dispatch` | — | Uzun ve tekrarlı koşular (K9-21). İkisi de iş akışının varsayılan dalda olmasını ister; canlıya almadan önce aynı paket bir kez yerelde koşulur. |''')

# ---------------- §2.5–2.6 ----------------
app(382, " " + D + " Ruleset ve dal kuralları bu oturumdan API ile doğrulanabilir: `gh api repos/{r}/rules/branches/claude/hopeful-cray-o1jw6w` (14 Kasım'da `[]`). Ortam ayarı vekilde 403 olduğu için yalnız ekran görüntüsüyle (E4) ve ilk \"Waiting for review\" gözlemiyle doğrulanır. CI içinde `GITHUB_TOKEN` okumaya izin verirse `yayin_onkosul` `environments/github-pages/deployment-branch-policies`'i de okur ve sonucu bilgi olarak yazar. Okuyamazsa kırmızı olmaz, \"doğrulanamadı\" yazar **[BELİRSİZ]**.")
rep(395, '  - ✔ **Require status checks to pass**', r'''  - ✔ **Require status checks to pass** → ✔ Require branches to be up to date before merging → kontroller: (inceleme düzeltmesi) yalnız **`kapi`** ve **`yayin_onkosul`** (K9-19). `kapi`, `ci.yml`'deki bütün test işlerinin (statik, duman, tek, coop2 ×2, tam ×4) `success` olmasını ister. Matris adları gerekli yapılmaz. Aksi hâlde parça sayısı değişince ruleset'in de değişmesi gerekirdi; ayrıca GitHub, `if:` ile atlanan gerekli bir işi "başarılı" sayar.''')
app(397, " " + D + " Bu, durum denetimli **son** sürüm içindir. Durum denetimsiz ilk sürüm (silme ve zorla push yasağı, PR zorunlu) hemen kurulur (K9-18, §2.13). Son sürümde ona yalnız iki gerekli kontrol eklenir.")

# ---------------- §2.10 ----------------
rng(484, 488, '  test:', r'''  test:
    if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'
    permissions:
      contents: read      # (inceleme düzeltmesi) çağrılan ci.yml'deki her iş bununla yetinir; fazlasını isteyen iş koşuyu başlamadan düşürür (N9-10, YP11)
    uses: ./.github/workflows/ci.yml
    with:
      kapsam: hizli''')
rep(517, '        with: { path: _site, retention-days: 7 }', "        with: { path: _site, retention-days: 30 }   # (inceleme düzeltmesi) R1b: yeniden koşma penceresiyle (30 gün) aynı")
ins(579, r'''- (inceleme düzeltmesi) **İzinler ve çağrılan iş akışı.** `test` işi `ci.yml`'yi çağırır. Çağrılan iş akışındaki hiçbir iş, çağıranın verdiğinden (`contents: read`) geniş izin isteyemez; isterse koşu başlamadan düşer (N9-10). İzin isteyen denetimler bu yüzden `yayin-denetimi.yml`'dedir. YP11 bunu her commit'te denetler.
- (inceleme düzeltmesi) **`[tam]` etiketi yayın hattını uzatmaz.** `ci.yml`'deki `[tam]` koşulu yalnız yayın dalı dışındaki push'ta geçerlidir (§3.2). Sıkıştırılmış birleştirmenin iletisinde `[tam]` geçse bile yayın hattında yalnız hızlı kapsam koşar.
- (inceleme düzeltmesi) **Yapıt saklama süresi 30 gün.** Önceki bir yayın, o koşunun `yayinla` işi yeniden koşturularak aynı baytlarla geri getirilebilir (R1b, §2.12). GitHub yeniden koşmayı 30 günle sınırlar; saklama süresi bu yüzden 30 gündür. Yeniden koşturulan işin aynı koşunun yapıtını kullandığı burada doğrulanamadı **[BELİRSİZ]**.''')

# ---------------- §2.11 ----------------
rng(619, 620, '- `--eski-agac-izni`', r'''- (inceleme düzeltmesi) `--eski-agac-izni` üç araçta da gerekir:
  - `build-single-html.mjs`: eski `index.html`'de `dk-build`/`dk-version` meta'sı yoksa onları `<head>`'e **ekler**. CSP meta'sı yoksa CSP adımını atlar ve özete `csp:'yok'` yazar.
  - `tek-html-denetle.mjs`: S9, S10 ve S13 yerine "eski ağaç" notu yazar; v0.3 ve v0.4'te `window.DK` koşulsuzdur.
  - `site-hazirla.mjs`: `testmode.js` yoksa saplama adımını uyarıyla atlar.

  v0.3 ağacının işçi ifadesi (`terrain.js:44`: `new Worker(new URL('./terrainWorker.js', import.meta.url), …)`) `WORKER_URL` dizgesini içerdiği için derleme düşmez. Lisans dosyaları v0.3'te de var (`git ls-tree 762f1c7`).
- Kısıtlı duman testi (`yayin_duman.mjs --profil geri-donus`) damga ve açılışa bakar. v0.3'te `window.DK` açık olduğu için `DK` yokluğunu denetlemez. (inceleme düzeltmesi) Taslakta bu test metinde vardı ama YAML'da iş yoktu; `duman` işi eklendi. `ref` girdisi kabuğa `${{ }}` ile değil ortam değişkeniyle gelir ve 40 haneli sha olarak doğrulanır (betik enjeksiyonu, YP12).
- (inceleme düzeltmesi) **Prova (Y9 kabulü).** `derle` adımları yerelde 762f1c7 ve 44d548c ağaçlarına karşı koşulur. Her ikisinde `_site` üretilmeli ve `kos.mjs yerel-yayin --profil geri-donus` geçmelidir. Prova geçmeden R1 "hazır" sayılmaz.''')
rng(583, 617, '```yaml', r'''```yaml
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
```''')

# ---------------- §2.12 ----------------
ins(630, r'''- (inceleme düzeltmesi) "Canlıya al" komutu bu tablodaki [AJ] adımlarını, birleştirme dahil, kapsar; ajan ayrıca soru sormaz. [KU] adımlarını DEPLOYMENT_REPORT'ta yapılacaklar listesi olarak bildirir ve kullanıcının yapmasını bekler.''')
cel(640, "(inceleme düzeltmesi) K9-18'deki ilk ruleset'e `kapi` ve `yayin_onkosul` gerekli kontrolleri eklenir; doğrulama `rules/branches/…` API'siyle yapılır.")
sub(642, "**İsteğe bağlı prova:**",
    D + " **Zorunlu prova** (kaynak değişince mevcut yayının sunulmaya devam ettiği doğrulanamadı, §2.7; prova ortam onayını da gerçek birleştirmeden önce sınar):")
sub(642, "| Koşu yeşil; dinamik koşu yok |",
    "| Koşu yeşil; dinamik koşu yok; " + D + " prova sonrasında açılış ve tek HTML adresi 200 (`yayin_duman --profil geri-donus --url …`) |")
sub(643, "(ya da kullanıcı onayıyla [AJ]:", "(ya da \"canlıya al\" komutu kapsamında [AJ]:")
rep(659, '| R3 |', r'''| R3 | 31 Ekim'deki başarılı koşuyu (41221950903) **Re-run** etmek: `762f1c7`'yi eski hatla (path `.`) yeniden yayınlar | ~2 dk | (inceleme düzeltmesi) **Pratikte yok.** GitHub yeniden koşmayı 30 günle sınırlar; pencere yaklaşık 30 Kasım 2026'da kapanır. Faz 1–8 o tarihe dek bitmeyeceği için canlıya almada kullanılamaz. Yerine R1 ve R1b vardır. |''')
ins(657, r'''| **R1b** (inceleme düzeltmesi; ikinci ve sonraki yayınlar) | Bir önceki başarılı yayın koşusunda `yayinla` işini **Re-run** etmek (30 gün içinde; yapıt 30 gün saklanır) | ~5 dk + onay | Aynı baytları yeniden yayınlar; eski ağacı yeni araçla derlemez. Yeniden koşturulan işin aynı koşunun yapıtını kullandığı doğrulanamadı **[BELİRSİZ]**; kullanılamazsa R1. |''')

# ---------------- §2.13 ----------------
ins(669, r'''
(inceleme düzeltmesi) **Durum denetimsiz ilk ruleset (K9-18); hemen kurulabilir:**
- Settings → Rules → Rulesets → New branch ruleset → ad `yayin-dali-koruma`, Enforcement **Active**, Bypass list **boş**, hedef `claude/hopeful-cray-o1jw6w`.
- ✔ Restrict deletions, ✔ Block force pushes, ✔ Require a pull request before merging (Required approvals: 0). **Require status checks işaretlenmez**; kontroller canlıya almada eklenir (§2.12 adım 5).
- Etkisi: canlı içerik ve canlı dalın ucu değişmez. Faz 1–8 boyunca yanlış dala yapılan bir push (ajan dahil) sunucu tarafında reddedilir. Bu, "Ana dalı ve canlı oyunu koru" kuralının (master_prompt §2, madde 2) sunucu tarafı güvencesidir.
- Doğrulama: `gh api repos/adnanerdem2000-sudo/SON-HAZ-NE/rules/branches/claude/hopeful-cray-o1jw6w` çıktısında `deletion`, `non_fast_forward` ve `pull_request` kuralları görünmeli. Bu oturumun vekili bu yolu okuyabiliyor; 14 Kasım'da sonuç `[]` idi (N9-14). Sonuç DEPLOYMENT_REPORT'un "Ayarlar" tablosuna yazılır.''')

# ---------------- §3.1 ----------------
rng(677, 692, 'Süreler bu ortamdaki taban', r'''Süreler bu ortamdaki taban ölçümüne dayanır (`taban_kosusu_44d548c/summary.txt`). Ortam: 4 çekirdek, SwiftShader. GitHub'ın herkese açık depolardaki `ubuntu-24.04` koşucusu 4 vCPU ve 16 GB'tır. (inceleme düzeltmesi) Deponun herkese açık olduğu API ile doğrulandı (N9-14). Koşucunun SwiftShader hızının bu ortama "benzer" olduğu ise **ölçülmedi**. Bu yüzden ilk CI koşusu bir ölçüm koşusudur: senaryo süreleri `tests/kabul/sureler.json`'a yazılır ve parçalar bu dosyaya göre yeniden dengelenir.

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

Parçalama `tests/kos.mjs --parca i/N` ile yapılır. (inceleme düzeltmesi) Senaryolar depoda tutulan `tests/kabul/sureler.json`'daki sürelere göre açgözlü dengelenir. Dosyada olmayan senaryo için taban ortalaması kullanılır: tek sayfa 61 sn; co-op'ta oyuncu sayısına göre 173, 313 ya da 581 sn. "Son kaydın süreleri" önceki koşunun yapıtından okunmaz. Böylece parçalama belirlenimci olur ve aynı commit her koşuda aynı parçalara bölünür.''')

# ---------------- §3.2 ----------------
rng(696, 807, '```yaml', r'''```yaml
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
```''')
ins(812, r'''- (inceleme düzeltmesi) **Taslaktaki üç hata giderildi.** (1) `yayin_denetimi` ve `yayin_onkosul` çağrılan iş akışında izin yükseltiyordu; bu `pages.yml`'yi başlamadan düşürürdü (N9-10). (2) `[tam]` koşulu yayın hattında da geçerliydi. (3) Gerekli kontroller matris adlarına bağlıydı ve atlanan iş başarı sayılıyordu (K9-19).
- (inceleme düzeltmesi) **`kapi` ve `workflow_call`.** `pages.yml`'den çağrıda `kapi` hızlı kapsamı (statik, duman, tek) denetler. `kapi` kırmızıysa çağıran `test` işi de kırmızı olur ve `derle` atlanır.''')

# ---------------- §3.3 ----------------
rep(816, '- **Bayraklar:**', r'''- **Bayraklar:** `run.cjs:36` ve `coop.cjs:27` bayrakları aynen korunur. (inceleme düzeltmesi) İkisinde de SwiftShader (`--use-gl=angle`, `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`), `--ignore-gpu-blocklist` ve `--disable-gpu-watchdog` var. Arka plan kısmasını kapatan üç bayrak (`--disable-background-timer-throttling`, `--disable-renderer-backgrounding`, `--disable-backgrounding-occluded-windows`) ise **yalnız `coop.cjs:27`'de** var. `run.cjs:36`'da bunların yerine `--autoplay-policy=no-user-gesture-required` ve `--enable-precise-memory-info` var. Tek sayfalık senaryolar tek sekmede koştuğu için bu fark bugün sonucu etkilemiyor. Birden çok sekme açan bir tek sayfa senaryosu yazılırsa bayraklar eşitlenir. Koşucu GL dizgesini rapora yazar (`WEBGL_debug_renderer_info`). Dizgede "SwiftShader" varsa `gercekGPU:false` kaydedilir.''')

# ---------------- §3.6 ----------------
ins(883, r'''- (inceleme düzeltmesi) Metasında `sinyal: true` olan tek sayfa senaryoları için de `tests/peer-server.cjs`'i başlatır ve adrese `peerhost=127.0.0.1&peerport=<p>` ekler (59_ana_menu AM09, 60_dunya_degisimi DD05). Faz 2'nin CSP'si (`connect-src 'self' https://0.peerjs.com wss://0.peerjs.com`, Faz 2 §9.5) yerel sinyal sunucusunu `index.html`'de engeller. Bu yüzden bu senaryolar Faz 2'den sonra `tests/index.test.html` girişinde koşar. Faz 5'in `--peer-server own` seçeneğiyle sunucuyu kendisi yöneten senaryolarda `kos.mjs` ayrı sunucu başlatmaz.''')

# ---------------- §4.2 ----------------
sub(913, "yalnız `TEST=false` yetmez. | K-07 |",
    "yalnız `TEST=false` yetmez. " + D + " **Tek mekanizma:** Faz 2'nin Adım 16'daki \"`netTest.js`'in derlemeden çıkarılması\" işi ayrı bir yöntemle yazılmaz. Bu eklenti Faz 2'de ilk kez `js/test/**` ve `js/net/netTest.js` desenleriyle eklenir; Y4 `netShape`'i, S9'u ve `--test` çeşidini ekler. Saplama yalnız `install` verdiği için bu modüller dışarıya yalnız `install(api)` (ve `MARK`) verebilir. Faz 2'nin `netTest` işlevleri (`invariants`, `audit`, `teleportGuest`…) ve Faz 5'in `netShape` işlevleri (`shape`, `stall`, `cut`, `busy`, `hide`) `install` içinde `DK.netTest`'e bağlanır; `net.js` bunları statik içe aktarmaz. Kural `test_kipi.mjs` kural 2 ile denetlenir. Aksi hâlde üretim derlemesi \"No matching export\" ile düşer. | K-07, Faz 2, Faz 5 |")
rep(915, '| prelude 100-103 |', r'''| prelude 100-103 | (inceleme düzeltmesi) **Faz 1 yapar** (`faz1_brief.md` madde 13, A-16): `opak = location.protocol === 'file:' \|\| String(self.origin) === 'null'` → `data:`, değilse `blob:`; `blob:` kurulumu hata verirse `data:` ile ikinci deneme. Y4 bu satırları yeniden yazmaz; S7'yi (katı kip) ve 54'ü ekler. | A-16 |''')
sub(917, "eşleşme yoksa hata atar. | K-01, K-19 |",
    "eşleşme yoksa hata atar. " + D + " `--eski-agac-izni` ile (geri dönüş, §2.11) meta işaretçisi yoksa `<head>`'e eklenir. CSP meta'sı yoksa CSP adımı atlanır ve özete `csp:'yok'` yazılır. v0.3 ve v0.4'ün `index.html`'inde bu meta'lar yok. | K-01, K-19 |")

# ---------------- §4.4–4.8 ----------------
sub(965, "`net.js:47` `KNOWN`", "`net.js:46` `KNOWN` (" + D + " satır 46)")
rep(955, '- **02_arazi_yedek `badurl` kipi', r'''- **02_arazi_yedek `badurl` kipi (inceleme düzeltmesi).** Bugünkü kodda bu kip yalnız `file://` altında anlamsızdır: `terrain.js:61` `data:` adresine `#missing` ekler ve adres yine yüklenir. http altında ise adres `blob:…#missing` → `blob:…-missing` olur ve işçi gerçekten yüklenemez. Faz 1, kipi `data:`/`blob:` altında da bozuk içerik verecek biçimde düzeltecek (`faz1_brief.md` madde 14, A-17). Bu yüzden kip Faz 1'den sonra eşdeğerlik paketine **alınır**. Faz 1 bunu yapmazsa kip paket dışında kalır; tek HTML'de "işçi bulunamadı" durumu noworker ve 54'teki kurulum hatasıyla sınanır.''')
sub(990, "köken `null`) |",
    "köken `null`; " + D + " sabit sayfa `tests/sunucu.cjs` ile **http'den** sunulur. Böylece iframe'de `location.protocol === 'http:'` ve `self.origin === 'null'` olur. `file://`'dan açılsaydı A-16'nın kendi dalı değil `file:` dalı sınanırdı) |")
sub(1003, "Bu hata yalnız bu adım için izin listesindedir. |",
    "Bu hata yalnız bu adım için izin listesindedir. " + D + " İzin adres üzerinden eşlenir (`yok\\.glb`). `file:` altında ileti adresi içerir (\"Fetch API cannot load file:///…/yok.glb …\"). http altında ise \"Failed to load resource: … 404\" iletisi adresi yalnız `location().url`'de taşır (N9-11). |")
rep(1070, '  - yerel `yedek-v0.3` etiketi;', "  - yerel `yedek-v0.3` etiketi (" + D + " kalıcı değildir: etiket GitHub'a gönderilemedi ve oturum klasörü silinince kaybolur, `00_BASLANGIC_KAYDI.md` §2; kalıcı kopya git geçmişi ve canlı daldır);")

# ---------------- §5 ----------------
sub(1137, "Tek istisna kurbanın kendisinin yerel sunucu çalıştırmasıdır; bu geliştirici durumudur ve belgelenir.",
    "Tek istisna kurbanın kendisinin yerel sunucu çalıştırmasıdır; bu geliştirici durumudur ve belgelenir. " + D + " Bu istisna yalnız geliştiriciyi ilgilendirmez: README'nin \"Oynamak için → Yerel\" maddesi (README.md:19-23) oyunculara da `python3 -m http.server 8080` ile `http://localhost:8080` açmalarını söylüyor. Sunucusu açık bir oyuncu `http://localhost:8080/?join=…&test=1&peerhost=kotu.ornek` bağlantısıyla yine yönlendirilebilir. Bu yüzden `peerhost` test kipinde de yalnız geri döngü adresi olabilir (K9-20, §5.4). `DK`'nin yerelde açılması kabul edilen kalıntıdır, çünkü yalnız oyuncunun kendi tarayıcısını etkiler. README'nin \"Yerel\" maddesine şu not eklenir (Y10): \"Oynamak için canlı adresi ya da tek HTML'i kullanın; yerel sunucu geliştirme içindir.\"")
rng(1219, 1222, '  ```js', r'''  ```js
  const GERI_DONGU = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);   // (inceleme düzeltmesi) K9-20
  const h = testParam('peerhost');
  if (h && GERI_DONGU.has(h)) { o.host = h; o.port = +(testParam('peerport') || 9000); o.path = testParam('peerpath') || '/'; o.secure = testParam('peersecure') === '1'; }
  ```''')
ins(1243, r'''- (inceleme düzeltmesi) **`goto` adımı ve `beforeunload`.** `main.js:382-384` oyun sürerken `beforeunload`'da `preventDefault()` çağırıyor. Sayfada kullanıcı etkileşimi (tıklama) olmuşsa gezinme bir onay penceresi açar. Playwright pencereleri varsayılan olarak kapatır ve bu gezinmeyi durdurabilir. `goto` adımı bu yüzden `beforeunload` penceresini kabul eder (`page.on('dialog', d => d.type() === 'beforeunload' && d.accept())`) ve bunu rapora yazar.
- (inceleme düzeltmesi) **Koşu değişkenleri.** Senaryo dosyaları durağandır. Beklenen damga gibi koşuya özgü değerler `--degisken ad=deger` ile verilir ve `addInitScript` ile sayfaya `window.__KOSUCU = {…}` olarak konur. 02_tek_dosya'nın "damga = beklenen", TU04 ve SU04 kontrolleri bunu kullanır. Bu olmadan bu kontrollerin karşılaştıracağı bir değer yoktur.''')
rng(1249, 1251, '3. **Tarayıcı kanıtı (Y3 kabulü):**', r'''3. **Tarayıcı kanıtı (Y3 kabulü):** Taban listesi yeni kod ve yeni koşucuyla (`test=1` kendiliğinden) koşulur:
   - 20 tek sayfa senaryosu, 5 co-op senaryosu ve 02_arazi_yedek'in dört kipi.
   - (inceleme düzeltmesi) Ölçüt kararsız testlere dayanmaz: tabanda geçen **23 koşunun ve 246 kontrolün hepsi** geçmelidir. 09_performans ve 06c'nin sonucu kaydedilir; geçmeleri de kalmaları da kabul edilir, ama kalırlarsa yalnız tabanda kalan kontrollerde. 06c tabanda kararsızdı (önceki kayıtlarda 5/7 koşuda geçti); 09'un kalan kontrolü de "kararsız ya da sızıntı" diye kayıtlı. Taslaktaki "aynı iki kalan" ölçütü bu yüzden ölçülemezdi. `DK.mod` dönüşümü yapılan altı dosyada kontrol sayıları değişmemelidir.
   - (inceleme düzeltmesi) 02_arazi_yedek'in noworker, badurl ve crash kipleri v0.4 tabanında koşulmadı; taban betiği yalnız normal kipi koşturdu (`00_BASLANGIC_KAYDI.md` §4, 14 Kasım düzeltmesi). Bu üç kipin "önce" kaydı Faz 1'in "önce" ölçümünde v0.4'e (8080) karşı alınır. Y1 aynı koşuyu yinelemez, o raporu kullanır; yeni kod onunla karşılaştırılır.''')

# ---------------- §6.1 ----------------
rep(1276, '| `tarayici` | Gerçek tarayıcı', r'''| `tarayici` | Gerçek tarayıcı (Chromium başsız, SwiftShader yazılımsal GPU). Oyun kendi döngüsüyle (rAF) ve **çizimle** koştu. | (inceleme düzeltmesi) Son gezinmeden (`goto`/`reload`) bu kontrole kadar `DK.__sayac` hiç değişmedi. Yalnız kontrolün kendi adımına bakmak yanlıştır: denetlenen durumu önceki bir `js` adımındaki `DK.sim` üretmiş olabilir. |''')
rep(1277, '| `tarayici+benzetim` |', r'''| `tarayici+benzetim` | Gerçek tarayıcı, ama oyun mantığı `DK.sim`, `DK.press`, `DK.frames` ya da `DK.simSteps` (Faz 3) ile **çizimsiz ve benzetilmiş kare süreleriyle** ileri sarıldı | Aynı aralıkta sayaç farkı > 0. (inceleme düzeltmesi) Aralık son gezinmeden başlar; `frames` ve `simSteps` de sayılır. Fark (`sim` çağrısı, adım sayısı) kayda yazılır. |''')

# ---------------- §6.3 ----------------
ins(1327, r'''
   (inceleme düzeltmesi) **Eşleme ve tekilleştirme.** İzin listesi ileti metniyle birlikte iletinin `location().url`'sine de uygulanır. Sayfa düzeyindeki bir 404, Chromium'da adres içermeyen "Failed to load resource: the server responded with a status of 404 (…)" iletisi üretir (N9-11). Bu ileti, ağ kaydındaki aynı adresli ≥ 400 yanıtıyla eşlenir ve yalnız bir kez, `hatalar.ag`'da sayılır. Eşlenemeyen "Failed to load resource" iletisi konsol hatası olarak kalır.''')
app(1328, " " + D + " Ölçüm: modüler sürümde badurl kipi 3 × 404 yanıtı ve 3 × `requestfailed net::ERR_FAILED` üretiyor; ikisi de aynı izinle kapanır. crash kipinde işçideki istisna sayfa konsoluna yansımadı (Ek B.3); izin gerekmeyebilir, gerekirse koşu bunu gösterir.")
ins(1339, r'''   - (inceleme düzeltmesi) Eksik adım türleri:
     - `tikla` (`{tikla: 'css=…'}` ya da `{tikla: {metin: 'YENİ MACERA'}}`): `page.locator(…).click()` ile görünürlük ve isabet denetimli tıklama. Bugünkü `click: [x, y]` koordinat adımı bunun yerini tutmaz.
     - `bekleSecici` (`waitForSelector`).
     - `degisken` (§5.6).
     - `metrikKarsilastir` (`{metrikKarsilastir: {once: 'm1', sonra: 'm2', alan: 'listeners', enCokFark: 5, label}}`). Bugünkü `metrics` adımı (`run.cjs:87`) CDP değerlerini yalnız yazar, onaylayamaz.

     56 TU05, 57 SU06, 59 AM01–AM10 ve 60 DD05 bu adımlara dayanır.
   - (inceleme düzeltmesi) **Etiket eşleme dosyası.** Bir faz bir taban kontrolünün etiketini değiştirirse eski → yeni eşlemesi gerekçesiyle `tests/kabul/etiket_esleme.json`'a yazılır. Yoksa toplayıcı eski etiketi "KAYIP" sayar ve kapı kalır (§7.4-7).''')

# ---------------- §6.4, §6.6 ----------------
rep(1395, '- Sayısal önekler KARARLAR.md', r'''- Sayısal önekler KARARLAR.md'deki faz aralığına uyar. (inceleme düzeltmesi) Kural yalnız `planlanan: true` başvurulara uygulanır; sahibi faz `planlayan` alanında yazılır. Bugünkü senaryolara (00–17) her faz başvurabilir (ör. T01, `faz: [1, 9]` ile 00_acilis'e). Örnek: `planlayan: 4` olan yeni bir başvuru `23`–`26` ya da `06o`–`06q` kullanır.''')
app(1415, " " + D + " Yeni bir senaryo v0.4'te özellik yüzünden değil test API'si yüzünden de kalabilir (`DK.mod is not a function`, `DK.frames` yok…). Bu, özelliğin yokluğu demek değildir. Toplayıcı bu hatayı \"ÖNCE UYGULANAMAZ (test API'si yok)\" diye ayrı yazar ve KALDI saymaz. Faz 7'nin F7-0 gözlem kipinde \"uygulanamaz\" diye raporladığı kontroller (Faz 7 Ç-9) de aynı durumla kaydedilir. CI'da 8080 sunucusu yoktur; orada \"önce kaynak 2\" için `--taban-commit 44d548c` bir `git worktree` açar ve onu sunar.")

# ---------------- §6.8 ----------------
sub(1467, "Faz 7 ve 8'in adları kendi tasarımlarında verilecek.",
    D + " Faz 7'nin adları nihai Faz 7 tasarımından (`FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md`: 37_dusman_algi … 44_kamera_dar_alan; 08a_savas_esitligi, 08b_boss_konuk, 08c_dusman_ag_lod), Faz 8'inkiler taslaktan (`faz8_tasarim.md`: 45_perf_matris … 52_uzun_oturum_gercek; 08d–08f) alındı. Nihai Faz 8 belgesinde değişirse katalog güncellenir. `katalog.mjs`, dosyası henüz olmayan senaryoyu `planlanan` alanıyla ayırt eder.")
sub(1486, "| F3 17 K13–K14, 22a GV06; EL gerçek GPU turu |", "| F3 17 K13–K14, 22a GV06; " + D + " F7 44_kamera_dar_alan; EL gerçek GPU turu |")
sub(1487, "| F3 FD06, 22a GV01; **eksik:** yalpa/vurma genliği, batmama, FPS bağımsızlığı → öneri `22e_gemi_dalga` (K9-17) |",
    "| F3 FD06 (yatay yol ve hız; dalga değil), 22a GV01 (güverte–oyuncu farkı); **eksik:** yalpa, vurma ve kalkma genliği; batmama; dalga tepkisinin FPS'ten bağımsızlığı. " + D + " Hiçbir faz bunu planlamıyordu. **`22e_gemi_dalga` Faz 3'e atanır** (KARARLAR.md eki): GD01 sabit hava ve `resetClock` ile 15/60/144 FPS'te 20 sn boyunca yalpa, vurma ve kalkma tepe değerleri ≤ 1 cm ve ≤ 0,05° (Faz 3 FD ölçütleri); GD02 fırtınada su alma kapalıyken batma yok; GD03 karaya oturma (T18). |")
sub(1488, "öneri 22e: karaya oturma", "22e GD03 karaya oturma (" + D + " Faz 3'e atandı)")
sub(1493, "| F2 06e B-15 + doğru şifreyle katılım, `info`'da `pw:true` |",
    "| F2 06e B-15 (yanlış şifre ve kilit). " + D + " Doğru şifreyle katılım hiçbir fazda planlı değildi; **Faz 2'nin `06j_mesru_oyun` senaryosuna eklenir** (KARARLAR.md eki): şifreli oda kur → doğru şifreyle katıl → `info.pw === true` ve roster 2. |")
sub(1500, "| F2 06h; F7 37–44 |", "| F2 06h; " + D + " F7 40_savas_adaleti, 08a_savas_esitligi |")
sub(1501, "| F7 37–44 (uçtan uca), 08a–08c (co-op); F6 28–32, 35 |", "| " + D + " F7 41_boss_deniz, 42_boss_kara_insan, 08b_boss_konuk; F6 28–32, 35 |")
sub(1531, "57 (yerel prova)", "57 (yerel prova). " + D + " GEÇTİ ancak canlıya almada (Y12) olabilir; Faz 9 kapısında beklenen durum KISMİ'dir (yerel prova YD01–YD06)")

# ---------------- §7 ----------------
ins(1600, r'''
(inceleme düzeltmesi) **Araçların zamanı.** `faz-kapisi.mjs`, katalog, toplayıcı ve `rapor-uret.mjs` Y7'de, yani Faz 9'da yazılır. Faz 1–8 kapanışları bu araçları kullanamaz. Bu yüzden Faz 1–8'in kapısı şudur:
1. Fazın kendi tasarımındaki kabul listesi.
2. Taban listesinin yeni koşucuyla yeniden koşusu: tabanda geçen 23 koşu ve 246 kontrol geçer.
3. Bütün ham `dk-test-raporu/2` raporlarının `docs/v05/kosular/faz<N>/` altına commit'lenmesi.
4. `docs/v05/raporlar/durum.json` ve FIX_REPORT girdilerinin elle güncellenmesi. İskelet Y1 commit'iyle açılır.

Y7, `faz-kapisi.mjs`'i Faz 1–8 arşivleri üzerinde geriye dönük koşar ve TEST_KAYDI'nı bu arşivlerden üretir. PERFORMANCE_REPORT'un otomatik bölümünü Faz 8'in `tools/perf_rapor.mjs`'i üretir (`faz8_tasarim.md` P0.3). `rapor-uret.mjs` o bölümü yeniden üretmez, yalnız ortak başlığı ve T özetini yazar.''')
sub(1605, "Sonuç: 23/25 ve aynı iki kalan (09_performans dG, 06c katılma).",
    "Sonuç (" + D + "): tabanda geçen 23 koşu ve 246 kontrol yine geçer; 09_performans dG ve 06c katılma kontrollerinin sonucu kaydedilir (kararsızdırlar, §5.7-3).")
sub(1620, "README v0.3 özellik maddelerini (README.md:101-128)",
    "README v0.3 özellik maddelerini (" + D + " README.md:27-128: \"Kontroller\", \"Dalış, balıkçılık ve deniz ekipmanı\", \"Avcılık ve toplama\", \"0.3/0.2 sürümünde yenilikler\" ve \"Bu sürümde neler var\" bölümleri)")
app(1620, " " + D + " Kullanıcının \"yeni sürüm yayınlandığında çalışan eski sistemler kaybolmamalı\" isteğindeki eski sürüm **canlı v0.3'tür**; v0.4 hiç yayınlanmadı. Bu yüzden eşlemenin kontrolleri yerelde v0.3'e (8083) karşı da koşulur ve REGRESSION_REPORT'a bir \"canlı (v0.3) → v0.5\" sütunu girer. v0.3'te koşamayan kontrol (test API'si yok) \"uygulanamaz\" yazılır ve elle denetim listesine (E1) alınır.")
sub(1634, "| T16, T17, PERFORMANCE |", "; " + D + " Faz 7'nin animasyon akışı göz kontrol listesi (Faz 7 nihai tasarımı: \"Faz 9 elle tur\") | T16, T17, T30, T31, PERFORMANCE |")
rep(1637, '| E4 |', r'''| E4 | Ayar ekran görüntüleri: Pages kaynağı, ortam dal politikası ve onaylayıcı | T62, K-05 | API 403 (vekil). (inceleme düzeltmesi) Ruleset bu listeden çıktı: `rules/branches/<yayın dalı>` API ile okunabiliyor (N9-14). |''')

# ---------------- §8.1 ----------------
sub(1651, "| `statik`, `duman`, `tek`, `coop2`, `tam`, `yayin_denetimi`, `kayit` | 160 | Y8 |",
    "| `statik`, `duman`, `tek`, `coop2` (2 parça), `tam`, `kapi`, `kayit` (" + D + " `yayin_denetimi` ayrı dosyada) | 170 | Y8 |")
sub(1656, "| 10 | Y5 |", "| 10 | Y3 (" + D + " `__dkDurum` Y3'te bunu içe aktarıyor) |")
ins(1680, r'''| `.github/workflows/yayin-denetimi.yml` (inceleme düzeltmesi) | `yayin_denetimi` (YP10 depo geneli), `yayin_onkosul` | — | 40 | Y8 |
| `.github/workflows/dayaniklilik.yml` (inceleme düzeltmesi) | Haftalık uzun ve tekrarlı koşular (K9-21) | — | 30 | Y8 |
| `tests/node/belge_tutarlilik.mjs` (inceleme düzeltmesi: Y10 kabulünde vardı, listede yoktu) | README ve tests/README sürüm ve komut tutarlılığı | — | 60 | Y10 |
| `tests/kabul/sureler.json` (inceleme düzeltmesi) | Parçalama için senaryo süreleri | — | — | Y2 |
| `tests/kabul/etiket_esleme.json` (inceleme düzeltmesi) | Etiketi değişen taban kontrollerinin eşlemesi (§6.3) | — | — | Y7 |
| `docs/v05/kosular/faz<N>/` (inceleme düzeltmesi) | Faz 1–8 ham rapor arşivi (§7.3) | — | — | Faz 1'den başlayarak |''')
sub(1688, "| Y3, Y5 |", "| Y3 (" + D + " `__dkDurum` ve `SURUM` Y3'te) |")
sub(1689, "| `testParam` | Y3 |", "| `testParam`; " + D + " `peerhost` yalnız geri döngü (K9-20) | Y3 |")
ins(1704, r'''| `tests/scenarios/kamera_tarama/*.js` (inceleme düzeltmesi) | Baş | `{meta:{olcum:true}}` (K-13) | Y1 |
| `README.md` (inceleme düzeltmesi) | 19-23 ("Yerel") | Oyuncular için canlı adres ve tek HTML; yerel sunucu geliştirme içindir (K9-20) | Y10 |
| `.github/workflows/pages.yml` (inceleme düzeltmesi, Y9a) | `deploy` 33-36; `concurrency` 16-18 | Faz 1 başında: `if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w'` ve `cancel-in-progress: false`. Tam yeniden yazım Y9'da. | Y9a |''')

# ---------------- §8.2 ----------------
sub(1710, "Her adımda taban listesi yeşil kalmalıdır (23/25 ve bilinen iki kalan).",
    "Her adımda taban listesi yeşil kalmalıdır (" + D + " tabanda geçen 23 koşu ve 246 kontrol geçer; 09 ve 06c'nin sonucu kaydedilir, §5.7-3).")
rep(1712, '**K9-16: öne çekme.**', r'''**K9-16: öne çekme.** (inceleme düzeltmesi) **Y1, Y3, Y9a ve Y0'ın bunlara ait araçları Faz 1'in ilk adımları olarak** yapılır. Y2 bağımlılığı kaldırıldı: Y3 `package.json` gerektirmiyor. `faz1_brief.md` güncellenmeden Faz 1 başlamaz. Brief bugün Y1–Y3'ü içermiyor ve K-08'i Faz 9'a bırakıyor. Gerekçeler:''')
sub(1717, "Kalan adımlar Faz 9'dadır.", "Kalan adımlar Faz 9'dadır. " + D + " Faz 1–8'in kapısı §7.3'teki araçsız kapıdır.")
app(1728, " " + D + " Y0'ın `kosucu_negatif` ve `test_kipi` kısımları Faz 1 başında (K9-16), `tek-html-denetle` ve `yayin_politikasi` kısımları Faz 9 başında koşar.")
rep(1733, '- Taban listesi (25) yeni koşucuyla', r'''- (inceleme düzeltmesi) Taban listesi (25) yeni koşucuyla **v0.4'e** (8080) karşı koşulur. Tabanda geçen 23 koşu ve 246 kontrol geçer; 09 ve 06c'nin sonucu kaydedilir. 02_arazi_yedek'in noworker, badurl ve crash kipleri yeni koşucuyla da koşulur; "önce" kaydı Faz 1'in "önce" ölçümüdür (`00_BASLANGIC_KAYDI.md` §4). badurl yalnız gerekçeli izinle geçer (3 × 404 + 3 × `requestfailed`, Ek B.1).''')
rep(1743, '**Y3 — Test kipi', r'''**Y3 — Test kipi (1 gün; Faz 1 başında).** `testmode.js`, `kancalar.js`, `main.js`, `net.js`, `terrain.js`; (inceleme düzeltmesi) `surum.js` ve `__dkDurum`. 53'ün TK02–TK05'i `__dkDurum`'u okuyor; taslakta bu ikisi Y5'teydi ve Y3'ün `main.js` kodu henüz var olmayan `surum.js`'i içe aktarıyordu. Ayrıca altı dosyada `DK.mod` dönüşümü, `test_kipi.mjs` ve 53_test_kipi.''')
rep(1744, '*Kabul:* §5.7', r'''*Kabul:* §5.7'nin beş maddesi; 53 TK01–TK06 ve TK08. (inceleme düzeltmesi) TK07 `davetBaglantisi`'ni sınar; o Y5'te geldiği için Y5'in kabulüne taşındı.''')
sub(1746, "**Y4 — Derleme aracı (1,5 gün).** §4.2,", "**Y4 — Derleme aracı (1,5 gün).** " + D + " Y5'ten sonra yapılır. §4.2 (A-16 prelude'u hariç; o Faz 1'in),")
ins(1753, r'''- (inceleme düzeltmesi) 56 TU01–TU07: üretim tek HTML'i bu adımda üretilir; taslakta bu kontroller Y5'in kabulündeydi.''')
rep(1755, '**Y5 — Oyun içi', r'''**Y5 — Oyun içi yayın parçaları (½ gün).** (inceleme düzeltmesi) Y4'ten önce yapılır. `index.html` meta'ları; `menu.js` (sürüm dizgeleri, K-10 `davetBaglantisi`, K-19 lisans düğmesi). `surum.js` ve `__dkDurum` Y3'e taşındı.''')
rep(1756, '*Kabul:* 56 TU01', r'''*Kabul (inceleme düzeltmesi):* 53 TK07 (http'de davet bağlantısı değişmemiş); `tests/node/test_kipi.mjs`'e eklenen `davetBaglantisi` doğruluk tablosu (`file:`, köken `null` ve `__DK_SINGLE_FILE` → Pages adresi; http → `location` tabanlı); `index.html`'de iki meta var ve `SURUM`'la eşit. `file:`'daki davet (TV08) Y4'te, lisans paneli (59 AM08) Y7'de sınanır.''')
rep(1774, '- `yayin_denetimi` YP10', r'''- (inceleme düzeltmesi) `yayin-denetimi.yml`'deki `yayin_denetimi`, YP10'u depo geneli geçer: son 30 günde yayın dalı dışında "GitHub Pages" koşusu ve `github-pages` dağıtımı 0. Bugün 16 koşunun ve 6 dağıtımın hepsi canlı dalda. `pages.yml`'den çağrılan `ci.yml` YP11'i geçer: hiçbir iş `contents: read`'den fazlasını istemez. Bir işi kasıtlı olarak kırmızı yapan bir deneme commit'inde (yayın dalı dışında) `kapi` kırmızı olur.''')
ins(1780, r'''- (inceleme düzeltmesi) Geri dönüş provası: `geri-donus.yml`'nin `derle` adımları 762f1c7 ve 44d548c ağaçlarına karşı yerelde koşar. İki `_site` üretilir ve `kos.mjs yerel-yayin --profil geri-donus` ikisinde de geçer.
- (inceleme düzeltmesi) YP11, YP12 ve YP13 geçer.''')
rep(1798, '**Bağımlılıklar:**', r'''**Bağımlılıklar (inceleme düzeltmesi):** Y1 → Y3 ve Y9a (Faz 1 başında). Y2 bağımsızdır (Faz 9 başında). Y5 ← Y3. Y4 ← Y3, Y5. Y6 ← Y3. Y7 ← Y1, Y4 (58 tek HTML ister). Y8 ← Y2, Y4, Y6. Y9 ← Y8. Y11 ← bütün fazlar. Y12 ← Y11 + kullanıcı komutu.''')
cel(1804, D + " A-16 (prelude) Faz 1'indir, Faz 9 onu yinelemez. A-17 badurl düzeltmesi eşdeğerlik paketini etkiler (§4.4). `faz1_brief.md`'ye Y1, Y3 ve Y9a eklenir; \"K-08 Faz 9'da\" notu kalkar (K9-16).")
cel(1805, D + " `netTest.js`'i derleme dışı bırakma işi `uretimSaplama` eklentisinin ilk sürümüdür (tek mekanizma); `netTest` dışarıya yalnız `install` verir. Doğru şifreyle katılım 06j'ye eklenir (T23). CSP yerel sinyal sunucusunu `index.html`'de engellediği için 59 AM09 ve 60 DD05 test girişinde koşar.")
cel(1806, D + " Faz 3 §4.3'teki kancalar (`DK.frames`, `DK.simSteps`, `DK.sim` parçalaması) `main.js`'te değil `js/test/kancalar.js`'te yazılır; `__sayac` `frames` ve `simSteps`'i de sayar. `22e_gemi_dalga` (GD01–GD03) Faz 3'e eklenir. Faz 3'ün YP01 ve YD01 kodları bu belgeninkilerle çakışır; raporlar kodu senaryo adıyla yazar.")
cel(1808, D + " F5-0'ın \"harness uyarılarını rapora yaz\" kısmı Y1 ile zaten gelir; F5-0 yalnız `net.diag` dökümünü ekler. `netShape` dışarıya yalnız `install(api)` verir; `shape`, `stall`, `cut`, `busy` ve `hide` `DK.netTest`'e bağlanır, `net.js` onu statik içe aktarmaz (§4.2).")
cel(1810, D + " Faz 7'nin adları nihai tasarımından, Faz 8'inkiler taslaktan §6.8'e işlendi. Faz 7'nin F7-0 gözlem kipi (37–44, Faz 6 S6'dan önce) bu belgenin koşucusunu kullanır; araç gerektiren kontrollerin \"uygulanamaz\" durumu toplayıcıda tanınır (§6.6). Faz 8'in `tools/perf_rapor.mjs`'i PERFORMANCE_REPORT'un otomatik bölümünü üretir; `rapor-uret.mjs` o bölüme dokunmaz. 52_uzun_oturum_gercek ve 08f haftalık işe gider (K9-21).")

# ---------------- §9.1 ----------------
sub(1826, "`rotaKok: http://oyun.ornek` + `goto http://oyun.ornek/index.html?test=1&peerhost=10.9.9.9&terrain=crash`",
    "`rotaKok: https://oyun.ornek` + `goto https://oyun.ornek/index.html?test=1&peerhost=10.9.9.9&terrain=crash`. " + D + " Köken https'tir: github.io gibi güvenli bağlamdır; Faz 2 ve 4'ün `crypto.subtle`, `crypto.randomUUID` ve Web Locks kullanımı http'de bulunmazdı. Ölçüm (Ek B.3): yönlendirme gezinmeyi ve işçi betiğini yakalıyor. v0.4 bu kökende `?terrain=crash`'i uyguluyor; yani kontrol bugün kalır, düzeltmeden sonra geçer.")
sub(1827, "| TK06 | — |", "| TK06 | " + D + " TK01'in açılışında, test kipsiz `goto`'lardan önce |")
cel(1828, D + " Y5'te eklenir; TK01'in açılışında koşar.")
ins(1828, r'''| TK08 (inceleme düzeltmesi) | `goto index.html?test=1&peerhost=10.9.9.9&peerport=1`, sonra `goto index.html?test=1&peerhost=127.0.0.1&peerport=9000` | İlkinde `sinyal==='varsayilan'` (geri döngü dışı adres yok sayılır, K9-20), ikincisinde `'127.0.0.1:9000'` |''')
rep(1832, '**55_tek_varlik.js** (TV01', r'''**55_tek_varlik.js** (TV01–TV08; çevrimdışı koşu TV07; inceleme düzeltmesi: başlık TV08'i de kapsar):''')
sub(1873, "Sunucu yoksa kontrol KOŞULMADI olur.",
    D + " `kos.mjs` sinyal sunucusunu bu senaryo için başlatır (`meta.sinyal: true`), yani kontrol CI'da da koşar. KOŞULMADI yalnız sunucu başlatılamazsa yazılır ve `kapi`'yi kaldırır. Faz 2'den sonra senaryo `tests/index.test.html` girişinde koşar (CSP).")
cel(1884, D + " Dinleyici sayısı `metrics` adımıyla (CDP `Performance.getMetrics`, `run.cjs:87`) alınır ve yeni `metrikKarsilastir` adımıyla onaylanır. Sinyal sunucusu ve test girişi AM09'daki gibidir.")
ins(1901, r'''
(inceleme düzeltmesi) Kod çakışması: Faz 3'ün 25_yuksek_dusme senaryosu da YD01–YD04 kodlarını kullanıyor. Raporlarda `yayin_duman:YD05` biçimi kullanılır (K9-17).''')
rep(1916, '| YP10 (`--canli`) |', r'''| YP10 (`--canli`) | Bu sha için `github-pages` dağıtımı 0; "GitHub Pages" koşusu yok ya da yayın işi `skipped`; dinamik koşu 0. (inceleme düzeltmesi) `--tum`: depo genelinde son 30 günde `head_branch ≠ yayın dalı` olan "GitHub Pages" koşusu 0 ve `ref ≠ yayın dalı` olan `github-pages` dağıtımı 0. Bu, v0.3 tabanlı dalları da kapsar (§1.3-7). |''')
ins(1916, r'''| YP11 (inceleme düzeltmesi) | Çağrılan iş akışlarında (`uses: ./.github/workflows/…`) hiçbir iş, çağıran işin verdiğinden geniş izin istemez; `ci.yml`'de her iş ≤ `contents: read` |
| YP12 (inceleme düzeltmesi) | Hiçbir `run:` bloğunda `${{ inputs.` ya da `${{ github.event.` geçmez; girdiler ortam değişkeniyle gelir |
| YP13 (inceleme düzeltmesi) | `ci.yml`'de `kapi` işi var, `if: always()` taşır ve `needs`'i bütün test işlerini kapsar. DEPLOYMENT_REPORT'taki gerekli kontrol adları `kapi` ve `yayin_onkosul`'dur. `rules/branches/<yayın dalı>` okunabiliyorsa `required_status_checks` bu iki adı içerir. |''')

# ---------------- §9.2 ----------------
cel(1925, D + " F7 08a–08c; F8 08e. İki parça (K9-21).")
cel(1926, D + " 52_uzun_oturum_gercek ve 08f bu pakette değil, `dayaniklilik`'tedir; 08d (4 oyunculu) bu pakettedir. badurl kipi Faz 1'in A-17 düzeltmesinden sonra eşdeğerlik paketine girer.")
rep(1927, '| `yayin_denetimi` | YP10 |', r'''| `yayin_denetimi` (`yayin-denetimi.yml`) | YP10 `--tum` |
| `kapi` (inceleme düzeltmesi) | `needs` toplayıcı; ruleset'te gerekli |
| `dayaniklilik` (inceleme düzeltmesi) | 52, 08f, 06c/06z `--repeat 10`, 10_uzun_oturum, kamera_tarama b1–b6; canlıya almadan önce bir kez yerelde |''')

# ---------------- §9.3 ----------------
rep(1940, '| A3 |', r'''| A3 | Yayın dalına PR'sız commit yayınlanmaz (PR denetimi kırmızı); dal kuralı doğrudan push'u reddeder | YP09; (inceleme düzeltmesi) `gh api repos/{r}/rules/branches/claude/hopeful-cray-o1jw6w` çıktısında `pull_request`, `non_fast_forward` ve `deletion` kuralları var (K9-18'den sonra); canlıya almada `required_status_checks` da. Doğrudan push denemesi yapılmaz. |''')
rep(1941, '| A4 |', r'''| A4 | Kırmızı CI'da `derle` ve `yayinla` `skipped` | (inceleme düzeltmesi) Statik YP denetimi: `derle.needs ∋ test`, `yayinla.needs ∋ derle`, `canli-duman.needs ⊇ {derle, yayinla}` ve bu işlerde `always()`, `failure()` ya da `!cancelled()` yok. Taslaktaki "yapay kırmızı dalda gözlem" bunu ölçmez, çünkü yayın dalı dışında `pages.yml` hiç koşmaz. Çalışma anı kanıtı canlıya almadaki ilk koşudur. |''')
rep(1946, '| A9 |', r'''| A9 | (inceleme düzeltmesi) Test kipinde tabanda geçen 23 koşu ve 246 kontrol geçer; kontrol sayıları değişmez; 09 ve 06c'nin sonucu kaydedilir | §5.7-3 |''')
rep(1956, '| A19 |', r'''| A19 | (inceleme düzeltmesi) 10 raporun her birinde §7.2'deki bölümler var; her `OTOMATIK` bloğunun commit'i son koşunun commit'ine eşit (`rapor-uret --denetle` çıkış kodu 0); "TODO" ya da boş blok yok; REGRESSION_REPORT'ta regresyon 0 ya da her biri gerekçesiyle listelenmiş | §7.4 |''')
rep(1957, '| A20 |', r'''| A20 | Bağımlılık sabit: `npm ci` ile iki makinede aynı sha256; v0.4 ağacından `75587dd9…` (inceleme düzeltmesi: makineler bu ortam ve CI'ın `statik` işidir; `tek_sha256` çıktısı yerel derlemeyle aynı olmalı) | Y2 |''')
ins(1957, r'''| A21 (inceleme düzeltmesi) | Çağrılan iş akışında izin yükseltme yok; `pages.yml` koşusu `startup_failure` vermez | YP11 (statik). Çalışma anı kanıtı canlıya almadaki ilk koşudur; ajan canlıya almadan önce hiçbir iş akışını elle tetiklemez (R20). |
| A22 (inceleme düzeltmesi) | Depo genelinde yayın dalı dışından yayın yok: son 30 günde yayın dalı dışında "GitHub Pages" koşusu 0, `github-pages` dağıtımı 0 | YP10 `--tum`; her faz kapanışında ajan da koşar (vekil bu okumaya izin veriyor) |
| A23 (inceleme düzeltmesi) | CI bütçesi: `duman` ≤ 15 dk, `tek` ≤ 15 dk, en uzun `tam`/`coop2` parçası ≤ 45 dk (ilk ölçüm koşusundan sonra); bir işte tarayıcı paralelliği 1 | `sureler.json` ve koşu süreleri; aşılırsa parça sayısı artırılır |''')

# ---------------- §10 ----------------
ins(1984, r'''| R21 (inceleme düzeltmesi) | Çağrılan iş akışında izin yükseltme (N9-10) | `pages.yml` hiç başlamaz; yayın durur (güvenli tarafta, ama canlıya alma takılır) | İzin isteyen işler `yayin-denetimi.yml`'de; YP11 statik denetimi; A21 |
| R22 (inceleme düzeltmesi) | GitHub koşucusu bu ortamdan yavaş | `coop2`/`tam` zaman aşımı; kararsız süre eşikleri | K9-21 bütçesi; ilk koşu ölçüm koşusu; `sureler.json`; parça sayısı `kapi` sayesinde ruleset'e dokunmadan artırılır |
| R23 (inceleme düzeltmesi) | `faz1_brief.md` K9-16'ya göre güncellenmez | Y1/Y3 yapılmadan Faz 1 biter; K-08 açık kalır; Faz 2 `?test=1`'i kendi yöntemiyle yazar (çift iş) | K9-16'nın uygulama koşulu; Faz 1 kabulüne 53_test_kipi ve `kosucu_negatif` eklenir |
| R24 (inceleme düzeltmesi) | Faz 2'nin CSP'si yerel sinyal sunucusunu `index.html`'de engeller | 59 AM09, 60 DD05 ve CSP'li sayfada oda kuran her yeni senaryo kalır | Test girişi `tests/index.test.html`; `kos.mjs` `meta.sinyal` senaryolarını oraya yönlendirir |
| R25 (inceleme düzeltmesi) | Yayın dalı dışındaki v0.3 tabanlı bir dalda yayın, depo içi denetimle görülmez | Kaza fark edilmez | YP10 `--tum`; faz kapanışında ajan sorgusu; K9-18 ve §2.13 sunucu tarafı ayarları |
| R26 (inceleme düzeltmesi) | Faz 2/5'in test modülleri `install` dışında dışa aktarım yapar | Üretim derlemesi "No matching export" ile düşer | `test_kipi.mjs` kural 2; §4.2 tek mekanizma notu; Faz 2/5 için KARARLAR eki |''')

# ---------------- uygula ----------------
ops.sort(key=lambda o: (-o[0], o[1]))
hata = []
for n, _, tur, a, b in ops:
    i = n - 1
    if tur == 'ins':
        lines[i + 1:i + 1] = b.split('\n')
    elif tur == 'rep':
        if not lines[i].startswith(a): hata.append(('rep', n, a, lines[i][:80])); continue
        lines[i:i + 1] = b.split('\n')
    elif tur == 'sub':
        if lines[i].count(a) != 1: hata.append(('sub', n, a[:60], lines[i].count(a))); continue
        lines[i] = lines[i].replace(a, b)
    elif tur == 'app':
        lines[i] = lines[i].rstrip() + b
    elif tur == 'cel':
        s = lines[i].rstrip()
        if not s.endswith('|'): hata.append(('cel', n, s[-40:])); continue
        lines[i] = s[:-1].rstrip() + ' ' + b + ' |'
    elif tur == 'rng':
        bson, pre = a
        if not lines[i].startswith(pre): hata.append(('rng', n, pre, lines[i][:80])); continue
        lines[i:bson] = b.split('\n')
if hata:
    for h in hata: print('HATA', h)
    sys.exit(1)
metin = '\n'.join(lines).rstrip('\n') + '\n\n' + open(EK, encoding='utf-8').read()
open(DST, 'w', encoding='utf-8').write(metin)
print('yazıldı', DST, len(metin.encode('utf-8')), 'bayt', metin.count('\n'), 'satır')
