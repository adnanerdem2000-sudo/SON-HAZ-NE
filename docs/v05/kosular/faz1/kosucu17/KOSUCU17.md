# kosucu17: işaretçi kilidi seli, koşucuda taklit ve tarayıcı çökmesi kaydı

Bu klasör, `17_kamera_kararma` koşularındaki bellek çökmesinin koşucuya bağlı kısmının düzeltmesini ve doğrulamasını tutar (Faz 1).
Oyun kodu (`js/`) değişmedi. rAF sarmalayıcısı ve tür ölçümü (A1-03) değişmedi.

## Kısa sonuç

- **Kök neden (ölçüldü).** Oyun oturum başında `input.lockPointer()` çağırıyor (`js/game/game.js:149`). Başsız Chromium kilidi veriyor.
  Kilit açık kaldıkça tarayıcı ana süreci saniyede ~41 bin sentetik fare hareketi üretip renderer'a MouseMove iletisi gönderiyor
  (ölçüm ajanının X1 izi: 2,41 sn'de 98.630 `PostSynthesizeMouseMove`; X2: kilit kapanınca yük %0). Bu sel tarayıcı ana ipliğini
  ~%90, renderer Compositor ipliğini ~%72 meşgul ediyor. Renderer ana ipliği uzun eşzamanlı iş yaparken (girdi işlenemezken)
  **iki süreçte de** bellek büyüyor (blok deneyi, aşağıda: tarayıcı ~59–71 MB/sn, renderer ~40–49 MB/sn) ve cgroup sınırındaki OOM
  ikisinin toplamından geliyor. Öldürülen süreci `oom_score_adj` belirliyor: renderer +300 aldığı için çoğu kez renderer (03_R:
  tarayıcı 7114 MB iken 5784 MB'lık renderer öldürüldü), tarayıcı renderer'ı ~4,1 GB'tan (0,3 × 13674 MB) fazla geçince tarayıcı
  (02_N, öldürmeden hemen önceki örnek: tarayıcı 8857, renderer 4149 MB RSS). Ölçüm ajanının "OOM'u yapan süreç browser (kesin)" ifadesi bu yüzden fazla güçlüydü:
  çöken iki koşuda renderer VmHWM 4817 ve 5784 MB'a çıktı; çökmeyen altı koşuda 2280–4059 MB (inceleme K1; `olcum_ajani/`, ham
  diziler scratch'te `k17/olcum/0{2_N,3_R,4_N}_ornek.csv`).
- **Biriken şey (olası, doğrudan görülmedi).** Onayı gecikmiş fare olaylarının bekleyen durumu. Bağıntı ve iz yapısı buna uyuyor;
  hangi kapta biriktiği görülmedi.
- **Düzeltme.** Koşucular (`run.cjs`, `coop.cjs`) sayfa betiklerinden önce işaretçi kilidini **taklit ediyor** (varsayılan;
  `--isaretci-kilidi gercek` kapatır). Gerçek kilit istenmiyor, sel kaynağında kesiliyor. Oyunun gözlenebilir kilit anlamı
  (öğe, olaylar, söz, kısıtlama, jest kuralı, kilitliyken fare olaylarının kilitli öğeye gitmesi) gerçek kilitle aynı (aşağıda).
  Kilitliyken arayüze tıklama (`tikla` adımı, co-op `tikla` yardımcısı) gerçek kilitteki gibi amacına ulaşmaz: kilit anındaki imleç
  hedefin üstünde değilse Playwright isabet engeline takılıp zaman aşımına düşer, üstündeyse hatasız döner ama tık kilitli öğeye gider ve
  düğme etkinleşmez (ikinci inceleme GZ-4); karar tıklamanın gönderildiği anda verilir, kilit tıklama beklerken alınsa da (son
  düzeltici, inceleme DOG-1/3).
- **Etki (ölçüldü, tek fark taklit).** 17'de tarayıcı süreci VmHWM 867–1101 MB → 95,6–96,6 MB, renderer 1,8–3,1 GB → 0,45–0,48 GB,
  cgroup tepesi 3,3–4,5 GB → 1,34–1,43 GB; tarayıcı ana iplik CPU'su %91 → %0–0,2. Koşular 2,5–3 kat kısaldı (K08 63–70 sn → 23–25 sn).
- **Tarayıcı ya da sayfa çökmesi artık raporda.** Tarayıcı süreci ölür ya da bağlantı koparsa `hatalar.sayfa`'ya
  `TARAYICI ÇÖKTÜ/KOPTU …`, sayfanın renderer süreci ölürse (OOM'un sık kurbanı) `SAYFA ÇÖKTÜ (renderer crash): …` yazılır, durum
  KALDI olur, `kopma` alanı ayrıntıyı verir (`kopma.tur`). `run.cjs`'te kalan adımlar koşmaz; `coop.cjs`'te kopmadan sonraki ilk
  `ev()`/`tick()`/`tikla()` senaryoyu durdurur ve kopmadan sonra çağrılan `check()` sayılmaz. Eskiden tarayıcı ölümünde alan boş
  kalıyordu (ölçüm ajanının 02_N'si); renderer çökmesinde kalan adımlar koşuyor, koşu ZAMAN_ASIMI ya da KOSUCU_HATASI oluyordu
  (ikinci inceleme KC-1; aşağıda "Son düzeltici 2").
- **Hata yakalama gücü azalmadı.** Son kodla (son düzeltici 2) `kosucu_negatif` 73/73 (3. denemenin 9, son düzelticinin 10 ve
  son düzeltici 2'nin 9 yeni durumu dahil; `son2/dogrulama/kosucu_negatif/`; son düzelticinin koduyla 64/64: `son/kosucu_negatif/`). Son düzelticinin ia, ie ve ie2 durumları önceki koşucuyu (3. denemenin son hâli: run ed8820b9, coop
  6243f043, ortak b29886a4) yakalıyor: o koşucuyla üçü de "KOŞUCU YANLIŞLIKLA GEÇİRDİ" veriyor (`son/kosucu_negatif_eski_kosucu/`;
  ie2 co-op'taki aynı açığı koşarak gösterdi, inceleyici yalnız kodu okumuştu). Tür ölçümleri tabanlarla aynı.

## Değişen dosyalar

| Dosya | Ne |
|---|---|
| `tests/harness/ortak.cjs` | `isaretciKilidiTaklidi()` (+`ISARETCI_TAKLIT`), sayaç okuma (`ISARETCI_SAYAC_JS`), `isaretciKipi()`; taklit kilitte Playwright tıklaması `tiklaTaklitli()` (son düzeltici, inceleme DOG-1/3: taklit isabet kararını tıklamanın gönderildiği anda, hedef öğeyi bilerek verir; engellenen tık Playwright aralıklarıyla yeniden denenir, süre dolunca gerçek kilitteki gibi zaman aşımı). 3. denemenin adım başı ön denetimi (`ISARETCI_KILITLI_JS`, `ISARETCI_ISABET_JS`) kaldırıldı |
| `tests/harness/run.cjs` | Taklit ilk başlatma betiği (test ve `--uretim` kipinde); `--isaretci-kilidi`; rapor `isaretciKilidi`, `kopma`, `sonuc.tarayiciKoptu`; tarayıcı/sayfa/bağlam kopması sınıflandırması; kopmadan sonra kalan adımlar koşmaz; kopma yüzünden yarıda kalan adım KOSUCU_HATASI değil KALDI; durum son görüntü ve sayaç okumasından (bütün await'lerden) sonra hesaplanır, `hatalar.sayfa` aynı anda alınır (inceleme DOG-2; izin eşleşme sayacı iki hesapta çift sayılmaz); tikla adımı `O.tiklaTaklitli` ile (adım kaydında `kilitEngeli`); yerleşme beklemesi duvar saatine göre en az `--yerlesme` ms |
| `tests/harness/coop.cjs` | Her oyuncu bağlamına taklit; `disconnected` → `hatalar.sayfa` `{oyuncu: null, 'TARAYICI ÇÖKTÜ/KOPTU …'}`; senaryo kapatmadan kapanan sekme o oyuncuya `SEKME BEKLENMEDİK KAPANDI`; kopma yüzünden yarıda kalan senaryo KALDI; aynı rapor tutarlılığı (DOG-2) ve yerleşme düzeltmesi; senaryoya `tikla(page, hedef, label?, {zaman})` yardımcısı (DOG-3; başarısızlık `ev()` gibi `evalErrors`'a) |
| `tests/node/kosucu_negatif.mjs` | Yeni durumlar pk, pk2, pk3, pk4, pk5, pk6, tc, td, te; son düzeltici: ia, ib, ia2, ia3, ic, id, ie, ie2, pk7, pk8; tarayıcı ana sürecini senaryo sürerken SIGKILL ile öldürme düzeneği (öldürmenin gerçekten yapıldığı da denetlenir) |
| `tests/fixtures/kosucu/` | `pk_isaretci.html/.js`, `pk5_kilitli_tikla.js`, `pk4_coop_isaretci.cjs`, `tc_tarayici_olur.js`, `td_tarayici_olur_bekleme.js`, `te_coop_tarayici_olur.cjs`; son düzeltici: `ia_gec_kilit_tikla.js`, `ia2_kilit_birakilinca_tikla.js`, `ic_kilit_dinleyici_hatasi.js`, `id_yonlenen_dinleyici_hatasi.js`, `ie_sayac_sirasinda_hata.js`, `ie2_coop_sayac_sirasinda_hata.cjs`, `pk7_coop_tikla.cjs` (ia/ic/id/ie inceleyicinin yeniden üretim senaryoları); `pk_isaretci.html`'de `G.profile` (co-op `mk()` için) |
| `tests/README.md` | Taklit ve tarayıcı çökmesi notu; co-op `tikla` yardımcısı; `--uretim`'de taklidin sayfaya kattıkları; son düzeltici 2: taklidin ölçülmüş bilinen farkları (kilit alınışı sıçraması, çerçeveler, sandbox), kilitliyken `tikla`'nın iki sonucu, renderer çökmesi ve iki koşucunun kopma sonrası davranışı |
| son düzeltici 2 | `run.cjs`: renderer çökmesi kopma (`kopma.tur` renderer, `SAYFA ÇÖKTÜ (renderer crash): …`), `KAPANMA`'da 'Target/Page crashed', metrics CDP istekleri kopma/süre yarışı, KC-4 yorumu. `coop.cjs`: çöken sekme kopması (`kopma.cokenler`), kopmadan sonra `ev`/`tick`/`tikla` atar ve `check` sayılmaz (`kopma.sayilmayanKontrol`), `tick()` Node zamanlayıcısı, ilk onaydan önce kopmada doğru neden. `ortak.cjs`: sandbox'lı alt çerçeve yaklaşımı (`sandboxNedeni`, sayaç `sandbox`), bilinen farklar. `kosucu_negatif.mjs`: rk, rw, rm, tm, rc, rg, rd, ig, ih; te beklentisi; renderer öldürme. Fikstürler: `rk_renderer_olur.js`, `rw_renderer_olur_bekleme.js`, `rm_renderer_olur_metrics.js`, `rc_coop_renderer_olur.cjs`, `rg_coop_konuk_renderer_olur.cjs`, `rd_coop_onaysiz_kopma.cjs`, `ig_sandbox.html`, `ig_cerceve.html`, `ig_sandbox_cerceve.js` (te yorumu) |

Taklidin neden `--uretim` kipinde de kurulduğu: sel tarayıcı ortamının yapıtı, oyunun değil; üretim kipindeki uzun senaryoları da
öldürebilir. Taklit `window`'a ad eklemez, `U00 Üretimde test kancası yok` denetimi etkilenmez (`kosucu_negatif` m, m2 geçti). Ama
sayfayı değiştirir (inceleme DOG-4; önceki yorumlar "üç yerleşik üye" ve "--uretim'de sayfaya hiçbir şey eklenmez" diyordu, yanlıştı):
dört yerleşik üye (`Element.prototype.requestPointerLock`, `Document.prototype.exitPointerLock`, `Document.prototype` ve
`ShadowRoot.prototype.pointerLockElement`) ve `window`'a 19, `document`'a 11 yakalama evresi dinleyicisi (kilitliyken güvenilir fare
olaylarını işaretler, durdurur, kilitli öğeye yönlendirir). U00 dahil üretim koşuları bu değiştirilmiş yerleşiklerle koşar; sayfaya
hiçbir şey eklenmesin isteniyorsa `--isaretci-kilidi gercek`.

## Taklidin sadakati (gerçek kilit ↔ taklit)

`isaretci_yoklama.json`: aynı sınamalar gerçek kilitle (chrome-headless-shell 153.0.8010.12) ve taklitle; son kodla yeniden koşuldu
(`son/yoklama/`, 04:20–04:39; 3. denemenin girdileri `yoklama/`'da, sonuç aynıydı). **53 maddenin 49'u aynı**, ama bu sayı
karşılaştırmadan önceki iki normalleştirmeye bağlıdır (inceleme K4; araç artık bunu `ozet.normallestirme`'ye yazıyor):

- Yönlendirilen kopyaların `isTrusted`'ı false'tur: yoklama5'in 15 maddesinin 10'unda böyle kopya var; karşılaştırma '(sentetik)'
  işaretini siler. Oyun kodu `isTrusted` okumuyor (`grep -rn isTrusted js/`: v0.4, w2, k17'de yok).
- Hareket olayı (mousemove/pointermove) sayıları karşılaştırılmaz: 15 maddenin 14'ünde farklı (gerçek kilitte sel; ör.
  `02_kilitli_bekle_1sn`'de gerçek 42, taklit 0; `11_kilitli_locator_click`'te 285'e karşı 1).

Dört fark — üçü bilinen, biri **açıklanmamış**:

1. Sel göstergesi (beklenen; düzeltmenin amacı): gerçek kilitte sayfaya 51,8 mousemove/sn, tarayıcı ana iplik %97, IO %23,
   Compositor %79; taklitte hepsi 0.
2. `kisit_olay` (yoklama4) — **açıklanmamış fark**: `window.open` ile açılıp kapanan açılır pencerenin hemen ardından gerçek kabuk 6
   isteğin 3'üne, taklit 5'ine izin verdi; kısıtlama modeli bunu açıklamıyor. Oyun açılır pencere açmıyor. (Önceki özet bu farkı
   da "bilinen" sayıyordu; yanlıştı.)
3. `11_kilitli_locator_click` (yoklama5; yoklama Playwright'ın `locator.click`'ini doğrudan çağırır): gerçek kilitte isabet denetimi
   tıklamayı engelleyip zaman aşımına düşer (5005 ms); taklitte denetim olayın özgün konumunu görür, tık tuvale gider (düğme yine
   etkinleşmez). `run.cjs` `tikla` adımı ve co-op `tikla` yardımcısı aynı engeli `tiklaTaklitli` ile tıklamanın gönderildiği anda
   uygular (`kosucu_negatif` pk5/pk6, ia/ib, ia2/ia3, pk7/pk8); senaryo `locator.click`'i doğrudan çağırırsa fark kalır.
4. `13_birak_ve_tik` (yoklama5): gerçek kilit bırakılırken tuvale hareketsiz 1–2 mousemove/pointermove daha gelir (bu koşuda (0,0)'da
   1; konumu koşudan koşuya değişiyor); taklitte yok. Tık, odak ve kilit durumu aynı.

Kilitliyken fare olayları (down/up/move, click, dblclick, wheel; sağ/orta tık 'click') gerçek kilitteki gibi kilitli öğeye, kilit
anındaki imleç konumuyla gider; düğme, metin kutusu, onay kutusu etkinleşmez, odak değişmez. Yani "panel açılınca kilit
bırakılmadı" türü bir hata taklitte de görünür kalır (pk5/pk6, ia/ib, pk7/pk8, PK07). Klavyeyle üretilen click yönlendirilmez (PK08).
Bilinen öteki farklar (oyun ve senaryolar bunlara dayanmıyor) `tests/harness/ortak.cjs`'te `isaretciKilidiTaklidi()`'nin başında.
İkinci inceleme turunda ölçülüp eklenenler (yoklamanın 53 maddesinde yoktu; ayrıntı "Son düzeltici 2"):

- **Kilit alınışında fare sıçraması** (GZ-1): gerçek başsız kilitte imleç (0,0)'a çekilir, her kilit alınışında oyuna −(kilit
  anındaki imleç konumu) kadar tek bir kilitli `mousemove` gelir ve kamera döner ((320,150)'de +0,704 rad); kilitliyken her Playwright
  fare hareketi (+x,+y)/(−x,−y) çifti verir: çoğunlukla toplam 0, ama |x| ya da |y| 400 px'i aşınca `input.js:84` süzgeci çiftin birini
  zamanlamaya bağlı atabilir ve kamera sıçrar (bu turda bir koşuda +0,924 rad = 420 px, öbüründe 0). Taklitte bunların hiçbiri yok.
  Oyunun bu sıçramaya dayanıklılığı taklitle sınanmaz; gerçek kilitli kayıtlarda kamera/yürüyüş yönü zamanlamaya bağlı sapabilir.
- **Çerçeveler** (GZ-3): taklit çerçeve başınadır (kilit sahibi, olay yönlendirmesi, istek kısıtlaması paylaşılmaz); gerçekte sayfa
  başınadır. Oyun tek çerçeveli.
- **Sandbox'lı çerçeve** (GZ-2): artık yaklaşıkla taklit ediliyor (SecurityError, `pointerlockerror`, konsolda güvenlik hatası);
  opak kökenli çerçevede `allow-pointer-lock` okunamaz, çapraz kökenli çerçevenin özniteliği okunamaz.
- **Kilitliyken `tikla`** (GZ-4): kilit anındaki imleç hedefin üstündeyse `tikla` iki kipte de hatasız döner ama tık kilitli öğeye gider
  (düğme etkinleşmez); zaman aşımı yalnız imleç hedefin üstünde değilse olur. Etki sonraki onayla denetlenmeli.

### Oyunun kilide bağlı davranışı ve korunması

| Oyun kodu | Davranış | Taklitte |
|---|---|---|
| `js/core/input.js:88` | `pointerlockchange` → `pointerLocked = pointerLockElement === canvas` | Aynı olay, aynı öğe (PK01, pk4) |
| `js/core/input.js:79` | Kilitliyken `mousemove.movementX/Y` kamerayı döndürür | Olaylar kilitli tuvale gider; Playwright hareketlerinde doğal movementX/Y. Gerçek başsız kilitte ise her kilit alınışı −(imleç konumu) kadar hareket verir (kamera döner; 400 px üstü `input.js:84` süzgecinde zamanlamaya bağlı) ve Playwright hareketleri (+x,+y)/(−x,−y) çiftidir (çoğunlukla toplam 0; 400 px üstünde süzgeç çiftin birini zamanlamaya bağlı atabilir): bilinen fark (GZ-1). Senaryolarda fare hareketi adımı yok |
| `js/core/input.js:95` | `lockPointer()` yalnız `document.hasFocus()` iken | Değişmedi (Playwright odağı öykünür) |
| `js/main.js:387` | Kilit bırakılınca otomatik duraklatma (`G.noAutoPause` değilse) | Aynı (PK03, PK05) |
| `js/main.js:390` | Tuval tıklaması → yeniden kilit | Jest kuralıyla aynı (PK06: etkinlik bitince NotAllowedError) |
| `js/ui/ui.js:45/64`, `js/main.js:365/370/234` | Panel/sohbet açılınca bırak, kapanınca kilitle; menüye dönüşte bırak | `exitPointerLock`/`requestPointerLock` aynı anlamla |

## Ölçüm: taklitli (T) ↔ taklitsiz (G), tek fark `--isaretci-kilidi gercek`

Koşucu k17 (`run.cjs` ac83547e, `ortak.cjs` 4131a54e, `coop.cjs` 6243f043; 25–26 son sha'larla, aşağıda); 640x360,
`--timeout 900` (02_arazi_yasam 540). Koşular 2026-11-15 00:53–02:41 UTC arasında, `tk` kilidiyle tek tarayıcı.
Her koşu ölçüm ajanının örnekleyicisiyle (0,5 sn; `araclar/ornekle2.mjs.txt`, yalnız cgroup yolu dinamik) ve iplik gözlemcisiyle
(2 sn; `araclar/iplik.mjs.txt`) sarıldı. Senaryolar: 17 v0.4 = ölçüm ajanının `17_v04.js`'i (87fe3a63; 44d548c'deki senaryo),
:8080; 17 w2 = k17 `tests/scenarios/17_kamera_kararma.js` (0094c2d7), :8081 (w2 `js/` ve `index.html` 0d57650 ile aynı);
02_arazi_yasam = B0'ın w2'deki senaryosunun kopyası (1f67faee), v0.4 :8080, normal kip. Tablo: `olcum/ozet17.txt`.

| Koşu | Durum | K05 sn | K08 sn | tarayıcı VmHWM MB | renderer VmHWM MB | cgroup tepe MB | tarayıcı ana iplik % | IO uyanma/sn | Compositor % |
|---|---|---|---|---|---|---|---|---|---|
| 17 v0.4 T ×3 (01, 07, 11) | 13/13 ×3 | 13,1–14,8 | 23,7–25,4 | 96,3–96,6 | 456–476 | 1340–1429 | 0–0,2 | 9–42 | 0,5–0,7 |
| 17 v0.4 G ×3 (02, 08, 12) | 13/13 ×3 | 30,5–33,2 | 62,8–70,4 | 1014–1101 | 1859–3140 | 3421–4465 | 90,7–91,7 | 5522–6353 | 72,8–73,9 |
| 17 w2 T ×2 (03, 09) | 13/13 ×2 | 11,3–14,7 | 22,5–24,6 | 95,6–96,3 | 451–471 | 1367–1383 | 0–0,1 | 10–20 | 0,5–0,6 |
| 17 w2 G ×2 (04, 10) | 13/13 ×2 | 30,8–31,4 | 66,4–67,3 | 867–1047 | 1800–2705 | 3336–3953 | 91,1–91,2 | 5238–6267 | 71,1–72,5 |
| 02_arazi_yasam T ×3 (05, 22, 24) | 13/18 ×3 | – | – | 99,6–100,5 | 579–592 | 1357–1506 | 0,2–0,3 | 32–61 | 0,5 |
| 02_arazi_yasam G ×2 (06, 23) | 12/18 ×2 | – | – | 903–1045 | 2154–2751 | 3246–3878 | 59,2–62,0 | 6885–9212 | 50,1–52,1 |
| ölçüm ajanı N ×4 (rAF'sız, gerçek kilit) | 3 geçti, 1 OOM | 38,7–43,0 (02_N: 88,9) | 78–104 (02_N K08'de çöktü) | 1093–8861 | 2280–4817 | 3593–13675 | 86–88 | – | 69–70 |

- Sel yalnız gerçek kilitte: G'de tarayıcı IO ipliği 5–9 bin uyanma/sn, ana iplik ~%91 (02_arazi_yasam'da ~%60); T'de ikisi de ~0.
- cgroup tepesi oturumun öteki işlerini de içerir (koşu başında chrome dışı 152–216 MB). Chrome toplamı: T 1205–1371 MB, G 3140–4274 MB.
- **Bu turda G koşularında OOM olmadı** (17'de 0/5, 02_arazi_yasam'da 0/2). Ölçüm ajanının R/N koşularında 2/8 çöküş vardı.
  Bu 0/7 **oran kanıtı değildir** (inceleme K2): G kolu ölçüm ajanının koşularından belirgin daha sakin bir ortamda koştu ve çökme
  rejimine ulaşmadı. K05 süresi G'de 30,5–33,2 sn, ölçüm ajanının çökmeyen R/N koşularında 37,1–43,0 sn (kesin Mann–Whitney
  U = 0, iki yönlü p = 0,0043); tarayıcı VmHWM G'de 867–1101 MB, ölçüm ajanında 1093–1454 MB (U = 1, p = 0,0087). Oran iki yönde
  de bilgi taşımıyor: 17'nin T koşularında 0/7 çöküş, gerçek oran 2/8 olsaydı da 0,75⁷ ≈ 0,13 olasılıkla (gerçek kilitle birleşik
  oran 2/15 ile ≈ 0,37) görülürdü; G'nin 0/7'si ile ölçüm ajanının 2/8'i arasında Fisher iki yönlü p = 0,47.
  Çöküşün kalktığını bu yüzden oranla değil iki doğrudan kanıtla gösteriyorum: (i) mekanizma (sel, bellek büyümesi, CPU): 17'de
  T'nin cgroup tepesi G'ninkinin %31–41'i, tarayıcı süreci 9–11 kat küçük; (ii) çökme koşulunun (renderer ana ipliğinin uzun
  eşzamanlı blokajı) doğrudan sınandığı **blok deneyi** (aşağıda, "Blok deneyi").
- 17'nin bellek baskısını azaltmak için senaryoyu değiştirmek (ör. `Uint8Array` yeniden kullanımı) değerlendirildi, **gerekmedi**:
  T'de renderer 0,45–0,48 GB, cgroup ≤ 1,43 GB (sınır 13,67 GB). Senaryo değişmedi.

### Blok deneyi: çökme koşulunun doğrudan sınanması (inceleme K2)

Senaryo (inceleyicinin `blok.js`'i, `son/araclar/blok.js.txt`): oyun başlar (kilit istenir), `fpsLimit` 0,01, 15 sn boşta, **20 sn
renderer ana ipliği eşzamanlı meşgul** (girdi işlenemez: 17'nin büyük js adımlarının ve çöküşlerin koşulu), 12 sn boşta. Bellek ve
iplik CPU'su dışarıdan 0,25 sn'de bir örneklendi (`ornekle_i.py`), çözümleme `blok_analiz.py` (eğim: evre içindeki anon bellek
doğrusal eğimi). Tek fark `--isaretci-kilidi gercek`. v0.4 :8080, 640x360.

| Koşu (kod) | tarayıcı anon eğimi MB/sn, boşta / blokta | renderer eğimi, boşta / blokta | tarayıcı VmHWM MB | renderer VmHWM MB | cgroup tepe MB | tarayıcı ana iplik % (blokta) | renderer ana iplik % (blokta) |
|---|---|---|---|---|---|---|---|
| `blok_T` (son kod, taklit) | 0,0 / 0,0 (15 → 15 MB) | −5,8 / −0,5 | 96 | 434 | 1431 | 0,0 | 99,1 |
| `blok_G` (son kod, gerçek kilit) | −0,3 / **59,0** (61 → 1259 MB) | 40,8 / **40,4** | 1835 | 4594 | **7420** | 96,6 | 98,4 |
| B1 T (inceleyici, 3. denemenin kodu) | 0,0 / 0,0 | 0,0 / −0,4 | 96 | 434 | 1942 | 0,0 | 99,4 |
| B2 G (inceleyici, 3. denemenin kodu) | −0,1 / 68,9 | 50,6 / 41,9 | 1940 | 3827 | 7067 | 99,2 | 99,7 |
| B3 G (inceleyici, 10 sn blok) | 0,1 / 70,6 | −4,0 / 48,6 | 1347 | 2102 | 4543 | 98,9 | 99,4 |

- Taklitle blok boyunca **iki süreç de büyümüyor**; gerçek kilitte tarayıcı ~59–71, renderer ~40–49 MB/sn büyüyor ve tek bir 20 sn'lik
  blokla cgroup tepesi 7,1–7,4 GB'a çıkıyor (sınır 13,67 GB). Gerçek kilitte renderer boşta da büyüyor (40,8 ve 50,6 MB/sn); taklitte
  küçülüyor. B2'nin ham verisinden: tarayıcı anon belleği blok bittikten 5,6 sn sonra 1859 MB'ta tepe yaptı, sonra 70 MB'a indi.
- Bu, "çökme kalktı" yargısının dayanağıdır: çöküşün koşulu (uzun ana iplik blokajı) taklitle bellek büyümesi üretmiyor. Çöküş oranı
  karşılaştırması yapılmadı (yukarıdaki K2 notu). Kayıtlar: `son/blok/` (çözümleme `blok_analiz_son.txt`; inceleyicinin B1–B3
  çözümlemesi `blok_analiz_inceleme_onceki_kod.txt`, ham verisi scratch'te `k17/inceleme_istatistik/kosu/`).

### rAF sarmalayıcısı: ölçüm ajanının "fark_yok" yargısı (inceleme K5)

Ölçüm ajanı R (sarmalayıcılı) ile N (sarmalayıcısız) arasında "fark_yok" dedi ve önceki 4/6 ↔ 0/5 ilişkisini "büyük olasılıkla
tesadüf ve zamanla değişen CPU yükü" ile açıkladı. Veri bundan azını taşıyor. n = 4 + 4'te iki yönlü Fisher testinde yalnız
4/4 ↔ 0/4 tablosu p < 0,05 verir (p = 0,029); önceki oran (≈ 0,67) gerçek olsa bile bu tabloyu görme olasılığı ≈ 0,67⁴ = 0,20, yani
küçük bir etki gibi büyük bir etki de dışlanamaz. İnceleyicinin birleşik sayımıyla (sarmalayıcılı 5/10, sarmalayıcısız 1/10) Fisher
tek yönlü p = 0,070, iki yönlü 0,141. Sistem CPU'su ancak 07'den itibaren kaydedildi (`olcum/surucu.log`); "zamanla değişen CPU
yükü" **ölçülmemiş bir hipotezdir**. Verinin desteklediği yargı: sarmalayıcı çökme için **gerekli değil** (sarmalayıcısız N de çöktü)
ve **kendi başına belleği büyütmüyor** (taklitli T koşularında ve blok deneyinin taklit kolunda sarmalayıcı yerindeyken tarayıcı
~96 MB'ta düz kalıyor); sel varken çökme olasılığına etkisi bu n ile ölçülemez.

### 02_arazi_yasam: LY13 selden etkileniyor (B0 için bulgu)

T ve G'de 18 kontrolün 17'si aynı sonucu verdi. LY05 (A-11), LY09, LY10 (A-13), LY11 ve LY14 (A-07) iki kipte de kalıyor:
B0'ın v0.4'te kalmasını beklediği kontroller. Tek fark **LY13** (A-06 / KI-154, ana iş parçacığı yedeğinde dilim süresi):
T'de 3/3 "tamam", G'de 2/2 kaldı ("p99 bütçe+10.5 ms, en uzun bütçe+15.5 ms"; "p99 bütçe+9.2 ms, en uzun bütçe+9.7 ms").

B0'ın kayıtları (w2'de `docs/v05/kosular/faz1/b/once_v04/`, artık 903ddc7'de commit'li; son düzeltici 15 Kasım ~03:45'te
yeniden saydı) aynı yönü gösteriyor. Gerçek kilitli koşucuyla LY13'ün değerlendirildiği koşular (çöken koşular ayrıca):

- normal kip: 9 koşunun 9'unda kaldı (+6…+22 ms; eski etiketle 20–24 dilim), 6 koşu çöktü; tek geçen B0'ın kilidi her alınışta
  hemen bırakan tanı koşusu (`duzeltme3/isaretci/02_arazi_yasam_normal_birak`).
- crash kipi: 7 koşunun 5'inde kaldı, **2'sinde geçti** (`duzeltme/son_1deneme/02_arazi_yasam_crash`, `son/02_arazi_yasam_crash`).
- noworker kipi: 9 koşunun 7'sinde kaldı, 2'sinde geçti: biri kilit bırakan tanı koşusu (`duzeltme3/isaretci/…_noworker_birak`),
  öteki :8098 mutasyon sunucusundaki `duzeltme2/02_arazi_yasam_mutA12_noworker` (gerçek kilit); 2 koşu çöktü.

(Bu bölümün önceki sürümü "crash kipinde 3 kez geçti" diyordu; yanlıştı: crash'te 2/7, ayrıca 1 noworker mutasyon koşusu. İnceleme K3.)
**Olası yorum:** LY13'ün v0.4 normal kipteki kırmızısı büyük ölçüde selin CPU yarışından. Normal kipte gerçek kilitle 9/9 kaldı,
selsiz koşularda (benim üç T'm ve B0'ın 'birak' koşusu) 4/4 geçti: Fisher tek yönlü p ≈ 0,0014; ama selsiz koşuların üçü benim ve
aynı saat aralığında. Benim verim tek başına (T 3/3, G 0/2) Fisher tek yönlü p = 0,10. KI-154'ün kendisi (dilim süresini bütçe değil
parça boyutu belirliyor) bu ölçümle sel olmadan görünmüyor olabilir. Taklit uygulanınca LY13 normal kipte büyük olasılıkla yeşile
döner; **noworker kipinde ölçülmedi** (taklitli noworker koşusu yok; selsiz noworker kanıtı tek koşu, 'birak'). LY13'ün eşiği ya da
ölçüm yolu B0 tarafından yeniden değerlendirilmeli; B0'a taklitli koşucuyla normal ve noworker 02_arazi_yasam koşuları öneriyorum.

### Co-op (`coop/`)

`06b_esitlik_senkron`, 2 oyuncu, w2 :8081 + yerel PeerJS: T 18/18 (tarayıcı 99 MB, cgroup 1826 MB, ana iplik %0,2);
G 18/18 (tarayıcı 1713 MB, cgroup 4695 MB, ana iplik %49,9, IO 4332 uyanma/sn). Sel co-op'ta da var; taklit her sekmede kuruluyor.
KI-233 (konuk menüye düşüyor) ile ilişkisi **sınanmadı**; bir hipotez olarak kalıyor.

## Tür ölçümü (A1-03) ve döngü dışı update

`tur/tur_ozet.txt`: 04_karakter (w2 ve v0.4), 05_dusman_ai, 13_donma, 03_fizik_duzeltmeler, 08_kalicilik (w2) taban raporlarla
**etiket, ok ve tür bakımından aynı** (53_test_kipi için taban `a2/duzeltme/son/53_test_kipi.json`, 25/25). Döngü dışı `DK.game.update` çağrıları sayılıyor (`benzetim.update` > 0,
ör. C10 update 180) hem kancalı w2'de hem kancasız v0.4'te (19_v04-04_karakter): rAF sarmalayıcısı yerinde olduğundan v0.4 için
`turNot` gerekmedi. `kosucu_negatif` 'z' durumu beklentisi değişmeden geçti.

## kosucu_negatif

Son kodla (son düzelticiden sonra) **64/64 PASS** (`son/kosucu_negatif/tum.log`); 3. denemenin son koduyla 54/54 idi
(`kosucu_negatif/tum.log`). Son düzelticinin durumları: ia/ib (kilit tikla beklerken alınır: taklitte ve gerçek kilitte zaman aşımı,
tuval ve düğme tık almaz), ia2/ia3 (kilit tıklama sürerken bırakılınca tık düğmeye ulaşır), ic/id (taklidin gönderdiği olayların
dinleyici istisnaları sayfa hatası), ie/ie2 (sayaç okuması sürerken gelen sayfa hatası: rapor tutarlı, KALDI), pk7/pk8 (co-op
`tikla` yardımcısı, taklit ve gerçek kilit). 3. denemenin durumları: pk (taklit anlamı, sel yok, yönlendirme), pk2 (aynı senaryo gerçek
kilitle: yalnız sel kontrolü PK02 kalır), pk3 (geçersiz seçenek: çıkış 2), pk4 (co-op her sekmede taklit), pk5/pk6 (kilitliyken düğmeye
tikla: taklit ve gerçek kilitte aynı zaman aşımı), tc/td/te (tarayıcı süreci js adımı, bekleme adımı ve co-op senaryosu sürerken
SIGKILL ile öldürülür: `TARAYICI ÇÖKTÜ/KOPTU`, KALDI, süreç kendiliğinden biter). A1'in bütün durumları geçmeye devam ediyor.
Son düzeltici 2'nin durumları (son kodla 73/73): rk/rw/rm (sayfanın renderer süreci js adımı, bekleme adımı ve metrics adımının
CDP isteği sürerken öldürülür: `SAYFA ÇÖKTÜ (renderer crash)`, `kopma.tur` renderer, kalan adımlar koşmaz, asılı kalma yok, KALDI),
tm (aynı metrics senaryosunda tarayıcı öldürülür), rc/rg (co-op: oda sahibinin renderer'ı `ev()` sürerken, konuğunki senaryo beklerken
öldürülür; senaryo durur, kopmadan sonraki `check()` sayılmaz), rd (co-op: tarayıcı ilk onaydan önce öldürülür; neden "ilk onaydan
önce yarıda kaldı", "onaysız" değil), ig/ih (sandbox'lı alt çerçevede kilit isteği: taklitte ve gerçek kilitte SecurityError,
`pointerlockerror`, konsolda güvenlik hatası). te'nin beklentisi değişti: TE02 artık koşmaz (eskiden boşuna geçiyordu).
Öldürme düzeneği renderer'ı da hedefleyebiliyor (`chromeSureci`: en eski ya da ikinci en eski canlı renderer; öldürülen oyuncu
durumların kendi denetimiyle doğrulanır).

## Gözlenen öteki olay

2026-11-15 01:59:01'de bir renderer OOM ile öldürüldü (pid 14321, anon-rss 5,4 GB, `oom_score_adj` 300). O sırada tarayıcı
kilidini B0'ın 01:54'te başlayan `02_hizli_yolculuk` koşusu tutuyordu (v0.4 :8080; `ps`'te `node tests/harness/run.cjs …`, rapor
w2'ye yazılıyor: büyük olasılıkla w2'nin taklitsiz koşucusu),
benim `14_w2-05_dusman_ai_T` koşum kilit bekliyordu. Öldürme kaydı `tur/14_w2-05_dusman_ai_T.dmesg.txt`'de; pid benim koşumun süreç
listesinde yok. Öldürülenin büyük olasılıkla B0'ın renderer'ı olduğu ve aynı mekanizma olduğu olası; pid'in üst sürecini doğrulamadım.
(Sonradan, ikinci inceleme KC-1: o koşunun raporu ZAMAN_ASIMI'ydı (`b/once_v04/duzeltme3/kesik/02_hizli_yolculuk_normal_abf125_sayfa_coktu_oom.json`):
renderer çöktükten sonra metrics adımının CDP isteği 540 sn asılı kaldı. Son düzeltici 2'nin koşucusunda bu KALDI ve `kopma.tur`
renderer olur, metrics isteği kopmayla yarışır.)

## Son düzeltici: inceleme bulguları (DOG-1..4, K1..K6)

İki karşıt inceleyicinin bulguları önce yeniden üretildi; hepsi gerçek çıktı. Kod bulguları düzeltildi, belge bulguları bu dosyada
ve kod yorumlarında düzeltildi. Ham kayıtlar: `son/`.

| Bulgu | Yeniden üretim | Ne yapıldı |
|---|---|---|
| DOG-1 (yüksek): `tikla` ön denetimi adım başında bir kezdi; kilit denetimden SONRA, tık gönderilmeden ÖNCE alınırsa (oyunda `ui.close` → 30 ms sonra `lockPointer`) taklit tıklamayı geçiriyordu | inceleyicinin ia/ib senaryosu, 3. denemenin koşucusuyla: ia GECTI (tikla 1389 ms; tuval mousedown/mouseup/click aldı), ib (gerçek kilit) KALDI (Timeout 4000) | `O.tiklaTaklitli`: her denemede hedef öğe çözülüp taklide bildirilir, taklit kararı tıklamanın İLK fare olayında, Playwright'ın `expectHitTarget` kuralıyla (donmuş konum, `button-link` yeniden hedeflemesi) verir ve engellerse olayları sayfaya ulaştırmaz; koşucu engeli okuyup Playwright aralıklarıyla (0, 20, 100, 100, 500 ms) yeniden dener, süre dolunca `locator.click: Timeout …` (açıklamalı). Engel bildirimi süre dolunca kendiliğinden düşer. Adım başı ön denetim (`ISARETCI_KILITLI_JS`, `ISARETCI_ISABET_JS`) kaldırıldı. Durumlar: ia/ib, ia2/ia3 (kilit tıklama sürerken bırakılınca tık düğmeye ulaşır) |
| DOG-2 (orta): `raporla()` durumu yeni sayaç okumasından (ve son görüntüden) önce hesaplıyordu; o arada gelen sayfa hatası `hatalar.sayfa`'ya girip durum GECTI kalıyordu | ie: GECTI/çıkış 0, `hatalar.sayfa` dolu; co-op karşılığı ie2 bu turda koşuldu: aynı açık | run.cjs ve coop.cjs: ön hesap yalnız son görüntü kararı; asıl hesap bütün await'lerden sonra, `hatalar.sayfa` aynı anda (arada await yok). Hesap iki kez yapıldığı için izin eşleşme sayacı her hesapta sıfırlanır (yoksa `izinler[].eslesme` çift sayılırdı; 3. denemenin kopma yolunda bu zaten oluyordu). Durumlar: ie, ie2 |
| DOG-3 (düşük): coop.cjs'te tikla isabet engelinin karşılığı yoktu | `grep` boş; yoklama5 m.11 | Senaryoya `tikla(page, hedef, label?, {zaman})` yardımcısı (`O.tiklaTaklitli`; başarısızlık `ev()` gibi `evalErrors`'a, `false` döner); coop.cjs başlığı ve README: doğrudan `p.click`/`locator.click` taklitte kilitliyken farklı sonuç verir, arayüz tıklaması `tikla` ile. Durumlar: pk7 (taklit), pk8 (gerçek kilit) |
| DOG-4 (düşük): `--uretim` saflığı yorumları yanlıştı | run.cjs:469 "üç yerleşik üye", :472 "--uretim'de sayfaya hiçbir şey eklenmez" | run.cjs, ortak.cjs, README ve bu belgede: dört yerleşik üye + window'a 19, document'a 11 yakalama dinleyicisi; U00 bu değiştirilmiş yerleşiklerle koşar; hiçbir şey eklenmesin isteniyorsa `--isaretci-kilidi gercek` |
| K1 (orta): "OOM'u yapan süreç browser (kesin)" ve kurban kuralı veriyle çelişiyordu | 02_N/03_R/04_N bellek dizileri, 03_R öldürme anı, blok deneyi (B1–B3) | Bu belgede ("Kısa sonuç") ve `ortak.cjs` kök neden yorumunda: iki süreç büyür, OOM toplamdan, kurbanı `oom_score_adj` belirler. Ölçüm ajanının ve ana oturum ekinin metni bu ağacın dışında: ana oturum için not |
| K2 (düşük): G kolu çökme rejimine ulaşmadı; 0/7 oran kanıtı değil | K05 süresi ve tarayıcı VmHWM karşılaştırması (U = 0, p = 0,0043; U = 1, p = 0,0087), Fisher | "Ölçüm" bölümüne eklendi; "çökme kalktı" yargısı mekanizma ve blok deneyine dayandırıldı; blok deneyi son kodla yeniden koşuldu |
| K3 (düşük): LY13 "crash kipinde 3 kez geçti" yanlış | B0 kayıtları yeniden sayıldı | crash 2/7 + 1 noworker mutasyon koşusu; noworker'da taklitle ölçülmedi (LY13 bölümü) |
| K4 (düşük): "53'ün 49'u aynı" normalleştirmeye bağlı; `kisit_olay` "bilinen" değil | yoklama5: 15 maddenin 10'unda `isTrusted` false kopya, 14'ünde hareket sayısı farklı | Karşılaştırma aracı (`son/araclar/karsilastir_yoklama_son.mjs.txt`) normalleştirmeyi ve fark sınıfını (bilinen/açıklanmamış) rapora yazıyor; "Taklidin sadakati" bölümü düzeltildi |
| K5 (düşük): "fark_yok" ve "zamanla değişen CPU yükü" fazla güçlü | Fisher hesapları, `olcum/surucu.log` | "rAF sarmalayıcısı" bölümü (yukarıda). Ölçüm ajanının metni bu ağacın dışında |
| K6 (düşük): yorum düzeltmesinden sonra iki yerde "büyük olasılıkla" kalmıştı | `grep` | run.cjs başlığı ve README: "olası (doğrudan görülmedi)" |

### Son kodla doğrulama (`son/`)

Son kod: `run.cjs` 40d79517, `coop.cjs` aa01a376, `ortak.cjs` 003f6f44, `kosucu_negatif.mjs` 8b993719 (tam sha'lar `kod_sha.txt`).
Koşular 2026-11-15 03:50–04:40 UTC, `tk` kilidiyle tek tarayıcı; 17, B0 senaryoları ve co-op ölçüm ajanının örnekleyicisiyle
(`ornekle2.mjs`, 0,5 sn) ve iplik gözlemcisiyle (`iplik.mjs`, 2 sn), blok deneyi `ornekle_i.py` (0,25 sn) ile sarıldı. Bu turda OOM
olmadı (`oom_kill` 0 → 0, `zincir.log`, `zincir_ek.log`; `dmesg`'de "Killed process" yok; cgroup'un oturum boyunca en yüksek
kullanımı 7483 MB, blok_G sırasında). Not: `zincir.log`/`zincir_ek.log`'daki BİTTİ satırlarının sonundaki `| …` özeti kosucu_negatif
günlüğünü de taradığı için yanlış satırı gösteriyor (yalnız görünüş; asıl sonuçlar öğe günlükleri ve raporlarda).

| Doğrulama | Sonuç |
|---|---|
| `kosucu_negatif` tümü (`son/kosucu_negatif/`) | GECTI: 64 PASS, 0 FAIL |
| Yeni durumlar 3. denemenin koşucusuna karşı (`son/kosucu_negatif_eski_kosucu/`) | ia, ie, ie2: "KOŞUCU YANLIŞLIKLA GEÇİRDİ"; pk7: KOSUCU_HATASI (o koşucuda `tikla` yardımcısı yok); ia2: GECTI ama `kilitEngeli` kaydı yok; ib, pk, pk5: PASS. Yani yeni durumlar eski açıkları yakalıyor |
| 17 v0.4 T (`son/olcum/17v04_T`) | GECTI 13/13; tarayıcı VmHWM 95,5 MB, renderer 459 MB, cgroup tepe 1498 MB; tarayıcı ana iplik %0,1, IO 21 uyanma/sn, Compositor %0,6; K05 15,1 sn, K08 29,0 sn (3. denemenin T'leri: 96,3–96,6 / 456–476 MB) |
| 17 w2 T (`son/olcum/17w2_T`) | GECTI 13/13; tarayıcı 96,2 MB, renderer 468 MB, cgroup 1567 MB; tarayıcı ana iplik %0,1, IO 10 uyanma/sn |
| B0'ın `02_acilis_akisi` (w2 senaryosu, sha 1e20f2dc; v0.4 :8080) T ve G (`son/b0/`) | ikisi de KALDI 22/23, yalnız AA09b (oyun menüye dönünce yeniden kilitliyor); B0'ın iki "önce" kaydıyla (gerçek kilit, w2 koşucusu) **kontrol kontrol aynı**; adım hatası yok; oyun içi `tikla`'lar (Kaydet, Ana menüye dön, Evet, DEVAM ET) hatasız. T 104 sn, G 161 sn, B0 134 sn. Bellek: T tarayıcı VmHWM 102 MB, cgroup tepe 1570 MB; G 1500 MB, 4492 MB. (Sonradan, GZ-5: ikinci turun inceleyicisinin gerçek kilitli koşusunda AA15 de kaldı, 21/23: taban yükleme bitmeden alındı, gerçek kilidin yükü; tek G koşusu bu kontrol için kanıt değil) |
| B0'ın `02_ayar_lod`, `02_yukleme_bekleme`, `02_depolama_kapali`, `02_hizli_yolculuk` (T) | B0 kayıtlarıyla kontrol kontrol aynı: 4/11, 4/9, 2/15, 23/34. `02_depolama_kapali`'de aynı `tikla` adımları aynı zaman aşımıyla hata verdi (öğe hiç gelmiyor; iletiye "(koşucu: tıklanacak öğe bekleniyordu)" eklenir); `02_hizli_yolculuk`'ta ölüm ekranındaki `tikla` ("Kırlangıç Limanı'nda uyan") hatasız |
| `02_hizli_yolculuk` G | KALDI 22/34: B0'dan tek fark HYS-01 (bölge hazırlığı ≤ 3 sn: G 3321 ms; B0 1810 ve 1301 ms; T 782 ms). G'de `tikla` yolu düz `locator.click` (eski koşucuyla aynı); fark gerçek kilitteki zamanlamaya bağlı tek örnek (G koşusu 318 sn, B0 265 sn); `tikla` adımı G'de de hatasız. Bellek: T tarayıcı 101 MB, cgroup 1634 MB; G 1470 MB, 5611 MB |
| Co-op `06b_esitlik_senkron` T (`son/coop/`) | GECTI 18/18; tarayıcı 98,8 MB, cgroup 2069 MB, ana iplik %0,3 (3. denemenin T'si: 98,8 MB, 18/18) |
| Blok deneyi T/G (`son/blok/`) | yukarıdaki "Blok deneyi" tablosu: taklitte blokta büyüme yok; gerçek kilitte tarayıcı 59, renderer 40 MB/sn, cgroup 7,4 GB |
| Gerçek kilit ↔ taklit yoklaması (`son/yoklama/`, `isaretci_yoklama.json`) | 53 madde: 49 aynı, 3 bilinen fark, 1 açıklanmamış (`kisit_olay`); normalleştirme: yoklama5'in 10/15 maddesinde `isTrusted` false kopya, 14/15'inde hareket sayısı farklı ("Taklidin sadakati") |
| Dokunulmaması gereken ağaçlar | v0.4 44d548c, v0.3 762f1c7, kosu 5479e3b, w2 03b5c97: `git status` temiz; hiçbir ağaçta kök `DenizKorsanlari-SonHazine.html` değişmedi; k17'de `js/`, `index.html` değişmedi; w2'ye yazılmadı (yalnız okundu) |

## Son düzeltici 2: ikinci inceleme turu (GZ-1..5, KC-1..4)

İkinci turun iki inceleyicisinin (gizleme merceği GZ, çökme merceği KC) dokuz bulgusu önce yeniden üretildi. Yeniden üretim, bulguların
tarayıcı koşularının ve yeni `kosucu_negatif` durumlarının **değişiklik öncesi koşucuya** (son düzelticinin son hâli: `run.cjs` 40d79517,
`coop.cjs` aa01a376, `ortak.cjs` 003f6f44; kopyası `son2/yeniden/once_kosucu/`) karşı koşulmasıyla yapıldı. Ham kayıtlar: `son2/`.

| Bulgu | Yeniden üretim (değişiklik öncesi koşucu) | Ne yapıldı |
|---|---|---|
| GZ-1 (orta): gerçek başsız kilit her kilit alınışında oyuna −(imleç konumu) kadar hareket verir, kamera döner; bilinen farklar bunu yanlış anlatıyordu ("imleç merkeze çekildiğinden") | inceleyicinin `gk_kamera.cjs`'i (`son2/yeniden/R2_gk_kamera_once.*`): gerçek kilitte A1 (imleç (320,150)) kilit alınışında `[-320,-150]` → yaw +0,704 rad; A3/A5 "Devam et" (320,98) → +0,704; A6 her +10 px Playwright hareketi (+x,+y)/(−x,−y) çifti, toplam 0. Taklitte A1/A3/A5'te yaw değişmedi, A6 doğal (−0,132 rad). İnceleyicide görülen "kilit bırakılınca kilitsiz −320/−150 olayı" bu koşuda yoktu | Belge (kod değişmedi; taklit başsız kabuğun bu yapıtını bilerek taklit etmez): `ortak.cjs` bilinen farklar, README, aşağıdaki not. "merkeze çekildiğinden" düzeltildi: imleç (0,0)'a çekilir. #69 için not (aşağıda). İsteğe bağlı "sıçrama kipi" eklenmedi (kalan) |
| GZ-2 (orta): sandbox'lı iframe'de (`allow-pointer-lock` yok) gerçek kilit SecurityError verir, taklit veriyordu | `gk_karsilastir.cjs` T11 (`son2/yeniden/R1_gk_karsilastir_once.*`): gerçek `red SecurityError: … sandboxed and the 'allow-pointer-lock' permission is not set.`, çerçevede `pointerlockerror`, konsolda güvenlik hatası; taklit `ok`, kilit verildi, konsol boş. Yeni `ig` durumu değişiklik öncesi koşucuyla KALDI (IG01: taklit üç çerçevede de kilit verdi, konsol hatası yok), `ih` (gerçek kilit) beklendiği gibi | `ortak.cjs`: taklit Blink'in kuralını **yaklaşıkla** uygular (`sandboxNedeni`): alt çerçevede, erişilebilen çerçeve öğesi zincirinde `allow-pointer-lock`'suz `sandbox` özniteliği varsa ya da çerçevenin kökeni opaksa (data: hariç) istek bağlılık denetiminden sonra konsola aynı güvenlik iletisi, `pointerlockerror` ve `SecurityError` ile reddedilir. Sınırlar belgelendi (opak çerçevede `allow-pointer-lock` okunamaz; çapraz kökenli çerçevenin özniteliği okunamaz). Durumlar: ig (taklit), ih (gerçek kilit) |
| GZ-3 (düşük): taklit çerçeve başınadır (çerçeveler arası kilit anlamı farklı) | T8–T12 (R1): T8 gerçekte üst düğmeye `tikla` hatasız döner ama tık çerçevedeki tuvale gider, taklitte düğme tıklanır; T9 tersi; T10 gerçekte WrongDocumentError, taklitte ikinci kilit; T12 kısıtlama sayacı gerçekte sayfa başına | **Ertelendi** (kod): çerçeveler arası ortak durum ve olay yönlendirmesi büyük bir değişiklik; oyun tek çerçeveli, bugün çerçeveler arası kilit kullanan senaryo yok. Bilinen farklara ve README'ye yazıldı. Karakterize eden kayıt: `gk_karsilastir` çıktıları (`son2/yeniden/`, `son2/dogrulama/`); `run.cjs` adımları alt çerçevede o çerçevenin jestiyle istek yapamadığı için `kosucu_negatif` çifti eklenmedi |
| GZ-4 (düşük): üç yanlış ifade | (a) `input.js:64` window yakalama `mousedown` dinleyicisi oyunda var (grep); (b) T1/T5/T6 (R1): donmuş konum hedefteyken iki kipte de `tikla` hatasız döndü, düğme tık almadı, tık tuvale gitti; (c) R2 A6: imleç (0,0)'a çekiliyor | `ortak.cjs` (bilinen farklar, yönlendirme yorumu), `coop.cjs` başlığı, README: (a) "oyunda bir tane var, etkisiz", (b) "imleç hedefin üstünde değilse zaman aşımı, üstündeyse hatasız döner ama düğme etkinleşmez; etkiyi sonraki onayla denetleyin", (c) "(0,0)" |
| GZ-5 (düşük): `02_acilis_akisi` AA15 gerçek kilitte yük altında yanlış KALDI verebiliyor | inceleyicinin ham raporları: gerçek kilitte AA07 tabanı yükleme bitmeden alındı (geometri 534; adım 17: 17,4 sn, taklitte 2,5 sn), AA15 eşiği 717,5 < 839 → KALDI; taklitte 727 → 833, geçti. Senaryo kodu (w2, B0'ın): taban `wait 2500` sonra alınıyor | **Ertelendi**: senaryo B0'ın (w2'de); bu iş akışında w2'ye yazılmaz. Not: AA15'teki gerçek ↔ taklit farkı taklitten değil gerçek kilidin yükünden; gerçek kilitli tek G koşusu bu kontrol için kanıt sayılmamalı (son düzelticinin "G'si de aynı" satırı düzeltildi). Öneri B0'a: tabanı yükleme bittikten sonra alın |
| KC-1 (orta): renderer çökmesi kopma yoluna girmiyordu | yeni durumlar değişiklik öncesi koşucuya karşı (`son2/yeniden/N2_kn_once/`: rk ZAMAN_ASIMI (RK02 koşup 'Target crashed' ile kaldı, metrics adımı 90 sn asılı kaldı), rw KOSUCU_HATASI ('page.waitForTimeout: Page crashed'), rm ZAMAN_ASIMI (metrics isteği asılı), rc KOSUCU_HATASI (iki EVALERR, sonra tick()'in waitForTimeout'u 'Page crashed'), rg KALDI ama çöken konuğa beş EVALERR ve RG02 sayıldı); inceleyicinin koşuları (`k17/inceleme2_cokme/kosu/03_rk`, `04_rc`) aynı sonucu vermişti. Ayrıca bu turda bulunan: **tarayıcı** metrics adımının CDP isteği sürerken ölünce de istek asılı kalıp koşu ZAMAN_ASIMI oluyordu (`son2/yeniden/N1_kn_once/rm`: 90 sn, ZAMAN_ASIMI) | `run.cjs`: `crash` olayı kopmadır (`kopma.tur` 'renderer', `hatalar.sayfa`'da `SAYFA ÇÖKTÜ (renderer crash): …`, kalan adımlar koşmaz); `KAPANMA`'ya 'Target crashed'/'Page crashed'; metrics adımının CDP istekleri kopmayla ve 120 sn sınırla yarışır; kopmuş sayfanın görüntüsü ve yerleşme beklenmez. `coop.cjs`: çöken sekme o oyuncunun sayfa hatası + kopma (`kopma.cokenler`); yarıdaki istek hata sayılmaz; `tick()` Node zamanlayıcısıyla bekler. Durumlar: rk, rw, rm (renderer: js, bekleme, metrics), tm (tarayıcı: metrics), rc (oda sahibi), rg (konuk) |
| KC-2 (düşük): co-op'ta ilk `check()`'ten önce kopunca neden'e yanlış "hiç onay içermiyor … meta.olcum" | `rd` değişiklik öncesi koşucuyla (gerçek tarayıcı): neden'de "senaryo hiç onay içermiyor …" vardı, "ilk onaydan önce" yoktu (`son2/yeniden/N1_kn_once/rd`) | `coop.cjs`: kopma varken neden "senaryo ilk onaydan önce yarıda kaldı (koşu koptu; check() çağrılamadı)". Durum: rd |
| KC-3 (düşük): belge "kalan adımlar koşmaz" diyordu; co-op'ta senaryo sürüyor, kopmadan sonraki kontroller sayılıyordu | `te` (yeni beklenti) değişiklik öncesi koşucuyla: TE02 kaydedilmiş ve geçmiş (`son2/yeniden/N1_kn_once/te`) | `coop.cjs`: kopmadan sonra ilk `ev()`/`tick()`/`tikla()` kopma hatası atar, senaryo durur; senaryo hatayı yakalayıp sürse de kopmadan sonraki `check()` sayılmaz (`kopma.sayilmayanKontrol`). README ve bu belge iki koşucuyu ayrı anlatıyor. Durumlar: te (TE02 artık koşmaz), rg (yakalanan kopma hatasından sonraki check sayılmaz) |
| KC-4 (düşük): `run.cjs:242` yorumu ("--uretim'de window'a hiçbir şey eklenmez") | `grep` | Yorum düzeltildi: "--uretim'de bu tür ölçümü betiği eklenmez — varsayılan kipte işaretçi kilidi taklidi --uretim'de de eklenir" |

### Gerçek kilitli ↔ taklitli kayıtların karşılaştırılması üzerine not (#69 için)

GZ-1 yüzünden B0'ın gerçek kilitli "önce" kayıtlarıyla taklitli "sonra" kayıtları arasındaki kamera ya da yürüyüş yönüne bağlı farklar
yalnız selin CPU yükünden değil, gerçek başsız kilidin **kilit alınışındaki fare sıçramasından** da gelebilir: gerçek kilitte her kilit
alınışı −(imleç konumu) kadar hareket verir (400 px'i aşan sıçrama `input.js:84` süzgecinde zamanlamaya bağlı atılır ya da atılmaz),
taklitte hiç vermez. İnceleyicinin `02_acilis_akisi` gerçek kilitli koşusunda 1200 ms'lik W yürüyüşü (−0,62, 210,72)'ye çapraz gitti;
B0'ın gerçek kilitli kaydında (2, 209,45), taklitte (2, 211,50) (inceleyicinin ölçümü; bu turda yeniden koşulmadı). Ayrıca GZ-5: AA15
gerçek kilitte yük altında yanlış KALDI verebilir. Gerçek kilitli tek bir koşu bu tür kontroller için kanıt sayılmamalı.

### Son kodla doğrulama (`son2/`)

Doğrulanan kod: `run.cjs` 285211cf, `coop.cjs` 9292115d, `ortak.cjs` d46459b0, `kosucu_negatif.mjs` 8d84ec85. Koşulardan sonra `ortak.cjs`'te yalnız bir yorum (taklit işlevinin dışındaki bilinen farklar notu: 400 px üstü fare çifti) düzeltildi: son sha 53358e1c; `ISARETCI_TAKLIT`, `ISARETCI_SAYAC_JS` ve `tiklaTaklitli` bayt bayt aynı, esbuild ile yorumları atılmış kod aynı (tam sha'lar `son2/kod_sha.txt`).
Koşular 2026-11-15 05:45–06:32 UTC, `tk` kilidiyle tek tarayıcı; 17, `02_acilis_akisi` ve co-op ölçüm ajanının örnekleyicisiyle
(`ornekle2.mjs`, 0,5 sn) ve iplik gözlemcisiyle (`iplik.mjs`, 2 sn) sarıldı. Bu turda OOM olmadı (`oom_kill` 0 → 0; `dmesg`'de
"Killed process" yok). cgroup tepesi oturumun öteki işlerini de içerir (koşu anında chrome dışı ~840–900 MB).

| Doğrulama | Sonuç |
|---|---|
| `kosucu_negatif` tümü, son kod (`son2/dogrulama/kosucu_negatif/`) | GECTI: 73 PASS, 0 FAIL (06:10–06:13). Son düzeltici 2'nin 9 yeni durumu (rk, rw, rm, tm, rc, rg, rd, ig, ih) ve yeni te beklentisi dahil; A1'in, 3. denemenin ve son düzelticinin bütün durumları geçmeye devam ediyor |
| Yeni durumlar değişiklik öncesi koşucuya karşı (`son2/yeniden/N1_kn_once/`, `N2_kn_once/`) | rk ZAMAN_ASIMI (90 sn), rw KOSUCU_HATASI, rm ZAMAN_ASIMI (90 sn), rc KOSUCU_HATASI, rg KALDI ama RG02 sayıldı, rd neden'de "hiç onay içermiyor", te TE02 sayıldı, ig taklit üç çerçevede de kilit verdi: sekiz durumun sekizi de değişiklik öncesi koşucuda beklenen sonucu vermedi (`kosucu_negatif`: KALDI), yani eski açıkları yakalıyorlar; ih (gerçek kilit; taklide bağlı değil) PASS. N1'deki ilk denemede kendi hatam yüzünden (öldürme hedefi aktarılmadı) renderer yerine tarayıcı öldürüldü; o koşunun rk/rw/rc/rg'si geçersiz sayıldı ve N2 ile yinelendi, rm'si ise tarayıcı ölümünde de metrics isteğinin asılı kaldığını gösterdi (ZAMAN_ASIMI): bu yüzden tm eklendi |
| 17 v0.4 T (`son2/dogrulama/V_17v04_T*`) | GECTI 13/13; tarayıcı VmHWM 96,5 MB, renderer 471,6 MB, chrome toplamı tepe 1244 MB, cgroup tepe 2138 MB; tarayıcı ana iplik %0,1, IO 27,9 uyanma/sn, Compositor %0,6; K05 15,4 sn, K08 29,6 sn (son düzelticinin T'si: 95,5 / 459 MB, %0,1, K08 29,0 sn) |
| B0'ın `02_acilis_akisi` T, v0.4 (`son2/dogrulama/V_acilis_T*`) | KALDI 22/23, yalnız AA09b: son düzelticinin T'si ve inceleyicinin T'siyle kontrol kontrol aynı; 17 `tikla` adımı hatasız; taklit sayaçları aynı (istek 5, verildi 5, bırakma 4); 107 sn; tarayıcı VmHWM 101,6 MB, renderer 450,8 MB; tarayıcı ana iplik %0,2 |
| Co-op `06b_esitlik_senkron` T, 2 oyuncu, w2 :8081 + yerel PeerJS (`son2/dogrulama/V_coop06b_T*`; `coop.cjs`'te `tick()` artık Node zamanlayıcısıyla bekliyor) | GECTI 18/18; son düzelticinin T'siyle kontrol kontrol aynı; iki oyuncuda da taklit verildi = 1; tarayıcı VmHWM 98,8 MB, renderer 414,9 MB; tarayıcı ana iplik %0,2; 134 sn (önce 129 sn) |
| İnceleyicinin `gk_karsilastir.cjs`'i son `ortak.cjs` ile (`son2/dogrulama/V_gkY.*`; değişiklik öncesiyle `son2/yeniden/R1_*`) | Taklit kipinde fikstür maddelerinin (T0–T15) yalnız T11 değişti: artık gerçek kilitle aynı (`red SecurityError: … sandboxed and the 'allow-pointer-lock' permission is not set.`, çerçevede `pointerlockerror`, konsolda aynı güvenlik iletisi); öteki maddeler değişiklik öncesiyle bayt bayt aynı (süreler hariç). Oyun bölümünde (G0–G8) taklitte tek fark G8'in hata iletisindeki deneme sayısı (3 → 2; aynı 3 sn zaman aşımı, panel açılmadı). Gerçek kilitte G2'nin 100 px'lik fare hareketi bu kez yaw'ı +0,924 rad (= 420 px × 0,0022) döndürdü (önceki koşuda 0): 400 px'i aşan (+x)/(−x) çiftinin biri oyunun süzgecine takıldı; G6–G8'de yaw 3,85 → 4,77. Gerçek kilidin zamanlamaya bağlı kamera sıçramalarının (GZ-1) bir örneği daha |
| Dokunulmaması gereken ağaçlar | v0.4 44d548c, v0.3 762f1c7, kosu 5479e3b, w2 03b5c97: `git status` temiz (0 değişiklik); hiçbir ağaçta kök `DenizKorsanlari-SonHazine.html` değişmedi; k17'de `js/`, `index.html`, kök html değişmedi; w2'ye yazılmadı (yalnız okundu) |

## w2'ye uygulama ve doğrulama (ana oturum, 15 Kasım 06:38–07:40 UTC)

Son düzeltici 2'nin yaması (`kosucu17.patch`, 821 dosya) w2'ye (03b5c97) `git apply --check` sonrası temiz uygulandı. Koşucu
dosyaları k17'nin son hâliyle bayt bayt aynı: `run.cjs` 285211cf, `coop.cjs` 9292115d, `ortak.cjs` 53358e1c, `kosucu_negatif.mjs`
8d84ec85. Kayıtlar `w2_dogrulama/` altında; koşular `tk` kilidiyle, Faz 1 B'nin iki uygulayıcısının koşularıyla aynı saatlerde
(kilit sırası, yükte). Bu turda OOM yok (`oom_kill` 0 → 0).

| Doğrulama | Sonuç |
|---|---|
| `kosucu_negatif` tümü, ilk koşu (`kosucu_negatif.log`; `tm`'nin ham raporu `ilk_tm/`) | **72/73**. Kalan `tm`: öldürme, js adımı bitmeden yetişti; kopma metrics adımı (3) yerine js adımında (2) kaydedildi (`kopma.adim` 2, 0,3 sn). Koşucu doğru davrandı: KALDI, `TARAYICI ÇÖKTÜ/KOPTU`, kalan adımlar koşmadı, asılı kalma yok. Kusur fikstürde: işaret (`[test] KOSUCU_NEGATIF_OLDUR`) js adımının **içinde** veriliyordu; yükte öldürme adımın yanıtından önce iniyordu |
| Fikstür düzeltmesi | `rm_renderer_olur_metrics.js` (rm ve tm), `rw_renderer_olur_bekleme.js`, `td_tarayici_olur_bekleme.js`: işaret artık `setTimeout(…, 0)` ile js adımının yanıtından **sonra**, bir sonraki görevde veriliyor (rm/tm'de 8 sn'lik meşgul görevin başında). `td`'nin beklentisi adım numarasına bakmıyordu, ama durum bekleme adımını sınadığını söylüyordu; aynı yarış ona da açıktı. Koşucu dosyaları değişmedi. Öteki öldürme fikstürleri (tc, rk: işaret uzun bekleyen js adımının içinde; te, rc, rg, rd: co-op `log()` ve uzun bekleme) bu yarışa açık değil |
| td, rw, rm, tm ×3, düzeltmeden sonra (`kosucu_negatif_alt{1,2,3}.*`) | 3/3 tekrarda dördü de PASS (rm/tm'de kopma adım 3, metrics) |
| `kosucu_negatif` tümü, düzeltmeden sonra (`kosucu_negatif_2.*`) | **GECTI 73/73** (07:06–07:25; 0 FAIL, kalan [], yanlış geçen []) |
| co-op `06a2_mesaj_kopma`, 3 oyuncu, v0.4 :8080 (`coop_06a2.*`) | GECTI 3/3; `ev()` istisnası 0, kapalı sayfa atlama 17 (kasıtlı kapatma yolu: `kapananlar` Tayfa kasitli) |
| co-op `06a_ag_guvenligi`, 3 oyuncu, v0.4 (`coop_06a.*`) | GECTI 10/10; istisna 0, kapalı sayfa atlama 19 |
| co-op `06c_dort_oyuncu`, 4 oyuncu, v0.4 (`coop_06c.*`) | GECTI 7/7; D4-02 `["playing","playing","playing","playing"]`, D4-03 `[3,3,3,3]`; 809 sn |
| co-op `06d_ganimet_canta`, 2 oyuncu, v0.4 (`coop_06d_v04_hedef_uyumsuz.*`) | **GEÇERSİZ karşılaştırma**: KALDI 7/8, `TypeError: DK.mod is not a function`. w2'nin 06d'si A2'de (1709023) `DK.mod` kancasına geçti; v0.4'ün oyun kodunda bu kanca yok. Koşucuyla ilgisiz |
| co-op `06d_ganimet_canta`, w2 :8081 (`coop_06d_w2.*`) | GECTI 9/9 |

**KI-233 için veri (kanıt değildir):** taklitle 06c v0.4'te 2/2 (ikinci inceleyici ve bu tur) ve 06a2 2/2 (ikinci inceleyici w2'de,
bu tur v0.4'te) temiz geçti; konuk menüye düşmedi. Gerçek kilitli kayıtlarda konuk 14 koşunun 3'ünde düştü. O oran sürse de dört temiz
koşunun şans eseri görülme olasılığı (11/14)⁴ ≈ 0,38; sel ile KI-233 arasındaki ilişki hâlâ bir hipotezdir.

## Dosyalar

- `olcum/`: 17 koşu (01–12 ana ölçüm, 22–24 02_arazi_yasam ekleri, 25–26 son sha). Her biri: rapor (`.json`), günlük (`.log`), dmesg, örnekleyici özeti (`_ozet.json`),
  2 sn'ye seyreltilmiş bellek dizisi (`_ornek_2sn.csv`), 10 sn'lik iplik CPU pencereleri (`_iplik_10sn.csv`); `ozet17.txt/.json`
  (ölçüm ajanının N koşularıyla yan yana), `surucu.log`, `zincir3.log`, `senaryo_sha.txt`.
- `tur/`, `coop/`: aynı biçimde; `tur/tur_ozet.txt/.json` taban karşılaştırması.
- `yoklama/`: 3. denemenin gerçek ↔ taklit yoklamaları; `isaretci_yoklama.json`: son kodun yoklamalarından (`son/yoklama/`) karşılaştırma.
- `kosucu_negatif/`: 3. denemenin son koduyla koşunun bütün günlük ve raporları (son kodla olanı `son/kosucu_negatif/`).
- `son/`: son düzelticinin kayıtları (son kodla): `kosucu_negatif/` (64/64), `kosucu_negatif_eski_kosucu/` (yeni durumların 3. denemenin
  koşucusuna karşı denetimi), `olcum/` (17 v0.4 ve w2, taklitli), `b0/` (B0'ın tikla kullanan senaryoları, v0.4; `karsilastirma.txt`
  B0'ın tabanlarıyla kontrol kontrol), `coop/` (06b), `blok/` (blok deneyi T/G ve çözümlemesi; inceleyicinin önceki kodla B1–B3
  çözümlemesi), `yoklama/` (yoklama3/4/5 son kodla; `../isaretci_yoklama.json` bunlardan yeniden üretildi), `araclar/`, `zincir.log`,
  `zincir_ek.log`, `kod_sha.txt`.
- `son2/`: son düzeltici 2'nin kayıtları: `yeniden/` (bulguların değişiklik öncesi koşucuyla yeniden üretimi: inceleyicinin
  `gk_karsilastir`/`gk_kamera` betikleri ve yeni `kosucu_negatif` durumları; `once_kosucu_sha.txt`), `dogrulama/` (son kodla:
  `kosucu_negatif` tümü, 17 v0.4, B0'ın `02_acilis_akisi`, co-op 06b, `gk_karsilastir`), `araclar/`, `zincir.log`, `kod_sha.txt`.
- `olcum_ajani/`: ölçüm ajanının kök neden kanıtları (X1 iz özeti, X2, R/N/E raporları ve özetleri). 28 MB'lık ham iz scratch'te kaldı.
- `araclar/`: sürücü, örnekleyici, gözlemci ve özet betikleri (`.txt`).
- `w2_dogrulama/`: w2'ye uygulamadan sonraki doğrulama (yukarıda): `ozet.txt`, `ozet_fikstur.txt`, koşu günlükleri ve raporları, zincir betikleri (`.sh.txt`).
- `kod_sha.txt` (son kodun sha'ları; `son2/kod_sha.txt` ile aynı; son düzelticinin kodu `son/kod_sha.txt`'te), `yorum_farki.diff`: 3. denemede ölçümlerden sonra yapılan yalnız yorum değişikliği (aşağıda).

## Ölçümden sonra değişenler

### 3. deneme: yalnız yorum

Ölçümler `run.cjs` ac83547e / `ortak.cjs` 4131a54e ile yapıldı. Sonra kök neden yorumları olası/kesin ayrımına göre düzeltildi
(`yorum_farki.diff`): sayfaya giden `ISARETCI_*` dizgeleri bayt bayt aynı, esbuild ile yorumları atılmış kod aynı. Son sha'larla
(`run.cjs` ed8820b9, `ortak.cjs` b29886a4) `kosucu_negatif` ve 17 (v0.4 ve w2, taklitli) yeniden koşuldu: aşağıdaki "son sha" satırları.

| Son sha ile | Sonuç |
|---|---|
| `kosucu_negatif` (kn5, 02:37–02:39) | GECTI: 54 PASS, 0 FAIL (`kosucu_negatif/tum.log`; yorum düzeltmesinden önceki kn4 de 54/54: `kosucu_negatif/kn4_yorum_oncesi_tum.log`) |
| 17 v0.4 T (`olcum/25_17v04_T`) | 13/13; tarayıcı 96,3 MB, renderer 453,5 MB, cgroup 1327 MB, tarayıcı ana iplik %0 |
| 17 w2 T (`olcum/26_17w2_T`) | 13/13; tarayıcı 96,7 MB, renderer 471,2 MB, cgroup 1324 MB, tarayıcı ana iplik %0 |

### Son düzeltici: tıklama yolu ve rapor anı değişti

Yukarıdaki ölçüm tablosu 3. denemenin koduyla alındı (`run.cjs` ac83547e/ed8820b9, `ortak.cjs` 4131a54e/b29886a4). Son düzeltici kodu
değiştirdi (inceleme DOG-1..4): taklitte tıklama kararı (`tik`) ve `tiklaTaklitli`, rapor durumunun bütün await'lerden sonra
hesaplanması, co-op `tikla` yardımcısı, yorumlar. Bu değişiklikler yalnız `tikla` sürerken etkin olan bir yol ekler ve raporun
hesaplanma anını değiştirir; ölçülen senaryoların (17 v0.4 ve w2, 02_arazi_yasam kopyası, tür senaryoları, co-op 06b) hiçbiri `tikla`
kullanmıyor (`grep -c tikla`: 0). Sel ve bellek sonuçlarının son kodla aynı kaldığı ve tıklama yolunun gerçek kilitle aynı sonucu
verdiği yeniden ölçüldü: "Son düzeltici" bölümündeki doğrulama tablosu.

### Son düzeltici 2: çökme yolları, sandbox ve belgeler

Son düzeltici 2 kodu yine değiştirdi (ikinci inceleme KC-1..4, GZ-2): renderer çökmesi ve kopma sonrası davranış (yalnız çökme ya da
kopma olduğunda etkin yollar), metrics adımının CDP isteklerinin kopma/süre yarışı (sağlıklı sayfada sonuç aynı), `tick()`'in 40 ms
beklemesi Playwright yerine Node zamanlayıcısıyla, taklitte sandbox'lı alt çerçeve kuralı (yalnız alt çerçevede etkin; üst düzey belgede
hiç uygulanmaz). Ölçülen senaryoların hiçbiri alt çerçevede kilit istemiyor. Sel/bellek sonucunun ve tıklama yolunun son kodla aynı
kaldığı yeniden ölçüldü: "Son düzeltici 2" bölümündeki doğrulama tablosu.

## Yeniden üretme

```
# taklitli (varsayılan) ve taklitsiz 17 (k17'den; oyun :8080 v0.4, :8081 w2)
/home/user/devtools/tk timeout 960 node tests/harness/run.cjs <17_v04.js> --url http://localhost:8080/index.html --size 640x360 --timeout 900 --report r.json
/home/user/devtools/tk timeout 960 node tests/harness/run.cjs <17_v04.js> --url http://localhost:8080/index.html --size 640x360 --timeout 900 --report r.json --isaretci-kilidi gercek
# kosucu_negatif
/home/user/devtools/tk node tests/node/kosucu_negatif.mjs --kosucu-dizin $PWD/tests/harness
# yeni durumları başka bir koşucuya karşı (ör. 3. denemenin run/coop/ortak.cjs'inin kopyalandığı dizin) koşmak
/home/user/devtools/tk node tests/node/kosucu_negatif.mjs --kosucu-dizin <dizin> --sadece ia,ib,ia2,ie,ie2,pk7,pk5,pk
# son düzeltici 2'nin durumları (renderer/tarayıcı öldürme, co-op kopma, sandbox'lı çerçeve)
/home/user/devtools/tk node tests/node/kosucu_negatif.mjs --kosucu-dizin <dizin> --sadece rk,rw,rm,tm,rc,rg,rd,te,ig,ih
# inceleyicinin gerçek kilit ↔ taklit karşılaştırma betikleri (son2/araclar/*.txt; ORTAK ortam değişkeni ortak.cjs yolunu seçer)
ORTAK=$PWD/tests/harness/ortak.cjs /home/user/devtools/tk timeout 590 node gk_karsilastir.cjs cikti.json
ORTAK=$PWD/tests/harness/ortak.cjs /home/user/devtools/tk timeout 580 node gk_kamera.cjs cikti.json
# blok deneyi (son/araclar/blok.js.txt → blok.js); bellek ve iplik örneklemesi: son/araclar/ornekle_i.py.txt, çözümleme blok_analiz.py.txt
/home/user/devtools/tk timeout 600 node tests/harness/run.cjs blok.js --url http://localhost:8080/index.html --size 640x360 --timeout 540 --report b.json --goruntu yok [--isaretci-kilidi gercek]
# B0'ın tikla kullanan senaryoları (w2'den okunur), v0.4'e karşı; karşılaştırma son/araclar/karsilastir_rapor.py.txt
/home/user/devtools/tk timeout 600 node tests/harness/run.cjs /home/user/SON-HAZ-NE-w2/tests/scenarios/02_acilis_akisi.js --url http://localhost:8080/index.html --size 640x360 --timeout 540 --report a.json [--isaretci-kilidi gercek]
```
Son düzelticinin zincirleri: `son/araclar/zincir_son.sh.txt`, `zincir_ek.sh.txt`; kayıtların kopyalanması `belge_son.sh.txt`.
`17_v04.js` = `git -C /home/user/SON-HAZ-NE show 44d548c:tests/scenarios/17_kamera_kararma.js`. Sürücü: `araclar/surucu17b.sh.txt`.
