// src/lib/debug.js
const LS_KEY = "menzelijaz.debug.enabled.v1";
const ON = (localStorage.getItem(LS_KEY) ?? "1") !== "0"; // default ON

function ensureOverlay() {
  if (!ON) return null;
  let el = document.getElementById("debugOverlay");
  if (el) return el;

  el = document.createElement("div");
  el.id = "debugOverlay";
  el.style.position = "fixed";
  el.style.right = "10px";
  el.style.bottom = "10px";
  el.style.width = "320px";
  el.style.maxHeight = "220px";
  el.style.overflow = "auto";
  el.style.padding = "10px";
  el.style.borderRadius = "12px";
  el.style.border = "1px dashed rgba(220,38,38,0.45)";
  el.style.background = "rgba(255,255,255,0.75)";
  el.style.backdropFilter = "blur(8px)";
  el.style.webkitBackdropFilter = "blur(8px)";
  el.style.fontSize = "11px";
  el.style.color = "rgba(15,23,42,0.85)";
  el.style.zIndex = "99999";
  el.style.whiteSpace = "pre-wrap";
  el.style.boxShadow = "0 10px 24px rgba(2,6,23,0.18)";
  el.innerText = "Debug overlay active ✅\n";

  const btn = document.createElement("button");
  btn.textContent = "clear";
  btn.style.position = "sticky";
  btn.style.top = "0";
  btn.style.float = "right";
  btn.style.fontSize = "11px";
  btn.style.border = "1px solid rgba(15,23,42,0.18)";
  btn.style.background = "rgba(255,255,255,0.85)";
  btn.style.borderRadius = "10px";
  btn.style.padding = "4px 8px";
  btn.onclick = () => { el.innerText = "Debug overlay active ✅\n"; };
  el.appendChild(btn);

  document.body.appendChild(el);
  return el;
}

export function dbg(...args) {
  if (!ON) return;

  // console log (best)
  try { console.log("[DBG]", ...args); } catch {}

  // overlay log (always visible)
  try {
    const overlay = ensureOverlay();
    if (!overlay) return;
    const line = args.map(a => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === "string") return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(" ");

    overlay.innerText += line + "\n";
    overlay.scrollTop = overlay.scrollHeight;
  } catch {}
}
