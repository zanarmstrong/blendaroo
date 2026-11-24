// Moving a reader to a new device (Zan, Nov 19; how Ronia moved from the Claude copy): the progress link opens the website,
// skips the welcome card, and shows exactly the same words, aliens (earned minus spent) and golden aliens: an older shared
// record, other devices' records and this device's own, all of them.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
const norm = p => JSON.stringify({ ...p, aliens: Object.fromEntries(Object.entries(p.aliens).sort()), golden: [...p.golden].sort() });   // same counts, any order
(async () => { const SRV = await require('./qa_serve')(); const b = await chromium.launch();
  const A = await (await b.newContext()).newPage(); A.on('pageerror', e => console.log('PAGEERR', e.message));
  await A.addInitScript(() => { try { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('slideRead.welcomed', '1');
    localStorage.setItem('slideRead.progress', JSON.stringify({ words: 300, real: 200, made: 90, trick: 10, aliens: { zorb: 4, blip: 2 }, spent: { zorb: 1 }, golden: ['blip'], updated: 1 }));   // the account's shared record
    localStorage.setItem('slideRead.others', JSON.stringify({ dIpad: { words: 120, real: 80, made: 40, trick: 0, earned: { quax: 3 }, spent: {}, golden: [], updated: 5 } }));   // her iPad
    localStorage.setItem('slideRead.deviceRecord', JSON.stringify({ words: 45, real: 30, made: 15, trick: 0, earned: { zorb: 1, tem: 2 }, spent: { blip: 1 }, golden: ['tem'], updated: 9 })); } } catch (e) {} });
  await A.goto(SRV.base + 'docs/index.html'); await A.waitForTimeout(500);
  const src = await A.evaluate(async () => ({ site: siteUrl(), link: siteUrl() + '#p=' + await encodeProgress(progressPayload()), P: JSON.parse(JSON.stringify(P)), ships: alienTotal() }));
  ok('the progress link opens the website at its own address', src.link.startsWith(SRV.base + 'docs/index.html#p='), src.site);
  ok('the first device counts all three records', src.P.words === 465 && src.P.aliens.zorb === 4 && src.P.aliens.quax === 3 && src.P.aliens.tem === 2 && src.P.aliens.blip === 1, JSON.stringify(src.P));
  // the website, fresh (no settings, no progress: a first visit), opened with that link at its own address
  const W = await (await b.newContext()).newPage(); W.on('pageerror', e => console.log('PAGEERR', e.message));
  const code = src.link.split('#p=')[1];
  await W.goto(SRV.base + 'docs/index.html#p=' + code); await W.waitForTimeout(800);
  let r = await W.evaluate(() => ({ asks: !$('xferCover').hidden && xfMode === 'confirm', site: siteUrl() }));
  ok('the website asks to add the progress (even on a first visit)', r.asks, JSON.stringify(r));
    await W.click('#xfGo'); await W.waitForTimeout(300);
  r = await W.evaluate(() => JSON.parse(JSON.stringify(P)));
  ok('the website shows the same words, aliens and golden aliens', norm(r) === norm(src.P), JSON.stringify(r) + ' vs ' + JSON.stringify(src.P));
  await W.reload(); await W.waitForTimeout(500);
  r = await W.evaluate(() => ({ P: JSON.parse(JSON.stringify(P)), welcome: !$('welcomeCover').hidden }));
  ok('after a reload they are still there, and the welcome card does not cover them', norm(r.P) === norm(src.P) && !r.welcome, JSON.stringify(r));
  await b.close(); SRV.close(); })();
