// A search-based player that runs on the real engine. From the current state it breadth-first searches
// action sequences (move, wait, snap, drop a red disk) for the nearest state where Murphy has one more
// Infotron, or has left through the Exit, then commits that sequence and repeats.
// It proves a level can be won; it does not prove a human will find the route.
export function makeSolver(E) {
  const { step, T } = E;
  const ACTIONS = [
    [{ dir: 0, act: false }], [{ dir: 1, act: false }], [{ dir: 2, act: false }], [{ dir: 3, act: false }],
    [{ dir: -1, act: false }],
    [{ dir: 0, act: true }], [{ dir: 1, act: true }], [{ dir: 2, act: true }], [{ dir: 3, act: true }],
    [{ dir: -1, act: true }, { dir: -1, act: true }],
    'settle'
  ];
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
  function clone(g) {
    const c = Object.assign({}, g);
    c.cells = g.cells.map(x => Object.assign({}, x));
    c.pending = g.pending.map(p => Object.assign({}, p));
    c.events = [];
    c.m = Object.assign({}, g.m);
    return c;
  }
  // The search key: Murphy, inventory, every object that can move or tick, and the empty-cell count
  // (so eaten Base counts). Enemies are left out and replaced by the tick phase, which keeps the
  // search finite; that can skip some routes, but any route it does return was really played.
  const MOVABLE = new Set([T.ZONK, T.INFO, T.ORANGE, T.YELLOW, T.RED]);
  // 'coarse' tracks only Murphy and the clock; 'fine' adds every movable object and every timer.
  function key(g, phases, mode) {
    const base = `${g.m.x},${g.m.y},${g.got},${g.red},${g.grav ? 1 : 0},${phases > 1 ? g.tick % phases : 0}`;
    if (mode === 'coarse') return base;
    let h = 0;
    for (let i = 0; i < g.cells.length; i++) {
      const c = g.cells[i], t = c.t;
      if (MOVABLE.has(t)) h = (Math.imul(h, 31) + i * 7 + t) | 0;
      else if (t === T.EXPL || t === T.BOMB) h = (Math.imul(h, 31) + i * 13 + c.timer) | 0;
    }
    return `${base},${g.m.bomb},${g.pending.length},${h}`;
  }
  const SNAPPABLE = new Set([T.BASE, T.BUG, T.INFO, T.RED, T.TERM]);
  // Finds the shortest action list that raises `got` (or wins). Returns null when none is found.
  // Cheapest try first: walk the plain shortest path to the nearest Infotron (or the open Exit),
  // simulate it on a copy, and keep it only if Murphy survives and gets there.
  function direct(g0, banned) {
    const want = g0.got >= g0.need ? T.EXIT : T.INFO;
    const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || (c.t === T.EXIT && g0.got >= g0.need);
    const start = g0.m.y * g0.W + g0.m.x, first = new Map([[start, -1]]), prev = new Map([[start, -1]]), q = [start];
    let end = -1;
    while (q.length) {
      const k = q.shift();
      if (k !== start && g0.cells[k].t === want) { end = k; break; }
      const x = k % g0.W, y = (k / g0.W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g0.W + nx;
        if (prev.has(nk) || !pass(E.at(g0, nx, ny))) continue;
        prev.set(nk, k); first.set(nk, d); q.push(nk);
      }
    }
    if (end < 0) return null;
    const dirs = [];
    for (let k = end; k !== start; k = prev.get(k)) dirs.unshift(first.get(k));
    const g = clone(g0), path = [];
    for (const d of dirs) {
      const inp = { dir: d, act: false };
      step(g, inp); path.push(inp);
      if (g.state === 'dead') return null;
      if (g.state === 'won' || g.got > g0.got) return banned && banned.has(outcome(g)) ? null : path;
    }
    return null;
  }
  function search(g0, opts = {}) {
    const banned = opts.banned;
    return direct(g0, banned) || searchWith(g0, 'coarse', opts.coarseNodes || 40000, banned) ||
      searchWith(g0, 'fine', 150000, banned) || searchWith(g0, 'fine', opts.maxNodes || 600000, banned);
  }
  function searchWith(g0, mode, maxNodes, banned) {
    const goal = g => (g.state === 'won' || (g.state === 'play' && g.got > g0.got)) && !(banned && banned.has(outcome(g)));
    const lively = g0.cells.some(c => c.t === T.SNIK || c.t === T.ELEC || c.t === T.BUG);
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
            if (a.dir >= 0) {
              const t = E.at(g, g.m.x + E.DX[a.dir], g.m.y + E.DY[a.dir]).t;
              if (t === T.HARD || t === T.INVIS) continue;
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
    while (stack.length && backtracks < (opts.maxBacktracks || 120)) {
      const top = stack[stack.length - 1];
      if (top.g.state === 'won') { best = top.g; break; }
      const plan = search(top.g, Object.assign({}, opts, { banned: top.banned }));
      if (!plan) { stack.pop(); backtracks++; continue; }
      const n = clone(top.g);
      for (const inp of plan) step(n, inp);
      top.banned.add(outcome(n));
      stack.push({ g: n, banned: new Set() });
      if (n.got > best.got || n.state === 'won') best = n;
    }
    return { state: best.state, got: best.got, need: best.need, ticks: best.tick, backtracks };
  }
  function outcome(g) { return `${g.state}|${key(g, 1, 'fine')}`; }
  function solve(level, opts = {}) { return play(E.createGame(level), opts); }
  return { solve, play, search };
}
