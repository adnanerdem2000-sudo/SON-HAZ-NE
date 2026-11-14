// Hakem: B'nin Kor Kulesi gayzer fırlatması — yatay yol (damp oranı 2.5/s), 4.4 m'lik kata iniş anı
const G = -22, V0 = 16, H = 4.4, rate = 2.5;
for (const w of [2.2, 4.4, 7.0]) {
  // dikey: y(t) = V0 t + G t²/2 ; iniş kat yüksekliğinde (inişte)
  const tDown = (V0 + Math.sqrt(V0 * V0 + 2 * G * H)) / -G; // ikinci kök
  const tUp = (V0 - Math.sqrt(V0 * V0 + 2 * G * H)) / -G;
  const x = (t) => w * (t - (1 - Math.exp(-rate * t)) / rate);
  console.log(`wish ${w} m/s: kat hizasını yükselirken t=${tUp.toFixed(2)} s, x=${x(tUp).toFixed(2)} m; inerken t=${tDown.toFixed(2)} s, x=${x(tDown).toFixed(2)} m; tepe ${(V0 * V0 / (-2 * G)).toFixed(2)} m`);
}
