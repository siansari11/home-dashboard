// src/components/feed.js
import "../styles/feed.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderFeed(el){
  el.innerHTML = `
    <div class="feedHeader">
      <div class="pill">🏠 Lifestyle</div>
      <div id="feedStatus" class="feedStatus"></div>
    </div>
    <div id="feedBody" class="feedBody">Loading…</div>
  `;

  var status = el.querySelector("#feedStatus");
  var body = el.querySelector("#feedBody");

  async function refresh(){
    status.textContent = "Updating…";
    try {
      var items = await loadRssItems();

      if (!items.length) {
        body.innerHTML = `
          <div class="feedEmpty">
            <div class="feedEmptyTitle">No lifestyle items found</div>
            <div class="feedEmptyText">Try adding/changing feed URLs in <code>src/config/feeds.js</code>.</div>
          </div>
        `;
        status.textContent = "";
        return;
      }

      var html = '<div class="feedList">';

      for (var i = 0; i < items.length; i++){
        var it = items[i];
        var qr = makeQrDataUrl(it.link, 72);

        html += `
          <a href="${escapeAttr(it.link)}" target="_blank" rel="noreferrer" class="feedCard">
            ${it.image
              ? `<img src="${escapeAttr(it.image)}" alt="" class="feedThumb" />`
              : `<div class="feedThumb feedThumb--empty"></div>`
            }

            <div class="feedMeta">
              <div class="feedTitleRow">
                <img class="feedQr" alt="QR" src="${escapeAttr(qr)}" />
                <div class="feedTitle">${escapeHtml(it.title)}</div>
              </div>
              <div class="feedSource">${escapeHtml(it.groupTitle || "")}</div>
            </div>
          </a>
        `;
      }

      html += "</div>";
      body.innerHTML = html;
      status.textContent = "Updated";
    } catch (e) {
      body.innerHTML = `
        <div class="feedEmpty">
          <div class="feedEmptyTitle">Feed failed to load</div>
          <div class="feedEmptyText" style="white-space:pre-wrap;">${escapeHtml(String(e && (e.stack || e)))}</div>
        </div>
      `;
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
