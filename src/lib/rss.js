import { CONFIG } from "../config.js";

/*
  RSS loader (pilot mode)
  - Uses public CORS proxies (browser limitation on GitHub Pages)
  - Extracts images from media tags OR HTML inside description/content:encoded
  - Decodes HTML entities like &lt;img ...&gt;
*/

async function fetchTextWithFallback(url) {
  var errors = [];

  var proxyFns = [];
  if (CONFIG.corsProxies && CONFIG.corsProxies.length) {
    proxyFns = CONFIG.corsProxies;
  } else if (CONFIG.corsProxy) {
    proxyFns = [CONFIG.corsProxy];
  }

  for (var i = 0; i < proxyFns.length; i++) {
    var proxied = proxyFns[i](url);
    try {
      var res = await fetch(proxied, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var text = await res.text();
      return { text: text, via: proxied, error: null };
    } catch (e) {
      errors.push(proxied + " -> " + String(e.message || e));
    }
  }

  return { text: null, via: null, error: errors.join("\n") };
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  // Converts &lt;img ...&gt; back into <img ...>
  var txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function normalizeImageUrl(url) {
  if (!url) return null;
  url = String(url).trim();

  // Protocol-relative: //example.com/img.jpg
  if (url.indexOf("//") === 0) url = "https:" + url;

  // Mixed content: many feeds still use http:// — try upgrading to https://
  if (url.indexOf("http://") === 0) url = "https://" + url.slice("http://".length);

  // Only accept https on GitHub Pages to avoid blocked images
  if (url.indexOf("https://") !== 0) return null;

  return url;
}

function firstImageFromHtml(html) {
  if (!html) return null;

  // Decode entities first (key fix)
  var decoded = decodeHtmlEntities(html);

  // Try to find an <img ...> tag
  // Prefer src, but also accept data-src, data-lazy-src, and srcset
  var m =
    decoded.match(/<img[^>]+src=["']([^"']+)["']/i) ||
    decoded.match(/<img[^>]+data-src=["']([^"']+)["']/i) ||
    decoded.match(/<img[^>]+data-lazy-src=["']([^"']+)["']/i);

  if (m && m[1]) {
    return normalizeImageUrl(m[1]);
  }

  // If only srcset exists, take the first URL in srcset
  var ms = decoded.match(/<img[^>]+srcset=["']([^"']+)["']/i);
  if (ms && ms[1]) {
    // srcset format: "url1 300w, url2 600w"
    var first = ms[1].split(",")[0].trim().split(" ")[0].trim();
    return normalizeImageUrl(first);
  }

  return null;
}

function pickImage(node) {
  // Explicit media fields
  var mediaContent = node.querySelector("media\\:content");
  if (mediaContent) {
    var u1 = normalizeImageUrl(mediaContent.getAttribute("url"));
    if (u1) return u1;
  }

  var mediaThumb = node.querySelector("media\\:thumbnail");
  if (mediaThumb) {
    var u2 = normalizeImageUrl(mediaThumb.getAttribute("url"));
    if (u2) return u2;
  }

  // Enclosure sometimes contains images but also audio – check type if present
  var enclosure = node.querySelector("enclosure");
  if (enclosure) {
    var type = (enclosure.getAttribute("type") || "").toLowerCase();
    var u3 = normalizeImageUrl(enclosure.getAttribute("url"));
    if (u3 && (!type || type.indexOf("image/") === 0)) return u3;
  }

  // Fallback to HTML in content:encoded / description
  var html =
    (node.querySelector("content\\:encoded") && node.querySelector("content\\:encoded").textContent) ||
    (node.querySelector("description") && node.querySelector("description").textContent) ||
    "";

  return firstImageFromHtml(html);
}

function parseRssOrAtom(xmlText, sourceName) {
  var doc = new DOMParser().parseFromString(xmlText, "text/xml");

  var items = Array.prototype.slice
    .call(doc.querySelectorAll("item"))
    .map(function (it) {
      return {
        source: sourceName,
        title:
          (it.querySelector("title") && it.querySelector("title").textContent.trim()) || "Untitled",
        link:
          (it.querySelector("link") && it.querySelector("link").textContent.trim()) || "",
        pub:
          (it.querySelector("pubDate") && it.querySelector("pubDate").textContent.trim()) || "",
        image: pickImage(it),
      };
    });

  if (items.length) return items;

  // Atom fallback (usually no embedded images)
  items = Array.prototype.slice
    .call(doc.querySelectorAll("entry"))
    .map(function (en) {
      return {
        source: sourceName,
        title:
          (en.querySelector("title") && en.querySelector("title").textContent.trim()) || "Untitled",
        link:
          (en.querySelector('link[rel="alternate"]') && en.querySelector('link[rel="alternate"]').getAttribute("href")) ||
          (en.querySelector("link") && en.querySelector("link").getAttribute("href")) ||
          "",
        pub:
          (en.querySelector("updated") && en.querySelector("updated").textContent.trim()) ||
          (en.querySelector("published") && en.querySelector("published").textContent.trim()) ||
          "",
        image: null,
      };
    });

  return items;
}

export async function loadRssItems() {
  var all = [];
  var debug = [];

  for (var i = 0; i < CONFIG.rssFeeds.length; i++) {
    var feed = CONFIG.rssFeeds[i];
    var result = await fetchTextWithFallback(feed.url);

    if (!result.text) {
      all.push({ source: feed.name, title: "Feed failed (pilot)", link: "", pub: "", image: null, error: true });
      debug.push(feed.name + ": FAILED\n" + result.error);
      continue;
    }

    var parsed = parseRssOrAtom(result.text, feed.name).slice(0, CONFIG.maxFeedItems);
    debug.push(feed.name + ": OK (" + parsed.length + " items) via " + result.via);

    for (var j = 0; j < parsed.length; j++) all.push(parsed[j]);
  }

  all.sort(function (a, b) {
    return (Date.parse(b.pub) || 0) - (Date.parse(a.pub) || 0);
  });

  return { items: all.slice(0, CONFIG.maxFeedItems), debug: debug };
}
