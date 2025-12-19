// src/components/feed.js
import "../styles/feed.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";

function qrUrl(link, size){
  var data = encodeURIComponent(String(link || "").trim());
  return "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "&data=" + data;
}

export async function renderFeed(el){
  el.innerHTML = "";

  // Header
  var header = document.createElement("div");
  header.className = "feedHeader";

  var pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "📰 Feed";

  var status = document.createElement("div");
  status.id = "feedStatus";
  status.className = "feedStatus";

  header.append(pill, status);

  // Body
  var body = document.createElement("div");
  body.id = "feedBody";
  body.className = "feedBody";
  body.textContent = "Loading…";

  el.append(header, body);

  function renderNotice(titleText, detailText, isError, errorRaw){
    body.innerHTML = "";

    var box = document.createElement("div");
    box.className = "feedCardNotice";

    var t = document.createElement("div");
    t.className = "feedCardNotice__title";
    t.textContent = titleText;

    box.appendChild(t);

    if (detailText){
      var p = document.createElement("div");
      p.className = "feedCardNotice__text";
      // allow a code tag if you passed one; otherwise plain text
      p.innerHTML = detailText;
      box.appendChild(p);
    }

    if (isError){
      var err = document.createElement("div");
      err.className = "feedCardNotice__error";
      err.textContent = String(errorRaw || "");
      box.appendChild(err);
    }

    body.appendChild(box);
  }

  function makeItemCard(it, index){
    var card = document.createElement("div");
    card.className = "feedItem";

    // Thumb
    if (it.image){
      var img = document.createElement("img");
      img.className = "feedThumbImg";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = it.image;
      card.appendChild(img);
    } else {
      var ph = document.createElement("div");
      ph.className = "feedThumbPlaceholder";
      card.appendChild(ph);
    }

    // Content
    var content = document.createElement("div");
    content.className = "feedItem__content";

    // Title row
    var titleRow = document.createElement("div");
    titleRow.className = "feedTitleRow";

    var a = document.createElement("a");
    a.className = "feedTitleLink";
    a.href = it.link || "#";
    a.target = "_blank";
    a.rel = "noreferrer";

    var titleText = document.createElement("div");
    titleText.className = "feedTitleText";
    titleText.textContent = it.title || "(untitled)";

    a.appendChild(titleText);

    // Tiny QR icon
    var tinyQr = document.createElement("img");
    tinyQr.className = "feedTinyQr";
    tinyQr.alt = "QR";
    tinyQr.loading = "lazy";
    tinyQr.decoding = "async";
    tinyQr.src = qrUrl(it.link, "32x32");

    titleRow.append(a, tinyQr);

    // Group title
    var group = document.createElement("div");
    group.className = "feedGroupTitle";
    group.textContent = it.groupTitle || "";

    // QR panel
    var panel = document.createElement("div");
    panel.className = "feedQrPanel";

    var bigQr = document.createElement("img");
    bigQr.className = "feedQrBig";
    bigQr.alt = "QR";

    var hint = document.createElement("div");
    hint.className = "feedQrHint";
    hint.textContent = "Scan to open on phone";

    panel.append(bigQr, hint);

    // Toggle QR panel on tiny-QR click
    tinyQr.addEventListener("click", function(ev){
      ev.preventDefault();
      ev.stopPropagation();

      var open = panel.classList.contains("feedQrPanel--open");
      if (open) {
        panel.classList.remove("feedQrPanel--open");
        return;
      }

      panel.classList.add("feedQrPanel--open");

      // Only generate big QR when opened
      if (!bigQr.src) bigQr.src = qrUrl(it.link, "110x110");
    });

    content.append(titleRow, group, panel);
    card.appendChild(content);

    return card;
  }

  async function refresh(){
    status.textContent = "Updating…";

    try {
      var items = await loadRssItems();

      if (!items || !items.length){
        renderNotice(
          "No feed items found",
          'Try adding/changing feed URLs in <code>src/config/feeds.js</code>.',
          false
        );
        status.textContent = "";
        return;
      }

      body.innerHTML = "";

      var list = document.createElement("div");
      list.className = "feedList";

      for (var i = 0; i < items.length; i++){
        list.appendChild(makeItemCard(items[i], i));
      }

      body.appendChild(list);
      status.textContent = "Updated";
    } catch (e) {
      renderNotice(
        "Feed failed to load",
        null,
        true,
        (e && (e.stack || e.message)) ? (e.stack || e.message) : String(e)
      );
      status.textContent = "";
    }
  }

  await refresh();

  var refreshMs = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.refreshMs)
    ? DASHBOARD_CONFIG.rss.refreshMs
    : 10 * 60 * 1000;

  setInterval(refresh, refreshMs);
}
