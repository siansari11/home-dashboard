// src/components/reels.js
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import { loadRssItems } from "../lib/rss.js";
import { makeQrDataUrl } from "../lib/qr.js";

export async function renderReels(el){
  el.innerHTML = "";

  const header = document.createElement("div");
  header.className = "reelsHeader";

  const pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "🍲 Food";

  const status = document.createElement("div");
  status.className = "reelsStatus";
  status.textContent = "";

  header.append(pill, status);

  const body = document.createElement("div");
  body.className = "reelsBody";
  body.textContent = "Loading…";

  el.append(header, body);

  async function refresh(){
    status.textContent = "Updating…";
    body.textContent = "Loading…";

    try{
      const all = await loadRssItems();
      const items = (all || []).filter(x => String(x.groupKey || "").toLowerCase() === "food");

      body.innerHTML = "";
      if (!items.length){
        body.append(makeEmptyCard("No food items found", "Check src/config/feeds.js and ensure the Food feeds are under group key \"food\"."));
        status.textContent = "";
        return;
      }

      const list = document.createElement("div");
      list.className = "reelsList";

      const max = Number(DASHBOARD_CONFIG?.rss?.maxItemsPerGroup || 10);
      const show = items.slice(0, max);

      for (let i = 0; i < show.length; i++){
        list.append(await makeReelRow(show[i]));
      }

      body.append(list);
      status.textContent = "Updated";
    } catch (e){
      body.innerHTML = "";
      body.append(makeEmptyCard("Food failed to load", String(e?.stack || e)));
      status.textContent = "";
    }
  }

  await refresh();

  const refreshMs = Number(DASHBOARD_CONFIG?.rss?.refreshMs || (10 * 60 * 1000));
  setInterval(refresh, refreshMs);
}

async function makeReelRow(it){
  const row = document.createElement("div");
  row.className = "reelTile";

  const media = document.createElement("div");
  media.className = "reelMedia";

  if (it.image){
    const img = document.createElement("img");
    img.className = "reelImg";
    img.alt = "";
    img.loading = "lazy";
    img.src = it.image;
    media.append(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "reelImgPlaceholder";
    media.append(ph);
  }

  const text = document.createElement("div");
  text.className = "reelText";

  const titleWrap = document.createElement("div");
  titleWrap.className = "reelTitleWrap";

  if (it.link){
    const qr = document.createElement("img");
    qr.className = "reelQrTiny";
    qr.alt = "QR";
    qr.src = await makeQrDataUrl(it.link, 72);
    titleWrap.append(qr);
  }

  const title = document.createElement("div");
  title.className = "reelTitle";
  title.textContent = it.title || "Untitled";
  titleWrap.append(title);

  const desc = document.createElement("div");
  desc.className = "reelDesc";
  desc.textContent = it.description || "";

  text.append(titleWrap, desc);

  row.append(media, text);

  if (it.link){
    row.classList.add("reelTile--clickable");
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