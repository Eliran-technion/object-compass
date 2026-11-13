/* Object Compass · flights proxy (Cloudflare Worker)
   Why: live aircraft APIs (adsb.lol and friends) don't send CORS headers, so a browser page
   can't read them directly. This worker fetches the data server-side and adds the header.

   GET /?lat=32.79&lon=34.99&r=60   →   adsb.lol /v2/point/{lat}/{lon}/{r}   (r in nautical miles, max 250)

   Locked down: only GET, only that one upstream, only numeric parameters, only your site as origin.
   No API key is needed for adsb.lol. If you ever switch to a source that needs one, store it with
   `Settings → Variables and Secrets` in the Cloudflare dashboard and read it as env.MY_KEY here,
   never in the website code. */

const ALLOWED_ORIGINS = [
  "https://eliran-technion.github.io",
  "http://localhost:5500",      // VS Code Live Server
  "http://127.0.0.1:5500",
  "http://localhost:8000",
];
const CACHE_SECONDS = 5;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const r = Math.min(250, Math.max(1, Number(url.searchParams.get("r") || 60)));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return new Response(JSON.stringify({ error: "lat/lon required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // round so nearby users share one cached answer (≈1 km grid)
    const upstream = `https://api.adsb.lol/v2/point/${lat.toFixed(2)}/${lon.toFixed(2)}/${Math.round(r)}`;
    const cache = caches.default;
    const cacheKey = new Request(upstream);
    let res = await cache.match(cacheKey);
    if (!res) {
      const up = await fetch(upstream, { headers: { "User-Agent": "object-compass (github.com/Eliran-technion/ME-AI_course)" } });
      if (!up.ok) return new Response(JSON.stringify({ error: "upstream " + up.status }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
      res = new Response(up.body, { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_SECONDS}` } });
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }
    const out = new Response(res.body, res);
    Object.entries(cors).forEach(([k, v]) => out.headers.set(k, v));
    return out;
  },
};
