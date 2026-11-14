## Ek A — Denetim J bulgularının bu çalışmadaki sınanması

J alanının karşıt doğrulaması (`dogrulama_J.json`) yoktu; iddialar burada kod okuması, Node benzetimi ya da tarayıcı ölçümüyle sınandı.

| Kimlik | Konu | Sonuç | Kanıt (bu çalışma) |
|---|---|---|---|
| J-01 | Karakterlerde `frustumCulled=false` | **Ölçümle doğrulandı** | NPC'lere sırt dönükken 55 A + 100 G çağrı; 7 km uzakta (Kadim Tapınak, Kraken, Volkanik Dev) liman NPC'leri 55 + 55; Tuz Pazarı'nda 15 NPC 187 + 120 (§2.3) |
| J-02 | Çekirdek bitki tek dev `InstancedMesh` | **Ölçümle doğrulandı** | Sınır küresi yarıçapları ana türlerde 606–779 m; limanda 303 K + 170 K üçgen (§2.2) |
| J-03 | Ön derleme yanlış varyant | **Ölçümle doğrulandı** | Son işleme açıkken menüde 86 programın 42'si, limanda 95'in 42'si tuval (sRGB) çıkışlı; Düşük'te (son işleme kapalı) 44 programın hepsi tuval çıkışlı (§6.1) |
| J-04 | Gemi 80 örgü, hepsi gölge atıyor | **Ölçümle doğrulandı** | Oyuncu ve düşman sloop'u 80 örgü / 80 gölge atan; denizde gemi 81 A + 80 G çağrı |
| J-05 | Prosedürel hayvanlar parça başına | **Ölçümle doğrulandı** | 7 domuz 140, 9 papağan 81, 6 maymun 72 çağrı; mağarada 46 hayvan 617 çağrı |
| J-06 | Liman malzemeleri benzersiz | Ölçüm + kod | `port-batched` 44 A + 64 G = 108 çağrı (84 örgü sayısı denetimin Node sayımı) |
| J-07 | Sürekli 7 nokta ışığı | **Ölçümle doğrulandı** | Görünür nokta ışığı 7, meşaleyle 8 |
| J-08 | Meşale yeniden derletiyor | **Ölçümle doğrulandı** | İlk yakışta 17 (bir koşuda 25) yeni program; SwiftShader'da 9 992 ms'lik kare |
| J-09 | Gölge çözünürlüğü açılışta uygulanmıyor | Kod okuması (Faz 1 A-19) | Ön ayar ölçümünde harita boyutu grafik kalitesinden geldi (Düşük'te de 1024) |
| J-10 | LOD ölçeği sıfırlanıyor / görüş açılışta uygulanmıyor | **Ölçümle doğrulandı** | Düşük (görüş 0,3) açılışta `lodScale` 0,7 (olması gereken 0,553), Orta (0,65) 0,85 (olması gereken 0,76); `baseLod` her ikisinde 1 |
| J-11 | Oyun içi gölge kapatma programları yenilemiyor | **Ölçümle doğrulandı** | Volkanik Dev sahnesinde Yüksek → Kapalı: gölge geçişi 125 → 0 çağrı, toplam 509 → 384, ama program 113 → 115 (yalnız +2): sahne malzemeleri yeniden derlenmedi, USE_SHADOWMAP'li programlar kullanılmaya devam ediyor; Kapalı → Yüksek'te program değişmedi |
| J-12 | FPS sınırı yüksek Hz'de düşük | **Node benzetimiyle doğrulandı** | 60 sınırı: 75 Hz 37,5, 100 Hz 50, 144 Hz 48, 165 Hz 55 FPS; önerilen biriktirmeli sınırlayıcı hepsinde 60 (`node/fpslimit.mjs`) |
| J-13 | Sise bağlı olmayan kesme | Hesapla doğrulandı | d99: açık 1 951 m, fırtına 282 m, sisli 212 m; açık denizde 1,6 km'deki adaya bakan yön 980 çağrı |
| J-14 | Son işlemde tuval MSAA | **Ölçümle doğrulandı** | `getContextAttributes().antialias === true`, efekt Yüksek/Orta |
| J-15 | Ölçüm altyapısı dar | Doğrulandı | Bu çalışma 9 sahneyi, kategori dökümünü, ilk kare derlemesini ölçtü; altyapı P0 ile kalıcılaşır |
| J-16 | Volkanik Dev dG=5 (orijinal 09 bu çalışmada 3 koşu: 2 geçti, 1 kaldı dG=1) | **Kök neden bulundu: sızıntı değil, ölçüm kusuru** | `bosses._check()` uzak boss'u ölçümden önce kaldırıyor; 31 alt adımlık denetim evresi tutarsa `demon.glb`'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez yükleniyor; deterministik yeniden üretim dG=5, 09'un müdahalesiz kopyasında da kendiliğinden dG=5 (aynı kimlikler), düzeltilmiş döngü dG=0 (§5.4) |
| J-17 | İlk görüşte derleme | **Ölçümle doğrulandı** | Ada ilk görüşü 1–5 yeni program, ilk kare 72–290 ms (ikinci 10–29 ms); bir koşuda 5 289 ms |
| J-18 | Harita karosu `getImageData` | Ölçülmedi | Faz 8 kapsamında 13_donma'ya eklenmesi önerilir |
| J-19 | Duraklatmada tam çizim | Kod okuması (**ölçülmedi**) | engine.js:52-71 her rAF'ta `post.render()`; ölçüm adımı 2. geçişte çöktü, 4. geçişte çizim kısıldığı (`fpsLimit 0,01`) için anlamsız kaldı |
| J-20 | Parçacık CPU verimsizliği | Kod okuması | effects.js:45-48, :121-146 |
| J-21 | Yüzen nesneler bırakılmıyor | **Ölçümle doğrulandı** | Şişe döngüsü başına +2 geometri, sahnede değil |
| J-22 | `kk.texture` FIFO | Kod okuması | kk.js:244 |
| J-23 | Birleştirilmemiş süsler | **Ölçümle doğrulandı ve genişletildi** | Limanda statik süsler 207 çağrı (kayalık 36, heykel 42, mağara içi 30, kabuk 16…) |
| J-24 | Bulutlar | **Ölçümle doğrulandı** | Fırtınada hava efekti 17 çağrı / 152 K üçgen |
| J-25 | Mağarada gölge haritası | **Ölçümle doğrulandı** | Mağara odasında gölge 161–175 çağrı / 290 K üçgen |
| J-26 | Alt adımda tekrarlanan işler | Kod okuması | Faz 3 C-14 ile aynı; Faz 3 çözüyor |
| J-27 | Kare başı ayırmalar | Kod okuması | — |
| J-28 | `discard` erken derinlik testi | Ölçülemez (gerçek GPU) | — |
| J-29 | Ada kurulumunda 10–12 ms adım | Taban kaydı (13_donma P01 10,5 ms) | Yeniden ölçülmedi |
| J-30 | NPC/balıkçı/hayvan seyreltmesi yok | **Ölçümle doğrulandı** | Limandan 7 km uzakta `npcs.update` 0,35 ms/kare sürüyor |

**Bu çalışmada yeni bulunanlar:** B-1 `enemies.start` lav işaretlerini sahnede bırakıyor (ölçüldü), B-2 kaldırılan boss'un mermileri uçmaya devam ediyor (ölçüldü), B-5 uzak oyuncu etiketi bırakılmıyor (kod), mağarada dış dünya 1 246 çağrı (ölçüldü), uzak ada ayrıntısı 962–1 133 çağrı (ölçüldü), Orta ön ayar bugün çağrıyı azaltmıyor (1 021 / Yüksek 1 026; ölçüldü), denizde en pahalı JS sistemi balık sürüleri (0,43–0,78 ms; ölçüldü), uzun gerçek zamanlı SwiftShader çiziminde sayfa çökmesi (2 kez; test ortamı sınırı).

## Ek B — Bu çalışmanın betikleri ve ham çıktıları

`/tmp/tasarim_y/faz8/`: `tools.js` (sayfa araçları), `f8_taban.js` → `f8_taban.json` (1. geçiş, 9 sahne, 194 sn), `f8_taban2.js` / `f8_taban3.js` / `f8_taban4.js` (arazi beklemeli geçişler; 2 ve 3 çöktü, kayıtlar `.log`), `f8_kalite.js` → `f8_kalite.json` (Düşük/Orta), `f8_derleme.js` → `f8_derleme.json`, `f8_09tani.js` → `f8_09tani_1.json` / `_2.json`, `f8_volkan.js` → `f8_volkan.json`, `f8_coop4.cjs` → `f8_coop4.json`, `10_uzun_oturum.json`, `09_orijinal_*.json`, `node/fpslimit.mjs`. Hepsi kilit sarmalayıcısıyla (`/home/user/devtools/tk`) 8080'deki değişmeyen v0.4'e karşı koştu.
