export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  const wrap = document.createElement("div");

  /* ======================
     Household heading
     ====================== */
  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  /* ======================
     Quote block
     ====================== */
  const quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";
  quoteWrap.style.marginBottom = "12px";

  const quoteText = document.createElement("div");
  quoteText.className = "quoteLine";
  quoteText.style.fontFamily = "'Great Vibes', cursive";
  quoteText.style.fontSize = "26px";           // smaller than heading
  quoteText.style.fontStyle = "italic";
  quoteText.style.color = "rgba(255,255,255,0.82)";
  quoteText.style.lineHeight = "1.25";
  quoteText.style.textShadow = "0 4px 14px rgba(0,0,0,0.25)";

  const quoteAuthor = document.createElement("div");
  quoteAuthor.style.fontSize = "12px";
  quoteAuthor.style.marginTop = "2px";
  quoteAuthor.style.color = "rgba(255,255,255,0.55)";
  quoteAuthor.style.fontStyle = "normal";

  quoteWrap.append(quoteText, quoteAuthor);

  /* ======================
     Time & date
     ====================== */
  const time = document.createElement("div");
  time.style.fontSize = "36px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";
  time.style.color = "rgba(15,23,42,0.85)";

  const date = document.createElement("div");
  date.style.color = "rgba(15,23,42,0.55)";
  date.style.marginTop = "4px";
  date.style.fontSize = "14px";

  wrap.append(brand, quoteWrap, time, date);
  el.append(wrap);

  /* ======================
     Quotes source
     ====================== */
  const QUOTES = [
    { text: "Small steps, done consistently, become big change.", author: "James Clear" },
    { text: "Make it easy. Make it gentle. Make it daily.", author: "" },
    { text: "Focus on the next right thing.", author: "" },
    { text: "Progress, not perfection.", author: "" },
    { text: "Create a home that supports who you are becoming.", author: "" },
    { text: "One task. One breath. One moment at a time.", author: "" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" }
  ];

  function pickQuote() {
    const now = new Date();
    const hourBlock = Math.floor(now.getHours() / 6); // 4 times/day
    const day = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
    const idx = (day + hourBlock) % QUOTES.length;
    return QUOTES[idx];
  }

  function setQuoteAnimated() {
    const q = pickQuote();
    quoteText.classList.remove("quoteAnimate");
    void quoteText.offsetWidth; // force reflow
    quoteText.textContent = `“${q.text}”`;
    quoteAuthor.textContent = q.author ? `— ${q.author}` : "";
    quoteText.classList.add("quoteAnimate");
  }

  /* ======================
     Clock
     ====================== */
  const tick = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  tick();
  setQuoteAnimated();

  setInterval(tick, 1000 * 10);
  setInterval(setQuoteAnimated, 1000 * 60 * 15); // safe refresh
}
