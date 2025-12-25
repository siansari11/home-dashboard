// src/components/reels.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";

export async function renderReels(el){
  console.log("[REELS] renderReels called");

  el.innerHTML =
    '<div class="sectionHead">' +
      '<div class="pill">🍲 Food</div>' +
      '<div id="reelsStatus" class="sectionStatus"></div>' +
    "</div>" +
    '<div id="reelsBody" class="sectionBody">Loading…</div>';

  var status = el.querySelector("#reelsStatus");
  var body = el.querySelector("#reelsBody");

  async function refresh(){
    console.log("[REELS] refresh start");
    status.textContent = "Updating…";

    try {
      var items = await loadRssItems();
      console.log("[REELS] items total", items.length);

      // keep only food
      var list = items.filter(function(x){ return (x.groupKey || "") === "food"; });
      console.log("[REELS] food items", list.length);

      if (!list.length) {
        body.innerHTML = '<div class="emptyState">No food items found.</div>';
        status.textContent = "";
        return;
      }

      body.innerHTML = renderSimpleTiles(list);
      status.textContent = "Updated";
    } catch (e) {
      console.log("[REELS] ERROR", e);
      body.innerHTML = '<div class="emptyState">Food feed failed.</div>';
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
