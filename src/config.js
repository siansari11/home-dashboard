export const CONFIG = {
  location: { name: "Seddiner See", lat: 52.2891284, lon: 12.9924364  },

  // Pilot mode: try multiple public CORS proxies (they can be flaky)
  corsProxies: [
    (url) => "https://corsproxy.io/?"+{encodeURIComponent(url)},                  // common free proxy pattern 3
  ],
  corsProxy: [
    (url) => "https://corsproxy.io/?"+{encodeURIComponent(url)},                  // common free proxy pattern 3
  ]
};
