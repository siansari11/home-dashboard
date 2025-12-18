export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  const wrap = document.createElement("div");

  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "8px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  // Quote line (no fancy font)
  const quote = document.createElement("div");
  quote.className = "quoteLine";
  quote.style.fontSize = "14px";
  quote.style.fontWeight = "600";
  quote.style.color = "rgba(15,23,42,0.60)";
  quote.style.marginBottom = "10px";
  quote.style.maxWidth = "760px";
  quote.style.marginLeft = "auto";
  quote.style.marginRight = "auto";

  const time = document.createElement("div");
  time.style.fontSize = "36px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";
  time.style.color = "rgba(15,23,42,0.85)";

  const date = document.createElement("div");
  date.style.color = "rgba(15,23,42,0.55)";
  date.style.marginTop = "4px";
  date.style.fontSize = "14px";

  wrap.append(brand, quote, time, date);
  el.append(wrap);

  // ---- Quote rotation ----
  const QUOTES = [
    "Small steps, done consistently, become big change.",
    "Make it easy. Make it gentle. Make it daily.",
    "Focus on the next right thing.",
    "Progress, not perfection.",
    "Today: calm mind, clear space, kind pace.",
    "You don’t need more time — you need fewer distractions.",
    "One task. One breath. One moment at a time.",
    "Create a home that supports who you are becoming.",
    "A little effort, repeated, beats a lot of effort once.",
    "Keep it simple. Keep it moving."
  ];

  // Change frequency:
  // - daily: use day index
  // - every few hours: include hour block
  function pickQuote() {
    const now = new Date();

    // Every 6 hours (00–05, 06–11, 12–17, 18–23)
    const hourBlock = Math.floor(now.getHours() / 6);

    // Stable per day + block (so it changes a few times/day, not every refresh)
    const day = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    const idx = (day + hourBlock) % QUOTES.length;

    return QUOTES[idx];
  }

  function setQuoteAnimated() {
    // restart animation by toggling the class
    quote.classList.remove("quoteAnimate");
    // force reflow
    void quote.offsetWidth;
    quote.textContent = pickQuote();
    quote.classList.add("quoteAnimate");
  }

  // ---- Clock ----
  const tick = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    date.textContent = now.toLocaleDateString([], { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  };

  tick();
  setQuoteAnimated();

  setInterval(tick, 1000 * 10);
  // refresh quote every 15 minutes; it only actually changes when hourBlock changes
  setInterval(setQuoteAnimated, 1000 * 60 * 15);
}
