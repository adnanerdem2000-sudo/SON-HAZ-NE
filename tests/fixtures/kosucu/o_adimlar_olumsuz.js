// (o) Yeni adım türlerinin olumsuz denemesi: her biri ayrı ayrı başarısızlık üretmeli; sonuç KALDI.
[
 {tikla: {secici: '#gizli', zaman: 1500}},
 {agSay: {desen: 'adimlar\\.html', enCok: 0, label: 'O02 agSay sınırı aşıldı (ana sayfa 1 kez istendi)'}},
 {metrics: 'm1'},
 {metrics: 'm2'},
 {metrikKarsilastir: {once: 'm1', sonra: 'm2', alan: 'nodes', enCokFark: -1, label: 'O03 metrikKarsilastir sınırı aşıldı'}},
 {bekleSecici: {secici: '#hic-yok', zaman: 1000}},
 {expect: {js: `1`, eq: 1, label: 'O05 Sağlam kontrol'}},
]
