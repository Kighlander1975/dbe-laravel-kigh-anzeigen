// resources/js/app.js

// === Globale Schalter ===
// 1) Harteinstellung per Code:
const SUBMIT_ENABLED = true; // true = Button/Form "scharf", false = gemutet

// 2) Optionaler ENV-Fallback (Vite):
//    Setze in .env(.local): VITE_SUBMIT_ENABLED=true|false
const ENV_SUBMIT_ENABLED = (() => {
  const raw = import.meta?.env?.VITE_SUBMIT_ENABLED;
  if (raw === undefined || raw === null) return undefined;
  // Erlaubt: true/false/"true"/"false"/"1"/"0"
  if (typeof raw === "boolean") return raw;
  const s = String(raw).toLowerCase().trim();
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return undefined; // unbekannter Wert -> ignoriere
})();

// 3) Effektive Einstellung (ENV überschreibt harte Einstellung, wenn gültig)
const EFFECTIVE_SUBMIT_ENABLED = ENV_SUBMIT_ENABLED ?? SUBMIT_ENABLED;

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
import { initFileUpload } from "./fileUpload/fileUpload";

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
window.initFileUpload = initFileUpload;

function boot() {
    initThumbs({ step: 1 });
    try {
        ensureThumbVisible(0);
    } catch (e) {
        console.warn("[app] ensureThumbVisible init failed:", e);
    }
    try {
        const dropzone = document.querySelector(".dropzone");
        const input = document.querySelector("#images");
        const tags = document.querySelector("#file-tags");
        if (dropzone && input && tags) {
            initFileUpload();
        }
    } catch (e) {
        console.warn("[app] initFileUpload failed:", e);
    }

    // --- Zentrale Mute-Logik für Form/Button ---
    // Wenn EFFECTIVE_SUBMIT_ENABLED = false, muten wir Submit & Button-Klicks.
    // Gilt in DEV und PROD identisch, steuerbar per Flag.
    if (!EFFECTIVE_SUBMIT_ENABLED) {
        const form = document.querySelector("#listing-form") || document.querySelector("form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const data = new FormData(form);

                const filesCount =
                    (data.getAll("images[]")?.length ?? 0) ||
                    (data.getAll("images")?.length ?? 0);

                console.info("[SUBMIT MUTE] Kein Request gesendet – Submit ist deaktiviert.");
                console.info("[SUBMIT MUTE] Form-Action:", form.getAttribute("action") || "(kein action-Attribut)");
                console.info("[SUBMIT MUTE] Dateien (images):", filesCount);

                const name = data.get("name");
                const categoryId = data.get("category_id");
                const preis = data.get("preis");
                const beschreibung = data.get("beschreibung");
                console.info("[SUBMIT MUTE] name:", name, "| category_id:", categoryId, "| preis:", preis, "| beschreibung:", (beschreibung || "").slice(0, 80));

                const order = data.get("order") || data.get("file_order") || "";
                if (order) {
                    console.info("[SUBMIT MUTE] file_order:", order);
                }
            });
        }

        const actionBtn = document.querySelector("form#listing-form button[type='submit'], form button[type='submit']");
        if (actionBtn) {
            actionBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.info("[SUBMIT MUTE] Action-Button geklickt – Request absichtlich NICHT gesendet.");
            });
        }

        // Optional: Visuelles Disabled setzen (ohne HTML-Attribut zu ändern)
        // Entfernen, falls unerwünscht.
        const btns = document.querySelectorAll("form button[type='submit']");
        btns.forEach((btn) => {
            btn.dataset.submitMuted = "true";
            btn.style.opacity = "0.7";
            btn.style.cursor = "not-allowed";
            btn.title = "Submit ist aktuell deaktiviert";
        });
    } else {
        // Falls zuvor Styles gesetzt wurden, zurücksetzen (idempotent bei mehrfachen Inits)
        const btns = document.querySelectorAll("form button[type='submit'][data-submit-muted='true']");
        btns.forEach((btn) => {
            btn.style.opacity = "";
            btn.style.cursor = "";
            btn.title = "";
            delete btn.dataset.submitMuted;
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}

// Optionales Log zur Kontrolle
console.log(`[app] app.js loaded | submitEnabled=${EFFECTIVE_SUBMIT_ENABLED} | env=${import.meta.env.MODE}`);