// The recorded voice (Zan, Nov 20): 👂 plays the word's clip (audio/<word>.mp3) when there is one; a word without a clip,
// a clip that can't load, or the "Device voice" setting uses the device's voice; a clip heard once plays offline too.
const { chromium } = require('playwright');
const { ok, HTTP, ROOT } = require('./qa_helpers');
const fs = require('fs');
const SITE = HTTP + ROOT + '/docs/index.html';
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext(); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.addInitScript(() => {
    try { localStorage.setItem('slideRead.welcomed', '1'); } catch (e) {}
    window.__said = []; window.__played = [];
    if (window.speechSynthesis) window.speechSynthesis.speak = u => { if ((u.text || '').trim()) window.__said.push(u.text); };
    const real = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__played.push(decodeURIComponent(this.src.split('/audio/')[1] || '')); return real.call(this).catch(e => { throw e; }); };
  });
  await pg.goto(SITE); await pg.waitForTimeout(800);
  const nClips = fs.readdirSync(ROOT + '/audio').filter(f => f.endsWith('.mp3')).length;
  let r = await pg.evaluate(() => ({ n: CLIPS.size, cat: CLIPS.has('cat'), def: S.voice }));
  ok('the app knows every recorded word, and the recorded voice is the default', r.n === nClips && r.cat && r.def === 'rec', JSON.stringify(r) + ' files ' + nClips);
  const hear = async w => pg.evaluate(async w => { window.__said = []; window.__played = []; speakWord(w); await new Promise(z => setTimeout(z, 700)); return { played: window.__played.slice(), said: window.__said.slice() }; }, w);
  r = await hear('cat');
  ok('👂 plays the clip for a recorded word, and the device voice stays quiet', r.played.join() === 'cat.mp3' && !r.said.length, JSON.stringify(r));
  r = await pg.evaluate(() => [clipKey("Can't"), clipKey('I'), clipKey('August')]);
  ok('clip names: lower case, an apostrophe as _ (as make_clips.sh saves them)', r.join() === 'can_t,i,august', r.join());
  r = await hear('zorbleflap');
  ok('a word with no clip is said by the device voice', !r.played.length && r.said.join() === 'zorbleflap', JSON.stringify(r));
  await pg.evaluate(() => CLIPS.add('nosuchclip'));
  r = await hear('nosuchclip');
  ok('a clip that can\'t load falls back to the device voice', r.said.join() === 'nosuchclip', JSON.stringify(r));
  await pg.evaluate(() => { S.voice = 'device'; save(); });
  r = await hear('cat');
  ok('"Device voice" in Settings: no clips, the device says it', !r.played.length && r.said.join() === 'cat', JSON.stringify(r));
  await pg.evaluate(() => { document.querySelectorAll('.cover').forEach(c => c.hidden = true); $('gearBtn').click(); });
  await pg.click('#voiceSeg [data-v="rec"]'); await pg.waitForTimeout(200);
  r = await pg.evaluate(() => ({ v: S.voice, saved: JSON.parse(localStorage.getItem('slideRead.settings')).voice, pressed: document.querySelector('#voiceSeg [data-v="rec"]').getAttribute('aria-pressed'), help: $('voiceHelp').hidden }));
  ok('Settings: choosing Recorded voice saves it; the device-voice help is hidden', r.v === 'rec' && r.saved === 'rec' && r.pressed === 'true' && r.help, JSON.stringify(r));
  // offline: a clip played once comes from the offline cache
  await pg.reload(); await pg.waitForTimeout(800);
  await pg.evaluate(() => navigator.serviceWorker.ready); await pg.reload(); await pg.waitForTimeout(800);   // the worker now controls the page
  r = await pg.evaluate(async () => { const x = await fetch('audio/dog.mp3'); return { ok: x.ok, ctl: !!navigator.serviceWorker.controller }; });
  await ctx.setOffline(true);
  r = await pg.evaluate(async () => { const t = async u => { try { return (await fetch(u)).ok; } catch (e) { return false; } }; return { heard: await t('audio/dog.mp3'), notHeard: await t('audio/fish.mp3') }; });
  ok('offline: a clip heard before still plays; one never heard can\'t (the device voice says it)', r.heard && !r.notHeard, JSON.stringify(r));
  await ctx.setOffline(false);
  await b.close(); })();
