// checkT dizisi: 0.5'ten başlayıp h=(1/30)/2 alt adımlarıyla azalır; kaçıncı çıkarmada <=0 olur?
const h = (1/30)/2;
console.log('h === 1/60 ?', h === 1/60);
let c = 0.5, k = 0;
while (c > 0) { c -= h; k++; }
console.log('reset sonrası denetime kadar alt adım:', k, 'kalan', c);
let c2 = 0.5; for (let i=0;i<30;i++) c2 -= h; console.log('0.5 - 30 adım =', c2);
// Kapalı biçim
console.log('0.5 - 30*(1/60) =', 0.5 - 30*(1/60));
// 09 döngüsü: kraken x3, tas x3, volkan x3; her döngü: spawn, sim(0.5)=30 alt adım, M, clear, sim(0.2)=? alt adım
const n02 = Math.round(0.2/(1/30)); console.log('sim(0.2) çağrı sayısı', n02, '-> alt adım', n02*2);
// Bütün başlangıç evreleri için (checkT değeri 0.5 - j*h ya da rastgele sürekli), hangi döngülerde boss ölçüm karesinde yaşıyor
function run(c0, tasNear) {
  let c = c0; const res = [];
  const bosses = ['kraken','kraken','kraken','tas','tas','tas','volkan','volkan','volkan'];
  for (const b of bosses) {
    let alive = true;
    for (let i=0;i<30;i++) { c -= h; if (c <= 0) { c = 0.5; if (!(b==='tas' && tasNear)) alive = false; } }
    res.push(alive?1:0);
    for (let i=0;i<12;i++) { c -= h; if (c <= 0) { c = 0.5; } }
  }
  return res;
}
const hist = {};
const N = 100000;
for (let t=0;t<N;t++) {
  const c0 = Math.random()*0.5 + 1e-12;
  const r = run(c0, false);
  const v = r.slice(6);
  const dG5 = (v[0]===0 && (v[1]===1 || v[2]===1));
  const key = v.join('') + (dG5?' dG5':'');
  hist[key] = (hist[key]||0)+1;
}
for (const [k,v] of Object.entries(hist)) console.log(k, (v/N*100).toFixed(2)+'%');
