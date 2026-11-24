// First visit: a welcome card, then the CVC review lesson. Later visits: no card; Settings can show it again.
// A lesson in the address (?lesson=h-4) opens that lesson, and the address follows the lesson (Zan, Nov 19).
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const URL = HTTP + ROOT + '/slide-and-read.html';
(async () => {
  const b = await chromium.launch();
  for (const [W, H] of [[390, 844], [1024, 768], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H } }); const pg = await ctx.newPage();
    pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.goto(URL); await pg.waitForTimeout(500);
    let r = await pg.evaluate(() => ({ shown: !$('welcomeCover').hidden, lesson: S.level + '-' + S.unit, alien: !!document.querySelector('#wcAlien svg'),
      fits: (() => { const c = document.querySelector('#welcomeCover .card'), r = c.getBoundingClientRect(); return c.scrollWidth <= c.clientWidth + 1 && r.left >= 0 && r.right <= innerWidth; })() }));
    ok(W + ' first visit: welcome card, CVC review lesson', r.shown && r.lesson === 'u-5.8' && r.alien && r.fits, JSON.stringify(r));
    if (W === 390) await pg.screenshot({ path: OUT + '/welcome_390.png' });
    if (W === 320) await pg.screenshot({ path: OUT + '/welcome_320.png' });
    await pg.click('#welcomeGo');
    ok(W + ' "Choose a lesson myself" opens the full chooser', await pg.evaluate(() => $('welcomeCover').hidden && !$('lessonCover').hidden && $('startCover').hidden));
    await pg.reload(); await pg.waitForTimeout(500);
    r = await pg.evaluate(() => ({ welcome: !$('welcomeCover').hidden, ready: !$('startCover').hidden, chooser: !$('lessonCover').hidden, name: $('rdName').textContent, words: $('rdWords').textContent }));
    ok(W + ' next visit: no welcome; the Ready card with the lesson and some of its words', !r.welcome && r.ready && !r.chooser && /CVC/.test(r.name) && r.words.split(',').length >= 3, JSON.stringify(r));
    await pg.click('#startBtn'); await pg.waitForTimeout(200); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip'); await pg.waitForTimeout(200);
    r = await pg.evaluate(() => ({ reading: $('startCover').hidden && !!current, chip: $('unitLabel').title, vis: $('unitLabel').getBoundingClientRect().width > 0 }));
    ok(W + ' Start: reading, with the lesson (book icon) at the top', r.reading && r.vis && /^Lesson: ./.test(r.chip), JSON.stringify(r));
    await pg.click('#unitLabel'); await pg.waitForTimeout(150);
    ok(W + ' tapping the lesson opens the chooser', await pg.evaluate(() => !$('lessonCover').hidden));
    await pg.close(); await ctx.close();
  }
  // someone with progress (or saved settings) never sees it
  let ctx = await b.newContext(); let pg = await ctx.newPage();
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.progress', JSON.stringify({ words: 40, real: 30, made: 10, trick: 0, aliens: {}, updated: 1 })); sessionStorage.setItem('x', 1); } });
  await pg.goto(URL); await pg.waitForTimeout(600);
  ok('progress on this device: no welcome, lesson not reset', await pg.evaluate(() => $('welcomeCover').hidden && $('lsLesson').value !== 'u-5.8'));
  // Settings link shows it again
  await pg.evaluate(() => { document.querySelector('#welcomeLink').click(); });
  ok('Settings: show the welcome screen', await pg.evaluate(() => !$('welcomeCover').hidden));
  await ctx.close();
  // a lesson in the address
  ctx = await b.newContext(); pg = await ctx.newPage();
  await pg.goto(URL + '?lesson=h-4'); await pg.waitForTimeout(500);
  let r = await pg.evaluate(() => ({ v: S.level + '-' + S.unit, kinds: S.kinds.join(), q: location.search, welcome: !$('welcomeCover').hidden }));
  ok('?lesson=h-4 opens that lesson (with the welcome on a first visit)', r.v === 'h-4' && r.kinds === 'trick' && r.q === '?lesson=h-4&bd=0&pink=0&goal=20' && r.welcome, JSON.stringify(r));
  await pg.click('#welcomeGo');
  await pg.click('#lsTrack [data-v=u]'); await pg.waitForTimeout(100); await pg.selectOption('#lsLesson', 'u-45'); await pg.click('#lsNext'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => location.search); ok('the address follows the chosen lesson', r === '?lesson=u-45&bd=0&pink=0&goal=20', r);
  await pg.goto(URL + '?lesson=u-999'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ v: S.level + '-' + S.unit, q: location.search })); ok('an unknown lesson in the address is ignored', r.v === 'u-45' && r.q === '?lesson=u-45&bd=0&pink=0&goal=20', JSON.stringify(r));
  // b/d outlines: off by default, carried in the address; an old saved "on" is turned off once (Nov 19)
  await pg.goto(URL); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ bd: S.bd, q: location.search }));
  ok('b/d off by default, address says bd=0', r.bd === false && /bd=0/.test(r.q), JSON.stringify(r));
  r = await pg.evaluate(() => ({ hs: !!S.hstroke, q: location.search })); ok('pink heart letters off by default, address says pink=0', !r.hs && /pink=0/.test(r.q), JSON.stringify(r));
  await pg.goto(URL + '?lesson=u-45&pink=1'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ hs: S.hstroke, pinkWord: document.documentElement.classList.contains('hpink'), q: location.search })); ok('?pink=1 turns pink heart letters on', r.hs === true && r.pinkWord && /pink=1/.test(r.q), JSON.stringify(r));
  await pg.goto(URL + '?lesson=u-45&pink=0'); await pg.waitForTimeout(300);
  await pg.goto(URL + '?lesson=u-45&bd=1'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ bd: S.bd, q: location.search, chk: (() => { $('gearBtn').click(); const c = $('bdChk').checked; $('sheet').hidden = true; return c; })() }));
  ok('?bd=1 turns outlines on (and Settings shows it)', r.bd === true && r.chk && /bd=1/.test(r.q), JSON.stringify(r));
  await pg.evaluate(() => { $('gearBtn').click(); $('bdChk').click(); $('panel').requestSubmit(); });
  r = await pg.evaluate(() => ({ bd: S.bd, q: location.search })); ok('turning it off in Settings updates the address', r.bd === false && /bd=0/.test(r.q), JSON.stringify(r));
  await ctx.close();
  ctx = await b.newContext(); pg = await ctx.newPage();
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'u', unit: 45, kinds: ['real', 'made'], goal: 20, bd: true })); sessionStorage.setItem('x', 1); } });
  await pg.goto(URL); await pg.waitForTimeout(400);
  ok('an old saved "on" is turned off once', await pg.evaluate(() => S.bd === false && S.bdOff19 === true));
  await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); $('bdChk').click(); $('panel').requestSubmit(); });
  await pg.goto(URL); await pg.waitForTimeout(400);
  ok('turned back on, it stays on', await pg.evaluate(() => S.bd === true));
  await ctx.close();
  // welcome start points: each opens the Ready card on its lesson, with its own example words
  ctx = await b.newContext(); pg = await ctx.newPage(); await pg.goto(URL); await pg.waitForTimeout(500);
  r = await pg.evaluate(() => [...document.querySelectorAll('.wc-pick')].map(b => b.innerText.replace(/\s+/g, ' ')));
  ok('three start points with example words', r.length === 3 && /Short vowels.*cat, big, hot/.test(r[0]) && /Vowel teams.*play, feet, boat/.test(r[1]) && /Common words.*,/.test(r[2]), JSON.stringify(r));
  await pg.click('.wc-pick[data-v="u-88"]'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ l: S.level + '-' + S.unit, ready: !$('startCover').hidden, welcome: !$('welcomeCover').hidden, name: $('rdName').textContent }));
  ok('Vowel teams: the Ready card on lesson 88', r.l === 'u-88' && r.ready && !r.welcome && /vowel teams/i.test(r.name), JSON.stringify(r));
  await pg.reload(); await pg.waitForTimeout(400); await pg.evaluate(() => showWelcome()); await pg.click('.wc-pick[data-v="c-60"]'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ l: S.level + '-' + S.unit, kinds: S.kinds.join(), ready: !$('startCover').hidden }));
  ok('Common words: top 60, heart words on', r.l === 'c-60' && /trick/.test(r.kinds) && r.ready, JSON.stringify(r));
  // the Ready card's examples are the first words she'll read, in order; "see all" shows the lesson's words and comes back
  r = await pg.evaluate(() => ({ text: $('rdWords').innerText, eg: [...document.querySelectorAll('#rdWords .rd-eg')].map(e => e.textContent)[0] }));
  const shown = (r.eg || '').split(', ');
  ok('examples marked as examples ("ex.", italic, "see all")', /^ex\. /.test(r.text) && /…/.test(r.text) && /see all/.test(r.text) && shown.length === 3, JSON.stringify(r));
  await pg.click('#rdAll'); await pg.waitForTimeout(150);
  r = await pg.evaluate(() => ({ list: !$('wordsCover').hidden, v: $('wlLesson').value, l: S.level + '-' + S.unit }));
  ok('see all: the word list for this lesson', r.list && r.v === r.l, JSON.stringify(r));
  await pg.click('#wordsCover .x-btn'); ok('closing it goes back to the Ready card', await pg.evaluate(() => $('wordsCover').hidden && !$('startCover').hidden));
  await pg.click('#startBtn'); await pg.waitForTimeout(200); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip'); await pg.waitForTimeout(200);
  const read = await pg.evaluate(() => { const ws = []; for (let i = 0; i < 3; i++) { ws.push(current.w); win(); $('nextBtn').click(); } return ws; });
  ok('those really are the first three words', read.join() === shown.join(), JSON.stringify({ shown, read }));
  await ctx.close(); ctx = await b.newContext(); pg = await ctx.newPage(); await pg.goto(URL); await pg.waitForTimeout(400);   // a new day: nothing read yet
  await pg.evaluate(() => showWelcome()); await pg.click('.wc-pick[data-v="c-60"]'); await pg.waitForTimeout(200);
  // the daily goal: a setting, in the address; the Ready card starts from it
  await pg.evaluate(() => { $('startCover').hidden = true; $('gearBtn').click(); });
  ok('Settings: daily goal is a slider from 10 to 100 in steps of 10', await pg.evaluate(() => { const x = $('dailyRange'); return x.type === 'range' && x.min === '10' && x.max === '100' && x.step === '10'; }));
  await pg.focus('#dailyRange'); await pg.keyboard.press('ArrowRight');   // 20 -> 30, as a finger drag or arrow key would
  r = await pg.evaluate(() => ({ g: S.goal, today: goal, q: location.search, shown: $('dailyVal').textContent }));
  ok('Settings: daily goal 30, in the address, today follows (nothing read yet)', r.g === 30 && r.today === 30 && /goal=30/.test(r.q) && r.shown === '30 words', JSON.stringify(r));
  await pg.goto(URL + '?lesson=u-45&goal=10'); await pg.waitForTimeout(400);
  r = await pg.evaluate(() => ({ g: S.goal, shown: $('goalNum').textContent }));
  ok('?goal=10 sets the daily goal, and the Ready card shows it', r.g === 10 && r.shown === '10', JSON.stringify(r));
  await pg.click('#goalQuick [data-v="50"]'); await pg.click('#startBtn'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ g: S.goal, today: goal })); ok('picking 50 on the Ready card is for today only', r.g === 10 && r.today === 50, JSON.stringify(r));
  // the end of the day's goal: Next lesson
  await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('nextLessonBtn').click(); });
  r = await pg.evaluate(() => ({ l: S.level + '-' + S.unit, ready: !$('startCover').hidden, q: location.search }));
  ok('Next lesson: the following lesson, on the Ready card', r.l !== 'u-45' && r.l.startsWith('u-') && r.ready && r.q.includes('lesson=' + r.l), JSON.stringify(r));
  await ctx.close(); await b.close(); })();
