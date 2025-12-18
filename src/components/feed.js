import { loadRssItems } from '../lib/rss.js';

export async function renderFeed(el){
  const items = await loadRssItems();

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px; max-height:520px; overflow:auto; padding-right:4px">
      ${items.map(i => `
        <a href="${escapeAttr(i.link || "#")}" target="_blank" rel="noopener"
           style="display:grid; grid-template-columns:96px 1fr; gap:12px; padding:10px; border-radius:16px;
                  background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); align-items:center;">
          <div style="width:96px; height:64px; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">
            ${i.image ? `<img src="${escapeAttr(i.image)}" style="width:100%; height:100%; object-fit:cover" alt="">`
                      : `<span style="color:var(--muted); font-size:12px">No image</span>`}
          </div>
          <div>
            <div style="font-weight:800; font-size:14px; line-height:1.25">${escapeHtml(i.title)}</div>
            <div style="color:var(--muted); font-size:12px; margin-top:6px">${escapeHtml(i.source)}</div>
          </div>
        </a>
      `).join("")}
    </div>
    <div style="color:var(--muted); font-size:12px; margin-top:8px">
      Pilot mode: RSS uses a free CORS proxy. Pi later = stable + cached + QR per item.
    </div>
  `;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }
