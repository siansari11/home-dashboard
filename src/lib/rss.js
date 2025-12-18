import { CONFIG } from '../config.js';

async function fetchTextWithFallback(url) {
  consfunction firstHttpsImageFromHtml(html) {
  if (!html) return null;
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;
  const url = m[1];
  if (url.startsWith("https://")) return url;
  return null; // avoid mixed content on https pages
}

function pickImage(node){
  // Common explicit image fields
  const explicit =
    node.querySelector("media\\:content")?.getAttribute("url") ||
    node.querySelector("media\\:thumbnail")?.getAttribute("url") ||
    node.querySelector("enclosure")?.getAttribute("url") ||
    null;

  if (explicit && explicit.startsWith("https://")) return explicit;

  // Fallback: description/content:encoded often contains <img ...>
  const html =
    node.querySelector("content\\:encoded")?.textContent ||
    node.querySelector("description")?.textContent ||
    "";

  return firstHttpsImageFromHtml(html);
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
