// QA batch 4 coverage: backup/transfer link round trip, old-settings migration, broken storage,
// keyboard slider, and the standalone website build.
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const fs = require('fs'), path = require('path');
let APP;   // served over http: opened as a file, Chromium sometimes drops what was saved just before a reload (qa_serve.js)
(async () => { const SRV = await require('./qa_serve')(); APP = SRV.base + 'slide-and-read.html';
  const b = await chromium.launch();
  const page = async (init) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), pg = await ctx.newPage(); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} });
    pg.on('pageerror', e => console.log('PAGEERR', e.message));
    if (init) await pg.addInitScript(init);
    return pg;
  };

  // 1. a backup link from one device restores words and aliens on a fresh one, and opening it twice doesn't count twice
  const A = await page(); await A.goto(APP); await A.waitForTimeout(400); await openChooser(A);
  const link = await A.evaluate(async () => {
    Object.assign(mine, { words: 57, real: 40, made: 17, earned: { zorb: 3 }, golden: ['blip'] }); saveProgress();
    return location.origin + location.pathname + '#p=' + await encodeProgress(progressPayload());   // the Claude build's siteUrl() is the real website (qa_move.js checks it)
  });
  const B = await page(); await B.goto(APP); await B.waitForTimeout(300); await openChooser(B);
  await B.goto(link); await B.waitForTimeout(500); await openChooser(B);
  ok('link opens the "add this progress" question', await B.evaluate(() => !$('xferCover').hidden && xfMode === 'confirm'));
  await B.click('#xfGo'); await B.waitForTimeout(200);
  let r = await B.evaluate(() => ({ words: P.words, zorb: P.aliens.zorb, golden: P.golden.join(), hash: location.hash }));
  ok('backup restores words, aliens, golden', r.words === 57 && r.zorb === 3 && r.golden === 'blip', JSON.stringify(r));
  ok('link removed from the address after use', r.hash === '', r.hash);
  await B.goto(link); await B.waitForTimeout(500); await openChooser(B);
  r = await B.evaluate(() => ({ asks: xfMode === 'confirm', words: P.words }));
  if (r.asks) { await B.click('#xfGo'); r.words = await B.evaluate(() => P.words); }
  ok('same link again: nothing counted twice', r.words === 57, JSON.stringify(r));
  await B.reload(); await B.waitForTimeout(400); await openChooser(B);
  ok('restored progress survives a reload', await B.evaluate(() => P.words === 57 && P.aliens.zorb === 3));
  const bad = await page(); await bad.goto(APP + '#p=zNOTAREALLINK'); await bad.waitForTimeout(500); await openChooser(bad);
  ok('a broken link is ignored without errors', await bad.evaluate(() => P.words === 0));

  // 2. settings saved by older versions of the app
  const old = await page(() => localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'u', unit: 40, mix: 'made', peek: true, wide: 1, font: 'comic', lines: true })));
  await old.goto(APP); await old.waitForTimeout(400); await openChooser(old);
  r = await old.evaluate(() => ({ kinds: S.kinds.join(), gone: ['mix', 'peek', 'wide', 'font', 'lines'].filter(k => k in S), at: S.level + '-' + S.unit }));
  ok('old "mix" setting becomes word kinds; removed settings dropped', r.kinds === 'made' && !r.gone.length && r.at === 'u-40', JSON.stringify(r));
  const oldT = await page(() => localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'u', unit: 40, kinds: ['trick'] })));
  await oldT.goto(APP); await oldT.waitForTimeout(400); await openChooser(oldT);
  r = await oldT.evaluate(() => S.kinds.join()); ok('By phoneme lesson saved with only heart words gets real + made-up', r === 'real,made', r);
  const gone = await page(() => localStorage.setItem('slideRead.settings', JSON.stringify({ level: 'x', unit: 7 })));
  await gone.goto(APP); await gone.waitForTimeout(400); await openChooser(gone);
  r = await gone.evaluate(() => ({ at: S.level + '-' + S.unit, real: LESSONS.some(x => x.level === S.level && x.unit === S.unit) }));
  ok('a saved lesson that no longer exists falls back to a real one', r.real, JSON.stringify(r));

  // 3. damaged storage doesn't stop the app
  const junk = await page(() => { ['slideRead.settings', 'slideRead.custom', 'slideRead.session', 'slideRead.deviceRecord', 'slideRead.imported'].forEach(k => localStorage.setItem(k, '{not json')); });
  await junk.goto(APP); await junk.waitForTimeout(400); await openChooser(junk);
  r = await junk.evaluate(() => ({ lessons: LESSONS.length, open: !$('lessonCover').hidden, words: P.words }));
  ok('damaged saved data: app still opens', r.lessons > 100 && r.open && r.words === 0, JSON.stringify(r));

  // 4. the slider works from a keyboard
  const K = await page(); await K.goto(APP); await K.waitForTimeout(400); await openChooser(K);
  await K.click('#lsNext'); await K.click('#startBtn'); if (await K.isVisible('#warmSkip')) await K.click('#warmSkip');
  await K.evaluate(() => { current = { w: 'man', ord: 1005 }; setup(); });
  await K.focus('#track');
  for (let i = 0; i < 6; i++) { await K.keyboard.press('ArrowRight'); await K.waitForTimeout(120); }
  await K.waitForTimeout(400);
  r = await K.evaluate(() => ({ on: spans.filter(s => s.classList.contains('on')).length, n: spans.length, done: !$('doneRow').classList.contains('off') }));
  ok('arrow keys slide through the whole word', r.on === r.n && r.done, JSON.stringify(r));
  await K.evaluate(() => { current = { w: 'man', ord: 1005 }; setup(); });
  await K.focus('#track'); await K.keyboard.press('ArrowRight'); await K.keyboard.press('ArrowRight'); await K.keyboard.press('ArrowLeft'); await K.waitForTimeout(200);
  r = await K.evaluate(() => spans.filter(s => s.classList.contains('on')).length);
  ok('left arrow goes back one sound', r === 1, r);
  ok('dialogs are marked as dialogs', await K.evaluate(() => [...document.querySelectorAll('.cover')].every(c => c.getAttribute('role') === 'dialog')));

  // 4b. a lesson picked from "find a sound" becomes the current lesson right away, and survives a reload
  const F = await page(); await F.goto(APP); await F.waitForTimeout(400); await openChooser(F);
  await F.fill('#findBox', 'ild'); await F.waitForTimeout(200);
  const pick = await F.getAttribute('#findOut button', 'data-v'); await F.click('#findOut button'); await F.waitForTimeout(200);
  r = await F.evaluate(() => ({ S: S.level + '-' + S.unit, saved: (s => s.level + '-' + s.unit)(JSON.parse(localStorage.getItem('slideRead.settings'))) }));
  ok('found lesson is current and saved before tapping Next', r.S === pick && r.saved === pick, JSON.stringify(r) + ' picked ' + pick);
  await F.reload(); await F.waitForTimeout(400); await openChooser(F);
  ok('found lesson still current after a reload', await F.evaluate(() => S.level + '-' + S.unit) === pick);
  await F.click('#lsNext'); await F.click('#startBtn'); await F.waitForTimeout(300);
  r = await F.evaluate(() => ({ warm: !$('warmCover').hidden, lesson: S.level + '-' + S.unit }));
  ok('Next then Start: practice starts in the found lesson', r.lesson === pick, JSON.stringify(r));

  // 5. the standalone website build
  const dist = path.join(ROOT, 'docs'), html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  ok('website: no claude.ai storage calls', !html.includes("claude.use('db')") && !html.includes("claude.use('user')"));
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  ok('website: service worker skips redirects/errors and revalidates', /r\.ok && !r\.redirected/.test(sw) && /no-cache/.test(sw));
  const man = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
  const missing = man.icons.map(i => i.src).filter(s => !fs.existsSync(path.join(dist, s)));
  ok('website: manifest icons all exist', !missing.length, missing.join());
  const W = await page(); await W.goto(HTTP + path.join(dist, 'index.html')); await W.waitForTimeout(500); await openChooser(W);
  ok('website: opens to the lesson screen with lessons', await W.evaluate(() => !$('lessonCover').hidden && LESSONS.length > 100));
  await b.close(); SRV.close();
})();
