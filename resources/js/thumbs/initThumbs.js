// resources/js/thumbs/initThumbs.js
import {
  getState,
  setThumbWindowImages,
  setThumbActiveIndex,
} from "../gallery/state";
import { showThumbsByIndices } from "./showThumbsByIndices";
import { readImagesFromDataset } from "../gallery/helpers";

/**
 * Initialisiert die Thumbnail-Leiste (delegiertes Event-Handling).
 * - Liest alle Bilder aus .current-picture[data-images]
 * - Bestimmt Fenstergröße anhand der vorhandenen .thumb-Slots
 * - Setzt initiales Fenster und rendert
 * - Delegiert Klicks auf [data-action="thumbs-scroll-up|down"] innerhalb des Root-Containers
 *
 * Optionen:
 * - rootSelector: Container der Thumbnail-Leiste (default ".thumb-pictures")
 * - viewportSelector: Element, das die .thumb-Slots enthält (default ".thumb-viewport")
 * - step: Schrittweite beim Scrollen (default 1)
 */
export function initThumbs(opts = {}) {
  const {
    rootSelector = ".thumb-pictures",
    viewportSelector = ".thumb-viewport",
    step = 1,
  } = opts;

  const root = document.querySelector(rootSelector);
  const viewport = root?.querySelector(viewportSelector);
  if (!viewport) return;

  const slots = Array.from(viewport.querySelectorAll(".thumb"));
  const windowSize = slots.length || 0;
  if (windowSize === 0) return;

  // Alle Bilder lesen
  const currentWrap = document.querySelector(".current-picture");
  const allImages = readImagesFromDataset(currentWrap) || [];

  // total: bevorzugt aus data-total lesen, fallback auf allImages.length
  const totalFromData = Number(root?.dataset?.total ?? NaN);
  const total =
    Number.isFinite(totalFromData) && totalFromData > 0
      ? totalFromData
      : allImages.length;

  if (total === 0) {
    // Slots leeren
    slots.forEach((s) => {
      s.style.display = "none";
      s.classList.remove("is-visible", "is-active", "is-disabled");
      s.innerHTML = "";
    });
    return;
  }

  // Startindex aus State, sonst 0
  const st = getState();
  const stateActive =
    typeof st.thumbActiveIndex === "number" ? st.thumbActiveIndex : undefined;

  // Anfangsfenster so wählen, dass der aktive Index (oder 0) sichtbar ist
  const desiredActive = typeof stateActive === "number" ? stateActive : 0;
  const half = Math.floor(windowSize / 2);
  const first = Math.max(
    0,
    Math.min(Math.max(0, total - windowSize), desiredActive - half)
  );
  const last = Math.min(total - 1, first + windowSize - 1);

  const indices = [];
  for (let i = first; i <= last; i++) indices.push(i);
  const winArr = indices.map((i) => allImages[i]);

  // State deterministisch setzen VOR dem Render
  setThumbWindowImages(winArr);
  const safeActive = Math.max(0, Math.min(desiredActive, total - 1));
  setThumbActiveIndex(safeActive);

  // Die zuletzt sichtbaren Indizes verfügbar machen
  viewport.__lastIndices = indices.slice();

  // Buttons-State-Updater
  const updateScrollBtnState = () => {
    const downBtn = root.querySelector("[data-action='thumbs-scroll-down']");
    const upBtn = root.querySelector("[data-action='thumbs-scroll-up']");

    const lastIndices = Array.isArray(viewport.__lastIndices)
      ? viewport.__lastIndices
      : indices.slice();
    if (!lastIndices.length) return;

    const firstVisible = Math.min(...lastIndices);
    const count = lastIndices.length;
    const maxFirst = Math.max(0, total - count);

    const atTop = firstVisible <= 0;
    const atBottom = firstVisible >= maxFirst || count >= total;

    const applyBtnState = (btn, disabled) => {
      if (!btn) return;
      btn.disabled = disabled;
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
      btn.style.visibility = disabled ? "hidden" : "visible";
      btn.style.pointerEvents = disabled ? "none" : "auto";
      btn.classList.toggle("is-disabled", disabled);
    };

    applyBtnState(upBtn, atTop);
    applyBtnState(downBtn, atBottom);
  };

  // Erster Render
  showThumbsByIndices(indices, opts);
  // Initiale Button-Zustände einmal setzen
  (function initBtnStateOnce() {
    const atTop = first <= 0;
    const atBottom = last >= total - 1 || windowSize >= total;

    const downBtn = root.querySelector("[data-action='thumbs-scroll-down']");
    const upBtn = root.querySelector("[data-action='thumbs-scroll-up']");

    const applyBtnState = (btn, disabled) => {
      if (!btn) return;
      btn.disabled = disabled;
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
      btn.style.visibility = disabled ? "hidden" : "visible";
      btn.style.pointerEvents = disabled ? "none" : "auto";
      btn.classList.toggle("is-disabled", disabled);
    };

    applyBtnState(upBtn, atTop);
    applyBtnState(downBtn, atBottom);
  })();

  // Scroll-Helper: berechnet nächste Indizes und rendert
  const scrollViewport = (direction) => {
    const v = root.querySelector(viewportSelector);
    if (!v) return;

    const lastIndices = Array.isArray(v.__lastIndices) ? v.__lastIndices : [];
    const count = lastIndices.length || windowSize;
    const firstVisible = lastIndices.length ? Math.min(...lastIndices) : 0;

    const delta = Math.max(1, step) * (direction === "down" ? 1 : -1);
    const newFirst = Math.max(
      0,
      Math.min(firstVisible + delta, Math.max(0, total - count))
    );
    const newLast = Math.min(total - 1, newFirst + count - 1);

    // nichts zu tun?
    if (newFirst === firstVisible && lastIndices.length) {
      updateScrollBtnState();
      return;
    }

    const nextIndices = [];
    for (let i = newFirst; i <= newLast; i++) nextIndices.push(i);

    const nextWin = nextIndices.map((i) => allImages[i]);
    setThumbWindowImages(nextWin);

    // Aktiven Index im Fenster halten, ohne ihn zu verlieren
    const curActive =
      typeof getState().thumbActiveIndex === "number"
        ? getState().thumbActiveIndex
        : 0;
    const newActive =
      curActive >= newFirst && curActive <= newLast ? curActive : newFirst;
    // Wenn ihr das aktive Thumb bei Scroll NICHT verändern wollt, lasst den nächsten Call auskommentiert.
    // setThumbActiveIndex(newActive);

    v.__lastIndices = nextIndices.slice();

    showThumbsByIndices(nextIndices, opts);
    updateScrollBtnState();
  };

  // Delegiertes Event-Handling auf dem Root-Container
  if (!root.__thumbDelegationBound) {
    root.addEventListener("click", (e) => {
      const upBtn = e.target.closest("[data-action='thumbs-scroll-up']");
      const downBtn = e.target.closest("[data-action='thumbs-scroll-down']");
      if (!upBtn && !downBtn) return;

      // Nur innerhalb unseres Root
      const btn = upBtn || downBtn;
      if (!root.contains(btn)) return;

      e.preventDefault();
      e.stopPropagation();

      if (upBtn) scrollViewport("up");
      else scrollViewport("down");
    });

    root.__thumbDelegationBound = true;
  }
}
