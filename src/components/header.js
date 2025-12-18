export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "center";
  el.style.alignItems = "center";
  el.style.padding = "14px 4px 18px 4px";
  el.style.textAlign = "center";

  const wrap = document.createElement("div");

  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "44px";          // bigger
  brand.style.lineHeight = "1.1";
  brand.style.marginBottom = "8px";
  brand.style.color = "rgba(255,255,255,0.92)"; // soft white
  brand.style.textShadow = "0 6px 20px rgba(0,0,0,0.25)";

  const time = document.createElement("div");
  time.style.fontSize = "36px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";
  time.style.color = "rgba(15,23,42,0.85)";

  const date = document.createElement("div");
  date.style.color = "rgba(15,23,42,0.55)";
  date.style.marginTop = "4px";
  date.style.fontSize = "14px";

  wrap.append(brand, time, date);
  el.append(wrap);

  const tick = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  tick();
  setInterval(tick, 1000 * 10);
}
