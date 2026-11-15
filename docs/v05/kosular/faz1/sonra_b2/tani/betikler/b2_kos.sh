#!/bin/bash
# B2 "sonra" koşusu: b2 ağacından, tarayıcı kilidiyle (tk; süre sınırı kilit alındıktan sonra işler).
# Kullanım: b2_kos.sh <ad> <senaryo> <url> <sure_sn> [ek koşucu seçenekleri…]
# Çıktı: docs/v05/kosular/faz1/sonra_b2/<ad>.{log,json}; ozet.txt'ye bir satır (komut, sonuç, kontrol sayısı).
AGAC=/home/user/SON-HAZ-NE-b2; OUT=$AGAC/docs/v05/kosular/faz1/sonra_b2
AD=$1; SEN=$2; URL=$3; SN=$4; shift 4
cd "$AGAC"; mkdir -p "$OUT"
if [[ "$SEN" == *coop/* ]]; then KOSUCU=tests/harness/coop.cjs; else KOSUCU=tests/harness/run.cjs; fi
KOMUT="/home/user/devtools/tk timeout $((SN+60)) node $KOSUCU $SEN --url '$URL' --size 640x360 --timeout $SN --report $OUT/$AD.json $*"
{
  echo "# $(date -u +%FT%TZ) b2 ağacı $(git rev-parse --short HEAD)+çalışma kopyası; koşucu $(sha256sum $KOSUCU | cut -c1-8) ortak.cjs $(sha256sum tests/harness/ortak.cjs | cut -c1-8); senaryo $SEN $(sha256sum $SEN | cut -c1-12)"
  echo "# komut: $KOMUT"
} > "$OUT/$AD.log"
T0=$(date +%s)
/home/user/devtools/tk timeout $((SN+60)) node $KOSUCU "$SEN" --url "$URL" --size 640x360 --timeout "$SN" --report "$OUT/$AD.json" "$@" >> "$OUT/$AD.log" 2>&1
RC=$?
echo "# çıkış $RC $(date -u +%FT%TZ)" >> "$OUT/$AD.log"
P=$(grep -c "^PASS" "$OUT/$AD.log"); F=$(grep -c "^FAIL" "$OUT/$AD.log")
S=$(grep -m1 "SONUC:" "$OUT/$AD.log" | cut -c1-260)
echo "$(date -u +%T) $AD | komut: $KOMUT | PASS=$P FAIL=$F | ${S:-SONUC YOK (çıkış $RC)}" >> "$OUT/ozet.txt"
echo "$AD: PASS=$P FAIL=$F | $S"
