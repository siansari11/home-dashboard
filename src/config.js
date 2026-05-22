// src/config.js
// ─────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH — edit this file to personalise.
//  No other file needs touching for basic setup.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {

  // ── Location (used by weather) ───────────────────────────
  location: {
    name: 'Seddiner See',
    lat:  52.2891284,
    lon:  12.9924364,
  },
  todoist: {
    apiToken: "eb253fa879d7b7bc4e3fa07b85f34f526f6b153b"
  },

  // ── Todoist proxy ────────────────────────────────────────
  // The Vite dev proxy only works locally; GitHub Pages needs
  // a real proxy. Deploy workers/todoist-proxy.js to a free
  // Cloudflare Worker, then paste its URL here.
  // Leave empty ('') to show local tasks instead.
  todoistProxyUrl: 'https://todoistapiworker.sia-ansari11.workers.dev',
  // e.g. 'https://todoist-proxy.YOUR_NAME.workers.dev'

  // ── CORS proxies (for ICS calendar + RSS feeds) ──────────
  // Used by lib/calendar.js and lib/rss.js when direct fetch
  // is blocked by CORS. Listed in order of preference.
  corsProxies: [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ],

};
