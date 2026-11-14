// v0.4 kaynağını (salt-okur) build-single-html.mjs ile aynı ayarlarla paketler; uyarı sayısı ve seçenek etkileri
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const ROOT = process.argv[2] || '/home/user/SON-HAZ-NE';
const WORKER_URL = "new URL('./terrainWorker.js', import.meta.url)";
const plugin = { name: 'dk-single', setup(b) {
  b.onResolve({ filter: /^three$/ }, () => ({ path: join(ROOT, 'vendor/three/three.module.js') }));
  b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: join(ROOT, 'vendor/three/addons', a.path.slice('three/addons/'.length)) }));
  b.onLoad({ filter: /[\\/]world[\\/]terrain\.js$/ }, (a) => { const src = readFileSync(a.path, 'utf8'); return { contents: src.split(WORKER_URL).join('window.__DK_WORKER_URL'), loader: 'js' }; });
} };
const opts = (entry, extra = {}) => ({ entryPoints: [join(ROOT, entry)], bundle: true, format: 'iife', minify: true, target: 'es2022', write: false, legalComments: 'none', logLevel: 'silent', plugins: [plugin], charset: 'utf8', ...extra });
const res = {};
for (const [name, entry, extra] of [['oyun', 'js/main.js', {}], ['isci', 'js/world/terrainWorker.js', {}], ['oyun_eof_strict', 'js/main.js', { legalComments: 'eof', banner: { js: '"use strict";' } }], ['oyun_meta_hata', 'js/main.js', { logOverride: { 'empty-import-meta': 'error' } }]]) {
  try { const r = await esbuild.build(opts(entry, extra)); const t = r.outputFiles[0].text;
    res[name] = { uyari: r.warnings.length, uyariIds: r.warnings.map((w) => w.id), bayt: t.length, importMeta: (t.match(/import\.meta/g) || []).length, newUrlNokta: (t.match(/new URL\(["']\.\//g) || []).length, threeLisans: t.includes('Three.js Authors'), katiBasta: t.startsWith('"use strict"'), dkSim: t.includes('DK.sim'), windowDK: (t.match(/window\.DK\b/g) || []).length };
  } catch (e) { res[name] = { hata: e.message.split('\n')[0] }; }
}
console.log(JSON.stringify(res, null, 1));
