/* Object Compass · settings
   FLIGHT_PROXY: the Cloudflare Worker (worker/flights-proxy.js) that serves aircraft at "/" and ships at "/ships".
   It holds the ships key as a secret (AIS_KEY), so no key ever appears in this website. */
window.OC_CONFIG = {
  FLIGHT_PROXY: "https://object-compass-proxy.eliran-dayan.workers.dev",
  FLIGHT_RADIUS_NM: 150,       // aircraft search radius around you, nautical miles (max 250)
  SHIP_RADIUS_KM: 80,          // ship search radius, km (max 120)
  MAG_DECLINATION: 5,          // Israel ≈ +5° east: magnetic north → true north
};
