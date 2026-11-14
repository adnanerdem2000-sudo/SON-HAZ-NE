#!/bin/bash
# v0.4 (44d548c) taban regresyon koşusu — tek tarayıcı, sıralı
cd /home/user/SON-HAZ-NE
OUT=docs/v05/taban_kosusu_44d548c
U=http://localhost:8080/index.html
CU="http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000"
SUM=$OUT/summary.txt; : > $SUM
one() { # ad, komut...
  local name=$1; shift; local t0=$(date +%s)
  "$@" > $OUT/$name.log 2>&1; local rc=$?
  local p=$(grep -c '^PASS' $OUT/$name.log); local f=$(grep -c '^FAIL' $OUT/$name.log)
  echo "$(date +%H:%M:%S) $name rc=$rc PASS=$p FAIL=$f sure=$(( $(date +%s)-t0 ))s" >> $SUM
}
for s in 00_acilis 02_arazi_yedek 02_arazi_kurtarma 03_fizik_dt 03_fizik_duzeltmeler 04_karakter 05_dusman_ai 07_dunya_kesif 07_ekonomi 08_kalicilik 11_arayuz_sizinti 12_kayit_dongusu 13_donma 14_deniz_ekipmani 15_iskele_kamera 16_kosu_poz_ganimet 17_kamera_kararma 09_performans; do
  one $s node tests/harness/run.cjs tests/scenarios/$s.js --url $U --size 640x360 --timeout 1800 --report $OUT/$s.json
done
one 06_arayuz_960 node tests/harness/run.cjs tests/scenarios/06_arayuz_960.js --url $U --size 960x540 --timeout 1800 --report $OUT/06_arayuz_960.json
one 02_tek_dosya node tests/harness/run.cjs tests/scenarios/02_tek_dosya.js --url file:///home/user/SON-HAZ-NE/dist/DenizKorsanlari-SonHazine.html --size 640x360 --timeout 1800 --report $OUT/02_tek_dosya.json
one coop_06b node tests/harness/coop.cjs tests/scenarios/coop/06b_esitlik_senkron.cjs --players 2 --size 640x360 --timeout 900 --url "$CU" --report $OUT/coop_06b.json
one coop_06d node tests/harness/coop.cjs tests/scenarios/coop/06d_ganimet_canta.cjs --players 2 --size 640x360 --timeout 900 --url "$CU" --report $OUT/coop_06d.json
one coop_06a node tests/harness/coop.cjs tests/scenarios/coop/06a_ag_guvenligi.cjs --players 3 --size 480x270 --timeout 900 --url "$CU" --report $OUT/coop_06a.json
one coop_06a2 node tests/harness/coop.cjs tests/scenarios/coop/06a2_mesaj_kopma.cjs --players 3 --size 480x270 --timeout 900 --url "$CU" --report $OUT/coop_06a2.json
one coop_06c node tests/harness/coop.cjs tests/scenarios/coop/06c_dort_oyuncu.cjs --players 4 --size 480x270 --timeout 1200 --url "$CU" --report $OUT/coop_06c.json
node /home/user/SON-HAZ-NE/tests/node/archipelago_sabit.mjs > $OUT/node_archipelago.log 2>&1; echo "$(date +%H:%M:%S) node_archipelago rc=$?" >> $SUM
echo BITTI >> $SUM
