export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  const wrap = document.createElement("div");

  /* ======================
     Household heading
     ====================== */
  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(255,255,255,0.92)";
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  /* ======================
     Quote block
     ====================== */
  const quoteWrap = document.createElement("div");
  quoteWrap.className = "quoteBlock";
  quoteWrap.style.marginBottom = "12px";

  const quoteText = document.createElement("div");
  quoteText.className = "quoteLine";
  quoteText.style.fontFamily = "'Great Vibes', cursive";
  quoteText.style.fontSize = "26px";           // smaller than heading
  quoteText.style.fontStyle = "italic";
  quoteText.style.color = "rgba(255,255,255,0.82)";
  quoteText.style.lineHeight = "1.25";
  quoteText.style.textShadow = "0 4px 14px rgba(0,0,0,0.25)";

  const quoteAuthor = document.createElement("div");
  quoteAuthor.style.fontSize = "12px";
  quoteAuthor.style.marginTop = "2px";
  quoteAuthor.style.color = "rgba(255,255,255,0.55)";
  quoteAuthor.style.fontStyle = "normal";

  quoteWrap.append(quoteText, quoteAuthor);

  /* ======================
     Time & date
     ====================== */
  const time = document.createElement("div");
  time.style.fontSize = "36px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";
  time.style.color = "rgba(15,23,42,0.85)";

  const date = document.createElement("div");
  date.style.color = "rgba(15,23,
