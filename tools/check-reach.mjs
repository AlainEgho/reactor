// Static check for the copied-classic floors (God of War, Titans, Olympus): from the start, following
// one-way airlocks only the way they point, can Iso reach the Reactor, and how many Pellets can he reach?
// Cask ('R') counts as passable on a floor that has red or yellow canisters, since it can be blasted open.
// Prints one line per floor; with --fix, lowers a need that is above what can be reached (never raises).
// Usage: node tools/check-reach.mjs [first] [last] [--fix]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
const args = process.argv.slice(2), fix = args.includes('--fix');
const nums = args.filter(a => /^\d+$/.test(a)), [FIRST, LAST] = [+(nums[0] || 396), +(nums[1] || 545)];
const MASK = { '^': 1, '>': 2, 'v': 4, '<': 8, '|': 5, '-': 10, '+': 15 }, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const OPEN = ' .*dBXOoyS@eIrpNQtLh!cP/\\F,AVUJ%ZKHGqg';
let bad = 0;
for (const f of readdirSync(DIR).sort()) {
  const num = parseInt(f, 10);
  if (!(num >= FIRST && num <= LAST)) continue;
  const text = readFileSync(join(DIR, f), 'utf8'), [head, body] = text.split('\n---\n');
  const map = body.trimEnd().split('\n'), need = +head.match(/^need: (\d+)/m)[1];
  const flat = map.join(''), blast = /[dy]/.test(flat);
  const get = (x, y) => (map[y] || '')[x];
  const open = c => c !== undefined && (OPEN.includes(c) || (blast && c === 'R'));
  let sx = 0, sy = 0;
  map.forEach((r, y) => { const x = r.indexOf('@'); if (x >= 0) { sx = x; sy = y; } });
  const seen = new Set([sy * 60 + sx]), q = [[sx, sy]];
  let pellets = 0, elec = 0, exit = false;
  while (q.length) {
    const [x, y] = q.pop(), c = get(x, y);
    if (c === '*') pellets++; else if (c === 'e') elec++; else if (c === 'X') { exit = true; continue; }
    for (let d = 0; d < 4; d++) {
      let nx = x + DX[d], ny = y + DY[d], n = get(nx, ny);
      if (MASK[n] & (1 << d)) { nx += DX[d]; ny += DY[d]; n = get(nx, ny); }
      if (!open(n) || seen.has(ny * 60 + nx)) continue;
      seen.add(ny * 60 + nx); q.push([nx, ny]);
    }
  }
  const supply = pellets + 6 * elec, ok = exit && supply >= need;
  let note = '';
  if (exit && supply < need && fix) {
    const lower = Math.max(supply > 0 ? 1 : 0, supply);
    writeFileSync(join(DIR, f), text.replace(/^need: \d+/m, 'need: ' + lower));
    note = ` -> need ${lower}`;
  }
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'BAD '} ${num} ${f.slice(4, -4).padEnd(20)} need ${String(need).padStart(3)} reach ${String(supply).padStart(3)} exit ${exit ? 'yes' : 'NO '}${note}`);
}
console.log(`${bad} floor(s) need attention`);
