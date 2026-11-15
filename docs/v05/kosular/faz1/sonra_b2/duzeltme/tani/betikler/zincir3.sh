#!/bin/bash
# B2 düzeltme koşu zinciri 3: gerileme korumaları
K=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/kos2.sh
DUR=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2duz_zincir.txt
U='http://localhost:8085/index.html'; C='http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000'
k() { echo "$(date -u +%T) BASLA $*" >> $DUR; "$K" "$@" >> $DUR 2>&1; echo "$(date -u +%T) BITTI $2" >> $DUR; }
k tani tani_coop_ortu /home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/tani_coop_ortu.cjs "$C" 400 --players 2
k once tani_coop_ortu_once /home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/tani_coop_ortu.cjs 'http://localhost:8098/index.html?peerhost=127.0.0.1&peerport=9000' 400 --players 2
k . coop_06b_esitlik_senkron tests/scenarios/coop/06b_esitlik_senkron.cjs "$C" 600 --players 2
k . 53_test_kipi tests/scenarios/53_test_kipi.js "$U" 600
k . 17_kamera_kararma tests/scenarios/17_kamera_kararma.js "$U" 700
k . 08_kalicilik tests/scenarios/08_kalicilik.js "$U" 400
k . 12_kayit_dongusu tests/scenarios/12_kayit_dongusu.js "$U" 400
k . 15_iskele_kamera tests/scenarios/15_iskele_kamera.js "$U" 400
k . 11_arayuz_sizinti tests/scenarios/11_arayuz_sizinti.js "$U" 400
export BOYUT_OZEL=960x540; k . 06_arayuz_960 tests/scenarios/06_arayuz_960.js "$U" 400; unset BOYUT_OZEL
k . 02_depolama_kapali tests/scenarios/02_depolama_kapali.js "$U" 400
k . 02_acilis_hatalari tests/scenarios/02_acilis_hatalari.js "$U" 700
k . 02_arazi_yedek_noworker tests/scenarios/02_arazi_yedek.js "$U?terrain=noworker" 500
k . 02_tek_dosya_b2duz tests/scenarios/02_tek_dosya.js "file:///tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2duz_dist/DenizKorsanlari-SonHazine.html" 300
echo "$(date -u +%T) ZINCIR3 BITTI" >> $DUR
