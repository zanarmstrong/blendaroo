Sound by Sound: the published website (docs/)
=============================================
This folder is what GitHub Pages publishes at soundbysound.app. index.html, sw.js and manifest.webmanifest are built
from the source by build_site.py (see the repo's README.md): don't edit them here.

© 2026 Zan Armstrong. Free for non-commercial use under the PolyForm Noncommercial License 1.0.0
(https://polyformproject.org/licenses/noncommercial/1.0.0). Families, schools and charities may use it freely; selling it or using it in a paid product is not allowed.
Andika font © SIL Global, used under the SIL Open Font License 1.1 (see fonts/OFL.txt).

Files
- index.html             the app
- sw.js                  lets the app open with no internet once it has been opened once
- manifest.webmanifest   name and icons for "Add to Home Screen"
- icons/                 app icons
- share.png              the picture shown when a link to the site is shared (1200 x 630)
- audio/                 the recorded voice, one clip per word
- fonts/                 Andika (SIL Open Font License, see fonts/OFL.txt)
- LICENSE                the licence (PolyForm Noncommercial 1.0.0)
- CNAME                  the web address for GitHub Pages: soundbysound.app (keep it when uploading a new version)

Add to the home screen
- iPhone / iPad (Safari): Share button > Add to Home Screen.
- Android (Chrome): menu > Add to Home screen (or Install app).
Opening it from the home screen icon keeps its saved progress safe from Safari's 7-day clean-up of website data.

Saved progress
- Everything is saved on the device. Nothing is sent to any server.
- Settings > "Send to another device" makes a link with this device's words and aliens.
  Open it on the other device to add them there. Send it to yourself as a backup, too.

Updating
- Change the source, run python3 build_site.py and the tests, and commit the source and docs/ together.
  The app picks up the new version the next time it is opened with internet.
