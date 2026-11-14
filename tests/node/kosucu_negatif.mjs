// Koşucu negatif testleri (Faz 9 tasarımı §6.3 tablosu, Y0/Y1; K-11, K-12, K-13).
//
//   /home/user/devtools/tk node tests/node/kosucu_negatif.mjs [--kosucu-dizin tests/harness] [--rapor <özet.json>]
//        [--cikti <ham rapor dizini>] [--sadece a,b,c] [--eski-kosucu]
//
// Küçük sabit sayfalar (tests/fixtures/kosucu/*.html) ve senaryolar (aynı dizin) ile tests/harness/run.cjs ve coop.cjs'i sınar.
// Sabit sayfalar bu betiğin açtığı yerel bir HTTP sunucusundan (127.0.0.1, rastgele kapı) sunulur; böylece 404 gerçek bir HTTP
// yanıtıdır. Tarayıcı açtığı için kilit sarmalayıcısıyla (tk) koşulur; koşucular sırayla, tek tek çalışır.
//
// Tasarım tablosu (çekirdek):
//   (a) console.error('x 404 y')          → KALDI          (e) izin listesindeki hata → GECTI
//   (b) olmayan bir görsel (404)          → KALDI (ağ)     (f) co-op ev() istisnası   → KALDI
//   (c) onaysız senaryo                   → KALDI          (g) kapatılmış sayfada tick → GECTI
//   (d) meta.olcum                        → OLCUM, çıkış 0
// Ek durumlar (yeni özellikler): e2 (--izin-hata), h/i/j (başlatma betiği olumlu/olumsuz/dosya), k (test=1 ve tür ölçümü),
// l/m/m2 (test kipi denetimi, --uretim ve U00), n/o (yeni adım türleri olumlu/olumsuz), s (yazım hatalı adım alanı),
// p/q/r (co-op başlatma, onaysız, konsol).
//
// A1 inceleme düzeltmeleri (Faz 1): t/t2 (zaman aşımı), u (sayfa hatası), v (bağlantı reddi), w (sözdizimi bozuk senaryo),
// x/x2/x3 (döngüsel ve BigInt dönüş değeri, yazılamayan rapor yolu: süreç asılı kalmaz), y1–y4 (onay adımı iç alan denetimi ve
// karşılaştırıcılar), z (tür ölçümü: rAF, doğrudan game.update, DK.sim, sayfanın kendi yeniden yüklemesi), ka (kanıt adımları),
// aa (co-op check()'e söz), ab/ac (son adımdan sonra gelen hata), ad/ae/af/ag/ag2/ah (izin listesi), ai (co-op aynı adla mk()).
//
// Rapor kuralı (A1-05): rapor beklenen bir durumda rapor yoksa durum KALIR ("rapor yazılmadı"): çıkış kodu tek başına yetmez,
// çünkü hiçbir şey yapmadan 1 ile çıkan bir koşucu KALDI beklenen her durumu geçerdi. Şema 1 raporu (eski koşucu) yalnız
// --eski-kosucu ile kabul edilir ve o zaman yalnız çıkış kodu denetlenir ("yalnız çıkış kodu" notu); bayraksız şema 1 de KALIR.
// Her durumda alt sürecin kendiliğinden bittiği (aracın süre sınırıyla öldürülmediği) de denetlenir.
// Betiğin kendisi: bütün durumlar beklendiği gibiyse çıkış 0 (GECTI), değilse 1 (KALDI).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AGAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SABIT = path.join(AGAC, 'tests', 'fixtures', 'kosucu');
const argv = process.argv.slice(2);
const sec = (ad, varsayilan) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : varsayilan; };
const KOSUCU_DIZIN = path.resolve(AGAC, sec('kosucu-dizin', 'tests/harness'));
const OZET = sec('rapor', null);
const CIKTI = path.resolve(AGAC, sec('cikti', path.join('tests', 'out', 'kosucu_negatif', new Date().toISOString().replace(/[:.]/g, '-'))));
const SADECE = sec('sadece', null)?.split(',').map((s) => s.trim());
const ESKI_KOSUCU = argv.includes('--eski-kosucu');
fs.mkdirSync(CIKTI, { recursive: true });

// ---- yerel sabit sayfa sunucusu
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };
const sunucu = http.createServer((req, res) => {
  const ad = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  const dosya = path.join(SABIT, ad);
  if (!dosya.startsWith(SABIT + path.sep) || !fs.existsSync(dosya) || !fs.statSync(dosya).isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('yok'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(dosya)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(dosya).pipe(res);
});
await new Promise((r) => sunucu.listen(0, '127.0.0.1', r));
const KOK = `http://127.0.0.1:${sunucu.address().port}`;

// ---- denetim yardımcıları (yalnız şema 2 raporlarında uygulanır)
const ESKI_RUN = ['scenario', 'url', 'size', 'steps', 'errors', 'pageErrors', 'fails', 'evalErrors', 'readyMs', 'ms'];
const ESKI_COOP = ['scenario', 'players', 'checks', 'errors', 'pageErrors', 'fails', 'ms'];
const ortakDenetim = (r, d) => {
  const eksik = (d.kosucu === 'coop' ? ESKI_COOP : ESKI_RUN).filter((k) => !(k in r));
  return [
    ['eski alanlar korunmuş', eksik.length === 0, eksik],
    ['sema dk-test-raporu/2', r.sema === 'dk-test-raporu/2', r.sema],
    ['ortam alanı (playwright, tarayıcı, GL)', !!(r.ortam && r.ortam.playwright && r.ortam.tarayici && 'gl' in r.ortam), r.ortam && { playwright: r.ortam.playwright, tarayici: r.ortam.tarayici }],
    ['tekrar.komut senaryoyu içeriyor', !!(r.tekrar && String(r.tekrar.komut).includes(path.basename(d.senaryo))), r.tekrar && r.tekrar.komut],
    ['sonuc.cikisKodu = süreç çıkış kodu', r.sonuc && r.sonuc.cikisKodu === d._cikis, r.sonuc && r.sonuc.cikisKodu],
  ];
};
const kontrol = (r, id) => (r.kontroller || []).find((k) => k.id === id);
const adim = (r, n) => (r.steps || []).find((s) => s.n === n) || {};
const say = (a) => (a || []).reduce((s, x) => s + (x.sayi || 1), 0);
const nedenVar = (r, re) => (r.sonuc?.neden || []).some((n) => re.test(n));
const dosyaVar = (p) => !!p && fs.existsSync(p) && fs.statSync(p).size > 0;

// ---- durumlar
const D = [
  // çekirdek (tasarım §6.3 tablosu)
  { ad: 'a', cekirdek: true, kosucu: 'run', aciklama: "console.error('x 404 y')", sayfa: 'a_konsol_404.html', senaryo: 'a_konsol_404.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['konsol hatası kaydedildi (izinsiz)', (r.hatalar?.konsol || []).some((k) => k.ileti.includes('x 404 y')), r.hatalar?.konsol],
                ['neden: izinsiz konsol hatası', nedenVar(r, /konsol/), r.sonuc?.neden]] },
  { ad: 'b', cekirdek: true, kosucu: 'run', aciklama: 'olmayan görsel isteği (HTTP 404)', sayfa: 'b_gorsel_404.html', senaryo: 'b_gorsel_404.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['ağ hatası: 404 olmayan-gorsel.png', (r.hatalar?.ag || []).some((a) => a.durum === 404 && /olmayan-gorsel\.png$/.test(a.url)), r.hatalar?.ag],
                ['"Failed to load resource" iletisi ağ kaydıyla tekilleşti (konsolda sayılmadı)', (r.hatalar?.konsol || []).length === 0 && r.hatalar?.konsolAgEslesen >= 1, { konsol: r.hatalar?.konsol, eslesen: r.hatalar?.konsolAgEslesen }],
                ['neden: izinsiz ağ hatası', nedenVar(r, /ağ/), r.sonuc?.neden]] },
  { ad: 'c', cekirdek: true, kosucu: 'run', aciklama: 'onaysız senaryo', sayfa: 'temiz.html', senaryo: 'c_onaysiz.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['neden: onay yok', nedenVar(r, /onay/), r.sonuc?.neden], ['onaySayisi 0', r.sonuc?.onaySayisi === 0, r.sonuc?.onaySayisi]] },
  { ad: 'd', cekirdek: true, kosucu: 'run', aciklama: 'meta.olcum (onaysız ölçüm)', sayfa: 'temiz.html', senaryo: 'd_olcum.js', cikis: 0, durum: 'OLCUM',
    ek: (r) => [['meta kaydedildi', r.meta?.olcum === true, r.meta], ['meta öğesi adım sayılmadı', r.steps.length === 1, r.steps.length]] },
  { ad: 'e', cekirdek: true, kosucu: 'run', aciklama: 'izin listesindeki hatalar (meta.izinliHatalar; metin + adres)', sayfa: 'e_izinli.html', senaryo: 'e_izinli.js', cikis: 0, durum: 'GECTI',
    ek: (r) => [['izinsiz konsol/ağ 0', (r.hatalar?.konsol || []).length === 0 && (r.hatalar?.ag || []).length === 0, { konsol: r.hatalar?.konsol, ag: r.hatalar?.ag }],
                ['konsol hatası izinli (metinle)', (r.hatalar?.konsolIzinli || []).some((k) => /beklenen-hata/.test(k.ileti)), r.hatalar?.konsolIzinli],
                ['404 izinli (adresle)', (r.hatalar?.agIzinli || []).some((a) => /izinli-eksik\.png$/.test(a.url) && a.durum === 404), r.hatalar?.agIzinli],
                ['izinler gerekçeli ve kullanıldı', (r.izinler || []).filter((z) => z.kaynak === 'meta').every((z) => z.gerekce && z.eslesme > 0), r.izinler]] },
  { ad: 'f', cekirdek: true, kosucu: 'coop', aciklama: 'co-op ev() istisnası', sayfa: 'coop.html', senaryo: 'f_coop_istisna.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['evalErrors: 1 (yapay istisna)', Array.isArray(r.evalErrors) && r.evalErrors.length === 1 && /yapay istisna/.test(r.evalErrors[0].hata), r.evalErrors],
                ['fails ≥ 1', r.fails >= 1, r.fails]] },
  { ad: 'g', cekirdek: true, kosucu: 'coop', aciklama: 'kapatılmış sayfada tick()', sayfa: 'coop.html', senaryo: 'g_coop_kapali.cjs', cikis: 0, durum: 'GECTI',
    ek: (r) => [['kapaliAtlama > 0', r.kapaliAtlama > 0, r.kapaliAtlama], ['evalErrors 0', Array.isArray(r.evalErrors) && r.evalErrors.length === 0, r.evalErrors],
                ['kapanan sekme kaydedildi', (r.kapananlar || []).some((k) => k.oyuncu === 'Tayfa'), r.kapananlar]] },
  // ek durumlar
  { ad: 'e2', kosucu: 'run', aciklama: 'izinler komut satırından (--izin-hata)', sayfa: 'e_izinli.html', senaryo: 'e2_izinli_cli.js', cikis: 0, durum: 'GECTI',
    arg: ['--izin-hata', 'beklenen-hata: kosucu_negatif # sabit sayfa kasıtlı basar', '--izin-hata', 'izinli-eksik\\.png$ # sabit sayfa kasıtlı ister'],
    ek: (r) => [['izinler cli kaynaklı ve gerekçeli', (r.izinler || []).filter((z) => z.kaynak === 'cli').length === 2 && (r.izinler || []).filter((z) => z.kaynak === 'cli').every((z) => z.gerekce && z.eslesme > 0), r.izinler]] },
  { ad: 'h', kosucu: 'run', aciklama: 'başlatma betiği (meta.baslatma) localStorage → SecurityError', sayfa: 'depolama.html', senaryo: 'h_baslatma.js', cikis: 0, durum: 'GECTI',
    ek: (r) => [['H01 geçti', kontrol(r, 'H01')?.ok === true, kontrol(r, 'H01')]] },
  { ad: 'i', kosucu: 'run', aciklama: 'aynı beklenti başlatma betiği olmadan (olumsuz kontrol) + ilk başarısızlık görüntüsü', sayfa: 'depolama.html', senaryo: 'i_baslatmasiz.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['H01 kaldı (değer ok)', kontrol(r, 'H01')?.ok === false && kontrol(r, 'H01')?.deger === 'ok', kontrol(r, 'H01')],
                ['ilk başarısız kontrolde ekran görüntüsü dosyası var', dosyaVar(kontrol(r, 'H01')?.goruntu?.sayfa), kontrol(r, 'H01')?.goruntu]] },
  { ad: 'j', kosucu: 'run', aciklama: 'başlatma betiği dosyadan (--baslatma)', sayfa: 'depolama.html', senaryo: 'i_baslatmasiz.js', cikis: 0, durum: 'GECTI',
    arg: ['--baslatma', 'tests/fixtures/kosucu/depolama_engelle.js'], ek: (r) => [['H01 geçti', kontrol(r, 'H01')?.ok === true, kontrol(r, 'H01')]] },
  { ad: 'k', kosucu: 'run', aciklama: 'test=1 kendiliğinden + parametre koruma + tür ölçümü', sayfa: 'temiz.html?a=1&b=x%20y', senaryo: 'k_test_param.js', cikis: 0, durum: 'GECTI',
    ek: (r) => [['K01/K02 tur = tarayici (sim yok)', kontrol(r, 'K01')?.tur === 'tarayici' && kontrol(r, 'K02')?.tur === 'tarayici', [kontrol(r, 'K01')?.tur, kontrol(r, 'K02')?.tur]],
                ['K03 tur = tarayici+benzetim (sim 1, adım 30)', kontrol(r, 'K03')?.tur === 'tarayici+benzetim' && kontrol(r, 'K03')?.benzetim?.sim === 1 && kontrol(r, 'K03')?.benzetim?.adim === 30, kontrol(r, 'K03')],
                ['hedef.url test=1 içeriyor', /[?&]test=1(&|#|$)/.test(r.hedef?.url || ''), r.hedef?.url], ['eski url alanı verilen adres', !/test=1/.test(r.url), r.url]] },
  { ad: 'l', kosucu: 'run', aciklama: 'test kipi istendi ama window.DK yok', sayfa: 'dk_yok.html', senaryo: 'l_dk_yok.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: test kipi açılmadı', /Test kipi açılmadı/.test(r.harnessError || ''), r.harnessError], ['adımlar koşmadı', r.steps.length === 0, r.steps.length]] },
  { ad: 'm', kosucu: 'run', aciklama: '--uretim: test parametresi yok, U00 geçer', sayfa: 'dk_yok.html', senaryo: 'm_uretim.js', cikis: 0, durum: 'GECTI', arg: ['--uretim'],
    ek: (r) => [['U00 geçti', kontrol(r, 'U00')?.ok === true, kontrol(r, 'U00')], ['hedef.url test içermiyor', !/[?&]test=/.test(r.hedef?.url || ''), r.hedef?.url]] },
  { ad: 'm2', kosucu: 'run', aciklama: '--uretim ama sayfada DK var: U00 kalır', sayfa: 'temiz.html', senaryo: 'm_uretim.js', cikis: 1, durum: 'KALDI', arg: ['--uretim'],
    ek: (r) => [['U00 kaldı', kontrol(r, 'U00')?.ok === false, kontrol(r, 'U00')]] },
  { ad: 'n', kosucu: 'run', aciklama: 'yeni adım türleri (olumlu)', sayfa: 'adimlar.html', senaryo: 'n_adimlar.js', cikis: 0, durum: 'GECTI',
    ek: (r) => [['N01–N08 hepsi geçti', ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08'].every((id) => kontrol(r, id)?.ok === true), (r.kontroller || []).map((k) => [k.id, k.ok])],
                ['beforeunload penceresi kabul edildi ve kaydedildi', (r.diyaloglar || []).some((x) => x.tur === 'beforeunload' && x.kabul === true), r.diyaloglar],
                ['adım hatası yok', r.evalErrors === 0, r.evalErrors]] },
  { ad: 'o', kosucu: 'run', aciklama: 'yeni adım türleri (olumsuz)', sayfa: 'adimlar.html', senaryo: 'o_adimlar_olumsuz.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['tikla (görünmez öğe) adım hatası', !!r.steps.find((s) => s.n === 1)?.error, r.steps.find((s) => s.n === 1)?.error],
                ['agSay sınır aşımı kaldı', kontrol(r, 'O02')?.ok === false, kontrol(r, 'O02')],
                ['metrikKarsilastir sınır aşımı kaldı', kontrol(r, 'O03')?.ok === false, kontrol(r, 'O03')],
                ['bekleSecici zaman aşımı adım hatası', !!r.steps.find((s) => s.n === 6)?.error, r.steps.find((s) => s.n === 6)?.error],
                ['sağlam kontrol geçti', kontrol(r, 'O05')?.ok === true, kontrol(r, 'O05')], ['evalErrors = 2', r.evalErrors === 2, r.evalErrors]] },
  { ad: 's', kosucu: 'run', aciklama: "yazım hatalı adım alanı ('expext')", sayfa: 'temiz.html', senaryo: 's_bilinmeyen_alan.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: bilinmeyen adım alanı expext', /bilinmeyen adım alanı expext/.test(r.harnessError || ''), r.harnessError], ['adımlar koşmadı', r.steps.length === 0, r.steps.length]] },
  { ad: 'p', kosucu: 'coop', aciklama: 'co-op başlatma betiği (meta.baslatma)', sayfa: 'coop.html', senaryo: 'p_coop_baslatma.cjs', cikis: 0, durum: 'GECTI',
    ek: (r) => [['P01 geçti', r.checks?.[0]?.ok === true, r.checks]] },
  { ad: 'q', kosucu: 'coop', aciklama: 'co-op onaysız senaryo', sayfa: 'coop.html', senaryo: 'q_coop_onaysiz.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['neden: onay yok', nedenVar(r, /onay/), r.sonuc?.neden]] },
  { ad: 'r', kosucu: 'coop', aciklama: 'co-op konsol hatası', sayfa: 'coop.html?hata=1', senaryo: 'r_coop_konsol.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['her iki oyuncunun konsol hatası kaydedildi', say((r.hatalar?.konsol || []).filter((k) => /coop sabit sayfa hatası/.test(k.ileti))) === 2 && new Set((r.hatalar?.konsol || []).map((k) => k.oyuncu)).size === 2, r.hatalar?.konsol],
                ['eski errors alanı oyuncu başına dolu', (r.errors?.Kaptan || []).length === 1 && (r.errors?.Tayfa || []).length === 1, r.errors]] },
  // A1 inceleme düzeltmeleri (Faz 1)
  { ad: 't', kosucu: 'run', aciklama: 'zaman aşımı: ZAMAN_ASIMI, rapor yazılır, kalan adım koşmaz', sayfa: 'temiz.html', senaryo: 't_zaman_asimi.js', cikis: 1, durum: 'ZAMAN_ASIMI', timeout: 3, enCokMs: 60000,
    ek: (r) => [['timeout alanı', r.timeout === true, r.timeout], ['T01 geçti, T02 koşmadı', kontrol(r, 'T01')?.ok === true && !kontrol(r, 'T02'), (r.kontroller || []).map((k) => k.id)]],
    gunluk: (g) => [['T02 için PASS basılmadı', !/PASS T02/.test(g), null]] },
  { ad: 't2', kosucu: 'coop', aciklama: 'co-op zaman aşımı: geç gelen kontrol sayılmaz', sayfa: 'coop.html', senaryo: 't2_coop_zaman_asimi.cjs', cikis: 1, durum: 'ZAMAN_ASIMI', timeout: 5, enCokMs: 60000,
    ek: (r) => [['yalnız T01 sayıldı', (r.checks || []).length === 1 && r.checks[0].label.startsWith('T01'), r.checks]],
    gunluk: (g) => [['T02 için PASS basılmadı', !/PASS T02/.test(g), null]] },
  { ad: 'u', kosucu: 'run', aciklama: 'yakalanmamış sayfa hatası (pageerror)', sayfa: 'u_sayfa_hatasi.html', senaryo: 'u_sayfa_hatasi.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['hatalar.sayfa: 1 (kosucu_negatif u)', (r.hatalar?.sayfa || []).length === 1 && /kosucu_negatif u/.test(r.hatalar.sayfa[0]), r.hatalar?.sayfa],
                ['neden: sayfa hatası', nedenVar(r, /pageerror/), r.sonuc?.neden], ['U01 geçti', kontrol(r, 'U01')?.ok === true, kontrol(r, 'U01')]] },
  { ad: 'v', kosucu: 'run', aciklama: 'bağlantı reddedildi (requestfailed, HTTP yanıtı yok)', sayfa: 'v_baglanti.html', senaryo: 'b_gorsel_404.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['ağ: başarısız istek kapali-kapi.png (ERR_CONNECTION_REFUSED)', (r.hatalar?.ag || []).some((a) => a.tur === 'basarisiz' && /kapali-kapi\.png$/.test(a.url) && /ERR_CONNECTION_REFUSED/.test(a.hata)), r.hatalar?.ag],
                ['konsol iletisi ağ kaydıyla tekilleşti', (r.hatalar?.konsol || []).length === 0, { konsol: r.hatalar?.konsol, eslesen: r.hatalar?.konsolAgEslesen }],
                ['neden: izinsiz ağ hatası', nedenVar(r, /ağ/), r.sonuc?.neden]] },
  { ad: 'w', kosucu: 'run', aciklama: 'sözdizimi bozuk senaryo', sayfa: 'temiz.html', senaryo: 'w_sozdizimi.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: sözdizimi', /Unexpected|SyntaxError/i.test(r.harnessError || ''), r.harnessError], ['adımlar koşmadı', r.steps.length === 0, r.steps.length]] },
  { ad: 'x', kosucu: 'run', aciklama: 'döngüsel ve BigInt js dönüş değerleri: rapor yazılır, süreç kendiliğinden biter', sayfa: 'temiz.html', senaryo: 'x_dongusel.js', cikis: 0, durum: 'GECTI', enCokMs: 60000,
    ek: (r) => [['döngü "[Döngüsel]" olarak yazıldı', adim(r, 2).result?.kendi === '[Döngüsel]' && adim(r, 2).result?.ad === 'dongusel', adim(r, 2)],
                ['BigInt "<sayı>n" olarak yazıldı', adim(r, 3).result === '1180591620717411303424n', adim(r, 3)],
                ['adım notu var, adım hatası yok', !!adim(r, 2).sonucNot && !adim(r, 2).error && r.evalErrors === 0, { not: adim(r, 2).sonucNot, hata: adim(r, 2).error, evalErrors: r.evalErrors }],
                ['X02 (döngüsel değer truthy) geçti', kontrol(r, 'X02')?.ok === true, kontrol(r, 'X02')]] },
  { ad: 'x2', kosucu: 'run', aciklama: 'yazılamayan --report yolu: süreç asılı kalmaz, çıkış 1', sayfa: 'temiz.html', senaryo: 'x_dongusel.js', cikis: 1, durum: null, raporYolu: '/dev/null/kosucu_negatif/x2.json', raporYok: true, enCokMs: 60000,
    gunluk: (g) => [['RAPOR YAZILAMADI satırı', /RAPOR YAZILAMADI/.test(g), null], ['SONUC: KOSUCU_HATASI (çıkış 1)', /SONUC: KOSUCU_HATASI \(çıkış 1\)/.test(g), null]] },
  { ad: 'x3', kosucu: 'coop', aciklama: 'co-op: yazılamayan --report yolu: süreç asılı kalmaz, çıkış 1', sayfa: 'coop.html', senaryo: 'p_coop_baslatma.cjs', cikis: 1, durum: null, raporYolu: '/dev/null/kosucu_negatif/x3.json', raporYok: true, enCokMs: 60000,
    gunluk: (g) => [['RAPOR YAZILAMADI satırı', /RAPOR YAZILAMADI/.test(g), null], ['SONUC: KOSUCU_HATASI (çıkış 1)', /SONUC: KOSUCU_HATASI \(çıkış 1\)/.test(g), null]] },
  { ad: 'y1', kosucu: 'run', aciklama: "expect'te yazım hatalı karşılaştırıcı ('truthly')", sayfa: 'temiz.html', senaryo: 'y1_expect_yabanci.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: bilinmeyen alan truthly', /bilinmeyen alan truthly/.test(r.harnessError || ''), r.harnessError], ['adımlar koşmadı', r.steps.length === 0, r.steps.length]] },
  { ad: 'y2', kosucu: 'run', aciklama: 'bütün karşılaştırıcılar uygulanır; gte/lte yalnız sonlu sayıyla', sayfa: 'temiz.html', senaryo: 'y2_expect_aralik.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['Y02 (−5, 1..10) kaldı', kontrol(r, 'Y02')?.ok === false, kontrol(r, 'Y02')], ['Y03 (null ≥ 0) kaldı', kontrol(r, 'Y03')?.ok === false && /sonlu bir sayı değil/.test(kontrol(r, 'Y03')?.hata || ''), kontrol(r, 'Y03')],
                ['Y04 ([] ≤ 5) kaldı', kontrol(r, 'Y04')?.ok === false, kontrol(r, 'Y04')], ['Y05 (5, 1..10) geçti', kontrol(r, 'Y05')?.ok === true, kontrol(r, 'Y05')]] },
  { ad: 'y3', kosucu: 'run', aciklama: 'karşılaştırıcısız expect', sayfa: 'temiz.html', senaryo: 'y3_karsilastiricisiz.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: karşılaştırıcı yok', /karşılaştırıcı yok/.test(r.harnessError || ''), r.harnessError]] },
  { ad: 'y4', kosucu: 'run', aciklama: 'sınırsız agSay', sayfa: 'temiz.html', senaryo: 'y4_agsay_sinirsiz.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: sınır yok', /sınır yok/.test(r.harnessError || ''), r.harnessError]] },
  { ad: 'z', kosucu: 'run', aciklama: 'tür ölçümü: rAF döngüsü, doğrudan game.update, DK.sim, sayfanın kendi yeniden yüklemesi', sayfa: 'z_tur.html', senaryo: 'z_tur.js', cikis: 0, durum: 'GECTI',
    ek: (r) => { const k = (id) => kontrol(r, id) || {}; const b = (id) => k(id).benzetim || {}; return [
      ['Z01 tarayici (rAF döngüsünün game.update çağrıları sayılmadı)', k('Z01').tur === 'tarayici' && b('Z01').update === 0, k('Z01')],
      ['Z02 tarayici+benzetim (doğrudan game.update: update 3, sim 0)', k('Z02').tur === 'tarayici+benzetim' && b('Z02').update === 3 && b('Z02').sim === 0, k('Z02')],
      ['Z03 tarayici+benzetim (sim 1, adım 30, update 0)', k('Z03').tur === 'tarayici+benzetim' && b('Z03').sim === 1 && b('Z03').adim === 30 && b('Z03').update === 0, k('Z03')],
      ['Z04 tarayici+benzetim (kendi yeniden yüklemesinden sonra sim 1, adım 60)', k('Z04').tur === 'tarayici+benzetim' && b('Z04').sim === 1 && b('Z04').adim === 60, k('Z04')]]; } },
  { ad: 'ka', kosucu: 'run', aciklama: 'kanıt adımları: sayfa istisnası ve data: olmayan dönüş adım hatası; dosya yazımı yalnız uyarı', sayfa: 'kanit.html', senaryo: 'ka_kanit.js', cikis: 1, durum: 'KALDI',
    ek: (r) => { const kd = (r.hatalar?.degerlendirme || []).filter((x) => x.kanit); return [
      ['snap, view, snapjs adım hatası', !!adim(r, 2).error && !!adim(r, 3).error && !!adim(r, 4).error, [adim(r, 2).error, adim(r, 3).error, adim(r, 4).error]],
      ['hatalar.degerlendirme: 3 kanıt hatası', kd.length === 3 && ['snap', 'view', 'snapjs'].every((t) => kd.some((x) => x.tur === t)), r.hatalar?.degerlendirme],
      ['evalErrors = 3', r.evalErrors === 3, r.evalErrors],
      ['yazılamayan dosya: adım hatası değil, kanıt uyarısı', !adim(r, 5).error && (r.kanitUyarilari || []).length === 1 && r.kanitUyarilari[0].n === 5, { adim: adim(r, 5), uyari: r.kanitUyarilari }]]; } },
  { ad: 'aa', kosucu: 'coop', aciklama: "co-op check()'e söz (await unutuldu)", sayfa: 'coop.html', senaryo: 'aa_coop_soz.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['AA01 kaldı (söz)', kontrol(r, 'AA01')?.ok === false && /söz/.test(kontrol(r, 'AA01')?.hata || ''), kontrol(r, 'AA01')], ['AA02 geçti', kontrol(r, 'AA02')?.ok === true, kontrol(r, 'AA02')]] },
  { ad: 'ab', kosucu: 'run', aciklama: 'son adımdan sonra gelen eşzamansız sayfa hatası (yerleşme)', sayfa: 'temiz.html', senaryo: 'ab_gec_hata.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['geç gelen sayfa hatası kaydedildi', (r.hatalar?.sayfa || []).some((x) => /kosucu_negatif ab/.test(x)), r.hatalar?.sayfa], ['yerleşme ≥ 1000 ms', r.sure?.yerlesmeMs >= 1000, r.sure]] },
  { ad: 'ac', kosucu: 'coop', aciklama: 'co-op: senaryodan sonra gelen eşzamansız sayfa hatası (yerleşme)', sayfa: 'coop.html', senaryo: 'ac_coop_gec_hata.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['geç gelen sayfa hatası (Kaptan)', (r.hatalar?.sayfa || []).some((x) => x.oyuncu === 'Kaptan' && /kosucu_negatif ac/.test(x.ileti)), r.hatalar?.sayfa], ['yerleşme ≥ 1000 ms', r.sure?.yerlesmeMs >= 1000, r.sure]] },
  { ad: 'ad', kosucu: 'run', aciklama: 'gerekçesiz izin (meta)', sayfa: 'a_konsol_404.html', senaryo: 'ad_izin_gerekcesiz.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: gerekçe zorunlu', /gerekçe zorunlu/.test(r.harnessError || ''), r.harnessError]] },
  { ad: 'ae', kosucu: 'run', aciklama: "her şeyle eşleşen izin deseni ('.*')", sayfa: 'a_konsol_404.html', senaryo: 'ae_izin_genis.js', cikis: 1, durum: 'KOSUCU_HATASI',
    ek: (r) => [['harnessError: boş dizgeyle eşleşiyor', /boş dizgeyle eşleşiyor/.test(r.harnessError || ''), r.harnessError]] },
  { ad: 'af', kosucu: 'run', aciklama: 'ağ için yazılmış izin, betiğin bastığı konsol hatasını (konum adresi) izinli yapmaz', sayfa: 'af_konum.html', senaryo: 'af_konum.js', cikis: 1, durum: 'KALDI',
    ek: (r) => [['betiğin hatası izinsiz', (r.hatalar?.konsol || []).some((k) => /betiğin bastığı gerçek hata/.test(k.ileti) && /af_betik\.js/.test(k.url || '')), r.hatalar?.konsol],
                ['af-eksik.png 404 izinli', (r.hatalar?.agIzinli || []).some((a) => a.durum === 404 && /af-eksik\.png$/.test(a.url)), r.hatalar?.agIzinli],
                ['konsolda izinli yok', (r.hatalar?.konsolIzinli || []).length === 0, r.hatalar?.konsolIzinli]] },
  { ad: 'ag', kosucu: 'run', aciklama: 'bozuk --izin-hata düzenli ifadesi: kullanım hatası (çıkış 2)', sayfa: 'temiz.html', senaryo: 'c_onaysiz.js', cikis: 2, durum: null, raporYok: true, enCokMs: 15000,
    arg: ['--izin-hata', '( # bozuk desen'], gunluk: (g) => [['ileti: geçersiz düzenli ifade', /geçersiz düzenli ifade/.test(g), null]] },
  { ad: 'ag2', kosucu: 'coop', aciklama: 'co-op: bozuk --izin-hata düzenli ifadesi: kullanım hatası (çıkış 2)', sayfa: 'coop.html', senaryo: 'q_coop_onaysiz.cjs', cikis: 2, durum: null, raporYok: true, enCokMs: 15000,
    arg: ['--izin-hata', '( # bozuk desen'], gunluk: (g) => [['ileti: geçersiz düzenli ifade', /geçersiz düzenli ifade/.test(g), null]] },
  { ad: 'ah', kosucu: 'run', aciklama: 'gerekçesiz --izin-hata: kullanım hatası (çıkış 2)', sayfa: 'a_konsol_404.html', senaryo: 'a_konsol_404.js', cikis: 2, durum: null, raporYok: true, enCokMs: 15000,
    arg: ['--izin-hata', 'x 404 y'], gunluk: (g) => [['ileti: gerekçe zorunlu', /gerekçe zorunlu/.test(g), null]] },
  { ad: 'ai', kosucu: 'coop', aciklama: 'co-op: aynı adla mk() ile yeniden katılım önceki sekmenin sayfa hatasını silmez', sayfa: 'coop.html', senaryo: 'ai_coop_yeniden.cjs', cikis: 1, durum: 'KALDI',
    ek: (r) => [['pageErrors.Tayfa: ilk sekmenin hatası', (r.pageErrors?.Tayfa || []).some((x) => /kosucu_negatif ai/.test(x)), r.pageErrors],
                ['yeni sekmenin anahtarı Tayfa#2', Array.isArray(r.pageErrors?.['Tayfa#2']), Object.keys(r.pageErrors || {})],
                ['hatalar.sayfa: oyuncu Tayfa', (r.hatalar?.sayfa || []).some((x) => x.oyuncu === 'Tayfa' && /kosucu_negatif ai/.test(x.ileti)), r.hatalar?.sayfa],
                ['AI01 geçti', kontrol(r, 'AI01')?.ok === true, kontrol(r, 'AI01')]] },
];

// ---- koşu
// Alt süreç eşzamansız başlatılır: sabit sayfa sunucusu bu süreçtedir ve spawnSync olay döngüsünü kilitleyip sayfaları yanıtsız bırakır.
const kos = (args, sureMs) => new Promise((coz) => {
  const c = spawn(process.execPath, args, { cwd: AGAC, env: process.env });
  let stdout = '', stderr = '', signal = null;
  c.stdout.on('data', (b) => { stdout += b; });
  c.stderr.on('data', (b) => { stderr += b; });
  const k = setTimeout(() => { signal = 'SIGKILL (araç süresi doldu)'; c.kill('SIGKILL'); }, sureMs);
  c.on('close', (status, sig) => { clearTimeout(k); coz({ status, signal: signal || sig, stdout, stderr }); });
});
const sonuclar = [];
for (const d of D) {
  if (SADECE && !SADECE.includes(d.ad)) continue;
  const kosucu = path.join(KOSUCU_DIZIN, d.kosucu === 'coop' ? 'coop.cjs' : 'run.cjs');
  const senaryo = path.join('tests', 'fixtures', 'kosucu', d.senaryo);
  const rapor = d.raporYolu || path.join(CIKTI, `${d.ad}.json`);
  const gunluk = path.join(CIKTI, `${d.ad}.log`);
  if (fs.existsSync(rapor)) fs.rmSync(rapor);
  const sure = String(d.timeout || (d.kosucu === 'coop' ? 120 : 90));
  const args = d.kosucu === 'coop'
    ? [kosucu, senaryo, '--players', '2', '--size', '320x200', '--timeout', sure, '--url', `${KOK}/${d.sayfa}`, '--report', rapor, ...(d.arg || [])]
    : [kosucu, senaryo, '--size', '320x200', '--timeout', sure, '--url', `${KOK}/${d.sayfa}`, '--report', rapor, ...(d.arg || [])];
  const t0 = Date.now();
  const p = await kos(args, 240000);
  const sureMs = Date.now() - t0;
  fs.writeFileSync(gunluk, `$ node ${args.join(' ')}\n${p.stdout || ''}${p.stderr ? '\n[stderr]\n' + p.stderr : ''}\n[çıkış ${p.status}${p.signal ? ' sinyal ' + p.signal : ''}]\n`);
  d._cikis = p.status;
  const raporVar = fs.existsSync(rapor);
  let r = null;
  try { r = JSON.parse(fs.readFileSync(rapor, 'utf8')); } catch (e) { r = null; }
  const sema2 = !!(r && r.sema === 'dk-test-raporu/2');
  const durum = sema2 ? r.sonuc?.durum : null;
  const denetimler = [['çıkış kodu', p.status === d.cikis, p.status], ['süreç kendiliğinden bitti (asılı kalmadı)', !p.signal, p.signal]];
  if (d.enCokMs) denetimler.push([`süre ≤ ${d.enCokMs} ms`, sureMs <= d.enCokMs, sureMs]);
  let yalnizCikis = false;
  if (d.raporYok) denetimler.push(['rapor yazılmadı (beklenen)', !raporVar, raporVar]);
  // (A1-05) rapor yoksa KALIR: hiçbir şey yapmadan 1 ile çıkan bir koşucu KALDI beklenen durumları çıkış koduyla geçmesin
  else if (!r) denetimler.push(['rapor yazıldı ve okunabildi', false, raporVar ? 'rapor okunamadı (JSON değil)' : 'rapor yazılmadı']);
  else if (!sema2) {
    if (ESKI_KOSUCU) yalnizCikis = true;   // eski koşucu (şema 1): yalnız çıkış kodu denetlenebilir
    else denetimler.push(['rapor şeması dk-test-raporu/2 (şema 1 yalnız --eski-kosucu ile)', false, r.sema || 'şema 1 (eski)']);
  } else {
    denetimler.push(['durum', durum === d.durum, durum]);
    for (const x of ortakDenetim(r, d)) denetimler.push(x);
    try { for (const x of (d.ek ? d.ek(r) : [])) denetimler.push(x); } catch (e) { denetimler.push(['ek denetim istisnası', false, String(e)]); }
  }
  try { for (const x of (d.gunluk ? d.gunluk(`${p.stdout || ''}\n${p.stderr || ''}`) : [])) denetimler.push(x); } catch (e) { denetimler.push(['günlük denetimi istisnası', false, String(e)]); }
  const tuttu = denetimler.every((x) => x[1]);
  const sonuc = tuttu ? (yalnizCikis ? 'GECTI (yalnız çıkış kodu; şema 1 raporunda durum yok, --eski-kosucu)' : 'GECTI') : 'KALDI';
  // eski koşucuda beklenen 1 iken 0 → koşucu hatayı yanlışlıkla geçirdi
  const yanlisGecis = p.status === 0 && d.cikis !== 0;
  sonuclar.push({ ad: d.ad, cekirdek: !!d.cekirdek, kosucu: d.kosucu, aciklama: d.aciklama, beklenen: { cikis: d.cikis, durum: d.durum, rapor: !d.raporYok },
    gercek: { cikis: p.status, sinyal: p.signal || null, durum, sema: r ? (r.sema || 'şema 1 (eski)') : 'rapor yok' }, sonuc, yanlisGecis,
    denetimler: denetimler.map(([ad, ok, deger]) => ({ ad, ok: !!ok, deger: ok ? undefined : deger })), rapor, gunluk, sureMs });
  console.log(`${tuttu ? (yalnizCikis ? 'PASS (yalnız çıkış kodu; şema 1)' : 'PASS') : 'FAIL'} (${d.ad}) ${d.aciklama}: beklenen çıkış ${d.cikis}/${d.durum ?? (d.raporYok ? 'rapor yok' : '-')}, gelen çıkış ${p.status}/${durum ?? (raporVar ? '-' : 'rapor yok')}` +
    `${yanlisGecis ? ' ← KOŞUCU YANLIŞLIKLA GEÇİRDİ' : ''}${!tuttu ? ' | kalan denetimler: ' + denetimler.filter((x) => !x[1]).map((x) => x[0]).join('; ') : ''}`);
}
sunucu.close();

const cekirdek = sonuclar.filter((s) => s.cekirdek);
const ozet = {
  arac: 'tests/node/kosucu_negatif.mjs', tarih: new Date().toISOString(), kosucuDizin: KOSUCU_DIZIN, ciktiDizin: CIKTI, eskiKosucuKipi: ESKI_KOSUCU,
  durum: sonuclar.every((s) => s.sonuc !== 'KALDI') ? 'GECTI' : 'KALDI',
  cekirdekKalan: cekirdek.filter((s) => s.sonuc === 'KALDI').map((s) => s.ad),
  yanlisGecenler: sonuclar.filter((s) => s.yanlisGecis).map((s) => s.ad),
  kalanlar: sonuclar.filter((s) => s.sonuc === 'KALDI').map((s) => s.ad),
  durumlar: sonuclar,
};
if (OZET) { fs.mkdirSync(path.dirname(path.resolve(OZET)), { recursive: true }); fs.writeFileSync(OZET, JSON.stringify(ozet, null, 1)); }
console.log(`\nkosucu_negatif: ${ozet.durum} — kalan: [${ozet.kalanlar.join(', ')}]; çekirdekte kalan: [${ozet.cekirdekKalan.join(', ')}]; ` +
  `koşucunun yanlışlıkla geçirdiği: [${ozet.yanlisGecenler.join(', ')}] (koşucu dizini ${path.relative(AGAC, KOSUCU_DIZIN) || '.'})`);
process.exit(ozet.durum === 'GECTI' ? 0 : 1);
