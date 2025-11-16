// resources/js/gallery/cpSetByIndex.js

import { readImagesFromDataset, normalizeUrlPath } from "./helpers";
import { setThumbActiveIndex } from "./state";
import { ensureThumbVisible } from "../thumbs/ensureThumbVisible";

// Fallback: nextPaintWithTimeout, falls nicht global vorhanden
function _nextPaintWithTimeout(timeout = 64) {
    return new Promise((resolve) => {
        let done = false;
        const t = setTimeout(() => {
            if (!done) {
                done = true;
                resolve();
            }
        }, timeout);
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => {
                if (!done) {
                    done = true;
                    clearTimeout(t);
                    resolve();
                }
            });
        }
    });
}
const nextPaintWithTimeout =
    typeof window !== "undefined" && typeof window.nextPaintWithTimeout === "function"
        ? window.nextPaintWithTimeout
        : _nextPaintWithTimeout;

// Hilfsfunktion: globalen Index setzen + TPV sync + Nav-State
function syncIndexAndUI(idx) {
    try { window.thumbActiveIndex = idx; } catch {}
    try { setThumbActiveIndex(idx); } catch {}
    try { ensureThumbVisible(idx); } catch {}
    try {
        if (typeof window.__cpUpdateNavState === "function") {
            window.__cpUpdateNavState();
        }
    } catch {}
}

// CP-Hilfsfunktion: schaltet das Hauptbild auf den globalen Index i
export function cpSetByIndex(i) {
    const currentWrap = document.querySelector(".current-picture");
    const currentImg = currentWrap?.querySelector("img");
    if (!currentWrap || !currentImg || typeof i !== "number") return;

    // Bilder aus Dataset
    const images = readImagesFromDataset(currentWrap);
    if (!images.length) return;

    // Index clampen
    const idx = Math.max(0, Math.min(images.length - 1, i));
    const target = images[idx];
    if (!target || !target.src) {
        // Selbst wenn kein valides Ziel, Index im UI spiegeln, damit Nav-Buttons korrekt sind
        syncIndexAndUI(idx);
        return;
    }

    // Index SOFORT spiegeln und Nav aktualisieren (wichtig für Thumb-Navigation)
    syncIndexAndUI(idx);

    // Stabiler Vergleich über Pfad
    const curSrc = currentImg.getAttribute("src") || "";
    const isSame = normalizeUrlPath(curSrc) === normalizeUrlPath(target.src);
    if (isSame) {
        // Nichts zu wechseln – Index/UI sind bereits synchronisiert.
        return;
    }

    // Lokaler Transition-Guard (Race-Fix ggf. später globalisieren)
    let isTransitioning = false;
    if (isTransitioning) return;

    isTransitioning = true;
    currentImg.style.transition = "opacity 160ms ease";
    currentImg.style.opacity = "0";

    if (window.CPPerf) window.CPPerf.mark("cp_start", { index: idx, src: target.src });

    const onFadeOut = () => {
        currentImg.removeEventListener("transitionend", onFadeOut);
        const tmp = new Image();

        tmp.onload = () => {
            currentImg.src = target.src;
            if (target.alt) currentImg.alt = target.alt;

            // Reflow, dann einblenden
            void currentImg.offsetWidth;
            currentImg.style.opacity = "1";

            const onFadeIn = () => {
                currentImg.removeEventListener("transitionend", onFadeIn);
                isTransitioning = false;

                nextPaintWithTimeout().then(() => {
                    if (window.CPPerf)
                        window.CPPerf.mark("cp_visible", {
                            index: idx,
                            visibility: document.visibilityState || "unknown",
                        });

                    // Nach Sichtbarkeit: sicherheitshalber Index/UI nochmals syncen (idempotent)
                    syncIndexAndUI(idx);

                    // Legacy-Hook
                    try {
                        if (typeof window.__updateThumbWindowFromIndex === "function") {
                            window.__updateThumbWindowFromIndex(idx);
                        }
                    } catch {}

                    if (window.CPPerf) window.CPPerf.mark("thumbs_update", { index: idx });
                    if (window.CPPerf) window.CPPerf.mark("cp_end", { index: idx });
                });
            };

            currentImg.addEventListener("transitionend", onFadeIn, { once: true });
        };

        tmp.onerror = () => {
            currentImg.style.opacity = "1";
            isTransitioning = false;

            // Auch im Fehlerfall UI konsistent halten
            syncIndexAndUI(idx);

            if (window.CPPerf)
                window.CPPerf.mark("cp_error", { index: idx, src: target.src });
        };

        tmp.src = target.src;
    };

    currentImg.addEventListener("transitionend", onFadeOut, { once: true });

    // Sofort auslösen, wenn aktuell sichtbar
    if (getComputedStyle(currentImg).opacity === "1") {
        currentImg.style.opacity = "0";
    } else {
        // Falls bereits 0, „transitionend“ evtl. nicht triggert – also manuell feuern
        // aber nur wenn keine Transition läuft
        if (parseFloat(getComputedStyle(currentImg).transitionDuration) === 0) {
            onFadeOut();
        }
    }
}

// Optional: global verfügbar machen, falls bestehender Code darauf zugreift
if (typeof window !== "undefined") {
    window.cpSetByIndex = cpSetByIndex;
}
