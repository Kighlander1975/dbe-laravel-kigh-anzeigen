<a href="{{ route('listings.show', $listing->id) }}" class="listing-card-link">
    <article class="listing-card">
        <div class="listing-card-image">
            <img src="{{ $listing->first_image_url }}" alt="{{ $listing->name }}" />
        </div>
        <header class="listing-card-header">
            <h2>{{ $listing->name }}</h2>
        </header>
        <div class="listing-card-body">
            <div class="listing-count-fav">
                <x-favorites-count :listing="$listing" />
            </div>
            <div class="listing-ort">
                <img src="{{ asset('images/location.svg') }}" alt="Artikelstandort" />
                <p>{{ $listing->customer->ort }}</p>
            </div>
            <div class="listing-price">
                {{ number_format($listing->preis, 2) }}€
            </div>
        </div>
    </article>
</a>
