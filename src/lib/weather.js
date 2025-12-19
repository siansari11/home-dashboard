// src/lib/weather.js
import { CONFIG } from "../config.js";
import { pickWeatherIcon } from "./weatherIcons.js";

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

  // choose nearest hour precip prob
  const rain = nearestHourlyValue(
    data?.hourly?.time || [],
    data?.hourly?.precipitation_probability || []
  );

  const icon = pickWeatherIcon(code);

  el.innerHTML = `
    <div class="weatherStrip">
      <div class="weatherRow">
        <div class="weatherIconWrap">
          <img class="weatherIcon" alt="" src="${escapeAttr(icon)}" />
        </div>

        <div class="weatherMain">
          <div class="weatherTemp">${temp}°</div>
          <div class="weatherMeta">
            Wind ${wind} km/h • Rain chance ${rain ?? "—"}%
          </div>
        </div>

        <div class="weatherLoc">
          📍 ${escapeHtml(name)}
        </div>
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
      if (d < best){
        best = d;
        bestIdx = i;
      }
    }
    const v = values[bestIdx];
    return (v === null || v === undefined) ? null : Math.round(Number(v));
  } catch {
    return null;
  }
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}
