// ============================================================================
// Service Worker: SabanOS Offline Cache & OneSignal Push Integration
// Version: 3.0.0
// ============================================================================

const CACHE_NAME = "saban-brain-v3.0.0";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/assets/noa-avatar.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
];

// OneSignal Web Push SDK
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      );
    }),
  );
  self.clients.claim();
});

// Network-First with Cache Fallback for GViz CSV; Cache-First for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  if (url.hostname === "docs.google.com" && url.pathname.includes("/gviz/tq")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      );
    }),
  );
});

// OneSignal Push Notification Event Handler
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || "ח. סבן — עדכון הזמנה 📦";
  const options = {
    body: payload.body || "ישנו עדכון סטטוס בהזמנתך בדלפק.",
    icon: "/assets/icon-192.png",
    badge: "/assets/icon-192.png",
    dir: "rtl",
    lang: "he",
    data: payload.data || {},
    actions: [
      { action: "open_chat", title: "פתח צ'אט נועה" },
      { action: "close", title: "סגור" },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open_chat" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
    );
  }
});
