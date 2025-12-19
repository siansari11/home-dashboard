// src/components/reels.js
import "../styles/tiles.css";
import { FOOD_CONFIG } from "../config/reels.config.js";
import { loadReels } from "../lib/reels.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = `
    <div class="tileHeader">
      <div class="pill">🍽️ Food</div>
      <div class="tileNav">
        <button id="foodPrev" class="tileNavBtn" aria-label="Previous">
          ${arrowSvg("left")}
        </button>
        <button id="foodNext" class="tileNavBtn" aria-label="Next">
          ${arrowSvg("right")}
        </button>
        <div id="foodStatus" class="tileStatus"></div>
      </div>
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

  carousel.addEventListener("pointerdown", stopAuto);
  carousel.addEventListener("touchstart", stopAuto, { passive:true });
  carousel.addEventListener("pointerup", startAuto);
  carousel.addEventListener("touchend", startAuto);

  el.querySelector("#foodNext").addEventListener("click", function(){
    stopAuto(); nextPage(); startAuto();
  });
  el.querySelector("#foodPrev").addEventListener("click", function(){
    stopAuto(); prevPage(); startAuto();
  });

  window.addEventListener("resize", function(){ startAuto(); });

  function render(){
    carousel.innerHTML = "";

    var ph = (FOOD_CONFIG && FOOD_CONFIG.placeholderEmoji) ? FOOD_CONFIG.placeholderEmoji : "🍽️";

    if (!items.length){
      carousel.innerHTML = `<div class="tileItem"><div class="tilePlaceholder">${escapeHtml(ph)}</div></div>`;
      return;
    }

    for (var i = 0; i < items.length; i++){
      var it = items[i];
      var link = String(it.link || "");
      if (!link) continue;

      var title = String(it.title || "Food item");
      var img = String(it.image || "");
      var qr = makeQrDataUrl(link, 80);

      var tile = document.createElement("div");
      tile.className = "tileItem";

      tile.innerHTML = `
        <a class="tileLink" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">
          <div class="tileImgWrap">
            ${img ? `<img class="tileImg" src="${escapeAttr(img)}" alt="" />` : `<div class="tilePlaceholder">${escapeHtml(ph)}</div>`}
          </div>

          <div class="tileBody">
            <div class="tileTop">
              <div class="tileTitleRow">
                <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
                <div class="tileTitle">${escapeHtml(title)}</div>
              </div>
              <div class="tileSub">Swipe or use arrows</div>
            </div>

            <div class="tileHint">Tap opens the item</div>
          </div>
        </a>
      `;

      var imgEl = tile.querySelector(".tileImg");
      if (imgEl){
        imgEl.addEventListener("error", function(){
          var wrap = this.closest(".tileImgWrap");
          if (wrap) wrap.innerHTML = `<div class="tilePlaceholder">${escapeHtml(ph)}</div>`;
        }, { once:true });
      }

      carousel.appendChild(tile);
    }
  }

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
  startAuto();
}

function arrowSvg(dir){
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
