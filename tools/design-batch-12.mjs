// Scaffolding that drew the Gamma Wing, levels 242-253, and wrote them to levels/*.txt. Every level
// takes a Gamma pattern from the classic game (guards circling a post, sleepers sealed beside a Pellet,
// trains in a ring round a vault, a sealed row that pours out, a packed nest) in new layouts.
// A Gamma keeps the wall on its left and starts facing up, so a Gamma on the east side of a post, or on
// the top of a ring, runs round it anticlockwise forever and never takes an opening on its right.
// Re-running overwrites the files.
// Usage: node tools/design-batch-12.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx - 1 && x <= rx + w && y >= ry - 1 && y <= ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = (b, ex = 57, ey = 22) => b.set(1, 1, '@').set(ex, ey, 'X');

// A Pellet on a Concrete post h high, in a ring carved one cell wide round it. Gammas start on the
// east side and the top, the cells where facing up already runs them anticlockwise. Area x-1..x+1, y-1..y+h+1.
function orbit(b, x, y, h = 1, gammas = 1) {
  b.rect(x - 1, y - 1, 3, h + 3, ' ').set(x, y, '*').v(x, y + 1, h, '#');
  const starts = [[x + 1, y + h], [x, y - 1], [x + 1, y + h - 2]];
  for (let i = 0; i < gammas; i++) b.set(...starts[i], 'S');
  return [x - 1, y - 1, 3, h + 3];
}
// A wide post: a Concrete slab w wide with a row of Pellets on it, ringed and guarded the same way.
function carousel(b, x, y, w, gammas) {
  b.rect(x - 1, y - 1, w + 2, 4, ' ').h(x, y, w, '*').h(x, y + 1, w, '#');
  const starts = [[x + w, y + 1], [x + w - 1, y - 1], [x + w - 4, y - 1], [x + w - 7, y - 1], [x + w - 10, y - 1]];
  for (let i = 0; i < gammas; i++) b.set(...starts[i], 'S');
  return [x - 1, y - 1, w + 2, 4];
}
// A vault: a Concrete box with Pellets in Graphite inside, a one-wide ring round it carved out of the
// Graphite, and Gammas running the ring. Airlocks in the box walls are the only way in; Gammas cannot
// use them. ports: list of 'n' 's' 'w' 'e' (the middle of that wall). Area x..x+w-1, y..y+h-1.
function vault(b, x, y, w, h, gammas, ports = 'ns') {
  b.rect(x, y, w, h, ' ').box(x + 1, y + 1, w - 2, h - 2, '#').rect(x + 2, y + 2, w - 4, h - 4, '.');
  const mx = x + (w >> 1), my = y + (h >> 1);
  for (const p of ports) {
    if (p === 'n') b.set(mx, y + 1, '|'); if (p === 's') b.set(mx, y + h - 2, '|');
    if (p === 'w') b.set(x + 1, my, '-'); if (p === 'e') b.set(x + w - 2, my, '-');
  }
  // Gammas on the top row (they run west) and the east side (they run north), every other cell.
  const starts = [];
  for (let i = x + w - 2; i > x; i -= 3) starts.push([i, y]);
  for (let j = y + h - 2; j > y; j -= 3) starts.push([x + w - 1, j]);
  for (let i = 0; i < gammas; i++) b.set(...starts[i], 'S');
  return [x, y, w, h];
}
// Pellets on every other cell of a vault's floor, each on the Graphite under it.
function stock(b, x, y, w, h, every = 2) {
  for (let j = y + 2; j < y + h - 2; j++) for (let i = x + 2 + (j & 1); i < x + w - 2; i += every) b.set(i, j, '*');
}

// 242 Orbit: one Gamma round each post; dig up to the ring, wait for it to pass, take the Pellet.
{
  const b = new Board(242, 'Orbit', 20, 'Each Pellet sits on a post with a Gamma circling it. Dig up to the ring, let the Gamma go by, then reach in and take the Pellet. A Gamma never leaves its ring.');
  const rings = [];
  for (const [x, y] of [[8, 5], [18, 9], [28, 5], [38, 9], [48, 5], [8, 15], [18, 18], [28, 15], [38, 18], [48, 15], [54, 10], [3, 10]])
    rings.push(orbit(b, x, y));
  b.spread('*', 10, { ok: both(ends, outside(...rings)) }).spread('O', 14, { ok: both(ends, outside(...rings)) });
  finish(b).save();
}

// 243 Sleepers: Gammas sealed in the Graphite beside Pellets. Eat the wrong cell and one wakes up.
{
  const b = new Board(243, 'Sleepers', 30, 'Gammas sleep in the Graphite, each one right beside a Pellet. Take a Pellet from the side away from its Gamma and it stays asleep. Open its cell and it follows your tunnels.');
  const pats = [['*S', 4, 4], ['S*', 14, 3], ['*S*', 24, 5], ['S*S', 36, 3], ['*S', 48, 5], ['*S*S*', 6, 9], ['S*', 20, 10], ['*S*', 30, 8],
    ['S*S', 44, 10], ['*S', 53, 13], ['*S*', 4, 15], ['S*S*S', 14, 16], ['*S', 27, 13], ['S*', 34, 17], ['*S*', 42, 15], ['S*S', 50, 19], ['*S', 22, 20], ['S*', 8, 20]];
  const spots = [];
  for (const [p, x, y] of pats) { for (let i = 0; i < p.length; i++) b.set(x + i, y, p[i]); spots.push([x, y, p.length, 1]); }
  b.spread('*', 6, { ok: both(ends, outside(...spots)) }).spread('O', 26, { ok: both(ends, outside(...spots)) });
  finish(b).save();
}

// 244 The Compound: three vaults, each with a busier ring of Gammas round it.
{
  const b = new Board(244, 'The Compound', 84, 'Three vaults full of Pellets, each ringed by a corridor of Gammas. Dig to the ring opposite an airlock, wait for a gap in the train, and cross. The more Gammas, the shorter the gap.');
  const v = [vault(b, 4, 4, 14, 9, 2, 'ns'), vault(b, 23, 10, 16, 10, 4, 'nw'), vault(b, 43, 3, 13, 11, 6, 'ws')];
  stock(b, 4, 4, 14, 9); stock(b, 23, 10, 16, 10); stock(b, 43, 3, 13, 11);
  b.spread('O', 16, { ok: both(ends, outside(...v)) }).spread('*', 4, { ok: both(ends, outside(...v)) });
  finish(b).save();
}

// 245 Run For Life: a row of Gammas sealed along the floor, with Pellets lying on them.
{
  const b = new Board(245, 'Run For Life', 27, 'Fifty Gammas lie sealed along the floor and the last Pellets lie right on top of them. Each one you take lets a Gamma out, and it follows your tunnels. Dig the way out first, take those Pellets last, and run.');
  b.h(1, 22, 58, '#').h(3, 21, 54, 'S').h(1, 21, 2, '#').h(57, 21, 2, '#');
  for (let x = 6; x < 56; x += 5) b.set(x, 20, '*');
  const posts = [];
  for (let x = 5; x < 56; x += 7) for (const y of [5, 11]) { const yy = y + ((x / 7) & 1) * 2; b.set(x, yy, '*').set(x, yy + 1, '#'); posts.push([x, yy, 1, 2]); }
  b.spread('O', 24, { ok: both(away(1, 1, 3), (x, y) => y < 18) }).spread('*', 8, { ok: both(away(1, 1, 3), (x, y) => y < 18) });
  finish(b, 57, 1).save();
}

// 246 Carousel: wide posts with a row of Pellets on each and several Gammas running round.
{
  const b = new Board(246, 'Carousel', 56, 'Long shelves of Pellets, each with a train of Gammas going round it. Take a Pellet from the shelf as the gap goes past, then step back out of the ring before the next car comes round.');
  const c = [carousel(b, 4, 4, 9, 2), carousel(b, 20, 6, 12, 3), carousel(b, 40, 4, 10, 2), carousel(b, 6, 14, 11, 3), carousel(b, 26, 16, 9, 2), carousel(b, 41, 14, 13, 4)];
  b.spread('O', 18, { ok: both(ends, outside(...c)) });
  finish(b).save();
}

// 247 Hornets' Nest: a Cask nest packed with Gammas round posts of Pellets; red canisters outside.
{
  const b = new Board(247, "Hornets' Nest", 24, 'The nest is an open hall of Casks and posts, crawling with Gammas, and most of the Pellets you need sit on its posts. Four airlocks lead in. A red canister dropped inside takes the nearest Gammas with it.');
  b.rect(16, 5, 30, 14, 'R').rect(17, 6, 28, 12, ' ').pts([[16, 11], [45, 11]], '-').pts([[30, 5], [30, 18]], '|');
  for (const [x, y] of [[20, 9], [26, 13], [32, 8], [38, 13], [42, 9], [22, 15], [34, 14], [29, 10]]) b.set(x, y, '*').set(x, y + 1, '#');
  for (const [x, y] of [[24, 7], [30, 15], [40, 11], [19, 12], [36, 7], [43, 16]]) b.set(x, y, 'R').set(x, y + 1, 'R');
  for (const [x, y] of [[21, 10], [27, 14], [33, 9], [39, 14], [43, 10], [23, 16], [35, 15], [30, 11]]) b.set(x, y, 'S');
  b.pts([[10, 4], [12, 18], [50, 6], [49, 19], [30, 2], [30, 21]], 'd');
  b.spread('*', 18, { ok: both(ends, outside([16, 5, 30, 14])) }).spread('O', 20, { ok: both(ends, outside([16, 5, 30, 14])) });
  finish(b).save();
}

// 248 Head Count: tall posts, two or three Gammas to a ring, Cask walls between the rings.
{
  const b = new Board(248, 'Head Count', 22, 'Tall posts, and two or three Gammas to every ring. The gaps between them are short and come round fast. Count the heads as they pass and go in behind the last one.');
  const rings = [];
  for (const [x, y, h, n] of [[6, 4, 2, 2], [14, 11, 3, 3], [22, 4, 2, 2], [30, 12, 3, 3], [38, 4, 3, 3], [46, 11, 2, 2], [54, 5, 3, 3], [6, 15, 3, 3], [22, 16, 2, 2], [46, 17, 2, 2]])
    rings.push(orbit(b, x, y, h, n));
  for (const [x, y, w] of [[2, 10, 8], [17, 9, 10], [33, 9, 10], [50, 13, 6], [27, 19, 12], [10, 21, 8]]) b.h(x, y, w, 'R');
  b.spread('*', 14, { ok: both(ends, outside(...rings)) }).spread('O', 16, { ok: both(ends, outside(...rings)) });
  finish(b).save();
}

// 249 Clockwork: an open hall of Graphite islands, a Gamma round each, Pellets on top of the islands.
{
  const b = new Board(249, 'Clockwork', 50, 'An open hall of Graphite islands, each with a Gamma going round it like a clock hand. The Pellets sit on top of the islands. Eat into an island and its Gamma takes the new corner too.');
  b.rect(20, 2, 38, 20, ' ');
  const isles = [[23, 5, 4, 2], [31, 4, 3, 3], [39, 5, 5, 2], [49, 4, 4, 3], [24, 11, 3, 3], [32, 12, 5, 2], [42, 11, 3, 3], [50, 12, 4, 2], [23, 17, 5, 2], [33, 17, 3, 3], [41, 18, 4, 2], [50, 17, 4, 3]];
  for (const [x, y, w, h] of isles) { b.rect(x, y, w, h, '.').h(x, y - 1, w, '*').set(x + w, y + h - 1, 'S'); }
  b.spread('*', 12, { x1: 18, ok: away(1, 1, 3) }).spread('O', 14, { x1: 18, ok: away(1, 1, 3) });
  finish(b, 57, 21).save();
}

// 250 Inner Sanctum: a vault whose Pellets lie beside sleeping Gammas, inside a ring of running ones.
{
  const b = new Board(250, 'Inner Sanctum', 30, 'Get past the ring of Gammas into the vault, and the Gammas there are asleep in the Graphite beside the Pellets. Wake one inside the vault and it has nowhere to go but after you.');
  const v = [vault(b, 3, 4, 24, 16, 6, 'nes'), vault(b, 32, 3, 24, 17, 7, 'wns')];
  for (const [p, x, y] of [['*S*', 6, 7], ['S*', 13, 8], ['*S', 20, 7], ['*S*S*', 7, 11], ['S*S', 17, 12], ['*S', 6, 15], ['S*', 12, 16], ['*S*', 19, 16],
    ['S*S', 36, 6], ['*S*', 44, 6], ['*S', 50, 7], ['S*', 35, 10], ['*S*S*', 41, 11], ['*S', 51, 12], ['S*S', 36, 15], ['*S*', 46, 16]])
    for (let i = 0; i < p.length; i++) b.set(x + i, y, p[i]);
  b.spread('O', 10, { ok: both(ends, outside(...v)) }).spread('*', 6, { ok: both(ends, outside(...v)) });
  finish(b).save();
}

// 251 Shuttle Run: six long lanes, one Gamma shuttling end to end in each, Pellets in niches in the floor.
// The airlock down out of each lane is at the far end from the one in, so every lane is walked in full.
{
  const b = new Board(251, 'Shuttle Run', 26, 'One Gamma shuttles the length of every lane. Come in behind it, take the Pellets in the floor as you go and be down the airlock at the far end before it turns. An empty niche is a hiding place from a Gamma going right.');
  b.rect(1, 2, 58, 19, '#');
  const lanes = [3, 6, 9, 12, 15, 18], downs = [54, 6, 52, 8, 50, 10], gammas = [30, 14, 44, 22, 38, 28];
  b.set(4, 2, 'v');
  lanes.forEach((y, i) => {
    b.h(2, y, 56, ' ').set(gammas[i], y, 'S');
    for (const x of [12 + i, 23 + 2 * i, 36 - i, 46 - 2 * i]) b.set(x, y + 1, '*');
    b.set(downs[i], y + 1, 'v').set(downs[i], y + 2, '.');
  });
  b.h(1, 21, 58, '.').h(1, 22, 58, '.');
  b.spread('O', 8, { y0: 21, ok: away(57, 22, 2) }).spread('*', 6, { y0: 21, ok: away(57, 22, 2) });
  finish(b).save();
}

// 252 Rush Hour: two rings of Gammas round the vault that holds the Reactor, going round at different
// speeds. The only way in is straight across both, one step in each ring.
{
  const b = new Board(252, 'Rush Hour', 60, 'The Reactor is in the vault, behind two busy rings that take different times to go round, so their gaps rarely line up. You are in each ring for a single step. One Stasis lies by the start; spend it if your nerve goes.');
  b.rect(10, 3, 40, 17, ' ').box(11, 4, 38, 15, '#').rect(12, 5, 36, 13, ' ').box(13, 6, 34, 11, '#').rect(14, 7, 32, 9, '.');
  b.set(30, 4, '|').set(30, 6, '|');
  for (let x = 48; x > 10; x -= 4) b.set(x, 3, 'S');
  for (let y = 18; y > 3; y -= 4) b.set(49, y, 'S');
  for (let x = 46; x > 12; x -= 3) b.set(x, 5, 'S');
  for (let y = 16; y > 5; y -= 3) b.set(47, y, 'S');
  stock(b, 12, 5, 36, 13);
  b.set(30, 7, '.').set(4, 3, 'Z');
  b.spread('O', 14, { ok: both(ends, outside([10, 3, 40, 17])) }).spread('*', 6, { ok: both(ends, outside([10, 3, 40, 17])) });
  b.set(1, 1, '@').set(45, 15, 'X').save();
}

// 253 Gamma Finals: orbit posts, sleepers, a vault and a sealed row along the floor, all on one board.
{
  const b = new Board(253, 'Gamma Finals', 46, 'Everything the wing has shown, on one floor: guards on posts, sleepers in the Graphite, a vault in a ring, and a row along the floor that pours out after you. Leave the floor row for last.');
  const r = [orbit(b, 5, 4, 2, 2), orbit(b, 12, 9, 1, 1), orbit(b, 5, 13, 3, 3), vault(b, 36, 2, 17, 11, 6, 'ws')];
  stock(b, 36, 2, 17, 11);
  for (const [p, x, y] of [['*S*', 18, 3], ['S*S', 26, 6], ['*S', 19, 12], ['S*', 28, 11], ['*S*S*', 20, 16], ['S*', 40, 15], ['*S*', 47, 16]]) {
    for (let i = 0; i < p.length; i++) b.set(x + i, y, p[i]);
    r.push([x, y, p.length, 1]);
  }
  b.h(1, 22, 58, '#').h(14, 21, 40, 'S').h(1, 21, 13, '#').h(54, 21, 5, '#');
  for (let x = 16; x < 54; x += 6) b.set(x, 20, '*');
  r.push([1, 19, 58, 4]);
  b.spread('O', 16, { ok: both(ends, outside(...r)) }).spread('*', 6, { ok: both(ends, outside(...r)) });
  finish(b, 57, 1).save();
}
