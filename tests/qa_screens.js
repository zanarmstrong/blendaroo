// Screens (Max Elman, PR #3, Nov 23): Settings, collection, lesson chooser, word lists, add words, privacy and about share
// one layout, a title bar with ✕; Escape and a tap outside the card also close them; the lesson chooser goes back to
// where it was opened from; on a phone they fill the screen.
const { chromium } = require('playwright');
const { ok, HTTP, ROOT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
  const open = async (w, h) => { const pg = await b.newPage({ viewport: { width: w, height: h } }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
    await pg.goto(HTTP + ROOT + '/docs/index.html'); await pg.waitForTimeout(600); return pg; };
  const shown = (pg, id) => pg.evaluate(id => !$(id).hidden, id);
  let pg = await open(1280, 800);
  // lesson chooser from the Ready card: ✕ goes back to the Ready card
  await pg.click('#rdChange'); await pg.waitForTimeout(150);
  await pg.click('#lessonCover .x-btn'); await pg.waitForTimeout(150);
  ok('lesson chooser opened from the Ready card: ✕ goes back to it', !(await shown(pg, 'lessonCover')) && await shown(pg, 'startCover'));
  // from reading: the book icon, then Escape goes back to reading
  await pg.click('#startBtn'); await pg.waitForTimeout(200); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip'); await pg.waitForTimeout(200);
  await pg.click('#unitLabel'); await pg.waitForTimeout(150);
  ok('the book icon opens the lesson chooser while reading', await shown(pg, 'lessonCover'));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  ok('Escape closes it, back to reading', await pg.evaluate(() => [...document.querySelectorAll('.cover, .sheet')].every(c => c.hidden)));
  // Settings: ✕, Escape and a tap outside the card
  await pg.click('#gearBtn'); await pg.waitForTimeout(150);
  await pg.click('#panel .x-btn'); await pg.waitForTimeout(150);
  ok('Settings: ✕ closes', await pg.evaluate(() => $('sheet').hidden));
  await pg.click('#gearBtn'); await pg.waitForTimeout(150); await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  ok('Settings: Escape closes', await pg.evaluate(() => $('sheet').hidden));
  await pg.click('#gearBtn'); await pg.waitForTimeout(150); await pg.mouse.click(10, 400); await pg.waitForTimeout(150);
  ok('Settings: a tap outside the card closes (computer)', await pg.evaluate(() => $('sheet').hidden));
  ok('Settings has its groups', (await pg.evaluate(() => [...document.querySelectorAll('#panel .grp > h3')].map(h => h.textContent))).join() === 'Reading,Look and sound,Progress,Your own word lists,About');
  // collection: ✕
  await pg.click('#mineBtn'); await pg.waitForTimeout(150); await pg.click('#mineCover .x-btn'); await pg.waitForTimeout(150);
  ok('collection: ✕ closes', !(await shown(pg, 'mineCover')));
  await pg.close();
  // phone: screens fill the screen
  pg = await open(390, 844);
  await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); }); await pg.waitForTimeout(400);
  let r = await pg.evaluate(() => { const p = $('panel').getBoundingClientRect(); return { w: p.width, h: p.height }; });
  ok('phone: Settings fills the screen', r.w >= 389 && r.h >= 843, JSON.stringify(r));
  await pg.close(); await b.close(); })();
