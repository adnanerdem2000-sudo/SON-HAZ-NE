// enemies.js:551-554 görüş konisi formülünün kopyası (yaw=0, +z'ye bakan düşman; haydut fov=125)
const wrapAngle = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const fov = 125;
for (const [name, dx, dz] of [['önde 15 m', 0, 15], ['60° yanda 15 m', 15 * Math.sin(1.047), 15 * Math.cos(1.047)], ['65° yanda 15 m', 15 * Math.sin(1.134), 15 * Math.cos(1.134)], ['arkada 15 m', 0, -15], ['arkada 3 m', 0, -3], ['arkada 3,5 m', 0, -3.5]]) {
  const d = Math.hypot(dx, dz); const ang = Math.abs(wrapAngle(Math.atan2(dx, dz) - 0)) * 2 * 180 / Math.PI;
  const near = d < 3.2; console.log(name, 'ang=', ang.toFixed(1), 'inFov=', ang < fov || near);
}
