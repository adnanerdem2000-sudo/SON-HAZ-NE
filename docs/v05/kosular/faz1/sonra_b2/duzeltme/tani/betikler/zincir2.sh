#!/bin/bash
# B2 düzeltme koşu zinciri 2 (sırayla, her biri tk kilidiyle; kos2.sh sunulan ağacın özetlerini yazar)
K=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/kos2.sh
DUR=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2duz_zincir.txt
U='http://localhost:8085/index.html'; C='http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000'
k() { echo "$(date -u +%T) BASLA $*" >> $DUR; "$K" "$@" >> $DUR 2>&1; echo "$(date -u +%T) BITTI $2" >> $DUR; }
k . 02_uyanis_ortu tests/scenarios/02_uyanis_ortu.js "$U" 600
k once 02_uyanis_ortu_once2 tests/scenarios/02_uyanis_ortu.js 'http://localhost:8098/index.html' 600
k . 02_hizli_yolculuk_noworker_2 tests/scenarios/02_hizli_yolculuk.js "$U?terrain=noworker" 900
k . 02_hizli_yolculuk_noworker_3 tests/scenarios/02_hizli_yolculuk.js "$U?terrain=noworker" 900
k . 02_hizli_yolculuk_normal tests/scenarios/02_hizli_yolculuk.js "$U" 900
k . coop_02_hizli_yolculuk_konuk tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs "$C" 600 --players 2
k . 16_kosu_poz_ganimet tests/scenarios/16_kosu_poz_ganimet.js "$U" 500
k . 00_acilis tests/scenarios/00_acilis.js "$U" 400
k . 02_yukleme_bekleme tests/scenarios/02_yukleme_bekleme.js "$U" 400
k . 02_acilis_akisi tests/scenarios/02_acilis_akisi.js "$U" 500
k tani tani_timeout docs/v05/kosular/faz1/sonra_b2/tani/betikler/tani_timeout.js "$U" 440
k tani denetci_tani_b2_denetim /tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/faz1b_b2_denetim/kopya/tests/tani_b2_denetim.js "$U" 700
echo "$(date -u +%T) ZINCIR2 BITTI" >> $DUR
