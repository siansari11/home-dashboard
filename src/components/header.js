// src/components/header.js
import "../styles/header.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";

export function renderHeader(el){
  var QUOTE_CFG = DASHBOARD_CONFIG.quotes;

  el.className = "dashboardHeader";

  var wrap = document.createElement("div");
  wrap.className = "dashboardHeader__wrap";

  // Title
  var brand = document.createElement("div");
  brand.className = "dashboardHeader__brand";
  brand.textContent = "The Menzel-Ijaz Household";

  // Quote
  var quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";

  var quoteText = document.createElement("div");
  quoteText.className = "quoteLine";

  var quoteAuthor = document.createElement("div");
  quoteAuthor.className = "quoteAuthor";

  quoteWrap.append(quoteText, quoteAuthor);

  // Time & date
  var time = document.createElement("div");
  time.className = "dashboardClock__time";

  var date = document.createElement("div");
  date.className = "dashboardClock__date";

  wrap.append(brand, quoteWrap, time, date);
  el.append(wrap);

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

      // allowed: this is behavior, not styling (timing)
      span.style.animationDelay = (i * 260) + "ms";
      quoteText.appendChild(span);
    }

    quoteText.appendChild(document.createTextNode(" "));

    var close = document.createElement("span");
    close.textContent = "”";
    close.className = "quotePunct";
    quoteText.appendChild(close);
  }

  // ----- Quotes state -----
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
    }, 1800);
  }

  // ---- Test-day aware "day" ----
  var lastDayId = dayIdNow();
  initDailyQuotes();

  function initDailyQuotes(){
    buildTodaysQuotes().then(function(list){
      QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.quotesPerDay);
      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setInterval(transitionToNextQuote, QUOTE_CFG.rotateMs);
      setInterval(checkForNewDayAndReload, 1000);
    }).catch(function(){
      QUOTES_TODAY = fallbackDailyQuotes(QUOTE_CFG.quotesPerDay);
      qIndex = 0;
      setQuote(qIndex);

      quoteWrap.classList.remove("quoteOut");
      quoteWrap.classList.add("quoteIn");

      setInterval(transitionToNextQuote, QUOTE_CFG.rotateMs);
      setInterval(checkForNewDayAndReload, 1000);
    });
  }

  function checkForNewDayAndReload(){
    var cur = dayIdNow();
    if (cur !== lastDayId) {
      lastDayId = cur;
      buildTodaysQuotes().then(function(list){
        QUOTES_TODAY = (list && list.length) ? list : fallbackDailyQuotes(QUOTE_CFG.quotesPerDay);
        qIndex = 0;
        setQuote(qIndex);
      }).catch(function(){});
    }
  }

  /* ======================
     Quote source: type.fit list (cached)
     ====================== */
  function buildTodaysQuotes(){
    var todayKey = "menzelijaz.quotes.dayset." + String(dayIdNow());

    try {
      var cached = localStorage.getItem(todayKey);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.items && parsed.items.length) return Promise.resolve(parsed.items);
      }
    } catch (e) {}

    return loadQuoteList().then(function(list){
      if (!list || !list.length) return [];

      var history = loadHistoryMap();
      pruneHistory(history);

      var picked = pickUnseenQuotesForDay(list, history, QUOTE_CFG.quotesPerDay);

      try {
        localStorage.setItem(todayKey, JSON.stringify({ items: picked, savedAt: Date.now() }));
        cleanupOldDaySets(7);
      } catch (e) {}

      for (var i = 0; i < picked.length; i++){
        history[hashQuoteId(picked[i].text, picked[i].author)] = Date.now();
      }
      saveHistoryMap(history);

      return picked;
    });
  }

  function loadQuoteList(){
    var listKey = "menzelijaz.quoteList.v1";
    var metaKey = "menzelijaz.quoteList.meta.v1";

    try {
      var meta = JSON.parse(localStorage.getItem(metaKey) || "{}");
      if (meta && meta.savedAt) {
        var age = Date.now() - meta.savedAt;
        var maxAge = QUOTE_CFG.listCacheDays * QUOTE_CFG.dayMs;
        if (age < maxAge) {
          var cachedList = JSON.parse(localStorage.getItem(listKey) || "[]");
          if (cachedList && cachedList.length) return Promise.resolve(cachedList);
        }
      }
    } catch (e) {}

    return fetch(QUOTE_CFG.sourceUrl, { cache: "no-store" })
      .then(function(r){ return r.json(); })
      .then(function(arr){
        var cleaned = [];
        for (var i = 0; i < (arr || []).length; i++){
          var q = arr[i] || {};
          var t = String(q.text || "").trim();
          if (!t) continue;
          cleaned.push({ text: t, author: String(q.author || "").trim() });
        }

        try {
          localStorage.setItem(listKey, JSON.stringify(cleaned));
          localStorage.setItem(metaKey, JSON.stringify({ savedAt: Date.now() }));
        } catch (e) {}

        return cleaned;
      });
  }

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
    var cutoff = Date.now() - (QUOTE_CFG.historyDays * QUOTE_CFG.dayMs);
    var keys = Object.keys(map || {});
    for (var i = 0; i < keys.length; i++){
      if (map[keys[i]] < cutoff) delete map[keys[i]];
    }
  }

  function pickUnseenQuotesForDay(list, history, n){
    var seed = (dayIdNow() >>> 0) + 12345;
    var picked = [];
    var pickedIds = {};
    var attempts = 0;
    var maxAttempts = QUOTE_CFG.maxPickAttempts || 5000;

    while (picked.length < n && attempts < maxAttempts) {
      attempts++;

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
    var cutoff = Date.now() - (keepDays * QUOTE_CFG.dayMs);
    for (var j = 0; j < keys.length; j++){
      try {
        var v = JSON.parse(localStorage.getItem(keys[j]) || "{}");
        if (v.savedAt && v.savedAt < cutoff) localStorage.removeItem(keys[j]);
      } catch (e) {}
    }
  }

  function hashQuoteId(text, author){
    var s = (String(author || "") + "|" + String(text || "")).toLowerCase();
    var h = 2166136261;
    for (var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function dayIdNow(){
    return Math.floor(Date.now() / QUOTE_CFG.dayMs);
  }

  function fallbackDailyQuotes(n){
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

  // ----- Clock -----
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
