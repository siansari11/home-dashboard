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
  const icsUrl = getIcsUrl();
  if (!icsUrl) {
    return { events: [], debug: "No ICS URL set" };
  }

  const { text, via, error } = await fetchTextWithFallback(icsUrl);
  if (!text) {
    return { events: [], debug: `Failed to fetch ICS via proxies.\n${error}` };
  }

  const base = parseEvents(text)
  .filter(e => e.start instanceof Date && !isNaN(e.start))
  .sort((a, b) => eTime(a.start) - eTime(b.start));

const now = new Date();
const startWindow = addHours(now, -6);
const endWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

const expanded = [];

for (const e of base) {
  // Non-recurring
  if (!e.rrule) {
    if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
    continue;
  }

  // Recurring (basic support)
  const rule = parseRrule(e.rrule);
  const freq = (rule.FREQ || "").toUpperCase();
  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const count = rule.COUNT ? Number(rule.COUNT) : null;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : null;

  // Duration: preserve event length if DTEND exists
  const durMs = (e.end instanceof Date && !isNaN(e.end)) ? (e.end.getTime() - e.start.getTime()) : 0;

  // Expand occurrences only inside our window
  let occurrencesAdded = 0;

  if (freq === "DAILY") {
    // Find first occurrence on/after startWindow by stepping days
    // We do a safe loop limited to 4*24h window size (no runaway).
    for (let d = 0; d < 6; d++) {
      const occStart = addDays(new Date(e.start.getTime()), d * interval);

      if (until && occStart > until) break;
      if (count !== null && occurrencesAdded >= count) break;

      if (occStart >= startWindow && occStart < endWindow) {
        expanded.push({
          ...e,
          start: occStart,
          end: durMs ? new Date(occStart.getTime() + durMs) : null,
          _occ: true
        });
      }

      // Count only when we pass the original start (so COUNT behaves roughly)
      if (occStart >= e.start) occurrencesAdded++;
    }
  } else if (freq === "WEEKLY") {
    // Very basic weekly handling:
    // - If BYDAY exists, place occurrences on those weekdays within window
    // - Otherwise repeat on same weekday as DTSTART
    const byday = rule.BYDAY ? rule.BYDAY.split(",") : null;
    const dayMap = { MO:0, TU:1, WE:2, TH:3, FR:4, SA:5, SU:6 };

    for (let d = 0; d < 6; d++) {
      const day = addDays(new Date(startWindow.getTime()), d);
      const weekday = day.getDay();

      const allowed =
        byday
          ? byday.some(code => dayMap[code] === weekday)
          : (weekday === e.start.getDay());

      if (!allowed) continue;

      // Keep original time of day
      const occStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(),
        e.start.getHours(), e.start.getMinutes(), e.start.getSeconds()
      );

      if (occStart < e.start) continue; // don’t create before series begins
      if (until && occStart > until) break;
      if (count !== null && occurrencesAdded >= count) break;

      if (occStart >= startWindow && occStart < endWindow) {
        expanded.push({
          ...e,
          start: occStart,
          end: durMs ? new Date(occStart.getTime() + durMs) : null,
          _occ: true
        });
      }

      occurrencesAdded++;
    }
  } else {
    // Other FREQ types not supported yet (MONTHLY/YEARLY/etc.)
    // We still include the master event if it falls within the window
    if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
  }
}

expanded.sort((a, b) => eTime(a.start) - eTime(b.start));

return {
  events: expanded,
  debug: `Loaded ${expanded.length} events (next 5 days; recurring supported) via ${via}`
};
}

function eTime(d){ return d.getTime(); }
function addHours(d, h){ return new Date(d.getTime() + h * 3600 * 1000); }
