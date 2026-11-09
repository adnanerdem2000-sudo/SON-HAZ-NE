# Kamera parlaklık taraması (kamera dönerken ekran kararması)

Altı grup senaryo, 26 konumda kamerayı oyuncu gibi tam tur döndürür (her eğimde 48 açı) ve her karenin son işlemli ekran
parlaklığını okur; karedeki kamera–baş uzaklığı, çarpışma kısaltması, zemin/su üstü yükseklik, su altı ve oyuncu gizleme durumu da
kaydedilir. Her konumun en koyu iki karesi rapora JPEG olarak eklenir. Sonuçlar ve önce/sonra tablosu: `docs/denetim/12_TEST_PLANI_VE_SONUCLAR.md`.

```bash
node tests/harness/run.cjs tests/scenarios/kamera_tarama/batch_b2_ship.js --size 320x180 --timeout 1450 --report /tmp/gemi.json
node tests/scenarios/kamera_tarama/analiz.cjs /tmp/gemi.json
```

Gruplar: `b1_town_pier` (kasaba, iskele), `b2_ship` (güverte), `b3_water` (yüzme, kayık, açık deniz), `b4_forest_town` (orman,
palmiye, kasaba NPC, pazar, tersane), `b5_island_cave` (tepe, kamp, mağara), `b6_extra_islands` (Zümrüt Koy, Kurt Adası).
Not: bu başsız SwiftShader ortamında ekran arabelleğinden her okuma geçici bellek bırakır; grupları tek tek (en çok iki paralel) koşun.
