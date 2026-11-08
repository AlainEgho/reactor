// Smoke-tests the engine against a player's own LEVELS.DAT. The file is read from the path given and
// is never copied; only counts and level numbers are printed.
// Usage: node tests/original-levels.mjs "C:\path\to\LEVELS.DAT"
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const path = process.argv[2];
if (!path) { console.error('Pass the path to LEVELS.DAT'); process.exit(2); }
const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'play.html'), 'utf8');
const src = html.slice(html.indexOf('// ENGINE-START'), html.indexOf('// ENGINE-END'));
const E = new Function(src + '\nreturn {createGame,step,at,parseDat,DX,DY,T:{EMPTY,BASE,INFO,RED,EXIT,PORT,MURPHY}};')();
const { T } = E;

const levels = E.parseDat(new Uint8Array(readFileSync(path)));
console.log(`Parsed ${levels.length} levels`);

const bad = [], noExit = [], diedIdle = [], gravity = [], won = [];
// Greedy walker: nearest reachable Infotron, then the Exit. Ignores danger and puzzles, so a win only
// shows that the open route works with these rules; a loss says nothing about the level.
function greedy(g) {
  const want = g.got >= g.need ? T.EXIT : T.INFO;
  const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || (c.t === T.EXIT && g.got >= g.need);
  const start = g.m.y * g.W + g.m.x, first = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift();
    if (k !== start && g.cells[k].t === want) return first.get(k);
    const x = k % g.W, y = (k / g.W) | 0;
    for (let d = 0; d < 4; d++) {
      let nx = x + E.DX[d], ny = y + E.DY[d], c = E.at(g, nx, ny);
      if (c.t === T.PORT) { if (!(c.d & (1 << d))) continue; nx += E.DX[d]; ny += E.DY[d]; c = E.at(g, nx, ny); if (c.t !== T.EMPTY && c.t !== T.BASE) continue; }
      else if (!pass(c)) continue;
      const nk = ny * g.W + nx;
      if (first.has(nk)) continue;
      first.set(nk, k === start ? d : first.get(k)); q.push(nk);
    }
  }
  return -1;
}
levels.forEach((lv, i) => {
  const n = i + 1;
  let g;
  try { g = E.createGame(lv); } catch (e) { bad.push(`${n} (${e.message})`); return; }
  if (!g.cells.some(c => c.t === T.EXIT)) noExit.push(n);
  if (g.usesGrav) gravity.push(n);
  const idle = E.createGame(lv);
  for (let t = 0; t < 80; t++) E.step(idle, { dir: -1, act: false });
  if (idle.state !== 'play') diedIdle.push(n);
  let stalled = 0;
  for (let t = 0; t < 6000 && g.state === 'play' && stalled < 60; t++) {
    const d = greedy(g); stalled = d < 0 ? stalled + 1 : 0;
    E.step(g, { dir: d, act: false });
  }
  if (g.state === 'won') won.push(n);
});
const list = a => a.length ? a.join(', ') : 'none';
console.log(`Failed to load:            ${list(bad)}`);
console.log(`No Exit tile:              ${list(noExit)}`);
console.log(`Murphy dies standing still: ${list(diedIdle)}`);
console.log(`Use gravity:               ${gravity.length} levels`);
console.log(`Finished by greedy walker: ${won.length} of ${levels.length}`);
process.exit(bad.length ? 1 : 0);
