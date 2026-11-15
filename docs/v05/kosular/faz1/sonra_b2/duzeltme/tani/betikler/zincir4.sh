#!/bin/bash
# B2 düzeltme koşu zinciri 4: co-op örtü tanısının ortamdan bağımsız ikinci sürümü (sonra + önce)
K=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/kos2.sh
DUR=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2duz_zincir.txt
T=/home/user/SON-HAZ-NE-b2/docs/v05/kosular/faz1/sonra_b2/duzeltme/tani/betikler/tani_coop_ortu.cjs
k() { echo "$(date -u +%T) BASLA $*" >> $DUR; "$K" "$@" >> $DUR 2>&1; echo "$(date -u +%T) BITTI $2" >> $DUR; }
k tani tani_coop_ortu $T 'http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000' 400 --players 2
k once tani_coop_ortu_once $T 'http://localhost:8098/index.html?peerhost=127.0.0.1&peerport=9000' 400 --players 2
echo "$(date -u +%T) ZINCIR4 BITTI" >> $DUR
