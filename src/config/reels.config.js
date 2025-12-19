// src/config/reels.config.js

// ✅ “Food” column sources = instagram-style rss.app feeds + recipe rss feeds
export const FOOD_RSS_URLS = [
    // --- recipes (moved from lifestyle) ---
  "https://www.eatingwell.com/rss",
  "https://www.skinnytaste.com/feed/",
  // --- your rss.app feeds (insta/reels style) ---
  /*
  "https://rss.app/feeds/1p7eRIJ3IbafIniz.xml",
  "https://rss.app/feeds/zJdNOAIhyefnGMux.xml",
  "https://rss.app/feeds/vChkVYGNhNqINcAj.xml",
  */


];

// Always-works fallback (your own reels / favorite links)
// Optional: add image URLs if you want guaranteed thumbnails.
export const FOOD_FALLBACK = [
  // { title: "Protein dinner idea", link: "https://www.instagram.com/reel/XXXX/", image: "" },
];

export const FOOD_CONFIG = {
  maxItems: 14,
  refreshMs: 10 * 60 * 1000,
  placeholderEmoji: "🍽️",
};
