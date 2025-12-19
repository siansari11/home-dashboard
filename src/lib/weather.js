// src/components/weather.js
import "../styles/weather.css";
import { CONFIG } from "../config.js";

function pickIconForWeatherCode(code){
  var c = Number(code);

  if (c === 0) return { file: "/weather/clear.png", fallback: "☀️" };
  if (c === 1 || c === 2) return { file: "/weather/partly.png", fallback: "⛅" };
  if (c === 3) return { file: "/weather/cloudy.png", fallback: "☁️" };

  if (c === 45 || c === 48) return { file: "/weather/fog.png", fallback: "🌫️" };

  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c))
    return { file: "/weather/rain.png", fallback: "🌧️" };

  if ([71,73,75,77,85,86].includes(c))
    return { file: "/weather/snow.png", fallback: "❄️" };

  if ([95,96,99].includes(c))
    return { file: "/weather/storm.png", fallback: "⛈️" };

  return { file: "/weather/cloudy.png", fallback: "🌤️" };
}

export async function renderWeather(el){
  var loc = CONFIG.location || {};
  var lat = loc.lat;
  var lon = loc.lon;
  var name = loc.name || "";

  var url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "precipitation_probability",
    forecast_days: "1"
  });

  el.innerHTML = "";

  // Layout
  var wrap = document.createElement("div");
  wrap.className = "weatherRow";

  var left = document.createElement("div");
  left.className = "weatherLeft";

  var top = document.createElement("div");
  top.className = "weatherTopLine";

  // Icon
  var iconBox = document.createElement("div");
  iconBox.className = "weatherIconBox";

  var iconImg = document.createElement("img");
  iconImg.className = "weatherIconImg";
  iconImg.alt = "Weather";

  var iconFallback = document.createElement("div");
  iconFallback.className = "weatherIconFallback";
  iconFallback.textContent = "—";

  iconBox.append(iconImg, iconFallback);

  // Temperature
  var tempEl = document.createElement("div");
  tempEl.className = "weatherTemp";
  tempEl.textContent = "—°";

  top.append(iconBox, tempEl);

  // Meta
  var metaEl = document.createElement("div");
  metaEl.className = "weatherMeta";
  metaEl.textContent = "Loading…";

  left.append(top, metaEl);

  // Location pill
  var right = document.createElement("div");
  right.className = "weatherRight";

  var pill = document.createElement("div");
  pill.className = "weatherLocPill";
  pill.textContent = "📍 " + name;

  right.append(pill);

  wrap.append(left, right);
  el.append(wrap);

  // Fetch weather
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

    iconImg.src = icon.file;

    iconImg.onload = function(){
      iconImg.style.display = "block";
      iconFallback.style.display = "none";
    };

    iconImg.onerror = function(){
      iconImg.style.display = "none";
      iconFallback.style.display = "flex";
      iconFallback.textContent = icon.fallback;
    };
  } catch (e) {
    metaEl.textContent = "Weather failed to load";
  }
}
