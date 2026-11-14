## 4. Kalite ayarları ve görüş mesafesi

### 4.1 Bugünkü durum

Ayarlar paneli (settingsPanel.js:33-42): çözünürlük ölçeği, grafik kalitesi (yeniden başlatma), FPS sınırı, görüş mesafesi, gölge, su (yeniden başlatma), efekt, FOV, FPS göster. Varsayılan her şey en yüksek (settings.js:12) + tuval 4× MSAA (engine.js:20) + piksel oranı `min(DPR, 2)` (engine.js:21). Bilinen hatalar: gölge çözünürlüğü açılışta uygulanmıyor (J-09), herhangi bir ayar değişince arazi LOD ön ayarı sıfırlanıyor (J-10) — **ikisi de Faz 1'de A-19 olarak düzeltiliyor** (faz1_brief madde 16: `terrain.init` `baseLod`'u kaliteye göre yazar, `lodScale = baseLod × (0,7 + 0,3·viewDistance)`, apply dünya kurulduktan sonra bir kez daha, `sky.build` gölge boyutunu `settings.v.shadows`'tan alır; test `02_ayar_lod.js`). Oyun içinde gölge kapatma programları yenilemiyor (J-11), FPS sınırı yüksek tazeleme hızlarında hedefin altında (J-12; bu çalışmada Node benzetimiyle doğrulandı: 60 sınırı 75 Hz'de **37,5**, 100 Hz'de 50, 144 Hz'de 48, 165 Hz'de 55 FPS; 30 sınırı 75/100 Hz'de 25).

10. belge §10.9.1'in el ölçümü (1280×720, sayfa yenilenerek): liman Yüksek 1 000 çağrı / 1,22 M üçgen, Orta 1 019 / 1,05 M, Düşük 737 / 0,57 M; program 89 / 89 / 40. Bu çalışmanın ön ayar ölçümü (`f8_kalite.js`, 640×360) §1.5'te.

### 4.2 Ön ayarlar (Faz 8 sonu)

İlke: **Yüksek ön ayarın görüntüsü v0.4 ile aynı ya da daha iyi** (texel hizalı gölge, titreşimsiz geçişler); kazanç yalnız görünmeyen işi kesmekten gelir. Orta ve Düşük, görünür ayrıntıyı bilinçli olarak azaltan ön ayarlardır ve kullanıcı seçer.

| Ayar | Düşük | Orta | Yüksek (varsayılan) | Uygulama |
|---|---|---|---|---|
| Piksel oranı üst sınırı | 1,0 | 1,5 | 2,0 (bugünkü) | Anında |
| Çözünürlük ölçeği | 0,8 | 1,0 | 1,0 | Anında |
| Dinamik çözünürlük (kare süresine göre 0,7–1,0) | Açık | Kapalı | Kapalı | Anında; isteğe bağlı |
| Son işleme | Kapalı (tuval MSAA) | Bloom + FXAA (tuval MSAA kapalı) | Bloom + 4× MSAA hedef (gerçek GPU) / FXAA (yazılımsal) | Anında (ısıtma karesiyle) |
| Gölge | Kapalı | 1024, ±40 m kutu | 2048, ±55 m kutu (bugünkü) | Anında; Açık↔Kapalı program yenilemesi (J-11) |
| Gölge atanlar | — | Yarıçap < 0,35 m atmaz | Yarıçap < 0,25 m atmaz | Kurulumda |
| Su ızgarası / parça gölgelendiricisi | 160² / sade (köpük ve kırılma yok) | 220² / tam | 300² / tam | Yeniden başlatma |
| Bitki yoğunluğu (props.js:166, islands.js:443) | 0,45 | 0,75 | 1,0 | Yeniden başlatma |
| Küçük bitki/süs mesafesi | 140 m | 200 m | 240 m | Anında (hücre LOD) |
| Ada hücre görünürlüğü | 600 m | 750 m | 850 m | Anında |
| Ekran boyutu ayıklaması çarpanı (§3.6) | 0,5 | 0,7 | 1,0 | Anında |
| Karakter/hayvan görünürlük mesafesi | 90 / 70 m | 140 / 110 m | 220 / 160 m | Anında |
| Animasyon katmanları (tam / 15 Hz / 4 Hz sınırları) | 20 / 60 m | 30 / 90 m | 40 / 120 m | Anında |
| Görüş mesafesi (arazi `lodScale` tabanı, Faz 1 A-19) | 0,7 × (0,7 + 0,3·vd) | 0,85 × (…) | 1,0 × (…) | Faz 1 kuralı |
| Sise bağlı kesme (d99) | Açık | Açık | Açık | Anında |
| Parçacık bütçesi | 450 | 700 | 900 | Anında |
| Bulut pufu ayrıntısı | 1 (80 üçgen) | 1 | 2 (bugünkü) | Yeniden başlatma |
| Nokta ışığı havuzu | 2 | 4 | 4 | Yeniden başlatma (program sayısı sabit kalsın) |
| FPS sınırı | 30 (öneri) | 60 | Sınırsız | Anında (biriktirmeli sınırlayıcı, J-12) |

"Benzetim" katmanları (hayvan/düşman AI sıklığı, ada kurulum bütçesi, ağ) **ön ayara bağlı değildir**: co-op'ta ev sahibinin ön ayarı oyun sonucunu değiştirmemeli.

### 4.3 Uygulama ayrıntıları

- **Ayar şeması.** `settings.v` yeni anahtarlar alır: `preset` (`'dusuk'|'orta'|'yuksek'|'ozel'`), `dynRes` (bool), `dprCap`. Yükleme `{...DEFAULT_SETTINGS, ...s}` ile birleştirdiği için (settings.js:31) eski ayar dosyaları bozulmaz (Faz 4 kayıt şemasına dokunulmaz; ayarlar `dksh.settings` anahtarında, kayıt yuvalarında değil). Tek bir ayar elle değişince `preset='ozel'`.
- **Kaynak tek yerde.** `js/core/quality.js` ön ayar tablosunu tutar; `settings.apply()` yalnız bu tablodan türetilen değerleri modüllere iletir (`lod.configure`, `lights.configure`, `effects.budget`, `sky.setShadow`, `terrain.lodScale`). Faz 1'in `baseLod` kuralı aynen kullanılır.
- **İlk açılışta öneri (otomatik değil).** `WEBGL_debug_renderer_info` dizgesi (post.js:48-58 zaten okuyor) ve 2 sn'lik görünmez bir kıyas (menü sahnesinde 60 kare, `EXT_disjoint_timer_query_webgl2` varsa GPU süresi) ile "Bu cihaz için Orta öneriliyor" bildirimi; kullanıcı onaylamazsa Yüksek kalır.
- **Dinamik çözünürlük.** Son 60 karenin p90 kare süresi hedefin (1/FPS sınırı ya da 16,7 ms) %90'ını 2 sn boyunca aşarsa ölçek 0,05 düşer (en az 0,7); %60'ın altında 4 sn kalırsa 0,05 artar. Yalnız composer hedefi yeniden boyutlanır (tuval değil), takılma olmaz.
- **FPS sınırlayıcı (J-12).** `engine.start` döngüsünde biriktirmeli zamanlama: `if (now < this._next − tol) return; this._next = max(this._next + minDt, now − minDt)`; `tol` = ölçülen rAF aralığının yarısı (üstel ortalama). Node benzetimi (`node/fpslimit.mjs`): 60 sınırı 60/75/100/120/144/165 Hz'de **60,0** FPS; 30 sınırı 29,9–30,0 FPS.

### 4.4 Görüş mesafesi ile LOD ölçeğinin sırası (A-19 uyumu)

Faz 1 düzeltmesinden sonra açılış sırası: `settings.load` → `engine.init` (tuval MSAA kararı burada; §6.2 madde 6) → `terrain.init(quality)` (`baseLod`) → dünya kurulumu → `settings.apply()` (gölge boyutu, `lodScale`, görüş). Faz 8 bu sıraya **`quality.js`'in hesapladığı değerleri** bağlar, yeni bir sıra getirmez. Sise bağlı kesme (`d99`) `lodScale`'i değiştirmez; yalnız halka yarıçaplarını kare bazında `min(..., 1,15·d99)` ile kırpar (Faz 1'in histerezisi A-07 korunur).
