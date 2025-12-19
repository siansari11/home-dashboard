// src/components/reels.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = `
    <div class="reelsHeader">
      <div class="pill">🍲 Food</div>
      <div id="reelsStatus" class="reelsStatus"></div>
    </div>
    <div id="reelsBody" class="reelsBody">Loading…</div>
  `;

  const status = el.querySelector("#reelsStatus");
  const body = el.querySelector("#reelsBody");

  async function refresh(){
    status.textContent = "Updating…";

    try{
      // IMPORTANT: loadRssItems is already normalized by rss.js
      // We just filter to "food" group items here.
      const all = await loadRssItems();
      const items = (all || []).filter(x => (x.groupKey || "").toLowerCase() === "food");

      if (!items.length){
        body.innerHTML = `
          <div class="emptyCard">
            <div class="emptyTitle">No food items found</div>
            <div class="emptyText">
              Check <code>src/config/feeds.js</code> and ensure the Food feeds are under group key <b>"food"</b>.
            </div>
          </div>
        `;
        status.textContent = "";
        return;
      }

      // Show a scrollable list of “reel tiles”
      const max = (DASHBOARD_CONFIG.rss?.maxItemsPerGroup) || 10;
      const show = items.slice(0, max);

      let html = `<div class="reelsList">`;

      for (let i = 0; i < show.length; i++){
        const it = show[i];

        const link = String(it.link || "").trim();
        const title = String(it.title || "Untitled").trim();
        const desc = String(it.description || "").trim();

        const img = pickBestImage(it);
        const qr = link ? await makeQrDataUrl(link, 72) : "";

        html += `
          <div class="reelTile">
            <div class="reelMedia">
              ${
                img
                  ? `<img class="reelImg" src="${escapeAttr(img)}" alt="" loading="lazy" />`
                  : `<div class="reelImgPlaceholder"></div>`
              }
            </div>

            <div class="reelText">
              <div class="reelTitle">${escapeHtml(title)}</div>
              <div class="reelDesc">${escapeHtml(desc)}</div>

              <div class="reelMetaRow">
                <div class="reelSource">${escapeHtml(it.groupTitle || "Food")}</div>
                ${
                  qr
                    ? `<img class="reelQr" src="${escapeAttr(qr)}" alt="QR" />`
                    : ``
                }
              </div>
            </div>
          </div>
        `;
      }

      html += `</div>`;
      body.innerHTML = html;
      status.textContent = "Updated";
    } catch (e) {
      body.innerHTML = `
        <div class="emptyCard">
          <div class="emptyTitle">Food failed to load</div>
          <div class="emptyText" style="white-space:pre-wrap">${escapeHtml(String(e?.stack || e))}</div>
        </div>
      `;
      status.textContent = "";
    }
  }

  await refresh();

  const refreshMs = (DASHBOARD_CONFIG.rss?.refreshMs) || (10 * 60 * 1000);
  setInterval(refresh, refreshMs);
}

/** Try multiple common fields, because different RSS sources expose images differently */
function pickBestImage(it){
  // 1) Normalized by our rss.js (feed column used this)
  if (it?.image) return it.image;

  // 2) Common alternates
  if (it?.thumbnail) return it.thumbnail;
  if (it?.imageUrl) return it.imageUrl;

  // 3) Some parsers store arrays
  if (Array.isArray(it?.images) && it.images[0]) return it.images[0];

  // 4) Some RSS provides enclosure URLs
  if (it?.enclosure?.url) return it.enclosure.url;

  return "";
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#039;"
  }[m]));
}
function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}