// src/lib/rss.js
import { CONFIG } from "../config.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { FEED_GROUPS } from "../config/feeds.js";

/**
 * Normalized items:
 * { title, link, description, image, date, groupKey, groupTitle }
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

  // ✅ new: prevents hanging forever
  const perFeedTimeoutMs = Number(cfg.perFeedTimeoutMs || 8000);

  // Fetch all groups in parallel
  const groupSettled = await Promise.allSettled(
    groups.map(async (g) => {
      const urls = Array.isArray(g.urls) ? g.urls : [];

      // Fetch all urls in parallel too
      const urlSettled = await Promise.allSettled(
        urls.map(async (u) => {
          const url = String(u || "").trim();
          if (!url) return [];
          const xml = await fetchXmlWithFallback(url, perFeedTimeoutMs);
          if (!xml) return [];
          return parseRssXml(xml, g.key, g.title);
        })
      );

      let items = [];
      for (let i = 0; i < urlSettled.length; i++) {
        if (urlSettled[i].status === "fulfilled") items = items.concat(urlSettled[i].value || []);
      }

      items.sort((a, b) => (b.date || 0) - (a.date || 0));
      return items.slice(0, maxPerGroup);
    })
  );

  let all = [];
  for (let i = 0; i < groupSettled.length; i++) {
    if (groupSettled[i].status === "fulfilled") all = all.concat(groupSettled[i].value || []);
  }

  all.sort((a, b) => (b.date || 0) - (a.date || 0));
  return all.slice(0, maxTotal);
}

async function fetchXmlWithFallback(url, timeoutMs) {
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
      const txt = await fetchTextTimeout(proxied, timeoutMs);
      if (txt) return txt;
    } catch {}
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

      // ✅ critical: makes your reels filter work
      groupKey: String(groupKey || "").toLowerCase(),
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