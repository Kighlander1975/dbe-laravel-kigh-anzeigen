// resources/js/favorite/initFavoriteToggle.js

// Favoriten-Button initialisieren
export function initFavoriteToggle() {
    // Für eingeloggte Benutzer
    const favBtn = document.querySelector(".js-fav-toggle");
    if (favBtn) {
        const favIcon = favBtn.querySelector(".js-fav-icon");
        const favText = favBtn.querySelector(".js-fav-text");
        const HEART_URL = favBtn.getAttribute("data-heart-url");
        const HEART_BROKEN_URL = favBtn.getAttribute("data-heart-broken-url");
        const TEXT_OFF = "Favorit";
        const TEXT_ON = "Entfernen";
        const listingId = favBtn.getAttribute("data-listing-id");
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");
        let isFav = favBtn.getAttribute("aria-pressed") === "true";

        // Element für die Favoriten-Anzahl finden
        const favCountElement = document.querySelector(".meta-favorites");

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

        const toggleFavorite = async () => {
            try {
                // Button-Status während des Ladens deaktivieren
                favBtn.disabled = true;

                // API-Anfrage senden
                const response = await fetch(
                    `/listings/${listingId}/favorite`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                            Accept: "application/json",
                        },
                        credentials: "same-origin",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Fehler beim Aktualisieren des Favoriten-Status"
                    );
                }

                // JSON-Antwort verarbeiten
                const data = await response.json();

                // Erfolgreiche Anfrage - Status umschalten
                isFav = data.isFavorited;
                applyFavState();
                
                // Aktualisiere die Favoriten-Anzahl mit dem Wert vom Server
                if (favCountElement && data.favoritesCount !== undefined) {
                    favCountElement.innerHTML = data.favoritesHtml;
                }
            } catch (error) {
                console.error("Fehler:", error);
                // Optional: Benutzer über Fehler informieren
                // alert('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
            } finally {
                // Button wieder aktivieren
                favBtn.disabled = false;
            }
        };

        applyFavState();
        favBtn.addEventListener("click", (e) => {
            e.preventDefault();
            toggleFavorite();
        });
    }

    // Für nicht eingeloggte Benutzer - hier passiert nichts Besonderes,
    // da der Link bereits direkt zur Login-Seite führt
    const loginBtn = document.querySelector(".js-fav-toggle-login");
    if (loginBtn) {
        // Optional: Hier könntest du zusätzliche Funktionalität hinzufügen,
        // z.B. die aktuelle URL als Rücksprung-URL speichern
    }
}

// Auto-Init nach DOMContentLoaded, falls gewünscht
document.addEventListener("DOMContentLoaded", () => {
    initFavoriteToggle();
});
