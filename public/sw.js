/* Starvega service worker — installable app + web push.
 * Registered only when the "pwa" / "web_push" flags are on (see PwaBoot).
 * Deliberately NO fetch handler / caching: pages are ISR-cached by Vercel and
 * a stale offline copy of a menu or price would do more harm than good. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

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
