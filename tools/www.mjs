// Gathers what the apps ship into www/ (Capacitor's webDir): the game itself and the classic level
// data it fetches next to it. Nothing else in the repo (levels/, tools/, tests/) is needed at run time.
// Run before every cap sync: node tools/www.mjs (npm run sync does both).
import { mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'www');
const FILES = ['index.html', 'gamedata.txt'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of FILES) {
  if (!existsSync(join(ROOT, f))) throw new Error(`missing ${f}`);
  copyFileSync(join(ROOT, f), join(OUT, f));
}
console.log(`www/: ${FILES.join(', ')}`);
