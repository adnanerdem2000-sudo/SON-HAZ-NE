# AUDIT_CURRENT §5 — Hatalar: K — Yayın, tek HTML, test altyapısı ve belgeler

Bu dosya `AUDIT_CURRENT.md`'nin (Faz 0 denetimi, v0.4 `44d548c`) bir bölümüdür; boyut nedeniyle ayrıldı. Ana rapor: [../AUDIT_CURRENT.md](../AUDIT_CURRENT.md).

## 5. Hatalar — K — Yayın, tek HTML, test altyapısı ve belgeler

### K-01 — v0.4 dalındaki kök tek HTML bayt bayt v0.3 derlemesi; güncel derleme yalnız git dışındaki dist/'te (orta)

- **Dosya ve fonksiyon:** DenizKorsanlari-SonHazine.html (kök); tools/build-single-html.mjs:15; .gitignore:2; README.md:15-18; tests/README.md:33-36 — build-single-html.mjs main() → OUT (varsayılan dist/); tek dosya yayın süreci
- **Kök neden:** Derleme çıktısı varsayılan olarak .gitignore'daki dist/ klasörüne yazılıyor (build-single-html.mjs:15, .gitignore:2). Kök dosya yalnız 762f1c7'de elle işlendi ve v0.4 boyunca yeniden üretilmedi. Kanıt: git rev-parse HEAD:DenizKorsanlari-SonHazine.html = 762f1c7:… = 3a912c30. v0.3 kaynağı v0.3 aracıyla yeniden derlendiğinde sha256 f0ac8cb0… çıkıyor, yani kök dosyanın aynısı. v0.4 kaynağı (44d548c ile aynı kod) esbuild 0.24.2 ile derlendiğinde sha256 75587dd9… çıkıyor; bu da yalnız yerel dist/ klasörlerindeki dosyaya eşit. Derlemeye commit ya da sürüm damgası gömülmüyor.
- **Oyuncuya etkisi:** README.md:15-17 oyuncuyu kök dosyaya yönlendiriyor; indirilen çevrimdışı sürüm v0.3 olduğu için v0.4 düzeltmelerinin hiçbirini (arazi işçisi yedeği ve kurtarma, file:// data: işçisi, kamera, iskele ve ganimet düzeltmeleri) içermiyor. Pages dal tabanlı yayınla sunuluyorsa (K-05) bu bayat dosya sitede de yayınlanır; v0.4 canlıya birleştirildiğinde web sürümü v0.4, tek dosya v0.3 olur. dist/ yalnız oturumun çalışma ağacında duruyor ve dosyanın hangi commit'ten üretildiği içinden anlaşılamıyor. [Doğrulamayla düzeltildi] Bugün oyuncuya etkisi yok: canlı dal da kök dosya da v0.3 ve ikisi tutarlı. Risk, v0.4 birleştirilirken kök dosya yeniden üretilmezse doğuyor (§16.7'de yazılı adım). 'file:// data: işçisi' eksikliği işlevsel açık sayılmamalı: v0.3 tek dosyası işçiyi klasik işçi olarak kuruyor (762f1c7:tools/build-single-html.mjs:16,27); blob reddi 903abe2'de tek dosyada modül işçisine geçilince görüldü (v0.4 terrain.js:69). 01_ILK_DENETIM_RAPORU.md:43 v0.3 dist'inin file:// altında 3 işçiyle açıldığını kaydediyor. Bu doğrulamada tarayıcı koşulmadı.
- **Öncelik:** orta (denetçi: yüksek; karşı doğrulamayla düzeltildi) · hedef faz: Faz 9
- **Önerilen çözüm:** Kök dosyayı depodan kaldırıp yalnız CI'da üretin ve yayın artifact'ine koyun; ya da yayın dalında her sürümde CI tarafından yeniden üretilip işlensin. Derlemeye &lt;meta name='dk-build' content='&lt;commit>'> ve sürüm bilgisi gömün. README ve tests/README'yi CI çıktısına ya da Pages adresine yönlendirin. CI'a, servis edilen tek HTML'in sha256'sının aynı commit'in kaynak derlemesine eşit olduğunu denetleyen bir adım ekleyin.
- **Tekrar üretme:** git -C /home/user/SON-HAZ-NE-w2 rev-parse HEAD:DenizKorsanlari-SonHazine.html 762f1c7:DenizKorsanlari-SonHazine.html → ikisi de 3a912c30. SON-HAZ-NE-w2'de NODE_PATH=&lt;esbuild@0.24.2 node_modules> node tools/build-single-html.mjs /tmp/denetim_alan/K/w2_build.html → sha256 75587dd9… (dist ile aynı, kök dosyadan farklı). Aynı komut SON-HAZ-NE-v03'te → f0ac8cb0… (kök dosyayla aynı).
- **Kabul testi:** Yayın dalında servis edilen ve README'nin gösterdiği tek HTML'in damgası HEAD commit'ine eşit, sha256'sı da o commit'in kaynak derlemesiyle aynı. 02_tek_dosya bu dosyaya karşı 4/4 geçiyor. Depoda v0.3 derlemesi kalmıyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** denetim/11 #42; denetim/16 §16.7 (dist kökteki dosyanın yerine konmalı); Faz 0 A-01 ile örtüşür
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Olgular bağımsız olarak yeniden üretildi. git rev-parse HEAD, 44d548c ve 762f1c7 üzerinde DenizKorsanlari-SonHazine.html için üçü de 3a912c30 veriyor; kök dosyanın sha256'sı f0ac8cb0… (21 981 073 bayt). esbuild 0.24.2 (/tmp/buildtools) ile v0.3 kaynağından derleme (/tmp/denetim_alan/karsit_K/v03.html) f0ac8cb0… çıktı, kökle aynı. v0.4 kaynağından derleme (/tmp/denetim_alan/karsit_K/w2.html) 75587dd9… çıktı (22 071 696 bayt); bu hem SON-HAZ-NE-w2/dist hem SON-HAZ-NE/dist ile aynı. 44d548c..HEAD arasında yalnız docs/ değişiyor. build-single-html.mjs:15 varsayılan çıktıyı dist/'e yazıyor, .gitignore:2 dist/'i dışlıyor, README.md:15-18 kök dosyayı gösteriyor. Derleme (satır 107-126) içine commit ya da sürüm yazmıyor. 16_SON_RAPOR.md:98-100 (§16.7) bu adımı kullanıcı onayı bekleyen yayın adımı olarak kaydediyor; madde bilinen ve açık. Faz 0 A-01 aynı maddeye 'orta' vermiş. Düzeltme/ek: Öncelik 'orta' olmalı. Bugün oyuncuya etkisi yok: canlı dal da kök dosya da v0.3 ve ikisi tutarlı. Risk yalnız v0.4 birleştirilirken kök dosya yeniden üretilmezse doğuyor ve bu adım §16.7'de yazılı. Etkideki 'file:// data: işçisi' eksikliği işlevsel bir açık sayılmamalı. v0.3 tek dosyası işçiyi klasik işçi olarak kuruyor (762f1c7:tools/build-single-html.mjs:16,27 → 'new Worker(window.__DK_WORKER_URL)'; derlenmiş dosyada da aynı). Blob reddi 903abe2'de tek dosyada modül işçisine geçilince görüldü (v0.4 terrain.js:69, {type:'module'}). 01_ILK_DENETIM_RAPORU.md:43 v0.3 dist'inin file:// altında 3 işçiyle açıldığını kaydediyor; A-01 de aynı sonuca varıyor. Bu doğrulamada tarayıcı koşulmadı. (uygulanan alanlar: oyuncuya etkisi, öncelik) Denetçi güveni: kesin. Bilinen sorun: KI-141.

### K-02 — Canlı (varsayılan) dalın pages.yml'si 'claude/**' dallarına yapılan push'larda hâlâ üretim yayın iş akışını tetikliyor (yüksek)

- **Dosya ve fonksiyon:** .github/workflows/pages.yml:8 ve 33-52 (claude/hopeful-cray-o1jw6w @ 762f1c7, deponun varsayılan dalı) — on.push.branches; jobs.deploy (dal koşulu yok)
- **Kök neden:** v0.3'teki kural branches: [main, master, 'claude/**']. deploy işinde github.ref koşulu yok; iş yalnız Pages'in açık olup olmadığına bakıyor. Düzeltme (d6e716f) yalnız v0.4 dalında yapıldı, canlı dala birleştirilmedi. Push olaylarında itilen commit'teki iş akışı dosyası kullanıldığından, varsayılan daldan açılan her yeni claude/* dalı eski kuralı devralıyor.
- **Oyuncuya etkisi:** Varsayılan daldan açılıp itilen her claude/* dalı (Claude oturumlarının olağan dal adı) incelenmemiş kodu deploy-pages ile canlıya gönderebilir. 31 Ekim koşuları, deploy-pages'in dal tabanlı yayın açıkken de başarılı olduğunu gösteriyor. Bu içerik canlı dala bir sonraki push'a kadar sitede kalır. Tek olası engel github-pages ortamının dal politikası; bu depo ayarı /environments API'si 403 döndüğü için okunamadı. Şimdiye kadar yaşanmadı: 16 koşunun hepsi canlı dalda.
- **Öncelik:** yüksek · hedef faz: Faz 9
- **Önerilen çözüm:** Kullanıcı onayıyla canlı dala yalnız pages.yml düzeltmesini uygulayın: push dal listesinde yalnız yayın dalı kalsın ve deploy işine if: github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w' koşulu eklensin. Settings → Environments → github-pages → Deployment branches ayarında yalnız yayın dalına izin verin. Yayın dalını korumaya alın.
- **Tekrar üretme:** git show 762f1c7:.github/workflows/pages.yml | sed -n 6,9p → 'claude/**' görünür. Deneme yalnız onaylı bir test deposunda yapılmalı: varsayılan daldan claude/deneme dalı açıp boş bir commit itin; Actions'ta 'GitHub Pages' koşusu başlar, check işinin ardından deploy işi çalışır.
- **Kabul testi:** Canlı dalın pages.yml'sinde yalnız yayın dalı ve deploy işinde ref koşulu var. Yeni bir claude/* dalına push yapıldığında deploy işi çalışmıyor (koşu oluşmuyor ya da iş 'skipped'). github-pages ortam kuralı yalnız yayın dalına izin veriyor.
- **Sürüm:** yalnız v0.3 (canlı dal); v0.4 dalında giderilmiş
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: 762f1c7:.github/workflows/pages.yml:8 'branches: [main, master, 'claude/**']'. Satır 33-35'te deploy işi yalnız needs.check.outputs.enabled koşuluna bakıyor; ref denetimi yok. Depo API'sinde default_branch claude/hopeful-cray-o1jw6w (762f1c7); d6e716f yalnız claude/denetim-v0.4 soyunda. 16 koşunun hepsi canlı dalda. deployments API'sinde 7461542552 (762f1c7, performed_via github-actions) 16:55:24'te success; yani deploy-pages dal tabanlı yayın açıkken de canlıya yazabiliyor. Ek gözlem: github-pages ortamı ilk kez run 41155258637'nin (cc7e165, 01:25:11) deploy işiyle oluşmuş görünüyor (deployment 7452376874, failure). İş akışı başvurusuyla kendiliğinden oluşan ortamlarda dal kuralı olmaz; bu, push'un engellenmeden yayına gitme olasılığını artırıyor. /environments vekil sunucuda 403 verdiği için ortam kuralı doğrulanamadı. Öncelik ve 'yuksek' güven yerinde. Denetçi güveni: yüksek. Bilinen sorun: KI-031.

### K-03 — workflow_dispatch dal kısıtı olmadan çalışıyor ve deploy işinde ref koruması yok: herhangi bir daldan elle üretime yayın yapılabiliyor (orta)

- **Dosya ve fonksiyon:** .github/workflows/pages.yml:9, 16-18, 33-52 (v0.3 ve v0.4) — on.workflow_dispatch; jobs.deploy; concurrency
- **Kök neden:** workflow_dispatch dal filtresi almıyor. deploy işi yalnız needs.check.outputs.enabled == 'true' koşuluna bakıyor. concurrency grubu 'pages' ve cancel-in-progress: true.
- **Oyuncuya etkisi:** Yazma yetkisi olan biri ya da Actions tetikleme aracına sahip bir ajan oturumu 'Run workflow' ile claude/v0.5-saglamlastirma gibi bir geliştirme dalını üretime yayınlayabilir; süren bir canlı yayını da iptal edebilir. v0.4'teki push kısıtı bu yolu kapatmıyor.
- **Öncelik:** orta · hedef faz: Faz 1 (+Faz 9)
- **Önerilen çözüm:** deploy işine if: github.ref == 'refs/heads/&lt;yayın dalı>' koşulunu ekleyin (isteğe bağlı olarak event_name de denetlenebilir). github-pages ortamına dal politikası ve zorunlu onaylayıcı tanımlayın. concurrency grubunu ref'e göre ayırın ya da cancel-in-progress: false yapın.
- **Tekrar üretme:** Actions → GitHub Pages → Run workflow → Branch: claude/v0.5-saglamlastirma seçildiğinde check ve deploy işleri çalışır; ortam kuralı yoksa yayın gerçekleşir. Statik kanıt: pages.yml:9 ve 33-36.
- **Kabul testi:** Yayın dalı dışında dispatch edilen bir koşuda deploy işi 'skipped' oluyor; ortam ayarında yalnız yayın dalı listeleniyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). K/UC1 karşı doğrulaması pages.yml'de workflow_dispatch'in dal kısıtı taşımadığını ve deploy işinin ref denetlemediğini doğruladı (satır 9, 33-35). Denetçi güveni: yüksek. Bilinen sorun: KI-142.

### K-04 — Üretim yayınından önce test ve PR kapısı yok; canlı dal korumasız (yüksek)

- **Dosya ve fonksiyon:** .github/workflows/pages.yml:41-52 (depodaki tek iş akışı); depo dal ayarları — jobs.deploy (checkout → derle → yükle → yayınla)
- **Kök neden:** Depoda CI iş akışı yok; .github/workflows altında yalnız pages.yml var. pull_request tetikleyicisi yok ve deploy işi derlemenin hemen ardından yayınlıyor. GitHub API list_branches: claude/hopeful-cray-o1jw6w protected=false.
- **Oyuncuya etkisi:** Canlı dala yapılan her push (ör. v0.4 ya da v0.5 birleştirmesi) hiçbir test koşmadan oyunculara ulaşır. Tabanda kalan 09_performans sızıntı kontrolü, 06c'deki 4 oyunculu katılma hatası ya da bozuk bir derleme fark edilmeden yayına gider.
- **Öncelik:** yüksek · hedef faz: Faz 9
- **Önerilen çözüm:** Bir ci.yml ekleyin: push (claude/**) ve pull_request olaylarında node tests/node/*.mjs, tek HTML derlemesi ve statik denetim (gömülü dosya sayısı, import.meta kalmaması, işçi ifadesinin değişmiş olması), ardından Playwright duman seti (00_acilis, 02_arazi_yedek dört kipte, 02_tek_dosya test derlemesiyle, 08_kalicilik, 12_kayit_dongusu) koşsun. Yayın dalına branch protection koyun: PR zorunlu, ci gerekli durum kontrolü, doğrudan push kapalı. pages.yml'deki deploy'u CI başarısına bağlayın.
- **Tekrar üretme:** mcp__github__list_branches → claude/hopeful-cray-o1jw6w protected:false; ls .github/workflows → yalnız pages.yml; pages.yml'de test adımı yok.
- **Kabul testi:** Yayın dalına doğrudan push reddediliyor; PR'da CI zorunlu ve yeşil olmadan birleştirme yapılamıyor; CI kırmızıyken deploy işi çalışmıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: doğrulandı. Kanıt: .github/workflows altında v0.3'te de v0.4'te de yalnız pages.yml var. Actions iş akışı listesinde yalnız 'GitHub Pages' ve dinamik 'pages-build-deployment' görünüyor. pages.yml:6-9 yalnız push ve workflow_dispatch tetikleyicisi içeriyor; pull_request yok. Deploy işi (41-52) checkout → configure-pages → tek HTML derlemesi → upload → deploy sırasıyla çalışıyor; test adımı yok. API: list_branches üç dalın da protected:false olduğunu gösteriyor. GET /branches/claude%2Fhopeful-cray-o1jw6w/protection → 404 'Branch not protected'; /rulesets ve /rules/branches/… → []. Ek etki: 00_BASLANGIC_KAYDI.md:24-26 v0.3 ve v0.4'ün tek kalıcı yedeği olarak bu korumasız dalları sayıyor. Etiketler 403 ile gönderilemedi, paket ise oturum klasöründe. Zorla gönderme ya da dal silme canlıyı ve yedeği birlikte yok eder. Denetçi güveni: kesin. Bilinen sorun: KI-032.

### K-05 — Aynı commit için iki yayıncı var: dal tabanlı Jekyll yayını iş akışı yayınını eziyor (yüksek)

- **Dosya ve fonksiyon:** Depo Pages ayarı; .github/workflows/pages.yml (tümü); README.md:13-14 — 'pages build and deployment' (dinamik) ve 'GitHub Pages' iş akışının deploy işi
- **Kök neden:** 31 Ekim'de ba85510 ve 762f1c7 için hem iş akışı yayın yaptı (deployments 7461472615, 7461542552) hem de dal derlemesi (jekyll-build-pages v1.0.13; run 41221473027 ve 41221950864, deployments 7461476840 ve 7461546853). Dal derlemesi her iki seferde de sonra bitti; 762f1c7 için iş akışı 16:55:24'te, dal derlemesi 16:55:36'da 'success' oldu. Bu durum Pages kaynağının 'Deploy from a branch' olduğunu gösteriyor; 762f1c7'nin commit mesajı da 'hangi kaynaktan yapılırsa yapılsın' diyerek bunu varsayıyor. README ise 'Source: GitHub Actions' diyor.
- **Oyuncuya etkisi:** Aynı commit için iki yayıncı var (dal tabanlı Jekyll yayını ve iş akışı yayını); hangisinin kazanacağı bitiş sırasına bağlı, yani sonuç belirlenimsiz. İş akışındaki dal filtresi, derleme adımı ve eklenecek test kapıları dal yayınını durdurmuyor. [Doğrulamayla düzeltildi] Bugün oyuncuya yansıyan bir fark yok: 762f1c7 için iş akışının yeniden ürettiği tek HTML commit'li dosyayla bayt bayt aynı (f0ac8cb0…) ve canlı commit'te tests/ klasörü yok. 'docs/ ve tests/ dahil' tespiti dal yayınına özgü değil: upload-pages-artifact@v3 'path: .' ile yalnız .git ve .github'ı dışarıda bırakıyor (K-06). 'Ham' ifadesi de tam doğru değil: Pages'in Jekyll'i Markdown'u HTML'e çeviriyor, ön bilgisi olmayan oyun dosyalarını olduğu gibi kopyalıyor; depoda '_' ile başlayan dosya ve .md'lerde Liquid etiketi yok, derleme güvenli. Etki ileriye dönük: v0.4 birleştirilince bayat kök dosya sunulabilir (K-01) ve eklenecek CI kapıları dal yayınıyla atlanır. Öncelik yayın güvenliği açısından yüksek.
- **Öncelik:** yüksek · hedef faz: Faz 9
- **Önerilen çözüm:** Settings → Pages → Source ayarını 'GitHub Actions' yaparak tek yayıncıya inin. .nojekyll ekleyin. CI ve duman testinde Pages build_type değerini ve sitedeki derleme damgasını denetleyin. Kökteki tek HTML'i kaldırın (K-01).
- **Tekrar üretme:** Actions API list_workflow_runs → 'pages build and deployment' run 41221473027 ve 41221950864 (event dynamic). list_workflow_jobs 41221950864 → build (jekyll-build-pages) ve 16:55:27-16:55:34 arasında deploy; aynı sha için iş akışı deploy'u 16:55:14-16:55:21. gh api …/deployments → 762f1c7 için iki kayıt, statüleri 16:55:24 ve 16:55:36'da success.
- **Kabul testi:** Yayın dalına push sonrasında yalnız 'GitHub Pages' iş akışı koşuyor, 'pages build and deployment' koşmuyor. deployments listesinde commit başına tek kayıt var. Sitedeki derleme damgası iş akışının commit'ine eşit.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (doğrudan karşı doğrulama). Karşı doğrulama hükmü: kısmen. Kanıt: Çekirdek iddia deployments API'siyle doğrulandı. ba85510 için 7461472615 (github-actions, success 16:49:25) ve 7461476840 (github-pages, success 16:49:33) var. 762f1c7 için 7461542552 (github-actions, 16:55:24) ve 7461546853 (github-pages, 16:55:36) var. İş adımları: iş akışındaki deploy-pages 16:55:14-21, dinamik 'Deploy to GitHub Pages' 16:55:27-34. Dinamik iş akışı (id 402892582) 16:48:47Z'de oluşmuş. 16:25'teki workflow_dispatch yayınında (run 41219635984, deployment 7461213685) dinamik koşu yok; kaynak büyük olasılıkla 16:26-16:48 arasında dal tabanlıya çevrildi. 762f1c7'nin commit mesajında 'hangi kaynaktan (dal ya da iş akışı)' ifadesi var. /pages API'si ve github.io vekil sunucuda engelli olduğu için kaynak ayarı doğrudan okunamadı; 'yuksek' güven uygun. Düzeltme/ek: Etkideki 'docs/ ve tests/ dahil' tespiti dal yayınına özgü değil. upload-pages-artifact@v3 'path: .' ile yalnız .git ve .github'ı dışarıda bırakıyor; denetçinin kendi K-06'sı da bunu söylüyor. Üstelik canlı commit 762f1c7'de tests/ klasörü yok. 762f1c7 için iki yayının oyun içeriği aynı: iş akışının yeniden ürettiği tek HTML commit'li dosyayla bayt bayt aynı (f0ac8cb0…). Yani bugün oyuncuya yansıyan bir fark yok. Etki ileriye dönük: v0.4 birleştirilince bayat kök dosya sunulabilir ve eklenecek CI kapıları dal yayınıyla atlanır. 'Ham' ifadesi de tam doğru değil. Pages'in Jekyll'i Markdown'u HTML'e çeviriyor, ön bilgisi (front matter) olmayan oyun dosyalarını olduğu gibi kopyalıyor. Depoda '_' ile başlayan dosya ve .md'lerde Liquid etiketi yok, derleme güvenli. Öncelik yayın güvenliği açısından 'yuksek' savunulabilir. (uygulanan alanlar: oyuncuya etkisi) Denetçi güveni: yüksek. Bilinen sorun: KI-033.

### K-06 — Pages artifact'i tüm depoyu yüklüyor (path: .) (düşük)

- **Dosya ve fonksiyon:** .github/workflows/pages.yml:48-50 — actions/upload-pages-artifact@v3 (path: .)
- **Kök neden:** Yayın klasörü ayrı hazırlanmıyor; yalnız .git ve .github dışarıda kalıyor.
- **Oyuncuya etkisi:** docs/ (83 dosya, 2,7 MB: iç denetim raporları ve ağ güvenliği tasarımı), tests/ (140 dosya, 0,48 MB), tools/ ve TEST_RAPORU.md sitede yayımlanıyor. Bu, gereksiz boyut ekliyor ve test kancalarının kullanım kılavuzunu (tests/README.md) da yayına koyuyor. Depo herkese açık olduğundan gizlilik etkisi sınırlı.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** Bir _site/ klasörü hazırlayın: index.html, css/, js/, vendor/, assets/ (lisans .txt dosyaları dahil), CREDITS.md, CI'da üretilen tek HTML ve .nojekyll. Yalnız _site'ı yükleyin.
- **Tekrar üretme:** git ls-files | awk -F/ '{print $1}' | sort | uniq -c → docs 83, tests 140; artifact yolu '.' olduğu için hepsi yükleniyor.
- **Kabul testi:** Artifact içerik listesinde docs/, tests/ ve tools/ yok; duman testinde oyun ve tek HTML açılıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). K-05 karşı doğrulaması upload-pages-artifact@v3'ün 'path: .' ile yalnız .git ve .github'ı dışarıda bıraktığını doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-223.

### K-07 — window.DK ve test yardımcıları (DK.sim/tap/press/snap/snapFrom, G.godMode erişimi) üretimde koşulsuz açık (orta)

- **Dosya ve fonksiyon:** js/main.js:134-153 (v0.3: 133-152); tek HTML derlemeleri (kök ve dist) — boot()
- **Kök neden:** Test kancaları boot()'un sonunda koşulsuz atanıyor; geliştirme ve test kipi ayrımı yok. DK nesnesi G, save, net, progress, quests ve treasure dahil tüm sistemleri, terrain.killWorkers'ı (terrain.js:189), G.godMode'u (player.js:143) ve islands/hazards/megafauna test yardımcılarını dışarı açıyor. Oyun kodunun kendisi window.DK'yi kullanmıyor (grep yalnız main.js'i buluyor), dolayısıyla kısıtlama oyunu bozmaz.
- **Oyuncuya etkisi:** Herkes konsoldan tek satırla altın, envanter, hikâye ya da kayıt değiştirebilir (DK.G.player.inv.gold=1e9) ve DK.sim ile zamanı ileri sarabilir. Co-op'ta konuk DK.net.toHost ile sahte ileti üretebilir (06a testi tam olarak bunu yapıyor); bu, B-08 türü açıkları sömürmeyi kolaylaştırır. İstemci tarafında gizleme bir güvenlik sınırı değildir, ama bu kolay erişimi ortadan kaldırır.
- **Öncelik:** orta · hedef faz: Faz 1 (+Faz 9)
- **Önerilen çözüm:** main.js'te bir bayrak tanımlayın: const DK_TEST = window.__DK_TEST === true || new URLSearchParams(location.search).has('dktest'). window.DK ve yardımcılar yalnız DK_TEST doğruyken atansın; window.__ready kalabilir. run.cjs ve coop.cjs'te page.addInitScript(() => { window.__DK_TEST = true; }) çağrılsın (ya da URL'ye ?dktest=1 eklensin). Tek HTML'de esbuild define ile kancalar üretim derlemesinden çıkarılsın; 02_tek_dosya için ayrı bir test derlemesi (--test bayrağı) üretilsin.
- **Tekrar üretme:** Canlı ya da yerel sayfada konsola şunları yazın: typeof DK → 'object'; DK.G.player.inv.gold = 1e9; DK.sim(600). Statik kanıt: grep -n 'window.DK' js/main.js; /tmp/denetim_alan/K/analiz_tek.mjs → kök ve dist derlemelerinde windowDK=1, dkSim=true.
- **Kabul testi:** Bayraksız açılan üretim sayfasında ve üretim tek HTML'inde typeof window.DK === 'undefined' ve 'DK.sim' dizgesi yok. Bayrakla açılan sayfada 21 tek sayfa ve 5 co-op senaryosu taban sonuçlarıyla (23/25) aynı geçiyor. 02_tek_dosya test derlemesiyle 4/4.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). K/UC2 karşı doğrulaması v0.3 main.js:133-152 ve v0.4 main.js:134-153'te window.DK, snap, snapFrom, sim, tap, press ve __ready'nin koşulsuz atandığını doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-143.

### K-08 — Üretimde URL test parametreleri açık: ?peerhost ile sinyal sunucusu yönlendirilebiliyor, ?terrain ile oyun bozuk kipte açılabiliyor (orta)

- **Dosya ve fonksiyon:** js/net/net.js:49-55 (peerOpts); js/world/terrain.js:248-249; js/world/terrainWorker.js:8 — peerOpts(), terrain.init()
- **Kök neden:** Yerel test için eklenen parametreler köken ya da kip denetlenmeden okunuyor: q.get('peerhost') değeri doğrudan o.host/port/path/secure'a yazılıyor; terrain.mode = window.__DK_TERRAIN_MODE || ?terrain.
- **Oyuncuya etkisi:** Saldırgan kurbana '…/?join=KOD&peerhost=saldirgan.example&peerport=443&peersecure=1' bağlantısını gönderebilir. Kurban 'Katıl'a bastığında PeerJS sinyali saldırgana gider ve kurban gerçek oda yerine saldırgana bağlanır: oturum ele geçirilir, saldırgan gerçek odaya aktarma yaparak araya girebilir (ortadaki adam) ve kurbanın IP adresi açığa çıkar. Konuk ev sahibi iletilerini doğrulamadığından (Faz 0 B-18) kayıt bozma ve açılır metin üzerinden betik çalıştırma yolu da açılır. '?terrain=crash|noworker' içeren bir bağlantı ise oyunu ana iş parçacığı yedeğinde, takılmalı açtırır.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** Bu parametreleri yalnız test bayrağı açıkken (K-07) ya da yalnız localhost/127.0.0.1 kökeninde kabul edin. peerhost için izinli konak listesi kullanın. ?terrain kiplerini ve 'test-crash' dalını üretim derlemesinden çıkarın. coop.cjs test bayrağını açsın.
- **Tekrar üretme:** Statik kanıt: net.js:53 'if (q.get('peerhost')) { o.host = q.get('peerhost'); …'. Yerel deneme: bir sekmeyi '?peerhost=127.0.0.1&peerport=9000' ile (tests/peer-server.cjs) açın, diğerini parametresiz açın; aynı oda koduna katılamazlar, çünkü farklı sinyal sunucularına bağlanırlar. Bu, parametrenin üretim kodunda etkili olduğunu gösterir.
- **Kabul testi:** Test bayrağı yokken '?peerhost=…&join=…' varsayılan PeerJS sunucusunu kullanıyor ve '?terrain=crash' yok sayılıyor (test sayfasında DK.terrain.mode === '' ile denetlenebilir). Co-op senaryoları bayrakla açıldığında taban sonuçlarını veriyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). K/UC2 karşı doğrulaması üretim derlemesinde 'peerhost' parametresinin bulunduğunu (v0.3 net.js:39-40, v0.4 net.js:53) ve __DK_TERRAIN_MODE'un v0.4'te olduğunu doğruladı. Denetçi güveni: yüksek. Bilinen sorun: KI-144.

### K-09 — Tek HTML, adı 'assets' ile biten bir klasörde açılırsa hiç açılmıyor (fetch anahtarı URL'deki ilk 'assets/' geçişini alıyor) (orta)

- **Dosya ve fonksiyon:** tools/build-single-html.mjs:79-85 (prelude key()); js/core/kk.js:70-71 — prelude key(u) ve window.fetch yaması; kk.load içindeki get()
- **Kök neden:** key() fonksiyonu s.indexOf('assets/') ile URL'deki İLK geçişi alıyor. three'nin FileLoader'ı isteği new Request(url) ile mutlak URL'ye çeviriyor (vendor/three/three.core.js:45612). Dosya '…/assets/' ya da '…/oyun-assets/' gibi bir klasördeyse anahtar 'assets/assets/models/…' olur ve gömülü dosya bulunamaz; ardından yapılan gerçek fetch file:// için başarısız olur. kk.js:71 kritik karakter dosyası yüklenemeyince hata fırlatır ve boot() düşer.
- **Oyuncuya etkisi:** Dosyayı 'assets', 'game-assets' ya da 'oyun_assets' gibi bir klasöre kaydeden oyuncu 'Oyun başlatılamadı: Karakter dosyası yüklenemedi' iletisini görür. v0.3'te yer tutucu model de olmadığından oyun yine açılmaz. Ses dosyaları göreli URL kullandığı için etkilenmez.
- **Öncelik:** orta · hedef faz: Faz 9
- **Önerilen çözüm:** URL'yi new URL(u, document.baseURI) ile çözüp sayfanın dizinine göre göreli yolu kullanın: href.startsWith(baseDir) ise href.slice(baseDir.length). Alternatif olarak lastIndexOf('assets/') kullanıp F anahtarlarında sondan eşleşme arayın. 02_tek_dosya'yı 'assets' adlı bir klasörden de koşun.
- **Tekrar üretme:** node /tmp/denetim_alan/K/key_sim.mjs (key()'in birebir kopyası): '/home/u/assets', '/home/u/game-assets' ve '/C:/Users/u/Desktop/oyun_assets' için anahtar null; '/home/u/Downloads' ve '/home/u/Masaüstü' için doğru. Tarayıcıda: dist dosyasını /tmp/x/assets/ altına kopyalayıp file:// ile açın.
- **Kabul testi:** 02_tek_dosya, dosya /tmp/x/assets/ ve /tmp/x/game-assets/ altındayken 4/4 geçiyor; DK.assets.missing boş ve kk.ready true.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 §4 Geliştirme önerileri (A_motor): 'Tek dosya: anahtar çözümleme ve davet bağlantısı' (açık)
- **Doğrulama sonucu:** **Doğrulandı** (faz tasarım belgesinde yeniden sınama). Faz 9 tasarım belgesi §0.2 (docs/v05/tasarim/FAZ9_YAYIN_GUVENLIGI_TASARIM.md): doğru. N9-2: v0.4 tek HTML'i assets/ klasöründen açıldığında __ready hiç gelmedi (240 sn), 258 konsol hatası, 53 'Model yüklenemedi'; kk.js:70-71 hata atıyor ve boot() düşüyor (gerçek tarayıcı; denetim yalnız Node benzetimi yapmıştı). Denetçi güveni: yüksek. Bilinen sorun: KI-145.

### K-10 — Tek HTML'de (file://) davet bağlantısı yerel dosya yolunu paylaşıyor (düşük)

- **Dosya ve fonksiyon:** js/ui/menu.js:266, 353 — menu.lobby(); duraklatma menüsündeki 'Oda kodu (kopyala)' düğmesi
- **Kök neden:** Bağlantı ${location.origin}${location.pathname}?join= ile kuruluyor. file:// altında bu 'file:///…/DenizKorsanlari-SonHazine.html?join=…' olur; tarayıcıya göre 'null/…' de olabilir.
- **Oyuncuya etkisi:** Arkadaşa gönderilen bağlantı açılmaz ve kullanıcı adı içerebilecek yerel klasör yolu paylaşılmış olur. İşe yarayan tek bilgi oda kodudur.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** window.__DK_SINGLE_FILE doğruyken ya da location.protocol === 'file:' iken bağlantı yerine oda kodunu ve canlı Pages adresi + ?join= bağlantısını gösterin.
- **Tekrar üretme:** dist dosyasını file:// ile açın → Online → Oda kur; lobideki bağlantı 'file:///…?join=…' olarak görünür.
- **Kabul testi:** file:// altında lobi ve kopyalama düğmesi yalnız oda kodunu ve Pages bağlantısını veriyor; http(s)'de davranış değişmiyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** 02 §4 Geliştirme önerileri (A_motor): 'Tek dosya: anahtar çözümleme ve davet bağlantısı'
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-224.

### K-11 — Test koşucusu konsol hatalarını, 404'leri ve başarısız istekleri başarısızlık saymıyor; tek dosya testinde varlık ve ses denetimi yok (orta)

- **Dosya ve fonksiyon:** tests/harness/run.cjs:40, 44, 96; js/core/assets.js:49-55; tests/scenarios/02_tek_dosya.js:4-9 — page.on('console'), page.on('requestfailed'), finish(); assets.loadAll
- **Kök neden:** '404' içeren konsol hataları tümüyle atılıyor; report.errors çıkış koduna girmiyor (yalnız fails ve pageErrors giriyor). assets.js eksik bir modeli pembe kutuyla değiştirip yalnız console.error yazıyor. Ses yalnız kullanıcı hareketiyle başlatıldığından (main.js:128-130) testte hiç yüklenmiyor. 02_tek_dosya yalnız 4 kontrol yapıyor.
- **Oyuncuya etkisi:** Tek HTML'de bir model ya da ses gömülmezse veya yolu bozulursa testler yine geçer; görsel ya da ses eksikliği yayına gider. Taban koşusunda errors=0 olduğundan şu an gizli bir hata görünmüyor; risk gelecekteki değişiklikler için.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** run.cjs'te errors>0 olduğunda çıkış kodu 1 olsun (beklenen kipler için bir izin listesiyle); 404 süzgeci yalnız ?terrain=badurl kipiyle sınırlansın. 02_tek_dosya'ya şu kontroller eklensin: DK.assets.missing.length===0, gömülü anahtar sayısı 87, await DK.audio.init() sonrasında 17 efekt tamponu ve fetch('assets/audio/music/battle_theme_a.mp3') başarısı.
- **Tekrar üretme:** Kod okuması: run.cjs:40 'if (m.type() === 'error' && !/404/.test(t))'; :96 finish(report.fails || report.pageErrors.length ? 1 : 0). Önerilen deneme: dist kopyasında __DK_FILES'tan 'assets/models/chest.glb' silinirse 02_tek_dosya yine 4/4 geçer; 'Model yüklenemedi' yalnız errors listesine düşer.
- **Kabul testi:** Aynı bozuk kopyayla 02_tek_dosya kalıyor (çıkış 1); sağlam derlemede ve taban senaryolarında yanlış alarm oluşmuyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). K alanının karşı doğrulayıcısı aynı kusuru bağımsız olarak buldu (K-M05: döngü istisnaları console.error'a çevriliyor, koşucular saymıyor). Denetçi güveni: yüksek. Bilinen sorun: KI-146.

### K-12 — coop.cjs adım istisnalarını yutuyor; konsol uyarıları kaydedilmiyor (düşük)

- **Dosya ve fonksiyon:** tests/harness/coop.cjs:34, 53, 61 — ev(), finish()
- **Kök neden:** ev() hata alınca 'EVALERR' yazıp undefined döndürüyor ve hatayı fails'e eklemiyor; run.cjs'teki 02 T09 düzeltmesi co-op koşucusuna uygulanmadı. Konsolda yalnız 'error' türü kaydediliyor; 'warning' türü (ör. ev sahibinin konuğu düşürme nedeni) kaydedilmiyor.
- **Oyuncuya etkisi:** Bir adım istisna atınca kontrol undefined ile yanlış dala gidebilir ya da hiç yapılmayabilir. Taban günlüklerinde 06a'da 19, 06a2'de 18, 06c'de 5 EVALERR var (hepsi kasıtlı kapatılan sekme); bunlar gerçek hatalardan ayırt edilmeden geçti. 06c'deki kararsızlığın nedeni de günlükten okunamıyor.
- **Öncelik:** düşük · hedef faz: Faz 1
- **Önerilen çözüm:** ev(p, js, label, {allowClosed}) biçimine geçin: kasıtlı kapatılan sekme dışındaki istisnalar report.evalErrors ve fails'e yazılsın. console.warn iletileri de rapora eklensin (14. belge #20).
- **Tekrar üretme:** docs/v05/taban_kosusu_44d548c/coop_06a.log → 19 satır 'EVALERR Tayfa page.evaluate: Target page, context or browser has been closed'; coop.cjs:53.
- **Kabul testi:** Kasıtlı kapatma dışındaki bir EVALERR koşuyu kaldırıyor; 06a, 06a2, 06b ve 06d taban sonuçlarıyla geçiyor; raporda uyarılar listeleniyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** 02 T09 (yalnız run.cjs için düzeltildi); denetim/14 #20; denetim/11 #37
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-225.

### K-13 — Onaysız ölçüm betikleri ve açığı kabul eden kontroller belgelerde 'GEÇTİ' olarak görünüyor (orta)

- **Dosya ve fonksiyon:** tests/scenarios/03_fizik_dt.js (expect yok); tests/scenarios/v03/*.js (99 dosya, 0 expect); tests/scenarios/coop/06a_ag_guvenligi.cjs:38-42; docs/denetim/12_TEST_PLANI_VE_SONUCLAR.md:12, 17, 25, 28 — senaryo tasarımı ve sonuç raporlama
- **Kök neden:** run.cjs yalnız expect adımlarını ve istisnaları sayıyor; expect'siz bir betik her durumda rc=0 veriyor. 06a'daki H07 kontrolü, sahte 'gold' iletisinin dakikada 20 000'e kadar işlenmesini başarı ölçütü yapıyor.
- **Oyuncuya etkisi:** Taban koşusunda 03_fizik_dt, 120 FPS'te gemiyi %5,7 eksik götürdüğü hâlde (87,5 m yerine 82,64 m) 'rc=0 PASS=0 FAIL=0' ile geçti. Hikâye ve hazine (v03) regresyonu gerçekte doğrulanmıyor. Güvenlik testi de Faz 0 B-08 açığını olağan kabul ediyor. Sonuçta belgeler yanlış bir güven duygusu veriyor.
- **Öncelik:** orta · hedef faz: Faz 1 (+Faz 9)
- **Önerilen çözüm:** 03_fizik_dt'ye eşikli expect ekleyin (15/30/60 FPS sonuçları ±%1, 120 FPS ±%2). v03/g2b'den onaylı yeni bir hikâye senaryosu türetin (aşama 0→5). 06a H07'yi Faz 2 ile birlikte 'sahte gold iletisi işlenmez' olarak değiştirin. 12. belgede 'ölçüm' ile 'test'i ayırın. Her senaryoda en az bir expect zorunlu olsun: expect sayısı 0 ise run.cjs uyarı versin ya da koşuyu başarısız saysın.
- **Tekrar üretme:** grep -c expect tests/scenarios/03_fizik_dt.js → 0; grep -l expect tests/scenarios/v03/*.js | wc -l → 0 (99 dosya); docs/v05/taban_kosusu_44d548c/summary.txt satırı: '03_fizik_dt rc=0 PASS=0 FAIL=0'.
- **Kabul testi:** Expect'siz bir senaryo koşucuda başarısız sayılıyor; 03_fizik_dt eşik dışı bir 120 FPS sonucunda kalıyor; 12. belge 'GEÇTİ'yi yalnız onaylı senaryolar için kullanıyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** denetim/11 #1 (120 FPS farkı); 02 T07 (sahte geçiş örneği)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). C alanının denetçisi (C-18), H alanının karşı doğrulayıcısı (H-M02), B alanının karşı doğrulayıcısı (B-M07) ve E/SYS2 doğrulaması mekanizmayı sınamayan kontroller bulunduğunu bağımsız olarak kaydetti. Denetçi güveni: kesin. Bilinen sorun: KI-147.

### K-14 — tests/README'deki tek dosya komutu kökteki bayat (v0.3) dosyayı sınatıyor (düşük)

- **Dosya ve fonksiyon:** tests/README.md:33-36; tests/scenarios/02_tek_dosya.js:1-2 — test yönergesi
- **Kök neden:** tests/README '--url file://$PWD/DenizKorsanlari-SonHazine.html' diyor; senaryonun başlığı ve taban koşusu ise dist/ altındaki dosyayı kullanıyor.
- **Oyuncuya etkisi:** Yönergeye uyan kişi v0.3 derlemesini sınamış olur: test geçerse yanlış güven, kalırsa yanlış alarm doğar.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** Komutu her koşuda taze derleme yapacak biçime çevirin: node tools/build-single-html.mjs /tmp/dk.html && node tests/harness/run.cjs tests/scenarios/02_tek_dosya.js --url file:///tmp/dk.html
- **Tekrar üretme:** sed -n 33,36p tests/README.md; sed -n 1,2p tests/scenarios/02_tek_dosya.js
- **Kabul testi:** İki yönerge de aynı, taze derlenmiş dosyayı gösteriyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). A alanında tests/README.md:33-35 iddiasının karşı doğrulaması (A/DOC1) bu yolun depo kökündeki bayat v0.3 dosyasını sınadığını doğruladı. Denetçi güveni: kesin. Bilinen sorun: KI-226.

### K-15 — Derleme ve test bağımlılıklarının sürümleri sabitlenmemiş (package.json ve kilit dosyası yok) (düşük)

- **Dosya ve fonksiyon:** README.md:18; tests/README.md:10-12; .github/workflows/pages.yml:46 — derleme ve test ortamı
- **Kök neden:** Depoda package.json yok. README 'npm i esbuild' diyor (sürümsüz); tests/README'de 'npm i peer' ve Playwright da sürümsüz. Yalnız pages.yml esbuild@0.24.2'yi sabitliyor.
- **Oyuncuya etkisi:** Yerel derleme, CI'dan farklı bir esbuild sürümüyle farklı çıktı üretebilir; bayt eşitliği yalnız 0.24.2 ile doğrulandı. Playwright ya da Chromium sürümü değişince SwiftShader ölçümleri ve kararsız testler de değişir; ortam yeniden üretilemez.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** Kesin sürümlerle bir package.json (devDependencies: esbuild 0.24.2, playwright, peer) ve package-lock.json ekleyin. build:single, test:smoke ve test:coop npm betiklerini tanımlayın. CI'da npm ci kullanın.
- **Tekrar üretme:** git ls-files | grep -c package.json → 0
- **Kabul testi:** npm ci && npm run build:single iki ayrı makinede aynı sha256'yı veriyor; CI aynı kilitli sürümleri kullanıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-227.

### K-16 — esbuild uyarıları derlemeyi durdurmuyor: IIFE çıktısında import.meta sessizce boşaltılıyor (düşük)

- **Dosya ve fonksiyon:** tools/build-single-html.mjs:32-38 — bundle()
- **Kök neden:** logLevel 'warning' ve logOverride tanımlı değil. IIFE biçiminde import.meta {} olur. Özel denetim yalnız terrain.js'teki ifade için var (satır 26).
- **Oyuncuya etkisi:** İleride eklenecek ikinci bir new URL(…, import.meta.url) ifadesi (yeni bir işçi, ses işleci ya da wasm) tek dosyada çalışma anında 'Invalid URL' hatasıyla çöker; derleme ve yayın ise yine başarılı görünür.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** esbuild.build'e logOverride: { 'empty-import-meta': 'error' } ekleyin ya da r.warnings.length > 0 olduğunda process.exit(1) çağırın. Derleme sonrasında çıktıyı import.meta ve new URL('./ kalıntıları için tarayın.
- **Tekrar üretme:** /tmp/denetim_alan/K/esb_meta: aynı ayarlarla new URL('./x.js', import.meta.url) derlendiğinde [WARNING] empty-import-meta çıkıyor, derleme başarılı sayılıyor ve çıktıda (()=>{var t={},o=String(new URL('./x.js',t.url))…})() oluşuyor.
- **Kabul testi:** Aynı girdiyle derleme betiği 1 koduyla çıkıyor; mevcut kaynak uyarısız derleniyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: kesin). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-228.

### K-17 — README ve eski belgeler v0.4 dalında bayat ve kodla çelişiyor (düşük)

- **Dosya ve fonksiyon:** README.md:8, 101-102, 126, 153; docs/11_ONLINE_TEST_RAPORU.md:4, 19, 30; docs/13_BILINEN_HATALAR.md:9; .github/workflows/pages.yml:1 — belgeler
- **Kök neden:** v0.4 değişiklikleri yalnız docs/denetim altına yazıldı; README ile docs/01-14 güncellenmedi (yalnız docs/13 #7 değişti).
- **Oyuncuya etkisi:** Okuyan kişi şunları görür: 'Bu sürüm: 0.3'; artık olmayan 'dost ateşi' seçeneği (menu.js:195'te kaldırıldı); v0.4'te giderilmiş 'yüzen nesneler yalnız ev sahibinde' sınırı (06b B08/H08 artık geçiyor); depoda bulunmayan coop3.cjs testi; '14 belge' ifadesi. pages.yml'nin ilk satırındaki yorum 'derleme adımı yok' diyor, oysa bir derleme adımı var. [Doğrulamayla düzeltildi — F/UC1, K/DOC1] 'README güncellenmemiş' ifadesi doğru değil: v0.4 README'sinde kontroller (C ve N tuşları) güncellenmiş, 'Dalış, balıkçılık ve deniz ekipmanı' ile 'Avcılık ve toplama' bölümleri eklenmiş (README.md:33-79). Bayat olanlar sürüm satırı (README.md:8 'Bu sürüm: 0.3') ve 'Henüz olmayanlar' paragrafı (README.md:130); asıl sorun v0.4'ü ayırt eden bir sürüm ya da derleme damgasının olmaması (menu.js:109,112 ve README birlikte güncellenmeli).
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** README'yi v0.4/v0.5'e göre güncelleyin: sürüm, co-op seçenekleri, belge listesi ve tek dosya bağlantısı. docs/11 ile docs/13'e 'v0.4'te giderildi' notları ekleyin. pages.yml yorumunu düzeltin. Belgelerdeki her 'tamam' iddiasını bir senaryoya ve kontrol etiketine bağlayın.
- **Tekrar üretme:** grep -n 'Bu sürüm' README.md; sed -n 195p js/ui/menu.js satırını README.md:126 ile karşılaştırın; grep -n 'Yüzen olay' docs/11_ONLINE_TEST_RAPORU.md docs/13_BILINEN_HATALAR.md
- **Kabul testi:** README'deki sürüm ve özellik listesi koddaki menü ve sürümle tutarlı; docs/11 ve docs/13'teki açık maddeler denetim/11 ile çelişmiyor.
- **Sürüm:** yalnız v0.4
- **Bilinen kimlik:** denetim/11 #20 (dost ateşi kaldırıldı, README güncellenmedi)
- **Doğrulama sonucu:** **Kısmen doğrulandı, düzeltildi** (dolaylı doğrulama). F/UC1 ve K/DOC1 karşı doğrulamaları kusuru kabul etti ama 'README güncellenmemiş' ifadesini düzeltti; düzeltme Oyuncuya etkisi alanına uygulandı. Denetçi güveni: kesin. Bilinen sorun: KI-229.

### K-18 — Pages 'check' işi 200 dışındaki her yanıtta yayını sessizce atlıyor ve koşu yeşil kalıyor (düşük)

- **Dosya ve fonksiyon:** .github/workflows/pages.yml:21-35 — jobs.check (curl /repos/{repo}/pages)
- **Kök neden:** Yalnız HTTP kodunun 200 olup olmadığına bakılıyor; 401, 403, 5xx ya da oran sınırı yanıtları da enabled=false sayılıyor. Sonuçta deploy 'skipped', koşu ise 'success' oluyor. Ayrıca pages: write ve id-token: write izinleri iş akışı düzeyinde verildiği için check işine de gidiyor.
- **Oyuncuya etkisi:** Geçici bir API hatasında yayın yapılmaz ama Actions yeşil görünür ve yayımlandığı sanılır. Örnek: run 41205990018'de check success, deploy skipped, koşu success.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** 404 yanıtında bir notice ile atlayın, diğer kodlarda exit 1 ile çıkın. İzinleri iş düzeyine indirin. Yayından sonra duman testi ekleyin (sitedeki derleme damgası == github.sha).
- **Tekrar üretme:** mcp__github__actions_list list_workflow_jobs 41205990018 → check success, deploy skipped.
- **Kabul testi:** Pages API 5xx döndüğünde koşu kırmızı oluyor; 404'te bilinçli atlama notu düşülüyor; yayın sonrası damga denetimi geçiyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-230.

### K-19 — Tek HTML derlemesi üçüncü taraf lisans notlarını siliyor (düşük)

- **Dosya ve fonksiyon:** tools/build-single-html.mjs:35 (legalComments: 'none'), 63 (.txt dosyaları dışlanıyor) — bundle(); varlık yürüyüşü
- **Kök neden:** legalComments: 'none' ayarı three.js'in '@license Copyright 2010-2026 Three.js Authors / MIT' başlığını siliyor. assets/fonts/OFL-*.txt ve assets/CC0-1.0.txt dosyaları da gömülmüyor.
- **Oyuncuya etkisi:** Dağıtılan tek dosyada three.js'in MIT bildirimi ve OFL yazı tipi lisans metni bulunmuyor; Krediler ekranı (menu.js:328-329) yalnız adları ve lisans adlarını sayıyor. MIT ve OFL'nin 'bildirim tüm kopyalarda bulunmalı' koşulu açısından uyumsuzluk riski var.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** legalComments ayarını 'eof' (ya da 'inline') yapın. OFL ve MIT metinlerini tek dosyaya, bir &lt;script type='text/plain' id='lisanslar'> bloğu olarak ya da Krediler panelinde tam metin olarak gömün.
- **Tekrar üretme:** grep -c 'Three.js Authors' /tmp/denetim_alan/K/w2_build.html → 0; grep -c 'SIL Open Font License, Version' → 0; aynı başlık vendor/three/three.module.js:1-5'te mevcut.
- **Kabul testi:** Tek HTML'de three.js ve PeerJS'in MIT bildirimleri ile OFL metni bulunuyor; Krediler ekranı bunlara bağlanıyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: orta). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-231.

### K-20 — Tek HTML katı kipi (strict mode) düşürüyor; dil anlamı modüler sürümden farklı (düşük)

- **Dosya ve fonksiyon:** tools/build-single-html.mjs:32-38, 118-123 — bundle() (format: 'iife') ve &lt;script> yerleştirme
- **Kök neden:** ES modülleri doğal olarak katı kipte çalışır. esbuild IIFE çıktısına 'use strict' eklemiyor ve oyun betiği klasik bir &lt;script> olarak yerleştiriliyor. Deneme: undeclaredVar=5 içeren bir modül IIFE olarak hatasız derlendi ve çıktıda 'use strict' yoktu. dist'teki oyun betiği '(()=>{var T_=Object.defineProperty…' ile başlıyor, üst düzeyde 'use strict' yok.
- **Oyuncuya etkisi:** Bildirilmemiş değişkene atama ya da salt okunur bir özelliğe yazma gibi hatalar modüler sürümde istisna atarken tek dosyada sessizce geçer; tersi de olabilir ('this', undefined yerine window olur). Aynı kaynaktan çıkan iki sürüm farklı davranabilir ve testler yalnız modüler sürümde koşulduğu için bu fark yakalanmaz. Somut bir örnek bulunmadı.
- **Öncelik:** düşük · hedef faz: Faz 9
- **Önerilen çözüm:** esbuild seçeneklerine banner: { js: "'use strict';" } ekleyin ya da format: 'esm' ile &lt;script type='module'> kullanın. Test kipinde bir katı kip yoklaması (window.__DK_STRICT = (function(){ return this === undefined; })()) ekleyip 02_tek_dosya'da denetleyin.
- **Tekrar üretme:** /tmp/denetim_alan/K/esb_meta/strict.js → çıktı '(()=>{function e(){return undeclaredVar=5,typeof this}console.log(e());})();'; 'use strict' yok.
- **Kabul testi:** Tek HTML'deki oyun betiği katı kipte çalışıyor (window.__DK_STRICT === true); 02_tek_dosya 4/4 geçmeye devam ediyor.
- **Sürüm:** v0.3 ve v0.4
- **Bilinen kimlik:** —
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Bu madde için ayrı karşı doğrulama yapılmadı (tek kaynak; denetçi güveni: yüksek). Düzeltmeden önce tekrar üretme adımıyla yeniden üretilmeli. Bilinen sorun: KI-232.

### K-M01 — 06c D4-07 kopma kontrolünde önkoşul yok: kapatılan konuk odada olmasa da geçiyor (tabanda boşuna geçti) (orta)

- **Dosya ve fonksiyon:** tests/scenarios/coop/06c_dort_oyuncu.cjs:53-59; docs/v05/taban_kosusu_44d548c/coop_06c.json — 06c senaryosu, D4-07 'Sekmesi kapanan konuk herkeste kalkar (≤ 25 sn)'
- **Kök neden:** Kontrol yalnız kapanıştan sonra herkesin 2 uzak oyuncu görüp görmediğine bakıyor (satır 58-59). Kapatılan g1'in önceden odada olduğunu ve sayının 3'ten 2'ye düştüğünü doğrulamıyor. Bekleme döngüsü (satır 56) sayı zaten 2 ise hiç beklemiyor.
- **Oyuncuya etkisi:** Faz 0 tabanında g1 ('Tayfa') oyun başlarken menüye düşmüştü: D4-02 ['playing','menu','playing','playing'], D4-03 [2,0,2,2]. D4-07 yine de {rem:[2,2,2], waitedMs:0} ile geçti. Kopma temizliğini hiç sınamadan geçebilen bu kontrol T34 'Bağlantı kopması' için kanıt gösteriliyor. Kalp atışı ya da temizlik yolundaki bir gerileme bu yüzden gizli kalır.
- **Öncelik:** orta · hedef faz: Faz 5
- **Önerilen çözüm:** Kapatmadan önce bir önkoşul kontrolü ekleyin: ev sahibinde DK.G.remotes.size === 3 olmalı ve g1, DK.net.roster içinde bulunmalı. Önkoşul sağlanmıyorsa D4-07'yi FAIL sayın. Rapor ayrıntısına 'before' sayısını ve 3→2 geçişinin zamanını yazın. Aynı önkoşul kalıbını diğer kopma kontrollerinde de denetleyin; 06a2 H13 bunu lockBefore ile doğru yapıyor.
- **Tekrar üretme:** docs/v05/taban_kosusu_44d548c/coop_06c.json: D4-02 FAIL (Tayfa 'menu'), D4-07 PASS {rem:[2,2,2], waitedMs:0}. Kod: 06c_dort_oyuncu.cjs:4 (g1 = guests[0] = Tayfa) ve 54-59.
- **Kabul testi:** g1 odaya katılmadan kapatıldığında D4-07 kalıyor. g1 oyundayken kapatıldığında kontrol yalnız 3→2 geçişi gözlenince geçiyor ve rapor 'before: 3' gösteriyor.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Belirsiz** (karşı doğrulama yok). Karşı doğrulayıcının kendi bulgusu (gözden kaçan madde); ayrı bir kaynakla sınanmadı. Düzeltmeden önce yeniden üretilmeli. Bilinen sorun: KI-148.

### K-M02 — 02_arazi_yedek etkin arazi kipini doğrulamıyor; Faz 0 tabanı işçisiz kipleri hiç koşmadığı hâlde 'İşçisiz kipler 12/12' kaydediyor (orta)

- **Dosya ve fonksiyon:** tests/scenarios/02_arazi_yedek.js:1-21; docs/v05/taban_kosusu_44d548c/run_baseline.sh:5, 14-15; docs/v05/00_BASLANGIC_KAYDI.md:47 — 02_arazi_yedek senaryosu; taban koşu betiğindeki one()
- **Kök neden:** Senaryo kipi (DK.terrain.mode ve fallback) yalnız js adımında yazdırıyor (satır 5), expect ile denetlemiyor; kip tümüyle URL parametresine bağlı. Taban betiği senaryoyu parametresiz U=http://localhost:8080/index.html ile koştu. Rapordaki adım 2: mode '', workers 3, fallback false.
- **Oyuncuya etkisi:** Taban kaydı T2/T3 (işçi yok, işçi bulunamadı, işçi çöktü) için güncel bir kanıt varmış gibi gösteriyor, oysa yalnız normal kip koştu. Parametre unutulursa ya da kip adı değişirse test normal kipte sessizce geçer. Böylece yedek yoldaki bir gerileme (v0.3'teki %53'te asılı kalma türünden) CI'da da yakalanmaz.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** Senaryoya beklenen kipi URL'den okuyup doğrulayan bir expect ekleyin: const m=new URLSearchParams(location.search).get('terrain')||''; DK.terrain.mode===m && (m ? DK.terrain.fallback===true : DK.terrain.fallback===false && DK.terrain.workers.length>=1). Taban betiğinde dört kipi ayrı adlarla koşun ve 00_BASLANGIC_KAYDI.md:47'yi düzeltin.
- **Tekrar üretme:** docs/v05/taban_kosusu_44d548c/02_arazi_yedek.json: url 'http://localhost:8080/index.html', adım 2 {mode:'', workers:3, fallback:false}. 00_BASLANGIC_KAYDI.md:47: '02_arazi_yedek 12/12 … İşçisiz kipler'.
- **Kabul testi:** ?terrain=noworker, badurl ve crash koşuları kip ve yedek kontrolünü geçiyor. Parametresiz bir koşu işçisiz kip olarak etiketlenemiyor. Taban kaydında dört kip ayrı satırlarda yer alıyor ve her raporda doğru mode yazıyor.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (dolaylı doğrulama). A/REQ8 karşı doğrulaması '12/12 × 4' kaydının Aşama 9'a ait olduğunu ve 44d548c'de yinelenmediğini doğruladı. Taban koşusunun sahibi olan ana oturum 8d8fb8a'da başlangıç kaydını düzeltti: taban betiği `?terrain=` parametresi vermedi, senaryo etkin kipi doğrulamıyor ve işçisiz kipler tabanda denenmedi. Kayıttaki yanlış ifade böylece giderildi ve f80f205'te noworker, badurl ve crash kipleri v0.4 üzerinde ayrıca koşuldu (üçü de 12/12); senaryonun etkin kipi doğrulamaması açık. Bilinen sorun: KI-149.

### K-M03 — Belgeler v0.3 tek dosyasının file:// davranışında çelişiyor: 03:21 ve 04 §4.2c 'yükleme ekranında takılma' diyor, 01:43 ise açıldığını kaydediyor (orta)

- **Dosya ve fonksiyon:** docs/denetim/03_DEGISIKLIK_LISTESI.md:21; docs/denetim/04_KOK_NEDENLER.md:21-25; docs/denetim/01_ILK_DENETIM_RAPORU.md:43; 762f1c7:tools/build-single-html.mjs:16,27; commit 903abe2 ve 463d01f; js/world/terrain.js:69 (v0.4) — Tek dosyada işçi kurulumu (v0.3'te klasik blob işçisi, v0.4'te modül işçisi) ve ilgili belge kayıtları
- **Kök neden:** v0.3 derlemesi işçi çağrısını tümüyle 'new Worker(window.__DK_WORKER_URL)' ile, yani klasik işçiyle değiştiriyor. 01:43'teki koşu v0.3 dist'ini file:// altında '3 işçi … oyun başladı, 129 arazi karosu' olarak kaydediyor. Blob reddi 903abe2'de görüldü: orada yalnız URL ifadesi değiştirildi ve '{ type: 'module' }' bırakıldı, yani işçi modül işçisine döndü. Sorun 463d01f'te data: URL ile giderildi. 03:21 ve 04 §4.2c ise bunu v0.3'e de genelleyip 'v0.3'te bu yükleme ekranında takılma demekti' diyor.
- **Oyuncuya etkisi:** Belgeler canlıdaki çevrimdışı dosyanın (v0.3) çift tıklamayla açılmadığını ima ediyor. Bu yanlışsa yayın önceliği ve kullanıcıya verilecek bilgi yanlış temele oturur; K-01'deki 'file:// data: işçisi eksik' etkisi de abartılmış olur. Doğruysa canlıdaki tek dosya hiç açılmıyor demektir (kritik) ve bu hiçbir yerde açık madde olarak izlenmiyor. Her iki durumda da konu tarayıcıda doğrulanmadan bırakılmış. Güven orta: bu doğrulamada tarayıcı koşulmadı; A-01 de 01:43'e dayanarak dosyanın 'normalde açılır' olduğunu söylüyor.
- **Öncelik:** orta · hedef faz: Faz 9
- **Önerilen çözüm:** Kökteki dosyaya (v0.3, sha256 f0ac8cb0…) karşı 02_tek_dosya'yı file:// altında Chromium'da ve Firefox'ta koşun, raporu belgelere ekleyin. 03:21 ve 04 §4.2c'yi sonuca göre düzeltin ve reddin yalnız modül işçisinde görüldüğünü belirtin. Sonucu 11. belgeye yazın.
- **Tekrar üretme:** git show 762f1c7:tools/build-single-html.mjs | sed -n 16,27p çıktısında 'new Worker(window.__DK_WORKER_URL)' görünüyor; derlenmiş /tmp/denetim_alan/karsit_K/v03.html içinde de aynı çağrı var. git show 903abe2 -- tools/build-single-html.mjs yalnız URL ifadesinin değiştiğini gösteriyor. 01_ILK_DENETIM_RAPORU.md:43: '(dist, file://) … 3 işçi … oyun başladı'.
- **Kabul testi:** Belgeler v0.3 tek dosyasının file:// davranışını ölçülmüş tek bir ifadeyle ve ekli koşu raporuyla veriyor; 01, 03 ve 04 arasında çelişki kalmıyor.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). A alanının denetçisi aynı çelişkiyi bağımsız olarak kaydetti (A belge iddiaları: 04 §4.2c 'kısmen', 02_HATA_LISTESI B-01 'doğru' satırları). Bilinen sorun: KI-150.

### K-M04 — Yayından önce v0.3 kayıtlarının v0.4'te yüklenmesini sınayan otomatik test ya da fikstür yok (orta)

- **Dosya ve fonksiyon:** tests/fixtures/ (yalnız archipelago_v03.json); tests/scenarios/08_kalicilik.js:30; tests/scenarios/12_kayit_dongusu.js; docs/denetim/16_SON_RAPOR.md:98-100; js/game/game.js:161-177; js/core/save.js:33-44 — Kayıt/yükleme regresyon testleri; yayın kontrol listesi (§16.7)
- **Kök neden:** 08 ve 12 kaydı aynı oturumda game.serialize() ile üretip hemen yüklüyor; v0.3 kodunun ürettiği gerçek bir kayıt hiçbir testte yüklenmiyor. §16.7 'kayıtlı v0.3 oyunlarıyla yükleme denemesi'ni yayın öncesinde el ile yapılacak bir adım olarak bırakıyor. İki sürüm de aynı 'version: 1' damgasını yazıyor (D-05). Yükleme sırasında bir start() istisnası oturumu yarım bırakabiliyor ve otomatik kayıt yuvanın üstüne yazabiliyor (D-06).
- **Oyuncuya etkisi:** v0.4 canlıya alındığında her oyuncunun localStorage'daki v0.3 kaydı ilk kez v0.4 koduyla yüklenecek ve bunu sınayan bir yayın kapısı yok. Uyumsuz bir alan istisna atarsa karışık durum yuvanın üstüne yazılabilir, yani ilerleme kaybı riski var. Kırılma kanıtlanmadı (kayıt düzeni büyük ölçüde aynı); eksik olan doğrulamanın kendisi.
- **Öncelik:** orta · hedef faz: Faz 4
- **Önerilen çözüm:** 762f1c7 ile gerçek oturumlardan kayıt fikstürleri üretip tests/fixtures/ altına koyun; hikâye ilerlemesi, gemi hasarı, ada ve tapınak durumu, online ve konuk yuvası kapsansın. v0.4'te bu fikstürleri DK.save.write ve DK.handlers.startGame ile yükleyen bir senaryo yazın. Senaryo alanların korunduğunu ve 60 sn boyunca döngünün hatasız sürdüğünü (konsol hatası 0) doğrulasın. Senaryoyu CI duman setine ve yayın kontrol listesine ekleyin.
- **Tekrar üretme:** ls tests/fixtures yalnız archipelago_v03.json'u gösteriyor. grep -n -e save.read -e startGame tests/scenarios/08_kalicilik.js kaydın aynı oturumda üretildiğini gösteriyor. 16_SON_RAPOR.md:98-100 adımı el ile yapılacak olarak listeliyor.
- **Kabul testi:** v0.3 fikstürleriyle yükleme senaryosu v0.4'te geçiyor: istisna ve konsol hatası 0, alanlar korunuyor, yuva bozulmuyor. Senaryo yayın iş akışında zorunlu adım.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). D alanının denetçisi aynı eksikliği bağımsız olarak kaydetti (tests/fixtures yalnız archipelago_v03.json içeriyor; v0.3 kayıt örneğiyle yükleme senaryosu yok). Bilinen sorun: KI-151.

### K-M05 — Oyun döngüsündeki istisnalar console.error'a çevriliyor; koşucular bunu saymadığı için 'sayfa hatası 0' ölçütü döngü hatalarını göremiyor (orta)

- **Dosya ve fonksiyon:** js/core/engine.js:65-67; js/main.js:117-122; tests/harness/run.cjs:40, 43, 96; tests/harness/coop.cjs:34-35, 61; docs/denetim/12_TEST_PLANI_VE_SONUCLAR.md:61, 92 — engine.start() kare döngüsü; koşucuların çıkış kodu
- **Kök neden:** engine.start() her güncelleyiciyi (main.js:117-122'deki game.update, hud.update, net.update) try/catch ile sarıyor ve hatayı console.error'a yazıyor. Bu yüzden gerçek zamanlı döngüde atılan bir istisna hiçbir zaman 'pageerror' olmuyor. Koşucular yalnız pageerror'ları ve expect başarısızlıklarını sayıyor; console.error yalnız rapora yazılıyor. K-11 konsol hatalarının sayılmadığını söylüyor, ama motorun istisnaları bu yola çevirdiğini, dolayısıyla pageerror ölçütünün döngü için hiç tetiklenemeyeceğini belirtmiyor.
- **Oyuncuya etkisi:** 12. belgedeki 'Sayfa hatası (pageerror) tüm koşularda 0' ifadesi döngünün hatasız olduğunu kanıtlamıyor. Her karede istisna atan bir HUD ya da ağ güncellemesi testleri geçirir ve yalnız rapor JSON'undaki errors dizisinde görünür. Tabanda errors=0 olduğu için şu an gizli bir hata yok; risk gelecekteki gerilemeler ve kurulacak CI kapısı için.
- **Öncelik:** orta · hedef faz: Faz 1
- **Önerilen çözüm:** Koşucular report.errors'u başarısızlık saysın; en azından motor kaynaklı ve TypeError ya da ReferenceError içeren hatalar. Alternatif olarak motor döngüsü hataları window.__loopErrors sayacına da yazsın ve her senaryonun sonunda __loopErrors === 0 beklensin. Aynı kuralı coop.cjs'e de uygulayın. 12. belgedeki ölçütü 'sayfa hatası + döngü hatası + konsol hatası 0' olarak güncelleyin.
- **Tekrar üretme:** Kod okuması: engine.js:66 'try { u(dt); } catch (e) { console.error(e); }'; run.cjs:96 'finish(report.fails || report.pageErrors.length ? 1 : 0)'. Elle deneme: oyun açıkken konsolda DK.engine.updaters.add(()=>{ throw new Error('x') }) çalıştırılınca her karede console.error düşer, senaryo yine rc=0 verir. Bu doğrulamada tarayıcı koşulmadı.
- **Kabul testi:** Gerçek zamanlı döngüde tek bir istisna senaryoyu başarısız yapıyor; CI raporu döngü hatası sayısını gösteriyor.
- **Sürüm:** yalnız v0.4 (karşı doğrulama metnine göre)
- **Bilinen kimlik:** — (karşı doğrulamada eklendi)
- **Doğrulama sonucu:** **Doğrulandı** (iki bağımsız kaynak). K alanının denetçisi aynı kusuru bağımsız olarak buldu (K-11). Taban koşusunun sahibi olan ana oturum da 8d8fb8a'da başlangıç kaydına aynı notu düştü (run.cjs console.error'ı rapora yazıyor ama çıkış kodunda saymıyor). Bilinen sorun: KI-152.

