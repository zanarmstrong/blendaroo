"""Build the website from the app source:  python3 build_site.py
  slide_template.html + word lists (ufli_data.json, hearts_track.json, custom_marks.json) + audio/  -> slide-and-read.html (build.py)
  slide-and-read.html + art/share.png + LICENSE                                                   -> docs/ (build_web.py)
docs/ is what GitHub Pages publishes at soundbysound.app. Never edit docs/index.html, docs/sw.js or docs/manifest.webmanifest
by hand: they are rebuilt from the source every time. (docs/icons, docs/fonts and docs/README.txt are kept as they are.)
The word lists are made outside this repo; see CONTRIBUTING.md."""
import subprocess, sys
for step in ['build.py', 'build_web.py']:
    r = subprocess.run([sys.executable, step], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'{step} failed:\n{r.stdout}{r.stderr}')
    print('ok ', step, '·', (r.stdout.strip().splitlines() or [''])[-1])
print('Built docs/. Now run the tests: node tests/run_tests.js')
