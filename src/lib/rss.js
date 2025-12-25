// src/lib/rss.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";

// ✅ Toggle debugging here (console only)
const DEBUG_RSS = true;

function log(...args){
  if (!DEBUG_RSS) return;
  try { console.log("[RSS]", ...args); } catch {}
}

export async function loadRssItems() {
  log("loadRssItems() called");

  const cfg = DASHBOARD_CONFIG?.rss || {};
  const enabled = Array.isArray(cfg.enabledGroups) ? cfg.enabledGroups : null;

  const perFeedTimeoutMs = Number(cfg.perFeedTimeoutMs || 8000);
  const maxTotal = Number(cfg.maxItemsTotal || 12);
  const maxPerGroup = Number(cfg.maxItemsPerGroup || 12);

  log("config", { enabled, perFeedTimeoutMs, maxTotal, maxPerGroup });

  const groups = (FEED_GROUPS || []).filter((g) => {
    if (!enabled) return true;
    return enabled.includes(g.key);
  });

  log("groups", groups.map(g => ({ key: g.key, urls: (g.urls || []).length })));

  const groupResults = await Promise.allSettled(
    groups.map(async (g) => {
      const urls = Array.isArray(g.urls) ? g.urls : [];
      log("group start", g.key, urls);

      const urlResults = await Promise.allSettled(
        urls.map(async (u) => {
          const url = String(u || "").trim();
          if (!url) return [];

          log("fetch start", g.key, url);

          const t0 = Date.now();
          const text = await fetchTextWithFallback(url, perFeedTimeoutMs);
          const ms = Date.now() - t0;

          log("fetch end", g.key, url, "ok=", !!text, "ms=", ms);

          if (!text) return [];

          try {
            const items = url.endsWith(".json")
              ? parseRssJson(text, g.key, g.title)
              : parseRssXml(text, g.key, g.title);

            log("parsed", g.key, url, "items=", items.length);
            return items;
          } catch (e) {
            log("parse ERROR", g.key, url, e);
            return [];
          }
        })
      );

      let items = [];
      for (let i = 0; i < urlResults.length; i++){
        if (urlResults[i].status === "fulfilled") items = items.concat(urlResults[i].value || []);
        else log("url promise rejected", g.key, urlResults[i].reason);
      }

      items.sort((a,b) => (b.date || 0) - (a.date || 0));
      items = items.slice(0, maxPerGroup);

      log("group done", g.key, "kept=", items.length);
      return items;
    })
  );

  let all = [];
  for (let i = 0; i < groupResults.length; i++){
    if (groupResults[i].status === "fulfilled") all = all.concat(groupResults[i].value || []);
    else log("group promise rejected", groupResults[i].reason);
  }

  all.sort((a,b) => (b.date || 0) - (a.date || 0));
  const out = all.slice(0, maxTotal);

  log("DONE total kept=", out.length);
  return out;
}

/* --------------------------
   Fetch with fallback + proxy
   -------------------------- */

async function fetchTextWithFallback(url, timeoutMs) {
  // direct first
  const direct = await fetchTextTimeout(url, timeoutMs);
  if (direct) return direct;

  // then proxies
  const proxyFns = [];
  if (Array.isArray(CONFIG?.corsProxies) && CONFIG.corsProxies.length) proxyFns.push(...CONFIG.corsProxies);
  else if (typeof CONFIG?.corsProxy === "function") proxyFns.push(CONFIG.corsProxy);

  log("direct failed, proxies=", proxyFns.length, "url=", url);

  for (let i = 0; i < proxyFns.length; i++) {
    try {
      const proxied = proxyFns[i](url);
      log("proxy try", proxied);

      const txt = await fetchTextTimeout(proxied, timeoutMs);
      if (txt) return txt;
    } catch (e) {
      log("proxy ERROR", e);
    }
  }

  return null;
}

async function fetchTextTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, { cache: "no-store", signal: controller.signal });
    log("fetch status", url, r.status);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) {
    log("fetch EXCEPTION", url, e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/* --------------------------
   Parsers
   -------------------------- */

function parseRssXml(xmlText, groupKey, groupTitle) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("XML parsererror");

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
  const data = JSON.parse(jsonText);
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  const out = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i] || {};
    const title = it.title || "Untitled";
    const link = it.url || it.link || "";
    const descriptionRaw = it.description || it.content_text || it.content_html || "";
    const date = it.date_published ? Date.parse(it.date_published) : 0;

    let image = "";
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
  if (!html) return "";
  const d = new DOMParser().parseFromString(String(html), "text/html");
  const img = d.querySelector("img");
  return img ? (img.getAttribute("src") || "") : "";
}

function stripHtml(s) {
  const d = document.createElement("div");
  d.innerHTML = String(s || "");
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}
