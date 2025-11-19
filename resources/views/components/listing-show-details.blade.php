{{-- resources/views/components/listing-show-details.blade.php --}}

@props([
    'listingAttributes' => [],
    'imagesArray' => [],
    'accessorData' => [],
    'customerArray' => null,
    'redactSensitive' => true,
    'favoritesCount' => 0, // Neuer Parameter mit Standardwert 0
])

@php
    $thumbCount = is_countable($imagesArray ?? []) ? count($imagesArray) : 0;
    $firstImage = !empty($imagesArray) && isset($imagesArray[0]['image_path']) ? $imagesArray[0]['image_path'] : null;

    // Verkäufer ermitteln
    $seller = $customer ?? ($listing->customer ?? null);

    // Preis
    $rawPrice = $listing->preis ?? null;
    $hasPrice = is_numeric($rawPrice);
    $priceFormatted = $hasPrice ? number_format((float) $rawPrice, 2, ',', '.') . '€' : null;

    // Adresse
    $street = trim(($seller->strasse ?? '') . ' ' . ($seller->hausnummer ?? ''));
    $city = trim(($seller->plz ?? '') . ' ' . ($seller->ort ?? ''));

    // Name-Kürzung für Gäste
    $sellerName = $seller->name ?? '';
    $nameFirst = '';
    $nameLastInitial = '';
    if (!empty($sellerName)) {
        // Versuche, an Leerzeichen zu splitten: Vorname + Nachname
        $parts = preg_split('/\s+/', trim($sellerName));
        if ($parts && count($parts) > 0) {
            $nameFirst = $parts[0];
            // Nachname aus den restlichen Teilen, erster Buchstabe
            $last = count($parts) > 1 ? end($parts) : '';
            $nameLastInitial = !empty($last) ? mb_substr($last, 0, 1) . '.' : '';
        }
    }

    // Helper zum Erzeugen des Bildpfads
    $buildSrc = function ($path) {
        if (empty($path)) {
            return null;
        }
        return asset('storage/listings_images/' . ltrim($path, '/'));
    };
@endphp

<section class="listing-details">
    <div class="row-1">

        <div class="current-picture" data-images='@json(collect($imagesArray)->map(fn($img) => ['src' => asset('storage/listings_images/' . ($img['image_path'] ?? '')), 'alt' => '']))'
            data-chevron="{{ asset('images/chevron-right.svg') }}">
            @if ($firstImage)
                <img src="{{ asset('storage/listings_images/' . $firstImage) }}" alt="" />
            @else
                <img src="{{ asset('images/placeholder.jpg') }}" alt="Platzhalter" />
            @endif

            @if ($thumbCount > 1)
                <button type="button" class="cp-nav cp-nav-prev" aria-label="Vorheriges Bild">
                    <span class="cp-icon-mask" aria-hidden="true"
                        style="
                            background: currentColor;
                            width:16px;height:16px;display:block;
                            -webkit-mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
                            mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
                            transform: scaleX(-1);
                        ">
                    </span>
                </button>

                <button type="button" class="cp-nav cp-nav-next" aria-label="Nächstes Bild">
                    <span class="cp-icon-mask" aria-hidden="true"
                        style="
                            background: currentColor;
                            width:16px;height:16px;display:block;
                            -webkit-mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
                            mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
                        ">
                    </span>
                </button>
            @endif
        </div>

        @php
            $initialWindow = array_slice($imagesArray ?? [], 0, 3);
            $firstThree = array_slice($imagesArray ?? [], 0, 3);
            for ($i = count($firstThree); $i < 3; $i++) {
                $firstThree[] = ['image_path' => null];
            }
        @endphp

        <div class="thumb-pictures {{ $thumbCount > 3 ? 'is-scrollable' : '' }}" data-total="{{ $thumbCount }}"
            data-window-size="3">
            <div class="thumb-viewport">
                @foreach ($firstThree as $idx => $img)
                    @php
                        $src = $buildSrc($img['image_path'] ?? null);
                        $number = str_pad((string) ($idx + 1), 2, '0', STR_PAD_LEFT);
                    @endphp

                    <div class="thumb">
                        @if ($src)
                            <span class="thumb-badge" aria-hidden="true">{{ $number }}</span>
                            <img class="thumb-img" src="{{ $src }}" alt="">
                        @else
                            <span class="thumb-img thumb-placeholder" aria-hidden="true"></span>
                        @endif
                    </div>
                @endforeach

                <button type="button" class="thumb-scroll thumb-scroll-up" data-action="thumbs-scroll-up"
                    aria-label="Thumbnails nach oben scrollen">
                    <span class="thumb-scroll-ico" aria-hidden="true"></span>
                </button>
                <button type="button" class="thumb-scroll thumb-scroll-down" data-action="thumbs-scroll-down"
                    aria-label="Thumbnails nach unten scrollen">
                    <span class="thumb-scroll-ico" aria-hidden="true"></span>
                </button>
            </div>
        </div>

        @if ($seller)
            <div class="seller-informations">
                <div class="seller-information" role="region" aria-label="Verkäuferdetails">
                    {{-- Anbieter --}}
                    @if (!empty($seller->name))
                        <div class="si-row">
                            <span class="si-ico" aria-hidden="true">
                                <img src="{{ asset('images/profile.svg') }}" alt="" width="18"
                                    height="18" loading="lazy">
                            </span>
                            <div class="si-content">
                                <div class="si-label">Angeboten von:</div>

                                @auth
                                    <div class="si-value">{{ $seller->name }}</div>
                                @endauth

                                @guest
                                    <div class="si-value">
                                        {{-- Gäste: Vorname + Nachname initial --}}
                                        {{ $nameFirst }}
                                        @if ($nameLastInitial)
                                            {{ ' ' . $nameLastInitial }}
                                        @endif

                                    </div>
                                @endguest
                            </div>
                        </div>
                    @endif

                    {{-- Adresse --}}
                    <div class="si-row">
                        <span class="si-ico" aria-hidden="true">
                            <img src="{{ asset('images/location.svg') }}" alt="" width="18" height="18"
                                loading="lazy">
                        </span>
                        <div class="si-content">
                            <div class="si-label">Adresse:</div>

                            @auth
                                <div class="si-value">
                                    @if ($street)
                                        <div>{{ $street }}</div>
                                    @endif
                                    @if ($city)
                                        <div>{{ $city }}</div>
                                    @endif
                                </div>
                            @endauth

                            @guest
                                {{-- Gäste: Platzhalter + Hinweis --}}
                                <div class="si-value" aria-live="polite">
                                    <div style="display:flex;gap:.35rem;flex-direction:column;max-width:18rem;">
                                        <span
                                            style="display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,#e5e7eb,#f3f4f6,#e5e7eb);background-size:200% 100%;animation:plcshimmer 1.2s ease-in-out infinite;"></span>
                                        <span
                                            style="display:block;height:12px;width:70%;border-radius:6px;background:linear-gradient(90deg,#e5e7eb,#f3f4f6,#e5e7eb);background-size:200% 100%;animation:plcshimmer 1.2s ease-in-out infinite;"></span>
                                        <span
                                            style="display:inline-block;margin-top:.25rem;padding:.2rem .45rem;font-size:.75rem;line-height:1;border-radius:.35rem;background:#f4f4f5;color:#6b7280;">
                                            Melde dich an, um die genaue Adresse zu sehen
                                        </span>
                                    </div>
                                </div>
                                {{-- Keyframes inline einmalig definieren --}}
                                <style>
                                    @keyframes plcshimmer {
                                        0% {
                                            background-position: 200% 0;
                                        }

                                        100% {
                                            background-position: -200% 0;
                                        }
                                    }
                                </style>
                            @endguest
                        </div>
                    </div>

                    {{-- E-Mail (und optional Telefon) --}}
                    @if (!empty($seller->email) || !empty($seller->telefonnummer))
                        <div class="si-row">
                            <span class="si-ico" aria-hidden="true"></span>
                            <div class="si-content">
                                @auth
                                    @if (!empty($seller->email))
                                        <div class="si-value"><a
                                                href="mailto:{{ $seller->email }}">{{ $seller->email }}</a></div>
                                    @endif
                                    @if (!empty($seller->telefonnummer))
                                        <div class="si-value"><a
                                                href="tel:{{ preg_replace('/\s+/', '', $seller->telefonnummer) }}">{{ $seller->telefonnummer }}</a>
                                        </div>
                                    @endif
                                @endauth

                                @guest
                                    {{-- Gäste: verdeckt mit Platzhalter und Hinweis --}}
                                    <div class="si-value">
                                        <span
                                            style="display:inline-block;min-width:10rem;height:12px;border-radius:6px;background:linear-gradient(90deg,#e5e7eb,#f3f4f6,#e5e7eb);background-size:200% 100%;animation:plcshimmer 1.2s ease-in-out infinite;"></span>
                                        <span
                                            style="display:inline-block;margin-left:.5rem;padding:.2rem .45rem;font-size:.75rem;line-height:1;border-radius:.35rem;background:#f4f4f5;color:#6b7280;">
                                            Login erforderlich
                                        </span>
                                    </div>
                                @endguest
                            </div>
                        </div>
                    @endif

                    {{-- Preis --}}
                    @if ($hasPrice)
                        <div class="si-row si-price">
                            <span class="si-ico" aria-hidden="true">
                                <img src="{{ asset('images/euro.svg') }}" alt="" width="18" height="18"
                                    loading="lazy">
                            </span>
                            <div class="si-content">
                                <div class="si-label">Preis:</div>
                                <div class="si-value si-value-price">{{ $priceFormatted }}</div>
                            </div>
                        </div>
                    @endif
                </div>

                <div class="seller-action-buttons">

                    @if (Auth::check())
                        {{-- Favorit-Button für eingeloggte Benutzer --}}
                        @php
                            $isFavorite = Auth::user()->favorites()->where('listing_id', $listing->id)->exists();
                        @endphp
                        <button type="button"
                            class="btn btn-{{ $isFavorite ? 'danger' : 'outline-danger' }} js-fav-toggle btn-inline btn-sizing"
                            aria-label="{{ $isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen' }}"
                            aria-pressed="{{ $isFavorite ? 'true' : 'false' }}"
                            data-heart-url="{{ asset('images/heart.svg') }}"
                            data-heart-broken-url="{{ asset('images/heart-broken.svg') }}"
                            data-listing-id="{{ $listing->id }}" data-is-authenticated="true"
                            style="--btn-min-w: 8rem;">
                            <span class="js-fav-icon icon-mask" aria-hidden="true"
                                style="
                                    -webkit-mask-image: url('{{ asset($isFavorite ? 'images/heart-broken.svg' : 'images/heart.svg') }}');
                                    mask-image: url('{{ asset($isFavorite ? 'images/heart-broken.svg' : 'images/heart.svg') }}');
                                ">
                            </span>
                            <span class="js-fav-text">{{ $isFavorite ? 'Entfernen' : 'Favorit' }}</span>
                        </button>
                    @else
                        {{-- Login-Button für nicht eingeloggte Benutzer --}}
                        <a href="{{ route('login') }}"
                            class="btn btn-outline-danger btn-inline btn-sizing js-fav-toggle-login"
                            style="--btn-min-w: 8rem;">
                            <span class="icon-mask" aria-hidden="true"
                                style="
                                    -webkit-mask-image: url('{{ asset('images/heart.svg') }}');
                                    mask-image: url('{{ asset('images/heart.svg') }}');
                                ">
                            </span>
                            <span>Favorit</span>
                        </a>
                    @endif



                    {{-- Kontakt: für Gäste -> Login; für Auth -> Platzhalter-Action (später Ziel ergänzen) --}}
                    @guest
                        <a href="{{ route('login') }}" class="btn btn-primary btn-inline btn-sizing"
                            aria-label="Zum Login, um den Verkäufer zu kontaktieren"
                            style="--btn-min-w: 8rem; --btn-pad: .4rem .75rem; text-decoration:none; display:inline-flex; align-items:center; gap:.5rem;">
                            <span class="icon-mask-mail" aria-hidden="true"
                                style="
                                    width:1em;height:1em;display:inline-block;
                                    -webkit-mask-image: url('{{ asset('images/mail-send.svg') }}');
                                    mask-image: url('{{ asset('images/mail-send.svg') }}');
                                    background: currentColor;
                                "></span>
                            <span class="btn-text">Kontakt</span>
                        </a>
                    @endguest

                    @auth
                        <button type="button" class="btn btn-primary btn-inline btn-sizing"
                            aria-label="Verkäufer kontaktieren" style="--btn-min-w: 8rem; --btn-pad: .4rem .75rem;">
                            <span class="icon-mask-mail" aria-hidden="true"
                                style="
                                    -webkit-mask-image: url('{{ asset('images/mail-send.svg') }}');
                                    mask-image: url('{{ asset('images/mail-send.svg') }}');
                                "></span>
                            <span class="btn-text">Kontakt</span>
                        </button>
                    @endauth
                </div>
            </div>
        @endif
    </div>

    <div class="row-2">
        <h2 class="listing-title">{{ $listing->name }}</h2>

        <div class="listing-metas">
            <div class="meta-item meta-created">
                <span class="meta-ico" aria-hidden="true" role="img">
                    <img src="{{ asset('images/calender.svg') }}" alt="" width="16" height="16"
                        loading="lazy" />
                </span>
                @php
                    $createdRaw = $listing->created_at ?? null;
                    $created = $createdRaw ? \Carbon\Carbon::parse($createdRaw) : null;
                @endphp
                @if ($created)
                    <time datetime="{{ $created->toDateString() }}">
                        {{ $created->format('d.m.Y') }}
                    </time>
                @else
                    <span>—</span>
                @endif
            </div>

            <div class="meta-item meta-favorites">
                @include('partials.favorites-count', ['favoritesCount' => $favoritesCount])
            </div>

        </div>

        <div class="listing-description">{{ $listing->beschreibung }}</div>
    </div>
</section>
