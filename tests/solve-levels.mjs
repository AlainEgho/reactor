// Runs the search player over the remake levels and fails if any level cannot be won.
// Levels whose first Infotron sits behind a long setup (push disks, drop bombs) get a short scripted
// setup first; the search player then has to finish the level on its own.
// Usage: node tests/solve-levels.mjs [first-level-number] [last-level-number]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeSolver } from './solver.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'play.html'), 'utf8');
const src = html.slice(html.indexOf('// ENGINE-START'), html.indexOf('// ENGINE-END'));
const E = new Function(src + `
return {createGame,step,at,LEVELS,DX,DY,BOMB_FUSE,BOMB_HOLD,beamCells,LASER_CYCLE,LASER_ON,
  T:{EMPTY,BASE,HARD,RAM,ZONK,INFO,MURPHY,EXIT,SNIK,ELEC,BUG,ORANGE,YELLOW,RED,TERM,PORT,EXPL,BOMB,INVIS,
     JET,TRACT,STASIS,TELE,DOOR,KEY,LASER,DRONE,ROD,SHIELD,
     ICE,CONV,MAGNET,MIRROR,SWITCH,GATE,CRATE,ALPHA,ACID,FUSE,BURN,COOL,HYDRO,ANTI,FALLOUT,IODINE,PLUT,ISO,NGUN,QTUN,TANK,LAMP}};`)();
const { T } = E;
const { play } = makeSolver(E);

const U = 0, R = 1, D = 2, L = 3;
const idle = { dir: -1, act: false };
const PICKUP = new Set([T.JET, T.TRACT, T.STASIS, T.KEY, T.SHIELD, T.ROD, T.IODINE, T.NGUN, T.QTUN, T.TANK, T.LAMP]);
// Walks a shortest path over open tiles (no pushing); throws if Murphy dies or no path exists.
function goto(g, tx, ty) {
  const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || c.t === T.FUSE || c.t === T.ISO || c.t === T.FALLOUT || PICKUP.has(c.t);
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
const useGad = (g, dir) => { E.step(g, { dir, act: false, gad: true }); E.step(g, idle); };
const bomb = (g, awayX, awayY) => { for (let i = 0; i < E.BOMB_HOLD; i++) E.step(g, { dir: -1, act: true }); goto(g, awayX, awayY); wait(g, E.BOMB_FUSE + 8); };
// A copy of the game, made the way the solver makes one, so a timed move can be tried before it is played.
const clone = g => Object.assign({}, g, { cells: g.cells.map(c => Object.assign({}, c)), pending: g.pending.map(p => Object.assign({}, p)), events: [], m: Object.assign({}, g.m), gadget: g.gadget ? Object.assign({}, g.gadget) : null });
// Plays `act` on a copy after 0, 1, 2... idle ticks, and on the real game after the first wait where
// done(copy) holds. For moves that only work with an enemy in the right place.
function timed(g, act, done) {
  for (let w = 0; w < 64; w++) {
    const c = clone(g);
    act(c);
    if (c.state === 'play' && done(c)) { act(g); return; }
    wait(g, 1);
  }
  throw new Error(`no wait worked at ${g.m.x},${g.m.y}`);
}

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
  // Nudge the left ball into the magnet's field and let it drop on the canister; the search does the rest.
  'Field Lines': g => {
    goto(g, 3, 3); move(g, R, 2); wait(g, 14);
    goto(g, 19, 3); move(g, L, 2); wait(g, 14);
  },
  // Throw the switch by the start first, so the Reactor's gate stands open for the rest of the run.
  'Physics Finals': g => { goto(g, 10, 19); move(g, D); move(g, U); },
  // Tunnel into the first switch room, throw it, tunnel out: every gate then stands open.
  'Quantum Leap': g => { goto(g, 3, 3); goto(g, 5, 6); useGad(g, R); move(g, R); useGad(g, L); },
  // Each lane: take the gun, open the plug, then fire whenever the first thing down the lane is a Cask or the Neutron.
  'Firing Range': g => {
    for (const y of [4, 8, 12, 16, 20]) {
      goto(g, 4, y); move(g, R); E.step(g, { dir: R, act: true });
      for (let t = 0; t < 300 && g.gadget && g.state === 'play'; t++) {
        let x = g.m.x + 1; while (E.at(g, x, y).t === T.EMPTY) x++;
        const hit = E.at(g, x, y).t;
        if (hit === T.RAM || hit === T.ELEC) useGad(g, R); else wait(g, 1);
      }
      wait(g, 8);
    }
  },
  // Throw the switch: the Reactor room's gate opens. The Quantum tunnel waits inside it for the concrete behind.
  'Event Horizon': g => { goto(g, 38, 11); move(g, D); move(g, U); },
  // Each gallery: dig the plug and put one neutron through the cask at the far end; the Neutron behind it splits.
  'Spallation': g => {
    const gallery = y => { goto(g, 5, y); move(g, R); useGad(g, R); wait(g, 10); };
    goto(g, 3, 5); gallery(3); gallery(7); goto(g, 3, 13); gallery(11); gallery(15); goto(g, 3, 21); gallery(19);
  },
  // At each cage: stand beside the plug under the Lead, snap it when the Gamma is where the ball will
  // land on it, and back off two cells up. Played only once the cage's left wall is broken.
  'Bang': g => {
    for (const [p, py] of [[6, 4], [20, 4], [34, 4], [48, 4], [9, 14], [23, 14], [37, 14], [51, 14]]) {
      goto(g, p + 1, py - 3); goto(g, p + 1, py - 1); // from straight above: a cell dug over the pocket lets the Gamma out
      timed(g, c => { E.step(c, { dir: L, act: true }); move(c, R); move(c, U, 2); wait(c, 20); },
        c => [0, 1, 2].some(j => E.at(c, p + 1, py + j).t !== T.RAM));
    }
  },
  // Pick up all seven canisters, then one in the middle of each gap between two capsules (dug from
  // above, backed off up the same shaft), and the last one on top of the Reactor's seal.
  'Demolition Count': g => {
    for (const [x, y] of [[3, 9], [20, 8], [37, 10], [55, 2], [52, 9], [35, 20], [16, 19]]) goto(g, x, y);
    for (const [x, y] of [[8, 12], [5, 4], [23, 3], [41, 5], [44, 14], [27, 13]]) {
      goto(g, x + 3, y - 2); goto(g, x + 3, y + 1); bomb(g, x + 3, y - 2);
    }
    goto(g, 57, 19); goto(g, 57, 20); bomb(g, 57, 17);
  },
  // Room by room: in through the airlock, push the yellow canister right until it sits against the cage,
  // out again. Then the Terminal, far from every canister.
  'Terminal': g => {
    [[3, 3], [17, 3], [31, 3], [45, 3], [3, 13], [17, 13], [31, 13], [45, 13]].forEach(([x, y], i) => {
      const yy = y + (i & 1 ? 2 : 4);
      goto(g, x - 1, y + 3); move(g, R); goto(g, x + 2, yy);
      for (let n = 0; n < 12 && E.at(g, x + 5, yy).t !== T.YELLOW; n++) move(g, R);
      if (E.at(g, x + 5, yy).t !== T.YELLOW) throw new Error(`canister in room ${x},${y} did not reach the cage`);
      goto(g, x + 1, y + 3); move(g, L);
    });
    goto(g, 28, 21); move(g, R); wait(g, 12);
  },
  // Pick up the canisters, then at every tube: into the Graphite corner beside the end Neutron, a
  // canister there, and away while the chain runs down the tube.
  'Chain Reaction': g => {
    for (const [x, y] of [[2, 7], [24, 6], [20, 14], [3, 21], [50, 20], [52, 12], [48, 4]]) goto(g, x, y);
    for (const [x, y, ax, ay] of [[4, 4, 2, 1], [30, 3, 26, 2], [8, 10, 4, 9], [28, 11, 24, 10], [44, 8, 40, 7], [5, 17, 3, 14], [27, 18, 23, 17]]) {
      goto(g, x - 2, y - 1); move(g, R); bomb(g, ax, ay);
    }
  },
  // Spend the first keycard on the Reactor's own door, as the hint says: down the west edge across the
  // Gamma corridor, the card at the foot of the floor, then the door from above. The search has the
  // other four cards for the vaults.
  // Straight runs only, so the walk never digs under Lead: the west edge, the bottom row, the east edge.
  'Keymaster': g => {
    goto(g, 1, 10);
    timed(g, c => move(c, D, 2), c => c.m.y === 12);
    goto(g, 1, 22); goto(g, 40, 22); move(g, U); move(g, D);
    goto(g, 57, 22); goto(g, 57, 14); goto(g, 52, 14); move(g, D); move(g, U);
  },
  // Every bunker sits two cells off a vein: bomb on the vein beside it, back off up the vein.
  'Bunker': g => {
    for (const x of [8, 20, 32, 44, 56]) {
      goto(g, x, 2);
      for (const y of [4, 8, 14, 18]) { goto(g, x, y); bomb(g, x, y - 2); }
    }
  }
};

const most = process.argv.includes('--most'), ladder = process.argv.includes('--ladder');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const from = +(args[0] || 1), to = +(args[1] || E.LEVELS.length);
// --ladder: like --most, but plays longer and keeps the state each time the Pellet count rises. Then,
// from the highest rung down (at most eight tries), the need is set to that rung's count and the player
// walks to the Reactor; the first rung that wins is the proven count, printed as "took" on a "won" line
// (never above the level's own need: a level that gives up its need is proven as it stands).
if (ladder) {
  for (let i = from - 1; i < Math.min(to, E.LEVELS.length); i++) {
    const lv = E.LEVELS[i], t0 = Date.now(), rungs = [];
    const fresh = () => {
      const g = E.createGame(Object.assign({}, lv, { need: 9999 }));
      try { if (SETUP[lv.name]) SETUP[lv.name](g); } catch (e) { /* the search starts from wherever the setup got to */ }
      return g;
    };
    rungs.push(fresh());
    const ENOUGH = new Error('enough'); // collecting stops once the level's own need is in hand
    try {
      play(fresh(), { timeLimit: 240 * 1000, maxBacktracks: 40, onBest: s => { rungs.push(s); if (s.got >= lv.need) throw ENOUGH; } });
    } catch (e) { if (e !== ENOUGH) throw e; }
    const byGot = new Map();
    for (const s of rungs) if (s.state === 'play') byGot.set(Math.min(s.got, lv.need), s);
    const tops = [...byGot.keys()].sort((a, b) => b - a);
    const tries = tops.length <= 8 ? tops : tops.filter((_, k) => k % Math.ceil(tops.length / 8) === 0);
    let proven = -1;
    for (const k of tries) {
      const s = byGot.get(k);
      s.need = k;
      if (play(s, { timeLimit: 60 * 1000 }).state === 'won') { proven = k; break; }
    }
    console.log(`most ${String(i + 1).padStart(3, '0')} ${lv.name.padEnd(20)} need ${lv.need} took ${Math.max(proven, 0)} ${proven >= 0 ? 'won' : 'stuck'} rungs ${tops.length} top ${tops[0]} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  process.exit(0);
}
// --most: how many Pellets each level gives up. Plays with an unreachable need until the player is
// stuck, then sets the need to what it took and walks to the Reactor, so the count printed is proven.
if (most) {
  for (let i = from - 1; i < Math.min(to, E.LEVELS.length); i++) {
    const lv = E.LEVELS[i], t0 = Date.now();
    const g = E.createGame(Object.assign({}, lv, { need: 9999 }));
    try { if (SETUP[lv.name]) SETUP[lv.name](g); } catch (e) { /* the search starts from wherever the setup got to */ }
    const r = play(g, { timeLimit: 90 * 1000, maxBacktracks: 8 });
    const end = r.game;
    end.need = r.got;
    const w = play(end, { timeLimit: 120 * 1000 });
    console.log(`most ${String(i + 1).padStart(3, '0')} ${lv.name.padEnd(20)} need ${lv.need} took ${r.got} ${w.state === 'won' ? 'won' : 'stuck'} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  process.exit(0);
}
let failed = 0;
for (let i = from - 1; i < Math.min(to, E.LEVELS.length); i++) {
  const lv = E.LEVELS[i], t0 = Date.now();
  const g = E.createGame(lv);
  let note = '';
  try { if (SETUP[lv.name]) { SETUP[lv.name](g); note = ' (scripted setup)'; } } catch (e) { note = ' (setup failed: ' + e.message + ')'; }
  const r = play(g, { timeLimit: 8 * 60 * 1000 }); // eight minutes a level, then it counts as unproven
  const ok = r.state === 'won';
  if (!ok) failed++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${String(i + 1).padStart(3, '0')} ${lv.name.padEnd(20)} ${r.state.padEnd(5)} ${r.got}/${r.need}  ${r.ticks} ticks  ${((Date.now() - t0) / 1000).toFixed(1)}s${note}`);
}
process.exit(failed ? 1 : 0);
