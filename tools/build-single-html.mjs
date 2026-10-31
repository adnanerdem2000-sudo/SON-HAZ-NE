// Tek dosyalık çevrimdışı sürüm: tüm kod, modeller, sesler ve yazı tipleri tek bir HTML dosyasına gömülür.
// Dosya çift tıklanınca tarayıcıda açılır (sunucu gerekmez).
//
// Kullanım:  npm i esbuild  &&  node tools/build-single-html.mjs [çıktı.html]
// Varsayılan çıktı: dist/DenizKorsanlari-SonHazine.html

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = process.argv[2] || join(ROOT, 'dist', 'DenizKorsanlari-SonHazine.html');
const WORKER_URL = "new URL('./terrainWorker.js', import.meta.url)";

// 'three' ve 'three/addons/*' içe aktarmaları (tarayıcıdaki importmap'in karşılığı); arazi işçisi blob adresinden başlar
const plugin = {
  name: 'dk-single',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: join(ROOT, 'vendor/three/three.module.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: join(ROOT, 'vendor/three/addons', a.path.slice('three/addons/'.length)) }));
    b.onLoad({ filter: /[\\/]world[\\/]terrain\.js$/ }, (a) => {
      const src = readFileSync(a.path, 'utf8');
      if (!src.includes(WORKER_URL)) throw new Error('terrain.js: işçi URL ifadesi bulunamadı');
      return { contents: src.split(WORKER_URL).join('window.__DK_WORKER_URL'), loader: 'js' };
    });
  },
};

async function bundle(entry) {
  const r = await esbuild.build({
    entryPoints: [join(ROOT, entry)], bundle: true, format: 'iife', minify: true, target: 'es2022',
    write: false, legalComments: 'none', logLevel: 'warning', plugins: [plugin], charset: 'utf8',
  });
  return r.outputFiles[0].text;
}

// <script> içine güvenle konabilsin
const scriptSafe = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

async function main() {
  const t0 = Date.now();
  const [game, worker] = await Promise.all([bundle('js/main.js'), bundle('js/world/terrainWorker.js')]);

  // varlıklar: yazı tipleri CSS'e, diğerleri dosya haritasına
  const files = {};
  let assetBytes = 0;
  for (const p of walk(join(ROOT, 'assets'))) {
    const rel = relative(ROOT, p).split(sep).join('/');
    if (rel.startsWith('assets/fonts/') || rel.endsWith('.txt')) continue;
    const buf = readFileSync(p);
    assetBytes += buf.length;
    files[rel] = buf.toString('base64');
  }
  let css = readFileSync(join(ROOT, 'css/style.css'), 'utf8');
  css = css.replace(/url\((['"]?)\.\.\/(assets\/[^'")]+)\1\)/g, (m, q, path) => {
    const buf = readFileSync(join(ROOT, path));
    return `url("data:${MIME[extname(path)] || 'application/octet-stream'};base64,${buf.toString('base64')}")`;
  });

  // ağ isteklerini gömülü dosyalardan karşıla (GLTF yükleyici ve sesler fetch kullanır)
  const prelude = `
(function () {
  var F = window.__DK_FILES, C = {};
  var T = { glb: 'model/gltf-binary', ogg: 'audio/ogg', mp3: 'audio/mpeg', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', json: 'application/json' };
  function key(u) {
    var s = String(u), i = s.indexOf('assets/');
    if (i < 0) return null;
    s = s.slice(i).split('?')[0].split('#')[0];
    try { s = decodeURIComponent(s); } catch (e) { /* olduğu gibi */ }
    return (F[s] || C[s]) ? s : null;
  }
  function bytes(k) {
    if (!C[k]) { var b = atob(F[k]), a = new Uint8Array(b.length); for (var j = 0; j < b.length; j++) a[j] = b.charCodeAt(j); C[k] = a; F[k] = null; }
    return C[k];
  }
  var real = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || String(input);
    var k = key(u);
    if (k) {
      var type = T[k.split('.').pop().toLowerCase()] || 'application/octet-stream';
      return Promise.resolve(new Response(new Blob([bytes(k)], { type: type }), { status: 200, headers: { 'Content-Type': type } }));
    }
    return real ? real(input, init) : Promise.reject(new Error('fetch yok'));
  };
  // file:// altında köken 'null' olduğu için blob: işçisi reddedilir; data: URL her kökenden çalışır (yedek: blob)
  window.__DK_WORKER_URL = location.protocol === 'file:'
    ? 'data:text/javascript;charset=utf-8,' + encodeURIComponent(window.__DK_WORKER_SRC)
    : URL.createObjectURL(new Blob([window.__DK_WORKER_SRC], { type: 'text/javascript' }));
  window.__DK_SINGLE_FILE = true;
})();`;

  let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const icon = readFileSync(join(ROOT, 'assets/icon.svg')).toString('base64');
  const peer = readFileSync(join(ROOT, 'vendor/peerjs/peerjs.min.js'), 'utf8');
  const swap = (from, to) => {
    if (!html.includes(from)) throw new Error('index.html içinde bulunamadı: ' + from.slice(0, 60));
    html = html.replace(from, () => to);
  };
  swap('<link rel="icon" href="assets/icon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml;base64,${icon}" type="image/svg+xml">`);
  swap('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);
  html = html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '');
  swap('<script src="vendor/peerjs/peerjs.min.js"></script>', `<script>${scriptSafe(peer)}</script>`);
  swap('<script type="module" src="js/main.js"></script>', [
    `<script>window.__DK_FILES=${JSON.stringify(files)};</script>`,
    `<script>window.__DK_WORKER_SRC=${scriptSafe(JSON.stringify(worker))};</script>`,
    `<script>${scriptSafe(prelude)}</script>`,
    `<script>${scriptSafe(game)}</script>`,
  ].join('\n'));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, html);
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  console.log(`Tek dosya hazır: ${relative(ROOT, OUT)} (${mb(Buffer.byteLength(html))}; kod ${mb(game.length + worker.length)}, varlık ${mb(assetBytes)}) — ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
}

main().catch((e) => { console.error(e); process.exit(1); });
