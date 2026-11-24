// Top bar (Zan, Nov 19): bare icons (gear, alien, book), no button shapes, no progress bar, just "0 / 20"; Settings fits small phones
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
  for (const w of [320, 390, 1100]) {
    const pg = await b.newPage({ viewport: { width: w, height: 700 } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
    pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(400); await pg.click('#startBtn'); await pg.waitForTimeout(200);
    if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip'); await pg.waitForTimeout(200);
    let r = await pg.evaluate(() => { const ids = ['gearBtn', 'mineBtn', 'unitLabel'], rs = ids.map(i => $(i).getBoundingClientRect()), cs = ids.map(i => getComputedStyle($(i)));
      return { oneRow: new Set(rs.map(x => Math.round(x.top)).concat(Math.round($('scoreNum').getBoundingClientRect().top) - 11)).size <= 2 && Math.abs(rs[0].top - rs[2].top) < 1,
        tap: rs.every(x => x.width >= 44 && x.height >= 44), bare: cs.every(c => c.borderTopWidth === '0px' && c.backgroundColor === 'rgba(0, 0, 0, 0)'),
        icons: !!$('gearBtn').querySelector('svg') && !!$('unitLabel').querySelector('svg') && !$('gearBtn').textContent.trim() && !$('unitLabel').textContent.trim(),
        noBar: !document.getElementById('gbar'), score: $('scoreNum').textContent, lesson: $('unitLabel').title, docW: document.documentElement.scrollWidth };
    });
    ok(`${w}px: gear, alien and book are bare icons in one row, each a 44px tap area; score "0 / 20" and no progress bar`, r.oneRow && r.tap && r.bare && r.icons && r.noBar && r.score === '0 / 20' && /^Lesson: /.test(r.lesson) && r.docW <= w, JSON.stringify(r));
    await pg.click('#unitLabel'); await pg.waitForTimeout(300); ok(`${w}px: the book opens "Choose a lesson"`, await pg.evaluate(() => !$('lessonCover').hidden));
    await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); }); await pg.waitForTimeout(300);
    r = await pg.evaluate(() => ({ open: !$('sheet').hidden, sw: $('panel').scrollWidth, cw: $('panel').clientWidth }));
    ok(`${w}px: the gear opens Settings, which fits the screen (no sideways scroll)`, r.open && r.sw <= r.cw, JSON.stringify(r));
    await pg.close();
  }
  await b.close(); })();
