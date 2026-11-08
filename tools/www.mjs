// Gathers what the apps ship into www/ (Capacitor's webDir): welcome (index.html), the game
// (play.html), and the classic level data the game fetches next to it. Nothing else in the repo
// (levels/, tools/, tests/) is needed at run time.
// Capacitor always opens index.html, so the welcome is the start screen and Play opens play.html.
// The app copy of the game gets data-app on <html>, which makes it show the on-screen keys
// on every device, mouse or trackpad or not.
// Run before every cap sync: node tools/www.mjs (npm run sync does both).
import { mkdirSync, rmSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'www');

for (const f of ['index.html', 'play.html', 'gamedata.txt', 'privacy.html']) {
  if (!existsSync(join(ROOT, f))) throw new Error(`missing ${f}`);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

copyFileSync(join(ROOT, 'index.html'), join(OUT, 'index.html'));
copyFileSync(join(ROOT, 'gamedata.txt'), join(OUT, 'gamedata.txt'));
copyFileSync(join(ROOT, 'privacy.html'), join(OUT, 'privacy.html'));

const game = readFileSync(join(ROOT, 'play.html'), 'utf8');
const stamped = game.replace(/<html(?=[\s>])/, '<html data-app');
if (stamped === game) throw new Error('play.html has no <html> tag to mark as the app');
writeFileSync(join(OUT, 'play.html'), stamped);

console.log('www/: index.html (welcome), play.html (game, data-app), gamedata.txt, privacy.html');
