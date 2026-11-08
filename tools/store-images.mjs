// Google Play listing images, painted from the game's own art, in both of its looks: the nuclear
// plant and Christmas mode. Not screenshots: posters for kids, drawn on a canvas inside the game's
// page by tools/store-images.page.js (stickers, speech bubbles, a badge, big outlined type).
// For each look: the 512 px icon, the 1024x500 feature graphic, four phone posters (1080x1920), the
// same four for 7-inch tablets (1200x2133) and two landscape ones for 10-inch tablets (2560x1440).
// Everything is a 24-bit PNG with no alpha, as Play requires.
// Borrows playwright-core like tests/ui-smoke.mjs; set PLAYWRIGHT_FROM to point elsewhere.
// Usage: node tools/store-images.mjs [out-dir]        (default: store/android, replaced)
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { pngFromBase64 } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'store/android');
const LOOKS = ['nuclear', 'christmas'];
const POSTERS = [['hero', '01-hero'], ['crew', '02-meet-the-crew'], ['wings', '03-645-floors'], ['gadgets', '04-power-up']];
const DEVICES = [
  { key: 'phone', w: 1080, h: 1920, kinds: POSTERS },
  { key: 'tablet-7', w: 1200, h: 2133, kinds: POSTERS },
  { key: 'tablet-10', w: 2560, h: 1440, kinds: POSTERS.slice(0, 2) },
];

const from = process.env.PLAYWRIGHT_FROM || 'D:/Omtech/workspace/omtech-agent-portal/package.json';
const { chromium } = createRequire(from)('playwright-core');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto(pathToFileURL(join(ROOT, 'play.html')).href);
await page.waitForFunction(() => window.__fission && window.__fission().part && window.__fission().names);
// The poster fonts must be in before anything is measured or drawn.
await page.evaluate(() => Promise.all([document.fonts.load('700 40px "Chakra Petch"'), document.fonts.load('600 20px "IBM Plex Mono"'), document.fonts.ready]));
await page.addScriptTag({ path: join(ROOT, 'tools/store-images.page.js') });

let count = 0;
const save = (file, buf) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, buf); count++; console.log(file.slice(ROOT.length + 1)); };
const render = async (kind, w, h, look) => pngFromBase64(w, h, await page.evaluate(a => window.POSTERS.render(a.kind, a.w, a.h, a.look), { kind, w, h, look }), true);

rmSync(OUT, { recursive: true, force: true });
for (const look of LOOKS) {
  const dir = join(OUT, look);
  save(join(dir, 'icon-512.png'), await render('icon', 512, 512, look));
  save(join(dir, 'feature-1024x500.png'), await render('feature', 1024, 500, look));
  for (const dev of DEVICES) for (const [kind, name] of dev.kinds) save(join(dir, dev.key, `${name}.png`), await render(kind, dev.w, dev.h, look));
}
await browser.close();
if (errors.length) { console.error('page errors:', errors); process.exitCode = 1; }
console.log(`${count} images in ${OUT}`);
