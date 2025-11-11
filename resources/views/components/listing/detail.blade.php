<div class="listing-detail" data-listing-id="{{ $listing->id ?? '' }}">
    <nav class="listing-detail__nav">
        <!-- Zurück-Link folgt in Schritt 3 -->
        <a href="{{ $returnUrl ?? url()->previous() }}" class="btn btn-outline-info listing-detail__back"
            aria-label="Zurück zur Übersicht">
            ← Zurück
        </a>

    </nav>

    <section class="listing-detail__top" aria-label="Listing Medien und Aktionen">
        <div class="listing-detail__gallery">
            <x-listing.gallery :media="$media ?? []" :current="$initialImage ?? 0" :heroAlt="$listing->title ?? null" />
        </div>

        <aside class="listing-detail__sidebar" aria-label="Angebotsinformationen">
            <x-listing.sidebar :listing="$listing" :isFavorited="$isFavorited ?? false" :contactUrl="$contactUrl ?? null" />
        </aside>
    </section>

    <section class="listing-detail__bottom" aria-label="Titel und Beschreibung">
        <header class="listing-detail__meta">
            <x-listing.meta :title="$listing->title ?? ''" :createdAt="$listing->created_at ?? null" :favoritesCount="$favoritesCount ?? 0" :interestedCount="$interestedCount ?? 0" />
        </header>

        <article class="listing-detail__description">
            <x-listing.description :html="$listing->description_html ?? ''" />
        </article>
    </section>
</div>
