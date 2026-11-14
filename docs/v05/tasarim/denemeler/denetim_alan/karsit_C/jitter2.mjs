const STEP = 1/60, MAX_SUB = 6, GRAV=-22;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sub = (dt) => { const n = clamp(Math.ceil(dt / STEP - 1e-6), 1, MAX_SUB); return { n, h: dt / n }; };
function frames(N, period, q, phase = 0) { const out = []; let prev = Math.floor(phase/q)*q; for (let k = 1; k <= N; k++) { const t = Math.floor((phase + k*period)/q)*q; out.push((t - prev)/1000); prev = t; } return out; }
function jumpSeq(seq) { let vy=7.4,y=0,mx=0; for (const dt of seq){ const {n,h}=sub(dt); for(let i=0;i<n;i++){ vy+=GRAV*h; y+=vy*h; if(y>mx)mx=y; } if (y<0) break; } return mx; }
for (const fps of [60, 30, 20, 15]) {
  for (const q of [0.1, 1.0]) {
    const fr = frames(600, 1000/fps, q, 0.37);
    const hist = {}; for (const d of fr) { const n = sub(d).n; hist[n] = (hist[n]||0)+1; }
    const J=[]; for (let s=0;s<50;s++) J.push(jumpSeq(frames(200,1000/fps,q,s*0.731)));
    console.log(fps+' FPS, q='+q+' ms: n dağılımı', JSON.stringify(hist), 'alt adım/sn', (fr.reduce((a,d)=>a+sub(d).n,0)/fr.reduce((a,d)=>a+d,0)).toFixed(1), 'zıplama tepe', Math.min(...J).toFixed(3)+'–'+Math.max(...J).toFixed(3));
  }
}
