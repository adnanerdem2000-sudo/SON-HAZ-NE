// Bağımsız kopya: enemies.js _setState (600-604), _startMelee (901-925), _attackUpdate (941-977) — art arda (zincir) saldırının hazırlık süresi
const MOVES = {
  twoh: [{ anim: 'Atk2H', speed: 1.0, dur: 1.1, hitAt: 0.52 }, { anim: 'Stab2H', speed: 1.2, dur: 1.35, hitAt: 0.62 }, { anim: 'Heavy2H', speed: 0.82, dur: 2.0, hitAt: 1.15, unblockable: true, w: 0.6 }],
  dual: [{ anim: 'DualSlice', dur: 0.95, hitAt: 0.4 }, { anim: 'DualChop', dur: 1.05, hitAt: 0.47 }, { anim: 'DualStab', dur: 1.15, hitAt: 0.55 }],
  sword1h: [{ dur: 0.9, hitAt: 0.42 }, { dur: 0.95, hitAt: 0.44 }, { dur: 1.05, hitAt: 0.52 }, { dur: 1.2, hitAt: 0.58 }],
};
const SPIN = { dur: 2.2, hitAt: 0.7, hits: [0.7, 1.15, 1.6], unblockable: true };
function sim(T, forceChain, pickIdx, pickChainIdx) {
  const e = { state: 'chase', stateT: 0, chained: false, enraged: false, T, log: [] };
  const setState = (s) => { if (e.state === s) return; e.state = s; e.stateT = 0; };
  let pickCount = 0;
  const startMelee = (now) => {
    const set = MOVES[T.moves];
    const mv = pickCount++ === 0 ? set[pickIdx] : (pickChainIdx === 'spin' ? SPIN : set[pickChainIdx]);
    e.move = mv; e.hitIdx = 0; setState('attack');
    e.atkDur = mv.dur; e.atkHit = (mv.hits || [mv.hitAt]).slice();
    e.log.push({ ev: 'start', t: +now.toFixed(3), chained: e.chained, stateTatStart: +e.stateT.toFixed(3), unblockable: !!mv.unblockable });
  };
  const dt = 1 / 60; let now = 0;
  startMelee(now);
  for (let i = 0; i < 400; i++) {
    now += dt; e.stateT += dt;
    if (e.state !== 'attack') continue;
    const t = e.stateT;
    while (e.hitIdx < e.atkHit.length && t >= e.atkHit[e.hitIdx]) { e.hitIdx++; e.log.push({ ev: 'HIT', t: +now.toFixed(3) }); }
    if (t >= e.atkDur) {
      if ((T.moves === 'dual' || T.boss) && forceChain && !e.chained) { e.chained = true; startMelee(now); continue; }
      e.chained = false; setState('chase'); e.log.push({ ev: 'end', t: +now.toFixed(3) }); break;
    }
  }
  // zincir saldırısının başlangıcı ile ilk vuruşu arasındaki süre
  const s2 = e.log.findIndex((x) => x.ev === 'start' && x.chained);
  const h2 = e.log.slice(s2 + 1).find((x) => x.ev === 'HIT');
  return { log: e.log.map((x) => x.ev + '@' + x.t + (x.chained ? '(zincir,stateT=' + x.stateTatStart + (x.unblockable ? ',savuşturulamaz' : '') + ')' : '')).join(' '), zincirHazirlik: s2 >= 0 && h2 ? +(h2.t - e.log[s2].t).toFixed(3) : null };
}
console.log('Hayalet Kaptan / Amiral (twoh, boss): Atk2H -> zincir Heavy2H:', JSON.stringify(sim({ boss: true, moves: 'twoh' }, true, 0, 2)));
console.log('Morvan / Amiral: Atk1 -> zincir SPIN:', JSON.stringify(sim({ boss: true, moves: 'sword1h' }, true, 0, 'spin')));
console.log('Avcı (dual): DualSlice -> zincir DualStab:', JSON.stringify(sim({ moves: 'dual' }, true, 0, 2)));
console.log('Karşılaştırma, zincirsiz ilk saldırı hazırlığı (Avcı DualSlice):', JSON.stringify(sim({ moves: 'dual' }, false, 0, 0)));
