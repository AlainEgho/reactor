// Draws the app icons from the game itself: Iso, the yellow droid, rendered by its own D.iso at every
// size the Android and iOS projects ship, on the dark board colour with a soft yellow glow behind it.
// Borrows playwright-core like tests/ui-smoke.mjs; set PLAYWRIGHT_FROM to point elsewhere.
// Usage: node tools/icons.mjs        (then npm run sync, or D:\android-build\build-apk.cmd)
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { png } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android/app/src/main/res');
const BG = '#0a0d12'; // the board colour, also capacitor.config.json's backgroundColor

// kind: fg = adaptive foreground (transparent, Iso inside the 66/108 safe zone), square = legacy
// launcher, round = legacy round launcher, ios = full-bleed and opaque (iOS masks the corners).
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const ICONS = [];
for (const [d, k] of Object.entries(DENSITIES)) {
  ICONS.push({ kind: 'fg', size: 108 * k, file: join(RES, `mipmap-${d}/ic_launcher_foreground.png`) });
  ICONS.push({ kind: 'square', size: 48 * k, file: join(RES, `mipmap-${d}/ic_launcher.png`) });
  ICONS.push({ kind: 'round', size: 48 * k, file: join(RES, `mipmap-${d}/ic_launcher_round.png`) });
}
ICONS.push({ kind: 'ios', size: 1024, file: join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png') });

const from = process.env.PLAYWRIGHT_FROM || 'D:/Omtech/workspace/omtech-agent-portal/package.json';
const { chromium } = createRequire(from)('playwright-core');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(ROOT, 'play.html')).href);
await page.waitForFunction(() => window.__fission && window.__fission().drawIso);

for (const icon of ICONS) {
  const pixels = await page.evaluate(({ kind, size, BG }) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const c = cv.getContext('2d'), S = size;
    if (kind === 'square') { c.beginPath(); c.roundRect(S * .04, S * .04, S * .92, S * .92, S * .2); c.fillStyle = BG; c.fill(); }
    if (kind === 'round') { c.beginPath(); c.arc(S / 2, S / 2, S * .46, 0, Math.PI * 2); c.fillStyle = BG; c.fill(); }
    if (kind === 'ios') { c.fillStyle = BG; c.fillRect(0, 0, S, S); }
    // Iso's drawing spans x .11-.89 and y .005-.94 of its cell; u is the cell size, centred on that.
    const u = S * (kind === 'fg' ? .6 : kind === 'ios' ? .76 : .74);
    const ox = S / 2 - .5 * u, oy = S / 2 - .475 * u;
    const glow = c.createRadialGradient(S / 2, oy + .55 * u, 0, S / 2, oy + .55 * u, .62 * u);
    glow.addColorStop(0, 'rgba(245,197,24,.26)'); glow.addColorStop(1, 'rgba(245,197,24,0)');
    c.fillStyle = glow; c.fillRect(0, 0, S, S);
    c.setTransform(u, 0, 0, u, ox, oy);
    window.__fission().drawIso(c); // the everyday Iso facing out, antenna lit, no fuel aura
    return Array.from(c.getImageData(0, 0, S, S).data);
  }, { ...icon, BG });
  writeFileSync(icon.file, png(icon.size, icon.size, pixels, icon.kind === 'ios'));
  console.log(`${icon.size}x${icon.size} ${icon.kind.padEnd(6)} ${icon.file.slice(ROOT.length + 1)}`);
}
await browser.close();
