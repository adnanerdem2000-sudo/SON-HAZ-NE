import { G } from '../game/ctx.js';
import { ui } from './ui.js';
import { el, fmtGold, clamp } from '../core/util.js';
import { ITEMS, CATEGORIES, RARITY, iconSVG, itemName, itemWeight, itemValue, CHEST_TIERS } from '../economy/items.js';
import { MERCHANTS, shop, sellPrice, buyPrice } from '../economy/shop.js';
import { treasure } from '../treasure/treasure.js';
import { quests, STORY } from '../game/quests.js';
import { terrain } from '../world/terrain.js';
import { ISLANDS, POIS, DIG_SITES, WORLD_SIZE, WRECKS } from '../world/worldData.js';
import { parchmentCanvas } from '../core/textures.js';
import { SHIP_TYPES } from '../ship/shipModel.js';
import { shipControl } from '../game/shipControl.js';
import { engine } from '../core/engine.js';
import { audio } from '../core/audio.js';
import { CLOTH_COLORS } from '../player/appearance.js';

function itemTip(s) {
  const d = s.id.startsWith('balik:') ? { name: s.data?.name, cat: 'balik', rarity: s.data?.rarity || 'siradan', desc: `${s.data?.len} cm · ${s.data?.weight} kg · ${s.data?.zone}`, value: s.data?.value } : ITEMS[s.id];
  if (!d) return '';
  const r = RARITY[d.rarity] || RARITY.siradan;
  const extra = s.id === 'hazine_haritasi' ? `<br><i>${s.data?.island || ''}</i>` : '';
  return `<b>${itemName(s.id, s.data)}</b><br><span style="color:${r.color === '#c9c2b0' ? '#7a6a50' : r.color}">${r.name}</span> · ${CATEGORIES[d.cat] || ''}<br>${d.desc || ''}${extra}<br>Ağırlık: ${itemWeight(s).toFixed(2)} kg · Değer: ${s.id.startsWith('balik:') ? d.value : itemValue(s)} altın`;
}

function itemCell(s, onClick, extra = '') {
  const def = s.id.startsWith('balik:') ? { rarity: s.data?.rarity || 'siradan' } : ITEMS[s.id] || {};
  const color = s.id.startsWith('balik:') ? s.data?.color : null;
  const c = el('div', { class: 'item', onclick: onClick ? () => onClick(s) : null },
    el('div', { class: 'ic', html: iconSVG(s, color) }),
    el('div', { class: 'nm' }, itemName(s.id, s.data)),
    (s.n || 1) > 1 ? el('div', { class: 'qty' }, '×' + s.n) : null,
    el('div', { class: 'rar', style: { background: (RARITY[def.rarity] || RARITY.siradan).color } }),
    extra ? el('div', { class: 'muted', style: { fontSize: '12px' } }, extra) : null);
  ui.tipOn(c, () => itemTip(s));
  return c;
}

export const panels = {
  init() {
    G.on('openInventory', () => this.inventory());
    G.on('openHold', (e) => this.hold(e.ship));
    G.on('openShop', (e) => this.shopPanel(e.role));
    G.on('openDialog', (d) => this.dialog(d));
    G.on('dialogExtra', (opts) => this._dialogExtra(opts));
    G.on('openMap', () => this.worldMap());
    G.on('openTreasureMap', () => this.treasureMap());
    G.on('openReader', (r) => this.reader(r.title, r.text));
    G.on('openShipyard', () => this.shipyard());
    G.on('confirmBuyShip', (t) => ui.confirm(`${SHIP_TYPES[t].name} — ${SHIP_TYPES[t].desc}<br><br>Fiyat: <b>${SHIP_TYPES[t].price} altın</b>. Mevcut gemin limanda satılır (ambar boş olmalı).`, () => shop.buyShip(t, shipControl, engine.scene)));
    G.on('tradeDone', () => { if (this._refresh) this._refresh(); });
  },

  // ---------------- Envanter ----------------
  inventory() {
    if (ui.topIs('inv')) { ui.close(); return; }
    const p = G.player;
    let cat = 'hepsi';
    const body = el('div', { class: 'col', style: { width: 'min(980px, 92vw)', height: 'min(640px, calc(90vh - 120px))' } });
    const render = () => {
      body.innerHTML = '';
      const tabs = el('div', { class: 'tabs' });
      for (const [k, v] of [['hepsi', 'Hepsi'], ...Object.entries(CATEGORIES)]) tabs.appendChild(el('div', { class: 'tab' + (cat === k ? ' active' : ''), onclick: () => { cat = k; render(); } }, v));
      body.appendChild(tabs);
      const head = el('div', { class: 'row' },
        el('span', { class: 'gold-tag' }, fmtGold(p.inv.gold)),
        el('span', {}, `Yük: ${p.inv.weight().toFixed(1)} / ${p.inv.capacity} kg`),
        el('span', { class: 'muted grow' }, 'Eşyaya tıkla: kullan / incele / bırak'));
      body.appendChild(head);
      const grid = el('div', { class: 'inv-grid scroll', style: { flex: 1, overflow: 'auto', marginTop: '8px' } });
      const list = p.inv.stacks.filter((s) => cat === 'hepsi' || (s.id.startsWith('balik:') ? 'balik' : ITEMS[s.id]?.cat) === cat);
      for (const s of list) grid.appendChild(itemCell(s, (st) => this._itemMenu(st, render)));
      if (!list.length) grid.appendChild(el('div', { class: 'muted' }, 'Bu bölmede eşya yok.'));
      body.appendChild(grid);
      if (p.ship && (p.mode === 'deck' || p.mode === 'helm')) body.appendChild(el('div', { class: 'row', style: { marginTop: '8px' } }, el('button', { class: 'btn', onclick: () => { ui.close(); this.hold(p.ship); } }, 'Gemi ambarını aç')));
    };
    render();
    this._refresh = render;
    ui.open(ui.panel('Envanter — Korsan Çantası', body), { kind: 'inv', closeKeys: ['Tab'], onClose: () => { this._refresh = null; } });
  },

  _itemMenu(s, rerender) {
    const p = G.player;
    const def = ITEMS[s.id] || {};
    const opts = [];
    if (def.heal) opts.push({ label: `Kullan (Can +${def.heal})`, fn: () => { p.inv.removeStack(s, 1); p.heal(def.heal); if (def.cure) p.poison = 0; audio.play('confirm', { vol: 0.4 }); } });
    if (s.id === 'hazine_haritasi') opts.push({ label: 'Haritayı incele', fn: () => { ui.close(); this.treasureMap(s); } });
    if (s.id === 'sise_mesaj') opts.push({ label: 'Şişeyi kır, mesajı oku', fn: () => { p.inv.removeStack(s, 1); treasure.giveMap(); } });
    if (s.id === 'eski_gunluk') opts.push({ label: 'Günlüğü oku', fn: () => { ui.close(); quests.takeJournal && this.reader('Serdümen Halil\'in Günlüğü', 'Kaptan Mira haritayı dört parçaya böldü. İlk parça Kemik Adası\'nda Morvan\'da…'); } });
    if (s.id === 'kizil_mektup') opts.push({ label: 'Mektubu oku', fn: () => { ui.close(); this.reader('Kızıl Hançer\'in Mektubu', '<i>"…Mira\'nın kalan iki parçası: biri Volkanik Adalar\'da ateşin bekçisinde, diğeri buzların altındaki kraliçede. Gelgit Pusulası Yitik Ufuk\'ta bekliyor. — K.H."</i>'); } });
    if (s.id === 'gulle' && G.ship) opts.push({ label: 'Gemiye yükle', fn: () => { const n = s.n; p.inv.removeStack(s); G.ship.cannonballs += n; } });
    if (s.id === 'tahta' && G.ship) opts.push({ label: 'Gemiye yükle', fn: () => { const n = s.n; p.inv.removeStack(s); G.ship.planks += n; } });
    if (p.ship && (p.mode === 'deck') && !def.nosell) opts.push({ label: 'Ambara koy', fn: () => { const k = s.id; const n = s.n || 1; if (k.startsWith('balik:')) { p.ship.hold.fish = p.ship.hold.fish || []; p.ship.hold.fish.push(s.data); p.inv.removeStack(s); } else { p.inv.removeStack(s); p.ship.hold.items[k] = (p.ship.hold.items[k] || 0) + n; } G.emit('netHold', { ship: p.ship.id, hold: p.ship.hold }); } });
    if (!def.nosell) opts.push({ label: 'Yere bırak', fn: () => { p.inv.removeStack(s); treasure.spawnLoot(p.pos.clone(), [[s.id, 1, s.n || 1, s.data]], 'Bırakılan', true); } });
    opts.push({ label: 'Vazgeç', fn: () => {} });
    const body = el('div', { class: 'col' }, el('div', { html: itemTip(s), style: { marginBottom: '8px' } }),
      ...opts.map((o) => el('button', { class: 'btn small', onclick: () => { ui.close(); o.fn(); rerender && rerender(); } }, o.label)));
    ui.open(ui.panel(itemName(s.id, s.data), body, { style: { width: '420px' } }));
  },

  // ---------------- Ambar ----------------
  hold(ship) {
    const p = G.player;
    const body = el('div', { class: 'col', style: { width: 'min(900px, 92vw)', maxHeight: '76vh' } });
    const render = () => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'row' },
        el('span', {}, `Sandıklar: ${ship.hold.chests.length}/${ship.T.holdSlots}`),
        el('span', {}, `Ağırlık: ${ship.holdWeight(ITEMS).toFixed(0)} / ${ship.holdCapacity().toFixed(0)} kg`),
        el('span', {}, `Gülle: ${ship.cannonballs} · Tahta: ${ship.planks}`)));
      body.appendChild(el('h3', {}, 'Sandıklar'));
      const g1 = el('div', { class: 'inv-grid' });
      ship.hold.chests.forEach((h, i) => {
        const c = el('div', { class: 'item', onclick: () => { ui.close(); treasure.takeFromHold(ship, i); } },
          el('div', { class: 'ic', html: iconSVG('sandik:' + h.tier) }), el('div', { class: 'nm' }, CHEST_TIERS[h.tier].name), el('div', { class: 'muted', style: { fontSize: '12px' } }, 'Taşımak için tıkla'));
        ui.tipOn(c, `<b>${CHEST_TIERS[h.tier].name}</b><br>${CHEST_TIERS[h.tier].weight} kg · Satış: ${CHEST_TIERS[h.tier].value} altın`);
        g1.appendChild(c);
      });
      if (!ship.hold.chests.length) g1.appendChild(el('div', { class: 'muted' }, 'Ambarda sandık yok.'));
      body.appendChild(g1);
      body.appendChild(el('h3', {}, 'Eşyalar'));
      const g2 = el('div', { class: 'inv-grid' });
      for (const id in ship.hold.items) {
        const n = ship.hold.items[id];
        if (!n) continue;
        g2.appendChild(itemCell({ id, n }, () => { const left = p.inv.add(id, n); ship.hold.items[id] = left; if (!left) delete ship.hold.items[id]; G.emit('netHold', { ship: ship.id, hold: ship.hold }); render(); }, 'Al'));
      }
      for (const [i, f] of (ship.hold.fish || []).entries()) {
        g2.appendChild(itemCell({ id: 'balik:' + f.key, n: 1, data: f }, () => { if (p.inv.canAdd('balik:' + f.key, 1, f)) { p.inv.add('balik:' + f.key, 1, f); ship.hold.fish.splice(i, 1); render(); } else G.notify('Envanter dolu.', 'warn'); }, 'Al'));
      }
      if (!g2.children.length) g2.appendChild(el('div', { class: 'muted' }, 'Ambarda eşya yok. Envanterden "Ambara koy" ile bırakabilirsin.'));
      body.appendChild(g2);
    };
    render();
    ui.open(ui.panel(`${ship.name} — Ambar`, body), { kind: 'hold' });
  },

  // ---------------- Dükkân ----------------
  shopPanel(role) {
    const M = MERCHANTS[role];
    const p = G.player;
    const body = el('div', { class: 'col', style: { width: 'min(1100px, 94vw)', height: 'min(700px, calc(90vh - 120px))' } });
    const render = () => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'row' }, el('i', { class: 'grow' }, M.greet), el('span', { class: 'gold-tag', style: { fontSize: '22px' } }, fmtGold(p.inv.gold))));
      const cols = el('div', { class: 'shop-cols', style: { marginTop: '8px' } });
      const buyCol = el('div', { class: 'col' }, el('h3', {}, 'Satın Al'));
      const bl = el('div', { class: 'shop-list' });
      for (const id of M.sells) {
        const d = ITEMS[id];
        const row = el('div', { class: 'shop-row' },
          el('div', { class: 'ic', html: iconSVG(id) }),
          el('div', {}, el('b', {}, d.name), el('div', { class: 'muted', style: { fontSize: '14px' } }, d.desc)),
          el('span', { class: 'price' }, buyPrice(id) + ' altın'),
          el('div', { class: 'row' },
            el('button', { class: 'btn small', onclick: () => { shop.buy(id, 1); render(); } }, 'Al'),
            d.stack ? el('button', { class: 'btn small', onclick: () => { shop.buy(id, 10); render(); } }, '×10') : null));
        ui.tipOn(row, () => itemTip({ id, n: 1 }));
        bl.appendChild(row);
      }
      if (!M.sells.length) bl.appendChild(el('div', { class: 'muted' }, 'Bu tüccar mal satmıyor, yalnızca satın alır.'));
      buyCol.appendChild(bl);
      const sellCol = el('div', { class: 'col' }, el('h3', {}, 'Sat'));
      const sl = el('div', { class: 'shop-list' });
      let any = false;
      for (const s of p.inv.stacks) {
        const isFish = s.id.startsWith('balik:');
        const pr = isFish ? sellPrice(s, role) : sellPrice({ ...s, n: 1 }, role);
        if (!pr) continue;
        any = true;
        const total = isFish ? pr : pr * (s.n || 1);
        const row = el('div', { class: 'shop-row' },
          el('div', { class: 'ic', html: iconSVG(s, s.data?.color) }),
          el('div', {}, el('b', {}, itemName(s.id, s.data) + ((s.n || 1) > 1 ? ' ×' + s.n : '')), el('div', { class: 'muted', style: { fontSize: '14px' } }, s.id.startsWith('balik:') ? `${s.data.len} cm, ${s.data.weight} kg` : `Birim: ${pr} altın`)),
          el('span', { class: 'price' }, total + ' altın'),
          el('div', { class: 'row' },
            (s.n || 1) > 1 ? el('button', { class: 'btn small', onclick: () => { shop.sell(s, role, 1); render(); } }, '1') : null,
            el('button', { class: 'btn small gold', onclick: () => { shop.sell(s, role); render(); } }, 'Sat')));
        ui.tipOn(row, () => itemTip(s));
        sl.appendChild(row);
      }
      if (!any) sl.appendChild(el('div', { class: 'muted' }, 'Bu tüccarın alacağı bir şeyin yok.'));
      sellCol.appendChild(sl);
      if (any) sellCol.appendChild(el('button', { class: 'btn gold', onclick: () => { shop.sellAll(role); render(); } }, 'Tümünü sat'));
      cols.append(buyCol, sellCol);
      body.appendChild(cols);
    };
    render();
    this._refresh = render;
    ui.open(ui.panel(M.name, body), { kind: 'shop', onClose: () => { this._refresh = null; } });
  },

  // ---------------- Diyalog ----------------
  dialog(d) {
    const box = el('div', { class: 'dialog' });
    box.appendChild(el('div', { class: 'who' }, d.name, d.title ? el('small', {}, d.title) : null));
    box.appendChild(el('div', { class: 'text', html: d.text }));
    const opts = el('div', { class: 'opts' });
    for (const o of d.options) opts.appendChild(el('button', { class: 'opt', onclick: () => { ui.close(); if (o.fn) o.fn(); } }, o.label));
    box.appendChild(opts);
    this._dialogOpts = opts;
    ui.open(ui.panel(null, box), { kind: 'dialog' });
  },
  _dialogExtra(list) {
    if (!this._dialogOpts || !ui.topIs('dialog')) return;
    const last = this._dialogOpts.lastChild;
    for (const o of list) this._dialogOpts.insertBefore(el('button', { class: 'opt', onclick: () => { ui.close(); o.fn(); } }, o.label), last);
  },

  reader(title, html) {
    ui.open(ui.panel(title, el('div', { class: 'reader scroll', html })), { kind: 'reader' });
  },

  // ---------------- Hazine haritası ----------------
  treasureMap(stack = null) {
    const p = G.player;
    const maps = p.inv.stacks.filter((s) => s.id === 'hazine_haritasi' && s.data?.site);
    if (!maps.length) { G.notify('Hazine haritan yok. Haritacı Nevra\'dan alabilirsin.', 'warn'); return; }
    let idx = Math.max(0, stack ? maps.indexOf(stack) : 0);
    const body = el('div', { class: 'tmap' });
    const render = () => {
      body.innerHTML = '';
      const s = maps[idx];
      const site = DIG_SITES.find((d) => d.id === s.data.site);
      const isl = ISLANDS.find((i) => i.id === site.island);
      const cv = this._drawTreasureMap(site, isl);
      const left = el('div', {}, cv);
      const right = el('div', { class: 'col' },
        el('h3', {}, isl.name),
        el('div', { style: { fontStyle: 'italic', fontSize: '20px', lineHeight: 1.4 } }, '“' + site.clue + '”'),
        el('div', { class: 'muted' }, `Sandık türü: ${CHEST_TIERS[site.tier].name}`),
        el('div', { class: 'muted' }, 'İpucunu adanın gerçek görünümüyle karşılaştır, doğru noktada kürekle kaz (3 tuşu ile kürek, sol tık).'),
        maps.length > 1 ? el('div', { class: 'row' }, el('button', { class: 'btn small', onclick: () => { idx = (idx - 1 + maps.length) % maps.length; render(); } }, '◀'), el('span', {}, `${idx + 1}/${maps.length}`), el('button', { class: 'btn small', onclick: () => { idx = (idx + 1) % maps.length; render(); } }, '▶')) : null);
      body.append(left, right);
    };
    render();
    ui.open(ui.panel('Hazine Haritası', body), { kind: 'tmap' });
  },

  _drawTreasureMap(site, isl) {
    const W = 640, H = 520;
    const c = parchmentCanvas(W, H, site.x | 0);
    const g = c.getContext('2d');
    const span = isl.r * 2.6;
    const cx = isl.x, cz = isl.z;
    const toPx = (x, z) => [W / 2 + (x - cx) / span * W * 0.95, H / 2 + (z - cz) / span * H * 0.95 * (W / H)];
    // kıyı çizgisi (el çizimi görünümü)
    const res = 90;
    const img = g.getImageData(0, 0, W, H);
    for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) {
      const x = cx + (i - W / 2) / (W * 0.95) * span, z = cz + (j - H / 2) / (H * 0.95 * (W / H)) * span;
      const h = terrain.heightAt(x, z);
      if (h > 0) {
        const k = (j * W + i) * 4;
        const shade = h > 20 ? 0.78 : h > 6 ? 0.86 : 0.93;
        for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const kk = ((j + dj) * W + (i + di)) * 4;
          img.data[kk] *= shade; img.data[kk + 1] *= shade * 0.97; img.data[kk + 2] *= shade * 0.9;
        }
      }
    }
    g.putImageData(img, 0, 0);
    void res;
    // kıyı kontur çizgisi
    g.strokeStyle = '#5a3a1e'; g.lineWidth = 2;
    for (let j = 0; j < H; j += 3) for (let i = 0; i < W; i += 3) {
      const x = cx + (i - W / 2) / (W * 0.95) * span, z = cz + (j - H / 2) / (H * 0.95 * (W / H)) * span;
      const h = terrain.heightAt(x, z);
      const hx = terrain.heightAt(x + span / W * 3, z);
      const hz = terrain.heightAt(x, z + span / H * 3);
      if ((h > 0) !== (hx > 0) || (h > 0) !== (hz > 0)) { g.fillStyle = '#4a2a10'; g.fillRect(i, j, 2.5, 2.5); }
    }
    // işaretler
    g.font = '22px "Pirata One", serif';
    g.fillStyle = '#4a2a10';
    for (const L of site.landmarks) {
      const [x, y] = toPx(L.x, L.z);
      g.save();
      g.translate(x, y);
      g.fillStyle = '#3a2412'; g.strokeStyle = '#3a2412'; g.lineWidth = 2;
      if (L.type === 'palm') { g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -10); g.stroke(); for (let a = 0; a < 5; a++) { g.beginPath(); g.moveTo(0, -10); g.quadraticCurveTo(Math.cos(a * 1.25) * 8, -16, Math.cos(a * 1.25) * 12, -8); g.stroke(); } }
      else if (L.type === 'statue') { g.fillRect(-5, -14, 10, 18); g.beginPath(); g.arc(0, -18, 4, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(0, -6); const d = [Math.sin(L.yaw), Math.cos(L.yaw)]; g.lineTo(d[0] * 26, -6 + d[1] * 26 * 0.8); g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]); }
      else if (L.type === 'bigrock') { g.beginPath(); g.moveTo(-10, 8); g.lineTo(-4, -16); g.lineTo(6, -12); g.lineTo(10, 8); g.closePath(); g.stroke(); }
      else if (L.type === 'grave') { g.fillRect(-4, -12, 8, 14); g.fillRect(-8, -8, 16, 3); }
      else if (L.type === 'column' || L.type === 'obelisk') { g.fillRect(-3, -14, 6, 18); }
      else { g.beginPath(); g.arc(0, 0, 5, 0, 6.3); g.stroke(); }
      g.restore();
    }
    // yaklaşık X (zorluk: büyük sandıklarda daha bulanık)
    const blur = site.tier === 'large' ? 30 : site.tier === 'medium' ? 18 : 10;
    const [tx, ty] = toPx(site.x + (Math.sin(site.x) * blur), site.z + (Math.cos(site.z) * blur));
    g.strokeStyle = '#a3241a'; g.lineWidth = 4;
    if (site.tier === 'small') { g.beginPath(); g.moveTo(tx - 9, ty - 9); g.lineTo(tx + 9, ty + 9); g.moveTo(tx + 9, ty - 9); g.lineTo(tx - 9, ty + 9); g.stroke(); }
    else { g.setLineDash([6, 5]); g.beginPath(); g.arc(tx, ty, blur * 1.6, 0, 6.3); g.stroke(); g.setLineDash([]); g.fillStyle = '#a3241a'; g.font = '30px "Pirata One", serif'; g.fillText('?', tx - 6, ty + 10); }
    // pusula gülü
    this._rose(g, W - 70, 70, 40);
    g.fillStyle = '#4a2a10'; g.font = '30px "Pirata One", serif';
    g.fillText(isl.name, 20, H - 22);
    return c;
  },

  _rose(g, x, y, r) {
    g.save(); g.translate(x, y);
    g.strokeStyle = '#4a2a10'; g.fillStyle = '#4a2a10'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, r, 0, 6.3); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, l = i % 2 ? r * 0.55 : r;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a - 0.12) * l * 0.25, -Math.cos(a - 0.12) * l * 0.25); g.lineTo(Math.sin(a) * l, -Math.cos(a) * l); g.lineTo(Math.sin(a + 0.12) * l * 0.25, -Math.cos(a + 0.12) * l * 0.25); g.closePath();
      if (i === 0) { g.fillStyle = '#a3241a'; g.fill(); g.fillStyle = '#4a2a10'; } else g.fill();
    }
    g.font = '18px "Pirata One", serif'; g.fillText('K', -5, -r - 4);
    g.restore();
  },

  // ---------------- Dünya haritası ----------------
  worldMap() {
    if (ui.topIs('map')) { ui.close(); return; }
    const wrap = el('div', { class: 'map-wrap' });
    const W = 1400, H = 1000;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    wrap.appendChild(cv);
    const legend = el('div', { class: 'map-legend' });
    wrap.appendChild(legend);
    let zoom = 1, cx = 0, cz = 0;
    const p = G.player;
    if (p) { cx = p.pos.x * 0.3; cz = p.pos.z * 0.3; }
    const base = this._mapBase || (this._mapBase = this._renderMapBase(W, H));
    const draw = () => {
      const g = cv.getContext('2d');
      g.clearRect(0, 0, W, H);
      const scale = (W / WORLD_SIZE) * zoom;
      g.fillStyle = '#c9b48a'; g.fillRect(0, 0, W, H);
      g.drawImage(base, W / 2 + (-WORLD_SIZE / 2 - cx) * scale, H / 2 + (-WORLD_SIZE / 2 - cz) * scale, WORLD_SIZE * scale, WORLD_SIZE * scale);
      const toPx = (x, z) => [W / 2 + (x - cx) * scale, H / 2 + (z - cz) * scale];
      // keşfedilmemiş bölgeler sisli
      const cell = WORLD_SIZE / 64;
      g.fillStyle = 'rgba(214,196,150,0.93)';
      for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
        if (quests.fog[j * 64 + i]) continue;
        const [x, y] = toPx(-WORLD_SIZE / 2 + i * cell, -WORLD_SIZE / 2 + j * cell);
        g.fillRect(x - 0.5, y - 0.5, cell * scale + 1, cell * scale + 1);
      }
      // ada adları ve noktalar
      g.textAlign = 'center';
      for (const I of ISLANDS) {
        if (!quests.discovered[I.id]) continue;
        const [x, y] = toPx(I.x, I.z);
        g.font = `${Math.round(26 * Math.min(1.6, zoom))}px "Pirata One", serif`;
        g.fillStyle = '#3a2412';
        g.fillText(I.name, x, y - I.r * scale - 8);
      }
      g.font = `${Math.round(17 * Math.min(1.5, zoom))}px "Crimson Text", serif`;
      for (const P of POIS) {
        if (!quests.discovered[P.id] && !(P.id === 'liman')) continue;
        const [x, y] = toPx(P.x, P.z);
        g.fillStyle = '#5a1a10';
        g.beginPath(); g.arc(x, y, 5, 0, 6.3); g.fill();
        g.fillStyle = '#3a2412';
        g.fillText(P.name, x, y + 20);
      }
      // hazine haritaları
      for (const s of (p?.inv.stacks || []).filter((s) => s.id === 'hazine_haritasi')) {
        const site = DIG_SITES.find((d) => d.id === s.data?.site);
        if (!site) continue;
        const isl = ISLANDS.find((i) => i.id === site.island);
        const [x, y] = toPx(isl.x, isl.z);
        g.strokeStyle = '#a3241a'; g.lineWidth = 2; g.setLineDash([5, 4]);
        g.beginPath(); g.arc(x, y, isl.r * scale * 1.2, 0, 6.3); g.stroke(); g.setLineDash([]);
      }
      // işaretler
      for (const m of quests.markers) {
        const [x, y] = toPx(m.x, m.z);
        g.fillStyle = m.color || '#c0392b';
        g.font = '24px serif'; g.fillText('✚', x, y + 8);
        if (m.note) { g.font = '15px "Crimson Text", serif'; g.fillStyle = '#3a2412'; g.fillText(m.note, x, y + 26); }
      }
      // rota çizgisi
      if (this.route && this.route.length > 1) {
        g.strokeStyle = 'rgba(163,36,26,.8)'; g.lineWidth = 3; g.setLineDash([10, 6]);
        g.beginPath();
        this.route.forEach((pt, i) => { const [x, y] = toPx(pt.x, pt.z); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
        g.stroke(); g.setLineDash([]);
      }
      // gemi ve oyuncular
      if (G.ship && !G.ship.sunk) {
        const [x, y] = toPx(G.ship.x, G.ship.z);
        g.save(); g.translate(x, y); g.rotate(-G.ship.yaw + Math.PI);
        g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(0, -12); g.lineTo(7, 8); g.lineTo(-7, 8); g.closePath(); g.fill();
        g.restore();
        g.fillStyle = '#3a2412'; g.font = '15px "Crimson Text", serif'; g.fillText(G.ship.name, x, y + 24);
      }
      for (const [, r] of G.remotes) {
        const [x, y] = toPx(r.pos.x, r.pos.z);
        g.fillStyle = r.color || '#2a6a9a';
        g.beginPath(); g.arc(x, y, 7, 0, 6.3); g.fill();
        g.fillStyle = '#3a2412'; g.fillText(r.name, x, y - 12);
      }
      if (p) {
        const [x, y] = toPx(p.pos.x, p.pos.z);
        g.save(); g.translate(x, y); g.rotate(-p.yaw + Math.PI);
        g.fillStyle = '#c0392b'; g.strokeStyle = '#fff'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke();
        g.restore();
      }
      this._rose(g, W - 90, H - 100, 60);
      g.textAlign = 'left';
    };
    legend.innerHTML = `<b style="font-family:var(--title);font-size:20px">Mavi Kırıklar</b><br>Fare tekerleği: yakınlaştır · Sürükle: kaydır<br>Sol tık: işaret koy / kaldır · Sağ tık: rota noktası ekle · <span class="kbd">R</span> rotayı sil<br><span style="color:#a3241a">✚</span> işaret · <span style="color:#c0392b">▲</span> sen · <span style="color:#a3241a">◌</span> hazine haritası bölgesi<br>Sisli alanlar henüz keşfedilmedi.`;
    let drag = null, moved = false;
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.15 : 0.87), 0.8, 6); draw(); }, { passive: false });
    cv.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY, cx, cz, b: e.button }; moved = false; });
    window.addEventListener('mousemove', this._mm = (e) => {
      if (!drag) return;
      const r = cv.getBoundingClientRect();
      const sc = (W / WORLD_SIZE) * zoom * (r.width / W);
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true;
      cx = drag.cx - (e.clientX - drag.x) / sc; cz = drag.cz - (e.clientY - drag.y) / sc;
      draw();
    });
    cv.addEventListener('mouseup', (e) => {
      const d = drag; drag = null;
      if (moved || !d) return;
      const r = cv.getBoundingClientRect();
      const sc = (W / WORLD_SIZE) * zoom;
      const px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height);
      const wx = cx + (px - W / 2) / sc, wz = cz + (py - H / 2) / sc;
      if (e.button === 2) { (this.route = this.route || []).push({ x: wx, z: wz }); draw(); return; }
      const near = quests.markers.findIndex((m) => Math.hypot(m.x - wx, m.z - wz) < 30 / zoom);
      if (near >= 0) quests.markers.splice(near, 1);
      else {
        const note = prompt('İşaret notu (isteğe bağlı):', '') || '';
        quests.markers.push({ x: wx, z: wz, note: note.slice(0, 40), by: G.playerName, color: '#c0392b' });
        G.emit('netMarker', { x: wx, z: wz, note, by: G.playerName });
      }
      draw();
    });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    const onKey = (e) => { if (e.code === 'KeyR') { this.route = []; draw(); } };
    window.addEventListener('keydown', onKey);
    draw();
    ui.open(ui.panel('Deniz Haritası', wrap, { style: { padding: '14px' } }), { kind: 'map', closeKeys: ['KeyM'], onClose: () => { window.removeEventListener('mousemove', this._mm); window.removeEventListener('keydown', onKey); } });
  },

  _renderMapBase(W) {
    const N = 700;
    const c = parchmentCanvas(N, N, 3);
    const g = c.getContext('2d');
    const img = g.getImageData(0, 0, N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -WORLD_SIZE / 2 + (i / N) * WORLD_SIZE, z = -WORLD_SIZE / 2 + (j / N) * WORLD_SIZE;
      const h = terrain.heightAt(x, z);
      const k = (j * N + i) * 4;
      if (h > 0) {
        const t = clamp(h / 50, 0, 1);
        const isl = terrain.islandAt(x, z, 1.3);
        const ghost = isl?.biome === 'hayalet';
        img.data[k] = (ghost ? 150 : 176) - t * 60; img.data[k + 1] = (ghost ? 150 : 160) - t * 50; img.data[k + 2] = (ghost ? 140 : 100) - t * 30;
      } else {
        const d = clamp(-h / 28, 0, 1);
        const f = 1 - d * 0.35;
        img.data[k] *= f * 0.92; img.data[k + 1] *= f * 0.97; img.data[k + 2] *= f * 1.0;
        // derinlik çizgileri
        if (Math.abs(h + 5) < 0.25 || Math.abs(h + 15) < 0.25) { img.data[k] *= 0.8; img.data[k + 1] *= 0.82; img.data[k + 2] *= 0.85; }
      }
    }
    g.putImageData(img, 0, 0);
    // kıyı konturu
    g.fillStyle = '#4a2a10';
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
      const x = -WORLD_SIZE / 2 + (i / N) * WORLD_SIZE, z = -WORLD_SIZE / 2 + (j / N) * WORLD_SIZE;
      const a = terrain.heightAt(x, z) > 0, b = terrain.heightAt(x + WORLD_SIZE / N, z) > 0, cc = terrain.heightAt(x, z + WORLD_SIZE / N) > 0;
      if (a !== b || a !== cc) g.fillRect(i, j, 1.5, 1.5);
    }
    // derinlik işaretleri (rakamlar)
    g.fillStyle = 'rgba(58,36,18,.45)'; g.font = '9px serif';
    for (let k = 0; k < 120; k++) {
      const i = (k * 97) % N, j = (k * 53 + 31) % N;
      const x = -WORLD_SIZE / 2 + (i / N) * WORLD_SIZE, z = -WORLD_SIZE / 2 + (j / N) * WORLD_SIZE;
      const h = terrain.heightAt(x, z);
      if (h < -3) g.fillText(String(Math.round(-h)), i, j);
    }
    void W;
    return c;
  },

  // ---------------- Tersane ----------------
  shipyard() {
    const s = G.ship, p = G.player;
    const body = el('div', { class: 'col', style: { width: 'min(900px, 92vw)' } });
    const render = () => {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'row' }, el('b', {}, s.name + ' — ' + s.T.name), el('span', { class: 'gold-tag grow', style: { justifyContent: 'flex-end' } }, fmtGold(p.inv.gold))));
      body.appendChild(el('h3', {}, 'Geliştirmeler (işlevsel)'));
      for (const [k, n, d] of [['hull', 'Gövde', '+%25 dayanıklılık, +%15 ambar'], ['sails', 'Yelkenler', '+%8 hız, daha hızlı açılır'], ['cannons', 'Toplar', '+%15 hasar, +%20 dolum hızı']]) {
        const lvl = s.upg[k] || 0;
        body.appendChild(el('div', { class: 'shop-row', style: { gridTemplateColumns: '1fr auto auto' } },
          el('div', {}, el('b', {}, `${n} — Seviye ${lvl}/3`), el('div', { class: 'muted' }, d)),
          el('span', { class: 'price' }, lvl < 3 ? shop.UPG_COST[lvl] + ' altın' : 'Tamam'),
          el('button', { class: 'btn small gold', disabled: lvl >= 3 ? 'true' : null, onclick: () => { shop.upgrade(k); render(); } }, 'Geliştir')));
      }
      body.appendChild(el('h3', {}, 'Malzeme'));
      body.appendChild(el('div', { class: 'row' },
        el('button', { class: 'btn small', onclick: () => { shop.buyForShip('gulle', 10); render(); } }, '10 gülle (120)'),
        el('button', { class: 'btn small', onclick: () => { shop.buyForShip('tahta', 5); render(); } }, '5 tamir tahtası (75)'),
        el('span', {}, `Gemide: ${s.cannonballs} gülle, ${s.planks} tahta`)));
      body.appendChild(el('h3', {}, 'Gemi görünümü (150 altın / değişiklik — savaş avantajı vermez)'));
      const look = { ...s.look };
      const colorRow = (label, key, def) => el('div', { class: 'opt-grid' }, el('span', { class: 'lbl' }, label), el('div', { class: 'swatches' },
        ...CLOTH_COLORS.concat(['#efe6d0', '#3a3a3a', '#f2f2f2']).map((c) => { const sw = el('div', { class: 'sw' + ((look[key] || def) === c ? ' active' : ''), style: { background: c }, onclick: () => { look[key] = c; render2(); } }); return sw; })));
      const area = el('div', { class: 'col' });
      const render2 = () => {
        area.innerHTML = '';
        area.append(colorRow('Gövde', 'hull', '#6b4a2c'), colorRow('Şerit', 'stripe', '#1f3a5a'), colorRow('Yelken', 'sail', '#efe6d0'));
        area.appendChild(el('div', { class: 'opt-grid' }, el('span', { class: 'lbl' }, 'Bayrak'), el('div', { class: 'chips' },
          ...[['skull', 'Kafatası'], ['dagger', 'Hançer'], ['compass', 'Pusula'], ['kraken', 'Kraken']].map(([k, n]) => el('div', { class: 'chip' + ((look.flag || 'skull') === k ? ' active' : ''), onclick: () => { look.flag = k; render2(); } }, n)))));
        area.appendChild(el('div', { class: 'opt-grid' }, el('span', { class: 'lbl' }, 'Yelken deseni'), el('div', { class: 'chips' },
          ...[[null, 'Düz'], ['#a33a2a', 'Kırmızı çizgili'], ['#1f3a5a', 'Lacivert çizgili'], ['#2a2a2a', 'Siyah çizgili']].map(([k, n]) => el('div', { class: 'chip' + ((look.sailStripe || null) === k ? ' active' : ''), onclick: () => { look.sailStripe = k; render2(); } }, n)))));
        const nameIn = el('input', { type: 'text', value: s.name, maxlength: 24 });
        area.appendChild(el('div', { class: 'opt-grid' }, el('span', { class: 'lbl' }, 'Gemi adı'), nameIn));
        area.appendChild(el('div', { class: 'row' }, el('button', { class: 'btn gold', onclick: () => {
          const nm = nameIn.value.trim().slice(0, 24) || s.name;
          const changed = JSON.stringify(look) !== JSON.stringify(s.look);
          if (changed) { if (!shop.setShipLook(look)) return; }
          if (nm !== s.name) { s.name = nm; G.notify(`Geminin yeni adı: ${nm}`, 'good'); }
          render();
        } }, 'Uygula')));
      };
      render2();
      body.appendChild(area);
    };
    render();
    ui.open(ui.panel('Usta Bora\'nın Tersanesi', body), { kind: 'shipyard' });
  },
};
