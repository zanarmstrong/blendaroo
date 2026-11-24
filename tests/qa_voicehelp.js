// Settings → 👂 voice: names the voice, and on iPhone/iPad/Mac shows how to get a clearer one (open only when it'd help)
// (Device voice: these checks are about the device's own voice; the recorded voice has qa_clips.js)
const { chromium, devices } = require('playwright');
const { ok, openChooser, HTTP, OUT, ROOT } = require('./qa_helpers');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const run = async (dev, voices, shot) => {
    const ctx = await b.newContext({ ...devices[dev] }); const pg = await ctx.newPage(); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} try { const k = 'slideRead.settings', s = JSON.parse(localStorage.getItem(k) || '{}'); if (!s.voice) localStorage.setItem(k, JSON.stringify(Object.assign(s, { voice: 'device' }))); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.addInitScript(vs => { const list = vs.map(([name, lang, local]) => ({ name, lang, localService: local !== false }));
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => list, cancel() {}, speak() {}, addEventListener() {} } }); }, voices);
    await pg.goto(HTTP + path.join(ROOT, 'slide-and-read.html')); await pg.waitForTimeout(400);
    await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); });
    await pg.evaluate(() => document.querySelector('.voice-row').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(150);
    const r = await pg.evaluate(() => ({ cur: $('curVoice').textContent, open: $('voiceHelp').open, steps: $('voiceSteps').textContent }));
    if (shot) await pg.screenshot({ path: shot });
    await ctx.close(); return r;
  };
  let r = await run('iPhone 13', [['Samantha', 'en-US'], ['Daniel', 'en-GB']], OUT + '/voice_iphone.png');
  ok('iPhone, standard voice: says Samantha, guide open with the iPhone steps', /Samantha/.test(r.cur) && /this iPhone/.test(r.cur) && r.open && /Spoken Content/.test(r.steps) && /Enhanced/.test(r.steps), JSON.stringify(r).slice(0, 160));
  r = await run('iPad (gen 7)', [['Samantha', 'en-US'], ['Ava (Premium)', 'en-US']]);
  ok('iPad with a Premium voice: says Ava, ✓, guide closed', /Ava/.test(r.cur) && /✓/.test(r.cur) && !r.open, r.cur);
  r = await run('Desktop Chrome', [['Samantha', 'en-US'], ['Google US English', 'en-US', false]]);
  ok('computer with Chrome: Google US English ✓', /Google US English/.test(r.cur) && /✓/.test(r.cur) && !r.open, r.cur);
  await b.close();
})();
