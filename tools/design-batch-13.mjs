// Scaffolding that drew the Classic Wing, levels 254-265, and wrote them to levels/*.txt. Each level takes
// one piece of logic from the classic game (crush a Gamma to open a cage, feed Lead to Neutrons, count
// red canisters exactly, push yellow canisters before the Terminal, push Lead into holes in order...)
// and builds a new floor round it. Re-running overwrites the files.
// Usage: node tools/design-batch-13.mjs
import { Board, rng } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx - 1 && x <= rx + w && y >= ry - 1 && y <= ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = (b, ex = 57, ey = 22) => b.set(1, 1, '@').set(ex, ey, 'X');

// A Pellet sealed in a 3x3 Cask cage with its top-left corner at (x, y).
const cage = (b, x, y, ch = '*') => b.rect(x, y, 3, 3, 'R').set(x + 1, y + 1, ch);
// A 2x2 pocket at (px-1..px, py..py+1) with a Gamma or Neutron going round in it, and a Lead ball
// two above its right column, held up by one cell of Graphite. Snap that cell and the ball drops in.
// Returns the area it uses.
function pocket(b, px, py, ch = 'S', lead = true) {
  b.rect(px - 1, py, 2, 2, ' ').set(px, py + 1, ch).set(px, py - 1, '.');
  if (lead) b.set(px, py - 2, 'O');
  return [px - 1, py - 2, 2, 4];
}

// 254 Bang: every Pellet is caged; the Gamma pocketed beside the cage is the only key.
{
  const b = new Board(254, 'Bang', 12, 'Every Pellet here is locked in a Cask cage, with a Gamma pocketed right beside it. Drop the Lead above the pocket onto the Gamma and its blast breaks the cage. Snap the Graphite from the side, then step away.');
  const used = [];
  for (const py of [4, 14]) for (const px of [6, 20, 34, 48]) {
    const p = px + (py > 10 ? 3 : 0);
    used.push(pocket(b, p, py, 'S'));
    cage(b, p + 1, py, '*'); used.push([p + 1, py, 3, 3]);
  }
  b.spread('*', 6, { ok: both(ends, outside(...used)) }).spread('O', 18, { ok: both(ends, outside(...used)) });
  finish(b).save();
}

// 255 No Pellets: not one Pellet on the floor. Every one comes out of a Neutron, fed a Lead ball.
{
  const b = new Board(255, 'No Pellets', 60, 'There is not a single Pellet on this floor. Each Neutron in its pocket splits into nine when a Lead ball lands on it. Half the balls hang right over their pockets; the rest must be pushed across first.');
  const used = [];
  let i = 0;
  for (const py of [4, 11, 18]) for (const px of [6, 16, 26, 36, 46, 54]) {
    if (py === 18 && px === 54) continue;
    const shifted = (i++ & 1) === 1;
    used.push(pocket(b, px, py, 'e', !shifted));
    if (shifted) b.set(px - 2, py - 2, 'O').set(px - 2, py - 1, '.');
  }
  b.spread('O', 10, { ok: both(ends, outside(...used)) });
  finish(b).save();
}

// 256 Shaft Drop: a Neutron shuttles up and down every Cask shaft; drop the Lead when it is low.
{
  const b = new Board(256, 'Shaft Drop', 40, 'A Neutron runs up and down each Cask shaft and a Lead ball waits at every mouth. Drop it while the Neutron is near the top and the blast reaches you; drop it while it is low and the Pellets pile up at the bottom.');
  b.rect(3, 4, 54, 17, 'R');
  for (let x = 6; x <= 54; x += 6) b.v(x, 4, 16, ' ').set(x, 4 + ((x * 5) % 13), 'e').set(x, 2, 'O').set(x, 3, '.');
  b.h(1, 21, 58, '.').h(1, 22, 58, '.');
  b.spread('O', 8, { y0: 21, ok: away(57, 22, 2) });
  finish(b).save();
}

// 257 Demolition Count: seven red canisters, six pairs of capsules, and the Reactor sealed in Casks.
// A canister in the gap between a pair opens both; anywhere else it opens one and the count fails.
{
  const b = new Board(257, 'Demolition Count', 12, 'Seven red canisters for six pairs of Pellet capsules and the sealed Reactor: no spare. A canister dropped in the gap between two capsules opens both. Dig the gap from above, drop it at the middle, and get out of the way.');
  const used = [];
  for (const [x, y] of [[5, 4], [23, 3], [41, 5], [8, 12], [27, 13], [44, 14]]) {
    cage(b, x, y); cage(b, x + 4, y); used.push([x, y, 7, 3]);
  }
  b.pts([[3, 9], [20, 8], [37, 10], [55, 2], [16, 19], [35, 20], [52, 9]], 'd');
  b.rect(55, 19, 4, 4, '.').h(55, 21, 4, 'R').v(55, 21, 2, 'R');
  b.spread('O', 22, { ok: both(both(ends, outside(...used)), (x, y) => !(x >= 54 && y >= 18)) });
  finish(b).save();
}

// 258 Up and Down: gravity on. Iso starts at the bottom and the Reactor is at the top. He climbs by
// eating Graphite, and every column he eats is a drop afterwards, never a ladder.
{
  const b = new Board(258, 'Up and Down', 30, 'Gravity is on, the Reactor is at the top and you start at the bottom. You climb by eating Graphite, and every column you eat is only a way down afterwards. Fall into a chasm and the climb starts again from there.');
  b.head('gravity: on');
  for (const [x, y0, y1] of [[9, 3, 20], [10, 3, 20], [21, 2, 16], [22, 2, 16], [33, 6, 21], [34, 6, 21], [45, 2, 18], [46, 2, 18]]) b.v(x, y0, y1 - y0 + 1, ' ');
  const chasm = (x, y) => [9, 10, 21, 22, 33, 34, 45, 46].some(c => Math.abs(x - c) <= 1);
  b.spread('*', 44, { ok: both(both(away(1, 22, 3), away(57, 1, 2)), (x, y) => !chasm(x, y)) });
  b.spread('O', 26, { ok: both(both(away(1, 22, 3), away(57, 1, 2)), (x, y) => !chasm(x, y)) });
  b.set(1, 22, '@').set(57, 1, 'X');
  b.save();
}

// 259 Terminal: yellow canisters to push into place beside the cages before anyone touches the Terminal.
{
  const b = new Board(259, 'Terminal', 8, 'One Terminal blows every yellow canister on the floor at once. Push each one up against a cage first, and the blast breaks the cage. A canister left beside a Pellet takes the Pellet with it, and so does one left beside you.');
  const rooms = [[3, 3], [17, 3], [31, 3], [45, 3], [3, 13], [17, 13], [31, 13], [45, 13]];
  rooms.forEach(([x, y], i) => {
    b.rect(x, y, 11, 7, '#').rect(x + 1, y + 1, 9, 5, ' ');
    cage(b, x + 6, y + 2);
    // the canister starts off the cage's row: one push down or up, then one along
    b.set(x + 3, y + (i & 1 ? 2 : 4), 'y');
    b.set(x + 1, y + 3, '-').set(x, y + 3, '-');
  });
  for (const [x, y] of rooms) b.set(x + 1, y + 3, ' ');
  b.set(29, 21, 'T');
  b.spread('O', 14, { ok: both(ends, outside(...rooms.map(([x, y]) => [x, y, 11, 7]))) });
  finish(b).save();
}

// 260 Orange Drop: orange canisters on ledges above cage roofs; push one off and it lands and blows the roof.
{
  const b = new Board(260, 'Orange Drop', 14, 'An orange canister blows up the moment it lands. Each one sits on a ledge beside an open shaft above a cage: push it in and the roof goes. Some ledges are the wrong side of the shaft; dig round to push from there.');
  const used = [];
  for (const [x, y, side] of [[4, 9, 1], [13, 7, -1], [22, 10, 1], [31, 8, -1], [40, 9, 1], [49, 7, -1], [6, 18, -1], [18, 17, 1], [30, 18, -1], [42, 17, 1], [52, 18, -1]]) {
    cage(b, x, y);
    b.v(x + 1, y - 4, 4, ' ').set(x + 1 + side, y - 4, 'o');
    used.push([x - 1, y - 5, 5, 8]);
  }
  b.spread('*', 6, { ok: both(ends, outside(...used)) }).spread('O', 14, { ok: both(ends, outside(...used)) });
  finish(b).save();
}

// 261 Hot Spot Field: bands of Hot spots with Pellets buried in them. A spot flares six ticks in every
// thirty-two, each on its own beat; step on one while it flares and that is the end.
{
  const b = new Board(261, 'Hot Spot Field', 30, 'Three bands of Hot spots with Pellets buried in them. Each spot flares on its own beat; step on one while it glows and it goes off under you. Watch the band, then cross on the cold ones.');
  for (const [y, h] of [[4, 4], [11, 4], [18, 3]]) {
    b.rect(1, y, 58, h, 'B');
    b.scatter('*', 12, { y0: y, y1: y + h - 1, on: 'B', ok: (x, yy) => yy === y + h - 1 || b.get(x, yy + 1) !== ' ' });
  }
  b.spread('O', 12, { ok: both(ends, (x, y) => b.get(x, y) === '.') }).spread('*', 4, { ok: ends });
  finish(b).save();
}

// 262 Airlock Maze: one-cell rooms joined by airlocks, most of them one way. Pellets sit in the gaps
// between rooms; Graphite gaps can be dug both ways.
{
  const b = new Board(262, 'Airlock Maze', 45, 'Rooms one cell wide, joined by airlocks that mostly go one way. A Pellet or a cell of Graphite between two rooms can be crossed either way. Find the loop that brings you back.');
  b.rect(1, 1, 58, 22, '#');
  const r = rng(262), CW = 29, CH = 11, room = (i, j) => [1 + 2 * i, 1 + 2 * j];
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) b.set(...room(i, j), ' ');
  // a spanning tree of two-way links keeps every room reachable both ways; extra links are one way
  const seen = new Set(['0,0']), stack = [[0, 0]], link = (i, j, di, dj, ch) => { const [x, y] = room(i, j); b.set(x + di, y + dj, ch); };
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => i + di >= 0 && j + dj >= 0 && i + di < CW && j + dj < CH && !seen.has(`${i + di},${j + dj}`));
    if (!opts.length) { stack.pop(); continue; }
    const [di, dj] = opts[Math.floor(r() * opts.length)];
    // A Pellet only goes in a gap between rooms side by side: in a gap between rooms one above the other it would fall.
    const k = r(), two = k < 0.3 && di ? '*' : k < 0.45 ? '.' : (di ? '-' : '|');
    link(i, j, di, dj, two);
    seen.add(`${i + di},${j + dj}`); stack.push([i + di, j + dj]);
  }
  // one-way shortcuts
  for (let n = 0; n < 120; n++) {
    const i = Math.floor(r() * CW), j = Math.floor(r() * CH), [di, dj] = [[1, 0], [0, 1]][Math.floor(r() * 2)];
    if (i + di >= CW || j + dj >= CH) continue;
    const [x, y] = room(i, j);
    if (b.get(x + di, y + dj) !== '#') continue;
    b.set(x + di, y + dj, di ? (r() < 0.5 ? '>' : '<') : (r() < 0.5 ? 'v' : '^'));
  }
  // An airlock cannot set Iso down on the Reactor, so the way into its room is a cell of Graphite.
  b.set(1, 1, '@').set(57, 21, 'X').set(56, 21, '.');
  b.save();
}

// 263 Silos: Cask silos packed with Lead and Pellets, standing on Graphite floors. Take a floor cell away
// and the silo empties down into whatever is under it.
{
  const b = new Board(263, 'Silos', 25, 'Five silos packed with Lead, with Pellets packed in among it. Eat the Graphite under a silo and it pours out. Stand under it and it pours onto you; take the floor from the side and step clear.');
  const used = [];
  for (const [x, w] of [[3, 8], [14, 9], [26, 8], [37, 9], [49, 8]]) {
    b.box(x - 1, 2, w + 2, 10, 'R').h(x - 1, 2, w + 2, '.').rect(x, 3, w, 8, 'O').h(x, 11, w, '.');
    b.scatter('*', 9, { x0: x, x1: x + w - 1, y0: 3, y1: 10, on: 'O' });
    used.push([x - 1, 2, w + 2, 11]);
  }
  b.spread('O', 10, { y0: 13, ok: both(ends, outside(...used)) }).spread('*', 6, { y0: 13, ok: both(ends, outside(...used)) });
  finish(b).save();
}

// 264 Chain Reaction: lines of Neutrons sealed shoulder to shoulder in Cask. One blast at the end of a
// line splits the lot, one after another, and leaves a band of Pellets.
{
  const b = new Board(264, 'Chain Reaction', 70, 'Each Cask tube holds a line of Neutrons shoulder to shoulder. Split one and the rest follow down the line, and the tube turns into a band of Pellets. One red canister per tube, and you are not the only thing in range.');
  const used = [];
  for (const [x, y, n] of [[4, 4, 9], [30, 3, 12], [8, 10, 7], [28, 11, 10], [44, 8, 6], [5, 17, 10], [27, 18, 12]]) {
    b.rect(x - 1, y - 1, n + 2, 3, 'R').h(x, y, n, 'e').set(x - 1, y - 1, '.');
    used.push([x - 1, y - 1, n + 2, 3]);
  }
  b.pts([[2, 7], [24, 6], [48, 4], [20, 14], [52, 12], [3, 21], [50, 20]], 'd');
  b.spread('O', 14, { ok: both(ends, outside(...used)) });
  finish(b).save();
}

// 265 Classic Finals: a cage with its Gamma, a Neutron pocket, capsule pairs, a Terminal room, a shaft.
{
  const b = new Board(265, 'Classic Finals', 40, 'The whole wing on one floor: cages that open when their Gamma is crushed, Neutrons waiting for Lead, capsule pairs that want one canister each, a Terminal room and a shaft. There are just enough canisters.');
  const used = [];
  for (const [px, py] of [[5, 4], [19, 4]]) { used.push(pocket(b, px, py, 'S')); cage(b, px + 1, py); used.push([px + 1, py, 3, 3]); }
  for (const [px, py] of [[34, 4], [44, 4], [54, 4]]) used.push(pocket(b, px, py, 'e'));
  for (const [x, y] of [[4, 12], [20, 12]]) { cage(b, x, y); cage(b, x + 4, y); used.push([x, y, 7, 3]); }
  b.pts([[3, 10], [17, 9]], 'd');
  b.rect(33, 10, 13, 7, '#').rect(34, 11, 11, 5, ' '); cage(b, 40, 12); b.set(36, 14, 'y').set(33, 13, '-');
  b.set(47, 20, 'T'); used.push([33, 10, 13, 7]);
  b.rect(49, 9, 3, 12, 'R').v(50, 9, 11, ' ').set(50, 15, 'e').set(50, 7, 'O').set(50, 8, '.'); used.push([49, 7, 3, 14]);
  b.spread('*', 14, { ok: both(ends, outside(...used)) }).spread('O', 14, { ok: both(ends, outside(...used)) });
  finish(b).save();
}
