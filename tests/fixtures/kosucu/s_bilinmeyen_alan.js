// (s) Yazım hatalı adım alanı ('expext'): eski koşucu onu sessizce atlıyor, ikinci kontrol hiç koşmadan senaryo geçiyordu.
// Beklenen: KOSUCU_HATASI (adımlar koşmadan).
[
 {expect: {js: `1`, eq: 1, label: 'S01 Sağlam kontrol'}},
 {expext: {js: `1`, eq: 2, label: 'S02 Yazım hatalı kontrol (koşmamalı, fark edilmeli)'}},
]
