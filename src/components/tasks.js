import { listTasks, addTask, toggleTask, deleteTask, clearDone } from "../lib/tasks.js";

export function renderTasks(el){
  el.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px;">
      <div class="pill">✅ Tasks</div>
      <button id="clearDoneBtn"
        style="border:1px solid var(--line); background:rgba(255,255,255,0.55); color:var(--muted);
               border-radius:12px; padding:10px 12px; font-weight:900; font-size:13px">
        Clear done
      </button>
    </div>

    <div id="taskList"></div>

    <div style="display:flex; gap:10px; margin-top:10px;">
      <input id="taskInput" type="text" placeholder="Add a task…"
        style="flex:1; border:1px solid var(--line); background:rgba(255,255,255,0.65);
               border-radius:14px; padding:12px 12px; font-size:14px; outline:none;" />
      <button id="addBtn"
        style="border:1px solid var(--line); background:rgba(255,255,255,0.75); color:rgba(15,23,42,0.72);
               border-radius:14px; padding:12px 14px; font-weight:900; font-size:14px; white-space:nowrap">
        Add
      </button>
    </div>

    <div style="color:var(--muted); font-size:12px; margin-top:10px;">
      Pilot mode: tasks are stored on this device only. Sync comes next.
    </div>
  `;

  const listEl = el.querySelector("#taskList");
  const input = el.querySelector("#taskInput");

  function draw(){
    const items = listTasks();

    if (!items.length){
      listEl.innerHTML = `
        <div style="padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(255,255,255,0.55)">
          <div style="font-weight:900; color:rgba(15,23,42,0.75)">No tasks yet</div>
          <div style="margin-top:6px; font-size:13px; color:var(--muted)">Add something small (even “drink water”).</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow:auto; padding-right:4px;">
        ${items.map(t => `
          <div style="
            display:grid;
            grid-template-columns: 34px 1fr auto;
            gap:10px;
            align-items:center;
            padding:10px 12px;
            border-radius:16px;
            border:1px solid var(--line);
            background: ${t.done ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.65)"};
          ">
            <button data-toggle="${t.id}" aria-label="toggle"
              style="
                width:34px; height:34px; border-radius:12px;
                border:1px solid var(--line);
                background:${t.done ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.75)"};
                font-weight:900;
              ">
              ${t.done ? "✓" : ""}
            </button>

            <div style="min-width:0;">
              <div style="
                font-weight:900;
                color:rgba(15,23,42,0.78);
                text-decoration:${t.done ? "line-through" : "none"};
                opacity:${t.done ? 0.55 : 1};
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
              ">${escapeHtml(t.text)}</div>
              <div style="color:var(--muted); font-size:12px; margin-top:2px;">
                ${t.done ? "Completed" : "Tap ✓ when done"}
              </div>
            </div>

            <button data-del="${t.id}"
              style="border:1px solid var(--line); background:rgba(255,255,255,0.65); color:var(--muted);
                     border-radius:12px; padding:9px 10px; font-weight:900; font-size:13px;">
              Delete
            </button>
          </div>
        `).join("")}
      </div>
    `;

    // wire buttons
    listEl.querySelectorAll("[data-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        toggleTask(btn.getAttribute("data-toggle"));
        draw();
      });
    });
    listEl.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteTask(btn.getAttribute("data-del"));
        draw();
      });
    });
  }

  el.querySelector("#addBtn").addEventListener("click", () => {
    addTask(input.value);
    input.value = "";
    draw();
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addTask(input.value);
      input.value = "";
      draw();
    }
  });

  el.querySelector("#clearDoneBtn").addEventListener("click", () => {
    clearDone();
    draw();
  });

  draw();
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
