// Heart words lessons: their order, warm-ups, hearts on words, and hearts that drop once an uploaded list's lesson teaches the pattern.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const FIX = require('fs').readFileSync(ROOT + '/tests/sample_list.json', 'utf8');

(async () => { const b = await chromium.launch();
 for (const [W, H] of [[390, 844], [1024, 768]]) {
  const pg = await b.newPage({ viewport: { width: W, height: H } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); sessionStorage.setItem('x', 1); } });
  await pg.addInitScript(fx => { if (!localStorage.getItem('slideRead.custom')) { localStorage.setItem('slideRead.custom', fx); localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'x', unit: 20, kinds: ['real', 'made', 'trick'] })); } }, FIX); await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.addStyleTag({ content: '[hidden]{display:none!important}' }); await pg.waitForTimeout(400); await openChooser(pg);
  await pg.click('#lsTrack [data-v=h]');
  let r = await pg.evaluate(() => ({ nH: DATA_H.lessons.length, n: $('lsLesson').options.length, v: $('lsLesson').value, kinds: ls.kinds, count: $('lsCount').textContent,
    kindBtns: [...document.querySelectorAll('#lsKinds button')].map(b => b.getAttribute('aria-pressed')).join() }));
  ok(W + ' heart order: all its lessons, heart words on', r.n === r.nH && r.v === 'h-1' && r.kinds.join() === 'trick', JSON.stringify(r));
  if (W === 390) await pg.screenshot({ path: OUT + '/heart_ls.png' });
  await pg.selectOption('#lsLesson', 'h-9');
  await pg.click('#lsNext'); await pg.click('#startBtn'); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => ({ warm: !$('warmCover').hidden, s: $('warmSound').textContent, ex: $('warmWord').textContent }));
  ok(W + ' warm-up', r.warm, JSON.stringify(r));
  if (W === 390) await pg.screenshot({ path: OUT + '/heart_warm.png' });
  await pg.click('#warmSkip');
  r = await pg.evaluate(() => ({ w: current.w, trick: current.trick, hearts: [...document.querySelectorAll('#word .ch')].map(s => (s.classList.contains('heart') ? '♥' : '') + s.textContent).join(' ') }));
  ok(W + ' a heart word with its heart', r.trick && r.hearts.includes('♥'), JSON.stringify(r));
  if (W === 390) await pg.screenshot({ path: OUT + '/heart_word.png' });
  // he/she lesson shows the e as a heart in this order (not "learned")
  r = await pg.evaluate(() => { S.level = 'h'; S.unit = 1; current = { w: 'she', trick: true, ord: 2001 }; setup(); return [...document.querySelectorAll('#word .ch')].map(s => (s.classList.contains('heart') ? '♥' : '') + s.textContent).join(' '); });
  ok(W + ' she: e is a heart', r === 'sh e', r);   // she is no longer an Irregulars word (not permanently irregular)
  // the same word in an uploaded list, at its lesson 20: open syllables aren't taught yet
  r = await pg.evaluate(() => { S.level = 'x'; S.unit = 20; current = { w: 'she', trick: true, ord: 5020 }; setup(); return [...document.querySelectorAll('#word .ch')].map(s => (s.classList.contains('heart') ? '♥' : '') + s.textContent).join(' '); });
  ok(W + ' she at an uploaded list\'s lesson 20: e still a heart (no open syllables yet)', r === 'sh ♥e', r);
  // back to custom list restores kinds
  await pg.evaluate(() => { S.level = 'h'; S.unit = 9; openLesson(); });
  await pg.click('#lsTrack [data-v=x]');
  r = await pg.evaluate(() => ls.kinds.join());
  ok(W + ' back to custom list: decodable + made-up again', r === 'real,made,trick', r);   // custom lists bring their heart words
  await pg.close(); }
 await b.close(); })();
