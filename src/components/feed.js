// src/components/feed.js
import "../styles/tiles.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderFeed(el){
  el.innerHTML = `
    <div class="tileHeader">
      <div class="pill">🏠 Lifestyle</div>
      <div id="lifeStatus" class="tileStatus"></div>
    </div>
    <div id="lifeCarousel" class="tileCarousel" aria-label="Lifestyle carousel"></div>
  `;

  var status = el.querySelector("#lifeStatus");
  var carousel = el.querySelector("#lifeCarousel");

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
      empty.innerHTML = `<div class="tilePlaceholder">🏠</div>`;
      carousel.appendChild(empty);
      return;
    }

    for (var i = 0; i < items.length; i++){
      var it = items[i];
      var link = String(it.link || "");
      if (!link) continue;

      var title = String(it.title || "Lifestyle item");
      var sub = String(it.groupTitle || "");
      var img = String(it.image || "");
      var qr = makeQrDataUrl(link, 80);

      var tile = document.createElement("div");
      tile.className = "tileItem";

      tile.innerHTML = `
        <a class="tileLink" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">
          ${img ? `<img class="tileImg" src="${escapeAttr(img)}" alt="" />` : `<div class="tilePlaceholder">🏠</div>`}
          <div class="tileOverlay">
            <div class="tileTitleRow">
              <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
              <div class="tileTitle">${escapeHtml(title)}</div>
            </div>
            ${sub ? `<div class="tileSub">${escapeHtml(sub)}</div>` : ``}
          </div>
        </a>
      `;

      // if image fails, swap to placeholder
      var imgEl = tile.querySelector(".tileImg");
      if (imgEl){
        imgEl.addEventListener("error", function(){
          var wrap = this.closest(".tileItem");
          if (!wrap) return;
          var linkEl = wrap.querySelector(".tileLink");
          if (!linkEl) return;
          // replace image with placeholder, keep overlay
          var overlay = wrap.querySelector(".tileOverlay");
          linkEl.innerHTML = `<div class="tilePlaceholder">🏠</div>` + (overlay ? overlay.outerHTML : "");
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

  // pause auto while user interacts
  carousel.addEventListener("pointerdown", stopAuto);
  carousel.addEventListener("touchstart", stopAuto, { passive:true });
  carousel.addEventListener("pointerup", startAuto);
  carousel.addEventListener("touchend", startAuto);

  // re-evaluate perView when orientation changes
  window.addEventListener("resize", function(){
    startAuto();
  });

  async function refresh(){
    status.textContent = "Updating…";
    try {
      items = await loadRssItems();
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
