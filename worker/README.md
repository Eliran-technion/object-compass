# Flights proxy

Live aircraft sources (adsb.lol, OpenSky, airplanes.live) block direct browser requests (no CORS headers).
`flights-proxy.js` is a tiny Cloudflare Worker that fetches adsb.lol for the compass and adds the header.

## Deploy (free, about 5 minutes)
1. Sign in at https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it `flights-proxy`, click **Deploy**, then **Edit code**.
3. Replace everything with the contents of `flights-proxy.js`, click **Deploy**.
4. Copy the worker URL (looks like `https://flights-proxy.<you>.workers.dev`).
5. Paste it into `api-project/config.js` → `FLIGHT_PROXY`, commit and push.

Test: open `https://flights-proxy.<you>.workers.dev/?lat=32.79&lon=34.99&r=60` in a browser. You should see JSON with an `ac` list.

Data: [adsb.lol](https://adsb.lol) (ODbL). Routes: [adsbdb](https://www.adsbdb.com).
