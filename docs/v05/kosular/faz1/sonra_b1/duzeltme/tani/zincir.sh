#!/bin/bash
# B1 düzeltici tarayıcı zinciri: her koşu ayrı tk kilidiyle, sırayla (aynı anda tek tarayıcı). Ağaç: /home/user/SON-HAZ-NE-b1 (8084).
# Kullanım: zincir.sh <adım-listesi dosyası>   (her satır: ad<TAB>senaryo<TAB>url<TAB>tk-süre<TAB>koşucu-süre<TAB>ek argümanlar)
R=/home/user/SON-HAZ-NE-b1/docs/v05/kosular/faz1/sonra_b1/duzeltme
P=/tmp/claude-0/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/scratchpad/faz1b_b1_duzeltme_ilerleme.md
LISTE="$1"
cd /home/user/SON-HAZ-NE-b1 || exit 2
while IFS=$'\t' read -r ad sen url tks kos ek; do
  [ -z "$ad" ] && continue
  case "$ad" in \#*) continue;; esac
  rapor="$R/$ad.json"; log="$R/$ad.log"
  echo "- [koşu başladı $(date -u +%H:%M)] $ad" >> "$P"
  if [ -n "$ek" ]; then
    eval "set -- $ek"
    /home/user/devtools/tk timeout "$tks" node tests/harness/run.cjs "$sen" --url "$url" --size 640x360 --timeout "$kos" --report "$rapor" "$@" < /dev/null > "$log" 2>&1
  else
    /home/user/devtools/tk timeout "$tks" node tests/harness/run.cjs "$sen" --url "$url" --size 640x360 --timeout "$kos" --report "$rapor" < /dev/null > "$log" 2>&1
  fi
  c=$?
  son=$(grep -E '^SONUC' "$log" | tail -1)
  ozet=$(python3 - "$rapor" <<'EOF'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    k = d.get('kontroller') or []
    g = sum(1 for x in k if x.get('ok'))
    kal = [x.get('id') or x.get('etiket', '')[:12] for x in k if not x.get('ok')]
    print(f"{'GECTI' if d.get('sonuc', {}).get('durum') == 'GECTI' or (not kal and d.get('fails') == 0) else 'KALDI'} | {g}/{len(k)} | kalan: {', '.join(map(str, kal)) if kal else '-'}")
except Exception as e:
    print(f"RAPOR YOK | - | {e}")
EOF
)
  komut="/home/user/devtools/tk timeout $tks node tests/harness/run.cjs $sen --url '$url' --size 640x360 --timeout $kos --report $rapor${ek:+ $ek}"
  echo "$ad | $ozet | çıkış $c | $komut" >> "$R/ozet.txt"
  echo "- [koşu bitti $(date -u +%H:%M)] $ad çıkış $c: $son" >> "$P"
done < "$LISTE"
echo "- [zincir bitti $(date -u +%H:%M)] $LISTE" >> "$P"
