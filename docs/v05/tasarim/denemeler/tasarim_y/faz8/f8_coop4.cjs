// FAZ 8 taban: dört oyunculu co-op performans ölçümü (gerçek PeerJS, yerel sinyal sunucusu, SwiftShader).
// Çalıştırma: /home/user/devtools/tk node /home/user/SON-HAZ-NE/tests/harness/coop.cjs /tmp/tasarim_y/faz8/f8_coop4.cjs --players 4 --size 480x270 --timeout 1100 --url "http://localhost:8080/index.html?peerhost=127.0.0.1&peerport=9000" --report /tmp/tasarim_y/faz8/f8_coop4.json
const fs = require('fs');
module.exports = async ({ pages, host, guests, ev: ev0, tick: tick0, check, log }) => {
  const TOOLS = fs.readFileSync('/tmp/tasarim_y/faz8/tools.js', 'utf8');
  const t0 = Date.now();
  const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const ev = (p, js, label) => { let to; return Promise.race([ev0(p, js, label).finally(() => clearTimeout(to)), new Promise((r) => { to = setTimeout(() => { console.log('EV-TIMEOUT', stamp(), label || js.slice(0, 60)); r(undefined); }, 90000); })]); };
  const tick = async (sec) => { await Promise.race([tick0(sec), new Promise((r) => setTimeout(r, 240000))]); };
  const room = await ev(host, `DK.net.host({name:'Faz8 Olcum', public:false, max:4, pw:'', difficulty:'normal', slot:2}).then(r=>({code:r.code}))`, 'host');
  for (const g of guests) { await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'join'); await host.waitForTimeout(600); }
  await host.waitForTimeout(1000);
  await ev(host, `DK.handlers.startOnlineHost(DK.net.room).then(()=>'host-started')`, 'hs');
  await host.waitForTimeout(1000);
  for (const g of guests) await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs');
  for (const pg of pages) await ev(pg, `DK.engine.fpsLimit = 0.01; 'lim'`);
  await tick(2);
  // katılamayan konuk için bir yeniden deneme (06c'deki bilinen katılma hatası: Faz 5)
  for (let attempt = 0; attempt < 2; attempt++) {
    const states = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
    const bad = guests.filter((g, i) => states[i + 1] !== 'playing');
    if (!bad.length) break;
    log('yeniden katılma: ' + bad.map((b) => b.playerName).join(','));
    for (const g of bad) { await ev(g, `DK.net.join('${room.code}','').then(r=>({room:r.room.name})).catch(e=>({err:String(e)}))`, 'rejoin'); await host.waitForTimeout(800); await ev(g, `DK.G.state === 'playing' ? 'already' : DK.handlers.startOnlineGuest().then(()=>'guest-started')`, 'gs2'); await ev(g, `DK.engine.fpsLimit = 0.01; 'lim'`); }
    await tick(2);
  }
  const states = await Promise.all(pages.map((p) => ev(p, `DK.G.state`)));
  const remotes = await Promise.all(pages.map((p) => ev(p, `DK.G.remotes.size`)));
  check('C8-01 oyuncular oyunda (ölçüm koşulu)', states.filter((s) => s === 'playing').length >= 3, { states, remotes });
  // konuklar ev sahibinin yanına (liman) — hepsi aynı alanda: en kötü durum (3 uzak avatar görünür, hayvan/düşman paylaşımı)
  const hp = await ev(host, `(()=>{ const p=DK.G.player; DK.events.eventT=1e9; DK.sky.hour=11; DK.sky.locked=true; return [p.pos.x, p.pos.y, p.pos.z]; })()`);
  for (let i = 0; i < guests.length; i++) await ev(guests[i], `(()=>{ const p=DK.G.player; if (!p) return 'yok'; p.mode='ground'; p.ship=null; p.pos.set(${hp[0]}+2+${i}*1.5, ${hp[1]}, ${hp[2]}+3); p.vel.set(0,0,0); return 'ok'; })()`);
  await tick(3);
  for (const pg of pages) await ev(pg, TOOLS);
  // ağ trafiği sayacı: net.send/broadcast sarılır (JSON uzunluğu, bayt yaklaşığı)
  for (const pg of pages) await ev(pg, `(()=>{ const n=DK.net; window._tx={n:0,b:0,byT:{}}; for (const k of ['broadcast','toHost','toPeer']) { const f=n[k]; if (typeof f!=='function' || f._w) continue; const w=function(...a){ try { const m=k==='toPeer'?a[1]:a[0]; const mult=k==='broadcast'?Math.max(0,[...n.conns.keys()].filter(id=>id!==a[1]).length):1; if (m && typeof m==='object') { const L=JSON.stringify(m).length*mult; window._tx.n+=mult; window._tx.b+=L; const t=m.t||'?'; window._tx.byT[t]=(window._tx.byT[t]||0)+L; } } catch(e){} return f.apply(this,a); }; w._w=true; n[k]=w; } return 'ok'; })()`, 'netfn');
  const w0 = Date.now();
  await tick(5);
  const dtSec = (Date.now() - w0) / 1000;
  const meas = [];
  for (const [i, pg] of pages.entries()) {
    const r = await ev(pg, `(async()=>{ if (DK.G.state!=='playing') return {state:DK.G.state}; const r=await window._full('coop_'+${i}, 4, 0.3); return { rol: DK.G.isHost?'host':'konuk', calls:r.calls, tris:r.tris, mainCalls:r.mainCalls, shadowCalls:r.shadowCalls, progs:r.progs, simMs:r.simMsPerFrame, per:r.per, uzak:DK.G.remotes.size, hayvan:DK.animals.list.length, dusman:DK.enemies.list.length, tx:window._tx, groups:r.groups.slice(0,16), scan:{med:r.scan.callsMed, max:r.scan.callsMax} }; })()`, 'olcum' + i);
    if (r && r.tx) r.txKBps = +(r.tx.b / 1024 / dtSec).toFixed(1);
    meas.push(r);
  }
  // ev sahibinde hayvan güncellemesi: G.online (co-op) iken 250 m sınırı yok (animals.js:810)
  const au = await ev(host, `(()=>{ const n=120; let t0=performance.now(); for (let k=0;k<n;k++) DK.animals.update(1/60); const on=(performance.now()-t0)/n; const o=DK.G.online; DK.G.online=false; t0=performance.now(); for (let k=0;k<n;k++) DK.animals.update(1/60); const off=(performance.now()-t0)/n; DK.G.online=o; return {coop:+on.toFixed(3), tek:+off.toFixed(3), hayvan:DK.animals.list.length}; })()`, 'hayvan');
  check('C8-02 ölçüm alındı', meas.filter((m) => m && m.calls).length >= 2, { meas, au, sure: dtSec });
  log('bitti @ ' + stamp());
};
