#!/bin/bash
# Faz 9 tasarımı için tarayıcı ölçümleri (salt-okur; v0.4 ağacı ve /tmp kopyaları). Her koşu kilit sarmalayıcısıyla sıralı.
R=/tmp/tasarim_y/faz9/rapor; H=/home/user/SON-HAZ-NE/tests/harness/run.cjs; S=/home/user/SON-HAZ-NE/tests/scenarios
SUM=$R/ozet.txt; : > $SUM
one() { local name=$1; shift; local t0=$(date +%s); /home/user/devtools/tk "$@" > $R/$name.log 2>&1; local rc=$?; echo "$(date +%H:%M:%S) $name rc=$rc PASS=$(grep -c '^PASS' $R/$name.log) FAIL=$(grep -c '^FAIL' $R/$name.log) sure=$(( $(date +%s)-t0 ))s" >> $SUM; }
cd /home/user/SON-HAZ-NE
one k09_eski_assets node $H $S/02_tek_dosya.js --url file:///tmp/tasarim_y/faz9/k09/assets/eski.html --size 640x360 --timeout 900 --report $R/k09_eski_assets.json
one k09_yeni_assets node $H $S/02_tek_dosya.js --url file:///tmp/tasarim_y/faz9/k09/assets/yeni.html --size 640x360 --timeout 900 --report $R/k09_yeni_assets.json
one k09_yeni_gameassets_q node $H $S/02_tek_dosya.js --url "file:///tmp/tasarim_y/faz9/k09/game-assets/yeni.html?test=1" --size 640x360 --timeout 900 --report $R/k09_yeni_gameassets_q.json
one blob_http node $H $S/02_tek_dosya.js --url http://localhost:8080/dist/DenizKorsanlari-SonHazine.html --size 640x360 --timeout 900 --report $R/blob_http.json
one cevrimdisi node /tmp/tasarim_y/faz9/cevrimdisi.cjs "file:///home/user/SON-HAZ-NE/dist/DenizKorsanlari-SonHazine.html?test=1" $R/cevrimdisi.json
for s in 00_acilis 02_arazi_kurtarma 03_fizik_duzeltmeler 04_karakter 05_dusman_ai 08_kalicilik 12_kayit_dongusu 13_donma; do
  one tek_$s node $H $S/$s.js --url file:///home/user/SON-HAZ-NE/dist/DenizKorsanlari-SonHazine.html --size 640x360 --timeout 900 --report $R/tek_$s.json
done
echo BITTI >> $SUM
