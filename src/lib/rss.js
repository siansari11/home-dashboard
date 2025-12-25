// src/lib/rss.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";

/**
 * Public API:
 * - loadRssItems(): returns items only (backwards compatible)
 * - loadRssItemsWithDebug(): returns { items, debug }
 */

export async function loadRssItems() {
  const out = await loadRssItemsWithDebug();
  return out.items || [];
}

export async function loadRssItemsWithDebug() {
  const cfg = DASHBOARD_CONFIG?.rss || {};
  const enabled = Array.isArray(cfg.enabledGroups) ? cfg.enabledGroups : null;

  const perFeedTimeoutMs = Number(cfg.perFeedTimeoutMs || 8000);
  const maxTotal = Number(cfg.maxItemsTotal || 12);
  const maxPerGroup = Number(cfg.maxItemsPerGroup || 12);

  const debug = {
    startedAt: new Date().toISOString(),
    perFeedTimeoutMs,
    enabledGroups: enabled,
    groupsFound: [],
    fetches: [], // each fetch attempt
    parsedCounts: [],
    errors: [],
  };

  const groups = (FEED_GROUPS || []).filter((g) => {
    if (!enabled) return true;
    return enabled.includes(g.key);
  });

  debug.groupsFound = groups.map((g) => ({
    key: g.key,
    title: g.title,
    urls: (g.urls || []).slice(0),
  }));

  // Fetch in parallel (group -> urls)
  const groupSettled = await Promise.allSettled(
    groups.map(async (g) => {
      const urls = Array.isArray(g.urls) ? g.urls : [];
      const urlSettled = await Promise.allSettled(
        urls.map(async (u) => {
          const url = String(u || "").trim();
          if (!url) return [];

          const t0 = Date.now();
          const text = await fetchTextWithFallback(url, perFeedTimeoutMs, debug);
          const ms = Date.now() - t0;

          debug.fetches.push({
            groupKey: g.key,
            url,
            ok: !!text,
            ms,
            typeGuess: url.endsWith(".json") ? "json" : "xml",
          });

          if (!text) return [];

          let items = [];
          try {
            if (url.endsWith(".json")) items = parseRssJson(text, g.key, g.title);
            else items = parseRssXml(text, g.key, g.title);

            debug.parsedCounts.push({
              groupKey: g.key,
              url,
              count: items.length,
              note: url.endsWith(".json") ? "parsed as json" : "parsed as xml",
            });
          } catch (e) {
            debug.errors.push({
              stage: "parse",
              groupKey: g.key,
              url,
              message: String(e && (e.stack || e.message || e)),
            });
            return [];
          }

          return items;
        })
      );

      let items = [];
      for (let i = 0; i < urlSettled.length; i++) {
        if (urlSettled[i].status === "fulfilled") items = items.concat(urlSettled[i].value || []);
        else {
          debug.errors.push({
            stage: "urlSettled",
            groupKey: g.key,
            message: String(urlSettled[i].reason && (urlSettled[i].reason.stack || urlSettled[i].reason)),
          });
        }
      }

      items.sort((a, b) => (b.date || 0) - (a.date || 0));
      return items.slice(0, maxPerGroup);
    })
  );

  let all = [];
  for (let i = 0; i < groupSettled.length; i++) {
    if (groupSettled[i].status === "fulfilled") all = all.concat(groupSettled[i].value || []);
    else {
      debug.errors.push({
        stage: "groupSettled",
        message: String(groupSettled[i].reason && (groupSettled[i].reason.stack || groupSettled[i].reason)),
      });
    }
  }

  all.sort((a, b) => (b.date || 0) - (a.date || 0));
  const items = all.slice(0, maxTotal);

  debug.finishedAt = new Date().toISOString();
  debug.totalItems = items.length;

  // Helpful summary line
  debug.summary =
    "groups=" + groups.length +
    " fetches=" + debug.fetches.length +
    " parsed=" + debug.parsedCounts.reduce((s, x) => s + (x.count || 0), 0) +
    " kept=" + items.length +
    " errors=" + debug.errors.length;

  // Also dump to console (if available)
  try {
    console.log("[RSS DEBUG]", debug);
  } catch {}

  return { items, debug };
}

/* --------------------------
   Fetch with fallback + proxy
   -------------------------- */

async function fetchTextWithFallback(url, timeoutMs, debug) {
  // direct first
  const direct = await fetchTextTimeout(url, timeoutMs);
  if (direct) return direct;

  // then proxies
  const proxyFns = [];
  if (Array.isArray(CONFIG?.corsProxies) && CONFIG.corsProxies.length) proxyFns.push(...CONFIG.corsProxies);
  else if (typeof CONFIG?.corsProxy === "function") proxyFns.push(CONFIG.corsProxy);

  for (let i = 0; i < proxyFns.length; i++) {
    try {
      const proxied = proxyFns[i](url);

      // record proxy attempt
      if (debug) debug.fetches.push({ groupKey: "?", url: proxied, ok: false, ms: 0, typeGuess: "proxy-attempt" });

      const txt = await fetchTextTimeout(proxied, timeoutMs);
      if (txt) return txt;
    } catch (e) {
      if (debug) debug.errors.push({ stage: "proxy", url, message: String(e && (e.stack || e.message || e)) });
    }
  }

  return null;
}

async function fetchTextTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* --------------------------
   Parsers
   -------------------------- */

function parseRssXml(xmlText, groupKey, groupTitle) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlText, "text/xml");
  } catch {
    return [];
  }

  // If XML parse failed, many browsers include <parsererror>
  const parserError = doc.querySelector("parsererror");
  if (parserError) return [];

  const items = Array.from(doc.querySelectorAll("item"));
  const out = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    const title = text(it, "title") || "Untitled";
    const link = (text(it, "link") || "").trim();
    const descriptionRaw = (text(it, "description") || text(it, "content\\:encoded") || "").trim();

    const pub = (text(it, "pubDate") || text(it, "dc\\:date") || "").trim();
    const date = pub ? Date.parse(pub) : 0;

    const image =
      attr(it, "media\\:content", "url") ||
      attr(it, "media\\:thumbnail", "url") ||
      attr(it, "enclosure", "url") ||
      firstImgFromHtml(descriptionRaw) ||
      "";

    out.push({
      title,
      link,
      description: stripHtml(descriptionRaw),
      image,
      date: isNaN(date) ? 0 : date,
      groupKey: String(groupKey || "").toLowerCase(),
      groupTitle: String(groupTitle || "").trim(),
    });
  }

  return out;
}

function parseRssJson(jsonText, groupKey, groupTitle) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return [];
  }

  // rss.app JSON often has { items: [...] }
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  const out = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const title = it.title || "Untitled";
    const link = it.url || it.link || "";
    const descriptionRaw = it.description || it.content_text || it.content_html || "";
    const date = it.date_published ? Date.parse(it.date_published) : 0;

    let image = "";
    // rss.app may use "image" as string OR object
    if (it.image && typeof it.image === "string") image = it.image;
    else if (it.image && typeof it.image === "object") image = it.image.url || "";
    else if (it.enclosure) image = it.enclosure;
    else image = firstImgFromHtml(descriptionRaw) || "";

    out.push({
      title,
      link,
      description: stripHtml(descriptionRaw),
      image,
      date: isNaN(date) ? 0 : date,
      groupKey: String(groupKey || "").toLowerCase(),
      groupTitle: String(groupTitle || "").trim(),
    });
  }

  return out;
}

/* --------------------------
   Helpers
   -------------------------- */

function text(parent, sel) {
  const n = parent.querySelector(sel);
  return n ? (n.textContent || "") : "";
}

function attr(parent, sel, name) {
  const n = parent.querySelector(sel);
  return n ? (n.getAttribute(name) || "") : "";
}

function firstImgFromHtml(html) {
  try {
    if (!html) return "";
    const d = new DOMParser().parseFromString(String(html), "text/html");
    const img = d.querySelector("img");
    return img ? (img.getAttribute("src") || "") : "";
  } catch {
    return "";
  }
}

function stripHtml(s) {
  try {
    const d = document.createElement("div");
    d.innerHTML = String(s || "");
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return String(s || "").replace(/\s+/g, " ").trim();
  }
}
