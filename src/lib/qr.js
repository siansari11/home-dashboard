// src/lib/qr.js
// Tiny, dependency-free QR generator using a public image endpoint.
// No keys, no subscription.
// Returns a data URL? -> No, returns a normal URL that can be used as <img src="...">.
//
// NOTE: If you ever want fully offline QR generation later, we can swap this
// for a local QR library, but this is simplest + works on GitHub Pages.

export function makeQrDataUrl(text, sizePx){
  var s = Number(sizePx || 72);
  if (!isFinite(s) || s < 32) s = 72;

  var payload = encodeURIComponent(String(text || ""));
  // qrserver is a simple public QR image generator
  return "https://api.qrserver.com/v1/create-qr-code/?size=" + s + "x" + s + "&data=" + payload;
}
