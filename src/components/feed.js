import { loadRssItems } from "../lib/rss.js";

export async function renderFeed(el) {
  el.innerHTML = `<div style="color:var(--muted)">Loading feed…</div>`;

  try {
    const result = await loadRssItems();

    // Support both return styles:
    // - old: { items, debug }
    // - old-old: items[]
    const items = Array.isArray(result) ? result : (result.items || []);
    const debug = Array.isArray(result) ? [] : (result.debug || []);

    if (!items.length) {
      el.innerHTML = `
        <div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">
          <div style="font-weight:900; color:rgba(15,23,42,0.75)">No feed items loaded</div>
          <div style="margin-top:8px; font-size:12px; color:var(--muted); white-space:pre-wrap;">
            ${escapeHtml(debug.join("\n\n") || "No debug details.")}
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div id="feedList" style="display:flex; flex-direction:column; gap:10px; max-height:520px; overflow:auto; padding-right:4px">
        ${items.map((i) => `
          <div
            style="
              display:grid;
              grid-template-columns: 96px 1fr auto;
              gap:12px;
              padding:10px;
              border-radius:16px;
              background:rgba(255,255,255,0.55);
              border:1px solid var(--line);
              align-items:center;
            ">
            <div style="width:96px; height:64px; border-radius:12px; overflow:hidden; background:rgba(15,23,42,0.06); display:flex; align-items:center; justify-content:center;">
              ${i.image ? `<img src="${escapeAttr(i.image)}" style="width:100%; height:100%; object-fit:cover" alt="">`
                        : `<span style="color:var(--muted); font-size:12px">No image</span>`}
            </div>

            <div style="min-width:0;">
              <a href="${escapeAttr(i.link || "#")}" target="_blank" rel="noopener"
                 style="display:block; font-weight:900; font-size:14px; line-height:1.25; color:rgba(15,23,42,0.85);
                        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${escapeHtml(i.title || "Untitled")}
              </a>
              <div style="color:var(--muted); font-size:12px; margin-top:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${escapeHtml(i.source || "")}
              </div>
            </div>

            <button class="qrBtn"
              data-link="${escapeAttr(i.link || "")}"
              style="
                border:1px solid var(--line);
                background:rgba(255,255,255,0.65);
                border-radius:12px;
                padding:9px 10px;
                font-size:14px;
                cursor:pointer;
              "
              aria-label="Show QR">
              📱
            </button>
          </div>
        `).join("")}
      </div>
    `;

    // Wire QR buttons safely (no inline onclick)
    el.querySelectorAll(".qrBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const link = btn.getAttribute("data-link") || "";
        if (!link || link === "#") return;
        showQrOverlay(link);
      });
    });

  } catch (err) {
    el.innerHTML = `
      <div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">
        <div style="font-weight:900; color:rgba(15,23,42,0.75)">Feed crashed</div>
        <div style="margin-top:8px; font-size:12px; color:var(--muted); white-space:pre-wrap;">
          ${escapeHtml(String(err?.stack || err))}
        </div>
      </div>
    `;
  }
}

function showQrOverlay(url) {
  // remove existing overlay if any
  const old =
