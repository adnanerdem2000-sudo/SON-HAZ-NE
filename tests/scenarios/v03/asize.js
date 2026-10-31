[
 {js: `const T=DK.THREE; const out={}; for (const n of ['wolf','fox','deer','stag','yeti','crab','husky','cat']) { const m=DK.assets.clone(n); m.updateMatrixWorld(true); const b=new T.Box3().setFromObject(m, true); const s=b.getSize(new T.Vector3()); out[n]=s.toArray().map(v=>v.toFixed(2)).join('x')+' minY '+b.min.y.toFixed(2); } out`},
]
