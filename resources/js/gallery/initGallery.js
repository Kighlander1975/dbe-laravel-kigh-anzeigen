// resources/js/gallery/initGallery.js

import { readImagesFromDataset, normalizeUrlPath } from "./helpers";
import { ensureThumbVisible } from "../thumbs/ensureThumbVisible";
import { setThumbActiveIndex } from "./state";

// Initialisiert die Galerie-Navigation (.current-picture) mit Prev/Next und Keyboard
export function initGallery() {
    const currentWrap = document.querySelector(".current-picture");
    const currentImg = currentWrap?.querySelector("img");
    if (!currentWrap || !currentImg) return;

    // 1) Bilderquelle
    const parseDomImages = () => {
        const nodes = Array.from(
            currentWrap.querySelectorAll(
                'img[data-gallery="item"], picture[data-gallery="item"]'
            )
        );
        if (!nodes.length) return null;
        return nodes
            .map((n) => {
                if (n.tagName.toLowerCase() === "picture") {
                    const img = n.querySelector("img");
                    if (!img) return null;
                    return {
                        src: img.currentSrc || img.src || "",
                        alt: img.alt || "",
                    };
                }
                return { src: n.currentSrc || n.src || "", alt: n.alt || "" };
            })
            .filter((x) => x && x.src);
    };

    const dataImages = readImagesFromDataset(currentWrap);
    const images =
        (dataImages && dataImages.length ? dataImages : parseDomImages()) || [];
    // Bei 0/1 Bild: keine Navigation notwendig
    if (images.length <= 1) return;

    // 2) Einmalig initialen Index bestimmen
    const findIndexFromImg = () => {
        const cur = currentImg.getAttribute("src") || "";
        const curPath = normalizeUrlPath(cur);
        const idx = images.findIndex(
            (x) => normalizeUrlPath(x.src) === curPath
        );
        return idx < 0 ? 0 : idx;
    };

    // Quelle der Wahrheit
    let activeIndex = findIndexFromImg();

    // Globale/TPV-Sync-Helfer
    const syncIndex = (idx) => {
        activeIndex = Math.max(0, Math.min(images.length - 1, idx));
        try {
            window.thumbActiveIndex = activeIndex;
        } catch {}
        try {
            setThumbActiveIndex(activeIndex);
        } catch {}
        try {
            ensureThumbVisible(activeIndex);
        } catch {}
    };

    // 3) Transition-Handling
    let isTransitioning = false;

    // Prev/Next Buttons
    let btnPrev = currentWrap.querySelector(".cp-nav-prev");
    let btnNext = currentWrap.querySelector(".cp-nav-next");

    if (!btnPrev || !btnNext) {
        const chevronUrl =
            currentWrap.dataset.chevron || "/images/chevron-right.svg";

        btnPrev = document.createElement("button");
        btnPrev.type = "button";
        btnPrev.className = "cp-nav cp-nav-prev";
        btnPrev.setAttribute("aria-label", "Vorheriges Bild");
        const spanPrev = document.createElement("span");
        spanPrev.className = "cp-icon-mask";
        spanPrev.setAttribute("aria-hidden", "true");
        spanPrev.style.webkitMask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
        spanPrev.style.mask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
        spanPrev.style.transform = "scaleX(-1)";
        btnPrev.appendChild(spanPrev);

        btnNext = document.createElement("button");
        btnNext.type = "button";
        btnNext.className = "cp-nav cp-nav-next";
        btnNext.setAttribute("aria-label", "Nächstes Bild");
        const spanNext = document.createElement("span");
        spanNext.className = "cp-icon-mask";
        spanNext.setAttribute("aria-hidden", "true");
        spanNext.style.webkitMask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
        spanNext.style.mask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
        btnNext.appendChild(spanNext);

        currentWrap.appendChild(btnPrev);
        currentWrap.appendChild(btnNext);
    }

    // Buttons per State steuern (sichtbar/unsichtbar + interaktiv)
    const setBtnState = (btn, { disabled, hide }) => {
        if (!btn) return;
        // Sichtbarkeit
        btn.style.visibility = hide ? "hidden" : "visible";
        // Interaktion/Accessibility
        btn.disabled = !!disabled;
        btn.setAttribute("aria-disabled", disabled ? "true" : "false");
        btn.tabIndex = disabled ? -1 : 0;
        btn.classList.toggle("is-disabled", !!disabled);
        btn.style.pointerEvents = disabled ? "none" : "auto";
    };

    // Sichtbarkeitslogik exakt nach Wunsch
    const updateNavState = () => {
        const atFirst = activeIndex <= 0;
        const atLast = activeIndex >= images.length - 1;

        if (images.length <= 1) {
            setBtnState(btnPrev, { disabled: true, hide: true });
            setBtnState(btnNext, { disabled: true, hide: true });
            return;
        }

        if (atFirst) {
            // Nur Rechts sichtbar
            setBtnState(btnPrev, { disabled: true, hide: true });
            setBtnState(btnNext, { disabled: false, hide: false });
        } else if (atLast) {
            // Nur Links sichtbar
            setBtnState(btnPrev, { disabled: false, hide: false });
            setBtnState(btnNext, { disabled: true, hide: true });
        } else {
            // Beide sichtbar
            setBtnState(btnPrev, { disabled: false, hide: false });
            setBtnState(btnNext, { disabled: false, hide: false });
        }
    };

    const swapCurrentImage = (newSrc, newAlt = "", meta = undefined) => {
        if (!newSrc || isTransitioning) return;

        // Wenn bereits gleiches Bild, abbrechen – aber Nav/Index sind bereits gesetzt
        const cur = currentImg.getAttribute("src") || "";
        if (normalizeUrlPath(cur) === normalizeUrlPath(newSrc)) {
            updateNavState();
            return;
        }

        isTransitioning = true;
        currentImg.style.transition = "opacity 160ms ease";
        currentImg.style.opacity = "0";

        const onFadeOut = () => {
            currentImg.removeEventListener("transitionend", onFadeOut);
            const tmp = new Image();
            tmp.onload = () => {
                currentImg.src = newSrc;
                if (newAlt) currentImg.alt = newAlt;
                // Reflow, dann einblenden
                void currentImg.offsetWidth;
                currentImg.style.opacity = "1";
                const onFadeIn = () => {
                    currentImg.removeEventListener("transitionend", onFadeIn);
                    isTransitioning = false;

                    // Nach erfolgreichem Wechsel UI sichern
                    updateNavState();

                    // Legacy-Hook
                    try {
                        if (
                            typeof window.__updateThumbWindowFromIndex ===
                            "function"
                        ) {
                            window.__updateThumbWindowFromIndex(activeIndex);
                        }
                    } catch {}
                };
                currentImg.addEventListener("transitionend", onFadeIn, {
                    once: true,
                });
            };
            tmp.onerror = () => {
                currentImg.style.opacity = "1";
                isTransitioning = false;
                updateNavState();
            };
            tmp.src = newSrc;
        };

        currentImg.addEventListener("transitionend", onFadeOut, { once: true });
    };

    const goAbsolute = (nextIndex, trigger = "unknown") => {
        if (isTransitioning) return;
        const clamped = Math.max(0, Math.min(images.length - 1, nextIndex));
        if (clamped === activeIndex) {
            updateNavState();
            return;
        }

        // Index sofort setzen + UI sofort updaten (Buttons erscheinen/verschwinden direkt)
        syncIndex(clamped);
        updateNavState();

        const target = images[clamped];
        swapCurrentImage(target.src, target.alt || "", {
            fromIndex: activeIndex,
            trigger,
        });
    };

    const goRelative = (delta, trigger = "unknown") => {
        goAbsolute(activeIndex + delta, trigger);
    };

    btnPrev.addEventListener("click", () => goRelative(-1, "prev"));
    btnNext.addEventListener("click", () => goRelative(1, "next"));

    // Keyboard
    document.addEventListener(
        "keydown",
        (e) => {
            const tag = e.target?.tagName?.toLowerCase() || "";
            const isTyping =
                tag === "input" ||
                tag === "textarea" ||
                tag === "select" ||
                e.isComposing;
            if (isTyping) return;
            const within =
                currentWrap.contains(document.activeElement) ||
                document.activeElement === document.body;
            if (!within) return;
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goRelative(-1, "keyboard");
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goRelative(1, "keyboard");
            }
        },
        { passive: false }
    );

    // Initialen State global spiegeln und Buttons setzen
    syncIndex(activeIndex);
    updateNavState();

    // Passiver Sync-Helper: von außen aufrufbar, führt KEINEN Bildwechsel aus.
    // Aktualisiert nur internen Index, Thumbs-Scroll und Nav-Buttons.
    window.__cpSyncActiveIndex = function (idx) {
        const n = Number(idx);
        if (!Number.isFinite(n)) return;
        // Index intern spiegeln, Thumbs ausrichten, Buttons updaten
        // Wichtig: kein swapCurrentImage-Aufruf → kein Bildwechsel hier
        const clamped = Math.max(0, Math.min(images.length - 1, n));
        if (clamped === activeIndex) {
            updateNavState();
            return;
        }
        // Nur internen State spiegeln, keine Transition auslösen
        activeIndex = clamped;
        try {
            window.thumbActiveIndex = activeIndex;
        } catch {}
        try {
            setThumbActiveIndex(activeIndex);
        } catch {}
        try {
            ensureThumbVisible(activeIndex);
        } catch {}
        updateNavState();
    };

    // Optional: auf ein neutrales Event reagieren, falls du es aus TPV feuern willst.
    window.addEventListener("cp:activeIndexChanged", (e) => {
        const idx = Number(e?.detail?.idx);
        if (!Number.isFinite(idx)) return;
        window.__cpSyncActiveIndex?.(idx);
    });

    // Optional: extern verfügbar machen
    window.__cpUpdateNavState = updateNavState;
    window.__cpGoToIndex = goAbsolute; // hilfreich für Thumbs: window.__cpGoToIndex(idx)
}

// Optional: Auto-Init
document.addEventListener("DOMContentLoaded", () => {
    initGallery();
});
