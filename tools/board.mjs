// Drawing helpers for level design scripts. A Board is 60x24 with a hardware border; save() writes
// levels/NNN-name.txt in the format build.mjs reads.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NEEDS } from './needs.mjs';

const LEVELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
// Things that fall and so are only placed on something solid.
const FALLS = 'O*oUPh!';

// Small seeded generator so scattered layouts come out the same on every run.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Board {
  constructor(num, name, need, hint, { fill = '.', seed = num * 7919 } = {}) {
    Object.assign(this, { num, name, need, hint, header: [], W: 60, H: 24, rand: rng(seed), farms: [] });
    this.g = Array.from({ length: 24 }, (_, y) => Array.from({ length: 60 }, (_, x) =>
      (x === 0 || y === 0 || x === 59 || y === 23) ? '#' : fill));
  }
  get(x, y) { return this.g[y] && this.g[y][x]; }
  set(x, y, ch) {
    if (x < 1 || y < 1 || x > 58 || y > 22) throw new Error(`${this.name}: ${x},${y} is on or outside the border`);
    this.g[y][x] = ch; return this;
  }
  rect(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch); return this; }
  box(x, y, w, h, ch) { for (let i = x; i < x + w; i++) { this.set(i, y, ch); this.set(i, y + h - 1, ch); } for (let j = y; j < y + h; j++) { this.set(x, j, ch); this.set(x + w - 1, j, ch); } return this; }
  h(x, y, n, ch) { return this.rect(x, y, n, 1, ch); }
  v(x, y, n, ch) { return this.rect(x, y, 1, n, ch); }
  pts(list, ch) { for (const [x, y] of list) this.set(x, y, ch); return this; }
  head(line) { this.header.push(line); return this; }
  int(n) { return Math.floor(this.rand() * n); }
  // Places `n` copies of ch on random cells that currently hold `on` inside the area, where ok(x,y) holds.
  // Falling things (Zonks, Infotrons, orange disks) are only placed where the cell below is solid.
  scatter(ch, n, { x0 = 1, y0 = 1, x1 = 58, y1 = 22, on = '.', ok = () => true } = {}) {
    const falls = FALLS.includes(ch), rises = ch === 'F';
    let placed = 0;
    for (let tries = 0; placed < n && tries < n * 200; tries++) {
      const x = x0 + this.int(x1 - x0 + 1), y = y0 + this.int(y1 - y0 + 1);
      if (this.get(x, y) !== on || !ok(x, y)) continue;
      if (falls && this.get(x, y + 1) === ' ') continue;
      if (rises && this.get(x, y - 1) === ' ') continue;
      // Plutonium at rest beside Plutonium goes critical at once: keep spheres apart.
      if (ch === 'P' && !this.clear(x, y, 1, 'P')) continue;
      this.set(x, y, ch); placed++;
    }
    if (placed < n) throw new Error(`${this.name}: placed only ${placed} of ${n} "${ch}"`);
    return this;
  }
  count(ch) { return this.g.reduce((s, r) => s + r.filter(c => c === ch).length, 0); }
  // True when no cell within r of (x, y), diagonals included, holds one of `chars`.
  clear(x, y, r = 1, chars = ' ') {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const c = this.get(x + i, y + j); if (c !== undefined && chars.includes(c)) return false; }
    return true;
  }
  // scatter() for busier boards. It also keeps objects off the cells beside a port (where Murphy
  // lands) and out of Electron farms, and keeps falling things away from open space so nothing
  // moves when the level starts.
  spread(ch, n, opts = {}) {
    const ok = opts.ok || (() => true), falls = FALLS.includes(ch);
    const inFarm = (x, y) => this.farms.some(([cx, top]) => x >= cx - 2 && x <= cx + 5 && y >= top - 2 && y <= top + 5);
    return this.scatter(ch, n, { ...opts, ok: (x, y) => ok(x, y) && !inFarm(x, y) && this.clear(x, y, 1, '><^v-|+') && (!falls || this.clear(x, y, 1, ' ')) });
  }
  // An Electron chamber under a Zonk: stand at (cx-1, top) and snap the plug at (cx, top).
  // With drop 'o' an orange disk falls instead; it blows up wherever it lands, so it rarely misses.
  farm(cx, top, drop = 'O') {
    this.rect(cx - 1, top + 1, 6, 4, 'R').rect(cx, top + 2, 4, 2, ' ').set(cx, top + 1, ' ')
      .set(cx, top, '.').set(cx, top - 1, drop).set(cx - 1, top, '.').set(cx + 2, top + 3, 'e');
    this.farms.push([cx, top]);
    return this;
  }
  /* ---- Element Wings ---- */
  // A straight open lane with an Alpha particle bouncing along it: 'A' runs left-right, 'V' up-down.
  lane(x, y, n, ch = 'A') {
    if (ch === 'A') this.h(x, y, n, ' '); else this.v(x, y, n, ' ');
    return this.set(x, y, ch);
  }
  // A belt of n cells running right (dir 1) or left (dir 3), with open space above it to ride in.
  belt(x, y, n, dir = 1, clearAbove = true) {
    this.h(x, y, n, dir === 1 ? ']' : '[');
    if (clearAbove) this.h(x, y - 1, n, ' ');
    return this;
  }
  // A rink of ice.
  rink(x, y, w, h) { return this.rect(x, y, w, h, 'I'); }
  // A pool of acid or coolant, w by h.
  pool(x, y, w, h, ch = 'a') { return this.rect(x, y, w, h, ch); }
  // A field of fallout.
  fallout(x, y, w, h) { return this.rect(x, y, w, h, 'r'); }
  // A sealed cask store with a Pellet inside and a hydrogen cell parked under a low ceiling beside a
  // shaft up to it: pushing the cell into the shaft blows the store open. Occupies x-1..x+3, y-3..y+2.
  hydroStore(x, y) {
    this.rect(x - 1, y - 3, 3, 2, 'R').set(x, y - 3, '*').v(x + 2, y - 3, 3, ' ').set(x + 2, y - 4, '#')
      .rect(x - 1, y - 1, 3, 1, '#').h(x - 1, y, 4, ' ').set(x - 1, y, 'F').set(x + 3, y - 1, '#');
    return this;
  }
  // Carves a maze of `ch` corridors through the odd cells (1,1)..(57,21) with a depth-first walk.
  maze(ch) {
    const CW = 29, CH = 11, seen = new Set(['0,0']), stack = [[0, 0]], cell = (cx, cy) => [1 + cx * 2, 1 + cy * 2];
    this.set(1, 1, ch);
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen.has(`${nx},${ny}`));
      if (!opts.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = opts[this.int(opts.length)];
      const [x, y] = cell(cx, cy);
      this.set(x + dx, y + dy, ch); this.set(...cell(nx, ny), ch);
      seen.add(`${nx},${ny}`); stack.push([nx, ny]);
    }
    return this;
  }
  // A carved maze is a tree, so anything solid dropped in a corridor cuts it. Opens walls (one at a
  // time, between a cell (1,1) can still walk to and one it cannot) until every corridor cell is
  // walkable with the `solid` characters treated as walls. Where a pushable thing sits, it can then be
  // walked round instead of pushed.
  reconnect(solid = '') {
    const open = ch => ch !== undefined && ch !== '#' && !solid.includes(ch);
    for (let rounds = 0; rounds < 500; rounds++) {
      const d = this.dist(1, 1, open);
      const gaps = [];
      for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) {
        if (this.get(x, y) !== '#') continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => open(this.get(nx, ny)));
        if (n.some(([nx, ny]) => d.has(ny * 60 + nx)) && n.some(([nx, ny]) => !d.has(ny * 60 + nx))) gaps.push([x, y]);
      }
      if (!gaps.length) return this;
      const [x, y] = gaps[this.int(gaps.length)];
      this.set(x, y, ' ');
    }
    throw new Error(`${this.name}: could not reconnect the maze`);
  }
  // Walking distance from (sx, sy) to every cell that pass(ch) allows, as a Map keyed y*60+x.
  dist(sx, sy, pass) {
    const d = new Map([[sy * 60 + sx, 0]]), q = [[sx, sy]];
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * 60 + nx;
        if (d.has(k) || !pass(this.get(nx, ny))) continue;
        d.set(k, d.get(y * 60 + x) + 1); q.push([nx, ny]);
      }
    }
    return d;
  }
  // A rough check that ignores physics: how many Infotrons Murphy can walk, dig, push or port his way
  // to (counting 9 for each Electron farm and each Electron he can reach), and whether he reaches the Exit.
  reach() {
    const MASK = { '^': 1, '>': 2, 'v': 4, '<': 8, '|': 5, '-': 10, '+': 15 }, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    const open = c => c !== undefined && ' .*dBXOoyS@eIrpNQtLh!cP/\\F,AVUJ%ZKHGqg'.includes(c);
    let sx = 0, sy = 0;
    this.g.forEach((r, y) => r.forEach((c, x) => { if (c === '@') { sx = x; sy = y; } }));
    const seen = new Set([sy * 60 + sx]), q = [[sx, sy]];
    let infos = 0, elec = 0, exit = false;
    while (q.length) {
      const [x, y] = q.pop(), c = this.get(x, y);
      if (c === '*') infos++; else if (c === 'h') infos += 2; else if (c === 'U') infos += 3; else if (c === 'e') elec++; else if (c === 'X') { exit = true; continue; }
      for (let d = 0; d < 4; d++) {
        let nx = x + DX[d], ny = y + DY[d], n = this.get(nx, ny);
        if (MASK[n] & (1 << d)) { nx += DX[d]; ny += DY[d]; n = this.get(nx, ny); }
        if (!open(n) || seen.has(ny * 60 + nx)) continue;
        seen.add(ny * 60 + nx); q.push([nx, ny]);
      }
    }
    return { supply: infos + 9 * (elec + this.farms.length), exit };
  }
  // Lowers need to `ratio` of what reach() finds, when the layout came out leaner than planned.
  fit(ratio = 0.85) { this.need = Math.min(this.need, Math.floor(this.reach().supply * ratio)); return this; }
  save() {
    if (NEEDS[this.num] !== undefined) this.need = NEEDS[this.num];
    const r = this.reach();
    if (!r.exit || r.supply < this.need) console.log(`  WARNING ${this.name}: exit ${r.exit ? 'reachable' : 'NOT reachable'}, about ${r.supply} Infotrons reachable for need ${this.need}`);
    const slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const file = join(LEVELS_DIR, `${String(this.num).padStart(3, '0')}-${slug}.txt`);
    const text = [`name: ${this.name}`, `need: ${this.need}`, `hint: ${this.hint}`, ...this.header, '---', ...this.g.map(r => r.join(''))].join('\n') + '\n';
    writeFileSync(file, text);
    console.log(`${file}  (${this.count('*')} Infotrons, ${this.count('O')} Zonks, ${this.count('S')} Snik Snaks, ${this.count('e')} Electrons)`);
  }
}
