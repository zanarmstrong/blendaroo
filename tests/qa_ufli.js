// By phoneme (UFLI order): lesson list, warm-ups, first lesson's words, no heart words, and switching between orders.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const FIX = require('fs').readFileSync(ROOT + '/tests/sample_list.json', 'utf8');

(async () => { const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1024, height: 768 } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message, e.stack));
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); sessionStorage.setItem('x', 1); } });
  await pg.addInitScript(fx => { if (!localStorage.getItem('slideRead.custom')) { localStorage.setItem('slideRead.custom', fx); localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'x', unit: 20, kinds: ['real', 'made', 'trick'] })); } }, FIX); await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.addStyleTag({ content: '[hidden]{display:none!important}' }); await pg.waitForTimeout(500); await openChooser(pg);
  ok('order toggle on lesson screen, custom list selected', await pg.evaluate(() => document.querySelector('#lsTrack [data-v=x]').getAttribute('aria-pressed') === 'true'));
  await pg.click('#lsTrack [data-v=u]');
  let r = await pg.evaluate(() => ({ n: $('lsLesson').options.length, v: $('lsLesson').value, first: $('lsLesson').options[0].text, sel: $('lsLesson').selectedOptions[0].text, count: $('lsCount').textContent }));
  ok('UFLI list', r.n > 100 && r.v === 'u-5', JSON.stringify(r));
  await pg.click('#lsNext'); await pg.click('#startBtn');
  r = await pg.evaluate(() => ({ warm: !$('warmCover').hidden, sound: $('warmSound').textContent, ex: $('warmWord').textContent }));
  ok('UFLI warm-up', r.warm && r.sound, JSON.stringify(r));
  await pg.click('#warmSkip');
  r = await pg.evaluate(() => ({ w: current.w, inLesson: U_BY[5].real.includes(current.w) || U_BY[5].made.includes(current.w), label: $('unitLabel').textContent }));
  ok('word from UFLI lesson 5 (first By phoneme lesson)', r.inLesson, JSON.stringify(r));
  // chunking per lesson
  const samples = [['catch', 69], ['badge', 70], ['light', 87], ['pie', 87], ['more', 78], ['care', 112], ['thing', 51], ['think', 52], ['dance', 60],
    ['face', 60], ['plunge', 61], ['lamb', 98], ['knee', 98], ['station', 119], ['picture', 120], ['jumped', 64], ['table', 75], ['ghost', 118],
    ['sign', 118], ['eight', 114], ['fruit', 91], ['caught', 93], ['house', 96], ['happy', 74], ['by', 73], ['find', 72], ['forest', 78],
    ['signal', 118], ['singing', 65], ['finger', 51], ['cake', 54], ['ship', 45], ['man', 11]];
  const out = await pg.evaluate(s => s.map(([w, n]) => { const p = chunks(w, 1000 + n); const si = silentE(p, 1000 + n); return w + ': ' + p.map((c, i) => i === si ? '(' + c + ')' : c.length > 1 ? '_' + c + '_' : c).join(' '); }), samples);
  console.log(out.join(' | '));
  // first order unchanged for a few words
  const f = await pg.evaluate(() => ['thing', 'think', 'find', 'more', 'jumped', 'cake', 'man'].map(w => w + ': ' + chunks(w, 217).join(' ')));
  console.log('first order:', f.join(' | '));
  // By phoneme lessons only hold words the reader can decode by then: no heart words in any of them
  r = await pg.evaluate(() => { const bad = []; LESSONS.filter(x => x.level === 'u').forEach(x => poolFor('u', x.unit, ['real', 'made', 'trick'], false).forEach(c => { if (c.trick) bad.push(x.unit + ':' + c.w); })); return bad; });
  ok('By phoneme lessons have no heart words', r.length === 0, r.slice(0, 8).join());
  // settings: switch order and back keeps lessons
  await pg.evaluate(() => { S.level = 'u'; S.unit = 72; rememberLesson(); });
  await pg.evaluate(() => openLesson());
  await pg.click('#lsTrack [data-v=x]');
  r = await pg.evaluate(() => ({ v: $('lsLesson').value, n: $('lsLesson').options.length }));
  ok('settings: back to custom list shows 34 lessons and its last lesson', r.n === 34, JSON.stringify(r));
  await pg.click('#lsTrack [data-v=u]');
  ok('settings: UFLI again remembers 72', await pg.evaluate(() => $('lsLesson').value) === 'u-72');
  await pg.click('#lsNext');
  // pools: every UFLI lesson has words for the default kinds; cumulative works
  r = await pg.evaluate(() => DATA_U.map(x => [x.n, poolFor('u', x.n, ['real', 'made'], false).length]).filter(([n, c]) => c < 8));
  console.log('small UFLI lessons (<8 words):', JSON.stringify(r));
  r = await pg.evaluate(() => [poolFor('u', 10, ['real', 'made'], true).length, poolFor('u', 128, ['real'], true).length, poolFor('2', 3, ['real'], true).length]);
  console.log('cumulative pools (u10, u128, original 2-3):', JSON.stringify(r));
  await pg.screenshot({ path: OUT + '/ufli_word.png' });
  await pg.evaluate(() => openLesson()); await pg.waitForTimeout(200); await pg.screenshot({ path: OUT + '/ufli_lesson.png' });
  await b.close(); })();
