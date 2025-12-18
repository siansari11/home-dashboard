// src/components/header.js
import "../styles/header.css";

export function renderHeader(el){
  el.className = "dashboardHeader";

  const wrap = document.createElement("div");
  wrap.className = "dashboardHeader__wrap";

  const brand = document.createElement("div");
  brand.className = "dashboardHeader__brand";
  brand.textContent = "The Menzel-Ijaz Household";

  const quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";

  const quoteText = document.createElement("div");
  quoteText.className = "quoteLine";

  const quoteAuthor = document.createElement("div");
  quoteAuthor.className = "quoteAuthor";

  quoteWrap.append(quoteText, quoteAuthor);

  const clock = document.createElement("div");
  clock.className = "dashboardClock";

  const time = document.createElement("div");
  time.className = "dashboardClock__time";

  const date = document.createElement("div");
  date.className = "dashboardClock__date";

  clock.append(time, date);
  wrap.append(brand, quoteWrap, clock);
  el.append(wrap);

  function renderQuote(text, author){
    quoteText.textContent = `“ ${text} ”`;
    quoteAuthor.textContent = author ? `— ${author}` : "";
  }

  // TEMP STATIC QUOTE (same as original good look)
  renderQuote(
    "Progress, not perfection.",
    ""
  );

  function tick(){
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  tick();
  setInterval(tick, 10000);
}
