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
    <div id="lifeStage" class="tileStage tileFadeIn"></div>
  `;

  var status = el.querySelector("#lifeStatus");
  var stage = el.querySelector("#lifeStage");

  var items = [];
  var idx = 0;
  var rotateMs = 30 * 1000;
  var timer = null;

  function safeTitle(it){
    return (it && it.title) ? String(it.title) : "Lifestyle item";
  }

  function safeSource(it){
    return (it && it.groupTitle) ? String(it.groupTitle) : "";
  }

  function safeLink(it){
    return (it && it.link) ? String(it.link) : "";
  }

  function safeImg(it){
    return (it && it.image) ? String(it.image) : "";
  }

  function renderCurrent(){
    if (!items.length){
      stage.innerHTML = `<div class="tilePlaceholder">🏠</div>`;
      return;
    }

    var it = items[idx % items.length];
    var link = safeLink(it);
    var title = safeTitle(it);
    var sub = safeSource(it);
    var img = safeImg(it);
    var qr = makeQrDataUrl(link, 80);

    stage.classList.remove("tileFadeIn");
    stage.classList.add("tileFadeOut");

    setTimeout(function(){
      stage.classList.remove("tileFadeOut");
      stage.classList.add("tileFadeIn");

      stage.innerHTML = `
        <a class="tileLink" href="${escapeAttr(link)}" target="_blank" rel="noreferrer">
          ${
            img
              ? `<img class="tileImg" src="${escapeAttr(img)}" alt="" />`
              : `<div class="tilePlaceholder">🏠</div>`
          }
          <div class="tileOverlay">
            <div class="tileTitleRow">
              <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
              <div class="tileTitle">${escapeHtml(title)}</div>
            </div>
            ${sub ? `<div class="tileSub">${escapeHtml(sub)}</div>` : ``}
          </div>
        </a>
      `;

      // If image fails, switch to placeholder (no broken tile)
      var imgEl = stage.querySelector(".tileImg");
      if (imgEl){
        imgEl.addEventListener("error", function(){
          stage.querySelector(".tileLink").innerHTML = `
            <div class="tilePlaceholder">🏠</div>
            <div class="tileOverlay">
              <div class="tileTitleRow">
                <img class="tileQr" alt="QR" src="${escapeAttr(qr)}" />
                <div class="tileTitle">${escapeHtml(title)}</div>
              </div>
              ${sub ? `<div class="tileSub">${escapeHtml(sub)}</div>` : ``}
            </div>
          `;
        }, { once:true });
      }
    }, 420);
  }

  function next(){
    if (!items.length) return;
    idx = (idx + 1) % items.length;
    renderCurrent();
  }

  function prev(){
    if (!items.length) return;
    idx = (idx - 1 + items.length) % items.length;
    renderCurrent();
  }

  function startAuto(){
    stopAuto();
    timer = setInterval(next, rotateMs);
  }

  function stopAuto(){
    if (timer) clearInterval(timer);
    timer = null;
  }

  // Swipe controls (up/down or left/right)
  wireSwipe(stage, function(dir){
    // any swipe pauses the timer briefly and restarts
    stopAuto();
    if (dir === "next") next();
    else prev();
    startAuto();
  });

  async function refresh(){
    status.textContent = "Updating…";
    try {
      items = await loadRssItems();
      idx = 0;

      if (!items.length){
        status.textContent = "";
        stage.innerHTML = `<div class="tilePlaceholder">🏠</div>`;
        return;
      }

      status.textContent = "Updated";
      renderCurrent();
      startAuto();
    } catch (e) {
      status.textContent = "";
      stage.innerHTML = `<div class="tilePlaceholder">⚠️</div>`;
    }
  }

  await refresh();

  var refreshMs = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.refreshMs) ? DASHBOARD_CONFIG.rss.refreshMs : 10 * 60 * 1000;
  setInterval(refresh, refreshMs);
}

function wireSwipe(el, onDir){
  var startX = 0, startY = 0, moved = false;
  var active = false;

  el.addEventListener("pointerdown", function(e){
    active = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  el.addEventListener("pointermove", function(e){
    if (!active) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
  });

  el.addEventListener("pointerup", function(e){
    if (!active) return;
    active = false;

    var dx = e.clientX - startX;
    var dy = e.clientY - startY;

    var ax = Math.abs(dx), ay = Math.abs(dy);
    var threshold = 32;

    if (ax < threshold && ay < threshold) return;

    // If user swiped, avoid accidental click-open
    if (moved) e.preventDefault();

    // Decide direction
    if (ax >= ay){
      // horizontal swipe: left = next, right = prev
      onDir(dx < 0 ? "next" : "prev");
    } else {
      // vertical swipe: up = next, down = prev
      onDir(dy < 0 ? "next" : "prev");
    }
  });
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m];
  });
}
function escapeAttr(s){
  return escapeHtml(String(s || "")).replace(/"/g, "&quot;");
}
