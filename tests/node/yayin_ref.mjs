// Yayın işinde ref koruması denetimi (Faz 9 tasarımı Y9a, K9-16; K-03). Tarayıcı açmaz, GitHub'a bağlanmaz, iş akışı tetiklemez.
//
//   node tests/node/yayin_ref.mjs [--dosya .github/workflows/pages.yml] [--taban 44d548c] [--rapor <özet.json>]
//
// v0.5 dalındaki bugünkü pages.yml'de elle tetiklemeye (workflow_dispatch) karşı ref koruması yoktu: herhangi bir dal elle
// canlıya yayınlanabiliyordu ve süren bir yayın cancel-in-progress: true ile iptal edilebiliyordu. Y9a bu dosyaya yalnız üç
// değişiklik getirir; tam yeniden yazım (§2.10) Y9'dadır ve o zaman bu denetimin yerini tests/node/yayin_politikasi.mjs alır.
//   YR1 tetikleyiciler değişmedi: push (main, master, claude/hopeful-cray-o1jw6w) ve workflow_dispatch
//   YR2 iş listesi değişmedi: check, deploy
//   YR3 deploy.if = mevcut koşul && github.ref == 'refs/heads/claude/hopeful-cray-o1jw6w' (ifade düzeyi; || yok)
//   YR4 deploy'un İLK adımı GITHUB_REF'i kabukta yeniden denetler: adımın run betiği bash'te gerçekten koşturulur; doğru ref'te
//       çıkış 0, başka ref'lerde çıkış 1 ve ::error:: iletisi. Adımda if/continue-on-error yok, betikte ${{ }} yok. Yanlış ref'ler
//       yayın dalının harf varyantlarını da içerir (A2-G-03): GitHub ifadelerinde == harfe duyarsızdır, deploy.if böyle bir dalı da
//       kabul eder; yayını yalnız harfe duyarlı kabuk denetimi durdurur.
//   YR4b öz-sınama: kabuk denetimini harfe duyarsız yapan iki bozulmuş betik (${GITHUB_REF,,}; shopt -s nocasematch) YR4'ün ref
//       listesiyle yakalanmalı (A2 güvenlik incelemesinin R1, R2 mutantları; bunlar eskiden 8/8 GEÇTİ alıyordu).
//   YR5 concurrency.cancel-in-progress: false (grup 'pages' değişmedi)
//   YR6 deploy'un geri kalanı değişmedi: needs check, github-pages ortamı, checkout → … → deploy-pages adımları
//   YR7 taban (44d548c) ile satır farkı yalnız bu üç değişiklik (git yoksa ATLANDI olarak yazılır; sayılmaz)
// YAML, bağımlılıksız küçük bir blok YAML ayrıştırıcısıyla okunur (bu dosyanın kullandığı alt küme: blok eşlem ve dizileri,
// düz/tırnaklı skalerler, tek satırlık akış dizisi, | blok skaleri, yorumlar). Desteklenmeyen bir yapı görülürse denetim KALIR.
// Çıkış: hepsi geçerse 0 (GECTI), değilse 1 (KALDI); kullanım hatası 2.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const sec = (ad, varsayilan) => { const i = argv.indexOf('--' + ad); return i >= 0 ? argv[i + 1] : varsayilan; };
const bilinen = new Set(['--dosya', '--taban', '--rapor']);
for (let i = 0; i < argv.length; i += 2) if (!bilinen.has(argv[i]) || argv[i + 1] === undefined) { console.error('Kullanım: node tests/node/yayin_ref.mjs [--dosya <pages.yml>] [--taban 44d548c] [--rapor <özet.json>]'); process.exit(2); }
const AGAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSYA = path.resolve(AGAC, sec('dosya', '.github/workflows/pages.yml'));
const TABAN = sec('taban', '44d548c');
const RAPOR = sec('rapor', null);
const YAYIN_DALI = 'claude/hopeful-cray-o1jw6w';
const ESKI_KOSUL = "needs.check.outputs.enabled == 'true'";
const REF_KOSUL = `github.ref == 'refs/heads/${YAYIN_DALI}'`;

const denetimler = [];
const ekle = (id, ad, ok, ayrinti, ek = {}) => denetimler.push({ id, ad, ok: ok === null ? null : !!ok, ayrinti, ...ek });
const kisa = (v, n = 600) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s === undefined ? 'undefined' : s.length > n ? s.slice(0, n) + '…' : s; };
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------- küçük blok YAML ayrıştırıcısı
class YamlHatasi extends Error {}
function yamlCoz(metin) {
  const satirlar = metin.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  const girinti = (s) => s.length - s.replace(/^ +/, '').length;
  const yorumSil = (s) => {           // tırnak dışındaki ' #' ya da baştaki '#'ten sonrasını atar
    let tek = false, cift = false;
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      if (c === '\'' && !cift) tek = !tek;
      else if (c === '"' && !tek) cift = !cift;
      else if (c === '#' && !tek && !cift && (j === 0 || /\s/.test(s[j - 1]))) return s.slice(0, j).replace(/\s+$/, '');
    }
    return s.replace(/\s+$/, '');
  };
  const anlamli = (s) => { const t = yorumSil(s); return t.trim() !== ''; };
  const sonrakiAnlamli = () => { let j = i; while (j < satirlar.length && !anlamli(satirlar[j])) j++; return j; };
  const tabDenetle = (s, no) => { if (/^\t/.test(s.replace(/^ */, ''))) throw new YamlHatasi(`satır ${no}: girintide sekme`); };
  function skaler(ham, no) {
    const s = ham.trim();
    if (s === '' || s === '~' || s === 'null') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+$/.test(s)) return Number(s);
    if (s[0] === '\'') { if (!/^'(?:[^']|'')*'$/.test(s)) throw new YamlHatasi(`satır ${no}: tek tırnaklı skaler kapanmamış`); return s.slice(1, -1).replace(/''/g, '\''); }
    if (s[0] === '"') { try { return JSON.parse(s); } catch (e) { throw new YamlHatasi(`satır ${no}: çift tırnaklı skaler çözülemedi`); } }
    if (s[0] === '[') {
      if (!s.endsWith(']')) throw new YamlHatasi(`satır ${no}: çok satırlı akış dizisi desteklenmiyor`);
      const ic = s.slice(1, -1);
      const out = [];
      let tek = false, cift = false, bas = 0;
      for (let j = 0; j <= ic.length; j++) {
        const c = ic[j];
        if (c === '\'' && !cift) tek = !tek; else if (c === '"' && !tek) cift = !cift;
        else if ((c === ',' || j === ic.length) && !tek && !cift) { const p = ic.slice(bas, j).trim(); if (p) out.push(skaler(p, no)); bas = j + 1; }
      }
      return out;
    }
    if (/^[{&*!%@`|>]/.test(s)) throw new YamlHatasi(`satır ${no}: desteklenmeyen YAML yapısı (${s.slice(0, 20)})`);
    return s;
  }
  function anahtarAyir(icerik, no) {    // 'anahtar: değer' → [anahtar, değer]; tırnaklı anahtar desteklenir
    let m = /^'((?:[^']|'')*)'\s*:(?:\s+|$)(.*)$/.exec(icerik) || /^"((?:[^"\\]|\\.)*)"\s*:(?:\s+|$)(.*)$/.exec(icerik);
    if (m) return [m[1], m[2]];
    m = /^([^'"\s#:[{][^:#]*?)\s*:(?:\s+(.*)|$)/.exec(icerik);
    if (!m) return null;
    return [m[1].trim(), m[2] === undefined ? '' : m[2]];
  }
  function blokSkaler(ust, belirtec, no) {
    if (!/^[|>][-+]?$/.test(belirtec)) throw new YamlHatasi(`satır ${no}: desteklenmeyen blok skaler belirteci ${belirtec}`);
    const parca = [];
    let ic = null;
    while (i < satirlar.length) {
      const s = satirlar[i];
      if (s.trim() === '') { parca.push(''); i++; continue; }
      const g = girinti(s);
      if (g <= ust) break;
      if (ic === null) ic = g;
      if (g < ic) break;
      parca.push(s.slice(ic)); i++;
    }
    while (parca.length && parca[parca.length - 1] === '') parca.pop();
    let metin = belirtec[0] === '>' ? parca.join(' ') : parca.join('\n');
    if (!belirtec.endsWith('-') && parca.length) metin += '\n';
    return metin;
  }
  function blok(ust) {   // ust: üst düğümün girintisi; bir sonraki anlamlı satır daha içerideyse onu çöz
    const j = sonrakiAnlamli();
    if (j >= satirlar.length) return null;
    const g = girinti(satirlar[j]);
    if (g <= ust) return null;
    i = j;
    return /^-(\s|$)/.test(satirlar[j].slice(g)) ? dizi(g) : eslem(g);
  }
  function eslem(g) {
    const out = {};
    while (true) {
      const j = sonrakiAnlamli();
      if (j >= satirlar.length) break;
      const s = satirlar[j];
      tabDenetle(s, j + 1);
      const gg = girinti(s);
      if (gg < g) break;
      if (gg > g) throw new YamlHatasi(`satır ${j + 1}: beklenmeyen girinti (${gg} > ${g})`);
      const icerik = yorumSil(s).slice(g);
      if (/^-(\s|$)/.test(icerik)) break;
      if (/^(---|\.\.\.|\? )/.test(icerik)) throw new YamlHatasi(`satır ${j + 1}: desteklenmeyen yapı (${icerik.slice(0, 10)})`);
      const kv = anahtarAyir(icerik, j + 1);
      if (!kv) throw new YamlHatasi(`satır ${j + 1}: anahtar: değer bekleniyordu (${icerik.slice(0, 40)})`);
      const [anahtar, deger] = kv;
      if (Object.prototype.hasOwnProperty.call(out, anahtar)) throw new YamlHatasi(`satır ${j + 1}: yinelenen anahtar ${anahtar}`);
      i = j + 1;
      const d = deger.trim();
      if (d === '') {
        // değer alt blokta ya da aynı girintide başlayan bir dizide
        const k = sonrakiAnlamli();
        if (k < satirlar.length && girinti(satirlar[k]) === g && /^-(\s|$)/.test(satirlar[k].slice(g))) { i = k; out[anahtar] = dizi(g); }
        else out[anahtar] = blok(g);
      } else if (/^[|>]/.test(d)) out[anahtar] = blokSkaler(g, d, j + 1);
      else out[anahtar] = skaler(d, j + 1);
    }
    return out;
  }
  function dizi(g) {
    const out = [];
    while (true) {
      const j = sonrakiAnlamli();
      if (j >= satirlar.length) break;
      const s = satirlar[j];
      tabDenetle(s, j + 1);
      const gg = girinti(s);
      if (gg < g) break;
      if (gg > g) throw new YamlHatasi(`satır ${j + 1}: beklenmeyen girinti (dizi)`);
      const icerik = yorumSil(s).slice(g);
      if (!/^-(\s|$)/.test(icerik)) break;
      const sonra = icerik.slice(1);
      const ek = sonra.length - sonra.replace(/^ +/, '').length;
      const oge = sonra.trim();
      if (oge === '') { i = j + 1; out.push(blok(g)); continue; }
      if (anahtarAyir(oge, j + 1)) {
        // '- anahtar: değer': öğe, içeriğin sütununda başlayan bir eşlemdir
        const sutun = g + 1 + ek;
        satirlar[j] = ' '.repeat(sutun) + oge;
        i = j;
        out.push(eslem(sutun));
        continue;
      }
      i = j + 1;
      out.push(/^[|>]/.test(oge) ? blokSkaler(g, oge, j + 1) : skaler(oge, j + 1));
    }
    return out;
  }
  const kok = blok(-1);
  const j = sonrakiAnlamli();
  if (j < satirlar.length) throw new YamlHatasi(`satır ${j + 1}: çözülemeyen içerik`);
  return kok;
}

// ---------------------------------------------------------------- denetimler
let metin = null, yml = null;
try { metin = fs.readFileSync(DOSYA, 'utf8'); } catch (e) { ekle('YR0', 'pages.yml okunabiliyor', false, `${DOSYA} okunamadı: ${e.message}`); }
if (metin !== null) {
  try { yml = yamlCoz(metin); ekle('YR0', 'pages.yml ayrıştırıldı (küçük blok YAML ayrıştırıcısı)', yml && typeof yml === 'object', yml ? `üst anahtarlar: ${Object.keys(yml).join(', ')}` : 'boş belge'); }
  catch (e) { ekle('YR0', 'pages.yml ayrıştırıldı (küçük blok YAML ayrıştırıcısı)', false, e instanceof YamlHatasi ? e.message : 'ayrıştırıcı hatası: ' + e.message); }
}
if (yml && typeof yml === 'object') {
  const on = yml.on;
  const beklenenOn = { push: { branches: ['main', 'master', YAYIN_DALI] }, workflow_dispatch: null };
  ekle('YR1', 'Tetikleyiciler değişmedi: push (main, master, yayın dalı) ve girdisiz workflow_dispatch', esit(on, beklenenOn), { on, beklenen: beklenenOn });
  const jobs = yml.jobs && typeof yml.jobs === 'object' ? yml.jobs : {};
  ekle('YR2', 'İş listesi değişmedi: check, deploy', esit(Object.keys(jobs), ['check', 'deploy']), Object.keys(jobs));
  const dep = jobs.deploy && typeof jobs.deploy === 'object' ? jobs.deploy : null;
  {
    let ifade = dep ? dep.if : undefined;
    let ok = false, ayr;
    if (typeof ifade !== 'string') ayr = `deploy.if dizge değil (${kisa(ifade)})`;
    else {
      let e = ifade.trim();
      const sarili = /^\$\{\{([\s\S]*)\}\}$/.exec(e);
      if (sarili) e = sarili[1].trim();
      const n = e.replace(/\s+/g, ' ');
      ok = n === `${ESKI_KOSUL} && ${REF_KOSUL}`;
      ayr = { deployIf: ifade, beklenen: `${ESKI_KOSUL} && ${REF_KOSUL}`, eskiKosulKorunuyor: n.includes(ESKI_KOSUL), refKosulu: n.includes(REF_KOSUL), veyaVar: n.includes('||') };
    }
    ekle('YR3', `deploy.if: mevcut koşul korunuyor ve && ${REF_KOSUL}`, ok, ayr);
  }
  {
    const adimlar = dep && Array.isArray(dep.steps) ? dep.steps : [];
    const ilk = adimlar[0];
    let ok = false;
    const ayr = {};
    if (!ilk || typeof ilk !== 'object') ayr.hata = 'deploy adımı yok';
    else {
      ayr.ilkAdim = ilk.name || ilk.uses || ilk.id || '(adsız)';
      const betik = ilk.run;
      const sorun = [];
      if (typeof betik !== 'string' || !betik.trim()) sorun.push(`ilk adım bir run betiği değil (${kisa(ilk.uses || ilk)})`);
      if (ilk.if !== undefined) sorun.push(`ilk adımda if var (${kisa(ilk.if)}): adım atlanabilir`);
      if (ilk['continue-on-error'] !== undefined) sorun.push('ilk adımda continue-on-error var');
      if (dep['continue-on-error'] !== undefined) sorun.push('deploy işinde continue-on-error var');
      if (ilk.shell !== undefined && ilk.shell !== 'bash') sorun.push(`kabuk bash değil (${ilk.shell})`);
      if (typeof betik === 'string' && betik.includes('${{')) sorun.push('betikte ${{ }} ifadesi var (betik enjeksiyonu riski; değer env ile verilmeli)');
      const env = ilk.env && typeof ilk.env === 'object' ? ilk.env : {};
      for (const [k, v] of Object.entries(env)) if (typeof v === 'string' && v.includes('${{')) sorun.push(`env.${k} ${'${{ }}'} içeriyor (koşturulamaz)`);
      if (!sorun.length) {
        // GitHub'ın varsayılan run kabuğu: bash --noprofile --norc -eo pipefail {0}
        const kos = (ref, b = betik) => {
          const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', b], { encoding: 'utf8', timeout: 20000,
            env: { PATH: process.env.PATH, HOME: process.env.HOME || '/tmp', GITHUB_REF: ref, GITHUB_REF_NAME: ref.replace(/^refs\/(heads|tags)\//, ''), ...Object.fromEntries(Object.entries(env).map(([k, v]) => [k, String(v)])) } });
          return { ref, cikis: r.status, cikti: (r.stdout + r.stderr).trim().slice(0, 300), hata: r.error ? r.error.message : undefined };
        };
        // Yanlış ref'ler. Harf varyantları (A2-G-03): GitHub ifadelerinde == harfe duyarsızdır; deploy.if 'refs/heads/Claude/Hopeful-…'
        // gibi BAŞKA bir dalı da yayın dalı sayar. O dalda yayını yalnız bu kabuk adımı durdurur (dal adları ve kabuk karşılaştırması
        // harfe duyarlıdır).
        const YANLIS = ['refs/heads/claude/v0.5-saglamlastirma', 'refs/heads/main', `refs/heads/${YAYIN_DALI}-kopya`, `refs/tags/${YAYIN_DALI}`, '',
          'refs/heads/Claude/Hopeful-Cray-O1JW6W', 'REFS/HEADS/CLAUDE/HOPEFUL-CRAY-O1JW6W', `refs/heads/${YAYIN_DALI.toUpperCase()}`];
        const dogru = kos(`refs/heads/${YAYIN_DALI}`);
        const yanlis = YANLIS.map((r) => kos(r));
        ayr.dogruRef = dogru;
        ayr.yanlisRef = yanlis;
        ok = dogru.cikis === 0 && yanlis.every((y) => y.cikis === 1 && y.cikti.includes('::error::'));
        // YR4b öz-sınama: denetimi harfe duyarsız yapan bozulmuş betikler (A2 güvenlik incelemesinin R1 ve R2 mutantları) bu ref
        // listesiyle yakalanmalı: bozulmuş betik doğru ref'te yine 0 verir, yanlış ref'lerden en az biri (harf varyantı) de 0 verir.
        const MUTANTLAR = [
          { ad: 'R1 "${GITHUB_REF,,}" = "refs/heads/${YAYIN_DALI,,}" (küçük harfe çevirip karşılaştırma)', uygula: (b) => (b.includes('"$GITHUB_REF"') && b.includes('"refs/heads/$YAYIN_DALI"') ? b.replace('"$GITHUB_REF"', '"${GITHUB_REF,,}"').replace('"refs/heads/$YAYIN_DALI"', '"refs/heads/${YAYIN_DALI,,}"') : null) },
          { ad: 'R2 shopt -s nocasematch; [[ $GITHUB_REF == "refs/heads/$YAYIN_DALI" ]]', uygula: (b) => (b.includes('test "$GITHUB_REF" = "refs/heads/$YAYIN_DALI" ||') ? 'shopt -s nocasematch; ' + b.replace('test "$GITHUB_REF" = "refs/heads/$YAYIN_DALI" ||', '[[ $GITHUB_REF == "refs/heads/$YAYIN_DALI" ]] ||') : null) },
        ];
        const oz = MUTANTLAR.map((mt) => {
          const b = mt.uygula(betik);
          if (b === null) return { ad: mt.ad, ok: false, sorun: 'mutasyon noktası betikte bulunamadı (betik değişti; öz-sınamayı güncelleyin)' };
          const d = kos(`refs/heads/${YAYIN_DALI}`, b);
          const kacan = YANLIS.map((r) => kos(r, b)).filter((y) => y.cikis === 0).map((y) => y.ref);
          return { ad: mt.ad, ok: d.cikis === 0 && kacan.length > 0, dogruRefCikis: d.cikis, yakalayanRefler: kacan };
        });
        ayr.ozSinama = oz;
      } else ayr.sorun = sorun;
    }
    ekle('YR4', 'deploy\'un ilk adımı GITHUB_REF\'i kabukta denetliyor (bash\'te koşturuldu: yayın dalında 0; başka ref\'lerde ve yayın dalının harf varyantlarında 1 + ::error::)', ok, { ...ayr, ozSinama: undefined });
    const oz = ayr.ozSinama;
    ekle('YR4b', 'Öz-sınama: harfe duyarsız yapılmış kabuk denetimi (inceleme mutantları R1, R2) YR4\'ün ref listesiyle yakalanıyor (bozulmuş betik bir harf varyantı ref\'te 0 veriyor)',
      Array.isArray(oz) && oz.length > 0 && oz.every((x) => x.ok), Array.isArray(oz) ? oz : 'YR4 betiği koşturulamadı; öz-sınama yapılamadı');
  }
  {
    const c = yml.concurrency;
    ekle('YR5', 'concurrency.cancel-in-progress: false (grup pages)', !!c && c['cancel-in-progress'] === false && c.group === 'pages', c);
  }
  {
    const adimlar = dep && Array.isArray(dep.steps) ? dep.steps : [];
    // ref denetimi adımı (ilk adım, GITHUB_REF'i okuyan run betiği) varsa dışarıda tutulur; geri kalan 5 adım değişmemeli
    const korumaVar = !!(adimlar[0] && typeof adimlar[0].run === 'string' && /GITHUB_REF/.test(adimlar[0].run));
    const kalan = adimlar.slice(korumaVar ? 1 : 0).map((s) => (s && (s.uses || s.name)) || null);
    const beklenenKalan = ['actions/checkout@v4', 'actions/configure-pages@v5', 'Tek dosya HTML sürümü', 'actions/upload-pages-artifact@v3', 'actions/deploy-pages@v4'];
    const ok = !!dep && dep.needs === 'check' && dep['runs-on'] === 'ubuntu-latest' && dep.environment && dep.environment.name === 'github-pages' && esit(kalan, beklenenKalan);
    ekle('YR6', 'deploy\'un geri kalanı değişmedi (needs check, github-pages ortamı, 5 yayın adımı)', ok, { needs: dep && dep.needs, ortam: dep && dep.environment, korumaAdimiDisarida: korumaVar, adimlar: kalan });
  }
}
// YR7: taban ile satır farkı
{
  let taban = null;
  try { taban = execFileSync('git', ['-C', AGAC, 'show', `${TABAN}:.github/workflows/pages.yml`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { taban = null; }
  if (taban === null || metin === null) ekle('YR7', `Taban (${TABAN}) ile fark yalnız Y9a'nın üç değişikliği`, null, taban === null ? `git show ${TABAN}:.github/workflows/pages.yml okunamadı: ATLANDI (sayılmaz)` : 'dosya okunamadı', { atlandi: true });
  else {
    const cur = metin.replace(/\r\n?/g, '\n').split('\n');
    const ts = taban.replace(/\r\n?/g, '\n').split('\n');
    // eklenen adım bloğu: deploy'un 'steps:' satırı ile 'checkout' adımı arasındaki satırlar
    const dj = cur.findIndex((s) => /^ {2}deploy:\s*$/.test(s));
    const st = dj >= 0 ? cur.findIndex((s, k) => k > dj && /^ {4}steps:\s*$/.test(s)) : -1;
    const co = st >= 0 ? cur.findIndex((s, k) => k > st && /^ {6}- uses: actions\/checkout@v4\s*$/.test(s)) : -1;
    const eklenen = st >= 0 && co > st ? cur.slice(st + 1, co) : [];
    const geri = st >= 0 && co > st ? [...cur.slice(0, st + 1), ...cur.slice(co)] : cur.slice();
    const degisen = [];
    for (let k = 0; k < geri.length; k++) {
      if (geri[k] === '  cancel-in-progress: false') { geri[k] = '  cancel-in-progress: true'; degisen.push('cancel-in-progress'); }
      else if (geri[k].trim() === `if: ${ESKI_KOSUL} && ${REF_KOSUL}` && /^ {4}if:/.test(geri[k])) { geri[k] = `    if: ${ESKI_KOSUL}`; degisen.push('deploy.if'); }
    }
    const ok = geri.join('\n') === ts.join('\n');
    let ilkFark = null;
    if (!ok) { const k = geri.findIndex((s, x) => s !== ts[x]); ilkFark = { satir: k + 1, simdi: geri[k], taban: ts[k] }; }
    ekle('YR7', `Taban (${TABAN}) ile fark yalnız Y9a'nın üç değişikliği (eklenen ref adımı, deploy.if, cancel-in-progress)`, ok, { eklenenSatir: eklenen.length, degisen, ilkFark });
  }
}

// ---------------------------------------------------------------- sonuç
const sayilan = denetimler.filter((d) => d.ok !== null);
const gecen = sayilan.filter((d) => d.ok).length;
for (const d of denetimler) console.log(`${d.ok === null ? 'ATLANDI' : d.ok ? 'GECTI' : 'KALDI'} ${d.id} ${d.ad} — ${kisa(d.ayrinti, 1500)}`);
const durum = sayilan.length && gecen === sayilan.length ? 'GECTI' : 'KALDI';
console.log(`SONUC: ${durum} (${gecen}/${sayilan.length} denetim${denetimler.length > sayilan.length ? `, ${denetimler.length - sayilan.length} atlandı` : ''})${durum === 'KALDI' ? ' | kalan: ' + sayilan.filter((d) => !d.ok).map((d) => d.id).join(', ') : ''}`);
if (RAPOR) {
  let commit = null;
  try { commit = execFileSync('git', ['-C', AGAC, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { /* git yok */ }
  fs.mkdirSync(path.dirname(path.resolve(RAPOR)), { recursive: true });
  fs.writeFileSync(RAPOR, JSON.stringify({ arac: 'tests/node/yayin_ref.mjs', tur: 'statik', dosya: path.relative(AGAC, DOSYA), taban: TABAN, commit, tarih: new Date().toISOString(), node: process.version,
    sonuc: { durum, gecen, toplam: sayilan.length, atlanan: denetimler.length - sayilan.length, kalan: sayilan.filter((d) => !d.ok).map((d) => d.id) }, denetimler, ayristirilan: yml }, null, 1));
}
process.exit(durum === 'GECTI' ? 0 : 1);
