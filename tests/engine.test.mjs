// Runs the game engine from index.html headless: level sanity, physics, and a greedy auto-player.
// Usage: node tests/engine.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('// ENGINE-START'), html.indexOf('// ENGINE-END'));
const E = new Function(src + `
return {createGame,step,at,explode,parseDat,LEVELS,DX,DY,
  T:{EMPTY,BASE,HARD,RAM,ZONK,INFO,MURPHY,EXIT,SNIK,ELEC,BUG,ORANGE,YELLOW,RED,TERM,PORT,EXPL,BOMB,INVIS},
  EXPL_TICKS,BOMB_FUSE};`)();
const { createGame, step, at, LEVELS, T } = E;

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
const idle = { dir: -1, act: false };
const run = (g, n, inp = idle) => { for (let i = 0; i < n; i++) step(g, inp); };
// Boards without a Murphy get one walled into an extra row at the bottom, out of harm's way.
const mk = (map, need = 0) => {
  if (!map.join('').includes('@')) { const w = map[0].length; map = [...map, '#@' + '#'.repeat(w - 2), '#'.repeat(w)]; }
  return createGame({ name: 'test', need, map });
};
const R = 1, L = 3, U = 0, Dn = 2;

console.log('Levels');
LEVELS.forEach((lv, i) => {
  test(`${i + 1} ${lv.name}: shape, border, one Murphy, one Exit, enough Infotrons`, () => {
    const g = createGame(lv);
    const flat = lv.map.join('');
    assert.equal((flat.match(/@/g) || []).length, 1, 'Murphy count');
    assert.equal((flat.match(/X/g) || []).length, 1, 'Exit count');
    for (let x = 0; x < g.W; x++) { assert.equal(lv.map[0][x], '#'); assert.equal(lv.map[g.H - 1][x], '#'); }
    for (let y = 0; y < g.H; y++) { assert.equal(lv.map[y][0], '#'); assert.equal(lv.map[y][g.W - 1], '#'); }
    const electronYield = (flat.match(/e/g) || []).length * 6;
    assert.ok(g.total + electronYield >= lv.need, `need ${lv.need} but only ${g.total} placed (+${electronYield} from electrons)`);
  });
  test(`${i + 1} ${lv.name}: board is stable and Murphy survives 120 idle ticks`, () => {
    const g = createGame(lv);
    const before = g.cells.map(c => c.t).join(',');
    run(g, 120);
    assert.equal(g.state, 'play');
    const movers = new Set([T.SNIK, T.ELEC, T.EMPTY]);
    const after = g.cells.map(c => c.t);
    before.split(',').map(Number).forEach((t, k) => {
      if (!movers.has(t) && !movers.has(after[k])) assert.equal(after[k], t, `tile ${k % g.W},${Math.floor(k / g.W)} changed while idle`);
    });
  });
});

console.log('Physics');
test('a falling Zonk kills Murphy', () => {
  const g = mk(['#####', '# O #', '#   #', '# @ #', '#####']);
  run(g, 3);
  assert.equal(g.state, 'dead');
});
test('a resting Zonk does not hurt Murphy under it', () => {
  const g = mk(['#####', '# O #', '# @ #', '#####']);
  run(g, 10);
  assert.equal(g.state, 'play');
});
test('a Zonk rolls off a RAM chip', () => {
  const g = mk(['#####', '# O #', '# R #', '#   #', '#####']);
  run(g, 6);
  assert.equal(at(g, 2, 1).t, T.EMPTY);
  assert.equal(at(g, 1, 3).t, T.ZONK);
});
test('a Zonk does not roll off Hardware', () => {
  const g = mk(['#####', '# O #', '#####']);
  run(g, 6);
  assert.equal(at(g, 2, 1).t, T.ZONK);
});
test('a Zonk landing on an Electron leaves Infotrons', () => {
  const g = mk(['#######', '#  O  #', '# #e# #', '#######']);
  at(g, 3, 1).f = true;
  run(g, 1);
  assert.equal(at(g, 3, 2).t, T.EXPL);
  run(g, E.EXPL_TICKS + 1);
  let infos = 0; g.cells.forEach(c => { if (c.t === T.INFO) infos++; });
  assert.ok(infos >= 3, `expected Infotrons, got ${infos}`);
});
test('an Orange disk explodes when it lands', () => {
  const g = mk(['#######', '#  o  #', '#     #', '#  R  #', '#######']);
  run(g, 3);
  let boom = 0; g.cells.forEach(c => { if (c.t === T.EXPL) boom++; });
  assert.ok(boom > 0, 'no explosion');
  assert.equal(at(g, 3, 3).t, T.EXPL, 'RAM under the landing spot should be destroyed');
});
test('explosions chain into neighbouring disks', () => {
  const g = mk(['#########', '#  o  y #', '#  R    #', '#########']);
  E.explode(g, 3, 1, false);
  run(g, 2);
  assert.equal(at(g, 6, 1).t, T.YELLOW, 'yellow disk 3 tiles away should survive');
  const g2 = mk(['########', '#  oy  #', '########']);
  E.explode(g2, 3, 1, false);
  run(g2, 2);
  assert.equal(at(g2, 5, 1).t, T.EXPL, 'adjacent yellow should chain');
});

console.log('Murphy');
test('eats Base and collects Infotrons', () => {
  const g = mk(['######', '#@.*X#', '######'], 1);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 2);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.got, 1);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.state, 'won');
});
test('the Exit stays shut until enough Infotrons', () => {
  const g = mk(['#####', '#@X*#', '#####'], 1);
  run(g, 3, { dir: R, act: false });
  assert.equal(g.state, 'play');
  assert.equal(g.m.x, 1);
});
test('snap eats without moving', () => {
  const g = mk(['#####', '#@.*#', '#####']);
  run(g, 1, { dir: R, act: true });
  assert.equal(g.m.x, 1);
  assert.equal(at(g, 2, 1).t, T.EMPTY);
});
test('pushing a Zonk takes two ticks', () => {
  const g = mk(['######', '#@O  #', '######']);
  run(g, 1, { dir: R, act: false });
  assert.equal(at(g, 2, 1).t, T.ZONK);
  run(g, 1, { dir: R, act: false });
  assert.equal(at(g, 3, 1).t, T.ZONK);
  assert.equal(g.m.x, 2);
});
test('Zonks cannot be pushed up', () => {
  const g = mk(['####', '# ##', '#O##', '#@##', '####']);
  run(g, 4, { dir: U, act: false });
  assert.equal(at(g, 1, 2).t, T.ZONK);
});
test('Yellow disks push in all four directions', () => {
  const g = mk(['#####', '#   #', '# y #', '# @ #', '#####']);
  run(g, 1, { dir: U, act: false });
  assert.equal(at(g, 2, 1).t, T.YELLOW);
});
test('ports pass Murphy only along their arrows', () => {
  const g = mk(['#######', '#@>. <#', '#######']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 3, 'through > from the left');
  run(g, 1, { dir: R, act: false });
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 4, 'a < port refuses travel to the right');
  const g2 = mk(['#######', '#.<@  #', '#######']);
  run(g2, 1, { dir: L, act: false });
  assert.equal(g2.m.x, 1, 'through < from the right, eating the Base beyond');
});
test('the Terminal fires every Yellow disk', () => {
  const g = mk(['#########', '#T@  y y#', '#########']);
  run(g, 1, { dir: L, act: false });
  run(g, 4);
  assert.equal(g.state, 'play');
  assert.notEqual(at(g, 5, 1).t, T.YELLOW);
  assert.notEqual(at(g, 7, 1).t, T.YELLOW);
});
test('a dropped red disk explodes after the fuse and spares Murphy at distance', () => {
  const g = mk(['##########', '#@d     R#', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.red, 1);
  run(g, 2, { dir: -1, act: true });
  assert.equal(g.red, 0);
  assert.ok(g.m.bomb > 0, 'bomb armed');
  run(g, 3, { dir: R, act: false });
  assert.equal(at(g, 2, 1).t, T.BOMB);
  run(g, E.BOMB_FUSE);
  assert.equal(g.state, 'play');
  assert.notEqual(at(g, 2, 1).t, T.BOMB);
});
test('standing on your own bomb is fatal', () => {
  const g = mk(['#####', '#@d #', '#####']);
  run(g, 1, { dir: R, act: false });
  run(g, 2, { dir: -1, act: true });
  run(g, E.BOMB_FUSE + 2);
  assert.equal(g.state, 'dead');
});
test('a live Bug kills, a quiet one is eaten', () => {
  const g = mk(['#####', '#@B #', '#####']);
  const bug = at(g, 2, 1);
  bug.phase = (32 - ((g.tick + 1) % 32)) % 32; // live on the next tick
  run(g, 1, { dir: R, act: false });
  assert.equal(g.state, 'dead');
  const g2 = mk(['#####', '#@B #', '#####']);
  at(g2, 2, 1).phase = 20; // quiet on the next tick
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.state, 'play');
  assert.equal(g2.m.x, 2);
});

console.log('Gravity and level files');
const mkg = (map, extra) => createGame(Object.assign({ name: 'test', need: 0, map }, extra));
test('with gravity on, Murphy falls into empty space', () => {
  const g = mkg(['#####', '# @ #', '#   #', '#   #', '#####'], { grav: true });
  run(g, 2);
  assert.equal(g.m.y, 3);
});
test('with gravity on, Murphy cannot step up into empty space', () => {
  const g = mkg(['#####', '#   #', '# @ #', '#####'], { grav: true });
  run(g, 2, { dir: U, act: false });
  assert.equal(g.m.y, 2);
});
test('with gravity on, Murphy climbs by eating Base', () => {
  const g = mkg(['#####', '# . #', '# . #', '# @ #', '#####'], { grav: true });
  run(g, 1, { dir: U, act: false }); run(g, 1, { dir: U, act: false });
  assert.equal(g.m.y, 1);
});
test('with gravity on, Murphy crosses a gap only while eating', () => {
  const g = mkg(['######', '#@.. #', '#   .#', '######'], { grav: true });
  run(g, 1, { dir: R, act: false });
  assert.deepEqual([g.m.x, g.m.y], [2, 1], 'ate the first Base');
  run(g, 1, { dir: R, act: false });
  assert.deepEqual([g.m.x, g.m.y], [3, 1], 'ate the second Base without falling');
  run(g, 1, { dir: R, act: false });
  assert.deepEqual([g.m.x, g.m.y], [3, 2], 'nothing to eat to the right, so he falls');
});
test('Freeze Zonks holds Zonks in the air', () => {
  const g = mkg(['#####', '# O #', '#   #', '#@  #', '#####'], { freezeZ: true });
  run(g, 5);
  assert.equal(at(g, 2, 1).t, T.ZONK);
});
test('explosions can destroy the Exit', () => {
  const g = mk(['######', '#@ X #', '######']);
  E.explode(g, 3, 1, false);
  assert.ok(g.exitLost);
  assert.ok(g.events.includes('exitlost'));
});
// A synthetic level file: 60x24, hardware border, Murphy left of a special port that turns gravity on.
function synthDat({ need = 0, title = 'TEST LEVEL', specials = [], tiles = {} } = {}) {
  const b = new Uint8Array(1536);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 60; x++) b[y * 60 + x] = (x === 0 || y === 0 || x === 59 || y === 23) ? 6 : 2;
  for (const [k, v] of Object.entries(tiles)) { const [x, y] = k.split(',').map(Number); b[y * 60 + x] = v; }
  const h = 1440, name = ('--- ' + title + ' ---').padEnd(23, '-').slice(0, 23);
  for (let i = 0; i < 23; i++) b[h + 6 + i] = name.charCodeAt(i);
  b[h + 30] = need; b[h + 31] = specials.length;
  specials.forEach((s, i) => { const pos = 2 * (s.x + s.y * 60), e = h + 32 + i * 6; b[e] = pos >> 8; b[e + 1] = pos & 255; b[e + 2] = s.grav ? 1 : 0; b[e + 3] = s.freezeZ ? 2 : 0; b[e + 4] = s.freezeE ? 1 : 0; });
  return b;
}
test('parses a level file: name, size, need-all, special ports', () => {
  const bytes = new Uint8Array([...synthDat({ title: 'FIRST', tiles: { '1,1': 3, '5,5': 4, '6,5': 4, '10,10': 7 } }),
                                ...synthDat({ title: 'SECOND', need: 9, tiles: { '1,1': 3, '10,10': 7 } })]);
  const levels = E.parseDat(bytes);
  assert.equal(levels.length, 2);
  assert.equal(levels[0].name, 'FIRST');
  const g = createGame(levels[0]);
  assert.equal(g.need, 2, 'need 0 means every Infotron');
  assert.equal(createGame(levels[1]).need, 9);
  assert.throws(() => E.parseDat(new Uint8Array(1000)), /1536/);
});
test('a special port switches gravity on', () => {
  const lv = E.parseDat(synthDat({ tiles: { '1,1': 3, '2,1': 13, '3,1': 0, '3,2': 0, '10,10': 7 }, specials: [{ x: 2, y: 1, grav: true }] }))[0];
  const g = createGame(lv);
  assert.equal(g.grav, false);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 3);
  assert.equal(g.grav, true);
  run(g, 1);
  assert.equal(g.m.y, 2, 'falls once gravity is on');
});
test('all 41 tile codes map; the invisible wall blocks and survives blasts', () => {
  const tiles = { '1,1': 3, '10,10': 7 };
  for (let c = 0; c <= 40; c++) if (c !== 3) tiles[`${2 + (c % 50)},${3 + Math.floor(c / 50)}`] = c;
  tiles['5,8'] = 40;
  const g = createGame(E.parseDat(synthDat({ tiles }))[0]);
  assert.equal(at(g, 5, 8).t, T.INVIS);
  E.explode(g, 5, 8, false);
  assert.equal(at(g, 5, 8).t, T.INVIS);
});

console.log('Enemies');
test('a Snik Snak patrols a corridor and kills Murphy on contact', () => {
  const g = mk(['#########', '#@     S#', '#########']);
  run(g, 12);
  assert.equal(g.state, 'dead');
});
test('a Snik Snak ping-pongs in a closed corridor', () => {
  const g = mk(['########', '#S     #', '########']);
  const seen = new Set();
  for (let i = 0; i < 40; i++) { step(g, idle); g.cells.forEach((c, k) => { if (c.t === T.SNIK) seen.add(k % g.W); }); }
  assert.ok(seen.has(1) && seen.has(6), 'reached both ends: ' + [...seen]);
});

// Greedy auto-player: walks to the nearest reachable Infotron, then to the Exit. It ignores danger
// on purpose, so it measures the levels' open routes, not their puzzles.
function bfsStep(g) {
  const want = g.got >= g.need ? new Set([T.EXIT]) : new Set([T.INFO]);
  const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || (c.t === T.EXIT && g.got >= g.need);
  const start = g.m.y * g.W + g.m.x;
  const prev = new Map([[start, -1]]), first = new Map([[start, -1]]);
  const q = [start];
  while (q.length) {
    const k = q.shift(), x = k % g.W, y = (k / g.W) | 0;
    if (k !== start && want.has(g.cells[k].t)) return first.get(k);
    for (let d = 0; d < 4; d++) {
      let nx = x + E.DX[d], ny = y + E.DY[d], c = at(g, nx, ny);
      if (c.t === T.PORT) { if (!(c.d & (1 << d))) continue; nx += E.DX[d]; ny += E.DY[d]; c = at(g, nx, ny); if (c.t !== T.EMPTY && c.t !== T.BASE) continue; }
      else if (!pass(c)) continue;
      const nk = ny * g.W + nx;
      if (prev.has(nk)) continue;
      prev.set(nk, k); first.set(nk, k === start ? d : first.get(k)); q.push(nk);
    }
  }
  return -1;
}
console.log('Auto-player (open routes only; puzzle levels are expected to stall)');
LEVELS.forEach((lv, i) => {
  const g = createGame(lv);
  let t = 0, stalled = 0;
  while (g.state === 'play' && t < 4000 && stalled < 40) {
    const d = bfsStep(g);
    stalled = d < 0 ? stalled + 1 : 0;
    step(g, { dir: d, act: false }); t++;
  }
  console.log(`  ${String(i + 1).padStart(3, '0')} ${lv.name.padEnd(18)} ${g.state.padEnd(5)} ${g.got}/${g.need} infotrons, ${t} ticks${g.state === 'play' ? ' (stalled)' : ''}`);
});

// Scripted solutions for the puzzle levels. goto() walks a safe-agnostic shortest path; the rest are
// raw inputs. Each script must end with Murphy in the Exit.
function goto(g, tx, ty) {
  for (let t = 0; t < 400 && g.state === 'play'; t++) {
    if (g.m.x === tx && g.m.y === ty) return;
    const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || (c.t === T.EXIT && g.got >= g.need);
    const start = g.m.y * g.W + g.m.x, goal = ty * g.W + tx;
    const first = new Map([[start, -1]]), q = [start];
    let dir = -1;
    while (q.length) {
      const k = q.shift();
      if (k === goal) { dir = first.get(k); break; }
      const x = k % g.W, y = (k / g.W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g.W + nx;
        if (first.has(nk) || !pass(at(g, nx, ny))) continue;
        first.set(nk, k === start ? d : first.get(k)); q.push(nk);
      }
    }
    if (dir < 0) throw new Error(`no path to ${tx},${ty} from ${g.m.x},${g.m.y}`);
    step(g, { dir, act: false });
  }
  if (g.state !== 'play') throw new Error(`Murphy ${g.state} on the way to ${tx},${ty}`);
}
function finish(g) {
  for (let t = 0; t < 3000 && g.state === 'play'; t++) step(g, { dir: bfsStep(g), act: false });
}
const SCRIPTS = {
  'Neutron Harvest': (g, wait) => {
    goto(g, 3, 4); run(g, wait);
    run(g, 1, { dir: R, act: true }); run(g, 1, { dir: L, act: false }); run(g, 1, { dir: L, act: false });
    run(g, 30);
    if (g.got + countInfo(g) < g.need) {
      goto(g, 14, 4); run(g, wait);
      run(g, 1, { dir: R, act: true }); run(g, 1, { dir: L, act: false }); run(g, 1, { dir: L, act: false });
      run(g, 30);
    }
    finish(g);
  },
  'Orange Alert': (g) => {
    goto(g, 3, 1); run(g, 1, { dir: R, act: false }); run(g, 10);
    goto(g, 14, 1); run(g, 1, { dir: R, act: false }); run(g, 10);
    finish(g);
  },
  'Terminal Velocity': (g) => {
    goto(g, 12, 7); run(g, 1, { dir: U, act: false });
    goto(g, 8, 4); run(g, 1, { dir: R, act: false }); run(g, 12);
    finish(g);
  },
  'Demolition Bay': (g) => {
    goto(g, 3, 5); goto(g, 4, 1); goto(g, 8, 2); goto(g, 8, 3);
    run(g, 2, { dir: -1, act: true }); goto(g, 5, 3); run(g, E.BOMB_FUSE + 8);
    goto(g, 13, 3); goto(g, 14, 1); goto(g, 14, 5); goto(g, 18, 5);
    run(g, 2, { dir: -1, act: true }); goto(g, 15, 5); run(g, E.BOMB_FUSE + 8);
    finish(g);
  }
};
// Cautious player: same as bfsStep, but treats tiles near an enemy as walls and waits when boxed in.
function cautiousStep(g) {
  const near = new Set();
  g.cells.forEach((c, k) => {
    if (c.t !== T.SNIK && c.t !== T.ELEC) return;
    const x = k % g.W, y = (k / g.W) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= 2) near.add((y + dy) * g.W + x + dx);
  });
  const want = g.got >= g.need ? T.EXIT : T.INFO;
  const pass = c => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || (c.t === T.EXIT && g.got >= g.need);
  const start = g.m.y * g.W + g.m.x, first = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift();
    if (k !== start && g.cells[k].t === want) return first.get(k);
    const x = k % g.W, y = (k / g.W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g.W + nx;
      if (first.has(nk) || near.has(nk) || !pass(at(g, nx, ny))) continue;
      first.set(nk, k === start ? d : first.get(k)); q.push(nk);
    }
  }
  return -1;
}
SCRIPTS['Gamma Alley'] = (g) => { for (let t = 0; t < 3000 && g.state === 'play'; t++) step(g, { dir: cautiousStep(g), act: false }); };
function countInfo(g) { let n = 0; g.cells.forEach(c => { if (c.t === T.INFO) n++; }); return n; }
console.log('Scripted solutions');
for (const [name, script] of Object.entries(SCRIPTS)) {
  const lv = LEVELS.find(l => l.name === name);
  if (name === 'Neutron Harvest') {
    const wins = [];
    for (let w = 0; w < 24; w++) { const g = createGame(lv); try { script(g, w); } catch (e) {} if (g.state === 'won') wins.push(w); }
    test(`${name}: solvable (snap timings that win: ${wins.length}/24)`, () => assert.ok(wins.length > 0));
  } else {
    test(`${name}: solvable`, () => { const g = createGame(lv); script(g); assert.equal(g.state, 'won', `${g.state}, ${g.got}/${g.need}`); });
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
