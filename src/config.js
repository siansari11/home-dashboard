export const CONFIG = {
  todoist: {
    apiToken: "eb253fa879d7b7bc4e3fa07b85f34f526f6b153b"
  },
  location: { name: "Seddiner See", lat: 52.2891284, lon: 12.9924364  },

  // Pilot mode: try multiple public CORS proxies (they can be flaky)
  corsProxies: [
    (url) => "https://corsproxy.io/?"+encodeURIComponent(url),                  // common free proxy pattern 3
  ],
  corsProxy: (url) => "https://corsproxy.io/?"+encodeURIComponent(url),                  // common free proxy pattern 3
};
