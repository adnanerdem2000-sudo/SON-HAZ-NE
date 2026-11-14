#!/bin/bash
# Kısaltılmış ikinci tur (kilit yoğunluğu nedeniyle): çevrimdışı + tek HTML'de 4 mevcut senaryo
R=/tmp/tasarim_y/faz9/rapor; H=/home/user/SON-HAZ-NE/tests/harness/run.cjs; S=/home/user/SON-HAZ-NE/tests/scenarios
SUM=$R/ozet.txt
one() { local name=$1; shift; local t0=$(date +%s); /home/user/devtools/tk "$@" > $R/$name.log 2>&1; local rc=$?; echo "$(date +%H:%M:%S) $name rc=$rc PASS=$(grep -c '^PASS' $R/$name.log) FAIL=$(grep -c '^FAIL' $R/$name.log) sure=$(( $(date +%s)-t0 ))s" >> $SUM; }
cd /home/user/SON-HAZ-NE
one cevrimdisi node /tmp/tasarim_y/faz9/cevrimdisi.cjs "file:///home/user/SON-HAZ-NE/dist/DenizKorsanlari-SonHazine.html?test=1" $R/cevrimdisi.json
for s in 00_acilis 08_kalicilik 05_dusman_ai 13_donma; do
  one tek_$s node $H $S/$s.js --url file:///home/user/SON-HAZ-NE/dist/DenizKorsanlari-SonHazine.html --size 640x360 --timeout 900 --report $R/tek_$s.json
done
echo BITTI2 >> $SUM
