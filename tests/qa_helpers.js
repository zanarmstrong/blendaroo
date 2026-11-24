// Shared by the tests. Every test opens the app over a local http server (HTTP + an absolute path in this folder), never as a
// file: opened as a file, Chromium sometimes loses a setting saved just before a reload, which real websites don't.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'),   // the repo folder (tests live in tests/)
      PORT = 41000 + (process.pid % 20000);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv',
  '.png': 'image/png', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  let f = path.resolve(decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (q.url.split(/[?#]/)[0].endsWith('/')) f = path.join(f, 'index.html');   // a folder serves its index.html, as GitHub Pages does
  if (!f.startsWith(ROOT + path.sep)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { r.writeHead(e ? 404 : 200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});
srv.listen(PORT, '127.0.0.1'); srv.unref();   // unref: the test ends when its browser closes
const HTTP = 'http://127.0.0.1:' + PORT;      // HTTP + '/abs/path/to/file' serves that file from this folder
fs.mkdirSync(path.join(ROOT, 'test-output'), { recursive: true });   // screenshots tests take go here (not in the project or zips)
module.exports = {
  HTTP, ROOT,
  OUT: path.join(ROOT, 'test-output'),
  ok: (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, x); if (!c) process.exitCode = 1; },
  // the app opens on the Ready card: tests that start from the full lesson chooser open it with "Change lesson"
  openChooser: async p => { try { await p.waitForSelector('#rdChange', { state: 'visible', timeout: 1500 }); await p.click('#rdChange'); await p.waitForTimeout(100); } catch (e) {} },
};
