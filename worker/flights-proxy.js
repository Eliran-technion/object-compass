/* Object Compass · data proxy (Cloudflare Worker)
   Why: the live aircraft and ship sources can't be called straight from a web page
   (aircraft: no CORS headers; ships: needs a private API key that must never sit in website code).
   This worker fetches the data server-side and returns plain JSON with the right CORS header.

   GET /?lat=32.79&lon=34.99&r=60        → aircraft from adsb.lol /v2/point (r in nautical miles, max 250)
   GET /ships?lat=32.79&lon=34.99&r=60   → ships from aisstream.io (r in km, max 120)

   Ships need one secret: in the Cloudflare dashboard, Worker → Settings → Variables and Secrets →
   add a Secret named AIS_KEY with your aisstream.io API key. Without it /ships answers 503.

   Locked down: GET only, fixed upstreams, numeric parameters only, your site as the allowed origin. */

const ALLOWED_ORIGINS = [
  "https://eliran-technion.github.io",
  "http://localhost:5500",      // VS Code Live Server
  "http://127.0.0.1:5500",
  "http://localhost:8000",
];
const PLANE_CACHE_S = 5;
const SHIP_CACHE_S = 30;
const SHIP_LISTEN_MS = 9000;     // how long to listen to the AIS stream per fresh request
const SHIP_KEEP_MS = 15 * 60e3;  // remember ships seen recently (anchored ships report only every few minutes)

// ships seen by this worker instance, by MMSI (lives as long as the instance is warm)
const seen = new Map();

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    const json = (obj, status = 200, maxAge = 0) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": `public, max-age=${maxAge}` } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });

    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return json({ error: "lat/lon required" }, 400);
    }

    if (url.pathname === "/ships") return ships(lat, lon, url, env, ctx, json);
    return planes(lat, lon, url, ctx, cors, json);
  },
};

/* ---------------- aircraft: adsb.lol ---------------- */
async function planes(lat, lon, url, ctx, cors, json) {
  const r = Math.min(250, Math.max(1, Number(url.searchParams.get("r") || 60)));
  // round so nearby users share one cached answer (≈1 km grid)
  const upstream = `https://api.adsb.lol/v2/point/${lat.toFixed(2)}/${lon.toFixed(2)}/${Math.round(r)}`;
  const cache = caches.default, key = new Request(upstream);
  let res = await cache.match(key);
  if (!res) {
    const up = await fetch(upstream, { headers: { "User-Agent": "object-compass (github.com/Eliran-technion/object-compass)" } });
    if (!up.ok) return json({ error: "upstream " + up.status }, 502);
    res = new Response(up.body, { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${PLANE_CACHE_S}` } });
    ctx.waitUntil(cache.put(key, res.clone()));
  }
  const out = new Response(res.body, res);
  Object.entries(cors).forEach(([k, v]) => out.headers.set(k, v));
  return out;
}

/* ---------------- ships: aisstream.io (WebSocket, key stays here) ---------------- */
async function ships(lat, lon, url, env, ctx, json) {
  if (!env.AIS_KEY) return json({ error: "AIS_KEY secret not set" }, 503);
  const rKm = Math.min(120, Math.max(5, Number(url.searchParams.get("r") || 60)));
  const dLat = rKm / 111, dLon = rKm / (111 * Math.max(0.2, Math.cos(lat * Math.PI / 180)));
  // shared cache cell ≈ 0.25°, so close-by users reuse one stream listen
  const cell = `${(Math.round(lat * 4) / 4).toFixed(2)},${(Math.round(lon * 4) / 4).toFixed(2)},${Math.round(rKm)}`;
  const cache = caches.default, key = new Request(`https://cache.object-compass/ships/${cell}`);
  const hit = await cache.match(key);
  if (hit) return json(await hit.json(), 200, SHIP_CACHE_S);

  const box = [[lat - dLat, lon - dLon], [lat + dLat, lon + dLon]];
  try { await listen(env.AIS_KEY, box); }
  catch (e) { if (!seen.size) return json({ error: "ais " + (e && e.message || e) }, 502); }

  const now = Date.now();
  const list = [];
  for (const [mmsi, s] of seen) {
    if (now - s.t > SHIP_KEEP_MS) { seen.delete(mmsi); continue; }
    if (s.lat < box[0][0] || s.lat > box[1][0] || s.lon < box[0][1] || s.lon > box[1][1]) continue;
    list.push(s);
  }
  const body = { now, ships: list };
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${SHIP_CACHE_S}` } })));
  return json(body, 200, SHIP_CACHE_S);
}

async function listen(apiKey, box) {
  const resp = await fetch("https://stream.aisstream.io/v0/stream", { headers: { Upgrade: "websocket" } });
  const ws = resp.webSocket;
  if (!ws) throw new Error("no websocket (" + resp.status + ")");
  ws.accept();
  const dec = new TextDecoder();
  await new Promise((resolve) => {
    const done = () => { try { ws.close(1000, "done"); } catch {} resolve(); };
    const timer = setTimeout(done, SHIP_LISTEN_MS);
    ws.addEventListener("message", (ev) => {
      let m;
      try { m = JSON.parse(typeof ev.data === "string" ? ev.data : dec.decode(ev.data)); } catch { return; }
      if (m.error) { clearTimeout(timer); done(); return; }
      const md = m.MetaData || {}, mmsi = md.MMSI;
      if (!mmsi) return;
      const s = seen.get(mmsi) || { mmsi };
      s.name = (md.ShipName || s.name || "").trim();
      const msg = m.Message || {};
      const pr = msg.PositionReport || msg.StandardClassBPositionReport;
      if (pr) {
        s.lat = pr.Latitude ?? md.latitude; s.lon = pr.Longitude ?? md.longitude;
        s.sog = pr.Sog; s.cog = pr.Cog;
        s.heading = pr.TrueHeading !== 511 ? pr.TrueHeading : undefined;
        s.t = Date.now();
      }
      const st = msg.ShipStaticData;
      if (st) {
        if (st.Name) s.name = st.Name.trim();
        s.type = st.Type; s.dest = (st.Destination || "").trim() || s.dest;
        if (s.lat == null && md.latitude != null) { s.lat = md.latitude; s.lon = md.longitude; s.t = Date.now(); }
      }
      if (s.lat != null) seen.set(mmsi, s);
    });
    ws.addEventListener("close", () => { clearTimeout(timer); resolve(); });
    ws.addEventListener("error", () => { clearTimeout(timer); resolve(); });
    ws.send(JSON.stringify({
      APIKey: apiKey,
      BoundingBoxes: [box],
      FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ShipStaticData"],
    }));
  });
}
