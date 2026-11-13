/* Object Compass · settings
   FLIGHT_PROXY: the URL of your Cloudflare Worker (see worker/README.md).
   Leave it empty until the worker is deployed; the aircraft tab will explain what is missing.
   Example: "https://flights-proxy.your-name.workers.dev" */
window.OC_CONFIG = {
  FLIGHT_PROXY: "",
  FLIGHT_RADIUS_NM: 60,        // search radius around you, nautical miles (max 250)
  MAG_DECLINATION: 5,          // Israel ≈ +5° east: magnetic north → true north
};
