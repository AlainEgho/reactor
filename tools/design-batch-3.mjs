// One-off scaffolding that drew levels 035-049 and wrote them to levels/*.txt. Each level is an
// original design sized to the difficulty profile of the matching slot in a classic set (counts only).
// Re-running overwrites the files.
// Usage: node tools/design-batch-3.mjs
import { Board } from './board.mjs';

const away = (sx, sy, r = 4) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;
const onHard = b => (x, y) => b.get(x, y + 1) === '#';

// 035 Short Fuse: orange disks in the Base, a sealed vault, one Electron farm.
{
  const b = new Board(35, 'Short Fuse', 9, 'Not many Pellets here. The vault needs a red canister; the Neutron farm makes up the rest.');
  b.box(8, 14, 7, 5, 'R').rect(9, 15, 5, 3, '.').h(9, 17, 4, '*');
  b.farm(40, 12);
  b.rect(20, 3, 8, 2, ' ').set(23, 4, 'S');
  b.v(30, 1, 10, '#').set(30, 5, '-');
  const busy = (x, y) => (x >= 7 && x <= 15 && y >= 13) || (x >= 38 && x <= 45 && y >= 10 && y <= 17) || (x >= 19 && x <= 28 && y <= 5) || Math.abs(x - 30) < 2;
  b.scatter('o', 34, { ok: (x, y) => away(1, 1, 5)(x, y) && !busy(x, y) && away(57, 22, 3)(x, y) });
  b.pts([[50, 4], [25, 20], [5, 9]], '*').pts([[3, 20], [35, 2], [55, 18]], 'd');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 036 Needle: one Infotron in a sealed box at the end of a long switchback. Two ways in.
{
  const b = new Board(36, 'Needle', 1, 'One Pellet, sealed in. Bring the red canister from the far corner, or find the orange canister that can do the job.');
  b.v(10, 1, 18, 'R').v(20, 5, 18, 'R').v(30, 1, 18, 'R').v(40, 5, 18, 'R');
  b.box(50, 16, 5, 5, 'R').rect(51, 17, 3, 3, '.').set(52, 18, '*');
  b.set(52, 14, 'o').set(5, 20, 'd');
  b.set(1, 1, '@').set(57, 1, 'X');
  b.save();
}

// 037 Quarry: a heavy Zonk field. Two vaults already have Yellow disks against them; find the Terminal.
{
  const b = new Board(37, 'Quarry', 75, 'The Yellow canisters are already in place against the vaults. Find the Initiator, and stand well clear first.');
  b.box(10, 8, 7, 5, 'R').rect(11, 9, 5, 3, '.').h(11, 10, 5, '*').h(12, 11, 3, '*');
  b.box(40, 12, 7, 5, 'R').rect(41, 13, 5, 3, '.').h(41, 14, 5, '*').h(42, 15, 3, '*');
  b.pts([[9, 10], [47, 14], [25, 3], [55, 20]], 'y').set(30, 20, 'T');
  const keep = (x, y) => !(x >= 8 && x <= 18 && y >= 7 && y <= 13) && !(x >= 38 && x <= 48 && y >= 11 && y <= 17) && Math.abs(x - 30) + Math.abs(y - 20) > 2;
  b.scatter('O', 230, { ok: (x, y) => away(1, 1)(x, y) && keep(x, y) }).scatter('*', 80, { ok: (x, y) => away(1, 1, 2)(x, y) && keep(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 038 Powder Keg: two Snik Snak lanes walled with Yellow disks, and a Base packed with orange disks.
{
  const b = new Board(38, 'Powder Keg', 40, 'The lane walls are seeded with Yellow canisters. An Initiator blows them all, and anything orange nearby goes too.');
  for (const y of [8, 15]) { b.h(1, y - 1, 58, 'R').h(1, y + 1, 58, 'R').h(3, y, 54, ' '); for (const x of [15, 35, 50]) b.set(x, y - 1, '|').set(x, y + 1, '|'); }
  b.pts([[12, 7], [30, 7], [45, 9], [20, 14], [40, 16], [25, 16], [52, 14], [8, 9]], 'y');
  b.pts([[6, 8], [18, 8], [28, 8], [40, 8], [53, 8], [9, 15], [22, 15], [31, 15], [44, 15], [55, 15], [37, 8]], 'S');
  b.pts([[2, 4], [57, 11], [2, 19], [57, 21]], 'T');
  const lane = (x, y) => [6, 7, 8, 9, 10, 13, 14, 15, 16, 17].includes(y);
  b.scatter('o', 200, { ok: (x, y) => away(1, 1, 5)(x, y) && !lane(x, y) && away(57, 22, 3)(x, y) });
  b.scatter('*', 55, { ok: (x, y) => away(1, 1, 2)(x, y) && !lane(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 039 Orange Grove: three RAM terraces, orange disks among the Infotrons, no Zonks at all.
{
  const b = new Board(39, 'Orange Grove', 65, 'No Lead balls today, only orange canisters. Anything you dig out from under one will drop and blow.');
  for (const y of [6, 12, 18]) { b.h(1, y, 58, 'R'); for (const x of [8 + (y % 4) * 5, 30, 52 - (y % 4) * 3]) b.set(x, y, '.'); }
  b.scatter('o', 42, { ok: away(1, 1, 5) }).scatter('*', 76, { ok: away(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 040 Void Drop: open space with hardware ledges carrying Zonks, Infotrons and a few orange disks.
{
  const b = new Board(40, 'Void Drop', 70, 'Everything rests on concrete ledges in open space. A Lead ball or canister you push off a ledge drops onto whatever is below.', { fill: ' ' });
  const row = '*O**O*o**O*';
  let k = 0;
  for (const y of [4, 8, 12, 16, 20]) {
    for (let x = 2 + (k++ % 2) * 6; x + 11 <= 58; x += 15) { b.h(x, y, 12, '#'); for (let i = 0; i < 11; i++) b.set(x + i, y - 1, row[(i + k) % row.length]); }
  }
  b.h(1, 22, 58, '.').v(29, 1, 2, '#').set(29, 2, '-');
  b.set(1, 1, '@').set(57, 21, 'X');
  b.save();
}

// 041 Coolant Leak: the Base is laced with orange disks; two Bugs guard the way out.
{
  const b = new Board(41, 'Coolant Leak', 11, 'Orange canisters everywhere and only fourteen Pellets. Most of the danger is the Graphite you remove.');
  b.scatter('o', 150, { ok: (x, y) => away(1, 1, 5)(x, y) && away(57, 22, 3)(x, y) }).scatter('O', 88, { ok: away(1, 1) }).scatter('*', 14, { ok: away(1, 1, 3) });
  b.pts([[55, 21], [56, 20]], 'B');
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 042 Cage Match: a hardware arena with eight port gates and twelve Snik Snaks inside.
{
  const b = new Board(42, 'Cage Match', 11, 'The arena gates are airlocks, so nothing inside can follow you out. Go in, grab, get out.', { fill: '#' });
  b.rect(2, 2, 56, 20, '.').box(9, 3, 42, 17, '#').rect(10, 4, 40, 15, ' ');
  b.pts([[9, 8], [9, 14], [50, 8], [50, 14]], '-').pts([[20, 3], [40, 3], [20, 19], [40, 19]], '|');
  for (const [x, y] of [[14, 8], [24, 8], [34, 8], [44, 8], [14, 14], [24, 14], [34, 14], [44, 14]]) b.rect(x, y, 2, 2, '#');
  b.pts([[14, 7], [25, 7], [34, 7], [45, 7], [15, 13], [24, 13], [35, 13], [44, 13], [12, 18], [22, 18], [38, 18], [48, 18], [30, 18], [17, 18]], '*');
  b.pts([[19, 6], [29, 6], [39, 6], [12, 11], [22, 11], [32, 11], [42, 11], [19, 16], [29, 16], [39, 16], [47, 5], [27, 12]], 'S');
  b.scatter('O', 30, { ok: (x, y) => away(1, 1)(x, y) && (x < 9 || x > 50 || y < 3 || y > 19) });
  b.scatter('o', 16, { ok: (x, y) => away(1, 1, 5)(x, y) && (x < 8 || x > 51 || y < 2 || y > 20) && away(57, 21, 3)(x, y) });
  b.set(2, 2, '@').set(57, 21, 'X');
  b.save();
}

// 043 Crumble: Zonks and orange disks over a Base broken up by RAM walls.
{
  const b = new Board(43, 'Crumble', 15, 'Lead balls above, orange canisters between. Dig slowly, and leave yourself a way back.');
  b.v(15, 3, 17, 'R').v(30, 1, 15, 'R').v(45, 6, 17, 'R').h(16, 10, 10, 'R').h(46, 14, 8, 'R');
  b.scatter('O', 100, { ok: away(1, 1) }).scatter('o', 50, { ok: (x, y) => away(1, 1, 5)(x, y) && away(57, 22, 3)(x, y) }).scatter('*', 20, { ok: away(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 044 Pipe Room: a busy Base level; a Terminal opens a vault, a Snik Snak loop guards the middle.
{
  const b = new Board(44, 'Pipe Room', 40, 'Push the Yellow canister up against the vault, then find the Initiator.');
  b.box(46, 3, 8, 6, 'R').rect(47, 4, 6, 4, '.').h(47, 6, 6, '*').h(47, 7, 6, '*');
  b.rect(44, 9, 3, 4, ' ').set(45, 12, 'y');
  b.box(22, 9, 12, 6, ' ').rect(23, 10, 10, 4, 'R').pts([[22, 9], [33, 14], [22, 14], [33, 9]], 'S');
  b.v(14, 1, 22, '#').set(14, 6, '-').set(14, 18, '-').v(38, 15, 8, '#').set(38, 19, '-').set(38, 16, '-');
  b.set(5, 12, 'T');
  const keep = (x, y) => !(x >= 21 && x <= 34 && y >= 8 && y <= 15) && !(x >= 43 && x <= 54 && y >= 2 && y <= 13) && Math.abs(x - 14) > 1 && Math.abs(x - 38) > 1;
  b.scatter('O', 104, { ok: (x, y) => away(1, 1)(x, y) && keep(x, y) && Math.abs(x - 5) + Math.abs(y - 12) > 2 }).scatter('*', 36, { ok: (x, y) => away(1, 1, 2)(x, y) && keep(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 045 Fuel Lattice: seventy Base blocks with two Infotrons each, eleven Snik Snaks in the gaps.
{
  const b = new Board(45, 'Fuel Lattice', 100, 'A lattice of Graphite blocks with Gammas running the gaps. Eat across a block, not along a gap.');
  for (let x = 6; x <= 54; x += 4) b.v(x, 2, 19, ' ');
  for (const y of [5, 9, 13, 17]) b.h(3, y, 55, ' ');
  for (let bx = 3; bx <= 55; bx += 4) for (let by = 2; by <= 18; by += 4) b.set(bx, by, '*').set(bx + 2, by + 2, '*');
  b.pts([[10, 5], [22, 9], [34, 13], [46, 17], [18, 17], [30, 5], [42, 9], [54, 13], [14, 13], [26, 17], [50, 5]], 'S');
  b.set(1, 1, '@').set(58, 22, 'X');
  b.save();
}

// 046 Landslide: two hundred and sixty Zonks and a few dozen Infotrons buried under them.
{
  const b = new Board(46, 'Landslide', 30, 'The whole hill is loose. Every Pellet you take can start a slide, so dig from below.');
  b.scatter('O', 260, { ok: away(1, 1) }).scatter('*', 34, { ok: away(1, 1, 2) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 047 Hollow: big open caves full of Snik Snaks inside a Base hill, with port shortcuts.
{
  const b = new Board(47, 'Hollow', 35, 'The hill is hollow and the caves are full of Gammas. Airlocks in the cave walls let you through without opening a path for them.');
  const caves = [[4, 3, 14, 6], [24, 2, 12, 7], [42, 4, 14, 6], [6, 13, 16, 7], [28, 14, 12, 7], [45, 14, 12, 6]];
  for (const [x, y, w, h] of caves) b.rect(x, y, w, h, ' ');
  b.pts([[8, 8], [14, 8], [28, 8], [33, 8], [46, 9], [52, 9], [10, 19], [18, 19], [31, 20], [36, 20], [48, 19], [54, 19], [6, 3], [26, 2]], 'S');
  b.pts([[11, 8], [30, 8], [49, 9], [14, 19], [34, 20], [51, 19], [20, 8], [40, 20]], 'O');
  b.pts([[20, 5], [38, 5], [22, 16], [42, 17], [24, 11], [44, 11], [5, 11], [57, 12]], '-');
  b.pts([[13, 19], [33, 20]], 'o');
  const inCave = (x, y) => caves.some(([cx, cy, w, h]) => x >= cx - 1 && x <= cx + w && y >= cy - 1 && y <= cy + h);
  b.scatter('*', 50, { ok: (x, y) => away(1, 1, 2)(x, y) && !inCave(x, y) && b.get(x, y + 1) !== ' ' });
  b.scatter('O', 69, { ok: (x, y) => away(1, 1)(x, y) && !inCave(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 048 Gravel Pit: a deep pit with stable Zonk pyramids on its floor, Base all round, ports across the walls.
{
  const b = new Board(48, 'Gravel Pit', 90, 'The pit floor is piled with Lead ball pyramids. Airlocks in the pit walls let you cross without climbing down.');
  b.rect(14, 6, 32, 15, ' ').h(14, 21, 32, '.');
  for (const cx of [17, 23, 29, 35, 41]) b.pts([[cx, 18], [cx - 1, 19], [cx, 19], [cx + 1, 19], [cx - 2, 20], [cx - 1, 20], [cx, 20], [cx + 1, 20], [cx + 2, 20]], 'O');
  b.v(13, 3, 19, '#').v(46, 3, 19, '#');
  for (const y of [5, 9, 13, 17]) b.set(13, y, '-').set(46, y, '-');
  b.h(14, 5, 32, '#').set(20, 5, '|').set(30, 5, '|').set(40, 5, '|');
  const pit = (x, y) => x >= 12 && x <= 47 && y >= 3;
  b.scatter('O', 130, { ok: (x, y) => away(1, 1)(x, y) && !pit(x, y) }).scatter('*', 100, { ok: (x, y) => away(1, 1, 2)(x, y) && !pit(x, y) });
  b.set(1, 1, '@').set(57, 22, 'X');
  b.save();
}

// 049 Airlock Lattice: gravity on, four hardware floors in open space, port ladders between them.
{
  const b = new Board(49, 'Airlock Lattice', 24, 'Gravity is on and the floors float in open space. Stacks of up-airlocks are ladders: go up through them one at a time.', { fill: ' ' }).head('gravity: on');
  const floors = [21, 15, 9, 3];
  for (const f of floors) b.h(1, f, 58, '#');
  floors.forEach((f, i) => {
    if (i === floors.length - 1) return;
    for (const x of i % 2 ? [8, 28, 48] : [16, 36, 54]) b.set(x, f - 2, '^').set(x, f - 4, '^').set(x, f - 6, '^');
    for (const x of i % 2 ? [22, 42] : [4, 30]) b.set(x, f - 6, ' ');
  });
  for (const f of floors) {
    const stand = f - 1, clear = (x, y) => b.get(x, y + 1) === '#' && b.get(x - 1, y) !== '^' && b.get(x + 1, y) !== '^' && b.get(x, y - 1) !== '^';
    // No Zonks on the floors: with gravity on, a Zonk on a one-high floor is a wall Murphy cannot pass.
    b.scatter('*', f === 3 ? 4 : 8, { on: ' ', y0: stand, y1: stand, ok: (x, y) => clear(x, y) && away(57, 2, 2)(x, y) });
  }
  b.set(1, 20, '@').set(57, 2, 'X');
  b.save();
}
