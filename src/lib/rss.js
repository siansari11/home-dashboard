// src/lib/rss.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";

/**
 * Returns normalized items:
 * { title, link, description, image, date, groupKey, groupTitle }
 *
 * IMPORTANT:
 * - Runs in browser only
 * - Adds timeouts so dashboard never hangs
 * - Fetches feeds in parallel so one slow feed doesn't block all
 */
export async function loadRssItems() {
  const cfg = DASHBOARD_CONFIG?.rss || {};
  const enabled = Array.isArray(cfg.enabledGroups) ? cfg.enabledGroups : null;

  const groups = (FEED_GROUPS || []).filter((g) => {
    if (!enabled) return true;
    return enabled.includes(g.key);
  });

  const maxTotal = Number(cfg.maxItemsTotal || 12);
  const maxPerGroup = Number(cfg.maxItemsPerGroup || 8);

  // Per-feed timeout (prevents "Loading…" forever)
  const perFeedTimeoutMs = Number(cfg.perFeedTimeoutMs || 8000);

  const groupResults = await Promise.allSettled(
    groups.map(async (g) => {
      const urls = Array.isArray(g.urls) ? g.urls : [];
      const perUrl = await Promise.allSettled(
        urls.map(async (url) => {
          const xml = await fetchXmlWithFallback(String(url || "").trim(), perFeedTimeoutMs);
          if (!xml) return [];
          return parseRssXml(xml, g.key, g.title);
        })
      );

      // Flatten successful url-results
      let items = [];
      for (let i = 0; i < perUrl.length; i++) {
        if (perUrl[i].status === "fulfilled") items = items.concat(perUrl[i].value || []);
      }

      // Sort newest first, limit per group
      items.sort((a, b) => (b.date || 0) - (a.date || 0));
      items = items.slice(0, maxPerGroup);

      return items;
    })
  );

  // Flatten successful group-results
  let all = [];
  for (let i = 0; i < groupResults.length; i++) {
    if (groupResults[i].status === "fulfilled") all = all.concat(groupResults[i].value || []);
  }

  // Global sort + limit
  all.sort((a, b) => (b.date || 0) - (a.date || 0));
  return all.slice(0, maxTotal);
}

async function fetchXmlWithFallback(url, timeoutMs) {
  if (!url) return null;

  // Try direct
  const direct = await fetchWithTimeout(url, timeoutMs);
  if (direct.ok) return direct.text;

  // Try proxies from CONFIG (if present)
  const proxyFns = [];
  if (Array.isArray(CONFIG?.corsProxies) && CONFIG.corsProxies.length) proxyFns.push(...CONFIG.corsProxies);
  else if (typeof CONFIG?.corsProxy === "function") proxyFns.push(CONFIG.corsProxy);

  for (let i = 0; i < proxyFns.length; i++) {
    try {
      const proxied = proxyFns[i](url);
      const r = await fetchWithTimeout(proxied, timeoutMs);
      if (r.ok) return r.text;
    } catch {}
  }

  return null;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    const text = await res.text();
    return { ok: res.ok, text };
  } catch {
    return { ok: false, text: null };
  } finally {
    clearTimeout(t);
  }
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
      groupKey: String(groupKey || "").toLowerCase(),  // ✅ tagging for filtering
      groupTitle: String(groupTitle || "").trim(),
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