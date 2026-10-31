[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2000, js: `DK.sim(1); const q=DK.quests; for (const I of ['kirlangic','marti','kemik','papagan']) q.discovered[I]=true; for (let i=0;i<q.fog.length;i++){ const x=(i%256)-128, z=Math.floor(i/256)-128; if (Math.hypot(x,z)<14) q.fog[i]=1;} q.fogDirty=true; DK.G.emit('openMap'); 'map'`},
 {wait: 3500, shot: '/tmp/preview/p2/m_core.png'},
 {js: `const cv=document.querySelector('.map-wrap canvas'); const r=cv.getBoundingClientRect(); for(let i=0;i<8;i++) cv.dispatchEvent(new WheelEvent('wheel',{deltaY:-200, clientX: r.left+r.width/2, clientY: r.top+r.height/2})); 'in'`},
 {wait: 4000, shot: '/tmp/preview/p2/m_core_in.png'},
]
