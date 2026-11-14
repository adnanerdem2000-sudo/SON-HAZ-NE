import { computeHeight } from '/home/user/SON-HAZ-NE-w2/js/world/geo.js';
import { CORE_ISLANDS } from '/home/user/SON-HAZ-NE-w2/js/world/worldData.js';
console.log(CORE_ISLANDS.map(i=>[i.id||i.name,i.x,i.z,i.r,i.biome]));
console.log(computeHeight(10,222), computeHeight(0,0));
