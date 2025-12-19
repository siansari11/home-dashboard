// src/components/reels.js
import "../styles/tiles.css";
import { FOOD_CONFIG } from "../config/reels.config.js";
import { loadReels } from "../lib/reels.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = `
    <div class="tileHeader">
      <div class="pill">🍽️ Food</div>
      <div id="foodStatus" class="tileStatus"></div>
    </div>
    <div id="foodCarousel" class="tileCarousel" aria-label="Food carousel"></div>
  `;

  var status = el.querySelector("#foodStatus");
  var carousel = el.querySelector("#foodCarousel");

  var items = [];
  var autoTimer = null;
  var rotateMs = 30 * 1000;

  function perViewNow(){
    return window.matchMedia && window.matchMedia("(orientation: portrait)").matches ? 1 : 2;
  }

  function render(){
    carousel.innerHTML = "";

    if (!items.length){
      var empty = document.createElement("div");
      empty.className = "tileItem";
      empty.innerHTML = `<div class="tilePlaceholder">${escapeHtml((FOOD_CONFIG && FOOD_CONFIG.placeholderEmoji) ? FOOD_CONFIG.placeholderEmoji : "🍽️")}</div>`;
      carousel.appendChild(empty);
      return;
    }

    for (var i = 0; i < items.length; i++){
      var it = items[i];
      var link = String(it.link || "");
      if (!link) continue;

      var title = String(it.title || "Food item");
      var img = String(it.image || "");
      var qr = makeQrDataUrl(link, 80);
      var ph = (FOOD_CONFIG && FOOD_CONFIG.placeholderEmoji) ? FOOD_CONFIG.placeholderEmoji : "🍽️";

      var tile = document.createElement("div");
      tile.className = "tileItem";

      tile.innerHTML = `
        <a class="tileLink" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">
          ${img ? `<img class="tileImg" src="${escapeAttr(img)}" alt="" />` : `<div class="tilePlaceholder">${escapeHtml(ph)}</div>`}
          <div class="tileOverlay">
            <div class="tileTitleRow">
              <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
              <div class="tileTitle">${escapeHtml(title)}</div>
            </div>
          </div>
        </a>
      `;

      var imgEl = tile.querySelector(".tileImg");
      if (imgEl){
        imgEl.addEventListener("error", function(){
          var wrap = this.closest(".tileItem");
          if (!wrap) return;
          var linkEl = wrap.querySelector(".tileLink");
          if (!linkEl) return;
          var overlay = wrap.querySelector(".tileOverlay");
          linkEl.innerHTML = `<div class="tilePlaceholder">${escapeHtml(ph)}</div>` + (overlay ? overlay.outerHTML : "");
        }, { once:true });
      }

      carousel.appendChild(tile);
    }
  }

  function scrollToIndex(nextIndex){
    var tile = carousel.children[nextIndex];
    if (!tile) return;
    tile.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function startAuto(){
    stopAuto();
    autoTimer = setInterval(function(){
      if (!items.length) return;

      var pv = perViewNow();
      var firstVisible = getFirstVisibleIndex();
      var next = firstVisible + pv;

      if (next >= carousel.children.length) next = 0;
      scrollToIndex(next);
    }, rotateMs);
  }

  function stopAuto(){
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function getFirstVisibleIndex(){
    var children = carousel.children;
    if (!children.length) return 0;

    var left = carousel.scrollLeft;
    var best = 0;
    var bestDist = Infinity;

    for (var i = 0; i < children.length; i++){
      var d = Math.abs(children[i].offsetLeft - left);
      if (d < bestDist){
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  carousel.addEventListener("pointerdown", stopAuto);
  carousel.addEventListener("touchstart", stopAuto, { passive:true });
  carousel.addEventListener("pointerup", startAuto);
  carousel.addEventListener("touchend", startAuto);

  window.addEventListener("resize", function(){
    startAuto();
  });

  async function refresh(){
    status.textContent = "Updating…";
    try {
      items = await loadReels();
      status.textContent = items.length ? "Updated" : "";
      render();
      startAuto();
    } catch (e) {
      status.textContent = "";
      items = [];
      render();
    }
  }

  await refresh();

  var refreshMs = (FOOD_CONFIG && FOOD_CONFIG.refreshMs) ? FOOD_CONFIG.refreshMs : 10 * 60 * 1000;
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
