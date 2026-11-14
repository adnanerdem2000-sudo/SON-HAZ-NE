#!/bin/bash
# Tek sayfalık senaryoda Chromium süreç ağacının toplam RSS'ini 2 sn arayla örnekler (kilit içinde)
D=/tmp/tasarim_y/faz9_inceleme
export NODE_PATH=/usr/local/lib/node_modules_global
node $D/run_tam_kayit.cjs /home/user/SON-HAZ-NE/tests/scenarios/$1.js --url http://localhost:8080/index.html --size 640x360 --timeout 600 --report $D/bellek_$1.json > $D/bellek_$1.log 2>&1 &
P=$!
max=0
while kill -0 $P 2>/dev/null; do
  pids=$(pstree -p $P 2>/dev/null | grep -o '([0-9]\+)' | tr -d '()' | tr '\n' ',' | sed 's/,$//')
  if [ -n "$pids" ]; then s=$(ps -o rss= -p $pids 2>/dev/null | awk '{t+=$1} END {print int(t/1024)}'); [ "$s" -gt "$max" ] && max=$s; echo "$(date +%s) $s" >> $D/bellek_$1.txt; fi
  sleep 2
done
echo "EN_COK_RSS_MB=$max" >> $D/bellek_$1.txt
