#!/bin/bash
# B2 düzeltme koşusu: b2 ağacından, tarayıcı kilidiyle (tk; süre sınırı kilit alındıktan sonra işler).
# Kullanım: kos.sh <alt_dizin|.> <ad> <senaryo> <url> <sure_sn> [ek koşucu seçenekleri…]
# Çıktı: docs/v05/kosular/faz1/sonra_b2/duzeltme/<alt_dizin>/<ad>.{log,json}; duzeltme/ozet.txt'ye bir satır.
AGAC=/home/user/SON-HAZ-NE-b2; KOK=$AGAC/docs/v05/kosular/faz1/sonra_b2/duzeltme
ALT=$1; AD=$2; SEN=$3; URL=$4; SN=$5; shift 5
OUT=$KOK/$ALT; cd "$AGAC"; mkdir -p "$OUT"
if [[ "$SEN" == *coop/* || "$SEN" == *.cjs ]]; then KOSUCU=tests/harness/coop.cjs; else KOSUCU=tests/harness/run.cjs; fi
BOYUT=640x360; for a in "$@"; do :; done
KOMUT="/home/user/devtools/tk timeout $((SN+60)) node $KOSUCU $SEN --url '$URL' --size ${BOYUT_OZEL:-$BOYUT} --timeout $SN --report $OUT/$AD.json $*"
{
  echo "# $(date -u +%FT%TZ) b2 ağacı $(git rev-parse --short HEAD)+çalışma kopyası; koşucu $(sha256sum $KOSUCU | cut -c1-8) ortak.cjs $(sha256sum tests/harness/ortak.cjs | cut -c1-8); senaryo $SEN $(sha256sum $SEN | cut -c1-12)"
  echo "# oyun: main.js $(sha256sum js/main.js | cut -c1-8) game.js $(sha256sum js/game/game.js | cut -c1-8) engine.js $(sha256sum js/core/engine.js | cut -c1-8) input.js $(sha256sum js/core/input.js | cut -c1-8)"
  echo "# komut: $KOMUT"
} > "$OUT/$AD.log"
/home/user/devtools/tk timeout $((SN+60)) node $KOSUCU "$SEN" --url "$URL" --size "${BOYUT_OZEL:-$BOYUT}" --timeout "$SN" --report "$OUT/$AD.json" "$@" >> "$OUT/$AD.log" 2>&1
RC=$?
echo "# çıkış $RC $(date -u +%FT%TZ)" >> "$OUT/$AD.log"
P=$(grep -c "^PASS" "$OUT/$AD.log"); F=$(grep -c "^FAIL" "$OUT/$AD.log")
S=$(grep -m1 "SONUC:" "$OUT/$AD.log" | cut -c1-260)
echo "$(date -u +%T) $ALT/$AD | komut: $KOMUT | PASS=$P FAIL=$F | ${S:-SONUC YOK (çıkış $RC)}" >> "$KOK/ozet.txt"
echo "$ALT/$AD: PASS=$P FAIL=$F | $S"
