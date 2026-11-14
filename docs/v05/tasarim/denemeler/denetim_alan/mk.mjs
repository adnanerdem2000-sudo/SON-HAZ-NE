// net.js kopyasını import satırları olmadan ve saplamalarla çalıştırılabilir bir modüle dönüştürür (depoya dokunmaz)
import fs from 'fs';
const src = fs.readFileSync('/home/user/SON-HAZ-NE-w2/js/net/net.js', 'utf8');
const body = src.split('\n').filter((l) => !/^import /.test(l)).join('\n');
const stub = `
const THREE = globalThis.__THREE;
const { G, Character, enemies, bosses, isOnce, physics, terrain, animals, megafauna, hazards, worldEvents, progress, treasure, combat, effects, interact, quests, sky, time, weatherfx, events, audio, damp, dampAngle, clamp } = globalThis.__STUBS;
`;
fs.writeFileSync('/tmp/denetim_alan/net_copy.mjs', stub + body);
console.log('ok', body.length);
