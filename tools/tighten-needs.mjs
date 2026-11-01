// Raises level needs towards what the search player proved it can take, then writes them into
// tools/needs.mjs and the need: line of every level file.
// Usage: node tools/tighten-needs.mjs [probe.log]   (the log of `node tests/solve-levels.mjs --most`)
// With no log it only applies tools/needs.mjs to the level files (after a hand edit of the table).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NEEDS } from './needs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(here, '..', 'levels');
const files = readdirSync(LEVELS_DIR).filter(f => /^\d{3}-.*\.txt$/.test(f)).sort();
const byNum = new Map(files.map(f => [+f.slice(0, 3), f]));

// The most a level can be asked for and still pass the engine test's supply check.
function cap(text) {
  const flat = text.split(/^---$/m)[1], n = ch => flat.split(ch).length - 1;
  return n('*') + 6 * n('e') + 3 * n('U') + 2 * n('h') + 6 * n('P');
}

const table = Object.assign({}, NEEDS);
// --lower: a won probe sets the need to what it proved, down as well as up (for new levels, whose drawn
// needs are only guesses). Without it a need is never lowered.
const lower = process.argv.includes('--lower');
const log = process.argv.slice(2).find(a => a !== '--lower');
if (log) {
  for (const line of readFileSync(log, 'utf8').split('\n')) {
    const m = line.match(/^most (\d{3}) .* need (\d+) took (\d+) (won|stuck)/);
    if (!m) continue;
    const num = +m[1], need = +m[2], took = +m[3];
    if (need === 0) continue; // a no-Pellet level stays one
    // Proven: leave one Pellet in twenty spare. Not proven to the Reactor: go half way, the re-prove decides.
    const target = m[4] === 'won' ? took - Math.floor(took / 20) : need + Math.floor((took - need) / 2);
    const next = Math.min(cap(readFileSync(join(LEVELS_DIR, byNum.get(num)), 'utf8')), lower && m[4] === 'won' ? Math.max(1, target) : Math.max(need, target));
    if (next !== need) table[num] = next;
  }
}

const nums = Object.keys(table).map(Number).sort((a, b) => a - b);
writeFileSync(join(here, 'needs.mjs'), `// Tightened Pellet needs, by level number. Written by tools/tighten-needs.mjs from a
// \`node tests/solve-levels.mjs --most\` probe; Board.save() uses these, so a design batch re-run keeps them.
export const NEEDS = {
${nums.map(n => `  ${n}: ${table[n]},`).join('\n')}
};
`);

let changed = 0;
for (const n of nums) {
  const file = join(LEVELS_DIR, byNum.get(n)), text = readFileSync(file, 'utf8');
  const old = +text.match(/^need: (\d+)/m)[1];
  if (old === table[n]) continue;
  writeFileSync(file, text.replace(/^need: \d+/m, `need: ${table[n]}`).replace(new RegExp(`^(hint: .*?)\\b${old} Pellets`, 'm'), `$1${table[n]} Pellets`));
  console.log(`${byNum.get(n)}  need ${old} -> ${table[n]}`);
  changed++;
}
console.log(`${changed} level files changed, ${nums.length} needs in the table`);
