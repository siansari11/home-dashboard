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

    <section class="card weatherStrip">
      <div id="weather">Loading…</div>
    </section>

    <div class="grid grid--2x2">
      <section class="card">
        <h2>Next events</h2>
        <div id="agenda">Loading…</div>
      </section>

      <section class="card">
        <h2>Tasks</h2>
        <div id="tasks">Loading…</div>
      </section>

      <section class="card">
        <h2>Lifestyle</h2>
        <div id="feed">Loading…</div>
      </section>

      <section class="card">
        <h2>Food</h2>
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
