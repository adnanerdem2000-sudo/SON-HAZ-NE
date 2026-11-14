# Faz 7 — Düşman AI, Boss, Savaş Adaleti, Karakter Animasyonu ve Kamera: Tasarım Belgesi

Tarih: 14 Kasım 2026. Taban: v0.4, commit `44d548c` (`/home/user/SON-HAZ-NE`, çalışma boyunca değişmeyen ağaç).
Kapsam: `master_prompt.md` "AŞAMA 9 — DÜŞMAN AI, BOSS VE SAVAŞ KALİTESİ" ve "AŞAMA 10 — KARAKTER, ANİMASYON VE KAMERA".
Üzerine kurulduğu belgeler: Faz 2 (host otoriteli savaş, §5), Faz 3 (sabit adım, `segmentQuery`, katmanlar, kamera C-13),
Faz 4 (D-07, D-17), Faz 5 (anlık görüntü v2, ilgi alanı, `tel`/`bossFx`), Faz 6 (§5.2 yeni türler 17 → 26, S6 H-05 yolu),
`KARARLAR.md` (Faz 7 test adları: tarayıcı `37`–`44`, co-op `08a`–`08c`).

**Yöntem.** Kod satır satır okundu. audit_H ve audit_I bulgularının karşıt doğrulaması yoktu; iddiaların hepsi burada yeniden
sınandı: (1) kod okuması, (2) gerçek modüllerle salt-okur Node denemeleri (`/tmp/tasarim_y/faz7/`: `enemy_moves.mjs`,
`gait.mjs`, `reach.mjs`, `glb_peak.mjs`, `char2–7.mjs`, `kraken_hitbox.cjs`, `serpent_dive.cjs`, `camtest/run.mjs`),
(3) kilit sarmalayıcısıyla iki tarayıcı ölçüm koşusu (`olcum_ai.js`, `olcum_ai2.js`; 640×360, SwiftShader; raporlar
`olcum_ai.json`, `olcum_ai2.json`). Dört koşu hakkının ikisi kullanıldı. Ölçüm değerleri belgenin ilgili yerlerinde verilir.

**Yol notu.** Görev metnindeki `js/core/physics.js` yoktur; fizik modülü `js/world/physics.js`'tir (265 satır).

**Karşıt inceleme (inceleme düzeltmesi).** Bu sürüm, ilk taslağın karşıt gözle incelenmiş nihai hâlidir. Önemli iddialar kod
okumasıyla yeniden sınandı, ayrıca yeni salt-okur denemeler koşuldu. Node denemeleri (`/tmp/tasarim_y/faz7/`):
`inc_strike.mjs` (düşman hamlelerinde silah eli, bıçak ucu ve en ileri erişim), `inc_strike2.mjs` (oyuncu hamleleri ve tekme),
`inc_profile.mjs` (tek klibin hız profili), `inc_giant.mjs` (dev boss klipleri), `inc_gait_med.mjs` ve `inc_gait_med2.mjs`
(destek eşiğine göre doğal hız ve kalan kayma), `inc_poise_sim.py` (zincir modeli), `inc_knock.py` (geri tepme modeli).
Kilit sarmalayıcısıyla **bir** tarayıcı koşusu yapıldı: `inc_olcum.js` → `inc_olcum.json` (640×360, SwiftShader, 37 sn).
Böylece dört koşu hakkının üçü kullanılmış oldu (tasarım 2, inceleme 1). Düzeltilen yerler metinde "(inceleme düzeltmesi)"
ile işaretlidir. Bulunan sorunların önem sırasına göre tam listesi **Ek D**'dedir.

---

## 0. Özet, kararlar ve önceki fazlarla ilişki

### 0.1 Özet

1. **Algı modeli kodda tam, ama kenarları kırık.** Görüş konisi, mesafe, görüş hattı, gece/meşale, hava sisi, eğilme, yüzme,
   ses, grup alarmı var (`enemies.js:532-594`, `719-730`). Eksikler: bölgesel sis algıya girmiyor, ses engellenmiyor ve
   yağmurdan etkilenmiyor, görüş kesilince düşman oyuncunun **canlı** konumunu izliyor (H-12; tarayıcıda görüş kesikken
   120/120 adımda yeni konuma yöneldi), konuğun algı değiştiricileri ev sahibine ulaşmıyor (H-13).
2. **Navigasyon en zayıf halka.** Yerel yönlendirme bir ileri sonda ve ±63° sapmadan ibaret (`enemies.js:1072-1146`).
   Tarayıcı ölçümü: en yoğun çarpıştırıcılı hücrede (32 çarpıştırıcı) 6 devriyeciden **hiçbiri 60 sn'de ilk devriye noktasına
   varamadı**; 1,2 sn'lik pencerelerin %72–86'sında ilerleme < 0,35 m. "2 sn'den uzun 0,2 m/sn altı hız" ölçütü bu takılmayı
   **görmedi** (düşmanlar yerinde sapıp duruyor). U biçimli ve 20 m düz duvarın arkasındaki hedefe 30 sn'de ulaşılamadı.
3. **Savaş zamanlaması animasyondan kopuk.** (inceleme düzeltmesi) Kesme ve doğrama hamlelerinde hasar vuruş karesinden
   geç geliyor: Atk2 +0,21, Atk2H +0,15, Heavy2H +0,14, Punch2 +0,13 sn, DASH +0,33 sn ve ardından 0,33 sn donma (H-09). İlk
   taslaktaki üç dürtme gecikmesi (AtkStab +0,30, Stab2H +0,31, DualStab +0,28) bir **ölçüm yapıntısıdır**. Dürtmenin temas anı,
   bileğin en hızlı değil en ileri olduğu andır. Bugünkü `hitAt` değerleri bu anla ±0,02 sn örtüşüyor (AtkStab 0,57 / 0,58;
   Stab2H 0,64 / 0,62; DualStab 0,55 / 0,55; `inc_strike.mjs`). Dev bosslarda fark 0,33–0,57 sn (H-02). Taş Muhafız yumruğunda
   elin en ileri anı 0,50 klip sn, yani 0,667 oyun sn; hasar 1,1 sn'de geliyor, fark +0,43 sn. İlk taslak açısal hız tepesini
   (0,313 klip sn) kullandığı için +0,667 sn buluyordu (`inc_giant.mjs`). Uyarı halkaları hasar alanından küçük. Büyüyerek
   başladıkları için son yarıçap baştan görünmüyor; yay saldırılarında da tam daire çiziliyor. Öfkeli insan bosslarında telgraf
   alt sınırın altına iniyor: `_startMelee` öfkede `hitAt`'i 1,2'ye bölüyor (`enemies.js:921-922`). Morvan'da Atk1 0,35, Atk2
   0,367, SPIN 0,583 sn (tarayıcı MD; yeni bulgu N-13).
4. **"Engellenen ya da kaçınılan saldırı hasar vermez" kuralı yalnız can için geçerli;** yavaşlatma, geri itme, zehir ve
   güdümlü mermiler bu kuralı deliyor (H-05, H-07). Blok bugün tasarım gereği %12 sızdırıyor. Hayvan ısırığı uyarısız ve
   bloklanamıyor (H-06). Hafif vuruş zinciri poise'sız düşmanı kilitliyor (H-20). (inceleme düzeltmesi) İlk ölçüm (M5b)
   `combat._attack`'ı 0,42 sn'de bir doğrudan çağırıyordu. Böylece `chainAt` kapısı atlanıyor, 10 sn'de 23 savuruş yapılıyordu
   (meşru en çok 18). Gerçek zincirle (`chainAt`'e uyan girdi, 18 savuruş) de düşman 10–11 saldırı başlatıyor ve **0'ını**
   vuruş anına ulaştırıyor (`inc_olcum.js` MA, 3/3 koşu). Asıl kilit, her döngüde 3. vuruşun (`finisher`, `combat.js:21`)
   verdiği 1,0 sn'lik sersemliktir (`enemies.js:401`). K7-5'in ilk biçimi (yalnız irkilme bekleme süresi ve zırh)
   öykünüldüğünde sonuç yine 0 çıktı. Bitirici sersemliğine azalan getiri eklenince 3/3 koşuda 6 saldırının 2'si vuruş anına
   ulaştı (N-15, K7-5).
   (inceleme düzeltmesi, N-11) Derinlik Yılanı'nın zehir tükürüğü **hiç can hasarı vermiyor**. `SeaSerpent` `_hitPlayer`
   tanımlamıyor (`bosses.js:391-556`); `enemies._impact` ise hasarı yalnız `s.owner?._hitPlayer` varsa uyguluyor
   (`enemies.js:1442`). Yerel oyuncuya yalnız 6 sn zehir gidiyor (`:1443`), konuğa hiçbir şey gitmiyor. Tarayıcı MB ölçümünde
   isabet anında can 100 → 100, 2 sn sonra 96,7 (yalnız zehirden).
   (inceleme düzeltmesi, N-14) Konuk için kaçınma ve blok zamanı adil değil. Konuk düşmanı NetInterp gecikmesiyle görüyor
   (D 100–350 ms, Faz 5 §3); kaçınma niyeti de host'a RTT/2 sonra ulaşıyor. Host gölge canı `cs.iframesUntil`'i niyetin
   alındığı andan sayıyor (Faz 2 §5.10 b). 0,42 sn'lik bir telgrafta konuğun tepki payı 0,01–0,26 sn'ye iniyor. İlk taslağın
   R12 kuralı yalnız sonucun eşitliğini ölçüyordu, zamanın eşitliğini ölçmüyordu.
5. **Bosslar:** Kraken dokunacının vuruş hedefi ucun 5–14 m gerisinde (sloop'ta durumların %7,7'sinde kılıçla erişilebilir,
   H-01). Derinlik Yılanı dalışta ortalama 21 m ışınlanıyor (H-25). Dev bosslar çarpışmasız (H-22), Volkanik Dev'in ganimeti
   lava düşebiliyor (H-29). Hayalet Kaptan'ın hamlesi hiç tetiklenmiyor (H-10; 13 saldırı başlangıcında 0 DASH).
6. **Karakter animasyonu fiziksel hareketten kopuk.** Klip hızları kliplerin doğal yer hızına göre ayarlanmamış: kayma oranı
   yürümede 0,45, koşuda 0,69, sprintte 0,56 (hedef 0,85–1,15; I-01). Aynı sorun düşmanlarda da var (oran 0,48–0,74; denetimde
   yok). Zıplama klibi fiziksel kalkıştan 0,19 sn geç (I-05), kaçınma kliplerinde 0,27–0,67 m kök kayması (I-06).
   (inceleme düzeltmesi, N-16) Doğal hız ölçümü destek ayağı eşiğine duyarlı. 3 cm eşikte yürüme döngüsünün %90'ı "destek"
   sayılıyor ve salınım evresi ölçüme karışıyor. 1,5 cm eşikte doğal hızlar şöyle: Walking_A 0,71, Walking_Backwards 0,77,
   Running_A 3,75, Running_C 3,79 m/sn. Doğal hızda kalan kayma medyanı 0,06–0,25 m/sn (`inc_gait_med.mjs`). Bugünkü oranlar
   bu değerlerle daha da düşük çıkıyor: yürüme 0,37, koşu 0,72, sprint 0,57. Ayrıca 1,5 m/sn yürüyüş, klibin 2,1× hızla, yani
   ~4 adım/sn kadansla oynatılmasını gerektirir. Bu yüzden kadans sınırı kararlara eklendi (K7-9).
7. **Eller nesnelere ulaşamıyor, çünkü kollar çok kısa.** Kol (omuz–bilek) 0,42–0,50 m, omuz 0,94–1,11 m yükseklikte
   (`reach.mjs`). Dümen tutamakları bileğe 0,39–0,53 m, top tutamakları 0,34–0,37 m uzakta (I-03); tırmanma el hedefi 1,85 m'de
   (`character.js:908`) ve hiçbir gövde tipi ulaşamıyor. Bütün tutma noktaları erişim sınırına göre yeniden tanımlanmalı.
8. **Kamera:** Faz 3 A9 (pad 0,25, GORSEL kutuları, yeniden sınama) duvar ve yapı sorunlarının çoğunu kapatır. Kalanlar: nişan
   omzunun daraltılmaması (I-02: kamera sağdaki duvarın 0,25 m içinde), sırtı duvara dayalı durum (I-13), güverte donanımının
   (top, kapak, çapa, fener) ne soldurulması ne çarpışması (I-14), hayalet geminin kamera gövde listesinde olmaması.
   (inceleme düzeltmesi) Kullanıcı "kamera ... ağaçların ... içinden geçmemeli" diyor. İlk taslağın K7-8 varsayılanı (bütün
   ağaçlarda soldurma) bu isteği karşılamıyordu ve bu sapma karar tablosunda gerekçelendirilmemişti. Yeni kural: kalın gövdeler
   (r ≥ 0,45 m) kamerayı ancak başa 1,2 m'den fazla yaklaştırmadan durdurabiliyorsa çarpışır; aksi hâlde gövde tamamen solar.
   Böylece v0.4'teki "gövdeye değince kamera başa sıçrıyor" gerilemesi (`props.js:237`) geri gelmez (K7-8, Ç-10).
9. **Test açığı:** 17 türün 13'ü, 5 efsanevi boss, oyuncunun kombosu, parry'si, dolumu, merdiven ve kazı için beklentili test yok.
10. **Bu tasarım** 20 küçük adımda (F7-0…F7-19) ilerler; ilk adım kod değiştirmeden mevcut davranışı sabitleyen testleri yazar.
    Yeni içerik (yeni tür, yeni boss, yeni saldırı) eklemez. Sekiz tarayıcı senaryosu (37–44), üç co-op senaryosu (08a–08c) ve
    sekiz Node testi önerir. (inceleme düzeltmesi) Tahmini büyüklük ≈ 60 iş günü (± %25). İlk taslak 56,5 gün diyordu; artış,
    inceleme bulgularının adımlara eklenmesinden geliyor (§8.3).

### 0.2 Kararlar

Kullanıcı "bana soru sorma" dediği için her karar **varsayılanla** uygulanır (KARARLAR.md ilkesi). Seçenek sütunu alternatifi verir.

| No | Karar | Uygulanan (varsayılan) | Seçenek | Etki |
|---|---|---|---|---|
| K7-1 | Başarılı blokta can kaybı | **%0.** Bedel dayanıklılıktır (`0,9·hasar + 4`, `player.js:152`). Dayanıklılık yetmezse savunma kırılır, hasar ×0,5 ve sendeleme (bugünkü kırılma dalı) | %12 sızıntı korunur | Görev metnindeki "bloklanan saldırıda hasar 0" ölçütü. Faz 2 §5.10(b) gölge can kuralı ×0,12 → ×0 (tek sabit `BLOCK_LEAK`). (inceleme düzeltmesi) Kullanıcı metni (Aşama 9) "sebepsiz yere hasar vermemeli" der; %0 bunun en katı okumasıdır ve öyle kalır. Sebepli hasar (savunma kırılması, engellenemez saldırı) her zaman bildirimle gelir (R7). Blokta zehir ve yavaşlatma da 0'dır (bugün kalan hasar ≥ 1 ise zehir uygulanıyor, `player.js:156-176`) |
| K7-2 | Telgraf (hazırlık) alt sınırı | Normal **0,40 sn**, engellenemez ve alan saldırısı **0,60 sn**. Bugünkü `hitAt` değerleri (zorluk) korunur; animasyonun yalnız **hazırlık evresi** bükülür (§4.3) | `hitAt` vuruş karesine çekilir (saldırılar hızlanır) | Zorluk değişmez; görüntü hasarla eşleşir |
| K7-3 | Yol bulma | **Navmesh/A\* yok.** Bağlam yönlendirmesi + duvar izleme + kademeli takılma kurtarma + iz belleği (§2.8) | Ada başına kaba ızgarada BFS | Görev metni "navmesh yok" diyor; BFS yalnız 38 N2 tutmazsa ayrı adım |
| K7-4 | Hayaletlerin itişmesi | Hayalet–hayalet ayrışması (0,6 m); oyuncu ve NPC'den geçmeye devam (ruh) | Oyuncuyla da itişme | H-27 |
| K7-5 | Vuruş tepkisi kilidi | Poise ölçeri: tam tepkiden sonra 1,2 sn yalnız üst gövde irkilmesi; hazırlığın son %30'u hafif vuruşla kesilmez. (inceleme düzeltmesi) Ek olarak **bitirici sersemliğine azalan getiri** uygulanır: sersemlik bittikten sonraki 2,0 sn içinde gelen bitirici yalnız `hit` tepkisi verir ve ×1,25 hasar korunur. Parry, karşı saldırı, ağır vuruş ve savunma kırma bu kurala girmez | Yalnız bekleme süresi (ilk taslak; gerçek zincirde 0/10–11 vuruş, N-15) | H-20. Azalan getiri olmadan T8 ölçütü sağlanamaz (`inc_olcum.js` MA) |
| K7-6 | Yılan toslamasında güvertedeki oyuncu | Rastgelelik kalkar: çarpma noktasına (küpeşte) 5 m'den yakın oyuncular hasar alır, diğerleri yalnız sarsıntı | %60 rastgele korunur | Telgraflanmamış rastgele hasar kalkar (yeni bulgu N-5) |
| K7-7 | Dümen ve top erişimi | İstasyon nesneye yaklaştırılır, tutma noktaları erişim sınırına göre yeniden tanımlanır (§5.4) | Gemi modelinde çark direğin kıç yüzüne alınır | Faz 3 C-12 istasyon kısıtları yeniden hesaplanır (çakışma Ç-2) |
| K7-8 | Kamera ve ağaç | (inceleme düzeltmesi) **Karma kural.** Gövde yarıçapı ≥ 0,45 m olan ağaç gövdeleri yeni `GOVDE` katmanına alınır. Kamera bu gövdelere, ancak sonuçta başa olan uzaklığı **≥ 1,2 m** kalıyorsa çarpışır. Gövde başın 1,2 m'den yakınındaysa kamera içinden geçer ve gövde **tamamen** soldurulur. Palmiye (0,32), ince gövde ve taç/yaprak her zaman soldurulur (`veg`) | (a) Bütün ağaçlar soldurulur (Faz 3 R5; ilk taslağın varsayılanı). (b) Kalın gövdelerde koşulsuz çarpışma | Kullanıcının "kamera ... ağaçların ... içinden geçmemeli" isteği (Aşama 10) kalın gövdelerin çoğunda birebir karşılanır. v0.4'te gövde çarpışmasının kamerayı başa sıçrattığı ve bu yüzden kaldırıldığı (`props.js:237` yorumu) gerileme de 1,2 m sınırıyla önlenir. Faz 3 R5 kısmen değişir (Ç-10); ölçüt KM6 |
| K7-9 | Yürüyüş hızları | Oyun hızları **değişmez**; klip hızı doğal yer hızına bağlanır (§5.3). (inceleme düzeltmesi) Doğal hızlar **1,5 cm** destek eşiğiyle ölçülür (N-16). Yürüme klibi kadans sınırıyla kırpılır: yürüyüşte ≤ 3,6 adım/sn (Walking_A için ts ≤ 1,92), koşu ve sprintte ≤ 5,0 adım/sn. Geçiş eşikleri Walk→Run 1,6 m/sn, Run→Walk 1,4 m/sn | 3 cm eşik ve kadans sınırı yok (ilk taslak) | Faz 2 hareket doğrulayıcısı ve Faz 3 testleri etkilenmez. Çömelmede (1,7 m/sn) oran 0,80'e iner; bu bilinçli bir uzlaşmadır |
| K7-9b | Nişan/savunmada geri yürüme hızı | 2,0 → **1,5 m/sn** (geri yürüme klibi 2,3× oynamasın; inceleme düzeltmesi: 1,5 cm eşikle 2,6×, kadans sınırıyla oran 0,74 olurdu) | 2,0 m/sn korunur, klip 2,3× | Küçük denge değişikliği |
| K7-10 | Kök hareketi | Kaçınma ve ağır saldırı kliplerinde yatay kalça hareketi yüklemede sıfırlanır; fiziksel yer değiştirme aynen kalır | Kök hareketi fiziğe dönüştürülür | Görsel/isabet ayrışması kalkar |
| K7-11 | Ağ alanları | Faz 7'nin bütün ağ eklemeleri **tek PROTO artırımında** (Faz 6 değeri + 1) | Ayrı artırımlar | Faz 5 `tel`/`bossFx` taşıması aynen kullanılır |
| K7-12 | Konuğun algı bilgisi | `inCave` ve `underwater` host'ta konumdan hesaplanır; `crouch` konuğun bitidir ama yatay hız > 2,0 m/sn ise yok sayılır | Hepsi konuğun bitleri | Hile ile görünmezlik sınırlanır |
| K7-13 | Büyük ve efsane sandık taşıma pozu | Önde, alt arka kenardan "kucaklama"; büyük/efsane sandıkta sandık öne kaydırılır, üst kenar baş üstüne çıkabilir (kamera +0,3 m yükselir) | Sürükleme pozu (ön kenar yerde) | Kollar 0,42–0,50 m: yan yüzlerden tutmak geometrik olarak olanaksız |
| K7-14 | (inceleme düzeltmesi) Saldırı atılımı (I-09) | Ayaklar yere basılı tam gövde eyleminde atılım 0'dır. Hareket girdisi gelirse eylem üst katmana devredilir (§4.4). Klibin kendisi sıçrıyorsa (AtkHeavy) fiziksel atılım, klipten ayıklanan kök hareketi kadardır | Atılım bugünkü gibi kalır (1,4–2,6 m/sn, `t < hitAt` boyunca; `player.js:522-525`) | Bu bir oynanış değişikliğidir: duran oyuncunun zinciri 0,35–0,94 m daha az ilerler. İlk taslak bunu karar tablosuna almamıştı. Faz 2 §13.5 listesine girer; 40 F12 zincirin isabetini ölçer; Faz 2 06j yeniden koşulur (Ç-15) |
| K7-15 | (inceleme düzeltmesi) Konuğun kaçınma ve blok zamanı | Host konuğun `act{dodge}` niyetini ve blok başlangıcını Faz 5 `act.vt` alanıyla (konuğun gördüğü host zamanı) değerlendirir. Vuruş anı `[max(vt, şimdi − 0,25), vt + IFRAMES]` içindeyse kaçınılmış sayılır; blokta da aynı pencere kullanılır | Bugünkü gibi niyetin alındığı an (Faz 2 §5.10 b) | Konuğun tepki payı RTT 120 ms'de en az 0,25 sn artar. Kötüye kullanım 0,25 sn ile sınırlıdır (Faz 5 K5-8 altyapısı, N-14) |
| K7-16 | (inceleme düzeltmesi) Vuruş karesinin tanımı | Hamle sınıfına göre belirlenir. Kesme, doğrama ve süpürmede silah ucunun (el yuvası +0,7 m) hız tepesi; dürtme ve yumrukta elin ya da ucun kök uzayında en ileri olduğu an; tekmede ayağın en ileri anı; yere vurma ve inişte ayağın ya da elin en alçak anı. Her `STRIKE` girdisi bir kontak sayfasıyla (vuruş karesinin −2…+2 kareleri) gözle onaylanır (§4.3) | İki bilekten büyüğünün doğrusal hız tepesi (ilk taslak) | Dürtmelerde 0,3 sn'lik yanlış düzeltme ve oyuncunun Counter ile tekme hamlelerindeki yanlış değişiklik önlenir (N-12, N-21, N-22) |

### 0.3 Önceki fazlar bu işi zaten çözüyor mu? (bulgu bazında)

"Faz 7'nin işi" sütununda **tam** = bütün düzeltme bu fazda; **tamamlar** = önceki fazın bıraktığı parça; **test** = yalnız
regresyon testi; **yok** = iş yok.

| Bulgu | Faz 2/3/4/5/6 ne yapıyor | Faz 7'nin işi | Adım |
|---|---|---|---|
| H-01 Kraken dokunaç hedefi | Faz 2 §5.9 konuk vuruşunu host'ta geometrik çözer ama hedef yeri yanlış kalır; Faz 6 hikâyeyi toplara bağlayarak bağımlılıktan kaçar (R8) | **tam**: hedef uca ve güverte noktasına | F7-8 |
| H-02 dev boss hasar anı | Yok | **tam** | F7-7 |
| H-03 `hurtBoss` doğrulaması | Faz 2 §5.9/§5.14 iletiyi kaldırır, vuruş host'ta geometrik | **test** (08b) | F7-18 |
| H-04 halka < hasar alanı | Yok | **tam**: tek yarıçap sabiti | F7-6 |
| H-05 kaçınma/blok yan etkileri | Faz 6 S6 B4: `slowHit`/`grab` yalnız gerçek isabette (yalnız `_hitPlayer` yavaşlatması) | **tamamlar**: `hurt` sonuç sözleşmesi geri itme, zehir, boss ve ağ yollarına (§4.5) | F7-1 |
| H-06 hayvan ısırığı | Faz 3 C-15 yalnız basamak/yerçekimi | **tam** | F7-5 |
| H-07 güdümlü küre | Faz 6 `buz_kahini` güdümsüz (taşınmaz) | **tam** | F7-5 |
| H-08 duvar ardından vuruş | Faz 2 §5.4 `opts.los` yalnız **uzak** saldırgan için açık; Faz 3 A5 `segmentQuery` verir | **tamamlar**: düşman→oyuncu, alan, çarpma ve **yerel oyuncunun** vuruşu | F7-3 |
| H-09 düşman hasar anı, donuk poz | Yok | **tam** (inceleme düzeltmesi: dürtmeler hariç; sınıfa göre vuruş karesi, K7-16) | F7-2 |
| H-10 DASH | Faz 6 kullanmıyor | **tam** | F7-9 |
| H-11 siper | Faz 3 §8.4 "`findCover` değişmez" | **tam** | F7-11 |
| H-12 canlı konum izleme | Yok | **tam** | F7-10 |
| H-13 konuk algı değiştiricileri | Faz 5 `st.torch` gönderir ama uygulanmaz | **tamamlar** | F7-18 |
| H-14 blok/kaçınma asimetrisi | Faz 2 §5.10(a) çözer | **test** (08a) | F7-18 |
| H-15 konukta uyarı yok | Faz 5 `tel{n,k,dur}` ve `bossFx{k,…}` **taşıması** | **tamamlar**: uyarı kataloğu ve konuk çizimi (§3.8) | F7-6, F7-18 |
| H-16 rün sütunları konukta yok | Faz 5 `snap.b` taşıması | **tamamlar**: `pl` alanı ve konuk nesneleri | F7-18 |
| H-17 zehir/yavaşlatma/itme konukta yok | Faz 2: patlama ve kaya gölge cana; Faz 5 E-18 patlama | **tamamlar**: `hurt.po`, `hurt.sl` | F7-18 |
| H-18 hikâye bossu tetiklemesi | Faz 2 E-9 (host tetikler, `posOf`), Faz 4 D-17 (`quests.rt`) | **test** (08c) | F7-18 |
| H-19 gece dalgası birikimi | Faz 4 D-07 yüklemede normalize; Faz 6 hikâye gruplarında `max 6`, `allDay` | **tam** (genel `_populate`) | F7-11 |
| H-20 vuruş kilidi | Yok | **tam** (inceleme düzeltmesi: bitirici sersemliğine azalan getiri dahil) | F7-4 |
| H-21 insan boss XP'si | Faz 6 S2 (F-08) | **test** (42) | — |
| H-22 boss isabet hacmi/çarpışma | Faz 3 C-05 büyük hedefte `t` | **tamamlar**: dev boss çarpışması, çok küreli hedef | F7-7, F7-8 |
| H-23 yol bulma | Faz 3: C-16 LOD koruyucu ilerleme, C-17 dikey süpürme, C-12 güverte nesneleri, DG02 testi | **tamamlar**: yönlendirme, kurtarma, eğim | F7-12 |
| H-24 test yok | — | **tam** (37–44) | F7-0 |
| H-25 Yılan ışınlanması, Kraken arazisi | Faz 6 Kraken'i açık denizde doğurur | **tam** | F7-8 |
| H-26 Amiral artığı | Yok | **tam** | F7-8 |
| H-27 hayalet ayrışması | Faz 3 C-11 güverte itişmesi, itmeden sonra resolve | **tamamlar** | F7-11 |
| H-28 sahte isabet | Faz 2 `hit` şemasında `'immune'` var, üreten yok | **tam** | F7-1 |
| H-29 ganimet lavda | Faz 6 hikâye parçasını doğrudan verir | **tam** | F7-7 |
| H-30 yan adım klibi | Yok | **tam** | F7-13 |
| I-01 ayak kayması | Yok | **tam** | F7-13, F7-14 |
| I-02 nişan kamerası duvarda | Faz 3 A5 tabanca namlu→nişan sorgusu atışı düzeltir; A9 pad omzu daraltmaz | **tamamlar**: omuz araması | F7-17 |
| I-03 dümen/top eli | Faz 3 GV02 IK **hedefini** ölçer (çizim eşlemesi) | **tam** | F7-16 |
| I-04 sandık eli | Yok | **tam** | F7-16 |
| I-05 zıplama | Faz 3 yalnız fizik | **tam** | F7-14 |
| I-06 kök hareketi | Yok | **tam** | F7-15 |
| I-07, I-11 kip geçişi | Faz 2 §8.4 kip geçiş tablosu (ağ doğrulaması, oyuncu kodu değil) | **tam**: `Player.setMode` | F7-15 |
| I-08 yüzme pozu | Yok | **tam** | F7-16 |
| I-09, I-10 tam gövde kayması, kesilme | Yok | **tam** | F7-15 |
| I-12 ayak IK | Faz 3 A2a IK'yı çizim evresine taşır | **tam** | F7-16 |
| I-13 kamera nokta/0,4 m | Faz 3 A9: pad 0,25, GORSEL, yeniden sınama | **tamamlar**: duvara dayalı durum | F7-17 |
| I-14 güverte donanımı | Faz 3 C-12 yalnız hareket engeli | **tam** (kamera tarafı) | F7-17 |
| I-15 uzak oyuncu animasyonu | Faz 5 `aq` sayacı aynı klibi yeniden başlatır | **tamamlar**: `ts` ve kaplama bitleri | F7-18 |
| I-16 kalkışta poz sıçraması | Yok | **tam** | F7-15 |
| I-17 kazı | Faz 2 §6.5 kazı host'ta (mantık) | **tam** (animasyon/efekt) | F7-16 |
| I-18 etkileşim animasyonu | Faz 2 §2.10 basılı tutma süresi (mantık) | **tam** (görsel) | F7-16 |
| I-19 güverte ragdoll'u | Yok | **tam** | F7-15 |
| I-20 namlu alevi | Faz 3 A5 "namlu" doğrusunu kullanır | **tamamlar**: `muzzleWorld()` tek kaynak | F7-16 |
| I-21 güvertede yerinde koşu | Faz 3 C-12 güverte engelleri ekler (yerinde koşuyu **artırır**) | **tam** | F7-14 |
| (inceleme) N-11 yılan tükürüğü can hasarı vermiyor | Yok | **tam**: `BossBase._hitPlayer` | F7-1 |
| (inceleme) N-13 öfkede telgraf alt sınırın altında | Yok | **tam**: öfke sonrası taban | F7-2 |
| (inceleme) N-14 konuğun kaçınma/blok zamanı | Faz 5 K5-8 `act.vt` altyapısı (kapalı) | **tamamlar**: `vt` ile kaçınma/blok (K7-15) | F7-18 |
| (inceleme) N-15 bitirici sersemliği zinciri | Yok | **tam** | F7-4 |
| (inceleme) N-17 blok itkisinin birimi | Yok | **tam** | F7-1 |
| (inceleme) N-18 `Enemy.hurt` dönüşü; boss 'blocked' | Faz 6 B3 `lightBound` 'blocked' döndürür | **tamamlar**: dönüş yayılır, boss 'immune' | F7-1 |
| (inceleme) N-19 eğim sınırı uyumu | Yok | **tam** | F7-12 |
| (inceleme) N-23 kendi gemisinde görüş sorgusu | Faz 3 GORUS `gemi` bayrağı | **tamamlar**: saldıranın gemisi hariç | F7-3 |

### 0.4 Çakışmalar (açıkça)

- **Ç-1 Faz 2 §5.10(b) gölge can, blok ×0,12.** K7-1 bunu ×0 yapar. `hostCombat.js` ve `player.js` aynı sabiti (`BLOCK_LEAK`,
  `js/game/combatRules.js`) okur; Faz 2 belgesindeki sayı bilgi amaçlı kalır.
- **Ç-2 Faz 3 C-12 istasyon kısıtı.** Faz 3 dümen itme yarıçapını "istasyon direkten 0,75 m" varsayımıyla ≤ 0,7, topu "1,2 m"
  varsayımıyla ≤ 1,15 alıyor. F7-16 istasyonları yaklaştırır; `deckObstacles` yarıçapları yeni mesafelerden yeniden türetilir
  ve Faz 3 GV03 testi yeni değerlerle koşulur. Faz 3 GV02 (dümende el–tutamak < 0,03 m) IK **hedef vektörünü** ölçmelidir;
  bilek ölçümü 43 H18'dedir.
- **Ç-3 Faz 2 §5.4 `opts.los` yerel oyuncuda kapalı.** F7-3 bilinçli olarak açar (H-08); tek oyunculu davranış değişikliği
  olarak Faz 2 §13.5'teki "kullanıcıya duyurulacak davranış değişiklikleri" listesine eklenir.
- **Ç-4 Faz 2 §5.3 madde 6'daki `hitAt` listesi.** (inceleme düzeltmesi) F7-2 oyuncu tablosunda yalnız `Atk2` 0,27 → 0,18 ve
  `Atk3` 0,36 → 0,45 yapar (§4.3). İlk taslağın `counter` 0,26 → 0,40 ve yumruk-3 0,34 → 0,29 değişiklikleri geri alındı; bunlar
  bilek hız tepesinin örnekleme yapıntısına dayanıyordu (N-21). `hostCombat` değeri tablodan okur (Faz 2 tasarımı böyle), belge
  listesi bilgi amaçlıdır. Faz 2 §5.12 hasar/sn tavanı döngü süresine (`chainAt`, `dur`) bağlıdır, `hitAt`'e değil; değişmez.
  Ancak atılım `t < hitAt` boyunca uygulandığı için (`player.js:522-525`) `hitAt` değişikliği atılım süresini de değiştirir;
  bu etki K7-14 ile birlikte ele alınır (Ç-15).
- **Ç-5 Faz 6 S6 `Player.hurt` sonucu.** Faz 6 B4 yavaşlatmayı "`hurt` sonucu gerçek isabetse" koşuluna bağlar ama sonucun
  tanımını vermez. Kural: S6 sonucu en az `'hit' | 'blocked' | 'parried' | 'dodged'` olarak ekler; F7-1 `'immune'`'u ekler ve
  aynı sonucu geri itme, zehir, boss ve ağ yollarına uygular. S6 eklemediyse F7-1 ekler. İş iki kez yapılmaz.
- **Ç-6 Faz 3 `findCover` "değişmez".** F7-11 değiştirir (H-11). Faz 3 bunu bilinçli bıraktığı için çelişki yok.
- **Ç-7 Faz 5 `tel{n,k,dur}`.** Yalnız varlık kimliği taşır. Konum ve yarıçap gerektiren uyarılar (Kraken güverte noktası,
  lob işaretleri, ateş halkası) `bossFx{k:'tel', …}` ile gider (§3.8). İleti türü eklenmez, alan eklenir (K7-11).
- **Ç-8 Test adları.** audit_I `18_animasyon_senkron.js` ve `19_dovus_animasyon.js` adlarını öneriyor; bunlar Faz 3'ün
  aralığında (KARARLAR.md). Faz 7 yalnız `37`–`44` ve `08a`–`08c` kullanır.
- **Ç-9 "Yeni içerikten önce mevcut davranış testi".** Faz 6 S6 yeni türleri ekler; F7-0 kod değiştirmediği için **Faz 6 S6'dan
  önce** koşulabilir ve koşulmalıdır (kullanıcının "yeni içerik eklemeden önce mevcut davranışları test et" isteği).
  (inceleme düzeltmesi) F7-0 Faz 2–5'ten sonra koşulur. Bu yüzden tabanı v0.4 değil, **o anki koddur**. Belgedeki "bugün"
  sütunları v0.4 ölçümüdür. F7-0 kendi taban dosyasını (`tests/out/faz7_taban.json`) yazar ve ölçütler bu dosyaya göre
  değerlendirilir. Yeni araç gerektiren kontroller (`DK.anim.violations`, `enemies.stats`) gözlem kipinde "uygulanamaz" diye
  raporlanır. Sıra değişikliği KARARLAR.md'ye "F7-0, Faz 6 S6'dan önce" diye yazılmalıdır.
- **Ç-10 (inceleme düzeltmesi) Faz 3 R5 ("kamera BITKI'yi görmez").** K7-8 kalın gövdeleri (r ≥ 0,45) yeni `GOVDE` katmanına
  taşır ve bu katmanı, 1,2 m koşuluyla, kamera sorgusuna ekler. Faz 3 §7.3 atama kuralı bozulmaz: `GOVDE` ayrı bir katman bitidir; HAREKET,
  GORUS ve MERMI maskelerine BITKI ile birlikte eklenir, böylece bu maskelerde davranış değişmez. KAMERA maskesine yalnız `GOVDE`
  girer, BITKI girmez. Faz 3 17 K08 orman testi KM6 ile birlikte koşulur.
- **Ç-11 (inceleme düzeltmesi) Faz 6 B3 `lightBound` ve `Enemy.hurt` dönüşü.** Faz 6 'blocked' değerini `applyDamage`'dan
  döndürüyor. Bugün `Enemy.hurt`, `applyDamage`'ın dönüşünü yok sayıp her zaman `'hit'` döndürüyor (`enemies.js:363-364`).
  F7-1 sözleşmesi dönüşün yayılmasını şart koşar. Bu iş Faz 6 S6'da yapılırsa F7-1 yalnız sınar; iş iki kez yapılmaz.
  `lightBound` 'blocked' olarak kalır, çünkü öğretici geri sekme Faz 6'nın kararıdır.
- **Ç-12 (inceleme düzeltmesi) Faz 8 LOD API'si.** Faz 8 taslağı `lod.simTier()` ve `lod.animStep()` sorularını tanımlıyor
  (`faz8_tasarim.md` §3.9, R13). İlk taslağın `enemies.lodPolicy()` işlevi aynı işi ikinci kez planlıyordu. Bu yüzden §7
  daraltıldı: Faz 7 yalnız değişmezleri, sayaçları ve kendi yeni sorgularının bütçe kuyruğunu tanımlar; politika API'si
  Faz 8'indir.
- **Ç-13 (inceleme düzeltmesi) Faz 6 S13 `ocean.levelAt(x, z)`.** Kraken yörüngesi ve Yılan'ın su sınaması `ocean.tide` yerine
  `ocean.levelAt`'i kullanır. Büyük Cezir lagününde gelgit tek değer değildir.
- **Ç-14 (inceleme düzeltmesi) Faz 5 bit alanları.** Faz 5 `st.fl` biti 1'i dürbüne ayırıyor. `snap.p.flags` içindeki `eq` ve
  `torch` bitlerinin düzeni Faz 5'te yazılı değil. Faz 7'nin crouch (2), tread (4), climb (8) ve fish (16) bitleri `schema.js`'te
  **tek bir bit tablosuna** yazılır, Faz 5 bitleriyle çakışmadığı Node `net_schema` testinde denetlenir.
- **Ç-15 (inceleme düzeltmesi) Faz 2 atılım ve hareket doğrulayıcısı.** K7-14 atılımı duran tam gövde saldırılarında 0'lar.
  Faz 2 §5.4 vekil saldırgan konumu (`posOf`) ve §8 hareket doğrulayıcısı atılım yer değiştirmesini meşru sayıyordu; bu değer
  küçülür, Faz 2 06j `--latency 120` yeniden koşulur. Davranış değişikliği Faz 2 §13.5 listesine eklenir.
- **Ç-16 (inceleme düzeltmesi) Faz 6 B1 `icebolt` ve yeni bosslar.** Faz 6'nın `buz` mermisi isabette `slowT` veriyor (B1).
  Bu, sözleşme dışında kalan yeni bir yavaşlatma yoludur; `opts.slow` ile §4.5'e bağlanır. Faz 6'nın üç yeni bossu (Kor Selim,
  Madenbaşı Gümüşdiş, Gelgit'in Gölgesi) `enemies.js` çatısını kullanıyor. 8 boss özelliği için bunlar da sınanır (42 IB8).

### 0.5 Doğrulama (H ve I için karşıt doğrulama yoktu; burada yapıldı)

| Bulgu | Sonuç | Kanıt |
|---|---|---|
| H-01 | Doğru | `kraken_hitbox.cjs`: sloop R=38 m'de 1296 durumun 100'ünde (%7,7) erişilebilir, hedef ortalama 8,33 m dışarıda; brigantine R=30'da %31 |
| H-02 | Doğru (inceleme düzeltmesi: büyüklük) | `glb_peak.mjs`: `Punch`/`Weapon` kol tepesi 0,313 klip sn (klip 0,833); bu bir **açısal hız** tepesidir. `inc_giant.mjs`: `Punch`'ta sağ el en ileri 0,50 klip sn (hız tepesi 0,333), `Weapon`'da sol el önden 0,458, `Jump_Land`'de ayak en alçak 0,167 (ilk taslak 0,104). Tarayıcı M8b vuruş karesini 0,313 klip sn varsayıyordu. Düzeltilmiş fark: slam 1,100 − 0,667 = **+0,43 sn**, süpürme 0,9 − 0,573 = **+0,33 sn** |
| H-04 | Doğru | Kod: `bosses.js:318` (2,8 × büyüme), `:328` (< 3,4, 3B); `:499` (4,5), `:506` (< 6,5, 3B) |
| H-05 | Doğru | `enemies.js:1004-1007`, `bosses.js:45`, `player.js:144-147` |
| H-06 | Doğru | `animals.js:503-508` (`melee`/`attacker` yok, `bite` aynı karede) |
| H-07 | Doğru | `enemies.js:1483-1486` güdüm sürer; `:1506` kaçınmada `dead=false; continue` |
| H-08 | Doğru | `enemies.js:979-998`, `bosses.js:606-619`, `enemies.js:1431-1455`, `combat.js:188-232`'de görüş hattı yok |
| H-09 | (inceleme düzeltmesi) **Kısmen doğru** | `enemy_moves.mjs` iki bilekten büyüğünün doğrusal hız tepesini alıyor. Bu yüzden Atk1, axe Atk1, shield Atk1, Atk2H, Heavy2H ve SPIN'de **sol** bilek ölçülmüş; tekmede bilek kullanılmış. `inc_strike.mjs` sınıfa göre ölçtü (silah eli, uç ve en ileri erişim). Gerçek gecikmeler: Atk2 +0,21 (uç), Atk2H +0,15, Heavy2H +0,14 (uç), Punch2 +0,13 (erişim), DASH +0,33 ve 0,33 sn donma. Ayrıca shield Atk1 +0,07 (uç). Sınırdakiler: axe Atk1 +0,06, Kick +0,06 (ayak en ileri 0,39), DualChop +0,02…+0,07. DualSlice −0,06…−0,21 (erken; kontak sayfasıyla karar). **Yapıntı:** AtkStab, Stab2H ve DualStab'ın en ileri erişimi `hitAt` ile örtüşüyor (+0,01 / −0,02 / 0,00) |
| H-10 | Doğru | Tarayıcı M6: 30 sn'de 13 yakın saldırı başlangıcı, 0 DASH, en küçük başlama uzaklığı 2,39 m |
| H-11 | Doğru | Tarayıcı M4: 8 sn'de 1 atış; ~1,3. sn'de `cover`, ~4,0. sn'de `investigate` (0,67 sn aralıklı örnekleme) |
| H-12 | Doğru | Tarayıcı M3b: görüş 2 sn kesikken 120/120 adımda yeni (canlı) konuma, 0 adımda son görülen noktaya yöneldi |
| H-13 | Doğru | `net.js:87-124` `crouch/torch/inCave/underwater/action` kopyalanmıyor |
| H-19 | Doğru | Tarayıcı M7: `sahil_gece` 3 gecede canlı üye sayısı 2, 2, 4, 4, 6, 6 (gece/gündüz sırasıyla) |
| H-20 | Doğru (inceleme düzeltmesi: ölçüm düzeni ve kök neden) | Tarayıcı M5b: 10 sn'de 23 savuruş; düşman 7 saldırı başlattı, **0'ında** vuruş anına ulaştı. Ancak M5b `chainAt`'i atlıyordu. `inc_olcum.js` MA gerçek zincirle ölçtü (18 savuruş): 10–11 başlatma, **0** vuruş, 6 `hit` ve 6 sersemlik girişi. K7-5 ilk biçimi öykünüldüğünde yine 0; bitirici azalan getirisiyle 6 başlatmadan 2 vuruş (3/3 koşu). Kök neden bitirici sersemliğidir (`enemies.js:401-402`) |
| H-22 | Doğru | `bosses.js` `physics`'i içe aktarmıyor; yarıçap `height·0,18` (`:580`); hayalet gemi hedefi `gs.y+3` (`:1008`) + `height·0,5` (`combat.js:58`) |
| H-23 | Doğru + ek | Tarayıcı M2: U (12 m) ve 20 m düz duvar → 30 sn'de ulaşılamadı (en yakın 6,72 / 6,81 m; 5. sn'de `investigate`, 15. sn'de `patrol`). **Yeni:** M1b (yukarıda madde 2) |
| H-25 | Doğru | `serpent_dive.cjs`: 432 örnekte ortalama 21 m, en çok 27,1 m sıçrama |
| H-27 | Doğru | `enemies.js:1366` (`!o.T.ghost`), `crowd.js:21` |
| H-30 | Doğru + ek | Yan adımda klip seçimi yok (`enemies.js:1148-1160`). **Yeni:** düşman yürüyüş kayması (`gait.mjs`): haydut devriyesi 1,5 m/sn oran 0,51, kovalama 4,3 m/sn 0,72, iskelet 1,2 m/sn 0,48 (inceleme düzeltmesi: 1,5 cm eşikle 0,42 / 0,75 / 0,42) |
| I-01 | Doğru (inceleme düzeltmesi: değerler) | `gait.mjs` (5 gövde, destek ayağı yöntemi, **3 cm** eşik): doğal yer hızı `Walking_A` 0,82–0,88, `Walking_Backwards` 0,81–0,87, `Running_A` 3,46–3,67, `Running_C` 3,53–3,74, yan adım 3,36–3,62 m/sn. Bu eşikte yürümede döngünün %90'ı destek sayılıyor. Doğal hızdaki kalan kayma medyanı da 0,27 m/sn (yürüme) ve 0,34 m/sn (koşu); yani ölçüt (2) bu tanımla hiçbir eşlemede sağlanamaz. `inc_gait_med.mjs` / `inc_gait_med2.mjs` **1,5 cm** eşikte ölçtü: Walking_A 0,71, Walking_Backwards 0,77, Running_A 3,75, Running_C 3,79, Strafe L/R 3,75 / 3,67, WalkSk 0,54, WalkC 0,46, RunB 2,36 m/sn. Kalan kayma medyanı 0,06 / 0,13 / 0,25 / 0,11 m/sn |
| I-02 | Doğru | `camtest/run.mjs` (gerçek `camera.js` + `physics.js`): nişanda duvar 0,4 m sağdayken kamera (0,25; 1,59; 0,40) → kutunun içinde; içeriden çıkan ışında `lineBlocked = false` |
| I-03 | Doğru | `char3.mjs`: dümen 0,39–0,53 m, top 0,34–0,37 m (4 gövde × 3 boy) |
| I-05 | Doğru | `char4.mjs`: `Jump_Start` ayak kalkışı 0,29 klip sn = 0,19 oyun sn |
| I-06 | Doğru | `char4.mjs`: Dodge_F 0,27, Dodge_B 0,67, Dodge_L/R 0,56 m; AtkHeavy 0,50 m ileri gidip döner; Death 0,37 m |
| I-08 | Doğru | `char2.mjs`: gövde–bacak açısı yüzmede 129°, dalışta 122° |
| I-10 | (inceleme düzeltmesi) **Kısmen doğru** | `char5.mjs`: Atk2 +0,11, Counter −0,14; Punch klibin %70'i, Punch2 %67'si oynuyor. Atk2 (+0,09; uç 0,18) ve Atk3 (−0,10; uç 0,46) doğru. **Counter yapıntı:** `Block_Attack`'ta sağ bilek ≤ 1,4 m/sn hızla neredeyse kıpırdamıyor. Profilde iki küçük tepe var; N = 200 örneklemede 0,40, N = 240 örneklemede 0,24 çıkıyor. Kılıç ucunun tepesi 0,305 oyun sn, yani bugünkü 0,26 tolerans içinde (`inc_profile.mjs`). Tekmede ayağın en ileri anı 0,32 sn; bugünkü 0,34 doğru (`inc_strike2.mjs`) |
| I-12 | Doğru | `ik.ground` yalnız okunuyor (`character.js:860, 920, 923`), hiçbir yerde atanmıyor |
| I-13 | Doğru | `camtest`: sırtı duvara 0,35 m → kamera (0,05; 1,59; 0) kutunun içinde |
| I-17 | Doğru | `char7.mjs`: kürek ucu en alçak 0,30 m (1,17/1,92 sn), sol bilek–sap 0,13–0,38 m |
| I-20 | Doğru | `char4.mjs` nişan pozu: namlu (−0,19; 1,30; 0,61), alev (0; 1,45; 0,6) |
| Diğerleri (H-03, H-14…H-18, H-21, H-24, H-26, H-28, H-29; I-04, I-07, I-09, I-11, I-14…I-16, I-18, I-19, I-21) | Doğru | Kod okuması; satırlar ilgili bölümlerde |

**Bu belgede ilk kez kaydedilen bulgular:**

| No | Bulgu | Kanıt |
|---|---|---|
| N-1 | `patrolPoint` yalnız arazi yüksekliğine bakıyor; çarpıştırıcı içi ve erişilemez nokta seçebiliyor | `enemies.js:1379-1386`; M1b'de 6 noktanın 1'i çarpıştırıcı içinde, 6'sına da 60 sn'de varılamadı |
| N-2 | Takılma ölçütü olarak yalnız hız yetmiyor: sapma döngüsündeki düşman hızlı ama ilerlemesiz | M1: 0 adet "2 sn < 0,2 m/sn", aynı düzende M1b: pencerelerin %72–86'sı ilerlemesiz, düşman başına 1–21 sapma |
| N-3 | `Running_Strafe_*` kliplerinin doğal hareket yönü 90° değil, ileriye ~60° | `gait.mjs`: yön (0,87; 0,49) |
| N-4 | Kol erişimi 0,42–0,50 m, omuz 0,94–1,11 m: taşıma, tırmanma, dümen ve topta hedefler sınırda ya da dışında; tırmanma hedefi 1,85 m ulaşılamaz | `reach.mjs`; `character.js:879-911` |
| N-5 | Yılan toslamasında güvertedeki oyunculara %60 rastgele, telgrafsız hasar | `bosses.js:472` |
| N-6 | Dev bossların yay saldırılarında (süpürme) tam daire uyarısı çiziliyor; hasar ±1,25/±1,3 rad yayda | `bosses.js:597-604`, `:723`, `:879` |
| N-7 | Uyarı halkaları %35–50 yarıçaptan büyüyor; uyarının başında son yarıçap görünmüyor | `bosses.js:318`, `:601`; `enemies.js:958` |
| N-8 | Lob isabetinde 3B mesafe + 0,4 m; halka `aoe` | `enemies.js:1423`, `:1440` |
| N-9 | `Atk2H` hasarı vuruş karesinden 0,15 sn sonra; `Kick` ayak tepesinden ≈ 0,12 sn sonra | `enemy_moves.mjs`, `glb_peak.mjs` |
| N-10 | Düşman yürüyüş klipleri de doğal hızla eşlenmemiş | `enemies.js:1154-1156`; `gait.mjs` |

**İncelemede kaydedilen bulgular (inceleme düzeltmesi):**

| No | Bulgu | Kanıt |
|---|---|---|
| N-11 | Derinlik Yılanı tükürüğü can hasarı vermiyor; konuğa ne hasar ne zehir gidiyor | `SeaSerpent`'te `_hitPlayer` yok (`bosses.js:391-556`); `enemies._impact` `s.owner?._hitPlayer` (`enemies.js:1442`), zehir yalnız `t.id === G.myId` (`:1443`); tarayıcı MB: `typeof _hitPlayer = 'undefined'`, isabette can 100 → 100 |
| N-12 | Dürtmelerde (AtkStab, Stab2H, DualStab) bugünkü `hitAt` en ileri erişimle örtüşüyor; H-09'un bu üç maddesi yapıntı | `inc_strike.mjs`: en ileri 0,57 / 0,64 / 0,55 ↔ `hitAt` 0,58 / 0,62 / 0,55 |
| N-13 | Öfkede telgraf alt sınırın altına iniyor | `enemies.js:921-922`; tarayıcı MD (Morvan): Atk1 0,35, Atk2 0,367, Atk3 0,433, AtkStab 0,483, SPIN 0,583 sn |
| N-14 | Konuğun kaçınma ve blok zamanı: host iframes'i niyetin alındığı andan sayıyor; NetInterp D ve RTT/2 telgrafı kısaltıyor | Faz 2 §5.10(b) `cs.iframesUntil`; Faz 5 §3 D 100–350 ms; konuk `hurt` yerelde `invuln` ile döner (`player.js:144-147`), gölge can ise düşer → sonra `hp{v}` düzeltmesi (Faz 2 §5.10 d) |
| N-15 | Bitirici sersemliği gerçek zincirde düşmanı kilitliyor; K7-5'in ilk biçimi yetmiyor | `combat.js:21` (`finisher`), `enemies.js:401-402`; tarayıcı MA (3 değişke × 3 koşu): bugün 0/10–11, K7-5 öykünmesi 0/10–11, + azalan getiri 2/6; `inc_poise_sim.py` modeli aynı sonucu verir |
| N-16 | Doğal hız destek eşiğine duyarlı (yürüme %20); 3 cm eşikte ölçüt (2) hiçbir eşlemede sağlanamaz | `inc_gait_med.mjs`: Walking_A 0,87 (3 cm) / 0,71 (1,5 cm); doğal hızda kalan medyan 0,27 / 0,06 m/sn |
| N-17 | Blok geri itmesinin birimi yanlış: `knock` hız değil itkidir; güvertede başka formül işliyor | `player.js:541-545` (`vel += knock·60·dt`, sönüm `exp(−9dt)`), `:839-842` (güverte, ×4); `inc_knock.py`: itki 1,5 → tepe 3,6 m/sn ve 0,87 m; 0,6 → 1,45 m/sn ve 0,32 m |
| N-18 | `Enemy.hurt`, `applyDamage` dönüşünü yok sayıyor; `BossBase.applyDamage` dokunulmazlıkta 'blocked' döndürüyor, kılıç geri sekiyor | `enemies.js:363-364`; `bosses.js:109`; `combat.js:226-229` |
| N-19 | Düşman eğim sınırı (öneri 40°) oyuncununkinden sıkı; 40–53° yamaç oyuncuya sığınak olur | `player.js:550` (kayma n.y < 0,68), `:577` (tırmanma n.y < 0,6); §2.8 ilk taslak n.y < 0,77 |
| N-20 | Hayaletler yerden 0,25 m yüksekte süzülüyor; ayak kayması ölçütü onlara uygulanamaz, yalnız kadans uygulanabilir | `enemies.js:1195-1196`; gece hızı 3,9 × 1,18–1,35 (`:738`) → `Running_B` (2,36) ile ts 1,95–2,25 |
| N-21 | Oyuncu Counter ve tekme için önerilen `hitAt` değişiklikleri yapıntıya dayanıyor | `inc_profile.mjs` (Counter: R bileği ≤ 1,4 m/sn, uç tepesi 0,305 sn); `inc_strike2.mjs` (tekme: ayak en ileri 0,32 sn) |
| N-22 | Dev boss vuruş kareleri açısal hız tepesinden alınmış | `inc_giant.mjs`: `Punch` el en ileri 0,50 (açısal 0,313), `Weapon` 0,458, `Jump_Land` ayak en alçak 0,167 (0,104) klip sn |
| N-23 | Faz 3 GORUS maskesindeki `gemi` bayrağı, yerel oyuncunun yakın dövüş görüş sorgusunu güverteden su düzeyine bakarken kesebilir; "Yılan sersemledi — başına vur" mekaniği bozulur | Faz 3 §7.3 GORUS; `camera.js:15-29` `hullSolid` (küpeşte bandı güverte +0,75 m); `bosses.js:480` (sersem baş y ≈ 1,2) |
| N-24 | A3, A5 ve A6 ölçütleri belgenin kendi formülleriyle çelişiyor | Tarayıcı MC: eğilmiş 0,5× 3,88 sn (A5 "4 sn fark yok"); gece meşalesiz 0,45× 4,73 sn (A3 "≤ 3 sn"); meşaleli 1,1× 4,68 sn (A3 "≤ 4 sn"); A6'da silah sesi engelden sönmez (§2.2) |
| N-25 | LOD politika API'si Faz 8 taslağıyla iki kez planlanıyor | §7 `enemies.lodPolicy` ↔ `faz8_tasarim.md` §3.9 `lod.simTier/animStep` |
| N-26 | Faz 6 `icebolt` yavaşlatması ve Faz 6'nın üç bossu sözleşme ve testlerde yok | Faz 6 §5.2 B1, `kor_selim`, `madenbasi`, `gelgit_golgesi` |
| N-27 | `findCover` saklanma mesafesi `c.r + 0,7`; ilk taslak 0,6 yazıyordu | `enemies.js:1397` |
| N-28 | Parry'de boss sersemliği 1,7 × 0,6 = 1,02 sn; F4'teki "boss ≥ 0,6" yanlış. Dev bosslarda `stun` yok, parry sersemletmez | `player.js:200`, `enemies.js:448`; `GiantBase` (`bosses.js:561-632`) |
| N-29 | KM7 "sandık pikseli" ölçüm yöntemi tanımsız; KM-c davranışı Faz 3 pad'iyle zaten karşılanıyor (yakın düzlem köşeleri kameradan 0,17 m) | yakın düzlem 0,1 m, FOV 70°, 16:9 |

---

## 1. Mevcut durum haritası

### 1.1 Algı modeli

| Bileşen | Bugünkü kod | Değer | Durum |
|---|---|---|---|
| Algı sıklığı | `Enemy.update` → `_perceive` ~6 Hz (`enemies.js:644-652`, `thinkT = 0,16`) | — | Çalışıyor |
| Görüş mesafesi | `vis = T.vision` (`:542`) | 16–40 m (türe göre, §1.6) | Çalışıyor |
| Gece | `night && !T.ghost` → `torch ? ×1,15 : ×0,5` (`:544`); `sky.isNight()` ikili (`sky.js:230`, 5,5–19,5 dışı) | Alacakaranlık yok | Geliştirilmeli |
| Mağara | `inCave > 0,5 && !torch` → ×0,45 (`:545`) | — | Konukta yok (H-13) |
| Hava | `fog = weather.fog·0,5 + weather.rain·0,25`, `vis ×= 1 − fog` (`:535`, `:546`) | — | Bölgesel sis (`sky.regionFog`, `sky.js:278-285`) ve Faz 6 `sky.zones` yok |
| Duruş | Eğilme ×0,55, yüzme ×0,6, su altı ×0,15, hedef 5 m yukarıda ×0,8 (`:547-549`) | — | Konukta eğilme/su altı yok (H-13) |
| Görüş konisi | `ang = abs(açı)·2` derece, `ang < T.fov`; 3,2 m (eğilmede 1,8 m) içi koni dışında da görür (`:551-554`) | FOV 110–360° | Çalışıyor, olumsuz test yok |
| Görüş hattı | `physics.lineBlocked(göz y+1,6·ölçek → hedef y+1,4 / 0,9)` (`:555`); varsayılan oransal uç payı (`physics.js:195`) | — | Faz 3 A5'te `segmentQuery(GORUS)` |
| Fark etme hızı | `rate = (1,8 − d/vis·1,5) × (merkez ? 1 : 0,55) × (hız > 3 ? 1,4 : hız > 0,5 ? 1 : 0,6)`; yakında 6; saldıran ×2 (`:558-560`) | Farkındalık 0–1,2 | Çalışıyor |
| Unutma | `patrol/suspicious`'ta −0,18/sn (`:571`) | — | Çalışıyor |
| Duyma | `hear(e)`: `d < radius × T.hearing × (dinlenme ? 0,8 : 1)` (`:577-594`) | — | Duvar sönümü yok, yağmur maskesi yok |
| Ses kaynakları | Adım 1,2/3,5/6,5/11 m × taşıma 1,4 (`combat.js:92-98`); kılıç 9 m (`:165`); oyuncu tabancası 45 m (`:253`); düşman tabancası 40 m (`enemies.js:1065`); top 90 m (`combat.js:311`); patlama 70 m (`:46`); konuk sesi `netNoise` (`:83`) | — | Çalışıyor |

### 1.2 Durum makinesi (bugün 18 durum)

Karar katmanı `_think` (`enemies.js:658-702`, ~6 Hz), eylem katmanı `_act` (`:733-861`, her adım).

| Durum | Giriş | Çıkış | Not |
|---|---|---|---|
| `patrol` | başlangıç, `return` sonu | görürse `chase` (ya da `callHelp`), şüphe ≥ 0,35 → `suspicious`, ses → `investigate`/`suspicious` | Nöbetçi/dinlenen yerinde bakınır (`:742-747`) |
| `suspicious` | farkındalık 0,35–1 | 3,5 sn sonra > 0,55 → `investigate`, değilse `patrol` | Sese/görüntüye döner (`:755-758`) |
| `investigate` | ses, grup alarmı, kayıp | 9 sn → `return` (`:684`) | Son bilinen noktaya `walk·1,8` ile gider, 1,5 sn'de bir rastgele bakınır (`:760-764`) |
| `return` | `investigate` sonu, tasma (`:688-690`) | eve 3 m → `patrol` | Can %3/sn yenilenir (`:765`) |
| `chase` | görme, vuruş (`_aggro` `:419-424`) | kayıp 2,5/6 sn → `investigate` (`:679-683`) | `_meleeOrStrafe` (`:872-899`) |
| `strafe` | jeton yok | jeton alınca `chase` | Kuşatma halkası 4,3 (kuşatmacı 3,2) m |
| `attack` | `_startMelee`, `_startRanged` | `dur` sonunda `chase` (zincir olasılığı) | `_attackUpdate` (`:941-977`), `_rangedUpdate` (`:1033-1052`) |
| `cover` | menzilli + `T.cover` | 14 sn, d < 4 | H-11 |
| `retreat` | insan, %30 can, 18 m'de müttefik | hedefe varınca `heal` | `:694`, `:795-803` |
| `heal` | `retreat` sonu | 1,6 sn | +%30 bir kez |
| `flee` | moral | 12 sn ya da varış → `return`/kaldırılma | `:695`, `:709-716` |
| `hit` | hafif vuruş (poise'sız) | 0,45 sn | H-20 |
| `stunned` | parry, karşı saldırı, bitirici | `stunT` | Boss ×0,6 (`:448`) |
| `dodge` | `T.dodge` (avcı) | 0,45 sn | Fiziksel 7 m/sn × 0,38 sn |
| `summon` | boss can eşiği | 2,2 sn | Taunt 1,03 sn → donuk poz (H-09) |
| `callHelp` | ilk görme (`T.callHelp`) | 1,0 sn | İlk temas vuruşsa tetiklenmez (ek-141) |
| `rise` | iskelet kalkışı | 2,2 sn | Dokunulmaz |
| `dead` | can 0 | 20–24 sn sonra gömülme | `rise` ile dirilme |

Faz 6 `surrender`, `buried`, `emerge` durumlarını ekler (B2, B5); Faz 7 bunları korur.

### 1.3 Grup davranışı

| Davranış | Kod | Değer | Durum |
|---|---|---|---|
| Grup alarmı | `_groupAlert(30)` (`enemies.js:719-730`): aynı fraksiyon (insan dışı fraksiyonlar birbirine) 30 m içinde `investigate`, farkındalık ≥ 0,9 | Anında, engelsiz | Test yok |
| Yardım çağrısı | `callHelp` (`:766-776`) 45 m + `rally` (`:1369-1371`) +%20 hasar 20 sn | — | İlk temas vuruşsa yok (`_aggro` `:419-424`) |
| Saldırı jetonu | `requestToken` (`:1339-1347`): kolay 1, normal 2, zor 3; boss/mini boss jetonsuz (`:609`) | — | Uzaklaşan sahibin jetonu kalıyor (`:1343` yalnız ölü/hedef değiştiren) |
| Kuşatma | `flankAngle` (`:1349-1362`) 8 aday açı, diğer kuşatanlara uzaklık + hedefin arkası; halka noktası `sin(t·0,4)·0,3` salınımlı (`:891-895`) | — | Nokta çarpıştırıcı içinde olabilir (denetim yok) |
| Siper | `findCover` (`:1388-1405`) yalnız `haydut_nisanci`, `physics.all` taraması 6 Hz | — | H-11 |
| Geri çekilme / iyileşme | `:691-696`, `:795-803` | %30 can, 12 m | Hedefin tam tersine (müttefiğe ya da sipere değil) |
| Moral | `T.morale` eşiğinde %25 kaçış (`:695`); lider ölünce %55 kaçış (`:1372-1377`) | — | Test yok |

### 1.4 Kaybetme ve arama

Kayıp sayacı `lostT` (`enemies.js:679-683`) 2,5 sn (6 m içinde 6 sn) dolunca `investigate`: son bilinen noktaya gider, orada
9 sn rastgele bakınır, sonra eve döner. Arama deseni yok. Kayıp sürerken `_act` hedef olarak `tgt.pos`'u, yani oyuncunun canlı
konum nesnesini kullanır (`_targetInfo` `:514-517` `pos: pl.pos`), bu yüzden düşman duvar ardındaki yeni konumu bilir (H-12).

### 1.5 Hareket ve takılma önleme

`Enemy._move` (`enemies.js:1072-1146`): hedef yönü → sapma varsa döndür (`:1081-1086`) → 1,3 m ileri sonda `physics.resolve`
ile itilirse yönü büker (`:1088-1090`) → su kontrolü (`:1092-1095`; uçurum kontrolü yorumda var, kodda yok) → komşu ayrışması
1,4 m (`:1101-1106`) → ivme 6/10 → `physics.resolve` (`:1123`) → 1,2 sn'de ilerleme < 0,35 m ise ±63° sapma 1,4 sn (`:1126-1139`).
`y` her adımda zemine oturur (`_place` `:1197`, 0,65 m basamak). Yol bulma yok.

**Tarayıcı ölçümleri (`olcum_ai.json`, `olcum_ai2.json`):**

| Ölçüm | Düzen | Sonuç |
|---|---|---|
| M1 | Oyuncunun 600 m çevresinde çarpıştırıcısı en yoğun kara hücresi (168, −56), 32 çarpıştırıcı; 6 haydut devriyede, algı kapalı, 60 sn | Düşman başına "2 sn'den uzun < 0,2 m/sn" aralığı **0**; en uzun yavaşlık 0,27–0,53 sn; sapma sayısı 1–21 |
| M1b | Aynı düzen | Her düşman 60 sn boyunca **tek** devriye noktasıyla kaldı ve **hiçbiri varamadı**; 50 pencereden 36–43'ünde ilerleme < 0,35 m; 6 noktanın 1'i çarpıştırıcı içinde |
| M2-U | 12 m U duvar, hedef arkasında, düşman ağızda | 30 sn'de ulaşamadı, en yakın 6,72 m; 5. sn `investigate`, 15. sn `patrol` |
| M2-düz | 20 m düz duvar | 30 sn'de ulaşamadı, en yakın 6,81 m |

### 1.6 17 türün tablosu

Hasar anı sütunu: `enemy_moves.mjs` ölçümü, "hasar − bilek hız tepesi" (oyun saniyesi; + geç, − erken). (inceleme düzeltmesi)
Bu sütundaki dürtme değerleri (AtkStab +0,30, Stab2H +0,31, DualStab +0,28) yapıntıdır; sınıfa göre değerler §1.7a'dadır.
Test durumu beş sınıftır:
**ÇT** çalışıyor-test edilmiş, **ÇG** çalışıyor-geliştirilmeli, **H** hatalı, **E** eksik, **D** doğrulanmamış.

| Tür (`enemies.js` satırı) | Algı: görüş m / FOV° / işitme × | Saldırılar | Hasar anı sapması | Hareket | Bilinen hatalar | Test |
|---|---|---|---|---|---|---|
| `haydut` (81-86) | 24 / 125 / 1,0 | `sword1h`: Atk1, Atk2, Atk3, AtkStab | +0,07 / **+0,23** / −0,03 / **+0,30** | 4,3 / yürü 1,5; devriye, dinlenme, nöbet | H-08, H-09, H-12, H-20, H-23, N-10 | ÇG (05: 18/18'in çoğu bu türle) |
| `haydut_nisanci` (87-92) | 32 / 110 / 1,0 | `fists` + tabanca (nişan 0,95, dolum 2,4, mesafe 9–17 m), siper | Punch +0,10, Punch2 **+0,14**, Kick ≈ +0,12 | 3,9 / 1,4 | H-11, H-12 | H (yalnız coop 06b F-06) |
| `haydut_agir` (93-98) | 20 / 110 / 0,8 | `shield`: Atk1, Counter (kalkan darbesi), Atk3; kalkan 0,85, arkadan ×1,6, poise | +0,10 / +0,06 / +0,01 | 3,0 / 1,2 | H-14 (Faz 2) | ÇG (05 zayıf nokta) |
| `haydut_avci` (99-104) | 30 / 140 / 1,4 | `dual`: DualSlice, DualChop, DualStab; kuşatmacı, kaçınma 0,3, bıçak atışı | −0,06 / +0,02 / **+0,28** | 4,9 / 1,6 | H-09, H-30 | D |
| `haydut_kaptani` (105-110, mini boss) | 26 / 130 / 1,1 | `twoh`: Atk2H, Stab2H, Heavy2H (engellenemez, alan 2,2); parry 0,25; yardım çağrısı, toplanma | **+0,15** / **+0,31** / **+0,16** | 3,9 / 1,4 | H-09, ek-141 | D |
| `kizil_hancer` (111-116, insan boss) | 30 / 140 / 1,2 | `sword1h` + tabanca (6–18 m); parry 0,35; %55 çağırma; %30 duman → geri çekilme + iyileşme | `haydut` ile aynı | 4,5 / 1,5 | Taunt 1,03 sn / çağırma 2,2 sn → 1,2 sn donuk (H-09); XP (H-21, Faz 6) | ÇG (05 evreler) |
| `iskelet` (118-122) | 20 / 120 / 1,2 | `sword1h`; %30 dirilme | `haydut` ile aynı | 3,4 / 1,2 (`WalkSk`) | H-19, N-10 | D |
| `iskelet_nisanci` (123-127) | 30 / 110 / 1,0 | `fists` + çift el arbalet (1,1 / 2,0 / 10–18 m); %20 dirilme | `fists` gibi | 3,2 / 1,2 | Siper yok; ok savuşturma yalnız yerel | D |
| `iskelet_agir` (128-132) | 18 / 110 / 0,8 | `shield`; kalkan 0,8, arkadan ×1,5, poise; %15 dirilme | `shield` gibi | 2,7 / 1,0 | — | D |
| `iskelet_altin` (133-137) | 22 / 120 / 1,0 | `sword1h`; kalkan 0,5 + parry 0,2 | `haydut` ile aynı | 3,2 / 1,2 | — | D |
| `iskelet_kaptan` Morvan (138-143, insan boss) | 30 / 160 / 1,5 | `sword1h` + kalkan 0,6 + parry 0,2 + SPIN (engellenemez, 360° 2,8 m, 3 vuruş); çağırma %66/%33; öfke %33 | SPIN ilk vuruş +0,06 | 3,4 / 1,2 | `Spin2H` tek el kılıç + kalkanla; çağrılanlar grupsuz | ÇG (05 evreler) |
| `hayalet` (145-149) | 24 / 150 / 1,4 | `sword1h`; faz dokunulmazlığı 1,6 sn | `haydut` ile aynı | 3,9 / 1,3 (`WalkC`/`RunB`) | H-27, H-28 | D |
| `hayalet_bogulmus` (150-154) | 16 / 120 / 1,6 | `fists`; yakalama → `slowT 2,2` | `fists` gibi | 3,0 / 1,0 | H-05, H-17 | H |
| `hayalet_nisanci` (155-159) | 30 / 150 / 1,2 | `fists` + güdümlü küre (0,9 / 1,7 / 9–16 m, güdüm 1,3) | — | 3,4 / 1,2 | H-07 | H |
| `hayalet_muhafiz` (160-164) | 20 / 120 / 1,0 | `shield`; kalkan 0,85, arkadan ×1,5, poise | `shield` gibi | 3,0 / 1,0 | `night` bayrağı yok → H-19 | D |
| `lanetli_amiral` güverte formu (165-170, boss) | 40 / 360 / 2,0 | `twoh` + SPIN; çağırma %60/%30; öfke %30; faz | `twoh` gibi | 3,6 / 1,3 | H-26 | D |
| `hayalet_kaptan` (171-176, boss) | 30 / 170 / 1,6 | `twoh` + DASH (hiç tetiklenmiyor); çağırma %50; faz | `twoh` gibi; DASH +0,33 ve 0,33 sn donma | 3,7 / 1,3 | H-10, H-19, H-21 | H |

### 1.7 Saldırı zaman çizelgesi (ölçüm, `enemy_moves.mjs`)

| Takım / hamle (klip) | Hız | Klip (oyun sn) | `dur` | `hitAt` | Bilek tepesi | Fark | Donukluk |
|---|---|---|---|---|---|---|---|
| sword1h Atk1 (`1H_Melee_Attack_Slice_Diagonal`) | 1,15 | 0,87 | 0,90 | 0,42 | 0,35 | +0,07 | 0,03 |
| sword1h Atk2 (`…Slice_Horizontal`) | 1,15 | 0,93 | 0,95 | 0,44 | 0,21 | **+0,23** | 0,02 |
| sword1h Atk3 (`1H_Melee_Attack_Chop`) | 1,05 | 1,02 | 1,05 | 0,52 | 0,55 | −0,03 | 0,03 |
| sword1h AtkStab (`1H_Melee_Attack_Stab`) | 1,35 | 1,19 | 1,20 | 0,58 | 0,28 | **+0,30** | 0,01 |
| axe1h Atk3 / Atk1 | 1,0 / 1,1 | 1,07 / 0,91 | 1,10 / 0,95 | 0,55 / 0,45 | 0,57 / 0,36 | −0,02 / +0,09 | — |
| shield Atk1 / Counter / Atk3 | 1,0 / 1,05 / 0,85 | 1,00 / 1,02 / 1,25 | 1,0 / 1,0 / 1,3 | 0,50 / 0,38 / 0,68 | 0,40 / 0,32 / 0,67 | +0,10 / +0,06 / +0,01 | — |
| twoh Atk2H (`2H_Melee_Attack_Slice`) | 1,0 | 1,10 | 1,10 | 0,52 | 0,37 | **+0,15** | — |
| twoh Stab2H | 1,2 | 1,33 | 1,35 | 0,62 | 0,31 | **+0,31** | — |
| twoh Heavy2H (engellenemez) | 0,82 | 1,99 | 2,00 | 1,15 | 0,99 | **+0,16** | — |
| dual DualSlice / DualChop / DualStab | 1,25 / 1,2 / 1,4 | 0,93 / 1,06 / 1,14 | 0,95 / 1,05 / 1,15 | 0,40 / 0,47 / 0,55 | 0,46 / 0,45 / 0,27 | −0,06 / +0,02 / **+0,28** | — |
| fists Punch / Punch2 / Kick | 1,25 / 1,25 / 0,95 | 1,17 / 1,33 / 0,98 | 1,15 / 1,30 / 1,0 | 0,44 / 0,52 / 0,45 | 0,34 / 0,38 / (ayak 0,33) | +0,10 / **+0,14** / ≈+0,12 | — |
| SPIN (`2H_Melee_Attack_Spin`) | 1,1 | 2,18 | 2,20 | 0,70 / 1,15 / 1,60 | 0,64 | +0,06 (ilk) | 0,02 |
| DASH (`1H_Melee_Attack_Chop`) | 1,0 | 1,07 | 1,40 | 0,90 | 0,57 | **+0,33** | **0,33** |

Diğer donuk pozlar: sersemlik `Hit_B` 0,867 sn (0,9× → 0,96 sn) ama `stunT` 1,0–1,7 sn (`enemies.js:446-456`); insan çağırması
`Taunt` 1,033 sn ama durum 2,2 sn (`:434`, `:787`).

**§1.7a (inceleme düzeltmesi) Sınıfa göre vuruş karesi.** Yukarıdaki "Bilek tepesi" sütunu iki bilekten büyüğünü alır
(`enemy_moves.mjs`). Bu nedenle tek elli kılıç hamlelerinde sol bilek, tekmede bilek ölçülmüş; dürtmelerde ise temas anı yerine
savuruşun ortası bulunmuş. `inc_strike.mjs` aynı karakterde (barbarian, `defaultAppearance('m')`) şunları ayrı ayrı ölçtü:
silah elinin (R) hız tepesini, bıçak ucunun (el yuvası yerel +Y 0,7 m) hız tepesini ve sağ bileğin kök uzayında en ileri olduğu
anı. Değerler oyun saniyesidir.

| Hamle | `hitAt` | R hız tepesi | Uç hız tepesi | En ileri (R) | Sınıf | Sınıfa göre aday | Fark |
|---|---|---|---|---|---|---|---|
| sword1h Atk1 | 0,42 | 0,32 | 0,38 | 0,29 | kesme | 0,38 | +0,04 |
| sword1h Atk2 | 0,44 | 0,21 | 0,23 | 0,17 | kesme | 0,23 | **+0,21** |
| sword1h Atk3 | 0,52 | 0,55 | 0,57 | 0,63 | doğrama | 0,57 | −0,05 |
| sword1h AtkStab | 0,58 | 0,28 | 0,28 | 0,57 | dürtme | 0,57 | +0,01 |
| axe1h Atk3 / Atk1 | 0,55 / 0,45 | 0,57 / 0,34 | 0,60 / 0,39 | 0,67 / 0,30 | doğrama / kesme | 0,60 / 0,39 | −0,05 / +0,06 |
| shield Atk1 | 0,50 | 0,37 | 0,43 | 0,33 | kesme | 0,43 | +0,07 |
| shield Counter (kalkan darbesi, L) | 0,38 | L 0,32 | — | — | darbe (L) | 0,32 | +0,06 |
| shield Atk3 | 0,68 | 0,67 | 0,71 | 0,78 | doğrama | 0,71 | −0,03 |
| twoh Atk2H | 0,52 | 0,37 | 0,37 | 0,33 | kesme | 0,37 | **+0,15** |
| twoh Stab2H | 0,62 | 0,31 | 0,31 | 0,64 | dürtme | 0,64 | −0,02 |
| twoh Heavy2H | 1,15 | 0,86 | 1,01 | 0,97 | doğrama | 1,01 | **+0,14** |
| dual DualSlice | 0,40 | 0,46 | 0,61 | 0,53 | kesme (iki el) | 0,46–0,61 | **−0,06…−0,21** (erken; kontak sayfası) |
| dual DualChop | 0,47 | 0,45 | 0,40 | 0,41 | doğrama | 0,40–0,45 | +0,02…+0,07 |
| dual DualStab | 0,55 | 0,27 | 0,27 | 0,55 | dürtme | 0,55 | 0,00 |
| fists Punch | 0,44 | 0,34 | 0,33 | 0,40 | yumruk | 0,40 | +0,04 |
| fists Punch2 | 0,52 | 0,38 | 0,38 | 0,39 | yumruk | 0,39 | **+0,13** |
| fists Kick | 0,45 | — | — | ayak 0,39 | tekme | 0,39 | +0,06 |
| DASH (`1H_Melee_Attack_Chop`) | 0,90 | 0,57 | — | — | doğrama | 0,57 | **+0,33** (ve 0,33 sn donma) |

Sonuç: R2'yi (≤ 0,06 oyun sn) aşan düşman hamleleri Atk2, Atk2H, Heavy2H, Punch2, DASH, DualSlice ve shield Atk1'dir. Sınırda kalanlar
axe Atk1, DualChop ve Kick'tir. Dürtmeler bugün doğrudur ve **bükülmez**. Bu ölçüm de bir vekil ölçüttür: son karar
kontak sayfasıyla verilir (K7-16, §4.3).

### 1.8 Hayvanlar ve deniz canlıları (savaş adaleti açısından)

`Animal.update` `attack` (`animals.js:499-515`): menzile girince aynı karede `hurt` ve `bite = 0,35`; `melee` ve `attacker`
geçilmez (blok/parry dalı çalışmaz, `player.js:149`); görüş hattı ve yön yok; konuğa zehir gitmez (`:508`). `_walk` (`:556-569`)
takılma mantığı içermez. Orka sürüsünün 5 sn çember uyarısı var (`megafauna.js:536-663`). Köpekbalığı her istemcide yerel
(`fish.js:495-562`). Bu belge hayvanlarda yalnız savaş adaleti kurallarını uygular (§4.8); hayvan yapay zekâsı kapsam dışıdır.

---

## 2. Hedef davranış modeli

### 2.1 İlkeler

- **Tek kaynak veri.** Algı sabitleri, saldırı tabloları, vuruş kareleri, uyarı yarıçapları ve savaş kuralları birer veri
  modülündedir; hem çizim hem hasar hem ağ aynı değeri okur. Yeni modüller: `js/game/aiSense.js` (saf algı fonksiyonları),
  `js/game/aiSteer.js` (yönlendirme ve takılma kurtarma), `js/game/strikes.js` (klip → vuruş anı tablosu, Node aracıyla
  üretilir), `js/game/telegraph.js` (uyarı nesneleri, çizim ve yayın), `js/game/combatRules.js` (`BLOCK_LEAK`, `PARRY_WIN`,
  `IFRAMES`, `TELE_MIN`, `resolveHitEffects`), `js/core/gait.js` (yürüyüş eşlemesi).
- **Saf fonksiyon, Node testi.** Algı çarpanları, yönlendirme kararı, yürüyüş eşlemesi, uyarı/hasar yarıçapı tarayıcısız sınanır.
- **Host otoritesi (Faz 2).** Bütün yapay zekâ ve hasar host'ta koşar; konuk yalnız çizer.
- **Sabit adım (Faz 3).** Düşünme ~6 Hz, hareket her STEP (1/60 s), animasyon çizim evresinde (`rdt`).
- **Yeni içerik yok.** Yeni tür, boss, saldırı ya da eşya eklenmez. Yalnız `alarm` ses türü (takım alarmının uygulanması) ve
  `search` durumu (aramanın uygulanması) eklenir.

### 2.2 Algı

```
görüş_etkin = T.vision × Lf × Wf × Sf × Hf                         (aiSense.visionRange)
Lf (ışık)   = T.ghost ? 1 : max( lerp(0,5; 1; sky.dayFactor) × (hedef mağarada ve meşalesiz ? 0,45 : 1),
                                 hedef meşaleli ? 1,15 : 0,
                                 kamp ateşine ≤ 8 m ? 1 : 0 )
Wf (hava)   = 1 − clamp( 0,5·weather.fog + 0,25·weather.rain + 0,6·sky.fogAt(düşman.x, düşman.z) ; 0 ; 0,75 )
Sf (duruş)  = eğilmiş 0,55 | yüzüyor 0,6 | su altında 0,15 | 1
Hf          = hedef 5 m'den yukarıda ? 0,8 : 1
koni        = |açı|·2 < T.fov  ya da  d < (eğilmiş ? 1,8 : 3,2)                   (bugünkü kural)
görüş hattı = !segmentQuery(göz, hedef y + (eğilmiş ? 0,9 : 1,4), {mask: GORUS, startPad 0,3, endPad 0,35})   (Faz 3 A5)
fark hızı   = bugünkü formül (enemies.js:558-560)
```

- `sky.dayFactor` zaten var (`sky.js:58`, güncellemede hesaplanıyor); ikili `isNight` (`sky.js:230`) yalnız hayaletlerin gündüz
  kaybolması ve gece listeleri için kalır. Böylece alacakaranlıkta görüş adım adım düşer.
- `sky.fogAt(x, z)` yeni saf işlevdir: `sky.js:278-285`'teki Kemik/Hayalet Denizi formülünü oyuncu yerine verilen noktada hesaplar
  ve Faz 6 M19 `sky.zones` (Ölü Sis dahil) sis ağırlığını ekler. Bugün bölgesel sis yalnız kamerayı etkiliyor.
- Hava sapması: düşman nişan sapması (`enemies.js:1062`) aynı `Lf` ve `Wf`'yi kullanır: `sp × (1 + (1 − Lf·Wf))`.
- (inceleme düzeltmesi) **Meşale terimi.** Yukarıdaki `max(…, meşaleli ? 1,15 : 0, …)` yazımı gündüz meşale taşıyan oyuncuyu
  1,15 kat görünür yapıyordu. Bugün meşale yalnız gece etkilidir (`enemies.js:544`). Doğru biçim şudur:
  `Lf = T.ghost ? 1 : max( meşaleli ? max(L0, 1,15 − 0,15·dayFactor) : L0 × (mağarada ? 0,45 : 1), kamp ateşine ≤ 8 m ? 1 : 0 )`,
  burada `L0 = lerp(0,5; 1; dayFactor)`. Tam gündüz meşale 1,0 verir (bugünkü gibi), gece 1,15 verir.
- (inceleme düzeltmesi) **`fogAt` kaynağı.** `sky.regionW` kamera odağından 6 sn'lik sönümle izlenir (`sky.js:270-276`), bu
  yüzden düşman noktası için kullanılamaz. `fogAt(x, z)` bölgeyi `regionAt(x, z)` ve `regionDepth(x, z)` ile doğrudan hesaplar
  (sönümsüz). Kemik terimi `smoothstep(kemik.r·2,4; kemik.r·1,1; d)`, gece/gündüz çarpanı ise `sky.js:282-284` ile aynıdır.
- (inceleme düzeltmesi) **Konuğun algı bitleri (K7-12).** Eğilme bitinin yok sayılacağı "yatay hız > 2,0 m/sn" koşulu
  `RemotePlayer.vel` üzerinden okunmaz. Bu değer ara değerlemeden türetilir ve 8 m'de sıçrar (`net.js:96-101`). Hız, Faz 2
  hareket doğrulayıcısının `r.auth` örneklerinden 0,5 sn'lik pencerede hesaplanır.

**Duyma:**

```
r_etkin = olay.radius × T.hearing × (dinlenen ? 0,8 : 1) × yağmur × engel                 (aiSense.hearRange)
yağmur  = tür ∈ {step, melee} ? 1 − 0,3·weather.rain : 1
engel   = tür ∈ {gunshot, cannon, explosion} ? 1 : (segmentQuery(kaynak+1, kulak, {mask: GORUS}) ? 0,6 : 1)
```

Engel sorgusu yalnız `d ≤ r` ön elemesinden sonra yapılır ve düşman başına saniyede en çok 2 sorguyla sınırlanır.

| Kaynak | Tür | Yarıçap (m) | Kod |
|---|---|---|---|
| Adım (eğilme / yürüme / koşu / sprint) | `step` | 1,2 / 3,5 / 6,5 / 11 (taşırken ×1,4) | `combat.js:92-98` |
| Kılıç savuruşu | `melee` | 9 | `combat.js:165` |
| Oyuncu tabancası | `gunshot` | 45 | `combat.js:253` |
| Düşman tabancası | `gunshot` | 40 | `enemies.js:1065` |
| Top | `cannon` | 90 | `combat.js:311` |
| Patlama | `explosion` | 70 | `combat.js:46` |
| Takım alarmı (uygulama) | `alarm` | 25 | yeni `_raiseAlarm` (§2.5) |

### 2.3 Farkındalık düzeyleri

| Düzey | Koşul | Davranış | Simge |
|---|---|---|---|
| 0 Habersiz | a < 0,35 | Devriye, nöbet, dinlenme | — |
| 1 Şüpheli | 0,35 ≤ a < 0,6 | Durur, kaynağa döner (3,5 sn) | `?` |
| 2 Araştıran | 0,6 ≤ a < 1 (ses, alarm, ceset) | Son bilinen noktaya `walk × 1,8` | `?` |
| 3 Savaşta | a ≥ 1 ve hedef var | Kovala, kuşat, saldır, siper, geri çekil | `!` (1,6 sn) |
| 4 Arayan | Hedef 4 sn görülmedi ya da son görülen noktaya varıldı | Arama deseni (§2.7) | `?` |

Unutma: devriye/şüphede −0,18/sn (bugünkü), aramada −0,05/sn. Arama bitince a = 0,2 (bugünkü `return` değeri).

### 2.4 Durum makinesi (hedef)

Bugünkü 18 durum korunur; `search` eklenir; Faz 6'nın `surrender`, `buried`, `emerge` durumları korunur (toplam 22).

| Durum | Giriş (hedef) | Çıkış (hedef) | Değişiklik |
|---|---|---|---|
| `chase` | Görme, vuruş, alarm + görüş | Görülmüyorsa hedef **son görülen nokta** (≤ 0,5 sn hız öngörüsü, ≤ 3 m); varınca ya da 4 sn sonra `search` | H-12: `tgt.pos` yerine `lastKnown`; `lostT → investigate` kalkar |
| `search` (yeni) | `chase`'te kayıp | 12 sn (en çok 3 nokta) → `return`; görme → `chase`; ses → arama merkezi sese taşınır (2 sn'de bir) | §2.7 |
| `investigate` | Ses, alarm, ceset | 9 sn → `return` | Ses ve alarm için kalır |
| `cover` | Menzilli + siper adayı | Alt evreler: `git → saklan → göz at → nişan → ateş → saklan`; 2 başarısız göz atma ya da d < 4 → `chase` | H-11 |
| `hit` | Hafif vuruş, poise ölçeri boş | 0,45 sn | `flinchCd` 1,2 sn (§2.9) |
| `stunned` | Parry, karşı saldırı, bitirici | `stunT` | Klip bitince `IdleCombat` (donuk poz yok) |
| `summon` | Boss eşiği | Klip süresi + 0,3 sn (`Taunt` 1,03 sn) | H-09 |
| `attack` | Saldırı başlatma | `dur` | İki evreli zaman bükme (§4.3); hamle (DASH) kovalamada başlar (H-10) |
| `callHelp` | İlk görme **ya da ilk vuruş** (pusu) | 1,0 sn | ek-141 |
| Diğerleri | Bugünkü gibi | Bugünkü gibi | — |

### 2.5 Grup taktikleri

**Alarm yayılımı.** `_groupAlert(30)` (`enemies.js:719-730`) doğrudan döngü yerine bir ses olayına dönüşür:
`_raiseAlarm()` → `combat.noise(pos, 25, 'alarm', {lk: lastKnown, hop})`. Duyan müttefik (bugünkü fraksiyon kuralı, `:721`)
savaşta değilse a = max(a, 0,9), `lastKnown = olay.lk`, durum `investigate` (görüş hattı varsa `chase`). Görmeden uyarılan
müttefik 0,6 sn sonra **bir kez** aktarır (`hop ≤ 2`). Böylece alarm engelden sönümlenir (§2.2) ve sınırsız zincirlenmez.
Tetikleyiciler: ilk görme (bugün), **ilk vuruş** (pusu; bugün yalnız `_aggro` içinde grup uyarısı var, `callHelp` yok),
**müttefik ölümü** (15 m'de, görüş konisinde), **ceset bulma** (görüşte ≤ 10 m, ceset 20 sn yerde kalıyor, `enemies.js:1225`).
Boss ve mini boss `callHelp` (45 m) ve `rally` (`:1369-1371`) korunur.

**Saldırı jetonu.** Sayı bugünkü gibi (kolay 1, normal 2, zor 3; `:1344`). Temizlik: sahibi hedefe 9 m'den uzaksa, durumu
`chase/attack/strafe` dışındaysa ya da hedefi 1,5 sn görmüyorsa jeton 2 Hz'lik taramada bırakılır (bugün yalnız ölü ya da hedef
değiştiren sahip temizleniyor, `:1343`). Boss ve mini boss jetonsuz kalır.

**Kuşatma yuvaları.** `flankAngle` (`:1349-1362`) yerine `slotFor(e, tgt)`: 12 aday açı (30°), halka 4,3 m (kuşatmacı 3,2 m).
Puan bugünkü gibi (diğer kuşatanlardan uzaklık, hedefin arkası), artı **geçerlilik**: yuva noktası çarpıştırıcı içinde değil
(`physics.overlapCircle`, r = düşman yarıçapı + 0,2), su değil, eğim < 40°, ve yuvadan hedefe görüş hattı tercih edilir. Yuva
1,5 sn'de bir ya da geçersizleşince yeniden seçilir. Ölçüt: 3 kuşatanın açıları arasında en küçük fark ≥ 60°.

**Siper (H-11).** `findCover` (`:1388-1405`) yeniden yazılır:

1. Adaylar `physics.cells` üzerinden 12 m içindeki daireler (r 0,35–3) ve kutular (yarı boy ≤ 4); `physics.all` taranmaz.
2. Saklanma noktası: engelin hedefe göre arkasında `r + 0,7` (bugünkü, `enemies.js:1397`; inceleme düzeltmesi: ilk taslak
   0,6 yazıyordu). **Göz atma noktası:** saklanma noktasının iki yanında (dikey eksen boyunca `r + 0,7`) denenir; görüş hattı açık
   olan taraf seçilir.
3. Geçerlilik: iki nokta da yürünür ve boş; `saklanma → hedef` görüşü **kapalı**, `göz atma → hedef` görüşü **açık**.
4. Döngü: saklan (dolum, `reloadT × 0,6–1,0`) → göz atma noktasına çık (0,4 sn) → nişan (`aimT`) → ateş → saklan.
   Son 4 sn içinde görülmüş hedef için `cover`'da kayıp sayılmaz. Göz atma anında görüş yoksa geri saklanır; iki başarısızlıkta
   siper yeniden seçilir ya da `chase`.
5. Siper araması düşman başına en çok 2 Hz. `iskelet_nisanci`'ye de `cover: true` verilir (veri değişikliği; davranış mevcut).

**Geri çekilme ve iyileşme.** Koşul bugünkü gibi (insan, boss değil, %30 can, 18 m'de müttefik; `:694`). Yön artık hedefin tam
tersi değil: `uzaklaş(hedef) + 0,6·doğru(en yakın müttefik kümesi) + 0,4·doğru(en yakın siper)` puanıyla 8 aday arasından seçilir,
10–12 m. Yolu yönlendirme bulur; varamazsa 5 sn'de iyileşmeye geçer (bugün de 5 sn sınırı var, `:797`). Kızıl Hançer'in duman
sonrası iyileşmesi (`:795-803`) belgelenir ve korunur.

**Kaçış.** Moral kuralı ve lider ölümü şoku aynen (`:695`, `:1372-1377`); kaçan düşman yönlendirmeyi kullanır, takılırsa vazgeçip
`return`'e geçer.

### 2.6 Tasma

Tasma (`:688-690`) korunur: evden `homeR + 45` (boss 30) m'den uzaklaşan `return`'e geçer. `search` de tasmaya tabidir.

### 2.7 Kaybetme ve arama

1. Görüş kesilince hedef noktası `lastKnown + lastVel × min(0,5 sn; geçen süre)` (en çok 3 m) olur; düşman bu noktaya bakar ve
   kovalama hızıyla gider. Canlı konum (`tgt.pos`) yalnız görülürken okunur.
2. Noktaya varınca (≤ 1 m) ya da 4 sn sonra `search`: P1 = `lastKnown + yön(lastVel) × 5 m`, P2/P3 = `lastKnown + döndür(yön, ±70°) × 4 m`.
   Geçersiz nokta (çarpıştırıcı, su, eğim) atlanır. Her noktada 1,2 sn iki yana ±60° bakınır. Toplam en çok 12 sn.
3. Uyarılmış müttefikler farklı noktaları alır (nokta dizini düşman sırasına göre kaydırılır).
4. Görme → `chase`; ses → arama merkezi sese taşınır (2 sn'de bir); süre dolunca `return` (a = 0,2).

### 2.8 Navigasyon (navmesh yok)

**Bağlam yönlendirmesi** (`aiSteer.steer`, düşünme sıklığında; adımlar arasında son karar kullanılır):

```
12 yön θi (30°):
  ilgi(θ)   = max(0, cos(θ − θhedef)) + 0,25·cos(θ − θönceki)
  tehlike(θ)= engel 0,8 m'de 1,0 | engel 1,6 m'de 0,6 | su, eğim (normal.y < 0,6; inceleme düzeltmesi, ilk taslak 0,77) ya da > 2,5 m düşüş 1,2 m'de 1,0
            | 1,4 m içinde başka ajan o yönde 0,4 | son 6 sn'de ziyaret edilen 2 m'lik hücre 0,3 (iz belleği)
  seçim     = argmax(ilgi − tehlike); en iyi ilgi < 0,1 ise duvar izleme
engel testi: physics.overlapCircle(x, z, r, y, MASK.HAREKET)   (yeni, yan etkisiz; Faz 3 katmanları)
```

**Duvar izleme:** taraf, hedefe en az sapmalı serbest yön tarafıdır; en az 1,5 sn korunur. Doğrudan yön serbestleşip
`segmentQuery(konum+0,9 → hedef+0,9, {mask: HAREKET})` açık olunca ya da 6 sn sonra biter.

**Takılma algılama** (üç ölçüt; biri yetmez, N-2):
(a) 1,2 sn'lik pencerede hedefe ilerleme < 0,35 m (bugünkü ölçüt, `:1126-1139`);
(b) hareket istenirken 1,0 sn hız < 0,2 m/sn;
(c) salınım: 3 sn'de alınan yol > 3 × net yer değiştirme.

**Kurtarma kademeleri:** K1 duvar izleme tarafını değiştir; K2 engel normalinin tersine 1,5 m geri çekil + 2 m yanal;
K3 alt hedeften vazgeç: devriye → yeni geçerli devriye noktası, araştırma/arama → sonraki nokta, kovalama → yuva/bekleme
(hedef "ulaşılamaz"), dönüş → eve doğru en yakın geçerli nokta. İlerleme olunca kademe sıfırlanır. Her olay
`enemies.stats.stuck[kademe]++` ile sayılır (test ve Faz 8).

**Geçerli devriye noktası (N-1):** `patrolPoint` (`:1379-1386`) 8 denemede şunları arar: arazi > 0,6 m, çarpıştırıcı dışı
(`overlapCircle`, r + 0,3), eğim < 40°, ve evden noktaya `segmentQuery(…, HAREKET)` açık ya da evden ≤ 4 m. Bulamazsa ev.

**Dikey hareket:** 0,65 m'yi aşan inişte yere ışınlanma yok; yerçekimiyle (−22 m/sn², oyuncuyla aynı, `player.js:17`) düşülür.
2,5 m'den derin düşüşe kovalama dışında girilmez. Eğim > 40° olan hücreye adım atılmaz (H-23).
(inceleme düzeltmesi, N-19) 40° sınırı oyuncununkinden sıkıdır. Oyuncu n.y ≥ 0,6 (≈ 53°) yamaca tırmanabiliyor (`player.js:577`),
n.y < 0,68'de ise kayıyor (`:550`). Düşman 40° ile sınırlanırsa 40–53° yamaç oyuncu için düşmanın giremediği bir sığınak olur.
Bu yüzden kural oyuncuyla eşitlenir: `normal.y < 0,6` olan hücreye adım atılmaz; 0,6–0,68 bandında düşman ×0,6 hızla yürür.
Hedef `normal.y < 0,68` olan bir yamaçtaysa ve düşman ona yol bulamıyorsa `_reachable` "ulaşılamaz" der; bu durumda menzilli
müttefiklere öncelik verilir. Tehlike terimi ve `SLOPE_MAX` sabiti buna göre 0,6 olur (Ek B). Faz 3 C-15 hayvan yerçekimi de
aynı tek yerçekimi işlevini kullanır.

**Ulaşılamaz hedef** (`_reachable`, `:863-869`; yükseklik > 2,4 m, su, gemi): yakın dövüşçü hedefe görüşü olan 4–8 m'lik geçerli
bir noktada bekler ve alay eder (bugünkü davranış); menzilli müttefiklere jeton önceliği verilir. Bu durumda takılma sayılmaz.

**Güverte:** Faz 3 C-12 (`deckObstacles`, `clampDeck`) ve C-11 (güverte yerel itişmesi) güverte düşmanlarını da kapsar; Faz 7
yalnız gerçek yer değiştirmeyi animasyon hızı için kullanır.

**Maliyet:** düşünme başına 12 yön × 2 mesafe = 24 daire testi + en çok 1 `segmentQuery`; 30 düşman × 6 Hz ≈ 4 300 test/sn.

### 2.9 Vuruş tepkisi (poise, H-20)

- Poise'sız ve boss olmayan düşman `hit` durumuna girince `flinchCd = 1,2 sn` başlar; bu sürede gelen hafif vuruşlar yalnız üst
  gövde `HitRecieve` oynatır, durum değişmez, hazırlanan saldırı sürer.
- Hazırlığın son %30'unda (`t ≥ 0,7 × hitAt`) hafif vuruş saldırıyı kesmez (zırh). Ağır vuruş, bitirici ve karşı saldırı sersemletmeye
  devam eder (`enemies.js:401-402`).
- Bossların "%70 olasılıkla saldırıda tepki vermeme" kuralı (`:408`) korunur.
- (inceleme düzeltmesi, N-15) **Bitirici sersemliğine azalan getiri.** `stunned` bittikten sonraki `STUN_DR = 2,0 sn` içinde
  gelen bitirici (`finisher`) sersemletmez; `hit` tepkisi ve ×1,25 hasar korunur. Parry (`why === 'parry'`), karşı saldırı,
  ağır vuruş ve savunma kırma bu kurala girmez. Gerekçe: gerçek zincirde bitirici 1,64 sn'de bir 1,0 sn sersemletiyor
  (`combat.js:21`, `enemies.js:401-402`). Yalnız irkilme bekleme süresi ve zırh öykünüldüğünde düşman yine 0/10–11 saldırıyı
  vuruş anına ulaştırıyor; azalan getiri eklenince 2/6 (`inc_olcum.js` MA, 3/3 koşu).
- Ölçüt (inceleme düzeltmesi): 10 sn kesintisiz hafif zincirde, **gerçek girdiyle**, düşman en az 2 saldırısını vuruş anına
  ulaştırır. Gerçek girdi şu demektir: `combat._attack` yalnız `!p.action || (a.type === 'atk' && a.t ≥ a.chainAt)` iken
  çağrılır, ya da `_meleeInput`'a tuş girdisi verilir. Bugünkü değer 0/10–11'dir. İlk taslağın "bugün 0/7" değeri, 0,42 sn'de
  bir `_attack` çağıran ve `chainAt`'i atlayan M5b düzeninden geliyordu (10 sn'de 23 savuruş; meşru en çok 18).

### 2.10 Düşman animasyonu

- `_animate` (`enemies.js:1148-1160`) ortak `gait.pick()` işlevini kullanır (§5.3): hız → klip ve klip hızı, düşman ölçeği
  (`T.scale` 1,08–1,3) doğal hızı çarpar; bakışa göre hareket açısı 45°'yi aşınca `StrafeL/R`, 135°'yi aşınca `WalkBack` (H-30).
- (inceleme düzeltmesi, N-20) Hayaletler yerden 0,25 m yüksekte süzülür (`enemies.js:1195-1196`); ayakları yere değmez. Bu
  yüzden hayaletlere ayak kayması ölçütü uygulanmaz, yalnız kadans sınırı uygulanır. Gece hızında (3,9 × 1,18–1,35 m/sn,
  `:738`) `Running_B` (doğal 2,36) ts 1,95–2,25 ister. Koşu kıskacı bu yüzden klip başına kadansla tanımlanır (≤ 5 adım/sn;
  `Running_B` için ts ≤ 2,67). İlk taslağın [0,45; 1,40] kıskacı hayalet koşusunu 0,70 oranına sıkıştırıyordu.
- Sersemlik: `HitRecieve_2` bitince `IdleCombat`'a 0,15 sn geçiş. İnsan çağırması: `Taunt` bitince `IdleCombat`. Ölçüt: hiçbir
  durumda 0,2 sn'den uzun donuk poz yok (§9, 40 F11).
- Dev bosslar: sınırda konum değişmiyorsa `Idle` (H-22); yürüme klip hızı gerçek hıza bağlı.

---

## 3. Bosslar

### 3.1 Ortak kurallar

- **Saldırı veri tablosu** (`BOSS_ATK`, `bosses.js` başı): `{tele, shape: disk|sector|annulus|line, r, arc, off, dmg, kb,
  blockable, jumpable, clip, strike, postSpeed}`. Uyarı, hasar, ağ ve test aynı satırı okur.
- **Uyarı (telgraf) biçimi (N-6, N-7):** dış çizgi **baştan tam yarıçapta** çizilir; iç dolgu `0 → 1` büyür ve dolduğu an
  hasar anıdır. Şekil hasar şekliyle aynıdır (yaylı saldırıda `RingGeometry(thetaStart, thetaLength)` dilimi). Renk:
  kırmızı = engellenemez, turuncu = engellenebilir, yeşil = zehir, mor = kavrama.
- **Hasar = uyarı:** yatay mesafe ≤ r (2B), |dy| ≤ 2,2 m, yay içinde, ve `segmentQuery(merkez+1, oyuncu göğsü, GORUS)` açık
  (tapınak duvarı arkasına alan hasarı yok, H-08). Lob için "merkez" iniş noktasıdır.
- **Hasar anı = vuruş karesi:** animasyonlu bosslarda `strikes.js` (§4.3); prosedürel bosslarda (Kraken, Yılan) temas anı.
- **Evre geçişi:** 1,0 sn kükreme; yeni saldırı başlamaz, vuruş karesine ulaşmamış saldırı ve uyarısı iptal edilir;
  `bossFx{k:'phase', n}`.
- **Çarpışma:** dev bosslar hareket sonrası `physics.resolve(pos, radius, y)` ve `crowd`'da kütle 20'lik ajan.
- (inceleme düzeltmesi, N-11) **Ortak `_hitPlayer`.** `BossBase` varsayılan bir `_hitPlayer(id, pl, dmg, mv, opts)` alır; bu işlev
  `hitPlayer(…, {kb: mv?.kb, poison: opts.poison, slow: opts.slow})` çağırır. Böylece Yılan dahil bütün boss lob ve mermileri can
  hasarını aynı yoldan verir. Bugün `SeaSerpent`'te bu işlev yok ve tükürük hiç hasar vermiyor (`enemies.js:1442`).
- (inceleme düzeltmesi, N-18) `BossBase.applyDamage`, `damageMul ≤ 0` durumunda `'immune'` döndürür. Bugün `'blocked'`
  döndürüyor (`bosses.js:109`) ve oyuncunun kılıcı kalkana çarpmış gibi geri sekiyor (`combat.js:226-229`); örnek: bordalamış
  Amiral ve derindeki Kraken başı.
- (inceleme düzeltmesi, N-28) Dev bosslar (`GiantBase`) `stun` işlevi taşımaz. Engellenebilir süpürmeleri (`melee: true`)
  parry edilince hasar 0 olur ve oyuncuya karşı saldırı penceresi açılır, ama boss sersemlemez. R6 ve F4 buna göre yazıldı.
- (inceleme düzeltmesi, Ç-13) Deniz bosslarının su sınamaları Faz 6 S13'teki `ocean.levelAt(x, z)`'yi kullanır.
- **Ödül yeri:** ganimet yürünür, tehlikesiz (lav, su derinliği > 1,2 m değil) ve yürünür bir noktaya ≤ 6 m bir yere bırakılır;
  deniz bosslarında gemiye (bugünkü).
- **Co-op ölçeği:** boss canı `1 + 0,5·konuk` (`bosses.js:86`); Kraken dokunaç canı ve rün sütunu canı aynı katsayıyla.

### 3.2 Kraken

| Konu | Şimdi | Hedef | Değişiklik |
|---|---|---|---|
| Uyarı | Dokunaç iniş halkası 2,8 m, %50'den büyür; evre 3'te ezme 1,5 sn'de başladığı için 2,45 m (`bosses.js:318-319`); yalnız host | Halka r = hasar yarıçapı 3,4 m (2B), dış çizgi baştan; süre 2,0 / 1,5 sn (bugünkü); kavrama mor; konukta `bossFx{k:'tel'}` | `_updateTentacles` 318, 328 |
| Hitbox | Hedef k = TSEG−6 (u ≈ 0,72) noktası − 1 m (`:358`): uçtan 5–14 m geride; sloop'ta %7,7 erişilebilir | `stuck`/`grab`: hedef = güverte noktası + (0; 0,6; 0), r 1,3; havada (`rise`, `slam`, `retract`): son segment (k = TSEG−1) | `:358`, `:199` |
| Hasar zamanı | Uç güverteye 1,2 m'de ya da 0,5 sn'de (`:322`) | Yalnız uç güverteye ≤ 1,2 m'deyken; zaman aşımında hasar yok | `:322-329` |
| Zayıf nokta | Dokunaç ×1,5 (saplıyken), kopunca 6 sn baş ×2, derindeyken baş bağışık (patlama ×0,2) (`:210-232`) | Aynı; açık penceresi `bossFx{k:'weak', t:6}` ile her istemcide göz parlaması | — |
| Evreler | %60 mürekkep + kavrama, %30 girdap (`:233-237`) | Aynı + 1 sn geçiş | — |
| Hareket | Gemi çevresinde R 38/30 yörünge, arazi kontrolü yok (`:246-251`) | 8 aday yörünge noktasından `terrain.heightAt < ocean.levelAt(x, z) − 4` olan en yakın (inceleme düzeltmesi: `ocean.tide` yerine Faz 6 S13 API'si, Ç-13); yoksa R ±8 m | `update` 246-251 (H-25b) |
| Ödül | Gemiye ganimet + herkese 600 XP (`:1066-1075`) | Aynı; XP Faz 5 K5-2 (300 m) | — |
| Multiplayer | Konukta halka yok; konukta `alive = netTip[3]` (`:382`), host'ta `state ∉ {idle, gone}` (`:361`): boştaki dokunaç konukta vurulabiliyor | `netExtra.tn[i][3]` durum kodu (0 gitti, 1 boşta, 2 etkin); iki tarafta aynı `alive` kuralı; dokunaç canı co-op ölçekli (`:196` 220 → 220·(1 + 0,5·konuk)) | `:366`, `:382`, `:196` |

### 3.3 Derinlik Yılanı

| Konu | Şimdi | Hedef | Değişiklik |
|---|---|---|---|
| Uyarı | Hizalanma 1,6 sn kükreme; tükürük lob halkası (aoe 2,4, hasar aoe + 0,4 3B); dalış halkası 4,5 m, hasar < 6,5 m 3B (`:499`, `:506`); toslama için uyarı yok | Tükürük r = 2,4 (2B, tek sabit); dalış r = 5,5 (2B, tek sabit); hizalanmada gemi borduna "toslama hattı" uyarısı (`shape: line`) | `update` 458-511 |
| Hitbox | Yalnız baş (r 2,4) | Baş + gövdede 4 küre (iz dizini 6/12/18/24, r 1,1), gövde isabeti ×0,4 başa aktarılır | `hitSpheres` (§3.6 ortak) |
| Hasar zamanı | Temas; toslamada güvertedeki her oyuncuya **%60 rastgele** (`:472`) | Temas; toslamada çarpma noktasına (küpeşte) 5 m'den yakın oyuncular (K7-6) | `:472` |
| Zayıf nokta | Sersem/tükürürken ×2, derinde bağışık (patlama ×0,3) (`:428-431`) | Aynı; sersem penceresi `bossFx{k:'weak'}` | — |
| Evreler | %50, %20 (`:432-436`) | Aynı + 1 sn geçiş | — |
| Hareket | Dalış sonunda `pos.copy(tgt)` ışınlanması, ortalama 21 m (`:503`); iz kopuyor | Dalışta hedefe gerçek hareket (14 m/sn); 2,2 sn'de varamazsa fırlama ≤ 1,5 sn ertelenir, işaret hedefi izler; iz yeniden örneklenir; sıçrama ≤ 3 m | `:495-511`, `_pose` 533-548 |
| Ödül | Gemiye + 600 XP | Aynı | — |
| Multiplayer | İşaretler konukta yok, zehir konuğa gitmiyor (`enemies.js:1443`). (inceleme düzeltmesi, N-11) Tükürük kimseye can hasarı vermiyor: `SeaSerpent`'te `_hitPlayer` yok (`enemies.js:1442`) | `bossFx{k:'tel'}`; `hurt.po` (§4.9); ortak `BossBase._hitPlayer` (§3.1): tükürük 12 hasar + 6 sn zehir, ikisi de yalnız `'hit'` sonucunda | F7-1, F7-18 |
| Hitbox (gemiden) | (inceleme düzeltmesi, N-23) Sersem baş bordanın 2,5 m yakınında, y ≈ 1,2 (`bosses.js:467`, `:480`) | Yerel oyuncunun görüş sorgusu saldıranın kendi gemisinin gövdesini saymaz (§4.6); böylece "başına vur" mekaniği bozulmaz | F7-3 |

### 3.4 Taş Muhafız

| Konu | Şimdi | Hedef | Değişiklik |
|---|---|---|---|
| Uyarı | Yumruk 3,6 m (öne 4,2 m), süpürme 6,5 m **tam daire** (hasar ±1,25 rad), tepinme 7,5 m, kaya lob 2,6 m (+0,4) (`:712-743`); yalnız host | Yumruk disk 3,6; süpürme **dilim** 6,5 / ±1,25; tepinme halka (zıpla) 7,5; kaya lob r 2,6 tek sabit; konukta `bossFx` | `telegraph` 597-604 |
| Hitbox | Tek silindir r 1,19, h 6,6 (`:580`); çarpışmasız (H-22) | Aynı hacim + `physics.resolve` + `crowd` ajanı (oyuncuyu iter); sırttaki kristal açıyla (bugünkü) | `update`, `crowd.js` |
| Hasar zamanı | Yumruk T = 1,1 sn. (inceleme düzeltmesi) `Punch` klibinde elin en ileri anı 0,50 klip sn = 0,667 oyun sn, yani fark **+0,43 sn** (ilk taslak açısal tepeye göre +0,667 diyordu). Süpürmede el önden 0,458 klip sn = 0,573 oyun sn geçiyor, fark +0,33 sn. Tepinme `Jump` bittikten 0,57 sn sonra; kaya bırakma 0,365 sn, mermi 0,9 sn'de | `tele` korunur (1,1 / 0,9 / 1,4 sn); klip **iki evreli bükülür** (hazırlık `strike/tele`, sonrası 0,75×) ve hasar vuruş karesinde. Tepinme ve yumruk-yere-vurma `Jump` (kalkış) → `Jump_Land` dizisidir; hasar temasta verilir (inceleme düzeltmesi: ayağın en alçak anı 0,167 klip sn; ilk taslak 0,104). Kaya bırakma karesinde (`Wave`; aday 0,31–0,46 klip sn, kontak sayfasıyla seçilir) | `_go` 748-756, `update` 712-743 |
| Zayıf nokta | Arkadan ×2,2 (açı > 2,0 rad), saplanınca ×1,5, sütun varken ×0,2 (`:654-659`) | Aynı; kristal parlaması ve "saplandı" penceresi `bossFx{k:'weak'}` | — |
| Evreler | %55 üç rün sütunu, %25 öfke (×1,35) (`:660-683`) | Aynı + 1 sn geçiş; sütun canı co-op ölçekli (bugün var, `:671`) | — |
| Hareket | Arena 24 m; sınırda yerinde `Walk` (`:697-702`) | Konum değişmiyorsa `Idle`; yürüme klip hızı gerçek hıza | `:697-702` |
| Ödül | Yerde ganimet (+0; 1; 2) + 600 XP (`:758-763`) | Ödül yeri kuralı (§3.1) | `die` |
| Multiplayer | Sütunlar konukta yok (H-16) | `netExtra.pl = [[x, z, canlı]]`; konukta sütun nesnesi ve yerel hedef; kırılma host'ta | `:622`, `clientUpdate` 623-631 |

### 3.5 Volkanik Dev

| Konu | Şimdi | Hedef | Değişiklik |
|---|---|---|---|
| Uyarı | Lav lob 3 m (+0,4), 1,7 sn; yere vurma 6 m halka sonra 16 m/sn genişleyen ateş halkası (zıplanır); süpürme 9 m **tam daire** (hasar ±1,3 rad); evre 3 gökten ateş lob 3 m 1,6 sn; lav havuzu 6 sn (`:842-882`, `enemies.js:1451`); hepsi yalnız host | Lob r 3 tek sabit; süpürme dilim 9 / ±1,3; ateş halkası `bossFx{k:'wave', x, z, v:16, rMax:28, t0}`; havuzlar `bossFx{k:'pool', x, z, r, t}` | `:842-882`; `enemies._updatePools` |
| Hitbox | r 1,71, h 9,5; çarpışmasız | `physics.resolve` + `crowd` ajanı | `update` |
| Hasar zamanı | Süpürme T = 1,0 sn. (inceleme düzeltmesi) El önden 0,458 klip sn / 0,7 = 0,654 oyun sn'de geçiyor, fark +0,35 sn (ilk taslak +0,553). Yere vurma dalgası `Jump` bittikten 0,46 sn sonra; lav topu `Punch` başlangıcında atılıyor, el en ileri 0,50 klip sn / 1,4 = 0,36 sn sonra | Süpürme iki evreli bükme; yere vurma `Jump` → `Jump_Land` teması (0,167 klip sn) → dalga başlar; lav topu bırakma karesinde | `_go` 887-894, `:845-853` |
| Zayıf nokta | Yağmurdan sonra 3,2 sn önden ×2,2; yükselirken ×0,3 (`:788-796`) | Aynı; çekirdek penceresi `bossFx{k:'weak'}` | — |
| Evreler | %60, %30 (gökten ateş) | Aynı + 1 sn geçiş | — |
| Hareket | Krater + 30 m sınırı | Sınırda `Idle`; çarpışma | — |
| Ödül | Bossun 12 m doğusu; lav gölünde olabilir (H-29, `:896-901`) | Ödül yeri kuralı: krater yarıçapı dışı ve `groundAt > lavaY + 0,3`, en yakın oyuncuya doğru | `die` |
| Multiplayer | Uyarılar, ateş halkası, havuzlar konukta yok (H-15) | §3.8 kataloğu | F7-18 |

### 3.6 Lanetli Amiral (hayalet gemi + bordalama)

| Konu | Şimdi | Hedef | Değişiklik |
|---|---|---|---|
| Uyarı | Yaylımdan 1,6 sn önce bildirim + yeşil parıltı; gülle lob aoe 2,2 (+0,4) (`:985-1003`) | Bildirim + lob halkaları r 2,2 tek sabit; konukta `bossFx` | — |
| Hitbox | Gemi merkezinin 6 m üstünde 7,6 m'lik tek küre: su hattının 1 m üstünde 20 m'lik gövdenin yalnız orta ±5 m'si (H-22) | `hitSpheres`: pruva/orta/kıç, su hattı + 2 m, r 3,5; `combat.projectileTest` ve `raycast` hedefte `hitSpheres` varsa onları dolaşır (Faz 3 C-05 `t` dönüşüyle birlikte) | `:925-928`, `combat.js:55-70`, `:271-298` |
| Zayıf nokta / bağışıklık | (inceleme düzeltmesi, N-18) Bordadayken `damageMul` 0 → `'blocked'` (`bosses.js:109`); yakın dövüşte kılıç geri sekiyor | `'immune'`: gri kıvılcım, geri sekme yok | F7-1 |
| Hasar zamanı | Lob iniş anı | Aynı | — |
| Zayıf nokta | Top/patlama ×1, diğer ×0,35; bordadayken bağışık (`:932`) | Aynı | — |
| Evreler | Tek geçiş: %50 ya da 75 sn sonra bordalama (`:933-947`, `:1004`) | Aynı + 1 sn geçiş | — |
| Hareket | 46 m daire, karaya oturmaz (`:974-983`) | Aynı | — |
| Ödül | Gemiye + 600 XP; tayfa temizliği ganimetsiz | Aynı | — |
| Multiplayer | Geri çekilince güverte Amirali ve hayalet tayfa kalıyor (H-26, `:1017`) | `dispose`'ta `this.admiral` ve bordalama bayraklı tayfa kaldırılır | `dispose` 1017 |

### 3.7 İnsan bosslar ve mini boss (`enemies.js` çatısı)

| Boss | Uyarı | Hasar zamanı | Zayıf nokta | Evreler | Hareket | Ödül | Multiplayer | Değişiklik |
|---|---|---|---|---|---|---|---|---|
| Kızıl Hançer (`:111-116`) | Engellenebilir hamleler uyarısız; tabanca `Aim` üst katman + ses | AtkStab +0,30 → bükme | Yorgun ×1,4 (çağırma sonrası 2,5 sn), sersem ×1,25 (`:384-385`) | %55 çağırma (Taunt 1,03 / 2,2 sn donuk), %30 duman → 9 m kaçış + iyileşme | Yönlendirme | XP (Faz 6 S2), hikâye | Çağırma ve duman bildirimi konukta yok; boss çubuğu konuğun yerel `state`'ine bağlı (`:1617`) | Bildirim `bossFx{k:'ntf'}`; çubuk `snap.e` bayrağıyla (savaşta) |
| Morvan (`:138-143`) | SPIN kırmızı halka 2,8 m (360°) | SPIN 3 vuruş; ilk +0,06. (inceleme düzeltmesi, N-13) Öfkede `hitAt / 1,2`: Atk1 0,35, Atk2 0,367, SPIN 0,583 sn (alt sınırın altında) | Aynı | %66/%33 çağırma, %33 öfke | Yönlendirme | XP (Faz 6) | Halka konukta yok | `tel{n, k:'spin', r, dur}`; SPIN sırasında kalkan gizlenir (`Spin2H` iki el klibi; görsel uyum). Öfkede taban kuralı: `atkHit = max(TELE_MIN(_UB), hitAt / 1,2)` (Lanetli Amiral ve Faz 6 Gelgit'in Gölgesi için de) |
| Hayalet Kaptan (`:171-176`) | DASH hiç yok | DASH +0,33 ve 0,33 sn donma | Faz dokunulmazlığı 1,6 sn | %50 çağırma | — | XP (Faz 6) | — | DASH kovalamada 4–10 m ve görüş varken başlar; `Stab2H` klibi, hazırlıkta 0,6 sn `line` uyarısı, atılma hazırlık sonu ile vuruş karesi arası, hasar vuruş karesinde (H-10). (inceleme düzeltmesi) `Stab2H` bir dürtmedir; vuruş karesi en ileri erişimdir (0,64 oyun sn × 1,2 = 0,77 klip sn), hız tepesi (0,37) değil |
| Haydut Kaptanı (`:105-110`) | Heavy2H kırmızı halka (alan 2,2) | Atk2H +0,15, Stab2H +0,31, Heavy2H +0,16 | — | Yok (mini) | — | Ganimet + XP | — | İlk vuruşta da yardım çağrısı (ek-141) |
| Lanetli Amiral güverte (`:165-170`) | SPIN | `twoh` gibi | Faz | %60/%30 çağırma, %30 öfke | Güverte | `noLoot` | H-26 | §3.6 |

### 3.8 Co-op: host çözümü ve konuk uyarı kataloğu

Hasar ve evreler Faz 2 gereği host'ta çözülür; konuk saldırısı `act` niyetidir ve dokunaç, sütun, gövde küresi gibi hedefler host'ta
geometrik vurulur. Faz 5 taşımayı getirir (`tel{n,k,dur}`, `bossFx{k,…}`, `snap.b`); Faz 7 içeriği tanımlar:

| İleti | Alanlar | Kaynak | Konukta |
|---|---|---|---|
| `tel` (düşman) | `n, k, dur` + **`r, arc`** (K7-11) | `_startMelee` engellenemez hamle, DASH | Halka/dilim/çizgi; süre `dur`, başlangıç `hostNow` ile hizalı |
| `bossFx{k:'tel'}` | `id, shape, x, z, r, arc, yaw, dur, c` | `telegraph.add` (boss, lob, Kraken güverte noktası; gemi yereli için `sh, lx, lz`) | Aynı çizim kodu |
| `bossFx{k:'tel-'}` | `id` | İptal (evre geçişi) | Siler |
| `bossFx{k:'phase'}` | `n` | `onPhase` | Bildirim + kükreme sesi |
| `bossFx{k:'weak'}` | `t` | Zayıf nokta penceresi | Parlama + ipucu |
| `bossFx{k:'ntf'}` | `m` (metin anahtarı) | Boss bildirimleri (`G.notify` çağrıları) | Yerel metin tablosundan |
| `bossFx{k:'wave'}` | `x, z, v, rMax, t0` | Volkanik Dev yere vurma | Halka benzetimi; zıplayan konuk host'ta kaçmış sayılır (`onGround`, Faz 2 `st.air`) |
| `bossFx{k:'pool'}` | `x, z, r, t` | Lav havuzu | Görsel; hasar host'ta gölge cana (`enemies.js:1467-1472` bugün de host'ta) |
| `snap.b.pl` | `[[x, z, canlı]]` ≤ 3 | Taş Muhafız sütunları | Nesne + yerel hedef |
| `snap.b.tn[i][3]` | Durum kodu 0/1/2 | Kraken | `alive` kuralı |

Ölçüt (H-15): her uyarı konukta host'a göre en çok 0,15 sn gecikmeyle ve aynı yarıçapla (±0,05 m) görünür. İlgi alanı: Faz 5 `tel`
≤ 80 m; `bossFx` boss savaşındaki herkese (Faz 5 "etkin boss savaşı 300 m içinde her zaman ilgili").

(inceleme düzeltmesi, N-14, K7-15) **Konuk için zaman eşitliği.** Uyarının konukta görünmesi yetmez; konuğun tepki verecek
zamanı da olmalıdır. Konuk düşmanı ve bossu NetInterp gecikmesiyle (`D`) görür, niyeti de host'a RTT/2 sonra ulaşır. Bu yüzden:
(a) `tel` ve `bossFx{k:'tel'}` başlangıç zamanı `t0`'ı host saatinde taşır; konuk uyarıyı Faz 5 `ClockMap` ile kendi oynatma
saatine (`pc`) çevirir. Böylece uyarı, konuğun gördüğü hazırlık hareketiyle aynı anda başlar. (b) Konuğun `act{dodge}` niyeti ve
blok başlangıcı (`st.up === 'Block'` geçişi) Faz 5 `vt` alanını taşır. Host gölge canında kaçınma penceresini
`[max(vt, şimdi − 0,25), vt + IFRAMES]` olarak sayar. Blok penceresi de aynı alt sınırı kullanır (Faz 2 §5.10 b'deki
`t + 0,15 + rtt/2` toleransının yerine geçer). (c) 0,25 sn'lik geri sarma sınırı Faz 5 K5-8 ile aynıdır ve kötüye kullanımı
sınırlar. Ölçüt: `--latency 120` ile konuk, **kendi ekranındaki** hasar anından ≥ 0,10 sn önce kaçındığında 10/10 denemede hasar
almaz; bu hem konuğun yerel canı hem host gölge canı için geçerlidir ve sonradan `hp{v}` düzeltmesi gelmez. Konukta etkin uyarı
süresi (uyarının görünmesi ile host'taki hasar anı arası) ≥ `TELE_MIN − 0,15` sn olur (08a E9, 08b B9).

---

## 4. Savaş adaleti

### 4.1 Ölçülebilir kurallar

| No | Kural | Ölçüt | Bugün |
|---|---|---|---|
| R1 | Telgraf (saldırı başlangıcı → hasar) | Normal ≥ 0,40 sn; engellenemez ve alan ≥ 0,60 sn. (inceleme düzeltmesi) Öfke ve evre hızlanmasından **sonra** da geçerlidir | Counter 0,38; DualSlice 0,40. (inceleme düzeltmesi, N-13) Öfkede Morvan ve Amiral: Atk1 0,35, Atk2 0,367, SPIN 0,583 |
| R2 | Hasar anı = vuruş karesi | (inceleme düzeltmesi) Hasar anı ile vuruş karesinin oyun zamanındaki farkı ≤ 0,06 **oyun** sn; dev bosslarda ≤ 0,1 oyun sn. İlk taslak insan boyutlu karakterlerde "klip sn" yazıyordu; oyuncu klipleri 1,4–1,8× oynadığı için bu, F10'daki oyun sn ölçütüyle çelişiyordu. Göz gerçek zamanı algıladığı için birim oyun saniyesidir. `STRIKE` sınıfa göre tanımlanır ve kontak sayfasıyla onaylanır (K7-16) | (inceleme düzeltmesi) Altı düşman hamlesi (Atk2, Atk2H, Heavy2H, Punch2, DASH; DualSlice erken), yedi dev boss saldırısı (Taş Muhafız 4, Volkanik Dev 3) ve iki oyuncu hamlesi (Atk2, Atk3) kalıyor. Dürtmeler geçiyor (§1.7a) |
| R3 | Uyarı = hasar alanı | Yatay mesafe ≤ r → hasar; r + 0,2 → 0; r − 0,3 → hasar | Kraken, Yılan dalışı, lob kalıyor |
| R4 | Kaçınma | `invuln > 0` iken can, `slowT`, `knock`, `poison` değişmez; mermi geçer ve geri dönemez | H-05, H-07 kalıyor |
| R5 | Blok | Önden (abs(açı) < 1,35 rad), yakın dövüş, engellenebilir, dayanıklılık ≥ bedel → can kaybı **0** (K7-1); `slowT`, `poison` 0. (inceleme düzeltmesi, N-17) Geri itme **itkisi** ≤ `BLOCK_KB_MAX = 0,6`. `knock` bir hız değil, adım başına `vel += knock·60·dt` olarak eklenen ve `exp(−9dt)` ile sönen bir itkidir (`player.js:541-545`). Ölçülebilir karşılığı: kara kipinde tepe hız ≤ 1,5 m/sn ve 1 sn'deki yer değiştirme ≤ 0,35 m. Güverte kipindeki ayrı formül (`:839-842`) aynı yer değiştirmeyi verecek biçimde ölçeklenir | %12 sızıntı; tam boss itmesi; blok itmesi uzaklıkla büyüyor (`0,8·(konum − kaynak)`, `:160`) |
| R6 | Parry | Blok başlangıcından ≤ 0,24 sn sonra gelen vuruş → can 0; saldıran ≥ 1,0 sn sersem (boss: 1,7 × 0,6 = 1,02 sn); karşı saldırı penceresi 1,3 sn. (inceleme düzeltmesi, N-28) Dev bosslar sersemlemez, yalnız hasar 0 olur ve pencere açılır | Geçiyor (testsiz) |
| R7 | Savunma kırılması | Dayanıklılık yetmezse can ×0,5 + sendeleme + bildirim (sebepli hasar) | Geçiyor |
| R8 | Görüş hattı | Saldıran göğsü → hedef göğsü (`GORUS`) kapalıysa yakın dövüş ve alan hasarı yok (0,3 m duvar) | H-08 |
| R9 | Güdüm | Hedefi geçince güdüm kapanır; dönüş ≤ 90°/sn; ömür 2,5 sn | H-07 |
| R10 | Sahte isabet yok | Dokunulmaz hedef `'immune'`; vuruş işaretçisi ve kan kıvılcımı yok, gri kıvılcım var | H-28 |
| R11 | Hayvan | Hazırlık ≥ 0,30 sn; hasar ısırığın vuruş karesinde; R5, R6, R8 geçerli | H-06 |
| R12 | Eşitlik | Aynı saldırı konuk ve host'ta aynı can/zehir/yavaşlatma/itme sonucunu verir. (inceleme düzeltmesi) Konuğun kendi ekranında zamanında yaptığı kaçınma ve blok da host'ta geçerli sayılır (K7-15, §3.8) | H-14 (Faz 2), H-17; (inceleme düzeltmesi) N-14 |

### 4.2 Blok yayı, parry penceresi ve kaçınma kareleri

| Öğe | Şimdi | Hedef |
|---|---|---|
| Blok yayı | ±1,35 rad (±77°) (`player.js:148`) | Aynı |
| Blok sonucu | %12 sızıntı, bedel `0,9·hasar + 4` (`:152-155`); itme `0,8·(konum − kaynak)` (mesafeyle büyüyor, `:160`) | Can 0 (K7-1); bedel aynı; (inceleme düzeltmesi) itki kaynaktan uzağa, büyüklüğü `min(opts.kb, 0,6)`. Bu, kara kipinde ≈ 0,32 m yer değiştirme ve 1,45 m/sn tepe hız demektir (`inc_knock.py`) |
| Parry penceresi | `blockT < 0,24` (`:151`); bırakınca 0,25 sn yeniden başlama gecikmesi (`:482-486`) | Aynı. Faz 2 §5.10(c) konuk toleransı 0,45 sn |
| Kaçınma | `invuln 0,34 sn` (`:495`) = 20 STEP (Faz 3, 1/60); eylem 0,46 sn; dayanıklılık 16; saldırı/isabet/blok/atış eylemlerinin 0,15. sn'sinden sonra başlatılabilir (`:489`) | Aynı. Hasar vuruş karesine bağlanınca (R2) görsel vuruştan ≤ 0,34 sn önce başlayan kaçınma her vuruşu boşa çıkarır |
| Ok/bıçak savuşturma | Yalnız yerel oyuncu (`enemies.js:1503-1505`) | Konukta host'un gölge blok bilgisiyle (Faz 2 §5.10 b) aynı kural |

### 4.3 Hasar anının klibe bağlanması (`strikes.js` ve iki evreli zaman bükme)

**Vuruş tablosu.** (inceleme düzeltmesi, K7-16) `tools/strike_table.mjs` (Node, salt-okur GLB) her saldırı klibi için **üç aday**
çıkarır: (1) silah ucunun (el yuvası yerel +Y 0,7 m) hız tepesi, (2) elin ya da ucun kök uzayında en ileri olduğu an, (3) elin
ya da ayağın en alçak olduğu an. Hamlenin sınıfı (`kesme | doğrama | süpürme | dürtme | yumruk | tekme | yere_vurma | bırakma`)
tabloda elle yazılır ve araç adaylardan sınıfa uygun olanı seçer: kesme, doğrama ve süpürmede (1); dürtme ve yumrukta (2);
tekmede ayakta (2); yere vurmada (3). Bırakma (fırlatma) için (1) ile (2) arasındaki aday kontak sayfasıyla seçilir.
Çıktı `js/game/strikes.js`'tir: `STRIKE[klip] = {t, sinif, el, adaylar:{uc, ileri, alcak}}`. İlk taslağın yöntemi (iki bilekten
büyüğünün doğrusal hız tepesi) dürtmelerde savuruşun ortasını, `Block_Attack`'ta neredeyse hareketsiz sağ bileğin örnekleme
gürültüsünü buluyordu (N-12, N-21). Elle düzeltme alanında ilk taslağın değerleri şöyle düzeltildi: `Block_Attack` L = kalkan
darbesi 0,34 (düşman), R = kılıç ucu 0,43 klip sn (ilk taslak 0,56); `Unarmed_Melee_Attack_Kick` ayak en ileri 0,37 klip sn;
`2H_Melee_Attack_Spin` üç tepe. Dev boss iskeletinde (`orc_brute`/`demon`): `Punch` el en ileri 0,50 (ilk taslak 0,313),
`Weapon` el önden geçiş 0,458 (0,313), `Wave` bırakma adayı 0,31–0,46, `Jump_Land` ayak en alçak 0,167 (0,104). Bu sayılar
`inc_strike.mjs`, `inc_strike2.mjs` ve `inc_giant.mjs` ölçümleridir.
**Kontak sayfası (inceleme düzeltmesi).** 40_savas_adaleti.js `?kontak=1` kipinde her `STRIKE` girdisi için vuruş karesinin
−2…+2 karelerini (1/60 sn aralık) `DK.snapFrom` ile yakalar ve `tests/out/kontak/<klip>.png` olarak yazar. Görüntü SwiftShader'da
da doğrudur; yalnız yavaştır. Kontak sayfası bir kez gözle onaylanır, onay `strikes.js`'te `onay: '2026-11-xx'` alanına yazılır.
Node testi tablonun GLB ile ±1/60 sn uyuştuğunu sınar.

**Düşman ve boss: iki evreli zaman bükme (K7-2).** `hitAt` (zorluk) ve `dur` korunur; yalnız animasyon bükülür:

```
s = STRIKE (klip sn), v = özgün klip hızı
hazırlık (t < hitAt):   timeScale = s / hitAt          → vuruş karesi tam hitAt anında
vuruş sonrası:          timeScale = v                  → özgün savuruş hızı
dur − hitAt ≥ 0,30 sn (bütün hamlelerde sağlanıyor); klip dur'dan uzunsa 0,15 sn'de IdleCombat'a geçilir
hitAt < 0,40 olan hamleler 0,40'a çıkar (Counter 0,38 → 0,40)
```

(inceleme düzeltmesi) **Uygulama biçimi: klip zamanı açıkça eşlenir.** Faz 3 A2a/A2b'den sonra karakter animasyonu çizim
evresinde `rdt` ile ilerliyor; hasar ise benzetim adımında (`stateT`) çözülüyor. Hazırlık sonunda `timeScale`'i değiştirmek, klip
zamanını çizim saatinin birikimine bağlar; kare süresi kırpılınca ya da `G.hitStop` sırasında kayma birikir. Bunun yerine her
çizimde `action.time = φ(stateT_ara)` yazılır ve `action.timeScale = 0` tutulur. Burada `φ(t) = t·s/hitAt_eff` (t < hitAt_eff),
`s + (t − hitAt_eff)·v` (sonrası) ve `stateT_ara` benzetim saatinin ara değerlenmiş hâlidir (Faz 3 `alpha`). Böylece R2 `DK.sim`
içinde de belirlenimci ölçülür (40 F2).
(inceleme düzeltmesi, N-13) **Öfke ve evre hızlanması.** `hitAt_eff = max(TELE_MIN(_UB), hitAt / öfkeÇarpanı)` ve
`dur_eff = dur / öfkeÇarpanı`. Bugün öfke (×1,2) alt sınırı deliyor (`enemies.js:921-922`). Dev bosslardaki `fast` çarpanı
(×1,25–1,35) alan saldırılarında 0,60 sn tabanının altına inmiyor (en küçük 0,667 sn); bu yine de F1'de sınanır.
(inceleme düzeltmesi, N-12) Dürtmeler (AtkStab, Stab2H, DualStab) **bükülmez**: bugünkü `hitAt` en ileri erişimle ±0,02 sn
örtüşüyor.

(inceleme düzeltmesi) Tablo §1.7a'daki sınıfa göre adaylarla yeniden hesaplandı. `s` değerleri adaydır; kontak sayfası
onayından sonra kesinleşir. Farkı ≤ 0,06 oyun sn olan hamleler bükülmez ("—"); "sınırda" olanlar (0,06 ± 0,01) kontak
sayfasına göre karara bağlanır.

| Hamle | s (klip sn) | `hitAt` | Hazırlık hızı s/hitAt | Sonrası | Not |
|---|---|---|---|---|---|
| Atk1 | 0,44 (uç) | 0,42 | — | 1,15 | Fark +0,04 oyun sn; bükülmez |
| Atk2 | 0,26 (uç) | 0,44 | 0,60 | 1,15 | Geniş savuruş yavaş hazırlanır |
| Atk3 | 0,60 (uç) | 0,52 | — | 1,05 | Fark −0,05; bükülmez |
| AtkStab | 0,77 (en ileri) | 0,58 | — | 1,35 | Dürtme; bugün doğru (N-12) |
| axe Atk3 / Atk1 | 0,60 / 0,43 | 0,55 / 0,45 | — / — | 1,0 / 1,1 | Sınırda (+0,06); kontak sayfası |
| shield Atk1 / Counter / Atk3 | 0,43 / 0,34 (L) / 0,60 | 0,50 / **0,40** / 0,68 | 0,86 / 0,85 / — | 1,0 / 1,05 / 0,85 | Counter yalnız 0,40 tabanı için bükülür |
| Atk2H / Stab2H / Heavy2H | 0,37 / 0,77 (en ileri) / 0,83 (uç) | 0,52 / 0,62 / 1,15 | 0,71 / — / 0,72 | 1,0 / 1,2 / 0,82 | Stab2H dürtme; bugün doğru |
| DualSlice / DualChop / DualStab | 0,58–0,76 / 0,48–0,54 / 0,77 (en ileri) | 0,40 / 0,47 / 0,55 | kontak sayfası / — / — | 1,25 / 1,2 / 1,4 | DualSlice erken: hasar ileri alınamaz (0,40 taban), bu yüzden hazırlık hızlandırılır (s/hitAt > 1) ya da `hitAt` 0,46'ya çekilir |
| Punch / Punch2 / Kick | 0,50 (en ileri) / 0,49 (en ileri) / 0,37 (ayak) | 0,44 / 0,52 / 0,45 | — / 0,94 / 0,82 | 1,25 / 1,25 / 0,95 | Punch fark +0,04; Kick sınırda |
| SPIN | 3 tepe | 0,70 / 1,15 / 1,60 | Tepe aralıklarında parçalı | 1,1 | Öfkede taban (N-13) |
| DASH (yeni klip seçimi `Stab2H`) | 0,77 (en ileri; ilk taslak 0,37) | 0,90 | 0,86 | 1,2 | Atılma 0,6–0,9 sn arasında |
| Taş Muhafız yumruk / süpürme | 0,50 / 0,458 (ilk taslak 0,313 / 0,313) | 1,1 / 0,9 (÷ öfke 1,35) | 0,45 / 0,51 | 0,75 / 0,8 | |
| Taş Muhafız tepinme | Jump → Jump_Land 0,167 (ilk taslak 0,104) | 1,4 | Kalkış 0,6 sn, havada, iniş teması 1,4 | — | Hasar temasta |
| Volkanik Dev süpürme / yere vurma | 0,458 / Jump_Land 0,167 | 1,0 / 1,2 (÷ 1,25) | 0,46 / dizi | 0,7 | Dalga temasta başlar |

**Oyuncu (I-10):** oyuncu saldırısı tepkili olmalı; bükme yok, `hitAt = s / v` yapılır. (inceleme düzeltmesi) Sınıfa göre
ölçümde (`inc_strike2.mjs`, `inc_profile.mjs`) yalnız iki hamle R2 toleransını aşıyor: `SWORD_MOVES` 2: 0,27 → **0,18** (uç tepesi;
ilk taslak 0,16) ve 3: 0,36 → **0,45** (uç tepesi 0,46; ilk taslak 0,44). Diğerleri değişmez: 1 (0,25; uç 0,30, fark −0,05),
ağır (0,60; uç 0,64, fark −0,04), **karşı (0,26; kılıç ucu 0,305, fark −0,045)**, yumruk 1 (0,24; en ileri 0,29, fark −0,05),
yumruk 2 (0,26; 0,27) ve **tekme (0,34; ayak en ileri 0,32)**. İlk taslağın karşı saldırı 0,26 → 0,40 ve tekme 0,34 → 0,29
değişiklikleri geri alındı. Bu değerler bilek hız tepesinin yapıntısına dayanıyordu (N-21): ilki 0,1 sn'lik yeni bir gecikme
yaratırdı, ikincisi hasarı ayak uzanmadan verirdi. `chainAt` > `hitAt` kuralı korunur (3: 0,82 > 0,45). Faz 2 `hostCombat` değeri
tablodan okur (Ç-4). Atılım `t < hitAt` boyunca uygulandığı için Atk3'ün atılım süresi 0,36'dan 0,45 sn'ye uzar; K7-14 kabul
edilirse duran oyuncuda atılım zaten 0'dır. Eylem süresi klipten kısa olan hamlelerde (Punch %70, Punch2 %67) eylem bitince
klip **toparlanma evresi** olarak üst katmanda sürer, bacaklar hareketle serbest kalır (kesilme yok).

### 4.4 Kök hareket ↔ fiziksel hareket

- `kk._prepClips` (`kk.js:130-142`) şu kliplerde kalçanın yatay (x, z) izini ilk karenin değerine sabitler:
  `Dodge_Forward/Backward/Left/Right`, `1H_Melee_Attack_Jump_Chop`, `Death_A`, `Lie_StandUp` (K7-10). Dikey iz korunur.
- Fiziksel kaçınma yolu aynen kalır (`player.js:518-521`, ≈ 2,3 m; Faz 3 FD testleri): görüntü = fizik.
- Saldırı atılımı (I-09): tam gövde klibinde ayak yere basılıyken atılım 0; atılım yalnız (a) üst katman eylemlerinde (bacaklar
  yürür) ve (b) klibin kendi sıçradığı evrede (`AtkHeavy`, ayaklar 0,18–0,60 klip sn havada; fiziksel atılım = klibin ayıklanan
  0,48 m'lik ileri kök hareketi) uygulanır. `combat.js` `lunge` alanı bu kurala göre yorumlanır (`player.js:522-525`).
  (inceleme düzeltmesi, K7-14) Bu bir oynanış değişikliğidir. Bugün duran oyuncunun her hafif vuruşu `lunge × hitAt` kadar,
  yani 0,35–0,94 m ilerliyor; kural bu ilerlemeyi kaldırır. Vurulan düşman `kb·(1 + hasar·0,04)` ile geri itildiği için
  (`enemies.js:389-395`) 3'lü zincirin son vuruşu ıskalayabilir. Ölçüt 40 F12: 1,0 m geri itilen haydut'a duran oyuncunun 3'lü
  zinciri 3/3 isabet eder; gerekirse `SWORD_MOVES` menzili +0,3 m artırılır (oynanış dengesi korunur). Faz 2 06j yeniden koşulur
  ve değişiklik Faz 2 §13.5 listesine yazılır (Ç-15).
- Düşman kaçınması (`enemies.js:491-499`, 7 m/sn × 0,38 sn = 2,66 m) aynı ayıklamadan yararlanır.
- Ölçüt: kaçınma boyunca `|kalça_xz − konum_xz − bağlama ofseti| < 0,1 m`; eylem sonunda sıçrama yok.

### 4.5 `hurt` sonuç sözleşmesi

```js
// Player.hurt(amount, from, opts) → 'dodged' | 'parried' | 'blocked' | 'guardbreak' | 'hit' | 'immune'
// Yan etkiler yalnız combatRules.resolveHitEffects(sonuç, opts, oyuncu) ile:
//   'hit' | 'guardbreak'          : knock(opts.kb), slowT = max(slowT, opts.slow), poison = max(poison, opts.poison)
//   'blocked'                     : knock = min(opts.kb, BLOCK_KB_MAX = 0,6) yalnız   (inceleme düzeltmesi: itki, hız değil)
//   'parried' | 'dodged' | 'immune': hiçbiri
// (inceleme düzeltmesi) Enemy.hurt(dmg, info) → applyDamage'ın sonucunu döndürür:
//   'hit' | 'blocked' (kalkan; Faz 6 lightBound) | 'dodged' | 'immune' (faz, kalkış, ölü, Faz 6 surrender)
//   Bugün applyDamage'ın dönüşü yok sayılıyor ve her zaman 'hit' dönüyor (enemies.js:363-364).
// (inceleme düzeltmesi) BossBase.applyDamage: damageMul ≤ 0 → 'immune' (bugün 'blocked', bosses.js:109)
```

| Çağıran | Bugün | Hedef |
|---|---|---|
| `Enemy._hitPlayer` (`enemies.js:1000-1008`) | `slowT = 2,2` ve `knock` koşulsuz (yalnız `!blocking`) | `opts.slow` ve `opts.kb` → sözleşme (Faz 6 S6 B4 ile aynı yol, Ç-5) |
| `bosses.hitPlayer` (`bosses.js:42-46`) | `knock` her çağrıda | Sözleşme |
| `enemies._impact` (`:1441-1443`) | Zehir yalnız yerel oyuncuya, `invuln` elle denetim | `opts.poison` → sözleşme; konuğa `po` |
| `animals.js:507`, `megafauna.js:651`, `fish.js:562` | Sonuç kullanılmıyor | Sözleşme (`melee: true`, `attacker`) |
| Konuk `hurt` işleyicisi (`net.js:536-539`) | `m.kb` koşulsuz | `m.kb/po/sl` yalnız yerel sonuç `'hit'/'guardbreak'` ise |
| `Enemy.hurt` (`enemies.js:340-365`) | Dokunulmazda `null`; `applyDamage` dönüşü yok sayılıyor (`:363-364`) | `'immune'` (faz, kalkış, ölü, Faz 6 `surrender`); (inceleme düzeltmesi, N-18) `applyDamage` dönüşü yayılır, böylece Faz 6 B3 `lightBound`'un `'blocked'` değeri çağırana ulaşır |
| `combat._meleeHit` (`combat.js:201-206`) | `null`'u isabet sayıyor | `'immune'` → gri kıvılcım, `hitMarker` yok |
| `BossBase.hurt` konukta (`bosses.js:103`) | Her zaman `'hit'` | Faz 2 sonrası yerel tahmin: `damageMul(info) ≤ 0` ise `'immune'` |
| (inceleme düzeltmesi) `BossBase.applyDamage` host'ta (`bosses.js:107-109`) | `damageMul ≤ 0` → `'blocked'`, kılıç geri seker (`combat.js:226-229`) | `'immune'` (N-18) |
| (inceleme düzeltmesi) `enemies._impact`, sahibi `SeaSerpent` (`enemies.js:1442`) | `_hitPlayer` yok → can hasarı yok; zehir yalnız yerel oyuncuya | Ortak `BossBase._hitPlayer` (§3.1); zehir `opts.poison` ile (N-11) |
| (inceleme düzeltmesi) Faz 6 B1 `icebolt` (`buz` mermisi) | Faz 6 tasarımı: isabette `slowT` | `opts.slow` → sözleşme; kaçınmada ve blokta yavaşlatma yok (Ç-16) |

### 4.6 Görüş hattı (H-08)

| Yol | Sorgu | Dosya |
|---|---|---|
| Düşman yakın dövüşü | `segmentQuery(saldıran y+1,2·ölçek → oyuncu y+1,2, {mask: GORUS, startPad 0,2, endPad 0,2})` kapalıysa o oyuncu atlanır | `Enemy._resolveMelee` `hitOne` (`enemies.js:982-994`) |
| Saldırı başlatma | Aynı sorgu açık değilse saldırı başlamaz (ince duvara dayanıp vurmaz) | `_meleeOrStrafe` (`:872-899`), `_reachable` (`:863-869`) |
| Dev boss alan saldırısı | Merkez + 1 m → oyuncu göğsü | `GiantBase.aoe` (`bosses.js:606-619`) |
| Lob çarpması | Çarpma noktası + 0,5 m → oyuncu göğsü | `enemies._impact` (`:1431-1455`) |
| Oyuncunun yakın dövüşü (ağır vuruşun alan kısmı dahil) | Faz 2 `opts.los` yerel oyuncuda da açık (Ç-3) | `combat._meleeHit` (`combat.js:188-232`) |
| (inceleme düzeltmesi, N-23) Bütün yakın dövüş görüş sorguları | Saldıranın **üzerinde durduğu geminin** gövdesi (`gemi` bayrağı) sorgudan çıkarılır (`opts.skipShip = saldıran.ship`). Faz 3 R7 kuralı bunu kapsamaz: güverte ortasındaki göğüs `hullSolid` içinde sayılmıyor (`camera.js:28`), ama küpeşte bandını (güverte + 0,75 m) kesen doğru engellenir. Bu kural olmazsa güverteden su düzeyindeki sersem Yılan başına (`bosses.js:480`) ve bordadaki dokunaca vuruş kesilir | `combat.js`, `enemies.js` (`hitOne`) |

### 4.7 Mermiler

- Güdüm (H-07, `enemies.js:1483-1486`): `homingK` yalnız `dot(vel, hedef − konum) > 0` ve hedef `invuln ≤ 0` iken; dönüş ≤ 90°/sn;
  hayalet küresi ömrü 4 → 2,5 sn (`:1532`).
- Kaçınmada mermi içinden geçer (`:1506`, bugünkü), ama `s.passed.add(oyuncu)`: o oyuncuya bir daha isabet etmez.
- Lob (N-8): `lob()` halka ölçeği `R = aoe` (`:1423`), `_impact` yatay mesafe ≤ R ve |dy| ≤ 2,2 (`:1440`).
- Faz 3 A5 mermi ile duvar arasındaki `t` karşılaştırması aynen.

### 4.8 Hayvanlar (H-06)

`Animal.update` `attack` (`animals.js:499-515`) iki evreye ayrılır: hazırlık 0,3–0,5 sn (türe göre; ısırık klibi başlar), hasar
ısırık klibinin vuruş karesinde (kurt `Attack` ön bacak 0,23 klip sn, yeti `Punch` 0,31; `strikes.js`'e hayvan modelleri eklenir).
`hurt(dmg, pos, {melee: true, attacker: this, poison, cause})`: blok ve parry çalışır, parry hayvanı 1,0 sn sersemletir.
R8 görüş hattı ve hayvanın önündeki ±60° yay koşulu. Konuğa `po`. Hayvan yürüyüşüne (`_walk` `:556-569`) yalnız ileri sonda +
sapma eklenir; hayvan yapay zekâsının geri kalanı kapsam dışıdır.

### 4.9 Co-op eşitliği

- Konuğa giden `hurt` iletisine (Faz 2 şeması: `dmg, from, cause, melee, ub, bullet, aid, kb`) **`po`** (zehir sn, ≤ 10) ve
  **`sl`** (yavaşlatma sn, ≤ 3) eklenir (K7-11). Konuk yan etkileri kendi `hurt` sonucuna göre uygular (§4.5).
- Host gölge canı (Faz 2 §5.10 b): blok ×`BLOCK_LEAK` (= 0), kaçınma penceresi 0, zehir konuğun bildirdiği cana iner.
- `enemies._impact` (`:1437-1445`) konuklara `_hitPlayer` üzerinden `po` gönderir (bugün `t.id === G.myId` koşulu).
- Ok ve bıçak savuşturması konukta host'un gölge blok bilgisiyle (Faz 2 `cs`) aynı kuralla.
- Patlama ve kaya hasarı Faz 2'de (gölge can); burada yalnız test (08a).
- (inceleme düzeltmesi, K7-15) **Zaman eşitliği.** Konuğun kaçınma ve blok niyeti Faz 5 `act.vt` ile değerlendirilir (§3.8).
  Bugün konuk yerelde `invuln` ile hasarı atlıyor (`player.js:144-147`), ama host gölge canı niyetin alındığı anı esas alıp canı
  düşürüyor; ardından gelen `hp{v}` düzeltmesi (Faz 2 §5.10 d) konuğa "sebepsiz hasar" olarak yansıyor. `vt` ile bu uyuşmazlık
  RTT 120 ms'de kapanır. Daha büyük gecikmede 0,25 sn'lik geri sarma sınırı nedeniyle kısmen kalır; bu kalan risk R16'dır.

---

## 5. Karakter animasyonu

### 5.1 Ölçüm ve doğal hızlar

Doğal yer hızı: kök sabitken destek ayağının (alçaktaki ayak) ortalama hızının tersi (kk.js oran düzeltmesi ve 1,8 m
ölçeğiyle). Oran = `doğalHız × klipHızı / gövdeHızı`; hedef **0,85–1,15**.
(inceleme düzeltmesi, N-16) **Destek eşiği 1,5 cm'dir** (ayak en alçak düzeyinin 1,5 cm üstüne kadar). İlk taslağın 3 cm eşiği
yürümede döngünün %90'ını destek sayıyor ve salınım evresini ölçüme katıyordu; doğal yürüme hızı bu yüzden %20 yüksek çıkıyordu.
Değerler `inc_gait_med.mjs` ve `inc_gait_med2.mjs` ölçümleridir (barbarian, rogue, sk_minion; aralık 0,02 m/sn içinde).
Parantez içinde ilk taslağın 3 cm değeri verilmiştir.

| Klip (oyun adı) | Süre (sn) | Doğal hız, 1,5 cm (3 cm) (m/sn) | Doğal hızda kalan kayma medyanı | Bugünkü referans (oyuncu / düşman) | Bugünkü oran |
|---|---|---|---|---|---|
| `Walking_A` (Walk) | 1,067 | **0,71** (0,86) | 0,06 | 1,9 / 1,7 | 0,37 / 0,42 |
| `Walking_Backwards` (WalkBack) | 1,067 | **0,77** (0,85) | 0,13 | 1,9 / 1,6 | 0,41 |
| `Running_A` (Run) | 0,800 | **3,75** (3,60) | 0,25 | 5,2 / 5,0 | 0,72 / 0,75 |
| `Running_C` (Sprint) | 0,800 | **3,79** (3,68) | 0,11 | 6,6 / — | 0,57 |
| `Running_Strafe_Left/Right` | 0,800 | **3,75 / 3,67** (3,55 / 3,50); yön ileriye ~60° (N-3) | 0,24 / 0,27 | 3,6 / — | 1,02 |
| `Walking_D_Skeletons` (WalkSk) | 1,600 | **0,54** (0,62) | 0,08 | — / 1,3 | 0,42 |
| `Walking_C` (WalkC, hayalet) | 1,600 | **0,46** (0,57) | 0,06 | — / 1,7 | — (süzülür, N-20) |
| `Running_B` (RunB, hayalet) | 1,067 | **2,36** (2,31) | 0,22 | — / 5,0 | — (süzülür, N-20) |

(inceleme düzeltmesi) **Kadans sınırı.** Doğal yürüme hızı 0,71 m/sn olduğu için 1,5 m/sn'lik yürüyüş, klibin 2,1× oynatılmasını
(≈ 4 adım/sn) gerektirir. Bu bir "koşuşturma" görüntüsü verir. Bu yüzden klip hızı adım sıklığıyla sınırlanır:
`ts ≤ kadans_max × süre(klip) / 2`. Yürüyüşte (Walk, WalkBack, WalkSk, WalkC) kadans en çok 3,6 adım/sn'dir; bu Walking_A ve
Walking_Backwards için ts ≤ 1,92, WalkSk ve WalkC için ts ≤ 2,88 demektir. Koşu ve sprintte kadans en çok 5,0 adım/sn'dir;
bu Running_A ve Running_C için ts ≤ 2,0, Running_B için ts ≤ 2,67 demektir.

### 5.2 On dokuz hareket

Test sütunu §9.2'deki `43_animasyon_hareket` kontrol numarasıdır.

| # | Hareket | Şimdiki klip ve kod | Geçiş / kesilme | Bilinen hata | Hedef | Test |
|---|---|---|---|---|---|---|
| 1 | Yürüme | Walk = `Walking_A`, `hs/1,9` [0,5; 1,9] (`player.js:697`) | Walk→Run 3,7 / 3,1 histerezis (`:692`) | Oran 0,45 (I-01; 1,5 cm eşikle 0,37) | (inceleme düzeltmesi) `ts = min(hs/(0,71·boy), 1,92)`; Walk→Run 1,6 / 1,4 (§5.3) | H01 |
| 2 | Koşma | Run = `Running_A`, `hs/5,2` [0,55; 1,5] (`:699`) | Run↔Sprint 5,9 / 5,0 | 0,69 (1,5 cm eşikle 0,72) | (inceleme düzeltmesi) `hs/(3,75·boy)` [0,40; 2,0] | H02 |
| 3 | Sprint | Sprint = `Running_C`, `hs/6,6` [0,75; 1,4] (`:698`); tükenme kilidi (`:450-461`) | 0,6 sn yumuşak iniş (`:460`) | 0,56; koşudan ayırt edilemiyor | (inceleme düzeltmesi) `hs/(3,79·boy)` [1,30; 2,0]: adım sıklığı farkı görünür | H03 |
| 4 | Ani durma | Klip yok; yavaşlama 13/sn (`:537`) ≈ 0,22 sn | Run→Walk (0,2) → Idle (0,3) | Gövde durduktan sonra bacaklar adım atıyor | Girdi yokken yavaşlarken hs < 0,6 → doğrudan Idle 0,12 sn; o ana dek ts eşlemesi | H04 |
| 5 | Yön değiştirme | Dönüş 12 rad/sn (sprint 7) (`:532`); 0,3 sn A→B→A bastırma (`:695`) | — | 180°'de hs 0'dan geçerken bir kare Idle, `_gait = null`, klip baştan | Girdi varken (mag > 0,3) hs < 0,25 olsa da 0,25 sn yürüyüş biçimi korunur; klip yeniden başlamaz | H05 |
| 6 | Zıplama | `JumpStart` 1,5× (`:563`); `airT > 0,25` → `Jump_Idle` (`:663-669`); güverte `:867-871` | — | Kalkış 0,19 sn geç (I-05); küçük sandıkla JumpStart yok (`:563`) | Klip 0,25 klip sn'den başlar (kalkış farkı ≤ 0,05 sn); sandıkla alt gövde JumpStart | H06 |
| 7 | İniş | `Jump_Land` 1,4×, ≥ 1,8 m, hs < 3,2, taşımıyorken; eylem 0,3/0,5 sn (`:599-613`, `:271`) | → hareket 0,2–0,3 | 1,8–3 m'de klibin %63'ü oynuyor (I-10) | Süre = klip/hız (0,476 sn); 0,25 sn'den sonra hareket girdisi 0,15 sn geçişle keser | H07 |
| 8 | Yüzme | Prosedürel IK, Idle taban; eğim 1,2 rad, kaldırma 1 (`character.js:891-898`, `player.js:788-791`) | — | Gövde–bacak 129°, eller omzun 0,16–0,66 m gerisinde (I-08) | Hedefler eğimli model uzayında; kulaç baş önünden kalçaya; bacak çırpması gövde ekseninde; `swimPhase` hıza bağlı | H08 |
| 9 | Dalış | Aynı, eğim 1,35 ± dikey hız (`player.js:788`) | — | 122° | Aynı (≥ 150°) | H09 |
| 10 | Merdiven | Prosedürel, el hedefi 1,85 m, 1,6 sn betik (`player.js:955-983`, `character.js:906-911`) | Sonda `boardShip` | Eller basamakta değil, hedef ulaşılamaz (N-4); tırmanırken ölünce betik sürüyor (`:366`, `:966-969`) | Basamaklar 0,4 m (`shipModel.js:505-507`): el = en yakın erişilir basamak (omuz + ≤ 0,40·boy), ayak = basamak; evre ilerlemeye bağlı; ölümde betik iptal; Faz 3 MI03 süresi (1,6 sn ± 1 STEP) korunur | H10 |
| 11 | Sandık taşıma | Eller sabit (±0,30; 1,02; 0,42) (`character.js:879-881`); sandık 0,55 m önde (`treasure.js:289-294`) | Kaldırma/bırakma klibi yok | Eller sandığın içinde; büyük sandık baş üstünde; Walk kayıyor (I-04) | Tutamak sandık kutusundan (§5.4, K7-13); kaldırma/bırakma 0,5 sn `PickUp`; gait eşlemesi | H11 |
| 12 | Kazı | `Heavy2H` 0,85× döngü (`player.js:273`); efekt `setInterval` 380 ms (`treasure.js:198-203`) | `busy` iptali (`:285-289`) | Kürek 0,30 m havada, sol el sapta değil, duraklatmada efekt sürüyor (I-17); `cancelOnMove` okunmuyor (`:280`) | Kalça 0,25 m alçalır + omurga eğimi + sol el IK; efekt klip zamanı 1,17/1,92'de oyun saatiyle; `setInterval` kalkar | H12 |
| 13 | Saldırı | `SWORD_MOVES`/`FIST_MOVES` (`combat.js:18-29`); `pick()` başta tam gövde/üst katman seçer (`player.js:250-256`) | Zincir `chainAt` | Tam gövdede 2,2 m/sn kayma, atılım kayması (I-09); Atk2/Counter zamanı, Punch kesilmesi (I-10) | Tam gövde eylemde hareket girdisi gelince eylem üst katmana devredilir; `hitAt` vuruş karesine (§4.3); atılım kuralı (§4.4) | H13 |
| 14 | Parry | `Parry` = `Block` klibi 1,9× üst katman, eylem 0,4 sn (`:266`, `:195`) | — | Test yok | Aynı; düşman sersemi ve karşı saldırı penceresi ölçülür | H14 |
| 15 | Blok | `Block` = `Blocking` üst katman (`:662`); `BlockHit` 1,7× | Yan adım / geri yürüme (`:681-686`) | İleri/geri yürüyüş oranı 0,45 | Gait eşlemesi; geri 1,5 m/sn (K7-9b) | H15 |
| 16 | Kaçınma | `Dodge_F/B/L/R` (`:265`), itki `2,5 + 7,5k²` (`:518-521`) | Eylem süresi = klip | Kök hareketi 0,27–0,67 m (I-06) | Kök hareketi ayıklanır (K7-10) | H16 |
| 17 | Tabanca doldurma | `Reload` üst katman, hız `1,17/süre` (`:260`); süre `reloadT × 0,9` (`combat.js:108`) | — | Kip değişince taban klibi donuyor (I-11); silah değişince klip başka silahla sürüyor | `setMode`/`equip` üst katman eylemini iptal eder (zamanlayıcı sürer) | H17 |
| 18 | Dümen | `overlay.helm` + IK çark halkasına (`player.js:905-924`) | — | Bilek–hedef 0,39–0,53 m (I-03); 1–7 tuşu silahı geri veriyor (`:111-112`) | Erişim içi tutamak (§5.4); istasyonda `hold` engellenir | H18 |
| 19 | Top kullanma | IK kundak tutamaklarına (`:926-942`) | — | 0,34–0,37 m (I-03) | §5.4 | H19 |

### 5.3 Ayak kayması ölçütü ve yürüyüş eşlemesi

(inceleme düzeltmesi) Eşleme 1,5 cm eşikli doğal hızlarla ve kadans sınırıyla yeniden yazıldı (K7-9):

```
v(klip)  = doğalHız(klip) × boy            (oyuncu: appearance.height 0,94–1,06; düşman: root ölçeği 1,0–1,3)
Idle     : hs < 0,25
Walk     : 0,25 ≤ hs < 1,6 (Run'dan dönüş 1,4)  → ts = hs / v(Walk)      [0,30; 1,92]   (kadans ≤ 3,6 adım/sn)
Run      : hs ≥ 1,6                            → ts = hs / v(Run)       [0,40; 2,00]
Sprint   : sprint ve hs > 5,0 (çıkış 4,6)      → ts = hs / v(Sprint)    [1,30; 2,00]
Yan adım : nişan/savunma, 45° < |rel| < 135°   → ts = hs / v(Strafe)    [0,40; 2,00]
Geri     : |rel| > 135°                        → ts = hs / v(WalkBack)  [0,30; 1,92]
Çömelme  : her hızda Walk + çömelme IK          → ts = min(hs / v(Walk), 1,92)
Karışım  : 1,4–2,0 m/sn bandında Walk ve Run aynı normalize evreyle, w = smoothstep(1,4; 2,0; hs) (F7-14b)
Hayalet  : ayak teması yok (N-20); WalkC ts ≤ 2,88, RunB ts ≤ 2,67 — yalnız kadans
```

| Durum | Hız (m/sn) | Klip | ts | Oran |
|---|---|---|---|---|
| Analog yürüme | 1,5 | Walk | 1,92 (sınır) | 0,91 |
| Çömelme | 1,7 | Walk + çömelme IK | 1,92 (sınır) | 0,80 (bilinçli uzlaşma) |
| Nişan/savunma ileri | 2,0 | Run (ya da karışım) | 0,53 | 1,00 |
| Nişan/savunma geri | 1,5 (K7-9b) | WalkBack | 1,92 (sınır) | 0,99 |
| Nişan/savunma yan | 2,0 | Strafe | 0,54 | 1,00 (yön hatası ~30°, N-3) |
| Sandık (×0,6) | 2,64 | Run | 0,70 | 1,00 |
| Koşu | 4,4 | Run | 1,17 | 1,00 |
| Sprint | 7,0 | Sprint | 1,85 | 1,00 |
| Haydut devriye / kovalama | 1,5 / 4,3 | Walk / Run | 1,92 (sınır) / 1,15 | 0,91 / 1,00 |
| İskelet devriye (WalkSk) | 1,2 | WalkSk | 2,22 | 1,00 |
| Hayalet devriye / gece kovalama | 1,3 / 4,6–5,3 | WalkC / RunB | 2,83 / 1,95–2,25 | — (süzülür) |

**Ölçütler (inceleme düzeltmesi):** (1) Oran 0,85–1,15; çömelmede ≥ 0,80 (yukarıdaki her durum, 4 gövde × 3 boy; hayaletler
hariç). (2) Doğrudan ölçüm, 1,5 cm destek eşiğiyle: sabit hızda destek ayağının dünya yatay hızının medyanı yürüme ve çömelmede
≤ 0,35 m/sn, koşu ve sprintte ≤ 0,40 m/sn. İlk taslağın "< 0,25 m/sn" ölçütü 3 cm eşikte doğal hızda bile tutmuyordu (kalan kayma
yürümede 0,27, koşuda 0,34 m/sn); 1,5 cm eşikte doğal hızdaki kalan kayma 0,06–0,25 m/sn'dir. (3) Sprint ile koşu arasında adım
sıklığı farkı ≥ %40 (1,85 / 1,17 → %58). (4) Kadans sınırları aşılmaz: yürüyüşte ≤ 3,6, koşuda ≤ 5,0 adım/sn. (5) F7-14b: Walk↔Run
geçişinde (karışımla) adım sıklığı tek karede %30'dan fazla sıçramaz. Eşlemenin tek kaynağı `js/core/gait.js`'tir; oyuncu
(`player.js:681-699`), düşman (`enemies.js:1148-1160`) ve uzak oyuncu (`net.js:112`) aynı işlevi kullanır.

### 5.4 El hizası ve IK

**Erişim kuralı:** her tutma hedefi için 4 gövde × 3 boyda `|hedef − omuz| ≤ kol − 0,03 m` (Node `ik_reach.mjs`). Ölçülen
(`reach.mjs`, Idle pozu): omuz x ±0,155–0,183, y 0,94–1,11, z −0,015; kol (omuz–bilek) 0,424–0,501 m (en kısa `subay` 0,94).

| Tutma | Bugün | Hedef | Doğrulama |
|---|---|---|---|
| Dümen (K7-7) | Çark istasyondan 0,9 m önde, 1,2 m yukarıda, kavrama yarıçapı 0,5 (`shipModel.js:440`, `:529`; `player.js:918-921`) | Çark düzlemi istasyon kökünden **0,35 m** önde, kavrama yarıçapı **0,20** (göbeğe yakın parmaklar), kavrama merkezi güverte + **0,95 m**. İstasyon `helmZ − 0,20`; direk çarkın önüne (`helmZ + 0,30`) alınır | Tarama: dümen tam kırıkken bile en kötü eksik −0,033 m (erişilir) |
| Top | Oyuncu kundağın 1,2 m gerisinde, tutamak (±0,28; 0,62; −0,5) (`player.js:932-939`) | Oyuncu **0,85 m** geride, tutamak top yerelinde (±0,20; 0,80; −0,50) | En kötü eksik −0,02 m |
| Sandık (K7-13) | Sabit (±0,30; 1,02; 0,42) | Sandık kutusunun arka-alt kenarı: x = ±min(yarıGenişlik − 0,08; 0,28), y = taban + 0,05; sandık arka yüzü kökten 0,22 m önde, taban 0,80·boy | Bilek–tutamak < 0,08 m; bilek kutu dışında |
| Kürek | Yalnız sağ el | Sol el sap ekseninde, sağ elin 0,35 m aşağısı | Sol bilek–sap < 0,08 m |
| Merdiven | 1,85 m (ulaşılamaz) | En yakın basamak, y ≤ omuz + 0,40·boy; ayaklar basamakta | El–basamak < 0,10 m |
| Tabanca namlusu (I-20) | Sabit nokta (`combat.js:249`) | `Player.muzzleWorld()` = `char.held.localToWorld(userData.muzzle)` (`character.js:268`); alev ve Faz 3 namlu sorgusu bunu kullanır | Alev–namlu < 0,05 m |
| Ayak (I-12) | `ik.ground` atanmıyor | Karada `c.ik.ground = (x, z) => physics.floorAt(x, z, pos.y + 0,6)` (yan etkisiz; `groundAt` `lastPlatform`'u değiştiriyor), güvertede gemi yerel `deckAt`; hs > 2'de ağırlık 0; `model.position.y` ofsetleri tek birikimli değer (`character.js:858`, `:873`, `:928`) | 20° yamaçta ve 0,3 m basamakta iki taban ±3 cm |

Faz 3 C-12 çakışması (Ç-2): dümen ve top istasyonları nesneye yaklaştığı için `deckObstacles` itme yarıçapları yeni mesafelerden
yeniden türetilir: dümen direği–istasyon 0,50 m → itme ≤ 0,45; top–istasyon 0,85 m → itme ≤ 0,80. Faz 3 GV03 bu değerlerle koşulur.

(inceleme düzeltmesi) Dümende 0,20 m'lik kavrama yarıçapı, ellerin göbeğe yakın parmaklıkları tuttuğu anlamına gelir. Gerçek
dümencide eller jantın dışındaki tutamaklardadır; seçilen poz görsel olarak alışılmadıktır. Eşdeğer seçenek: çark yarıçapı
0,5 → 0,36 m, tutamaklar jant üzerinde, çark merkezi güverte + 1,0 m. Karar `ik_reach.mjs` taramasıyla ve dümen kontak sayfasıyla
(43 H18 görüntüsü) verilir; iki seçenek de erişim kuralını (`kol − 0,03`) sağlamalıdır. Bu bir görsel karardır, oynanışı etkilemez.

### 5.5 Kesilme ve yanlış klipte kalma koruması

- **`Player.setMode(next, opts)`** tek geçiş noktası: mevcut kipten çıkış (dümen/top → `shipControl.leaveStation`, kayık → çıkış,
  yüzme → `exitWater`, tırmanma → iptal), `_resetCombatFlags`, üst katmanda oynayan eylemlerin iptali (`shoot, reload, use, throw,
  blockhit, parry`, üst katmanda başlamış `atk`), kip kuralına göre `hold(equipped)`, `_syncTorch`, `underwater = false`,
  `ik.handL/R = null`, istasyon kilitlerinin bırakılması, yürüyüş durumunun sıfırlanması. Çağıranlar: `boardShip` (`player.js:294`),
  `leaveShipToWorld` (`:314`), `enterWater` (`:720`), `exitWater` (`:803`), `startClimb` (`:971`), `_updateClimb` sonu (`:966`),
  `shipControl.takeHelm/takeCannon/leaveStation` (`shipControl.js:174-196`), kayık, `handlers.respawn` (`main.js:226-241`; bugün
  doğrudan `p.mode = 'ground'`, `:233`), `revive` (`player.js:236`). I-07 ve I-11 kapanır.
- `_locomotion` (`player.js:660`) ve `_wantAnim` (`:423`) "eylem var ve üst katman yok" koşulu yerine **`action.full`** (eylem tam
  gövde klibi oynatıyor) bayrağına bakar.
- **Tutarlılık bekçisi** (yalnız `?test=1`): her karede (a) tam gövde eylemi varsa `currentName` o eylemin klibi; (b) eylem yoksa
  kipin izinli kümesi (`ground/deck`: Idle, IdleB, IdleCombat, Walk, Run, Sprint, StrafeL/R, WalkBack, JumpStart, Jump_Idle,
  Jump_Land; meşgulken Interact, UseItem, PickUp, Heavy2H; `swim/helm/cannon/boat/climb`: Idle); (c) üst katman yalnız üst katman
  eylemi, nişan ya da savunmada. 0,2 sn'den uzun ihlal `DK.anim.violations`'a yazılır. Ölçüt: 43 ve 40 boyunca 0.
- **Ragdoll kalkışı (I-16):** `stopRagdoll` (`character.js:796-809`) Idle yerine `LieUp`'ı geçişsiz ve ilk karesinden başlatır;
  kök ragdoll kalçasına taşınır; `revive` (`player.js:236-245`) yeniden başlatmaz.
- **Güverte ragdoll'u (I-19):** `startRagdoll({frame: ship.root})` noktaları gemi yerelinde tutar, `_pose`'da dünyaya çevirir
  (`ragdoll.js:110-154`, `player.js:224-235`).
- **Etkileşim (I-18):** basılı tutmalı adayda (`interact.js:47-70`) `holdT > 0` iken `playUpper('Interact' | 'UseItem')` döngüde;
  bırakınca durur. Tek basışlı toplama/açmada `startAction('pickup')`.

### 5.6 Uzak oyuncu animasyonu (I-15)

- Faz 5 `aq` sayacı aynı tek seferlik klibi yeniden başlatır (çözülmüş).
- Faz 7: `st` ve `snap.p`'ye **`ts`** (taban klip hızı, 1/50 nicemli) ve Faz 5 `fl` bit alanına **crouch (2), tread (4),
  climb (8), fish (16)** eklenir (Faz 5'te `fl & 1` dürbün). `RemotePlayer.update` (`net.js:87-124`) `c.setSpeed(ts)` ve
  kaplamaları uygular; dümen/top IK'sı alıcıda gemi modelinden hesaplanır (gönderilmez).
- Ölçüt: uzak oyuncunun taban klip hızı yereldekinden en çok ±0,05 farklı; çömelme ve su içinde durma pozları eşleşir.

---

## 6. Kamera

### 6.1 Faz 3'ten sonra durum

Faz 3 A9 (C-13): `blocked(q)` → `segmentQuery(f → q, {mask: KAMERA, pad: 0,25})`; slab ve `hullSolid` pad'li; ada yapılarına
yalnız kamera maskesinde GORSEL kutuları; R7 başlangıç kuralı (başı içeren kutu yok sayılır); kıskaçlardan (`camera.js:132-155`)
sonra son nokta yeniden sınanır; 0,1 m geri çekme pad'e devredilir. Korunanlar: gemi gövdesi (`camera.js:15-31`, `69-99`),
mağara kesiti (`100-110`, `128`), güverte düzlemi (`138-145`), su yüzeyi (`146-155`), başa çok yaklaşınca karakter gizleme
(`game.js:370-375`, 0,8/1,0 m histerezis), yakın-kamera soldurma (`nearfade.js:16-23`). Testler: 04 C07, 15 C01–C05, 17 K01–K14.

### 6.2 Faz 3'ten sonra kalan işler

| No | İş | Bugün | Hedef | Ölçüt |
|---|---|---|---|---|
| KM-a | Nişan omzu (I-02) | `at(d)` omuz kaydırmasını (0,65 m, `game.js:341`, `:343`) hiç küçültmüyor; ikili arama yalnız `d` (`camera.js:114-120`); kamera sağdaki duvarın 0,25 m içinde (`camtest`) | Üç aşama: (1) `f → f + right·omuz` doğrusu (`segmentQuery`, KAMERA, pad 0,25); engelliyse omuz `s ∈ [0, omuz]` ikili aramayla en büyük engelsiz değere iner; (2) mesafe araması `f + right·s`'ten; (3) d = 0,4'te bile engelliyse nişanda omuz tarafı değişir (`−s`); nişangâh ekran ortasında kalır, nişan noktası kameradan yeniden hesaplanır. Faz 3 A5 namlu sorgusu atışı ayrıca korur | Duvar sağda 0,2 / 0,4 / 0,6 m: kamera ve yakın düzlemin dört köşesi hiçbir kutuda değil; baş → kamera doğrusu engelsiz |
| KM-b | Sırtı duvara (I-13) | Alt sınır 0,4 m (`camera.js:117-119`); kamera kutunun 5 cm içinde | En küçük mesafede engel sürüyorsa kamera başın üstüne (+0,3…+0,6 m) ve boş yana kayar (8 aday, ilk engelsiz), bakış odağa; karakter < 0,8 m'de gizli (bugünkü); son çare kamera başta, karakter gizli | Kamera kutu içinde 0 kare |
| KM-c | Yakın düzlem | Yarıçapsız nokta; yakın düzlem 0,1 m'de ±0,12 m | Nokta serbestken yakın düzlemin dört köşesi kutudaysa mesafe 0,1 m kısalır (en çok 3 kez). Faz 3 K13 bunu ada yapılarında ölçer; Faz 7 nişan ve duvar dibini ekler. (inceleme düzeltmesi, N-29) Yakın düzlemin köşeleri kameradan en çok 0,17 m uzaktadır (0,1 m, FOV 70°, 16:9); Faz 3'ün 0,25 m pad'i bunları zaten kapsar. Davranış değişikliği yalnız 0,4 m alt sınırında (pad'in uygulanamadığı KM-b durumunda) gerekir; diğer durumlarda KM-c yalnız ölçüttür | KM1, KM2 |
| KM-d | Güverte donanımı (I-14) | Yalnız küpeşte/direk/seren `rail`, yelken/bayrak `sail` (`shipModel.js:281`, `294`, `306`, `409`) | Top (`cannonMesh` `:177-203`), ambar kapağı (`:476`), çapa (`:452-453`), fener (`:496-498`), kova (`:493`), ırgat (`:446`), harita masası malzemelerine `nearFade(…, 'prop')` (0,3–1,0 m) | 17 K05 düzeninde top/kapak/çapa/fener yanında karanlık kare 0 |
| KM-e | Diğer gemiler | `opts.hulls = G.ships` (`game.js:349`) düşman ve tüccar gemilerini kapsıyor, testi yok; hayalet gemi `G.ships`'te değil | `opts.hulls = [...G.ships, bosses.active?.gship]` | Düşman gemisi ve hayalet gemi yanında kamera gövdede 0 kare |
| KM-f | Ağaç (K7-8) | Kamera geçer, ağaç solar (Faz 3 R5; `physics.js:220`; `nearfade.js` `veg` + görüş silindiri). v0.4'te gövde çarpışması kamerayı başa sıçrattığı için kaldırılmıştı (`props.js:237`) | (inceleme düzeltmesi) Gövde yarıçapı ≥ 0,45 m olan ağaçlar `GOVDE` katmanına atanır (`props.js:239` ağaç `0,5·s`, s ≥ 0,9; `islands.js:477`). İkili arama önce `GOVDE` dahil yapılır; sonuç mesafesi ≥ 1,2 m ise kullanılır, değilse `GOVDE` hariç tekrarlanır ve o gövdenin `veg` soldurması tama çekilir. Pompalamaya karşı bugünkü 0,3 sn açılma beklemesi (`camera.js:121-126`) korunur | (a) Kamera, örgüsü görünen bir kalın gövdenin silindiri içinde 0 kare. (b) Gövde yüzünden kamera–baş uzaklığı 1,2 m'nin altına inmez. (c) Karanlık kare 0. (d) Orman koşusunda kamera mesafesinin 0,3 sn içinde ≥ 1,5 m sıçradığı olay 30 sn'de ≤ 2 |
| KM-g | Taşıma | Büyük sandık başı ve ekran ortasını kapatıyor | Büyük/efsane sandık taşırken odak +0,3 m (K7-13) | Ekran ortasındaki %10'luk bölgede sandık pikseli < %50. (inceleme düzeltmesi) Ölçüm yöntemi: sandığın malzemeleri test süresince ışıksız düz renge (`MeshBasicMaterial`, #ff00ff) çevrilir, `DK.snap()` görüntüsünde merkez bölgedeki bu rengin payı sayılır |

### 6.3 Yakın-kamera soldurma ile ilişki (politika)

| Nesne sınıfı | Kamera çarpışması | Yakın soldurma | Kural |
|---|---|---|---|
| Duvar, bina, kale, kaya (ENGEL; kapalı yapıda GORSEL) | Var (pad 0,25) | Kaya `prop`; yapı yok (`nearfade.js:113`) | Kamera içine girmez |
| İskele ve platform üstü | Slab (altına inmez) | — | |
| Gemi gövdesi, kıçtaki kayık | `hullSolid` | — | İçine girmez |
| Küpeşte, direk, seren | Yok (gövde kabuğu hariç) | `rail` 0,2–0,7 m | Geçebilir, solar |
| Yelken, bayrak, tente | Yok | `sail` 0,4–1,3 m | |
| Güverte donanımı | Yok | `prop` 0,3–1,0 m (Faz 7) | |
| (inceleme düzeltmesi) Kalın ağaç gövdesi, r ≥ 0,45 (GOVDE) | Var, ancak sonuç mesafesi ≥ 1,2 m ise; değilse yok | `veg`; çarpışma kullanılmadığında o gövde tam solar | K7-8 |
| Ağaç, palmiye, çalı (BITKI) | Yok (R5) | `veg` 0,55–1,7 m + görüş silindiri 0,95 m | |
| İnce direk, fener direği (INCE) | Yok | `rail`/`prop` | |
| Karakterler (NPC, düşman, hayvan, boss) | Yok | `char` 0,3–1,0 m | |
| Oyuncu | — | `self` 0,5–1,6 m, < 0,8 m'de gizli | |
| Mağara | Kesit | — | |
| Su yüzeyi | Kıskaç | — | |

---

## 7. Faz 8 için AI LOD kancaları

Bugün (`enemies.js:1592-1619`): `step = hedef varsa 0 : d > 90 ? 0,25 : d > 45 ? 0,066 : 0`; `d` en yakın oyuncuya (uzak oyuncular
dahil, `:1597-1598`); `e.char.update(edt)` her güncellemede (Faz 3 A2b animasyonu çizim evresine taşır).

(inceleme düzeltmesi, Ç-12, N-25) **Politika işlevi Faz 8'indir.** Faz 8 taslağı aynı işi `lod.simTier()` ve `lod.animStep()`
sorularıyla planlıyor (`faz8_tasarim.md` §3.9, R13). İlk taslağın `enemies.lodPolicy()` işlevi bu işin ikinci kez planlanmasıydı.
Faz 7 yalnız şunları teslim eder: aşağıdaki değişmezler, `enemies.stats` sayaçları, kendi yeni sorgularının bütçe kuyruğu
(`aiQueue`) ve `lod.simTier(e)` çağrısı için bir uyarlayıcı. Faz 8 gelene dek bu uyarlayıcı bugünkü kuralı aynen üretir
(`enemies.js:1597-1606`). Aşağıdaki katman tablosu Faz 8'e **öneri** olarak kalır; uygulanması Faz 8'in kararıdır.

**Öneri (Faz 8'e):** `lod.simTier(e, ctx) → {tier, thinkHz, moveStep, animHz, perceiveHz}`;
`ctx = {d, görünür (Faz 8 görüş konisi), savaşta, boss, hedefli, saldırıda}`.

| Katman | Koşul | Düşünme | Hareket | Animasyon | Algı sorgusu |
|---|---|---|---|---|---|
| T0 | Hedefli, saldırıda, boss/mini boss ya da d ≤ 45 m | 6 Hz | Her STEP | Her kare | 6 Hz |
| T1 | 45–90 m | 3 Hz | 2 STEP'te bir (Faz 3 C-16 koruyucu alt adım) | 30 Hz | 3 Hz |
| T2 | 90–220 m | 1 Hz | 0,25 sn (C-16) | 10 Hz; görünmüyorsa dondur | 1 Hz |
| T3 | Grup > 220 m (`_populate` siler) | — | — | — | — |

- **Değişmezler:** F-08 (hedefli düşman seyreltilmez, 05 #12); `attack` durumu T0; C-16 koruyucu alt adım; uzak oyuncu mesafesi.
- **Bütçeler:** yapay zekâ `segmentQuery` kare başına ≤ 24 (sıra kuyruğu `aiQueue`, hedefli düşman önce); yönlendirme kararı kare
  başına ≤ 12; siper araması düşman başına 2 Hz.
- **Sayaçlar** (saniyelik): `enemies.stats = {think, losQ, steer, cover, stuck:[k1, k2, k3], tiers:[t0, t1, t2]}`;
  `DK.enemies.stats` ve test için `DK.lod.override(fn)` (inceleme düzeltmesi: ilk taslaktaki `DK.enemies.setLodPolicy` yerine,
  Faz 8 API'siyle tek kanca).
- **Animasyon LOD** (Faz 8 J-26, J-30): `e.char.update` `rdt`'yi `1/animHz` dolana dek biriktirir; Faz 8 karakter örgüsü
  ayıklaması (J-01) görünürlük bilgisini `ctx.görünür`'e verir.
- Bosslar her zaman T0; hayvanlar Faz 8'in işidir.

---

## 8. Dosya bazında değişiklikler ve uygulama sırası

### 8.1 Yeni dosyalar

| Dosya | İçerik | Satır (≈) |
|---|---|---|
| `js/game/combatRules.js` | `BLOCK_LEAK`, `PARRY_WIN`, `IFRAMES`, `BLOCK_KB_MAX`, `TELE_MIN`, `TELE_MIN_UB`, `resolveHitEffects` | 120 |
| `js/game/strikes.js` | `STRIKE` tablosu (üretilir) + elle düzeltmeler | 90 |
| `js/game/telegraph.js` | Uyarı nesneleri (disk, dilim, halka, çizgi), lav havuzu, ateş halkası, ağ yayını ve konuk çizimi | 240 |
| `js/game/aiSense.js` | `visionRange`, `lightFactor`, `weatherFactor`, `detectRate`, `hearRange` (saf) | 150 |
| `js/game/aiSteer.js` | Bağlam yönlendirmesi, duvar izleme, üç takılma ölçütü, üç kademe kurtarma, iz belleği, geçerli nokta | 320 |
| `js/core/gait.js` | Doğal hızlar, `pick({hs, rel, scale, kind})` | 120 |
| `tools/strike_table.mjs` | GLB'den vuruş adayları (salt-okur): uç hız tepesi, en ileri erişim, en alçak temas; sınıfa göre seçim (inceleme düzeltmesi, K7-16) → `strikes.js` | 200 |
| `tests/node/*.mjs` | 8 test (§9.4) | 900 |
| `tests/scenarios/37…44`, `coop/08a…08c` | §9.2, §9.3 | 1 800 |

### 8.2 Değişen dosyalar

| Dosya:satır | Değişiklik | Adım | Bulgu |
|---|---|---|---|
| `js/game/enemies.js:24-57` | `MOVES/SPIN/DASH` vuruş verisi, Counter 0,40, DASH `Stab2H` | F7-2, F7-9 | H-09, H-10 |
| `enemies.js:340-365` | `hurt` → `'immune'`; (inceleme düzeltmesi) `applyDamage` dönüşünün yayılması | F7-1 | H-28, N-18 |
| `enemies.js:377-417` | Poise ölçeri, zırh; (inceleme düzeltmesi) bitirici azalan getirisi (`:401-402`, `stun` `:446-456`) | F7-4 | H-20, N-15 |
| (inceleme düzeltmesi) `enemies.js:901-925` | Öfke sonrası telgraf tabanı (`:921-922`) | F7-2 | N-13 |
| `enemies.js:419-424` | İlk vuruşta yardım çağrısı ve alarm | F7-9, F7-10 | ek-141 |
| `enemies.js:446-456`, `:777-789` | Sersemlik/çağırma sonu `IdleCombat` | F7-2 | H-09 |
| `enemies.js:532-594` | `aiSense`; ses engeli, yağmur; `alarm` türü | F7-10 | H-12, §2.2 |
| `enemies.js:658-702`, `:733-861` | `chase → lastKnown`, `search`, `cover` evreleri, geri çekilme yönü | F7-10, F7-11 | H-11, H-12 |
| `enemies.js:719-730` | `_groupAlert` → `_raiseAlarm` | F7-10 | §2.5 |
| `enemies.js:872-925`, `:941-977` | DASH, iki evreli bükme, saldırı başlatmada görüş | F7-2, F7-3, F7-9 | H-08, H-09, H-10 |
| `enemies.js:979-1008` | Görüş hattı; `_hitPlayer` sözleşmeye | F7-1, F7-3 | H-05, H-08 |
| `enemies.js:1072-1146`, `:1168-1201` | `aiSteer`; yerçekimli düşüş | F7-12 | H-23, N-1, N-2 |
| `enemies.js:1148-1160` | `gait.pick`, yan adım | F7-13 | H-30, N-10 |
| `enemies.js:1339-1405` | Jeton temizliği, `slotFor`, geçerli `patrolPoint`, `findCover` | F7-11, F7-12 | H-11, N-1 |
| `enemies.js:1364-1368` | Hayalet–hayalet ayrışması | F7-11 | H-27 |
| `enemies.js:1416-1536` | Lob tek yarıçap, çarpma görüşü, zehir konuğa, güdüm | F7-5, F7-18 | H-07, N-8, H-17 |
| `enemies.js:1539-1571` | Gece dalgası | F7-11 | H-19 |
| `enemies.js:1592-1619` | LOD politikası, sayaçlar | F7-19 | §7 |
| `js/game/bosses.js:42-46` | `hitPlayer` sözleşmeye | F7-1 | H-05 |
| (inceleme düzeltmesi) `bosses.js:96-117` | `BossBase._hitPlayer` (ortak), `applyDamage` → `'immune'` | F7-1 | N-11, N-18 |
| `bosses.js:143-385` | Kraken hedefi, halka, yörünge arazisi, dokunaç canı, durum kodu | F7-6, F7-8 | H-01, H-04, H-25 |
| `bosses.js:391-556` | Yılan dalışı, gövde küreleri, toslama kuralı, halkalar | F7-6, F7-8 | H-04, H-22, H-25, N-5 |
| `bosses.js:561-632` | Telgraf biçimi (dilim, tam dış çizgi), alan görüşü, çarpışma, sınırda Idle, `pl` | F7-6, F7-7, F7-18 | H-08, H-16, H-22, N-6, N-7 |
| `bosses.js:635-902` | Bükme, `Jump → Jump_Land`, bırakma karesi, ödül yeri | F7-7 | H-02, H-29 |
| `bosses.js:908-1027` | `hitSpheres`, `dispose` temizliği | F7-8 | H-22, H-26 |
| `js/game/combat.js:18-29` | Oyuncu `hitAt` | F7-2 | I-10 |
| `combat.js:55-70`, `:271-298` | `hitSpheres` | F7-8 | H-22 |
| `combat.js:188-232` | `'immune'`, yerel görüş; (inceleme düzeltmesi) saldıranın gemisi görüş sorgusundan hariç | F7-1, F7-3 | H-08, H-28, N-23 |
| `combat.js:235-269` | `muzzleWorld()` | F7-16 | I-20 |
| `js/player/player.js:142-203` | `hurt` sonucu, blok 0, blok itmesi | F7-1 | H-05, K7-1 |
| `player.js:247-313` | `action.full`, toparlanma, `setMode`, `_resetCombatFlags` | F7-2, F7-15 | I-07, I-09–I-11 |
| `player.js:444-474` | Geri yürüme 1,5 | F7-14 | K7-9b |
| `player.js:509-700` | Zıplama ofseti, atılım kuralı (K7-14), durma/dönüş, `gait.pick`; (inceleme düzeltmesi) blok itkisi `BLOCK_KB_MAX` (`:160`, `:541-545`, güverte `:839-842`) | F7-1, F7-14, F7-15 | I-01, I-05, I-09, N-17 |
| `player.js:736-818` | Yüzme pozu | F7-16 | I-08 |
| `player.js:820-903` | Güvertede gerçek hız | F7-14 | I-21 |
| `player.js:905-983` | Dümen/top tutamakları, merdiven basamakları (inceleme düzeltmesi: istasyondaki `hold` engeli yalnız F7-15'te, `setMode` ile; ilk taslak işi iki adıma da yazmıştı) | F7-16 | I-03, N-4 |
| `player.js:986-993` | `ts`, `fl` | F7-18 | I-15 |
| `js/player/character.js:707-778` | Evre eşli karışım (F7-14b) | F7-14 | I-01 |
| `character.js:796-809` | Kalkış `LieUp` | F7-15 | I-16 |
| `character.js:845-938` | Yüzme model uzayı, tutamaklar, kürek, merdiven, ayak IK, ofset birikimi | F7-16 | I-04, I-08, I-12, I-17 |
| `js/player/ragdoll.js:61-154` | Gemi yerel çerçevesi | F7-15 | I-19 |
| `js/player/camera.js:55-169` | Omuz araması, duvar dibi kaçışı, yakın düzlem köşeleri | F7-17 | I-02, I-13 |
| `js/core/kk.js:130-142` | Kök hareketi ayıklama | F7-15 | I-06 |
| `js/ship/shipModel.js:177-203`, `:425-498`, `:529` | `prop` soldurma; dümen istasyonu/direği; top istasyonu | F7-16, F7-17 | I-03, I-14 |
| `js/game/shipControl.js:174-196` | `setMode`; istasyonda `hold` engeli | F7-15 | I-07 |
| `js/game/game.js:309-376` | Hayalet gemi gövdesi, taşıma odağı | F7-17 | KM-e, KM-g |
| `js/main.js:226-241` | `respawn` → `setMode` | F7-15 | I-07 |
| `js/treasure/treasure.js:186-205`, `:287-295`, `:366-375` | Kazı efekti klip zamanında; tutamaklar; kaldırma/bırakma | F7-16 | I-04, I-17 |
| `js/game/interact.js:47-70` | Basılı tutma animasyonu | F7-16 | I-18 |
| `js/wildlife/animals.js:499-569` | Hazırlık, `melee/attacker`, görüş, `po`, sonda | F7-5 | H-06 |
| `js/world/physics.js` | `overlapCircle` (yan etkisiz; Faz 3 katman maskesiyle); (inceleme düzeltmesi) `GOVDE` katmanı ve `segmentQuery` `skipShip` seçeneği | F7-3, F7-12, F7-17 | §2.8, K7-8, N-23 |
| (inceleme düzeltmesi) `js/world/props.js:238-248`, `islands.js:477` | r ≥ 0,45 gövdelere `GOVDE` ataması | F7-17 | K7-8 |
| (inceleme düzeltmesi) `js/net/hostCombat.js` (Faz 2), `act` şeması (Faz 5 `vt`) | Konuğun kaçınma/blok penceresi `vt` ile | F7-18 | N-14, K7-15 |
| `js/world/sky.js:270-290` | `fogAt(x, z)` | F7-10 | §2.2 |
| `js/game/crowd.js:11-45` | Hayalet–hayalet; dev boss ajanı | F7-7, F7-11 | H-22, H-27 |
| `js/net/net.js:87-124`, `:536-539` | Uzak oyuncu algı alanları, `ts`, kaplamalar; `hurt` yan etkileri | F7-18 | H-13, H-17, I-15 |
| `js/net/schema.js` (Faz 2) | `hurt.po/sl`, `st.ts`, `st.fl` bitleri, `snap.p.ts`, `tel.r/arc`, `bossFx` türleri, `snap.b.pl`, `tn` durum kodu; PROTO +1 | F7-18 | K7-11 |
| `js/net/hostCombat.js` (Faz 2) | `BLOCK_LEAK` | F7-1 | Ç-1 |

### 8.3 Uygulama sırası

Her adım ayrı birleştirilir; kendi testleri ve tam regresyon (00–44, coop) geçmeden sonrakine geçilmez.

| Adım | İş | Kabul | Gün |
|---|---|---|---|
| **F7-0** | Mevcut davranışın sabitlenmesi: 37–44 "gözlem" kipinde (her kontrol değeri rapora yazar; bugün geçenler `expect`, düzeltilecekler `bilinen` listesinde beklenen kırmızı); Node `anim_strike`, `gait_speeds`, `ik_reach` bugünkü tablolara karşı. **Kod değişmez. Faz 6 S6'dan önce koşulur** (Ç-9). (inceleme düzeltmesi) Taban dosyası `tests/out/faz7_taban.json` yazılır; yeni araç gerektiren kontroller "uygulanamaz" olarak raporlanır | 00–36 yeşil; yeni senaryolarda "bugün geçmeli" kontroller yeşil; taban dosyası var | 3 |
| **F7-1** | Savaş sonuç sözleşmesi: `combatRules.js`, `Player.hurt` sonucu, `resolveHitEffects`, `Enemy.hurt 'immune'`, gri kıvılcım, `bosses.hitPlayer`, `_impact` zehri, hayvan `hurt` seçenekleri, `BLOCK_LEAK = 0` (+ `hostCombat`). (inceleme düzeltmesi) `Enemy.hurt` `applyDamage` dönüşünü yayar; `BossBase._hitPlayer` (Yılan tükürüğü); `BossBase.applyDamage` → `'immune'`; `BLOCK_KB_MAX = 0,6` itki; Faz 6 `icebolt` yavaşlatması sözleşmede | 40 F3–F5, F8; 41 YL8, AM5; 05 ek-110 (Faz 6 genişletmesi) | 2,5 |
| **F7-2** | `strikes.js` + iki evreli bükme (MOVES, SPIN), oyuncu `hitAt`, Counter 0,40, sersemlik/çağırma pozu, toparlanma evresi. (inceleme düzeltmesi) Sınıfa göre vuruş karesi ve kontak sayfası (K7-16); klip zamanının benzetim saatinden açık eşlenmesi; öfke sonrası telgraf tabanı; oyuncuda yalnız Atk2 ve Atk3 değişir; dürtmeler bükülmez | 40 F1, F2, F10, F11; 42 IB7; Node `anim_strike`; 05 telgraf testi; kontak sayfaları onaylı | 4 |
| **F7-3** | Görüş hattı (dört yol). Faz 3 A5'ten sonra. (inceleme düzeltmesi) Saldıranın gemisi sorgudan hariç | 40 F6; 41 YL4b; 05 F-16 | 1,25 |
| **F7-4** | Poise ölçeri ve zırh; (inceleme düzeltmesi) bitirici sersemliğine azalan getiri | 39 T8 (gerçek girdiyle) | 1,25 |
| **F7-5** | Mermiler (güdüm, geçiş, lob tek yarıçap) ve hayvanlar | 40 F5(d, e), F7 (lob), F9 | 2 |
| **F7-6** | `telegraph.js` + `BOSS_ATK` + tek yarıçap + dilim + tam dış çizgi + evre geçişi (yerel; ağ F7-18) | 41/42 halka = hasar; Node `telgraf_tablosu` | 3 |
| **F7-7** | Dev bosslar: bükme, `Jump → Jump_Land`, bırakma karesi, çarpışma ve itme, sınırda Idle, ödül yeri | 42 TM1–TM6, VD1–VD7 | 3,5 |
| **F7-8** | Deniz bossları: Kraken hedefi, yörünge (`ocean.levelAt`), dokunaç canı, durum kodu; Yılan dalışı, gövde küreleri, toslama; Amiral `hitSpheres`, `dispose` | 41 KR1–KR7, YL1–YL7, AM1–AM7; Node `kraken_hedef`, `yilan_dalis` | 4 |
| **F7-9** | İnsan bosslar: DASH, ilk vuruşta yardım, SPIN kalkanı | 42 IB1–IB6; IB8 (Faz 6 S6'dan sonra) | 1,5 |
| **F7-10** | Algı ve kayıp/arama: `aiSense`, `sky.fogAt`, alacakaranlık, ses engeli/yağmur, alarm (hop), ceset, `chase → lastKnown`, `search` | 37 A1–A11; 05 algı testleri | 3 |
| **F7-11** | Grup: jeton temizliği, `slotFor`, siper, geri çekilme yönü, gece dalgaları, hayalet ayrışması | 39 T2–T7, T9; 38 N4 | 3 |
| **F7-12** | Navigasyon: `aiSteer`, geçerli devriye noktası, `overlapCircle`, eğim/düşüş, yerçekimi. (inceleme düzeltmesi) Eğim sınırı oyuncuyla eşit (n.y 0,6), yamaçtaki hedef için ulaşılamazlık; sorgu bütçe kuyruğu | 38 N1–N3, N5–N8, N10; Faz 3 DG02/HH04/DG07; Node `ai_yonlendirme` | 5 |
| **F7-13** | Düşman animasyonu: `gait.js`, yan adım | 38 N9; 39 T10 | 1,5 |
| **F7-14** | Oyuncu yürüyüşü: eşleme, ani durma, dönüş koruması, zıplama ofseti, iniş süresi, güverte gerçek hızı, geri 1,5; **F7-14b** evre eşli karışım. (inceleme düzeltmesi) 1,5 cm eşikli doğal hızlar ve kadans sınırı (K7-9); Walk→Run 1,6 / 1,4 | 43 H01–H07, H15, H21; 16 K05/K06; 04 C09/C10, C13 (beklenti "oran"a döner); 03_fizik_dt | 3,5 |
| **F7-15** | Kök hareket ayıklama, tam gövde devri, atılım kuralı (K7-14), `setMode`, `action.full`, bekçi, kalkış, güverte ragdoll'u, istasyonda `hold` engeli | 43 H13, H16, H17, H20, H22–H24; 40 F12; 16 P01; 04 C06, C19; Faz 2 06j (atılım) | 3 |
| **F7-16** | Eller ve pozlar: dümen/top (gemi modeli + Faz 3 C-12 yarıçapları), sandık, kazı, merdiven, yüzme/dalış, ayak IK, etkileşim, namlu | 43 H08–H12, H18, H19, H25–H27; 04 C01, C08/C08b (bilek ölçümüne), 14 D01–D03; Faz 3 GV02/GV03, MI03 | 4,5 |
| **F7-17** | Kamera: omuz, duvar dibi, yakın düzlem, `prop` soldurma, hayalet gemi, taşıma odağı; (inceleme düzeltmesi) kalın gövde `GOVDE` katmanı ve 1,2 m koşulu (K7-8) | 44 KM1–KM8; 15 C01–C05; 17 K01–K14 (özellikle K08 orman) | 3,5 |
| **F7-18** | Co-op: PROTO +1; `hurt.po/sl`; `st.ts/fl`; `snap.p.ts`; uzak oyuncu algı alanları (K7-12); `tel.r/arc`; `bossFx` kataloğu ve konuk çizimi; `snap.b.pl`, `tn`. (inceleme düzeltmesi) `t0` host saatiyle uyarı hizası; `act{dodge}`/blok `vt` (K7-15); tek bit tablosu (Ç-14) | 08a (E9 `--latency 120` dahil), 08b (B9), 08c; 06a/06b, Faz 5 06r–06z, Faz 6 07a/07b uyarlanmış; Node `net_schema` | 5 |
| **F7-19** | Faz 8 kancaları (inceleme düzeltmesi: değişmezler, sayaçlar, bütçe kuyruğu ve `lod.simTier` uyarlayıcısı; politika Faz 8'de); belgeler (docs/04, 05, 06, 07 kartları); tam regresyon | 00–44, bütün coop; 09_performans ve 13_donma bütçeleri (yalnız mantık ms/kare; SwiftShader'da FPS ölçüt değildir) | 2 |
| | **Toplam** (inceleme düzeltmesi: 56,5 + 3,5) | | **≈ 60** |

Bağımlılıklar: F7-0 her şeyden önce (Faz 6 S6'dan da önce). F7-1, Faz 6 S6 ile eşgüdümlü (Ç-5). F7-3 ve F7-10 Faz 3 A5'ten
(`segmentQuery`), F7-12 Faz 3 A4 (katmanlar) ve A6'dan (C-16), F7-14/F7-16 Faz 3 A2a'dan (çizim evresi, IK), F7-16 Faz 3 A7'den
(C-12) sonra. F7-18 Faz 5 (taşıma) ve Faz 6 S15 (PROTO) sonrası. F7-2…F7-9 tek oyunculu kodda ağdan bağımsız ilerler.
(inceleme düzeltmesi) F7-18'in `vt` kısmı Faz 5 F5-6'nın `act.vt` alanına ve `ClockMap`'ine dayanır; F7-17'nin `GOVDE` katmanı
Faz 3 A4'ün katman bitlerine dayanır. F7-1, Faz 6 S6 B3/B4 ile aynı sözleşmeyi paylaşır (Ç-5, Ç-11): S6 önce gelir, F7-1 eksikleri
tamamlar.

---

## 9. Test planı

### 9.1 İlkeler

- Bütün tarayıcı senaryoları `DK.sim`/`DK.game.update(1/60)` ile deterministik; `Math.random` gerektiğinde test içinde sabitlenir;
  ölçüm değerleri rapora yazılır (`window._x` → `expect` değeri).
- Tek tarayıcı (`/home/user/devtools/tk`), 640×360, senaryo başına ≤ 240 sn (ikinci ölçüm koşusunda çekirdek bir süreci bellek
  yetmezliğinden öldürdü; büyük senaryolar ikiye bölünür).
- Her senaryonun "gözlem" kipi (F7-0) ve "kabul" kipi aynı dosyadadır: `?kip=gozlem` iken bilinen kırmızılar rapora yazılır,
  başarısızlık sayılmaz.
- Çizim/benzetim ayrımı (Faz 3 §10.6): kemik ve kamera ölçümleri `syncRender()` sonrası alınır ya da 1 STEP pay tanınır.
- (inceleme düzeltmesi) **Girdi gerçekçiliği.** Oyuncu saldırılarını ölçen her kontrol, saldırıyı gerçek girdi kurallarıyla verir:
  ya `_meleeInput`'a tuş girdisi gider ya da `combat._attack` yalnız `!p.action || (a.type === 'atk' && a.t ≥ a.chainAt)` iken
  çağrılır. İlk taslağın M5b düzeni bu kapıyı atlıyordu (N-15).
- (inceleme düzeltmesi) **Algı düzeni.** Algı kontrolleri şu düzende yapılır: haydut nöbetçi (`role:'sentry'`, görüş 24 m, FOV
  125°), `e.hear` kapalı, oyuncu koni merkezinde ve hareketsiz (hız çarpanı 0,6), `sky.weather` ve `sky.target`'ta sis ve yağmur
  0. Beklenen fark süresi şu formülden türetilir: `t ≈ 1 / ((1,8 − 1,5·d / görüş_etkin) · 0,6) + 0,17` sn (6 Hz algı adımı).
  `inc_olcum.js` MC ölçümü beş durumda formülle ±0,25 sn içinde örtüşüyor (1,53 / 1,76; 2,32 / 2,39; 3,88 / 3,99; 4,68 / 4,74).
  Gece meşalesiz durumda ölçüm formülden 0,9 sn uzun çıktı (4,73 / 3,87 sn); nedeni F7-0'da `aiSense` birim testiyle ayrıştırılır.
  Bu yüzden algı ölçütleri kesin süre olarak değil, eşik biçiminde yazıldı ("≤ 6 sn'de fark var", "8 sn'de fark yok").
- (inceleme düzeltmesi) **SwiftShader.** Kontak sayfaları, kamera parlaklığı ve piksel sayımları SwiftShader'da doğru sonuç
  verir; yalnız yavaştır. FPS ve GPU süresi kabul ölçütü olarak kullanılmaz; performans bütçeleri `game.update` mantık
  süresiyle (ms/kare) ölçülür.

### 9.2 Tarayıcı senaryoları (37–44)

**37_dusman_algi.js**

| No | Kontrol | Ölçüt |
|---|---|---|
| A1 | Koni dışı: sırtı dönük düşman, oyuncu 15 m arkada | 3 sn sonra farkındalık < 0,35, hedef yok |
| A2 | Mesafe sınırı | Etkin görüş × 1,1'de 8 sn fark yok; × 0,7'de 2,3 ± 0,4 sn'de fark (MC ölçümü 2,32 sn; 05 #1 korunur) |
| A3 | Gece ve ışık | (inceleme düzeltmesi, N-24) Saat 23 meşalesiz: etkin görüş 0,5 × ± %5. Yani 0,45 × görüşte fark oluşur (MC 4,73 sn; ölçüt ≤ 6 sn), 0,55 ×'te 8 sn fark yoktur. Meşaleyle 1,1 ×'te fark oluşur (MC 4,68 sn; ölçüt ≤ 6 sn), 1,2 ×'te 8 sn fark yoktur. `dayFactor = 0,5`'te ışık çarpanı 0,75 ± 0,05; gündüz meşale çarpanı 1,0 (§2.2). İlk taslağın "≤ 3 sn" ve "≤ 4 sn" ölçütleri formülle çelişiyordu |
| A4 | Hava ve bölge sisi | `weather.fog = 1` ve `sky.target.fog = 1` (inceleme düzeltmesi: hedef değer ayarlanmazsa sis 30 sn'lik sönümle geri döner, `sky.js:253-254`) → etkin görüş ×0,5 ± %5; Kemik sisinde (`fogAt ≥ 0,8`) ≤ 0,55 × |
| A5 | Eğilme | (inceleme düzeltmesi, N-24) 0,6 × görüşte eğilmiş oyuncu 8 sn fark edilmez (etkin görüş 0,55 ×). 0,5 × görüşte eğilmiş ve ayakta fark sürelerinin oranı ≥ 2 (MC: 3,88 / 1,53 sn). İlk taslağın "0,5 ×'te 4 sn fark edilmez" ölçütü tutmuyordu: eğilmiş oyuncu 0,5 ×'te etkin görüşün içindedir ve 3,9 sn'de fark edilir |
| A6 | Duyma | (inceleme düzeltmesi, N-24) Silah sesi 31,5 m'de (0,7 × 45) açıkta da 1 m duvar arkasında da tepki doğurur, çünkü silah sesi engelden sönmez (§2.2). Kılıç sesi (9 m) 7 m'de açıkta tepki doğurur, 1 m duvar arkasında doğurmaz (9 × 0,6 = 5,4 m). Yağmur 1,0'da koşu adımı 5 m'de tepki doğurmaz (6,5 × 0,7 = 4,55 m) |
| A7 | Alarm | 20 m'deki müttefik ≤ 1,0 sn'de `investigate`/`chase`. (inceleme düzeltmesi) Arada aktarıcı yokken 40 m'deki tepki vermez. 20 m'de bir aktarıcı varken 40 m'deki ≤ 2,0 sn'de uyarılır, 60 m'deki uyarılmaz (hop ≤ 2) |
| A8 | Pusu (ek-141) | Habersiz Haydut Kaptanı'na ilk vuruş → ≤ 0,2 sn `callHelp`; 25 m'deki müttefik ≤ 1 sn'de uyarılır |
| A9 | Ceset | Görüş konisinde 8 m'de müttefik cesedi → ≤ 1 sn `investigate`, son bilinen = ceset |
| A10 | Kayıp (H-12; M3b düzeni) | Görüş kesik adımların ≥ %90'ında düşman (inceleme düzeltmesi) **öngörülen** son noktaya (`lastKnown + lastVel·min(0,5; t)`, ≤ 3 m) yönelir (bugün %0); noktaya ≤ 1 m varır. Oyuncunun canlı konumuna yönelme ≤ %10 |
| A11 | Arama | `search` 12 sn içinde ≥ 2 nokta, sonra `return`; araya giren ses arama merkezini taşır |

**38_dusman_hareket.js**

| No | Kontrol | Ölçüt (bugün) |
|---|---|---|
| N1 | Devriye (M1 düzeni: en yoğun kara hücresi, 6 haydut, 60 sn, algı kapalı) | Düşman başına: (a) hareket isterken 2 sn'den uzun < 0,2 m/sn = 0 (0); (b) 1,2 sn pencerelerinin ≤ %20'sinde ilerleme < 0,35 m (%72–86); (c) ≥ 3 noktaya varış (0); (d) çarpıştırıcı içi devriye noktası 0 (1/6); (e) salınım ≤ 2 |
| N2 | U (12 m) ve düz (20 m) duvar | (inceleme düzeltmesi) Algı sabitlenir (`e._perceive = () => hedef`; hedef sürekli bilinir), çünkü M2 düzeninde düşman 5. sn'de `investigate`'e, 15. sn'de `patrol`'e dönüyordu ve sonuç navigasyonu değil algının vazgeçmesini ölçüyordu. Ölçüt: hedefin 4,5 m'sine ≤ 20 sn (yok; en yakın 6,72 / 6,81 m). **N2b:** algı açık, görüş kesik: `search` ≥ 2 nokta dolaşır, takılma kurtarma sayacı ≤ 2 |
| N3 | Eğim ve düşüş | 45° yamaç ve 3 m kaya kenarında 20 sn kovalama: (inceleme düzeltmesi, N-19) normal.y < 0,6 hücreye adım 0; hedef 0,6–0,77 yamaçtaysa düşman ona ≤ 10 sn'de ulaşır (sığınak yok); adım başına dikey değişim ≤ 0,7 m (yerçekimli düşüş hariç) |
| N4 | Hayalet yığılması (H-27) | Aynı noktada 3 hayalet → 2 sn sonra en yakın çift > 0,6 m |
| N5 | İnsan yığılması | 05 #4 korunur |
| N6 | Güverte (Faz 3 GV04) | Bordalama düşmanı direk ve toptan geçmez, oyuncuyla iç içe değil |
| N7 | Faz 3 DG02, DG07, HH04 | Yeşil |
| N8 | Ulaşılamaz hedef (3 m kaya) | 10 sn'de yakın dövüşçüler 4–8 m'de görüşlü noktada; kurtarma sayacı artmaz |
| N9 | Düşman yürüyüş oranı | (inceleme düzeltmesi) 1,5 cm eşikli doğal hızlarla: haydut devriye 1,5 m/sn'de ≥ 0,85 (kadans sınırlı; beklenen 0,91), kovalama 4,3 ve iskelet 1,2 m/sn'de 0,85–1,15 (bugün 0,42 / 0,75 / 0,42). Hayalet devriye ve kovalamada yalnız kadans ölçülür (≤ 3,6 / ≤ 5,0 adım/sn; N-20) |
| N10 | (inceleme düzeltmesi) Sorgu bütçesi | 30 düşmanlı kampta yapay zekâ `segmentQuery` sayısı kare başına ≤ 24 (`enemies.stats.losQ`); hedefli düşmanın sorgusu kuyrukta ≤ 1 kare bekler; mantık süresi (`game.update`) 09_performans tabanının en çok +%10'u |

**39_dusman_taktik_turler.js**

| No | Kontrol | Ölçüt (bugün) |
|---|---|---|
| T1 | Tür duman testi (17 tür; Faz 6'dan sonra 26) | Her tür: açıkta 0,6 × görüşte ≤ 3 sn fark; ≤ 8 sn'de saldırı; 99999 hasarla ölüm; `loot` 1 (`noLoot` hariç); XP kuralı (Faz 6) |
| T2 | Jeton | 5 haydutta aynı anda yakın `attack` ≤ 2 (normal); 12 m uzaklaşan sahibin jetonu ≤ 1 sn'de bırakılır |
| T3 | Kuşatma | 3 kuşatanın yuva açıları arasında en küçük fark ≥ 60°; yuvalar çarpıştırıcı dışında |
| T4 | Siper (H-11; M4 düzeni) | 8 sn'de ≥ 3 atış, `investigate` 0, her atışta göz atma noktasından görüş açık (1 atış; 4. sn'de `investigate`) |
| T5 | Geri çekilme | %30 canda, 15 m'de müttefikle ≥ 8 m çekilir, ≤ 6 sn'de bir kez +%30; müttefiksiz çekilmez |
| T6 | Moral | Kaptan ölünce 30 m'deki 3 haydutun ≥ 1'i kaçar (`Math.random` sabit) |
| T7 | Gece dalgası (H-19; M7 düzeni) | 3 gecede canlı gece üyesi ≤ 2; öğlen 0 (2, 2, 4, 4, 6, 6) |
| T8 | Vuruş kilidi (H-20) | (inceleme düzeltmesi) MA düzeni: **gerçek girdiyle** (`chainAt` kapısına uyan) 10 sn hafif zincirde düşman ≥ 2 saldırısını vuruş anına ulaştırır (bugün 0/10–11; M5b'nin 0/7 değeri `chainAt`'i atlayan düzenden). Ek kontrol: bitirici, sersemlik bittikten sonraki 2,0 sn içinde sersemletmez |
| T9 | Faz dokunulmazlığı | Fazdaki hayalete `hurt` → `'immune'` |
| T10 | Yan adım klibi (H-30) | Bakış–hareket açısı > 45° iken karelerin ≥ %90'ında `StrafeL/R` |

**40_savas_adaleti.js**

| No | Kontrol | Ölçüt |
|---|---|---|
| F1 | Telgraf | Bütün MOVES/SPIN/DASH: başlangıç → hasar ≥ 0,40 sn; engellenemez ≥ 0,60. (inceleme düzeltmesi) Öfkeli Morvan, öfkeli Lanetli Amiral ve Faz 6 Gelgit'in Gölgesi dahil (bugün Atk1 0,35, SPIN 0,583) |
| F2 | Vuruş karesi | (inceleme düzeltmesi) Hasar karesindeki klip zamanının `STRIKE`'tan farkı, oyun zamanına çevrildiğinde ≤ 0,06 sn (her hamle). Klip zamanı benzetim saatinden eşlendiği için (§4.3) ölçüm `DK.sim` içinde belirlenimcidir; `STRIKE` sınıfa göredir ve kontak sayfasıyla onaylıdır |
| F3 | Blok | Önden blokta can kaybı 0; `slowT` 0; `poison` 0; (inceleme düzeltmesi) itki ≤ 0,6, kara kipinde 1 sn'deki yer değiştirme ≤ 0,35 m ve tepe hız ≤ 1,5 m/sn; güvertede aynı yer değiştirme sınırı; dayanıklılık bedeli düşer |
| F4 | Parry | Vuruştan 0,1 sn önce başlayan blok → can 0, saldıran ≥ 1,0 sn sersem (inceleme düzeltmesi: boss için de ≥ 1,0, çünkü 1,7 × 0,6 = 1,02; dev bossta sersemleme yok, karşı saldırı penceresi açık), `counterT` 1,3 |
| F5 | Kaçınma | Hasar anında `invuln > 0` → can, `slowT`, `knock`, `poison` değişmez: (a) yakın dövüş (yakalama dahil), (b) dev boss alanı, (c) lob, (d) mermi, (e) hayalet küresi (2 sn'de geri dönüp isabet 0) |
| F6 | Görüş hattı | 0,3 m duvar: düşman yakın dövüşü, boss alanı, lob çarpması, oyuncu vuruşu 0 hasar; duvar kalkınca hasar |
| F7 | Halka = hasar | Her uyarı türünde r + 0,2 → 0, r − 0,3 → hasar |
| F8 | Bağışık | Fazdaki hayalet / kalkan iskelet → `'immune'`, `hitMarker` 0, gri kıvılcım |
| F9 | Hayvan | Kurt ısırığında hazırlık ≥ 0,30 sn; önden blok can 0; parry → kurt sersem; 1 m duvar arkasından ısırık yok; yılan zehri yalnız `'hit'`te |
| F10 | Oyuncu saldırısı | (inceleme düzeltmesi) `abs(hitAt − STRIKE(sınıf)) ≤ 0,06 sn` (Atk2 0,18, Atk3 0,45; karşı saldırı 0,26 ve tekme 0,34 değişmez); eylem klibin ≥ %90'ı ya da toparlanma evresi |
| F11 | Donuk poz | Sersemlik, çağırma, DASH boyunca kemik pozu 0,2 sn'den uzun sabit kalmaz |
| F12 | (inceleme düzeltmesi) Atılım kuralı (K7-14) | Duran oyuncunun 3'lü zinciri, her vuruşta 1,0 m geri itilen haydut'a 3/3 isabet eder; tam gövde klibinde destek ayağı < 0,3 m/sn |

**41_boss_deniz.js**

| No | Kontrol | Ölçüt |
|---|---|---|
| KR1 | Dokunaç hedefi | 20 rastgele ezmede `stuck/grab` hedefi güverte noktasına ≤ 1,5 m; iniş noktasından hafif saldırı dokunaç canını düşürür |
| KR2 | Halka | r = 3,4 baştan; r + 0,2'de hasar yok |
| KR3 | Evreler | %60 ± 1, %30 ± 1; geçişte 1 sn yeni saldırı yok |
| KR4 | Yörünge | Baş merkezi her an `heightAt < tide − 4` (ada yakınında doğuşla 60 sn) |
| KR5 | Co-op ölçeği | Dokunaç canı `220·(1 + 0,5·konuk)` (sahte uzak oyuncuyla) |
| KR6 | Ödül | Gemiye ganimet + 600 XP |
| KR7 | (inceleme düzeltmesi) Zayıf nokta | Dokunaç koparılınca 6 sn baş ×2; derindeyken baş `'immune'` (gri kıvılcım, kılıç geri sekmez); patlama ×0,2 |
| YL1 | Dalış | Baş sıçraması ≤ 3 m; ardışık iz segmenti ≤ 1,5 m |
| YL2 | Halkalar | Dalış r = 5,5, tükürük r = 2,4; hasar aynı yarıçapta |
| YL3 | Toslama | Çarpma noktasına 5 m'deki oyuncu hasar alır, 8 m'deki almaz (10/10) |
| YL4 | Gövde | Gövde küresine isabet ×0,4 başa aktarılır |
| YL5 | Derin bağışıklık | Patlama ×0,3 değişmedi |
| YL4b | (inceleme düzeltmesi, N-23) Güverteden vuruş | Toslamadan sonra sersem kalan başa, bordadaki oyuncunun hafif saldırısı isabet eder (kendi gemisi görüş sorgusundan hariç) |
| YL6 | (inceleme düzeltmesi) Evreler | %50 ve %20 eşikleri; geçişte 1 sn yeni saldırı yok |
| YL7 | (inceleme düzeltmesi) Ödül | Gemiye ganimet + 600 XP, tek sefer |
| YL8 | (inceleme düzeltmesi, N-11) Tükürük | İsabette 12 can hasarı + 6 sn zehir, ikisi de yalnız `'hit'` sonucunda; kaçınmada ikisi de 0; konuk da aynı sonucu alır (bugün can hasarı 0, konukta hiçbir etki yok) |
| AM1 | Hayalet gemi hacmi | Pruva ve kıça çarpan gülle hasar verir |
| AM2 | Bordalama | %50 ya da 75 sn; geçişte 1 sn |
| AM3 | Geri çekilme | Güverte Amirali ve tayfa kaldırılır (H-26) |
| AM4 | Ödül | Tek sefer |
| AM5 | (inceleme düzeltmesi, N-18) Zayıf nokta ve bağışıklık | Top ve patlama ×1, diğerleri ×0,35; bordadayken `'immune'`: gri kıvılcım, kılıç geri sekmez, `hitMarker` yok |
| AM6 | (inceleme düzeltmesi) Uyarı | Yaylımdan ≥ 1,6 sn önce bildirim ve parıltı; lob halkası r 2,2 = hasar alanı (r + 0,2'de hasar yok) |
| AM7 | (inceleme düzeltmesi) Hareket | 46 m yörünge; 120 sn boyunca karaya oturma 0 (`terrain.heightAt < ocean.levelAt − 3`) |

**42_boss_kara_insan.js**

| No | Kontrol | Ölçüt (bugün) |
|---|---|---|
| TM1 | Hasar anı | Yumruk, süpürme, tepinme, kaya: hasar/atış anı ile vuruş/bırakma karesi ≤ 0,1 sn. (inceleme düzeltmesi) Bugün +0,43 / +0,33 / +0,57 / +0,535; vuruş kareleri sınıfa göre (yumruk el en ileri 0,50, süpürme 0,458, tepinme `Jump_Land` 0,167 klip sn) |
| TM2 | Süpürme dilimi | Dilim dışında (yanda 6 m) hasar yok |
| TM3 | Zayıf nokta | Arkadan ×2,2; saplanınca ×1,5; sütun varken ×0,2 |
| TM4 | Çarpışma | Kolon çarpıştırıcısına girmez; oyuncu boss içinde 0 kare; sınırda konum değişmiyorsa `Idle` |
| TM5 | Evreler | %55 sütunlar, %25 öfke; geçiş 1 sn |
| TM6 | Ödül | Yerde, yürünür noktada |
| VD1 | Hasar anı | Süpürme, yere vurma, lav topu ≤ 0,1 sn |
| VD2 | Ateş halkası | Zıplayan oyuncu hasar almaz, yerdeki alır |
| VD3 | Zayıf nokta | Yağmurdan sonra önden ×2,2, 3,2 sn |
| VD4 | Ödül yeri (H-29) | 10 ölüm noktasında ganimet krater yarıçapı dışında ve lav düzeyinin ≥ 0,3 m üstünde |
| VD5 | Lav havuzu | 0,5 sn'de 7 hasar, 6 sn |
| VD6 | Çarpışma, sınırda Idle | TM4 ile aynı |
| VD7 | (inceleme düzeltmesi) Evreler | %60 ve %30 eşikleri; evre 3'te gökten ateş; geçişte 1 sn yeni saldırı yok |
| IB1 | Kızıl Hançer | %55 çağırma 2 düşman doğurur; çağırma boyunca donuk poz yok; duman → 9 m → bir kez iyileşme |
| IB2 | Morvan | SPIN 3 vuruş, kırmızı halka 2,8 m, kalkan gizli; %66/%33 çağırma, %33 öfke |
| IB3 | Hayalet Kaptan | 5–9 m'de 60 sn'de ≥ 1 DASH (0); çizgi uyarısı ≥ 0,6 sn; hasar vuruş karesinde |
| IB4 | Haydut Kaptanı | İlk vuruşta yardım çağrısı; Heavy2H halkası = alan 2,2 |
| IB5 | XP | `noLoot` olmayan boss türleri `xp × 2` (Faz 6); Amiral güverte formu 0 |
| IB6 | (inceleme düzeltmesi) İnsan boss zayıf noktası | Kızıl Hançer çağırmadan sonra 2,5 sn yorgun ×1,4; sersemken ×1,25; Morvan önden %60 olasılıkla engeller, yandan ve arkadan engellemez (`_canBlock`, `enemies.js:367-375`; `Math.random` sabitlenir) |
| IB7 | (inceleme düzeltmesi, N-13) Öfke telgrafı | Öfkeli Morvan ve Amiral'de normal hamleler ≥ 0,40, SPIN ≥ 0,60 sn (bugün 0,35 / 0,583) |
| IB8 | (inceleme düzeltmesi, N-26) Faz 6 bossları (Faz 6 S6'dan sonra) | Kor Selim: %15'te `surrender`, vuruşlar `'immune'` (gri kıvılcım). Madenbaşı: karanlık evresinde fener yakarken 2 sn ×2. Gelgit'in Gölgesi: SPIN halkası = alan, faz dokunulmazlığı `'immune'`. Üçünde de 8 özellik duman testi: uyarı, hitbox, hasar anı, zayıf nokta, evre geçişi, hareket, ödül, konukta uyarı |

**43_animasyon_hareket.js** — on dokuz hareket (§5.2)

| No | Kontrol | Ölçüt |
|---|---|---|
| H01–H03 | Yürüme, koşma, sprint (+ çömelme, nişan, taşıma hızları; 4 gövde × 3 boy) | (inceleme düzeltmesi) Oran 0,85–1,15, çömelmede ≥ 0,80; 1,5 cm eşikle destek ayağı medyanı yürümede ≤ 0,35, koşu/sprintte ≤ 0,40 m/sn; sprint/koşu adım sıklığı farkı ≥ %40; kadans yürüyüşte ≤ 3,6, koşuda ≤ 5,0 adım/sn |
| H04 | Ani durma | hs < 0,25 olduktan sonra ayak kayması ≤ 0,15 m; Idle'a geçiş ≤ 0,15 sn |
| H05 | 180° dönüş | Dönüş boyunca Idle karesi 0, klip yeniden başlatma 0 |
| H06 | Zıplama | Klip ayak kalkışı − fiziksel kalkış ≤ 0,05 sn; tepe 1,183 m ± %3 |
| H07 | İniş | 2,5 m'de `Jump_Land` ≥ %90 ya da hareketle 0,15 sn geçiş; kesik geçiş 0 |
| H08 | Yüzme | Gövde–bacak ≥ 160°; her kulaçta el baş kemiğinin önüne geçer |
| H09 | Dalış | ≥ 150° |
| H10 | Merdiven | El–basamak < 0,10 m; süre 1,6 sn ± 1 STEP; tırmanırken ölüm → betik durur |
| H11 | Sandık | Dört kademede bilekler kutu dışında ve tutamağa < 0,08 m; küçük/orta sandık üstü ≤ 1,8·boy; taşırken oran 0,85–1,15 |
| H12 | Kazı | Kürek ucu en alçakta zemine ≤ 0,05 m; efekt ±0,05 sn; duraklatmada efekt 0; sol bilek–sap < 0,08 m |
| H13 | Saldırı | Tam gövde klibinde destek ayağı < 0,3 m/sn ya da eylem üst katmana devredilmiş |
| H14 | Parry | 1 kare içinde `Parry` üst katmanı; düşman `stunned` |
| H15 | Blok yürüyüşü | İleri/geri/yan oran 0,85–1,15 |
| H16 | Kaçınma | Dört yönde kalça ofseti < 0,1 m; sonda sıçrama yok; 03_fizik_dt kaçınma mesafesi aynı |
| H17 | Dolum | Dolumda gemiye biniş/suya giriş → doğru taban klibi ≤ 0,1 sn; silah değişince `Reload` durur, `reloadT` sürer |
| H18 | Dümen | İki bilek tutamağa < 0,08 m (tam kırıkken < 0,10), 4 gövde × 3 boy; elde silah yok; (inceleme düzeltmesi) dümendeyken 1–7 tuşu silahı ele vermez (`player.js:111-112`); kontak görüntüsü (§5.4 kavrama seçeneği) |
| H19 | Top | İki bilek < 0,08 m |
| H20 | Kip geçişi (I-07) | Suda/dümende/topta/kayıkta ölüp limanda doğunca `heldType === equipped`, meşale görünür, `underwater === false`, `ik` null, kilitler boş |
| H21 | Güverte (I-21) | Küpeşteye/direğe dayanınca ≤ 0,2 sn'de Idle |
| H22 | Kalkış (I-16) | İlk 0,1 sn'de baş < 0,5 m |
| H23 | Güverte ragdoll'u (I-19) | 6 m/sn seyirde 2,5 sn sonra kalça güverte izdüşümünde, `deckAt` ± 0,3 m |
| H24 | Bekçi | İhlal 0 |
| H25 | Ayak IK | 20° yamaçta ve 0,3 m basamakta iki taban ± 3 cm |
| H26 | Etkileşim (I-18) | ≤ 0,1 sn'de `Interact`/`UseItem`, bırakınca kesilir |
| H27 | Namlu (I-20) | Alev–namlu < 0,05 m |

**44_kamera_dar_alan.js**

| No | Kontrol | Ölçüt |
|---|---|---|
| KM1 | Nişan, duvar sağda 0,2/0,4/0,6 m (4 yön) | Kamera ve yakın düzlemin dört köşesi kutu dışında; baş → kamera (KAMERA) engelsiz |
| KM2 | Sırtı duvara 0,2/0,35 m (8 yön × 2 eğim) | Kamera kutuda 0 kare; < 0,8 m'de karakter gizli; parlaklık > 20 |
| KM3 | 1,2 m koridor (32 yön × 2 eğim) | İhlal 0 |
| KM4 | Güverte donanımı (top, kapak, çapa, fener; 24 yön × eğim −0,25 ve 0,1) | Karanlık kare 0 (parlaklık ≥ medyanın %20'si); kategori `prop` |
| KM5 | Diğer gemiler (düşman gemisi, hayalet gemi; yüzerken ve güvertede) | Kamera gövdede 0 kare |
| KM6 | Orman + kalın gövde dibi (32 yön) | Karanlık kare 0 (17 K08 korunur). (inceleme düzeltmesi, K7-8) Kamera, örgüsü görünen bir kalın gövdenin (r ≥ 0,45) silindiri içinde 0 kare; gövde yüzünden kamera–baş uzaklığı 1,2 m'nin altına inmez; orman koşusunda 0,3 sn içinde ≥ 1,5 m mesafe sıçraması 30 sn'de ≤ 2 |
| KM7 | Büyük sandık taşıma | Ekran ortasındaki %10'luk bölgede sandık pikseli < %50 (inceleme düzeltmesi: sandık malzemeleri test süresince ışıksız #ff00ff yapılır, `DK.snap()` görüntüsünde bu rengin payı sayılır) |
| KM8 | Regresyon | 15 C01–C05, 17 K01–K14 |

### 9.3 Co-op senaryoları (08a–08c)

| Dosya | Kontroller |
|---|---|
| **08a_savas_esitligi.cjs** (2 oyuncu) | (inceleme düzeltmesi) E1–E8 hem gecikmesiz hem `--latency 120` ile koşulur. E9 (K7-15): `--latency 120` ile konuk, kendi ekranındaki hasar anından 0,10 sn önce kaçınır → 10/10 denemede konuk canı ve host gölge canı değişmez, 2 sn içinde `hp{v}` düzeltmesi gelmez; aynı düzende 0,30 sn geç kaçınma 10/10 hasar alır (geri sarma sınırı). E10: aynı ölçüt blok için. E1 Kaçınan konukta düşman yakın dövüşü: konukta can/`slowT`/`knock` değişmez, host gölge canı değişmez. E2 Konuk önden blok → can 0 iki tarafta. E3 Boğulmuş Denizci konuğu yalnız isabette yavaşlatır (`sl`). E4 Yılan tükürüğü konuğu da zehirler (`po`). E5 Konuğun fazdaki hayalete vuruşu → `hit.r = 'immune'`, hasar 0. E6 Eğilen konukta farkındalık artışı yereldekinin ± %10'u; meşaleli konuk ×1,15; su altındaki konuk ×0,15; > 2 m/sn koşan konuğun eğilme biti yok sayılır (K7-12). E7 Koşan konuğun taban klip hızı host'ta ± 0,05; çömelme ve su içinde durma pozları eşleşir; aynı saldırı art arda 2 kez → 2 başlatma. E8 Patlama ve kaya hasarı konuğa (Faz 2 regresyonu) |
| **08b_boss_konuk.cjs** (2 oyuncu) | B1 Her boss saldırısında konukta uyarı ≤ 0,15 sn gecikme, aynı r (± 0,05) ve süre (5 boss + Morvan SPIN). B2 Ateş halkası konukta görünür; zıplayan konuk hasar almaz. B3 Konukta 3 sütun; konuğun vuruşu kırar; kalkan iki tarafta kalkar. B4 Konuk güverteden iniş noktasında Kraken dokunacını keser; boştaki dokunaç iki tarafta vurulamaz. B5 Evre ve zayıf nokta bildirimleri konukta. B6 300 m içindeki konuk 600 XP (Faz 5 K5-2). B7 Geri çekilmede iki tarafta artık nesne yok. B8 Konuktan uzak boss vuruşu yok (Faz 2, H-03). (inceleme düzeltmesi) B9: `--latency 120` ile konukta etkin uyarı süresi (uyarının konukta görünmesi ile host'taki hasar anı arası) ≥ `TELE_MIN − 0,15` sn; ölçüm iki sayfada `Date.now()` ile yapılır. B10: Yılan tükürüğü konukta 12 hasar + 6 sn zehir (N-11) |
| **08c_dusman_ag_lod.cjs** (2 ve 4 oyuncu) | C1 Konuk tek başına mezara gider → Morvan host'ta doğar, konukta görünür, yerel kopya yok (Faz 2 E-9/Faz 4 D-17 regresyonu, H-18). C2 4 oyuncu, 8 haydut: her hedefte eşzamanlı yakın saldırgan ≤ jeton sınırı. C3 Yalnız konuğun yakınındaki hedefli düşman T0; `stats.tiers` konuk mesafesine göre. C4 Gece dalgası konuk varlığıyla çoğalmaz. C5 Konuğun silah sesi (Faz 2 host'ta türetilen gürültü) alarmı başlatır, hop ≤ 2 |

### 9.4 Node testleri (`tests/node/`)

| Dosya | İçerik | Ölçüt |
|---|---|---|
| `anim_strike.mjs` | `strikes.js` ↔ GLB adayları (`tools/strike_table.mjs` yöntemi; `kk_anims.glb`, `orc_brute.glb`, `demon.glb`) | ± 1/60 sn; (inceleme düzeltmesi) her girdinin sınıfı yazılı ve seçilen aday sınıfa uygun; dürtmelerde seçilen an en ileri erişim (AtkStab 0,77, Stab2H 0,77, DualStab 0,77 klip sn); her MOVES/SWORD/FIST/`BOSS_ATK` girdisinde bükme sonrası `abs(φ(hitAt_eff) − s) ≤ 0,06`; öfke dahil telgraf alt sınırları; her girdide `onay` alanı dolu |
| `gait_speeds.mjs` | Doğal hızlar (5 gövde) ve `gait.pick` | (inceleme düzeltmesi) 1,5 cm destek eşiği; GLB'den ± %5; §5.3 tablosundaki her durumda oran 0,85–1,15 (çömelme ≥ 0,80); kadans sınırları; hayaletler yalnız kadans |
| `ik_reach.mjs` | Bütün tutma hedefleri, 4 gövde × 3 boy | `abs(hedef − omuz) ≤ kol − 0,03` |
| `ai_algi.mjs` | `aiSense` (ışık, hava, duruş, duyma) | Birim değerleri (§2.2); (inceleme düzeltmesi) gündüz meşale çarpanı 1,0, gece 1,15; fark süresi formülü ile 37 A2–A5 eşikleri tutarlı; gece meşalesiz ölçüm farkının (4,73 / 3,87 sn) nedeni |
| `ai_yonlendirme.mjs` | Gerçek `physics.js` (Faz 3 sahte arazi kancası): U, 20 m duvar, 1,2 m koridor, iç köşe, 32 çarpıştırıcılı hücre | Ulaşma ≤ 20 sn; üç takılma ölçütü; salınım ≤ 2 |
| `telgraf_tablosu.mjs` | `BOSS_ATK` ve düşman engellenemezleri | `r_halka === r_hasar`; `tele ≥ alt sınır`; yay/şekil uyumu |
| `kraken_hedef.mjs` | `kraken_hitbox.cjs` kopyası, yeni hedef kuralıyla | `stuck/grab` hedefi güverte noktasına ≤ 1,5 m: %100 (bugün sloop R=38'de %7,7) |
| `yilan_dalis.mjs` | `serpent_dive.cjs` kopyası, yeni dalışla | Sıçrama ≤ 3 m (bugün ort. 21, en çok 27,1 m) |

### 9.5 Mevcut testlere etkisi

- **05_dusman_ai:** algı testleri (#1–#3) aynı kalır; telgraf testi "≥ 0,35" → "≥ 0,40"; ek-110 Faz 6'nın genişletmesiyle
  (yalnız isabette yavaşlatma); yığılma, F-03, F-05, F-07, F-08, F-10, F-16, ek-109, zayıf nokta, boss evreleri aynen.
- **04_karakter:** C13 "3 m/sn'de Walk" beklentisi gait eşlemesiyle "3 m/sn'de oran 0,85–1,15" olur (3 m/sn'de klip Run);
  C08/C08b hedef vektörü yerine bilek ölçer; C09 (güverte JumpStart), C10, C06, C19 aynen.
- **16_kosu_poz_ganimet:** K03 (iniş eşikleri), K05, K06, P01 aynen geçmeli; K06 "Koş→Yürü→Koş yok" yeni eşiklerle (1,9/1,6) de
  sağlanır, çünkü dönüşte hız 4,4'ten 1,9'un altına düşmez.
- **03_fizik_dt:** zıplama tepesi, geri tepme ve kaçınma mesafesi değişmez (yalnız görsel değişir).
- **15, 17:** aynen; 17 K05'e top yanı noktası 44 KM4'te eklenir.
- **Faz 3:** GV02 hedef vektörünü ölçer; GV03 yeni istasyon yarıçaplarıyla; MI03 süresi korunur; DG02/DG07/HH04 yeşil kalmalı.
- **Faz 2:** 06j meşru oyun hasar/sn eşiği (§5.12) döngü süresine bağlı, değişmez; `hostCombat` blok sabiti 0. (inceleme
  düzeltmesi) 06j, atılım kuralı (K7-14) ve Atk2/Atk3 `hitAt` değişikliğinden sonra `--latency 120` ile yeniden koşulur, çünkü
  vekil saldırganın konumu ve hareket doğrulayıcısının meşru yer değiştirmesi değişir (Ç-15).
- **(inceleme düzeltmesi) Faz 5:** 06r–06z'de `act.vt` alanı artık kaçınma ve blok için de taşınır (K7-15); `net_schema` testi tek
  bit tablosunu sınar (Ç-14).
- **Faz 6:** 35_hikaye_dusmanlar (9 yeni tür) Faz 7 değişiklikleriyle yeşil kalmalı; `gelgit_golgesi` final bossu bükme ve uyarı
  kurallarından yararlanır.

---

## 10. Riskler ve iş büyüklüğü

### 10.1 Riskler

| No | Risk | Olasılık / etki | Önlem |
|---|---|---|---|
| R1 | Oyun hissi değişir: blokta 0 hasar savunmayı güçlendirir; yavaş hazırlık evresi "ağır çekim" görünebilir | Orta / orta | K7-1 ve K7-2 seçenekli; dayanıklılık bedeli ve savunma kırılması korunur; bükme yalnız hazırlıkta, savuruş özgün hızda |
| R2 | Yerel yönlendirme her iç bükey engeli çözemez | Orta / orta | Duvar izleme + iz belleği + kademeli kurtarma; 38 N2 tutmazsa ada başına ızgara BFS ayrı adım (K7-3 seçeneği) |
| R3 | Performans: yönlendirme sondaları, algı/ses sorguları, uyarı nesneleri | Düşük / orta | Düşünme sıklığında karar; kare başına sorgu bütçesi (§7); sayaçlar Faz 8'e |
| R4 | Alt/üst katmanlı oynatmada (`kk.clipPart`) evre eşli karışım karmaşık | Orta / düşük | F7-14b ayrı ve isteğe bağlı; karışımsız eşleme tek başına oran ölçütünü sağlar |
| R5 | PROTO ve şema eşgüdümü (Faz 5, Faz 6) | Orta / orta | Tek PROTO artırımı F7-18'de; diğer adımlar ağdan bağımsız |
| R6 | Dümen/top istasyonu değişikliği gemi görselini ve Faz 3 C-12 sınamalarını etkiler | Orta / düşük | Ç-2; GV02/GV03 ve 04 C08 aynı adımda güncellenir |
| R7 | Test süresi ve bellek (SwiftShader; ikinci ölçüm koşusunda çekirdek bir süreci bellekten öldürdü) | Yüksek / düşük | Tek tarayıcı (`tk`), senaryo ≤ 240 sn, büyükler bölünür; Node ön sınamaları |
| R8 | Vuruş tepesi aracı yanlış tepe seçebilir (kalkan darbesi, tekme, çok vuruşlu dönüş) | Orta / düşük | Elle düzeltme alanı; Node testi |
| R9 | Faz 6'nın 9 yeni türü (`burrow`, `surrender`, `lightBound`, lav/buz menzillisi) yeni yönlendirme ve algıyla etkileşir | Orta / orta | 35_hikaye_dusmanlar her adımda; T1 26 türü dolaşır |
| R10 | Kök hareket ayıklaması ölüm/kalkış görsellerini değiştirir | Düşük / düşük | Yalnız listelenen klipler; düşman ölümü çoğunlukla ragdoll |
| R11 | Konuğun eğilme biti ile görünmezlik hilesi | Düşük / düşük | K7-12 (hız eşiği); etkisi yalnız o konuğun algılanması |
| R12 | SwiftShader'da görsel his (soldurma, ayak teması, el hizası) gözle doğrulanamaz | (inceleme düzeltmesi) Orta / düşük | Pozun kendisi SwiftShader görüntüsünde doğrudur, yalnız akıcılık ve kare hızı değerlendirilemez. Kontak sayfaları (vuruş kareleri, dümen, sandık, kürek, yüzme) burada üretilir ve gözle onaylanır; akış hissi gerçek GPU'da göz kontrol listesiyle (Faz 9 elle tur) değerlendirilir |
| R13 | `hitAt` değişen oyuncu hamleleri (inceleme düzeltmesi: yalnız Atk2 0,18 ve Atk3 0,45) zincir hissini değiştirir | Düşük / düşük | `chainAt` ve `dur` aynı; F10 ve 16 K05 ile izlenir |
| R14 | (inceleme düzeltmesi) Kadans sınırı yürümede oranı 0,80–0,91'e indirir; Walk→Run 1,6 m/sn'de koşu klibi yavaş (ts 0,43) oynar | Orta / düşük | F7-14b karışımı; adım sıklığı sıçraması ölçütü (§5.3 ölçüt 5); kontak sayfası |
| R15 | (inceleme düzeltmesi) Kalın gövde çarpışması ormanda kamera pompalaması ya da başa sıçrama getirebilir (v0.4'te bu yüzden kaldırılmıştı, `props.js:237`) | Orta / orta | 1,2 m koşulu, 0,3 sn açılma beklemesi, KM6 pompalama ölçütü; tutmazsa K7-8 seçenek (a) |
| R16 | (inceleme düzeltmesi) `vt` ile kaçınma kötüye kullanılabilir: konuk `vt`'yi geriye kaydırır | Düşük / düşük | Geri sarma en çok 0,25 sn (Faz 5 K5-8); `vt` konuğun son `st.ts` değerinden ileri olamaz; aşım puanı (Faz 2 kapısı) |
| R17 | (inceleme düzeltmesi) Bitirici azalan getirisi savaşı uzatır, kombonun gücünü azaltır | Orta / düşük | Yalnız sersemletme kalkar, ×1,25 hasar ve `hit` tepkisi kalır; Faz 2 §5.12 hasar/sn tavanı değişmez; T8 ve 05 F-03 ile izlenir |

### 10.2 İş büyüklüğü

Tek, kod tabanını bilen geliştirici için §8.3 toplamı (inceleme düzeltmesi) **≈ 60 iş günü** (± %25; ilk taslak 56,5). En büyük
kalemler: navigasyon (5), co-op (5), eller ve pozlar (4,5), deniz bossları (4), vuruş karesi (4), dev bosslar (3,5), oyuncu
yürüyüşü (3,5), kamera (3,5). Faz 6'nın S6 adımıyla
eşgüdüm (Ç-5) ve Faz 3 A2a/A4/A5/A6/A7 önkoşulları gecikirse F7-3, F7-10, F7-12, F7-14, F7-16 beklemeye girer; F7-0, F7-2,
F7-4…F7-9, F7-13 bu önkoşullardan bağımsız ilerleyebilir.

---

## Ek A — Denemeler (`/tmp/tasarim_y/faz7/`, salt-okur)

| Dosya | Ne ölçer | Çıktı (özet) |
|---|---|---|
| `glb_peak.mjs` | GLB kemik açısal hız tepesi (klip sn) | `1H_Melee_Attack_Stab` el 0,383; `2H_Melee_Attack_Slice` 0,383; `Punch`/`Weapon` (dev) 0,313; `Jump_Land` ayak 0,104. (inceleme düzeltmesi) Açısal hız tepesi temas anı değildir; dev boss için `inc_giant.mjs`'e bakın |
| `enemy_moves.mjs` | Düşman MOVES/SPIN/DASH: `hitAt` − bilek doğrusal hız tepesi | §1.7 tablosu |
| `char5.mjs` | Oyuncu SWORD/FIST zamanlaması | Atk2 +0,11, Counter −0,14; Punch %70, Punch2 %67 |
| `gait.mjs`, `fk4.mjs`, `fk5.mjs` | Yürüyüş kliplerinin doğal yer hızı ve bugünkü oranlar | §5.1 tablosu |
| `reach.mjs` | Omuz konumu, kol boyu; dümen/top erişim taraması | Omuz y 0,94–1,11, kol 0,424–0,501; dümen D 0,35 / r 0,20 / H 0,95 → eksik −0,033 |
| `char3.mjs` | Dümen/top bilek–hedef | 0,39–0,53 / 0,34–0,37 m |
| `char4.mjs` | Kök hareketi, zıplama kalkışı, namlu | Dodge 0,27/0,67/0,56 m; kalkış 0,29 klip sn; namlu (−0,19; 1,30; 0,61) |
| `char2.mjs`, `char7.mjs` | Yüzme açısı; kazı | 129° / 122°; kürek 0,30 m, sol bilek 0,13–0,38 m |
| `kraken_hitbox.cjs` | Dokunaç hedefinin güverteden erişimi | sloop R38 %7,7; R30 %21; brigantine R38 %18,5; R30 %31 |
| `serpent_dive.cjs` | Dalış sıçraması | Ort. 21 m, en çok 27,1 m |
| `camtest/run.mjs`, `run2.mjs` | Gerçek `camera.js` + `physics.js` | Nişan ve duvar dibi kamera kutuda; içeriden ışın engelsiz |
| `olcum_ai.js` → `olcum_ai.json` | Tarayıcı M1–M8 | M1 takılma 0 (hız ölçütü); M2 U/düz ulaşılamadı; M3 canlı izleme; M4 siper 1 atış; M5 (geçersiz: kamera yönü); M6 0 DASH; M7 2,2,4,4,6,6 |
| `olcum_ai2.js` → `olcum_ai2.json` | Tarayıcı M1b, M3b, M5b, M8b | M1b 0 varış, %72–86 ilerlemesiz; M3b 120/120 canlı konum; M5b 0/7 saldırı (inceleme düzeltmesi: `chainAt` atlanmış); M8b yumruk +0,667 sn (inceleme düzeltmesi: vuruş karesi 0,313 varsayılmış; doğrusu +0,43) |
| (inceleme) `inc_strike.mjs` | Düşman MOVES: silah eli, sol el, bıçak ucu hız tepesi, sağ bileğin en ileri anı | §1.7a tablosu; dürtmelerde en ileri ≈ `hitAt` |
| (inceleme) `inc_strike2.mjs` | Oyuncu SWORD/FIST ve tekme (ayak en ileri) | Atk2 uç 0,18, Atk3 0,46, Counter uç 0,29, tekme ayak 0,32 sn |
| (inceleme) `inc_profile.mjs` | Tek klibin hız profili | `Block_Attack` (1,4×): R bileği ≤ 1,42 m/sn, L 6,6 m/sn (0,267 sn), uç 9,9 m/sn (0,305 sn) |
| (inceleme) `inc_giant.mjs` | Dev boss klipleri: el/ayak hız tepesi, en ileri, en alçak | `Punch` R en ileri 0,50; `Weapon` L en ileri 0,458; `Jump_Land` ayak en alçak 0,167 klip sn |
| (inceleme) `inc_gait_med.mjs`, `inc_gait_med2.mjs` | Destek eşiği 3 cm ve 1,5 cm'de doğal hız ve kalan kayma | §5.1 tablosu |
| (inceleme) `inc_poise_sim.py` | H-20 zincir modeli (200 tohum) | Bugünkü ve K7-5 kurallarında 0 vuruş; tarayıcı MA ile uyumlu |
| (inceleme) `inc_knock.py` | `knock` itkisinin yer değiştirmesi (kara kipi) | 0,6 → 0,32 m / 1,45 m/sn; 1,5 → 0,87 m / 3,62 m/sn; 6 → 3,63 m |
| (inceleme) `inc_olcum.js` → `inc_olcum.json` | Tarayıcı MA (gerçek zincir, 3 değişke × 3 koşu), MB (Yılan tükürüğü), MC (fark süreleri), MD (öfkeli Morvan telgrafı); 37 sn | MA 0 / 0 / 2 vuruş; MB `_hitPlayer` yok, can 100 → 100; MC 1,53 / 3,88 / — / 4,73 / 4,68 / 2,32 sn; MD Atk1 0,35, SPIN 0,583 |

Komut biçimi: `DK_ROOT=/home/user/SON-HAZ-NE node --import ./register.mjs <betik>` (`register.mjs` → `hooks.mjs`: `three` ve
`three/addons/` çıplak adlarını depodaki `vendor/three`'ye çevirir; `js` bağlantısı depodaki `js/`'ye salt-okur bakar). Tarayıcı:
`/home/user/devtools/tk node tests/harness/run.cjs /tmp/tasarim_y/faz7/olcum_ai2.js --url http://localhost:8080/index.html
--size 640x360 --timeout 600 --report /tmp/tasarim_y/faz7/olcum_ai2.json`.

## Ek B — Sabitler (tek yer)

| Sabit | Değer | Dosya |
|---|---|---|
| `BLOCK_LEAK`, `BLOCK_KB_MAX` | 0; (inceleme düzeltmesi) 0,6 itki (≈ 0,32 m, tepe 1,45 m/sn; ilk taslak "1,5 m/sn") | `combatRules.js` |
| (inceleme düzeltmesi) `STUN_DR` | 2,0 sn (bitirici sersemliğine azalan getiri) | `combatRules.js` |
| (inceleme düzeltmesi) `VT_MAX` | 0,25 sn (konuk kaçınma/blok geri sarması; Faz 5 K5-8) | `combatRules.js`, `hostCombat.js` |
| (inceleme düzeltmesi) `GOVDE_R`, `GOVDE_MIN_D` | 0,45 m; 1,2 m | `physics.js` / `camera.js` |
| `PARRY_WIN`, `BLOCK_REARM`, `IFRAMES` | 0,24; 0,25; 0,34 sn | `combatRules.js` (bugünkü değerler) |
| `TELE_MIN`, `TELE_MIN_UB`, `STRIKE_TOL` | 0,40; 0,60 sn; 0,06 oyun sn (inceleme düzeltmesi: ilk taslak "klip sn"; alt sınırlar öfke ve evre ölçeğinden **sonra** uygulanır) | `combatRules.js` |
| `FLINCH_CD`, `ARMOR_FRAC` | 1,2 sn; 0,7 | `combatRules.js` |
| `HOMING_TURN`, `GHOSTBOLT_LIFE` | 90°/sn; 2,5 sn | `enemies.js` |
| `LOST_PREDICT`, `SEARCH_T`, `SEARCH_PTS` | 0,5 sn / 3 m; 12 sn; 3 nokta (5 / 4 / 4 m) | `aiSense.js` |
| `ALARM_R`, `ALARM_HOP`, `ALARM_DELAY` | 25 m; 2; 0,6 sn | `enemies.js` |
| `TOKEN_RELEASE_D`, `TOKEN_UNSEEN` | 9 m; 1,5 sn | `enemies.js` |
| `SLOT_N`, `SLOT_R`, `SLOT_REEVAL` | 12; 4,3 / 3,2 m; 1,5 sn | `enemies.js` |
| `COVER_R`, `COVER_HZ`, `COVER_KNOWN` | 12 m; 2 Hz; 4 sn | `enemies.js` |
| `STEER_DIRS`, `PROBE`, `SLOPE_MAX`, `DROP_MAX`, `STEP_MAX` | 12; 0,8 / 1,6 m; normal.y 0,6 (inceleme düzeltmesi: oyuncuyla eşit; ilk taslak 0,77); 2,5 m; 0,65 m | `aiSteer.js` |
| `STUCK_WIN`, `STUCK_SLOW`, `OSC` | 1,2 sn / 0,35 m; 1,0 sn / 0,2 m/sn; 3 sn × 3 | `aiSteer.js` |
| `BREAD` | 2 m hücre, 6 sn | `aiSteer.js` |
| Doğal hızlar (inceleme düzeltmesi: 1,5 cm eşik) | Walk 0,71; WalkBack 0,77; Run 3,75; Sprint 3,79; Strafe 3,75/3,67; WalkSk 0,54; WalkC 0,46; RunB 2,36 | `gait.js` |
| Yürüyüş eşikleri (inceleme düzeltmesi) | Walk→Run 1,6/1,4; Sprint 5,0/4,6; karışım 1,4–2,0; kadans yürüyüş ≤ 3,6, koşu ≤ 5,0 adım/sn (Walk/WalkBack ts ≤ 1,92; WalkSk/WalkC ≤ 2,88; Run/Sprint ≤ 2,0; RunB ≤ 2,67) | `gait.js` |
| `JUMP_CLIP_OFFSET`, `LAND_CANCEL` | 0,25 klip sn; 0,25 sn | `player.js` |
| Dümen / top tutma | D 0,35, r 0,20, H 0,95 (inceleme düzeltmesi: seçenek çark r 0,36, tutamak jantta, merkez güverte + 1,0; §5.4); oyuncu 0,85 m, tutamak (±0,20; 0,80; −0,50) | `shipModel.js`, `player.js` |
| LOD | 45 / 90 / 220 m (inceleme düzeltmesi: Faz 8'e öneri; politika `lod.js`'te); AI sorgu bütçesi 24/kare (Faz 7) | `lod.js` (Faz 8), `enemies.js` |

## Ek C — Gereksinim izlenebilirliği (master_prompt Aşama 9 ve 10)

| İstek | Bölüm | Test |
|---|---|---|
| 17 türü ve 5 bossu koru | §0.1, §1.6, §3 | 39 T1, 41, 42 |
| Yeni içerikten önce mevcut davranışı test et | F7-0 (Faz 6 S6'dan önce, Ç-9) | 37–44 gözlem kipi |
| Görüş açısı, görüş mesafesi | §2.2 | 37 A1, A2 |
| Ses algısı | §2.2 | 37 A6 |
| Engeller | §2.2 (görüş), §4.6 (vuruş) | 37 A6, 40 F6 |
| Gece/gündüz | §2.2 | 37 A3; 39 T7 |
| Sis ve hava | §2.2 | 37 A4 |
| Takım alarmı | §2.5 | 37 A7–A9; 08c C5 |
| Siper | §2.5 | 39 T4 |
| Kuşatma | §2.5 | 39 T2, T3, T10 |
| Geri çekilme | §2.5 | 39 T5, T6 |
| Oyuncuyu kaybetme, yeniden arama | §2.4, §2.7 | 37 A10, A11 |
| Kayalara, ağaçlara, duvarlara, birbirine takılmama | §2.8, §2.5 (ayrışma) | 38 N1–N8 |
| Boss uyarısı, hitbox, hasar zamanı, zayıf nokta, faz, hareket, ödül, multiplayer | §3 | 41, 42, 08b; (inceleme düzeltmesi) boss × özellik matrisi aşağıda |
| Engellenen/kaçınılan saldırı sebepsiz hasar vermez | §4.1 R4–R7, §4.5, (inceleme düzeltmesi) §3.8 zaman eşitliği | 40 F3–F5, F7; 08a E1–E4, E9, E10 |
| Animasyon, hasar anı, fiziksel hareket tutarlı | §4.3, §4.4 | 40 F1, F2, F10, F11, F12; 43 H13, H16 |
| 19 hareketin ayrı ayrı testi | §5.2 | 43 H01–H19 |
| Ayak kayması | §5.3 | 43 H01–H03, H11, H15; 38 N9 |
| Eller tutulan nesneyle hizalı | §5.4 | 43 H10–H12, H18, H19, H27 |
| Yarıda kesilme, yanlış klipte kalma, fizikten kopma | §5.5 | 43 H07, H13, H17, H20–H24 |
| Dar alanda kamera duvar/ağaç/gövde/güverte yapısından geçmesin | §6; (inceleme düzeltmesi) ağaç için K7-8 karma kuralı | 44 KM1–KM8 (KM6 kalın gövde) |

**(inceleme düzeltmesi) Boss × 8 özellik matrisi.** İlk taslak Ek C'de sekiz boss özelliğini tek satırda geçiyordu. Bu yüzden
Yılan'ın evre ve ödül testleri, Kraken ve Amiral'in zayıf nokta testleri ve insan bossların zayıf nokta testleri eksik kalmıştı.
Hücrelerdeki kodlar §9.2 ve §9.3'teki kontrollerdir.

| Boss | Uyarı | Hitbox | Hasar anı | Zayıf nokta | Evre geçişi | Hareket | Ödül | Multiplayer |
|---|---|---|---|---|---|---|---|---|
| Kraken | KR2 | KR1 | KR1 (temas) | KR7 | KR3 | KR4 | KR6 | 08b B1, B4, B5, B6 |
| Derinlik Yılanı | YL2 | YL4, YL4b | YL3, YL8 | YL5 | YL6 | YL1 | YL7 | 08b B1, B5, B10 |
| Taş Muhafız | TM2, 40 F7 | TM4 | TM1 | TM3 | TM5 | TM4 | TM6 | 08b B1, B3, B5 |
| Volkanik Dev | VD2, 40 F7 | VD6 | VD1 | VD3 | VD7 | VD6 | VD4 | 08b B1, B2, B5 |
| Lanetli Amiral | AM6, 40 F7 | AM1 | lob iniş anı (40 F7) | AM5 | AM2 | AM7 | AM4 | 08b B1, B7 |
| Kızıl Hançer | 40 F1 | 40 F2 | 40 F2 | IB6 | IB1 | 38 N1–N3 | IB5 | 08b B1, B5 |
| Morvan | IB2, IB7 | 40 F2 | IB2 | IB6 | IB2 | 38 N1–N3 | IB5 | 08b B1 |
| Hayalet Kaptan | IB3 | 40 F2 | IB3 | 39 T9 | IB1 kalıbı (%50 çağırma) | IB3 (atılma) | IB5 | 08b B1 |
| Haydut Kaptanı (mini) | IB4 | 40 F2 | 40 F2 | — | — (evresiz) | 38 N1–N3 | 39 T1 | 08c C2 |
| Faz 6: Kor Selim, Madenbaşı, Gelgit'in Gölgesi | IB8 | IB8 | IB8 | IB8 | IB8 | IB8 | IB8 | IB8 + 08b B1 |

---

## Ek D — İnceleme bulguları (inceleme düzeltmesi)

Önem sırasına göre. "Yer" sütunu bu belgede düzeltmenin yapıldığı bölümdür.

| # | Önem | Bulgu | Kanıt | Yer |
|---|---|---|---|---|
| 1 | Yüksek | **Vuruş karesi ölçüm yöntemi hatalı.** `enemy_moves.mjs` iki bilekten büyüğünün doğrusal hız tepesini alıyor. Dürtmelerde (AtkStab, Stab2H, DualStab) bugünkü `hitAt` en ileri erişimle ±0,02 sn örtüşüyor, yani H-09'un bu üç maddesi yapıntı. Üstelik önerilen bükme bu hamlelerde yeni bir kopukluk yaratırdı. DASH için `Stab2H`'ye verilen s = 0,37 de yanlış (doğrusu 0,77 klip sn). Tek elli hamlelerde sol bilek, tekmede bilek ölçülmüş | `inc_strike.mjs`; `enemy_moves.mjs` çıktısındaki 'L' sütunu | §0.1-3, §0.5, §1.7a, §4.3, K7-16 |
| 2 | Yüksek | **H-20 düzeltmesi yetersiz, ölçüm düzeni gerçek dışı.** M5b `chainAt`'i atlıyordu (23 savuruş > meşru 18). Gerçek zincirde asıl kilit bitirici sersemliği; K7-5'in ilk biçimiyle T8 ölçütü sağlanamaz (0/10–11). Bitirici azalan getirisiyle 2/6 | Tarayıcı `inc_olcum.js` MA (3 değişke × 3 koşu); `inc_poise_sim.py` | §0.1-4, K7-5, §2.9, 39 T8 |
| 3 | Yüksek | **Derinlik Yılanı tükürüğü can hasarı vermiyor** (yeni hata). `SeaSerpent`'te `_hitPlayer` yok; konuğa ne hasar ne zehir gidiyor. İlk taslak YL2/E4'te bunu varsayıyordu ama kök nedeni görmemişti | `bosses.js:391-556`, `enemies.js:1442-1443`; tarayıcı MB | §3.1, §3.3, §4.5, YL8, 08b B10 |
| 4 | Yüksek | **Konuk için kaçınma ve blok zamanı adil değil.** Host iframes'i niyetin alındığı andan sayıyor. NetInterp gecikmesi ve RTT/2 0,42 sn'lik telgrafta tepki payını 0,01–0,26 sn'ye düşürüyor. Konuk yerelde hasar almıyor ama gölge can düşüyor, ardından `hp{v}` düzeltmesi geliyor. R12 yalnız sonucun eşitliğini ölçüyordu | Faz 2 §5.10(b, d); Faz 5 §3, K5-8 | K7-15, §3.8, §4.9, 08a E9–E10, 08b B9 |
| 5 | Orta-yüksek | **Doğal hız ölçümü destek eşiğine duyarlı.** 3 cm eşikte yürüme hızı %20 yüksek; ölçüt (2) ("< 0,25 m/sn") doğal hızda bile tutmuyor. 1,5 cm eşikte Walk 0,71 m/sn. Doğru eşleme ~4 adım/sn kadans gerektirdiği için kadans sınırı eklendi | `inc_gait_med.mjs`, `inc_gait_med2.mjs` | §0.1-6, K7-9, §5.1, §5.3, 43 H01–H03 |
| 6 | Orta-yüksek | **Algı ölçütleri formülle çelişiyor.** A5: 0,5 × görüşte eğilmiş oyuncu 3,88 sn'de fark ediliyor ("4 sn fark edilmez" tutmaz). A3: gece meşalesiz 0,45 × → 4,73 sn ("≤ 3 sn" tutmaz); meşaleli 1,1 × → 4,68 sn ("≤ 4 sn" tutmaz). A6: silah sesi engelden sönmez, ama ölçüt "duvar arkasında tepki yok" diyordu. A7: aktarıcı düzeni tanımsızdı | Tarayıcı MC; §2.2 | §9.1, 37 A2–A7, A10 |
| 7 | Orta | **Öfkede telgraf alt sınırın altına iniyor.** "Diğerleri geçiyor" yanlıştı | `enemies.js:921-922`; tarayıcı MD | §0.1-3, §3.7, §4.1 R1, §4.3, 40 F1, 42 IB7 |
| 8 | Orta | **Oyuncu Counter ve tekme için önerilen `hitAt` değişiklikleri yapıntı.** Counter 0,26 → 0,40 yeni gecikme yaratırdı (kılıç ucu tepesi 0,305 sn), tekme 0,34 → 0,29 hasarı ayak uzanmadan verirdi. Yalnız Atk2 ve Atk3 değişmeli | `inc_profile.mjs`, `inc_strike2.mjs` | §0.4 Ç-4, §0.5 I-10, §4.3, 40 F10 |
| 9 | Orta | **Dev boss vuruş kareleri açısal hız tepesinden alınmış.** Yumruk en ileri 0,50 (0,313 değil), süpürme 0,458, `Jump_Land` 0,167. M8b'nin +0,667 sn'si aslında +0,43 sn | `inc_giant.mjs` | §0.5 H-02, §3.4, §3.5, §4.3, 42 TM1 |
| 10 | Orta | **Kamera–ağaç kararı kullanıcı isteğinden sapıyordu.** Aşama 10 "ağaçların içinden geçmemeli" diyor; ilk taslağın varsayılanı bütün ağaçlarda soldurmaydı ve sapma gerekçelendirilmemişti. Karma kural (r ≥ 0,45 ve ≥ 1,2 m) hem isteği hem v0.4 gerilemesini (`props.js:237`) gözetiyor | master_prompt Aşama 10; `props.js:237-239` | K7-8, §6.2 KM-f, §6.3, KM6, Ç-10, R15 |
| 11 | Orta | **Blok geri itmesinin birimi yanlış.** `knock` itkidir; "≤ 1,5 m/sn" ile `min(kb, 1,5)` uyuşmuyor (1,5 itki → tepe 3,6 m/sn, 0,87 m). Güverte kipinde başka formül işliyor | `player.js:541-545`, `:839-842`; `inc_knock.py` | §4.1 R5, §4.2, §4.5, 40 F3, Ek B |
| 12 | Orta | **`Enemy.hurt` `applyDamage` dönüşünü yok sayıyor; boss dokunulmazlığı 'blocked'.** Faz 6 `lightBound` 'blocked' değeri yayılmaz. Bordalanmış Amiral ve derin Kraken'e vuran oyuncunun kılıcı geri sekiyor | `enemies.js:363-364`, `bosses.js:109`, `combat.js:226-229` | §3.1, §4.5, Ç-11, AM5, KR7 |
| 13 | Orta | **Kendi gemisinde görüş sorgusu.** Faz 3 GORUS maskesinde `gemi` bayrağı var. Yerel oyuncunun yakın dövüş görüş sorgusu (Ç-3) güverteden sersem Yılan başına vuruşu kesebilir | Faz 3 §7.3; `camera.js:28`; `bosses.js:480` | §3.3, §4.6, 41 YL4b |
| 14 | Orta | **Eğim sınırı uyumsuz.** Düşman 40°, oyuncu ≈ 53° tırmanıyor: 40–53° yamaç oyuncuya sığınak | `player.js:550`, `:577` | §2.8, 38 N3, Ek B |
| 15 | Orta | **LOD API'si Faz 8 taslağıyla iki kez planlanıyor** | `faz8_tasarim.md` §3.9, R13 | §7, Ç-12, Ek B |
| 16 | Orta | **Boss × 8 özellik matrisinde boşluklar** (Yılan evre/ödül, Kraken/Amiral zayıf nokta, Amiral uyarı/hareket, Volkanik Dev evre, insan boss zayıf noktası, Faz 6 bossları) | §9.2 ilk taslak | Ek C matrisi; 41 KR7, YL6–YL8, AM5–AM7; 42 VD7, IB6–IB8 |
| 17 | Orta | **Atılım kuralı (I-09) karar tablosunda yoktu.** Duran oyuncunun zinciri 0,35–0,94 m daha az ilerliyor; Faz 2 hareket doğrulayıcısı ve 06j etkileniyor. `hitAt` değişiklikleri atılım süresini de değiştiriyor | `player.js:522-525` | K7-14, §4.3, §4.4, Ç-15, 40 F12 |
| 18 | Orta | **N2 navigasyon ölçütü algıyla karışıktı.** Düşman algıdan vazgeçtiği için sonuç navigasyonu ölçmüyordu | `olcum_ai.js` M2 izi (5. sn `investigate`, 15. sn `patrol`) | 38 N2, N2b |
| 19 | Düşük-orta | **Hayaletler süzülüyor**; ayak kayması ölçütü uygulanamaz. İlk taslağın koşu kıskacı hayalet koşusunu 0,70 oranına sıkıştırıyordu | `enemies.js:1195-1196`, `:738` | §2.10, §5.3, 38 N9 |
| 20 | Düşük-orta | **Faz 6 bağlantıları eksikti.** `icebolt` yavaşlatması sözleşmede yok; deniz bossları `ocean.levelAt`'i kullanmalı; F7-0 sıra değişikliği KARARLAR.md'de yok; F7-0 tabanı v0.4 değil, o anki kod | Faz 6 §5.2 B1, S13 | Ç-9, Ç-13, Ç-16, §8.3 |
| 21 | Düşük-orta | **Meşale terimi gündüz de görünürlüğü artırıyordu** (`max(…, 1,15, …)`). `fogAt` için zamanla sönen `regionW` kullanılamaz. Konuğun eğilme hız eşiği gürültülü `RemotePlayer.vel` üzerinden okunamaz | `enemies.js:544`; `sky.js:270-276`; `net.js:96-101` | §2.2 |
| 22 | Düşük | **Bit alanı çakışma riski** (Faz 5 `st.fl` / `snap.p.flags`) | Faz 5 §3.2 | Ç-14 |
| 23 | Düşük | Küçük sayı ve tanım hataları: `findCover` `r + 0,7`; F4 boss sersemliği 1,02 sn; dev bosslar parry ile sersemlemez; KM7 piksel ölçüm yöntemi; KM-c Faz 3 pad'iyle zaten karşılanıyor; `hold` engeli iki adıma yazılmıştı; A4'te `sky.target` ayarı gerekli | `enemies.js:1397`, `:448`; `sky.js:253-254` | §2.5, R6, F4, KM-c, KM7, §8.2, A4 |
| 24 | Düşük | **R12 riski abartılıydı.** Poz ve kontak görüntüleri SwiftShader'da doğrudur; değerlendirilemeyen yalnız akıcılıktır. Dümende 0,20 m kavrama görsel olarak alışılmadık; seçenek eklendi | — | §9.1, §5.4, R12 |
| 25 | Düşük | **R2 tolerans birimi çelişkiliydi.** R2 "0,06 klip sn", F10 "0,06 sn" diyordu. Oyuncu klipleri 1,4–1,8× oynadığı için iki ölçüt farklı sonuç veriyordu. Birim oyun saniyesine bağlandı | §4.1, §9.2 ilk taslak | §4.1 R2, §4.3, 40 F2, Ek B |

**Doğrulanan (değişmeyen) iddialar.** Kod okumasıyla şunlar yeniden sınandı ve doğru bulundu: H-01 (Kraken hedefi k = TSEG−6 −1 m,
`bosses.js:358`), H-04 (halka ölçekleri), H-05, H-06, H-07, H-08, H-10 (`_startMelee` yalnız menzilde çağrılıyor, DASH 4–10 m
istiyor), H-11, H-12 (`_targetInfo` canlı `pl.pos`), H-13 (`RemotePlayer` algı alanlarını kopyalamıyor; `onGround` ise
`st.air`'dan geliyor, `net.js:104`), H-19, H-22, H-25, H-26, H-27, H-28, H-29, I-02 ve I-03 (istasyon ve IK hedefleri,
`player.js:905-942`), I-07 (`main.js:233` doğrudan `p.mode = 'ground'`), I-12 (`ik.ground` hiçbir yerde atanmıyor), climb
betiğinin ölümde sürmesi (`player.js:366`), dümende 1–7 tuşunun silahı ele vermesi (`player.js:111-112`).

