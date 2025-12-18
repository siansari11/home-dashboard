const LS_KEY = "menzelijaz.tasks.v1";

function read() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function write(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function listTasks() {
  return read();
}

export function addTask(text) {
  const t = (text || "").trim();
  if (!t) return;

  const items = read();
  items.unshift({
    id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
    text: t,
    done: false,
    createdAt: Date.now()
  });
  write(items);
}

export function toggleTask(id) {
  const items = read();
  const idx = items.findIndex(x => x.id === id);
  if (idx < 0) return;
  items[idx].done = !items[idx].done;
  items[idx].doneAt = items[idx].done ? Date.now() : null;
  write(items);
}

export function deleteTask(id) {
  const items = read().filter(x => x.id !== id);
  write(items);
}

export function clearDone() {
  const items = read().filter(x => !x.done);
  write(items);
}
