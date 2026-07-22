# Clotheshorse

A single-page PWA that replaces guessing at the sky. It reads the weather
forecast for your location and turns it into one practical answer: **the best
time windows to hang your laundry outside** so it dries as fast as possible.

- **Today** — a live **Drying Index** gauge for the current moment, the best
  remaining window of the day (e.g. `12:00 – 18:00 · index 87`), and an
  hour-by-hour strip with temperature, conditions and a color-coded score
  per hour.
- **Next days** — one row per day for the next six days: forecast, min/max
  temperatures, and the single best drying window of that day.

Location comes from city search (with autocomplete) or the browser's GPS.
The site is a buildless static project: no bundler, no framework, no backend —
all data is fetched client-side from free public APIs.

## How the Drying Index works

Laundry dries by evaporation, so each hour gets a 0–100 score from the four
factors that drive it, weighted by how much each one matters:

```
score = 100 * ( 0.35 * humidity_factor      # (100 - RH) / 70
              + 0.25 * sun_factor            # shortwave radiation / 550 W/m²
              + 0.20 * wind_factor           # wind speed / 24 km/h
              + 0.20 * temp_factor )         # (T - 2°C) / 28
score *= (1 - rain_probability) ^ 1.3        # rain-risk damping
score *= 0.35 if night                       # no sun, falling temps, dew
score ≈ 0 if precipitation forecast          # ≥ 0.2 mm or ≥ 60% probability
```

Classification:

| Score    | Meaning                          |
|----------|----------------------------------|
| 65–100   | Great for drying                 |
| 45–64    | Fair — it'll dry, just slowly    |
| 0–44     | Not recommended                  |

## How time windows are picked

For each day, hours are grouped into contiguous runs with a score above the
"great" threshold (falling back to "fair" if no hour qualifies). Runs shorter
than two hours are skipped when a longer one exists; the run with the highest
average score wins. Today's banner shows that window with its average index;
each forecast row shows the best window of its day as a colored chip.

All hourly math runs in the **selected city's timezone** (the IANA zone
returned by the API), not the browser's — searching a city nine hours behind
you shows *its* current hour, not yours.

## Data sources

- **[Open-Meteo](https://open-meteo.com/)** — hourly and daily forecast
  (temperature, humidity, wind, shortwave radiation, precipitation
  probability, weather codes) plus city geocoding. Free, no API key, open
  CORS. Chosen over OpenWeatherMap (key required, no solar radiation on the
  free tier), WeatherAPI.com (registration) and Met.no (custom User-Agent).
- **[BigDataCloud](https://www.bigdatacloud.com/)** — reverse geocoding, used
  only to display a city name for GPS coordinates. Free client API, no key.
- **[Meteocons](https://github.com/basmilius/weather-icons)** — colored
  fill-style weather icons (MIT), bundled locally with day/night variants.

## Project structure

```
.
├── index.html            # markup, app states (welcome / loading / error / dashboard)
├── faq.html              # how to read the app, one question at a time
├── styles.css            # design system: dark navy, amber accent, glassmorphism
├── app.js                # forecast fetch, Drying Index, window picking, rendering
├── sw.js                 # service worker: shell cache-first, API network-first
├── manifest.webmanifest  # PWA manifest (standalone, any + maskable icons)
└── icons/
    ├── icon.svg              # app icon
    ├── icon-maskable.svg     # maskable variant
    ├── apple-touch-icon.png  # 512×512 for iOS
    └── weather/              # 16 Meteocons SVGs
```

## Run locally

There is no build step. From the project root:

```bash
python3 -m http.server 8741
```

Open <http://localhost:8741>. Geolocation requires HTTPS in production, but
works on `localhost`.

## Deploy

Push to `main` and GitHub Pages publishes the site — every asset is static
and APIs are called directly from the browser. When shipping changes to
cached shell files (`index.html`, `app.js`, `styles.css`), bump the
`SHELL_CACHE` version in `sw.js` so installed clients pick them up.

## PWA

Once visited, the app shell and icons work offline; the last fetched forecast
is served from cache when the network is gone. Install it from the browser
menu ("Add to Home Screen" on mobile, the address-bar install icon on
desktop) and it opens standalone with its own icon.

## Notes

- The index is a heuristic for evaporation speed, not a meteorological
  product. Cold, dry, windy days genuinely outperform muggy summer evenings —
  that's why humidity and wind outweigh temperature.
- The last viewed location is stored in `localStorage` only. Coordinates are
  sent to the two APIs above and nowhere else.

## License

MIT. Weather data belongs to Open-Meteo and its upstream national weather
services; icons are Meteocons by Bas Milius (MIT).
