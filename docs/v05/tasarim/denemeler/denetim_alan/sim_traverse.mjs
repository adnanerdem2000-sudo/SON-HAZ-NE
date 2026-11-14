// Uzun arazi dolaşımı (yedek kip, Node): kamera düz çizgilerde ilerler; karo/ağ sayısı, iş sayısı, sızıntı göstergeleri
const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
const { terrain } = await import(ROOT + '/js/world/terrain.js');
const scene = new THREE.Scene();
const origWarn = console.warn; console.warn = () => {};
terrain.init(scene, 'high');
terrain.localBudget = 10;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// geometri yaşam döngüsü sayacı (dispose edilmeyen geometri = sızıntı)
let created = 0, disposed = 0;
const oldApply = terrain._apply.bind(terrain);
const live = new Set();
terrain._apply = function (t, m) { const had = t.mesh && t.mesh.geometry; oldApply(t, m); if (t.mesh && t.mesh.geometry !== had) { created++; const g = t.mesh.geometry; live.add(g); g.addEventListener('dispose', () => { disposed++; live.delete(g); }); } };
const route = [];
// 1) açık denizde doğuya 8 km (derin deniz karoları), 2) adalar arasında kuzeye
for (let x = 0; x <= 8000; x += 40) route.push([x, -6200]);
for (let z = -6200; z <= 1000; z += 40) route.push([8000, z]);
let maxTiles = 0, maxMeshes = 0, maxJobs = 0; const samples = [];
for (let k = 0; k < route.length; k++) {
  const [x, z] = route[k];
  terrain.update(x, z, true);
  await wait(4); // yerel pompa dilimleri
  const s = terrain.stats();
  maxTiles = Math.max(maxTiles, s.tiles); maxMeshes = Math.max(maxMeshes, s.meshes); maxJobs = Math.max(maxJobs, s.jobs);
  if (k % 50 === 0) {
    let deepFar = 0;
    for (const t of terrain.tiles.values()) { const d = Math.hypot(t.x0 + 80 - x, t.z0 + 80 - z); if (t.seg === 8 && d > 600) deepFar++; }
    samples.push({ k, x, z, tiles: s.tiles, meshes: s.meshes, jobs: s.jobs, queue: s.queue, deepSeg8BeyondDrawRange600m: deepFar, groupChildren: terrain.group.children.length });
  }
}
while (terrain._jobs.size) await wait(20);
const s = terrain.stats();
const orphanMeshes = terrain.group.children.filter(m => ![...terrain.tiles.values()].some(t => t.mesh === m)).length;
console.log(JSON.stringify({ samples, maxTiles, maxMeshes, maxJobs, final: s, geomCreated: created, geomDisposed: disposed, liveGeom: live.size, groupChildren: terrain.group.children.length, orphanMeshes, failures: terrain.failures.length, heapMB: +(process.memoryUsage().heapUsed / 1048576).toFixed(1) }, null, 1));
process.exit(0);
