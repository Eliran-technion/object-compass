# Object Compass · מצפן אובייקטים

Point your phone at one thing: a landmark, any address, the plane overhead, the ISS.
Phone sensors (GPS + orientation) meet live APIs. Built for phones.

Live: https://eliran-technion.github.io/object-compass/

- Satellites: CelesTrak TLE + satellite.js (computed in the browser)
- Aircraft: adsb.lol through a small Cloudflare Worker (`worker/`), routes from adsbdb
- Addresses: OpenStreetMap Nominatim
- Visibility (Mount Hermon / Meron): Open-Meteo
- Sun & Moon: computed locally

Part of the TryAI course, by Eliran Dayan: https://eliran-technion.github.io/ME-AI_course/
