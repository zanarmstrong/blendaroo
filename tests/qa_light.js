// "Show the whole word in light grey before sliding" (Zan, Nov 23): off by default (each letter appears only when the bead
// reaches it); a grown-up can turn it on in Settings, or with ?light=1 in the address. When on, the letters not reached yet
// are light grey and each turns dark as the bead reaches it.
const { chromium } = require('playwright');
const { ok, HTTP, ROOT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
  const open = async (q = '') => { const pg = await b.newPage({ viewport: { width: 844, height: 390 } }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.addInitScript(() => { try { if (!sessionStorage.getItem('x')) { localStorage.setItem('slideRead.welcomed', '1'); sessionStorage.setItem('x', '1'); } } catch (e) {} });
    await pg.goto(HTTP + ROOT + '/docs/index.html' + q); await pg.waitForTimeout(600);
    await pg.evaluate(() => { document.querySelectorAll('.cover, .sheet').forEach(c => c.hidden = true); warmedUp = true; nextWord(); }); await pg.waitForTimeout(300);
    return pg; };
  const look = pg => pg.evaluate(() => { const cs = [...document.querySelectorAll('#word .ch')]; const col = c => getComputedStyle(c).color;
    return { light: S.light, cls: word.classList.contains('lightpre'), unlit: cs.filter(c => !c.classList.contains('on')).map(col), n: cs.length }; });
  let pg = await open(); let r = await look(pg);
  ok('off by default: letters not reached yet are hidden', r.light === false && !r.cls && r.unlit.length && r.unlit.every(c => c === 'rgba(0, 0, 0, 0)'), JSON.stringify(r));
  // turn it on in Settings
  await pg.evaluate(() => $('gearBtn').click()); await pg.waitForTimeout(200);
  await pg.click('#lightChk'); await pg.click('#panel .x-btn'); await pg.waitForTimeout(200);
  r = await look(pg);
  ok('Settings: on shows the unread letters in light grey', r.light && r.cls && r.unlit.every(c => c !== 'rgba(0, 0, 0, 0)'), JSON.stringify(r));
  r = await pg.evaluate(() => { spans[0].classList.add('on'); const a = getComputedStyle(spans[0]).color, z = getComputedStyle(spans[spans.length - 1]).color; return { lit: a, unlit: z }; });
  ok('a letter the bead has reached turns dark, the rest stay light', r.lit !== r.unlit, JSON.stringify(r));
  r = await pg.evaluate(() => ({ saved: JSON.parse(localStorage.getItem('slideRead.settings')).light, q: location.search }));
  ok('it is saved, and the address carries it (light=1)', r.saved === true && /light=1/.test(r.q), JSON.stringify(r));
  await pg.reload(); await pg.waitForTimeout(600);
  await pg.evaluate(() => { document.querySelectorAll('.cover, .sheet').forEach(c => c.hidden = true); nextWord(); }); await pg.waitForTimeout(200);
  r = await look(pg); ok('still on after a reload', r.light && r.cls, JSON.stringify(r));
  await pg.close();
  pg = await open('?light=1'); r = await look(pg);
  ok('?light=1 turns it on', r.light && r.cls, JSON.stringify(r)); await pg.close();
  await b.close(); })();
