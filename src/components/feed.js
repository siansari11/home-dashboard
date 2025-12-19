// src/components/feed.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";

export async function renderFeed(el){
  el.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">' +
      '<div class="pill">📰 Feed</div>' +
      '<div id="feedStatus" style="font-size:12px; color:var(--muted);"></div>' +
    "</div>" +
    '<div id="feedBody" style="color:var(--muted)">Loading…</div>';

  var status = el.querySelector("#feedStatus");
  var body = el.querySelector("#feedBody");

  function qrUrl(link){
    var data = encodeURIComponent(String(link || "").trim());
    // small but scannable
    return "https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=" + data;
  }

  async function refresh(){
    status.textContent = "Updating…";
    try {
      var items = await loadRssItems();

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
        var id = "fi_" + i;

        html +=
          '<div ' +
            'style="display:grid; grid-template-columns:92px 1fr; gap:10px; padding:10px; border:1px solid var(--line);' +
                   'border-radius:16px; background:rgba(255,255,255,0.55); align-items:center;">' +

            (it.image
              ? '<img src="' + escapeAttr(it.image) + '" alt="" ' +
                   'style="width:92px; height:64px; object-fit:cover; border-radius:12px; border:1px solid rgba(15,23,42,0.10);" />'
              : '<div style="width:92px; height:64px; border-radius:12px; border:1px solid rgba(15,23,42,0.10); background:rgba(15,23,42,0.04);"></div>'
            ) +

            '<div style="min-width:0;">' +

              // Title (clickable)
              '<a href="' + escapeAttr(it.link) + '" target="_blank" rel="noreferrer" ' +
                 'style="text-decoration:none; color:inherit; display:block;">' +
                '<div style="font-weight:900; color:rgba(15,23,42,0.80); font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                  escapeHtml(it.title) +
                "</div>" +
              "</a>" +

              // Group/subtitle
              '<div style="margin-top:4px; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                escapeHtml(it.groupTitle || "") +
              "</div>" +

              // Actions row
              '<div style="margin-top:8px; display:flex; gap:8px; align-items:center;">' +

                '<a href="' + escapeAttr(it.link) + '" target="_blank" rel="noreferrer" ' +
                   'style="text-decoration:none; font-size:12px; font-weight:800; padding:6px 10px; border-radius:12px; ' +
                          'border:1px solid rgba(15,23,42,0.12); background:rgba(255,255,255,0.65); color:rgba(15,23,42,0.75);">' +
                  'Open' +
                "</a>" +

                '<button type="button" data-qr-btn="' + escapeAttr(id) + '" data-link="' + escapeAttr(it.link) + '" ' +
                   'style="font-size:12px; font-weight:800; padding:6px 10px; border-radius:12px; cursor:pointer; ' +
                          'border:1px solid rgba(15,23,42,0.12); background:rgba(255,255,255,0.65); color:rgba(15,23,42,0.75);">' +
                  "QR" +
                "</button>" +

              "</div>" +

              // QR panel (hidden by default)
              '<div id="' + escapeAttr(id) + '" style="display:none; margin-top:10px; gap:10px; align-items:center;">' +
                '<img data-qr-img="' + escapeAttr(id) + '" alt="QR" ' +
                     'style="width:110px; height:110px; border-radius:12px; border:1px solid rgba(15,23,42,0.10); background:rgba(255,255,255,0.7);" />' +
                '<div style="font-size:12px; color:rgba(15,23,42,0.60);">Scan to open on phone</div>' +
              "</div>" +

            "</div>" +
          "</div>";
      }

      html += "</div>";
      body.innerHTML = html;

      // Wire up QR buttons
      var btns = body.querySelectorAll("[data-qr-btn]");
      for (var b = 0; b < btns.length; b++){
        btns[b].addEventListener("click", function(ev){
          ev.preventDefault();
          ev.stopPropagation();

          var panelId = this.getAttribute("data-qr-btn");
          var link = this.getAttribute("data-link") || "";
          var panel = body.querySelector("#" + CSS.escape(panelId));
          if (!panel) return;

          var isOpen = panel.style.display !== "none";
          panel.style.display = isOpen ? "none" : "flex";

          if (!isOpen) {
            var img = panel.querySelector('[data-qr-img="' + panelId + '"]');
            if (img && !img.getAttribute("src")) img.setAttribute("src", qrUrl(link));
          }
        });
      }

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
