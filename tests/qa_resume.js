// Coming back later: today's waiting words survive a reload; words from another lesson are dropped.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const URL = HTTP + ROOT + '/slide-and-read.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const pg = await ctx.newPage(); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
  pg.on('pageerror',e=>console.log('ERR',e.message));
  const today = new Date().toISOString().slice(0,10);
  // a saved session from before the update: an Irregulars lesson with old words and no lesson key
  await pg.goto(URL); await pg.waitForTimeout(300); await openChooser(pg);
  const t = await pg.evaluate(() => today());
  const big = await pg.evaluate(() => DATA_H.lessons.find(l => l.trick.length >= 10).n);   // an Irregulars lesson with 10+ words
  await pg.evaluate(([t, big]) => { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); localStorage.setItem('slideRead.settings', JSON.stringify({level:'h',unit:big,kinds:['trick'],goal:20}));
    localStorage.setItem('slideRead.session', JSON.stringify({day:t, score:3, goal:20, read:[], deck:[{w:'said',trick:true},{w:'many',trick:true},{w:'buy',trick:true}], pass:[], passOn:true})); }, [t, big]);
  await pg.goto(URL); await pg.waitForTimeout(500); await openChooser(pg);
  await pg.click('#lsNext'); await pg.waitForTimeout(200); if (await pg.isVisible('#startBtn')) await pg.click('#startBtn'); await pg.waitForTimeout(200); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  let r = await pg.evaluate(()=>{ const P=new Set(pool().map(c=>c.w)); const ws=[]; for(let i=0;i<5;i++){ ws.push(current.w); $('nextBtn').click(); } return {label: $('unitLabel').title, ws, all: ws.every(w=>P.has(w)), score}; });
  ok('old saved words from another lesson are dropped', r.all, JSON.stringify(r));
  // same lesson, reload mid-way: picks up where she was
  r = await pg.evaluate(()=>({ w: current.w, deck: deck.map(c=>c.w) }));
  await pg.reload(); await pg.waitForTimeout(500); await openChooser(pg);
  const r2 = await pg.evaluate(()=>({ deck: deck.map(c=>c.w), cur: current && current.w }));
  ok('same lesson after reload keeps the waiting words', r2.deck.length > 0 && r.deck.slice(0,3).every(w => r2.deck.includes(w)), JSON.stringify({before:r.deck.length, after:r2.deck.length}));
  // settings changed to another lesson outside the app, then reload: new lesson's words
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('slideRead.settings')); s.level='u'; s.unit=40; s.kinds=['real','made']; localStorage.setItem('slideRead.settings', JSON.stringify(s)); });
  await pg.goto(URL); await pg.waitForTimeout(500); await openChooser(pg);
  await pg.click('#lsNext'); await pg.waitForTimeout(200); if (await pg.isVisible('#startBtn')) await pg.click('#startBtn'); await pg.waitForTimeout(200); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  r = await pg.evaluate(()=>{ const P=new Set(pool().map(c=>c.w)); const ws=[]; for(let i=0;i<5;i++){ ws.push(current.w); $('nextBtn').click(); } return {S:S.level+'-'+S.unit, ws, all: ws.every(w=>P.has(w))}; });
  ok('switching lesson between visits gives the new lesson', r.all, JSON.stringify(r));
  await b.close(); })();
