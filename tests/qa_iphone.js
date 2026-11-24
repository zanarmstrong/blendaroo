// iPhone and iPad fixes (Max Elman, Nov 19): 👂 speaks inside the tap even before voices load, a silent unlock on the
// (Device voice: these checks are about the device's own voice; the recorded voice has qa_clips.js)
// first tap, the "silent mode" hint for the first 3 taps only, no double-tap zoom, and Settings that can't get stuck
// (Done pinned at the top, backdrop / Escape / Change lesson / Show the welcome close it, even without requestSubmit).
const { chromium, devices } = require('playwright');
const { ok, HTTP, ROOT } = require('./qa_helpers');
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] }); const pg = await ctx.newPage();
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(() => {
    try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} try { const k = 'slideRead.settings', s = JSON.parse(localStorage.getItem(k) || '{}'); if (!s.voice) localStorage.setItem(k, JSON.stringify(Object.assign(s, { voice: 'device' }))); } catch (e) {}
    delete HTMLFormElement.prototype.requestSubmit;   // as on iOS before 16
    window.__said = [];
    const s = window.speechSynthesis;
    if (s) { s.getVoices = () => []; s.speak = u => window.__said.push({ text: u.text, inTap: !!window.__inTap }); }   // no voices yet: the first tap on an iPhone
  });
  await pg.goto(HTTP + ROOT + '/slide-and-read.html'); await pg.waitForTimeout(500);
  let r = await pg.evaluate(() => ['body', '#sayBtn', '#gearBtn'].map(q => getComputedStyle(document.querySelector(q)).touchAction));
  ok('no double-tap zoom on the page and its buttons', r.every(t => t === 'manipulation'), r.join());
  await pg.tap('#startBtn'); await pg.waitForTimeout(300);
  if (await pg.isVisible('#warmSkip')) await pg.tap('#warmSkip');
  await pg.waitForTimeout(300);
  r = await pg.evaluate(() => window.__said.slice());
  ok('the first tap anywhere unlocks speech with a silent, blank utterance', r.length === 1 && !r[0].text.trim(), JSON.stringify(r));
  const hearOnce = async () => pg.evaluate(() => { win(); window.__inTap = true; $('sayBtn').click(); window.__inTap = false; const h = hint.textContent; return { said: window.__said.filter(x => x.text.trim()).slice(-1)[0], hint: h }; });
  const tries = []; for (let i = 0; i < 4; i++) { tries.push(await hearOnce()); await pg.evaluate(() => setHint('')); }
  ok('👂 speaks inside the tap, even with no voices listed yet', tries.every(t => t.said && t.said.inTap), JSON.stringify(tries[0].said));
  ok('"No sound? Turn off silent mode" shows on the first 3 taps only', tries.slice(0, 3).every(t => /silent mode/.test(t.hint)) && !/silent mode/.test(tries[3].hint), tries.map(t => !!t.hint).join());
  // Settings
  const openSettings = async () => { await pg.tap('#gearBtn'); await pg.waitForTimeout(250); };
  await openSettings();
  r = await pg.evaluate(() => { const p = $('panel'); p.scrollTop = 99999; const d = document.querySelector('#panel .x-btn').getBoundingClientRect(); return { top: d.top, bottom: d.bottom, vh: innerHeight, scrolled: p.scrollTop > 0 }; });
  ok('Settings: ✕ stays in view at the top after scrolling to the bottom', r.scrolled && r.top >= 0 && r.bottom <= r.vh, JSON.stringify(r));
  await pg.tap('#panel .x-btn'); await pg.waitForTimeout(200);
  ok('Settings: Done closes it', await pg.evaluate(() => $('sheet').hidden));
  await openSettings(); await pg.mouse.click(4, 4); await pg.waitForTimeout(200);
  ok('Settings: tapping outside closes it (no requestSubmit on this device)', await pg.evaluate(() => $('sheet').hidden));
  await openSettings(); await pg.keyboard.press('Escape'); await pg.waitForTimeout(200);
  ok('Settings: Escape closes it', await pg.evaluate(() => $('sheet').hidden));
  await openSettings(); await pg.evaluate(() => $('changeLessonBtn').click()); await pg.waitForTimeout(250);
  ok('Settings: Change lesson closes it and opens the chooser', await pg.evaluate(() => $('sheet').hidden && !$('lessonCover').hidden));
  await pg.evaluate(() => document.querySelectorAll('.cover').forEach(c => c.hidden = true));
  await openSettings(); await pg.evaluate(() => $('welcomeLink').click()); await pg.waitForTimeout(250);
  ok('Settings: Show the welcome screen closes it first', await pg.evaluate(() => $('sheet').hidden && !$('welcomeCover').hidden));
  await b.close(); })();
