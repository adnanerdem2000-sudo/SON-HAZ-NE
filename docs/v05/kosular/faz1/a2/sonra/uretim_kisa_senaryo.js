// Üretim kipi kısa denetimi (Faz 1 A2; kabul 5'in ilk yarısı, K-07). Bu dosya bir KOŞU GİRDİSİDİR (tests/ altında değildir).
// Yalnız --uretim ile koşulur: koşucu adrese test=1 EKLEMEZ ve 'U00 Üretimde test kancası yok' kontrolünü kendiliğinden ekler.
//   node tests/harness/run.cjs docs/v05/kosular/faz1/a2/sonra/uretim_kisa_senaryo.js --uretim --url <adres>
[
 {meta: {testler: [], sorunlar: ['KI-143 (K-07)'], dosyalar: ['js/main.js', 'js/core/testmode.js', 'js/core/surum.js'],
   aciklama: 'Test parametresiz açılış: window.DK yok, __ready true, __dkDurum().test === false, js/test/ istenmez'}},
 {js: `({ adres: location.href, durum: typeof window.__dkDurum === 'function' ? window.__dkDurum() : 'yok' })`},
 {expect: {js: `(()=>{
   const d = typeof window.__dkDurum === 'function' ? window.__dkDurum() : null;
   return { dk: typeof window.DK, hazir: window.__ready === true, test: d ? d.test : '__dkDurum yok', isaret: typeof window.__DK_TEST_KIPI, menu: !!document.getElementById('menu')?.classList.contains('active') };
 })()`, eq: {dk: 'undefined', hazir: true, test: false, isaret: 'undefined', menu: true},
   label: 'UK01 Test parametresiz açılış: DK yok, __ready true, __dkDurum().test === false, işaret yok, menü görünür'}},
 {agSay: {desen: '/js/test/', enCok: 0, label: 'UK02 js/test/ altından hiçbir dosya istenmedi'}},
]
