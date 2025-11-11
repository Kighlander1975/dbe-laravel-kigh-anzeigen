<section class="listing-gallery" aria-label="Bildergalerie">
  <div class="listing-gallery__rail" aria-label="Thumbnails">
    <ul class="listing-thumbs" role="list">
      @forelse (($media ?? []) as $index => $item)
        <li class="listing-thumb" data-index="{{ $index }}">
          <a href="?image={{ $index }}"
             class="listing-thumb__link {{ ($current ?? 0) === $index ? 'is-active' : '' }}"
             aria-current="{{ ($current ?? 0) === $index ? 'true' : 'false' }}"
             aria-label="Bild {{ $index + 1 }} anzeigen">
            <img src="{{ $item['thumb_url'] ?? $item['url'] ?? '' }}"
                 alt="{{ $item['alt'] ?? ($heroAlt ?? '') }}"
                 loading="lazy" />
          </a>
        </li>
      @empty
        <li class="listing-thumb listing-thumb--placeholder">
          <x-ui.placeholder>Keine Bilder vorhanden</x-ui.placeholder>
        </li>
      @endforelse
    </ul>
  </div>

  <div class="listing-hero" aria-live="polite" aria-atomic="true">
    @php
      $hasMedia = !empty($media);
      $currentIndex = $current ?? 0;
      $currentItem = $hasMedia ? ($media[$currentIndex] ?? null) : null;
    @endphp

    @if ($currentItem)
      <figure class="listing-hero__figure">
        <img
          src="{{ $currentItem['url'] ?? '' }}"
          alt="{{ $currentItem['alt'] ?? ($heroAlt ?? '') }}"
          class="listing-hero__img"
          loading="eager" />
        @if (!empty($currentItem['caption']))
          <figcaption class="listing-hero__caption">{{ $currentItem['caption'] }}</figcaption>
        @endif
      </figure>
    @else
      <div class="listing-hero__placeholder">
        <x-ui.placeholder>Kein Bild verfügbar</x-ui.placeholder>
      </div>
    @endif

    @if (($media ?? []) && count($media) > 1)
      <nav class="listing-hero__controls" aria-label="Bildnavigation">
        <a class="btn-icon btn-icon--md btn-icon--outline-secondary listing-hero__prev"
           href="?image={{ max(0, ($current ?? 0) - 1) }}"
           aria-label="Vorheriges Bild">‹</a>
        <a class="btn-icon btn-icon--md btn-icon--outline-secondary listing-hero__next"
           href="?image={{ min(count($media)-1, ($current ?? 0) + 1) }}"
           aria-label="Nächstes Bild">›</a>
      </nav>
    @endif
  </div>
</section>
