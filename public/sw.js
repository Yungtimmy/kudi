/* Network-only worker. Registration is what makes Kudi installable.
   Nothing is cached: wallet, RPC and API calls always go to the network. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  /* No respondWith: the browser handles every request itself. */
});
