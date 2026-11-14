const fs=require('fs');
const f='/root/.claude/projects/-home-user-SON-HAZ-NE/be41ef26-8ecd-56c1-9479-fc9d4b639d6f/subagents/workflows/wf_39f48fd7-336/agent-a492d05a838095e4c.jsonl';
const lines=fs.readFileSync(f,'utf8').split('\n').filter(Boolean);
let txt=null;
for(const l of lines){
  let o; try{o=JSON.parse(l)}catch(e){continue}
  const m=o.message; if(!m) continue;
  const c=m.content;
  const parts = typeof c==='string'?[c]:(Array.isArray(c)?c.map(x=>x.text||''):[]);
  for(const p of parts){ if(p.includes('HAM VERİ (JSON):')){ txt=p; break; } }
  if(txt) break;
}
if(!txt){console.log('not found');process.exit(1)}
const i=txt.indexOf('HAM VERİ (JSON):');
let rest=txt.slice(i+'HAM VERİ (JSON):'.length);
// find first '[' 
const s=rest.indexOf('[');
rest=rest.slice(s);
// The JSON may be followed by other text; try progressively
let data=null;
try{ data=JSON.parse(rest.trim()); }catch(e){
  // try to find end by bracket matching
  let depth=0,inStr=false,esc=false,end=-1;
  for(let k=0;k<rest.length;k++){const ch=rest[k];
    if(inStr){ if(esc){esc=false;continue} if(ch==='\\'){esc=true;continue} if(ch==='"'){inStr=false} continue;}
    if(ch==='"'){inStr=true;continue}
    if(ch==='['||ch==='{')depth++;
    else if(ch===']'||ch==='}'){depth--; if(depth===0){end=k;break}}
  }
  console.log('end at',end,'of',rest.length,'trailing:',JSON.stringify(rest.slice(end+1,end+200)));
  data=JSON.parse(rest.slice(0,end+1));
}
fs.writeFileSync('raw.json',JSON.stringify(data,null,1));
console.log('areas',data.length, data.map(a=>a.key+':'+(a.audit.issues||[]).length+'/'+((a.verify&&a.verify.verdicts)||[]).length+'/'+((a.verify&&a.verify.missed)||[]).length).join(' '));
console.log('prompt total chars', txt.length);
fs.writeFileSync('prompt_full.txt',txt);
