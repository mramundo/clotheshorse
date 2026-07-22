/* ============ Clotheshorse — app logic ============ */
"use strict";

const $ = (sel) => document.querySelector(sel);

const els = {
  welcome: $("#welcome"),
  loading: $("#loading"),
  error: $("#error"),
  errorMsg: $("#error-msg"),
  dashboard: $("#dashboard"),
  searchForm: $("#search-form"),
  searchInput: $("#search-input"),
  searchResults: $("#search-results"),
  gpsBtn: $("#gps-btn"),
  welcomeGps: $("#welcome-gps"),
  retryBtn: $("#retry-btn"),
  placeName: $("#place-name"),
  todayDate: $("#today-date"),
  todayTime: $("#today-time"),
  nowIcon: $("#now-icon"),
  nowTemp: $("#now-temp"),
  nowDesc: $("#now-desc"),
  nowHum: $("#now-hum"),
  nowWind: $("#now-wind"),
  gaugeFill: $("#gauge-fill"),
  gaugeValue: $("#gauge-value"),
  gaugeVerdict: $("#gauge-verdict"),
  bestBanner: $("#best-banner"),
  bestLabel: $("#best-label"),
  bestTime: $("#best-time"),
  hoursScroll: $("#hours-scroll"),
  week: $("#week"),
};

const STORAGE_KEY = "clotheshorse:lastPlace";
let lastPlace = null;

/* ---------- Weather codes (WMO) → Meteocons icon + description ----------
   day / night icon variants, both from icons/weather/ (local, offline-safe) */
const WMO = {
  0: { d: "clear-day", n: "clear-night", desc: "Clear sky" },
  1: { d: "partly-cloudy-day", n: "partly-cloudy-night", desc: "Mostly clear" },
  2: { d: "partly-cloudy-day", n: "partly-cloudy-night", desc: "Partly cloudy" },
  3: { d: "overcast", n: "overcast", desc: "Overcast" },
  45: { d: "fog", n: "fog", desc: "Fog" },
  48: { d: "fog", n: "fog", desc: "Freezing fog" },
  51: { d: "drizzle", n: "drizzle", desc: "Light drizzle" },
  53: { d: "drizzle", n: "drizzle", desc: "Drizzle" },
  55: { d: "drizzle", n: "drizzle", desc: "Heavy drizzle" },
  56: { d: "sleet", n: "sleet", desc: "Freezing drizzle" },
  57: { d: "sleet", n: "sleet", desc: "Freezing drizzle" },
  61: { d: "rain", n: "rain", desc: "Light rain" },
  63: { d: "rain", n: "rain", desc: "Rain" },
  65: { d: "rain", n: "rain", desc: "Heavy rain" },
  66: { d: "sleet", n: "sleet", desc: "Freezing rain" },
  67: { d: "sleet", n: "sleet", desc: "Freezing rain" },
  71: { d: "snow", n: "snow", desc: "Light snow" },
  73: { d: "snow", n: "snow", desc: "Snow" },
  75: { d: "snow", n: "snow", desc: "Heavy snow" },
  77: { d: "snow", n: "snow", desc: "Snow grains" },
  80: { d: "partly-cloudy-day-rain", n: "partly-cloudy-night-rain", desc: "Light showers" },
  81: { d: "partly-cloudy-day-rain", n: "partly-cloudy-night-rain", desc: "Showers" },
  82: { d: "thunderstorms-rain", n: "thunderstorms-rain", desc: "Violent showers" },
  85: { d: "partly-cloudy-day-snow", n: "partly-cloudy-day-snow", desc: "Snow showers" },
  86: { d: "partly-cloudy-day-snow", n: "partly-cloudy-day-snow", desc: "Snow showers" },
  95: { d: "thunderstorms", n: "thunderstorms", desc: "Thunderstorm" },
  96: { d: "thunderstorms-rain", n: "thunderstorms-rain", desc: "Thunderstorm with hail" },
  99: { d: "thunderstorms-rain", n: "thunderstorms-rain", desc: "Thunderstorm with hail" },
};

function wmo(code, isDay = true) {
  const w = WMO[code] || { d: "thermometer", n: "thermometer", desc: "—" };
  return { icon: `icons/weather/${isDay ? w.d : w.n}.svg`, desc: w.desc };
}

/* ---------- Drying Index (0–100) ----------
   Weighted mix of the factors that drive evaporation:
   humidity 35%, solar radiation 25%, wind 20%, temperature 20%.
   Rain probability and actual precipitation gate the score down;
   night hours are heavily damped (no sun, dew risk). */
function dryingScore(h) {
  if (h.precip > 0.2 || h.precipProb >= 60) return Math.round(4 * (1 - h.precipProb / 100));

  const humidity = clamp01((100 - h.humidity) / 70);        // RH 30% → 1, RH 100% → 0
  const temp = clamp01((h.temp - 2) / 28);                  // 2°C → 0, 30°C → 1
  const wind = clamp01(h.wind / 24);                        // 24 km/h → 1
  const sun = clamp01(h.radiation / 550);                   // 550 W/m² → 1

  let score = 100 * (0.35 * humidity + 0.25 * sun + 0.2 * wind + 0.2 * temp);
  score *= Math.pow(1 - h.precipProb / 100, 1.3);           // rain-risk damping
  if (!h.isDay) score *= 0.35;                              // night: slow drying, dew
  return Math.round(clamp01(score / 100) * 100);
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const scoreClass = (s) => (s >= 65 ? "great" : s >= 45 ? "ok" : "bad");
const scoreVerdict = (s) =>
  s >= 80 ? "Perfect — hang it all out!" :
  s >= 65 ? "Great time to hang laundry" :
  s >= 45 ? "It'll dry, just slowly" :
  s >= 20 ? "Better to wait" :
  "Keep it on the indoor rack";

/* ---------- Time bands ----------
   Find contiguous runs of hours with score >= threshold,
   return the run with the highest average score. */
function findBands(hours, threshold) {
  const bands = [];
  let cur = null;
  for (const h of hours) {
    if (h.score >= threshold) {
      if (!cur) cur = { start: h.hour, end: h.hour, scores: [] };
      cur.end = h.hour;
      cur.scores.push(h.score);
    } else if (cur) {
      bands.push(cur);
      cur = null;
    }
  }
  if (cur) bands.push(cur);
  for (const b of bands) b.avg = b.scores.reduce((a, v) => a + v, 0) / b.scores.length;
  return bands.sort((a, b) => b.avg - a.avg);
}

function bestBandForDay(hours) {
  for (const threshold of [65, 45]) {
    const bands = findBands(hours, threshold);
    if (!bands.length) continue;
    const wide = bands.filter((b) => b.end - b.start >= 1);
    return { ...(wide[0] || bands[0]), quality: threshold === 65 ? "great" : "ok" };
  }
  return null;
}

const fmtBand = (b) => `${String(b.start).padStart(2, "0")}:00 – ${String(b.end + 1).padStart(2, "0")}:00`;

/* ---------- API ---------- */
async function fetchForecast(lat, lon) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,shortwave_radiation,is_day,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day,precipitation,precipitation_probability,shortwave_radiation",
    forecast_days: "7",
    timezone: "auto",
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service unavailable (" + res.status + ")");
  return res.json();
}

async function searchCity(name) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name, count: "6", language: "en", format: "json" });
  const res = await fetch(url);
  if (!res.ok) throw new Error("City search unavailable");
  const data = await res.json();
  return data.results || [];
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();
    return data.city || data.locality || "Your location";
  } catch {
    return "Your location";
  }
}

/* ---------- State views ---------- */
function show(view) {
  for (const v of [els.welcome, els.loading, els.error, els.dashboard]) v.hidden = true;
  view.hidden = false;
}

function showError(msg) {
  els.errorMsg.textContent = msg;
  show(els.error);
}

/* ---------- Load & render ---------- */
async function loadPlace(place) {
  lastPlace = place;
  show(els.loading);
  try {
    const data = await fetchForecast(place.lat, place.lon);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
    render(place, data);
    show(els.dashboard);
  } catch (err) {
    showError(err.message || "Something went wrong.");
  }
}

function parseHours(data) {
  const H = data.hourly;
  // Open-Meteo (timezone=auto) returns naive local times for the requested
  // place — read date/hour straight from the string, never through Date,
  // which would reinterpret them in the browser's own timezone.
  return H.time.map((t, i) => {
    const h = {
      time: t,
      date: t.slice(0, 10),
      hour: Number(t.slice(11, 13)),
      temp: H.temperature_2m[i],
      humidity: H.relative_humidity_2m[i],
      precipProb: H.precipitation_probability[i] ?? 0,
      precip: H.precipitation[i] ?? 0,
      wind: H.wind_speed_10m[i],
      radiation: H.shortwave_radiation[i] ?? 0,
      isDay: H.is_day[i] === 1,
      code: H.weather_code[i],
    };
    h.score = dryingScore(h);
    return h;
  });
}

/* Current date/hour in the selected place's timezone (IANA name from the API) */
function cityNowParts(tz) {
  const now = new Date();
  return {
    dateKey: now.toLocaleDateString("en-CA", { timeZone: tz }), // YYYY-MM-DD
    hour: Number(now.toLocaleString("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz })),
  };
}

let clockTimer = null;
function startClock(tz) {
  clearInterval(clockTimer);
  const tick = () => {
    const now = new Date();
    els.todayDate.textContent = now.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", timeZone: tz,
    });
    els.todayTime.textContent = now.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz,
    });
  };
  tick();
  clockTimer = setInterval(tick, 30000);
}

function render(place, data) {
  const hours = parseHours(data);
  const tz = data.timezone;
  const cityNow = cityNowParts(tz);
  const todayKey = data.daily.time[0];

  /* Hero */
  els.placeName.textContent = place.name;
  startClock(tz);

  const cur = data.current;
  const { icon, desc } = wmo(cur.weather_code, cur.is_day === 1);
  els.nowIcon.src = icon;
  els.nowTemp.textContent = Math.round(cur.temperature_2m) + "°";
  els.nowDesc.textContent = desc;
  els.nowHum.textContent = Math.round(cur.relative_humidity_2m) + "%";
  els.nowWind.textContent = Math.round(cur.wind_speed_10m) + " km/h";

  const nowScore = dryingScore({
    temp: cur.temperature_2m,
    humidity: cur.relative_humidity_2m,
    precipProb: cur.precipitation_probability ?? 0,
    precip: cur.precipitation ?? 0,
    wind: cur.wind_speed_10m,
    radiation: cur.shortwave_radiation ?? 0,
    isDay: cur.is_day === 1,
  });
  renderGauge(nowScore);

  /* Today hourly (from the city's current hour onward) */
  const todayHours = hours.filter((h) => h.date === cityNow.dateKey && h.hour >= cityNow.hour);
  const displayHours = todayHours.length >= 4 ? todayHours : hours.filter((h) => h.date === todayKey);

  els.hoursScroll.innerHTML = displayHours
    .map((h, i) => {
      const hw = wmo(h.code, h.isDay);
      const isNow = h.date === cityNow.dateKey && h.hour === cityNow.hour;
      return `<div class="hour-card${isNow ? " is-now" : ""}" style="animation-delay:${Math.min(i * 30, 400)}ms">
        <span class="h-time">${isNow ? "Now" : String(h.hour).padStart(2, "0") + ":00"}</span>
        <img class="h-icon" src="${hw.icon}" alt="${hw.desc}" />
        <span class="h-temp">${Math.round(h.temp)}°</span>
        <span class="h-score ${scoreClass(h.score)}">${h.score}</span>
      </div>`;
    })
    .join("");

  /* Best band today */
  const bestToday = bestBandForDay(todayHours.length ? todayHours : hours.filter((h) => h.date === todayKey));
  els.bestBanner.hidden = false;
  if (bestToday) {
    els.bestLabel.textContent = bestToday.quality === "great" ? "Today's best window" : "Possible window (not ideal)";
    els.bestTime.textContent = fmtBand(bestToday) + " · index " + Math.round(bestToday.avg);
  } else {
    els.bestLabel.textContent = "Today";
    els.bestTime.textContent = "No luck today — laundry postponed";
  }

  /* Week */
  const D = data.daily;
  els.week.innerHTML = D.time
    .map((dayKey, i) => {
      if (i === 0) return "";
      const d = new Date(dayKey + "T12:00");
      const dw = wmo(D.weather_code[i], true);
      const dayHours = hours.filter((h) => h.date === dayKey);
      const band = bestBandForDay(dayHours);
      const chip = band
        ? `<span class="band-chip ${band.quality}">${fmtBand(band)}</span>`
        : `<span class="band-chip bad">Not recommended</span>`;
      const dayName = i === 1 ? "Tomorrow" : d.toLocaleDateString("en-GB", { weekday: "long" });
      const daySub = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `<div class="day-row">
        <span class="day-name">${dayName}<small>${daySub}</small></span>
        <img class="day-icon" src="${dw.icon}" alt="${dw.desc}" />
        <span class="day-temps"><span class="t-min">${Math.round(D.temperature_2m_min[i])}°</span><strong>${Math.round(D.temperature_2m_max[i])}°</strong></span>
        <span class="day-band">${chip}</span>
      </div>`;
    })
    .join("");
}

function renderGauge(score) {
  const C = 2 * Math.PI * 52;
  els.gaugeFill.style.strokeDashoffset = C * (1 - score / 100);
  els.gaugeFill.style.stroke =
    score >= 65 ? "var(--great)" : score >= 45 ? "var(--ok)" : "var(--bad)";
  els.gaugeValue.textContent = score;
  els.gaugeVerdict.textContent = scoreVerdict(score);
}

/* ---------- Geolocation ---------- */
function useGPS() {
  if (!navigator.geolocation) {
    showError("Your browser doesn't support geolocation. Search for your city instead.");
    return;
  }
  show(els.loading);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const name = await reverseGeocode(lat, lon);
      loadPlace({ name, lat, lon });
    },
    () => {
      showError("Couldn't get your location. Check permissions or search for your city.");
    },
    { timeout: 10000, maximumAge: 300000 }
  );
}

/* ---------- Search ---------- */
let searchTimer = null;

els.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const q = els.searchInput.value.trim();
  if (q.length < 2) {
    els.searchResults.hidden = true;
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const results = await searchCity(q);
      if (!results.length) {
        els.searchResults.hidden = true;
        return;
      }
      els.searchResults.innerHTML = results
        .map(
          (r, i) =>
            `<li><button type="button" data-i="${i}">${r.name}<small>${[r.admin1, r.country].filter(Boolean).join(", ")}</small></button></li>`
        )
        .join("");
      els.searchResults.hidden = false;
      els.searchResults.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const r = results[Number(btn.dataset.i)];
          els.searchResults.hidden = true;
          els.searchInput.value = "";
          loadPlace({ name: r.name, lat: r.latitude, lon: r.longitude });
        });
      });
    } catch {
      els.searchResults.hidden = true;
    }
  }, 300);
});

els.searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = els.searchInput.value.trim();
  if (q.length < 2) return;
  const results = await searchCity(q).catch(() => []);
  if (results.length) {
    els.searchResults.hidden = true;
    els.searchInput.value = "";
    loadPlace({ name: results[0].name, lat: results[0].latitude, lon: results[0].longitude });
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) els.searchResults.hidden = true;
});

els.gpsBtn.addEventListener("click", useGPS);
els.welcomeGps.addEventListener("click", useGPS);
els.retryBtn.addEventListener("click", () => {
  if (lastPlace) loadPlace(lastPlace);
  else show(els.welcome);
});

/* ---------- Boot ---------- */
(function boot() {
  try {
    const saved =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
      JSON.parse(localStorage.getItem("stendino:lastPlace")); // pre-rename key
    if (saved && saved.lat != null) {
      loadPlace(saved);
      return;
    }
  } catch { /* ignore */ }
  show(els.welcome);
})();

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
