// Scaffolding that drew the Deep Core, levels 217-241, and wrote them to levels/*.txt. These mix every
// mechanic in the game. Re-running overwrites the files.
// Usage: node tools/design-batch-11.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = b => b.set(1, 1, '@').set(57, 22, 'X');
const pocket = (b, x, y, ch = 'S') => b.rect(x - 1, y, 3, 1, ' ').set(x, y, ch);

// 217 Deep Core: the descent begins; Lead, Gammas, ice and a fallout floor.
{
  const b = new Board(217, 'Deep Core', 60, 'Below the plant proper. Lead hangs thick, Gammas sleep in the walls, the lower floor is fallout and the way down is an ice chute. Nothing here is new; all of it is at once.');
  b.rink(28, 2, 3, 12).fallout(2, 18, 56, 4).pts([[5, 16], [52, 16]], 'p');
  for (const [x, y] of [[10, 6], [48, 8], [20, 12], [40, 14]]) pocket(b, x, y);
  b.spread('O', 50, { ok: both(ends, (x, y) => y < 18) }).spread('*', 70, { ok: both(ends, (x, y) => y < 18) });
  b.scatter('*', 12, { x0: 3, y0: 18, x1: 56, y1: 21, on: 'r' });
  finish(b).fit().save();
}

// 218 Sub-Level: belts over acid, with Alphas in the gaps.
{
  const b = new Board(218, 'Sub-Level', 45, 'Belts span the acid and Alphas patrol the gaps between them. A slip off a belt is the acid; a step into a gap at the wrong moment is an Alpha. The Pellets hang on shelves above.');
  b.pool(2, 8, 56, 14, 'a');
  for (const [x, dir] of [[3, 1], [22, 3], [41, 1]]) b.belt(x, 9, 16, dir).h(x, 10, 16, '#');
  b.lane(19, 8, 3, 'A').lane(38, 8, 3, 'A');
  b.h(2, 7, 56, '.').h(2, 8, 56, ' ');
  for (let x = 4; x < 56; x += 4) b.set(x, 6, '*');
  b.spread('*', 30, { ok: both(ends, (x, y) => y < 6) }).spread('O', 12, { ok: both(ends, (x, y) => y < 5) });
  b.h(2, 12, 56, '#').h(2, 13, 56, '.').rect(2, 14, 56, 8, '.');
  b.spread('*', 20, { ok: both(ends, (x, y) => y > 13) });
  b.pts([[3, 11], [57, 11]], ' ').pts([[3, 12], [57, 12]], '.');
  finish(b).fit().save();
}

// 219 Cold Fusion: Plutonium on ice; a slide can push a sphere into another.
{
  const b = new Board(219, 'Cold Fusion', 50, 'Plutonium on an ice floor. Iso slides, the spheres do not; a sphere pushed off the ice meets its neighbour at rest, and that is a fission blast beside you. Pair them from a distance.');
  b.rink(4, 4, 52, 16);
  b.scatter('P', 12, { on: 'I', ok: ends });
  b.scatter('*', 30, { on: 'I', ok: ends });
  b.spread('*', 20, { ok: ends });
  finish(b).fit().save();
}

// 220 Gamma Burst: lasers, mirrors, Gammas and Drones in a lit grid.
{
  const b = new Board(220, 'Gamma Burst', 45, 'A lit grid: lasers down every third column, mirrors at the crossings, Drones in the corners and Gammas in the lanes. The light is as good at killing them as you.');
  for (const x of [9, 21, 33, 45]) b.v(x, 2, 20, ' ').set(x, 2, 'i');
  for (const y of [6, 12, 18]) b.h(3, y, 54, ' ');
  for (const [x, y] of [[9, 6], [21, 12], [33, 18], [45, 6]]) b.set(x, y, (x + y) % 4 ? '/' : '\\');
  b.pts([[15, 6], [27, 12], [39, 18], [51, 12]], 'S').pts([[3, 20], [55, 3]], 'G');
  const off = (x, y) => ![9, 21, 33, 45].includes(x) && ![6, 12, 18].includes(y);
  b.spread('*', 70, { ok: both(ends, off) }).spread('O', 20, { ok: both(ends, off) }).set(4, 3, 'H');
  finish(b).fit().save();
}

// 221 Positron: Antipellets fall like Pellets; what lands on Iso is still fatal.
{
  const b = new Board(221, 'Positron', 50, 'Antimatter above, Pellets below, Lead in between. Every column you open rains something, and a falling Antipellet crushes just like Lead. Dig sideways.');
  for (let x = 3; x < 57; x += 3) { b.v(x, 2, 6, '!'); b.v(x, 15, 6, '*'); }
  b.spread('O', 40, { ok: both(ends, (x, y) => y > 7 && y < 15) }).spread('*', 20, { ok: both(ends, (x, y) => y > 7 && y < 15) });
  finish(b).fit().save();
}

// 222 Supercooled: coolant and ice; the pools creep over the rink.
{
  const b = new Board(222, 'Supercooled', 45, 'Sodium pools sit in the Graphite round the rink. Dig beside one and it wakes and creeps out over the ice after you; a blast clears a pool, and there are two red canisters for that.');
  b.rink(6, 4, 48, 15);
  for (const [x, y] of [[3, 5], [56, 5], [3, 16], [56, 16], [29, 2], [29, 21]]) b.pool(x, y, 1, 1, '~');
  b.scatter('*', 40, { on: 'I', ok: ends });
  b.pts([[3, 3], [56, 20]], 'd');
  b.spread('*', 20, { ok: ends });
  finish(b).fit().save();
}

// 223 Scintillator: dark, lasers and mirrors; the beams are the only light.
{
  const b = new Board(223, 'Scintillator', 45, 'Dark. The only light is the lasers, and where their beams go is where you must not be. Mirrors fold them; Lamps are scattered, and the Pellets lie along the beam lines.');
  b.head('dark: on');
  for (const y of [5, 11, 17]) b.h(3, y, 54, ' ').set(2, y, 'l');
  b.pts([[20, 5], [40, 11], [30, 17]], '\\').pts([[20, 8], [40, 14], [30, 20]], '/');
  for (const [x, y0, y1] of [[20, 6, 8], [40, 12, 14], [30, 18, 20]]) b.v(x, y0, y1 - y0 + 1, ' ');
  b.pts([[3, 3], [56, 3], [30, 13]], 'L');
  for (const y of [4, 10, 16]) for (let x = 6; x < 56; x += 5) b.set(x, y, '*');
  b.spread('*', 30, { ok: both(ends, (x, y) => ![4, 5, 10, 11, 16, 17].includes(y)) });
  finish(b).fit().save();
}

// 224 Magnetron: magnets, belts and Lead in a loop.
{
  const b = new Board(224, 'Magnetron', 45, 'Belts feed Lead to the magnets and the magnets hold it over the gaps. Break a line and the field lets go; the Gammas under the gaps are not expecting that.');
  for (const y of [5, 11, 17]) { b.belt(6, y + 1, 40, 1); b.set(50, y, 'M'); b.h(46, y, 4, ' '); b.pts([[8, y], [16, y], [24, y]], 'O'); b.set(48, y + 1, ' ').set(48, y + 2, ' '); pocket(b, 48, y + 3); }
  b.spread('*', 60, { ok: both(ends, (x, y) => (y % 6) > 2 && x < 45) });
  finish(b).fit().save();
}

// 225 Fuse Garden: fuses, hydrogen cells and orange canisters in a Graphite field.
{
  const b = new Board(225, 'Fuse Garden', 50, 'Fuse laid through the Graphite, hydrogen cells and orange canisters planted along it. Every blast you cause is three more; the Pellets are among the flowers, so pick before you light.');
  for (const y of [4, 9, 14, 19]) b.h(3, y, 54, ',');
  b.spread('o', 20, { ok: ends }).spread('F', 12, { ok: ends }).spread('*', 80, { ok: ends });
  b.pts([[3, 2], [56, 21]], 'd');
  finish(b).fit(0.6).save();
}

// 226 Airlock Chain: gated rooms on a limited air supply.
{
  const b = new Board(226, 'Airlock Chain', 45, 'Sealed sections, gated, on forty seconds of air; one switch per section and a tank behind each gate. Every switch flips every gate, so each section is one flip and one breath.');
  b.head('air: 40');
  for (let i = 0; i < 5; i++) { const x = 11 + i * 11; b.v(x, 1, 22, '#').set(x, 11, i % 2 ? 'q' : 'g'); b.set(x + 2, 11, 't'); b.set(x - 4, 4, 's'); }
  b.set(4, 18, 't');
  b.spread('*', 60, { ok: both(ends, (x, y) => (x - 11) % 11 !== 0) }).spread('O', 15, { ok: both(ends, (x, y) => (x - 11) % 11 !== 0) });
  finish(b).fit().save();
}

// 227 Pile Driver: Plutonium chutes with Lead above; the Lead pushes the spheres together.
{
  const b = new Board(227, 'Pile Driver', 50, 'Spheres at the bottom of chutes, Lead above. Lead rolling off a sphere lands beside it, and a sphere rolled onto another is critical. Keep your head out of the chutes.');
  for (let x = 6; x < 56; x += 8) { b.v(x, 3, 16, ' '); b.set(x, 19, 'P'); b.set(x + 1, 19, ' ').set(x - 1, 19, ' '); b.set(x, 4, 'O').set(x, 3, '.'); b.set(x - 1, 20, '#').set(x, 20, '#').set(x + 1, 20, '#'); b.set(x, 18, '.'); }
  b.spread('*', 60, { ok: both(ends, (x, y) => (x - 6) % 8 > 1 && y < 19) }).spread('P', 6, { ok: both(ends, (x, y) => (x - 6) % 8 > 1 && y < 18) });
  finish(b).fit().save();
}

// 228 Lead Shield: fallout under a Lead roof; the roof is the only shelter.
{
  const b = new Board(228, 'Lead Shield', 45, 'A fallout floor under a roof of Lead. Every ball you drop into the fallout is a clean cell to stand on. The Iodine is on the roof.');
  b.fallout(2, 10, 56, 12);
  for (let x = 3; x < 57; x += 2) b.set(x, 9, 'O');
  b.scatter('*', 40, { x0: 3, y0: 11, x1: 56, y1: 21, on: 'r' });
  b.pts([[10, 4], [30, 4], [50, 4], [20, 7], [40, 7]], 'p');
  b.spread('*', 20, { ok: both(ends, (x, y) => y < 9) });
  finish(b).fit().save();
}

// 229 Mirror Maze: a maze with lasers down the long corridors and mirrors to carry them round.
{
  const b = new Board(229, 'Mirror Maze', 40, 'A maze, and the long corridors are laser lanes. Every mirror you push sends a beam somewhere new; most of the time that is somewhere you were about to go.', { fill: '#' });
  b.maze(' ');
  b.pts([[1, 1], [57, 21], [29, 11]], '.');
  b.scatter('l', 3, { on: ' ', ok: both(ends, (x, y) => y % 2 === 1 && b.get(x - 1, y) === '#' && b.get(x, y - 1) === '#' && b.get(x, y + 1) === '#' && b.get(x + 1, y) === ' ') });
  // Mirrors sit on corridor corners, where they turn a beam from one corridor into the next. The maze
  // is a tree, so each one cuts it: open walls until everything can be walked round with the mirrors
  // and emitters in place (pushing a mirror is then a choice, never the only way through).
  const corner = (x, y) => {
    const o = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.get(x + dx, y + dy) === ' ');
    return o.length === 2 && !(o[0][0] === -o[1][0] && o[0][1] === -o[1][1]);
  };
  b.scatter('/', 6, { on: ' ', ok: both(ends, corner) }).scatter('\\', 6, { on: ' ', ok: both(ends, corner) });
  b.reconnect('/\\l');
  b.scatter('*', 55, { on: ' ', ok: both(ends, (x, y) => b.get(x, y + 1) !== ' ') });
  b.rect(1, 1, 3, 2, '.').rect(55, 21, 3, 2, '.');
  finish(b).fit(0.7).save();
}

// 230 Hydrogen Economy: hydrogen cells under laser lines, Pellets in cask stores above.
{
  const b = new Board(230, 'Hydrogen Economy', 45, 'Cells parked under the beams. Push one along the line and the next pulse bursts it under the cask store; the stores hold the fuel, and the beam holds you off.');
  for (const [x, y] of [[8, 8], [24, 8], [40, 8], [16, 18], [32, 18], [48, 18]]) b.hydroStore(x, y);
  for (const y of [8, 18]) b.set(2, y, 'l');
  b.spread('*', 35, { ok: both(ends, (x, y) => y < 3 || (y > 9 && y < 13) || y > 19) });
  finish(b).fit().save();
}

// 231 Alpha Storm: Alpha lanes both ways, Shields to spend on them.
{
  const b = new Board(231, 'Alpha Storm', 50, 'Alphas in every lane. There are Shields; a Shield takes one Alpha and dies, and the Alpha dies with it. Spend them where the lanes cross.');
  for (const y of [4, 8, 12, 16, 20]) b.lane(3, y, 54, 'A');
  for (const x of [10, 20, 30, 40, 50]) b.lane(x, 2, 20, 'V');
  b.pts([[5, 2], [55, 6], [15, 22], [45, 22]], 'H');
  const off = (x, y) => ![4, 8, 12, 16, 20].includes(y) && ![10, 20, 30, 40, 50].includes(x);
  b.spread('*', 70, { ok: both(ends, off) });
  finish(b).fit().save();
}

// 232 Pressure Cooker: coolant, hydrogen and air; the clock runs on everything.
{
  const b = new Board(232, 'Pressure Cooker', 45, 'Fifty seconds of air, coolant pools that creep and hydrogen cells that burst. Tanks beside the pools; cells beside the tanks. Breathe, blast, move.');
  b.head('air: 50');
  for (const [x, y] of [[8, 5], [28, 5], [48, 5], [18, 15], [38, 15]]) { b.pool(x, y, 2, 2, '~'); b.set(x + 3, y, 't'); b.h(x + 5, y + 1, 3, ' ').set(x + 5, y + 1, 'F').h(x + 5, y, 3, '#'); }
  b.spread('*', 60, { ok: ends }).spread('O', 15, { ok: ends });
  finish(b).fit().save();
}

// 233 Antimatter Trap: antipellets on switches; gates everywhere.
{
  const b = new Board(233, 'Antimatter Trap', 40, 'Gates across every corridor and Antipellets stacked over the switches. Dig under a stack and the Antipellet lands on the plate: every gate flips. Use it, or go round.');
  for (const x of [15, 30, 45]) b.v(x, 1, 22, '#').pts([[x, 6], [x, 17]], 'g');
  for (const [x, y] of [[8, 12], [22, 12], [38, 12], [52, 12]]) { b.set(x, y, 's'); b.v(x, y - 4, 3, '!').set(x, y - 1, ' '); }
  b.spread('*', 55, { ok: both(ends, (x, y) => ![15, 30, 45].includes(x)) }).spread('O', 10, { ok: both(ends, (x, y) => ![15, 30, 45].includes(x) && y > 13) });
  finish(b).fit().save();
}

// 234 Spallation: Neutrons penned behind casks at the ends of long galleries; one neutron through the cask
// splits the Neutron behind it. Drones sleep in the walls by the far ends.
{
  const b = new Board(234, 'Spallation', 30, 'Five Neutrons penned behind casks at the ends of the galleries. One neutron through a cask splits the Neutron behind it: nine Pellets a time. Three guns, three rounds each, and the Drones in the far wall come out the moment you dig past them.');
  for (const y of [3, 7, 11, 15, 19]) {
    b.h(6, y, 45, ' ').set(6, y, '.').h(6, y - 1, 45, '#').h(6, y + 1, 45, '#');
    b.h(51, y - 2, 3, '#').h(51, y + 2, 3, '#').v(51, y - 1, 3, 'R').v(52, y - 1, 3, ' ').set(52, y, 'e').v(53, y - 1, 3, '#');
  }
  b.pts([[3, 5], [3, 13], [3, 21]], 'N');
  for (const [x, y] of [[56, 5], [56, 17]]) b.rect(x - 1, y, 3, 1, ' ').set(x, y, 'G');
  b.spread('*', 20, { ok: both(ends, (x, y) => x < 5 || x > 54) });
  finish(b).save(); // the penned Neutrons are the supply; the reach check cannot see them
}

// 235 Half-Life Hall: isotopes behind gates and tunnels.
{
  const b = new Board(235, 'Half-Life Hall', 50, 'The isotopes are locked in: gates on some rooms, bare concrete on others. Fifty seconds; the switch is at the far end and the Quantum tunnels are near it.');
  for (const [x, y, door] of [[6, 4, 'g'], [22, 4, '#'], [38, 4, 'g'], [14, 14, '#'], [30, 14, 'g'], [46, 14, '#']]) { b.box(x, y, 8, 5, '#').set(x, y + 2, door); b.rect(x + 1, y + 1, 6, 3, 'h').set(x + 1, y + 2, ' '); }
  b.set(55, 11, 's').pts([[52, 8], [52, 16]], 'Q');
  b.spread('*', 25, { ok: both(ends, outside([5, 3, 10, 7], [21, 3, 10, 7], [37, 3, 10, 7], [13, 13, 10, 7], [29, 13, 10, 7], [45, 13, 10, 7])) });
  finish(b).fit().save();
}

// 236 Flooded Section: acid rising in steps, belts the only dry road.
{
  const b = new Board(236, 'Flooded Section', 40, 'The section is flooded with acid and the belts are the only road. They run both ways on different levels; where a belt ends over acid, you had better have stepped off.');
  b.pool(2, 3, 56, 19, 'a');
  for (const [x, y, w, dir] of [[2, 6, 20, 1], [24, 6, 20, 3], [10, 12, 20, 1], [34, 12, 20, 3], [2, 18, 30, 1], [36, 18, 20, 3]]) { b.belt(x, y, w, dir); b.h(x, y - 3, w, '.'); b.h(x, y - 2, w, '.'); b.scatter('*', 4, { x0: x, y0: y - 3, x1: x + w - 1, y1: y - 3 }); }
  b.rect(1, 1, 8, 3, '.').rect(50, 20, 8, 3, '.').rect(22, 3, 2, 3, '.').rect(44, 9, 2, 3, '.').rect(30, 15, 4, 3, '.').rect(55, 15, 2, 7, '.');
  finish(b).fit().save();
}

// 237 Core Sample: a Plutonium core in a magnet field, under fallout.
{
  const b = new Board(237, 'Core Sample', 55, 'Plutonium set round four magnets on a fallout floor. Open any line and the field draws the spheres in; where two arrive, nine Pellets. The dose is the clock.');
  b.fallout(2, 2, 56, 20);
  for (const [x, y] of [[15, 6], [45, 6], [15, 17], [45, 17]]) { b.set(x, y, 'M'); b.pts([[x - 5, y], [x + 5, y], [x, y - 4], [x, y + 4]], 'P'); for (const [dx, dy] of [[-4, 0], [4, 0], [0, -3], [0, 3]]) b.set(x + dx, y + dy, '.'); }
  b.pts([[2, 2], [57, 2], [2, 21], [57, 21], [30, 11]], 'p');
  b.scatter('*', 30, { on: 'r', ok: ends });
  finish(b).fit().save();
}

// 238 Snowblind: dark, ice and Alphas.
{
  const b = new Board(238, 'Snowblind', 45, 'Dark and ice. A slide in the dark ends wherever it ends; the Alphas run their lanes whether you see them or not. Lamps on the near side, Pellets on the far.');
  b.head('dark: on');
  b.rink(10, 3, 40, 18);
  for (const x of [20, 30, 40]) b.lane(x, 2, 20, 'V');
  b.pts([[3, 3], [5, 10], [3, 18]], 'L');
  b.scatter('*', 40, { on: 'I', ok: both(ends, (x, y) => ![20, 30, 40].includes(x)) });
  b.spread('*', 15, { ok: both(ends, (x, y) => x > 50) });
  finish(b).fit().save();
}

// 239 Overpressure: hydrogen, fuses and switches; a burst throws every gate.
{
  const b = new Board(239, 'Overpressure', 45, 'Hydrogen cells wired with fuse, and the gates are on switches under the cells. A burst drops the cell\'s cask onto a switch; one fuse lights all of them. Think before you strike.');
  for (const x of [20, 40]) b.v(x, 1, 22, '#').pts([[x, 5], [x, 17]], 'g');
  for (const [x, y] of [[10, 10], [30, 10], [50, 10]]) { b.set(x, y + 4, 's').v(x, y + 1, 3, ' ').set(x, y, 'O').set(x, y - 1, 'F').set(x, y - 2, '#').h(x - 1, y - 2, 3, ',').set(x - 1, y - 1, '#').set(x + 1, y - 1, '#'); }
  b.h(3, 8, 54, ',');
  b.pts([[3, 3], [56, 20]], 'd');
  b.spread('*', 60, { ok: both(ends, (x, y) => ![20, 40].includes(x) && y !== 8 && Math.abs(y - 10) > 4) });
  finish(b).fit().save();
}

// 240 Terminal Phase: every enemy, every hazard, air and dark.
{
  const b = new Board(240, 'Terminal Phase', 60, 'The penultimate floor. Dark, sixty seconds of air, Gammas, Drones and Alphas, acid below and fallout above. Take the Lamps, take the tanks, take the Shield; take nothing for granted.');
  b.head('dark: on').head('air: 60');
  b.fallout(2, 2, 56, 3).pool(2, 20, 56, 2, 'a');
  for (const y of [8, 14]) b.lane(3, y, 54, 'A');
  for (const [x, y] of [[12, 11], [48, 11], [30, 17]]) pocket(b, x, y);
  for (const [x, y] of [[5, 18], [52, 6]]) pocket(b, x, y, 'G');
  b.pts([[4, 5], [30, 5], [55, 5]], 'L').pts([[10, 12], [40, 12], [25, 18]], 't').set(56, 19, 'H').pts([[20, 6], [36, 6]], 'p');
  b.scatter('*', 12, { x0: 3, y0: 2, x1: 56, y1: 4, on: 'r' });
  b.spread('*', 60, { ok: both(ends, (x, y) => y > 4 && y < 20 && ![8, 14].includes(y)) }).spread('O', 20, { ok: both(ends, (x, y) => y > 4 && y < 19 && ![8, 9, 14, 15].includes(y)) });
  finish(b).fit().save();
}

// 241 Event Horizon: the last level. Everything, and the Reactor sealed behind gates and concrete.
{
  const b = new Board(241, 'Event Horizon', 80, 'The last floor of the plant. Everything you have learned is here, and the Reactor is sealed: a gate, then concrete, then a Plutonium pit you must fire yourself. Fuel the core. Don\'t go critical.');
  b.rink(3, 3, 12, 4).belt(18, 5, 16, 1).pts([[20, 4], [28, 4]], 'O').set(36, 4, 'M').h(35, 4, 1, ' ');
  b.h(3, 9, 40, ' ').set(2, 9, 'l').set(42, 9, '\\').v(42, 10, 5, ' ').set(42, 14, '\\').h(43, 14, 8, ' '); // a beam coming down turns right off a backslash
  b.lane(20, 12, 14, 'A').lane(50, 2, 6, 'V');
  b.pool(4, 13, 8, 2, 'a').pool(30, 17, 3, 2, '~').fallout(44, 17, 12, 4).set(43, 20, 'p');
  b.h(5, 19, 20, ',').pts([[10, 18], [20, 18]], 'o');
  b.hydroStore(14, 16);
  b.pts([[6, 7], [50, 7], [30, 20]], 'H').pts([[12, 11], [48, 11]], 'N').set(8, 21, 'Z');
  // The Quantum tunnel waits inside the gate room, so a Neutron gun picked up on the way cannot replace it before the concrete.
  b.box(50, 18, 9, 5, '#').set(50, 20, 'g').rect(51, 19, 7, 3, '.').set(51, 19, 'Q').v(54, 19, 3, '#').set(56, 20, 'P').set(52, 20, 'P').set(57, 22, 'X');
  b.set(38, 12, 's');
  b.spread('h', 10, { ok: ends }).spread('!', 8, { ok: ends });
  b.spread('*', 70, { ok: both(ends, outside([2, 2, 14, 6], [17, 3, 20, 4], [34, 3, 4, 3], [2, 8, 42, 3], [41, 9, 12, 7], [19, 11, 16, 3], [49, 1, 3, 8], [3, 12, 10, 4], [29, 16, 5, 4], [43, 16, 14, 6], [4, 18, 22, 3], [12, 12, 8, 6], [49, 17, 10, 6])) });
  b.spread('O', 20, { ok: both(ends, outside([2, 2, 14, 6], [17, 3, 20, 4], [2, 8, 42, 3], [41, 9, 12, 7], [19, 11, 16, 3], [49, 1, 3, 8], [3, 12, 10, 4], [29, 16, 5, 4], [43, 16, 14, 6], [4, 17, 22, 4], [12, 12, 8, 6], [49, 17, 10, 6])) });
  b.set(1, 1, '@');
  b.fit().save();
}
