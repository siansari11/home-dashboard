export function renderHeader(el){
  el.style.display = "flex";
  el.style.justifyContent = "space-between";
  el.style.alignItems = "flex-end";
  el.style.padding = "8px 4px 14px 4px";

  const left = document.createElement("div");
  const time = document.createElement("div");
  time.style.fontSize = "44px";
  time.style.fontWeight = "800";
  time.style.letterSpacing = "-0.02em";

  const date = document.createElement("div");
  date.style.color = "var(--muted)";
  date.style.marginTop = "6px";
  date.style.fontSize = "14px";

  const right = document.createElement("div");
  right.style.color = "var(--muted)";
  right.style.fontSize = "13px";
  right.style.textAlign = "right";
  right.textContent = "Pilot (GitHub Pages) • Pi later for stable sync";

  left.append(time, date);
  el.append(left, right);

  const tick = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    date.textContent = now.toLocaleDateString([], { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  };
  tick();
  setInterval(tick, 1000 * 10);
}
