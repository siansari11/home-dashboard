import {
  fetchTasks,
  addTask,
  completeTask,
  deleteTask
} from "../lib/todoist.js";

export function renderTasks(el){
  el.innerHTML = `
    <div class="sectionHead">
      <div class="pill">✅ Tasks</div>
    </div>

    <div id="taskList"></div>

    <div style="display:flex; gap:10px; margin-top:10px;">
      <input id="taskInput" type="text" placeholder="Add a task…"
        style="flex:1; border:1px solid var(--line); background:rgba(255,255,255,0.65);
               border-radius:14px; padding:12px; font-size:14px;" />
      <button id="addBtn"
        style="border:1px solid var(--line); background:rgba(255,255,255,0.75);
               border-radius:14px; padding:12px 14px; font-weight:900;">
        Add
      </button>
    </div>
  `;

  const listEl = el.querySelector("#taskList");
  const input = el.querySelector("#taskInput");

  async function draw(){
    listEl.innerHTML = "Loading…";

    try {
      const items = await fetchTasks();

      if (!items.length){
        listEl.innerHTML = `<div class="emptyState">No tasks 🎉</div>`;
        return;
      }

      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${items.map(t => `
            <div style="display:grid; grid-template-columns:34px 1fr auto; gap:10px; padding:10px; border-radius:16px; border:1px solid var(--line); background:rgba(255,255,255,0.65);">

              <button data-done="${t.id}" style="border:1px solid var(--line); border-radius:12px;">✓</button>

              <div style="font-weight:900;">${escapeHtml(t.content)}</div>

              <button data-del="${t.id}" style="border:1px solid var(--line); border-radius:12px;">✕</button>

            </div>
          `).join("")}
        </div>
      `;

      // complete
      listEl.querySelectorAll("[data-done]").forEach(btn => {
        btn.onclick = async () => {
          await completeTask(btn.dataset.done);
          draw();
        };
      });

      // delete
      listEl.querySelectorAll("[data-del]").forEach(btn => {
        btn.onclick = async () => {
          await deleteTask(btn.dataset.del);
          draw();
        };
      });

    } catch (e){
      listEl.innerHTML = <div class="emptyState">${escapeHTML(e.message)}</div>;
      console.log(e);
    }
  }

  el.querySelector("#addBtn").onclick = async () => {
    await addTask(input.value);
    input.value = "";
    draw();
  };

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter"){
      await addTask(input.value);
      input.value = "";
      draw();
    }
  });

  draw();
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
