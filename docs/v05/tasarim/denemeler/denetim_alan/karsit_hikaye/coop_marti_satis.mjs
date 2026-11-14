// Mantık kopyası (salt-okur): quests.js:138-147 (treasureFound/chestSold), treasure.js:208-239 (kazı yalnız ev sahibinde çözülür),
// shop.js:138-160 (chestSold yalnız satan istemcide), net.js:339-357/602-609 (ev sahibine yalnız chestGone/hold gider)
const mk = () => ({ stage: 1, flags: {} });
const host = mk(), guest = mk();
const onTreasureFound = (q, site) => { if (site === 'marti_1') q.flags.ilkHazineBulundu = true; };
const onChestSold = (q) => { if (q.stage === 1 && q.flags.ilkHazineBulundu) { q.flags.ilkSatis = true; q.stage = 2; return true; } return false; };
// konuk Martı'yı kazar → netDig → ev sahibi resolveDig → treasureFound YALNIZ ev sahibinde
onTreasureFound(host, 'marti_1');
// konuk sandığı taşıyıp Sedef Hanım'a satar → chestSold YALNIZ konukta; ev sahibine yalnız netChestGone gider
const adv = onChestSold(guest);
console.log('konuk satti -> konuk asama', guest.stage, 'ilerledi mi', adv, '| ev sahibi asama', host.stage, 'ev sahibi bayrak', JSON.stringify(host.flags));
