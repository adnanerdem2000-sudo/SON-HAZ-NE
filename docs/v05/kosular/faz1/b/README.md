# Faz 1 Adım B0: arazi ve açılış testleri, "önce" yarısı

**Amaç.** Faz 1 B'de düzeltilecek her denetim maddesi için önce bir test yazmak ve bu testin v0.4'te kırmızı olduğunu göstermek. Düzeltmeden sonra aynı testlerin w2'de yeşile dönmesi düzeltmenin kanıtı olacak. Görev tanımı `faz1b_brief.md` dosyasındadır. Testlerdeki "brief madde N" başvuruları bu dosyanın maddeleridir. Denetim kimlikleri (A-02…A-19) `docs/v05/tasarim/denetim_ham/audit_A.json` ve `dogrulama/dogrulama_A.json` dosyalarındadır.

**Kim yaptı.** Üç ajanlı bir iş akışı:
1. test yazıcı;
2. bağımsız inceleyici: 17 bulgu çıkardı;
3. test düzeltici: 17 bulgunun 17'sini kapattı.

Ham sonuç `b0_is_akisi_sonucu.json`, düzelticinin günlüğü `duzeltici_ilerleme.md` dosyasındadır. Oyun koduna, koşuculara ve A2 dosyalarına dokunulmadı. Ana oturum dosyaları inceledi; var olan iki senaryoda eski kontrollerin ve etiketlerin hepsinin durduğunu denetledi, sonra commit'ledi.

## Yazılan testler

| Dosya | Kontrol | Kapsadığı maddeler |
|---|---|---|
| `tests/node/arazi_sozlesme.mjs` | 36 | Karo/derinlik/ızgara veri sözleşmesi; işçi yolu ile yerel yolun bayt eşitliği; heightAt ile çizilen ağın tutarlılığı. Gerileme koruması (madde 17). |
| `tests/node/arazi_kuyruk.mjs` | 92 | Sahte işçiyle kuyruk: kurucu hatası, 404, hazır sinyali yok, askı, çökme, MAX_TRIES, 'error' iletisi, kalıcı karo hatası, iptal, odak, örtüşen prepare, ızgara önbelleği, LOD histerezisi, KY25 (dilim süresi, belirlenimli). Maddeler 3, 4, 7, 8, 9, 11, 12, 17. |
| `tests/scenarios/02_hizli_yolculuk.js` | 34 | Oyunun kendi fastTravel yolu ile uzak adaya ışınlanma (5,3 km); yolculuk sırasında ikinci istek ve menüye dönüş (A-03); açık denizde ölüp yeniden doğma (A-14); zaman aşımı bildirimi. Maddeler 5, 10, 19. |
| `tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs` | 8 | Konuk tarafında 'teleport' işleyicisi (A-03, madde 5). |
| `tests/scenarios/02_arazi_yasam.js` | 18 | Her kipte açılış; LOD yarışı; silinen karonun geç sonucu; örtüşen prepare; ızgara önbelleği; 8 km açık deniz dolaşımı; yedek kipte dilim süresi; geometri sızıntısı. |
| `tests/scenarios/02_arazi_isci_hata.js` | 9 | Yalnız işçili kipte: 'error' iletisi, çökme, MAX_TRIES, kalıcı karo hatası, kısmi kurucu hatası (madde 3, 17). |
| `tests/scenarios/02_acilis_hatalari.js` | 19 | Açılışta ızgara reddi (A-02, madde 1); WebGL yok, import map yok, modül 404, askıda kalan varlık (A-04, madde 2); hazır olmayan ya da yanıtsız işçide açılış süresi (A-11, madde 7). |
| `tests/scenarios/02_yukleme_bekleme.js` | 9 | Kayıt yüklemede bekleme penceresi: yükleme katmanı, G.state, Esc, iptal (A-10, madde 6). |
| `tests/scenarios/02_ayar_lod.js` | 11 | Arazi LOD ölçeği ve gölge boyutu açılış sırası (A-19 / KI-130, madde 16). Değişiklikler gerçek ayar arayüzünden yapılır. |
| `tests/scenarios/02_depolama_kapali.js` | 15 | localStorage engelliyken açılış ve çevrimiçi yol (A-18, madde 15). |
| `tests/scenarios/02_acilis_akisi.js` | 23 | 62 test listesi 6–10: gerçek tıklama ve klavyeyle menü → yeni oyun → kaydet → menüye dön → devam et → yeni dünya; dünya değişiminde kalıntı yok (madde 19). |
| `tests/scenarios/02_tek_dosya_kipler.js`, `02_tek_dosya_blob.js`, `02_tek_dosya_cerceve.js` | 4 + 4 + 5 | Tek dosyada file:// + badurl (A-17); blob: işçisi reddinde data: ile ikinci deneme (A-16); sandbox'lı iframe, köken 'null' (madde 13, 14). |
| `tests/scenarios/02_arazi_yedek.js` (eklendi) | +4 | AYK-01/02 kip denetimi; AYS-01 uzak bölge hazırlık süresi, çizim durdurulmuşken, üç bölgenin ortancası (madde 18a, 20); AYS-02 MAX_TRIES sınırı. Eski 12 kontrol ve etiketleri aynı; eski prepare adımına yalnız zaman kaydı eklendi. |
| `tests/scenarios/00_acilis.js` (eklendi) | +3 | AC01–AC03: G.state 'playing'e yalnız bölge hazırlığı bittikten sonra geçer (A-10). Eski 6 kontrol ve etiketleri aynı. |

Senaryolar `DK.terrain`, `DK.G` gibi test kancalarına ve terrain.js'in iç adlarına (`_apply`, `_requestTile`, `_lanes`, `_localSlice` ...) dayanır. Faz 1 B bir iç adı değiştirirse ilgili kontrol "iç ad yok" diye kalır; sessizce geçmez (B0-I13 düzeltmesi).

## Nasıl koşuldu

- **Hedef:** v0.4, `http://localhost:8080/index.html` (commit 44d548c).
- **Koşucu:** w2'deki A1 koşucusu (`tests/harness/run.cjs` sha 591dff27, `ortak.cjs` df191a99). Her günlüğün ilk satırları koşucu, senaryo ve hedef sha'larını yazar.
- **Tarayıcı kilidi:** Bütün tarayıcı koşuları `/home/user/devtools/tk` kilidiyle yapıldı; aynı anda tek tarayıcı açıktı.
- **Örnek:** `tk timeout 590 node tests/harness/run.cjs tests/scenarios/02_arazi_yasam.js --url 'http://localhost:8080/index.html?terrain=noworker' --size 640x360 --timeout 540 --report <rapor>.json`
- **Bütün komutlar:** her koşunun tam komutu `kosular.json` dosyasında.
- **Node testleri:** `node tests/node/arazi_kuyruk.mjs --kok /home/user/SON-HAZ-NE --rapor <rapor>.json`. `--kok` sınanacak ağaçtır; verilmezse dosyanın kendi ağacı (w2) sınanır.
- **Tek dosya senaryoları:** v0.4'ten derlenen tek dosyayla koşuldu. Derleyici `tools/build-single-html.mjs`; derleme v0.4 ağacına değil, geçici bir dizine yazıldı. Bu dosya geçici bir yerel sunucudan (127.0.0.1:8097) ve file:// adresinden açıldı. w2 için kullanım her senaryonun başındaki yorumda yazılıdır.
- **Uygulanamayan kipler:** Yeni `?terrain` kipleri (ctorthrow, noready, hang, crash1) v0.4'te yok. Bu kiplerdeki kontroller "UYGULANAMAZ" sayıldı. Aynı davranışlar v0.4'te Worker sarmalayıcısıyla ya da Node'da sahte işçiyle ayrıca kırmızı gösterildi.

## Sonuç (son sürüm testler, `once_v04/son/`)

| Koşu | Sonuç |
|---|---|
| arazi_sozlesme (Node) | 36/36 GEÇTİ (gerileme koruması) |
| arazi_kuyruk (Node) | 69/92: 23 kırmızı, KY25 dahil |
| 02_arazi_yedek normal / noworker / crash / badurl | dördü de 16/16 GEÇTİ |
| 02_hizli_yolculuk normal / noworker | 23/34 / 22/34 |
| 02_arazi_yasam normal / noworker / crash | 12/18 / 12/18 / 13/18 |
| 02_ayar_lod | 4/11 |
| 02_depolama_kapali | 2/15 |
| 02_acilis_akisi | 22/23 |
| 00_acilis | 6/9 |
| 02_acilis_hatalari | 3/19 |
| 02_yukleme_bekleme | 4/9 |
| 02_arazi_isci_hata | 5/9 |
| 02_tek_dosya_kipler / blob / cerceve | 3/4 / 3/4 / 2/5 |
| coop 02_hizli_yolculuk_konuk | 5/8 |

`siniflandirma.json` kontrolleri sınıflandırır (247 satır):
- **142 YEŞİL:** v0.4'te zaten doğru olan davranışın gerileme koruması.
- **95 KIRMIZI:** hedeflenen kusur.
- **10 UYGULANAMAZ:** v0.4'te test API'si ya da kip yok.

Hedeflenen bütün denetim maddeleri en az bir kontrolde kırmızı: A-02, A-03, A-04, A-05, A-06, A-07, A-08, A-09, A-10, A-11, A-12, A-13, A-14, A-15, A-16, A-17, A-18 ve A-19/KI-130.

Karşılanabilirlik ve duyarlılık da sınandı (`inceleme_sonuclari.json`). Depo dışı v0.4 kopyalarında:
- Brief'teki en küçük düzeltmeler uygulanınca hedeflenen kontroller yeşile döndü.
- Kusur geri konunca (mutasyon) kontroller kırmızıya döndü.

## Ortam uyarısı: işaretçi kilidi seli

`once_v04/` altındaki bütün tarayıcı koşuları, koşucunun işaretçi kilidi düzeltmesinden ÖNCE, gerçek kilitle yapıldı. Ölçüm ayrıntısı `../once_v04_tam/ONCE_KAPISI.md` ve `../kosucu17/KOSUCU17.md` dosyalarında (KI-238, commit `2586265`).

**Mekanizma:** Oyun başlarken fare kilidi alınıyor. Başsız Chromium kilitliyken saniyede on binlerce yapay fare olayı üretiyor. Bu olaylar sayfa JS'ine ulaşmıyor; sayfaya en çok 24 mousemove geliyor. Ama tarayıcı ve compositor süreçlerinde CPU tüketiyor ve belleği büyütüyor.

### Düzeltilmiş koşucuyla yineleme (`once_v04_taklit/`, #69)

B0'ın 20 tarayıcı koşusu son koşucuyla (işaretçi kilidi taklidi; `run.cjs` 285211cf) v0.4'e karşı yinelendi. Komutlar B0'ınkilerle aynı; tek fark koşucu. Kilide duyarlı iki koşu fazladan tekrarlandı: `02_arazi_yasam` normal ve işçisiz ×2, işçisiz `02_hizli_yolculuk` ×3. Toplam 24 koşu yapıldı (15 Kasım 06:47–09:05 UTC). OOM, kopma ya da yarım kalan koşu olmadı.

- **Karşılaştırma:** `once_v04_taklit/KARSILASTIRMA.md` ve `karsilastirma.json`, kontrol kontrol ve değer değer.
- **Sınıflandırma:** `once_v04_taklit/siniflandirma_taklit.json`, `siniflandirma.json`'un her satırı için taklitli "önce" sonucu. B0'ın dosyası değişmedi.
- **Bağımsız doğrulama:** iki karşıt doğrulayıcı (veri bütünlüğü ve yorum), salt okuma. Betikler ve çıktıları `once_v04_taklit/dogrulama/` altında.

**Sonuç:**
- 24 koşunun hepsinde durum (GECTI/KALDI) B0'la aynı. 20 koşu kontrol kontrol aynı.
- Tek sonuç farkı **LY13**: taklitle 4/4 geçti (normal ×2, işçisiz ×2); crash kipinde iki tarafta da geçti.
- Taklitli sınıflandırma: 143 YEŞİL, 94 KIRMIZI, 10 UYGULANAMAZ. Tek değişiklik LY13: KIRMIZI → YEŞİL.
- Aynı sonuçlu ama değeri değişen kontroller (`KARSILASTIRMA.md` "Aynı sonuç, farklı değer"):
  - **HK04 (co-op):** iki tarafta da KALDI, ama nedeni değişti. B0'da konuk yanlış limana taşınmıştı; taklitte doğru limanda (aUzaklik 1) ve kırmızı yalnız çift "vardınız" bildiriminden geliyor. Yanlış limana taşınma yarışa bağlı; taklitte görülmedi. A-03'ün belirlenimli "önce" kanıtı HK03.
  - **LY09 crash:** B0'da yalnız derinlik alt koşulu kalıyordu ("20 ağ"); taklitte iki alt koşul da kalıyor ("0 ağ"), işçisiz kiptekiyle aynı biçim.
  - **Değer değişimi (kalma biçimi aynı):** HI03/HI04 (87 → 120), HK07 (HK04'teki başlangıç konumundan) ve işçisiz HYS-01.
- **Bellek:** taklitle tarayıcı süreci 96–113 MB, renderer en çok 850 MB.

**Etkilenen kontroller ve sonra kapısı kuralları:**
- **LY13** (A-06, yedek kipte dilim süresi): Taklitle v0.4'te 4/4 geçti; gerçek kilitte ölçülebilen 20 kaydın 18'inde kalmıştı. Yani tarayıcıdaki "önce" kırmızısı selden geliyordu.
  - LY13 artık gerileme korumasıdır. Sonra kapısında geçmesi A-06'nın düzeldiğine kanıt sayılmaz.
  - A-06'nın belirlenimli "önce" kanıtı Node'daki KY25: v0.4'te p99 +90 ms, A-06 mutantında +2,5 ms.
  - Pay dar: taklitli normal koşularda p99 farkı 3,6 ve 1,4 ms (eşik 4 ms).
  - Denetimin A-06 kabulü daha sıkı: en uzun dilim ≤ bütçe + 4 ms. Bu ölçütle taklitli normal koşulardan biri (4,2 ms) kalırdı. Sonra kapısında bu ölçüt ayrıca raporlanır.
- **HYS-01** (bölge hazırlığı ≤ 3 sn):
  - İşçisiz kipte taklitle 19,7 / 20,3 / 22,2 sn, gerçek kilitte 28,7–44,7 sn idi. KI-237 selden bağımsız: selsiz bütün değerler sınırın en az 3,4 katı.
  - Bulgu 3'teki "45 sn zaman aşımına yakın" ifadesi seldendi; taklitte en çok 22,2 sn.
  - Önceki "kilit bırakılınca 10,3 sn, sel ~3 kat" ifadesi tek tanı koşusuna dayanıyordu. O koşuda kalkıştan önceki ~4,9 sn'lik ana iplik tıkanması ölçüm penceresinin dışında kalmıştı. Aynı pencereyle (çıkıştan hazırlık sonuna) gerçek kilit 29,3–31,5 sn, kilit bırakılmış tanı 15,2 sn, taklit 19,8–23,2 sn: sel yaklaşık 1,4–2 kat.
  - Normal kipte HYS-01 bir gerileme korumasıdır ama kararsızdır: v0.4'ün bütün ölçümleri 0,18–3,32 sn (taklit 0,78 ve 2,4 sn). Oyun başındaki çok saniyelik ana iplik tıkanması pencereye bazen giriyor. Sonra kapısında tek koşuya dayanılmaz: en az 3 koşunun ortancası, aynı pencerede v0.4 ile dönüşümlü.
- **AYS-01** kilitten etkilenmiyor: B0'da ve taklitte dört kipte 123–241 ms.
- **Açılış süreleri ve Node testleri** de etkilenmiyor: oyun oturumu başlamadan ölçülüyorlar.
- **Zaman karşılaştırmaları:** #69, B0'ın son koşularından kilitten bağımsız işte ~%30 yavaş bir pencerede koştu; sayfa hazır süresi oranının ortancası 1,30. Makine 03:27'de yeniden başlamıştı. Bu yüzden B0 ile taklit arasındaki süre farkları yalnız sele bağlanamaz.
  - Sonra kapısında zaman kontrollerinin "önce"si #69'un mutlak değerleri değil, w2 ile aynı pencerede dönüşümlü koşulan v0.4 değerleridir: HYS-01, LY13 payı, AYS-01, varisIlkKareMs, bellek tepeleri.
  - Durum vektörü (GECTI/KALDI) için "önce" değeri taklitli kayıtlardır.
- **Taklidin bilinen farkları** B0'ın hiçbir kontrolünün durumunu değiştirmiyor (doğrulama). Bu farklar: kilit alınışında fare sıçraması, çerçeve başına kilit, sandbox yaklaşığı.

## Geçersiz koşular

Şu kayıtlar sonuç sayılmadı; aynı koşu yeniden yapıldı:
- `once_v04/duzeltme*/kesik/` ve adında `_oom`, `_sayfa_coktu` geçen kayıtlar: container yeniden başladı ya da tarayıcı cgroup bellek sınırında çöktü.
- `duzeltme/02_tek_dosya_blob_ilk_acilis_takildi` (14 Kasım 14:50–15:03 UTC): senaryonun ilk sürümü (357a110956f8) blob reddinde koşucunun 240 sn `__ready` beklemesine takıldı ve KOSUCU_HATASI verdi. Son sürüm reddedilen sayfayı `goto {hazir: false}` ile açıyor.

## Bulunan oyun hataları (Faz 1 B ve sonra kapısı için)

Ayrıntılar `b0_is_akisi_sonucu.json` içinde, `sonuc.t.bulunan_hatalar` ve `sonuc.f.sonuclar` altında.

1. **Menüye dönüşte fare kilidi menüde kalıyor (AA09b).** Menü düğmelerine tıklanamıyor; kilit ancak Esc ile bırakılıyor.
   - Neden: Onay penceresinin "Evet" düğmesi önce `ui.close()` çağırıyor. `ui.close()` (`js/ui/ui.js:64`), `G.state === 'playing'` iken 30 ms sonra `input.lockPointer()` kuruyor. Ardından `toMenu` kilidi bırakıyor ama 30 ms'lik zamanlayıcı kilidi menüde yeniden alıyor.
2. **Hızlı yolculukla ek limanlara varışta oyuncu suya düşüyor (HYU-02, HYU-05).**
   - Biniş noktası iskele ekseninden 2,6 m yanda (`js/world/ports.js:47`).
   - İskele platformunun yarı genişliği 2,5 m (`js/world/islands.js` `_pier`).
   - Oyuncu platformun 0,1 m dışına konuyor. Arazi kusuru değil.
3. **İşçisiz kipte hızlı yolculuk hazırlığı 10–45 sn sürüyor.** 45 sn zaman aşımı sınırına yakın; zaman aşımında varış sessizce eksik kalıyor.
   - **#69 (taklit):** 19,7–22,2 sn; sınırın en az 3,4 katı. "45 sn'ye yakın" kısmı seldendi (yukarıda).
   - KI-234'ten ayrı bir konu.
   - Olası neden: yükleme ekranı yerel dilim bütçesini 40 ms'ye çıkarıyor, hızlı yolculuk perdesi çıkarmıyor (10 ms). Bu kanıtlanmadı.
4. **Uzak limana varıştan sonraki ilk kare 26–37 sn gecikiyor.** Bölge hazırlığı ise 0,27–1,4 sn sürüyor. Olasılık: yeni gölgelendirici derlemeleri (yazılımsal WebGL). Sel etkisi ölçülmedi; Faz 8 konusu.
   - **#69 (taklit):** Gecikme selden bağımsız olarak var, ama sel aynı pencerede onu ~2,5 kat büyütüyordu.
     - Normal kip: taklitle 13,7–14,9 sn; bunun ~9,4–10,8 sn'si hazırlıktan sonraki ilk kare. Gerçek kilitte 26,5–34,3 sn.
     - İşçisiz kip: 26–34 sn; çoğu KI-237 hazırlığı. Hazırlıktan sonraki ilk kare 4,2–9,5 sn.
     - `varisIlkKareMs` hazırlığı da içerir; Faz 8'de yalnız hazırlıktan sonraki kısım ölçülmeli.
5. **Ardışık uzak varışlarda bellek büyüyor.** İki ayrı koşuda renderer 6,2 GB ve 5,4 GB'a çıkıp cgroup sınırında çöktü. Koşucu düzeltmesinin 17_kamera_kararma ölçümlerinde renderer belleği gerçek kilitle 2,3–4,8 GB, kilit taklidiyle yaklaşık 0,47 GB. Bu yüzden büyümenin önemli bir kısmı sel kaynaklı olabilir; koşucu düzeltmesinden sonra hızlı yolculukta yeniden ölçülecek.
   - **#69 (taklit):** GB'lık büyüme ve OOM seldendi. Taklitle hızlı yolculuk koşularında renderer en çok 0,85 GB, tarayıcı ~0,1 GB; çökme yok.
     - Kapanmadı: işçisiz kipte tek koşu içinde renderer anon belleği bölümden bölüme büyüyor (272 → 480–631 MB, koşu başına +200–300 MB). Normal kipte büyüme yok (290 → 316 MB).
     - Sızıntı olup olmadığı Faz 8'de ölçülecek. Örnek dizileri `once_v04_taklit/bellek/`.
6. **KI-234'ün tanımı yanlış.** v0.4'te crash kipinde kuyruk kusuru yok.
   - crash, badurl ve noworker kuyruk açısından aynı davranıyor.
   - Çizim durdurulunca dört kip de 150–211 ms.
   - Ölçülen 28,8 sn'lik gecikmeler, hazırlık penceresine denk gelen ana iş parçacığı ya da GPU duraklamasından geliyor.
   - AYS-01/02 bundan sonra A-15'in getireceği yeniden başlatma yolunda gerileme koruması olarak duruyor.

## Dizin yapısı

- `once_v04/`: test yazıcının ilk "önce" koşuları (ilk sürüm testler) ve `inceleme_*` (inceleyicinin koşuları).
- `once_v04/duzeltme/`, `duzeltme2/`, `duzeltme3/`: düzelticinin üç denemesindeki ara koşular, tanılar ve mutasyon kanıtları. `duzeltme3/isaretci/` işaretçi kilidi tanısıdır; betiği `isaretci_tani.js` de oradadır.
- `once_v04/son/`: son sürüm testlerle son "önce" koşuları, gerçek kilitle (A1 koşucusu).
- `once_v04_taklit/` (#69): aynı koşular son koşucuyla (taklit). İçinde:
  - koşu `.json`/`.log`/`_bellek.json`;
  - `zincir.log`;
  - `KARSILASTIRMA.md`, `karsilastirma.json`, `siniflandirma_taklit.json`;
  - `bellek/`: 0,5 sn'lik örnek dizileri;
  - `araclar/`: zincir, karşılaştırma ve sınıflandırma betikleri;
  - `dogrulama/`: iki doğrulayıcının betikleri ve çıktıları.

  Sonra kapısında durum vektörü bunlarla karşılaştırılır; zaman kontrolleri için yukarıdaki kurala bakın.
