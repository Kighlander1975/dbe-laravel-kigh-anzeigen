{{-- resources/views/listings/components/listing-form.blade.php --}}
@php
    // Defaults setzen
    $method = $method ?? 'POST';
    $listing = $listing ?? null;
    $showImagesInfo = $showImagesInfo ?? false;
    $submitLabel = $submitLabel ?? 'Speichern';

    // Für Edit: Bildanzahl vorbereiten
    $imagesCount = $showImagesInfo && $listing ? $listing->images->count() : null;
@endphp

<form action="{{ $action }}" method="POST"
    @isset($enctype) enctype="{{ $enctype }}" @endisset>
    @csrf
    @if (strtoupper($method) === 'PUT' || strtoupper($method) === 'PATCH')
        @method($method)
    @endif

    <div class="listing-edit-container">
        <div class="listing-edit-headline">
            <img src="{{ asset('images/pen.svg') }}" alt="Edit-Symbol Stift" />
            <h1>
                {{ $listing ? 'Listing bearbeiten' : 'Listing erstellen' }}
                @if ($showImagesInfo)
                    @if ($imagesCount === 0)
                        <span>Keine Bilder</span>
                    @elseif (!is_null($imagesCount))
                        <span>{{ $imagesCount }} Bild(er)</span>
                    @endif
                @endif
            </h1>
        </div>

        <div class="listing-edit-inputs">
            {{-- Titel --}}
            <div class="row">
                <label for="name">Titel:</label>
                <input id="name" type="text" name="name" value="{{ old('name', $listing->name ?? '') }}">
            </div>

            {{-- Kategorie --}}
            <div class="row">
                <label for="category_id">Kategorie:</label>
                <div class="select-wrapper">
                    <select name="category_id" id="category_id" @if (!empty($requiredCategory)) required @endif>
                        @unless ($listing)
                            {{-- Bei Create eine Placeholder-Option --}}
                            <option value="">Kategorie wählen</option>
                        @endunless
                        @foreach ($categories as $category)
                            <option value="{{ $category->id }}" @selected(old('category_id', $listing->category_id ?? '') == $category->id)>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
            </div>

            {{-- Preis --}}
            <div class="row">
                <label for="preis">Preis:</label>
                <div class="price-wrapper">
                    <input id="preis" type="number" step="0.01" min="0.01" name="preis"
                        value="{{ old('preis', $listing->preis ?? '') }}">
                </div>
            </div>

            {{-- Beschreibung --}}
            <div class="row beschreibung-row">
                <label for="beschreibung">Beschreibung:</label>
                <textarea id="beschreibung" name="beschreibung">{{ old('beschreibung', $listing->beschreibung ?? '') }}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="--btn-radius: 22px; --btn-pad: .75rem .5rem;">
                <strong>{{ $submitLabel }}</strong>
            </button>
        </div>
        <a class="btn btn-outline-primary" style="text-align: center;" href="{{ route('profile') }}">Zurück zur Übersicht</a>
    </div>
</form>
