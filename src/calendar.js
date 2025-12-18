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

    const key = left.split(";")[0]; // ignore params for now

    if (key === "SUMMARY") cur.summary = unescapeIcsText(value);
    else if (key === "DESCRIPTION") cur.description = unescapeIcsText(value);
    else if (key === "LOCATION") cur.location = unescapeIcsText(value);
    else if (key === "UID") cur.uid = value;
    else if (key === "DTSTART") cur.dtstartRaw = value, cur.start = parseIcsDate(value);
    else if (key === "DTEND") cur.dtendRaw = value, cur.end = parseIcsDate(value);
    else if (key === "URL") cur.url = value;
  }

  return events;
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

  const all = parseEvents(text)
    .filter(e => e.start instanceof Date && !isNaN(e.start))
    .sort((a, b) => eTime(a.start) - eTime(b.start));

  const now = new Date();
  const upcoming = all.filter(e => e.start >= addHours(now, -6)).slice(0, 10);

  return { events: upcoming, debug: `Loaded ${upcoming.length} events via ${via}` };
}

function eTime(d){ return d.getTime(); }
function addHours(d, h){ return new Date(d.getTime() + h * 3600 * 1000); }
