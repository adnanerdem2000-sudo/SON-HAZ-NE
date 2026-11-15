# #69 karşılaştırması: B0 "önce" kayıtları, gerçek kilit ↔ taklit (v0.4)

Koşu: 24. Durumu aynı: 24. Kontrol kontrol aynı: 20.

| Koşu | B0 (gerçek kilit) | taklit | süre B0 → taklit (sn) | tarayıcı/renderer VmHWM MB (taklit) | farklı kontroller |
|---|---|---|---|---|---|
| `00_acilis` | KALDI 6/9 | KALDI 6/9 | 50 → 35 | 100.6/445.3 | — |
| `02_acilis_akisi` | KALDI 22/23 | KALDI 22/23 | 134 → 103 | 101.5/451.1 | — |
| `02_acilis_hatalari` | KALDI 3/19 | KALDI 3/19 | 309 → 332 | 99.8/792.6 | — |
| `02_arazi_isci_hata` | KALDI 5/9 | KALDI 5/9 | 92 → 64 | 100.5/559.7 | — |
| `02_arazi_yasam_crash` | KALDI 13/18 | KALDI 13/18 | 100 → 95 | 99.8/587.1 | — |
| `02_arazi_yasam_normal` | KALDI 12/18 | KALDI 13/18 | 89 → 72 | 100.4/587.8 | LY13: KALDI (p99 bütçe+6 ms, en uzun bütçe+8.1 ms) → geçti (tamam) |
| `02_arazi_yasam_normal_2` | KALDI 12/18 | KALDI 13/18 | 89 → 73 | 101.6/583 | LY13: KALDI (p99 bütçe+6 ms, en uzun bütçe+8.1 ms) → geçti (tamam) |
| `02_arazi_yasam_noworker` | KALDI 12/18 | KALDI 13/18 | 115 → 89 | 99.1/558.2 | LY13: KALDI (p99 bütçe+15.9 ms, en uzun bütçe+17.3 ms) → geçti (tamam) |
| `02_arazi_yasam_noworker_2` | KALDI 12/18 | KALDI 13/18 | 115 → 95 | 99/603.7 | LY13: KALDI (p99 bütçe+15.9 ms, en uzun bütçe+17.3 ms) → geçti (tamam) |
| `02_arazi_yedek_badurl` | GECTI 16/16 | GECTI 16/16 | 84 → 44 | 96.3/438 | — |
| `02_arazi_yedek_crash` | GECTI 16/16 | GECTI 16/16 | 88 → 46 | 96.8/450.7 | — |
| `02_arazi_yedek_normal` | GECTI 16/16 | GECTI 16/16 | 81 → 43 | 96.8/477.4 | — |
| `02_arazi_yedek_noworker` | GECTI 16/16 | GECTI 16/16 | 75 → 42 | 96/432.5 | — |
| `02_ayar_lod` | KALDI 4/11 | KALDI 4/11 | 75 → 91 | 101.1/698.3 | — |
| `02_depolama_kapali` | KALDI 2/15 | KALDI 2/15 | 132 → 136 | 99.8/398.9 | — |
| `02_hizli_yolculuk_normal` | KALDI 23/34 | KALDI 23/34 | 265 → 190 | 100.7/595.4 | — |
| `02_hizli_yolculuk_noworker` | KALDI 22/34 | KALDI 22/34 | 301 → 214 | 100.2/771.5 | — |
| `02_hizli_yolculuk_noworker_2` | KALDI 22/34 | KALDI 22/34 | 301 → 215 | 100.7/777.2 | — |
| `02_hizli_yolculuk_noworker_3` | KALDI 22/34 | KALDI 22/34 | 301 → 225 | 101.2/850.3 | — |
| `02_tek_dosya_blob` | KALDI 3/4 | KALDI 3/4 | 47 → 53 | 112.6/618.6 | — |
| `02_tek_dosya_cerceve` | KALDI 2/5 | KALDI 2/5 | 167 → 171 | 110.3/510.5 | — |
| `02_tek_dosya_kipler` | KALDI 3/4 | KALDI 3/4 | 57 → 63 | 113.2/606.5 | — |
| `02_yukleme_bekleme` | KALDI 4/9 | KALDI 4/9 | 62 → 62 | 101.6/489.9 | — |
| `coop_02_hizli_yolculuk_konuk` | KALDI 5/8 | KALDI 5/8 | 117 → 135 | 103.3/406.8 | — |

## Aynı sonuç, farklı değer

Geçti/kaldı aynı, değer farklı. Kırmızılarda kalma biçimi değişmiş olabilir: sonra kapısında "önce" değeri olarak taklitli değer kullanılır.

| Koşu | Kontrol | sonuç | B0 değeri | taklit değeri |
|---|---|---|---|---|
| `02_acilis_hatalari` | AH01 | geçti | 5993 | 7674 |
| `02_arazi_isci_hata` | HI03 | KALDI | 87 | 120 |
| `02_arazi_isci_hata` | HI04 | KALDI | 87 | 120 |
| `02_arazi_isci_hata` | HI08 | geçti | 115 | 94 |
| `02_arazi_yasam_crash` | LY09 | KALDI | B odağı kısaldı: B bittikten 5 sn sonra B bölgesinde 20 ağ, derinlik 5214 m | B odağı kısaldı: B bittikten 5 sn sonra B bölgesinde 0 ağ, derinlik 5214 m |
| `02_arazi_yedek_badurl` | Yüksek çözünürlüklü karolar (yükseklik ızgarası  | geçti | 22 | 25 |
| `02_arazi_yedek_crash` | Yüksek çözünürlüklü karolar (yükseklik ızgarası  | geçti | 22 | 25 |
| `02_arazi_yedek_normal` | Yüksek çözünürlüklü karolar (yükseklik ızgarası  | geçti | 22 | 24 |
| `02_arazi_yedek_noworker` | Yüksek çözünürlüklü karolar (yükseklik ızgarası  | geçti | 22 | 24 |
| `02_hizli_yolculuk_normal` | HY03 | geçti | 0.03 | 0.02 |
| `02_hizli_yolculuk_normal` | HYS-01 | geçti | 1810 | 2404 |
| `02_hizli_yolculuk_normal` | HY05 | geçti | 0.116 | 0.111 |
| `02_hizli_yolculuk_noworker` | HY03 | geçti | 0 | 0.03 |
| `02_hizli_yolculuk_noworker` | HYS-01 | KALDI | 30949 | 19730 |
| `02_hizli_yolculuk_noworker` | HY05 | geçti | 0.156 | 0.097 |
| `02_hizli_yolculuk_noworker` | HY07 | geçti | 21 | 23 |
| `02_hizli_yolculuk_noworker_2` | HY03 | geçti | 0 | 0.03 |
| `02_hizli_yolculuk_noworker_2` | HYS-01 | KALDI | 30949 | 20341 |
| `02_hizli_yolculuk_noworker_2` | HY05 | geçti | 0.156 | 0.096 |
| `02_hizli_yolculuk_noworker_2` | HY07 | geçti | 21 | 23 |
| `02_hizli_yolculuk_noworker_3` | HY03 | geçti | 0 | 0.03 |
| `02_hizli_yolculuk_noworker_3` | HYS-01 | KALDI | 30949 | 22172 |
| `02_hizli_yolculuk_noworker_3` | HY05 | geçti | 0.156 | 0.103 |
| `02_hizli_yolculuk_noworker_3` | HY07 | geçti | 21 | 22 |
| `coop_02_hizli_yolculuk_konuk` | HK01 | geçti | {"kur": "kuruldu", "ilk": {"ms": 1420, "teleport": 1}} | {"kur": "kuruldu", "ilk": {"ms": 1401, "teleport": 1}} |
| `coop_02_hizli_yolculuk_konuk` | HK04 | KALDI | {"ayniOyuncu": true, "konum": [289, -5003], "aUzaklik": 5978, "bUzaklik": 1, "varisBildirimi": ["Kaptan rotayı kırdı: yeni limana vardınız!", "Kaptan rotayı kı… | {"ayniOyuncu": true, "konum": [1676, 813], "aUzaklik": 1, "bUzaklik": 5979, "varisBildirimi": ["Kaptan rotayı kırdı: yeni limana vardınız!", "Kaptan rotayı kır… |
| `coop_02_hizli_yolculuk_konuk` | HK05 | geçti | {"C": {"id": "zumrut_koy_port_0", "x": -305, "z": 5125, "bx": -305.4309772649465, "bz": 5025.041340405603}, "ilk2": {"ms": 1604}, "oncesi2": {"konum": [289, -5… | {"C": {"id": "zumrut_koy_port_0", "x": -305, "z": 5125, "bx": -305.4309772649465, "bz": 5025.041340405603}, "ilk2": {"ms": 1401}, "oncesi2": {"konum": [1676, 8… |
| `coop_02_hizli_yolculuk_konuk` | HK06 | geçti | {"durum": "menu", "menu": true, "hud": false, "oyuncuKaydi": 10046, "cUzaklik": 1, "bildirimSonra": ["Kaptan rotayı kırdı: yeni limana vardınız!"]} | {"durum": "menu", "menu": true, "hud": false, "oyuncuKaydi": 4655, "cUzaklik": 1, "bildirimSonra": ["Kaptan rotayı kırdı: yeni limana vardınız!"]} |
| `coop_02_hizli_yolculuk_konuk` | HK07 | KALDI | {"durum": "menu", "menu": true, "hud": false, "oyuncuKaydi": 10046, "cUzaklik": 1, "bildirimSonra": ["Kaptan rotayı kırdı: yeni limana vardınız!"]} | {"durum": "menu", "menu": true, "hud": false, "oyuncuKaydi": 4655, "cUzaklik": 1, "bildirimSonra": ["Kaptan rotayı kırdı: yeni limana vardınız!"]} |

## Zamana bağlı seçilmiş değerler

| Koşu | Kontrol | B0 | taklit |
|---|---|---|---|
| `00_acilis` | AC01 | false | false |
| `00_acilis` | AC02 | false | false |
| `00_acilis` | AC03 | {"surenPrepare":0,"bitenPrepare":0,"yakinBekleyenKaro":0,"i… | {"surenPrepare":0,"bitenPrepare":0,"yakinBekleyenKaro":0,"i… |
| `02_arazi_yasam_crash` | LY13 | tamam | tamam |
| `02_arazi_yasam_normal` | LY13 | p99 bütçe+6 ms, en uzun bütçe+8.1 ms | tamam |
| `02_arazi_yasam_normal_2` | LY13 | p99 bütçe+6 ms, en uzun bütçe+8.1 ms | tamam |
| `02_arazi_yasam_noworker` | LY13 | p99 bütçe+15.9 ms, en uzun bütçe+17.3 ms | tamam |
| `02_arazi_yasam_noworker_2` | LY13 | p99 bütçe+15.9 ms, en uzun bütçe+17.3 ms | tamam |
| `02_arazi_yedek_badurl` | AYS-01 | true | true |
| `02_arazi_yedek_crash` | AYS-01 | true | true |
| `02_arazi_yedek_normal` | AYS-01 | true | true |
| `02_arazi_yedek_noworker` | AYS-01 | true | true |
| `02_hizli_yolculuk_normal` | HYS-01 | 1810 | 2404 |
| `02_hizli_yolculuk_normal` | HY02 | 5348 | 5348 |
| `02_hizli_yolculuk_normal` | HY13 | 0 | 0 |
| `02_hizli_yolculuk_normal` | HY14 | 5804 | 5804 |
| `02_hizli_yolculuk_noworker` | HYS-01 | 30949 | 19730 |
| `02_hizli_yolculuk_noworker` | HY02 | 5348 | 5348 |
| `02_hizli_yolculuk_noworker` | HY13 | 0 | 0 |
| `02_hizli_yolculuk_noworker` | HY14 | 5804 | 5804 |
| `02_hizli_yolculuk_noworker_2` | HYS-01 | 30949 | 20341 |
| `02_hizli_yolculuk_noworker_2` | HY02 | 5348 | 5348 |
| `02_hizli_yolculuk_noworker_2` | HY13 | 0 | 0 |
| `02_hizli_yolculuk_noworker_2` | HY14 | 5804 | 5804 |
| `02_hizli_yolculuk_noworker_3` | HYS-01 | 30949 | 22172 |
| `02_hizli_yolculuk_noworker_3` | HY02 | 5348 | 5348 |
| `02_hizli_yolculuk_noworker_3` | HY13 | 0 | 0 |
| `02_hizli_yolculuk_noworker_3` | HY14 | 5804 | 5804 |
| `02_yukleme_bekleme` | YB03 | false | false |
