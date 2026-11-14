const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
for (const sh of ['spire', 'swamp', 'glacier', 'atoll', 'volcano', 'mesa']) {
  console.log(sh, JSON.stringify(W.ISLANDS.filter(i => (i.shape || 'normal') === sh).map(i => `${i.id}(r${i.r}):${i.features.map(f => f.type + (f.auto ? '*' : '')).join('+') || '-'}`)));
}
