# 🏠 Home Dashboard

A calm, kiosk-style **personal home dashboard** built with **Vite + vanilla JavaScript**, designed for tablets, wall displays, Raspberry Pi, or a rotated phone.

The dashboard focuses on **low-stress, at-a-glance information** for daily life.

---

## ✨ Features

### Header
- Household title
- Animated rotating quotes
- Clock and date
- No inline styles (CSS-only styling)

### Weather
- Current temperature
- Wind speed
- Rain probability
- Animated weather icon (served from `/public/weather`)
- Uses **Open-Meteo** (no API key required)

### Calendar
- Google Calendar integration via **private ICS link**
- Shows upcoming events (next few days)
- Groups daily routines vs one-off events
- Calendar link stored **locally only**

### Tasks
- Simple local task list
- Toggle complete / delete / clear completed
- Stored in `localStorage` (device-only)
- Todoist, when a proxy URL is set. The token is a Worker secret, not in the repo.

### Processes
- Morning brief, then one row per process (title, status, priority, deadline with days left, next action, owner)
- Row color: **red** = due in 3 days or less, or priority 1 and overdue. **Amber** = due in 14 days or less. **Green** = later, or no deadline
- Refreshes every 15 minutes
- If the URL fails, shows bundled example data (`public/status.sample.json`, every row labelled EXAMPLE)

### Lifestyle & Food
- RSS-based tiles with images
- Separate **Lifestyle** and **Food** sections
- Tile-based layout designed for scrolling & rotation
- Instagram reels supported via RSS feeds (fallback supported)

### Layout
- Responsive grid
- Portrait: stacked layout
- Landscape: equal-width columns
- Kiosk-safe (cards scroll internally, not the whole page)

---

## 🧱 Tech Stack

- **Vite**
- **Vanilla JavaScript (ES modules)**
- **CSS Grid & Flexbox**
- No frameworks
- No backend
- No tracking

---

## 📁 Project Structure

home-dashboard/
│
├── public/
│   ├── bg.jpg                 # Background image
│   └── weather/               # Weather icons
│       ├── sun.png
│       ├── partly.png
│       ├── cloudy.png
│       ├── rain.png
│       ├── storm.png
│       ├── snow.png
│       └── fog.png
│
├── src/
│   ├── components/
│   │   ├── header.js           # Title, quote, clock
│   │   ├── feed.js             # RSS (Lifestyle)
│   │   ├── reels.js            # Food / Instagram tiles
│   │   ├── agenda.js           # Calendar UI
│   │   └── tasks.js            # Tasks UI
│   │
│   ├── lib/
│   │   ├── weather.js          # Weather fetch + icon mapping
│   │   ├── calendar.js         # ICS parsing & logic
│   │   ├── rss.js              # RSS loading
│   │   └── tasks.js            # Task storage
│   │
│   ├── config/
│   │   ├── dashboard.config.js # Central config (quotes, RSS, calendar)
│   │   └── feeds.js            # RSS feed URLs
│   │
│   ├── main.js                 # App entry
│   └── styles.css              # ALL styling (no inline CSS)
│
├── index.html
├── package.json
└── README.md

---

## ⚙️ Configuration

### Dashboard behavior
Edit: src/config/dashboard.config.js

Controls:
- Quote rotation speed
- Quotes per day
- RSS refresh interval
- Calendar day window

Example:

```js
export const DASHBOARD_CONFIG = {
  calendar: { daysToShow: 4 },
  quotes: { rotateMs: 15000 },
  rss: { refreshMs: 10 * 60 * 1000 }
};
```
---
### RSS Feed

Edit: 
src/config/feeds.js

Example:

```js
export const FEED_GROUPS = [
  {
    key: "lifestyle",
    title: "Home & Lifestyle",
    urls: [
      "https://example.com/rss"
    ]
  },
  {
    key: "food",
    title: "Food",
    urls: [
      "https://rss.app/feeds/xxxxx.xml"
    ]
  }
];
```

---

### 📅 Calendar Setup

Uses Google Calendar private ICS link

Stored locally only

You will be prompted to paste the link in the UI


Google Calendar →
Settings → Your calendar → Integrate calendar →
Secret address in iCal format

---

## Settings

Saved on the device only. Do not put these values in git.

| Box | Where | Example |
| --- | --- | --- |
| Status URL | Dashboard → **Help** → Status URL | `https://api.github.com/repos/siansari11/life-status/contents/status.json` |
| Bearer token | Dashboard → **Help** → Bearer token | `github_pat_11EXAMPLE_ONLY_contents_read` |
| Calendar link | Dashboard → **Help** → Calendar link | `https://calendar.google.com/calendar/ical/you%40gmail.com/private-abc123/basic.ics` |
| Use a remote URL | Android app → **Setup** (top left) | On |
| Remote URL | Android app → **Setup** → Remote URL | `https://siansari11.github.io/home-dashboard/` |
| Start when the phone boots | Android app → **Setup** | On |

The same examples are written under each box in the app.

### Status URL and token
- Default URL is the GitHub contents API for the private repo `siansari11/life-status`, file `status.json`.
- Request header: `Accept: application/vnd.github.raw`. If the token box is filled, the app also sends `Authorization: Bearer …`.
- Leave the token blank only for a public URL. A private file without a token falls back to the EXAMPLE sample.

### Fine-grained token
1. GitHub → **Settings** → **Developer settings** → **Fine-grained personal access tokens** → **Generate new token**
2. Repository access: **Only select repositories** → `life-status`
3. Permissions: **Contents: Read-only**. Leave the rest at No access.
4. Generate, copy the `github_pat_…` value, paste it into **Bearer token**.

### Todoist token
The Worker reads the existing token from a secret. It is not in `src/config.js`.

```bash
wrangler secret put TODOIST_TOKEN
```

Paste the existing Todoist API token when prompted.
Todoist → **Settings** → **Integrations** → **Developer**.

If `wrangler` is not installed globally: `npx wrangler secret put TODOIST_TOKEN`.

Proxy URL in `src/config.js` (example): `https://todoistapiworker.sia-ansari11.workers.dev`

### Android screen saver
1. Install the debug APK (Actions artifact `home-dashboard-apk`).
2. **Settings → Display → Screen saver**
3. Pick **Home Dashboard**
4. When to start: **While charging**
5. **Start now** previews it. The saver is the same dashboard.

### Android kiosk
- Full screen, screen stays on (`FLAG_KEEP_SCREEN_ON`).
- **Setup** (top left) is the Android boxes in the table above.
- Switch **off**: the app loads the dashboard copied into the APK at build time.
- Switch **on** for boot: opens after restart. If it does not, allow **Display over other apps**, or set **Home Dashboard** as the Home app.
- **Help** (top right, inside the page) is the status URL, token, and calendar link. Those are stored per site, so the bundled app and the public site do not share them.

---

## 🚀 Running the Project

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

### Build for production

```bash

npm run build
```

Build output is generated in /dist.

### Android APK

Needs a built `dist/` first (the command below does that), then Gradle.

```bash
npm run build:apk
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`

GitHub Actions (`.github/workflows/build-apk.yml`) builds the web app, then this debug APK, and uploads the artifact `home-dashboard-apk`.

---

## 📱 Deployment Notes

Designed for:

Raspberry Pi (Chromium kiosk mode)

Tablets

Old phones (landscape mode)

Wall-mounted displays


Works offline except for weather, RSS, and a live process status.
Processes fall back to bundled EXAMPLE data when the status URL cannot be loaded.


---

## 🎨 Styling Rules (Important)

❌ No inline styles in JavaScript

✅ All visuals live in styles.css

Cards scroll internally

Page does not scroll in kiosk mode


If layout breaks:

Check grid sizing

Check min-height: 0

Check overflow rules



---

## 🔒 Privacy

No analytics

No tracking

No cloud sync

No third-party SDKs

Everything stays on the device

- Status URL and bearer token: this device only (`localStorage`)
- Todoist token: Cloudflare Worker secret `TODOIST_TOKEN` only



---

## 🧠 Design Philosophy

This dashboard is intentionally:

Calm

Non-distracting

Gentle on attention

Designed for daily grounding


Not a productivity trap —
a peaceful home companion.


---

## 🛠 Future Ideas

Raspberry Pi auto-boot kiosk setup

Touch gestures for tiles

Smart routines

Local image caching

Ambient sound mode



---

## ❤️ Credits

Built with care by Seheish Ijaz  for a calm and intentional home environment.

---
