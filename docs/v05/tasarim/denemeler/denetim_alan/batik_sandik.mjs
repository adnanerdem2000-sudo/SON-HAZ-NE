// Karaya oturmuş gemi: sandık (x+4, z+2) gövde çarpıştırıcısının (v0.4: 8,5×3,2; v0.3: 3×8) içinde kalıp erişilemez mi?
function frac(hw, hd, N = 100000) {
  let bad = 0; const pr = 0.33, R = 2.4;
  for (let i = 0; i < N; i++) {
    const yaw = (i / N) * 6.28; const c = Math.cos(yaw), s = Math.sin(yaw);
    const lx = 4 * c - 2 * s, lz = 4 * s + 2 * c; // physics._local
    const ex = hw + pr, ez = hd + pr;
    if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) continue; // dışarıda: erişilir
    const dmin = Math.min(ex - Math.abs(lx), ez - Math.abs(lz));
    if (dmin > R) bad++;
  }
  return bad / N;
}
console.log('v0.4 erişilemez oranı', frac(8.5, 3.2).toFixed(3), ' v0.3', frac(3, 8).toFixed(3));
console.log('26 batıktan en az birinin erişilemez olma olasılığı (v0.4)', (1 - Math.pow(1 - frac(8.5, 3.2), 26)).toFixed(3));
