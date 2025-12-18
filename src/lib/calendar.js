import { CONFIG } from "../config.js";

const LS_KEY = "menzelijaz.calendar.icsUrl.v1";

export function getIcsUrl() {
  return localStorage.getItem(LS_KEY) || "";
}

export function setIcsUrl(url) {
  if (!url) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, url.trim());
}

// --- fetch with the same proxy fallback style as RSS ---
async function fetchTextWithFallback(url) {
  const errors = [];
  const proxyFns = CONFIG.corsProxies?.length
    ? CONFIG.corsProxies
    : (CONFIG.corsProxy ? [CONFIG.corsProxy] : []);

  for (const mk of proxyFns) {
    const proxied = mk(url);
    try {
      const res = await fetch(proxied, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { text: await res.text(), via: proxied, error: null };
    } catch (e) {
      errors.push(`${proxied} -> ${String(e?.message || e)}`);
    }
  }
  return { text: null, via: null, error: errors.join("\n") };
}

// --- minimal ICS parser (VEVENT only) ---
function unfoldLines(icsText) {
  // Lines starting with space/tab are continuations
  return icsText.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDate(val) {
  // Supports:
  // - 20251218T090000Z
  // - 20251218T090000
  // - 20251218 (all-day)
  if (!val) return null;

  const isAllDay = /^\d{8}$/.test(val);
  if (isAllDay) {
    const y = Number(val.slice(0, 4));
    const m = Number(val.slice(4, 6)) - 1;
    const d = Number(val.slice(6, 8));
    return new Date(y, m, d, 0, 0, 0);
  }

  const zulu = val.endsWith("Z");
  const core = zulu ? val.slice(0, -1) : val;

  const y = Number(core.slice(0, 4));
  const m = Number(core.slice(4, 6)) - 1;
  const d = Number(core.slice(6, 8));
  const hh = Number(core.slice(9, 11) || 0);
  const mm = Number(core.slice(11, 13) || 0);
  const ss = Number(core.slice(13, 15) || 0);

  if (zulu) return new Date(Date.UTC(y, m, d, hh, mm, ss));
  return new Date(y, m, d, hh, mm, ss);
}

function unescapeIcsText(s) {
  return (s || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseEvents(icsText) {
  const text = unfoldLines(icsText);
  const lines = text.split(/\r?\n/);

  const events = [];
  let cur = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;

    const left = line.slice(0, idx);
    const value = line.slice(idx + 1);

    const key = left.split(";")[0]; // ignore params

    if (key === "SUMMARY") cur.summary = unescapeIcsText(value);
    else if (key === "DESCRIPTION") cur.description = unescapeIcsText(value);
    else if (key === "LOCATION") cur.location = unescapeIcsText(value);
    else if (key === "UID") cur.uid = value;
    else if (key === "DTSTART") { cur.dtstartRaw = value; cur.start = parseIcsDate(value); }
    else if (key === "DTEND")   { cur.dtendRaw = value;   cur.end = parseIcsDate(value); }
    else if (key === "URL") cur.url = value;
    else if (key === "RRULE") cur.rrule = value;           // <--- NEW
    else if (key === "EXDATE") cur.exdateRaw = value;      // <--- (basic ignore later)
  }

  return events;
}
function parseRrule(rrule) {
  // Example: FREQ=DAILY;INTERVAL=1;COUNT=10
  const obj = {};
  if (!rrule) return obj;
  const parts = rrule.split(";");
  for (const p of parts) {
    const kv = p.split("=");
    if (kv.length !== 2) continue;
    obj[kv[0].toUpperCase()] = kv[1];
  }
  return obj;
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}
export async function loadUpcomingEvents() {
  var icsUrl = getIcsUrl();
  if (!icsUrl) {
    return { events: [], debug: "No ICS URL set" };
  }

  var fetched = await fetchTextWithFallback(icsUrl);
  if (!fetched.text) {
    return { events: [], debug: "Failed to fetch ICS via proxies.\n" + fetched.error };
  }

  // WINDOW: today (00:00) + next 3 days (total 4 days)
  var now = new Date();
  var startWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var endWindow = new Date(startWindow.getTime() + 4 * 24 * 60 * 60 * 1000);

  var base = parseEvents(fetched.text)
    .filter(function (e) { return (e.start instanceof Date) && !isNaN(e.start); })
    .sort(function (a, b) { return eTime(a.start) - eTime(b.start); });

  var expanded = [];

  for (var i = 0; i < base.length; i++) {
    var e = base[i];

    // Non-recurring
    if (!e.rrule) {
      if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
      continue;
    }

    // Recurring
    var rule = parseRrule(e.rrule);
    var freq = String(rule.FREQ || "").toUpperCase();
    var interval = Math.max(1, Number(rule.INTERVAL || 1));
    var count = rule.COUNT ? Number(rule.COUNT) : null;
    var until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : null;

    // Duration
    var durMs = (e.end instanceof Date && !isNaN(e.end)) ? (e.end.getTime() - e.start.getTime()) : 0;

    if (freq === "DAILY") {
      // Compute the first occurrence >= startWindow (instead of looping from DTSTART)
      var first = firstDailyOccurrenceOnOrAfter(e.start, startWindow, interval);

      // Generate occurrences inside [startWindow, endWindow)
      var occ = first;
      var added = 0;

      while (occ < endWindow) {
        if (until && occ > until) break;

        // COUNT handling (approx): only count occurrences from DTSTART onward
        if (count !== null) {
          var seriesIndex = Math.floor((occ.getTime() - e.start.getTime()) / (24 * 60 * 60 * 1000 * interval));
          if (seriesIndex >= count) break;
        }

        if (occ >= startWindow) {
          expanded.push({
            summary: e.summary,
            description: e.description,
            location: e.location,
            uid: e.uid,
            url: e.url,
            rrule: e.rrule,
            dtstartRaw: e.dtstartRaw,
            dtendRaw: e.dtendRaw,
            start: occ,
            end: durMs ? new Date(occ.getTime() + durMs) : null,
            _occ: true
          });
          added++;
        }

        occ = addDays(occ, interval);
        if (added > 200) break; // safety guard
      }
    }
    else if (freq === "WEEKLY") {
      // Simple weekly expansion inside the window
      var byday = rule.BYDAY ? String(rule.BYDAY).split(",") : null;
      var dayMap = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };

      for (var d = 0; d < 8; d++) { // 4-day window -> 8 is plenty
        var day = addDays(new Date(startWindow.getTime()), d);
        var weekday = day.getDay();

        var allowed =
          byday
            ? byday.some(function(code){ return dayMap[code] === weekday; })
            : (weekday === e.start.getDay());

        if (!allowed) continue;

        // Keep original time of day
        var occStart = new Date(
          day.getFullYear(), day.getMonth(), day.getDate(),
          e.start.getHours(), e.start.getMinutes(), e.start.getSeconds()
        );

        if (occStart < e.start) continue;
        if (occStart < startWindow || occStart >= endWindow) continue;
        if (until && occStart > until) continue;

        expanded.push({
          summary: e.summary,
          description: e.description,
          location: e.location,
          uid: e.uid,
          url: e.url,
          rrule: e.rrule,
          dtstartRaw: e.dtstartRaw,
          dtendRaw: e.dtendRaw,
          start: occStart,
          end: durMs ? new Date(occStart.getTime() + durMs) : null,
          _occ: true
        });
      }
    }
    else {
      // Other recurrence types not supported yet
      // Include master if it's within window
      if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
    }
  }

  expanded.sort(function (a, b) { return eTime(a.start) - eTime(b.start); });

  return {
    events: expanded,
    debug: "Loaded " + expanded.length + " events (4-day window; recurring supported) via " + fetched.via
  };
}
function eTime(d){ return d.getTime(); }
function addHours(d, h){ return new Date(d.getTime() + h * 3600 * 1000); }
