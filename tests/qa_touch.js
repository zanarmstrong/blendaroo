// iPad finger: the dot follows a finger that drifts off the track, and a brief lift doesn't lose the word
const { chromium, devices } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPad (gen 7) landscape'] });
  const pg = await ctx.newPage(); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto(HTTP + path.join(ROOT, 'slide-and-read.html')); await pg.waitForTimeout(500); await openChooser(pg);
  await pg.click('#lsNext'); await pg.click('#startBtn'); if (await pg.isVisible('#warmSkip')) await pg.click('#warmSkip');
  const cdp = await ctx.newCDPSession(pg);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const fresh = () => pg.evaluate(() => { current = { w: 'shrimp', ord: 1045 }; setup(); });
  const geo = () => pg.evaluate(() => { const t = track.getBoundingClientRect(), b = bead.getBoundingClientRect(); return { x0: b.left + b.width / 2, y: t.top + t.height / 2, x1: t.right - 10, h: t.height }; });
  const state = () => pg.evaluate(() => ({ on: spans.filter(s => s.classList.contains('on')).length, n: spans.length, done, bead: Math.round(parseFloat(bead.style.left)) }));
  const drag = async (from, to, y0, y1, steps = 25) => { for (let i = 1; i <= steps; i++) { await touch('touchMove', from + (to - from) * i / steps, y0 + (y1 - y0) * i / steps); await pg.waitForTimeout(12); } };

  // 1. finger drifts far below the track halfway through, keeps going: dot follows, word completes
  await fresh(); await pg.waitForTimeout(300); let g = await geo();
  await touch('touchStart', g.x0, g.y); const mid = (g.x0 + g.x1) / 2;
  await drag(g.x0, mid, g.y, g.y + 260);
  let s = await state(); ok('drifting 260px below the track: dot keeps following', s.bead > (mid - g.x0) * 0.6 && s.on > 0, JSON.stringify(s));
  await drag(mid, g.x1, g.y + 260, g.y - 200); await touch('touchEnd');
  s = await state(); ok('...and the word is finished', s.done, JSON.stringify(s));

  // 2. a brief lift halfway, finger back on the dot within the grace period: carries on
  await fresh(); await pg.waitForTimeout(300); g = await geo();
  await touch('touchStart', g.x0, g.y); await drag(g.x0, mid, g.y, g.y); await touch('touchEnd');
  await pg.waitForTimeout(150); const lit = (await state()).on;
  await touch('touchStart', mid + 10, g.y); await pg.waitForTimeout(50);
  s = await state(); ok('brief lift: sounds stay lit when the finger comes back', s.on >= lit && lit > 0, JSON.stringify({ lit, ...s }));
  await drag(mid + 10, g.x1, g.y, g.y); await touch('touchEnd');
  ok('...and the word finishes', (await state()).done);

  // 3. a real lift (longer than the grace period) still resets, as before
  await fresh(); await pg.waitForTimeout(300); g = await geo();
  await touch('touchStart', g.x0, g.y); await drag(g.x0, mid, g.y, g.y); await touch('touchEnd');
  await pg.waitForTimeout(1200);
  s = await state(); ok('a real lift resets the word', s.on === 0 && !s.done, JSON.stringify(s));

  // 4. the page doesn't scroll or zoom while sliding
  ok('page did not scroll', await pg.evaluate(() => scrollY === 0 && document.scrollingElement.scrollTop === 0));
  await b.close();
})();
