#!/bin/bash
# FAZ 8 ölçüm zinciri (sırayla; her biri tarayıcı kilidini kendisi alır)
H=/home/user/SON-HAZ-NE/tests/harness
O=/tmp/tasarim_y/faz8
U=http://localhost:8080/index.html
cd /home/user/SON-HAZ-NE
echo "$(date +%T) basla" >> $O/zincir.txt
/home/user/devtools/tk node $H/run.cjs $O/f8_taban2.js --url $U --size 640x360 --timeout 1700 --report $O/f8_taban2.json > $O/f8_taban2.log 2>&1; echo "$(date +%T) taban2 rc=$?" >> $O/zincir.txt
/home/user/devtools/tk node $H/run.cjs $O/f8_kalite.js --url $U --size 640x360 --timeout 1500 --report $O/f8_kalite.json > $O/f8_kalite.log 2>&1; echo "$(date +%T) kalite rc=$?" >> $O/zincir.txt
DK_JSFLAGS=--expose-gc /home/user/devtools/tk node $H/run.cjs /home/user/SON-HAZ-NE/tests/scenarios/10_uzun_oturum.js --url $U --size 640x360 --timeout 1480 --report $O/10_uzun_oturum.json > $O/10_uzun_oturum.log 2>&1; echo "$(date +%T) uzun rc=$?" >> $O/zincir.txt
/home/user/devtools/tk node $H/coop.cjs $O/f8_coop4.cjs --players 4 --size 480x270 --timeout 1100 --url "$U?peerhost=127.0.0.1&peerport=9000" --report $O/f8_coop4.json > $O/f8_coop4.log 2>&1; echo "$(date +%T) coop4 rc=$?" >> $O/zincir.txt
/home/user/devtools/tk node $H/run.cjs $O/f8_09tani.js --url $U --size 640x360 --timeout 1200 --report $O/f8_09tani_2.json > $O/f8_09tani_2.log 2>&1; echo "$(date +%T) 09tani2 rc=$?" >> $O/zincir.txt
for i in 1 2 3; do /home/user/devtools/tk node $H/run.cjs /home/user/SON-HAZ-NE/tests/scenarios/09_performans.js --url $U --size 640x360 --timeout 900 --report $O/09_orijinal_$i.json > $O/09_orijinal_$i.log 2>&1; echo "$(date +%T) 09orj$i rc=$?" >> $O/zincir.txt; done
echo "$(date +%T) BITTI" >> $O/zincir.txt
