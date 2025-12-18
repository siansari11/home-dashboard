// src/components/header.js

export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  var wrap = document.createElement("div");

  /* ======================
     Household heading
     ====================== */
  var brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  /* ======================
     Quote block (same vibe as heading, smaller)
     ====================== */
  var quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";
  quoteWrap.style.marginBottom = "12px";
  quoteWrap.style.maxWidth = "780px";
  quoteWrap.style.marginLeft = "auto";
  quoteWrap.style.marginRight = "auto";

  var quoteText = document.createElement("div");
  quoteText.className = "quoteLine";
  quoteText.style.fontFamily = "'Great Vibes', cursive";
  quoteText.style.fontSize = "26px";
  quoteText.style.fontStyle = "italic";
  quoteText.style.color = "rgba(255,255,255,0.82)";
  quoteText.style.lineHeight = "1.25";
  quoteText.style.textShadow = "0 4px 14px rgba(0,0,0,0.25)";
  quoteText.style.whiteSpace = "pre-wrap";

  var quoteAuthor = document.createElement("div");
  quoteAuthor.className = "quoteAuthor";
  quoteAuthor.style.fontSize = "12px";
  quoteAuthor.style.marginTop = "4px";
  quoteAuthor.style.color = "rgba(255,255,255,0.55)";
  quoteAuthor.style.textAlign = "right";

  quoteWrap.append(quoteText, quoteAuthor);

  /* ======================
     Time & date
     ====================== */
  var time = document.createElement("div");
  time.style.fontSize = "36px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";
  time.style.color = "rgba(15,23,42,0.85)";

  var date = document.createElement("div");
  date.style.color = "rgba(15,23,42,0.55)";
  date.style.marginTop = "4px";
  date.style.fontSize = "14px";

  wrap.append(brand, quoteWrap, time, date);
  el.append(wrap);

  /* ======================
     Quote animation: word-by-word + slow fade switch
     (CSS already in styles.css)
     ====================== */
  function renderQuoteWords(text){
    quoteText.innerHTML = "";

    var open = document.createElement("span");
    open.textContent = "“";
    open.className = "quotePunct";
    quoteText.appendChild(open);

    var words = String(text || "").trim().split(/\s+/);
    for (var i = 0; i < words.length; i++){
      quoteText.appendChild(document.createTextNode(" "));

      var span = document.createElement("span");
      span.className = "quoteWord";
      span.textContent = words[i];

      // slow “exhale” pacing (tune by CSS too)
      span.style.animationDelay = (i * 260) + "ms";
      quoteText.appendChild(span);
    }

    quoteText.appendChild(document.createTextNode(" "));

    var close = document.createElement("span");
    close.textContent = "”";
    close.className = "quotePunct";
    quoteText.appendChild(close);
  }

  /* ======================
     Daily quotes: fetch 4 once/day, avoid repeats for 30 days
     Cache today’s set in localStorage
     ====================== */
  var QUOTES_TODAY = [];
  var qIndex = 0;

  initDailyQuotes();

  function initDailyQuotes(){
    loadDailyQuotes(4).then(function(list){
      QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(4);

      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      // Demo: rotate every 30 seconds (we can change later)
      setInterval(transitionToNextQuote, 30000);
    }).catch(function(){
      QUOTES_TODAY = fallbackDailyQuotes(4);

      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setInterval(transitionToNextQuote, 30000);
    });
  }

  function setQuote(index){
    if (!QUOTES_TODAY || !QUOTES_TODAY.length) return;
    var q = QUOTES_TODAY[index % QUOTES_TODAY.length];

    renderQuoteWords(q.text);
    quoteAuthor.textContent = q.author ? ("— " + q.author) : "";
  }

  function transitionToNextQuote(){
    // fade out
    quoteWrap.classList.remove("quoteIn");
    quoteWrap.classList.add("quoteOut");

    // after fade-out, swap and fade-in
    setTimeout(function(){
      if (!QUOTES_TODAY || !QUOTES_TODAY.length) return;

      qIndex = (qIndex + 1) % QUOTES_TODAY.length;

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setQuote(qIndex);
    }, 1800); // should match your quoteFadeOut duration
  }

  function loadDailyQuotes(n){
    var todayKey = "menzelijaz.quotes." + ymd(new Date());
    var histKey = "menzelijaz.quoteHistory.v2"; // hashed IDs

    // 1) reuse today's cached quotes if present
    try {
      var cached = localStorage.getItem(todayKey);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length) {
          return Promise.resolve(parsed.items);
        }
      }
    } catch (e) {}

    // 2) load history: hash -> timestamp
    var history = {};
    try {
      var h = JSON.parse(localStorage.getItem(histKey) || "{}");
      if (h && h.map) history = h.map;
    } catch (e) {}

    function saveHistory(updatedMap){
      try {
        var cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
        var keys = Object.keys(updatedMap);
        for (var i = 0; i < keys.length; i++){
          if (updatedMap[keys[i]] < cutoff) delete updatedMap[keys[i]];
        }
        localStorage.setItem(histKey, JSON.stringify({ map: updatedMap, savedAt: Date.now() }));
      } catch (e) {}
    }

    // 3) fetch until we get n unseen quotes (or give up gracefully)
    var picked = [];
    var pickedIds = {};
    var attempts = 0;
    var maxAttempts = 24;

    function fetchOne(){
      return fetch("https://api.quotable.io/random?maxLength=110")
        .then(function(r){ return r.json(); })
        .then(function(j){
          return { text: j && j.content ? j.content : "", author: j && j.author ? j.author : "" };
        })
        .catch(function(){ return null; });
    }

    function loop(){
      if (picked.length >= n) return Promise.resolve(picked);
      if (attempts >= maxAttempts) return Promise.resolve(picked);

      attempts++;

      return fetchOne().then(function(q){
        if (q && q.text) {
          var id = hashQuoteId(q.text, q.author);
          if (!history[id] && !pickedIds[id]) {
            picked.push(q);
            pickedIds[id] = true;
          }
        }
        return loop();
      });
    }

    return loop().then(function(list){
      if (!list || !list.length) return list;

      // 4) cache today's quotes
      try {
        localStorage.setItem(todayKey, JSON.stringify({ items: list, savedAt: Date.now() }));
        cleanupOldQuoteCache(7); // keep last 7 days of daily caches
      } catch (e) {}

      // 5) update 30-day history with hashed IDs
      for (var i = 0; i < list.length; i++){
        var hid = hashQuoteId(list[i].text, list[i].author);
        history[hid] = Date.now();
      }
      saveHistory(history);

      return list;
    });
  }

  function cleanupOldQuoteCache(keepDays){
    var prefix = "menzelijaz.quotes.";
    var keys = [];
    for (var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) keys.push(k);
    }
    var cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    for (var j = 0; j < keys.length; j++){
      try {
        var v = JSON.parse(localStorage.getItem(keys[j]) || "{}");
        if (v.savedAt && v.savedAt < cutoff) localStorage.removeItem(keys[j]);
      } catch (e) {}
    }
  }

  function fallbackDailyQuotes(n){
    // Offline/blocked-API fallback: deterministic daily pick (stable during the day)
    var fallback = [
      { text: "Small steps, done consistently, become big change.", author: "James Clear" },
      { text: "Progress, not perfection.", author: "" },
      { text: "Focus on the next right thing.", author: "" },
      { text: "Create a home that supports who you are becoming.", author: "" },
      { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
      { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
      { text: "One task. One breath. One moment at a time.", author: "" },
      { text: "Make it easy. Make it gentle. Make it daily.", author: "" },
      { text: "A calm plan beats a perfect plan.", author: "" },
      { text: "Don’t improve everything. Improve one thing.", author: "" }
    ];

    var seed = Number(ymd(new Date()).replace(/-/g, "")); // e.g. 20251218
    var out = [];
    var used = {};

    for (var i = 0; i < n; i++){
      seed = (seed * 9301 + 49297) % 233280; // LCG
      var idx = seed % fallback.length;
      while (used[idx]) idx = (idx + 1) % fallback.length;
      used[idx] = true;
      out.push(fallback[idx]);
    }
    return out;
  }

  function hashQuoteId(text, author){
    // FNV-1a 32-bit hash -> short hex (8 chars)
    var s = (String(author || "") + "|" + String(text || "")).toLowerCase();
    var h = 2166136261;
    for (var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function ymd(d){
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function pad2(n){
    return String(n).padStart(2, "0");
  }

  /* ======================
     Clock
     ====================== */
  function tick(){
    var now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  tick();
  setInterval(tick, 1000 * 10);
}

