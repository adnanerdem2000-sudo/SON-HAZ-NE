[
 {wait: 500, js: `({stats: DK.terrain.stats(), h: DK.terrain.heightAt(0,0).toFixed(2), hport: DK.terrain.heightAt(10,222).toFixed(2)})`},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2500, js: `DK.sim(1); ({stats: DK.terrain.stats(), p: DK.G.player.pos.toArray().map(v=>v.toFixed(1))})`},
 {wait: 1500, shot: '/tmp/preview/p2/w_start.png'},
 {js: `const t0=performance.now(); let s=0; for(let i=0;i<20000;i++) s+=DK.terrain.heightAt(Math.random()*400-200, Math.random()*400+50); const t1=performance.now(); for(let i=0;i<20000;i++) s+=DK.terrain.heightAt(Math.random()*16000-8000, Math.random()*16000-8000); const t2=performance.now(); ({nearUs: ((t1-t0)/20).toFixed(3), farUs: ((t2-t1)/20).toFixed(3)})`},
]
