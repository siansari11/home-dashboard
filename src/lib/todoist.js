// src/lib/todoist.js
// ─────────────────────────────────────────────────────────────
//  Todoist REST API v1 — routed through a Cloudflare Worker
//  proxy so the token never lives in the browser bundle.
//
//  Set CONFIG.todoistProxyUrl in src/config.js.
//  If it's empty, every export throws a "not configured" error
//  and tasks.js shows a friendly setup notice instead.
// ─────────────────────────────────────────────────────────────

import { CONFIG } from '../config.js';

const TODOIST_BASE = 'https://api.todoist.com/api/v1';

// ── Internal helpers ─────────────────────────────────────────

function proxyUrl() {
  return (CONFIG.todoistProxyUrl || '').trim();
}

function isConfigured() {
  return proxyUrl().length > 0;
}

function buildUrl(path, method = 'GET') {
  const proxy  = proxyUrl();
  const apiUrl = TODOIST_BASE + path;
  // Worker accepts: ?url=<encoded>&method=POST etc.
  return `${proxy}?url=${encodeURIComponent(apiUrl)}&method=${method}`;
}

async function apiFetch(path, { method = 'GET', body } = {}) {
  if (!isConfigured()) {
    throw new Error('not_configured');
  }

  const url     = buildUrl(path, method);
  const options = { method: 'GET' }; // Worker always receives GET

  // For mutation ops, proxy reads ?method= and forwards correctly
  if (body) {
    // Pass body as a base64 query param so it survives a GET tunnel
    // Simpler: the worker supports POST natively — use it directly
    const proxy  = proxyUrl();
    const apiUrl = TODOIST_BASE + path;
    const res = await fetch(`${proxy}?url=${encodeURIComponent(apiUrl)}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Todoist ${method} ${path} failed: ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Todoist GET ${path} failed: ${res.status}`);
  return res.json();
}

// ── Public API ───────────────────────────────────────────────

export function isTodoistConfigured() {
  return isConfigured();
}

export async function fetchTasks() {
  let allTasks   = [];
  let nextCursor = null;

  do {
    const path = nextCursor
      ? `/tasks?cursor=${encodeURIComponent(nextCursor)}`
      : '/tasks';
    const data = await apiFetch(path);
    const tasks = data.results || data || [];
    allTasks.push(...tasks);
    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  return allTasks;
}

export async function fetchProjects() {
  const data = await apiFetch('/projects');
  return Array.isArray(data) ? data : (data.results || []);
}

export async function fetchSections() {
  const data = await apiFetch('/sections');
  return Array.isArray(data) ? data : (data.results || []);
}

export async function addTask(text) {
  return apiFetch('/tasks', { method: 'POST', body: { content: text } });
}

export async function completeTask(id) {
  return apiFetch(`/tasks/${id}/close`, { method: 'POST' });
}

export async function deleteTask(id) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}
