import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');
const base = { bundle: true, format: 'iife', minify: true, target: 'es2022', write: false, legalComments: 'none', logLevel: 'silent', charset: 'utf8' };
const hookStub = { name: 'hstub', setup(b) { b.onLoad({ filter: /[\\/]test[\\/]hooks\.js$/ }, () => ({ contents: 'export function install(){}', loader: 'js' })); b.onLoad({ filter: /[\\/]core[\\/]testmode\.js$/ }, () => ({ contents: 'export const TEST = false;', loader: 'js' })); } };
const t1 = (await esbuild.build({ ...base, entryPoints: ['src/main2.js'], define: { 'globalThis.__DK_URETIM__': 'true' } })).outputFiles[0].text;
const t2 = (await esbuild.build({ ...base, entryPoints: ['src/main.js'], plugins: [hookStub] })).outputFiles[0].text;
const t3 = (await esbuild.build({ ...base, entryPoints: ['src/main2.js'] })).outputFiles[0].text;
console.log(JSON.stringify({ define_uretim: { bytes: t1.length, hasHooks: t1.includes('dk-test-kancalari'), hasImportOrTEST: /install|location/.test(t1), text: t1 }, hookStub_uretim: { bytes: t2.length, hasHooks: t2.includes('dk-test-kancalari'), text: t2 }, define_yok_test: { bytes: t3.length, hasHooks: t3.includes('dk-test-kancalari') } }, null, 1));
