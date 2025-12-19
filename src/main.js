// src/main.js
import "./styles.css";

import { renderHeader } from "./components/header.js";
import { renderWeather } from "./components/weather.js";
import { renderFeed } from "./components/feed.js";
import { renderAgenda } from "./components/agenda.js";
import { renderTasks } from "./components/tasks.js";
import { renderReels } from "./components/reels.js";

document.querySelector("#app").innerHTML = `
  <div class="wrap">
    <header id="header"></header>

    <div class="grid grid--4">
      <!-- COL 1: Weather + Events -->
      <section class="card strong">
        <h2>Weather</h2>
        <div id="weather">Loading…</div>

        <div class="spacer12"></div>

        <h2>Next events</h2>
        <div id="agenda">Loading…</div>
      </section>

      <!-- COL 2: Tasks -->
      <section class="card">
        <h2>Tasks</h2>
        <div id="tasks">Loading…</div>
      </section>

      <!-- COL 3: Feed -->
      <section class="card">
        <h2>Feed</h2>
        <div id="feed">Loading…</div>
      </section>

      <!-- COL 4: Reels -->
      <section class="card">
        <h2>Reels</h2>
        <div id="reels">Loading…</div>
      </section>
    </div>
  </div>
`;

renderHeader(document.querySelector("#header"));
renderWeather(document.querySelector("#weather"));
renderAgenda(document.querySelector("#agenda"));
renderTasks(document.querySelector("#tasks"));
renderFeed(document.querySelector("#feed"));
renderReels(document.querySelector("#reels"));
