# 14_deniz_ekipmani: çanta yeri ön koşulu (Faz 1 test sağlamlaştırması)

## Sorun

Önce kapısında `14_deniz_ekipmani` yeni koşucuyla 3/4 geçti (`../once_v04_tam/ONCE_KAPISI.md`). Kalan koşuda G06 (ağ) ve L03 (kayıt) kaldı. A2'nin tanısı da aynı yeri gösteriyordu: L03'ten önce çanta 48,11/45 kg (`../a2/inceleme/14_tani_*`).

**Kök neden:** Testin ön koşulu önceki adımların rastgele sonucuna bağlıydı.
- G02/G03'te zıpkınla yakalanan balıkların türü ve ağırlığı rastgele.
- L02 sandığı açmak için kapasiteyi geçici büyütüp sonra geri alıyor; bu yüzden çanta kapasitenin üstünde kalabiliyor.
- `Inventory.add` sığmayanı eklemiyor (`js/player/inventory.js:23-32`). Ağın balıkları "yer yok" diye bırakılıyor (`js/wildlife/seagear.js`), oltanın balığı da öyle (`js/wildlife/fishing.js` `store`).

Oyun davranışı tasarım gereği doğru; kusur testteydi.

## Düzeltme (yalnız test; onaylar ve 16 etiket bayt bayt aynı)

- **`_yerAc(kg)` yardımcısı:** Önceki adımların balıklarını çantadan çıkarır. Yine de `kg` kadar yer yoksa kapasiteyi gereken kadar büyütür (L02'nin sandık için yaptığı gibi). Ne yaptığı adım sonucuna yazılır.
- **G06 (iz bırakmaz):**
  - Atış süresince kapasite `ağırlık + 6 × 12 + 0,5` kg'a büyütülür. Bir atışta en çok 6 balık çıkar (`NET_MAX`); ağa girebilen en ağır tür morina, 12 kg.
  - Ölçümden sonra ağın eklediği balıklar çıkarılır ve kapasite geri konur.
  - Böylece sonraki adımlar G06'dan önceki çantayı görür.
- **R01:** Olta ve yem eklenmeden önce `_yerAc(200,5)` uygulanır. İskelede yakalanabilecek en ağır tür kılıçbalığı (200 kg). Kapasite bu adımdan sonra büyük kalır; L02 ve L03 bundan etkilenmez.
- **L03:** Ekipman eklenmeden önce `_yerAc(7,5)` uygulanır. Gereken yer: zıpkın 2,2 + ağ 2,5 + maske 0,5 + palet 0,9 + 3 × 0,3 kese = 7,0 kg.

Üreteç `senaryolar/yama14.py.txt` içinde. Senaryodaki yorum gerekçeyi özetliyor.

## Deney (belirlenimli yeniden üretim; koşucu 591dff27)

Deney çeşitleri çantayı yapay olarak doldurur:
- **"dolu_balik":** G06 ve L03'ten hemen önce çanta balıkla doldurulur; boş yer ≤ 0,04 kg, en hafif balık ise 0,05 kg.
- **"dolu_esya":** Aynı yerlerde çanta balık olmayan eşyayla (kürek) doldurulur. Bu çeşit kapasite büyütme yolunu sınar.

| Tur | Çeşit | Sonuç |
|---|---|---|
| 1 (`./`) | v0.4 özgün + dolu_balik | **KALDI 14/16 (G06, L03)**: kalma belirlenimli yeniden üretildi |
| 1 | w2 özgün + dolu_balik | **KALDI 14/16 (G06, L03)** |
| 1 | v0.4 düzeltilmiş (1. sürüm) + dolu_balik / olağan | 16/16, 16/16 |
| 1 | v0.4 düzeltilmiş (1. sürüm) + dolu_esya | **KALDI 15/16 (R01)** |
| 1 | w2 düzeltilmiş (1. sürüm) + dolu_balik / olağan ×2 | 16/16, 16/16, 16/16 |
| 2 (`ikinci/`) | 2. sürüm (G06 iz bırakmaz), 6 çeşit | 5 GEÇTİ; **dolu_esya R01 KALDI** |
| 3 (`ucuncu/`) | 3. sürüm (+ R01 ön koşulu), 6 çeşit | **6/6 GEÇTİ** (16/16) |
| son (`son/`) | commit'lenen dosya, w2 | 16/16 GEÇTİ |

**Turlarda bulunanlar:**
- **1. tur:** 1. sürümde G06 kapasiteyi yalnız geri koyuyordu. Ağın balıkları çantayı kapasitenin üstünde bırakınca R01'in oltası ve yemi eklenemedi (`res[].st1 = idle`, `yem 0`). Gerçek koşularda ağ ağır balık çıkarırsa aynı şey olabilirdi.
- **2. tur:** R01'in kendi ön koşulu ortaya çıktı. Olta balığı yakaladı ama balık çantaya sığmadı (`got 0`). Bu, özgün testte de rastgele çanta doluluğunda ve iskelede yakalanabilen 120–200 kg'lık türlerde (kılıçbalığı, orkinos, napolyon) gizli bir kırılganlıktı. Şimdiye dek gözlenmedi.

**Sınırlar:**
- Çeşitler yapay doldurma kullanıyor; gerçek koşulardaki dağılım rastgele.
- Son sürümle yapılan koşular:
  - olağan: v0.4'te 1, w2'de 3 (ikisi 3. turda, biri son koşu);
  - yapay dolu çanta: 3 çeşit;
  - hepsi 16/16.
- Önceki sürümlerin olağan koşuları da 16/16 geçti (1. ve 2. turlar).
