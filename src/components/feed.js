// src/components/feed.js
import "../styles/feed.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";
import { loadRssItems } from "../lib/rss.js";

// Free QR image generator
function qrUrlFor(link) {
  var data = encodeURIComponent(String(link || "").trim());
  return "https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=" + data;
}

function pickEnabledGroups() {
  var enabled = DASHBOARD_CONFIG.rss?.enabledGroups || [];
  return FEED_GROUPS.filter(g => enabled.includes(g.key));
}

function byNewest(a, b) {
  return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
}

// ✅ Deduplicate by article link
function dedupeByLink(items){
  var seen = {};
  var out = [];

  for (var i = 0; i < items.length; i++){
    var link = items[i].link;
    if (!link || seen[link]) continue;
    seen[link] = true;
    out.push(items[i]);
  }
  return out;
}

export function renderFeed(el){
  el.className = "feed";

  var list = document.createElement("div");
  list.className = "feed__list";
  el.append(list);

  function render(items){
    list.innerHTML = "";

    items.forEach(it => {
      var card = document.createElement("article");
      card.className = "feedCard";

      var imgWrap = document.createElement("div");
      imgWrap.className = "feedCard__imgWrap";

      var img = document.createElement("img");
      img.className = "feedCard__img";
      img.loading = "lazy";
      img.decoding = "async";
      if (it.image) img.src = it.image;
      else img.classList.add("hidden");

      imgWrap.append(img);

      var body = document.createElement("div");
      body.className = "feedCard__body";

      var title = document.createElement("div");
      title.className = "feedCard__title";
      title.textContent = it.title || "(untitled)";

      var source = document.createElement("div");
      source.className = "feedCard__sub";
      source.textContent = it.sourceTitle || "";

      var actions = document.createElement("div");
      actions.className = "feedCard__actions";

      var open = document.createElement("a");
      open.className = "feedBtn";
      open.href = it.link;
      open.target = "_blank";
      open.rel = "noreferrer";
      open.textContent = "Open";

      var qrBtn = document.createElement("button");
      qrBtn.className = "feedBtn feedBtn--ghost";
      qrBtn.textContent = "QR";

      var qrPanel = document.createElement("div");
      qrPanel.className = "qrPanel";

      var qrImg = document.createElement("img");
      qrImg.className = "qrPanel__img";

      qrBtn.addEventListener("click", function(panel, imgEl, link){
        return function(){
          var open = panel.classList.toggle("qrPanel--open");
          if (open && !imgEl.src) imgEl.src = qrUrlFor(link);
        };
      }(qrPanel, qrImg, it.link));

      qrPanel.append(qrImg);

      actions.append(open, qrBtn);
      body.append(title, source, actions, qrPanel);

      card.append(imgWrap, body);
      list.append(card);
    });
  }

  function load(){
    var groups = pickEnabledGroups();
    var promises = [];

    groups.forEach(group => {
      group.urls.forEach(url => {
        promises.push(
          loadRssItems(url).then(items =>
            (items || []).map(it => ({
              title: it.title,
              link: it.link,
              image: it.image,
              pubDate: it.pubDate,
              sourceTitle: group.title
            }))
          )
        );
      });
    });

    Promise.all(promises).then(all => {
      var merged = dedupeByLink([].concat(...all));
      merged.sort(byNewest);
      merged = merged.slice(0, DASHBOARD_CONFIG.rss.maxItemsTotal);
      render(merged);
    });
  }

  load();
  setInterval(load, DASHBOARD_CONFIG.rss.refreshMs);
}
