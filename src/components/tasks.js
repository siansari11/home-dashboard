// src/components/tasks.js
import "../styles/tasks.css";
import { listTasks, addTask, toggleTask, deleteTask, clearDone } from "../lib/tasks.js";

export function renderTasks(el){
  el.innerHTML = "";

  // Header
  var header = document.createElement("div");
  header.className = "tasksHeader";

  var pill = document.createElement("div");
  pill.className = "pill";
  pill.textContent = "✅ Tasks";

  var clearBtn = document.createElement("button");
  clearBtn.id = "clearDoneBtn";
  clearBtn.className = "tasksClearBtn";
  clearBtn.type = "button";
  clearBtn.textContent = "Clear done";

  header.append(pill, clearBtn);

  // List container
  var listEl = document.createElement("div");
  listEl.id = "taskList";
  listEl.className = "taskList";

  // Add row
  var addRow = document.createElement("div");
  addRow.className = "tasksAddRow";

  var input = document.createElement("input");
  input.id = "taskInput";
  input.className = "taskInput";
  input.type = "text";
  input.placeholder = "Add a task…";

  var addBtn = document.createElement("button");
  addBtn.id = "addBtn";
  addBtn.className = "taskAddBtn";
  addBtn.type = "button";
  addBtn.textContent = "Add";

  addRow.append(input, addBtn);

  // Footer note
  var note = document.createElement("div");
  note.className = "tasksNote";
  note.textContent = "Pilot mode: tasks are stored on this device only. Sync comes next.";

  el.append(header, listEl, addRow, note);

  function draw(){
    var items = listTasks();

    listEl.innerHTML = "";

    if (!items.length){
      var empty = document.createElement("div");
      empty.className = "taskEmptyCard";

      var t = document.createElement("div");
      t.className = "taskEmptyTitle";
      t.textContent = "No tasks yet";

      var p = document.createElement("div");
      p.className = "taskEmptyText";
      p.textContent = "Add something small (even “drink water”).";

      empty.append(t, p);
      listEl.appendChild(empty);
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "taskScroll";

    for (var i = 0; i < items.length; i++){
      var task = items[i];

      var row = document.createElement("div");
      row.className = "taskRow";
      if (task.done) row.classList.add("taskRow--done");

      // Toggle button
      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "taskToggleBtn";
      if (task.done) toggleBtn.classList.add("taskToggleBtn--done");
      toggleBtn.setAttribute("aria-label", "toggle");
      toggleBtn.setAttribute("data-toggle", task.id);
      toggleBtn.textContent = task.done ? "✓" : "";

      // Main text
      var main = document.createElement("div");
      main.className = "taskMain";

      var title = document.createElement("div");
      title.className = "taskText";
      if (task.done) title.classList.add("taskText--done");
      title.textContent = task.text || "";

      var sub = document.createElement("div");
      sub.className = "taskSub";
      sub.textContent = task.done ? "Completed" : "Tap ✓ when done";

      main.append(title, sub);

      // Delete
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "taskDeleteBtn";
      delBtn.setAttribute("data-del", task.id);
      delBtn.textContent = "Delete";

      row.append(toggleBtn, main, delBtn);
      wrap.appendChild(row);
    }

    listEl.appendChild(wrap);

    // Wire buttons
    var toggles = listEl.querySelectorAll("[data-toggle]");
    for (var t = 0; t < toggles.length; t++){
      toggles[t].addEventListener("click", function(){
        toggleTask(this.getAttribute("data-toggle"));
        draw();
      });
    }

    var dels = listEl.querySelectorAll("[data-del]");
    for (var d = 0; d < dels.length; d++){
      dels[d].addEventListener("click", function(){
        deleteTask(this.getAttribute("data-del"));
        draw();
      });
    }
  }

  addBtn.addEventListener("click", function(){
    addTask(input.value);
    input.value = "";
    draw();
    input.focus();
  });

  input.addEventListener("keydown", function(e){
    if (e.key === "Enter"){
      addTask(input.value);
      input.value = "";
      draw();
    }
  });

  clearBtn.addEventListener("click", function(){
    clearDone();
    draw();
  });

  draw();
}
