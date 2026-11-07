// Kids, levels 596-645. Short rooms: dig the floor, take every Pellet, step on the X.
// Lead, when it shows up, rests on the outer wall and can be pushed into an open pocket.
// Usage: node tools/design-batch-21.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
const FIRST = 596;

const NAMES = [
  'Meadow', 'Puddles', 'Picnic', 'Sandbox', 'Hopscotch', 'Buttons', 'Marbles', 'Cookies', 'Kite', 'Stepping Stones',
  'Lunchbox', 'Garden', 'Pebbles', 'Shortcut', 'Tree Shade', 'Careful', 'Side Door', 'Quiet Ball', 'Pockets', 'Around',
  'Little Bridge', 'Snack', 'Zigzag', 'Window', 'Back Path', 'Soft Step', 'One Ball', 'Nudge', 'Roll Right', 'The Gap',
  'Three Paths', 'Lantern', 'Parade', 'Hideout', 'Circle', 'Extra Bite', 'Long Way', 'Camp', 'Stars', 'Playground',
  'Secret Shelf', 'Double Nudge', 'Home Stretch', 'Last Pocket', 'Sunny Yard', 'Follow Me', 'Almost Home', 'Big Skip', 'Prize', 'Bedtime',
];

const SHAPE = [
  'A few pillars stand in the room.',
  'One wall crosses the room, with a gap at the left.',
  'One wall crosses the room, with a gap at the right.',
  'A wall stands in the middle, and the way around is at the bottom.',
  'Two walls overlap, with a gap at each end.',
  'Short walls hang down from the top.',
];

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function blank(w, h) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  for (let x = 0; x < w; x++) { g[0][x] = '#'; g[h - 1][x] = '#'; }
  for (let y = 0; y < h; y++) { g[y][0] = '#'; g[y][w - 1] = '#'; }
  return g;
}

function find(g, ch) {
  for (let y = 0; y < g.length; y++) {
    const x = g[y].indexOf(ch);
    if (x >= 0) return [x, y];
  }
  return null;
}

// Walks Graphite, empty space, Pellets and the start. Lead and concrete stay put.
// Reaching the exit counts, and the search does not continue past it.
function reach(g) {
  const start = find(g, '@');
  const h = g.length, w = g[0].length;
  const seen = Array.from({ length: h }, () => Array(w).fill(false));
  const open = c => c === '.' || c === ' ' || c === '*' || c === '@' || c === 'X';
  const q = [start];
  seen[start[1]][start[0]] = true;
  let exit = false;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (g[y][x] === 'X') { exit = true; continue; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny][nx] || !open(g[ny][nx])) continue;
      seen[ny][nx] = true;
      q.push([nx, ny]);
    }
  }
  return { seen, exit };
}

function connected(g) {
  const { seen, exit } = reach(g);
  if (!exit) return false;
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] === '*' && !seen[y][x]) return false;
    }
  }
  return true;
}

function paint(g, x, y, c) {
  if (y <= 0 || x <= 0 || y >= g.length - 1 || x >= g[0].length - 1) return false;
  if (g[y][x] === '@' || g[y][x] === 'X') return false;
  g[y][x] = c;
  return true;
}

function walls(g, k) {
  const w = g[0].length, h = g.length;
  const kind = k % 6;
  if (kind === 0) {
    const spots = [[3, 2], [3, 4], [w - 4, 3], [5, h - 4], [w - 6, h - 4]];
    for (const [x, y] of spots) paint(g, x, y, '#');
  } else if (kind === 1) {
    const y = Math.floor(h / 2);
    for (let x = 3; x < w - 2; x++) paint(g, x, y, '#');
  } else if (kind === 2) {
    const y = Math.floor(h / 2);
    for (let x = 2; x < w - 3; x++) paint(g, x, y, '#');
  } else if (kind === 3) {
    const x = Math.floor(w / 2);
    for (let y = 2; y < h - 3; y++) paint(g, x, y, '#');
  } else if (kind === 4) {
    const y1 = 2, y2 = h - 4;
    for (let x = 1; x < w - 3; x++) paint(g, x, y1, '#');
    for (let x = 3; x < w - 1; x++) paint(g, x, y2, '#');
  } else {
    for (let i = 0; i < 3; i++) {
      const x = 3 + i * 3;
      paint(g, x, 1, '#');
      paint(g, x, 2, '#');
    }
  }
  // A speck that moves with the scenario, reverted if it seals the room.
  const sx = 2 + (k % 4), sy = 3 + (k % 3);
  if (paint(g, sx, sy, '#')) {
    if (!connected(g)) g[sy][sx] = '.';
  }
}

// Lead on the bottom row, sitting on the outer wall, with two empty cells to push it into.
function pushLane(g) {
  const w = g[0].length, y = g.length - 2;
  const ox = w - 5;
  const before = [ox - 1, ox, ox + 1, ox + 2, ox + 3].map(x => g[y][x]);
  g[y][ox - 1] = '.';
  g[y][ox] = 'O';
  g[y][ox + 1] = ' ';
  g[y][ox + 2] = ' ';
  g[y][ox + 3] = '#';
  if (!connected(g)) {
    [ox - 1, ox, ox + 1, ox + 2, ox + 3].forEach((x, i) => { g[y][x] = before[i]; });
    return false;
  }
  return true;
}

// A second ball in the top-left corner, on a block, off the way to the exit.
function cornerBall(g) {
  const prev = g[1][2], under = g[2][2];
  if (prev === '@' || prev === 'X') return false;
  g[1][2] = 'O';
  if (under !== '#') g[2][2] = '#';
  if (!connected(g) || g[3] && g[3][2] === ' ' ) {
    g[1][2] = prev;
    g[2][2] = under;
    return false;
  }
  // The ball must rest on concrete, never on empty space.
  if (g[2][2] !== '#') {
    g[1][2] = prev;
    g[2][2] = under;
    return false;
  }
  return true;
}

function sprinkle(g, n, k) {
  const { seen } = reach(g);
  const cells = [];
  for (let y = 1; y < g.length - 1; y++) {
    for (let x = 1; x < g[0].length - 1; x++) {
      // A Pellet over an empty cell falls at the start, so leave that floor bare.
      if (g[y][x] === '.' && seen[y][x] && g[y + 1][x] !== ' ') cells.push([x, y]);
    }
  }
  if (cells.length < n) throw new Error(`only ${cells.length} open cells for ${n} pellets`);
  const step = Math.max(1, Math.floor(cells.length / n));
  const used = new Set();
  let placed = 0;
  for (let i = 0; placed < n && i < cells.length * 2; i++) {
    const idx = (k + i * step) % cells.length;
    if (used.has(idx)) continue;
    used.add(idx);
    const [x, y] = cells[idx];
    g[y][x] = '*';
    placed++;
  }
  if (placed !== n) throw new Error(`placed ${placed} of ${n}`);
}

function hintFor(k, name, n) {
  const shape = SHAPE[k % 6];
  if (k < 12) return `${name}. ${shape} Dig the Graphite, pick up all ${n} Pellets, and step on the X.`;
  if (k < 36) return `${name}. ${shape} The Lead ball sits on the wall, so it stays put. Walk around it, take all ${n} Pellets, and step on the X.`;
  return `${name}. ${shape} Push a Lead ball sideways into the open, or leave it where it is. Take all ${n} Pellets and step on the X.`;
}

function scenario(k) {
  const w = 12 + Math.floor(k / 10);
  const h = 8 + Math.floor(k / 16);
  const g = blank(w, h);
  g[h - 2][1] = '@';
  g[1][w - 2] = 'X';
  walls(g, k);
  let leads = 0;
  if (k >= 12 && pushLane(g)) leads++;
  if (k >= 36 && cornerBall(g)) leads++;
  const n = 3 + Math.floor(k / 10);
  sprinkle(g, n, k);
  if (!connected(g)) throw new Error(`${NAMES[k]} is sealed`);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = g[y][x];
      if ((c === 'O' || c === '*') && g[y + 1][x] === ' ') throw new Error(`${NAMES[k]} drops a ${c} at ${x},${y}`);
    }
  }
  const flat = g.map(r => r.join('')).join('');
  if ((flat.match(/@/g) || []).length !== 1 || (flat.match(/X/g) || []).length !== 1) throw new Error(`${NAMES[k]} lost its start or exit`);
  if ((flat.match(/\*/g) || []).length !== n) throw new Error(`${NAMES[k]} pellet count`);
  return { name: NAMES[k], need: n, hint: hintFor(k, NAMES[k], n), leads, rows: g.map(r => r.join('')) };
}

if (NAMES.length !== 50) throw new Error(`expected 50 names, got ${NAMES.length}`);

for (let k = 0; k < 50; k++) {
  const s = scenario(k);
  const num = FIRST + k;
  const body = `name: ${s.name}\nneed: ${s.need}\nhint: ${s.hint}\n---\n${s.rows.join('\n')}\n`;
  writeFileSync(join(DIR, `${String(num).padStart(3, '0')}-${slug(s.name)}.txt`), body);
  console.log(`${num} ${s.name.padEnd(16)} ${s.rows[0].length}x${s.rows.length} pellets ${s.need} lead ${s.leads}`);
}
console.log('wrote 50 Kids scenarios');
