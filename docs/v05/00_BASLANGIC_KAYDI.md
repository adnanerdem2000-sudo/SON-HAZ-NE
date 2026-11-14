# v0.5 Başlangıç Kaydı ve Yedek (Faz 0)

Tarih: 13 Kasım 2026. Bu belge, v0.5 sağlamlaştırma çalışmasına başlamadan önceki durumu kaydeder. Bu kayıt yapılırken
**hiçbir kaynak dosya değiştirilmedi.**

## 1. Sürümler ve dallar

| Sürüm | Commit | Dal | Durum |
|---|---|---|---|
| v0.3 (canlı) | `762f1c76674cad279931e28b5148a94933832b43` (31 Ekim 2026) | `claude/hopeful-cray-o1jw6w` — deponun **varsayılan dalı**; GitHub Pages bu daldan yayınlanır | Canlı oyun: https://adnanerdem2000-sudo.github.io/SON-HAZ-NE/ |
| v0.4 (geliştirme) | `44d548cf0011c51158d6aaf3bcc79304c157f3ba` (9 Kasım 2026) | `claude/denetim-v0.4` | Yayınlanmadı; v0.3'e göre 240 dosya değişti (+10 085 / −762 satır) |
| v0.5 (bu çalışma) | `44d548c` üzerinden | `claude/v0.5-saglamlastirma` | Bütün yeni değişiklikler yalnız bu dalda yapılır |

- Depoda `main` dalı **yoktur**; "ana dal" bu projede varsayılan dal olan `claude/hopeful-cray-o1jw6w`'dır.
- Canlı dal, v0.4 dalı ve kökteki tek HTML dosyası bu çalışmada **değiştirilmez**. Yayın kararı kullanıcıya aittir ("canlıya al").
- v0.4 dalının `pages.yml` dosyası yalnız `main`, `master` ve `claude/hopeful-cray-o1jw6w` dallarına yapılan gönderimlerde yayın yapar.
  Bu yüzden `claude/v0.5-saglamlastirma` dalına yapılan gönderimler canlıyı değiştirmez. v0.3'teki eski kural (`claude/**`) yalnız
  canlı dalda duruyor. Faz 9'da ayrıca ele alınacak.

## 2. Yedekler

| Yedek | İçerik | Konum | Not |
|---|---|---|---|
| GitHub dalları | v0.3 ve v0.4 | `claude/hopeful-cray-o1jw6w` (762f1c7), `claude/denetim-v0.4` (44d548c) | Bu çalışma boyunca bu iki dala gönderim yapılmaz; kalıcı yedek bunlardır |
| Git etiketleri | `yedek-v0.2` → `b2be13e`, `yedek-v0.3` → `762f1c7`, `yedek-v0.4` → `44d548c` | Yerel depo | GitHub'a gönderilemedi: ortamın git vekil sunucusu etiket gönderimini **HTTP 403** ile reddetti |
| Git paketi (bundle) | Tüm dallar ve etiketler | Oturumun geçici klasörü: `yedek/SON-HAZ-NE_tum_dallar.bundle` (23 057 721 bayt, SHA-256 `417c9103083a635561b851fdf4e5e65af6b4a6ec8d4b8c02e9285c1c2130a47b`) | Oturum kapanınca silinir; asıl kalıcı yedek GitHub dallarıdır |

## 3. Dosya yapısı

- v0.4 (44d548c): 389 dosya, 43 033 503 bayt. Tam liste, git blob SHA-1 değerleriyle birlikte `dosya_yapisi_44d548c.txt` dosyasında.
  Dağılım: `js/` 77 dosya (1 394 KB), `assets/` 100 (14 792 KB), `vendor/` 21 (2 420 KB), `docs/` 42 (1 377 KB),
  `tests/` 140 (468 KB), `tools/` 1, `css/` 1; kökte `index.html` ve 21 981 073 baytlık tek HTML (v0.3 derlemesi).
- v0.3 (762f1c7): 216 dosya, 41 005 760 bayt. Liste `dosya_yapisi_762f1c7.txt` dosyasında.

## 4. Çalışan sürüm: v0.4 taban test koşusu

- **Ortam:** başsız Chromium ve SwiftShader (yazılımsal WebGL, **gerçek GPU yok**), 4 çekirdek, 15 GB bellek. Yerel statik sunucu
  ve yerel PeerJS sunucusu (127.0.0.1:9000). Gerçek ağ ve TURN denenemez.
- **Yöntem:** `taban_kosusu_44d548c/run_baseline.sh`. Senaryolar tek tarayıcıyla sırayla koştu. Her senaryonun günlüğü ve JSON raporu
  aynı klasörde.
- **Tür:** Hepsi **gerçek tarayıcıda** (Chromium) koşan otomatik testlerdir. Oyun mantığının bir kısmı `DK.sim` ile çizimsiz ileri
  sarılır; senaryo bazında ayrıntı ilgili dosyada.

| Senaryo | Sonuç | Süre | Not |
|---|---|---|---|
| 00_acilis | 6/6 geçti | 32 sn | |
| 02_arazi_yedek | 12/12 | 68 sn | **Yalnız normal (işçili) kipte koştu.** Senaryo işçisiz kipler için yazılmış, ama taban betiği `?terrain=` parametresi vermedi ve senaryo etkin kipi doğrulamıyor. İşçisiz kipler (`noworker`, `badurl`, `crash`) bu kayıtta **denenmedi**; Faz 1'in "önce" ölçümünde v0.4 üzerinde ayrıca koşulacak (düzeltme, 14 Kasım 2026; denetim K) |
| 02_arazi_kurtarma | 7/7 | 52 sn | İşçi çökmesi |
| 02_arazi_yedek `?terrain=noworker` (ek koşu, 14 Kasım) | 12/12 | 74 sn | İşçi yok, yedek açık (`workers 0`, `fallback true`). Uzak bölge `prepare` 1,6 sn |
| 02_arazi_yedek `?terrain=badurl` (ek koşu) | 12/12 | 61 sn | 3 işçinin yüklemesi başarısız (`net::ERR_FAILED`, 3 kayıt), yedek açık. Uzak bölge `prepare` 1,8 sn |
| 02_arazi_yedek `?terrain=crash` (ek koşu) | 12/12 | 81 sn | İşçiler ilk işte çöküyor, yedek açık. **Uzak bölge `prepare` 28,8 sn** (normal kipte 0,6 sn, `noworker` kipinde 1,6 sn); 45 sn sınırına yakın. Faz 1'de kök nedeni aranacak |
| 02_tek_dosya | 4/4 | 28 sn | `file://` tek HTML (dist, v0.4) |
| 03_fizik_dt | ölçüm | 49 sn | Kontrolü yok. 15/30/60 FPS'te yürüme 12,596 m, 120 FPS'te 12,585 m. Zıplama tepesi 1,183 m, 120 FPS'te 1,214 m (%2,6). Gemi 12 sn'de 87,5–87,8 m, 120 FPS'te 82,64 m (**%5,7 eksik**). Dönüş 163–174°. Fizik kare hızından tam bağımsız değil (Faz 3). |
| 03_fizik_duzeltmeler | 14/14 | 39 sn | |
| 04_karakter | 21/21 | 48 sn | |
| 05_dusman_ai | 18/18 | 37 sn | |
| 06_arayuz_960 | 4/4 | 75 sn | 960×540 |
| 07_dunya_kesif | 10/10 | 52 sn | |
| 07_ekonomi | 3/3 | 27 sn | |
| 08_kalicilik | 12/12 | 43 sn | |
| 09_performans | **8/9** | 117 sn | **Kalan:** "ganimet kesesi, gemi ve bosslar oluştur/kaldır döngülerinde geometri/doku büyümez". Volkanik Dev döngüsünde geometri sayısı +5 (`dG: 5`). Önceki kayıtta geçmişti, ya kararsız ya da sızıntı. Faz 8'de incelenecek. Liman: 1 035 çizim çağrısı, 1,25 M üçgen, 753 geometri (v0.3: 1 036). |
| 11_arayuz_sizinti | 6/6 | 38 sn | |
| 12_kayit_dongusu | 4/4 | 35 sn | |
| 13_donma | 9/9 | 40 sn | |
| 14_deniz_ekipmani | 16/16 | 40 sn | |
| 15_iskele_kamera | 14/14 | 58 sn | |
| 16_kosu_poz_ganimet | 23/23 | 150 sn | |
| 17_kamera_kararma | 13/13 | 201 sn | |
| coop/06b_esitlik_senkron (2 oyuncu) | 18/18 | 196 sn | |
| coop/06d_ganimet_canta (2 oyuncu) | 9/9 | 150 sn | |
| coop/06a_ag_guvenligi (3 oyuncu) | 10/10 | 324 sn | |
| coop/06a2_mesaj_kopma (3 oyuncu) | 3/3 | 302 sn | |
| coop/06c_dort_oyuncu (4 oyuncu) | **2/7** | 581 sn | **Kalan:** 2. oyuncu ("Tayfa") odaya katılamadı ve menüde kaldı. Diğer 3 oyuncu yalnız 2 uzak oyuncu gördü. Bu test önceki kayıtlarda da kararsızdı (son kod 5/7 koşuda geçmişti). Katılma isteğinin yeniden denenmemesi Faz 5'te incelenecek. |
| tests/node/archipelago_sabit.mjs | geçti | — | Dünya üretimi v0.3 sabitiyle aynı (67 ada) |

Özet: 25 tarayıcı senaryosunun 23'ü tümüyle geçti. (Düzeltme, 14 Kasım 2026: `02_arazi_yedek` yalnız işçili kipte koştu; işçisiz
kipler bu taban koşusunda sınanmadı. Ayrıca oyun döngüsündeki istisnalar `console.error`'a yazılıyor (`engine.js:66`);
`run.cjs` bunları rapordaki `errors` dizisine kaydediyor ama çıkış kodunda saymıyor. Bu taban koşusunun 25 raporunun hepsinde
`errors` ve `pageErrors` 0, yani tabanda döngü hatası yok; ancak ileride çıkacak bir döngü hatası testi kendiliğinden kırmızıya
çevirmez. İkisi de KNOWN_ISSUES.md'de; düzeltmeleri Faz 1'in test altyapısı adımında.) 09_performans'ta 1 sızıntı kontrolü ve 4 oyunculu co-op testinde katılma
hatası kaldı; ikisi de **bilinen sorun** olarak KNOWN_ISSUES.md'ye girer. 10_uzun_oturum taban koşusuna alınmadı (uzun süreli
bellek teşhisi; Faz 8'de koşulacak).
