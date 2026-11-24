// Common words: the top-N slider, decodable and heart words together, hearts shown, and switching back to By phoneme.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
 for (const W of [390, 1024]) {
  const pg = await b.newPage({viewport:{width:W,height:W===390?844:768}}); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror',e=>console.log('ERR',e.message));
  await pg.addInitScript(() => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); sessionStorage.setItem('x', 1); } });
  await pg.goto(HTTP+process.cwd()+'/slide-and-read.html'); await pg.waitForTimeout(400); await openChooser(pg);
  await pg.click('#lsTrack [data-v=c]'); await pg.waitForTimeout(200);
  let r = await pg.evaluate(()=>({sel: $('lsLesson').hidden, cw: !$('lsCw').hidden, val: $('lsCwVal').textContent, lbl: $('lsLessonLbl').textContent, kinds: ls.kinds.join(), made: document.querySelector('#lsKinds [data-v=made]').disabled, scope: document.querySelector('#lsScope [data-v=cum]').disabled, count: $('lsCount').textContent, prev: $('lsPreview').innerText.replace(/\s+/g,' ').slice(0,160), docW: document.documentElement.scrollWidth}));
  ok(W+' common words: slider, decodable + heart words', r.sel && r.cw && r.val==='Top 50 words' && r.kinds==='real,trick' && r.made && r.docW===W, JSON.stringify(r));
  if (W===390) await pg.screenshot({ path: OUT + '/common_ls.png'});
  await pg.$eval('#lsCwRange', el => { el.value = 10; el.dispatchEvent(new Event('input')); });
  r = await pg.evaluate(()=>({val: $('lsCwVal').textContent, unit: ls.unit, count: $('lsCount').textContent, pool: lsPool()}));
  ok(W+' slider to top 10', r.unit===10 && r.pool===10, JSON.stringify(r));
  await pg.click('#lsNext'); if (await pg.isVisible('#goalQuick')) { await pg.click('#goalQuick [data-v="10"]'); await pg.click('#startBtn'); }
  if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  const seen = await pg.evaluate(()=>{ const out=[]; for (let i=0;i<9;i++){ out.push((current.trick?'T ':'D ')+[...document.querySelectorAll('#word .ch')].map(c=>(c.classList.contains('heart')?'♥':'')+c.textContent).join(' ')); $('nextBtn').click(); } return out; });
  ok(W+' words: heart words have hearts, decodable split into sounds', seen.some(x=>x.includes('♥')) && seen.some(x=>x.startsWith('D')), seen.join(' | '));
  await pg.evaluate(()=>openLesson()); await pg.waitForTimeout(200);
  r = await pg.evaluate(()=>({cw: !$('lsCw').hidden, val: $('lsCwVal').textContent, sel: $('lsLesson').hidden, count: $('lsCount').textContent}));
  ok(W+' lesson screen slider again', r.cw && r.sel && r.val==='Top 10 words', JSON.stringify(r));
  await pg.click('#lsTrack [data-v=u]'); r = await pg.evaluate(()=>({sel: !$('lsLesson').hidden, cw: $('lsCw').hidden, kinds: ls.kinds.join()}));
  ok(W+' back to By phoneme restores menu and kinds', r.sel && r.cw && r.kinds==='real,made', JSON.stringify(r));
  await pg.close(); }
 await b.close(); })();
