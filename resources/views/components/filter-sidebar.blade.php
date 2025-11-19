@props(['categories', 'locations', 'locationCounts', 'categoryCounts'])

<div class="filter-sidebar">
    <form action="{{ route('home') }}" method="GET">
        <!-- Kategorien -->
        <h3>Kategorien</h3>
        @foreach ($categories as $category)
            <label class="category-label">
                <span class="category-left">
                    <input type="radio" name="category" value="{{ $category->id }}"
                        {{ request('category') == $category->id ? 'checked' : '' }}>
                    <span class="category-name">{{ $category->name }}</span>
                </span>
                <span class="category-dots"></span>
                <span class="category-count">({{ $categoryCounts[$category->id] ?? 0 }})</span>
            </label>
        @endforeach
        <hr />

        <!-- Standort -->
        <h3>Orte</h3>
        @foreach ($locations as $location)
            <label class="category-label">
                <span class="category-left">
                    <input type="radio" name="location" value="{{ $location }}"
                        {{ request('location') == $location ? 'checked' : '' }}>
                    <span class="category-name">{{ $location }}</span>
                </span>
                <span class="category-dots"></span>
                <span class="category-count">({{ $locationCounts[$location] ?? 0 }})</span>
            </label>
        @endforeach
        <hr />

        <!-- Preisbereich -->
        <h3>Preise</h3>
        <div class="price-filter">
            <!-- Radio-Button Optionen -->
            <div class="price-options">
                <label class="price-label">
                    <input type="radio" name="price_range" value="0-20"
                        {{ request('price_range') == '0-20' ? 'checked' : '' }}>
                    <span>0€ - 20€</span>
                </label>
                <label class="price-label">
                    <input type="radio" name="price_range" value="20-50"
                        {{ request('price_range') == '20-50' ? 'checked' : '' }}>
                    <span>20€ - 50€</span>
                </label>
                <label class="price-label">
                    <input type="radio" name="price_range" value="50-200"
                        {{ request('price_range') == '50-200' ? 'checked' : '' }}>
                    <span>50€ - 200€</span>
                </label>
                <label class="price-label">
                    <input type="radio" name="price_range" value="200+"
                        {{ request('price_range') == '200+' ? 'checked' : '' }}>
                    <span>200€+</span>
                </label>
            </div>

            <!-- Min-Max Eingabe -->
            <div class="price-range-inputs">
                <input type="number" name="min_price" placeholder="Min" value="{{ request('min_price') }}"
                    class="price-input">
                <span class="price-separator">bis</span>
                <input type="number" name="max_price" placeholder="Max" value="{{ request('max_price') }}"
                    class="price-input">
            </div>
        </div>
        <hr class="last" />

        <!-- Filter-Button -->
        <div style="width: 60%; margin: 0 auto;">
            <button class="btn btn-danger" style="--btn-min-w: 7rem; --btn-pad: .75rem .5rem"
                type="submit">Filtern</button>
            <a class="btn btn-outline-secondary" style="--btn-min-w: 7rem;text-align:center"
                href="{{ route('home') }}">Filter löschen</a>
        </div>
    </form>
</div>
