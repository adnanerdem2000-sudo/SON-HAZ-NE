// (t) Zaman aşımı (A1-05): koşu --timeout içinde ZAMAN_ASIMI ile biter, rapor yazılır, kalan adımlar koşmaz ve PASS basmaz.
[
 {expect: {js: `1`, eq: 1, label: 'T01 Zaman aşımından önceki kontrol'}},
 {wait: 20000},
 {expect: {js: `1`, eq: 1, label: 'T02 Zaman aşımından sonraki kontrol (koşmamalı)'}},
]
