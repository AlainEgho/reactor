// One-off scaffolding that drew the bonus levels 112-121 (the reactor wing) and wrote them to
// levels/*.txt. Re-running overwrites the files.
// Usage: node tools/design-batch-6.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx && x < rx + w && y >= ry && y < ry + h);
const both = (f, g) => (x, y) => f(x, y) && g(x, y);

// 112 Fuel Rods: eight columns of Infotrons on a RAM foot, each capped with a Zonk.
{
  const b = new Board(112, 'Fuel Rods', 60, 'Eight fuel rods stand in the Graphite, each capped with Lead. Take a rod from the side and the rest of it drops into the gap, so keep your head out from under it.');
  const rods = [7, 13, 19, 25, 31, 37, 43, 49];
  for (const x of rods) b.set(x, 6, 'O').v(x, 7, 10, '*').set(x, 17, 'R');
  b.spread('B', 12, { ok: both(ends, (x, y) => !rods.some(r => Math.abs(x - r) <= 1)) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 113 Neutron Source: five Electron farms in a row, a few loose Infotrons.
{
  const b = new Board(113, 'Neutron Source', 38, 'Five Neutron farms in a row. Snap each plug from its left, step back, and the blast fills the chamber with Pellets.');
  [5, 16, 27, 38, 49].forEach(cx => b.farm(cx, 8, 'O'));
  b.spread('*', 20, { ok: ends }).spread('O', 25, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 114 Centrifuge: three Snik Snak loops sealed inside RAM rings; orange disks kept well away from them.
{
  const b = new Board(114, 'Centrifuge', 50, 'Three centrifuges spin behind Cask walls. The walls only break if something blows beside them, so keep the orange canisters away from the rings.');
  const rings = [];
  for (const cx of [12, 30, 48]) {
    b.box(cx - 6, 6, 13, 11, 'R').box(cx - 5, 7, 11, 9, ' ').box(cx - 4, 8, 9, 7, 'R');
    b.pts([[cx - 5, 7], [cx + 5, 15], [cx, 7]], 'S');
    rings.push([cx - 7, 5, 15, 13]);
  }
  const clearOfRings = outside(...rings);
  b.spread('O', 45, { ok: both(ends, clearOfRings) }).spread('*', 62, { ok: both(ends, clearOfRings) });
  b.spread('o', 4, { ok: both(ends, outside(...rings.map(([x, y, w, h]) => [x - 3, y - 3, w + 6, h + 6]))) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 115 Moderator: solid Base riddled with Bugs, Infotrons and Zonks through it.
{
  const b = new Board(115, 'Moderator', 70, 'The moderator is running hot: Hot spots everywhere in the Graphite. Watch each one flare before you cross it.');
  b.spread('B', 70, { ok: ends }).spread('O', 60, { ok: ends }).spread('*', 85, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 116 Cooling Pond: an open pool with hardware islands; Infotrons and Zonks rest on the islands.
{
  const b = new Board(116, 'Cooling Pond', 30, 'A quiet pond after the last few floors. Walk across the open water and pick the Pellets off the concrete islands.');
  b.rect(6, 4, 48, 15, ' ');
  for (let y = 7; y <= 17; y += 5) for (let x = 9; x <= 51; x += 6) {
    b.set(x, y, '#').set(x + 1, y, '#');
    b.set(x, y - 1, (x + y) % 4 === 0 ? 'O' : '*').set(x + 1, y - 1, '*');
  }
  b.spread('*', 12, { ok: both(ends, outside([5, 3, 50, 17])) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 117 Control Room: twelve hardware rooms joined by ports; an optional RAM vault with Yellow disks
// against it and a Terminal in the far corner.
{
  const b = new Board(117, 'Control Room', 45, 'Twelve control rooms joined by airlocks. The loose Pellets are enough, but the vault in the north-east is full if you find the Initiator first.');
  for (const x of [15, 30, 45]) b.v(x, 1, 22, '#');
  for (const y of [8, 16]) b.h(1, y, 58, '#');
  for (const x of [15, 30, 45]) for (const y of [4, 12]) b.set(x, y, '-');
  for (const x of [15, 30, 45]) b.set(x, 20, '>');
  for (const y of [8, 16]) for (const x of [7, 22, 37, 52]) b.set(x, y, '|');
  b.box(49, 2, 7, 5, 'R').rect(50, 3, 5, 3, '*');
  b.pts([[48, 3], [48, 5]], 'y').set(5, 20, 'T');
  const vault = outside([47, 1, 12, 7]);
  b.spread('O', 40, { ok: both(ends, vault) }).spread('*', 55, { ok: both(ends, vault) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 118 Breeder: eight Electron farms, most of them orange-topped, and a handful of loose Infotrons.
{
  const b = new Board(118, 'Breeder', 45,'A breeder reactor: eight Neutron farms make most of the fuel. The orange-topped farms go off by themselves once you open the plug.');
  [[4, 3], [16, 3], [28, 3], [40, 3], [10, 13], [22, 13], [34, 13], [46, 13]].forEach(([cx, top], i) => b.farm(cx, top, i % 4 === 3 ? 'O' : 'o'));
  b.spread('*', 20, { ok: ends }).spread('O', 20, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit(0.8).save();
}

// 119 Containment Breach: a hardware wall down the middle; its ports turn gravity on, and the east
// half is three ledges of Infotrons.
{
  const b = new Board(119, 'Containment Breach', 40, 'The east wing has lost containment: every airlock in the middle wall turns gravity on. Clear the west first, then work down the east ledges to the Reactor.');
  b.v(30, 1, 22, '#');
  for (const y of [5, 12, 19]) b.set(30, y, '-').head(`special: 30,${y} gravity on`);
  for (const y of [6, 11, 16]) {
    b.h(33, y, 24, '#').h(33, y - 1, 24, ' ');
    for (let x = 34; x <= 55; x += 3) b.set(x, y - 1, '*');
  }
  b.spread('O', 20, { ok: both(ends, (x, y) => x < 28) }).spread('*', 28, { ok: both(ends, (x, y) => x < 28) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit().save();
}

// 120 Sarcophagus: the Exit sealed in a RAM box at the centre, entered through one inward port.
{
  const b = new Board(120, 'Sarcophagus', 55, 'The Reactor lies sealed in the sarcophagus at the centre. Its one airlock only lets you in, so collect every Pellet you need before you enter.');
  b.box(25, 8, 11, 8, 'R').set(25, 11, '>');
  const tomb = outside([22, 6, 17, 12]);
  b.spread('O', 70, { ok: tomb }).spread('*', 70, { ok: both(away(1, 1, 3), tomb) }).spread('B', 10, { ok: both(away(1, 1, 3), tomb) }).spread('d', 3, { ok: both(away(1, 1, 3), tomb) });
  b.set(1, 1, '@').set(30, 12, 'X');
  b.fit().save();
}

// 121 Critical Mass: the finale. Three farms, Snik Snaks in sealed pockets, Zonks, a few orange disks.
{
  const b = new Board(121, 'Critical Mass', 100, 'Critical mass: everything the plant has, on one floor. Three Neutron farms, Gammas sleeping in pockets, Lead overhead and a few orange canisters. Bring it home.');
  [6, 25, 44].forEach(cx => b.farm(cx, 15, 'o'));
  for (const [x, y] of [[10, 4], [30, 6], [48, 4]]) b.rect(x, y, 4, 1, ' ').set(x, y, 'S');
  const pockets = outside([8, 2, 8, 5], [28, 4, 8, 5], [46, 2, 8, 5]);
  b.spread('O', 110, { ok: both(ends, pockets) }).spread('o', 6, { ok: both(ends, pockets) }).spread('B', 10, { ok: both(ends, pockets) }).spread('*', 95, { ok: both(ends, pockets) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.fit(0.8).save();
}
