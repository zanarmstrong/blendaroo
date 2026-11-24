// List links (Zan, Nov 21): ?list=<Google Sheet link>&name=<name>&n=<lesson> asks before adding the list, then opens that
// lesson; a list already on the device just opens; "Not now" adds nothing; Settings' "Copy share link" makes the link.
const { chromium } = require('playwright');
const { ok, HTTP, ROOT } = require('./qa_helpers');
const SITE = HTTP + ROOT + '/docs/index.html';
const SHEET = 'https://docs.google.com/spreadsheets/d/TESTSHEET123/edit#gid=0';
const CSV = 'name,pattern,decodable,heart words\n"Short a","a","cat, map, sad, ran, bag, ham, tap, nap, mad, had","the, a"\n"Short i","i","big, sit, pin, hid, fig, rib, lip, tin, dig, mix","said"\n"Short o","o","hot, mop, dog, fox, pot, log, rod, top, cob, sob","was"\n';
const link = (n, name = 'PHS', sheet = SHEET) => `${SITE}?list=${encodeURIComponent(sheet)}&name=${encodeURIComponent(name)}${n ? '&n=' + n : ''}`;
(async () => { const b = await chromium.launch();
  const fresh = async () => { const ctx = await b.newContext(); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    let fetched = 0; await ctx.route(u => u.hostname === 'docs.google.com', r => { fetched++; r.fulfill({ status: 200, contentType: 'text/csv', body: CSV }); });
    return { pg, ctx, fetches: () => fetched }; };
  // a first-time visitor opens a teacher's link
  let { pg, fetches } = await fresh();
  await pg.goto(link(2)); await pg.waitForTimeout(700);
  let r = await pg.evaluate(() => ({ asks: !$('xferCover').hidden && xfMode === 'list', title: $('xfTitle').textContent, welcome: !$('welcomeCover').hidden, q: location.search, lists: CUSTOM.length }));
  ok('a list link asks first, by name, with no welcome card over it; nothing added yet', r.asks && /PHS/.test(r.title) && !r.welcome && !r.lists, JSON.stringify(r));
  ok('the address is tidied (no list in it after opening)', !/list=|name=|[?&]n=/.test(r.q), r.q);
  await pg.click('#xfGo'); await pg.waitForFunction(() => $('xferCover').hidden, null, { timeout: 8000 }).catch(() => {});
  r = await pg.evaluate(() => ({ lists: CUSTOM.map(L => L.name + '|' + L.lessons.length + '|' + !!L.src), at: S.level + '-' + S.unit, ready: !$('startCover').hidden, name: $('rdName').textContent }));
  ok('Add loads the sheet, keeps where it came from, and opens the linked lesson on the Ready card', r.lists.join() === 'PHS|3|true' && r.at === 'x-2' && r.ready && /Short i/.test(r.name), JSON.stringify(r));
  // the same link again: no question
  const before = fetches();
  await pg.goto(link(3)); await pg.waitForTimeout(600);
  r = await pg.evaluate(() => ({ asks: !$('xferCover').hidden, at: S.level + '-' + S.unit, lists: CUSTOM.length }));
  ok('opening the link again just opens its lesson (no question, no second copy, nothing refetched)', !r.asks && r.at === 'x-3' && r.lists === 1 && fetches() === before, JSON.stringify(r));
  // Settings: Copy share link
  await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); });
  await pg.click('#customLists [data-share="0"]'); await pg.waitForTimeout(150);
  r = await pg.evaluate(() => $('xfBox').value);
  const u = new URL(r);
  ok('Settings: "Copy share link" gives the site address with the sheet, the name and the lesson open now', u.searchParams.get('list') === 'https://docs.google.com/spreadsheets/d/TESTSHEET123/edit#gid=0' && u.searchParams.get('name') === 'PHS' && u.searchParams.get('n') === '3' && u.pathname.endsWith('/index.html'), r);
  ok('copying a share link doesn\'t count as a backup', await pg.evaluate(async () => { const before = localStorage.getItem('slideRead.lastBackup'); $('xfGo').click(); await new Promise(z => setTimeout(z, 200)); return localStorage.getItem('slideRead.lastBackup') === before; }));
  // Not now
  ({ pg } = await fresh());
  await pg.goto(link(1)); await pg.waitForTimeout(600); await pg.click('#xfCancel'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ lists: CUSTOM.length, at: S.level, q: location.search }));
  ok('"Not now" adds nothing and leaves the lessons as they were', r.lists === 0 && r.at === 'u' && !/list=/.test(r.q), JSON.stringify(r));
  // not a Google Sheet: ignored
  ({ pg } = await fresh());
  await pg.goto(link(1, 'Bad', 'https://example.com/list.csv')); await pg.waitForTimeout(600);
  r = await pg.evaluate(() => ({ asks: !$('xferCover').hidden, lists: CUSTOM.length }));
  ok('a link to anything but a Google Sheet is ignored', !r.asks && !r.lists, JSON.stringify(r));
  // already two lists
  ({ pg } = await fresh());
  await pg.addInitScript(() => { try { const L = n => ({ name: n, src: '', lessons: [{ name: 'L1', real: ['cat', 'dog', 'sit'], made: [], trick: [] }] }); localStorage.setItem('slideRead.custom', JSON.stringify([L('One'), L('Two')])); localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
  await pg.goto(link(1)); await pg.waitForTimeout(700);
  r = await pg.evaluate(() => ({ title: $('xfTitle').textContent, mode: xfMode, lists: CUSTOM.length }));
  ok('a device with two lists already says so instead of adding a third', /Two lists/.test(r.title) && r.mode === 'done' && r.lists === 2, JSON.stringify(r));
  await b.close(); })();
