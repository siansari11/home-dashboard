 import { CONFIG } from '../config.js';

/**
 * Pilot mode notes:
 * - On GitHub Pages we must use public CORS proxies to fetch RSS (browser limitation).
 * - These proxies can be flaky; we try multiple.
 * - Many feeds don't expose media:content/enclosure, so we also extract the first <img> from description/content:encoded.
 */

async function fetchTextWithFallback(url) {
  const errors = [];

  // Backward compatibility if you still have CONFIG.corsProxy
  const proxyFns = CONFIG.corsProxies?.length
    ? CONFIG.corsProxies
    : (CONFIG.corsProxy ? [CONFIG.corsProxy] : []);

  for (const mk of proxyFns) {
    const proxied = mk(url);
    try {
      const res = await fetch(proxied, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { text: await res.text(), via: proxied, error: null };
    } catch (e) {
      errors.push(`${proxied} → ${String(e?.message || e)}`);
    }
  }

  return { text: null, via: null, error: errors.join('\n') };
}

function firstHttpsImageFromHtml(html) {
  if (!html) return null;

  // Some RSS puts images in CDATA inside description/content:encoded
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;

  const url = m[1]?.trim();
  if (!url) return null;

  // Avoid mixed content issues on https GitHub Pages
  if (url.startsWith('https://')) return url;

  // Sometimes it's protocol-relative: //example.com/img.jpg
  if (url.startsWith('//')) return `https:${url}`;

  return null;
}

function pickImage(node) {
  // Common explicit image fields in RSS
  const explicit =
    node.querySelector('media\\:content')?.getAttribute('url') ||
    node.querySelector('media\\:thumbnail')?.getAttribute('url') ||
    node.querySelector('enclosure')?.getAttribute('url') ||
    null;

  if (explicit) {
    const u = explicit.trim();
    if (u.startsWith('https://')) return u;
    if (u.startsWith('//')) return `https:${u}`;
  }

  // Fallback: pull first <img> from content:encoded or description
  const html =
    node.querySelector('content\\:encoded')?.textContent ||
    node.querySelector('description')?.textContent ||
    '';

  return firstHttpsImageFromHtml(html);
}

function parseRssOrAtom(xmlText, sourceName) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

  // RSS: <item>
  let items = Array.from(doc.querySelectorAll('item')).map((it) => ({
    source: sourceName,
    title: it.querySelector('title')?.textContent?.trim() || 'Untitled',
    link: it.querySelector('link')?.textContent?.trim() || '',
    pub: it.querySelector('pubDate')?.textContent?.trim() || '',
    image: pickImage(it),
  }));

  if (items.length) return items;

  // Atom: <entry>
  items = Array.from(doc.querySelectorAll('entry')).map((en) => ({
    source: sourceName,
    title: en.querySelector('title')?.textContent?.trim() || 'Untitled',
    link:
      en.querySelector('link[rel="alternate"]')?.getAttribute('href') ||
      en.querySelector('link')?.getAttribute('href') ||
      '',
    pub:
      en.querySelector('updated')?.textContent?.trim() ||
      en.querySelector('published')?.textContent?.trim() ||
      '',
    // Atom feeds often don't contain images; we'll add OG-image fetching later on the Pi
    image: null,
  }));

  return items;
}

export async function loadRssItems() {
  const all = [];
  const debug = [];

  for (const f of CONFIG.rssFeeds) {
    const { text, via, error } = await fetchTextWithFallback(f.url);

    if (!text) {
      all.push({
        source: f.name,
        title: 'Feed failed (pilot)',
        link: '',
        pub: '',
        image: null,
        error: true,
      });
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
```0
