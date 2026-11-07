// Scaffolding that draws Ancient World, levels 546-595, and writes them to levels/*.txt. Each floor answers
// one of classic levels 12-61, the same measures as Titans, read from gamedata.txt, but turned top to bottom
// and cut into 6x4 blocks: every block holds what its counterpart's block held, rearranged inside the block,
// so the rooms, walls, swarms and fortresses sit in a new arrangement and no cell-for-cell copy of a classic
// map is made. The Pellet target and gravity are its counterpart's (PROFILE, from profile-set.mjs); no classic
// name or text is used.
// Re-running overwrites the files.
// Usage: node tools/design-batch-20.mjs [first] [last]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Board, rng } from './board.mjs';
import { roomy } from './roomy.mjs';

const [FIRST, LAST] = [+(process.argv[2] || 546), +(process.argv[3] || 595)];
// need info zonk base empty ram hard snik elec bug orange yellow red term port grav: one row per classic level 12-61
const PROFILE = `45 45 144 764 77 212 170 25 0 0 0 0 0 1 0 0
155 155 218 617 1 1 446 0 0 0 0 0 0 0 0 0
75 110 131 305 530 187 164 7 0 0 0 0 0 0 4 0
95 95 110 745 0 218 261 0 0 0 6 0 0 1 2 0
45 45 82 1014 10 112 166 9 0 0 0 0 0 0 0 0
9 9 10 1135 30 80 164 10 0 0 0 0 0 0 0 0
1 1 0 9 17 6 1389 0 0 0 3 0 0 0 13 0
64 64 0 753 0 338 180 0 0 0 103 0 0 0 0 0
46 46 0 0 684 0 694 14 0 0 0 0 0 0 0 0
54 54 64 1156 0 0 164 0 0 0 0 0 0 0 0 1
53 53 45 935 240 0 164 1 0 0 0 0 0 0 0 1
69 69 214 710 2 227 206 0 0 0 0 0 10 0 0 0
14 14 101 17 446 370 355 84 0 1 0 0 18 2 30 0
123 123 141 787 0 213 164 0 0 0 1 0 9 0 0 0
1 1 1 14 19 41 1317 0 0 0 37 0 1 0 7 0
133 133 226 667 27 199 168 0 0 0 1 0 1 0 16 0
124 124 191 708 7 184 193 0 0 0 28 0 2 0 1 0
74 74 156 798 15 46 214 4 0 0 129 0 0 0 2 0
99 0 102 1128 33 0 164 0 11 0 0 0 0 0 0 0
120 125 101 58 868 118 164 3 0 0 1 0 0 0 0 0
58 58 224 823 1 157 165 0 0 0 0 0 9 0 1 0
56 56 0 2 568 468 307 17 0 0 0 0 0 0 20 0
90 90 123 645 205 110 232 6 0 0 19 0 2 0 6 0
9 2 42 1017 68 84 184 1 1 0 34 0 3 0 2 0
1 1 1 725 0 545 164 0 0 0 1 0 1 0 0 0
87 87 236 720 29 194 164 0 0 0 0 4 0 1 0 0
45 45 11 698 32 97 248 11 0 0 274 8 0 13 1 0
76 76 0 629 0 0 691 0 0 0 42 0 0 0 0 0
82 82 130 70 902 14 228 0 0 0 10 0 0 0 2 0
11 11 88 769 0 104 311 0 0 2 153 0 0 0 0 0
11 11 30 156 29 1 1175 12 0 0 16 0 0 0 8 0
18 18 102 766 10 305 185 0 0 0 52 0 0 0 0 0
44 44 104 938 90 54 198 4 0 0 0 1 0 1 4 0
144 144 0 557 0 0 726 11 0 0 0 0 0 0 0 0
34 34 260 668 44 252 180 0 0 0 0 0 0 0 0 0
40 51 77 390 521 144 214 25 0 0 8 0 0 0 8 0
103 103 175 201 399 387 164 0 0 0 0 0 0 0 9 0
28 28 62 67 824 155 223 0 0 1 0 0 0 0 78 1
42 42 46 215 487 329 230 43 0 0 0 0 0 0 46 0
45 45 153 831 113 109 164 16 0 0 4 0 0 0 3 0
124 124 267 883 0 0 164 0 0 0 0 0 0 0 0 0
17 17 215 562 58 358 222 0 0 0 1 0 0 1 4 0
4 4 0 0 637 0 164 0 0 0 0 0 0 0 633 0
81 81 173 334 204 49 478 11 0 8 45 0 0 0 55 0
56 56 6 549 402 188 186 25 0 0 0 0 0 0 26 0
53 53 91 516 145 85 507 11 0 2 16 0 0 1 11 0
142 124 44 598 173 19 364 7 2 36 59 3 0 1 8 0
60 60 313 631 58 212 164 0 0 0 0 0 0 0 0 0
76 76 301 614 71 212 164 0 0 0 0 0 0 0 0 0
82 55 144 680 206 55 239 11 3 0 40 1 0 1 3 0`.split('\n').map(r => r.trim().split(/\s+/).map(Number));
const NAMES = ['Narmer', 'Khufu', 'Khafre', 'Menkaure', 'Djoser', 'Imhotep', 'Hatshepsut', 'Nefertiti', 'Akhenaten', 'Tutankhamun', 'Ramesses', 'Cleopatra', 'Anubis', 'Osiris', 'Isis', 'Horus', 'Thoth', 'Bastet', 'Sekhmet', 'Sobek', 'Scarab', 'Obelisk', 'Karnak', 'Luxor', 'Rosetta', 'Papyrus', 'Sargon', 'Hammurabi', 'Nebuchadnezzar', 'Ashurbanipal', 'Uruk', 'Babylon', 'Ishtar', 'Marduk', 'Enkidu', 'Ziggurat', 'Cuneiform', 'Euphrates', 'Cyrus', 'Persepolis', 'Darius', 'Zoroaster', 'Behistun', 'Romulus', 'Remus', 'Augustus', 'Trajan', 'Hadrian', 'Aqueduct', 'The Forum'];
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

// Each floor keeps its counterpart's layout block by block: the classic map is turned top to bottom and cut
// into 6x4 blocks. Every block here holds exactly what that block held there (walls, Cask, open space,
// Lead, Pellets, enemies, canisters, airlocks), with the cells inside the block shuffled. Then the floor
// is repaired: what falls is set where it rests, nothing dangerous waits by the start, and everything is
// reachable.
const DAT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'gamedata.txt'));
const CODE = ' O.@*R#Xo>v<^>v<^SyTd|-+eBRR##########RR#';
const BW = 6, BH = 4;
const FALL = 'O*o', ROUND = 'O*R';
const FLIP = { '^': 'v', 'v': '^' }; // turned top to bottom, a one-way airlock points the other way
PROFILE.forEach((p, k) => {
  const num = 546 + k;
  if (num < FIRST || num > LAST) return;
  const [need, , , , , , , , , , , , , , , grav] = p;
  const b = new Board(num, NAMES[k], 1, describe(p), { seed: num * 9973 });
  const r = rng(num * 8461), ri = n => Math.floor(r() * n);
  if (grav) b.head('gravity: on');
  const o = (11 + k) * 1536, src = (x, y) => { const c = CODE[DAT[o + (23 - y) * 60 + x]] || '#'; return FLIP[c] || c; };
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
  roomy(b.g); // every Gamma and Neutron gets room to be seen, none near the start
  b.save();
});
