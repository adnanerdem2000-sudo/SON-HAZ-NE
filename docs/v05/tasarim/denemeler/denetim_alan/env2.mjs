const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
for (const k of Object.keys(W)) { const v = W[k]; if (Array.isArray(v)) console.log(k, v.length); }
