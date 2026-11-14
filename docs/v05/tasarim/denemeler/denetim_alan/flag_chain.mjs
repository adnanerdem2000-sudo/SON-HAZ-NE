// Mantık kopyası (salt-okur): quests.js:76-94/127-135/297-301, main.js:193/336, net.js:174/326-332 satırlarının davranışı
const host = { stage: 0, flags: {} };                       // yeni dünya (ev sahibi)
const guestSave = { stage: 5, flags: { ilkHarita: true, ilkHazineBulundu: true, ilkSatis: true, gunluk: true, morvanSpawn: true, parca1: true, kizilSpawn: true, kizilYenildi: true } }; // başka dünyadan kalan konuk kaydı (dksh.guest.0 → quests.save())
// konuk quests.start(data) → this.flags = d.flags (quests.js:79)
const guest = { stage: guestSave.stage, flags: guestSave.flags };
// applyWorld (main.js:336): stage ev sahibinden, bayraklar BİRLEŞİM
guest.stage = host.stage; guest.flags = Object.assign(guest.flags || {}, host.flags || {});
// konuk Tuzla ile konuşur: advance(1) → netStory {stage:1, flags: this.flags} → toHost (net.js:174)
const advance = (q, to) => { if (to <= q.stage) return false; q.stage = to; return true; };
advance(guest, 1); const msg = { t: 'story', stage: guest.stage, flags: guest.flags };
// ev sahibi (net.js:326-332)
const to = Math.round(Math.max(0, Math.min(99, msg.stage)));
for (const k in msg.flags) if (msg.flags[k] === true && typeof k === 'string' && k.length < 40) host.flags[k] = true;
if (to === host.stage + 1) advance(host, to);
console.log('ev sahibi aşama', host.stage, 'bayraklar', JSON.stringify(host.flags));
// ev sahibi aşama 2'ye ulaştığında günlük etkileşimi (quests.js:297): stage >= 2 && !flags.gunluk
host.stage = 2;
console.log('aşama 2: günlük alma istemi sunulur mu?', host.stage >= 2 && !host.flags.gunluk, '→ advance(3) yalnız takeJournal içinde (quests.js:316)');
console.log('defter parça sayısı (journal.js:114):', (host.flags.parca1 ? 1 : 0) + (host.flags.kizilYenildi ? 1 : 0), '/4 — hiç boss yenilmeden');
