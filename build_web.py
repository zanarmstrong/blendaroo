# Website build: one folder to upload to any static host (no server code).
import json, re, hashlib, os, shutil
src = open('slide-and-read.html').read()
# local font instead of Google Fonts (works offline; no outside requests)
fonts = re.search(r'<link rel="preconnect".*?rel="stylesheet">\n', src, re.S)
assert fonts
src = src.replace(fonts.group(0), '')
face = """@font-face { font-family: "Andika"; src: url("fonts/Andika-Regular.ttf") format("truetype"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Andika"; src: url("fonts/Andika-Bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }
"""
src = src.replace('<style>\n', '<style>\n' + face, 1)
# 3. split into head and body
title_end = src.index('</title>') + len('</title>')
style_end = src.index('</style>') + len('</style>')
head_extra = src[:style_end].replace('<title>Sound by Sound</title>', '')
body = src[style_end:]
sw_reg = """<script>
// works offline once opened; ask the browser not to clear this device's progress
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
</script>
"""
page = f"""<!doctype html>
<!-- Sound by Sound. © 2026 Zan Armstrong. PolyForm Noncommercial License 1.0.0 (https://polyformproject.org/licenses/noncommercial/1.0.0). Andika font © SIL Global, SIL Open Font License 1.1 (fonts/OFL.txt). -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="author" content="Zan Armstrong">
<meta name="copyright" content="© 2026 Zan Armstrong. PolyForm Noncommercial License 1.0.0">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sound by Sound</title>
<meta name="description" content="Sound it out, one sound at a time. Phonics practice for beginning readers: slide a finger under the word and blend the sounds.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sound by Sound">
<meta property="og:title" content="Sound by Sound">
<meta property="og:description" content="Sound it out, one sound at a time. Phonics practice for beginning readers.">
<meta property="og:url" content="https://soundbysound.app/">
<meta property="og:image" content="https://soundbysound.app/share.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sound by Sound: the word chicken, lit up one sound at a time as a yellow bead slides under it, with lines under ch and ck.">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://soundbysound.app/">
<meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111a2a" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Sound by Sound">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="preload" href="fonts/Andika-Regular.ttf" as="font" type="font/ttf" crossorigin>
{head_extra}
</head>
<body>
{body.strip()}
{sw_reg}</body>
</html>
"""
os.makedirs('docs', exist_ok=True)
open('docs/index.html', 'w').write(page)
manifest = {
  "name": "Sound by Sound", "short_name": "Sound by Sound",
  "description": "Slide your finger under the word and blend the sounds.",
  "start_url": "./", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#f5f7fb", "theme_color": "#f5f7fb",
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
json.dump(manifest, open('docs/manifest.webmanifest', 'w'), indent=2)
files = ['./', 'index.html', 'manifest.webmanifest', 'fonts/Andika-Regular.ttf', 'fonts/Andika-Bold.ttf',
         'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png']
h = hashlib.sha1()
for f in files[1:]: h.update(open('docs/' + f, 'rb').read())
ver = h.hexdigest()[:10]
sw = f"""// Sound by Sound. © 2026 Zan Armstrong. PolyForm Noncommercial License 1.0.0.
// Offline support. The page itself is fetched fresh when online (so updates arrive) and from the cache when offline;
// fonts and icons come from the cache. A new version replaces the old cache. Word recordings (audio/) are kept in their
// own cache once played, across versions, so a word heard online can be heard offline.
const CACHE = 'slide-read-{ver}';
const FILES = {json.dumps(files)};
const AUDIO = 'blendaroo-audio-v3';   // change the name whenever recordings are replaced (v3: Nov 21 re-recording + are, ant, be)
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {{
    // fetch the page fresh; keep it for offline only if it's a good, direct answer (not an error page or a redirect)
    e.respondWith(fetch(req, {{ cache: 'no-cache' }}).then(r => {{ if (r.ok && !r.redirected) {{ const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }} return r; }})
      .catch(() => caches.match('index.html')));
    return;
  }}
  if (new URL(req.url).pathname.includes('/audio/')) {{
    e.respondWith(caches.open(AUDIO).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {{ if (r.ok) c.put(req, r.clone()); return r; }}))));
    return;
  }}
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
}});
"""
open('docs/sw.js', 'w').write(sw)
# GitHub Pages: the licence (GitHub shows it for the repo) and the custom domain, so uploading a new version keeps both
shutil.copyfile('LICENSE', 'docs/LICENSE')
open('docs/CNAME', 'w').write('soundbysound.app\n')
# the sharing image for link previews (Messages, Slack, email): made from art/share.html by art/render.js
shutil.copyfile('art/share.png', 'docs/share.png')
# word recordings: copied as they are (the folder is replaced, so a removed clip doesn't linger)
shutil.rmtree('docs/audio', ignore_errors=True)
if os.path.isdir('audio'): shutil.copytree('audio', 'docs/audio')
print('built docs, cache', ver, len(page)//1024, 'KB page')
