// src/components/reels.js
import "../styles/reels.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { REELS_CONFIG } from "../config/reels.config.js";
import { loadReels } from "../lib/reels.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = "";

  var header = document.createElement("div");
  header.className = "reelsHeader";

  var pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "🎬 Reels";

  var status = document.createElement("div");
  status.className = "reelsStatus";
  status.textContent = "";

  header.append(pill, status);

  var body = document.createElement("div");
  body.className = "reelsBody";
  body.textContent = "Loading…";

  el.append(header, body);

  async function refresh(){
    status.textContent = "Updating…";
    body.textContent = "Loading…";

    try {
      var items = await loadReels();

      if (!items.length){
        body.textContent = "No reels found (yet).";
        status.textContent = "";
        return;
      }

      body.innerHTML = "";
      var list = document.createElement("div");
      list.className = "reelsList";
      body.appendChild(list);

      for (var i = 0; i < items.length; i++){
        var it = items[i];

        var card = document.createElement("a");
        card.className = "reelsCard";
        card.href = it.link;
        card.target = "_blank";
        card.rel = "noreferrer";

        var media = document.createElement("div");
        media.className = "reelsMedia";

        if (it.image){
          var img = document.createElement("img");
          img.className = "reelsThumb";
          img.src = it.image;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          media.appendChild(img);
        } else {
          var ph = document.createElement("div");
          ph.className = "reelsPlaceholder";
          ph.textContent = REELS_CONFIG.placeholderEmoji || "🎬";
          media.appendChild(ph);
        }

        var meta = document.createElement("div");
        meta.className = "reelsMeta";

        var titleRow = document.createElement("div");
        titleRow.className = "reelsTitleRow";

        // Tiny QR inline (before title)
        var qr = document.createElement("img");
        qr.className = "reelsQr";
        qr.alt = "QR";
        qr.src = makeQrDataUrl(it.link, 72);

        var title = document.createElement("div");
        title.className = "reelsTitle";
        title.textContent = it.title || "Instagram Reel";

        titleRow.append(qr, title);

        meta.appendChild(titleRow);

        card.append(media, meta);
        list.appendChild(card);
      }

      status.textContent = "Updated";
    } catch (e) {
      body.textContent = "Reels failed to load.";
      status.textContent = "";
    }
  }

  await refresh();

  var refreshMs = (REELS_CONFIG && REELS_CONFIG.refreshMs) ? REELS_CONFIG.refreshMs : 15 * 60 * 1000;
  setInterval(refresh, refreshMs);
}
