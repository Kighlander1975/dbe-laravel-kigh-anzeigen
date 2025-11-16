// resources/js/thumbs/ensureThumbVisible.js
import { getState, setThumbWindowImages, setThumbActiveIndex } from "../gallery/state";
import { readImagesFromDataset } from "../gallery/helpers";
import { showThumbsByIndices, updateThumbScrollButtons } from "./showThumbsByIndices";

function resolveWindowSize(root, viewport) {
  const ds = Number(root?.dataset?.windowSize ?? NaN);
  if (Number.isFinite(ds) && ds > 0) return ds;
  const existingSlots = viewport ? viewport.querySelectorAll(".thumb").length : 0;
  if (existingSlots > 0) return existingSlots;
  return 3; // Fallback
}

function readAllImages(root) {
  // Primär: aus .current-picture data-images (bereits vollqualifiziert im Blade)
  const currentWrap = document.querySelector(".current-picture");
  const fromDataset = readImagesFromDataset(currentWrap) || [];
  if (fromDataset.length > 0) return fromDataset;

  // Fallback: was im Viewport bereits als <img.thumb-img> steht
  const viewport = root?.querySelector(".thumb-viewport");
  const imgs = Array.from(viewport?.querySelectorAll(".thumb-img") || []);
  if (imgs.length > 0) {
    return imgs.map(img => ({ src: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "" }));
  }
  return [];
}

export function ensureThumbVisible(targetIndex, opts = {}) {
  const root = document.querySelector(opts.rootSelector || ".thumb-pictures");
  const viewport =
    root?.querySelector(opts.viewportSelector || ".thumb-viewport") ||
    root?.querySelector(".thumbs") ||
    null;

  if (!root || !viewport) return;

  const windowSize = resolveWindowSize(root, viewport);
  if (windowSize === 0) return;

  const allImages = readAllImages(root);

  const totalFromData = Number(root?.dataset?.total ?? NaN);
  const total =
    Number.isFinite(totalFromData) && totalFromData > 0
      ? totalFromData
      : allImages.length;

  if (!Number.isFinite(targetIndex)) return;
  if (total <= 0) {
    // Nichts zu zeigen
    showThumbsByIndices([], opts);
    updateThumbScrollButtons(opts);
    return;
  }

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const safeTarget = clamp(targetIndex, 0, Math.max(0, total - 1));

  const lastIndices = Array.isArray(viewport.__lastIndices)
    ? viewport.__lastIndices
    : [];
  const hasWindow = lastIndices.length === windowSize;

  let first;
  if (hasWindow) {
    const curFirst = Math.min(...lastIndices);
    const curLast = Math.max(...lastIndices);
    if (safeTarget >= curFirst && safeTarget <= curLast) {
      setThumbActiveIndex(safeTarget);
      showThumbsByIndices(lastIndices, opts);
      updateThumbScrollButtons(opts);
      return;
    }
    const maxFirst = Math.max(0, total - windowSize);
    if (safeTarget < curFirst) {
      first = clamp(safeTarget, 0, maxFirst);
    } else {
      first = clamp(safeTarget - (windowSize - 1), 0, maxFirst);
    }
  } else {
    const half = Math.floor(windowSize / 2);
    const maxFirst = Math.max(0, total - windowSize);
    first = clamp(safeTarget - half, 0, maxFirst);
  }

  const last = Math.min(total - 1, first + windowSize - 1);
  const indices = [];
  for (let i = first; i <= last; i++) indices.push(i);

  const winArr = indices.map((i) => allImages[i]).filter(Boolean);

  setThumbWindowImages(winArr);
  setThumbActiveIndex(safeTarget);
  viewport.__lastIndices = indices.slice();

  showThumbsByIndices(indices, opts);
  updateThumbScrollButtons(opts);
}