// src/lib/rss.js
import { CONFIG } from "../config.js";
import { FEED_GROUPS } from "../config/feeds.js";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";

function getEnabledFeedGroups(){
  var enabled = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.enabledGroups) ? DASHBOARD_CONFIG.rss.enabledGroups : [];
  var map = {};
  for (var i = 0; i < enabled.length; i++) map[enabled[i]] = true;

  var out = [];
  for (var j = 0; j < FEED_GROUPS.length; j++){
    if (map[FEED_GROUPS[j].key]) out.push(FEED_GROUPS[j]);
  }
  return out;
}

async function fetchWithCorsFallback(url){
  var proxyFns = [];
  if (CONFIG.corsProxies && CONFIG.corsProxies.length) proxyFns = CONFIG.corsProxies;
  else if (CONFIG.corsProxy) proxyFns = [CONFIG.corsProxy];

  var errors = [];
  for (var i = 0; i < proxyFns.length; i++){
    var proxied = proxyFns[i](url);
    try {
      var res = await fetch(proxied, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } catch (e) {
      errors.push(proxied + " -> " + String(e.message || e));
    }
  }
  throw new Error("RSS fetch failed:\n" + errors.join("\n"));
}

function parseRssXml(xmlText){
  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, "text/xml");

  var items = Array.from(doc.querySelectorAll("item"));
  if (!items.length) items = Array.from(doc.querySelectorAll("entry")); // atom fallback

  return items.map(function(node){
    var title = textOf(node, "title");
    var link = textOf(node, "link");
    if (!link) {
      var linkEl = node.querySelector('link[rel="alternate"]') || node.querySelector("link");
      if (linkEl && linkEl.getAttribute) link = linkEl.getAttribute("href") || "";
    }

    var pubDate = textOf(node, "pubDate") || textOf(node, "published") || textOf(node, "updated") || "";
    var description = textOf(node, "description") || textOf(node, "content") || textOf(node, "summary") || "";

    var image = findImageUrl(node, description);

    return {
      title: title || "",
      link: link || "",
      pubDate: pubDate || "",
      description: description || "",
      image: image || ""
    };
  }).filter(function(x){
    return x.title && x.link;
  });
}

function textOf(node, tag){
  var el = node.querySelector(tag);
  return el ? (el.textContent || "").trim() : "";
}

function findImageUrl(node, descriptionHtml){
  // RSS media tags
  var media = node.querySelector("media\\:content, content");
  if (media && media.getAttribute) {
    var u = media.getAttribute("url");
    if (u) return u;
  }
  var enc = node.querySelector("enclosure");
  if (enc && enc.getAttribute) {
    var u2 = enc.getAttribute("url");
    if (u2) return u2;
  }

  // Try <img> in description
  var m = String(descriptionHtml || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && m[1]) return m[1];

  return "";
}

export async function loadRssItems(){
  var groups = getEnabledFeedGroups();
  var maxTotal = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.maxItemsTotal) ? DASHBOARD_CONFIG.rss.maxItemsTotal : 10;
  var maxPerGroup = (DASHBOARD_CONFIG.rss && DASHBOARD_CONFIG.rss.maxItemsPerGroup) ? DASHBOARD_CONFIG.rss.maxItemsPerGroup : 6;

  var all = [];

  for (var g = 0; g < groups.length; g++){
    var group = groups[g];
    for (var u = 0; u < group.urls.length; u++){
      var url = group.urls[u];
      try {
        var xml = await fetchWithCorsFallback(url);
        var items = parseRssXml(xml).slice(0, maxPerGroup);
        for (var i = 0; i < items.length; i++){
          all.push({
            ...items[i],
            groupKey: group.key,
            groupTitle: group.title
          });
        }
      } catch (e) {
        // Ignore one feed failing; keep others working
      }
    }
  }

  // Basic sort: newest first when pubDate parses, else keep collected order
  all.sort(function(a,b){
    var ta = Date.parse(a.pubDate) || 0;
    var tb = Date.parse(b.pubDate) || 0;
    return tb - ta;
  });

  return all.slice(0, maxTotal);
}
