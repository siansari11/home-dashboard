import { CONFIG } from '../config.js';

async function fetchTextWithFallback(url) {
  const errors = [];
  for (const mk of CONFIG.corsProxies) {
    const proxied = mk(url);
    try {
      const res = await fetch(proxied, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { text: await res.text(), via: proxied, error: null };
    } catch (e) {
      errors.push(`${proxied} → ${String(e.message || e)}`);
    }
  }
  return { text: null, via: null, error: errors.join("\n") };
}

function pickImage(item) {
  const url =
    item.querySelector("media\\:content")?.getAttribute("url") ||
    item.querySelector("media\\:thumbnail")?.getAttribute("url") ||
    item.querySelector("enclosure")?.getAttribute("url") ||
    null;

  // avoid mixed-content blocking on https pages
  if (url && url.startsWith("http://")) return null;
  return url;
}

function parseRssOrAtom(xmlText, sourceName) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");

  // RSS
  let items = Array.from(doc.querySelectorAll("item")).map(it => ({
    source: sourceName,
    title: it.querySelector("title")?.textContent?.trim() || "Untitled",
    link:  it.querySelector("link")?.textContent?.trim() || "",
    pub:   it.querySelector("pubDate")?.textContent?.trim() || "",
    image: pickImage(it)
  }));

  if (items.length) return items;

  // Atom (some sites use <entry>)
  items = Array.from(doc.querySelectorAll("entry")).map(en => ({
    source: sourceName,
    title: en.querySelector("title")?.textContent?.trim() || "Untitled",
    link:  en.querySelector("link")?.getAttribute("href") || "",
    pub:   en.querySelector("updated")?.textContent?.trim() ||
           en.querySelector("published")?.textContent?.trim() || "",
    image: null
  }));

  return items;
}

export async function loadRssItems() {
  const all = [];
  const debug = [];

  for (const f of CONFIG.rssFeeds) {
    const { text, via, error } = await fetchTextWithFallback(f.url);

    if (!text) {
      all.push({ source: f.name, title: "Feed failed (pilot)", link: "", pub: "", image: null, error: true });
      debug.push(`${f.name}: FAILED\n${error}`);
      continue;
    }

    const parsed = parseRssOrAtom(text, f.name).slice(0, CONFIG.maxFeedItems);
    debug.push(`${f.name}: OK (${parsed.length} items) via ${via}`);
    all.push(...parsed);
  }

  all.sort((a, b) => (Date.parse(b.pub) || 0) - (Date.parse(a.pub) || 0));
  return { items: all.slice(0, CONFIG.maxFeedItems), debug };
}
