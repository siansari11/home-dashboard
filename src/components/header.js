export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  const wrap = document.createElement("div");

  // Household heading
  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  // Quote block
  const quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";
  quoteWrap.style.marginBottom = "12px";
  quoteWrap.style.maxWidth = "780px";
  quoteWrap.style.marginLeft = "auto";
  quoteWrap.style.marginRight = "auto";

  const quoteText = document.createElement("div");
  quoteText.className = "quoteLine";
  quoteText.style.fontFamily = "'Great Vibes', cursive";
  quoteText.style.fontSize = "26px";
  quoteText.style.fontStyle = "italic";
  quoteText.style.color = "rgba(255,255,255,0.82)";
  quoteText.style.lineHeight = "1.25";
  quoteText.style.textShadow = "0 4px 14px rgba(0,0,0,0.25)";

  const quoteAuthor = document.createElement("div");
  quoteAuthor.className = "quoteAuthor";
  quoteAuthor.style.fontSize = "12px";
  quoteAuthor.style.marginTop = "4px";
  quoteAuthor.style.color = "rgba(255,255,255,0.55)";
  quoteAuthor.style.textAlign = "right";  // <-- right aligned attribution

  quoteWrap.append(quoteText, quoteAuthor);

  // Time & date
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

  // Quotes
  const QUOTES = [
    { text: "Small steps, done consistently, become big change.", author: "James Clear" },
    { text: "Progress, not perfection.", author: "" },
    { text: "Focus on the next right thing.", author: "" },
    { text: "Create a home that supports who you are becoming.", author: "" },
    { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "One task. One breath. One moment at a time.", author: "" },
    { text: "Make it easy. Make it gentle. Make it daily.", author: "" }
  ];

  let qIndex = 0;

  function renderQuoteWords(text){
  quoteText.innerHTML = "";
  quoteText.style.whiteSpace = "pre-wrap"; // preserve spaces reliably

  // Opening quote mark
  const open = document.createElement("span");
  open.textContent = "“";
  open.className = "quotePunct";
  quoteText.appendChild(open);

  const words = String(text).trim().split(/\s+/);

  for (let i = 0; i < words.length; i++){
    // leading space before every word except the first (after opening quote)
    if (i === 0) {
      quoteText.appendChild(document.createTextNode(" "));
    } else {
      quoteText.appendChild(document.createTextNode(" "));
    }

    const span = document.createElement("span");
    span.className = "quoteWord";
    span.textContent = words[i];
    // slow, breathing pacing
    span.style.animationDelay = (i * 260) + "ms";
    quoteText.appendChild(span);
  }

  // space + closing quote mark
  quoteText.appendChild(document.createTextNode(" "));
  const close = document.createElement("span");
  close.textContent = "”";
  close.className = "quotePunct";
  quoteText.appendChild(close);
  }

  function setQuote(index){
    const q = QUOTES[index % QUOTES.length];
    renderQuoteWords(q.text);
    quoteAuthor.textContent = q.author ? "— " + q.author : "";
  }

  // Transition: fade away, then swap, then word-by-word appears
  function transitionToNextQuote(){
    // Fade out whole quote block
    quoteWrap.classList.remove("quoteIn");
    quoteWrap.classList.add("quoteOut");

    // After fade-out, swap content and fade-in/word-animate
    setTimeout(() => {
      qIndex = (qIndex + 1) % QUOTES.length;

      // remove out class so words can animate in again
      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setQuote(qIndex);
    }, 900); // fade-out duration (match CSS)
  }

  // Initial quote
  setQuote(qIndex);
  quoteWrap.classList.add("quoteIn");

  // DEMO: change every 30 seconds (we can switch back to 6 hours later)
  setInterval(transitionToNextQuote, 30000);

  // Clock
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
  setInterval(tick, 1000 * 10);
}
