// resources/js/gallery/helpers.js

// Liefert ein Array aus { src, alt } aus data-images / data-alts
export function readImagesFromDataset(el) {
  if (!el) return [];
  try {
    const images = JSON.parse(el.dataset.images || "[]") || [];
    const alts = safeParseArray(el.dataset.alts);
    return images
      .map((it, i) => {
        if (typeof it === "string") return { src: it, alt: alts[i] || "" };
        if (it && typeof it.src === "string") {
          return { src: it.src, alt: it.alt || alts[i] || "" };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Normalisiert URLs auf den Pfad (ohne Origin/Query), für stabile Vergleiche
export function normalizeUrlPath(u) {
  try {
    return new URL(u, location.origin).pathname;
  } catch {
    return (u || "").split("?")[0];
  }
}

// Hilfsfunktion: sicher ein Array aus JSON lesen
function safeParseArray(jsonLike) {
  try {
    const arr = JSON.parse(jsonLike || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
