<div>
    <h2><a href="{{ route('listings.show', $listing->id) }}">{{ $listing->name }}</a></h2>
    @php
        $firstImage = $listing->images->first();
    @endphp

    <img src="{{ $firstImage ? asset('storage/listing_images/' . $firstImage->image_path) : asset('images/placeholder.jpg') }}"
        alt="{{ $listing->name }}" width="400" />
    <p>{{ $listing->beschreibung }}</p>
    <p>Preis: {{ number_format($listing->preis, 2) }} €</p>
    <a href="{{ route('listings.edit', $listing->id) }}">Bearbeiten</a>
    <form action="{{ route('listings.destroy', $listing->id) }}" method="POST">
        @csrf
        @method('DELETE')
        <button type="submit">Löschen</button>
    </form>
</div>
