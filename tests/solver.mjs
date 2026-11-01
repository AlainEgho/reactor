// A search-based player that runs on the real engine. From the current state it breadth-first searches
// action sequences (move, wait, snap, drop a red disk, use the gadget) for the nearest state where
// Murphy has one more Infotron, or has left through the Exit, then commits that sequence and repeats.
// It proves a level can be won; it does not prove a human will find the route.
export function makeSolver(E) {
  const { step, T } = E;
  const ACTIONS = [
    [{ dir: 0, act: false }], [{ dir: 1, act: false }], [{ dir: 2, act: false }], [{ dir: 3, act: false }],
    [{ dir: -1, act: false }],
    [{ dir: 0, act: true }], [{ dir: 1, act: true }], [{ dir: 2, act: true }], [{ dir: 3, act: true }],
    [{ dir: -1, act: true }, { dir: -1, act: true }],
    // The gadget: one press (Shift held for a tick, then released by the next action).
    [{ dir: 0, act: false, gad: true }], [{ dir: 1, act: false, gad: true }], [{ dir: 2, act: false, gad: true }], [{ dir: 3, act: false, gad: true }],
    [{ dir: -1, act: false, gad: true }],
    'settle'
  ];
  const PICKUP = new Set([T.JET, T.TRACT, T.STASIS, T.KEY, T.SHIELD, T.ROD, T.IODINE, T.NGUN, T.QTUN, T.TANK, T.LAMP]);
  // Cells Murphy walks straight through (floors, fuses, isotope pellets) besides the classic ones.
  const WALK = new Set([T.ICE, T.FALLOUT, T.FUSE, T.ISO]);
  // Waits until no bomb, explosion, pending blast or falling object is left (at most 40 ticks).
  function busy(g) {
    if (g.pending.length || g.m.bomb > 0) return true;
    return g.cells.some(c => c.t === T.EXPL || c.t === T.BOMB || c.f);
  }
  function settle(g) {
    const out = [];
    for (let i = 0; i < 40 && g.state === 'play' && busy(g); i++) { const inp = { dir: -1, act: false }; step(g, inp); out.push(inp); }
    return out;
  }
  // Every cell a laser's beam can reach once the Base in its way is eaten. The engine's beam stops at
  // Base, but a path that eats it lengthens the lane under Murphy's feet, so plans treat Base as clear.
  function beamReach(g, x, y, c) {
    const out = [];
    for (const s of [-1, 1]) {
      let bx = x, by = y, dx = c.d ? 0 : s, dy = c.d ? s : 0;
      for (let n = 0; n < g.W + g.H; n++) {
        bx += dx; by += dy;
        const cc = E.at(g, bx, by), t = cc.t;
        if (t === T.MIRROR) { const ndx = cc.d ? dy : -dy, ndy = cc.d ? dx : -dx; dx = ndx; dy = ndy; continue; }
        if (t !== T.EMPTY && t !== T.BASE && t !== T.MURPHY) break;
        out.push({ x: bx, y: by });
      }
    }
    return out;
  }
  function clone(g) {
    const c = Object.assign({}, g);
    c.cells = g.cells.map(x => Object.assign({}, x));
    c.pending = g.pending.map(p => Object.assign({}, p));
    c.events = [];
    c.m = Object.assign({}, g.m);
    c.gadget = g.gadget ? Object.assign({}, g.gadget) : null; // charges are spent per branch, not shared
    return c;
  }
  // The search key: Murphy, inventory, every object that can move or tick, and the empty-cell count
  // (so eaten Base counts). Enemies are left out and replaced by the tick phase, which keeps the
  // search finite; that can skip some routes, but any route it does return was really played.
  const MOVABLE = new Set([T.ZONK, T.INFO, T.ORANGE, T.YELLOW, T.RED, T.ROD, T.PLUT, T.ISO, T.ANTI, T.CRATE, T.MIRROR, T.HYDRO, T.COOL, T.ACID, T.FUSE, ...PICKUP]);
  // 'coarse' tracks only Murphy and the clock; 'fine' adds every movable object and every timer.
  // Gate flips, the ice slide, the dose band and the air left are part of Murphy's own state.
  function key(g, phases, mode) {
    const gad = g.gadget ? `${g.gadget.k}:${g.gadget.n}` : '';
    const base = `${g.m.x},${g.m.y},${g.got},${g.red},${g.grav ? 1 : 0},${phases > 1 ? g.tick % phases : 0},${gad},${g.keys},${g.shield ? 1 : 0},${g.stasis},` +
      `${g.gateFlips & 1},${g.slide},${g.dose >> 3},${g.iodine > 0 ? 1 : 0},${g.usesAir ? g.air >> 5 : 0},${g.pushTicks}`; // a half-done push is a state of its own
    if (mode === 'coarse') return base;
    let h = 0;
    for (let i = 0; i < g.cells.length; i++) {
      const c = g.cells[i], t = c.t;
      if (MOVABLE.has(t)) h = (Math.imul(h, 31) + i * 7 + t) | 0;
      else if (t === T.EXPL || t === T.BOMB || t === T.BURN) h = (Math.imul(h, 31) + i * 13 + c.timer) | 0;
      else if (t === T.GATE) h = (Math.imul(h, 31) + i * 17 + c.d) | 0;
    }
    return `${base},${g.m.bomb},${g.pending.length},${h}`;
  }
  const SNAPPABLE = new Set([T.BASE, T.BUG, T.INFO, T.RED, T.TERM, T.FUSE, T.ISO, T.ANTI, ...PICKUP]);
  // Finds the shortest action list that raises `got` (or wins). Returns null when none is found.
  // Cheapest try first: walk the plain shortest path to the nearest Infotron (or the open Exit),
  // simulate it on a copy, and keep it only if Murphy survives and gets there.
  // First with a wide berth round every enemy, then without.
  // A tunnel hop is only planned when no plain walk reaches the goal, so charges are kept for the walls that need them.
  function direct(g0, banned) {
    return directWith(g0, banned, true, false) || directWith(g0, banned, true, true) ||
      directWith(g0, banned, false, false) || directWith(g0, banned, false, true);
  }
  function directWith(g0, banned, careful, hops) {
    const want = g0.got >= g0.need ? T.EXIT : T.INFO;
    const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || PICKUP.has(c.t) || WALK.has(c.t) || (c.t === T.EXIT && g0.got >= g0.need);
    const danger = new Set();
    if (careful) for (let i = 0; i < g0.cells.length; i++) {
      const t = g0.cells[i].t;
      if (t !== T.SNIK && t !== T.DRONE && t !== T.ALPHA && t !== T.ELEC) continue;
      const ex = i % g0.W, ey = (i / g0.W) | 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) danger.add((ey + dy) * g0.W + ex + dx);
    }
    // Careful also keeps out of every laser lane, whatever the phase.
    if (careful) for (let i = 0; i < g0.cells.length; i++) {
      if (g0.cells[i].t !== T.LASER) continue;
      for (const b of beamReach(g0, i % g0.W, (i / g0.W) | 0, g0.cells[i])) danger.add(b.y * g0.W + b.x);
    }
    // Nodes are cell + tunnel*N, where tunnel says what the one Quantum tunnel hop the path may take is
    // worth: 0 no tunnel in hand, 1 in hand and unspent, 2 spent. A Quantum tunnel on the path is picked
    // up (another gadget on the path would replace it). A move recorded as d+4 is the hop (Shift + d
    // through one solid cell).
    const N = g0.W * g0.H, holding = g0.gadget && g0.gadget.k === T.QTUN && g0.gadget.n > 0, canHop = hops; // a tunnel picked up on the way counts too
    const landing = c => c.t === T.EMPTY || c.t === T.BASE || WALK.has(c.t) || (c.t === T.EXIT && want === T.EXIT);
    const start = g0.m.y * g0.W + g0.m.x + (holding ? N : 0), first = new Map([[start, -1]]), prev = new Map([[start, -1]]), q = [start];
    let end = -1;
    while (q.length) {
      const node = q.shift(), k = node % N, tunnel = (node / N) | 0;
      if (node !== start && (g0.cells[k].t === want || (want === T.INFO && g0.cells[k].t === T.ISO))) { end = node; break; }
      const x = k % g0.W, y = (k / g0.W) | 0;
      for (let d = 0; d < 4; d++) {
        let nx = x + E.DX[d], ny = y + E.DY[d], c = E.at(g0, nx, ny), move = d, next = tunnel;
        if (danger.has(ny * g0.W + nx) && !(c.t === want)) continue;
        // An open gate or a port in the right direction is a hop to the cell beyond.
        if ((c.t === T.GATE && c.d) || (c.t === T.PORT && (c.d & (1 << d)))) { nx += E.DX[d]; ny += E.DY[d]; c = E.at(g0, nx, ny); if (!landing(c)) continue; }
        else if (!pass(c)) {
          // Solid: with a Quantum tunnel in hand and its hop unspent, go through it when there is room beyond.
          if (tunnel !== 1 || !canHop || c.t === T.MURPHY || nx <= 0 || ny <= 0 || nx >= g0.W - 1 || ny >= g0.H - 1) continue;
          nx += E.DX[d]; ny += E.DY[d]; c = E.at(g0, nx, ny);
          if (!landing(c)) continue;
          const hk = ny * g0.W + nx + 2 * N;
          if (prev.has(hk)) continue;
          prev.set(hk, node); first.set(hk, d + 4); q.push(hk);
          continue;
        }
        else if (c.t === T.QTUN) next = 1;
        else if (c.t === T.JET || c.t === T.TRACT || c.t === T.STASIS || c.t === T.NGUN) { if (tunnel === 1) continue; } // never trade an unspent tunnel away
        else if (c.t === T.ICE) {
          // A step onto ice is a slide: follow it to where the engine would stop, and take any goal
          // it crosses on the way as the end of the path (the replay returns as soon as it is reached).
          let hit = false;
          for (;;) {
            const mx = nx + E.DX[d], my = ny + E.DY[d], m = E.at(g0, mx, my), here = E.at(g0, nx, ny).t;
            if (!(here === T.ICE || m.t === T.ICE)) break;
            const goal = m.t === want || (want === T.INFO && m.t === T.ISO);
            if (!(m.t === T.EMPTY || m.t === T.ICE || m.t === T.FALLOUT || m.t === T.INFO || m.t === T.ISO || PICKUP.has(m.t) || goal)) break;
            nx = mx; ny = my;
            if (goal) { hit = true; break; }
          }
          const hn = ny * g0.W + nx + tunnel * N;
          if (hit && !prev.has(hn)) { prev.set(hn, node); first.set(hn, d); end = hn; q.length = 0; break; }
        }
        const nk = ny * g0.W + nx + next * N;
        if (prev.has(nk)) continue;
        prev.set(nk, node); first.set(nk, move); q.push(nk);
      }
    }
    if (end < 0) return null;
    const dirs = [];
    for (let k = end; k !== start; k = prev.get(k)) dirs.unshift(first.get(k));
    // Which emitters light each cell, so the replay can wait at the edge of a lane for a dark spell
    // long enough to cover the whole stretch of lane the path then runs along.
    const lanes = new Map();
    for (let i = 0; i < g0.cells.length; i++) {
      if (g0.cells[i].t !== T.LASER) continue;
      for (const b of beamReach(g0, i % g0.W, (i / g0.W) | 0, g0.cells[i])) { const k = b.y * g0.W + b.x; if (!lanes.has(k)) lanes.set(k, []); lanes.get(k).push(g0.cells[i]); }
    }
    const CYCLE = E.LASER_CYCLE || 32, ON = E.LASER_ON || 8;
    const darkAhead = (i, gg) => {
      const ems = new Set();
      let n = 0, x = gg.m.x, y = gg.m.y;
      for (let j = i; j < dirs.length; j++) {
        const dj = dirs[j], s = dj >= 4 ? 2 : 1, dd = dj >= 4 ? dj - 4 : dj;
        x += E.DX[dd] * s; y += E.DY[dd] * s;
        const k = y * g0.W + x;
        if (!lanes.has(k)) break;
        n++; for (const c of lanes.get(k)) ems.add(c);
      }
      for (const c of ems) for (let m = 1; m <= n + 1; m++) if ((gg.tick + m + c.phase) % CYCLE < ON) return false;
      return true;
    };
    const g = clone(g0), path = [];
    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      const inp = d >= 4 ? { dir: d - 4, act: false, gad: true } : { dir: d, act: false };
      const steps = d >= 4 ? 2 : 1, tx = g.m.x + E.DX[inp.dir] * steps, ty = g.m.y + E.DY[inp.dir] * steps, tk = ty * g0.W + tx;
      if (lanes.has(tk) && !lanes.has(g.m.y * g0.W + g.m.x)) for (let w = 0; w < CYCLE && !darkAhead(i, g) && g.state === 'play'; w++) { step(g, idleInp); path.push(idleInp); }
      step(g, inp); path.push(inp);
      if (d >= 4) { step(g, idleInp); path.push(idleInp); } // let go of Shift
      // A slide runs on by itself; wait it out before the next input.
      while (g.slide >= 0 && g.state === 'play' && !(g.got > g0.got)) { step(g, idleInp); path.push(idleInp); }
      if (g.state === 'dead') return null;
      if (g.state === 'won' || g.got > g0.got) return banned && banned.has(outcome(g)) ? null : path;
    }
    return null;
  }
  const idleInp = { dir: -1, act: false };
  function search(g0, opts = {}) {
    const banned = opts.banned;
    return direct(g0, banned) || searchWith(g0, 'coarse', opts.coarseNodes || 40000, banned) ||
      searchWith(g0, 'fine', 150000, banned) || searchWith(g0, 'fine', opts.maxNodes || 600000, banned);
  }
  function searchWith(g0, mode, maxNodes, banned) {
    const goal = g => (g.state === 'won' || (g.state === 'play' && g.got > g0.got)) && !(banned && banned.has(outcome(g)));
    const lively = g0.cells.some(c => c.t === T.SNIK || c.t === T.ELEC || c.t === T.BUG || c.t === T.DRONE || c.t === T.LASER ||
      c.t === T.ALPHA || c.t === T.CONV || c.t === T.MAGNET || c.t === T.COOL || c.t === T.HYDRO || c.t === T.BURN);
    const phases = lively ? 32 : 1;
    const seen = new Set([key(g0, phases, mode)]);
    let frontier = [{ g: g0, path: [] }], nodes = 0;
    while (frontier.length && nodes < maxNodes) {
      const next = [];
      for (const { g, path } of frontier) {
        for (const seq of ACTIONS) {
          let n, done;
          if (seq === 'settle') {
            if (!busy(g)) continue;
            n = clone(g); done = settle(n);
          } else {
            const a = seq[0];
            if (a.act && a.dir < 0 && g.red === 0) continue;
            if (a.gad && (!g.gadget || (a.dir < 0) !== (g.gadget.k === T.STASIS))) continue;
            if (a.gad && g.gadget.k === T.QTUN && g.gadget.n <= 1) continue; // the last tunnel charge is kept for a planned path
            if (a.dir >= 0 && !a.gad) {
              const t = E.at(g, g.m.x + E.DX[a.dir], g.m.y + E.DY[a.dir]).t;
              if (t === T.HARD || t === T.INVIS) continue;
              // A Quantum tunnel in hand is kept for the wall it is meant for: no other gadget replaces it.
              if (g.gadget && g.gadget.k === T.QTUN && (t === T.JET || t === T.TRACT || t === T.STASIS || t === T.NGUN)) continue;
              if (a.act && !SNAPPABLE.has(t)) continue;
            }
            n = clone(g); done = seq;
            for (const inp of seq) step(n, inp);
          }
          nodes++;
          if (n.state === 'dead') continue;
          const p = path.concat(done);
          if (goal(n)) return p;
          const k = key(n, phases, mode);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ g: n, path: p });
        }
      }
      // Keep memory bounded: past this width the search turns into a beam over the first states.
      frontier = next.length > 3000 ? next.slice(0, 3000) : next;
    }
    return null;
  }
  // Plays on from the given state until the level is won. Each plan's outcome is pushed on a stack;
  // when no plan works from the top state, it is dropped, its outcome is banned in the parent, and the
  // parent searches again. That gets the player out of dead ends like being boxed in by Zonks.
  function play(g, opts = {}) {
    const stack = [{ g: clone(g), banned: new Set() }];
    let best = stack[0].g, backtracks = 0;
    const deadline = Date.now() + (opts.timeLimit || 1e12);
    while (stack.length && backtracks < (opts.maxBacktracks || 120) && Date.now() < deadline) {
      const top = stack[stack.length - 1];
      if (top.g.state === 'won') { best = top.g; break; }
      const plan = search(top.g, Object.assign({}, opts, { banned: top.banned }));
      if (!plan) { stack.pop(); backtracks++; continue; }
      const n = clone(top.g);
      for (const inp of plan) step(n, inp);
      top.banned.add(outcome(n));
      stack.push({ g: n, banned: new Set() });
      if (n.got > best.got || n.state === 'won') { best = n; if (opts.onBest) opts.onBest(clone(n)); }
    }
    return { state: best.state, got: best.got, need: best.need, ticks: best.tick, backtracks, x: best.m.x, y: best.m.y, game: best };
  }
  function outcome(g) { return `${g.state}|${key(g, 1, 'fine')}`; }
  function solve(level, opts = {}) { return play(E.createGame(level), opts); }
  return { solve, play, search };
}
