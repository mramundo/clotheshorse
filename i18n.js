/* ============ Clotheshorse — i18n ============
   Browser language starting with "it" (it, it-IT, it-CH, …) → Italian,
   anything else → English. The app name stays "Clotheshorse" everywhere. */
"use strict";

const LOCALE = (() => {
  const forced = new URLSearchParams(location.search).get("lang");
  if (forced === "it" || forced === "en") return forced;
  const lang = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  return lang.toLowerCase().startsWith("it") ? "it" : "en";
})();

const DATE_LOCALE = LOCALE === "it" ? "it-IT" : "en-GB";

const STR = {
  en: {
    title: "Clotheshorse — Laundry weather",
    metaDesc: "Clotheshorse tells you the best time windows to hang your laundry outside, based on the weather.",
    brandTag: "laundry weather",
    searchPlaceholder: "Search city…",
    searchAria: "Search city",
    gpsTitle: "Use my location",
    welcomeTitle: 'Clothes on the line,<br /><span>not on your mind.</span>',
    welcomeText: "Search your city or use GPS — Clotheshorse reads the forecast and tells you when to hang your laundry so it dries fastest.",
    welcomeGps: "Use my location",
    loading: "Checking the sky for you…",
    tryAgain: "Try again",
    humidity: "Humidity",
    wind: "Wind",
    gaugeLabel: "Drying<br/>Index",
    gaugeAria: "Current Drying Index",
    bestWindow: "Today's best window",
    possibleWindow: "Possible window (not ideal)",
    today: "Today",
    noLuck: "No luck today — laundry postponed",
    index: "index",
    hourByHour: "Today, hour by hour",
    hourlyAria: "Today's hourly forecast",
    legendGreat: "Great for drying",
    legendOk: "Fair",
    legendBad: "Not recommended",
    nextDays: "Next days",
    now: "Now",
    tomorrow: "Tomorrow",
    notRecommended: "Not recommended",
    footerBlurb: "The weather forecast, translated into one simple answer: when to hang your laundry so it dries fastest.",
    sitemap: "Sitemap",
    footForecast: "Forecast",
    footFaq: "FAQ — how to read",
    footCopy: '© 2026 Clotheshorse · Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>',
    footJoke: "No liability for soggy socks.",
    verdict80: "Perfect — hang it all out!",
    verdict65: "Great time to hang laundry",
    verdict45: "It'll dry, just slowly",
    verdict20: "Better to wait",
    verdict0: "Keep it on the indoor rack",
    yourLocation: "Your location",
    errSvc: "Weather service unavailable",
    errSearch: "City search unavailable",
    errGeoUnsupported: "Your browser doesn't support geolocation. Search for your city instead.",
    errGeoFailed: "Couldn't get your location. Check permissions or search for your city.",
    errGeneric: "Something went wrong.",
    wmo: {
      0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Freezing fog",
      51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
      56: "Freezing drizzle", 57: "Freezing drizzle",
      61: "Light rain", 63: "Rain", 65: "Heavy rain",
      66: "Freezing rain", 67: "Freezing rain",
      71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
      80: "Light showers", 81: "Showers", 82: "Violent showers",
      85: "Snow showers", 86: "Snow showers",
      95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
    },
  },

  it: {
    title: "Clotheshorse — Il meteo del bucato",
    metaDesc: "Clotheshorse ti dice le fasce orarie migliori per stendere i panni all'aria aperta, in base al meteo.",
    brandTag: "il meteo del bucato",
    searchPlaceholder: "Cerca città…",
    searchAria: "Cerca città",
    gpsTitle: "Usa la mia posizione",
    welcomeTitle: 'Panni stesi,<br /><span>zero pensieri.</span>',
    welcomeText: "Cerca la tua città o usa il GPS: Clotheshorse legge le previsioni e ti dice quando stendere i panni per farli asciugare prima.",
    welcomeGps: "Usa la mia posizione",
    loading: "Controllo il cielo per te…",
    tryAgain: "Riprova",
    humidity: "Umidità",
    wind: "Vento",
    gaugeLabel: "Indice di<br/>asciugatura",
    gaugeAria: "Indice di asciugatura attuale",
    bestWindow: "Fascia migliore di oggi",
    possibleWindow: "Fascia possibile (non ideale)",
    today: "Oggi",
    noLuck: "Oggi niente da fare — bucato rimandato",
    index: "indice",
    hourByHour: "Oggi, ora per ora",
    hourlyAria: "Previsioni orarie di oggi",
    legendGreat: "Ottima per stendere",
    legendOk: "Discreta",
    legendBad: "Sconsigliata",
    nextDays: "Prossimi giorni",
    now: "Ora",
    tomorrow: "Domani",
    notRecommended: "Sconsigliato",
    footerBlurb: "Le previsioni meteo tradotte in una risposta semplice: quando stendere i panni per farli asciugare prima.",
    sitemap: "Mappa del sito",
    footForecast: "Previsioni",
    footFaq: "FAQ — come leggere l'app",
    footCopy: '© 2026 Clotheshorse · Dati meteo di <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>',
    footJoke: "Nessuna responsabilità per calzini bagnati.",
    verdict80: "Perfetto, stendi tutto!",
    verdict65: "Ottimo momento per stendere",
    verdict45: "Si asciuga, ma con calma",
    verdict20: "Meglio aspettare",
    verdict0: "Tieni lo stendino in casa",
    yourLocation: "La tua posizione",
    errSvc: "Servizio meteo non disponibile",
    errSearch: "Ricerca città non disponibile",
    errGeoUnsupported: "Il tuo browser non supporta la geolocalizzazione. Cerca la città manualmente.",
    errGeoFailed: "Non riesco a ottenere la posizione. Controlla i permessi o cerca la città.",
    errGeneric: "Qualcosa è andato storto.",
    wmo: {
      0: "Sereno", 1: "Quasi sereno", 2: "Parzialmente nuvoloso", 3: "Coperto",
      45: "Nebbia", 48: "Nebbia ghiacciata",
      51: "Pioggerella leggera", 53: "Pioggerella", 55: "Pioggerella intensa",
      56: "Pioggerella gelata", 57: "Pioggerella gelata",
      61: "Pioggia leggera", 63: "Pioggia", 65: "Pioggia forte",
      66: "Pioggia gelata", 67: "Pioggia gelata",
      71: "Neve leggera", 73: "Neve", 75: "Neve forte", 77: "Nevischio",
      80: "Rovesci leggeri", 81: "Rovesci", 82: "Rovesci violenti",
      85: "Rovesci di neve", 86: "Rovesci di neve",
      95: "Temporale", 96: "Temporale con grandine", 99: "Temporale con grandine",
    },
  },
};

function t(key) {
  return STR[LOCALE][key] ?? STR.en[key] ?? key;
}

function tWmo(code) {
  return STR[LOCALE].wmo[code] ?? STR.en.wmo[code] ?? "—";
}

/* Apply translations to static markup:
   data-i18n → textContent, data-i18n-html → innerHTML,
   data-i18n-placeholder / -title / -aria-label → attributes. */
function applyI18n() {
  document.documentElement.lang = LOCALE;
  document.title = t("title");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = t("metaDesc");

  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) =>
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel))
  );
  document.querySelectorAll("a[data-faq-link]").forEach((a) => {
    a.href = LOCALE === "it" ? "faq.it.html" : "faq.html";
  });
}

applyI18n();
