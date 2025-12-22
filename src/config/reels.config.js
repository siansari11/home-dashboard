// src/config/reels.config.js

// ✅ “Food” column sources = instagram-style rss.app feeds + recipe rss feeds
export const FOOD_RSS_URLS = [
      // --- recipes (moved from lifestyle) ---
      "https://www.skinnytaste.com/feed",
      //Mediterranean diet
      "https://rss.app/feeds/JCPNHZf100jQirCJ.json", 
      //Success stories 
      "https://rss.app/feeds/vChkVYGNhNqINcAj.json",
];

// Always-works fallback (your own reels / favorite links)
// Optional: add image URLs if you want guaranteed thumbnails.
export const FOOD_FALLBACK = [
  // { title: "Protein dinner idea", link: "https://www.skinnytaste.com/feed", image: "" },
];

export const FOOD_CONFIG = {
  maxItems: 14,
  refreshMs: 10 * 60 * 1000,
  placeholderEmoji: "🍽️",
};
