#!/bin/bash
# Faz 9 inceleme ölçümü: gizli 404 / konsol hatası var mı (v0.4, 8080, değiştirilmemiş senaryolar)
D=/tmp/tasarim_y/faz9_inceleme
S=/home/user/SON-HAZ-NE/tests/scenarios
export NODE_PATH=/usr/local/lib/node_modules_global
one() { local ad=$1; shift; local t0=$(date +%s); /home/user/devtools/tk node $D/run_tam_kayit.cjs "$@" --size 640x360 --timeout 900 --report $D/$ad.json > $D/$ad.log 2>&1; echo "$(date +%H:%M:%S) $ad rc=$? PASS=$(grep -c '^PASS' $D/$ad.log) FAIL=$(grep -c '^FAIL' $D/$ad.log) sure=$(( $(date +%s)-t0 ))s" >> $D/ozet.txt; }
: > $D/ozet.txt
one acilis_normal $S/00_acilis.js --url http://localhost:8080/index.html
one yedek_badurl $S/02_arazi_yedek.js --url "http://localhost:8080/index.html?terrain=badurl"
one kalicilik $S/08_kalicilik.js --url http://localhost:8080/index.html
echo BITTI >> $D/ozet.txt
