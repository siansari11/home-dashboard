// src/config/dashboard.config.js
// Single source of truth for all dashboard behavior settings.

export const DASHBOARD_CONFIG = {
  calendar: {
    // Today + next N-1 days
    daysToShow: 4,
  },

  quotes: {
    // Quotes shown per "day"
    quotesPerDay: 4,

    // TEST MODE defaults (easy to switch later)
    // Treat a "day" as 5 minutes so you can test uniqueness quickly.
    dayMs: 5 * 60 * 1000,

    // Rotate displayed quote
    rotateMs: 15 * 1000,

    // Avoid repeating quotes seen within this many "days"
    historyDays: 30,

    // Quote list source (no API key)
    sourceUrl: "https://type.fit/api/quotes",

    // Cache the big list so you don't download it constantly
    listCacheDays: 7,

    // Safety cap for picking unseen quotes
    maxPickAttempts: 5000,
  },

  rss: {
    // Which feed groups to show and in what order
    enabledGroups: ["recipes", "apartment"],

    // How many items total to show (across all enabled groups)
    maxItemsTotal: 10,

    // Optional: balance items per group (best-effort)
    maxItemsPerGroup: 6,

    // Refresh interval for re-fetching feeds
    refreshMs: 10 * 60 * 1000, // 10 minutes
  },
};
