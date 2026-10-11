/* Starvega service worker — installable app + web push + offline menu.
 * Registered only when the "pwa" / "web_push" flags are on (see PwaBoot).
 *
 * Caching is deliberately conservative so a price or menu is never stale:
 *  - Page navigations (/, /Menu…): NETWORK FIRST. The live page always wins;
 *    the last good copy is only shown when the phone is offline, with a banner.
 *  - /_next/static/* (content-hashed, immutable): cache first → fast repeat loads.
 *  - Never cached: /admin, /api, checkout/Stripe pages, anything non-GET. */

const VERSION = "sv-v2";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const NEVER = [/^\/admin/, /^\/api\//, /^\/stripe/, /\/purchase/, /^\/checkout/, /^\/login/];
const OFFLINE_OK = [/^\/$/, /^\/Menu(\/|$)/, /^\/catering/, /^\/story/];

function offlineBanner(html) {
  const bar =
    '<div style="position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1c1917;color:#fff;font:14px system-ui;padding:10px 14px;text-align:center">You\'re offline. This is the menu from your last visit. Prices may have changed. Ordering needs a connection.</div>';
  return html.replace(/<\/body>/i, bar + "</body>");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((r) => r.test(url.pathname))) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate" && OFFLINE_OK.some((r) => r.test(url.pathname))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => {
          const c = await caches.open(PAGES);
          const hit = (await c.match(url.pathname)) || (await c.match("/Menu")) || (await c.match("/"));
          if (!hit) return new Response("You're offline. Connect to the internet to see the menu.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
          const html = offlineBanner(await hit.text());
          return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Update", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Update";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag,
      renotify: !!data.tag,
      icon: "/api/pwa/icon/192",
      badge: "/api/pwa/icon/192",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).pathname === url && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
