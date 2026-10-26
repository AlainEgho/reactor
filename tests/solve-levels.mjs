// Runs the search player over the remake levels and fails if any level cannot be won.
// Levels whose first Infotron sits behind a long setup (push disks, drop bombs) get a short scripted
// setup first; the search player then has to finish the level on its own.
// Usage: node tests/solve-levels.mjs [first-level-number] [last-level-number]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeSolver } from './solver.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('// ENGINE-START'), html.indexOf('// ENGINE-END'));
const E = new Function(src + `
return {createGame,step,at,LEVELS,DX,DY,BOMB_FUSE,
  T:{EMPTY,BASE,HARD,RAM,ZONK,INFO,MURPHY,EXIT,SNIK,ELEC,BUG,ORANGE,YELLOW,RED,TERM,PORT,EXPL,BOMB,INVIS}};`)();
const { T } = E;
const { play } = makeSolver(E);

const U = 0, R = 1, D = 2, L = 3;
const idle = { dir: -1, act: false };
// Walks a shortest path over open tiles (no pushing); throws if Murphy dies or no path exists.
function goto(g, tx, ty) {
  const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED;
  for (let t = 0; t < 500 && !(g.m.x === tx && g.m.y === ty); t++) {
    if (g.state !== 'play') throw new Error(`Murphy ${g.state} walking to ${tx},${ty}`);
    const start = g.m.y * g.W + g.m.x, goal = ty * g.W + tx, first = new Map([[start, -1]]), q = [start];
    let dir = -1;
    while (q.length) {
      const k = q.shift();
      if (k === goal) { dir = first.get(k); break; }
      const x = k % g.W, y = (k / g.W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g.W + nx;
        if (first.has(nk) || !pass(E.at(g, nx, ny))) continue;
        first.set(nk, k === start ? d : first.get(k)); q.push(nk);
      }
    }
    if (dir < 0) throw new Error(`no path to ${tx},${ty} from ${g.m.x},${g.m.y}`);
    E.step(g, { dir, act: false });
  }
}
const move = (g, dir, n = 1) => { for (let i = 0; i < n; i++) E.step(g, { dir, act: false }); };
const wait = (g, n) => { for (let i = 0; i < n; i++) E.step(g, idle); };
const bomb = (g, awayX, awayY) => { E.step(g, { dir: -1, act: true }); E.step(g, { dir: -1, act: true }); goto(g, awayX, awayY); wait(g, E.BOMB_FUSE + 8); };

const SETUP = {
  'Demolition Bay': g => {
    goto(g, 4, 1); goto(g, 8, 2); goto(g, 8, 3); bomb(g, 5, 3);
    goto(g, 18, 5); bomb(g, 15, 5);
  },
  'Blast Radius': g => {
    goto(g, 7, 2); move(g, R); wait(g, 12);
    goto(g, 37, 15); move(g, L); wait(g, 12);
    goto(g, 35, 4); goto(g, 15, 20); goto(g, 21, 9); bomb(g, 18, 9);
    goto(g, 49, 18); bomb(g, 46, 18);
  },
  'Yellow Line': g => {
    goto(g, 52, 16); move(g, U, 5);
    goto(g, 45, 18); move(g, L, 3); goto(g, 41, 19); move(g, U, 4);
    goto(g, 13, 11); move(g, R); wait(g, 12);
  },
  'Needle': g => {
    goto(g, 5, 20); goto(g, 49, 18); bomb(g, 46, 18);
  },
  'Red Tape': g => {
    goto(g, 20, 2); bomb(g, 18, 2);
    goto(g, 24, 9); bomb(g, 24, 7);
    goto(g, 45, 12); bomb(g, 43, 12);
    goto(g, 50, 4); bomb(g, 50, 6);
    goto(g, 54, 2); bomb(g, 52, 2);
  },
  // One-way ports punish the nearest-Infotron-first habit, so walk the proven route to the last Infotron.
  'Turnstile': g => {
    const route = [1, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 2, 3, 3, 2, 2, 1, 1, 3, 3, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 3, 0, 1, 1, 0, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 3, 0, 3, 0, 3, 3, 0, 0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 1, 2, 1, 2, 2, 2, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1];
    for (const d of route.slice(0, -12)) move(g, d);
  },
  // Every bunker sits two cells off a vein: bomb on the vein beside it, back off up the vein.
  'Bunker': g => {
    for (const x of [8, 20, 32, 44, 56]) {
      goto(g, x, 2);
      for (const y of [4, 8, 14, 18]) { goto(g, x, y); bomb(g, x, y - 2); }
    }
  }
};

const from = +(process.argv[2] || 1), to = +(process.argv[3] || E.LEVELS.length);
let failed = 0;
for (let i = from - 1; i < Math.min(to, E.LEVELS.length); i++) {
  const lv = E.LEVELS[i], t0 = Date.now();
  const g = E.createGame(lv);
  let note = '';
  try { if (SETUP[lv.name]) { SETUP[lv.name](g); note = ' (scripted setup)'; } } catch (e) { note = ' (setup failed: ' + e.message + ')'; }
  const r = play(g);
  const ok = r.state === 'won';
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${String(i + 1).padStart(3, '0')} ${lv.name.padEnd(20)} ${r.state.padEnd(5)} ${r.got}/${r.need}  ${r.ticks} ticks  ${((Date.now() - t0) / 1000).toFixed(1)}s${note}`);
}
process.exit(failed ? 1 : 0);
