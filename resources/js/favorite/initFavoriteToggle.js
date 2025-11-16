// resources/js/favorite/initFavoriteToggle.js

// Favoriten-Button initialisieren
export function initFavoriteToggle() {
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

// Auto-Init nach DOMContentLoaded, falls gewünscht
document.addEventListener("DOMContentLoaded", () => {
  initFavoriteToggle();
});
