// Faz 8 karşıt inceleme ölçümü 3 (salt-okur): SwiftShader uzantıları ve KayKit gövde parçalarının birleştirilebilirliği.
[
 {expect: {js: `!!window.DK && !!window.__ready`, truthy: true, label: 'Sayfa hazır'}},
 {js: `(()=>{ const gl=DK.engine.renderer.getContext(); const ex=(n)=>!!gl.getExtension(n);
   return {KHR_parallel_shader_compile: ex('KHR_parallel_shader_compile'), EXT_disjoint_timer_query_webgl2: ex('EXT_disjoint_timer_query_webgl2'), maxSamples: DK.engine.renderer.capabilities.maxSamples, postKip: DK.post.mode, tuvalAA: gl.getContextAttributes().antialias }; })()`},
 {js: `DK.G.noAutoPause=true; DK.engine.fpsLimit=1; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {js: `(()=>{ DK.sim(1); const out=[]; for (const n of DK.npcs.list.filter(n=>n.root).slice(0,3)) { const parts=[]; n.root.traverse(o=>{ if (o.isSkinnedMesh) parts.push(o); });
     const b0=parts[0].skeleton.bones; const ayniKemik=parts.every(p=>p.skeleton.bones.length===b0.length && p.skeleton.bones.every((b,i)=>b===b0[i]));
     const ayniDoku=parts.every(p=>p.material.map===parts[0].material.map); const ayniBind=parts.every(p=>p.bindMatrix.equals(parts[0].bindMatrix));
     const attrs=parts.map(p=>Object.keys(p.geometry.attributes).sort().join(','));
     out.push({ad:n.spot.name, parca:parts.length, kemik:b0.length, ayniKemik, ayniDoku, ayniBind, ayniOznitelik: attrs.every(a=>a===attrs[0]), oznitelik:attrs[0], ucgen: parts.map(p=>(p.geometry.index?p.geometry.index.count:p.geometry.attributes.position.count)/3)}); }
   return out; })()`},
 {expect: {js: `DK.G.state==='playing'`, truthy: true, label: 'Oyun açık'}},
]
