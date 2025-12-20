// src/lib/rss.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";

/**
 * Public API used by Feed + Reels.
 * Returns normalized items:
 * { title, link, description, image, date, groupKey, groupTitle }
 */
export async function loadRssItems() {
  const cfg = DASHBOARD_CONFIG?.rss || {};
  const enabled = Array.isArray(cfg.enabledGroups) ? cfg.enabledGroups : null;

  // If enabledGroups is set, only load those groups; otherwise load all groups in feeds.js
  const groups = (FEED_GROUPS || []).filter((g) => {
    if (!enabled) return true;
    return enabled.includes(g.key);
  });

  const maxTotal = Number(cfg.maxItemsTotal || 12);
  const maxPerGroup = Number(cfg.maxItemsPerGroup || 8);

  const all = [];

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const urls = Array.isArray(g.urls) ? g.urls : [];
    let groupItems = [];

    for (let ui = 0; ui < urls.length; ui++) {
      const url = String(urls[ui] || "").trim();
      if (!url) continue;

      const xmlText = await fetchXmlWithFallback(url);
      if (!xmlText) continue;

      const parsed = parseRssXml(xmlText, g.key, g.title);
      groupItems = groupItems.concat(parsed);
      if (groupItems.length >= maxPerGroup) break;
    }

    // Sort newest first if date exists
    groupItems.sort((a, b) => (b.date || 0) - (a.date || 0));

    // Limit per group
    groupItems = groupItems.slice(0, maxPerGroup);

    all.push(...groupItems);
  }

  // Global sort + limit
  all.sort((a, b) => (b.date || 0) - (a.date || 0));
  return all.slice(0, maxTotal);
}

async function fetchXmlWithFallback(url) {
  // Try direct fetch first
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) return await r.text();
  } catch {}

  // Then try proxies from CONFIG (if present)
  const proxyFns = [];
  if (Array.isArray(CONFIG?.corsProxies) && CONFIG.corsProxies.length) proxyFns.push(...CONFIG.corsProxies);
  else if (typeof CONFIG?.corsProxy === "function") proxyFns.push(CONFIG.corsProxy);

  for (let i = 0; i < proxyFns.length; i++) {
    try {
      const proxied = proxyFns[i](url);
      const r = await fetch(proxied, { cache: "no-store" });
      if (!r.ok) continue;
      return await r.text();
    } catch {}
  }

  return null;
}

function parseRssXml(xmlText, groupKey, groupTitle) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(xmlText, "text/xml");
  } catch {
    return [];
  }

  const items = Array.from(doc.querySelectorAll("item"));
  const out = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    const title = text(it, "title") || "Untitled";
    const link = (text(it, "link") || "").trim();
    const description = (text(it, "description") || text(it, "content\\:encoded") || "").trim();

    const pub = (text(it, "pubDate") || text(it, "dc\\:date") || "").trim();
    const date = pub ? Date.parse(pub) : 0;

    // Best-effort image extraction
    const image =
      attr(it, "media\\:content", "url") ||
      attr(it, "media\\:thumbnail", "url") ||
      attr(it, "enclosure", "url") ||
      firstImgFromHtml(description) ||
      "";

    out.push({
      title,
      link,
      description: stripHtml(description),
      image,
      date: isNaN(date) ? 0 : date,
      groupKey: String(groupKey || "").toLowerCase(),     // ✅ ALWAYS set
      groupTitle: String(groupTitle || "").trim()         // ✅ ALWAYS set
    });
  }

  return out;
}

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