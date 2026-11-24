// Makes tests/sample_list.json (an uploaded lesson list, as the app saves it) from tests/sample_list.csv, using the app's
// own upload code. The CSV is a neutral sample: 34 lessons taken from the By phoneme order, 3 heart words each.
// Run after python3 build_site.py:  node tests/make_sample_list.js
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const { HTTP, ROOT } = require('./qa_helpers');
(async () => { const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto(HTTP + ROOT + '/docs/index.html'); await pg.waitForTimeout(600);
  const csv = fs.readFileSync(path.join(__dirname, 'sample_list.csv'), 'utf8');
  const list = await pg.evaluate(csv => customFromRows(parseCSV(csv), 'Sample list', '').list, csv);
  fs.writeFileSync(path.join(__dirname, 'sample_list.json'), JSON.stringify([list]));
  console.log('tests/sample_list.json:', list.lessons.length, 'lessons');
  await b.close(); })();
