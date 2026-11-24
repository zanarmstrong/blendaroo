// Session behaviour: warm-up at the start, Done and the back arrow, b/d redraw, Settings round trips, goal changes, saved places that no longer exist.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
let URL;   // served over http: opened as a file, Chromium sometimes drops what was saved just before a reload (qa_serve.js)
const FIX = require('fs').readFileSync(ROOT + '/tests/sample_list.json', 'utf8');
async function fresh(b, W=1024, H=768, settings={level:'x',unit:20}) {
  const pg = await b.newPage({viewport:{width:W,height:H}}); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(s => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); localStorage.setItem('slideRead.settings', JSON.stringify(s[0])); localStorage.setItem('slideRead.custom', s[1]); sessionStorage.setItem('x','1'); } }, [settings, FIX]);
  await pg.goto(URL); await pg.addStyleTag({content:'[hidden]{display:none!important}'}); await pg.waitForTimeout(400); await openChooser(pg);
  return pg;
}
(async () => { const SRV = await require('./qa_serve')(); URL = SRV.base + 'slide-and-read.html';
  const b = await chromium.launch();
  let pg = await fresh(b);
  await pg.click('#lsNext'); await pg.click('#startBtn');
  ok('warm-up at session start', await pg.evaluate(() => !$('warmCover').hidden)); await pg.click('#warmSkip');
  // 1: Done with no change keeps the word and the 🤔 queue
  let r = await pg.evaluate(() => { const w1 = current.w; $('againBtn').click(); const pos = deck.length - deck.findIndex(c => c.w === w1);
    win(); const w2 = current.w; $('gearBtn').click(); $('panel').requestSubmit();
    return { w2, now: current.w, done, posBefore: pos, posAfter: deck.length - deck.findIndex(c => c.w === w1) }; });
  ok('1 Done keeps word, done state, tricky position', r.now === r.w2 && r.done && r.posBefore === r.posAfter, JSON.stringify(r));
  r = await pg.evaluate(() => { $('nextBtn').click(); return score; }); ok('1 the kept word still counts', r === 1);
  // b/d toggle keeps word
  r = await pg.evaluate(() => { const w = current.w; win(); $('gearBtn').click(); $('bdChk').click(); $('panel').requestSubmit(); return { same: current.w === w, done, bd: S.bd, bdSpans: document.querySelectorAll('#word .bd').length }; });
  ok('1 b/d toggle redraws same word, still done', r.same && r.done && r.bd === true, JSON.stringify(r));
  // 2: closing Settings by tapping outside keeps the change (same as Done), and reopening shows it
  r = await pg.evaluate(() => { const bd0 = S.bd; $('gearBtn').click(); $('bdChk').click(); $('sheet').click();
    const after = S.bd, closed = $('sheet').hidden; $('gearBtn').click(); const box = $('bdChk').checked; $('sheet').hidden = true; return { bd0, after, closed, box }; });
  ok('2 Settings: tapping outside closes and keeps the change', r.closed && r.after === !r.bd0 && r.box === r.after, JSON.stringify(r));
  // 5: Change goal with no lesson change: no warm-up
  r = await pg.evaluate(() => { $('gearBtn').click(); $('resetGoalBtn').click(); $('startBtn').click(); return !$('warmCover').hidden; });
  ok('5 no warm-up on goal change', r === false);
  await pg.close();
  // 5b: Change goal before reading any word
  pg = await fresh(b); await pg.click('#lsNext'); await pg.click('#startBtn'); await pg.click('#warmSkip');
  r = await pg.evaluate(() => { $('gearBtn').click(); $('resetGoalBtn').click(); $('startBtn').click(); return !$('warmCover').hidden; });
  ok('5 no warm-up on goal change at score 0', r === false);
  await pg.close();
  // 3: back twice
  pg = await fresh(b); await pg.click('#lsNext'); await pg.click('#startBtn'); await pg.click('#warmSkip');
  r = await pg.evaluate(() => { win(); $('nextBtn').click(); win(); $('nextBtn').click();
    $('backBtn').click(); $('backBtn').click(); $('nextBtn').click(); win(); $('nextBtn').click(); win(); $('nextBtn').click();
    return { score, words: read.map(x => x.w) }; });
  ok('3 back twice no double count', r.score === 3 && new Set(r.words).size === 3, JSON.stringify(r));
  await pg.close();
  // 4: no word kinds chosen: the lesson screen won't start an empty lesson
  pg = await fresh(b); await pg.waitForTimeout(300);
  r = await pg.evaluate(() => { [...document.querySelectorAll('#lsKinds button')].forEach(x => { if (x.getAttribute('aria-pressed') === 'true') x.click(); });
    return { kinds: ls.kinds.join(), dis: $('lsNext').disabled }; });
  ok('4 the last word kind can\'t be turned off (never an empty lesson)', r.kinds.length > 0 && !r.dis, JSON.stringify(r));
  await pg.close();
  // reload resume: no warm-up
  pg = await fresh(b); await pg.click('#lsNext'); await pg.click('#startBtn'); await pg.click('#warmSkip');
  await pg.evaluate(() => { win(); $('nextBtn').click(); });
  await pg.reload(); await pg.addStyleTag({content:'[hidden]{display:none!important}'}); await pg.waitForTimeout(400); await openChooser(pg);
  await pg.click('#lsNext'); await pg.click('#startBtn');
  const rr = await pg.evaluate(() => ({ warm: !$('warmCover').hidden, score, start: !$('startCover').hidden, lesson: !$('lessonCover').hidden }));
  ok('resume after reload: no warm-up, score kept', !rr.warm && rr.score === 1, JSON.stringify(rr));
  await pg.close();
  // 7: a saved lesson from a lesson order that no longer exists falls back to By phoneme's first lesson
  pg = await fresh(b, 1024, 768, { level: '1', unit: 7 });
  ok('7 a lesson from an order that no longer exists falls back to By phoneme', await pg.evaluate(() => S.level === 'u' && S.unit === 5 && !('l2u3Default' in S)));
  await pg.close();
  // 6: 320x568 goal card fits
  pg = await fresh(b, 320, 568); await pg.click('#lsNext'); await pg.click('#goalQuick button[data-v="10"]'); await pg.click('#startBtn'); await pg.click('#warmSkip');
  for (let i = 0; i < 10; i++) await pg.evaluate(() => { win(); $('nextBtn').click(); });
  await pg.waitForTimeout(1200);
  r = await pg.evaluate(() => { const c = document.querySelector('#goalCover .card'); const nb = $('newGoalBtn').getBoundingClientRect(); return { sh: c.scrollHeight, ch: c.clientHeight, btnBottom: nb.bottom, vh: innerHeight }; });
  ok('6 goal card fits 320x568', r.sh <= r.ch + 1 && r.btnBottom <= r.vh, JSON.stringify(r));
  await pg.screenshot({ path: OUT + '/goal_320_fix.png' });
  for (let i = 0; i < 10; i++) await pg.evaluate(() => {}); 
  await pg.close();
  pg = await fresh(b, 320, 568); await pg.click('#lsNext'); await pg.click('#startBtn'); await pg.click('#warmSkip');
  for (let i = 0; i < 10; i++) await pg.evaluate(() => { win(); $('nextBtn').click(); });
  await pg.waitForTimeout(1200);
  r = await pg.evaluate(() => { const c = document.querySelector('#tenCover .card'); const nb = $('tenBtn').getBoundingClientRect(); return { sh: c.scrollHeight, ch: c.clientHeight, btnBottom: nb.bottom, vh: innerHeight }; });
  ok('6 ten card fits 320x568', r.sh <= r.ch + 1 && r.btnBottom <= r.vh, JSON.stringify(r));
  await pg.screenshot({ path: OUT + '/ten_320_fix.png' });
  await pg.close();
  // warm-up for the sample list's lesson 31 (ild, old, ...): a chunk of several sounds gets its line with a dot per sound
  pg = await fresh(b, 1024, 768, { level: 'x', unit: 31 }); await pg.click('#lsNext'); await pg.click('#startBtn');
  r = await pg.evaluate(() => $('warmSound').innerHTML);
  ok('a chunk like ild: its warm-up card has the chunk marks', /grp/.test(r), r.slice(0, 120));
  await pg.close();
  await b.close(); SRV.close();
})();
