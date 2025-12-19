// src/lib/weather.js
import { CONFIG } from "../config.js";

export async function renderWeather(el){
  const { lat, lon, name } = CONFIG.location;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "precipitation_probability",
    forecast_days: "1",
    timezone: "auto"
  });

  const res = await fetch(url);
  const data = await res.json();

  const temp = Math.round(data?.current?.temperature_2m ?? 0);
  const wind = Math.round(data?.current?.wind_speed_10m ?? 0);
  const code = Number(data?.current?.weather_code ?? 0);

  const rain = nearestHourlyValue(
    data?.hourly?.time || [],
    data?.hourly?.precipitation_probability || []
  );

  const iconSrc = iconForWeatherCode(code);

  el.innerHTML = `
    <div class="weatherStrip">
      <div class="weatherRow">
        <img class="weatherIcon" alt="" src="${escapeAttr(iconSrc)}" />

        <div class="weatherMain">
          <div class="weatherTemp">${temp}°</div>
          <div class="weatherMeta">Wind ${wind} km/h • Rain chance ${rain ?? "—"}%</div>
        </div>

        <div class="weatherLoc">📍 ${escapeHtml(name)}</div>
      </div>
    </div>
  `;
}

function nearestHourlyValue(times, values){
  try{
    if (!times?.length || !values?.length) return null;
    const now = Date.now();
    let bestIdx = 0;
    let best = Infinity;
    for (let i = 0; i < times.length; i++){
      const t = new Date(times[i]).getTime();
      const d = Math.abs(t - now);
      if (d < best){ best = d; bestIdx = i; }
    }
    const v = values[bestIdx];
    return (v === null || v === undefined) ? null : Math.round(Number(v));
  } catch {
    return null;
  }
}

/**
 * Open-Meteo weather_code mapping (simple buckets)
 * We'll use your existing local icon files in /public/icons/…
 * If you named them differently, just rename the filenames here.
 */
function iconForWeatherCode(code){
  // ✅ Put your icon files here (in /public/icons/)
  const base = "/home-dashboard/icons/";

  // Thunderstorm
  if (code >= 95) return base + "storm.png";

  // Snow
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86)
    return base + "snow.png";

  // Rain / showers / freezing rain
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57 ||
      code === 61 || code === 63 || code === 65 || code === 66 || code === 67 ||
      code === 80 || code === 81 || code === 82)
    return base + "rain.png";

  // Fog
  if (code === 45 || code === 48) return base + "fog.png";

  // Cloudy
  if (code === 2 || code === 3) return base + "cloudy.png";

  // Partly cloudy
  if (code === 1) return base + "partly.png";

  // Clear
  return base + "sun.png";
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function escapeAttr(s){ return escapeHtml(String(s || "")).replace(/"/g, "&quot;"); }
