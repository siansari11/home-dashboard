// src/config/reels.config.js
import { DASHBOARD_CONFIG } from "./dashboard.config.js";

// Your rss.app feeds (multiple profiles)
export const REELS_RSS_URLS = [
  "https://rss.app/feeds/27hBehSavl2sLsAM.xml",
  "https://rss.app/feeds/peRsMzffKPMUvH0i.xml",
  "https://rss.app/feeds/1p7eRIJ3IbafIniz.xml",
  "https://rss.app/feeds/zJdNOAIhyefnGMux.xml",
  "https://rss.app/feeds/vChkVYGNhNqINcAj.xml",
];

// Always-works fallback reels (your own / favorites)
// Add your own reels here anytime.
export const REELS_FALLBACK = [
  // Example entries (replace with your real ones)
  // { title: "My protein bowl idea", link: "https://www.instagram.com/reel/XXXX/", image: "/weather/clear.png" },
  // { title: "Declutter tip", link: "https://www.instagram.com/reel/YYYY/", image: "" },
];

// Config (can later be moved to DASHBOARD_CONFIG if you want)
export const REELS_CONFIG = {
  maxItems: 10,
  refreshMs: 15 * 60 * 1000, // 15 minutes
  // If RSS gives no image, show a consistent placeholder
  placeholderEmoji: "🎬",
};
