const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-watchdog','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
 const url = 'http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000';
 let errs = 0;
 const mk = async (name) => {
   const ctx = await b.newContext({viewport:{width:640,height:360}});
   const p = await ctx.newPage();
   p.on('console',m=>{const t=m.text(); if(m.type()==='error' && !/404/.test(t)) { errs++; console.log(name,'ERR:',t.slice(0,300)); }});
   p.on('pageerror',e=>{ errs++; console.log(name,'PAGEERR:',e.message,(e.stack||'').split('\n').slice(0,3).join(' | ')); });
   await p.goto(url);
   await p.waitForFunction('window.__ready',null,{timeout:240000});
   await p.evaluate(`DK.G.noAutoPause=true; DK.G.profile.appearance.name='${name}';`);
   return p;
 };
 const host = await mk('Kaptan');
 const guest = await mk('Tayfa');
 const ev = async (p, js, label) => { try { const r = await p.evaluate(js); if (label) console.log(label, JSON.stringify(r)?.slice(0,700)); return r; } catch(e) { console.log('EVALERR', label, e.message.slice(0,400)); } };
 const tick = async (sec=1) => { for (let i=0;i<sec*5;i++) { await ev(host,'DK.sim(0.2)'); await ev(guest,'DK.sim(0.2)'); await host.waitForTimeout(40); } };
 const room = await ev(host, `DK.net.host({name:'Test Odası', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
 await ev(guest, `DK.net.join('${room.code}','').then(r=>({room:r.room.name}))`, 'join');
 await host.waitForTimeout(500);
 await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
 await guest.waitForTimeout(800);
 await ev(guest, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
 await tick(2);
 const gid = await ev(guest, `DK.G.myId`, 'guest-id');
 await ev(host, `({remotes:[...DK.G.remotes.keys()]})`, 'host-remotes');
 // 1) çevre: kamp fıçısını ev sahibi ateşler, konukta da patlar
 await ev(host, `(()=>{ const k = DK.hazards.list('keg')[0]; DK.G.player.pos.set(k.x+25, DK.terrain.heightAt(k.x+25,k.z+25), k.z+25); DK.hazards.ignite(k, 0.3, true); return k.id; })()`, 'h-ignite');
 await tick(1.5);
 await ev(guest, `DK.hazards.list('keg').map(k=>k.state)`, 'g-kegs');
 // 2) deneyim: ev sahibi, konuğun öldürdüğü bir haydudu bildirir
 const xp0 = await ev(guest, `DK.progress.level*100000 + DK.progress.xp`, 'g-xp0');
 await ev(host, `DK.G.emit('enemyKilled', { type: 'haydut', by: '${gid}' }); DK.progress.xp`, 'h-kill');
 await tick(1);
 await ev(guest, `({lvl: DK.progress.level, xp: DK.progress.xp})`, 'g-xp1');
 // 3) deniz devleri + buzdağı senkronu
 await ev(host, `(async()=>{ const s=DK.G.ship; const p=DK.G.player; s.x=600; s.z=-6200; s.anchored=true; s.anchorState='down'; s.anchorT=1; s.anchorPt=null; await DK.terrain.prepare(s.x, s.z, {radius:250}); s.updateTransform(0); p.pos.set(600, 2, -6200); p.mode='swim'; DK.sim(0.5); DK.megafauna.debugSpawn('orka', 40); DK.worldEvents.trigger('iceberg'); return {mf: DK.megafauna.ents.length, ice: DK.worldEvents.icebergs.length}; })()`, 'h-sea');
 await ev(guest, `(async()=>{ await DK.terrain.prepare(600, -6200, {radius:250}); const p=DK.G.player; p.pos.set(605, 2, -6195); p.mode='swim'; return 'ok'; })()`, 'g-sea');
 await tick(3);
 await ev(guest, `({mf: DK.megafauna.ents.length, kinds: [...new Set(DK.megafauna.ents.map(e=>e.kind))], ice: DK.worldEvents.icebergs.length})`, 'g-sea-sync');
 // 4) konuk bir orkaya vurur → ev sahibinde hasar
 await ev(guest, `(()=>{ const e = DK.megafauna.ents.find(e=>e.kind==='orka'); if (!e) return 'none'; e.target.hurt(40, { attacker: DK.G.player }); return e.id; })()`, 'g-hit-orca');
 await tick(1);
 await ev(host, `DK.megafauna.ents.filter(e=>e.kind==='orka').map(e=>[e.id, e.target.hp])`, 'h-orca-hp');
 await ev(host, `({mode: DK.megafauna.groups.map(g=>g.kind+':'+g.mode)})`, 'h-pod-mode');
 console.log('errors:', errs);
 await b.close();
})();
