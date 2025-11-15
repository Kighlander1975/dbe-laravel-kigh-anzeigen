// resources/js/mein_js.js

// Favoriten-Button
function initFavoriteToggle() {
    const favBtn = document.querySelector(".js-fav-toggle");
    if (!favBtn) return;

    const favIcon = favBtn.querySelector(".js-fav-icon");
    const favText = favBtn.querySelector(".js-fav-text");
    const HEART_URL = favBtn.getAttribute("data-heart-url");
    const HEART_BROKEN_URL = favBtn.getAttribute("data-heart-broken-url");
    const TEXT_OFF = "Favorit";
    const TEXT_ON = "Entfernen";
    let isFav = favBtn.getAttribute("aria-pressed") === "true";

    const setMaskImage = (el, url) => {
        if (!el || !url) return;
        el.style.webkitMaskImage = `url('${url}')`;
        el.style.maskImage = `url('${url}')`;
    };

    const applyFavState = () => {
        favBtn.classList.toggle("btn-outline-danger", !isFav);
        favBtn.classList.toggle("btn-danger", isFav);
        setMaskImage(favIcon, isFav ? HEART_BROKEN_URL : HEART_URL);
        if (favText) favText.textContent = isFav ? TEXT_ON : TEXT_OFF;
        favBtn.setAttribute("aria-pressed", String(isFav));
        favBtn.setAttribute(
            "aria-label",
            isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"
        );
    };

    applyFavState();
    favBtn.addEventListener("click", () => {
        isFav = !isFav;
        applyFavState();
    });
}

// Galerie (.current-picture: Navigation/Wechsel, vollständig entkoppelt)
function initGallery() {
    const currentWrap = document.querySelector(".current-picture");
    const currentImg = currentWrap?.querySelector("img");
    if (!currentWrap || !currentImg) return;

    const parseDataImages = () => {
        try {
            const raw = currentWrap.dataset.images;
            if (!raw) return null;
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return null;
            const alts = (() => {
                try {
                    return JSON.parse(currentWrap.dataset.alts || "[]");
                } catch {
                    return [];
                }
            })();
            return arr
                .map((item, i) => {
                    if (typeof item === "string")
                        return { src: item, alt: alts[i] || "" };
                    if (item && typeof item.src === "string")
                        return {
                            src: item.src,
                            alt: item.alt || alts[i] || "",
                        };
                    return null;
                })
                .filter(Boolean);
        } catch {
            return null;
        }
    };

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

    const images = parseDataImages() || parseDomImages() || [];
    if (images.length <= 1) return;

    const getCurrentIndex = () => {
        const cur = currentImg.getAttribute("src") || "";
        const idx = images.findIndex(
            (x) => x.src === cur || cur.endsWith(x.src)
        );
        return idx < 0 ? 0 : idx;
    };

    let isTransitioning = false;
    const swapCurrentImage = (newSrc, newAlt = "") => {
        if (
            !newSrc ||
            isTransitioning ||
            currentImg.getAttribute("src") === newSrc
        )
            return;
        isTransitioning = true;
        currentImg.style.transition = "opacity 160ms ease";
        currentImg.style.opacity = "0";

        const onFadeOut = () => {
            currentImg.removeEventListener("transitionend", onFadeOut);
            const tmp = new Image();
            tmp.onload = () => {
                currentImg.src = newSrc;
                if (newAlt) currentImg.alt = newAlt;
                void currentImg.offsetWidth;
                currentImg.style.opacity = "1";
                const onFadeIn = () => {
                    currentImg.removeEventListener("transitionend", onFadeIn);
                    isTransitioning = false;
                    // Exponieren für externe Aufrufe (Thumb-Klicks)
                    window.__cpUpdateNavState = updateNavState;

                    updateNavState();

                    // CP -> TPV Synchronisierung
                    try {
                        const newIndex = getCurrentIndex();
                        // Aktivindex setzen
                        window.thumbActiveIndex = newIndex;
                        // Thumbs-Fenster auf neuen Index ausrichten und neu rendern
                        if (
                            typeof window.__updateThumbWindowFromIndex ===
                            "function"
                        ) {
                            window.__updateThumbWindowFromIndex(newIndex);
                        } else {
                            // Fallback: falls initThumbs noch nicht durch ist, nichts crashen
                            // Beim späteren initThumbs wird initialIndex ohnehin übernommen.
                        }
                    } catch (e) {
                        // Fail-safe: keine harten Fehler werfen
                        // console.debug("CP->TPV sync skipped:", e);
                    }
                };
                currentImg.addEventListener("transitionend", onFadeIn, {
                    once: true,
                });
            };
            tmp.onerror = () => {
                currentImg.style.opacity = "1";
                isTransitioning = false;
                updateNavState();

                // Auch im Fehlerfall Sync ausführen (Index bleibt der berechnete nextIndex)
                try {
                    const newIndex = getCurrentIndex();
                    window.thumbActiveIndex = newIndex;
                    if (
                        typeof window.__updateThumbWindowFromIndex ===
                        "function"
                    ) {
                        window.__updateThumbWindowFromIndex(newIndex);
                    }
                } catch {}
            };
            tmp.src = newSrc;
        };

        currentImg.addEventListener("transitionend", onFadeOut, { once: true });
    };

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

    const setBtnState = (btn, disabled, hide) => {
        if (!btn) return;
        btn.disabled = !!disabled;
        btn.setAttribute("aria-disabled", disabled ? "true" : "false");
        btn.tabIndex = disabled ? -1 : 0;
        btn.classList.toggle("is-disabled", !!disabled);
        btn.style.visibility = hide ? "hidden" : "visible";
        btn.style.pointerEvents = disabled ? "none" : "auto";
    };

    const updateNavState = () => {
        const idx = getCurrentIndex();
        const atFirst = idx <= 0;
        const atLast = idx >= images.length - 1;

        // Prev: aktiv außer am ersten Bild
        setBtnState(btnPrev, atFirst, atFirst);
        // Next: aktiv außer am letzten Bild
        setBtnState(btnNext, atLast, atLast);
    };

    const goRelative = (delta) => {
        if (isTransitioning) return;
        const currentIndex = getCurrentIndex();
        const nextIndex = Math.max(
            0,
            Math.min(images.length - 1, currentIndex + delta)
        );
        if (nextIndex === currentIndex) return;
        const target = images[nextIndex];
        swapCurrentImage(target.src, target.alt || "");
    };

    btnPrev.addEventListener("click", () => goRelative(-1));
    btnNext.addEventListener("click", () => goRelative(1));

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
                goRelative(-1);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                goRelative(1);
            }
        },
        { passive: false }
    );

    updateNavState();
}

// NEU
// CP-Hilfsfunktion: schaltet das Hauptbild auf den globalen Index i
function cpSetByIndex(i) {
    const currentWrap = document.querySelector(".current-picture");
    const currentImg = currentWrap?.querySelector("img");
    if (!currentWrap || !currentImg || typeof i !== "number") return;

    let images = [];
    try {
        const raw = currentWrap.dataset.images || "[]";
        const arr = JSON.parse(raw) || [];
        images = arr
            .map((item) =>
                typeof item === "string"
                    ? { src: item, alt: "" }
                    : item && typeof item.src === "string"
                    ? { src: item.src, alt: item.alt || "" }
                    : null
            )
            .filter(Boolean);
    } catch {}

    if (!images.length) return;
    const idx = Math.max(0, Math.min(images.length - 1, i));
    const target = images[idx];
    if (!target || !target.src) return;

    // Wenn bereits gesetzt, raus
    const curSrc = currentImg.getAttribute("src") || "";
    if (curSrc === target.src || curSrc.endsWith(target.src)) {
        try {
            if (typeof window.__cpUpdateNavState === "function") {
                window.__cpUpdateNavState();
            }
        } catch {}
        return;
    }

    // Sanfter Wechsel mit Preload + Fade (unabhängig von initGallery internem swap)
    let isTransitioning = false;
    if (!isTransitioning) {
        isTransitioning = true;
        currentImg.style.transition = "opacity 160ms ease";
        currentImg.style.opacity = "0";

        const onFadeOut = () => {
            currentImg.removeEventListener("transitionend", onFadeOut);
            const tmp = new Image();
            tmp.onload = () => {
                currentImg.src = target.src;
                if (target.alt) currentImg.alt = target.alt;
                void currentImg.offsetWidth;
                currentImg.style.opacity = "1";
                const onFadeIn = () => {
                    currentImg.removeEventListener("transitionend", onFadeIn);
                    isTransitioning = false;

                    // Thumb-UI bestätigen/synchronisieren
                    try {
                        const newIndex = i;
                        window.thumbActiveIndex = newIndex;
                        if (
                            typeof window.__updateThumbWindowFromIndex ===
                            "function"
                        ) {
                            window.__updateThumbWindowFromIndex(newIndex);
                        }
                    } catch {}

                    // CP Prev/Next Buttons aktualisieren
                    try {
                        if (typeof window.__cpUpdateNavState === "function") {
                            window.__cpUpdateNavState();
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
                try {
                    if (typeof window.__cpUpdateNavState === "function") {
                        window.__cpUpdateNavState();
                    }
                } catch {}
            };
            tmp.src = target.src;
        };

        currentImg.addEventListener("transitionend", onFadeOut, { once: true });
        // Falls kein vorheriger Transition-State: sofort fade auslösen
        if (getComputedStyle(currentImg).opacity === "1") {
            currentImg.style.opacity = "0";
        }
    }
}

// Thumbnails (nur Anzeige: Fenster/Buttons, entkoppelt)
// Verhaltensgleich zur alten Version; Darstellungslogik per showThumbsByIndices ausgelagert
function initThumbs() {
    const root = document.querySelector(".thumb-pictures");
    if (!root) return;
    const viewport = root.querySelector(".thumb-viewport");
    if (!viewport) return;

    const currentWrap = document.querySelector(".current-picture");
    const imgMain = currentWrap?.querySelector("img");
    if (!currentWrap || !imgMain) return;

    // 1) Gesamtdaten lesen (wie bisher)
    let allImages = [];
    try {
        const raw = currentWrap.dataset.images || "[]";
        const arr = JSON.parse(raw) || [];
        const alts = (() => {
            try {
                return JSON.parse(currentWrap.dataset.alts || "[]");
            } catch {
                return [];
            }
        })();
        allImages = arr
            .map((item, i) => {
                if (typeof item === "string")
                    return { src: item, alt: alts[i] || "" };
                if (item && typeof item.src === "string")
                    return { src: item.src, alt: item.alt || alts[i] || "" };
                return null;
            })
            .filter(Boolean);
    } catch {}
    const total = Array.isArray(allImages) ? allImages.length : 0;
    if (!total) return;

    // 2) Global veränderbares Fenster-Array: initial die ersten drei
    window.thumbWindowImages = Array.isArray(window.thumbWindowImages)
        ? window.thumbWindowImages
        : [];
    const VISIBLE_COUNT = 3;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    // 3) Buttons und State
    const upBtn = viewport.querySelector(".thumb-scroll-up");
    const downBtn = viewport.querySelector(".thumb-scroll-down");
    downBtn?.addEventListener("click", handleThumbScrollDownClick);

    let windowStart = 0;

    const setBtnState = (btn, disabled, hide) => {
        if (!btn) return;
        btn.disabled = !!disabled;
        btn.setAttribute("aria-disabled", disabled ? "true" : "false");
        btn.tabIndex = disabled ? -1 : 0;
        btn.classList.toggle("is-disabled", !!disabled);
        btn.style.visibility = hide ? "hidden" : "visible";
        btn.style.pointerEvents = disabled ? "none" : "auto";
    };

    const updateScrollBtnState = () => {
        if (total <= VISIBLE_COUNT) {
            // Beide Buttons ausblenden, wenn kein Scrollen nötig
            setBtnState(upBtn, true, true);
            setBtnState(downBtn, true, true);
            return;
        }
        const count = VISIBLE_COUNT;
        const maxStart = Math.max(0, total - count);
        const atTop = windowStart === 0;
        const atBottom = windowStart >= maxStart;

        // Up-Button: sichtbar erst nach mindestens einem Down-Scroll (windowStart > 0)
        setBtnState(upBtn, atTop, atTop);
        // Down-Button: sichtbar bis zum letzten Fenster
        setBtnState(downBtn, atBottom, atBottom);
    };

    // 4) Rendering ausschließlich über das globale Fenster-Array
    const applyWindowArray = () => {
        const count = total >= 4 ? VISIBLE_COUNT : total;
        const indices = Array.from(
            { length: count },
            (_, i) => windowStart + i
        );
        // Fenster-Array setzen
        window.thumbWindowImages = indices
            .map((i) => allImages[i])
            .filter(Boolean);
        // Darstellung: indices werden weiterhin übergeben, aber der Inhalt kommt aus window.thumbWindowImages
        showThumbsByIndices(indices, {
            rootSelector: ".thumb-pictures",
            viewportSelector: ".thumb-viewport",
        });
        updateScrollBtnState();
    };

    const goWindow = (delta) => {
        const count = total >= 4 ? VISIBLE_COUNT : total;
        const maxStart = Math.max(0, total - count);
        windowStart = clamp(windowStart + delta, 0, maxStart);
        applyWindowArray();
    };

    upBtn?.addEventListener("click", () => goWindow(-1));

    // 5) Initiale Ausrichtung am aktuellen Hauptbild
    const curSrc = imgMain.getAttribute("src") || "";
    const initialIndex = (() => {
        const idx = allImages.findIndex(
            (x) => x && (x.src === curSrc || curSrc.endsWith(x.src))
        );
        return idx >= 0 ? idx : 0;
    })();

    window.__updateThumbWindowFromIndex = (i) => {
        const count = total >= 4 ? VISIBLE_COUNT : total;
        if (i < windowStart) windowStart = i;
        else if (i >= windowStart + count) windowStart = i - (count - 1);
        const maxStart = Math.max(0, total - count);
        windowStart = clamp(windowStart, 0, maxStart);
        applyWindowArray();
    };

    // Initial: Fenster-Array setzen und darstellen
    windowStart = 0;
    window.__updateThumbWindowFromIndex(initialIndex);
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
    initFavoriteToggle();
    initGallery();
    initThumbs();
});

function handleThumbScrollDownClick(event) {
    // 1) Viewport finden
    const btn = event?.currentTarget || event?.target || null;
    let viewport = null;
    if (btn instanceof Element) viewport = btn.closest(".thumb-viewport");
    if (!viewport)
        viewport = document.querySelector(".thumb-pictures .thumb-viewport");
    if (!viewport) return;

    // 2) Gesamtliste aus .current-picture holen (wie in initThumbs, damit wir die Offsets kennen)
    const currentWrap = document.querySelector(".current-picture");
    let allImages = [];
    try {
        const raw = currentWrap?.dataset?.images || "[]";
        const arr = JSON.parse(raw) || [];
        const alts = (() => {
            try {
                return JSON.parse(currentWrap?.dataset?.alts || "[]");
            } catch {
                return [];
            }
        })();
        allImages = arr
            .map((item, i) => {
                if (typeof item === "string")
                    return { src: item, alt: alts[i] || "" };
                if (item && typeof item.src === "string")
                    return { src: item.src, alt: item.alt || alts[i] || "" };
                return null;
            })
            .filter(Boolean);
    } catch {}

    const total = Array.isArray(allImages) ? allImages.length : 0;
    if (!total) return;

    // 3) Globales Fenster-Array nutzen (sichtbare Thumbs) und Parameter
    const VISIBLE_COUNT = 3;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    // Sicherheitsnetz: falls das Fenster-Array fehlt/leer ist, initialisieren wir es auf die ersten N
    if (
        !Array.isArray(window.thumbWindowImages) ||
        window.thumbWindowImages.length === 0
    ) {
        window.thumbWindowImages = allImages.slice(
            0,
            Math.min(VISIBLE_COUNT, total)
        );
    }

    // Aktuellen Start-Offset aus dem Fenster rekonstruieren
    // Wir bestimmen den Index des ersten sichtbaren Elements innerhalb der Gesamtliste.
    const first = window.thumbWindowImages[0];
    let currentStart = 0;
    if (first) {
        const idx = allImages.findIndex(
            (x) => x && first && x.src === first.src
        );
        currentStart = idx >= 0 ? idx : 0;
    }

    // count: bei >=4 erzwingen wir 3 sichtbar, sonst alle vorhandenen
    const count = total >= 4 ? VISIBLE_COUNT : Math.min(VISIBLE_COUNT, total);
    const maxStart = Math.max(0, total - count);

    // 4) Neues Fenster berechnen (einen Schritt nach unten)
    const nextStart = clamp(currentStart + 1, 0, maxStart);
    const newVisibleIdx = Array.from(
        { length: count },
        (_, k) => nextStart + k
    );

    // 5) Globales Fenster-Array aktualisieren
    window.thumbWindowImages = newVisibleIdx
        .map((i) => allImages[i])
        .filter(Boolean);

    // 6) Rendering wie gewohnt, aber Inhalte kommen aus window.thumbWindowImages
    showThumbsByIndices(newVisibleIdx, {
        rootSelector: ".thumb-pictures",
        viewportSelector: ".thumb-viewport",
    });

    // 7) Button-Zustände aktualisieren (oben/ unten)
    const upBtn = viewport.querySelector(".thumb-scroll-up");
    const downBtn = viewport.querySelector(".thumb-scroll-down");
    let count2 = total >= 4 ? VISIBLE_COUNT : Math.min(VISIBLE_COUNT, total);
    let maxStart2 = Math.max(0, total - count2);
    let atTop2 = nextStart === 0;
    let atBottom2 = nextStart >= maxStart2;

    // Up: erst sichtbar, wenn mindestens einmal runtergescrollt (nextStart > 0)
    if (upBtn) {
        upBtn.disabled = atTop2;
        upBtn.setAttribute("aria-disabled", atTop2 ? "true" : "false");
        upBtn.style.visibility = atTop2 ? "hidden" : "visible";
        upBtn.style.pointerEvents = atTop2 ? "none" : "auto";
        upBtn.classList.toggle("is-disabled", atTop2);
    }

    // Down: am Ende ausblenden
    if (downBtn) {
        downBtn.disabled = atBottom2;
        downBtn.setAttribute("aria-disabled", atBottom2 ? "true" : "false");
        downBtn.style.visibility = atBottom2 ? "hidden" : "visible";
        downBtn.style.pointerEvents = atBottom2 ? "none" : "auto";
        downBtn.classList.toggle("is-disabled", atBottom2);
    }

    // Optionales Logging
    const indicesToUrls = (idxArr) => {
        if (!allImages.length)
            return idxArr.map((i) => ({ i, src: "(unbekannt)", alt: "" }));
        return idxArr.map((i) => {
            const item = allImages[i];
            if (!item) return { i, src: "(out-of-range)", alt: "" };
            return { i, src: item.src, alt: item.alt || "" };
        });
    };

    console.log("[Thumbs] total:", total, "count(fenster):", count);
    console.log(
        "[Thumbs] neuer sichtbarer Indexbereich (gerendert):",
        newVisibleIdx,
        indicesToUrls(newVisibleIdx)
    );
}

/**
 * Zeigt exakt die Thumbs an, deren Indizes übergeben werden, alle anderen werden ausgeblendet.
 * - indices: Array von Integer-Indizes (z. B. [0,1,2])
 * - options.rootSelector / options.viewportSelector: Selektoren für die Galerie-Container
 *
 * Hinweis: Diese Funktion verändert keine Scroll- oder Button-Logik des Aufrufers.
 * Der Aufrufer (initThumbs) steuert Buttons selbst über updateScrollBtnState.
 */

function showThumbsByIndices(indices, opts = {}) {
    const root = document.querySelector(opts.rootSelector || ".thumb-pictures");
    const viewport = root?.querySelector(
        opts.viewportSelector || ".thumb-viewport"
    );
    if (!viewport) return;

    // Delegation einmalig binden: Click + Keydown auf .thumb-viewport
    if (!viewport.__thumbDelegationBound) {
        viewport.addEventListener("click", (e) => {
            const slot = e.target?.closest?.(".thumb");
            if (!slot || !viewport.contains(slot)) return;

            // Liste der sichtbaren Slots (in Reihenfolge)
            const thumbsNow = Array.from(
                viewport.querySelectorAll(".thumb.is-visible")
            );
            const k = thumbsNow.indexOf(slot);
            if (k < 0) return;

            const winArrNow = Array.isArray(window.thumbWindowImages)
                ? window.thumbWindowImages
                : [];
            const item = winArrNow[k];
            if (!item) return;

            const indicesNow = viewport.__lastIndices || [];
            const globalIndex =
                Array.isArray(indicesNow) && typeof indicesNow[k] === "number"
                    ? indicesNow[k]
                    : k;

            // Wenn bereits aktiv, nichts tun
            if (
                typeof window.thumbActiveIndex === "number" &&
                window.thumbActiveIndex === globalIndex
            )
                return;

            // Aktiv setzen
            // 1) Aktiv-Index setzen
            window.thumbActiveIndex = globalIndex;

            // 2) CP-Bild umschalten
            cpSetByIndex(globalIndex);

            // 3) UI lokal umschalten (ohne komplettes Re-Rendern)
            const prevActive = viewport.querySelector(".thumb.is-active");
            if (prevActive) {
                prevActive.classList.remove("is-active", "is-disabled");
                prevActive.style.cursor = "pointer";
                prevActive.setAttribute("tabindex", "0");
                const pb = prevActive.querySelector(".thumb-badge");
                if (pb) {
                    pb.classList.remove("badge-active");
                    pb.classList.add("badge-neutral");
                }
            }
            slot.classList.add("is-active", "is-disabled");
            slot.style.cursor = "default";
            slot.removeAttribute("tabindex");
            const badgeEl = slot.querySelector(".thumb-badge");
            if (badgeEl) {
                badgeEl.classList.add("badge-active");
                badgeEl.classList.remove("badge-neutral");
            }
        });

        viewport.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const slot = e.target?.closest?.(".thumb");
            if (!slot || !viewport.contains(slot)) return;
            e.preventDefault();
            slot.click();
        });

        viewport.__thumbDelegationBound = true;
    }

    const thumbs = Array.from(viewport.querySelectorAll(".thumb"));
    if (!thumbs.length) return;

    // Sichtbares Fenster (Inhalte)
    const winArr = Array.isArray(window.thumbWindowImages)
        ? window.thumbWindowImages
        : [];
    const count = Math.min(winArr.length, thumbs.length);

    // Gesamtliste nur für total/Badge
    const currentWrap = document.querySelector(".current-picture");
    let allImagesLen = 0;
    try {
        const raw = currentWrap?.dataset?.images || "[]";
        const arr = JSON.parse(raw) || [];
        allImagesLen = Array.isArray(arr) ? arr.length : 0;
    } catch {
        allImagesLen = 0;
    }

    // 0) Aktiven Index beim ersten Aufruf auf den kleinsten sichtbaren Index setzen
    // (damit nach Laden der Seite das erste Bild aktiv ist). Falls bereits gesetzt: clampen
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const total =
        allImagesLen ||
        (Array.isArray(indices) && indices.length
            ? Math.max(...indices) + 1
            : 0);

    if (typeof window.thumbActiveIndex !== "number") {
        if (Array.isArray(indices) && indices.length) {
            window.thumbActiveIndex = Math.min(...indices);
        } else {
            window.thumbActiveIndex = 0;
        }
    } else if (total > 0) {
        window.thumbActiveIndex = clamp(
            window.thumbActiveIndex,
            0,
            Math.max(0, total - 1)
        );
    }

    // Merke die letzten Indices für Delegation
    viewport.__lastIndices = Array.isArray(indices) ? indices.slice() : [];

    // 1) Reset
    for (const el of thumbs) {
        el.style.display = "none";
        el.classList.remove("is-visible", "is-active", "is-disabled");
        el.style.cursor = "";
        el.removeAttribute("tabindex");
        el.querySelectorAll(".thumb-badge").forEach((be) => {
            be.textContent = "";
            be.classList.remove("badge-active", "badge-neutral");
        });
    }

    // 2) Rendern
    for (let k = 0; k < count; k++) {
        const slot = thumbs[k];
        const item = winArr[k];
        if (!slot || !item) continue;

        const globalIndex =
            indices && typeof indices[k] === "number" ? indices[k] : k;

        // Inhalt
        let img = slot.querySelector("img");
        if (!img) {
            img = document.createElement("img");
            slot.appendChild(img);
        }
        img.src = item.src || "";
        if (item.alt !== undefined) img.alt = item.alt || "";

        // Badge
        let badge = slot.querySelector(".thumb-badge");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "thumb-badge";
            badge.setAttribute("aria-hidden", "true");
            slot.insertBefore(badge, img);
        }
        badge.textContent = String(globalIndex + 1).padStart(2, "0");

        // Aktiv-Status
        const isActive =
            typeof window.thumbActiveIndex === "number"
                ? globalIndex === window.thumbActiveIndex
                : false;

        // Slot sichtbar
        slot.style.display = "";
        slot.classList.add("is-visible");

        // Badge-Farbe und Aktiv-UI
        if (isActive) {
            slot.classList.add("is-active", "is-disabled");
            slot.style.cursor = "default";
            slot.removeAttribute("tabindex");
            badge.classList.add("badge-active");
            badge.classList.remove("badge-neutral");
        } else {
            slot.classList.remove("is-disabled");
            slot.classList.toggle("is-active", false);
            slot.style.cursor = "pointer";
            slot.setAttribute("tabindex", "0");
            badge.classList.add("badge-neutral");
            badge.classList.remove("badge-active");
        }
    }

    // 3) Falls inline -> block
    const visibleNow = thumbs.filter((el) =>
        el?.classList.contains("is-visible")
    );
    if (
        visibleNow.length &&
        getComputedStyle(visibleNow[0]).display === "inline"
    ) {
        visibleNow.forEach((el) => {
            el.style.display = "block";
        });
    }
}
