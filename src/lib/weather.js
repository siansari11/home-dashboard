import { CONFIG } from '../config.js';

export async function renderWeather(el){
  const { lat, lon, name } = CONFIG.location;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,wind_speed_10m",
    hourly: "precipitation_probability",
    forecast_days: "1"
  });

  const res = await fetch(url);
  const data = await res.json();

  const temp = Math.round(data.current.temperature_2m);
  const wind = Math.round(data.current.wind_speed_10m);
  const rain = data.hourly?.precipitation_probability?.[0];

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
      <div>
        <div style="font-size:42px; font-weight:800">${temp}°</div>
        <div style="color:var(--muted); font-size:13px">Wind ${wind} km/h • Rain chance ${rain ?? "—"}%</div>
      </div>
      <div style="padding:8px 10px; border-radius:999px; border:1px solid rgba(120,214,182,0.25); background:rgba(120,214,182,0.10)">
        📍 ${name}
      </div>
    </div>
  `;
}
