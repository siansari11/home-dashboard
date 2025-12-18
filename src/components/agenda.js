import { getIcsUrl, setIcsUrl, loadUpcomingEvents } from "../lib/calendar.js";

export async function renderAgenda(el){
  el.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">' +
      '<div class="pill">📅 Calendar</div>' +
      '<button id="calBtn" style="border:1px solid var(--line); background:rgba(255,255,255,0.55); color:var(--muted);' +
             'border-radius:12px; padding:10px 12px; font-weight:800; font-size:13px">' +
        (getIcsUrl() ? "Change link" : "Connect") +
      "</button>" +
    "</div>" +
    '<div id="calBody" style="color:var(--muted)">Loading…</div>';

  el.querySelector("#calBtn").addEventListener("click", function () {
    var current = getIcsUrl();
    var next = prompt(
      "Paste your Google Calendar Secret iCal (.ics) link here.\n\nTip: keep it private (don’t put it in GitHub).",
      current || ""
    );
    if (next === null) return;
    setIcsUrl(next);
    renderAgenda(el);
  });

  var body = el.querySelector("#calBody");
  var result = await loadUpcomingEvents();
  var events = result.events || [];
  var debug = result.debug || "";

  // Apply: only Today + next 3 days, but keep earlier events from TODAY (crossed out)
  events = filterToFourDaysWithTodayHistory(events);

  if (!getIcsUrl()){
    body.innerHTML =
      '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
        '<div style="font-weight:900; color:rgba(15,23,42,0.75)">Connect your calendar</div>' +
        '<div style="margin-top:6px; font-size:13px;">' +
          "Google Calendar → Settings → your calendar → Integrate calendar → “Secret address in iCal format”." +
        "</div>" +
      "</div>";
    return;
  }

  if (!events.length){
    body.innerHTML =
      '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
        '<div style="font-weight:900; color:rgba(15,23,42,0.75)">No events in the next 4 days</div>' +
        '<div style="margin-top:6px; font-size:12px; white-space:pre-wrap;">' + escapeHtml(debug) + "</div>" +
      "</div>";
    return;
  }

  // Group by day
  var groups = groupByDay(events);

  // Render grouped layout
  var html = '<div style="display:flex; flex-direction:column; gap:12px">';

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];

    html +=
      '<div style="border:1px solid var(--line); border-radius:18px; background:rgba(255,255,255,0.55); overflow:hidden;">' +
        '<div style="padding:10px 12px; background:rgba(255,255,255,0.55); border-bottom:1px solid var(--line);' +
                    'display:flex; justify-content:space-between; align-items:center; gap:10px;">' +
          '<div style="font-weight:900; color:rgba(15,23,42,0.78)">' + escapeHtml(g.label) + "</div>" +
          '<div style="font-size:12px; color:var(--muted)">' + g.items.length + (g.items.length === 1 ? " event" : " events") + "</div>" +
        "</div>" +
        '<div style="display:flex; flex-direction:column;">';

    for (var ei = 0; ei < g.items.length; ei++) {
      var e = g.items[ei];
      var idx = g._startIndex + ei;

      var isPast = (e.start instanceof Date) && (e.start.getTime() < Date.now());
      var isToday = (e.start instanceof Date) && isSameDay(e.start, new Date());
      var faded = isPast && isToday;

      // background: one-off tint OR transparent; past-today gets muted
      var bg = "transparent";
      if (faded) bg = "rgba(15,23,42,0.04)";
      else if (!e._occ) bg = "rgba(37,99,235,0.08)";

      html +=
        '<div style="display:grid; grid-template-columns:86px 1fr auto; gap:10px; padding:10px 12px; align-items:center;' +
                    (ei === 0 ? "" : "border-top:1px solid rgba(15,23,42,0.08);") +
                    "background:" + bg + ";" +
                    (faded ? "opacity:0.60;" : "opacity:1;") +
               '">' +

          '<div style="font-weight:900; color:rgba(15,23,42,0.70); font-size:13px;">' +
            escapeHtml(formatTime(e)) +
          "</div>" +

          '<div style="min-width:0;">' +
            '<div style="font-weight:900; color:rgba(15,23,42,0.80); font-size:14px;' +
                        "overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" +
                        "text-decoration:" + (faded ? "line-through" : "none") + ";" +
                 '">' +
              escapeHtml(e.summary || "Event") +
            "</div>" +
            '<div style="color:var(--muted); font-size:12px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
              (e.location ? escapeHtml(e.location) : "") +
            "</div>" +
          "</div>" +

          '<button data-details="' + idx + '" style="border:1px solid var(--line); background:rgba(255,255,255,0.65); color:rgba(15,23,42,0.72);' +
                 'border-radius:12px; padding:9px 10px; font-weight:900; font-size:13px; white-space:nowrap">' +
            "Details" +
          "</button>" +

        "</div>";
    }

    html += "</div></div>";
  }

  html += "</div>";
  body.innerHTML = html;

  // Wire details buttons
  var btns = body.querySelectorAll("[data-details]");
  for (var b = 0; b < btns.length; b++) {
    btns[b].addEventListener("click", function (ev) {
      var idxStr = ev.currentTarget.getAttribute("data-details");
      var idx = parseInt(idxStr, 10);
      var e = events[idx];
      if (!e) return;

      alert(
        (e.summary || "Event") + "\n\n" +
        formatWhen(e) + "\n" +
        (e.location ? "Location: " + e.location + "\n" : "") +
        (e.description ? "\n" + e.description : "")
      );
    });
  }
}

/* -------- Helpers -------- */

function filterToFourDaysWithTodayHistory(events){
  // Only include: today (all events incl. past) + next 3 days (future only)
  var now = new Date();
  var startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var endWindow = new Date(startToday.getTime() + 4 * 24 * 60 * 60 * 1000); // start of day 5

  var out = [];
  for (var i = 0; i < events.length; i++){
    var e = events[i];
    if (!(e.start instanceof Date) || isNaN(e.start)) continue;

    // keep only within [today 00:00, day4 end)
    if (e.start >= startToday && e.start < endWindow) out.push(e);
  }

  // sort by start time
  out.sort(function(a,b){
    return (a.start.getTime() || 0) - (b.start.getTime() || 0);
  });

  return out;
}

function groupByDay(events){
  var groups = [];
  var map = {};

  for (var i = 0; i < events.length; i++){
    var e = events[i];
    var d = e.start instanceof Date ? e.start : null;
    if (!d) continue;

    var key = d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate());

    if (!map[key]){
      var label = d.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" });
      map[key] = { key: key, label: label, items: [], _startIndex: 0 };
      groups.push(map[key]);
    }
    map[key].items.push(e);
  }

  // map back to original events array order (we use indices for Details)
  var running = 0;
  for (var g = 0; g < groups.length; g++){
    groups[g]._startIndex = running;
    running += groups[g].items.length;
  }

  return groups;
}

function formatWhen(e){
  var start = (e.start instanceof Date) ? e.start : null;
  if (!start) return "—";
  var date = start.toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" });
  return date + " • " + formatTime(e);
}

function formatTime(e){
  if (e.dtstartRaw && /^\d{8}$/.test(e.dtstartRaw)) return "All day";
  var start = (e.start instanceof Date) ? e.start : null;
  if (!start) return "—";
  return start.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

function isSameDay(a, b){
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function pad2(n){ return String(n).padStart(2, "0"); }

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, function (m) {
    return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m];
  });
}
