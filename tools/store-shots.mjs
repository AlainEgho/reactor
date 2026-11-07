// Gameplay screenshots for the Google Play listing, next to the posters from tools/store-images.mjs.
// Real play: the app build (www/index.html, with the on-screen keys) signed in, every level open, a
// level started and Iso walked a few steps in, shot at store sizes with the camera pulled in a little
// (fewer tiles across than the game would pick by itself). Both looks, phone and the two tablets.
// Output: store/android/<look>/<device>/05-..08-<level>.jpg (JPEG, which Play accepts; 24-bit, no alpha).
// Usage: node tools/www.mjs && node tools/store-shots.mjs [out-dir]        (default: store/android)
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || join(ROOT, 'store/android');
const LOOKS = { nuclear: false, christmas: true };
// Level index (0-based), a file-name slug, and the steps Iso takes before the shot (key, presses).
const SHOTS = [
  [0, 'cold-start', ['ArrowRight', 3]],
  [29, 'neutron-mine', ['ArrowRight', 2]],
  [141, 'thin-ice', ['ArrowRight', 2]],
  [199, 'firing-range', ['ArrowRight', 2]],
];
// CSS viewport, device pixel ratio and tiles across; the pixel size is viewport x dpr.
const DEVICES = [
  { key: 'phone', w: 360, h: 640, dpr: 3, across: 7 },      // 1080 x 1920
  { key: 'tablet-7', w: 600, h: 1066, dpr: 2, across: 8 },  // 1200 x 2132
  { key: 'tablet-10', w: 1280, h: 720, dpr: 2, across: 13 }, // 2560 x 1440
];

const from = process.env.PLAYWRIGHT_FROM || 'D:/Omtech/workspace/omtech-agent-portal/package.json';
const { chromium } = createRequire(from)('playwright-core');
const browser = await chromium.launch();
let count = 0;
for (const [look, xmas] of Object.entries(LOOKS)) {
  for (const dev of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.dpr, hasTouch: true });
    await ctx.addInitScript(on => { try { localStorage.setItem('fission_xmas', on ? 'on' : 'off'); } catch (e) {} }, xmas);
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(join(ROOT, 'www/index.html')).href);
    await page.evaluate(() => Promise.all([document.fonts.load('700 20px "Chakra Petch"'), document.fonts.load('500 12px "IBM Plex Mono"'), document.fonts.ready]));
    await page.addStyleTag({ content: '#toast{display:none!important}' }); // the level hint would cover the board
    await page.fill('#nameIn', 'Iso'); await page.locator('#loginForm button').click();
    // A first sign-in opens the guide; skip it, then open every level with the access code.
    await page.locator('.panel.help').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('#codeIn').waitFor();
    await page.locator('#codeIn').fill('chernobyl'); await page.locator('.code.done').waitFor({ state: 'attached' });
    await page.evaluate(n => window.__fission().across(n), dev.across);
    let i = 5;
    for (const [lv, slug, [key, presses]] of SHOTS) {
      // The menu overlay is already up (after sign-in, or from the pause dialog's Levels button).
      await page.locator('#ov').waitFor();
      if (!(await page.locator(`.lv[data-lv="${lv}"]`).count())) {
        if (await page.locator('[data-act="cats"]').count()) await page.locator('[data-act="cats"]').click();
        const k = await page.$$eval('.cat', (els, n) => els.find(e => +e.dataset.first <= n && n <= +e.dataset.last).dataset.cat, lv);
        await page.locator(`.cat[data-cat="${k}"]`).click();
      }
      await page.locator(`.lv[data-lv="${lv}"]`).scrollIntoViewIfNeeded();
      await page.locator(`.lv[data-lv="${lv}"]`).click();
      await page.locator('#ov').waitFor({ state: 'hidden' });
      await page.waitForTimeout(1200);                    // the floor builds in under the title strip
      for (let p = 0; p < presses; p++) { await page.keyboard.press(key); await page.waitForTimeout(260); }
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => window.__fission().game.state);
      const dir = join(OUT, look, dev.key); mkdirSync(dir, { recursive: true });
      const file = join(dir, `${String(i++).padStart(2, '0')}-${slug}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 94 });
      count++; console.log(file.slice(ROOT.length + 1), state === 'play' ? '' : `(Iso is ${state}!)`);
      await page.keyboard.press('Escape');                 // back to the menu for the next level
      await page.locator('#ov').waitFor();
      if (await page.locator('.panel [data-act="levels"]').count()) await page.locator('.panel [data-act="levels"]').click();
    }
    if (errors.length) { console.error(look, dev.key, 'page errors:', errors); process.exitCode = 1; }
    await ctx.close();
  }
}
await browser.close();
console.log(`${count} screenshots in ${OUT}`);
