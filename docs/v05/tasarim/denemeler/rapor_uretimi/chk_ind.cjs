const d=require('./raw.json');
const A=k=>d.find(a=>a.key===k);
const vt=(k,r)=>{const v=A(k).verify.verdicts.find(x=>x.ref===r);return v?(v.evidence+' || '+(v.correction||'')):'';};
const auditText=(k)=>JSON.stringify(A(k).audit.issues)+JSON.stringify(A(k).audit.systems)+JSON.stringify(A(k).audit.requirements)+JSON.stringify(A(k).audit.docClaims);
const checks=[
 ['A-17',[['A','SYS1'],['A','REQ4'],['A','DOC1'],['K','DOC3'],['A','REQ8']],/badurl|tests\/out|02_arazi_yedek|depo test/i],
 ['G-14',[['G','SYS6']],/7 ?000|örnek sınır|seyrel/i],
 ['K-08',[['K','UC2']],/peerhost|\?terrain|URL/i],
 ['D-06',[['D','REQ11'],['K','REQ18']],/start\(|istisna|yarım/i],
 ['D-07',[['D','D-01']],/spawned|kamp/i],
 ['E-12',[['B','B-01']],/tamir|repair|delik/i],
 ['J-09',[],null],
 ['K-M02',[['A','REQ8']],/noworker|işçisiz|12\/12|taban/i],
 ['H-14',[['B','DOC2']],/F-04|blok|kaçınma|dokunulmaz/i],
 ['E-17',[['E','UC5'],['E','UC3'],['E','UC4']],/ev sahibi merkez|konuk çevres|olay/i],
 ['E-16',[['B','SYS3'],['E','DOC2'],['E','UC9']],/yeniden bağlan|aynı ad|hayalet|ölü kod/i],
 ['B-15',[['B','SYS2'],['B','SYS3'],['E','SYS3']],/hello|ping|app|şifre/i],
 ['B-16',[['E','SYS3']],/dksh-v1|VER|sürüm/i],
 ['B-21',[['E','SYS2'],['F','SYS2']],/inter|prog|KNOWN|oran/i],
 ['C-17',[['C','SYS3'],['C','REQ2']],/36 m|süpürme|hızlı düşüş/i],
 ['C-16',[['C','REQ1']],/0,25|LOD|sıçrama/i],
 ['C-10',[['C','REQ5']],/gemi|kayık|#39/i],
 ['D-13',[['D','UC4']],/kaya|tuzak/i],
 ['G-06',[['G','DOC1'],['G','SYS1']],/22|26|11|harabe/i],
 ['G-08',[['G','SYS9']],/merdiven|barınak|sudan çıkış/i],
 ['G-15',[['G','UC3'],['G','UC6'],['G','UC8'],['G','UC9']],/açıklama|bayrak|karşılıksız|yalnızca geceleri|ocak/i],
 ['H-19',[['H','SYS4']],/gece dalga/i],
 ['H-24',[['F','SYS1'],['G','UC1']],/test|sınan/i],
 ['I-03',[['I','DOC1'],['I','DOC2']],/IK|el|çark|kundak/i],
 ['K-06',[['K','K-05']],/path: \.|K-06/i],
 ['K-03',[['K','UC1']],/workflow_dispatch|dispatch|ref/i],
 ['K-07',[['K','UC2']],/DK\.sim|godMode|window\.DK/i],
 ['D-14',[['D','SYS6'],['B','B-05']],/kese|D-14|kaydedil/i],
 ['J-M02',[['B','B-02']],/rebuild|disposeTree/i],
 ['B-M07',[['E','SYS2']],/200 KB|sohbet|H07|altın bütçe|oran sınır/i],
 ['K-M03',[['A','DOC1'],['A','DOC2'],['A','DOC3']],/file:\/\/|takıl|v0\.3/i],
 ['F-11',[],null],
 ['E-05',[['D','D-03'],['G','G-02']],/geç|yeniden katıl/i],
];
for(const [id,refs,re] of checks){ for(const [k,r] of refs){ const t=vt(k,r); const m=re?t.match(new RegExp('.{0,90}('+re.source+').{0,110}',re.flags)):null; console.log(id,'<-',k+'/'+r, t? (m? 'EVET: '+m[0].replace(/\s+/g,' '):'yok-eslesme'):'VERDICT YOK'); } }
// K-M04 -> D auditor text mentions v0.3 fixture?
const dt=auditText('D'); const mm=dt.match(/.{0,120}(fikstür|archipelago_v03|v0\.3 kayd).{0,120}/i); console.log('K-M04 <- D audit:', mm?mm[0]:'yok');
const at=JSON.stringify(A('A').verify.missed)+JSON.stringify(A('A').audit); const j9=JSON.stringify(A('A').verify.missed[1]); console.log('J-09 <- A-M02 mentions shadow:', /gölge|shadow/i.test(j9), (j9.match(/.{0,80}(gölge|shadow).{0,80}/i)||[''])[0]);
