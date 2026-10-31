// Kare hızı tutarlılığı: aynı girdiyi 15/30/60/120 FPS adımlarıyla simüle et, sonuçları karşılaştır
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 5000, js: `(()=>{
   const out = {};
   const p = DK.G.player, s = DK.G.ship;
   const flat = { x: -60, z: 120 }; // liman meydanı çevresi (düz zemin)
   const run = (label, dt, fn) => { const r = fn(dt); (out[label] ||= {})[String(Math.round(1/dt))+'fps'] = r; };
   const holdSim = (code, sec, dt) => { DK.input.down.add(code); DK.input.pressedSet.add(code); DK.sim(sec, dt); DK.input.down.delete(code); };
   const reset = () => { p.mode='ground'; p.ship=null; p.pos.set(flat.x, DK.terrain.heightAt(flat.x, flat.z)+0.1, flat.z); p.vel.set(0,0,0); p.yaw=0; DK.tpCamera.yaw=Math.PI; p.action=null; p.busy=null; p.onGround=true; DK.sim(0.5, 1/60); };
   for (const dt of [1/15, 1/30, 1/60, 1/120]) {
     // yürüme (ileri 3 sn)
     run('yuru3s', dt, (h) => { reset(); const x0=p.pos.x, z0=p.pos.z; holdSim('KeyW', 3, h); DK.input.down.clear(); return +Math.hypot(p.pos.x-x0, p.pos.z-z0).toFixed(3); });
     // sprint (shift+ileri 3 sn)
     run('sprint3s', dt, (h) => { reset(); const x0=p.pos.x, z0=p.pos.z; DK.input.down.add('ShiftLeft'); holdSim('KeyW', 3, h); DK.input.down.clear(); return +Math.hypot(p.pos.x-x0, p.pos.z-z0).toFixed(3); });
     // zıplama: azami yükseklik ve havada kalma süresi
     run('zipla', dt, (h) => { reset(); const y0=p.pos.y; DK.input.pressedSet.add('Space'); DK.input.down.add('Space'); let maxY=0, air=0, t=0; for (let i=0;i<Math.round(2/h);i++){ DK.game.update(h); DK.input.endFrame(); DK.input.down.delete('Space'); maxY=Math.max(maxY, p.pos.y-y0); if (!p.onGround) air+=h; } return { maxY: +maxY.toFixed(3), air: +air.toFixed(3) }; });
     // kaçınma (yuvarlanma) mesafesi
     run('kacin', dt, (h) => { reset(); p.stamina=100; const x0=p.pos.x, z0=p.pos.z; DK.input.pressedSet.add('KeyV'); DK.input.down.add('KeyV'); DK.input.down.add('KeyW'); DK.sim(1.2, h); DK.input.down.clear(); return +Math.hypot(p.pos.x-x0, p.pos.z-z0).toFixed(3); });
   }
   return out;
 })()`},
 {js: `(async()=>{
   const out = {};
   const s = DK.G.ship, p = DK.G.player;
   await DK.terrain.prepare(600, -6200, {radius: 250});
   for (const dt of [1/15, 1/30, 1/60, 1/120]) {
     s.x=600; s.z=-6200; s.yaw=0.4; s.vx=0; s.vz=0; s.speed=0; s.lateral=0; s.yawRate=0; s.anchored=false; s.anchorState='up'; s.anchorT=0; s.anchorPt=null; s.sail=s.sailTarget=1; s.rudder=0; s.rudderInput=0; s.updateTransform(0);
     p.boardShip(s, s.model.stations.helm.clone());
     DK.sky.windDir = 0.6; DK.sky.windTarget = 0.6; DK.sky.windStrength = 0.55;
     const x0=s.x, z0=s.z;
     DK.sim(12, dt);
     const d = Math.hypot(s.x-x0, s.z-z0);
     // dönüş: dümen tam sancak 8 sn
     s.setRudder(1); const yaw0=s.yaw; DK.sim(8, dt); s.setRudder(0);
     out[String(Math.round(1/dt))+'fps'] = { gemi12s: +d.toFixed(2), hiz: +s.speed.toFixed(3), donus8s_derece: +((s.yaw-yaw0)*180/Math.PI).toFixed(1) };
   }
   return out;
 })()`},
 {js: `(()=>{
   // rijit cisim: sandık düşüşü (bodies) farklı dt ile
   const out = {};
   const T = DK.THREE;
   for (const dt of [1/15, 1/30, 1/60, 1/120]) {
     const m = new T.Mesh(new T.BoxGeometry(0.5,0.5,0.5)); DK.engine.scene.add(m);
     const b = DK.bodies.add(m, { pos: new T.Vector3(-60, 20, 120), vel: new T.Vector3(3, 0, 0), radius: 0.3, offsetY: 0.3, mass: 1, restitution: 0.3, friction: 0.7 });
     let t=0; while (t < 4) { DK.bodies.update(dt); t += dt; }
     out[String(Math.round(1/dt))+'fps'] = { x: +b.pos.x.toFixed(3), y: +b.pos.y.toFixed(3), sleeping: b.sleeping };
     DK.bodies.remove(b); DK.engine.scene.remove(m);
   }
   return out;
 })()`},
]
