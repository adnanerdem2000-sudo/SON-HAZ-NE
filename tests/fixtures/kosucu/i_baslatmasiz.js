// (i) Başlatma betiği olmadan aynı beklenti: localStorage çalışır, kontrol KALMALI (h'nin gerçekten başlatma betiğine bağlı olduğunun
// kanıtı). --baslatma depolama_engelle.js ile koşulunca (j) aynı senaryo GECTI olmalı.
[
 {expect: {js: `window.__depolama`, eq: 'SecurityError', label: 'H01 Sayfa yüklenirken localStorage SecurityError attı'}},
]
