import "../styles/help.css";
import { getIcsUrl, setIcsUrl } from "../lib/calendar.js";
import {
  SETTING_EXAMPLES,
  getStatusToken,
  getStatusUrl,
  setStatusToken,
  setStatusUrl,
} from "../lib/status.js";

export function mountHelp() {
  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "helpLauncher";
  launcher.textContent = "Help";

  var backdrop = document.createElement("div");
  backdrop.className = "helpBackdrop";

  var panel = document.createElement("div");
  panel.className = "helpPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "helpTitle");

  var top = div("helpTop");
  var title = document.createElement("h2");
  title.id = "helpTitle";
  title.className = "helpTitle";
  title.textContent = "Help & setup";
  var closeBtn = button("helpClose", "Close");
  top.append(title, closeBtn);

  var lead = p("helpLead", "Saved on this device only. Not written into the app code.");

  var statusHeading = h3("Status feed");
  var urlField = field("Status URL", "url", SETTING_EXAMPLES.statusUrl);
  var tokenField = field("Bearer token", "password", SETTING_EXAMPLES.bearerToken);
  var tokenNote = p(
    "helpNote",
    "Optional. A private GitHub file needs this. A public URL can stay blank. The dashboard sends Accept: application/vnd.github.raw."
  );

  var colorHeading = h3("Deadline colors");
  var colors = list([
    "Red — 3 days or fewer, or priority 1 and overdue",
    "Amber — 14 days or fewer",
    "Green — later, or no deadline",
  ]);

  var tokenHeading = h3("Fine-grained token");
  var tokenSteps = list([
    "GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate new token",
    "Repository access: Only select repositories → life-status",
    "Permissions: Contents → Read-only. Leave everything else at No access.",
    "Generate, copy the github_pat_… value, paste it into Bearer token.",
  ]);

  var calHeading = h3("Calendar");
  var icsField = field("Calendar link", "url", SETTING_EXAMPLES.calendarIcs);
  var calNote = p(
    "helpNote",
    "Google Calendar → Settings → your calendar → Integrate calendar → Secret address in iCal format."
  );

  var androidHeading = h3("Android app");
  var table = document.createElement("table");
  table.className = "helpTable";
  table.appendChild(tableHead());
  [
    ["Use a remote URL", "Setup → switch", SETTING_EXAMPLES.useRemote],
    ["Remote URL", "Setup → Remote URL", SETTING_EXAMPLES.remoteUrl],
    ["Start when the phone boots", "Setup → switch", SETTING_EXAMPLES.startOnBoot],
  ].forEach(function (row) {
    table.appendChild(tableRow(row[0], row[1], row[2]));
  });
  var androidNote = p(
    "helpNote",
    "On the phone, tap Setup at the top left. Off for “Use a remote URL” loads the dashboard bundled in the app. If boot does not open the app, allow Display over other apps, or set Home Dashboard as the Home app."
  );
  var androidBtn = button("helpAndroidBtn", "Open Android setup");

  var saverHeading = h3("Screen saver");
  var saver = list([
    "Install the APK, then open Settings → Display → Screen saver",
    "Pick Home Dashboard",
    "When to start: While charging",
    "Tap Start now to preview. The saver shows this same dashboard.",
  ]);

  var todoHeading = h3("Todoist token");
  var todoNote = p(
    "helpNote",
    "The Worker reads the existing token from a secret. It is not in the source."
  );
  var todoCmd = p("helpNote", "");
  var code = document.createElement("code");
  code.className = "helpCode";
  code.textContent = "wrangler secret put TODOIST_TOKEN";
  todoCmd.append("From the repo root, run ", code, " and paste the existing Todoist API token. Todoist → Settings → Integrations → Developer. If the command is not on your PATH: npx wrangler secret put TODOIST_TOKEN.");

  var error = p("helpError", "");
  var saved = p("helpSaved", "");
  var actions = div("helpActions");
  var saveBtn = button("helpSave", "Save on this device");
  actions.appendChild(saveBtn);

  panel.append(
    top,
    lead,
    statusHeading,
    urlField.label,
    tokenField.label,
    tokenNote,
    colorHeading,
    colors,
    tokenHeading,
    tokenSteps,
    calHeading,
    icsField.label,
    calNote,
    androidHeading,
    table,
    androidNote,
    androidBtn,
    saverHeading,
    saver,
    todoHeading,
    todoNote,
    todoCmd,
    error,
    saved,
    actions
  );
  backdrop.appendChild(panel);
  document.body.append(launcher, backdrop);

  function readFields() {
    urlField.input.value = getStatusUrl();
    tokenField.input.value = getStatusToken();
    icsField.input.value = getIcsUrl();
    error.textContent = "";
  }

  function open() {
    readFields();
    saved.textContent = "";
    androidBtn.hidden = !canOpenAndroidSettings();
    backdrop.classList.add("is-open");
    closeBtn.focus();
  }

  function close() {
    backdrop.classList.remove("is-open");
    launcher.focus();
  }

  launcher.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", function (event) {
    if (event.target === backdrop) close();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && backdrop.classList.contains("is-open")) close();
  });

  androidBtn.addEventListener("click", function () {
    if (canOpenAndroidSettings()) window.HomeDashboard.openSettings();
  });

  saveBtn.addEventListener("click", function () {
    error.textContent = "";
    saved.textContent = "";
    var url = urlField.input.value.trim();
    var ics = icsField.input.value.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      error.textContent = "Status URL needs to start with https:// or http://";
      return;
    }
    if (ics && !/^https?:\/\//i.test(ics)) {
      error.textContent = "Calendar link needs to start with https:// or http://";
      return;
    }
    setStatusUrl(url);
    setStatusToken(tokenField.input.value);
    setIcsUrl(ics);
    readFields();
    saved.textContent = "Saved on this device.";
    window.dispatchEvent(new Event("homedash:settings"));
  });

  readFields();
}

function canOpenAndroidSettings() {
  var bridge = window.HomeDashboard;
  return !!(bridge && typeof bridge.openSettings === "function");
}

function field(labelText, type, example) {
  var label = document.createElement("label");
  label.className = "helpField";
  var span = document.createElement("span");
  span.className = "helpField__label";
  span.textContent = labelText;
  var input = document.createElement("input");
  input.className = "helpInput";
  input.type = type;
  input.placeholder = example;
  input.autocomplete = "off";
  input.spellcheck = false;
  var exampleLine = document.createElement("span");
  exampleLine.className = "helpExample";
  exampleLine.textContent = "Example: " + example;
  label.append(span, input, exampleLine);
  return { label: label, input: input };
}

function tableHead() {
  var row = document.createElement("tr");
  ["Box", "Where", "Example"].forEach(function (text) {
    var cell = document.createElement("th");
    cell.textContent = text;
    row.appendChild(cell);
  });
  var head = document.createElement("thead");
  head.appendChild(row);
  return head;
}

function tableRow(box, where, example) {
  var row = document.createElement("tr");
  [box, where, example].forEach(function (text) {
    var cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
  });
  return row;
}

function list(items) {
  var ul = document.createElement("ul");
  ul.className = "helpList";
  items.forEach(function (text) {
    var li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
  return ul;
}

function h3(text) {
  var node = document.createElement("h3");
  node.className = "helpHeading";
  node.textContent = text;
  return node;
}

function p(className, text) {
  var node = document.createElement("p");
  node.className = className;
  node.textContent = text;
  return node;
}

function div(className) {
  var node = document.createElement("div");
  node.className = className;
  return node;
}

function button(className, text) {
  var node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = text;
  return node;
}
