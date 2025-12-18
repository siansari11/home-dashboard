// src/components/header.js
// Dashboard header + daily quotes (type.fit source, cached, no-repeat history)
// Copy-paste the whole file.

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

    // Avoid repeating any quote within this many "days"
    // In test mode: 30 "days" = 150 minutes
    HISTORY_DAYS: 30,

    // Quote source (free, no key)
    SOURCE_URL: "https://type.fit/api/quotes",

    // Cache the big quote list to avoid re-downloading
    LIST_CACHE_DAYS: 7, // in "days" (so test mode = 7 * 5 minutes)

    // Safety caps
    MAX_PICK_ATTEMPTS: 5000, // plenty; list is large
  };

  /* ======================
     Layout
     ====================== */
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  var wrap = document.createElement("div");

  // Household heading
  var brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  // Quote block
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

  // Time & date
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

      // “exhale” pacing
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
     Daily quotes logic
     ====================== */
  var QUOTES_TODAY = [];
  var qIndex = 0;

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

  // ---- Test-day aware "day" ----
  var lastDayId = dayIdNow();

  // Init + rotate + reload when day flips
  initDailyQuotes();

  function initDailyQuotes(){
    buildTodaysQuotes().then(function(list){
      QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY);
      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setInterval(transitionToNextQuote, QUOTE_CFG.ROTATE_MS);
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

  function checkForNewDayAndReload(){
    var cur = dayIdNow();
    if (cur !== lastDayId) {
      lastDayId = cur;
      buildTodaysQuotes().then(function(list){
        QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.QUOTES_PER_DAY);
        qIndex = 0;
        setQuote(qIndex);
      }).catch(function(){});
    }
  }

  /* ======================
     Quote source: type.fit list (cached)
     ====================== */
  function buildTodaysQuotes(){
    // If we already have today's set cached, use it
    var todayKey = "menzelijaz.quotes.dayset." + String(dayIdNow());
    try {
      var cached = localStorage.getItem(todayKey);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length) return Promise.resolve(parsed.items);
      }
    } catch (e) {}

    // Load list -> pick N unseen -> cache day set -> update history
    return loadQuoteList().then(function(list){
      if (!list || !list.length) return [];

      var history = loadHistoryMap();
      pruneHistory(history);

      var picked = pickUnseenQuotesForDay(list, history, QUOTE_CFG.QUOTES_PER_DAY);

      // Save today's set
      try {
        localStorage.setItem(todayKey, JSON.stringify({ items: picked, savedAt: Date.now() }));
        cleanupOldDaySets(7);
      } catch (e) {}

      // Update history with hashed IDs only
      for (var i = 0; i < picked.length; i++){
        var hid = hashQuoteId(picked[i].text, picked[i].author);
        history[hid] = Date.now();
      }
      saveHistoryMap(history);

      return picked;
    });
  }

  function loadQuoteList(){
    var listKey = "menzelijaz.quoteList.v1";
    var cacheKey = "menzelijaz.quoteList.meta.v1";

    // Check cache validity
    try {
      var meta = JSON.parse(localStorage.getItem(cacheKey) || "{}");
      if (meta && meta.savedAt) {
        var age = Date.now() - meta.savedAt;
        var maxAge = QUOTE_CFG.LIST_CACHE_DAYS * QUOTE_CFG.DAY_MS;
        if (age < maxAge) {
          var cachedList = JSON.parse(localStorage.getItem(listKey) || "[]");
          if (cachedList && cachedList.length) return Promise.resolve(cachedList);
        }
      }
    } catch (e) {}

    // Fetch fresh list
    return fetch(QUOTE_CFG.SOURCE_URL, { cache: "no-store" })
      .then(function(r){ return r.json(); })
      .then(function(arr){
        var cleaned = [];
        for (var i = 0; i < (arr || []).length; i++){
          var q = arr[i] || {};
          var t = String(q.text || "").trim();
          if (!t) continue;

          cleaned.push({
            text: t,
            author: String(q.author || "").trim()
          });
        }

        // Save to cache
        try {
          localStorage.setItem(listKey, JSON.stringify(cleaned));
          localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now() }));
        } catch (e) {}

        return cleaned;
      });
  }

  /* ======================
     Picking + history (hashed IDs only)
     ====================== */
  function loadHistoryMap(){
    var histKey = "menzelijaz.quoteHistory.v3";
    try {
      var h = JSON.parse(localStorage.getItem(histKey) || "{}");
      return (h && h.map) ? h.map : {};
    } catch (e) {
      return {};
    }
  }

  function saveHistoryMap(map){
    var histKey = "menzelijaz.quoteHistory.v3";
    try {
      localStorage.setItem(histKey, JSON.stringify({ map: map, savedAt: Date.now() }));
    } catch (e) {}
  }

  function pruneHistory(map){
    var cutoff = Date.now() - (QUOTE_CFG.HISTORY_DAYS * QUOTE_CFG.DAY_MS);
    var keys = Object.keys(map || {});
    for (var i = 0; i < keys.length; i++){
      if (map[keys[i]] < cutoff) delete map[keys[i]];
    }
  }

  function pickUnseenQuotesForDay(list, history, n){
    // Deterministic PRNG based on dayId so it's stable within the day
    var seed = (dayIdNow() >>> 0) + 12345;
    var picked = [];
    var pickedIds = {};

    var attempts = 0;
    while (picked.length < n && attempts < QUOTE_CFG.MAX_PICK_ATTEMPTS) {
      attempts++;

      // xorshift32
      seed ^= (seed << 13) >>> 0;
      seed ^= (seed >>> 17) >>> 0;
      seed ^= (seed << 5) >>> 0;

      var idx = seed % list.length;
      var q = list[idx];

      if (!q || !q.text) continue;

      var hid = hashQuoteId(q.text, q.author);

      if (history[hid]) continue;
      if (pickedIds[hid]) continue;

      pickedIds[hid] = true;
      picked.push({ text: q.text, author: q.author });
    }

    // If we couldn't find enough unseen quotes, fill remaining from list anyway
    // (still deterministic-ish) — better than falling back
    if (picked.length < n) {
      for (var i = 0; i < list.length && picked.length < n; i++){
        var q2 = list[i];
        if (!q2 || !q2.text) continue;
        var hid2 = hashQuoteId(q2.text, q2.author);
        if (pickedIds[hid2]) continue;
        pickedIds[hid2] = true;
        picked.push({ text: q2.text, author: q2.author });
      }
    }

    return picked;
  }

  function cleanupOldDaySets(keepDays){
    var prefix = "menzelijaz.quotes.dayset.";
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

  function dayIdNow(){
    return Math.floor(Date.now() / QUOTE_CFG.DAY_MS);
  }

  function fallbackDailyQuotes(n){
    // Used only if type.fit fetch fails completely
    var fallback = [
      { text: "Progress, not perfection.", author: "" },
      { text: "Small steps, done consistently, become big change.", author: "James Clear" },
      { text: "Make it easy. Make it gentle. Make it daily.", author: "" },
      { text: "Focus on the next right thing.", author: "" },
      { text: "A calm plan beats a perfect plan.", author: "" },
      { text: "Don’t improve everything. Improve one thing.", author: "" }
    ];

    var seed = (dayIdNow() >>> 0) + 777;
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
