// src/components/feed.js
import "../styles/tiles.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderFeed(el){
  el.innerHTML = `
    <div class="tileHeader">
      <div class="pill">🏠 Lifestyle</div>
      <div class="tileNav">
        <button id="lifePrev" class="tileNavBtn" aria-label="Previous">
          ${arrowSvg("left")}
        </button>
        <button id="lifeNext" class="tileNavBtn" aria-label="Next">
          ${arrowSvg("right")}
        </button>
        <div id="lifeStatus" class="tileStatus"></div>
      </div>
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

  function scrollToIndex(nextIndex){
    var tile = carousel.children[nextIndex];
    if (!tile) return;
    tile.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function nextPage(){
    var pv = perViewNow();
    var first = getFirstVisibleIndex();
    var next = first + pv;
    if (next >= carousel.children.length) next = 0;
    scrollToIndex(next);
  }

  function prevPage(){
    var pv = perViewNow();
    var first = getFirstVisibleIndex();
    var prev = first - pv;
    if (prev < 0) prev = Math.max(0, carousel.children.length - pv);
    scrollToIndex(prev);
  }

  function startAuto(){
    stopAuto();
    autoTimer = setInterval(function(){
      if (!items.length) return;
      nextPage();
    }, rotateMs);
  }

  function stopAuto(){
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  // pause auto while user interacts
  carousel.addEventListener("pointerdown", stopAuto);
  carousel.addEventListener("touchstart", stopAuto, { passive:true });
  carousel.addEventListener("pointerup", startAuto);
  carousel.addEventListener("touchend", startAuto);

  el.querySelector("#lifeNext").addEventListener("click", function(){
    stopAuto(); nextPage(); startAuto();
  });
  el.querySelector("#lifePrev").addEventListener("click", function(){
    stopAuto(); prevPage(); startAuto();
  });

  window.addEventListener("resize", function(){ startAuto(); });

  function render(){
    carousel.innerHTML = "";

    if (!items.length){
      carousel.innerHTML = `<div class="tileItem"><div class="tilePlaceholder">🏠</div></div>`;
      return;
    }

    for (var i = 0; i < items.length; i++){
      var it = items[i];
      var link = String(it.link || "");
      if (!link) continue;

      var title = String(it.title || "Lifestyle item");
      var sub = String(it.groupTitle || "");
      var img = String(it.image || "");
      var desc = String(it.description || it.excerpt || "").trim();
      var qr = makeQrDataUrl(link, 80);

      var tile = document.createElement("div");
      tile.className = "tileItem";

      tile.innerHTML = `
        <a class="tileLink" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">
          <div class="tileImgWrap">
            ${img ? `<img class="tileImg" src="${escapeAttr(img)}" alt="" />` : `<div class="tilePlaceholder">🏠</div>`}
          </div>

          <div class="tileBody">
            <div class="tileTop">
              <div class="tileTitleRow">
                <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
                <div class="tileTitle">${escapeHtml(title)}</div>
              </div>

              ${sub ? `<div class="tileSub">${escapeHtml(sub)}</div>` : ``}
              ${desc ? `<div class="tileDesc">${escapeHtml(desc)}</div>` : ``}
            </div>

            <div class="tileHint">Swipe or use arrows</div>
          </div>
        </a>
      `;

      // image fallback
      var imgEl = tile.querySelector(".tileImg");
      if (imgEl){
        imgEl.addEventListener("error", function(){
          var wrap = this.closest(".tileImgWrap");
          if (wrap) wrap.innerHTML = `<div class="tilePlaceholder">🏠</div>`;
        }, { once:true });
      }

      carousel.appendChild(tile);
    }
  }

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

function arrowSvg(dir){
  // Simple inline SVG string (not “inline styles”)
  var d = dir === "left"
    ? "M15 4 L7 12 L15 20"
    : "M9 4 L17 12 L9 20";
  return `<svg class="tileNavIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m];
  });
}
function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}
