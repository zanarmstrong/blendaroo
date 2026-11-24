// Run the Sound by Sound test suite.   node run_tests.js [name ...]
// A test fails if it prints a FAIL line, the page throws (PAGEERR / ERR), it exits non-zero, or it runs past 120 s.
// Exit code: number of failing tests (0 = all good).
const path = require('path');
const { spawnSync } = require('child_process');
const SUITE = ['qa_welcome', 'qa_chooser', 'qa_find', 'qa_screens', 'qa_light', 'qa_topbar', 'qa_move', 'qa_oldaddress', 'qa_oldsw', 'qa_iphone', 'qa_clips', 'qa_listlink', 'qa_addwords', 'qa_layout', 'qa_voicehelp', 'qa_voice', 'qa_upload', 'qa_uploadhearts', 'qa_blocked', 'qa_touch', 'qa_theme', 'qa_b4', 'qa_b1', 'qa24', 'qa_ufli', 'qa_wl', 'qa_heart', 'qa_common', 'qa_review', 'qa_resume', 'qa_uk'];
const FLAKY = { qa24: 1 };   // known timing flake ("resume after reload"): one retry
const pick = process.argv.slice(2);
let bad = 0;
const fs = require('fs');
for (const t of pick.length ? pick : SUITE) {
  if (!fs.existsSync(path.join(__dirname, t + '.js'))) { console.log('skip ' + t.padEnd(11) + ' (needs files that are not in the repo)'); continue; }
  let tries = 1 + (FLAKY[t] || 0), out = '', why = '';
  while (tries--) {
    const r = spawnSync('node', [path.join(__dirname, t + '.js')], { cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 120000 });
    out = (r.stdout || '') + (r.stderr || '');
    const fails = out.split('\n').filter(l => /^(FAIL|PAGEERR|ERR)\b/.test(l));
    why = r.error ? r.error.code : r.status ? 'exit ' + r.status : fails.length ? fails.length + ' failing check(s)' : '';
    if (!why) break;
  }
  const passes = (out.match(/^PASS/mg) || []).length;
  console.log((why ? 'FAIL ' : 'ok   ') + t.padEnd(12) + (why || passes + ' checks'));
  if (why) { bad++; console.log(out.split('\n').filter(l => /^(FAIL|PAGEERR|ERR|Error|\s+at )/.test(l)).slice(0, 8).map(l => '       ' + l.slice(0, 220)).join('\n')); }
}
console.log(bad ? `\n${bad} test(s) failing` : '\nall tests pass');
process.exitCode = bad;
