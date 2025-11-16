// resources/js/gallery/state.js

// Zentrale, schlanke State-Verwaltung für die Galerie/Thumbs-Integration.
// Nutzung:
//   import { getState, setThumbActiveIndex, setThumbWindowImages, onStateChange } from "../state";
//
// - getState(): aktueller Snapshot
// - setThumbActiveIndex(n): setzt aktiven Index und informiert Listener
// - setThumbWindowImages(arr): setzt Fenster-Array (sichtbare Thumbs) und informiert Listener
// - onStateChange(fn): Subscribe auf Änderungen (einfaches Pub/Sub)

const state = {
  // Aktuell aktiver globaler Bildindex (0-basiert)
  thumbActiveIndex:
    typeof window !== "undefined" && typeof window.thumbActiveIndex === "number"
      ? window.thumbActiveIndex
      : 0,

  // Sichtbares Fenster an Thumbs (Objekte: { src, alt })
  thumbWindowImages:
    typeof window !== "undefined" && Array.isArray(window.thumbWindowImages)
      ? window.thumbWindowImages
      : [],
};

const listeners = new Set();

function emit(change) {
  for (const fn of listeners) {
    try {
      fn({ ...state }, change);
    } catch {}
  }
}

// Getter für vollständigen Snapshot
export function getState() {
  return { ...state };
}

// Setter: aktiver Index
export function setThumbActiveIndex(index) {
  if (typeof index !== "number") return;
  if (state.thumbActiveIndex === index) return;
  state.thumbActiveIndex = index;

  // Legacy: in window spiegeln, damit bestehender Code funktioniert
  if (typeof window !== "undefined") {
    window.thumbActiveIndex = index;
  }

  emit({ type: "thumbActiveIndex", value: index });
}

// Setter: Fenster-Array
export function setThumbWindowImages(arr) {
  if (!Array.isArray(arr)) return;
  state.thumbWindowImages = arr.slice(0);

  // Legacy: in window spiegeln
  if (typeof window !== "undefined") {
    window.thumbWindowImages = state.thumbWindowImages.slice(0);
  }

  emit({ type: "thumbWindowImages", value: state.thumbWindowImages.slice(0) });
}

// Subscribe
export function onStateChange(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Convenience: Initiale Spiegelung, falls außerhalb gesetzt wurde
if (typeof window !== "undefined") {
  if (typeof window.thumbActiveIndex === "number") {
    state.thumbActiveIndex = window.thumbActiveIndex;
  } else {
    window.thumbActiveIndex = state.thumbActiveIndex;
  }

  if (Array.isArray(window.thumbWindowImages)) {
    state.thumbWindowImages = window.thumbWindowImages.slice(0);
  } else {
    window.thumbWindowImages = state.thumbWindowImages.slice(0);
  }
}
