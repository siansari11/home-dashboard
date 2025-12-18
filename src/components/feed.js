import { loadRssItems } from "../lib/rss.js";

export async function renderFeed(el) {
  el.innerHTML = '<div style="color:var(--muted)">Loading feed…</div>';

  try {
    var result = await loadRssItems();
    var items = Array.isArray(result) ? result : (result.items || []);

    if (!items.length) {
      el.innerHTML =
        '<div style="padding:12px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,0.55)">' +
        '<strong>No feed items</strong>' +
        "</div>";
      return;
    }

    var html = '<div style="display:flex;flex-direction:column;gap:10px;max-height:520px;overflow:auto;padding-right:4px">';

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var title = escapeHtml(it.title || "Untitled");
      var link = escapeAttr(it.link || "");
      var source = escapeHtml(it.source || "");
      var img = it.image
        ? '<img src="' + escapeAttr(it.image) + '" style="width:100%;height:100%;object-fit:cover" />'
        : '<div style="font-size:12px;color:var(--muted)">No image</div>';

      html +=
        '<div style="display:grid;grid-template-columns:96px 1fr auto;gap:12px;padding:10px;border-radius:16px;background:rgba(255,255,255,0.55);border:1px solid var(--line);align-items:center">' +
          '<div style="width:96px;height:64px;border-radius:12px;overflow:hidden;background:rgba(15,23,42,0.06);display:flex;align-items:center;justify-content:center">' +
            img +
          "</div>" +
          '<div style="min-width:0">' +
            '<a href="' + link + '" target="_blank" rel="noopener" style="display:block;font-weight:900;font-size:14px;line-height:1.25;color:rgba(15,23,42,0.85);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              title +
            "</a>" +
            '<div style="color:var(--muted);font-size:12px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              source +
            "</div>" +
          "</div>" +
          '<button class="qrBtn" data-link="' + link + '" style="border:1px solid var(--line);background:rgba(255,255,255,0.65);border-radius:12px;padding:9px 10px;font-size:14px;cursor:pointer">📱</button>' +
        "</div>";
    }

    html += "</div>";
    el.innerHTML = html;

    var btns = el.querySelectorAll(".qrBtn");
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener("click", function (e) {
        var url = e.currentTarget.getAttribute("data-link");
        if (url) showQrOverlay(url);
      });
    }

  } catch (err) {
    el.innerHTML =
      '<div style="padding:12px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,0.55)">' +
      "<strong>Feed error</strong><pre style='font-size:12px;color:var(--muted)'>" +
      escapeHtml(String(err)) +
      "</pre></div>";
  }
}

function showQrOverlay(url) {
  var old = document.getElementById("qrOverlay");
  if (old) old.remove();

  var overlay = document.createElement("div");
  overlay.id = "qrOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.right = "0";
  overlay.style.bottom = "0";
  overlay.style.background = "rgba(0,0,0,0.45)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  var box = document.createElement("div");
  box.style.background = "white";
  box.style.borderRadius = "20px";
  box.style.padding = "16px";
  box.style.textAlign = "center";
  box.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";

  var img = document.createElement("img");
  img.width = 220;
  img.height = 220;
  img.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(url);

  var txt = document.createElement("div");
  txt.textContent = "Scan to open on phone";
  txt.style.marginTop = "10px";
  txt.style.fontSize = "13px";

  box.appendChild(img);
  box.appendChild(txt);
  overlay.appendChild(box);

  overlay.addEventListener("click", function () {
    overlay.remove();
  });

  document.body.appendChild(overlay);
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];
  });
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
