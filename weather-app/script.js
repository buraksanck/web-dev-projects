const API_KEY = "b66459ed0140427c9ea150841250908";

const $ = (s) => document.querySelector(s);
const app = $("#app");
const form = $("#searchForm");
const cityInput = $("#cityInput");
const unitToggle = $("#unitToggle");
const geoBtn = $("#geoBtn");
const err = $("#errorMsg");
const loading = $("#loading");

const todayWrap = $("#todayWrap");
const todayWeekday = $("#todayWeekday");
const todayDate = $("#todayDate");
const todayLoc = $("#todayLoc");
const todayIconEl = $("#todayIcon");
const todayTempEl = $("#todayTemp");
const todayCondEl = $("#todayCond");

const precipEl = $("#precip");
const humidityEl = $("#humidity");
const windEl = $("#wind");
const windDirEl = $("#windDir");
const feelsEl = $("#feels");
const visibilityEl = $("#visibility");
const pressureEl = $("#pressure");
const sunriseEl = $("#sunrise");
const sunsetEl = $("#sunset");
const uvEl = $("#uv");

const daysWrap = $("#daysWrap");
const daysGrid = $("#daysGrid");

let unitIsMetric = true;

const setLoading = (v) => loading.classList.toggle("hidden", !v);
const setError = (msg) => {
  if (!msg) return err.classList.add("hidden");
  err.textContent = msg;
  err.classList.remove("hidden");
};
const fmtDate = (isoOrDate) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long" });
};
const fmtDateShort = (isoStr) =>
  new Date(isoStr).toLocaleDateString("tr-TR", { weekday: "short" });
const fmtDateTime = (isoLike) => {
  const d = new Date(isoLike.replace(" ", "T"));
  return d.toLocaleString("tr-TR", { hour12: false });
};

function gradientFor(conditionText = "", isDay = 1) {
  const t = conditionText.toLowerCase();
  if (t.includes("thunder")) return ["#6366f1", "#1e1b4b"];
  if (t.includes("snow") || t.includes("karl")) return ["#e0f2fe", "#60a5fa"];
  if (t.includes("rain") || t.includes("yağmur")) return ["#60a5fa", "#0f172a"];
  if (t.includes("drizzle") || t.includes("çise")) return ["#7dd3fc", "#1e293b"];
  if (t.includes("fog") || t.includes("mist") || t.includes("haze") || t.includes("sis")) return ["#94a3b8", "#475569"];
  if (t.includes("overcast") || t.includes("bulut")) return ["#64748b", "#334155"];
  if (t.includes("clear") || t.includes("açık")) return isDay ? ["#fbbf24", "#f97316"] : ["#1f2937", "#0b1020"];
  return ["#0284c7", "#0f172a"];
}
function setAppGradient(conditionText, isDay) {
  const [from, to] = gradientFor(conditionText, isDay);
  app.style.background = `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

async function fetchForecast(q) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(
    q
  )}&days=6&aqi=no&alerts=no&lang=tr`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text);
      if (j?.error?.code === 1006) throw new Error("Yazdığınız isimde şehir bulunamadı.");
      if (j?.error?.message) throw new Error(j.error.message);
    } catch {}
    throw new Error(`Veri alınamadı (HTTP ${res.status})`);
  }
  return JSON.parse(text);
}

function fadeOut() {
  [todayTempEl, todayCondEl, daysGrid].forEach((el) => {
    el.classList.add("transition-opacity", "duration-500", "opacity-0");
  });
}
function fadeIn() {
  [todayTempEl, todayCondEl, daysGrid].forEach((el) => {
    el.classList.remove("opacity-0");
    el.classList.add("opacity-100");
  });
}

function renderToday(data) {
  const loc = data.location;
  const cur = data.current;
  const astro = data.forecast?.forecastday?.[0]?.astro;

  const date = new Date(loc.localtime.replace(" ", "T"));
  todayWeekday.textContent = date.toLocaleDateString("tr-TR", { weekday: "long" });
  todayDate.textContent = date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  todayLoc.textContent = `${loc.name}, ${loc.country}`;

  todayIconEl.src = "https:" + cur.condition.icon;
  todayIconEl.alt = cur.condition.text;

  const temp = unitIsMetric ? Math.round(cur.temp_c) + "°" : Math.round(cur.temp_f) + "°";
  todayTempEl.textContent = temp;
  todayCondEl.textContent = cur.condition.text || "—";

  const feels = unitIsMetric ? Math.round(cur.feelslike_c) + "°C" : Math.round(cur.feelslike_f) + "°F";
  const wind = unitIsMetric ? Math.round(cur.wind_kph) + " km/h" : Math.round(cur.wind_mph) + " mph";
  const vis = unitIsMetric ? (cur.vis_km ?? 0) + " km" : (cur.vis_miles ?? 0) + " mil";

  precipEl.textContent = `${cur.precip_mm ?? 0} mm`;
  humidityEl.textContent = `${cur.humidity}%`;
  windEl.textContent = wind;
  windDirEl.textContent = cur.wind_dir ? `Direction: ${cur.wind_dir} (${cur.wind_degree}°)` : "—";
  feelsEl.textContent = feels;
  visibilityEl.textContent = vis;
  pressureEl.textContent = `${cur.pressure_mb ?? "—"} hPa`;
  sunriseEl.textContent = astro?.sunrise || "—";
  sunsetEl.textContent = astro?.sunset || "—";
  uvEl.textContent = cur.uv ?? "—";

  setAppGradient(cur.condition.text, cur.is_day);
  todayWrap.classList.remove("hidden");
}

function renderNext5(data) {
  const list = data.forecast?.forecastday || [];
  const upcoming = list.slice(1, 6);
  if (!upcoming.length) {
    daysWrap.classList.add("hidden");
    return;
  }

  daysGrid.innerHTML = upcoming
    .map((d) => {
      const max = unitIsMetric ? Math.round(d.day.maxtemp_c) + "°" : Math.round(d.day.maxtemp_f) + "°";
      const min = unitIsMetric ? Math.round(d.day.mintemp_c) + "°" : Math.round(d.day.mintemp_f) + "°";
      const icon = "https:" + d.day.condition.icon;
      const desc = d.day.condition.text;
      return `
        <div class="border border-white/15 p-3 flex flex-col items-center text-center transition-opacity duration-500">
          <p class="text-sm text-white/70">${fmtDate(d.date)}</p>
          <img src="${icon}" alt="${desc}" class="h-12 w-12 my-2" />
          <p class="font-medium">${desc}</p>
          <p class="mt-1 text-sm"><span class="font-semibold">${max}</span> / ${min}</p>
        </div>
      `;
    })
    .join("");

  daysWrap.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = cityInput.value.trim();
  if (!q) return;
  setError("");
  setLoading(true);
  fadeOut();
  try {
    const data = await fetchForecast(q);
    renderToday(data);
    renderNext5(data);
    fadeIn();
  } catch (error) {
    setError(error.message || "Bir hata oluştu.");
    todayWrap.classList.add("hidden");
    daysWrap.classList.add("hidden");
  } finally {
    setLoading(false);
  }
});

unitToggle.addEventListener("change", () => {
  unitIsMetric = !unitIsMetric;
  form.requestSubmit();
});

geoBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) return setError("Tarayıcınız konum bilgisini desteklemiyor.");
  setError("");
  setLoading(true);
  fadeOut();
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const q = `${coords.latitude},${coords.longitude}`;
        const data = await fetchForecast(q);
        renderToday(data);
        renderNext5(data);
        fadeIn();
      } catch (error) {
        setError(error.message || "Konumla ararken hata oluştu.");
        todayWrap.classList.add("hidden");
        daysWrap.classList.add("hidden");
      } finally {
        setLoading(false);
      }
    },
    (err) => {
      setLoading(false);
      if (err.code === err.PERMISSION_DENIED) return setError("Konum izni reddedildi.");
      setError("Konum alınamadı.");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

document.addEventListener("DOMContentLoaded", () => {
  cityInput.value = "İstanbul";
  form.requestSubmit();
});
