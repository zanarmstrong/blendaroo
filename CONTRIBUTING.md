# Contributing

Thank you for helping! Fixes and ideas are welcome as issues or pull requests.

## Making a change

1. Change the source: `slide_template.html` (the app) or the build scripts. Don't edit `docs/index.html`, `docs/sw.js` or
   `docs/manifest.webmanifest` by hand: they are rebuilt from the source, so a change made there is lost at the next build.
2. Build: `python3 build_site.py`
3. Test: `npm install` (once), then `node tests/run_tests.js`. Every test must pass.
   Add a test in `tests/` for new behaviour (start it with a comment saying what it checks) and add it to the list in
   `tests/run_tests.js`.
4. Look at the change at a phone held sideways, a phone held upright, and a tablet: the app is used mostly on touch screens.
5. Commit the source and the rebuilt `docs/` together, and open a pull request saying what changed and why.

Some tests need files that are not in this repo; `run_tests.js` skips them and says so.

## Things to keep

- **Saved progress is sacred.** A reader's words and aliens live in the browser under keys that start with `slideRead.`.
  Never rename or drop those keys or their fields; add new ones instead, and keep reading older saved data.
- **The reader's screen needs no reading** except the word itself: pictures and icons, not instructions. Text for grown-ups
  can be small and quiet.
- **Words.** The word lists (`ufli_data.json`, `hearts_track.json`, `custom_marks.json`) are made outside this repo and
  checked by hand (child-friendly words only). Don't edit them in a pull request; open an issue instead.
- **No content from commercial reading programs** (their word lists, lesson materials or wording).
- **Plain words** in the app. "Heart words" (not "irregular" or "sight words") for words with a part to learn by heart.
- **Touch first**, with tap areas of at least 44 px, and it must work offline once opened.

## Licence

By contributing you agree that your contribution is licensed under the project's licence
([PolyForm Noncommercial 1.0.0](LICENSE)).
