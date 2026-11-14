(()=>{
  // FAZ 8 ölçüm araçları (salt-okur; oyunun kodunu değiştirmez, yalnız ölçüm sırasında renderer yöntemlerini sarar)
  const r = DK.engine.renderer, info = r.info, T = DK.THREE;
  window._labels = new Map();
  const SKIP = new Set(['scene','parent','ship','target','owner','homing','G','camera','renderer','_scene','lastShip','boardedShip','cam','focus']);
  window._buildOwn = async () => {
    const map = new Map(); const seen = new Set();
    const visit = (v, label, depth) => {
      if (v === null || typeof v !== 'object') return;
      if (seen.has(v)) return; seen.add(v);
      if (v.isObject3D) { if (!map.has(v)) map.set(v, label); return; }
      if (depth <= 0) return;
      if (v.isMaterial || v.isBufferGeometry || v.isTexture || v.isVector3 || v.isVector2 || v.isColor || v.isMatrix4 || v.isQuaternion || v.isEuler || v.isBox3 || ArrayBuffer.isView(v) || v instanceof ArrayBuffer) return;
      if (typeof Node !== 'undefined' && v instanceof Node) return;
      if (v instanceof Map) { for (const x of v.values()) visit(x, label, depth - 1); return; }
      if (v instanceof Set) { for (const x of v) visit(x, label, depth - 1); return; }
      if (Array.isArray(v)) { const n = Math.min(v.length, 4000); for (let i = 0; i < n; i++) visit(v[i], label, depth - 1); return; }
      for (const k of Object.keys(v)) { if (SKIP.has(k)) continue; let x; try { x = v[k]; } catch (e) { continue; } visit(x, label, depth - 1); }
    };
    const G = DK.G;
    for (const s of G.ships || []) visit(s, s === G.ship ? 'gemi_oyuncu' : ('gemi_diger:' + (s.ai ? 'dusman' : (s.id || '').slice(0, 12))), 5);
    if (G.rowboat) visit(G.rowboat, 'kayik', 4);
    if (DK.bosses.active) visit(DK.bosses.active, 'boss:' + DK.bosses.active.id, 5);
    for (const e of DK.enemies.list || []) visit(e, 'dusman', 4);
    for (const a of DK.animals.list || []) visit(a, 'hayvan:' + a.kind, 4);
    for (const n of DK.npcs.list || []) visit(n, 'npc', 4);
    for (const [id, rp] of G.remotes || []) visit(rp, 'uzak_oyuncu', 4);
    for (const b of DK.details.boats || []) { visit(b.fisher, 'balikci_karakter', 4); visit(b.mesh, 'balikci_teknesi', 1); }
    for (const [id, B] of DK.islands.built || []) { if (B.group) map.set(B.group, 'ada:' + id); }
    if (G.player) visit(G.player, 'oyuncu', 4);
    const mods = { terrain: DK.terrain, ocean: DK.ocean, sky: DK.sky, weatherfx: DK.weatherfx, effects: DK.effects, fish: DK.fish, megafauna: DK.megafauna, hazards: DK.hazards, treasure: DK.treasure, crowd: DK.crowd, seagear: DK.seagear, fishing: DK.fishing, worldEvents: DK.worldEvents, events: DK.events, bodies: DK.bodies, combat: DK.combat, enemies: DK.enemies, animals: DK.animals, bosses: DK.bosses, npcs: DK.npcs, net: DK.net, quests: DK.quests, progress: DK.progress, details: DK.details, port: DK.port, islands: DK.islands };
    try { mods.cave = (await import('./js/world/cave.js')).cave; } catch (e) {}
    try { mods.props = (await import('./js/world/props.js')).props; } catch (e) {}
    for (const [mn, m] of Object.entries(mods)) { if (!m) continue; for (const k of Object.keys(m)) { if (SKIP.has(k)) continue; let x; try { x = m[k]; } catch (e) { continue; } visit(x, mn + '.' + k, 4); } }
    window._labels = map;
    return map.size;
  };
  const scene = DK.engine.scene;
  window._labelOf = (o) => {
    let x = o;
    while (x) { const l = window._labels.get(x); if (l) return l; if (!x.parent) break; x = x.parent; }
    if (x === scene) { let c = o; while (c.parent && c.parent !== scene) c = c.parent; let nm = c.name; if (!nm) { let q = c; let found = ''; c.traverse((d) => { if (!found && d.name) found = d.name; }); nm = c.type + (found ? '[' + found.slice(0, 18) + ']' : (o.material && o.material.name ? '[m:' + o.material.name.slice(0, 14) + ']' : '')); } return 'sahne:' + nm + (c.isInstancedMesh ? '(I)' : ''); }
    return o.isMesh && !o.parent ? 'son_isleme' : 'sahne_disi:' + (o.name || o.type);
  };
  // çizim çağrısı başına sınıflandırma (ana geçiş A| / gölge geçişi G|)
  let inShadow = false;
  window._acc = null; window._firstDraw = new WeakMap();
  if (!r._dkWrapped) {
    r._dkWrapped = true;
    const rbd = r.renderBufferDirect;
    r.renderBufferDirect = function (camera, sc, geometry, material, object, group) {
      if (!window._acc && !window._trackFirst) return rbd.apply(this, arguments);
      const c0 = info.render.calls, t0 = info.render.triangles;
      const res = rbd.apply(this, arguments);
      if (window._trackFirst && geometry && !window._firstDraw.has(geometry)) { window._firstDraw.set(geometry, (inShadow ? 'G|' : 'A|') + window._labelOf(object) + ' ~ ' + (object.name || object.type) + (object.parent ? '<' + (object.parent.name || object.parent.type) : '')); }
      if (window._acc) {
        const dc = info.render.calls - c0, dt = info.render.triangles - t0;
        if (dc || dt) {
          const lab = (inShadow ? 'G|' : 'A|') + window._labelOf(object);
          const e = window._acc[lab] || (window._acc[lab] = [0, 0, 0]); e[0] += dc; e[1] += dt; if (object.isInstancedMesh) e[2] += object.count;
        }
      }
      return res;
    };
    const sm = r.shadowMap, smr = sm.render;
    sm.render = function () { inShadow = true; try { return smr.apply(this, arguments); } finally { inShadow = false; } };
  }
  window._group = (lab) => {
    const s = lab.replace(/^(A|G)\|/, '');
    if (s.startsWith('ada:')) return 'ada_icerigi';
    if (s.startsWith('hayvan:')) return 'hayvan';
    if (s.startsWith('boss:')) return 'boss';
    if (s.startsWith('gemi_diger')) return 'gemi_diger';
    if (s.startsWith('terrain.')) return 'arazi';
    if (s.startsWith('sky.')) return 'gok';
    if (s.startsWith('weatherfx.')) return 'hava_efekt';
    if (s.startsWith('details.')) return 'detay:' + s.slice(8);
    if (/^sahne:Mesh.*\(I\)$/.test(s)) return 'cekirdek_bitki(I)';
    if (s.startsWith('sahne:')) return s;
    return s.split('.')[0];
  };
  window._MM = (tag) => {
    const i = info; i.autoReset = false; i.reset();
    window._acc = {};
    const t0 = performance.now(); DK.post.render(); const rms = performance.now() - t0;
    const acc = window._acc; window._acc = null;
    const m = { tag, calls: i.render.calls, tris: i.render.triangles, points: i.render.points, lines: i.render.lines, geos: i.memory.geometries, texs: i.memory.textures, progs: (i.programs || []).length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, renderMs: +rms.toFixed(1) };
    i.autoReset = true;
    let shC = 0, shT = 0, postC = 0;
    const grp = {};
    for (const [k, v] of Object.entries(acc)) {
      const sh = k.startsWith('G|');
      if (sh) { shC += v[0]; shT += v[1]; }
      if (k.endsWith('son_isleme')) postC += v[0];
      const g = window._group(k);
      const e = grp[g] || (grp[g] = { a: 0, at: 0, g: 0, gt: 0, inst: 0 });
      if (sh) { e.g += v[0]; e.gt += v[1]; } else { e.a += v[0]; e.at += v[1]; e.inst += v[2]; }
    }
    m.shadowCalls = shC; m.shadowTris = shT; m.postCalls = postC; m.mainCalls = m.calls - shC - postC;
    m.groups = Object.entries(grp).map(([k, e]) => [k, e.a, e.at, e.g, e.gt]).sort((a, b) => (b[1] + b[3]) - (a[1] + a[3]));
    m.raw = Object.entries(acc).map(([k, v]) => [k, v[0], v[1]]).sort((a, b) => b[1] - a[1]).slice(0, 60);
    return m;
  };
  // JS benzetim süresi (çizimsiz), sistem bazında
  window._simProf = (n = 60) => {
    const acc = {}; const restore = [];
    const wrapM = (obj, key, name) => { const f = obj[key]; if (typeof f !== 'function') return; const own = Object.prototype.hasOwnProperty.call(obj, key); obj[key] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { acc[name] = (acc[name] || 0) + performance.now() - t; } }; restore.push(() => { if (own) obj[key] = f; else delete obj[key]; }); };
    for (const s of DK.game.systems) if (s.update) wrapM(s, 'update', s.name);
    if (DK.G.player) wrapM(DK.G.player, 'update', 'player');
    wrapM(DK.game, '_camera', '_camera'); wrapM(DK.game, '_env', '_env');
    for (const s of DK.G.ships) wrapM(s, 'update', 'ships');
    wrapM(DK.shipControl, 'update', 'shipControl'); wrapM(DK.interact, 'update', 'interact');
    const t0 = performance.now(); for (let k = 0; k < n; k++) DK.game.update(1 / 60); const tot = performance.now() - t0;
    const th = performance.now(); for (let k = 0; k < n; k++) DK.hud.update(1 / 60); const hud = performance.now() - th;
    for (const f of restore.reverse()) f();
    const per = {}; for (const k of Object.keys(acc).sort((a, b) => acc[b] - acc[a])) per[k] = +(acc[k] / n).toFixed(3);
    return { simMsPerFrame: +(tot / n).toFixed(2), hudMsPerFrame: +(hud / n).toFixed(2), per };
  };
  window._progs = () => {
    const ps = info.programs || []; let lin = 0, srgb = 0, x = 0; const names = {};
    for (const p of ps) { const parts = String(p.cacheKey || '').split(','); const pi = parts.findIndex((q) => q === 'highp' || q === 'mediump' || q === 'lowp'); const cs = pi >= 0 ? parts[pi + 1] : ''; if (cs === 'srgb-linear') lin++; else if (cs === 'srgb') srgb++; else x++; names[p.name] = (names[p.name] || 0) + 1; }
    return { n: ps.length, cikisDogrusal: lin, cikisSRGB: srgb, diger: x, names };
  };
  window._lights = () => { let pt = 0, ptVis = 0, spot = 0, dir = 0, hemi = 0; scene.traverse((o) => { if (o.isPointLight) { pt++; let v = true, q = o; while (q) { if (!q.visible) { v = false; break; } q = q.parent; } if (v) ptVis++; } if (o.isSpotLight) spot++; if (o.isDirectionalLight) dir++; if (o.isHemisphereLight) hemi++; }); return { point: pt, pointGorunur: ptVis, spot, dir, hemi }; };
  window._noCull = () => { const out = {}; scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isSprite || o.isLine) && o.frustumCulled === false) { let v = true, q = o; while (q) { if (!q.visible) { v = false; break; } q = q.parent; } if (!v) return; const g = window._group(window._labelOf(o)); out[g] = (out[g] || 0) + 1; } }); return out; };
  window._scan = (tag, n = 8, pitch = 0.3) => {
    const TC = DK.tpCamera; const y0 = TC.yaw; const p0 = TC.pitch; const rows = []; let maxM = null;
    for (let k = 0; k < n; k++) { TC.yaw = y0 + k * 2 * Math.PI / n; TC.pitch = pitch; DK.sim(1 / 60, 1 / 60); const m = window._MM(tag + '#' + k); rows.push([k, m.calls, m.tris, m.shadowCalls, m.mainCalls]); if (!maxM || m.calls > maxM.calls) maxM = m; }
    TC.yaw = y0; TC.pitch = p0; DK.sim(1 / 60, 1 / 60);
    const cs = rows.map((q) => q[1]).sort((a, b) => a - b), ts = rows.map((q) => q[2]).sort((a, b) => a - b);
    return { tag, n, callsMed: cs[Math.floor(n / 2)], callsMin: cs[0], callsMax: cs[n - 1], trisMed: ts[Math.floor(n / 2)], trisMax: ts[n - 1], rows, maxGroups: maxM.groups.slice(0, 25) };
  };
  window._ctx = () => { const p = DK.G.player; return { x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1), mode: p.mode, hour: +DK.sky.hour.toFixed(1), weather: DK.sky.weatherKey, islands: [...DK.islands.built.keys()], npcs: DK.npcs.list.length, animals: DK.animals.list.length, enemies: DK.enemies.list.length, ships: DK.G.ships.length, shots: DK.enemies.shots.length, tiles: DK.terrain.stats ? DK.terrain.stats() : null, renderer: (() => { try { const gl = r.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { return '?'; } })(), dpr: r.getPixelRatio(), size: [r.domElement.width, r.domElement.height], post: DK.post.mode, quality: DK.settings.v.quality, shadows: DK.settings.v.shadows, effects: DK.settings.v.effects }; };
  window._full = async (tag, scanN = 8, pitch = 0.3) => { await window._buildOwn(); const m = window._MM(tag); const s = window._simProf(60); const sc = window._scan(tag, scanN, pitch); return { ...m, ...s, ctx: window._ctx(), scan: sc, noCull: window._noCull(), lights: window._lights() }; };
  // geometri kimlik izleyici (renderer'a yüklenen ve henüz bırakılmamış geometriler)
  if (!window._geoLive) {
    window._geoLive = new Map();
    const BG = T.BufferGeometry.prototype;
    const add = BG.addEventListener; const disp = BG.dispose;
    BG.addEventListener = function (type, listener) { if (type === 'dispose' && listener && listener.name === 'onGeometryDispose' && !window._geoLive.has(this)) window._geoLive.set(this, { id: this.id, type: this.type, name: this.name || '', v: this.attributes?.position?.count || 0 }); return add.call(this, type, listener); };
    BG.dispose = function () { window._geoLive.delete(this); return disp.call(this); };
    window._trackFirst = true;
  }
  window._geoSnap = () => new Set(window._geoLive.keys());
  window._geoDiff = (before) => { const out = []; const inScene = new Set(); scene.traverse((o) => { if (o.geometry) inScene.add(o.geometry); }); for (const [g, inf] of window._geoLive) if (!before.has(g)) out.push({ ...inf, sahnede: inScene.has(g), ilkCizim: window._firstDraw.get(g) || '?' }); return out; };
  return 'araclar-hazir';
})()
