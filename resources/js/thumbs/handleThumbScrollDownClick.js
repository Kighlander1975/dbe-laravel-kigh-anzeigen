// resources/js/thumbs/handleThumbScrollDownClick.js
import { getState, setThumbWindowImages } from "../gallery/state";
import { showThumbsByIndices } from "./showThumbsByIndices";
import { readImagesFromDataset } from "../gallery/helpers";

/**
 * Scrollt das Thumbnail-Fenster nach unten (vorwärts).
 * Verändert den aktiven Index NICHT.
 */
export function handleThumbScrollDownClick(opts = {}) {
  const {
    rootSelector = ".thumb-pictures",
    viewportSelector = ".thumb-viewport",
    step: rawStep,
  } = opts;

  const root = document.querySelector(rootSelector);
  const viewport = root?.querySelector(viewportSelector);
  if (!viewport) return;

  const slots = Array.from(viewport.querySelectorAll(".thumb"));
  const windowSize = slots.length || 0;
  if (windowSize === 0) return;

  const currentWrap = document.querySelector(".current-picture");
  const allImages = readImagesFromDataset(currentWrap) || [];
  const total = allImages.length;
  if (total === 0) return;

  const st = getState();
  const activeIndex =
    typeof st.thumbActiveIndex === "number" ? st.thumbActiveIndex : 0;

  const lastIndices = Array.isArray(viewport.__lastIndices)
    ? viewport.__lastIndices
    : [];

  const firstVisible =
    lastIndices.length > 0
      ? Math.min(...lastIndices)
      : Math.max(0, activeIndex - Math.floor(windowSize / 2));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const step =
    typeof rawStep === "number" && rawStep > 0
      ? Math.floor(rawStep)
      : windowSize || 1;

  const maxFirst = Math.max(0, total - windowSize);
  const newFirst = clamp(firstVisible + step, 0, maxFirst);
  const newLast = Math.min(total - 1, newFirst + windowSize - 1);

  if (lastIndices.length && Math.min(...lastIndices) === newFirst) {
    if (window.CPPerf) {
      window.CPPerf.markRaf("thumbs_scroll_down", {
        windowSize,
        from: firstVisible,
        to: newFirst,
        step,
        noOp: true,
      });
    }
    return;
  }

  const indices = [];
  for (let i = newFirst; i <= newLast; i++) indices.push(i);

  const winArr = indices.map((i) => allImages[i]);
  setThumbWindowImages(winArr);

  // WICHTIG: activeIndex NICHT ändern (kein setThumbActiveIndex)

  viewport.__lastIndices = indices.slice();
  showThumbsByIndices(indices, opts);

  if (window.CPPerf) {
    window.CPPerf.markRaf("thumbs_scroll_down", {
      windowSize,
      from: firstVisible,
      to: newFirst,
      step,
    });
  }
}
