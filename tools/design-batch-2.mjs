// One-off scaffolding that drew levels 020-034 and wrote them to levels/*.txt. Each level is an
// original design sized to the difficulty profile of the matching slot in a classic set (counts only:
// Infotron targets, Zonk density, enemy counts, which mechanics appear). Re-running overwrites the files.
// Usage: node tools/design-batch-2.mjs
import { Board } from './board.mjs';

const nearStart = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;

// 020 Decay Hall: an open hall of Base pillars with ten Snik Snaks circling them.
{
  const b = new Board(20, 'Decay Hall', 24, 'Ten Gammas circle the pillars. Each pillar hides a Pellet. Dig in from the side away from them.');
  b.rect(8, 1, 45, 22, ' ');
  for (const cx of [11, 17, 23, 29, 35, 41, 47]) for (const cy of [4, 10, 16]) b.rect(cx - 1, cy - 1, 3, 3, '.').set(cx, cy, '*');
  b.pts([[9, 22], [15, 22], [21, 22], [27, 22], [33, 22], [39, 22], [45, 22], [51, 22]], '*');
  b.pts([[14, 7], [26, 7], [38, 7], [50, 7], [20, 13], [32, 13], [44, 13], [14, 19], [26, 19], [38, 19]], 'S');
  b.set(2, 11, '@').set(56, 11, 'X');
  b.save();
}

// 021 Heavy Slab: gravity on, a thick slab of Base full of Zonks.
{
  const b = new Board(21, 'Heavy Slab', 45, 'Gravity is on, but the Graphite holds you. Every tunnel you dig is also a path for the Lead balls above it.').head('gravity: on');
  b.rect(10, 4, 4, 3, ' ').rect(30, 14, 6, 3, ' ').rect(45, 6, 5, 3, ' ');
  b.scatter('O', 70, { ok: nearStart(1, 1) }).scatter('*', 55, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 022 Sinkholes: gravity on, open shafts drop you onto Infotrons; a Snik Snak waits in a cave.
{
  const b = new Board(22, 'Sinkholes', 40, 'Gravity is on. The shafts are quick ways down; the way back up is through Graphite.').head('gravity: on');
  for (let x = 6; x <= 54; x += 6) { const depth = 8 + b.int(11); b.v(x, 2, depth, ' ').set(x, 2 + depth, '*'); }
  b.rect(24, 17, 9, 3, ' ').set(26, 19, 'S');
  b.scatter('O', 45, { ok: nearStart(1, 1) }).scatter('*', 40, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 023 Rock Garden: a dense Zonk garden, with three RAM rooms you can bomb into.
{
  const b = new Board(23, 'Rock Garden', 60, 'Lead balls everywhere. Three sealed rooms hold spare Pellets if you want to spend a red canister.');
  for (const [x, y] of [[8, 4], [28, 15], [46, 5]]) b.box(x, y, 7, 5, 'R').rect(x + 1, y + 1, 5, 3, '.').h(x + 1, y + 3, 5, '*').set(x + 2, y + 2, '*').set(x + 4, y + 2, '*');
  b.scatter('O', 180, { ok: nearStart(1, 1) }).scatter('*', 75, { ok: nearStart(1, 1, 2) }).scatter('d', 10, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 024 Swarm: four caged lanes full of Snik Snaks; vertical ports cross them. A hidden switch freezes the swarm.
{
  const b = new Board(24, 'Swarm', 14, 'Each lane is full of Gammas. Airlocks let you hop across in one step. Somewhere at the bottom is an airlock that stops them all.')
    .head('special: 40,21 gravity off freeze-enemies');
  for (const y of [4, 9, 14, 19]) {
    b.h(1, y - 1, 58, 'R').h(1, y + 1, 58, 'R').h(3, y, 54, ' ');
    for (const x of [10, 30, 50]) b.set(x, y - 1, '|').set(x, y + 1, '|');
  }
  b.pts([[8, 4], [25, 4], [44, 4], [15, 9], [33, 9], [48, 9], [55, 9], [6, 14], [22, 14], [38, 14], [53, 14], [12, 19], [28, 19], [46, 19]], 'S');
  b.set(40, 21, '>').set(39, 21, '.').set(41, 21, '.');
  b.scatter('*', 18, { ok: (x, y) => ![3, 4, 5, 8, 9, 10, 13, 14, 15, 18, 19, 20].includes(y) && nearStart(1, 1, 1)(x, y) });
  b.scatter('d', 6, { ok: (x, y) => [1, 2, 6, 7].includes(y) && nearStart(1, 1, 1)(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 025 Uranium Mine: a big dig with four sealed RAM rooms and red disks to open them.
{
  const b = new Board(25, 'Uranium Mine', 100, 'A long shift. Plenty of Pellets lie loose; the four sealed rooms are a shortcut if you have red canisters.');
  const rooms = [[6, 3], [24, 12], [40, 3], [44, 15]];
  for (const [x, y] of rooms) b.box(x, y, 8, 5, 'R').rect(x + 1, y + 1, 6, 3, '.').h(x + 1, y + 3, 6, '*');
  const inRoom = (x, y) => rooms.some(([rx, ry]) => x >= rx && x < rx + 8 && y >= ry && y < ry + 5);
  b.scatter('O', 140, { ok: (x, y) => nearStart(1, 1)(x, y) && !inRoom(x, y) })
    .scatter('*', 115, { ok: (x, y) => nearStart(1, 1, 2)(x, y) && !inRoom(x, y) })
    .scatter('d', 9, { ok: (x, y) => nearStart(1, 1, 2)(x, y) && !inRoom(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 026 Chain Reaction: one Infotron behind a RAM shelf. A row of 35 orange disks is the fuse.
{
  const b = new Board(26, 'Chain Reaction', 1, 'One Pellet, one fuse. Push the first orange canister into the gap and watch the row go.', { fill: '#' });
  b.rect(2, 2, 9, 3, '.').set(11, 4, 'o').set(11, 5, 'R').v(12, 4, 3, ' ');
  b.h(12, 7, 35, 'o').h(11, 8, 37, 'R').h(13, 6, 34, ' ');
  b.rect(12, 9, 35, 3, '.').set(30, 11, '*').set(45, 11, 'X');
  b.set(3, 3, '@');
  b.save();
}

// 027 Fuel Flood: four quarters joined by two-way ports, packed with Zonks and Infotrons.
{
  const b = new Board(27, 'Fuel Flood', 110, 'Four rooms, two-way airlocks between them, and more Pellets than you need. Watch the Lead balls.');
  b.v(30, 1, 22, '#').h(1, 12, 58, '#').set(30, 5, '-').set(30, 18, '-').set(15, 12, '|').set(45, 12, '|');
  const nearPort = (x, y) => [[30, 5], [30, 18], [15, 12], [45, 12]].some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) <= 2);
  b.scatter('O', 200, { ok: (x, y) => nearStart(1, 1)(x, y) && !nearPort(x, y) })
    .scatter('*', 135, { ok: (x, y) => nearStart(1, 1, 2)(x, y) && !nearPort(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 028 Hot Field: Zonks, Infotrons and orange disks mixed through the Base.
{
  const b = new Board(28, 'Hot Field', 105, 'Orange canisters are mixed in with the Lead balls. Never eat the Graphite under one unless you want it gone.');
  b.scatter('O', 180, { ok: nearStart(1, 1) }).scatter('o', 28, { ok: nearStart(1, 1, 5) }).scatter('*', 125, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 029 Orange Sea: more orange disks than Zonks.
{
  const b = new Board(29, 'Orange Sea', 55, 'A sea of orange canisters. One careless step starts a chain. Clear a safe lane before you go deep.');
  b.scatter('o', 110, { ok: nearStart(1, 1, 5) }).scatter('O', 120, { ok: nearStart(1, 1) }).scatter('*', 85, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 030 Neutron Mine: ten Electron farms in two rows.
{
  const b = new Board(30, 'Neutron Mine', 50, 'Ten Neutron farms. Snap the plug beside each Lead ball, step back, and collect what falls out.');
  for (const top of [3, 13]) for (const cx of [5, 16, 27, 38, 49]) b.farm(cx, top);
  b.scatter('*', 25, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 031 Open Air: almost nothing to stand on; Infotrons line hardware ledges in open space.
{
  const b = new Board(31, 'Open Air', 90, 'Open space and concrete ledges. Three Gammas crawl along the ledges, so pick your moment.', { fill: ' ' });
  let k = 0;
  for (const y of [4, 8, 12, 16, 20]) {
    const off = (k++ % 2) * 4;
    for (let x = 3 + off; x + 9 <= 57; x += 14) { b.h(x, y, 10, '#'); for (let i = 0; i < 10; i += 1) if (i % 2 === 0 || y > 10) b.set(x + i, y - 1, '*'); }
  }
  b.h(1, 22, 58, '.');
  b.pts([[13, 6], [30, 14], [47, 10]], 'S');
  b.set(1, 1, '@').set(57, 21, 'X').set(57, 22, '.');
  b.save();
}

// 032 Rubble: the densest Zonk field yet, with red disks for blasting through.
{
  const b = new Board(32, 'Rubble', 55, 'So many Lead balls there is barely room to dig. A red canister can clear a jam, but it takes Pellets with it.');
  b.scatter('O', 220, { ok: nearStart(1, 1) }).scatter('*', 70, { ok: nearStart(1, 1, 2) }).scatter('d', 9, { ok: nearStart(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 033 Snake Pit: a hardware maze full of Snik Snaks; ports split it into sections they cannot leave.
{
  const b = new Board(33, 'Snake Pit', 28, 'A maze crawling with Gammas. They cannot pass airlocks, so each airlock is a safe line. Pellets wait in dead ends.', { fill: '#' });
  const CW = 29, CH = 11, seen = new Set(), stack = [[0, 0]];
  const cell = (cx, cy) => [1 + cx * 2, 1 + cy * 2];
  b.set(1, 1, ' '); seen.add('0,0');
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen.has(`${nx},${ny}`));
    if (!opts.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = opts[b.int(opts.length)];
    const [x, y] = cell(cx, cy);
    b.set(x + dx, y + dy, ' '); b.set(...cell(nx, ny), ' ');
    seen.add(`${nx},${ny}`); stack.push([nx, ny]);
  }
  // Ports on twenty passage cells (between two maze cells), away from the start.
  let ports = 0;
  for (let t = 0; ports < 20 && t < 5000; t++) {
    const x = 2 + b.int(56), y = 1 + b.int(21);
    if (b.get(x, y) !== ' ' || x + y < 8) continue;
    const horiz = x % 2 === 0 && y % 2 === 1, vert = x % 2 === 1 && y % 2 === 0;
    if (horiz) { b.set(x, y, '-'); ports++; } else if (vert) { b.set(x, y, '|'); ports++; }
  }
  // Infotrons in dead ends with hardware underneath.
  let infos = 0;
  for (let y = 1; y <= 21; y += 2) for (let x = 1; x <= 57; x += 2) {
    if (b.get(x, y) !== ' ' || (x < 6 && y < 6)) continue;
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.get(x + dx, y + dy) !== '#').length;
    if (open === 1 && b.get(x, y + 1) === '#') { b.set(x, y, '*'); infos++; }
  }
  b.scatter('S', 17, { on: ' ', ok: (x, y) => x + y > 20 && x % 2 === 1 && y % 2 === 1 });
  b.set(1, 1, '@').set(57, 21, 'X');
  b.need = Math.min(b.need, Math.floor(infos * 0.7));
  b.save();
}

// 034 Crossroads: a bit of everything. A walled east wing runs with gravity on.
{
  const b = new Board(34, 'Crossroads', 80, 'Two Gamma lanes, orange canisters, and an east wing where gravity switches on as you enter.')
    .head('special: 40,5 gravity on').head('special: 40,17 gravity off');
  b.v(40, 1, 22, '#').set(40, 5, '>').set(40, 17, '<').set(39, 5, '.').set(41, 5, '.').set(39, 17, '.').set(41, 17, '.');
  for (const y of [9, 15]) { b.h(2, y - 1, 36, 'R').h(2, y + 1, 36, 'R').h(3, y, 34, ' ').set(10, y - 1, '.').set(10, y + 1, '.').set(28, y - 1, '.').set(28, y + 1, '.'); }
  b.pts([[6, 9], [20, 9], [33, 9], [6, 15], [20, 15], [33, 15]], 'S');
  b.rect(44, 8, 6, 3, ' ').rect(50, 14, 6, 3, ' ');
  const lane = (x, y) => [8, 9, 10, 14, 15, 16].includes(y) && x < 40;
  b.scatter('O', 120, { ok: (x, y) => nearStart(1, 1)(x, y) && !lane(x, y) && Math.abs(x - 40) > 2 })
    .scatter('o', 19, { ok: (x, y) => nearStart(1, 1, 5)(x, y) && !lane(x, y) && x < 38 })
    .scatter('*', 105, { ok: (x, y) => nearStart(1, 1, 2)(x, y) && !lane(x, y) && Math.abs(x - 40) > 1 });
  b.set(1, 1, '@').set(2, 22, 'X');
  b.save();
}
