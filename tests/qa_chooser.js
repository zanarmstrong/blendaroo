// The lesson chooser (Zan, Nov 19): titled "Choose a lesson", its button always in view, Words / Which lessons under "More options"
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
  for (const vp of [{ width: 1200, height: 800 }, { width: 390, height: 700 }, { width: 800, height: 400 }, { width: 320, height: 480 }]) {
    const pg = await b.newPage({ viewport: vp }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
    pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(400); await pg.click('#rdChange'); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => { const g = $('lsNext').getBoundingClientRect(); return { t: document.querySelector('#lessonCover h2').textContent, in: g.top >= 0 && g.bottom <= innerHeight, open: $('lsMore').open, txt: $('lsNext').textContent.trim() }; });
    ok(`${vp.width}x${vp.height}: "Choose a lesson", "Use this lesson" button in view without scrolling, options closed`, r.t === 'Choose a lesson' && r.in && !r.open && r.txt === 'Use this lesson', JSON.stringify(r));
    if (vp.width === 390) {
      await pg.click('#lsMore summary'); await pg.evaluate(() => document.querySelector('#lessonCover .card').scrollTop = 0);
      const s = await pg.evaluate(() => { const g = $('lsNext').getBoundingClientRect(); return g.bottom <= innerHeight; });
      ok('options open: button still in view at the top of the list', s);
      await pg.click('#lsKinds [data-v=made]'); const m = await pg.evaluate(() => { $('lsMore').open = false; return $('lsMoreNow').textContent; });
      ok('the closed options say what is chosen', m === '· decodable · this lesson only', m);
      await pg.click('#lsNext'); await pg.waitForTimeout(300);
      ok('Use this lesson closes the chooser and keeps the choice', await pg.evaluate(() => $('lessonCover').hidden && S.kinds.join() === 'real'));
    }
    await pg.close();
  }
  await b.close(); })();
