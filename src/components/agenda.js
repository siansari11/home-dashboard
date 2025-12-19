// src/components/agenda.js
import "../styles/agenda.css";
import { getIcsUrl, setIcsUrl, loadUpcomingEvents } from "../lib/calendar.js";

export async function renderAgenda(el){
  el.innerHTML = "";

  // Header row
  var header = document.createElement("div");
  header.className = "agendaHeader";

  var pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "📅 Calendar";

  var btn = document.createElement("button");
  btn.className = "agendaBtn";
  btn.id = "calBtn";
  btn.textContent = getIcsUrl() ? "Change link" : "Connect";

  header.append(pill, btn);

  // Body
  var body = document.createElement("div");
  body.className = "agendaBody";
  body.id = "calBody";
  body.textContent = "Loading…";

  el.append(header, body);

  btn.addEventListener("click", function () {
    var current = getIcsUrl();
    var next = prompt(
      "Paste your Google Calendar Secret iCal (.ics) link here.\n\nTip: keep it private (don’t put it in GitHub).",
      current || ""
    );
    if (next === null) return;
    setIcsUrl(next);
    renderAgenda(el);
  });

  if (!getIcsUrl()){
    body.innerHTML = "";
    body.appendChild(makeNotice(
      "Connect your calendar",
      "Google Calendar → Settings → your calendar → Integrate calendar → “Secret address in iCal format”."
    ));
    return;
  }

  var result;
  try {
    result = await loadUpcomingEvents();
  } catch (err) {
    body.innerHTML = "";
    body.appendChild(makeError(
      "Calendar crashed",
      String(err && (err.stack || err))
    ));
    return;
  }

  var events = (result && result.events) ? result.events : [];
  var debug = (result && result.debug) ? result.debug : "";

  if (!events.length){
    body.innerHTML = "";
    var n = makeNotice("No events in the next 4 days", debug || "");
    n.classList.add("agendaNotice--mono");
    body.appendChild(n);
    return;
  }

  // Build routine maps ONCE per render
  buildRoutineMaps(events);

  // Group by day
  var groups = groupByDay(events);

  body.innerHTML = "";
  var wrap = document.createElement("div");
  wrap.className = "agendaWrap";
  body.appendChild(wrap);

  for (var gi = 0; gi < groups.length; gi++) {
    var g = groups[gi];

    // Split into routine vs non-routine
    var routine = [];
    var rest = [];

    for (var k = 0; k < g.items.length; k++){
      var e = g.items[k];
      if (isRoutineByBehavior(e)) routine.push(e);
      else rest.push(e);
    }

    var dayCard = document.createElement("div");
    dayCard.className = "agendaDayCard";

    var dayHeader = document.createElement("div");
    dayHeader.className = "agendaDayHeader";

    var dayTitle = document.createElement("div");
    dayTitle.className = "agendaDayTitle";
    dayTitle.textContent = g.label;

    var dayMeta = document.createElement("div");
    dayMeta.className = "agendaDayMeta";
    dayMeta.textContent = rest.length + (rest.length === 1 ? " item" : " items");

    dayHeader.append(dayTitle, dayMeta);
    dayCard.appendChild(dayHeader);

    // Routine block (optional)
    if (routine.length) {
      var routineBlock = document.createElement("div");
      routineBlock.className = "agendaRoutineBlock";

      var routineLabel = document.createElement("div");
      routineLabel.className = "agendaRoutineLabel";
      routineLabel.textContent = "Daily routine";

      var routineLine = buildDailySummaryLineNode(routine);

      routineBlock.append(routineLabel, routineLine);
      dayCard.appendChild(routineBlock);
    }

    // Events list
    var list = document.createElement("div");
    list.className = "agendaEventList";

    if (!rest.length){
      var empty = document.createElement("div");
      empty.className = "agendaEmpty";
      empty.textContent = "No one-off or non-daily items.";
      list.appendChild(empty);
    } else {
      for (var ei = 0; ei < rest.length; ei++) {
        var e2 = rest[ei];

        var isPast = (e2.start instanceof Date) && (e2.start.getTime() < Date.now());
        var isToday = (e2.start instanceof Date) && isSameDay(e2.start, new Date());
        var faded = isPast && isToday;

        var row = document.createElement("div");
        row.className = "agendaEventRow";
        if (ei > 0) row.classList.add("agendaEventRow--border");
        if (faded) row.classList.add("agendaEventRow--faded");
        if (!e2._occ) row.classList.add("agendaEventRow--nonRecurring"); // your previous blue tint

        var time = document.createElement("div");
        time.className = "agendaEventTime";
        time.textContent = formatTime(e2);

        var main = document.createElement("div");
        main.className = "agendaEventMain";

        var title = document.createElement("div");
        title.className = "agendaEventTitle";
        title.textContent = e2.summary || "Event";
        if (faded) title.classList.add("agendaEventTitle--striked");

        var loc = document.createElement("div");
        loc.className = "agendaEventLoc";
        loc.textContent = e2.location ? e2.location : "";

        main.append(title, loc);

        var detailsId = registerEventForDetails(e2);

        var detailsBtn = document.createElement("button");
        detailsBtn.className = "agendaDetailsBtn";
        detailsBtn.setAttribute("data-details", detailsId);
        detailsBtn.type = "button";
        detailsBtn.textContent = "Details";

        row.append(time, main, detailsBtn);
        list.appendChild(row);
      }
    }

    dayCard.appendChild(list);
    wrap.appendChild(dayCard);
  }

  // Details handler
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

/* ---------- UI helpers ---------- */

function makeNotice(title, text){
  var box = document.createElement("div");
  box.className = "agendaNotice";

  var t = document.createElement("div");
  t.className = "agendaNotice__title";
  t.textContent = title;

  var p = document.createElement("div");
  p.className = "agendaNotice__text";
  p.textContent = text || "";

  box.append(t, p);
  return box;
}

function makeError(title, errorText){
  var box = document.createElement("div");
  box.className = "agendaNotice";

  var t = document.createElement("div");
  t.className = "agendaNotice__title";
  t.textContent = title;

  var e = document.createElement("div");
  e.className = "agendaNotice__error";
  e.textContent = errorText || "";

  box.append(t, e);
  return box;
}

/* ---------- Routine logic (title-only, behavior-based) ---------- */

function buildRoutineMaps(events){
  var daySeen = {};
  var counts = {};

  for (var i = 0; i < events.length; i++){
    var e = events[i];
    if (!e || !(e.start instanceof Date) || isNaN(e.start)) continue;

    var titleKey = routineTitleKey(e);
    if (!titleKey) continue;

    var dk = dateKey(e.start);
    var combo = titleKey + "|" + dk;

    if (!daySeen[combo]) {
      daySeen[combo] = true;
      counts[titleKey] = (counts[titleKey] || 0) + 1;
    }
  }

  window.__ROUTINE_COUNTS = counts;
}

function routineTitleKey(e){
  var title = String(e.summary || "").trim();
  if (!title) return "";
  return title.toLowerCase();
}

function isRoutineByBehavior(e){
  if (!e || !(e.start instanceof Date) || isNaN(e.start)) return false;
  var key = routineTitleKey(e);
  if (!key) return false;
  var counts = window.__ROUTINE_COUNTS || {};
  return (counts[key] || 0) >= 2;
}

function buildDailySummaryLineNode(list){
  var wrap = document.createElement("div");
  wrap.className = "agendaRoutinePills";

  // Sort by time
  list.sort(function(a,b){
    var ta = (a.start && a.start.getTime) ? a.start.getTime() : 0;
    var tb = (b.start && b.start.getTime) ? b.start.getTime() : 0;
    return ta - tb;
  });

  // Deduplicate by TITLE for this day (keep first occurrence/time)
  var seen = {};
  for (var i = 0; i < list.length; i++){
    var e = list[i];
    var key = routineTitleKey(e);
    if (!key || seen[key]) continue;
    seen[key] = true;

    var pill = document.createElement("span");
    pill.className = "agendaRoutinePill";
    pill.textContent = (e.summary || "Routine") + " at " + formatTime(e);

    wrap.appendChild(pill);
  }

  return wrap;
}

/* ---------- Details registry ---------- */

function registerEventForDetails(e){
  if (!window.__CAL_DETAILS) window.__CAL_DETAILS = {};
  var id = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
  window.__CAL_DETAILS[id] = e;
  return id;
}

/* ---------- Grouping + formatting helpers ---------- */

function groupByDay(events){
  var groups = [];
  var map = {};

  for (var i = 0; i < events.length; i++){
    var e = events[i];
    var d = e.start instanceof Date ? e.start : null;
    if (!d) continue;

    var key = dateKey(d);

    if (!map[key]){
      var label = d.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" });
      map[key] = { key: key, label: label, items: [] };
      groups.push(map[key]);
    }
    map[key].items.push(e);
  }

  for (var g = 0; g < groups.length; g++){
    groups[g].items.sort(function(a,b){
      return (a.start && a.start.getTime ? a.start.getTime() : 0) - (b.start && b.start.getTime ? b.start.getTime() : 0);
    });
  }

  return groups;
}

function dateKey(d){
  return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate());
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
