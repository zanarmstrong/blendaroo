// Which word kinds each lesson order allows (By phoneme: no heart words; Heart words: only heart words; uploaded lists: all).
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const FIX = require('fs').readFileSync(ROOT + '/tests/sample_list.json', 'utf8');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({viewport:{width:390,height:844}}); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
  pg.on('pageerror',e=>console.log('ERR',e.message));
  await pg.addInitScript(FIXJ => { if (!sessionStorage.getItem('x')) { localStorage.clear(); localStorage.setItem('slideRead.welcomed', '1'); localStorage.setItem('slideRead.settings', JSON.stringify({level:'u',unit:43,kinds:['real','made','trick'],goal:20})); localStorage.setItem('slideRead.custom', FIXJ); sessionStorage.setItem('x',1); } }, FIX);
  await pg.goto(HTTP+process.cwd()+'/slide-and-read.html'); await pg.waitForTimeout(400); await openChooser(pg);
  let r = await pg.evaluate(()=>({kinds:ls.kinds.join(), trickOff: document.querySelector('#lsKinds [data-v=trick]').disabled, pool: lsPool(), anyTrick: pool().some(c=>c.trick), prev: $('lsPreview').innerText.replace(/\s+/g,' ').slice(0,120)}));
  ok('By phoneme: no heart words, button greyed', r.kinds==='real,made' && r.trickOff && !r.anyTrick && r.pool>0, JSON.stringify(r));
  await pg.click('#lsTrack [data-v=h]'); r = await pg.evaluate(()=>ls.kinds.join()); ok('Heart words: heart words', r==='trick', r);
  await pg.click('#lsTrack [data-v=u]'); r = await pg.evaluate(()=>ls.kinds.join()); ok('back to By phoneme: no heart words', !r.includes('trick') && r.length>0, r);
  await pg.click('#lsTrack [data-v=x]'); r = await pg.evaluate(()=>({k:ls.kinds.join(), off: document.querySelector('#lsKinds [data-v=trick]').disabled})); ok('uploaded list: heart words allowed', !r.off, JSON.stringify(r));
  await pg.click('#lsTrack [data-v=u]'); await pg.click('#lsNext'); await pg.waitForTimeout(150); if (await pg.isVisible('#startBtn')) await pg.click('#startBtn');
  await pg.evaluate(()=>{ document.querySelectorAll('.cover').forEach(c=>c.hidden=true); $('gearBtn').click(); });
  r = await pg.evaluate(()=>({legal: document.querySelector('.legal').innerText.includes('original content')}));
  ok('Settings footer wording', !r.legal, JSON.stringify(r));
  await b.close(); })();
