// Scaffolding that draws Prestige, levels 296-345, and writes them to levels/*.txt. Every floor is a
// gauntlet composed from set pieces the earlier wings proved, one to a region, under a layout and often a
// condition that covers the whole floor (the dark, a tank of air, gravity). It climbs from two set pieces
// on a calm floor to five under the worst conditions. Re-running overwrites the files.
// Usage: node tools/design-batch-15.mjs [first] [last]
import { Board, rng } from './board.mjs';

const [FIRST, LAST] = [+(process.argv[2] || 296), +(process.argv[3] || 345)];
const inR = ([x, y, w, h]) => (xx, yy) => xx >= x && xx < x + w && yy >= y && yy < y + h;
const outside = (...rs) => (x, y) => !rs.some(([rx, ry, w, h]) => x >= rx - 1 && x <= rx + w && y >= ry - 1 && y <= ry + h);
const away = (sx, sy, r) => (x, y) => Math.abs(x - sx) > r || Math.abs(y - sy) > r;

// Layouts: walls (with gaps of Graphite) and the regions the set pieces fill.
const LAYOUTS = {
  quad: { say: 'Four rooms', draw: b => b.v(29, 1, 22, '#').h(1, 11, 58, '#').pts([[29, 5], [29, 17], [14, 11], [44, 11]], '.'),
    regions: [[2, 2, 26, 8], [31, 2, 26, 8], [2, 13, 26, 8], [31, 13, 26, 8]] },
  strips: { say: 'Three halls side by side', draw: b => b.v(20, 1, 22, '#').v(39, 1, 22, '#').pts([[20, 6], [20, 17], [39, 6], [39, 17]], '.'),
    regions: [[2, 2, 17, 19], [22, 2, 16, 19], [41, 2, 16, 19]] },
  bands: { say: 'Two long galleries', draw: b => b.h(1, 11, 58, '#').pts([[10, 11], [30, 11], [50, 11]], '.'),
    regions: [[2, 2, 55, 8], [2, 13, 55, 8]] },
  ring: { say: 'A core walled in the middle and four galleries round it', draw: b => b.box(18, 7, 24, 10, '#').pts([[29, 7], [29, 16], [18, 11], [41, 11]], '.'),
    regions: [[2, 2, 55, 4], [2, 18, 55, 4], [2, 8, 14, 8], [44, 8, 13, 8], [20, 9, 20, 6]] },
  open: { say: 'One open floor in four quarters', draw: () => {},
    regions: [[2, 2, 26, 8], [31, 2, 26, 8], [2, 13, 26, 8], [31, 13, 26, 8]] }
};
const ORDER = ['quad', 'strips', 'bands', 'ring', 'open'];

// Set pieces. Each draws inside its region [x, y, w, h] and returns the rects it wants kept clear of the
// general scatter. need: the smallest region it fits.
const PIECES = {
  orbits: { need: [9, 5], say: 'Gammas circle Pellets on their posts', draw: (b, [x, y, w]) => {
    const out = [];
    for (let px = x + 2; px + 1 < x + w; px += 7) { b.rect(px - 1, y, 3, 4, ' ').set(px, y + 1, '*').set(px, y + 2, '#').set(px + 1, y + 2, 'S'); out.push([px - 1, y, 3, 4]); }
    return out;
  } },
  alpha: { need: [8, 4], say: 'Alphas run the lanes', draw: (b, [x, y, w, h]) => {
    const rows = h >= 8 ? [y + 1, y + h - 2] : [y + (h >> 1)];
    for (const ly of rows) b.h(x, ly, w, ' ').set(x, ly, 'A');
    return rows.map(ly => [x, ly, w, 1]);
  } },
  laser: { need: [10, 3], say: 'a laser sweeps a lane with Pellets lying in it', draw: (b, [x, y, w, h]) => {
    const ly = y + (h >> 1);
    b.set(x, ly, 'l').h(x + 1, ly, w - 1, ' ');
    for (let lx = x + 3; lx < x + w; lx += 4) b.set(lx, ly, '*');
    return [[x, ly, w, 1]];
  } },
  cages: { need: [6, 4], say: 'Pellets wait in Cask cages, one plug in the roof of each', draw: (b, [x, y, w]) => {
    const out = [];
    for (let cx = x + 1; cx + 2 < x + w; cx += 5) { b.rect(cx, y + 1, 3, 3, 'R').set(cx + 1, y + 2, '*').set(cx + 1, y + 1, '.'); out.push([cx, y + 1, 3, 3]); }
    return out;
  } },
  farm: { need: [8, 7], say: 'Neutron farms wait for their Lead', draw: (b, [x, y, w]) => {
    const out = [];
    for (let cx = x + 1; cx + 4 < x + w; cx += 9) { b.farm(cx, y + 1, (cx & 1) ? 'o' : 'O'); out.push([cx - 1, y, 6, 6]); }
    return out;
  } },
  vault: { need: [10, 6], say: 'a sealed vault waits for the Quantum tunnel beside it', draw: (b, [x, y, w]) => {
    b.box(x + 1, y, 6, 5, '#').rect(x + 2, y + 1, 4, 3, ' ').h(x + 2, y + 3, 4, '*').set(Math.min(x + 8, x + w - 1), y + 2, 'Q');
    return [[x + 1, y, 6, 5]];
  } },
  fallout: { need: [6, 4], say: 'fallout covers the floor, with Iodine at its corners', draw: (b, [x, y, w, h]) => {
    b.fallout(x, y, w, h).scatter('*', Math.max(3, Math.round(w * h / 9)), { on: 'r', x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 });
    b.set(x, y, 'p').set(x + w - 1, y + h - 1, 'p');
    return [[x, y, w, h]];
  } },
  coolant: { need: [6, 5], say: 'liquid sodium hangs over the dig', draw: (b, [x, y, w]) => { b.pool(x + 1, y, w - 2, 2, '~'); return [[x + 1, y, w - 2, 2]]; } },
  ice: { need: [6, 3], say: 'an ice floor carries you past its Pellets', draw: (b, [x, y, w, h]) => {
    b.rink(x, y + 1, w, h - 2).scatter('*', Math.max(3, Math.round(w * h / 10)), { on: 'I', x0: x, y0: y + 1, x1: x + w - 1, y1: y + h - 2 });
    return [[x, y + 1, w, h - 2]];
  } },
  magnet: { need: [13, 3], say: 'a magnet waits behind Graphite plugs with Lead at the end of each spoke', draw: (b, [x, y, w, h]) => {
    const mx = x + (w >> 1), my = y + (h >> 1);
    b.set(mx, my, 'M');
    for (const s of [-1, 1]) b.set(mx + s, my, ' ').set(mx + 2 * s, my, '.').set(mx + 3 * s, my, ' ').set(mx + 4 * s, my, ' ').set(mx + 5 * s, my, 'O');
    return [[mx - 5, my, 11, 1]];
  } },
  domino: { need: [8, 5], say: 'a line of orange canisters stands shoulder to shoulder over caged Pellets', draw: (b, [x, y, w]) => {
    b.h(x + 1, y + 1, w - 2, 'o').h(x + 1, y + 2, w - 2, 'R').h(x, y + 4, w, 'R');
    for (let i = x; i < x + w; i++) b.set(i, y + 3, (i - x) % 2 ? '*' : 'R');
    b.set(x, y + 3, 'R').set(x + w - 1, y + 3, 'R').set(x, y, 'd');
    return [[x, y, w, 5]];
  } },
  plutonium: { need: [6, 6], say: 'Plutonium sits on posts under hanging Lead', draw: (b, [x, y, w, h]) => {
    const out = [], py = y + h - 2;
    for (let px = x + 2; px + 1 < x + w; px += 6) { b.set(px, py, 'P').set(px, py + 1, '#').set(px, py - 1, ' ').set(px, py - 2, '.').set(px, py - 3, 'O'); out.push([px - 1, py - 3, 3, 5]); }
    return out;
  } },
  hydro: { need: [7, 7], say: 'hydrogen cells sit under their stores', draw: (b, [x, y, w, h]) => {
    const out = [], hy = y + h - 2;
    for (let hx = x + 2; hx + 3 < x + w; hx += 7) { b.hydroStore(hx, hy); out.push([hx - 1, hy - 4, 5, 6]); }
    return out;
  } },
  isotopes: { need: [4, 3], say: 'isotopes decay while you work', draw: (b, [x, y, w, h]) => { b.spread('h', Math.max(3, Math.round(w * h / 14)), { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 }); return []; } },
  anti: { need: [6, 4], say: 'Antipellets lie shoulder to shoulder with the Pellets', draw: (b, [x, y, w, h]) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if ((i + j) % 4 === 0 && b.get(i, j) === '.' && b.get(i, j + 1) !== ' ') b.set(i, j, (i * 7 + j * 3) % 5 < 2 ? '!' : '*');
    return [[x, y, w, h]];
  } },
  hotspots: { need: [6, 3], say: 'hot spots flare in the Graphite round the Pellets', draw: (b, [x, y, w, h]) => {
    b.rect(x, y + 1, w, Math.max(1, h - 2), 'B').scatter('*', Math.max(3, Math.round(w * h / 10)), { on: 'B', x0: x, y0: y + 1, x1: x + w - 1, y1: y + h - 2 });
    return [[x, y + 1, w, h - 2]];
  } },
  acid: { need: [8, 4], say: 'acid pools wait under the Pellets', draw: (b, [x, y, w, h]) => {
    const out = [];
    for (let ax = x + 1; ax + 3 < x + w; ax += 7) { b.pool(ax, y + h - 2, 3, 2, 'a').h(ax, y + h - 3, 3, '*'); out.push([ax, y + h - 3, 3, 3]); }
    return out;
  } },
  gammas: { need: [6, 3], say: 'Gammas sleep in the walls', draw: (b, [x, y, w, h]) => {
    const out = [];
    for (let i = 0, px = x + 2; px + 1 < x + w; i++, px += 8) { const py = y + (i % 2 ? h - 1 : 0); b.h(px - 1, py, 3, ' ').set(px, py, 'S'); out.push([px - 1, py, 3, 1]); }
    return out;
  } },
  belt: { need: [10, 4], say: 'a belt runs the length of the room', draw: (b, [x, y, w, h]) => { b.belt(x + 1, y + h - 2, w - 2, (x & 1) ? 1 : 3); return [[x + 1, y + h - 3, w - 2, 2]]; } }
};
const POOL = Object.keys(PIECES);
const NAMES = ['Laurel', 'Medallion', 'Honour Guard', 'Silver Lining', 'Gilded', 'Marble Hall', 'Opal', 'Topaz', 'Jade', 'Amber Room',
  'Sapphire', 'Emerald', 'Ruby', 'Onyx', 'Obsidian', 'Platinum', 'Diamond Cut', 'Gold Standard', 'Ivory Tower', 'Regalia',
  'Sceptre', 'Crown', 'Throne Room', 'Coronation', 'Sovereign', 'Dynasty', 'Empire', 'Champion', 'Laureate', 'Virtuoso',
  'Maestro', 'Grandmaster', 'Paragon', 'Hall of Fame', 'Pantheon', 'Colosseum', 'Olympus', 'Valhalla', 'Elysium', 'Legend',
  'Myth', 'Immortal', 'Summit', 'Pinnacle', 'Zenith', 'Apex', 'Ascension', 'Apotheosis', 'Masterwork', 'Prestige'];

for (let k = 0; k < 50; k++) {
  const num = 296 + k;
  if (num < FIRST || num > LAST) continue;
  const r = rng(num * 104729), lay = LAYOUTS[ORDER[k % ORDER.length]];
  const dark = (k >= 6 && k % 3 === 1) || (k >= 40 && k % 2 === 0);
  const air = (k >= 10 && k % 4 === 2) || (k >= 35 && k % 3 === 0) ? 160 - k : 0;
  const grav = ORDER[k % ORDER.length] === 'bands' && k % 10 === 7;
  // the pieces: one per region, no repeats, each fitting its region; calm early floors leave a region plain
  const regions = lay.regions.slice(0, k < 10 ? 2 : k < 25 ? 3 : lay.regions.length);
  const used = new Set(), picks = [];
  for (const [, , w, h] of regions) {
    const fits = POOL.filter(p => !used.has(p) && PIECES[p].need[0] <= w && PIECES[p].need[1] <= h && !(grav && ['ice', 'belt', 'coolant'].includes(p)));
    const p = fits[Math.floor(r() * fits.length)];
    used.add(p); picks.push(p);
  }
  const says = picks.map(p => PIECES[p].say);
  const cond = [dark && 'The lights are out', air && `${air} seconds of air`, grav && 'gravity is on'].filter(Boolean);
  const hint = `${lay.say}: ${says.slice(0, -1).join('; ')}${says.length > 1 ? '; and ' : ''}${says[says.length - 1]}.${cond.length ? ' ' + cond.join(', ').replace(/^./, c => c.toUpperCase()) + '.' : ''}`;
  const b = new Board(num, NAMES[k], 40 + k, hint, { seed: num * 7919 });
  if (air) b.head(`air: ${air}`);
  if (dark) b.head('dark: on');
  if (grav) b.head('gravity: on');
  lay.draw(b);
  const keep = [];
  regions.forEach((rg, i) => keep.push(...PIECES[picks[i]].draw(b, rg)));
  const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
  // The general scatter takes what room a region has left: a piece may fill its region whole.
  const some = (ch, n, opts) => { try { b.spread(ch, n, opts); } catch (e) { /* the region is full */ } };
  for (const rg of lay.regions) {
    const [x, y, w, h] = rg, area = w * h, ok = (xx, yy) => ends(xx, yy) && outside(...keep)(xx, yy);
    some('*', Math.round(area / (12 - Math.min(4, k / 10))), { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1, ok });
    some('O', Math.round(area / (34 - k / 3)), { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1, ok });
    if (air) some('t', 1, { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1, ok: ends });
  }
  if (dark) b.spread('L', 3, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X').set(56, 22, '.').set(57, 21, '.');
  b.fit(0.8).save();
}
