// Scaffolding that draws Legendary, levels 346-395, and writes them to levels/*.txt: the hardest floors in
// the plant. It composes from the same proven set pieces as Prestige (design-batch-15), but every region
// gets one, a six-room layout joins the five, Gammas sleep in every region from the eleventh floor on,
// limited air is the rule rather than the exception, and the Lead is denser. Only three floors are dark. Re-running overwrites
// the files.
// Usage: node tools/design-batch-16.mjs [first] [last]
import { Board, rng } from './board.mjs';
import { roomy } from './roomy.mjs';
import { LAYOUTS, PIECES, outside, away } from './design-batch-15.mjs';

const [FIRST, LAST] = [+(process.argv[2] || 346), +(process.argv[3] || 395)];
const ALL = Object.assign({}, LAYOUTS, {
  rooms: { say: 'Six rooms in two rows', draw: b => b.v(20, 1, 22, '#').v(39, 1, 22, '#').h(1, 11, 58, '#').pts([[20, 5], [20, 16], [39, 6], [39, 17], [10, 11], [30, 11], [48, 11]], '.'),
    regions: [[2, 2, 17, 8], [22, 2, 16, 8], [41, 2, 16, 8], [2, 13, 17, 8], [22, 13, 16, 8], [41, 13, 16, 8]] }
});
const ORDER = ['rooms', 'quad', 'strips', 'ring', 'bands', 'open'];
const POOL = Object.keys(PIECES);
const NAMES = ['Excalibur', 'Avalon', 'Camelot', 'Atlantis', 'El Dorado', 'Shangri-La', 'Asgard', 'Midgard', 'Bifrost', 'Mjolnir',
  'Valkyrie', 'Phoenix', 'Pegasus', 'Griffin', 'Wyvern', 'Chimera', 'Hydra', 'Medusa', 'Minotaur', 'Cerberus',
  'Sphinx', 'Basilisk', 'Cyclops', 'Kraken', 'Leviathan', 'Behemoth', 'Titan', 'Prometheus', 'Icarus', 'Odyssey',
  'Iliad', 'Trojan Horse', 'Argonaut', 'Golden Fleece', 'Holy Grail', "Philosopher's Stone", 'Pandora', 'Gilgamesh', 'Beowulf', 'Grendel',
  'Fenrir', 'Jormungandr', 'Yggdrasil', 'Ouroboros', 'Styx', 'Hades', 'Tartarus', 'Ragnarok', 'Nirvana', 'Eternity'];

// A Gamma asleep in a three-cell pocket with Graphite all round it, somewhere free in the region.
function sleeper(b, [x, y, w, h], keep, r) {
  for (let t = 0; t < 200; t++) {
    const px = x + 1 + Math.floor(r() * Math.max(1, w - 2)), py = y + 1 + Math.floor(r() * Math.max(1, h - 2));
    let ok = outside(...keep)(px, py);
    for (let i = -1; i <= 1 && ok; i++) ok = b.get(px + i, py) === '.' && b.get(px + i, py - 1) === '.' && b.get(px + i, py + 1) !== ' ' && b.get(px + i, py + 1) !== undefined;
    if (!ok) continue;
    b.h(px - 1, py, 3, ' ').set(px, py, 'S');
    keep.push([px - 1, py, 3, 1]);
    return true;
  }
  return false;
}

for (let k = 0; k < 50; k++) {
  const num = 346 + k;
  if (num < FIRST || num > LAST) continue;
  const r = rng(num * 15485863), key = ORDER[k % ORDER.length], lay = ALL[key];
  const dark = [44, 45, 46].includes(k); // only the underworld, Styx, Hades and Tartarus, is dark
  const air = k % 3 !== 1 ? Math.max(100, 150 - k) : 0;
  const grav = key === 'bands' && k % 12 === 4;
  const used = new Set(), picks = [];
  for (const [, , w, h] of lay.regions) {
    const fits = POOL.filter(p => !used.has(p) && PIECES[p].need[0] <= w && PIECES[p].need[1] <= h && !(grav && ['ice', 'belt', 'coolant'].includes(p)));
    const p = fits[Math.floor(r() * fits.length)];
    used.add(p); picks.push(p);
  }
  const says = picks.map(p => PIECES[p].say), sleepers = k >= 10;
  const cond = [dark && 'The lights are out', air && `${air} seconds of air`, grav && 'gravity is on', sleepers && 'Gammas sleep in every room'].filter(Boolean);
  const hint = `${lay.say}: ${says.slice(0, -1).join('; ')}; and ${says[says.length - 1]}.${cond.length ? ' ' + cond.join(', ').replace(/^./, c => c.toUpperCase()) + '.' : ''}`;
  const b = new Board(num, NAMES[k], 50 + k, hint, { seed: num * 7919 });
  if (air) b.head(`air: ${air}`);
  if (dark) b.head('dark: on');
  if (grav) b.head('gravity: on');
  lay.draw(b);
  const keep = [];
  lay.regions.forEach((rg, i) => keep.push(...PIECES[picks[i]].draw(b, rg)));
  if (sleepers) for (const rg of lay.regions) sleeper(b, rg, keep, r);
  const ends = (x, y) => away(1, 1, 3)(x, y) && away(57, 22, 2)(x, y);
  const some = (ch, n, opts) => { try { b.spread(ch, n, opts); } catch (e) { /* the region is full */ } };
  for (const [x, y, w, h] of lay.regions) {
    const area = w * h, ok = (xx, yy) => ends(xx, yy) && outside(...keep)(xx, yy), box = { x0: x, y0: y, x1: x + w - 1, y1: y + h - 1 };
    some('*', Math.round(area / (9 - k / 12)), { ...box, ok });
    some('O', Math.round(area / (26 - k / 4)), { ...box, ok });
    if (air) some('t', 1, { ...box, ok: ends });
  }
  if (dark) some('L', 3, { ok: ends });
  b.set(1, 1, '@').set(57, 22, 'X').set(56, 22, '.').set(57, 21, '.');
  b.fit(0.8);
  roomy(b.g); // every Gamma and Neutron gets room to be seen, none near the start
  b.save();
}
