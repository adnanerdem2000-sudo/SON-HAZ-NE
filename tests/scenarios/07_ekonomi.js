// B01/B07: al-sat döngüsü ve 'Tümünü sat' kapsamı
[
 {js: `DK.G.noAutoPause=true; DK.handlers.startGame({kind:'solo', slot:2, data:null}); 'ok'`},
 {wait: 4000, expect: {js: `DK.G.state`, eq: 'playing', label: 'Oyun başladı'}},
 {expect: {js: `(async()=>{ const M=await import('/js/economy/shop.js'); const roles=Object.keys(M.MERCHANTS); const out=[]; let exploit=false; for (const role of roles) { for (const id of (M.MERCHANTS[role].sells||[])) { const buy=M.buyPrice(id, role); const stack={id, n:1}; for (const r2 of roles) { const sell=M.sellPrice(stack, r2); if (sell >= buy) { exploit=true; out.push([id, role, buy, r2, sell]); } } } } window._eco={exploit, roles, pairs: out.slice(0,8)}; return !exploit; })()`, truthy: true, label: 'B01 Hiçbir tüccar çifti için satış fiyatı alış fiyatına ulaşmıyor (al-sat döngüsü yok)'}},
 {js: `window._eco`},
 {expect: {js: `(async()=>{ const p=DK.G.player; const inv=p.inv; p.inv.gold=5000; for (const id of ['usta_kilic','durbun','mermi','gulle']) inv.add(id, 1); inv.add('hazine_haritasi', 1, {site:'tst'}, true); inv.add('inci', 2); const before=inv.stacks.map(s=>s.id); const M=await import('/js/economy/shop.js'); const role=Object.keys(M.MERCHANTS).find(r=>M.sellPrice({id:'inci',n:1}, r)>0) || 'trader'; M.shop.sellAll(role); const after=inv.stacks.map(s=>s.id); window._sellAll={role, before, after}; return ['usta_kilic','durbun','mermi','gulle','hazine_haritasi'].every(id=>after.includes(id)) && !after.includes('inci'); })()`, truthy: true, label: 'B07 Tümünü sat: usta kılıç, dürbün, mermi, gülle ve hazine haritası kalır; inci satılır'}},
 {js: `window._sellAll`},
]
