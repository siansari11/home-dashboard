import {
  fetchTasks,
  fetchProjects,
  fetchSections,
  addTask,
  completeTask,
  deleteTask
} from "../lib/todoist.js";
import "../styles/tasks.css";

export function renderTasks(el){

  el.innerHTML = `
    <div class="sectionHead">
      <div class="pill">✅ Tasks</div>
    </div>

    <div
      id="taskList"
      style="
        max-height:25vh;
        overflow-y:auto;
        padding-right:4px;
        margin-top:10px;
      ">
    </div>

    <div style="display:flex; align-items:center; justify-content:flex-start; gap:6px; min-width:0;">
      <input id="taskInput" type="text" placeholder="Add a task…"
        style="flex:1; border:1px solid var(--line);
        background:rgba(255,255,255,0.65);
        border-radius:14px;
        padding:12px;
        font-size:14px;" />

      <button id="addBtn"
        style="border:1px solid var(--line);
        background:rgba(255,255,255,0.75);
        border-radius:14px;
        padding:12px 14px;
        font-weight:900;">
        Add
      </button>
    </div>
  `;

  const listEl = el.querySelector("#taskList");
  const input = el.querySelector("#taskInput");
  async function draw(){

    listEl.innerHTML = "Loading…";

    try {

      const [tasks, projects, sections] = await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchSections()
      ]);
      console.log("TOTAL TASKS FROM API:", tasks.length);
      console.table(
        tasks.map(t => ({
          id: t.id,
          content: t.content,
          project: t.project_id,
          section: t.section_id,
          parent: t.parent_id
        }))
      );

      const taskIds = new Set(tasks.map(t => t.id));

      const orphanTasks = tasks.filter(
        t => t.parent_id && !taskIds.has(t.parent_id)
      );

      console.log("ORPHAN TASKS:", orphanTasks);
      if (!tasks.length){
        listEl.innerHTML = `<div class="emptyState">No tasks 🎉</div>`;
        return;
      }

      // project lookup
      const projectMap = {};
      projects.forEach(p => {
        projectMap[p.id] = p;
      });
      
      // section lookup
      const sectionMap = {};
      sections.forEach(section => {
          sectionMap[section.id] = section;
      });

      // parent-child map
      const childMap = {};

      tasks.forEach(task => {
        const parent = task.parent_id || "root";

        if (!childMap[parent]){
          childMap[parent] = [];
        }

        childMap[parent].push(task);
      });

      // group root tasks by project
      const grouped = {};

      tasks
        .filter(t => !t.parent_id)
        .forEach(task => {

          const pid = task.project_id || "unknown";

          if (!grouped[pid]){
            grouped[pid] = [];
          }

          grouped[pid].push(task);
        });
        Object.values(grouped).forEach(tasks => {
          tasks.sort((a, b) => b.priority - a.priority);
        });

      listEl.innerHTML = Object.entries(grouped)
        .map(([projectId, projectTasks]) => {

          const project = projectMap[projectId];

          const projectName = project?.name || "Unknown Project";

          return `
            <details 
              style="
                margin-bottom:16px;
                border:1px solid var(--line);
                border-radius:18px;
                overflow:hidden;
                background:rgba(255,255,255,0.55);
              ">

              <summary
                style="
                  cursor:pointer;
                  padding:14px;
                  font-weight:900;
                  font-size:13px;
                  backdrop-filter:blur(8px);
                ">

                📁 ${escapeHtml(projectName)}
                <span style="opacity:.6;">
                  (${
                    projectTasks.reduce(
                      (sum, task) =>
                        sum + 1 + countAllSubtasks(task, childMap),
                      0
                    )
                  })
                </span>

              </summary>

              <div style="padding:8px; display:flex; flex-direction:column; gap:10px;">

              ${renderSections(projectTasks, sectionMap, childMap)}

              </div>

            </details>
          `;
        })
        .join("");

      // complete
      listEl.querySelectorAll("[data-toggle]").forEach(btn => {

        btn.onclick = async (e) => {

          e.stopPropagation();

          const id = btn.dataset.toggle;

          const kids = childMap[id] || [];

          if (kids.length){

            alert(
              "Complete or delete subtasks first."
            );

            return;
          }

          const ok = confirm(
            "Mark this task as completed?"
          );

          if (!ok) return;

          await completeTask(id);

          draw();
        };
      });
      // delete
      listEl.querySelectorAll("[data-del]").forEach(btn => {

        btn.onclick = async (e) => {

          e.stopPropagation();

          const id = btn.dataset.del;

          const kids = childMap[id] || [];

          const hasIncompleteKids = kids.some(k =>
            !completedState[k.id]
          );

          if (hasIncompleteKids){

            alert("Cannot delete task with incomplete subtasks.");

            return;
          }

          const ok = confirm(
            "Delete this task permanently?"
          );

          if (!ok) return;

          await deleteTask(id);

          draw();
        };
      });

    } catch (e){

      console.log(e);

      listEl.innerHTML = `
        <div class="emptyState">
          ${escapeHtml(e.message)}
        </div>
      `;
    }
  }

  el.querySelector("#addBtn").onclick = async () => {
    if (!input.value.trim()) return;

    await addTask(input.value);

    input.value = "";

    draw();
  };

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter"){

      if (!input.value.trim()) return;

      await addTask(input.value);

      input.value = "";

      draw();
    }
  });

  draw();
}
function countAllSubtasks(task, childMap){

  const kids = childMap[task.id] || [];

  return kids.reduce(
    (sum, kid) =>
      sum + 1 + countAllSubtasks(kid, childMap),
    0
  );
}
function renderSections(tasks, sectionMap, childMap){

  const grouped = {};
  const rootTasks = [];
  tasks.forEach(task => {

    // ONLY root tasks define placement
    // subtasks always render recursively

    if (task.parent_id){
      return;
    }

    // determine effective section
    // from root task only

    const sid = task.section_id;

    if (!sid){

      rootTasks.push(task);

      return;
    }

    if (!grouped[sid]){
      grouped[sid] = [];
    }

    grouped[sid].push(task);
  });

  return `

    ${rootTasks
      .sort((a, b) => b.priority - a.priority)
      .map(task =>
        renderTask(task, childMap, 0)
      ).join("")}

    ${Object.entries(grouped)
      .map(([sectionId, sectionTasks]) => {

        const section = sectionMap[sectionId];

        if (!section) return "";

        return `

          <details class="sectionGroup">

            <summary class="sectionSummary">

              📚 ${escapeHtml(section.name)}

              <span class="subtaskCount">
                (${
                  sectionTasks.reduce(
                    (sum, task) =>
                      sum + 1 + countAllSubtasks(task, childMap),
                    0
                  )
                })
              </span>

            </summary>

            <div class="sectionBody">

              ${sectionTasks
                .sort((a, b) => b.priority - a.priority)
                .map(task =>
                  renderTask(task, childMap, 0)
                ).join("")}

            </div>

          </details>

        `;
      }).join("")}

  `;
}
function renderTask(task, childMap, depth){

  const kids = (childMap[task.id] || [])
    .filter(k => k.parent_id === task.id)
    .sort((a, b) => b.priority - a.priority);

  const hasKids = kids.length > 0;

  const priorityColors = {
    4: "#ff6b6b",
    3: "#ffb84d",
    2: "#6ba8ff",
    1: "#999"
  };

  const priorityLabels = {
    4: "P1",
    3: "P2",
    2: "P3",
    1: "P4"
  };

  return `
    <details
      class="taskDetails"
      style="--depth-indent:${depth * 14}px;">

      <summary class="taskSummary">

        <div class="taskRow">

          <div class="taskMain">

            ${
              hasKids
                ? `<span class="taskArrow">▸</span>`
                : `<span class="taskArrow"></span>`
            }

            <div class="taskTitle ${depth === 0 ? "root" : "sub"}">

              <span class="${task.completed ? "completed" : ""}">
                ${escapeHtml(task.content)}
              </span>

              ${
                hasKids
                  ? `
                    <span class="subtaskCount">
                      (${kids.length})
                    </span>
                  `
                  : ""
              }

            </div>

          </div>

          <button
            data-toggle="${task.id}"
            onclick="event.stopPropagation()"
            class="taskToggleBtn ${task.completed ? "completed" : "incomplete"}">

            ${task.completed ? "✓" : ""}

          </button>
          <div
            class="priorityBadge"
            style="background:${priorityColors[task.priority] || "#999"};">

            ${priorityLabels[task.priority] || "P4"}

          </div>

          <button
            data-del="${task.id}"
            onclick="event.stopPropagation()"
            class="deleteBtn">
            ✕
          </button>

        </div>

      </summary>

      ${
        hasKids
          ? `
            <div class="taskTree">

              ${kids.map(k =>
                renderTask(k, childMap, depth + 1)
              ).join("")}

            </div>
          `
          : ""
      }

    </details>
  `;
}

function escapeHtml(s){
  return String(s || "").replace(/[&<>\"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;"
  }[m]));
}