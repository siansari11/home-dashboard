import { getIcsUrl, setIcsUrl, loadUpcomingEvents } from "../lib/calendar.js";

export async function renderAgenda(el){
  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
      <div class="pill">📅 Calendar</div>
      <button id="calBtn"
        style="border:1px solid var(--line); background:rgba(255,255,255,0.55); color:var(--muted);
               border-radius:12px; padding:10px 12px; font-weight:800; font-size:13px">
        ${getIcsUrl() ? "Change link" : "Connect"}
      </button>
    </div>
    <div id="calBody" style="color:var(--muted)">Loading…</div>
  `;

  el.querySelector("#calBtn").addEventListener("click", () => {
    const current = getIcsUrl();
    const next = prompt(
      "Paste your Google Calendar Secret iCal (.ics) link here.\n\nTip: keep it private (don’t put it in GitHub).",
      current || ""
    );
    if (next === null) return;
    setIcsUrl(next);
    renderAgenda(el);
  });

  const body = el.querySelector("#calBody");
  const { events, debug } = await loadUpcomingEvents();

  if (!getIcsUrl()){
    body.innerHTML = `
      <div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">
        <div style="font-weight:900; color:rgba(15,23,42,0.75)">Connect your calendar</div>
        <div style="margin-top:6px; font-size:13px;">
          Google Calendar → Settings → your calendar → Integrate calendar → “Secret address in iCal format”.
        </div>
      </div>
    `;
    return;
  }

  if (!events.length){
    body.innerHTML = `
      <div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">
        <div style="font-weight:900; color:rgba(15,23,42,0.75)">No upcoming events found</div>
        <div style="margin-top:6px; font-size:12px; white-space:pre-wrap;">${escapeHtml(debug)}</div>
      </div>
    `;
    return;
  }

  // Group by day
  const groups = groupByDay(events);

  // Render grouped layout
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px">
      ${groups.map((g, gi) => `
        <div style="
          border:1px solid var(--line);
          border-radius:18px;
          background:rgba(255,255,255,0.55);
          overflow:hidden;
        ">
          <div style="
            padding:10px 12px;
            background:rgba(255,255,255,0.55);
            border-bottom:1px solid var(--line);
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          ">
            <div style="font-weight:900; color:rgba(15,23,42,0.78)">
              ${escapeHtml(g.label)}
            </div>
            <div style="font-size:12px; color:var(--muted)">
              ${g.items.length} ${g.items.length === 1 ? "event" : "events"}
            </div>
          </div>

          <div style="display:flex; flex-direction:column;">
            ${g.items.map((e, ei) => {
              const idx = g._startIndex + ei;
              return `
                <div style="
                  display:grid;
                  grid-template-columns: 86px 1fr auto;
                  gap:10px;
                  padding:10px 12px;
                  align-items:center;
                  border-top: ${ei === 0 ? "none" : "1px solid rgba(15,23,42,0.08)"};
                ">
                  <div style="
                    font-weight:900;
                    color:rgba(15,23,42,0.70);
                    font-size:13px;
                  ">
                    ${escapeHtml(formatTime(e))}
                  </div>

                  <div style="min-width:0;">
                    <div style="
                      font-weight:900;
                      color:rgba(15,23,42,0.80);
                      font-size:14px;
                      overflow:hidden;
                      text-overflow:ellipsis;
                      white-space:nowrap;
                    ">
                      ${escapeHtml(e.summary || "Event")}
                    </div>
                    <div style="color:var(--muted); font-size:12px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      ${e.location ? escapeHtml(e.location) : ""}
                    </div>
                  </div>

                  <button
                    style="
                      border:1px solid var(--line);
                      background:rgba(255,255,255,0.65);
                      color:rgba(15,23,42,0.72);
                      border-radius:12px;
                      padding:9px 10px;
                      font-weight:900;
                      font-size:13px;
                      white-space:nowrap;
                    "
                    onclick="window.__showEvent(${idx})">
                    Details
                  </button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Details modal (simple alert for now)
  window.__showEvent = (idx) => {
    const e = events[idx];
    alert(
      `${e.summary || "Event"}\n\n` +
      `${formatWhen(e)}\n` +
      `${e.location ? "Location: " + e.location + "\n" : ""}` +
      `${e.description ? "\n" + e.description : ""}`
    );
  };
}

function groupByDay(events){
  // Create {key, label, items} groups in order
  const groups = [];
  const map = new Map();

  for (let i = 0; i < events.length; i++){
    const e = events[i];
    const d = e.start instanceof Date ? e.start : null;
    if (!d) continue;

    const key = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    if (!map.has(key)){
      const label = d.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" });
      const g = { key, label, items: [], _startIndex: 0 };
      map.set(key, g);
      groups.push(g);
    }
    map.get(key).items.push(e);
  }

  // compute index mapping back to original events array
  let running = 0;
  for (const g of groups){
    g._startIndex = running;
    running += g.items.length;
  }
  return groups;
}

function formatWhen(e){
  const start = e.start instanceof Date ? e.start : null;
  if (!start) return "—";
  const date = start.toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" });
  return `${date} • ${formatTime(e)}`;
}

function formatTime(e){
  if (e.dtstartRaw && /^\d{8}$/.test(e.dtstartRaw)) return "All day";
  const start = e.start instanceof Date ? e.start : null;
  if (!start) return "—";
  return start.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function pad2(n){ return String(n).padStart(2, "0"); }

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
