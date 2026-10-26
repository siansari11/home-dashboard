import "../styles/processes.css";
import { DASHBOARD_CONFIG } from "../config/dashboard.config.js";
import {
  deadlineTone,
  daysLabel,
  loadStatus,
  sortProcesses,
} from "../lib/status.js";

var STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  waiting: "Waiting",
  done: "Done",
  blocked: "Blocked",
};

var refreshTimer = null;
var settingsListening = false;

export function renderProcesses(root) {
  root.textContent = "";

  var statusEl = el("div", "processStatusLine", "Loading…");
  var bannerEl = el("div", "processBanner");
  bannerEl.setAttribute("role", "status");
  bannerEl.hidden = true;
  var bodyEl = el("div", "processBody");
  root.append(statusEl, bannerEl, bodyEl);

  var refreshMs = (DASHBOARD_CONFIG.processes && DASHBOARD_CONFIG.processes.refreshMs) || (15 * 60 * 1000);
  var refreshMin = Math.max(1, Math.round(refreshMs / 60000));
  var drawing = false;
  var again = false;

  async function draw() {
    if (drawing) {
      again = true;
      return;
    }
    drawing = true;
    statusEl.textContent = "Updating…";
    try {
      var result = await loadStatus();
      paint(result, refreshMin, statusEl, bannerEl, bodyEl);
    } catch (err) {
      bannerEl.hidden = false;
      bannerEl.textContent = "Could not load processes. " + String((err && err.message) || err || "");
      bodyEl.textContent = "";
      statusEl.textContent = "";
    } finally {
      drawing = false;
      if (again) {
        again = false;
        draw();
      }
    }
  }

  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(draw, refreshMs);

  if (!settingsListening) {
    settingsListening = true;
    window.addEventListener("homedash:settings", function () {
      draw();
    });
  }

  draw();
}

function paint(result, refreshMin, statusEl, bannerEl, bodyEl) {
  var data = (result && result.data) || { morning_brief: [], processes: [] };
  var now = new Date();

  if (result && result.fallback) {
    bannerEl.hidden = false;
    bannerEl.textContent =
      "EXAMPLE data (status.sample.json). Live status did not load (" +
      (result.error || "request failed") +
      "). Check Help.";
  } else {
    bannerEl.hidden = true;
    bannerEl.textContent = "";
  }

  var bits = [];
  if (result && result.fallback) bits.push("Example");
  if (data.source) bits.push(String(data.source));
  var when = formatGenerated(data.generated_at);
  if (when) bits.push(when);
  bits.push("every " + refreshMin + " min");
  statusEl.textContent = bits.join(" · ");

  bodyEl.textContent = "";

  var items = Array.isArray(data.morning_brief) ? data.morning_brief : [];
  var brief = el("section", "morningBrief");
  brief.appendChild(el("h3", "morningBrief__title", "Morning brief"));
  if (!items.length) {
    brief.appendChild(el("p", "morningBrief__item", "No brief items."));
  } else {
    var list = document.createElement("ul");
    list.className = "morningBrief__list";
    items.forEach(function (item) {
      list.appendChild(el("li", "morningBrief__item", String(item)));
    });
    brief.appendChild(list);
  }
  bodyEl.appendChild(brief);

  var processes = sortProcesses(data.processes, now);
  if (!processes.length) {
    bodyEl.appendChild(el("div", "emptyState", "No processes."));
    return;
  }

  var listWrap = el("div", "processList");
  processes.forEach(function (process) {
    listWrap.appendChild(renderRow(process, now));
  });
  bodyEl.appendChild(listWrap);
}

function renderRow(process, now) {
  var tone = deadlineTone(process.priority, process.deadline, now);
  var row = el("article", "processRow processRow--" + tone);

  var top = el("div", "processTop");
  top.appendChild(el("h3", "processTitle", process.title ? String(process.title) : "(untitled)"));
  top.appendChild(statusPill(process.status));
  top.appendChild(priorityPill(process.priority));
  row.appendChild(top);

  var meta = el("div", "processMeta");
  var deadlineText = process.deadline ? String(process.deadline) + " · " + daysLabel(process.deadline, now) : daysLabel(process.deadline, now);
  meta.appendChild(el("span", "processDeadline", deadlineText));
  meta.appendChild(el("span", "processOwner", "Owner: " + (process.owner ? String(process.owner) : "—")));
  if (process.updated) meta.appendChild(el("span", "processUpdated", "Updated " + String(process.updated)));
  row.appendChild(meta);

  row.appendChild(el("p", "processNext", "Next: " + (process.next_action ? String(process.next_action) : "—")));
  if (process.notes) row.appendChild(el("p", "processNotes", String(process.notes)));
  return row;
}

function statusPill(status) {
  var key = String(status || "").trim();
  var known = Object.prototype.hasOwnProperty.call(STATUS_LABELS, key);
  var pill = el("span", known ? "statusPill statusPill--" + key : "statusPill", known ? STATUS_LABELS[key] : (key || "Unknown"));
  return pill;
}

function priorityPill(priority) {
  var n = Number(priority);
  var label = isFinite(n) ? "P" + n : "P—";
  var className = "processPriority";
  if (n >= 1 && n <= 4) className += " processPriority--p" + n;
  return el("span", className, label);
}

function formatGenerated(iso) {
  if (!iso) return "";
  var date = new Date(iso);
  if (isNaN(date.getTime())) return String(iso);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
