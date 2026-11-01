// Scaffolding that drew the Physics Wing's generated levels, 149-166, and wrote them to levels/*.txt.
// The hand-drawn introductions (142-148) are not touched. Re-running overwrites the generated files.
// Usage: node tools/design-batch-8.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = b => b.set(1, 1, '@').set(57, 22, 'X');

// 149 Skating Rink: four rinks of Ice with Pellets lying on them, Lead between the rinks.
{
  const b = new Board(149, 'Skating Rink', 50, 'Four rinks. A slide carries Iso clear across one and takes every Pellet in its path; Lead sits on the floor between them, so look where a slide ends.');
  const rinks = [[4, 3, 20, 7], [34, 3, 22, 7], [4, 14, 22, 7], [34, 14, 20, 7]];
  for (const [x, y, w, h] of rinks) {
    b.rink(x, y, w, h);
    b.scatter('*', 8, { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1, on: 'I' });
  }
  const off = outside(...rinks);
  b.spread('O', 30, { ok: both(ends, off) }).spread('*', 20, { ok: both(ends, off) });
  finish(b).fit().save();
}

// 150 Assembly Line: three long belts carry Lead to the right and drop it down shafts; the Pellets lie
// under the belts, so Iso digs beneath them while the balls roll overhead.
{
  const b = new Board(150, 'Assembly Line', 55, 'Three belts run right and tip their Lead down the shafts at their ends. The Pellets are under the belts; the shafts are where the Lead lands, so cross them between deliveries.');
  for (const y of [5, 11, 17]) {
    b.belt(4, y, 48, 1);
    for (let x = 6; x < 50; x += 6) b.set(x, y - 1, 'O');
    b.v(52, y - 1, 5, ' ').set(52, y + 4, '#');
    b.h(4, y + 1, 48, '.');
  }
  b.spread('*', 70, { ok: both(ends, (x, y) => ![4, 5, 10, 11, 16, 17].includes(y) && x < 51) });
  finish(b).fit().save();
}

// 151 Pinball: Alpha particles bounce along open lanes that cut the field both ways.
{
  const b = new Board(151, 'Pinball', 55, 'Alpha particles fly the open lanes and turn round at the ends. Every lane is a crossing you have to time; dig beside them, never along them.');
  for (const y of [4, 10, 16]) b.lane(3, y, 54, 'A');
  for (const x of [12, 30, 48]) b.lane(x, 2, 20, 'V');
  const offLane = (x, y) => ![4, 10, 16].includes(y) && ![12, 30, 48].includes(x);
  b.spread('*', 75, { ok: both(ends, offLane) }).spread('O', 20, { ok: both(ends, offLane) });
  finish(b).fit().save();
}

// 152 Hall of Mirrors: laser corridors with mirrors that bend the beams round corners.
{
  const b = new Board(152, 'Hall of Mirrors', 45, 'Three laser halls. Mirrors bend each beam round a corner, so the dark cells are not where you think; watch a full pulse before you commit, and push a mirror if the beam is in your way.');
  const hall = (x, y) => {
    b.rect(x, y, 18, 6, ' ').box(x - 1, y - 1, 20, 8, '#');
    b.set(x, y, 'l').set(x + 17, y, '\\').set(x + 17, y + 5, '/').set(x + 8, y + 5, '/').set(x + 8, y + 2, '\\');
    b.set(x - 1, y + 3, '.').set(x + 18, y + 3, '.');
    b.scatter('*', 6, { x0: x + 1, y0: y + 5, x1: x + 16, y1: y + 5, on: ' ' });
  };
  hall(4, 3); hall(38, 3); hall(21, 13);
  const halls = outside([3, 2, 20, 8], [37, 2, 20, 8], [20, 12, 20, 8]);
  b.spread('*', 35, { ok: both(ends, halls) }).spread('O', 15, { ok: both(ends, halls) });
  finish(b).fit().save();
}

// 153 Lockdown: six Pellet vaults behind gates; one switch opens them all, Lead on a plate shuts them.
{
  const b = new Board(153, 'Lockdown', 48, 'Six vaults, every door a gate, and one switch in the middle of the floor. Lead dropped on a switch throws it too, so mind what you dig above the plates.');
  const vaults = [[4, 3], [26, 3], [48, 3], [4, 15], [26, 15], [48, 15]];
  for (const [x, y] of vaults) {
    b.box(x, y, 8, 6, '#').set(x, y + 2, 'g').set(x, y + 3, '#');
    b.spread('*', 8, { x0: x + 1, y0: y + 1, x1: x + 6, y1: y + 4 });
  }
  b.set(30, 11, 's').set(30, 9, '.').set(30, 10, ' ');
  b.pts([[12, 11], [46, 11]], 's');
  const open = outside(...vaults.map(([x, y]) => [x - 1, y - 1, 10, 8]));
  b.spread('O', 40, { ok: both(ends, open) }).spread('*', 10, { ok: both(ends, open) });
  finish(b).fit().save();
}

// 154 Crate Yard: a laser-lit hall full of crates to shadow the beams.
{
  const b = new Board(154, 'Crate Yard', 40, 'A yard swept by lasers on both axes. The crates push any way and stop a beam dead; build your own shadows and keep the Pellets out of the light.');
  b.rect(8, 4, 44, 16, ' ').box(7, 3, 46, 18, '#').set(7, 11, '.').set(52, 11, '.');
  for (const y of [6, 12, 17]) b.set(8, y, 'l');
  for (const x of [18, 32, 44]) b.set(x, 4, 'i');
  b.scatter('c', 16, { x0: 9, y0: 5, x1: 50, y1: 18, on: ' ' });
  b.scatter('*', 30, { x0: 9, y0: 5, x1: 50, y1: 18, on: ' ', ok: (x, y) => b.get(x, y + 1) !== ' ' || y === 18 });
  const yard = outside([7, 3, 46, 18]);
  b.spread('*', 20, { ok: both(ends, yard) });
  finish(b).fit().save();
}

// 155 Induction: magnets at the ends of empty galleries, Lead on ledges along them.
{
  const b = new Board(155, 'Induction', 50, 'Magnets sit at the ends of the galleries. Open a line of sight and the Lead comes to them; where the floor is missing on the way, it drops. Use that.');
  for (const y of [4, 10, 16]) {
    b.h(3, y, 54, ' ').set(2, y, 'M').set(57, y, 'M');
    for (let x = 8; x < 54; x += 9) { b.set(x, y, 'O'); b.set(x + 3, y + 1, ' '); b.set(x + 3, y + 2, ' '); }
    b.h(3, y + 1, 54, '#').pts([[11, y + 1], [20, y + 1], [29, y + 1], [38, y + 1], [47, y + 1]], ' ');
  }
  b.spread('*', 70, { ok: both(ends, (x, y) => y % 6 !== 4 && y % 6 !== 5) }).spread('S', 0, {});
  for (const y of [6, 12, 18]) for (const x of [11, 29, 47]) b.rect(x - 1, y, 3, 1, ' ').set(x, y, 'S');
  finish(b).fit().save();
}

// 156 Black Ice: an ice maze with Gammas sealed in side rooms and Pellets along the slides.
{
  const b = new Board(156, 'Black Ice', 45, 'A maze cut in ice. Every corridor is a slide to its far end, so plan each run by where it stops; the rooms off the maze hold Gammas, and a slide into one is the end.', { fill: '#' });
  b.maze('I');
  b.h(1, 21, 57, '.').v(57, 1, 21, '.');
  b.scatter('*', 60, { on: 'I', ok: ends });
  for (const [x, y] of [[9, 5], [27, 9], [45, 13], [15, 17], [39, 3]]) { b.rect(x, y, 3, 1, ' ').set(x, y, 'S'); b.set(x + 1, y - 1, 'I'); }
  b.rect(2, 2, 5, 3, '.').rect(49, 17, 9, 5, '.');
  finish(b).fit(0.35).save();
}

// 157 Terminal Belt: belts feed Lead onto Gamma pockets by themselves; Iso waits, then clears up.
{
  const b = new Board(157, 'Terminal Belt', 50, 'The belts are already running. Each one drops its Lead on a Gamma below the far end, so stand back and let the plant do the work; then take the Pellets the blasts uncover.');
  for (const [y, dir] of [[5, 1], [11, 3], [17, 1]]) {
    const x0 = dir === 1 ? 4 : 10, end = dir === 1 ? 51 : 9;
    b.belt(x0, y, 42, dir);
    for (let x = x0 + 2; x < x0 + 42; x += 8) b.set(x, y - 1, 'O');
    b.v(end, y - 1, 3, ' ').set(end, y + 2, 'S').pts([[end - 1, y + 2], [end + 1, y + 2]], 'R').set(end, y + 3, 'R');
    b.rect(end - 1, y + 4, 3, 1, '*');
  }
  b.spread('*', 45, { ok: both(ends, (x, y) => ![4, 5, 10, 11, 16, 17].includes(y) && x > 12 && x < 48) });
  finish(b).fit().save();
}

// 158 Cross Fire: lasers on both axes, mirrors and crates in a concrete grid.
{
  const b = new Board(158, 'Cross Fire', 45, 'Lasers on both axes, mirrors at the junctions. Every mirror you push changes where the light goes; the crates are your shields.');
  for (const x of [15, 30, 45]) b.v(x, 2, 20, ' ').set(x, 2, 'i');
  for (const y of [7, 15]) b.h(2, y, 56, ' ').set(2, y, 'l');
  b.pts([[15, 7], [45, 15]], '\\').pts([[30, 7], [15, 15]], '/');
  b.pts([[10, 7], [20, 15], [38, 7], [52, 15], [30, 11], [45, 4]], 'c');
  const off = (x, y) => ![15, 30, 45].includes(x) && ![7, 15].includes(y);
  b.spread('*', 70, { ok: both(ends, off) }).spread('O', 18, { ok: both(ends, off) });
  finish(b).fit().save();
}

// 159 Bouncing Betty: vertical Alpha shafts between ice rinks.
{
  const b = new Board(159, 'Bouncing Betty', 45, 'Alpha shafts between the rinks. A slide that ends in a shaft ends in an Alpha; stop short, wait for it to pass, then cross.');
  for (const x of [10, 20, 30, 40, 50]) b.lane(x, 2, 20, 'V');
  for (const [x, w] of [[3, 6], [12, 7], [22, 7], [32, 7], [42, 7], [52, 5]]) { b.rink(x, 6, w, 4); b.rink(x, 14, w, 4); }
  b.scatter('*', 40, { on: 'I', ok: ends });
  b.spread('*', 30, { ok: both(ends, (x, y) => ![10, 20, 30, 40, 50].includes(x)) });
  finish(b).fit().save();
}

// 160 Loading Dock: ride the belts over an open pit floor where Gammas patrol.
{
  const b = new Board(160, 'Loading Dock', 40, 'Belts bridge the pit; ride them over the Gammas on the floor below, and step off where the Pellets are shelved. The belts run one way, so the way back is another belt.');
  b.rect(2, 6, 56, 12, ' ');
  for (const [y, dir] of [[8, 1], [12, 3], [16, 1]]) b.belt(3, y, 54, dir);
  for (const y of [9, 13, 17]) for (let x = 6; x < 56; x += 10) b.set(x, y, '*');
  b.pts([[20, 7], [40, 11], [12, 15], [48, 15]], 'S');
  b.pts([[2, 7], [57, 11], [2, 15]], '.');
  b.spread('*', 25, { ok: both(ends, (x, y) => y < 5 || y > 18) });
  finish(b).fit().save();
}

// 161 Magnetic Storm: magnets in the walls of a Lead-strewn field, Gammas in pockets under the gaps.
{
  const b = new Board(161, 'Magnetic Storm', 50, 'Magnets line the walls. Every line you clear towards one starts the Lead moving, and the floor has gaps; use the pull to bomb the Gamma pockets, and never stand between a ball and a magnet.');
  for (const y of [3, 8, 13, 18]) { b.set(1, y, 'M'); b.set(58, y, 'M'); }
  for (const x of [10, 25, 40]) for (const y of [6, 11, 16]) { b.rect(x - 1, y, 3, 1, ' ').set(x, y, 'S'); b.set(x, y - 1, ' '); }
  b.spread('O', 60, { ok: ends }).spread('*', 70, { ok: ends });
  finish(b).fit().save();
}

// 162 Relay: three rooms in a chain, a gate between each pair, switches beside the gates; every switch
// flips every gate, so the one ahead opens as the one behind closes.
{
  const b = new Board(162, 'Relay', 40, 'Three rooms in a chain and a gate between each pair, with switches beside the gates. Every switch flips every gate: the one ahead opens and the one behind closes. Count your flips, and take what you need from each room before you move on.');
  for (const [x, ch] of [[20, 'g'], [40, 'q']]) { b.v(x, 1, 22, '#').set(x, 11, ch); b.set(x - 2, 11, 's').set(x + 2, 11, 's'); }
  b.spread('*', 60, { ok: both(ends, (x, y) => x !== 20 && x !== 40 && Math.abs(y - 11) > 1) }).spread('O', 12, { ok: both(ends, (x, y) => x !== 20 && x !== 40 && y < 9) });
  finish(b).fit(0.6).save();
}

// 163 Frozen Lake: the whole floor is ice with Graphite islands; Gammas skate the open water.
{
  const b = new Board(163, 'Frozen Lake', 40, 'The whole lake is ice. Iso slides from island to island; aim each run at an island or a Pellet, because open ice carries you to the shore, and the shore is where the Gammas are.', { fill: 'I' });
  for (let t = 0; t < 16; t++) { const x = 3 + b.int(50), y = 2 + b.int(17); b.rect(x, y, 3 + b.int(4), 2 + b.int(2), '.'); }
  b.rect(1, 1, 4, 3, '.').rect(54, 20, 5, 3, '.');
  b.scatter('*', 50, { on: 'I', ok: ends });
  b.spread('*', 15, { ok: ends });
  for (const [x, y] of [[20, 1], [40, 22], [1, 12], [58, 8]]) { b.set(x, y, ' '); }
  b.pts([[20, 1], [40, 22]], 'S');
  finish(b).fit(0.8).save();
}

// 164 Prism: one laser, a dozen mirrors, the beam folded all over the floor.
{
  const b = new Board(164, 'Prism', 45, 'One laser and a dozen mirrors fold its beam right round the floor. Every pulse lights the whole path at once; learn the path, or push a mirror and shorten it.');
  const path = [[3, 3, 'l'], [55, 3, '\\'], [55, 20, '/'], [8, 20, '\\'], [8, 8, '/'], [48, 8, '\\'], [48, 15, '/'], [16, 15, '\\'], [16, 11, '/'], [40, 11, '\\']];
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, y0] = path[i], [x1, y1] = path[i + 1];
    if (y0 === y1) b.h(Math.min(x0, x1), y0, Math.abs(x1 - x0) + 1, ' '); else b.v(x0, Math.min(y0, y1), Math.abs(y1 - y0) + 1, ' ');
  }
  for (const [x, y, ch] of path) b.set(x, y, ch);
  b.set(40, 12, '.');
  b.spread('*', 70, { ok: ends }).spread('O', 20, { ok: ends });
  finish(b).fit().save();
}

// 165 Conveyor Maze: belts in a maze of concrete, running both ways.
{
  const b = new Board(165, 'Conveyor Maze', 45, 'Belts thread the maze, and they do not care which way you wanted to go. Ride with them where you can, dig round them where you cannot, and remember what they carry.', { fill: '#' });
  b.maze('.');
  for (let y = 3; y <= 21; y += 4) for (let x = 2; x < 56; x += 11) {
    if ([0, 1, 2].every(i => b.get(x + i, y) === '.' && b.get(x + i, y + 1) === '#')) { b.h(x, y + 1, 3, (x / 11) % 2 ? ']' : '['); b.h(x, y, 3, ' '); }
  }
  b.spread('*', 65, { ok: ends });
  finish(b).fit(0.8).save();
}

// 166 Physics Finals: everything in the wing at once.
{
  const b = new Board(166, 'Physics Finals', 60, 'Everything the Physics Wing taught, on one floor: ice, belts, magnets, mirrors, gates, crates and Alphas. The Reactor sits in a gated room; find a switch first.');
  b.rink(3, 3, 14, 5).rink(43, 14, 14, 3);
  b.belt(20, 6, 20, 1); b.set(22, 5, 'O').set(30, 5, 'O');
  b.set(44, 4, 'M').h(38, 4, 6, ' ').set(37, 4, 'O').set(40, 5, ' ').rect(39, 6, 3, 1, ' ').set(40, 6, 'S');
  b.h(4, 12, 52, ' ').set(4, 12, 'l').set(30, 12, '\\').v(30, 13, 6, ' ').set(30, 18, '/').h(31, 18, 10, ' ');
  b.lane(20, 14, 10, 'A').lane(50, 8, 6, 'V');
  b.pts([[12, 12], [40, 18], [25, 16]], 'c');
  b.box(49, 18, 10, 5, '#').set(49, 20, 'g').rect(50, 19, 8, 3, '.').set(57, 22, 'X');
  b.set(10, 20, 's').set(44, 2, 's').set(44, 3, ' ');
  const busy = outside([2, 2, 16, 7], [42, 13, 16, 5], [19, 4, 22, 4], [36, 3, 10, 5], [3, 11, 54, 3], [29, 12, 13, 8], [48, 17, 12, 6]);
  b.spread('*', 60, { ok: both(ends, busy) }).spread('O', 20, { ok: both(ends, busy) });
  b.scatter('*', 10, { on: 'I', ok: ends });
  b.set(1, 1, '@');
  b.fit().save();
}
