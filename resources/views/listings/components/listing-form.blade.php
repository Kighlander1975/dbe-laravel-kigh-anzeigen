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

<form action="{{ $action }}" id="listing-form" method="POST"
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

            {{-- Neuer Abschnitt: Medien (Full-Width) --}}
            <div class="listing-section">
                <h2 class="section-title">Medien</h2>

                <div class="upload-head">
                    <strong>Dateien hochladen</strong>
                    <span class="upload-count">
                        (@if (!is_null($imagesCount))
                            {{ $imagesCount }}
                        @else
                            0
                        @endif/10 vorhanden)
                    </span>
                </div>

                <div class="dropzone"
                    @isset($listing)
                        data-existing-url="{{ route('listings.images.index', $listing->id) }}"
                        data-delete-url="{{ route('listings.images.delete', ['listing' => $listing->id, 'image' => ':id']) }}"
                        data-restore-url="{{ route('listings.images.restore', ['listing' => $listing->id, 'image' => ':id']) }}"
                        data-sort-url="{{ route('listings.images.sort', $listing->id) }}"
                        data-upload-url="{{ route('listings.images.upload', $listing->id) }}"
                    @endisset>
                    <input type="file" name="images[]" id="images" multiple
                        accept="image/jpeg,image/png,image/webp" class="visually-hidden">
                    <button type="button" class="btn btn-outline-primary select-files"
                        onclick="document.getElementById('images').click()">
                        Dateien auswählen
                    </button>
                    <span class="dropzone-hint">… oder hierher ziehen</span>
                </div>

                <!-- Hier die aria-live Region einfügen -->
                <div class="upload-aria-live initial" aria-live="polite" role="status">Alles OK</div>

                <div class="upload-block fw">
                    <div class="file-tags" id="file-tags"></div>
                </div>

                {{-- Optional sichtbar nur bei EDIT (wenn Daten vorhanden sind) --}}
                <div class="existing-images" id="existing-images"></div>

                <div class="upload-legend">
                    <small>Erlaubt: JPG, PNG, WEBP. Max. 10 Dateien, je bis 2 MB.</small>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="--btn-radius: 22px; --btn-pad: .75rem .5rem;">
                <strong>{{ $submitLabel }}</strong>
            </button>
        </div>
        <a class="btn btn-outline-primary" style="text-align: center;" href="{{ route('profile') }}">Zurück zur
            Übersicht</a>
    </div>
</form>
