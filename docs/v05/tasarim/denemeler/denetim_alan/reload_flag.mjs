// Mantık kopyası (salt-okur): quests.js:276-290 hikâye boss tetikleyicileri + save/start (121-124, 76-79) + enemies.start listeyi boşaltır
function tick(q, p, list) {
  const d = Math.hypot(p.x + 520, p.z + 440);
  let spawned = false;
  if (q.stage === 3 && !q.flags.morvanSpawn && d < 45) { q.flags.morvanSpawn = true; list.push('iskelet_kaptan'); spawned = true; }
  if (q.stage === 3 && q.flags.morvanSpawn && !list.includes('iskelet_kaptan') && d > 200) q.flags.morvanSpawn = false;
  return spawned;
}
// 1) oyuncu harabeye yaklaşır, Morvan doğar; otomatik kayıt dövüş sırasında (konum harabe içinde)
const q = { stage: 3, flags: {} }; let list = [];
tick(q, { x: -520, z: -440 }, list);
const save = JSON.parse(JSON.stringify({ quests: { stage: q.stage, flags: q.flags }, player: { pos: { x: -515, z: -430 } } }));
// 2) yükleme: enemies.start() listeyi boşaltır, bayrak kayıttan gelir
const q2 = { stage: save.quests.stage, flags: save.quests.flags }; list = [];
let spawned = false; for (let s = 0; s < 600; s++) spawned = tick(q2, save.player.pos, list) || spawned; // 10 dk harabede bekle
console.log('yüklemeden sonra harabede 10 dk: Morvan doğdu mu?', spawned, 'bayrak', q2.flags.morvanSpawn);
// 3) 200 m uzaklaşıp dönünce
tick(q2, { x: -520 + 210, z: -440 }, list); const again = tick(q2, { x: -520, z: -440 }, list);
console.log('>200 m uzaklaşıp dönünce doğdu mu?', again);
