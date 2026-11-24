"""Bakes the word data into the app template: slide_template.html + data files -> slide-and-read.html
(one self-contained page; build_web.py turns it into the website)."""
import sys, json
out = open('slide_template.html').read()
import os
clips = sorted(f[:-4] for f in os.listdir('audio') if f.endswith('.mp3')) if os.path.isdir('audio') else []   # recorded words (audio/<word>.mp3)
assert out.count('__CLIPS__') == 1
out = out.replace('__CLIPS__', json.dumps(clips, separators=(',', ':')))
for key, f in [('__CUSTOMMARKS__', 'custom_marks.json'), ('__UFLI__', 'ufli_data.json'), ('__HEARTTRACK__', 'hearts_track.json')]:
    assert out.count(key) == 1, key
    out = out.replace(key, open(f).read())
out = out.replace('<title>Sound by Sound</title>', '<title>Sound by Sound</title>\n<script>document.documentElement.lang="en"</script>', 1)   # the page is in English (screen readers)
open(sys.argv[1] if len(sys.argv) > 1 else 'slide-and-read.html', 'w').write(out)
