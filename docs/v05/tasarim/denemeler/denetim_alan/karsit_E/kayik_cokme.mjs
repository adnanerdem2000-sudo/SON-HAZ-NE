// net.js'deki ilgili satırların birebir kopyası: _boatCmd (634-641), 'boatSt' (365), _hostSnapshot m.rb (740), main.js:117-123 güncelleyici
const b = { state: 'docked', x: 10, z: 20, yaw: 0, rowPhase: 0, cargo: [], driver: null, speed: 0 };
const pid = 'konuk1';
const _boatCmd = (m) => { if (m.cmd === 'launch' && b.state === 'docked') b.state = 'water'; if (m.cmd === 'dock') b.state = 'docked'; if (m.cmd === 'driver') b.driver = m.who; };
const boatSt = (m) => { if (b && b.driver === pid) { b.x = m.x; b.z = m.z; b.yaw = m.yaw; b.speed = m.sp; b.rowPhase = m.rp; b.state = 'water'; } };
const hostSnapshot = () => { const m = { t: 'snap' }; m.rb = [b.state, +b.x.toFixed(2), +b.z.toFixed(2), +b.yaw.toFixed(3), +b.rowPhase.toFixed(2), b.cargo, b.driver]; return m; };
let pressedCleared = 0;
const updater = () => { /* game.update; hud.update; */ hostSnapshot(); /* net.update içinde */ pressedCleared++; /* input.endFrame() */ };
const engineFrame = () => { try { updater(); return 'ok'; } catch (e) { return 'HATA: ' + e.message; } }; // engine.js:65-67
console.log('normal kare:', engineFrame(), '| endFrame çağrısı:', pressedCleared);
_boatCmd({ cmd: 'driver', who: pid });                 // konuk kendini sürücü yapar (doğrulama yok)
boatSt({ x: 'a', z: 0, yaw: 0, sp: 0, rp: 0 });         // tek sahte iletiyle sayı olmayan x
for (let i = 0; i < 3; i++) console.log('kare', i + 1, ':', engineFrame(), '| endFrame çağrısı:', pressedCleared);
// Kazara yol: konukta NaN olan sayı JSON'da null olur
boatSt(JSON.parse(JSON.stringify({ x: NaN, z: 0, yaw: 0, sp: 0, rp: 0 })));
console.log('NaN→null sonrası kare:', engineFrame());
