// src/components/feed.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderFeed(el){
  el.innerHTML = "";

  const header = document.createElement("div");
  header.className = "feedHeader";

  const pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "🪴 Lifestyle";

  const status = document.createElement("div");
  status.className = "feedStatus";
  status.textContent = "";

  header.append(pill, status);

  const body = document.createElement("div");
  body.className = "feedBody";
  body.textContent = "Loading…";

  el.append(header, body);

  async function refresh(){
    status.textContent = "Updating…";
    body.textContent = "Loading…";

    try{
      const all = await loadRssItems();
      const items = (all || []).filter(x => String(x.groupKey || "").toLowerCase() === "lifestyle");

      body.innerHTML = "";
      if (!items.length){
        body.append(makeEmptyCard("No lifestyle items found", "Check src/config/feeds.js and ensure Lifestyle feeds are under key \"lifestyle\"."));
        status.textContent = "";
        return;
      }

      const list = document.createElement("div");
      list.className = "feedList";

      const max = Number(DASHBOARD_CONFIG?.rss?.maxItemsPerGroup || 10);
      const show = items.slice(0, max);

      for (let i = 0; i < show.length; i++){
        const it = show[i];
        list.append(await makeFeedRow(it));
      }

      body.append(list);
      status.textContent = "Updated";
    } catch (e){
      body.innerHTML = "";
      body.append(makeEmptyCard("Lifestyle failed to load", String(e?.stack || e)));
      status.textContent = "";
    }
  }

  await refresh();

  const refreshMs = Number(DASHBOARD_CONFIG?.rss?.refreshMs || (10 * 60 * 1000));
  setInterval(refresh, refreshMs);
}

async function makeFeedRow(it){
  const row = document.createElement("div");
  row.className = "feedRow";

  const media = document.createElement("div");
  media.className = "feedMedia";

  if (it.image){
    const img = document.createElement("img");
    img.className = "feedImg";
    img.alt = "";
    img.loading = "lazy";
    img.src = it.image;
    media.append(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "feedImgPlaceholder";
    media.append(ph);
  }

  const text = document.createElement("div");
  text.className = "feedText";

  const titleWrap = document.createElement("div");
  titleWrap.className = "feedTitleWrap";

  // Tiny QR in front of title
  if (it.link){
    const qr = document.createElement("img");
    qr.className = "feedQrTiny";
    qr.alt = "QR";
    qr.src = await makeQrDataUrl(it.link, 72);
    titleWrap.append(qr);
  }

  const title = document.createElement("div");
  title.className = "feedTitle";
  title.textContent = it.title || "Untitled";
  titleWrap.append(title);

  const meta = document.createElement("div");
  meta.className = "feedMeta";
  meta.textContent = it.groupTitle || "";

  const desc = document.createElement("div");
  desc.className = "feedDesc";
  desc.textContent = it.description || "";

  text.append(titleWrap, meta, desc);

  row.append(media, text);

  // Click opens link in new tab (optional; QR works even if you don’t use this)
  if (it.link){
    row.classList.add("feedRow--clickable");
    row.addEventListener("click", () => window.open(it.link, "_blank", "noopener,noreferrer"));
  }

  return row;
}

function makeEmptyCard(title, text){
  const box = document.createElement("div");
  box.className = "emptyCard";

  const t = document.createElement("div");
  t.className = "emptyTitle";
  t.textContent = title;

  const p = document.createElement("div");
  p.className = "emptyText";
  p.textContent = text;

  box.append(t, p);
  return box;
}