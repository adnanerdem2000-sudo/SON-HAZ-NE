#!/bin/bash
# B2 düzeltme koşu zinciri 1 (sırayla, her biri tk kilidiyle)
K=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/kos.sh
DUR=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2duz_zincir.txt
k() { echo "$(date -u +%T) BASLA $*" >> $DUR; "$K" "$@" >> $DUR 2>&1; echo "$(date -u +%T) BITTI $2" >> $DUR; }
k once 02_uyanis_ortu_once tests/scenarios/02_uyanis_ortu.js 'http://localhost:8098/index.html' 600
k . 02_uyanis_ortu tests/scenarios/02_uyanis_ortu.js 'http://localhost:8085/index.html' 600
k . 02_hizli_yolculuk_noworker_1 tests/scenarios/02_hizli_yolculuk.js 'http://localhost:8085/index.html?terrain=noworker' 900
echo "$(date -u +%T) ZINCIR1 BITTI" >> $DUR
