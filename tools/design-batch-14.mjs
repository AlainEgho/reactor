// Scaffolding that draws The Guru, levels 266-295, and writes them to levels/*.txt. The last and hardest
// category: every floor is built round one idea and a shape you will know it by, and mixes two or three of
// the systems the earlier wings taught. Re-running overwrites the files.
// Usage: node tools/design-batch-14.mjs [first] [last]
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx - 1 && x <= rx + w && y >= ry - 1 && y <= ry + h);
const both = (...fs) => (x, y) => fs.every(f => f(x, y));
const place = (b, sx, sy, ex, ey) => b.set(sx, sy, '@').set(ex, ey, 'X');
const [FIRST, LAST] = [+(process.argv[2] || 266), +(process.argv[3] || 295)];
const want = n => n >= FIRST && n <= LAST;

// A Pellet on a Concrete post with a ring carved round it and a Gamma running the ring (it starts on the
// east side, where facing up already runs it anticlockwise, so it never leaves). Area x-1..x+1, y-1..y+2.
function orbit(b, x, y) {
  b.rect(x - 1, y - 1, 3, 4, ' ').set(x, y, '*').set(x, y + 1, '#').set(x + 1, y + 1, 'S');
  return [x - 1, y - 1, 3, 4];
}
// A Gamma asleep in a three-cell pocket in the Graphite: dig into the pocket and it is loose.
function pocket(b, x, y, ch = 'S') { b.h(x - 1, y, 3, ' ').set(x, y, ch); return [x - 1, y, 3, 1]; }

// 266 Satori: four rooms round a sealed core; every switch flips every gate in the plant.
if (want(266)) {
  const b = new Board(266, 'Satori', 60, 'Four rooms, a Reactor sealed in the middle, and every switch flips every gate in the plant. The way in is a count, not a key: plan the whole tour before your first throw.');
  b.v(29, 1, 22, '#').h(1, 11, 58, '#');
  b.rect(24, 8, 11, 7, '#').rect(25, 9, 9, 5, '.').set(29, 11, 'X');
  // q stands open now and g shut; every throw swaps the lot.
  b.set(29, 4, 'q').set(8, 11, 'g').set(50, 11, 'g').set(29, 18, 'q').set(34, 13, 'g');
  // each room's switch stands by the cross, so a tour is a few steps a throw, not a walk round the room
  const switches = [[26, 7], [32, 7], [26, 15], [36, 18]];
  b.pts(switches, 's');
  const gates = [[29, 4], [8, 11], [50, 11], [29, 18], [34, 13]];
  const rings = [orbit(b, 15, 4), orbit(b, 43, 4), orbit(b, 15, 15), orbit(b, 43, 16)];
  const keep = both(away(1, 1, 3), outside([24, 8, 11, 7], ...rings), ...gates.map(([x, y]) => away(x, y, 1)),
    ...switches.map(([x, y]) => (xx, yy) => Math.abs(xx - x) > 1 || yy > y)); // no Lead over a switch plate
  b.spread('*', 64, { ok: keep }).spread('O', 34, { ok: keep });
  b.set(1, 1, '@');
  b.fit(0.8).save();
}

// 267 The Spiral: concentric rings wound inward through gaps on alternate sides.
if (want(267)) {
  const b = new Board(267, 'The Spiral', 60, 'Three walls, each with one gap, and the gaps on alternate sides: the way in is the long way round, every time. Ice down the sides, Alphas on the lanes, Gammas asleep in the walls, and an Alpha guarding the heart.');
  b.box(3, 3, 54, 18, '#').box(6, 6, 48, 12, '#').box(9, 9, 42, 6, '#');
  b.pts([[56, 11], [56, 12]], '.').pts([[6, 11], [6, 12]], '.').pts([[50, 11], [50, 12]], '.');
  // ice runs down both sides of the outer and middle corridors
  b.rink(1, 4, 2, 15).rink(57, 4, 2, 6).rink(4, 7, 2, 3).rink(54, 13, 2, 5);
  // Alphas on the outer lane along the floor and the middle lane along the roof
  b.lane(3, 21, 54, 'A').lane(7, 4, 46, 'A');
  // the heart: an Alpha lane along its floor, the Reactor at its far end
  b.lane(10, 13, 40, 'A');
  const lanes = (x, y) => ![21, 4, 13].includes(y) || x < 3;
  const sleepers = [pocket(b, 20, 7), pocket(b, 38, 16), pocket(b, 30, 19), pocket(b, 14, 2)];
  b.scatter('*', 10, { on: 'I', x0: 1, y0: 4, x1: 58, y1: 20, ok: away(1, 1, 2) });
  b.spread('*', 70, { ok: both(away(1, 1, 2), lanes, outside(...sleepers)) });
  b.spread('O', 26, { ok: both(away(1, 1, 3), lanes, outside(...sleepers), (x, y) => x < 10 || x > 49 || y < 10 || y > 13) });
  place(b, 1, 1, 11, 12);
  b.fit(0.8).save();
}

// 268 Trefoil: the whole floor is a radiation trefoil. Three Cask blades full of Pellets, the hub a ring
// where Gammas circle the Reactor's post.
if (want(268)) {
  const b = new Board(268, 'Trefoil', 60, 'The floor is the sign on the door: three blades of Cask packed with Pellets, each opened only at its tip, and a hub where the Gammas run round the Reactor. Fuel the core from the outside in.');
  const cx = 29, cy = 11, blade = (x, y) => {
    const dx = (x - cx) / 2.5, dy = y - cy, r = Math.hypot(dx, dy);
    if (r < 3.6 || r > 10.6) return false;
    const a = Math.atan2(dy, dx) * 180 / Math.PI;
    return [-90, 30, 150].some(c => Math.abs(((a - c + 540) % 360) - 180) <= 31);
  };
  const inB = (x, y) => x >= 1 && x <= 58 && y >= 1 && y <= 22 && blade(x, y);
  for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) {
    if (!inB(x, y)) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !inB(x + dx, y + dy));
    b.set(x, y, edge ? 'R' : '.');
  }
  // each blade opens at one cell of its outline: the one furthest from the hub that touches Graphite
  // Iso can walk to from the start
  const reach = b.dist(1, 1, c => c !== undefined && c !== 'R' && c !== '#');
  const ang = (x, y) => Math.atan2(y - cy, (x - cx) / 2.5) * 180 / Math.PI;
  for (const c of [-90, 30, 150]) {
    let best = null, br = -1;
    for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) {
      if (b.get(x, y) !== 'R' || Math.abs(((ang(x, y) - c + 540) % 360) - 180) > 31) continue;
      const n4 = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]);
      if (!n4.some(([i, j]) => b.get(i, j) === '.' && inB(i, j)) || !n4.some(([i, j]) => !inB(i, j) && reach.has(j * 60 + i))) continue;
      const r = Math.hypot((x - cx) / 2.5, y - cy);
      if (r > br) { br = r; best = [x, y]; }
    }
    b.set(...best, '.');
  }
  // the hub: a ring round a Concrete post with the Reactor in its top
  b.rect(24, 9, 11, 5, ' ').rect(25, 10, 9, 3, '#').set(29, 10, 'X').set(34, 12, 'S').set(31, 9, 'S');
  const hub = [24, 9, 11, 5];
  b.scatter('*', 70, { on: '.', ok: both(inB, (x, y) => b.get(x, y + 1) !== ' ') });
  b.scatter('O', 18, { on: '.', ok: both(inB, (x, y) => b.get(x, y + 1) !== ' ' && b.clear(x, y, 1, ' ')) });
  const out = (x, y) => !inB(x, y);
  b.spread('O', 30, { ok: both(away(1, 1, 3), out, outside(hub)) }).spread('*', 14, { ok: both(away(1, 1, 3), out, outside(hub)) });
  b.set(1, 1, '@');
  b.fit(0.8).save();
}

// 269 Long Night: a maze in the dark on two minutes of air.
if (want(269)) {
  const b = new Board(269, 'Long Night', 60, 'A maze in the dark on three minutes of air. Every tank buys thirty seconds and every Lamp two more cells of sight, and the maze will not tell you which turn is right. Lead hangs over the corridors.', { fill: '#' });
  b.head('air: 200').head('dark: on');
  b.maze('.');
  // a few walls knocked through, so the maze has loops and a wrong turn is not always the whole way back
  for (let n = 0; n < 70; n++) { const x = 2 + b.int(56), y = 2 + b.int(20); if (b.get(x, y) === '#' && ((b.get(x - 1, y) === '.' && b.get(x + 1, y) === '.') || (b.get(x, y - 1) === '.' && b.get(x, y + 1) === '.'))) b.set(x, y, '.'); }
  const ok = both(away(1, 1, 2), away(57, 21, 2));
  b.scatter('t', 9, { on: '.', ok }).scatter('L', 3, { on: '.', ok });
  b.scatter('*', 95, { on: '.', ok }).scatter('O', 30, { on: '.', ok: both(ok, (x, y) => b.get(x, y + 1) !== ' ') });
  place(b, 1, 1, 57, 21);
  b.fit(0.8).save();
}

// 270 Mirror Temple: a lattice of laser lanes. Every Pellet taken from a lane lets the light further in.
if (want(270)) {
  const b = new Board(270, 'Mirror Temple', 60, 'A temple of light: lanes cross the floor both ways, mirrors fold the beams round the corners, and the Pellets lying in the lanes are what keeps the light short. Every one you take lets it reach further.');
  const rows = [5, 11, 17], cols = [15, 29, 43];
  for (const y of rows) b.h(4, y, 52, ' ');
  for (const x of cols) b.v(x, 3, 17, ' ');
  b.set(3, 5, 'l').set(56, 11, 'l').set(3, 17, 'l').set(29, 2, 'i');
  b.set(15, 5, '\\').set(43, 5, '/').set(15, 17, '/').set(43, 17, '\\').set(29, 11, '/');
  // Pellets in the lanes, each resting on the Graphite under it
  for (const y of rows) for (let x = 6; x < 54; x += 4) if (!cols.some(c => Math.abs(c - x) < 2)) b.set(x, y, '*');
  b.pts([[10, 11], [48, 5], [22, 17], [36, 11]], 'c');
  const offLanes = (x, y) => !rows.some(r => Math.abs(y - r) < 1) && !cols.some(c => Math.abs(x - c) < 1);
  b.spread('*', 40, { ok: both(away(1, 1, 3), away(57, 22, 2), offLanes) }).spread('O', 22, { ok: both(away(1, 1, 3), away(57, 22, 2), offLanes) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 271 Magnetic North: three galleries, each under a shelf of magnets holding Lead up off the floor.
if (want(271)) {
  const b = new Board(271, 'Magnetic North', 55, 'The Lead here hangs from magnets in the ceiling, and the magnets hold it as long as it touches them. Dig a shaft under one and any loose Lead in it rises to meet it; push a hanging ball aside and it drops.');
  for (const y of [3, 10, 17]) {
    b.h(2, y, 56, '#');
    for (let x = 5; x < 56; x += 6) b.set(x, y, 'M').set(x, y + 1, 'O');
    b.set(2 + ((y * 7) % 50), y, '.'); // one way through each shelf
  }
  const shelves = (x, y) => ![3, 10, 17].includes(y) && ![4, 11, 18].includes(y);
  b.spread('*', 80, { ok: both(away(1, 1, 3), away(57, 22, 2), shelves) }).spread('O', 18, { ok: both(away(1, 1, 3), away(57, 22, 2), shelves) });
  b.pts([[20, 7], [40, 14], [12, 20]], 'S').pts([[19, 7], [21, 7], [39, 14], [41, 14], [11, 20], [13, 20]], ' ');
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 272 Decay Clock: nothing but isotope pellets and fuel rods, and the isotopes are gone in fifty seconds.
if (want(272)) {
  const b = new Board(272, 'Decay Clock', 45, 'Not one ordinary Pellet. Isotopes are worth two and decay fifty seconds after you arrive; the fuel rods at the edges keep, but they are a long way off. Start in the middle, and decide fast what the clock will let you have.');
  const ok = both(away(29, 11, 2), away(57, 22, 2));
  b.spread('h', 34, { ok }).spread('U', 8, { ok: both(ok, (x, y) => x < 6 || x > 53 || y < 3 || y > 20) }).spread('O', 44, { ok });
  place(b, 29, 11, 57, 22);
  b.fit(0.75).save();
}

// 273 Pyramid: gravity on, a pyramid of Lead packed with Pellets, and the Reactor on its apex.
if (want(273)) {
  const b = new Board(273, 'Pyramid', 45, 'Gravity is on and the Reactor sits on the apex of a pyramid of Lead, with Pellets packed in among the stones. The Graphite round it is all that holds it up; take it in the wrong order and the pyramid comes down.');
  b.head('gravity: on');
  for (let y = 5; y <= 18; y++) {
    const half = y - 5;
    for (let x = 29 - half; x <= 29 + half; x++) b.set(x, y, ((x * 3 + y * 5) % 7 === 0) ? '*' : 'O');
  }
  b.set(29, 4, '.').set(29, 3, 'X');
  const pyr = (x, y) => y < 4 || y > 19 || Math.abs(x - 29) > y - 5 + 1;
  b.spread('*', 34, { ok: both(away(1, 22, 3), pyr) }).spread('O', 14, { ok: both(away(1, 22, 3), pyr, (x, y) => y > 3) });
  b.set(1, 22, '@');
  b.fit(0.8).save();
}

// 274 Firestorm: a lightning bolt of fuse wired through sealed Neutrons and Plutonium; one spark lights it.
if (want(274)) {
  const b = new Board(274, 'Firestorm', 80, 'A bolt of fuse runs the length of the floor, wired to every sealed Neutron and Plutonium sphere it passes. Two red canisters, one spark: light it and run. Every cell of fuse you eat on the way cuts the bolt there.');
  const bolt = [[5, 3], [24, 3], [16, 10], [40, 10], [30, 17], [53, 17], [53, 20]];
  const fuse = [];
  for (let i = 0; i + 1 < bolt.length; i++) {
    let [x, y] = bolt[i];
    const [x1, y1] = bolt[i + 1];
    while (x !== x1 || y !== y1) {
      fuse.push([x, y]);
      if (y !== y1 && (x === x1 || Math.abs(y1 - y) * 3 >= Math.abs(x1 - x))) y += Math.sign(y1 - y); else x += Math.sign(x1 - x);
    }
  }
  fuse.push(bolt[bolt.length - 1]);
  b.pts(fuse, ',');
  // a sealed Neutron (or Plutonium on its Graphite) every few cells along the bolt, touching the fuse
  const used = [];
  fuse.forEach(([x, y], i) => {
    if (i % 6 !== 3) return;
    const below = b.get(x, y + 1) === '.' && b.get(x, y + 2) === '.';
    if (!below) return;
    if (i % 12 === 3) { b.box(x - 1, y + 1, 3, 3, 'R').set(x, y + 1, ','); b.set(x, y + 2, 'e'); }
    else b.set(x, y + 1, 'P');
    used.push([x - 1, y + 1, 3, 3]);
  });
  b.pts([[3, 6], [9, 1]], 'd');
  const off = (x, y) => !fuse.some(([fx, fy]) => Math.abs(fx - x) <= 1 && Math.abs(fy - y) <= 1);
  b.spread('*', 36, { ok: both(away(1, 1, 3), away(57, 22, 3), off, outside(...used)) }).spread('O', 16, { ok: both(away(1, 1, 3), away(57, 22, 3), off, outside(...used)) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 275 Sodium Tide: coolant reservoirs over the dig; every cell you open below one fills behind you.
if (want(275)) {
  const b = new Board(275, 'Sodium Tide', 55, 'Three reservoirs of liquid sodium sit over the dig, held back only by the Graphite. Open a tunnel under one and the tide follows you down it, swallowing what falls in. Three red canisters, and a blast clears a pool.');
  const pools = [[5, 2, 12, 4], [24, 2, 12, 4], [43, 2, 12, 4]];
  for (const [x, y, w, h] of pools) b.pool(x, y, w, h, '~');
  b.pts([[2, 8], [30, 12], [56, 9]], 'd');
  const keep = both(away(1, 1, 2), away(57, 22, 2), outside(...pools));
  b.spread('*', 85, { ok: keep }).spread('O', 26, { ok: both(keep, (x, y) => y > 8) });
  b.h(1, 7, 58, '.');
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 276 The Hive: a honeycomb of Cask cells joined by single plugs of Graphite. Gammas circle in the dead ends.
if (want(276)) {
  const b = new Board(276, 'The Hive', 55, 'A honeycomb of Cask cells, each joined to its neighbours by one plug of Graphite. Most hold Pellets, some under hanging Lead; the dead ends hold Gammas going round and round. Open only the plugs you need.', { fill: 'R' });
  const cells = [], idx = new Map();
  for (let r = 0; r <= 6; r++) {
    const off = r & 1 ? 2 : 0;
    for (let c = 0; 1 + 4 * c + off + 4 <= 58; c++) { idx.set(r + ',' + c, cells.length); cells.push({ r, c, x0: 1 + 4 * c + off, y0: 1 + 3 * r, nb: [] }); }
  }
  for (const a of cells) b.rect(a.x0 + 1, a.y0 + 1, 3, 2, '.');
  // neighbours: beside in the row (a plug in the wall between), and the overlapping cell in the next row
  const door = new Map();
  cells.forEach((a, i) => {
    const right = idx.get(a.r + ',' + (a.c + 1));
    if (right !== undefined) { a.nb.push(right); cells[right].nb.push(i); door.set(i + '-' + right, [a.x0 + 4, a.y0 + 2]); }
    for (const nb of cells) if (nb.r === a.r + 1) {
      const lo = Math.max(a.x0 + 1, nb.x0 + 1), hi = Math.min(a.x0 + 3, nb.x0 + 3);
      if (lo <= hi) { const j = cells.indexOf(nb); a.nb.push(j); nb.nb.push(i); door.set(i + '-' + j, [lo, a.y0 + 3]); }
    }
  });
  const plug = (i, j) => door.get(Math.min(i, j) + '-' + Math.max(i, j));
  // a spanning tree from the start cell, then Gammas in some of its dead ends
  const seen = new Set([0]), stack = [0], deg = new Array(cells.length).fill(0), tree = [];
  while (stack.length) {
    const i = stack[stack.length - 1], opts = cells[i].nb.filter(j => !seen.has(j));
    if (!opts.length) { stack.pop(); continue; }
    const j = opts[b.int(opts.length)];
    seen.add(j); stack.push(j); tree.push([i, j]); deg[i]++; deg[j]++;
  }
  const last = cells.length - 1, gam = new Set();
  cells.forEach((a, i) => { if (i > 2 && i !== last && deg[i] === 1 && b.int(10) < 4) gam.add(i); });
  for (const [i, j] of tree) b.set(...plug(i, j), '.');
  // a few extra plugs between Pellet cells make loops
  for (let n = 0; n < 14; n++) {
    const i = b.int(cells.length), nb = cells[i].nb, j = nb[b.int(nb.length)];
    if (gam.has(i) || gam.has(j)) continue;
    b.set(...plug(i, j), '.');
  }
  cells.forEach((a, i) => {
    const x = a.x0 + 1, y = a.y0 + 1;
    if (gam.has(i)) { b.rect(x, y, 3, 2, ' ').set(x + 2, y + 1, 'S'); return; }
    if (i === 0 || i === last) return;
    b.set(x + 1, y + 1, '*');
    if (i % 2 === 0) b.set(x + (i % 4 === 0 ? 0 : 2), y + 1, '*');
    if (deg[i] === 1 && i % 2 === 1) b.set(x + 1, y, 'O'); // Lead only in dead ends, where a fallen ball blocks nothing
  });
  place(b, 2, 2, cells[last].x0 + 3, cells[last].y0 + 2);
  b.fit(0.85).save();
}

// 277 Neutron Garden: twelve Neutron farms planted in crop rows; Gammas sleep between the rows.
if (want(277)) {
  const b = new Board(277, 'Neutron Garden', 90, 'Twelve Neutron farms planted in two rows. Each has a Lead ball or an orange canister waiting over its plug: stand beside the plug, snap it, and the drop splits the Neutron into nine Pellets. The Gammas between the rows are awake.');
  for (const top of [4, 14]) for (const cx of [4, 13, 22, 31, 40, 49]) b.farm(cx, top, (cx + top) % 3 === 0 ? 'o' : 'O');
  const sleepers = [pocket(b, 12, 11), pocket(b, 30, 11), pocket(b, 48, 11)];
  const ok = both(away(1, 1, 3), away(57, 22, 2), outside(...sleepers));
  b.spread('*', 26, { ok }).spread('O', 18, { ok });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 278 Quantum Vault: nine sealed vaults, tunnel charges for barely half of them, and the Reactor is in one.
if (want(278)) {
  const b = new Board(278, 'Quantum Vault', 40, 'Eight Concrete vaults, no doors, and tunnel charges for barely half of them; every vault costs one charge in and one out, and they are not worth the same. Count your charges, and the Pellets in each vault, before you spend the first.');
  const vaults = [[6, 3], [18, 3], [30, 3], [42, 3], [6, 13], [18, 13], [30, 13], [42, 13]];
  vaults.forEach(([x, y], i) => {
    b.box(x, y, 8, 6, '#');
    if (i % 4 === 1) b.rect(x + 1, y + 1, 6, 4, ' ').h(x + 1, y + 4, 6, '*').set(x + 6, y + 3, 'S');
    else if (i % 4 === 2) { b.rect(x + 1, y + 1, 6, 4, '.'); b.h(x + 1, y + 4, 6, '*').h(x + 2, y + 2, 4, 'O'); b.set(x + 1, y + 3, '*').set(x + 6, y + 3, '*'); }
    else b.rect(x + 1, y + 1, 6, 4, ' ').h(x + 2, y + 4, 4 + (i & 1) * 0, '*');
  });
  b.box(52, 8, 7, 6, '#').rect(53, 9, 5, 4, '.').set(55, 11, 'X').set(52, 11, '>'); // the Reactor's room has an airlock in
  b.pts([[3, 10], [27, 10], [40, 21], [15, 1]], 'Q');
  const ok = both(away(1, 1, 3), outside(...vaults.map(([x, y]) => [x, y, 8, 6]), [52, 8, 7, 6]));
  b.spread('*', 16, { ok }).spread('O', 20, { ok });
  b.set(1, 1, '@');
  b.save();
}

// 279 Fallout Marathon: a sea of fallout with Graphite islands, Iodine on a few of them.
if (want(279)) {
  const b = new Board(279, 'Fallout Marathon', 50, 'The whole floor is fallout but for a scatter of Graphite islands, and only a few islands hold Iodine. Run from island to island, take what lies between, and let the dose drain before the next run.');
  b.fallout(1, 2, 58, 21);
  const isles = [];
  for (let n = 0; n < 24; n++) { const x = 3 + b.int(50), y = 3 + b.int(16); b.rect(x, y, 3 + b.int(3), 2, '.'); isles.push([x, y]); }
  isles.filter((_, i) => i % 2 === 0).forEach(([x, y]) => b.set(x + 1, y, 'p'));
  b.rect(53, 20, 5, 2, '.'); // the last island, by the Reactor
  b.scatter('*', 70, { on: 'r', ok: away(57, 22, 2) }).scatter('O', 22, { on: 'r', ok: both(away(1, 1, 2), away(57, 22, 2)) });
  b.spread('*', 6, { ok: away(1, 1, 2) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 280 Teleport Ring: twelve sealed chambers you can only reach by teleport, one after the next.
if (want(280)) {
  const b = new Board(280, 'Teleport Ring', 50, 'Twelve sealed chambers and a pad in each. A pad sends you to the next pad in reading order, round the floor chamber by chamber, and the Reactor waits in the last chamber of all. Every chamber has its own trap.');
  b.v(14, 1, 22, '#');
  b.set(8, 4, 'W');
  const traps = ['O', 'S', 'A', 'r', 'B', 'O', 'S', 'r', 'A', 'B', 'O', 'S'];
  let k = 0;
  for (const y of [2, 9, 16]) for (const x of [16, 27, 38, 49]) {
    b.box(x, y, 9, 6, '#');
    const px = x + 4, py = y + 2, t = traps[k++];
    b.set(px, py, 'W');
    b.h(x + 1, y + 4, 7, '*');
    if (t === 'O') b.pts([[x + 2, y + 3], [x + 6, y + 3]], 'O');
    else if (t === 'S') b.h(x + 1, y + 1, 7, ' ').set(x + 1, y + 1, 'S');
    else if (t === 'A') b.h(x + 1, y + 3, 7, ' ').set(x + 1, y + 3, 'A').h(x + 1, y + 4, 7, '*');
    else if (t === 'r') b.h(x + 1, y + 3, 7, 'r').set(px, py + 1, 'r');
    else if (t === 'B') b.pts([[x + 2, y + 3], [x + 4, y + 3], [x + 6, y + 3]], 'B');
    if (b.get(px - 1, py) !== '.') b.set(px - 1, py, '.');
    if (b.get(px + 1, py) !== '.') b.set(px + 1, py, '.');
  }
  b.spread('*', 8, { x1: 13, ok: both(away(1, 1, 2), away(8, 4, 1)) }).spread('O', 6, { x1: 13, ok: both(away(1, 1, 2), away(8, 4, 1)) });
  place(b, 1, 1, 56, 19); // in the last chamber
  b.save();
}

// 281 Keymaster: five keycards, seven blast doors, and the Reactor is behind one of them.
if (want(281)) {
  const b = new Board(281, 'Keymaster', 40, 'Seven blast doors and five keycards, and the last door is the Reactor\'s. The vaults are not worth the same: look through the slits before you spend a card, and never spend the fifth.');
  b.h(1, 11, 58, ' ').h(1, 10, 58, '.').h(1, 12, 58, '.');
  const rooms = [[3, 2, 6], [13, 2, 14], [23, 2, 4], [33, 2, 10], [43, 2, 8], [8, 15, 12], [28, 15, 5]];
  for (const [x, y, n] of rooms) {
    b.box(x, y, 8, 7, '#').rect(x + 1, y + 1, 6, 5, '.');
    const dy = y < 11 ? y + 6 : y;
    b.set(x + 3, dy, 'D').set(x + 4, dy, '#');
    let put = 0;
    for (let j = y + 1; j <= y + 5 && put < n; j++) for (let i = x + 1; i <= x + 6 && put < n; i++) if ((i + j) % 2 === 0) { b.set(i, j, '*'); put++; }
    b.set(x + 6, dy, 'R'); // the slit: a Cask cell to look through
  }
  b.box(48, 15, 9, 7, '#').rect(49, 16, 7, 5, '.').set(52, 15, 'D').set(53, 18, 'X');
  b.pts([[2, 21], [20, 21], [40, 21], [57, 9], [25, 9]], 'K');
  b.h(1, 11, 58, ' ').set(1, 11, '.');
  const ok = both(away(1, 1, 2), outside(...rooms.map(([x, y]) => [x, y, 8, 7]), [48, 15, 9, 7]), (x, y) => Math.abs(y - 11) > 1);
  b.spread('*', 12, { ok }).spread('O', 20, { ok });
  b.pts([[15, 11], [44, 11]], 'S');
  b.set(1, 1, '@');
  b.save();
}

// 282 Hydrogen Sky: balloon stores across the sky, Antipellets in the band between them.
if (want(282)) {
  const b = new Board(282, 'Hydrogen Sky', 45, 'Ten hydrogen cells parked under low ceilings, each beside a shaft up to a sealed store. Push a cell into its shaft and it rises and bursts the store. Between the two rows of stores hangs a band of Antipellets, and they fall like the real thing.');
  for (const [x, y] of [[6, 8], [16, 8], [26, 8], [36, 8], [46, 8], [11, 19], [21, 19], [31, 19], [41, 19], [51, 19]]) b.hydroStore(x, y);
  b.scatter('!', 18, { y0: 11, y1: 13, ok: (x, y) => b.get(x, y + 1) === '.' });
  const free = (x, y) => y < 3 || (y > 9 && y < 11) || y === 14 || y > 20;
  b.spread('*', 30, { ok: both(away(1, 1, 3), away(57, 22, 2), free) }).spread('O', 14, { ok: both(away(1, 1, 3), away(57, 22, 2), (x, y) => y < 3 || y > 20) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 283 Magnetar: magnets behind Graphite plugs, Lead waiting at the far end of every spoke.
if (want(283)) {
  const b = new Board(283, 'Magnetar', 50, 'Every magnet here has a spoke of open floor either side of it, stopped by one plug of Graphite, with Lead waiting at the far end. Dig a plug and the Lead comes down the spoke to the magnet. Do not be in the spoke when it does.');
  for (const [mx, my] of [[12, 4], [30, 4], [48, 4], [21, 11], [39, 11], [12, 18], [30, 18], [48, 18]]) {
    b.set(mx, my, 'M');
    for (const s of [-1, 1]) {
      b.set(mx + s, my, ' ').set(mx + 2 * s, my, '.').set(mx + 3 * s, my, ' ').set(mx + 4 * s, my, ' ').set(mx + 5 * s, my, 'O');
    }
  }
  const spokes = (x, y) => ![4, 11, 18].includes(y) && ![3, 10, 17].includes(y);
  b.spread('*', 75, { ok: both(away(1, 1, 3), away(57, 22, 2), spokes) }).spread('O', 16, { ok: both(away(1, 1, 3), away(57, 22, 2), spokes) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 284 Domino: rows of orange canisters on Cask shelves over caged Pellets; one blast runs the whole line.
if (want(284)) {
  const b = new Board(284, 'Domino', 50, 'Two lines of orange canisters stand shoulder to shoulder on Cask shelves, and every one that goes off sets off the next. Under each shelf Pellets wait in Cask. Two red canisters start a line; be well away from it when it runs.');
  for (const y of [6, 16]) {
    b.h(5, y, 48, 'o').h(5, y + 1, 48, 'R').h(5, y + 3, 48, 'R');
    for (let x = 5; x < 53; x++) b.set(x, y + 2, x % 2 ? '*' : 'R');
    b.set(4, y + 2, 'R').set(53, y + 2, 'R');
  }
  b.pts([[2, 3], [56, 13]], 'd');
  const lines = (x, y) => !(y >= 5 && y <= 9) && !(y >= 15 && y <= 19);
  b.spread('*', 30, { ok: both(away(1, 1, 3), away(57, 22, 2), lines) }).spread('O', 14, { ok: both(away(1, 1, 3), away(57, 22, 2), lines) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 285 Alpha Lattice: five Alpha lanes each way; the Pellets wait in the squares between.
if (want(285)) {
  const b = new Board(285, 'Alpha Lattice', 55, 'A loom of Alpha lanes, five across and five down, every one of them running. The Pellets wait in the squares between. Every crossing is a gamble on two lanes at once; watch both before you step.');
  for (const y of [4, 8, 12, 16, 20]) b.lane(2, y, 56, 'A');
  for (const x of [10, 20, 30, 40, 50]) b.lane(x, 2, 20, 'V');
  const off = (x, y) => ![4, 8, 12, 16, 20].includes(y) && ![10, 20, 30, 40, 50].includes(x);
  b.spread('*', 80, { ok: both(away(1, 1, 2), away(57, 22, 2), off) }).spread('O', 16, { ok: both(away(1, 1, 3), away(57, 22, 2), off) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 286 Ice Palace: the whole floor is ice; Concrete pillars are the only brakes.
if (want(286)) {
  const b = new Board(286, 'Ice Palace', 50, 'The whole floor is ice and the Concrete pillars are the only brakes. Every run ends against a pillar, a wall or a patch of Graphite; read the room for the stopping places, because the Pellets lie on the runs between them.', { fill: 'I' });
  for (let y = 3; y <= 20; y += 4) for (let x = 5 + ((y >> 2) & 1) * 3; x <= 55; x += 6) b.set(x, y, '#');
  for (const [x, y, w, h] of [[1, 1, 4, 2], [27, 10, 5, 3], [54, 20, 5, 3], [12, 18, 3, 2], [44, 5, 3, 2]]) b.rect(x, y, w, h, '.');
  b.scatter('*', 60, { on: 'I', ok: both(away(1, 1, 2), away(57, 22, 2)) });
  b.scatter('O', 8, { on: '.', ok: both(away(1, 1, 2), away(57, 22, 2)) });
  place(b, 1, 1, 57, 22);
  b.fit(0.75).save();
}

// 287 Plutonium Garden: spheres on posts with Lead hanging over them; drop the Lead and harvest the fission.
if (want(287)) {
  const b = new Board(287, 'Plutonium Garden', 75, 'A garden of Plutonium, each sphere on its own post with Lead hanging two cells over it. Snap the Graphite under the Lead from the side and the drop splits the sphere into nine Pellets. Stand two cells off; a fission blast reaches one.');
  const plots = [];
  for (const y of [5, 13, 20]) for (let x = 5 + (y === 13 ? 4 : 0); x <= 53; x += 8) {
    b.set(x, y, 'P').set(x, y + 1, '#').set(x, y - 1, ' ').set(x, y - 2, '.').set(x, y - 3, 'O');
    plots.push([x - 1, y - 3, 3, 5]);
  }
  const sleepers = [pocket(b, 17, 9), pocket(b, 41, 9), pocket(b, 29, 17)];
  const ok = both(away(1, 1, 3), away(57, 22, 2), outside(...plots, ...sleepers));
  b.spread('*', 24, { ok }).spread('O', 18, { ok });
  place(b, 1, 1, 57, 22);
  b.save(); // the rough reach check does not count fission, so the need is set by hand
}

// 288 Deep Breath: fifty seconds of air, ice chutes for speed, a tank at the far end of every run.
if (want(288)) {
  const b = new Board(288, 'Deep Breath', 45, 'Fifty seconds of air and a long way down. Each ice chute is the fastest way across the floor and ends at a tank; miss the tank, or stop to dig for Pellets on the way, and the suit runs dry.');
  b.head('air: 50');
  for (const [y, dir] of [[4, 1], [9, -1], [14, 1], [19, -1]]) {
    b.rink(3, y, 54, 1);
    b.set(dir > 0 ? 57 : 2, y, 't');
    b.scatter('*', 10, { on: 'I', y0: y, y1: y });
  }
  const chutes = (x, y) => ![4, 9, 14, 19].includes(y);
  b.spread('*', 40, { ok: both(away(1, 1, 2), away(57, 22, 2), chutes) }).spread('O', 24, { ok: both(away(1, 1, 3), away(57, 22, 2), chutes) });
  b.spread('t', 3, { ok: both(away(1, 1, 3), chutes) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 289 Shadow Play: dark, and the laser beams are the only light.
if (want(289)) {
  const b = new Board(289, 'Shadow Play', 50, 'Lights out, and the only light is the lasers. A beam shows you its lane for the second it is live, and then it is dark again. The Pellets are in the lanes; learn each beat, then go in on the dark.');
  b.head('dark: on');
  const rows = [4, 9, 14, 19];
  rows.forEach((y, i) => { b.h(3, y, 54, ' '); b.set(i & 1 ? 57 : 2, y, 'l'); for (let x = 6 + i; x < 54; x += 5) b.set(x, y, '*'); });
  b.v(30, 4, 16, ' ').set(30, 4, '\\').set(30, 19, '/');
  b.pts([[8, 2], [50, 11], [20, 21]], 'L');
  const off = (x, y) => !rows.includes(y) && x !== 30;
  b.spread('*', 30, { ok: both(away(1, 1, 2), away(57, 22, 2), off) }).spread('O', 20, { ok: both(away(1, 1, 3), away(57, 22, 2), off) });
  place(b, 1, 1, 57, 22);
  b.fit(0.8).save();
}

// 290 Clock Face: twelve guarded orbits round the Reactor, two Alpha lanes for the hands.
if (want(290)) {
  const b = new Board(290, 'Clock Face', 40, 'Twelve hours round the face, a Gamma guarding the Pellet at every one, and the hands are Alpha lanes running out from the centre. The Reactor is the pivot. Go round the clock; cross a hand only when it has swept past.');
  const rings = [];
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2, x = Math.round(29 + Math.cos(a) * 22), y = Math.round(10 + Math.sin(a) * 7.5);
    rings.push(orbit(b, x, y));
  }
  b.lane(31, 11, 14, 'A').lane(29, 3, 7, 'V');
  b.rect(28, 10, 3, 3, '#').set(29, 11, 'X').set(28, 11, '.');
  const hands = (x, y) => !(y === 11 && x >= 30) && !(x === 29 && y < 11);
  b.spread('*', 40, { ok: both(away(1, 1, 3), outside(...rings, [28, 10, 3, 3]), hands) }).spread('O', 22, { ok: both(away(1, 1, 3), outside(...rings, [28, 10, 3, 3]), hands) });
  b.set(1, 1, '@');
  b.fit(0.8).save();
}

// 291 Echo Chamber: a maze of one-cell rooms and one-way airlocks, with Gammas loose in some rooms.
if (want(291)) {
  const b = new Board(291, 'Echo Chamber', 38, 'Rooms one cell wide, airlocks that mostly go one way, and somewhere in the maze the Gammas, which cannot use airlocks but can follow you through every gap you dig. Find the loop, then find the way out of it.', { fill: '#' });
  const CW = 29, CH = 11, room = (i, j) => [1 + 2 * i, 1 + 2 * j];
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) b.set(...room(i, j), ' ');
  const seen = new Set(['0,0']), stack = [[0, 0]];
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => i + di >= 0 && j + dj >= 0 && i + di < CW && j + dj < CH && !seen.has(`${i + di},${j + dj}`));
    if (!opts.length) { stack.pop(); continue; }
    const [di, dj] = opts[b.int(opts.length)];
    const [x, y] = room(i, j), k = b.int(100);
    b.set(x + di, y + dj, k < 30 && di ? '*' : k < 50 ? '.' : (di ? '-' : '|'));
    seen.add(`${i + di},${j + dj}`); stack.push([i + di, j + dj]);
  }
  for (let n = 0; n < 110; n++) {
    const i = b.int(CW), j = b.int(CH), [di, dj] = [[1, 0], [0, 1]][b.int(2)];
    if (i + di >= CW || j + dj >= CH) continue;
    const [x, y] = room(i, j);
    if (b.get(x + di, y + dj) !== '#') continue;
    b.set(x + di, y + dj, di ? (b.int(2) ? '>' : '<') : (b.int(2) ? 'v' : '^'));
  }
  // Graphite in the rooms that hold nothing, so a Gamma cannot wander the whole maze from the start
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) if ((i * 7 + j * 3) % 4 === 0) b.set(...room(i, j), '.');
  for (const [i, j] of [[8, 3], [20, 7], [14, 9], [24, 2]]) b.set(...room(i, j), 'S');
  b.set(1, 1, '@').set(57, 21, 'X').set(56, 21, '.');
  b.save();
}

// 292 Antimatter Sea: Pellets and Antipellets interleaved; every wrong bite costs one.
if (want(292)) {
  const b = new Board(292, 'Antimatter Sea', 60, 'A sea of Pellets and Antipellets laid side by side, so that almost every Pellet has antimatter at its shoulder. Each wrong bite takes one back. Dig the long way round, and snap from the side when a column is mixed.');
  for (let y = 3; y <= 20; y++) for (let x = 4; x <= 55; x++) if ((x + y) % 4 === 0 && b.get(x, y + 1) !== ' ') b.set(x, y, (x * 7 + y * 3) % 5 < 2 ? '!' : '*');
  b.spread('O', 30, { ok: both(away(1, 1, 3), away(57, 22, 2)) });
  place(b, 1, 1, 57, 22);
  b.fit(0.7).save();
}

// 293 Thruster Run: gravity on, chasms between the ledges, and only thruster charges to cross them.
if (want(293)) {
  const b = new Board(293, 'Thruster Run', 40, 'Gravity is on and the floor is cut by chasms. A Thruster dashes you over open space and lifts you out of a pit, three charges to a pickup, and there are not many pickups. Fall into a chasm with none left and you climb out the hard way.');
  b.head('gravity: on');
  for (const x of [10, 20, 30, 40, 50]) b.rect(x, 4, 3, 18, ' ');
  for (const x of [10, 20, 30, 40, 50]) b.h(x, 22, 3, '.');
  b.pts([[4, 21], [24, 10], [44, 15], [15, 6]], 'J');
  const chasm = (x, y) => ![10, 20, 30, 40, 50].some(c => x >= c - 1 && x <= c + 3);
  b.spread('*', 50, { ok: both(away(1, 21, 3), away(57, 2, 2), chasm) }).spread('O', 16, { ok: both(away(1, 21, 3), away(57, 2, 2), chasm) });
  b.set(1, 21, '@').set(57, 2, 'X');
  b.fit(0.8).save();
}

// 294 The Ninth Circle: nine rooms in a snake behind airlocks, dark and on air, each with its own hazard.
if (want(294)) {
  const b = new Board(294, 'The Ninth Circle', 50, 'Nine rooms, one after another, in the dark and on air: Lead, Gammas, fallout, Alphas, hot spots, acid, Plutonium, lasers, and the last is all of them. One tank in each room. The airlocks go one way, down into the next circle.', { fill: '#' });
  b.head('air: 90').head('dark: on');
  const traps = ['O', 'S', 'r', 'A', 'B', 'a', 'P', 'l', 'X'];
  const order = [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2]];
  order.forEach(([c, r], k) => {
    const x = 1 + c * 19, y = 1 + r * 7, w = 18, h = 6;
    b.rect(x, y, w, h, '.');
    const t = traps[k];
    if (t === 'O') b.scatter('O', 10, { x0: x, y0: y, x1: x + w - 1, y1: y + 3 });
    if (t === 'S') { b.h(x + 1, y + 2, w - 2, ' ').set(x + 1, y + 2, 'S').set(x + w - 2, y + 2, 'S'); }
    if (t === 'r') b.rect(x + 2, y + 1, w - 4, h - 2, 'r');
    if (t === 'A') b.lane(x, y + 3, w, 'A');
    if (t === 'B') b.rect(x + 2, y + 1, w - 4, h - 2, 'B');
    if (t === 'a') b.pool(x + 4, y + 2, 4, 3, 'a').pool(x + 11, y + 1, 3, 4, 'a');
    if (t === 'P') b.pts([[x + 3, y + 3], [x + 8, y + 3], [x + 13, y + 3]], 'P');
    if (t === 'l') b.h(x, y + 2, w, ' ').set(x, y + 2, 'l');
    b.scatter('*', 9, { on: '.', x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 });
    b.scatter('t', 1, { on: '.', x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 });
    // the airlock into the next room
    const nx = order[k + 1];
    if (!nx) return;
    if (nx[1] === r) b.set(nx[0] > c ? x + w : x - 1, y + 3, nx[0] > c ? '>' : '<');
    else b.set(x + 9, y + h, 'v');
  });
  b.scatter('L', 2, { on: '.', x0: 1, y0: 1, x1: 18, y1: 6 });
  place(b, 1, 1, 56, 20);
  b.save();
}

// 295 Enlightenment: the finale. Four quarters, each a discipline, and the Reactor sealed in the middle.
if (want(295)) {
  const b = new Board(295, 'Enlightenment', 70, 'The last floor. Four quarters, one discipline each: ice and Alphas, light and mirrors, the hive, the fallout. The Reactor is sealed in the centre behind a gate, and the switch is as far from it as the plant allows. Everything the Guru taught, at once.');
  b.v(29, 1, 22, '#').h(1, 11, 58, '#');
  b.rect(24, 8, 11, 7, '#').rect(25, 9, 9, 5, '.').set(29, 11, 'X').set(24, 11, 'g');
  b.pts([[29, 5], [29, 17], [12, 11], [45, 11]], '.');
  // north-west: ice and Alphas
  b.rink(3, 2, 22, 3).lane(3, 6, 22, 'A').lane(3, 9, 20, 'A');
  b.scatter('*', 10, { on: 'I', x0: 3, y0: 2, x1: 24, y1: 4 });
  // north-east: lasers and mirrors
  b.h(31, 3, 26, ' ').set(57, 3, 'l').h(31, 8, 26, ' ').set(31, 8, 'l').v(44, 3, 6, ' ').set(44, 3, '/').set(44, 8, '\\');
  for (let x = 33; x < 56; x += 4) if (x !== 44) b.set(x, 3, '*').set(x + 1, 8, '*');
  // south-west: sleeping Gammas in Cask cells
  for (const [x, y] of [[4, 14], [12, 14], [20, 14], [8, 19], [16, 19]]) { b.box(x - 1, y - 1, 5, 3, 'R').h(x, y, 3, ' ').set(x + 1, y, 'S').set(x + 1, y - 1, '.'); b.set(x + 1, y - 2, '*'); }
  // south-east: fallout with Iodine at the edges and isotopes in the middle
  b.fallout(36, 13, 21, 8).pts([[35, 16], [57, 16]], 'p').scatter('h', 8, { on: 'r', x0: 38, y0: 13, x1: 54, y1: 20 });
  // the switch, in the far corner of the quarter furthest from the gate
  b.set(57, 21, 's');
  const keep = both(away(1, 1, 2), outside([24, 8, 11, 7]), (x, y) => !(x >= 56 && y >= 20), away(24, 11, 1));
  b.spread('*', 40, { ok: keep }).spread('O', 24, { ok: both(keep, (x, y) => !(x >= 54 && y >= 18)) });
  b.set(1, 1, '@');
  b.fit(0.8).save();
}
