export function renderAgenda(el){
  const items = [
    { title:"(Mock) Next appointment", time:"Tomorrow 10:00", note:"Replace with calendar later" },
    { title:"(Mock) Tasks sync", time:"When Pi arrives", note:"Google Tasks / CalDAV" }
  ];

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px">
      ${items.map(it => `
        <div style="display:flex; justify-content:space-between; gap:12px; padding:10px; border-radius:14px;
                    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);">
          <div>
            <strong style="display:block; font-size:14px">${it.title}</strong>
            <small style="color:var(--muted); font-size:12px">${it.time} • ${it.note}</small>
          </div>
          <button style="border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.06); color:var(--text);
                         border-radius:12px; padding:10px 12px; font-weight:700; font-size:13px"
                  onclick="alert('Details\\n\\n${it.title}\\n${it.time}\\n${it.note}')">
            Details
          </button>
        </div>
      `).join("")}
    </div>
  `;
}
