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
    if (next === null) return; // cancelled
    setIcsUrl(next);
    renderAgenda(el); // re-render
  });

  const body = el.querySelector("#calBody");
  const { events, debug } = await loadUpcomingEvents();

  if (!getIcsUrl()){
    body.innerHTML = `
      <div style="padding:10px; border:1px solid var(--line); border-radius:14px; background:rgba(255,255,255,0.55)">
        <div style="font-weight:900; color:rgba(15,23,42,0.75)">Connect your calendar</div>
        <div style="margin-top:6px; font-size:13px;">
          On a computer: Google Calendar → Settings → your calendar → Integrate calendar → “Secret address in iCal format”. 3
        </div>
      </div>
    `;
    return;
  }

  if (!events.length){
    body.innerHTML = `
      <div style="padding:10px; border:1px solid var(--line); border-radius:14px; background:rgba(255,255,255,0.55)">
        <div style="font-weight:900; color:rgba(15,23,42,0.75)">No upcoming events found</div>
        <div style="margin-top:6px; font-size:12px; white-space:pre-wrap;">${escapeHtml(debug)}</div>
      </div>
    `;
    return;
  }

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px">
      ${events.map((e, idx) => `
        <div style="display:flex; justify-content:space-between; gap:12px; padding:10px; border-radius:14px;
                    background:rgba(255,255,255,0.55); border:1px solid var(--line);">
          <div style="min-width:0">
            <strong style="display:block; font-size:14px; color:rgba(15,23,42,0.80); overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
              ${escapeHtml(e.summary || "Event")}
            </strong>
            <small style="color:var(--muted); font-size:12px">
              ${formatWhen(e)}${e.location ? " • " + escapeHtml(e.location) : ""}
            </small>
          </div>
          <button
            style="border:1px solid var(--line); background:rgba(255,255,255,0.65); color:rgba(15,23,42,0.72);
                   border-radius:12px; padding:10px 12px; font-weight:900; font-size:13px; white-space:nowrap"
            onclick="window.__showEvent(${idx})">
            Details
          </button>
        </div>
      `).join("")}
    </div>
  `;

  // lightweight modal (no dependencies)
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

function formatWhen(e){
  const start = e.start instanceof Date ? e.start : null;
  if (!start) return "—";
  const date = start.toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" });
  const time = e.dtstartRaw && /^\d{8}$/.test(e.dtstartRaw)
    ? "All day"
    : start.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return `${date} • ${time}`;
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
