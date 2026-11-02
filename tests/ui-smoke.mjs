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

// Opens a Fission level from the menu: back to the categories if another one is open, into the
// category that holds it, then its card.
const openLevel = async lv => {
  await page.locator('#bLevels').click();
  if (!(await page.locator(`.lv[data-lv="${lv}"]`).count())) {
    if (await page.locator('[data-act="cats"]').count()) await page.locator('[data-act="cats"]').click();
    const k = await page.$$eval('.cat', (els, n) => els.find(e => +e.dataset.first <= n && n <= +e.dataset.last).dataset.cat, +lv);
    await page.locator(`.cat[data-cat="${k}"]`).click();
  }
  await page.locator(`.lv[data-lv="${lv}"]`).click();
  await page.locator('#ov').waitFor({ state: 'hidden' });
};

// The entrance shows one card per category; a category lists only its own levels.
await page.goto(pathToFileURL(join(here, '..', 'index.html')).href);
// The game opens on a sign-in screen; a name is all it asks for.
await page.locator('#nameIn').waitFor();
check(await page.locator('.cat').count() === 0, 'the game opens on a sign-in screen');
await page.locator('#loginForm button').click();
check(/Enter a name/.test(await page.locator('.login .err').textContent()), 'signing in without a name is refused');
await page.locator('#nameIn').fill('Tester');
await page.locator('#loginForm button').click();
// The first sign-in ever opens the How to play guide; its pages turn, and Escape leaves it for the menu.
await page.locator('.panel.help').waitFor();
check(/How to play · 1\/10/.test(await page.locator('.helphead small').textContent()), 'the first sign-in opens the How to play guide');
// Each page runs a little scene with the game's engine; the picture changes as Iso moves.
const sceneSig = () => page.$eval('.hcv', c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 997) s = (s * 31 + d[i]) >>> 0; return s; });
await page.waitForTimeout(300);
const sig0 = await sceneSig(); await page.waitForTimeout(700);
check(sig0 !== await sceneSig(), 'the guide\'s first page is a live scene that moves');
await page.locator('[data-act="helpnext"]').click(); await page.locator('[data-act="helpnext"]').click();
await page.waitForTimeout(150);
check(/3\/10/.test(await page.locator('.helphead small').textContent()) && await page.locator('.hnum').textContent() === '3', 'the third page counts the cans left to grab');
await page.waitForTimeout(1400);
check(await page.locator('.hnum').textContent() === '0', 'and the count reaches 0 as Iso grabs them');
// The snap page: Iso grabs the cans around him without leaving his cell, and the grab key lights up.
await page.locator('[data-act="helpnext"]').click(); await page.waitForTimeout(1300);
const snapG = await page.evaluate(() => { const g = window.__fission().help(); return { x: g.m.x, y: g.m.y, got: g.got }; });
check(snapG.x === 4 && snapG.y === 2 && snapG.got >= 3, 'the snap page grabs cans without Iso moving (' + JSON.stringify(snapG) + ')');
check(await page.locator('.hkeys .hkey.act').count() === 1, 'every scene shows the key strip with the grab key');
await page.keyboard.press('Escape');
await page.locator('.cat').first().waitFor();
check(/Signed in as Tester/.test(await page.locator('.mark .who').textContent()), 'the menu greets the signed-in player');
check(await page.locator('.cat').count() === 17, 'the entrance shows seventeen categories');
// The guide opens again from the menu, and its last page ends on Let's play.
await page.locator('.menubar [data-act="help"]').click();
await page.locator('.panel.help').waitFor();
for (let i = 0; i < 9; i++) await page.locator('[data-act="helpnext"]').click();
check(/Let's play/.test(await page.locator('.helpnav .primary').textContent()), 'the guide reopens from the menu and ends on Let\'s play');
await page.locator('.helpnav .primary').click();
await page.locator('.cat').first().waitFor();
await page.screenshot({ path: join(shots, 'ui-menu.png') });
await page.locator('.cat[data-cat="5"]').click();
check(await page.locator('.lv').count() === 25 && /Physics Wing/.test(await page.locator('.cathead h3').textContent()), 'the Physics Wing opens on its 25 levels');
check(await page.locator('.cathead .backbtn').count() === 1, 'an open category has a back button to the categories');
// A category's first five levels are open; the rest open one at a time as the one before is cleared.
check(await page.locator('.lv:not(.locked)').count() === 5 && await page.locator('.lv[data-lv="145"]:not(.locked)').count() === 1 && await page.locator('.lv[data-lv="146"].locked[disabled]').count() === 1 && await page.locator('.lv.locked[disabled]').count() === 20, 'the first five Physics levels are open; the other 20 are locked');
await page.screenshot({ path: join(shots, 'ui-category.png') });
await page.keyboard.press('Escape');
check(await page.locator('.cat').count() === 17, 'Escape goes back to the categories');
const minis = await page.$$eval('.cat img.mini', els => els.filter(e => e.complete && e.naturalWidth > 0).length);
check(minis === 17, `every category card shows a miniature (${minis})`);
// The access code opens everything (the rest of this test visits levels all over the game).
await page.locator('#codeIn').fill('chernobyl');
await page.locator('.code.done').waitFor();
await page.locator('.cat[data-cat="5"]').click();
check(await page.locator('.lv.locked').count() === 0, 'the access code chernobyl opens every level');
await page.keyboard.press('Escape');

await page.locator('.cat').first().click();
await page.locator('.lv').first().click();
await page.locator('#ov').waitFor({ state: 'hidden' });
for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown']) { await page.keyboard.down(k); await page.waitForTimeout(260); await page.keyboard.up(k); }
await page.waitForTimeout(300);
check(/Level 001/.test(await page.locator('#lvlName').textContent()), 'level 001 is running');
check(/Fuel Hall/.test(await page.locator('#lvlCat').textContent()) && await page.locator('.bar canvas[data-legend]').count() >= 3, 'the HUD names the category and draws icons for its stats');
// A drag on the board walks Iso the way it goes.
const mx0 = await page.evaluate(() => window.__fission().game.m.x);
const cb = await page.locator('#cv').boundingBox();
await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
await page.mouse.down();
await page.mouse.move(cb.x + cb.width / 2 + 80, cb.y + cb.height / 2, { steps: 4 });
await page.waitForTimeout(350);
await page.mouse.up();
await page.waitForTimeout(100);
check(await page.evaluate(() => window.__fission().game.m.x) > mx0, 'a swipe on the board walks Iso');
await page.screenshot({ path: join(shots, 'ui-play.png') });
await page.locator('#bLevels').click();
check(/Fuel Hall/.test(await page.locator('.cathead h3').textContent()), 'Levels opens the category being played');
// The game is still there behind the menu; the back bar returns to it as it was.
const tick0 = await page.evaluate(() => window.__fission().game.tick);
check(/Back to game · Level 001/.test(await page.locator('[data-act="back"]').textContent()), 'the menu offers a way back to the game in progress');
await page.locator('[data-act="back"]').click();
await page.waitForTimeout(400);
check(await page.locator('#ov').isHidden() && await page.evaluate(t => { const f = window.__fission(); return f.screen === 'play' && f.game.tick > t; }, tick0), 'Back to game resumes the same game');

// The Upgrade Wing: Dead Weight hands Iso a Tractor on its second step, and the HUD shows the charges.
await openLevel(132);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(200);
check(/Tractor ×3/.test(await page.locator('#sGad').textContent()), 'the Tractor is equipped with three charges');
await page.keyboard.down('ArrowLeft'); await page.keyboard.down('Shift'); await page.waitForTimeout(200); await page.keyboard.up('Shift'); await page.keyboard.up('ArrowLeft');
await page.waitForTimeout(200);
check(/Tractor ×3/.test(await page.locator('#sGad').textContent()), 'a pull with nothing behind Iso spends no charge');
await page.screenshot({ path: join(shots, 'ui-upgrade.png') });

// The Element Wings: Thin Ice slides Iso along the top row; Hot Ground shows the dose; Blackout is dark.
await openLevel(141);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(1200);
check(/Level 142/.test(await page.locator('#lvlName').textContent()), 'Thin Ice is running');
check(/005/.test(await page.locator('#sNeed').textContent()), 'the slide took the Pellet lying on the ice');
await page.screenshot({ path: join(shots, 'ui-ice.png') });
await openLevel(171);
check(!(await page.locator('#doseStat').isHidden()), 'Hot Ground shows the dose on the HUD');
await page.keyboard.down('ArrowDown'); await page.waitForTimeout(200); await page.keyboard.up('ArrowDown');
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(200); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(700);
check(/[1-9]\d*%/.test(await page.locator('#sDose').textContent()), 'the dose climbs on fallout');
await page.screenshot({ path: join(shots, 'ui-fallout.png') });
await openLevel(196);
await page.waitForTimeout(400);
await page.screenshot({ path: join(shots, 'ui-dark.png') });
await openLevel(165);
await page.waitForTimeout(600);
await page.screenshot({ path: join(shots, 'ui-finals.png') });

// The Gamma Wing: Orbit and Gamma Finals start, and their Gammas run for two seconds without reaching Iso.
for (const [lv, n] of [['241', '242'], ['252', '253']]) {
  await openLevel(lv);
  await page.waitForTimeout(2000);
  check(new RegExp(`Level ${n}`).test(await page.locator('#lvlName').textContent()), `level ${n} is running`);
  check(await page.locator('#ov').isHidden(), `Iso is still standing in level ${n}`);
  await page.screenshot({ path: join(shots, `ui-gamma-${n}.png`) });
}

// Minefield needs no Pellets, so its Reactor is online from the start and the beacon points at it.
await openLevel(98);
await page.waitForTimeout(800);
check(/REACTOR READY/.test(await page.locator('#sNeed').textContent()), 'Minefield starts with the Reactor online');
await page.screenshot({ path: join(shots, 'ui-beacon.png') });
const music = async () => page.locator('#bMusic').textContent();
const before = await music();
await page.keyboard.press('KeyM');
check((await music()) !== before, 'M turns the music ' + (/on/i.test(before) ? 'off' : 'on'));
await page.keyboard.press('KeyM');
check((await music()) === before, 'M turns it back');
const badSfx = await page.evaluate(() => window.__fission().sfx());
check(badSfx.length === 0, 'every sound effect and the score play without error' + (badSfx.length ? ': ' + badSfx.join(' | ') : ''));

// Moments: a level opens on an intro strip that the first key dismisses; pause blurs the board behind
// a popped dialog; a death desaturates the board, and a fresh key brings the tally up at once.
await openLevel(2);
check(await page.locator('#intro:not([hidden]):not(.out)').count() === 1, 'a level opens on its intro strip');
check(/Gamma Alley/.test(await page.locator('#intro b').textContent()) && /Fuel Hall/.test(await page.locator('#intro span').textContent()), 'the strip names the level and its category');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(100);
check(await page.locator('#intro.out').count() === 1, 'the first key dismisses the intro');
await page.keyboard.press('KeyP');
await page.waitForTimeout(100);
check(await page.locator('#cv.paused').count() === 1 && await page.locator('.panel.pop').count() === 1, 'pause blurs the board behind a popped dialog');
await page.keyboard.press('KeyP');
await page.waitForTimeout(100);
check(await page.locator('#cv.paused').count() === 0 && await page.locator('#ov').isHidden(), 'resume clears the blur');
await page.evaluate(() => window.__fission().kill());
await page.waitForTimeout(500);
check(await page.locator('#cv.dead').count() === 1 && await page.locator('#ov').isHidden(), 'a death desaturates the board while the moment plays');
await page.screenshot({ path: join(shots, 'ui-death.png') });
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
check(await page.locator('.panel.rise').count() === 1 && /destroyed/.test(await page.locator('.panel h2').textContent()), 'a fresh key brings the death tally up');

// The Components view lists every component, and each one links to the first level that has it.
await page.locator('#bLevels').click();
await page.locator('.tab[data-view="parts"]').click();
const parts = await page.locator('.part').count();
check(parts === 46, `the Components view lists every component (${parts})`);
await page.screenshot({ path: join(shots, 'ui-parts.png') });
await page.locator('.part', { has: page.locator('b', { hasText: /^Ice$/ }) }).locator('[data-act="play"]').click();
await page.locator('#ov').waitFor({ state: 'hidden' });
check(/Level 142/.test(await page.locator('#lvlName').textContent()), 'Ice links to Thin Ice, the first level with ice');

if (dat) {
  // The menu has no Classic tab; a level file still loads through the file input, onto the classic list.
  await page.locator('#bLevels').click();
  await page.locator('#datFile').setInputFiles(dat);
  await page.locator('.levels.dense .lv').first().waitFor();
  // the list can still be filling when its first card appears
  await page.waitForFunction(() => document.querySelectorAll('.levels.dense .lv').length >= 111, null, { timeout: 5000 }).catch(() => {});
  check(await page.locator('.levels.dense .lv').count() === 111, 'LEVELS.DAT loads 111 levels');
  await page.locator('.levels.dense .lv').first().click();
  await page.locator('#ov').waitFor({ state: 'hidden' });
  await page.waitForTimeout(600);
  check(/Classic 001/.test(await page.locator('#lvlName').textContent()), 'classic level 001 is running');
  await page.screenshot({ path: join(shots, 'ui-original.png') });
  // Bonus floors: the loaded set flipped left to right (its ten warm-ups left out), dealt across the
  // categories and listed under each category's own levels.
  await page.locator('#bLevels').click();
  await page.locator('.tab[data-set="remake"]').click();
  // They stay hidden until the bonus code is typed, even with every level open.
  check(!/overtime/.test(await page.locator('.cat[data-cat="0"] .cmeta').textContent()) && await page.locator('#codeIn').count() === 1, 'bonus floors are hidden until the bonus code is typed');
  await page.locator('#codeIn').fill('bonus');
  await page.locator('.code.done', { hasText: 'bonus floors are on' }).waitFor();
  check(await page.locator('#codeIn').count() === 0, 'with both codes in, the code field goes');
  check(await page.locator('.cat').count() === 17 && /overtime/.test(await page.locator('.cat[data-cat="0"] .cmeta').textContent()), 'with a classic file loaded, the category cards count their bonus floors');
  await page.locator('.cat[data-cat="0"]').click();
  check(await page.locator('.lv:not(.bonus)').count() === 33 && await page.locator('.lv.bonus').count() === 5, 'the Fuel Hall lists its 33 levels and 5 bonus floors');
  await page.locator('.lv.bonus').first().click();
  await page.locator('#ov').waitFor({ state: 'hidden' });
  const mir = await page.evaluate(() => {
    const f = window.__fission(), a = f.dat[10], b = f.mirror[0], swap = { 9: 11, 11: 9, 13: 15, 15: 13, 26: 27, 27: 26 };
    let ok = true;
    for (let y = 0; y < a.H && ok; y++) for (let x = 0; x < a.W; x++) { const c = a.codes[y * a.W + x]; if ((swap[c] || c) !== b.codes[y * b.W + (b.W - 1 - x)]) { ok = false; break; } }
    return { ok, label: document.getElementById('lvlName').textContent, cat: document.getElementById('lvlCat').textContent, hard: f.game.hard, set: f.set };
  });
  check(mir.ok && /Overtime 001/.test(mir.label) && /Fuel Hall · Overtime/.test(mir.cat) && mir.hard && mir.set === 'mirror', 'Overtime 001 is the eleventh classic level flipped, in the Fuel Hall, with tighter par');
  await page.screenshot({ path: join(shots, 'ui-bonus.png') });
  await page.locator('#bLevels').click();
  check(/Fuel Hall/.test(await page.locator('.cathead h3').first().textContent()) && await page.locator('.lv.bonus').count() === 5, 'Levels from a bonus floor opens its category');
  await page.reload();
  await page.locator('.cat').first().waitFor();
  check(await page.evaluate(() => (window.__fission().dat || []).length) === 111 && /overtime/.test(await page.locator('.cat[data-cat="0"] .cmeta').textContent()), 'the loaded file is remembered after a reload');
}
check(errors.length === 0, 'no script errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
