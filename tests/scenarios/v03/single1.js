[
 {wait: 1500, js: `({ single: !!window.__DK_SINGLE_FILE, workers: DK.terrain.workers.length, font: document.fonts ? [...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).slice(0,4) : null })`},
 {shot: '/tmp/preview/p3/s_menu.png'},
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 6000, js: `(()=>{ DK.sim(2); const p = DK.G.player; return { state: DK.G.state, pos: p.pos.toArray().map(v=>+v.toFixed(1)), workers: DK.terrain.workers.length, animals: DK.animals.list.length, kk: Object.keys(DK.kk.templates||{}).length, models: Object.keys(DK.assets.models||DK.assets.cache||{}).length }; })()`},
 {js: `(async()=>{ await DK.terrain.prepare(600, -6200, {radius: 300}); return { h: +DK.terrain.heightAt(600,-6200).toFixed(2) }; })()`},
 {wait: 500, shot: '/tmp/preview/p3/s_game.png'},
]
