# CLAUDE.md: Object Compass

Owner: Eliran Dayan (see ME-AI_course/CLAUDE.md for who he is and how to talk to him: Hebrew, exact git commands, VS Code on Windows).

- Repo: Eliran-technion/object-compass, GitHub Pages: https://eliran-technion.github.io/object-compass/
- Local: C:\Users\Elira\projects\object-compass. Claude writes files, he runs git add/commit/push.
- Bonus project for the TryAI course (API + phone sensors). Linked from the landing page TECH item `id: "api"`.
<<<<<<< Updated upstream
- Files: index.html, style.css, app.js (all logic), config.js (FLIGHT_PROXY, radius, declination). Bump `?v=` on every change. Current: v=4.
=======
- Files: index.html, style.css, app.js (all logic), config.js (FLIGHT_PROXY, radius, declination). Bump `?v=` on every change. Current: v=5.
>>>>>>> Stashed changes
- Phone only: desktop shows a notice (with a view-only "continue anyway").
- Aiming model: the phone's TOP EDGE is the pointer. Flat = horizon, tilt top edge up = higher. iOS: webkitCompassHeading + beta. Android: deviceorientationabsolute → rotation matrix, top axis (+Y); back axis only near vertical.
- Location: live GPS only (no stale/manual city). Geolocation is requested first, synchronously inside the start tap. Clear per-platform help when blocked.
- Targets (one at a time): landmarks (no Mecca, no Bahá'í Gardens by request), Nominatim address search (submit only, ≤1/s), saved points, Sun/Moon, satellites (CelesTrak, cached 6h), aircraft via worker.
- CORS facts tested from github.io: adsb.lol/OpenSky/airplanes.live/adsb.fi blocked; CelesTrak, Open-Meteo, adsbdb, Nominatim, Photon OK.
- Picker sheet closes with X, backdrop tap, or swipe down.
- Footer: name + LinkedIn + "Sources, privacy & terms" sheet (AS IS disclaimer, privacy, ODbL/CC BY credits). No link back to the landing page by request.
- Proxy is live: Cloudflare Worker `object-compass-proxy` (account Eliran.dayan@campus.technion.ac.il, signed in with GitHub) at https://object-compass-proxy.eliran-dayan.workers.dev. Aircraft "/" (adsb.lol), ships "/ships" (aisstream.io over WebSocket, 9 s listen, 30 s cache, remembers ships 15 min). Ships need secret AIS_KEY (aisstream.io account via GitHub; Eliran creates/pastes the key himself).
- Israel note: adsb.lol has few planes near Haifa (night/coverage), so aircraft radius default is 150 NM.
<<<<<<< Updated upstream
=======
- Ships tab is hidden by request (TABS list in app.js); ship code and worker /ships stay, re-enable by adding "ships" to TABS after setting AIS_KEY.
>>>>>>> Stashed changes
