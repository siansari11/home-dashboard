const API = '/api/todoist/api/v1'

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_TODOIST_TOKEN}`
  }
}

export async function fetchTasks() {

  let allTasks = [];
  let nextCursor = null;

  do {

    const url = nextCursor
      ? `${API}/tasks?cursor=${encodeURIComponent(nextCursor)}`
      : `${API}/tasks`;

    const res = await fetch(url, {
      headers: headers()
    });

    if (!res.ok) {
      throw new Error(`Todoist fetch failed: ${res.status}`);
    }

    const data = await res.json();

    const tasks = data.results || data || [];

    allTasks.push(...tasks);

    nextCursor = data.next_cursor || null;

  } while (nextCursor);

  return allTasks;
}

// 📁 Projects
export async function fetchProjects() {
  const res = await fetch(`${API}/projects`, {
    headers: headers()
  })

  if (!res.ok) {
    throw new Error(`Project fetch failed: ${res.status}`)
  }

  const data = await res.json()

  return Array.isArray(data)
    ? data
    : (data.results || [])
}

// 📚 Sections
export async function fetchSections() {

  const res = await fetch(`${API}/sections`, {
    headers: headers()
  });

  if (!res.ok) {
    throw new Error(`Section fetch failed: ${res.status}`);
  }

  const data = await res.json();

  return Array.isArray(data)
    ? data
    : (data.results || []);
}

// ➕ Add task
export async function addTask(text) {
  const res = await fetch(`${API}/tasks?limit=200`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      content: text
    })
  })

  if (!res.ok) {
    throw new Error(`Add task failed: ${res.status}`)
  }

  return await res.json()
}

// ✅ Complete task
export async function completeTask(id) {
  const res = await fetch(`${API}/tasks/${id}/close`, {
    method: 'POST',
    headers: headers()
  })

  if (!res.ok) {
    throw new Error(`Complete task failed: ${res.status}`)
  }
}

// 🗑 Delete task
export async function deleteTask(id) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: 'DELETE',
    headers: headers()
  })

  if (!res.ok) {
    throw new Error(`Delete task failed: ${res.status}`)
  }
}