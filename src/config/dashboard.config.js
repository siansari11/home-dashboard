// src/config/dashboard.config.js
// Single source of truth for all dashboard behavior settings.

export const DASHBOARD_CONFIG = {
  calendar: {
    daysToShow: 4,
  },

  quotes: {
    quotesPerDay: 4,
    dayMs: 5 * 60 * 1000,
    rotateMs: 15 * 1000,
    historyDays: 30,
    sourceUrl: "https://type.fit/api/quotes",
    listCacheDays: 7,
    maxPickAttempts: 5000,
  },

  rss: {
    // ✅ only lifestyle now
    enabledGroups: ["lifestyle","food"],

    maxItemsTotal: 12,
    maxItemsPerGroup: 12,

    refreshMs: 10 * 60 * 1000,
  },
};
