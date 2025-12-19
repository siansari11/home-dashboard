// src/components/feed.js
import "../styles/feed.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";
import { loadRssItems } from "../lib/rss.js";

// Free QR image generator (no key). Data is URL-encoded.
function qrUrlFor(link) {
  var data = encodeURIComponent(String(link || "").trim());
  // 110x110 is small enough for tablet, still scannable
  return "https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=" + data;
}

function pickEnabledGroups() {
  var enabled = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.enabledGroups) ? DASHBOARD_CONFIG.rss.enabledGroups : [];
  return FEED_GROUPS.filter(function(g){ return enabled.indexOf(g.key) >= 0; });
}

function byNewest(a, b) {
  var ta = a && a.pubDate ? new Date(a.pubDate).getTime() : 0;
  var tb = b && b.pubDate ? new Date(b.pubDate).getTime() : 0;
  return tb - ta;
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

export function renderFeed(el){
  el.className = "feed";

  var header = document.createElement("div");
  header.className = "feed__header";

  var title = document.createElement("div");
  title.className = "feed__title";
  title.textContent = "Feed";

  var meta = document.createElement("div");
  meta.className = "feed__meta";
  meta.textContent = "Loading…";

  header.append(title, meta);

  var list = document.createElement("div");
  list.className = "feed__list";

  var errorBox = document.createElement("div");
  errorBox.className = "feed__error hidden";

  el.append(header, errorBox, list);

  var refreshMs = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.refreshMs) ? DASHBOARD_CONFIG.rss.refreshMs : (10 * 60 * 1000);
  var maxTotal = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.maxItemsTotal) ? DASHBOARD_CONFIG.rss.maxItemsTotal : 10;
  var maxPerGroup = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.maxItemsPerGroup) ? DASHBOARD_CONFIG.rss.maxItemsPerGroup : 6;

  function setError(msg){
    errorBox.textContent = msg || "";
    errorBox.classList.toggle("hidden", !msg);
  }

  function clearList(){
    list.innerHTML = "";
  }

  function renderItems(items){
    clearList();

    if (!items || !items.length) {
      var empty = document.createElement("div");
      empty.className = "feed__empty";
      empty.textContent = "No feed items found.";
      list.appendChild(empty);
      return;
    }

    for (var i = 0; i < items.length; i++){
      var it = items[i];

      var card = document.createElement("article");
      card.className = "feedCard";

      var imgWrap = document.createElement("div");
      imgWrap.className = "feedCard__imgWrap";

      var img = document.createElement("img");
      img.className = "feedCard__img";
      img.alt = it.title || "Feed image";
      img.loading = "lazy";
      img.decoding = "async";

      // Image can be missing; keep layout stable
      if (it.image) img.src = it.image;
      else img.classList.add("hidden");

      imgWrap.appendChild(img);

      var body = document.createElement("div");
      body.className = "feedCard__body";

      var t = document.createElement("div");
      t.className = "feedCard__title";
      t.textContent = it.title || "(untitled)";

      var sub = document.createElement("div");
      sub.className = "feedCard__sub";
      sub.textContent = it.sourceTitle ? it.sourceTitle : "";

      var actions = document.createElement("div");
      actions.className = "feedCard__actions";

      var open = document.createElement("a");
      open.className = "feedBtn";
      open.href = it.link || "#";
      open.target = "_blank";
      open.rel = "noreferrer";
      open.textContent = "Open";

      var qrBtn = document.createElement("button");
      qrBtn.className = "feedBtn feedBtn--ghost";
      qrBtn.type = "button";
      qrBtn.textContent = "QR";

      var qrPanel = document.createElement("div");
      qrPanel.className = "qrPanel";

      var qrImg = document.createElement("img");
      qrImg.className = "qrPanel__img";
      qrImg.alt = "QR code";
      qrImg.loading = "lazy";

      // Build QR only when needed (faster first paint)
      qrBtn.addEventListener("click", function(panel, imgEl, link){
        return function(){
          var isOpen = panel.classList.toggle("qrPanel--open");
          if (isOpen && !imgEl.src) imgEl.src = qrUrlFor(link);
        };
      }(qrPanel, qrImg, it.link));

      var qrHint = document.createElement("div");
      qrHint.className = "qrPanel__hint";
      qrHint.textContent = "Scan to open on phone";

      qrPanel.append(qrImg, qrHint);

      actions.append(open, qrBtn);

      body.append(t, sub, actions, qrPanel);

      card.append(imgWrap, body);
      list.appendChild(card);
    }
  }

  function load(){
    setError("");
    meta.textContent = "Refreshing…";

    var groups = pickEnabledGroups();
    if (!groups.length){
      meta.textContent = "No feed groups enabled.";
      renderItems([]);
      return;
    }

    // Load each group, then merge + cap.
    var promises = [];

    for (var g = 0; g < groups.length; g++){
      promises.push(loadGroup(groups[g]));
    }

    Promise.all(promises).then(function(groupLists){
      var merged = [];

      for (var i = 0; i < groupLists.length; i++){
        var part = groupLists[i] || [];
        for (var j = 0; j < part.length; j++) merged.push(part[j]);
      }

      merged.sort(byNewest);

      // cap total
      merged = merged.slice(0, maxTotal);

      meta.textContent = "Updated";
      renderItems(merged);
    }).catch(function(err){
      setError("RSS load failed: " + String(err && err.message ? err.message : err));
      meta.textContent = "Error";
      renderItems([]);
    });
  }

  function loadGroup(group){
    // group.urls -> loadRssItems(url) -> normalize fields
    var perGroup = clamp(maxPerGroup, 1, 50);

    var all = [];
    var seq = Promise.resolve();

    for (var u = 0; u < group.urls.length; u++){
      (function(url){
        seq = seq.then(function(){
          return loadRssItems(url).then(function(items){
            items = items || [];
            for (var k = 0; k < items.length; k++){
              all.push({
                title: items[k].title,
                link: items[k].link,
                image: items[k].image,
                pubDate: items[k].pubDate,
                sourceTitle: group.title
              });
            }
          });
        });
      })(group.urls[u]);
    }

    return seq.then(function(){
      all.sort(byNewest);
      return all.slice(0, perGroup);
    });
  }

  load();
  setInterval(load, refreshMs);
}
