export const CONFIG = {
  location: { name: "Berlin", lat: 52.52, lon: 13.405 },

  rssFeeds: [
    { name: "Minimalist Baker", url: "https://minimalistbaker.com/feed/" },
    { name: "Apartment Therapy", url: "https://www.apartmenttherapy.com/main.rss" }
  ],

  maxFeedItems: 12,

  // Pilot-only: uses a free CORS proxy. Later (Pi) we remove this.
  corsProxy: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
};
