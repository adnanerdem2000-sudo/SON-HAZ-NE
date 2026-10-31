[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 2500, js: `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=600; s.z=-6200; s.yaw=0.4; s.anchored=true; s.anchorState='down'; s.anchorT=1; s.anchorPt=null; await DK.terrain.prepare(s.x, s.z, {radius:300}); s.updateTransform(0); p.boardShip(s, s.model.stations.helm.clone()); DK.sky.hour=10; DK.sim(1); const g = DK.megafauna.debugSpawn('balina', 45); DK.sim(3); const w=g.members[0]; return {depth: DK.terrain.heightAt(s.x,s.z), w:[w.pos.x,w.pos.y,w.pos.z,w.mode,w.yaw], n:g.members.length}; })()`},
 {snapjs: ['/tmp/preview/p3/s_whale1.jpg', `(()=>{ const w=DK.megafauna.groups[0].members[0]; return DK.snapFrom([w.pos.x+Math.sin(w.yaw+1.4)*24, 5, w.pos.z+Math.cos(w.yaw+1.4)*24], [w.pos.x, w.pos.y+0.5, w.pos.z]); })()`]},
 {js: `(()=>{ const w=DK.megafauna.groups[0].members[0]; w.blowT=0; DK.sim(0.6); return [w.blowN]; })()`},
 {snapjs: ['/tmp/preview/p3/s_whale_blow.jpg', `(()=>{ const w=DK.megafauna.groups[0].members[0]; return DK.snapFrom([w.pos.x+Math.sin(w.yaw+1.2)*30, 6, w.pos.z+Math.cos(w.yaw+1.2)*30], [w.pos.x, w.pos.y+2.5, w.pos.z]); })()`]},
 {js: `(()=>{ const w=DK.megafauna.groups[0].members[0]; w.mode='dive'; w.modeT=0; DK.sim(3.6); return [w.mode, w.pitch, w.pos.y]; })()`},
 {snapjs: ['/tmp/preview/p3/s_whale_dive.jpg', `(()=>{ const w=DK.megafauna.groups[0].members[0]; return DK.snapFrom([w.pos.x+Math.sin(w.yaw+1.6)*28, 4, w.pos.z+Math.cos(w.yaw+1.6)*28], [w.pos.x, w.pos.y+1, w.pos.z]); })()`]},
 {js: `(()=>{ const w=DK.megafauna.groups[0].members[0]; w.mode='breach'; w.modeT=0; w.vy=0; w.pos.y=-9; let maxY=-99; for(let i=0;i<60;i++){ DK.sim(1/30); maxY=Math.max(maxY,w.pos.y); if (w.mode==='fall' && w.vy<1.5) break; } return [w.mode, w.pitch, w.pos.y, maxY]; })()`},
 {snapjs: ['/tmp/preview/p3/s_whale_breach.jpg', `(()=>{ const w=DK.megafauna.groups[0].members[0]; return DK.snapFrom([w.pos.x+Math.sin(w.yaw+1.5)*34, 4, w.pos.z+Math.cos(w.yaw+1.5)*34], [w.pos.x, w.pos.y, w.pos.z]); })()`]},
 {js: `(()=>{ const w=DK.megafauna.groups[0].members[0]; for(let i=0;i<120 && w.mode==='fall';i++) DK.sim(1/30); DK.sim(0.2); return [w.mode, w.splashN, DK.effects.parts.length]; })()`},
 {snapjs: ['/tmp/preview/p3/s_whale_splash.jpg', `(()=>{ const w=DK.megafauna.groups[0].members[0]; return DK.snapFrom([w.pos.x+Math.sin(w.yaw+1.5)*40, 5, w.pos.z+Math.cos(w.yaw+1.5)*40], [w.pos.x, 2, w.pos.z]); })()`]},
]
