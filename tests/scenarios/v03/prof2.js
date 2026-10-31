[
 {js: `const T=performance.now(); let last=T; const t=[]; const m=(k)=>{const n=performance.now(); t.push(k+':'+Math.round(n-last)); last=n;};
   const kk=DK.kk;
   const o1=kk.clone('barbarian'); m('clone1');
   const o2=kk.clone('barbarian'); m('clone2');
   const tx1=kk.texture('barbarian', {skin:'#c08060', hair:'#302010', coat:'#123456', pants:'#222222', boots:'#111111', leather:'#2a1a0a', fur:'#887766'}); m('tex1');
   const tx2=kk.texture('barbarian', {skin:'#c08061', hair:'#302010', coat:'#654321', pants:'#222222', boots:'#111111', leather:'#2a1a0a', fur:'#887766'}); m('tex2');
   const c3 = new DK.Character({gender:'m', body:'kaba', hat:'yok', shirtColor:'#abcdef'}); m('charNoHat');
   const c4 = new DK.Character({gender:'m', body:'kaba', hat:'tricorn', shirtColor:'#abcde0'}); m('charTricorn');
   const c5 = new DK.Character({gender:'m', body:'kaba', hat:'tricorn', shirtColor:'#abcde0'}); m('charSame');
   t`},
]
