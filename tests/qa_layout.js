// the slide groove is never squashed, and the word, groove, hint and buttons all fit, at many window sizes (Zan, Nov 12)
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const path = require('path');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[1232, 680], [1232, 560], [1232, 460], [900, 680], [1600, 1000], [390, 844], [844, 390], [1024, 768]]) {
    const pg = await b.newPage({ viewport: { width: w, height: h } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.goto(HTTP + path.join(ROOT, 'docs', 'index.html')); await pg.waitForTimeout(400); await openChooser(pg);
    await pg.click('#lsNext'); await pg.click('#startBtn'); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
    for (const word of ['cat', 'shrimp', 'stretched']) {
      await pg.evaluate(wd => { current = { w: wd, ord: 1060 }; setup(); }, word); await pg.waitForTimeout(150);
      const r = await pg.evaluate(() => { const t = $('track').getBoundingClientRect(), nb = $('nextBtn').getBoundingClientRect();
        return { groove: Math.round(t.height), font: parseFloat($('word').style.fontSize), buttonsOnScreen: nb.bottom <= innerHeight + 1 && nb.height > 0 }; });
      ok(`${w}x${h} "${word}": groove full height, buttons on screen, word readable`, r.groove >= 60 && r.buttonsOnScreen && r.font >= 40, JSON.stringify(r));
    }
    await pg.close(); }
  await b.close(); })();
