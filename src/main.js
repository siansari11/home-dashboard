import './styles.css';
import { renderHeader } from './components/header.js';
import { renderWeather } from './lib/weather.js';
import { renderFeed } from './components/feed.js';
import { renderAgenda } from './components/agenda.js';

document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <header id="header"></header>

    <div class="grid">
      <section class="card">
        <h2>Weather</h2>
        <div id="weather">Loading…</div>
      </section>

      <section class="card">
        <h2>Today & tasks</h2>
        <div id="agenda"></div>
      </section>

      <section class="card" style="grid-column: 1 / -1;">
        <h2>Feed (recipes + home)</h2>
        <div id="feed">Loading…</div>
      </section>
    </div>
  </div>
`;

renderHeader(document.querySelector('#header'));
renderWeather(document.querySelector('#weather'));
renderAgenda(document.querySelector('#agenda'));
renderFeed(document.querySelector('#feed'));
