// Drives index.html in Chromium: menu, a remake level, and (when a path is given) loading LEVELS.DAT.
// Borrows playwright-core from another local checkout; set PLAYWRIGHT_FROM to point elsewhere.
// Usage: node tests/ui-smoke.mjs [path\to\LEVELS.DAT] [screenshot-dir]
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const from = process.env.PLAYWRIGHT_FROM || 'D:/Omtech/workspace/omtech-agent-portal/package.json';
const { chromium } = createRequire(from)('playwright-core');
const here = dirname(fileURLToPath(import.meta.url));
const [dat, shots = here] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
const check = (ok, msg) => { console.log((ok ? '  ok  ' : '  FAIL ') + msg); if (!ok) process.exitCode = 1; };

await page.goto(pathToFileURL(join(here, '..', 'index.html')).href);
await page.locator('.lv').first().waitFor();
check(await page.locator('.lv').count() >= 9, 'menu lists the remake levels');
await page.screenshot({ path: join(shots, 'ui-menu.png') });

await page.locator('.lv').first().click();
await page.locator('#ov').waitFor({ state: 'hidden' });
for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown']) { await page.keyboard.down(k); await page.waitForTimeout(260); await page.keyboard.up(k); }
await page.waitForTimeout(300);
check(/Level 001/.test(await page.locator('#lvlName').textContent()), 'level 001 is running');
await page.screenshot({ path: join(shots, 'ui-play.png') });

if (dat) {
  await page.locator('#bLevels').click();
  await page.locator('.tab[data-set="original"]').click();
  await page.locator('#datFile').setInputFiles(dat);
  await page.locator('.levels.dense .lv').first().waitFor();
  check(await page.locator('.levels.dense .lv').count() === 111, 'LEVELS.DAT loads 111 levels');
  await page.locator('.levels.dense .lv').first().click();
  await page.locator('#ov').waitFor({ state: 'hidden' });
  await page.waitForTimeout(600);
  check(/Original 001/.test(await page.locator('#lvlName').textContent()), 'original level 001 is running');
  await page.screenshot({ path: join(shots, 'ui-original.png') });
  await page.reload();
  await page.locator('.lv').first().waitFor();
  check(await page.locator('.levels.dense .lv').count() === 111, 'the loaded file is remembered after a reload');
}
check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
