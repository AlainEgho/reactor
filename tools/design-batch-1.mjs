// One-off scaffolding that drew levels 010-019 and wrote them to levels/*.txt.
// The .txt files are the source of truth now; edit those. Re-running this overwrites them.
// Usage: node tools/design-batch-1.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NEEDS } from './needs.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');

class Board {
  constructor(num, name, need, hint, fill = '.') {
    Object.assign(this, { num, name, need, hint, header: [], W: 60, H: 24 });
    this.g = Array.from({ length: 24 }, (_, y) => Array.from({ length: 60 }, (_, x) =>
      (x === 0 || y === 0 || x === 59 || y === 23) ? '#' : fill));
  }
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
  save() {
    if (NEEDS[this.num] !== undefined) this.need = NEEDS[this.num];
    const slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const file = join(out, `${String(this.num).padStart(3, '0')}-${slug}.txt`);
    const text = [`name: ${this.name}`, `need: ${this.need}`, `hint: ${this.hint}`, ...this.header, '---', ...this.g.map(r => r.join(''))].join('\n') + '\n';
    writeFileSync(file, text);
    console.log(file);
  }
}

// 010 Long Haul: a wide dig through six rooms. Some Infotrons carry a Zonk.
{
  const b = new Board(10, 'Long Haul', 28, 'A long dig across six rooms. Take Pellets that carry a Lead ball from below or from the side.');
  b.v(15, 1, 15, 'R').v(30, 8, 15, 'R').v(45, 1, 15, 'R');
  b.h(1, 8, 10, 'R').h(35, 16, 10, 'R').h(18, 4, 9, 'R').h(48, 10, 10, 'R');
  b.box(20, 11, 7, 6, 'R').set(23, 11, '.');
  b.pts([[5, 3], [9, 5], [3, 12], [7, 14], [11, 19], [4, 21], [13, 10], [19, 2], [25, 7], [22, 13], [24, 14], [21, 15], [27, 20], [18, 18],
    [34, 3], [38, 6], [42, 2], [36, 11], [40, 13], [33, 19], [38, 21], [43, 18], [48, 4], [53, 2], [56, 7], [50, 13], [55, 15], [52, 19],
    [57, 12], [47, 21], [10, 10], [28, 2], [35, 9]], '*');
  b.pts([[9, 4], [42, 1], [50, 12], [33, 18], [22, 12]], 'O');
  b.set(1, 1, '@').set(57, 21, 'X');
  b.save();
}

// 011 Avalanche: nine columns of Zonks over Infotrons, and three loose piles below.
{
  const b = new Board(11, 'Avalanche', 13, 'Every column of Lead balls sits on Graphite. Dig under one and it comes down after you, so come at the Pellets from below.');
  for (const c of [5, 11, 17, 23, 29, 35, 41, 47, 53]) { b.v(c, 1, 4, 'O').set(c, 12, '*').set(c, 13, 'R'); }
  b.h(3, 16, 12, 'R').h(22, 16, 14, 'R').h(42, 16, 14, 'R');
  b.pts([[5, 15], [25, 15], [31, 15], [45, 15], [52, 15]], 'O');
  for (const cx of [10, 30, 48]) b.pts([[cx, 20], [cx - 1, 21], [cx, 21], [cx + 1, 21], [cx - 2, 22], [cx - 1, 22], [cx, 22], [cx + 1, 22], [cx + 2, 22]], 'O');
  b.pts([[15, 22], [21, 20], [26, 22], [34, 21], [39, 22], [44, 20], [53, 22]], '*');
  b.set(1, 1, '@').set(57, 18, 'X');
  b.save();
}

// 012 Patrol Grid: 28 RAM blocks with Infotrons inside, corridors between them, four Snik Snaks.
{
  const b = new Board(12, 'Patrol Grid', 14, 'Gammas circle the blocks. Each block has a door on both sides, so cross a corridor in one step and duck inside.');
  b.rect(8, 1, 43, 21, ' ').h(8, 22, 43, 'R');
  const bx = [9, 15, 21, 27, 33, 39, 45], by = [2, 7, 12, 17];
  let k = 0;
  for (const y of by) for (const x of bx) {
    b.box(x, y, 5, 4, 'R').rect(x + 1, y + 1, 3, 2, '.').set(x, y + 2, '.').set(x + 4, y + 2, '.');
    if (k++ % 3 !== 1) b.set(x + 2, y + 1, '*');
  }
  b.pts([[14, 6], [32, 11], [44, 16], [26, 21]], 'S');
  b.set(2, 11, '@').set(56, 11, 'X');
  b.save();
}

// 013 Neutron Farm: four Electron chambers under Zonks. Two harvests are needed.
{
  const b = new Board(13, 'Neutron Farm', 18, 'You need two Neutron harvests. Stand left of a plug, snap it with Space + Right, then back away before the blast.');
  b.rect(1, 10, 58, 4, 'R');
  b.v(3, 10, 4, '.');
  for (const cx of [6, 20, 34, 48]) {
    b.rect(cx, 11, 4, 2, ' ').set(cx, 10, ' ').set(cx, 9, '.').set(cx, 8, 'O').set(cx + 2, 12, 'e');
  }
  b.pts([[12, 3], [27, 5], [41, 2], [55, 6], [10, 18], [25, 20], [40, 17], [52, 21]], '*');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 014 One Way Street: six rooms joined in a loop of one-way ports.
{
  const b = new Board(14, 'One Way Street', 24, 'The airlocks run in one big loop. Miss a Pellet and you can go round again.');
  b.v(19, 1, 22, '#').v(39, 1, 22, '#').h(1, 11, 58, '#');
  b.set(19, 5, '>').set(39, 3, '>').set(50, 11, 'v').set(39, 17, '<').set(19, 15, '<').set(9, 11, '^');
  b.set(29, 6, '+').pts([[29, 5], [29, 7], [28, 6], [30, 6]], ' ').pts([[28, 5], [30, 5], [28, 7], [30, 7]], 'R');
  b.pts([[3, 3], [8, 7], [14, 2], [16, 9], [5, 9],
    [23, 2], [26, 9], [33, 4], [36, 8], [31, 2],
    [43, 6], [47, 2], [53, 8], [57, 4], [45, 9],
    [44, 14], [49, 20], [55, 16], [57, 21], [42, 21],
    [23, 13], [26, 21], [33, 19], [36, 14],
    [3, 14], [8, 20], [14, 16], [16, 21], [5, 18]], '*');
  b.pts([[8, 6], [33, 3], [49, 19], [14, 15]], 'O');
  b.h(3, 5, 4, 'R').h(43, 7, 6, 'R').h(23, 18, 6, 'R').h(4, 17, 5, 'R');
  b.set(2, 2, '@').set(29, 16, 'X');
  b.save();
}

// 015 Free Fall: gravity from the start. Caves to drop into, Base to climb out through.
{
  const b = new Board(15, 'Free Fall', 13, 'Gravity is on. You drop into empty space and can only climb by eating Graphite, so think before you step into a cave.').head('gravity: on');
  b.rect(5, 4, 8, 4, ' ').rect(20, 10, 10, 5, ' ').rect(38, 3, 12, 4, ' ').rect(45, 13, 10, 6, ' ').rect(8, 16, 12, 5, ' ');
  b.pts([[6, 7], [9, 7], [12, 7], [21, 14], [24, 14], [28, 14], [39, 6], [43, 6], [48, 6], [46, 18], [50, 18], [54, 18], [9, 20], [14, 20], [19, 20]], '*');
  b.pts([[7, 2], [24, 8], [42, 1], [50, 11], [12, 14]], 'O');
  b.h(30, 20, 8, 'R').h(1, 12, 6, 'R');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 016 Switchback: gravity off on the left; a port into the right half switches it on, another switches it back.
{
  const b = new Board(16, 'Switchback', 14, 'One of the airlocks in the middle wall changes the rules on the other side. Come back through the lower airlock.')
    .head('special: 30,6 gravity on').head('special: 30,18 gravity off');
  b.v(30, 1, 22, '#').set(30, 6, '>').set(30, 18, '<');
  b.rect(32, 8, 26, 9, ' ').h(34, 11, 7, 'R').h(44, 14, 9, 'R');
  b.pts([[36, 10], [38, 10], [46, 13], [49, 13], [33, 16], [40, 16], [52, 16], [57, 16]], '*');
  b.pts([[4, 4], [9, 9], [15, 3], [22, 7], [26, 13], [6, 17], [13, 20], [21, 19]], '*');
  b.pts([[9, 8], [22, 6], [17, 15]], 'O');
  b.h(3, 11, 9, 'R').v(18, 12, 8, 'R');
  b.set(1, 1, '@').set(2, 22, 'X');
  b.save();
}

// 017 Blast Radius: three sealed vaults and a walled-in Exit. Orange disks for two, red disks for the rest.
{
  const b = new Board(17, 'Blast Radius', 16, 'Orange canisters blow where they land. Red canisters blow where you leave them. Keep one red canister for the Reactor.');
  // Vault 1: orange disk pushed into a shaft
  b.box(6, 10, 7, 5, 'R').rect(7, 11, 5, 2, ' ').h(7, 13, 5, '*');
  b.set(8, 2, 'o').set(8, 3, 'R').v(9, 2, 8, ' ');
  // Vault 2: red disk
  b.box(22, 6, 8, 6, 'R').rect(23, 7, 6, 3, '.').h(23, 10, 6, '*');
  // Vault 3: orange disk pushed off a ledge
  b.box(32, 19, 7, 4, 'R').rect(33, 20, 5, 1, ' ').h(33, 21, 5, '*');
  b.set(36, 15, 'o').set(36, 16, 'R').v(35, 16, 3, ' ').set(35, 15, ' ');
  // Exit room
  b.box(50, 15, 7, 7, 'R').rect(51, 16, 5, 5, '.').set(53, 18, 'X');
  b.pts([[3, 18], [15, 20], [35, 4], [40, 20]], 'd');
  b.pts([[20, 18], [45, 3], [55, 5], [25, 20]], '*');
  b.set(1, 1, '@');
  b.save();
}

// 018 Yellow Line: three vaults, five yellow disks in an open hall, one Terminal.
{
  const b = new Board(18, 'Yellow Line', 16, 'Line the Yellow canisters up against the vault walls first. The Initiator fires all of them at once.');
  b.rect(15, 1, 44, 22, ' ').v(14, 1, 22, '#').set(14, 11, 'T').set(14, 20, '.');
  b.box(20, 3, 7, 5, 'R').rect(21, 4, 5, 1, '.').h(21, 5, 5, '*').h(21, 6, 5, '*');
  b.box(34, 12, 7, 5, 'R').rect(35, 13, 5, 1, '.').h(35, 14, 5, '*').h(35, 15, 5, '*');
  b.box(48, 4, 7, 6, 'R').rect(49, 5, 5, 4, '.').set(51, 7, 'X').pts([[49, 8], [53, 8], [49, 5], [53, 5]], '*');
  b.pts([[19, 5], [30, 8], [44, 18], [52, 15], [25, 18]], 'y');
  b.pts([[4, 5], [8, 15], [11, 21]], '*');
  b.set(2, 2, '@');
  b.save();
}

// 019 Hot Zone: Bug patches guard most Infotrons; a Snik Snak runs the middle corridor.
{
  const b = new Board(19, 'Hot Zone', 16, 'The Pellets sit inside Hot spot patches. Watch a patch flare once, then cross it right after.');
  b.h(1, 11, 58, 'R').h(1, 13, 58, 'R').h(1, 12, 58, ' ');
  for (const x of [10, 30, 50]) { b.set(x, 11, '.').set(x, 13, '.'); }
  b.set(57, 12, 'S');
  for (const [x, y] of [[4, 3], [18, 2], [34, 4], [47, 2], [6, 16], [22, 17], [38, 15], [50, 18]]) {
    b.rect(x, y, 5, 4, 'B').set(x + 2, y + 1, '*').set(x + 2, y + 2, '*');
  }
  b.pts([[14, 7], [28, 9], [42, 8], [56, 5], [15, 21], [33, 21]], '*');
  b.pts([[14, 6], [42, 7], [33, 20]], 'O');
  b.set(1, 1, '@').set(57, 21, 'X');
  b.save();
}
