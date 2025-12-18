export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "space-between";
  el.style.alignItems = "flex-end";
  el.style.padding = "8px 4px 14px 4px";
  el.style.gap = "14px";

  const left = document.createElement("div");

  const brand = document.createElement("div");
  brand.textContent = "The Menzel-Ijaz Household";
  brand.style.fontFamily = "'Great Vibes', cursive";
  brand.style.fontSize = "34px";
  brand.style.lineHeight = "1";
  brand.style.marginBottom = "6px";
  brand.style.color = "rgba(15, 23, 42, 0.88)";

  const time = document.createElement("div");
  time.style.fontSize = "38px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";

  const date = document.createElement("div");
  date.style.color = "var(--muted)";
  date.style.marginTop = "4px";
  date.style.fontSize = "14px";

  left.append(brand, time, date);

  const right = document.createElement("div");
  right.style.color = "var(--muted)";
  right.style.fontSize = "13px";
  right.style.textAlign = "right";
  right.innerHTML = `Pilot (GitHub Pages) • Calendar/Tasks: connecting…`;

  el.append(left, right);

  const tick = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    date.textContent = now.toLocaleDateString([], { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  };
  tick();
  setInterval(tick, 1000 * 10);
}
