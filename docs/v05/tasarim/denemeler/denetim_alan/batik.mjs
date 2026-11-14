const geo = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const H = geo.computeHeight;
const rows = [];
for (const I of W.ISLANDS) for (const f of I.features || []) if (f.type === 'beach_wreck') rows.push([I.id, f.auto ? 'oto' : 'v03', +H(f.x, f.z).toFixed(2), +H(f.x + 4, f.z + 2).toFixed(2)]);
rows.sort((a, b) => a[2] - b[2]);
console.log(rows.length, JSON.stringify(rows));
