// src/lib/reels.js
import { CONFIG } from "../config.js";
import { REELS_RSS_URLS, REELS_FALLBACK, REELS_CONFIG } from "../config/reels.config.js";

function withCorsProxy(url){
  // Reuse your existing proxy config pattern (like calendar/rss)
  // If CONFIG.corsProxies exists, we try them in order.
  if (CONFIG && Array.isArray(CONFIG.corsProxies) && CONFIG.corsProxies.length){
    return CONFIG.corsProxies.map(fn => fn(url));
  }
  if (CONFIG && typeof CONFIG.corsProxy === "function"){
    return [CONFIG.corsProxy(url)];
  }
  // If no proxy configured, try direct.
  return [url];
}

async function fetchTextWithFallback(url){
  var candidates = withCorsProxy(url);
  var lastErr = null;

  for (var i = 0; i < candidates.length; i++){
    try {
      var res = await fetch(candidates[i], { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Fetch failed");
}

function parseRssItems(xmlText){
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, "text/xml");

  var items = Array.from(doc.querySelectorAll("item"));
  var out = [];

  for (var i = 0; i < items.length; i++){
    var it = items[i];

    var title = (it.querySelector("title")?.textContent || "").trim();
    var link  = (it.querySelector("link")?.textContent || "").trim();

    // image candidates (rss.app often provides one of these)
    var img =
      it.querySelector("media\\:thumbnail")?.getAttribute("url") ||
      it.querySelector("media\\:content")?.getAttribute("url") ||
      it.querySelector("enclosure")?.getAttribute("url") ||
      "";

    // Sometimes media:content is video; keep it only if it looks like an image
    if (img && !/\.(png|jpe?g|webp|gif)(\?|$)/i.test(img)) img = "";

    if (!link) continue;

    out.push({
      title: title || "Instagram Reel",
      link: link,
      image: img,
    });
  }

  return out;
}

function uniqByLink(list){
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++){
    var k = list[i]?.link;
    if (!k || seen[k]) continue;
    seen[k] = true;
    out.push(list[i]);
  }
  return out;
}

export async function loadReels(){
  var all = [];

  // Try RSS feeds
  for (var i = 0; i < REELS_RSS_URLS.length; i++){
    try {
      var xml = await fetchTextWithFallback(REELS_RSS_URLS[i]);
      var parsed = parseRssItems(xml);
      all = all.concat(parsed);
    } catch (e) {
      // ignore single-feed failures; fallback list will cover
    }
  }

  // Add fallback (always works)
  if (Array.isArray(REELS_FALLBACK) && REELS_FALLBACK.length){
    all = all.concat(REELS_FALLBACK);
  }

  all = uniqByLink(all);

  // Limit
  var max = REELS_CONFIG.maxItems || 10;
  return all.slice(0, max);
}
