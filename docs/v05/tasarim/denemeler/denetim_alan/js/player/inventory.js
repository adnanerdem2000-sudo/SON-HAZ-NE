import { ITEMS, itemWeight, itemValue, itemName } from '../economy/items.js';

// Kişisel envanter: yığınlar (stack) + altın. Benzersiz verili eşyalar (balık, harita) ayrı yığın tutar.
export class Inventory {
  constructor(capacity = 45) {
    this.stacks = [];
    this.gold = 0;
    this.capacity = capacity;
    this.onChange = null;
  }

  weight() { return this.stacks.reduce((a, s) => a + itemWeight(s), 0); }
  free() { return this.capacity - this.weight(); }

  count(id) { return this.stacks.filter((s) => s.id === id).reduce((a, s) => a + (s.n || 1), 0); }
  has(id, n = 1) { return this.count(id) >= n; }

  canAdd(id, n = 1, data = null) {
    const w = data?.weight ?? (ITEMS[id]?.weight || 0.1) * n;
    return this.weight() + w <= this.capacity + 1e-6;
  }

  add(id, n = 1, data = null, force = false) {
    const def = ITEMS[id];
    if (def?.currency) { this.gold += n; this._changed(); return 0; }
    if (!force && !this.canAdd(id, n, data)) {
      // sığdığı kadar ekle
      const per = def?.weight || 0.1;
      const fit = Math.floor((this.free() + 1e-6) / per); // canAdd ile aynı pay: kayan nokta artığı yüzünden 'sığar' denen eşya eklenmiyordu
      if (fit <= 0 || data) return n;
      this.add(id, fit, null, true);
      return n - fit;
    }
    if (def?.stack && !data) {
      const s = this.stacks.find((x) => x.id === id && !x.data);
      if (s) s.n += n; else this.stacks.push({ id, n });
    } else {
      for (let i = 0; i < n; i++) this.stacks.push({ id, n: 1, data: data ? { ...data } : undefined }); // veri verilen n adet: n ayrı yığın
    }
    this._changed();
    return 0;
  }

  remove(id, n = 1) {
    let left = n;
    for (let i = this.stacks.length - 1; i >= 0 && left > 0; i--) {
      const s = this.stacks[i];
      if (s.id !== id) continue;
      const take = Math.min(s.n || 1, left);
      s.n = (s.n || 1) - take;
      left -= take;
      if (s.n <= 0) this.stacks.splice(i, 1);
    }
    this._changed();
    return n - left;
  }

  removeStack(stack, n = null) {
    const i = this.stacks.indexOf(stack);
    if (i < 0) return 0;
    const take = n === null ? (stack.n || 1) : Math.min(n, stack.n || 1);
    stack.n = (stack.n || 1) - take;
    if (stack.n <= 0) this.stacks.splice(i, 1);
    this._changed();
    return take;
  }

  find(pred) { return this.stacks.find(pred); }
  byCategory(cat) {
    return this.stacks.filter((s) => (s.id.startsWith('balik:') ? 'balik' : ITEMS[s.id]?.cat) === cat);
  }
  totalValue() { return this.stacks.reduce((a, s) => a + itemValue(s), 0); }

  _changed() { if (this.onChange) this.onChange(); }

  toJSON() { return { stacks: this.stacks, gold: this.gold, capacity: this.capacity }; }
  load(o) {
    this.stacks = (o?.stacks || []).map((s) => ({ ...s }));
    this.gold = o?.gold || 0;
    this.capacity = o?.capacity || 45;
    this._changed();
  }
  describe(stack) { return itemName(stack.id, stack.data); }
}
