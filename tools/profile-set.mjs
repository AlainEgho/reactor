// Profiles a Supaplex level set by numbers only (tile counts, flags, Infotron targets) so new levels
// can be designed to the same difficulty curve. Writes no maps and no names.
// Usage: node tools/profile-set.mjs <LEVELS.DAT> [out.json]
import { readFileSync, writeFileSync } from 'node:fs';

const [input, out] = process.argv.slice(2);
if (!input) { console.error('Usage: node tools/profile-set.mjs <LEVELS.DAT> [out.json]'); process.exit(2); }
const b = readFileSync(input), LEVEL = 1536, W = 60, H = 24;
const KIND = { 0: 'empty', 1: 'zonk', 2: 'base', 4: 'infotron', 5: 'ram', 6: 'hard', 8: 'orange', 17: 'snik', 18: 'yellow', 19: 'terminal', 20: 'red', 24: 'electron', 25: 'bug' };
for (const c of [9, 10, 11, 12, 13, 14, 15, 16, 21, 22, 23]) KIND[c] = 'port';
for (const c of [26, 27, 38, 39]) KIND[c] = 'ram';
for (let c = 28; c <= 37; c++) KIND[c] = 'hard';
KIND[40] = 'hard';

const levels = [];
for (let n = 0; n < b.length / LEVEL; n++) {
  const o = n * LEVEL, h = o + W * H, c = {};
  for (let i = 0; i < W * H; i++) { const k = KIND[b[o + i]]; if (k) c[k] = (c[k] || 0) + 1; }
  const need = b[h + 30] || ((c.infotron || 0) & 255);
  levels.push({ n: n + 1, need, infotrons: c.infotron || 0, zonk: c.zonk || 0, base: c.base || 0, empty: c.empty || 0,
    ram: c.ram || 0, hard: c.hard || 0, snik: c.snik || 0, electron: c.electron || 0, bug: c.bug || 0,
    orange: c.orange || 0, yellow: c.yellow || 0, red: c.red || 0, terminal: c.terminal || 0, port: c.port || 0,
    gravity: b[h + 4] === 1, freezeZonks: b[h + 29] === 2, specials: Math.min(10, b[h + 31]) });
}
if (out) writeFileSync(out, JSON.stringify(levels, null, 1));

// Summary by bands of 10 levels: averages, and how many levels in the band use each mechanic.
const avg = (a, k) => Math.round(a.reduce((s, l) => s + l[k], 0) / a.length);
const uses = (a, f) => a.filter(f).length;
console.log('Levels  need  zonk  base  empty  snik  elec  bug  orng  yell  red  port | levels using: snik elec bug orng yell+term red port grav specials');
for (let i = 0; i < levels.length; i += 10) {
  const a = levels.slice(i, i + 10);
  console.log(`${String(a[0].n).padStart(3)}-${String(a[a.length - 1].n).padEnd(3)} ${[avg(a, 'need'), avg(a, 'zonk'), avg(a, 'base'), avg(a, 'empty'), avg(a, 'snik'), avg(a, 'electron'), avg(a, 'bug'), avg(a, 'orange'), avg(a, 'yellow'), avg(a, 'red'), avg(a, 'port')].map(v => String(v).padStart(5)).join(' ')} | ` +
    [uses(a, l => l.snik), uses(a, l => l.electron), uses(a, l => l.bug), uses(a, l => l.orange), uses(a, l => l.yellow && l.terminal), uses(a, l => l.red), uses(a, l => l.port), uses(a, l => l.gravity), uses(a, l => l.specials)].map(v => String(v).padStart(4)).join(' '));
}
