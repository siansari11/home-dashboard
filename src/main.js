// src/main.js
import "./styles.css";

import { renderHeader } from "./components/header.js";
import { renderWeather } from "./lib/weather.js";
import { renderAgenda } from "./components/agenda.js";
import { renderTasks } from "./components/tasks.js";
import { renderFeed } from "./components/feed.js";     // Lifestyle
import { renderReels } from "./components/reels.js";   // Food
import { renderProcesses } from "./components/processes.js";
import { mountHelp } from "./components/help.js";

document.querySelector("#app").innerHTML = `
  <div class="wrap">
    <header id="header"></header>

    <!-- Weather sits above the 2x2 grid, full width -->
    <section class="card strong weatherCard">
      <h2>Weather</h2>
      <div id="weather">Loading…</div>
    </section>

    <section class="card processesCard">
      <h2>Processes</h2>
      <div id="processes">Loading…</div>
    </section>

    <!-- ONE grid = 2 columns, 2 rows -->
    <div class="grid grid--2x2">
      <section class="card">
        <h2>Events</h2>
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
var agendaEl = document.querySelector("#agenda");
renderAgenda(agendaEl);
renderTasks(document.querySelector("#tasks"));
//  overflow: hidden;
renderFeed(document.querySelector('#feed'));
renderReels(document.querySelector('#reels'));
renderProcesses(document.querySelector("#processes"));
mountHelp();

window.addEventListener("homedash:settings", function () {
  renderAgenda(agendaEl);
});
