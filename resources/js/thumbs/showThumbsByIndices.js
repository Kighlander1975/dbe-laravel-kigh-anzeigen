// resources/js/thumbs/showThumbsByIndices.js
import { getState, setThumbActiveIndex, setThumbWindowImages } from "../gallery/state";
import { cpSetByIndex } from "../gallery/cpSetByIndex";
import { readImagesFromDataset } from "../gallery/helpers";

/**
 * Aktualisiert die Zustände der Scroll-Buttons (Up/Down) basierend auf dem zuletzt gerenderten Fenster.
 * Kann extern nach einem Render aufgerufen werden.
 */
export function updateThumbScrollButtons(opts = {}) {
  const root = document.querySelector(opts.rootSelector || ".thumb-pictures");
  const viewport =
    root?.querySelector(opts.viewportSelector || ".thumb-viewport") ||
    root?.querySelector(".thumbs") ||
    null;
  if (!root || !viewport) return;

  const currentWrap = document.querySelector(".current-picture");
  const allImages = readImagesFromDataset(currentWrap) || [];
  const totalFromData = Number(root?.dataset?.total ?? NaN);
  const total =
    Number.isFinite(totalFromData) && totalFromData > 0
      ? totalFromData
      : allImages.length;

  const lastIndices = Array.isArray(viewport.__lastIndices)
    ? viewport.__lastIndices
    : [];
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

  const downBtn = root.querySelector("[data-action='thumbs-scroll-down']");
  const upBtn = root.querySelector("[data-action='thumbs-scroll-up']");
  applyBtnState(upBtn, atTop);
  applyBtnState(downBtn, atBottom);
}

/**
 * Rendert die Thumbnails anhand einer Liste globaler Indizes.
 * Erwartet:
 * - .thumb-pictures .thumb-viewport im DOM
 * - state.thumbWindowImages enthält sichtbare Objekte { src, alt }
 * - cpSetByIndex(i) wechselt das Hauptbild
 *
 * Verhalten:
 * - Delegiertes Click/Keydown-Handling auf .thumb-viewport
 * - Setzt is-active / is-disabled, Badge-Nummern und tabindex korrekt
 */
export function showThumbsByIndices(indices, opts = {}) {
  const root = document.querySelector(opts.rootSelector || ".thumb-pictures") || document;
  const viewport =
    root.querySelector(opts.viewportSelector || ".thumb-viewport") ||
    root.querySelector(".thumbs") ||
    null;

  if (!viewport) return;

  // Einmalige Delegationsbindung – robust gegen Innenklicks
  if (!viewport.__thumbDelegationBound) {
    const handleActivate = (slot) => {
      if (!slot || !viewport.contains(slot)) return;

      const visibleSlots = Array.from(viewport.querySelectorAll(".thumb.is-visible"));
      const thumbsNow = visibleSlots.length ? visibleSlots : Array.from(viewport.querySelectorAll(".thumb"));
      const k = thumbsNow.indexOf(slot);
      if (k < 0) return;

      const st = getState();
      const indicesNow = Array.isArray(viewport.__lastIndices) ? viewport.__lastIndices : [];
      const globalIndex = typeof indicesNow[k] === "number" ? indicesNow[k] : k;

      // Wenn der angeklickte bereits aktiv ist: nichts tun
      if (typeof st.thumbActiveIndex === "number" && st.thumbActiveIndex === globalIndex) return;

      if (st.thumbActiveIndex !== globalIndex) {
        setThumbActiveIndex(globalIndex);
      }
      try {
        cpSetByIndex(globalIndex);
        window.__cpSyncActiveIndex?.(globalIndex);
      } catch {}

      // UI aktualisieren: vorherigen aktiven zurücksetzen
      const prevActive = viewport.querySelector(".thumb.is-active");
      if (prevActive) {
        prevActive.classList.remove("is-active", "is-disabled");
        prevActive.style.cursor = "pointer";
        prevActive.setAttribute("tabindex", "0");
        prevActive.setAttribute("aria-pressed", "false");
        const pb = prevActive.querySelector(".thumb-badge");
        if (pb) {
          pb.classList.remove("badge-active");
          pb.classList.add("badge-neutral");
        }
      }

      // neuen aktiven setzen
      slot.classList.add("is-active", "is-disabled");
      slot.style.cursor = "default";
      slot.removeAttribute("tabindex");
      slot.setAttribute("aria-pressed", "true");
      const badgeEl = slot.querySelector(".thumb-badge");
      if (badgeEl) {
        badgeEl.classList.add("badge-active");
        badgeEl.classList.remove("badge-neutral");
      }
    };

    viewport.addEventListener("click", (e) => {
      const slot = e.target?.closest?.(".thumb");
      if (!slot) return;
      handleActivate(slot);
    });

    viewport.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const slot = e.target?.closest?.(".thumb");
      if (!slot) return;
      e.preventDefault();
      handleActivate(slot);
    });

    viewport.__thumbDelegationBound = true;
  }

  const thumbs = Array.from(viewport.querySelectorAll(".thumb"));
  if (!thumbs.length) return;

  // Fenster-Array aus state verwenden; Fallback auf window (legacy)
  const st = getState();
  const winArrFromState =
    Array.isArray(st.thumbWindowImages) && st.thumbWindowImages.length
      ? st.thumbWindowImages
      : Array.isArray(window.thumbWindowImages)
      ? window.thumbWindowImages
      : [];

  // Total robust via Helper
  const currentWrap = document.querySelector(".current-picture");
  const allImages = readImagesFromDataset(currentWrap) || [];
  const totalHelper = Array.isArray(allImages) ? allImages.length : 0;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const total =
    totalHelper ||
    (Array.isArray(indices) && indices.length ? Math.max(...indices) + 1 : 0);

  // count robust bestimmen: wenn winArr leer, über indices/Slots ableiten
  const fallbackLen =
    (Array.isArray(indices) && indices.length ? indices.length : thumbs.length) || 0;
  const count = Math.min(winArrFromState.length || fallbackLen, thumbs.length);

  // Active-Index initialisieren/klammern
  let activeIndex =
    typeof st.thumbActiveIndex === "number"
      ? st.thumbActiveIndex
      : typeof window.thumbActiveIndex === "number"
      ? window.thumbActiveIndex
      : undefined;

  if (typeof activeIndex !== "number") {
    activeIndex = Array.isArray(indices) && indices.length ? Math.min(...indices) : 0;
  } else if (total > 0) {
    activeIndex = clamp(activeIndex, 0, Math.max(0, total - 1));
  }
  if (st.thumbActiveIndex !== activeIndex) {
    setThumbActiveIndex(activeIndex);
  }

  // Letzte Indices am Viewport merken (für Click-Handler-Auflösung)
  viewport.__lastIndices = Array.isArray(indices) && indices.length ? indices.slice() : [];

  // Reset aller Slots
  for (const el of thumbs) {
    el.style.display = "none";
    el.classList.remove("is-visible", "is-active", "is-disabled");
    el.style.cursor = "";
    el.removeAttribute("tabindex");
    el.removeAttribute("aria-pressed");
    el.querySelectorAll(".thumb-badge").forEach((be) => {
      be.textContent = "";
      be.classList.remove("badge-active", "badge-neutral");
    });
  }

  // Render sichtbare Slots
  for (let k = 0; k < count; k++) {
    const slot = thumbs[k];
    if (!slot) continue;

    const item =
      winArrFromState.length ? winArrFromState[k] : null;

    const globalIndex =
      Array.isArray(indices) && typeof indices[k] === "number"
        ? indices[k]
        : k;

    // Bild-Element handhaben
    let img = slot.querySelector("img");
    if (!item) {
      // Platzhalter: Bild entfernen, Slot bleibt klickbar mit Badge
      if (img) img.remove();
    } else {
      if (!img) {
        img = document.createElement("img");
        img.decoding = "async";
        img.loading = "lazy";
        slot.appendChild(img);
      }
      const nextSrc = item.src || "";
      const nextAlt = item.alt || "";
      const prevSrc = img.src || "";
      const changed = prevSrc !== nextSrc;

      if (changed) {
        const onLoad = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        };
        const onError = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        };
        img.addEventListener("load", onLoad, { once: true });
        img.addEventListener("error", onError, { once: true });
      }

      if (img.src !== nextSrc) {
        img.src = nextSrc;
        try { img.decode?.(); } catch {}
      }
      if (img.alt !== nextAlt) {
        img.alt = nextAlt;
      }
    }

    // Badge
    let badge = slot.querySelector(".thumb-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "thumb-badge";
      badge.setAttribute("aria-hidden", "true");
      if (img && img.parentNode === slot) {
        slot.insertBefore(badge, img);
      } else {
        slot.appendChild(badge);
      }
    }
    badge.textContent = String(globalIndex + 1).padStart(2, "0");

    // Rolle nur einmal setzen
    if (!slot.hasAttribute("role")) slot.setAttribute("role", "button");

    const isActive = typeof activeIndex === "number" && globalIndex === activeIndex;

    slot.style.display = "";
    slot.classList.add("is-visible");

    if (isActive) {
      slot.classList.add("is-active", "is-disabled");
      slot.style.cursor = "default";
      slot.removeAttribute("tabindex");
      slot.setAttribute("aria-pressed", "true");
      badge.classList.add("badge-active");
      badge.classList.remove("badge-neutral");
    } else {
      slot.classList.remove("is-disabled");
      slot.classList.toggle("is-active", false);
      slot.style.cursor = "pointer";
      slot.setAttribute("tabindex", "0");
      slot.setAttribute("aria-pressed", "false");
      badge.classList.add("badge-neutral");
      badge.classList.remove("badge-active");
    }
  }

  // Falls CSS inline anzeigt, auf block setzen
  const visibleNow = thumbs.filter((el) => el?.classList.contains("is-visible"));
  if (visibleNow.length && getComputedStyle(visibleNow[0]).display === "inline") {
    visibleNow.forEach((el) => {
      el.style.display = "block";
    });
  }

  // State-Spiegelung des Fenster-Arrays (für Konsistenz, falls extern verändert)
  if (winArrFromState.length) {
    setThumbWindowImages(winArrFromState);
  }

  // Optional: Buttons nach jedem Render aktualisieren (non-breaking)
  try {
    updateThumbScrollButtons(opts);
  } catch {}
}
