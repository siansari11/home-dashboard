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

  // ── Todoist proxy ────────────────────────────────────────
  // The token is not stored in this repo. The Worker reads the
  // existing token from the TODOIST_TOKEN secret:
  //   wrangler secret put TODOIST_TOKEN
  // Deploy workers/todoist-proxy.js, then paste its URL here.
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
