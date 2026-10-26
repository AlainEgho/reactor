// One-off scaffolding that drew levels 081-111 and wrote them to levels/*.txt. Each level is an
// original design sized to the difficulty profile of the matching slot in a classic set (counts only).
// Re-running overwrites the files.
// Usage: node tools/design-batch-5.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);

// Joins a grid of rooms with port doors: a spanning tree first, then `extra` more doors.
// cols/rows are [first, last] cell ranges; walls sit between them. door(x, y, ch, extra) places one
// port; extra is true for the doors beyond the spanning tree, which are safe to make one-way.
function linkRooms(b, cols, rows, extra, door) {
  const seen = new Set(['0,0']), stack = [[0, 0]], links = [];
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => [c + dc, r + dr]).filter(([nc, nr]) => cols[nc] && rows[nr] && !seen.has(`${nc},${nr}`));
    if (!next.length) { stack.pop(); continue; }
    const [nc, nr] = next[b.int(next.length)];
    links.push([c, r, nc, nr]); seen.add(`${nc},${nr}`); stack.push([nc, nr]);
  }
  const tree = links.length;
  for (let k = 0; k < extra; k++) {
    const c = b.int(cols.length), r = b.int(rows.length), [dc, dr] = b.rand() < 0.5 ? [1, 0] : [0, 1];
    if (cols[c + dc] && rows[r + dr]) links.push([c, r, c + dc, r + dr]);
  }
  links.forEach(([c, r, nc, nr], k) => {
    const a = Math.min(c, nc), z = Math.max(c, nc), p = Math.min(r, nr);
    if (a !== z) { const x = cols[a][1] + 1, [y0, y1] = rows[p]; door(x, y0 + Math.min(1, y1 - y0) + b.int(Math.max(1, y1 - y0 - 1)), '-', k >= tree); }
    else { const y = rows[p][1] + 1, [x0, x1] = cols[a]; door(x0 + 1 + b.int(Math.max(1, x1 - x0 - 1)), y, '|', k >= tree); }
  });
}

// 081 Core Grid: hardware traces split the Base into pads; ports are the vias.
{
  const b = new Board(81, 'Core Grid', 107, 'Concrete walls split the floor into bays. Airlocks cross them, and the two Neutron farms make up what the bays lack.');
  b.farm(8, 15).farm(46, 4);
  const zone = outside([5, 12, 10, 10], [43, 1, 10, 10], [1, 1, 5, 4], [53, 19, 6, 4]);
  for (let t = 0; t < 34; t++) {
    const horiz = b.rand() < 0.5, len = 5 + b.int(8), x = 2 + b.int(55), y = 2 + b.int(20);
    for (let i = 0; i < len; i++) { const cx = horiz ? x + i : x, cy = horiz ? y : y + i; if (cx < 58 && cy < 22 && zone(cx, cy)) b.set(cx, cy, '#'); }
  }
  let vias = 0;
  for (let t = 0; vias < 20 && t < 4000; t++) {
    const x = 2 + b.int(56), y = 2 + b.int(20);
    if (b.get(x, y) !== '#') continue;
    if (b.get(x - 1, y) === '#' && b.get(x + 1, y) === '#' && b.get(x, y - 1) === '.' && b.get(x, y + 1) === '.') { b.set(x, y, '|'); vias++; }
    else if (b.get(x, y - 1) === '#' && b.get(x, y + 1) === '#' && b.get(x - 1, y) === '.' && b.get(x + 1, y) === '.') { b.set(x, y, '-'); vias++; }
  }
  b.rect(28, 19, 5, 2, ' ').pts([[28, 19], [32, 20], [30, 19]], 'S');
  b.spread('O', 180, { ok: ends }).spread('o', 5, { ok: ends }).spread('*', 110, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 082 Neutron Storm: ten Infotrons and fifteen Electron farms.
{
  const b = new Board(82, 'Neutron Storm', 108, 'Twenty Pellets and fifteen Neutron farms; you need at least ten of the farms. The orange-topped ones rarely miss.');
  [2, 9, 16].forEach((top, j) => [3, 14, 25, 36, 47].forEach((cx, i) => b.farm(cx, top, (i + j) % 3 === 0 ? 'o' : 'O')));
  b.spread('*', 20, { ok: ends }).spread('o', 12, { ok: ends }).spread('d', 8, { ok: ends });
  b.rect(54, 6, 4, 2, ' ').pts([[54, 6], [57, 7]], 'S');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 083 Gatehouse: five hardware walls and a crossbar, every crossing a port, some one-way.
{
  const b = new Board(83, 'Gatehouse', 107, 'Five concrete walls, every crossing an airlock. Some gates only open one way, so look before you go through.');
  for (const x of [10, 20, 30, 40, 50]) {
    b.v(x, 1, 22, '#');
    for (const y of [3, 14]) b.set(x, y, '-');
    for (const y of [8, 19]) b.set(x, y, b.rand() < 0.5 ? '>' : '<');
  }
  b.h(1, 11, 58, '#');
  for (const x of [5, 15, 25, 35, 45, 55]) b.set(x, 11, '|');
  b.rect(22, 3, 6, 2, ' ').pts([[22, 3], [27, 4], [24, 3]], 'S');
  b.rect(42, 16, 6, 2, ' ').pts([[42, 16], [47, 17], [44, 16]], 'S');
  b.rect(2, 15, 6, 2, ' ').pts([[2, 15], [7, 16], [4, 15]], 'S');
  b.spread('O', 160, { ok: ends }).spread('d', 7, { ok: ends }).spread('*', 125, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 084 Serpentine: one long river of Snik Snaks lined with hardware; ports cross it.
{
  const b = new Board(84, 'Serpentine', 41, 'One long river of Gammas winds through the board. The airlocks take you straight across it. The Pellets lying in the river are bait.');
  for (const y of [3, 9, 15]) b.h(1, y - 1, 58, '#').h(1, y, 58, '#').h(2, y, 56, ' ').h(1, y + 1, 58, '#');
  b.v(57, 4, 5, ' ').v(56, 5, 3, '#').v(58, 5, 3, '#').set(57, 3, ' ').set(57, 9, ' ');
  b.v(2, 10, 5, ' ').v(1, 11, 3, '#').v(3, 11, 3, '#');
  for (const [y, xs] of [[3, [10, 30, 48]], [9, [8, 25, 44]], [15, [15, 35, 52]]]) for (const x of xs) b.set(x, y - 1, '.').set(x, y, '|').set(x, y + 1, '.');
  for (const [y, xs] of [[3, [20, 40]], [9, [15, 50]], [15, [25, 45]]]) for (const x of xs) b.set(x, y - 1, '.').set(x, y, '*');
  const river = [];
  for (let x = 2; x <= 57; x++) river.push([x, 3]);
  for (let y = 4; y <= 8; y++) river.push([57, y]);
  for (let x = 57; x >= 2; x--) river.push([x, 9]);
  for (let y = 10; y <= 14; y++) river.push([2, y]);
  for (let x = 2; x <= 57; x++) river.push([x, 15]);
  river.filter(([x, y]) => b.get(x, y) === ' ').filter((_, i) => i % 3 === 1).forEach(([x, y]) => b.set(x, y, 'S'));
  b.spread('*', 50, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 085 Fuel Store: ten RAM banks, each entered through a port in its roof; three Electron farms.
{
  const b = new Board(85, 'Fuel Store', 84, 'Ten fuel stores, each opened through an airlock in its roof. The three Neutron farms are part of the count.');
  const banks = [[3, 3], [15, 3], [27, 3], [39, 3], [3, 10], [15, 10], [27, 10], [39, 10], [27, 17], [39, 17]];
  for (const [x, y] of banks) {
    b.box(x, y, 9, 5, 'R').rect(x + 1, y + 1, 7, 3, '.').set(x + 4, y, '|');
    b.pts([[x + 2, y + 3], [x + 4, y + 3], [x + 6, y + 3]], '*').pts([[x + 2, y + 1], [x + 6, y + 1]], 'O');
  }
  b.farm(5, 17).farm(17, 17).farm(52, 10);
  b.rect(50, 2, 7, 2, ' ').pts([[50, 2], [56, 3], [53, 2]], 'S');
  b.rect(49, 18, 6, 2, ' ').pts([[49, 18], [54, 19], [51, 18]], 'S');
  const keep = both(ends, outside(...banks.map(([x, y]) => [x, y, 9, 5])));
  b.spread('O', 70, { ok: keep }).spread('o', 8, { ok: keep }).spread('d', 5, { ok: keep }).spread('*', 45, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 086 Turbine Hall: not one Infotron; eight Electron farms, with Yellow disks set into some farm walls.
{
  const b = new Board(86, 'Turbine Hall', 48, 'Not a single Pellet on the board. Everything is in the eight Neutron farms. The Initiator blows the Yellow canisters set into four farm walls.');
  [3, 14].forEach((top, j) => [5, 19, 33, 47].forEach((cx, i) => { b.farm(cx, top); if ((i + j) % 2 === 0) b.set(cx + 4, top + 3, 'y'); }));
  b.set(55, 11, 'T').pts([[14, 11], [28, 11], [42, 11]], 'T');
  b.spread('O', 120, { ok: ends }).spread('d', 5, { ok: ends }).spread('o', 1, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 087 Monolith: six RAM monoliths with Zonks heaped round and on them.
{
  const b = new Board(87, 'Monolith', 51, 'Six Cask monoliths with Lead balls heaped round them. Lead balls roll off Casks, so a monolith is a slope, not a wall.');
  for (const [x, y, w, h] of [[6, 4, 5, 7], [19, 10, 6, 8], [31, 3, 5, 9], [42, 11, 7, 7], [50, 3, 5, 6], [10, 16, 6, 5]]) b.rect(x, y, w, h, 'R');
  b.rect(26, 20, 4, 2, ' ').set(27, 21, 'S');
  b.spread('O', 121, { ok: ends }).spread('*', 62, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 088 Patchwork: fifteen hardware patches stitched with ports, each with its own trouble.
{
  const b = new Board(88, 'Patchwork', 45, 'Fifteen patches stitched together with airlocks. Each patch has its own trouble.');
  const cols = [[1, 10], [12, 24], [26, 33], [35, 47], [49, 58]], rows = [[1, 6], [8, 15], [17, 22]];
  for (const x of [11, 25, 34, 48]) b.v(x, 1, 22, '#');
  for (const y of [7, 16]) b.h(1, y, 58, '#');
  linkRooms(b, cols, rows, 8, (x, y, ch) => b.set(x, y, ch));
  const kinds = ['zonk', 'snik', 'orange', 'bug', 'red'];
  cols.forEach(([x0, x1], c) => rows.forEach(([y0, y1], r) => {
    const box = { x0, x1, y0, y1, ok: ends }, kind = (c === 0 && r === 0) || (c === 4 && r === 2) ? 'zonk' : kinds[(c * 2 + r * 3) % 5];
    if (kind === 'snik') {
      b.rect(x0 + 1, y0 + 1, x1 - x0 - 1, y1 - y0 - 1, ' ').pts([[x0 + 1, y0 + 1], [x1 - 1, y0 + 2], [x0 + 3, y1 - 1]], 'S');
      b.pts([[x0 + 2, y1 - 1], [x1 - 2, y1 - 1]], '*');
    } else if (kind === 'zonk') b.spread('O', 8, box).spread('*', 5, box);
    else if (kind === 'orange') b.spread('o', 5, box).spread('*', 5, box);
    else if (kind === 'bug') b.spread('B', 5, box).spread('*', 5, box);
    else b.spread('d', 2, box).spread('O', 4, box).spread('*', 4, box);
  }));
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 089 Labyrinth: a hardware maze of Base corridors with loops; Snik Snaks wait in open dead ends.
{
  const b = new Board(89, 'Labyrinth', 32, 'A maze with loops. Some dead ends are hollow and hold Gammas; break into one and they come out after you.', { fill: '#' });
  b.maze('.');
  for (let k = 0; k < 30; k++) {
    const x = 2 + b.int(55), y = 1 + b.int(21);
    if (b.get(x, y) === '#' && ((x % 2 === 0 && y % 2 === 1 && b.get(x - 1, y) === '.' && b.get(x + 1, y) === '.') || (x % 2 === 1 && y % 2 === 0 && b.get(x, y - 1) === '.' && b.get(x, y + 1) === '.'))) b.set(x, y, '.');
  }
  const dead = [];
  for (let y = 1; y <= 21; y += 2) for (let x = 1; x <= 57; x += 2) {
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.get(x + dx, y + dy) === '.');
    if (open.length === 1 && x + y > 10) dead.push([x, y, open[0]]);
  }
  let hollow = 0;
  for (const [x, y, [dx, dy]] of dead) {
    if (hollow < 4 && b.rand() < 0.3) { b.set(x, y, 'S').set(x + dx, y + dy, ' '); hollow++; }
    else if (b.get(x, y + 1) !== '.') b.set(x, y, '*');
  }
  b.spread('*', 16, { ok: (x, y) => ends(x, y) && b.get(x, y + 1) !== '.' });
  b.set(1, 1, '@').set(57, 21, 'X');
  b.fit().save();
}

// 090 Cherenkov: a Base sea with seven Electron farms and no Infotrons; Snik Snaks in pockets.
{
  const b = new Board(90, 'Cherenkov', 42, 'No Pellets, only Neutrons, seven farms of them. Gammas sleep in pockets in the Graphite between.');
  for (const cx of [6, 22, 38]) b.farm(cx, 3, cx === 22 ? 'o' : 'O');
  for (const cx of [13, 29, 45]) b.farm(cx, 14, cx === 29 ? 'O' : 'o');
  b.farm(54, 3);
  for (const [x, y] of [[14, 9], [32, 9], [50, 11], [4, 19], [22, 19], [38, 20]]) b.rect(x, y, 3, 2, ' ').set(x + 1, y + 1, 'S');
  b.h(2, 11, 9, 'R').h(52, 17, 6, 'R').v(26, 12, 5, 'R');
  b.spread('O', 6, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 091 Control Rods: hardware rooms joined by ports; five farms, Snik Snak rooms, a few Bugs.
{
  const b = new Board(91, 'Control Rods', 43, 'Twenty-one concrete rooms joined by airlocks. The loose Pellets fall just short; the five Neutron farms close the gap.', { fill: '.' });
  const cols = [[1, 8], [10, 17], [19, 26], [28, 35], [37, 44], [46, 53], [55, 58]], rows = [[1, 6], [8, 14], [16, 22]];
  for (const x of [9, 18, 27, 36, 45, 54]) b.v(x, 1, 22, '#');
  for (const y of [7, 15]) b.h(1, y, 58, '#');
  for (let c = 0; c < 6; c++) for (const [y0, y1] of rows) b.set(cols[c][1] + 1, y0 + 2, '-');
  for (const [x0, x1] of cols) for (const y of [7, 15]) b.set(x1, y, '|');
  for (const [c, r] of [[1, 0], [3, 0], [5, 1], [2, 2], [4, 2]]) b.farm(cols[c][0] + 2, rows[r][0] + 1);
  for (const [c, r] of [[2, 1], [4, 0]]) {
    const [x0, x1] = cols[c], [y0, y1] = rows[r];
    b.rect(x0 + 1, y0 + 1, x1 - x0 - 1, y1 - y0 - 1, ' ').pts([[x0 + 1, y0 + 1], [x1 - 1, y1 - 1], [x0 + 3, y0 + 2], [x1 - 2, y0 + 1]], 'S');
  }
  b.spread('B', 3, { ok: ends }).spread('*', 36, { ok: ends }).pts([[3, 12], [57, 3]], 'T');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 092 Pressure: three RAM funnels full of Zonks and Infotrons, each with a Base valve at the bottom.
{
  const b = new Board(92, 'Pressure', 78, 'Three Cask funnels, full to the brim. Eat a valve and the funnel empties into the chamber below it; do not be standing in the chamber.');
  const inV = [];
  for (const cx of [10, 26, 42]) {
    for (let i = 0; i < 7; i++) { b.set(cx - 7 + i, 2 + i, 'R').set(cx + 7 - i, 2 + i, 'R'); for (let x = cx - 6 + i; x <= cx + 6 - i; x++) inV.push([x, 2 + i]); }
    b.set(cx, 9, '.').rect(cx - 2, 10, 5, 2, ' ');
  }
  inV.forEach(([x, y], k) => { if (y < 8) b.set(x, y, k % 3 === 0 ? '*' : k % 3 === 1 ? 'O' : '.'); });
  b.h(1, 14, 50, '#');
  for (const x of [4, 12, 20, 28, 36, 44]) b.set(x, 14, '|');
  b.farm(53, 15);
  b.rect(52, 3, 5, 2, ' ').pts([[52, 3], [56, 4], [54, 3]], 'S');
  const keep = (x, y) => ends(x, y) && (y > 11 || !inV.some(([vx, vy]) => vx === x && vy === y));
  b.spread('O', 90, { ok: keep }).spread('o', 22, { ok: keep }).spread('y', 2, { ok: keep }).spread('*', 60, { ok: keep });
  b.set(56, 12, 'T');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 093 Tightrope: gravity on, four rails in open air walked as a zig-zag down to the floor. Each rail
// ends in a drop with an orange disk at its edge; the gaps along a rail are bridged with Base, once.
// With gravity on, anything standing on a one-high rail is a wall, so the disks sit only at the drops.
{
  const b = new Board(93, 'Tightrope', 12, 'Gravity is on and the rails hang in open air. Walk each rail to its end and drop to the next; push the orange canister off first, and stand back. A strip of Graphite bridges each gap, once.', { fill: ' ' })
    .head('gravity: on').head('special: 52,22 gravity off');
  const rails = [[5, [[1, 16], [20, 36], [40, 54]], 1], [10, [[5, 20], [24, 40], [44, 58]], -1], [15, [[1, 16], [20, 36], [40, 54]], 1], [20, [[5, 20], [24, 40], [44, 58]], -1]];
  for (const [y, segs, dir] of rails) {
    segs.forEach(([x0, x1], i) => { b.h(x0, y, x1 - x0 + 1, '#'); if (segs[i + 1]) b.h(x1, y - 1, segs[i + 1][0] - x1 + 1, '.'); });
    const first = segs[0][0], last = segs[segs.length - 1][1];
    b.set(dir > 0 ? last : first, y - 1, 'o');
    // Four Infotrons per rail, clear of the bridges and of where the disk from the rail above lands.
    for (const [x0, x1] of segs) for (const x of [x0 + 4, x0 + 10]) if (x < x1 - 1 && Math.abs(x - 55) > 2 && Math.abs(x - 4) > 2 && b.get(x, y - 1) === ' ') b.set(x, y - 1, '*');
  }
  b.set(52, 21, '#').set(52, 22, '>').rect(53, 21, 6, 2, '.');
  b.pts([[30, 7], [45, 12], [12, 17], [28, 22]], 'S');
  b.set(1, 4, '@').set(57, 22, 'X');
  b.fit(0.75).save();
}

// 094 Undergrowth: solid Base with six Electron farms hidden in it and only six loose Infotrons.
{
  const b = new Board(94, 'Undergrowth', 42, 'Solid Graphite, six loose Pellets and six Neutron farms. Orange canisters are buried here and there, so watch what you dig under.');
  for (const [cx, top] of [[8, 4], [24, 3], [41, 5], [14, 15], [32, 14], [50, 15]]) b.farm(cx, top, cx === 32 ? 'o' : 'O');
  for (const [x, y] of [[18, 10], [36, 10], [54, 3], [4, 20], [44, 20]]) b.rect(x, y, 3, 2, ' ').set(x + 1, y + 1, 'S');
  b.h(1, 12, 12, 'R').h(46, 11, 12, 'R').v(28, 18, 5, 'R');
  b.spread('o', 12, { ok: ends }).spread('d', 6, { ok: ends }).spread('*', 6, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 095 Bulk Store: RAM racks with aisles between, an open loading bay along the bottom.
{
  const b = new Board(95, 'Bulk Store', 114, 'Seven Cask racks and an open loading bay along the bottom. Whatever you free in an aisle ends up in the bay.');
  for (const x of [6, 13, 20, 27, 34, 41, 48]) b.rect(x, 3, 2, 16, 'R');
  b.h(1, 20, 54, ' ');
  b.spread('O', 164, { ok: ends }).spread('*', 135, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 096 Strongroom: six RAM vaults of ten Infotrons each; twenty-three red disks.
{
  const b = new Board(96, 'Strongroom', 44, 'Six Cask vaults of ten Pellets each, and twenty-three red canisters. The loose Pellets will just about do; the vaults are the safe way.');
  const vaults = [[4, 3], [18, 3], [32, 3], [46, 3], [11, 13], [39, 13]];
  for (const [x, y] of vaults) b.box(x, y, 9, 6, 'R').rect(x + 1, y + 1, 7, 4, '.').h(x + 1, y + 4, 7, '*').h(x + 2, y + 3, 3, '*');
  b.h(25, 15, 10, 'R').v(30, 16, 6, 'R');
  const keep = both(ends, outside(...vaults.map(([x, y]) => [x, y, 9, 6])));
  b.spread('O', 130, { ok: keep }).spread('d', 23, { ok: keep }).spread('*', 52, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 097 Cascade: a staircase of hardware ledges in open air; gravity on between the two ports.
{
  const b = new Board(97, 'Cascade', 42, 'A staircase of ledges in open air. The first airlock turns gravity on, so you only go down: take what you can from each ledge before you drop.', { fill: ' ' })
    .head('special: 7,2 gravity on').head('special: 55,22 gravity off');
  b.rect(1, 1, 6, 3, '.').h(1, 4, 6, '#').v(7, 1, 4, '#').set(7, 2, '>');
  b.pts([[2, 3], [4, 3], [6, 3], [3, 2], [5, 2]], '*');
  for (let k = 0; k < 9; k++) {
    const x = 8 + 5 * k, y = 4 + 2 * k;
    b.h(x, y, 6, '#').set(x, y - 1, 'o').h(x + 1, y - 1, 4, '*');
    if (k % 2) b.set(x + 5, y - 1, 'O');
  }
  for (let x = 10; x <= 46; x += 3) b.set(x, 22, '*');
  b.v(55, 18, 4, '#').set(55, 22, '>').rect(56, 18, 3, 5, '.');
  b.pts([[20, 22], [38, 22]], 'S');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 098 Spaghetti Junction: fifty small hardware rooms knotted together with ports.
{
  const b = new Board(98, 'Spaghetti Junction', 90, 'Fifty small rooms knotted together with airlocks. Find the order that gets you through them all.');
  const cols = [], rows = [[1, 4], [6, 9], [11, 14], [16, 19], [21, 22]];
  for (let k = 0; k < 10; k++) cols.push([1 + 6 * k, Math.min(58, 5 + 6 * k)]);
  cols[9][1] = 58;
  for (let x = 6; x <= 54; x += 6) b.v(x, 1, 22, '#');
  for (const y of [5, 10, 15, 20]) b.h(1, y, 58, '#');
  linkRooms(b, cols, rows, 14, (x, y, ch, extra) => b.set(x, y, extra && b.rand() < 0.6 ? (ch === '-' ? (b.rand() < 0.5 ? '>' : '<') : (b.rand() < 0.5 ? '^' : 'v')) : ch));
  // Small rooms next to several ports may have no free cell left, so a short count is fine here.
  const some = (ch, n, box) => { try { b.spread(ch, n, box); } catch { /* room is full */ } };
  for (const [x0, x1] of cols) for (const [y0, y1] of rows) {
    const box = { x0, x1, y0, y1, ok: ends };
    some('*', 2, box);
    if (b.rand() < 0.5) some('O', 1, box);
    if (b.rand() < 0.5) some('o', 1, box);
  }
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 099 Minefield: no Infotrons needed; a long route to the Exit through orange disks.
{
  const b = new Board(99, 'Minefield', 0, 'No Pellets needed. Just get to the Reactor without setting anything off. The airlocks in the walls only go down.');
  b.h(1, 6, 52, '#').h(7, 12, 52, '#').h(1, 18, 52, '#');
  for (const x of [12, 30, 44]) b.set(x, 6, 'v');
  for (const x of [20, 38]) b.set(x, 12, 'v');
  for (const x of [16, 34]) b.set(x, 18, 'v');
  for (const [x, y] of [[40, 2], [12, 9], [44, 15], [24, 20]]) b.rect(x, y, 3, 2, ' ').set(x + 1, y + 1, 'S');
  // The three wall gaps stay clear, so the danger is in crossing the field, not in a forced squeeze.
  const field = (x, y) => away(1, 1, 4)(x, y) && away(2, 22, 3)(x, y) && outside([51, 4, 8, 4], [1, 10, 8, 4], [51, 16, 8, 4])(x, y);
  b.spread('o', 160, { ok: field }).spread('O', 90, { ok: field });
  b.set(1, 1, '@').set(2, 22, 'X');
  b.save();
}

// 100 Century: a dense field broken up by hardware crosses; a hundred and sixty-two Infotrons wanted.
{
  const b = new Board(100, 'Century', 162, 'Level one hundred wants a hundred and sixty-two Pellets. Concrete shelves hold up parts of the field, and the Yellow canisters clear jams when the Initiator fires.');
  // Short shelves on a staggered grid; crosses here made two-wide channels that Zonks jammed shut.
  for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) b.h(5 + 7 * i + (j % 2) * 3, 5 + 5 * j, 4, '#');
  b.set(30, 22, 'T');
  b.spread('O', 140, { ok: ends }).spread('y', 6, { ok: ends }).spread('o', 7, { ok: ends }).spread('d', 1, { ok: ends }).spread('*', 190, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 101 Weightless: gravity on, except in the middle band; one-way ports switch it on the way through.
{
  const b = new Board(101, 'Weightless', 87, 'Gravity is on, except in the middle band. The airlocks down into the middle switch it off; the airlocks out of it switch it back on.')
    .head('gravity: on')
    .head('special: 10,8 gravity off').head('special: 50,8 gravity off').head('special: 30,8 gravity on')
    .head('special: 20,15 gravity on').head('special: 40,15 gravity on').head('special: 55,15 gravity off');
  b.h(1, 8, 58, 'R').h(1, 15, 58, 'R');
  b.set(10, 8, 'v').set(50, 8, 'v').set(30, 8, '^').set(20, 15, 'v').set(40, 15, 'v').set(55, 15, '^');
  b.rect(14, 10, 10, 2, ' ').pts([[14, 10], [19, 11], [23, 10], [17, 10]], 'S');
  b.rect(36, 12, 10, 2, ' ').pts([[36, 12], [41, 13], [45, 12], [39, 12]], 'S');
  b.spread('O', 30, { y1: 7, ok: ends }).spread('o', 6, { y1: 7, ok: ends }).spread('*', 35, { y1: 7, ok: ends });
  b.spread('o', 5, { y0: 9, y1: 14, ok: ends }).spread('y', 3, { y0: 9, y1: 14, ok: ends }).spread('*', 32, { y0: 9, y1: 14, ok: ends });
  b.spread('O', 40, { y0: 16, ok: ends }).spread('o', 5, { y0: 16, ok: ends }).spread('*', 38, { y0: 16, ok: ends });
  b.pts([[2, 12], [57, 10]], 'T');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 102 Motherlode: the biggest dig yet, with two open shafts crossed by ports.
{
  const b = new Board(102, 'Motherlode', 177, 'The motherlode: over two hundred Pellets. Two open shafts run top to bottom, with airlocks in their walls and Gammas inside.');
  for (const x of [19, 39]) {
    b.v(x - 1, 1, 22, 'R').v(x, 1, 22, ' ').v(x + 1, 1, 22, ' ').v(x + 2, 1, 22, 'R');
    for (const y of [3, 7, 11, 15, 19]) b.set(x - 1, y, '-').set(x + 2, y, '-');
    b.pts([[x, 5], [x + 1, 17]], 'S');
  }
  b.spread('O', 200, { ok: ends }).spread('*', 205, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 103 Blast Furnace: four double-walled RAM furnaces, red disks to open them, Yellow disks beside one.
{
  const b = new Board(103, 'Blast Furnace', 49, 'Four Cask furnaces with double walls; a red canister only gets you halfway in. The loose Pellets are enough if you are careful.');
  const furnaces = [[4, 4], [20, 12], [36, 3], [46, 13]];
  for (const [x, y] of furnaces) b.rect(x, y, 11, 7, 'R').rect(x + 2, y + 2, 7, 3, '.').h(x + 2, y + 4, 7, '*').set(x + 5, y + 3, '*');
  b.pts([[3, 7], [15, 7]], 'y').set(30, 22, 'T');
  b.rect(50, 1, 6, 2, ' ').pts([[50, 1], [55, 2], [52, 1], [53, 2]], 'S');
  const keep = both(ends, outside(...furnaces.map(([x, y]) => [x - 1, y - 1, 13, 9])));
  b.spread('O', 100, { ok: keep }).spread('o', 13, { ok: keep }).spread('d', 14, { ok: keep }).spread('*', 58, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 104 Supercritical: fourteen Electron farms and the Infotrons squeezed between them.
{
  const b = new Board(104, 'Supercritical', 139, 'Fourteen Neutron farms packed wall to wall. The loose Pellets are only a third of what you need.');
  let k = 0;
  for (const top of [3, 10, 17]) for (const cx of [4, 15, 26, 37, 48]) { if (top === 17 && cx === 48) continue; b.farm(cx, top, k++ % 3 === 1 ? 'o' : 'O'); }
  b.rect(54, 3, 4, 2, ' ').pts([[54, 3], [57, 4]], 'S');
  b.spread('*', 55, { ok: ends }).spread('o', 10, { ok: ends }).spread('d', 6, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 105 Precision: narrow hardware channels packed with Zonks, Yellow disks blocking the way.
{
  const b = new Board(105, 'Precision', 73, 'Narrow channels packed with Lead balls, and Yellow canisters parked where they are most in the way. Push carefully; the Initiator is a last resort.');
  [4, 8, 12, 16, 20].forEach((y, j) => {
    b.h(1, y, 58, '#');
    for (const x of j % 2 ? [8, 28, 48] : [18, 38, 56]) b.h(x, y, 2, '.');
    b.set(j % 2 ? 40 : 10, y, '|');
  });
  b.set(57, 22, 'X').set(3, 22, 'T');
  b.spread('y', 7, { ok: ends }).spread('O', 160, { ok: ends }).spread('o', 10, { ok: ends }).spread('d', 1, { ok: ends }).spread('*', 85, { ok: ends });
  b.rect(30, 1, 3, 2, ' ').set(31, 2, 'S');
  b.set(1, 1, '@');
  b.save();
}

// 106 Napalm: a deep Base field soaked with orange disks.
{
  const b = new Board(106, 'Napalm', 94, 'More orange canisters than Lead balls. Every one you drop is a blast; dig so they fall where nothing you need is lying.');
  b.spread('o', 131, { ok: (x, y) => away(1, 1, 5)(x, y) && away(57, 22, 3)(x, y) }).spread('O', 178, { ok: ends }).spread('*', 125, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 107 Turnpike: five RAM highways with toll-gate ports every few cells; heavy Zonks between them.
{
  const b = new Board(107, 'Turnpike', 82, 'Five Cask highways with a toll-gate airlock every few cells. The lanes between are jammed with Lead balls.');
  [4, 8, 12, 16, 20].forEach((y, j) => { b.h(1, y, 58, 'R'); for (let x = 3 + (j % 2) * 2; x <= 56; x += 5) b.set(x, y, '|'); });
  b.spread('O', 230, { ok: ends }).spread('*', 96, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 108 Gauntlet: four bands in a row; the ports between them freeze Zonks, switch gravity on, then off.
{
  const b = new Board(108, 'Gauntlet', 99, 'Four bands, run in order. The airlock into the second freezes every Lead ball, the airlock into the third turns gravity on, and the airlock into the last turns it off.')
    .head('special: 50,7 gravity off freeze-zonks').head('special: 8,12 gravity on').head('special: 50,17 gravity off');
  b.h(1, 7, 58, '#').h(1, 12, 58, '#').h(1, 17, 58, '#');
  b.set(50, 7, '|').set(8, 12, '|').set(50, 17, '|');
  b.v(20, 1, 6, '#').set(20, 3, '-').v(38, 8, 4, '#').set(38, 10, '-').v(28, 13, 4, '#').set(28, 15, '-').v(30, 18, 5, '#').set(30, 20, '-');
  b.farm(45, 2);
  b.rect(10, 9, 6, 2, ' ').pts([[10, 9], [15, 10], [12, 9]], 'S');
  b.spread('O', 35, { y1: 6, ok: ends }).spread('o', 16, { y1: 6, ok: ends }).spread('*', 28, { y1: 6, ok: ends });
  b.spread('O', 40, { y0: 8, y1: 11, ok: ends }).spread('o', 16, { y0: 8, y1: 11, ok: ends }).spread('*', 28, { y0: 8, y1: 11, ok: ends });
  b.spread('O', 30, { y0: 13, y1: 16, ok: ends }).spread('o', 16, { y0: 13, y1: 16, ok: ends }).spread('*', 28, { y0: 13, y1: 16, ok: ends });
  b.spread('O', 35, { y0: 18, ok: ends }).spread('o', 16, { y0: 18, ok: ends }).spread('y', 7, { y0: 18, ok: ends }).spread('d', 9, { y0: 18, ok: ends }).spread('*', 31, { y0: 18, ok: ends });
  b.set(3, 20, 'T');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 109 Skywalk: a lattice of hardware cells in open air, joined by ports; Snik Snaks in some cells.
{
  const b = new Board(109, 'Skywalk', 13, 'A lattice of concrete cells hanging in open air, joined by airlocks. Before you step through, look to see what is waiting on the other side.', { fill: ' ' });
  const cols = [], rows = [[1, 3], [5, 7], [9, 11], [13, 15], [17, 19], [21, 22]];
  for (let k = 0; k < 10; k++) cols.push([1 + 6 * k, Math.min(58, 5 + 6 * k)]);
  cols[9][1] = 58;
  for (let x = 6; x <= 54; x += 6) b.v(x, 1, 22, '#');
  for (const y of [4, 8, 12, 16, 20]) b.h(1, y, 58, '#');
  linkRooms(b, cols, rows, 10, (x, y, ch) => b.set(x, y, ch === '|' ? '|' : '-'));
  let infos = 0, sniks = 0;
  cols.forEach(([x0, x1], c) => rows.forEach(([y0, y1], r) => {
    if (c + r === 0 || (c === 9 && r === 5)) return;
    const floor = y1, spot = x0 + 1 + b.int(x1 - x0 - 1);
    if ((c * 7 + r * 3) % 3 === 0 && infos < 18 && b.clear(spot, floor, 1, '-|')) { b.set(spot, floor, '*'); infos++; }
    else if ((c * 5 + r) % 5 === 2 && sniks < 12) { b.set(x0 + 1, y0, 'S'); sniks++; }
  }));
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 110 Endgame: four quarters, four tests; the south-east quarter runs with gravity on.
{
  const b = new Board(110, 'Endgame', 190, 'Four quarters, four tests, and nearly every Pellet on the board. The south-east quarter runs with gravity on; the airlocks into it switch it.')
    .head('special: 30,16 gravity on').head('special: 40,12 gravity on').head('special: 30,20 gravity off').head('special: 52,12 gravity off');
  b.v(30, 1, 22, '#').h(1, 12, 58, '#');
  b.set(30, 4, '-').set(30, 9, '-').set(30, 16, '>').set(30, 20, '<').set(8, 12, '|').set(20, 12, '|').set(40, 12, 'v').set(52, 12, '^');
  for (const y of [4, 9]) { b.h(32, y - 1, 26, 'R').h(33, y, 24, ' ').h(32, y + 1, 26, 'R'); for (const x of [36, 46, 54]) b.set(x, y - 1, '|').set(x, y + 1, '|'); b.pts([[34, y], [41, y], [49, y], [56, y]], 'S'); }
  b.farm(10, 15);
  b.rect(20, 19, 6, 2, ' ').pts([[20, 19], [25, 20], [22, 19]], 'S');
  b.spread('O', 70, { x1: 29, y1: 11, ok: ends }).spread('*', 58, { x1: 29, y1: 11, ok: ends });
  b.spread('O', 30, { x0: 31, y1: 11, ok: ends }).spread('o', 7, { x0: 31, y1: 11, ok: ends }).spread('*', 40, { x0: 31, y1: 11, ok: ends });
  b.spread('O', 40, { x0: 31, y0: 13, ok: ends }).spread('*', 58, { x0: 31, y0: 13, ok: ends });
  b.spread('O', 30, { x1: 29, y0: 13, ok: ends }).spread('d', 2, { x1: 29, y0: 13, ok: ends }).spread('*', 58, { x1: 29, y0: 13, ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 111 Meltdown: three RAM rings round the Exit; the gates in the inner ring only open inward.
{
  const b = new Board(111, 'Meltdown', 101, 'Three rings of Casks round the Reactor. The gates in the innermost ring only open inward, so collect what you need before you go through.');
  b.box(3, 3, 54, 18, 'R').box(9, 6, 42, 12, 'R').box(17, 9, 26, 6, 'R');
  b.pts([[15, 3], [45, 20]], '|').pts([[3, 12], [56, 8]], '-');
  b.pts([[30, 6], [20, 17]], '|').pts([[9, 14], [50, 10]], '-');
  b.set(25, 9, 'v').set(35, 14, '^').set(17, 11, '>').set(42, 12, '<');
  const center = outside([17, 9, 26, 6]), inner = (x, y) => center(x, y) && x > 2 && x < 57 && y > 2 && y < 21;
  b.spread('O', 110, { ok: both(ends, inner) }).spread('o', 38, { ok: both(ends, inner) }).spread('d', 2, { ok: both(ends, center) }).spread('*', 125, { ok: both(ends, center) });
  b.pts([[22, 13], [27, 13], [33, 13], [38, 13]], '*');
  b.set(1, 1, '@').set(30, 12, 'X');
  b.save();
}
