# Sound by Sound

Phonics practice for beginning readers, at **https://soundbysound.app**. The reader slides a finger under a word, and
each sound lights up in order until she has read the whole word. It works offline once opened, and nothing about
the reader leaves the device.

## How it is built

The whole app is one HTML file, `slide_template.html`, with the word lists and the list of recorded words baked in
at build time. The build writes the website into `docs/`, which GitHub Pages publishes.

    python3 build_site.py         # slide_template.html + word lists + audio/  ->  docs/
    npm install                   # once: the test browser (Playwright)
    node tests/run_tests.js       # all tests must pass before a change goes in

| What | Where |
| --- | --- |
| The app: HTML, CSS and script (a contents list is at the top of the script) | `slide_template.html` |
| Word lists, already made (see below) | `ufli_data.json` (By phoneme), `hearts_track.json` (Heart words), `custom_marks.json` (heart marks for common words) |
| Recorded voice, one clip per word | `audio/<word>.mp3` |
| Build | `build_site.py` runs `build.py` (bakes in the data) then `build_web.py` (the website: page, offline worker, manifest) |
| The published website | `docs/` (built: don't edit `index.html`, `sw.js` or `manifest.webmanifest` by hand) |
| Icons, font, the picture for shared links | `docs/icons/`, `docs/fonts/`, `art/` (`node art/render.js` redraws `art/share.png`) |
| Tests (browser tests with Playwright) | `tests/` (`node tests/run_tests.js`, or name tests: `node tests/run_tests.js qa_find`); `tests/sample_list.csv` is a sample uploaded lesson list (`node tests/make_sample_list.js` remakes `sample_list.json` from it) |

The word lists are made outside this repo, from dictionaries and research data with their own terms and from hand-checked
lists, so they are not regenerated here. To suggest a change to the words (a word that's wrong, missing or shouldn't be
there), open an issue.

How to contribute: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

© 2026 Zan Armstrong. [PolyForm Noncommercial 1.0.0](LICENSE): for non-commercial use (families, schools,
charities). Andika font © SIL Global, SIL Open Font License 1.1 (`docs/fonts/OFL.txt`).
