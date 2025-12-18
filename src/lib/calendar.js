// src/lib/calendar.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";

var LS_KEY = "menzelijaz.calendar.icsUrl.v1";

export function getIcsUrl() {
  return localStorage.getItem(LS_KEY) || "";
}

export function setIcsUrl(url) {
  if (!url) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, String(url).trim());
}

async function fetchTextWithFallback(url) {
  var errors = [];
  var proxyFns = [];

  if (CONFIG.corsProxies && CONFIG.corsProxies.length) proxyFns = CONFIG.corsProxies;
  else if (CONFIG.corsProxy) proxyFns = [CONFIG.corsProxy];

  for (var i = 0; i < proxyFns.length; i++) {
    var proxied = proxyFns[i](url);
    try {
      var res = await fetch(proxied, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return { text: await res.text(), via: proxied, error: null };
    } catch (e) {
      errors.push(proxied + " -> " + String(e.message || e));
    }
  }

  return { text: null, via: null, error: errors.join("\n") };
}

function unfoldLines(icsText) {
  return icsText.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDate(val) {
  if (!val) return null;

  if (/^\d{8}$/.test(val)) {
    var y = Number(val.slice(0, 4));
    var m = Number(val.slice(4, 6)) - 1;
    var d = Number(val.slice(6, 8));
    return new Date(y, m, d, 0, 0, 0);
  }

  var zulu = val.charAt(val.length - 1) === "Z";
  var core = zulu ? val.slice(0, -1) : val;

  var yy = Number(core.slice(0, 4));
  var mm = Number(core.slice(4, 6)) - 1;
  var dd = Number(core.slice(6, 8));
  var hh = Number(core.slice(9, 11) || 0);
  var mi = Number(core.slice(11, 13) || 0);
  var ss = Number(core.slice(13, 15) || 0);

  if (zulu) return new Date(Date.UTC(yy, mm, dd, hh, mi, ss));
  return new Date(yy, mm, dd, hh, mi, ss);
}

function unescapeIcsText(s) {
  return (s || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseRrule(rrule) {
  var obj = {};
  if (!rrule) return obj;
  var parts = rrule.split(";");
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split("=");
    if (kv.length === 2) obj[kv[0].toUpperCase()] = kv[1];
  }
  return obj;
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

function firstDailyOccurrenceOnOrAfter(seriesStart, windowStart, intervalDays) {
  var dayMs = 24 * 60 * 60 * 1000;
  if (windowStart <= seriesStart) return new Date(seriesStart.getTime());

  var diffDays = Math.floor((windowStart.getTime() - seriesStart.getTime()) / dayMs);
  var steps = Math.ceil(diffDays / intervalDays) * intervalDays;
  var candidate = new Date(seriesStart.getTime() + steps * dayMs);

  while (candidate < windowStart) candidate = new Date(candidate.getTime() + intervalDays * dayMs);
  return candidate;
}

function parseEvents(icsText) {
  var text = unfoldLines(icsText);
  var lines = text.split(/\r?\n/);

  var events = [];
  var cur = null;

  for (var i = 0; i < lines.length; i++) {
    var line = String(lines[i] || "").trim();
    if (!line) continue;

    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") { if (cur) events.push(cur); cur = null; continue; }
    if (!cur) continue;

    var idx = line.indexOf(":");
    if (idx < 0) continue;

    var left = line.slice(0, idx);
    var value = line.slice(idx + 1);
    var key = left.split(";")[0];

    if (key === "SUMMARY") cur.summary = unescapeIcsText(value);
    else if (key === "DESCRIPTION") cur.description = unescapeIcsText(value);
    else if (key === "LOCATION") cur.location = unescapeIcsText(value);
    else if (key === "UID") cur.uid = value;
    else if (key === "DTSTART") { cur.dtstartRaw = value; cur.start = parseIcsDate(value); }
    else if (key === "DTEND")   { cur.dtendRaw = value;   cur.end = parseIcsDate(value); }
    else if (key === "URL") cur.url = value;
    else if (key === "RRULE") cur.rrule = value;
  }

  return events;
}

function eTime(d){ return d.getTime(); }

export async function loadUpcomingEvents() {
  var icsUrl = getIcsUrl();
  if (!icsUrl) return { events: [], debug: "No ICS URL set" };

  var fetched = await fetchTextWithFallback(icsUrl);
  if (!fetched.text) return { events: [], debug: "Failed to fetch ICS.\n" + fetched.error };

  var daysToShow = (DASHBOARD_CONFIG && DASHBOARD_CONFIG.calendar && DASHBOARD_CONFIG.calendar.daysToShow) ? DASHBOARD_CONFIG.calendar.daysToShow : 4;

  // Window: Today 00:00 to start of day + daysToShow
  var now = new Date();
  var startWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var endWindow = new Date(startWindow.getTime() + daysToShow * 24 * 60 * 60 * 1000);

  var base = parseEvents(fetched.text)
    .filter(function (e) { return (e.start instanceof Date) && !isNaN(e.start); });

  var expanded = [];
  var dayMap = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };

  for (var i = 0; i < base.length; i++) {
    var e = base[i];
    var durMs = (e.end instanceof Date && !isNaN(e.end)) ? (e.end.getTime() - e.start.getTime()) : 0;

    if (!e.rrule) {
      if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
      continue;
    }

    var rule = parseRrule(e.rrule);
    var freq = String(rule.FREQ || "").toUpperCase();
    var interval = Math.max(1, Number(rule.INTERVAL || 1));
    var until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : null;

    if (freq === "DAILY") {
      var occ = firstDailyOccurrenceOnOrAfter(e.start, startWindow, interval);
      var guard = 0;

      while (occ < endWindow) {
        if (until && occ > until) break;

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

        occ = addDays(occ, interval);
        guard++;
        if (guard > 200) break;
      }
    }
    else if (freq === "WEEKLY") {
      var byday = rule.BYDAY ? String(rule.BYDAY).split(",") : null;

      for (var d = 0; d < daysToShow; d++) {
        var day = addDays(new Date(startWindow.getTime()), d);
        var weekday = day.getDay();

        var allowed = false;
        if (byday && byday.length) {
          for (var k = 0; k < byday.length; k++) {
            if (dayMap[byday[k]] === weekday) { allowed = true; break; }
          }
        } else {
          allowed = (weekday === e.start.getDay());
        }

        if (!allowed) continue;

        var occStart = new Date(
          day.getFullYear(), day.getMonth(), day.getDate(),
          e.start.getHours(), e.start.getMinutes(), e.start.getSeconds()
        );

        if (occStart < e.start) continue;
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
      if (e.start >= startWindow && e.start < endWindow) expanded.push(e);
    }
  }

  expanded.sort(function (a, b) { return eTime(a.start) - eTime(b.start); });

  return {
    events: expanded,
    debug: "Loaded " + expanded.length + " events (windowed) via " + fetched.via
  };
}
