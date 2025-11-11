<section class="listing-sidebar">
  <header class="listing-sidebar__header">
    <x-ui.price :value="$listing->price ?? null" :currency="$listing->currency ?? 'EUR'" />
    @if (!empty($listing->badge))
      <x-ui.badge>{{ $listing->badge }}</x-ui.badge>
    @endif
  </header>

  <div class="listing-sidebar__actions" role="group" aria-label="Aktionen">
    @php $favActive = ($isFavorited ?? false); @endphp
    <button
      class="btn btn-outline-primary listing-sidebar__fav {{ $favActive ? 'is-active' : '' }}"
      type="button"
      aria-pressed="{{ $favActive ? 'true' : 'false' }}"
      data-wsize="8rem">
      Favorit
    </button>

    @if(!empty($contactUrl))
      <a class="btn btn-primary listing-sidebar__contact" href="{{ $contactUrl }}" data-wsize="10rem">
        Kontakt
      </a>
    @endif>
  </div>

  <dl class="listing-sidebar__facts">
    @if(!empty($listing->location))
      <div class="listing-sidebar__fact">
        <dt>Ort</dt><dd>{{ $listing->location }}</dd>
      </div>
    @endif
    @if(!empty($listing->category))
      <div class="listing-sidebar__fact">
        <dt>Kategorie</dt><dd>{{ $listing->category }}</dd>
      </div>
    @endif
    <!-- Weitere Key-Value-Facts hier -->
  </dl>
</section>
