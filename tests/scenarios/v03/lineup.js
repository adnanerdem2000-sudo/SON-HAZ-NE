[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 1500, js: `DK.sky.hour=11; DK.sky.setWeather('acik', true); const p=DK.G.player; p.pos.set(0, 4, 230); p.yaw=Math.PI; DK.sim(0.5);
  const apps = [
   {gender:'m', body:'kaba', hat:'tricorn', hatColor:'#2a2a2a', shirtColor:'#7a1f1f', pantsColor:'#3b2a1a', eyepatch:'sol', earring:'altin', cape:'yok'},
   {gender:'m', body:'subay', hat:'kaptan', hatColor:'#1f3a5a', shirtColor:'#1f3a5a', pantsColor:'#e8dcc2', beard:'biyik', cape:'var', necklace:'madalyon'},
   {gender:'f', body:'cevik', hat:'bandana', hatColor:'#a33a2a', shirtColor:'#2a5a7a', pantsColor:'#6b4a2c', earring:'altin'},
   {gender:'f', body:'kukuleta', hat:'orijinal', shirtColor:'#2f4f2f', pantsColor:'#3b2a1a', cape:'var'},
   {gender:'m', body:'kahin', hat:'korsan', hatColor:'#3b2a1a', shirtColor:'#5a2a5a', coat:'uzun', coatColor:'#5a2a5a'},
   {base:'sk_warrior', hat:'orijinal'}, {base:'sk_minion'}, {base:'sk_rogue', hat:'orijinal'}, {base:'sk_mage', hat:'orijinal'}
  ];
  window.__chars = [];
  const base = DK.G.player.appearance || {};
  apps.forEach((a, i) => { const c = new DK.Character({ ...base, ...a }); c.root.position.set(-8 + i * 2, DK.terrain.heightAt(-8 + i*2, 214), 214); c.root.rotation.y = 0; DK.engine.scene.add(c.root); c.play('Idle', 0); window.__chars.push(c); });
  DK.engine.updaters.add((dt)=>{ for (const c of window.__chars) c.update(dt); });
  p.char.root.visible = false;
  DK.G.noCamera = true;
  'lineup'`},
 {wait: 500, js: `const cam=DK.engine.camera; DK.game._camera = () => {}; cam.position.set(0, 4.4, 223.5); cam.lookAt(0, 3.4, 214); cam.fov=55; cam.updateProjectionMatrix(); 'cam'`},
 {wait: 800, shot: '/tmp/preview/p2/lineup.png'},
 {js: `for (const c of window.__chars) c.play('1H_Melee_Attack_Slice_Diagonal', 0.1); 'atk'`},
 {wait: 350, shot: '/tmp/preview/p2/lineup_atk.png'},
]
