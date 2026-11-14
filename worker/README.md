# Data proxy (Cloudflare Worker)

Live aircraft sources block direct browser requests (no CORS), and the ships source (aisstream.io) needs a private key.
`flights-proxy.js` runs on Cloudflare and serves both, adding the CORS header and keeping the key server-side.

- Deployed as `object-compass-proxy` → https://object-compass-proxy.eliran-dayan.workers.dev
- `/?lat=..&lon=..&r=..` aircraft (adsb.lol), `/ships?lat=..&lon=..&r=..` ships (aisstream.io)
- Secret `AIS_KEY` (aisstream.io API key): Cloudflare dashboard → Workers & Pages → object-compass-proxy → Settings → Variables and Secrets → Add → type Secret.

To update the code: dashboard → object-compass-proxy → Edit code → paste this file → Deploy.
