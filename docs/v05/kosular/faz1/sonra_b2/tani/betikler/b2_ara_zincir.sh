#!/bin/bash
# B2 ara doğrulama zinciri (sıralı; her koşu tk kilidini ayrı alır). Çıktı: sonra_b2/ara ve sonra_b2/tani
cd /home/user/SON-HAZ-NE-b2
A=docs/v05/kosular/faz1/sonra_b2/ara; T=docs/v05/kosular/faz1/sonra_b2/tani; S=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/b2_tani
/home/user/devtools/tk timeout 560 node tests/harness/run.cjs tests/scenarios/02_acilis_akisi.js --url 'http://localhost:8085/index.html' --size 640x360 --timeout 500 --report $A/02_acilis_akisi_ara4.json > $A/02_acilis_akisi_ara4.log 2>&1; echo "akisi $?"
/home/user/devtools/tk timeout 660 node tests/harness/coop.cjs tests/scenarios/coop/02_hizli_yolculuk_konuk.cjs --players 2 --size 640x360 --timeout 600 --url 'http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000' --report $A/coop_02_hizli_yolculuk_konuk_ara4.json > $A/coop_02_hizli_yolculuk_konuk_ara4.log 2>&1; echo "konuk $?"
/home/user/devtools/tk timeout 500 node tests/harness/run.cjs $S/tani_timeout.js --url 'http://localhost:8085/index.html' --size 640x360 --timeout 440 --report $T/tani_timeout.json > $T/tani_timeout.log 2>&1; echo "timeout $?"
/home/user/devtools/tk timeout 560 node tests/harness/coop.cjs $S/tani_konuk_timeout.cjs --players 2 --size 640x360 --timeout 500 --url 'http://localhost:8085/index.html?peerhost=127.0.0.1&peerport=9000' --report $T/tani_konuk_timeout.json > $T/tani_konuk_timeout.log 2>&1; echo "konuk_timeout $?"
echo ZINCIR_BITTI
