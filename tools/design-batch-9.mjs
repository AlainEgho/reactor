// Scaffolding that drew the Chemistry Wing's generated levels, 173-191, and wrote them to levels/*.txt.
// The hand-drawn introductions (167-172) are not touched. Re-running overwrites the generated files.
// Usage: node tools/design-batch-9.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);
const finish = b => b.set(1, 1, '@').set(57, 22, 'X');

// 173 Acid Rain: acid trenches under ledges of Lead; the Pellets are on the ledges.
{
  const b = new Board(173, 'Acid Rain', 50, 'Acid trenches run under every ledge. Lead that goes over the edge is gone for good, and so is Iso; dig along the ledges and let the balls drop where you want them lost.');
  for (const y of [5, 11, 17]) { b.pool(3, y + 1, 54, 1, 'a'); b.h(3, y, 54, '.'); for (let x = 5; x < 56; x += 7) b.set(x, y, 'O'); }
  b.spread('*', 70, { ok: both(ends, (x, y) => y % 6 !== 0) }).spread('O', 20, { ok: both(ends, (x, y) => y % 6 !== 0) });
  finish(b).fit().save();
}

// 174 Fuse Box: a web of fuses through the Graphite joins orange canisters and cask stores.
{
  const b = new Board(174, 'Fuse Box', 45, 'Fuses run through the Graphite from canister to canister. One blast anywhere on the web goes everywhere the fuse goes; cut the branches you need to keep, then light the rest from a distance.');
  for (const y of [4, 12, 20]) b.h(3, y, 54, ',');
  for (const x of [12, 30, 48]) b.v(x, 4, 17, ',');
  for (const [x, y] of [[8, 5], [20, 3], [40, 5], [52, 11], [6, 13], [24, 13], [36, 19], [16, 21], [44, 21]]) b.set(x, y, 'o');
  for (const [x, y] of [[20, 7], [40, 8], [8, 16], [50, 16]]) b.rect(x - 1, y - 1, 3, 3, 'R').set(x, y, '*');
  b.pts([[3, 2], [56, 2]], 'd');
  b.spread('*', 50, { ok: both(ends, (x, y) => ![4, 12, 20].includes(y) && ![12, 30, 48].includes(x)) });
  finish(b).fit().save();
}

// 175 Sodium Pools: coolant pools buried in the Graphite with Pellet caches beside them.
{
  const b = new Board(175, 'Sodium Pools', 50, 'Pools of liquid sodium lie in the Graphite, and the Pellets are often right beside them. Dig next to a pool and it starts to creep after you; it swallows Lead that falls in, and a blast clears it.');
  for (const [x, y] of [[8, 4], [24, 6], [42, 4], [14, 14], [34, 16], [50, 13]]) { b.pool(x, y, 3, 2, '~'); b.rect(x - 2, y + 2, 7, 1, '*'); }
  b.pts([[20, 10], [40, 11]], 'd');
  b.spread('*', 45, { ok: ends }).spread('O', 25, { ok: ends });
  finish(b).fit().save();
}

// 176 Balloon Bay: hydrogen cells under low ceilings beside shafts up to cask stores.
{
  const b = new Board(176, 'Balloon Bay', 40, 'Hydrogen cells parked under low ceilings, each beside a shaft up to a sealed cask store. Push a cell into its shaft and it does the rest; mind the ones with Lead above the store.');
  for (const [x, y] of [[6, 8], [18, 8], [30, 8], [42, 8], [54, 8], [12, 18], [24, 18], [36, 18], [48, 18]]) b.hydroStore(x, y);
  b.spread('*', 35, { ok: both(ends, (x, y) => (y < 3 || (y > 9 && y < 13) || y > 19)) }).spread('O', 15, { ok: both(ends, (x, y) => y < 3 || y > 19) });
  finish(b).fit().save();
}

// 177 Antimatter Field: real Pellets and Antipellets mixed through the floor.
{
  const b = new Board(177, 'Antimatter Field', 60, 'Half of what glows here is antimatter. An Antipellet is violet with a minus on it, and taking one undoes a Pellet; pick your way, and snap what you are not sure of from a distance.');
  b.spread('*', 90, { ok: ends }).spread('!', 60, { ok: ends }).spread('O', 20, { ok: ends });
  finish(b).fit().save();
}

// 178 Fallout Zone: fallout fields cross the floor, iodine stashed between them.
{
  const b = new Board(178, 'Fallout Zone', 50, 'Three bands of fallout cross the floor. Each one is narrow enough to walk straight over on a clean dose; the Pellets inside the bands are another matter, so keep the Iodine for those.');
  for (const y of [5, 11, 17]) { b.fallout(2, y, 56, 3); b.scatter('*', 6, { x0: 3, y0: y, x1: 56, y1: y + 2, on: 'r' }); }
  b.pts([[10, 9], [40, 9], [20, 15], [50, 15], [30, 3], [8, 21]], 'p');
  b.spread('*', 45, { ok: both(ends, (x, y) => y % 6 < 2 || y % 6 > 4) }).spread('O', 15, { ok: both(ends, (x, y) => y % 6 < 2 || y % 6 > 4) });
  finish(b).fit().save();
}

// 179 Chemical Plant: acid vats with fuses running between them and canisters on the rims.
{
  const b = new Board(179, 'Chemical Plant', 45, 'Vats of acid with canisters on their rims and fuses between them. A blast on a rim tips what stands there into the acid; keep the Pellet shelves out of it.');
  for (const [x, y] of [[6, 6], [26, 6], [46, 6], [16, 15], [36, 15]]) {
    b.pool(x, y, 8, 3, 'a').h(x - 1, y - 1, 10, '.').set(x - 1, y - 1, 'o').set(x + 8, y - 1, 'o');
    b.h(x, y + 3, 8, '#').rect(x + 1, y + 4, 6, 1, '*');
  }
  b.h(2, 4, 56, ',').h(2, 13, 56, ',');
  b.pts([[2, 2], [57, 2]], 'd');
  b.spread('*', 40, { ok: both(ends, (x, y) => y !== 4 && y !== 13) });
  finish(b).fit().save();
}

// 180 Reactive: coolant pools and hydrogen cells; a cell rising through a pool's neighbourhood bursts it open.
{
  const b = new Board(180, 'Reactive', 45, 'Sodium and hydrogen share this floor. A hydrogen cell that bursts beside a pool clears it; one that bursts beside you does not care. Keep the two reactions apart until you want them together.');
  for (const [x, y] of [[10, 5], [30, 5], [50, 5], [20, 14], [40, 14]]) { b.pool(x, y, 2, 2, '~'); b.rect(x - 1, y + 2, 4, 1, '*'); }
  for (const [x, y] of [[8, 10], [28, 10], [48, 10], [18, 19], [38, 19]]) { b.h(x, y, 4, ' ').set(x, y, 'F'); b.h(x, y - 1, 4, '#'); b.set(x + 4, y - 1, '#'); b.v(x + 4, y - 4, 3, ' '); }
  b.spread('*', 45, { ok: ends }).spread('O', 20, { ok: ends });
  finish(b).fit().save();
}

// 181 Litmus: columns of Pellets and Antipellets over acid; what you drop is gone.
{
  const b = new Board(181, 'Litmus', 45, 'Pellets and Antipellets stacked in columns over the acid. Both roll and both fall; what you knock loose drops into the vat, so take each column from the right side.');
  b.pool(2, 20, 56, 2, 'a');
  for (let x = 4; x < 56; x += 4) { b.v(x, 4, 16, ' '); for (let y = 4; y < 20; y++) b.set(x, y, (x + y) % 3 ? '*' : '!'); b.set(x, 3, '#'); }
  b.spread('O', 10, { ok: both(ends, (x, y) => x % 4 !== 0 && y < 19) });
  finish(b).fit(0.6).save();
}

// 182 Decontamination: fallout rooms behind gates; the iodine is in the clean rooms.
{
  const b = new Board(182, 'Decontamination', 45, 'The contaminated rooms are gated. Every switch flips every gate, and the Iodine is kept in the clean rooms; dose up before you go in, and know how you are getting out.');
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 14;
    b.box(x, 3, 12, 8, '#').set(x, 7, i % 2 ? 'q' : 'g').fallout(x + 1, 4, 10, 6).scatter('*', 7, { x0: x + 1, y0: 4, x1: x + 10, y1: 9, on: 'r' });
    b.set(x + 5, 13, 's').set(x + 2, 15, 'p');
  }
  b.spread('*', 25, { ok: both(ends, (x, y) => y > 12) }).spread('O', 12, { ok: both(ends, (x, y) => y > 12) });
  finish(b).fit().save();
}

// 183 Detonation Cord: a fuse maze; the canisters at the dead ends open the way on.
{
  const b = new Board(183, 'Detonation Cord', 40, 'The maze is laid with fuse. Light it at one end and the fire takes every branch; the canisters at the dead ends blow the walls between the corridors and open the way on.', { fill: '#' });
  b.maze(',');
  const deadEnd = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => b.get(x + dx, y + dy) === '#').length === 3;
  b.scatter('o', 14, { on: ',', ok: both(ends, deadEnd) }).scatter('*', 55, { on: ',', ok: ends });
  b.rect(1, 1, 5, 3, '.').set(3, 2, 'd').rect(54, 20, 4, 3, '.');
  finish(b).fit(0.8).save();
}

// 184 Vats: acid baths that crates can be pushed round; the Pellets sit on islands in the acid.
{
  const b = new Board(184, 'Vats', 40, 'The Pellets sit on islands in the acid. Crates never fall, so a crate pushed to the rim is a pier; push one too far and the acid takes it, and the next one is further away.');
  for (const [x, y] of [[4, 4], [24, 4], [44, 4], [14, 13], [34, 13]]) {
    b.pool(x, y, 12, 6, 'a').rect(x + 5, y + 2, 2, 2, '*');
    b.pts([[x - 1, y + 2], [x + 12, y + 3]], 'c');
  }
  b.spread('*', 35, { ok: ends }).spread('O', 10, { ok: ends });
  finish(b).fit().save();
}

// 185 Pressure Vessel: hydrogen cells in laser corridors; a beam bursts a cell.
{
  const b = new Board(185, 'Pressure Vessel', 45, 'The corridors are lit by lasers and the hydrogen cells sit in them. A beam bursts a cell where it stands; push one along a corridor and the next pulse does the demolition for you.');
  for (const y of [4, 10, 16]) { b.h(3, y, 54, ' ').set(2, y, 'l'); for (let x = 10; x < 56; x += 11) { b.set(x, y, 'F'); b.set(x, y - 1, '#'); } for (let x = 6; x < 56; x += 11) b.rect(x - 1, y - 2, 3, 1, 'R').set(x, y - 3, '*'); }
  b.spread('*', 45, { ok: both(ends, (x, y) => ![4, 10, 16].includes(y)) }).spread('O', 15, { ok: both(ends, (x, y) => ![3, 4, 9, 10, 15, 16].includes(y)) });
  finish(b).fit().save();
}

// 186 Hot Lab: belts carry Iso over fallout fields.
{
  const b = new Board(186, 'Hot Lab', 45, 'Belts run over the fallout; ride them and the dose stays low. Where the Pellets are off the belt you walk the hot floor, so count the steps before you step off.');
  for (const [y, dir] of [[6, 1], [12, 3], [18, 1]]) { b.fallout(2, y - 1, 56, 1); b.belt(4, y, 52, dir); b.fallout(2, y + 1, 56, 1); b.scatter('*', 8, { x0: 3, y0: y + 1, x1: 56, y1: y + 1, on: 'r' }); }
  b.pts([[30, 3], [30, 9], [30, 15]], 'p');
  b.spread('*', 35, { ok: both(ends, (x, y) => ![5, 6, 7, 11, 12, 13, 17, 18, 19].includes(y)) });
  finish(b).fit().save();
}

// 187 Titration: Antipellets perched over the real ones; every careless dig costs two.
{
  const b = new Board(187, 'Titration', 50, 'Every Pellet here has an Antipellet somewhere above it. Dig from the side and the Antipellet drops where the Pellet was; dig from below and it drops on you. Take the real one and leave the drop alone.');
  for (let y = 4; y <= 20; y += 4) for (let x = 4; x < 56; x += 4) { b.set(x, y, '*'); b.set(x, y - 2, '!'); }
  b.spread('O', 15, { ok: both(ends, (x, y) => x % 4 !== 0) });
  finish(b).fit().save();
}

// 188 Quench: Lead shafts over coolant; the pools swallow what falls and creep up the shafts.
{
  const b = new Board(188, 'Quench', 45, 'Shafts of Lead over sodium pools. Pull the plug under a shaft and the pool drinks every ball that falls; then it creeps up the empty shaft after you, so take the Pellets beside the shaft first.');
  for (let x = 6; x < 56; x += 8) { b.v(x, 3, 14, 'O'); b.set(x, 17, '.'); b.pool(x - 1, 18, 3, 2, '~'); b.rect(x - 2, 2, 5, 1, '#'); b.pts([[x - 2, 10], [x + 2, 10], [x - 2, 15], [x + 2, 15]], '*'); }
  b.spread('*', 30, { ok: both(ends, (x, y) => (x - 6) % 8 > 2 && y < 17) });
  finish(b).fit().save();
}

// 189 Flashover: an orange sea with fuses laid through it; one spark clears the floor.
{
  const b = new Board(189, 'Flashover', 50, 'Orange canisters everywhere and fuse laid between them. The first blast clears the whole floor in one roar; be somewhere else when it does, and be quick before the Pellets go with it.');
  for (const y of [6, 12, 18]) b.h(3, y, 54, ',');
  b.spread('o', 45, { ok: both(ends, (x, y) => ![6, 12, 18].includes(y)) }).spread('*', 80, { ok: both(ends, (x, y) => ![6, 12, 18].includes(y)) });
  b.pts([[3, 3], [55, 3], [3, 21]], 'd');
  finish(b).fit(0.6).save();
}

// 190 Dirty Bomb: fallout everywhere except the paths; red canisters clear the way.
{
  const b = new Board(190, 'Dirty Bomb', 45, 'The floor is fallout with clean paths dug through it, and the paths do not reach the Pellets. Three red canisters: a blast turns fallout into clean floor, so bomb yourself a way in.');
  b.fallout(2, 2, 56, 20);
  for (const y of [2, 8, 14, 20]) b.h(2, y, 56, '.');
  for (const x of [2, 20, 38, 57]) b.v(x, 2, 20, '.');
  b.scatter('*', 60, { on: 'r', ok: ends });
  b.pts([[10, 2], [30, 8], [48, 14], [12, 20], [52, 20]], 'd').pts([[29, 2], [47, 8], [11, 14]], 'p');
  finish(b).fit().save();
}

// 191 Chemistry Finals: everything in the wing at once.
{
  const b = new Board(191, 'Chemistry Finals', 60, 'Everything the Chemistry Wing taught: acid, fuses, coolant, hydrogen, antimatter and fallout, on one floor. The Reactor is across a fallout field; keep an Iodine pill for the end.');
  b.pool(4, 8, 14, 2, 'a').h(4, 7, 14, '.');
  for (let x = 6; x < 18; x += 3) b.set(x, 7, 'O');
  b.h(22, 4, 30, ',').pts([[30, 5], [44, 5]], 'o').rect(29, 6, 3, 1, 'R').rect(43, 6, 3, 1, 'R').pts([[30, 8], [44, 8]], '*');
  b.pool(40, 12, 3, 2, '~').rect(38, 14, 7, 1, '*');
  b.hydroStore(8, 17).hydroStore(20, 17);
  b.fallout(30, 17, 28, 5).scatter('*', 6, { x0: 31, y0: 17, x1: 56, y1: 21, on: 'r' }).set(28, 20, 'p');
  b.spread('!', 15, { ok: ends }).spread('*', 40, { ok: both(ends, outside([3, 6, 16, 5], [21, 3, 32, 6], [37, 11, 8, 5], [5, 13, 20, 8], [29, 16, 30, 7])) });
  b.set(3, 3, 'd');
  finish(b).fit().save();
}
