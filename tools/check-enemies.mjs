// Where the enemies wait. Gammas ('S') and Neutrons ('e') only travel through empty space, so each one
// lives in a pocket: the empty cells (and other enemies) joined to it. An enemy in a tiny pocket behind
// one cell of Graphite gives no warning: dig next to it and it is on you at once. For each floor this
// finds the smallest pocket that holds an enemy and the nearest enemy to the start (as the crow flies,
// in steps). A floor fails when a pocket is under --room cells or an enemy is under --far steps away.
// Usage: node tools/check-enemies.mjs [first] [last] [--all] [--room N] [--far N]
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
const args = process.argv.slice(2), all = args.includes('--all');
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? +args[i + 1] : dflt; };
const ROOM = opt('--room', 8), FAR = opt('--far', 7);
const nums = args.filter((a, k) => /^\d+$/.test(a) && !String(args[k - 1]).startsWith('--'));
const [FIRST, LAST] = [+(nums[0] || 1), +(nums[1] || 9999)];
export function enemyReport(map) {
  const get = (x, y) => (map[y] || '')[x];
  let sx = 0, sy = 0;
  map.forEach((r, y) => { const x = r.indexOf('@'); if (x >= 0) { sx = x; sy = y; } });
  const seen = new Map(), pockets = [];
  let near = Infinity, enemies = 0;
  for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
    const c = get(x, y);
    if (c !== 'S' && c !== 'e') continue;
    enemies++;
    near = Math.min(near, Math.abs(x - sx) + Math.abs(y - sy));
    if (seen.has(y * 60 + x)) continue;
    const cells = [[x, y]], id = pockets.length;
    seen.set(y * 60 + x, id);
    for (let i = 0; i < cells.length; i++) {
      const [cx, cy] = cells[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = get(nx, ny), k = ny * 60 + nx;
        if (seen.has(k) || (n !== ' ' && n !== 'S' && n !== 'e')) continue;
        seen.set(k, id); cells.push([nx, ny]);
      }
    }
    pockets.push(cells);
  }
  const room = pockets.length ? Math.min(...pockets.map(p => p.length)) : Infinity;
  return { enemies, room, near, pockets, start: [sx, sy] };
}
const main = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === (await import('node:path')).resolve(process.argv[1]).toLowerCase();
if (main) {
  let bad = 0, total = 0;
  for (const f of readdirSync(DIR).sort()) {
    const num = parseInt(f, 10);
    if (!(num >= FIRST && num <= LAST)) continue;
    const body = readFileSync(join(DIR, f), 'utf8').split('\n---\n')[1];
    if (!body) continue;
    const r = enemyReport(body.trimEnd().split('\n'));
    const ok = r.room >= ROOM && r.near >= FAR;
    total++; if (!ok) bad++;
    if (all || !ok) console.log(`${ok ? 'ok  ' : 'BAD '} ${num} ${f.slice(4, -4).padEnd(22)} enemies ${String(r.enemies).padStart(2)}  smallest pocket ${r.room === Infinity ? '-' : r.room}  nearest to start ${r.near === Infinity ? '-' : r.near}`);
  }
  console.log(`${bad} of ${total} floors have an enemy in a pocket under ${ROOM} cells or under ${FAR} steps from the start`);
}
