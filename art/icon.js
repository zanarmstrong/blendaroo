// Draws the app icons (docs/icons/) from the app's own alien and slider. Run by hand from the repo folder after
// python3 build_site.py:  node art/icon.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 600, height: 600 } });
  await pg.goto('file://' + process.cwd() + '/slide-and-read.html'); await pg.waitForTimeout(300);
  const creature = await pg.evaluate(() => creatureSvg('slide'));
  // the alien above the slide groove with the yellow dot: the app in one picture
  const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="#4f86d4"/>
    <g transform="translate(${256 - 150 * (1 - pad)} ${70 + 40 * pad}) scale(${2.5 * (1 - pad)})" color="#1d2740">${creature.replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g>
    <rect x="${70 + 60 * pad}" y="${385 - 30 * pad}" width="${372 - 120 * pad}" height="${78 - 10 * pad}" rx="${39 - 5 * pad}" fill="#e2e8f2" stroke="#cfd8e6" stroke-width="6"/>
    <circle cx="${112 + 60 * pad}" cy="${424 - 35 * pad}" r="${30 - 4 * pad}" fill="#f1b42c" stroke="#8a6410" stroke-width="5"/>
  </svg>`;
  for (const [name, size, pad] of [['icon-512.png', 512, 0], ['icon-192.png', 192, 0], ['apple-touch-icon.png', 180, 0], ['icon-maskable-512.png', 512, 0.2]]) {
    await pg.setViewportSize({ width: size, height: size });
    await pg.setContent(`<html><body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(svg(pad)).toString('base64')}" style="width:${size}px;height:${size}px;display:block"></body></html>`);
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: 'docs/icons/' + name, omitBackground: false });
  }
  await b.close();
})();
