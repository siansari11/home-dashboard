// src/components/feed.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItemsWithDebug } from "../lib/rss.js";

export async function renderFeed(el){
  el.innerHTML =
    '<div class="sectionHead">' +
      '<div class="pill">🧺 Lifestyle</div>' +
      '<div id="feedStatus" class="sectionStatus"></div>' +
    "</div>" +
    '<div id="feedDebug" class="debugBox" style="display:none;"></div>' +
    '<div id="feedBody" class="sectionBody">Loading…</div>';

  var status = el.querySelector("#feedStatus");
  var body = el.querySelector("#feedBody");
  var dbg = el.querySelector("#feedDebug");

  async function refresh(){
    status.textContent = "Updating…";

    try {
      const { items, debug } = await loadRssItemsWithDebug();

      // Filter to lifestyle
      const list = (items || []).filter(x => (x.groupKey || "") === "lifestyle");

      // Always show a small debug summary if nothing loads
      if (!list.length) {
        dbg.style.display = "block";
        dbg.textContent = "RSS DEBUG: " + (debug?.summary || "no summary") +
          "\nGroups: " + JSON.stringify(debug?.groupsFound || [], null, 2) +
          "\nFetches: " + JSON.stringify(debug?.fetches || [], null, 2) +
          "\nParsed: " + JSON.stringify(debug?.parsedCounts || [], null, 2) +
          "\nErrors: " + JSON.stringify(debug?.errors || [], null, 2);

        body.innerHTML = '<div class="emptyState">No lifestyle items found.</div>';
        status.textContent = "";
        return;
      }

      dbg.style.display = "none";
      body.innerHTML = renderSimpleTiles(list);
      status.textContent = "Updated";
    } catch (e) {
      dbg.style.display = "block";
      dbg.textContent = "FEED CRASH:\n" + String(e && (e.stack || e.message || e));
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
