#!/bin/bash
# B2 §8 son koşuları (sıralı, her biri tk kilidiyle; b2_kos.sh ozet.txt'ye satır ekler). Kesilirse kalanlar için yeniden çağrılabilir:
# zaten GECTI/KALDI sonucu yazılmış koşular atlanır (SONUC satırı olan .log).
K=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2_kos.sh
O=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2
U='http://localhost:8085/index.html'; UC='http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000'
kos() { local ad=$1; shift; if [ -f "$O/$ad.log" ] && grep -q "SONUC:" "$O/$ad.log"; then echo "atlandı $ad"; return; fi; "$K" "$ad" "$@"; }
kos 00_acilis tests/scenarios/00_acilis.js "$U" 400
kos 02_depolama_kapali tests/scenarios/02_depolama_kapali.js "$U" 400
kos 02_yukleme_bekleme tests/scenarios/02_yukleme_bekleme.js "$U" 400
kos 02_acilis_akisi tests/scenarios/02_acilis_akisi.js "$U" 500
kos 02_acilis_hatalari tests/scenarios/02_acilis_hatalari.js "$U" 700
kos 02_hizli_yolculuk_normal tests/scenarios/02_hizli_yolculuk.js "$U" 900
kos 02_hizli_yolculuk_noworker_1 tests/scenarios/02_hizli_yolculuk.js "$U?terrain=noworker" 900
kos 02_hizli_yolculuk_noworker_2 tests/scenarios/02_hizli_yolculuk.js "$U?terrain=noworker" 900
kos 02_hizli_yolculuk_noworker_3 tests/scenarios/02_hizli_yolculuk.js "$U?terrain=noworker" 900
kos coop_02_hizli_yolculuk_konuk tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs "$UC" 600 --players 2
kos 06_arayuz_960 tests/scenarios/06_arayuz_960.js "$U" 400
kos 08_kalicilik tests/scenarios/08_kalicilik.js "$U" 400
kos 11_arayuz_sizinti tests/scenarios/11_arayuz_sizinti.js "$U" 400
kos 12_kayit_dongusu tests/scenarios/12_kayit_dongusu.js "$U" 400
kos 15_iskele_kamera tests/scenarios/15_iskele_kamera.js "$U" 400
kos 17_kamera_kararma tests/scenarios/17_kamera_kararma.js "$U" 700
kos coop_06b_esitlik_senkron tests/scenarios/coop/06b_esitlik_senkron.cjs "$UC" 600 --players 2
kos 53_test_kipi tests/scenarios/53_test_kipi.js "$U" 600
# değişikliklerimin dokunduğu ek gerileme korumaları: P01 yakın uyanış (A-14), işçisiz kipte 'Oyun başladı' 4 sn (A-10)
kos 16_kosu_poz_ganimet tests/scenarios/16_kosu_poz_ganimet.js "$U" 500
kos 02_arazi_yedek_noworker tests/scenarios/02_arazi_yedek.js "$U?terrain=noworker" 500
echo SON_KOSULAR_BITTI
