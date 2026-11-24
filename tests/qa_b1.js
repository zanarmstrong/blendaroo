// QA batch 1 checks: hear button waits, XSS names stay text, solar button visible
// (Device voice: these checks are about the device's own voice; the recorded voice has qa_clips.js)
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} try { const k = 'slideRead.settings', s = JSON.parse(localStorage.getItem(k) || '{}'); if (!s.voice) localStorage.setItem(k, JSON.stringify(Object.assign(s, { voice: 'device' }))); } catch (e) {} });
  let fired = 0; pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.exposeFunction('xssFired', () => { fired++; });
  // count real speech only: a blank utterance is the silent unlock on the first tap (iPhone/iPad)
  await pg.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = u => { if ((u.text || '').trim()) window.__spoke = (window.__spoke || 0) + 1; }); });
  await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(400); await openChooser(pg);
  await pg.click('#lsNext'); await pg.click('#startBtn'); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  // 1. hear button before and after the whole word
  let r = await pg.evaluate(() => { current = { w: 'man', ord: 1005 }; setup(); $('sayBtn').click(); return { off: $('doneRow').classList.contains('off'), op: getComputedStyle($('sayBtn')).opacity }; });
  await pg.waitForTimeout(1500); r.spokeBefore = await pg.evaluate(() => window.__spoke || 0);
  await pg.evaluate(() => { win(); $('sayBtn').click(); }); await pg.waitForTimeout(1500); r.spokeAfter = await pg.evaluate(() => window.__spoke || 0);
  r.before = { off: r.off, op: r.op };
  ok('hear waits for the whole word', r.before.off && +r.before.op < .5 && r.spokeBefore === 0 && r.spokeAfter === 1, JSON.stringify(r));
  // 2. a custom list with HTML in its names
  const csv = 'name,pattern,decodable\n"<img src=x onerror=xssFired()>Short a","a","cat, map, sad, ran, bag, ham"\n';
  r = await pg.evaluate(t => { addCustom(t, '<img src=y onerror=xssFired()>My list', ''); paintCustomButtons(); openLesson(); $('lsLesson').innerHTML = lessonOptions('x'); return { name: CUSTOM[0].name, lesson: CUSTOM[0].lessons[0].name }; }, csv);
  await pg.evaluate(() => { $('findBox').value = 'Short'; showFind(); syncPanel && 0; });
  await pg.waitForTimeout(300);
  ok('custom list names are plain text (no code runs)', fired === 0 && !/[<>]/.test(r.name + r.lesson), JSON.stringify(r) + ' fired=' + fired);
  // 3. solar system button readable in light mode
  r = await pg.evaluate(() => { const s = getComputedStyle($('spaceBtn')); return { bg: s.backgroundColor, fg: s.color }; });
  ok('solar system button: light text on a dark button', r.bg !== r.fg && r.bg.startsWith('rgb(20'), JSON.stringify(r));
  await b.close(); })();
