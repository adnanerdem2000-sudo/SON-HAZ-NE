# Faz 8 tasarım belgesinin karşıt inceleme düzeltmelerini uygular: kaynak.md -> faz8_tasarim_NIHAI.md
import sys
P = '/tmp/tasarim_y/faz8_inceleme/betik/kaynak.md'
OUT = sys.argv[1]
s = open(P, encoding='utf-8').read()
D = '(inceleme düzeltmesi)'

def one(a):
    c = s.count(a)
    assert c == 1, (c, a[:90])

def app(a, t):
    global s
    one(a); s = s.replace(a, a + t, 1)

def rep(a, t):
    global s
    one(a); s = s.replace(a, t, 1)

def _line(a):
    one(a); i = s.index(a); b = s.rfind('\n', 0, i) + 1; e = s.find('\n', i)
    return b, (len(s) if e < 0 else e)

def repline(a, t):
    global s
    b, e = _line(a); s = s[:b] + t + s[e:]

def appline(a, t):
    global s
    b, e = _line(a); s = s[:e] + t + s[e:]

def insafter(a, t):
    global s
    b, e = _line(a); s = s[:e] + '\n' + t + s[e:]

# ---------------- başlık ----------------
app("FPS ve GPU kare süresi **ölçülmedi** (§1.1, §1.6).",
    "\n\n> **" + D + " Karşıt inceleme.** Bu nihai sürüm taslağın kodla (44d548c), Faz 2–6 nihai tasarımlarıyla, inceleme sırasında yayımlanan Faz 7 nihai tasarımıyla (`FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md`, KARARLAR.md Faz 7 bölümü), Faz 9 taslağıyla ve üç ek salt-okur tarayıcı ölçümüyle sınanmış hâlidir: `/tmp/tasarim_y/faz8_inceleme/inc_olcum.js`, `inc_olcum2.js`, `inc_olcum3.js` (raporlar aynı adla `.json`/`.log`; 640×360, SwiftShader, kilit sarmalayıcısıyla, 8080'deki v0.4'e karşı; üçü de errors 0, pageErrors 0) ve Node denemesi `fp.mjs`. Değişen her yer \"" + D + "\" ile işaretlidir. Bulunan sorunların önem sırasına göre listesi belgenin sonundadır (Ek C).")

# ---------------- §0.1 ----------------
app("Üçgenin %38'i her yöne çizilen çekirdek bitki örtüsü (473 K).",
    " " + D + " Limandaki 9 NPC'nin gölge çağrıları gölge kutusunun **içindedir**: karakterlerde görüş konisi ayıklaması açılınca (ölçüldü, `inc_olcum.json`) karakter çağrısı 87 ana + 126 gölge → 32 + 114 olur (−67; gölgede yalnız iki balıkçının 12 çağrısı düşer). Beş yengeç (131–173 m) ayrıca −40 (20 + 20).")
app("açık denizde 1,6 km'deki adaya bakınca çağrı 2,5 katına çıkıyor.",
    " " + D + " Görüş konisi ayıklaması (P2.1) uzak liman karakterlerini yalnız liman `camera.far`'ın (5 km) ötesindeyken ya da görüş dışındayken kaldırır. 5 km içinde limana bakılırken kaldırmaz: oyuncu limandan 2,9 km açıktayken karakter ana çağrısı 149 → 143, gölge 81 → 14 (ölçüldü). Bu pay P2.5'in ekran boyutu kuralıyla kalkar.")
app("kaldırılan boss'un mermileri uçmaya devam ediyor.",
    " " + D + " Kök neden kodla ve Node ile bağımsız doğrulandı (§5.4): `bosses` alt adım kümesinde (game.js:187), `checkT` her adımda 1/60 azalır (bosses.js:1106-1107) ve 30 ardışık çıkarmadan sonra +1,04·10⁻¹⁶ kaldığı için denetim 31 adımda bir çalışır; 09'un 42 adımlık döngüsünde evre her döngüde 11 kayar, rastgele başlangıç evresinde dG = 5 olasılığı ≈ %6,5'tir. Kraken de aynı kurala takılır (G.ship'in 40 m yanında doğar, bosses.js:148-150) ve 09'un 'boss_kraken' ölçümü boss'suzdur: taban koşusunda 317 çağrı = 'firtina' 317, `bossAlive:true` yanıltıcıdır.")

# ---------------- §0.2 kararlar ----------------
repline("| K8-4 |",
    "| K8-4 | Nokta ışığı havuzu oturum boyunca sabit. " + D + " **Yüksek 6 / Orta 4 / Düşük 2** (taslakta \"sabit 4\"); lamba adayları en çok 4 yuva (Faz 6 \"havuz 4\" kuralı aynen); meşale, uzak oyuncu meşaleleri (Faz 5), yıldırım ve mağara ışıkları aynı havuzdan | Meşale yeniden derlemesi biter. v0.4'te tek oyunculuda aynı anda 4 fener + meşale + yıldırım = 6 ışık etkin olabiliyor (islands.js:236-243, character.js:336, weatherfx.js:115). Yüksek'te 4 yuva, gece kasabada meşale yakınca 1–2 fenerin ışığını söndürürdü (görünür kalite kaybı). 6 yuva bugünkü 7 kalıcı ışıktan yine ucuzdur | §6.2 |")
repline("| K8-6 |",
    "| K8-6 | **Yüksek ön ayarın görüntüsü v0.4 ile aynı** (görüntü farkı testi zorunlu); DPR 2 korunur; dinamik çözünürlük varsayılan kapalı. " + D + " Taslağın Yüksek sütunundaki sabit kesmeler kaldırıldı: karakter 220 m / hayvan 160 m görünürlük sınırı, 40–120 m'de 15 Hz ve 120 m ötesinde 4 Hz animasyon, \"yarıçap < 0,25 m gölge atmaz\", çekirdek bitkide \"gölge ≤ 120 m hücre\", su altında gölge dondurma ve arazinin 1,15·d99'da kırpılması. Yüksek'te her kesme (a) gerçek çizim tamponu yüksekliği, FOV ve dürbünle hesaplanan ekran boyutuna, (b) ölçülmüş görüntü farkına (sınır bandında en çok fark ≤ 8/255) bağlıdır. Işıyan nesneler gece ekran boyutu kesmesinden muaftır | Kullanıcı kuralı: FPS için görünür kaliteyi düşürme. Taslak bu kesmeleri ölçmeden \"D\" saymıştı; inceleme ölçümünde fırtınada 1,15·d99 kırpması ada siluetinde 36 pikselde 27/255'e varan fark üretti, taslağın 47/48 ölçütleri bunu yakalamıyor | §3.3, §3.5–3.7, §4.2, §8.3 |")
repline("| K8-7 |",
    "| K8-7 | Volkanik Dev: test düzeltilir (boss yanında, denetim donuk, kimlik farkı; " + D + " kamera boss'a dönük, `visible=false` doğan parçalar bir kez çizilir, GPU yüklemesinden bağımsız yaratılış kaydı; 09'un 'boss_kraken' ölçüm adımı da düzeltilir); oyunda boss mermileri ve `enemies.start` işaretleri temizlenir | Kök neden kanıtlandı (inceleme: kod + Node ile bağımsız doğrulandı) | §5.4–5.5 |")
repline("| K8-8 |",
    "| K8-8 | Önkoşullar: Faz 1 A-19 (LOD ölçeği sırası), Faz 3 ÇİZİM evresi (animasyon katmanları); " + D + " ayrıca Faz 2 §7.7 (`Ship.rebuild` → `disposeTree`), Faz 5 `RemotePlayer` yeniden yazımı ve uzak oyuncu meşalesi (Faz 5 §2 satır 3: \"≤ 30 m'de gerçek ışık\"), Faz 6 `CAVES`/`_lamp`/`storyFx karanlik`, Faz 7 nihai §7 ve F7-19 (değişmezler, `enemies.stats`, `aiQueue` bütçesi, `lod.simTier(e)` uyarlayıcısı, `DK.lod.override`). Faz 8 başında taban Faz 7 sonu kodunda yeniden ölçülür | Belgedeki sayılar v0.4 | §4.4, §7 |")
repline("| K8-9 |",
    "| K8-9 | Liman bütçesi kademeli: " + D + " P2 sonrası ≤ 900 (P2.6 gövde birleştirmesiyle ≤ 840), P3 sonrası ≤ 550, son ≤ 500 (09 görünümü); tarama en çok ≤ 520. Hepsi geçicidir; Faz 7 sonu tabanında yeniden hesaplanır | Taslağın \"~−560\" kazancının P2 kısmı ölçülmemişti. İnceleme ölçümünde P2.1'in limandaki etkisi −67 (karakter) −40 (yengeç) çıktı; taslağın varsaydığı NPC gölgesi kazancı (−85) yoktur, çünkü NPC'ler gölge kutusunun içindedir | §7.4, §8.4 |")
repline("| K8-10 |",
    "| K8-10 | Ayar şeması geriye uyumlu (`preset`, `dynRes`, `dprCap` eklenir; eski ayar dosyası açılır). " + D + " Yeni anahtarlar `DEFAULT_SETTINGS`'e (settings.js:10-19) türleriyle eklenir, çünkü Faz 4'ün içe aktarma doğrulayıcısı yalnız bu anahtarları ve türlerini kabul eder (Faz 4 §3.3: \"Yalnız DEFAULT_SETTINGS anahtarları alınır… Bilinmeyen anahtarlar atılır\"); `preset` değer kümesi doğrulanır | Faz 4: kayıt biçimine dokunulmaz | §4.3 |\n"
    "| K8-11 | " + D + " Düşman LOD politikası Faz 8'in `lod.simTier(e, ctx) → {tier, thinkHz, moveStep, animHz, perceiveHz}` işlevidir (Faz 7 nihai §7, Ç-12, N-25). Faz 8, Faz 7'nin önerdiği T0/T1/T2 tablosunu (≤ 45 m ya da hedefli/saldırıda/boss: her adım, animasyon her kare; 45–90 m: 2 adımda bir, 30 Hz; 90–220 m: 0,25 sn, 10 Hz, görünmüyorsa donuk) ve değişmezleri (F-08 hedefli düşman seyreltilmez, `attack` T0, C-16 koruyucu alt adım, uzak oyuncu mesafesi) aynen uygular; `ctx.görünür` P2.1/P2.5'ten gelir; test kancası `DK.lod.override(fn)`. Faz 7'nin `enemies.js` uyarlayıcısı, `aiQueue` (24 sorgu/kare) ve `enemies.stats` sayaçları yerinde kalır | Taslağın T9'daki \"> 30 m görünmeyen düşman 4 Hz\" kuralı ve P2.2'nin `enemies.js:1597-1610`'u ayrıca değiştirmesi Faz 7 nihai sözleşmesiyle hizalı değildi | §3.9, §7 |\n"
    "| K8-12 | " + D + " Gerçek GPU turu üretimde `window.DK`'ye dayanmaz: `?perf=1` katmanındaki \"Performans turu\" düğmesi (yalnız tek oyunculu, kayıtsız geçici oturum, çevrimiçide kapalı); test kipinde ayrıca `DK.perf.tour()` | Faz 9 taslağı (K9-3) `window.DK`'yi yalnız `?test=1` + yerel kökende açıyor; Faz 2 ve Faz 6 nihai kancaları da yalnız test kipinde. Kullanıcı canlı sürümde `DK.perf.tour()` çalıştıramazdı | §1.6, P0.5 |\n"
    "| K8-13 | " + D + " Faz 3'ün Faz 8'e bıraktığı \"uyarlanır adım bütçesi\" uygulanmaz; `MAX_STEPS = 6` kalır | Ölçülen benzetim 0,85–2,6 ms/kare; 6 adım 16 ms'nin altında. Faz 3'ün belirlenim gerekçesi geçerli | §1.5 B |\n"
    "| K8-14 | " + D + " `10_uzun_oturum` tam pakette (≈ 3,5 dk); `52_uzun_oturum_gercek` haftalık ya da elle (≥ 25 dk). Zaman eşikli denetimler Faz 9'un `ortamDuyarli` etiketini taşır | Faz 9 taslağı bu kararı Faz 8'e bırakıyor | §8.1 |")

# ---------------- §0.3 ----------------
repline("| Hayvan simülasyon LOD'u | 250 m; co-op'ta hepsi |",
    "| Hayvan simülasyon LOD'u | 250 m; co-op'ta hepsi | `|| G.online` yerine en yakın oyuncu kuralı; " + D + " AI sıklık katmanları 08d ölçümüne bağlı koşullu adım | §3.8 |")
repline("| Düşman AI LOD'u | Var |",
    "| Düşman AI LOD'u | Var | " + D + " `lod.simTier` (Faz 7 nihai §7 önerisi ve değişmezleri); Faz 7 uyarlayıcısı ve bütçe kuyruğu | §3.9 |")
insafter("| Gereksiz çizim ve shader derlemesi |",
    "| " + D + " Takılmalar: harita karosu (J-18), ada NPC kurulumu (J-29) | Taslakta plansızdı | P5.3, P5.4 | §7.2 |")

# ---------------- §1.1–1.2 ----------------
app("(post.js:62: yazılımsal çizicide `high` → `medium`, yani 4× MSAA yerine FXAA)",
    " " + D + " Bu yüzden SwiftShader'daki \"Yüksek\" ölçümü aslında Orta son işleme zinciridir: gerçek GPU'nun Yüksek zincirinde FXAA geçişi yoktur, son işleme 16 değil 15 çağrıdır ve görüntü eşdeğerliği testleri MSAA yolunu sınamaz")
insafter("- **Gerçek GPU ölçümü YOKTUR.**",
    "- " + D + " Bu ortamda ölçülen uzantılar (`inc_olcum3.json`): SwiftShader'da `EXT_disjoint_timer_query_webgl2` **vardır**, ama verdiği süre yazılımsal rasterleştirme süresidir; GPU süresi olarak raporlanamaz. `KHR_parallel_shader_compile` **yoktur**: bu ortamda `compileAsync` eşzamanlı derler, derleme maliyeti yalnız yer değiştirir. `maxSamples` 4, tuval `antialias:true`.")
app("gerçek GPU'da da aynı çıkar", " (" + D + " son işleme zinciri hariç, §1.1)")

# ---------------- §1.3 araçlar ----------------
insafter("| Geometri kimlik izleyici |",
    "| " + D + " Yaratılış kaydı | `BufferGeometry.prototype.setAttribute` ve `Material.prototype.setValues` sarılır (yerleşik geometri ve malzeme kurucularının ortak çağrıları); `dispose` sarmalayıcısı kaydı siler; döngü sonunda sahneden erişilemeyen ve paylaşımlı kümede olmayan kalanlar listelenir | GPU yüklemesinden ve kameradan bağımsız sızıntı ölçümü (§5.4) |")

# ---------------- §1.4–1.6 ----------------
app("ölçüm boss'suz yapılmış olur (§5.4).",
    " " + D + " Kraken `site`'ta değil, `G.ship`'in 40 m yanında doğar (bosses.js:148-150); S8a'da gemi Kraken noktasının yanına götürüldüğü için ölçüm geçerlidir. Taş Muhafız `BOSS_SITES`'ta yoktur, oyuncunun 30 m yanında doğar (bosses.js:1058) ve 09'da her döngüde ölçülür.")
rep("Görünür iç: tünel + oda; geri kalan her şey dış dünya |",
    "Görünür iç: tünel + oda " + D + " ve odada yaşayan 7 yarasa (animals.js:758); geri kalan her şey dış dünya |")
app("`GPU_DISJOINT_EXT` olursa o kare atılır), JS güncelleme ms.",
    " " + D + " Uzantı yoksa (Firefox ve Safari'de çoğunlukla kapalı) GPU sütunu \"ölçülemedi\" yazılır; çizici adı SwiftShader/llvmpipe ise katman süreyi \"yazılımsal\" etiketiyle gösterir ve B tablosuna yazmaz.")
repline("3. **`DK.perf.tour()`**:",
    "3. **Performans turu** " + D + " (`DK.perf.tour()` yerine `?perf=1` katmanındaki \"Performans turu\" düğmesi; K8-12): kayıt yazmayan geçici bir tek oyunculu oturumda §1.4'ün 9 sahnesini sırayla kurar (çevrimiçi kipte kapalı); her sahnede 3 sn ısınma + 10 sn ölçüm (kamera 8 yöne döner); sonunda JSON'u panoya kopyalar ve dosya olarak indirir. Test kipinde aynı işlev `DK.perf.tour()` adıyla da açıktır. Çıktı PERFORMANCE_REPORT.md'nin B tablosuna girer.")

# ---------------- §2 ----------------
app("bugün 213'tür (NPC 159 + oyuncu 30 + balıkçı 24).",
    " " + D + " NPC grubunun gölge payı (100) görüş ayıklamasıyla azalmaz: NPC'ler oyuncunun yanında, gölge kutusunun içindedir (ölçüldü, §2.3 ek tablo). Bu pay görüntü değiştirmeden ancak KayKit gövde parçalarının birleştirilmesiyle (P2.6: karakter başına 6 iskeletli parça → 1) düşer.")
app("bitki örtüsünün dev sınır küresi her zaman kutuyla kesişiyor.",
    " " + D + " Kutunun dışında kalan ve ayıklamayla düşen gölge çağrıları ölçüldü: iki balıkçı 12, beş yengeç 20. Limandaki 9 NPC'nin gölgesi kutunun içindedir ve düşmez; taslağın \"NPC kutu dışında da gölgeye çiziliyor\" çıkarımı limandaki NPC'ler için geçerli değil.")
insafter("NPC'lere **sırtını dönmüşken de** 55 ana + 100 gölge çağrısı harcanıyor.",
    "\n**" + D + " P2.1'in ölçülen etkisi** (`inc_olcum.json`, `inc_olcum2.json`). Yöntem: 9 NPC, 2 balıkçı ve oyuncunun bütün örgülerinde `frustumCulled=true`, iskeletlilerde `SkinnedMesh.computeBoundingSphere()` × 1,5; karakter payı = kökler gizlenince düşen çağrı (ana ve gölge ayrı).\n\n"
    "| Görünüm | Toplam önce → sonra | Karakter ana önce → sonra | Karakter gölge önce → sonra |\n|---|---|---|---|\n"
    "| 09 görünümü (saat 8,5) | 1 036 → 969 | 87 → 32 | 126 → 114 |\n"
    "| yaw 0 | 588 → 515 | 88 → 27 | 126 → 114 |\n"
    "| yaw π/2 | 667 → 624 | 114 → 83 | 126 → 114 |\n"
    "| yaw π | 1 042 → 975 | 87 → 32 | 126 → 114 |\n"
    "| yaw −π/2 | 681 → 627 | 123 → 81 | 126 → 114 |\n"
    "| Oyuncu 2,9 km açıkta, varsayılan kamera | 893 → 826 | 159 → 159 | 81 → 14 |\n"
    "| Oyuncu 2,9 km açıkta, limana bakış | 879 → 806 | 149 → 143 | 81 → 14 |\n"
    "| Yalnız yengeçler (5; oyuncuya 131–173 m), 09 görünümü | 1 024 → 984 | 20 → 0 | 20 → 0 |\n\n"
    "Sonuç: (a) NPC gölgeleri kutuda kalır, gölgede yalnız balıkçılar (12) düşer; (b) ana geçişte yalnız görüş dışındaki karakterler düşer; (c) 2,9 km'de liman görüşteyken alt piksel karakterler çizilmeye devam eder (NPC başına 7–23 görünür örgü), kesme P2.5'tedir; (d) \"sırt dönükken karakter çağrısı 0\" ölçütü olanaksızdır ve olmamalıdır: kameranın arkasındaki karakterin gölgesi önde görünebilir. Karakter örgü dökümü (`inc_olcum2.json`): NPC başına 14–29 örgü (görünür 7–23), 6'sı iskeletli gövde parçası; her örgü ayrı malzeme klonu taşıyor (NPC başına 14–24 malzeme, character.js:459).")
app("(GPU kırpar ama çağrı ve köşe işleme harcanır).",
    " " + D + " Görüş konisi ayıklaması bunu yalnız `camera.far` ötesinde ya da görüş dışında giderir; 5 km içinde limana bakarken kesme ekran boyutu kuralıyla (P2.5) yapılır (ölçüldü, §2.3 ek tablo).")

# ---------------- §3.0 özet tablo ----------------
repline("| T3 | LOD (ayrıntı düzeyi) |",
    "| T3 | LOD (ayrıntı düzeyi) | Arazi halkaları, ada hücreleri, deniz devi 700 m | **Uygula**: karakter/hayvan görünürlük + animasyon katmanları, bitki hücreleri; örgü LOD'u yalnız gemide (isteğe bağlı); " + D + " KayKit gövde parçalarının birleştirilmesi (P2.6) | " + D + " Ölçülen: P2.1 limanda −67 karakter, −40 yengeç; uzak liman karakterleri yalnız 5 km ötesinde ya da görüş dışında. P2.6 tahmini −50…−65 | O (Yüksek'te ekran boyutuna bağlı) | Faz 3 ÇİZİM evresi, Faz 7 |")
repline("| T5 | Gölge mesafesi |",
    "| T5 | Gölge mesafesi | 110 m kutu, her şey gölge atıyor | **Uygula**: kutu dışındaki gölge atanların sınır küresiyle ayıklanması, mağarada güncelleme yok (" + D + " su altında ve gecede güncelleme sürer), texel hizalama, ön ayara bağlı kutu | " + D + " Gölge geçişi 246 → ~170–190 (ölçülen: balıkçı −12, yengeç −20; tahmin: liman −40 T1 ile), P2.6 ile ~−45 daha; mağarada gölge 0 | D (hizalama iyileştirir) | T3 |")
repline("| T6 | Uzak nesne ayrıntısı |",
    "| T6 | Uzak nesne ayrıntısı | Yok (camera.far 5 km) | **Uygula**: ekran boyutu (gerçek çizim tamponu yüksekliğiyle) + sis görüşüne bağlı mesafe ayıklaması; " + D + " Yüksek'te arazi ve büyük nesneler 3·d99'a kadar kırpılmaz, ışıyan nesneler gece muaf | Açık denizde en yoğun yön 980 → ~350; kasabada 1 133 → ~550 (" + D + " ölçülmemiş tahmin; P0'da deneyle ölçülür) | O | T1, T2 |")
repline("| T7 | Bitki örtüsü |",
    "| T7 | Bitki örtüsü | Çekirdek adalar tek parça | **Uygula**: çekirdek bitkiyi hücrelere böl (ada `Batch` deseni); " + D + " gölge kararını hücre sınır küresiyle three.js'in gölge kamerası ayıklaması verir, mesafe kuralı yok | Üçgen −220 K (liman), gölge −120 K (tahmin) | D–O | — |")
repline("| T8 | Hayvan simülasyon LOD'u |",
    "| T8 | Hayvan simülasyon LOD'u | 250 m dışında yok; co-op'ta hepsi | **Uygula**: parça birleştirme, `|| G.online` yerine en yakın oyuncu; " + D + " AI sıklık katmanları koşullu (08d'de `animals.update` > 0,5 ms ise) | −213 çağrı (liman, örgü sayımından tahmin); JS kazancı ölçülmedi (co-op limanında fark 0,057 → 0,058 ms) | O | Faz 3, Faz 5 |")
repline("| T9 | Düşman AI LOD'u |",
    "| T9 | Düşman AI LOD'u | Var (enemies.js:1597-1606) | " + D + " **`lod.simTier(e, ctx)`**: Faz 7 nihai §7 tablosu ve değişmezleri; Faz 7 uyarlayıcısı `enemies.js`'te kalır; Faz 8 görünürlük girdisi ve çizim/gölge ayıklaması | JS küçük; kamp/savaş sahnelerinde | D | Faz 7 |")
repline("| T10 | Parçacık havuzları |",
    "| T10 | Parçacık havuzları | Tek Points (900), CPU verimsiz | **Uygula**: SoA halka tampon, kısmi yükleme (" + D + " kare başına tek yükleme Faz 3 A2b'nin işidir) | Çağrı 0; JS/GC küçük | D | Faz 3 |")

# ---------------- §3.1 gemi ----------------
app("Hedef sloop ≤ 20 örgü, ≤ 10 gölge atan; brigantin ≤ 30.",
    " " + D + " Kod yanlış okunmuştu: `_applyDamageVisuals` (ship.js:119-142) birleşik örgüyü yeniden kurmaz; direk düşünce `M.masts[i].objs` nesnelerini çalışma anında bir pivota taşır (`piv.attach(o)`, ship.js:129) ve `root.userData.rigging`'i gizler. `rebuild` (ship.js:66-74) yalnız direk onarımında (ship.js:722, shipControl.js:120, net.js:631) ve görünüm değişiminde (net.js:617) çağrılır. Bu yüzden birleştirme **direk grubu başına ayrı** yapılır (`mastGroups[mi].objs`, shipModel.js:415): gövde, her direk grubu, halat donanımı ve delik grubu ayrı birleşik örgülerdir; hiçbir direk nesnesi gövde örgüsüne girmez. \"≤ 10 gölge atan\" gölge kaldırılarak değil birleştirilerek sağlanır: birleşik örgülerin hepsi gölge atar. Faz 2 §7.7 `rebuild`'e `disposeTree` ekliyor; birleşik örgüler bu yolla bırakılır.")

# ---------------- §3.2 ----------------
app("örnek rengiyle (`setColorAt`) verilir: tek malzeme.",
    " " + D + " Çarpan bütün kayalıklarda aynıdır (0,8): tek kararmış malzeme yeter, `setColorAt` gerekmez.")
appline("**Görsel risk.** D. **Uyum.** Faz 4: toplama durumu kayıtta kimlikle tutuluyor;",
    " " + D + " Faz 4 §6.1 kimliği `kabuk_<i>`'dir (i = details.js:254 döngü sırası; yer bulunamayan kabuk kurulmaz ama sırası kimlikte kalır, bu yüzden kimlik → örnek eşlemesi boşluklu olabilir). Faz 2 niyeti `shell:<i>` aynı i'yi kullanır.")

# ---------------- §3.3 ----------------
app("pop-in yerine.",
    " " + D + " Yüksek'te `dVis` sabit metre değildir: ekran boyutu kuralıdır (§3.6; karakterin çapı gerçek çizim tamponunda 1,5 pikselin altına inince gizlenir; 1080 satırda ~1 000 m, DPR 2'li 2160 satırda ~2 000 m; dürbünde FOV'la büyür). Sabit metre sınırları yalnız Orta/Düşük'tedir.")
app("`mixer.update(biriken rdt)` ile çağrılır: animasyon süresi kaymaz.",
    " " + D + " Yüksek'te katman sınırları ekran boyuna bağlıdır: ekranda ≥ 24 piksel boyundaki karakter her kare, 8–24 piksel 30 Hz, < 8 piksel 10 Hz; görüş konisi dışında güncelleme yok (görünmediği için fark yok). v0.4'te NPC'ler her kare canlandırılıyor (npcs.js:147-166); 40 m'deki karakter 1080 satırda ~35 piksel boyundadır ve 15 Hz basamaklanması görünür. Kazanç önce ölçülür: `npcs.update` içindeki karıştırıcı payı `_simProf` ile ayrılır.")
repline("**Kazanç.** J-01 düzeltmesi (görüş konisi ayıklaması geri)",
    "**Kazanç.** " + D + " Ölçülen: J-01 düzeltmesi limanda karakter çağrısını 213 → 146 indirir (ana 87 → 32, gölge 126 → 114); NPC gölgeleri kutuda kaldığı için taslağın \"NPC 159 → ~55\" tahmini tutmaz. Uzak liman karakterleri (110 çağrı, 74 K üçgen) P2.1 ile yalnız liman 5 km ötesindeyken (Kadim Tapınak, Kraken, Volkanik Dev) ya da görüş dışındayken sıfırlanır; açık deniz, fırtına ve deniz savaşında (liman 0,8–3 km) limana bakılınca P2.5 gerekir (2,9 km'de 149 → 143). P2.6 (gövde birleştirme) karakter başına her geçişte 5 çağrı kazandırır: limanda tahmini −50…−65. Animasyon katmanları NPC/balıkçı/uzak oyuncu güncellemesini azaltır (npcs.update 0,19–0,40 ms ölçüldü; karıştırıcı payı ölçülmedi).")
rep("`SkinnedMesh.computeBoundingSphere()` bağlama pozunda, yarıçap ×1,5;",
    "`SkinnedMesh.computeBoundingSphere()` " + D + " ilk güncel pozda (three r187 bu işlevi kemik matrisleriyle hesaplar ve sonucu önbelleğe alır; \"bağlama pozu\" değildir), yarıçap ×1,5;")
insafter("**Uyum.** Faz 3: animasyon ve görsel güncellemeler ÇİZİM evresine taşınıyor",
    "\n**" + D + " KayKit gövde birleştirme (P2.6).** Ölçüm (`inc_olcum3.json`): her karakterde 6 iskeletli parça (`*_ArmLeft`, `*_ArmRight`, `*_Body`, `*_Head`, `*_LegLeft`, `*_LegRight`) aynı 41 kemik nesnesini, aynı dokuyu (`kk.texture`), aynı `bindMatrix`'i ve aynı öznitelikleri (`normal, position, skinIndex, skinWeight, uv`) kullanıyor; parça başına ~420–1 230 üçgen. `Character.build` (character.js:455-462) bu altı parçayı `mergeGeometries` ile tek `SkinnedMesh`'e ve tek malzemeye indirir; görünürlüğü değişen şapka/kask/pelerin (character.js:462-463) ayrı kalır, `_bodyShape` kemiklere uygulandığı için etkilenmez (character.js:629-641). Ek kazanç: bugün her parça ayrı `Skeleton` nesnesi taşıdığı için kemik dokusu karakter başına 6 kez yükleniyor; birleşince 1. Görsel risk D (aynı doku, aynı kemikler). Kabul: 04_karakter, 16, 17, kamera_tarama b4 ve 48 görüntü farkı. Bu, J-01'in denetimde önerilen ikinci adımıdır (audit_J J-01 \"fix\"); taslak atlamıştı ve limandaki NPC gölge payını görüntü değiştirmeden düşürmenin tek yoludur.")

# ---------------- §3.4 ----------------
appline("**Ölçüm.** Mağara odasında **1 246 çağrı**",
    " " + D + " \"Hiçbiri görünmez\" hayvanlar için doğru değil: 7 yarasa odada yaşar (animals.js:758; bölge merkezi `CAVE.chamber`).")
app("Ağız ile 30 m arasındaki geçiş bölgesinde hiçbir şey gizlenmez (dışarısı görülebilir).",
    " " + D + " Üç düzeltme. (1) **Bölge testi y içerir**: `cave.insideFactor` yalnız xz'ye bakar (cave.js:215-227); kamera mağaranın üstündeki tepede, odanın xz izdüşümündeyken \"iç\" sayılırsa bütün dış dünya kaybolur. İç bölge = `insideFactor ≥ 1` **ve** kamera y < `CAVE.floor + CAVE.height + 1` (oyuncu için player.js:391'deki `y < 9` kuralının kamera karşılığı) **ve** kameranın üstündeki arazi yüksekliği > kamera y + 1. (2) **Gizleme türe göre değil konuma göre**: Yankı'nın 7 yarasası odada yaşar; \"hayvan kökleri gizlenir\" kuralı onları da gizlerdi. İç bölgedeyken yalnız konumu bölge dışında olan varlıklar gizlenir. (3) Mağara tabanı arazidir (geo.js:147-148 oyma): mağara izdüşümüne değen arazi karoları gizlenmez. Bölge kodu `PointLight`'lara dokunmaz: ışık görünürlüğü değişirse program yeniden derlenir (J-08); ışıklar P1.5 havuzundadır, bu yüzden P2.4, P1.5'ten sonra gelir.")
app("**Kazanç.** Mağara odasında ~1 246 → ≤ 250 çağrı ve gölge geçişi 0 (T5 ile); limanda −30.",
    " " + D + " Odadaki yarasalar ve oyuncu çizilmeye devam eder.")
app("bölge ayıklaması açık/kapalı görüntülerinin piksel farkı = 0 (§8.3).",
    " " + D + " Her noktada ağza dönük yön dahil 8 yön; ayrıca mağaranın üstündeki tepede (odanın izdüşümünde, dışarıda) 8 yönde fark 0 ve odada yarasa çağrısı > 0.")

# ---------------- §3.5 ----------------
app("yarıçapı < 0,25 m parçalar gölge atmaz (gemi parçaları, süsler).",
    " " + D + " İki kural kaldırıldı. (a) \"≤ 120 m hücre\": ek adalarda karar hücre **merkezine** uzaklıkla veriliyor (islands.js:412-413); 160 m hücrenin merkezi, kutuya değen bir hücrede bile 190 m'ye kadar uzakta olabilir (kutu ±55 m + yarım köşegen 113 m). Ayrıca gölge kamerası odaktan 120 m ışığa doğrudur (sky.js:340) ve düşük güneşte kutunun yer izi ~55/sin(yükseklik) m'ye uzar. 120 m kuralı oyuncunun yanındaki ağaçların gölgesini oyuncunun hücre içindeki konumuna göre söndürürdü. Hücre başına doğru sınır küresi verilince (islands.js:134 gibi `computeBoundingSphere()`) three.js'in gölge kamerası ayıklaması (three.module.js:9373) zaten yalnız kutuya değen hücreleri çizer; görüntü v0.4 ile birebir aynı kalır. Ek adaların 220 m kuralı da değiştirilmez. (b) \"Yarıçap < 0,25 m gölge atmaz\": 0,5 m çaplı bir kova ya da varilin gölgesi 2048 haritada ~9×9 texel'dir, görünür. Yüksek'te eşik bir texel (≈ 0,05 m; bugünkü karakter aksesuarı kuralı 0,07 m, character.js:480), Orta'da 0,15 m.")
app("Çıkışta `needsUpdate=true` ile aynı karede güncellenir.",
    " " + D + " Yalnız mağara iç bölgesi kalır. Su altında güneş zayıflatılmıyor (sky.js:336 yalnız `caveDark` uygular) ve deniz tabanı gölge alıyor; gölge haritası dondurulursa dalan oyuncunun ve geminin gölgesi tabanda yerinde kalır (görünür hata). Gece yönlü ışık ay ışığıdır, yoğunluğu ~0,95'tir (sky.js:335 `0.95·night·(1 − 0,5·fırtına)`) ve ay gölgeleri görünür; `sun.intensity < 0,15` koşulu derin gecede hiç tutmaz, yalnız alacakaranlıkta kısa bir an tutar. Taslak kodu yanlış okumuştu.")
repline("**Kazanç.** Limanda gölge geçişi 246 → ~110 çağrı",
    "**Kazanç.** " + D + " Limanda gölge geçişi 246 → ~175 (ölçülen: balıkçı −12, yengeç −20; tahmin: liman −40 T1 ile); P2.6 ile ~−45 daha (~130). NPC gölgesi kutuda olduğu için görüş konisi ayıklamasıyla düşmez; taslağın \"NPC −85\" kalemi ölçümle çürüdü. Üçgen: bitki −120 K (tahmin). Mağarada 175 çağrı / 290 K üçgen → 0; açık denizde gemi gölgesi 80 → ~10 (T1, birleştirerek; gölge kaldırılmadan).")
app("**Görsel risk.** D. Gölge kutusu ve çözünürlük Yüksek'te değişmez.",
    " " + D + " Texel hizalama ışık uzayında yapılır: gölge kamerasının `matrixWorldInverse` uzayındaki x/y texel boyuna yuvarlanır. Dünya konumunu yuvarlamak eğik ışıkta titremeyi gidermez. Gölge kenarı yarım texel'e kadar kayar; 48'de beklenen fark olarak işaretlenir.")

# ---------------- §3.6 ----------------
app("Ön ayar çarpanı Yüksek 1,0 / Orta 0,7 / Düşük 0,5.",
    " " + D + " `k` 1080 satıra sabitlenmez, gerçek çizim tamponu yüksekliğinden hesaplanır: `k = H_px / (2·tan(fov/2)) · 2 / 1,5` (DPR 2'li 1080p'de 2160 satır → k ≈ 2 060). Gece ışıyan malzemeli nesneler (fener ampulü, pencere, gemi feneri, `_lamp`, parlayan balık ve gök taşı) bloom yarıçapı yüzünden geometrik boyutlarından büyük görünür; ekran boyutu kesmesinden muaftır (ör. 0,33 m'lik liman ampulü kurala göre ~340 m'de kesilirdi, gece denizden 1–2 km'den görünür).")
app("Gök kubbesi ve okyanus kırpılmaz (camera.far değişmez: kubbe 4 km).",
    " " + D + " Ölçüm (`inc_olcum.json`, `inc_olcum2.json`): arazi ve büyük nesneler sis rengindeki **siluetleriyle** görüntüye katkı verir; gök kubbesi sisten etkilenmez (sky.js:88 `fog:false`) ve ufkun üstünde ufuk rengiyle aynı değildir (gradyan, sky.js:96). Fırtınada (d99 = 282 m) Kırlangıç'a 850 m ve 760 m'den bakışta arazi karoları kırpılınca: 1,15·d99'da 36–37 piksel > 8/255 (en çok 25–27/255), 1,5·d99'da 18–36, 2·d99'da 9–27, **3·d99'da 0–1 piksel** (en çok 4/255). Açık havada 2 450 m'den bakışta 1,15·d99 farkı en çok 5/255'tir. Karar: Yüksek'te arazi ve sınır küresi > 10 m nesneler `3·d99`'da, küçük nesneler `1,1·d99`'da kırpılır (arkalarında sisli arazi ya da deniz vardır, siluet üretmezler). Orta/Düşük'te 1,15·d99.")
app("fırtınada arazi ve ada hücreleri 280 m'de kesilir (09'daki fırtına ölçümü 697 K üçgen).",
    " " + D + " Bu sayılar ölçülmemiş tahmindir ve Yüksek'te fırtınada arazi kırpması 850 m'dedir. Gerçek kazanç P0'da kural sayfaya enjekte edilerek ölçülür (inceleme ölçümündeki gibi); bütçeler ona göre yazılır.")
app("kamera taramasında sınır geçişi görüntü farkı.",
    " " + D + " Kabul ölçütü ortalama değil **en çok fark**tır: ufuk bandında en çok fark ≤ 8/255. Taslağın \"≤ %0,5 piksel\" ölçütü 36 pikseldeki 27/255'lik siluet kaybını (görüntünün %0,016'sı) geçirirdi.")

# ---------------- §3.7–3.10 ----------------
app("Küçük türler (ot, eğrelti, çiçek, mantar, küçük kaya) 200–240 m arasında titreşimli kaybolur.",
    " " + D + " Gölge için mesafe kuralı yoktur (§3.5, 1a): hücre başına `computeBoundingSphere()` yeterlidir. Küçük türlerin 240 m sınırı çekirdek adalarda **yeni bir görünür değişikliktir** (v0.4'te çekirdek bitki her uzaklıkta çiziliyor; 0,7 m'lik ot 240 m'de 1080 satırda ~2,2 pikseldir). Yüksek'te sınır ekran boyutu kuralından türetilir; sabit 240 m yalnız Orta/Düşük'tedir. Ek adaların bugünkü 240 m kuralı (islands.js:412) değişmez.")
appline("2. *Benzetim katmanları*",
    " " + D + " `|| G.online` → en yakın oyuncu kuralı kalır (doğruluk ve co-op ölçeklenmesi). AI sıklık katmanları (10/4 Hz) **koşulludur**: ölçülen `animals.update` 0,06–0,40 ms/kare, co-op limanında fark yok (0,057 → 0,058 ms). 08d'nin dağınık düzeninde (oyuncular 3 adada) ev sahibinde `animals.update` > 0,5 ms ölçülürse uygulanır, değilse yapılmaz.")
appline("3. *Görünürlük/animasyon*: T3 katmanları; 120 m ötesi gizli",
    " " + D + " Bu öneri görünür içeriği FPS için kesiyordu ve kullanıcı kuralıyla çelişiyordu. Yüksek'te hayvan görünürlüğü ekran boyutu kuralıdır (domuz ~700 m, dürbünde FOV'la büyür); 120–160 m yalnız Orta/Düşük'tedir.")
appline("**Kazanç.** Limanda 333 → ~120 çağrı (birleştirme)",
    " " + D + " Mağarada odadaki yarasalar kalır; JS kazancı ölçülmemiş tahmindir. Yengeçlerin 40 çağrısı birleştirmeyle değil P2.1 ayıklamasıyla düşer (ölçüldü).")
appline("**Öneri.** Mevcut kural korunur (Faz 3 A6 bunu parçalı harekete çeviriyor).",
    " " + D + " Faz 7 nihai tasarımı (§7, Ç-12) politikayı Faz 8'e bıraktı ve imzayı önerdi: `lod.simTier(e, ctx) → {tier, thinkHz, moveStep, animHz, perceiveHz}`, `ctx = {d, görünür, savaşta, boss, hedefli, saldırıda}`; T0 hedefli/saldırıda/boss/≤ 45 m (düşünme 6 Hz, her adım, animasyon her kare), T1 45–90 m (3 Hz, 2 adımda bir, 30 Hz), T2 90–220 m (1 Hz, 0,25 sn, 10 Hz; görünmüyorsa donuk). Faz 7 değişmezleri (F-08, `attack` T0, C-16, uzak oyuncu mesafesi), `aiQueue` (kare başına ≤ 24 `segmentQuery`), `enemies.stats` ve `lod.simTier(e)` uyarlayıcısını teslim eder. Faz 8 bu tabloyu aynen `lod.js`'e yazar, `ctx.görünür`'ü P2.1/P2.5 ayıklamasından verir ve `DK.lod.override(fn)` test kancasını sağlar. Taslaktaki \"> 30 m görünmeyen düşman 4 Hz\" kuralı Faz 7'nin T2 \"görünmüyorsa donuk\" kuralıyla değiştirildi. Not: v0.4'te hedefsiz düşman > 90 m'de 4 Hz hem hareket hem animasyon alıyor (enemies.js:1601-1606); T2'nin 10 Hz animasyonu bundan iyidir, Yüksek'te v0.4'ün altına inilmez.")
appline("**Öneri.** SoA (`Float32Array` konum/hız/ömür/renk/boy) halka tampon;",
    " " + D + " Kare başına tek yükleme Faz 3 A2b'nin işidir (Faz 3 C-14, effects.js:122-146 → ÇİZİM); Faz 8 bunu yeniden planlamaz, yalnız SoA, O(1) silme, `setDrawRange(0, n)` ve `addUpdateRange` ekler.")
appline("Ayrıntı §5. Özet: ada/hayvan/düşman/kese/gemi bırakma testleri tabanda 0/0;",
    " " + D + " `Ship._build`'in eski modeli yalnız sahneden kaldırması (ship.js:57-58) Faz 2 §7.7'de kapanır (B-6); Faz 8 bunu yeniden planlamaz, 50 onu da döngüye alır.")

# ---------------- §4.2 ----------------
repline("| Gölge atanlar |", "| Gölge atanlar | — | Yarıçap < 0,15 m atmaz | " + D + " Yarıçap < 0,05 m (≈ 1 texel) atmaz | Kurulumda |")
repline("| Küçük bitki/süs mesafesi |", "| Küçük bitki/süs mesafesi | 140 m | 200 m | " + D + " Ekran boyutu kuralı (ek adalarda bugünkü 240 m korunur) | Anında (hücre LOD) |")
repline("| Karakter/hayvan görünürlük mesafesi |", "| Karakter/hayvan görünürlük mesafesi | 90 / 70 m | 140 / 110 m | " + D + " Ekran boyutu kuralı (sabit sınır yok; dürbünde FOV'la) | Anında |")
repline("| Animasyon katmanları (tam / 15 Hz / 4 Hz sınırları) |", "| Animasyon katmanları | 20 / 60 m (tam / 15 Hz / 4 Hz) | 30 / 90 m | " + D + " Ekran boyu ≥ 24 px her kare, 8–24 px 30 Hz, < 8 px 10 Hz; görüş dışında yok | Anında |")
repline("| Sise bağlı kesme (d99) |", "| Sise bağlı kesme (d99) | 1,15·d99 | 1,15·d99 | " + D + " Küçük nesne 1,1·d99; arazi ve r > 10 m nesne 3·d99 | Anında |")
repline("| Nokta ışığı havuzu |", "| Nokta ışığı havuzu | 2 | 4 | " + D + " 6 (lamba ≤ 4) | Yeniden başlatma (program sayısı sabit kalsın) |")
repline("| FPS sınırı |", "| FPS sınırı | " + D + " 60 (30 isteğe bağlı pil tasarrufu) | 60 | Sınırsız | Anında (biriktirmeli sınırlayıcı, J-12) |")
appline("co-op'ta ev sahibinin ön ayarı oyun sonucunu değiştirmemeli.",
    "\n\n" + D + " Yüksek sütunundaki her satır v0.4 görüntüsünü korur; görünür ayrıntıyı azaltan satırlar yalnız Orta/Düşük'tedir ve panelde açıkça yazılır (ör. Orta'da gölge menzili 55 → 40 m kısalır: daha keskin ama daha kısa gölge). Düşük'ün amacı zayıf donanımda 60 FPS'tir; bu yüzden Düşük'te FPS sınırı 30 değil 60'tır (master_prompt: \"60 FPS için sürdürülebilir performans\").")

# ---------------- §4.3 ----------------
appline("- **Ayar şeması.**", " " + D + " Yeni anahtarlar `DEFAULT_SETTINGS`'e türleriyle eklenir; Faz 4'ün içe aktarma doğrulayıcısı yalnız bu anahtarları alır; `preset ∈ {dusuk, orta, yuksek, ozel}` doğrulanır.")
appline("- **Dinamik çözünürlük.**", " " + D + " \"Takılma olmaz\" ölçülmemiş bir iddiadır: `composer.setSize` hedefleri yeniden ayırır. Gerçek GPU'da ölçülür (51'de yalnız ölçek mantığı sınanır); takılma görülürse hedefler tam boyutta ayrılıp küçük bölgeye `setViewport` ile çizilir.")
appline("- **İlk açılışta öneri (otomatik değil).**", " " + D + " SwiftShader'da zamanlayıcı uzantısı var (ölçüldü), ama süre yazılımsaldır; çizici adı yazılımsalsa öneri verilmez.")

# ---------------- §5.4 ----------------
rep("Oyuncu o sırada Kadim Tapınak'ta (~8,2 km; ayrı denemede limanda 7 778 m).",
    "Oyuncu o sırada Kadim Tapınak'ta: " + D + " (2 310, 7 400) (`f8_09tani_2.json`), Ateş Dağı'na **~9,9 km** (taslakta \"~8,2 km\"); ayrı denemede limanda 7 778 m.")
appline("3. `checkT` 1/60'lık alt adımlarla azalır",
    " " + D + " Kapalı biçim `0,5 − 30·(1/60)` kayan noktada tam 0'dır; +1,04·10⁻¹⁶ **30 ardışık çıkarmanın** birikmiş yuvarlamasıdır (`/tmp/tasarim_y/faz8_inceleme/fp.mjs`). 09'un tek `page.evaluate` içindeki boss bölümünde her döngü 42 alt adımdır (sim(0,5) 30 + sim(0,2) 12); 42 mod 31 = 11 olduğundan 9 döngünün (Kraken ×3, Taş Muhafız ×3, Volkanik Dev ×3) en çok biri denetimi atlatır. Rastgele başlangıç evresinde (100 000 Node benzetimi): Volkanik Dev'in ısınma döngüsünün yaşaması (dG 0) %3,3; sonraki iki döngüden birinin yaşaması (dG 5) %6,5; hiçbirinin yaşamaması (sınama yapılmamış) %90,2. Taban koşusundaki FAIL bu %6,5'lik durumdur.")
appline("**Sonuç: sızıntı değil; testin ölçüm kusuru.**",
    " " + D + " Kraken `site`'ta değil `G.ship`'in 40 m yanında doğar (bosses.js:148-150); 09'da gemi Kadim Tapınak'ın açığına (I.x, I.z + I.r + 60) park edildiği için Kraken oyuncudan ~640–720 m uzakta kalır ve aynı kurala takılır (`f8_09tani_2.json`: Kraken'in üç döngüsünde hiç geometri yüklenmedi). Aynı nedenle 09'un 'boss_kraken' performans ölçümü (09:18, `DK.sim(2)` = 120 alt adım, en az 3 denetim) boss'suzdur: taban koşusunda 317 çağrı = 'firtina' 317. `bossAlive:true` yanıltıcıdır, çünkü `_clear()` `dispose` eder ama `alive`'ı değiştirmez (bosses.js:1054, :126-134). Taş Muhafız `BOSS_SITES`'ta olmadığından oyuncunun yanında doğar (bosses.js:1058) ve her döngüde ölçülür (`f8_09tani_2.json`: ısınma döngüsünde 8 Orc geometrisi). Kod okumasına göre Volkanik Dev'in kendi kaynakları (halka, çekirdek küresi, şok dalgası, klon malzemeler, kemik dokusu) `dispose`'ta bırakılıyor (bosses.js:126-134, :779-785); gerçek sızıntılar B-1 ve B-2'dir.")
rep("**dG = 0, kalan kimlik yok** (GEÇTİ) |",
    "**dG = 0, kalan kimlik yok** (GEÇTİ). " + D + " C aynı sayfada B'den sonra koştu: demon geometrisi B'de yüklenmişti ve kamera boss'a bakmıyordu (`gOlcum` dört döngüde 751 sabit). Yani C, ısınmanın işe yaradığını ve boss'un kendi prosedürel parçalarının bırakıldığını sınamadı |")
appline("- *Test (09 ve 45/50)*:",
    " " + D + " Üç ek: (1) kamera boss'a çevrilir ve ölçüm karesinden önce boss'un bütün örgüleri bir kez görünür yapılıp çizilir (halka ve şok dalgası `visible=false` doğar, bosses.js:66, :780; çizilmeyen geometri GPU'ya yüklenmez ve bırakılması sınanmaz); (2) GPU yüklemesinden bağımsız **yaratılış kaydı** (§1.3): ısınmadan sonra yaratılan geometri ve malzemelerden, döngü sonunda sahneden erişilemeyen ve bırakılmamış olan = 0; (3) 09'un 'boss_kraken' performans adımı da boss'u oyuncunun gemisinin yanında ve `checkT` donukken ölçer, `bossAlive` yerine `DK.bosses.active === b` yazar.")
appline("Düzeltilmiş döngünün özü (09/50 için; `perf_araclari.js` kimlik izleyicisiyle):", " " + D + " Kamera, gizli parçalar ve yaratılış kaydı eklendi; taslaktaki kullanılmayan `once` değişkeni kaldırıldı; `checkT` `finally` içinde geri yüklenir.")
i = s.index("```js\nconst p = DK.G.player, M = () => { DK.post.render(); };")
j = s.index("\n```", i + 5)
s = s[:i] + """```js
// (inceleme düzeltmesi) kamera boss'a döner, gizli doğan parçalar bir kez çizilir, yaratılış kaydı GPU'dan bağımsız sızıntıyı yakalar
const p = DK.G.player, cam = DK.engine.camera;
const site = { id: bid, x: p.pos.x + 30, z: p.pos.z };          // 650 m kuralının içinde
const bak = () => { cam.position.set(p.pos.x - 6, p.pos.y + 4, p.pos.z); cam.lookAt(site.x, p.pos.y + 3, site.z); cam.updateMatrixWorld(true); };
const hepsiniCiz = (b) => {                                     // visible=false doğan halka/şok dalgası da bir kez GPU'ya gitsin
  const gizli = [];
  for (const o of [...b.parts, ...b.rings, ...(b.attached || [])]) o.traverse((m) => { if (m.isMesh && !m.visible) { m.visible = true; gizli.push(m); } });
  bak(); DK.post.render(); gizli.forEach((m) => { m.visible = false; });
};
const eskiCheckT = DK.bosses.checkT; DK.bosses.checkT = 1e9;     // uzaklık denetimi döngü boyunca çalışmaz
let ref = null;
try {
  for (let k = 0; k < 4; k++) {
    if (k === 1) _yaratilisKaydi.basla();                         // ısınmadan sonra yaratılan geometri/malzeme izlenir
    const b = DK.bosses.spawn(bid, site); DK.sim(0.5);
    if (DK.bosses.active !== b) throw new Error('boss ölçümden önce kalktı');   // sessizce geçmesin
    hepsiniCiz(b);
    DK.bosses._clear(); DK.sim(0.2); DK.post.render();
    if (k === 0) ref = _geoSnap();                               // ısınma: paylaşımlı demon geometrisi burada yüklenir
  }
} finally { DK.bosses.checkT = eskiCheckT; }
const sizanGPU = _geoDiff(ref).filter((g) => !g.sahnede && !PAYLASIMLI.has(g.geo));   // = [] olmalı
const sizanCPU = _yaratilisKaydi.bitir().filter((r) => !r.birakildi && !r.sahnede);    // = [] olmalı""" + s[j:]

# ---------------- §5.5 ----------------
rep("| 08f: 5 katıl/ayrıl döngüsünde doku ve malzeme kimlik farkı boş |",
    "| 08f: 5 katıl/ayrıl döngüsünde doku ve malzeme kimlik farkı boş. " + D + " Düzeltme Faz 5'in yeniden yazdığı `RemotePlayer`'a uygulanır |")
insafter("| B-4 | Sayaç tabanlı sızıntı testleri ilgisiz ilk yüklemelere duyarlı |",
    "| B-6 | " + D + " `Ship._build` eski modeli yalnız sahneden kaldırıyor (ship.js:57-58); `rebuild` direk onarımında ve görünüm değişiminde çağrılır | Kod okuması; Faz 2 §7.7 `rebuild`'e `disposeTree` ekliyor | Faz 2'de yapılır, Faz 8'de yeniden planlanmaz | 50: direk devril/onar ×3 döngüsünde kimlik farkı boş |")

# ---------------- §6 ----------------
rep("ANGLE/D3D11'de program başına onlarca ms beklenir → yüzlerce ms donma).",
    "ANGLE/D3D11'de program başına onlarca ms beklenir → yüzlerce ms donma; " + D + " bu ölçülmemiş bir beklentidir, kanıt değildir).")
app("meşale 8'e çıkarıyor (J-07).", " " + D + " İnceleme ölçümünde de görünür nokta ışığı 7 (`inc_olcum2.json`).")
rep("oturum boyunca sabit **N nokta ışığı** (Yüksek/Orta 4, Düşük 2; değişimi yeniden başlatma ister)",
    "oturum boyunca sabit **N nokta ışığı** (" + D + " Yüksek 6, Orta 4, Düşük 2; değişimi yeniden başlatma ister)")
appline("2. **Sabit ışık sayısı (J-07, J-08).**",
    " " + D + " Ek kurallar: (a) lamba kategorisi en çok 4 yuva alır (Faz 6 havuz 4 kuralı); (b) Faz 5'in uzak oyuncu meşalesi (\"≤ 30 m'de gerçek ışık\", Faz 5 §2 satır 3) ayrı `PointLight` olarak değil bu havuzun adayı olarak eklenir; Faz 5, P1.5'ten önce uygulanırsa uzak meşale açılıp kapandıkça yeniden derleme olur, bu yüzden Faz 5'in uzak meşalesi P1.5'e kadar yalnız parlama sprite'ıyla gösterilir; (c) Faz 6'nın \"Karanlık\" evresi (`storyFx{k:'karanlik'}`: meşaleler ve havuz lambaları söner, Ruh Feneri sönmez) için `lights.suppress(kategori, sn, istisna)`; (d) yuva el değiştirirken yoğunluk 0,25 sn'de söner/yanar (v0.4 havuzu anında değiştiriyor, islands.js:1137-1145); (e) bölge ayıklaması ve LOD ışıkların `visible`'ına hiç dokunmaz.")
appline("3. **İçerik ön ısıtması (J-17).**",
    " " + D + " Isıtma grubundaki örnekler oyundaki nesne türüyle aynı olmalı: ada parçaları `InstancedMesh` (USE_INSTANCING), karakterler `SkinnedMesh`, aynı `castShadow/receiveShadow`, aynı `rimAll`/`nearFade` kancaları; aksi hâlde başka program varyantı derlenir. Bu ortamda `KHR_parallel_shader_compile` yoktur (ölçüldü): `compileAsync` eşzamanlı derler, maliyet yalnız yer değiştirir; bu yüzden (b) SwiftShader'da 13_donma P01'i kötüleştirebilir, kabulü kurulum karesi ile ilk görüş karesini birlikte ölçer.")
appline("5. **Gereksiz çizim (J-19).**",
    " " + D + " Kare tutma yalnız benzetimin durduğu tek oyunculu duraklatmada (`G.paused`, game.js:192; görüntü zaten durağan, fark yok) ve opak tam ekran panellerde uygulanır. Yarı saydam `#modal` (arka planın ~%45'i görünür) açıkken, özellikle çevrimiçide dünya akmaya devam ettiği için çizim sürer (2 FPS basamaklanması görünür olurdu). Ana menünün 30 FPS sınırı yalnız Orta/Düşük ön ayarında ya da sekme arka plandayken uygulanır; Yüksek'te menü v0.4 gibi akıcı kalır.")
repline("| Aynı ilk görüş karesinin süresi / ikinci kare |",
    "| Aynı ilk görüş karesinin süresi / ikinci kare | 4–20× | " + D + " Bilgi amaçlı; geçme kapısı \"yeni program 0\". Oran ≤ 3× **ya da** fark ≤ 30 ms. Gerekçe: taslağın kendi ölçümünde yeni programsız olayda da oran 2,3× çıktı (Efekt Düşük → Yüksek 14/6 ms) |")

# ---------------- §7 ----------------
appline("Kurallar: her adım ayrı bir commit;",
    " " + D + " Her kayıt master_prompt §15'in alanlarını taşır: tür (`tarayıcı`, `tarayıcı+benzetim`, `Node benzetimi`, `gerçek GPU`), tekrar üretme komutu, ortam (çizici dizgesi), ilgili dosya, önce/sonra; gerçek tarayıcı testi benzetim gibi gösterilmez.")
repline("| **P0.5** |",
    "| **P0.5** | Oyun içi performans katmanı ve tur | Yeni `js/core/perf.js` (`?perf=1` ya da Ayarlar → \"Performans katmanı\"): FPS p50/p95/p99, kare süresi histogramı, çağrı/üçgen/program, `EXT_disjoint_timer_query_webgl2` ile GPU ms (ana/gölge/son işleme; uzantı yoksa \"ölçülemedi\", çizici yazılımsalsa \"yazılımsal\" etiketi), JS güncelleme ms; " + D + " \"Performans turu\" düğmesi 9 sahneyi kayıtsız geçici tek oyunculu oturumda gezip JSON üretir ve indirir (üretimde `window.DK` olmadan çalışır, çevrimiçide kapalı; test kipinde `DK.perf.tour()` adıyla da açık; K8-12). `js/ui/hud.js:282` FPS yazısı buradan beslenir | — | 45'te tur SwiftShader'da da koşar (yalnız sayılar); 53_test_kipi: üretimde `DK` yokken düğme çalışır | 1,5 |")
insafter("| **P0.6** |",
    "| **P0.7** | " + D + " Belirlenimli ölçüm ve görüntü kipi | `tests/lib/perf_araclari.js` + test kipi kancası: oturumdan önce tohumlanmış `Math.random`; görsel saatlerin dondurulması (`ocean`/`sky` `uTime`, islands.js:1136 ve details.js:507'deki `performance.now()` titreşimleri); sahne kurulumu ve ölçüm tek `page.evaluate` içinde `DK.sim` ile; arazi kuyruğu boşalana dek bekleme; \"aynı kod iki kez\" gürültü tabanı | Taban: 3 koşuda sahne başına tarama medyanı yayılımı (bugün Kırlangıç %9, açık deniz %9, deniz savaşı %28) → ≤ %3; aynı kodda görüntü farkı 0 | 45, 48 | 1 |")
repline("| **P1.5** |",
    "| **P1.5** | Sabit ışık havuzu (J-07, J-08) | Yeni `js/core/lights.js` (`configure(n)`, `request(owner, pos, color, intensity, range, prio, kategori)`, `suppress(kategori, sn, istisna)`, `update(cam)`); `islands.js:236-243` havuzu buraya taşınır (`_updateLamps` :1124 aday verir; lamba kategorisi ≤ 4 yuva); `weatherfx.js:115` yıldırım, `cave.js:117-123`, `character.js:328-341` meşale ışığı kaldırılır, `player.js:127-138` `_syncTorch` yuva ister; " + D + " Faz 5 uzak oyuncu meşalesi ve Faz 6 `storyFx karanlik` bu API'yi kullanır; yuva değişiminde 0,25 sn geçiş | " + D + " Nokta ışığı 7–8 → sabit 6 (Yüksek) / 4 (Orta) / 2 (Düşük); meşale ilk yakışta yeni program 17 → 0; Yüksek'te gece kasabada (4 fener + meşale + yıldırım) v0.4'e göre görüntü farkı 0 | 46, 17_kamera_kararma (mağara K07), 34 (Faz 6 ışık havuzu) | 1,5 |")
repline("| **P2.1** |",
    "| **P2.1** | Karakterlerde görüş konisi ayıklaması (J-01) | `js/player/character.js:458, :967`, `js/core/kk.js:93`: `frustumCulled=true`; iskeletli örgülere " + D + " ilk güncel pozda `SkinnedMesh.computeBoundingSphere()` × 1,5 (three r187 kemik matrisleriyle hesaplar ve önbelleğe alır); ragdoll sırasında `frustumCulled=false` | " + D + " Ölçülen: limanda 09 görünümü karakter 213 → ≤ 150 (ölçüm 146), yengeç 40 → 0 (`Animated`, character.js:967); sırt dönükken karakterlerin **ana** çağrısı oyuncu dışında 0, **gölge** çağrısı kutudakiler kadar kalır (ölçüm 114); limanın 5 km ötesindeki sahnelerde (Kadim Tapınak, Kraken, Volkanik Dev) uzak liman karakteri 0; 5 km içi P2.5'e kalır | 47, kamera_tarama b4, 17_kamera_kararma, 04_karakter | 1 |")
repline("| **P2.2** |",
    "| **P2.2** | `lod.js`: görünürlük + animasyon katmanları | Yeni `js/core/lod.js`; `npcs.js:147-166`, `details.js:543-551` (balıkçı), `net.js:87-124` (uzak oyuncu; Faz 5 sonrası sınıf), `animals.js:788-812`; " + D + " düşman için `enemies.js`'in LOD bölümüne dokunulmaz: Faz 7 uyarlayıcısı `lod.simTier(e)`'yi çağırır, politika (Faz 7 nihai §7 tablosu) `lod.js`'tedir, `ctx.görünür` buradan verilir, `DK.lod.override(fn)` kancası; Faz 3'ün `render(alpha, rdt)` evresine kanca; Yüksek'te katmanlar ekran boyuna bağlı (§3.3) | Kasaba (Tuz Pazarı) NPC 307 → ≤ 120 (tahmin, P2.5 ile birlikte); " + D + " `npcs.update` içindeki karıştırıcı payı önce ölçülür, hedef ölçüme göre yazılır | 47, 05_dusman_ai, 16_kosu_poz_ganimet | 2 |")
repline("| **P2.3** |",
    "| **P2.3** | Gölge: budama, görünmezken güncellememe, texel hizalama | `js/world/sky.js:136-145, :333-341` (texel hizalama ışık uzayında); `game.js` `_env` (" + D + " yalnız mağara iç bölgesi bayrağı; su altı ve gece güncellemesi sürer); gölge atan yarıçap kuralı Yüksek'te ≈ 1 texel (0,05 m), Orta'da 0,15 m (character.js:480 deseni) | " + D + " Limanda gölge 246 → ≤ 200 (P2.6 ile ≤ 160) çağrı, üçgen 369 K → ≤ 250 K; mağarada gölge 175 → 0; su altında ve gecede v0.4 ile görüntü farkı 0 | 47, 49, 17_kamera_kararma, 14_deniz_ekipmani (dalış) | 1 |")
repline("| **P2.4** |",
    "| **P2.4** | Bölge (mağara) ayıklaması | Yeni `js/world/zones.js`; `js/world/cave.js` (mağara parçalarını tek gruba topla: :50, :88, :101, :169; `insideFactor` :215-227); `game.js` `_env`'de kamera bölgesi; " + D + " iç bölge testi y içerir, gizleme türe göre değil konuma göre (odadaki 7 yarasa kalır), mağara izdüşümündeki arazi karoları kalır, `PointLight`'lara dokunulmaz (P1.5'ten sonra) | Mağara odası 1 246 / tarama en çok 1 112–1 166 → ≤ 250 (yarasalar dahil); limanda mağara içi 30 → 0; " + D + " mağaranın üstündeki tepede dış dünya görüntü farkı 0 | 49 | 1,5 |")
repline("| **P2.5** |",
    "| **P2.5** | Ekran boyutu + sis mesafesi ayıklaması (J-13) | `lod.js` (`dMax = min(k·r·çarpan, pay·d99)`; " + D + " `k` gerçek çizim tamponu yüksekliğinden ve dürbünde FOV'dan; ışıyan nesneler gece muaf; Yüksek'te arazi ve r > 10 m nesnelerde pay 3, küçük nesnelerde 1,1); `islands.js:404-415` `_cellLod`; `terrain.js:258-265` `_wantSeg` (halka kırpma) | " + D + " Hedefler P0'da kuralın sayfaya enjekte edildiği deneyle yeniden yazılır (taslaktaki 962–980 → ≤ 400, 1 133 → ≤ 650, fırtınada −%30 ölçülmemiş tahmindi); ufuk bandında en çok fark ≤ 8/255 | 47 | 1,5 |\n"
    "| **P2.6** | " + D + " KayKit gövde parçalarının birleştirilmesi (J-01 düzeltmesinin ikinci adımı) | `js/player/character.js:455-462` (`Character.build`: 6 iskeletli parça → `mergeGeometries` → tek `SkinnedMesh`, tek malzeme, tek `Skeleton`; görünürlüğü değişen şapka/kask/pelerin ayrı kalır), `_disposeModel` (492-500) | Karakter başına her geçişte gövde 6 → 1 çağrı, kemik dokusu yüklemesi 6 → 1; limanda 09 görünümü tahmini −50…−65 (45 ile ölçülür) | 04_karakter, 16, 17, kamera_tarama b4, 48 (görüntü farkı) | 1,5 |")
repline("| **P3.4** |",
    "| **P3.4** | Gemi birleştirme (J-04) | `js/ship/shipModel.js:239-534` (statik parçalar malzeme başına; " + D + " **direk grubu başına ayrı** — `mastGroups[mi].objs`, shipModel.js:415 —, halat donanımı ve delik grubu ayrı; toplar `InstancedMesh`; `:524` gölge kuralı: birleşik örgülerin hepsi gölge atar); `js/ship/ship.js:56-74` (`_build`/`rebuild`; Faz 2 §7.7 `disposeTree`), `:119-142` (`_applyDamageVisuals` direk nesnelerini çalışma anında pivota taşır), `:584-665` (`_animate` yalnız ayrık parçalar) | Sloop 80 → ≤ 20 örgü; açık denizde gemi 161 → ≤ 40 çağrı; direk devrilmesi ve onarımında görüntü farkı 0 | 48, 03_fizik_*, 14_deniz_ekipmani, 15_iskele_kamera, coop 06b | 2,5 |")
repline("| **P4.1** |",
    "| **P4.1** | Hayvan benzetim katmanları | `js/wildlife/animals.js:788-812`: `|| G.online` yerine en yakın oyuncu (zorunlu, 0,25 gün); " + D + " AI sıklık katmanları **koşullu**: 08d'nin dağınık düzeninde ev sahibinde `animals.update` > 0,5 ms ölçülürse (bugün co-op limanında 0,058 ms) | Co-op ev sahibi 08d: uzak adadaki oyuncunun hayvanları güncellenir, kimsenin 250 m'sinde olmayanlar donar | 47, 08e | 0,25 + 0,75 koşullu |")
repline("| **P4.3** |",
    "| **P4.3** | `crowd` uzamsal ızgara (J-26) | `js/game/crowd.js:13-45` (8 m ızgara, dizi yeniden kullanımı); " + D + " `crowd` Faz 3'te ADIM evresinde kalır (Faz 3 §3: \"crowd | alt adım | ADIM\"); taslağın \"kare başına bir kez\" önerisi itişmeyi kare hızına bağlardı ve kaldırıldı. **Koşullu**: `_simProf`'ta `crowd` > 0,1 ms/adım ölçülürse (limanda ~40 ajan ≈ 800 çift; hiç ölçülmedi) | Çift denetimi O(n²) → O(n); 03_fizik_dt sonuçları değişmez | 04_karakter, 16, 03_fizik_dt | 0,5 koşullu |")
repline("| **P4.4** |",
    "| **P4.4** | Parçacık SoA (J-20) | `js/game/effects.js:9-150` (" + D + " kare başına tek yükleme Faz 3 A2b'de yapılır; burada SoA, O(1) silme, `setDrawRange(0, n)`, `addUpdateRange`) | Parçacık yokken yükleme 0; fırtınada `effects` ayırma ~0 | 46 (görüntü), 13 | 1 |")
insafter("| **P5.2** |",
    "| **P5.3** | " + D + " Ada kurulumundaki bölünemeyen adım (J-29) | `js/world/islands.js` `_npc` (528-543): NPC kurulumu klon / atlas boyama (`kk.texture`) / aksesuar olarak üç alt adıma bölünür; `PARTS` ve karakter şablonları P5.1 ısıtmasında hazırlanır | 13_donma P01 en uzun ada karesi 10,5 → ≤ 5 ms (§8.2'deki hedefin uygulama adımı; taslakta hedef vardı, adım yoktu) | 13_donma P01/P02, 34 | 1 |\n"
    "| **P5.4** | " + D + " Harita ayrıntı karosu (J-18) | `js/ui/mapArt.js:99-108` (`paint`, `getImageData` :102): parşömen zemini ve boyama arazi işçisine ya da `OffscreenCanvas`'a taşınır, sonuç `ImageBitmap` olarak aktarılır. mapArt.js:109-112'deki not, ana iş parçacığında denenen CPU tuvalinin bu ortamda belleği iki katına çıkardığını söylüyor; kalıcı çözüm işçidir | Karo geçişinde ana iş parçacığında > 16 ms görev 0 (CDP uzun görev kaydı); 04_karakter bellek tepesi ≤ 1,2 GB | 13_donma'ya yeni P adımı, 04_karakter | 1,5 |")
repline("| **P6.1** |",
    "| **P6.1** | Ön ayar tablosu ve panel | Yeni `js/core/quality.js`; `js/core/settings.js:10-71` (" + D + " `preset`, `dynRes`, `dprCap` `DEFAULT_SETTINGS`'e türleriyle; Faz 4 içe aktarma doğrulayıcısı); `js/ui/settingsPanel.js:33-42` (görünür ayrıntıyı azaltan Orta/Düşük satırları panelde açıkça yazılır) | Düşük/Orta/Yüksek değerleri modüllerde (51); dışa aktarılıp içe aktarılan ayar dosyasında yeni anahtarlar korunur | 51, 06_arayuz_960, 23–26 (Faz 4 içe aktarma) | 1,5 |")
repline("Toplam ≈ **39 gün**",
    D + " Toplam ≈ **43 gün** (tek geliştirici; koşullu adımlarla ≈ 44): P0 6, P1 6, P2 8,5, P3 10,5, P4 3,25 (+1,25 koşullu), P5 4,5, P6 2,5, P7 1,5. P3.4 (gemi), P3.5 (bitki hücreleri) ve P2.4 (mağara bölgesi) en riskli; P0 en önce.")

i = s.index("### 7.4 Limanda beklenen kazancın hesabı")
j = s.index("## 8. Test planı")
s = s[:i] + """### 7.4 Limanda beklenen kazancın hesabı (09 görünümü) """ + D + """

Taslağın tablosundaki P2 kalemleri ölçülmemişti ve ölçümle çürüdü (NPC gölgesi kutuda). Aşağıdaki tablo ölçülen ve tahmin edilen kalemleri ayırır.

| Aşama | Grup | Önce | Sonra | Fark | Dayanak |
|---|---|---|---|---|---|
| P2.1 | Karakterler (9 NPC + 2 balıkçı + oyuncu; ana + gölge) | 213 | 146 | −67 | **Ölçüldü** (`inc_olcum.json`) |
| P2.1 | Yengeçler (5; ana + gölge) | 40 | 0 | −40 | **Ölçüldü** (`inc_olcum2.json`) |
| P2.4 | Mağara içi (tepenin içinde) | 30 | 0 | −30 | Grup ölçümü (§2.2) |
| P2.5 | Uzak süs/kabuk (ekran boyutu) | — | — | ~−30 | Tahmin |
| **P2 sonrası (P2.6'sız)** | | **1 026** | **~860** | **−167** | |
| P2.6 | Karakter gövdeleri (görünen + kutudaki karakterlerde 6 → 1) | — | — | −50…−65 | Tahmin (parça sayımı) |
| **P2 sonrası (P2.6 ile)** | | | **~800** | | |
| P3.1 | Hayvanlar (domuz 140, papağan 81, maymun 72) | 293 | ~115 | −178 | Tahmin (örgü sayımı: 7×6 + 9×4 + 6×6) |
| P3.2 | Statik süsler (mağara hariç) + kabuklar | 193 | ~42 | −151 | Tahmin |
| P3.3 | Liman yapıları | 108 | ~45 | −63 | Tahmin |
| P3.4 | Gemi + kayık gölgesi | 14 | ~4 | −10 | Tahmin |
| P3.5 | Çekirdek bitki (hücre artışı) | 36 | ~50 | +14 | Tahmin |
| **P3 sonrası** | | | **~410–470** | | |

Bütçe: P2 sonrası ≤ 900 (P2.6 ile ≤ 840), P3 sonrası ≤ 550, son ≤ 500. Pay taslağınkinden dardır (taslakta ~%25); Faz 6/7 içerikleri bu sayıları artıracağı için bütçeler Faz 7 sonu tabanında yeniden yazılır. Üçgen: P3.5 ve P2.3 ile 1,25 M → ~0,9 M (bitki −220 K, hayvan −30 K; tahmin). Taslaktaki "NPC gölgesi −40 K üçgen" kalemi ölçümle desteklenmiyor ve çıkarıldı.
""" + s[j:]

# ---------------- §8.1 ----------------
repline("| **45_perf_matris.js** |",
    "| **45_perf_matris.js** | 9 sahne + menü (§1.4 tarifleri), 8 yön tarama, kategori dökümü, `_simProf`, ilk kare | `tests/lib/perf_araclari.js`; bütçeler `tests/perf_butce.json` (§8.4); JSON çıktı `tests/out/perf/`; " + D + " P0.7 belirlenim kipinde | Her sahnede çağrı (medyan ve en çok), üçgen, gölge çağrısı, geometri, doku, program bütçe içinde; aynı kodda iki koşu arasında medyan çağrı farkı ≤ %3 (" + D + " taslağın tabanı bunu tutmuyordu: Kırlangıç %9, açık deniz %9, deniz savaşı %28; P0.7 önkoşul). JS ms `ortamDuyarli` ve bilgi amaçlıdır; kapı aynı koşuda önce/sonra oranı ≤ 1,0 (iki koşunun en iyisi) |")
rep("ada/düşman/boss/efekt ilk görüşünde yeni program 0 ve ilk kare ≤ 2× ikinci kare;",
    "ada/düşman/boss/efekt ilk görüşünde yeni program 0 (kapı; " + D + " ilk kare / ikinci kare bilgi amaçlı: ≤ 3× ya da ≤ +30 ms);")
repline("| **47_lod_gorunurluk.js** |",
    "| **47_lod_gorunurluk.js** | J-01, T3, T5 budama, T6 (ekran boyutu + d99), animasyon katmanları | NPC'lere sırt dönük kamera; 1,5 km ve 2,9 km uzaktan limana bakış; 7 km'de liman; eşik çevresinde 20 m ileri-geri yürüyüş (titreme sayacı); dürbün açıkken uzak gemi; fırtına/sis; " + D + " gece limanına denizden 1 km'den bakış (fenerler); Yüksek'te 640×360 ve 1920×1080 çizim tamponu | " + D + " Sırt dönükken karakterlerin ana geçiş çağrısı oyuncu dışında 0, gölge geçişinde yalnız kutudakiler; liman 5 km ötesinde ya da görüş dışında liman karakteri 0, 5 km içinde ekran boyutu kuralından sonra 0; eşikte 10 sn'de görünürlük değişimi ≤ 2 (histerezis); dürbünde 1 km'deki gemi görünür; gece fenerleri v0.4 ile aynı; ufuk ve eşik bandında en çok fark ≤ 8/255 (ortalama değil) |")
rep("çarpıştırıcı sayısı ve konumları aynı |",
    "çarpıştırıcı sayısı ve konumları aynı; " + D + " P0.7 kipinde, önce \"aynı kod iki kez\" gürültü tabanı ölçülür; ortalamanın yanında en çok fark ve > 8/255 bitişik piksel kümesi ≤ 4 px (ince siluet kaybı ortalamada görünmez); texel hizalama adımında gölge kenarı kayması beklenen fark olarak maskelenir |")
repline("| **49_bolge_ayiklama.js** |",
    "| **49_bolge_ayiklama.js** | T4, T5 (mağara) | Yankı odası, tünelde ağızdan 10/20/30/40/60 m (her noktada ağza dönük yön dahil 8 yön), dış kapı, " + D + " mağaranın üstündeki tepe (odanın izdüşümünde, dışarıda); Faz 6 mağaraları eklendiğinde aynı düzen | Odada ≤ 250 çağrı, gölge 0, yarasa çağrısı > 0; tünel noktalarında ayıklama açık/kapalı görüntü farkı 0; tepe üstünde dış dünya farkı 0; dışarıda mağara grubu 0 çağrı; bölge geçişinde program sayısı değişmez |")
rep("150 rastgele görünümlü düşman (kk atlas) |",
    "150 rastgele görünümlü düşman (kk atlas); " + D + " yaratılış kaydı (GPU yüklemesinden bağımsız), kamera boss'a dönük ve `visible=false` doğan parçalar bir kez çizilir; gemi direk devril/onar ×3 (Faz 2 `rebuild`) |")
rep("eski ayar dosyası açılır |", "eski ayar dosyası açılır; " + D + " Düşük'te FPS sınırı 60; Yüksek'te ışık havuzu 6 |")
repline("| **52_uzun_oturum_gercek.js** |",
    "| **52_uzun_oturum_gercek.js** | Uzun oturum belleği (10'un genişletilmişi); " + D + " haftalık ya da elle (K8-14) | 10_uzun_oturum akışı + yüzen olaylar açık + program sayısı + `fpsLimit` ile kısılmış gerçek zamanlı 20 dk; " + D + " GPU süreci belleği `/proc/<gpu-process pid>/status` VmRSS'ten (CDP bunu doğrudan vermez; koşucu Chromium süreç ağacında `--type=gpu-process`'i bulur) | " + D + " **Aynı durum karşılaştırması**: senaryo karşılaştırılan iki dilimde aynı bölgeye ve konuma döner (bölge değişimi ±500 geometri oynatıyor; taslağın kendi koşusunda son 10 dilim toplamı −511 çıktı) ve bu iki nokta arasında geometri/doku farkı ≤ 50, dilim başı medyan ≤ 1; program ısınmadan sonra ≤ +5; JS yığını (gc sonrası) son 4 dilim ≤ ilk 4 + 20 MB; gerçek zamanlı bölümde GPU süreç belleği eğimi ≤ 2 MB/dk |")
repline("| **coop/08d_coop_perf_4.cjs** |",
    "| **coop/08d_coop_perf_4.cjs** | Dört oyunculu co-op performansı | `f8_coop4.cjs` deseni; konuklar ev sahibinin yanında ve 3 farklı adada (iki düzen) | Ev sahibinde çağrı ≤ tek oyunculu aynı sahne + 3 × 25 (P2.6 sonrası + 3 × 15); " + D + " JS bilgi amaçlı (4 bağlam 4 çekirdeği paylaşıyor), kapı: ev sahibi JS ≤ aynı koşudaki tek oyunculu ölçümün 1,5 katı; dağınık düzendeki `animals.update` ölçümü P4.1'in koşuludur; bant genişliği Faz 5'in 06s S5 ölçütüyle (≤ 96 kbit/sn) sınanır, burada yinelenmez |")

# ---------------- §8.2–8.5 ----------------
insafter("- **09_performans**: boss döngüsü §5.4'e göre düzeltilir (P0.6);",
    "- " + D + " **09_performans 'boss_kraken' adımı** (09:18): boss gemi yanında ve `checkT` donukken ölçülür; `bossAlive` yerine `DK.bosses.active === b` yazılır. Taban değerinin (317 çağrı) boss'suz olduğu PERFORMANCE_REPORT'a not düşülür.")
app("fark, oyun başı 2 sn'deki gerçek zamanlı karelerin hayvan/NPC konumlarını değiştirmesinden).",
    " " + D + " Bu yalnız sahne birebir aynıysa doğrudur: oyunda `Math.random` doğrudan kullanılıyor (hayvan doğuşu, balık sürüleri, parçacıklar, Kraken açısı…) ve görsel saatler (`uTime`, islands.js:1136 ve details.js:507'deki `performance.now()`) akıyor; P0.7 kipi olmadan iki koşu aynı pikselleri vermez. İnceleme ölçümünde aynı karenin aynı görevde iki kez çizilmesi 0 fark verdi; farklı koşular sınanmadı. SwiftShader'da 'Yüksek' son işleme 'Orta' zinciridir; MSAA yolu (gerçek GPU Yüksek) bu testlerle sınanmaz.")
repline("| Başlangıç limanı | 1 026 / 691 / 1 054 |",
    "| Başlangıç limanı | 1 026 / 691 / 1 054 | ≤ 400 / ≤ 520 | 1,25 M | ≤ 0,95 M | 246–276 | " + D + " ≤ 200; P2.6 ile ≤ 160 | 1,4–2,6 → bilgi |")
insafter("| Menü | 422 | ≤ 300 |",
    "\n" + D + " JS sütunu §1.5 B ile tutarsızdı (B'de açık deniz 0,87–2,11, fırtına 1,71–2,46, Kraken 1,44–1,65, Volkanik Dev 0,85–1,71; mağara ve Kırlangıç B'de yok) ve bazı hedefler tabanın üst değerinin altındaydı. ±%40 gürültüyle bu hedefler kararsızdır: JS sütunu bilgi amaçlıdır, kapı aynı koşuda önce/sonra oranıdır. Mağara satırı odadaki 7 yarasayı içerir. Gölge hedefleri §7.4'teki ölçülmüş P2.1 etkisine göre P0'da yeniden yazılır.")
app("Ek bütçeler: limanda geometri ≤ 760", " " + D + " (program sayısı SwiftShader'da Orta zinciriyle sayılır; gerçek GPU Yüksek'te FXAA programı yoktur)")
rep("## F. Bilinen sınırlar ve ölçülemeyenler\n```",
    "## F. Bilinen sınırlar ve ölçülemeyenler\n```\n\n" + D + " Her tabloda \"Tür\" (tarayıcı / tarayıcı+benzetim / Node benzetimi / gerçek GPU) ve \"Tekrar\" (komut) sütunları bulunur (master_prompt §15). SwiftShader'da `EXT_disjoint_timer_query_webgl2` ile alınan süreler B tablosuna yazılmaz.")

# ---------------- §9 ----------------
rep("Bağlama pozu küresi × 1,5", "İlk güncel poz küresi × 1,5 " + D)
rep("İki koşunun en iyisi + bütçe 1,25×; çağrı/üçgen deterministik |",
    "İki koşunun en iyisi; " + D + " JS ms kapı değil bilgidir, kapı aynı koşudaki önce/sonra oranıdır; çağrı/üçgen P0.7 kipinde belirlenimli |")
repline("| R7 |",
    "| R7 | Sabit ışık havuzu: " + D + " Yüksek'te 6 yuva tek oyunculuda v0.4'ün en kötü durumunu (4 fener + meşale + yıldırım) karşılar; co-op'ta 4 meşale + fenerler 6'yı aşınca uzaktaki fenerin ışığı söner | Orta / düşük | Öncelik + uzaklık; yuva değişiminde 0,25 sn geçiş; fener ampulleri ışımalı malzemeyle görünür kalır | 46, gece kasaba görüntü karşılaştırması (Yüksek'te fark 0) |")
insafter("| R15 |",
    "| R16 | " + D + " Sise bağlı kırpma siluet siler (ölçüldü: fırtınada 1,15·d99 → 27/255) | Kesin (1,15'te) / orta | Yüksek'te arazi ve büyük nesneler 3·d99; ufuk bandında en çok fark ölçütü | 47 |\n"
    "| R17 | " + D + " Faz 9 üretimde `window.DK`'yi kapatıyor (taslak K9-3); kullanıcı turu konsoldan çalıştıramaz | Yüksek / orta | `?perf=1` düğmesi (K8-12) | 45, 53_test_kipi |\n"
    "| R18 | " + D + " Görüntü ve tekrar ölçütleri belirlenimsiz sahnede kararsız (`Math.random`, görsel saatler) | Yüksek / orta | P0.7 kipi; gürültü tabanı | 45, 48 |\n"
    "| R19 | " + D + " SwiftShader'da `KHR_parallel_shader_compile` yok: `compileAsync` derlemeyi kurulum karesine taşır, 13_donma P01 kötüleşebilir | Orta / orta | P5.1 ısıtması öncelikli; P5.2 kabulü kurulum karesi + ilk görüş karesini birlikte ölçer | 13_donma, 46 |\n"
    "| R20 | " + D + " Bölge ayıklaması y'siz test edilirse tepe üstünde dış dünya kaybolur; türe göre gizleme yarasaları siler | Orta (önlemsiz) / yüksek | §3.4 y koşulu ve konuma göre gizleme | 49 |")
repline("| R13 |",
    "| R13 | " + D + " Faz 7 nihai tasarımı artık var (FAZ7_DUSMAN_AI_SAVAS_ANIMASYON_TASARIM.md §7): politika Faz 8'de; Faz 7 değişmezleri, `aiQueue` (24 sorgu/kare), `enemies.stats` ve `lod.simTier(e)` uyarlayıcısını teslim eder. İmza ya da değişmezler kayarsa iki faz çelişir | Orta / orta | K8-11: Faz 7 §7 imzası, tablosu ve değişmezleri aynen; `DK.lod.override(fn)`; Faz 7 sonu kodunda taban yeniden ölçülür | 05 F-08, 37–44, 47 |")
repline("**İş büyüklüğü:** ≈ 39 gün",
    "**İş büyüklüğü:** " + D + " ≈ 43 gün (koşullu adımlarla ≈ 44): taslağın 39 günü + P0.7 1 + P2.6 1,5 + P5.3 1 + P5.4 1,5 − koşula bağlanan P4.1/P4.3 1,25. En büyük kazanç/emek oranı: P2.1 (1 gün; limanda ölçülen −107, liman 5 km ötesindeki sahnelerde ~−110), P2.6 (1,5 gün, karakter başına 6 → 1), P2.4 mağara bölgesi (1,5 gün, mağarada ~−1 000), P1.5 ışık havuzu (1,5 gün, en büyük tekil donma), P3.1 hayvanlar (2 gün, limanda ~−180). En riskli: P3.4 gemi, P3.5 bitki hücreleri ve P2.4 mağara bölgesi.")

# ---------------- Ek A ----------------
repline("| J-01 | Karakterlerde `frustumCulled=false` |",
    "| J-01 | Karakterlerde `frustumCulled=false` | **Ölçümle doğrulandı** | NPC'lere sırt dönükken 55 A + 100 G çağrı; 7 km uzakta (Kadim Tapınak, Kraken, Volkanik Dev) liman NPC'leri 55 + 55; Tuz Pazarı'nda 15 NPC 187 + 120 (§2.3). " + D + " Düzeltmenin etkisi ölçüldü: limanda 213 → 146 (NPC gölgeleri kutuda kalır); 2,9 km'de limana bakarken 149 → 143 (yalnız ekran boyutu kuralı kaldırır); gövde parçaları birleştirilebilir (P2.6) |")
rep("| Görünür nokta ışığı 7, meşaleyle 8 |", "| Görünür nokta ışığı 7, meşaleyle 8 (" + D + " inceleme ölçümünde de 7) |")
rep("düzeltilmiş döngü dG=0 (§5.4) |",
    "düzeltilmiş döngü dG=0 (§5.4). " + D + " Kod + Node ile bağımsız doğrulandı (31 alt adım, 42 mod 31 = 11, dG 5 olasılığı ≈ %6,5); Kraken de etkileniyor; 09 'boss_kraken' ölçümü boss'suz (317 = fırtına 317) |")
repline("| J-18 | Harita karosu `getImageData` |", "| J-18 | Harita karosu `getImageData` | Kod okuması (mapArt.js:99-108, `getImageData` :102) | " + D + " Plana alındı: P5.4 |")
repline("| J-26 | Alt adımda tekrarlanan işler |", "| J-26 | Alt adımda tekrarlanan işler | Kod okuması | " + D + " Animasyon ve parçacık yüklemesini Faz 3 C-14 çözüyor; `crowd`'un O(n²) taraması Faz 3'te ADIM'da kalıyor (Faz 3 §3), P4.3 (koşullu, kare başına değil) |")
repline("| J-29 | Ada kurulumunda 10–12 ms adım |", "| J-29 | Ada kurulumunda 10–12 ms adım | Taban kaydı (13_donma P01 10,5 ms) | " + D + " Plana alındı: P5.3 (taslakta hedef vardı, adım yoktu) |")
appline("**Bu çalışmada yeni bulunanlar:**",
    " " + D + " İncelemenin ek bulguları: NPC gölgeleri limanda gölge kutusunun içinde (P2.1 gölgede yalnız −12); liman 5 km içindeyken P2.1 uzak karakterleri kaldırmıyor; KayKit gövdesi birleştirilebilir (6 parça, aynı 41 kemik, doku, bindMatrix ve öznitelik); 09 'boss_kraken' ölçümü boss'suz; Kraken de 650 m kuralına takılıyor; SwiftShader'da `KHR_parallel_shader_compile` yok, `EXT_disjoint_timer_query_webgl2` var; sise bağlı kırpma fırtınada ada siluetini siliyor (1,15·d99'da 27/255, 3·d99'da yok).")
appline("`/tmp/tasarim_y/faz8/`: `tools.js` (sayfa araçları)",
    "\n\n" + D + " İnceleme ölçümleri: `/tmp/tasarim_y/faz8_inceleme/inc_olcum.js` (P2.1 etkisi 09 görünümü ve 4 yön, sis kırpması fırtına ve açık hava, oyuncu 2,9 km açıktayken karakterler; 93,6 sn), `inc_olcum2.js` (karakter örgü dökümü, yengeç ayıklaması, fırtınada 1,15/1,5/2/3·d99 kırpma payları, kök başına çağrı; 56,4 sn), `inc_olcum3.js` (SwiftShader uzantıları, gövde parçalarının birleştirilebilirliği; 21,5 sn), `fp.mjs` (Node: `checkT` evresi ve olasılıklar). Raporlar aynı adla `.json`/`.log`. Hepsi kilit sarmalayıcısıyla, 640×360, 8080'deki v0.4'e karşı; errors 0, pageErrors 0.")

EKC = """## Ek C — İnceleme bulguları (önem sırasıyla) """ + D + """

Karşıt inceleme taslağın her önemli iddiasını kodla (44d548c), Faz 2–6 nihai tasarımlarıyla, Faz 7 nihai tasarımıyla, Faz 9 taslağıyla ve üç ek tarayıcı ölçümüyle sınadı. Bulgular önem sırasıyladır; her birinin düzeltmesi belgede "(inceleme düzeltmesi)" ile işaretlidir.

| # | Önem | Bulgu | Kanıt | Düzeltildiği yer |
|---|---|---|---|---|
| 1 | Yüksek | **Yüksek ön ayarda görünür kaliteyi düşüren "optimizasyonlar"** (kullanıcı kuralı ve taslağın kendi K8-6'sıyla çelişki): karakter 220 m / hayvan 160 m sabit görünürlük sınırı; §3.8'deki "sürü/av hayvanı için 120–160 m oynanış açısından yeterli görüş"; v0.4'te her kare canlandırılan NPC'lerin 40–120 m'de 15 Hz'e, 120 m ötesinde 4 Hz'e indirilmesi; "yarıçap < 0,25 m gölge atmaz"; çekirdek adalarda küçük bitkinin 240 m'de kesilmesi; Yüksek'te ışık havuzunun 4'e indirilmesi (v0.4'te tek oyunculuda 4 fener + meşale + yıldırım = 6 etkin ışık); ana menünün 30 FPS'e, yarı saydam panellerin 2 FPS'e kısılması; Düşük'te FPS sınırının 30 önerilmesi (60 FPS hedefiyle çelişir) | npcs.js:147-166; islands.js:236-243, :412; character.js:336, :480; weatherfx.js:115; hesap: 1,8 m karakter 220 m'de 1080 satırda ~6 px; 0,5 m varilin gölgesi 2048 haritada ~9×9 texel | K8-4, K8-6, §3.3, §3.5, §3.7, §3.8, §4.2, §6.2 |
| 2 | Yüksek | **Ölçülmeden yazılmış ve ölçümle çürüyen kazanç**: P2.1'in limanda NPC gölgesini düşüreceği varsayımı (T5 "NPC −85", §7.4 "NPC 159 → ~45", P2.1 "≤ 60", P2.3 "gölge ≤ 130") ve "diğer bütün sahnelerde −110". Ölçüm: NPC'ler gölge kutusunda; P2.1 limanda karakterde −67 (gölgede yalnız balıkçılar −12), yengeçte −40; 2,9 km'de liman görüşteyken 149 → 143. 47'nin "sırt dönükken karakter çağrısı 0" ölçütü olanaksız; P2 bütçesi ≤ 850 gövde birleştirmesi olmadan tutmaz | `inc_olcum.json`, `inc_olcum2.json` | §2.3 ek tablo, §3.3, §3.5, §7.4, K8-9, P2.1, P2.3, 47 |
| 3 | Yüksek | **Gölge kuralları kodu yanlış okuyor**: (a) çekirdek bitkide "gölge ≤ 120 m hücre" — karar hücre merkezine uzaklıkla verilir; 160 m hücre ve gölge kamerasının 120 m ışık ofseti yüzünden oyuncunun yanındaki ağaçların gölgesi konuma göre söner (doğrusu: hücre sınır küresiyle three.js gölge kamerası ayıklaması, görüntü birebir); (b) su altında gölge dondurma — güneş su altında zayıflamıyor, taban gölge alıyor, dalan oyuncunun ve geminin gölgesi tabanda donar; (c) "derin gece `sun.intensity < 0,15`" — gece yönlü ışık ~0,95'lik ay ışığıdır, koşul gece hiç tutmaz | islands.js:412-413; sky.js:335-336, :340 | §3.5, §3.7, P2.3 |
| 4 | Yüksek | **Mağara bölge ayıklamasında üç tasarım hatası**: `insideFactor` yalnız xz'ye bakar, mağaranın üstündeki tepede dış dünya kaybolur; "hayvan kökleri gizlenir" kuralı odada yaşayan 7 yarasayı da gizler ("hayvan 617 → 0" yanlış); ışık görünürlüğüne dokunulursa program yeniden derlenir (J-08) | cave.js:215-227; animals.js:758; player.js:391 | §3.4, P2.4, 49, R20 |
| 5 | Yüksek | **Sise bağlı kırpma ada siluetini siliyor, kabul ölçütü yakalamıyor**: fırtınada 1,15·d99 → 36–37 pikselde 25–27/255; 3·d99 → ≤ 1 piksel; açık havada 2,45 km'de ≤ 5/255. Taslağın "≤ %0,5 piksel" ölçütü %0,016'yı geçirir. Ayrıca `k` 1080 satıra sabit (DPR 2'de eşik yarıya iner) ve ışıyan nesneler (gece fenerleri) ekran boyutu kuralıyla kesilirdi | `inc_olcum.json`, `inc_olcum2.json`; sky.js:88, :96 | §3.6, P2.5, 47, 48, R16 |
| 6 | Orta | **Faz uyumsuzlukları ve çift planlama**: (a) düşman LOD — Faz 7 nihai §7 (Ç-12) politikayı Faz 8'e bıraktı, imza/tablo/değişmez önerdi; taslağın T9 kuralı ve P2.2'nin `enemies.js:1597-1610`'u ayrıca değiştirmesi bu sözleşmeyle hizalı değil, `DK.lod.override` yok; (b) `crowd` için "Faz 3 sonrası kare başına bir kez" — Faz 3 §3 crowd'u ADIM'da tutar, kare başına çalıştırmak belirlenimi bozar; (c) parçacıkta "kare başına tek yükleme" Faz 3 A2b'nin işi; (d) `DK.perf.tour()` üretimde — Faz 9 taslağı K9-3 `window.DK`'yi üretimde kapatıyor, Faz 2/6 kancaları yalnız test kipinde; (e) Faz 5 uzak oyuncu meşalesi (≤ 30 m gerçek ışık) havuz dışında eklenirse yeniden derleme; (f) Faz 4 §3.3 içe aktarma doğrulayıcısı bilinmeyen ayar anahtarlarını atar; (g) Faz 3'ün Faz 8'e bıraktığı uyarlanır adım bütçesi için karar yok; (h) Faz 9'un `10_uzun_oturum` yerleşimi sorusu yanıtsız | Faz 7 nihai §7; Faz 3 §3 ve §2.2; Faz 9 taslağı K9-3; Faz 5 §2 satır 3; Faz 4 §3.3 | K8-8, K8-10…K8-14, §3.9, §3.10, §6.2, P2.2, P4.3, R13, R17 |
| 7 | Orta | **Gemi birleştirme kodu yanlış okuyor**: `_applyDamageVisuals` birleşik örgüyü yeniden kurmaz, direk düşünce `M.masts[i].objs`'u çalışma anında pivota taşır; `rebuild` yalnız direk onarımı ve görünüm değişiminde çağrılır. Direk nesneleri gövdeyle birleştirilirse direk devrilmesi bozulur | ship.js:66-74, :119-142, :722; shipModel.js:415; shipControl.js:120; net.js:617, :631 | §3.1, P3.4 |
| 8 | Orta | **Volkanik Dev kök nedeni doğru, ayrıntılar eksik/yanlış**: uzaklık ~9,9 km (8,2 değil); "0,5 − 30·(1/60) = +1,04·10⁻¹⁶" kapalı biçimde 0'dır, kalıntı ardışık çıkarmadan gelir; Kraken `G.ship`'in 40 m yanında doğar ve o da 650 m kuralına takılır (09'da Kraken'in bırakılması da sınanmıyor); 09'un 'boss_kraken' performans ölçümü boss'suz (317 = fırtına 317, `bossAlive:true` yanıltıcı); deney C, B'den sonra aynı sayfada ve kamera boss'a bakmadan koştuğu için boss'un kendi parçalarını sınamadı; önerilen kodda kullanılmayan değişken ve `finally`'siz `checkT` geri yüklemesi | bosses.js:148-150, :1054, :1058, :1094-1107; taban `09_performans.json` adım 11; `f8_volkan.json`, `f8_09tani_2.json`; `fp.mjs` | §0.1, §1.4, §5.4, §8.2, P0.6, 50 |
| 9 | Orta | **Ölçülemeyen ya da kararsız kabul ölçütleri**: 45 "medyan farkı ≤ %3" (tabanın kendi yayılımı Kırlangıç %9, açık deniz %9, deniz savaşı %28); 48 görüntü eşdeğerliği belirlenimsiz sahnede (`Math.random`, görsel saatler) ve ortalama ölçüt ince siluet kaybını görmüyor; JS ms bütçeleri ±%40 gürültülü ve §1.5 B ile tutarsız; 46 "ilk kare ≤ 2×" yeni programsız olayda bile 2,3×; 52 "son 10 dilim toplam ≤ 50" bölge değişimine duyarlı (taslağın koşusunda −511); "CDP ile GPU süreç belleği" CDP'de doğrudan yok; 08d "JS ≤ 3 ms" 4 bağlam / 4 çekirdekte gürültülü | Taslak §1.5 A/B/E, §6.1 | P0.7, §8.1, §8.3, §8.4 |
| 10 | Orta | **KayKit gövde birleştirmesi atlanmış** (J-01 düzeltmesinin denetimde önerilen ikinci adımı): 6 parça aynı 41 kemik, doku, `bindMatrix` ve öznitelikleri kullanıyor (ölçüldü) → tek `SkinnedMesh`; NPC gölge payını görüntü değiştirmeden düşürmenin tek yolu; kemik dokusu karakter başına 6 kez yükleniyor | `inc_olcum3.json`; audit_J J-01 | §3.3, P2.6 |
| 11 | Orta | **Plansız kalan denetim maddeleri**: J-29 (13_donma P01 ≤ 5 ms hedefi var, uygulama adımı yok) ve orta öncelikli J-18 (harita karosu `getImageData`; yalnız "13_donma'ya eklensin" denmiş) | islands.js:528-543; mapArt.js:99-112 | P5.3, P5.4, Ek A |
| 12 | Orta | **Kanıtsız adımlar ve tahminler**: P4.1 hayvan AI katmanları (ölçülen fark 0,057 → 0,058 ms), P4.3 crowd ızgarası (crowd süresi hiç ölçülmemiş), T6/T7 kazanç sayıları (980 → ~350, 1 133 → ~550, fırtınada −%30), "ANGLE/D3D11'de program başına onlarca ms", dinamik çözünürlükte "takılma olmaz" | Taslak §1.5 F, §3 | P4.1/P4.3 koşullu, tahmin etiketleri, P0 deneyleri |
| 13 | Düşük | **SwiftShader/GPU ayrımı inceltmeleri**: SwiftShader'ın "Yüksek"i Orta son işleme zinciridir (FXAA; gerçek GPU'da 15 çağrı; MSAA yolu testlerle sınanmıyor); SwiftShader'da `EXT_disjoint_timer_query_webgl2` var (yazılımsal süre GPU süresi gibi raporlanmamalı), `KHR_parallel_shader_compile` yok (`compileAsync` eşzamanlı; P5.2 SwiftShader'da 13_donma'yı kötüleştirebilir). Taslak SwiftShader sayılarını gerçek GPU sonucu gibi sunmuyor; bunlar inceltmedir | post.js:62; `inc_olcum3.json` | §1.1, §1.2, §1.6, §6.2, R19 |
| 14 | Düşük | Test kayıt biçiminde master_prompt §15'in "gerçek tarayıcı mı benzetim mi" ve "tekrar üretme" alanları yok | master_prompt §15 | §7, §8.5 |
| 15 | Düşük | Küçük düzeltmeler: B-5, Faz 5'in yeniden yazdığı `RemotePlayer`'a uygulanmalı; `Ship._build` sızıntısı (ship.js:57-58) Faz 2 §7.7'de kapanır (B-6, çift planlama yok); kabuk kimliği `kabuk_<i>` (Faz 4 §6.1); kayalıklarda `setColorAt` gereksiz; texel hizalama ışık uzayında yapılmalı; ısıtma grubunda nesne türü eşleşmeli; P2.4'teki "1 154" ile §1.5'teki "1 166" tutarsızdı; `SkinnedMesh` sınır küresi "bağlama pozunda" değil ilk güncel pozda hesaplanır; Orta'da gölge menzilinin 55 → 40 m kısalması açıkça yazılmalı | Kod okuması | İlgili bölümler |

**Doğrulanan, değişmeyen iddialar.** Volkanik Dev "dG 5"in sızıntı değil test kusuru olduğu (kod, Node benzetimi, taban JSON ve taslağın ham verileri); B-1 (enemies.js:1311-1323 yalnız `s.mesh`'i kaldırıyor), B-2 (enemies.js:1442, bosses.js:895: kaldırılan boss'un mermisi isabette hâlâ hasar veriyor), B-5 (net.js:72-85, :125), J-21 (events.js:47, :79, :158-197), J-22 (kk.js:244), J-03 (main.js:112 hedefsiz `compileAsync`), J-07 (7 nokta ışığı, ölçüldü), J-11, J-12 hesabı (engine.js:56-59), J-14 (engine.js:20), §2.2 dökümünün toplamları (780 + 246 = 1 026; %79 ve %38 payları), meşale ışığının yeniden derleme mekanizması.
"""
s = s.rstrip('\n') + '\n\n' + EKC
open(OUT, 'w', encoding='utf-8').write(s)
print('yazildi', len(s), s.count(D))
