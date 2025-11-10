<a href="{{ route('listings.show', $listing->id) }}" class="listing-card-link">
    <div class="listing-card">
        <div class="listing-card-image">
            <img src="https://dummyimage.com/600x400/ace/0011ff" alt="" />
        </div>
        <div class="listing-card-header">
            <h2>{{ $listing->name }}</h2>
        </div>
        <div class="listing-card-body">
            <div class="listing-ort">
                <img src="{{ asset('images/location.svg') }}" alt="Artikelstandort" /> 
                <p>irgendwo</p>
            </div>
            <div class="listing-price">
                {{ number_format($listing->preis, 2) }}€
            </div>
        </div>
    </div>
</a>
