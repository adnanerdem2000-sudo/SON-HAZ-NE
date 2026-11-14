#!/bin/bash
H=/home/user/SON-HAZ-NE/tests/harness; O=/tmp/tasarim_y/faz8; U=http://localhost:8080/index.html
/home/user/devtools/tk node $H/run.cjs $O/f8_taban3.js --url $U --size 640x360 --timeout 1500 --report $O/f8_taban3.json > $O/f8_taban3.log 2>&1; echo "$(date +%T) taban3 rc=$?" >> $O/zincir.txt
