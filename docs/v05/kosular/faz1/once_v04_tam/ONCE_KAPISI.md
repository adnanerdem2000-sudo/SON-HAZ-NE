# Faz 1 "önce" kapısı: yeni koşucuyla v0.4 tam taban

Bu klasör, Faz 1'deki oyun kodu değişikliklerinden önce alınan ölçümü tutar. Ölçüm, v0.4 oyun kodunun yeni (A1) test koşucusuyla tam taban koşusudur. Faz 1 sonundaki "sonra" karşılaştırması bu kayda ve Faz 0 tabanına göre yapılacak (Faz 9 tasarımı §7.3).

## Ne, neyle koşuldu

- **Oyun kodu:** v0.4 (44d548c). Çalışma ağacı 5479e3b'nin ayrı bir kopyası (`/home/user/SON-HAZ-NE-kosu`). 5479e3b, v0.4 oyunu ile A1 koşucusunu birleştirir; o committe oyun koduna dokunulmadı. Sunucu: `http://localhost:8080`.
- **Koşucu:** `run.cjs` 591dff27, `coop.cjs` a6e0e14c, `ortak.cjs` df191a99. Bu koşucu konsol hatası, ≥400 yanıt, başarısız istek ve sayfa hatasında koşuyu KALDI sayar.
- **Taban:** `docs/v05/taban_kosusu_44d548c/`. Faz 0'da eski koşucuyla alındı.
- **Karşılaştırma:** `tests/harness/taban_karsilastir.cjs` ile yapıldı. Araç `taban_karsilastirma.txt` ve `.json` dosyalarını yeniden üretir: bu commit öncesinde aynı çıktı bayt bayt doğrulandı. Komut:

  ```
  node tests/harness/taban_karsilastir.cjs docs/v05/taban_kosusu_44d548c docs/v05/kosular/faz1/once_v04_tam --json docs/v05/kosular/faz1/once_v04_tam/taban_karsilastirma.json
  ```

## Tek tam koşunun sonucu (09:31–10:30)

- **Resmî taban kümesi (25 koşu):**
  - Tabanda tümüyle geçen 23 koşudan **20'si** yeni koşucuyla da tümüyle geçti.
  - Tabanda geçen 246 kontrolden **233'ü** geçti.
- **Regresyonlar:** 3 koşuda 13 regresyon görüldü:
  - `17_kamera_kararma`: 8 kontrol ve sayfa çökmesi.
  - `14_deniz_ekipmani`: G06 ve L03.
  - `coop_06a2`: 3 kontrol.
- **Ek koşular (işçisiz arazi kipleri):** 3/3 koşu, 36/36 kontrol.
- **İzinsiz hata yok:** Hiçbir koşu izinsiz konsol ya da ağ hatası yüzünden kalmadı; her satırda izinsiz k/a = 0/0. Kalan üç koşunun nedeni koşucunun yeni hata sınıflandırması değil, kontrol başarısızlığı ya da sayfa çökmesi.
- **Düzelen kontroller:** coop_06c tabanda 2/7 iken bu koşuda 7/7 geçti (D4-02…D4-06). Bu test Faz 0'da zaten kararsız diye kayıtlıydı (KI-233), bu yüzden düzelme sayılmaz.

## Tekrarlar (`tekrar/`, 10:32–11:35)

Üç koşunun her biri iki koşucuyla da tekrarlandı:

- **Yeni koşucu:** 5479e3b kopyasındaki koşucu.
- **Eski koşucu:** 44d548c'deki `run.cjs` ve `coop.cjs`'in kopyası.

Bellek 2 saniyede bir örneklendi (`tekrar/bellek.txt`). Ölçülen değer, cgroup'un toplam kullanımı; sınır 14,3 GB. Bu toplam, aynı anda çalışan iş akışı ajanlarını da kapsar. Tekrarlar sırasında OOM sayacı (`oom_kill`) 6'da kaldı, yani yeni bir bellek öldürmesi olmadı. Toplam tepe 7,3 GB oldu.

| Koşu | Yeni koşucu (GEÇTİ/koşu) | Eski koşucu (GEÇTİ/koşu) | İlk kalmanın nedeni |
|---|---|---|---|
| 17_kamera_kararma | **2/3**: tam koşu KALDI, 2 tekrar 13/13 | 1/1: Faz 0 tabanı. Eski koşucuyla tekrarlanmadı (neden kesin). | **Bellek (OOM):** 09:49:57'de cgroup sınırı aşıldı ve `chrome-headless` öldürüldü (anon-rss 5,2 GB, aşağıdaki dmesg satırı). Sayfa çöktü, sonraki 8 kontrol "Target crashed" verdi. |
| 14_deniz_ekipmani | **3/4**: tam koşu KALDI, 3 tekrar 16/16 | **3/3**: Faz 0 tabanı ve 2 tekrar, 16/16 | **Çanta rastgele doldu.** Ayrıntı aşağıda. |
| coop_06a2 | **3/4**: tam koşu KALDI, 3 tekrar 3/3 | **3/3**: Faz 0 tabanı ve 2 tekrar, 3/3 | **Konuk menüye düştü:** `["playing","menu","playing"]`. Belirti KI-233 ile aynı; kök neden kanıtlanmadı. Koşu sırasında OOM yok. Ayrıntı aşağıda. |

Eski koşucu 14 ve 06a2'de 3/3, yeni koşucu 3/4 geçti. Bu örneklem büyüklüğünde bu fark anlamlı değil.

- **14:** Kalmanın mekanizması koşucudan bağımsız olarak gösterildi.
- **06a2:** Kalma kontrol başarısızlığı; koşucunun yeni sınıflandırdığı hiçbir hata yok. Ama oyundaki kök neden bilinmiyor.

### 17: bellek

```
[Sat Nov 14 09:49:57 2026] Memory cgroup out of memory: Killed process 19287 (chrome-headless) total-vm:1524420276kB, anon-rss:5234252kB, ...
```

Koşu raporunda `hatalar.sayfa = ["SAYFA ÇÖKTÜ (renderer crash)"]` görünüyor. K05–K12 "page.evaluate: Target crashed" verdi. Yazılımsal GL (SwiftShader) tek sayfada 5–7 GB bellek kullanabiliyor.

Bu ortam kaynaklı bir sorun, oyun mantığı değil. Bellek konusu Faz 8'e ve test ortamı notlarına aktarılacak.

### 14: çanta kapasitesi (test ön koşulu eksik)

**Kalan koşudaki iz:** L03'ün ara çıktısı `R: {"zipkin":1,"ag":1,"maske":1,"palet":0,"kese":1}` oldu.

- L03 önce zıpkını (2,2 kg), ağı (2,5 kg) ve maskeyi (0,5 kg) ekler. Bunlardan sonra paleti (0,9 kg) ve 3 hava kesesini (her biri 0,3 kg) ekler.
- `Inventory.add` sığmayan eşyayı eklemez ve yığından "sığdığı kadarını" ekler (`js/player/inventory.js:23-32`).
- Palet sığmadı ve 3 keseden yalnız 1'i sığdı. Bu, çantada 0,3–0,6 kg boş yer kaldığı anlamına gelir.
- G06'da ağın çıkardığı balıklar çantaya sığmadığı için "kayıp" sayıldı (`js/wildlife/seagear.js`, ağ toplama).

**A2'nin ayrı tanı ölçümleri:** `../a2/inceleme/14_tani_*`. Bu ölçümler L02 bittikten sonra, L03'ten önce çantayı tartar:

- w2'de **48,11/45 kg** ölçüldü (kapasite aşılmış). O koşu L03'te kaldı; eklenemeyenler ağ, palet ve 3 kese.
- v0.4'te eski koşucuyla 29,4/45 kg, yeni koşucuyla 41,43/45 kg ölçüldü. İki koşu da geçti.

**Ağırlığın nereden geldiği:** Ağırlık, önceki adımlarda rastgele yakalanan balıklara bağlı. L02 de etkiler: sandığı açmak için kapasiteyi geçici olarak artırır, sonra eski değere döndürür. Bu yüzden çanta L02'den sonra kapasitenin üstünde kalabilir.

**Sonuç:** Dolu çantada "çantanda yer yok" davranışı tasarım gereği. Hata oyunda değil; testin ön koşulu önceki adımların rastgele sonucuna bağlı. Faz 1 içinde G06 ve L03'ten önce çantada yer açan bir test sağlamlaştırması yapılacak. Onaylar değişmeyecek; düzeltme hem v0.4'te hem w2'de sınanacak.

### 06a2: konuğun menüye düşmesi

**Zaman çizelgesi:**

- Koşucu 10:16:24,7'de başladı (`ortam.tarih`). Üç oyuncunun hazır olması 207 saniye sürdü (`sure.hazirMs`). Geçen tekrarlarda bu süre 194–214 saniye; yani bu koşu olağan dışı yavaş değildi.
- Aynı cgroup'ta 10:16:10'da bir OOM öldürmesi var (`chrome-headless`, pid 26197). Bu, koşucu başlamadan 14 saniye önce. Öldürülen süreç bu koşunun tarayıcısı değildi: koşucunun pid'i 26529 ve tarayıcıları ondan sonra açılır.
- O sırada tarayıcı kilidini başka bir koşu tutuyordu (A2 ya da B0 ajanının koşusu). **Bu koşunun kalması OOM'a bağlanamaz.**

**Ne bulundu, ne bulunamadı:**

- Raporlarda, kalan koşuyla geçen tekrar arasında konuğun menüye düşmesini açıklayan bir uyarı ya da ağ hatası farkı yok. Uyarıların hepsi three.js'in bilinen iki uyarısı.
- H07/H22 ve H13 bu ilk kalmanın zincirleme sonuçları: ölçüm üç oyuncunun da oyunda olmasını gerektiriyor.
- Konuğun katılırken menüye düşmesi Faz 0'da 06c'de de görüldü (KI-233). Katılma isteği yeniden denenmiyor. **Kök neden kanıtlanmadı**; Faz 5'te ele alınacak.

## Karar (§7.4-6)

`17_kamera_kararma`, `14_deniz_ekipmani` ve `coop_06a2` yeni koşucuyla **KARARSIZ** diye kaydedildi:

- **17:** 2/3 (tek kalma bellek kaynaklı).
- **14:** 3/4.
- **06a2:** 3/4.

Bunlar GEÇTİ sayılmadı. Yeni koşucunun kendisinden kaynaklanan bir regresyon bulunmadı.

Faz 1 "sonra" kapısında w2 aynı araçla karşılaştırılacak. Bu üç koşudan biri kalırsa, yukarıdaki k/N ve nedenlerle birlikte yeniden koşulup kaydedilecek. 14'ün test sağlamlaştırmasından sonra belirlenimli geçmesi beklenir; bu ayrıca sınanacak. `09_performans` ve `coop_06c` Faz 0'dan beri kararsız diye kayıtlı.

## Dosyalar

- `summary.txt`: tam koşunun satırları.
- `<koşu>.json` / `.log`: ham raporlar.
- `taban_karsilastirma.txt` / `.json`: Faz 0 tabanıyla kontrol kontrol karşılaştırma.
- `tekrar/summary.txt`: tekrarlar; her satırda koşu süresince cgroup tepe belleği var. Betikteki `grep oom_kill` iki satırı yakaladı:
  - Satırdaki `oom=0` aslında `oom_kill_disable` değeri.
  - Bir sonraki satırın başındaki `6`, `oom_kill` sayacı. Bu sayaç tüm tekrarlar boyunca 6'da kaldı.
  - Eski koşucu `SONUC` satırı yazmaz, bu yüzden PASS/FAIL sayıları günlükten alındı.
- `tekrar/bellek.txt`: 2 saniyelik bellek örnekleri. Burada da `oom=` yanındaki 0 `oom_kill_disable` değeri; altındaki satır `oom_kill` sayacı.
- `tekrar/*_yeni_N.*`, `tekrar/*_eski_N.*`: tekrarların ham raporları.
