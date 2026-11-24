# Notes for AI coding assistants

Read README.md and CONTRIBUTING.md first. The rules that matter most:

- The source is `slide_template.html`. `docs/` is the built website: never hand-edit `docs/index.html`, `docs/sw.js`,
  `docs/manifest.webmanifest` or `slide-and-read.html`. After any change run `python3 build_site.py`, then
  `node tests/run_tests.js`, and commit the source and `docs/` together.
- Don't edit the word lists (`ufli_data.json`, `hearts_track.json`, `custom_marks.json`): they are generated outside
  this repo. Suggest word changes in the pull request description or an issue.
- Never change or remove saved-data keys (`slideRead.*`) or their fields; a reader's progress and aliens must survive
  every update.
- No content from commercial reading programs. Child-friendly words only.
- Add or update a browser test in `tests/` for every behaviour change, and keep all tests passing.
- Check layouts at 844x390 (phone sideways), 390x844 (phone upright), 320x568 (small phone) and 1180x820 (tablet).
