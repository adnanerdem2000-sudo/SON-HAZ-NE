[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2000, js: `DK.sim(1); for (const I of DK.islands ? [] : []) {}; const q=DK.quests; for (const I of ['kirlangic','marti','kemik','tuz_pazari','kuzeyfener','kul_limani','zumrut_koy','kumsaati','korsan_mezarligi','kadim_tapinak','ates_dagi','buzdisi','demirkapi']) q.discovered[I]=true; for (let i=0;i<q.fog.length;i++){ const x=(i%256)-128, z=Math.floor(i/256)-128; if (Math.hypot(x,z)<60 || (x>8&&x<40&&z>-10&&z<20) || (x<-50&&z<-40) || (z<-50) ) q.fog[i]=1;} q.fogDirty=true; DK.G.emit('openMap'); 'map'`},
 {wait: 1500, shot: '/tmp/preview/p2/m_world.png'},
 {js: `const cv=document.querySelector('.map-wrap canvas'); for(let i=0;i<10;i++) cv.dispatchEvent(new WheelEvent('wheel',{deltaY:200, clientX: 700, clientY: 400})); 'out'`},
 {wait: 1500, shot: '/tmp/preview/p2/m_world_out.png'},
 {js: `const cv=document.querySelector('.map-wrap canvas'); for(let i=0;i<22;i++) cv.dispatchEvent(new WheelEvent('wheel',{deltaY:-200, clientX: 700, clientY: 450})); 'in'`},
 {wait: 4000, shot: '/tmp/preview/p2/m_world_in.png'},
 {js: `DK.ui.close(); DK.sim(0.5); 'closed'`},
 {wait: 2500, shot: '/tmp/preview/p2/m_minimap.png'},
]
