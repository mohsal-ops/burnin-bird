/**
 * Loads the HERE Maps SDK. Only mount this on pages/components that actually
 * render a map (MapClient, the admin place picker) - it was previously
 * loaded in the root layout on every single page, including checkout, blog,
 * and admin screens that never touch a map.
 *
 * Plain `defer`red <script> tags (not next/script) on purpose: the HERE SDK
 * chunks depend on load order (core before service/ui/mapevents), and
 * `defer` guarantees in-order execution the way next/script's
 * "afterInteractive" strategy does not.
 */
export default function HereMapsScripts() {
  return (
    <>
      <script src="https://js.api.here.com/v3/3.1/mapsjs-core.js" defer />
      <script src="https://js.api.here.com/v3/3.1/mapsjs-service.js" defer />
      <script src="https://js.api.here.com/v3/3.1/mapsjs-ui.js" defer />
      <script src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js" defer />
      <link rel="stylesheet" href="https://js.api.here.com/v3/3.1/mapsjs-ui.css" />
    </>
  );
}
