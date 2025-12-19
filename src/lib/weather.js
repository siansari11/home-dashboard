// src/components/weather.js
import "../styles/weather.css";
import { CONFIG } from "../config.js";

function buildOsmStaticMapUrl(lat, lon){
  var center = String(lat) + "," + String(lon);
  var params = new URLSearchParams({
    center: center,
    zoom: "11",
    size: "140x90",
    markers: center + ",red-pushpin"
  });
  return "https://staticmap.openstreetmap.de/staticmap.php?" + params.toString();
}

function pickIconForWeatherCode(code){
  // Open-Meteo weather codes (WMO)
  // https://open-meteo.com/en/docs (weather_code)
  var c = Number(code);

  if (c === 0) return { file: "/weather/clear.gif", fallback: "☀️" };
  if (c === 1 || c === 2) return { file: "/weather/partly.gif", fallback: "⛅" };
  if (c === 3) return { file: "/weather/cloudy.gif", fallback: "☁️" };

  if (c === 45 || c === 48) return { file: "/weather/fog.gif", fallback: "🌫️" };

  if (c === 51 || c === 53 || c === 55) return { file: "/weather/rain.gif", fallback: "🌦️" };
  if (c === 56 || c === 57) return { file: "/weather/rain.gif", fallback: "🌧️" };

  if (c === 61 || c === 63 || c === 65) return { file: "/weather/rain.gif", fallback: "🌧️" };
  if (c === 66 || c === 67) return { file: "/weather/rain.gif", fallback: "🌧️" };

  if (c === 71 || c === 73 || c === 75) return { file: "/weather/snow.gif", fallback: "❄️" };
  if (c === 77) return { file: "/weather/snow.gif", fallback: "❄️" };
  if (c === 80 || c === 81 || c === 82) return { file: "/weather/rain.gif", fallback: "🌧️" };

  if (c === 85 || c === 86) return { file: "/weather/snow.gif", fallback: "❄️" };

  if (c === 95 || c === 96 || c === 99) return { file: "/weather/storm.gif", fallback: "⛈️" };

  return { file: "/weather/cloudy.gif", fallback: "🌤️" };
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
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "precipitation_probability,weather_code",
    forecast_days: "1"
  });

  el.innerHTML = "";

  var wrap = document.createElement("div");
  wrap.className = "weatherRow";

  // LEFT: icon + temp/meta
  var left = document.createElement("div");
  left.className = "weatherLeft";

  var topLine = document.createElement("div");
  topLine.className = "weatherTopLine";

  var iconBox = document.createElement("div");
  iconBox.className = "weatherIconBox";

  var iconImg = document.createElement("img");
  iconImg.className = "weatherIconImg";
  iconImg.alt = "Weather";
  iconImg.decoding = "async";
  iconImg.loading = "lazy";

  var iconFallback = document.createElement("div");
  iconFallback.className = "weatherIconFallback";
  iconFallback.textContent = "—";

  iconBox.append(iconImg, iconFallback);

  var tempEl = document.createElement("div");
  tempEl.className = "weatherTemp";
  tempEl.textContent = "—°";

  topLine.append(iconBox, tempEl);

  var metaEl = document.createElement("div");
  metaEl.className = "weatherMeta";
  metaEl.textContent = "Loading…";

  left.append(topLine, metaEl);

  // RIGHT: location pill + map
  var right = document.createElement("div");
  right.className = "weatherRight";

  var pill = document.createElement("div");
  pill.className = "weatherLocPill";
  pill.textContent = "📍 " + name;

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

  // Fetch + fill
  try {
    var res = await fetch(url);
    var data = await res.json();

    var temp = Math.round(data.current.temperature_2m);
    var wind = Math.round(data.current.wind_speed_10m);
    var rain = data.hourly?.precipitation_probability?.[0];
    var code = data.current?.weather_code;

    tempEl.textContent = temp + "°";
    metaEl.textContent =
      "Wind " + wind + " km/h • Rain chance " + ((rain === 0 || rain) ? rain : "—") + "%";

    var icon = pickIconForWeatherCode(code);

    // Try local gif/webp; if it fails, show emoji fallback
    iconImg.src = icon.file;
    iconImg.onload = function(){
      iconImg.style.display = "block";
      iconFallback.style.display = "none";
    };
    iconImg.onerror = function(){
      iconImg.style.display = "none";
      iconFallback.style.display = "flex";
      iconFallback.textContent = icon.fallback || "🌤️";
    };
  } catch (e) {
    metaEl.textContent = "Weather failed to load";
  }
}
