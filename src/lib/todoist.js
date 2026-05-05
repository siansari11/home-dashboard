import { CONFIG } from "../config.js";

const API = "https://corsproxy.io/?https://api.todoist.com/rest/v2";

function headers(){
  return {
    "Authorization": "Bearer " + CONFIG.todoist.apiToken,
    "Content-Type": "application/json"
  };
}

// 📥 Get tasks
export async function fetchTasks(){
  const res = await fetch(API + "/tasks", { headers: headers() });
  return await res.json();
}

// ➕ Add task
export async function addTask(text){
  if (!text || !text.trim()) return;

  await fetch(API + "/tasks", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ content: text })
  });
}

// ✅ Complete task
export async function completeTask(id){
  await fetch(API + "/tasks/" + id + "/close", {
    method: "POST",
    headers: headers()
  });
}

// 🗑 Delete task
export async function deleteTask(id){
  await fetch(API + "/tasks/" + id, {
    method: "DELETE",
    headers: headers()
  });
}
