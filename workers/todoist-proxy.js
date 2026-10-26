/**
 * workers/todoist-proxy.js — Cloudflare Worker (free tier)
 * ─────────────────────────────────────────────────────────
 * Deploy steps:
 *  1. Sign up free at https://workers.cloudflare.com
 *  2. From the repo root (uses wrangler.toml):
 *       npx wrangler login
 *       npx wrangler deploy
 *  3. Set the existing Todoist API token as a Worker secret.
 *     You will be prompted; the value is not written into the repo:
 *       wrangler secret put TODOIST_TOKEN
 *     Token location: todoist.com/app/settings/integrations/developer
 *     Dashboard equivalent: Settings → Variables → Secret → TODOIST_TOKEN
 *  4. Copy the worker URL (https://todoistapiworker.sia-ansari11.workers.dev)
 *  5. Paste it into CONFIG.todoistProxyUrl in src/config.js
 *
 * Security: the token lives only in the Worker secret — never in the repo.
 */

const TODOIST_BASE    = 'https://api.todoist.com/api/v1/';
const ALLOWED_ORIGIN  = '*'; // Lock to 'https://siansari11.github.io' for extra security

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const incoming = new URL(request.url);
    const targetUrl = incoming.searchParams.get('url');

    if (!targetUrl) {
      return jsonResponse({ error: 'Missing ?url= parameter' }, 400);
    }

    // Only allow Todoist API URLs
    if (!targetUrl.startsWith(TODOIST_BASE)) {
      return jsonResponse({ error: 'Only Todoist API v1 URLs are allowed' }, 403);
    }

    const todoistToken = env.TODOIST_TOKEN;
    if (!todoistToken) {
      return jsonResponse({
        error: 'Worker secret TODOIST_TOKEN is not set. From the repo root run: wrangler secret put TODOIST_TOKEN',
      }, 500);
    }

    // Read optional method override (for POST/DELETE via GET-tunnelled requests)
    const methodOverride = incoming.searchParams.get('method') || request.method;
    const method = methodOverride.toUpperCase();

    // Forward body for mutations
    let body      = undefined;
    let reqHeaders = {
      'Authorization':  `Bearer ${todoistToken}`,
      'Content-Type':   'application/json',
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try { body = await request.text(); } catch { body = '{}'; }
    }

    let upstream;
    try {
      upstream = await fetch(targetUrl, {
        method,
        headers: reqHeaders,
        body: body || undefined,
      });
    } catch (err) {
      return jsonResponse({ error: 'Upstream failed', detail: String(err) }, 502);
    }

    // 204 No Content (e.g. close/delete)
    if (upstream.status === 204) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const text = await upstream.text();
    return new Response(text, {
      status:  upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
