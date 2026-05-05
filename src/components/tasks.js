// src/components/tasks.js
export function renderTasks(el){

  // 🔴 PASTE your Todoist ICS link here
  const TODOIST_ICS = "PASTE_YOUR_ICS_LINK_HERE";

  el.innerHTML = `
    <div class="sectionHead">
      <div class="pill">✅ Tasks</div>
    </div>

    <div id="taskList">Loading…</div>
  `;

  const listEl = el.querySelector("#taskList");

  async function loadTasks(){
    try {
      const proxy = "https://corsproxy.io/?";
      const res = await fetch(proxy + encodeURIComponent(TODOIST_ICS));
      const text = await res.text();

      const tasks = parseICS(text);

      if (!tasks.length){
        listEl.innerHTML = `<div class="emptyState">No tasks 🎉</div>`;
        return;
      }

      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${tasks.map(t => `
            <a href="${t.url}" target="_blank"
              style="
                display:flex;
                flex-direction:column;
                padding:12px;
                border-radius:16px;
                border:1px solid var(--line);
                background:rgba(255,255,255,0.65);
                text-decoration:none;
              ">

              <div style="font-weight:900; color:rgba(15,23,42,0.8);">
                ${escapeHtml(t.title)}
              </div>

              ${t.date ? `
                <div style="font-size:12px; color:var(--muted); margin-top:4px;">
                  ${t.date}
                </div>
              ` : ""}

            </a>
          `).join("")}
        </div>
      `;

    } catch (e){
      console.log("Todoist load error:", e);
      listEl.innerHTML = `<div class="emptyState">Failed to load tasks</div>`;
    }
  }

  loadTasks();
  setInterval(loadTasks, 5 * 60 * 1000); // refresh every 5 min
}

/* =========================
   ICS PARSER (simple + reliable)
   ========================= */

function parseICS(text){
  const events = text.split("BEGIN:VEVENT");
  const tasks = [];

  for (let i = 1; i < events.length; i++){
    const block = events[i];

    const title = match(block, "SUMMARY");
    const url = match(block, "URL");
    const dt = match(block, "DTSTART");

    tasks.push({
      title: title || "Task",
      url: url || "#",
      date: formatDate(dt)
    });
  }

  return tasks;
}

function match(block, key){
  const regex = new RegExp(key + ":(.+)");
  const m = block.match(regex);
  return m ? m[1].trim() : "";
}

function formatDate(dt){
  if (!dt) return "";

  // handle YYYYMMDD or YYYYMMDDTHHmmss
  if (/^\\d{8}$/.test(dt)){
    return "All day";
  }

  try {
    const year = dt.slice(0,4);
    const month = dt.slice(4,6);
    const day = dt.slice(6,8);
    const hour = dt.slice(9,11);
    const min = dt.slice(11,13);

    const d = new Date(`${year}-${month}-${day}T${hour}:${min}:00`);

    return d.toLocaleString([], {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}