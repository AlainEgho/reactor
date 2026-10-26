// One-off scaffolding that drew levels 050-080 and wrote them to levels/*.txt. Each level is an
// original design sized to the difficulty profile of the matching slot in a classic set (counts only).
// Re-running overwrites the files.
// Usage: node tools/design-batch-4.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);

// 050 Pump Station: six Snik Snak shafts walled with RAM, crossed only through ports.
{
  const b = new Board(50, 'Pump Station', 42, 'Six Gamma shafts cut the board from top to bottom. Cross each one through its airlocks, and only when the shaft is clear.');
  [9, 18, 27, 36, 45, 53].forEach((x, i) => {
    b.v(x - 1, 1, 22, 'R').v(x, 1, 22, ' ').v(x + 1, 1, 22, 'R');
    for (const y of [4, 11, 18]) b.set(x - 1, y, '-').set(x + 1, y, '-');
    for (let k = 0; k < 7; k++) b.set(x, 2 + k * 3 + (i % 3), 'S');
  });
  b.spread('O', 46, { ok: ends }).spread('*', 52, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 051 Pockets: a deep Base dig with sixteen sealed Snik Snak pockets.
{
  const b = new Board(51, 'Pockets', 45, 'Sixteen Gammas sleep in pockets in the Graphite. Dig past a pocket, never into it.');
  b.v(30, 1, 8, 'R').v(44, 12, 8, 'R').h(2, 10, 24, 'R').h(33, 20, 22, 'R');
  const pockets = [[26, 7], ...[8, 15, 22, 34, 41, 48, 54].map(x => [x, 3 + b.int(3)]), ...[4, 11, 18, 25, 33, 39, 50, 55].map(x => [x, 13 + b.int(3)])];
  for (const [x, y] of pockets) b.rect(x, y, 3, 2, ' ').set(x + 1, y + 1, 'S');
  b.spread('O', 150, { ok: ends }).spread('o', 4, { ok: ends }).spread('*', 56, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 052 Bedrock: nothing but Zonks and Infotrons, and nearly all of them are needed.
{
  const b = new Board(52, 'Bedrock', 120, 'Nothing but Lead balls and Pellets, and you need nearly all of them. Work from the bottom up.');
  b.h(8, 18, 10, '#').h(26, 14, 10, '#').h(42, 18, 10, '#').h(16, 7, 8, '#').h(38, 6, 8, '#');
  b.spread('O', 220, { ok: ends }).spread('*', 136, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 053 Archive: thirty-six RAM cubicles, one door each, Zonks waiting on the top shelf inside.
{
  const b = new Board(53, 'Archive', 17, 'Every cubicle has one door and a Lead ball or two on its top shelf. Step in, and whatever is above you drops the moment you step out.');
  const cubes = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) cubes.push([3 + 6 * i, 2 + 5 * j]);
  const order = cubes.map(c => [b.rand(), c]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  order.forEach(([x, y], k) => {
    b.box(x, y, 5, 4, 'R');
    const side = b.int(3);
    const door = side === 0 ? [x, y + 2] : side === 1 ? [x + 4, y + 2] : [x + 2, y + 3];
    const inner = side === 0 ? [x + 1, y + 2] : side === 1 ? [x + 3, y + 2] : [x + 2, y + 2];
    b.set(...door, k < 4 ? (side === 2 ? '|' : '-') : '.');
    for (let i = 1; i <= 3; i++) if (b.rand() < 0.7) b.set(x + i, y + 1, 'O');
    const spots = [x + 1, x + 2, x + 3].filter(cx => cx !== inner[0]);
    if (k < 24) b.set(spots[b.int(spots.length)], y + 2, '*');
    else if (b.rand() < 0.6) b.set(spots[b.int(spots.length)], y + 2, 'O');
  });
  const gaps = (x, y) => x <= 2 || x >= 56 || y === 1 || y >= 21 || (x - 2) % 6 === 0 || (y - 1) % 5 === 0;
  b.spread('O', 90, { ok: both(ends, gaps) }).spread('*', 6, { ok: both(ends, gaps) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 054 Turnstile: every other cell is a port; the rest is open floor. The layout is drawn at random
// until a search on the map proves all four Infotrons and the Exit can be reached in some order.
{
  const MASK = { '^': 1, '>': 2, 'v': 4, '<': 8, '|': 5, '-': 10, '+': 15 }, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const infos = [[14, 7], [45, 4], [10, 19], [40, 15]];
  const make = seed => {
    const b = new Board(54, 'Turnstile', 4, 'Every other cell is an airlock, and most of them turn you one way only. Plan the whole route before you take a step.', { fill: ' ', seed });
    for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) if ((x + y) % 2) {
      const r = b.rand();
      b.set(x, y, r < 0.12 ? '+' : r < 0.27 ? '-' : r < 0.42 ? '|' : r < 0.47 ? '#' : '^>v<'[b.int(4)]);
    }
    for (const [x, y] of infos) b.set(x, y, '*').set(x, y + 1, '#');
    b.set(1, 1, '@').set(57, 22, 'X');
    return b;
  };
  // Shortest number of moves to win, or -1. State: Murphy's cell and which Infotrons are taken.
  const solve = b => {
    const cellAt = (x, y, m) => { const k = infos.findIndex(([ix, iy]) => ix === x && iy === y); if (k >= 0) return (m >> k) & 1 ? ' ' : '*'; const c = b.get(x, y); return c === '@' ? ' ' : c; };
    const start = 1 * 60 + 1, depth = new Map([[start, 0]]), q = [[1, 1, 0]];
    for (let i = 0; i < q.length; i++) {
      const [x, y, m] = q[i], dep = depth.get((m * 24 + y) * 60 + x);
      for (let d = 0; d < 4; d++) {
        let nx = x + DX[d], ny = y + DY[d], nm = m;
        const c = cellAt(nx, ny, m);
        if (c === 'X') { if (m === 15) return dep + 1; continue; }
        if (c === '*') nm = m | (1 << infos.findIndex(([ix, iy]) => ix === nx && iy === ny));
        else if (MASK[c] & (1 << d)) { nx += DX[d]; ny += DY[d]; if (cellAt(nx, ny, m) !== ' ') continue; }
        else if (c !== ' ') continue;
        const k = (nm * 24 + ny) * 60 + nx;
        if (depth.has(k)) continue;
        depth.set(k, dep + 1); q.push([nx, ny, nm]);
      }
    }
    return -1;
  };
  let seed = 54 * 7919, b = make(seed), moves = solve(b);
  while (moves < 0) { b = make(++seed); moves = solve(b); }
  console.log(`  Turnstile: seed ${seed}, shortest win ${moves} moves`);
  b.save();
}

// 055 Mixer: twelve hardware rooms joined by ports, each with its own mix.
{
  const b = new Board(55, 'Mixer', 81, 'Twelve rooms, twelve mixes. The airlock into the Gamma room at the top stops every enemy on the board.')
    .head('special: 30,4 gravity off freeze-enemies');
  b.v(15, 1, 22, '#').v(30, 1, 22, '#').v(45, 1, 22, '#').h(1, 8, 58, '#').h(1, 15, 58, '#');
  for (const x of [15, 30, 45]) for (const y of [4, 11, 19]) b.set(x, y, '-');
  for (const x of [7, 22, 37, 52]) for (const y of [8, 15]) b.set(x, y, '|');
  b.rect(33, 2, 10, 5, ' ').pts([[35, 6], [38, 6], [41, 6]], '*').pts([[34, 2], [42, 3], [36, 4], [40, 2]], 'S');
  b.rect(18, 17, 10, 4, ' ').pts([[19, 20], [23, 20], [26, 20]], '*').pts([[18, 17], [27, 18], [22, 18], [25, 17]], 'S');
  const room = (c, r) => ({ x0: [1, 16, 31, 46][c], x1: [14, 29, 44, 58][c], y0: [1, 9, 16][r], y1: [7, 14, 22][r] });
  const fill = (c, r, list) => { for (const [ch, n] of list) b.spread(ch, n, { ...room(c, r), ok: ends }); };
  fill(0, 0, [['O', 6], ['*', 6]]);
  fill(1, 0, [['O', 25], ['*', 12]]);
  fill(3, 0, [['o', 12], ['*', 8]]);
  fill(0, 1, [['B', 8], ['*', 8]]);
  fill(1, 1, [['O', 20], ['*', 10]]);
  fill(2, 1, [['O', 30], ['*', 14]]);
  fill(3, 1, [['o', 10], ['*', 8]]);
  fill(0, 2, [['O', 25], ['*', 12]]);
  fill(2, 2, [['o', 12], ['*', 8]]);
  fill(3, 2, [['O', 12], ['*', 8]]);
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 056 Coolant Loop: four ring corridors full of Snik Snaks; ports hop over them.
{
  const b = new Board(56, 'Coolant Loop', 56, 'Gammas race round four loops. The airlocks let you hop over a loop without touching it, and two of them stop every enemy.')
    .head('special: 8,3 gravity off freeze-enemies').head('special: 44,20 gravity off freeze-enemies');
  const rings = [[3, 3, 24, 8], [33, 3, 24, 8], [3, 13, 24, 8], [33, 13, 24, 8]];
  for (const [x, y, w, h] of rings) {
    b.box(x, y, w, h, ' ').rect(x + 8, y + 3, 8, 2, 'R');
    const loop = [];
    for (let i = 0; i < w; i++) loop.push([x + i, y]);
    for (let j = 1; j < h; j++) loop.push([x + w - 1, y + j]);
    for (let i = w - 2; i >= 0; i--) loop.push([x + i, y + h - 1]);
    for (let j = h - 2; j > 0; j--) loop.push([x, y + j]);
    for (let k = 0; k < 6; k++) b.set(...loop[3 + k * 10], 'S');
    b.set(x + 5, y, '|').set(x + 17, y, '|').set(x + 11, y + h - 1, '|').set(x, y + 4, '-').set(x + w - 1, y + 3, '-');
    b.spread('*', 10, { x0: x + 1, y0: y + 1, x1: x + w - 2, y1: y + h - 2 });
  }
  b.spread('O', 6, { ok: both(ends, outside(...rings)) }).spread('*', 30, { ok: both(ends, outside(...rings)) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 057 Breakers: a city of hardware blocks, one-way tunnels through some, Snik Snaks in the plazas.
{
  const b = new Board(57, 'Breakers', 53, 'A city of concrete blocks. Some blocks have one-way tunnels through them; the plazas are Gamma territory.');
  const plazas = ['21,8', '39,13', '15,18', '45,3'];
  let tunnels = 0;
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
    const x = 3 + 6 * i, y = 3 + 5 * j;
    if (plazas.includes(`${x},${y}`)) { b.rect(x, y, 4, 3, ' ').pts([[x, y], [x + 3, y + 1], [x + 1, y + 2]], 'S'); continue; }
    b.rect(x, y, 4, 3, '#');
    if (i > 0 && (i + j) % 3 === 0 && tunnels < 11) { const p = b.rand() < 0.5 ? '>' : '<'; b.set(x, y + 1, p).h(x + 1, y + 1, 2, '.').set(x + 3, y + 1, p); tunnels++; }
  }
  b.spread('O', 90, { ok: ends }).spread('o', 16, { ok: ends }).spread('B', 2, { ok: ends }).spread('*', 65, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 058 Fallout Field: Bugs all through the Base, two Electron farms, and a RAM vault with Yellow disks.
{
  const b = new Board(58, 'Fallout Field', 128, 'The Graphite is crawling with Hot spots, and the loose Pellets alone will not do. Snap the two Neutron farms too, and the vault opens with the Initiator.');
  b.farm(10, 15).farm(45, 5);
  b.rect(24, 9, 10, 3, ' ').pts([[24, 9], [29, 10], [33, 11]], 'S');
  b.rect(4, 4, 8, 2, ' ').pts([[4, 4], [11, 5]], 'S');
  b.rect(50, 18, 6, 2, ' ').pts([[50, 18], [55, 19]], 'S');
  b.box(30, 15, 7, 5, 'R').rect(31, 16, 5, 3, '.').h(31, 18, 5, '*').h(32, 17, 3, '*');
  b.pts([[29, 17], [37, 17], [33, 14]], 'y').set(52, 12, 'T');
  const keep = both(ends, outside([28, 13, 11, 8]));
  b.spread('B', 36, { ok: keep }).spread('o', 35, { ok: keep }).spread('*', 124, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 059 Colonnade: nine RAM columns under a heavy roof of Zonks.
{
  const b = new Board(59, 'Colonnade', 60, 'Cask columns hold up a heavy roof of Lead balls. Every column you dig beside is a channel for them to come down.');
  for (let x = 6; x <= 54; x += 6) b.v(x, 3 + (x % 4 === 0 ? 1 : 0), 17, 'R');
  b.spread('O', 280, { ok: ends }).spread('*', 75, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 060 Overhang: staggered RAM slabs, each carrying a load of Zonks.
{
  const b = new Board(60, 'Overhang', 76, 'Cask slabs carry the Lead balls above them. Lead balls roll off the ends of a slab, so tunnel under the middle.');
  [5, 9, 13, 17, 21].forEach((y, k) => { for (let x = 3 + (k % 2) * 6; x + 7 <= 57; x += 13) b.h(x, y, 8, 'R'); });
  b.spread('O', 280, { ok: ends }).spread('*', 92, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 061 Neutron Gap: three Electron farms you cannot do without, and an east wing with gravity on.
{
  const b = new Board(61, 'Neutron Gap', 82, 'The Pellets are not enough without the three Neutron farms. Gravity is on in the east wing; the airlocks in the wall switch it.')
    .head('special: 42,6 gravity on').head('special: 42,18 gravity off');
  b.v(42, 1, 22, '#').set(42, 6, '>').set(42, 18, '<');
  b.farm(6, 4).farm(20, 12).farm(32, 4);
  b.rect(5, 17, 12, 3, ' ').pts([[5, 17], [10, 18], [16, 19], [8, 19], [13, 17]], 'S');
  b.rect(26, 18, 12, 3, ' ').pts([[26, 18], [31, 19], [37, 20], [29, 20], [34, 18], [36, 19]], 'S');
  b.spread('O', 90, { x1: 41, ok: ends }).spread('o', 20, { x1: 41, ok: ends }).spread('*', 48, { x1: 41, ok: ends });
  b.spread('O', 30, { x0: 43, ok: ends }).spread('*', 22, { x0: 43, ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 062 Red Tape: solid RAM, a trail of red disks, five walls to blow, one Infotron, and back again.
{
  const b = new Board(62, 'Red Tape', 1, 'One Pellet at the far end of a trail of red canisters. Each Cask wall takes one canister: drop it, back off two steps, wait. The Reactor is where you started.', { fill: 'R' });
  b.rect(1, 1, 6, 3, '.');
  b.h(7, 2, 14, 'd');
  b.h(22, 2, 3, 'd').v(24, 3, 7, 'd');
  b.v(24, 11, 2, 'd').h(25, 12, 21, 'd');
  b.h(47, 12, 4, 'd').v(50, 4, 8, 'd');
  b.set(50, 2, 'd').h(51, 2, 4, 'd');
  b.rect(56, 1, 3, 3, '.').set(57, 3, '*');
  b.pts([[10, 1], [14, 3], [27, 11], [33, 13], [39, 11], [49, 7], [51, 9], [23, 5], [25, 7]], 'B');
  b.set(1, 1, '@').set(1, 3, 'X');
  b.save();
}

// 063 Megaton: eight RAM banks of Infotrons; the north-east bank runs with gravity on.
{
  const b = new Board(63, 'Megaton', 143, 'Eight banks of Pellets. The north-east bank runs with gravity on, and it has one way in and one way out.')
    .head('special: 45,5 gravity on').head('special: 52,11 gravity off');
  b.v(15, 1, 22, 'R').v(30, 1, 22, 'R').v(45, 1, 22, 'R').h(1, 11, 58, 'R');
  for (const x of [15, 30]) b.set(x, 5, '-').set(x, 17, '-');
  b.set(45, 5, '>').set(45, 17, '-').set(52, 11, 'v');
  for (const x of [7, 22, 37]) b.set(x, 11, '|');
  b.spread('O', 170, { ok: ends }).spread('*', 170, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 064 Fault Line: a crack of Snik Snaks down the middle, bridged by three ports; two Yellow-disk vaults.
{
  const b = new Board(64, 'Fault Line', 78, 'A crack runs down the middle and Gammas live in it. Three airlocks bridge it. The Initiator opens both vaults.');
  let x = 29;
  const crack = [];
  for (let y = 1; y <= 22; y++) {
    b.set(x, y, ' '); crack.push([x, y]);
    if (y % 3 === 0 && y < 21) { const nx = x + (b.rand() < 0.5 ? -1 : 1); b.set(nx, y, ' '); crack.push([nx, y]); x = nx; }
  }
  for (const y of [4, 10, 16]) { const c = crack.find(([, cy]) => cy === y); b.set(c[0], y, '-'); }
  crack.filter(([, y]) => ![4, 10, 16].includes(y)).filter((_, i) => i % 2 === 1).slice(0, 12).forEach(([cx, cy]) => b.set(cx, cy, 'S'));
  b.box(8, 8, 7, 5, 'R').rect(9, 9, 5, 3, '.').h(9, 11, 5, '*').set(7, 10, 'y');
  b.box(44, 12, 7, 5, 'R').rect(45, 13, 5, 3, '.').h(45, 15, 5, '*').set(51, 14, 'y');
  b.set(20, 20, 'T');
  const keep = both(ends, outside([6, 7, 10, 7], [43, 11, 10, 7]));
  b.spread('O', 110, { ok: keep }).spread('d', 6, { ok: keep }).spread('*', 90, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 065 Updraft: gravity on in open air; Base columns are ladders, used once.
{
  const b = new Board(65, 'Updraft', 14, 'Gravity is on. Graphite columns are ladders, and each one only works once. Climb for the Pellets; the Reactor is back on the ground floor.', { fill: ' ' }).head('gravity: on');
  b.h(1, 15, 58, '#').h(1, 7, 58, '#');
  for (const x of [12, 40]) b.v(x, 14, 9, '.').set(x - 1, 14, '.').set(x + 1, 14, '.');
  for (const x of [26, 52]) b.v(x, 6, 9, '.').set(x - 1, 6, '.').set(x + 1, 6, '.');
  b.rect(4, 17, 5, 3, '.').rect(20, 18, 8, 3, '.').rect(46, 17, 5, 4, '.');
  b.rect(4, 10, 6, 3, '.').rect(32, 9, 6, 4, '.').rect(9, 2, 8, 3, '.').rect(35, 2, 10, 3, '.');
  b.v(56, 16, 7, '.').set(56, 15, '^').v(8, 8, 7, '.').set(8, 7, '^');
  b.pts([[18, 22], [30, 22], [35, 22], [50, 22], [5, 14], [20, 14], [33, 14], [47, 14], [55, 14],
    [4, 6], [18, 6], [31, 6], [48, 6], [55, 6], [6, 17], [24, 18], [49, 17], [6, 10], [35, 10], [12, 2], [40, 2]], '*');
  b.pts([[30, 21], [44, 21], [21, 13], [45, 12], [21, 5], [50, 4]], 'S');
  b.set(2, 22, '@').set(57, 22, 'X');
  b.save();
}

// 066 Manifold: a grid of RAM blocks and open corridors, ports at half the crossings, one farm.
{
  const b = new Board(66, 'Manifold', 56, 'A grid of corridors with airlocks at the crossings. Gammas cannot pass an airlock. The Neutron farm in the corner tops up the count.', { fill: ' ' });
  for (let i = 0; i < 11; i++) for (let j = 0; j < 5; j++) b.rect(2 + 5 * i, 2 + 4 * j, 4, 3, 'R');
  b.rect(46, 13, 13, 10, '.').farm(49, 16);
  const region = (x, y) => x >= 45 && y >= 12;
  for (let x = 6; x <= 51; x += 5) for (const y of [5, 9, 13, 17]) if (!region(x, y) && b.rand() < 0.5) b.set(x, y, '+');
  const lane = [];
  for (let x = 1; x <= 58; x++) for (const y of [1, 5, 9, 13, 17, 21]) if (!region(x, y) && b.get(x, y) === ' ') lane.push([x, y]);
  const shelf = lane.filter(([x, y]) => y < 21 && (x - 2) % 5 > 0 && (x - 2) % 5 < 3 && x < 56 && b.clear(x, y, 1, '+'));
  const pick = (list, n, ch, ok = () => true) => { let k = 0; for (let t = 0; k < n && t < 5000; t++) { const [x, y] = list[b.int(list.length)]; if (b.get(x, y) === ' ' && ok(x, y)) { b.set(x, y, ch); k++; } } };
  pick(shelf, 55, '*', away(1, 1, 2));
  pick(lane, 10, 'S', away(1, 1, 8));
  pick(shelf, 6, 'd', away(1, 1, 2));
  b.spread('*', 3, { x0: 46, y0: 13, ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 067 Orange Crush: a rich seam of Infotrons laced with orange disks; a vault with Yellow disks.
{
  const b = new Board(67, 'Orange Crush', 130, 'A rich seam with orange canisters all through it. Every orange you drop takes the Pellets beside it.');
  b.rect(10, 6, 9, 2, ' ').pts([[10, 6], [14, 7], [18, 6], [12, 7]], 'S');
  b.rect(36, 4, 10, 2, ' ').pts([[36, 4], [41, 5], [45, 4], [39, 4], [43, 5]], 'S');
  b.rect(22, 16, 12, 2, ' ').pts([[22, 16], [27, 17], [33, 16], [25, 16], [30, 17]], 'S');
  b.box(46, 13, 9, 6, 'R').rect(47, 14, 7, 4, '.').h(47, 17, 7, '*').h(48, 16, 5, '*');
  b.pts([[45, 15], [55, 15], [50, 12], [45, 17], [55, 17], [50, 19]], 'y').set(4, 20, 'T');
  const keep = both(ends, outside([44, 11, 13, 10]));
  b.spread('o', 67, { ok: keep }).spread('O', 68, { ok: keep }).spread('*', 150, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 068 Bunker: solid RAM with Base veins; every Infotron is in a bunker two steps off a vein.
{
  const b = new Board(68, 'Bunker', 12, 'Packed Casks with a few veins of Graphite. Each Pellet sits in its own bunker two steps off a vein: drop a red canister beside it and back off up the vein.', { fill: 'R' });
  b.h(1, 11, 58, '.').h(1, 1, 8, '.').h(2, 1, 6, 'd');
  const veins = [8, 20, 32, 44, 56];
  veins.forEach((x, vi) => {
    b.v(x, 2, 20, '.').set(x, 2, 'd').set(x, 3, 'd').set(x, 10, 'd').set(x, 12, 'd');
    // Hardware under the bunker wall survives the blast, so the Infotron cannot roll out into the vein.
    [4, 8, 14, 18].forEach((y, yi) => { const s = (vi + yi) % 2 ? 1 : -1; b.set(x + 2 * s, y, '*').set(x + s, y + 1, '#'); });
  });
  b.set(1, 1, '@').set(58, 11, 'X');
  b.save();
}

// 069 Geiger: eight Electron farms and not enough loose Infotrons.
{
  const b = new Board(69, 'Geiger', 110, 'Eight Neutron farms and not enough loose Pellets. Snap each plug when the Neutron is right underneath.');
  for (const top of [3, 14]) for (const cx of [6, 18, 30, 42]) b.farm(cx, top);
  b.rect(50, 4, 6, 2, ' ').pts([[50, 4], [53, 5], [55, 4]], 'S');
  b.rect(50, 15, 6, 2, ' ').pts([[50, 15], [53, 16], [55, 15]], 'S');
  b.rect(10, 10, 20, 1, ' ').pts([[10, 10], [19, 10], [29, 10]], 'S');
  b.spread('O', 150, { ok: ends }).spread('o', 12, { ok: ends }).spread('*', 72, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 070 Overpass: two Base bands with an open-air band between them; ports drop you in and out.
{
  const b = new Board(70, 'Overpass', 119, 'The middle band is open air with Gammas around the bridges. The airlocks drop you in and let you out.');
  b.h(1, 8, 58, 'R').h(1, 15, 58, 'R').rect(1, 9, 58, 6, ' ');
  for (const x of [10, 30, 50]) b.set(x, 8, '|');
  for (const x of [20, 40, 55]) b.set(x, 15, '|');
  b.h(3, 12, 12, '#').h(22, 11, 14, '#').h(42, 12, 14, '#');
  for (let x = 4; x <= 14; x += 2) b.set(x, 11, '*');
  for (let x = 23; x <= 35; x += 2) b.set(x, 10, '*');
  for (let x = 43; x <= 55; x += 2) b.set(x, 11, '*');
  b.pts([[2, 14], [18, 9], [36, 14], [26, 13], [57, 9], [47, 14]], 'S');
  b.spread('O', 45, { y1: 7, ok: ends }).spread('*', 60, { y1: 7, ok: ends }).spread('B', 2, { y1: 7, ok: ends });
  b.spread('O', 48, { y0: 16, ok: ends }).spread('*', 60, { y0: 16, ok: ends }).spread('o', 5, { y0: 16, ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 071 Hive: a honeycomb of RAM cells; Snik Snaks sealed in the walls between them.
{
  const b = new Board(71, 'Hive', 135, 'A honeycomb of Cask cells. Gammas are sealed in the walls; eat the Graphite next to one and it gets out.', { fill: 'R' });
  for (let i = 0; i < 11; i++) for (let j = 0; j < 5; j++) b.rect(1 + 5 * i, 1 + 4 * j, 4, 3, '.');
  b.rect(56, 1, 3, 22, '.').rect(1, 21, 58, 2, '.');
  for (let i = 0; i < 11; i++) for (let j = 0; j < 5; j++) {
    const x = 1 + 5 * i, y = 1 + 4 * j;
    b.set(x + 4, y + b.int(3), '.');
    b.set(x + b.int(4), y + 3, '.');
  }
  const wallCells = [];
  for (let y = 1; y <= 19; y++) for (let x = 1; x <= 55; x++) {
    const vWall = x % 5 === 0 && (y - 1) % 4 !== 3, hWall = (y - 1) % 4 === 3 && x % 5 !== 0;
    if ((vWall || hWall) && b.get(x, y) === 'R' && b.clear(x, y, 1, '.') === false) wallCells.push([x, y]);
  }
  const doorNext = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = b.get(x + dx, y + dy); const nx = x + dx, ny = y + dy; return c === '.' && (nx % 5 === 0 || (ny - 1) % 4 === 3); });
  let sniks = 0;
  for (let t = 0; sniks < 30 && t < 5000; t++) {
    const [x, y] = wallCells[b.int(wallCells.length)];
    if (b.get(x, y) !== 'R' || doorNext(x, y) || !b.clear(x, y, 2, 'S') || !away(1, 1, 5)(x, y)) continue;
    b.set(x, y, 'S'); sniks++;
  }
  b.spread('*', 165, { ok: (x, y) => ends(x, y) && b.clear(x, y, 1, 'S') && x % 5 !== 0 && (y - 1) % 4 !== 3 });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 072 Assembly: hardware shelves with gaps, Zonks everywhere, a RAM vault opened by Yellow disks.
{
  const b = new Board(72, 'Assembly', 119, 'Concrete shelves with gaps, Lead balls on every shelf, and a Cask vault with Yellow canisters parked against it. The Initiator is in the bottom-left corner.');
  for (const y of [6, 12, 18]) for (let x = 1; x <= 58; x += 12) b.h(x, y, Math.min(9, 59 - x), '#');
  b.set(5, 6, '|').set(53, 6, '|').set(5, 18, '|').set(29, 18, '|').set(53, 18, '|').set(17, 12, '|').set(41, 12, '|').set(53, 12, '|');
  b.box(26, 8, 9, 4, 'R').rect(27, 9, 7, 2, '.').h(27, 10, 7, '*').h(28, 9, 5, '*');
  b.pts([[25, 9], [35, 10], [30, 7]], 'y').set(2, 20, 'T');
  b.rect(44, 14, 5, 2, ' ').set(46, 15, 'S');
  const keep = both(ends, outside([24, 6, 13, 7]));
  b.spread('O', 220, { ok: keep }).spread('o', 15, { ok: keep }).spread('d', 1, { ok: keep }).spread('*', 130, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 073 Initiator Grid: four wings in a one-way loop; two of them run with gravity on.
{
  const b = new Board(73, 'Initiator Grid', 84, 'Four wings joined in a one-way loop. The north-east and south-west wings run with gravity on, and every wing is packed with orange canisters.')
    .head('special: 30,5 gravity on').head('special: 46,12 gravity off').head('special: 30,18 gravity on').head('special: 12,12 gravity off');
  b.v(30, 1, 22, '#').h(1, 12, 58, '#');
  b.set(30, 5, '>').set(46, 12, 'v').set(30, 18, '<').set(12, 12, '^');
  b.v(15, 1, 11, '#').set(15, 4, '-').set(15, 9, '-');
  b.v(45, 13, 10, '#').set(45, 16, '-').set(45, 20, '-');
  b.v(18, 13, 10, '#').set(18, 15, '-').set(18, 20, '-');
  b.rect(35, 19, 8, 2, ' ').pts([[35, 19], [39, 20], [42, 19]], 'S');
  b.rect(20, 2, 7, 2, ' ').pts([[20, 2], [26, 3], [23, 2]], 'S');
  const q = [[1, 29, 1, 11], [31, 58, 1, 11], [1, 29, 13, 22], [31, 58, 13, 22]];
  for (const [x0, x1, y0, y1] of q) b.spread('o', 20, { x0, x1, y0, y1, ok: ends }).spread('O', 30, { x0, x1, y0, y1, ok: ends }).spread('*', 28, { x0, x1, y0, y1, ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 074 Single File: one Infotron at the far end of a long maze; the Exit is back near the start.
{
  const b = new Board(74, 'Single File', 1, 'One Pellet, at the far end of the maze. The Reactor is back near the start, and there is a one-way shortcut home.', { fill: '#' });
  b.maze('.');
  const corridor = c => c === '.';
  const d = b.dist(1, 1, corridor);
  let far = [1, 1], best = 0;
  const deadEnds = [];
  for (const [k, v] of d) {
    const x = k % 60, y = (k / 60) | 0;
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.get(x + dx, y + dy) === '.').length;
    if (open === 1 && x % 2 && y % 2) deadEnds.push([x, y, v]);
    if (v > best) { best = v; far = [x, y]; }
  }
  b.set(...far, '*');
  const home = deadEnds.filter(([, , v]) => v >= 6).sort((p, q) => p[2] - q[2])[0];
  b.set(home[0], home[1], 'X');
  const mid = deadEnds.filter(([x, y, v]) => v > best * 0.4 && v < best * 0.6)[0];
  if (mid) b.set(mid[0], mid[1], 'S');
  // The one-way port: the wall between two corridors whose walking distances differ most.
  let port = null, gain = 0;
  for (let y = 1; y <= 21; y += 2) for (let x = 2; x <= 56; x += 2) {
    if (b.get(x, y) !== '#') continue;
    const l = d.get(y * 60 + x - 1), r = d.get(y * 60 + x + 1);
    if (l === undefined || r === undefined) continue;
    if (Math.abs(l - r) > gain) { gain = Math.abs(l - r); port = [x, y, l < r ? '<' : '>']; }
  }
  b.set(port[0], port[1], port[2]);
  for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) if (b.get(x, y) === '#' && b.rand() < 0.3) b.set(x, y, 'R');
  b.set(1, 1, '@');
  b.save();
}

// 075 Red Line: enough loose Infotrons, just; four sealed rooms are the margin.
{
  const b = new Board(75, 'Red Line', 80, 'Enough loose Pellets, just. Four sealed rooms and twelve red canisters are your margin, and a Yellow canister waits beside the first room.');
  const rooms = [[6, 14], [22, 8], [40, 3], [46, 15]];
  for (const [x, y] of rooms) b.box(x, y, 8, 5, 'R').rect(x + 1, y + 1, 6, 3, '.').h(x + 1, y + 3, 6, '*');
  b.rect(24, 3, 10, 2, ' ').pts([[24, 3], [28, 4], [33, 3], [30, 3], [26, 4]], 'S');
  b.set(5, 16, 'y').set(3, 8, 'T');
  const keep = both(ends, outside(...rooms.map(([x, y]) => [x - 1, y - 1, 10, 7])));
  b.spread('O', 170, { ok: keep }).spread('o', 15, { ok: keep }).spread('d', 12, { ok: keep }).spread('*', 92, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 076 Switchyard: five RAM rails with port gates; one gate freezes the Zonks, the next frees them.
{
  const b = new Board(76, 'Switchyard', 126, 'Five Cask rails with airlock gates all along them. The gate in the middle of the third rail freezes every Lead ball; the one below it lets them go.')
    .head('special: 30,12 gravity off freeze-zonks').head('special: 30,16 gravity off');
  for (const y of [4, 8, 12, 16, 20]) { b.h(1, y, 58, 'R'); for (let x = 3 + (y % 8 === 0 ? 3 : 0); x <= 56; x += 6) b.set(x, y, '|'); }
  b.set(30, 12, '|').set(30, 16, '|');
  b.h(3, 10, 54, ' ').pts([[5, 10], [16, 10], [27, 10], [38, 10], [50, 10]], 'S');
  b.farm(50, 17);
  b.spread('O', 85, { ok: ends }).spread('o', 26, { ok: ends }).spread('*', 140, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 077 Coal Seam: diagonal RAM seams through a deep Base dig; Zonks roll down them.
{
  const b = new Board(77, 'Coal Seam', 107, 'Diagonal Cask seams run through the Graphite, each with one airlock across it. Lead balls roll down the seams, so dig from the low end.');
  for (const [x, y, n] of [[4, 3, 12], [16, 2, 14], [30, 5, 13], [42, 2, 12], [8, 13, 9], [36, 12, 10]]) {
    for (let i = 0; i < n; i++) b.set(x + i, y + i, i === Math.floor(n / 2) ? '-' : 'R');
  }
  b.rect(50, 18, 3, 2, ' ').set(51, 19, 'S');
  b.spread('O', 150, { ok: ends }).spread('o', 7, { ok: ends }).spread('*', 125, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 078 Fireworks: orange disks and Infotrons on hardware shelves, Yellow disks among them.
{
  const b = new Board(78, 'Fireworks', 103, 'Orange canisters stand on every concrete shelf, with Yellow canisters among them. One touch of the Initiator sets off the whole show.');
  [5, 10, 15, 20].forEach((y, j) => {
    for (let k = 0; k < 5; k++) {
      const x = 2 + 11 * k + (j % 2) * 5;
      b.h(x, y, 7, '#').pts([[x + 1, y - 1], [x + 3, y - 1], [x + 5, y - 1]], 'o').pts([[x + 2, y - 1], [x + 4, y - 1]], '*');
      if ((j + k) % 3 === 0) b.set(x + 6, y - 1, 'y');
    }
  });
  b.rect(20, 7, 8, 2, ' ').pts([[20, 7], [24, 8], [27, 7], [22, 8]], 'S');
  b.rect(34, 17, 8, 2, ' ').pts([[34, 17], [38, 18], [41, 17], [36, 18]], 'S');
  b.set(2, 22, 'T');
  b.spread('O', 100, { ok: ends }).spread('o', 30, { ok: ends }).spread('d', 3, { ok: ends }).spread('B', 1, { ok: ends }).spread('*', 90, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 079 Lockbox: eight sealed RAM boxes and sixteen red disks among heavy Zonks.
{
  const b = new Board(79, 'Lockbox', 51, 'Eight sealed Cask boxes and sixteen red canisters. The loose Pellets are nearly enough; the boxes make up the rest.');
  const boxes = [[4, 4], [18, 3], [32, 5], [46, 3], [8, 14], [22, 15], [36, 13], [48, 14]];
  for (const [x, y] of boxes) b.box(x, y, 7, 5, 'R').rect(x + 1, y + 1, 5, 3, '.').h(x + 1, y + 3, 5, '*');
  const keep = both(ends, outside(...boxes.map(([x, y]) => [x, y, 7, 5])));
  b.spread('O', 150, { ok: keep }).spread('d', 16, { ok: keep }).spread('*', 62, { ok: keep });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 080 Blast Wall: three walls of stacked orange disks with ports set into them.
{
  const b = new Board(80, 'Blast Wall', 61, 'Three walls of orange canisters, with airlocks set into them. If one canister in a wall goes, the whole wall can go with it.');
  for (const x of [15, 30, 45]) { b.v(x, 1, 22, 'o'); for (const y of [3, 8, 13, 18]) b.set(x, y + (x % 2), '-'); }
  b.h(3, 11, 10, '#').h(18, 6, 10, '#').h(33, 16, 10, '#').h(48, 10, 8, '#');
  b.rect(50, 3, 6, 2, ' ').pts([[50, 3], [55, 4]], 'S').rect(20, 19, 6, 2, ' ').pts([[20, 19], [25, 20]], 'S');
  const wall = (x, y) => ![14, 15, 16, 29, 30, 31, 44, 45, 46].includes(x);
  b.spread('O', 61, { ok: both(ends, wall) }).spread('o', 40, { ok: both(ends, wall) }).spread('d', 10, { ok: ends }).spread('*', 75, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}
