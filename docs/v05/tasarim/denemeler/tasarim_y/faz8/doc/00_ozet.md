# Faz 8 — Performans ve Optimizasyon: Tasarım Belgesi

Proje: Deniz Korsanları: Son Hazine (three.js r187). Taban: v0.4, commit 44d548c (değişmeyen kopya, http://localhost:8080). Tarih: 14 Kasım 2026.
Kapsam: master_prompt.md "AŞAMA 11 — PERFORMANS VE OPTİMİZASYON"; denetim J (audit_J.json, J-01…J-30); Faz 1 (A-19), Faz 3, Faz 5, Faz 6 tasarımlarıyla uyum; KARARLAR.md test adları (tarayıcı 45–52, co-op 08d–08f).
Bu belge yazılırken **kod değiştirilmedi**; bütün ölçümler salt-okur betiklerle (`/tmp/tasarim_y/faz8/`) alındı.

> **Gerçek GPU ölçümü yoktur.** Ortam başsız Chromium + SwiftShader (yazılımsal WebGL), 4 sanal çekirdek. Çizim çağrısı, üçgen, kaynak/program sayısı ve JS süresi ölçüldü; FPS ve GPU kare süresi **ölçülmedi** (§1.1, §1.6).

## 0. Özet ve kararlar

### 0.1 Ne ölçüldü (taban, SwiftShader, 640×360, Yüksek)

- **Başlangıç limanı (09 kurulumu): 1 005–1 026 çağrı (altı koşu), 1,25–1,26 M üçgen** (taban kaydı 1 035; v0.3'ün "1 045"i). 764 ana + 246 gölge + 16 son işleme. 8 yönlü taramada 606–1 054 (medyan 691).
- Çağrıların **%79'u dört kaynaktan**: prosedürel hayvanlar 333 (7 domuz tek başına 140), statik süsler 207 (deniz kayalıkları, heykeller, mağara içi, kabuklar), NPC'ler 159 (görüş konisi ayıklaması kapalı), liman yapıları 108. Üçgenin %38'i her yöne çizilen çekirdek bitki örtüsü (473 K).
- Diğer sahneler (varsayılan yön çağrı; 8 yön medyan / en çok): kasaba 1 130–1 137 (514–541 / 1 130–1 133), Kadim Tapınak ormanı 449–458 (384–386 / 498–519), Kırlangıç ormanı 497–777 (777–849 / 1 285–1 333), **mağara 388–1 246 (472–489 / 1 112–1 166)**, açık deniz 392–984 (389–423 / 980–984), fırtına 413–1 003 (438–445 / 995–999), deniz savaşı 568–1 169 (548–701 / 1 175–1 279), Kraken 430–437 (438–456 / 949–961), Volkanik Dev 508–552 (511–514 / 592–604). **Dört oyunculu co-op** (gerçek PeerJS, 4 bağlam): ev sahibi 1 121 çağrı (tarama 767 / 1 121), konuklar 1 181–1 193; ev sahibinden ~109 KB/sn. **Uzun oturum** (10_uzun_oturum, 30 dk benzetim): 5/5 geçti, yığın +11,7 MB, geometri/doku düz.
- Her sahnede limandaki NPC'ler (7 km uzaktan bile) **110 çağrı** harcıyor; mağara odasında dış dünyanın tamamı çiziliyor; açık denizde 1,6 km'deki adaya bakınca çağrı 2,5 katına çıkıyor.
- Program: son işleme açıkken 95 programın **42'si hiç kullanılmayan** tuval varyantı (yükleme ekranındaki ön derleme yanlış hedefe). Meşaleyi ilk yakmak **17–25 program** derletiyor (yazılımsal GPU'da 10 sn'lik kare). Her yeni ada türü ilk görüşte 1–5 program.
- JS güncelleme 0,85–2,6 ms/kare (koşudan koşuya ±%40); denizde en pahalısı balık sürüleri (0,43–0,78 ms), limanda NPC/balık/hayvan.
- **Volkanik Dev "dG 5": sızıntı değil, test kusuru** (kanıtlı, §5.4): boss uzak noktasında doğurulduğu için `bosses._check()` onu çoğunlukla ölçümden önce kaldırıyor; denetim evresi (31 alt adım) tutarsa `demon.glb`'nin 5 paylaşımlı geometrisi ısınmadan sonra ilk kez GPU'ya yükleniyor. Deterministik yeniden üretim dG=5 (aynı 5 geometri, 09'un elle müdahalesiz kopyasında da bir kez kendiliğinden çıktı), düzeltilmiş döngü dG=0. Yan bulgular: `enemies.start` uçuştaki lav işaretlerini sahnede bırakıyor (gerçek sızıntı), kaldırılan boss'un mermileri uçmaya devam ediyor.

### 0.2 Kararlar

| # | Karar | Gerekçe | Bölüm |
|---|---|---|---|
| K8-1 | Ölçüt seti: çağrı (ana/gölge/son işleme), üçgen, geometri/doku/program, JS ms, ilk görüş derlemesi, bellek; 9 sahne × 8 yön; gerçek GPU ayrı tablo, ölçülmediyse "ÖLÇÜLMEDİ" | SwiftShader'da mutlak FPS anlamsız | §1, §8.5 |
| K8-2 | Önce **görünmeyeni çizmeme** (karakter ayıklaması, bölge, gölge budama, uzak ayrıntı), sonra **birleştirme/örnekleme**; örgü sadeleştirme yalnız gemide ve isteğe bağlı | Ölçülen yük, çizilmesi gerekmeyen nesnelerden geliyor; örgüler zaten düşük çokgenli | §3 |
| K8-3 | GPU örtme sorgusu yok; **veriyle tanımlı bölge (portal) ayıklaması** (mağaralar) var | Gecikmeli sorgu pop-in yapar; açık dünyada örtücü az; mağarada kazanç ~1 000 çağrı | §3.4 |
| K8-4 | Nokta ışığı havuzu **sabit 4** (Düşük 2); meşale, mağara, yıldırım ve fenerler havuzdan | Meşale yeniden derlemesi biter; Faz 6 "havuz 4" ile aynı | §6.2 |
| K8-5 | Benzetim LOD'u ön ayardan bağımsız ve **en yakın oyuncuya** göre (Faz 5 odakları); görsel LOD ön ayara bağlı | Co-op'ta oyun sonucu ön ayarla değişmemeli | §3.8, §4.2 |
| K8-6 | **Yüksek ön ayarın görüntüsü v0.4 ile aynı** (görüntü farkı testi zorunlu); DPR 2 korunur; dinamik çözünürlük varsayılan kapalı | Kullanıcı kuralı: FPS için görünür kaliteyi düşürme | §4.2, §8.3 |
| K8-7 | Volkanik Dev: test düzeltilir (boss yanında, denetim donuk, kimlik farkı); oyunda boss mermileri ve `enemies.start` işaretleri temizlenir | Kök neden kanıtlandı | §5.4–5.5 |
| K8-8 | Önkoşullar: Faz 1 A-19 (LOD ölçeği sırası), Faz 3 ÇİZİM evresi (animasyon katmanları); Faz 8 başında taban Faz 7 sonu kodunda yeniden ölçülür | Belgedeki sayılar v0.4 | §4.4, §7 |
| K8-9 | Liman bütçesi kademeli: P2 sonrası ≤ 850, P3 sonrası ≤ 550, son ≤ 500 (09 görünümü); tarama en çok ≤ 520 | Ölçülen gruplardan hesaplanan kazanç ~−560 | §8.4 |
| K8-10 | Ayar şeması geriye uyumlu (`preset`, `dynRes`, `dprCap` eklenir; eski ayar dosyası açılır) | Faz 4: kayıt biçimine dokunulmaz | §4.3 |

### 0.3 Kullanıcı isteklerinin karşılığı

| İstek | Bugün (ölçülen) | Bu tasarımda | Bölüm |
|---|---|---|---|
| Mevcut raporu başlangıç kabul et, ölçümleri yeniden yap | 09 yalnız 5 sahne, tek kare | 9 sahne × 8 yön yeniden ölçüldü; kalıcı matris 45 | §1.5, §8 |
| Limandaki ~1 045 çağrıyı iyileştir | 1 005–1 035 | Hedef ≤ 500 (−%51), görüntü değişmeden | §2, §7, §8.4 |
| Statik geometri birleştirme | Yalnız liman, 84 örgü | Liman ortak malzeme, süsler hücre birleştirme, gemi | §3.1 |
| InstancedMesh | Kısmen | Kabuk, kayalık, sarkıt, mezar, fener, top | §3.2 |
| LOD | Arazi, ada hücresi | Karakter/hayvan görünürlük + animasyon katmanları, bitki hücreleri | §3.3, §3.7 |
| Occlusion culling | Yok | Bölge ayıklaması (mağara); sorgu önerilmez | §3.4 |
| Gölge mesafesi | 110 m kutu, her şey atıyor | Budama, görünmezken güncellememe, texel hizalama, ön ayar | §3.5 |
| Uzak nesne ayrıntısı | 5 km, sise bağsız | Ekran boyutu + d99 | §3.6 |
| Bitki örtüsü | Tek parça | Hücreler, gölge yalnız yakında | §3.7 |
| Hayvan simülasyon LOD'u | 250 m; co-op'ta hepsi | Katmanlar, en yakın oyuncu | §3.8 |
| Düşman AI LOD'u | Var | Korunur + görünmezken animasyon | §3.9 |
| Parçacık havuzları | Tek Points, CPU verimsiz | SoA halka tampon | §3.10 |
| Doku önbelleği | FIFO 96 | Başvuru sayacı, atlas | §3.11 |
| Geometri ve malzeme paylaşımı | Kısmen | Hayvan türü, yüzen nesne, kabuk | §3.12 |
| Bellek temizliği | 3 açık + Volkanik Dev | Kök neden, 5 düzeltme, kimlik tabanlı test | §5 |
| Gereksiz çizim ve shader derlemesi | Yanlış ön derleme, meşale, duraklatma | Doğru hedef, sabit ışık, ön ısıtma, kısma | §6 |
| 9 test sahnesi | 5 sahne | Hepsi tarif + taban + bütçe | §1.4–1.5, §8.4 |
| Gerçek GPU / SwiftShader ayrımı | Yok | Ayrı tablolar, `--gpu`, `DK.perf.tour()` | §1.6, §8.5 |
| 60 FPS, düşük donanım, uzun oturum, kontrol altında çağrı | Doğrulanamaz / kısmen | Bütçeler, ön ayarlar, 52, gerçek GPU hedefleri | §4, §5, §8.4 |
