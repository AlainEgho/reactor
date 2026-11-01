// Scaffolding that draws God of War, levels 396-445, and writes them to levels/*.txt. Each floor answers one
// of the last fifty levels of the classic set (62-111, read from gamedata.txt) block by block: every 4x3
// block holds what its counterpart's block held, rearranged inside the block, so the rooms, walls, swarms and
// fortresses sit where they did, but no cell-for-cell copy of a classic map is made. The Pellet target and
// gravity are its counterpart's (PROFILE, from profile-set.mjs); no classic name or text is used.
// Re-running overwrites the files.
// Usage: node tools/design-batch-17.mjs [first] [last]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Board, rng } from './board.mjs';

const [FIRST, LAST] = [+(process.argv[2] || 396), +(process.argv[3] || 445)];
// need info zonk base empty ram hard snik elec bug orange yellow red term port grav: one row per classic level 62-111
const PROFILE = `1 24 0 34 31 683 484 0 0 21 4 0 156 0 1 0
143 143 178 375 85 416 231 1 0 0 0 0 0 0 9 0
78 78 116 676 158 177 202 18 0 0 1 2 6 1 3 0
14 14 0 349 798 0 251 24 0 0 0 0 0 0 2 1
56 47 27 72 657 316 222 18 1 0 1 6 6 1 64 0
135 135 68 636 139 51 317 14 0 0 67 6 0 1 3 0
12 12 10 147 0 1011 164 0 0 0 28 0 66 0 0 0
110 67 159 565 183 16 414 9 8 0 12 0 0 0 5 0
119 119 93 176 375 364 284 12 0 2 5 0 0 1 7 0
141 141 0 342 0 734 164 57 0 0 0 0 0 0 0 0
119 119 227 577 53 74 356 1 0 0 15 6 1 1 8 0
84 84 126 365 115 131 508 10 0 0 82 0 0 0 17 0
1 1 2 219 211 373 630 1 0 0 0 0 0 0 1 0
80 80 173 524 148 283 195 5 0 0 15 1 12 1 1 0
126 117 85 384 177 358 214 9 1 0 26 3 1 1 62 0
107 107 156 755 33 212 164 1 0 0 7 0 0 0 3 0
103 103 103 497 104 124 384 13 0 1 85 6 3 1 14 0
51 51 195 724 0 288 164 0 0 0 0 0 16 0 0 0
61 61 61 295 155 250 434 4 0 0 114 2 10 1 51 0
107 93 184 382 136 6 605 3 2 0 5 1 1 0 20 0
142 10 17 353 173 323 454 10 15 0 50 0 28 0 5 0
107 107 171 447 232 62 360 12 0 0 0 0 7 0 40 0
41 41 0 625 360 0 345 67 0 0 0 0 0 0 0 0
84 57 119 391 326 302 164 21 3 0 8 1 5 1 40 0
63 0 140 814 88 138 214 0 7 0 1 7 5 23 1 0
51 51 121 487 101 460 216 1 0 0 0 0 0 0 0 0
45 45 57 457 174 34 583 19 0 2 11 1 6 2 47 0
32 32 0 536 123 0 739 8 0 0 0 0 0 0 0 0
54 0 6 986 102 168 164 6 6 0 0 0 0 0 0 0
43 37 65 248 91 223 726 8 5 3 0 0 0 2 30 0
78 69 189 577 108 239 201 3 1 0 22 2 0 1 26 0
9 9 58 229 678 38 311 30 0 0 74 0 0 0 11 0
50 5 12 1110 15 103 165 5 5 0 12 0 6 0 0 0
114 114 164 409 189 394 164 4 0 0 0 0 0 0 0 0
44 44 132 525 0 550 164 0 0 0 0 0 23 0 0 0
62 70 137 256 419 141 338 18 0 0 48 1 0 1 9 0
92 87 119 351 343 49 372 7 1 0 47 2 3 1 56 0
0 0 108 424 74 33 580 7 0 0 195 0 0 0 17 0
162 162 146 525 104 13 473 0 0 0 7 6 1 1 0 0
87 87 88 586 134 199 265 8 0 0 16 3 0 4 48 1
177 177 257 344 188 77 369 4 0 0 1 0 0 0 21 0
49 49 103 463 184 440 164 4 0 0 13 2 14 1 1 0
178 52 57 782 163 104 164 19 14 0 30 7 12 9 24 0
73 73 167 495 148 83 443 1 0 0 10 7 1 1 9 0
94 94 178 871 0 0 164 0 0 0 131 0 0 0 0 0
82 83 253 470 83 323 166 0 0 0 0 0 0 0 60 0
99 90 144 349 195 126 401 3 1 0 64 7 9 1 48 0
13 13 0 14 676 0 671 27 0 0 0 0 0 0 37 0
203 194 168 280 219 41 483 17 1 2 7 1 2 1 19 0
101 101 170 301 135 380 262 0 0 0 38 0 2 0 49 0`.split('\n').map(r => r.trim().split(/\s+/).map(Number));
const NAMES = ['Ares', 'Phalanx', 'Hoplite', 'Spartan', 'Thermopylae', 'Leonidas', 'Achilles', 'Hector', 'Ajax', 'Agamemnon',
  'Troy', 'Salamis', 'Sparta', 'Athena', 'Nemesis', 'Erebus', 'Deimos', 'Phobos', 'Enyo', 'Polemos',
  'Aegis', 'Xiphos', 'Peltast', 'Strategos', 'Warpath', 'Battlecry', 'Warhorn', 'Onslaught', 'Juggernaut', 'Vanguard',
  'Rearguard', 'Berserker', 'Warlord', 'Conqueror', 'Triumph', 'Last Stand', 'No Quarter', 'Iron Will', 'Shieldwall', 'Spearhead',
  'Ambush', 'Blitz', 'Siegeworks', 'Battering Ram', 'Trebuchet', 'Catapult', 'War Drums', 'Bloodmoon', 'Armageddon', 'God of War'];
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// The hint names the two or three things the floor is most made of.
function describe(p) {
  const [, info, zonk, , empty, ram, hard, snik, elec, bug, orange, yellow, red, term, port, grav] = p;
  const say = [];
  if (snik >= 15) say.push(`${snik} Gammas loose in the open`); else if (snik) say.push(`Gammas on patrol`);
  if (elec >= 5) say.push(`${elec} Neutrons to split`); else if (elec) say.push('a Neutron or two');
  if (bug >= 40) say.push(`${bug} hot spots in the Graphite`); else if (bug >= 5) say.push('hot spots under foot');
  if (red >= 10) say.push(`${red} red canisters and Cask to blast`); else if (red) say.push('red canisters');
  if (yellow && term) say.push('yellow canisters and an Initiator');
  if (orange >= 3) say.push('orange canisters');
  if (port >= 30) say.push(`${port} airlocks`); else if (port >= 8) say.push('airlocks in the walls');
  if (zonk >= 150) say.push('Lead everywhere');
  if (ram >= 500) say.push('Cask packed wall to wall'); else if (hard - 164 >= 350) say.push('Concrete walls');
  if (empty >= 500) say.push('wide open space');
  if (grav) say.push('gravity');
  const list = say.slice(0, 4);
  const body = list.length ? list.slice(0, -1).join(', ') + (list.length > 1 ? ' and ' : '') + list[list.length - 1] : 'Graphite and Pellets';
  return `${body.charAt(0).toUpperCase() + body.slice(1)}. ${info >= 100 ? 'A long harvest.' : info >= 40 ? 'Every Pellet counts.' : 'Few Pellets, and each one is guarded.'}`;
}

// Each floor keeps its counterpart's layout block by block: the classic map is cut into 4x3 blocks, and
// every block here holds exactly what that block held there (walls, Cask, open space, Lead, Pellets,
// enemies, canisters, airlocks), with the cells inside the block shuffled. Then the floor is repaired:
// what falls is set where it rests, nothing dangerous waits by the start, and everything is reachable.
const DAT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'gamedata.txt'));
const CODE = ' O.@*R#Xo>v<^>v<^SyTd|-+eBRR##########RR#';
const BW = 4, BH = 3;
const FALL = 'O*o', ROUND = 'O*R';
PROFILE.forEach((p, k) => {
  const num = 396 + k;
  if (num < FIRST || num > LAST) return;
  const [need, , , , , , , , , , , , , , , grav] = p;
  const b = new Board(num, NAMES[k], 1, describe(p), { seed: num * 9973 });
  const r = rng(num * 7907), ri = n => Math.floor(r() * n);
  if (grav) b.head('gravity: on');
  const o = (61 + k) * 1536, src = (x, y) => CODE[DAT[o + y * 60 + x]] || '#';
  // block by block: the counterpart's cells, shuffled inside the block
  for (let by = 0; by < 24; by += BH) for (let bx = 0; bx < 60; bx += BW) {
    const cells = [], what = [];
    for (let y = by; y < by + BH; y++) for (let x = bx; x < bx + BW; x++) {
      if (x === 0 || y === 0 || x === 59 || y === 23) continue;
      cells.push([x, y]); what.push(src(x, y));
    }
    for (let i = what.length - 1; i > 0; i--) { const j = ri(i + 1); [what[i], what[j]] = [what[j], what[i]]; }
    cells.forEach(([x, y], i) => b.set(x, y, what[i]));
  }
  const find = ch => { for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) if (b.get(x, y) === ch) return [x, y]; return null; };
  const blockOf = (x, y) => [x - x % BW, y - y % BH];
  // swap a cell with a plain one ('.' or ' ') in the same block that passes ok(); returns whether it could
  const swapIn = (x, y, ok) => {
    const [bx, by] = blockOf(x, y), opts = [];
    for (let j = by; j < by + BH; j++) for (let i = bx; i < bx + BW; i++) if ((i !== x || j !== y) && '. '.includes(b.get(i, j) || '#') && ok(i, j)) opts.push([i, j]);
    if (!opts.length) return false;
    const [i, j] = opts[ri(opts.length)], c = b.get(x, y);
    b.set(x, y, b.get(i, j)).set(i, j, c);
    return true;
  };
  // what falls must rest: something solid under it, and no open cell beside or under its shoulders
  const rests = (x, y) => { const u = b.get(x, y + 1); return u !== ' ' && b.clear(x, y, 1, ' '); };
  for (let pass = 0; pass < 6; pass++) {
    let moved = 0;
    for (let y = 22; y >= 1; y--) for (let x = 1; x <= 58; x++) {
      const c = b.get(x, y);
      if (!FALL.includes(c) || rests(x, y)) continue;
      // try a resting cell in the block; failing that, the thing becomes Graphite (an orange canister, a Cask)
      if (!swapIn(x, y, (i, j) => b.get(i, j) === '.' && b.get(i, j + 1) !== ' ' && b.clear(i, j, 1, ' '))) b.set(x, y, c === 'o' ? '.' : c === '*' ? '*' : 'O'), moved += 0;
      else moved++;
    }
    if (!moved) break;
  }
  // anything that still cannot rest is set on Graphite where it stands (a Pellet keeps its count)
  for (let y = 22; y >= 1; y--) for (let x = 1; x <= 58; x++) if (FALL.includes(b.get(x, y)) && !rests(x, y)) {
    if (b.get(x, y + 1) === ' ') b.set(x, y + 1, '.');
    for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) if (b.get(x + dx, y + dy) === ' ') b.set(x + dx, y + dy, '.');
  }
  // the start: its counterpart's spot, with nothing that moves or falls within reach of it
  let [sx, sy] = find('@') || [2, 2];
  for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) if (b.get(x, y) === '@' && (x !== sx || y !== sy)) b.set(x, y, '.');
  for (let j = sy - 2; j <= sy + 2; j++) for (let i = sx - 2; i <= sx + 2; i++) {
    const c = b.get(i, j);
    if (c === undefined || (i === sx && j === sy)) continue;
    if ('SeBo'.includes(c) || (c === 'O' && i === sx && j < sy) || c === ' ') b.set(i, j, '.');
  }
  // everything walkable joined to the start (walls between the reached and the unreached are opened)
  const walk = c => c !== undefined && c !== '#' && c !== 'R';
  for (let n = 0; n < 3000; n++) {
    const d = b.dist(sx, sy, walk), gaps = [], edge = [];
    let lost = 0;
    for (let y = 1; y <= 22; y++) for (let x = 1; x <= 58; x++) {
      const c = b.get(x, y);
      if (walk(c) && !d.has(y * 60 + x)) lost++;
      if (c !== '#' && c !== 'R') continue;
      const nb = D4.map(([dx, dy]) => [x + dx, y + dy]).filter(([i, j]) => walk(b.get(i, j)));
      const near = nb.some(([i, j]) => d.has(j * 60 + i));
      if (near && nb.some(([i, j]) => !d.has(j * 60 + i))) gaps.push([x, y]); else if (near) edge.push([x, y]);
    }
    if (!lost) break;
    const from = gaps.length ? gaps : edge;
    for (let i = 0; i < 4 && from.length; i++) b.set(...from.splice(ri(from.length), 1)[0], '.');
  }
  // the Reactor: its counterpart's spot if it can be walked to, otherwise the far end of the walk
  const d = b.dist(sx, sy, c => walk(c) && !'<>^v-|+To'.includes(c));
  // (a classic floor can have more than one exit cell: the first is kept as the place, the rest go)
  let ex = find('X');
  for (let p; (p = find('X'));) b.set(...p, '.');
  if (!ex || !d.has(ex[1] * 60 + ex[0])) {
    let fd = -1;
    for (const [key, v] of d) { const x = key % 60, y = (key / 60) | 0; if (b.get(x, y) === '.' && v > fd) { fd = v; ex = [x, y]; } }
  }
  b.set(...ex, 'X');
  const pellets = b.count('*'), supply = pellets + 6 * b.count('e');
  b.need = supply === 0 ? 0 : Math.max(1, need > 0 ? Math.min(need, supply) : pellets);
  b.unseal(); // neither the Reactor nor one-way airlocks may shut the start in
  b.save();
});
