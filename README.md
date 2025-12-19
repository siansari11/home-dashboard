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


---

## 📱 Deployment Notes

Designed for:

Raspberry Pi (Chromium kiosk mode)

Tablets

Old phones (landscape mode)

Wall-mounted displays


Works offline except for weather & RSS refresh.


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
