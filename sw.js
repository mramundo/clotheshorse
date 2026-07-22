/* Clotheshorse service worker — app shell cache-first, API network-first with cache fallback */
const SHELL_CACHE = "clotheshorse-shell-v6";
const API_CACHE = "clotheshorse-api-v1";

const WEATHER_ICONS = [
  "clear-day", "clear-night", "partly-cloudy-day", "partly-cloudy-night",
  "overcast", "fog", "drizzle", "rain", "sleet", "snow",
  "partly-cloudy-day-rain", "partly-cloudy-night-rain", "partly-cloudy-day-snow",
  "thunderstorms", "thunderstorms-rain", "thermometer",
].map((n) => `./icons/weather/${n}.svg`);

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./faq.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  ...WEATHER_ICONS,
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE && k !== API_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Weather / geocoding APIs: network first, fall back to last cached response (offline mode)
  if (url.hostname.endsWith("open-meteo.com") || url.hostname.endsWith("bigdatacloud.net")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(API_CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Google Fonts: cache first (opportunistic)
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // App shell: cache first
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
  }
});
