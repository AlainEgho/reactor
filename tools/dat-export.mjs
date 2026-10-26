// Converts a Supaplex level file (LEVELS.DAT, *.SP, any set of 1536-byte levels) into readable text:
// one .txt per level in the remake's level format, plus index.txt.
// Output stays wherever you point it; keep it out of levels/, which build.mjs compiles into the game.
// Usage: node tools/dat-export.mjs <LEVELS.DAT> <output-dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) { console.error('Usage: node tools/dat-export.mjs <LEVELS.DAT> <output-dir>'); process.exit(2); }

const LEVEL = 1536, W = 60, H = 24;
// Tile code -> map symbol. Special ports (13-16) use the plain port arrow and get a "special:" header line.
// Decorative RAM (26, 27, 38, 39) becomes R and decorative hardware (28-37) becomes #; index.txt counts them.
const SYM = [' ', 'O', '.', '@', '*', 'R', '#', 'X', 'o', '>', 'v', '<', '^', '>', 'v', '<', '^',
  'S', 'y', 'T', 'd', '|', '-', '+', 'e', 'B', 'R', 'R', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', 'R', 'R', '%'];

const bytes = readFileSync(input);
if (bytes.length < LEVEL || bytes.length % LEVEL) { console.error(`${input} is ${bytes.length} bytes; expected a multiple of ${LEVEL}.`); process.exit(1); }
mkdirSync(outDir, { recursive: true });

const index = [`Source: ${basename(input)} (${bytes.length / LEVEL} levels)`, '',
  'No.  Name                     Need  Grav  FrzZ  Specials  Murphy  Exit  Infotrons  Electrons  Decor  Unknown'];
let decorTotal = 0, unknownTotal = 0;
for (let n = 0; n < bytes.length / LEVEL; n++) {
  const o = n * LEVEL, h = o + W * H;
  let name = '';
  for (let i = 6; i < 29; i++) name += String.fromCharCode(bytes[h + i]);
  name = name.replace(/^[-\s]+|[-\s]+$/g, '').replace(/\s+/g, ' ') || `LEVEL ${n + 1}`;
  const grav = bytes[h + 4] === 1, freezeZ = bytes[h + 29] === 2, needByte = bytes[h + 30];
  const rows = [], counts = {};
  let decor = 0, unknown = 0;
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const code = bytes[o + y * W + x];
      counts[code] = (counts[code] || 0) + 1;
      if ((code >= 26 && code <= 39)) decor++;
      const s = SYM[code];
      if (s === undefined) { unknown++; row += '?'; } else row += s;
    }
    rows.push(row);
  }
  const infotrons = counts[4] || 0;
  const need = needByte || (infotrons & 255);
  const specials = [];
  for (let i = 0; i < Math.min(10, bytes[h + 31]); i++) {
    const e = h + 32 + i * 6, pos = ((bytes[e] << 8) | bytes[e + 1]) >> 1;
    const x = pos % W, y = Math.floor(pos / W);
    const flags = [bytes[e + 3] === 2 ? 'freeze-zonks' : '', bytes[e + 4] === 1 ? 'freeze-enemies' : ''].filter(Boolean).join(' ');
    specials.push(`special: ${x},${y} gravity ${bytes[e + 2] === 1 ? 'on' : 'off'}${flags ? ' ' + flags : ''}`);
  }
  const header = [`name: ${name}`, `need: ${need}`, ...(needByte ? [] : ['# need was 0 in the file, which means every Infotron']),
    ...(grav ? ['gravity: on'] : []), ...(freezeZ ? ['freeze-zonks: on'] : []), ...specials,
    `# source: ${basename(input)} level ${n + 1}`, ...(counts[40] ? ['# % marks an invisible wall'] : [])];
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'level';
  writeFileSync(join(outDir, `${String(n + 1).padStart(3, '0')}-${slug}.txt`), [...header, '---', ...rows].join('\n') + '\n');
  decorTotal += decor; unknownTotal += unknown;
  index.push(`${String(n + 1).padStart(3, '0')}  ${name.padEnd(23).slice(0, 23)}  ${String(need).padStart(4)}  ${grav ? ' on ' : ' -  '}  ${freezeZ ? ' on ' : ' -  '}  ${String(specials.length).padStart(8)}  ${String(counts[3] || 0).padStart(6)}  ${String(counts[7] || 0).padStart(4)}  ${String(infotrons).padStart(9)}  ${String(counts[24] || 0).padStart(9)}  ${String(decor).padStart(5)}  ${String(unknown).padStart(7)}`);
}
index.push('', 'Map key: space empty, . Base, # hardware, R RAM chip, O Zonk, * Infotron, @ Murphy, X Exit, S Snik Snak,',
  'e Electron, B Bug, o/y/d orange/yellow/red disk, T Terminal, > < ^ v one-way ports, - | two-way, + four-way,',
  '% invisible wall, ? unknown code. Decorative RAM and hardware are written as R and #.');
writeFileSync(join(outDir, 'index.txt'), index.join('\n') + '\n');
console.log(`Wrote ${bytes.length / LEVEL} level files and index.txt to ${outDir}`);
console.log(`Decorative tiles folded into R/#: ${decorTotal}. Unknown codes: ${unknownTotal}.`);
