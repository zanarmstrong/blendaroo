// pickVoice with a fake voice list: Google US English first, else Premium/Enhanced, else Samantha; offline falls back
// (Device voice: these checks are about the device's own voice; the recorded voice has qa_clips.js)
const { chromium } = require('playwright');
const { ok, openChooser, HTTP, OUT } = require('./qa_helpers');
(async () => { const b = await chromium.launch(); 
  const run = async voices => { const pg = await b.newPage(); await pg.addInitScript(() => { try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {} try { const k = 'slideRead.settings', s = JSON.parse(localStorage.getItem(k) || '{}'); if (!s.voice) localStorage.setItem(k, JSON.stringify(Object.assign(s, { voice: 'device' }))); } catch (e) {} }); pg.on('pageerror', e => console.log('PAGEERR', e.message));
    await pg.addInitScript(vs => { const list = vs.map(([name, lang, local]) => ({ name, lang, localService: local !== false }));
      window.__spoken = []; window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => list, cancel() {}, speak(u) { window.__spoken.push([u.voice && u.voice.name, u.rate, u.text]); if (u.voice && !u.voice.localService && window.__offline) setTimeout(() => u.onerror && u.onerror({ error: 'network' }), 10); } } }); }, voices);
    await pg.goto(HTTP + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(300);
    const r = await pg.evaluate(async () => { const a = pickVoice() && pickVoice().name; window.__offline = true; speakWord('sulled'); await new Promise(r => setTimeout(r, 400)); return [a, JSON.stringify(window.__spoken)]; });
    await pg.close(); return r; };
  let r = await run([['Samantha', 'en-US'], ['Google US English', 'en-US', false], ['Ava (Premium)', 'en-US']]);
  ok('computer with Chrome: Google US English, slower, the word as written; offline falls back to a device voice', r[0] === 'Google US English' && r[1] === '[["Google US English",0.75,"sulled"],["Ava (Premium)",0.75,"sulled"]]', r.join(' '));
  r = await run([['Samantha', 'en-US'], ['Daniel', 'en-GB'], ['Zoe (Enhanced)', 'en-US'], ['Ava (Premium)', 'en-US']]);
  ok('iPad with a Premium voice downloaded: uses it', r[0] === 'Ava (Premium)', r[0]);
  r = await run([['Daniel', 'en-GB'], ['Samantha', 'en-US']]);
  ok('iPad as it comes: Samantha', r[0] === 'Samantha', r[0]);
  await b.close(); })();
