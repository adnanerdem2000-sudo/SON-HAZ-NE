const STEP = 1/60, MAX_SUB = 6, GRAV = -22;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sub = (dt) => { const n = clamp(Math.ceil(dt / STEP - 1e-6), 1, MAX_SUB); return { n, h: dt / n }; };
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
// Chrome 100 µs kabalaştırma: zaman damgaları 0,1 ms'ye yuvarlanır (gerçek vsync 16,6667 ms)
function frames(N, period = 1000/60, q = 0.1, phase = 0) { const out = []; let prev = Math.floor(phase/q)*q; for (let k = 1; k <= N; k++) { const t = Math.floor((phase + k*period)/q)*q; out.push((t - prev)/1000); prev = t; } return out; }
const fr = frames(600, 1000/60, 0.1, 3.3);
const n2 = fr.filter(d => sub(d).n === 2).length;
console.log('Chrome 0,1 ms: 600 karede n=2 olan kare', n2, 'farklı dt', [...new Set(fr.map(d=>d.toFixed(4)))]);
const frF = frames(600, 1000/60, 1.0, 0.4);
console.log('Firefox 1 ms: 600 karede n=2 olan kare', frF.filter(d => sub(d).n === 2).length, [...new Set(frF.map(d=>d.toFixed(4)))]);
// alt adım/sn
const subsPerSec = (fr) => fr.reduce((a,d)=>a+sub(d).n,0) / fr.reduce((a,d)=>a+d,0);
console.log('alt adım/sn Chrome', subsPerSec(fr).toFixed(1), 'Firefox', subsPerSec(frF).toFixed(1));
// zıplama tepe ve geri tepme dağılımı farklı başlangıç evrelerinde
function jumpSeq(seq) { let vy=7.4,y=0,mx=0; for (const dt of seq){ const {n,h}=sub(dt); for(let i=0;i<n;i++){ vy+=GRAV*h; y+=vy*h; if(y>mx)mx=y; } if (y<0) break; } return mx; }
function knockSeq(seq) { let vx=0,x=0,kx=2.7,t=0; const damp=(a,b,l,h)=>a+(b-a)*(1-Math.exp(-l*h)); for (const dt of seq){ if (t>=1.5) break; const {n,h}=sub(dt); for(let i=0;i<n;i++){ vx=damp(vx,0,13,h); if(kx!==null){ vx+=kx*60*h; kx*=Math.exp(-9*h); if(Math.abs(kx)<0.1)kx=null;} x+=vx*h; } t+=dt; } return x; }
const J=[],K=[];
for (let s=0;s<200;s++){ const seq=frames(200,1000/60,0.1,s*0.0137*1000/60); J.push(jumpSeq(seq)); K.push(knockSeq(seq)); }
console.log('Chrome 60 Hz zıplama tepe min/maks', Math.min(...J).toFixed(3), Math.max(...J).toFixed(3), ' geri tepme min/maks', Math.min(...K).toFixed(3), Math.max(...K).toFixed(3));
// top nişanı: kare başına aynı fare hareketi, n kez uygulanıyor
const look=0.01; let yawSum=0; for (const d of fr.slice(0,60)) yawSum += look*sub(d).n; console.log('60 karede top nişanı dönüşü (beklenen 0,60 rad):', yawSum.toFixed(2));
