// src/components/header.js
// Dashboard header + daily quotes (test mode configurable)

export function renderHeader(el){
  /* ======================
     EASY CONFIG (edit here only)
     ====================== */
  var QUOTE_CFG = {
    QUOTES_PER_DAY: 4,

    // TEST MODE:
    // Treat "a day" as 5 minutes so you can quickly verify uniqueness + caching.
    DAY_MS: 5 * 60 * 1000,

    // Quote rotation speed (for testing)
    ROTATE_MS: 15 * 1000,

    // How many "days" of history to avoid repeats.
    // In test mode, 30 "days" = 30 * 5 minutes = 150 minutes.
    HISTORY_DAYS: 30,

    // Fetch attempts per "day" to find unseen quotes
    MAX_FETCH_ATTEMPTS: 30,

    // API endpoint (no key)
    API_URL: "https://api.quotable.io/random?maxLength=110",

    // Keep last N cached "days" of quote sets
    CACHE_KEEP_DAYS: 7
  };

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
     Quote block
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
     Quote rendering (word-by-word)
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

      // slow exhale pacing (CSS controls duration; this controls spacing between words)
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
     Daily quotes with history (test-day aware)
     ====================== */
  var QUOTES_TODAY = [];
  var qIndex = 0;

  // Rotate quotes in the UI
  function setQuote(index){
    if (!QUOTES_TODAY || !QUOTES_TODAY.length) return;
    var q = QUOTES_TODAY[index % QUOTES_TODAY.length];
    renderQuoteWords(q.text);
    quoteAuthor.textContent = q.author ? ("— " + q.author) : "";
  }

  function transitionToNextQuote(){
    quoteWrap.classList.remove("quoteIn");
    quoteWrap.classList.add("quoteOut");

    setTimeout(function(){
      if (!QUOTES_TODAY || !QUOTES_TODAY.length) return;
      qIndex = (qIndex + 1) % QUOTES_TODAY.length;

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setQuote(qIndex);
    }, 1800); // match your CSS quoteFadeOut duration
  }

  initDailyQuotes();

  function initDailyQuotes(){
    loadDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY).then(function(list){
      QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY);
      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      // UI rotation speed
      setInterval(transitionToNextQuote, QUOTE_CFG.ROTATE_MS);

      // Reload the set when the "day" flips (in test mode: every 5 minutes)
      setInterval(checkForNewDayAndReload, 1000);
    }).catch(function(){
      QUOTES_TODAY = fallbackDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY);
      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setInterval(transitionToNextQuote, QUOTE_CFG.ROTATE_MS);
      setInterval(checkForNewDayAndReload, 1000);
    });
  }

  var lastDayId = dayIdNow();

  function checkForNewDayAndReload(){
    var cur = dayIdNow();
    if (cur !== lastDayId) {
      lastDayId = cur;
      // fetch a new "daily" set immediately
      loadDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY).then(function(list){
        QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY);
        qIndex = 0;
        setQuote(qIndex);
      }).catch(function(){});
    }
  }

  function loadDailyQuotes(n){
    var todayKey = "menzelijaz.quotes." + String(dayIdNow());
    var histKey = "menzelijaz.quoteHistory.v2";

    // 1) reuse today's cached set if present
    try {
      var cached = localStorage.getItem(todayKey);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length) return Promise.resolve(parsed.items);
      }
    } catch (e) {}

    // 2) load history map (hash -> lastSeenTimestamp)
    var history = {};
    try {
      var h = JSON.parse(localStorage.getItem(histKey) || "{}");
      if (h && h.map) history = h.map;
    } catch (e) {}

    function saveHistory(updatedMap){
      try {
        var cutoff = Date.now() - (QUOTE_CFG.HISTORY_DAYS * QUOTE_CFG.DAY_MS);
        var keys = Object.keys(updatedMap);
        for (var i = 0; i < keys.length; i++){
          if (updatedMap[keys[i]] < cutoff) delete updatedMap[keys[i]];
        }
        localStorage.setItem(histKey, JSON.stringify({ map: updatedMap, savedAt: Date.now() }));
      } catch (e) {}
    }

    // 3) fetch until we have n unseen quotes (or give up gracefully)
    var picked = [];
    var pickedIds = {};
    var attempts = 0;
    var maxAttempts = QUOTE_CFG.MAX_FETCH_ATTEMPTS;

    function fetchOne(){
      return fetch(QUOTE_CFG.API_URL)
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

      // 4) cache today's quote set
      try {
        localStorage.setItem(todayKey, JSON.stringify({ items: list, savedAt: Date.now() }));
        cleanupOldQuoteCache(QUOTE_CFG.CACHE_KEEP_DAYS);
      } catch (e) {}

      // 5) update history hashes
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
    var cutoff = Date.now() - (keepDays * QUOTE_CFG.DAY_MS);
    for (var j = 0; j < keys.length; j++){
      try {
        var v = JSON.parse(localStorage.getItem(keys[j]) || "{}");
        if (v.savedAt && v.savedAt < cutoff) localStorage.removeItem(keys[j]);
      } catch (e) {}
    }
  }

  function fallbackDailyQuotes(n){
    // Offline/blocked-API fallback: deterministic pick by "dayId"
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

    var seed = Number(dayIdNow());
    var out = [];
    var used = {};

    for (var i = 0; i < n; i++){
      seed = (seed * 9301 + 49297) % 233280;
      var idx = seed % fallback.length;
      while (used[idx]) idx = (idx + 1) % fallback.length;
      used[idx] = true;
      out.push(fallback[idx]);
    }
    return out;
  }

  function hashQuoteId(text, author){
    // FNV-1a 32-bit -> short hex (8 chars)
    var s = (String(author || "") + "|" + String(text || "")).toLowerCase();
    var h = 2166136261;
    for (var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function dayIdNow(){
    // IMPORTANT: "day" is configurable (test mode uses 5 minutes)
    return Math.floor(Date.now() / QUOTE_CFG.DAY_MS);
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
