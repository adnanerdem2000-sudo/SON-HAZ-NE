[
 {js: `const out={}; for (const n of ['demon','orc_brute','yeti','zombie','wolf','fox','deer','stag','husky','cat','ghost','skeleton','crab','bat']) { try { out[n]=DK.assets.animations(n).map(c=>c.name.split('|').pop()+':'+c.duration.toFixed(1)).join(','); } catch(e) { out[n]='ERR '+e.message; } } out`},
]
