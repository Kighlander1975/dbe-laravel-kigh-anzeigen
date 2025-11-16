// resources/js/app.js

// 0) Performance/Timing-Utilities zuerst laden (stellt window.nextPaintWithTimeout bereit)
import "./utils/perf";

// 1) Globale Setups (Axios/CSRF, Echo etc.)
import "./bootstrap";

// 2) Alpine.js (falls du es nutzt)
import Alpine from "alpinejs";
window.Alpine = Alpine;
Alpine.start();

// 3) Deine Module – Reihenfolge bewusst gewählt, falls Abhängigkeiten bestehen
import "./gallery/state";
import { getState } from "./gallery/state";
import "./gallery/cpSetByIndex";
import { initGallery } from "./gallery/initGallery";
import { initThumbs } from "./thumbs/initThumbs";

// Wichtig: Named-Import, damit wir ihn ans window hängen können
import { handleThumbScrollDownClick } from "./thumbs/handleThumbScrollDownClick";

// Side-Effect-Module
import "./thumbs/showThumbsByIndices";
import { ensureThumbVisible } from "./thumbs/ensureThumbVisible";
import "./favorite/initFavoriteToggle";

// Für Konsolen-Debug: global verfügbar machen
window.handleThumbScrollDownClick = handleThumbScrollDownClick;

// Optional nützlich für Debugging:
window.initThumbs = initThumbs;
window.initGallery = initGallery;
window.getGalleryState = getState;
window.ensureThumbVisible = ensureThumbVisible;

function boot() {
  initThumbs({ step: 1 });
  try {
    ensureThumbVisible(0);
  } catch (e) {
    console.warn("[app] ensureThumbVisible init failed:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

// Optionales Log zur Kontrolle (kannst du entfernen)
if (import.meta.env.DEV) {
  console.log("[app] app.js loaded");
}
