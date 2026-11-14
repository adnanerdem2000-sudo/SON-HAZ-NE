// (y2) Karşılaştırıcıların hepsi uygulanmalı ve gte/lte yalnız sonlu sayıyla geçmeli (A1-04). Eskiden gte+lte'de yalnız lte
// uygulanıyor, null >= 0 ve [] <= 5 (JS zorlaması) geçiyordu. Beklenen: KALDI (Y02, Y03, Y04 kalır; Y05 geçer).
[
 {expect: {js: `-5`, gte: 1, lte: 10, label: 'Y02 Değer 1..10 aralığında (−5 dönüyor)'}},
 {expect: {js: `null`, gte: 0, label: 'Y03 Değer ≥ 0 (null dönüyor)'}},
 {expect: {js: `[]`, lte: 5, label: 'Y04 Değer ≤ 5 (boş dizi dönüyor)'}},
 {expect: {js: `5`, gte: 1, lte: 10, label: 'Y05 Değer 1..10 aralığında (5 dönüyor)'}},
]
