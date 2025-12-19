// src/lib/reels.js
import { CONFIG } from "../config.js";
import { FOOD_RSS_URLS, FOOD_FALLBACK, FOOD_CONFIG } from "../config/reels.config.js";

function withCorsProxy(url){
  if (CONFIG && Array.isArray(CONFIG.corsProxies) && CONFIG.corsProxies.length){
    return CONFIG.corsProxies.map(fn => fn(url));
  }
  if (CONFIG && typeof CONFIG.corsProxy === "function"){
    return [CONFIG.corsProxy(url)];
  }
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

function pickFirstImgFromHtml(html){
  if (!html) return "";
  try {
    var doc = new DOMParser().parseFromString(String(html), "text/html");
    var img = doc.querySelector("img");
    var src = img ? (img.getAttribute("src") || "") : "";
    return src.trim();
  } catch (e) {
    var m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
    return m && m[1] ? String(m[1]).trim() : "";
  }
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

    var img =
      it.querySelector("media\\:thumbnail")?.getAttribute("url") ||
      it.querySelector("media\\:content")?.getAttribute("url") ||
      it.querySelector("enclosure")?.getAttribute("url") ||
      "";

    if (!img) {
      var desc = it.querySelector("description")?.textContent || "";
      img = pickFirstImgFromHtml(desc);
    }

    if (!link) continue;

    out.push({
      title: title || "Food item",
      link: link,
      image: img || "",
    });
  }

  return out;
}

function uniqByLink(list){
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++){
    var k = list[i] && list[i].link;
    if (!k || seen[k]) continue;
    seen[k] = true;
    out.push(list[i]);
  }
  return out;
}

export async function loadReels(){
  var all = [];

  for (var i = 0; i < FOOD_RSS_URLS.length; i++){
    try {
      var xml = await fetchTextWithFallback(FOOD_RSS_URLS[i]);
      all = all.concat(parseRssItems(xml));
    } catch (e) {}
  }

  if (Array.isArray(FOOD_FALLBACK) && FOOD_FALLBACK.length){
    all = all.concat(FOOD_FALLBACK);
  }

  all = uniqByLink(all);

  var max = (FOOD_CONFIG && FOOD_CONFIG.maxItems) ? FOOD_CONFIG.maxItems : 14;
  return all.slice(0, max);
}
