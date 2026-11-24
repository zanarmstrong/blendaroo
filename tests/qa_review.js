// The end of a lesson: the finished card, reading the lesson again, and picking another lesson.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); sessionStorage.setItem('x', 1); } });
  await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(400); await openChooser(pg);
  const four = await pg.evaluate(() => DATA_H.lessons.find(l => l.trick.length === 4).n);   // any 4-word Irregulars lesson
  await pg.click('#lsTrack [data-v=h]'); await pg.selectOption('#lsLesson', 'h-' + four);
  await pg.click('#lsNext'); await pg.click('#goalQuick [data-v="10"]'); await pg.click('#startBtn'); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  const step = async () => { await pg.evaluate(() => { $('nextBtn').click(); }); await pg.waitForTimeout(30); };
  // read 3, mark one tricky, then read the tricky one when it comes back
  await step(); await step(); await step();
  let r = await pg.evaluate(() => ({ score, deck: deck.length, w: current && current.w }));
  await pg.evaluate(() => $('againBtn').click());   // 4th word tricky -> comes back first
  await step();   // reads the tricky word
  r = await pg.evaluate(() => ({ score, review: !$('reviewCover').hidden, count: $('rvCount').textContent, sub: $('rvSub').textContent, tricky: $('rvTricky').textContent }));
  ok('review after every word once', r.review && r.score === 4 && r.count === '4', JSON.stringify(r));
  ok('no re-read at the end of a lesson: buttons ready at once', await pg.evaluate(() => !$('rvAgain').disabled && !$('rvPick').disabled && !document.querySelector('#reviewCover .tile')));
  await pg.waitForTimeout(500); await pg.screenshot({ path: OUT + '/review_card.png' });
  await pg.click('#rvAgain'); await pg.waitForTimeout(100);
  r = await pg.evaluate(() => ({ hidden: $('reviewCover').hidden, w: current && current.w, deck: deck.length }));
  ok('read them again: new pass of the same words', r.hidden && r.w && r.deck === 3, JSON.stringify(r));
  for (let i = 0; i < 4; i++) await step();
  ok('review again after the second pass', await pg.evaluate(() => !$('reviewCover').hidden && score === 8));
  await pg.evaluate(() => document.querySelectorAll('#rvWords .tile').forEach(t => t.click()));
  await pg.click('#rvPick'); await pg.waitForTimeout(100);
  ok('pick another lesson opens lesson screen', await pg.evaluate(() => !$('lessonCover').hidden));
  const two = await pg.evaluate(four => { const h = LESSONS.filter(x => x.level === 'h' && x.unit !== four && x.u.warm && x.u.warm.length).sort((a, b) => a.u.trick.length - b.u.trick.length); return h[0].unit; }, four);   // the smallest other lesson with a warm-up
  await pg.selectOption('#lsLesson', 'h-' + two); await pg.click('#lsNext'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ start: !$('startCover').hidden, warm: !$('warmCover').hidden, goal, score }));
  ok('new lesson: warm-up, no goal screen, goal kept', !r.start && r.warm && r.goal === 10, JSON.stringify(r));
  await pg.click('#warmSkip');
  r = await pg.evaluate(u => DATA_H.lessons.find(x => x.n === u).trick.includes(current.w), two); ok('words from the new lesson', r);
  // reaching the goal at the end of a pass shows the goal card, not the review
  await step(); await step(); await pg.waitForTimeout(100);
  r = await pg.evaluate(() => ({ score, goalCard: !$('goalCover').hidden, review: !$('reviewCover').hidden }));
  ok('goal card wins at the goal', r.score === 10 && r.goalCard && !r.review, JSON.stringify(r));
  await b.close(); })();
