export const CONFIG = {
  location: { name: "Seddiner See", lat: 52.2891284, lon: 12.9924364  },

  rssFeeds: [
    { name: "Skinnytaste", url: "https://www.skinnytaste.com/feed/" },
    { name: "The Kitchn", url: "https://www.thekitchn.com/main.rss" },
    { name: "The Spruce", url: "https://www.thespruce.com/rss" },
    { name: "Apartment Therapy", url: "https://www.apartmenttherapy.com/main.rss" },
    { name: "A Slob Comes Clean", url: "https://www.aslobcomesclean.com/feed/" }
  ],

  maxFeedItems: 12,

  // Pilot mode: try multiple public CORS proxies (they can be flaky)
  corsProxies: [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,     // AllOrigins 2
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`                  // common free proxy pattern 3
  ]
};
