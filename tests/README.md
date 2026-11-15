# Test altyapısı

Oyunun otomatik testleri başsız Chromium (Playwright) ile çalışır. Bu ortamda gerçek ekran kartı yoktur;
çizim yazılımsal WebGL (SwiftShader) ile yapılır. Bu yüzden **FPS ölçümleri donanım değeri değildir**; oyun mantığı
süreleri (ms/kare), çizim çağrısı/üçgen sayıları ve bellek ölçümleri anlamlıdır.

## Hazırlık
```bash
python3 -m http.server 8080            # depo kökünde statik sunucu
node tests/peer-server.cjs &           # yalnız co-op testleri için (npm i peer)
```
Playwright: `require('playwright')` ve bir Chromium kurulu olmalı (`npx playwright install chromium`).

## Tek sayfalı senaryolar
```bash
node tests/harness/run.cjs tests/scenarios/<ad>.js --size 960x540 --report /tmp/rapor.json
```
Senaryo dosyası adım dizisi döndürür (`js`, `wait`, `expect`, `snap`, `view`, `shot`…; ayrıntı `tests/harness/run.cjs` başında).
Sayfadaki yardımcılar (`window.DK`):
- `DK.sim(saniye, dt=1/30)` — oyunu çizmeden ileri sarar (deterministik adım).
- `DK.press(kod, süre)`, `DK.tap(kod)` — tuş simülasyonu; `DK.G.noAutoPause = true` odak kaybı duraklatmasını kapatır.
- `DK.snap()` / `DK.snapFrom(from, to)` — yalnız 3B tuvali yakalar (sayfa ekran görüntüsünden daha kararlı).
- `DK.handlers.startGame({kind:'solo', slot:2, data:null})` — yeni oyun; `DK.terrain.prepare(x, z, {radius})` — bölge hazırlığı.
- Tüm sistemler `DK` üzerinde: `DK.G` (oyuncu, gemi, durum), `DK.enemies`, `DK.bosses`, `DK.animals`, `DK.megafauna`,
  `DK.hazards`, `DK.events`, `DK.worldEvents`, `DK.net`, `DK.progress`, `DK.terrain`, `DK.physics`, `DK.bodies`…

## Co-op senaryoları
```bash
node tests/harness/coop.cjs tests/scenarios/coop/<ad>.cjs --players 2 --size 640x360
```
Senaryo modülü `async ({ pages, host, guests, ev, tick, check, log, tikla }) => {}` dışa aktarır. Arayüz tıklaması için
`tikla(page, hedef, etiket?)` (hedef: CSS seçici, `{metin, tam?}` ya da o sayfanın locator'ı; `run.cjs`'in `tikla` adımıyla aynı).

## İşaretçi kilidi taklidi ve tarayıcı çökmesi (Faz 1, kosucu17)
Başsız Chromium'da gerçek işaretçi kilidi (oyun oturum başında `input.lockPointer()` çağırır) açık kaldıkça tarayıcı saniyede
on binlerce sentetik fare olayı üretir; uzun senaryolarda renderer ana ipliği meşgulken tarayıcı ve renderer belleği birlikte büyüyüp
bellek sınırında OOM'a yol açıyordu (biriken şey olası olarak onayı gecikmiş olayların durumu; doğrudan görülmedi).
Koşucular (`run.cjs`, `coop.cjs`) bu yüzden varsayılan olarak kilidi **taklit eder** (`requestPointerLock`, `exitPointerLock`,
`pointerLockElement` ve `pointerlockchange`/`pointerlockerror` olayları gerçek kilitle aynı gözlenebilir anlamla; gerçek kilit
istenmez). Kilitliyken fare olayları da gerçek kilitteki gibi kilitli öğeye (oyunda tuval), kilit anındaki imleç konumuyla gider:
kilitliyken bir arayüz düğmesine tıklayan adım (`tikla`, `click`) gerçek kilitte olduğu gibi amacına ulaşmaz. `tikla`, kilit anındaki
imleç konumu hedefin üstünde değilse zaman aşımına düşer (kilit tıklama görünürlük beklerken alınsa da); üstündeyse **hatasız döner
ama tık kilitli öğeye gider, düğme etkinleşmez** (gerçek kilitle aynı): etkiyi sonraki bir onayla denetleyin. Co-op senaryolarında
arayüz tıklaması `tikla` yardımcısıyla yapılmalı: Playwright'ın `page.click`/`locator.click`'i doğrudan çağrılırsa taklitte kilitliyken
tık sessizce kilitli öğeye gider (gerçek kilitte zaman aşımı olurdu). Arayüz panelleri kilidi kendisi bırakır (`ui.open` →
`input.unlockPointer()`); tıklamadan önce panel açılmış olmalı.

Taklidin gerçek başsız kilitten bilinen farkları (ölçüldü; ayrıntı `tests/harness/ortak.cjs` başında):
- **Kilit alınışında fare sıçraması yok.** Gerçek başsız kilitte imleç (0,0)'a çekilir ve her kilit alınışında oyuna −(kilit anındaki
  imleç konumu) kadar tek bir fare hareketi gelir (kamera döner; ör. (320,150)'de +0,704 rad); kilitliyken her Playwright fare hareketi
  (+x,+y)/(−x,−y) çifti verir (çoğunlukla toplam 0, fare bakışı çalışmaz; |x| ya da |y| 400 px'i aşınca oyunun süzgeci çiftin birini
  zamanlamaya bağlı atabilir ve kamera sıçrar). Taklitte kilit alınışı hareket üretmez, Playwright hareketleri doğal
  `movementX/Y` verir. Gerçek kilitli ve taklitli kayıtlar arasında kamera ya da yürüyüş yönüne bağlı farklar bu yüzden de çıkabilir.
- **Çerçeveler.** Taklit çerçeve (belge) başınadır: kilit sahibi, olay yönlendirmesi ve istek kısıtlaması çerçeveler arasında
  paylaşılmaz (gerçekte sayfa başına). Çerçeveler arası kilit davranışı `--isaretci-kilidi gercek` ile sınanmalı.
- **Sandbox'lı çerçeve** (`allow-pointer-lock` yok): gerçek Chromium isteği `SecurityError`, `pointerlockerror` ve konsolda güvenlik
  hatasıyla reddeder; taklit bunu yaklaşıkla uygular (alt çerçevede, okunabilen `sandbox` özniteliğine ya da opak kökene göre). Opak
  kökenli çerçevede `allow-pointer-lock` okunamaz (taklit reddeder), çapraz kökenli çerçevenin özniteliği okunamaz (taklit verir):
  böyle çerçevelerde kilide bağlı davranış `--isaretci-kilidi gercek` ile sınanmalı. Konsoldaki güvenlik iletisinin metni aynıdır,
  konumu (adresi) taklitte boştur (gerçekte çerçevenin adresi): adresle yazılmış bir izin taklitte eşleşmez.

Taklit `--uretim` kipinde de kurulur: `window`'a ad eklemez ama dört yerleşik üyeyi değiştirir (`Element.requestPointerLock`,
`Document.exitPointerLock`, `Document`/`ShadowRoot` `pointerLockElement`) ve `window`/`document`'a yakalama dinleyicileri kurar;
`U00` dahil üretim koşuları bu değiştirilmiş yerleşiklerle koşar. Sayfaya hiçbir şey eklenmeden koşmak ya da karşılaştırma ölçümü
için `--isaretci-kilidi gercek` taklidi kapatır. Ayrıntı ve ölçüm: `tests/harness/ortak.cjs` (`isaretciKilidiTaklidi`,
`tiklaTaklitli`), `docs/v05/kosular/faz1/kosucu17/`.

Tarayıcı süreci ölür ya da bağlantı koparsa rapordaki `hatalar.sayfa`'ya `TARAYICI ÇÖKTÜ/KOPTU …`, sayfanın renderer süreci ölürse
(bellek sınırındaki OOM'un sık kurbanı) `SAYFA ÇÖKTÜ (renderer crash): …` yazılır, durum KALDI olur, `kopma` alanı ayrıntıyı verir
(`kopma.tur`: `tarayici`, `renderer`, …). `run.cjs`'te kalan adımlar koşmaz (`kopma.kosmayanAdim`; yarıda kalan adım
`kopma.yaridaKalan`). `coop.cjs`'te kopmadan (tarayıcı kopması ya da bir oyuncunun sekmesinin çökmesi) sonraki ilk `ev()`/`tick()`/
`tikla()` çağrısı bir kopma hatası atar ve senaryo durur (`kopma.senaryoHatasi`); senaryo bu hatayı yakalayıp sürse de kopmadan
sonra çağrılan `check()` sayılmaz (`kopma.sayilmayanKontrol`).

## Tek dosya sürümü
```bash
node tests/harness/run.cjs tests/scenarios/<ad>.js --url file://$PWD/DenizKorsanlari-SonHazine.html
```

## Dizinler
- `tests/scenarios/` — bu sürümün kabul/regresyon senaryoları
- `tests/scenarios/v03/` — v0.3 geliştirme sırasında kullanılan senaryolar (referans)
- `tests/out/` — raporlar ve görüntüler (git'e girmez)
