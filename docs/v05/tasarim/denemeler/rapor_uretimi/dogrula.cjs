const fs=require('fs');
const dir=process.argv[2];
const J=JSON.parse(fs.readFileSync(dir+'/denetim_bulgulari.json','utf8'));
const A=fs.readFileSync(dir+'/AUDIT_CURRENT.md','utf8');
const Kn=fs.readFileSync(dir+'/KNOWN_ISSUES.md','utf8');
const errs=[];
const heads=['# AUDIT_CURRENT — Güncel Kod Denetimi (Faz 0)','## 1. Kapsam ve taban','## 2. Yönetici özeti','## 3. Kullanıcının kod iddiaları','## 4. Sistem durumu','## 5. Hatalar','## 6. Çürütülen ya da belirsiz kalan iddialar','## 7. Belgeler ve gerçek kod','## 8. Gereksinim boşlukları ve faz planı','## 9. Taban test koşusu','## 10. Test planı','## 11. Riskler ve sınırlar'];
const lines=A.split('\n');
let last=-1;for(const h of heads){const i=lines.indexOf(h);if(i<0)errs.push('başlık yok: '+h);else if(i<=last)errs.push('sıra bozuk: '+h);else last=i;}
const h2=lines.filter(l=>/^## /.test(l));if(h2.length!==11)errs.push('## sayısı '+h2.length);
const i9=lines.indexOf('## 9. Taban test koşusu');if(lines[i9+2]!=='(ana oturum tarafından doldurulacak)')errs.push('§9 notu');
// IDs
const ids=[];for(const a of J.alanlar)for(const h of a.birlestirme.hatalar)ids.push(h.id);
for(const id of ids){const re=new RegExp('^### '+id.replace(/[-]/g,'\\-')+' — .* \\((kritik|yüksek|orta|düşük)\\)$','m');const m=A.match(new RegExp('^### '+id+' — ','gm'));if(!m||m.length!==1)errs.push('§5 başlık '+id+' '+(m?m.length:0));else if(!re.test(A))errs.push('§5 başlık biçimi '+id);}
// all ### id headings within §5
const s5=lines.indexOf('## 5. Hatalar'),s6=lines.indexOf('## 6. Çürütülen ya da belirsiz kalan iddialar');
const hInS5=lines.slice(s5,s6).filter(l=>/^### [A-K]-/.test(l)).length;if(hInS5!==ids.length)errs.push('§5 başlık sayısı '+hInS5+' vs '+ids.length);
// bullets per issue
const blocks=A.slice(A.indexOf('## 5. Hatalar'),A.indexOf('## 6. ')).split(/^### /m).slice(1);
const need=['Dosya ve fonksiyon','Kök neden','Oyuncuya etkisi','Öncelik','Önerilen çözüm','Tekrar üretme','Kabul testi','Sürüm','Bilinen kimlik','Doğrulama sonucu'];
for(const b of blocks){const id=b.split(' ')[0];for(const n of need){if(!b.includes('- **'+n+':** '))errs.push('madde alanı eksik '+id+' '+n);}}
// KNOWN_ISSUES coverage
const kiRows=Kn.split('\n').filter(l=>/^\| KI-\d{3} \|/.test(l));
if(kiRows.length!==J.known_issues.length)errs.push('KI satır '+kiRows.length+' vs '+J.known_issues.length);
const kiIds=new Set();kiRows.forEach(r=>{const k=r.split(' | ')[0].slice(2);if(kiIds.has(k))errs.push('çift KI '+k);kiIds.add(k);});
for(const id of ids){if(!new RegExp('[|;] ?(ilgili: )?'+id+' \\(').test(Kn))errs.push('KI kapsamı yok '+id);}
// table column consistency
function checkTables(txt,name){const L=txt.split('\n');let cols=null;for(let i=0;i<L.length;i++){const l=L[i];if(!l.startsWith('|')){cols=null;continue;}const n=l.replace(/\\\|/g,'').split('|').length;if(cols===null){cols=n;}else if(n!==cols)errs.push(name+' tablo sütunu satır '+(i+1)+': '+n+' vs '+cols);}}
checkTables(A,'AUDIT');checkTables(Kn,'KI');
// stray tokens
for(const [nm,t] of [['AUDIT',A],['KI',Kn]]){for(const tok of ['undefined','[object Object]x','NaN undefined',' null ']){const c=t.split(tok).length-1;if(c)errs.push(nm+' içinde "'+tok+'" '+c);}}
// &lt; inside code spans
let bad=0;for(const l of lines){const parts=l.split('`');for(let i=1;i<parts.length;i+=2)if(parts[i].includes('&lt;'))bad++;}if(bad)errs.push('kod içinde &lt; '+bad);
// raw '<' outside code spans (HTML risk)
let raw=0;for(const l of [...lines,...Kn.split('\n')]){const parts=l.split('`');if(parts.length%2===0)continue;for(let i=0;i<parts.length;i+=2)if(/<[a-zA-Z\/!]/.test(parts[i]))raw++;}if(raw)errs.push('kod dışı ham etiket '+raw);
console.log(JSON.stringify({ids:ids.length,ki:kiRows.length,audit_satir:lines.length,hata:errs.length},null,0));
if(errs.length)console.log(errs.slice(0,40).join('\n'));
