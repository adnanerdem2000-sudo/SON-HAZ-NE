const d=require('./raw.json');
function targets(a){
  const au=a.audit;
  const m={};
  au.userClaims.forEach((x,i)=>m['UC'+(i+1)]={kind:'uc',idx:au.userClaims.indexOf(x),label:x.claim,cur:'v03='+x.v03+' v04='+x.v04});
  au.systems.filter(s=>s.status==='calisiyor_test_edilmis').forEach((x,i)=>m['SYS'+(i+1)]={kind:'sys',idx:au.systems.indexOf(x),label:x.name,cur:x.status});
  au.requirements.filter(s=>s.status==='karsilaniyor').forEach((x,i)=>m['REQ'+(i+1)]={kind:'req',idx:au.requirements.indexOf(x),label:x.req,cur:x.status});
  au.docClaims.filter(s=>s.verdict==='yanlis').forEach((x,i)=>m['DOC'+(i+1)]={kind:'doc',idx:au.docClaims.indexOf(x),label:x.doc+' :: '+x.claim,cur:x.verdict});
  au.issues.forEach(x=>m[x.id]={kind:'issue',idx:au.issues.indexOf(x),label:x.title,cur:x.priority});
  return m;
}
module.exports={targets};
if(require.main===module){
  const only=process.argv[2];
  for(const a of d){ if(only && a.key!==only) continue;
    const t=targets(a);
    for(const v of a.verify.verdicts){
      const tg=t[v.ref];
      console.log(`[${a.key} ${v.ref}] ${v.verdict.toUpperCase()} -> (${tg?tg.kind+'#'+tg.idx:'??'}) ${tg?tg.label.slice(0,90):''} {${tg?tg.cur:''}}`);
      if(v.correction) console.log('   CORR: '+v.correction.replace(/\s+/g,' ').slice(0,700));
    }
  }
}
