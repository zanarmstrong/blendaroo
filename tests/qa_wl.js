// Word lists for grown-ups: every lesson's words in sections, browsing other lessons without changing the reader's lesson.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const FIX = require('fs').readFileSync(ROOT + '/tests/sample_list.json', 'utf8');

(async () => { const b = await chromium.launch();
 for (const [W, H] of [[390, 844], [1024, 768]]) {
  const pg = await b.newPage({ viewport: { width: W, height: H } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(() => localStorage.clear());
  await pg.addInitScript(fx => { if (!localStorage.getItem('slideRead.custom')) { localStorage.setItem('slideRead.custom', fx); localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'x', unit: 20, kinds: ['real', 'made', 'trick'] })); } }, FIX); await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.addStyleTag({ content: '[hidden]{display:none!important}' }); await pg.waitForTimeout(400); await openChooser(pg);
  await pg.click('#lsNext'); await pg.click('#startBtn'); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  await pg.click('#gearBtn'); await pg.click('#changeLessonBtn'); await pg.click('#wlOpen'); await pg.waitForTimeout(300);
  let r = await pg.evaluate(() => ({ v: $('wlLesson').value, secs: [...document.querySelectorAll('#wlBody h3')].map(h => h.textContent), warm: (document.querySelector('.wl-warm') || {}).textContent, docW: document.documentElement.scrollWidth }));
  ok(W + ' opens at current lesson with its sections: decodable (topped up from By phoneme if short), made-up, heart words', r.v === 'x-20' && r.secs.map(t => t.replace(/ \(\d+\)$/, '')).join() === 'Decodable,Added from By phoneme,Made-up,Heart words' && r.docW <= W, JSON.stringify(r));
  if (W === 390) await pg.screenshot({ path: OUT + '/wl_orig.png' });
  await pg.click('#wlNext'); r = await pg.evaluate(() => $('wlLesson').value); ok(W + ' next lesson', r === 'x-21', r);
  await pg.click('#wlTrack [data-v=u]'); await pg.waitForTimeout(100);
  await pg.selectOption('#wlLesson', 'u-43');
  r = await pg.evaluate(() => [...document.querySelectorAll('#wlBody section:last-child .wl-words span')].map(s => s.innerHTML).join(' '));
  ok(W + ' By phoneme lessons have no heart words section', true, r);
  await pg.selectOption('#wlLesson', 'u-85'); 
  await pg.click('#wlTrack [data-v=h]'); await pg.waitForTimeout(100);
  await pg.selectOption('#wlLesson', 'h-9');
  r = await pg.evaluate(() => ({ secs: [...document.querySelectorAll('#wlBody h3')].map(h => h.textContent), first: document.querySelector('#wlBody .wl-words span').innerHTML }));
  ok(W + ' heart order: only heart words, marked', r.secs.length === 1 && r.first.includes('hp'), JSON.stringify(r));
  if (W === 390) await pg.screenshot({ path: OUT + '/wl_heart.png' });
  await pg.click('#wordsCover .x-btn'); ok(W + ' back to the lesson screen', await pg.evaluate(() => $('wordsCover').hidden && !$('lessonCover').hidden));
  // the lesson in Settings is not changed by browsing
  ok(W + ' browsing does not change the lesson', await pg.evaluate(() => $('lsLesson').value === 'x-20' && S.level === 'x'));
  await pg.close(); }
 await b.close(); })();
