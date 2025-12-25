// src/components/feed.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";

export async function renderFeed(el){
  console.log("[FEED] renderFeed called");

  el.innerHTML =
    '<div class="sectionHead">' +
      '<div class="pill">🧺 Lifestyle</div>' +
      '<div id="feedStatus" class="sectionStatus"></div>' +
    "</div>" +
    '<div id="feedBody" class="sectionBody">Loading…</div>';

  var status = el.querySelector("#feedStatus");
  var body = el.querySelector("#feedBody");

  async function refresh(){
    console.log("[FEED] refresh start");
    status.textContent = "Updating…";

    try {
      var items = await loadRssItems();
      console.log("[FEED] items total", items.length);

      // keep only lifestyle
      var list = items.filter(function(x){ return (x.groupKey || "") === "lifestyle"; });
      console.log("[FEED] lifestyle items", list.length);

      if (!list.length) {
        body.innerHTML = '<div class="emptyState">No lifestyle items found.</div>';
        status.textContent = "";
        return;
      }

      body.innerHTML = renderSimpleTiles(list);
      status.textContent = "Updated";
    } catch (e) {
      console.log("[FEED] ERROR", e);
      body.innerHTML = '<div class="emptyState">Lifestyle feed failed.</div>';
      status.textContent = "";
    }
  }

  await refresh();

  var refreshMs = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.refreshMs) ? DASHBOARD_CONFIG.rss.refreshMs : 10 * 60 * 1000;
  setInterval(refresh, refreshMs);
}

function renderSimpleTiles(items){
  var html = '<div class="feedList">';
  for (var i = 0; i < items.length; i++){
    var it = items[i];
    html +=
      '<a class="feedRow" href="' + escapeAttr(it.link) + '" target="_blank" rel="noreferrer">' +
        '<div class="feedMedia">' +
          (it.image ? '<img class="feedImg" src="' + escapeAttr(it.image) + '" alt="" />' : "") +
        "</div>" +
        '<div class="feedText">' +
          '<div class="feedTitle">' + escapeHtml(it.title) + "</div>" +
          (it.description ? '<div class="feedDesc">' + escapeHtml(it.description) + "</div>" : "") +
        "</div>" +
      "</a>";
  }
  html += "</div>";
  return html;
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m];
  });
}

function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}
