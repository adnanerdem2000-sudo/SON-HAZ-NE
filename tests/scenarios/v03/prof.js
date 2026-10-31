[
 {js: `const T=performance.now(); const t=[]; const m=(k)=>t.push(k+':'+Math.round(performance.now()-T)); 
   const c1 = new DK.Character({gender:'m', body:'kaba', hat:'tricorn', shirtColor:'#123456'}); m('char1');
   const c2 = new DK.Character({gender:'f', body:'cevik', hat:'bandana', shirtColor:'#654321'}); m('char2');
   const p1 = DK.kk.part('town','tavern_red'); m('part');
   const b = new DK.THREE.Box3().setFromObject(p1); m('box');
   t`},
]
