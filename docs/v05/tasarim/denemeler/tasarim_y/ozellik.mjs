// Salt-okur: hikâyede kullanılacak özel adaların özellik konumları, boss alanları, kazı noktaları, yükseklikler
const A = await import('/home/user/SON-HAZ-NE-w2/js/world/archipelago.js');
const W = await import('/home/user/SON-HAZ-NE-w2/js/world/worldData.js');
const Gm = await import('/home/user/SON-HAZ-NE-w2/js/world/geo.js');
const H = (x, z) => +Gm.computeHeight(x, z).toFixed(1);
const ids = ['kul_limani','ates_dagi','obsidyen','korsan_mezarligi','sis_adasi','kara_girdap','kuzeyfener','buzdisi','kurt_adasi','derin_yarik','kumsaati','demirkapi','gumus_madeni','kizil_kanyon','kadim_tapinak','batik_sehir','zumrut_koy','fener_kayasi','gizli_pazar','korsan_kasabasi','tuz_pazari','mercan_halkasi','timsah_batakligi'];
for (const id of ids) {
  const I = A.EXTRA_ISLANDS.find((i) => i.id === id);
  console.log(`\n# ${id} (${I.name}) x=${I.x} z=${I.z} r=${I.r} h=${I.h} shape=${I.shape||'normal'} biome=${I.biome} region=${I.region} merkezH=${H(I.x,I.z)}`);
  for (const f of I.features) console.log(`  feat ${f.id} ${f.type} @(${f.x},${f.z}) h=${H(f.x,f.z)} r=${f.r??'-'}${f.boss?' boss='+f.boss:''}`);
  for (const s of W.DIG_SITES.filter((s) => s.island === id)) console.log(`  kazı ${s.id} ${s.tier} @(${s.x},${s.z}) h=${H(s.x,s.z)}`);
}
console.log('\nBOSS_SITES', JSON.stringify(A.BOSS_SITES));
