const data=require('./raw.json');
for(const a of data){
  const au=a.audit, v=a.verify||{verdicts:[],missed:[]};
  const sysT=au.systems.filter(s=>s.status==='calisiyor_test_edilmis');
  const reqK=au.requirements.filter(r=>r.status==='karsilaniyor');
  const docY=au.docClaims.filter(d=>d.verdict==='yanlis');
  const refs=v.verdicts.map(x=>x.ref);
  const cnt=p=>refs.filter(r=>new RegExp('^'+p+'\\d+$').test(r)).length;
  const issueRefs=refs.filter(r=>/^[A-K]-\d+$/.test(r));
  console.log(a.key,'UC',cnt('UC'),'/',au.userClaims.length,' SYS',cnt('SYS'),'/',sysT.length,' REQ',cnt('REQ'),'/',reqK.length,' DOC',cnt('DOC'),'/',docY.length,' issues:',issueRefs.join(','),' other:',refs.filter(r=>!/^(UC|SYS|REQ|DOC)\d+$/.test(r)&&!/^[A-K]-\d+$/.test(r)).join(','));
  const verd={};v.verdicts.forEach(x=>verd[x.verdict]=(verd[x.verdict]||0)+1);
  console.log('   verdicts',JSON.stringify(verd),'missed',v.missed.length, 'issuesPrio', JSON.stringify(au.issues.reduce((m,i)=>(m[i.priority]=(m[i.priority]||0)+1,m),{})));
}
