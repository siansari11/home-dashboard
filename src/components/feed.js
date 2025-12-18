import { loadRssItems } from '../lib/rss.js';

export async function renderFeed(el) {
  el.innerHTML = `<div style="color:var(--muted)">Loading feed…</div>`;

  const { items, debug } = await loadRssItems();

  if (!items.length) {
    el.innerHTML = `
      <div style="padding:12px; border:1px solid rgba(255,255,255,0.10); border-radius:14px; background:rgba(255,255,255,0.03)">
        <div style="font-weight:800; margin-bottom:6px">No feed items loaded</div>
        <div style="color:var(--muted); font-size:13px; white-space:pre-wrap">${escapeHtml(debug.join("\\n\\n"))}</div>
        <div style="color:var(--muted); font-size:12px; margin-top:8px">
          Pilot mode note: browsers need CORS proxies for RSS, and they can be flaky. 4
        </div>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; max-height:520px; overflow:auto; padding-right:4px">
      ${items.map(i => `
        <div class="feed-item">
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <div style="flex:1; min-width:0;">
            <a href="${item.link}" target="_blank"
             style="font-weight:900; color:rgba(15,23,42,0.85); text-decoration:none;">
            ${item.title}</a>
            <div style="font-size:12px; color:var(--muted); margin-top:4px;">
            ${item.source}</div>
          </div>
          <button
          aria-label="Show QR"
          onclick="window.__showQr('${encodeURIComponent(item.link)}')"
          style="
            border:1px solid var(--line);
            background:rgba(255,255,255,0.6);
            border-radius:10px;
            padding:8px;
            font-size:14px;
            cursor:pointer;">
            📱
          </button>
        </div>
      </div>
      `).join("")}
    </div>
  `;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }
