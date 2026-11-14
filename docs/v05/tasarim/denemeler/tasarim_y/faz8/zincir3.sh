#!/bin/bash
H=/home/user/SON-HAZ-NE/tests/harness; O=/tmp/tasarim_y/faz8; U=http://localhost:8080/index.html
/home/user/devtools/tk node $H/run.cjs $O/f8_taban4.js --url $U --size 640x360 --timeout 1200 --report $O/f8_taban4.json > $O/f8_taban4.log 2>&1; echo "$(date +%T) taban4 rc=$?" >> $O/zincir.txt
