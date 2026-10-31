[
 {js: `const T=DK.THREE; const out={}; for (const n of ['tree_palm','tree_fat','tree_oak','bush_large','bush','flower_red','rock_large','rock_small','rock_tall','tree_pine','tree_pine_tall','crystal_rock','tree_dark','cactus','mushroom_red','campfire','log','barrel','crate','column_broken','obelisk','tree_autumn']) { const o=DK.assets.prop(n); const b=new T.Box3().setFromObject(o); const s=b.getSize(new T.Vector3()); out[n]=[s.x,s.y,s.z].map(v=>v.toFixed(2)).join('x'); } out`},
]
