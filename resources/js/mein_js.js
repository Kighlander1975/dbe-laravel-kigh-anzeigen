// resources/js/mein_js.js

// ===============================
// Favoriten-Button Logik
// ===============================
function initFavoriteToggle() {
  const favBtn = document.querySelector('.js-fav-toggle');
  if (!favBtn) return;

  const favIcon = favBtn.querySelector('.js-fav-icon');
  const favText = favBtn.querySelector('.js-fav-text');

  const HEART_URL = favBtn.getAttribute('data-heart-url');
  const HEART_BROKEN_URL = favBtn.getAttribute('data-heart-broken-url');

  const TEXT_OFF = 'Favorit';
  const TEXT_ON = 'Entfernen';

  let isFav = favBtn.getAttribute('aria-pressed') === 'true';

  function setMaskImage(el, url) {
    if (!el || !url) return;
    el.style.webkitMaskImage = `url('${url}')`;
    el.style.maskImage = `url('${url}')`;
  }

  function applyFavState() {
    favBtn.classList.toggle('btn-outline-danger', !isFav);
    favBtn.classList.toggle('btn-danger', isFav);

    setMaskImage(favIcon, isFav ? HEART_BROKEN_URL : HEART_URL);

    if (favText) favText.textContent = isFav ? TEXT_ON : TEXT_OFF;

    favBtn.setAttribute('aria-pressed', String(isFav));
    favBtn.setAttribute(
      'aria-label',
      isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'
    );
  }

  applyFavState();

  favBtn.addEventListener('click', () => {
    isFav = !isFav;
    applyFavState();
  });
}

// ===============================
// Galerie / Thumbnails Logik + Overlay-Navigation
// ===============================
function initGallery() {
  const currentWrap = document.querySelector('.current-picture');
  const currentImg = currentWrap?.querySelector('img');
  const thumbsWrap = document.querySelector('.thumb-pictures');
  const thumbs = Array.from(document.querySelectorAll('.thumb-picture'));
  const arrowUp = document.querySelector('.arrow-up');
  const arrowDown = document.querySelector('.arrow-down');

  if (!currentWrap || !currentImg || !thumbsWrap || thumbs.length === 0) return;

  // Hilfsfunktion: aktive Thumb markieren
  function setActiveThumb(el) {
    thumbs.forEach(t => t.classList.toggle('is-active', t === el));
    el.setAttribute('aria-current', 'true');
    thumbs.filter(t => t !== el).forEach(t => t.removeAttribute('aria-current'));
  }

  // Aktuellen Index aus dem aktuell gesetzten Bild ableiten
  function getCurrentIndex() {
    const src = currentImg.getAttribute('src');
    const idx = thumbs.findIndex(t => {
      const img = t.querySelector('img, picture > img');
      return img && (img.currentSrc === src || img.src === src || src?.endsWith(img.getAttribute('src') || ''));
    });
    return idx >= 0 ? idx : 0;
  }

  // Swap mit Fade und Preload
  let isTransitioning = false;
  function swapCurrentImage(newSrc, newAlt = '') {
    if (!newSrc || isTransitioning || currentImg.getAttribute('src') === newSrc) return;

    isTransitioning = true;
    currentImg.style.transition = 'opacity 160ms ease';
    currentImg.style.opacity = '0';

    const onFadeOut = () => {
      currentImg.removeEventListener('transitionend', onFadeOut);

      const tmp = new Image();
      tmp.onload = () => {
        currentImg.src = newSrc;
        if (newAlt) currentImg.alt = newAlt;

        // Reflow, dann einblenden
        void currentImg.offsetWidth;
        currentImg.style.opacity = '1';

        const onFadeIn = () => {
          currentImg.removeEventListener('transitionend', onFadeIn);
          isTransitioning = false;
        };
        currentImg.addEventListener('transitionend', onFadeIn, { once: true });
      };
      tmp.onerror = () => {
        currentImg.style.opacity = '1';
        isTransitioning = false;
      };
      tmp.src = newSrc;
    };

    currentImg.addEventListener('transitionend', onFadeOut, { once: true });
  }

  // Klick/Keyboard auf einzelnen Thumbs
  thumbs.forEach((thumb, i) => {
    const img = thumb.querySelector('img, picture > img');
    if (!img) return;

    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    if (!thumb.hasAttribute('aria-label')) {
      const idx = thumb.getAttribute('data-index') || String(i + 1).padStart(2, '0');
      thumb.setAttribute('aria-label', `Bild ${idx} anzeigen`);
    }

    function activateFromThumb() {
      const newSrc = img.currentSrc || img.src;
      const newAlt = img.alt || '';
      setActiveThumb(thumb);
      swapCurrentImage(newSrc, newAlt);
      thumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }

    thumb.addEventListener('click', activateFromThumb);
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateFromThumb();
      }
    });
  });

  // Default aktives Thumb setzen
  if (!thumbs.some(t => t.classList.contains('is-active'))) {
    setActiveThumb(thumbs[0]);
  }

  // Thumbs-Scroll Buttons (links: up/down für die Rails)
  function scrollThumbs(direction = 1) {
    const firstThumb = thumbs[0];
    const step = firstThumb ? firstThumb.getBoundingClientRect().height + 6 : 150;
    thumbsWrap.scrollBy({ top: step * direction, left: 0, behavior: 'smooth' });
  }
  arrowUp && arrowUp.addEventListener('click', () => scrollThumbs(-1));
  arrowDown && arrowDown.addEventListener('click', () => scrollThumbs(1));

  // ===============================
  // Overlay-Navigation für current-picture
  // ===============================
  if (thumbs.length > 1) {
    // Buttons suchen (von Blade gerendert) – falls fehlen, erzeugen wir sie
    let btnPrev = currentWrap.querySelector('.cp-nav-prev');
    let btnNext = currentWrap.querySelector('.cp-nav-next');

    if (!btnPrev || !btnNext) {
      // Optional: Chevron-URL aus data-Attr oder Fallback
      const chevronUrl = currentWrap.dataset.chevron || '/images/chevron-right.svg';

      btnPrev = document.createElement('button');
      btnPrev.type = 'button';
      btnPrev.className = 'cp-nav cp-nav-prev';
      btnPrev.setAttribute('aria-label', 'Vorheriges Bild');

      const spanPrev = document.createElement('span');
      spanPrev.className = 'cp-icon-mask';
      spanPrev.setAttribute('aria-hidden', 'true');
      spanPrev.style.webkitMask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
      spanPrev.style.mask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
      spanPrev.style.transform = 'scaleX(-1)';
      btnPrev.appendChild(spanPrev);

      btnNext = document.createElement('button');
      btnNext.type = 'button';
      btnNext.className = 'cp-nav cp-nav-next';
      btnNext.setAttribute('aria-label', 'Nächstes Bild');

      const spanNext = document.createElement('span');
      spanNext.className = 'cp-icon-mask';
      spanNext.setAttribute('aria-hidden', 'true');
      spanNext.style.webkitMask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
      spanNext.style.mask = `url('${chevronUrl}') center / 16px 16px no-repeat`;
      btnNext.appendChild(spanNext);

      currentWrap.appendChild(btnPrev);
      currentWrap.appendChild(btnNext);
    }

    // Hilfsnavigation: vor/zurück relativ zum aktuellen Index
    function goRelative(delta) {
      if (isTransitioning) return;

      const currentIndex = getCurrentIndex();
      const nextIndex = (currentIndex + delta + thumbs.length) % thumbs.length;
      const targetThumb = thumbs[nextIndex];
      const img = targetThumb.querySelector('img, picture > img');
      if (!img) return;

      const newSrc = img.currentSrc || img.src;
      const newAlt = img.alt || '';

      setActiveThumb(targetThumb);
      swapCurrentImage(newSrc, newAlt);

      // Thumbnails in Sicht halten
      targetThumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }

    btnPrev.addEventListener('click', () => goRelative(-1));
    btnNext.addEventListener('click', () => goRelative(1));

    // Tastatursteuerung: Links/Rechts wechseln
    document.addEventListener('keydown', (e) => {
      // Nur reagieren, wenn keine Eingabelemente aktiv sind
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || e.isComposing;
      if (isTyping) return;

      // Fokus-Kontext: innerhalb der Galerie
      const withinGallery =
        currentWrap.contains(document.activeElement) ||
        thumbsWrap.contains(document.activeElement) ||
        document.activeElement === document.body;
      if (!withinGallery) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goRelative(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goRelative(1);
      }
    }, { passive: false });
  }
}

// ===============================
// Bootstrap: beide Module starten
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  initFavoriteToggle();
  initGallery();
});
