// Device-only status source. The URL and bearer token live in
// localStorage. Nothing in this file is a credential.

const URL_KEY = "menzelijaz.status.url.v1";
const TOKEN_KEY = "menzelijaz.status.token.v1";

export const DEFAULT_STATUS_URL =
  "https://api.github.com/repos/siansari11/life-status/contents/status.json";

export const GITHUB_RAW_ACCEPT = "application/vnd.github.raw";

export const SETTING_EXAMPLES = {
  statusUrl: DEFAULT_STATUS_URL,
  bearerToken: "github_pat_11EXAMPLE_ONLY_contents_read",
  calendarIcs: "https://calendar.google.com/calendar/ical/you%40gmail.com/private-abc123/basic.ics",
  remoteUrl: "https://siansari11.github.io/home-dashboard/",
  useRemote: "On",
  startOnBoot: "On",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getStatusUrl() {
  try {
    var stored = localStorage.getItem(URL_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch (e) {}
  return DEFAULT_STATUS_URL;
}

export function setStatusUrl(url) {
  var value = String(url || "").trim();
  try {
    if (!value || value === DEFAULT_STATUS_URL) localStorage.removeItem(URL_KEY);
    else localStorage.setItem(URL_KEY, value);
  } catch (e) {}
}

export function getStatusToken() {
  try {
    return String(localStorage.getItem(TOKEN_KEY) || "").trim();
  } catch (e) {
    return "";
  }
}

export function setStatusToken(token) {
  var value = String(token || "").trim();
  try {
    if (!value) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, value);
  } catch (e) {}
}

export function daysUntil(deadline, now) {
  if (deadline == null || deadline === "") return null;
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(deadline).trim());
  if (!match) return null;
  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  var target = new Date(year, month - 1, day);
  if (
    target.getFullYear() !== year ||
    target.getMonth() !== month - 1 ||
    target.getDate() !== day
  ) {
    return null;
  }
  var todayBase = now instanceof Date ? now : new Date();
  var today = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

// red: due in <=3 days, or priority 1 and already overdue
// amber: due in <=14 days
// green: later, or no deadline
export function deadlineTone(priority, deadline, now) {
  var days = daysUntil(deadline, now);
  if (days === null) return "ok";
  var overdue = days < 0;
  if (days <= 3 || (Number(priority) === 1 && overdue)) return "urgent";
  if (days <= 14) return "soon";
  return "ok";
}

export function daysLabel(deadline, now) {
  var days = daysUntil(deadline, now);
  if (days === null) return "No deadline";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days > 1) return days + " days left";
  if (days === -1) return "1 day overdue";
  return Math.abs(days) + " days overdue";
}

export function sortProcesses(list, now) {
  var toneRank = { urgent: 0, soon: 1, ok: 2 };
  return (list || []).slice().sort(function (a, b) {
    var aDone = String(a && a.status) === "done" ? 1 : 0;
    var bDone = String(b && b.status) === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    var aTone = toneRank[deadlineTone(a && a.priority, a && a.deadline, now)];
    var bTone = toneRank[deadlineTone(b && b.priority, b && b.deadline, now)];
    if (aTone === undefined) aTone = 2;
    if (bTone === undefined) bTone = 2;
    if (aTone !== bTone) return aTone - bTone;
    var aPriority = Number(a && a.priority);
    var bPriority = Number(b && b.priority);
    if (!isFinite(aPriority)) aPriority = 99;
    if (!isFinite(bPriority)) bPriority = 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    var aDays = daysUntil(a && a.deadline, now);
    var bDays = daysUntil(b && b.deadline, now);
    if (aDays === null && bDays === null) return 0;
    if (aDays === null) return 1;
    if (bDays === null) return -1;
    return aDays - bDays;
  });
}

function decodeBase64Utf8(b64) {
  var binary = atob(String(b64).replace(/\s/g, ""));
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

export function parseStatusBody(text) {
  var json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return null;
  }
  if (
    json &&
    json.encoding === "base64" &&
    typeof json.content === "string" &&
    !Array.isArray(json.processes)
  ) {
    try {
      json = JSON.parse(decodeBase64Utf8(json.content));
    } catch (e) {
      return null;
    }
  }
  if (!json || !Array.isArray(json.processes)) return null;
  if (!Array.isArray(json.morning_brief)) json.morning_brief = [];
  return json;
}

function sampleUrl() {
  var base = "/";
  try {
    if (import.meta.env && import.meta.env.BASE_URL) base = import.meta.env.BASE_URL;
  } catch (e) {}
  return base + "status.sample.json";
}

async function loadSample() {
  var res = await fetch(sampleUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error("sample HTTP " + res.status);
  var data = parseStatusBody(await res.text());
  if (!data) throw new Error("sample file is not a status document");
  return data;
}

export async function loadStatus() {
  var url = getStatusUrl();
  var token = getStatusToken();
  try {
    var headers = { Accept: GITHUB_RAW_ACCEPT };
    if (/^https:\/\/api\.github\.com\//i.test(url)) {
      headers["X-GitHub-Api-Version"] = "2022-11-28";
    }
    if (token) headers.Authorization = "Bearer " + token;
    var res = await fetch(url, { headers: headers, cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = parseStatusBody(await res.text());
    if (!data) throw new Error("response was not a status document");
    return { data: data, fallback: false, error: "" };
  } catch (err) {
    var sample = await loadSample();
    return {
      data: sample,
      fallback: true,
      error: String((err && err.message) || err || "request failed"),
    };
  }
}
