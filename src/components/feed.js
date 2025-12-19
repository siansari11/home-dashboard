// src/components/feed.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadFeedItems } from "../lib/rss.js";

export async function renderFeed(el){
  el.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">' +
      '<div class="pill">📰 Feed</div>' +
      '<div id="feedStatus" style="font-size:12px; color:var(--muted);"></div>' +
    "</div>" +
    '<div id="feedBody" style="color:var(--muted)">Loading…</div>';

  var status = el.querySelector("#feedStatus");
  var body = el.querySelector("#feedBody");

  async function refresh(){
    status.textContent = "Updating…";
    try {
      var items = await loadFeedItems();

      if (!items.length) {
        body.innerHTML =
          '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
            '<div style="font-weight:900; color:rgba(15,23,42,0.75)">No feed items found</div>' +
            '<div style="margin-top:6px; font-size:13px;">Try adding/changing feed URLs in <code>src/config/feeds.js</code>.</div>' +
          "</div>";
        status.textContent = "";
        return;
      }

      var html = '<div style="display:flex; flex-direction:column; gap:10px;">';

      for (var i = 0; i < items.length; i++){
        var it = items[i];

        html +=
          '<a href="' + escapeAttr(it.link) + '" target="_blank" rel="noreferrer" ' +
             'style="text-decoration:none; color:inherit;">' +
            '<div style="display:grid; grid-template-columns:92px 1fr; gap:10px; padding:10px; border:1px solid var(--line);' +
                        'border-radius:16px; background:rgba(255,255,255,0.55); align-items:center;">' +

              (it.image
                ? '<img src="' + escapeAttr(it.image) + '" alt="" style="width:92px; height:64px; object-fit:cover; border-radius:12px; border:1px solid rgba(15,23,42,0.10);" />'
                : '<div style="width:92px; height:64px; border-radius:12px; border:1px solid rgba(15,23,42,0.10); background:rgba(15,23,42,0.04);"></div>'
              ) +

              '<div style="min-width:0;">' +
                '<div style="font-weight:900; color:rgba(15,23,42,0.80); font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                  escapeHtml(it.title) +
                "</div>" +
                '<div style="margin-top:4px; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                  escapeHtml(it.groupTitle || "") +
                "</div>" +
              "</div>" +

            "</div>" +
          "</a>";
      }

      html += "</div>";
      body.innerHTML = html;
      status.textContent = "Updated";
    } catch (e) {
      body.innerHTML =
        '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
          '<div style="font-weight:900; color:rgba(15,23,42,0.75)">Feed failed to load</div>' +
          '<div style="margin-top:8px; font-size:12px; white-space:pre-wrap;">' + escapeHtml(String(e && (e.stack || e))) + "</div>" +
        "</div>";
      status.textContent = "";
    }
  }

  await refresh();

  var refreshMs = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.refreshMs) ? DASHBOARD_CONFIG.rss.refreshMs : 10 * 60 * 1000;
  setInterval(refresh, refreshMs);
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m];
  });
}

function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}
