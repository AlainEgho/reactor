// Gathers what the apps ship into www/ (Capacitor's webDir): the game itself and the classic level
// data it fetches next to it. Nothing else in the repo (levels/, tools/, tests/) is needed at run time.
// The app copy of index.html gets data-app on <html>, which makes the game show the on-screen keys
// on every device, mouse or trackpad or not.
// Run before every cap sync: node tools/www.mjs (npm run sync does both).
import { mkdirSync, rmSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
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

const page = join(OUT, 'index.html');
const html = readFileSync(page, 'utf8');
const stamped = html.replace(/<html(?=[\s>])/, '<html data-app');
if (stamped === html) throw new Error('index.html has no <html> tag to mark as the app');
writeFileSync(page, stamped);

console.log(`www/: ${FILES.join(', ')} (index.html marked data-app)`);
