// src/components/weather.js
import "../styles/weather.css";
import { CONFIG } from "../config.js";

function buildOsmStaticMapUrl(lat, lon){
  // Free static map provider (no key). If it ever rate-limits, we can swap providers later.
  var center = String(lat) + "," + String(lon);
  var params = new URLSearchParams({
    center: center,
    zoom: "11",
    size: "140x90",
    markers: center + ",red-pushpin"
  });
  return "https://staticmap.openstreetmap.de/staticmap.php?" + params.toString();
}

export async function renderWeather(el){
  var loc = (CONFIG && CONFIG.location) ? CONFIG.location : {};
  var lat = loc.lat;
  var lon = loc.lon;
  var name = loc.name || "";

  var url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,wind_speed_10m",
    hourly: "precipitation_probability",
    forecast_days: "1"
  });

  // Build UI shell first (so you always see something)
  el.innerHTML = "";

  var wrap = document.createElement("div");
  wrap.className = "weatherRow";

  var left = document.createElement("div");
  left.className = "weatherLeft";

  var tempEl = document.createElement("div");
  tempEl.className = "weatherTemp";
  tempEl.textContent = "—°";

  var metaEl = document.createElement("div");
  metaEl.className = "weatherMeta";
  metaEl.textContent = "Loading…";

  left.append(tempEl, metaEl);

  var right = document.createElement("div");
  right.className = "weatherRight";

  var pill = document.createElement("div");
  pill.className = "weatherLocPill";
  pill.textContent = "📍 " + name;

  // Tiny map (only if lat/lon exist)
  var mapWrap = document.createElement("div");
  mapWrap.className = "weatherMapWrap";

  var mapImg = document.createElement("img");
  mapImg.className = "weatherMapImg";
  mapImg.alt = "Map";
  mapImg.loading = "lazy";
  mapImg.decoding = "async";

  if (typeof lat === "number" && typeof lon === "number") {
    mapImg.src = buildOsmStaticMapUrl(lat, lon);
    mapWrap.appendChild(mapImg);
  } else {
    mapWrap.classList.add("weatherMapWrap--hidden");
  }

  right.append(pill, mapWrap);

  wrap.append(left, right);
  el.appendChild(wrap);

  // Fetch weather
  try {
    var res = await fetch(url);
    var data = await res.json();

    var temp = Math.round(data.current.temperature_2m);
    var wind = Math.round(data.current.wind_speed_10m);
    var rain = data.hourly?.precipitation_probability?.[0];

    tempEl.textContent = temp + "°";
    metaEl.textContent =
      "Wind " + wind + " km/h • Rain chance " + ((rain === 0 || rain) ? rain : "—") + "%";
  } catch (e) {
    metaEl.textContent = "Weather failed to load";
  }
}
