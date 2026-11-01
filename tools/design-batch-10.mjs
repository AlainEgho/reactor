// Scaffolding that drew the Nuclear Wing's generated levels, 198-216, and wrote them to levels/*.txt.
// The hand-drawn introductions (192-197) are not touched. Re-running overwrites the generated files.
// Usage: node tools/design-batch-10.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = b => b.set(1, 1, '@').set(57, 22, 'X');

// 198 Breeder Pit: Plutonium spheres on ledges over pits with more spheres in them.
{
  const b = new Board(198, 'Breeder Pit', 45, 'Plutonium on the ledges, Plutonium in the pits. Push a sphere off its ledge and it lands beside the one below: critical, and nine Pellets for you. Stand well back when it goes.');
  for (const [x, y] of [[8, 5], [24, 5], [40, 5], [16, 13], [32, 13], [48, 13]]) {
    b.h(x - 3, y, 7, ' ').set(x - 3, y, 'P').h(x - 4, y + 1, 4, '#').set(x, y + 1, ' ').set(x, y + 2, ' ').h(x - 1, y + 3, 3, '#').set(x + 1, y + 2, 'P').set(x + 1, y + 1, '#');
    b.set(x - 4, y, '.');
  }
  b.spread('*', 30, { ok: both(ends, outside([3, 4, 12, 4], [19, 4, 12, 4], [35, 4, 12, 4], [11, 12, 12, 4], [27, 12, 12, 4], [43, 12, 12, 4])) });
  b.spread('O', 15, { ok: both(ends, outside([3, 3, 12, 6], [19, 3, 12, 6], [35, 3, 12, 6], [11, 11, 12, 6], [27, 11, 12, 6], [43, 11, 12, 6])) });
  finish(b).fit().save();
}

// 199 Isotope Store: isotope pellets far from the start, real ones close; the clock decides.
{
  const b = new Board(199, 'Isotope Store', 60, 'The isotopes are stored at the far end and they are half of what you need. Fifty seconds from the start they are gone; the ordinary Pellets near the door will keep.');
  b.spread('*', 30, { ok: both(ends, (x, y) => x < 25) }).spread('h', 22, { ok: both(ends, (x, y) => x > 35) }).spread('O', 25, { ok: ends });
  finish(b).fit().save();
}

// 200 Firing Range: Neutron guns and lanes of Gammas and Neutrons to shoot down.
{
  const b = new Board(200, 'Firing Range', 36, 'A firing range. Each lane holds two cask barriers and, behind them, a Neutron; a neutron breaks a cask and splits the Neutron into Pellets. Take the gun, open the plug, and fire. Three rounds each: no round to spare.');
  for (const y of [4, 8, 12, 16, 20]) { b.h(6, y, 50, ' ').set(5, y, 'N').set(6, y, '.').pts([[20, y], [40, y]], 'R'); b.h(6, y - 1, 50, '#').h(6, y + 1, 50, '#'); b.rect(52, y - 1, 3, 3, ' ').set(53, y, 'e').set(55, y, '#'); }
  b.v(3, 2, 20, ' ').v(4, 2, 20, '.');
  b.spread('*', 12, { ok: both(ends, (x, y) => x < 3 || y < 3 || y > 21) });
  finish(b).fit().save();
}

// 201 Tunnel Vision: concrete cells with Pellets inside; the Quantum tunnel is the only way in.
{
  const b = new Board(201, 'Tunnel Vision', 40, 'Concrete cells, each with Pellets inside and no door. The Quantum tunnel takes Iso through one wall when there is room beyond; three charges a pickup, and they are scattered.');
  for (const [x, y] of [[6, 4], [18, 4], [30, 4], [42, 4], [6, 13], [18, 13], [30, 13], [42, 13]]) { b.box(x, y, 8, 6, '#').rect(x + 1, y + 1, 6, 4, ' ').rect(x + 2, y + 4, 4, 1, '*'); }
  b.pts([[3, 10], [15, 10], [27, 10], [39, 10], [51, 10], [12, 20], [36, 20]], 'Q');
  b.spread('*', 20, { ok: both(ends, outside([5, 3, 10, 8], [17, 3, 10, 8], [29, 3, 10, 8], [41, 3, 10, 8], [5, 12, 10, 8], [17, 12, 10, 8], [29, 12, 10, 8], [41, 12, 10, 8])) });
  finish(b).fit().save();
}

// 202 Deep Vacuum: a big open dig on a tight air supply; tanks along the way.
{
  const b = new Board(202, 'Deep Vacuum', 55, 'A big dig in vacuum: forty seconds of air to start, thirty more from every tank. Plan a route that threads the tanks, and do not stop to admire the Lead.');
  b.head('air: 40');
  b.spread('t', 10, { ok: ends }).spread('*', 80, { ok: ends }).spread('O', 35, { ok: ends });
  finish(b).fit().save();
}

// 203 Dark Matter: lights out on a floor of Lead and Gamma pockets.
{
  const b = new Board(203, 'Dark Matter', 50, 'Lights out. You see three cells; every Lamp adds two. Lead hangs in the dark above you and Gammas sleep in sealed pockets, so listen for the Geiger and dig slowly.');
  b.head('dark: on');
  b.spread('L', 4, { ok: ends }).spread('*', 70, { ok: ends }).spread('O', 40, { ok: ends });
  for (const [x, y] of [[12, 6], [36, 9], [20, 16], [48, 18]]) b.rect(x, y, 4, 1, ' ').set(x, y, 'S');
  finish(b).fit().save();
}

// 204 Fast Breeder: magnets draw Plutonium together.
{
  const b = new Board(204, 'Fast Breeder', 45, 'Magnets and Plutonium. A magnet pulls Plutonium like Lead; two spheres drawn to the same magnet meet, and that is critical mass. Open the lines from a distance.');
  for (const y of [4, 11, 18]) { b.h(3, y, 54, ' ').set(29, y, 'M').pts([[12, y], [46, y]], 'P').h(3, y + 1, 54, '#'); b.set(20, y, '.').set(38, y, '.'); }
  b.spread('*', 50, { ok: both(ends, (x, y) => ![3, 4, 5, 10, 11, 12, 17, 18, 19].includes(y)) }).spread('O', 15, { ok: both(ends, (x, y) => ![3, 4, 5, 10, 11, 12, 17, 18, 19].includes(y)) });
  finish(b).fit().save();
}

// 205 Half Light: isotopes in the dark.
{
  const b = new Board(205, 'Half Light', 45, 'Dark, and most of the fuel is isotope. You cannot see where it is and you have fifty seconds; the Lamps are near the door, so take them first and then run.');
  b.head('dark: on');
  b.pts([[4, 3], [3, 6]], 'L');
  b.spread('h', 26, { ok: ends }).spread('*', 20, { ok: ends }).spread('O', 20, { ok: ends });
  finish(b).fit().save();
}

// 206 Cross Section: Plutonium behind Graphite, a Neutron gun to split it from a distance.
{
  const b = new Board(206, 'Cross Section', 45, 'Plutonium set in the walls. A neutron splits it from any distance and the Pellets rain into the corridor: induced fission, no pushing required. Five rounds, six spheres; choose.');
  for (const y of [5, 12, 19]) { b.h(4, y, 52, ' ').set(3, y, 'N'); b.pts([[20, y], [40, y]], 'P'); b.h(4, y + 1, 52, '#').h(4, y - 1, 52, '#'); b.set(2, y, '.'); }
  b.set(3, 12, 'N').set(3, 5, '.');
  b.spread('*', 30, { ok: both(ends, (x, y) => ![4, 5, 6, 11, 12, 13, 18, 19, 20].includes(y)) });
  finish(b).fit().save();
}

// 207 Barrier: walls of Lead and concrete; tunnel through what you cannot push.
{
  const b = new Board(207, 'Barrier', 40, 'Walls of Lead three high, and concrete where there is no Lead. You cannot push a ball with another behind it; the Quantum tunnel goes through either, one cell at a time.');
  for (const x of [12, 24, 36, 48]) { b.v(x, 2, 21, 'O'); b.pts([[x, 8], [x, 16]], '#'); }
  b.pts([[4, 4], [16, 12], [28, 6], [40, 18], [52, 4]], 'Q');
  b.spread('*', 50, { ok: both(ends, (x, y) => x % 12 !== 0) });
  finish(b).fit().save();
}

// 208 Pressure Suit: Gamma halls on limited air.
{
  const b = new Board(208, 'Pressure Suit', 40, 'Three Gamma halls, a tank in each, and thirty seconds of air at the door. The Gammas hug the walls; cross the middle, grab the tank, and keep moving.');
  b.head('air: 30');
  for (const [x, y] of [[4, 3], [22, 3], [40, 3], [12, 13], [32, 13]]) { b.rect(x, y, 16, 7, ' ').box(x - 1, y - 1, 18, 9, '#').set(x - 1, y + 3, '.').set(x + 16, y + 3, '.'); b.set(x, y, 'S').set(x + 15, y + 6, 'S'); b.set(x + 7, y + 3, 't'); b.rect(x + 3, y + 6, 10, 1, '*'); }
  b.spread('*', 20, { ok: both(ends, (x, y) => y === 1 || y === 21 || y === 11) }).set(3, 1, 't');
  finish(b).fit().save();
}

// 209 Night Shift: Alpha lanes in the dark.
{
  const b = new Board(209, 'Night Shift', 45, 'Dark, and the Alphas are still running their lanes. You hear nothing of them; you see them only when they are close. Light helps, so the Lamps come first.');
  b.head('dark: on');
  for (const y of [5, 11, 17]) b.lane(3, y, 54, 'A');
  for (const x of [15, 30, 45]) b.lane(x, 2, 20, 'V');
  b.pts([[4, 2], [2, 8], [50, 20]], 'L');
  const off = (x, y) => ![5, 11, 17].includes(y) && ![15, 30, 45].includes(x);
  b.spread('*', 60, { ok: both(ends, off) });
  finish(b).fit().save();
}

// 210 Chain Lightning: Plutonium joined by fuse; one spark and it all goes.
{
  const b = new Board(210, 'Chain Lightning', 60, 'The spheres are wired together with fuse. A lit fuse splits every Plutonium it reaches, and every split is nine Pellets; light it, hide, and come back for the harvest.');
  b.h(3, 6, 54, ',').h(3, 12, 54, ',').h(3, 18, 54, ',');
  for (const y of [6, 12, 18]) for (let x = 8; x < 56; x += 8) b.set(x, y - 1, 'P');
  b.pts([[3, 3], [56, 3]], 'd');
  b.spread('*', 30, { ok: both(ends, (x, y) => ![5, 6, 11, 12, 17, 18].includes(y)) });
  finish(b).fit().save();
}

// 211 Spent Fuel: isotopes lying in fallout.
{
  const b = new Board(211, 'Spent Fuel', 45, 'Spent fuel: the isotopes lie in the fallout they made. Each run into the field costs dose and the isotopes cost time; the Iodine is at the ends of the field.');
  b.fallout(2, 6, 56, 12).scatter('h', 24, { x0: 3, y0: 6, x1: 56, y1: 17, on: 'r' });
  b.pts([[2, 4], [57, 4], [2, 20], [57, 20]], 'p');
  b.spread('*', 25, { ok: both(ends, (x, y) => y < 6 || y > 17) });
  finish(b).fit().save();
}

// 212 Target Practice: cask stores behind Gamma lanes; the gun opens both.
{
  const b = new Board(212, 'Target Practice', 40, 'Pellet stores in casks at the end of Gamma lanes. One shot takes the Gamma, the next breaks the cask: two rounds a store and the guns hold three, so pick up every gun you pass.');
  for (const y of [3, 7, 11, 15, 19]) { b.h(6, y, 46, ' ').set(28, y, 'S').rect(52, y - 1, 3, 3, 'R').set(53, y, '*').h(6, y - 1, 46, '#').h(6, y + 1, 46, '#'); b.set(5, y, '.'); }
  b.pts([[3, 3], [3, 11], [3, 19], [57, 2], [57, 14]], 'N');
  b.spread('*', 20, { ok: both(ends, (x, y) => x < 5 || x > 55) });
  finish(b).fit().save();
}

// 213 Quantum Leap: gates with no switches on this side; tunnel through to the switch.
{
  const b = new Board(213, 'Quantum Leap', 40, 'The switches are in sealed rooms. The Quantum tunnel gets you in; every switch flips every gate, so plan which doors you want open when you come back out.');
  for (const [x, y] of [[6, 4], [26, 4], [46, 4], [16, 14], [36, 14]]) { b.box(x, y, 6, 5, '#').rect(x + 1, y + 1, 4, 3, ' ').set(x + 2, y + 2, 's'); }
  for (const [x, y] of [[14, 6], [34, 6], [54, 6], [24, 16], [44, 16]]) { b.box(x, y - 2, 4, 5, '#').set(x, y, 'g').rect(x + 1, y - 1, 2, 3, '*').set(x + 1, y, ' '); }
  b.pts([[3, 3], [3, 12], [20, 20], [50, 20]], 'Q');
  b.spread('*', 30, { ok: both(ends, outside([5, 3, 8, 7], [25, 3, 8, 7], [45, 3, 8, 7], [15, 13, 8, 7], [35, 13, 8, 7], [13, 3, 6, 7], [33, 3, 6, 7], [53, 3, 6, 7], [23, 13, 6, 7], [43, 13, 6, 7])) });
  finish(b).fit().save();
}

// 214 Last Breath: ice and air; a slide is fast, and fast is what you need.
{
  const b = new Board(214, 'Last Breath', 30, 'Thirty-five seconds of air and a floor of ice. Slides are the fastest way across; the tanks sit at the ends of the long runs, so line them up.');
  b.head('air: 35');
  for (const y of [4, 9, 14, 19]) { b.rink(3, y, 54, 1); b.set(57, y, 't'); b.set(2, y, 't'); }
  b.spread('*', 60, { ok: both(ends, (x, y) => ![4, 9, 14, 19].includes(y)) });
  b.scatter('*', 12, { on: 'I', ok: ends });
  finish(b).fit(0.6).save();
}

// 215 Pitch Black: dark, Drones hunting, Lamps to find them first.
{
  const b = new Board(215, 'Pitch Black', 45, 'Drones in the dark. They hunt by where you are, not by what they see; you see nothing until they are on you. Find the Lamps, keep to the Graphite, and leave them no open space.');
  b.head('dark: on');
  for (const [x, y] of [[10, 5], [50, 5], [30, 11], [10, 18], [50, 18]]) b.rect(x - 1, y, 3, 1, ' ').set(x, y, 'G');
  b.pts([[5, 2], [2, 6], [30, 2], [56, 12]], 'L').pts([[8, 10], [40, 20]], 'Z');
  b.spread('*', 60, { ok: ends }).spread('O', 20, { ok: ends });
  finish(b).fit().save();
}

// 216 Nuclear Finals: everything in the wing at once, in the dark, on air.
{
  const b = new Board(216, 'Nuclear Finals', 60, 'Everything the Nuclear Wing taught, in the dark, on sixty seconds of air: Plutonium, isotopes, the gun, the tunnel, the tanks and the Lamps. The Reactor is walled in; you know what to do.');
  b.head('dark: on').head('air: 60');
  b.pts([[4, 2], [30, 12]], 'L').pts([[20, 4], [40, 16], [10, 20]], 't').pts([[15, 8], [45, 6]], 'N').pts([[50, 20], [25, 18]], 'Q');
  b.h(6, 10, 48, ' ').pts([[20, 10], [34, 10]], 'P').set(6, 10, 'l').set(12, 10, '.').set(27, 10, '.').h(6, 11, 48, '#');
  b.box(52, 17, 7, 6, '#').rect(53, 18, 5, 4, '.').set(57, 22, 'X');
  b.spread('h', 14, { ok: both(ends, (x, y) => y < 9) }).spread('*', 50, { ok: both(ends, outside([5, 9, 50, 3], [51, 16, 8, 7])) }).spread('O', 20, { ok: both(ends, outside([5, 8, 50, 4], [51, 16, 8, 7])) });
  b.set(1, 1, '@');
  b.fit().save();
}
