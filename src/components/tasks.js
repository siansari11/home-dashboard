// src/components/tasks.js
import {
  isTodoistConfigured,
  fetchTasks,
  fetchProjects,
  fetchSections,
  addTask,
  completeTask,
  deleteTask,
} from '../lib/todoist.js';
import '../styles/tasks.css';

export function renderTasks(el) {

  el.innerHTML = `
    <div class="sectionHead">
      <div class="pill">✅ Tasks</div>
    </div>
    <div id="taskList" class="taskList"></div>
    <div class="taskInputRow">
      <input id="taskInput" type="text" placeholder="Add a task…" class="taskInput" />
      <button id="addBtn" class="taskAddBtn">Add</button>
    </div>
  `;

  const listEl = el.querySelector('#taskList');
  const input  = el.querySelector('#taskInput');

  // ── Not configured — show local-tasks fallback ────────────
  if (!isTodoistConfigured()) {
    renderLocalFallback(listEl, input, el.querySelector('#addBtn'));
    return;
  }

  // ── Todoist ───────────────────────────────────────────────
  async function draw() {
    listEl.innerHTML = 'Loading…';

    try {
      const [tasks, projects, sections] = await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchSections(),
      ]);

      if (!tasks.length) {
        listEl.innerHTML = '<div class="emptyState">No tasks 🎉</div>';
        return;
      }

      const projectMap = {};
      projects.forEach(p => { projectMap[p.id] = p; });

      const sectionMap = {};
      sections.forEach(s => { sectionMap[s.id] = s; });

      const childMap = {};
      tasks.forEach(task => {
        const parent = task.parent_id || 'root';
        if (!childMap[parent]) childMap[parent] = [];
        childMap[parent].push(task);
      });

      const grouped = {};
      tasks
        .filter(t => !t.parent_id)
        .forEach(task => {
          const pid = task.project_id || 'unknown';
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(task);
        });

      Object.values(grouped).forEach(list => {
        list.sort((a, b) => b.priority - a.priority);
      });

      listEl.innerHTML = Object.entries(grouped)
        .map(([projectId, projectTasks]) => {
          const project     = projectMap[projectId];
          const projectName = project?.name || 'Unknown Project';
          const totalCount  = projectTasks.reduce(
            (sum, t) => sum + 1 + countAllSubtasks(t, childMap), 0
          );

          return `
            <details class="projectGroup">
              <summary class="projectSummary">
                📁 ${escapeHtml(projectName)}
                <span class="subtaskCount">(${totalCount})</span>
              </summary>
              <div class="projectBody">
                ${renderSections(projectTasks, sectionMap, childMap)}
              </div>
            </details>
          `;
        })
        .join('');

      // Complete
      listEl.querySelectorAll('[data-toggle]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id   = btn.dataset.toggle;
          const kids = childMap[id] || [];
          if (kids.length) { alert('Complete or delete subtasks first.'); return; }
          if (!confirm('Mark this task as completed?')) return;
          await completeTask(id);
          draw();
        };
      });

      // Delete
      listEl.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id   = btn.dataset.del;
          const kids = childMap[id] || [];
          if (kids.length) { alert('Cannot delete task with incomplete subtasks.'); return; }
          if (!confirm('Delete this task permanently?')) return;
          await deleteTask(id);
          draw();
        };
      });

    } catch (err) {
      listEl.innerHTML = `<div class="emptyState">${escapeHtml(err.message)}</div>`;
    }
  }

  el.querySelector('#addBtn').onclick = async () => {
    if (!input.value.trim()) return;
    await addTask(input.value.trim());
    input.value = '';
    draw();
  };

  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter' || !input.value.trim()) return;
    await addTask(input.value.trim());
    input.value = '';
    draw();
  });

  draw();
}

// ── Local-storage fallback when Todoist not configured ────────

function renderLocalFallback(listEl, input, addBtn) {
  const LS_KEY = 'menzelijaz.tasks.v1';

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  }

  function writeLocal(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function drawLocal() {
    const items = readLocal();
    if (!items.length) {
      listEl.innerHTML = '<div class="emptyState">No tasks yet — add one below.</div>';
      return;
    }
    listEl.innerHTML = items.map(item => `
      <div class="taskRow ${item.done ? 'taskRow--done' : ''}">
        <div class="taskMain">
          <span class="taskArrow"></span>
          <div class="taskTitle root ${item.done ? 'completed' : ''}">
            ${escapeHtml(item.text)}
          </div>
        </div>
        <button class="taskToggleBtn ${item.done ? 'completed' : 'incomplete'}"
                data-local-toggle="${escapeHtml(item.id)}">
          ${item.done ? '✓' : ''}
        </button>
        <button class="deleteBtn" data-local-del="${escapeHtml(item.id)}">✕</button>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-local-toggle]').forEach(btn => {
      btn.onclick = () => {
        const id    = btn.dataset.localToggle;
        const items = readLocal();
        const idx   = items.findIndex(x => x.id === id);
        if (idx < 0) return;
        items[idx].done = !items[idx].done;
        writeLocal(items);
        drawLocal();
      };
    });

    listEl.querySelectorAll('[data-local-del]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.localDel;
        writeLocal(readLocal().filter(x => x.id !== id));
        drawLocal();
      };
    });
  }

  if (addBtn) {
    addBtn.onclick = () => {
      if (!input.value.trim()) return;
      const items = readLocal();
      items.unshift({
        id:   String(Date.now()) + '_' + Math.random().toString(16).slice(2),
        text: input.value.trim(),
        done: false,
      });
      writeLocal(items);
      input.value = '';
      drawLocal();
    };
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (addBtn) addBtn.onclick();
    });
  }

  drawLocal();
}

// ── Task tree rendering ───────────────────────────────────────

function countAllSubtasks(task, childMap) {
  const kids = childMap[task.id] || [];
  return kids.reduce((sum, kid) => sum + 1 + countAllSubtasks(kid, childMap), 0);
}

function renderSections(tasks, sectionMap, childMap) {
  const grouped   = {};
  const rootTasks = [];

  tasks.forEach(task => {
    if (task.parent_id) return;
    const sid = task.section_id;
    if (!sid) { rootTasks.push(task); return; }
    if (!grouped[sid]) grouped[sid] = [];
    grouped[sid].push(task);
  });

  return `
    ${rootTasks
      .sort((a, b) => b.priority - a.priority)
      .map(task => renderTask(task, childMap, 0))
      .join('')}

    ${Object.entries(grouped).map(([sectionId, sectionTasks]) => {
      const section = sectionMap[sectionId];
      if (!section) return '';
      const total = sectionTasks.reduce(
        (sum, t) => sum + 1 + countAllSubtasks(t, childMap), 0
      );
      return `
        <details class="sectionGroup">
          <summary class="sectionSummary">
            📚 ${escapeHtml(section.name)}
            <span class="subtaskCount">(${total})</span>
          </summary>
          <div class="sectionBody">
            ${sectionTasks
              .sort((a, b) => b.priority - a.priority)
              .map(task => renderTask(task, childMap, 0))
              .join('')}
          </div>
        </details>
      `;
    }).join('')}
  `;
}

function renderTask(task, childMap, depth) {
  const kids = (childMap[task.id] || [])
    .filter(k => k.parent_id === task.id)
    .sort((a, b) => b.priority - a.priority);

  const hasKids = kids.length > 0;

  const priorityClasses = { 4: 'p1', 3: 'p2', 2: 'p3', 1: 'p4' };
  const priorityLabels  = { 4: 'P1', 3: 'P2', 2: 'P3', 1: 'P4' };
  const pClass = priorityClasses[task.priority] || 'p4';
  const pLabel = priorityLabels[task.priority]  || 'P4';

  return `
    <details class="taskDetails" style="--depth-indent:${depth * 14}px;">
      <summary class="taskSummary">
        <div class="taskRow">
          <div class="taskMain">
            <span class="taskArrow">${hasKids ? '▸' : ''}</span>
            <div class="taskTitle ${depth === 0 ? 'root' : 'sub'} ${task.completed ? 'completed' : ''}">
              ${escapeHtml(task.content)}
              ${hasKids ? `<span class="subtaskCount">(${kids.length})</span>` : ''}
            </div>
          </div>
          <button data-toggle="${task.id}" onclick="event.stopPropagation()"
                  class="taskToggleBtn ${task.completed ? 'completed' : 'incomplete'}">
            ${task.completed ? '✓' : ''}
          </button>
          <div class="priorityBadge priorityBadge--${pClass}">${pLabel}</div>
          <button data-del="${task.id}" onclick="event.stopPropagation()" class="deleteBtn">✕</button>
        </div>
      </summary>
      ${hasKids ? `
        <div class="taskTree">
          ${kids.map(k => renderTask(k, childMap, depth + 1)).join('')}
        </div>
      ` : ''}
    </details>
  `;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[m]));
}
