// renders share.html to share.png at 1200 x 630 (the sharing image for link previews)
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await pg.goto('file://' + path.join(__dirname, 'share.html')); await pg.waitForSelector('body[data-ready]');
  await pg.screenshot({ path: path.join(__dirname, 'share.png') }); await b.close(); })();
