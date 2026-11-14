const ROOT = process.env.DK_ROOT;
const THREE = await import('three');
console.warn = () => {};
const T = (await import(ROOT + '/js/world/terrain.js')).terrain;
T.init(new THREE.Scene(), 'high'); // Node: Worker yok → yedek kip
T.localBudget = 0.01;
T.update(160, 470, true);
T._localSlice(); // tek dilim: şerit 0'a bir karo işi alınır, bir parça üretilir
const lane = T._lanes[0];
const job = lane && lane.job;
const t = job && [...T.tiles.values()].find(x => x.job === job);
const out = { seritteIs: !!job, seg: job && job.msg.seg };
if (t) {
  T._drop(t);
  out.dropSonrasiJobsIcinde = T._jobs.has(job.id);
  let steps = 0; const o = T._localSlice.bind(T);
  let done = false; job.promise.then(() => { done = true; });
  // dilimler kendiliğinden ilerler; işin kaç dilim daha sürdüğünü say
  const t0 = performance.now();
  while (!done) await new Promise(r => setTimeout(r, 1));
  out.isIptalEdilmedenTamamlandiMs = +(performance.now() - t0).toFixed(1);
  out.agEklendiMi = T.group.children.some(m => m.geometry.boundingSphere && Math.abs(m.geometry.boundingSphere.center.x - (t.x0 + 80)) < 1 && Math.abs(m.geometry.boundingSphere.center.z - (t.z0 + 80)) < 1);
}
console.log(JSON.stringify(out));
process.exit(0);
