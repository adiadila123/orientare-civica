// Minimal service worker — registering it (even with no caching) is what
// unlocks the browser's "install app" prompt. Deliberately no offline cache:
// this app is a short lookup/document tool, not something used offline, and
// caching /api responses would risk serving stale triage results.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network passthrough — no offline cache by design.
});
