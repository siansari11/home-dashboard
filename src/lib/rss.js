import { CONFIG } from '../config.js';

export async function loadRssItems(){
  const items = [];

  for (const f of CONFIG.rssFeeds){
    try{
      const xmlText = await fetch(CONFIG.corsProxy(f.url)).then(r => r.text());
      const doc = new DOMParser().parseFromString(xmlText, "text/xml");
      const feedItems = Array.from(doc.querySelectorAll("item")).slice(0, CONFIG.maxFeedItems);

      for (const it of feedItems){
        const title = it.querySelector("title")?.textContent?.trim() || "Untitled";
        const link  = it.querySelector("link")?.textContent?.trim() || "";
        const pub   = it.querySelector("pubDate")?.textContent?.trim() || "";
        const img =
          it.querySelector("media\\:content")?.getAttribute("url") ||
          it.querySelector("media\\:thumbnail")?.getAttribute("url") ||
          it.querySelector("enclosure")?.getAttribute("url") ||
          null;

        items.push({ source:f.name, title, link, pub, image:img });
      }
    } catch {
      items.push({ source:f.name, title:"Feed failed to load (pilot)", link:"", pub:"", image:null, error:true });
    }
  }

  items.sort((a,b) => (Date.parse(b.pub)||0) - (Date.parse(a.pub)||0));
  return items.slice(0, CONFIG.maxFeedItems);
}
