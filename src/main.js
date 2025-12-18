import './styles.css';
import { renderHeader } from './components/header.js';
import { renderWeather } from './lib/weather.js';
import { renderFeed } from './components/feed.js';
import { renderAgenda } from './components/agenda.js';
import { renderTasks } from "./components/tasks.js";

document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <header id="header"></header>

    <div class="grid">
      <!-- LEFT: Weather + Events -->
      <section class="card strong">
        <h2>Weather</h2>
        <div id="weather">Loading…</div>

        <div style="height:12px"></div>

        <h2>Next events</h2>
        <div id="agenda">Loading…</div>
      </section>

      <!-- MIDDLE: Tasks -->
      <section class="card">
        <h2>Tasks</h2>
        <div id="tasks">(Next step — we’ll add proper tasks UI here)</div>
        <div style="color:var(--muted); font-size:12px; margin-top:10px">
          Pilot: local-only. Later: sync when Pi arrives.
        </div>
      </section>

      <!-- RIGHT: Feed -->
      <section class="card">
        <h2>Feed</h2>
        <div id="feed">Loading…</div>
      </section>
    </div>
  </div>
`;

renderHeader(document.querySelector('#header'));
renderWeather(document.querySelector('#weather'));
renderAgenda(document.querySelector('#agenda'));
renderTasks(document.querySelector("#tasks"));
renderFeed(document.querySelector('#feed'));
