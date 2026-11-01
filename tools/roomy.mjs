// Gives every Gamma and Neutron room to be seen. An enemy waiting in a tiny pocket behind one cell of
// Graphite gives no warning: dig next to it and it is on Iso at once. So, on the floors this is run on:
//  - an enemy fewer than FAR steps (as the crow flies) from the start is taken out, Graphite in its place;
//  - a pocket of empty space holding an enemy that is smaller than ROOM cells is hollowed out into the
//    Graphite round it, nearest cells first, never under anything that falls or rolls and never within
//    KEEP steps of the start, until it is ROOM cells;
//  - an enemy whose pocket cannot grow that far is taken out too (its pocket stays, empty).
// roomy(g) works on a Board's grid (rows of one-character cells) and returns what it changed.
// As a tool it rewrites level files in place: node tools/roomy.mjs [first] [last]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOM = 8, FAR = 7, KEEP = 4;
const ENEMY = 'Se', HEAVY = 'O*oPRdyhUB'; // enemies; things that fall or roll (Lead, Pellets, canisters, ...)

export function roomy(g) {
  const W = g[0].length, H = g.length, get = (x, y) => (g[y] || [])[x];
  let sx = 0, sy = 0;
  g.forEach((r, y) => r.forEach((c, x) => { if (c === '@') { sx = x; sy = y; } }));
  const far = (x, y) => Math.abs(x - sx) + Math.abs(y - sy);
  const done = { removed: 0, hollowed: 0 };
  // enemies too near the start
  const early = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (ENEMY.includes(get(x, y)) && far(x, y) < FAR) { early.push(get(x, y)); g[y][x] = '.'; }
  // a cell may be hollowed when it is Graphite, away from the start and the border, and nothing that
  // falls or rolls sits above it or above its sides
  const canHollow = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && get(x, y) === '.' && far(x, y) >= KEEP &&
    ![[-1, -1], [0, -1], [1, -1]].some(([dx, dy]) => HEAVY.includes(get(x + dx, y + dy) || '#'));
  const pocketOf = (x, y) => {
    const cells = [[x, y]], seen = new Set([y * W + x]);
    for (let i = 0; i < cells.length; i++) {
      const [cx, cy] = cells[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = ny * W + nx, n = get(nx, ny);
        if (seen.has(k) || (n !== ' ' && !ENEMY.includes(n || '#'))) continue;
        seen.add(k); cells.push([nx, ny]);
      }
    }
    return { cells, seen };
  };
  // an enemy wedged under something that falls or rolls holds it up: freed, it would let it drop
  const heavyOver = (x, y) => [[-1, -1], [0, -1], [1, -1]].some(([dx, dy]) => HEAVY.includes(get(x + dx, y + dy) || '#'));
  const moved = early;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!ENEMY.includes(get(x, y))) continue;
    let p = pocketOf(x, y);
    if (p.cells.length < ROOM && heavyOver(x, y)) { moved.push(get(x, y)); g[y][x] = '.'; continue; }
    while (p.cells.length < ROOM) {
      // the Graphite cell next to the pocket that is nearest the enemy
      let best = null, bd = Infinity;
      for (const [cx, cy] of p.cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (p.seen.has(ny * W + nx) || !canHollow(nx, ny)) continue;
        const d = Math.abs(nx - x) + Math.abs(ny - y);
        if (d < bd) { bd = d; best = [nx, ny]; }
      }
      if (!best) break;
      g[best[1]][best[0]] = ' '; done.hollowed++;
      p = pocketOf(x, y);
    }
    // a pocket that cannot grow: its enemies leave, and Graphite fills where they stood
    if (p.cells.length < ROOM) for (const [cx, cy] of p.cells) if (ENEMY.includes(get(cx, cy))) { moved.push(get(cx, cy)); g[cy][cx] = '.'; }
  }
  // the enemies taken out move to the roomy pockets away from the start (an empty cell with nothing
  // that falls above it and no enemy beside it), so a floor keeps its Neutrons' Pellets; one with no
  // such pocket left loses them
  const rooms = [], seenAll = new Set();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (get(x, y) !== ' ' || seenAll.has(y * W + x)) continue;
    const p = pocketOf(x, y);
    for (const k of p.seen) seenAll.add(k);
    if (p.cells.length >= ROOM && p.cells.every(([cx, cy]) => far(cx, cy) >= FAR)) rooms.push(p.cells);
  }
  rooms.sort((a, b) => b.length - a.length);
  const nextToEnemy = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ENEMY.includes(get(x + dx, y + dy) || '#'));
  for (const kind of moved) {
    let placed = false;
    for (const room of rooms) {
      const spot = room.find(([cx, cy]) => get(cx, cy) === ' ' && !heavyOver(cx, cy) && !nextToEnemy(cx, cy));
      if (spot) { g[spot[1]][spot[0]] = kind; placed = true; break; }
    }
    if (placed) done.moved = (done.moved || 0) + 1; else done.removed++;
  }
  return done;
}

const main = !!process.argv[1] && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (main) {
  const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
  const [FIRST, LAST] = [+(process.argv[2] || 296), +(process.argv[3] || 545)];
  for (const f of readdirSync(DIR).sort()) {
    const num = parseInt(f, 10);
    if (!(num >= FIRST && num <= LAST)) continue;
    const text = readFileSync(join(DIR, f), 'utf8'), [head, body] = text.split('\n---\n');
    const g = body.trimEnd().split('\n').map(r => [...r]);
    const d = roomy(g);
    if (!d.removed && !d.hollowed) continue;
    writeFileSync(join(DIR, f), head + '\n---\n' + g.map(r => r.join('')).join('\n') + '\n');
    console.log(`${num} ${f.slice(4, -4).padEnd(22)} hollowed ${d.hollowed}, enemies taken out ${d.removed}`);
  }
}
