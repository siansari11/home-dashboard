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

  var result;
  try {
    result = await loadUpcomingEvents();
  } catch (err) {
    body.innerHTML =
      '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
        '<div style="font-weight:900; color:rgba(15,23,42,0.75)">Calendar crashed</div>' +
        '<div style="margin-top:8px; font-size:12px; color:var(--muted); white-space:pre-wrap;">' +
          escapeHtml(String(err && (err.stack || err))) +
        "</div>" +
      "</div>";
    return;
  }

  var events = (result && result.events) ? result.events : [];
  var debug = (result && result.debug) ? result.debug : "";

  if (!events.length){
    body.innerHTML =
      '<div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">' +
        '<div style="font-weight:900; color:rgba(15,23,42,0.75)">No events in the next 4 days</div>' +
        '<div style="margin-top:6px; font-size:12px; white-space:pre-wrap;">' + escapeHtml(debug) + "</div>" +
      "</div>";
    return;
  }

  // Group all events by day first
  var groups = groupByDay(events);

  // Build UI
  var html = '<div style="display:flex; flex-direction:column; gap:12px">';

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];

    // Split: DAILY recurring occurrences vs the rest
    var dailyRecurring = [];
    var rest = [];

    for (var k = 0; k < g.items.length; k++){
      var e = g.items[k];
      if (isDailyRecurringOccurrence(e)) dailyRecurring.push(e);
      else rest.push(e);
    }

    // Create a nice compact one-line summary for daily recurring
    var dailySummary = buildDailySummaryLine(dailyRecurring);

    html +=
      '<div style="border:1px solid var(--line); border-radius:18px; background:rgba(255,255,255,0.55); overflow:hidden;">' +
        '<div style="padding:10px 12px; background:rgba(255,255,255,0.55); border-bottom:1px solid var(--line);' +
                    'display:flex; justify-content:space-between; align-items:center; gap:10px;">' +
          '<div style="font-weight:900; color:rgba(15,23,42,0.78)">' + escapeHtml(g.label) + "</div>" +
          '<div style="font-size:12px; color:var(--muted)">' +
            rest.length + (rest.length === 1 ? " item" : " items") +
          "</div>" +
        "</div>" +

        // DAILY SUMMARY (one line)
        (dailySummary
          ? '<div style="padding:10px 12px; border-bottom:1px solid rgba(15,23,42,0.08);">' +
              '<div style="font-size:12px; color:var(--muted); font-weight:900; margin-bottom:6px;">Daily routine</div>' +
              dailySummary +
            "</div>"
          : ""
        ) +

        '<div style="display:flex; flex-direction:column;">';

    if (!rest.length){
      html +=
        '<div style="padding:12px; color:var(--muted); font-size:13px;">No one-off or non-daily items.</div>';
    } else {
      for (var ei = 0; ei < rest.length; ei++) {
        var e2 = rest[ei];

        var isPast = (e2.start instanceof Date) && (e2.start.getTime() < Date.now());
        var isToday = (e2.start instanceof Date) && isSameDay(e2.start, new Date());
        var faded = isPast && isToday;

        // Non-recurring tint (your earlier request)
        var bg = "transparent";
        if (faded) bg = "rgba(15,23,42,0.04)";
        else if (!e2._occ) bg = "rgba(37,99,235,0.08)";

        // We can’t use original index anymore because we filtered;
        // store the event payload in a data attribute via JSON? too heavy.
        // Instead: show details using a simple inline handler with safe global registry.
        var detailsId = registerEventForDetails(e2);

        html +=
          '<div style="display:grid; grid-template-columns:86px 1fr auto; gap:10px; padding:10px 12px; align-items:center;' +
                      (ei === 0 ? "" : "border-top:1px solid rgba(15,23,42,0.08);") +
                      "background:" + bg + ";" +
                      (faded ? "opacity:0.60;" : "opacity:1;") +
                 '">' +

            '<div style="font-weight:900; color:rgba(15,23,42,0.70); font-size:13px;">' +
              escapeHtml(formatTime(e2)) +
            "</div>" +

            '<div style="min-width:0;">' +
              '<div style="font-weight:900; color:rgba(15,23,42,0.80); font-size:14px;' +
                          "overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" +
                          "text-decoration:" + (faded ? "line-through" : "none") + ";" +
                   '">' +
                escapeHtml(e2.summary || "Event") +
              "</div>" +
              '<div style="color:var(--muted); font-size:12px; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                (e2.location ? escapeHtml(e2.location) : "") +
              "</div>" +
            "</div>" +

            '<button data-details="' + detailsId + '" style="border:1px solid var(--line); background:rgba(255,255,255,0.65); color:rgba(15,23,42,0.72);' +
                   'border-radius:12px; padding:9px 10px; font-weight:900; font-size:13px; white-space:nowrap">' +
              "Details" +
            "</button>" +

          "</div>";
      }
    }

    html += "</div></div>";
  }

  html += "</div>";
  body.innerHTML = html;

  // Wire Details buttons
  var btns = body.querySelectorAll("[data-details]");
  for (var b = 0; b < btns.length; b++) {
    btns[b].addEventListener("click", function (ev) {
      var id = ev.currentTarget.getAttribute("data-details");
      var e = window.__CAL_DETAILS && window.__CAL_DETAILS[id];
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

/* ---------- Daily summary logic ---------- */

function isDailyRecurringOccurrence(e){
  // Our recurring instances have _occ: true and carry the master RRULE string
  // DAILY recurring => RRULE contains FREQ=DAILY
  if (!e || !e._occ) return false;
  if (!e.rrule) return false;
  return String(e.rrule).toUpperCase().indexOf("FREQ=DAILY") >= 0;
}

function buildDailySummaryLine(list){
  if (!list || !list.length) return "";

  // Sort by time
  list.sort(function(a,b){
    return (a.start && a.start.getTime ? a.start.getTime() : 0) - (b.start && b.start.getTime ? b.start.getTime() : 0);
  });

  // Build compact "pills"
  var pills = "";
  for (var i = 0; i < list.length; i++){
    var e = list[i];
    var t = formatTime(e);
    var title = e.summary || "Routine";
    pills +=
      '<span style="display:inline-block; margin:4px 6px 0 0; padding:6px 10px; border-radius:999px;' +
                   'border:1px solid rgba(15,23,42,0.10); background:rgba(255,255,255,0.60);' +
                   'font-size:12px; font-weight:900; color:rgba(15,23,42,0.72)">' +
        escapeHtml(t + " " + title) +
      "</span>";
  }

  return '<div style="display:flex; flex-wrap:wrap; align-items:center;">' + pills + "</div>";
}

/* ---------- Helpers ---------- */

function registerEventForDetails(e){
  if (!window.__CAL_DETAILS) window.__CAL_DETAILS = {};
  var id = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
  window.__CAL_DETAILS[id] = e;
  return id;
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
