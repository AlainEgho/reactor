// Runs the game engine from play.html headless: level sanity, physics, and a greedy auto-player.
// Usage: node tests/engine.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'play.html'), 'utf8');
const src = html.slice(html.indexOf('// ENGINE-START'), html.indexOf('// ENGINE-END'));
const E = new Function(src + `
return {createGame,step,at,explode,parseDat,LEVELS,DX,DY,beamCells,
  T:{EMPTY,BASE,HARD,RAM,ZONK,INFO,MURPHY,EXIT,SNIK,ELEC,BUG,ORANGE,YELLOW,RED,TERM,PORT,EXPL,BOMB,INVIS,
     JET,TRACT,STASIS,TELE,DOOR,KEY,LASER,DRONE,ROD,SHIELD,
     ICE,CONV,MAGNET,MIRROR,SWITCH,GATE,CRATE,ALPHA,ACID,FUSE,BURN,COOL,HYDRO,ANTI,FALLOUT,IODINE,PLUT,ISO,NGUN,QTUN,TANK,LAMP},
  EXPL_TICKS,BOMB_FUSE,BOMB_HOLD,STASIS_TICKS,LASER_CYCLE,LASER_ON,ROD_WORTH,GADGET_CHARGES,
  CONV_EVERY,MAG_EVERY,MAG_RANGE,FUSE_TICKS,COOL_EVERY,COOL_CHECK,HALF_LIFE,ISO_WORTH,DOSE_MAX,DOSE_HEAL,IODINE_TICKS,AIR_TANK};`)();
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
    const electronYield = (flat.match(/e/g) || []).length * 6, rodYield = (flat.match(/U/g) || []).length * E.ROD_WORTH;
    const isoYield = (flat.match(/h/g) || []).length * E.ISO_WORTH, plutYield = (flat.match(/P/g) || []).length * 6; // each sphere split leaves Pellets round it
    assert.ok(g.total + electronYield + rodYield + isoYield + plutYield >= lv.need, `need ${lv.need} but only ${g.total} placed (+${electronYield} from electrons, +${rodYield} from rods, +${isoYield} from isotopes)`);
  });
  test(`${i + 1} ${lv.name}: board is stable and Murphy survives 120 idle ticks`, () => {
    const g = createGame(lv);
    const before = g.cells.map(c => c.t).join(',');
    run(g, 120);
    assert.equal(g.state, 'play');
    // Things that move on their own, and (on a level with belts or magnets) the things they carry.
    const movers = new Set([T.SNIK, T.ELEC, T.DRONE, T.ALPHA, T.COOL, T.BURN, T.EMPTY]);
    const flat = lv.map.join('');
    if (/[\[\]M]/.test(flat)) [T.ZONK, T.ROD, T.PLUT, T.INFO, T.ISO, T.ANTI, T.CRATE, T.MIRROR, T.YELLOW, T.RED, T.ORANGE, T.HYDRO].forEach(t => movers.add(t));
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
  run(g, E.BOMB_HOLD, { dir: -1, act: true });
  assert.equal(g.red, 0);
  assert.ok(g.m.bomb > 0, 'bomb armed');
  run(g, 3, { dir: R, act: false });
  assert.equal(at(g, 2, 1).t, T.BOMB);
  run(g, E.BOMB_FUSE);
  assert.equal(g.state, 'play');
  assert.notEqual(at(g, 2, 1).t, T.BOMB);
});
test('a short press does not drop a red disk; only the full hold does', () => {
  const g = mk(['##########', '#@d     R#', '##########']);
  run(g, 1, { dir: R, act: false });
  run(g, E.BOMB_HOLD - 1, { dir: -1, act: true });
  assert.equal(g.m.bomb, 0, 'not armed before the hold is up');
  assert.equal(g.red, 1);
  run(g, 1, { dir: -1, act: false });
  run(g, E.BOMB_HOLD - 1, { dir: -1, act: true });
  assert.equal(g.m.bomb, 0, 'letting go starts the hold again');
  run(g, 1, { dir: -1, act: true });
  assert.ok(g.m.bomb > 0, 'armed once the key has been held BOMB_HOLD ticks');
  assert.equal(g.red, 0);
});
test('standing on your own bomb is fatal', () => {
  const g = mk(['#####', '#@d #', '#####']);
  run(g, 1, { dir: R, act: false });
  run(g, E.BOMB_HOLD, { dir: -1, act: true });
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

console.log('Upgrades: gadgets');
const gad = (dir) => ({ dir, act: false, gad: true });
test('a Thruster pickup fills the gadget slot; Shift + direction dashes through empty space to the first obstacle', () => {
  const g = mk(['##########', '#@J     R#', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.deepEqual(g.gadget, { k: T.JET, n: E.GADGET_CHARGES[T.JET] });
  assert.ok(g.events.includes('gadget'));
  run(g, 1, gad(R));
  assert.equal(g.m.x, 7, 'stopped beside the Cask');
  assert.equal(g.gadget.n, 2, 'one charge spent');
  assert.ok(g.events.includes('dash'));
});
test('a dash against something solid spends nothing, and Shift alone does not move Iso', () => {
  const g = mk(['######', '#@J#.#', '######']);
  run(g, 1, { dir: R, act: false });
  run(g, 1, gad(R));
  assert.equal(g.m.x, 2); assert.equal(g.gadget.n, 3);
  run(g, 1, gad(-1));
  assert.equal(g.m.x, 2); assert.equal(g.gadget.n, 3);
});
test('holding Shift fires once per press, and an ordinary move waits until Shift is released', () => {
  const g = mk(['############', '#@J        #', '############']);
  run(g, 1, { dir: R, act: false });
  run(g, 3, gad(R));
  assert.equal(g.m.x, 10); assert.equal(g.gadget.n, 2, 'held Shift did not spend more charges');
  run(g, 1, gad(L));
  assert.equal(g.m.x, 10, 'still latched: no dash, no walk');
  run(g, 1, { dir: L, act: false });
  assert.equal(g.m.x, 9);
  run(g, 1, gad(L));
  assert.equal(g.m.x, 1, 'dashed back over the eaten pickup to the start'); assert.equal(g.gadget.n, 1);
});
test('with gravity on the Thruster lifts Iso up through empty space', () => {
  const g = mkg(['#####', '#   #', '#   #', '#@J.#', '#####'], { grav: true });
  run(g, 1, { dir: R, act: false });
  run(g, 1, gad(U));
  assert.equal(g.m.y, 1);
});
test('a second pickup of the same gadget adds charges; a different gadget replaces it', () => {
  const g = mk(['########', '#@JJ%  #', '########']);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.gadget.n, 6);
  run(g, 1, { dir: R, act: false });
  assert.deepEqual(g.gadget, { k: T.TRACT, n: 3 });
});
test('the Tractor pulls the Lead ball behind Iso as it steps away', () => {
  const g = mk(['##########', '# O@%.   #', '##########']);
  run(g, 1, { dir: R, act: true }); // snap the Tractor so the ball stays right behind Iso
  assert.equal(g.gadget.k, T.TRACT);
  run(g, 1, gad(R));
  assert.equal(g.m.x, 4, 'stepped into the Tractor\'s empty cell');
  assert.equal(at(g, 3, 1).t, T.ZONK, 'the ball followed');
  assert.equal(at(g, 2, 1).t, T.EMPTY);
  assert.ok(g.events.includes('pull'));
  run(g, 1); // release Shift between pulls
  run(g, 1, gad(R));
  assert.equal(g.m.x, 5, 'into the Graphite'); assert.equal(at(g, 4, 1).t, T.ZONK);
  assert.ok(g.events.includes('eat'));
  assert.equal(g.gadget.n, 1);
});
test('the Tractor does nothing without a ball behind or room ahead', () => {
  const g = mk(['#######', '#@%O  #', '#######']);
  run(g, 1, { dir: R, act: false });
  run(g, 1, gad(R));
  assert.equal(g.m.x, 2, 'the ball is ahead, not behind');
  assert.equal(g.gadget.n, 3);
  const g2 = mk(['######', '#O@%##', '######']);
  run(g2, 1, { dir: R, act: false });
  run(g2, 1, gad(R));
  assert.equal(g2.m.x, 3); assert.equal(g2.gadget.n, 3);
});
test('a pulled ball falls once Iso lets go', () => {
  const g = mk(['#######', '#O@%  #', '## #  #', '#######']);
  run(g, 1, { dir: R, act: true });
  run(g, 1, gad(R));
  assert.equal(at(g, 2, 1).t, T.ZONK);
  run(g, 2);
  assert.equal(at(g, 2, 2).t, T.ZONK, 'fell through the gap');
});
test('Stasis freezes Gammas, Drones and falling Lead for STASIS_TICKS, then they move again', () => {
  const g = mk(['##########', '#  O     #', '#@Z.     #', '#####  S #', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.gadget.k, T.STASIS);
  run(g, 1, gad(-1));
  assert.equal(g.gadget, null, 'single charge, slot emptied');
  assert.equal(g.stasis, E.STASIS_TICKS - 1);
  assert.ok(g.events.includes('stasis'));
  run(g, 1, { dir: R, act: true }); // snap the Graphite from under the ball
  assert.equal(at(g, 3, 2).t, T.EMPTY);
  const snikAt = () => g.cells.findIndex(c => c.t === T.SNIK);
  const s0 = snikAt();
  run(g, E.STASIS_TICKS - 3);
  assert.equal(g.stasis, 1);
  assert.equal(at(g, 3, 1).t, T.ZONK, 'the ball hung in the air');
  assert.equal(snikAt(), s0, 'the Gamma stood still');
  run(g, 1);
  assert.ok(g.events.includes('stasisoff'));
  run(g, 1);
  assert.equal(at(g, 3, 2).t, T.ZONK, 'the ball falls again');
});
test('Shift with no gadget is harmless', () => {
  const g = mk(['#####', '#@  #', '#####']);
  run(g, 1, gad(R));
  assert.equal(g.m.x, 1); assert.equal(g.state, 'play');
});

console.log('Upgrades: tiles');
test('a teleport pad puts Iso out beside the next pad, in the direction of travel', () => {
  const g = mk(['############', '#@W   #W.  #', '############']);
  run(g, 1, { dir: R, act: false });
  assert.deepEqual([g.m.x, g.m.y], [8, 1]);
  assert.equal(at(g, 2, 1).t, T.TELE, 'the pad stays');
  assert.ok(g.events.includes('tele'));
  run(g, 1, { dir: L, act: false });
  assert.deepEqual([g.m.x, g.m.y], [1, 1], 'pads wrap round to the first, exit on the travelling side');
});
test('a blocked exit side falls back to a free side; a lone pad does nothing', () => {
  const g = mk(['#######', '#@W#W##', '##   ##', '#######']);
  run(g, 1, { dir: R, act: false });
  assert.deepEqual([g.m.x, g.m.y], [4, 2], 'came out below the second pad');
  const g2 = mk(['#####', '#@W #', '#####']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.m.x, 1);
});
test('a blast door opens for a keycard and stays shut without one', () => {
  const g = mk(['########', '#@D K  #', '########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 1); assert.ok(g.events.includes('doorlocked'));
  const g2 = mk(['########', '#@KD   #', '########']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.keys, 1);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.m.x, 3); assert.equal(g2.keys, 0, 'the card is used up');
  run(g2, 1, { dir: R, act: false });
  assert.equal(at(g2, 3, 1).t, T.EMPTY, 'the door is gone');
});
test('doors, pads and emitters survive blasts; a keycard does not', () => {
  const g = mk(['#########', '#  DWl  #', '#   K   #', '#########']);
  E.explode(g, 4, 2, false);
  assert.equal(at(g, 3, 1).t, T.DOOR); assert.equal(at(g, 4, 1).t, T.TELE); assert.equal(at(g, 5, 1).t, T.LASER);
  assert.equal(at(g, 4, 2).t, T.EXPL);
});
test('a laser emitter pulses: the beam kills Iso in it, stops at Graphite, and is dark between pulses', () => {
  const g = mk(['#########', '#l  @ . #', '#########']);
  const em = at(g, 1, 1); em.phase = E.LASER_ON - 1; // dark from tick 1, live again at tick LASER_CYCLE - LASER_ON + 1
  const cells = E.beamCells(g, 1, 1, em);
  assert.deepEqual(cells.map(c => [c.x, c.y]), [[2, 1], [3, 1], [4, 1]], 'runs right up to Iso and stops');
  run(g, E.LASER_CYCLE - E.LASER_ON);
  assert.equal(g.state, 'play', 'dark while charging');
  run(g, 1);
  assert.equal(g.state, 'dead');
  assert.ok(g.events.includes('laser'));
});
test('a vertical emitter fires up and down; a Gamma in the beam is destroyed and scores a kill', () => {
  const g = mk(['#####', '#S  #', '#i  #', '# . #', '#####']);
  at(g, 1, 2).phase = 0;
  for (let i = 0; i < E.LASER_CYCLE; i++) { step(g, idle); if (g.marks.some(m => m.k === 'kill')) break; }
  assert.ok(g.marks.some(m => m.k === 'kill'), 'kill mark');
  assert.ok(!g.cells.some(c => c.t === T.SNIK));
});
test('a Neutron in a beam splits into Pellets', () => {
  const g = mk(['#########', '#l  e   #', '#       #', '#########']);
  at(g, 1, 1).phase = 0;
  run(g, E.LASER_CYCLE + E.EXPL_TICKS + 2);
  assert.ok(g.cells.filter(c => c.t === T.INFO).length >= 3);
});
test('a Drone closes in on Iso through empty space and kills on contact', () => {
  const g = mk(['##########', '#@      G#', '##########']);
  run(g, 20);
  assert.equal(g.state, 'dead');
});
test('a Drone cannot dig, is frozen by Stasis, and dies under falling Lead', () => {
  const g = mk(['#######', '#@..G #', '#######']);
  run(g, 10);
  assert.equal(g.state, 'play'); assert.equal(at(g, 4, 1).t, T.DRONE);
  const g2 = mk(['#######', '#@Z  G#', '#######']);
  run(g2, 1, { dir: R, act: false }); run(g2, 1, gad(-1));
  run(g2, 10);
  assert.equal(at(g2, 5, 1).t, T.DRONE, 'held by Stasis');
  const g3 = mk(['#####', '# O #', '#   #', '#RGR#', '#####']); // Casks pin the Drone under the ball
  run(g3, 3);
  assert.ok(!g3.cells.some(c => c.t === T.DRONE));
  assert.ok(g3.marks.some(m => m.k === 'kill') || g3.cells.some(c => c.t === T.EXPL));
});
test('a Drone walks into a laser beam and dies', () => {
  const g = mk(['#########', '#l    G #', '#########']);
  at(g, 1, 1).phase = 0;
  run(g, E.LASER_CYCLE + 4);
  assert.ok(!g.cells.some(c => c.t === T.DRONE));
});
test('a Fuel rod is worth ROD_WORTH Pellets, falls, rolls off round things and crushes', () => {
  const g = mk(['######', '#@U X#', '######'], 3);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.got, E.ROD_WORTH);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.state, 'won');
  const g2 = mk(['#####', '# U #', '# R #', '#   #', '#####']);
  run(g2, 6);
  assert.equal(at(g2, 1, 3).t, T.ROD);
  const g3 = mk(['#####', '# U #', '#   #', '# @ #', '#####']);
  run(g3, 3);
  assert.equal(g3.state, 'dead');
});
test('a Shield absorbs one blast and vaporises the Lead that fell on Iso', () => {
  const g = mk(['#####', '# O #', '#   #', '#H@ #', '#####']);
  run(g, 1, { dir: L, act: false });
  assert.ok(g.shield); assert.ok(g.events.includes('shield'));
  run(g, 1, { dir: R, act: false });
  run(g, 3);
  assert.equal(g.state, 'play', 'Iso survived');
  assert.equal(g.shield, false); assert.equal(at(g, 2, 3).t, T.MURPHY);
  assert.ok(!g.cells.some(c => c.t === T.ZONK), 'the ball is gone');
  const g2 = mk(['#####', '# O #', '#   #', '# @ #', '#####']);
  run(g2, 3);
  assert.equal(g2.state, 'dead', 'no shield, no mercy');
});
test('a Shield stops a Gamma touch and the Gamma dies of it', () => {
  const g = mk(['#########', '#@H    S#', '#########']);
  run(g, 1, { dir: R, act: false });
  run(g, 12);
  assert.equal(g.state, 'play'); assert.equal(g.shield, false);
  assert.ok(!g.cells.some(c => c.t === T.SNIK));
});
test('pickups can be snapped from a distance and count as eating under gravity', () => {
  const g = mk(['#####', '#@K #', '#####']);
  run(g, 1, { dir: R, act: true });
  assert.equal(g.keys, 1); assert.equal(g.m.x, 1); assert.equal(at(g, 2, 1).t, T.EMPTY);
  const g2 = mkg(['######', '#@KH #', '#    #', '######'], { grav: true });
  run(g2, 1, { dir: R, act: false }); run(g2, 1, { dir: R, act: false });
  assert.deepEqual([g2.m.x, g2.m.y], [3, 1], 'held up by eating the two pickups');
});

console.log('Element Wings: physics');
const cnt = (g, t) => g.cells.filter(c => c.t === t).length;
test('Ice: Iso slides until he leaves the ice, picking up Pellets on the way, and input is ignored meanwhile', () => {
  const g = mk(['##########', '#@III*I .#', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 2); assert.ok(g.events.includes('slide'));
  run(g, 1, { dir: L, act: false });
  assert.equal(g.m.x, 3, 'kept sliding right despite Left');
  run(g, 3, { dir: U, act: true });
  assert.equal(g.m.x, 6, 'took the Pellet in its path and slid on'); assert.equal(g.got, 1);
  run(g, 1);
  assert.equal(g.m.x, 7, 'slid off the ice onto the floor');
  run(g, 1);
  assert.equal(g.m.x, 7, 'and stopped there');
  assert.equal(at(g, 2, 1).t, T.ICE, 'the ice is still there behind him');
  assert.equal(at(g, 5, 1).t, T.EMPTY, 'the Pellet cell is bare floor now');
});
test('Ice: Graphite stops a slide on the ice; Iso can then walk off', () => {
  const g = mk(['#######', '#@II.*#', '#######']);
  run(g, 1, { dir: R, act: false }); run(g, 2);
  assert.equal(g.m.x, 3, 'stopped on the last ice cell'); assert.equal(g.slide, -1);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.got, 1);
});
test('Conveyor: carries Lead along every CONV_EVERY ticks, drops it off the end, and carries Iso too', () => {
  const g = mk(['########', '#O     #', '#]]]   #', '#      #', '########']);
  run(g, E.CONV_EVERY * 3);
  assert.equal(at(g, 4, 1).t, T.ZONK, 'moved three cells right');
  run(g, 2);
  assert.ok(at(g, 4, 3).t === T.ZONK || at(g, 4, 2).t === T.ZONK, 'fell off the end');
  const g2 = mk(['#######', '#@    #', '#]]]  #', '#######']);
  run(g2, E.CONV_EVERY * 3 + 1);
  assert.equal(g2.m.x, 4, 'Iso was carried off the belt');
  const g3 = mk(['#######', '#   O #', '# #[[ #', '#######']);
  run(g3, E.CONV_EVERY * 4);
  assert.equal(at(g3, 2, 1).t, T.ZONK, 'a left belt carries left and the floor beyond holds it');
});
test('Magnet: pulls Lead one cell closer through open space, holds it, and ignores anything further than MAG_RANGE', () => {
  const g = mk(['############', '#M   O    O#', '############']);
  run(g, E.MAG_EVERY * 4);
  assert.equal(at(g, 2, 1).t, T.ZONK, 'pulled up against the magnet');
  run(g, E.MAG_EVERY * 4);
  assert.equal(at(g, 2, 1).t, T.ZONK, 'stays there');
  assert.equal(at(g, 10, 1).t, T.ZONK, 'the far ball is beyond reach and beyond the near one');
  const g2 = mk(['#####', '# M #', '#   #', '#   #', '# O #', '#####']);
  run(g2, E.MAG_EVERY * 3);
  assert.equal(at(g2, 2, 2).t, T.ZONK, 'lifted against gravity');
});
test('Magnet: a ball dragged sideways off a ledge falls and crushes', () => {
  const g = mk(['##########', '#O    M  #', '##  #    #', '# @      #', '##########']);
  run(g, 12);
  assert.equal(g.state, 'dead');
});
test('Mirror: turns a beam; a Gamma round the corner dies; mirrors push four ways and break in a blast', () => {
  const g = mk(['########', '#l  \\  #', '#  #S# #', '#  ### #', '########']);
  at(g, 1, 1).phase = 0;
  const cells = E.beamCells(g, 1, 1, at(g, 1, 1));
  assert.deepEqual(cells.map(c => [c.x, c.y, c.v]), [[2, 1, false], [3, 1, false], [4, 2, true]], 'the beam turns down at the mirror and stops at the Gamma');
  run(g, 2);
  assert.ok(!g.cells.some(c => c.t === T.SNIK) || cnt(g, T.EXPL) > 0, 'the Gamma is blown up');
  const g2 = mk(['#####', '#   #', '#@/ #', '#   #', '#####']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(at(g2, 3, 2).t, T.MIRROR, 'pushed right in one tick');
  run(g2, 1, { dir: U, act: false }); run(g2, 1, { dir: R, act: false }); run(g2, 1, { dir: Dn, act: false });
  assert.equal(at(g2, 3, 3).t, T.MIRROR, 'pushed down');
  E.explode(g2, 3, 2, false);
  assert.equal(at(g2, 3, 3).t, T.EXPL, 'a blast breaks it');
});
test('Mirror: a slash sends a rightward beam up', () => {
  const g = mk(['#######', '#   S #', '#l  / #', '#######']);
  const cells = E.beamCells(g, 1, 2, at(g, 1, 2));
  assert.deepEqual(cells[cells.length - 1].x, 4); assert.deepEqual(cells[cells.length - 1].y, 1);
});
test('Switch and gates: a closed gate blocks, the switch flips every gate, Iso passes through an open one to the far side', () => {
  const g = mk(['##########', '#@g.s..q.#', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 1); assert.ok(g.events.includes('gatelocked'));
  const g2 = mk(['##########', '#@s g.  q#', '##########']);
  run(g2, 1, { dir: R, act: false });
  assert.ok(g2.events.includes('switch')); assert.equal(at(g2, 4, 1).d, 1, 'closed gate opened'); assert.equal(at(g2, 8, 1).d, 0, 'open gate closed');
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.m.x, 1, 'the switch itself is solid; flipping again so soon is ignored');
  assert.equal(at(g2, 4, 1).d, 1);
  const g3 = mk(['########', '#@q.*  #', '########']);
  run(g3, 1, { dir: R, act: false });
  assert.deepEqual([g3.m.x, at(g3, 2, 1).t], [3, T.GATE], 'stepped through the open gate and ate the Graphite beyond; the gate stays');
  assert.ok(g3.events.includes('gate'));
});
test('an open gate right in front of the Reactor lets Iso through to it once the fuel is in', () => {
  const g = mk(['#######', '#@*qX #', '#######'], 1);
  run(g, 1, { dir: R, act: false });
  run(g, 1, { dir: R, act: false });
  assert.equal(g.state, 'won');
  const g2 = mk(['#######', '#@qX* #', '#######'], 1);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.m.x, 1, 'shut until the fuel is in'); assert.ok(g2.events.includes('locked'));
});
test('Switch: Lead landing on it flips the gates; gates and switches survive blasts', () => {
  const g = mk(['#####', '# O #', '#   #', '# s #', '#g q#', '#####']);
  run(g, 3);
  assert.equal(at(g, 1, 4).d, 1); assert.equal(at(g, 3, 4).d, 0);
  E.explode(g, 2, 3, false);
  assert.equal(at(g, 2, 3).t, T.SWITCH); assert.equal(at(g, 1, 4).t, T.GATE);
});
test('Crate: pushes in all four directions, never falls, blocks a beam and dies in a blast', () => {
  const g = mk(['#######', '#     #', '#  c  #', '#  @  #', '#     #', '#######']);
  run(g, 1, { dir: U, act: false });
  assert.equal(at(g, 3, 1).t, T.CRATE, 'pushed up');
  run(g, 1, { dir: L, act: false }); run(g, 1, { dir: U, act: false }); run(g, 1, { dir: R, act: false });
  assert.equal(at(g, 4, 1).t, T.CRATE, 'pushed right');
  run(g, 10);
  assert.equal(at(g, 4, 1).t, T.CRATE, 'did not fall');
  const g2 = mk(['#########', '#l  c @ #', '#########']);
  at(g2, 1, 1).phase = 0;
  run(g2, E.LASER_CYCLE);
  assert.equal(g2.state, 'play', 'the crate shadows Iso');
  E.explode(g2, 4, 1, false);
  assert.equal(at(g2, 4, 1).t, T.EXPL);
});
test('Alpha: flies straight, bounces off walls, kills Iso, and dies under Lead with a kill mark', () => {
  const g = mk(['#########', '#A      #', '#########']);
  run(g, 6);
  assert.equal(at(g, 7, 1).t, T.ALPHA, 'reached the far wall'); assert.equal(at(g, 7, 1).d, 1);
  run(g, 1);
  assert.equal(at(g, 7, 1).t, T.ALPHA, 'turns round at the wall'); assert.equal(at(g, 7, 1).d, 3);
  run(g, 1);
  assert.equal(at(g, 6, 1).t, T.ALPHA, 'bounced back');
  const g2 = mk(['#########', '#@     A#', '#########']);
  run(g2, 8);
  assert.equal(g2.state, 'dead');
  const g3 = mk(['#####', '# O #', '#   #', '#RVR#', '#####']);
  let killed = false;
  for (let i = 0; i < 3; i++) { step(g3, idle); if (g3.marks.some(m => m.k === 'kill')) killed = true; }
  assert.ok(!g3.cells.some(c => c.t === T.ALPHA)); assert.ok(killed, 'scored as a kill');
});
test('Alpha: a V starts downward; Stasis holds it; a laser kills it', () => {
  const g = mk(['#####', '# V #', '#   #', '#   #', '#####']);
  run(g, 2);
  assert.equal(at(g, 2, 3).t, T.ALPHA);
  const g2 = mk(['#########', '#@Z    A#', '#########']);
  run(g2, 1, { dir: R, act: false }); run(g2, 1, { dir: -1, act: false, gad: true });
  run(g2, 10);
  assert.equal(at(g2, 7, 1).t, T.ALPHA, 'frozen');
  const g3 = mk(['#########', '#l    A #', '#########']);
  at(g3, 1, 1).phase = 0;
  run(g3, E.LASER_CYCLE + 2);
  assert.ok(!g3.cells.some(c => c.t === T.ALPHA));
});

console.log('Element Wings: chemistry');
test('Acid: dissolves Iso, swallows falling Lead, and a blast clears it', () => {
  const g = mk(['#####', '#@a #', '#####']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.state, 'dead'); assert.ok(g.events.includes('acid')); assert.equal(at(g, 1, 1).t, T.EMPTY, 'nothing left of Iso');
  const g2 = mk(['#####', '# O #', '#   #', '# a #', '#####']);
  run(g2, 4);
  assert.ok(!g2.cells.some(c => c.t === T.ZONK)); assert.equal(at(g2, 2, 3).t, T.ACID, 'the pool stays');
  E.explode(g2, 2, 2, false);
  assert.equal(at(g2, 2, 3).t, T.EXPL);
});
test('Fuse: a blast lights it, the fire runs along it and sets off the canister at the end; Iso cuts it by eating', () => {
  const g = mk(['##########', '#d  ,,,,o#', '#@       #', '##########']);
  E.explode(g, 3, 1, false);
  assert.equal(at(g, 4, 1).t, T.BURN, 'lit');
  run(g, E.FUSE_TICKS * 4 + 2);
  assert.ok(!g.cells.some(c => c.t === T.ORANGE), 'the orange canister went off');
  assert.ok(!g.cells.some(c => c.t === T.FUSE), 'the fuse is spent');
  const g2 = mk(['#########', '#@,,,,,o#', '#########']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.m.x, 2); assert.ok(g2.events.includes('eat'));
  run(g2, 1, { dir: R, act: true });
  assert.equal(at(g2, 3, 1).t, T.EMPTY, 'snapped a fuse cell away');
});
test('Fuse: a laser beam lights it', () => {
  const g = mk(['##########', '#l  ,,y  #', '##########']);
  at(g, 1, 1).phase = 0;
  run(g, E.LASER_CYCLE + E.FUSE_TICKS * 3);
  assert.ok(!g.cells.some(c => c.t === T.YELLOW));
});
test('Coolant: grows into open space, swallows Lead, keeps Iso out, and crystallises when sealed', () => {
  const g = mk(['#######', '#~    #', '#######']);
  run(g, E.COOL_EVERY * 2 + 1);
  assert.ok(cnt(g, T.COOL) >= 2, 'grew');
  run(g, E.COOL_EVERY * 10);
  assert.equal(cnt(g, T.COOL), 0, 'crystallised once nothing was left to grow into');
  assert.equal(cnt(g, T.BASE), 5, 'into Graphite');
  const g2 = mk(['#####', '# O #', '#   #', '# ~ #', '#####']);
  run(g2, 4);
  assert.ok(!g2.cells.some(c => c.t === T.ZONK)); assert.ok(g2.events.includes('fizz') || cnt(g2, T.COOL) >= 1);
  const g3 = mk(['#####', '#@~ #', '#####']);
  run(g3, 1, { dir: R, act: false });
  assert.equal(g3.m.x, 1);
  run(g3, 1, { dir: R, act: true });
  assert.notEqual(at(g3, 2, 1).t, T.EMPTY, 'cannot be snapped');
});
test('Hydrogen: rises and bursts where it stops; pushes sideways; Lead landing on it sets it off', () => {
  const g = mk(['#####', '#   #', '#   #', '# F #', '#####']);
  run(g, 3);
  assert.ok(cnt(g, T.EXPL) > 0, 'burst at the ceiling'); assert.ok(!g.cells.some(c => c.t === T.HYDRO));
  const g2 = mk(['######', '#@F  #', '######']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(at(g2, 3, 1).t, T.HYDRO, 'pushed in one tick');
  run(g2, 3);
  assert.equal(at(g2, 3, 1).t, T.HYDRO, 'rests under the ceiling without rising');
  const g3 = mk(['#####', '# O #', '#   #', '# F #', '#####']);
  run(g3, 3);
  assert.ok(cnt(g3, T.EXPL) > 0);
});
test('Antipellet: takes one Pellet off the count, never below zero, and can be snapped', () => {
  const g = mk(['########', '#@*!!  #', '########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.got, 1);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.got, 0); assert.ok(g.events.includes('anti'));
  run(g, 1, { dir: R, act: true });
  assert.equal(g.got, 0); assert.equal(at(g, 4, 1).t, T.EMPTY);
});
test('Fallout: the dose climbs on it and kills at DOSE_MAX, heals off it, and an Iodine pill blocks it', () => {
  const g = mk(['########', '#@rrrr #', '########']);
  run(g, 1, { dir: R, act: false });
  run(g, 5);
  assert.ok(g.dose >= 5 && g.dose <= 6, 'dose ' + g.dose); assert.ok(g.events.includes('geiger') || g.dose > 0);
  run(g, 1, { dir: L, act: false });
  assert.equal(at(g, 2, 1).t, T.FALLOUT, 'the fallout is still there');
  run(g, E.DOSE_HEAL * 8);
  assert.equal(g.dose, 0, 'healed');
  run(g, 1, { dir: R, act: false });
  let dosed = false;
  for (let i = 0; i < E.DOSE_MAX + 1 && g.state === 'play'; i++) { step(g, idle); if (g.events.includes('dosed')) dosed = true; }
  assert.equal(g.state, 'dead'); assert.ok(dosed);
  const g2 = mk(['########', '#@prrr #', '########']);
  run(g2, 2, { dir: R, act: false });
  run(g2, E.DOSE_MAX);
  assert.equal(g2.state, 'play'); assert.equal(g2.dose, 0);
  run(g2, E.IODINE_TICKS);
  assert.equal(g2.state, 'dead', 'the pill wears off');
});

console.log('Element Wings: nuclear');
test('Plutonium: falls and crushes like Lead; two at rest side by side go critical and leave Pellets', () => {
  const g = mk(['#####', '# P #', '#   #', '# @ #', '#####']);
  run(g, 3);
  assert.equal(g.state, 'dead');
  const g2 = mk(['#######', '#     #', '# P P #', '#######']);
  run(g2, 3);
  assert.equal(g2.state, 'play'); assert.equal(cnt(g2, T.PLUT), 2, 'apart, they are quiet');
  const g3 = mk(['########', '#      #', '#  PP  #', '########']);
  run(g3, 1);
  assert.ok(cnt(g3, T.EXPL) > 0, 'critical'); assert.ok(g3.marks.some(m => m.k === 'fission'));
  run(g3, E.EXPL_TICKS + 2);
  assert.ok(cnt(g3, T.INFO) >= 6, 'pellets: ' + cnt(g3, T.INFO)); assert.equal(cnt(g3, T.PLUT), 0, 'the neighbour went with it');
});
test('Plutonium: pushing one against another is the trigger, and it takes two ticks like Lead', () => {
  const g = mk(['########', '#@P P  #', '########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(at(g, 2, 1).t, T.PLUT, 'not yet');
  assert.equal(cnt(g, T.EXPL), 0);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.m.x, 2, 'the push went through');
  assert.ok(cnt(g, T.EXPL) > 0, 'and the pair went critical at once');
});
test('Isotope pellet: worth ISO_WORTH, falls, and decays to nothing after HALF_LIFE ticks', () => {
  const g = mk(['######', '#@h X#', '######'], 2);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.got, E.ISO_WORTH);
  const g2 = mk(['#####', '# h #', '#   #', '#   #', '#####']);
  run(g2, 2);
  assert.equal(at(g2, 2, 3).t, T.ISO);
  run(g2, E.HALF_LIFE);
  assert.equal(cnt(g2, T.ISO), 0); assert.ok(g2.events.includes('decay') || cnt(g2, T.ISO) === 0);
});
test('Neutron gun: a shot down the corridor kills a Gamma, splits a Neutron, breaks a Cask, and spends a charge on concrete', () => {
  const g = mk(['##########', '#@N     S#', '##########']);
  run(g, 1, { dir: R, act: false });
  assert.equal(g.gadget.k, T.NGUN);
  run(g, 1, { dir: R, act: false, gad: true });
  assert.ok(g.events.includes('shot')); assert.ok(g.marks.some(m => m.k === 'shot'));
  assert.ok(g.marks.some(m => m.k === 'kill')); assert.equal(g.gadget.n, 2);
  const g2 = mk(['##########', '#@N   e  #', '##########']);
  run(g2, 1, { dir: R, act: false }); run(g2, 1, { dir: R, act: false, gad: true });
  run(g2, E.EXPL_TICKS + 1);
  assert.ok(cnt(g2, T.INFO) >= 3);
  const g3 = mk(['##########', '#@N   R  #', '##########']);
  run(g3, 1, { dir: R, act: false }); run(g3, 1, { dir: R, act: false, gad: true });
  assert.equal(at(g3, 6, 1).t, T.EXPL);
  const g4 = mk(['#####', '#@N #', '#####']);
  run(g4, 1, { dir: R, act: false }); run(g4, 1, { dir: R, act: false, gad: true });
  assert.equal(g4.gadget.n, 2, 'a shot into the wall still costs');
});
test('Quantum tunnel: through one solid cell into open space, blocked when the far side is solid', () => {
  const g = mk(['##########', '#@Q#.# O*#', '##########']);
  run(g, 1, { dir: R, act: false });
  run(g, 1, { dir: R, act: false, gad: true });
  assert.equal(g.m.x, 4, 'through the concrete'); assert.ok(g.events.includes('tunnel')); assert.equal(g.gadget.n, 2);
  run(g, 1, { dir: -1, act: false });
  run(g, 1, { dir: R, act: false, gad: true });
  assert.equal(g.m.x, 6, 'through the next wall');
  run(g, 1, { dir: -1, act: false });
  run(g, 1, { dir: R, act: false, gad: true });
  assert.equal(g.m.x, 6, 'the Lead has a Pellet behind it, not open space: no tunnel'); assert.equal(g.gadget.n, 1);
});
test('Air: a level with air runs out; tanks add AIR_TANK; levels without air ignore tanks', () => {
  const g = mkg(['######', '#@ t #', '######'], { air: 2 });
  assert.equal(g.air, 16); assert.ok(g.usesAir);
  run(g, 10);
  assert.equal(g.state, 'play'); assert.equal(g.air, 6);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.air, 4 + E.AIR_TANK); assert.ok(g.events.includes('air'));
  run(g, 4 + E.AIR_TANK);
  assert.equal(g.state, 'dead'); assert.ok(g.events.includes('suffocate'));
  const g2 = mk(['#####', '#@t #', '#####']);
  run(g2, 1, { dir: R, act: false });
  assert.equal(g2.air, 0); assert.equal(g2.usesAir, false);
});
test('Lamp and dark: lamps are counted; dark is a level flag', () => {
  const g = mkg(['######', '#@LL #', '######'], { dark: true });
  assert.ok(g.dark);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.lamp, 2);
});
test('Stasis holds belts, magnets, hydrogen and coolant', () => {
  const g = mk(['##########', '#@Z O  ~ #', '#   ]    #', '##########']);
  run(g, 1, { dir: R, act: false }); run(g, 1, { dir: -1, act: false, gad: true });
  run(g, E.COOL_EVERY + 2);
  assert.equal(at(g, 4, 1).t, T.ZONK); assert.equal(cnt(g, T.COOL), 1);
});
test('Floors come back when Iso leaves them, and a dropped canister takes the floor with it', () => {
  const g = mk(['#######', '#@dIr #', '#######']);
  run(g, 2, { dir: R, act: false });
  assert.equal(g.under, T.ICE); assert.equal(g.slide, 1);
  run(g, 1);
  assert.equal(g.m.x, 4); assert.equal(g.under, T.FALLOUT); assert.equal(at(g, 3, 1).t, T.ICE);
  run(g, E.BOMB_HOLD, { dir: -1, act: true });
  run(g, 1, { dir: R, act: false });
  assert.equal(at(g, 4, 1).t, T.BOMB, 'the canister sits where the fallout was');
  run(g, E.BOMB_FUSE + E.EXPL_TICKS + 2);
  assert.equal(at(g, 4, 1).t, T.EMPTY);
});

console.log('Meltdown');
// The floor generator lives outside the engine block; it is sliced out of the page the same way.
const meltSrc = html.slice(html.indexOf('function rng('), html.indexOf('function startMeltdown'));
const M = new Function(src + meltSrc + 'return {createGame,step,genMeltdown};')();
test('every round through 14 builds, is still for 120 ticks, and brings the Element Wings in on schedule', () => {
  for (let round = 1; round <= 14; round++) {
    const lv = M.genMeltdown(round, 777 + round * 7919), g = M.createGame(lv), flat = lv.map.join('');
    for (let i = 0; i < 120; i++) M.step(g, idle);
    assert.equal(g.state, 'play', `round ${round}`);
    const has = ch => flat.includes(ch);
    assert.equal(has('h'), round >= 2, `isotopes round ${round}`);
    assert.equal(has('a'), round >= 5, `acid round ${round}`);
    assert.equal(has('A'), round >= 6, `alphas round ${round}`);
    assert.equal(has('P'), round >= 7, `plutonium round ${round}`);
    assert.equal(has('r') && has('p'), round >= 8, `fallout round ${round}`);
    assert.equal(has('M'), round >= 9, `magnets round ${round}`);
    assert.equal(has('~'), round >= 10, `coolant round ${round}`);
    assert.ok(lv.need >= 1 && lv.need <= (flat.split('*').length - 1) + 3 * (flat.split('U').length - 1) + 2 * (flat.split('h').length - 1), `need round ${round}`);
  }
});

// Greedy auto-player: walks to the nearest reachable Infotron, then to the Exit. It ignores danger
// on purpose, so it measures the levels' open routes, not their puzzles.
const PICK = [T.JET, T.TRACT, T.STASIS, T.KEY, T.SHIELD, T.ROD, T.IODINE, T.NGUN, T.QTUN, T.TANK, T.LAMP];
const pass = (g, c) => c.t === T.EMPTY || c.t === T.BASE || c.t === T.INFO || c.t === T.RED || c.t === T.FUSE || c.t === T.ISO || c.t === T.FALLOUT || PICK.includes(c.t) || (c.t === T.EXIT && g.got >= g.need);
function bfsStep(g) {
  const want = g.got >= g.need ? new Set([T.EXIT]) : new Set([T.INFO, T.ROD, T.ISO]);
  const start = g.m.y * g.W + g.m.x;
  const prev = new Map([[start, -1]]), first = new Map([[start, -1]]);
  const q = [start];
  while (q.length) {
    const k = q.shift(), x = k % g.W, y = (k / g.W) | 0;
    if (k !== start && want.has(g.cells[k].t)) return first.get(k);
    for (let d = 0; d < 4; d++) {
      let nx = x + E.DX[d], ny = y + E.DY[d], c = at(g, nx, ny);
      if (c.t === T.PORT) { if (!(c.d & (1 << d))) continue; nx += E.DX[d]; ny += E.DY[d]; c = at(g, nx, ny); if (c.t !== T.EMPTY && c.t !== T.BASE) continue; }
      else if (!pass(g, c)) continue;
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
function pathDir(g, tx, ty, avoid) {
  const start = g.m.y * g.W + g.m.x, goal = ty * g.W + tx;
  const first = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift();
    if (k === goal) return first.get(k);
    const x = k % g.W, y = (k / g.W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g.W + nx;
      if (first.has(nk) || !pass(g, at(g, nx, ny))) continue;
      if (avoid && nk !== goal && avoid(nx, ny)) continue;
      first.set(nk, k === start ? d : first.get(k)); q.push(nk);
    }
  }
  return -1;
}
function goto(g, tx, ty) {
  for (let t = 0; t < 400 && g.state === 'play'; t++) {
    if (g.m.x === tx && g.m.y === ty) return;
    const dir = pathDir(g, tx, ty);
    if (dir < 0) throw new Error(`no path to ${tx},${ty} from ${g.m.x},${g.m.y}`);
    step(g, { dir, act: false });
  }
  if (g.state === 'dead') throw new Error(`Murphy died on the way to ${tx},${ty}`);
}
// True when (x,y) lies on an emitter's line (through anything Iso could clear) and that emitter will
// be live within `ahead` ticks. Conservative on purpose: a lane behind a Pellet counts too.
const CLEARABLE = new Set([T.EMPTY, T.MURPHY, T.SNIK, T.DRONE, T.ELEC, T.INFO, T.BASE, T.RED, ...PICK]);
function laneDanger(g, x, y, ahead) {
  for (let i = 0; i < g.cells.length; i++) {
    const c = g.cells[i];
    if (c.t !== T.LASER) continue;
    const ex = i % g.W, ey = (i / g.W) | 0;
    if (c.d ? x !== ex : y !== ey) continue;
    let hit = false;
    for (const s of [-1, 1]) {
      let bx = ex, by = ey;
      for (;;) {
        if (c.d) by += s; else bx += s;
        if (!CLEARABLE.has(at(g, bx, by).t)) break;
        if (bx === x && by === y) { hit = true; break; }
      }
    }
    if (!hit) continue;
    for (let k = 1; k <= ahead; k++) if ((g.tick + k + c.phase) % E.LASER_CYCLE < E.LASER_ON) return true;
  }
  return false;
}
// goto() that keeps off laser lanes where it can, and otherwise waits outside a lane until the beam
// will stay dark long enough to cross.
function gotoSafe(g, tx, ty) {
  const lane = (x, y) => laneDanger(g, x, y, E.LASER_CYCLE);
  for (let t = 0; t < 600 && g.state === 'play'; t++) {
    if (g.m.x === tx && g.m.y === ty) return;
    let dir = pathDir(g, tx, ty, lane);
    if (dir < 0) dir = pathDir(g, tx, ty);
    if (dir < 0) throw new Error(`no path to ${tx},${ty} from ${g.m.x},${g.m.y}`);
    const nx = g.m.x + E.DX[dir], ny = g.m.y + E.DY[dir];
    if (laneDanger(g, nx, ny, 3) && !laneDanger(g, g.m.x, g.m.y, 1)) { step(g, idle); continue; }
    step(g, { dir, act: false });
  }
  if (g.state === 'dead') throw new Error(`Murphy died on the way to ${tx},${ty}`);
}
const mv = (g, d, n = 1) => run(g, n, { dir: d, act: false });
const useGad = (g, d) => { run(g, 1, { dir: d, act: false, gad: true }); };
// Idles until no Gamma stands on row y between x0 and x1 (a dash lane), for at most 40 ticks.
function waitClear(g, x0, x1, y) {
  for (let t = 0; t < 40; t++) {
    let busy = false;
    for (let x = x0; x <= x1; x++) if (at(g, x, y).t === T.SNIK) busy = true;
    if (!busy) return;
    step(g, idle);
  }
  throw new Error(`row ${y} never cleared`);
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
    run(g, E.BOMB_HOLD, { dir: -1, act: true }); goto(g, 5, 3); run(g, E.BOMB_FUSE + 8);
    goto(g, 13, 3); goto(g, 14, 1); goto(g, 14, 5); goto(g, 18, 5);
    run(g, E.BOMB_HOLD, { dir: -1, act: true }); goto(g, 15, 5); run(g, E.BOMB_FUSE + 8);
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
  const start = g.m.y * g.W + g.m.x, first = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift();
    if (k !== start && g.cells[k].t === want) return first.get(k);
    const x = k % g.W, y = (k / g.W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + E.DX[d], ny = y + E.DY[d], nk = ny * g.W + nx;
      if (first.has(nk) || near.has(nk) || !pass(g, at(g, nx, ny))) continue;
      first.set(nk, k === start ? d : first.get(k)); q.push(nk);
    }
  }
  return -1;
}
SCRIPTS['Gamma Alley'] = (g) => { for (let t = 0; t < 3000 && g.state === 'play'; t++) step(g, { dir: cautiousStep(g), act: false }); };

// The Upgrade Wing (132-141): one level per new move or tile, then all of them at once.
Object.assign(SCRIPTS, {
  'Lift Shaft': (g) => {
    goto(g, 3, 1);                                                    // the Thruster
    const pit = () => { mv(g, Dn); mv(g, Dn); run(g, 1); mv(g, Dn); run(g, 2); useGad(g, U); mv(g, R); };
    pit();                                                            // pocket 1 at x=3
    goto(g, 10, 1); pit();                                            // pocket 2 at x=10
    goto(g, 18, 1); mv(g, Dn); mv(g, Dn); run(g, 2);                  // pocket 3: fall to its floor
    mv(g, R); mv(g, R); mv(g, U); run(g, 1); mv(g, L); mv(g, L);     // the Pellet on the far side, then back under the hole
    useGad(g, U); mv(g, R);
    goto(g, 24, 1); goto(g, 24, 7); goto(g, 15, 7); goto(g, 7, 7);   // never back across the open holes
    finish(g);
  },
  'Dead Weight': (g) => {
    goto(g, 19, 1);                                                   // three Tractor pickups
    for (const jx of [6, 14, 22]) {
      goto(g, jx, 3); goto(g, jx - 2, 3);                             // beside the ball
      for (let i = 0; i < 3; i++) { useGad(g, R); run(g, 1); }        // drag it to the junction
      run(g, 3);                                                      // it drops into the pit
      goto(g, jx - 4, 3); goto(g, jx, 1);
    }
    finish(g);
  },
  'Cold Snap': (g) => {
    goto(g, 8, 1); goto(g, 1, 3);
    useGad(g, -1);
    goto(g, 15, 4); goto(g, 20, 4); useGad(g, -1); goto(g, 9, 4); goto(g, 1, 3);
    finish(g);
  },
  'Switchboard': (g) => {
    goto(g, 5, 1); goto(g, 3, 3); goto(g, 9, 2); mv(g, R);            // pad A -> beside pad B
    goto(g, 19, 1); goto(g, 22, 3); goto(g, 15, 2); mv(g, L);         // pad B -> beside pad C
    goto(g, 6, 6); goto(g, 11, 8); goto(g, 3, 7); mv(g, L);           // pad C -> beside pad D
    goto(g, 18, 6); goto(g, 15, 8); finish(g);
  },
  'Checkpoint': (g) => {
    goto(g, 10, 1); goto(g, 24, 1); goto(g, 24, 3); goto(g, 20, 3);   // three cards
    for (const x of [3, 7, 11]) { goto(g, x, 3); mv(g, Dn); mv(g, Dn); goto(g, x, 3); }
    finish(g);
  },
  'Light Show': (g) => {
    for (const [x, y] of [[7, 5], [13, 5], [11, 4], [18, 5], [23, 5], [24, 7]]) gotoSafe(g, x, y);
  },
  'Hunter Killer': (g) => {
    goto(g, 1, 2);                                                    // wait here: the Drones park under the laser
    for (let t = 0; t < 160 && g.cells.some(c => c.t === T.DRONE); t++) step(g, idle);
    goto(g, 1, 3);
    for (const [x, y] of [[5, 6], [12, 6], [18, 6], [24, 5]]) gotoSafe(g, x, y);
    finish(g);
  },
  'Heavy Fuel': (g) => {
    for (const x of [5, 13, 21]) { goto(g, x - 1, 1); goto(g, x - 1, 2); goto(g, x - 2, 2); run(g, 4); mv(g, R); }
    finish(g);
  },
  'Halo': (g) => {
    const ram = (d) => { for (let t = 0; t < 60 && g.state === 'play' && g.shield; t++) mv(g, d); run(g, E.EXPL_TICKS + 3); };
    goto(g, 1, 2); goto(g, 2, 3); ram(R); goto(g, 12, 3);
    goto(g, 1, 1); goto(g, 24, 2); goto(g, 23, 3); ram(L); goto(g, 14, 3);
    finish(g);
  },
  'Upgrade Wing': (g) => {
    goto(g, 6, 1); goto(g, 8, 2); goto(g, 5, 4); goto(g, 2, 3);       // card, Pellets, Tractor
    goto(g, 6, 7); goto(g, 4, 7);
    for (let i = 0; i < 3; i++) { useGad(g, R); run(g, 1); }
    run(g, 3); goto(g, 2, 7); goto(g, 9, 10);                         // the other two cards
    goto(g, 9, 2); mv(g, R);                                          // door 1
    goto(g, 16, 1); goto(g, 11, 5);                                   // Thruster, hall mouth
    waitClear(g, 12, 19, 5); useGad(g, R);                            // dash to the far wall
    mv(g, Dn); mv(g, Dn); mv(g, L); mv(g, R); mv(g, U); mv(g, U);     // the two Pellets in the far corner
    waitClear(g, 12, 19, 5); useGad(g, L);                            // dash back to the mouth
    mv(g, R); mv(g, Dn); mv(g, Dn); mv(g, R); mv(g, L); mv(g, U); mv(g, U); mv(g, L);  // the two by the near wall
    goto(g, 21, 2); mv(g, R);                                         // door 2
    goto(g, 30, 1); goto(g, 23, 4);                                   // Stasis x2, above the arena mouth
    for (let t = 0; t < 30 && at(g, 25, 6).t === T.DRONE; t++) step(g, idle);
    useGad(g, -1);
    goto(g, 23, 6); goto(g, 26, 9); goto(g, 28, 9); goto(g, 30, 9); goto(g, 23, 6); goto(g, 23, 2);
    goto(g, 31, 2); mv(g, R); goto(g, 33, 1);                         // door 3, Shield
    gotoSafe(g, 38, 7); gotoSafe(g, 38, 10);
  }
});
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
