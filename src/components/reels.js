// src/components/reels.js
import "../styles/reels.css";
import { FOOD_CONFIG } from "../config/reels.config.js";
import { loadReels } from "../lib/reels.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = "";

  var header = document.createElement("div");
  header.className = "reelsHeader";

  var pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "🍽️ Food";

  var status = document.createElement("div");
  status.className = "reelsStatus";

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
        body.textContent = "No food items found (yet).";
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

        var ph = document.createElement("div");
        ph.className = "reelsPlaceholder";
        ph.textContent = (FOOD_CONFIG && FOOD_CONFIG.placeholderEmoji) ? FOOD_CONFIG.placeholderEmoji : "🍽️";

        if (it.image){
          var img = document.createElement("img");
          img.className = "reelsThumb";
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.src = it.image;

          img.onerror = function(){
            if (img && img.parentNode) {
              img.parentNode.innerHTML = "";
              img.parentNode.appendChild(ph.cloneNode(true));
            }
          };

          media.appendChild(img);
        } else {
          media.appendChild(ph);
        }

        var meta = document.createElement("div");
        meta.className = "reelsMeta";

        var titleRow = document.createElement("div");
        titleRow.className = "reelsTitleRow";

        var qr = document.createElement("img");
        qr.className = "reelsQr";
        qr.alt = "QR";
        qr.src = makeQrDataUrl(it.link, 72);

        var title = document.createElement("div");
        title.className = "reelsTitle";
        title.textContent = it.title || "Food item";

        titleRow.append(qr, title);
        meta.appendChild(titleRow);

        card.append(media, meta);
        list.appendChild(card);
      }

      status.textContent = "Updated";
    } catch (e) {
      body.textContent = "Food failed to load.";
      status.textContent = "";
    }
  }

  await refresh();

  var refreshMs = (FOOD_CONFIG && FOOD_CONFIG.refreshMs) ? FOOD_CONFIG.refreshMs : 10 * 60 * 1000;
  setInterval(refresh, refreshMs);
}
