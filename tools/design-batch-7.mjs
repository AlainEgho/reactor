// One-off scaffolding that drew the second bonus set, levels 122-131 (the lower plant), and wrote them
// to levels/*.txt. Re-running overwrites the files.
// Usage: node tools/design-batch-7.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);

// 122 Isotope Lab: six hardware rooms joined by ports, each with its own hazard.
{
  const b = new Board(122, 'Isotope Lab', 45,'Six labs, six samples: Lead, Hot spots, a Neutron farm, sleeping Gammas, orange canisters, and the Reactor room. Work through them in any order.');
  b.v(20, 1, 22, '#').v(40, 1, 22, '#').h(1, 11, 58, '#');
  b.pts([[20, 5], [40, 5], [20, 17], [40, 17]], '-').pts([[10, 11], [30, 11], [50, 11]], '|');
  const room = (x0, y0, x1, y1) => ({ x0, y0, x1, y1, ok: ends });
  b.spread('O', 8, room(1, 1, 19, 10)).spread('*', 10, room(1, 1, 19, 10));
  b.spread('B', 25, room(21, 1, 39, 10)).spread('*', 14, room(21, 1, 39, 10));
  b.farm(47, 4, 'O').spread('*', 6, room(41, 1, 58, 10));
  b.rect(4, 15, 4, 1, ' ').set(4, 15, 'S').rect(11, 19, 4, 1, ' ').set(11, 19, 'S');
  b.spread('*', 12, { x0: 1, y0: 12, x1: 19, y1: 22, ok: outside([2, 13, 8, 5], [9, 17, 8, 5]) });
  b.spread('o', 4, room(21, 12, 39, 22)).spread('*', 14, room(21, 12, 39, 22)).spread('O', 10, room(21, 12, 39, 22));
  b.spread('*', 10, room(41, 12, 58, 22)).spread('O', 6, room(41, 12, 58, 22));
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 123 Decay Chain: a maze of Base corridors cut through solid hardware, Bugs along the way. (No Zonks:
// in a one-wide corridor a Zonk cannot be pushed aside, so each one would seal the maze.)
{
  const b = new Board(123, 'Decay Chain', 55, 'One long chain of tunnels through the concrete. Some of the Graphite along the way is a Hot spot, and in a tunnel there is no way round it: wait for it to flare, then go.', { fill: '#' });
  b.maze('.');
  b.spread('*', 70, { ok: ends }).spread('B', 20, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 124 Rotor: eight hardware spokes radiating from a central hub.
{
  const b = new Board(124, 'Rotor', 60, 'A turbine rotor: eight concrete blades round a hub. The Pellets lie between the blades, so go round the hub, not through it.');
  b.rect(27, 10, 5, 3, '#');
  for (const [dx, dy, n] of [[1, 0, 24], [-1, 0, 24], [0, 1, 9], [0, -1, 9], [1, 1, 9], [-1, 1, 9], [1, -1, 9], [-1, -1, 9]]) {
    for (let i = 1; i <= n; i++) { const x = 29 + dx * (i + 2), y = 11 + dy * (i + 1); if (x >= 2 && x <= 57 && y >= 2 && y <= 21) b.set(x, y, '#'); }
  }
  b.spread('*', 75, { ok: ends }).spread('O', 40, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 125 Fallout Shelter: six hardware bunkers, each with a two-way port door, in a field of Bugs.
{
  const b = new Board(125, 'Fallout Shelter', 50, 'Six shelters in a hot field. Each has one airlock door on its west side; the Pellets inside are safe, the Hot spots outside are not.');
  const bunkers = [[4, 3], [24, 3], [44, 3], [4, 14], [24, 14], [44, 14]];
  for (const [x, y] of bunkers) {
    b.box(x, y, 9, 6, '#').set(x, y + 2, '-');
    b.spread('*', 8, { x0: x + 1, y0: y + 1, x1: x + 7, y1: y + 4 });
  }
  const open = outside(...bunkers.map(([x, y]) => [x - 1, y - 1, 11, 8]));
  b.spread('B', 30, { ok: both(ends, open) }).spread('O', 30, { ok: both(ends, open) }).spread('*', 15, { ok: both(ends, open) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 126 Tokamak: a ring of Infotrons round a hardware core, with a looser ring of Zonks outside it.
{
  const b = new Board(126, 'Tokamak', 60, 'A tokamak: the fuel runs in a ring round the concrete core, and a ring of Lead hangs outside it. Take the ring from the inside edge.');
  const r = (x, y) => Math.hypot((x - 29.5) / 26, (y - 11.5) / 10);
  for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) {
    const d = r(x, y);
    if (d < 0.3) b.set(x, y, '#');
    else if (d > 0.55 && d < 0.68 && (x + y) % 2 === 0) b.set(x, y, '*');
    else if (d > 0.8 && d < 0.9 && (x + 2 * y) % 3 === 0) b.set(x, y, 'O');
  }
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 127 Enrichment: staggered hardware pegs, each with an Infotron (or now and then a Zonk) on top.
{
  const b = new Board(127, 'Enrichment', 60, 'An enrichment cascade: row after row of concrete pegs, a Pellet on each. Every fourth peg holds Lead instead, so look up before you take one.');
  let k = 0;
  for (const [row, y] of [4, 8, 12, 16, 20].entries()) for (let x = 3 + (row % 2) * 3; x <= 56; x += 6) {
    b.set(x, y, '#').set(x, y - 1, k++ % 4 === 3 ? 'O' : '*');
  }
  b.spread('B', 8, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 128 Pipework: three long hardware pipes lying across the board, Infotrons along their floors,
// entered through ports in their roofs.
{
  const b = new Board(128, 'Pipework', 65, 'Three coolant pipes cross the plant. Drop in through an airlock in the roof and walk the pipe; each one has a way back out every twenty steps.');
  for (const y of [5, 11, 17]) {
    b.h(2, y - 1, 56, '#').h(2, y + 1, 56, '#').h(3, y, 54, ' ').set(2, y, '#').set(57, y, '#');
    for (const x of [10, 30, 50]) b.set(x, y - 1, '|');
    for (let x = 4; x <= 56; x += 2) if (![10, 30, 50].includes(x)) b.set(x, y, '*');
  }
  b.spread('O', 30, { ok: ends }).spread('*', 10, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 129 Heavy Water: gravity on everywhere, solid Base with small caves, Zonks and Infotrons.
{
  const b = new Board(129, 'Heavy Water', 55, 'Gravity is on from the start. The Graphite holds you up and the caves do not, so look down before every step.');
  b.head('gravity: on');
  for (let t = 0; t < 14; t++) { const x = 4 + b.int(48), y = 3 + b.int(16); b.rect(x, y, 3 + b.int(4), 2, ' '); }
  b.spread('O', 55, { ok: ends }).spread('*', 70, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 130 Scram: orange disks among the Zonks; every careless dig sets one off.
{
  const b = new Board(130, 'Scram', 65, 'Emergency shutdown: orange canisters are packed in among the Lead. Every one you drop is a blast, so dig so they fall where nothing you need is lying.');
  b.spread('o', 30, { ok: ends }).spread('O', 50, { ok: ends }).spread('*', 85, { ok: ends }).spread('B', 10, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 131 Last Light: the finale of the second set. Two farms, two Snik Snak pockets, Zonks, orange disks.
{
  const b = new Board(131, 'Last Light', 95, 'The last light in the plant. Two Neutron farms, Gammas asleep in the Graphite, Lead everywhere and a few orange canisters. Bring the core up one last time.');
  [10, 40].forEach(cx => b.farm(cx, 14, 'o'));
  for (const [x, y] of [[20, 4], [44, 6]]) b.rect(x, y, 5, 1, ' ').set(x, y, 'S');
  const pockets = outside([18, 2, 9, 5], [42, 4, 9, 5]);
  b.spread('O', 100, { ok: both(ends, pockets) }).spread('o', 5, { ok: both(ends, pockets) }).spread('*', 100, { ok: both(ends, pockets) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit(0.8).save();
}
