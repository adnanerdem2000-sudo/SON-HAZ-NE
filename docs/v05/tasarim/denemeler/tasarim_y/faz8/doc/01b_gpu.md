### 1.6 Gerçek GPU ölçüm yolu (bu ortamda yapılamadı)

Bu oturumda gerçek GPU **yoktur**; aşağıdaki yol, kullanıcının ya da CI'daki bir GPU'lu makinenin aynı sayıları ve ek olarak kare/GPU süresini üretmesi içindir (P0.4, P0.5):

1. **Koşucu `--gpu` kipi**: `node tests/harness/run.cjs tests/scenarios/45_perf_matris.js --gpu --size 1920x1080` SwiftShader bayraklarını eklemez (`--use-gl=angle --use-angle=swiftshader` yerine sistem GPU'su; Windows'ta `--use-angle=d3d11`, macOS'ta `metal`), `headless:false` seçeneği; rapora `UNMASKED_RENDERER_WEBGL`, `devicePixelRatio`, ön ayar ve `ortam:'gercek-gpu'` yazılır.
2. **Oyun içi katman** (`?perf=1`): FPS p50/p95/p99 ve 60 kare histogramı, çağrı/üçgen/program, `EXT_disjoint_timer_query_webgl2` ile ana geçiş / gölge geçişi / son işleme GPU süreleri (sorgu sonucu 2–3 kare gecikmeli okunur; `GPU_DISJOINT_EXT` olursa o kare atılır), JS güncelleme ms.
3. **`DK.perf.tour()`**: kayıt yazmayan geçici bir oturumda §1.4'ün 9 sahnesini sırayla kurar; her sahnede 3 sn ısınma + 10 sn ölçüm (kamera 8 yöne döner); sonunda JSON'u panoya kopyalar. Kullanıcı tarayıcı konsolundan tek komutla çalıştırır; çıktı PERFORMANCE_REPORT.md'nin B tablosuna girer.
4. Raporlama kuralı: SwiftShader sayıları B tablosuna **asla** yazılmaz; gerçek GPU satırı yoksa "ÖLÇÜLMEDİ" yazılır (master_prompt: "Gerçek GPU ölçümü elde edilemiyorsa bunu açıkça belirt").
